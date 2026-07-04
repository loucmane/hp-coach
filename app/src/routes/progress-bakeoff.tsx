// /progress-bakeoff — three M3 compositions for the /progress overhaul.
//
// Owner: "I like the concept but it looks a bit messy and janky." The
// concepts stay (prognosis + halves, per-section table with confidence,
// weekly trend vs goal, consistency heat, focus recommendation,
// activity/repetition ledger); the composition moves to the M3 rail
// chassis. Same realistic fixture under each candidate:
//
//   A · RAPPORTEN   the ledger report — stacked rail sections, section
//                   rows in the home-trap idiom, compact heat strip,
//                   sparkline trend. The M3-native answer.
//   B · TIDSKRIFTEN magazine spread — hero prognosis display, the week
//                   as a written paragraph, sections as a quiet table
//   C · TERMINALEN  dense mono ledger — maximum data per pixel, serif
//                   only for the page title
//
// Dev-gated. Winner becomes the ProgressMobile rebuild.

import { createFileRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/progress-bakeoff')({
  component: ProgressBakeoff,
})

// ── Fixture — a plausible mid-campaign state ───────────────────────

const SECTIONS = [
  { key: 'ORD', score: '1,52', band: '±0,08', trend: '↗', attempts: 412, conf: 'hög' },
  { key: 'LÄS', score: '1,38', band: '±0,14', trend: '→', attempts: 96, conf: 'hög' },
  { key: 'MEK', score: '1,44', band: '±0,12', trend: '↗', attempts: 128, conf: 'hög' },
  { key: 'ELF', score: '1,21', band: '±0,16', trend: '↘', attempts: 74, conf: 'medel' },
  { key: 'XYZ', score: '1,58', band: '±0,10', trend: '↗', attempts: 205, conf: 'hög' },
  { key: 'KVA', score: '1,47', band: '±0,11', trend: '↗', attempts: 233, conf: 'hög' },
  { key: 'NOG', score: '1,29', band: '±0,15', trend: '→', attempts: 88, conf: 'medel' },
  { key: 'DTK', score: '1,12', band: '±0,19', trend: '↘', attempts: 51, conf: 'medel' },
] as const

const WEEKS = [1.18, 1.22, 1.2, 1.27, 1.31, 1.28, 1.35, 1.34, 1.39, 1.41, 1.4, 1.44]
const GOAL = 1.8
// 12 weeks × 7 days activity intensity 0–3
const HEAT = Array.from({ length: 12 }, (_, w) =>
  Array.from({ length: 7 }, (_, d) =>
    (w * 7 + d) % 9 === 3 ? 0 : (((w + d * 2) % 4) as 0 | 1 | 2 | 3),
  ),
)

function ProgressBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /progress-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'color-mix(in oklch, var(--bg) 94%, var(--ink))',
        color: 'var(--ink)',
        padding: '20px clamp(16px, 3vw, 40px) 60px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 16,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginBottom: 18,
        }}
      >
        <strong>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Progress-bakeoff
        </strong>
        <span style={{ color: 'var(--muted)' }}>samma data under tre kompositioner</span>
      </header>

      <Stage title="A · Rapporten — M3-huvudboken: räls-sektioner, sparkline, kompakt närvaro">
        <VariantA />
      </Stage>
      <Stage title="B · Tidskriften — hero-prognos + veckan som löptext">
        <VariantB />
      </Stage>
      <Stage title="C · Terminalen — tät mono-liggare, max data per pixel">
        <VariantC />
      </Stage>
    </div>
  )
}

function Stage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          padding: '0 2px 8px',
        }}
      >
        {title}
      </div>
      <div
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 12px 32px -18px rgba(0,0,0,0.25)',
        }}
      >
        {children}
      </div>
    </section>
  )
}

function Rail({ meta, title, children }: { meta: ReactNode; title?: string; children: ReactNode }) {
  return (
    <section className="hpc-m3-section">
      <hr className="hpc-m3-rule" />
      <div className="hpc-m3-row">
        <div className="hpc-m3-meta">{meta}</div>
        <div className="hpc-m3-spine" />
        <div className="hpc-m3-content">
          {title && <h2 className="hpc-m3-h">{title}</h2>}
          {children}
        </div>
      </div>
    </section>
  )
}

const mono11: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  color: 'var(--muted)',
  fontVariantNumeric: 'tabular-nums',
}

// ── Shared pieces ──────────────────────────────────────────────────

