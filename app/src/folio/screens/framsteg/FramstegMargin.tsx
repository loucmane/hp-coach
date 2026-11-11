import { inWords } from '@/folio/lib/format'
import { VERBAL_SECTIONS } from '@/lib/scoring'
import { UHR_DELPROV } from '@/lib/uhrPacing'
import { FramstegLink, type NavigateHref } from './FramstegReport'
import { FIRST_TRY_NOTE, type FramstegView } from './framstegView'

// The shared route still supplies these; the core no longer presents a mastery margin.
export type MasteryProps = {
  patternsHeld?: { mastered: number; total: number }
  userId?: string | null
}

export function FramstegMargin({
  view,
  navigateHref,
}: {
  view: FramstegView
  navigateHref: NavigateHref
}) {
  const repetition = view.repetition
  const passMinutes = VERBAL_SECTIONS.reduce(
    (sum, section) => sum + UHR_DELPROV[section].minutes,
    0,
  )
  return (
    <>
      <section className="fa-more-ways" aria-labelledby="fa-fr-more-h">
        <h2 className="fa-h3" id="fa-fr-more-h">
          Fler sätt att smalna intervallet
        </h2>
        <FramstegLink href={repetition.href} navigateHref={navigateHref}>
          <span>
            <b>
              Repetera
              {repetition.count && repetition.minutes
                ? ` · ${inWords(repetition.count)} ${repetition.count === 1 ? 'fråga' : 'frågor'}, ca ${repetition.minutes} min`
                : ''}
            </b>
            <span className="fa-way-note">
              Missar som kommer tillbaka i rätt tid är de billigaste poängen.
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </FramstegLink>
        <FramstegLink href="/prov" navigateHref={navigateHref}>
          <span>
            <b>Ett riktigt provpass · {passMinutes} min</b>
            <span className="fa-way-note">
              Ett verbalt pass ger LÄS, MEK och ELF {inWords(UHR_DELPROV.LÄS.questions)} svar var.
            </span>
          </span>
          <span aria-hidden="true">→</span>
        </FramstegLink>
      </section>
      <div className="fa-footnotes">
        {view.prognosis.caveat ? (
          <p className="fa-footnote" id="fa-fr-caveat">
            {view.prognosis.caveat}
          </p>
        ) : null}
        <p className="fa-footnote" data-testid="progress-first-try-note">
          {FIRST_TRY_NOTE} Det är en linjär skattning, inte UHR:s normering. Alla pass finns i{' '}
          <FramstegLink
            className="fa-link"
            href="/historik"
            navigateHref={navigateHref}
            data-testid="progress-historik"
          >
            Historik
          </FramstegLink>
          .
        </p>
      </div>
    </>
  )
}
