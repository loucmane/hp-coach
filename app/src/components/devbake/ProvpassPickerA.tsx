// ProvpassPickerA — provpass PICKER bake-off, designer A. Two concepts
// exploring ORGANIZATION-first: how does a shelf of 13 years of real
// exams (2013–2026, 27 sittings, 54 passes per half) want to be browsed
// by an ADHD-PI reader who must never face 54 equal choices?
//
// Shared naming LAW (both designers): formatSitting / formatPass below —
// canonical Swedish display names derived from the exam_id grammar. The
// product PR lifts the winner's copy verbatim; no raw ids ("host-2025 ·
// kvant1") ever reach the page.
//
// ── PPA1 · Innehållet ─ the table of contents ────────────────────────
//
//   ORGANIZING PRINCIPLE  This product is a book, and a book's device
//   for "everything in here, in order, findable at a glance" is the
//   innehållsförteckning. The page opens with a frontispiece lead —
//   NÄSTA PASS, the scheduler's least-exposed suggestion set large in
//   serif with a single Starta affordance (the effortless next step the
//   ADHD pillar demands). Below it, the whole archive as a TOC: years
//   as mono running-heads on the margin rail (newest first), one
//   dot-leader line per pass, and — the signature — the EXPOSURE COUNT
//   sitting exactly where a TOC puts its page number. The right column
//   does real informational work: 0/40 means fresh, 40/40 means spent;
//   freshness is scannable down the column without reading a word.
//
//   THE RISK  Dot leaders across 54 lines could read as noise. They are
//   earned because the leader IS the row's only rule — no borders, no
//   chevrons, no card chrome — and the year running-heads chunk the
//   column into 2–8-line groups the eye can hold.
//
//   REJECTED  Arrows/chevrons per row (TOC lines don't point; the whole
//   line is the link); a "föreslagen" badge inside the archive (the
//   frontispiece owns recommendation — repeating it makes two voices);
//   per-row completeness badges (every pass is 40/40 parsed today; the
//   badge renders only when presented < 40, as an exception, not a column).
//
// ── PPA2 · Utgåvorna ─ the edition shelf ─────────────────────────────
//
//   ORGANIZING PRINCIPLE  The student doesn't think in 54 passes — she
//   thinks in EXAMS: "the autumn 2025 one". So the unit of browsing is
//   the SITTING (27 editions, not 54 rows): each edition an object with
//   a mono season tag, a serif title, and its two passes as paired
//   lines with an exposure state glyph (○ osedd · ◐ delvis · ● sedd).
//   The signature is the YEAR SPINE: the house margin rail carries a
//   large mono year numeral per shelf row, so the archive reads like
//   dated spines in a library — 13 years scannable top to bottom.
//   Desktop seats editions two-up per year row on the rail chassis;
//   phone stacks the same registry. The recommended pass stays a
//   one-line lead ("Föreslaget nästa …  Starta →") above the shelf.
//
//   THE RISK  Nesting passes inside sittings adds one decision level
//   (pick the edition, then the pass). Accepted because it halves the
//   apparent choice count — 27 objects with two well-spaced targets
//   each beats 54 equal rows — and the glyph column keeps both targets
//   scannable without reading.
//
//   REJECTED  A strict season × year matrix (VT/HT columns leave dead
//   cells — no spring 2020/2021 — and Våren 2022's two sittings break
//   the cell); a single "start edition" tap that auto-picks a pass
//   (hides a real choice); accordion-collapsed years (collapse hides
//   the freshness information the glyphs exist to show).
//
// Data: REAL bank via loadBank() + listAuthenticPasses. Exposure via
// useExposure() when a session exists; otherwise a deterministic,
// clearly-labelled fixture ("exponering: fixtur") so the three glyph
// states render honestly. Artboards: phone 390×844 + desktop 1440 per
// concept, data-shot attrs for screenshots. No routes; house tokens only.

import { useEffect, useMemo, useState } from 'react'

