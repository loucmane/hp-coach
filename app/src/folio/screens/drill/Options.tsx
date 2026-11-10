import { Check, ChevronRight } from 'lucide-react'
import { type ReactNode, useRef, useState } from 'react'
import { MathText } from '@/components/MathText'
import type { AnswerLetter } from '@/data/questions'
import { useScopedKeys } from '@/folio/lib/useScopedKeys'
import { useViewport } from '@/hooks/useViewport'
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
  const root = useRef<HTMLDivElement>(null)
  const buttons = useRef(new Map<AnswerLetter, HTMLButtonElement>())
  const phone = useViewport() === 'phone'
  const [striking, setStriking] = useState(false)
  const options = view.question.options ?? []
  const choose = (letter: AnswerLetter) => {
    act.select(letter)
    buttons.current.get(letter)?.focus()
  }
  useScopedKeys(
    root,
    Object.fromEntries(
      options.flatMap(({ letter }) => [
        [letter, () => choose(letter)],
        [`Shift+${letter}`, () => act.toggleEliminate(letter)],
      ]),
    ),
  )
  return (
    <>
      <div
        className="fa-opts"
        role="radiogroup"
        aria-label="Svarsalternativ"
        ref={root}
        data-striking={phone && striking ? 'true' : undefined}
      >
        {options.map((o, index) => {
          const selected = view.selected === o.letter
          const out = view.eliminated.has(o.letter)
          return (
            <div
              key={o.letter}
              className="fa-opt"
              data-state={selected ? 'selected' : out ? 'eliminated' : undefined}
              data-image={o.figure ? 'true' : undefined}
            >
              {/* biome-ignore lint/a11y/useSemanticElements: the approved radio button contains rendered math or an option figure; roving focus and native activation are implemented here. */}
              <button
                type="button"
                className="fa-opt-main"
                data-testid={`${testId}-${o.letter}`}
                role="radio"
                aria-checked={selected}
                tabIndex={selected || (!view.selected && index === 0) ? 0 : -1}
                ref={(node) => {
                  if (node) buttons.current.set(o.letter, node)
                  else buttons.current.delete(o.letter)
                }}
                onKeyDown={(event) => {
                  if (
                    event.defaultPrevented ||
                    event.repeat ||
                    event.nativeEvent.isComposing ||
                    event.altKey ||
                    event.metaKey ||
                    event.ctrlKey
                  )
                    return
                  const step = ['ArrowDown', 'ArrowRight'].includes(event.key)
                    ? 1
                    : ['ArrowUp', 'ArrowLeft'].includes(event.key)
                      ? -1
                      : 0
                  if (step) {
                    event.preventDefault()
                    choose(options[(index + step + options.length) % options.length].letter)
                  }
                }}
                onClick={() => act.select(o.letter)}
              >
                <span className="fa-letter" aria-hidden>
                  {o.letter}
                </span>
                {view.question.section === 'KVA' && kvaGlyph(o.letter) ? (
                  <span className="fa-opt-glyph" aria-hidden>
                    {kvaGlyph(o.letter)}
                  </span>
                ) : null}
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
              {!phone || striking ? (
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
                  {out ? 'Ångra' : 'Stryk'}
                </button>
              ) : null}
            </div>
          )
        })}
      </div>
      {phone ? (
        <button
          type="button"
          className="fa-more fa-strikemode"
          aria-pressed={striking}
          onClick={() => setStriking(!striking)}
        >
          Stryk alternativ
        </button>
      ) : null}
    </>
  )
}

export function kvaGlyph(letter: AnswerLetter): string | undefined {
  return { A: '>', B: '<', C: '=', D: '?', E: undefined }[letter]
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
