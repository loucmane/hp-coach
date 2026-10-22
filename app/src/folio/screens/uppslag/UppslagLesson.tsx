import type { ReactNode, RefObject } from 'react'
import { WorkedExample } from '@/components/lesson/WorkedExample'
import { MathText } from '@/components/MathText'
import type { TrapEntry } from '@/data/frameworks'
import { type NavigateHref, UppslagLink } from './UppslagContents'
import type { UppslagChapter, UppslagEntry } from './uppslagView'

const ORIGIN = new Map([
  ['Germanic', 'germanskt ursprung'],
  ['Latin', 'latinskt ursprung'],
  ['Greek', 'grekiskt ursprung'],
  ['French', 'franskt ursprung'],
])

export function ReadToggle({ open, toggleRead }: { open: UppslagEntry; toggleRead: () => void }) {
  return (
    <button
      type="button"
      className="fa-ghost fa-up-read"
      data-testid="lesson-mark-as-read"
      data-read={open.read}
      onClick={toggleRead}
    >
      {open.read ? (
        <>
          Läst <span aria-hidden>✓</span> · Ångra
        </>
      ) : (
        'Markera som läst'
      )}
    </button>
  )
}

function Prose({
  label,
  text,
  Sub,
  className = '',
}: {
  label: string
  text?: string
  Sub: 'h2' | 'h3'
  className?: string
}) {
  if (!text) return null
  return (
    <section className={`fa-up-block ${className}`} aria-label={label}>
      <Sub className="fa-h3 fa-up-h">{label}</Sub>
      <p className="fa-prose">
        <MathText>{text}</MathText>
      </p>
    </section>
  )
}

