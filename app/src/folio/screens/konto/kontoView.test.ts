import { describe, expect, it } from 'vitest'
import { EXAM_SITTINGS } from '@/lib/dates'
import { COACH_BLURBS, COACH_LABELS } from '@/lib/voice'
import {
  COACH_OPTIONS,
  COPY,
  canDelete,
  examChoices,
  identityView,
  PALETTE_OPTIONS,
  SHORTCUTS,
} from './kontoView'

describe('Konto view', () => {
  it('offers only upcoming sittings and labels the chosen Swedish date', () => {
    const view = examChoices('host-2027', new Date(2026, 9, 23))
    expect(view.options.map((s) => s.key)).toEqual(['var-2027', 'host-2027'])
    expect(view.hint).toBe('söndag 24 oktober 2027')
    expect(examChoices('var-2027', new Date(2026, 9, 23)).hint).toBe('lördag 10 april 2027')
  })
  it('keeps an exam through its whole day and explains when no dates remain', () => {
    expect(examChoices('host-2026', new Date(2026, 9, 18, 23, 59)).options).toHaveLength(3)
    const view = examChoices(EXAM_SITTINGS.at(-1)!.id, new Date(2027, 9, 25))
    expect(view.options).toEqual([])
    expect(view.hint).toBe('Nästa provdatum är inte publicerat här än.')
  })
  it('uses real identity fallbacks without a sample person', () => {
    expect(identityView(null)).toEqual({ name: '', email: '' })
    expect(
      identityView({
        fullName: ' ',
        firstName: ' Ada ',
        primaryEmailAddress: { emailAddress: 'ada@example.test' },
      }),
    ).toEqual({ name: 'Ada', email: 'ada@example.test' })
    expect(
      identityView({ primaryEmailAddress: { emailAddress: 'reader@example.test' } }).name,
    ).toBe('')
    expect(identityView({ fullName: ' ', firstName: ' ' }).name).toBe('')
    expect(identityView({ fullName: ' Ada Lovelace ', firstName: 'Ada' }).name).toBe('Ada Lovelace')
  })
  it('uses Swedish colour words and the actual coach options', () => {
    expect(PALETTE_OPTIONS.map((p) => p.label)).toEqual(['Spalt', 'Sand', 'Salvia', 'Bläck', 'Ros'])
    for (const coach of COACH_OPTIONS) {
      expect(coach.label).toBe(COACH_LABELS[coach.key])
      expect(coach.blurb).toBe(COACH_BLURBS[coach.key])
    }
  })
  it.each([
    '',
    'Radera',
    ' radera',
    'radera ',
    'rader',
    'RADERA',
  ])('never arms deletion for %j', (word) => {
    expect(canDelete(word)).toBe(false)
  })
  it('arms only the exact confirmation word', () => expect(canDelete('radera')).toBe(true))
  it('prints only shortcuts implemented in the app', () => {
    expect(SHORTCUTS.flatMap((group) => group.keys.map(([key]) => key))).toEqual([
      '⌘B',
      'Esc',
      'A–E',
      '⇧ + bokstav',
      '↵',
      '← / →',
      '+ / −',
      'R',
      'J / K',
    ])
    expect(JSON.stringify(SHORTCUTS)).not.toMatch(/styckeljus|stycket/)
    expect(SHORTCUTS.find((group) => group.where === 'I Förstora')?.keys).toContainEqual([
      'R',
      'vrid figuren',
    ])
  })
  it('reports confirmed downloads and preserves the existing failure copy', () => {
    expect(COPY.exported).toBe('Filen laddas ned.')
    expect(COPY.exportFailed).toBe('Kunde inte exportera just nu. Försök igen om en stund.')
    expect(COPY.deleteFailed).toBe('Kunde inte radera kontot. Inget raderades — försök igen.')
    expect(COPY.saveFailed).toBe('Det gick inte att spara – försök igen.')
  })
})
