// An index of calm, rounded setting cards. Preferences stay provider-owned;
// void kit actions do not provide evidence for a "saved" or "deleted" claim.
import { Download, Leaf, LogOut, Trash2 } from 'lucide-react'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import type { WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { PrefsView } from '@/components/devbake/redesign/viewModel'
import type { Calm } from './SparDrill'
import { SparPageHead, SparSegmented } from './sparParts'

export type KontoSection = 'konto' | 'utseende' | 'ovning' | 'provet' | 'data' | 'hjalp' | 'radera'
export type KontoJump = { section: KontoSection; serial: number } | null
const PARTS: readonly { id: KontoSection; label: string }[] = [
  { id: 'konto', label: 'Konto' },
  { id: 'utseende', label: 'Utseende' },
  { id: 'ovning', label: 'Övning' },
  { id: 'provet', label: 'Provet' },
  { id: 'data', label: 'Data' },
  { id: 'hjalp', label: 'Hjälp och villkor' },
  { id: 'radera', label: 'Radera konto' },
]

export function SparKonto({
  width,
  calm,
  setCalm,
  jump,
}: Calm & { width: WidthKey; jump: KontoJump }) {
  const { data, actions } = useDirectionData()
  const { identity, options, prefs, exam, links } = data.konto
  const [active, setActive] = useState<KontoSection>('konto')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [word, setWord] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<{ row: string; text: string } | null>(null)
  const cards = useRef(new Map<KontoSection, HTMLElement>())
  const deleteSent = useRef(false)
  const wordRef = useRef<HTMLInputElement>(null)
  const jumpTo = (id: KontoSection) => {
    const el = cards.current.get(id)
    setActive(id)
    // Only an explicit index/menu request scrolls or focuses a section.
    el?.scrollIntoView?.({ block: 'start', behavior: 'instant' })
    el?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }
  // biome-ignore lint/correctness/useExhaustiveDependencies: jump is a discrete user request, never page entry
  useEffect(() => {
    if (jump) jumpTo(jump.section)
  }, [jump])
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const first = cards.current.values().next().value as HTMLElement | undefined
    const root = first?.closest('.sp-main, .sp-pscroll') ?? null
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.getAttribute('data-part') as KontoSection)
      },
      { root, rootMargin: '0px 0px -65% 0px', threshold: 0 },
    )
    for (const el of cards.current.values()) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const call = (
    row: string,
    action: () => void,
    text = 'Det gick inte att ändra. Försök igen.',
  ) => {
    try {
      action()
      setError(null)
    } catch {
      setError({ row, text })
    }
  }
  const setPref = <K extends keyof PrefsView>(key: K, value: PrefsView[K]) =>
    call(key, () => actions.setPrefs({ [key]: value }), 'Det gick inte att spara. Försök igen.')
  const fail = (row: string) =>
    error?.row === row ? (
      <p className="sp-setting-error" role="alert">
        {error.text}
      </p>
    ) : null
  const group = (id: KontoSection, children: ReactNode) => (
    <section
      key={id}
      className={`sp-settings-card${id === 'radera' ? ' sp-danger-card' : ''}`}
      aria-labelledby={`sp-konto-${id}`}
      data-part={id}
      ref={(el) => {
        if (el) cards.current.set(id, el)
        else cards.current.delete(id)
      }}
    >
      <h2 id={`sp-konto-${id}`} tabIndex={-1}>
        {PARTS.find((p) => p.id === id)?.label}
      </h2>
      {children}
    </section>
  )

  return (
    <div className="sp-konto sp-page" data-phone={String(width === 'phone')}>
      <SparPageHead
        phone={width === 'phone'}
        eyebrow="Konto och inställningar"
        title="Ditt konto"
      />
      <div className="sp-settings-layout">
        <nav className="sp-page-index" aria-label="På sidan">
          {PARTS.map((part) => (
            <button
              type="button"
              key={part.id}
              aria-current={active === part.id ? 'location' : undefined}
              onClick={() => jumpTo(part.id)}
            >
              {part.label}
            </button>
          ))}
        </nav>
        <div className="sp-settings-cards">
          {group(
            'konto',
            <>
              <div className="sp-identity" data-testid="rd-konto-identity">
                <span className="sp-avatar sp-avatar--lg" aria-hidden>
                  {identity.initials || '–'}
                </span>
                <div>
                  <span>Inloggad som</span>
                  <b>{identity.name || identity.email}</b>
                  {identity.name ? <span>{identity.email}</span> : null}
                  {identity.plan ? <span>{identity.plan}</span> : null}
                </div>
              </div>
              <h3 className="sp-h4">Plan och betalning</h3>
              <p>
                Kommer när HP-Coach går från gratis dogfood till betald tjänst — inget att göra här
                ännu.
              </p>
              <h3 className="sp-h4">Lösenord och tvåfaktor</h3>
              <p>
                Hanteras via din inloggningsleverantör. Logga ut och in igen för att byta metod.
              </p>
              <button
                type="button"
                className="sp-btn sp-btn--quiet"
                data-testid="rd-konto-signout"
                onClick={() => call('signout', actions.signOut)}
              >
                <LogOut size={18} aria-hidden />
                Logga ut
              </button>
              {fail('signout')}
            </>,
          )}
          {group(
            'utseende',
            <>
              <SettingRow label="Tema">
                <SparSegmented
                  label="Tema"
                  value={prefs.mode}
                  options={options.mode.map((o) => ({ ...o, testid: `rd-konto-mode-${o.key}` }))}
                  onChange={(mode) => call('mode', () => actions.setTheme(mode))}
                />
              </SettingRow>
              {fail('mode')}
              <SettingRow
                label={
                  <>
                    <Leaf size={18} aria-hidden /> Lugnt läge
                  </>
                }
                hint="Färre färger och siffror, inga studsar. Gäller medan Spår är öppet."
              >
                <button
                  type="button"
                  className="sp-setting-switch"
                  role="switch"
                  aria-label="Lugnt läge"
                  aria-checked={calm}
                  aria-describedby="sp-calm-hint"
                  onClick={() => setCalm(!calm)}
                >
                  <span className="sp-switch" data-on={String(calm)} aria-hidden>
                    <i />
                  </span>
                  <span>{calm ? 'På' : 'Av'}</span>
                </button>
              </SettingRow>
              <span id="sp-calm-hint" className="sp-sr">
                Färre färger och siffror, inga studsar. Gäller medan Spår är öppet.
              </span>
              {(['font', 'density'] as const).map((pref) => (
                <div key={pref}>
                  <SettingRow label={pref === 'font' ? 'Typsnitt' : 'Täthet'}>
                    <SparSegmented
                      label={pref === 'font' ? 'Typsnitt' : 'Täthet'}
                      value={prefs[pref]}
                      options={options[pref].map((o) => ({
                        ...o,
                        testid: `rd-konto-${pref}-${o.key}`,
                      }))}
                      onChange={(value) => {
                        if (pref === 'font') setPref('font', value as PrefsView['font'])
                        else setPref('density', value as PrefsView['density'])
                      }}
                    />
                  </SettingRow>
                  {fail(pref)}
                </div>
              ))}
              <p className="sp-setting-hint">
                Typsnitt och täthet väljs för appen. Designvisningen behåller Spårs typografi och
                mått.
              </p>
            </>,
          )}
          {group(
            'ovning',
            <>
              <SettingRow
                label="Urval"
                hint={prefs.smartDrill ? 'Frågor nära din nivå.' : 'Helt slumpade frågor.'}
              >
                <SparSegmented
                  label="Urval"
                  value={prefs.smartDrill ? 'smart' : 'random'}
                  options={[
                    { key: 'smart', label: 'Smart' },
                    { key: 'random', label: 'Slumpat' },
                  ]}
                  onChange={(v) => setPref('smartDrill', v === 'smart')}
                />
              </SettingRow>
              {fail('smartDrill')}
            </>,
          )}
          {group(
            'provet',
            <SettingRow label="Provtillfälle">
              <p>
                {exam.label} · {exam.daysLeft} dagar kvar
              </p>
            </SettingRow>,
          )}
          {group(
            'data',
            <>
              <p>Hämta en JSON-kopia av din data.</p>
              <button
                type="button"
                className="sp-btn sp-btn--quiet"
                data-testid="rd-konto-export"
                onClick={() =>
                  call(
                    'export',
                    actions.exportData,
                    'Kunde inte exportera just nu. Försök igen om en stund.',
                  )
                }
              >
                <Download size={18} aria-hidden />
                Exportera min data
              </button>
              {fail('export')}
            </>,
          )}
          {group(
            'hjalp',
            <div className="sp-account-links">
              {links.map((link) => (
                <a className="sp-link" key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              {links.length === 0 ? <p>Inga hjälplänkar tillgängliga just nu.</p> : null}
            </div>,
          )}
          {group(
            'radera',
            <>
              <p>
                Allt raderas direkt — konto, försök, missar och resultat. Säkerhetskopior tunnas ut
                inom 30 dagar. Det går inte att ångra.
              </p>
              <p className="sp-setting-hint">
                Raderingsflödet förhandsvisas här. Den här vyn bekräftar ingen radering.
              </p>
              <button
                type="button"
                className="sp-link"
                onClick={() =>
                  call(
                    'export-delete',
                    actions.exportData,
                    'Kunde inte exportera just nu. Försök igen om en stund.',
                  )
                }
              >
                Exportera min data först →
              </button>
              {fail('export-delete')}
              {deleteOpen ? (
                <div className="sp-delete-fields">
                  <label>
                    Skriv radera för att bekräfta.
                    <input
                      ref={wordRef}
                      data-testid="rd-konto-delete-word"
                      value={word}
                      disabled={sent}
                      autoComplete="off"
                      spellCheck={false}
                      onChange={(e) => setWord(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    className="sp-btn sp-btn--danger"
                    data-testid="rd-konto-delete-confirm"
                    disabled={word !== 'radera' || sent}
                    onClick={() => {
                      if (word !== 'radera' || deleteSent.current) return
                      deleteSent.current = true
                      try {
                        actions.deleteAccount()
                        setSent(true)
                        setError(null)
                      } catch {
                        deleteSent.current = false
                        setError({ row: 'delete', text: 'Kunde inte radera kontot. Försök igen.' })
                      }
                    }}
                  >
                    <Trash2 size={18} aria-hidden />
                    Radera kontot permanent
                  </button>
                  {!sent ? (
                    <button
                      type="button"
                      className="sp-link"
                      onClick={() => {
                        setDeleteOpen(false)
                        setWord('')
                      }}
                    >
                      Avbryt
                    </button>
                  ) : null}
                  {fail('delete')}
                </div>
              ) : (
                <button
                  type="button"
                  className="sp-btn sp-btn--quiet"
                  data-testid="rd-konto-delete"
                  onClick={() => {
                    setDeleteOpen(true)
                    requestAnimationFrame(() => wordRef.current?.focus({ preventScroll: true }))
                  }}
                >
                  Radera konto
                </button>
              )}
            </>,
          )}
        </div>
      </div>
    </div>
  )
}

function SettingRow({
  label,
  hint,
  children,
}: {
  label: ReactNode
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="sp-setting-row">
      <div className="sp-setting-label">
        <b>{label}</b>
        {hint ? <p>{hint}</p> : null}
      </div>
      <div className="sp-setting-control">{children}</div>
    </div>
  )
}
