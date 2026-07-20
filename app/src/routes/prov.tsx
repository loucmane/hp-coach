// /prov — Provpass (mock exam) entry surface. PR 4 of the Provpass plan
// (audit/_plans_archive/2026-07-09-m3-rebuild-and-provpass-plan.md):
// wires the picker + instructions interstitial (PR 3) to the real engine
// (PR 2's lib/mock.ts + MockRunner) and the server session lifecycle.
//
// Screens:
//   1. Picker      — mode toggle (Riktigt/Genererat) + half toggle
//                    (Verbal/Kvantitativ). Authentic: listAuthenticPasses
//                    rows (least-exposed first, top one suggested).
//                    Synthetic: one CTA card, quota line + indikativ note.
//   2. ConfirmSheet — mandatory pre-commitment bottom sheet before ANY
//                    pass starts (replaces the old full-page Instructions
//                    interstitial; kallelsen-surfaces PR).
//   3. Running      — MockRunner mounted with a resolved plan + session.
//
// URL contract:
//   ?result=<id>    → MockResult for that id (refresh-proof deep link;
//                     MockRunner's onSettled navigates here).
//   ?run=1          → reserved (PR 3's search shape); not read here — a
//                     refresh mid-pass doesn't need it because the server
//                     session IS the running-phase signal (reload-adopt
//                     below re-derives `running` from the active kind=
//                     'mock' session, not from the URL).
//   ?devMinutes=N   → isDevSurface()-gated only: overrides the 55-minute
//                     duration for manual timeout/auto-submit testing.
//                     Never read outside a dev surface.
//   ?half=verbal|kvant&prescribed=1 → the scheduler's Kallelse mock item
//                     (lib/scheduler.ts mockItem) links here with the
//                     prescribed half. Seeds the picker's half toggle on
//                     mount so tapping Starta from the summons lands
//                     directly on the half the scheduler steered towards,
//                     rather than always defaulting to Verbal. `prescribed`
//                     is accepted but not read — the half alone is enough
//                     signal; it exists for possible future instrumentation
//                     (e.g. distinguishing a prescribed start from a picker
//                     start) and to keep the URL self-describing.
//
// Session metadata (mode/half/examId/provpass): the `sessions` table has
// no dedicated columns for these — `StartBody.sections` (worker/src/
// routes/sessions.ts) is a free-form string every OTHER session kind
// already uses for its own single-string tag (drill's section code), so
// a mock session encodes all four as `mode:half:examId:provpass` (blank
// examId/provpass for synthetic) via encodeMockSections/decodeMockSections
// below. Cheapest option that needs no schema migration; decode is
// defensive (falls back to void-and-picker) against any stored session
// that predates this encoding or was hand-edited.
//
// Reload-adopt: on mount, an active `kind='mock'` session is adopted if
// `startedAt` is within 55 minutes — the plan's qids are resolved back to
// Questions (loadBank + same resolvePlan idiom drill.tsx uses), the sheet
// is rebuilt from GET /sessions/:id/attempts (lib/mockSheet.ts
// sheetFromAttempts), and MockRunner mounts with that initialSheet so the
// clock (derived from the session's real startedAt, never reset) and the
// answer grid both resume intact. An active session older than 55 min is
// PATCH-ended silently (void — no result row, mistakes already persisted
// via MockRunner's per-pick attempts) and the picker renders instead.

import { useUser } from '@clerk/clerk-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react'

import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { useExposure, useMockResults } from '@/api/hooks/useMockResults'
import {
  useActiveSessionOfKind,
  useSessionAttempts,
  useStartSession,
  useUpdateSession,
} from '@/api/hooks/useSessions'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { ConfirmSheet } from '@/components/mock/ConfirmSheet'
import { MockResult } from '@/components/mock/MockResult'
import { MockRunner, type MockRunnerSession } from '@/components/mock/MockRunner'
import { Page } from '@/components/Page'
import { Btn } from '@/components/primitives'
import { TermHint } from '@/components/ui/TermHint'
import { findQuestion, loadBank, type Question } from '@/data/questions'
import { useViewport, type Viewport } from '@/hooks/useViewport'
import { isDevSurface } from '@/lib/devSurface'
import { seededRng } from '@/lib/drill'
import { formatPass, formatSitting } from '@/lib/examNames'
import { listAuthenticPasses, type PassOption, pickSynthetic, resolveAuthentic } from '@/lib/mock'
import { logMockEvent } from '@/lib/mockEvents'
import { sheetFromAttempts } from '@/lib/mockSheet'
import { useFirstContentSignal } from '@/lib/motion'

export type ProvSearch = {
  result?: number
  run?: 1
  devMinutes?: number
  half?: MockHalf
  prescribed?: 1
}

/** `sessions.sections` encoding for a mock session — see the header
 *  comment. `examId`/`provpass` are empty-string, not omitted, for a
 *  synthetic pass, so the field count stays fixed and parsing never
 *  confuses a colon inside an exam id (none exist today, but don't rely
 *  on it) with a missing trailing field. */
