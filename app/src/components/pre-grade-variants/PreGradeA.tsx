// Variant A — Coaching note per section
//
// 1-2 lines of section-family strategy hint, set in the body display
// font at reading size. The student sees a frame for HOW to attack
// the question before they pick. Cheapest to author (7 strings total),
// quickest to ship.
//
// Voice: imperative, calm, second-person 'du'. Same coaching register
// as Variant C explanations. No motivational filler; concrete moves.

import type { Section } from '@/data/questions'

const COACHING_NOTES: Record<Section, string> = {
  KVA: 'Läs båda uttrycken (I) och (II) först. Testa extremvärden — vad händer vid 0, vid stora tal, vid lika stora? Den vinnande strategin ger oftast 1–2 räknesteg, inte 10.',
  XYZ: 'Översätt orden till en ekvation. Identifiera vad x faktiskt står för innan du löser. Svaret matchar inte alltid x rakt — läs frågan en gång till efter att du räknat ut värdet.',
  NOG: 'Två villkor (1) och (2). Fråga dig: räcker varje för sig, eller behövs de tillsammans? Pröva (1) ensamt, sedan (2) ensamt, sedan båda — i den ordningen.',
  DTK: 'Innan du räknar: hitta rätt rad/punkt i diagrammet. Frågan namnger nästan alltid den exakta datacellen du behöver. Vill du jämföra två tal — gör subtraktionen sist.',
  MEK: 'Läs hela meningen utan luckorna först. Hör helheten. Sedan: vilka ord rimmar med tonen? Substantiv-ändelser och prepositionsfraser sitter ihop som kollokationer.',
  LÄS: 'Skumma stycket innan du läser frågan. Hitta påståendets eko i texten — exakt formulering eller parallelltäcker. Alternativ som lägger till ny info utan textstöd är inte rätt.',
  ELF: 'Skim the passage for the gist first. Then locate the exact phrase the question asks about. The right answer matches the meaning in context, not just the surface words.',
  ORD: 'Bryt ner ordet i bekanta delar — latin, grek, sammansättning. Vilken känsla bär det? Positiv, neutral, negativ? Det styr halva valet innan du läser alternativen.',
}

export function PreGradeA({ section }: { section: Section }) {
  const note = COACHING_NOTES[section]
  return (
    <div style={{ paddingTop: 'clamp(28px, 4vh, 48px)', maxWidth: '52ch' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 16,
        }}
      >
        Strategi — innan du svarar
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 18,
          lineHeight: 1.65,
          color: 'var(--ink-2)',
        }}
      >
        {note}
      </p>
    </div>
  )
}
