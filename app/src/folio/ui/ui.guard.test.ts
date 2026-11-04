import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

import { __test as viewport } from '@/hooks/useViewport'
import { BAND_CORE } from './RangeBand'

const path = (file: string) => fileURLToPath(new URL(file, import.meta.url))
const read = (file: string) => readFileSync(path(file), 'utf8')
const uncomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const COMPONENTS = [
  'SecChip.tsx',
  'RangeBand.tsx',
  'Lit.tsx',
  'Go.tsx',
  'Seg.tsx',
  'Kbd.tsx',
  'Stepper.tsx',
  'ChipRow.tsx',
]
const SECTIONS = ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'] as const

// ── ui.css, parsed: top-level rules, @media rules and @keyframes ──────────
type Rule = { selector: string; parts: string[]; decls: [string, string][]; media: string | null }
type Block = { prelude: string; body: string }

function blocks(css: string): Block[] {
  const out: Block[] = []
  let depth = 0
  let start = 0
  let open = -1
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') {
      if (depth === 0) open = i
      depth++
    } else if (css[i] === '}') {
      depth--
      if (depth < 0) throw new Error(`unbalanced } at ${i}`)
      if (depth === 0) {
        const prelude = css.slice(start, open).replace(/\s+/g, ' ').trim()
        out.push({ prelude, body: css.slice(open + 1, i) })
        start = i + 1
      }
    }
  }
  if (depth !== 0 || css.slice(start).trim()) throw new Error('unbalanced or stray CSS')
  return out
}
const declarations = (body: string): [string, string][] =>
  body
    .split(';')
    .map((d) => d.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()])
// Top-level commas only; a comma inside :not(…) or a gradient stays.
function splitTop(text: string): string[] {
  const out: string[] = []
  let depth = 0
  let from = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') depth--
    else if (text[i] === ',' && depth === 0) {
      out.push(text.slice(from, i).trim())
      from = i + 1
    }
  }
  out.push(text.slice(from).trim())
  return out
}
function parseUi(css: string) {
  const rules: Rule[] = []
  const keyframes: { name: string; steps: Rule[] }[] = []
  const at: string[] = []
  const rule = (b: Block, media: string | null): Rule => ({
    selector: b.prelude,
    parts: splitTop(b.prelude),
    decls: declarations(b.body),
    media,
  })
  for (const b of blocks(uncomment(css))) {
    if (b.prelude.startsWith('@media')) {
      at.push(b.prelude)
      for (const inner of blocks(b.body)) rules.push(rule(inner, b.prelude))
    } else if (b.prelude.startsWith('@keyframes')) {
      keyframes.push({
        name: b.prelude.slice('@keyframes'.length).trim(),
        steps: blocks(b.body).map((inner) => rule(inner, null)),
      })
    } else if (b.prelude.startsWith('@')) {
      at.push(b.prelude)
    } else rules.push(rule(b, null))
  }
  return { rules, keyframes, at }
}
const UI = parseUi(read('./ui.css'))
const varsIn = (value: string) => [...value.matchAll(/var\(\s*(--[\w-]+)/g)].map(([, name]) => name)
const decl = (selector: string, property: string) =>
  UI.rules.find((r) => r.selector === selector)?.decls.find(([p]) => p === property)?.[1]

// Ljusbord tokens (tokens.css) that a primitive may read. The Folio+ aliases
// that LJ-40 deletes are not among them.
const TOKEN_CSS = uncomment(read('../styles/tokens.css'))
const ROOT_TOKENS = new Set(
  [
    ...(TOKEN_CSS.match(/\[data-folio\]\s*\{([^}]*)\}/)?.[1] ?? '').matchAll(/(--fa-[\w-]+)\s*:/g),
  ].map(([, name]) => name),
)
const ALIAS =
  /^--fa-(?:paper|leaf|menu|rule|accent|on-accent|ok|mark|focus|fold|pop|serif|d-out|flash)(?:-|$)/
const LOCALS = new Set(
  UI.rules.flatMap((r) => r.decls.map(([p]) => p)).filter((p) => p.startsWith('--')),
)

const PAINT =
  /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?|box-shadow|text-shadow|fill|stroke|caret-color|text-decoration(?:-color)?|column-rule(?:-color)?|(?:-webkit-)?mask(?:-image)?|accent-color)$/
