// ExampleQuestions — inline corpus-question references for a lektion
// entry. Shared by TrapCard (NOG/KVA/XYZ), ProtocolCard (MEK/DTK/LÄS/ELF),
// and LexiconCard (ORD).
//
// Each entry's framework JSON carries an `example_questions: string[]`
// of qids that exemplify the pattern/rule/tactic. We resolve each qid
// against the question bank and render its prompt with KaTeX via
// MathText. Tap to deep-link into /drill?qid=…, which is the place
// that grades and reveals the answer with the full explanation — the
// lesson page itself never spoils the answer letter.

import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { MathText } from '@/components/MathText'
import { Eyebrow } from '@/components/primitives'
import { loadBank, type Question } from '@/data/questions'

// Memoised qid → Question lookup. `loadBank()` is itself memoised, so
// this is a thin index built once per session.
let bankIndex: Promise<Map<string, Question>> | null = null
function getBankIndex(): Promise<Map<string, Question>> {
  if (!bankIndex) {
    bankIndex = loadBank().then((bank) => {
      const m = new Map<string, Question>()
      for (const q of bank) m.set(q.qid, q)
      return m
    })
  }
  return bankIndex
}

export function ExampleQuestions({ qids }: { qids: string[] }) {
  const [questions, setQuestions] = useState<(Question | null)[]>(() => qids.map(() => null))

  useEffect(() => {
    let alive = true
    getBankIndex().then((idx) => {
      if (!alive) return
      setQuestions(qids.map((qid) => idx.get(qid) ?? null))
    })
    return () => {
      alive = false
    }
  }, [qids])

  return (
    <div style={{ marginTop: 28 }}>
      <Eyebrow>Exempelfrågor från korpus</Eyebrow>
      <ul
        style={{
          listStyle: 'none',
          padding: 0,
          margin: '12px 0 0 0',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {qids.map((qid, i) => {
          const q = questions[i]
          return (
            <li key={qid}>
              <Link
                to="/drill"
                search={{ qid }}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                  borderTop: '1px solid var(--hairline)',
                  paddingTop: 10,
                }}
              >
                <div style={{ marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {qid}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(14px, 0.4vw + 12px, 15px)',
                    lineHeight: 1.5,
                    color: q ? 'var(--ink-2)' : 'var(--muted)',
                    margin: 0,
                  }}
                >
                  <MathText>{q?.prompt ?? '(laddar…)'}</MathText>
                </p>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
