#!/usr/bin/env node
// Public ORD deck manifest: IDs only. Prompts and options stay in the gated
// question bank. Regenerate after corpus/root changes; --check detects drift.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUTPUT = 'app/public/ord-words.json'
const readJson = (file) => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'))

// Pure entry point for small fixtures; importing the builder never writes the corpus.
export function buildOrdWords(questions, roots) {
  const rootsByQid = new Map()
  for (const entry of roots.entries) {
    for (const qid of entry.example_questions) {
      if (!rootsByQid.has(qid)) rootsByQid.set(qid, new Set())
      rootsByQid.get(qid).add(entry.id)
    }
  }

  const groups = new Map()
  for (const question of questions) {
    if (question.section !== 'ORD') continue
    const headword = question.prompt?.normalize('NFC').trim().replace(/\s+/g, ' ')
    if (!headword || question.parsing_status !== 'complete' || !question.options?.length) {
      throw new Error(`Incomplete ORD question: ${question.qid}`)
    }
    const key = headword.toLowerCase()
    const existing = groups.get(key)
    if (existing && existing.headword !== headword) {
      // IDs identify the conflicting sources without printing gated headwords.
      throw new Error(`ORD headword case collision: ${existing.qids.values().next().value} and ${question.qid}`)
    }
    if (!existing) groups.set(key, { headword, qids: new Set() })
    groups.get(key).qids.add(question.qid)
  }
  return [...groups.values()]
    .map((group) => {
      const qids = [...group.qids].sort()
      return {
        id: qids[0],
        qids,
        roots: [...new Set(qids.flatMap((qid) => [...(rootsByQid.get(qid) ?? [])]))].sort(),
      }
    })
    .sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}

function main() {
  const manifest = readJson('app/public/data/_index.json')
  const roots = readJson('app/public/frameworks/ord_roots.json')
  const questions = manifest.exams.flatMap(({ exam_id }) => readJson(`app/public/data/${exam_id}.json`))
  const words = buildOrdWords(questions, roots)
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
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
