// Cmd+K palette — PRD § 6.4 (hard requirement).
//
// Tiny home-grown implementation: no dialog library, no lucide bloat.
// The contract is just a list of commands and a keystroke that opens it.
// Commands are registered statically here (one place); future branches
// add entries (start mock, open last lesson, jump to mistake review,
// toggle theme palette, …) by appending to COMMANDS.
//
// Keyboard: Cmd+K / Ctrl+K opens; Esc closes; ↑↓ navigates; Enter selects.
//   ↑↓ wrap around at the ends — typing keeps the highlight valid by
//   clamping into [0, filtered.length).

import { useNavigate } from '@tanstack/react-router'
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { copyDebugSnapshot } from '@/lib/debugSnapshot'
import { isDevSurface } from '@/lib/devSurface'
import { Mono } from './primitives'

type Command = {
  id: string
  /** Visible label (Swedish, product copy). */
  label: string
  /** Optional secondary label, e.g. section + duration. */
  hint?: string
  /** Substrings the matcher considers in addition to label. */
  keywords?: string[]
  action: (ctx: CommandContext) => void
}

type CommandContext = {
  navigate: ReturnType<typeof useNavigate>
}

const COMMANDS: Command[] = [
  {
    id: 'drill-ord',
    label: 'Starta ORD-övning',
    hint: '10 synonymfrågor · ~3 min',
    keywords: ['drill', 'övning', 'ord', 'synonym'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'ORD' } }),
  },
  {
    id: 'drill-las',
    label: 'Starta LÄS-övning',
    hint: '10 läsförståelsefrågor · ~10 min',
    keywords: ['drill', 'övning', 'läs', 'lasa', 'svensk', 'reading'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'LÄS' } }),
  },
  {
    id: 'drill-mek',
    label: 'Starta MEK-övning',
    hint: '10 meningskompletteringar · ~3 min',
    keywords: ['drill', 'övning', 'mek', 'mening', 'komplettering'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'MEK' } }),
  },
  {
    id: 'drill-elf',
    label: 'Starta ELF-övning',
    hint: '10 English reading questions · ~10 min',
    keywords: ['drill', 'övning', 'elf', 'english', 'engelsk', 'reading'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'ELF' } }),
  },
  {
    id: 'drill-xyz',
    label: 'Starta XYZ-övning',
    hint: '10 algebrafrågor · ~8 min',
    keywords: ['drill', 'övning', 'xyz', 'matematik', 'algebra', 'math'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'XYZ' } }),
  },
  {
    id: 'drill-kva',
    label: 'Starta KVA-övning',
    hint: '10 kvantitativa jämförelser · ~6 min',
    keywords: ['drill', 'övning', 'kva', 'jämförelse', 'comparison'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'KVA' } }),
  },
  {
    id: 'drill-nog',
    label: 'Starta NOG-övning',
    hint: '10 frågor om kvantitativa resonemang · ~12 min',
    keywords: ['drill', 'övning', 'nog', 'resonemang', 'sufficiency'],
    action: ({ navigate }) => navigate({ to: '/drill', search: { section: 'NOG' } }),
  },
  {
    id: 'ova',
    label: 'Öva',
    hint: 'Övningshubben — drilla eller repetera',
    keywords: ['öva', 'ova', 'drill', 'övning', 'hub', 'repetera'],
    action: ({ navigate }) => navigate({ to: '/ova' }),
  },
  {
    id: 'repetition',
    label: 'Repetition (missar)',
    hint: 'Repetera fel svar',
    keywords: ['repetition', 'missar', 'fel', 'review', 'replay'],
    action: ({ navigate }) => navigate({ to: '/repetition' }),
  },
  {
    id: 'provpass',
    label: 'Starta provpass',
    hint: '40 frågor · 55 minuter · riktiga provvillkor',
    keywords: ['provpass', 'mock', 'prov', 'exam', 'tenta'],
    action: ({ navigate }) => navigate({ to: '/prov' }),
  },
  {
    id: 'uppslag',
    label: 'Uppslag',
    hint: 'Bläddra alla sektioner',
    keywords: ['uppslag', 'lektion', 'lesson', 'framework', 'ramverk', 'mönster', 'referens'],
    action: ({ navigate }) => navigate({ to: '/lektion' }),
  },
  {
    id: 'uppslag-nog',
    label: 'Uppslag · NOG',
    hint: '25 mönster · datasufficiens',
    keywords: ['uppslag', 'lektion', 'lesson', 'nog', 'datasufficiens', 'sufficiency'],
    action: ({ navigate }) => navigate({ to: '/lektion', search: { section: 'NOG' } }),
  },
  {
    id: 'home',
    label: 'Hem',
    keywords: ['hem', 'home'],
    action: ({ navigate }) => navigate({ to: '/' }),
  },
  {
    id: 'progress',
    label: 'Framsteg',
    keywords: ['progress', 'framsteg', 'statistik'],
    action: ({ navigate }) => navigate({ to: '/progress' }),
  },
  {
    id: 'coach',
    label: 'Feedback',
    hint: 'Exportera flaggade frågor (dogfood)',
    keywords: ['feedback', 'coach', 'export', 'dogfood', 'flagga'],
    action: ({ navigate }) => navigate({ to: '/coach' }),
  },
  {
    id: 'support',
    label: 'Hjälp & support',
    hint: 'en person, inte ett team',
    keywords: ['hjälp', 'support', 'kontakt', 'mejl', 'email', 'help', 'bugg'],
    action: ({ navigate }) => navigate({ to: '/hjalp' }),
  },
  {
    id: 'tweaks',
    label: 'Öppna tweaks (tema, font)',
    keywords: ['tema', 'palette', 'font', 'tweaks', 'theme'],
    action: ({ navigate }) => navigate({ to: '/avancerat' }),
  },
  {
    id: 'dev',
    label: 'Dev panel',
    hint: '/dev',
    keywords: ['dev', 'debug', 'panel', 'tweaks'],
    action: ({ navigate }) => navigate({ to: '/dev' }),
  },
  {
    id: 'share-debug',
    label: 'Kopiera felsökningssnapshot',
    hint: 'skärmens tillstånd → urklipp, klistra in i chatten',
    keywords: ['share', 'debug', 'snapshot', 'felsökning', 'urklipp', 'kopiera'],
    action: () => void copyDebugSnapshot(),
  },
]

