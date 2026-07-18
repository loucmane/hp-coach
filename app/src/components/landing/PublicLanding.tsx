// PublicLanding — the public front door at `/` for logged-out visitors.
//
// Productionization of the owner-ratified bake-off winner: V5A "Frågan
// under datumet" WITH the facit graft (components/devbake/
// LandingBakeoffR5A.tsx — kept untouched as the historical reference).
// Every visual/copy/motion decision here is the approved design; changes
// from the bake-off file are wiring only:
//
//   · Prov date from config (lib/provdatum.ts) instead of hard-coded
//     strings. If no future date is configured, the dated pieces (the
//     dateline's date, the countdown, station/ledger dates) degrade
//     gracefully — never a negative countdown.
//   · Reduced-motion contract fix (V4B-inherited): dispatchFirstContent
//     fires BEFORE the reduced-motion early return, so the boot veil
//     lifts on the content signal in both modes; everything settles in
//     its final state on first paint under reduced motion.
//   · Shared pieces live in ./chrome, ./Genomgang, ./copy; the R3 beat
//     engine and R4A content module are imported as-is via Genomgang.
//
// Structure (Akt I / Akt II): dateline countdown → struck facit →
// poster-scale vederhäftig title page; below, dated timeline stations
// (IKVÄLL → I MORGON → OM TRE DAGAR → DITT SCHEMA → VECKAN FÖRE PROVET
// → PROVDAGEN) with full genomgångar that collapse to receipts, and the
// four-station CTA system.

import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Q1_HERO, Q2_KVA, Q3_MEK } from '@/components/devbake/LandingBakeoffR4A.content'
import { dispatchFirstContent, EASE, KeepInView, useArketMotion } from '@/lib/motion'
import { getProvdatum, type Provdatum } from '@/lib/provdatum'
import { Cta, Ink, LANDING_BASE_CSS, PriceBlock, QuietCta, StickyCta, useStickyCta } from './chrome'
import { COPY, FACIT_ROW, SCHED_CADENCE, type SchedEntry } from './copy'
import { GenDemo, GenStage, Receipt, SCHED_LABELS } from './Genomgang'

/* ── landing-local styles (layout only; color/type from live tokens) ──── */

