// Trap index — which Layer 1 trap each question carries (hpf-bz6f.2).
//
// Repetera repeats a LÄS/MEK/ELF/quant miss through a NEW question with
// the same trap ("Samma fälla, ny fråga") instead of replaying the
// question whose key the student has already seen. The trap is the
// explanation's `framework_id`, but explanations are gated content (R2
// behind auth in production) and ~20 MB in total — far too much to load
// just to find a question's siblings. scripts/build_trap_index.mjs
// distils them into app/public/trap-index.json: question ids and trap ids
// only, no content, served as a public static asset like the frameworks.
// trapIndex.test.ts pins the committed file to the generator's output, so
// it cannot drift from the explanations it is built from.
//
// `loadTrapIndex()` mirrors `loadFramework`: a memoised static fetch, 404
// read as "not wired" (no traps → Repetera replays the missed question),
// and a failed load dropped from the memo so the next call retries.

/** Served path of the generated index (app/public/trap-index.json). */
export const TRAP_INDEX_URL = '/trap-index.json'

/** On-disk shape written by scripts/build_trap_index.mjs. */
export type TrapIndexFile = {
  version: 1
  generator: string
  /** qid → Layer 1 framework id, for every question that carries one. */
  traps: Record<string, string>
}

export type TrapIndex = {
  /** The trap a question carries, or null (ORD, untagged, unknown qid). */
  trapOf: (qid: string) => string | null
  /** Every question that carries `frameworkId`, in qid order. */
  qidsFor: (frameworkId: string) => readonly string[]
}

const NO_QIDS: readonly string[] = []

/** Index a qid → trap map both ways. */
export function buildTrapIndex(traps: Readonly<Record<string, string>>): TrapIndex {
  const trapByQid = new Map(Object.entries(traps))
  const qidsByTrap = new Map<string, string[]>()
  for (const qid of [...trapByQid.keys()].sort()) {
    const trap = trapByQid.get(qid) as string
    const qids = qidsByTrap.get(trap)
    if (qids) qids.push(qid)
    else qidsByTrap.set(trap, [qid])
  }
  return {
    trapOf: (qid) => trapByQid.get(qid) ?? null,
    qidsFor: (frameworkId) => qidsByTrap.get(frameworkId) ?? NO_QIDS,
  }
}

/** No traps at all: every miss is replayed as itself. */
export const EMPTY_TRAP_INDEX: TrapIndex = buildTrapIndex({})

let cache: Promise<TrapIndex> | null = null

/** Load the trap index once per page lifetime. */
export function loadTrapIndex(): Promise<TrapIndex> {
  if (cache) return cache
  const p = (async () => {
    const res = await fetch(TRAP_INDEX_URL)
    if (!res.ok) {
      if (res.status === 404) return EMPTY_TRAP_INDEX
      throw new Error(`failed to load the trap index: HTTP ${res.status}`)
    }
    const body = (await res.json()) as Partial<TrapIndexFile> | null
    if (!body || typeof body.traps !== 'object' || body.traps === null) {
      throw new Error('failed to load the trap index: not a trap index file')
    }
    return buildTrapIndex(body.traps)
  })()
  cache = p
  p.catch(() => {
    if (cache === p) cache = null
  })
  return p
}

/** Test-only: clear the memoised index. */
export function __resetTrapIndexCache(): void {
  cache = null
}
