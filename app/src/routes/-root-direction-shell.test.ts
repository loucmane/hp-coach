import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { DESIGN_DIRECTIONS } from '@/stores/designStore'

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

describe('direction bundle boundary', () => {
  it('keeps lightweight choice labels aligned with the lazy registry', async () => {
    const { DIRECTIONS } = await import('@/components/devbake/redesign/directions')
    expect(DESIGN_DIRECTIONS).toEqual(DIRECTIONS.map(({ key, name }) => ({ key, name })))
  })

  it.each([
    'routes/__root.tsx',
    'routes/mer.tsx',
    'components/CommandPalette.tsx',
    'stores/designStore.ts',
  ])('%s has no runtime static import of the shell or bake-off', (file) => {
    const source = ts.createSourceFile(
      file,
      readFileSync(path.join(SRC, file), 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )
    const imports = source.statements.filter(ts.isImportDeclaration)
    expect(imports.length).toBeGreaterThan(0)
    for (const statement of imports) {
      if (statement.importClause?.isTypeOnly) continue
      expect(statement.moduleSpecifier.getText(source)).not.toMatch(/devbake|direction-shell/)
    }
  })

  it('loads the shell through import()', () => {
    const source = readFileSync(path.join(SRC, 'routes/__root.tsx'), 'utf8')
    expect(source).toContain("import('@/components/direction-shell/DirectionShell')")
  })
})

describe('Folio production boundary', () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name)
      return entry.isDirectory() ? files(file) : [file]
    })
  }

  it('keeps every Folio module independent of the bake-offs', () => {
    for (const file of files(path.join(SRC, 'folio')).filter((file) => /\.tsx?$/.test(file))) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(
        /(?:from\s*|import\s*\()['"][^'"]*devbake/,
      )
    }
  })

  it('loads FolioShell only through the lazy host, inside DirectionContent', () => {
    const root = readFileSync(path.join(SRC, 'routes/__root.tsx'), 'utf8')
    const host = readFileSync(path.join(SRC, 'folio/FolioHost.tsx'), 'utf8')
    expect(root).not.toMatch(/from ['"][^'"]*FolioShell/)
    expect(host).toContain("import('./FolioShell')")
    expect(root).toMatch(/<DirectionContent[^>]*>\s*<FolioHost/)
    expect(host).toContain('fallback={<FolioLoading />}')
  })

  it('scopes every style selector and keeps document scrolling', () => {
    for (const name of ['tokens', 'shell', 'palette']) {
      const css = readFileSync(path.join(SRC, `folio/styles/${name}.css`), 'utf8').replace(
        /\/\*[\s\S]*?\*\//g,
        '',
      )
      for (const match of css.matchAll(/([^{}]+)\{/g)) {
        const selector = match[1].trim()
        if (selector.startsWith('@media')) continue
        for (const part of selector.split(','))
          expect(part.trim(), `${name}: ${selector}`).toMatch(/^\[data-folio\]/)
      }
      expect(css).not.toContain('fp-')
    }
    const data = readFileSync(path.join(SRC, 'folio/data/useShellData.ts'), 'utf8')
    expect(data).not.toMatch(/\buseDailyPlan\s*\(/)
    expect(data).toContain('useDailyPlanQuery(')
  })
})
