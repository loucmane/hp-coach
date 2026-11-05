import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

describe('Öva isolation', () => {
  it('loads the Folio screen only through the lazy route branch', () => {
    const source = read('../../../routes/ova.tsx')
    const ast = ts.createSourceFile(
      'ova.tsx',
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    )
    const imports = ast.statements
      .filter(ts.isImportDeclaration)
      .map((s) => s.moduleSpecifier.getText(ast))
    expect(imports.filter((s) => s.includes('folio/screens'))).toEqual([])
    expect(source).toContain("lazy(() => import('@/folio/screens/ova/FolioOva'))")
    expect(source).toContain('if (inFolio)')
    expect(source).toContain('<Suspense')
    expect(source.indexOf('if (inFolio)')).toBeGreaterThan(
      source.indexOf('const weakest = useMemo'),
    )
  })

  it('scopes every selector and reserves accent for level data', () => {
    const css = read('./ova.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(20)
    for (const group of selectors) {
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-ova(?:[\s.[:]|$)/)
    }
    expect(css).not.toMatch(/--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(|opacity\s*:/i)
    for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/var\(--fa-accent/.test(match[2])) {
        for (const selector of match[1].split(',')) expect(selector).toMatch(/\[data-fa-level\]/)
      }
    }
  })

  it('keeps screen code independent of prototype and Idag internals', () => {
    for (const file of [
      'FolioOva.tsx',
      'OvaLead.tsx',
      'OvaContents.tsx',
      'OvaMargin.tsx',
      'ovaView.ts',
      'useOvaExtras.ts',
    ]) {
      expect(read(`./${file}`)).not.toMatch(
        /(?:from\s+|import\s*\()['"][^'"]*(?:devbake|screens\/idag|\.\.\/idag)/,
      )
    }
  })
  it('uses shared scoped keys, lit sheet, Go, segments and honest range primitives', () => {
    const lead = read('./OvaLead.tsx')
    expect(lead).toMatch(/useScopedKeys\(\s*region,/)
    expect(lead).not.toMatch(/addEventListener|window\.onkeydown/)
    for (const primitive of ['Lit', 'Go', 'Seg', 'SecChip']) expect(lead).toContain(`<${primitive}`)
    expect(lead).toContain('dock={phone}')
    expect(read('./OvaContents.tsx')).toContain('<RangeBand')
    expect(read('./ovaView.ts')).toContain('scoreBand(value, attempts)')
    expect(read('./ovaView.ts')).not.toMatch(
      /entryHeadword|\.headline|\.rationale|\.tldr|\.pattern_description/,
    )
    expect(read('./ova.css')).not.toMatch(/--fa-(?:paper|leaf|rule|accent|serif)\b/)
  })
})