// IDs that surface only when isDevSurface() returns true (dogfood
// B10). The former floating pills (TweaksLauncher, ShareDebugButton)
// are gone — owner call 2026-07-12: they occluded page content; the
// palette is the one home for dev affordances now.
const DEV_ONLY_COMMAND_IDS = new Set(['dev', 'share-debug'])

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // Cmd+K / Ctrl+K toggles the palette globally.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const isPaletteShortcut = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (isPaletteShortcut) {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape' && open) {
        e.preventDefault()
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Reset query + highlight whenever we open. Focus the input on next tick.
  useEffect(() => {
    if (open) {
      setQuery('')
      setHighlight(0)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  // Hide dev-only commands ("Dev panel") in pure production sessions.
  // `isDevSurface()` reads runtime state (URL + sessionStorage), so we
  // pin it via the `open` boolean — re-read every time the palette
  // opens. That catches a `?dev=1` opt-in that happened mid-session
  // (sessionStorage now has the flag) without forcing a remount.
  // Memo depends on `query` for search + on `dev` for the flag, both
  // tracked as values rather than via direct call-in-deps.
  const dev = open && isDevSurface()
  const filtered = useMemo(() => {
    const visible = dev ? COMMANDS : COMMANDS.filter((cmd) => !DEV_ONLY_COMMAND_IDS.has(cmd.id))
    const q = query.trim().toLowerCase()
    if (!q) return visible
    return visible.filter((cmd) => {
      const haystack = [cmd.label, cmd.hint ?? '', ...(cmd.keywords ?? [])].join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [query, dev])

  // Keep the highlight inside [0, filtered.length).
  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)))
  }, [filtered.length])

  const close = useCallback(() => setOpen(false), [])
  const run = useCallback(
    (cmd: Command) => {
      close()
      cmd.action({ navigate })
    },
    [close, navigate],
  )

  const onInputKey = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => (h + 1) % Math.max(1, filtered.length))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => (h - 1 + filtered.length) % Math.max(1, filtered.length))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const cmd = filtered[highlight]
        if (cmd) run(cmd)
      }
    },
    [filtered, highlight, run],
  )

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kommandopalett"
      data-testid="cmdk"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 'min(15vh, 120px)',
      }}
    >
      {/* Backdrop — separate <button> so the close affordance is keyboard-
          accessible without a static-element click handler. */}
      <button
        type="button"
        aria-label="Stäng kommandopalett"
        onClick={close}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          border: 'none',
          padding: 0,
          cursor: 'default',
        }}
      />
      <div
        style={{
          position: 'relative',
          width: 'min(560px, calc(100vw - 32px))',
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius)',
          boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid var(--hairline)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            aria-label="Sök kommandon"
            placeholder="Sök kommandon…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            data-testid="cmdk-input"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-display)',
              fontSize: 18,
              color: 'var(--ink)',
              letterSpacing: '-0.005em',
            }}
          />
        </div>
        <div style={{ overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '20px 16px',
                color: 'var(--muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
              }}
            >
              Inga träffar.
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                type="button"
                onClick={() => run(cmd)}
                onMouseEnter={() => setHighlight(i)}
                data-testid={`cmdk-item-${cmd.id}`}
                data-highlighted={i === highlight ? 'true' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '12px 16px',
                  background: i === highlight ? 'var(--panel-2)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--hairline)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  color: 'var(--ink)',
                }}
              >
                <span style={{ fontSize: 15 }}>{cmd.label}</span>
                {cmd.hint && <Mono style={{ marginLeft: 12 }}>{cmd.hint}</Mono>}
              </button>
            ))
          )}
        </div>
        <div
          style={{
            padding: '8px 14px',
            borderTop: '1px solid var(--hairline)',
            background: 'var(--panel-2)',
            display: 'flex',
            gap: 14,
          }}
        >
          <Mono>↑↓ navigera</Mono>
          <Mono>↵ välj</Mono>
          <Mono>esc stäng</Mono>
        </div>
      </div>
    </div>
  )
}
