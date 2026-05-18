// useLessonReads — read/unread state for framework entries.
//
// Backed by the `hpc-lesson-read-{entryId}` localStorage flags that
// useDailyPlan already consumes to auto-complete lesson plan items.
// Lives once at the LessonReader level; per-card props (read + toggle)
// avoid every TrapCard / ProtocolCard / LexiconCard re-scanning storage.
//
// `toggleRead(entryId)` flips the flag both ways — tap to mark, tap
// again to unmark. Cheap escape hatch if the user accidentally marks
// the wrong card; gameability is already gone because the daily-plan
// card derives its own completion from this signal independently.

import { useCallback, useEffect, useState } from 'react'

import { loadLessonReads, markLessonRead } from '@/lib/scheduler'

const LESSON_READ_PREFIX = 'hpc-lesson-read-'

export type UseLessonReads = {
  isRead: (entryId: string) => boolean
  toggleRead: (entryId: string) => void
  reads: ReadonlySet<string>
}

export function useLessonReads(): UseLessonReads {
  const [reads, setReads] = useState<Set<string>>(() => loadLessonReads())

  // Pick up cross-tab changes via the storage event. A second tab
  // marking a lesson read shouldn't leave this tab stale.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key && e.key.startsWith(LESSON_READ_PREFIX)) {
        setReads(loadLessonReads())
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  const isRead = useCallback((entryId: string) => reads.has(entryId), [reads])

  const toggleRead = useCallback((entryId: string) => {
    setReads((prev) => {
      const next = new Set(prev)
      const key = `${LESSON_READ_PREFIX}${entryId}`
      if (next.has(entryId)) {
        next.delete(entryId)
        localStorage.removeItem(key)
      } else {
        next.add(entryId)
        markLessonRead(entryId)
      }
      return next
    })
  }, [])

  return { isRead, toggleRead, reads }
}
