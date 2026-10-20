import { ArrowRight, Check, LampDesk } from 'lucide-react'
import { type ReactNode, useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { DirectionProps } from '@/components/devbake/redesign/r1Kit'
import type { DirectionActions, PrefOption } from '@/components/devbake/redesign/viewModel'
import {
  bringToTop,
  count,
  type FramePage,
  type KontoVisit,
  type OpenPage,
  type ReadingLight,
} from './LjuskaglaParts'

/** The word the real app's deletion asks for (routes/konto.tsx). */
const DELETE_WORD = 'radera'

/** The two ways to choose questions (routes/mer.tsx SmartDrillWords). */
const SELECTION: PrefOption<'smart' | 'random'>[] = [
  { key: 'smart', label: 'Smart', blurb: 'Frågor nära din nivå' },
  { key: 'random', label: 'Slumpat', blurb: 'Helt slumpade frågor' },
]

type Back = { label: string; page: FramePage; ask: () => void }

/** Konto's one way on: back to where the reader came from, else Idag. */
function backFrom(from: FramePage | null, actions: DirectionActions, resultId: string): Back {
  switch (from) {
    case 'ova':
      return { label: 'Tillbaka till Öva', page: 'ova', ask: () => actions.go('ova') }
    case 'repetera':
      return {
        label: 'Tillbaka till Repetera',
        page: 'repetera',
        ask: () => actions.openRepetera(),
      }
    case 'provpass':
      return {
        label: 'Tillbaka till Provpass',
        page: 'provpass',
        ask: () => actions.go('provpass'),
      }
    case 'resultat':
      return {
        label: 'Tillbaka till resultatet',
        page: 'resultat',
        ask: () => actions.openProvResult(resultId),
      }
    case 'uppslag':
      return { label: 'Tillbaka till läsningen', page: 'uppslag', ask: () => actions.go('uppslag') }
    case 'framsteg':
      return {
        label: 'Tillbaka till Framsteg',
        page: 'framsteg',
        ask: () => actions.go('framsteg'),
      }
    default:
      return { label: 'Tillbaka till Idag', page: 'idag', ask: () => actions.go('idag') }
  }
}

/**
 * One exclusive choice: a labelled group of buttons, one pressed at a time,
 * its state in words and in aria-pressed. Pressing applies it at once; focus
 * stays where it is. (Spec §13 asks for radio groups; a radio group would
 * own ←/→, and on the bake-off a focused choice would then change a
 * setting instead of the screen. These keep the switcher's keys.)
 */
function Choices<K extends string>({
  label,
  hint,
  options,
  value,
  testId,
  onPick,
  level = 3,
}: {
  label: string
  hint?: ReactNode
  options: PrefOption<K>[]
  value: K
  /** rd-konto-<group>: each choice is rd-konto-<group>-<key>. */
  testId?: string
  onPick: (key: K) => void
  /** The label's heading level: 4 inside a titled group (Avancerat). */
  level?: 3 | 4
}) {
  const id = useId()
  const Heading = level === 4 ? 'h4' : 'h3'
  return (
    <fieldset className="lj-pref" aria-labelledby={id}>
      <div className="lj-pref-label">
        <Heading id={id}>{label}</Heading>
        {hint && <p>{hint}</p>}
      </div>
      <div className="lj-pref-choices">
        {options.map((o) => {
          const on = value === o.key
          const blurb = `${id}-${o.key}`
          return (
            <button
              key={o.key}
              type="button"
              className="lj-choice"
              data-testid={testId ? `${testId}-${o.key}` : undefined}
              aria-label={o.blurb ? o.label : undefined}
              aria-describedby={o.blurb ? blurb : undefined}
              aria-pressed={on}
              onClick={() => onPick(o.key)}
            >
              <span className="lj-choice-label">
                {o.label}
                {on && <Check size={14} aria-hidden />}
              </span>
              {o.blurb && (
                <span className="lj-choice-blurb" id={blurb}>
                  {o.blurb}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/**
 * Konto & inställningar: the reading room first. Läge and Styckeljus share
 * one modest lamp with the page's one filled action — back to where the
 * reader came from. Coach, selection and the app's finer preferences follow
 * as quiet rows; the palette stays Ljuskägla's own while the directions are
 * compared. The account comes after: who is signed in, the provider's
 * plan and sign-in notes, help and terms, sign-out, export, and at the very
 * bottom a deletion that asks for the typed word and, in this preview,
 * deletes nothing.
 *
 * Settings apply at once and nothing claims a save the host has not shown:
 * the choices are the host's preferences as they come back. Konto takes
 * focus only where the reader asked to go (a row in the account menu or a
 * jump link); straight in, it leaves focus and scroll alone.
 */
export function LjuskaglaKonto({
  theme,
  live,
  visit,
  light,
  onOpen,
}: Pick<DirectionProps, 'theme' | 'live'> & {
  visit: KontoVisit | null
  light: ReadingLight
  onOpen: OpenPage
}) {
  const { data, actions } = useDirectionData()
  const { identity, exam, prefs, options, links } = data.konto
  const [said, setSaid] = useState('')
  const [exported, setExported] = useState(false)
  const [signedOut, setSignedOut] = useState(false)
  const [asking, setAsking] = useState(false)
  const [word, setWord] = useState('')
  const [sent, setSent] = useState(false)
  const settingsRef = useRef<HTMLHeadingElement>(null)
  const kontoRef = useRef<HTMLHeadingElement>(null)
  const wordRef = useRef<HTMLInputElement>(null)
  const deleteRef = useRef<HTMLButtonElement>(null)
  const settingsId = useId()
  const kontoId = useId()
  const advancedId = useId()
  const linksId = useId()
  const dataId = useId()
  const deleteId = useId()
  const wordId = useId()
  const back = backFrom(visit?.from ?? null, actions, data.provpass.result.id)
  const known = Boolean(identity.name || identity.email)
  // The exact word, as the real app asks (routes/konto.tsx).
  const armed = word === DELETE_WORD
  const palette = options.palette.find((o) => o.key === prefs.palette)?.label ?? prefs.palette

  // A part the reader asked for comes to the top with focus; straight in,
  // nothing moves.
  // biome-ignore lint/correctness/useExhaustiveDependencies: each ask (visit.at) brings its part once
  useEffect(() => {
    if (!live || !visit?.section) return
    bringToTop(visit.section === 'konto' ? kontoRef.current : settingsRef.current)
  }, [visit?.at])
  // The typed word takes focus when the reader opens the deletion.
  useEffect(() => {
    if (asking && live) wordRef.current?.focus()
  }, [asking, live])

  const setMode = (mode: 'light' | 'dark') => {
    actions.setTheme(mode)
    setSaid(mode === 'dark' ? 'Mörkt läge.' : 'Ljust läge.')
  }
  const setLight = (on: boolean) => {
    light.onSpotlight(on)
    setSaid(on ? 'Styckeljuset är på.' : 'Styckeljuset är av.')
  }
  const cancelDelete = () => {
    setAsking(false)
    setWord('')
    deleteRef.current?.focus()
  }

  return (
    <div className="lj-page lj-konto">
      <header className="lj-page-head">
        <p className="lj-eyebrow">Konto och inställningar</p>
        <h1>Ställ in ditt läsrum.</h1>
      </header>
      <nav className="lj-jump lj-konto-jump" aria-label="Delar av sidan">
        <button type="button" onClick={() => bringToTop(settingsRef.current)}>
          Inställningar
        </button>
        <button type="button" onClick={() => bringToTop(kontoRef.current)}>
          Konto
        </button>
      </nav>

      <section className="lj-konto-part" aria-labelledby={settingsId}>
        <div className="lj-resume lj-konto-lamp">
          <div className="lj-resume-top">
            <span className="lj-eyebrow">Inställningar</span>
            <LampDesk size={28} strokeWidth={1.3} aria-hidden />
          </div>
          <h2 id={settingsId} ref={settingsRef} tabIndex={-1}>
            Ditt läsrum
          </h2>
          <Choices
            label="Läge"
            options={options.mode}
            value={theme}
            testId="rd-konto-mode"
            onPick={setMode}
          />
          <fieldset className="lj-pref" aria-labelledby={`${settingsId}-light`}>
            <div className="lj-pref-label">
              <h3 id={`${settingsId}-light`}>Styckeljus</h3>
              <p>
                Lyser upp stycket du läser. Gäller bara här i förhandsvisningen och sparas inte.
              </p>
            </div>
            <div className="lj-pref-choices">
              <button
                type="button"
                className="lj-choice lj-light-switch"
                data-testid="rd-konto-spotlight"
                aria-pressed={light.spotlight}
                onClick={() => setLight(!light.spotlight)}
              >
                <span className="lj-choice-label">
                  Styckeljus {light.spotlight ? 'på' : 'av'}
                  <i className="lj-switch" aria-hidden />
                </span>
              </button>
            </div>
          </fieldset>
          <p className="lj-konto-said" role="status">
            {said}
          </p>
          <button type="button" className="lj-primary" onClick={() => onOpen(back.page, back.ask)}>
            <span>{back.label}</span>
            <ArrowRight size={20} aria-hidden />
          </button>
        </div>

        <div className="lj-konto-rows lj-shade">
          <Choices
            label="Coachens röst"
            hint="Hur förklaringar och påminnelser låter."
            options={options.coach}
            value={prefs.coach}
            testId="rd-konto-coach"
            onPick={(coach) => actions.setPrefs({ coach })}
          />
          <Choices
            label="Urval"
            hint="Hur frågorna till en övning väljs."
            options={SELECTION}
            value={prefs.smartDrill ? 'smart' : 'random'}
            onPick={(key) => actions.setPrefs({ smartDrill: key === 'smart' })}
          />
          <section className="lj-konto-advanced" aria-labelledby={advancedId}>
            <div className="lj-section-head">
              <h3 id={advancedId}>Avancerat</h3>
            </div>
            <p className="lj-hub-note">
              Typsnitt och täthet gäller appens egna sidor. Ljuskägla behåller Manrope, Spectral och
              sin egen rytm medan riktningarna jämförs.
            </p>
            <Choices
              label="Typsnitt"
              level={4}
              options={options.font}
              value={prefs.font}
              testId="rd-konto-font"
              onPick={(font) => actions.setPrefs({ font })}
            />
            <Choices
              label="Täthet"
              level={4}
              options={options.density}
              value={prefs.density}
              testId="rd-konto-density"
              onPick={(density) => actions.setPrefs({ density })}
            />
            {/* Spec §13 and owner question 6: the comparison keeps Ljuskägla's
                own palette, so the palette is named here, not chosen
                (meta.ts omits.konto). */}
            <div className="lj-pref lj-pref-fixed">
              <div className="lj-pref-label">
                <h4>Palett</h4>
              </div>
              <p>
                Appens palett är {palette}. Ljuskägla behåller sina egna färger medan riktningarna
                jämförs; vilken palett appen får sedan avgörs när en riktning är vald.
              </p>
            </div>
          </section>
          {links.length > 0 && (
            <section className="lj-konto-links" aria-labelledby={linksId}>
              <h3 id={linksId}>Hjälp och villkor</h3>
              <ul>
                {links.map((link) => (
                  <li key={link.href}>
                    <a href={link.href}>
                      {link.label}
                      <ArrowRight size={14} aria-hidden />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section className="lj-konto-part lj-konto-account" aria-labelledby={kontoId}>
        <div className="lj-section-head">
          <h2 id={kontoId} ref={kontoRef} tabIndex={-1}>
            Konto
          </h2>
        </div>
        <div className="lj-konto-identity" data-testid="rd-konto-identity">
          {known ? (
            <>
              <span className="lj-konto-initials" aria-hidden>
                {identity.initials}
              </span>
              <div>
                <p className="lj-eyebrow">Inloggad som</p>
                <p className="lj-konto-name">{identity.name}</p>
                <p className="lj-konto-email">{identity.email}</p>
                {identity.plan && <p className="lj-konto-plan">{identity.plan}</p>}
              </div>
            </>
          ) : (
            <p>Kontouppgifter saknas. Logga ut och in igen för att visa dem.</p>
          )}
        </div>
        <dl className="lj-prov-facts lj-konto-facts">
          <div>
            <dt>Provet</dt>
            <dd>
              {exam.label} · om {count(exam.daysLeft, 'dag', 'dagar')}
            </dd>
          </div>
          <div>
            <dt>Plan och betalning</dt>
            <dd>
              Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här
              ännu.
            </dd>
          </div>
          <div>
            <dt>Lösenord och tvåfaktor</dt>
            <dd>
              Hanteras via din inloggningsleverantör. Logga ut och in igen för att byta metod.
            </dd>
          </div>
        </dl>
        <div className="lj-konto-actions">
          <button
            type="button"
            className="lj-tool"
            data-testid="rd-konto-signout"
            onClick={() => {
              actions.signOut()
              setSignedOut(true)
            }}
          >
            Logga ut
          </button>
          <p role="status">{signedOut ? 'Utloggning begärd.' : ''}</p>
        </div>

        <section className="lj-konto-data" aria-labelledby={dataId}>
          <h3 id={dataId}>Din data</h3>
          <p>Hämta en kopia av det du har gjort i HP-Coach.</p>
          <div className="lj-konto-actions">
            <button
              type="button"
              className="lj-tool"
              data-testid="rd-konto-export"
              onClick={() => {
                actions.exportData()
                setExported(true)
              }}
            >
              Exportera din data
            </button>
            <p role="status">{exported ? 'Exporten är begärd.' : ''}</p>
          </div>
        </section>

        <section className="lj-konto-delete" aria-labelledby={deleteId}>
          <h3 id={deleteId}>Radera konto</h3>
          <p>
            Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut inom
            30 dagar. Det går inte att ångra.
          </p>
          <p className="lj-konto-preview">Förhandsvisning: här raderas ingenting.</p>
          <button
            ref={deleteRef}
            type="button"
            className="lj-text-button lj-konto-delete-open"
            data-testid="rd-konto-delete"
            aria-expanded={asking}
            onClick={() => (asking ? cancelDelete() : setAsking(true))}
          >
            Radera kontot …
          </button>
          {asking && (
            <div className="lj-konto-confirm">
              <button
                type="button"
                className="lj-text-button"
                onClick={() => {
                  actions.exportData()
                  setExported(true)
                }}
              >
                Exportera min data först <ArrowRight size={14} aria-hidden />
              </button>
              <label htmlFor={wordId}>
                Skriv <strong>{DELETE_WORD}</strong> för att bekräfta.
              </label>
              <input
                ref={wordRef}
                id={wordId}
                type="text"
                data-testid="rd-konto-delete-word"
                value={word}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(e) => setWord(e.target.value)}
              />
              <div className="lj-konto-confirm-actions">
                <button type="button" className="lj-text-button" onClick={cancelDelete}>
                  Avbryt
                </button>
                <button
                  type="button"
                  className="lj-tool lj-konto-destroy"
                  data-testid="rd-konto-delete-confirm"
                  disabled={!armed || sent}
                  onClick={() => {
                    if (!armed || sent) return
                    actions.deleteAccount()
                    setSent(true)
                  }}
                >
                  Radera kontot permanent
                </button>
              </div>
            </div>
          )}
          <p role="status">
            {sent ? 'Bekräftat. I förhandsvisningen raderas ingenting, och du är kvar här.' : ''}
          </p>
        </section>
      </section>
    </div>
  )
}
