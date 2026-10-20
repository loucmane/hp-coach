import { fireEvent, render, screen, within } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  describeDirectionContract,
  mountDirection,
  stubLayout,
} from '@/components/devbake/redesign/contract'
import {
  DirectionDataProvider,
  FIXTURE_DATA,
  useBakeoffDirectionData,
} from '@/components/devbake/redesign/directionData'
import { LOCAL_CONTROLLER } from '@/components/devbake/redesign/drillCore'
import { Redesign2026Bakeoff } from '@/components/devbake/redesign/Redesign2026Bakeoff'
import type { AppScreenKey, WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, DirectionData } from '@/components/devbake/redesign/viewModel'
import { meta } from './meta'
import { Raster } from './Raster'

// jsdom does not fetch images. Model a successful cached load for the shared
// contract, then override it explicitly in loading and failure regressions.
beforeAll(stubLayout)
beforeEach(() => {
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
  vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(1200)
})

afterEach(() => vi.restoreAllMocks())

describeDirectionContract(meta, Raster)

function mountData(
  s: AppScreenKey,
  data: DirectionData,
  actions: Partial<DirectionActions> = {},
  width: WidthKey = 'desktop',
  live = true,
) {
  const onScreen = vi.fn()
  return {
    ...render(
      <DirectionDataProvider data={data} actions={actions}>
        <Raster
          screen={s}
          width={width}
          theme="light"
          live={live}
          onScreen={onScreen}
          onTheme={vi.fn()}
        />
      </DirectionDataProvider>,
    ),
    onScreen,
  }
}
function fresh(): DirectionData {
  return structuredClone(FIXTURE_DATA)
}
function openSheet() {
  const toggle = screen
    .getByTestId('rd-sheet')
    .querySelector<HTMLElement>('[aria-expanded="false"]')
  if (toggle) fireEvent.click(toggle)
}

