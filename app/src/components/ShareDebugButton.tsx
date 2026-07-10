// Dev-only "share debug snapshot" button — sibling of TweaksLauncher.
//
// Use case: the user sees something visibly wrong on a question (font,
// glyph, layout) and instead of describing it from memory, they hit this
// button. We grab a structured snapshot of what's actually on screen
// (route, current question if any, UI prefs, viewport, computed fonts
// on every tracked element, font-load state, codepoint dump of the
// prompt) and write it to the clipboard as a markdown report. The user
// pastes it back to me as a single message, no screenshot drudgery.
//
// Visibility: same gate as TweaksLauncher — `import.meta.env.DEV` or
// `?dev=1` flag, sticky via sessionStorage. Hidden in pure prod builds.
//
// Why not use the chrome-devtools console / right-click? Because
// gathering all the relevant signals manually each time is tedious,
// and a one-click capture lets us catch transient state (the screen at
// the moment the bug appears) before it changes via a route transition
// or a Clerk re-auth.

import { useRouterState } from '@tanstack/react-router'
import { useState } from 'react'

import { useViewport } from '@/hooks/useViewport'
import { isDevSurface } from '@/lib/devSurface'
import { useCoachStore } from '@/stores/coachStore'
import { useUiStore } from '@/stores/uiStore'

// Elements we track for font/style audit. Each is a data-testid that
// renders content the user might point at as "looks wrong." Order
// matters — the snapshot lists them in this order.
const TRACKED_TESTIDS = [
  'drill-context', // LÄS/ELF/DTK passage
  'drill-section-eyebrow', // section label above the prompt
  'drill-prompt', // headword / question prompt
  'option-A',
  'option-B',
  'option-C',
  'option-D',
  'option-E',
  'pedagogy-solution', // post-grade explanation marginalia
  'pedagogy-steps', // post-grade step cards
  'explanation-technique',
  'explanation-pitfall',
  'running-head', // top page chrome
  'status-line', // bottom page chrome
] as const

/** Format any string as a markdown fenced code block, escaping the
 *  guard chars correctly when the content itself contains backticks. */
