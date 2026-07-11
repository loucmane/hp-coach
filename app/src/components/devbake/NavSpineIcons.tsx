// NavSpineIcons — the B2 "Innehållet" collapsed spine, rebuilt around a
// glyph system. Owner verdict on the nav bake-off (2026-07-11): B2 wins —
// dot-leader ToC rail, bokmärke ribbon, text-only serif phone bar all
// LIKED — but the 44px spine's anonymous dots fail ("we should make
// relevant icons or something there"). This file changes ONLY the spine.
//
// ── The glyph system ────────────────────────────────────────────────
//
// House law, inherited from icons.tsx: 24×24 viewBox, stroke 1.6, round
// caps/joins, currentColor, no fill. New system law minted here:
//
//   · GROUND BAND — every glyph stands on a shared optical baseline at
//     y≈20.3 (house walls, the pencil's written line, the spread's
//     lower edge, the chart's ground rule; the stopwatch case
//     overshoots to it, as round forms must). Five pictograms from one
//     engraver's plate, not five downloads.
//   · Live area x∈[3.4,20.6]; one dominant mass per glyph; zero
//     interior detail that dies at 18px.
//   · Register: engraved-plate economy — floating strokes and open
//     chevrons over welded outlines; nothing rounded-friendly.
//   · Color: glyphs speak only ink/muted. The ACCENT stays reserved
//     for the bokmärke ribbon — the one accent object in the chrome.
//
// Per-door metaphors (chosen / rejected):
//
//   HEM — house, redrawn: a floating eave chevron over plain walls,
//     door as a single slit. Rejected: keeping icons.tsx Home verbatim
//     (welded roof-box with a chunky door notch — app-store grammar);
//     a colophon/hearth mark (illegible at 18px).
//   ÖVA — pencil WITH its written line. Practice-as-a-hub is marks
//     made, not a tool in a drawer; the line it just drew doubles as
//     the ground band. Rejected: dumbbell (gym register, wrong book);
//     target (collides with Framsteg's goal semantics); loop arrows
//     (says repetition only — the hub is also "öva nytt").
//   PROVPASS — stopwatch with a SINGLE sweep hand and flat crown. A
//     stopwatch has one hand; the two-hand clock face both precedents
//     drew is a wall clock in a stopwatch case. The pass's defining
//     constraint is the running 55 min — the instrument earns the
//     door. Rejected: exam sheet (loses the time dimension; at 18px a
//     sheet+clock combo is mud); hourglass (reads "loading" in UI
//     vernacular, and waiting is the opposite of a provpass).
//   UPPSLAG — an open spread with a center gutter. The door is
//     literally named for it (slå upp / ett uppslag). Rejected:
//     icons.tsx Book (a CLOSED cover — the door promises the open
//     act); magnifier (search ≠ reference shelf); bookmark (that job
//     belongs to the ribbon three pixels away).
//   FRAMSTEG — an ascending curve over the ground rule. The Framsteg
//     surface headlines "Din kurva" — the glyph quotes it. Rejected:
//     icons.tsx Chart bars (5 strokes of statistics-report, muddy at
//     18px); flag/summit (gamified register); arrow-up (generic
//     finance).
//
// ── The spine, rebuilt ──────────────────────────────────────────────
//
//   · Five glyphs (19px) replace the anonymous dots; the vertical
//     wordmark and the countdown folio stay — closed book, spine
//     furniture intact.
//   · RIBBON × GLYPH: the bokmärke hangs at the spine's LEFT EDGE,
//     descending past the active glyph — a ribbon emerges from the
//     book block's edge, it does not float over the type. The active
//     glyph turns ink; accent never touches a glyph. Rejected: ribbon
//     BEHIND the glyph (4px of accent under 1.6px strokes muddies
//     both); glyph turning accent (two accent objects per row —
//     the chrome's one-accent law breaks).
//   · SIGNAL: two options rendered. SPINE1 goes fully mute (the
//     closed book carries no marginalia; counts live in the leaders
//     when open). SPINE2 keeps exactly ONE — Öva's due-count as a
//     tiny tabular numeral riding the glyph's top-right corner, same
//     grammar as the liked phone-footer count.
//
// This is a DESIGN artifact: inert markup, real tokens + hpc-m3-*
// classes, labeled fixtures. No routes, no shared-file edits — the
// expanded rail rendered in the consistency frame is a verbatim local
// replica of the winning NAVB2 rail (unchanged by design: the owner
// judges the fold, not a redesign).

import type { CSSProperties, ReactNode, SVGProps } from 'react'

