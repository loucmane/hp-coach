// Non-drill scenes for /dev/ovningstext-bakeoff:
//
//   EstimateScene  the estimate caveat on the three surfaces that show an
//                  LÄS/ELF-based estimate — the Provpass result head
//                  (MockResult), Home's prognosis row (HomeMobile) and
//                  Framsteg's hero + section ledger (ProgressMobile)
//   RetiredScene   a completed pass's facit (DrillResult) where one unit
//                  has since been retired: the answers stay, the text is
//                  not served, the notice stands in its place
//
// Each surface is re-composed from its live markup and .hpc-m3-* classes
// with fixture numbers (the live screens read the account's stats, which a
// fixture page must not wire). The numbers are invented and only need to
// be plausible; the scene is about where the caveat attaches.

import { type CSSProperties, type ReactNode, useId, useState } from 'react'

import { type DrillLayout, QuestionPage } from '@/components/devbake/OvningstextDrill'
import {
  CaveatBox,
  CaveatFootnote,
  CaveatLine,
  CaveatMarker,
  RetiredBandNotice,
  RetiredInlineNotice,
  RetiredTagNotice,
  Tag,
  UnitBand,
  type VariantKey,
} from '@/components/devbake/OvningstextKit'
import { LAS_UNIT, RETIRED_UNIT } from '@/components/devbake/ovningstextFixtures'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { Eyebrow } from '@/components/primitives'
import type { AnswerLetter } from '@/data/questions'
import { daysUntil, EXAM_SITTINGS, formatSwedishHeader } from '@/lib/dates'

// A fixed "today" keeps every screenshot identical.
const TODAY = new Date(2026, 9, 9, 19, 0)
const SITTING = EXAM_SITTINGS[0]
const DAYS_LEFT = daysUntil(SITTING.date, TODAY)

// ── Scene 6 · estimates ──────────────────────────────────────────────

export function EstimateScene({ variant }: { variant: VariantKey }) {
  return (
    <div data-testid="ovn-estimates" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <SurfaceCaption>Provpass · resultatsidan efter ett verbalt pass</SurfaceCaption>
      <ProvpassResultHead variant={variant} />
      <SurfaceCaption>Hem · prognosraden</SurfaceCaption>
      <HomeHead variant={variant} />
      <SurfaceCaption>Framsteg · huvudsiffran och sektionerna</SurfaceCaption>
      <ProgressHead variant={variant} />
    </div>
  )
}

const VERBAL_PASS: { section: string; correct: number; presented: number }[] = [
  { section: 'ORD', correct: 8, presented: 10 },
  { section: 'LÄS', correct: 7, presented: 10 },
  { section: 'MEK', correct: 8, presented: 10 },
  { section: 'ELF', correct: 6, presented: 10 },
]

/** MockResult's head + per-section bars. */
function ProvpassResultHead({ variant }: { variant: VariantKey }) {
  const footnoteId = useId()
  return (
    <div className="hpc-m3-page">
      <div className="hpc-m3-frame" style={{ paddingBottom: 48 }}>
        <DrillRailSection
          meta={
            <>
              <strong>Verbal</strong>
              genererat pass
            </>
          }
        >
          <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
            Provpasset klart.
          </h1>
          <div className="hpc-m3-stats">
            <div>
              <div className="hpc-m3-stat-n">29 av 40</div>
              <div className="hpc-m3-stat-l">rätt</div>
            </div>
            <div aria-describedby={variant === 'a' ? footnoteId : undefined}>
              <div className="hpc-m3-stat-n">
                1,25
                {variant === 'a' && <CaveatMarker />}
              </div>
              <div className="hpc-m3-stat-l">skattad poäng · 0–2,0</div>
            </div>
          </div>
          <p style={disclaimer}>Linjär skattning — indikativ, inte UHR-normerad.</p>
          {variant === 'a' && <CaveatFootnote id={footnoteId} />}
          {variant === 'b' && <CaveatBox />}
          {variant === 'c' && <CaveatLine />}
        </DrillRailSection>
        <DrillRailSection meta="Per sektion">
          <h2 className="hpc-m3-h">Så gick det per sektion</h2>
          {VERBAL_PASS.map((s) => (
            <SectionBar key={s.section} {...s} />
          ))}
        </DrillRailSection>
      </div>
    </div>
  )
}

