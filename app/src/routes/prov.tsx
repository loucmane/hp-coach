// /prov — Provpass (mock exam) entry surface. PR 3 of the Provpass
// plan (audit/_plans_archive/2026-07-09-m3-rebuild-and-provpass-plan.md):
// picker + mandatory pre-pass instructions + a placeholder running slot.
// This route is PRESENTATIONAL — the actual mock engine (question
// selection, countdown, answer sheet, MockRunner) is owned by a
// parallel PR and does not exist yet. `<div data-testid="mock-runner-slot" />`
// is where PR 4 mounts the real runner.
//
// Screens (idle-phase only, no session in flight):
//   1. Picker      — mode toggle (Riktigt/Genererat) + half toggle
//                    (Verbal/Kvantitativ). Authentic: a list of
//                    PassOption rows (least-exposed first, top one
//                    suggested). Synthetic: one CTA card with the
//                    quota line + an "indikativt resultat" note.
//   2. Instructions — mandatory interstitial before ANY pass starts.
//                    Single "Starta provpasset →" CTA.
//   3. Running      — placeholder slot (PR 4 mounts MockRunner here).
//
// URL contract:
//   ?result=<id>  → show MockResult for that id (refresh-proof deep
//                   link — PR 4's runner will `navigate` here on
//                   submit/timeout).
//   ?run=1        → reserved for the running phase (PR 4).
// Neither is read by this PR beyond dispatching to the placeholder /
// MockResult — PR 4 wires the real transitions between screens.

import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'

import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { useMockResults } from '@/api/hooks/useMockResults'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { MockResult } from '@/components/mock/MockResult'
import type { PassOption } from '@/components/mock/passOption'
import { Page } from '@/components/Page'
import { Btn } from '@/components/primitives'

type ProvSearch = { result?: number; run?: 1 }

function validateSearch(input: Record<string, unknown>): ProvSearch {
  const out: ProvSearch = {}
  const result = input.result
  if (typeof result === 'number' && Number.isFinite(result)) out.result = result
  else if (typeof result === 'string' && result.length > 0 && Number.isFinite(Number(result))) {
    out.result = Number(result)
  }
  if (input.run === 1 || input.run === '1') out.run = 1
  return out
}

export const Route = createFileRoute('/prov')({
  validateSearch,
  component: ProvRoute,
})

// Uniform quotas across all 27 exams — see the Provpass plan's
// "Verified facts" section. Kept local to this presentational PR;
// PR 2's `lib/mock.ts` owns the actual selection logic and may
// re-export or duplicate this table.
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

function ProvRoute() {
  const navigate = useNavigate()
  const { result: resultId } = Route.useSearch()
  const resultsQuery = useMockResults()

  // Local idle-phase state machine: picker → instructions → running.
  // PR 4 replaces `phase === 'running'` with a real MockRunner mount
  // and wires submit/timeout to `navigate({ search: { result } })`.
  const [phase, setPhase] = useState<'picker' | 'instructions' | 'running'>('picker')
  const [mode, setMode] = useState<MockMode>('authentic')
  const [half, setHalf] = useState<MockHalf>('verbal')

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

  return (
    <MobileFrame tabs={false}>
      <Page>
        {phase === 'picker' && (
          <Picker
            mode={mode}
            half={half}
            onModeChange={setMode}
            onHalfChange={setHalf}
            passes={[]}
            onStart={() => setPhase('instructions')}
          />
        )}
        {phase === 'instructions' && (
          <Instructions onStart={() => setPhase('running')} onBack={() => setPhase('picker')} />
        )}
        {phase === 'running' && <div data-testid="mock-runner-slot" />}
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
  /** Authentic-mode pass list. Empty in this PR (PR 4 wires the real
   *  `listAuthenticPasses` call from lib/mock.ts) — the empty state
   *  renders instead. */
  passes: PassOption[]
  onStart: () => void
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
                  onStart={onStart}
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
            onClick={onStart}
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