import { Book, Chart, Home, Pencil } from '@/components/icons'

// ── fixtures (labeled; mirror real signal shapes) ────────────────────

const FIX = {
  dueCount: 14,
  weekDelta: '+0,04',
  days: 114,
  sitting: 'Höstprov 26',
  frameworkCount: 25,
  resume: { headline: 'Övning · KVA', progress: '4/10' },
} as const

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

const footWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// ── the glyphs ───────────────────────────────────────────────────────

type GlyphProps = SVGProps<SVGSVGElement> & { s?: number }

const glyphBase = (s = 19): SVGProps<SVGSVGElement> => ({
  width: s,
  height: s,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
})

/** Hem — floating eave chevron over walls; door as a single slit. */
export const GlyphHem = ({ s, ...p }: GlyphProps) => (
  <svg {...glyphBase(s)} {...p} aria-hidden="true" focusable="false">
    <path d="M3.5 10.6 12 3.6l8.5 7" />
    <path d="M5.7 9.6v10.7h12.6V9.6" />
    <path d="M12 20.3v-4.4" />
  </svg>
)

/** Öva — pencil with the line it just wrote (the ground band). */
export const GlyphOva = ({ s, ...p }: GlyphProps) => (
  <svg {...glyphBase(s)} {...p} aria-hidden="true" focusable="false">
    <path d="M16.2 3.8a2.05 2.05 0 0 1 2.9 2.9L7.6 18.2l-3.9 1.1 1.1-3.9z" />
    <path d="M12.6 20.3h7.9" />
  </svg>
)

/** Provpass — stopwatch: flat crown, one sweep hand. */
export const GlyphProvpass = ({ s, ...p }: GlyphProps) => (
  <svg {...glyphBase(s)} {...p} aria-hidden="true" focusable="false">
    <circle cx="12" cy="13.7" r="6.6" />
    <path d="M9.9 2.6h4.2M12 2.6v4.5" />
    <path d="M12 13.7l3.1-3.1" />
  </svg>
)

/** Uppslag — the open spread, gutter marked. */
export const GlyphUppslag = ({ s, ...p }: GlyphProps) => (
  <svg {...glyphBase(s)} {...p} aria-hidden="true" focusable="false">
    <path d="M12 7.2C10.1 5.6 7.3 4.9 3.4 4.9v13.4c3.9 0 6.7.7 8.6 2.3 1.9-1.6 4.7-2.3 8.6-2.3V4.9c-3.9 0-6.7.7-8.6 2.3z" />
    <path d="M12 7.2v13.4" />
  </svg>
)

/** Framsteg — "Din kurva": the ascending curve over the ground rule. */
export const GlyphFramsteg = ({ s, ...p }: GlyphProps) => (
  <svg {...glyphBase(s)} {...p} aria-hidden="true" focusable="false">
    <path d="M3.5 20.3h17" />
    <path d="M4.6 16.6l4.8-4.6 3.4 2.7 6.6-7" />
  </svg>
)

type Door = {
  id: string
  label: string
  folio?: string
  Glyph: (p: GlyphProps) => ReactNode
}

const DOORS: Door[] = [
  { id: 'hem', label: 'Hem', Glyph: GlyphHem },
  { id: 'ova', label: 'Öva', folio: `${FIX.dueCount}`, Glyph: GlyphOva },
  { id: 'provpass', label: 'Provpass', folio: 'idag', Glyph: GlyphProvpass },
  { id: 'uppslag', label: 'Uppslag', folio: `${FIX.frameworkCount}`, Glyph: GlyphUppslag },
  { id: 'framsteg', label: 'Framsteg', folio: FIX.weekDelta, Glyph: GlyphFramsteg },
]

// ── artboard scaffolding ─────────────────────────────────────────────

function Board({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <section data-board style={{ marginTop: 44 }}>
      <div style={{ ...eyebrow, marginBottom: 14 }}>{caption}</div>
      {children}
    </section>
  )
}

// ── the rebuilt spine ────────────────────────────────────────────────

/** One spine slot: glyph centered; the bokmärke hangs at the LEFT EDGE
 *  beside the active glyph; the optional count rides top-right. */
export type SpineMarker = 'solid' | 'outline' | 'ground'