import { type ExposureMap, type MockHalf, useExposure } from '@/api/hooks/useMockResults'
import { loadBank, type Question } from '@/data/questions'
import { listAuthenticPasses, type PassOption } from '@/lib/mock'

// ── Naming law (shared with designer B — vocabulary, not presentation) ─

const SEASON_NAME: Record<string, string> = { var: 'Våren', host: 'Hösten' }
const SEASON_TAG: Record<string, string> = { var: 'VT', host: 'HT' }

type SittingParts = {
  season: 'var' | 'host'
  year: string
  /** trailing sitting number (`var-2022-1` → "1") */
  sitting: string | null
  /** version number (`host-ver1-2019` → "1") */
  version: string | null
}

export function parseSitting(examId: string): SittingParts {
  const parts = examId.split('-')
  const season = parts[0] === 'host' ? 'host' : 'var'
  let year = ''
  let sitting: string | null = null
  let version: string | null = null
  for (const p of parts.slice(1)) {
    if (/^\d{4}$/.test(p)) year = p
    else if (/^ver\d+$/.test(p)) version = p.slice(3)
    else if (/^\d+$/.test(p)) sitting = p
  }
  return { season, year, sitting, version }
}

/** Canonical Swedish sitting name: `var-2026` → "Våren 2026",
 *  `var-2022-1` → "Våren 2022 · provtillfälle 1",
 *  `host-ver2-2019` → "Hösten 2019 · version 2". */
export function formatSitting(examId: string): string {
  const p = parseSitting(examId)
  let out = `${SEASON_NAME[p.season]} ${p.year}`
  if (p.sitting) out += ` · provtillfälle ${p.sitting}`
  if (p.version) out += ` · version ${p.version}`
  return out
}

/** Pass name under an already-chosen half: `verb1`/`kvant1` →
 *  "Provpass 1". The half is the page's toggle context — never repeated
 *  per row. */
export function formatPass(provpass: string): string {
  const m = /(\d+)$/.exec(provpass)
  return m ? `Provpass ${m[1]}` : provpass
}

/** Short qualifier for dense contexts ("provtillfälle 1" → "tillf. 1"). */
function sittingQualifier(p: SittingParts): string | null {
  if (p.sitting) return `provtillfälle ${p.sitting}`
  if (p.version) return `version ${p.version}`
  return null
}

// ── Data: real bank + real-or-fixture exposure ───────────────────────

/** Deterministic fixture exposure — a plausible dogfood history so all
 *  three freshness states render: newest spring fully drilled, a few
 *  passes partially seen, the deep archive untouched. */
function fixtureExposure(bank: readonly Question[]): ExposureMap {
  const out: ExposureMap = {}
  const mark = (q: Question, n: number) => {
    out[q.qid] = { n, last: 1720000000000 }
  }
  for (const q of bank) {
    if (q.exam_id === 'var-2026') mark(q, 2)
    else if (q.exam_id === 'var-2025' && (q.provpass === 'verb1' || q.provpass === 'kvant1'))
      mark(q, 1)
    else if (q.exam_id === 'host-2025' && q.number <= 17) mark(q, 1)
    else if (q.exam_id === 'var-2024' && q.provpass === 'verb2' && q.number <= 9) mark(q, 1)
    else if (q.exam_id === 'host-2022' && q.provpass === 'kvant2') mark(q, 1)
  }
  return out
}

function useAuthenticPasses(): { passes: PassOption[]; fixture: boolean } {
  const [bank, setBank] = useState<readonly Question[] | null>(null)
  const exposureQuery = useExposure()

  useEffect(() => {
    loadBank().then(setBank)
  }, [])

  return useMemo(() => {
    if (!bank) return { passes: [], fixture: false }
    const real = exposureQuery.data
    const exposure = real && Object.keys(real).length > 0 ? real : fixtureExposure(bank)
    return { passes: listAuthenticPasses([...bank], exposure), fixture: exposure !== real }
  }, [bank, exposureQuery.data])
}

// ── Shared grouping ──────────────────────────────────────────────────