export function encodeMockSections(
  mode: MockMode,
  half: MockHalf,
  examId: string,
  provpass: string,
): string {
  return [mode, half, examId, provpass].join(':')
}

export type DecodedMockSections = {
  mode: MockMode
  half: MockHalf
  examId: string
  provpass: string
}

export function decodeMockSections(sections: string | null): DecodedMockSections | null {
  if (!sections) return null
  const parts = sections.split(':')
  if (parts.length !== 4) return null
  const [mode, half, examId, provpass] = parts
  if (mode !== 'authentic' && mode !== 'synthetic') return null
  if (half !== 'verbal' && half !== 'kvant') return null
  return { mode, half, examId, provpass }
}

export function validateSearch(input: Record<string, unknown>): ProvSearch {
  const out: ProvSearch = {}
  const result = input.result
  if (typeof result === 'number' && Number.isFinite(result)) out.result = result
  else if (typeof result === 'string' && result.length > 0 && Number.isFinite(Number(result))) {
    out.result = Number(result)
  }
  if (input.run === 1 || input.run === '1') out.run = 1
  const devMinutes = input.devMinutes
  if (typeof devMinutes === 'number' && Number.isFinite(devMinutes) && devMinutes > 0) {
    out.devMinutes = devMinutes
  } else if (
    typeof devMinutes === 'string' &&
    devMinutes.length > 0 &&
    Number.isFinite(Number(devMinutes)) &&
    Number(devMinutes) > 0
  ) {
    out.devMinutes = Number(devMinutes)
  }
  if (input.half === 'verbal' || input.half === 'kvant') out.half = input.half
  if (input.prescribed === 1 || input.prescribed === '1') out.prescribed = 1
  return out
}

export const Route = createFileRoute('/prov')({
  validateSearch,
  component: ProvRoute,
})

// Uniform quotas across all 27 exams — see the Provpass plan's
// "Verified facts" section. Duplicated (not imported) from lib/mock.ts's
// internal SYNTHETIC_QUOTAS, which isn't exported — this table is purely
// for the picker's "40 frågor · ORD 10 · …" copy line, not selection.
const VERBAL_QUOTA: ReadonlyArray<[string, number]> = [
  ['ORD', 10],
  ['LÄS', 10],
  ['MEK', 10],
  ['ELF', 10],
]
const KVANT_QUOTA: ReadonlyArray<[string, number]> = [
  ['XYZ', 12],
  ['KVA', 10],
  ['NOG', 6],
  ['DTK', 12],
]

function quotaLine(half: MockHalf): string {
  const quota = half === 'verbal' ? VERBAL_QUOTA : KVANT_QUOTA
  return `40 frågor · ${quota.map(([s, n]) => `${s} ${n}`).join(' · ')}`
}

/** 55 minutes, unless a dev surface asked for a shorter knob via
 *  `?devMinutes=N` (manual timeout/auto-submit verification only). */
export function resolveDurationMs(devMinutes: number | undefined): number {
  if (devMinutes != null && isDevSurface()) return devMinutes * 60_000
  return 55 * 60_000
}

/** How many of `plan`'s qids the user has at least one prior attempt on,
 *  per the exposure snapshot — the scalar MockRunner's `seenBefore` prop
 *  wants. Mirrors the per-question loop `listAuthenticPasses` runs
 *  internally (lib/mock.ts), but that helper only returns pass-level
 *  aggregates, not a standalone per-plan count. */
export function countSeenBefore(
  plan: readonly Question[],
  exposure: Record<string, { n: number }>,
): number {
  let n = 0
  for (const q of plan) {
    if ((exposure[q.qid]?.n ?? 0) > 0) n++
  }
  return n
}

type RunningState = {
  session: MockRunnerSession
  plan: Question[]
  seenBefore: number
  initialSheet?: ReturnType<typeof sheetFromAttempts>
  initialIndex?: number
}

