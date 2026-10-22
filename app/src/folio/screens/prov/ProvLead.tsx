import { type ComponentProps, useEffect, useRef } from 'react'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { HALF_LABEL, type HubView, type NavigateHref, passName } from './provView'

export function ProvLink({
  navigateHref,
  href,
  onClick,
  target,
  ...props
}: ComponentProps<'a'> & { href: string; navigateHref: NavigateHref }) {
  return (
    <a
      {...props}
      href={href}
      target={target}
      onClick={(e) => {
        onClick?.(e)
        if (
          e.defaultPrevented ||
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey ||
          (target && target !== '_self') ||
          props.download != null
        )
          return
        e.preventDefault()
        navigateHref(href)
      }}
    />
  )
}

export function usePrimaryEnter<T extends HTMLButtonElement | HTMLAnchorElement>(enabled = true) {
  const primary = useRef<T>(null)
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key !== 'Enter' ||
        e.defaultPrevented ||
        e.repeat ||
        e.isComposing ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      )
        return
      if (
        e.target instanceof Element &&
        e.target.closest(
          'a, button, input, textarea, select, summary, [contenteditable]:not([contenteditable="false"]), [role="button"], [role="link"], [role="textbox"], [inert]',
        )
      )
        return
      if (
        !primary.current ||
        primary.current.closest('[inert]') ||
        document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], dialog[open]')
      )
        return
      e.preventDefault()
      primary.current.click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
  return primary
}

export function ProvLead({
  view,
  half,
  mode,
  onStart,
  ready,
  slipOpen,
}: {
  view: HubView
  half: MockHalf
  mode: MockMode
  onStart: () => void
  ready: boolean
  slipOpen: boolean
}) {
  const primary = usePrimaryEnter<HTMLButtonElement>(ready && !slipOpen)
  const available = mode === 'synthetic' || !!view.chosen
  return (
    <section className="fa-resume" aria-labelledby="fa-prov-lead">
      <div className="fa-label">{mode === 'synthetic' ? 'Genererat pass' : view.eyebrow}</div>
      <h2 className="fa-lead-title" id="fa-prov-lead">
        {!ready
          ? 'Laddar provpassen …'
          : mode === 'synthetic'
            ? `${HALF_LABEL[half]} · blandade frågor`
            : view.chosen
              ? passName(view.chosen)
              : 'Inga riktiga pass tillgängliga just nu.'}
      </h2>
      <p className="fa-lead-sub">{view.quota}</p>
      {mode === 'authentic' && view.chosen ? (
        <>
          <p className="fa-kallelse">
            Du har sett {view.chosen.seenBefore} av {view.chosen.presented} frågor.
          </p>
          {view.chosen.presented < 40 ? (
            <p className="fa-kallelse">
              Passet har {view.chosen.presented} frågor — {40 - view.chosen.presented} saknas i
              källan.
            </p>
          ) : null}
        </>
      ) : null}
      {view.note ? (
        <p className="fa-kallelse" data-testid="prov-synthetic-note">
          {view.note}
        </p>
      ) : null}
      {ready && available ? (
        <div className="fa-resume-foot">
          <button
            ref={primary}
            type="button"
            className={slipOpen ? 'fa-quiet-btn' : 'fa-btn fa-btn--big'}
            data-testid="prov-start"
            onClick={onStart}
          >
            Starta provpasset <kbd aria-hidden>↵</kbd>
          </button>
          <span className="fa-hint">Villkoren först — klockan startar när du säger till.</span>
        </div>
      ) : null}
    </section>
  )
}
