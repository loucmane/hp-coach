// ProvpassPickerB — designer B's two concepts for the provpass PICKER
// (the list where a student chooses which authentic exam pass to sit).
// The shipped picker (routes/prov.tsx AuthenticPassRow) prints raw exam
// ids — "host-2025 · kvant1" — ASCII filenames in a Swedish UI, in a flat
// undifferentiated wall of ~54 rows per half. Two jobs here: canonical
// Swedish naming (formatSitting / formatPass below are the shared LAW)
// and an organization worthy of the product.
//
// ── PPB1 · "Kallelsen & arkivet" (document-native) ──────────────────────
//
// Organizing principle: the SITTING (provtillfället) is the object, not
// the file. The real HP experience runs anmälan → kallelse → provpass,
// so the picker borrows that register. The least-exposed pass is not a
// highlighted row in a list — it is rendered as a literal KALLELSE: the
// house summons card (accent-soft fill, accent top rule — Kallelse.tsx's
// owner-approved identity) carrying the exam cover-sheet stack (mono
// HÖGSKOLEPROVET eyebrow, serif-italic sitting name, mono pass line) and
// an addressee line — "Inskriven: <name>" with the dotted form-field
// underline. The jury's standing note that the Inskriven idiom belongs
// where the exam-paper metaphor is literal applies HERE if anywhere:
// this card summons YOU to a sitting. Below it, ARKIVET — a chronological
// ledger of all sittings, newest first, each sitting a serif heading with
// its two pass rows (Provpass 1/2) carrying mono "sett X/40" + the red
// "X/40 frågor" completeness flag. Choosing a pass = anmälan to that
// sitting.
//
// Aesthetic risk: committing the WHOLE surface to the summons metaphor —
// the recommendation is a bureaucratic document, not a UI banner, and the
// archive scrolls long (27 sittings × ~2 rows) because an archive is
// allowed to be long when the decision is already made at the top.
// Rejected along the way: fabricated exact provdatum ("lördagen den 21
// mars" — the dataset carries no dates; never invent); repeating
// "Verbal" per row (LAW: the half lives in the page toggle); an
// exposure-sorted ledger (an archive is chronological — the kallelse IS
// the exposure recommendation, one signal in one place); a per-year
// mega-grouping (buries the provtillfälle/version qualifiers that make
// 2019/2022 legible).
//
// ── PPB2 · "Registret" (information-dense) ──────────────────────────────
//
// Organizing principle: a sitting × pass MATRIX. One row per sitting,
// Provpass 1 and Provpass 2 as columns — 27 rows instead of 54, the whole
// half legible in one desktop viewport. Chronological newest-first (the
// month-three power user navigates by memory of the calendar, not by an
// exposure sort that reshuffles under their feet). Each cell: a micro-
// meter dual-encoding the two facts that matter (track LENGTH = frågor
// parsed out of 40, so an incomplete pass is visibly short; FILL = frågor
// sett, so a fresh pass is visibly empty) plus the literal mono
// "sett X/40" and the red "X/40 frågor" flag. The least-exposed
// recommendation is never buried: a pinned MINST SETT strip above the
// register names it and starts it, and the suggested cell itself carries
// the accent marker.
//
// Aesthetic risk: near-total mono austerity — the register trusts
// tabular JetBrains Mono, hairlines and two tiny encodings to carry 54
// data cells with no card chrome at all; it should read like a fine-set
// results annex in the back of a report. Rejected along the way:
// exposure-sorted rows (see above); zebra striping (not house); sortable
// column headers (scope theater in an artboard); abbreviating to "P1"
// (vocabulary LAW: verb1 → "Provpass 1", always); a 0–100% percentage
// (the exam's own unit is frågor — 40 is the number students know).
//
// ── Data ────────────────────────────────────────────────────────────────
//
// REAL bank data via loadBank() (27 exams, exact same listAuthenticPasses
// the product uses). Exposure: tries the real /api/me/exposure (signed-in
// dev session); if auth blocks, falls back to a deterministic LABELED
// month-three fixture (recent sittings drilled, mid-era half-seen, old
// archive untouched) — the active source is printed in every stage label.
//
// Self-contained artboards (phone 390×844 + desktop 1440), no routes, no
// shared-file edits. Rows are real buttons with focus-visible rings;
// entrance motion is the house hpc-m3-* set, which the global
// prefers-reduced-motion guard already collapses.

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

