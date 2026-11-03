import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useFolioFonts } from '../lib/useFolioFonts'

const path = (file: string) => fileURLToPath(new URL(file, import.meta.url))
const read = (file: string) => readFileSync(path(file), 'utf8')
const uncomment = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

// r6/A/system.css, the approved design. Spalt is this, exactly.
const SYSTEM = {
  light: {
    '--fa-table': '#ECEEEA',
    '--fa-table-2': '#E3E6E1',
    '--fa-table-3': '#D7DBD5',
    '--fa-sheet': '#FFFFFF',
    '--fa-sheet-2': '#F5F6F3',
    '--fa-ink': '#15181B',
    '--fa-ink-2': '#3E444A',
    '--fa-ink-3': '#61686F',
    '--fa-ink-4': '#8E949A',
    '--fa-line': '#D9DCD6',
    '--fa-line-2': '#BFC4BD',
    '--fa-on-ink': '#FFFFFF',
    '--fa-mixk': '#000000',
    '--fa-on-c': '#FFFFFF',
    '--fa-lit-bg': '#FFFDF6',
    '--fa-lit-edge': '#E9E1C8',
    '--fa-sec-ord': '#2F5FD0',
    '--fa-sec-las': '#0B7F82',
    '--fa-sec-mek': '#6D52CC',
    '--fa-sec-elf': '#2B8452',
    '--fa-sec-xyz': '#5F760B',
    '--fa-sec-kva': '#9A6300',
    '--fa-sec-nog': '#7E6146',
    '--fa-sec-dtk': '#8E4594',
  },
  dark: {
    '--fa-table': '#101214',
    '--fa-table-2': '#171A1D',
    '--fa-table-3': '#202428',
    '--fa-sheet': '#1C2024',
    '--fa-sheet-2': '#23282C',
    '--fa-ink': '#EDEFEB',
    '--fa-ink-2': '#C6CBC5',
    '--fa-ink-3': '#9CA3AA',
    '--fa-ink-4': '#6D747B',
    '--fa-line': '#2D3338',
    '--fa-line-2': '#3D444A',
    '--fa-on-ink': '#101214',
    '--fa-mixk': '#FFFFFF',
    '--fa-on-c': '#101214',
    '--fa-lit-bg': '#26281F',
    '--fa-lit-edge': '#4A4632',
    '--fa-sec-ord': '#86A6FF',
    '--fa-sec-las': '#3CC4C6',
    '--fa-sec-mek': '#AE9AFF',
    '--fa-sec-elf': '#5CC88B',
    '--fa-sec-xyz': '#A9C443',
    '--fa-sec-kva': '#E8A93A',
    '--fa-sec-nog': '#C8A684',
    '--fa-sec-dtk': '#D990DF',
  },
} as const
const LIFT_1 = '0 1px 0 rgba(16,20,24,.04), 0 2px 6px -2px rgba(16,20,24,.09)'
const SYSTEM_REST = {
  shared: {
    '--fa-lift-1': LIFT_1,
    '--fa-r1': '10px',
    '--fa-r2': '14px',
    '--fa-r3': '22px',
    '--fa-sans':
      '"Ljus Siffror", "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, -apple-system, "Segoe UI", sans-serif',
    '--fa-display': '"Schibsted Grotesk", "Ljus Siffror", system-ui, sans-serif',
    '--fa-mono': '"Atkinson Hyperlegible Mono", ui-monospace, "SFMono-Regular", Menlo, monospace',
    '--fa-ease': 'cubic-bezier(.2,.7,.2,1)',
    '--fa-d1': '140ms',
    '--fa-d2': '260ms',
    '--fa-d3': '600ms',
    // :focus-visible { outline: 2.5px solid var(--ink); outline-offset: 3px }
    '--fa-ring-w': '2.5px',
    '--fa-ring-offset': '3px',
  },
  light: {
    '--fa-halo': '0 0 0 5px rgba(255,255,255,.7), 0 0 26px 8px rgba(255,253,245,.95)',
    '--fa-lift-2':
      '0 1px 0 rgba(16,20,24,.05), 0 12px 30px -12px rgba(16,20,24,.18), 0 34px 80px -34px rgba(16,20,24,.18)',
  },
  dark: {
    '--fa-halo': '0 0 0 5px rgba(255,255,255,.05), 0 0 26px 8px rgba(255,248,220,.07)',
    '--fa-lift-2': '0 0 0 1px #2D3338, 0 20px 50px -20px rgba(0,0,0,.6)',
  },
} as const
// The primary action is ink-filled and the focus ring is ink (map §1.2, §1.6).
const SYSTEM_ROLES = { '--fa-go': '--fa-ink', '--fa-on-go': '--fa-on-ink', '--fa-ring': '--fa-ink' }
const sys = (theme: 'light' | 'dark', name: string) =>
  (SYSTEM[theme] as Record<string, string>)[name]

