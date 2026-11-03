import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

it('loads Historik lazily after every route hook and keeps mock fetching in the Folio screen', () => {
  const source = read('../../../routes/historik.tsx')
  expect(source).toContain("lazy(() => import('@/folio/screens/framsteg/FolioHistorik'))")
  expect(source).toContain('<Suspense')
  expect(source).not.toMatch(/from ['"][^'"]*folio\/screens|useMockResults/)
  expect(source.indexOf('if (inFolio)')).toBeGreaterThan(source.indexOf('useSessionHistory()'))
  expect(source.slice(source.indexOf('if (inFolio)'))).not.toMatch(/\buse[A-Z]\w*\(/)
  expect(read('./FolioHistorik.tsx')).toContain('useMockResults()')
})

it('scopes every selector and reserves colour for data only', () => {
  const css = read('./historik.css').replace(/\/\*[\s\S]*?\*\//g, '')
  const selectors = [...css.matchAll(/([^{}]+)\{/g)]
    .map((match) => match[1].trim())
    .filter((selector) => !selector.startsWith('@'))
  expect(selectors.length).toBeGreaterThan(10)
  for (const group of selectors)
    for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
      expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-historik(?:[\s.[:]|$)/)
  expect(css).not.toMatch(
    /--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(|opacity\s*:/i,
  )
  // This ledger needs no accent: counts are plain ink, like the existing history preview.
  expect(css).not.toMatch(/var\(--fa-accent/)
  expect(css).toMatch(/\.fa-history-row\s*\{[^}]*min-height: 44px/s)
  expect(css).toContain('@media (max-width: 767px)')
  expect(css).toContain(':focus-visible')
  expect(css).toMatch(/\.fa-status\s*\{[^}]*color: var\(--fa-ink-2\)/s)
})

it('keeps production Historik free of prototype imports and inline colour overrides', () => {
  for (const name of ['FolioHistorik.tsx', 'historikView.ts']) {
    const source = read(`./${name}`)
    expect(source).not.toMatch(/(?:from\s+|import\s*\()['"][^'"]*devbake/)
    expect(source).not.toMatch(
      /\bstyle=|\b(?:fill|color|stroke)=|\b(?:text|bg|border)-(?:red|blue|green|rose)-\d/,
    )
  }
})
