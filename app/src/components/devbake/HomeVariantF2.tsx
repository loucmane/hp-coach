// HomeVariantF2 — FACING-PAGE TRAP (Design lead's pick).
//
// The page reads as an open book spread. Left = today's agenda; right
// = today's reading — one trap from the user's active queue rendered
// as a full editorial entry. Mono trap ID, Display 4 serif statement,
// 3-4 lines of editorial body explaining why it keeps catching, a
// PullQuote lifting the operative phrase, and a mono Folio at the
// bottom.
//
// The demoted trap strip on the left then re-reads as a "see also"
// table of contents pointing at the entry on the right.
//
// Activates three benched primitives — Sidebar pattern, PullQuote,
// Marginalia — that exist in the kit but aren't used anywhere in
// product today.

import { PullQuote } from '@/components/Typography'
import { BLeftColumn } from './HomeRound2Shared'

export function HomeVariantF2() {
  return (
    <div
      style={{
        background: 'var(--bg)',
        border: '1px solid var(--hairline)',
        display: 'grid',
        gridTemplateColumns: '58fr 42fr',
        gap: 'clamp(48px, 5vw, 88px)',
        color: 'var(--ink)',
        minHeight: 720,
      }}
    >
      <BLeftColumn />
      <TrapEntry />
    </div>
  )
}

function TrapEntry() {
  return (
    <article
      style={{
        padding: 'clamp(40px, 5vh, 72px) 32px 56px 0',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
      }}
    >
      {/* Mono trap ID — small caps, ink-2. Reads as a journal entry's
       *  catalog number. */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        XYZ-TRAP-016
      </div>

      <div style={{ height: 18 }} />

      {/* 96px hairline rule — single articulator above the headline.
       *  Matches the demoted trap strip's hairline language on the
       *  left so the two halves rhyme. */}
      <div
        style={{
          width: 96,
          height: 1,
          background: 'var(--ink)',
        }}
      />

      <div style={{ height: 20 }} />

      {/* Display 4 serif headline — the trap's main statement. At
       *  20px / lh 1.2 it's the right side's section opener without
       *  competing with the Display 2 greeting (44px) on the left. */}
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontWeight: 500,
          fontSize: 'clamp(22px, 1.4vw + 14px, 28px)',
          lineHeight: 1.2,
          letterSpacing: '-0.012em',
          color: 'var(--ink)',
        }}
      >
        Bråkaddition kräver gemensam nämnare innan täljarna får adderas.
      </h2>

      <div style={{ height: 20 }} />

      {/* BodyEditorial — 17/1.55 reading prose. Three sentences max;
       *  more than that and it stops being a glance, becomes a
       *  monologue. */}
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 17,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        Du har missat det här mönstret tre gånger denna vecka — alltid samma fel: täljarna adderas
        innan nämnaren matchas. Nämnaren är inte ett tal du räknar fram, den är ett villkor:{' '}
        <span style={{ color: 'var(--ink)' }}>1/3 + 1/4 är inte 2/7</span>, för 1/3 och 1/4 mäter
        olika saker. Skapa först en gemensam nämnare (12), sen är additionen mekanisk.
      </p>

      <div style={{ height: 24 }} />

      {/* PullQuote — italic editorial pull. The operative phrase
       *  lifted from the body, set as the reading takeaway. */}
      <PullQuote style={{ maxWidth: '28ch' }}>
        » Addera aldrig täljare och nämnare var för sig. «
      </PullQuote>

      <div style={{ flex: 1, minHeight: 32 }} />

      {/* Folio — mono date stamp anchored bottom-right. Reads as a
       *  printed page's running foot. */}
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontVariantNumeric: 'tabular-nums',
          marginTop: 'auto',
        }}
      >
        Ur fällregistret · 28 maj 2026
      </div>
    </article>
  )
}
