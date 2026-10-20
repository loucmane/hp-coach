// The bake-off's shared contract (kit v2, bead hpf-qr0p.7; docs/redesign/kit-v2.md):
// the rd-* test ids every direction carries, screen by screen, and
// describeDirectionContract — one reusable suite that drives them, for the
// screens a direction declares (DirectionMeta.screens) at both widths.
//
// Test-only: it imports vitest and Testing Library, so only *.test.tsx
// files import it, never a stage.
//
//   describeDirectionContract(meta, Folio)
//
// Screens 1–4 keep round 1's checks except the theme switch's. Screens
// 5–14 check what docs/redesign/kit-v2.md asks each to show, through the
// ids below and the actions a screen requests (useDirectionData().actions,
// spied here): the suite mounts the direction inside a
// DirectionDataProvider fed by the fixtures, on a stage with one theme.
// A theme switch (4, and Konto's mode on 13) is checked by the theme the
// stage then shows, whichever of onTheme, actions.setTheme or
// actions.setPrefs({ mode }) the direction took: all three reach it.

import { fireEvent, render, screen, within } from '@testing-library/react'
import { type ComponentType, createElement, useMemo, useState } from 'react'
import { beforeAll, describe, expect, it, type Mock, vi } from 'vitest'

import {
  DirectionDataProvider,
  FIXTURE_DATA,
  useSessionPrefs,
  withPrefs,
} from '@/components/devbake/redesign/directionData'
import { screensOf } from '@/components/devbake/redesign/directions'
import { LOCAL_CONTROLLER } from '@/components/devbake/redesign/drillCore'
import {
  ESTIMATE_CAVEAT,
  EXPLANATIONS,
  OVNINGSTEXT_NOTE,
  UNIT,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type AppScreenKey,
  DESTINATIONS,
  type DirectionMeta,
  type DirectionProps,
  type ThemeKey,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import type { Section } from '@/data/questions'

// ── The ids ──────────────────────────────────────────────────────────

/** A section code in an id: lower-case ASCII ('LÄS' → 'las'). */
export function sectionSlug(section: Section): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

/** A pass id in an id: 'host-2025:kvant1' → 'host-2025-kvant1'. */
export function passSlug(passId: string): string {
  return passId.replace(':', '-')
}

export type ScreenContract = {
  /** What the screen must show (docs/redesign/kit-v2.md has the long form). */
  shows: string
  /** The test ids it carries. <riktning> the direction's name (rd-folio),
   *  <dest> a destination id, <n> a 1-based number, <L> an option letter,
   *  <sektion> a sectionSlug, <pass> a passSlug, <id> a view-model id. */
  ids: string[]
  /** A drill in focus mode: Avsluta (rd-exit) instead of the menu. */
  focus: boolean
}

const NAV = ['rd-nav-<dest>', 'rd-account']
const VERDICT = [
  'rd-lock',
  'rd-verdict',
  'rd-next',
  'rd-exit',
  'rd-step-<n>',
  'rd-step-toggle-<n>',
  'rd-technique',
  'rd-pitfall',
  'rd-distractor-<L>',
]

export const CONTRACT: Record<AppScreenKey, ScreenContract> = {
  1: {
    focus: false,
    shows: 'Home mid-journey: one resume action, the plan, the prognosis with its caveat.',
    ids: ['rd-<riktning>', 'rd-resume', ...NAV],
  },
  2: {
    focus: true,
    shows: 'The LÄS drill: ÖVNINGSTEXT outside the passage, numbered paragraphs, A–D.',
    ids: [
      'rd-exit',
      'rd-badge',
      'rd-note-toggle',
      'rd-note',
      'rd-passage',
      'rd-para-<n>',
      'rd-option-<L>',
      'rd-eliminate-<L>',
      'rd-lock',
      'rd-sheet (phone, data-state peek|open|full)',
    ],
  },
  3: {
    focus: true,
    shows: 'Feedback: the verdict (data-correct), steps on demand, every distractor, ¶ links.',
    ids: [...VERDICT, 'rd-cite-<n>'],
  },
  4: {
    focus: false,
    shows: 'The menu in its other state, the account menu open with a theme switch.',
    ids: [...NAV, 'rd-account-menu', 'rd-theme-toggle', 'rd-collapse (desktop)'],
  },
  5: {
    focus: false,
    shows: 'Öva: the eight sections with their waiting misses, Repetera, a mixed drill.',
    ids: [...NAV, 'rd-ova-section-<sektion>', 'rd-ova-repetera', 'rd-ova-mixed'],
  },
  6: {
    focus: true,
    shows: 'The quant drill: XYZ math rendered, KVA’s four fixed options, NOG’s five.',
    ids: ['rd-quant-prompt', 'rd-quant-option-<L>', ...VERDICT],
  },
  7: {
    focus: true,
    shows: 'The DTK drill: the figure with its alt text beside the question.',
    ids: ['rd-figure', 'rd-quant-prompt', 'rd-quant-option-<L>', ...VERDICT],
  },
  8: {
    focus: false,
    shows: 'Repetera: the due misses first, then today’s pile, and one start.',
    ids: [...NAV, 'rd-repetera-item-<n>', 'rd-repetera-start'],
  },
  9: {
    focus: false,
    shows: 'Provpass: both halves, the passes with what was seen, then a running pass.',
    ids: [
      ...NAV,
      'rd-prov-half-<verbal|kvant>',
      'rd-prov-pass-<pass>',
      'rd-prov-start',
      'rd-prov-running',
      'rd-prov-timer',
      'rd-prov-grid',
      'rd-prov-cell-<n> (data-answered, data-current)',
      'rd-prov-flag',
      'rd-prov-submit',
    ],
  },
  10: {
    focus: false,
    shows: 'The handed-in pass: the score and its basis, each section, earlier passes.',
    ids: [
      ...NAV,
      'rd-prov-result',
      'rd-prov-score',
      'rd-prov-section-<sektion>',
      'rd-prov-history',
      'rd-prov-history-item-<n>',
    ],
  },
  11: {
    focus: false,
    shows: 'Framsteg: the prognosis with its caveat, the eight sections, the week, Historik.',
    ids: [
      ...NAV,
      'rd-framsteg-prognosis',
      'rd-framsteg-section-<sektion>',
      'rd-framsteg-week',
      'rd-framsteg-history',
      'rd-framsteg-history-item-<n>',
    ],
  },
  12: {
    focus: false,
    shows: 'Uppslag: the frameworks per section, the open lesson, read and practise.',
    ids: [
      ...NAV,
      'rd-uppslag-section-<sektion>',
      'rd-uppslag-entry-<id>',
      'rd-lesson',
      'rd-lesson-read',
      'rd-lesson-practice',
    ],
  },
  13: {
    focus: false,
    shows: 'Konto: identity, every preference, export, and a delete that asks first.',
    ids: [
      ...NAV,
      'rd-konto-identity',
      'rd-konto-mode-<light|dark>',
      'rd-konto-palette-<id>',
      'rd-konto-font-<id>',
      'rd-konto-density-<id>',
      'rd-konto-coach-<id>',
      'rd-konto-export',
      'rd-konto-delete',
      'rd-konto-delete-confirm',
      'rd-konto-signout',
    ],
  },
  14: {
    focus: true,
    shows: 'The ELF drill: the English passage (lang="en"), ÖVNINGSTEXT outside it, A–D.',
    ids: [
      'rd-exit',
      'rd-badge',
      'rd-note-toggle',
      'rd-note',
      'rd-elf-passage',
      'rd-para-<n>',
      'rd-option-<L>',
      'rd-lock',
      'rd-verdict',
    ],
  },
}

// ── Mounting ─────────────────────────────────────────────────────────

/** Who is under contract: a registry entry, or any component with a root
 *  test id (the kit's own reference direction). */
export type ContractSubject = {
  name: string
  root: string
  screens: readonly AppScreenKey[]
  /** What the direction's spec leaves out (DirectionMeta.omits). */
  omits?: DirectionMeta['omits']
}

function subjectOf(meta: DirectionMeta | ContractSubject): ContractSubject {
  if ('root' in meta) return meta
  return {
    name: meta.name,
    root: `rd-${meta.slug.slice(2)}`,
    screens: screensOf(meta),
    omits: meta.omits,
  }
}

type ThemeActions = Pick<DirectionActions, 'setTheme' | 'setPrefs'>

/** Actions that record their calls; the drill still grades. `theme` is
 *  what setTheme and setPrefs do besides (the stage's one theme). */
export function spyActions(theme?: ThemeActions): DirectionActions {
  return {
    go: vi.fn(),
    resume: vi.fn(),
    openPlanItem: vi.fn(),
    startDrill: vi.fn(),
    openRepetera: vi.fn(),
    openLesson: vi.fn(),
    toggleLessonRead: vi.fn(),
    openKonto: vi.fn(),
    startProvpass: vi.fn(),
    submitProvpass: vi.fn(),
    openProvResult: vi.fn(),
    setTheme: vi.fn(theme?.setTheme),
    setPrefs: vi.fn(theme?.setPrefs),
    exportData: vi.fn(),
    deleteAccount: vi.fn(),
    signOut: vi.fn(),
    drill: {
      pick: vi.fn(),
      lock: vi.fn(LOCAL_CONTROLLER.lock),
      next: vi.fn(),
      exit: vi.fn(),
    },
  }
}

/** What the contract's stage shows now: its one theme, and the data its
 *  provider serves (prefs.mode is that theme). */
export type ContractStage = { theme: ThemeKey; data: DirectionData }

/** The stage's theme, bound to the mounted stage once it renders. */
type StageLink = ThemeActions & { shown: ContractStage }

/**
 * The contract's stage: the fixtures, with ONE theme on display that the
 * direction's `onTheme` and its context's `setTheme` and
 * `setPrefs({ mode })` all reach — useSessionPrefs, as in the bake-off.
 */
function ContractStageHost({
  Component,
  screen: s,
  width,
  initialTheme,
  link,
  onScreen,
  onTheme,
  actions,
}: {
  Component: ComponentType<DirectionProps>
  screen: AppScreenKey
  width: WidthKey
  initialTheme: ThemeKey
  link: StageLink
  onScreen: DirectionProps['onScreen']
  onTheme: DirectionProps['onTheme']
  actions: DirectionActions
}) {
  const [theme, setTheme] = useState(initialTheme)
  const session = useSessionPrefs({ theme, onTheme: setTheme })
  const data = useMemo(() => withPrefs(FIXTURE_DATA, session.prefs), [session.prefs])
  link.setTheme = session.setTheme
  link.setPrefs = session.setPrefs
  link.shown = { theme, data }
  return createElement(
    DirectionDataProvider,
    { data, actions },
    createElement(Component, { screen: s, width, theme, live: true, onScreen, onTheme }),
  )
}

/**
 * Mounts a direction the way the stage does: inside a provider with spied
 * actions, on a stage with one theme (`theme` to start). `onTheme`,
 * `actions.setTheme` and `actions.setPrefs({ mode })` are spies that also
 * change that theme; `stage()` reads back what it shows. `goTo` is what
 * the stage does when a direction asks for a screen (the theme stays).
 */
export function mountDirection(
  Component: ComponentType<DirectionProps>,
  screenKey: AppScreenKey,
  width: WidthKey,
  theme: ThemeKey = 'light',
): {
  onScreen: Mock<DirectionProps['onScreen']>
  onTheme: Mock<DirectionProps['onTheme']>
  actions: DirectionActions
  goTo: (s: AppScreenKey) => void
  stage: () => ContractStage
} {
  const link: StageLink = {
    setTheme: () => {},
    setPrefs: () => {},
    shown: { theme, data: FIXTURE_DATA },
  }
  const onScreen = vi.fn<DirectionProps['onScreen']>()
  const onTheme = vi.fn<DirectionProps['onTheme']>((t) => link.setTheme(t))
  const actions = spyActions({
    setTheme: (t) => link.setTheme(t),
    setPrefs: (patch) => link.setPrefs(patch),
  })
  const tree = (s: AppScreenKey) =>
    createElement(ContractStageHost, {
      Component,
      screen: s,
      width,
      initialTheme: theme,
      link,
      onScreen,
      onTheme,
      actions,
    })
  const utils = render(tree(screenKey))
  return {
    onScreen,
    onTheme,
    actions,
    goTo: (s: AppScreenKey) => utils.rerender(tree(s)),
    stage: () => link.shown,
  }
}

/** jsdom has no layout: give the scroll and resize APIs inert stand-ins,
 *  and the native dialog methods it lacks (showModal and close only toggle
 *  `open`). */
export function stubLayout(): void {
  Element.prototype.scrollTo ??= () => {}
  Element.prototype.scrollIntoView ??= () => {}
  HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
    this.open = true
  }
  HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
    this.open = false
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

/** A phone sheet starts at its peek: open it if `testId` is not on screen
 *  yet (the first collapsed toggle inside rd-sheet). */
export function reveal(testId: string): HTMLElement {
  const now = screen.queryByTestId(testId)
  if (now) return now
  const sheet = screen.queryByTestId('rd-sheet')
  const toggle = sheet?.querySelector<HTMLElement>('[aria-expanded="false"]')
  if (!toggle) throw new Error(`${testId} is not on screen and there is no sheet to open`)
  fireEvent.click(toggle)
  return screen.getByTestId(testId)
}

export function visible(el: HTMLElement | null): boolean {
  return el != null && !el.hidden && el.closest('[hidden]') == null
}

function expectNav(): void {
  for (const d of DESTINATIONS) expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
  expect(screen.getByTestId('rd-account')).toBeInTheDocument()
}

/** The stage shows `theme`: its one theme, the direction's root and
 *  prefs.mode in the data agree on it. */
function expectTheme(root: string, stage: () => ContractStage, theme: ThemeKey): void {
  expect(stage().theme).toBe(theme)
  expect(stage().data.konto.prefs.mode).toBe(theme)
  expect(screen.getByTestId(root)).toHaveAttribute('data-theme', theme)
}

/** Math is rendered, never shown raw: no U+E000/U+E001 markers and no
 *  LaTeX commands in the element's text. */
/** The bank's math markers, U+E000 and U+E001, built from their codes so no
 *  editor can strip a private-use character from this file. */
const MATH_MARKERS = new RegExp(`[${String.fromCharCode(0xe000, 0xe001)}]`)

function expectRenderedMath(el: HTMLElement): void {
  expect(el.textContent).not.toMatch(MATH_MARKERS)
  expect(el.textContent).not.toMatch(/\\(?:frac|dfrac|tfrac|sqrt|cdot)/)
}

/** jsdom never loads images: fire `load` on every image on screen, so a
 *  direction that keeps a figure question unanswerable until its figure
 *  has loaded can be answered in a test. Harmless for the others. */
export function loadImages(): void {
  for (const img of Array.from(document.querySelectorAll('img'))) fireEvent.load(img)
}

/** Presses `testId`; if the direction guards that step with a confirmation
 *  (its accept button is `rd-confirm`), checks that `action` has not run
 *  yet and accepts it. Then `action` must have run. */
function pressThroughGate(testId: string, action: Mock): void {
  fireEvent.click(screen.getByTestId(testId))
  const accept = screen.queryByTestId('rd-confirm')
  if (accept) {
    expect(action).not.toHaveBeenCalled()
    fireEvent.click(accept)
  }
  expect(action).toHaveBeenCalled()
}

/** Locks `letter` on the current quant question (rd-quant-option-<L>),
 *  after its figures have "loaded". */
function lockQuant(letter: string): void {
  loadImages()
  const option = reveal(`rd-quant-option-${letter}`)
  loadImages() // a phone sheet may have just mounted option figures
  fireEvent.click(option)
  fireEvent.click(screen.getByTestId('rd-lock'))
}

// ── The suite ────────────────────────────────────────────────────────

/**
 * The shared contract for one direction: every screen it declares, at both
 * widths. Checks only declared screens, so a direction adopts screens 5–14
 * one by one by adding them to its meta.ts.
 */
export function describeDirectionContract(
  meta: DirectionMeta | ContractSubject,
  Component: ComponentType<DirectionProps>,
  options: { widths?: readonly WidthKey[] } = {},
): void {
  const subject = subjectOf(meta)
  const has = (s: AppScreenKey) => subject.screens.includes(s)
  const widths = options.widths ?? (['desktop', 'phone'] as const)
  const D = FIXTURE_DATA

  describe(`${subject.name}: the shared rd-* contract`, () => {
    beforeAll(stubLayout)

    describe.each(widths)('%s', (width) => {
      const mount = (s: AppScreenKey, theme: ThemeKey = 'light') =>
        mountDirection(Component, s, width, theme)

      it.each(
        subject.screens.flatMap((s) => (['light', 'dark'] as const).map((t) => [s, t])),
      )('renders screen %s in %s with its root', (s, t) => {
        mount(s as AppScreenKey, t as ThemeKey)
        const root = screen.getByTestId(subject.root)
        expect(root).toHaveAttribute('data-theme', t)
        expect(root).toHaveAttribute('data-width', width)
        expect(root).toHaveAttribute('lang', 'sv')
        if (CONTRACT[s as AppScreenKey].focus) {
          expect(screen.getAllByTestId('rd-exit').length).toBeGreaterThan(0)
        }
      })

      // ── Round 1 ──

      const Q3 = UNIT.questions[2]
      const Q4 = UNIT.questions[3]
      const E3 = EXPLANATIONS[Q3.qid]
      const DETAIL = (E3.steps ?? []).find((s) => s.tier === 'detail')

      if (has(1)) {
        it('Idag: one resume action, the five destinations, the account entry and the caveat', () => {
          const { onScreen } = mount(1)
          expect(screen.getByTestId(subject.root)).toBeInTheDocument()
          expectNav()
          expect(screen.getAllByText(ESTIMATE_CAVEAT).length).toBeGreaterThan(0)
          expect(screen.getAllByTestId('rd-resume')).toHaveLength(1)
          fireEvent.click(screen.getByTestId('rd-resume'))
          expect(onScreen).toHaveBeenCalledWith(2)
        })
      }

      if (has(2)) {
        it('Läsfråga: the badge outside the passage, nine numbered paragraphs, the note on demand', () => {
          mount(2)
          const passage = screen.getByTestId('rd-passage')
          const badge = screen.getByTestId('rd-badge')
          expect(badge).toHaveTextContent(/övningstext/i)
          expect(passage).not.toContainElement(badge)
          for (let n = 1; n <= 9; n++)
            expect(screen.getByTestId(`rd-para-${n}`)).toBeInTheDocument()
          expect(screen.queryByRole('dialog')).toBeNull()
          expect(visible(screen.queryByTestId('rd-note'))).toBe(false)
          fireEvent.click(screen.getByTestId('rd-note-toggle'))
          expect(screen.getByTestId('rd-note')).toHaveTextContent(OVNINGSTEXT_NOTE)
          expect(visible(screen.getByTestId('rd-note'))).toBe(true)
          if (width === 'phone') {
            expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', 'peek')
          }
        })

        it('Läsfråga: Avsluta leaves the drill for Idag', () => {
          const { onScreen } = mount(2)
          fireEvent.click(screen.getByTestId('rd-exit'))
          expect(onScreen).toHaveBeenCalledWith(1)
        })
      }

      if (has(2) && has(3)) {
        it('Läsfråga: choosing, striking and answering grades the question', () => {
          const { onScreen, goTo } = mount(2)
          reveal('rd-option-A')
          for (const l of ['A', 'B', 'C', 'D']) {
            expect(screen.getByTestId(`rd-option-${l}`)).toBeInTheDocument()
          }
          fireEvent.click(screen.getByTestId('rd-eliminate-B'))
          expect(screen.getByTestId('rd-eliminate-B')).toHaveAttribute('aria-pressed', 'true')
          fireEvent.click(screen.getByTestId('rd-option-A'))
          fireEvent.click(screen.getByTestId('rd-lock'))
          expect(onScreen).toHaveBeenCalledWith(3)
          goTo(3)
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
        })

        it('Facit: Nästa moves on to question 4', () => {
          const { onScreen, goTo } = mount(3)
          fireEvent.click(screen.getByTestId('rd-next'))
          expect(onScreen).toHaveBeenCalledWith(2)
          goTo(2)
          expect(screen.getAllByText(Q4.prompt).length).toBeGreaterThan(0)
        })
      }

      if (has(3)) {
        it('Facit: verdict, a detail step on demand, technique, pitfall, distractors and ¶ links', () => {
          if (!DETAIL) throw new Error('fixture question 3 must have a detail-tier step')
          mount(3)
          const verdict = screen.getByTestId('rd-verdict')
          expect(verdict).toHaveAttribute('data-correct', 'false')
          expect(verdict).toHaveTextContent(Q3.answer)
          expect(screen.getByTestId(`rd-step-${DETAIL.n}`)).toBeInTheDocument()
          expect(screen.queryByText(DETAIL.text)).toBeNull()
          fireEvent.click(screen.getByTestId(`rd-step-toggle-${DETAIL.n}`))
          expect(screen.getByText(DETAIL.text)).toBeInTheDocument()
          expect(screen.getByTestId('rd-technique')).toHaveTextContent(E3.technique)
          expect(screen.getByTestId('rd-pitfall')).toHaveTextContent(E3.pitfall ?? '')
          for (const d of E3.distractors) {
            expect(screen.getByTestId(`rd-distractor-${d.letter}`)).toBeInTheDocument()
          }
          // The picked distractor's reasons are shown without a click.
          const picked = within(screen.getByTestId('rd-distractor-A'))
          expect(picked.getByText(E3.distractors[0].why_tempting)).toBeInTheDocument()
          expect(screen.getAllByTestId('rd-cite-6').length).toBeGreaterThan(0)
        })
      }

      if (has(4)) {
        it('Navigering: the account menu is open and switches the theme', () => {
          const { stage } = mount(4)
          expect(screen.getByTestId('rd-account-menu')).toBeInTheDocument()
          for (const d of DESTINATIONS) {
            expect(screen.getByTestId(`rd-nav-${d.id}`)).toBeInTheDocument()
          }
          fireEvent.click(screen.getByTestId('rd-theme-toggle'))
          expectTheme(subject.root, stage, 'dark')
        })
      }

      // ── Round 2 ──

      if (has(5)) {
        it('Öva: the eight sections with their waiting misses, Repetera and a mixed drill', () => {
          const { actions } = mount(5)
          expectNav()
          for (const s of D.ova.sections) {
            const el = screen.getByTestId(`rd-ova-section-${sectionSlug(s.section)}`)
            if (s.waiting > 0) expect(el).toHaveTextContent(String(s.waiting))
          }
          fireEvent.click(screen.getByTestId('rd-ova-section-kva'))
          expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'section', section: 'KVA' })
          const repetera = screen.getByTestId('rd-ova-repetera')
          expect(repetera).toHaveTextContent(String(D.ova.repetera.dueNow))
          fireEvent.click(repetera)
          expect(actions.openRepetera).toHaveBeenCalled()
          fireEvent.click(screen.getByTestId('rd-ova-mixed'))
          expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'mixed' })
        })
      }

      if (has(6)) {
        it('Kvantfråga: XYZ math rendered, KVA’s fixed options, NOG’s five, graded by the controller', () => {
          const { actions } = mount(6)
          const [xyz, kva, nog] = D.drills.quant.questions
          expect(screen.getAllByTestId('rd-exit').length).toBeGreaterThan(0)
          expectRenderedMath(screen.getByTestId('rd-quant-prompt'))
          for (const o of xyz.options ?? []) reveal(`rd-quant-option-${o.letter}`)
          expect(screen.queryByTestId('rd-quant-option-E')).toBeNull()
          const wrong = (xyz.options ?? []).find((o) => o.letter !== xyz.answer)?.letter ?? 'A'
          lockQuant(wrong)
          expect(actions.drill.lock).toHaveBeenCalledWith(
            expect.objectContaining({ qid: xyz.qid }),
            wrong,
          )
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
          expect(screen.getByTestId('rd-verdict')).toHaveTextContent(xyz.answer)
          const ex = D.drills.quant.explanations[xyz.qid]
          if (ex) {
            expectRenderedMath(screen.getByTestId('rd-technique'))
            expect(screen.getByTestId('rd-pitfall')).toBeInTheDocument()
            for (const d of ex.distractors) {
              expect(screen.getByTestId(`rd-distractor-${d.letter}`)).toBeInTheDocument()
            }
          }
          fireEvent.click(screen.getByTestId('rd-next'))
          for (const o of kva.options ?? []) {
            expect(reveal(`rd-quant-option-${o.letter}`)).toHaveTextContent(o.text)
          }
          lockQuant(kva.answer)
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
          fireEvent.click(screen.getByTestId('rd-next'))
          for (const o of nog.options ?? []) reveal(`rd-quant-option-${o.letter}`)
          expect(screen.getByTestId('rd-quant-option-E')).toBeInTheDocument()
          fireEvent.click(screen.getAllByTestId('rd-exit')[0])
          expect(actions.drill.exit).toHaveBeenCalled()
        })
      }

      if (has(7)) {
        it('DTK: the figure with its alt text beside the question, graded', () => {
          mount(7)
          const [q] = D.drills.dtk.questions
          const figure = screen.getByTestId('rd-figure')
          const img = within(figure).getByRole('img', { name: q.figure?.alt })
          if (img.tagName === 'IMG') {
            expect(img.getAttribute('src')).toContain(q.figure?.src ?? '')
          }
          for (const o of q.options ?? []) reveal(`rd-quant-option-${o.letter}`)
          lockQuant(q.answer)
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
          expect(screen.getAllByTestId('rd-exit').length).toBeGreaterThan(0)
        })
      }

      if (has(8)) {
        it('Repetera: the due misses first, each in its place, and one start', () => {
          const { actions } = mount(8)
          expectNav()
          for (const item of D.repetera.items.slice(0, D.repetera.dueNow)) {
            expect(screen.getByTestId(`rd-repetera-item-${item.n}`)).toHaveTextContent(item.section)
          }
          expect(screen.getAllByTestId('rd-repetera-start')).toHaveLength(1)
          fireEvent.click(screen.getByTestId('rd-repetera-start'))
          expect(actions.startDrill).toHaveBeenCalledWith({ kind: 'repetition' })
        })
      }

      if (has(9)) {
        it('Provpass: both halves, the passes with what was seen, then the running pass', () => {
          const { actions } = mount(9)
          expectNav()
          expect(screen.getByTestId('rd-prov-half-verbal')).toBeInTheDocument()
          expect(screen.getByTestId('rd-prov-half-kvant')).toBeInTheDocument()
          const { hub, running } = D.provpass
          const suggested = hub.passes.find((p) => p.suggested && p.half === hub.half)
          if (!suggested) throw new Error('the hub has no suggested pass for its half')
          expect(screen.getByTestId(`rd-prov-pass-${passSlug(suggested.id)}`)).toHaveTextContent(
            String(suggested.seenBefore),
          )
          pressThroughGate('rd-prov-start', vi.mocked(actions.startProvpass))
          expect(actions.startProvpass).toHaveBeenCalledWith(running.passId)
          expect(screen.getByTestId('rd-prov-running')).toBeInTheDocument()
          expect(screen.getByTestId('rd-prov-timer')).toHaveTextContent('31:12')
          const grid = screen.getByTestId('rd-prov-grid')
          for (const cell of running.grid) {
            const el = within(grid).getByTestId(`rd-prov-cell-${cell.n}`)
            expect(el).toHaveAttribute('data-answered', String(cell.answered))
          }
          expect(within(grid).getByTestId(`rd-prov-cell-${running.current + 1}`)).toHaveAttribute(
            'data-current',
            'true',
          )
          const flag = screen.getByTestId('rd-prov-flag')
          const before = flag.getAttribute('aria-pressed')
          fireEvent.click(flag)
          expect(screen.getByTestId('rd-prov-flag')).not.toHaveAttribute('aria-pressed', before)
          pressThroughGate('rd-prov-submit', vi.mocked(actions.submitProvpass))
        })
      }

      if (has(10)) {
        it('Provpassresultat: the score and its basis, each section, earlier passes', () => {
          mount(10)
          expectNav()
          const r = D.provpass.result
          expect(screen.getByTestId('rd-prov-result')).toHaveTextContent(String(r.correct))
          expect(screen.getByTestId('rd-prov-score')).toBeInTheDocument()
          for (const s of r.sections) {
            expect(
              screen.getByTestId(`rd-prov-section-${sectionSlug(s.section)}`),
            ).toHaveTextContent(String(s.correct))
          }
          const history = screen.getByTestId('rd-prov-history')
          r.history.forEach((_, i) => {
            expect(within(history).getByTestId(`rd-prov-history-item-${i + 1}`)).toBeInTheDocument()
          })
        })
      }

      if (has(11)) {
        it('Framsteg: the prognosis with its caveat, the eight sections, the week and Historik', () => {
          mount(11)
          expectNav()
          expect(screen.getByTestId('rd-framsteg-prognosis')).toBeInTheDocument()
          expect(screen.getAllByText(ESTIMATE_CAVEAT).length).toBeGreaterThan(0)
          for (const s of D.framsteg.sections) {
            expect(
              screen.getByTestId(`rd-framsteg-section-${sectionSlug(s.section)}`),
            ).toBeInTheDocument()
          }
          expect(screen.getByTestId('rd-framsteg-week')).toBeInTheDocument()
          const history = screen.getByTestId('rd-framsteg-history')
          D.framsteg.history.forEach((_, i) => {
            expect(
              within(history).getByTestId(`rd-framsteg-history-item-${i + 1}`),
            ).toBeInTheDocument()
          })
        })
      }

      if (has(12)) {
        it('Uppslag & lektion: the frameworks per section, the open lesson, read and practise', () => {
          const { actions } = mount(12)
          expectNav()
          for (const s of D.uppslag.sections) {
            expect(
              screen.getByTestId(`rd-uppslag-section-${sectionSlug(s.section)}`),
            ).toBeInTheDocument()
          }
          const open = D.uppslag.open
          const own = D.uppslag.sections.find((s) => s.section === open.section)
          for (const e of own?.entries ?? []) {
            expect(screen.getByTestId(`rd-uppslag-entry-${e.id}`)).toBeInTheDocument()
          }
          const other = own?.entries.find((e) => e.id !== open.id)
          if (other) {
            fireEvent.click(screen.getByTestId(`rd-uppslag-entry-${other.id}`))
            expect(actions.openLesson).toHaveBeenCalledWith(other.id)
          }
          expect(screen.getByTestId('rd-lesson')).toHaveTextContent(open.title)
          fireEvent.click(screen.getByTestId('rd-lesson-read'))
          expect(actions.toggleLessonRead).toHaveBeenCalledWith(open.id)
          fireEvent.click(screen.getByTestId('rd-lesson-practice'))
          expect(actions.startDrill).toHaveBeenCalledWith({
            kind: 'framework',
            frameworkId: open.id,
            section: open.section,
          })
        })
      }

      if (has(13)) {
        it('Konto & inställningar: identity, every preference, export, and a delete that asks first', () => {
          const { actions, stage } = mount(13)
          expectNav()
          const k = D.konto
          const identity = screen.getByTestId('rd-konto-identity')
          expect(identity).toHaveTextContent(k.identity.name)
          expect(identity).toHaveTextContent(k.identity.email)
          // The mode themes the stage, both ways, by any of the three paths.
          for (const mode of ['dark', 'light'] as const) {
            fireEvent.click(screen.getByTestId(`rd-konto-mode-${mode}`))
            expectTheme(subject.root, stage, mode)
          }
          // A control the direction's spec leaves out (meta.omits.konto) must
          // be absent or visibly disabled, and pressing it changes nothing;
          // never silently inert. Every other control must work.
          const omitted = new Set(subject.omits?.konto ?? [])
          // Every account action a press could reach; an omitted control's
          // press must leave all their call counts unchanged.
          const kontoActions = [
            actions.setPrefs,
            actions.setTheme,
            actions.exportData,
            actions.deleteAccount,
            actions.signOut,
          ].map((fn) => vi.mocked(fn))
          const expectUnavailable = (testId: string) => {
            const el = screen.queryByTestId(testId)
            if (!el) return
            const disabled =
              el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true'
            expect(disabled).toBe(true)
            const before = kontoActions.map((fn) => fn.mock.calls.length)
            fireEvent.click(el)
            expect(kontoActions.map((fn) => fn.mock.calls.length)).toEqual(before)
          }
          for (const pref of ['palette', 'font', 'density', 'coach'] as const) {
            if (omitted.has(pref)) {
              for (const o of k.options[pref]) expectUnavailable(`rd-konto-${pref}-${o.key}`)
              continue
            }
            const other = k.options[pref].find((o) => o.key !== k.prefs[pref])
            if (!other) continue
            fireEvent.click(screen.getByTestId(`rd-konto-${pref}-${other.key}`))
            expect(actions.setPrefs).toHaveBeenCalledWith({ [pref]: other.key })
          }
          fireEvent.click(screen.getByTestId('rd-konto-export'))
          expect(actions.exportData).toHaveBeenCalled()
          if (omitted.has('delete')) {
            expectUnavailable('rd-konto-delete')
            expect(screen.queryByTestId('rd-konto-delete-confirm')).toBeNull()
            expect(actions.deleteAccount).not.toHaveBeenCalled()
          } else {
            fireEvent.click(screen.getByTestId('rd-konto-delete'))
            expect(actions.deleteAccount).not.toHaveBeenCalled()
            fireEvent.click(screen.getByTestId('rd-konto-delete-confirm'))
            expect(actions.deleteAccount).toHaveBeenCalled()
          }
          fireEvent.click(screen.getByTestId('rd-konto-signout'))
          expect(actions.signOut).toHaveBeenCalled()
        })
      }

      if (has(14)) {
        it('ELF-läsfråga: the English passage, the badge outside it, the note on demand, graded', () => {
          const { actions } = mount(14)
          const [q] = D.drills.elf.questions
          const passage = screen.getByTestId('rd-elf-passage')
          expect(passage.closest('[lang]')).toHaveAttribute('lang', 'en')
          const badge = screen.getByTestId('rd-badge')
          expect(badge).toHaveTextContent(/övningstext/i)
          expect(passage).not.toContainElement(badge)
          const count = q.passage?.paragraphs.length ?? 0
          for (let n = 1; n <= count; n++) {
            expect(within(passage).getByTestId(`rd-para-${n}`)).toBeInTheDocument()
          }
          fireEvent.click(screen.getByTestId('rd-note-toggle'))
          expect(screen.getByTestId('rd-note')).toHaveTextContent(OVNINGSTEXT_NOTE)
          for (const o of q.options ?? []) reveal(`rd-option-${o.letter}`)
          fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
          fireEvent.click(screen.getByTestId('rd-lock'))
          expect(actions.drill.lock).toHaveBeenCalledWith(
            expect.objectContaining({ qid: q.qid }),
            q.answer,
          )
          expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'true')
        })
      }
    })
  })
}