type Sitting = {
  examId: string
  parts: SittingParts
  passes: PassOption[] // pass 1 then pass 2, reading order
}

type YearGroup = { year: string; sittings: Sitting[] }

/** Group one half's passes by year (newest first). Within a year:
 *  autumn before spring (reverse-chronological, matching the year-desc
 *  scan direction); sittings/versions in reading order (1 then 2). */
function groupByYear(passes: PassOption[], half: MockHalf): YearGroup[] {
  const byExam = new Map<string, Sitting>()
  for (const p of passes) {
    if (p.half !== half) continue
    let s = byExam.get(p.examId)
    if (!s) {
      s = { examId: p.examId, parts: parseSitting(p.examId), passes: [] }
      byExam.set(p.examId, s)
    }
    s.passes.push(p)
  }
  for (const s of byExam.values()) {
    s.passes.sort((a, z) => a.provpass.localeCompare(z.provpass))
  }
  const years = new Map<string, Sitting[]>()
  const sittings = [...byExam.values()].sort((a, z) => {
    if (a.parts.year !== z.parts.year) return z.parts.year.localeCompare(a.parts.year)
    if (a.parts.season !== z.parts.season) return a.parts.season === 'host' ? -1 : 1
    return (a.parts.sitting ?? a.parts.version ?? '').localeCompare(
      z.parts.sitting ?? z.parts.version ?? '',
    )
  })
  for (const s of sittings) {
    const g = years.get(s.parts.year)
    if (g) g.push(s)
    else years.set(s.parts.year, [s])
  }
  return [...years.entries()].map(([year, ss]) => ({ year, sittings: ss }))
}

/** The scheduler's suggestion: listAuthenticPasses is already sorted
 *  least-exposed-first — first entry of the half wins. */
function suggestedOf(passes: PassOption[], half: MockHalf): PassOption | null {
  return passes.find((p) => p.half === half) ?? null
}

type Freshness = 'unseen' | 'partial' | 'seen'

function freshnessOf(p: PassOption): Freshness {
  if (p.seenBefore === 0) return 'unseen'
  if (p.seenBefore >= p.presented) return 'seen'
  return 'partial'
}

const FRESH_GLYPH: Record<Freshness, string> = { unseen: '○', partial: '◐', seen: '●' }

// ── Scoped CSS (house tokens only) ───────────────────────────────────

