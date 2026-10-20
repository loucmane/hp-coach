// Folio · Öva — the practice hub as a book's table of contents. The
// masthead names the place; the standfirst says what the schedule suggests
// (the only place it is said). The lead, under the heavy rule, is the one
// thing to do now — the repetition round when misses are ready, else the
// suggested section, else a mixed set — with the screen's one filled
// button, which ↵ presses. Then "Delproven" in two parts, Verbal and
// Kvantitativ: each section an entry with its code in the margin, its name
// and gloss, and leader dots to your level where a book prints the page
// number; Blandat closes the list after a hairline. The trap that matters
// now and the fine print are marginalia behind a column rule.
//
// Every entry starts its drill at once (actions.startDrill); the host
// opens it. Nothing here is a card, a chip or a tile.

import { ArrowRight } from 'lucide-react'

import { useDirectionData } from '@/components/devbake/redesign/directionData'
import { fmtScore, useKeyMap, type WidthKey } from '@/components/devbake/redesign/r1Kit'
import type { Half, OvaSectionView } from '@/components/devbake/redesign/viewModel'
import type { Section } from '@/data/questions'
import {
  ContentsEntry,
  capitalised,
  FolioPage,
  inWords,
  Lead,
  MarginBlock,
  Masthead,
  PartHead,
  scoreOrDash,
  slug,
} from './FolioHome'

/** What each section asks, in one line (proposed copy). */
export const GLOSS: Record<Section, string> = {
  ORD: 'Vilket ord betyder ungefär samma sak?',
  LÄS: 'Hela texter med frågor om innehåll',
  MEK: 'Meningar med luckor att fylla',
  ELF: 'Engelska texter med frågor om innehåll',
  XYZ: 'Räkna, förenkla och lös',
  KVA: 'Vilken av två kvantiteter är störst?',
  NOG: 'Räcker (1), (2) eller båda?',
  DTK: 'Hela figursidor med diagram, tabeller och kartor',
}

const PARTS: { half: Half; title: string }[] = [
  { half: 'verbal', title: 'Verbal del' },
  { half: 'kvant', title: 'Kvantitativ del' },
]

/** "5 missar väntar i Repetera" — said where the misses wait, so the entry
 *  (which starts a new drill) never poses as their door. */
function waitingNote(waiting: number): string | null {
  if (waiting <= 0) return null
  return `${waiting} ${waiting === 1 ? 'miss väntar' : 'missar väntar'} i Repetera`
}

