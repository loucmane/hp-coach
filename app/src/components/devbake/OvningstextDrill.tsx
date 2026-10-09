// Drill scenes for /dev/ovningstext-bakeoff: one P5 unit played in the
// live M3 "Boksidan" chassis, with a variant's disclosure in place.
//
// The page is re-composed from the drill's own parts and markup —
// DrillRailSection, StepList, pickTactic, railMeta/sectionLongLabel and
// the .hpc-m3-* classes — because DrillQuestion has no disclosure slot
// yet (adding one is PR4b's change). Shells mirror the real surfaces:
//   desktop  BoksidanDesk: the collapsed rail spine (focus mode), the
//            880px StudyDesk column, the floating "Nästa fråga" once graded
//   phone    SessionPlayer's phone path: the question owns its scroll and
//            the full-width "Nästa →" sits under it
// Stand-ins: the rail spine is static, and the verdict is the
// reduced-motion "Rätt./Fel." form (no word morph). The pedagogy reads the
// fixture's reviewed explanations instead of the explanation loader; the
// framework chip and QA bar are left out.
//
// The scene is a small player: a–d (or a click) answers, Enter or "Nästa"
// moves through the unit, so the first-display → later-display change of
// the note can be felt, not only seen.

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import {
  BandNote,
  ColophonNote,
  EyebrowBadge,
  questionRailWithTag,
  railWithBadge,
  Tag,
  TagWithNote,
  UnitBand,
  type VariantKey,
} from '@/components/devbake/OvningstextKit'
import {
  EXPLANATIONS,
  type P5FixtureQuestion,
  type P5FixtureUnit,
} from '@/components/devbake/ovningstextFixtures'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { StepList } from '@/components/drill/PedagogyPanel'
import { pickTactic } from '@/components/pre-grade/pregrade-tactics'
import { Btn } from '@/components/primitives'
import type { AnswerLetter } from '@/data/questions'
import { RAIL_OUTCOME, railMeta, sectionLongLabel } from '@/lib/sectionRailLabel'

export type DrillLayout = 'desktop' | 'phone'

export type DrillSceneSpec = {
  unit: P5FixtureUnit
  /** Index (within the unit) of the question the scene opens on. */
  start: number
  /** Session position of the unit's first question, 1-indexed. */
  firstPosition: number
  /** Session length, for the eyebrow ("FRÅGA 2 AV 10"). */
  total: number
  /** The scene opens on the unit's first display, so the note shows. */
  firstDisplay: boolean
  /** Open already graded with this pick (the feedback scene). */
  pick?: AnswerLetter
  /** Open scrolled to the question (passage off screen) or the outcome. */
  anchor?: 'question' | 'outcome'
}

