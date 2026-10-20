import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { useDirectionData } from '@/components/devbake/redesign/directionData'
import {
  DESTINATIONS,
  type Destination,
  type DirectionProps,
  useDismiss,
} from '@/components/devbake/redesign/r1Kit'
import type { KontoSection } from './RasterKonto'
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
  onKonto,
}: DirectionProps & {
  dest: Destination | null
  onGo: (dest: Destination) => void
  menu: boolean
  setMenu: (open: boolean) => void
  onKonto: (section: KontoSection) => void
}) {
  const { data } = useDirectionData()
  const focus = screen === 2 || screen === 3 || screen === 6 || screen === 7 || screen === 14
  const [collapsed, setCollapsed] = useState(screen === 4)
  const [showHelp, setShowHelp] = useState(false)
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
          {screen === 7 ? 'DTK' : screen === 6 ? 'Kvant' : screen === 14 ? 'ELF' : 'LÄS'} / Fokus
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
            setShowHelp(false)
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
            data-rd-keyscope
          >
            <div className="ra-menu-heading">
              <h2>{showHelp ? 'Hjälp' : 'Ditt konto'}</h2>
              <button type="button" onClick={close} aria-label="Stäng kontot">
                ×
              </button>
            </div>
            {showHelp ? (
              <>
                <p>
                  A–E väljer de svar som finns. Enter svarar och går vidare. F aktiverar styckefokus
                  i en text; J och K byter stycke.
                </p>
                <button type="button" className="ra-menu-row" onClick={() => setShowHelp(false)}>
                  ← Tillbaka
                </button>
              </>
            ) : (
              <>
                <p className="ra-label">{data.konto.identity.name}</p>
                {(
                  [
                    ['konto', 'Konto'],
                    ['settings', 'Inställningar'],
                  ] as const
                ).map(([section, label]) => (
                  <button
                    type="button"
                    className="ra-menu-row"
                    key={label}
                    onClick={() => {
                      close()
                      onKonto(section)
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
                <button type="button" className="ra-menu-row" onClick={() => setShowHelp(true)}>
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
