import { useId, useState } from 'react'
import { findQuestion, type Question } from '@/data/questions'
import { GapText } from '@/folio/screens/drill/GapText'
import { GradedOptions } from '@/folio/screens/drill/Options'
import { QuantPage } from '@/folio/screens/drill/QuantPage'
import { toDrillQuestion } from '@/folio/screens/drill/toDrillQuestion'

function Erratum({
  qid,
  bank,
  answers,
  attemptsLoading,
  attemptsError,
}: {
  qid: string
  bank: readonly Question[] | null
  answers: ReadonlyMap<string, { letter: string }>
  attemptsLoading: boolean
  attemptsError: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const source = bank ? findQuestion(bank, qid) : undefined
  const q = source ? toDrillQuestion(source) : null
  const picked = source?.options?.find((o) => o.letter === answers.get(qid)?.letter)?.letter ?? null
  return (
    <li className="fa-errata-item">
      <button
        type="button"
        className="fa-errata-row"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(!open)}
      >
        <span className="fa-meta">{q ? `${q.number} · ${q.section}` : qid}</span>
        <span className="fa-errata-stem">
          <GapText text={q?.prompt ?? 'Visa frågan och facit'} />
        </span>
        <span className="fa-meta">
          {open ? 'Dölj facit' : 'Visa facit'} <span aria-hidden>{open ? '−' : '+'}</span>
        </span>
      </button>
      <div id={id} hidden={!open} className="fa-facit">
        {open && q ? (
          <div className="fa-drill">
            {q.passage?.synthetic ? (
              <div className="fa-exercise">
                <strong>Övningstext</strong>
                <p>
                  Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från
                  ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.
                </p>
              </div>
            ) : null}
            {q.passage?.title ? (
              <h3 lang={q.section === 'ELF' ? 'en' : undefined}>{q.passage.title}</h3>
            ) : null}
            {q.passage?.instruction ? (
              <p lang={q.section === 'ELF' ? 'en' : undefined}>{q.passage.instruction}</p>
            ) : null}
            <div lang={q.section === 'ELF' ? 'en' : undefined}>
              <QuantPage
                q={q}
                n={q.number}
                after
                figure={
                  q.figure ? (
                    <figure className="fa-facit-figure">
                      <img
                        src={`/${q.figure.src}`}
                        alt={q.figure.alt}
                        width={q.figure.width}
                        height={q.figure.height}
                      />
                      <figcaption>
                        {q.source.label} · uppgift {q.number}
                      </figcaption>
                    </figure>
                  ) : undefined
                }
              />
              <GradedOptions view={{ question: q, picked }} all />
            </div>
            <p className="fa-facit-verdict">
              {attemptsLoading
                ? 'Hämtar ditt svar …'
                : attemptsError || picked == null
                  ? 'Ditt svar kunde inte hämtas.'
                  : `Ditt svar: ${picked}`}{' '}
              · rätt svar: <span className="fa-right-letter">{q.answer}</span>.
            </p>
          </div>
        ) : open ? (
          <p role="status">
            {bank == null ? 'Laddar frågan …' : 'Frågan finns inte tillgänglig just nu.'}
          </p>
        ) : null}
      </div>
    </li>
  )
}
export function ResultErrata({
  qids,
  ...props
}: Omit<Parameters<typeof Erratum>[0], 'qid'> & { qids: readonly string[] }) {
  return (
    <ol className="fa-errata">
      {qids.map((qid) => (
        <Erratum key={qid} qid={qid} {...props} />
      ))}
    </ol>
  )
}