export function DrillScene({
  variant,
  spec,
  layout,
}: {
  variant: VariantKey
  spec: DrillSceneSpec
  layout: DrillLayout
}) {
  const { unit } = spec
  const [qIndex, setQIndex] = useState(spec.start)
  const [picked, setPicked] = useState<AnswerLetter | null>(spec.pick ?? null)
  const hostRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const q = unit.questions[qIndex]
  const firstDisplay = spec.firstDisplay && qIndex === spec.start
  const position = spec.firstPosition + qIndex
  const isLast = qIndex === unit.questions.length - 1

  // The end of the unit loops the scene back to its opening state.
  const next = () => {
    if (isLast) {
      setQIndex(spec.start)
      setPicked(spec.pick ?? null)
    } else {
      setQIndex((i) => i + 1)
      setPicked(null)
    }
  }

  // Keyboard model of the live drill: a–d answers, Enter moves on. Enter
  // on a focused control is left to the control itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, textarea, select') || target?.isContentEditable) return
      if (picked == null) {
        const letter = e.key.toUpperCase()
        if (q.options.some((o) => o.letter === letter)) {
          e.preventDefault()
          setPicked(letter as AnswerLetter)
        }
      } else if (e.key === 'Enter' && !target?.closest('button, a')) {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Open at the scene's anchor. A sticky band (C) covers the top of the
  // view, so the anchor is placed just below it. Positions come from the
  // offset chain, not getBoundingClientRect: the pedagogy is mid-entrance
  // (translateY) at mount. Placed again once the web fonts are in, since a
  // font swap re-flows the passage above the anchor.
  // biome-ignore lint/correctness/useExhaustiveDependencies: mount-only — the parent re-keys the scene per variant/scene
  useLayoutEffect(() => {
    if (!spec.anchor) return
    const place = () => {
      const host = hostRef.current
      const target = host?.querySelector<HTMLElement>(`[data-testid="ovn-${spec.anchor}"]`)
      if (!host || !target) return
      const band = host.querySelector<HTMLElement>('[data-testid="ovn-band"]')
      const offset = (band?.offsetHeight ?? 0) + 12
      const scroller = scrollerRef.current
      if (layout === 'phone' && scroller) {
        scroller.scrollTop = layoutTop(target) - layoutTop(scroller) - offset
      } else {
        window.scrollTo({ top: layoutTop(target) - offset })
      }
    }
    place()
    let alive = true
    document.fonts?.ready.then(() => {
      if (alive) place()
    })
    return () => {
      alive = false
    }
  }, [])

  // A new question starts at the top of the page, as in the live drill.
  const mounted = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: the question index is the trigger
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    if (layout === 'phone') {
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0
    } else {
      hostRef.current?.scrollIntoView?.({ block: 'start' })
    }
  }, [qIndex])

  const page = (
    <QuestionPage
      // Re-mount per question, like the live drill's QuestionPan: B's tag
      // toggle must open fresh (folded) on a later display.
      key={q.qid}
      variant={variant}
      unit={unit}
      q={q}
      position={position}
      total={spec.total}
      firstDisplay={firstDisplay}
      picked={picked}
      onPick={setPicked}
      layout={layout}
      scrollRoot={layout === 'phone' ? scrollerRef : null}
    />
  )

  return (
    <div ref={hostRef} data-testid="ovn-drill" data-layout={layout}>
      {layout === 'phone' ? (
        <PhoneShell scrollerRef={scrollerRef} graded={picked != null} onNext={next}>
          {page}
        </PhoneShell>
      ) : (
        <DesktopShell graded={picked != null} onNext={next}>
          {page}
        </DesktopShell>
      )}
    </div>
  )
}

// ── One question page ────────────────────────────────────────────────

