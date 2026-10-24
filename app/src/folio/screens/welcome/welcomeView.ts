import type { AnswerLetter, Question } from '@/data/questions'
import { daysUntil, EXAM_SITTINGS, resolveSitting } from '@/lib/dates'
import { firstSessionOrigin } from '@/lib/firstSession'

export type WelcomeSetupStep = 'sitting' | 'minutes' | 'theme' | 'pattern'
export const WELCOME_STEPS: Record<
  WelcomeSetupStep,
  { label: string; title: string; intro: string }
> = {
  sitting: {
    label: 'Prov',
    title: 'Vilket prov siktar du på?',
    intro: 'Välj provet du vill öva inför. Det går att ändra senare.',
  },
  minutes: {
    label: 'Minuter',
    title: 'Hur mycket tid passar dig?',
    intro: 'Vi sparar ditt val. Du kan ändra det under Konto när som helst.',
  },
  theme: {
    label: 'Utseende',
    title: 'Gör den till din.',
    intro: 'Välj tema och färg. Du kan ändra dem under Konto när som helst.',
  },
  pattern: {
    label: 'Ordmönster',
    title: 'Ett litet o- vänder betydelsen',
    intro: 'Leta efter början av ordet. Den kan ge dig en ledtråd till betydelsen.',
  },
}

export function welcomeJourney(attempts: number, hasActiveSession: boolean): WelcomeSetupStep[] {
  if (hasActiveSession) return ['pattern']
  return attempts > 0 ? [] : ['sitting', 'minutes', 'theme', 'pattern']
}

export type WelcomeOption = { value: string; label: string; detail?: string }
export function welcomeSittings(selected: string | null, now = new Date()): WelcomeOption[] {
  return [
    ...EXAM_SITTINGS.filter((s) => daysUntil(s.date, now) >= 0).map((s) => ({
      value: s.id,
      label: s.label,
      detail: `${s.date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}${s.id === selected ? ` · om ${daysUntil(s.date, now)} dagar` : ''}`,
    })),
    { value: '', label: 'Vet inte än', detail: 'Appen räknar mot nästa provtillfälle.' },
  ]
}

export function welcomeMinutesLine(
  minutes: number,
  target: string | null,
  now = new Date(),
): string | null {
  const sitting = resolveSitting(target, now)
  if (!sitting) return null
  const hours = Math.round((minutes * daysUntil(sitting.date, now)) / 60)
  const season = sitting.id.startsWith('var-') ? 'vårprovet' : 'höstprovet'
  return `${minutes} minuter om dagen till ${season} är ungefär ${hours} timmar.`
}

export function welcomeDoneLine(
  questions: readonly Question[] = [],
  picks: readonly (AnswerLetter | null)[] = [],
): string {
  if (
    questions.length !== 3 ||
    picks.length !== 3 ||
    picks.some((p) => !p) ||
    new Set(questions.map((q) => q.qid)).size !== 3 ||
    questions.some((q) => !firstSessionOrigin(q.qid))
  )
    return 'Du är igång.'
  const correct = questions.filter((q, i) => q.answer === picks[i]).length
  return correct > 0
    ? `Du klarade ${correct} av 3 frågor från riktiga högskoleprov`
    : 'Du har gjort dina första 3 frågor från riktiga högskoleprov'
}
