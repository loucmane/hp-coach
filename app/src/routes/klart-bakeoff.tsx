// /klart-bakeoff — three compositions for the "Klart." end-of-session
// payoff (task #161). No M3 reference screen exists for it, so the
// owner ratifies the target here before the rebuild. Same fixture data
// (10 questions, 3 misses, a named trap cluster, 1,42 → 1,47) under
// each candidate:
//
//   A · BOKSLUT     the ledger — Klart. display, stats row, misses as
//                   M3 rows under 'Att repetera imorgon', quiet CTAs
//   B · DOMEN       verdict-first — the graded page's language turned
//                   on the whole session: big italic score-word, the
//                   ONE takeaway (the trap cluster) as verdict-sub,
//                   ONE accent action ('Repetera 3 missar nu')
//   C · FACIT       the answer-key spread — all 10 rows marked ✓/✗
//                   like checking your prov against facit, payoff coda
//
// Dev-gated. Winner becomes the DrillResult rebuild.

import { createFileRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/klart-bakeoff')({
  component: KlartBakeoff,
})

// ── Fixture — one realistic KVA pass ───────────────────────────────

const RESULTS = [
  { n: 1, stem: 'Kvantitet I: x² · Kvantitet II: 2x', pick: 'd', answer: 'd', ok: true },
  { n: 2, stem: 'Längden av hypotenusan i triangeln ABC', pick: 'a', answer: 'a', ok: true },
  { n: 3, stem: 'Kvantitet I: √5 + 1 · Kvantitet II: √6', pick: 'b', answer: 'a', ok: false },
  {
    n: 4,
    stem: 'Medelvärdet av fem på varandra följande heltal',
    pick: 'c',
    answer: 'c',
    ok: true,
  },
  {
    n: 5,
    stem: 'Kvantitet I: (200 − 300)² · Kvantitet II: 101²',
    pick: 'a',
    answer: 'b',
    ok: false,
  },
  { n: 6, stem: 'Arean av en cirkel med omkretsen 6π', pick: 'e', answer: 'e', ok: true },
  { n: 7, stem: 'Kvantitet I: 4ⁿ för n = 3 · Kvantitet II: 2²ⁿ', pick: 'c', answer: 'c', ok: true },
  { n: 8, stem: 'x + y = 12 och x − y = 4', pick: 'b', answer: 'b', ok: true },
  {
    n: 9,
    stem: 'Kvantitet I: 0,3 av 90 · Kvantitet II: 90 % av 30',
    pick: 'a',
    answer: 'c',
    ok: false,
  },
  { n: 10, stem: 'Sannolikheten att få två sexor i rad', pick: 'd', answer: 'd', ok: true },
] as const

const MISSES = RESULTS.filter((r) => !r.ok)
const CLUSTER = 'Kvadratlikhet låser inte tecknet — x² = y² öppnar både x = y och x = −y.'

// ── Route ──────────────────────────────────────────────────────────

function KlartBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        /klart-bakeoff is a dev-only surface. Append <code>?dev=1</code> to opt in.
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
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Klart-bakeoff
        </strong>
        <span style={{ color: 'var(--muted)' }}>
          samma pass (KVA · 7 av 10) under tre kompositioner
        </span>
      </header>

      <Stage title="A · Bokslut — läget, missarna, imorgon">
        <VariantA />
      </Stage>
      <Stage title="B · Domen — EN slutsats, EN handling (verdikt-språket från övningssidan)">
        <VariantB />
      </Stage>
      <Stage title="C · Facit — hela uppslaget rättat, som mot ett riktigt prov">
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

// ── Shared M3 bits ─────────────────────────────────────────────────

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

const ctaStyle: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-ui)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--accent-ink)',
  background: 'var(--accent)',
  padding: '10px 20px',
  whiteSpace: 'nowrap',
}

const quietCta: CSSProperties = {
  all: 'unset',
  cursor: 'pointer',
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--muted-2)',
}

function CtaRow({ primary }: { primary: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 32 }}>
      <button type="button" style={ctaStyle}>
        {primary}
      </button>
      <span style={quietCta}>öva igen</span>
      <span style={quietCta}>esc hem</span>
    </div>
  )
}

// ── A · Bokslut ────────────────────────────────────────────────────

