import { useState } from 'react'
import type { DrillQuestion } from './types'

const ORDINALS = ['Första', 'Andra', 'Tredje', 'Fjärde', 'Femte', 'Sjätte']
const COUNTS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem', 'sex']
export function groupCue(pos: number, count: number): string | null {
  return count < 2
    ? null
    : ORDINALS[pos] && COUNTS[count]
      ? `${ORDINALS[pos]} av ${COUNTS[count]} frågor till figuren`
      : 'Flera frågor till samma figur'
}
export function plateCaption(group: readonly DrillQuestion[]): string {
  const numbers = group.map((q) => q.number).sort((a, b) => a - b)
  const first = numbers[0]
  const last = numbers.at(-1)
  return `${group[0].source.label} · ${first === last ? `uppgift ${first}` : `uppgifterna ${first}–${last}`}`
}

/** The plate belongs to the block, so advancing a question keeps its image mounted. */
export function DtkPlate({
  questions,
  index,
  onZoom,
}: {
  questions: readonly DrillQuestion[]
  index: number
  onZoom: () => void
}) {
  const [failed, setFailed] = useState(false)
  const figure = questions[0].figure
  const cue = groupCue(index, questions.length)
  return (
    <figure className="rd-plate" data-testid="rd-plate">
      {figure && !failed ? (
        <>
          <img
            src={`/${figure.src}`}
            alt={figure.alt}
            width={figure.width}
            height={figure.height}
            onError={() => setFailed(true)}
          />
          <button
            type="button"
            className="fa-more rd-enlarge"
            data-testid="question-figure"
            onClick={onZoom}
          >
            Förstora
          </button>
        </>
      ) : (
        <p className="fa-prose">
          {figure ? 'Figuren kunde inte laddas.' : 'Figur saknas för den här uppgiften.'}
        </p>
      )}
      <figcaption>{plateCaption(questions)}</figcaption>
      {cue ? (
        <p className="rd-cue" data-testid="dtk-block-cue">
          {cue}
        </p>
      ) : null}
    </figure>
  )
}