function ProvRoute() {
  // Boot-veil content signal (#305 owner verdict) — /prov has no Skrift
  // block; the picker/instructions view renders from local data at mount.
  useFirstContentSignal()
  const navigate = useNavigate()
  const { result: resultId, devMinutes, half: prescribedHalf } = Route.useSearch()
  const resultsQuery = useMockResults()
  const exposureQuery = useExposure()
  const activeMock = useActiveSessionOfKind('mock')
  const startSession = useStartSession()
  const updateSession = useUpdateSession()
  // The Kallelse summons addresses the real signed-in candidate. Clerk's
  // `fullName` is the addressee line ("Inskriven: <name>"); fall back to
  // the first name, then null (KallelseCard drops the addressee line
  // entirely rather than printing a placeholder) while Clerk loads.
  const { user } = useUser()
  const candidateName = user?.fullName ?? user?.firstName ?? null

  // Idle-phase state machine: picker → instructions → running. `running`
  // is also entered directly by the reload-adopt effect below, without
  // passing through picker/instructions, when a fresh active mock session
  // is found on mount.
  const [phase, setPhase] = useState<'picker' | 'instructions' | 'running'>('picker')
  const [mode, setMode] = useState<MockMode>('authentic')
  // Seeded from `?half=` (the Kallelse summons's prescribed half) when
  // present, so tapping Starta from Home lands the picker directly on the
  // scheduler's steered half instead of always defaulting to Verbal. A
  // bare /prov visit (no query param) keeps the Verbal default.
  const [half, setHalf] = useState<MockHalf>(prescribedHalf ?? 'verbal')
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const [passes, setPasses] = useState<PassOption[]>([])
  const [running, setRunning] = useState<RunningState | null>(null)
  const [voidNotice, setVoidNotice] = useState(false)
  // The authentic pass the picker auto-picked (a sitting tap resolves to
  // its least-seen pass) and stashed for the confirm sheet + start flow.
  // null in synthetic mode (there is no single sitting).
  const [pendingPass, setPendingPass] = useState<PassOption | null>(null)
  // A fresh active mock session found on mount, resolved to a Question[]
  // plan, waiting on its attempts (useSessionAttempts below) before the
  // rehydrated sheet can be built and `running` can be set. null once
  // adoption has been decided one way or the other (adopted or voided) so
  // the once-per-mount decision doesn't re-fire on every query refetch.
  const [pendingAdopt, setPendingAdopt] = useState<{
    id: number
    startedAt: Date
    decoded: DecodedMockSections
    plan: Question[]
    currentQuestionId: string | null
  } | null>(null)
  const adoptDecidedRef = useRef(false)
  const adoptAttempts = useSessionAttempts(pendingAdopt?.id ?? null)

  useEffect(() => {
    loadBank().then(setBank)
  }, [])

  useEffect(() => {
    if (bank && exposureQuery.data) {
      setPasses(listAuthenticPasses([...bank], exposureQuery.data))
    }
  }, [bank, exposureQuery.data])

  // Reload-adopt, step 1: an active kind='mock' session exists on mount
  // (this device paused mid-pass, or another device left one running).
  // Fresh (< 55 min old, decodable `sections`, plan resolves to ≥1 live
  // question) → stash it in pendingAdopt so useSessionAttempts fetches its
  // attempts (step 2 below). Stale/undecodable/dead-plan → PATCH-end it
  // silently (void; mistakes already persisted per-pick, no result row —
  // this is NOT the user-facing "ogiltigt" notice, which is only for a
  // live abandon) and fall through to the picker. Decided at most once per
  // mount; activeMock naturally re-settles on its own refetch interval and
  // must not re-trigger this.
  useEffect(() => {
    if (!bank || activeMock.isLoading || adoptDecidedRef.current) return
    const existing = activeMock.data
    if (!existing) return
    adoptDecidedRef.current = true

    const decoded = decodeMockSections(existing.sections)
    const startedAtMs = existing.startedAt ? new Date(existing.startedAt).getTime() : Number.NaN
    const ageMs = Date.now() - startedAtMs
    const fresh =
      decoded != null && Number.isFinite(startedAtMs) && ageMs >= 0 && ageMs < 55 * 60_000
    const plan = fresh
      ? (existing.plan ?? [])
          .map((qid) => findQuestion(bank, qid))
          .filter((q): q is Question => q !== undefined)
      : []

    if (!fresh || plan.length === 0) {
      updateSession.mutate({ id: existing.id, patch: { end: true } })
      return
    }

    setPendingAdopt({
      id: existing.id,
      startedAt: new Date(startedAtMs),
      decoded,
      plan,
      currentQuestionId: existing.currentQuestionId,
    })
  }, [bank, activeMock.data, activeMock.isLoading, updateSession])

  // Reload-adopt, step 2: pendingAdopt's attempts have loaded — rebuild
  // the sheet and enter `running`.
  useEffect(() => {
    if (!pendingAdopt || adoptAttempts.isLoading || !adoptAttempts.data) return
    const initialSheet = sheetFromAttempts(adoptAttempts.data)
    const seekIdx = pendingAdopt.currentQuestionId
      ? pendingAdopt.plan.findIndex((q) => q.qid === pendingAdopt.currentQuestionId)
      : -1
    const seenBefore = exposureQuery.data
      ? countSeenBefore(pendingAdopt.plan, exposureQuery.data)
      : 0
    setRunning({
      session: {
        id: pendingAdopt.id,
        startedAt: pendingAdopt.startedAt,
        mode: pendingAdopt.decoded.mode,
        half: pendingAdopt.decoded.half,
        examId: pendingAdopt.decoded.examId || null,
        provpass: pendingAdopt.decoded.provpass || null,
      },
      plan: pendingAdopt.plan,
      seenBefore,
      initialSheet,
      initialIndex: seekIdx >= 0 ? seekIdx : 0,
    })
    setPhase('running')
    setPendingAdopt(null)
  }, [pendingAdopt, adoptAttempts.data, adoptAttempts.isLoading, exposureQuery.data])

  const startAuthentic = (pass: PassOption) => {
    if (!bank) return
    setPendingPass(pass)
    setMode('authentic')
    setHalf(pass.half)
    setPhase('instructions')
  }

  const startSynthetic = () => {
    setPendingPass(null)
    setMode('synthetic')
    setPhase('instructions')
  }

  const beginRun = async () => {
    if (!bank) return
    const plan =
      mode === 'authentic' && pendingPass
        ? resolveAuthentic([...bank], pendingPass.examId, pendingPass.provpass)
        : pickSynthetic([...bank], exposureQuery.data ?? {}, half, seededRng(Date.now()))
    if (plan.length === 0) return

    const qids = plan.map((q) => q.qid)
    const examId = mode === 'authentic' ? (pendingPass?.examId ?? '') : ''
    const provpass = mode === 'authentic' ? (pendingPass?.provpass ?? '') : ''
    const seenBefore = exposureQuery.data ? countSeenBefore(plan, exposureQuery.data) : 0

    startSession.mutate(
      {
        kind: 'mock',
        sections: encodeMockSections(mode, half, examId, provpass),
        plan: qids,
      },
      {
        onSuccess: (session) => {
          setRunning({
            session: {
              id: session.id,
              startedAt: session.startedAt ? new Date(session.startedAt) : new Date(),
              mode,
              half,
              examId: examId || null,
              provpass: provpass || null,
            },
            plan,
            seenBefore,
          })
          setPhase('running')
        },
      },
    )
  }

  const handleSettled = (result: { id: number }) => {
    setRunning(null)
    setPhase('picker')
    navigate({ to: '/prov', search: { result: result.id } })
  }

  const handleVoid = () => {
    logMockEvent('voided')
    setRunning(null)
    setPhase('picker')
    setVoidNotice(true)
  }

  // Deep-link to a result takes priority over the idle flow — refresh-
  // proof per the plan.
  if (resultId != null) {
    const row = resultsQuery.data?.find((r) => r.id === resultId)
    return (
      <MobileFrame tabs={false}>
        <Page>
          {row ? (
            <MockResult result={row} />
          ) : (
            <ResultNotFound loading={resultsQuery.isLoading} onHome={() => navigate({ to: '/' })} />
          )}
        </Page>
      </MobileFrame>
    )
  }

  if (phase === 'running' && running) {
    return (
      <MockRunner
        plan={running.plan}
        session={running.session}
        seenBefore={running.seenBefore}
        initialSheet={running.initialSheet}
        initialIndex={running.initialIndex}
        durationMsOverride={resolveDurationMs(devMinutes)}
        onSettled={handleSettled}
        onVoid={handleVoid}
      />
    )
  }

  return (
    <MobileFrame tabs={false}>
      <Page>
        {voidNotice && (
          <div data-testid="prov-void-notice" className="hpc-m3-frame" style={{ paddingBottom: 0 }}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--bad)',
                margin: '16px 0 0 0',
              }}
            >
              Provet avbröts — ogiltigt.
            </p>
          </div>
        )}
        {phase === 'picker' && (
          <Picker
            mode={mode}
            half={half}
            candidateName={candidateName}
            onModeChange={setMode}
            onHalfChange={setHalf}
            passes={passes}
            onStart={(pass) => {
              setVoidNotice(false)
              if (pass) startAuthentic(pass)
              else startSynthetic()
            }}
          />
        )}
        {phase === 'instructions' && (
          <ConfirmSheet
            half={half}
            target={
              mode === 'authentic' && pendingPass
                ? {
                    mode: 'authentic',
                    examId: pendingPass.examId,
                    provpass: pendingPass.provpass,
                    presented: pendingPass.presented,
                  }
                : { mode: 'synthetic' }
            }
            onConfirm={beginRun}
            onDismiss={() => setPhase('picker')}
          />
        )}
      </Page>
    </MobileFrame>
  )
}