const LANDING_PAGE_CSS = `
/* ── Akt I — the title page under its dateline ── */
.hpl-hero {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  padding: 16px 20px 22px;
  box-sizing: border-box;
}
.hpl-hero-brand {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}
/* the dateline — the page's clock, at the head where a print date lives */
.hpl-dateline {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--accent);
  text-align: center;
  margin: 26px 0 0;
}
/* the one LIVING element: the count, spliced in display italic on its
   own line — a set dateline over a ticking counter */
.hpl-dateline .count {
  display: block;
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: 22px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  text-transform: none;
  color: var(--ink);
  margin-top: 3px;
  white-space: nowrap;
}
/* the struck facit — the exam's only reply, crossed out before the
   question begins */
.hpl-facit-l {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
  margin: 24px 0 0;
}
.hpl-facit {
  position: relative;
  display: block;
  width: fit-content;
  margin: 9px auto 0;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  letter-spacing: 0.14em;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
/* the corrector's stroke — the one non-orthogonal line the title page
   allows. Static rotate on the wrapper; motion animates scaleX inside. */
.hpl-strike-wrap {
  position: absolute;
  left: -6px;
  right: -6px;
  top: 50%;
  margin-top: -1px;
  transform: rotate(-3deg);
  pointer-events: none;
}
.hpl-strike {
  height: 2px;
  background: var(--bad);
  transform-origin: left center;
}
.hpl-facit-cap {
  font-family: var(--font-mono);
  font-size: 10.5px;
  line-height: 1.6;
  letter-spacing: 0.07em;
  color: var(--muted);
  text-align: center;
  margin: 8px auto 0;
}
.hpl-facit-cap .disclose { display: block; margin-top: 1px; }
.hpl-hero-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  max-width: 640px;
  margin: 0 auto;
  padding: 30px 0 26px;
}
.hpl-kicker {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: center;
  margin: 0;
  white-space: nowrap;
}
@media (max-width: 359px) {
  .hpl-kicker { white-space: normal; }
}
.hpl-headword {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 400;
  font-size: clamp(56px, 16.5vw, 132px);
  line-height: 1;
  color: var(--ink);
  text-align: center;
  margin: 10px 0 0;
}
.hpl-hero-rule {
  width: 72px;
  height: 1px;
  background: var(--ink);
  margin: 26px auto 0;
  transform-origin: center;
}
.hpl-hero-opts { margin-top: 22px; }
.hpl-hero-foot {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  text-align: center;
}
.hpl-framing {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 17px;
  line-height: 1.5;
  color: var(--ink-2);
  margin: 0;
}
.hpl-legal {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.07em;
  color: var(--muted);
  margin: 8px 0 0;
}

/* ── Akt II — the time spine ── */
.hpl-col {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 20px 96px;
}
.hpl-line {
  position: relative;
  padding-left: 26px;
  margin-top: 10px;
}
.hpl-spine {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--ink);
}
.hpl-stn { position: relative; margin-top: 62px; }
.hpl-stn:first-child { margin-top: 26px; }
.hpl-stn-tag {
  position: relative;
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--ink);
  margin: 0 0 16px;
}
.hpl-stn-tag::before {
  content: '';
  position: absolute;
  left: -26px;
  top: 50%;
  width: 14px;
  height: 1px;
  background: var(--ink);
}
.hpl-stn-tag em { font-style: normal; color: var(--muted); }
.hpl-thesis {
  font-family: var(--font-display);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(26px, 6.6vw, 38px);
  line-height: 1.16;
  letter-spacing: -0.015em;
  color: var(--ink);
  margin: 0;
  max-width: 19ch;
}

/* ── the genomgång stage — printer's plate chrome ── */
.hpl-stage {
  border: 1px solid var(--hairline);
  border-top: 2px solid var(--ink);
  background: var(--bg);
  margin-top: 22px;
  display: flex;
  flex-direction: column;
  height: 590px; /* FIXED — the card never grows; content swaps inside */
  overflow: hidden;
  text-align: left;
}
.hpl-stage-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--hairline);
}
.hpl-meter {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.hpl-skip {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--muted);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.hpl-skip:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.hpl-stage-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 16px 8px;
}
.hpl-stage-foot {
  padding: 12px 16px 14px;
  border-top: 1px solid var(--hairline);
  display: flex;
  justify-content: flex-end;
}
.hpl-next {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.06em;
  color: var(--ink);
  background: transparent;
  border: 1px solid var(--ink);
  border-radius: 999px;
  padding: 9px 20px;
  cursor: pointer;
}
.hpl-next:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.hpl-beat-label {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.hpl-annot {
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--accent);
  margin: 16px 0 0;
  max-width: 46ch;
}
.hpl-annot a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.hpl-din-tag {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--hairline);
  border-radius: 3px;
  padding: 2px 7px;
  margin-left: 8px;
  vertical-align: middle;
}
.hpl-din-wash {
  background: var(--bad-soft);
  border-radius: 6px;
  padding: 12px 14px;
  margin: 0 -14px;
}
.hpl-compressed .hpc-m3-dis-p { font-size: 12.5px; line-height: 1.55; }
.hpl-compressed .hpc-m3-dis-h { font-size: 14px; }
.hpl-kvitto-line {
  font-family: var(--font-mono);
  font-size: 12.5px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}

/* ── the receipt — the collapsed stage; numbered, replayable ── */
.hpl-receipt {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 22px;
  padding: 12px 14px;
  border: 1px solid var(--hairline);
  border-left: 2px solid var(--ink);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  text-align: left;
  font-variant-numeric: tabular-nums;
}
.hpl-receipt-n { color: var(--muted); }
.hpl-receipt .ok { color: var(--ok); }
.hpl-receipt .bad { color: var(--bad); }
.hpl-replay {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--accent);
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.hpl-replay:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.hpl-booked {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.05em;
  color: var(--accent);
  margin: 10px 0 0;
  text-align: left;
}

/* ── the schedule ledger — where booked mistakes land ── */
.hpl-sched { border-top: 1px solid var(--hairline); }
.hpl-sched-row {
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 10px;
  align-items: baseline;
  padding: 13px 0;
  border-bottom: 1px solid var(--hairline-2);
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.6;
  letter-spacing: 0.04em;
  color: var(--ink-2);
}
.hpl-sched-row .mark { font-size: 15px; line-height: 1; }
.hpl-sched-row .mark.ok { color: var(--ok); }
.hpl-sched-row .mark.bad { color: var(--bad); }
.hpl-sched-row em { font-style: normal; color: var(--accent); }
.hpl-sched-row.is-dest { color: var(--muted); border-bottom: 0; }
.hpl-sched-empty {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--muted);
  margin: 0;
  padding: 13px 0;
}
.hpl-sched-sum {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.05em;
  color: var(--ink-2);
  margin: 14px 0 0;
  font-variant-numeric: tabular-nums;
}
.hpl-scene {
  font-family: var(--font-display);
  font-style: italic;
  font-size: 19px;
  line-height: 1.55;
  color: var(--ink);
  margin: 0 0 26px;
  max-width: 44ch;
}

@media (min-width: 900px) {
  .hpl-hero { padding: 22px 24px 30px; }
  .hpl-stage { height: 540px; }
  .hpl-col { max-width: 720px; padding: 0 24px 120px; }
  .hpl-line { padding-left: 34px; }
  .hpl-stn-tag::before { left: -34px; width: 20px; }
  .hpl-dateline .count { font-size: 24px; }
}
`