/** HomeMobile's greeting section and stats row. */
function HomeHead({ variant }: { variant: VariantKey }) {
  const footnoteId = useId()
  return (
    <div className="hpc-m3-page">
      <div className="hpc-m3-frame" style={{ paddingBottom: 48 }}>
        <DrillRailSection
          meta={
            <>
              <strong>{formatSwedishHeader(TODAY)}</strong>
              {DAYS_LEFT} dagar · {SITTING.label.toLowerCase()}
            </>
          }
        >
          <h1 className="hpc-m3-display">God kväll.</h1>
          <div className="hpc-m3-stats">
            <div aria-describedby={variant === 'a' ? footnoteId : undefined}>
              <div className="hpc-m3-stat-n">
                1,4
                {variant === 'a' && <CaveatMarker />}
              </div>
              <div className="hpc-m3-stat-l">prognos av 2,0</div>
              <div className="hpc-m3-stat-d">+0,1 sedan förra veckan</div>
            </div>
            <div>
              <div className="hpc-m3-stat-n">24</div>
              <div className="hpc-m3-stat-l">minuter idag</div>
            </div>
          </div>
          {variant === 'a' && <CaveatFootnote id={footnoteId} />}
          {variant === 'b' && <CaveatBox />}
          {variant === 'c' && <CaveatLine />}
        </DrillRailSection>
      </div>
    </div>
  )
}

const LEDGER: {
  section: string
  score: string
  band: string
  arrow: string
  attempts: number
  confidence: string
}[] = [
  { section: 'ORD', score: '1,52', band: '0,06', arrow: '→', attempts: 142, confidence: 'hög' },
  { section: 'LÄS', score: '1,25', band: '0,12', arrow: '↗', attempts: 38, confidence: 'medel' },
  { section: 'MEK', score: '1,47', band: '0,08', arrow: '→', attempts: 96, confidence: 'hög' },
  { section: 'ELF', score: '1,12', band: '0,14', arrow: '↗', attempts: 31, confidence: 'medel' },
  { section: 'XYZ', score: '1,44', band: '0,07', arrow: '↗', attempts: 120, confidence: 'hög' },
  { section: 'KVA', score: '1,38', band: '0,09', arrow: '→', attempts: 88, confidence: 'hög' },
  { section: 'NOG', score: '1,30', band: '0,15', arrow: '↘', attempts: 24, confidence: 'låg' },
  { section: 'DTK', score: '1,49', band: '0,08', arrow: '→', attempts: 101, confidence: 'hög' },
]

const P5_SECTIONS = new Set(['LÄS', 'ELF'])

