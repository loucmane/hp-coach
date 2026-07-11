// ProvpassPickerH — "Kallelsen & registret", the owner-specced B1×B2
// hybrid synthesis of the provpass-picker bake-off.
//
// ── What the owner decided (the round's verdict) ────────────────────────
//
// Liked: B1's Kallelse-lead (the summons card with the Inskriven
// addressee line) and its chronological ledger; B2's micro-meters
// (track length = frågor parsed of 40, fill = frågor sett).
// Disliked: "Provpass 1 / Provpass 2" as tappable rows on MOBILE — a
// choice with zero information, because the two passes of a sitting are
// indistinguishable by design. The numbering is reference metadata,
// never a menu.
//
// ── The hybrid ──────────────────────────────────────────────────────────
//
// MOBILE (390×844): B1's structure — Kallelse on top, chronological
// ledger below — but the SITTING is the single tappable object. One row
// per provtillfälle; inside it, B2's micro-meters stacked tight, one per
// pass. The meters ARE the pass-level information: a full bar next to an
// empty bar tells the whole story without a single label. Tapping a
// sitting starts its least-seen pass automatically; the pass NUMBER
// appears only in the start-confirmation sheet ("Hösten 2025 ·
// Provpass 2 · 40 frågor") — the one surface where it is reference
// metadata rather than a menu. The phone artboard is live: tap a row and
// the sheet opens. A third artboard renders the sheet pre-opened so the
// judge sees where the number lives without interacting.
//
// DESKTOP (1440): B2's explicit sitting × pass matrix — whole half per
// viewport, micro-meters + "sett X/40", MINST SETT strip — with B1's
// Kallelse-lead in its own rail section above it. Redundancy costs
// nothing at 1440; power users keep direct per-pass access.
//
// ── Deviations from the literal spec (each deliberate, flagged) ─────────
//
// 1. CONFIRM SHEET AS THE TAP TARGET'S LANDING. The spec says tapping a
//    sitting "starts its least-seen pass automatically" AND that the
//    pass number lives in "the start-confirmation context". Read
//    together: the tap opens a light confirm sheet naming what was
//    auto-picked, and Starta actually begins. One extra tap buys the
//    55-minute commitment an explicit consent moment (real provvillkor,
//    abandon = void) and gives the numbering its only home.
// 2. STICKY MINST SETT. B2's strip was pinned in name only. Here it is
//    position:sticky inside the desktop scroll, so once the Kallelse
//    card scrolls away the recommendation genuinely follows the
//    register — and while both are visible they are adjacent, not two
//    voices in different rooms.
// 3. SUGGESTED MARKER IN THE MOBILE LEDGER: accent meter fill (B2's
//    device) instead of B1's "kallad ↑" text badge. The kallelse above
//    owns the recommendation in words; the ledger repeats it only as
//    color, one voice per register.
// 4. The red "X/40 frågor" completeness flag renders per meter as an
//    exception (all current passes are 40/40, so normally invisible) —
//    carried over from both parents as LAW.
//
// ── Data ────────────────────────────────────────────────────────────────
//
// Real bank via loadBank() + listAuthenticPasses (exact product
// ordering). Exposure: real /api/me/exposure when a session exists;
// otherwise the deterministic month-three fixture — active source
// printed in every stage label (pattern shared with A and B).
//
// Naming LAW: formatSitting / formatPass imported from ProvpassPickerB —
// no third copy.

import { type CSSProperties, type ReactNode, useEffect, useMemo, useState } from 'react'

import { type ExposureMap, type MockHalf, useExposure } from '@/api/hooks/useMockResults'
import { Book, Chart, Home, Pencil, User } from '@/components/icons'
import { loadBank, type Question } from '@/data/questions'
import { listAuthenticPasses, type PassOption } from '@/lib/mock'

import { formatPass, formatSitting } from './ProvpassPickerB'

// ── chronology (identical presentation order to B) ─────────────────────

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

