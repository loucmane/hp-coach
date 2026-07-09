// useLessonReads — read/unread state for framework entries, cross-device.
//
// Source of truth is now the server read set (`/api/lesson-reads`,
// GET/PUT/DELETE). localStorage (`hpc-lesson-read-{entryId}` flags) is kept
// as an OPTIMISTIC WRITE-THROUGH cache:
//   - `toggleRead` writes localStorage FIRST (instant, offline-tolerant)
//     then fires the server mutation. A server failure must NOT lose the
//     local mark — the flag stays, and the next successful GET reconciles.
//   - The reader shows the UNION of localStorage and the server set, so a
//     mark made offline is honoured immediately and survives until the
//     server catches up (or, on unmark, is removed both places).
//
// This makes lesson completion + the scheduler's next-unread-entry hint
// converge across the user's phone/desktop, while staying usable offline.
//
// Lives once at the LessonReader level; per-card props (read + toggle)
// avoid every TrapCard / ProtocolCard / LexiconCard re-scanning storage.

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  useLessonReadsQuery,
  useMarkLessonReadServer,
  useUnmarkLessonReadServer,
} from '@/api/hooks/useLessonReadsApi'
import { loadLessonReads, markLessonRead, unmarkLessonRead } from '@/lib/scheduler'

const LESSON_READ_PREFIX = 'hpc-lesson-read-'

export type UseLessonReads = {
  isRead: (entryId: string) => boolean
  toggleRead: (entryId: string) => void
  reads: ReadonlySet<string>
}

export function useLessonReads(): UseLessonReads {
  const [local, setLocal] = useState<Set<string>>(() => loadLessonReads())
  const serverQuery = useLessonReadsQuery()
  const markServer = useMarkLessonReadServer()
  const unmarkServer = useUnmarkLessonReadServer()

  // Reconcile the server set into localStorage whenever it arrives/changes.
  // The server is authoritative for MARKS (a read on another device shows
  // up here), so we fold server ids into local. We do NOT delete local ids
  // that the server lacks — those may be offline marks not yet flushed, or
  // a just-made mark racing its own PUT; an explicit unmark removes them.
  const serverIds = serverQuery.data
  useEffect(() => {
    if (!serverIds) return
    let changed = false
    setLocal((prev) => {
      const next = new Set(prev)
      for (const id of serverIds) {
        if (!next.has(id)) {
          next.add(id)
          markLessonRead(id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [serverIds])

  // Pick up cross-tab localStorage changes.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key?.startsWith(LESSON_READ_PREFIX)) setLocal(loadLessonReads())
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  // The union of local (incl. offline marks) and the server set. Local
  // already contains reconciled server ids, so `local` IS the union.
  const reads = useMemo<ReadonlySet<string>>(() => local, [local])

  const isRead = useCallback((entryId: string) => reads.has(entryId), [reads])

  const toggleRead = useCallback(
    (entryId: string) => {
      setLocal((prev) => {
        const next = new Set(prev)
        if (next.has(entryId)) {
          // Unmark: localStorage first (optimistic), then the server. A
          // failed DELETE leaves the server row; the next GET re-adds it —
          // acceptable (a briefly-resurrected read), and never data loss.
          next.delete(entryId)
          unmarkLessonRead(entryId)
          unmarkServer.mutate(entryId)
        } else {
          // Mark: localStorage first so the flag survives an offline /
          // failed PUT; the next successful GET reconciles server → local.
          next.add(entryId)
          markLessonRead(entryId)
          markServer.mutate(entryId)
        }
        return next
      })
    },
    [markServer, unmarkServer],
  )

  return { isRead, toggleRead, reads }
}
