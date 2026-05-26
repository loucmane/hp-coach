// Heat Strip Variant A — None (control).
//
// Renders nothing useful — just a placeholder card explaining that
// this category's "A" pick means "no consistency visualization;
// /progress stays as-is." Picking A in the bake-off saves us from
// a worker change + a new UI element when the long-arc story isn't
// worth telling.

import { Eyebrow } from '@/components/primitives'

export function HeatStripA() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px dashed var(--hairline)',
        borderRadius: 'var(--radius)',
        padding: 'clamp(20px, 2vw + 12px, 32px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 220,
        justifyContent: 'center',
      }}
    >
      <Eyebrow>Ingen visualisering</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(14px, 0.4vw + 12px, 16px)',
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          margin: 0,
          maxWidth: '40ch',
        }}
      >
        Picka detta om streak-siffran på /progress räcker som långbågesignal. Sparar ett
        worker-endpoint-tillägg och en ny UI-yta.
      </p>
    </div>
  )
}
