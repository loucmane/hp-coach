import { type ReactNode, useId, useLayoutEffect, useRef } from 'react'

import {
  type DrillCoreActions as DrillActions,
  type DrillCoreRefs as DrillRefs,
  type DrillCoreView as DrillView,
  splitStepRefs,
} from '@/components/devbake/redesign/drillCore'
import { MathText } from '@/components/MathText'

export type RasterDrillState = { view: DrillView; act: DrillActions; refs: DrillRefs }

export function rasterSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}

/** Native modal containment, with the opener restored after every dismissal. */
export function RasterDialog({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  useLayoutEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = ref.current
    if (!dialog) return
    if (typeof dialog.showModal === 'function') dialog.showModal()
    else dialog.setAttribute('open', '')
    dialog.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      if (typeof dialog.close === 'function') dialog.close()
      opener?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="ra-modal"
      aria-labelledby={titleId}
      data-rd-keyscope
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <header className="ra-modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Stäng">
          ×
        </button>
      </header>
      {children}
    </dialog>
  )
}

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
      // biome-ignore lint/suspicious/noArrayIndexKey: immutable ordered text segments
      <MathText key={i}>{part.text}</MathText>
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