function ResultNotFound({ loading, onHome }: { loading: boolean; onHome: () => void }) {
  return (
    <div data-testid="prov-result-not-found" className="hpc-m3-frame" style={{ paddingBottom: 96 }}>
      <section className="hpc-m3-section">
        <hr className="hpc-m3-rule" />
        <div className="hpc-m3-row">
          <div className="hpc-m3-meta">Provpass</div>
          <div className="hpc-m3-spine" />
          <div className="hpc-m3-content">
            <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
              {loading ? 'Laddar…' : 'Hittar inte resultatet.'}
            </h1>
            {!loading && (
              <>
                <p style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-2)' }}>
                  Det här provpasset finns inte längre, eller så laddades det aldrig upp.
                </p>
                <Btn variant="secondary" onClick={onHome} style={{ marginTop: 16 }}>
                  Hem
                </Btn>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

// ── Picker ───────────────────────────────────────────────────────────
// Exported (along with Instructions below) so component tests can
// render the idle-phase screens directly without mounting the router
// — ProvRoute itself is a thin router-aware shell around these two.

export type PickerProps = {
  mode: MockMode
  half: MockHalf
  /** The signed-in candidate's name for the Kallelse addressee line
   *  ("Inskriven: <name>"). null → the line is dropped (no placeholder). */
  candidateName?: string | null
  onModeChange: (mode: MockMode) => void
  onHalfChange: (half: MockHalf) => void
  /** Authentic-mode pass list, least-exposed first (lib/mock.ts's
   *  listAuthenticPasses) — `passes[0]` (filtered to the half) is the
   *  suggested "kallelse". Empty renders the "inga riktiga pass" state. */
  passes: PassOption[]
  /** Fired with the exact PassOption to start (a mobile sitting tap
   *  resolves to the sitting's least-seen pass; a desktop cell is the
   *  pass itself) so the route can resolve/start that exact
   *  exam+provpass — or with no arg on the synthetic CTA. */
  onStart: (pass?: PassOption) => void
  /** Test/dev override for viewport detection (mirrors HomeMobile's
   *  forceLayout) — production omits it and uses useViewport(). */
  forceViewport?: Viewport
}

// ── chronology (identical presentation order to the bake-off) ──────────

type SittingKey = { year: number; late: number; qualifier: number }

function sittingKey(examId: string): SittingKey {
  const m = /^(var|host)-(?:ver(\d+)-)?(\d{4})(?:-(\d+))?$/.exec(examId)
  if (!m) return { year: 0, late: 0, qualifier: 0 }
  const [, seasonKey, version, year, sitting] = m
  return {
    year: Number(year),
    late: seasonKey === 'host' ? 1 : 0,
    qualifier: Number(sitting ?? version ?? 0),
  }
}

/** Newest sitting first; höst after vår within a year; qualifier 1 before 2. */
function compareSittingsDesc(a: string, z: string): number {
  const ka = sittingKey(a)
  const kz = sittingKey(z)
  if (ka.year !== kz.year) return kz.year - ka.year
  if (ka.late !== kz.late) return kz.late - ka.late
  return ka.qualifier - kz.qualifier
}

type SittingRow = {
  examId: string
  /** Pass 1 / pass 2 of the CURRENT half (verb1+verb2 or kvant1+kvant2). */
  passes: [PassOption | undefined, PassOption | undefined]
}

function groupBySitting(halfPasses: PassOption[]): SittingRow[] {
  const byExam = new Map<string, SittingRow>()
  for (const p of halfPasses) {
    let row = byExam.get(p.examId)
    if (!row) {
      row = { examId: p.examId, passes: [undefined, undefined] }
      byExam.set(p.examId, row)
    }
    row.passes[p.provpass.endsWith('2') ? 1 : 0] = p
  }
  return [...byExam.values()].sort((a, z) => compareSittingsDesc(a.examId, z.examId))
}

/** The pass a sitting tap auto-picks: the sitting's first pass in the
 *  product's least-exposed-first ordering (`halfPasses` is already
 *  sorted by listAuthenticPasses), so tapping a row starts its
 *  least-seen pass without ever showing a "Provpass 1 / 2" menu. */
function leastSeenOf(row: SittingRow, ordered: PassOption[]): PassOption | undefined {
  return ordered.find((p) => p.examId === row.examId)
}

const PICKER_MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const pickerEyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const pickerMonoMeta: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: PICKER_MONO_TRACK,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

/** Mono "sett X/40" plus the red incompleteness flag when the parse is
 *  short — carried over from both bake-off parents as LAW. */
function ExposureLine({ pass, style }: { pass: PassOption; style?: CSSProperties }) {
  return (
    <span style={{ ...pickerMonoMeta, display: 'inline-flex', gap: 8, ...style }}>
      <span data-testid="prov-meta-exposure">
        sett {pass.seenBefore}/{pass.presented}
      </span>
      {pass.presented < 40 && (
        <span data-testid="prov-meta-completeness" style={{ color: 'var(--bad)' }}>
          {pass.presented}/40 frågor
        </span>
      )}
    </span>
  )
}

/** Dual-encoded micro-meter (B2's device, verbatim): track LENGTH =
 *  presented/40 (a short track IS the incompleteness flag), FILL =
 *  seenBefore, 1px per fråga. Decorative — the literal numbers live in
 *  ExposureLine and the button aria-label. */
function Meter({ pass, accent }: { pass: PassOption; accent?: boolean }) {
  return (
    <span
      aria-hidden
      style={{ position: 'relative', display: 'inline-block', width: 40, height: 4, flexShrink: 0 }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: Math.min(40, pass.presented),
          background: 'var(--hairline)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: Math.min(40, pass.seenBefore),
          background: accent ? 'var(--accent)' : 'var(--ink-2)',
        }}
      />
    </span>
  )
}

/** The Kallelse-lead: the least-exposed pass rendered as the house
 *  summons (accent-soft fill, accent top rule) with the real candidate
 *  addressee line. Starta commits the suggestion into the confirm sheet. */
function KallelseCard({
  pass,
  candidate,
  onStart,
}: {
  pass: PassOption
  candidate: string | null
  onStart: () => void
}) {
  return (
    <div
      data-testid="prov-kallelse"
      style={{
        background: 'var(--accent-soft)',
        borderTop: '2px solid var(--accent)',
        padding: '16px 18px 18px',
      }}
    >
      <div style={{ ...pickerEyebrow, color: 'var(--ink)' }}>Kallelse · minst sett</div>
      <h2
        className="hpc-m3-display"
        style={{ fontSize: 27, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.12 }}
      >
        {formatSitting(pass.examId)}
      </h2>
      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ ...pickerMonoMeta, color: 'var(--ink-2)' }}>
          {formatPass(pass.provpass)}
        </span>
        <span aria-hidden style={{ ...pickerMonoMeta, color: 'var(--ink-2)' }}>
          ·
        </span>
        <ExposureLine pass={pass} style={{ color: 'var(--ink-2)' }} />
      </div>
      {candidate && (
        <div style={{ marginTop: 13, display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              ...pickerMonoMeta,
              color: 'var(--ink-2)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Inskriven
          </span>
          <span
            data-testid="prov-kallelse-candidate"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 15.5,
              color: 'var(--ink)',
              borderBottom: '1px dotted var(--ink-2)',
              paddingBottom: 1,
              flex: 1,
            }}
          >
            {candidate}
          </span>
        </div>
      )}
      <div style={{ textAlign: 'right', marginTop: 14 }}>
        <button
          type="button"
          className="hpc-m3-cta"
          data-testid="prov-kallelse-start"
          onClick={onStart}
          style={{
            display: 'inline-block',
            borderRadius: 999,
            padding: '11px 22px',
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: PICKER_MONO_TRACK,
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Starta →
        </button>
      </div>
    </div>
  )
}

/** Mobile ledger row — the SITTING is the single tap target; inside it,
 *  micro-meters stacked tight, one per pass. No "Provpass N" text: the
 *  numbering is reference metadata that lives only in the confirm sheet.
 *  Tapping resolves to the sitting's least-seen pass and opens the sheet. */
function SittingLedgerRow({
  row,
  suggested,
  onTap,
}: {
  row: SittingRow
  suggested: PassOption | undefined
  onTap: () => void
}) {
  const present = row.passes.filter((p): p is PassOption => Boolean(p))
  const short = present.filter((p) => p.presented < 40)
  const label = [
    formatSitting(row.examId),
    ...present.map((p) => `${formatPass(p.provpass)} sett ${p.seenBefore} av ${p.presented}`),
  ].join(' · ')
  const isSuggested = (p: PassOption): boolean =>
    suggested !== undefined && p.examId === suggested.examId && p.provpass === suggested.provpass
  return (
    <button
      type="button"
      data-testid={`prov-sitting-${row.examId}`}
      onClick={onTap}
      aria-label={label}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: 'minmax(0,1fr) auto auto',
        gap: 14,
        alignItems: 'center',
        width: '100%',
        padding: '11px 6px',
        borderBottom: '1px solid var(--hairline-2)',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-display)',
            fontWeight: 500,
            fontSize: 16.5,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
          }}
        >
          {formatSitting(row.examId)}
        </span>
        {short.length > 0 && (
          <span
            data-testid="prov-meta-completeness"
            style={{ ...pickerMonoMeta, color: 'var(--bad)', display: 'block', marginTop: 2 }}
          >
            {short.map((p) => `${p.presented}/40 frågor`).join(' · ')}
          </span>
        )}
      </span>
      <span style={{ display: 'grid', gap: 3, justifyItems: 'end' }}>
        {present.map((p) => (
          <Meter key={p.provpass} pass={p} accent={isSuggested(p)} />
        ))}
      </span>
      <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 13 }}>
        →
      </span>
    </button>
  )
}

