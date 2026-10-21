import type { PlanItem } from './scheduler'

export type ReturnHistory = readonly { startedAt?: string | null }[]
export type ReturnEvent = { start: Date; summary: string }

const pad = (n: number) => String(n).padStart(2, '0')

export function returnPromptDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Use only known completed starts from today, not endedAt or UTC-day stats. */
export function suggestReturnTime(history: ReturnHistory, now: Date): Date | null {
  const today = returnPromptDay(now)
  const starts = history
    .flatMap(({ startedAt }) => (startedAt ? [new Date(startedAt)] : []))
    .filter((start) => returnPromptDay(start) === today && start.getTime() <= now.getTime())
  if (!starts.length) return null
  const first = new Date(Math.min(...starts.map((start) => start.getTime())))
  const minutes = first.getHours() * 60 + first.getMinutes() + first.getSeconds() / 60
  // Keep even a 23:59 start on tomorrow, rather than rounding into day +2.
  const rounded = Math.min(23 * 60 + 55, Math.round(minutes / 5) * 5)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, rounded)
  // A spring-forward gap has no matching local time. Do not label a
  // silently shifted hour as "som idag"; use the no-suggestion fallback.
  return tomorrow.getHours() * 60 + tomorrow.getMinutes() === rounded ? tomorrow : null
}

/** Conservative day-zero gate: missing/limited history never invents experience. */
export function hasEarlierPractice(history: ReturnHistory, now: Date): boolean {
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return history.some(({ startedAt }) => startedAt && new Date(startedAt).getTime() < midnight)
}

export function returnSummary(items: readonly Pick<PlanItem, 'kind' | 'section'>[]): string {
  const labels = items.map((item) => {
    if (item.kind === 'repetition') return 'Repetition'
    if (item.kind === 'mock') return 'Provpass'
    return item.section ?? 'Övning'
  })
  return `HP-Coach · ${[...new Set(labels)].join(' + ') || 'Övning'}`
}

function floatingTime(date: Date): string {
  return `${returnPromptDay(date).replace(/-/g, '')}T${pad(date.getHours())}${pad(date.getMinutes())}00`
}

function eventEnd(start: Date): Date {
  // Floating local time: thirty wall-clock minutes, including midnight/DST.
  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 30)
  return end
}

function escapeText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/[,;]/g, '\\$&')
}

/** RFC 5545 folding counts UTF-8 octets, including the continuation space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  let out = ''
  let bytes = 0
  for (const char of line) {
    const size = encoder.encode(char).length
    if (bytes + size > 75) {
      out += '\r\n '
      bytes = 1
    }
    out += char
    bytes += size
  }
  return out
}

export function buildReturnCalendar(event: ReturnEvent, createdAt: Date): string {
  // FNV-1a is only an event identifier, not a security primitive. Keep it
  // short and deterministic without exporting the student's account id.
  let hash = 0xcbf29ce484222325n
  for (const byte of new TextEncoder().encode(event.summary)) {
    hash = BigInt.asUintN(64, (hash ^ BigInt(byte)) * 0x100000001b3n)
  }
  const uid = `return-${floatingTime(event.start)}-${hash.toString(16)}@hp-coach`
  const stamp = createdAt
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z')
  return `${[
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HP-Coach//Return prompt//SV',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${floatingTime(event.start)}`,
    `DTEND:${floatingTime(eventEnd(event.start))}`,
    `SUMMARY:${escapeText(event.summary)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .map(foldLine)
    .join('\r\n')}\r\n`
}

export function googleCalendarUrl(event: ReturnEvent, timezone: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.summary,
    dates: `${floatingTime(event.start)}/${floatingTime(eventEnd(event.start))}`,
    ctz: timezone,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

/** Mark on presentation, not on dismissal: ignoring must not cause re-asking.
 * Storage access is inside try/catch, including the browser property getter.
 * Fail closed when the daily limit cannot be persisted. Local to this browser. */
export function claimReturnPrompt(
  userId: string,
  now: Date,
  storage?: Pick<Storage, 'getItem' | 'setItem'>,
): boolean {
  if (!userId) return false
  try {
    const target = storage ?? window.localStorage
    const key = `hpc-return-prompt:${encodeURIComponent(userId)}`
    const today = returnPromptDay(now)
    if (target.getItem(key) === today) return false
    target.setItem(key, today)
    return true
  } catch {
    return false
  }
}
