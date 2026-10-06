// flattenMathText / flattenLatex — plain-text projection of bank
// strings for attribute contexts (alt, aria-label) where KaTeX HTML
// can't render. The contract: never leak the U+E000/U+E001 sentinels
// or raw LaTeX control sequences into a plain string.
//
// MathText itself: a math segment is KaTeX's HTML, and when KaTeX
// throws, the segment is shown as text — never inserted as HTML
// (PR #370 round 9, bead hpf-dhjn). The HTML-sink guard at the end of
// this file is the authority for that guarantee (round 10, bead hpf-sn6u).

import { render } from '@testing-library/react'
import katex, { type KatexOptions } from 'katex'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { flattenLatex, flattenMathText, MathText } from './MathText'

const M = (latex: string) => `\uE000${latex}\uE001`

describe('flattenLatex', () => {
  it('drops subscript markup: L_{1} → L1', () => {
    expect(flattenLatex('L_{1}')).toBe('L1')
  })

  it('keeps a caret for superscripts: x^{2} → x^2', () => {
    expect(flattenLatex('x^{2}')).toBe('x^2')
  })

  it('fractions become slashes', () => {
    expect(flattenLatex('\\frac{3}{4}')).toBe('3/4')
  })

  it('common operators map to unicode', () => {
    expect(flattenLatex('a \\cdot b \\leq c')).toBe('a · b ≤ c')
  })

  it('unwraps \\mathrm units', () => {
    expect(flattenLatex('12 \\mathrm{dm}^{3}')).toBe('12 dm^3')
  })

  it('drops unknown commands and stray braces rather than leaking them', () => {
    expect(flattenLatex('\\overline{AB}')).toBe('AB')
  })
})

describe('flattenMathText', () => {
  it('passes plain prose through untouched', () => {
    expect(flattenMathText('fundera över')).toBe('fundera över')
  })

  it('handles null/undefined', () => {
    expect(flattenMathText(null)).toBe('')
    expect(flattenMathText(undefined)).toBe('')
  })

  it('flattens the NOG-023 option to readable text with no sentinels', () => {
    const raw = `i ${M('(_{1}')} ) tillsammans med ${M('(_{2}')} )`
    expect(flattenMathText(raw)).toBe('i (1 ) tillsammans med (2 )')
  })

  it('tolerates an unbalanced open sentinel', () => {
    expect(flattenMathText(`x ${'\uE000'}y_{1}`)).toBe('x y1')
  })
})

describe('MathText aria-label', () => {
  it('exposes flattened plain text, not raw LaTeX', () => {
    const { container } = render(<MathText>{`f ${M('L_{1}')}`}</MathText>)
    const math = container.querySelector('[role="math"]')
    expect(math?.getAttribute('aria-label')).toBe('L1')
  })
})

// MathText's KaTeX options, for building the expected output.
const KATEX_OPTIONS: KatexOptions = { output: 'html', throwOnError: false, strict: 'ignore' }

// Codex review R9 (hpf-wov1): label markup that only an HTML parser
// hides. Shown as text, it is a visibly different string; inserted as
// HTML, it reads WORLD_KNOWLEDGE.
const MARKUP = 'WORLD_<span title=">">KNOWLEDGE</span>'

