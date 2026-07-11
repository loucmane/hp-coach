// /drill — random drill of N questions, parameterised by section via
// the `?section=…` search param. Defaults to ORD when omitted.
//
// Thin route: composes <SessionPlayer> with a random picker, the
// "record-mistake on wrong" side effect, and section-specific copy.
// The state machine, lifecycle, and UI live in <SessionPlayer>; this
// file is just config.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAdaptiveReview } from '@/api/hooks/useAdaptiveReview'
import { useDueMistakes, useRecordMistake } from '@/api/hooks/useMistakes'
import { useActiveSession } from '@/api/hooks/useSessions'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { DrillResult } from '@/components/drill/DrillResult'
import { AdaptiveReviewOffer } from '@/components/session/AdaptiveReviewOffer'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { findQuestion, loadBank, type Question, type Section } from '@/data/questions'
import { logAdaptiveEvent } from '@/lib/adaptiveEvents'
import { encodeTreatedMarker } from '@/lib/adaptiveReview'
import { DEFAULT_DRILL_LENGTH, pickDrillQuestions, pickMixedDrillQuestions } from '@/lib/drill'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'

const DRILL_SECTIONS = ['ORD', 'LÄS', 'MEK', 'ELF', 'XYZ', 'KVA', 'NOG', 'DTK'] as const
type DrillSection = (typeof DRILL_SECTIONS)[number]