function Sparkline({ width = 420, height = 72 }: { width?: number; height?: number }) {
  const min = 0.9
  const max = 2.0
  const x = (i: number) => (i / (WEEKS.length - 1)) * width
  const y = (v: number) => height - ((v - min) / (max - min)) * height
  const path = WEEKS.map(
    (v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`,
  ).join(' ')
  return (
    <svg
      width={width}
      height={height}
      style={{ maxWidth: '100%', display: 'block' }}
      role="img"
      aria-label="Prognos per vecka mot målet 1,8"
    >
      <line
        x1={0}
        y1={y(GOAL)}
        x2={width}
        y2={y(GOAL)}
        stroke="var(--hairline)"
        strokeDasharray="4 4"
      />
      <text
        x={width - 4}
        y={y(GOAL) - 5}
        textAnchor="end"
        fontSize="10"
        fill="var(--muted-2)"
        fontFamily="var(--font-mono)"
      >
        mål 1,8
      </text>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth={1.75} />
      <circle cx={x(WEEKS.length - 1)} cy={y(WEEKS[WEEKS.length - 1])} r={3} fill="var(--accent)" />
    </svg>
  )
}

function HeatStrip({ cell = 9 }: { cell?: number }) {
  const shade = ['var(--hairline-2)', 'oklch(0.85 0.05 195)', 'oklch(0.7 0.1 195)', 'var(--accent)']
  return (
    <div style={{ display: 'flex', gap: 3 }} aria-hidden>
      {HEAT.map((week, w) => (
        <div key={`w${String(w)}`} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {week.map((v, d) => (
            <div
              key={`w${String(w)}d${String(d)}`}
              style={{ width: cell, height: cell, background: shade[v], borderRadius: 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── A · Rapporten ──────────────────────────────────────────────────

function VariantA() {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 40, paddingBottom: 48 }}>
      <Rail
        meta={
          <>
            <strong>Framsteg</strong>113 dagar kvar
          </>
        }
      >
        <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
          1,41<span style={{ fontSize: '0.45em', color: 'var(--muted)' }}> av 2,0</span>
        </h1>
        <div className="hpc-m3-stats">
          <div>
            <div className="hpc-m3-stat-n">1,39</div>
            <div className="hpc-m3-stat-l">verbal</div>
          </div>
          <div>
            <div className="hpc-m3-stat-n">1,43</div>
            <div className="hpc-m3-stat-l">kvant</div>
          </div>
          <div>
            <div className="hpc-m3-stat-n">+0,1</div>
            <div className="hpc-m3-stat-l">sedan förra veckan</div>
          </div>
          <div>
            <div className="hpc-m3-stat-n">14</div>
            <div className="hpc-m3-stat-l">dagar i rad</div>
          </div>
        </div>
      </Rail>

      <Rail
        meta={
          <>
            <strong>12 v</strong>mot 1,8
          </>
        }
        title="Prognos över tid"
      >
        <Sparkline />
      </Rail>

      <Rail meta="Sektioner" title="Var poängen finns">
        <div>
          {SECTIONS.map((s) => (
            <div className="hpc-m3-trap" key={s.key}>
              <span className="hpc-m3-trap-t">
                <span className="hpc-m3-tag">{s.key}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
                  {s.score}
                </span>
                <span style={{ ...mono11, marginLeft: 8 }}>{s.band}</span>
                <span
                  style={{
                    marginLeft: 10,
                    color: s.trend === '↘' ? 'var(--bad)' : 'var(--ink-2)',
                    fontSize: 13,
                  }}
                >
                  {s.trend}
                </span>
              </span>
              <span className="hpc-m3-trap-n">
                {s.attempts} försök · {s.conf}
              </span>
            </div>
          ))}
        </div>
      </Rail>

      <Rail meta="Närvaro" title="Senaste 12 veckorna">
        <HeatStrip />
        <p style={{ ...mono11, marginTop: 10 }}>aktuell serie: 14 dagar (rekord 21)</p>
      </Rail>

      <Rail meta="Fokus">
        <div className="hpc-m3-plan-item">
          <span className="hpc-m3-plan-n">1.</span>
          <div>
            <div className="hpc-m3-plan-t">
              <span className="hpc-m3-tag">DTK</span>
              Lägsta sektionen · 1,12 och på väg ner
            </div>
            <div className="hpc-m3-plan-r">
              51 försök räcker för att lita på signalen — diagramvanan kommer med volym.
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: 6,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              öva dtk →
            </span>
          </div>
          <span className="hpc-m3-plan-min">~8 min</span>
        </div>
      </Rail>
    </div>
  )
}

// ── B · Tidskriften ────────────────────────────────────────────────

function VariantB() {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 40, paddingBottom: 48 }}>
      <Rail
        meta={
          <>
            <strong>Framsteg</strong>vecka 27
          </>
        }
      >
        <h1 className="hpc-m3-display" style={{ marginTop: 0, fontSize: 'clamp(56px, 8vw, 84px)' }}>
          1,41<span style={{ fontSize: '0.4em', color: 'var(--muted)' }}> av 2,0</span>
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 17,
            lineHeight: 1.6,
            color: 'var(--ink-2)',
            maxWidth: '58ch',
            margin: '10px 0 0',
          }}
        >
          Prognosen steg <strong style={{ color: 'var(--ink)' }}>+0,1</strong> den här veckan — 62
          frågor med 74 % träffsäkerhet, fjortonde dagen i rad. Kvant (
          <strong style={{ color: 'var(--ink)' }}>1,43</strong>) drar ifrån verbal (
          <strong style={{ color: 'var(--ink)' }}>1,39</strong>); gapet ner till målet 1,8 bärs
          nästan helt av <strong style={{ color: 'var(--ink)' }}>DTK 1,12</strong> och{' '}
          <strong style={{ color: 'var(--ink)' }}>ELF 1,21</strong>.
        </p>
      </Rail>

      <Rail
        meta={
          <>
            <strong>12 v</strong>mot 1,8
          </>
        }
      >
        <Sparkline width={560} height={84} />
      </Rail>

      <Rail meta="Sektioner">
        <div style={{ columns: 2, columnGap: 48 }}>
          {SECTIONS.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                padding: '9px 0',
                borderBottom: '1px solid var(--hairline-2)',
                breakInside: 'avoid',
              }}
            >
              <span className="hpc-m3-tag">{s.key}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500 }}>
                {s.score}
              </span>
              <span style={{ ...mono11, marginLeft: 8 }}>{s.trend}</span>
            </div>
          ))}
        </div>
        <p style={{ ...mono11, marginTop: 14 }}>
          fokus:{' '}
          <span
            style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            öva dtk →
          </span>
        </p>
      </Rail>
    </div>
  )
}

// ── C · Terminalen ─────────────────────────────────────────────────

function VariantC() {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 40, paddingBottom: 48 }}>
      <Rail
        meta={
          <>
            <strong>Framsteg</strong>v27 · 113 d
          </>
        }
      >
        <h1 className="hpc-m3-display" style={{ marginTop: 0, fontSize: 44 }}>
          Läget.
        </h1>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12.5,
            lineHeight: 2.1,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--ink-2)',
            marginTop: 12,
          }}
        >
          <div>
            prognos <b style={{ color: 'var(--ink)' }}>1,41</b> / 2,0 · verbal 1,39 · kvant 1,43 ·{' '}
            <span style={{ color: 'var(--ok)' }}>+0,1 v/v</span>
          </div>
          <div>vecka 27: 62 frågor · 74 % rätt · serie 14 d (rekord 21) · repetition 3 i kö</div>
        </div>
        <div style={{ margin: '18px 0 0' }}>
          <Sparkline width={640} height={64} />
        </div>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: 22,
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          <thead>
            <tr
              style={{
                color: 'var(--muted)',
                textAlign: 'left',
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              <th style={{ padding: '4px 0', fontWeight: 400 }}>sektion</th>
              <th style={{ fontWeight: 400 }}>poäng</th>
              <th style={{ fontWeight: 400 }}>±</th>
              <th style={{ fontWeight: 400 }}>trend</th>
              <th style={{ fontWeight: 400 }}>försök</th>
              <th style={{ fontWeight: 400 }}>tillit</th>
              <th style={{ fontWeight: 400 }} />
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((s) => (
              <tr
                key={s.key}
                style={{ borderTop: '1px solid var(--hairline-2)', color: 'var(--ink)' }}
              >
                <td style={{ padding: '7px 0' }}>{s.key}</td>
                <td style={{ fontWeight: 600 }}>{s.score}</td>
                <td style={{ color: 'var(--muted)' }}>{s.band}</td>
                <td style={{ color: s.trend === '↘' ? 'var(--bad)' : 'var(--ink-2)' }}>
                  {s.trend}
                </td>
                <td style={{ color: 'var(--muted)' }}>{s.attempts}</td>
                <td style={{ color: 'var(--muted)' }}>{s.conf}</td>
                <td
                  style={{
                    color: 'var(--accent)',
                    textAlign: 'right',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    fontSize: 10,
                  }}
                >
                  öva →
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 22 }}>
          <HeatStrip cell={7} />
        </div>
      </Rail>
    </div>
  )
}