const KEYWORDS = new Set([
  'transparent',
  'currentcolor',
  'none',
  'solid',
  'inset',
  'inherit',
  'important',
  'linear-gradient',
  'calc',
])
const LITERAL_COLOUR =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(|\bred\b/i
function paintViolations(rules: Rule[]): string[] {
  const out: string[] = []
  for (const r of rules)
    for (const [property, value] of r.decls) {
      if (LITERAL_COLOUR.test(value)) out.push(`${r.selector} { ${property}: ${value} }`)
      if (/^(?:opacity|filter|backdrop-filter|mix-blend-mode)$/.test(property))
        out.push(`${r.selector} { ${property} }`)
      if (/var\(\s*--[\w-]+\s*,/.test(value)) out.push(`${r.selector}: a var() fallback`)
      if (!PAINT.test(property)) continue
      const words =
        value
          .replace(/var\(\s*--[\w-]+\s*\)/g, ' ')
          .replace(/-?\d*\.?\d+(?:px|em|rem|%|deg)?/g, ' ')
          .match(/[a-z-]+/gi) ?? []
      for (const word of words)
        if (!KEYWORDS.has(word.toLowerCase())) out.push(`${r.selector} { ${property}: ${word} }`)
    }
  return out
}

describe('Ljusbord UI primitives CSS (LJ-04)', () => {
  it('scopes every selector to [data-folio] .fa-ui-…, also inside @media', () => {
    const parts = UI.rules.flatMap((r) => r.parts)
    expect(parts.length).toBeGreaterThan(40)
    const SCOPED = /^\[data-folio\](?:\[data-(?:kbd|motion|theme)='[a-z]+'\])? \.fa-ui-[a-z][\w-]*/
    expect(parts.filter((p) => !SCOPED.test(p))).toEqual([])
    // No token is set on the root or on any other element: only local --fa-ui- helpers.
    expect([...LOCALS].filter((name) => !name.startsWith('--fa-ui-'))).toEqual([])
    expect(UI.at.filter((at) => !at.startsWith('@media'))).toEqual([])
  })

  it('reads only Ljusbord tokens and its own helpers, never a Folio+ alias', () => {
    expect(ROOT_TOKENS.size).toBeGreaterThan(60)
    const used = new Set(UI.rules.flatMap((r) => r.decls.flatMap(([, v]) => varsIn(v))))
    const unknown = [...used].filter((name) =>
      name.startsWith('--fa-ui-') ? !LOCALS.has(name) : !ROOT_TOKENS.has(name) || ALIAS.test(name),
    )
    expect(unknown).toEqual([])
    // Every helper is set from tokens alone.
    const helperValues = UI.rules.flatMap((r) =>
      r.decls.filter(([p]) => p.startsWith('--fa-ui-')).map(([p, v]) => `${p}: ${v}`),
    )
    expect(helperValues.length).toBeGreaterThan(0)
    expect(helperValues.filter((d) => !/^--fa-ui-[\w-]+: var\(--fa-[\w-]+\)$/.test(d))).toEqual([])
  })

  it('paints with tokens only: no literal colour, colour-mix, opacity or filter tricks', () => {
    expect(paintViolations(UI.rules)).toEqual([])
    expect(uncomment(read('./ui.css'))).not.toMatch(LITERAL_COLOUR)
  })

  it.each([
    '[data-folio] .fa-ui-x { color: #15181B }',
    '[data-folio] .fa-ui-x { background: rgba(255, 255, 255, 0.35) }',
    '[data-folio] .fa-ui-x { color: color-mix(in oklab, var(--fa-ink) 76%, var(--fa-mixk)) }',
    '[data-folio] .fa-ui-x { opacity: 0.85 }',
    '[data-folio] .fa-ui-x { filter: brightness(1.2) }',
    '[data-folio] .fa-ui-x { mask-image: linear-gradient(90deg, black 82%, transparent) }',
    '[data-folio] .fa-ui-x { border-color: white }',
    '[data-folio] .fa-ui-x { color: var(--fa-ink, #000) }',
  ])('catches a planted trick: %s', (css) => {
    expect(paintViolations(parseUi(css).rules)).not.toEqual([])
  })

  it('keeps colour on data: section hues only in [data-sec] rules, through the chip and the band', () => {
    for (const r of UI.rules)
      for (const [property, value] of r.decls)
        for (const name of varsIn(value)) {
          const sec = name.match(/^--fa-sec-([a-z]+)/)?.[1]
          if (!sec) continue
          expect(property, r.selector).toMatch(/^--fa-ui-c(?:-ink|-soft)?$/)
          expect(
            r.parts.every((p) => p.includes(`[data-sec='${sec}']`)),
            r.selector,
          ).toBe(true)
        }
    for (const sec of SECTIONS) {
      const selector = `[data-folio] .fa-ui-sec[data-sec='${sec}'], [data-folio] .fa-ui-band[data-sec='${sec}']`
      expect(decl(selector, '--fa-ui-c'), sec).toBe(`var(--fa-sec-${sec})`)
      expect(decl(selector, '--fa-ui-c-ink'), sec).toBe(`var(--fa-sec-${sec}-ink)`)
      expect(decl(selector, '--fa-ui-c-soft'), sec).toBe(`var(--fa-sec-${sec}-soft)`)
    }
    // The hue paints the chip's text and fill, its dot and the band; nothing else.
    const uses = UI.rules.flatMap((r) =>
      r.decls
        .filter(([p, v]) => !p.startsWith('--') && /var\(--fa-ui-c(?:-ink|-soft)?\)/.test(v))
        .map(([p, v]) => `${r.selector} { ${p}: ${v} }`),
    )
    expect(uses.sort()).toEqual(
      [
        '[data-folio] .fa-ui-sec { background: var(--fa-ui-c-soft) }',
        '[data-folio] .fa-ui-sec { color: var(--fa-ui-c-ink) }',
        '[data-folio] .fa-ui-sec::before { background: var(--fa-ui-c) }',
        '[data-folio] .fa-ui-band-range { background: linear-gradient(90deg, transparent, var(--fa-ui-c) 20%, var(--fa-ui-c) 80%, transparent) }',
      ].sort(),
    )
  })

  it('sets text only in ink: never ink-4, a raw hue or a translucent fill', () => {
    const TEXT = new Set([
      'var(--fa-ink)',
      'var(--fa-ink-2)',
      'var(--fa-ink-3)',
      'var(--fa-on-ink)',
      'var(--fa-on-go)',
      'var(--fa-ui-c-ink)',
      'inherit',
    ])
    const colours = UI.rules.flatMap((r) =>
      r.decls.filter(([p]) => p === 'color').map(([, v]) => `${r.selector}: ${v}`),
    )
    expect(colours.length).toBeGreaterThan(10)
    expect(colours.filter((c) => !TEXT.has(c.slice(c.lastIndexOf(': ') + 2)))).toEqual([])
  })

  it('keeps the elevation rule: lift-2 lights the one sheet, go fills the one action, the halo marks the current one', () => {
    const where = (token: RegExp) =>
      UI.rules.filter((r) => r.decls.some(([, v]) => varsIn(v).some((n) => token.test(n))))
    expect(where(/^--fa-lift-2$/).map((r) => r.selector)).toEqual(['[data-folio] .fa-ui-lit'])
    expect(
      where(/^--fa-(?:on-)?go$/).every((r) =>
        r.parts.every((p) => p.startsWith('[data-folio] .fa-ui-go')),
      ),
    ).toBe(true)
    expect(where(/^--fa-(?:on-)?go$/).length).toBeGreaterThan(0)
    for (const r of where(/^--fa-(?:halo|lit-bg|lit-edge)$/))
      expect(
        r.parts.every((p) => p.includes('[aria-current')),
        r.selector,
      ).toBe(true)
    for (const r of where(/^--fa-lift-1$/))
      expect(
        r.parts.every((p) => p.includes("[aria-pressed='true']") || p.includes('[aria-current')),
        r.selector,
      ).toBe(true)
    expect(where(/^--fa-halo$/).length).toBeGreaterThan(0)
  })

  it('moves only with motion: no animation, transition or transform outside data-motion', () => {
    for (const r of UI.rules)
      for (const [property, value] of r.decls) {
        if (!/^(?:animation(?:-name)?|transition|transform)$/.test(property)) continue
        const full = r.parts.every((p) => p.includes("[data-motion='full']"))
        const less = r.parts.every((p) => p.includes("[data-motion='less']"))
        expect(full || less, `${r.selector} { ${property} }`).toBe(true)
        // Mindre keeps opacity fades and drops transforms (map §1.7).
        if (less) expect(`${property}: ${value}`).toMatch(/^animation: fa-ui-fade /)
      }
    const names = UI.keyframes.map((k) => k.name).sort()
    expect(names).toEqual(['fa-ui-fade', 'fa-ui-grow', 'fa-ui-rise'])
    for (const { name, steps } of UI.keyframes)
      for (const step of steps)
        for (const [property] of step.decls)
          expect(`${name}: ${property}`).toMatch(
            name === 'fa-ui-fade' ? /: opacity$/ : /: (?:opacity|transform)$/,
          )
    const used = UI.rules.flatMap((r) =>
      r.decls.filter(([p]) => p === 'animation').map(([, v]) => v.split(/\s+/)[0]),
    )
    expect([...new Set(used)].sort()).toEqual(names)
  })

  it('grows the band from its lower bound, whose solid core is the stated range', () => {
    expect(BAND_CORE).toEqual({ start: 0.2, end: 0.8 })
    const range = '[data-folio] .fa-ui-band-range'
    expect(decl(range, 'background')).toBe(
      `linear-gradient(90deg, transparent, var(--fa-ui-c) ${BAND_CORE.start * 100}%, var(--fa-ui-c) ${BAND_CORE.end * 100}%, transparent)`,
    )
    expect(decl(range, 'transform-origin')).toBe(`${BAND_CORE.start * 100}% 50%`)
    expect(
      decl(`[data-folio] .fa-ui-band[data-motion='full'] .fa-ui-band-range`, 'animation'),
    ).toBe('fa-ui-grow var(--fa-d3) var(--fa-ease) both')
    const grow = UI.keyframes.find((k) => k.name === 'fa-ui-grow')
    expect(grow?.steps[0].decls).toContainEqual(['transform', 'scaleX(0.15)'])
  })

  it('hides every key hint under kbd=off, and the docked one on a phone', () => {
    expect(
      decl(
        "[data-folio][data-kbd='off'] .fa-ui-kbd, [data-folio][data-kbd='off'] .fa-ui-keys",
        'display',
      ),
    ).toBe('none !important')
    const phone = `@media (max-width: ${viewport.READER_MIN - 1}px)`
    const dock = UI.rules.find(
      (r) => r.selector === '[data-folio] .fa-ui-go[data-dock] .fa-ui-kbd' && r.media === phone,
    )
    expect(dock?.decls).toContainEqual(['display', 'none !important'])
    // The phone shell switches at useViewport's reader width; so does every rule here.
    expect([...new Set(UI.at)].sort()).toEqual(
      [phone, `@media (min-width: ${viewport.READER_MIN}px)`].sort(),
    )
  })

  it('gives every control a 2.5 px ink ring 3 px out, and never removes an outline', () => {
    for (const control of ['go', 'seg-option', 'step', 'chip']) {
      const rule = UI.rules.find((r) =>
        r.parts.includes(`[data-folio] .fa-ui-${control}:focus-visible`),
      )
      expect(rule?.decls, control).toContainEqual([
        'outline',
        'var(--fa-ring-w) solid var(--fa-ring)',
      ])
      expect(rule?.decls, control).toContainEqual(['outline-offset', 'var(--fa-ring-offset)'])
    }
    const removed = UI.rules.flatMap((r) =>
      r.decls.filter(([p, v]) => /^outline/.test(p) && /none|^0/.test(v)).map(() => r.selector),
    )
    expect(removed).toEqual([])
  })

  it('makes Seg options 44 px targets and keeps every other control at the design size or more', () => {
    const min = (selector: string) => Number.parseFloat(decl(selector, 'min-height') ?? '0')
    expect(min('[data-folio] .fa-ui-seg-option')).toBeGreaterThanOrEqual(44)
    // Seg is a fieldset: its frame and min-content width are reset, so it wraps at 390 px.
    for (const [property, value] of [
      ['min-width', '0'],
      ['margin', '0'],
      ['border', '0'],
      ['flex-wrap', 'wrap'],
    ])
      expect(decl('[data-folio] .fa-ui-seg', property), property).toBe(value)
    expect(min('[data-folio] .fa-ui-go')).toBeGreaterThanOrEqual(44)
    expect(min('[data-folio] .fa-ui-step')).toBeGreaterThanOrEqual(40)
    expect(min('[data-folio] .fa-ui-chip')).toBeGreaterThanOrEqual(40)
  })

  it('styles only classes the primitives render, and the primitives render only fa-ui- classes', () => {
    const sources = COMPONENTS.map((file) => read(`./${file}`)).join('\n')
    const rendered = new Set(
      [...sources.matchAll(/['"`]((?:fa-ui-[\w-]+\s*)+)/g)].flatMap(([, list]) =>
        list.split(/\s+/),
      ),
    )
    const styled = new Set(
      UI.rules.flatMap((r) => [...r.selector.matchAll(/\.(fa-ui-[\w-]+)/g)].map(([, c]) => c)),
    )
    expect([...styled].filter((c) => !rendered.has(c))).toEqual([])
    const classNames = [
      ...sources.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\}|'([^']*)')/g),
    ].flatMap((m) =>
      (m[1] ?? m[2] ?? m[3])
        .replace(/\$\{[^}]*\}/g, '')
        .split(/\s+/)
        .filter(Boolean),
    )
    expect(classNames.length).toBeGreaterThan(5)
    expect(classNames.filter((c) => !c.startsWith('fa-ui-'))).toEqual([])
  })
})

