// One-off repair: var-2018-1 kvant2 + verb2 answer keys.
//
// ROOT CAUSE (see docs/dtk-content-audit.md + audit/facit_sweep.py): the
// facit PDF has corrected pp4/pp5 columns pasted as IMAGE overlays over
// stale text; the parser extracted the stale text → wrong keys for both
// second passes. TRUE keys below were vision-read TWICE from the overlay
// images (whole-page render + 300dpi crops, identical reads), and the
// DTK subset (kvant2 q29–40) is independently confirmed 12/12 by the
// figure-grounded audit.
//
// Applies to: data/parsed/var-2018-1.json + app/public/data/var-2018-1.json.
// Also DELETES explanations for qids whose answer CHANGED (they were
// generated to justify the wrong letter; the app renders a graceful
// missing-explanation state) in both data/explanations/ and
// app/public/explanations/. Prints the affected qid list for the
// attempts purge.
import { readFileSync, writeFileSync } from 'node:fs'

const PP4 = 'B B A B D C C D B C D A D A A B B B A C B C B C D E B C C D A C B C D A B C C B'.split(' ')
const PP5 = 'B C C C B D C E E A B D C A D D A C B D B D C B D A C C B A A C C B D B C B D D'.split(' ')
const KEYS = { kvant2: PP4, verb2: PP5 }

const changed = []
for (const bank of ['data/parsed/var-2018-1.json', 'app/public/data/var-2018-1.json']) {
  const j = JSON.parse(readFileSync(bank, 'utf8'))
  const qs = Array.isArray(j) ? j : j.questions
  let nChanged = 0
  for (const q of qs) {
    const m = /var-2018-1-(kvant2|verb2)-[A-ZÅÄÖ]+-(\d+)$/.exec(q.qid)
    if (!m) continue
    const truth = KEYS[m[1]][q.number - 1]
    if (!truth) throw new Error('no truth for ' + q.qid)
    if (q.options && q.options.length && !q.options.some((o) => o.letter === truth)) {
      throw new Error(`${q.qid}: true answer ${truth} not among options ${q.options.map((o) => o.letter).join('')}`)
    }
    if (q.answer !== truth) {
      if (bank.startsWith('data/')) changed.push(q.qid)
      q.answer = truth
      nChanged++
    }
  }
  writeFileSync(bank, JSON.stringify(j, null, 1) + '\n')
  console.log(bank, '→', nChanged, 'answers corrected')
}

let nDropped = 0
for (const ex of ['data/explanations/var-2018-1.json', 'app/public/explanations/var-2018-1.json']) {
  const j = JSON.parse(readFileSync(ex, 'utf8'))
  let n = 0
  for (const qid of changed) {
    if (j[qid]) {
      delete j[qid]
      n++
    }
  }
  writeFileSync(ex, JSON.stringify(j, null, 1) + '\n')
  console.log(ex, '→', n, 'stale explanations dropped')
  nDropped = n
}

console.log('\nchanged qids (' + changed.length + ') — purge attempts on these:')
console.log(JSON.stringify(changed))
