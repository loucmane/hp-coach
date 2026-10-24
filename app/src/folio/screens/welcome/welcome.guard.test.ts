import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
describe('Folio welcome isolation', () => {
  it('lazy loads the separate Folio flow and done view without changing the classic flow', () => {
    const source = read('../../../routes/welcome.tsx')
    const ast = ts.createSourceFile(
      'welcome.tsx',
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
    expect(source).toContain("lazy(() => import('@/folio/screens/welcome/FolioWelcome'))")
    expect(source).toContain('if (inFolio)')
    expect(source).toContain('<ClassicWelcomeRoute />')
    expect(read('./FolioWelcome.tsx')).toContain("lazy(() => import('./FolioWelcomeDone'))")
  })
  it('scopes every CSS selector and uses only existing achromatic tokens', () => {
    const css = read('./welcome.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors) {
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-welcome(?:[\s.[:]|$)/)
    }
    expect(css).not.toMatch(
      /--fa-bad|--fa-accent|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(|opacity\s*:/i,
    )
    expect(css).toContain('min-height: 44px')
    expect(css).toContain('flex-wrap: wrap')
  })
  it('keeps prototypes, swatches, and stop language out of production views', () => {
    for (const file of [
      'FolioWelcome.tsx',
      'FolioWelcomeDone.tsx',
      'WelcomeSteps.tsx',
      'WelcomeChoice.tsx',
      'RootCard.tsx',
      'welcomeView.ts',
    ]) {
      expect(read(`./${file}`)).not.toMatch(
        /devbake|swatch|negationsprefix|germanskt ursprung|Klart för idag|dagens klart|räcker|⌘K/,
      )
    }
  })
})