function SpineSlot({
  door,
  active,
  count,
  marker = 'solid',
}: {
  door: Door
  active: boolean
  count?: number
  marker?: SpineMarker
}) {
  return (
    <span
      aria-current={active ? 'page' : undefined}
      style={{
        position: 'relative',
        width: 42,
        height: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: active ? 'var(--ink)' : 'var(--muted)',
      }}
    >
      {active && marker === 'solid' && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: 4,
            top: -5,
            width: 3.5,
            height: 27,
            background: 'var(--accent)',
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 4px), 0 100%)',
          }}
        />
      )}
      {active && marker === 'outline' && (
        /* Owner note 2026-07-11: the solid slab was "the only filled
         * object in a hairline world". This ribbon speaks the glyphs'
         * own language — 1.6 stroke, open fill, wide enough (7px) that
         * the notched tail actually reads at spine size. */
        <svg
          aria-hidden
          role="presentation"
          width="9"
          height="30"
          viewBox="0 0 9 30"
          style={{ position: 'absolute', left: 2, top: -6, color: 'var(--accent)' }}
        >
          <path
            d="M1.3 0.5 L7.7 0.5 L7.7 27 L4.5 23.6 L1.3 27 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {active && marker === 'ground' && (
        /* The glyph system's own invention doing the marking: every
         * glyph stands on a shared ground band — the active door is the
         * one standing on the ACCENT segment. No new object enters the
         * spine at all. */
        <span
          aria-hidden
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 1,
            width: 15,
            height: 1.6,
            borderRadius: 1,
            background: 'var(--accent)',
          }}
        />
      )}
      <door.Glyph s={19} />
      {count ? (
        <span
          style={{
            position: 'absolute',
            top: -2,
            right: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 8.5,
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {count}
        </span>
      ) : null}
    </span>
  )
}

/** Collapsed 44px spine — closed book: wordmark, five glyphs, ribbon at
 *  the edge, countdown folio. `signal` switches SPINE1 → SPINE2. */
function Spine({
  active,
  signal,
  height = 560,
  marker = 'solid',
}: {
  active: string
  signal?: boolean
  height?: number
  marker?: SpineMarker
}) {
  return (
    <div
      style={{
        width: 44,
        height,
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px 0',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <span style={{ color: 'var(--muted)', fontSize: 13 }} aria-hidden>
        »
      </span>
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 14,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          letterSpacing: '0.04em',
          marginTop: 14,
        }}
      >
        HP-Coach
      </span>
      <nav
        aria-label="Sektioner"
        style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 24 }}
      >
        {DOORS.map((d) => (
          <SpineSlot
            key={d.id}
            door={d}
            active={active === d.id}
            count={signal && d.id === 'ova' ? FIX.dueCount : undefined}
            marker={marker}
          />
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--muted)',
          writingMode: 'vertical-rl',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {FIX.days} d
      </span>
    </div>
  )
}

// ── the winning NAVB2 rail, replicated verbatim (consistency frame) ──

function Ribbon({ height = 30 }: { height?: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 18,
        top: -6,
        width: 4,
        height,
        background: 'var(--accent)',
        clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 5px), 0 100%)',
      }}
    />
  )
}

function TocRow({ door, active }: { door: Door; active: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        padding: '11px 18px 11px 34px',
        minWidth: 0,
      }}
    >
      {active && <Ribbon />}
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 15,
          fontVariant: 'all-small-caps',
          letterSpacing: '0.07em',
          fontWeight: active ? 600 : 500,
          color: active ? 'var(--ink)' : 'var(--ink-2)',
          whiteSpace: 'nowrap',
        }}
      >
        {door.label}
      </span>
      {door.folio ? (
        <>
          <span
            aria-hidden
            style={{
              flex: 1,
              borderBottom: '1px dotted var(--muted)',
              opacity: 0.55,
              transform: 'translateY(-3px)',
              minWidth: 12,
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              letterSpacing: '0.04em',
              color: 'var(--muted)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {door.folio}
          </span>
        </>
      ) : null}
    </div>
  )
}

