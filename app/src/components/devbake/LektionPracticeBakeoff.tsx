// LektionPracticeBakeoff — how to surface targeted practice ("Öva detta
// mönster") on the lektion trap rows. Renders the REAL XYZ trap catalog in
// the EDITION row chrome and toggles the design decisions live, so the call
// is "looks optimal" + "is optimal" on real data, not prose.
//
// Four axes:
//   VERB    where/how the practice link appears on a COLLAPSED row
//           buried (today) · inline · chip · below-rule
//   GATE    express (öva always available) · gated (Läs först until read)
//   DENSITY verb on every row · only on weak/relevant rows
//   SEKTION show a section-top "Öva hela XYZ / svagaste fällorna" CTA
//
// Dev-only surface. Reads the live theme tokens (--ink/--panel/--bg/--muted
// /--hairline/--accent/--font-display/--font-mono) so light+dark are faithful.

import { useEffect, useState } from 'react'
import { MathText } from '@/components/MathText'
import { type Framework, loadFramework } from '@/data/frameworks'

type Verb = 'buried' | 'inline' | 'inline-loud' | 'chip' | 'below'
type Gate = 'express' | 'gated'
type Density = 'all' | 'weak'

// Pretend signal so gate/density have something to render against.
const WEAK = new Set([0, 2, 5, 8, 11])
const READ = new Set([1, 2, 6, 9])

function Seg<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { v: T; l: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={eyebrowStyle}>{label}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              font: 'inherit',
              fontSize: 12,
              padding: '5px 11px',
              borderRadius: 7,
              border: '1px solid var(--hairline)',
              cursor: 'pointer',
              background: value === o.v ? 'var(--ink)' : 'var(--panel)',
              color: value === o.v ? 'var(--bg)' : 'var(--ink)',
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
}

// Reset for the bake-off's mockup "öva" elements — they don't navigate
// (this is a visual comparison surface), so they're buttons, not anchors.
const mockBtn: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  margin: 0,
  cursor: 'pointer',
  textAlign: 'left',
}

/** The practice verb, rendered per the active style. `muted` = a gated
 *  unread row (show "Läs först" hint instead of an active link). */
function Ova({ style, muted }: { style: Verb; muted: boolean }) {
  if (muted) {
    return (
      <span style={{ ...eyebrowStyle, color: 'var(--muted)', textTransform: 'none', fontSize: 13 }}>
        Läs först
      </span>
    )
  }
  const link = (extra: React.CSSProperties) => (
    <button
      type="button"
      style={{
        ...mockBtn,
        fontFamily: 'var(--font-display)',
        fontSize: 14,
        color: 'var(--accent)',
        whiteSpace: 'nowrap',
        ...extra,
      }}
    >
      Öva detta mönster →
    </button>
  )
  if (style === 'inline') return link({ fontSize: 13 })
  if (style === 'inline-loud')
    return link({ fontSize: 15, fontWeight: 600, letterSpacing: '-0.005em' })
  if (style === 'chip')
    return (
      <button
        type="button"
        style={{
          ...mockBtn,
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          border: '1px solid var(--accent)',
          borderRadius: 999,
          padding: '4px 11px',
          whiteSpace: 'nowrap',
        }}
      >
        Öva →
      </button>
    )
  // below
  return (
    <div style={{ marginTop: 12 }}>
      {link({ borderBottom: '1px solid var(--accent)', paddingBottom: 2, fontSize: 14 })}
    </div>
  )
}