import { type ExposureMap, type MockHalf, useExposure } from '@/api/hooks/useMockResults'
import { Book, Chart, Home, Pencil, User } from '@/components/icons'
import { loadBank, type Question } from '@/data/questions'
import { formatPass, formatSitting } from '@/lib/examNames'
import { listAuthenticPasses, type PassOption } from '@/lib/mock'

// Canonical naming (LAW) now lives in @/lib/examNames — this bake-off
// re-exports it so PPH (which imports `formatSitting`/`formatPass` from
// this file) and any historical reference keep working with no second
// copy of the grammar to drift. See app/src/lib/examNames.ts.
export { formatPass, formatSitting } from '@/lib/examNames'

// ── chronology (presentation order for both concepts) ──────────────────

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

/** Newest sitting first; höst after vår within a year; provtillfälle/
 *  version 1 before 2. */
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

// ── exposure: real when signed in, labeled fixture otherwise ────────────

/** Deterministic month-three profile: 2024+ sittings drilled 1–3×, the
 *  2020–2023 mid-era roughly half-seen, the older archive nearly fresh.
 *  Purely presentational — lets the artboards show the real dynamic
 *  range of the meter when auth blocks the real exposure map. */
function fixtureExposure(bank: readonly Question[]): ExposureMap {
  const map: ExposureMap = {}
  for (const q of bank) {
    const year = Number(/(\d{4})/.exec(q.exam_id)?.[1] ?? '0')
    let h = 0
    for (let i = 0; i < q.qid.length; i++) h = (h * 31 + q.qid.charCodeAt(i)) >>> 0
    let n = 0
    if (year >= 2024) n = 1 + (h % 3)
    else if (year >= 2020) n = h % 2 === 0 ? 1 : 0
    else n = h % 9 === 0 ? 1 : 0
    if (n > 0) map[q.qid] = { n, last: 0 }
  }
  return map
}

type PassData = {
  /** Least-exposed-first, exactly the product ordering (lib/mock.ts). */
  passes: PassOption[]
  /** True while the bank fetch is in flight. */
  loading: boolean
  /** Which exposure source fed the list — printed in stage labels. */
  source: 'verklig exponering' | 'fixtur-exponering (månad 3)'
}

function usePassData(): PassData {
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const exposureQuery = useExposure()

  useEffect(() => {
    let alive = true
    loadBank().then((b) => {
      if (alive) setBank(b)
    })
    return () => {
      alive = false
    }
  }, [])

  return useMemo(() => {
    if (!bank) return { passes: [], loading: true, source: 'fixtur-exponering (månad 3)' }
    const real = exposureQuery.data
    const exposure = real ?? fixtureExposure(bank)
    return {
      passes: listAuthenticPasses([...bank], exposure),
      loading: false,
      source: real ? 'verklig exponering' : 'fixtur-exponering (månad 3)',
    }
  }, [bank, exposureQuery.data])
}

// ── shared registers ────────────────────────────────────────────────────

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const monoMeta: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: MONO_TRACK,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

function noop(): void {
  // Artboard rows are inert — starting a pass is the product route's job.
}

/** The literal exposure + completeness line every concept must keep:
 *  mono "sett X/40" and, when the parse is short, the red "X/40 frågor". */
function ExposureLine({ pass, style }: { pass: PassOption; style?: CSSProperties }) {
  return (
    <span style={{ ...monoMeta, display: 'inline-flex', gap: 8, ...style }}>
      <span>
        sett {pass.seenBefore}/{pass.presented}
      </span>
      {pass.presented < 40 && (
        <span style={{ color: 'var(--bad)' }}>{pass.presented}/40 frågor</span>
      )}
    </span>
  )
}

