import { describe, expect, it } from 'vitest'
import type { AnswerLetter, Question } from '@/data/questions'
import { FIRST_SESSION_QIDS } from '@/lib/firstSession'
import { generateDailyPlan } from '@/lib/scheduler'
import { welcomeDoneLine, welcomeJourney, welcomeMinutesLine, welcomeSittings } from './welcomeView'

describe('Folio welcome view', () => {
  it('orders only applicable setup steps, with resume taking precedence over attempts', () => {
    expect(welcomeJourney(0, false)).toEqual(['sitting', 'minutes', 'theme', 'pattern'])
    expect(welcomeJourney(2, true)).toEqual(['pattern'])
    expect(welcomeJourney(20, false)).toEqual([])
  })
  it('uses upcoming calendar dates and a nullable target, with a countdown only on the selected sitting', () => {
    const rows = welcomeSittings('var-2027', new Date(2026, 9, 23))
    expect(rows.map((r) => r.value)).toEqual(['var-2027', 'host-2027', ''])
    expect(rows[0]).toMatchObject({ label: 'Vårprov 27', detail: '10 april 2027 · om 169 dagar' })
    expect(rows[1].detail).toBe('24 oktober 2027')
    expect(rows[2].label).toBe('Vet inte än')
    expect(welcomeSittings(null, new Date(2028, 0, 1))).toHaveLength(1)
  })
  it('calculates hours honestly and follows the next sitting when no target is saved', () => {
    expect(welcomeMinutesLine(20, null, new Date(2026, 9, 23))).toBe(
      '20 minuter om dagen till vårprovet är ungefär 56 timmar.',
    )
    expect(welcomeMinutesLine(45, 'host-2027', new Date(2026, 9, 23))).toContain('275 timmar')
    expect(welcomeMinutesLine(20, null, new Date(2028, 0, 1))).toBeNull()
  })
  const questions = FIRST_SESSION_QIDS.map((qid) => ({ qid, answer: 'B' }) as Question)
  it.each([0, 1, 2, 3])('reports exactly %i correct answers', (correct) => {
    const picks = questions.map((_, i): AnswerLetter => (i < correct ? 'B' : 'A'))
    expect(welcomeDoneLine(questions, picks)).toBe(
      correct
        ? `Du klarade ${correct} av 3 frågor från riktiga högskoleprov`
        : 'Du har gjort dina första 3 frågor från riktiga högskoleprov',
    )
  })
  it('does not invent a three-question result for an established or incomplete session', () => {
    expect(welcomeDoneLine()).toBe('Du är igång.')
    expect(welcomeDoneLine(questions, ['B', null, 'B'])).toBe('Du är igång.')
    expect(welcomeDoneLine(questions.slice(0, 2), ['B', 'B'])).toBe('Du är igång.')
  })
  it('verifies the scheduler offers a diagnostic the next day without further practice', () => {
    const plan = generateDailyPlan({
      now: new Date(2026, 9, 24),
      sectionScores: [],
      dueMistakeCount: 0,
      onboardingCompletedDate: '2026-10-23',
    })
    expect(plan.items[0].href).toBe('/diagnostik?start=1')
  })
})
