import { useLocation, useNavigate } from '@tanstack/react-router'
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'

import { useViewport } from '@/hooks/useViewport'
import { useFolioShellData } from './data/useShellData'
import { type FocusRequest, FolioHostContext, ShellFocusContext } from './host'
import { useFolioFonts } from './lib/useFolioFonts'
import { useFolioRootAttrs } from './lib/useFolioRootAttrs'
import { currentDestination, currentRailDestination, DESTINATIONS } from './nav'
import { AccountMenu } from './shell/AccountMenu'
import { FocusBar } from './shell/FocusBar'
import { PhoneBar } from './shell/PhoneBar'
import { Rail } from './shell/Rail'
import { SkipLink } from './shell/SkipLink'
import { TabBar } from './shell/TabBar'
import './styles/tokens.css'
import './styles/shell.css'
import './styles/palette.css'

// Welcome owns focus chrome even before its lazy children register effects.
// A live player request still supplies its own exit/confirmation action.
const WELCOME_FOCUS: FocusRequest = { exitLabel: null }

export function FolioShell({ children }: { children: ReactNode }) {
  useFolioFonts()
  const data = useFolioShellData()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const phone = useViewport() === 'phone'
  const rootAttrs = useFolioRootAttrs()
  const [collapsed, setCollapsed] = useState(false)
  const [menu, setMenu] = useState(false)
  const [requestedFocus, setFocus] = useState<FocusRequest | null>(null)
  const focus = requestedFocus ?? (pathname === '/welcome' ? WELCOME_FOCUS : null)
  const origin = useRef<(typeof DESTINATIONS)[number]['to']>('/')
  const closeMenu = useCallback(() => setMenu(false), [])
  const toggle = useCallback(() => setCollapsed((value) => !value), [])
  const current = currentDestination(pathname)
  const openSearch = () => {
    // CommandPalette is already mounted by the root. Its existing public
    // listener also serves pointer/touch users; do not mount a second palette.
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
  }

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
    <div data-folio="" {...rootAttrs} data-testid="folio-shell" lang="sv">
      <SkipLink question={!!focus && pathname !== '/welcome'} />
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
                current={currentRailDestination(pathname)}
                data={data}
                account={account}
                onSearch={openSearch}
              />
            ) : null}
            {phone && !focus ? <PhoneBar account={account} onSearch={openSearch} /> : null}
            {focus ? (
              <FocusBar
                exitLabel={focus.exitLabel}
                onExit={
                  focus.onExit ??
                  (() => {
                    void navigate({ to: origin.current, replace: true })
                  })
                }
              />
            ) : null}
            <main
              id="innehall"
              tabIndex={-1}
              className="fa-main"
              inert={phone && menu && !focus ? true : undefined}
            >
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