// ── artboard chassis (mirrors the account round-2 frames) ───────────────

function StageLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        margin: '0 0 10px 4px',
      }}
    >
      {children}
    </div>
  )
}

function PhoneFrame({ children, shot }: { children: ReactNode; shot: string }) {
  return (
    <div
      data-shot={shot}
      style={{
        width: 390,
        height: 844,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 28,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
        transform: 'translateZ(0)',
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  )
}

function DeskFrame({ children, shot }: { children: ReactNode; shot: string }) {
  return (
    <div
      data-shot={shot}
      style={{
        width: 1440,
        height: 900,
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        transform: 'translateZ(0)',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.4)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}

function StatusStrip() {
  return (
    <div
      style={{
        height: 40,
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--ink)',
        flexShrink: 0,
      }}
    >
      <span style={{ fontVariantNumeric: 'tabular-nums' }}>09:41</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.6 }}>◐ ▓ ▓</span>
    </div>
  )
}

function BottomTabs() {
  const tabs: Array<{ label: string; Icon: (p: { s?: number }) => ReactNode; active?: boolean }> = [
    { label: 'Hem', Icon: Home, active: true },
    { label: 'Övning', Icon: Pencil },
    { label: 'Lektion', Icon: Book },
    { label: 'Feedback', Icon: User },
    { label: 'Framsteg', Icon: Chart },
  ]
  return (
    <div
      style={{
        borderTop: '1px solid var(--hairline)',
        background: 'var(--bg)',
        padding: '10px 8px 26px',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        flexShrink: 0,
      }}
    >
      {tabs.map((t) => (
        <div
          key={t.label}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            color: t.active ? 'var(--ink)' : 'var(--muted-2)',
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          <t.Icon s={20} />
          {t.label}
        </div>
      ))}
    </div>
  )
}

/** The picker's mode/half toggles, house register (prov.tsx ToggleRow).
 *  Mode is fixed to "Riktigt pass" in these artboards; half is live so a
 *  judge can flip Verbal ↔ Kvantitativ on the dev surface. `stack` puts
 *  mode and half on separate lines — the 346px phone column can't seat
 *  four toggle words on one baseline without an ugly orphan wrap. */
function Toggles({
  half,
  onHalf,
  stack = false,
}: {
  half: MockHalf
  onHalf: (h: MockHalf) => void
  stack?: boolean
}) {
  const t = (active: boolean): CSSProperties => ({
    all: 'unset',
    cursor: 'pointer',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: active ? 'var(--ink)' : 'var(--muted-2)',
    borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
    paddingBottom: 2,
  })
  const row: CSSProperties = { display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }
  const mode = (
    <>
      <button type="button" aria-pressed style={t(true)}>
        Riktigt pass
      </button>
      <button type="button" aria-pressed={false} style={{ ...t(false), cursor: 'default' }}>
        Genererat pass
      </button>
    </>
  )
  const halves = (
    <>
      <button
        type="button"
        aria-pressed={half === 'verbal'}
        onClick={() => onHalf('verbal')}
        style={t(half === 'verbal')}
      >
        Verbal
      </button>
      <button
        type="button"
        aria-pressed={half === 'kvant'}
        onClick={() => onHalf('kvant')}
        style={t(half === 'kvant')}
      >
        Kvantitativ
      </button>
    </>
  )
  if (stack) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={row}>{mode}</div>
        <div style={row}>{halves}</div>
      </div>
    )
  }
  return (
    <div style={row}>
      {mode}
      <span aria-hidden style={{ width: 6 }} />
      {halves}
    </div>
  )
}

/** Local m3 rail section — the house chassis without importing product
 *  components into a bakeoff artboard. Uses the global .hpc-m3-* CSS. */
