import type { Section } from '@/data/questions'

const key = (userId: string, section: Section) =>
  `hpc-worked-examples-v1:${encodeURIComponent(userId)}:${section}`

function readCount(userId: string, section: Section): number {
  try {
    const value = Number(localStorage.getItem(key(userId, section)))
    return Number.isSafeInteger(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

export function readWorkedExampleLevel(userId: string, section: Section): number {
  return Math.min(readCount(userId, section), 2)
}

export function completeWorkedExample(userId: string, section: Section): void {
  try {
    const count = Math.min(readCount(userId, section) + 1, Number.MAX_SAFE_INTEGER)
    localStorage.setItem(key(userId, section), String(count))
  } catch {
    // Local progress is optional; storage restrictions never interrupt a lesson.
  }
}
