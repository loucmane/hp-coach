// The kit's data context: the fixture view model against round 1's Home
// (the same prognosis, minutes, week, pile and passes, now derived with the
// app's own functions from hook-shaped state), every screen's data, the
// provider and its defaults, the bake-off's mapping of actions onto the
// switcher — and a reference direction built on useDirectionData() and
// useDrillCore alone, which passes the shared contract for screens 5–14.

import { act, fireEvent, render, renderHook, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import {
  describeDirectionContract,
  passSlug,
  sectionSlug,
} from '@/components/devbake/redesign/contract'
import {
  DESTINATION_SCREEN,
  DirectionDataProvider,
  drillScreen,
  FIXTURE_DATA,
  fixtureDirectionData,
  NOOP_ACTIONS,
  useBakeoffDirectionData,
  useDirectionData,
} from '@/components/devbake/redesign/directionData'
import { useDrillCore } from '@/components/devbake/redesign/drillCore'
import {
  ESTIMATE_CAVEAT,
  OVA_DUE,
  PLAN,
  PROGNOSIS,
  RECENT,
  WEEK,
} from '@/components/devbake/redesign/r1Fixtures'
import {
  type AppScreenKey,
  DESTINATIONS,
  type DirectionProps,
  fmtClock,
  fmtScore,
} from '@/components/devbake/redesign/r1Kit'
import {
  MOCK_RESULTS,
  NORMERING,
  OPEN_LESSON_ID,
  PASS_ID,
  PASS_RESULT,
  PILE,
} from '@/components/devbake/redesign/r2Fixtures'
import type { DrillSessionView, PrefsView } from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import { normedScore } from '@/lib/normering'

const D = FIXTURE_DATA

// ── A reference direction: screens 5–14 from the data context alone ──

function Nav() {
  const { actions } = useDirectionData()
  return (
    <nav aria-label="Huvudmeny">
      {DESTINATIONS.map((d) => (
        <button
          type="button"
          key={d.id}
          data-testid={`rd-nav-${d.id}`}
          onClick={() => actions.go(d.id)}
        >
          {d.label}
        </button>
      ))}
      <button type="button" data-testid="rd-account" onClick={actions.openKonto}>
        Konto
      </button>
    </nav>
  )
}

function Feedback({
  view,
  next,
}: {
  view: ReturnType<typeof useDrillCore>['view']
  next: () => void
}) {
  const e = view.explanation
  return (
    <section>
      <p data-testid="rd-verdict" data-correct={String(view.correct)}>
        {view.correct ? 'Rätt' : 'Fel'}. Rätt svar: {view.question.answer}
      </p>
      {e ? (
        <>
          {(e.steps ?? []).map((s) => (
            <p key={s.n} data-testid={`rd-step-${s.n}`}>
              <MathText>{s.text}</MathText>
            </p>
          ))}
          <p data-testid="rd-technique">
            <MathText>{e.technique}</MathText>
          </p>
          <p data-testid="rd-pitfall">
            <MathText>{e.pitfall ?? ''}</MathText>
          </p>
          {e.distractors.map((d) => (
            <p key={d.letter} data-testid={`rd-distractor-${d.letter}`}>
              <MathText>{d.why_wrong}</MathText>
            </p>
          ))}
        </>
      ) : null}
      <button type="button" data-testid="rd-next" onClick={next}>
        Nästa
      </button>
    </section>
  )
}

function Drill({
  session,
  live,
  reading,
}: {
  session: DrillSessionView
  live: boolean
  reading?: boolean
}) {
  const { data, actions } = useDirectionData()
  const { view, act } = useDrillCore({
    questions: session.questions,
    explanations: session.explanations,
    start: session.start,
    elapsed: session.elapsedSeconds,
    controller: actions.drill,
    live,
  })
  const [note, setNote] = useState(false)
  const q = view.question
  const option = reading ? 'rd-option' : 'rd-quant-option'
  return (
    <section>
      <button type="button" data-testid="rd-exit" onClick={act.exit}>
        Avsluta
      </button>
      {view.passage ? (
        <>
          <span data-testid="rd-badge">{data.copy.ovningstextBadge}</span>
          <button
            type="button"
            data-testid="rd-note-toggle"
            aria-expanded={note}
            onClick={() => setNote(!note)}
          >
            Om texten
          </button>
          <p data-testid="rd-note" hidden={!note}>
            {data.copy.ovningstextNote}
          </p>
          <div data-testid="rd-elf-passage" lang={q.passage?.lang}>
            {view.passage.paragraphs.map((p, i) => (
              <p key={p.slice(0, 24)} data-testid={`rd-para-${i + 1}`}>
                {p}
              </p>
            ))}
          </div>
        </>
      ) : null}
      {q.figure ? (
        <figure data-testid="rd-figure">
          <img
            src={`/${q.figure.src}`}
            alt={q.figure.alt}
            width={q.figure.width}
            height={q.figure.height}
          />
        </figure>
      ) : null}
      <p data-testid="rd-quant-prompt">
        <MathText>{q.prompt ?? ''}</MathText>
      </p>
      {(q.options ?? []).map((o) => (
        <button
          type="button"
          key={o.letter}
          data-testid={`${option}-${o.letter}`}
          aria-pressed={view.selected === o.letter}
          onClick={() => act.select(o.letter)}
        >
          {o.letter} <MathText>{o.text}</MathText>
        </button>
      ))}
      <button type="button" data-testid="rd-lock" disabled={!view.selected} onClick={act.lock}>
        Svara
      </button>
      {view.phase === 'feedback' ? <Feedback view={view} next={act.next} /> : null}
    </section>
  )
}

function Provpass() {
  const { data, actions } = useDirectionData()
  const { hub, running } = data.provpass
  const [started, setStarted] = useState(false)
  const [flags, setFlags] = useState(() => new Set(running.flags))
  const current = running.questions[running.current]
  if (!started) {
    const suggested = hub.passes.find((p) => p.suggested && p.half === hub.half)
    return (
      <section>
        <Nav />
        {hub.halves.map((h) => (
          <h2 key={h.half} data-testid={`rd-prov-half-${h.half}`}>
            {h.label} · {h.minutes} min
          </h2>
        ))}
        {hub.passes.map((p) => (
          <p key={p.id} data-testid={`rd-prov-pass-${passSlug(p.id)}`}>
            {p.sitting} · {p.pass} · sett {p.seenBefore} av {p.presented}
          </p>
        ))}
        <button
          type="button"
          data-testid="rd-prov-start"
          onClick={() => {
            if (suggested) actions.startProvpass(suggested.id)
            setStarted(true)
          }}
        >
          Starta
        </button>
      </section>
    )
  }
  return (
    <section data-testid="rd-prov-running">
      <span data-testid="rd-prov-timer">{fmtClock(running.remainingSeconds)}</span>
      <div data-testid="rd-prov-grid">
        {running.grid.map((c) => (
          <span
            key={c.qid}
            data-testid={`rd-prov-cell-${c.n}`}
            data-answered={String(c.answered)}
            data-current={String(c.n === running.current + 1)}
          >
            {c.n}
          </span>
        ))}
      </div>
      <button
        type="button"
        data-testid="rd-prov-flag"
        aria-pressed={flags.has(current.qid)}
        onClick={() =>
          setFlags((f) => {
            const next = new Set(f)
            if (next.has(current.qid)) next.delete(current.qid)
            else next.add(current.qid)
            return next
          })
        }
      >
        Markera
      </button>
      <button type="button" data-testid="rd-prov-submit" onClick={actions.submitProvpass}>
        Lämna in
      </button>
    </section>
  )
}

function Konto({ onTheme }: Pick<DirectionProps, 'onTheme'>) {
  const { data, actions } = useDirectionData()
  const k = data.konto
  const [ask, setAsk] = useState(false)
  return (
    <section>
      <Nav />
      <p data-testid="rd-konto-identity">
        {k.identity.name} · {k.identity.email}
      </p>
      {k.options.mode.map((o) => (
        <button
          type="button"
          key={o.key}
          data-testid={`rd-konto-mode-${o.key}`}
          onClick={() => onTheme(o.key)}
        >
          {o.label}
        </button>
      ))}
      {(['palette', 'font', 'density', 'coach'] as const).map((pref) =>
        k.options[pref].map((o) => (
          <button
            type="button"
            key={`${pref}-${o.key}`}
            data-testid={`rd-konto-${pref}-${o.key}`}
            aria-pressed={k.prefs[pref] === o.key}
            onClick={() => actions.setPrefs({ [pref]: o.key } as Partial<PrefsView>)}
          >
            {o.label}
          </button>
        )),
      )}
      <button type="button" data-testid="rd-konto-export" onClick={actions.exportData}>
        Exportera min data
      </button>
      <button type="button" data-testid="rd-konto-delete" onClick={() => setAsk(true)}>
        Radera kontot
      </button>
      {ask ? (
        <button type="button" data-testid="rd-konto-delete-confirm" onClick={actions.deleteAccount}>
          Radera permanent
        </button>
      ) : null}
      <button type="button" data-testid="rd-konto-signout" onClick={actions.signOut}>
        Logga ut
      </button>
    </section>
  )
}

function Reference(props: DirectionProps) {
  const { data, actions } = useDirectionData()
  const { screen: s, live } = props
  let body = null
  if (s === 5) {
    body = (
      <section>
        <Nav />
        {data.ova.sections.map((x) => (
          <button
            type="button"
            key={x.section}
            data-testid={`rd-ova-section-${sectionSlug(x.section)}`}
            onClick={() => actions.startDrill({ kind: 'section', section: x.section })}
          >
            {x.section} {x.score == null ? '—' : fmtScore(x.score)} · {x.waiting} väntar
          </button>
        ))}
        <button type="button" data-testid="rd-ova-repetera" onClick={actions.openRepetera}>
          Repetera: {data.ova.repetera.dueNow} redo nu
        </button>
        <button
          type="button"
          data-testid="rd-ova-mixed"
          onClick={() => actions.startDrill({ kind: 'mixed' })}
        >
          Blandad övning
        </button>
      </section>
    )
  } else if (s === 6) body = <Drill session={data.drills.quant} live={live} />
  else if (s === 7) body = <Drill session={data.drills.dtk} live={live} />
  else if (s === 8) {
    body = (
      <section>
        <Nav />
        <ol>
          {data.repetera.items.map((item) => (
            <li key={item.mistakeId} data-testid={`rd-repetera-item-${item.n}`}>
              {item.section} · {item.prompt}
            </li>
          ))}
        </ol>
        <button
          type="button"
          data-testid="rd-repetera-start"
          onClick={() => actions.startDrill({ kind: 'repetition' })}
        >
          Repetera {data.repetera.dueNow}
        </button>
      </section>
    )
  } else if (s === 9) body = <Provpass />
  else if (s === 10) {
    const r = data.provpass.result
    body = (
      <section>
        <Nav />
        <div data-testid="rd-prov-result">
          {r.correct} av {r.presented}
          <p data-testid="rd-prov-score">
            {r.score.value == null ? '—' : fmtScore(r.score.value)} {r.score.label}
          </p>
          {r.sections.map((x) => (
            <p key={x.section} data-testid={`rd-prov-section-${sectionSlug(x.section)}`}>
              {x.section} {x.correct}/{x.presented}
            </p>
          ))}
          <ol data-testid="rd-prov-history">
            {r.history.map((h, i) => (
              <li key={h.id} data-testid={`rd-prov-history-item-${i + 1}`}>
                {h.sitting} {h.correct}/{h.presented}
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  } else if (s === 11) {
    const f = data.framsteg
    body = (
      <section>
        <Nav />
        <p data-testid="rd-framsteg-prognosis">
          {f.prognosis.total == null ? '—' : fmtScore(f.prognosis.total)}
        </p>
        <p>{f.prognosis.caveat}</p>
        {f.sections.map((x) => (
          <p key={x.section} data-testid={`rd-framsteg-section-${sectionSlug(x.section)}`}>
            {x.name}
          </p>
        ))}
        <p data-testid="rd-framsteg-week">{f.week.streakDays} dagar i rad</p>
        <ol data-testid="rd-framsteg-history">
          {f.history.map((h, i) => (
            <li key={h.id} data-testid={`rd-framsteg-history-item-${i + 1}`}>
              {h.label} {h.correct}/{h.total} · {h.when}
            </li>
          ))}
        </ol>
      </section>
    )
  } else if (s === 12) {
    const open = data.uppslag.open
    body = (
      <section>
        <Nav />
        {data.uppslag.sections.map((x) => (
          <section key={x.section} data-testid={`rd-uppslag-section-${sectionSlug(x.section)}`}>
            <h2>{x.name}</h2>
            {x.section === open.section
              ? x.entries.map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    data-testid={`rd-uppslag-entry-${e.id}`}
                    onClick={() => actions.openLesson(e.id)}
                  >
                    {e.title}
                  </button>
                ))
              : null}
          </section>
        ))}
        <article data-testid="rd-lesson">
          <h2>{open.title}</h2>
          <button
            type="button"
            data-testid="rd-lesson-read"
            aria-pressed={open.read}
            onClick={() => actions.toggleLessonRead(open.id)}
          >
            Läst
          </button>
          <button
            type="button"
            data-testid="rd-lesson-practice"
            onClick={() =>
              actions.startDrill({
                kind: 'framework',
                frameworkId: open.id,
                section: open.section,
              })
            }
          >
            Öva {open.practice.questions} frågor
          </button>
        </article>
      </section>
    )
  } else if (s === 13) body = <Konto onTheme={props.onTheme} />
  else if (s === 14) body = <Drill session={data.drills.elf} live={live} reading />
  return (
    <div data-testid="rd-referens" data-theme={props.theme} data-width={props.width} lang="sv">
      {body}
    </div>
  )
}

const REFERENCE_SCREENS: AppScreenKey[] = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

describeDirectionContract(
  { name: 'The kit’s reference direction', root: 'rd-referens', screens: REFERENCE_SCREENS },
  Reference,
)

// ── The fixture view model ───────────────────────────────────────────

describe('fixture view model', () => {
  it('derives round 1’s Home from the reader’s state with the app’s own functions', () => {
    const p = D.home.prognosis
    expect(p.total).toBeCloseTo(PROGNOSIS.total, 10)
    expect(p.verbal).toBeCloseTo(PROGNOSIS.verbal, 10)
    expect(p.quant).toBeCloseTo(PROGNOSIS.quant, 10)
    expect(p.delta).toBeCloseTo(PROGNOSIS.delta, 10)
    expect(p.weeks?.length).toBe(PROGNOSIS.weeks.length)
    for (const [i, w] of (p.weeks ?? []).entries()) expect(w).toBeCloseTo(PROGNOSIS.weeks[i], 10)
    expect([p.low, p.high, p.target]).toEqual([PROGNOSIS.low, PROGNOSIS.high, PROGNOSIS.target])
    // P5 practice texts feed LÄS and ELF: the approved caveat is on.
    expect(p.caveat).toBe(ESTIMATE_CAVEAT)
    // A four-day run, Tuesday to today (Friday): this week's four days.
    expect(D.home.week).toEqual({
      minutesToday: WEEK.minutesToday,
      streakDays: 4,
      daysPractised: WEEK.daysPractised,
      goal: WEEK.goal,
    })
    expect(D.home.ovaDue).toBe(OVA_DUE)
    expect(
      D.home.recent.map(({ label, correct, total, when }) => ({ label, correct, total, when })),
    ).toEqual(RECENT.map(({ label, correct, total, when }) => ({ label, correct, total, when })))
  })

  it('keeps round 1’s plan, in the real plan’s kinds, the lesson linked to its framework', () => {
    expect(D.home.plan.minutes).toBe(PLAN.minutes)
    expect(D.home.plan.items.map((i) => [i.id, i.kind, i.minutes, i.primary ?? false])).toEqual([
      ['rep', 'repetition', 9, true],
      ['lektion', 'lesson', 6, false],
      ['ord', 'drill', 4, false],
    ])
    expect(D.home.plan.items[1].framework).toBe('ELF-TYPE-002')
    // "8 av 23 missar": due now of today's pile.
    expect(PLAN.items[0].detail).toBe(`${D.ova.repetera.dueNow} av ${D.ova.repetera.pile} missar`)
  })

  it('fills every round-2 screen', () => {
    expect(D.ova.sections.map((s) => s.section)).toEqual([
      'ORD',
      'LÄS',
      'MEK',
      'ELF',
      'XYZ',
      'KVA',
      'NOG',
      'DTK',
    ])
    expect(D.ova.sections.reduce((n, s) => n + s.waiting, 0)).toBe(PILE.length)
    expect(D.ova.weakest).toBe('XYZ')
    expect(D.ova.mixed.questions).toBe(10)
    expect(D.repetera.items.slice(0, D.repetera.dueNow).every((i) => i.dueNow)).toBe(true)
    expect(D.repetera.items.every((i) => i.prompt)).toBe(true)
    expect(D.repetera.items.map((i) => i.n)).toEqual(PILE.map((_, i) => i + 1))
    expect(D.drills.quant.questions.map((q) => [q.section, q.options?.length, q.math])).toEqual([
      ['XYZ', 4, true],
      ['KVA', 4, false],
      ['NOG', 5, true],
    ])
    expect(D.drills.dtk.questions[0].figure).toMatchObject({
      kind: 'raster',
      width: 2316,
      height: 3302,
    })
    expect(D.drills.elf.questions[0].passage).toMatchObject({ lang: 'en', synthetic: true })
    expect(D.drills.reading.questions).toHaveLength(4)
    expect(D.framsteg.history).toHaveLength(10)
    expect(D.framsteg.focus).toEqual(['XYZ', 'DTK', 'KVA'])
    expect(D.framsteg.week.record).toBeGreaterThanOrEqual(D.framsteg.week.streakDays)
    expect(D.framsteg.days).toHaveLength(84)
    expect(D.uppslag.sections).toHaveLength(8)
    expect(D.uppslag.open).toMatchObject({ id: OPEN_LESSON_ID, read: false, status: 'learning' })
    expect(D.konto.options.palette).toHaveLength(5)
    expect(D.konto.options.coach.map((c) => c.key)).toEqual(['kompis', 'professor', 'taktiker'])
  })

  it('scores Provpass with the sitting’s normering, the hub opening on the half that is next', () => {
    const { hub, running, result } = D.provpass
    expect(hub.half).toBe('kvant')
    expect(hub.passes.find((p) => p.suggested && p.half === 'kvant')?.id).toBe(PASS_ID)
    expect(running.passId).toBe(PASS_ID)
    expect(running.questions).toHaveLength(40)
    expect(running.grid.filter((c) => c.answered)).toHaveLength(16)
    expect(running.sections.map((s) => [s.section, s.end - s.start])).toEqual([
      ['XYZ', 12],
      ['KVA', 10],
      ['NOG', 6],
      ['DTK', 12],
    ])
    expect(result.score).toEqual({
      value: normedScore(NORMERING['host-2025'], 'kvant', PASS_RESULT.correct, 40).score,
      derived: 'official-derived',
      label: 'normerat (härlett)',
    })
    expect(result.history.map((h) => h.id)).toEqual(
      MOCK_RESULTS.filter((r) => r.half === 'kvant').map((r) => String(r.id)),
    )
    expect(hub.results.map((r) => r.id)).toEqual(MOCK_RESULTS.map((r) => String(r.id)))
  })
})

// ── The provider ─────────────────────────────────────────────────────

describe('DirectionDataProvider', () => {
  it('serves the fixtures with actions that do nothing outside a provider', () => {
    const { result } = renderHook(() => useDirectionData())
    expect(result.current.data).toBe(FIXTURE_DATA)
    expect(result.current.actions).toBe(NOOP_ACTIONS)
    expect(result.current.actions.drill.lock(D.drills.quant.questions[0], 'D')).toEqual({
      correct: true,
    })
  })

  it('fills the actions a host gives over the no-ops, and takes its data', () => {
    const go = vi.fn()
    const data = fixtureDirectionData()
    const { result } = renderHook(() => useDirectionData(), {
      wrapper: ({ children }) => (
        <DirectionDataProvider data={data} actions={{ go }}>
          {children}
        </DirectionDataProvider>
      ),
    })
    expect(result.current.data).toBe(data)
    result.current.actions.go('ova')
    expect(go).toHaveBeenCalledWith('ova')
    expect(result.current.actions.openKonto).toBe(NOOP_ACTIONS.openKonto)
  })
})

describe('the bake-off’s actions', () => {
  function setup(screen: AppScreenKey = 1) {
    const onScreen = vi.fn()
    const onTheme = vi.fn()
    const hook = renderHook(
      (props: { screen: AppScreenKey }) =>
        useBakeoffDirectionData({ screen: props.screen, onScreen, onTheme }),
      { initialProps: { screen } },
    )
    return { ...hook, onScreen, onTheme }
  }

  it('opens each destination on its screen', () => {
    const { result, onScreen } = setup()
    for (const d of DESTINATIONS) {
      result.current.actions.go(d.id)
      expect(onScreen).toHaveBeenLastCalledWith(DESTINATION_SCREEN[d.id])
    }
    expect(Object.values(DESTINATION_SCREEN)).toEqual([1, 5, 9, 12, 11])
  })

  it('opens a drill on its screen, and none for a section without one', () => {
    expect(drillScreen({ kind: 'section', section: 'LÄS' })).toBe(2)
    expect(drillScreen({ kind: 'section', section: 'ELF' })).toBe(14)
    expect(drillScreen({ kind: 'section', section: 'DTK' })).toBe(7)
    for (const section of ['XYZ', 'KVA', 'NOG'] as const) {
      expect(drillScreen({ kind: 'weak', section })).toBe(6)
    }
    expect(drillScreen({ kind: 'mixed' })).toBe(6)
    expect(drillScreen({ kind: 'repetition' })).toBe(6)
    expect(drillScreen({ kind: 'framework', frameworkId: OPEN_LESSON_ID, section: 'LÄS' })).toBe(2)
    expect(drillScreen({ kind: 'section', section: 'ORD' })).toBeNull()
    const { result, onScreen } = setup()
    result.current.actions.startDrill({ kind: 'section', section: 'MEK' })
    expect(onScreen).not.toHaveBeenCalled()
    result.current.actions.startDrill({ kind: 'section', section: 'KVA' })
    expect(onScreen).toHaveBeenLastCalledWith(6)
  })

  it('maps Home, Repetera, Uppslag, Provpass and Konto onto the switcher', () => {
    const { result, onScreen } = setup()
    const a = result.current.actions
    a.resume()
    expect(onScreen).toHaveBeenLastCalledWith(2)
    a.openPlanItem('rep')
    expect(onScreen).toHaveBeenLastCalledWith(8)
    a.openPlanItem('lektion')
    expect(onScreen).toHaveBeenLastCalledWith(12)
    onScreen.mockClear()
    a.openPlanItem('ord')
    expect(onScreen).not.toHaveBeenCalled()
    a.openRepetera()
    expect(onScreen).toHaveBeenLastCalledWith(8)
    a.openLesson(OPEN_LESSON_ID)
    expect(onScreen).toHaveBeenLastCalledWith(12)
    a.startProvpass(PASS_ID)
    expect(onScreen).toHaveBeenLastCalledWith(9)
    a.submitProvpass()
    expect(onScreen).toHaveBeenLastCalledWith(10)
    a.openKonto()
    expect(onScreen).toHaveBeenLastCalledWith(13)
  })

  it('keeps the reader’s preferences and read lessons, and the theme with the switcher', () => {
    const { result, onTheme } = setup(13)
    act(() => result.current.actions.setPrefs({ coach: 'kompis' }))
    expect(result.current.data.konto.prefs.coach).toBe('kompis')
    act(() => result.current.actions.setPrefs({ mode: 'dark' }))
    expect(onTheme).toHaveBeenLastCalledWith('dark')
    result.current.actions.setTheme('light')
    expect(onTheme).toHaveBeenLastCalledWith('light')
    expect(result.current.data.uppslag.open.read).toBe(false)
    act(() => result.current.actions.toggleLessonRead(OPEN_LESSON_ID))
    expect(result.current.data.uppslag.open.read).toBe(true)
    act(() => result.current.actions.toggleLessonRead(OPEN_LESSON_ID))
    expect(result.current.data.uppslag.open.read).toBe(false)
  })

  it('leaves a drill for the screen it was started from', () => {
    const { result, rerender, onScreen } = setup(5)
    rerender({ screen: 6 })
    result.current.actions.drill.exit?.()
    expect(onScreen).toHaveBeenLastCalledWith(5)
    rerender({ screen: 8 })
    rerender({ screen: 14 })
    result.current.actions.drill.exit?.()
    expect(onScreen).toHaveBeenLastCalledWith(8)
    expect(result.current.actions.drill.lock(D.drills.elf.questions[0], 'A')).toEqual({
      correct: true,
    })
  })
})

describe('the reference direction inside the bake-off’s provider', () => {
  it('starts a KVA drill from Öva and lands on Kvantfråga', () => {
    const onSelect = vi.fn()
    function Stage() {
      const value = useBakeoffDirectionData({ screen: 5, onScreen: onSelect, onTheme: () => {} })
      return (
        <DirectionDataProvider data={value.data} actions={value.actions}>
          <Reference
            screen={5}
            width="desktop"
            theme="light"
            live={false}
            onScreen={() => {}}
            onTheme={() => {}}
          />
        </DirectionDataProvider>
      )
    }
    render(<Stage />)
    fireEvent.click(screen.getByTestId('rd-ova-section-kva'))
    expect(onSelect).toHaveBeenLastCalledWith(6)
  })
})
