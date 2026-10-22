import { ACCOUNT_ROUTES } from '@/folio/nav'
import { type NavigateHref, OvaLink } from './OvaLead'
import type { OvaView } from './ovaView'

export function OvaMargin({ view, navigateHref }: { view: OvaView; navigateHref: NavigateHref }) {
  const { trap } = view
  return (
    <aside className="fa-aside" aria-label="Om övningarna och dina fällor" data-fa-shade>
      {trap ? (
        <section className="fa-aside-block" aria-labelledby="fa-ova-trap-h">
          <h2 className="fa-h3" id="fa-ova-trap-h">
            Fällan just nu
          </h2>
          <p className="fa-trap-meta">
            <b>{trap.section}</b>
            <span>
              {trap.count} {trap.count === 1 ? 'gång' : 'gånger'}
              {trap.rising ? ' · ↑ ökar' : ''}
            </span>
          </p>
          <OvaLink className="fa-trap-name" href={trap.href} navigateHref={navigateHref}>
            {trap.name}
          </OvaLink>
          {trap.pattern ? <p className="fa-trap-pattern">{trap.pattern}</p> : null}
          <OvaLink className="fa-link" href={trap.href} navigateHref={navigateHref}>
            Öva detta mönster <span aria-hidden>→</span>
          </OvaLink>
        </section>
      ) : null}
      <section className="fa-aside-block" aria-labelledby="fa-ova-about-h">
        <h2 className="fa-h3" id="fa-ova-about-h">
          Om övningarna
        </h2>
        <p className="fa-margin-note">
          ”Väntar” är missar i dagens hög. ”Redo nu” är de som går att repetera just nu.
        </p>
        <p className="fa-margin-note">
          {view.mixed.questions} frågor åt gången — DTK några fler, eftersom en figursida aldrig
          delas. Vanliga övningar har ingen klocka. Svaren sparas.
        </p>
        <p className="fa-margin-note">
          Frågeurval: <b>{view.smartDrill ? 'smart' : 'slumpat'}</b>
        </p>
        <OvaLink className="fa-link" href={ACCOUNT_ROUTES.settings} navigateHref={navigateHref}>
          Ändra i inställningarna <span aria-hidden>→</span>
        </OvaLink>
      </section>
    </aside>
  )
}
