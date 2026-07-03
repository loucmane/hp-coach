// /m-compare — M-series approval surface: the LIVE product and the M3
// reference rendered side by side in same-origin iframes, so each rebuild
// slice (M1, M2, …) can be judged in-page instead of via screenshots.
//
// Presets pair a live route with its M3 counterpart (`/redesign-l12`
// variant 3, `q=` drill key). The phone toggle constrains both panes to
// 390px. Dev-gated like every bake-off surface.

import { createFileRoute } from '@tanstack/react-router'
import { type CSSProperties, useState } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/m-compare')({
  component: MCompare,
})

const REF_BASE = '/redesign-l12?dev=1&v=3'

const PRESETS = [
  { key: 'ord', label: 'Drill · ORD', live: '/drill?section=ORD', ref: `${REF_BASE}&q=ord` },
  { key: 'kva', label: 'Drill · KVA', live: '/drill?section=KVA', ref: `${REF_BASE}&q=xyz` },
  { key: 'las', label: 'Drill · LÄS', live: '/drill?section=L%C3%84S', ref: `${REF_BASE}&q=las` },
  { key: 'nog', label: 'Drill · NOG', live: '/drill?section=NOG', ref: `${REF_BASE}&q=nog` },
  { key: 'dtk', label: 'Drill · DTK', live: '/drill?section=DTK', ref: `${REF_BASE}&q=dtk` },
  { key: 'home', label: 'Hem', live: '/', ref: `${REF_BASE}&s=home` },
] as const

type PresetKey = (typeof PRESETS)[number]['key']

function MCompare() {
  const [preset, setPreset] = useState<PresetKey>('ord')
  // Desktop stacks the panes full-width (a 50/50 horizontal split would
  // shrink both apps into their phone breakpoints); phone puts two 390px
  // panes side by side.
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
  const paneWidth = phone ? 390 : undefined

  return (
    <div
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          flexWrap: 'wrap',
          padding: '10px 16px',
          borderBottom: '1px solid var(--hairline)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        <strong>M-compare</strong>
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
        <button type="button" onClick={() => setPhone((v) => !v)} style={chip(phone)}>
          390px
        </button>
        <button type="button" onClick={() => setReloadKey((k) => k + 1)} style={chip(false)}>
          Ladda om
        </button>
      </header>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: phone ? 'row' : 'column',
        }}
      >
        <Pane
          key={`live-${reloadKey}`}
          title="LIVE (den riktiga produkten)"
          src={p.live}
          width={paneWidth}
        />
        <div
          style={{
            width: phone ? 1 : undefined,
            height: phone ? undefined : 1,
            background: 'var(--hairline)',
          }}
        />
        <Pane key={`ref-${reloadKey}`} title="M3-REFERENS (målet)" src={p.ref} width={paneWidth} />
      </div>
    </div>
  )
}

// Phone panes render at a true 390px layout width but are scaled up so
// they read comfortably on a desktop monitor (unscaled 390 CSS px is
// squint-small at arm's length).
const PHONE_SCALE = 1.35

function Pane({ title, src, width }: { title: string; src: string; width?: number }) {
  return (
    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '6px 12px',
          fontSize: 10,
          letterSpacing: '0.1em',
          color: 'var(--muted)',
          borderBottom: '1px solid var(--hairline)',
        }}
      >
        {title} · <code style={{ textTransform: 'none' }}>{src}</code>
      </div>
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {width ? (
          <div style={{ width: width * PHONE_SCALE, maxWidth: '100%' }}>
            <iframe
              title={title}
              src={src}
              style={{
                border: 'none',
                width,
                height: `${100 / PHONE_SCALE}%`,
                transform: `scale(${PHONE_SCALE})`,
                transformOrigin: 'top left',
                boxShadow: '0 0 0 1px var(--hairline)',
              }}
            />
          </div>
        ) : (
          <iframe
            title={title}
            src={src}
            style={{ border: 'none', height: '100%', width: '100%' }}
          />
        )}
      </div>
    </div>
  )
}

function chip(active: boolean): CSSProperties {
  return {
    all: 'unset',
    cursor: 'pointer',
    padding: '3px 8px',
    borderRadius: 4,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: active ? 'var(--bg)' : 'var(--ink-2)',
    background: active ? 'var(--ink)' : 'transparent',
    border: '1px solid var(--hairline)',
  }
}
