import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { useFolioPrefs } from '@/folio/lib/folioPrefs'
import type { PaletteKey } from '@/lib/tokens'
import './focus.css'

const PALETTES: { key: PaletteKey; label: string }[] = [
  { key: 'spalt', label: 'Spalt' },
  { key: 'sand', label: 'Sand' },
  { key: 'sage', label: 'Salvia' },
  { key: 'ink', label: 'Bläck' },
  { key: 'rose', label: 'Ros' },
]

// The Ljusbord root reads the Folio prefs (theme incl. system, palette), so
// the picker writes there first; it still calls the synced setters so the
// server-side theme and the classic app stay in step until LJ-17 syncs the
// Folio prefs themselves.
export function ThemePicker() {
  const palette = useFolioPrefs((s) => s.palette)
  const theme = useFolioPrefs((s) => s.theme)
  const setPrefs = useFolioPrefs((s) => s.setPrefs)
  const synced = useSyncedPrefs()
  const chooseTheme = (next: 'light' | 'dark' | 'system') => {
    setPrefs({ theme: next })
    if (next !== 'system') void synced.setMode(next).catch(() => {})
  }
  const choosePalette = (key: PaletteKey) => {
    setPrefs({ palette: key })
    void synced.setPalette(key).catch(() => {})
  }
  return (
    <>
      <fieldset className="fa-theme fa-theme-picker">
        <legend className="fa-theme-label">Tema</legend>
        <div className="fa-seg fa-theme-choices">
          <button
            type="button"
            aria-pressed={theme === 'light'}
            onClick={() => chooseTheme('light')}
          >
            Ljust
          </button>
          <button
            type="button"
            data-testid="fa-theme-toggle"
            aria-pressed={theme === 'dark'}
            onClick={() => chooseTheme('dark')}
          >
            Mörkt
          </button>
          <button
            type="button"
            aria-pressed={theme === 'system'}
            onClick={() => chooseTheme('system')}
          >
            Som systemet
          </button>
        </div>
      </fieldset>
      <fieldset className="fa-theme fa-theme-picker">
        <legend className="fa-theme-label">Färg</legend>
        <div className="fa-palette-words fa-theme-choices">
          {PALETTES.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              aria-pressed={palette === key}
              onClick={() => choosePalette(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  )
}