/** ProgressMobile's hero prognosis, written week and section ledger. */
function ProgressHead({ variant }: { variant: VariantKey }) {
  const footnoteId = useId()
  return (
    <div className="hpc-m3-page">
      <div className="hpc-m3-frame" style={{ paddingBottom: 72 }}>
        <DrillRailSection
          meta={
            <>
              <strong>Framsteg</strong>
              {DAYS_LEFT} dagar · {SITTING.label.toLowerCase()}
            </>
          }
        >
          <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
            <span aria-describedby={variant === 'a' ? footnoteId : undefined}>
              1,37
              {variant === 'a' && <CaveatMarker />}
            </span>
            <span style={{ fontSize: '0.45em', color: 'var(--muted)' }}> av 2,0</span>
          </h1>
          <p style={paragraph}>
            Prognosen steg <Strong>+0,04</Strong> den här veckan — 86 frågor med 71 % träffsäkerhet,
            6:e dagen i rad. Kvant (<Strong>1,40</Strong>) drar ifrån verbal (<Strong>1,34</Strong>
            ); gapet upp till målet 1,8 bärs framför allt av <Strong>ELF 1,12</Strong> och{' '}
            <Strong>LÄS 1,25</Strong>.
          </p>
          {variant === 'b' && <CaveatBox />}
          {variant === 'c' && <CaveatLine />}
        </DrillRailSection>
        <DrillRailSection meta="Sektioner">
          <h2 className="hpc-m3-h">Var poängen finns</h2>
          <div>
            {LEDGER.map((row) => {
              const p5 = P5_SECTIONS.has(row.section)
              return (
                <div
                  key={row.section}
                  className="hpc-m3-trap"
                  aria-describedby={variant === 'a' && p5 ? footnoteId : undefined}
                >
                  <span className="hpc-m3-trap-t">
                    <span className="hpc-m3-tag">{row.section}</span>
                    <span
                      style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}
                    >
                      {row.score}
                      {variant === 'a' && p5 && <CaveatMarker />}
                    </span>
                    <span style={{ ...mono11, marginLeft: 8 }}>±{row.band}</span>
                    <span
                      style={{
                        marginLeft: 10,
                        color: row.arrow === '↘' ? 'var(--bad)' : 'var(--ink-2)',
                        fontSize: 13,
                      }}
                    >
                      {row.arrow}
                    </span>
                    {variant === 'b' && p5 && (
                      <span style={{ marginLeft: 10 }}>
                        <Tag small />
                      </span>
                    )}
                  </span>
                  <span className="hpc-m3-trap-n">
                    {row.attempts} försök · {row.confidence}
                  </span>
                </div>
              )
            })}
          </div>
          {variant === 'a' && <CaveatFootnote id={footnoteId} />}
        </DrillRailSection>
      </div>
    </div>
  )
}

function SectionBar({
  section,
  correct,
  presented,
}: {
  section: string
  correct: number
  presented: number
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0' }}>
      <Eyebrow style={{ width: 40, flexShrink: 0 }}>{section}</Eyebrow>
      <div
        style={{
          flex: 1,
          height: 6,
          background: 'var(--panel-2)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${(correct / presented) * 100}%`,
            height: '100%',
            background: 'var(--accent)',
          }}
        />
      </div>
      <span
        style={{
          ...mono11,
          fontSize: 12,
          color: 'var(--ink-2)',
          width: 48,
          textAlign: 'right',
        }}
      >
        {correct}/{presented}
      </span>
    </div>
  )
}

// ── Scene 7 · a retired unit in history ──────────────────────────────

type FacitEntry =
  | { kind: 'live'; qIndex: number; picked: AnswerLetter }
  | { kind: 'retired'; n: number; picked: AnswerLetter; answer: AnswerLetter }

// An invented history: LAS_UNIT's two questions, then the four questions of
// the since-retired las-b5-001 with their real keys.
const LIVE_PICKS: AnswerLetter[] = ['D', 'C']
const RETIRED_PICKS: AnswerLetter[] = ['A', 'B', 'B', 'A']

const FACIT: FacitEntry[] = [
  ...LIVE_PICKS.map((picked, qIndex): FacitEntry => ({ kind: 'live', qIndex, picked })),
  ...RETIRED_UNIT.keys.map(
    (answer, i): FacitEntry => ({ kind: 'retired', n: i + 1, picked: RETIRED_PICKS[i], answer }),
  ),
]

function entryAnswer(e: FacitEntry): AnswerLetter {
  return e.kind === 'live' ? LAS_UNIT.questions[e.qIndex].answer : e.answer
}

