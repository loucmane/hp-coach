// /nav-bakeoff — 2026 navigation treatments on the real M3 page.
//
// The owner flagged the shipped minimal mast as signifier-weak ("some of
// these options need to be more obvious"). Three candidate treatments,
// each rendered as chrome around the SAME faithful home-page snippet so
// the judgement is apples-to-apples:
//
//   A · MAST, AMPLIFIED   the shipped band, but nav at readable size
//                          with ink default, hover/active underlines and
//                          the primary action as an accent CTA
//   B · NAV RAIL          a Linear-class persistent left rail speaking
//                          the product's own margin-rail language —
//                          cobalt mono labels down the left edge,
//                          settings anchored at the bottom
//   C · EDITORIAL TABS    newspaper section tabs — display serif at
//                          17px with a thick active underline (FT/NYT
//                          register)
//
// Dev-gated. The winner replaces/extends MinimalMast (Page.tsx).

import { createFileRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/nav-bakeoff')({
  component: NavBakeoff,
})

const NAV = ['Hem', 'Övning', 'Lektion', 'Framsteg'] as const
const ACTIVE = 'Hem'

function NavBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /nav-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
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
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Nav-bakeoff
        </strong>
        <span style={{ color: 'var(--muted)' }}>
          tre 2026-behandlingar · samma sida under varje
        </span>
      </header>

      <Stage title="A · Mast, amplifierad — samma band, riktiga signifiers + primär-CTA">
        <ChromeA />
        <PageSnippet />
      </Stage>

      <Stage title="B · Navigationsräls — produktens egen marginal-räls som Linear-klass sidebar">
        <div style={{ display: 'grid', gridTemplateColumns: '196px 1fr', minHeight: 520 }}>
          <ChromeB />
          <div>
            <PageSnippet railless />
          </div>
        </div>
      </Stage>

      <Stage title="C · Redaktionella flikar — tidningens sektionsflikar, serif + tjock aktiv-linje">
        <ChromeC />
        <PageSnippet />
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

// ── A · The shipped mast with real affordance ──────────────────────

function ChromeA() {
  return (
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '14px clamp(24px, 4vw, 56px) 12px',
        borderBottom: '1px solid var(--hairline)',
        gap: 24,
      }}
    >
      <Brand />
      <nav style={{ display: 'flex', alignItems: 'baseline', gap: 26, flex: 1 }}>
        {NAV.map((label) => (
          <span
            key={label}
            className={label === ACTIVE ? undefined : 'hpc-navA'}
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: 14,
              fontWeight: label === ACTIVE ? 600 : 450,
              color: 'var(--ink)',
              cursor: 'pointer',
              paddingBottom: 3,
              borderBottom: label === ACTIVE ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            {label}
          </span>
        ))}
      </nav>
      <button
        type="button"
        style={{
          all: 'unset',
          cursor: 'pointer',
          fontFamily: 'var(--font-ui)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--accent-ink)',
          background: 'var(--accent)',
          padding: '9px 18px',
        }}
      >
        Fortsätt övning →
      </button>
      <MoreWord />
    </header>
  )
}

// ── B · The nav rail (margin-rail language, Linear-class job) ──────

function ChromeB() {
  return (
    <aside
      style={{
        borderRight: '1px solid var(--hairline)',
        padding: '22px 0 18px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100%',
      }}
    >
      <div style={{ padding: '0 20px 26px' }}>
        <Brand />
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column' }}>
        {NAV.map((label) => {
          const active = label === ACTIVE
          return (
            <span
              key={label}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
                padding: '11px 20px',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                cursor: 'pointer',
              }}
            >
              {label}
            </span>
          )
        })}
      </nav>
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: '14px 20px 0',
          borderTop: '1px solid var(--hairline-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span style={railWord}>ljus ◐</span>
        <span style={railWord}>mer →</span>
      </div>
    </aside>
  )
}

const railWord: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--muted-2)',
  cursor: 'pointer',
}