/** Desktop register cell — an explicit per-pass start affordance. Micro-
 *  meter + "sett X/40" + red incompleteness flag; the suggested cell
 *  carries the accent marker. Clicking starts THAT pass (through the same
 *  confirm sheet — one gate everywhere). */
function RegisterCell({
  pass,
  suggested,
  onStart,
}: {
  pass: PassOption | undefined
  suggested: boolean
  onStart: () => void
}) {
  if (!pass) {
    return (
      <span aria-hidden style={{ ...pickerMonoMeta, color: 'var(--muted-2)', padding: '7px 8px' }}>
        —
      </span>
    )
  }
  return (
    <button
      type="button"
      data-testid={`prov-pass-${pass.examId}-${pass.provpass}`}
      onClick={onStart}
      aria-label={`${formatSitting(pass.examId)} · ${formatPass(pass.provpass)} · sett ${pass.seenBefore} av ${pass.presented}`}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 8px',
        borderLeft: suggested ? '2px solid var(--accent)' : '2px solid transparent',
        minWidth: 0,
      }}
    >
      <Meter pass={pass} accent={suggested} />
      <span
        data-testid="prov-meta-exposure"
        style={{
          ...pickerMonoMeta,
          color: suggested ? 'var(--accent)' : 'var(--muted)',
          whiteSpace: 'nowrap',
        }}
      >
        sett {pass.seenBefore}/{pass.presented}
      </span>
      {pass.presented < 40 && (
        <span
          data-testid="prov-meta-completeness"
          style={{ ...pickerMonoMeta, color: 'var(--bad)', whiteSpace: 'nowrap' }}
        >
          {pass.presented}/40 frågor
        </span>
      )}
      {suggested && (
        <span
          data-testid="prov-meta-suggested"
          style={{
            ...pickerMonoMeta,
            color: 'var(--accent)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          minst sett
        </span>
      )}
    </button>
  )
}

