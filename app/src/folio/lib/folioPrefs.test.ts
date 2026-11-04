import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FolioPrefsValues } from './folioPrefs'

const KEY = 'hpc-folio-prefs'

const DEFAULTS: FolioPrefsValues = {
  theme: 'system',
  motion: 'system',
  kbd: true,
  textSize: 'normal',
  palette: 'spalt',
  showMyTime: false,
}

const pick = ({ theme, motion, kbd, textSize, palette, showMyTime }: FolioPrefsValues) => ({
  theme,
  motion,
  kbd,
  textSize,
  palette,
  showMyTime,
})

// A fresh module per load, so each case reads storage the way a reload does.
const load = () => import('./folioPrefs')

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
})

describe('folioPrefs', () => {
  it('defaults to the system theme and the Spalt palette', async () => {
    const { useFolioPrefs, FOLIO_PREFS_DEFAULTS } = await load()
    expect(FOLIO_PREFS_DEFAULTS).toEqual(DEFAULTS)
    expect(pick(useFolioPrefs.getState())).toEqual(DEFAULTS)
  })

  it('offers every Konto choice, with all five palettes', async () => {
    const { FOLIO_THEMES, FOLIO_MOTIONS, FOLIO_TEXT_SIZES, FOLIO_PALETTES } = await load()
    expect(FOLIO_THEMES).toEqual(['light', 'dark', 'system'])
    expect(FOLIO_MOTIONS).toEqual(['system', 'less', 'none'])
    expect(FOLIO_TEXT_SIZES).toEqual(['small', 'normal', 'large', 'xlarge'])
    expect(FOLIO_PALETTES).toEqual(['spalt', 'sand', 'sage', 'ink', 'rose'])
  })

  it('persists every pref across a reload', async () => {
    let { useFolioPrefs } = await load()
    const next: FolioPrefsValues = {
      theme: 'dark',
      motion: 'less',
      kbd: false,
      textSize: 'xlarge',
      palette: 'rose',
      showMyTime: true,
    }
    useFolioPrefs.getState().setPrefs(next)
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({ state: next, version: 1 })
    vi.resetModules()
    ;({ useFolioPrefs } = await load())
    expect(pick(useFolioPrefs.getState())).toEqual(next)
  })

  it.each([
    'broken json',
    '42',
    '"dark"',
    'null',
    '{}',
    JSON.stringify({
      state: {
        theme: 'blue',
        motion: 7,
        kbd: 'yes',
        textSize: 'huge',
        palette: 'red',
        showMyTime: 1,
      },
      version: 1,
    }),
  ])('ignores corrupt storage %s', async (raw) => {
    localStorage.setItem(KEY, raw)
    const { useFolioPrefs } = await load()
    expect(pick(useFolioPrefs.getState())).toEqual(DEFAULTS)
  })

  it('keeps the valid fields of a partly corrupt record', async () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ state: { theme: 'light', palette: 'nope', kbd: false }, version: 1 }),
    )
    const { useFolioPrefs } = await load()
    expect(pick(useFolioPrefs.getState())).toEqual({ ...DEFAULTS, theme: 'light', kbd: false })
  })

  it('carries valid prefs over from another stored version', async () => {
    localStorage.setItem(KEY, JSON.stringify({ state: { theme: 'dark', motion: 'x' }, version: 0 }))
    const { useFolioPrefs } = await load()
    expect(pick(useFolioPrefs.getState())).toEqual({ ...DEFAULTS, theme: 'dark' })
  })

  it('ignores invalid values at runtime and skips writes that change nothing', async () => {
    const { useFolioPrefs } = await load()
    const listener = vi.fn()
    const unsubscribe = useFolioPrefs.subscribe(listener)
    useFolioPrefs.getState().setPrefs({ theme: 'blue' as never, kbd: 'no' as never })
    useFolioPrefs.getState().setPrefs({ theme: 'system', palette: 'spalt' })
    expect(listener).not.toHaveBeenCalled()
    expect(pick(useFolioPrefs.getState())).toEqual(DEFAULTS)
    useFolioPrefs.getState().setPrefs({ palette: 'sage' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(useFolioPrefs.getState().palette).toBe('sage')
    unsubscribe()
  })

  it('sanitizes an untrusted record for server hydration', async () => {
    const { sanitizeFolioPrefs } = await load()
    expect(sanitizeFolioPrefs({ theme: 'dark', textSize: 'small', kbd: 0, extra: 1 })).toEqual({
      theme: 'dark',
      textSize: 'small',
    })
    expect(sanitizeFolioPrefs(null)).toEqual({})
    expect(sanitizeFolioPrefs('dark')).toEqual({})
  })

  it('resets to the defaults', async () => {
    const { useFolioPrefs } = await load()
    useFolioPrefs.getState().setPrefs({ theme: 'light', showMyTime: true })
    useFolioPrefs.getState().resetPrefs()
    expect(pick(useFolioPrefs.getState())).toEqual(DEFAULTS)
  })

  it('still works in memory when storage is unavailable', async () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    try {
      const { useFolioPrefs } = await load()
      expect(pick(useFolioPrefs.getState())).toEqual(DEFAULTS)
      expect(() => useFolioPrefs.getState().setPrefs({ theme: 'dark' })).not.toThrow()
      expect(useFolioPrefs.getState().theme).toBe('dark')
    } finally {
      read.mockRestore()
      write.mockRestore()
    }
  })
})
