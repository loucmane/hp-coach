// Samtal · Öva — what to practise next, as a short exchange.
//
// The conversation opens with its date, then the coach says one useful
// thing, with its reason:
//   - the practice you left half-done ("Du har LÄS på gång, fråga 3 av 4.
//     Fortsätta där du var?"), and in a second turn the section it would
//     suggest otherwise;
//   - else the suggested section ("XYZ är mitt förslag idag – där behöver
//     du mest övning just nu. Ska vi öva XYZ?");
//   - else an open invitation ("Välj något att börja med.").
// At most two replies wait on your side: the one action (Fortsätt
// övningen, Öva XYZ or Börja blandat) and the next best.
// Below a quiet line, the practice itself is one message card: the eight
// sections as reply-shaped doors in their two stable groups (verbal,
// kvantitativ) — code, level and the misses waiting. The suggestion is
// tagged, never moved. A door starts its drill at once. Then Repetera, a
// card of its own that stays there at zero: what is ready now and today's
// pile. Last, the traps that keep coming back, said as one line; each one
// starts practice on that trap.

import { ArrowRight } from 'lucide-react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { Half, OvaSectionView } from '@/components/devbake/redesign/viewModel'
import type { Section } from '@/data/questions'
import { Coach, count, cx, Divider, Kbd, Replies } from './SamtalParts'

/** A section code in a test id: lower-case ASCII ('LÄS' → 'las'). */
export function slug(section: Section): string {
  return section.toLocaleLowerCase('sv-SE').replace('ä', 'a')
}

const GROUPS: { half: Half; label: string }[] = [
  { half: 'verbal', label: 'Verbal del' },
  { half: 'kvant', label: 'Kvantitativ del' },
]

type Reply = { key: 'resume' | 'suggested' | 'mixed'; label: string; onClick: () => void }

