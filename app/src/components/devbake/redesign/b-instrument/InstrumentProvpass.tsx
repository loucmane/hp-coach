import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import type { AnswerLetter } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { useDirectionData } from '../directionData'
import { fmtClock, fmtScore } from '../r1Kit'
import type {
  DrillQuestion,
  Half,
  ProvPassOptionView,
  ProvResultSummaryView,
  ProvRunningView,
} from '../viewModel'
import { Kc, Readout } from './parts'

const halfName = (half: Half) => (half === 'verbal' ? 'Verbal' : 'Kvantitativ')
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
const sectionSlug = (value: string) => value.toLowerCase().replace('ä', 'a')

/** Native modality contains focus and makes the workspace inert. Cancel always wins. */
function PassDialog({
  title,
  children,
  cancel,
  confirm,
  onCancel,
  onConfirm,
}: {
  title: string
  children: ReactNode
  cancel: string
  confirm: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const label = useId()
  const accepted = useRef(false)
  useEffect(() => {
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ref.current?.showModal()
    ref.current?.querySelector('button')?.focus()
    return () => {
      if (origin?.isConnected) origin.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="in-pass-dialog"
      aria-labelledby={label}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <h2 id={label}>{title}</h2>
      {children}
      <div className="in-pass-controls">
        <button type="button" className="in-btn2" onClick={onCancel}>
          {cancel}
        </button>
        <button
          type="button"
          className="in-btn"
          data-testid="rd-confirm"
          onClick={() => {
            if (accepted.current) return
            accepted.current = true
            onConfirm()
          }}
        >
          {confirm}
        </button>
      </div>
    </dialog>
  )
}

export function InstrumentProvpass({
  onStart,
  notice,
}: {
  onStart: (id: string) => void
  notice: string
}) {
  const { data, actions } = useDirectionData()
  const hub = data.provpass.hub
  const [half, setHalf] = useState(hub.half)
  const [chosen, setChosen] = useState<ProvPassOptionView | null>(null)
  const definition = hub.halves.find((item) => item.half === half)
  const passes = hub.passes.filter((pass) => pass.half === half)
  const suggested = passes.find((pass) => pass.suggested) ?? passes[0]
  const chosenHalf = hub.halves.find((item) => item.half === chosen?.half)
  return (
    <div className="in-hub in-pass-hub">
      <header className="in-greet">
        <h1 tabIndex={-1}>Provpass</h1>
        <p>Ett pass. En klocka. Dina svar fram till inlämning.</p>
      </header>
      {notice ? (
        <p role="status" className="in-pass-note">
          {notice}
        </p>
      ) : null}
      <section className="in-directory" aria-label="Välj provpass">
        <div className="in-pass-band">
          <span className="in-pane-label">Riktiga pass</span>
          <fieldset className="in-pass-controls" aria-label="Halva">
            {hub.halves.map((item) => (
              <button
                key={item.half}
                type="button"
                className="in-btn2"
                data-testid={`rd-prov-half-${item.half}`}
                aria-pressed={half === item.half}
                onClick={() => setHalf(item.half)}
              >
                {item.label}
              </button>
            ))}
          </fieldset>
          {definition ? (
            <p>
              {definition.questions} frågor · {definition.minutes} minuter ·{' '}
              {definition.sections.map((s) => `${s.section} ${s.count}`).join(' / ')}
            </p>
          ) : null}
        </div>
        {suggested ? (
          <div className="in-hub-lead">
            <div>
              <span className="in-pane-label">Föreslaget pass</span>
              <h2>
                {suggested.sitting} · {suggested.pass}
              </h2>
              <p>
                {suggested.presented} frågor tillgängliga · {suggested.seenBefore} sedda tidigare
              </p>
              <p>Minst exponerat bland tillgängliga pass.</p>
            </div>
            <button
              type="button"
              className="in-btn"
              data-testid="rd-prov-start"
              disabled={!suggested.presented}
              onClick={() => setChosen(suggested)}
            >
              Välj föreslaget pass
            </button>
          </div>
        ) : (
          <p className="in-pass-note">Inga riktiga pass tillgängliga för den här halvan.</p>
        )}
        <ul className="in-pass-register">
          {passes.map((pass) => (
            <li key={pass.id} data-testid={`rd-prov-pass-${slug(pass.id)}`}>
              <div>
                <b>{pass.sitting}</b>
                <span>
                  {pass.pass} · {pass.presented} frågor
                </span>
              </div>
              <span>
                Sett {pass.seenBefore} av {pass.presented} tidigare
              </span>
              <button
                type="button"
                className="in-btn2"
                disabled={!pass.presented}
                aria-label={`Välj ${pass.sitting}, ${pass.pass}`}
                onClick={() => setChosen(pass)}
              >
                Välj pass
              </button>
            </li>
          ))}
        </ul>
      </section>
      <section className="in-pass-section" aria-label="Villkor">
        <h2 className="in-cell-head">Innan du börjar</h2>
        <ul className="in-pass-rules">
          {hub.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>
      <RelatedPasses
        rows={hub.results.filter((row) => row.half === half)}
        title="Tidigare provpass"
      />
      {chosen ? (
        <PassDialog
          title={`${chosen.sitting} · ${chosen.pass}`}
          cancel="Inte nu"
          confirm="Starta nu"
          onCancel={() => setChosen(null)}
          onConfirm={() => {
            actions.startProvpass(chosen.id)
            onStart(chosen.id)
          }}
        >
          <p>
            {halfName(chosen.half)} · {chosen.presented} frågor
            {chosenHalf ? ` · ${chosenHalf.minutes} minuter` : ''}
          </p>
          {chosenHalf && chosen.presented < chosenHalf.questions ? (
            <p>
              {chosenHalf.questions - chosen.presented}{' '}
              {chosenHalf.questions - chosen.presented === 1 ? 'fråga saknas' : 'frågor saknas'} i
              källan. Du får {chosen.presented} frågor.
            </p>
          ) : null}
          <p>
            Sett {chosen.seenBefore} av {chosen.presented} tidigare.
          </p>
          <ul className="in-pass-rules">
            <li>Ingen paus.</li>
            <li>Ingen feedback förrän du lämnar in.</li>
            <li>Du kan ändra svar tills tiden går ut.</li>
            <li>Avbryter du blir provet ogiltigt.</li>
            <li>Lämna ingen fråga obesvarad — fel ger inga avdrag.</li>
          </ul>
        </PassDialog>
      ) : null}
    </div>
  )
}

export function InstrumentProvRunning({
  passId,
  live,
  onExit,
}: {
  passId: string
  live: boolean
  onExit: (abandoned: boolean) => void
}) {
  const { data } = useDirectionData()
  const run = data.provpass.running
  const chosen = data.provpass.hub.passes.find((pass) => pass.id === passId)
  const complete =
    run.questions.length > 0 &&
    (!chosen || (chosen.presented === run.questions.length && chosen.half === run.half)) &&
    run.questions.length === run.grid.length &&
    run.questions.every(
      (q, i) =>
        q.qid === run.grid[i]?.qid &&
        q.options?.length &&
        (q.prompt || q.passage) &&
        (q.section !== 'DTK' || q.figure),
    )
  const expired = run.passId === passId && run.remainingSeconds <= 0
  if (run.passId !== passId || !complete || expired)
    return (
      <div className="in-done">
        <h1>{expired ? 'Provpassets tid har gått ut' : 'Passet är inte tillgängligt'}</h1>
        <p>
          {expired
            ? 'Det tidigare provpasset kan inte återupptas. Inget nytt resultat har skapats.'
            : 'Frågorna för det valda passet saknas eller är ofullständiga.'}
        </p>
        <button
          type="button"
          className="in-btn2"
          data-testid="rd-exit"
          onClick={() => onExit(false)}
        >
          Till Provpass
        </button>
      </div>
    )
  return <PassRunner key={run.passId} run={run} live={live} onExit={() => onExit(true)} />
}

function PassRunner({
  run,
  live,
  onExit,
}: {
  run: ProvRunningView
  live: boolean
  onExit: () => void
}) {
  const { data, actions } = useDirectionData()
  const [current, setCurrent] = useState(
    Math.max(0, Math.min(run.current, run.questions.length - 1)),
  )
  const [answers, setAnswers] = useState({ ...run.answers })
  const [flags, setFlags] = useState(run.flags ?? [])
  const [confirm, setConfirm] = useState<'exit' | 'submit' | null>(null)
  const [remaining, setRemaining] = useState(Math.max(0, run.remainingSeconds))
  const [deadline] = useState(() => Date.now() + Math.max(0, run.remainingSeconds) * 1000)
  const [submitted, setSubmitted] = useState(false)
  const submittedRef = useRef(false)
  const [media, setMedia] = useState<Record<string, 'ready' | 'error'>>({})
  const questionRef = useRef<HTMLHeadingElement>(null)
  const q = run.questions[current]
  const sources = [q.figure?.src, ...q.options!.map((option) => option.figure?.src)].filter(
    (src): src is string => Boolean(src),
  )
  const ready = sources.every((src) => media[src] === 'ready')
  const answered = run.questions.filter((question) => answers[question.qid] != null).length
  const unanswered = run.questions.length - answered
  const submit = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    setConfirm(null)
    setSubmitted(true)
    actions.submitProvpass()
  }
  const submitRef = useRef(submit)
  submitRef.current = submit
  useEffect(() => {
    if (!live || submitted) return
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(seconds)
      if (seconds === 0) submitRef.current()
    }
    tick()
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [deadline, live, submitted])
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus follows the selected question
  useEffect(() => {
    if (live) questionRef.current?.focus({ preventScroll: true })
  }, [current, live])
  const choose = (letter: AnswerLetter) => {
    if (ready && !submitted && remaining > 0)
      setAnswers((previous) => ({ ...previous, [q.qid]: letter }))
  }
  const move = (index: number) => setCurrent(Math.max(0, Math.min(index, run.questions.length - 1)))
  useEffect(() => {
    if (!live || confirm || submitted) return
    const key = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      const target = event.target instanceof Element ? event.target : null
      if (
        target?.closest(
          'button, input, textarea, select, a, summary, dialog, [contenteditable], [data-pass-media], [data-pass-grid]',
        )
      )
        return
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault()
        event.stopPropagation()
        move(current + (event.key === 'ArrowRight' ? 1 : -1))
      } else {
        const option = q.options!.find(
          (item) => item.letter.toLowerCase() === event.key.toLowerCase(),
        )
        if (option) {
          event.preventDefault()
          event.stopPropagation()
          choose(option.letter)
        }
      }
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  })
  const status = (src: string, state: 'ready' | 'error') =>
    setMedia((previous) => (previous[src] === state ? previous : { ...previous, [src]: state }))
  return (
    <div className="in-pass-running" data-testid="rd-prov-running">
      <header className="in-pass-runbar">
        <button
          type="button"
          className="in-btn2"
          data-testid="rd-exit"
          disabled={submitted}
          onClick={() => setConfirm('exit')}
        >
          Avsluta
        </button>
        <span className="in-pane-label">
          {run.sitting} · {run.pass}
        </span>
        <span
          className="in-pass-clock"
          data-warning={remaining <= 300}
          data-testid="rd-prov-timer"
          role="timer"
          aria-label="Tid kvar"
          aria-live="off"
        >
          {fmtClock(remaining)} <small>kvar</small>
        </span>
        <button
          type="button"
          className="in-btn"
          data-testid="rd-prov-submit"
          disabled={submitted}
          onClick={() => setConfirm('submit')}
        >
          {submitted ? 'Lämnar in…' : 'Lämna in'}
        </button>
      </header>
      <p className="in-pass-live" role="status">
        {submitted
          ? 'Inlämning begärd.'
          : remaining <= 60
            ? 'En minut eller mindre kvar.'
            : remaining <= 300
              ? 'Fem minuter eller mindre kvar.'
              : ''}
      </p>
      <div className="in-pass-scroll">
        <div className="in-pass-question" key={q.qid}>
          <section className="in-pass-source" aria-label="Uppgift">
            <h1 ref={questionRef} tabIndex={-1}>
              {q.section}{' '}
              <span className="in-num">
                {current + 1} av {run.questions.length}
              </span>
            </h1>
            {q.passage ? (
              <>
                {q.passage.synthetic ? (
                  <details className="in-pass-disclosure">
                    <summary>{data.copy.ovningstextBadge}</summary>
                    <p>{data.copy.ovningstextNote}</p>
                  </details>
                ) : null}
                <article className="in-pass-passage" lang={q.passage.lang}>
                  {q.passage.title ? <h2>{q.passage.title}</h2> : null}
                  {q.passage.paragraphs.map((text, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed paragraph order within a keyed question
                    <p key={`${index}-${text.slice(0, 20)}`}>
                      <span className="in-pass-paragraph">¶{index + 1}</span>
                      {text}
                    </p>
                  ))}
                  {q.passage.byline ? <p className="in-pass-byline">{q.passage.byline}</p> : null}
                </article>
              </>
            ) : null}
            {q.figure ? <PassImage figure={q.figure} onStatus={status} /> : null}
            <div className="in-pass-prompt">
              <PassPrompt question={q} />
            </div>
          </section>
          <section className="in-pass-answers" aria-label="Svar">
            <h2 className="in-cell-head">
              Ditt svar <span className="in-pane-label">Kan ändras</span>
            </h2>
            {q
              .options!.filter((option) => option.figure)
              .map((option) => (
                <div key={option.letter} className="in-pass-option-figure">
                  <b>Alternativ {option.letter}</b>
                  <PassImage figure={option.figure!} onStatus={status} />
                </div>
              ))}
            {!ready ? (
              <p className="in-pass-note">
                Vänta tills allt underlag har laddats innan du väljer svar.
              </p>
            ) : null}
            <div className="in-pass-options">
              {q.options!.map((option) => (
                <button
                  key={option.letter}
                  type="button"
                  className="in-pass-option"
                  data-testid={`in-pass-option-${option.letter}`}
                  aria-pressed={answers[q.qid] === option.letter}
                  disabled={!ready || submitted || remaining <= 0}
                  onClick={() => choose(option.letter)}
                >
                  <Kc hint={false}>{option.letter}</Kc>
                  <span>
                    <MathText>{option.text}</MathText>
                  </span>
                </button>
              ))}
            </div>
            <div className="in-pass-controls">
              <button
                type="button"
                className="in-btn2"
                disabled={current === 0 || submitted}
                onClick={() => move(current - 1)}
              >
                Föregående
              </button>
              <button
                type="button"
                className="in-btn2"
                disabled={current === run.questions.length - 1 || submitted}
                onClick={() => move(current + 1)}
              >
                Nästa
              </button>
            </div>
            {run.flags ? (
              <button
                type="button"
                className="in-btn2"
                data-testid="rd-prov-flag"
                disabled={submitted}
                aria-pressed={flags.includes(q.qid)}
                onClick={() =>
                  setFlags((previous) =>
                    previous.includes(q.qid)
                      ? previous.filter((id) => id !== q.qid)
                      : [...previous, q.qid],
                  )
                }
              >
                {flags.includes(q.qid) ? 'Flaggad · ta bort flagga' : 'Flagga frågan'}
              </button>
            ) : null}
          </section>
        </div>
        <details className="in-pass-navigator" open>
          <summary>
            Frågeöversikt · {answered} besvarade · {unanswered} obesvarade
          </summary>
          <div data-testid="rd-prov-grid" data-pass-grid className="in-pass-grid">
            {run.sections.map((section) => (
              <fieldset key={`${section.section}-${section.start}`}>
                <legend>{section.section}</legend>
                <div>
                  {run.grid.slice(section.start, section.end).map((cell, offset) => {
                    const index = section.start + offset
                    const done = answers[cell.qid] != null
                    const flag = flags.includes(cell.qid)
                    return (
                      <button
                        key={cell.qid}
                        type="button"
                        data-testid={`rd-prov-cell-${cell.n}`}
                        data-answered={String(done)}
                        data-current={String(index === current)}
                        aria-current={index === current ? 'step' : undefined}
                        aria-label={`Fråga ${cell.n}, ${done ? 'besvarad' : 'obesvarad'}${index === current ? ', aktuell' : ''}${flag ? ', flaggad' : ''}`}
                        disabled={submitted}
                        onClick={() => move(index)}
                      >
                        {cell.n}
                        <small>
                          {done ? '✓' : '—'}
                          {flag ? ' ⚑' : ''}
                        </small>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        </details>
        <p className="in-pass-note">
          Svar och flaggor gäller den här visningen.{' '}
          <span className="in-hint">A–E väljer svar · ←/→ byter fråga.</span>
        </p>
      </div>
      {confirm ? (
        <PassDialog
          title={confirm === 'exit' ? 'Avbryta provpasset?' : 'Lämna in provpasset?'}
          cancel={confirm === 'exit' ? 'Fortsätt provpasset' : 'Fortsätt svara'}
          confirm={confirm === 'exit' ? 'Avbryt provpass' : 'Lämna in nu'}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm === 'exit' ? onExit : submit}
        >
          <p>
            {confirm === 'exit'
              ? 'Om du avbryter blir provpasset ogiltigt och får inget resultat. Klockan fortsätter tills du lämnar passet.'
              : `${unanswered} frågor är obesvarade. Efter inlämning kan du inte ändra svaren.`}
          </p>
        </PassDialog>
      ) : null}
    </div>
  )
}

function PassPrompt({ question }: { question: DrillQuestion }) {
  const text = question.prompt ?? ''
  const kva = question.section === 'KVA' ? splitKvaPrompt(text) : null
  const nog = question.section === 'NOG' ? parseNogPrompt(text) : null
  if (kva)
    return (
      <>
        {kva.condition ? (
          <p>
            <MathText>{kva.condition}</MathText>
          </p>
        ) : null}
        <dl className="in-quant-cells">
          <div>
            <dt>Kvantitet I</dt>
            <dd>
              <MathText>{kva.kvI}</MathText>
            </dd>
          </div>
          <div>
            <dt>Kvantitet II</dt>
            <dd>
              <MathText>{kva.kvII}</MathText>
            </dd>
          </div>
        </dl>
      </>
    )
  if (nog)
    return (
      <>
        <p>
          <MathText>{nog.question}</MathText>
        </p>
        <dl className="in-quant-cells">
          <div>
            <dt>(1)</dt>
            <dd>
              <MathText>{nog.statement1}</MathText>
            </dd>
          </div>
          <div>
            <dt>(2)</dt>
            <dd>
              <MathText>{nog.statement2}</MathText>
            </dd>
          </div>
        </dl>
        {nog.tail ? (
          <p>
            <MathText>{nog.tail}</MathText>
          </p>
        ) : null}
      </>
    )
  return text ? (
    <p>
      <MathText>{text}</MathText>
    </p>
  ) : null
}

function PassImage({
  figure,
  onStatus,
}: {
  figure: { src: string; alt: string; width: number; height: number }
  onStatus: (src: string, state: 'ready' | 'error') => void
}) {
  const { src, alt } = figure
  const image = useRef<HTMLImageElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const label = useId()
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [attempt, setAttempt] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const notify = useRef(onStatus)
  notify.current = onStatus
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry mounts a new image to check for a cached load
  useLayoutEffect(() => {
    if (image.current?.complete && image.current.naturalWidth) {
      setState('ready')
      notify.current(src, 'ready')
    }
  }, [src, attempt])
  useEffect(() => {
    if (expanded) dialog.current?.showModal()
  }, [expanded])
  const close = () => {
    dialog.current?.close()
    setExpanded(false)
    trigger.current?.focus()
  }
  const tools = (
    <div className="in-pass-controls">
      <button
        type="button"
        className="in-btn2"
        disabled={zoom <= 1}
        aria-label="Zooma ut"
        onClick={() => setZoom((value) => Math.max(1, value - 0.5))}
      >
        −
      </button>
      <span className="in-num">{zoom * 100} %</span>
      <button
        type="button"
        className="in-btn2"
        disabled={zoom >= 4}
        aria-label="Zooma in"
        onClick={() => setZoom((value) => Math.min(4, value + 0.5))}
      >
        +
      </button>
      <button
        type="button"
        className="in-btn2"
        onClick={() => {
          setZoom(1)
          setRotation(0)
        }}
      >
        Anpassa
      </button>
      <button
        type="button"
        className="in-btn2"
        onClick={() => setRotation((value) => (value + 90) % 360)}
      >
        Rotera
      </button>
    </div>
  )
  const rotated = rotation % 180 !== 0
  const ratio = figure.width / figure.height
  const picture = (modal: boolean) => (
    <section
      className="in-pass-image-scroll"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard scrolling of enlarged source
      tabIndex={0}
      aria-label="Underlag, rulla för att läsa hela figuren"
    >
      <div
        className="in-pass-image-canvas"
        style={{ width: `${zoom * 100}%`, aspectRatio: rotated ? 1 / ratio : ratio }}
      >
        <img
          key={attempt}
          ref={modal ? undefined : image}
          src={`/${src}`}
          alt={alt}
          width={figure.width}
          height={figure.height}
          style={{
            width: `${rotated ? ratio * 100 : 100}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          }}
          onLoad={() => {
            setState('ready')
            notify.current(src, 'ready')
          }}
          onError={() => {
            setState('error')
            notify.current(src, 'error')
          }}
        />
      </div>
    </section>
  )
  return (
    <div data-pass-media className="in-pass-media">
      {tools}
      {state !== 'ready' ? (
        <p role="status">
          {state === 'error' ? 'Underlaget kunde inte hämtas.' : 'Laddar underlaget…'}
        </p>
      ) : null}
      {state === 'error' ? (
        <button
          type="button"
          className="in-btn2"
          onClick={() => {
            setState('loading')
            setAttempt((value) => value + 1)
          }}
        >
          Försök igen
        </button>
      ) : null}
      {picture(false)}
      <button ref={trigger} type="button" className="in-btn2" onClick={() => setExpanded(true)}>
        Förstora figur
      </button>
      {expanded ? (
        <dialog
          ref={dialog}
          className="in-pass-dialog in-pass-figure-dialog"
          aria-labelledby={label}
          onCancel={(event) => {
            event.preventDefault()
            close()
          }}
        >
          <div className="in-pass-controls">
            <h2 id={label}>Underlag</h2>
            <button type="button" className="in-btn2" onClick={close}>
              Stäng figur
            </button>
          </div>
          {tools}
          {picture(true)}
        </dialog>
      ) : null}
    </div>
  )
}

export function RelatedPasses({
  rows,
  title,
  contract = false,
}: {
  rows: ProvResultSummaryView[]
  title: string
  contract?: boolean
}) {
  const { actions } = useDirectionData()
  return (
    <section
      className="in-pass-section"
      data-testid={contract ? 'rd-prov-history' : undefined}
      aria-label={title}
    >
      <h2 className="in-cell-head">{title}</h2>
      {rows.length ? (
        <ul className="in-pass-history">
          {rows.map((row, index) => (
            <li
              key={row.id}
              data-testid={contract ? `rd-prov-history-item-${index + 1}` : undefined}
            >
              <button
                type="button"
                className="in-hub-door"
                onClick={() => actions.openProvResult(row.id)}
              >
                <span>
                  <b>
                    {row.sitting ?? (row.mode === 'synthetic' ? 'Genererat pass' : 'Provpass')} ·{' '}
                    {row.pass ?? halfName(row.half)}
                  </b>
                  <span>
                    {row.when} · {row.mode === 'authentic' ? 'Riktigt pass' : 'Genererat pass'}
                  </span>
                </span>
                <span className="in-num">
                  {row.correct}/{row.presented} rätt
                </span>
                <span>Öppna resultat →</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="in-pass-note">Inga tidigare pass av samma sort.</p>
      )}
    </section>
  )
}

export function InstrumentProvResult() {
  const { data, actions } = useDirectionData()
  const result = data.provpass.result
  const nominal = data.provpass.hub.halves.find((half) => half.half === result.half)?.questions
  const missing = nominal == null ? 0 : Math.max(0, nominal - result.presented)
  const measured = result.sections.filter((section) => section.presented > 0)
  const weakest =
    measured.length > 1
      ? [...measured].sort((a, b) => a.correct / a.presented - b.correct / b.presented)[0]
      : null
  const target = result.trap?.section ?? weakest?.section
  return (
    <div className="in-hub" data-testid="rd-prov-result">
      <button type="button" className="in-btn2" onClick={() => actions.go('provpass')}>
        Till Provpass
      </button>
      <header className="in-greet">
        <p>
          {result.sitting ?? (result.mode === 'synthetic' ? 'Genererat pass' : 'Provpass')} ·{' '}
          {result.pass ?? halfName(result.half)}
        </p>
        <h1 tabIndex={-1}>Provpasset klart</h1>
      </header>
      <section className="in-directory" aria-label="Resultat">
        <div className="in-hub-lead in-result-receipt">
          <div className="in-queue-readouts">
            <Readout label="Rätt" value={`${result.correct}`} unit={`av ${result.presented}`} />
            <Readout label="Besvarade" value={`${result.answered}`} />
            <Readout
              label="Obesvarade"
              value={`${Math.max(0, result.presented - result.answered)}`}
            />
          </div>
          {missing ? (
            <p>
              {missing} {missing === 1 ? 'fråga saknas' : 'frågor saknas'} i källan — rättat av{' '}
              {result.presented}.
            </p>
          ) : null}
          <div className="in-score-provenance" data-testid="rd-prov-score">
            <Readout
              label={
                result.score.derived === 'official-derived' ? 'Normerat, härlett' : 'Skattad poäng'
              }
              value={
                result.presented > 0 && result.score.value != null
                  ? fmtScore(result.score.value)
                  : '—'
              }
              unit="av 2,0"
            />
            <p>
              {result.score.derived === 'official-derived'
                ? 'UHR normerar en halva med 80 frågor. Ett pass med 40 frågor skalas upp; poängen är härledd, inte ett officiellt resultat för det här passet.'
                : 'Linjär skattning — indikativ, inte UHR-normerad.'}
            </p>
            {result.mode === 'synthetic' && result.half === 'verbal' ? (
              <p>{data.copy.estimateCaveat}</p>
            ) : null}
            {result.presented === 0 || result.score.value == null ? (
              <p>Poäng kan inte beräknas med det här underlaget.</p>
            ) : null}
          </div>
          <button
            type="button"
            className="in-btn"
            onClick={() =>
              target ? actions.startDrill({ kind: 'section', section: target }) : actions.go('ova')
            }
          >
            {target ? `Öva ${target}` : 'Till Öva'}
          </button>
        </div>
        <table className="in-evidence-table">
          <caption>Delprovens resultat och tid</caption>
          <thead>
            <tr>
              <th scope="col">Delprov</th>
              <th scope="col">Rätt</th>
              <th scope="col">Tid</th>
              <th scope="col">Riktmärke</th>
              <th scope="col">Avläsning</th>
            </tr>
          </thead>
          <tbody>
            {result.sections.map((section) => (
              <tr
                key={section.section}
                data-testid={`rd-prov-section-${sectionSlug(section.section)}`}
              >
                <th scope="row">{section.section}</th>
                <td data-label="Rätt">
                  {section.correct}/{section.presented}
                </td>
                <td data-label="Tid">{fmtClock(section.timeSeconds)}</td>
                <td data-label="Riktmärke">{fmtClock(section.quotaSeconds)}</td>
                <td data-label="Avläsning">
                  {section.timeSeconds > section.quotaSeconds
                    ? 'Över riktmärket'
                    : 'Inom riktmärket'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="in-pass-note">
          Riktmärket är en proportionell del av passets tid, ingen obligatorisk delprovstid.
        </p>
        <div className="in-pass-band">
          <Readout
            label="Sett tidigare"
            value={`${result.seenBefore}`}
            unit={`av ${result.presented}`}
          />
          <p>Exponeringen gäller det här passet när det startades.</p>
        </div>
        {result.trap ? (
          <div className="in-pass-band">
            <h2>
              {result.trap.headline ??
                data.frameworks[result.trap.frameworkId] ??
                'En återkommande fälla'}
            </h2>
            <p>
              {result.trap.count} missar · {result.trap.section}
            </p>
            <button
              type="button"
              className="in-btn2"
              onClick={() => actions.openLesson(result.trap!.frameworkId)}
            >
              Läs {data.frameworks[result.trap.frameworkId] ?? 'om fällan'}
            </button>
          </div>
        ) : null}
        {data.repetera.dueNow > 0 ? (
          <button type="button" className="in-hub-door" onClick={actions.openRepetera}>
            Repetera · {data.repetera.dueNow} redo nu →
          </button>
        ) : null}
      </section>
      <RelatedPasses
        contract
        rows={result.history.filter(
          (row) => row.half === result.half && row.mode === result.mode && row.id !== result.id,
        )}
        title="Tidigare pass av samma sort"
      />
    </div>
  )
}
