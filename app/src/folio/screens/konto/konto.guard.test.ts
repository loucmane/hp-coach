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
  /--fa-(?:bad|accent|ok|mark|on-accent)|\bred\b|#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(|opacity\s*:/i
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
      /(?:^|\.)use[A-Z]/.test(node.expression.getText(ast)) &&
      node.pos >= branch.pos
    )
      hooks.push(node.getText(ast))
    ts.forEachChild(node, visit)
  }
  visit(route.body)
  return hooks
}

// Frozen route-body hook calls from classic base e67b3e2c; the context read is
// the only approved addition. Helper components below each route are separate.
const classicHooks = {
  KontoRoute: [
    'useFirstContentSignal()',
    'useAccountIdentity()',
    'useSitting()',
    'useDaysRemaining()',
  ],
  MerRoute: ['useNavigate()', 'useSitting()', 'useDaysRemaining()'],
}
function newRouteHooks(source: string, name: string, baseline: string[]) {
  const ast = parse(source)
  const route = ast.statements.find(
    (s): s is ts.FunctionDeclaration => ts.isFunctionDeclaration(s) && s.name?.text === name,
  )
  if (!route?.body) throw new Error('Missing route function')
  const remaining = ['useContext(FolioHostContext)', ...baseline]
  const added: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && /(?:^|\.)use[A-Z]/.test(node.expression.getText(ast))) {
      const call = node.getText(ast)
      const at = remaining.indexOf(call)
      if (at < 0) added.push(call)
      else remaining.splice(at, 1)
    }
    ts.forEachChild(node, visit)
  }
  visit(route.body)
  return added
}
function cssColourViolations(css: string) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const violations: string[] = []
  const neutral = /^--fa-(?:ink(?:-[23])?|rule(?:-2|-strong)?|paper(?:-[23])?|scrim)$/
  const layout =
    /^--fa-(?:sans|serif|s(?:1|2|3|4|6|8|12|16)|t(?:12|13|15|17|19|24|32|44|56)|r[12])$/
  for (const [, selector, body] of clean.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const focusOnly = selector.split(',').every((s) => /:focus-visible$/.test(s.trim()))
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':')
      if (colon < 0) continue
      const property = declaration.slice(0, colon).trim()
      const value = declaration.slice(colon + 1).trim()
      const paint =
        /color|background|shadow|fill|stroke|^(?:border|outline|column-rule)(?:-(?:top|bottom|left|right))?$/.test(
          property,
        )
      if (bannedColour.test(declaration)) violations.push(declaration)
      for (const [, token] of value.matchAll(/var\(\s*(--[\w-]+)/g)) {
        const ring =
          token === '--fa-focus' &&
          focusOnly &&
          /^(?:outline|outline-color|box-shadow)$/.test(property)
        if (!neutral.test(token) && !ring && !(layout.test(token) && !paint))
          violations.push(`${property}: ${token}`)
      }
      if (paint) {
        // After removing tokens and lengths, only neutral CSS keywords remain.
        const words =
          value
            .replace(/var\(\s*--[\w-]+\s*\)/g, '')
            .replace(/-?[\d.]+(?:px|em|rem|%)?/g, '')
            .match(/[a-z-]+/gi) ?? []
        if (
          words.some(
            (word) =>
              ![
                'transparent',
                'currentColor',
                'none',
                'solid',
                'dotted',
                'dashed',
                'inset',
                'important',
              ].includes(word),
          )
        )
          violations.push(declaration)
      }
    }
  }
  return violations
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
    expect(newRouteHooks(source, name, classicHooks[name as keyof typeof classicHooks])).toEqual([])
    // Existing classic helpers below the route may use hooks; new Folio data hooks may not enter either module.
    expect(source).not.toMatch(/useKontoExtras|useUserPrefs|useUpdateUserPrefs|useViewport/)
    if (file === 'konto') expect(source).not.toMatch(/useSyncedPrefs/)
  })
  it.each([
    'useNavigate()',
    'useState(false)',
    'React.useEffect(() => {})',
    'useContext(OtherContext)',
    'useSitting()',
  ])('detects an added route hook before the branch: %s', (hook) => {
    const source = `function Route() { useContext(FolioHostContext); useSitting(); ${hook}; if(inFolio) return <div/>; return <p/> }`
    expect(newRouteHooks(source, 'Route', ['useSitting()'])).toEqual([hook])
  })
  it('does not count hooks in separate classic helper functions', () => {
    expect(
      newRouteHooks(
        'function Route() { useContext(FolioHostContext); useSitting(); if(inFolio) return <div/>; return <p/> } function Helper() { useNavigate() }',
        'Route',
        ['useSitting()'],
      ),
    ).toEqual([])
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
    expect(cssColourViolations(css)).toEqual([])
    expect(css).toMatch(/::backdrop\s*\{\s*background:\s*var\(--fa-scrim\)/)
  })
  it.each([
    '--fa-focus',
    '--fa-ok',
    '--fa-mark',
    '--fa-on-accent',
    '--fa-accent-2',
    '--fa-bad',
    '--fa-future-colour',
    '--other-colour',
  ])('rejects non-neutral CSS token %s', (token) => {
    expect(
      cssColourViolations(`[data-folio] .fa-konto .fa-kt-link { color: var(${token}); }`),
    ).not.toEqual([])
  })
  it.each([
    '.fa-kt-link:focus',
    '.fa-kt-link:not(:focus-visible)',
    '.fa-kt-link:focus-visible, [data-folio] .fa-konto .fa-kt-grave',
  ])('rejects a focus token on a selector that does not require focus-visible: %s', (selector) => {
    expect(
      cssColourViolations(
        `[data-folio] .fa-konto ${selector} { outline: 2px solid var(--fa-focus); }`,
      ),
    ).not.toEqual([])
  })
  it('allows a focus ring only in a focus-visible rule', () => {
    expect(
      cssColourViolations(
        '[data-folio] .fa-konto :focus-visible { outline: 2px solid var(--fa-focus); outline-offset: 4px; }',
      ),
    ).toEqual([])
    expect(
      cssColourViolations('[data-folio] .fa-konto :focus-visible { background: var(--fa-focus); }'),
    ).not.toEqual([])
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