/* ── the veil gate — the title page must settle in FRONT of the visitor.
 *    This page mounts BEHIND the boot veil, so a mount-armed sequence
 *    would finish before the curtain lifts. Fire first-content ourselves,
 *    then wait until the veil element is gone before flipping `go`.
 *    Reduced-motion contract: dispatch first-content BEFORE the early
 *    return (`go` starts true — final state on first paint). ─────────── */

function useVeilGo(rm: boolean): boolean {
  const [go, setGo] = useState(rm)
  useEffect(() => {
    // The content signal must fire in BOTH modes — the boot veil lifts on
    // it. Reduced motion skips only the choreography below.
    dispatchFirstContent()
    if (rm) return
    let raf1 = 0
    let raf2 = 0
    let iv = 0
    const arm = () => {
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setGo(true))
      })
    }
    if (!document.getElementById('boot-veil')) arm()
    else {
      iv = window.setInterval(() => {
        if (!document.getElementById('boot-veil')) {
          window.clearInterval(iv)
          iv = 0
          arm()
        }
      }, 40)
    }
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      if (iv) window.clearInterval(iv)
    }
  }, [rm])
  return go
}

/* ── a dated stop on the spine ────────────────────────────────────────── */

function Station({ tag, sub, children }: { tag: string; sub?: string; children: ReactNode }) {
  return (
    <section className="hpl-stn" aria-label={tag}>
      <p className="hpl-stn-tag">
        {tag}
        {sub && <em> · {sub}</em>}
      </p>
      {children}
    </section>
  )
}

/* ── the schedule ledger — where the booked mistakes land ─────────────── */

