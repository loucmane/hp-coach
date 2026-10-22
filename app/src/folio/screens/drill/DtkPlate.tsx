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
  onZoom: (rotation: number) => void
}) {
  const [failed, setFailed] = useState(false)
  const [rotation, setRotation] = useState(0)
  const figure = questions[0].figure
  const aspect = figure ? figure.width / figure.height : 1
  const turned = rotation === 90 || rotation === 270
  const effectiveAspect = turned ? 1 / aspect : aspect
  const cue = groupCue(index, questions.length)
  return (
    <figure className="rd-plate" data-testid="rd-plate">
      {figure && !failed ? (
        <>
          <div className="rd-figure-box" style={{ aspectRatio: String(effectiveAspect) }}>
            <img
              src={`/${figure.src}`}
              alt={figure.alt}
              width={figure.width}
              height={figure.height}
              style={{
                width: turned ? `${100 * aspect}%` : '100%',
                height: turned ? `${100 / aspect}%` : '100%',
                transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              }}
              onError={() => setFailed(true)}
            />
          </div>
          <div className="rd-plate-tools">
            <button
              type="button"
              className="fa-more"
              aria-label="Rotera figur 90 grader"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              Rotera
            </button>
            <button
              type="button"
              className="fa-more"
              data-testid="question-figure"
              onClick={() => onZoom(rotation)}
            >
              Förstora
            </button>
          </div>
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
