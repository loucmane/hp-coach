import { DESTINATIONS } from '@/folio/nav'
import { daysUntil } from '@/lib/dates'
import {
  DrillQuestion,
  RootArticle,
  StepActions,
  StepBody,
  StepLinks,
  StepTitle,
  TodayPreview,
} from './WelcomeBrev'
import type { WelcomeFlow } from './welcomeFixtures'

export function WelcomeUppslag({ flow }: { flow: WelcomeFlow }) {
  return (
    <div className="wb-uppslag">
      <aside className="wb-rail" aria-label="Appmeny under välkomsten">
        <span className="wb-wordmark">
          HP<span>·</span>
          <em>Coach</em>
        </span>
        <div className="wb-rail-items">
          {DESTINATIONS.map(({ id, label }) => (
            <button key={id} type="button" disabled>
              {label}
            </button>
          ))}
        </div>
        <span className="wb-rail-account">Kim · Konto</span>
      </aside>
      <div className="wb-spread-main">
        <header className="wb-masthead">
          <span>Välkommen</span>
          <button type="button" className="wb-link" onClick={flow.goToday}>
            Hoppa över
          </button>
        </header>
        <StepLinks flow={flow} />
        <div className="wb-spread">
          <div className="wb-spread-left">
            <StepTitle flow={flow} />
            <StepBody flow={flow} spread />
            <StepActions flow={flow} skip={false} drill={false} />
          </div>
          <div className="wb-spread-right">
            <p className="wb-preview-label">
              {flow.sel.s === 4
                ? 'Uppslag · ORD'
                : flow.sel.s === 5
                  ? 'Första passet · ORD'
                  : 'Så ser det ut'}
            </p>
            {flow.sel.s === 2 ? (
              <section className="wb-countdown" aria-label="Ditt prov">
                <p className="wb-eyebrow">Idag · ditt prov</p>
                {flow.sitting ? (
                  <>
                    <p className="wb-countdown-line">
                      <strong>{daysUntil(flow.sitting.date)}</strong> dagar ·{' '}
                      {flow.sitting.label.toLocaleLowerCase('sv-SE')}
                    </p>
                    <p>
                      {flow.sitting.date.toLocaleDateString('sv-SE', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </>
                ) : (
                  <p>Nästa provdatum är inte publicerat här än.</p>
                )}
              </section>
            ) : flow.sel.s === 3 ? (
              <section className="wb-saved-choice" aria-label="Ditt tidsval">
                <p className="wb-eyebrow">Konto · tid per dag</p>
                <p>
                  <strong>{flow.minutes}</strong> minuter
                </p>
                <p>Ditt val sparas.</p>
              </section>
            ) : flow.sel.s === 4 ? (
              <RootArticle />
            ) : flow.sel.s === 5 ? (
              <>
                <DrillQuestion flow={flow} />
                <div className="wb-drill-action">
                  <button
                    className="wb-primary"
                    type="button"
                    disabled={!flow.picks[flow.question]}
                    onClick={flow.revealed ? flow.nextQuestion : flow.reveal}
                  >
                    {flow.revealed
                      ? flow.question === 2
                        ? 'Se din start →'
                        : 'Nästa fråga →'
                      : 'Visa svar'}
                  </button>
                </div>
              </>
            ) : (
              <TodayPreview flow={flow} />
            )}
          </div>
        </div>
      </div>
      <nav className="wb-mobile-tabs" aria-label="Appmeny under välkomsten, telefon">
        {DESTINATIONS.map(({ id, label }) => (
          <button key={id} type="button" disabled>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
