import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

describe('Idag isolation', () => {
  it('keeps Folio lazy and the daily plan writer unique', () => {
    const source = read('../../../routes/index.tsx')
    const ast = ts.createSourceFile(
      'index.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const imports = ast.statements
      .filter(ts.isImportDeclaration)
      .map((s) => s.moduleSpecifier.getText(ast))
    expect(imports.filter((s) => s.includes('folio/screens'))).toEqual([])
    expect(source).toContain("lazy(() => import('@/folio/screens/idag/FolioIdag'))")
    let writers = 0
    function visit(node: ts.Node) {
      if (ts.isCallExpression(node) && node.expression.getText(ast) === 'useDailyPlan') writers++
      ts.forEachChild(node, visit)
    }
    visit(ast)
    expect(writers).toBe(1)
    expect(source).toContain('if (inFolio)')
    expect(source).toContain('<Suspense')
  })
  it('scopes all page CSS under Idag, with no typography on the shell root', () => {
    const css = read('./idag.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors) {
      // Split top-level selector commas, preserving functional pseudo-classes.
      const top = group.replace(/\([^)]*\)/g, '(args)')
      for (const selector of top.split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-idag(?:[\s.[:]|$)/)
    }
    expect(css).not.toMatch(
      /\[data-folio\]\s*\{|--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(/i,
    )
    expect(css).toMatch(/\.fa-idag\.fa-home\s*\{[^}]*max-width:\s*min\(100%, 960px\)/)
    expect(css).not.toMatch(/opacity\s*:/)
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/var\(--fa-accent/.test(match[2])) expect(match[1]).toMatch(/\.fa-scale-(?:range|mark)/)
    }
  })
  it('does not import prototype, classic page, or a second plan writer in screen files', () => {
    for (const file of [
      'FolioIdag.tsx',
      'DayPath.tsx',
      'IdagLead.tsx',
      'IdagMargin.tsx',
      'ReturnLink.tsx',
      'idagView.ts',
      'useIdagExtras.ts',
    ]) {
      const source = read(`./${file}`)
      expect(source).not.toMatch(/from\s+['"][^'"]*(?:devbake|HomeMobile|useDailyPlan)/)
    }
  })
})
