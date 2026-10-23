import { useEffect, useRef } from 'react'
import type { AnswerLetter, Question } from '@/data/questions'
import { useShellFocus } from '@/folio/useShellFocus'
import { firstSessionOrigin } from '@/lib/firstSession'
import { WELCOMED_KEY } from '@/lib/welcome'
import { welcomeDoneLine } from './welcomeView'
import './welcome.css'

export default function FolioWelcomeDone({
  questions = [],
  picks = [],
  onHome,
}: {
  questions?: readonly Question[]
  picks?: readonly (AnswerLetter | null)[]
  onHome: () => void
}) {
  useShellFocus({ exitLabel: null })
  const heading = useRef<HTMLHeadingElement>(null)
  const line = welcomeDoneLine(questions, picks)
  const completed = line !== 'Du är igång.'
  const origins = questions.map((q) => firstSessionOrigin(q.qid)?.replace('Högskoleprovet ', ''))
  useEffect(() => {
    try {
      localStorage.setItem(WELCOMED_KEY, '1')
    } catch {
      /* Storage is optional. */
    }
    heading.current?.focus()
  }, [])
  return (
    <section className="fa-welcome" lang="sv">
      <div className="fa-welcome-body">
        <header>
          <p className="fa-welcome-eyebrow">Din start</p>
          <h1 ref={heading} tabIndex={-1}>
            {line}
          </h1>
        </header>
        {completed && (
          <p className="fa-welcome-note">
            Frågorna kom från högskoleprovet {origins[0]}, {origins[1]} och {origins[2]}.
          </p>
        )}
        {completed && (
          <p className="fa-welcome-intro">
            Imorgon får du en kort nivåkoll, tio frågor, om du inte övar vidare innan dess. Övar du
            vidare anpassas planen efter det.
          </p>
        )}
        <p className="fa-welcome-note">Dina val går att ändra under Konto.</p>
        <div className="fa-welcome-actions">
          <a className="fa-welcome-primary" href="/drill?section=ORD&start=1">
            Fortsätt öva
          </a>
          <button type="button" className="fa-welcome-link" onClick={onHome}>
            Till Idag
          </button>
        </div>
      </div>
    </section>
  )
}