/** The pass a sitting-tap auto-picks: the first of the sitting's passes
 *  in the product's least-exposed-first ordering. */
function leastSeenOf(row: SittingRow, ordered: PassOption[]): PassOption | undefined {
  return ordered.find((p) => p.examId === row.examId)
}

// ── exposure: real when signed in, labeled fixture otherwise ────────────

/** Deterministic month-three profile (same shape as B's): recent
 *  sittings drilled, mid-era half-seen, old archive nearly fresh. */
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
  // Artboard CTAs are inert — starting a pass is the product route's job.
}

/** Mono "sett X/40" plus the red exception flag when the parse is short. */
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

/** B2's dual-encoded micro-meter, verbatim: track LENGTH = presented/40
 *  (a short track IS the incompleteness flag), FILL = seenBefore.
 *  1px per fråga. Decorative — literal numbers live in aria-labels and,
 *  on desktop, right next to it. */
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

// ── artboard chassis (mirrors A/B's frames) ─────────────────────────────

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

/** Mode/half toggles, house register. Mode fixed to "Riktigt pass";
 *  half is live so a judge can flip Verbal ↔ Kvantitativ. */
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

/** Local m3 rail section — house chassis without importing product
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
.pph-row:focus-visible, .pph-cell:focus-visible, .pph-cta:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.pph-row:hover, .pph-cell:hover { background: var(--panel-2); }
`

// ── The Kallelse-lead (B1 verbatim identity) ────────────────────────────

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
          className="hpc-m3-cta pph-cta"
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

// ── Mobile: the sitting-ledger (one tap target per provtillfälle) ───────

/** One ledger row. The SITTING is the button; inside it, B2's micro-
 *  meters stacked tight, one per pass — the meters are the pass-level
 *  information. No "Provpass N" text: the numbering is reference
 *  metadata and lives in the confirm sheet. */
function SittingLedgerRow({
  row,
  autoPick,
  suggested,
  onTap,
}: {
  row: SittingRow
  autoPick: PassOption | undefined
  suggested: PassOption | undefined
  onTap: (row: SittingRow) => void
}) {
  const present = row.passes.filter((p): p is PassOption => Boolean(p))
  const short = present.filter((p) => p.presented < 40)
  const label = [
    formatSitting(row.examId),
    ...present.map((p) => `${formatPass(p.provpass)} sett ${p.seenBefore} av ${p.presented}`),
  ].join(' · ')
  return (
    <button
      type="button"
      className="pph-row"
      onClick={() => onTap(row)}
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
          <span style={{ ...monoMeta, color: 'var(--bad)', display: 'block', marginTop: 2 }}>
            {short.map((p) => `${p.presented}/40 frågor`).join(' · ')}
          </span>
        )}
      </span>
      <span style={{ display: 'grid', gap: 3, justifyItems: 'end' }}>
        {present.map((p) => (
          <Meter
            key={p.provpass}
            pass={p}
            accent={
              autoPick !== undefined &&
              suggested !== undefined &&
              p.examId === suggested.examId &&
              p.provpass === suggested.provpass
            }
          />
        ))}
      </span>
      <span aria-hidden style={{ color: 'var(--muted-2)', fontSize: 13 }}>
        →
      </span>
    </button>
  )
}

/** The start-confirmation sheet — the ONE surface where the pass number
 *  appears ("Hösten 2025 · Provpass 2 · 40 frågor"). Opens when a
 *  sitting row is tapped; Starta is the actual commitment. */
