import { describe, expect, it } from 'vitest'

import { devLoginErrorText } from './dev-login'

describe('devLoginErrorText', () => {
  it('reads the long message of a Clerk API error, whose own message is empty', () => {
    const err = Object.assign(new Error(''), {
      errors: [{ message: 'Session exists', longMessage: "You're already signed in." }],
    })
    expect(devLoginErrorText(err)).toBe("You're already signed in.")
  })

  it('falls back to the short Clerk message, then the error message', () => {
    expect(devLoginErrorText({ errors: [{ message: 'Invalid ticket' }] })).toBe('Invalid ticket')
    expect(devLoginErrorText(new Error('HTTP 503'))).toBe('HTTP 503')
  })

  it('never returns an empty string', () => {
    expect(devLoginErrorText(new Error(''))).toBe('okänt fel')
    expect(devLoginErrorText(undefined)).toBe('okänt fel')
  })
})