export function QuestionPage({
  variant,
  unit,
  q,
  position,
  total,
  firstDisplay,
  picked,
  onPick,
  layout,
  scrollRoot,
  review = false,
}: {
  variant: VariantKey
  unit: P5FixtureUnit
  q: P5FixtureQuestion
  position?: number
  total?: number
  firstDisplay: boolean
  picked: AnswerLetter | null
  onPick?: (letter: AnswerLetter) => void
  layout: DrillLayout
  /** The scroll container B's tag watches; null = the viewport. */
  scrollRoot: RefObject<HTMLDivElement | null> | null
  /** Inline facit review (history): no eyebrow, no sticky band. */
  review?: boolean
}) {
  const meta = railMeta(unit.section)
  const graded = picked != null
  const tagRef = useRef<HTMLDivElement>(null)
  const passageTagInView = useInView(tagRef, scrollRoot, variant === 'b')
  const cloze = unit.context.includes('___(')
  // Same rule as DrillQuestion: a short prompt (a cloze "Gap (2)") is set
  // as the italic display headword, a sentence as the question line.
  const promptIsShort = q.prompt.length <= 18
  const tactic = graded ? null : pickTactic(q.qid, unit.section)
  const lastKey = q.options[q.options.length - 1]?.letter.toLowerCase()
  // C's band (and first-display note) sit between the eyebrow and the
  // passage; a negative bottom margin collapses into the section's own
  // top margin, so the passage follows the band at ~36px, not 64px.
  const pull = layout === 'phone' ? -20 : -28

  const questionMeta =
    variant === 'a'
      ? railWithBadge(meta.promptLabel)
      : variant === 'b'
        ? questionRailWithTag(meta.promptLabel, !passageTagInView)
        : meta.promptLabel

  return (
    <>
      {!review && position != null && total != null && (
        <DrillRailSection
          meta={
            <>
              <strong>{unit.section}</strong>
              {position} / {total}
            </>
          }
        >
          <div className="hpc-m3-eyebrow">
            {sectionLongLabel(unit.section).toUpperCase()} · FRÅGA {position} AV {total}
          </div>
        </DrillRailSection>
      )}

      {variant === 'c' && (
        <>
          <UnitBand
            title={unit.title}
            sticky={!review}
            style={{
              marginTop: review ? 0 : layout === 'phone' ? 24 : 32,
              marginBottom: firstDisplay ? 0 : pull,
            }}
          />
          {firstDisplay && <BandNote style={{ marginBottom: pull }} />}
        </>
      )}

      <DrillRailSection meta={meta.contextLabel} testid="ovn-text">
        {variant !== 'c' && (
          <div ref={tagRef}>
            {variant === 'a' && (
              <>
                <EyebrowBadge />
                {firstDisplay && <ColophonNote />}
              </>
            )}
            {variant === 'b' && <TagWithNote firstDisplay={firstDisplay} />}
          </div>
        )}
        <Passage unit={unit} activeGap={cloze ? q.number : null} />
      </DrillRailSection>

      <DrillRailSection meta={questionMeta} testid="ovn-question">
        {promptIsShort ? (
          <h1 className="hpc-m3-display">{q.prompt}</h1>
        ) : (
          <p className="hpc-m3-q">{q.prompt}</p>
        )}
        {tactic && (
          <aside className="hpc-m3-tactic">
            <p className="hpc-m3-tactic-h">Taktik · {tactic.handle}</p>
            <p className="hpc-m3-tactic-t">{tactic.move}</p>
          </aside>
        )}
      </DrillRailSection>

      <DrillRailSection meta={meta.chooseLabel}>
        <div className={meta.optionsProse ? 'hpc-m3-opts is-prose' : 'hpc-m3-opts'}>
          {q.options.map((opt) => {
            const state = rowState(opt.letter, picked, q.answer)
            const verdict =
              state === 'correct' ? 'Rätt svar' : state === 'incorrect' ? 'Ditt svar' : null
            return (
              <button
                key={opt.letter}
                type="button"
                disabled={graded}
                data-testid={`ovn-option-${opt.letter}`}
                data-state={state}
                className={rowClass(state, graded)}
                onClick={() => onPick?.(opt.letter)}
              >
                <span aria-hidden className="hpc-m3-ind" />
                <span className="hpc-m3-opt-k">{opt.letter.toLowerCase()}</span>
                <span className="hpc-m3-opt-t">{opt.text}</span>
                {verdict && <span className="hpc-m3-opt-v">{verdict}</span>}
              </button>
            )
          })}
        </div>
        {!graded && lastKey && (
          <div className="hpc-m3-keys">Tangenter a–{lastKey} väljer · klick fungerar också</div>
        )}
      </DrillRailSection>

      {graded && picked != null && <Pedagogy variant={variant} q={q} picked={picked} />}
    </>
  )
}

// ── Passage ──────────────────────────────────────────────────────────

/** The passage: the unit title as the M3 passage heading, then the text
 *  exactly as exported (byline included). P5 cloze gaps are written
 *  `___(N)___`; they get the live cloze-gap treatment, current gap in
 *  accent. (The live DrillQuestion only recognises the authentic bare
 *  two-digit gaps — a PR4b item.) */
function Passage({ unit, activeGap }: { unit: P5FixtureUnit; activeGap: number | null }) {
  return (
    <div className="hpc-m3-passage" data-testid="ovn-passage">
      <h2 className="hpc-m3-passage-h">{unit.title}</h2>
      {unit.context.split(/\n{2,}/).map((para, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: passage paragraphs are static text
        <p key={i}>{activeGap == null ? para : renderGaps(para, activeGap)}</p>
      ))}
    </div>
  )
}

const GAP_RE = /___\((\d+)\)___/g