describe('MathText when KaTeX throws', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  // No element is made from the segment's markup, and its characters
  // are on screen as they stand.
  function expectShownAsText(container: HTMLElement, segment: string) {
    const math = container.querySelector('[role="math"]')
    expect(math).not.toBeNull()
    expect(math?.childElementCount).toBe(0)
    expect(container.querySelector('[title]')).toBeNull()
    expect(math?.textContent).toBe(segment)
    expect(math?.getAttribute('aria-label')).toBe(flattenLatex(segment))
  }

  it('shows the segment as text, not HTML', () => {
    const renderToString = vi.spyOn(katex, 'renderToString').mockImplementation(() => {
      throw new RangeError('Maximum call stack size exceeded')
    })
    const { container } = render(<MathText>{`f ${M(MARKUP)} g`}</MathText>)
    expect(renderToString).toHaveBeenCalled()
    expectShownAsText(container, MARKUP)
    expect(container.textContent).toBe(`f ${MARKUP} g`)
  })

  // 30 s: forcing KaTeX's RangeError takes deep recursion, slow on a cold start or loaded CI.
  it('shows the R9 deep-nesting segment as text, with the real KaTeX', () => {
    // R9 used 835 levels, which sits on the stack limit (plain Node 22
    // renders it as a parse error); 20 000 overflows any default stack.
    const depth = 20_000
    const segment = '\\frac{'.repeat(depth) + MARKUP + '}'.repeat(depth)
    // precondition: the locked KaTeX throws past throwOnError: false
    expect(() => katex.renderToString(segment, KATEX_OPTIONS)).toThrow(RangeError)
    const { container } = render(<MathText>{M(segment)}</MathText>)
    expectShownAsText(container, segment)
  }, 30_000)
})

describe('MathText with KaTeX', () => {
  // KaTeX's HTML for latex, as the DOM serializes it
  function katexHtml(latex: string) {
    const span = document.createElement('span')
    span.innerHTML = katex.renderToString(latex, KATEX_OPTIONS)
    return span.innerHTML
  }

  it('typesets a math segment as KaTeX HTML, without MathML', () => {
    const { container } = render(<MathText>{`a ${M('x^{2} - 15')} b`}</MathText>)
    const math = container.querySelector('[role="math"]')
    expect(math?.innerHTML).toBe(katexHtml('x^{2} - 15'))
    expect(math?.querySelector('.katex-html')).not.toBeNull()
    expect(math?.querySelector('.katex-mathml')).toBeNull()
    expect(math?.getAttribute('aria-label')).toBe('x^2 - 15')
    expect(container.textContent?.startsWith('a ')).toBe(true)
    expect(container.textContent?.endsWith(' b')).toBe(true)
  })

  it('sets multi-letter units upright', () => {
    const { container } = render(<MathText>{M('12 dm^{3}')}</MathText>)
    const math = container.querySelector('[role="math"]')
    expect(math?.innerHTML).toBe(katexHtml('12 \\mathrm{dm}^{3}'))
  })

  it("leaves a parse error to KaTeX's own error rendering, as text", () => {
    const segment = `\\frac{${MARKUP}`
    const { container } = render(<MathText>{M(segment)}</MathText>)
    const math = container.querySelector('[role="math"]')
    expect(math?.innerHTML).toBe(katexHtml(segment))
    expect(math?.querySelector('.katex-error')?.textContent).toBe(segment)
    expect(math?.querySelector('[title=">"]')).toBeNull()
  })
})

// The HTML-sink guard (PR #370 round 10, bead hpf-sn6u): the authority for
// MathText's guarantee in pipeline/synthetic/LAYER2-RENDERING.md. KaTeX's
// output is the only HTML MathText inserts, and segment and prose text are
// always text nodes. Every rendering path gets every hostile string below,
// and CI's app job runs these tests. test_lint_renderer_assumption_round8.py
// fails if they go missing; its check of MathText.tsx's source is only a
// tripwire (Codex review R10, hpf-xg9u).

// Markup that an HTML or Markdown parser turns into elements or other
// characters. Shown as text, each is a visibly different string.
const HOSTILE: Array<[string, string]> = [
  ['R8-H1, a quoted > in an attribute', MARKUP],
  ['an img with an event handler', '<img src=x onerror=alert(1)>'],
  ['a bold label', '<b>WORLD_KNOWLEDGE</b>'],
  ['a numeric character reference', 'WORLD&#95;KNOWLEDGE'],
  ['a named character reference', 'WORLD&lowbar;KNOWLEDGE'],
  ["a span that spoofs KaTeX's class", '<span class="katex">WORLD</span>_KNOWLEDGE'],
  ['R8-M6, a Markdown link', '[WORLD](a(b(c)d)e)_KNOWLEDGE'],
  ['a KaTeX link to javascript:', '\\href{javascript:alert(1)}{WORLD}'],
]