export function LektionPracticeBakeoff() {
  const [fw, setFw] = useState<Framework | null>(null)
  const [verb, setVerb] = useState<Verb>('inline')
  const [gate, setGate] = useState<Gate>('express')
  const [density, setDensity] = useState<Density>('all')
  const [sektion, setSektion] = useState(true)

  useEffect(() => {
    loadFramework('XYZ').then(setFw)
  }, [])

  // XYZ resolves to the trap-catalog family (TrapEntry: id + tldr +
  // pattern_description); narrow off the framework union for the headword.
  const entries = (
    (fw?.entries ?? []) as Array<{
      id: string
      tldr?: string
      pattern_description?: string
    }>
  ).slice(0, 14)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)' }}>
      {/* control bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--panel)',
          borderBottom: '1px solid var(--hairline)',
          padding: '14px clamp(16px, 4vw, 48px)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 22,
          alignItems: 'flex-end',
        }}
      >
        <Seg
          label="Verb"
          value={verb}
          onChange={setVerb}
          options={[
            { v: 'buried', l: 'Begravd (idag)' },
            { v: 'inline', l: 'Inline' },
            { v: 'inline-loud', l: 'Inline+' },
            { v: 'chip', l: 'Chip' },
            { v: 'below', l: 'Under rubrik' },
          ]}
        />
        <Seg
          label="Tröskel"
          value={gate}
          onChange={setGate}
          options={[
            { v: 'express', l: 'Öva alltid' },
            { v: 'gated', l: 'Läs först' },
          ]}
        />
        <Seg
          label="Täthet"
          value={density}
          onChange={setDensity}
          options={[
            { v: 'all', l: 'Varje rad' },
            { v: 'weak', l: 'Bara svaga' },
          ]}
        />
        <Seg
          label="Sektion-CTA"
          value={sektion ? 'on' : 'off'}
          onChange={(v) => setSektion(v === 'on')}
          options={[
            { v: 'on', l: 'På' },
            { v: 'off', l: 'Av' },
          ]}
        />
        <span style={{ ...eyebrowStyle, alignSelf: 'center', marginLeft: 'auto' }}>
          lektion · öva-bake-off
        </span>
      </div>

      {/* the lektion surface */}
      <div
        style={{
          maxWidth: '72ch',
          margin: '0 auto',
          padding: 'clamp(28px, 5vw, 56px) clamp(16px, 4vw, 24px)',
        }}
      >
        <span style={eyebrowStyle}>← Alla sektioner · Lektion</span>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(44px, 8vw, 84px)',
            lineHeight: 1,
            letterSpacing: '-0.02em',
            margin: '14px 0 10px',
          }}
        >
          XYZ
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 19,
            color: 'var(--muted)',
            margin: '0 0 10px',
          }}
        >
          Matematisk problemlösning.
        </p>
        <span style={eyebrowStyle}>
          {fw ? `${fw.entries.length} mönster · ~46 min läsning` : 'laddar…'}
        </span>

        {/* section-top CTA candidate */}
        {sektion && (
          <div
            style={{
              marginTop: 26,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <button type="button" style={ctaPrimary}>
              Öva hela XYZ → <span style={{ color: 'var(--bg)', opacity: 0.7 }}>~10 frågor</span>
            </button>
            <button type="button" style={ctaGhost}>
              Öva svagaste fällorna →
            </button>
          </div>
        )}

        {/* trap rows */}
        <div style={{ marginTop: 30 }}>
          {entries.map((entry, i) => {
            const isWeak = WEAK.has(i)
            const isRead = READ.has(i)
            const showVerb = verb !== 'buried' && (density === 'all' || isWeak)
            const muted = gate === 'gated' && !isRead
            const ova = showVerb ? <Ova style={verb} muted={muted} /> : null
            const inlineSlot = verb === 'inline' || verb === 'inline-loud' || verb === 'chip'
            // "Inline+" demotes the read-more toggle so öva clearly wins the strip.
            const lasMer =
              verb === 'inline-loud' ? { fontSize: 10, opacity: 0.55 } : { fontSize: 11 }
            return (
              <details
                key={entry.id}
                style={{
                  paddingBlock: 22,
                  borderTop: '1px solid var(--hairline)',
                  background:
                    isWeak && density === 'weak'
                      ? 'color-mix(in oklch, var(--accent) 5%, transparent)'
                      : undefined,
                }}
              >
                <summary
                  style={{
                    listStyle: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      gap: 16,
                    }}
                  >
                    <span style={eyebrowStyle}>
                      {`XYZ · TRAP ${String(i + 1).padStart(3, '0')}`}
                      {isRead ? ' · LÄST' : ''}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                      {inlineSlot && ova}
                      <span style={{ ...eyebrowStyle, ...lasMer }}>LÄS MER +</span>
                    </span>
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(19px, 1.2vw + 13px, 24px)',
                      lineHeight: 1.3,
                      letterSpacing: '-0.01em',
                      margin: 0,
                    }}
                  >
                    <MathText>{entry.tldr || entry.pattern_description}</MathText>
                  </h3>
                  {verb === 'below' && ova}
                </summary>
              </details>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const ctaPrimary: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  background: 'var(--ink)',
  color: 'var(--bg)',
  border: 'none',
  cursor: 'pointer',
  padding: '11px 18px',
  borderRadius: 9,
  whiteSpace: 'nowrap',
}
const ctaGhost: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 15,
  background: 'none',
  color: 'var(--ink)',
  cursor: 'pointer',
  padding: '11px 18px',
  borderRadius: 9,
  border: '1px solid var(--hairline)',
  whiteSpace: 'nowrap',
}
