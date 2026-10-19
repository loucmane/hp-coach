// Two calm placeholder stages in the bake-off's lab greys, so neither ever
// reads as a design of its own:
//   - DirectionStub: what a direction folder shows until its direction is
//     built (bead hpf-qr0p.2), an "Under arbete" card. It takes the same
//     DirectionProps as a built direction and carries the rd-<name> test id
//     a built direction's root carries, so every key works end to end.
//   - NotBuilt: what the stage shows instead of a direction on a screen the
//     direction has not built yet (kit v2, hpf-qr0p.7): "Inte byggd än i
//     <Riktning>", what the screen will show, and the screens it does have.
// Both name the screen, width and theme the switcher has picked.

import { useId } from 'react'

import './directionStub.css'
import './redesign2026.css'
import {
  APP_SCREENS,
  type AppScreenKey,
  type DirectionMeta,
  type DirectionProps,
  THEMES,
  type ThemeKey,
  WIDTHS,
  type WidthKey,
} from '@/components/devbake/redesign/r1Kit'

function whereLine(screen: AppScreenKey, width: WidthKey, theme: ThemeKey): string {
  return [
    `Skärm ${screen} · ${APP_SCREENS.find((s) => s.key === screen)?.label}`,
    WIDTHS.find((w) => w.key === width)?.label,
    THEMES.find((t) => t.key === theme)?.label,
  ].join(' · ')
}

export function DirectionStub({
  meta,
  screen,
  width,
  theme,
  live,
}: DirectionProps & { meta: DirectionMeta }) {
  const titleId = useId()
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
          {whereLine(screen, width, theme)}
        </p>
      </section>
    </div>
  )
}

/**
 * The stage's card for a screen `meta` has not built: the screen's name
 * and what it will show, "Inte byggd än i <Riktning>", and the screens the
 * direction does have, each a step away.
 */
export function NotBuilt({
  meta,
  built,
  screen,
  width,
  theme,
  live,
  onScreen,
}: {
  meta: DirectionMeta
  /** The screens the direction has built (directions.ts screensOf). */
  built: readonly AppScreenKey[]
  screen: AppScreenKey
  width: WidthKey
  theme: ThemeKey
  live: boolean
  onScreen: (screen: AppScreenKey) => void
}) {
  const titleId = useId()
  const info = APP_SCREENS.find((s) => s.key === screen) ?? APP_SCREENS[0]
  const have = APP_SCREENS.filter((s) => built.includes(s.key))
  return (
    <div
      data-rd="stub"
      data-theme={theme}
      data-width={width}
      data-live={String(live)}
      data-testid="rd-not-built-stage"
      lang="sv"
    >
      <section className="rs-card" aria-labelledby={titleId} data-testid="rd-not-built">
        <p className="rs-status">
          <span className="rs-key" aria-hidden>
            {meta.key.toUpperCase()}
          </span>
          Skärm {info.key} av {APP_SCREENS.length}
        </p>
        <h1 id={titleId}>{info.label}</h1>
        <p className="rs-tagline">Inte byggd än i {meta.name}.</p>
        <p className="rs-note">{info.blurb}</p>
        {have.length ? (
          <nav className="rs-built" aria-label={`Byggt i ${meta.name}`}>
            <p className="rs-built-label">Byggt i {meta.name}:</p>
            <ul>
              {have.map((s) => (
                <li key={s.key}>
                  <button
                    type="button"
                    data-testid={`rd-not-built-go-${s.key}`}
                    onClick={() => onScreen(s.key)}
                  >
                    <span className="rs-built-num" aria-hidden>
                      {s.key}
                    </span>
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <p className="rs-where" data-testid="rd-stub-where">
          {whereLine(screen, width, theme)}
        </p>
      </section>
    </div>
  )
}
