import type { Section } from '@/data/questions'

const key = (userId: string, section: Section) =>
  `hpc-worked-examples-v2:${encodeURIComponent(userId)}:${section}`

function readCompleted(userId: string, section: Section): Set<string> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(userId, section)) ?? '[]')
    return Array.isArray(value) && value.every((qid) => typeof qid === 'string' && qid.length > 0)
      ? new Set(value)
      : new Set()
  } catch {
    return new Set()
  }
}

export function readWorkedExampleLevel(userId: string, section: Section): number {
  return Math.min(readCompleted(userId, section).size, 2)
}

export function completeWorkedExample(userId: string, section: Section, qid: string): void {
  try {
    const completed = readCompleted(userId, section)
    completed.add(qid)
    localStorage.setItem(key(userId, section), JSON.stringify([...completed]))
  } catch {
    // Local progress is optional; storage restrictions never interrupt a lesson.
  }
}
