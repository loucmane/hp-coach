import { ArrowLeft, Download } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { ThemeKey } from '@/components/devbake/redesign/r1Kit'
import { Hub, type HubProps } from './LagerOva'

export type AccountSection = 'konto' | 'settings' | 'help'

export function LagerKonto({
  theme,
  section,
  onSectionHandled,
  onBack,
  ...props
}: HubProps & {
  theme: ThemeKey
  section: AccountSection | null
  onSectionHandled: () => void
  onBack: () => void
}) {
  const { data, actions } = useDirectionData()
  const { identity, prefs, options, links, exam } = data.konto
  const [system, setSystem] = useState<ThemeKey | null>(null)
  useEffect(() => {
    if (system !== null && system !== theme) setSystem(null)
  }, [system, theme])
  const [deleting, setDeleting] = useState(false)
  const [notice, setNotice] = useState('')
  const [minutesDraft, setMinutesDraft] = useState<string | null>(null)
  const settings = useRef<HTMLElement>(null)
  const help = useRef<HTMLElement>(null)
  const account = useRef<HTMLElement>(null)
  const focusSection = useCallback((target: AccountSection) => {
    const el =
      target === 'settings' ? settings.current : target === 'help' ? help.current : account.current
    el?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
    el?.scrollIntoView?.({ block: 'start' })
  }, [])
  useEffect(() => {
    if (section === null) return
    focusSection(section)
    onSectionHandled()
  }, [section, focusSection, onSectionHandled])
  const request = (action: () => void, confirmation = '') => {
    try {
      action()
      setNotice(confirmation)
    } catch {
      setNotice('Ändringen kunde inte genomföras. Försök igen.')
    }
  }
  return (
    <Hub {...props} title="Konto och inställningar">
      <div className="la-account-layout">
        <aside className="la-sheet la-account-outline" data-depth="1">
          <nav aria-label="På kontosidan">
            <button type="button" className="la-menu-item" onClick={() => focusSection('konto')}>
              Konto
            </button>
            <button type="button" className="la-menu-item" onClick={() => focusSection('settings')}>
              Inställningar
            </button>
            <button type="button" className="la-menu-item" onClick={() => focusSection('help')}>
              Verktyg och hjälp
            </button>
          </nav>
          <p className="la-account-exam">
            {exam.label}
            <br />
            {exam.daysLeft} dagar kvar
          </p>
        </aside>
        <div
          className={`la-sheet la-account-content${props.live ? ' la-rise' : ''}`}
          data-depth="2"
        >
          <section className="la-account-section" ref={account} data-testid="rd-konto-identity">
            <h2 tabIndex={-1}>Ditt konto</h2>
            <p className="la-account-name">{identity.name || 'Konto'}</p>
            {identity.email ? (
              <p className="la-account-email">{identity.email}</p>
            ) : (
              <p>Kontouppgifterna är inte tillgängliga.</p>
            )}
            {identity.plan ? <p>{identity.plan}</p> : null}
            {identity.name || identity.email ? (
              <button
                type="button"
                className="la-quiet"
                data-testid="rd-konto-signout"
                onClick={() => request(actions.signOut)}
              >
                Logga ut
              </button>
            ) : null}
          </section>
          <section className="la-account-section" ref={settings}>
            <h2 tabIndex={-1}>Inställningar</h2>
            <fieldset className="la-pref">
              <legend>Tema</legend>
              <div className="la-seg">
                {options.mode.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    data-testid={`rd-konto-mode-${option.key}`}
                    aria-pressed={system !== theme && theme === option.key}
                    onClick={() => {
                      setSystem(null)
                      request(() => actions.setTheme(option.key))
                    }}
                  >
                    {option.label}
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={system === theme}
                  onClick={() => {
                    const mode =
                      typeof window.matchMedia === 'function' &&
                      window.matchMedia('(prefers-color-scheme: dark)').matches
                        ? 'dark'
                        : 'light'
                    setSystem(mode)
                    request(() => actions.setTheme(mode))
                  }}
                >
                  System
                </button>
              </div>
              <p>System väljer enhetens utseende nu: ljust eller mörkt.</p>
            </fieldset>
            {(['coach', 'palette', 'font', 'density'] as const).map((pref) => (
              <fieldset className="la-pref" key={pref}>
                <legend>
                  {
                    { coach: 'Coach', palette: 'Färgpalett', font: 'Typsnitt', density: 'Täthet' }[
                      pref
                    ]
                  }
                </legend>
                <div className="la-pref-options">
                  {options[pref].map((option) => (
                    <button
                      type="button"
                      key={option.key}
                      data-testid={`rd-konto-${pref}-${option.key}`}
                      aria-pressed={prefs[pref] === option.key}
                      onClick={() => request(() => actions.setPrefs({ [pref]: option.key }))}
                    >
                      <b>{option.label}</b>
                      {option.blurb ? <span>{option.blurb}</span> : null}
                    </button>
                  ))}
                </div>
                {pref !== 'coach' ? (
                  <p>
                    Valet gäller appens grundutseende. Den här förhandsvisningen behåller Lagers
                    form.
                  </p>
                ) : null}
              </fieldset>
            ))}
            <fieldset className="la-pref">
              <legend>Urval av frågor</legend>
              <div className="la-seg">
                <button
                  type="button"
                  aria-pressed={prefs.smartDrill}
                  onClick={() => request(() => actions.setPrefs({ smartDrill: true }))}
                >
                  Smart
                </button>
                <button
                  type="button"
                  aria-pressed={!prefs.smartDrill}
                  onClick={() => request(() => actions.setPrefs({ smartDrill: false }))}
                >
                  Slumpat
                </button>
              </div>
            </fieldset>
            <label className="la-pref-check">
              <input
                type="checkbox"
                checked={prefs.showStreak}
                onChange={(e) => request(() => actions.setPrefs({ showStreak: e.target.checked }))}
              />
              Visa dagar i följd
            </label>
            <label className="la-pref-minutes">
              Daglig studietid (minuter)
              <input
                type="number"
                min={5}
                max={240}
                value={minutesDraft ?? String(prefs.dailyMinutes)}
                onChange={(e) => setMinutesDraft(e.target.value)}
                onBlur={(e) => {
                  const n = e.target.valueAsNumber
                  setMinutesDraft(null)
                  if (Number.isInteger(n) && n >= 5 && n <= 240)
                    request(() => actions.setPrefs({ dailyMinutes: n }))
                  else setNotice('Välj mellan 5 och 240 minuter.')
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                }}
              />
            </label>
          </section>
          <section className="la-account-section" ref={help}>
            <h2 tabIndex={-1}>Verktyg och hjälp</h2>
            <button
              type="button"
              className="la-quiet"
              data-testid="rd-konto-export"
              onClick={() => request(actions.exportData, 'Export begärd.')}
            >
              <Download size={17} aria-hidden />
              Exportera mina data
            </button>
            <ul className="la-account-links">
              {links.map((link) => (
                <li key={link.href}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </section>
          <details className="la-account-danger">
            <summary>Radera konto</summary>
            <p>Förhandsvisning av radering. Inget raderas här.</p>
            <p>Exportera gärna dina data först. Radering går inte att ångra.</p>
            <button
              type="button"
              className="la-quiet"
              data-testid="rd-konto-delete"
              onClick={() => setDeleting(true)}
            >
              Radera konto…
            </button>
          </details>
          <p role="status" className="la-account-notice">
            {notice}
          </p>
          <button type="button" className="la-btn" onClick={onBack}>
            <ArrowLeft size={18} aria-hidden />
            Tillbaka
          </button>
        </div>
      </div>
      {deleting ? <DeleteConfirmation onClose={() => setDeleting(false)} /> : null}
    </Hub>
  )
}

function DeleteConfirmation({ onClose }: { onClose: () => void }) {
  const { actions } = useDirectionData()
  const dialog = useRef<HTMLDialogElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const title = useId()
  const input = useId()
  const [word, setWord] = useState('')
  const [notice, setNotice] = useState('')
  const [requested, setRequested] = useState(false)
  useLayoutEffect(() => {
    const previous = document.activeElement
    const node = dialog.current
    node?.showModal()
    cancel.current?.focus()
    return () => {
      node?.close()
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [])
  return (
    <dialog
      className="la-confirm la-delete-confirm"
      ref={dialog}
      aria-labelledby={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <h2 className="la-h" id={title}>
        Radera konto
      </h2>
      <div className="la-confirm-body">
        <p>Förhandsvisning av radering. Inget raderas här.</p>
        <p>
          Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom
          30 dagar. Det går inte att ångra.
        </p>
        <button
          type="button"
          className="la-quiet"
          onClick={() => {
            try {
              actions.exportData()
              setNotice('Export begärd.')
            } catch {
              setNotice('Exporten kunde inte begäras. Försök igen.')
            }
          }}
        >
          Exportera mina data
        </button>
        <label htmlFor={input}>Skriv radera för att bekräfta</label>
        <input
          id={input}
          data-testid="rd-konto-delete-word"
          value={word}
          autoComplete="off"
          disabled={requested}
          onChange={(e) => setWord(e.target.value)}
        />
        <p role="status">{notice}</p>
      </div>
      <div className="la-confirm-actions">
        <button type="button" className="la-quiet" ref={cancel} onClick={onClose}>
          Tillbaka
        </button>
        <button
          type="button"
          className="la-btn"
          data-testid="rd-konto-delete-confirm"
          disabled={word !== 'radera' || requested}
          onClick={() => {
            if (word !== 'radera' || requested) return
            try {
              actions.deleteAccount()
              setRequested(true)
              setNotice('Begäran skickad. Inget raderas i den här förhandsvisningen.')
            } catch {
              setNotice('Begäran kunde inte skickas. Försök igen.')
            }
          }}
        >
          Radera kontot permanent
        </button>
      </div>
    </dialog>
  )
}
