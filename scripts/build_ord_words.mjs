#!/usr/bin/env node
// Public ORD deck manifest: IDs only. Prompts and options stay in the gated
// question bank. Regenerate after corpus/root changes; --check detects drift.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = 'app/public/ord-words.json'
const readJson = (file) => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'))
const manifest = readJson('app/public/data/_index.json')
const roots = readJson('app/public/frameworks/ord_roots.json')
const rootsByQid = new Map()
for (const entry of roots.entries) {
  for (const qid of entry.example_questions) {
    if (!rootsByQid.has(qid)) rootsByQid.set(qid, new Set())
    rootsByQid.get(qid).add(entry.id)
  }
}

const groups = new Map()
for (const { exam_id } of manifest.exams) {
  for (const question of readJson(`app/public/data/${exam_id}.json`)) {
    if (question.section !== 'ORD') continue
    const key = question.prompt?.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase()
    if (!key || question.parsing_status !== 'complete' || !question.options?.length) {
      throw new Error(`Incomplete ORD question: ${question.qid}`)
    }
    if (!groups.has(key)) groups.set(key, new Set())
    groups.get(key).add(question.qid)
  }
}
const words = [...groups.values()].map((group) => {
  const qids = [...group].sort()
  return {
    id: qids[0],
    qids,
    roots: [...new Set(qids.flatMap((qid) => [...(rootsByQid.get(qid) ?? [])]))].sort(),
  }
}).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
const text = `${JSON.stringify({ version: 1, generator: 'scripts/build_ord_words.mjs', words }, null, 2)}\n`

if (process.argv.includes('--check')) {
  let current = null
  try { current = readFileSync(path.join(ROOT, OUTPUT), 'utf8') } catch { /* missing = stale */ }
  if (current !== text) {
    console.error(`build_ord_words: ${OUTPUT} is stale; re-run without --check`)
    process.exit(1)
  }
  console.log(`build_ord_words: ${OUTPUT} is up to date (${words.length} words)`)
} else {
  writeFileSync(path.join(ROOT, OUTPUT), text)
  console.log(`build_ord_words: wrote ${OUTPUT} (${words.length} words)`)
}
