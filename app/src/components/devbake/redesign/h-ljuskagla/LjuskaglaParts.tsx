import {
  BookOpen,
  ChartNoAxesCombined,
  Check,
  CircleSlash,
  House,
  LampDesk,
  Layers,
  Timer,
  Undo2,
} from 'lucide-react'
import type {
  DrillCoreActions,
  DrillCoreRefs,
  DrillCoreView,
} from '@/components/devbake/redesign/drillCore'
import { type Destination, splitStepRefs } from '@/components/devbake/redesign/r1Kit'
import { MathText } from '@/components/MathText'
import type { Section } from '@/data/questions'

/** What a drill hands its answer rows and feedback: drillCore's view, the
 *  moves they make and the scroll targets they attach. */
export type ReadingActions = Pick<
  DrillCoreActions,
  'select' | 'toggleEliminate' | 'cite' | 'toggleStep' | 'goToStep'
>
export type Reading = { view: DrillCoreView; act: ReadingActions; refs: DrillCoreRefs }

/** The pages of the normal shell. Repetera lives inside Öva. */
export type FramePage = 'idag' | 'ova' | 'repetera' | 'provpass' | 'uppslag' | 'framsteg'

/** Frame-level navigation: ask the host (`ask`), and open `page` in the
 *  frame as well, for a host that does not navigate. */
export type OpenPage = (page: FramePage, ask: () => void) => void

export const NAV_ICONS = {
  idag: House,
  ova: Layers,
  provpass: Timer,
  uppslag: BookOpen,
  framsteg: ChartNoAxesCombined,
} satisfies Record<Destination, typeof House>

/** 'LÄS' → 'las', as the contract's ids spell a section. */
export function sectionId(section: Section): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

const COUNT_WORDS = ['Inga', 'En', 'Två', 'Tre', 'Fyra', 'Fem', 'Sex', 'Sju', 'Åtta', 'Nio', 'Tio']

/** 2 → "Två": small counts read as words at the start of a sentence. */
export function countWord(n: number): string {
  return COUNT_WORDS[n] ?? String(n)
}

/** 1 → "1 fråga", 3 → "3 frågor". */
export function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

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
  act: Pick<ReadingActions, 'cite'>
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

/** Explanation text, verbatim: math rendered, "(steg 2)" a jump to the step. */
export function Rich({ text, act }: { text: string; act: Pick<ReadingActions, 'goToStep'> }) {
  let offset = 0
  return splitStepRefs(text).map((segment) => {
    const key = offset
    offset += segment.text.length
    return segment.kind === 'text' ? (
      <span key={key}>
        <MathText>{segment.text}</MathText>
      </span>
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

/**
 * The answer rows of any question: its own letters only (A–D or A–E), the
 * option text with its math, or an option image named by its text. Select,
 * then confirm elsewhere; each row has its own visible strike control.
 */
export function AnswerRows({
  view,
  act,
  testId = 'rd-option',
  label = 'Svarsalternativ',
}: {
  view: DrillCoreView
  act: Pick<ReadingActions, 'select' | 'toggleEliminate'>
  testId?: 'rd-option' | 'rd-quant-option'
  label?: string
}) {
  return (
    <ol className="lj-options" aria-label={label}>
      {(view.question.options ?? []).map((option) => {
        const selected = view.selected === option.letter
        const eliminated = view.eliminated.has(option.letter)
        return (
          <li
            key={option.letter}
            data-selected={String(selected)}
            data-eliminated={String(eliminated)}
          >
            <button
              type="button"
              className="lj-option"
              data-testid={`${testId}-${option.letter}`}
              aria-pressed={selected}
              onClick={() => act.select(option.letter)}
            >
              <kbd>{option.letter}</kbd>
              {option.figure ? (
                <span className="lj-option-figure">
                  <img
                    src={`/${option.figure.src}`}
                    alt={option.figure.alt}
                    width={option.figure.width}
                    height={option.figure.height}
                  />
                </span>
              ) : (
                <span>
                  <MathText>{option.text}</MathText>
                </span>
              )}
              {selected && <Check className="lj-selected-mark" size={16} aria-hidden />}
            </button>
            <button
              type="button"
              className="lj-eliminate"
              data-testid={`rd-eliminate-${option.letter}`}
              aria-label={
                eliminated ? `Ångra strykning av ${option.letter}` : `Stryk ${option.letter}`
              }
              aria-pressed={eliminated}
              onClick={() => act.toggleEliminate(option.letter)}
            >
              {eliminated ? <Undo2 size={17} aria-hidden /> : <CircleSlash size={17} aria-hidden />}
            </button>
          </li>
        )
      })}
    </ol>
  )
}