describe.each(['desktop', 'phone'] as const)('Raster behavior at %s', (width) => {
  it('preserves reading feedback order, detail state and paragraph evidence', () => {
    mountDirection(Raster, 3, width)
    const q = FIXTURE_DATA.drills.reading.questions[FIXTURE_DATA.drills.reading.start.index ?? 0]
    const detail = FIXTURE_DATA.drills.reading.explanations[q.qid]?.steps?.find(
      (step) => step.tier === 'detail',
    )
    if (!detail) throw new Error('The reading fixture needs a detail step')
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Varför det lockade',
      'Varför det är fel',
      'Fällan',
      'Tekniken',
      'Lösningen',
      'Stegen',
      'De andra alternativen',
    ])
    fireEvent.click(screen.getByTestId(`rd-step-toggle-${detail.n}`))
    fireEvent.click(screen.getAllByTestId('rd-cite-6')[0])
    expect(screen.getByTestId('rd-para-6')).toHaveAttribute('data-flash', 'true')
    if (width === 'phone') openSheet()
    expect(screen.getByText(detail.text)).toBeVisible()
  })

  it('uses provider reading content and controller results without an explanation or clock', () => {
    const data = fresh()
    const source = data.drills.reading.questions[0]
    const q = {
      ...source,
      prompt: 'En annan läsfråga',
      passage: { ...source.passage!, title: 'En annan text', paragraphs: ['Ett nytt stycke.'] },
    }
    data.drills.reading = {
      ...data.drills.reading,
      questions: [q],
      explanations: {},
      start: { index: 0, results: [] },
      elapsedSeconds: undefined,
    }
    const lock = vi.fn(() => ({ correct: false }))
    const next = vi.fn()
    mountData(2, data, { drill: { lock, next } }, width)
    if (width === 'phone') openSheet()
    expect(screen.getByRole('heading', { name: 'En annan text' })).toBeVisible()
    fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenCalledWith(q, q.answer)
    expect(screen.getByTestId('rd-verdict')).toHaveAttribute('data-correct', 'false')
    expect(screen.getByText('Förklaringen saknas för den här frågan.')).toBeVisible()
    expect(screen.queryByRole('button', { name: /tidtagningen/ })).toBeNull()
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(next).toHaveBeenLastCalledWith(null)
    expect(screen.getByTestId('rd-done')).toBeVisible()
  })

  it('keeps digit and Escape keys free, supports five answers and completes quant', () => {
    const data = fresh()
    const q = data.drills.quant.questions.find((question) => question.section === 'NOG')!
    data.drills.quant = { ...data.drills.quant, questions: [q], start: { index: 0, results: [] } }
    const exit = vi.fn()
    const go = vi.fn()
    mountData(6, data, { drill: { ...LOCAL_CONTROLLER, exit }, go }, width)
    expect(screen.getByText('Påstående (1)')).toBeVisible()
    expect(screen.getByText('Påstående (2)')).toBeVisible()
    fireEvent.keyDown(window, { key: '3' })
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(exit).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-quant-option-C')).toHaveAttribute('aria-pressed', 'false')
    fireEvent.keyDown(window, { key: 'E', shiftKey: true })
    expect(screen.getByTestId('rd-eliminate-E')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.keyDown(window, { key: 'e' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(screen.getByTestId('rd-verdict')).toBeVisible()
    expect(screen.queryByTestId('rd-cite-1')).toBeNull()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(screen.getByText('Övningen klar')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /Till Öva/ }))
    expect(go).toHaveBeenCalledWith('ova')
  })

  it('splits KVA quantities and preserves a malformed prompt verbatim', () => {
    const data = fresh()
    const q = data.drills.quant.questions.find((question) => question.section === 'KVA')!
    data.drills.quant = {
      ...data.drills.quant,
      questions: [
        q,
        {
          ...q,
          qid: 'fallback',
          prompt: 'Alla villkor måste bevaras även utan kvantitetsmarkörer.',
        },
      ],
      start: { index: 0, results: [] },
    }
    mountData(6, data, {}, width)
    expect(screen.getByText('Kvantitet I')).toBeVisible()
    expect(screen.getByText('Kvantitet II')).toBeVisible()
    fireEvent.click(screen.getByTestId(`rd-quant-option-${q.answer}`))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    expect(screen.getByTestId('rd-quant-prompt')).toHaveTextContent(
      'Alla villkor måste bevaras även utan kvantitetsmarkörer.',
    )
  })

  it('uses home data without optional figures, resume, traps or week target', () => {
    const data = fresh()
    data.home.today.greeting = 'Hej från datakällan'
    data.home.resume = null
    data.home.traps = []
    data.home.prognosis = { total: null, verbal: null, quant: null, caveat: null }
    data.home.week = { minutesToday: null }
    const go = vi.fn()
    mountData(1, data, { go }, width)
    expect(screen.getByRole('heading', { name: 'Hej från datakällan.' })).toBeVisible()
    expect(screen.queryByTestId('rd-resume')).toBeNull()
    expect(screen.getByTestId('rd-raster').textContent).not.toMatch(/undefined|NaN/)
    fireEvent.click(screen.getByRole('button', { name: /Välj en övning/ }))
    expect(go).toHaveBeenCalledWith('ova')
  })

  it.each([0, 4])('distinguishes an empty due queue from a pile of %s', (pile) => {
    const data = fresh()
    data.repetera = { ...data.repetera, dueNow: 0, pile, items: [] }
    const startDrill = vi.fn()
    mountData(8, data, { startDrill }, width)
    expect(screen.getByText('Inget redo just nu')).toBeVisible()
    expect(
      screen.getByText(
        pile
          ? 'Frågorna i högen blir redo senare.'
          : 'När du svarar fel i en övning hittar du frågan här.',
      ),
    ).toBeVisible()
    expect(screen.queryByTestId('rd-repetera-start')).toBeNull()
    expect(startDrill).not.toHaveBeenCalled()
  })
})

