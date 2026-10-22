import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
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
    expect(css).not.toMatch(
      /--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch|color-mix)\(|opacity\s*:/i,
    )
    const allowed = [
      '.fa-scale-range',
      '.fa-scale-mark',
      '.fa-chart-end',
      '.fa-chart-value',
      '[data-heat="1"]',
      '[data-heat="2"]',
    ]
    const actual: string[] = []
    for (const rule of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))
      if (/var\(--fa-accent/.test(rule[2]))
        for (const selector of rule[1].split(','))
          actual.push(selector.trim().replace('[data-folio] .fa-framsteg ', ''))
    expect([...new Set(actual)].sort()).toEqual(allowed.sort())
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
      expect(source).not.toMatch(
        /(?:from\s+|import\s*\()['"][^'"]*(?:devbake|screens\/(?:idag|ova)|\.\.\/(?:idag|ova)|ProgressMobile)/,
      )
      expect(source).not.toMatch(/\bstroke=|computeProjected\(|computeProjectedDelta\(/)
    }
  })
})