function renderGaps(text: string, active: number): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(GAP_RE)) {
    const idx = m.index ?? 0
    if (idx > last) out.push(text.slice(last, idx))
    const n = Number(m[1])
    const on = n === active
    out.push(
      <span
        key={`${n}-${idx}`}
        data-testid={`ovn-gap-${n}`}
        data-active={on ? 'true' : 'false'}
        style={{
          display: 'inline-block',
          padding: '0 14px 1px',
          margin: '0 2px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8em',
          fontVariantNumeric: 'tabular-nums',
          color: on ? 'var(--accent)' : 'var(--muted)',
          fontWeight: on ? 700 : 400,
          background: on ? 'var(--accent-soft)' : 'transparent',
          borderBottom: `2px solid ${on ? 'var(--accent)' : 'var(--muted)'}`,
          lineHeight: 1.2,
        }}
      >
        {n}
      </span>,
    )
    last = idx + m[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

// ── Options (OptionRow's grading states, without the drag layer) ─────

type RowState = 'idle' | 'correct' | 'incorrect'

function rowState(letter: AnswerLetter, picked: AnswerLetter | null, answer: AnswerLetter) {
  if (picked == null) return 'idle'
  if (letter === answer) return 'correct'
  if (letter === picked) return 'incorrect'
  return 'idle'
}

function rowClass(state: RowState, graded: boolean): string {
  if (state === 'correct') return 'hpc-m3-opt is-ok'
  if (state === 'incorrect') return 'hpc-m3-opt is-bad'
  return graded ? 'hpc-m3-opt is-dim' : 'hpc-m3-opt'
}

// ── Pedagogy (PedagogyPanel's three rail sections, fixture-fed) ──────

function Pedagogy({
  variant,
  q,
  picked,
}: {
  variant: VariantKey
  q: P5FixtureQuestion
  picked: AnswerLetter
}) {
  const explanation = EXPLANATIONS[q.qid]
  const correct = picked === q.answer
  // P5 options are whole sentences; the live verdict-sub appends its own
  // full stop, which prints "…den.." — drop the option's (a PR4b item).
  const correctText = q.options.find((o) => o.letter === q.answer)?.text.replace(/\.$/, '')
  const steps = explanation?.steps ?? []
  const distractors = explanation?.distractors ?? []
  return (
    <div className="hpc-m3-ped" data-testid="ovn-pedagogy">
      <DrillRailSection
        meta={variant === 'a' ? railWithBadge(RAIL_OUTCOME) : RAIL_OUTCOME}
        testid="ovn-outcome"
      >
        {variant === 'b' && (
          <div style={{ marginBottom: 12 }}>
            <Tag small />
          </div>
        )}
        <div
          className="hpc-m3-verdict"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label={correct ? 'Rätt svar' : 'Fel svar'}
        >
          <span aria-hidden className={`hpc-m3-verdict-word ${correct ? 'is-ok' : 'is-bad'}`}>
            {correct ? 'Rätt.' : 'Fel.'}
          </span>
          <p className="hpc-m3-verdict-sub">
            {correct
              ? 'Snyggt — rätt tänkt hela vägen.'
              : `Rätt svar är ${q.answer.toLowerCase()}) ${correctText}. Häng med i varför.`}
          </p>
        </div>
        {explanation && <p className="hpc-m3-solution">{explanation.solution_path}</p>}
      </DrillRailSection>

      {steps.length > 0 && (
        <DrillRailSection meta={`${steps.length} steg`} delay={140}>
          <h2 className="hpc-m3-h">Så löser du den</h2>
          <StepList steps={steps} />
        </DrillRailSection>
      )}

      {distractors.length > 0 && (
        <DrillRailSection meta={`${distractors.length} fällor`} delay={280}>
          <h2 className="hpc-m3-h">Varför de andra lockar</h2>
          <div>
            {distractors.map((d, i) => (
              <div
                key={d.letter}
                className="hpc-m3-dis"
                style={{ animationDelay: `${360 + i * 80}ms` }}
              >
                <p className="hpc-m3-dis-h">
                  <span className="hpc-m3-dis-k">{d.letter.toLowerCase()})</span>
                  <s>{q.options.find((o) => o.letter === d.letter)?.text}</s>
                </p>
                <p className="hpc-m3-dis-l">Varför det lockar</p>
                <p className="hpc-m3-dis-p">{d.why_tempting}</p>
                <p className="hpc-m3-dis-l">Varför det är fel</p>
                <p className="hpc-m3-dis-p">{d.why_wrong}</p>
              </div>
            ))}
          </div>
        </DrillRailSection>
      )}
    </div>
  )
}

// ── Shells ───────────────────────────────────────────────────────────

/** BoksidanDesk: rail spine (collapsed — the drill's focus mode) + the
 *  centred 880px StudyDesk column + the floating "Nästa fråga". */
function DesktopShell({
  children,
  graded,
  onNext,
}: {
  children: ReactNode
  graded: boolean
  onNext: () => void
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '44px minmax(0, 1fr)',
        minHeight: '100dvh',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <SpineStandIn />
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, width: '100%', maxWidth: 1320, margin: '0 auto' }}>
          <div style={{ containerType: 'inline-size' }}>
            <div className="hpc-studydesk">
              <div
                className="hpc-m3-page"
                style={{ padding: '4px 0 8px', containerType: 'inline-size' }}
              >
                {children}
              </div>
            </div>
          </div>
        </div>
        {graded && (
          <div
            style={{
              position: 'sticky',
              bottom: 'clamp(24px, 4vh, 48px)',
              zIndex: 5,
              display: 'flex',
              justifyContent: 'flex-end',
              padding: '0 clamp(48px, 6vw, 96px)',
              pointerEvents: 'none',
            }}
          >
            <button type="button" onClick={onNext} style={floatingNext}>
              Nästa fråga
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>↵</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const floatingNext: CSSProperties = {
  pointerEvents: 'auto',
  cursor: 'pointer',
  minWidth: 168,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '14px 24px',
  border: 0,
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-display)',
  fontSize: 16,
  fontWeight: 500,
  color: 'var(--bg)',
  background: 'color-mix(in oklch, var(--ink) 92%, transparent)',
  backdropFilter: 'saturate(150%) blur(16px)',
  WebkitBackdropFilter: 'saturate(150%) blur(16px)',
  boxShadow: '0 18px 40px -16px rgba(0, 0, 0, 0.28)',
}

/** SessionPlayer's phone drill: the page scrolls inside its own box and
 *  the full-width answer-gated "Nästa →" stays under it. */
function PhoneShell({
  children,
  scrollerRef,
  graded,
  onNext,
}: {
  children: ReactNode
  scrollerRef: RefObject<HTMLDivElement | null>
  graded: boolean
  onNext: () => void
}) {
  return (
    <div
      data-testid="ovn-phone"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 16,
        paddingBottom: 22,
        boxSizing: 'border-box',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <div style={{ flex: 1, minHeight: 0, marginTop: 12 }}>
        <div
          ref={scrollerRef}
          className="hpc-m3-page"
          style={{
            height: '100%',
            overflowY: 'auto',
            padding: '4px var(--pad-lg) 8px',
            containerType: 'inline-size',
          }}
        >
          {children}
        </div>
      </div>
      <div style={{ padding: '12px var(--pad-lg) 0', display: 'flex', flexDirection: 'column' }}>
        <Btn full size="md" onClick={onNext} disabled={!graded} data-testid="ovn-next">
          Nästa →
        </Btn>
      </div>
    </div>
  )
}

/** Static stand-in for the collapsed NavRail spine. The live spine reads
 *  account data, which a fixture page must not wire. */
function SpineStandIn() {
  return (
    <div
      aria-hidden
      style={{
        position: 'sticky',
        top: 0,
        height: '100dvh',
        borderRight: '1px solid var(--hairline)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 22,
        paddingTop: 22,
      }}
    >
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--muted)' }}>»</span>
      <span
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontFamily: 'var(--font-display)',
          fontStyle: 'italic',
          fontWeight: 600,
          fontSize: 15,
          color: 'var(--ink-2)',
        }}
      >
        HP-Coach
      </span>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Document-layout top of an element: the offsetTop chain, which ignores
 *  transforms and the scroll of non-positioned scroll containers. */
function layoutTop(el: HTMLElement): number {
  let y = 0
  for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) {
    y += n.offsetTop
  }
  return y
}

/** Whether `ref` is inside the scroll root's view (the viewport when the
 *  root is null). Defaults to true where IntersectionObserver is missing. */
function useInView(
  ref: RefObject<Element | null>,
  root: RefObject<Element | null> | null,
  enabled: boolean,
): boolean {
  const [inView, setInView] = useState(true)
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      root: root?.current ?? null,
      threshold: 0,
    })
    io.observe(el)
    return () => io.disconnect()
  }, [ref, root, enabled])
  return inView
}