// The elements a MathText render may hold, and nothing else. MathText's own
// are the container's children: a bare <span> per prose segment and a
// <span role="math"> per math segment. Below a math segment's span, KaTeX's:
// a katex* class or inside .katex, a span or KaTeX's SVG, and a title only on
// KaTeX's error span. A segment can spell such a class itself, so every test
// also checks its exact output; this check names the element that strays.
const KATEX_TAGS = new Set(['span', 'svg', 'path', 'line'])

function strayElements(container: HTMLElement): string[] {
  const belongs = (el: Element) => {
    if (el.parentElement === container) {
      const role = el.getAttribute('role')
      return el.localName === 'span' && (el.attributes.length === 0 || role === 'math')
    }
    return (
      el.closest('[role="math"]') !== null &&
      ([...el.classList].some((c) => c.startsWith('katex')) || el.closest('.katex') !== null) &&
      KATEX_TAGS.has(el.localName) &&
      (!el.hasAttribute('title') || el.classList.contains('katex-error'))
    )
  }
  return [...container.querySelectorAll('*')]
    .filter((el) => !belongs(el))
    .map((el) => el.outerHTML.slice(0, 120))
}

// html as the DOM serializes it
function serialized(html: string): string {
  const span = document.createElement('span')
  span.innerHTML = html
  return span.innerHTML
}

function count(text: string, char: string): number {
  return text.split(char).length - 1
}

describe('MathText HTML-sink guard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(HOSTILE)('KaTeX renders a math segment: only its output is HTML — %s', (_, segment) => {
    const renderToString = vi.spyOn(katex, 'renderToString')
    const { container } = render(<MathText>{`f ${M(segment)} g`}</MathText>)
    const math = container.querySelector('[role="math"]')
    // the sink holds what KaTeX returned, and nothing else
    expect(renderToString).toHaveBeenCalledOnce()
    expect(math?.innerHTML).toBe(serialized(renderToString.mock.results[0]?.value))
    expect(strayElements(container)).toEqual([])
    // the markup's syntax characters are on screen, as KaTeX set them
    for (const char of '<>&"') {
      expect(count(math?.textContent ?? '', char), char).toBe(count(segment, char))
    }
    expect(container.textContent).toBe(`f ${math?.textContent} g`)
  })

  it.each(HOSTILE)('KaTeX throws on a math segment: it is a text node — %s', (_, segment) => {
    const renderToString = vi.spyOn(katex, 'renderToString').mockImplementation(() => {
      throw new RangeError('Maximum call stack size exceeded')
    })
    const { container } = render(<MathText>{`f ${M(segment)} g`}</MathText>)
    const math = container.querySelector('[role="math"]')
    expect(renderToString).toHaveBeenCalledOnce()
    expect(math?.childElementCount).toBe(0)
    expect(math?.textContent).toBe(segment)
    expect(strayElements(container)).toEqual([])
    expect(container.textContent).toBe(`f ${segment} g`)
  })

  it.each(HOSTILE)('prose without math: the string is a text node — %s', (_, text) => {
    const { container } = render(<MathText>{text}</MathText>)
    expect(container.childElementCount).toBe(0)
    expect(container.textContent).toBe(text)
  })

  it.each(HOSTILE)('prose beside math: each prose segment is a text node — %s', (_, text) => {
    const { container } = render(<MathText>{`${text} ${M('x^{2}')} ${text}`}</MathText>)
    const [before, math, after] = container.children
    expect(container.childElementCount).toBe(3)
    expect(math?.getAttribute('role')).toBe('math')
    expect(before?.childElementCount).toBe(0)
    expect(after?.childElementCount).toBe(0)
    expect(before?.textContent).toBe(`${text} `)
    expect(after?.textContent).toBe(` ${text}`)
    expect(strayElements(container)).toEqual([])
  })
})
