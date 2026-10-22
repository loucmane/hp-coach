import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

const read = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
const files = [
  'FolioProvpass.tsx',
  'FolioProvResult.tsx',
  'ProvLead.tsx',
  'ProvRegister.tsx',
  'ProvMargin.tsx',
  'ConditionsSlip.tsx',
  'ResultErrata.tsx',
  'provView.ts',
  'useProvResultExtras.ts',
]
const allowed: Record<string, string> = {
  '@/folio/screens/drill/QuantPage': 'QuantPage',
  '@/folio/screens/drill/Options': 'GradedOptions',
  '@/folio/screens/drill/GapText': 'GapText',
  '@/folio/screens/drill/toDrillQuestion': 'toDrillQuestion',
}
const parse = (source: string) =>
  ts.createSourceFile('guard.tsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)

function checkImports(source: string) {
  const ast = parse(source)
  function visit(node: ts.Node) {
    const specifier =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword
          ? node.arguments[0]
          : undefined
    if (specifier) {
      // Unresolved dynamic paths cannot be checked against the allow-list.
      if (!ts.isStringLiteralLike(specifier)) throw new Error('Non-literal import path')
      const path = specifier.text
      expect(path).not.toMatch(/devbake|(?:screens\/|\.\.\/)(?:idag|ova|repetera)/)
      if (path.includes('/drill/')) {
        expect(allowed[path]).toBeDefined()
        // Namespace access through import() or re-exports bypasses the four
        // named bindings, even when the module itself is on the allow-list.
        if (!ts.isImportDeclaration(node)) throw new Error('Drill requires named imports')
        expect(node.importClause?.name).toBeUndefined()
        const bindings = node.importClause?.namedBindings
        expect(
          bindings && ts.isNamedImports(bindings)
            ? bindings.elements.map((e) => (e.propertyName ?? e.name).text)
            : [],
        ).toEqual([allowed[path]])
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
}

function checkJsxColours(source: string) {
  const ast = parse(source)
  // All classes on these screens live in the scoped stylesheet. This also
  // excludes Tailwind colours, including variants and arbitrary values.
  function classes(node: ts.Node): void {
    if (
      ts.isStringLiteralLike(node) ||
      ts.isTemplateHead(node) ||
      ts.isTemplateTail(node) ||
      ts.isTemplateMiddle(node)
    ) {
      for (const name of node.text.split(/\s+/).filter(Boolean)) expect(name).toMatch(/^fa-[\w-]+$/)
    } else if (ts.isJsxExpression(node) && node.expression) classes(node.expression)
    else if (ts.isConditionalExpression(node)) {
      classes(node.whenTrue)
      classes(node.whenFalse)
    } else if (ts.isTemplateExpression(node)) {
      classes(node.head)
      for (const span of node.templateSpans) {
        classes(span.expression)
        classes(span.literal)
      }
    } else throw new Error('Class names must be inspectable Folio classes')
  }
  function visit(node: ts.Node) {
    if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(ast)
      const value = node.initializer
      if (name === 'className' && value) classes(value)
      if (['fill', 'stroke', 'color'].includes(name)) {
        const literal = value && ts.isJsxExpression(value) ? value.expression : value
        expect(literal && ts.isStringLiteralLike(literal) ? literal.text : '').toMatch(
          /^(?:none|currentColor|inherit)$/,
        )
      }
      if (name === 'style') {
        const style = value && ts.isJsxExpression(value) ? value.expression : undefined
        if (!style || !ts.isObjectLiteralExpression(style))
          throw new Error('Uninspectable inline style')
        // The score marker's position is the only inline layout rule needed.
        // Paint (including neutral paint), spreads and dynamic property names
        // belong in CSS where the palette/selector guard can inspect them.
        for (const prop of style.properties) {
          expect(
            ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) ? prop.name.text : '',
          ).toBe('left')
        }
      }
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
}

describe('Provpass isolation', () => {
  it.each([
    "const screen = import('@/folio/screens/drill/Other')",
    "const screen = import('@/folio/screens/drill/Options')",
    "export { Other } from '@/folio/screens/drill/Other'",
    "export * from '@/folio/screens/drill/Options'",
    "export { Page } from '../ova/Other'",
    "async function load() { return import('../drill/Options') }",
    'const screen = import(`@/folio/screens/drill/Options`)',
    'const screen = import(path)',
    "import { Other } from '@/folio/screens/drill/Options'",
    "import * as Options from '@/folio/screens/drill/Options'",
  ])('rejects non-approved import forms: %s', (source) => {
    expect(() => checkImports(source)).toThrow()
  })
  it.each([
    '<p style={{ color: "var(--fa-ok)" }} />',
    '<p style={{ background: "red" }} />',
    '<p style={{ borderColor: "#f00" }} />',
    '<p style={{ ["color"]: "green" }} />',
    '<p style={{ ...paint }} />',
    '<p style={paint} />',
    '<path fill="#0f0" />',
    '<path stroke={"rgb(0, 255, 0)"} />',
    '<p color="var(--fa-accent)" />',
    '<p className="text-red-500" />',
    '<p className="dark:hover:bg-emerald-500/20" />',
    '<p className="stroke-[var(--fa-ok)]" />',
    '<p className={active ? "text-green-600" : "fa-meta"} />',
    // biome-ignore lint/suspicious/noTemplateCurlyInString: literal TSX source for the guard
    '<p className={`fa-status ${active ? "fill-red-500" : "fa-meta"}`} />',
    '<p className={paint} />',
  ])('rejects colour outside the scoped stylesheet: %s', (source) => {
    expect(() => checkJsxColours(source)).toThrow()
  })
  it('keeps TSX paint in scoped CSS and accepts only the agreed named drill bindings', () => {
    for (const file of files) checkJsxColours(read(`./${file}`))
    for (const [path, name] of Object.entries(allowed))
      expect(() => checkImports(`import { ${name} as Local } from '${path}'`)).not.toThrow()
    expect(() => checkJsxColours('<path fill="none" stroke="currentColor" />')).not.toThrow()
  })
  it('stacks the slip controls above the shell scrim while leaving the outside scrim clickable', () => {
    const css = read('./prov.css')
    const rule = (name: string) =>
      css.match(new RegExp(`\\[data-folio\\] \\.fa-prov \\.${name} \\{([^}]+)\\}`))?.[1] ?? ''
    const z = (name: string) => Number(rule(name).match(/z-index:\s*(\d+)/)?.[1])
    expect(z('fa-slip')).toBeGreaterThan(z('fa-scrim'))
    expect(rule('fa-scrim')).not.toMatch(/pointer-events:\s*none/)
    expect(rule('fa-slip')).not.toMatch(/pointer-events:\s*none/)
  })
  it('loads both screens lazily after hooks while retaining the classic runner', () => {
    const source = read('../../../routes/prov.tsx')
    const ast = ts.createSourceFile(
      'prov.tsx',
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
    expect(source).toContain("lazy(() => import('@/folio/screens/prov/FolioProvpass'))")
    expect(source).toContain("lazy(() => import('@/folio/screens/prov/FolioProvResult'))")
    expect(source.indexOf('if (inFolio &&')).toBeGreaterThan(source.indexOf('const handleVoid'))
    expect(source.indexOf("if (phase === 'running' && running)")).toBeLessThan(
      source.indexOf('if (inFolio)'),
    )
    expect(source.match(/<Suspense/g)).toHaveLength(2)
  })
  it('scopes selectors and limits colour to the score mark and facit letter', () => {
    const css = read('./prov.css').replace(/\/\*[\s\S]*?\*\//g, '')
    const selectors = [...css.matchAll(/([^{}]+)\{/g)]
      .map((m) => m[1].trim())
      .filter((s) => !s.startsWith('@'))
    expect(selectors.length).toBeGreaterThan(40)
    for (const group of selectors)
      for (const selector of group.replace(/\([^)]*\)/g, '(args)').split(','))
        expect(selector.trim()).toMatch(/^\[data-folio\] \.fa-prov(?:[\s.[:]|$)/)
    expect(css).not.toMatch(/--fa-bad|\bred\b|#[\da-f]{3,8}\b|\b(?:rgb|hsl|oklch)\(|opacity\s*:/i)
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (/var\(--fa-accent/.test(m[2])) expect(m[1]).toMatch(/\.fa-scale-(?:range|mark)/)
      if (/var\(--fa-ok/.test(m[2]))
        expect(m[1].trim()).toBe('[data-folio] .fa-prov .fa-right-letter')
    }
  })
  it('allows only the four agreed drill imports and no prototype or sibling screens', () => {
    for (const file of files) {
      checkImports(read(`./${file}`))
    }
  })
})