export function RetiredScene({ variant, layout }: { variant: VariantKey; layout: DrillLayout }) {
  const [open, setOpen] = useState<number | null>(null)
  const right = FACIT.filter((e) => e.picked === entryAnswer(e)).length
  // A retired unit's misses leave the repetition queue (design §3 C), so
  // only the live unit's miss is counted here.
  const toRepeat = FACIT.filter((e) => e.kind === 'live' && e.picked !== entryAnswer(e)).length
  const firstRetired = FACIT.findIndex((e) => e.kind === 'retired')

  const row = (e: FacitEntry, i: number) =>
    e.kind === 'live' ? (
      <LiveFacitRow
        key={`live-${e.qIndex}`}
        variant={variant}
        layout={layout}
        index={i}
        qIndex={e.qIndex}
        picked={e.picked}
        open={open === i}
        onToggle={() => setOpen(open === i ? null : i)}
      />
    ) : (
      <RetiredFacitRow key={`retired-${e.n}`} variant={variant} index={i} entry={e} />
    )

  return (
    <div
      data-testid="ovn-history"
      className="hpc-m3-page"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="hpc-m3-frame" style={{ paddingBottom: 120 }}>
        <DrillRailSection
          meta={
            <>
              <strong>LÄS</strong>
              pass slut
            </>
          }
        >
          <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
            Klart.
          </h1>
          <div className="hpc-m3-stats">
            <div>
              <div className="hpc-m3-stat-n">
                {right} av {FACIT.length}
              </div>
              <div className="hpc-m3-stat-l">rätt</div>
            </div>
            <div>
              <div className="hpc-m3-stat-n">
                {((right / FACIT.length) * 2).toFixed(2).replace('.', ',')}
              </div>
              <div className="hpc-m3-stat-l">detta pass</div>
            </div>
            <div>
              <div className="hpc-m3-stat-n">{toRepeat}</div>
              <div className="hpc-m3-stat-l">till repetition</div>
            </div>
          </div>
        </DrillRailSection>

        <DrillRailSection meta="Facit">
          <h2 className="hpc-m3-h">Hela passet</h2>
          <div>
            {variant === 'c' ? (
              <>
                <UnitBand title={LAS_UNIT.title} sticky={false} />
                {FACIT.slice(0, firstRetired).map(row)}
                <UnitBand sticky={false} right={<RetiredBandNotice />} style={{ marginTop: 22 }} />
                {FACIT.slice(firstRetired).map((e, j) => row(e, firstRetired + j))}
              </>
            ) : (
              FACIT.map(row)
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginTop: 12,
            }}
          >
            <span style={summaLabel}>summa</span>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 22,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {right} av {FACIT.length}
            </span>
          </div>
          <div aria-hidden style={{ height: 2, background: 'var(--ink)', marginTop: 8 }} />
        </DrillRailSection>
      </div>
    </div>
  )
}

/** DrillResult's FacitRow: a marked row that opens the graded page in
 *  place. The page carries the variant's disclosure as in feedback. */
function LiveFacitRow({
  variant,
  layout,
  index,
  qIndex,
  picked,
  open,
  onToggle,
}: {
  variant: VariantKey
  layout: DrillLayout
  index: number
  qIndex: number
  picked: AnswerLetter
  open: boolean
  onToggle: () => void
}) {
  const q = LAS_UNIT.questions[qIndex]
  const ok = picked === q.answer
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        data-testid={`ovn-facit-row-${index + 1}`}
        // The live row uses `all: unset`, which also drops the focus ring;
        // an explicit reset keeps the browser's ring for keyboard users.
        // Longhand borders: a `border` shorthand would clear the row rule.
        style={{
          margin: 0,
          borderTop: 0,
          borderLeft: 0,
          borderRight: 0,
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
          textAlign: 'left',
          cursor: 'pointer',
          ...facitGrid,
        }}
      >
        <Mark ok={ok} />
        <Num n={index + 1} />
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14.5,
            color: ok ? 'var(--ink-2)' : 'var(--ink)',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}
        >
          {q.prompt}
        </span>
        <Letters ok={ok} picked={picked} answer={q.answer}>
          <span aria-hidden style={{ marginLeft: 10, color: 'var(--muted-2)' }}>
            {open ? '▴' : '▾'}
          </span>
        </Letters>
      </button>
      {open && (
        <div
          style={{
            borderLeft: '2px solid var(--accent)',
            padding: '8px 0 24px 18px',
            margin: '0 0 4px',
          }}
        >
          <QuestionPage
            variant={variant}
            unit={LAS_UNIT}
            q={q}
            firstDisplay={false}
            picked={picked}
            layout={layout}
            scrollRoot={null}
            review
          />
          <button type="button" onClick={onToggle} style={{ ...summaLabel, ...quietButton }}>
            ▴ stäng granskning
          </button>
        </div>
      )}
    </div>
  )
}

