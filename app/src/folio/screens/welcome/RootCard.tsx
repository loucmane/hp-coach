import type { LexiconEntry } from '@/data/frameworks'

export function RootCard({ root }: { root: LexiconEntry }) {
  return (
    <section className="fa-welcome-root" aria-label="Ordmönster">
      <h2>{root.root}</h2>
      <p className="fa-welcome-meaning">o- betyder inte: obetydlig = inte betydelsefull.</p>
      <h3>Exempel</h3>
      <ul>
        {root.example_words.slice(0, 3).map((word) => (
          <li key={word}>{word}</li>
        ))}
      </ul>
      <p className="fa-welcome-note">
        Det här första passet är till för att prova. Det påverkar inte din prognos.
      </p>
    </section>
  )
}
