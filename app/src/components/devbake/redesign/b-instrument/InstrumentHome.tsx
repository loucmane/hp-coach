// Instrument · Idag. Deliberately sparse, and keyboard-native: the panel
// is ruled into cells, not filled with cards. On top, the greeting and the
// day as one time bar (each part on its slot of the clock). Then the day as
// a command list: its first row — selected, the tallest, holding the
// screen's only filled action — resumes the text in progress; ↑/↓ move the
// selection through the plan's parts (the time bar follows) and ↵ opens the
// selected one; the digits stay with the bake-off switcher. At the foot,
// one readout band in three cells: the prognosis on a fixed 0–2,0 scale
// with its caveat, the trap that matters now, the recent passes.

import { ArrowRight, ChevronRight, TrendingUp } from 'lucide-react'
import { useState } from 'react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtDelta, fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { PrognosisView } from '@/components/devbake/redesign/viewModel'
import { Kc, Segs } from './parts'

const DEVICE_DEFINITE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

const WORDS = ['noll', 'en', 'två', 'tre', 'fyra', 'fem']

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)

type Slot = { id: string; title: string; from: number; to: number }

export function InstrumentHome({
  width,
  live,
  onResume,
  onHistory,
}: {
  width: WidthKey
  live: boolean
  onResume: () => void
  onHistory: () => void
}) {
  const { data, actions } = useDirectionData()
  const {
    resume: RESUME,
    plan: PLAN,
    prognosis: PROGNOSIS,
    recent: RECENT,
    today: TODAY,
    traps: TRAPS,
  } = data.home
  const phone = width === 'phone'
  const left = RESUME ? RESUME.total - RESUME.answered : 0
  const next = PLAN.items.find((i) => i.primary) ?? PLAN.items[0]
  const trap = TRAPS.find((t) => t.rising) ?? TRAPS[0]
  const right = RECENT.reduce((n, r) => n + r.correct, 0)
  const asked = RECENT.reduce((n, r) => n + r.total, 0)

  // The rest of the day on the clock: the text in progress, then the plan.
  let t = 0
  const slots: Slot[] = [
    ...(RESUME?.minutesLeft != null
      ? [{ id: 'resume', title: RESUME.title, minutes: RESUME.minutesLeft }]
      : []),
    ...PLAN.items.map((i) => ({ id: i.id, title: i.title, minutes: i.minutes })),
  ].map(({ id, title, minutes }) => {
    const from = t
    t += minutes
    return { id, title, from, to: t }
  })

  // Row 0 resumes; rows 1… open the plan's parts.
  const runs = [
    ...(RESUME ? [onResume] : []),
    ...PLAN.items.map((item) => () => actions.openPlanItem(item.id)),
  ]
  const [active, setActive] = useState(0)
  const move = (step: number) => {
    if (runs.length) setActive((a) => (a + step + runs.length) % runs.length)
  }
  useKeyMap(
    {
      Enter: () => runs[active]?.(),
      ArrowDown: () => move(1),
      ArrowUp: () => move(-1),
    },
    live,
  )

  return (
    <div className={phone ? 'in-phome' : 'in-home'}>
      <div className="in-greet">
        <h1>{TODAY.greeting}</h1>
        <p>
          {RESUME
            ? `${cap(WORDS[left] ?? String(left))} frågor kvar i texten du läser.`
            : 'Din övning börjar här.'}
          {next
            ? ` ${RESUME ? 'Sedan' : 'Nästa:'} ${next.title.toLowerCase()}, ${next.minutes} min.`
            : ''}
        </p>
      </div>

      <section className="in-cmds" aria-labelledby="in-day-h">
        <header className="in-day">
          <div className="in-day-head">
            <h2 id="in-day-h">Dagen</h2>
            <span>{runs.length} delar</span>
            <span className="in-spacer" />
            {(!RESUME || RESUME.minutesLeft != null) && t > 0 ? (
              <span className="in-day-total">{t} min</span>
            ) : null}
          </div>
          {(!RESUME || RESUME.minutesLeft != null) && t > 0 ? (
            <DayBar slots={slots} active={active} total={t} />
          ) : null}
        </header>
        <ol>
          {RESUME ? (
            <li className="in-cmd in-lead" data-active={String(active === 0)}>
              <div className="in-lead-main">
                <p className="in-lead-top">
                  <span className="in-code">{RESUME.section}</span>
                  <span className="in-lead-kind">Påbörjad övning</span>
                  {RESUME.pausedAt ? (
                    <span className="in-sub in-lead-when">
                      · pausad {RESUME.pausedAt.replace('Idag · ', 'idag ')}
                      {RESUME.device
                        ? ` på ${DEVICE_DEFINITE[RESUME.device] ?? RESUME.device}`
                        : ''}
                    </span>
                  ) : null}
                </p>
                <h3 className="in-lead-title" id="in-resume-title">
                  {RESUME.title}
                </h3>
                <p className="in-lead-sub">{RESUME.subtitle}</p>
                <div className="in-lead-meter">
                  <span className="in-lead-q">
                    Fråga {RESUME.position} av {RESUME.total}
                  </span>
                  <Segs
                    total={RESUME.total}
                    done={RESUME.answered}
                    now={RESUME.answered}
                    label={`${RESUME.answered} av ${RESUME.total} besvarade, fråga ${RESUME.position} väntar`}
                  />
                  <span className="in-sub">
                    {RESUME.answered} besvarade
                    {RESUME.minutesLeft != null ? ` · ca ${RESUME.minutesLeft} min kvar` : ''}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="in-btn in-lead-btn"
                onClick={onResume}
                onFocus={() => setActive(0)}
                aria-describedby="in-resume-title"
                data-testid="rd-resume"
              >
                Fortsätt
                <Kc>↵</Kc>
              </button>
            </li>
          ) : null}
          {PLAN.items.map((item, i) => {
            const row = i + (RESUME ? 1 : 0)
            const on = active === row
            const slot = slots.find((s) => s.id === item.id)
            return (
              <li key={item.id} className="in-cmd" data-active={String(on)}>
                <button
                  type="button"
                  className="in-cmd-row"
                  onClick={runs[row]}
                  onFocus={() => setActive(row)}
                >
                  <span className="in-code" aria-hidden>
                    {item.section ?? 'REP'}
                  </span>
                  <span className="in-cmd-main">
                    <span className="in-cmd-title">
                      {item.title} {item.detail ? <span>· {item.detail}</span> : null}
                      {item.primary ? <span className="in-tag">Nästa</span> : null}
                    </span>
                    <span className="in-cmd-why">{item.rationale}</span>
                  </span>
                  <span className="in-cmd-min">
                    <span className="in-sr">Minut </span>
                    {slot && (!RESUME || RESUME.minutesLeft != null)
                      ? `${slot.from}–${slot.to}`
                      : item.minutes}
                    <span className="in-cmd-unit"> min</span>
                  </span>
                  <span className="in-cmd-go" aria-hidden>
                    {on && !phone ? (
                      <Kc>↵</Kc>
                    ) : (
                      <ChevronRight size={16} strokeWidth={1.5} aria-hidden />
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="in-band" aria-label="Läget">
        <div className="in-cell">
          <h2 className="in-cell-head">
            <span>Prognos</span>
            <span className="in-cell-ro">
              {PROGNOSIS.weeks?.length ? `${PROGNOSIS.weeks.length} veckor · ` : ''}0–2,0
            </span>
          </h2>
          <div className="in-cell-body">
            <p className="in-prog-line">
              <span
                className="in-prog-n"
                aria-describedby={PROGNOSIS.caveat ? 'in-caveat' : undefined}
              >
                {PROGNOSIS.total != null ? fmtScore(PROGNOSIS.total) : '—'}
                {PROGNOSIS.caveat ? <sup aria-hidden>*</sup> : null}
              </span>
              <span className="in-prog-of">/ 2,0</span>
              {PROGNOSIS.delta != null ? (
                <span className="in-delta">
                  <TrendingUp size={14} strokeWidth={1.75} aria-hidden />{' '}
                  {fmtDelta(PROGNOSIS.delta)} sedan förra veckan
                </span>
              ) : null}
            </p>
            <Chart prognosis={PROGNOSIS} />
            {PROGNOSIS.caveat ? (
              <p className="in-caveat" id="in-caveat">
                <span aria-hidden>*</span>
                <span>{PROGNOSIS.caveat}</span>
              </p>
            ) : null}
          </div>
        </div>

        {trap ? (
          <div className="in-cell">
            <h2 className="in-cell-head">
              <span>Fälla just nu</span>
              <span className="in-cell-ro">{trap.section}</span>
            </h2>
            <div className="in-cell-body">
              <p className="in-trap-name">{trap.name}</p>
              <p className="in-trap-pattern">{trap.pattern}</p>
              <p className="in-trap-meta">
                <span className="in-num">{trap.count}</span>
                <span>gånger{trap.rising ? ', fler än förra veckan' : ''}</span>
              </p>
            </div>
          </div>
        ) : null}

        <div className="in-cell">
          <h2 className="in-cell-head">
            <span>Senaste pass</span>
            <span className="in-cell-ro">
              {right}/{asked} rätt
            </span>
          </h2>
          <div className="in-cell-body">
            <table className="in-mini">
              <tbody>
                {RECENT.map((r) => (
                  <tr key={r.id}>
                    <th scope="row">{r.label}</th>
                    <td className="in-num">{`${r.correct}/${r.total}`}</td>
                    <td>{r.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button type="button" className="in-link" onClick={onHistory}>
              Alla pass i Framsteg
              <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

/** The rest of the day as one time bar: each part on its slot of the
 *  clock, the selected one in ink, ticks (minutes from now) where the
 *  parts meet; the unit is in the head above. */
function DayBar({ slots, active, total }: { slots: Slot[]; active: number; total: number }) {
  return (
    <div className="in-daybar-wrap">
      <div
        className="in-daybar"
        role="img"
        aria-label={`Dagen i minuter: ${slots.map((s) => `${s.title} ${s.from}–${s.to}`).join(', ')}`}
      >
        {slots.map((s, i) => (
          <i key={s.id} data-on={String(i === active)} style={{ flex: s.to - s.from }} />
        ))}
      </div>
      <div className="in-ticks" aria-hidden>
        {[0, ...slots.map((s) => s.to)].map((m) => (
          <span key={m} style={{ left: `${(m / total) * 100}%` }}>
            {m}
          </span>
        ))}
      </div>
    </div>
  )
}

/** The weekly prognosis on a fixed 0–2,0 scale (so a small rise looks
 *  small), with the likely range this week as a band at the end. */
function Chart({ prognosis: PROGNOSIS }: { prognosis: PrognosisView }) {
  const weeks = PROGNOSIS.weeks
  if (!weeks?.length) return null
  const W = 296
  const H = 76
  const x0 = 30
  const top = 6
  const bottom = 66
  const y = (v: number) => bottom - (v / 2) * (bottom - top)
  const n = weeks.length
  const x = (i: number) => x0 + (i / Math.max(1, n - 1)) * (W - x0 - 8)
  const line = weeks.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(v).toFixed(1)}`)
  const lx = x(n - 1)
  return (
    <svg
      className="in-chart"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Prognosen de senaste ${n} veckorna på skalan 0 till 2,0: ${weeks.map(fmtScore).join(', ')}.${PROGNOSIS.low != null && PROGNOSIS.high != null ? ` Trolig nivå nu ${fmtScore(PROGNOSIS.low)} till ${fmtScore(PROGNOSIS.high)}.` : ''}`}
    >
      {[0, 1, 2].map((v) => (
        <g key={v}>
          <line className="in-chart-grid" x1={x0} x2={W} y1={y(v)} y2={y(v)} />
          <text x={0} y={y(v) + 4}>
            {v === 0 ? '0' : fmtScore(v)}
          </text>
        </g>
      ))}
      {PROGNOSIS.low != null && PROGNOSIS.high != null ? (
        <rect
          className="in-chart-band"
          x={lx - 5}
          width={10}
          y={y(PROGNOSIS.high)}
          height={y(PROGNOSIS.low) - y(PROGNOSIS.high)}
          rx={1}
        />
      ) : null}
      <path className="in-chart-line" d={line.join(' ')} />
      {PROGNOSIS.total != null ? (
        <circle className="in-chart-dot" cx={lx} cy={y(PROGNOSIS.total)} r={3.5} />
      ) : null}
    </svg>
  )
}
