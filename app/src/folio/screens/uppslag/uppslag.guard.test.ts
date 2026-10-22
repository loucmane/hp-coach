import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

function tokens(source: string, selector: string): Record<string, string> {
  const body = source.split(`${selector} {`)[1]?.split('}')[0] ?? ''
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2]]))
}

// OKLCH -> linear sRGB -> relative luminance; all tested palette colors are opaque.
function luminance(value: string): number {
  const match = value.match(/^oklch\(([\d.]+)(%?) ([\d.]+) ([\d.]+)\)$/)
  if (!match) throw new Error(`Expected an opaque OKLCH color, received ${value}`)
  const lightness = Number(match[1]) / (match[2] ? 100 : 1)
  const chroma = Number(match[3])
  const hue = (Number(match[4]) * Math.PI) / 180
  const a = chroma * Math.cos(hue)
  const b = chroma * Math.sin(hue)
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  const clamp = (channel: number) => Math.max(0, Math.min(1, channel))
  const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)
  const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)
  const blue = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)
  return 0.2126 * r + 0.7152 * g + 0.0722 * blue
}

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

  it('pins the desktop recto to the top of the shell and keeps its primary action scrollable', () => {
    const css = read('./uppslag.css')
    const recto = css.match(/\.fa-uppslag\.fa-up-spread > \.fa-recto\s*\{([^}]+)\}/)?.[1]
    expect(recto).toBeDefined()
    expect(recto).toMatch(/position:\s*sticky\s*;/)
    expect(recto).toMatch(/\btop:\s*0\s*;/)
    expect(recto).toMatch(/max-height:\s*100dvh\s*;/)
    expect(recto).toMatch(/overflow-y:\s*auto\s*;/)
  })

  it.each(['light', 'dark'])('keeps worked-example text at 4.5:1 across %s palettes', (theme) => {
    const base = read('../../styles/tokens.css')
    const palettes = read('../../styles/palette.css')
    const aliases = tokens(read('./uppslag.css'), '[data-folio] .fa-uppslag .fa-up-worked')
    for (const palette of ['default', 'spalt', 'sand', 'sage', 'ink', 'rose']) {
      const colors = {
        ...tokens(read('../../../index.css'), ':root'),
        ...tokens(base, '[data-folio]'),
        ...(theme === 'dark' ? tokens(base, "[data-folio][data-theme='dark']") : {}),
        ...tokens(
          palettes,
          theme === 'dark'
            ? `[data-folio][data-theme='dark'][data-palette='${palette}']`
            : `[data-folio][data-palette='${palette}']:not([data-theme='dark'])`,
        ),
        ...aliases,
      }
      const resolve = (name: string): string => {
        const value = colors[name]
        const alias = value?.match(/^var\((--[\w-]+)\)$/)
        return alias ? colors[alias[1]] : value
      }
      for (const background of ['--fa-paper', '--fa-leaf', '--bg', '--panel']) {
        for (const foreground of ['--ink', '--ink-2', '--muted']) {
          const fg = luminance(resolve(foreground))
          const bg = luminance(resolve(background))
          const contrast = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
          expect(contrast, `${palette} ${foreground} on ${background}`).toBeGreaterThanOrEqual(4.5)
        }
      }
    }
    // The rule/button outline must also follow the active Folio palette.
    expect(aliases['--hairline']).toBe('var(--fa-rule-2)')
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
