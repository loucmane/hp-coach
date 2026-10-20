import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import { IndexNumber } from './RasterParts'

export function RasterNav({
  screen,
  width,
  theme,
  onTheme,
  dest,
  onGo,
  menu,
  setMenu,
}: DirectionProps & {
  dest: Destination
  onGo: (dest: Destination) => void
  menu: boolean
  setMenu: (open: boolean) => void
}) {
  const { data, actions } = useDirectionData()
  const focus = screen === 2 || screen === 3 || screen === 6 || screen === 7
  const [collapsed, setCollapsed] = useState(screen === 4)
  const [accountPage, setAccountPage] = useState<string | null>(null)
  const menuId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  useEffect(() => setCollapsed(screen === 4), [screen])
  const close = useCallback(() => {
    if (ref.current?.contains(document.activeElement)) button.current?.focus()
    setMenu(false)
  }, [setMenu])
  useDismiss(menu, close, ref)
  return (
    <header className="ra-navigation" data-compact={String(collapsed || focus)}>
      <div className="ra-brand" role="img" aria-label="HP-Coach">
        <b>
          HP<span aria-hidden>↗</span>
        </b>
        <span>Coach</span>
      </div>
      {width === 'desktop' || !focus ? (
        <nav className="ra-index" aria-label="Huvudmeny">
          {DESTINATIONS.map((d, i) => (
            <button
              type="button"
              key={d.id}
              data-testid={`rd-nav-${d.id}`}
              aria-current={d.id === dest ? 'page' : undefined}
              onClick={() => onGo(d.id)}
            >
              <IndexNumber value={i + 1} />
              <span>{d.label}</span>
            </button>
          ))}
        </nav>
      ) : (
        <span className="ra-focus-label">
          {screen === 7 ? 'DTK' : screen === 6 ? 'Kvant' : 'LÄS'} / Fokus
        </span>
      )}
      {width === 'desktop' && !focus ? (
        <button
          type="button"
          className="ra-collapse"
          data-testid="rd-collapse"
          aria-label={collapsed ? 'Fäll ut menyn' : 'Fäll ihop menyn'}
          aria-expanded={!collapsed}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? '＋' : '−'}
        </button>
      ) : null}
      <div className="ra-account-anchor" ref={ref}>
        <button
          type="button"
          className="ra-account"
          ref={button}
          data-testid="rd-account"
          aria-label="Konto och inställningar"
          aria-expanded={menu}
          aria-controls={menu ? menuId : undefined}
          onClick={() => {
            setAccountPage(null)
            setMenu(!menu)
          }}
        >
          Konto <span aria-hidden>{menu ? '−' : '＋'}</span>
        </button>
        {menu ? (
          <section
            className="ra-account-menu"
            id={menuId}
            data-testid="rd-account-menu"
            aria-label="Konto och inställningar"
          >
            <div className="ra-menu-heading">
              <h2>{accountPage ?? 'Ditt konto'}</h2>
              <button type="button" onClick={close} aria-label="Stäng kontot">
                ×
              </button>
            </div>
            {accountPage ? (
              <>
                <p>
                  {accountPage === 'Konto'
                    ? 'Inloggad · gratisplan'
                    : accountPage === 'Inställningar'
                      ? 'Provdatum och mål visas här när riktningen är vald.'
                      : 'A–E väljer de svar som finns. Enter svarar och går vidare. F aktiverar styckefokus i en text; J och K byter stycke.'}
                </p>
                <button type="button" className="ra-menu-row" onClick={() => setAccountPage(null)}>
                  ← Tillbaka
                </button>
              </>
            ) : (
              <>
                <p className="ra-label">{data.konto.identity.name}</p>
                {['Konto', 'Inställningar'].map((label) => (
                  <button
                    type="button"
                    className="ra-menu-row"
                    key={label}
                    onClick={() => {
                      close()
                      actions.openKonto()
                    }}
                  >
                    {label}
                    <span aria-hidden>↗</span>
                  </button>
                ))}
                <fieldset className="ra-theme">
                  <legend>Tema</legend>
                  <button
                    type="button"
                    aria-pressed={theme === 'light'}
                    onClick={() => onTheme('light')}
                  >
                    Ljust
                  </button>
                  <button
                    type="button"
                    data-testid="rd-theme-toggle"
                    aria-pressed={theme === 'dark'}
                    onClick={() => onTheme('dark')}
                  >
                    Mörkt
                  </button>
                </fieldset>
                <button
                  type="button"
                  className="ra-menu-row"
                  onClick={() => setAccountPage('Hjälp')}
                >
                  Hjälp<span aria-hidden>↗</span>
                </button>
              </>
            )}
          </section>
        ) : null}
      </div>
    </header>
  )
}
