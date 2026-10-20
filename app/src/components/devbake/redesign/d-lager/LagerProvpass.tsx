import { ArrowRight, ChevronRight, Flag, X } from 'lucide-react'
import { type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtClock, fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type {
  Half,
  ProvResultSummaryView,
  ProvRunningView,
} from '@/components/devbake/redesign/viewModel'
import { MathText } from '@/components/MathText'
import type { AnswerLetter } from '@/data/questions'
import { useRequiredImages } from './LagerDrill'
import { Hub, type HubProps } from './LagerOva'
import { Figure, QuantPrompt } from './LagerQuant'

const slug = (id: string) =>
  id.toLowerCase().replace(/[:_]/g, '-').replace('ä', 'a').replace('ö', 'o')

/** Opaque commitment surface; native modality supplies trapping and inertness. */
function Confirm({
  title,
  accept,
  children,
  onAccept,
  onCancel,
}: {
  title: string
  accept: string
  children: ReactNode
  onAccept: () => void
  onCancel: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const previous = document.activeElement
    dialog.current?.showModal()
    cancel.current?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])
  return (
    <dialog
      className="la-confirm"
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <h2 className="la-h" id={titleId}>
        {title}
      </h2>
      <div className="la-confirm-body">{children}</div>
      <div className="la-confirm-actions">
        <button type="button" className="la-quiet" ref={cancel} onClick={onCancel}>
          Tillbaka
        </button>
        <button type="button" className="la-btn" data-testid="rd-confirm" onClick={onAccept}>
          {accept}
        </button>
      </div>
    </dialog>
  )
}

