import { Link } from '@tanstack/react-router'
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
}: {
  questions?: readonly Question[]
  picks?: readonly (AnswerLetter | null)[]
}) {
  useShellFocus({ exitLabel: null })
  const heading = useRef<HTMLHeadingElement>(null)
  const line = welcomeDoneLine(questions, picks)
  const completed = line !== 'Du är igång.'
  const answered = questions
    .filter((_, i) => picks[i] != null)
    .map((q) => q.qid)
    .join(',')
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
            Imorgon väntar en kort nivåkoll, tio frågor, om du inte redan har övat vidare.
          </p>
        )}
        <p className="fa-welcome-note">Dina val går att ändra under Konto.</p>
        <div className="fa-welcome-actions">
          <Link
            className="fa-welcome-primary"
            to="/drill"
            search={{ section: 'ORD', start: true, afterWelcome: answered || undefined }}
          >
            Fortsätt öva
          </Link>
          <Link className="fa-welcome-link" to="/">
            Till Idag
          </Link>
        </div>
      </div>
    </section>
  )
}