it('uses one mixed lead without a resume/recommendation and preserves section order', () => {
  const data = fresh()
  data.home.resume = null
  data.ova.weakest = null
  data.ova.sections = data.ova.sections.map((section) => ({ ...section, score: null }))
  const { container } = mountData(5, data)
  expect(container.querySelectorAll('.ra-primary')).toHaveLength(1)
  expect(screen.getByTestId('rd-ova-mixed')).toHaveClass('ra-primary')
  expect(screen.queryByText('Svagast just nu')).toBeNull()
  expect(
    [...container.querySelectorAll('.ra-section-door b')].map((node) => node.textContent),
  ).toEqual(data.ova.sections.map((section) => section.section))
})

it('bounds repetition and puts due rows first without claiming persistence', () => {
  const data = fresh()
  data.repetera.dueNow = 20
  data.repetera.sessionSize = 10
  data.repetera.items.reverse()
  const { container } = mountData(8, data)
  expect(screen.getByTestId('rd-repetera-start')).toHaveTextContent('Repetera 10 frågor')
  const ids = [...container.querySelectorAll('.ra-queue-row')].map((row) =>
    row.getAttribute('data-testid'),
  )
  expect(ids).toEqual(
    [
      ...data.repetera.items.filter((item) => item.dueNow),
      ...data.repetera.items.filter((item) => !item.dueNow),
    ].map((item) => `rd-repetera-item-${item.n}`),
  )
  expect(container.textContent).not.toMatch(/sparat|inlärda/i)
})

it.each([
  2, 6, 7,
] as const)('handles an empty session on screen %s before mounting the core', (s) => {
  const data = fresh()
  data.drills[s === 2 ? 'reading' : s === 6 ? 'quant' : 'dtk'].questions = []
  mountData(s, data)
  expect(screen.getByRole('heading', { name: 'Frågan saknar fullständigt innehåll' })).toBeVisible()
  expect(screen.getByTestId('rd-exit')).toBeVisible()
})

it('blocks DTK submission until the image loads, including after a failure', () => {
  vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
  const lock = vi.fn(LOCAL_CONTROLLER.lock)
  mountData(7, fresh(), { drill: { lock } })
  const image = within(screen.getByTestId('rd-figure')).getByRole('img')
  fireEvent.click(screen.getByTestId('rd-quant-option-A'))
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(screen.getByTestId('rd-lock')).toBeDisabled()
  expect(lock).not.toHaveBeenCalled()
  fireEvent.error(image)
  expect(screen.getByText(/Underlaget kunde inte laddas/)).toBeVisible()
  expect(screen.getByTestId('rd-lock')).toBeDisabled()
  fireEvent.load(image)
  expect(screen.getByTestId('rd-lock')).toBeEnabled()
})

it('keeps selection and focus through figure zoom, rotation, reset and Escape', () => {
  const exit = vi.fn()
  const { container } = mountData(7, fresh(), { drill: { ...LOCAL_CONTROLLER, exit } })
  // jsdom has no native dialog lifecycle; browser focus trapping is host QA.
  const nativeDialog = container.querySelector('dialog')!
  nativeDialog.showModal = () => nativeDialog.setAttribute('open', '')
  nativeDialog.close = () => nativeDialog.removeAttribute('open')
  fireEvent.click(screen.getByTestId('rd-quant-option-A'))
  const opener = screen.getByRole('button', { name: 'Förstora' })
  fireEvent.click(opener)
  const dialog = screen.getByRole('dialog', { name: 'Förstorad figur' })
  fireEvent.click(within(dialog).getByRole('button', { name: 'Zooma in' }))
  expect(within(dialog).getByText('150%')).toBeVisible()
  fireEvent.click(within(dialog).getByRole('button', { name: /Rotera/ }))
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(screen.queryByTestId('rd-verdict')).toBeNull()
  fireEvent.click(within(dialog).getByRole('button', { name: 'Återställ' }))
  expect(within(dialog).getByText('100%')).toBeVisible()
  fireEvent(dialog, new Event('cancel', { cancelable: true }))
  expect(opener).toHaveFocus()
  expect(screen.getByTestId('rd-quant-option-A')).toHaveAttribute('aria-pressed', 'true')
  expect(exit).not.toHaveBeenCalled()
})

