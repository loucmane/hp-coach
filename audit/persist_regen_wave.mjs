// Persist authored explanations from a dtk-explanation-regen-wave run
// into BOTH explanation stores, with _meta stamps. Idempotent (merge by
// qid). qa_flagged entries are held out and reported — they need a
// main-loop decision (see the KVA-022 prompt-repair precedent).
// Usage: node audit/persist_regen_wave.mjs <workflow-output-file>
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const OUT = process.argv[2]
const raw = readFileSync(OUT, 'utf8')
let res
try { res = JSON.parse(raw) } catch { res = JSON.parse(raw.slice(raw.indexOf('{'))) }
const r = res.result || res

const byExam = {}
const held = []
for (const d of r.done) {
  if (d.expl.qa_flag) { held.push({ qid: d.qid, note: d.expl.qa_note }); continue }
  const exam = d.qid.replace(/-(kvant|verb)\d-.*$/, '')
  ;(byExam[exam] = byExam[exam] || []).push(d)
}

let persisted = 0
for (const [exam, items] of Object.entries(byExam)) {
  for (const dir of ['app/public/explanations/', 'data/explanations/']) {
    const path = dir + exam + '.json'
    if (!existsSync(path)) throw new Error('missing store ' + path)
    const j = JSON.parse(readFileSync(path, 'utf8'))
    for (const d of items) {
      const prev = j[d.qid] || {}
      const { qa_flag, qa_note, ...fields } = d.expl
      j[d.qid] = {
        ...prev,
        ...fields,
        _meta: {
          ...(prev._meta || {}),
          generated_at: '2026-07-08',
          model: 'claude-fable-5',
          recipe: d.kind === 'regen' ? 'figure-grounded-regen-v1' : 'figure-grounded-medfix-v1',
        },
      }
    }
    writeFileSync(path, JSON.stringify(j, null, 1) + '\n')
  }
  persisted += items.length
  console.log(exam, '→', items.length, 'entries (both stores)')
}
console.log('\npersisted:', persisted, '| held (qa_flagged):', held.length)
for (const h of held) console.log('  HELD', h.qid, '—', h.note.slice(0, 160))
