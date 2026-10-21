// /drill — random drill of N questions, parameterised by section via
// the `?section=…` search param. Defaults to ORD when omitted.
//
// Thin route: composes <SessionPlayer> with a random picker, the
// "record-mistake on wrong" side effect, and section-specific copy.
// The state machine, lifecycle, and UI live in <SessionPlayer>; this
// file is just config.

import { useUser } from '@clerk/clerk-react'
import { useIsMutating, useQuery } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAdaptiveReview } from '@/api/hooks/useAdaptiveReview'
import { useAbility, useItemStats } from '@/api/hooks/useItemStats'
import { useDueMistakes, useRecordMistake } from '@/api/hooks/useMistakes'
import {
  useActiveSession,
  useActiveSessionOfKind,
  useSessionAttempts,
} from '@/api/hooks/useSessions'
import { useTopTraps } from '@/api/hooks/useTopTraps'
import { DrillResult, type DrillSummary } from '@/components/drill/DrillResult'
import { type DrillClockState, QuietClock } from '@/components/drill/QuietClock'
import { TempoLine } from '@/components/drill/TempoLine'
import { AdaptiveReviewOffer } from '@/components/session/AdaptiveReviewOffer'
import { SessionPlayer } from '@/components/session/SessionPlayer'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import { findQuestion, loadBank, type Question, type Section } from '@/data/questions'
import { logAdaptiveEvent } from '@/lib/adaptiveEvents'
import { encodeTreatedMarker } from '@/lib/adaptiveReview'
import {
  DEFAULT_DRILL_LENGTH,
  type DrillRatings,
  pickDrillQuestions,
  pickMixedDrillQuestions,
} from '@/lib/drill'
import { sectionDoorLayoutId, useFirstContentSignal } from '@/lib/motion'
import { readOrdDeck, recordOrdAnswer } from '@/lib/ordDeck'
import { loadOrdWords, ORD_WORDS_SECTIONS, pickOrdWords } from '@/lib/ordWords'
import { REPETITION_SESSION_SIZE } from '@/lib/replay'
import { SECTION_DURATIONS } from '@/lib/sectionDurations'
import {
  attemptTimeMs,
  formatDrillTime,
  isTimedDrillPlan,
  pickTimedDrillQuestions,
  type TimedDrillSection,
  timedDrill,
} from '@/lib/timedDrill'
import { useUiStore } from '@/stores/uiStore'

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
  /** `?start=1` — the Öva hub's door path (owner 2026-07-12): the row IS
   *  the door, so the drill starts immediately instead of stopping on the
   *  idle interstitial. Session setup runs with the standard defaults the
   *  idle Start button would use (adopt-active-session included); direct
   *  /drill navigation without this flag keeps the idle screen. */
  start?: true
  /** Opt-in UHR-paced ORD set or one four-question LÄS text. */
  timed?: true
  /** Per-user spaced ORD word rounds. */
  words?: true
}

