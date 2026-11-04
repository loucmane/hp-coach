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
    expect(css).toMatch(/max-width:\s*1100px/)
    expect(css).not.toMatch(/opacity\s*:/)
    const tokens = read('../../styles/tokens.css')
    const defined = new Set(
      [...`${tokens}\n${css}`.matchAll(/(--fa-[\w-]+)\s*:/g)].map((m) => m[1]),
    )
    for (const match of css.matchAll(/var\((--fa-[\w-]+)/g))
      expect(defined.has(match[1]), match[1]).toBe(true)
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/var\(--fa-accent/.test(match[2])) expect(match[1]).toMatch(/\.fa-scale-(?:range|mark)/)
    }
  })
  it('uses the shared Ljusbord primitives and does not read answer-bearing headwords', () => {
    expect(read('./IdagLead.tsx')).toContain("from '@/folio/ui/Lit'")
    expect(read('./IdagLead.tsx')).toContain("from '@/folio/ui/Go'")
    expect(read('./IdagMargin.tsx')).toContain("from '@/folio/ui/RangeBand'")
    expect(read('./useIdagExtras.ts')).not.toContain('entryHeadword')
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
