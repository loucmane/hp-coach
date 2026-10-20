import { type ReactNode, useId, useLayoutEffect, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import { RasterDialog } from './RasterParts'

export type KontoSection = 'konto' | 'settings'

export function RasterKonto({
  theme,
  onTheme,
  onReturn,
  live,
  focusRequest,
}: Pick<DirectionProps, 'theme' | 'onTheme' | 'live'> & {
  onReturn: () => void
  focusRequest: { section: KontoSection } | null
}) {
  const { data, actions } = useDirectionData()
  const { identity, prefs, options, exam, links } = data.konto
  const [status, setStatus] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [word, setWord] = useState('')
  const [deleteRequested, setDeleteRequested] = useState(false)
  const deleteLatch = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const settingsHeading = useRef<HTMLHeadingElement>(null)
  const wordId = useId()
  useLayoutEffect(() => {
    if (!live || !focusRequest) return
    const target = focusRequest.section === 'settings' ? settingsHeading : heading
    target.current?.focus()
  }, [focusRequest, live])
  const request = (action: () => void, message: string, failure: string) => {
    try {
      const result = action()
      setStatus(message)
      void Promise.resolve(result).catch(() => setStatus(failure))
    } catch {
      setStatus(failure)
    }
  }
  return (
    <div className="ra-register-page ra-konto">
      <header className="ra-register-heading">
        <div>
          <p className="ra-label">Konto</p>
          <h1 ref={heading} tabIndex={-1}>
            Din studiemiljö.
          </h1>
        </div>
        <p>Konto och inställningar</p>
      </header>
      <div className="ra-account-grid">
        <aside className="ra-identity" data-testid="rd-konto-identity">
          <h2>Inloggad som</h2>
          <p className="ra-identity-name">{identity.name || 'Uppgift saknas'}</p>
          <p>{identity.email || 'Uppgift saknas'}</p>
          {identity.plan ? <p>{identity.plan}</p> : null}
          <dl>
            <div>
              <dt>Provet</dt>
              <dd>
                {exam.label} · {exam.daysLeft} dagar kvar
              </dd>
            </div>
          </dl>
        </aside>
        <section aria-label="Inställningar" className="ra-settings">
          <h2 ref={settingsHeading} tabIndex={-1}>
            Inställningar
          </h2>
          <Setting title="Tema">
            {(['light', 'dark'] as const).map((mode) => (
              <button
                type="button"
                key={mode}
                data-testid={`rd-konto-mode-${mode}`}
                aria-pressed={theme === mode}
                onClick={() => onTheme(mode)}
              >
                {mode === 'light' ? 'Ljust' : 'Mörkt'}
              </button>
            ))}
          </Setting>
          <p className="ra-setting-note">
            Raster använder en fast palett, typografi och luftig radindelning.
          </p>
          <Setting title="Coach">
            {options.coach.map((o) => (
              <button
                type="button"
                key={o.key}
                data-testid={`rd-konto-coach-${o.key}`}
                aria-pressed={prefs.coach === o.key}
                onClick={() =>
                  request(
                    () => actions.setPrefs({ coach: o.key }),
                    'Ändring av coach begärd.',
                    'Kunde inte spara ändringen.',
                  )
                }
              >
                <strong>{o.label}</strong>
                {o.blurb ? <small>{o.blurb}</small> : null}
              </button>
            ))}
          </Setting>
          <Setting title="Urval av frågor">
            {[true, false].map((smartDrill) => (
              <button
                type="button"
                key={String(smartDrill)}
                aria-pressed={prefs.smartDrill === smartDrill}
                onClick={() =>
                  request(
                    () => actions.setPrefs({ smartDrill }),
                    'Ändring av urval begärd.',
                    'Kunde inte spara ändringen.',
                  )
                }
              >
                {smartDrill ? 'Smart' : 'Slumpat'}
              </button>
            ))}
          </Setting>
          <Setting title="Visa övningssvit">
            {[true, false].map((showStreak) => (
              <button
                type="button"
                key={String(showStreak)}
                aria-pressed={prefs.showStreak === showStreak}
                onClick={() =>
                  request(
                    () => actions.setPrefs({ showStreak }),
                    'Ändring av övningssvit begärd.',
                    'Kunde inte spara ändringen.',
                  )
                }
              >
                {showStreak ? 'Visa' : 'Dölj'}
              </button>
            ))}
          </Setting>
          <p className="ra-setting-note">Daglig övningstid: {prefs.dailyMinutes} minuter.</p>
          <p className="ra-account-status" role="status">
            {status || 'Valen visar dina aktuella inställningar.'}
          </p>
          <nav className="ra-account-links" aria-label="Hjälp och information">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label} ↗
              </a>
            ))}
          </nav>
        </section>
      </div>
      <button type="button" className="ra-primary ra-account-return" onClick={onReturn}>
        Tillbaka till Öva <span aria-hidden>↗</span>
      </button>
      <details className="ra-account-data">
        <summary>Kontodata och utloggning</summary>
        <h2>Dina uppgifter</h2>
        <p>Exportera dina data innan du tar ställning till att radera kontot.</p>
        <button
          type="button"
          className="ra-outline"
          data-testid="rd-konto-export"
          onClick={() =>
            request(actions.exportData, 'Export begärd.', 'Kunde inte begära exporten.')
          }
        >
          Exportera mina data
        </button>
        <button
          type="button"
          className="ra-outline"
          data-testid="rd-konto-signout"
          onClick={() => request(actions.signOut, 'Utloggning begärd.', 'Kunde inte logga ut.')}
        >
          Logga ut
        </button>
        <section className="ra-account-danger">
          <h3>Radera kontot</h3>
          <p>Raderingen är permanent. Du behöver bekräfta innan den begärs.</p>
          <button
            type="button"
            className="ra-outline"
            data-testid="rd-konto-delete"
            aria-disabled={deleteRequested}
            onClick={() => {
              if (deleteRequested) return
              setWord('')
              setDeleting(true)
            }}
          >
            Radera kontot…
          </button>
        </section>
      </details>
      {deleting ? (
        <RasterDialog title="Radera kontot permanent?" onClose={() => setDeleting(false)}>
          <p>Det går inte att ångra. Exportera först om du vill behålla dina data.</p>
          <label htmlFor={wordId}>Skriv radera för att bekräfta</label>
          <input
            id={wordId}
            data-testid="rd-konto-delete-word"
            value={word}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setWord(event.target.value)}
          />
          <div className="ra-modal-actions">
            <button type="button" className="ra-outline" onClick={() => setDeleting(false)}>
              Avbryt
            </button>
            <button
              type="button"
              className="ra-outline"
              data-testid="rd-konto-delete-confirm"
              disabled={word !== 'radera' || deleteRequested}
              onClick={() => {
                if (word !== 'radera' || deleteLatch.current) return
                deleteLatch.current = true
                setDeleteRequested(true)
                request(
                  actions.deleteAccount,
                  'Radering begärd. Väntar på bekräftelse.',
                  'Kunde inte bekräfta raderingen.',
                )
                setDeleting(false)
              }}
            >
              Radera kontot permanent
            </button>
          </div>
        </RasterDialog>
      ) : null}
    </div>
  )
}

function Setting({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="ra-setting">
      <legend>{title}</legend>
      <div>{children}</div>
    </fieldset>
  )
}
