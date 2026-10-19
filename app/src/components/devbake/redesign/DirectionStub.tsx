// The stage a direction folder shows until its direction is built (bead
// hpf-qr0p.2): a calm "Under arbete" card on a neutral page in the
// bake-off's lab greys, so it never reads as a design of its own. It takes
// the same DirectionProps as a built direction and names the screen, width
// and theme the switcher has picked, so every key works end to end. The
// root carries the rd-<name> test id a built direction's root carries.

import { useId } from 'react'

import './directionStub.css'
import {
  type DirectionMeta,
  type DirectionProps,
  SCREENS,
  THEMES,
  WIDTHS,
} from '@/components/devbake/redesign/r1Kit'

export function DirectionStub({
  meta,
  screen,
  width,
  theme,
  live,
}: DirectionProps & { meta: DirectionMeta }) {
  const titleId = useId()
  const where = [
    `Skärm ${screen} · ${SCREENS.find((s) => s.key === screen)?.label}`,
    WIDTHS.find((w) => w.key === width)?.label,
    THEMES.find((t) => t.key === theme)?.label,
  ].join(' · ')
  return (
    <div
      data-rd="stub"
      data-theme={theme}
      data-width={width}
      data-live={String(live)}
      data-testid={`rd-${meta.slug.slice(2)}`}
      lang="sv"
    >
      <section className="rs-card" aria-labelledby={titleId} data-testid="rd-stub">
        <p className="rs-status">
          <span className="rs-key" aria-hidden>
            {meta.key.toUpperCase()}
          </span>
          Under arbete
        </p>
        <h1 id={titleId}>{meta.name}</h1>
        <p className="rs-tagline">{meta.tagline}</p>
        <p className="rs-note">Riktningen byggs just nu och visas här när den är klar.</p>
        <p className="rs-where" data-testid="rd-stub-where">
          {where}
        </p>
      </section>
    </div>
  )
}