const SECTIONS = ['ord', 'las', 'mek', 'elf', 'xyz', 'kva', 'nog', 'dtk'] as const
const PALETTES = ['spalt', 'sand', 'sage', 'ink', 'rose'] as const
const THEMES = ['light', 'dark'] as const
type Theme = (typeof THEMES)[number]
type State = { palette: string | null; theme: Theme }
const STATES: State[] = [null, ...PALETTES].flatMap((palette) =>
  THEMES.map((theme) => ({ palette, theme })),
)
const label = (state: State) => `${state.palette ?? 'no palette'}, ${state.theme}`
// What a palette may move: the ground, the sheets and the accent family.
const PALETTE_TOKENS = [
  '--fa-table',
  '--fa-table-2',
  '--fa-table-3',
  '--fa-sheet',
  '--fa-sheet-2',
  '--fa-go',
  '--fa-on-go',
]

// Every Folio+ name points at its Ljusbord token until its screen migrates
// (map §1.9); LJ-40 deletes them.
const ALIASES: Record<string, string> = {
  '--fa-paper': '--fa-table',
  '--fa-paper-2': '--fa-table-2',
  '--fa-paper-3': '--fa-table-3',
  '--fa-leaf': '--fa-sheet',
  '--fa-menu': '--fa-sheet',
  '--fa-rule': '--fa-line',
  '--fa-rule-2': '--fa-line-2',
  '--fa-rule-strong': '--fa-ink',
  '--fa-accent': '--fa-go',
  '--fa-accent-2': '--fa-go',
  '--fa-accent-ink': '--fa-go',
  '--fa-accent-soft': '--fa-table-3',
  '--fa-accent-fill': '--fa-go',
  '--fa-accent-fill-2': '--fa-go',
  '--fa-on-accent': '--fa-on-go',
  '--fa-ok': '--fa-ink',
  '--fa-ok-soft': '--fa-table-2',
  '--fa-mark': '--fa-lit-edge',
  '--fa-focus': '--fa-ring',
  '--fa-fold': '--fa-table-2',
  '--fa-fold-2': '--fa-table-3',
  '--fa-pop': '--fa-lift-2',
  '--fa-serif': '--fa-sans',
  '--fa-d-out': '--fa-d1',
  '--fa-flash': '--fa-d3',
}
// Folio+ names that Ljusbord keeps, with its own values.
const KEPT = [
  '--fa-ink',
  '--fa-ink-2',
  '--fa-ink-3',
  '--fa-sans',
  ...[12, 13, 15, 17, 19, 24, 32, 44, 56].map((n) => `--fa-t${n}`),
  ...[1, 2, 3, 4, 6, 8, 12, 16].map((n) => `--fa-s${n}`),
  '--fa-r1',
  '--fa-r2',
  '--fa-ease',
  '--fa-d1',
  '--fa-d2',
  '--fa-math-scale',
  '--fa-scrim',
]
const LJUSBORD = [
  ...Object.keys(SYSTEM.light),
  ...SECTIONS.flatMap((s) => [`--fa-sec-${s}-ink`, `--fa-sec-${s}-soft`]),
  ...Object.keys(SYSTEM_REST.shared),
  ...Object.keys(SYSTEM_REST.light),
  ...Object.keys(SYSTEM_ROLES),
  '--fa-fs-base',
]

// ── The cascade on the Folio root, for one palette and theme ──────────────
type Rule = { file: string; selector: string; decls: [string, string][]; order: number }
function parseRules(file: string, first: number): Rule[] {
  return [...uncomment(read(file)).matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m, i) => ({
    file,
    selector: m[1].trim(),
    decls: m[2]
      .split(';')
      .map((d) => d.trim())
      .filter((d) => d.startsWith('--'))
      .map((d) => [d.slice(0, d.indexOf(':')).trim(), d.slice(d.indexOf(':') + 1).trim()]),
    order: first + i,
  }))
}
// tokens.css loads before palette.css (FolioShell imports them in that order).
const RULES = [...parseRules('./tokens.css', 0), ...parseRules('./palette.css', 10_000)]
const ROOT = /^\[data-folio\](?:\[[\w-]+='[^']*'\]|:not\(\[[\w-]+='[^']*'\]\))*$/

