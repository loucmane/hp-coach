import type { ComponentProps, CSSProperties, MouseEvent } from 'react'
import { Go } from '@/folio/ui/Go'
import { Lit } from '@/folio/ui/Lit'
import { bandGeometry, RangeBand, type RangeBandProps } from '@/folio/ui/RangeBand'
import { SEC_KEY } from '@/folio/ui/SecChip'
import type { FramstegView } from './framstegView'

export type NavigateHref = (href: string) => void

/** Clip the mini-band's box as well as its paint, retaining the shared core.
 * A hidden overflowing box still contributes to the track's scrollWidth. */
export function FramstegBand({
  low,
  high,
  section,
}: Pick<RangeBandProps, 'low' | 'high' | 'section'>) {
  const raw = bandGeometry(low, high, 0, 2)
  const left = Math.max(0, raw.left)
  const width = Math.min(100, raw.left + raw.width) - left
  const stop = (axisPercent: number) => `${((axisPercent - left) / width) * 100}%`
  const style = {
    '--fa-fr-band-width': `${width}%`,
    '--fa-fr-band-shift': `${left - raw.left}%`,
    '--fa-fr-band-start': stop(raw.left),
    '--fa-fr-band-core-start': stop(low * 50),
    '--fa-fr-band-core-end': stop(high * 50),
    '--fa-fr-band-end': stop(raw.left + raw.width),
  } as CSSProperties
  return (
    <div className="fa-fr-band" style={style}>
      <RangeBand low={low} high={high} max={2} section={section} size="mini" decorative />
    </div>
  )
}

function follow(event: MouseEvent<HTMLAnchorElement>, href: string, navigateHref: NavigateHref) {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.currentTarget.hasAttribute('download') ||
    (event.currentTarget.target && event.currentTarget.target !== '_self')
  )
    return
  event.preventDefault()
  navigateHref(href)
}

/** Real anchors retain native modified clicks, focus and open-in-new-tab. */
export function FramstegLink({
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
        follow(event, href, navigateHref)
      }}
    />
  )
}

export function FramstegReport({
  view,
  navigateHref,
  phone,
}: {
  view: FramstegView
  navigateHref: NavigateHref
  phone: boolean
}) {
  const p = view.prognosis
  const action = view.primary ? (
    <Go
      href={view.primary.href}
      dock={phone}
      kbd="↵"
      keyshortcuts="Enter"
      data-testid={view.dayZero ? 'progress-empty-cta' : 'framsteg-primary'}
      onClick={(event) => follow(event, view.primary!.href, navigateHref)}
    >
      {view.primary.label}
    </Go>
  ) : null
  return (
    <>
      <Lit className="fa-fr-report" aria-label="Prognos">
        <div>
          <h2 className="fa-label">Prognos just nu</h2>
          <div className="fa-result" aria-describedby={p.caveat ? 'fa-fr-caveat' : undefined}>
            <span className="fa-result-n" data-testid="progress-projected">
              {p.rangeLabel ?? '—'}
            </span>
            <span className="fa-result-of">av 2,0</span>
          </div>
          {p.low != null && p.high != null ? (
            <RangeBand
              low={p.low}
              high={p.high}
              max={2}
              ticks={['0', '0,5', '1,0', '1,5', '2,0']}
              label={`Prognos ${p.scoreLabel} av 2,0, intervall ${p.rangeLabel}`}
            />
          ) : (
            <p className="fa-empty">
              Ingen prognos än. Totalen visas när du har svarat på frågor i båda delarna.
            </p>
          )}
          <div className="fa-halves">
            {(
              [
                ['verbal', 'Verbal'],
                ['quant', 'Kvant'],
              ] as const
            ).map(([half, label]) => {
              const halfRange = p.halfRanges[half]
              return (
                <div className="fa-half" key={half} data-testid={`framsteg-half-${half}`}>
                  <span>
                    {label}{' '}
                    {halfRange.rangeLabel ? <b>{halfRange.rangeLabel}</b> : 'inget underlag än'}
                  </span>
                  {halfRange.low != null && halfRange.high != null ? (
                    <FramstegBand low={halfRange.low} high={halfRange.high} />
                  ) : (
                    <span className="fa-half-track" aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>
          <p className="fa-halves-note">
            Totalen är medelvärdet av halvorna, som på provet. {view.evidence.attempts} förstaförsök
            i underlaget.
          </p>
        </div>
        <div className="fa-evidence" data-testid="folio-framsteg-next">
          <h2 className="fa-label">Hur säker är den?</h2>
          <div
            className="fa-meter"
            role="img"
            aria-label={`Underlag per delprov: ${view.sections
              .map(
                (s) =>
                  `${s.section}: ${s.tier === 'full' ? 'underlag' : s.tier === 'glimpse' ? 'första glimt' : 'inget än'} (${s.attempts} svar)`,
              )
              .join(', ')}`}
          >
            {view.sections.map((s) => (
              <span key={s.section} aria-hidden="true">
                <i data-sec={SEC_KEY[s.section]} data-tier={s.tier} />
                {s.section}
              </span>
            ))}
          </div>
          <div className="fa-meter-key">
            <span>fylld = underlag</span>
            <span>låg = första glimt</span>
            <span>streckad = inget än</span>
          </div>
          <p>
            {view.evidence.full} delprov har underlag, {view.evidence.glimpse} en första glimt,{' '}
            {view.evidence.empty} inget än.
          </p>
          {!phone ? action : null}
          {view.primary ? <p className="fa-why">{view.primary.reason}</p> : null}
        </div>
      </Lit>
      {phone && action ? <div className="fa-fr-dock">{action}</div> : null}
    </>
  )
}
