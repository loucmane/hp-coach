// LessonReader — orchestrator for a section's framework content.
//
// Loads the framework JSON for a given section and dispatches to the
// right card template. Today only the trap-catalog family (NOG) is
// wired; B1.1 adds protocol and lexicon templates.
//
// Composition mirrors PedagogyPanel: hero masthead at top (section
// name + scope), then a flush-left flow of cards. No tiles, no grid —
// the artefact is a reading surface, not a dashboard.

import { Link } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { usePutLessonProgress } from '@/api/hooks/useLessonProgress'
import { Mono } from '@/components/primitives'
import { type Framework, loadFramework } from '@/data/frameworks'
import type { Section } from '@/data/questions'
import { useLessonReads } from '@/hooks/useLessonReads'
import { currentDevice } from '@/lib/device'

import { LexiconCard } from './LexiconCard'
import { ProtocolCard } from './ProtocolCard'
import { TrapCard } from './TrapCard'

const SECTION_TITLE: Record<string, { headline: string; subline: string }> = {
  NOG: {
    headline: 'NOG',
    subline: 'Kvantitativa resonemang — datasufficiens.',
  },
  KVA: { headline: 'KVA', subline: 'Kvantitativa jämförelser.' },
  XYZ: { headline: 'XYZ', subline: 'Matematisk problemlösning.' },
  MEK: { headline: 'MEK', subline: 'Meningskomplettering.' },
  DTK: { headline: 'DTK', subline: 'Diagram, tabeller och kartor.' },
  ORD: { headline: 'ORD', subline: 'Ordförståelse.' },
  LÄS: { headline: 'LÄS', subline: 'Svensk läsförståelse.' },
  ELF: { headline: 'ELF', subline: 'Engelsk läsförståelse.' },
}

// Average reading speed for Swedish prose. Used to surface "X min
// läsning" in the masthead so the user knows the time commitment.
const WORDS_PER_MINUTE = 200

function estimateReadMinutes(framework: Framework): number {
  let words = 0
  for (const entry of framework.entries) {
    // Family-agnostic word count: sum every string-valued field plus
    // every element of any string-array field. New schema fields land
    // automatically without changing this loop.
    for (const value of Object.values(entry)) {
      if (typeof value === 'string') words += countWords(value)
      else if (Array.isArray(value)) {
        for (const v of value) if (typeof v === 'string') words += countWords(v)
      }
    }
  }
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE))
}

function countWords(s: string): number {
  return s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length
}

