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

  it('keeps the direction loading fallback inside the classic Frame', () => {
    const root = readFileSync(path.join(SRC, 'routes/__root.tsx'), 'utf8')
    expect(root).toMatch(/<Frame>\s*<Suspense fallback=\{<DirectionLoading \/>\}>/)
  })
})

describe('Folio production boundary', () => {
  function files(dir: string): string[] {
    return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const file = path.join(dir, entry.name)
      return entry.isDirectory() ? files(file) : [file]
    })
  }

  const bakeoffImport =
    /(?:from\s*|import\s*\(?\s*)['"`][^'"`]*devbake|@import\s+url\(\s*['"]?[^'"\s)]*devbake/

  function staticFolioImports(text: string): string[] {
    const source = ts.createSourceFile('entry.tsx', text, ts.ScriptTarget.Latest, true)
    return source.statements.flatMap((statement) => {
      if (ts.isImportDeclaration(statement)) {
        if (statement.importClause?.isTypeOnly) return []
      } else if (ts.isExportDeclaration(statement)) {
        if (statement.isTypeOnly || !statement.moduleSpecifier) return []
      } else return []
      const specifier = statement.moduleSpecifier!.getText(source)
      return /FolioShell/.test(specifier) ? [specifier] : []
    })
  }

  function inheritedRootRules(css: string): string[] {
    const uncommented = css.replace(/\/\*[\s\S]*?\*\//g, '')
    // Inspect each selector in each leaf rule, including rules nested in media
    // queries and root selectors qualified by theme/palette attributes.
    return [...uncommented.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
      .filter((rule) =>
        rule[1]
          .split(',')
          .some((selector) => /^\[data-folio\](?:\[[^\]]*\]|[.:#][\w-]+)*$/.test(selector.trim())),
      )
      .filter((rule) =>
        /(?:^|;)\s*(?:font[\w-]*|line-height|color|text-rendering|-webkit-font-smoothing|interpolate-size)\s*:/.test(
          rule[2],
        ),
      )
      .map((rule) => rule[0])
  }

  it.each([
    "import '@/components/devbake/styles.css'",
    "@import '../../components/devbake/styles.css';",
    "import ( '@/components/devbake/Shell')",
    "import { Shell } from '@/components/devbake/Shell'",
    "@import url('../../components/devbake/styles.css');",
    '@import url("../../components/devbake/styles.css");',
    '@import url(../../components/devbake/styles.css);',
    'import(`@/components/devbake/Shell`)',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: source fixture, not evaluated here.
    'import(`@/components/devbake/${name}`)',
  ])('recognizes the forbidden import: %s', (source) => {
    expect(source).toMatch(bakeoffImport)
  })

  it.each([
    "import { FolioShell } from './FolioShell'",
    "export { FolioShell } from './FolioShell'",
    "export { FolioShell as Shell } from './FolioShell'",
    "export * from './FolioShell'",
    "export * as shell from './FolioShell'",
  ])('recognizes static shell loading: %s', (source) => {
    expect(staticFolioImports(source)).toHaveLength(1)
  })

  it.each([
    "import type { Props } from './FolioShell'",
    "export type { Props } from './FolioShell'",
    "export { FolioHost } from './FolioHost'",
    "const Shell = lazy(() => import('./FolioShell'))",
  ])('permits type-only and lazy shell references: %s', (source) => {
    expect(staticFolioImports(source)).toEqual([])
  })

  it.each([
    '[data-folio] { font-family: serif; }',
    '[data-folio], .x { font-family: serif; }',
    '.x, [data-folio] { color: red; }',
    '[data-folio][data-theme="dark"] { color: red; }',
    '@media (min-width: 768px) { [data-folio], .x { line-height: 1.5; } }',
    '[data-folio] { --fa-ink: red; } [data-folio], .x { font: 16px serif; }',
  ])('recognizes typography inherited by unported routes: %s', (css) => {
    expect(inheritedRootRules(css)).toHaveLength(1)
  })

  it.each([
    '[data-folio] { --fa-serif: serif; --fa-ink: red; color-scheme: light; }',
    '[data-folio] .fa-side, [data-folio] .fa-menu { color: red; font-family: serif; }',
    '/* [data-folio] { color: red; } */',
  ])('permits scoped shell typography and custom properties: %s', (css) => {
    expect(inheritedRootRules(css)).toEqual([])
  })

  it('keeps every Folio module and stylesheet independent of the bake-offs', () => {
    for (const file of files(path.join(SRC, 'folio')).filter((file) =>
      /\.(tsx?|css)$/.test(file),
    )) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(bakeoffImport)
    }
  })

  it.each([
    'routes/__root.tsx',
    'folio/FolioHost.tsx',
    'components/NavRail.tsx',
    'components/MobileFrame.tsx',
    'components/Frame.tsx',
    'folio/useShellFocus.ts',
    'folio/host.ts',
  ])('%s never statically loads FolioShell', (file) => {
    expect(staticFolioImports(readFileSync(path.join(SRC, file), 'utf8')), file).toEqual([])
  })

  it('shares the public-route registry with the root auth gate', () => {
    const root = readFileSync(path.join(SRC, 'routes/__root.tsx'), 'utf8')
    expect(root).toMatch(/import \{ PUBLIC_ROUTES \} from '@\/folio\/nav'/)
    expect(root).not.toMatch(/const PUBLIC_ROUTES/)
  })

  it.each([
    'tokens',
    'shell',
    'palette',
  ])('keeps inherited type off unported content in %s.css', (name) => {
    const css = readFileSync(path.join(SRC, `folio/styles/${name}.css`), 'utf8')
    expect(inheritedRootRules(css)).toEqual([])
  })

  it('keeps focus rules off unported content', () => {
    const css = readFileSync(path.join(SRC, 'folio/styles/tokens.css'), 'utf8').replace(
      /\/\*[\s\S]*?\*\//g,
      '',
    )
    const focusRules = [...css.matchAll(/([^{}]+:focus-visible[^{}]*)\{/g)]
    expect(focusRules.length).toBeGreaterThan(0)
    for (const rule of focusRules) {
      for (const selector of rule[1].split(',')) {
        expect(selector.trim()).toMatch(
          /^\[data-folio\] \.fa-(?:side|tabs|ptop|focus-bar|menu) :focus-visible$/,
        )
      }
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
