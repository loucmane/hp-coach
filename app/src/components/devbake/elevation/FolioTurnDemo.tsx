// FolioTurnDemo — the SIGNATURE interaction from Specialist B's plan.
//
// A live preview of the page-turn motion between routes. Click the
// button and watch one "spread" leave (rolls 0.5° + 12px right while
// losing 8% opacity) while the next "spread" mirrors in from the
// opposite side. 320ms reading-curve.
//
// Mock content: a Home-shaped spread and a Lektion-shaped spread,
// rendered at small artboard scale so the user can see the choreography
// without being distracted by the per-surface chrome. The point is
// the motion, not the content.
//
// Gated on prefers-reduced-motion via CSS @media — if disabled, the
// "page-turn" becomes an instant swap with no rotation/opacity dance.

import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'

import { Btn, Eyebrow, Mono } from '@/components/primitives'

const SPREADS = [
  {
    edition: 'EDITION III',
    number: 'SPREAD 03',
    section: 'HEM',
    eyebrow: 'Måndag · 26 maj',
    headline: 'God morgon.',
    body: 'XYZ-drill · 10 frågor. ORD-repetition · 8 missar. ~14 min.',
  },
  {
    edition: 'EDITION III',
    number: 'SPREAD 04',
    section: 'LEKTION · KVA',
    eyebrow: '14 mönster · ~9 min läsning',
    headline: 'KVA',
    body: 'Kvantitativa jämförelser — kvadrat-likhet låser inte tecken.',
  },
  {
    edition: 'EDITION III',
    number: 'SPREAD 05',
    section: 'ÖVNING · XYZ',
    eyebrow: 'Fråga 03 av 10',
    headline: 'XYZ-001',
    body: 'Om x² − 4x + 4 = 0, vilket av följande är värdet av x?',
  },
  {
    edition: 'EDITION III',
    number: 'SPREAD 12',
    section: 'KLAR',
    eyebrow: 'Pass slut · 12 min',
    headline: 'Klart.',
    body: 'FÄLLA · Stacked-fraction inversion. KVA · 1.86 → 1.89.',
  },
]

export function FolioTurnDemo() {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const spread = SPREADS[index]

  const advance = () => {
    setDirection(1)
    setIndex((i) => (i + 1) % SPREADS.length)
  }
  const back = () => {
    setDirection(-1)
    setIndex((i) => (i - 1 + SPREADS.length) % SPREADS.length)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 360,
          background: 'var(--bg)',
          border: '1px solid var(--hairline)',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          perspective: 1200,
        }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={spread.number}
            custom={direction}
            initial={{ opacity: 0, x: direction * 24, rotateZ: direction * 0.5 }}
            animate={{ opacity: 1, x: 0, rotateZ: 0 }}
            exit={{ opacity: 0.92, x: direction * -12, rotateZ: direction * -0.5 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              padding: 'clamp(20px, 3vw + 12px, 36px)',
              display: 'flex',
              flexDirection: 'column',
              transformOrigin: direction > 0 ? 'left center' : 'right center',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                ⌜ {spread.edition} · {spread.number} · {spread.section}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                pp. {String(index + 1).padStart(2, '0')} / {String(SPREADS.length).padStart(2, '0')}
              </span>
            </div>

            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 18,
              }}
            >
              <Eyebrow>{spread.eyebrow}</Eyebrow>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 500,
                  fontSize: 'clamp(48px, 6vw, 88px)',
                  lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'var(--ink)',
                }}
              >
                {spread.headline}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: 'var(--ink-2)',
                  maxWidth: '48ch',
                }}
              >
                {spread.body}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
      >
        <Mono>klicka för att vända sidan — esc · ↑↓ · ⌘+;</Mono>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" size="md" onClick={back}>
            ← föregående spread
          </Btn>
          <Btn size="md" onClick={advance}>
            nästa spread →
          </Btn>
        </div>
      </div>
    </div>
  )
}