/** Desktop MINST SETT strip — position:sticky inside the register so the
 *  recommendation follows the matrix once the Kallelse card scrolls away.
 *  Starta commits the suggested pass through the same confirm sheet. */
function MinstSettStrip({ pass, onStart }: { pass: PassOption; onStart: () => void }) {
  return (
    <div
      data-testid="prov-minst-sett"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        background: 'var(--accent-soft)',
        borderTop: '2px solid var(--accent)',
        padding: '10px 14px',
        marginBottom: 14,
      }}
    >
      <span style={{ ...pickerEyebrow, color: 'var(--ink)' }}>Minst sett</span>
      <span style={{ ...pickerMonoMeta, color: 'var(--ink)', fontSize: 12 }}>
        {formatSitting(pass.examId)} · {formatPass(pass.provpass)}
      </span>
      <ExposureLine pass={pass} style={{ color: 'var(--ink-2)' }} />
      <button
        type="button"
        data-testid="prov-minst-sett-start"
        onClick={onStart}
        style={{
          all: 'unset',
          cursor: 'pointer',
          marginLeft: 'auto',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
        }}
      >
        Starta →
      </button>
    </div>
  )
}

// ── Picker ───────────────────────────────────────────────────────────
// The production port of the provpass-picker bake-off winner (PPH ·
// "Kallelsen & registret"). Exported so component/verify surfaces can
// render the idle-phase picker directly without mounting the router —
// ProvRoute is a thin router-aware shell around it.
//
// Structure (both breakpoints share the house rail chassis):
//   Kallelse-lead — the least-exposed pass as a summons, addressed to the
//     real candidate, Starta commits it.
//   Register — chronological sittings, newest first. MOBILE: one tap
//     target per sitting, its passes shown only as stacked micro-meters
//     (tap → auto-pick least-seen → confirm sheet; no pass menu). DESKTOP:
//     an explicit sitting × pass matrix with a sticky MINST SETT strip and
//     per-pass start affordances. Every start — mobile tap, desktop cell,
//     Kallelse, strip — goes through the one confirm sheet.

