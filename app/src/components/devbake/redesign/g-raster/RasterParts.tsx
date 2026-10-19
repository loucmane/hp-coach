import type { ReactNode } from 'react'

import {
  type DrillActions,
  type DrillRefs,
  type DrillView,
  splitStepRefs,
} from '@/components/devbake/redesign/r1Kit'

export type RasterDrillState = { view: DrillView; act: DrillActions; refs: DrillRefs }

export function IndexNumber({ value }: { value: number }) {
  return (
    <span className="ra-index-number" aria-hidden>
      {String(value).padStart(2, '0')}
    </span>
  )
}

export function Cites({
  list,
  act,
  source,
}: {
  list: number[]
  act: DrillActions
  source?: string
}) {
  return (
    <span className="ra-cites">
      {list.map((n) => (
        <button
          key={n}
          type="button"
          data-testid={`rd-cite-${n}`}
          aria-label={`Läs stycke ${n}`}
          onClick={() => act.cite(n, source)}
        >
          ¶{n}
        </button>
      ))}
    </span>
  )
}

export function RichText({ text, act }: { text: string; act: DrillActions }) {
  return splitStepRefs(text).map((part, i) =>
    part.kind === 'text' ? (
      part.text
    ) : (
      <button
        type="button"
        className="ra-step-link"
        // biome-ignore lint/suspicious/noArrayIndexKey: immutable ordered segments, with repeated references allowed
        key={i}
        onClick={() => act.goToStep(part.steps[0])}
      >
        {part.text}
      </button>
    ),
  )
}

/** Sentence evidence remains legible: underline, never translucent text. */
export function PassageText({
  text,
  number,
  view,
}: {
  text: string
  number: number
  view: DrillView
}) {
  if (view.phase !== 'feedback') return text
  const marks = view.marks
    .filter(
      (m) =>
        m.para === number && (m.source.startsWith('step-') || m.source === `why-${view.picked}`),
    )
    .sort((a, b) => a.start - b.start || b.end - a.end)
  const output: ReactNode[] = []
  let at = 0
  for (const mark of marks) {
    if (mark.start < at) continue
    output.push(text.slice(at, mark.start))
    output.push(
      <mark
        key={`${mark.source}-${mark.start}`}
        data-active={String(view.flashSource === mark.source)}
      >
        {text.slice(mark.start, mark.end)}
      </mark>,
    )
    at = mark.end
  }
  output.push(text.slice(at))
  return output
}
