// /drill — random drill of N questions, parameterised by section via
// the `?section=…` search param. Defaults to ORD when omitted.
//
// Thin route: composes <SessionPlayer> with a random picker, the
// "record-mistake on wrong" side effect, and section-specific copy.
// The state machine, lifecycle, and UI live in <SessionPlayer>; this
// file is just config.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'

import { useDueMistakes, useRecordMistake } from '@/api/hooks/useMistakes'
import { useActiveSession } from '@/api/hooks/useSessions'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { findQuestion, inferSectionFromQid, loadBank, type Section } from '@/data/questions'
import { DEFAULT_DRILL_LENGTH, pickDrillQuestions } from '@/lib/drill'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'

const DRILL_SECTIONS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const
type DrillSection = (typeof DRILL_SECTIONS)[number]

type DrillSearch = { section?: DrillSection; qid?: string; framework?: string }

function validateSearch(input: Record<string, unknown>): DrillSearch {
  const out: DrillSearch = {}
  const raw = input.section
  if (typeof raw === 'string' && (DRILL_SECTIONS as readonly string[]).includes(raw)) {
    out.section = raw as DrillSection
  }
  // A.6V.4 — `?qid=` direct-link. When present, the drill flow loads
  // ONLY this one question (single-element plan). Lets the user jump
  // straight to a specific question for variant-comparison passes or
  // ad-hoc debugging without re-drilling a full session.
  const qid = input.qid
  if (typeof qid === 'string' && qid.length > 0 && qid.length < 80) {
    out.qid = qid
  }
  // B1.1 deep-link — `?framework=ENTRY-ID` plays the example_questions
  // for that specific framework entry (a trap, tactic, root, etc.).
  // Drives the "Öva detta mönster" link on every lesson card.
  const framework = input.framework
  if (typeof framework === 'string' && framework.length > 0 && framework.length < 60) {
    out.framework = framework
  }
  return out
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
  DTK: {
    headline: 'DTK',
    subcopy: '10 frågor om diagram, tabeller och kartor från riktiga prov.',
  },
}

export const Route = createFileRoute('/drill')({
  validateSearch,
  component: DrillScreen,
})

