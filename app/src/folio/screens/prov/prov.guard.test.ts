import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
describe('Provpass isolation', () => {
  it('loads both screens lazily after hooks while retaining the classic runner', () => {
    const source = read('../../../routes/prov.tsx')
    const ast = ts.createSourceFile(
      'prov.tsx',
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
    expect(source).toContain("lazy(() => import('@/folio/screens/prov/FolioProvpass'))")
    expect(source).toContain("lazy(() => import('@/folio/screens/prov/FolioProvResult'))")
    expect(source.indexOf('if (inFolio &&')).toBeGreaterThan(source.indexOf('const handleVoid'))
    expect(source.indexOf("if (phase === 'running' && running)")).toBeLessThan(
      source.indexOf('if (inFolio)'),
    )
    expect(source.match(/<Suspense/g)).toHaveLength(2)
  })
  it('scopes selectors and limits colour to the score mark and facit letter', () => {
    const css = read('./prov.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(40)
    for (const group of selectors)
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-prov(?:[\s.[:]|$)/)
    expect(css).not.toMatch(/--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(|opacity\s*:/i)
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/var\(--fa-accent/.test(m[2])) expect(m[1]).toMatch(/\.fa-scale-(?:range|mark)/)
      if (/var\(--fa-ok/.test(m[2]))
        expect(m[1].trim()).toBe('[data-folio] .fa-prov .fa-right-letter')
    }
  })
  it('allows only the four agreed drill imports and no prototype or sibling screens', () => {
    const files = [
      'FolioProvpass.tsx',
      'FolioProvResult.tsx',
      'ProvLead.tsx',
      'ProvRegister.tsx',
      'ProvMargin.tsx',
      'ConditionsSlip.tsx',
      'ResultErrata.tsx',
      'provView.ts',
      'useProvResultExtras.ts',
    ]
    const allowed: Record<string, string> = {
      '@/folio/screens/drill/QuantPage': 'QuantPage',
      '@/folio/screens/drill/Options': 'GradedOptions',
      '@/folio/screens/drill/GapText': 'GapText',
      '@/folio/screens/drill/toDrillQuestion': 'toDrillQuestion',
    }
    for (const file of files) {
      const source = read(`./${file}`)
      expect(source).not.toMatch(
        /(?:from\s+|import\s*\()['"][^'"]*(?:devbake|screens\/(?:idag|ova)|\.\.\/(?:idag|ova))/,
      )
      const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      for (const declaration of ast.statements.filter(ts.isImportDeclaration)) {
        const path = (declaration.moduleSpecifier as ts.StringLiteral).text
        if (!path.includes('/drill/')) continue
        expect(allowed[path]).toBeDefined()
        expect(declaration.importClause?.name).toBeUndefined()
        const bindings = declaration.importClause?.namedBindings
        expect(
          bindings && ts.isNamedImports(bindings)
            ? bindings.elements.map((e) => (e.propertyName ?? e.name).text)
            : [],
        ).toEqual([allowed[path]])
      }
    }
  })
})
