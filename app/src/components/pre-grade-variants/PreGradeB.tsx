// Variant B — Section primer
//
// Compact reference card per section family: what's tested, scoring,
// common traps. Lifts content from the planned Layer 1 framework
// catalog (§ 3 of PRD) and surfaces it inline. Heavier than (a) — the
// student gets durable section knowledge plus the immediate frame.
//
// Voice: definitional, slightly formal but not stiff. Mono small-caps
// section headings, body display font.

import type { Section } from '@/data/questions'

type Primer = {
  whatTested: string
  scoring: string
  traps: string[]
}

const PRIMERS: Record<Section, Primer> = {
  KVA: {
    whatTested:
      'Kvantitativ jämförelse av två uttryck. Svar: större / mindre / lika / går ej att avgöra.',
    scoring: '12 frågor på ~35 min. Ingen straffpoäng — gissa hellre än lämna tomt.',
    traps: [
      'Extremvärden inte testade',
      'Villkor missade (b = a + 1)',
      'Tecken-fel vid kvadrering',
    ],
  },
  XYZ: {
    whatTested: 'Algebra och aritmetik. Översätt textbeskrivning till ekvation, lös, läs svaret.',
    scoring: '12 frågor. 5 svarsalternativ (A–E). Ingen straffpoäng.',
    traps: [
      'Räknar x när frågan vill ha 2x + 5',
      'Tecken-fel i parentesutveckling',
      'Bråk inte i enklaste form',
    ],
  },
  NOG: {
    whatTested:
      'Tillräcklig information. Två villkor (1) och (2); räcker de var för sig, ihop, eller inte?',
    scoring: '12 frågor. 5 alternativ. Träna (1)/(2)/båda-rutinen tills den sitter.',
    traps: [
      'Räknar fram svaret istället för att avgöra om det går',
      'Antar entydighet utan att kolla',
      'Glömmer pröva båda separat',
    ],
  },
  DTK: {
    whatTested:
      'Diagram, tabeller, kartor. Läs av rätt cell, jämför, beräkna procent eller skillnad.',
    scoring: '12 frågor. Mer tid per fråga än övriga kvant — figurer kostar lästid.',
    traps: [
      'Läser fel rad/kolumn',
      'Tar genomsnitt när frågan vill ha summa',
      'Skala / enhet missförstådd',
    ],
  },
  MEK: {
    whatTested:
      'Meningskomplettering. En till tre luckor i en mening; välj den ord-uppsättning som rimmar med stilen och fyller logikens lucka.',
    scoring: '20 frågor. 4 alternativ. Hela meningen måste fungera, inte bara en lucka.',
    traps: [
      'Bara första luckan testad',
      'Kollokation missad (göra ett misstag, inte göra ett fel)',
      'Register-krock mellan luckor',
    ],
  },
  LÄS: {
    whatTested:
      'Svensk läsförståelse. En text + 4–6 frågor om innehåll, struktur, författarens hållning.',
    scoring: '20 frågor över 5 texter ≈ 4 frågor/text. Textstödet är allt.',
    traps: [
      'Ny info i alternativ utan textstöd',
      'Hela texten istället för rätt stycke',
      'Bokstavlig läsning av metafor',
    ],
  },
  ELF: {
    whatTested:
      'English reading comprehension. Mostly academic/journalistic prose; 4–5 questions per passage.',
    scoring: '20 questions across 4–5 passages. Same patience as LÄS — locate before answering.',
    traps: [
      'Word-match without meaning-match',
      'Extreme paraphrase (always/never)',
      'Reading the question before the passage',
    ],
  },
  ORD: {
    whatTested:
      'Synonymer. Headword + 5 alternativ; välj det som ligger närmast i betydelse och register.',
    scoring: '20 frågor. Hastigast i provet — ~15 s/fråga. Räkna med att gissa på 1–2.',
    traps: [
      'Ljudlikhet utan betydelsesläktskap',
      'Register-fel (formellt headword, vardagligt val)',
      'Nära synonym i ordbok men inte i bruk',
    ],
  },
}

export function PreGradeB({ section }: { section: Section }) {
  const p = PRIMERS[section]
  return (
    <div
      style={{
        paddingTop: 'clamp(28px, 4vh, 48px)',
        maxWidth: '52ch',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      <PrimerBlock title="Vad testas" body={p.whatTested} />
      <PrimerBlock title="Karaktäristik" body={p.scoring} />
      <PrimerBlock title="Vanliga fällor" bullets={p.traps} />
    </div>
  )
}

function PrimerBlock({
  title,
  body,
  bullets,
}: {
  title: string
  body?: string
  bullets?: string[]
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {body && (
        <p
          style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: 16.5,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
          }}
        >
          {body}
        </p>
      )}
      {bullets && (
        <ul
          style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            fontFamily: 'var(--font-display)',
            fontSize: 16.5,
            lineHeight: 1.55,
            color: 'var(--ink-2)',
          }}
        >
          {bullets.map((b, i) => (
            <li
              key={b}
              style={{
                paddingLeft: 18,
                position: 'relative',
                marginTop: i === 0 ? 0 : 6,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  color: 'var(--muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                }}
              >
                ·
              </span>
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