it('keeps side-by-side stages inert', () => {
  mountData(6, fresh(), {}, 'desktop', false)
  fireEvent.keyDown(window, { key: 'a' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(screen.getByTestId('rd-quant-option-A')).toHaveAttribute('aria-pressed', 'false')
  expect(screen.getByTestId('rd-raster')).toHaveAttribute('inert')
})

function ConnectedRaster() {
  const [current, setCurrent] = useState<AppScreenKey>(5)
  const value = useBakeoffDirectionData({
    screen: current,
    theme: 'light',
    onTheme: () => {},
    onScreen: setCurrent,
  })
  return (
    <DirectionDataProvider {...value}>
      <Raster
        screen={current}
        width="desktop"
        theme="light"
        live
        onScreen={setCurrent}
        onTheme={() => {}}
      />
    </DirectionDataProvider>
  )
}

it('returns a reading drill to the Öva hub that started it', () => {
  render(<ConnectedRaster />)
  fireEvent.click(screen.getByTestId('rd-ova-section-las'))
  expect(screen.getByTestId('rd-passage')).toBeVisible()
  fireEvent.click(screen.getByTestId('rd-exit'))
  expect(screen.getByRole('heading', { name: 'Öva' })).toBeVisible()
  expect(screen.getByTestId('rd-nav-ova')).toHaveAttribute('aria-current', 'page')
})

it('keeps quant grading and next available when the explanation is absent', () => {
  const data = fresh()
  data.drills.quant.explanations = {}
  const actions = { drill: { ...LOCAL_CONTROLLER, next: vi.fn() } }
  mountData(6, data, actions)
  fireEvent.click(screen.getByTestId('rd-quant-option-A'))
  fireEvent.click(screen.getByTestId('rd-lock'))
  expect(screen.getByTestId('rd-verdict')).toBeVisible()
  expect(screen.getByText('Förklaringen saknas för den här frågan.')).toBeVisible()
  fireEvent.click(screen.getByTestId('rd-next'))
  expect(actions.drill.next).toHaveBeenCalledWith(1)
})

it.each(['figure', 'options'] as const)('does not grade DTK with missing %s', (missing) => {
  const data = fresh()
  data.drills.dtk.questions[0][missing] = null
  const lock = vi.fn(LOCAL_CONTROLLER.lock)
  mountData(7, data, { drill: { lock } })
  fireEvent.keyDown(window, { key: 'a' })
  fireEvent.keyDown(window, { key: 'Enter' })
  expect(screen.getByTestId('rd-lock')).toBeDisabled()
  expect(lock).not.toHaveBeenCalled()
  expect(screen.getByTestId('rd-exit')).toBeVisible()
})

describe('Raster round 2 audit regressions', () => {
  it.each([
    'mixed',
    'repetition',
  ] as const)('requires a DTK figure in a %s session on screen 6', (kind) => {
    const data = fresh()
    const q = { ...data.drills.dtk.questions[0], figure: null }
    data.drills.quant = {
      ...data.drills.quant,
      request: { kind },
      questions: [q],
      start: { index: 0, results: [] },
    }
    const lock = vi.fn(LOCAL_CONTROLLER.lock)
    mountData(6, data, { drill: { lock } })
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.keyDown(window, { key: 'Enter' })
    fireEvent.keyDown(window, { key: ' ' })
    expect(lock).not.toHaveBeenCalled()
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    expect(screen.getByText('Frågan saknar fullständigt innehåll.')).toBeVisible()
  })

  it.each([
    false,
    true,
  ])('rechecks a remounted option image with the same URL (cached: %s)', (cached) => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
    const data = fresh()
    const q = data.drills.quant.questions[0]
    const figure = { ...data.drills.dtk.questions[0].figure!, alt: 'Alternativets figur' }
    const options = q.options!.map((option, i) => ({
      ...option,
      figure: i === 0 ? figure : null,
    }))
    data.drills.quant = {
      ...data.drills.quant,
      questions: [
        { ...q, figure: null, options },
        { ...q, qid: 'second-option-image', figure: null, options },
      ],
      start: { index: 0, results: [] },
    }
    const lock = vi.fn(LOCAL_CONTROLLER.lock)
    mountData(6, data, { drill: { lock } })
    const firstImage = screen.getByRole('img', { name: figure.alt })
    fireEvent.load(firstImage)
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    expect(lock).toHaveBeenCalledTimes(1)
    if (cached) vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true)
    fireEvent.click(screen.getByTestId('rd-next'))
    const secondImage = screen.getByRole('img', { name: figure.alt })
    expect(secondImage).not.toBe(firstImage)
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    if (!cached) {
      expect(secondImage).toHaveProperty('complete', false)
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.keyDown(window, { key: 'Enter' })
      fireEvent.keyDown(window, { key: ' ' })
      expect(lock).toHaveBeenCalledTimes(1)
      expect(screen.getByTestId('rd-lock')).toBeDisabled()
      fireEvent.error(secondImage)
      expect(screen.getByTestId('rd-lock')).toBeDisabled()
      fireEvent.load(secondImage)
    }
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(lock).toHaveBeenCalledTimes(2)
  })

  it('requires each option image to load even when their URLs match', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
    const data = fresh()
    const q = data.drills.quant.questions[0]
    const figure = data.drills.dtk.questions[0].figure!
    q.figure = null
    q.options = q.options!.map((option, i) => ({ ...option, figure: i < 2 ? figure : null }))
    mountData(6, data)
    const first = within(screen.getByTestId('rd-quant-option-A')).getByRole('img')
    const second = within(screen.getByTestId('rd-quant-option-B')).getByRole('img')
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.load(first)
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(second)
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it('preserves readiness and rotation only while the shared main image stays mounted', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false)
    const data = fresh()
    const q = data.drills.dtk.questions[0]
    data.drills.dtk.questions = [
      q,
      { ...q, qid: 'same-main-image' },
      { ...q, qid: 'other-main-image', figure: { ...q.figure!, src: 'other.png' } },
      { ...q, qid: 'returned-main-image' },
    ]
    mountData(7, data)
    const first = within(screen.getByTestId('rd-figure')).getByRole('img')
    fireEvent.load(first)
    fireEvent.click(screen.getByRole('button', { name: /Rotera/ }))
    for (const expectedImage of [first, first]) {
      expect(within(screen.getByTestId('rd-figure')).getByRole('img')).toBe(expectedImage)
      expect(expectedImage.parentElement).toHaveStyle('--ra-rotation: 90deg')
      fireEvent.click(screen.getByTestId('rd-quant-option-A'))
      expect(screen.getByTestId('rd-lock')).toBeEnabled()
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    const other = within(screen.getByTestId('rd-figure')).getByRole('img')
    fireEvent.load(other)
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    fireEvent.click(screen.getByTestId('rd-lock'))
    fireEvent.click(screen.getByTestId('rd-next'))
    const returned = within(screen.getByTestId('rd-figure')).getByRole('img')
    expect(returned).not.toBe(first)
    expect(returned.parentElement).toHaveStyle('--ra-rotation: 0deg')
    fireEvent.click(screen.getByTestId('rd-quant-option-A'))
    expect(screen.getByTestId('rd-lock')).toBeDisabled()
    fireEvent.load(returned)
    expect(screen.getByTestId('rd-lock')).toBeEnabled()
  })

  it('contains viewer keys through the real bake-off host and restores switcher keys on close', async () => {
    vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(1440)
    vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(900)
    const onSelect = vi.fn()
    render(
      <Redesign2026Bakeoff
        sel={{ d: 'g', s: 7, w: 'desktop', t: 'light', sbs: false, bare: false }}
        onSelect={onSelect}
      />,
    )
    const opener = await screen.findByRole('button', { name: 'Förstora' })
    fireEvent.click(opener)
    const dialog = screen.getByRole('dialog', { name: 'Förstorad figur' })
    const pan = within(dialog).getByRole('region', { name: /Förstorad figur, rulla/ })
    pan.focus()
    expect(pan).toHaveFocus()
    // Arrows retain their native scrolling behavior; neither key reaches the switcher.
    expect(fireEvent.keyDown(pan, { key: 'ArrowRight' })).toBe(true)
    fireEvent.keyDown(pan, { key: '1' })
    const zoom = within(dialog).getByRole('button', { name: 'Zooma in' })
    zoom.focus()
    fireEvent.keyDown(zoom, { key: 'ArrowRight' })
    fireEvent.keyDown(zoom, { key: '1' })
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByTestId('rb26-stage')).toHaveAttribute('data-direction', 'g')
    expect(screen.getByTestId('rb26-stage')).toHaveAttribute('data-screen', '7')
    fireEvent.click(within(dialog).getByRole('button', { name: 'Till frågan ×' }))
    expect(opener).toHaveFocus()
    fireEvent.keyDown(opener, { key: 'ArrowRight' })
    expect(onSelect).toHaveBeenLastCalledWith({ s: 8 })
    fireEvent.keyDown(opener, { key: '1' })
    expect(onSelect).toHaveBeenLastCalledWith({ d: 'a', sbs: false })
  })

  it('omits completed plan rows and makes remaining work actionable', () => {
    const data = fresh()
    data.home.plan.items[0].completed = true
    const pending = data.home.plan.items.slice(1)
    const openPlanItem = vi.fn()
    const { container } = mountData(1, data, { openPlanItem })
    const plan = within(screen.getByRole('region', { name: 'Sedan, i tur och ordning.' }))
    expect(
      plan.queryByRole('button', { name: new RegExp(data.home.plan.items[0].title) }),
    ).toBeNull()
    expect(plan.getAllByRole('button')).toHaveLength(pending.length)
    expect(
      plan.getByText(`${pending.reduce((sum, item) => sum + item.minutes, 0)} min`),
    ).toBeVisible()
    expect(container.querySelector('.ra-plan-row')).toHaveAttribute('data-primary', 'true')
    fireEvent.click(plan.getAllByRole('button')[0])
    expect(openPlanItem).toHaveBeenCalledWith(pending[0].id)
  })

  it.each([
    false,
    true,
  ])('shows completed Home plans without upcoming actions (allComplete: %s)', (allComplete) => {
    const data = fresh()
    data.home.plan.allComplete = allComplete
    data.home.plan.items.forEach((item) => {
      item.completed = true
    })
    const openPlanItem = vi.fn()
    const { container } = mountData(1, data, { openPlanItem })
    expect(screen.getByRole('heading', { name: 'Dagens plan är klar.' })).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Sedan, i tur och ordning.' })).toBeNull()
    expect(container.querySelectorAll('.ra-plan-row')).toHaveLength(0)
    expect(openPlanItem).not.toHaveBeenCalled()
  })

  it('navigates Till Idag to Home after completing a reading drill started from Öva', () => {
    render(<ConnectedRaster />)
    fireEvent.click(screen.getByTestId('rd-ova-section-las'))
    const session = FIXTURE_DATA.drills.reading
    for (const q of session.questions.slice(session.start.index ?? 0)) {
      fireEvent.click(screen.getByTestId(`rd-option-${q.answer}`))
      fireEvent.click(screen.getByTestId('rd-lock'))
      fireEvent.click(screen.getByTestId('rd-next'))
    }
    expect(screen.getByTestId('rd-done')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Till Idag' }))
    expect(screen.getByTestId('rd-nav-idag')).toHaveAttribute('aria-current', 'page')
    expect(
      screen.getByRole('heading', { name: `${FIXTURE_DATA.home.today.greeting}.` }),
    ).toBeVisible()
  })
})
