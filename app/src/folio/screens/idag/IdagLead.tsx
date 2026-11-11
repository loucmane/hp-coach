import type { ComponentProps, MouseEvent } from 'react'
import { Go } from '@/folio/ui/Go'
import { Lit } from '@/folio/ui/Lit'
import { SEC_KEY, SecChip } from '@/folio/ui/SecChip'
import { type HomeView, nextUp, tomorrowLine } from './idagView'

export type NavigateHref = (href: string) => void

function follow(event: MouseEvent<HTMLAnchorElement>, href: string, navigate: NavigateHref) {
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
  navigate(href)
}

/** Native anchors preserve open-in-new-tab and modified-click behavior. */
export function IdagLink({
  navigateHref,
  href,
  onClick,
  ...props
}: ComponentProps<'a'> & {
  href: string
  navigateHref: NavigateHref
}) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event)
        follow(event, href, navigateHref)
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

function actionFor(view: HomeView) {
  const { resume, state } = view
  const lead = view.plan.items.find((i) => !i.completed)
  if (resume)
    return {
      href: resume.href,
      label: resume.lesson
        ? 'Fortsätt lektionen'
        : resume.section === 'LÄS' || resume.section === 'ELF'
          ? 'Fortsätt läsa'
          : 'Fortsätt övningen',
      minutes: resume.minutes,
      testId: 'home-resumption-link',
    }
  if (state === 'cold')
    return {
      href: '/diagnostik?start=1',
      label: 'Starta första övningen →',
      minutes: lead?.minutes,
      testId: 'daily-plan-first-cta',
    }
  if (state === 'onboarding') return { href: '/ova', label: CONTINUE }
  if (state === 'active' && lead)
    return {
      href: lead.href,
      label:
        lead.kind === 'mock'
          ? 'Öppna provpass'
          : lead.kind === 'lesson'
            ? 'Öppna lektionen'
            : `Starta ${lead.title}`,
      minutes: lead.minutes,
    }
  return nextUp(view)
}

function ResumeProgress({ resume }: { resume: NonNullable<HomeView['resume']> }) {
  const when = resume.stale
    ? 'Påbörjad för mer än en vecka sedan'
    : `Påbörjad ${resume.pausedAt
        .replace(/^Idag · /, 'idag ')
        .replace(/^Igår · /, 'igår ')
        .replace(
          /^(\d+) dag(?:ar)? sedan$/,
          (_, days: string) => `för ${days} ${Number(days) === 1 ? 'dag' : 'dagar'} sedan`,
        )}`
  return (
    <div
      className="fa-resume-progress"
      data-sec={resume.section ? SEC_KEY[resume.section] : undefined}
    >
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
          <small>
            Fråga {resume.position} av {resume.total}
          </small>
        </>
      ) : null}
      <small>
        {when}
        {resume.device ? ` på ${DEVICE[resume.device] ?? resume.device}` : ''}
      </small>
    </div>
  )
}

export function IdagLead({
  view,
  navigateHref,
  phone = false,
}: {
  view: HomeView
  navigateHref: NavigateHref
  phone?: boolean
}) {
  const { resume, state } = view
  const first = view.plan.items[0]
  const lead = view.plan.items.find((i) => !i.completed)
  const action = actionFor(view)
  const minutes = 'minutes' in action ? action.minutes : undefined
  const testId = 'testId' in action ? action.testId : undefined
  const loading = state === 'loading' && !resume
  const error = state === 'error' && !resume
  const complete = !resume && (state === 'complete' || state === 'onboarding')
  const question = resume ? resume.questionTitle : lead?.questionTitle
  const why = resume ? resume.whyNow : lead?.whyNow
  const section = resume ? resume.section : lead?.section
  const title = resume
    ? resume.lesson
      ? 'Fortsätt lektionen där du slutade'
      : resume.title
    : loading || error
      ? 'Dagens plan'
      : state === 'cold'
        ? 'Börja här.'
        : state === 'complete'
          ? 'Allt i dagens plan är gjort'
          : state === 'onboarding'
            ? 'Första passet · klart ✓'
            : (lead?.title ?? 'Välj vad du vill öva')
  const tomorrow = complete ? tomorrowLine(view) : null
  const go = loading ? (
    <Go disabled dock={phone}>
      Laddar dagens plan…
    </Go>
  ) : (
    <Go
      href={action.href}
      dock={phone}
      kbd="↵"
      data-testid={testId}
      onClick={(event) => follow(event, action.href, navigateHref)}
    >
      {action.label}
      {phone && minutes != null && minutes > 0 ? ` · ca ${minutes} min` : ''}
    </Go>
  )
  return (
    <>
      <Lit
        className="fa-now"
        aria-labelledby="fa-now-title"
        data-testid={
          loading
            ? 'daily-plan-skeleton'
            : error
              ? 'daily-plan-error'
              : complete
                ? 'daily-plan-complete'
                : undefined
        }
      >
        <div className="fa-now-tag">
          <span className="fa-label">
            Nästa grepp{minutes != null && minutes > 0 ? ` · ca ${minutes} min` : ''}
          </span>
          {section ? <SecChip section={section} /> : null}
        </div>
        <h2 id="fa-now-title">
          {state === 'onboarding' && !resume && first ? (
            <IdagLink href={first.href} navigateHref={navigateHref}>
              {title}
            </IdagLink>
          ) : (
            title
          )}
        </h2>
        {loading || error ? (
          <p className="fa-quote" role="status">
            {loading
              ? 'Laddar dagens plan…'
              : 'Gick inte att hämta planen just nu — försöker igen automatiskt.'}
          </p>
        ) : question ? (
          <p className="fa-quote">{question}</p>
        ) : !resume && lead ? (
          <p className="fa-quote">
            {state === 'cold' ? lead.rationale : (lead.detail ?? lead.rationale)}
          </p>
        ) : complete ? (
          <p className="fa-quote">Allt du gjort är sparat.</p>
        ) : null}
        <div className="fa-now-row">
          {!phone ? go : null}
          {resume ? <ResumeProgress resume={resume} /> : null}
        </div>
        {why ? <p className="fa-why">Varför nu: {why}</p> : null}
        {state === 'complete' && !resume ? (
          <IdagLink className="fa-link fa-continue" href="/ova" navigateHref={navigateHref}>
            {CONTINUE}
          </IdagLink>
        ) : null}
        {tomorrow ? <p className="fa-tomorrow">{tomorrow}</p> : null}
      </Lit>
      {phone ? <div className="fa-idag-dock">{go}</div> : null}
    </>
  )
}
