// The three candidate ÖVNINGSTEXT disclosure systems for
// /dev/ovningstext-bakeoff (P5 infold PR4a). Every piece here is a pure,
// token-bound presentational part in the live M3 vocabulary; the scenes
// (OvningstextDrill, OvningstextSurfaces) decide where each one sits.
//
//   A · Marginalen — typographic. The badge is a mono eyebrow line above
//       the passage title; the rail labels beside the question and the
//       outcome carry it as a second line; the note is a one-time colophon
//       with no control; estimates get a footnote marker.
//   B · Etiketten — one object everywhere. A bordered tag above the passage
//       doubles as the note's toggle (open at first display, folded after);
//       the same tag appears beside the question once the passage tag has
//       left the screen, above the verdict, and in a box under estimates.
//   C · Bandet — a running head. One ruled band per unit, sticky for the
//       whole unit (so it is beside the question and over the feedback
//       without repeating); the note sits under it at first display; the
//       caveat is an italic line in the house disclaimer voice.
//
// Accent stays reserved for structure (M3 law): no part of the disclosure
// uses --accent or the grading colours.

import { type CSSProperties, type ReactNode, useId, useState } from 'react'

import {
  ESTIMATE_CAVEAT,
  OVNINGSTEXT_BADGE,
  OVNINGSTEXT_NOTE,
  RETIRED_NOTICE,
} from '@/components/devbake/ovningstextFixtures'

export type VariantKey = 'a' | 'b' | 'c'

export const VARIANTS: { key: VariantKey; label: string; blurb: string }[] = [
  {
    key: 'a',
    label: 'A · Marginalen',
    blurb:
      'Typografiskt och tyst: märkningen talar med sidans egen röst. Ordet står som en rad ovanför rubriken och i marginalen bredvid frågan och utfallet. Noten visas en gång, utan knapp. Uppskattningar får en fotnot (*).',
  },
  {
    key: 'b',
    label: 'B · Etiketten',
    blurb:
      'Ett och samma föremål överallt: en inramad etikett ovanför texten som också öppnar och fäller ihop noten (öppen första gången). Samma etikett dyker upp vid frågan när texten har rullat ur bild, ovanför utfallet och i en ruta under uppskattningar.',
  },
  {
    key: 'c',
    label: 'C · Bandet',
    blurb:
      'En levande kolumntitel: ett linjerat band per text som ligger kvar överst medan du läser, svarar och går igenom facit. Noten står under bandet första gången. Uppskattningar får en kursiv rad i samma röst som appens andra förbehåll.',
  },
]

const badgeType: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontWeight: 600,
  lineHeight: 1.35,
}

const noteType: CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 16,
  lineHeight: 1.5,
  color: 'var(--ink-2)',
}

const quietWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// ── A · Marginalen ───────────────────────────────────────────────────

/** A — the badge as the passage's eyebrow line, above the title. */
export function EyebrowBadge() {
  return (
    <p data-testid="ovn-badge" style={{ ...badgeType, color: 'var(--ink-2)', margin: '0 0 12px' }}>
      {OVNINGSTEXT_BADGE}
    </p>
  )
}

/** A — the first-display note, set as a colophon in the tactic-aside
 *  voice (hairline left rule, italic serif). No control: on every later
 *  display of the unit it is simply not there. */
export function ColophonNote() {
  return (
    <p
      data-testid="ovn-note"
      style={{
        ...noteType,
        fontStyle: 'italic',
        margin: '0 0 22px',
        padding: '2px 0 2px 16px',
        borderLeft: '1px solid var(--hairline)',
        maxWidth: '60ch',
      }}
    >
      {OVNINGSTEXT_NOTE}
    </p>
  )
}

/** A — a rail label carrying the badge as its second line (the M3 rail
 *  renders both uppercase; `strong` is the first, ink-2 line). */
export function railWithBadge(label: string): ReactNode {
  return (
    <>
      <strong>{label}</strong>
      <span data-testid="ovn-rail-badge">{OVNINGSTEXT_BADGE}</span>
    </>
  )
}

/** A — the footnote marker on an LÄS/ELF-based number. Half the number's
 *  size, but never below 11px (a 16px ledger score would get an 8px mark). */
export function CaveatMarker() {
  return (
    <sup
      aria-hidden
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 'max(0.5em, 11px)',
        color: 'var(--muted)',
        marginLeft: 2,
        fontStyle: 'normal',
      }}
    >
      *
    </sup>
  )
}

/** A — the caveat as the surface's footnote. Referenced from the marked
 *  numbers through aria-describedby. */
export function CaveatFootnote({ id }: { id: string }) {
  return (
    <p
      id={id}
      data-testid="ovn-caveat"
      style={{
        margin: '20px 0 0',
        fontSize: 12.5,
        lineHeight: 1.55,
        color: 'var(--muted)',
        maxWidth: '62ch',
      }}
    >
      <span aria-hidden style={{ fontFamily: 'var(--font-mono)', marginRight: 6 }}>
        *
      </span>
      {ESTIMATE_CAVEAT}
    </p>
  )
}

/** A — a retired unit's history row: the notice stands in the prompt cell. */
export function RetiredInlineNotice() {
  return (
    <span
      data-testid="ovn-retired"
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 14.5,
        color: 'var(--muted)',
      }}
    >
      {RETIRED_NOTICE}
    </span>
  )
}

// ── B · Etiketten ────────────────────────────────────────────────────

/** B — the tag. Square corners like the house section tags; `dashed`
 *  marks a unit that is no longer in use. */
