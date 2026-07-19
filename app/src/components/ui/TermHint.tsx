// TermHint — the label micro-glossary (P2.2).
//
// Every epistemic label a day-zero user meets ("normerat (härlett)",
// "indikativ", "preliminär") gets a one-tap plain sentence. The label
// renders exactly where it already lives — inheriting the site's font
// and color — with a fine dotted underline as the print idiom's
// "explained term" affordance. Tapping reveals the sentence INLINE as
// a footnote: a quiet ORDLISTA eyebrow, italic display face, thin
// accent left-rule. No popover positioning, no card chrome (banned
// since A.8), phone-first — ink appears on the page, Skriften-style.
//
// Copy is OWNER-RATIFIED and verbatim — do not edit sentences here
// without a new ratification. Accessibility: real <button> semantics,
// aria-expanded + aria-controls; Esc and tap-away dismiss.

import { type CSSProperties, type ReactNode, useEffect, useId, useRef, useState } from 'react'

export type GlossaryTermKey = 'normerat-harlett' | 'indikativ' | 'preliminar'

export const GLOSSARY: Record<GlossaryTermKey, { label: string; sentence: string }> = {
  'normerat-harlett': {
    label: 'normerat (härlett)',
    sentence:
      'Rättat mot det riktiga provets poängtabell. Så nära en riktig normering det går utan UHR.',
  },
  indikativ: {
    label: 'indikativ',
    sentence:
      'En grov uppskattning — passet är hopplockat, så det finns ingen riktig poängtabell. Använd den för tempo, inte för prognos.',
  },
  preliminar: {
    label: 'preliminär',
    sentence: 'Svårighetsgraden är beräknad, inte ännu bekräftad av riktiga svar.',
  },
}

type TermHintProps = {
  term: GlossaryTermKey
  /** Visible label override for inline grammar ("Indikativt" mid-
   *  sentence). Defaults to the glossary's canonical label. */
  children?: ReactNode
  /** Style override forwarded to the button (rarely needed — the
   *  button inherits font/size/color from its site by default). */
  style?: CSSProperties
}

export function TermHint({ term, children, style }: TermHintProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLSpanElement>(null)
  const noteId = useId()
  const entry = GLOSSARY[term]

  // Esc + tap-away dismiss, attached only while open.
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current && e.target instanceof Node && !rootRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  return (
    <span ref={rootRef} style={{ display: 'inline' }}>
      <button
        type="button"
        data-testid={`term-hint-${term}`}
        aria-expanded={open}
        aria-controls={noteId}
        onClick={() => setOpen((v) => !v)}
        style={{
          // Inherit the site's typography — the term must keep reading
          // as the label it is, with only the dotted rule added.
          all: 'unset',
          font: 'inherit',
          letterSpacing: 'inherit',
          color: 'inherit',
          cursor: 'pointer',
          textDecoration: 'underline dotted',
          textDecorationColor: 'var(--muted)',
          textUnderlineOffset: 3,
          ...style,
        }}
      >
        {children ?? entry.label}
      </button>
      {open && (
        // <span display:block> — the note must be valid inside a <p>
        // (a <div> would auto-close the paragraph).
        <span
          id={noteId}
          data-testid={`term-hint-note-${term}`}
          style={{
            display: 'block',
            margin: '8px 0 2px',
            paddingLeft: 10,
            borderLeft: '2px solid var(--accent)',
            maxWidth: '46ch',
          }}
        >
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-mono)',
              fontStyle: 'normal',
              fontSize: 9.5,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: 3,
            }}
          >
            Ordlista
          </span>
          <span
            style={{
              display: 'block',
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: 13,
              lineHeight: 1.5,
              letterSpacing: 'normal',
              textTransform: 'none',
              color: 'var(--ink-2)',
            }}
          >
            {entry.sentence}
          </span>
        </span>
      )}
    </span>
  )
}