function VariantA() {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 40, paddingBottom: 48 }}>
      <Rail
        meta={
          <>
            <strong>KVA</strong>pass slut
          </>
        }
      >
        <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
          Klart.
        </h1>
        <div className="hpc-m3-stats">
          <div>
            <div className="hpc-m3-stat-n">7 av 10</div>
            <div className="hpc-m3-stat-l">rätt</div>
          </div>
          <div>
            <div className="hpc-m3-stat-n">1,47</div>
            <div className="hpc-m3-stat-l">KVA-prognos</div>
            <div className="hpc-m3-stat-d">+0,05 detta pass</div>
          </div>
          <div>
            <div className="hpc-m3-stat-n">9</div>
            <div className="hpc-m3-stat-l">min</div>
          </div>
        </div>
      </Rail>

      <Rail meta={<>{MISSES.length} missar</>} title="Att repetera imorgon">
        <div>
          {MISSES.map((m) => (
            <div className="hpc-m3-trap" key={m.n}>
              <span className="hpc-m3-trap-t">
                <span className="hpc-m3-tag">fråga {m.n}</span>
                {m.stem}
              </span>
              <span className="hpc-m3-trap-n">
                ditt {m.pick}) · rätt {m.answer})
              </span>
            </div>
          ))}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            margin: '18px 0 0',
            maxWidth: '60ch',
          }}
        >
          De landar i repetitionskön — schemat lägger dem först i morgondagens plan.
        </p>
        <CtaRow primary="Stäng" />
      </Rail>
    </div>
  )
}

// ── B · Domen ──────────────────────────────────────────────────────

function VariantB() {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 40, paddingBottom: 48 }}>
      <Rail
        meta={
          <>
            <strong>KVA</strong>pass slut
          </>
        }
      >
        <div className="hpc-m3-verdict">
          <span className="hpc-m3-verdict-word" style={{ color: 'var(--ink)' }}>
            7 av 10.
          </span>
          <p className="hpc-m3-verdict-sub">
            Två av tre missar var samma fälla — <em>{CLUSTER}</em> Den är värd fem minuter nu, medan
            den svider.
          </p>
        </div>
        <div className="hpc-m3-stats" style={{ marginTop: 22 }}>
          <div>
            <div className="hpc-m3-stat-n">1,47</div>
            <div className="hpc-m3-stat-l">KVA-prognos</div>
            <div className="hpc-m3-stat-d">+0,05 detta pass</div>
          </div>
          <div>
            <div className="hpc-m3-stat-n">3</div>
            <div className="hpc-m3-stat-l">i repetitionskön</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 30 }}>
          <button type="button" style={ctaStyle}>
            Öva fällan nu · ~5 min
          </button>
          <span style={quietCta}>imorgon istället</span>
          <span style={quietCta}>esc hem</span>
        </div>
      </Rail>

      <Rail meta={<>{MISSES.length} missar</>}>
        <div>
          {MISSES.map((m) => (
            <div className="hpc-m3-trap" key={m.n}>
              <span className="hpc-m3-trap-t" style={{ color: 'var(--ink-2)' }}>
                {m.stem}
              </span>
              <span className="hpc-m3-trap-n">
                ditt {m.pick}) · rätt {m.answer})
              </span>
            </div>
          ))}
        </div>
      </Rail>
    </div>
  )
}

// ── C · Facit ──────────────────────────────────────────────────────

function VariantC() {
  return (
    <div className="hpc-m3-frame" style={{ paddingTop: 40, paddingBottom: 48 }}>
      <Rail
        meta={
          <>
            <strong>KVA</strong>7 / 10 · 9 min
          </>
        }
      >
        <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
          Klart.
        </h1>
        <p className="hpc-m3-verdict-sub" style={{ marginTop: 8 }}>
          KVA-prognos 1,42 → <strong>1,47</strong>. Tre missar går till repetition.
        </p>
      </Rail>

      <Rail meta={<>Facit</>} title="Hela passet">
        <div>
          {RESULTS.map((r) => (
            <div
              key={r.n}
              style={{
                display: 'grid',
                gridTemplateColumns: '22px 30px 1fr auto',
                gap: 12,
                alignItems: 'baseline',
                padding: '10px 0',
                borderBottom: '1px solid var(--hairline-2)',
              }}
            >
              <span
                aria-hidden
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: r.ok ? 'var(--ok)' : 'var(--bad)',
                  fontWeight: 700,
                }}
              >
                {r.ok ? '✓' : '✗'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--muted-2)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {r.n}.
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 14.5,
                  color: r.ok ? 'var(--ink-2)' : 'var(--ink)',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.stem}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: r.ok ? 'var(--muted-2)' : 'var(--bad)',
                  fontVariantNumeric: 'tabular-nums',
                  whiteSpace: 'nowrap',
                }}
              >
                {r.ok ? `${r.answer})` : `ditt ${r.pick}) · rätt ${r.answer})`}
              </span>
            </div>
          ))}
        </div>
      </Rail>

      <Rail meta={<>Imorgon</>}>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            margin: 0,
            maxWidth: '60ch',
          }}
        >
          Att repetera imorgon: 3 frågor · ~4 min. Fällan bakom två av dem:{' '}
          <span style={{ color: 'var(--ink)' }}>{CLUSTER}</span>
        </p>
        <CtaRow primary="Stäng" />
      </Rail>
    </div>
  )
}
