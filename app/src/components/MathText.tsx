// MathText — render a string with inline LaTeX segments fenced by
// the parser's private-use Unicode delimiters (U+E000 / U+E001).
//
// The quant parser emits LaTeX inline (e.g. "x² - 15" → "x^{2} - 15")
// when it detects superscripts. Plain-text questions never contain
// the delimiters, so they pass through unchanged with zero overhead.
// We deliberately don't use the conventional `$...$` because HP source
// PDFs occasionally contain a literal `$` glyph inside stacked-
// fraction renderings — that would collide and break KaTeX parsing.
//
// We call `katex.renderToString` directly (instead of <InlineMath />
// from react-katex) so we can pass `output: 'html'`. Without it,
// KaTeX emits a side-by-side <span class="katex-mathml"> for screen
// readers AND a visible <span class="katex-html">; both contribute
// to .textContent, so each `L_{1}` shows up TWICE when the user
// selects+copies the prompt — once as "L1" (from the MathML
// <mi>L</mi><mn>1</mn>) and once as "L 1​" (from the visible HTML
// with a U+200B). Visually fine, but ugly in copy/paste and noisy
// for any consumer that walks the DOM as text.
//
// Trade-off: dropping MathML loses the structured math representation
// for assistive tech. We compensate by setting `aria-label` to the
// raw LaTeX on the wrapping span — not perfect spoken English, but
// unambiguous and far better than the doubled glyphs.

import katex from 'katex'

const MATH_OPEN = ''
const MATH_CLOSE = ''

type Props = {
  children: string | null | undefined
}

// Multi-letter SI / common units that the parser emits as bare letter
// clusters inside math segments (e.g. `12 dm^{3}`, `6 kg`). KaTeX's
// default behavior italicizes every letter as a math variable, so
// `dm` renders as the product `d·m` in italic. Wrapping the cluster
// in `\mathrm{…}` makes it render upright like a unit symbol.
//
// Single-letter units (`m`, `s`, `l`, `t`, `g`) are intentionally
// excluded — they collide with common HP variable names and the
// italic default is correct most of the time. The visible win is on
// multi-letter clusters where context makes the unit reading
// unambiguous.
const UNIT_RE = /\b(mm|cm|dm|km|mg|kg|ml|cl|dl|min|kr|Hz|SEK)\b/g

function wrapUnits(latex: string): string {
  return latex.replace(UNIT_RE, '\\mathrm{$1}')
}

function renderMath(latex: string): string {
  try {
    return katex.renderToString(wrapUnits(latex), {
      output: 'html',
      throwOnError: false,
      strict: 'ignore',
    })
  } catch {
    // throwOnError:false should cover this, but belt-and-braces in
    // case a future KaTeX version starts throwing through a different
    // path (e.g. macro expansion).
    return latex
  }
}

export function MathText({ children }: Props) {
  if (!children) return null
  // Fast path: no delimiter → no math, just return the string. Avoids
  // an array-allocation per render for the ~85% of questions (verbal +
  // text-only quant) that don't use math at all.
  if (!children.includes(MATH_OPEN)) {
    return <>{children}</>
  }

  const segments: Array<{ math: boolean; text: string }> = []
  let i = 0
  while (i < children.length) {
    const start = children.indexOf(MATH_OPEN, i)
    if (start === -1) {
      segments.push({ math: false, text: children.slice(i) })
      break
    }
    if (start > i) {
      segments.push({ math: false, text: children.slice(i, start) })
    }
    const end = children.indexOf(MATH_CLOSE, start + 1)
    if (end === -1) {
      // Unbalanced delimiter — render the rest as plain text rather
      // than throwing a KaTeX parse error. Better a slightly-wrong
      // display than a crashed component.
      segments.push({ math: false, text: children.slice(start + 1) })
      break
    }
    segments.push({ math: true, text: children.slice(start + 1, end) })
    i = end + 1
  }

  return (
    <>
      {segments.map((seg, idx) =>
        seg.math ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: stable order, no reordering
            key={idx}
            role="math"
            aria-label={seg.text}
            // KaTeX-emitted HTML on parser-controlled input — no user
            // text ever reaches `seg.text`.
            // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted parser output
            dangerouslySetInnerHTML={{ __html: renderMath(seg.text) }}
          />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable order, no reordering
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </>
  )
}