export function LagerProvpass(
  props: HubProps & { onStart: (id: string) => void; pending: string | null; onCancel: () => void },
) {
  const { data } = useDirectionData()
  const { hub } = data.provpass
  const [half, setHalf] = useState<Half>(hub.half)
  const [picked, setPicked] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)
  const passes = hub.passes.filter((pass) => pass.half === half)
  const candidate =
    passes.find((pass) => pass.id === picked) ?? passes.find((pass) => pass.suggested) ?? passes[0]
  const definition = hub.halves.find((item) => item.half === half)
  return (
    <Hub {...props} title="Provpass">
      <fieldset className="la-seg la-pass-halves">
        <legend className="la-sr">Välj provhalva</legend>
        {hub.halves.map((item) => (
          <button
            type="button"
            key={item.half}
            data-testid={`rd-prov-half-${item.half}`}
            aria-pressed={half === item.half}
            onClick={() => {
              setHalf(item.half)
              setPicked(null)
            }}
          >
            {item.label}
          </button>
        ))}
      </fieldset>
      {props.pending ? (
        <section className="la-sheet la-pass-candidate" data-depth="2">
          <h2 className="la-h">Väntar på provpasset</h2>
          <p role="status">Frågorna för det valda passet är inte tillgängliga än.</p>
          <button type="button" className="la-quiet" onClick={props.onCancel}>
            Tillbaka till provpassen
          </button>
        </section>
      ) : (
        <div className="la-hub-grid la-pass-hub">
          <section
            className={`la-sheet la-pass-candidate${props.live ? ' la-rise' : ''}`}
            data-depth="2"
          >
            <span className="la-chip">Riktigt prov · {definition?.label ?? half}</span>
            {candidate ? (
              <>
                <h2 className="la-resume-title">
                  {candidate.sitting}
                  <br />
                  {candidate.pass}
                </h2>
                <p className="la-pass-duration">
                  {candidate.presented} frågor{definition ? ` · ${definition.minutes} min` : ''}
                </p>
                {definition && candidate.presented < definition.questions ? (
                  <p>
                    {candidate.presented} av {definition.questions} frågor tillgängliga.
                  </p>
                ) : null}
                <p>
                  {candidate.seenBefore} av {candidate.presented} frågor har du sett tidigare.
                </p>
                {candidate.suggested ? (
                  <p className="la-caveat">Förslag utifrån vad du har sett tidigare.</p>
                ) : null}
                <ul className="la-composition">
                  {definition?.sections.map((s) => (
                    <li key={s.section}>
                      <b>{s.section}</b> {s.count} frågor i ett fullständigt pass
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="la-btn"
                  data-testid="rd-prov-start"
                  disabled={!candidate.presented}
                  onClick={() => setConfirm(true)}
                >
                  Välj provpass <ArrowRight size={18} aria-hidden />
                </button>
              </>
            ) : (
              <>
                <h2 className="la-h">Inga provpass tillgängliga för det här valet</h2>
                <p>Välj en annan provhalva ovan.</p>
              </>
            )}
          </section>
          <section className="la-sheet la-pass-archive" data-depth="1" aria-label="Provtillfällen">
            <h2 className="la-h">Provtillfällen</h2>
            <ul>
              {passes.map((pass) => (
                <li key={pass.id}>
                  <button
                    type="button"
                    className="la-pass-choice"
                    data-testid={`rd-prov-pass-${slug(pass.id)}`}
                    aria-pressed={candidate?.id === pass.id}
                    onClick={() => setPicked(pass.id)}
                  >
                    <span>
                      <b>
                        {pass.sitting} · {pass.pass}
                      </b>
                      <span>
                        {pass.seenBefore} av {pass.presented} sedda tidigare
                      </span>
                    </span>
                    <ChevronRight size={18} aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          </section>
          <section className="la-sheet la-pass-rules" data-depth="1">
            <h2 className="la-h">Innan du börjar</h2>
            <ul>
              {hub.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
      <section className="la-sheet la-pass-history" data-depth="1" aria-label="Tidigare provpass">
        <h2 className="la-h">Tidigare provpass</h2>
        <ResultHistory rows={hub.results} />
      </section>
      {confirm && candidate ? (
        <Confirm
          title={`${candidate.sitting} · ${candidate.pass}`}
          accept="Starta provpass"
          onCancel={() => setConfirm(false)}
          onAccept={() => {
            setConfirm(false)
            props.onStart(candidate.id)
          }}
        >
          <p>
            {candidate.presented} frågor{definition ? ` · ${definition.minutes} minuter` : ''} ·{' '}
            {candidate.seenBefore} sedda tidigare
          </p>
          {definition && candidate.presented < definition.questions ? (
            <p>
              {candidate.presented} av {definition.questions} frågor tillgängliga.
            </p>
          ) : null}
          <ul>
            {hub.rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </Confirm>
      ) : null}
    </Hub>
  )
}

/** Local preview of the supplied running snapshot. The host owns durable settlement. */
export function LagerProvRunner({
  run,
  width,
  live,
  onAbort,
}: {
  run: ProvRunningView
  width: WidthKey
  live: boolean
  onAbort: () => void
}) {
  const { data, actions } = useDirectionData()
  const [index, setIndex] = useState(Math.max(0, Math.min(run.current, run.questions.length - 1)))
  const [answers, setAnswers] = useState(run.answers)
  const [flags, setFlags] = useState(run.flags)
  const [gate, setGate] = useState<'submit' | 'abort' | null>(null)
  const [viewer, setViewer] = useState(false)
  const [note, setNote] = useState(false)
  const [remaining, setRemaining] = useState(Math.max(0, run.remainingSeconds))
  const [settlement, setSettlement] = useState<'active' | 'pending' | 'failed'>('active')
  const settled = useRef(false)
  const [deadline] = useState(() => Date.now() + run.remainingSeconds * 1000)
  const expiredOnEntry = run.remainingSeconds <= 0
  const heading = useRef<HTMLHeadingElement>(null)
  const gridToggle = useRef<HTMLDetailsElement>(null)
  const q = run.questions[index]
  // The empty guard still follows the same hook order.
  const images = useRequiredImages(q ?? { figure: null, options: null })
  const submit = () => {
    if (settled.current) return
    settled.current = true
    setGate(null)
    setSettlement('pending')
    try {
      actions.submitProvpass()
    } catch {
      setSettlement('failed')
      // Recovery needs a deliberate retry; the clock never retries on its own.
    }
  }
  const submitRef = useRef(submit)
  submitRef.current = submit
  useEffect(() => {
    if (!live || expiredOnEntry || settlement !== 'active') return
    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setRemaining(left)
      if (left === 0) submitRef.current()
    }
    const timer = window.setInterval(tick, 1000)
    return () => window.clearInterval(timer)
  }, [deadline, live, expiredOnEntry, settlement])
  // biome-ignore lint/correctness/useExhaustiveDependencies: focus only when the question changes
  useEffect(() => {
    heading.current?.focus({ preventScroll: true })
    setNote(false)
  }, [index])
  const unlocked = settlement === 'active' && remaining > 0 && (!live || Date.now() < deadline)
  const canInteract = () => {
    if (settled.current || settlement !== 'active' || remaining <= 0) return false
    // Browsers throttle background timers. Check the deadline at input time too.
    if (live && Date.now() >= deadline) {
      submit()
      return false
    }
    return true
  }
  const askGate = (which: 'submit' | 'abort') => {
    if (canInteract()) setGate(which)
  }
  const pick = (letter: AnswerLetter) => {
    if (canInteract() && !images.blocked && q?.options?.some((o) => o.letter === letter))
      setAnswers((old) => ({ ...old, [q.qid]: letter }))
  }
  const move = (next: number) => {
    if (!canInteract()) return
    setIndex(Math.max(0, Math.min(run.questions.length - 1, next)))
    if (width === 'phone' && gridToggle.current) gridToggle.current.open = false
    heading.current?.focus({ preventScroll: true })
  }
  const keys: Record<string, () => void> = {
    ArrowLeft: () => move(index - 1),
    ArrowRight: () => move(index + 1),
    Enter: () => (index + 1 < run.questions.length ? move(index + 1) : askGate('submit')),
    ' ': () => (index + 1 < run.questions.length ? move(index + 1) : askGate('submit')),
  }
  for (const o of q?.options ?? []) keys[o.letter.toLowerCase()] = () => pick(o.letter)
  useKeyMap(keys, live && unlocked && !gate && !viewer && Boolean(q))
  const answered = run.questions.filter((item) => answers[item.qid] != null).length
  const blanks = run.questions.length - answered
  if (!q || expiredOnEntry)
    return (
      <div className="la-done-wrap">
        <section className="la-sheet la-done" data-depth="2">
          <h1>
            {expiredOnEntry ? 'Tiden för provpasset har gått ut.' : 'Frågorna kunde inte visas.'}
          </h1>
          <p>
            {expiredOnEntry
              ? 'Det finns inget återställt resultat att visa.'
              : 'Gå tillbaka och välj ett tillgängligt provpass.'}
          </p>
          <button type="button" className="la-btn" data-testid="rd-exit" onClick={onAbort}>
            Till Provpass
          </button>
        </section>
      </div>
    )
  return (
    <div className="la-prov-run" data-testid="rd-prov-running">
      <header className="la-prov-controls">
        <div className="la-pill la-glass">
          <button
            type="button"
            className="la-pill-btn"
            data-testid="rd-exit"
            disabled={settlement !== 'active'}
            onClick={() => askGate('abort')}
          >
            <X size={16} aria-hidden />
            Avbryt
          </button>
        </div>
        <div className="la-pill la-glass">
          <span className="la-pill-text">
            {index + 1}/{run.questions.length} ·{' '}
            <span
              role="timer"
              aria-live="off"
              data-testid="rd-prov-timer"
              data-urgent={remaining <= 300}
            >
              {fmtClock(remaining)} kvar
            </span>
          </span>
        </div>
        <button
          type="button"
          className="la-quiet la-glass"
          data-testid="rd-prov-submit"
          disabled={!unlocked}
          onClick={() => askGate('submit')}
        >
          Lämna in
        </button>
      </header>
      <div className="la-prov-scroll">
        <details className="la-sheet la-prov-index" open={width === 'desktop'} ref={gridToggle}>
          <summary>
            Frågor · {index + 1}/{run.questions.length}
            <span>{answered} besvarade</span>
          </summary>
          <div className="la-prov-grid" data-testid="rd-prov-grid">
            {run.questions.map((item, i) => {
              const marked = flags?.includes(item.qid)
              return (
                <button
                  type="button"
                  key={item.qid}
                  className="la-prov-cell"
                  disabled={!unlocked}
                  data-testid={`rd-prov-cell-${i + 1}`}
                  data-answered={String(answers[item.qid] != null)}
                  data-current={String(index === i)}
                  aria-current={index === i ? 'step' : undefined}
                  aria-label={`Fråga ${i + 1}, ${item.section}, ${answers[item.qid] ? 'besvarad' : 'obesvarad'}${marked ? ', markerad' : ''}${index === i ? ', aktuell' : ''}`}
                  onClick={() => move(i)}
                >
                  {i + 1}
                  {marked ? <Flag size={12} aria-hidden /> : null}
                </button>
              )
            })}
          </div>
          <p className="la-caveat">En fylld ruta är besvarad. Ramen visar var du är.</p>
        </details>
        {settlement !== 'active' ? (
          <div className="la-sheet la-prov-status" role="status">
            {settlement === 'pending'
              ? 'Lämnar in…'
              : 'Resultatet kunde inte lämnas in. Dina val finns kvar här.'}
            {settlement === 'failed' ? (
              <button
                type="button"
                className="la-btn"
                onClick={() => {
                  settled.current = false
                  submit()
                }}
              >
                Försök lämna in igen
              </button>
            ) : null}
          </div>
        ) : null}
        <div className="la-prov-work" data-source={Boolean(q.passage || q.figure)}>
          {q.passage || q.figure ? (
            <section className="la-sheet la-prov-source" data-depth="1">
              {q.passage ? (
                <>
                  {q.passage.synthetic ? (
                    <div className="la-badge-row">
                      <span className="la-chip" data-testid="rd-badge">
                        {data.copy.ovningstextBadge}
                      </span>
                      <button
                        type="button"
                        className="la-quiet"
                        aria-expanded={note}
                        onClick={() => setNote(!note)}
                      >
                        Om texten
                      </button>
                    </div>
                  ) : null}
                  {q.passage.synthetic && note ? (
                    <p className="la-note">{data.copy.ovningstextNote}</p>
                  ) : null}
                  <div lang={q.passage.lang} className="la-pbody" data-testid="rd-prov-passage">
                    {q.passage.title ? <h2 className="la-ptitle">{q.passage.title}</h2> : null}
                    {q.passage.paragraphs.map((text, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: paragraph positions are immutable within a question
                      <p className="la-para" data-n={i + 1} key={`${q.qid}-${i}`}>
                        <span className="la-sr">Stycke {i + 1}. </span>
                        <span className="la-pn" aria-hidden>
                          {i + 1}
                        </span>
                        {text}
                      </p>
                    ))}
                    {q.passage.byline ? <p className="la-byline">{q.passage.byline}</p> : null}
                  </div>
                </>
              ) : null}
              {q.figure ? (
                <Figure key={q.figure.src} figure={q.figure} images={images} onViewer={setViewer} />
              ) : null}
            </section>
          ) : null}
          <section className="la-sheet la-prov-question" data-depth="2">
            <p className="la-eyebrow">
              {run.sitting} · {run.pass} · {q.section}
            </p>
            <h1 className="la-h" ref={heading} tabIndex={-1}>
              Fråga {index + 1} av {run.questions.length}
            </h1>
            <div className="la-quant-prompt">
              <QuantPrompt question={q} />
            </div>
            <ol className="la-opts" aria-label="Svarsalternativ">
              {(q.options ?? []).map((option) => (
                <li
                  className="la-opt"
                  data-state={answers[q.qid] === option.letter ? 'on' : undefined}
                  key={option.letter}
                >
                  <button
                    type="button"
                    className="la-opt-main"
                    disabled={!unlocked || images.blocked}
                    aria-pressed={answers[q.qid] === option.letter}
                    data-testid={`rd-prov-option-${option.letter}`}
                    onClick={() => pick(option.letter)}
                  >
                    <span className="la-key">{option.letter}</span>
                    <span className="la-opt-text">
                      <MathText>{option.text}</MathText>
                      {option.figure ? (
                        <img
                          key={images.key(option.figure.src, option.letter)}
                          {...images.props(option.figure.src, option.letter)}
                          className="la-option-figure"
                          src={`/${option.figure.src}`}
                          alt={option.figure.alt}
                          width={option.figure.width}
                          height={option.figure.height}
                        />
                      ) : null}
                    </span>
                  </button>
                  {option.figure && images.failed(option.figure.src, option.letter) ? (
                    <button
                      type="button"
                      className="la-link"
                      onClick={() => images.retry(option.figure!.src, option.letter)}
                    >
                      Försök hämta alternativ {option.letter} igen
                    </button>
                  ) : null}
                </li>
              ))}
            </ol>
            {images.blocked ? (
              <p role="status">Alla figurer behöver laddas innan du väljer svar.</p>
            ) : null}
            {!q.options?.length ? (
              <p>Frågans alternativ saknas. Du kan gå vidare till nästa fråga.</p>
            ) : null}
            <div className="la-prov-choices">
              <span>{answers[q.qid] ? `Ditt val: ${answers[q.qid]}` : 'Inget svar valt'}</span>
              {flags ? (
                <button
                  type="button"
                  className="la-quiet"
                  disabled={!unlocked}
                  data-testid="rd-prov-flag"
                  aria-pressed={flags.includes(q.qid)}
                  onClick={() =>
                    canInteract() &&
                    setFlags((old) =>
                      old?.includes(q.qid)
                        ? old.filter((id) => id !== q.qid)
                        : [...(old ?? []), q.qid],
                    )
                  }
                >
                  <Flag size={16} aria-hidden />
                  Markera
                </button>
              ) : null}
            </div>
            <div className="la-prov-next">
              <button
                type="button"
                className="la-quiet"
                disabled={index === 0 || !unlocked}
                onClick={() => move(index - 1)}
              >
                Föregående
              </button>
              <button
                type="button"
                className="la-btn"
                disabled={!unlocked}
                onClick={() =>
                  index + 1 < run.questions.length ? move(index + 1) : askGate('submit')
                }
              >
                {index + 1 < run.questions.length ? 'Nästa fråga' : 'Lämna in'}
                <ArrowRight size={18} aria-hidden />
              </button>
            </div>
          </section>
        </div>
      </div>
      {gate ? (
        <Confirm
          title={gate === 'abort' ? 'Avbryta provpasset?' : 'Lämna in provpasset?'}
          accept={gate === 'abort' ? 'Avbryt provpass' : 'Lämna in'}
          onCancel={() => setGate(null)}
          onAccept={
            gate === 'abort'
              ? () => {
                  if (canInteract()) onAbort()
                }
              : submit
          }
        >
          <p>
            {gate === 'abort'
              ? 'Avbryter du blir provet ogiltigt. Det här är ingen paus.'
              : `${blanks} av ${run.questions.length} frågor är obesvarade. Efter inlämning kan du inte ändra dina svar.`}
          </p>
        </Confirm>
      ) : null}
    </div>
  )
}

export function ResultHistory({
  rows,
  testId,
}: {
  rows: ProvResultSummaryView[]
  testId?: string
}) {
  const { actions } = useDirectionData()
  return (
    <div data-testid={testId}>
      {rows.length ? (
        <ul>
          {rows.map((row, i) => (
            <li key={row.id} data-testid={testId ? `${testId}-item-${i + 1}` : undefined}>
              <button
                type="button"
                className="la-result-row"
                onClick={() => actions.openProvResult(row.id)}
              >
                <span>
                  <b>
                    {row.sitting ?? 'Genererat pass'}
                    {row.pass ? ` · ${row.pass}` : ''}
                  </b>
                  <span>
                    {row.when} · {row.half === 'verbal' ? 'Verbal' : 'Kvant'} · {row.correct}/
                    {row.presented} rätt
                  </span>
                </span>
                <span>
                  {row.score != null ? fmtScore(row.score) : 'Ingen poäng'}
                  <ChevronRight size={16} aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>Inga tidigare provpass.</p>
      )}
    </div>
  )
}

export function LagerProvResult(props: HubProps) {
  const { data, actions } = useDirectionData()
  const result = data.provpass.result
  const nominal = data.provpass.hub.halves.find((half) => half.half === result.half)?.questions
  return (
    <Hub {...props} title="Provpassresultat">
      <div className="la-hub-grid la-result-layout">
        <section className="la-sheet la-pass-outcome" data-depth="3" data-testid="rd-prov-result">
          <p className="la-eyebrow">
            {result.mode === 'authentic' ? 'Riktigt prov · ' : ''}
            {result.sitting ?? 'Genererat pass'}
            {result.pass ? ` · ${result.pass}` : ''} ·{' '}
            {result.half === 'verbal' ? 'Verbal' : 'Kvant'}
          </p>
          <h2 className="la-done-line">Provpasset klart.</h2>
          <p className="la-result-fraction">
            <strong>{result.correct}</strong> av {result.presented} rätt
          </p>
          {nominal != null && result.presented < nominal ? (
            <p>
              {nominal - result.presented}{' '}
              {nominal - result.presented === 1 ? 'fråga saknas' : 'frågor saknas'} ur det
              fullständiga passet.
            </p>
          ) : null}
          <div className="la-score-basis" data-testid="rd-prov-score">
            {result.score.value != null ? (
              <p>
                <b>{fmtScore(result.score.value)}</b> · {result.score.label}
              </p>
            ) : (
              <p>Ingen poäng tillgänglig.</p>
            )}
            {result.score.value != null ? (
              <p className="la-caveat">
                {result.score.derived === 'official-derived'
                  ? 'Härledd från provtillfällets normering för en hel provhalva. Det här är inte en officiell poäng för det enskilda passet.'
                  : 'Linjär skattning utifrån andelen rätt. Inte en officiellt normerad poäng.'}
              </p>
            ) : null}
          </div>
          <button type="button" className="la-btn" onClick={() => actions.go('idag')}>
            Till Idag
            <ArrowRight size={18} aria-hidden />
          </button>
          <button type="button" className="la-link" onClick={() => actions.go('provpass')}>
            Till Provpass
          </button>
        </section>
        <section className="la-sheet la-pass-analysis" data-depth="1">
          <h2 className="la-h">Per delprov och tempo</h2>
          <table className="la-ledger">
            <caption>Rätt och tid jämfört med delprovets tidsandel</caption>
            <thead>
              <tr>
                <th scope="col">Delprov</th>
                <th scope="col">Rätt</th>
                <th scope="col">Tid / riktmärke</th>
              </tr>
            </thead>
            <tbody>
              {result.sections.map((s) => (
                <tr key={s.section} data-testid={`rd-prov-section-${slug(s.section)}`}>
                  <th scope="row">{s.section}</th>
                  <td>
                    {s.correct}/{s.presented}
                  </td>
                  <td>
                    {fmtClock(s.timeSeconds)} / {fmtClock(s.quotaSeconds)}
                    {s.timeSeconds > s.quotaSeconds ? <span>Över tidsandelen</span> : null}
                    {s.estimate != null ? (
                      <span>Linjär skattning {fmtScore(s.estimate)}</span>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            {fmtClock(result.durationSeconds)} totalt · {result.answered} besvarade ·{' '}
            {Math.max(0, result.presented - result.answered)} obesvarade
          </p>
          <p>
            {result.seenBefore} av {result.presented} frågor sedda tidigare.
          </p>
          {result.trap ? (
            <p className="la-note">
              {result.trap.section} ·{' '}
              {result.trap.headline ??
                data.frameworks[result.trap.frameworkId] ??
                'Återkommande fälla'}{' '}
              · {result.trap.count} missar
            </p>
          ) : null}
        </section>
      </div>
      <section className="la-sheet la-pass-history" data-depth="1">
        <h2 className="la-h">Tidigare pass av samma sort</h2>
        <ResultHistory rows={result.history} testId="rd-prov-history" />
      </section>
    </Hub>
  )
}
