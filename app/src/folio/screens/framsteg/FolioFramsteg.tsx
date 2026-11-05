import { useRef } from 'react'
import { useScopedKeys } from '@/folio/lib/useScopedKeys'
import { Lit } from '@/folio/ui/Lit'
import { FramstegMargin, type MasteryProps } from './FramstegMargin'
import { FramstegReport, type NavigateHref } from './FramstegReport'
import { FramstegSections } from './FramstegSections'
import { buildFramstegView, type FramstegInput } from './framstegView'
import { useFramstegExtras } from './useFramstegExtras'
import './framsteg.css'

export type FolioFramstegProps = Pick<FramstegInput, 'stats'> &
  MasteryProps & { navigateHref: NavigateHref }

export default function FolioFramsteg(props: FolioFramstegProps) {
  const extras = useFramstegExtras()
  const view = buildFramstegView({ ...props, ...extras })
  const phone = extras.viewport === 'phone'
  const examDate = extras.sitting.date
  const sittingLabel = examDate
    ? `${examDate.getMonth() < 6 ? 'vårprovet' : 'höstprovet'} ${examDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' })}`
    : extras.sitting.label.toLowerCase()
  const region = useRef<HTMLDivElement>(null)
  useScopedKeys(region, {
    Enter: () => {
      if (
        !view.primary ||
        region.current?.closest('[inert]') ||
        document.querySelector('[role="dialog"], [role="alertdialog"], [role="menu"], dialog[open]')
      )
        return false
      props.navigateHref(view.primary.href)
    },
  })
  return (
    <div
      ref={region}
      tabIndex={-1}
      className={`fa-framsteg ${phone ? 'fa-phome' : 'fa-home'}`}
      data-testid="folio-framsteg"
    >
      <div className="fa-masthead">
        <span className="fa-label">Framsteg</span>
        <span className="fa-count">
          {extras.days} dagar kvar · {sittingLabel}
        </span>
      </div>
      <h1 className="fa-greet">Var du står, ärligt.</h1>
      <p className="fa-day">
        Prognosen är ett intervall, inte en dom. Den smalnar för varje delprov du provar.
      </p>
      {view.statusLine ? (
        <Lit className="fa-status">
          <p role="status">{view.statusLine}</p>
        </Lit>
      ) : (
        <>
          <FramstegReport view={view} navigateHref={props.navigateHref} phone={phone} />
          <FramstegSections view={view} navigateHref={props.navigateHref} phone={phone} />
          <FramstegMargin view={view} navigateHref={props.navigateHref} />
        </>
      )}
    </div>
  )
}
