import { type ComponentProps, type MouseEvent, useRef } from 'react'
import { useScopedKeys } from '@/folio/lib/useScopedKeys'
import { Go } from '@/folio/ui/Go'
import { Lit } from '@/folio/ui/Lit'
import { SecChip } from '@/folio/ui/SecChip'
import { Seg } from '@/folio/ui/Seg'
import type { DrillCount } from '@/lib/drill'
import type { OvaView } from './ovaView'

export type NavigateHref = (href: string) => void

/** Retain native navigation for modified clicks, downloads and new tabs. */
function follow(event: MouseEvent<HTMLAnchorElement>, navigateHref: NavigateHref) {
  const a = event.currentTarget
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (a.target && a.target !== '_self') ||
    a.hasAttribute('download')
  )
    return
  event.preventDefault()
  navigateHref(a.getAttribute('href')!)
}
export function OvaLink({
  navigateHref,
  href,
  onClick,
  ...props
}: ComponentProps<'a'> & { href: string; navigateHref: NavigateHref }) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        follow(event, navigateHref)
      }}
    />
  )
}

export function OvaLead({
  view,
  navigateHref,
  phone,
  onCount,
}: {
  view: OvaView
  navigateHref: NavigateHref
  phone: boolean
  onCount: (count: DrillCount) => void
}) {
  const region = useRef<HTMLElement>(null)
  const { lead } = view
  useScopedKeys(
    region,
    {
      Enter: () => {
        if (
          !lead.href ||
          region.current?.closest('[inert]') ||
          document.querySelector(
            '[role="dialog"], [role="alertdialog"], [role="menu"], dialog[open]',
          )
        )
          return false
        navigateHref(lead.href)
      },
    },
    { enabled: !!lead.href },
  )
  const size = lead.family ? (
    <Seg
      label="Antal frågor"
      options={[5, 10, 20].map((value) => ({ value: value as DrillCount, label: String(value) }))}
      value={lead.family.count}
      onChange={onCount}
    />
  ) : null
  const action = lead.href ? (
    <Go
      href={lead.href}
      dock={phone}
      kbd="↵"
      keyshortcuts="Enter"
      onClick={(event) => follow(event, navigateHref)}
    >
      {lead.label}
    </Go>
  ) : (
    <Go dock={phone} disabled>
      {lead.label}
    </Go>
  )
  return (
    <section
      ref={region}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: focus scopes the optional Enter shortcut to this labelled region.
      tabIndex={0}
      className="fa-ova-suggestion"
      aria-labelledby="fa-ova-lead"
      data-testid="ova-suggestion"
    >
      <Lit className="fa-ova-now">
        <div className="fa-ova-eyebrow">
          <span>Föreslaget</span>
          {lead.section ? <SecChip section={lead.section} /> : null}
        </div>
        <h2 id="fa-ova-lead">{lead.title}</h2>
        {lead.detail ? <p className="fa-ova-why">{lead.detail}</p> : null}
        {lead.steps.length ? (
          <ol className="fa-ova-chain" aria-label="Lektion och övning">
            {lead.steps.map((step, i) => (
              <li key={step.href}>
                <span className="fa-ova-number" data-current={i === 0 ? '' : undefined} aria-hidden>
                  {i + 1}
                </span>
                <div className="fa-ova-step-body">
                  <OvaLink href={step.href} navigateHref={navigateHref}>
                    {step.title}
                  </OvaLink>
                  {i === 1 ? size : null}
                  {step.minutes != null ? (
                    <span className="fa-ova-time">ca {step.minutes} min</span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        ) : lead.family ? (
          <div className="fa-ova-size">
            <span>Antal frågor</span>
            {size}
          </div>
        ) : null}
        <div className="fa-ova-action">{!phone ? action : null}</div>
      </Lit>
      {phone ? <div className="fa-ova-dock">{action}</div> : null}
    </section>
  )
}
