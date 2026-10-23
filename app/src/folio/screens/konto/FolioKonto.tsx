import { type RefObject, useEffect, useRef, useState } from 'react'
import { DeleteSlip } from './DeleteSlip'
import { KontoIndex, KontoMargin } from './KontoMargin'
import { KontoLink, KontoSections } from './KontoSections'
import { COPY, type KontoEntry, type KontoPlace, type NavigateHref } from './kontoView'
import { useKontoExtras } from './useKontoExtras'
import './konto.css'

/** Align the heading itself in the real shell's document scroll, with breathing room. */
function goTo(root: HTMLElement | null, place: KontoPlace, focus = true) {
  const target = root?.querySelector<HTMLElement>(`#fa-kt-${place}`)
  if (!target) return
  if (focus) target.focus({ preventScroll: true })
  window.scrollTo({
    top: Math.max(0, window.scrollY + target.getBoundingClientRect().top - 24),
    behavior: 'instant',
  })
}

/** Initial navigation may follow hydration, but must never overrule the student. */
function useMerLanding(root: RefObject<HTMLDivElement | null>, entry: KontoEntry, ready: boolean) {
  const landing = useRef({ cancelled: false, started: false, scrollY: 0 })
  useEffect(() => {
    if (entry !== 'mer') return
    const visit = { cancelled: false, started: false, scrollY: window.scrollY }
    landing.current = visit
    const cancel = () => {
      visit.cancelled = true
    }
    const onScroll = () => {
      // Our instant alignment also dispatches a later scroll event.
      if (Math.abs(window.scrollY - visit.scrollY) > 1) cancel()
    }
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown']
    for (const input of inputs)
      window.addEventListener(input, cancel, { capture: true, passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancel()
      for (const input of inputs) window.removeEventListener(input, cancel, true)
      window.removeEventListener('scroll', onScroll)
    }
  }, [entry])

  useEffect(() => {
    if (entry !== 'mer' || !ready) return
    const visit = landing.current
    // Give the root's passive preference/sitting hydration a frame to commit.
    let frame = requestAnimationFrame((startedAt) => {
      if (visit.cancelled || visit.started) return
      const target = root.current?.querySelector<HTMLElement>('#fa-kt-ovningen')
      if (!target) return
      visit.started = true
      goTo(root.current, 'ovningen')
      visit.scrollY = window.scrollY
      const initialY = window.scrollY + target.getBoundingClientRect().top
      const check = (now: number) => {
        if (visit.cancelled || now - startedAt > 1000) return
        const currentY = window.scrollY + target.getBoundingClientRect().top
        if (Math.abs(currentY - initialY) > 8) {
          goTo(root.current, 'ovningen', false)
          visit.scrollY = window.scrollY
          return // At most one correction; keep any existing focus.
        }
        frame = requestAnimationFrame(check)
      }
      frame = requestAnimationFrame(check)
    })
    return () => cancelAnimationFrame(frame)
  }, [entry, ready, root])
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
  useMerLanding(root, entry, k.landingReady)
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
                    disabled={
                      k.loggingOut || !['idle', 'failed', 'signout-failed'].includes(k.deletion)
                    }
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