function specificity(selector: string, state: State): number | null {
  if (!ROOT.test(selector)) return null
  const attrs: Record<string, string> = { 'data-theme': state.theme }
  if (state.palette) attrs['data-palette'] = state.palette
  let weight = 1
  for (const [, not, name, value] of selector.matchAll(/(:not\()?\[([\w-]+)='([^']*)'\]/g)) {
    weight++
    if ((attrs[name] === value) === Boolean(not)) return null
  }
  return weight
}
function cascade(state: State): Map<string, string> {
  const won = new Map<string, { weight: number; order: number; value: string }>()
  for (const rule of RULES) {
    const weight = specificity(rule.selector, state)
    if (weight === null) continue
    for (const [name, value] of rule.decls) {
      const prev = won.get(name)
      if (!prev || weight > prev.weight || (weight === prev.weight && rule.order >= prev.order))
        won.set(name, { weight, order: rule.order, value })
    }
  }
  return new Map([...won].map(([name, { value }]) => [name, value]))
}
function resolve(name: string, vars: Map<string, string>, trail: string[] = []): string {
  const value = vars.get(name)
  const chain = [...trail, name].join(' → ')
  if (value === undefined) throw new Error(`${chain} is undefined`)
  if (trail.includes(name)) throw new Error(`${chain} is a cycle`)
  return value.replace(/var\((--[\w-]+)\)/g, (_, inner: string) =>
    resolve(inner, vars, [...trail, name]),
  )
}
const value = (state: State, name: string) => resolve(name, cascade(state))

// ── Colour: sRGB, OKLab/OKLCH, WCAG contrast, HSL ─────────────────────────
type Rgba = [number, number, number, number]
const clamp = (c: number) => Math.min(1, Math.max(0, c))
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
const gamma = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055)
const number = (text: string) =>
  text.endsWith('%') ? Number.parseFloat(text) / 100 : Number.parseFloat(text)