function TocRail({ active, height = 560 }: { active: string; height?: number }) {
  return (
    <aside
      style={{
        width: 224,
        height,
        border: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'var(--bg)',
        boxSizing: 'border-box',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          padding: '20px 18px 22px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 600,
            fontSize: 17,
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
          }}
        >
          <span style={{ color: 'var(--muted)', fontStyle: 'normal', marginRight: 5 }} aria-hidden>
            ⌜
          </span>
          HP-Coach
        </span>
        <span style={{ ...footWord, fontSize: 13 }}>«</span>
      </div>
      <div
        style={{
          ...eyebrow,
          fontSize: 9,
          padding: '0 18px 8px 34px',
          borderBottom: '1px solid var(--hairline-2)',
          marginBottom: 4,
        }}
      >
        Innehåll
      </div>
      <nav aria-label="Sektioner">
        {DOORS.map((d) => (
          <TocRow key={d.id} door={d} active={active === d.id} />
        ))}
      </nav>
      <div style={{ padding: '18px 18px 0' }}>
        <div style={{ background: 'var(--accent-soft)', padding: '12px 14px' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-2)',
            }}
          >
            Påbörjad
          </div>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--ink)',
              margin: '5px 0 2px',
            }}
          >
            {FIX.resume.headline}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {FIX.resume.progress} · fortsätt →
          </div>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: '14px 18px 16px',
          borderTop: '1px solid var(--hairline-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.06em',
            color: 'var(--ink-2)',
            fontVariantNumeric: 'tabular-nums',
            whiteSpace: 'nowrap',
          }}
        >
          {FIX.sitting} · {FIX.days} dagar
        </span>
        <span style={{ display: 'flex', gap: 14, alignItems: 'baseline' }}>
          <span style={footWord}>ljus ◐</span>
          <span style={footWord}>historik</span>
          <span style={footWord}>mer →</span>
        </span>
      </div>
    </aside>
  )
}

// ── specimen boards ──────────────────────────────────────────────────

const SPECIMEN_SIZES = [28, 20, 16] as const