function Rail({
  meta,
  delay = 0,
  children,
}: {
  meta: ReactNode
  delay?: number
  children: ReactNode
}) {
  const d = { animationDelay: `${delay}ms` }
  return (
    <section className="hpc-m3-section">
      <hr className="hpc-m3-rule" style={d} />
      <div className="hpc-m3-row">
        <div className="hpc-m3-meta" style={d}>
          {meta}
        </div>
        <div className="hpc-m3-spine" />
        <div className="hpc-m3-content" style={{ animationDelay: `${delay + 60}ms` }}>
          {children}
        </div>
      </div>
    </section>
  )
}

const focusRing = `
.ppb-row:focus-visible, .ppb-cell:focus-visible, .ppb-cta:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.ppb-row:hover, .ppb-cell:hover { background: var(--panel-2); }
`

// ════════════════════════════════════════════════════════════════════════
// PPB1 · Kallelsen & arkivet — document-native
// ════════════════════════════════════════════════════════════════════════

/** The summons card: house Kallelse identity (accent-soft fill, accent
 *  top rule) carrying the cover-sheet stack + the addressee line. */
function KallelseCard({
  pass,
  desktop,
  candidate,
}: {
  pass: PassOption
  desktop: boolean
  candidate: string
}) {
  return (
    <div
      style={{
        background: 'var(--accent-soft)',
        borderTop: '2px solid var(--accent)',
        padding: desktop ? '22px 26px 24px' : '16px 18px 18px',
      }}
    >
      <div style={{ ...eyebrow, color: 'var(--ink)' }}>Kallelse · minst sett</div>
      <h2
        className="hpc-m3-display"
        style={{
          fontSize: desktop ? 34 : 27,
          margin: desktop ? '12px 0 0' : '10px 0 0',
          fontStyle: 'italic',
          lineHeight: 1.12,
          color: 'var(--ink)',
        }}
      >
        {formatSitting(pass.examId)}
      </h2>
      <div style={{ marginTop: desktop ? 10 : 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ ...monoMeta, color: 'var(--ink-2)' }}>{formatPass(pass.provpass)}</span>
        <span aria-hidden style={{ ...monoMeta, color: 'var(--ink-2)' }}>
          ·
        </span>
        <ExposureLine pass={pass} style={{ color: 'var(--ink-2)' }} />
      </div>
      <div
        style={{
          marginTop: desktop ? 16 : 13,
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          maxWidth: desktop ? 340 : undefined,
        }}
      >
        <span
          style={{
            ...monoMeta,
            color: 'var(--ink-2)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}
        >
          Inskriven
        </span>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: desktop ? 17 : 15.5,
            color: 'var(--ink)',
            borderBottom: '1px dotted var(--ink-2)',
            paddingBottom: 1,
            flex: 1,
          }}
        >
          {candidate}
        </span>
      </div>
      <div style={{ textAlign: 'right', marginTop: desktop ? 18 : 14 }}>
        <button
          type="button"
          className="hpc-m3-cta ppb-cta"
          onClick={noop}
          style={{
            display: 'inline-block',
            borderRadius: 999,
            padding: desktop ? '12px 26px' : '11px 22px',
            fontFamily: 'var(--font-mono)',
            fontSize: desktop ? 12.5 : 12,
            letterSpacing: MONO_TRACK,
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

/** One archive entry: the sitting as a serif heading, its passes as
 *  ledger rows underneath. */
function ArchiveSitting({
  row,
  suggested,
  desktop,
}: {
  row: SittingRow
  suggested: PassOption | undefined
  desktop: boolean
}) {
  const present = row.passes.filter((p): p is PassOption => Boolean(p))
  return (
    <div style={{ paddingTop: desktop ? 18 : 16 }}>
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: desktop ? 18 : 16.5,
          letterSpacing: '-0.01em',
          color: 'var(--ink)',
          margin: 0,
        }}
      >
        {formatSitting(row.examId)}
      </h3>
      <div style={{ marginTop: 6 }}>
        {present.map((p) => {
          const isSuggested =
            suggested !== undefined &&
            suggested.examId === p.examId &&
            suggested.provpass === p.provpass
          return (
            <button
              key={p.provpass}
              type="button"
              className="ppb-row"
              onClick={noop}
              aria-label={`${formatSitting(p.examId)} · ${formatPass(p.provpass)}`}
              style={{
                all: 'unset',
                boxSizing: 'border-box',
                cursor: 'pointer',
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) auto auto',
                gap: 12,
                alignItems: 'baseline',
                width: '100%',
                padding: desktop ? '9px 10px' : '9px 6px',
                borderBottom: '1px solid var(--hairline-2)',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: desktop ? 15.5 : 15,
                  color: 'var(--ink-2)',
                }}
              >
                {formatPass(p.provpass)}
                {isSuggested && (
                  <span
                    style={{
                      marginLeft: 8,
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--accent)',
                    }}
                  >
                    kallad ↑
                  </span>
                )}
              </span>
              <ExposureLine pass={p} />
              <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 13 }}>
                →
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Ppb1Body({
  data,
  half,
  onHalf,
  desktop,
}: {
  data: PassData
  half: MockHalf
  onHalf: (h: MockHalf) => void
  desktop: boolean
}) {
  const halfPasses = data.passes.filter((p) => p.half === half)
  const suggested = halfPasses[0]
  const sittings = groupBySitting(halfPasses)

  if (data.loading) {
    return (
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-2)' }}>
        Laddar provbanken…
      </p>
    )
  }

  const archive = (
    <div>
      {sittings.map((row) => (
        <ArchiveSitting key={row.examId} row={row} suggested={suggested} desktop={desktop} />
      ))}
    </div>
  )

  if (desktop) {
    return (
      <>
        <Rail
          meta={
            <>
              <strong>Provpass</strong>
              hela provet
            </>
          }
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
              maxWidth: '52ch',
            }}
          >
            Välj provtillfälle — 40 frågor, 55 minuter, riktiga provvillkor. Ingen feedback förrän
            du lämnar in.
          </p>
        </Rail>
        <Rail meta="Läge" delay={80}>
          <Toggles half={half} onHalf={onHalf} />
        </Rail>
        <Rail meta="Kallelse" delay={140}>
          {suggested ? (
            <div style={{ maxWidth: 560 }}>
              <KallelseCard pass={suggested} desktop candidate="Lookman Benali" />
            </div>
          ) : (
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                color: 'var(--ink-2)',
              }}
            >
              Inga riktiga pass tillgängliga för den här halvan.
            </p>
          )}
        </Rail>
        <Rail
          meta={
            <>
              <strong>Arkivet</strong>
              {sittings.length} provtillfällen
            </>
          }
          delay={200}
        >
          <div style={{ maxWidth: 640 }}>{archive}</div>
        </Rail>
      </>
    )
  }

  return (
    <div style={{ padding: '18px 22px 40px' }}>
      <div style={eyebrow}>Provpass · hela provet</div>
      <h1 className="hpc-m3-display" style={{ fontSize: 40, marginTop: 8 }}>
        Anmälan.
      </h1>
      <div style={{ marginTop: 16 }}>
        <Toggles half={half} onHalf={onHalf} stack />
      </div>
      <div style={{ marginTop: 20 }}>
        {suggested && <KallelseCard pass={suggested} desktop={false} candidate="Lookman Benali" />}
      </div>
      <div style={{ ...eyebrow, marginTop: 30 }}>Arkivet · {sittings.length} provtillfällen</div>
      <hr className="hpc-m3-rule" style={{ margin: '10px 0 0' }} />
      {archive}
    </div>
  )
}

