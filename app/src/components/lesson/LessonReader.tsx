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
import { useEffect, useState } from 'react'

import { Mono } from '@/components/primitives'
import { type Framework, loadFramework } from '@/data/frameworks'
import type { Section } from '@/data/questions'

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
    words += countWords(entry.pattern_description)
    words += countWords(entry.why_it_occurs)
    words += countWords(entry.countermeasure)
    words += countWords(entry.common_distractor_signature)
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
        <Link
          to="/lektion"
          style={{
            display: 'inline-block',
            marginBottom: 10,
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
        <Mono>LEKTION</Mono>
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
        {framework?.family.endsWith('_traps') &&
          framework.entries.map((entry) => (
            <TrapCard key={entry.id} entry={entry} section={section} />
          ))}
      </div>
    </div>
  )
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
