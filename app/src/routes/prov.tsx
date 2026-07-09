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
//   2. Instructions — mandatory interstitial before ANY pass starts.
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

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'

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
import { MockResult } from '@/components/mock/MockResult'
import { MockRunner, type MockRunnerSession } from '@/components/mock/MockRunner'
import { Page } from '@/components/Page'
import { Btn } from '@/components/primitives'
import { findQuestion, loadBank, type Question } from '@/data/questions'
import { isDevSurface } from '@/lib/devSurface'
import { seededRng } from '@/lib/drill'
import { listAuthenticPasses, type PassOption, pickSynthetic, resolveAuthentic } from '@/lib/mock'
import { sheetFromAttempts } from '@/lib/mockSheet'

export type ProvSearch = { result?: number; run?: 1; devMinutes?: number }

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
  const navigate = useNavigate()
  const { result: resultId, devMinutes } = Route.useSearch()
  const resultsQuery = useMockResults()
  const exposureQuery = useExposure()
  const activeMock = useActiveSessionOfKind('mock')
  const startSession = useStartSession()
  const updateSession = useUpdateSession()

  // Idle-phase state machine: picker → instructions → running. `running`
  // is also entered directly by the reload-adopt effect below, without
  // passing through picker/instructions, when a fresh active mock session
  // is found on mount.
  const [phase, setPhase] = useState<'picker' | 'instructions' | 'running'>('picker')
  const [mode, setMode] = useState<MockMode>('authentic')
  const [half, setHalf] = useState<MockHalf>('verbal')
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const [passes, setPasses] = useState<PassOption[]>([])
  const [running, setRunning] = useState<RunningState | null>(null)
  const [voidNotice, setVoidNotice] = useState(false)
  const [pendingExamId, setPendingExamId] = useState<string | null>(null)
  const [pendingProvpass, setPendingProvpass] = useState<string | null>(null)
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
    setPendingExamId(pass.examId)
    setPendingProvpass(pass.provpass)
    setMode('authentic')
    setHalf(pass.half)
    setPhase('instructions')
  }

  const startSynthetic = () => {
    setPendingExamId(null)
    setPendingProvpass(null)
    setPhase('instructions')
  }

  const beginRun = async () => {
    if (!bank) return
    const plan =
      mode === 'authentic' && pendingExamId && pendingProvpass
        ? resolveAuthentic([...bank], pendingExamId, pendingProvpass)
        : pickSynthetic([...bank], exposureQuery.data ?? {}, half, seededRng(Date.now()))
    if (plan.length === 0) return

    const qids = plan.map((q) => q.qid)
    const examId = mode === 'authentic' ? (pendingExamId ?? '') : ''
    const provpass = mode === 'authentic' ? (pendingProvpass ?? '') : ''
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
          <Instructions onStart={beginRun} onBack={() => setPhase('picker')} />
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
  onModeChange: (mode: MockMode) => void
  onHalfChange: (half: MockHalf) => void
  /** Authentic-mode pass list, least-exposed first (lib/mock.ts's
   *  listAuthenticPasses) — the top row renders "föreslagen". Empty
   *  renders the "inga riktiga pass" empty state. */
  passes: PassOption[]
  /** Fired on a synthetic-CTA click (no arg) or an authentic pass ROW
   *  click (the clicked PassOption, so PR4's route can resolve/start
   *  that exact exam+provpass instead of only ever the suggested one). */
  onStart: (pass?: PassOption) => void
}

export function Picker({ mode, half, onModeChange, onHalfChange, passes, onStart }: PickerProps) {
  const halfPasses = useMemo(() => passes.filter((p) => p.half === half), [passes, half])

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
          Kör provpasset.
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
        <DrillRailSection meta="Välj pass" delay={180} testid="prov-authentic-list">
          {halfPasses.length === 0 ? (
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
          ) : (
            <div>
              {halfPasses.map((p, i) => (
                <AuthenticPassRow
                  key={`${p.examId}-${p.provpass}`}
                  pass={p}
                  suggested={i === 0}
                  onStart={() => onStart(p)}
                />
              ))}
            </div>
          )}
        </DrillRailSection>
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
            <p
              data-testid="prov-synthetic-note"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 13,
                color: 'var(--muted-2)',
                margin: '10px 0 0 0',
              }}
            >
              Indikativt resultat — inte ett riktigt pass.
            </p>
          </button>
        </DrillRailSection>
      )}
    </div>
  )
}

function AuthenticPassRow({
  pass,
  suggested,
  onStart,
}: {
  pass: PassOption
  suggested: boolean
  onStart: () => void
}) {
  const incomplete = pass.presented < 40
  return (
    <button
      type="button"
      data-testid={`prov-pass-${pass.examId}-${pass.provpass}`}
      onClick={onStart}
      style={{
        all: 'unset',
        cursor: 'pointer',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        gap: 12,
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
        padding: '14px 0',
        borderBottom: '1px solid var(--hairline-2)',
        background: suggested ? 'var(--panel-2)' : 'transparent',
        paddingInline: suggested ? 12 : 0,
        borderRadius: suggested ? 'calc(var(--radius) * 0.5)' : 0,
      }}
    >
      <span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            color: 'var(--ink)',
            display: 'block',
          }}
        >
          {pass.examId} · {pass.provpass}
          {suggested && (
            <span
              data-testid="prov-pass-suggested"
              style={{
                marginLeft: 8,
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              föreslagen
            </span>
          )}
        </span>
        <span
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 4,
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--muted)',
          }}
        >
          <span data-testid="prov-pass-exposure">
            sett {pass.seenBefore}/{pass.presented}
          </span>
          {incomplete && (
            <span data-testid="prov-pass-completeness" style={{ color: 'var(--bad)' }}>
              {pass.presented}/40 frågor
            </span>
          )}
        </span>
      </span>
      <span aria-hidden style={{ color: 'var(--muted-2)' }}>
        →
      </span>
    </button>
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

// ── Instructions interstitial ───────────────────────────────────────

export function Instructions({ onStart, onBack }: { onStart: () => void; onBack: () => void }) {
  const rules = [
    '40 frågor',
    '55 minuter',
    'ingen paus',
    'du kan ändra svar tills tiden går ut',
    'avbryter du blir provet ogiltigt',
    'lämna ingen fråga obesvarad — fel ger inga avdrag',
  ]
  return (
    <div className="hpc-m3-frame" style={{ paddingBottom: 96 }} data-testid="prov-instructions">
      <DrillRailSection meta="Innan du kör" delay={0}>
        <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
          Riktiga provvillkor.
        </h1>
        <ul
          data-testid="prov-instructions-rules"
          style={{
            listStyle: 'none',
            margin: '16px 0 0 0',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {rules.map((r) => (
            <li
              key={r}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 15,
                lineHeight: 1.5,
                color: 'var(--ink-2)',
                paddingLeft: 18,
                position: 'relative',
              }}
            >
              <span aria-hidden style={{ position: 'absolute', left: 0, color: 'var(--accent)' }}>
                ·
              </span>
              {r}
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <Btn variant="primary" size="lg" data-testid="prov-instructions-start" onClick={onStart}>
            Starta provpasset →
          </Btn>
          <Btn variant="ghost" onClick={onBack} data-testid="prov-instructions-back">
            Tillbaka
          </Btn>
        </div>
      </DrillRailSection>
    </div>
  )
}