function fence(content: string, lang = '') {
  const tickRuns = content.match(/`+/g) ?? []
  const max = tickRuns.reduce((m, run) => Math.max(m, run.length), 0)
  const guard = '`'.repeat(Math.max(3, max + 1))
  return `${guard}${lang}\n${content}\n${guard}`
}

/** Replace U+E000/U+E001 (KaTeX delimiters) with visible glyphs that
 *  survive copy-paste. Without this they look like spaces. */
function visibleDelims(s: string) {
  return s.replace(//g, '⟦').replace(//g, '⟧')
}

/** Codepoint dump — surfaces invisible / unusual chars (NBSP, ZWJ,
 *  unmapped PDF glyphs). Limited to the first 200 chars to keep the
 *  report manageable. */
function codepoints(s: string, limit = 200) {
  const out: string[] = []
  for (const ch of [...s].slice(0, limit)) {
    const cp = ch.codePointAt(0) ?? 0
    const hex = cp.toString(16).toUpperCase().padStart(4, '0')
    const display = cp >= 0x20 && cp < 0x7f ? ch : cp === 0x20 ? '(sp)' : '·'
    out.push(`${display}\tU+${hex}`)
  }
  if (s.length > limit) out.push(`… (+${s.length - limit} more)`)
  return out.join('\n')
}

function getComputedFont(el: Element): {
  family: string
  size: string
  weight: string
  italic: boolean
} {
  const cs = window.getComputedStyle(el)
  return {
    family: cs.fontFamily,
    size: cs.fontSize,
    weight: cs.fontWeight,
    italic: cs.fontStyle === 'italic' || cs.fontStyle === 'oblique',
  }
}

/** If a tracked element contains a KaTeX-rendered span, return its
 *  computed font separately so we can compare math vs surrounding. */
function getKatexFont(el: Element): ReturnType<typeof getComputedFont> | null {
  const katex = el.querySelector('.katex')
  if (!katex) return null
  return getComputedFont(katex)
}

/** Pull the active drill question state from the global bank that
 *  main.tsx sets for e2e tests. Lets us name the question without
 *  reading it back out of the DOM. */
function getActiveQuestion(): {
  qid: string | null
  prompt: string | null
  answer: string | null
  options: { letter: string; text: string }[]
} | null {
  const bank = (
    window as unknown as {
      __HPC_BANK__?: {
        qid?: string
        prompt?: string
        answer?: string
        options?: { letter: string; text: string }[]
      }[]
    }
  ).__HPC_BANK__
  if (!bank) return null
  const promptEl = document.querySelector('[data-testid="drill-prompt"]')
  if (!promptEl) return null

  // Prefer the URL's `?qid=X` when present — session routes
  // (/drill, /repetition, /diagnostik) replaceState the qid on every
  // advance, so the URL is canonical. The prompt-textContent
  // matching below stays as a fallback for surfaces that haven't
  // adopted the URL pattern yet.
  const urlQid = new URLSearchParams(window.location.search).get('qid')
  if (urlQid) {
    const direct = bank.find((q) => q.qid === urlQid)
    if (direct) {
      return {
        qid: direct.qid ?? null,
        prompt: direct.prompt ?? null,
        answer: direct.answer ?? null,
        options: direct.options ?? [],
      }
    }
  }

  const visiblePrompt = (promptEl.textContent || '').trim()
  // Match the visible (KaTeX-rendered) prompt against the raw bank
  // prompts. Earlier versions used a fixed 20-char prefix, which
  // collided when multiple questions started with the same opener —
  // e.g. "a och b är positiva tal..." (host-2020-XYZ-006) and
  // "a och b är positiva heltal..." (var-2018-1-KVA-017) share the
  // first 20 chars, so the WRONG qid bubbled up to share output.
  // Instead: walk all banked questions and pick the one whose raw
  // prompt shares the LONGEST common prefix with the visible text,
  // requiring ≥40 chars to count as a match.
  function lcpLength(a: string, b: string): number {
    const n = Math.min(a.length, b.length)
    let i = 0
    while (i < n && a.charCodeAt(i) === b.charCodeAt(i)) i++
    return i
  }
  let hit:
    | {
        qid?: string
        prompt?: string
        answer?: string
        options?: { letter: string; text: string }[]
      }
    | undefined
  let bestLen = 0
  for (const q of bank) {
    const raw = (q.prompt || '').replace(/[\u{E000}\u{E001}]/gu, '')
    const len = lcpLength(raw, visiblePrompt)
    if (len > bestLen) {
      bestLen = len
      hit = q
    }
  }
  if (bestLen < 40) hit = undefined
  if (!hit) return null
  return {
    qid: hit.qid ?? null,
    prompt: hit.prompt ?? null,
    answer: hit.answer ?? null,
    options: hit.options ?? [],
  }
}
function buildSnapshot(): string {
  const now = new Date().toISOString()
  const url = window.location.href
  const path = window.location.pathname + window.location.search
  const viewport = `${window.innerWidth} × ${window.innerHeight}, dpr ${window.devicePixelRatio}`

  // Snapshot the stores once at capture time — we don't need a live
  // subscription for a one-shot copy.
  const ui = useUiStore.getState()
  const coachStore = useCoachStore.getState()

  const lines: string[] = []
  lines.push(`# Dev share — ${now}`)
  lines.push(``)
  lines.push(`Path: \`${path}\``)
  lines.push(`URL: ${url}`)
  lines.push(`Viewport: ${viewport}`)
  lines.push(``)

  // UI prefs
  lines.push(`## UI prefs`)
  lines.push(``)
  lines.push(`- coach: \`${coachStore.coach}\``)
  lines.push(`- palette: \`${ui.palette}\``)
  lines.push(`- mode: \`${ui.mode}\``)
  lines.push(`- font: \`${ui.font}\``)
  lines.push(`- density: \`${ui.density}\``)
  lines.push(`- useFluid: \`${ui.useFluid}\``)
  lines.push(``)

  // Active question (if any)
  const q = getActiveQuestion()
  if (q) {
    lines.push(`## Active question`)
    lines.push(``)
    lines.push(`- qid: \`${q.qid}\``)
    lines.push(`- answer: \`${q.answer}\``)
    if (q.prompt) {
      lines.push(`- prompt (raw, ⟦…⟧ = KaTeX delimiters):`)
      lines.push(``)
      lines.push(fence(visibleDelims(q.prompt)))
    }
    if (q.options.length) {
      lines.push(`- options:`)
      for (const opt of q.options) {
        lines.push(`  - **${opt.letter}**: ${visibleDelims(opt.text)}`)
      }
    }
    lines.push(``)
  } else {
    lines.push(`## Active question`)
    lines.push(``)
    lines.push(`(no drill question detected on this screen)`)
    lines.push(``)
  }

  // Computed fonts on tracked elements
  lines.push(`## Computed fonts on tracked elements`)
  lines.push(``)
  lines.push(`| testid | font-family | size | weight | italic | KaTeX child |`)
  lines.push(`|---|---|---|---|---|---|`)
  for (const tid of TRACKED_TESTIDS) {
    const el = document.querySelector(`[data-testid="${tid}"]`)
    if (!el) continue
    const f = getComputedFont(el)
    const k = getKatexFont(el)
    const katexCell = k ? `${k.family.split(',')[0]} ${k.italic ? 'italic' : ''} ${k.size}` : '—'
    lines.push(
      `| \`${tid}\` | ${f.family.replace(/"/g, '')} | ${f.size} | ${f.weight} | ${f.italic ? 'yes' : 'no'} | ${katexCell} |`,
    )
  }
  lines.push(``)

  // Font load state
  lines.push(`## Document.fonts load state`)
  lines.push(``)
  const tracked = [
    'Newsreader',
    'Inter Tight',
    'JetBrains Mono',
    'KaTeX_Main',
    'KaTeX_Math',
    'KaTeX_AMS',
  ]
  const seen = new Map<string, string>()
  for (const f of document.fonts) {
    const key = `${f.family} ${f.weight} ${f.style}`
    if (tracked.some((t) => f.family.includes(t)) && !seen.has(key)) {
      seen.set(key, f.status)
    }
  }
  for (const [k, v] of seen) {
    lines.push(`- ${k}: \`${v}\``)
  }
  lines.push(``)

  // Codepoint dump of the prompt
  if (q?.prompt) {
    lines.push(`## Prompt codepoints (first 200)`)
    lines.push(``)
    lines.push(fence(codepoints(q.prompt), 'text'))
    lines.push(``)
  }

  // Rendered prompt HTML
  const promptEl = document.querySelector('[data-testid="drill-prompt"]')
  if (promptEl) {
    lines.push(`## Rendered prompt HTML`)
    lines.push(``)
    // Strip out the inline style attrs to keep the blob short — fonts
    // are already captured in the computed-style table above.
    const cleaned = promptEl.outerHTML.replace(/ style="[^"]{200,}"/g, ' style="…"')
    lines.push(fence(cleaned, 'html'))
    lines.push(``)
  }

  // User scratchpad
  lines.push(`## Notes from the user`)
  lines.push(``)
  lines.push(
    `<!-- replace this with what you're seeing — which character or word looks wrong, and how -->`,
  )
  lines.push(``)

  return lines.join('\n')
}

export function ShareDebugButton() {
  const here = useRouterState({ select: (s) => s.location.pathname })
  const viewport = useViewport()
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle')

  if (!isDevSurface()) return null
  if (here === '/dev') return null

  // Same viewport-aware lift as TweaksLauncher (its sibling, right:130
  // vs right:18) — see that component for why `bottom: 18` alone
  // occludes the phone tab bar.
  const bottomOffset = viewport === 'phone' ? 'calc(var(--frame-tabbar) + 12px)' : 18

  const onClick = async () => {
    try {
      const snapshot = buildSnapshot()
      await navigator.clipboard.writeText(snapshot)
      setStatus('copied')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (e) {
      console.error('share-debug clipboard write failed', e)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 2500)
    }
  }

  const label =
    status === 'copied' ? 'kopierat ✓' : status === 'error' ? 'fel — se konsol' : 'share'

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Kopiera felsökningssnapshot till urklipp"
      data-testid="share-debug-button"
      style={{
        position: 'fixed',
        // Sits left of the tweaks launcher (which is at right: 18).
        // Roughly 100px wide; gap 10px.
        right: 130,
        bottom: bottomOffset,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: status === 'copied' ? 'var(--accent)' : 'var(--panel)',
        color: status === 'copied' ? 'var(--bg)' : 'var(--ink-2)',
        border: '1px solid var(--hairline)',
        borderRadius: 999,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: 'var(--font-mono-track)',
        cursor: 'pointer',
        boxShadow: '0 8px 20px -10px rgba(0,0,0,0.18)',
        zIndex: 50,
        transition: 'background 200ms, color 200ms',
      }}
    >
      <span
        aria-hidden
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: status === 'copied' ? 'var(--bg)' : 'var(--ink-2)',
          opacity: 0.6,
        }}
      />
      {label}
    </button>
  )
}