// ── The contrast of what each primitive paints, in every palette and theme ──
type Rgba = [number, number, number, number]
type CascadeRule = { selector: string; decls: [string, string][]; order: number }
const parseFlat = (file: string, first: number): CascadeRule[] =>
  [...uncomment(read(file)).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m, i) => ({
    selector: m[1].trim(),
    decls: declarations(m[2]).filter(([p]) => p.startsWith('--')),
    order: first + i,
  }))
// tokens.css loads before palette.css, as FolioShell imports them.
const CASCADE = [
  ...parseFlat('../styles/tokens.css', 0),
  ...parseFlat('../styles/palette.css', 10_000),
]
const ROOT = /^\[data-folio\](?:\[[\w-]+='[^']*'\]|:not\(\[[\w-]+='[^']*'\]\))*$/
const PALETTES = ['spalt', 'sand', 'sage', 'ink', 'rose'] as const
const THEMES = ['light', 'dark'] as const
const STATES = PALETTES.flatMap((palette) => THEMES.map((theme) => ({ palette, theme })))
type State = (typeof STATES)[number]

function tokensFor(state: State): Map<string, string> {
  const attrs: Record<string, string> = { 'data-palette': state.palette, 'data-theme': state.theme }
  const won = new Map<string, { weight: number; order: number; value: string }>()
  for (const rule of CASCADE) {
    if (!ROOT.test(rule.selector)) continue
    let weight = 1
    let applies = true
    for (const [, not, name, value] of rule.selector.matchAll(/(:not\()?\[([\w-]+)='([^']*)'\]/g)) {
      weight++
      if ((attrs[name] === value) === Boolean(not)) applies = false
    }
    if (!applies) continue
    for (const [name, value] of rule.decls) {
      const prev = won.get(name)
      if (!prev || weight > prev.weight || (weight === prev.weight && rule.order >= prev.order))
        won.set(name, { weight, order: rule.order, value })
    }
  }
  return new Map([...won].map(([name, { value }]) => [name, value]))
}
function resolve(name: string, vars: Map<string, string>, seen: string[] = []): string {
  const value = vars.get(name)
  if (value === undefined || seen.includes(name)) throw new Error(`${[...seen, name].join(' → ')}`)
  return value.replace(/var\((--[\w-]+)\)/g, (_, inner: string) =>
    resolve(inner, vars, [...seen, name]),
  )
}
const clamp = (c: number) => Math.min(1, Math.max(0, c))
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const num = (text: string) =>
  text.endsWith('%') ? Number.parseFloat(text) / 100 : Number.parseFloat(text)
function colour(text: string): Rgba {
  const hex = text.match(/^#([\da-f]{6})$/i)?.[1]
  if (hex) {
    const [r, g, b] = (hex.match(/../g) ?? []).map((x) => Number.parseInt(x, 16) / 255)
    return [r, g, b, 1]
  }
  const fn = text.match(/^(rgba?|oklch)\(([^)]*)\)$/i)
  if (!fn) throw new Error(`not a colour: ${text}`)
  const [x, y, z, a = '1'] = fn[2].split(/[\s,/]+/).filter(Boolean)
  if (fn[1].toLowerCase() !== 'oklch') return [num(x) / 255, num(y) / 255, num(z) / 255, num(a)]
  const [L, C, H] = [num(x), num(y), num(z)]
  const A = C * Math.cos((H * Math.PI) / 180)
  const B = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3
  return [
    gamma(clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    gamma(clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    gamma(clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
    num(a),
  ]
}
// Alpha over an opaque surface, in sRGB as browsers composite.
const over = ([r, g, b, a]: Rgba, [R, G, B]: Rgba): Rgba => [
  r * a + R * (1 - a),
  g * a + G * (1 - a),
  b * a + B * (1 - a),
  1,
]
function contrast(fg: Rgba, bg: Rgba): number {
  const y = ([r, g, b]: Rgba) =>
    0.2126 * linear(clamp(r)) + 0.7152 * linear(clamp(g)) + 0.0722 * linear(clamp(b))
  const [p, q] = [y(fg), y(bg)]
  return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05)
}
/** Paints `layers` (the top one first) over the last, opaque surface. */
function paint(state: State, layers: string[]): Rgba {
  const vars = tokensFor(state)
  const stack = layers.map((name) => colour(resolve(name, vars)))
  let bottom = stack[stack.length - 1]
  if (bottom[3] !== 1) throw new Error(`${layers.at(-1)} is not an opaque surface`)
  for (const layer of stack.slice(0, -1).reverse()) bottom = over(layer, bottom)
  return bottom
}
const ratio = (state: State, fg: string, surface: string[]) =>
  contrast(paint(state, [fg, ...surface]), paint(state, surface))

// What each primitive paints and where it sits. A rule that sets no
// background lies on the surfaces listed in `on`.
const TEXT_ON: { selector: string; color: string; background?: string; on?: string[][] }[] = [
  { selector: '[data-folio] .fa-ui-go', color: '--fa-on-go', background: '--fa-go' },
  { selector: '[data-folio] .fa-ui-go:disabled', color: '--fa-ink-2', background: '--fa-table-3' },
  {
    selector: '[data-folio] .fa-ui-kbd',
    color: '--fa-ink-3',
    on: [['--fa-sheet'], ['--fa-table']],
  },
  { selector: '[data-folio] .fa-ui-seg-option', color: '--fa-ink-2', on: [['--fa-table-2']] },
  {
    selector: "[data-folio] .fa-ui-seg-option[aria-pressed='true']",
    color: '--fa-ink',
    background: '--fa-sheet',
  },
  { selector: '[data-folio] .fa-ui-step', color: '--fa-ink-2', background: '--fa-sheet' },
  {
    selector: "[data-folio] .fa-ui-step[aria-current='step']",
    color: '--fa-ink',
    on: [['--fa-sheet']],
  },
  { selector: '[data-folio] .fa-ui-step-n', color: '--fa-ink-2', background: '--fa-table-2' },
  {
    selector: '[data-folio] .fa-ui-step[data-done] .fa-ui-step-n',
    color: '--fa-on-ink',
    background: '--fa-ink-2',
  },
  {
    selector: "[data-folio] .fa-ui-step[aria-current='step'] .fa-ui-step-n",
    color: '--fa-on-ink',
    background: '--fa-ink',
  },
  { selector: '[data-folio] .fa-ui-chip', color: '--fa-ink-2', background: '--fa-sheet' },
  {
    selector: "[data-folio] .fa-ui-chip[aria-current]:not([aria-current='false'])",
    color: '--fa-ink',
    background: '--fa-lit-bg',
  },
  { selector: '[data-folio] .fa-ui-lit', color: '--fa-ink', background: '--fa-sheet' },
  {
    selector: '[data-folio] .fa-ui-band-ticks',
    color: '--fa-ink-3',
    on: [['--fa-sheet'], ['--fa-table']],
  },
  {
    selector: '[data-folio] .fa-ui-band-goal-label',
    color: '--fa-ink-3',
    on: [['--fa-sheet'], ['--fa-table']],
  },
]

describe('Ljusbord UI primitives contrast (LJ-04), all five palettes in both themes', () => {
  it('paints each listed pair exactly as ui.css declares it', () => {
    for (const pair of TEXT_ON) {
      expect(decl(pair.selector, 'color'), pair.selector).toBe(`var(${pair.color})`)
      if (pair.background)
        expect(decl(pair.selector, 'background'), pair.selector).toBe(`var(${pair.background})`)
    }
  })

  it.each(
    STATES.map((s) => [`${s.palette}, ${s.theme}`, s] as const),
  )('reads every primitive text at 4.5:1 (%s)', (_, state) => {
    const low = TEXT_ON.flatMap((pair) =>
      (pair.background ? [[pair.background]] : (pair.on ?? []))
        .map(
          (surface) =>
            [pair.selector, surface.join(' on '), ratio(state, pair.color, surface)] as const,
        )
        .filter(([, , r]) => r < 4.5)
        .map(([s, on, r]) => `${s} on ${on}: ${r.toFixed(2)}`),
    )
    expect(low).toEqual([])
  })

  it.each(
    STATES.map((s) => [`${s.palette}, ${s.theme}`, s] as const),
  )('reads each section chip at 4.5:1 on its tint over a sheet or the table (%s)', (_, state) => {
    const low = SECTIONS.flatMap((s) =>
      ['--fa-sheet', '--fa-sheet-2', '--fa-table', '--fa-table-2']
        .map(
          (ground) =>
            [s, ground, ratio(state, `--fa-sec-${s}-ink`, [`--fa-sec-${s}-soft`, ground])] as const,
        )
        .filter(([, , r]) => r < 4.5)
        .map(([sec, ground, r]) => `${sec} on ${ground}: ${r.toFixed(2)}`),
    )
    expect(low).toEqual([])
  })

  it.each(
    STATES.map((s) => [`${s.palette}, ${s.theme}`, s] as const),
  )('draws the band core, the goal and the point at 3:1 (%s)', (_, state) => {
    expect(decl('[data-folio] .fa-ui-band', '--fa-ui-c')).toBe('var(--fa-ink-2)')
    const marks = ['--fa-ink-2', '--fa-ink', ...SECTIONS.map((s) => `--fa-sec-${s}`)]
    const low = marks.flatMap((mark) =>
      ['--fa-sheet', '--fa-table-2']
        .map((ground) => [mark, ground, ratio(state, mark, [ground])] as const)
        .filter(([, , r]) => r < 3)
        .map(([m, g, r]) => `${m} on ${g}: ${r.toFixed(2)}`),
    )
    expect(low).toEqual([])
  })
})

// ── The TSX sources ───────────────────────────────────────────────────────
const parse = (file: string, text: string) =>
  ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
const BANNED_JSX =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|oklch|color-mix)\(|\bred\b|opacity|--fa-(?!ui-)/i

describe('Ljusbord UI primitives sources (LJ-04)', () => {
  it.each(
    COMPONENTS,
  )('%s loads ui.css and depends on nothing but React, the Folio libs and its siblings', (file) => {
    const source = read(`./${file}`)
    const ast = parse(file, source)
    const imports = ast.statements
      .filter(ts.isImportDeclaration)
      .map((s) => (s.moduleSpecifier as ts.StringLiteral).text)
    expect(imports).toContain('./ui.css')
    expect(
      imports.filter((s) => !/^(?:react|\.\/[\w.]+|\.\.\/lib\/[\w]+|@\/data\/questions)$/.test(s)),
    ).toEqual([])
    // A section is a type here; the question bank is never loaded by a primitive.
    for (const s of ast.statements.filter(ts.isImportDeclaration))
      if ((s.moduleSpecifier as ts.StringLiteral).text === '@/data/questions')
        expect(s.importClause?.isTypeOnly, file).toBe(true)
    expect(source).not.toMatch(/devbake|dogfood|styckeljus/)
  })

  it('puts no colour, opacity or token in JSX: geometry only', () => {
    const violations: string[] = []
    for (const file of COMPONENTS) {
      const ast = parse(file, read(`./${file}`))
      const visit = (node: ts.Node) => {
        if (
          ts.isJsxAttribute(node) &&
          ['style', 'fill', 'stroke', 'color', 'className'].includes(node.name.getText(ast))
        ) {
          const text = node.initializer?.getText(ast) ?? ''
          if (BANNED_JSX.test(text)) violations.push(`${file}: ${text}`)
        }
        ts.forEachChild(node, visit)
      }
      visit(ast)
    }
    expect(violations).toEqual([])
  })

  it.each([
    '<i style={{ color: "#f00" }} />',
    '<i style={{ background: "rgb(1 2 3)" }} />',
    '<i style={{ opacity: 0.6 }} />',
    '<i style={{ color: "var(--fa-sec-kva)" }} />',
  ])('catches planted JSX colour: %s', (source) => {
    const ast = parse('x.tsx', source)
    let found = false
    const visit = (node: ts.Node) => {
      if (ts.isJsxAttribute(node) && BANNED_JSX.test(node.initializer?.getText(ast) ?? ''))
        found = true
      ts.forEachChild(node, visit)
    }
    visit(ast)
    expect(found).toBe(true)
  })
})
