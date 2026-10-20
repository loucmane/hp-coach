import { ArrowLeft, Download, LogOut } from 'lucide-react'
import { type ReactNode, useId, useState } from 'react'
import { useDirectionData } from '../directionData'
import type { ThemeKey } from '../r1Kit'
import type { PrefOption } from '../viewModel'

export function InstrumentKonto({ onTheme }: { onTheme: (mode: ThemeKey) => void }) {
  const { data, actions } = useDirectionData()
  const { identity, prefs, options, links } = data.konto
  const [notice, setNotice] = useState('')
  const id = useId()
  return (
    <div className="in-hub in-account-page">
      <header className="in-library-heading">
        <div>
          <span className="in-code">Arbetsmiljö</span>
          <h1>Konto & inställningar</h1>
        </div>
        <button type="button" className="in-btn2" onClick={() => actions.go('ova')}>
          <ArrowLeft size={16} aria-hidden />
          Tillbaka till Öva
        </button>
      </header>
      <nav className="in-account-jumps" aria-label="Kontodelar">
        <a href={`#${id}-konto`}>Konto</a>
        <a href={`#${id}-settings`}>Inställningar</a>
      </nav>
      <section id={`${id}-konto`} className="in-account-group" aria-labelledby={`${id}-identity`}>
        <h2 id={`${id}-identity`}>Konto</h2>
        <div className="in-identity" data-testid="rd-konto-identity">
          <span className="in-avatar" aria-hidden>
            {identity.initials || 'HP'}
          </span>
          <div>
            <h3>{identity.name || 'Kontouppgifter är inte tillgängliga'}</h3>
            {identity.email ? <p>{identity.email}</p> : null}
            {identity.plan ? <p className="in-sub">{identity.plan}</p> : null}
          </div>
        </div>
      </section>
      <section
        id={`${id}-settings`}
        className="in-account-group"
        aria-labelledby={`${id}-appearance`}
      >
        <h2 id={`${id}-appearance`}>Utseende</h2>
        <Choice
          label="Läge"
          test="mode"
          value={prefs.mode}
          options={options.mode}
          onChange={onTheme}
        />
        <Setting label="Palett">
          <p>Instrument · grått chassi, signalorange.</p>
          <p className="in-sub">Paletten är fast i den här förhandsvisningen.</p>
          <div className="in-setting-choices">
            {options.palette.map((option) => (
              <button
                type="button"
                className="in-btn2"
                key={option.key}
                data-testid={`rd-konto-palette-${option.key}`}
                aria-pressed={prefs.palette === option.key}
                disabled
              >
                {option.label}
              </button>
            ))}
          </div>
        </Setting>
        <Choice
          label="Läsfont"
          test="font"
          value={prefs.font}
          options={options.font}
          onChange={(font) => actions.setPrefs({ font })}
        />
        <Choice
          label="Täthet"
          test="density"
          value={prefs.density}
          options={options.density}
          onChange={(density) => actions.setPrefs({ density })}
        />
        <p className="in-setting-note">
          Valen gäller din inställning. Instrument visar sin egen typografi och paneltäthet under
          jämförelsen.
        </p>
      </section>
      <section className="in-account-group" aria-labelledby={`${id}-coach`}>
        <h2 id={`${id}-coach`}>Övning</h2>
        <Choice
          label="Coachröst"
          test="coach"
          value={prefs.coach}
          options={options.coach}
          onChange={(coach) => actions.setPrefs({ coach })}
        />
        <Choice
          label="Frågeurval"
          test="smart"
          value={prefs.smartDrill ? 'smart' : 'random'}
          options={[
            { key: 'smart', label: 'Smart', blurb: 'Frågor nära din nivå.' },
            { key: 'random', label: 'Slumpat', blurb: 'Frågor utan anpassat urval.' },
          ]}
          onChange={(key) => actions.setPrefs({ smartDrill: key === 'smart' })}
        />
        <Setting label="Studietakt">
          <label className="in-setting-check">
            <input
              type="checkbox"
              checked={prefs.showStreak}
              onChange={(event) => actions.setPrefs({ showStreak: event.target.checked })}
            />
            Visa dagar i följd
          </label>
          <label className="in-minute-setting">
            Minuter per dag
            <input
              type="number"
              min={1}
              max={180}
              value={prefs.dailyMinutes}
              onChange={(event) => {
                const value = event.target.valueAsNumber
                if (Number.isFinite(value) && value >= 1 && value <= 180)
                  actions.setPrefs({ dailyMinutes: value })
              }}
            />
          </label>
        </Setting>
      </section>
      <section className="in-account-group" aria-labelledby={`${id}-tools`}>
        <h2 id={`${id}-tools`}>Verktyg & länkar</h2>
        <button type="button" className="in-hub-door" onClick={() => actions.go('provpass')}>
          Provpass
        </button>
        <details className="in-lesson-detail">
          <summary>Hjälp och övriga verktyg</summary>
          <p>Dessa länkar lämnar förhandsvisningen och öppnar den ordinarie appen.</p>
          <ul>
            {links.map((link) => (
              <li key={link.href}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <section className="in-account-group" aria-labelledby={`${id}-data`}>
        <h2 id={`${id}-data`}>Dina data</h2>
        <p>
          Här kan du begära en export. Förhandsvisningen visar ingen bekräftelse från kontotjänsten.
        </p>
        <div className="in-account-actions">
          <button
            type="button"
            className="in-btn2"
            data-testid="rd-konto-export"
            onClick={() => {
              actions.exportData()
              setNotice('Export begärd. Vänta på kontotjänstens besked.')
            }}
          >
            <Download size={16} aria-hidden />
            Exportera data
          </button>
          <button
            type="button"
            className="in-btn2"
            data-testid="rd-konto-signout"
            onClick={() => {
              actions.signOut()
              setNotice('Utloggning begärd.')
            }}
          >
            <LogOut size={16} aria-hidden />
            Logga ut
          </button>
        </div>
        <p role="status">{notice}</p>
        <details className="in-lesson-detail">
          <summary>Radera konto</summary>
          <p>Radering är inte tillgänglig i den här förhandsvisningen.</p>
          <button type="button" className="in-btn2" data-testid="rd-konto-delete" disabled>
            Radera konto
          </button>
        </details>
      </section>
    </div>
  )
}

function Setting({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="in-setting-row">
      <h3>{label}</h3>
      <div>{children}</div>
    </div>
  )
}
function Choice<K extends string>({
  label,
  test,
  value,
  options,
  onChange,
}: {
  label: string
  test: string
  value: K
  options: PrefOption<K>[]
  onChange: (key: K) => void
}) {
  return (
    <Setting label={label}>
      <fieldset className="in-setting-choices" aria-label={label}>
        {options.map((option) => (
          <button
            type="button"
            className="in-btn2"
            key={option.key}
            data-testid={`rd-konto-${test}-${option.key}`}
            aria-pressed={value === option.key}
            onClick={() => onChange(option.key)}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      {options.find((option) => option.key === value)?.blurb ? (
        <p className="in-sub">{options.find((option) => option.key === value)?.blurb}</p>
      ) : null}
    </Setting>
  )
}
