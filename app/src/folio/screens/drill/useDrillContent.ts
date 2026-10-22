import { useEffect, useState } from 'react'
import { type Explanation, loadExplanation, peekExplanation } from '@/data/explanations'
import { entryHeadword, loadFramework } from '@/data/frameworks'
import type { DrillQuestion } from './types'

/** Warm the shared explanation cache before lock; a missing explanation never loses an attempt. */
export function useDrillContent(questions: readonly DrillQuestion[]) {
  const [explanations, setExplanations] = useState<Record<string, Explanation | null>>(() =>
    Object.fromEntries(questions.map((q) => [q.qid, peekExplanation(q.qid)])),
  )
  const [frameworks, setFrameworks] = useState<Record<string, string>>({})
  useEffect(() => {
    let active = true
    for (const q of questions) {
      void loadExplanation(q.qid)
        .then((e) => {
          if (active) setExplanations((previous) => ({ ...previous, [q.qid]: e }))
        })
        .catch(() => {
          if (active) setExplanations((previous) => ({ ...previous, [q.qid]: null }))
        })
    }
    for (const section of new Set(questions.map((q) => q.section))) {
      void loadFramework(section)
        .then((framework) => {
          if (!active || !framework) return
          const names: Record<string, string> = {}
          for (const entry of framework.entries) {
            const name = entryHeadword(entry, framework)
            if (name) names[entry.id] = name
          }
          setFrameworks((previous) => ({ ...previous, ...names }))
        })
        .catch(() => {})
    }
    return () => {
      active = false
    }
  }, [questions])
  return { explanations, frameworks }
}