const CSS = `
.ppa-page {
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-ui);
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
  min-height: 100%;
}
.ppa-reset {
  margin: 0; padding: 0; border: 0; background: none;
  font: inherit; color: inherit; text-align: inherit;
  appearance: none; cursor: pointer;
}
.ppa-reset:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 2px;
}

/* the house chassis: mono margin rail | hairline spine | page column */
.ppa-row {
  display: grid;
  grid-template-columns: 128px 1px 1fr;
  column-gap: 28px;
}
.ppa-spine { background: var(--hairline); align-self: stretch; }
.ppa-meta {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  text-align: right;
  padding-top: 5px;
  font-variant-numeric: tabular-nums;
}
.ppa-meta strong { display: block; color: var(--ink-2); font-weight: 500; }
.ppa-content { min-width: 0; }
.ppa-section { margin-top: 44px; }
.ppa-section:first-child { margin-top: 0; }
.ppa-rule { height: 1px; background: var(--hairline); border: 0; margin: 0 0 18px; }

.ppa-display {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  line-height: var(--font-display-lead);
  font-size: 30px;
  margin: 0;
}
.ppa-mono {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* toggles — the product's underlined mono words */
.ppa-toggle { display: flex; gap: 18px; flex-wrap: wrap; align-items: baseline; }
.ppa-toggle button {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted-2);
  border-bottom: 1px solid transparent;
  padding-bottom: 2px;
}
.ppa-toggle button[aria-pressed="true"] {
  color: var(--ink);
  border-bottom-color: var(--accent);
}

/* ── PPA1 · the TOC line ──────────────────────────────────────────── */
.ppa-toc-year {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--ink-2);
  margin: 26px 0 6px;
  font-variant-numeric: tabular-nums;
}
.ppa-toc-year:first-child { margin-top: 0; }
.ppa-toc-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  width: 100%;
  padding: 7px 0;
}
.ppa-toc-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  font-size: 17px;
  color: var(--ink);
  white-space: nowrap;
}
.ppa-toc-title small {
  font-size: 13px;
  color: var(--ink-2);
  font-style: italic;
  letter-spacing: 0;
}
.ppa-toc-leader {
  flex: 1 1 auto;
  min-width: 24px;
  border-bottom: 1px dotted var(--hairline);
  transform: translateY(-4px);
}
.ppa-toc-line:hover .ppa-toc-leader { border-bottom-color: var(--accent-soft); }
.ppa-toc-line:hover .ppa-toc-title { color: var(--accent); }
.ppa-toc-n {
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.ppa-toc-n.is-unseen { color: var(--ink-2); }
.ppa-toc-n.is-partial { color: var(--muted); }
.ppa-toc-n.is-seen { color: var(--muted-2); }
.ppa-toc-line.is-seen .ppa-toc-title { color: var(--muted); }

/* frontispiece lead (shared by both concepts) */
.ppa-lead {
  display: block;
  width: 100%;
  box-sizing: border-box;
  background: var(--panel);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  padding: var(--pad-lg);
}
.ppa-lead:hover { border-color: var(--accent-soft); }
.ppa-lead-start {
  display: inline-block;
  margin-top: 14px;
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  border-bottom: 1px solid var(--accent);
  padding-bottom: 2px;
}

/* ── PPA2 · the edition shelf ─────────────────────────────────────── */
.ppa-shelf-year {
  font-family: var(--font-mono);
  font-size: 22px;
  letter-spacing: 0.06em;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
  text-align: right;
  padding-top: 10px;
}
.ppa-shelf-row { border-top: 1px solid var(--hairline-2); padding: 14px 0 18px; }
.ppa-shelf-row:first-child { border-top: 0; padding-top: 0; }
.ppa-editions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.ppa-editions.is-single { grid-template-columns: 1fr; max-width: 420px; }
.ppa-edition {
  background: var(--panel);
  border: 1px solid var(--hairline);
  border-radius: calc(var(--radius) * 0.66);
  padding: 14px 16px 8px;
  min-width: 0;
}
.ppa-edition-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.ppa-edition-title {
  font-family: var(--font-display);
  font-weight: var(--font-display-w);
  letter-spacing: var(--font-display-track);
  font-size: 18px;
  color: var(--ink);
  margin: 2px 0 6px;
}
.ppa-edition-title small { font-size: 13px; font-style: italic; color: var(--ink-2); }
.ppa-passline {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 8px 0;
  border-top: 1px solid var(--hairline-2);
}
.ppa-passline:hover .ppa-passline-t { color: var(--accent); }
.ppa-passline-t { font-size: 14px; color: var(--ink); letter-spacing: var(--font-ui-track); }
.ppa-passline.is-seen .ppa-passline-t { color: var(--muted); }
.ppa-passline-g {
  font-family: var(--font-mono);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  white-space: nowrap;
}
.ppa-legend {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  color: var(--muted);
  margin: 6px 0 0;
}

/* phone (inside the 390 artboard): rail collapses, running heads inline */
.ppa-phone .ppa-row { display: block; }
.ppa-phone .ppa-spine { display: none; }
.ppa-phone .ppa-meta { text-align: left; margin-bottom: 10px; padding-top: 0; }
.ppa-phone .ppa-meta strong { display: inline; margin-right: 8px; }
.ppa-phone .ppa-display { font-size: 26px; }
.ppa-phone .ppa-section { margin-top: 34px; }
.ppa-phone .ppa-editions { grid-template-columns: 1fr; }
.ppa-phone .ppa-shelf-year {
  text-align: left; font-size: 13px; letter-spacing: 0.14em; padding: 0 0 4px;
}
.ppa-phone .ppa-toc-title { white-space: normal; }

@media (prefers-reduced-motion: no-preference) {
  .ppa-content > .ppa-section {
    animation: ppa-in 300ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }
}
@keyframes ppa-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: none; }
}
`

