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
  it('excludes public auth steps and bake-offs', () => {
    for (const path of ['/hjalp', '/sign-up/verify-email-address', '/dev/redesign-2026'])
      expect(supportsFolio(path)).toBe(false)
    expect(supportsFolio('/mer')).toBe(true)
  })
  it.each([
    '/nav-bakeoff',
    '/drill-bake-off',
    '/explanation-bake-off',
    '/home-phone-resume-bakeoff',
    '/progress-bakeoff/details',
    '/m-compare',
    '/m-compare/details',
    '/redesign-lab',
    '/redesign-l12',
    '/drill-style-a',
    '/drill-style-c/details',
    '/dev',
    '/dev/account-menu-bakeoff-2',
  ])('does not wrap the standalone design route %s', (path) => {
    expect(supportsFolio(path)).toBe(false)
  })
  it.each([
    '/adaptive-verify',
    '/home-verify',
    '/prov-verify',
    '/prov-verify/details',
    '/future-verify',
    '/future-verify/details',
    '/dtk-browser',
    '/dtk-browser/details',
  ])('does not wrap the verification route %s', (path) => {
    expect(supportsFolio(path)).toBe(false)
  })
  it.each([
    '/',
    '/ova',
    '/prov',
    '/prov/resultat',
    '/drill',
    '/lektion',
    '/progress',
    '/konto',
    '/mer',
    '/welcome',
  ])('still wraps the production route %s', (path) => expect(supportsFolio(path)).toBe(true))
})
