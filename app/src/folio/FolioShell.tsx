import { useLocation, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useViewport } from '@/hooks/useViewport'
import { useUiStore } from '@/stores/uiStore'
import { useFolioShellData } from './data/useShellData'
import { type FocusRequest, FolioHostContext, ShellFocusContext } from './host'
import { useFolioFonts } from './lib/useFolioFonts'
import { currentDestination, DESTINATIONS } from './nav'
import { AccountMenu } from './shell/AccountMenu'
import { FocusBar } from './shell/FocusBar'
import { Rail } from './shell/Rail'
import { TabBar } from './shell/TabBar'
import { Wordmark } from './shell/Wordmark'
import './styles/tokens.css'
import './styles/shell.css'
import './styles/palette.css'

export function FolioShell({ children }: { children: ReactNode }) {
  useFolioFonts()
  const data = useFolioShellData()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const phone = useViewport() === 'phone'
  const palette = useUiStore((s) => s.palette)
  const mode = useUiStore((s) => s.mode)
  const [collapsed, setCollapsed] = useState(false)
  const [menu, setMenu] = useState(false)
  const [focus, setFocus] = useState<FocusRequest | null>(null)
  const origin = useRef<(typeof DESTINATIONS)[number]['to']>('/')
  const closeMenu = useCallback(() => setMenu(false), [])
  const toggle = useCallback(() => setCollapsed((value) => !value), [])
  const current = currentDestination(pathname)

  useEffect(() => {
    setMenu(false)
    if (!/^\/(drill|repetition|diagnostik)(\/|$)/.test(pathname)) {
      const destination = DESTINATIONS.find((d) => d.id === currentDestination(pathname))
      if (destination) origin.current = destination.to
    }
  }, [pathname])
  useEffect(() => {
    if (phone || focus) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target
      if (
        target instanceof HTMLElement &&
        target.closest('input, textarea, select, [contenteditable="true"]')
      )
        return
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phone, focus, toggle])

  const account = (
    <AccountMenu
      phone={phone}
      collapsed={collapsed}
      open={menu}
      close={closeMenu}
      onToggle={() => setMenu((value) => !value)}
    />
  )
  return (
    <div data-folio="" data-theme={mode} data-palette={palette} data-testid="folio-shell" lang="sv">
      <FolioHostContext.Provider value={true}>
        <ShellFocusContext.Provider value={setFocus}>
          <div
            className="fa-app"
            data-testid="folio-app"
            data-phone={String(phone)}
            data-focus={String(!!focus)}
            data-collapsed={String(collapsed)}
          >
            {!phone && !focus ? (
              <Rail
                collapsed={collapsed}
                onToggle={toggle}
                current={current}
                data={data}
                account={account}
              />
            ) : null}
            {phone && !focus ? (
              <header className="fa-ptop">
                <Wordmark />
                {account}
              </header>
            ) : null}
            {focus ? (
              <FocusBar
                onExit={
                  focus.onExit ??
                  (() => {
                    void navigate({ to: origin.current, replace: true })
                  })
                }
              />
            ) : null}
            <main className="fa-main" inert={phone && menu && !focus ? true : undefined}>
              {children}
            </main>
            {phone && !focus ? (
              <TabBar current={current} dueCount={data.dueCount} inert={menu || undefined} />
            ) : null}
          </div>
        </ShellFocusContext.Provider>
      </FolioHostContext.Provider>
    </div>
  )
}
