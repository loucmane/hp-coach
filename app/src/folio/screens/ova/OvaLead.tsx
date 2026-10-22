import { type ComponentProps, useEffect, useRef } from 'react'
import type { OvaView } from './ovaView'

export type NavigateHref = (href: string) => void

/** Preserve native keyboard activation, modified clicks, and open-in-new-tab. */
export function OvaLink({
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
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (target && target !== '_self') ||
          props.download != null
        )
          return
        event.preventDefault()
        navigateHref(href)
      }}
    />
  )
}

export function OvaLead({ view, navigateHref }: { view: OvaView; navigateHref: NavigateHref }) {
  const primary = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
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
      event.preventDefault()
      primary.current.click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const { lead, repetition } = view
  const readySections = view.sections.filter((s) => (s.dueNow ?? 0) > 0)
  return (
    <section className="fa-resume" aria-labelledby="fa-ova-lead">
      <div className="fa-resume-top">
        <span className="fa-label">{lead.eyebrow}</span>
      </div>
      <h2 className="fa-lead-title" id="fa-ova-lead">
        {lead.title}
      </h2>
      {lead.detail ? <p className="fa-lead-sub">{lead.detail}</p> : null}
      <div className="fa-resume-foot">
        {lead.kind !== 'loading' ? (
          <OvaLink
            ref={primary}
            className="fa-btn fa-btn--big"
            href={lead.href}
            navigateHref={navigateHref}
            data-testid={lead.kind === 'repetera' ? 'ova-repetition' : undefined}
          >
            {lead.label}
            <kbd className="fa-kbd" aria-hidden>
              ↵
            </kbd>
          </OvaLink>
        ) : null}
        <OvaLink
          className="fa-link"
          href="/repetition"
          navigateHref={navigateHref}
          data-testid={lead.kind !== 'repetera' ? 'ova-repetition' : undefined}
        >
          {lead.kind === 'repetera'
            ? `Välj delprov · ${repetition.dueNow} redo nu`
            : 'Öppna Repetera'}{' '}
          <span aria-hidden>→</span>
        </OvaLink>
      </div>
      {view.queueLine ? <p className="fa-empty">{view.queueLine}</p> : null}
      {readySections.length > 0 ? (
        <ul className="fa-ready" aria-label="Repetera ett delprov">
          {readySections.map((s) => (
            <li key={s.section}>
              <OvaLink
                className="fa-link"
                href={s.repetitionHref}
                navigateHref={navigateHref}
                data-testid={`ova-rep-${s.section}`}
              >
                {s.section} · {s.dueNow} redo nu <span aria-hidden>→</span>
              </OvaLink>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
