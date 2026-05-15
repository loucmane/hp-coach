// Lazy explanation loader shared by all three drill variants
// (StyleA/B/C). When the variant is used in a session via
// SessionPlayer, the explanation isn't preloaded — the variant
// hits the same code path PedagogyPanel uses internally.

import { useEffect, useState } from 'react'

import { type Explanation, loadExplanation } from '@/data/explanations'

export function useExplanation(qid: string): Explanation | null {
  const [explanation, setExplanation] = useState<Explanation | null>(null)
  useEffect(() => {
    let alive = true
    setExplanation(null)
    loadExplanation(qid).then((e) => {
      if (alive) setExplanation(e)
    })
    return () => {
      alive = false
    }
  }, [qid])
  return explanation
}