function SchedLedger({ entries, prov }: { entries: SchedEntry[]; prov: Provdatum | null }) {
  const m = useArketMotion()
  const okCount = entries.filter((e) => e.ok).length
  const done = entries.length === 3
  return (
    <div>
      <div className="hpl-sched" role="status" aria-label="Din repetitionskö">
        {entries.length === 0 && (
          <p className="hpl-sched-empty">
            svara på uppgifterna ovan — schemat skriver sig självt här
          </p>
        )}
        {entries.map((e) => (
          <motion.div
            key={e.id}
            className="hpl-sched-row"
            initial={m.rm ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={m.tork}
          >
            <span className={`mark ${e.ok ? 'ok' : 'bad'}`} aria-hidden>
              {e.ok ? '✓' : '✗'}
            </span>
            <span>
              {e.label}
              {e.tag && (
                <>
                  {' '}
                  · <em>{e.tag}</em>
                </>
              )}{' '}
              — {e.ok ? 'rätt · fällorna kartlagda ändå' : SCHED_CADENCE}
            </span>
          </motion.div>
        ))}
        <div className="hpl-sched-row is-dest">
          <span className="mark" aria-hidden>
            ◦
          </span>
          <span>{prov ? `${prov.short} · ` : ''}provdagen — då ska kön vara tom</span>
        </div>
      </div>
      {entries.length > 0 && (
        <p className="hpl-sched-sum">
          {okCount} av {entries.length} rätt · varje fel har blivit en post i schemat
        </p>
      )}
      {done && (
        <div className="reveal">
          <QuietCta />
        </div>
      )}
    </div>
  )
}

/* ── Akt I — the title page under its dateline ─────────────────────────── */

function TitleHero({
  go,
  prov,
  picked,
  phase,
  onPick,
  onStageDone,
  onReplay,
  playKey,
}: {
  go: boolean
  prov: Provdatum | null
  picked: string | null
  phase: 'idle' | 'playing' | 'done'
  onPick: (k: string) => void
  onStageDone: () => void
  onReplay: () => void
  playKey: number
}) {
  const m = useArketMotion()
  const q = Q1_HERO
  // The countdown line shows only with a configured future date; on the
  // exam day itself (days === 0) the date stands but the count hides.
  const showCount = prov !== null && prov.days >= 1

  return (
    <div className="hpl-hero">
      {/* the brand whisper — the only chrome above the dateline */}
      <Ink go={go} delay={0}>
        <div className="hpl-hero-brand">
          <span className="hpl-brand">{COPY.brand}</span>
          <span className="hpl-folio">{COPY.tagline}</span>
        </div>
      </Ink>

      {/* the dateline — the page's clock; the count is the one LIVING
          element, spliced in display italic and settled like the
          headword (opacity + tracking, zero travel) */}
      <Ink go={go} delay={0.14}>
        <p className="hpl-dateline">
          Högskoleprovet{prov ? ` · ${prov.label}` : ''}
          {showCount && (
            <motion.span
              className="count"
              initial={false}
              animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.01em' : '0.05em' }}
              transition={
                m.rm ? { duration: 0 } : { duration: 0.6, ease: [...EASE.reading], delay: 0.3 }
              }
            >
              om {prov.days} dagar
            </motion.span>
          )}
        </p>
      </Ink>

      {/* the struck facit — the exam's only reply, one mono line in the
          dateline's register, crossed by the corrector's stroke before
          the question takes the page */}
      <Ink go={go} delay={0.5}>
        <p className="hpl-facit-l">Det enda som provet skickar tillbaka:</p>
      </Ink>
      <div className="hpl-facit">
        <motion.span
          initial={false}
          animate={{ opacity: go ? 1 : 0 }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.26, ease: [...EASE.reading], delay: 0.62 }
          }
        >
          {FACIT_ROW}
        </motion.span>
        {/* the corrector's stroke — the page's verdict on the facit */}
        <div className="hpl-strike-wrap" aria-hidden>
          <motion.div
            className="hpl-strike"
            initial={false}
            animate={{ scaleX: go ? 1 : 0 }}
            transition={
              m.rm ? { duration: 0 } : { duration: 0.4, ease: [...EASE.reading], delay: 0.86 }
            }
          />
        </div>
      </div>
      <Ink go={go} delay={1.02}>
        <p className="hpl-facit-cap">
          facit — vilka du hade fel på, aldrig varför
          <span className="disclose">exempel, inte ur något prov</span>
        </p>
      </Ink>

      <div className="hpl-hero-center">
        <Ink go={go} delay={1.14}>
          <p className="hpl-kicker">
            {q.section} · {q.kicker}
          </p>
        </Ink>
        {/* the word arrives with weight: the long typographic settle at
            title-page scale — opacity + letter-spacing, zero travel */}
        <motion.h1
          className="hpl-headword"
          initial={false}
          animate={{ opacity: go ? 1 : 0, letterSpacing: go ? '-0.015em' : '0.06em' }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.8, ease: [...EASE.reading], delay: 1.24 }
          }
        >
          {q.headword}
        </motion.h1>
        {/* the compositor's rule — drawn from its center */}
        <motion.div
          className="hpl-hero-rule"
          initial={false}
          animate={{ scaleX: go ? 1 : 0 }}
          transition={
            m.rm ? { duration: 0 } : { duration: 0.38, ease: [...EASE.reading], delay: 1.78 }
          }
        />
        {/* the options settle like set type, one row at a time */}
        <div className="hpl-hero-opts">
          {q.options.map((opt, i) => {
            const isPick = picked === opt.key
            const graded = picked !== null
            const isRight = graded && opt.key === q.correct
            const isWrongPick = graded && isPick && !isRight
            const dim = graded && !isRight && !isPick
            const cls = [
              'hpc-m3-opt',
              isRight && 'is-ok',
              isWrongPick && 'is-bad',
              dim && 'is-dim',
              isPick && 'is-picked',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <motion.div
                key={opt.key}
                initial={false}
                animate={{ opacity: go ? 1 : 0 }}
                transition={
                  m.rm
                    ? { duration: 0 }
                    : { duration: 0.32, ease: [...EASE.reading], delay: 1.9 + i * 0.08 }
                }
                style={i === 0 ? { borderTop: '1px solid var(--hairline)' } : undefined}
              >
                <button
                  type="button"
                  className={cls}
                  disabled={graded}
                  onClick={() => onPick(opt.key)}
                  style={{ width: '100%' }}
                >
                  <span className="hpc-m3-ind" />
                  <span className="hpc-m3-opt-k">{opt.key})</span>
                  <span className="hpc-m3-opt-t">{opt.text}</span>
                  <span className="hpc-m3-opt-v">
                    {isRight ? 'Rätt svar' : isWrongPick ? 'Ditt svar' : ''}
                  </span>
                </button>
              </motion.div>
            )
          })}
        </div>

        {/* the genomgång plays right here, on the title page */}
        {picked && phase === 'playing' && (
          <KeepInView rm={m.rm} delayMs={200}>
            <GenStage key={playKey} q={q} picked={picked} onDone={onStageDone} />
          </KeepInView>
        )}
        {picked && phase === 'done' && <Receipt q={q} n={1} picked={picked} onReplay={onReplay} />}
      </div>

      {/* the foot: the hand-off line — the title page passes the eye
          down onto the timeline spine */}
      <div className="hpl-hero-foot">
        <Ink go={go} delay={2.4}>
          <p className="hpl-framing">
            Sidan börjar där appen börjar: med en fråga, inte med ett facit. Resten av sidan är
            dagarna fram till provet.
          </p>
          <p className="hpl-legal">{COPY.exampleTag}</p>
        </Ink>
      </div>
    </div>
  )
}