type DrillSearch = {
  section?: DrillSection
  qid?: string
  framework?: string
  mixed?: true
  weak?: true
  done?: number
  /** `?ar=1` — this drill is an adaptive-review detour (task #16). Marks
   *  the session row treated (rides `sections`) and surfaces the lektion
   *  anchor + a "Tillbaka till din övning" return on completion. Always
   *  paired with `?framework=`. */
  ar?: true
  /** `?back=<section>` — the section the user originally asked to drill;
   *  restored by the detour's "Tillbaka till din övning" continuation. */
  back?: DrillSection
}

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
  // `?mixed=1` — genuinely interleaved drill across all 8 sections, the
  // daily plan's "Blandad övning · alla sektioner" mastery-maintenance item.
  if (input.mixed === '1' || input.mixed === true) {
    out.mixed = true
  }
  // `?weak=1` — drills questions from the user's weakest traps in `section`
  // (read off the live mistake queue). Drives "Öva svagaste fällorna" on the
  // lektion section-CTA. Multi-trap, unlike single-trap `?framework=`.
  if (input.weak === '1' || input.weak === true) {
    out.weak = true
  }
  // `?done=<sessionId>` — show a completed pass's Klart, reconstructed from
  // its attempts (refresh-proof + history permalink).
  const done = Number(input.done)
  if (Number.isInteger(done) && done > 0) {
    out.done = done
  }
  // `?ar=1` — adaptive-review detour marker (task #16).
  if (input.ar === '1' || input.ar === true) {
    out.ar = true
  }
  // `?back=<section>` — original drill section to return to after a detour.
  const back = input.back
  if (typeof back === 'string' && (DRILL_SECTIONS as readonly string[]).includes(back)) {
    out.back = back as DrillSection
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
  const { section: sectionFromUrl, qid, framework, mixed, weak, done, ar, back } = Route.useSearch()
  const section: DrillSection = sectionFromUrl ?? 'ORD'
  const navigate = useNavigate()

  // A NORMAL drill is the only surface that offers the adaptive-review
  // detour: plain section drills, not the detour itself (`framework`/`ar`),
  // a direct-link (`qid`), a weak-traps or mixed pass, or a reconstructed
  // `done` view.
  const isNormalDrill = !framework && !qid && !weak && !mixed && !ar && !done
  const adaptive = useAdaptiveReview()

  // `?weak=1` — the user's weakest traps in this section, off the live
  // mistake queue (same source as Home's "Återkommande fällor"). We gather
  // ALL their example questions, not just the worst trap's.
  const weakTraps = useTopTraps({ limit: 8, minCount: 1 })
  const weakFrameworkIds = useMemo(
    () => weakTraps.filter((t) => t.section === section).map((t) => t.framework_id),
    [weakTraps, section],
  )

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
          // Any qid change means a live drill — a stale `?done` from a
          // prior pass must not linger (or re-trigger reconstruction).
          done: undefined,
        }),
        replace: true,
      })
    },
    [navigate],
  )

  // On completion, stamp `?done=<sessionId>` (keeping the section so
  // "öva igen" re-picks the same one) so a refresh reconstructs the Klart.
  // On a detour (`ar`), keep the `ar`/`back` params so DrillResult can
  // surface the "Tillbaka till din övning" continuation.
  const onComplete = useCallback(
    (sessionId: number) => {
      if (ar) logAdaptiveEvent('detour_completed', { framework_id: framework })
      navigate({
        to: '/drill',
        search: (prev: DrillSearch) => ({
          section: prev.section,
          done: sessionId,
          ar: prev.ar,
          back: prev.back,
        }),
        replace: true,
      })
    },
    [navigate, ar, framework],
  )

  // Adaptive-review offer (task #16). "Ja" runs the targeted detour (carrying
  // `back` so the return button can restore this section); "Inte nu" records
  // a decline and starts the drill the user actually asked for.
  const acceptDetour = useCallback(() => {
    if (!adaptive.hotTrap) return
    logAdaptiveEvent('offer_accepted', { framework_id: adaptive.hotTrap.framework_id })
    navigate({
      to: '/drill',
      search: { framework: adaptive.hotTrap.framework_id, ar: true, back: section },
    })
  }, [navigate, adaptive.hotTrap, section])

  const showOffer = !!(isNormalDrill && adaptive.hotTrap && adaptive.trapName && adaptive.section)
  // Render-prop: "Inte nu" records the decline AND starts the original drill
  // in one tap (SessionPlayer hands us `startOriginal`).
  const adaptiveOffer = showOffer
    ? ({ startOriginal }: { startOriginal: () => void }) => (
        <AdaptiveReviewOffer
          trapName={adaptive.trapName as string}
          section={adaptive.section as string}
          onAccept={acceptDetour}
          onDecline={() => {
            adaptive.decline()
            startOriginal()
          }}
        />
      )
    : undefined

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

  const copy = mixed
    ? { headline: 'Blandad övning', subcopy: '10 frågor blandat från alla åtta delprov.' }
    : SECTION_COPY[section]

  // Three picker modes (cross-device resume is handled by SessionPlayer
  // adopting the active server session + its stored plan via resolvePlan
  // below — the route no longer re-derives a resume plan from localStorage):
  //   - direct-link (`?qid=` AND no active section session) → one question
  //   - `?framework=` → a framework entry's example_questions
  //   - default → random N-question section drill
  const pickQuestions = directLinkQid
    ? () =>
        loadBank().then((b) => {
          // Deep-linked qid may be stale (corpus regen / seed rows like
          // `q1`). Resolve safely → [] drops to the recoverable empty
          // state ("Hittade inte frågan …") instead of throwing.
          const q = findQuestion(b, directLinkQid)
          return q ? [q] : []
        })
    : framework
      ? () => pickFrameworkQuestions(section as Section, framework)
      : weak
        ? () => pickWeakTrapsQuestions(section as Section, weakFrameworkIds)
        : mixed
          ? () => pickMixedDrillQuestions(DEFAULT_DRILL_LENGTH)
          : () => pickDrillQuestions(section as Section, DEFAULT_DRILL_LENGTH)

  // Turn a stored plan (server session qids) back into Questions so
  // SessionPlayer can replay the exact paused session on any device.
  // Resolve safely and drop qids that no longer exist — a fully stale
  // plan resolves to [], which SessionPlayer treats as a recoverable
  // "session no longer available" state rather than crashing.
  const resolvePlan = (qids: string[]) =>
    loadBank().then((b) =>
      qids.map((q) => findQuestion(b, q)).filter((q): q is Question => q !== undefined),
    )

  // Session `sections` metadata. For an adaptive-review detour (`ar`), ride
  // the treated marker on this field (encodeTreatedMarker) so the completed
  // session row is recoverable as "treated" — same free-form-field trick
  // MockRunner uses, NO schema migration. Otherwise the plain section code.
  const sessionSections = ar && framework ? encodeTreatedMarker(section, framework) : section

  const frameworkDisplay = frameworkHeadword ?? framework
  const idleEyebrow = directLinkQid
    ? 'Direktlänk'
    : ar
      ? 'Riktad repetition'
      : framework
        ? 'Mönsterövning'
        : weak
          ? 'Svagaste fällorna'
          : 'Övning'
  const idleHeadline = directLinkQid
    ? directLinkQid
    : framework
      ? (frameworkDisplay ?? framework)
      : weak
        ? `Svagaste fällorna · ${section}`
        : copy.headline
  const idleSubcopy = directLinkQid
    ? 'En specifik fråga via ?qid= — för granskning eller debug.'
    : framework
      ? `Exempelfrågor från uppslaget som illustrerar detta mönster.`
      : weak
        ? `Frågor från de mönster du oftast faller för i ${section}.`
        : copy.subcopy
  const idleMeta = directLinkQid
    ? '1 fråga · ingen sessionsgrad'
    : framework
      ? 'Exempelfrågor · 1 poäng per rätt'
      : weak
        ? `${weakFrameworkIds.length} mönster · 1 poäng per rätt`
        : `~ ${SECTION_DURATIONS[section]} minuter · 1 poäng per rätt`
  const emptyCopy = directLinkQid
    ? `Hittade inte frågan ${directLinkQid}.`
    : framework
      ? `Inga exempelfrågor hittades för ${frameworkDisplay ?? framework}.`
      : weak
        ? `Inga svaga mönster i ${section} än — öva sektionen så hittar vi dem.`
        : `Inga ${section}-frågor klara att öva på just nu.`

  // Detour idle: surface the lektion anchor so the user can refresh the
  // pattern before drilling it. Otherwise the normal repetition hint.
  const idleExtra =
    ar && framework ? (
      <LektionAnchorLink section={section} frameworkId={framework} />
    ) : !directLinkQid && !framework && dueCount > 0 ? (
      <RepetitionHint count={dueCount} />
    ) : null

  return (
    <SessionPlayer
      sessionKind="drill"
      sections={sessionSections}
      activeTab="ova"
      pickQuestions={pickQuestions}
      idleEyebrow={idleEyebrow}
      idleHeadline={idleHeadline}
      idleSubcopy={idleSubcopy}
      idleMeta={idleMeta}
      emptyCopy={emptyCopy}
      idleExtra={idleExtra}
      urlSyncedQid={{ qid: qid ?? null, setQid: setUrlQid }}
      completedSessionId={done ?? null}
      onComplete={onComplete}
      resolvePlan={resolvePlan}
      adaptiveOffer={adaptiveOffer}
      renderDone={
        ar && back
          ? ({ summary, onReplay, onHome }) => (
              <DrillResult
                summary={summary}
                onReplay={onReplay}
                onHome={onHome}
                continuation={<BackToOriginalDrill section={back} />}
              />
            )
          : undefined
      }
      onWrong={(q) => {
        // Fire-and-forget: a failed mistake-write doesn't block the UX.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
}

/** Lektion anchor surfaced at the top of a detour session — one tap to
 *  refresh the pattern before drilling it. Deep-links to
 *  /lektion?section=SEC#FRAMEWORK_ID (the reader opens + scrolls the entry). */
function LektionAnchorLink({ section, frameworkId }: { section: Section; frameworkId: string }) {
  return (
    <Link
      to="/lektion"
      search={{ section }}
      hash={frameworkId}
      data-testid="adaptive-review-lektion-anchor"
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
      <span style={{ fontSize: 14 }}>Läs mönstret i uppslaget först</span>
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

/** "Tillbaka till din övning" — the continuation shown on a completed detour's
 *  Klart, starting the drill the user originally asked for. */
function BackToOriginalDrill({ section }: { section: DrillSection }) {
  return (
    <Link
      to="/drill"
      search={{ section }}
      data-testid="adaptive-review-return"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        borderRadius: 999,
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        textDecoration: 'none',
        color: 'var(--ink)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: 'var(--font-mono-track)',
      }}
    >
      Tillbaka till din övning →
    </Link>
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

/** Multi-trap "Öva svagaste fällorna": gather drillable questions from ALL
 *  the user's weakest traps in a section (their example_questions), deduped,
 *  capped at the session size. Empty frameworkIds (no weak data) → []. */
async function pickWeakTrapsQuestions(section: Section, frameworkIds: string[]) {
  if (frameworkIds.length === 0) return []
  const [framework, bank] = await Promise.all([loadFramework(section), loadBank()])
  if (!framework) return []
  const byId = new Map(framework.entries.map((e) => [e.id, e]))
  const out: Question[] = []
  const seen = new Set<string>()
  for (const fid of frameworkIds) {
    for (const qid of byId.get(fid)?.example_questions ?? []) {
      if (seen.has(qid)) continue
      const q = bank.find((x) => x.qid === qid)
      if (q && q.parsing_status === 'complete' && q.options) {
        out.push(q)
        seen.add(qid)
      }
    }
  }
  return out.slice(0, DEFAULT_DRILL_LENGTH)
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