// ── Artboard scaffolding (matches the round-2 account pattern) ───────

function StageLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--muted)',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  )
}

function PhoneArtboard({ shot, children }: { shot: string; children: React.ReactNode }) {
  return (
    <div
      data-shot={shot}
      className="ppa-page ppa-phone"
      style={{
        width: 390,
        height: 844,
        border: '1px solid var(--hairline)',
        borderRadius: 28,
        overflowY: 'auto',
        overflowX: 'hidden',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.35)',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '52px 22px 96px' }}>{children}</div>
    </div>
  )
}

function DesktopArtboard({ shot, children }: { shot: string; children: React.ReactNode }) {
  return (
    <div
      data-shot={shot}
      className="ppa-page"
      style={{
        width: 1440,
        border: '1px solid var(--hairline)',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 24px 60px -30px rgba(0,0,0,0.35)',
      }}
    >
      <div style={{ maxWidth: 880, margin: '0 auto', padding: '56px 24px 96px' }}>{children}</div>
    </div>
  )
}

function RailSection({ meta, children }: { meta: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="ppa-section">
      <hr className="ppa-rule" />
      <div className="ppa-row">
        <div className="ppa-meta">{meta}</div>
        <div className="ppa-spine" />
        <div className="ppa-content">{children}</div>
      </div>
    </section>
  )
}

// ── Shared picker chrome: headline + toggles + frontispiece lead ─────

function PickerHead({
  half,
  onHalf,
  fixture,
}: {
  half: MockHalf
  onHalf: (h: MockHalf) => void
  fixture: boolean
}) {
  return (
    <>
      <RailSection
        meta={
          <>
            <strong>Provpass</strong>
            hela provet
          </>
        }
      >
        <h1 className="ppa-display">Kör provpasset.</h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 16,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            margin: '12px 0 0',
          }}
        >
          40 frågor, 55 minuter, riktiga provvillkor — ingen feedback förrän du lämnar in.
        </p>
        {fixture && (
          <p className="ppa-mono" style={{ margin: '10px 0 0', color: 'var(--muted)' }}>
            exponering: fixtur (ej inloggad)
          </p>
        )}
      </RailSection>
      <RailSection meta="Läge">
        <div className="ppa-toggle">
          <button type="button" className="ppa-reset" aria-pressed="true">
            Riktigt pass
          </button>
          <button type="button" className="ppa-reset" aria-pressed="false">
            Genererat pass
          </button>
        </div>
      </RailSection>
      <RailSection meta="Halva">
        <div className="ppa-toggle">
          <button
            type="button"
            className="ppa-reset"
            aria-pressed={half === 'verbal'}
            onClick={() => onHalf('verbal')}
          >
            Verbal
          </button>
          <button
            type="button"
            className="ppa-reset"
            aria-pressed={half === 'kvant'}
            onClick={() => onHalf('kvant')}
          >
            Kvantitativ
          </button>
        </div>
      </RailSection>
    </>
  )
}

function Frontispiece({ pass }: { pass: PassOption | null }) {
  if (!pass) return null
  const fresh = freshnessOf(pass)
  return (
    <RailSection meta="Nästa pass">
      <button type="button" className="ppa-reset ppa-lead" aria-label="Starta föreslaget pass">
        <span className="ppa-mono" style={{ display: 'block', color: 'var(--accent)' }}>
          Föreslaget · minst sett
        </span>
        <span className="ppa-display" style={{ display: 'block', fontSize: 24, margin: '6px 0 0' }}>
          {formatSitting(pass.examId)}
        </span>
        <span
          style={{
            display: 'block',
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 15,
            color: 'var(--ink-2)',
            marginTop: 2,
          }}
        >
          {formatPass(pass.provpass)}
          {' — '}
          {fresh === 'unseen'
            ? 'du har inte sett någon av frågorna'
            : `${pass.seenBefore} av ${pass.presented} frågor sedda`}
        </span>
        <span className="ppa-lead-start">Starta →</span>
      </button>
    </RailSection>
  )
}