function validateSearch(input: Record<string, unknown>): DrillSearch {
  const out: DrillSearch = {}
  const raw = input.section
  if (typeof raw === 'string' && (DRILL_SECTIONS as readonly string[]).includes(raw)) {
    out.section = raw as DrillSection
  }
  // Home carries the stored sections marker in its resume URL. Decode it
  // here so that a resumed round keeps both ORD and the word-deck behavior.
  const wordResume = typeof raw === 'string' && raw.toUpperCase() === ORD_WORDS_SECTIONS
  if (wordResume) out.section = 'ORD'
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
  // `?start=1` — hub-door direct start (skip the idle interstitial).
  if (input.start === '1' || input.start === true) {
    out.start = true
  }
  if (
    (input.timed === '1' || input.timed === 1 || input.timed === true) &&
    timedDrill(out.section ?? 'ORD') &&
    !out.framework &&
    !out.mixed &&
    !out.weak
  ) {
    out.timed = true
  }
  if (
    (input.words === '1' || input.words === 1 || input.words === true || wordResume) &&
    (out.section ?? 'ORD') === 'ORD' &&
    !out.timed &&
    !out.framework &&
    !out.mixed &&
    !out.weak &&
    !out.ar
  ) {
    out.section = 'ORD'
    out.words = true
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
  const { section, timed, words } = Route.useSearch()
  if (words) return <WordDrillSession />
  // Changing the opt-in mode starts a new clock/player lifetime. Ordinary
  // drills keep their existing lifetime and all their other route facets.
  return <DrillSession key={timed ? `timed-${section ?? 'ORD'}` : 'untimed'} />
}

// Only the word-bank mode needs a Clerk identity. Key its player by user so
// switching accounts cannot continue a prior user's round or write its deck.
function WordDrillSession() {
  const { user, isLoaded } = useUser()
  if (!isLoaded) return <p role="status">Laddar ordbanken …</p>
  if (!user) return <p>Logga in för att öva i din ordbank.</p>
  return <DrillSession key={user.id} wordUserId={user.id} />
}

function DrillSession({ wordUserId }: { wordUserId?: string }) {
  const {
    section: sectionFromUrl,
    qid,
    framework,
    mixed,
    weak,
    done,
    ar,
    back,
    start,
    timed,
    words,
  } = Route.useSearch()
  const section: DrillSection = sectionFromUrl ?? 'ORD'
  const timing = timed ? timedDrill(section) : null
  const [clock, setClock] = useState<DrillClockState | null>(null)
  const navigate = useNavigate()
  // Boot-veil content signal (#305 owner verdict) — /drill has no Skrift
  // block; its plan/question set is synchronous local data, so by the
  // time this component commits its primary content is already in the DOM.
  useFirstContentSignal()

  // A NORMAL drill is the only surface that offers the adaptive-review
  // detour: plain section drills, not the detour itself (`framework`/`ar`),
  // a direct-link (`qid`), a weak-traps or mixed pass, or a reconstructed
  // `done` view.
  const isNormalDrill = !words && !timed && !framework && !qid && !weak && !mixed && !ar && !done
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
      if (timed) {
        const now = Date.now()
        setClock((prev) =>
          next === null
            ? null
            : {
                elapsedMs: prev ? prev.elapsedMs : 0,
                runningSince: now,
              },
        )
      }
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
    [navigate, timed],
  )

  const pauseClock = useCallback(() => {
    const now = Date.now()
    setClock((prev) => {
      if (!prev || prev.runningSince === null) return prev
      return {
        elapsedMs:
          prev.elapsedMs === null ? null : prev.elapsedMs + Math.max(0, now - prev.runningSince),
        runningSince: null,
      }
    })
  }, [])

  // On completion, stamp `?done=<sessionId>` (keeping the section so
  // "öva igen" re-picks the same one) so a refresh reconstructs the Klart.
  // On a detour (`ar`), keep the `ar`/`back` params so DrillResult can
  // surface the "Tillbaka till din övning" continuation.
  const onComplete = useCallback(
    (sessionId: number) => {
      setClock(null)
      if (ar) logAdaptiveEvent('detour_completed', { framework_id: framework })
      navigate({
        to: '/drill',
        search: (prev: DrillSearch) => ({
          section: prev.section,
          done: sessionId,
          ar: prev.ar,
          back: prev.back,
          timed: prev.timed,
          words: prev.words,
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
  const activeDrill = useActiveSessionOfKind('drill')
  const wordIndex = useQuery({
    queryKey: ['ord-words'],
    queryFn: loadOrdWords,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !!words,
  })
  const wordIdByQid = useMemo(
    () => new Map(wordIndex.data?.flatMap((word) => word.qids.map((id) => [id, word.id] as const))),
    [wordIndex.data],
  )
  const canResumeWords = activeDrill.data?.sections === ORD_WORDS_SECTIONS
  // SessionPlayer normally resumes by section alone. A timed drill also
  // needs its exact size/passage, so resolve the bank before mounting it.
  // This shares the player's query cache; ordinary drills do no extra load.
  const timedBank = useQuery({
    queryKey: ['question-bank'],
    queryFn: loadBank,
    staleTime: Number.POSITIVE_INFINITY,
    enabled: !!timing && !done,
  })
  const resumeAttempts = useSessionAttempts(timing && !done ? (activeDrill.data?.id ?? null) : null)
  const canResumeTimed = !!(
    timing &&
    timedBank.data &&
    activeDrill.data?.plan &&
    activeDrill.data.sections === section &&
    isTimedDrillPlan(
      activeDrill.data.plan
        .map((id) => findQuestion(timedBank.data, id))
        .filter((q): q is Question => !!q),
      timing.section,
    ) &&
    activeDrill.data.plan.length === timing.count
  )
  const directLinkQid =
    !words && !timing && qid && (!activeSession.data || activeSession.data.sections !== section)
      ? qid
      : null

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

  // Smart drill selection (PL-L.3): thread the learned Elo ratings into the
  // section-drill picker so it targets the 0.70–0.85 learning band. These
  // queries are the ONLY new inputs and they NEVER gate rendering — the drill
  // route commits the same with or without them (no ghost-loading states).
  // When smart-picking is off, or no item in this section has been rated yet,
  // `drillRatings` is undefined and the picker is byte-for-byte the old random
  // path. Ability defaults to 0 (the fit's baseline) for a user who has drilled
  // items but has no ability row for this section yet.
  const smartDrill = useUiStore((s) => s.smartDrill)
  const itemStats = useItemStats(section as Section)
  const ability = useAbility()
  const drillRatings = useMemo<DrillRatings | undefined>(() => {
    if (!smartDrill) return undefined
    const difficulty = itemStats.data
    if (!difficulty || Object.keys(difficulty).length === 0) return undefined
    return { difficulty, ability: ability.data?.[section]?.ability ?? 0 }
  }, [smartDrill, itemStats.data, ability.data, section])

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
          : () => {
              // Log which mode picked this session for the owner's A/B read
              // (localStorage ledger). Fires once, at fresh-start pick time —
              // SessionPlayer only calls pickQuestions on a new session, not
              // when adopting an active one.
              logAdaptiveEvent('drill-pick', {
                mode: drillRatings ? 'smart' : 'random',
                section,
              })
              return pickDrillQuestions(
                section as Section,
                DEFAULT_DRILL_LENGTH,
                undefined,
                drillRatings,
              )
            }

  // Turn a stored plan (server session qids) back into Questions so
  // SessionPlayer can replay the exact paused session on any device.
  // Resolve safely and drop qids that no longer exist — a fully stale
  // plan resolves to [], which SessionPlayer treats as a recoverable
  // "session no longer available" state rather than crashing.
  const resolvePlan = (qids: string[]) =>
    loadBank().then((b) =>
      qids.map((q) => findQuestion(b, q)).filter((q): q is Question => q !== undefined),
    )

  const resolveTimedPlan = async (qids: string[]) => {
    const questions = await resolvePlan(qids)
    const attempts = await resumeAttempts.refetch()
    setClock({ elapsedMs: attemptTimeMs(attempts.data), runningSince: null })
    return questions
  }

  const pickTimedQuestions = async () => {
    setClock(null)
    return timing ? pickTimedDrillQuestions(await loadBank(), timing.section) : []
  }

  const pickWordsQuestions = async () =>
    pickOrdWords(wordIndex.data ?? [], await loadBank(), readOrdDeck(wordUserId))
  const resolveWordPlan = async (qids: string[]) =>
    (await resolvePlan(qids)).filter((q) => q.section === 'ORD' && wordIdByQid.has(q.qid))
  const gradeWord = (q: Question, correct: boolean) => {
    const wordId = wordIdByQid.get(q.qid)
    if (words && wordId) recordOrdAnswer(wordUserId, wordId, q.qid, correct)
  }

  // Session `sections` metadata. For an adaptive-review detour (`ar`), ride
  // the treated marker on this field (encodeTreatedMarker) so the completed
  // session row is recoverable as "treated" — same free-form-field trick
  // MockRunner uses, NO schema migration. Otherwise the plain section code.
  const sessionSections = words
    ? ORD_WORDS_SECTIONS
    : ar && framework
      ? encodeTreatedMarker(section, framework)
      : section

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
  const idleExtra = words ? null : ar && framework ? (
    <LektionAnchorLink section={section} frameworkId={framework} />
  ) : !directLinkQid && !framework && dueCount > 0 ? (
    <RepetitionHint count={dueCount} />
  ) : null

  if (words && wordIndex.isPending) return <p role="status">Laddar ordbanken …</p>
  if (words && !wordIndex.data) {
    return (
      <p>
        Kunde inte hämta ordbanken.{' '}
        <button type="button" onClick={() => void wordIndex.refetch()}>
          Försök igen
        </button>
      </p>
    )
  }
  if (timing && !done && (activeDrill.isPending || timedBank.isPending)) {
    return <p role="status">Laddar övning …</p>
  }
  if (timing && !done && !timedBank.data) {
    return (
      <p>
        Kunde inte hämta övningen. <Link to="/ova">Tillbaka till Öva</Link>
      </p>
    )
  }

  const player = (
    <SessionPlayer
      sessionKind="drill"
      sections={sessionSections}
      activeTab="ova"
      pickQuestions={words ? pickWordsQuestions : timing ? pickTimedQuestions : pickQuestions}
      idleEyebrow={words ? 'Ordbank' : timing ? 'Övning på tid' : idleEyebrow}
      idleHeadline={words ? '10 ord i taget' : idleHeadline}
      idleSubcopy={
        words
          ? 'Ord som är dags att repetera kommer först, sedan nya ord från riktiga prov.'
          : timing?.section === 'LÄS'
            ? 'En hel text med fyra frågor från riktiga prov.'
            : idleSubcopy
      }
      idleMeta={
        words
          ? 'Upp till 10 ord · framsteg sparas i den här webbläsaren'
          : timing
            ? `${timing.count} frågor · riktmärke ${formatDrillTime(timing.budgetMs)} · klockan pausar under återkoppling`
            : idleMeta
      }
      emptyCopy={
        words
          ? 'Inga ord att öva just nu. Kom tillbaka när det är dags att repetera.'
          : timing?.section === 'LÄS'
            ? 'Ingen hel LÄS-text med fyra frågor är tillgänglig just nu.'
            : emptyCopy
      }
      idleExtra={idleExtra}
      urlSyncedQid={{
        qid: (words && !canResumeWords) || (timing && !canResumeTimed) ? null : (qid ?? null),
        setQid: setUrlQid,
      }}
      completedSessionId={done ?? null}
      onComplete={onComplete}
      resolvePlan={
        words
          ? resolveWordPlan
          : timing
            ? canResumeTimed
              ? resolveTimedPlan
              : undefined
            : resolvePlan
      }
      adaptiveOffer={adaptiveOffer}
      // Hub-door path: the Öva row already expressed the intent (this
      // section, standard drill) — begin immediately, no idle stop. A
      // stale `?done` means we're LOOKING at a completed pass's Klart,
      // not entering; reconstruction wins.
      autoStart={(!!start || ((!!words || !!timing) && !!qid)) && !done}
      // The section-door shared element: plain section drills only —
      // framework/qid/weak/mixed surfaces headline something other than
      // the section code, so there is no honest door there.
      door={
        !words && !directLinkQid && !framework && !weak && !mixed
          ? { layoutId: sectionDoorLayoutId(section), code: section }
          : undefined
      }
      renderDone={
        timing || (ar && back)
          ? ({ summary, onReplay, onHome }) =>
              timing ? (
                <TimedDrillResult
                  section={timing.section}
                  questionCount={timing.count}
                  sessionId={done ?? null}
                  summary={summary}
                  onReplay={onReplay}
                  onHome={onHome}
                  back={ar ? back : undefined}
                />
              ) : (
                <DrillResult
                  summary={summary}
                  onReplay={onReplay}
                  onHome={onHome}
                  continuation={back ? <BackToOriginalDrill section={back} /> : undefined}
                />
              )
          : undefined
      }
      onCorrect={words ? (q) => gradeWord(q, true) : timing ? pauseClock : undefined}
      onWrong={(q) => {
        if (timing) pauseClock()
        gradeWord(q, false)
        // Fire-and-forget: a failed mistake-write doesn't block the UX.
        recordMistake.mutate({ questionId: q.qid })
      }}
    />
  )
  if (!timing) return player
  return (
    <div
      style={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        // Reserve a strip so the fixed clock never covers a question/control.
        paddingTop: clock && !done ? 44 : 0,
        boxSizing: 'border-box',
      }}
    >
      {clock && !done && <QuietClock budgetMs={timing.budgetMs} {...clock} />}
      {player}
    </div>
  )
}

function TimedDrillResult({
  section,
  questionCount,
  sessionId,
  summary,
  onReplay,
  onHome,
  back,
}: {
  section: TimedDrillSection
  questionCount: number
  sessionId: number | null
  summary: DrillSummary
  onReplay: () => void
  onHome: () => void
  back?: DrillSection
}) {
  const { data: attempts, refetch } = useSessionAttempts(sessionId)
  const pendingWrites = useIsMutating()
  // The last answer/end are fire-and-forget. Refresh once those writes
  // settle too, so a result opened before the POST lands can gain its time.
  useEffect(() => {
    if (sessionId !== null && pendingWrites === 0) void refetch()
  }, [sessionId, pendingWrites, refetch])
  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <TempoLine section={section} questionCount={questionCount} attempts={attempts} />
      <div style={{ flex: 1, minHeight: 0 }}>
        <DrillResult
          summary={summary}
          onReplay={onReplay}
          onHome={onHome}
          continuation={back ? <BackToOriginalDrill section={back} /> : undefined}
        />
      </div>
    </div>
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