function SpecimenRow() {
  return (
    <div
      style={{
        display: 'inline-grid',
        gridTemplateColumns: `72px repeat(${DOORS.length}, 96px)`,
        alignItems: 'center',
        border: '1px solid var(--hairline)',
        background: 'var(--bg)',
        padding: '22px 26px',
        rowGap: 20,
      }}
    >
      <span aria-hidden />
      {DOORS.map((d) => (
        <span
          key={d.id}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 14,
            fontVariant: 'all-small-caps',
            letterSpacing: '0.07em',
            color: 'var(--ink-2)',
            textAlign: 'center',
          }}
        >
          {d.label}
        </span>
      ))}
      {SPECIMEN_SIZES.map((size) => (
        <div key={size} style={{ display: 'contents' }}>
          <span style={{ ...eyebrow, fontSize: 9, fontVariantNumeric: 'tabular-nums' }}>
            {size} px
          </span>
          {DOORS.map((d) => (
            <span
              key={d.id}
              style={{
                display: 'flex',
                justifyContent: 'center',
                color: 'var(--ink)',
              }}
            >
              <d.Glyph s={size} />
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

/** Old stopwatch (NavBakeoffB's) — for the before-row only. */
const OldStopwatch = ({ s, ...p }: GlyphProps) => (
  <svg {...glyphBase(s)} {...p} aria-hidden="true" focusable="false">
    <circle cx="12" cy="14" r="7" />
    <path d="M12 11v3.5l2.2 1.5M9.5 3h5M12 3v4" />
  </svg>
)

function BeforeAfterStrip() {
  const before = [Home, Pencil, OldStopwatch, Book, Chart]
  return (
    <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
      {[
        {
          key: 'before',
          label: 'före — husets nuvarande glyfer (Book = stängd pärm)',
          row: before,
        },
        {
          key: 'after',
          label: 'efter — systemet: gemensam markyta y≈20',
          row: DOORS.map((d) => d.Glyph),
        },
      ].map(({ key, label, row }) => (
        <div
          key={key}
          style={{
            border: '1px solid var(--hairline)',
            background: 'var(--bg)',
            padding: '16px 22px 18px',
          }}
        >
          <div style={{ ...eyebrow, fontSize: 9, marginBottom: 12 }}>{label}</div>
          <div style={{ display: 'flex', gap: 22, color: 'var(--ink)' }}>
            {row.map((G, i) => (
              <G key={DOORS[i]?.id ?? i} s={20} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── exports ──────────────────────────────────────────────────────────

function ConceptShell({
  title,
  thesis,
  children,
}: {
  title: string
  thesis: string
  children: ReactNode
}) {
  return (
    <div style={{ padding: '40px 40px 96px', background: 'var(--panel-2, var(--bg))' }}>
      <h1 className="hpc-m3-display" style={{ fontSize: 34, fontStyle: 'italic', margin: 0 }}>
        {title}
      </h1>
      <p
        style={{
          fontSize: 14,
          color: 'var(--ink-2)',
          maxWidth: '68ch',
          margin: '10px 0 0',
          lineHeight: 1.5,
        }}
      >
        {thesis}
      </p>
      {children}
    </div>
  )
}

function SpineConcept({ signal }: { signal: boolean }) {
  return (
    <>
      <Board caption="Specimen · fem glyfer × tre storlekar — ett system: 1.6-streck, gemensam markyta, en dominant massa per glyf">
        <SpecimenRow />
      </Board>
      <Board caption="Före / efter · husets glyfer mot systemet (20 px)">
        <BeforeAfterStrip />
      </Board>
      <Board
        caption={
          signal
            ? 'Kollapsad rygg 44px · EN signal — Övas kö-antal rider glyfens övre hörn (samma grammatik som telefonfotens siffra); bandet hänger vid ryggens kant'
            : 'Kollapsad rygg 44px · helt tyst — glyferna bär dörrarna, bandet den aktiva; siffrorna bor i förteckningens punktutfyllnad när boken är öppen'
        }
      >
        <div style={{ display: 'flex', gap: 28 }}>
          <Spine active="hem" signal={signal} />
          <Spine active="ova" signal={signal} />
          <Spine active="uppslag" signal={signal} />
        </div>
      </Board>
      <Board caption="Konsistensramen · förteckningen (oförändrad, aktiv: Öva) bredvid ryggen — samma objekt, vikt: bandet byter från radens vänsterkant till ryggens; ordet blir sin glyf">
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
          <TocRail active="ova" height={640} />
          <Spine active="ova" signal={signal} height={640} />
        </div>
      </Board>
    </>
  )
}

/** SPINE1 — glyphs + fully mute spine. */
export function SPINE1() {
  return (
    <ConceptShell
      title="SPINE1 · Tyst rygg"
      thesis="Ryggens punkter ersätts av fem graverade glyfer i husets 1.6-streck: svävande taksprång, pennan med sitt skrivna streck, tidtagaruret med EN visare, det öppna uppslaget, kurvan över marklinjen. Bandet hänger vid ryggens kant — accenten rör aldrig en glyf. Stängd bok: inga siffror."
    >
      <SpineConcept signal={false} />
    </ConceptShell>
  )
}

/** SPINE2 — glyphs + the one-signal spine (Öva's due-count). */
export function SPINE2() {
  return (
    <ConceptShell
      title="SPINE2 · En signal"
      thesis="Samma glyfsystem, men ryggen behåller exakt en siffra: Övas kö-antal som liten tabellsiffra i glyfens övre hörn — samma grammatik som telefonfotens siffra. Allt annat tiger; nedräkningen står kvar som ryggens folio."
    >
      <SpineConcept signal />
    </ConceptShell>
  )
}

/** SPINEM — marker study: the owner flagged the solid bokmärke as
 *  "off" next to the 1.6-stroke glyphs (2026-07-11). Three treatments
 *  of the active marker, everything else held constant (S2 signal). */
export function SPINEM() {
  const treatments: { marker: SpineMarker; label: string; note: string }[] = [
    {
      marker: 'solid',
      label: 'M0 · Fyllt band (nuvarande)',
      note: 'Det enda fyllda objektet i en värld av 1.6-streck — tyngdklyftan som stack ut.',
    },
    {
      marker: 'outline',
      label: 'M1 · Graverat band',
      note: 'Bokmärket omritat i glyfernas eget språk: 1.6-streck, öppen fyllnad, brett nog att skåran i svansen faktiskt läses.',
    },
    {
      marker: 'ground',
      label: 'M2 · Accentmark',
      note: 'Inget nytt objekt alls — glyfernas gemensamma markyta blir accent under den aktiva dörren: du står på den markerade raden.',
    },
  ]
  return (
    <ConceptShell
      title="SPINEM · Markörstudien"
      thesis="Samma S2-rygg tre gånger; bara den aktiva markören varierar. Frågan: vilken markering talar glyfernas graverade språk i stället för att ligga ovanpå det?"
    >
      <Board caption="Tre behandlingar × tre aktiva dörrar (Hem / Öva+siffra / Uppslag) — jämför markörens vikt mot glyfens">
        <div style={{ display: 'flex', gap: 44, alignItems: 'flex-start' }}>
          {treatments.map((t) => (
            <div key={t.marker} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ ...eyebrow, fontSize: 9 }}>{t.label}</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <Spine active="hem" signal marker={t.marker} height={420} />
                <Spine active="ova" signal marker={t.marker} height={420} />
                <Spine active="uppslag" signal marker={t.marker} height={420} />
              </div>
              <p
                style={{
                  fontSize: 11.5,
                  color: 'var(--ink-2)',
                  maxWidth: '26ch',
                  margin: 0,
                  lineHeight: 1.45,
                }}
              >
                {t.note}
              </p>
            </div>
          ))}
        </div>
      </Board>
    </ConceptShell>
  )
}