/* ── the page ─────────────────────────────────────────────────────────── */

export function PublicLanding() {
  const m = useArketMotion()
  const go = useVeilGo(m.rm)
  const sticky = useStickyCta()
  const prov = useMemo(() => getProvdatum(), [])

  const [picked, setPicked] = useState<string | null>(null)
  const [phase, setPhase] = useState<'idle' | 'playing' | 'done'>('idle')
  const [playKey, setPlayKey] = useState(0)

  const [entries, setEntries] = useState<SchedEntry[]>([])
  const book = (entry: SchedEntry) =>
    setEntries((es) => (es.some((e) => e.id === entry.id) ? es : [...es, entry]))

  const gradeHero = (k: string) => {
    const ok = k === Q1_HERO.correct
    setPicked(k)
    setPhase('playing')
    book({
      id: Q1_HERO.id,
      label: SCHED_LABELS[Q1_HERO.id],
      ok,
      tag: ok ? null : (Q1_HERO.trapTags[k] ?? 'fälla'),
    })
  }
  const replayHero = () => {
    setPlayKey((n) => n + 1)
    setPhase('playing')
  }

  return (
    <div className="hpl-root" data-testid="public-landing">
      <style>{LANDING_BASE_CSS}</style>
      <style>{LANDING_PAGE_CSS}</style>

      {/* Akt I — the question IS the first frame, under the exam's clock */}
      <section ref={sticky.heroRef} aria-label="Prova en uppgift — nedräkning till provet">
        <TitleHero
          go={go}
          prov={prov}
          picked={picked}
          phase={phase}
          onPick={gradeHero}
          onStageDone={() => setPhase('done')}
          onReplay={replayHero}
          playKey={playKey}
        />
      </section>

      {/* Akt II — the spine claims the title page as its first stop */}
      <div className="hpl-col">
        <div className="hpl-line">
          <motion.div
            className="hpl-spine"
            style={{ transformOrigin: 'top center' }}
            initial={false}
            animate={{ scaleY: go ? 1 : 0 }}
            transition={m.rm ? { duration: 0 } : { ...m.tween(1.05), delay: 0.9 }}
            aria-hidden
          />

          <Station tag="Ikväll" sub="där du är nu">
            <h2 className="hpl-thesis">Det här är inte en broschyr. Det är appen.</h2>
            <p className="hpl-body" style={{ marginTop: 14, maxWidth: '50ch' }}>
              Frågan du just mötte rättas som appen rättar — hela vägen, fälla för fälla. Två
              uppgifter till väntar på vägen mot {prov ? `den ${prov.dayMonth}` : 'provdagen'}, och
              varje fel bokförs i ett schema som slutar på provdagen.
            </p>
            {/* station 1 — the early door: reachable without answering */}
            <QuietCta />
            <div className="hpl-note" style={{ marginTop: 30 }}>
              <div className="hpl-note-l">{COPY.claims.zero.label}</div>
              <p className="hpl-note-t">{COPY.claims.zero.text}</p>
            </div>
          </Station>

          <Station tag="I morgon" sub="uppgift 2 · KVA">
            <GenDemo q={Q2_KVA} n={2} onGraded={book} />
            <div className="hpl-note" style={{ marginTop: 30 }}>
              <div className="hpl-note-l">{COPY.claims.adhd.label}</div>
              <p className="hpl-note-t">{COPY.claims.adhd.text}</p>
            </div>
          </Station>

          <Station tag="Om tre dagar" sub="uppgift 3 · MEK">
            <GenDemo q={Q3_MEK} n={3} onGraded={book} />
            <div className="hpl-note" style={{ marginTop: 30 }}>
              <div className="hpl-note-l">{COPY.claims.loop.label}</div>
              <p className="hpl-note-t">{COPY.claims.loop.text}</p>
            </div>
          </Station>

          <Station tag="Ditt schema" sub="repetitionskön">
            <SchedLedger entries={entries} prov={prov} />
          </Station>

          <Station tag="Veckan före provet">
            <div className="hpl-note">
              <div className="hpl-note-l">{COPY.claims.target.label}</div>
              <p className="hpl-note-t">{COPY.claims.target.text}</p>
            </div>
          </Station>

          <Station tag={prov ? `Provdagen · ${prov.short}` : 'Provdagen'}>
            <p className="hpl-scene">
              Klockan 08:10 öppnas häftet, och orden på titelsidan ser likadana ut som ikväll — men
              den här gången är det du som känner igen fällorna först.
            </p>
            <section ref={sticky.endRef} aria-label="Pris och konto">
              <PriceBlock />
              <Cta sub={COPY.ctaSub} />
            </section>
          </Station>
        </div>

        <hr className="hpl-sep" style={{ marginBottom: 20 }} />
        <div className="hpl-brandline">
          <span className="hpl-folio">{COPY.brand} · byggd av en som själv skriver provet</span>
          <span className="hpl-folio">2.0</span>
        </div>
        <p className="hpl-human" style={{ marginTop: 10 }}>
          {COPY.human}
        </p>
      </div>

      <StickyCta visible={sticky.visible} />
    </div>
  )
}
