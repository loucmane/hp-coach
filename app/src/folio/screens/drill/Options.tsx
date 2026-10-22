import { Check, ChevronRight, CircleSlash, Undo2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { MathText } from '@/components/MathText'
import type { DrillCoreActions, DrillCoreView } from './drillCore'
import type { DrillOption } from './types'

function InLang({ lang, children }: { lang: 'en' | undefined; children: ReactNode }) {
  return lang ? <span lang={lang}>{children}</span> : children
}
function OptionContent({ o }: { o: DrillOption }) {
  const [failed, setFailed] = useState(false)
  return o.figure && !failed ? (
    <img
      className="fa-opt-img"
      src={`/${o.figure.src}`}
      alt={o.figure.alt}
      width={o.figure.width}
      height={o.figure.height}
      onError={() => setFailed(true)}
    />
  ) : (
    <MathText>{o.text}</MathText>
  )
}
export function Options({
  view,
  act,
  testId = 'option',
}: {
  view: Pick<DrillCoreView, 'question' | 'selected' | 'eliminated'>
  act: Pick<DrillCoreActions, 'select' | 'toggleEliminate'>
  testId?: string
}) {
  const en = view.question.section === 'ELF' ? 'en' : undefined
  const sv = en ? 'sv' : undefined
  return (
    <ol className="fa-opts" aria-label="Svarsalternativ">
      {(view.question.options ?? []).map((o) => {
        const selected = view.selected === o.letter
        const out = view.eliminated.has(o.letter)
        return (
          <li
            key={o.letter}
            className="fa-opt"
            data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
            data-image={o.figure ? 'true' : undefined}
          >
            <button
              type="button"
              className="fa-opt-main"
              data-testid={`${testId}-${o.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(o.letter)}
            >
              <span className="fa-letter" aria-hidden>
                {o.letter}
              </span>
              <span className="fa-opt-text">
                <span className="fa-sr" lang={sv}>
                  Alternativ {o.letter}
                  {out ? ', struket' : ''}:{' '}
                </span>
                <InLang lang={en}>
                  <OptionContent o={o} />
                </InLang>
              </span>
            </button>
            <button
              type="button"
              className="fa-opt-x"
              data-testid={`fa-eliminate-${o.letter}`}
              lang={sv}
              aria-pressed={out}
              aria-label={out ? `Ångra strykningen av ${o.letter}` : `Stryk ${o.letter}`}
              title={out ? 'Ångra' : 'Stryk alternativet (⇧ + bokstav)'}
              onClick={() => act.toggleEliminate(o.letter)}
            >
              {out ? (
                <Undo2 size={16} strokeWidth={1.5} aria-hidden />
              ) : (
                <CircleSlash size={16} strokeWidth={1.5} aria-hidden />
              )}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

/** After the answer: the chosen option and the right one, in full and at
 *  the same size as before; the rest wait behind one quiet link — or, with
 *  `all` (short quant options), stay in view in ink-2. */
export function GradedOptions({
  view,
  all: allShown = false,
}: {
  view: Pick<DrillCoreView, 'question' | 'picked'>
  all?: boolean
}) {
  const [opened, setOpened] = useState(false)
  const all = allShown || opened
  const key = view.question.answer
  const options = view.question.options ?? []
  const shown = options.filter((o) => all || o.letter === key || o.letter === view.picked)
  const rest = options.length - shown.length
  const en = view.question.section === 'ELF' ? 'en' : undefined
  const sv = en ? 'sv' : undefined
  return (
    <>
      <ol className="fa-opts" aria-label="Svarsalternativ, rättade">
        {shown.map((o) => {
          const right = o.letter === key
          const mine = o.letter === view.picked
          return (
            <li
              key={o.letter}
              className="fa-opt"
              data-grade={right ? 'right' : mine ? 'wrong' : 'other'}
              data-image={o.figure ? 'true' : undefined}
            >
              <div className="fa-opt-main">
                <span className="fa-letter" aria-hidden>
                  {o.letter}
                </span>
                <span className="fa-opt-text">
                  <span className="fa-sr" lang={sv}>
                    Alternativ {o.letter}:{' '}
                  </span>
                  <InLang lang={en}>
                    <OptionContent o={o} />
                  </InLang>
                  {right || mine ? (
                    <span className="fa-opt-tag" lang={sv}>
                      {right ? <Check size={14} strokeWidth={2.25} aria-hidden /> : null}
                      {right && mine ? 'Ditt svar · rätt' : right ? 'Rätt svar' : 'Ditt svar'}
                    </span>
                  ) : null}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      {!allShown && (rest > 0 || opened) ? (
        <button
          type="button"
          className="fa-more fa-more-opts"
          aria-expanded={opened}
          onClick={() => setOpened(!opened)}
        >
          {opened ? 'Visa bara ditt svar och det rätta' : 'Visa alla alternativ'}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
    </>
  )
}
