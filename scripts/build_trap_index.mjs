#!/usr/bin/env node
// Build app/public/trap-index.json — which Layer 1 trap each question
// carries (hpf-bz6f.2).
//
// Repetera repeats a LÄS/MEK/ELF/quant miss through a NEW question with the
// same trap ("Samma fälla, ny fråga"). The trap is each explanation's
// `framework_id`; this script distils app/public/explanations/{exam}.json
// into a small static map — question ids and trap ids only, no content —
// that the SPA loads as a public asset (app/src/lib/trapIndex.ts).
// Questions without a trap id (all of ORD, and the untagged rest) are left
// out.
//
// Deterministic: qids sorted, two-space JSON, trailing newline. The app's
// src/lib/trapIndex.test.ts asserts the committed file equals
// renderTrapIndex(), so re-run this after any change to the explanations.
//
// Usage:
//   node scripts/build_trap_index.mjs          # write the index
//   node scripts/build_trap_index.mjs --check  # exit 1 when it is stale

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPLANATIONS_DIR = path.join(REPO_ROOT, 'app/public/explanations')
const OUT_FILE = path.join(REPO_ROOT, 'app/public/trap-index.json')
const OUT_LABEL = 'app/public/trap-index.json'
// Exam files only: `_index.json` and the audit notes start with `_`.
const EXAM_FILE_RE = /^[a-z0-9-]+\.json$/

/** qid → framework id for every explanation that carries one, in qid order. */
export function collectTraps(dir = EXPLANATIONS_DIR) {
  const traps = new Map()
  const files = readdirSync(dir)
    .filter((file) => EXAM_FILE_RE.test(file))
    .sort()
  for (const file of files) {
    const explanations = JSON.parse(readFileSync(path.join(dir, file), 'utf8'))
    for (const [qid, explanation] of Object.entries(explanations)) {
      const trap = explanation?.framework_id
      if (typeof trap === 'string' && trap.length > 0) traps.set(qid, trap)
    }
  }
  return Object.fromEntries([...traps.keys()].sort().map((qid) => [qid, traps.get(qid)]))
}

/** The exact text of app/public/trap-index.json. */
export function renderTrapIndex(dir = EXPLANATIONS_DIR) {
  const index = {
    version: 1,
    generator: 'scripts/build_trap_index.mjs',
    traps: collectTraps(dir),
  }
  return `${JSON.stringify(index, null, 2)}\n`
}

function main(args) {
  const text = renderTrapIndex()
  const traps = Object.values(JSON.parse(text).traps)
  const summary = `${traps.length} questions, ${new Set(traps).size} traps`
  if (args.includes('--check')) {
    let current = null
    try {
      current = readFileSync(OUT_FILE, 'utf8')
    } catch {
      // Missing reads as stale.
    }
    if (current !== text) {
      console.error(`build_trap_index: ${OUT_LABEL} is stale (${summary}); re-run without --check`)
      process.exit(1)
    }
    console.log(`build_trap_index: ${OUT_LABEL} is up to date (${summary})`)
    return
  }
  writeFileSync(OUT_FILE, text)
  console.log(`build_trap_index: wrote ${OUT_LABEL} (${summary})`)
}

// Run only as a script; the app's test imports renderTrapIndex directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2))
}
