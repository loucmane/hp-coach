// /m-compare — M-series approval surface: the LIVE product and the M3
// reference rendered together, so each rebuild slice (M1, M2, …) can be
// judged in-page instead of via screenshots.
//
// Presentation is a design workbench: a recessed canvas with the two
// surfaces mounted as artboards (desktop) or device frames (phone).
// Same-origin iframes let us groom the panes after load — dev overlays
// (variant switcher, share/tweaks pills) are hidden, and in phone mode
// the M3 mock gets the MD bake-off's linearisation overrides (the mock
// itself is desktop-composed; the owner picked the linearised phone
// treatment in /redesign-layout-bakeoff, so that IS the phone target).
//
// Dev-gated like every bake-off surface.

import { createFileRoute } from '@tanstack/react-router'
import { type CSSProperties, type SyntheticEvent, useCallback, useState } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/m-compare')({
  component: MCompare,
})

const REF_BASE = '/redesign-l12?dev=1&v=3'

const PRESETS = [
  { key: 'ord', label: 'ORD', live: '/drill?section=ORD', ref: `${REF_BASE}&q=ord` },
  { key: 'kva', label: 'KVA', live: '/drill?section=KVA', ref: `${REF_BASE}&q=xyz` },
  { key: 'las', label: 'LÄS', live: '/drill?section=L%C3%84S', ref: `${REF_BASE}&q=las` },
  { key: 'nog', label: 'NOG', live: '/drill?section=NOG', ref: `${REF_BASE}&q=nog` },
  { key: 'dtk', label: 'DTK', live: '/drill?section=DTK', ref: `${REF_BASE}&q=dtk` },
  { key: 'home', label: 'HEM', live: '/', ref: `${REF_BASE}&s=home` },
] as const

type PresetKey = (typeof PRESETS)[number]['key']

// The MD bake-off's phone linearisation (LayoutBakeoff.tsx `.bk-phone
// [data-phonerail="linear"]`) — the owner-picked phone treatment, applied
// to the desktop-composed M3 mock so the phone reference is honest.
// !important + doubled class specificity: the mock's own <style> renders
// with the React tree AFTER our onLoad injection, so plain overrides lose.
const LINEARIZE_CSS = `
  .m3-frame.m3-frame { padding: 28px 16px 48px !important; }
  .m3-frame .m3-row { grid-template-columns: 1fr !important; row-gap: 8px !important; }
  .m3-frame .m3-spine { display: none !important; }
  .m3-frame .m3-meta { text-align: left !important; padding-top: 0 !important; }
`

// Hide dev overlays inside a pane so the comparison shows only product:
// the redesign-l12 variant switcher (fixed, zIndex 9999) and the
// share-debug / tweaks pills.
function groomPane(iframe: HTMLIFrameElement, linearize: boolean) {
  const doc = iframe.contentDocument
  if (!doc) return
  const style = doc.createElement('style')
  style.textContent = linearize ? LINEARIZE_CSS : ''
  const groom = () => {
    // Keep our sheet LAST in <head> — the SPA renders (and appends its
    // styles) after the iframe's load event, so re-appending on each pass
    // wins the cascade against later-added sheets.
    doc.head.appendChild(style)
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>('div, button'))) {
      if (el.style?.zIndex === '9999') el.style.display = 'none'
    }
    doc
      .querySelector<HTMLElement>('[data-testid="share-debug-button"]')
      ?.style.setProperty('display', 'none')
    doc
      .querySelector<HTMLElement>('[aria-label="Öppna design-tweaks"]')
      ?.style.setProperty('display', 'none')
  }
  groom()
  // React mounts overlays + styles after route-level effects settle.
  setTimeout(groom, 600)
  setTimeout(groom, 1800)
  setTimeout(groom, 3500)
}

