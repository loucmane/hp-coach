import { type ComponentProps, useEffect, useRef } from 'react'
import type { MockHalf, MockMode } from '@/api/hooks/useMockResults'
import { Go } from '@/folio/ui/Go'
import { Lit } from '@/folio/ui/Lit'
import { SecChip } from '@/folio/ui/SecChip'
import { formatSitting } from '@/lib/examNames'
import { ConditionsList } from './ConditionsSlip'
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
  phone,
  minutes,
}: {
  view: HubView
  half: MockHalf
  mode: MockMode
  onStart: () => void
  ready: boolean
  slipOpen: boolean
  phone: boolean
  minutes: number
}) {
  const available = mode === 'synthetic' || !!view.chosen
  const Sheet = slipOpen ? 'article' : Lit
  // Keep a fixed phone dock outside Lit: its entrance transform is a containing block.
  const action = !slipOpen ? (
    <div className={phone ? 'fa-prov-dock' : 'fa-prov-action'}>
      <Go
        dock={phone}
        disabled={!ready || !available}
        kbd="↵"
        keyshortcuts="Enter"
        data-testid={ready && available ? 'prov-start' : undefined}
        onClick={onStart}
      >
        {phone && mode === 'authentic' && view.chosen
          ? `Starta ${formatSitting(view.chosen.examId)}`
          : 'Starta provpasset'}{' '}
        · {minutes} min
      </Go>
    </div>
  ) : null
  return (
    <>
      <Sheet className="fa-prov-lead" aria-labelledby="fa-prov-lead">
        <div className="fa-label">
          {mode === 'synthetic' ? 'Genererat pass' : view.eyebrow} · {HALF_LABEL[half]} halva
        </div>
        <h2 className="fa-lead-title" id="fa-prov-lead">
          {!ready
            ? 'Laddar provpassen …'
            : mode === 'synthetic'
              ? `${HALF_LABEL[half]} · blandade frågor`
              : view.chosen
                ? passName(view.chosen)
                : 'Inga riktiga pass tillgängliga just nu.'}
        </h2>
        {ready ? (
          <ul className="fa-prov-mix" aria-label={view.quota}>
            {view.sections.map(({ section, count }) => (
              <li className="fa-prov-section-count" key={section}>
                <SecChip section={section} />
                <span>{count}</span>
              </li>
            ))}
            {mode === 'authentic' && view.chosen ? (
              <li className="fa-meta">
                {view.chosen.seenBefore === 0
                  ? 'Du har inte sett någon av frågorna.'
                  : `Du har sett ${view.chosen.seenBefore} av ${view.chosen.presented} frågor.`}
              </li>
            ) : null}
          </ul>
        ) : null}
        {ready && mode === 'authentic' && view.chosen && view.chosen.presented < 40 ? (
          <p className="fa-kallelse">
            Passet har {view.chosen.presented} frågor — {40 - view.chosen.presented} saknas i
            källan.
          </p>
        ) : null}
        {view.note ? (
          <p className="fa-kallelse" data-testid="prov-synthetic-note">
            {view.note}
          </p>
        ) : null}
        <ConditionsList minutes={minutes} />
        <div className="fa-resume-foot">
          {phone ? null : action}
          <p className="fa-hint">
            Villkoren först — klockan startar när du säger till. Ta fram papper och penna.{' '}
            <a className="fa-link" href="#fa-register-heading">
              Byt pass eller halva
            </a>
          </p>
        </div>
      </Sheet>
      {phone ? action : null}
    </>
  )
}
