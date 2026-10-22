import { type ComponentProps, useEffect, useRef } from 'react'
import { type FramstegView, scoreLabel } from './framstegView'

export type NavigateHref = (href: string) => void

/** Real anchors retain native modified clicks, focus and open-in-new-tab. */
export function FramstegLink({
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

export function FramstegReport({
  view,
  navigateHref,
}: {
  view: FramstegView
  navigateHref: NavigateHref
}) {
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
      if (
        event.target instanceof Element &&
        event.target.closest(
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
  const p = view.prognosis
  return (
    <>
      <section className="fa-fr-report" aria-labelledby="fa-fr-report-h">
        <h2 className="fa-label" id="fa-fr-report-h">
          Prognos
        </h2>
        <div className="fa-result" aria-describedby={p.caveat ? 'fa-fr-caveat' : undefined}>
          <span className="fa-result-n" data-testid="progress-projected">
            {p.scoreLabel}
            {p.caveat && p.total != null ? <sup aria-hidden>*</sup> : null}
          </span>
          <span className="fa-result-of">av 2,0</span>
        </div>
        {view.dayZero ? (
          <p className="fa-empty">
            Ingen prognos än. Totalen visas när du har svarat på frågor i båda delarna.
          </p>
        ) : null}
        {p.deltaLabel ? <p className="fa-delta">{p.deltaLabel}</p> : null}
        <p className="fa-halves">
          Verbal {scoreLabel(p.verbal)} · Kvant {scoreLabel(p.quant)}
        </p>
        {p.total != null ? (
          <div
            className="fa-scale"
            role="img"
            aria-label={`Prognos ${p.scoreLabel} av 2,0${p.low != null && p.high != null ? `, intervall ${scoreLabel(p.low)}–${scoreLabel(p.high)}` : ''}`}
          >
            <span className="fa-scale-axis" />
            {p.low != null && p.high != null ? (
              <span
                className="fa-scale-range"
                style={{ left: `${p.low * 50}%`, width: `${(p.high - p.low) * 50}%` }}
              />
            ) : null}
            <span className="fa-scale-mark" style={{ left: `${p.total * 50}%` }} />
            {[0, 0.5, 1, 1.5, 2].map((value) => (
              <span key={value} className="fa-scale-tick" style={{ left: `${value * 50}%` }}>
                {scoreLabel(value)}
              </span>
            ))}
          </div>
        ) : null}
        {p.low != null && p.high != null ? (
          <p className="fa-range-label">
            Intervall {scoreLabel(p.low)}–{scoreLabel(p.high)}
          </p>
        ) : null}
      </section>
      {view.primary ? (
        <section
          className="fa-resume"
          aria-labelledby="fa-fr-lead"
          data-testid="folio-framsteg-next"
        >
          <span className="fa-label">Nästa steg</span>
          <h2 className="fa-lead-title" id="fa-fr-lead">
            {view.primary.title}
          </h2>
          <p className="fa-lead-why">{view.primary.reason}</p>
          <FramstegLink
            ref={primary}
            className="fa-btn"
            href={view.primary.href}
            navigateHref={navigateHref}
            data-testid={view.dayZero ? 'progress-empty-cta' : 'framsteg-primary'}
          >
            {view.primary.label}
            <kbd aria-hidden>↵</kbd>
          </FramstegLink>
        </section>
      ) : null}
    </>
  )
}