function DrillScreen() {
  const { section: sectionFromUrl, qid, framework } = Route.useSearch()
  // When a deep link arrives with `?qid=…` but no `?section=…` — e.g. the
  // lesson example-question rows that just send the qid — read the section
  // off the qid itself instead of falling through to the ORD default. The
  // default used to make the chrome render ORD even for a LÄS qid, and (worse)
  // it tripped the active-session guard below: if the user happened to have
  // an ORD session in progress, directLinkQid zeroed out and they landed on
  // the generic ORD drill instead of the question they tapped.
  const section: DrillSection = sectionFromUrl ?? (qid ? inferSectionFromQid(qid) : null) ?? 'ORD'
  const navigate = useNavigate()

  // URL-synced active qid. Preserves any other params (section,
  // framework) — drill carries multiple optional facets. replace:true
  // keeps the back button useful (one tap to leave the session
  // instead of stepping back through 10 individual questions).
  const setUrlQid = useCallback(
    (next: string | null) => {
      navigate({
        to: '/drill',
        search: (prev: DrillSearch) => ({
          ...prev,
          qid: next ?? undefined,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  const recordMistake = useRecordMistake()
  const due = useDueMistakes()
  const dueCount = due.data?.length ?? 0

  // `?qid=` is direct-link mode ONLY when no active session for this
  // section exists. Once SessionPlayer starts a drill, it writes `qid`
  // to the URL via setUrlQid (so refresh resumes at the right question)
  // — if we keyed direct-link mode purely on `qid` presence, the route
  // would flip into single-question landing the moment the first
  // question loads, stranding the user. Active-session check
  // distinguishes "deep-link from outside" (no session yet) from
  // "session in progress" (don't flip).
  const activeSession = useActiveSession()
  const directLinkQid =
    qid && (!activeSession.data || activeSession.data.sections !== section) ? qid : null

  // Resolve the framework entry's display name (e.g. "för-" for
  // ORD-ROOT-001) so the idle screen shows what the user is about to
  // practice instead of the bare ID. Same loadFramework call the picker
  // makes — Promise is memoised so this hits the cache.
  const [frameworkHeadword, setFrameworkHeadword] = useState<string | null>(null)
  useEffect(() => {
    if (!framework) {
      setFrameworkHeadword(null)
      return
    }
    let alive = true
    loadFramework(section as Section).then((fw) => {
      if (!alive || !fw) return
      const entry = fw.entries.find((e) => e.id === framework)
      if (entry) setFrameworkHeadword(entryHeadword(entry, fw))
    })
    return () => {
      alive = false
    }
  }, [framework, section])

  const copy = SECTION_COPY[section]

  // Three picker modes:
  //   - direct-link (`?qid=` AND no active section session) → load one
  //     specific question (variant-comparison / debug)
  //   - `?framework=` → load a framework entry's example_questions
  //   - default → random N-question section drill
  const pickQuestions = directLinkQid
    ? () => loadBank().then((b) => [findQuestion(b, directLinkQid)])
    : framework
      ? () => pickFrameworkQuestions(section as Section, framework)
      : () => pickDrillQuestions(section as Section, DEFAULT_DRILL_LENGTH)

  const frameworkDisplay = frameworkHeadword ?? framework
  // Direct-link idle was first written for variant-comparison / debug
  // (the qid as a giant display headline + "för granskning eller debug"
  // subcopy). It now also lands legitimate lesson taps, so the chrome
  // has to read like an editorial "you're about to attempt this question"
  // surface — section in the eyebrow, a calm headline, the qid moved
  // down to the meta line where it belongs as detail, not headline.
  const idleEyebrow = directLinkQid
    ? `Direktlänk · ${section}`
    : framework
      ? 'Mönsterövning'
      : 'Övning'
  const idleHeadline = directLinkQid
    ? 'En specifik fråga'
    : framework
      ? (frameworkDisplay ?? framework)
      : copy.headline
  const idleSubcopy = directLinkQid
    ? 'Tryck Starta för att försöka. Du får direktrespons med förklaring efter ditt svar.'
    : framework
      ? `Exempelfrågor från lektionen som illustrerar detta mönster.`
      : copy.subcopy
  const idleMeta = directLinkQid
    ? `${directLinkQid} · 1 poäng om rätt`
    : framework
      ? 'Exempelfrågor · 1 poäng per rätt'
      : `~ ${SECTION_DURATIONS[section]} minuter · 1 poäng per rätt`
  const emptyCopy = directLinkQid
    ? `Hittade inte frågan ${directLinkQid}.`
    : framework
      ? `Inga exempelfrågor hittades för ${frameworkDisplay ?? framework}.`
      : `Inga ${section}-frågor klara att öva på just nu.`

  return (
    <SessionPlayer
      sessionKind="drill"
      sections={section}
      activeTab="drill"
      pickQuestions={pickQuestions}
      idleEyebrow={idleEyebrow}
      idleHeadline={idleHeadline}
      idleSubcopy={idleSubcopy}
      idleMeta={idleMeta}
      emptyCopy={emptyCopy}
      idleExtra={
        !directLinkQid && !framework && dueCount > 0 ? <RepetitionHint count={dueCount} /> : null
      }
      urlSyncedQid={{ qid: qid ?? null, setQid: setUrlQid }}
      onWrong={(q) => {
        // Fire-and-forget: a failed mistake-write doesn't block the UX.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
}

// Build the question plan for a framework deep-link. Loads the section's
// framework, finds the entry by id, then resolves each example_question
// qid against the question bank. Missing qids are dropped silently (the
// example_questions array might reference a qid that didn't parse fully
// in the corpus — better to drop than crash). An empty result surfaces
// as SessionPlayer's "no questions" idle state.
async function pickFrameworkQuestions(section: Section, frameworkId: string) {
  const [framework, bank] = await Promise.all([loadFramework(section), loadBank()])
  if (!framework) return []
  const entry = framework.entries.find((e) => e.id === frameworkId)
  if (!entry?.example_questions) return []
  const out = []
  for (const qid of entry.example_questions) {
    const q = bank.find((x) => x.qid === qid)
    if (q && q.parsing_status === 'complete' && q.options) out.push(q)
  }
  return out
}

function RepetitionHint({ count }: { count: number }) {
  // Cap the surfaced number to the per-session size so the user's
  // expectation matches the /repetition reality. When the backlog
  // overflows, show "10 av N" — same shape as the Home plan card.
  const playable = Math.min(count, REPETITION_SESSION_SIZE)
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
        {count > playable ? (
          <>
            <strong>{playable}</strong> av {count} missar redo att repetera
          </>
        ) : (
          <>
            Du har <strong>{count}</strong> {count === 1 ? 'miss' : 'missar'} att repetera
          </>
        )}
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
