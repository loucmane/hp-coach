// MathText — render a string with inline LaTeX segments fenced by
// the parser's private-use Unicode delimiters (U+E000 / U+E001).
//
// The quant parser emits LaTeX inline (e.g. "x² - 15" → "x^{2} - 15")
// when it detects superscripts. Plain-text questions never contain
// the delimiters, so they pass through unchanged with zero overhead.
// We deliberately don't use the conventional `$...$` because HP source
// PDFs occasionally contain a literal `$` glyph inside stacked-
// fraction renderings — that would collide and break KaTeX parsing.

import { InlineMath } from 'react-katex'

const MATH_OPEN = ''
const MATH_CLOSE = ''

type Props = {
  children: string | null | undefined
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
          // biome-ignore lint/suspicious/noArrayIndexKey: stable order, no reordering
          <InlineMath key={idx} math={seg.text} />
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable order, no reordering
          <span key={idx}>{seg.text}</span>
        ),
      )}
    </>
  )
}
