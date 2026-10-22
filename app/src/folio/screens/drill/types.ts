import type { AnswerLetter, Provpass, Section } from '@/data/questions'
import type { Passage } from './drillCore'

export type DrillOptionFigure = { src: string; alt: string; width: number; height: number }
export type DrillOption = { letter: AnswerLetter; text: string; figure?: DrillOptionFigure | null }
export type DrillFigure = DrillOptionFigure & { kind: 'svg' | 'raster' }
export type DrillPassage = Passage & {
  title?: string
  lang: 'sv' | 'en'
  synthetic: boolean
  unitId?: string
}
export type QuestionSource = {
  examId: string
  provpass: Provpass | null
  authentic: boolean
  label: string
}
export type DrillQuestion = {
  qid: string
  section: Section
  number: number
  prompt: string | null
  options: DrillOption[] | null
  answer: AnswerLetter
  passage?: DrillPassage | null
  figure?: DrillFigure | null
  math: boolean
  source: QuestionSource
}
