// useLessonReads — cross-device write-through cache semantics (#164).
//
// Source of truth is the server read set; localStorage is an optimistic
// write-through / offline cache. This suite proves:
//   - toggleRead writes localStorage FIRST (so a mark survives a failed
//     PUT — no data loss) and fires the server mutation.
//   - the server GET reconciles into the local set (a read on the other
//     device shows up here).
//   - unmark removes the flag locally and fires the server DELETE.

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const markMutate = vi.fn()
const unmarkMutate = vi.fn()
let serverData: string[] | undefined

vi.mock('@/api/hooks/useLessonReadsApi', () => ({
  useLessonReadsQuery: () => ({ data: serverData }),
  useMarkLessonReadServer: () => ({ mutate: markMutate }),
  useUnmarkLessonReadServer: () => ({ mutate: unmarkMutate }),
}))

import { useLessonReads } from './useLessonReads'

beforeEach(() => {
  localStorage.clear()
  markMutate.mockClear()
  unmarkMutate.mockClear()
  serverData = undefined
})

describe('useLessonReads write-through', () => {
  it('marks localStorage first AND fires the server PUT', () => {
    const { result } = renderHook(() => useLessonReads())
    act(() => result.current.toggleRead('NOG-TRAP-001'))

    // localStorage flag written immediately (offline-tolerant).
    expect(localStorage.getItem('hpc-lesson-read-NOG-TRAP-001')).toBe('1')
    // Server mutation fired.
    expect(markMutate).toHaveBeenCalledWith('NOG-TRAP-001')
    // Reflected in the hook's set.
    expect(result.current.isRead('NOG-TRAP-001')).toBe(true)
  })

  it('keeps the local mark even though the server write is fire-and-forget', () => {
    // markMutate does nothing (simulates an in-flight / failed PUT). The
    // local flag must persist regardless — reconciled on the next GET.
    const { result } = renderHook(() => useLessonReads())
    act(() => result.current.toggleRead('KVA-NEG-002'))

    expect(localStorage.getItem('hpc-lesson-read-KVA-NEG-002')).toBe('1')
    expect(result.current.isRead('KVA-NEG-002')).toBe(true)
  })

  it('unmark clears localStorage and fires the server DELETE', () => {
    localStorage.setItem('hpc-lesson-read-XYZ-003', '1')
    const { result } = renderHook(() => useLessonReads())
    expect(result.current.isRead('XYZ-003')).toBe(true)

    act(() => result.current.toggleRead('XYZ-003'))
    expect(localStorage.getItem('hpc-lesson-read-XYZ-003')).toBeNull()
    expect(unmarkMutate).toHaveBeenCalledWith('XYZ-003')
    expect(result.current.isRead('XYZ-003')).toBe(false)
  })

  it('reconciles the server set into local (a read from the other device)', async () => {
    serverData = ['MEK-005', 'DTK-009']
    const { result } = renderHook(() => useLessonReads())

    await waitFor(() => {
      expect(result.current.isRead('MEK-005')).toBe(true)
      expect(result.current.isRead('DTK-009')).toBe(true)
    })
    // Mirrored into localStorage so the scheduler's local reads see them too.
    expect(localStorage.getItem('hpc-lesson-read-MEK-005')).toBe('1')
  })

  it('exposes the union of local (offline) and server marks', async () => {
    localStorage.setItem('hpc-lesson-read-LOCAL-1', '1')
    serverData = ['REMOTE-1']
    const { result } = renderHook(() => useLessonReads())

    await waitFor(() => expect(result.current.isRead('REMOTE-1')).toBe(true))
    expect(result.current.isRead('LOCAL-1')).toBe(true)
  })
})
