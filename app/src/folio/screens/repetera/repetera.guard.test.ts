import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

describe('Repetera isolation', () => {
  it('keeps the overview lazy, below the route hooks and behind the session latch', () => {
    const source = read('../../../routes/repetition.tsx')
    const ast = ts.createSourceFile(
      'repetition.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const imports = ast.statements
      .filter(ts.isImportDeclaration)
      .map((s) => s.moduleSpecifier.getText(ast))
    expect(imports.filter((s) => s.includes('folio/screens'))).toEqual([])
    expect(source).toContain("lazy(() => import('@/folio/screens/repetera/FolioRepetera'))")
    expect(source).toContain('if (inFolio && !inSession)')
    expect(source).toContain('<Suspense')
    expect(source).not.toMatch(/usePileMistakes|useStats|loadBank/)
  })

  it('scopes CSS to the page and uses palette tokens without red or opacity', () => {
    const css = read('./repetera.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors) {
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(',')) {
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-repetera(?:[\s.[:]|$)/)
      }
    }
    expect(css).not.toMatch(/--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(|opacity\s*:/i)
    // This page has no chart; even a queue count is ink, never an accent CTA.
    expect(css).not.toMatch(/var\(--fa-accent/)
    expect(css).toContain('prefers-reduced-motion')
  })

  it('keeps local helpers independent of sibling screens and prototypes', () => {
    for (const file of [
      'FolioRepetera.tsx',
      'RepeteraQueue.tsx',
      'MissRow.tsx',
      'GapText.tsx',
      'repeteraView.ts',
      'useRepeteraExtras.ts',
    ]) {
      const source = read(`./${file}`)
      expect(source).not.toMatch(
        /(?:from\s*|import\s*\()\s*['"][^'"]*(?:devbake|screens\/(?:idag|drill)|\.\.\/(?:idag|drill))/,
      )
      expect(source).not.toMatch(/useDailyPlan|useRecordMistake|useReviewMistake|useStartSession/)
    }
    expect(read('./useRepeteraExtras.ts')).toContain('usePileMistakes(section)')
  })

  it('references only defined Folio tokens, including the phone spacing scale', () => {
    const tokens = new Set(
      [...read('../../styles/tokens.css').matchAll(/(--fa-[\w-]+)\s*:/g)].map((m) => m[1]),
    )
    for (const match of read('./repetera.css').matchAll(/var\((--fa-[\w-]+)/g)) {
      expect(tokens.has(match[1]), `undefined token: ${match[1]}`).toBe(true)
    }
  })
})