// ── PPA1 · Innehållet — the table of contents ────────────────────────

function TocList({ groups }: { groups: YearGroup[] }) {
  return (
    <div>
      {groups.map((g) => (
        <div key={g.year}>
          <div className="ppa-toc-year">{g.year}</div>
          {g.sittings.map((s) =>
            s.passes.map((p) => {
              const fresh = freshnessOf(p)
              const q = sittingQualifier(s.parts)
              return (
                <button
                  type="button"
                  key={`${p.examId}-${p.provpass}`}
                  className={`ppa-reset ppa-toc-line is-${fresh}`}
                  aria-label={`Starta ${formatSitting(p.examId)}, ${formatPass(p.provpass)}`}
                >
                  <span className="ppa-toc-title">
                    {SEASON_NAME[s.parts.season]} {s.parts.year}
                    {q && <small> · {q}</small>}
                    <small> · {formatPass(p.provpass)}</small>
                  </span>
                  <span className="ppa-toc-leader" aria-hidden />
                  {p.presented < 40 && (
                    <span
                      className="ppa-toc-n"
                      style={{ color: 'var(--bad)' }}
                      title="Ofullständigt pass"
                    >
                      {p.presented}/40 frågor
                    </span>
                  )}
                  <span className={`ppa-toc-n is-${fresh}`}>
                    {p.seenBefore}/{p.presented}
                  </span>
                </button>
              )
            }),
          )}
        </div>
      ))}
    </div>
  )
}

function Ppa1Page({
  half,
  onHalf,
  passes,
  fixture,
}: {
  half: MockHalf
  onHalf: (h: MockHalf) => void
  passes: PassOption[]
  fixture: boolean
}) {
  const groups = useMemo(() => groupByYear(passes, half), [passes, half])
  return (
    <>
      <PickerHead half={half} onHalf={onHalf} fixture={fixture} />
      <Frontispiece pass={suggestedOf(passes, half)} />
      <RailSection meta="Innehåll">
        <p className="ppa-legend" style={{ margin: '0 0 8px' }}>
          sedda frågor av 40 — 0/40 = orört pass
        </p>
        {groups.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: 'var(--ink-2)',
            }}
          >
            Laddar arkivet …
          </p>
        ) : (
          <TocList groups={groups} />
        )}
      </RailSection>
    </>
  )
}

// ── PPA2 · Utgåvorna — the edition shelf ─────────────────────────────

