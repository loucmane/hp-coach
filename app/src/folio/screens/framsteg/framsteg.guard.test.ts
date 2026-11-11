import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const bannedColour =
  /--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(|opacity\s*:/i
// Literal Tailwind palettes bypass Folio tokens just like inline hex colours.
const paletteClass =
  /\b(?:bg|text|border(?:-[xytrblse])?|divide|outline|ring(?:-offset)?|shadow|fill|stroke|decoration|accent|caret|from|via|to)-(?:(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}|black|white)\b/i
function colourViolations(css: string, source: string): string[] {
  const violations = bannedColour.test(css) ? [css] : []
  const ast = ts.createSourceFile(
    'screen.tsx',
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      ['style', 'fill', 'color', 'stroke', 'stopColor', 'className'].includes(
        node.name.getText(ast),
      )
    ) {
      const value = node.initializer?.getText(ast) ?? ''
      if (
        bannedColour.test(value) ||
        (node.name.getText(ast) === 'className' && paletteClass.test(value))
      )
        violations.push(node.getText(ast))
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return violations
}
describe('Framsteg isolation', () => {
  it('keeps the Folio branch lazy and after every route hook and summary', () => {
    const source = read('../../../routes/progress.tsx')
    const ast = ts.createSourceFile(
      'progress.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    expect(
      ast.statements
        .filter(ts.isImportDeclaration)
        .map((s) => s.moduleSpecifier.getText(ast))
        .filter((s) => s.includes('folio/screens')),
    ).toEqual([])
    expect(source).toContain("lazy(() => import('@/folio/screens/framsteg/FolioFramsteg'))")
    expect(source).toContain('<Suspense')
    expect(source.indexOf('if (inFolio)')).toBeGreaterThan(
      source.indexOf('summarizeFrameworkProgress(progress.data'),
    )
    expect(source.slice(source.indexOf('if (inFolio)'))).not.toMatch(/\buse[A-Z]\w*\(/)
    expect(source).not.toMatch(/useTopTraps|useSessionHistory|useDueMistakes|useViewport/)
  })
  it('scopes CSS and allows accent only on the exact data marks', () => {
    const css = read('./framsteg.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors)
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-framsteg(?:[\s.[:]|$)/)
    expect(colourViolations(css, '')).toEqual([])
    const allowed: string[] = []
    const actual: string[] = []
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      if (/var\(--fa-accent/.test(rule[2]))
        for (const selector of rule[1].split(','))
          actual.push(selector.trim().replace('[data-folio] .fa-framsteg ', ''))
    expect([...new Set(actual)].sort()).toEqual(allowed.sort())
  })
  it('uses token-only vertical bands with a stationary, phone-sized weekly grid', () => {
    const css = read('./framsteg.css')
    expect(css).toContain('repeat(var(--fa-week-count), minmax(0, 1fr))')
    expect(css).toContain('.fa-week-band::before')
    expect(css).toContain(
      'linear-gradient(180deg, transparent, var(--fa-week-ink) 20%, var(--fa-week-ink) 80%, transparent)',
    )
    const weeklyRules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((r) =>
      /\.fa-(?:week|chart)/.test(r[1]),
    )
    expect(weeklyRules.length).toBeGreaterThan(5)
    const declarations = read('../../styles/tokens.css') + css + read('./TrendChart.tsx')
    for (const rule of weeklyRules) {
      expect(rule[2]).not.toMatch(/animation:|transition:|min-width:\s*\d+px/)
      for (const [, token] of rule[2].matchAll(/var\((--fa-[\w-]+)/g))
        expect(declarations).toMatch(new RegExp(`${token}['"]?\\s*:`))
    }
    expect(read('./TrendChart.tsx')).not.toMatch(/<path|<polyline|weeklyScore/)
  })
  it('uses scoped keys and the shared Ljusbord primitives', () => {
    expect(read('./FolioFramsteg.tsx')).toContain('useScopedKeys')
    expect(read('./FramstegReport.tsx')).toContain('<Lit')
    expect(read('./FramstegReport.tsx')).toContain('<Go')
    expect(read('./FramstegSections.tsx')).toContain('<FramstegBand')
    expect(read('./FramstegReport.tsx')).toContain('<RangeBand')
    expect(read('./FramstegReport.tsx')).not.toContain("window.addEventListener('keydown'")
  })
  it('keeps decimal punctuation proportional in the display range', () => {
    const css = read('./framsteg.css')
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((r) =>
      r[1].includes('.fa-result-n'),
    )
    expect(rules.some((r) => /font-variant-numeric:\s*proportional-nums/.test(r[2]))).toBe(true)
    expect(rules.every((r) => !/tabular-nums/.test(r[2]))).toBe(true)
  })
  it('constrains the mini-band box and preserves its gradient core after clipping', () => {
    const css = read('./framsteg.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const rule = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].find(
      (r) => r[1].trim() === '[data-folio] .fa-framsteg .fa-fr-band .fa-ui-band-range',
    )?.[2]
    expect(rule).toContain('max-width: var(--fa-fr-band-width)')
    expect(rule).toContain('margin-left: var(--fa-fr-band-shift)')
    expect(rule).toContain('var(--fa-fr-band-core-start)')
    expect(rule).toContain('var(--fa-fr-band-core-end)')
  })
  it('binds the custom evidence marks to all eight section tokens', () => {
    const css = read('./framsteg.css')
    for (const key of ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk']) {
      expect(css).toContain(
        `[data-sec="${key}"] { --fa-fr-c: var(--fa-sec-${key}); --fa-fr-soft: var(--fa-sec-${key}-soft); }`,
      )
    }
    // ui.css binds its private colour variables to SecChip/RangeBand classes only.
    expect(css).not.toContain('var(--fa-ui-c')
  })
  it.each([
    '<div style={{ color: "red" }} />',
    '<div style={{ backgroundColor: "#b00020" }} />',
    '<div style={{ color: "var(--fa-bad)" }} />',
    '<div style={{ color: "rgb(255 0 0)" }} />',
    '<path fill="red" />',
    '<path fill={"#f00"} />',
    '<path fill={active ? "var(--fa-ink)" : "hsl(0 100% 50%)"} />',
    '<span color="red" />',
    '<span color={"oklch(50% 0.2 20)"} />',
    '<path stroke="red" />',
    '<path stroke={"#f00"} />',
    '<stop stopColor="red" />',
    '<stop stopColor={active ? "var(--fa-ink)" : "rgb(255 0 0)"} />',
    '<span className="text-red-600" />',
    '<span className={active ? "fa-meta" : "dark:hover:bg-red-500/20"} />',
    '<path className="stroke-red-500" />',
    '<span className="text-[#f00]" />',
    '<span className="bg-[rgb(255_0_0)]" />',
    '<span className="border-[var(--fa-bad)]" />',
    '<span className="text-blue-500" />',
    '<span className="hover:ring-rose-600" />',
  ])('rejects a planted inline colour: %s', (source) => {
    expect(colourViolations('', source)).not.toEqual([])
  })
  it('permits token colours and geometry while ignoring unrelated product text', () => {
    expect(
      colourViolations(
        '',
        '<div className="fa-meta text-sm font-medium border-2 w-[50%] hover:underline" style={{ left: "50%", width: "10%" }}><svg color="currentColor"><path fill="var(--fa-ink)" stroke="currentColor" className="stroke-2 fill-none" /><stop stopColor="var(--fa-ink)" /></svg>red #f00</div>',
      ),
    ).toEqual([])
  })
  it('imports no prototype, sibling screen or classic progress implementation', () => {
    for (const file of [
      'FolioFramsteg.tsx',
      'FramstegReport.tsx',
      'FramstegSections.tsx',
      'TrendChart.tsx',
      'FramstegMargin.tsx',
      'framstegView.ts',
      'useFramstegExtras.ts',
    ]) {
      const source = read(`./${file}`)
      expect(colourViolations('', source)).toEqual([])
      expect(source).not.toMatch(
        /(?:from\s+|import\s*\()['"][^'"]*(?:devbake|screens\/(?:idag|ova)|\.\.\/(?:idag|ova)|ProgressMobile)/,
      )
      expect(source).not.toMatch(/\bstroke=|computeProjected\(|computeProjectedDelta\(/)
    }
  })
})
