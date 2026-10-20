import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { type DirectionProps, fmtClock, fmtScore } from '@/components/devbake/redesign/r1Kit'
import type {
  DrillOptionFigure,
  DrillQuestion,
  Half,
  ProvResultSummaryView,
  ProvRunningView,
} from '@/components/devbake/redesign/viewModel'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import type { AnswerLetter } from '@/data/questions'
import { parseNogPrompt } from '@/lib/nogPrompt'
import { RasterDialog, rasterSlug } from './RasterParts'

export function RasterProvpass({
  live,
  width,
  activePass,
  onActivePass,
  onTimedPassChange,
}: Pick<DirectionProps, 'live' | 'width'> & {
  activePass: string | null
  onActivePass: (id: string | null) => void
  onTimedPassChange: (active: boolean) => void
}) {
  const { data, actions } = useDirectionData()
  const { hub, running } = data.provpass
  const [half, setHalf] = useState<Half>(hub.half)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const selected = hub.passes.find((pass) => pass.id === confirmId)
  const halfView = hub.halves.find((item) => item.half === half)
  const passes = hub.passes.filter((pass) => pass.half === half)
  const suggested = passes.find((pass) => pass.suggested && pass.presented > 0)
  const abandon = () => {
    onActivePass(null)
    actions.go('provpass')
  }
  if (activePass) {
    if (activePass !== running.passId)
      return (
        <section className="ra-register-page">
          <h1>Passet är inte tillgängligt än</h1>
          <p>Frågorna för det valda passet har inte kommit fram.</p>
          <button type="button" className="ra-outline" onClick={abandon}>
            Till Provpass
          </button>
        </section>
      )
    return (
      <RasterRunner
        key={`${running.passId}:${running.sitting}`}
        run={running}
        live={live}
        width={width}
        onAbandon={abandon}
        onTimedPassChange={onTimedPassChange}
      />
    )
  }
  return (
    <div className="ra-register-page">
      <header className="ra-register-heading">
        <div>
          <p className="ra-label">03 / Provpass</p>
          <h1>Öva under provtid.</h1>
        </div>
        <p>Riktiga prov · en halva i taget</p>
      </header>
      <fieldset className="ra-half-selector" aria-label="Provhalva">
        {hub.halves.map((item) => (
          <button
            key={item.half}
            type="button"
            data-testid={`rd-prov-half-${item.half}`}
            aria-pressed={half === item.half}
            onClick={() => setHalf(item.half)}
          >
            <strong>{item.label}</strong>
            <span>
              {item.minutes} min · {item.questions} frågor
            </span>
            <small>
              {item.sections.map((section) => `${section.section} ${section.count}`).join(' · ')}
            </small>
          </button>
        ))}
      </fieldset>
      {suggested ? (
        <button
          type="button"
          className="ra-pass-lead ra-primary"
          data-testid="rd-prov-start"
          onClick={() => setConfirmId(suggested.id)}
        >
          <span>
            <small>Minst sett · {halfView?.label}</small>
            <strong>Välj föreslaget pass</strong>
            <span>
              {suggested.sitting} · {suggested.pass} · {suggested.presented} frågor ·{' '}
              {suggested.seenBefore} sedda tidigare
            </span>
          </span>
          <span aria-hidden>↗</span>
        </button>
      ) : null}
      <section className="ra-ledger-section" aria-label="Tillgängliga provpass">
        <header className="ra-section-heading">
          <h2>Passregistret</h2>
          <span>{passes.length} pass</span>
        </header>
        {passes.length ? (
          <ul className="ra-pass-list">
            {passes.map((pass) => (
              <li key={pass.id} data-testid={`rd-prov-pass-${rasterSlug(pass.id)}`}>
                <span>
                  <strong>{pass.sitting}</strong>
                  <span>
                    {pass.pass} · {pass.suggested ? 'Föreslaget' : 'Riktigt prov'}
                  </span>
                </span>
                <span>
                  {pass.presented} av {halfView?.questions ?? 40} frågor tillgängliga
                  <small>{pass.seenBefore} sedda tidigare</small>
                </span>
                <button
                  type="button"
                  disabled={!pass.presented}
                  aria-label={`Välj ${pass.sitting}, ${pass.pass}`}
                  onClick={() => setConfirmId(pass.id)}
                >
                  Välj ↗
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="ra-empty">Inga pass tillgängliga för den här halvan.</p>
        )}
      </section>
      <div className="ra-register-columns">
        <section className="ra-ledger-section">
          <header className="ra-section-heading">
            <h2>Innan du börjar</h2>
          </header>
          <ol className="ra-pass-rules">
            {hub.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>
        <section className="ra-ledger-section">
          <header className="ra-section-heading">
            <h2>Tidigare provpass</h2>
          </header>
          <PassHistory rows={hub.results} />
        </section>
      </div>
      {confirmId ? (
        <RasterDialog title="Starta provpass?" onClose={() => setConfirmId(null)}>
          {selected ? (
            <>
              <p>
                <strong>
                  {selected.sitting} · {selected.pass}
                </strong>
              </p>
              <p>
                {selected.presented} av{' '}
                {hub.halves.find((item) => item.half === selected.half)?.questions ?? 40} frågor
                tillgängliga ·{' '}
                {hub.halves.find((item) => item.half === selected.half)?.minutes ?? 55} minuter.
              </p>
              <p>{selected.seenBefore} frågor sedda tidigare.</p>
              <ol className="ra-pass-rules">
                {hub.rules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ol>
              <p>Ingen paus. Inget facit före inlämning. Inga poängavdrag för fel svar.</p>
            </>
          ) : (
            <p>Passet är inte längre tillgängligt. Välj ett annat i registret.</p>
          )}
          <footer className="ra-modal-actions">
            <button type="button" onClick={() => setConfirmId(null)}>
              Tillbaka
            </button>
            <button
              type="button"
              className="ra-primary"
              data-testid="rd-confirm"
              disabled={!selected?.presented}
              onClick={() => {
                if (!selected?.presented || !live) return
                onActivePass(selected.id)
                setConfirmId(null)
                actions.startProvpass(selected.id)
              }}
            >
              Starta nu ↗
            </button>
          </footer>
        </RasterDialog>
      ) : null}
    </div>
  )
}

type ImageStatus = 'loading' | 'ready' | 'error'
type ReportImage = (id: string, state: ImageStatus | null) => void

function PassImage({
  figure,
  imageId,
  report,
}: {
  figure: DrillOptionFigure
  imageId: string
  report?: ReportImage
}) {
  const ref = useRef<HTMLImageElement>(null)
  const [attempt, setAttempt] = useState(0)
  const [failed, setFailed] = useState(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: each retry mounts a new image that must reconcile cached readiness
  useLayoutEffect(() => {
    const img = ref.current
    const state = img?.complete ? (img.naturalWidth > 0 ? 'ready' : 'error') : 'loading'
    setFailed(state === 'error')
    report?.(imageId, state)
    return () => report?.(imageId, null)
  }, [report, imageId, attempt])
  return (
    <div className="ra-pass-image">
      <img
        key={attempt}
        ref={ref}
        src={`/${figure.src.replace(/^\/+/, '')}`}
        alt={figure.alt}
        width={figure.width}
        height={figure.height}
        onLoad={() => {
          setFailed(false)
          report?.(imageId, 'ready')
        }}
        onError={() => {
          setFailed(true)
          report?.(imageId, 'error')
        }}
      />
      {failed ? (
        <div role="status">
          <p>Bilden kunde inte visas.</p>
          <button
            type="button"
            className="ra-outline"
            onClick={() => {
              report?.(imageId, 'loading')
              setFailed(false)
              setAttempt((value) => value + 1)
            }}
          >
            Försök ladda bilden igen
          </button>
        </div>
      ) : null}
    </div>
  )
}

function PassFigure({
  figure,
  report,
  open,
  onViewer,
}: {
  figure: NonNullable<DrillQuestion['figure']>
  report: ReportImage
  open: boolean
  onViewer: (open: boolean) => void
}) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const changeOpen = (value: boolean) => {
    onViewer(value)
  }
  return (
    <figure className="ra-pass-figure">
      <div className="ra-figure-tools">
        <button type="button" onClick={() => changeOpen(true)}>
          Förstora underlaget ↗
        </button>
      </div>
      <PassImage key={figure.src} figure={figure} imageId={`main:${figure.src}`} report={report} />
      <figcaption>{figure.alt}</figcaption>
      {open ? (
        <RasterDialog title="Underlaget" onClose={() => changeOpen(false)}>
          <div className="ra-figure-tools">
            <button
              type="button"
              disabled={scale <= 1}
              onClick={() => setScale(Math.max(1, scale - 0.5))}
            >
              Zooma ut
            </button>
            <span>{Math.round(scale * 100)}%</span>
            <button
              type="button"
              disabled={scale >= 4}
              onClick={() => setScale(Math.min(4, scale + 0.5))}
            >
              Zooma in
            </button>
            <button type="button" onClick={() => setRotation((rotation + 180) % 360)}>
              Rotera 180°
            </button>
            <button
              type="button"
              onClick={() => {
                setScale(1)
                setRotation(0)
              }}
            >
              Återställ
            </button>
          </div>
          <section
            className="ra-pass-pan"
            data-rd-keyscope
            data-rd-scroll
            // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable figure
            tabIndex={0}
            aria-label="Förstorat underlag, rulla för att läsa"
          >
            <div style={{ width: `${scale * 100}%`, transform: `rotate(${rotation}deg)` }}>
              <PassImage figure={figure} imageId="viewer" />
            </div>
          </section>
          <button type="button" onClick={() => changeOpen(false)}>
            Till frågan
          </button>
        </RasterDialog>
      ) : null}
    </figure>
  )
}

function PassPrompt({ question }: { question: DrillQuestion }) {
  const prompt = question.prompt ?? ''
  const kva = question.section === 'KVA' ? splitKvaPrompt(prompt) : null
  const nog = question.section === 'NOG' ? parseNogPrompt(prompt) : null
  return (
    <div className="ra-pass-prompt" data-testid="rd-prov-prompt">
      {kva ? (
        <>
          <MathText>{kva.condition}</MathText>
          <dl className="ra-givens">
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
      ) : nog ? (
        <>
          <p>
            <MathText>{nog.question}</MathText>
          </p>
          <dl className="ra-givens">
            <div>
              <dt>Påstående (1)</dt>
              <dd>
                <MathText>{nog.statement1}</MathText>
              </dd>
            </div>
            <div>
              <dt>Påstående (2)</dt>
              <dd>
                <MathText>{nog.statement2}</MathText>
              </dd>
            </div>
          </dl>
          {nog.tail ? <MathText>{nog.tail}</MathText> : null}
        </>
      ) : (
        <MathText>{prompt}</MathText>
      )}
    </div>
  )
}

function RasterRunner({
  run,
  live,
  width,
  onAbandon,
  onTimedPassChange,
}: {
  run: ProvRunningView
  live: boolean
  width: DirectionProps['width']
  onAbandon: () => void
  onTimedPassChange: (active: boolean) => void
}) {
  const { data, actions } = useDirectionData()
  const [position, setPosition] = useState(run.current)
  const index = Math.max(0, Math.min(position, run.questions.length - 1))
  useLayoutEffect(() => {
    if (index !== position) setPosition(index)
  }, [index, position])
  const question = run.questions[index]
  const [edits, setEdits] = useState<Partial<Record<string, AnswerLetter>>>({})
  const answers = { ...run.answers, ...edits }
  const [flagEdits, setFlagEdits] = useState<Record<string, boolean>>({})
  const flag = (qid: string) =>
    flagEdits[qid] ??
    (run.flags?.includes(qid) || run.grid.some((cell) => cell.qid === qid && cell.flagged))
  const [gate, setGate] = useState<'submit' | 'abort' | null>(null)
  const [overview, setOverview] = useState(false)
  const [onlyBlank, setOnlyBlank] = useState(false)
  const [viewer, setViewer] = useState(false)
  const [settling, setSettling] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const submitted = useRef(false)
  const [expiredAtEntry] = useState(() => run.remainingSeconds <= 0)
  // Capture expiry once. Provider ticks may shorten, but never extend, it.
  const [deadline] = useState(() => Date.now() + Math.max(0, run.remainingSeconds) * 1000)
  const [now, setNow] = useState(Date.now)
  const remaining = Math.max(0, Math.ceil(Math.min(run.remainingSeconds, (deadline - now) / 1000)))
  useLayoutEffect(() => {
    onTimedPassChange(!expiredAtEntry && !saveFailed)
  }, [expiredAtEntry, saveFailed, onTimedPassChange])
  useEffect(() => {
    if (!live || settling || expiredAtEntry) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [live, settling, expiredAtEntry])
  const submit = useCallback(() => {
    if (submitted.current || !live || expiredAtEntry) return
    submitted.current = true
    setSettling(true)
    setGate(null)
    setOverview(false)
    setViewer(false)
    try {
      // The kit declares void; also retain failures from async provider implementations.
      void Promise.resolve(actions.submitProvpass()).catch(() => setSaveFailed(true))
    } catch {
      setSaveFailed(true)
    }
  }, [actions, live, expiredAtEntry])
  useEffect(() => {
    if (remaining === 0) submit()
  }, [remaining, submit])
  const [images, setImages] = useState<Record<string, ImageStatus>>({})
  const report = useCallback<ReportImage>((id, status) => {
    setImages((old) => {
      if (old[id] === status || (status === null && !(id in old))) return old
      const next = { ...old }
      if (status === null) delete next[id]
      else next[id] = status
      return next
    })
  }, [])
  const required = question
    ? [
        ...(question.figure ? [`main:${question.figure.src}`] : []),
        ...(question.options?.flatMap((option) =>
          option.figure ? [`${question.qid}:${option.letter}:${option.figure.src}`] : [],
        ) ?? []),
      ]
    : []
  const complete =
    !!question?.options?.length &&
    (question.section !== 'DTK' || !!question.figure) &&
    (!!question.prompt?.trim() || !!question.passage)
  const ready = complete && required.every((id) => images[id] === 'ready')
  const blocked = !live || settling || !!gate || overview || viewer
  const choose = (letter: AnswerLetter) => {
    if (blocked || !ready || !question?.options?.some((option) => option.letter === letter)) return
    setEdits((old) => ({ ...old, [question.qid]: letter }))
  }
  const move = (next: number) => {
    setViewer(false)
    setPosition(Math.max(0, Math.min(next, run.questions.length - 1)))
  }
  const advance = () => {
    if (index < run.questions.length - 1) move(index + 1)
    else setOverview(true)
  }
  useEffect(() => {
    if (!live || saveFailed || expiredAtEntry) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const hostKey =
        /^[0-8]$/.test(event.key) || event.key === 'ArrowLeft' || event.key === 'ArrowRight'
      // Consume host shortcuts even on buttons and grid cells; leave scroll defaults intact.
      if (hostKey) event.preventDefault()
      const pane = target?.closest<HTMLElement>('[data-rd-scroll]')
      if (pane && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        pane.scrollLeft += event.key === 'ArrowRight' ? 40 : -40
        return
      }
      if (blocked || event.altKey || event.ctrlKey || event.metaKey || event.repeat) return
      if (
        target?.closest(
          'input, textarea, select, [contenteditable="true"], dialog, [data-rd-scroll]',
        )
      ) {
        return
      }
      const letter = event.key.toUpperCase() as AnswerLetter
      if (/^[A-E]$/.test(letter)) {
        event.preventDefault()
        choose(letter)
        return
      }
      if (target?.closest('button, a, summary')) return
      if (event.key === 'ArrowLeft') move(index - 1)
      else if (event.key === 'ArrowRight') move(index + 1)
      else if ((event.key === 'Enter' || event.key === ' ') && ready) {
        event.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })
  const answered = run.questions.filter((q) => answers[q.qid] != null).length
  const blank = run.questions.length - answered
  const noteId = useId()
  if (expiredAtEntry) {
    return (
      <section className="ra-register-page">
        <h1>Det tidigare passet kan inte återupptas</h1>
        <button type="button" className="ra-outline" onClick={onAbandon}>
          Till Provpass
        </button>
      </section>
    )
  }
  const grid = (
    <div data-testid="rd-prov-grid" className="ra-answer-register">
      {run.questions.map((q, i) => (
        <button
          type="button"
          key={q.qid}
          hidden={onlyBlank && !!answers[q.qid]}
          disabled={settling}
          data-testid={`rd-prov-cell-${i + 1}`}
          data-answered={String(!!answers[q.qid])}
          data-current={String(i === index)}
          aria-current={i === index ? 'step' : undefined}
          aria-label={`Fråga ${i + 1}, ${answers[q.qid] ? `svar ${answers[q.qid]}` : 'obesvarad'}${i === index ? ', aktuell' : ''}${flag(q.qid) ? ', markerad' : ''}`}
          onClick={() => {
            move(i)
            setOverview(false)
          }}
        >
          <b>{String(i + 1).padStart(2, '0')}</b>
          <span>
            {answers[q.qid] ?? '–'}
            {flag(q.qid) ? ' ⚑' : ''}
          </span>
        </button>
      ))}
    </div>
  )
  return (
    <section
      className="ra-timed-pass"
      data-testid="rd-prov-running"
      data-rd-keyscope={saveFailed ? undefined : ''}
      aria-label={saveFailed ? 'Provpass med obekräftad inlämning' : 'Pågående provpass'}
    >
      <header className="ra-pass-bar">
        <button
          type="button"
          data-testid="rd-exit"
          disabled={settling && !saveFailed}
          onClick={() => (saveFailed ? onAbandon() : setGate('abort'))}
        >
          {saveFailed ? 'Lämna provpasset' : 'Avbryt provpass'}
        </button>
        <span>
          <strong>{question ? `Fråga ${index + 1}/${run.questions.length}` : 'Inga frågor'}</strong>
          <small>
            {run.sitting} · {run.pass}
          </small>
        </span>
        <span
          data-testid="rd-prov-timer"
          className="ra-pass-clock"
          role="timer"
          aria-label="Tid kvar"
          aria-live="off"
        >
          {fmtClock(remaining)}
        </span>
        <button
          type="button"
          data-testid="rd-prov-submit"
          disabled={settling}
          onClick={() => setGate('submit')}
        >
          Lämna in
        </button>
      </header>
      {!settling && remaining > 0 && remaining <= 300 ? (
        <p className="ra-time-warning" role="status">
          Högst fem minuter kvar. Lämna svar även om du är osäker.
        </p>
      ) : null}
      {settling ? (
        <p className="ra-time-warning" role="status">
          {saveFailed
            ? 'Inlämningen kunde inte bekräftas. Dina svar finns kvar här.'
            : 'Lämnar in…'}
        </p>
      ) : null}
      {saveFailed ? (
        <div className="ra-time-warning">
          <button type="button" className="ra-outline" onClick={onAbandon}>
            Till Provpass
          </button>
        </div>
      ) : null}
      <section className="ra-register-strip" aria-label="Svarsläge">
        <div className="ra-register-toolbar">
          <span>
            {answered} av {run.questions.length} besvarade
          </span>
          <button type="button" disabled={settling} onClick={() => setOverview(true)}>
            Alla frågor · {blank} obesvarade
          </button>
        </div>
        <p className="ra-label">
          {run.sections
            .filter((section) => section.start < run.questions.length)
            .map(
              (section) =>
                `${section.section} ${section.start + 1}–${Math.min(section.end, run.questions.length)}`,
            )
            .join(' · ')}
        </p>
        {/* Kept in the DOM for the shared grid contract; phone opens it as a modal. */}
        {!overview ? (
          <div className="ra-inline-register" data-phone={String(width === 'phone')}>
            {grid}
          </div>
        ) : null}
      </section>
      <div className="ra-pass-scroll">
        {question ? (
          <div className="ra-pass-workspace">
            <section className="ra-pass-material" aria-label="Frågans underlag">
              <p className="ra-label">
                {question.section} / {question.source.label}
              </p>
              {question.passage ? (
                <>
                  {question.passage.synthetic ? (
                    <div className="ra-pass-disclosure">
                      <span className="ra-label">{data.copy.ovningstextBadge}</span>
                      <details>
                        <summary>Om texten</summary>
                        <p>{data.copy.ovningstextNote}</p>
                      </details>
                    </div>
                  ) : null}
                  <section
                    key={question.passage.unitId ?? question.passage.paragraphs.join('\n')}
                    className="ra-pass-reading"
                    data-rd-keyscope
                    data-rd-scroll
                    // biome-ignore lint/a11y/noNoninteractiveTabindex: keyboard-scrollable reading region
                    tabIndex={0}
                    lang={question.passage.lang}
                    aria-label={question.passage.title ?? 'Lästext'}
                  >
                    {question.passage.title ? <h2>{question.passage.title}</h2> : null}
                    {question.passage.paragraphs.map((text, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: immutable ordered paragraphs may have repeated text
                      <p key={`${i}:${text}`}>
                        <span aria-hidden className="ra-paragraph-number">
                          ¶{i + 1}
                        </span>
                        {text}
                      </p>
                    ))}
                    {question.passage.byline ? (
                      <p className="ra-pass-byline">{question.passage.byline}</p>
                    ) : null}
                  </section>
                </>
              ) : null}
              {question.figure ? (
                <PassFigure
                  key={question.figure.src}
                  figure={question.figure}
                  report={report}
                  open={viewer}
                  onViewer={setViewer}
                />
              ) : null}
              {!question.passage && !question.figure ? <PassPrompt question={question} /> : null}
            </section>
            <section
              className="ra-pass-answer"
              aria-label={settling ? 'Fråga och låsta svar' : 'Fråga och ändringsbara svar'}
            >
              <h1>
                {question.section} · Fråga {index + 1}
              </h1>
              {question.passage || question.figure ? <PassPrompt question={question} /> : null}
              <p id={noteId} className="ra-pass-answer-note">
                {settling
                  ? 'Svaren är låsta efter inlämningen.'
                  : 'Du kan ändra svaret fram till inlämningen.'}
              </p>
              <ol key={question.qid} className="ra-options" aria-label="Svarsalternativ">
                {question.options?.map((option) => (
                  <li
                    key={option.letter}
                    data-selected={String(answers[question.qid] === option.letter)}
                  >
                    <button
                      type="button"
                      className="ra-option"
                      data-testid={`rd-prov-option-${option.letter}`}
                      disabled={!ready || blocked}
                      aria-pressed={answers[question.qid] === option.letter}
                      aria-describedby={noteId}
                      onClick={() => choose(option.letter)}
                    >
                      <kbd>{option.letter}</kbd>
                      <MathText>{option.text}</MathText>
                    </button>
                    {option.figure ? (
                      <PassImage
                        key={option.figure.src}
                        figure={option.figure}
                        imageId={`${question.qid}:${option.letter}:${option.figure.src}`}
                        report={report}
                      />
                    ) : null}
                  </li>
                ))}
              </ol>
              {!complete ? (
                <p role="status">Frågan saknar fullständigt innehåll. Gå till en annan fråga.</p>
              ) : !ready ? (
                <p role="status">
                  {required.some((id) => images[id] === 'error')
                    ? 'Ladda om bilden innan du väljer ett svar.'
                    : 'Bilderna laddas. Vänta med att svara.'}
                </p>
              ) : null}
              {run.flags !== undefined || run.grid.some((cell) => cell.flagged !== undefined) ? (
                <button
                  type="button"
                  data-testid="rd-prov-flag"
                  aria-pressed={!!flag(question.qid)}
                  disabled={blocked}
                  onClick={() =>
                    setFlagEdits((old) => ({ ...old, [question.qid]: !flag(question.qid) }))
                  }
                >
                  {flag(question.qid) ? '⚑ Markerad för återbesök' : 'Markera för återbesök'}
                </button>
              ) : null}
              <footer className="ra-pass-moves">
                <button
                  type="button"
                  disabled={blocked || index === 0}
                  onClick={() => move(index - 1)}
                >
                  ← Föregående
                </button>
                <button type="button" className="ra-primary" disabled={blocked} onClick={advance}>
                  {index < run.questions.length - 1 ? 'Nästa fråga →' : 'Granska och lämna in'}
                </button>
              </footer>
            </section>
          </div>
        ) : (
          <p className="ra-empty">
            Inga frågor finns i det här passet. Avbryt för att återgå till registret.
          </p>
        )}
      </div>
      {overview ? (
        <RasterDialog title="Alla frågor" onClose={() => setOverview(false)}>
          <p>
            {blank} obesvarade av {run.questions.length} visade frågor.
          </p>
          <button type="button" aria-pressed={onlyBlank} onClick={() => setOnlyBlank(!onlyBlank)}>
            {onlyBlank ? 'Visa alla frågor' : 'Visa obesvarade'}
          </button>
          {grid}
          <footer className="ra-modal-actions">
            <button type="button" onClick={() => setOverview(false)}>
              Fortsätt provpasset
            </button>
            <button
              type="button"
              className="ra-primary"
              disabled={settling}
              onClick={() => {
                setOverview(false)
                setGate('submit')
              }}
            >
              Lämna in
            </button>
          </footer>
        </RasterDialog>
      ) : null}
      {gate ? (
        <RasterDialog
          title={gate === 'submit' ? 'Lämna in provpasset?' : 'Avbryt provpasset?'}
          onClose={() => setGate(null)}
        >
          <p>
            {gate === 'submit'
              ? `${blank} obesvarade av ${run.questions.length} visade frågor. Efter inlämning kan du inte ändra svaren.`
              : 'Passet blir ogiltigt om du avbryter. Det går inte att pausa.'}
          </p>
          <footer className="ra-modal-actions">
            <button type="button" onClick={() => setGate(null)}>
              Fortsätt provpasset
            </button>
            <button
              type="button"
              className="ra-primary"
              data-testid="rd-confirm"
              disabled={settling}
              onClick={gate === 'submit' ? submit : onAbandon}
            >
              {gate === 'submit' ? 'Lämna in nu' : 'Avbryt utan resultat'}
            </button>
          </footer>
        </RasterDialog>
      ) : null}
    </section>
  )
}

function PassHistory({ rows, testId }: { rows: ProvResultSummaryView[]; testId?: string }) {
  const { actions } = useDirectionData()
  return (
    <div data-testid={testId}>
      {rows.length ? (
        <ul className="ra-pass-history">
          {rows.map((row, i) => (
            <li key={row.id} data-testid={testId ? `${testId}-item-${i + 1}` : undefined}>
              <button type="button" onClick={() => actions.openProvResult(row.id)}>
                <span>
                  <strong>
                    {row.sitting ?? (row.mode === 'synthetic' ? 'Sammansatt pass' : 'Provpass')}
                    {row.pass ? ` · ${row.pass}` : ''}
                  </strong>
                  <small>
                    {row.when} · {row.half === 'verbal' ? 'Verbal' : 'Kvantitativ'} ·{' '}
                    {row.mode === 'authentic' ? 'Riktigt prov' : 'Sammansatt'}
                  </small>
                </span>
                <span>
                  {row.correct}/{row.presented}
                  <small>
                    {row.score == null
                      ? 'Poäng saknas'
                      : `${fmtScore(row.score)} poäng (se resultatet)`}
                  </small>
                  <span aria-hidden> ↗</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="ra-empty">Inga tidigare provpass.</p>
      )}
    </div>
  )
}

export function RasterProvResult() {
  const { data, actions } = useDirectionData()
  const result = data.provpass.result
  return (
    <article className="ra-register-page" data-testid="rd-prov-result">
      <button type="button" className="ra-back" onClick={() => actions.go('provpass')}>
        ← Till Provpass
      </button>
      <header className="ra-register-heading">
        <div>
          <p className="ra-label">03 / Provpassresultat</p>
          <h1>Provpasset klart.</h1>
        </div>
        <p>
          {result.sitting ?? 'Sammansatt pass'}
          {result.pass ? ` · ${result.pass}` : ''}
          <br />
          {result.half === 'verbal' ? 'Verbal' : 'Kvantitativ'} ·{' '}
          {result.mode === 'authentic' ? 'Riktigt prov' : 'Sammansatt'}
        </p>
      </header>
      <div className="ra-result-top">
        <section>
          <p className="ra-display">
            {result.correct}
            <small>/{result.presented}</small>
          </p>
          <p>Rätt av visade frågor</p>
          <p>
            {Math.max(0, result.presented - result.answered)} obesvarade · {result.seenBefore} sedda
            tidigare
          </p>
        </section>
        <section className="ra-result-basis" data-testid="rd-prov-score">
          <p className="ra-label">{result.score.label}</p>
          <p className="ra-derived-score">
            {result.score.value == null ? 'Poängen saknas' : fmtScore(result.score.value)}
          </p>
          <p>
            {result.score.derived === 'official-derived'
              ? 'Härlett ur UHR:s normeringstabell för detta provtillfälle. Tabellen gäller den 80 frågor långa halvan; resultatet från det här passet skalas till den. Detta är inte en officiell poäng för passet.'
              : 'Linjär skattning — indikativ, inte UHR-normerad.'}
          </p>
        </section>
      </div>
      <button
        type="button"
        className="ra-primary ra-register-primary"
        onClick={() => actions.go('ova')}
      >
        Till Öva <span aria-hidden>↗</span>
      </button>
      <section className="ra-ledger-section">
        <table className="ra-result-table">
          <caption>Sektioner · rätt och tidsfördelning</caption>
          <thead>
            <tr>
              <th scope="col">Sektion</th>
              <th scope="col">Rätt / visade</th>
              <th scope="col">Tid / budget</th>
            </tr>
          </thead>
          <tbody>
            {result.sections.map((section) => (
              <tr
                key={section.section}
                data-testid={`rd-prov-section-${rasterSlug(section.section)}`}
              >
                <th scope="row">{section.section}</th>
                <td>
                  {section.correct}/{section.presented}
                </td>
                <td>
                  {fmtClock(section.timeSeconds)} / {fmtClock(section.quotaSeconds)}
                  {section.timeSeconds > section.quotaSeconds ? (
                    <small>Över tidsbudgeten</small>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {result.trap ? (
        <section className="ra-ledger-section">
          <header className="ra-section-heading">
            <h2>En återkommande fälla</h2>
          </header>
          <p>
            {result.trap.headline ??
              data.frameworks[result.trap.frameworkId] ??
              result.trap.section}{' '}
            · {result.trap.count} missar
          </p>
          <button type="button" onClick={() => actions.openLesson(result.trap!.frameworkId)}>
            Läs om fällan ↗
          </button>
        </section>
      ) : null}
      <section className="ra-ledger-section">
        <header className="ra-section-heading">
          <h2>Tidigare jämförbara pass</h2>
        </header>
        <p className="ra-history-note">
          Samma halva och provtyp. Öppna ett resultat för poängens beräkningsgrund.
        </p>
        <PassHistory
          rows={result.history.filter(
            (row) => row.half === result.half && row.mode === result.mode,
          )}
          testId="rd-prov-history"
        />
      </section>
    </article>
  )
}