function ConfirmSheet({ pass, onClose }: { pass: PassOption; onClose: () => void }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 4 }}>
      <button
        type="button"
        aria-label="Avbryt"
        onClick={onClose}
        style={{
          all: 'unset',
          position: 'absolute',
          inset: 0,
          background: 'color-mix(in srgb, var(--ink) 32%, transparent)',
          cursor: 'pointer',
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Starta ${formatSitting(pass.examId)}, ${formatPass(pass.provpass)}`}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'var(--bg)',
          borderTop: '2px solid var(--accent)',
          padding: '20px 22px 30px',
        }}
      >
        <div style={eyebrow}>Starta provpass</div>
        <h2
          className="hpc-m3-display"
          style={{ fontSize: 26, margin: '10px 0 0', fontStyle: 'italic', color: 'var(--ink)' }}
        >
          {formatSitting(pass.examId)}
        </h2>
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ ...monoMeta, color: 'var(--ink-2)' }}>
            {formatPass(pass.provpass)} · {pass.presented} frågor · 55 minuter
          </span>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14.5,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            margin: '10px 0 0',
          }}
        >
          Minst sedda passet i det här tillfället — riktiga provvillkor, ingen feedback förrän du
          lämnar in.
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 18,
          }}
        >
          <button
            type="button"
            className="pph-cta"
            onClick={onClose}
            style={{
              all: 'unset',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              padding: '8px 4px',
            }}
          >
            Avbryt
          </button>
          <button
            type="button"
            className="hpc-m3-cta pph-cta"
            onClick={noop}
            style={{
              display: 'inline-block',
              borderRadius: 999,
              padding: '11px 24px',
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
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
    </div>
  )
}

function PhoneBody({
  data,
  half,
  onHalf,
  onTapSitting,
}: {
  data: PassData
  half: MockHalf
  onHalf: (h: MockHalf) => void
  onTapSitting: (pass: PassOption) => void
}) {
  const halfPasses = data.passes.filter((p) => p.half === half)
  const suggested = halfPasses[0]
  const sittings = groupBySitting(halfPasses)

  if (data.loading) {
    return (
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          color: 'var(--ink-2)',
          padding: '18px 22px',
        }}
      >
        Laddar provbanken…
      </p>
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
      <div style={{ ...eyebrow, marginTop: 30 }}>Registret · {sittings.length} provtillfällen</div>
      <hr className="hpc-m3-rule" style={{ margin: '10px 0 0' }} />
      <div>
        {sittings.map((row) => {
          const autoPick = leastSeenOf(row, halfPasses)
          return (
            <SittingLedgerRow
              key={row.examId}
              row={row}
              autoPick={autoPick}
              suggested={suggested}
              onTap={(r) => {
                const p = leastSeenOf(r, halfPasses)
                if (p) onTapSitting(p)
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ── Desktop: Kallelse-lead above B2's register matrix ───────────────────

function RegisterCell({ pass, suggested }: { pass: PassOption | undefined; suggested: boolean }) {
  if (!pass) {
    return (
      <span aria-hidden style={{ ...monoMeta, color: 'var(--muted-2)', padding: '7px 8px' }}>
        —
      </span>
    )
  }
  return (
    <button
      type="button"
      className="pph-cell"
      onClick={noop}
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
        style={{
          ...monoMeta,
          color: suggested ? 'var(--accent)' : 'var(--muted)',
          whiteSpace: 'nowrap',
        }}
      >
        sett {pass.seenBefore}/{pass.presented}
      </span>
      {pass.presented < 40 && (
        <span style={{ ...monoMeta, color: 'var(--bad)', whiteSpace: 'nowrap' }}>
          {pass.presented}/40 frågor
        </span>
      )}
    </button>
  )
}

/** MINST SETT strip — literally pinned: position:sticky inside the
 *  desktop scroll, so the recommendation follows the register once the
 *  Kallelse card is off-screen. */
function MinstSettStrip({ pass }: { pass: PassOption }) {
  return (
    <div
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
      <span style={{ ...eyebrow, color: 'var(--ink)' }}>Minst sett</span>
      <span style={{ ...monoMeta, color: 'var(--ink)', fontSize: 12 }}>
        {formatSitting(pass.examId)} · {formatPass(pass.provpass)}
      </span>
      <ExposureLine pass={pass} style={{ color: 'var(--ink-2)' }} />
      <button
        type="button"
        className="pph-cta"
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

function DesktopBody({
  data,
  half,
  onHalf,
}: {
  data: PassData
  half: MockHalf
  onHalf: (h: MockHalf) => void
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

  const headerCell: CSSProperties = { ...eyebrow, fontSize: 10, padding: '0 8px 6px' }

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
          Välj provtillfälle — 40 frågor, 55 minuter, riktiga provvillkor. Ingen feedback förrän du
          lämnar in.
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
            <strong>Register</strong>
            {sittings.length} provtillfällen
          </>
        }
        delay={200}
      >
        <div style={{ maxWidth: 880 }}>
          {/* The strip is sticky WITHIN this container — strip and matrix
              must share a parent or the sticky box has no travel room. */}
          {suggested && <MinstSettStrip pass={suggested} />}
          <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr 1fr' }}>
            <span style={{ ...headerCell, paddingLeft: 0 }}>Provtillfälle</span>
            <span style={headerCell}>Provpass 1</span>
            <span style={headerCell}>Provpass 2</span>
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
                <RegisterCell pass={row.passes[0]} suggested={isSuggested(row.passes[0])} />
                <RegisterCell pass={row.passes[1]} suggested={isSuggested(row.passes[1])} />
              </div>
            ))}
          </div>
        </div>
      </Rail>
    </>
  )
}

// ── Exported hybrid: phone (live sheet) + confirm example + desktop ─────

/** For the pre-opened confirm artboard: a mid-archive sitting whose
 *  least-seen pass is Provpass 2 when one exists — the judge should see
 *  the numbering do real work, not default to "1". */
function confirmExample(halfPasses: PassOption[]): PassOption | undefined {
  const sittings = groupBySitting(halfPasses)
  for (const row of sittings) {
    const p = leastSeenOf(row, halfPasses)
    if (p?.provpass.endsWith('2')) return p
  }
  return leastSeenOf(sittings[0], halfPasses)
}

export function PPH() {
  const data = usePassData()
  const [half, setHalf] = useState<MockHalf>('verbal')
  const [confirm, setConfirm] = useState<PassOption | null>(null)

  const halfPasses = data.passes.filter((p) => p.half === half)
  const example = data.loading ? undefined : confirmExample(halfPasses)

  return (
    <div style={{ display: 'grid', gap: 36, justifyItems: 'start' }}>
      <style>{focusRing}</style>
      <div style={{ display: 'flex', gap: 36, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <StageLabel>PPH · Kallelsen &amp; registret · Phone · 390×844 · {data.source}</StageLabel>
          <PhoneFrame shot="pph-phone">
            <StatusStrip />
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <PhoneBody data={data} half={half} onHalf={setHalf} onTapSitting={setConfirm} />
            </div>
            <BottomTabs />
            {confirm && <ConfirmSheet pass={confirm} onClose={() => setConfirm(null)} />}
          </PhoneFrame>
        </div>
        <div>
          <StageLabel>
            PPH · Bekräftelsen (tap på ett tillfälle) · 390×844 · {data.source}
          </StageLabel>
          <PhoneFrame shot="pph-confirm">
            <StatusStrip />
            <div style={{ flex: 1, overflowY: 'auto' }} aria-hidden>
              <PhoneBody data={data} half={half} onHalf={setHalf} onTapSitting={noop} />
            </div>
            <BottomTabs />
            {example && <ConfirmSheet pass={example} onClose={noop} />}
          </PhoneFrame>
        </div>
      </div>
      <div>
        <StageLabel>PPH · Kallelsen &amp; registret · Desktop · 1440 · {data.source}</StageLabel>
        <DeskFrame shot="pph-desk">
          <div
            className="hpc-m3-frame hpc-m3-page"
            style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 40px 96px' }}
          >
            <DesktopBody data={data} half={half} onHalf={setHalf} />
          </div>
        </DeskFrame>
      </div>
    </div>
  )
}