function toOklab([r, g, b]: number[]): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map(linear)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}
function fromOklch(L: number, C: number, H: number): [number, number, number] {
  const a = C * Math.cos((H * Math.PI) / 180)
  const b = C * Math.sin((H * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
  return rgb.map((c) => gamma(clamp(c))) as [number, number, number]
}
function parseColour(text: string): Rgba {
  const hex = text.match(/^#([\da-f]{3,8})$/i)?.[1]
  if (hex) {
    const full = hex.length <= 4 ? [...hex].map((c) => c + c).join('') : hex
    const [r, g, b, a = 255] = (full.match(/../g) ?? []).map((x) => Number.parseInt(x, 16))
    return [r / 255, g / 255, b / 255, a / 255]
  }
  const fn = text.match(/^(rgba?|oklch)\(([^)]*)\)$/i)
  if (!fn) throw new Error(`not a colour literal: ${text}`)
  const [x, y, z, a = '1'] = fn[2].split(/[\s,/]+/).filter(Boolean)
  if (fn[1].toLowerCase() === 'oklch')
    return [...fromOklch(number(x), number(y), number(z)), number(a)]
  return [Number(x) / 255, Number(y) / 255, Number(z) / 255, number(a)]
}
const COLOUR = /#[\da-f]{3,8}\b|\b(?:rgba?|oklch|hsla?|lab|lch|oklab|color)\([^)]*\)/gi
const hexOf = ([r, g, b]: number[]) =>
  `#${[r, g, b]
    .map((c) =>
      Math.round(clamp(c) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`.toUpperCase()
const digits = (x: number, places: number) => String(Number(x.toFixed(places)))
// The canonical OKLCH text of an OKLab colour; it rounds back to the same hex.
function oklchText([L, a, b]: number[], alpha = 1): string {
  const C = Math.hypot(a, b)
  const H = ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360
  const lch =
    C < 0.00005
      ? `${digits(L * 100, 2)}% 0 0`
      : `${digits(L * 100, 2)}% ${digits(C, 4)} ${digits(H, 2)}`
  return `oklch(${lch}${alpha < 1 ? ` / ${alpha}` : ''})`
}
const oklchOfHex = (hex: string) => oklchText(toOklab(parseColour(hex)))
function contrast(fg: Rgba, bg: Rgba): number {
  const y = ([r, g, b]: number[]) =>
    0.2126 * linear(clamp(r)) + 0.7152 * linear(clamp(g)) + 0.0722 * linear(clamp(b))
  const [a, b] = [y(fg), y(bg)]
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
function hueAndSaturation([r, g, b]: number[]): [number, number] {
  const [R, G, B] = [r, g, b].map(clamp)
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  if (d < 1e-9) return [0, 0]
  const h = max === R ? ((G - B) / d) % 6 : max === G ? (B - R) / d + 2 : (R - G) / d + 4
  return [(h * 60 + 360) % 360, d / (1 - Math.abs(max + min - 1))]
}
// The owner's "no red anywhere", as the brief puts it.
function isRed(colour: string): boolean {
  const [hue, saturation] = hueAndSaturation(parseColour(colour))
  return (hue >= 345 || hue <= 15) && saturation > 0.4
}
// Compare design text with token text: colours to 8-bit, numbers and quotes
// to one spelling.
const normalise = (text: string) =>
  text
    .replace(COLOUR, (c) => {
      const [r, g, b, a] = parseColour(c)
      return `${hexOf([r, g, b])}/${digits(a, 3)}`
    })
    .replace(/'/g, '"')
    .replace(/(^|[^\d])\.(\d)/g, (_, before: string, digit: string) => `${before}0.${digit}`)
    .replace(/\s*,\s*/g, ',')
    .trim()

const opaque = (state: State, name: string): Rgba => {
  const colour = parseColour(value(state, name))
  if (colour[3] !== 1) throw new Error(`${name} is translucent in ${label(state)}`)
  return colour
}
const ratio = (state: State, fg: string, bg: string) =>
  contrast(opaque(state, fg), opaque(state, bg))
const spalt = (theme: Theme): State => ({ palette: 'spalt', theme })

describe('Ljusbord tokens (LJ-01)', () => {
  it('keeps every custom property on the Folio root, in flat rules', () => {
    for (const file of ['./tokens.css', './palette.css'])
      expect(uncomment(read(file)), file).not.toMatch(/@/)
    const stray = RULES.filter((rule) => rule.decls.length && !ROOT.test(rule.selector))
    expect(stray.map((rule) => `${rule.file}: ${rule.selector}`)).toEqual([])
  })

  it('declares every Ljusbord token on the root, with a dark value for each themed one', () => {
    const base = RULES.find((rule) => rule.selector === '[data-folio]')
    const dark = RULES.find((rule) => rule.selector === "[data-folio][data-theme='dark']")
    const names = (rule?: Rule) => new Set(rule?.decls.map(([name]) => name))
    expect(LJUSBORD.filter((name) => !names(base).has(name))).toEqual([])
    const themed = [
      ...Object.keys(SYSTEM.dark),
      ...SECTIONS.flatMap((s) => [`--fa-sec-${s}-ink`, `--fa-sec-${s}-soft`]),
      ...Object.keys(SYSTEM_REST.dark),
    ]
    expect(themed.filter((name) => !names(dark).has(name))).toEqual([])
  })

  it.each(THEMES)('makes Spalt r6/A/system.css exactly (%s)', (theme) => {
    const state = spalt(theme)
    const colours: Record<string, string> = { ...SYSTEM[theme] }
    for (const [role, source] of Object.entries(SYSTEM_ROLES)) colours[role] = sys(theme, source)
    const declared = Object.fromEntries(Object.keys(colours).map((n) => [n, value(state, n)]))
    expect(declared).toEqual(
      Object.fromEntries(Object.entries(colours).map(([n, hex]) => [n, oklchOfHex(hex)])),
    )
    for (const [name, hex] of Object.entries(colours))
      expect(hexOf(parseColour(declared[name])), name).toBe(hex)
    const rest = { ...SYSTEM_REST.shared, ...SYSTEM_REST[theme] }
    expect(
      Object.fromEntries(Object.keys(rest).map((n) => [n, normalise(value(state, n))])),
    ).toEqual(Object.fromEntries(Object.entries(rest).map(([n, text]) => [n, normalise(text)])))
    // With no palette chosen the root is Spalt too.
    const none: State = { palette: null, theme }
    for (const name of LJUSBORD) expect(value(none, name), name).toBe(value(state, name))
  })

  it.each(
    THEMES,
  )('precomputes each section -ink and -soft from the design colour-mix (%s)', (theme) => {
    const mixk = toOklab(parseColour(sys(theme, '--fa-mixk')))
    const declared: Record<string, string> = {}
    const expected: Record<string, string> = {}
    for (const s of SECTIONS) {
      const c = toOklab(parseColour(sys(theme, `--fa-sec-${s}`)))
      // color-mix(in oklab, var(--c) 76%, var(--mixk)) and (… 11%, transparent)
      expected[`--fa-sec-${s}-ink`] = oklchText(c.map((v, i) => 0.76 * v + 0.24 * mixk[i]))
      expected[`--fa-sec-${s}-soft`] = oklchText(c, 0.11)
      for (const name of [`--fa-sec-${s}-ink`, `--fa-sec-${s}-soft`])
        declared[name] = value(spalt(theme), name)
    }
    expect(declared).toEqual(expected)
  })

  it.each(
    STATES.map((state) => [label(state), state] as const),
  )('reads ink, ink-2, ink-3 and every section -ink at 4.5:1 on the sheet and the table (%s)', (_, state) => {
    const text = [
      '--fa-ink',
      '--fa-ink-2',
      '--fa-ink-3',
      ...SECTIONS.map((s) => `--fa-sec-${s}-ink`),
    ]
    const low = text.flatMap((fg) =>
      ['--fa-sheet', '--fa-table']
        .map((bg) => [fg, bg, ratio(state, fg, bg)] as const)
        .filter(([, , r]) => r < 4.5)
        .map(([f, b, r]) => `${f} on ${b}: ${r.toFixed(2)}`),
    )
    expect(low).toEqual([])
  })

  it.each(
    STATES.map((state) => [label(state), state] as const),
  )('keeps the focus ring at 3:1 on the sheet (%s)', (_, state) => {
    expect(ratio(state, '--fa-ring', '--fa-sheet')).toBeGreaterThanOrEqual(3)
  })

  // line-2 is decorative: ghost-button borders, link underlines, key caps and
  // hover borders, all on controls their text already names, so WCAG 1.4.11
  // asks no 3:1 of it (coordinator decision 2026-11-04; the approved design
  // draws it at 1.77:1 light and 1.66:1 dark). Hold a floor so it stays visible.
  it.each(
    STATES.map((state) => [label(state), state] as const),
  )('keeps decorative line-2 visible on the sheet (%s)', (_, state) => {
    expect(ratio(state, '--fa-line-2', '--fa-sheet')).toBeGreaterThanOrEqual(1.5)
  })

  it('has no red: no colour in a token sits at 345°–15° above 40 % saturation', () => {
    const red = ['./tokens.css', './palette.css'].flatMap((file) =>
      [...uncomment(read(file)).matchAll(COLOUR)]
        .map(([colour]) => colour)
        .filter(isRed)
        .map((colour) => `${file}: ${colour}`),
    )
    expect(red).toEqual([])
  })

  it.each([
    ['#D32F2F', true],
    ['rgb(200, 40, 60)', true],
    ['oklch(60% 0.2 25)', true],
    // A blush white is still a red hue, which is why Ros leans to pink.
    ['#FBF3F2', true],
    ['#9A6300', false],
    ['#7E6146', false],
    ['#8E4594', false],
    ['oklch(94.65% 0.01 350)', false],
  ])('tells a red from the design colours: %s', (colour, red) => {
    expect(isRed(colour)).toBe(red)
  })

  it('measures contrast as WCAG does', () => {
    expect(contrast(parseColour('#000000'), parseColour('#FFFFFF'))).toBeCloseTo(21, 5)
    expect(contrast(parseColour('#767676'), parseColour('#FFFFFF'))).toBeCloseTo(4.54, 2)
  })

  it.each(
    STATES.map((state) => [label(state), state] as const),
  )('resolves every Folio+ name, each alias to its Ljusbord token (%s)', (_, state) => {
    for (const name of KEPT) expect(value(state, name), name).not.toMatch(/var\(/)
    const drift = Object.entries(ALIASES)
      .filter(([old, target]) => value(state, old) !== value(state, target))
      .map(([old, target]) => `${old} ≠ ${target}`)
    expect(drift).toEqual([])
  })

  it('lets a palette move only the ground, the sheets and the go accent, in both themes', () => {
    const blocks = RULES.filter((rule) => rule.file === './palette.css')
    const selectors = PALETTES.flatMap((p) => [
      `[data-folio][data-palette='${p}']`,
      `[data-folio][data-palette='${p}'][data-theme='dark']`,
    ])
    expect(blocks.map((rule) => rule.selector)).toEqual(selectors)
    for (const [i, p] of PALETTES.entries()) {
      const names = (rule?: Rule) => (rule?.decls.map(([name]) => name) ?? []).sort()
      const light = names(blocks[2 * i])
      expect(
        light.filter((name) => !PALETTE_TOKENS.includes(name)),
        p,
      ).toEqual([])
      // A light palette rule weighs as much as the dark base and loads after
      // it, so the dark block must restate every token the light one sets.
      expect(names(blocks[2 * i + 1]), `${p} dark`).toEqual(light)
    }
  })
})

describe('Ljusbord fonts (LJ-01)', () => {
  const FACES = {
    'Atkinson Hyperlegible Next normal': 'AtkinsonHyperlegibleNext-Variable.woff2',
    'Atkinson Hyperlegible Next italic': 'AtkinsonHyperlegibleNext-Italic-Variable.woff2',
    'Atkinson Hyperlegible Mono normal': 'AtkinsonHyperlegibleMono-Variable.woff2',
    'Schibsted Grotesk normal': 'SchibstedGrotesk-Variable.woff2',
    'Ljus Siffror normal': 'SchibstedGrotesk-Variable.woff2',
  }

  it('self-hosts every face, with the digits from Schibsted Grotesk', () => {
    const css = uncomment(read('./fonts.css'))
    expect(css).not.toMatch(/https?:|googleapis|gstatic|@import/)
    const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(([, body]) => {
      const prop = (name: string) =>
        body.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+)`))?.[1].trim()
      return {
        face: `${prop('font-family')?.replace(/['"]/g, '')} ${prop('font-style') ?? 'normal'}`,
        file: prop('src')?.match(
          /^url\('\/fonts\/folio\/([\w-]+\.woff2)'\) format\('woff2'\)$/,
        )?.[1],
        display: prop('font-display'),
        range: prop('unicode-range'),
      }
    })
    expect(Object.fromEntries(faces.map(({ face, file }) => [face, file]))).toEqual(FACES)
    expect(faces.every(({ display }) => display === 'swap')).toBe(true)
    // Numbers get Schibsted's plain zero; letters stay Atkinson (r6/A/system.css).
    expect(Object.fromEntries(faces.map(({ face, range }) => [face, range ?? null]))).toEqual({
      ...Object.fromEntries(Object.keys(FACES).map((face) => [face, null])),
      'Ljus Siffror normal': 'U+0030-0039',
    })
    for (const file of new Set(Object.values(FACES)))
      expect(
        readFileSync(path(`../../../public/fonts/folio/${file}`))
          .subarray(0, 4)
          .toString('latin1'),
        file,
      ).toBe('wOF2')
  })

  describe('useFolioFonts', () => {
    afterEach(() => {
      Reflect.deleteProperty(document, 'fonts')
    })

    it('warms the self-hosted faces and adds no Google stylesheet', () => {
      const load = vi.fn((_font: string) => Promise.resolve([] as FontFace[]))
      Object.defineProperty(document, 'fonts', { configurable: true, value: { load } })
      const head = document.head.innerHTML
      renderHook(() => useFolioFonts())
      expect(document.head.innerHTML).toBe(head)
      expect(load.mock.calls.map(([font]) => font)).toEqual([
        '1em "Atkinson Hyperlegible Next"',
        'italic 1em "Atkinson Hyperlegible Next"',
        '1em "Atkinson Hyperlegible Mono"',
        '1em "Schibsted Grotesk"',
      ])
    })

    it('does nothing where the font loading API is missing', () => {
      const head = document.head.innerHTML
      expect(() => renderHook(() => useFolioFonts())).not.toThrow()
      expect(document.head.innerHTML).toBe(head)
    })
  })
})