export function SamtalOva({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { ova, home } = data
  const resume = home.resume && !home.resume.stale ? home.resume : null
  const suggested = ova.weakest
    ? (ova.sections.find((s) => s.section === ova.weakest) ?? null)
    : null

  // The one action and the next best, in this order of preference.
  const candidates: Reply[] = []
  if (resume)
    candidates.push({ key: 'resume', label: 'Fortsätt övningen', onClick: actions.resume })
  if (suggested) {
    candidates.push({
      key: 'suggested',
      label: `Öva ${suggested.section}`,
      onClick: () => actions.startDrill({ kind: 'section', section: suggested.section }),
    })
  }
  candidates.push({
    key: 'mixed',
    label: 'Börja blandat',
    onClick: () => actions.startDrill({ kind: 'mixed' }),
  })
  const replies = candidates.slice(0, 2)
  const mixedReply = replies.some((r) => r.key === 'mixed')
  useKeyMap({ Enter: replies[0].onClick }, live)

  const why = 'där behöver du mest övning just nu.'
  const rep = ova.repetera

  return (
    <div className="sa-ova" data-width={width}>
      <Divider>{home.today.dateLabel}</Divider>

      <div className="sa-thread">
        <Coach as="section" kind="sa-turn--lead" aria-labelledby="sa-ova-q">
          {resume ? (
            <p className="sa-hello">
              Du har {resume.section} på gång, fråga&nbsp;{resume.position}&nbsp;av&nbsp;
              {resume.total}.
            </p>
          ) : suggested ? (
            <p className="sa-hello">
              <b>{suggested.section}</b> är mitt förslag idag – {why}
            </p>
          ) : null}
          <h1 className="sa-lead-q" id="sa-ova-q" tabIndex={-1}>
            {resume
              ? 'Fortsätta där du var?'
              : suggested
                ? `Ska vi öva ${suggested.section}?`
                : 'Välj något att börja med.'}
          </h1>
        </Coach>
        {resume && suggested ? (
          <Coach>
            <p className="sa-say">
              Annars föreslår jag {suggested.section} – {why}
            </p>
          </Coach>
        ) : null}
        <Replies>
          {replies.map((r, i) => (
            <button
              key={r.key}
              type="button"
              className={cx('sa-chip', 'sa-chip--big', i === 0 && 'sa-chip--primary')}
              onClick={r.onClick}
              data-testid={r.key === 'mixed' ? 'rd-ova-mixed' : undefined}
            >
              {r.label}
              {i === 0 ? <Kbd>↵</Kbd> : null}
            </button>
          ))}
        </Replies>
      </div>

      <div className="sa-later">
        <Divider quiet>Allt du kan öva</Divider>
        <div className="sa-cards">
          <section className="sa-card sa-card--doors" aria-labelledby="sa-ova-doors-h">
            <header className="sa-card-head">
              <h2 id="sa-ova-doors-h">Öva ett delprov</h2>
              <span>Nivå av 2,0 · missar som väntar</span>
            </header>
            {GROUPS.map((g) => (
              <div className="sa-doorgroup" key={g.half}>
                <h3 className="sa-doorgroup-h" id={`sa-ova-${g.half}`}>
                  {g.label}
                </h3>
                <ul className="sa-practice" aria-labelledby={`sa-ova-${g.half}`}>
                  {ova.sections
                    .filter((s) => s.half === g.half)
                    .map((s) => (
                      <li key={s.section}>
                        <PracticeDoor
                          s={s}
                          suggested={s.section === suggested?.section}
                          onStart={() =>
                            actions.startDrill({ kind: 'section', section: s.section })
                          }
                        />
                      </li>
                    ))}
                </ul>
              </div>
            ))}
            {mixedReply ? null : (
              <button
                type="button"
                className="sa-practice-mixed"
                data-testid="rd-ova-mixed"
                onClick={() => actions.startDrill({ kind: 'mixed' })}
              >
                <span className="sa-practice-code">Blandat</span>
                <span className="sa-practice-meta">
                  {count(ova.mixed.questions, 'fråga', 'frågor')} från alla delprov
                </span>
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </section>

          <section className="sa-card sa-card--rep" aria-labelledby="sa-ova-rep-h">
            <header className="sa-card-head">
              <h2 id="sa-ova-rep-h">Repetera</h2>
              <span>{rep.pile > 0 ? `${rep.pile} i dagens hög` : 'Högen är tom'}</span>
            </header>
            <div className="sa-rep-row">
              <p className="sa-rep-now">
                {rep.dueNow > 0 ? (
                  <>
                    <b>{rep.dueNow}</b> {rep.dueNow === 1 ? 'miss är redo' : 'missar är redo'} nu.
                  </>
                ) : rep.pile > 0 ? (
                  'Inget redo just nu.'
                ) : (
                  'Inga missar att repetera.'
                )}
              </p>
              <button
                type="button"
                className="sa-chip"
                data-testid="rd-ova-repetera"
                onClick={actions.openRepetera}
              >
                {rep.dueNow > 0
                  ? `Visa de ${rep.dueNow} som är redo`
                  : rep.pile > 0
                    ? 'Visa dagens hög'
                    : 'Öppna Repetera'}
                <ArrowRight size={16} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </section>

          {ova.weakTraps.length ? (
            <Coach as="section" kind="sa-turn--line" aria-labelledby="sa-ova-traps-h">
              <h2 className="sa-line-h" id="sa-ova-traps-h">
                Fällor som återkommer
              </h2>
              <ul className="sa-traps">
                {ova.weakTraps.slice(0, 3).map((t) => (
                  <li key={t.frameworkId}>
                    <button
                      type="button"
                      className="sa-trap-chip"
                      onClick={() =>
                        actions.startDrill({
                          kind: 'framework',
                          frameworkId: t.frameworkId,
                          section: t.section,
                        })
                      }
                    >
                      <span className="sa-sr">Öva på fällan</span> <b>{t.name}</b>{' '}
                      <span className="sa-trap-chip-meta">
                        {t.section} · {count(t.count, 'gång', 'gånger')}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Coach>
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** A section as a reply you can give: its code, the suggestion's tag, its
 *  level and the misses waiting. The full name is read out first. (The
 *  spaces stand between the parts, outside the hidden words, so the name
 *  reads whole wherever it is computed; flex drops them from the layout.) */
function PracticeDoor({
  s,
  suggested,
  onStart,
}: {
  s: OvaSectionView
  suggested: boolean
  onStart: () => void
}) {
  return (
    <button
      type="button"
      className="sa-practice-door"
      data-testid={`rd-ova-section-${slug(s.section)}`}
      data-suggested={String(suggested)}
      onClick={onStart}
    >
      <span className="sa-practice-top">
        <span className="sa-sr">{s.name},</span>{' '}
        <span className="sa-practice-code">{s.section}</span>
        {suggested ? (
          <>
            {' '}
            <span className="sa-plan-tag">Förslag</span>
          </>
        ) : null}
      </span>{' '}
      <span className="sa-practice-meta">
        <span>
          {s.score != null ? (
            <>
              nivå&nbsp;{fmtScore(s.score)} <span className="sa-sr">av 2,0</span>
            </>
          ) : (
            'inte övat än'
          )}
        </span>
        {s.waiting > 0 ? (
          <>
            {' '}
            <span>{s.waiting}&nbsp;väntar</span>
          </>
        ) : null}
      </span>
    </button>
  )
}
