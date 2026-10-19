import { BookOpen, ChartNoAxesCombined, House, LampDesk, Layers, Timer } from 'lucide-react'
import {
  type Destination,
  type DrillActions,
  type DrillRefs,
  type DrillView,
  splitStepRefs,
} from '@/components/devbake/redesign/r1Kit'

export type Reading = { view: DrillView; act: DrillActions; refs: DrillRefs }

export const NAV_ICONS = {
  idag: House,
  ova: Layers,
  provpass: Timer,
  uppslag: BookOpen,
  framsteg: ChartNoAxesCombined,
} satisfies Record<Destination, typeof House>

export function Mark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="lj-mark">
      <LampDesk size={24} strokeWidth={1.5} aria-hidden />
      {!compact && <span>HP-Coach</span>}
    </span>
  )
}

export function Cites({
  list,
  source,
  act,
}: {
  list: number[]
  source?: string
  act: DrillActions
}) {
  return list.length ? (
    <span className="lj-cites">
      <span>Se texten</span>
      {list.map((n) => (
        <button
          key={n}
          type="button"
          data-testid={`rd-cite-${n}`}
          aria-label={`Lys upp stycke ${n} i texten`}
          onClick={() => act.cite(n, source)}
        >
          ¶{n}
        </button>
      ))}
    </span>
  ) : null
}

export function Rich({ text, act }: { text: string; act: DrillActions }) {
  let offset = 0
  return splitStepRefs(text).map((segment) => {
    const key = offset
    offset += segment.text.length
    return segment.kind === 'text' ? (
      <span key={key}>{segment.text}</span>
    ) : (
      <button
        className="lj-inline-link"
        type="button"
        key={key}
        onClick={() => act.goToStep(segment.steps[0])}
      >
        {segment.text}
      </button>
    )
  })
}