function EditionCard({ sitting }: { sitting: Sitting }) {
  const q = sittingQualifier(sitting.parts)
  return (
    <div className="ppa-edition">
      {/* season tag only — the year already lives on the rail spine */}
      <div className="ppa-edition-tag">{SEASON_TAG[sitting.parts.season]}</div>
      <div className="ppa-edition-title">
        {SEASON_NAME[sitting.parts.season]} {sitting.parts.year}
        {q && <small> · {q}</small>}
      </div>
      {sitting.passes.map((p) => {
        const fresh = freshnessOf(p)
        return (
          <button
            type="button"
            key={p.provpass}
            className={`ppa-reset ppa-passline is-${fresh}`}
            aria-label={`Starta ${formatSitting(p.examId)}, ${formatPass(p.provpass)}`}
          >
            <span className="ppa-passline-t">{formatPass(p.provpass)}</span>
            <span className="ppa-passline-g">
              <span aria-hidden>{FRESH_GLYPH[fresh]}</span> {p.seenBefore}/{p.presented}
              {p.presented < 40 && (
                <span style={{ color: 'var(--bad)' }} title="Ofullständigt pass">
                  {' '}
                  · {p.presented}/40
                </span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ShelfLead({ pass }: { pass: PassOption | null }) {
  if (!pass) return null
  return (
    <RailSection meta="Föreslaget">
      <button
        type="button"
        className="ppa-reset"
        aria-label="Starta föreslaget pass"
        style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}
      >
        <span className="ppa-display" style={{ fontSize: 20 }}>
          {formatSitting(pass.examId)}
          <span style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--ink-2)' }}>
            {' '}
            · {formatPass(pass.provpass)}
          </span>
        </span>
        <span className="ppa-mono" style={{ color: 'var(--muted)' }}>
          minst sett · {pass.seenBefore}/{pass.presented}
        </span>
        <span className="ppa-lead-start" style={{ marginTop: 0 }}>
          Starta →
        </span>
      </button>
    </RailSection>
  )
}

function ShelfRows({ groups }: { groups: YearGroup[] }) {
  return (
    <div>
      {groups.map((g) => (
        <div key={g.year} className="ppa-shelf-row">
          <div className="ppa-row" style={{ rowGap: 8 }}>
            <div className="ppa-shelf-year">{g.year}</div>
            <div className="ppa-spine" />
            <div className={`ppa-editions${g.sittings.length === 1 ? ' is-single' : ''}`}>
              {g.sittings.map((s) => (
                <EditionCard key={s.examId} sitting={s} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function Ppa2Page({
  half,
  onHalf,
  passes,
  fixture,
}: {
  half: MockHalf
  onHalf: (h: MockHalf) => void
  passes: PassOption[]
  fixture: boolean
}) {
  const groups = useMemo(() => groupByYear(passes, half), [passes, half])
  return (
    <>
      <PickerHead half={half} onHalf={onHalf} fixture={fixture} />
      <ShelfLead pass={suggestedOf(passes, half)} />
      <RailSection meta="Arkivet">
        <p className="ppa-legend" style={{ margin: '0 0 12px' }}>
          ○ osedd · ◐ delvis sedd · ● helt sedd
        </p>
        {groups.length === 0 ? (
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              color: 'var(--ink-2)',
            }}
          >
            Laddar arkivet …
          </p>
        ) : (
          <ShelfRows groups={groups} />
        )}
      </RailSection>
    </>
  )
}

// ── Exported concepts: phone + desktop artboards each ────────────────

function ConceptStage({
  name,
  phoneShot,
  desktopShot,
  Page,
}: {
  name: string
  phoneShot: string
  desktopShot: string
  Page: (p: {
    half: MockHalf
    onHalf: (h: MockHalf) => void
    passes: PassOption[]
    fixture: boolean
  }) => React.ReactElement
}) {
  const { passes, fixture } = useAuthenticPasses()
  const [half, setHalf] = useState<MockHalf>('verbal')
  return (
    <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <style>{CSS}</style>
      <div>
        <StageLabel>{name} · Phone · 390×844</StageLabel>
        <PhoneArtboard shot={phoneShot}>
          <Page half={half} onHalf={setHalf} passes={passes} fixture={fixture} />
        </PhoneArtboard>
      </div>
      <div style={{ minWidth: 0 }}>
        <StageLabel>{name} · Desktop · 1440</StageLabel>
        <DesktopArtboard shot={desktopShot}>
          <Page half={half} onHalf={setHalf} passes={passes} fixture={fixture} />
        </DesktopArtboard>
      </div>
    </div>
  )
}

/** PPA1 · Innehållet — frontispiece lead + year-grouped table of
 *  contents with exposure as the page-number column. */
export function PPA1() {
  return (
    <ConceptStage
      name="PPA1 · Innehållet"
      phoneShot="ppa1-phone"
      desktopShot="ppa1-desktop"
      Page={Ppa1Page}
    />
  )
}

/** PPA2 · Utgåvorna — the edition shelf: one card per sitting, year
 *  numerals as rail spines, pass lines with freshness glyphs. */
export function PPA2() {
  return (
    <ConceptStage
      name="PPA2 · Utgåvorna"
      phoneShot="ppa2-phone"
      desktopShot="ppa2-desktop"
      Page={Ppa2Page}
    />
  )
}