export function Picker({
  mode,
  half,
  candidateName = null,
  onModeChange,
  onHalfChange,
  passes,
  onStart,
  forceViewport,
}: PickerProps) {
  const detectedViewport = useViewport()
  const viewport = forceViewport ?? detectedViewport
  const isPhone = viewport === 'phone'

  const halfPasses = useMemo(() => passes.filter((p) => p.half === half), [passes, half])
  const suggested = halfPasses[0]
  const sittings = useMemo(() => groupBySitting(halfPasses), [halfPasses])
  const isSuggestedPass = (p: PassOption | undefined): boolean =>
    p !== undefined &&
    suggested !== undefined &&
    p.examId === suggested.examId &&
    p.provpass === suggested.provpass

  return (
    <div className="hpc-m3-frame" style={{ paddingBottom: 96 }} data-testid="prov-picker">
      <DrillRailSection
        meta={
          <>
            <strong>Provpass</strong>
            hela provet
          </>
        }
        delay={0}
      >
        <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
          Anmälan.
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            marginTop: 12,
          }}
        >
          40 frågor, 55 minuter, riktiga provvillkor — ingen feedback förrän du lämnar in.
        </p>
      </DrillRailSection>

      <DrillRailSection meta="Läge" delay={100}>
        <ToggleRow
          testidPrefix="prov-mode"
          value={mode}
          onChange={(v) => onModeChange(v as MockMode)}
          options={[
            { value: 'authentic', label: 'Riktigt pass' },
            { value: 'synthetic', label: 'Genererat pass' },
          ]}
        />
      </DrillRailSection>

      <DrillRailSection meta="Halva" delay={140}>
        <ToggleRow
          testidPrefix="prov-half"
          value={half}
          onChange={(v) => onHalfChange(v as MockHalf)}
          options={[
            { value: 'verbal', label: 'Verbal' },
            { value: 'kvant', label: 'Kvantitativ' },
          ]}
        />
      </DrillRailSection>

      {mode === 'authentic' ? (
        halfPasses.length === 0 ? (
          <DrillRailSection meta="Välj pass" delay={180} testid="prov-authentic-list">
            <p
              data-testid="prov-authentic-empty"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                color: 'var(--ink-2)',
                margin: 0,
              }}
            >
              Inga riktiga pass tillgängliga just nu för {half === 'verbal' ? 'verbal' : 'kvant'}.
              Prova ett genererat pass istället.
            </p>
          </DrillRailSection>
        ) : (
          <>
            <DrillRailSection meta="Kallelse" delay={180}>
              {suggested && (
                <div style={{ maxWidth: 560 }}>
                  <KallelseCard
                    pass={suggested}
                    candidate={candidateName}
                    onStart={() => onStart(suggested)}
                  />
                </div>
              )}
            </DrillRailSection>

            <DrillRailSection
              meta={
                <>
                  <strong>Register</strong>
                  {sittings.length} provtillfällen
                </>
              }
              delay={220}
              testid="prov-authentic-list"
            >
              {isPhone ? (
                <div>
                  {sittings.map((row) => (
                    <SittingLedgerRow
                      key={row.examId}
                      row={row}
                      suggested={suggested}
                      onTap={() => {
                        const p = leastSeenOf(row, halfPasses)
                        if (p) onStart(p)
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div style={{ maxWidth: 880 }}>
                  {suggested && (
                    <MinstSettStrip pass={suggested} onStart={() => onStart(suggested)} />
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr' }}>
                    <span style={{ ...pickerEyebrow, fontSize: 10, padding: '0 8px 6px 0' }}>
                      Provtillfälle
                    </span>
                    <span style={{ ...pickerEyebrow, fontSize: 10, padding: '0 8px 6px' }}>
                      Provpass 1
                    </span>
                    <span style={{ ...pickerEyebrow, fontSize: 10, padding: '0 8px 6px' }}>
                      Provpass 2
                    </span>
                    {sittings.map((row) => (
                      <div
                        key={row.examId}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '250px 1fr 1fr',
                          gridColumn: '1 / -1',
                          alignItems: 'center',
                          borderTop: '1px solid var(--hairline-2)',
                          minHeight: 34,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: 12.5,
                            letterSpacing: PICKER_MONO_TRACK,
                            color: 'var(--ink)',
                            fontVariantNumeric: 'tabular-nums',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {formatSitting(row.examId)}
                        </span>
                        <RegisterCell
                          pass={row.passes[0]}
                          suggested={isSuggestedPass(row.passes[0])}
                          onStart={() => row.passes[0] && onStart(row.passes[0])}
                        />
                        <RegisterCell
                          pass={row.passes[1]}
                          suggested={isSuggestedPass(row.passes[1])}
                          onStart={() => row.passes[1] && onStart(row.passes[1])}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DrillRailSection>
          </>
        )
      ) : (
        <DrillRailSection meta="Genererat" delay={180}>
          <button
            type="button"
            data-testid="prov-synthetic-cta"
            onClick={() => onStart()}
            style={{
              all: 'unset',
              cursor: 'pointer',
              display: 'block',
              width: '100%',
              boxSizing: 'border-box',
              background: 'var(--panel)',
              border: '1px solid var(--hairline)',
              borderRadius: 'var(--radius)',
              padding: 'var(--pad-lg)',
            }}
          >
            <h2 className="hpc-m3-h" style={{ marginTop: 0 }}>
              Starta genererat pass
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                color: 'var(--muted)',
                margin: '8px 0 0 0',
              }}
            >
              {quotaLine(half)}
            </p>
          </button>
          {/* P2.2: moved OUT of the CTA button — TermHint is itself a
           *  button, and nested interactive elements are invalid HTML
           *  (and the hint tap would have started the pass). */}
          <p
            data-testid="prov-synthetic-note"
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              // WCAG AA: --muted-2 fails 4.5:1 at 13px — --muted passes.
              color: 'var(--muted)',
              margin: '10px 0 0 0',
            }}
          >
            <TermHint term="indikativ" tail=" resultat — inte ett riktigt pass.">
              Indikativt
            </TermHint>
          </p>
        </DrillRailSection>
      )}
    </div>
  )
}

function ToggleRow<T extends string>({
  value,
  onChange,
  options,
  testidPrefix,
}: {
  value: T
  onChange: (v: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  testidPrefix: string
}) {
  return (
    <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            data-testid={`${testidPrefix}-${opt.value}`}
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: active ? 'var(--ink)' : 'var(--muted-2)',
              borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
              paddingBottom: 2,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
