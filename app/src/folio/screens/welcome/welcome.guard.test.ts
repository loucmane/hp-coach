import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const css = read('./welcome.css').replace(/\/\*[\s\S]*?\*\//g, '')
const foundation = read('../../styles/tokens.css').split('/* Folio+ names')[0]

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
  it('scopes every CSS selector to the Folio welcome flow', () => {
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors) {
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-welcome(?:[\s.[:]|$)/)
    }
    expect(css).toContain('min-height: 44px')
    expect(css).toContain('flex-wrap: wrap')
  })
  it('uses only canonical Ljusbord tokens, never Folio+ aliases or literal colours', () => {
    const tokens = new Set([...foundation.matchAll(/(--fa-[\w-]+)\s*:/g)].map((m) => m[1]))
    const references = [...css.matchAll(/var\(\s*(--[\w-]+)/g)].map((m) => m[1])
    expect(references.length).toBeGreaterThan(20)
    expect(references.filter((name) => !tokens.has(name))).toEqual([])
    expect(css).not.toMatch(
      /--fa-(?:sec-|bad|accent)|#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color|color-mix)\s*\(|opacity\s*:/i,
    )
    // An allowlist also catches named colours (white, black, etc.) and fallbacks.
    for (const [, value] of css.matchAll(
      /(?:^|[;{])\s*(?:color|background(?:-color)?|(?:border|outline)(?:-[\w-]+)?|(?:box|text)-shadow)\s*:\s*([^;}]+)/g,
    )) {
      const remaining = value
        .replace(/var\(--fa-[\w-]+\)/g, '')
        .replace(/\b(?:transparent|currentColor|none|solid|dashed|dotted|inset)\b/g, '')
        .replace(/-?(?:\d*\.)?\d+(?:px|em|rem|%)?/g, '')
        .replace(/[\s,]/g, '')
      expect(remaining, value).toBe('')
    }
  })
  it('uses spacing and radius tokens instead of hard-coded scale values', () => {
    const spacing = new Set([...foundation.matchAll(/--fa-s\d+:\s*(\d+px)/g)].map((m) => m[1]))
    for (const [, property, value] of css.matchAll(
      /(?:^|[;{])\s*((?:padding|margin|gap|row-gap|column-gap)(?:-[\w-]+)?|border(?:-[\w-]+)?-radius)\s*:\s*([^;}]+)/g,
    )) {
      const lengths = [...value.matchAll(/\b\d+(?:\.\d+)?(?:px|rem|em)\b/g)].map((m) => m[0])
      expect(
        property.endsWith('radius') ? lengths : lengths.filter((length) => spacing.has(length)),
        `${property}: ${value}`,
      ).toEqual([])
    }
  })
  it('keeps prototypes, swatches, and stop language out of production views', () => {
    for (const file of [
      'FolioWelcome.tsx',
      'FolioWelcomeDone.tsx',
      'WelcomeSteps.tsx',
      'WelcomeChoice.tsx',
      'RootCard.tsx',
      'welcomeView.ts',
      'welcome.css',
    ]) {
      expect(read(`./${file}`)).not.toMatch(
        /devbake|swatch|negationsprefix|germanskt ursprung|Klart för idag|dagens klart|räcker|⌘K/,
      )
    }
  })
})
