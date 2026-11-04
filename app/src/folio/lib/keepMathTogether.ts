// keepMathTogether: the R6 build.py `keep_math_together` rule as a pure
// string helper. No-break spaces join each operator to both operands, I:/II:
// to their term, coordinate pairs, products and number + unit, so a
// plain-text stem can only wrap between expressions, never inside one.
//
// Text inside the parser's inline-math sentinels (U+E000 … U+E001) is never
// edited, since KaTeX output is already atomic. While the rules run, each math
// segment is one stand-in character, the counterpart of build.py's
// <span class="math"> operand.

const NB = '\u00A0'
const MATH_OPEN = '\uE000'
const MATH_CLOSE = '\uE001'
// Outside math, U+E000 cannot occur (each one opens a segment), so it marks segments safely.
const SEG = MATH_OPEN

// build.py's OPS, with &lt;/&gt; as plain < and >. The minus is U+2212.
const OPS = '(−|\\+|=|≠|≈|×|±|≤|≥|<|>)'
// Superscript and subscript digits: plain text's </sup>, </sub> and ².
const SCRIPT = '[⁰¹²³⁴⁵⁶⁷⁸⁹₀₁₂₃₄₅₆₇₈₉]'

// The rules in build.py's order. A "run" is text between math segments, as build.py's text nodes.
const RULES: ReadonlyArray<readonly [RegExp, string]> = [
  [new RegExp(` ${OPS} `, 'g'), `${NB}$1${NB}`], // a = b, b − 1, x² = −5x, −1 < 1
  [new RegExp(`(?<=^|${SEG})${OPS} `, 'g'), `$1${NB}`], // "= −1" at the start of a run
  [new RegExp(` ${OPS}(?=$|${SEG})`, 'g'), `${NB}$1`], // "x =" at the end of a run
  [/(?<![A-Za-zÅÄÖåäö])(I{1,2}): /g, `$1:${NB}`], // I: x, II: 2y
  [/(\d) (km\/h|m\/s|km)(?![A-Za-zåäö])/g, `$1${NB}$2`], // 40 m/s, 100 km/h
  [/\((−?[^\s(),<]+), (−?[^\s(),<]+)\)/g, `($1,${NB}$2)`], // (−10, −1)
  [/(\d\/\d+) · (\d)/g, `$1${NB}·${NB}$2`], // 5/6 · 5/6
  [/\) · ([\d½(])/g, `)${NB}·${NB}$1`], // (−2) · ½
  [/(\d) · \(/g, `$1${NB}·${NB}(`], // 2 · (−1/2)
  // k₁ · k₂: a math segment or a script digit on the left; a segment, a digit or an indexed variable on the right.
  [new RegExp(`(${SEG}|${SCRIPT}) · (?=${SEG}|\\d|\\p{L}${SCRIPT})`, 'gu'), `$1${NB}·${NB}`],
]

export function keepMathTogether(text: string): string {
  const math: string[] = []
  let masked = ''
  let at = 0
  while (at < text.length) {
    const open = text.indexOf(MATH_OPEN, at)
    if (open === -1) {
      masked += text.slice(at)
      break
    }
    // An unclosed segment runs to the end, as in MathText: what may be math is never edited.
    const close = text.indexOf(MATH_CLOSE, open + 1)
    const end = close === -1 ? text.length : close + 1
    masked += text.slice(at, open) + SEG
    math.push(text.slice(open, end))
    at = end
  }
  let fixed = masked
  for (const [pattern, replacement] of RULES) fixed = fixed.replace(pattern, replacement)
  // No rule adds or drops a stand-in, so the split gives back one run per gap.
  const runs = fixed.split(SEG)
  let out = runs[0]
  for (let i = 0; i < math.length; i++) out += math[i] + runs[i + 1]
  return out
}
