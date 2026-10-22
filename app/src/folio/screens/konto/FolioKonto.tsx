import { useEffect, useRef, useState } from 'react'
import { DeleteSlip } from './DeleteSlip'
import { KontoIndex, KontoMargin } from './KontoMargin'
import { KontoLink, KontoSections } from './KontoSections'
import { COPY, type KontoEntry, type KontoPlace, type NavigateHref } from './kontoView'
import { useKontoExtras } from './useKontoExtras'
import './konto.css'

/** Align the heading itself in the real shell's document scroll, with breathing room. */
function goTo(root: HTMLElement | null, place: KontoPlace) {
  const target = root?.querySelector<HTMLElement>(`#fa-kt-${place}`)
  if (!target) return
  target.focus({ preventScroll: true })
  window.scrollTo({
    top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 24),
    behavior: 'instant',
  })
}

export default function FolioKonto({
  entry,
  navigateHref: navigateOverride,
}: {
  entry: KontoEntry
  navigateHref?: NavigateHref
}) {
  const k = useKontoExtras()
  const navigateHref = navigateOverride ?? k.navigateHref
  const root = useRef<HTMLDivElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const farewell = useRef<HTMLHeadingElement>(null)
  const [deleting, setDeleting] = useState(false)
  const phone = k.viewport === 'phone'
  useEffect(() => {
    if (entry === 'mer') goTo(root.current, 'ovningen')
  }, [entry])
  useEffect(() => {
    if (k.deletion === 'done') farewell.current?.focus()
  }, [k.deletion])
  const go = (place: KontoPlace) => goTo(root.current, place)

  return (
    <div
      ref={root}
      className={`fa-konto ${phone ? 'fa-phome' : 'fa-home'}`}
      data-testid="folio-konto"
      data-entry={entry}
    >
      <div className="fa-kt-masthead">
        <span className="fa-kt-label-small">Konto</span>
        {k.days >= 0 ? (
          <span className="fa-kt-count">
            {k.days} dagar · {k.sitting.label.toLowerCase()}
          </span>
        ) : null}
      </div>
      {k.deletion === 'done' ? (
        <section
          className="fa-kt-main"
          data-testid="konto-delete-done"
          aria-labelledby="fa-kt-done"
        >
          <h1 ref={farewell} className="fa-kt-greet" id="fa-kt-done" tabIndex={-1}>
            Kontot är raderat.
          </h1>
          <p className="fa-kt-day">Allt är borta. Tack för att du testade HP-Coach.</p>
        </section>
      ) : (
        <>
          <div className="fa-kt-main">
            <KontoLink className="fa-kt-link fa-kt-back" href="/" navigateHref={navigateHref}>
              ← Tillbaka till Idag
            </KontoLink>
            <h1 className="fa-kt-greet">Ditt konto.</h1>
            <p className="fa-kt-day">Ett val gäller så fort du gör det.</p>
            {phone ? <KontoIndex go={go} /> : null}
            <KontoSections extras={k} navigateHref={navigateHref} />
            {entry === 'konto' ? (
              <>
                <div className="fa-kt-out">
                  <button
                    type="button"
                    className="fa-kt-quiet"
                    disabled={k.loggingOut || !['idle', 'failed'].includes(k.deletion)}
                    onClick={() => void k.logout()}
                  >
                    Logga ut
                  </button>
                  <button
                    ref={opener}
                    type="button"
                    className="fa-kt-link"
                    data-testid="konto-delete"
                    aria-haspopup="dialog"
                    disabled={k.loggingOut || !['idle', 'failed'].includes(k.deletion)}
                    onClick={() => setDeleting(true)}
                  >
                    Radera kontot →
                  </button>
                </div>
                <p className="fa-kt-error fa-kt-status" role="status">
                  {k.logoutFailed ? 'Det gick inte att logga ut. Försök igen.' : ''}
                </p>
                {!deleting ? (
                  <>
                    <p className="fa-kt-error fa-kt-status" role="status">
                      {k.deletion === 'pending'
                        ? 'Raderar…'
                        : k.deletion === 'failed'
                          ? COPY.deleteFailed
                          : k.deletion === 'signout-failed'
                            ? COPY.signoutFailed
                            : k.deletion === 'signing-out'
                              ? 'Kontot är raderat. Loggar ut…'
                              : ''}
                    </p>
                    {k.deletion === 'signout-failed' ? (
                      <button
                        type="button"
                        className="fa-kt-link"
                        onClick={() => void k.finishSignOut()}
                      >
                        Försök logga ut igen
                      </button>
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}
          </div>
          <KontoMargin phone={phone} go={go} />
          {entry === 'konto' && deleting ? (
            <DeleteSlip extras={k} opener={opener} onClose={() => setDeleting(false)} />
          ) : null}
        </>
      )}
    </div>
  )
}
