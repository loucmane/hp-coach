import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import type { PaletteKey } from '@/lib/tokens'
import { useUiStore } from '@/stores/uiStore'

const PALETTES: { key: PaletteKey; label: string }[] = [
  { key: 'spalt', label: 'Spalt' },
  { key: 'sand', label: 'Sand' },
  { key: 'sage', label: 'Salvia' },
  { key: 'ink', label: 'Bläck' },
  { key: 'rose', label: 'Ros' },
]

export function ThemePicker() {
  const palette = useUiStore((s) => s.palette)
  const mode = useUiStore((s) => s.mode)
  const synced = useSyncedPrefs()
  return (
    <>
      <fieldset className="fa-theme">
        <legend className="fa-theme-label">Tema</legend>
        <div className="fa-seg">
          <button
            type="button"
            aria-pressed={mode === 'light'}
            onClick={() => void synced.setMode('light').catch(() => {})}
          >
            Ljust
          </button>
          <button
            type="button"
            data-testid="fa-theme-toggle"
            aria-pressed={mode === 'dark'}
            onClick={() => void synced.setMode('dark').catch(() => {})}
          >
            Mörkt
          </button>
        </div>
      </fieldset>
      <fieldset className="fa-theme">
        <legend className="fa-theme-label">Färg</legend>
        <div className="fa-palette-words">
          {PALETTES.map(({ key, label }) => (
            <button
              type="button"
              key={key}
              aria-pressed={palette === key}
              onClick={() => void synced.setPalette(key).catch(() => {})}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </>
  )
}
