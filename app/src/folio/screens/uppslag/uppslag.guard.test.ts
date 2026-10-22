import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

describe('Uppslag isolation', () => {
  it('lazily branches after the last route hook, without new router hooks', () => {
    const source = read('../../../routes/lektion.tsx')
    const ast = ts.createSourceFile(
      'lektion.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const imports = ast.statements.filter(ts.isImportDeclaration)
    expect(
      imports.filter((s) => s.moduleSpecifier.getText(ast).includes('folio/screens')),
    ).toHaveLength(0)
    const router = imports.find((s) =>
      s.moduleSpecifier.getText(ast).includes('@tanstack/react-router'),
    )
    expect(router?.importClause?.namedBindings?.getText(ast)).toBe(
      '{ createFileRoute, Link, useNavigate }',
    )
    expect(source).toContain("lazy(() => import('@/folio/screens/uppslag/FolioUppslag'))")
    const route = source.slice(
      source.indexOf('function LektionRoute()'),
      source.indexOf('// ── Picker'),
    )
    const branch = route.indexOf("if (inFolio && chapter !== 'provteknik')")
    expect(branch).toBeGreaterThan(route.lastIndexOf('useEffect('))
    expect(branch).toBeGreaterThan(route.indexOf('}, [section, chapter, navigate])'))
    expect(route).toContain('<Suspense')
  })

  it('scopes every selector and reserves accent for level data', () => {
    const css = read('./uppslag.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors) {
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-uppslag(?:[\s.[:]|$)/)
    }
    expect(css).not.toMatch(/--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(|opacity\s*:/i)
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/var\(--fa-accent/.test(match[2])) {
        for (const selector of match[1].split(',')) expect(selector).toMatch(/\[data-fa-level\]/)
      }
    }
    expect(css).toMatch(/\.fa-up-root\s*\{[^}]*font-size: var\(--fa-t44\)/)
  })

  it('keeps screen code independent and leaves Escape to the route', () => {
    for (const file of [
      'FolioUppslag.tsx',
      'UppslagIndex.tsx',
      'UppslagContents.tsx',
      'UppslagLesson.tsx',
      'uppslagView.ts',
      'useUppslagExtras.ts',
    ]) {
      const source = read(`./${file}`)
      expect(source).not.toMatch(
        /(?:from\s+|import\s*\()['"][^'"]*(?:devbake|screens\/(?:idag|ova)|\.\.\/(?:idag|ova))/,
      )
      expect(source).not.toMatch(/['"]Escape['"]|loadBank|loadQuestions/)
    }
  })
})