function AuthoredExample({
  example,
  Sub,
}: {
  example: NonNullable<TrapEntry['worked_example']>
  Sub: 'h2' | 'h3'
}) {
  return (
    <section className="fa-up-block" aria-label="Räkneexempel">
      <Sub className="fa-h3 fa-up-h">Räkneexempel</Sub>
      <ol className="fa-up-steps">
        {(
          [
            ['Förutsättning', example.setup],
            ['Fällans tanke', example.trap_thinking],
            ['Korrekt tanke', example.correct_thinking],
            ['Svar', example.answer],
          ] as const
        ).map(([label, text], i) => (
          <li key={label} data-beat={i === 1 ? 'trap' : undefined}>
            <span className="fa-up-n" aria-hidden>
              {i + 1}
            </span>
            <div>
              <span className="fa-sub">{label}</span>
              <p className="fa-prose">
                <MathText>{text}</MathText>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

function Article({ open, phone }: { open: UppslagEntry; phone: boolean }) {
  const H = phone ? 'h1' : 'h2'
  const Sub = phone ? 'h2' : 'h3'
  const e = open.entry
  let body: ReactNode
  if ('root' in e) {
    return (
      <>
        <H className="fa-up-root" id="fa-up-title">
          <MathText>{e.root}</MathText>
        </H>
        <p className="fa-up-origin">
          <MathText>{ORIGIN.get(e.origin) ?? e.origin}</MathText>
        </p>
        <p className="fa-up-meaning">
          <MathText>{e.meaning}</MathText>
        </p>
        {e.example_words.length ? (
          <section className="fa-up-block" aria-label="Exempel">
            <Sub className="fa-h3 fa-up-h">Exempel</Sub>
            <p className="fa-up-words">
              <MathText>{e.example_words.join(' · ')}</MathText>
            </p>
          </section>
        ) : null}
      </>
    )
  }
  if ('tactic' in e) body = <Prose Sub={Sub} label="Igenkänningstecken" text={e.when_to_apply} />
  else if ('constraint_type' in e) body = <Prose Sub={Sub} label="Mönsterregel" text={e.rule} />
  else if ('question_type' in e)
    body = (
      <>
        {e.attack_protocol.length ? (
          <section className="fa-up-block" aria-label="Angreppsprotokoll">
            <Sub className="fa-h3 fa-up-h">Angreppsprotokoll</Sub>
            <ol className="fa-up-steps">
              {e.attack_protocol.map((step, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: authored steps retain their order
                <li key={i}>
                  <span className="fa-up-n" aria-hidden>
                    {i + 1}
                  </span>
                  <p className="fa-prose">
                    <MathText>{step}</MathText>
                  </p>
                </li>
              ))}
            </ol>
          </section>
        ) : null}
        {e.common_distractors.length ? (
          <section className="fa-up-block" aria-label="Vanliga fällor">
            <Sub className="fa-h3 fa-up-h">Vanliga fällor</Sub>
            {e.common_distractors.map((d) => (
              <div key={d.pattern} className="fa-up-trap">
                <p className="fa-up-trap-h">
                  <MathText>{d.pattern}</MathText>
                </p>
                <p className="fa-prose fa-up-trap-why">
                  <MathText>{d.why_it_traps}</MathText>
                </p>
              </div>
            ))}
          </section>
        ) : null}
      </>
    )
  else
    body = (
      <>
        {e.tldr ? <Prose Sub={Sub} label="Så gör man ofta" text={e.pattern_description} /> : null}
        <Prose Sub={Sub} label="Varför det händer" text={e.why_it_occurs} />
        <Prose Sub={Sub} label="Igenkänningstecken" text={e.recognition_cue} />
        <Prose Sub={Sub} label="Motåtgärd" text={e.countermeasure} className="fa-up-counter" />
      </>
    )
  return (
    <>
      <H className="fa-up-title" id="fa-up-title">
        <MathText>{open.summary ?? open.title}</MathText>
      </H>
      {body}
      <div className="fa-up-worked">
        <WorkedExample
          key={open.id}
          entryId={open.id}
          fallback={
            'worked_example' in e && e.worked_example ? (
              <AuthoredExample example={e.worked_example} Sub={Sub} />
            ) : undefined
          }
        />
      </div>
      {'counter_example' in e ? (
        <Prose
          Sub={Sub}
          label="När fällan inte gäller"
          text={e.counter_example}
          className="fa-up-italic"
        />
      ) : null}
      {'common_distractor_signature' in e && e.common_distractor_signature ? (
        <p className="fa-footnote fa-up-signature">
          Det typiska felsvaret: <MathText>{e.common_distractor_signature}</MathText>
        </p>
      ) : null}
    </>
  )
}

export function UppslagLesson({
  open,
  phone,
  primaryLabel,
  onPrimary,
  navigateHref,
  lessonRef,
  primaryRef,
}: {
  open: UppslagEntry
  phone: boolean
  primaryLabel: string
  onPrimary: () => void
  navigateHref: NavigateHref
  lessonRef: RefObject<HTMLElement | null>
  primaryRef: RefObject<HTMLButtonElement | null>
}) {
  const Sub = phone ? 'h2' : 'h3'
  const filled = (
    <button type="button" className="fa-btn" onClick={onPrimary} ref={primaryRef}>
      {primaryLabel}
      <kbd className="fa-kbd" aria-hidden>
        ↵
      </kbd>
    </button>
  )
  const practice = open.practiceHref ? (
    <UppslagLink
      className="fa-link fa-up-practice"
      href={open.practiceHref}
      navigateHref={navigateHref}
      data-testid="lesson-practice-link"
    >
      {open.kind.practice}
      <span aria-hidden> →</span>
    </UppslagLink>
  ) : null
  return (
    <article
      className="fa-up-lesson"
      data-testid="fa-lesson"
      aria-labelledby="fa-up-title"
      ref={lessonRef}
      tabIndex={-1}
    >
      <Article open={open} phone={phone} />
      {open.examples.length ? (
        <section className="fa-up-block" aria-label="Exempelfrågor">
          <Sub className="fa-h3 fa-up-h">Exempelfrågor</Sub>
          <ul className="fa-up-examples">
            {open.examples.map((example) => (
              <li key={example.qid}>
                <UppslagLink href={example.href} navigateHref={navigateHref}>
                  {example.label}
                  <span aria-hidden> →</span>
                </UppslagLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <footer className="fa-up-foot">
        {phone ? (
          <>
            {practice}
            {filled}
          </>
        ) : (
          <>
            {filled}
            {practice}
          </>
        )}
      </footer>
    </article>
  )
}

export function ChapterEnd({
  chapter,
  phone,
  onBack,
  navigateHref,
  practiceRef,
  lessonRef,
}: {
  chapter: UppslagChapter
  phone: boolean
  onBack: () => void
  navigateHref: NavigateHref
  practiceRef: RefObject<HTMLAnchorElement | null>
  lessonRef: RefObject<HTMLElement | null>
}) {
  const H = phone ? 'h1' : 'h2'
  const n = chapter.entries.length
  return (
    <section
      className="fa-colophon"
      aria-labelledby="fa-up-end-title"
      ref={lessonRef}
      tabIndex={-1}
    >
      <div className="fa-colophon-mark" aria-hidden>
        ⁂
      </div>
      <H className="fa-colophon-title" id="fa-up-end-title">
        Kapitlet är läst.
      </H>
      <p className="fa-colophon-sub">{chapter.name}</p>
      <p className="fa-colophon-facts">
        {n} {n === 1 ? chapter.kind?.one : chapter.kind?.many} · alla lästa
      </p>
      <p className="fa-colophon-lines">
        Varje sida i kapitlet är läst. Öva på det, eller slå upp ett annat kapitel.
      </p>
      <div className="fa-colophon-actions">
        <UppslagLink
          className="fa-btn"
          href={chapter.practiceHref}
          navigateHref={navigateHref}
          data-testid="section-practice-all"
          ref={practiceRef}
        >
          Öva hela {chapter.section}
          <kbd className="fa-kbd" aria-hidden>
            ↵
          </kbd>
        </UppslagLink>
        {chapter.weakHref ? (
          <UppslagLink
            className="fa-link"
            href={chapter.weakHref}
            navigateHref={navigateHref}
            data-testid="section-practice-weak"
          >
            Öva dina vanligaste fällor <span aria-hidden>→</span>
          </UppslagLink>
        ) : null}
        <button className="fa-ghost" type="button" onClick={onBack}>
          Tillbaka till sidan
        </button>
      </div>
    </section>
  )
}