// ── C · Editorial section tabs ─────────────────────────────────────

function ChromeC() {
  return (
    <header style={{ borderBottom: '1px solid var(--ink)' }}>
      <div style={{ padding: '16px clamp(24px, 4vw, 56px) 6px' }}>
        <Brand />
      </div>
      <nav
        style={{
          display: 'flex',
          gap: 34,
          padding: '4px clamp(24px, 4vw, 56px) 0',
        }}
      >
        {NAV.map((label) => {
          const active = label === ACTIVE
          return (
            <span
              key={label}
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 17,
                fontWeight: active ? 600 : 400,
                color: active ? 'var(--ink)' : 'var(--ink-2)',
                paddingBottom: 10,
                borderBottom: active ? '3px solid var(--accent)' : '3px solid transparent',
                cursor: 'pointer',
              }}
            >
              {label}
            </span>
          )
        })}
        <span style={{ flex: 1 }} />
        <span style={{ ...railWord, alignSelf: 'center', paddingBottom: 10 }}>ljus ◐ · mer</span>
      </nav>
    </header>
  )
}

// ── Shared bits ────────────────────────────────────────────────────

function Brand() {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontStyle: 'italic',
        fontWeight: 600,
        fontSize: 17,
        color: 'var(--ink)',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--muted-2)', fontStyle: 'normal', marginRight: 5 }}>⌜</span>
      HP-Coach
    </span>
  )
}

function MoreWord() {
  return <span style={railWord}>ljus ◐ · mer</span>
}

/** A faithful static snippet of the M3 home so each chrome is judged
 *  against real content. `railless` drops the page's own margin rail
 *  (variant B's nav rail replaces that column's weight on the left). */
function PageSnippet({ railless = false }: { railless?: boolean }) {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 34, paddingBottom: 44 }}>
      <section className="hpc-m3-section">
        <hr className="hpc-m3-rule" />
        <div className="hpc-m3-row" style={railless ? { gridTemplateColumns: '1fr' } : undefined}>
          {!railless && (
            <>
              <div className="hpc-m3-meta">
                <strong>Fredag 3 juli</strong>114 dagar
              </div>
              <div className="hpc-m3-spine" />
            </>
          )}
          <div className="hpc-m3-content">
            <h1 className="hpc-m3-display" style={{ fontSize: 44 }}>
              God kväll.
            </h1>
            <div className="hpc-m3-stats">
              <div>
                <div className="hpc-m3-stat-n">1,4</div>
                <div className="hpc-m3-stat-l">prognos av 2,0</div>
              </div>
              <div>
                <div className="hpc-m3-stat-n">12</div>
                <div className="hpc-m3-stat-l">dagar i rad</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="hpc-m3-section">
        <hr className="hpc-m3-rule" />
        <div className="hpc-m3-row" style={railless ? { gridTemplateColumns: '1fr' } : undefined}>
          {!railless && (
            <>
              <div className="hpc-m3-meta">
                <strong>Idag</strong>~16 min
              </div>
              <div className="hpc-m3-spine" />
            </>
          )}
          <div className="hpc-m3-content">
            <h2 className="hpc-m3-h">Dagens plan</h2>
            <div className="hpc-m3-plan-item">
              <span className="hpc-m3-plan-n">1.</span>
              <div>
                <div className="hpc-m3-plan-t">Repetition · 3 missar</div>
                <div className="hpc-m3-plan-r">
                  Gör dem först — de förlorar effekt om de väntar.
                </div>
              </div>
              <span className="hpc-m3-plan-min">~3 min</span>
            </div>
            <div className="hpc-m3-plan-item">
              <span className="hpc-m3-plan-n">2.</span>
              <div>
                <div className="hpc-m3-plan-t">
                  <span className="hpc-m3-tag">KVA</span>KVA-övning · 10 frågor
                </div>
                <div className="hpc-m3-plan-r">KVA-resultat har trendat nedåt.</div>
              </div>
              <span className="hpc-m3-plan-min">~6 min</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
