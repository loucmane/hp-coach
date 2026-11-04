// Original retrieval practice, independent of the exam bank. Importing this
// module in a lazy Folio screen keeps the catalog out of the classic route.
// The served twin is also available at /frameworks/lock-in/lock_in.json. It
// lives in a subfolder because frameworks/*.json are the Layer-1 catalogs the
// export pipeline reads; this file is not one of them.
import catalog from '../../../frameworks/lock-in/lock_in.json'

export type LockInItem = Readonly<{
  id: string
  prompt: string
  options: readonly [string, string, string]
  /** Zero-based index into options. */
  answer: 0 | 1 | 2
  why: string
}>

function readItem(entry: (typeof catalog.items)[number]): LockInItem {
  const { id, prompt, options, answer, why } = entry
  if (
    !id.trim() ||
    !prompt.trim() ||
    !why.trim() ||
    options.length !== 3 ||
    options.some((option) => !option.trim()) ||
    new Set(options).size !== 3 ||
    (answer !== 0 && answer !== 1 && answer !== 2)
  ) {
    throw new Error(`Invalid lock-in item: ${id}`)
  }
  const choices: readonly [string, string, string] = Object.freeze([
    options[0],
    options[1],
    options[2],
  ])
  return Object.freeze({ id, prompt, options: choices, answer, why })
}

const items: readonly LockInItem[] = Object.freeze(catalog.items.map(readItem))
const byId = new Map(items.map((item) => [item.id, item]))
if (byId.size !== items.length) throw new Error('Duplicate lock-in item id')

/** Load the bundled, validated catalog. No network or mutable loading state. */
export function loadLockIn(): readonly LockInItem[] {
  return items
}

/** Pure lookup; unsupported ids (including ORD) have no retrieval item. */
export function lockInFor(trapId: string): LockInItem | null {
  return byId.get(trapId) ?? null
}