export function Tag({ dashed = false, small = false }: { dashed?: boolean; small?: boolean }) {
  return (
    <span
      data-testid="ovn-tag"
      style={{
        ...badgeType,
        letterSpacing: '0.12em',
        display: 'inline-block',
        color: dashed ? 'var(--muted)' : 'var(--ink)',
        border: `1px ${dashed ? 'dashed var(--muted)' : 'solid var(--ink-2)'}`,
        padding: small ? '1px 6px' : '3px 8px',
        background: 'var(--bg)',
        whiteSpace: 'nowrap',
        textAlign: 'left',
      }}
    >
      {OVNINGSTEXT_BADGE}
    </span>
  )
}

/** B — the tag above the passage, doubling as the note's disclosure
 *  button: open at the unit's first display, folded on later displays.
 *  Reading never requires the click; it only lets the reader re-open
 *  (or put away) the note. Toggle words reuse the house `läs mer +` /
 *  `fäll ihop −` pair from the lesson cards. */
export function TagWithNote({ firstDisplay }: { firstDisplay: boolean }) {
  const [open, setOpen] = useState(firstDisplay)
  const noteId = useId()
  return (
    <div style={{ margin: '0 0 18px' }}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={noteId}
        onClick={() => setOpen((o) => !o)}
        data-testid="ovn-tag-toggle"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          minHeight: 32,
          padding: 0,
          border: 0,
          background: 'transparent',
          color: 'inherit',
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        <Tag />
        <span style={quietWord}>{open ? 'fäll ihop −' : 'läs mer +'}</span>
      </button>
      <p
        id={noteId}
        hidden={!open}
        data-testid="ovn-note"
        style={{
          ...noteType,
          margin: '10px 0 0',
          padding: '12px 16px',
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
          maxWidth: '62ch',
        }}
      >
        {OVNINGSTEXT_NOTE}
      </p>
    </div>
  )
}

/** B — the question's rail label; the tag joins it only while the
 *  passage tag is off screen. Its slot is always reserved, so the page
 *  never shifts when it appears. */
export function questionRailWithTag(label: string, show: boolean): ReactNode {
  return (
    <>
      <strong>{label}</strong>
      <span
        aria-hidden={!show}
        data-testid="ovn-question-tag"
        data-shown={show ? 'true' : 'false'}
        style={{
          display: 'inline-block',
          marginTop: 8,
          opacity: show ? 1 : 0,
          visibility: show ? 'visible' : 'hidden',
          transition: 'opacity 160ms ease',
        }}
      >
        <Tag small />
      </span>
    </>
  )
}

/** B — the caveat as a box bound to the estimate, led by the same tag
 *  the reader meets in every drill. */
export function CaveatBox() {
  return (
    <div
      data-testid="ovn-caveat"
      style={{
        marginTop: 16,
        padding: '10px 14px',
        border: '1px solid var(--hairline)',
        background: 'var(--panel)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        columnGap: 12,
        rowGap: 6,
        maxWidth: '64ch',
      }}
    >
      <Tag small />
      <p
        style={{
          margin: 0,
          flex: '1 1 30ch',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
        }}
      >
        {ESTIMATE_CAVEAT}
      </p>
    </div>
  )
}

/** B — a retired unit's history row: a dashed tag, then the notice. */
export function RetiredTagNotice() {
  return (
    <span
      data-testid="ovn-retired"
      style={{ display: 'inline-flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}
    >
      <Tag small dashed />
      <span style={{ fontSize: 14, color: 'var(--ink-2)' }}>{RETIRED_NOTICE}</span>
    </span>
  )
}

// ── C · Bandet ───────────────────────────────────────────────────────

/** C — the unit's running head: an ink-ruled band with the badge left and
 *  the unit's title right. Sticky for the whole unit when `sticky`. The
 *  `right` slot replaces the title (the retired notice in history).
 *  A sticky box stops at the scroll container's padding edge, so on the
 *  phone page (4px top padding) scrolled text would show above the band;
 *  a paper-coloured cap covers that strip. */
export function UnitBand({
  title,
  sticky = true,
  right,
  style,
}: {
  title?: string
  sticky?: boolean
  right?: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      data-testid="ovn-band"
      style={{
        position: sticky ? 'sticky' : 'static',
        top: 0,
        zIndex: 4,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        padding: '9px 0 8px',
        borderTop: '1px solid var(--ink)',
        borderBottom: '1px solid var(--hairline)',
        background: 'var(--bg)',
        boxShadow: sticky ? '0 -8px 0 var(--bg)' : undefined,
        ...style,
      }}
    >
      <span style={{ ...badgeType, color: 'var(--ink)', flexShrink: 0 }}>{OVNINGSTEXT_BADGE}</span>
      {right ?? (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--muted)',
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      )}
    </div>
  )
}

/** C — the first-display note, set under the band (upright serif); the
 *  passage section's own rule closes it. It scrolls away with the passage
 *  while the band stays. */
export function BandNote({ style }: { style?: CSSProperties }) {
  return (
    <p
      data-testid="ovn-note"
      style={{
        ...noteType,
        margin: 0,
        padding: '12px 0 4px',
        maxWidth: '64ch',
        ...style,
      }}
    >
      {OVNINGSTEXT_NOTE}
    </p>
  )
}

/** C — the caveat as one italic line under the estimate, in the voice of
 *  MockResult's existing "Linjär skattning — indikativ" disclaimer. */
export function CaveatLine() {
  return (
    <p
      data-testid="ovn-caveat"
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--muted)',
        margin: '8px 0 0',
        maxWidth: '62ch',
      }}
    >
      {ESTIMATE_CAVEAT}
    </p>
  )
}

/** C — the retired notice in a history group's band. */
export function RetiredBandNotice() {
  return (
    <span
      data-testid="ovn-retired"
      style={{ fontSize: 14, color: 'var(--ink-2)', textAlign: 'right', minWidth: 0 }}
    >
      {RETIRED_NOTICE}
    </span>
  )
}
