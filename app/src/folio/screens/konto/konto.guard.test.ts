import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')
const files = [
  'FolioKonto.tsx',
  'KontoSections.tsx',
  'KontoMargin.tsx',
  'DeleteSlip.tsx',
  'kontoView.ts',
  'useKontoExtras.ts',
]
const bannedColour =
  /--fa-(?:bad|accent)|\bred\b|#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(|opacity\s*:/i
const paletteClass =
  /\b(?:bg|text|border|outline|ring|shadow|fill|stroke|accent|decoration)-(?:[\w-]+-\d{2,3}|black|white)\b/i
const parse = (text: string) =>
  ts.createSourceFile('source.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
function colourViolations(source: string) {
  const ast = parse(source)
  const violations: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isJsxAttribute(node) &&
      ['style', 'fill', 'color', 'stroke', 'stopColor', 'className'].includes(
        node.name.getText(ast),
      )
    ) {
      const text = node.initializer?.getText(ast) ?? ''
      if (bannedColour.test(text) || paletteClass.test(text)) violations.push(text)
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
  return violations
}
function hookAfterBranch(source: string, name: string) {
  const ast = parse(source)
  const route = ast.statements.find(
    (s): s is ts.FunctionDeclaration => ts.isFunctionDeclaration(s) && s.name?.text === name,
  )
  if (!route?.body) throw new Error('Missing route function')
  const branch = route.body.statements.find(
    (s) => ts.isIfStatement(s) && s.expression.getText(ast) === 'inFolio',
  )
  if (!branch) throw new Error('Missing Folio branch')
  const hooks: string[] = []
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      /^use[A-Z]/.test(node.expression.getText(ast)) &&
      node.pos >= branch.pos
    )
      hooks.push(node.getText(ast))
    ts.forEachChild(node, visit)
  }
  visit(route.body)
  return hooks
}

describe('Konto isolation', () => {
  it.each([
    ['konto', 'KontoRoute'],
    ['mer', 'MerRoute'],
  ])('keeps %s lazy with its branch after the route hooks', (file, name) => {
    const source = read(`../../../routes/${file}.tsx`)
    expect(source).toContain("lazy(() => import('@/folio/screens/konto/FolioKonto'))")
    expect(source).toContain('useContext(FolioHostContext)')
    expect(source).toContain('<Suspense')
    expect(
      parse(source)
        .statements.filter(ts.isImportDeclaration)
        .map((s) => s.moduleSpecifier.getText())
        .filter((s) => s.includes('folio/screens')),
    ).toEqual([])
    expect(hookAfterBranch(source, name)).toEqual([])
    // Existing classic helpers below the route may use hooks; new Folio data hooks may not enter either module.
    expect(source).not.toMatch(/useKontoExtras|useUserPrefs|useUpdateUserPrefs|useViewport/)
    if (file === 'konto') expect(source).not.toMatch(/useSyncedPrefs/)
  })
  it('checks only the route function, while catching hooks inside or after its branch', () => {
    expect(
      hookAfterBranch(
        'function Route() { useBefore(); if(inFolio) return <div/>; return <p/> } function Helper() { useAfter() }',
        'Route',
      ),
    ).toEqual([])
    expect(
      hookAfterBranch('function Route() { if(inFolio) { useWrong(); return <div/> } }', 'Route'),
    ).toHaveLength(1)
    expect(
      hookAfterBranch('function Route() { if(inFolio) return <div/>; useWrong(); }', 'Route'),
    ).toHaveLength(1)
  })
  it('scopes every selector and uses ink with no colour exceptions', () => {
    const css = read('./konto.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(30)
    for (const group of selectors)
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-konto(?:[\s.[:]|$)/)
    expect(css).not.toMatch(bannedColour)
    expect(css).toMatch(/::backdrop\s*\{\s*background:\s*var\(--fa-scrim\)/)
  })
  it('imports no prototypes, sibling screens or classic AccountMenu', () => {
    for (const file of files) {
      const source = read(`./${file}`)
      expect(colourViolations(source)).toEqual([])
      expect(source).not.toMatch(
        /(?:from\s+|import\s*\()['"][^'"]*(?:devbake|screens\/(?!konto)|\.\.\/|components\/account\/AccountMenu)/,
      )
      expect(source).not.toMatch(/styckeljus|dogfood|Förhandsvisning/)
    }
  })
  it.each([
    '<div style={{color: "red"}}/>',
    '<div style={{color: "#f00"}}/>',
    '<div style={{color: "var(--fa-accent)"}}/>',
    '<div style={{opacity: 0.5}}/>',
    '<path fill="rgb(1 2 3)"/>',
    '<span className="hover:text-red-600"/>',
  ])('detects a planted forbidden colour: %s', (source) => {
    expect(colourViolations(source)).not.toEqual([])
  })
})