function MCompare() {
  const [preset, setPreset] = useState<PresetKey>('ord')
  const [phone, setPhone] = useState(false)
  // Bumping the key remounts both iframes — a fresh look after answering
  // through questions in the live pane.
  const [reloadKey, setReloadKey] = useState(0)

  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /m-compare is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const p = PRESETS.find((x) => x.key === preset) ?? PRESETS[0]

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        // Recessed workbench canvas — the artboards read as mounted pages.
        background: 'color-mix(in oklch, var(--bg) 94%, var(--ink))',
        color: 'var(--ink)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          padding: '12px 20px',
          borderBottom: '1px solid var(--hairline)',
          background: 'var(--bg)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
        }}
      >
        <span style={{ fontWeight: 700 }}>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; M-compare
        </span>
        <span style={{ color: 'var(--hairline)' }}>|</span>
        {PRESETS.map((x) => (
          <button
            key={x.key}
            type="button"
            onClick={() => setPreset(x.key)}
            style={chip(x.key === preset)}
          >
            {x.label}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <button type="button" onClick={() => setPhone(false)} style={chip(!phone)}>
          Desktop
        </button>
        <button type="button" onClick={() => setPhone(true)} style={chip(phone)}>
          Telefon
        </button>
        <span style={{ color: 'var(--hairline)' }}>|</span>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} style={chip(false)}>
          Ladda om
        </button>
      </header>

      {phone ? (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'stretch',
            gap: 'clamp(24px, 5vw, 80px)',
            padding: '20px clamp(16px, 4vw, 48px) 24px',
          }}
        >
          <DeviceFrame
            key={`live-${reloadKey}`}
            label="Live · den riktiga produkten"
            dot="var(--accent)"
            src={p.live}
            linearize={false}
          />
          <DeviceFrame
            key={`ref-${reloadKey}`}
            label="Mål · M3-referensen (linjäriserad)"
            dot="var(--muted)"
            src={p.ref}
            linearize
          />
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            padding: '18px clamp(16px, 3vw, 40px) 22px',
          }}
        >
          <Artboard
            key={`live-${reloadKey}`}
            label="Live · den riktiga produkten"
            dot="var(--accent)"
            src={p.live}
          />
          <Artboard
            key={`ref-${reloadKey}`}
            label="Mål · M3-referensen"
            dot="var(--muted)"
            src={p.ref}
          />
        </div>
      )}
    </div>
  )
}

function PaneLabel({ label, dot }: { label: string; dot: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        fontSize: 10,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        padding: '0 2px 8px',
      }}
    >
      <span style={{ color: dot, fontSize: 8 }}>●</span>
      {label}
    </div>
  )
}

function Artboard({ label, dot, src }: { label: string; dot: string; src: string }) {
  const onLoad = useCallback(
    (e: SyntheticEvent<HTMLIFrameElement>) => groomPane(e.currentTarget, false),
    [],
  )
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <PaneLabel label={label} dot={dot} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 12px 32px -18px rgba(0, 0, 0, 0.25)',
        }}
      >
        <iframe
          title={label}
          src={src}
          onLoad={onLoad}
          style={{ border: 'none', width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  )
}

function DeviceFrame({
  label,
  dot,
  src,
  linearize,
}: {
  label: string
  dot: string
  src: string
  linearize: boolean
}) {
  const onLoad = useCallback(
    (e: SyntheticEvent<HTMLIFrameElement>) => groomPane(e.currentTarget, linearize),
    [linearize],
  )
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        minHeight: 0,
      }}
    >
      <PaneLabel label={label} dot={dot} />
      <div
        style={{
          flex: 1,
          minHeight: 0,
          width: 390 + 2 * 10,
          maxWidth: '46vw',
          padding: 10,
          borderRadius: 40,
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          boxShadow: '0 28px 64px -28px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.06)',
          boxSizing: 'border-box',
        }}
      >
        <iframe
          title={label}
          src={src}
          onLoad={onLoad}
          style={{
            border: '1px solid var(--hairline)',
            borderRadius: 30,
            width: 390,
            maxWidth: '100%',
            height: '100%',
            display: 'block',
            background: 'var(--bg)',
          }}
        />
      </div>
    </div>
  )
}

function chip(active: boolean): CSSProperties {
  return {
    all: 'unset',
    cursor: 'pointer',
    padding: '4px 12px',
    borderRadius: 999,
    fontSize: 11,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: active ? 'var(--bg)' : 'var(--ink-2)',
    background: active ? 'var(--ink)' : 'transparent',
    border: active ? '1px solid var(--ink)' : '1px solid var(--hairline)',
  }
}
