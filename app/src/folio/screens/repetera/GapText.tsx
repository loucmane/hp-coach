import { Fragment } from 'react'
import { MathText } from '@/components/MathText'

const GAP_RE = /_{3,}/g

export function GapText({ text }: { text: string }) {
  const parts = text.split(GAP_RE)
  if (parts.length === 1) return <MathText>{text}</MathText>
  return (
    <>
      {parts.map((part, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: the gaps keep their order
        <Fragment key={i}>
          <MathText>{part}</MathText>
          {i < parts.length - 1 ? (
            <span className="fa-gap">
              <span className="fa-sr">lucka {i + 1}</span>
            </span>
          ) : null}
        </Fragment>
      ))}
    </>
  )
}
