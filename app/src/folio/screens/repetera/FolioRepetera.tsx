import { ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatSwedishDateShort } from '@/lib/scoring'
import { MissRow } from './MissRow'
import { type NavigateHref, RepeteraLink, RepeteraQueue } from './RepeteraQueue'
import { buildRepeteraView, type RepeteraInput, type RepeteraItem } from './repeteraView'
import { useRepeteraExtras } from './useRepeteraExtras'
import './repetera.css'

type Props = Pick<
  RepeteraInput,
  'dueMistakes' | 'dueError' | 'section' | 'roundSession' | 'roundEnded'
> & {
  navigateHref: NavigateHref
}

export default function FolioRepetera(props: Props) {
  const extras = useRepeteraExtras(props.section)
  const view = buildRepeteraView({ ...props, ...extras })
  const primaryRef = useRef<HTMLAnchorElement>(null)
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.key !== 'Enter' ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      )
        return
      const target = event.target
      if (
        target instanceof Element &&
        target.closest(
          'a, button, input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="dialog"], [role="menu"], [role="button"], [data-folio-keyscope]',
        )
      )
        return
      // A modal rendered elsewhere in the shell also owns the keyboard.
      if (document.querySelector('[aria-modal="true"], dialog[open]')) return
      if (!primaryRef.current) return
      event.preventDefault()
      primaryRef.current.click()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const { navigateHref } = props
  const pending = view.state === 'loading' || view.state === 'error'
  return (
    <div className="fa-repetera" data-testid="folio-repetera">
      <header className="fa-masthead">
        <span className="fa-label">Öva · Repetera{props.section ? ` · ${props.section}` : ''}</span>
      </header>
      <div className="fa-page-main">
        <h1 className="fa-greet">Dina missar</h1>
        <p className="fa-day">De äldsta först, högst tio åt gången.</p>
        <section
          className="fa-resume"
          aria-labelledby={view.state === 'empty' && !view.emptyLine ? undefined : 'fa-rep-lead'}
        >
          {pending ? (
            <p className="fa-empty" id="fa-rep-lead" role="status">
              {view.state === 'loading'
                ? 'Laddar dina missar…'
                : 'Gick inte att hämta dina missar just nu – försöker igen automatiskt.'}
            </p>
          ) : view.state === 'empty' ? (
            view.emptyLine ? (
              <p className="fa-empty" id="fa-rep-lead">
                {view.emptyLine}
              </p>
            ) : null
          ) : (
            <>
              <div className="fa-resume-top">
                <span className="fa-label">
                  {view.resume ? 'Påbörjad omgång' : 'Den här omgången'}
                </span>
              </div>
              <h2 className="fa-lead-title" id="fa-rep-lead">
                {view.resume
                  ? `Fråga ${view.resume.position} av ${view.resume.total}`
                  : `${view.round} av ${view.ready} missar`}
              </h2>
              {!view.resume ? (
                <p className="fa-lead-sub">
                  ungefär {view.minutes} {view.minutes === 1 ? 'minut' : 'minuter'}
                </p>
              ) : null}
            </>
          )}
          <div className="fa-resume-foot">
            {view.primary.href ? (
              <RepeteraLink
                ref={primaryRef}
                className="fa-btn"
                href={view.primary.href}
                navigateHref={navigateHref}
                data-testid={view.primary.fallback ? 'repetition-fallback-link' : 'repetera-start'}
              >
                {view.primary.label}
                <kbd className="fa-kbd" aria-hidden>
                  ↵
                </kbd>
              </RepeteraLink>
            ) : (
              <button className="fa-btn" type="button" disabled data-testid="repetera-start">
                {view.state === 'loading' ? 'Laddar…' : 'Väntar på kön'}
              </button>
            )}
          </div>
        </section>
        {!pending ? (
          <>
            <RepeteraQueue queue={view.queue} navigateHref={navigateHref} />
            {view.items.length ? (
              <section className="fa-section" aria-labelledby="fa-rep-misses" data-fa-shade>
                <div className="fa-section-head">
                  <h2 className="fa-h2" id="fa-rep-misses">
                    Missarna
                  </h2>
                  {view.pileKnown ? (
                    <span className="fa-meta">{view.pile} i dagens hög</span>
                  ) : null}
                </div>
                {view.due.length ? (
                  <div className="fa-part-block">
                    <h3 className="fa-part" id="fa-rep-now">
                      Redo nu
                    </h3>
                    <ol aria-labelledby="fa-rep-now">
                      {view.due.map((item) => (
                        <MissRow key={item.mistakeId} item={item} navigateHref={navigateHref} />
                      ))}
                    </ol>
                  </div>
                ) : null}
                <LaterPart
                  items={view.laterToday}
                  folded={view.ready > 0}
                  navigateHref={navigateHref}
                  id="fa-rep-later"
                  title="Senare idag"
                />
                <LaterPart
                  items={view.laterDays}
                  folded={view.ready > 0}
                  navigateHref={navigateHref}
                  id="fa-rep-future"
                  title={
                    view.laterDays.some(
                      (i) => i.dueLabel === 'nu' || i.dueLabel === 'tid ej tillgänglig',
                    )
                      ? 'Nästa repetition'
                      : 'Kommande dagar'
                  }
                />
              </section>
            ) : null}
            {!view.pileKnown ? (
              <p className="fa-pile-status" role="status">
                {extras.pileError
                  ? 'Gick inte att hämta resten av kön just nu.'
                  : 'Laddar resten av kön…'}
              </p>
            ) : null}
          </>
        ) : null}
      </div>
      <aside className="fa-aside" aria-labelledby="fa-rep-rule" data-fa-shade>
        <section className="fa-margin-block">
          <h2 className="fa-h3" id="fa-rep-rule">
            Så flyttas de fram
          </h2>
          <p>
            Rätt svar ger längre mellanrum mellan repetitionerna. En miss kommer tillbaka efter
            ungefär tio minuter. Nästa rätta svar återgår till halva det tidigare mellanrummet,
            minst en dag.
          </p>
          <p>
            LÄS, MEK, ELF och kvant kommer tillbaka som en ny fråga med samma fälla när det finns
            en, annars som samma fråga igen; ORD som samma ord.
          </p>
          {extras.examDate.getTime() > extras.now.getTime() ? (
            <p>
              Inför provet {formatSwedishDateShort(extras.examDate)} flyttas repetitioner som annars
              skulle hamna efter provet till veckan före, så länge det finns en repetitionstid kvar
              före provet. Från 60 dagar före provet fram till sista veckan behålls även sådant du
              kan för en sista repetition.
            </p>
          ) : null}
        </section>
        <section className="fa-margin-block" aria-labelledby="fa-rep-guess">
          <h2 className="fa-h3" id="fa-rep-guess">
            Gissa hellre
          </h2>
          <p>Du får inga poängavdrag på provet – ge varje fråga ett svar.</p>
        </section>
      </aside>
    </div>
  )
}

function LaterPart({
  items,
  folded,
  navigateHref,
  id,
  title,
}: {
  items: RepeteraItem[]
  folded: boolean
  navigateHref: NavigateHref
  id: string
  title: string
}) {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  if (!items.length) return null
  return (
    <div className="fa-part-block">
      <h3 className="fa-part" id={id}>
        {title}
      </h3>
      {folded ? (
        <button
          type="button"
          className="fa-more"
          aria-expanded={open}
          aria-controls={`${id}-content`}
          onClick={() => setOpen(!open)}
        >
          {open ? 'Dölj dem som blir redo senare' : `Visa de ${items.length} som blir redo senare`}
          <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
        </button>
      ) : null}
      <div id={`${id}-content`} hidden={folded && !open}>
        <ol id={`${id}-list`} aria-labelledby={id}>
          {(showAll ? items : items.slice(0, 5)).map((item) => (
            <MissRow key={item.mistakeId} item={item} navigateHref={navigateHref} />
          ))}
        </ol>
        {items.length > 5 ? (
          <button
            type="button"
            className="fa-more"
            aria-expanded={showAll}
            aria-controls={`${id}-list`}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Visa färre' : `Visa alla ${items.length}`}
            <ChevronRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}
