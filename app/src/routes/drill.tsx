// /drill — random drill of N questions, parameterised by section via
// the `?section=…` search param. Defaults to ORD when omitted.
//
// Thin route: composes <SessionPlayer> with a random picker, the
// "record-mistake on wrong" side effect, and section-specific copy.
// The state machine, lifecycle, and UI live in <SessionPlayer>; this
// file is just config.

import { createFileRoute, Link } from '@tanstack/react-router'

import { useDueMistakes, useRecordMistake } from '@/api/hooks/useMistakes'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import type { Section } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH, pickDrillQuestions } from '@/lib/drill'

// Sections the drill currently supports. We only list the ones that
// have fully-parsed questions in the bundled dataset; DTK lands when
// its image-rendering pipeline ships.
const DRILL_SECTIONS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG'] as const
type DrillSection = (typeof DRILL_SECTIONS)[number]

type DrillSearch = { section?: DrillSection }

function validateSearch(input: Record<string, unknown>): DrillSearch {
  const raw = input.section
  if (typeof raw === 'string' && (DRILL_SECTIONS as readonly string[]).includes(raw)) {
    return { section: raw as DrillSection }
  }
  return {}
}

// Rough drill-time estimates per section. Match the section's pacing
// from real exams so the idle-screen hint isn't lying. ORD is fastest
// (single headword); reading/quant sections take longer per question.
const SECTION_DURATIONS: Record<DrillSection, number> = {
  ORD: 3,
  LÄS: 10,
  MEK: 5,
  ELF: 10,
  XYZ: 8,
  KVA: 6,
  NOG: 12,
}

const SECTION_COPY: Record<DrillSection, { headline: string; subcopy: string }> = {
  ORD: { headline: 'ORD', subcopy: '10 synonymfrågor från riktiga prov.' },
  LÄS: {
    headline: 'LÄS',
    subcopy: '10 frågor om svensk läsförståelse från riktiga prov.',
  },
  MEK: {
    headline: 'MEK',
    subcopy: '10 meningskompletteringar från riktiga prov.',
  },
  ELF: {
    headline: 'ELF',
    subcopy: '10 frågor om engelsk läsförståelse från riktiga prov.',
  },
  XYZ: {
    headline: 'XYZ',
    subcopy: '10 frågor om matematisk problemlösning från riktiga prov.',
  },
  KVA: {
    headline: 'KVA',
    subcopy: '10 kvantitativa jämförelser från riktiga prov.',
  },
  NOG: {
    headline: 'NOG',
    subcopy: '10 frågor om kvantitativa resonemang från riktiga prov.',
  },
}

export const Route = createFileRoute('/drill')({
  validateSearch,
  component: DrillScreen,
})

function DrillScreen() {
  const { section: sectionFromUrl } = Route.useSearch()
  const section: DrillSection = sectionFromUrl ?? 'ORD'

  const recordMistake = useRecordMistake()
  const due = useDueMistakes()
  const dueCount = due.data?.length ?? 0

  const copy = SECTION_COPY[section]

  return (
    <SessionPlayer
      sessionKind="drill"
      sections={section}
      activeTab="drill"
      pickQuestions={() => pickDrillQuestions(section as Section, DEFAULT_DRILL_LENGTH)}
      idleEyebrow="Övning"
      idleHeadline={copy.headline}
      idleSubcopy={copy.subcopy}
      idleMeta={`~ ${SECTION_DURATIONS[section]} minuter · 1 poäng per rätt`}
      emptyCopy={`Inga ${section}-frågor klara att öva på just nu.`}
      idleExtra={dueCount > 0 ? <RepetitionHint count={dueCount} /> : null}
      onWrong={(q) => {
        // Fire-and-forget: a failed mistake-write doesn't block the UX.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
}

function RepetitionHint({ count }: { count: number }) {
  return (
    <Link
      to="/repetition"
      data-testid="drill-repetition-hint"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 14px',
        background: 'var(--panel-2)',
        border: '1px solid var(--hairline)',
        borderRadius: 'calc(var(--radius) * 0.5)',
        textDecoration: 'none',
        color: 'var(--ink)',
      }}
    >
      <span style={{ fontSize: 14 }}>
        Du har <strong>{count}</strong> {count === 1 ? 'miss' : 'missar'} att repetera
      </span>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          color: 'var(--ink-2)',
        }}
      >
        →
      </span>
    </Link>
  )
}
