import type { ComponentProps } from 'react'
import { type HomeView, nextUp, tomorrowLine } from './idagView'

export type NavigateHref = (href: string) => void

/** Native anchors preserve open-in-new-tab and modified-click behavior. */
export function IdagLink({
  navigateHref,
  href,
  onClick,
  ...props
}: ComponentProps<'a'> & { href: string; navigateHref: NavigateHref }) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return
        event.preventDefault()
        navigateHref(href)
      }}
    />
  )
}

const CONTINUE = 'Vill du fortsätta? Öva en sektion →'
const DEVICE: Record<string, string> = {
  telefon: 'telefonen',
  dator: 'datorn',
  surfplatta: 'surfplattan',
}

export function IdagLead({ view, navigateHref }: { view: HomeView; navigateHref: NavigateHref }) {
  const { resume, state } = view
  const first = view.plan.items[0]
  const lead = view.plan.items.find((i) => !i.completed)
  const next = nextUp(view)
  const tomorrow = tomorrowLine(view)
  if (resume) {
    const when = resume.stale
      ? 'Påbörjad för mer än en vecka sedan'
      : `Påbörjad ${resume.pausedAt.replace('Idag · ', 'idag ')}`
    return (
      <section className="fa-resume" aria-labelledby="fa-resume-title">
        <span className="fa-ribbon" aria-hidden />
        <div className="fa-resume-top">
          <span className="fa-label">Påbörjad{resume.section ? ` · ${resume.section}` : ''}</span>
          <span className="fa-resume-when">
            {when}
            {resume.device ? ` på ${DEVICE[resume.device] ?? resume.device}` : ''}
          </span>
        </div>
        <h2 className="fa-resume-title" id="fa-resume-title">
          {resume.title}
        </h2>
        <div className="fa-resume-progress">
          {resume.total != null && resume.position != null ? (
            <>
              <span
                className="fa-dots"
                role="img"
                aria-label={`${resume.answered} av ${resume.total} besvarade`}
              >
                {Array.from({ length: Math.min(resume.total, 40) }, (_, i) => (
                  <i
                    // biome-ignore lint/suspicious/noArrayIndexKey: fixed question positions
                    key={i}
                    data-state={
                      i < (resume.answered ?? 0) ? 'done' : i === resume.answered ? 'now' : 'todo'
                    }
                  />
                ))}
              </span>
              <span>
                Fråga {resume.position} av {resume.total}
              </span>
            </>
          ) : (
            <span>{resume.progress}</span>
          )}
        </div>
        <div className="fa-resume-foot">
          <IdagLink
            className="fa-btn fa-btn--big"
            href={resume.href}
            navigateHref={navigateHref}
            data-testid="home-resumption-link"
          >
            {resume.section === 'LÄS' || resume.section === 'ELF' ? 'Fortsätt läsa' : 'Fortsätt'}{' '}
            <span aria-hidden>→</span>
          </IdagLink>
        </div>
      </section>
    )
  }
  if (state === 'loading' || state === 'error')
    return (
      <section
        className="fa-resume"
        data-testid={state === 'loading' ? 'daily-plan-skeleton' : 'daily-plan-error'}
        aria-labelledby="fa-plan-loading"
      >
        <h2 className="fa-h2" id="fa-plan-loading">
          Dagens plan
        </h2>
        <p className="fa-empty" role="status">
          {state === 'loading'
            ? 'Laddar dagens plan…'
            : 'Gick inte att hämta planen just nu — försöker igen automatiskt.'}
        </p>
      </section>
    )
  if (state === 'onboarding' && first)
    return (
      <section
        className="fa-resume fa-end"
        data-testid="daily-plan-complete"
        aria-labelledby="fa-first-title"
      >
        <h2 className="fa-lead-title" id="fa-first-title">
          <IdagLink href={first.href} navigateHref={navigateHref}>
            Första passet · klart ✓
          </IdagLink>
        </h2>
        <IdagLink className="fa-link fa-continue" href="/ova" navigateHref={navigateHref}>
          {CONTINUE}
        </IdagLink>
      </section>
    )
  if (state === 'cold' && first)
    return (
      <section className="fa-resume" aria-labelledby="fa-first-title">
        <h2 className="fa-lead-title" id="fa-first-title">
          Börja här.
        </h2>
        <p className="fa-empty">{first.rationale}</p>
        <div className="fa-resume-foot">
          <IdagLink
            className="fa-btn fa-btn--big"
            href="/diagnostik?start=1"
            navigateHref={navigateHref}
            data-testid="daily-plan-first-cta"
          >
            Starta första övningen →
          </IdagLink>
        </div>
      </section>
    )
  if (state === 'complete')
    return (
      <section
        className="fa-resume fa-end"
        data-fa-quiet="true"
        data-testid="daily-plan-complete"
        aria-labelledby="fa-end-title"
      >
        <h2 className="fa-lead-title" id="fa-end-title">
          Allt i dagens plan är gjort
        </h2>
        <p className="fa-empty">Allt du gjort är sparat.</p>
        <div className="fa-resume-foot">
          <IdagLink
            className="fa-btn fa-btn--big"
            data-fa-next
            href={next.href}
            navigateHref={navigateHref}
          >
            {next.label} <span aria-hidden>→</span>
          </IdagLink>
          {next.why ? <span className="fa-hint">{next.why}</span> : null}
        </div>
        <IdagLink className="fa-link fa-continue" href="/ova" navigateHref={navigateHref}>
          {CONTINUE}
        </IdagLink>
        {tomorrow ? <p className="fa-tomorrow">{tomorrow}</p> : null}
      </section>
    )
  if (lead)
    return (
      <section className="fa-resume" aria-labelledby="fa-lead-title">
        <div className="fa-resume-top">
          <span className="fa-label">Först idag{lead.section ? ` · ${lead.section}` : ''}</span>
        </div>
        <h2 className="fa-resume-title" id="fa-lead-title">
          {lead.title}
        </h2>
        {lead.detail ? <p className="fa-resume-sub">{lead.detail}</p> : null}
        <div className="fa-resume-foot">
          <IdagLink className="fa-btn fa-btn--big" href={lead.href} navigateHref={navigateHref}>
            {lead.kind === 'mock' ? 'Öppna provpass' : 'Börja'} · {lead.minutes} min{' '}
            <span aria-hidden>→</span>
          </IdagLink>
          <span className="fa-hint">{lead.rationale}</span>
        </div>
      </section>
    )
  return (
    <section className="fa-resume" aria-labelledby="fa-empty-title">
      <h2 className="fa-lead-title" id="fa-empty-title">
        Välj vad du vill öva
      </h2>
      <div className="fa-resume-foot">
        <IdagLink className="fa-btn fa-btn--big" href={next.href} navigateHref={navigateHref}>
          {next.label} →
        </IdagLink>
      </div>
    </section>
  )
}