/** A retired unit's row: the historical answer stays, the content is not
 *  served — the notice stands where the prompt was, and the row does not
 *  open. C names the notice once in its group band instead. */
function RetiredFacitRow({
  variant,
  index,
  entry,
}: {
  variant: VariantKey
  index: number
  entry: Extract<FacitEntry, { kind: 'retired' }>
}) {
  const ok = entry.picked === entry.answer
  return (
    <div data-testid="ovn-retired-row" style={facitGrid}>
      <Mark ok={ok} />
      <Num n={index + 1} />
      <span style={{ minWidth: 0, textAlign: 'left' }}>
        {variant === 'a' && <RetiredInlineNotice />}
        {variant === 'b' && <RetiredTagNotice />}
        {variant === 'c' && (
          <span
            style={{ fontFamily: 'var(--font-display)', fontSize: 14.5, color: 'var(--muted)' }}
          >
            Fråga {entry.n}
          </span>
        )}
      </span>
      <Letters ok={ok} picked={entry.picked} answer={entry.answer} />
    </div>
  )
}

function Mark({ ok }: { ok: boolean }) {
  return (
    <span
      aria-hidden
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        fontWeight: 700,
        color: ok ? 'var(--ok)' : 'var(--bad)',
      }}
    >
      {ok ? '✓' : '✗'}
    </span>
  )
}

function Num({ n }: { n: number }) {
  return <span style={{ ...mono11 }}>{n}.</span>
}

function Letters({
  ok,
  picked,
  answer,
  children,
}: {
  ok: boolean
  picked: AnswerLetter
  answer: AnswerLetter
  children?: ReactNode
}) {
  return (
    <span style={{ ...mono11, color: ok ? 'var(--muted)' : 'var(--bad)', whiteSpace: 'nowrap' }}>
      {ok
        ? `${answer.toLowerCase()})`
        : `ditt ${picked.toLowerCase()}) · rätt ${answer.toLowerCase()})`}
      {children}
    </span>
  )
}

// ── Shared bits ──────────────────────────────────────────────────────

/** Bake-off chrome (not product): names the surface a block reproduces. */
function SurfaceCaption({ children }: { children: ReactNode }) {
  return (
    <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 24px 0' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          borderTop: '1px dashed var(--muted-2)',
          paddingTop: 10,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Strong({ children }: { children: ReactNode }) {
  return <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{children}</strong>
}

const mono11: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

const disclaimer: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--muted)',
  marginTop: 8,
  marginBottom: 0,
}

const paragraph: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 17,
  lineHeight: 1.6,
  color: 'var(--ink-2)',
  maxWidth: '58ch',
  margin: '10px 0 0',
}

const facitGrid: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px 30px minmax(0, 1fr) auto',
  gap: 12,
  alignItems: 'baseline',
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 0',
  borderBottom: '1px solid var(--hairline-2)',
}

const summaLabel: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const quietButton: CSSProperties = {
  marginTop: 12,
  padding: 0,
  border: 0,
  background: 'transparent',
  cursor: 'pointer',
}
