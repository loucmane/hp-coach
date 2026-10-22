import type { ReactNode } from 'react'
import { splitKvaPrompt } from '@/components/drill/KvaPrompt'
import { MathText } from '@/components/MathText'
import { parseNogPrompt } from '@/lib/nogPrompt'
import type { DrillCoreRefs } from './drillCore'
import { GapText } from './GapText'
import type { DrillQuestion } from './types'

function isWord(q: DrillQuestion): boolean {
  return q.section === 'ORD' && (q.prompt?.trim().length ?? 0) <= 24
}

/**
 * A problem set the textbook way, per section: XYZ's prompt as it comes;
 * KVA's condition as its own line, then the two quantities side by side in
 * a ruled table (stacked on phone, each under its italic label); NOG's
 * question, its statements hanging in the margin and the italic lead-in;
 * ORD's word at the title size; MEK's blanks as gaps. With `hang`, the
 * problem's number hangs in the margin. `after` sets it as the quiet
 * restatement under a verdict. A prompt that does not split falls back to
 * the line as it is.
 */
export function QuantPage({
  q,
  n,
  hang = false,
  after = false,
  bare = false,
  figure,
  passageRef,
  flashPara,
}: {
  q: DrillQuestion
  n: number
  hang?: boolean
  after?: boolean
  /** Inside Förstora: a paragraph, not the page's heading, and no test id
   *  (the page's own problem is still in the document under it). */
  bare?: boolean
  figure?: ReactNode
  passageRef?: DrillCoreRefs['para']
  flashPara?: number | null
}) {
  const prompt = q.prompt ?? ''
  const kva = q.section === 'KVA' ? splitKvaPrompt(prompt) : null
  const nog = q.section === 'NOG' ? parseNogPrompt(prompt) : null
  const num = hang ? (
    <span className="fa-qnum" aria-hidden>
      {n}
    </span>
  ) : null
  // The prompt is the page's h2; restated under a verdict it is a quiet line.
  const Head = after || bare ? 'p' : 'h2'
  const headClass = 'fa-prompt fa-qprompt'
  return (
    <div
      className="fa-problem"
      data-section={q.section}
      data-after={after ? 'true' : undefined}
      data-testid={bare ? undefined : 'drill-prompt'}
    >
      {figure}
      {q.passage ? (
        <div className="fa-qpassage" lang={q.passage.lang === 'en' ? 'en' : undefined}>
          {q.passage.paragraphs.map((p, i) => (
            <p
              // biome-ignore lint/suspicious/noArrayIndexKey: paragraph positions define the citation numbers
              key={i}
              ref={passageRef?.(i + 1)}
              data-cited={flashPara === i + 1 ? 'true' : undefined}
            >
              <MathText>{p}</MathText>
            </p>
          ))}
        </div>
      ) : null}
      {kva ? (
        // The condition and its two quantities read as one: never parted.
        <fieldset className="fa-qset" aria-label="Villkoret och kvantiteterna">
          <Head className={headClass} data-after={after ? 'true' : undefined}>
            {num}
            {kva.condition ? <MathText>{kva.condition}</MathText> : 'Jämför de två kvantiteterna.'}
          </Head>
          <table className="fa-kva">
            <thead>
              <tr>
                <th scope="col">Kvantitet I</th>
                <th scope="col">Kvantitet II</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <MathText>{kva.kvI}</MathText>
                </td>
                <td>
                  <MathText>{kva.kvII}</MathText>
                </td>
              </tr>
            </tbody>
          </table>
        </fieldset>
      ) : nog ? (
        // The question and both statements read as one, the lead-in with them.
        <fieldset className="fa-qset" aria-label="Frågan och påståendena">
          <Head className={headClass} data-after={after ? 'true' : undefined}>
            {num}
            <MathText>{nog.question}</MathText>
          </Head>
          <ol className="fa-nog" aria-label="Påståenden">
            <li>
              <span className="fa-nog-n" aria-hidden>
                (1)
              </span>
              <span className="fa-sr">Påstående 1: </span>
              <MathText>{nog.statement1}</MathText>
            </li>
            <li>
              <span className="fa-nog-n" aria-hidden>
                (2)
              </span>
              <span className="fa-sr">Påstående 2: </span>
              <MathText>{nog.statement2}</MathText>
            </li>
          </ol>
          <p className="fa-nog-tail">
            {nog.tail ?? 'Tillräcklig information för lösningen erhålls'}
          </p>
        </fieldset>
      ) : (
        <Head
          className={headClass}
          data-after={after ? 'true' : undefined}
          data-word={isWord(q) ? 'true' : undefined}
        >
          {num}
          {q.section === 'MEK' ? <GapText text={prompt} /> : <MathText>{prompt}</MathText>}
        </Head>
      )}
    </div>
  )
}