export function LessonReader({ section }: { section: Section }) {
  const [framework, setFramework] = useState<Framework | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    setFramework(null)
    loadFramework(section)
      .then((data) => {
        if (!alive) return
        setFramework(data)
        setLoading(false)
      })
      .catch((e) => {
        if (!alive) return
        setError(e instanceof Error ? e.message : 'unknown error')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [section])

  // Hash → details deep-link. When the reader loads with #KVA-TRAP-001
  // in the URL (e.g. arriving from a drill miss's framework link),
  // find that details element, open it, and scroll it into view. Runs
  // after framework loads so the entries exist in the DOM.
  useEffect(() => {
    if (!framework) return
    const hash = window.location.hash.slice(1)
    if (!hash) return
    // Wait one frame for the entries to commit; <details> elements are
    // created by FrameworkBody after this effect's first commit.
    requestAnimationFrame(() => {
      const el = document.getElementById(hash) as HTMLDetailsElement | null
      if (!el) return
      el.open = true
      el.scrollIntoView({ block: 'start', behavior: 'smooth' })
    })
  }, [framework])

  // Lesson reading bookmark — as the reader opens framework entries, we
  // upsert a per-section bookmark on the server so the Home resumption
  // panel can offer "fortsätt läsa" on ANY device. Lessons aren't a
  // session (read-only, no attempts, no end); the bookmark is just "you
  // were reading entry X."
  //
  // Capture-phase listener: <details> toggling doesn't change the URL and
  // `toggle` doesn't bubble. On open we mirror the entry into the URL hash
  // (deep-link / refresh stability) and PUT the bookmark, debounced so
  // skimming doesn't spam writes. Programmatic opens (the deep-link effect
  // above) fire `toggle` too, so arriving via an anchor also bookmarks.
  const putProgress = usePutLessonProgress()
  const putMutate = putProgress.mutate
  const putRef = useRef(putMutate)
  putRef.current = putMutate
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const onToggle = (e: Event) => {
      const el = e.target as HTMLElement | null
      if (!el || el.tagName !== 'DETAILS' || !el.id) return
      if (!(el as HTMLDetailsElement).open) return
      const id = el.id
      try {
        window.history.replaceState(null, '', `#${id}`)
      } catch {
        /* sandboxed contexts; the bookmark write below still runs */
      }
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        putRef.current({ section, frameworkId: id, device: currentDevice() })
      }, 400)
    }
    document.addEventListener('toggle', onToggle, true)
    return () => {
      document.removeEventListener('toggle', onToggle, true)
      if (timer) clearTimeout(timer)
    }
  }, [section])

  const title = SECTION_TITLE[section] ?? { headline: section, subline: '' }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingTop: 'clamp(32px, 4vw + 16px, 64px)',
        paddingBottom: 'clamp(48px, 6vw, 96px)',
      }}
    >
      <header className="reveal" style={{ animationDelay: '0ms' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
          <Link
            to="/lektion"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              textDecoration: 'none',
            }}
          >
            ← alla sektioner
          </Link>
          <span aria-hidden style={{ color: 'var(--hairline)' }}>
            ·
          </span>
          <Mono>LEKTION</Mono>
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(48px, 6vw + 16px, 88px)',
            lineHeight: 1.0,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            margin: '12px 0 0 0',
          }}
        >
          {title.headline}
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 0.8vw + 14px, 22px)',
            lineHeight: 1.4,
            color: 'var(--ink-2)',
            margin: '16px 0 0 0',
            maxWidth: '52ch',
          }}
        >
          {title.subline}
        </p>
        {framework && (
          <div
            style={{
              marginTop: 18,
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {framework.entries.length} mönster · ~{estimateReadMinutes(framework)} min läsning
          </div>
        )}
      </header>

      <div
        className="reveal"
        style={{
          marginTop: 'clamp(32px, 4vw + 16px, 64px)',
          animationDelay: '120ms',
        }}
      >
        {loading && <EmptyState message="Laddar…" />}
        {error && <EmptyState message={`Kunde inte ladda: ${error}`} />}
        {!loading && !error && !framework && <EmptyState message="Inget innehåll här ännu." />}
        {framework && <FrameworkBody framework={framework} section={section} />}
      </div>
    </div>
  )
}

function FrameworkBody({ framework, section }: { framework: Framework; section: Section }) {
  const { isRead, toggleRead } = useLessonReads()
  // Dispatch on the framework's discriminating family. Trap catalogs
  // (NOG/KVA/XYZ) → TrapCard. Tactic / constraint / protocol catalogs
  // (DTK/MEK/LÄS/ELF) → ProtocolCard. Lexicon (ORD) → LexiconCard.
  switch (framework.family) {
    case 'nog_traps':
    case 'kva_traps':
    case 'xyz_traps':
      return (
        <>
          {framework.entries.map((entry) => (
            <TrapCard
              key={entry.id}
              entry={entry}
              section={section}
              read={isRead(entry.id)}
              onToggleRead={() => toggleRead(entry.id)}
            />
          ))}
        </>
      )
    case 'dtk_tactics':
    case 'mek_protocol':
    case 'las_taxonomy':
    case 'elf_taxonomy':
      return (
        <>
          {framework.entries.map((entry) => (
            <ProtocolCard
              key={entry.id}
              entry={entry}
              section={section}
              read={isRead(entry.id)}
              onToggleRead={() => toggleRead(entry.id)}
            />
          ))}
        </>
      )
    case 'ord_roots':
      return (
        <>
          {framework.entries.map((entry) => (
            <LexiconCard
              key={entry.id}
              entry={entry}
              read={isRead(entry.id)}
              onToggleRead={() => toggleRead(entry.id)}
            />
          ))}
        </>
      )
  }
}

function EmptyState({ message }: { message: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        color: 'var(--muted)',
        margin: 0,
      }}
    >
      {message}
    </p>
  )
}
