import { describe, expect, it } from 'vitest'
import { ACCOUNT_ROUTES, currentDestination, DESTINATIONS, supportsFolio } from './nav'

describe('Folio navigation', () => {
  it('uses real routes in the prototype order', () => {
    expect(DESTINATIONS.map((d) => [d.label, d.to])).toEqual([
      ['Idag', '/'],
      ['Öva', '/ova'],
      ['Provpass', '/prov'],
      ['Uppslag', '/lektion'],
      ['Framsteg', '/progress'],
    ])
    expect(ACCOUNT_ROUTES).toEqual({ konto: '/konto', settings: '/mer' })
  })
  it.each([
    ['/', 'idag'],
    ['/ova', 'ova'],
    ['/repetition', 'ova'],
    ['/drill', 'ova'],
    ['/diagnostik', 'ova'],
    ['/prov', 'provpass'],
    ['/prov/resultat', 'provpass'],
    ['/lektion', 'uppslag'],
    ['/progress', 'framsteg'],
    ['/konto', null],
    ['/mer', null],
    ['/prova', null],
  ])('maps %s to %s', (path, expected) => {
    expect(currentDestination(path)).toBe(expected)
  })
  it('excludes welcome, public auth steps, and bake-offs', () => {
    for (const path of [
      '/welcome',
      '/hjalp',
      '/sign-up/verify-email-address',
      '/dev/redesign-2026',
    ])
      expect(supportsFolio(path)).toBe(false)
    expect(supportsFolio('/mer')).toBe(true)
  })
})