export function FolioOva({ width, live }: { width: WidthKey; live: boolean }) {
  const { data, actions } = useDirectionData()
  const { ova, repetera, konto } = data
  const weakest = ova.sections.find((s) => s.section === ova.weakest) ?? null
  const due = ova.repetera.dueNow
  const pile = ova.repetera.pile
  const round = Math.min(due, repetera.sessionSize)
  // The plan's estimate for today's repetition is the round's time.
  const minutes = data.home.plan.items.find((i) => i.kind === 'repetition')?.minutes
  const lead: 'repetera' | 'section' | 'mixed' =
    due > 0 ? 'repetera' : weakest ? 'section' : 'mixed'
  const relearned = pile === 0 && data.framsteg.totals.mistakesResolved > 0
  const trap = ova.weakTraps.find((t) => t.rising) ?? ova.weakTraps[0]
  const questions = ova.mixed.questions
  const scoreless = ova.sections.some((s) => s.score == null)

  const startRound = () => actions.startDrill({ kind: 'repetition' })
  const startWeakest = () =>
    weakest && actions.startDrill({ kind: 'section', section: weakest.section })
  const startMixed = () => actions.startDrill({ kind: 'mixed' })
  const primary = lead === 'repetera' ? startRound : lead === 'section' ? startWeakest : startMixed
  useKeyMap({ Enter: primary }, live)

  const standfirst =
    lead === 'mixed'
      ? 'Välj ett delprov att öva, eller ta en blandad övning över alla åtta.'
      : lead === 'section'
        ? pile > 0
          ? `Inget är redo just nu – ${inWords(pile)} ${pile === 1 ? 'miss ligger' : 'missar ligger'} i dagens hög och blir redo senare idag.`
          : relearned
            ? 'Kön är tom just nu – allt du missat är återlärt.'
            : `Schemat föreslår ${weakest?.section} – svagast just nu. Välj fritt om du hellre tar något annat.`
        : weakest
          ? `Schemat föreslår ${weakest.section} – svagast just nu. Välj fritt om du hellre tar något annat.`
          : 'Välj fritt bland delproven, eller ta en blandad övning.'

  const leadBlock =
    lead === 'repetera' ? (
      <Lead labelledBy="fp-ova-lead">
        <div className="fp-resume-top">
          <span className="fp-label">Repetera · de äldsta först</span>
        </div>
        <h2 className="fp-lead-title" id="fp-ova-lead">
          {due > round
            ? `${round} av ${due} missar`
            : `${capitalised(inWords(round))} ${round === 1 ? 'miss' : 'missar'}`}
          {minutes != null ? `, ungefär ${minutes} minuter` : ''}
        </h2>
        {pile > due ? <p className="fp-lead-sub">{pile - due} till blir redo senare idag</p> : null}
        <div className="fp-resume-foot">
          <button type="button" className="fp-btn fp-btn--big" onClick={startRound}>
            Börja repetera
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
          <button
            type="button"
            className="fp-link"
            data-testid="rd-ova-repetera"
            aria-label={`Välj delprov att repetera, ${due} redo nu`}
            onClick={actions.openRepetera}
          >
            Välj delprov · {due} redo nu
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </Lead>
    ) : lead === 'section' && weakest ? (
      <Lead labelledBy="fp-ova-lead">
        <div className="fp-resume-top">
          <span className="fp-label">Förslag · {weakest.section}</span>
        </div>
        <h2 className="fp-lead-title" id="fp-ova-lead">
          {weakest.name}
        </h2>
        <p className="fp-lead-sub">{GLOSS[weakest.section]}</p>
        <div className="fp-resume-foot">
          <button type="button" className="fp-btn fp-btn--big" onClick={startWeakest}>
            Börja med {weakest.section}
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
          {pile > 0 ? (
            <button
              type="button"
              className="fp-link"
              data-testid="rd-ova-repetera"
              onClick={actions.openRepetera}
            >
              Kön i Repetera · {due} redo nu
              <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
            </button>
          ) : null}
        </div>
      </Lead>
    ) : (
      <Lead labelledBy="fp-ova-lead">
        <div className="fp-resume-top">
          <span className="fp-label">Börja här</span>
        </div>
        <h2 className="fp-lead-title" id="fp-ova-lead">
          Blandad övning
        </h2>
        <p className="fp-lead-sub">
          {capitalised(inWords(questions))} frågor över alla åtta delprov
        </p>
        <div className="fp-resume-foot">
          <button
            type="button"
            className="fp-btn fp-btn--big"
            onClick={startMixed}
            data-testid="rd-ova-mixed"
          >
            Börja blandad övning
            <kbd className="fp-kbd" aria-hidden>
              ↵
            </kbd>
          </button>
        </div>
        <p className="fp-empty">
          Inga missar än – när du svarar fel i en övning landar frågan här.
        </p>
      </Lead>
    )

  const main = (
    <>
      <h1 className="fp-greet">Vad tränar vi?</h1>
      <p className="fp-day">{standfirst}</p>
      {leadBlock}

      <section className="fp-section" aria-labelledby="fp-ova-parts">
        <div className="fp-section-head">
          <h2 className="fp-h2" id="fp-ova-parts">
            Delproven
          </h2>
          <span className="fp-meta">din nivå</span>
        </div>
        {PARTS.map((part) => (
          <div key={part.half} className="fp-part-block">
            <PartHead id={`fp-ova-${part.half}`}>{part.title}</PartHead>
            <ul aria-labelledby={`fp-ova-${part.half}`}>
              {ova.sections
                .filter((s) => s.half === part.half)
                .map((s) => (
                  <li key={s.section}>
                    <SectionEntry
                      s={s}
                      suggested={s.section === ova.weakest}
                      onStart={() => actions.startDrill({ kind: 'section', section: s.section })}
                    />
                  </li>
                ))}
            </ul>
          </div>
        ))}
        {lead === 'mixed' ? null : (
          <div className="fp-part-block fp-part-block--end">
            <ContentsEntry
              code=""
              title="Blandat"
              gloss={`${questions} frågor från alla åtta delprov`}
              why="En fråga i taget från varje delprov, i tur och ordning."
              label={`Blandad övning, ${questions} frågor från alla åtta delprov`}
              testId="rd-ova-mixed"
              onClick={startMixed}
            />
          </div>
        )}
        {scoreless ? (
          <p className="fp-footnote fp-footnote--plain">
            — betyder att nivån visas när du har svarat på några frågor i delprovet.
          </p>
        ) : null}
      </section>
    </>
  )

  const aside = (
    <>
      {trap ? (
        <MarginBlock id="fp-ova-trap-h" title="Fällan just nu">
          <p className="fp-trap-meta">
            <b>{trap.section}</b>
            <span>
              {trap.count} gånger
              {trap.rising ? (
                <>
                  <span aria-hidden> ↑</span>
                  <span className="fp-sr">, ökar</span>
                </>
              ) : null}
            </span>
          </p>
          <span className="fp-trap-name">{trap.name}</span>
          {trap.pattern ? <span className="fp-trap-pattern">{trap.pattern}</span> : null}
          <button
            type="button"
            className="fp-link"
            onClick={() =>
              actions.startDrill({
                kind: 'framework',
                frameworkId: trap.frameworkId,
                section: trap.section,
              })
            }
          >
            Öva detta mönster
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        </MarginBlock>
      ) : null}
      <MarginBlock id="fp-ova-about-h" title="Om övningarna">
        <p className="fp-margin-note">
          {capitalised(inWords(questions))} frågor åt gången – DTK några fler, eftersom en figursida
          aldrig delas. Ingen klocka. Avsluta när du vill; svaren sparas.
        </p>
        <p className="fp-margin-note">
          Frågeurval: <b>{konto.prefs.smartDrill ? 'smart' : 'slumpat'}</b>
        </p>
        <button type="button" className="fp-link" onClick={actions.openKonto}>
          Ändra i inställningarna
          <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      </MarginBlock>
    </>
  )

  return (
    <FolioPage
      width={width}
      masthead={<Masthead label="Öva" />}
      aside={aside}
      asideLabelledBy={trap ? 'fp-ova-trap-h' : 'fp-ova-about-h'}
    >
      {main}
    </FolioPage>
  )
}

/** A section's entry: code in the margin, name and gloss, leader dots to
 *  the level; the suggested one carries the accent rule in the margin. */
function SectionEntry({
  s,
  suggested,
  onStart,
}: {
  s: OvaSectionView
  suggested: boolean
  onStart: () => void
}) {
  const waiting = waitingNote(s.waiting)
  const level = s.score == null ? 'nivå visas efter några svar' : `nivå ${fmtScore(s.score)}`
  return (
    <div className="fp-entry" data-suggested={suggested ? 'true' : undefined}>
      <ContentsEntry
        code={s.section}
        title={s.name}
        page={scoreOrDash(s.score)}
        lining
        why={GLOSS[s.section]}
        note={waiting}
        label={[s.section, s.name, level, suggested ? 'föreslagen' : null, waiting]
          .filter(Boolean)
          .join(', ')}
        testId={`rd-ova-section-${slug(s.section)}`}
        onClick={onStart}
      />
    </div>
  )
}