export function PPB1() {
  const data = usePassData()
  const [half, setHalf] = useState<MockHalf>('verbal')
  return (
    <div style={{ display: 'grid', gap: 36, justifyItems: 'start' }}>
      <style>{focusRing}</style>
      <div>
        <StageLabel>PPB1 · Kallelsen &amp; arkivet · Phone · 390×844 · {data.source}</StageLabel>
        <PhoneFrame shot="ppb1-phone">
          <StatusStrip />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Ppb1Body data={data} half={half} onHalf={setHalf} desktop={false} />
          </div>
          <BottomTabs />
        </PhoneFrame>
      </div>
      <div>
        <StageLabel>PPB1 · Kallelsen &amp; arkivet · Desktop · 1440 · {data.source}</StageLabel>
        <DeskFrame shot="ppb1-desk">
          <div
            className="hpc-m3-frame hpc-m3-page"
            style={{ maxWidth: 1040, margin: '0 auto', padding: '56px 40px 96px' }}
          >
            <Ppb1Body data={data} half={half} onHalf={setHalf} desktop />
          </div>
        </DeskFrame>
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════════
// PPB2 · Registret — information-dense
// ════════════════════════════════════════════════════════════════════════

/** Dual-encoded micro-meter: track LENGTH = presented/40 (a short track
 *  IS the incompleteness flag, before you even read the red number),
 *  FILL = seenBefore. 1px per fråga. Decorative — the literal numbers
 *  sit right next to it. */
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

function RegisterCell({
  pass,
  suggested,
  compact,
}: {
  pass: PassOption | undefined
  suggested: boolean
  compact: boolean
}) {
  if (!pass) {
    return (
      <span
        aria-hidden
        style={{ ...monoMeta, color: 'var(--muted-2)', padding: compact ? '4px 0' : '7px 8px' }}
      >
        —
      </span>
    )
  }
  return (
    <button
      type="button"
      className="ppb-cell"
      onClick={noop}
      aria-label={`${formatSitting(pass.examId)} · ${formatPass(pass.provpass)} · sett ${pass.seenBefore} av ${pass.presented}`}
      style={{
        all: 'unset',
        boxSizing: 'border-box',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: compact ? '4px 6px' : '7px 8px',
        borderLeft: suggested ? '2px solid var(--accent)' : '2px solid transparent',
        minWidth: 0,
      }}
    >
      <Meter pass={pass} accent={suggested} />
      <span
        style={{
          ...monoMeta,
          fontSize: compact ? 10.5 : 11,
          color: suggested ? 'var(--accent)' : 'var(--muted)',
          whiteSpace: 'nowrap',
        }}
      >
        sett {pass.seenBefore}/{pass.presented}
      </span>
      {pass.presented < 40 && (
        <span
          style={{
            ...monoMeta,
            fontSize: compact ? 10.5 : 11,
            color: 'var(--bad)',
            whiteSpace: 'nowrap',
          }}
        >
          {pass.presented}/40 frågor
        </span>
      )}
    </button>
  )
}

/** Pinned recommendation strip — the least-exposed pass named and
 *  startable without scanning the register. */
function MinstSettStrip({ pass, compact }: { pass: PassOption; compact: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
        background: 'var(--accent-soft)',
        borderTop: '2px solid var(--accent)',
        padding: compact ? '10px 12px' : '10px 14px',
      }}
    >
      <span style={{ ...eyebrow, color: 'var(--ink)' }}>Minst sett</span>
      <span style={{ ...monoMeta, color: 'var(--ink)', fontSize: 12 }}>
        {formatSitting(pass.examId)} · {formatPass(pass.provpass)}
      </span>
      <ExposureLine pass={pass} style={{ color: 'var(--ink-2)' }} />
      <button
        type="button"
        className="ppb-cta"
        onClick={noop}
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

function Ppb2Body({
  data,
  half,
  onHalf,
  desktop,
}: {
  data: PassData
  half: MockHalf
  onHalf: (h: MockHalf) => void
  desktop: boolean
}) {
  const halfPasses = data.passes.filter((p) => p.half === half)
  const suggested = halfPasses[0]
  const sittings = groupBySitting(halfPasses)
  const isSuggested = (p: PassOption | undefined): boolean =>
    p !== undefined &&
    suggested !== undefined &&
    p.examId === suggested.examId &&
    p.provpass === suggested.provpass

  if (data.loading) {
    return (
      <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--ink-2)' }}>
        Laddar provbanken…
      </p>
    )
  }

  const headerCell: CSSProperties = {
    ...eyebrow,
    fontSize: 10,
    padding: desktop ? '0 8px 6px' : '0 6px 6px',
  }

  const table = (
    <div>
      {suggested && (
        <div style={{ marginBottom: 14 }}>
          <MinstSettStrip pass={suggested} compact={!desktop} />
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: desktop ? '250px 1fr 1fr' : '1fr',
        }}
      >
        {desktop ? (
          <>
            <span style={{ ...headerCell, paddingLeft: 0 }}>Provtillfälle</span>
            <span style={headerCell}>Provpass 1</span>
            <span style={headerCell}>Provpass 2</span>
          </>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <span style={{ ...headerCell, paddingLeft: 8 }}>Provpass 1</span>
            <span style={{ ...headerCell, paddingLeft: 8 }}>Provpass 2</span>
          </div>
        )}
        {sittings.map((row) => {
          const sitting = (
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: desktop ? 12.5 : 11.5,
                letterSpacing: MONO_TRACK,
                color: 'var(--ink)',
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {formatSitting(row.examId)}
            </span>
          )
          if (desktop) {
            return (
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
                {sitting}
                <RegisterCell
                  pass={row.passes[0]}
                  suggested={isSuggested(row.passes[0])}
                  compact={false}
                />
                <RegisterCell
                  pass={row.passes[1]}
                  suggested={isSuggested(row.passes[1])}
                  compact={false}
                />
              </div>
            )
          }
          return (
            <div
              key={row.examId}
              style={{ borderTop: '1px solid var(--hairline-2)', padding: '7px 0 8px' }}
            >
              {sitting}
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}
              >
                {([0, 1] as const).map((i) => (
                  <RegisterCell
                    key={i}
                    pass={row.passes[i]}
                    suggested={isSuggested(row.passes[i])}
                    compact
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  if (desktop) {
    return (
      <>
        <Rail
          meta={
            <>
              <strong>Provpass</strong>
              hela provet
            </>
          }
        >
          <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
            Registret.
          </h1>
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              lineHeight: 1.5,
              color: 'var(--ink-2)',
              marginTop: 12,
              maxWidth: '52ch',
            }}
          >
            Alla provtillfällen, båda passen — 40 frågor, 55 minuter, riktiga provvillkor.
          </p>
        </Rail>
        <Rail meta="Läge" delay={80}>
          <Toggles half={half} onHalf={onHalf} />
        </Rail>
        <Rail
          meta={
            <>
              <strong>Register</strong>
              {sittings.length} provtillfällen
            </>
          }
          delay={140}
        >
          <div style={{ maxWidth: 880 }}>{table}</div>
        </Rail>
      </>
    )
  }

  return (
    <div style={{ padding: '18px 22px 40px' }}>
      <div style={eyebrow}>Provpass · hela provet</div>
      <h1 className="hpc-m3-display" style={{ fontSize: 40, marginTop: 8 }}>
        Registret.
      </h1>
      <div style={{ margin: '16px 0 20px' }}>
        <Toggles half={half} onHalf={onHalf} stack />
      </div>
      {table}
    </div>
  )
}

export function PPB2() {
  const data = usePassData()
  const [half, setHalf] = useState<MockHalf>('verbal')
  return (
    <div style={{ display: 'grid', gap: 36, justifyItems: 'start' }}>
      <style>{focusRing}</style>
      <div>
        <StageLabel>PPB2 · Registret · Phone · 390×844 · {data.source}</StageLabel>
        <PhoneFrame shot="ppb2-phone">
          <StatusStrip />
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <Ppb2Body data={data} half={half} onHalf={setHalf} desktop={false} />
          </div>
          <BottomTabs />
        </PhoneFrame>
      </div>
      <div>
        <StageLabel>PPB2 · Registret · Desktop · 1440 · {data.source}</StageLabel>
        <DeskFrame shot="ppb2-desk">
          <div
            className="hpc-m3-frame hpc-m3-page"
            style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 40px 96px' }}
          >
            <Ppb2Body data={data} half={half} onHalf={setHalf} desktop />
          </div>
        </DeskFrame>
      </div>
    </div>
  )
}
