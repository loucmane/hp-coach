#!/usr/bin/env node
// Sync the strict-tier corpus (question bank + Layer 2 explanations) to
// the `hpc-content` R2 bucket that the worker's /api/content route serves.
//
// Source of truth: app/public/data/*.json and app/public/explanations/*.json
// — the exact files the SPA fetches in local mode, so R2 stays byte-for-byte
// identical to a dev checkout. Keys mirror the paths the route validates:
// `data/<exam>.json` and `explanations/<exam>.json`.
//
// Checksum-based, idempotent: a manifest of sha256 digests is kept in the
// bucket at `_sync/checksums.json`. Each run downloads it, uploads only the
// files whose content changed (new digest ≠ recorded digest), deletes keys
// that vanished from the source, then writes the refreshed manifest. A first
// run (no manifest) uploads everything; a no-op re-run uploads nothing but
// the manifest re-write.
//
// Wiring: called from .github/workflows/deploy.yml's staging + production
// jobs BEFORE the Pages deploy, so the corpus is live in R2 by the time the
// gated app (which no longer bundles it) goes up. Requires CLOUDFLARE_API_TOKEN
// (+ ACCOUNT_ID) in the environment — same creds the rest of the deploy uses.
//
// Usage: node scripts/content-sync.mjs   (env: WRANGLER_VERSION, default 4.42.0)

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const BUCKET = 'hpc-content'
const WRANGLER_VERSION = process.env.WRANGLER_VERSION ?? '4.42.0'
const MANIFEST_KEY = '_sync/checksums.json'
// Same whitelist the worker route enforces — never ship a non-.json or a
// nested path that /api/content would reject anyway.
const FILE_RE = /^[A-Za-z0-9_-]+\.json$/

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SOURCES = [
  { prefix: 'data', dir: path.join(REPO_ROOT, 'app/public/data') },
  { prefix: 'explanations', dir: path.join(REPO_ROOT, 'app/public/explanations') },
]

function wrangler(args, { capture = false, allowFail = false } = {}) {
  try {
    return execFileSync('pnpm', ['dlx', `wrangler@${WRANGLER_VERSION}`, ...args], {
      stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
      encoding: 'utf8',
      env: process.env,
    })
  } catch (err) {
    if (allowFail) return null
    throw err
  }
}

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

// 1. Create the bucket if it doesn't exist yet (first-ever deploy). Mirrors
//    the "Ensure Pages project exists" bootstrap already in deploy.yml.
const list = wrangler(['r2', 'bucket', 'list'], { capture: true, allowFail: true }) ?? ''
if (!list.includes(BUCKET)) {
  console.log(`content-sync: creating R2 bucket ${BUCKET}`)
  wrangler(['r2', 'bucket', 'create', BUCKET])
}

// 2. Pull the previous checksum manifest (absent on the first run).
const tmp = mkdtempSync(path.join(tmpdir(), 'hpc-content-sync-'))
const manifestFile = path.join(tmp, 'checksums.json')
let previous = {}
const got = wrangler(
  ['r2', 'object', 'get', `${BUCKET}/${MANIFEST_KEY}`, `--file=${manifestFile}`, '--remote'],
  { allowFail: true },
)
if (got !== null && existsSync(manifestFile)) {
  try {
    previous = JSON.parse(readFileSync(manifestFile, 'utf8'))
  } catch {
    console.warn('content-sync: manifest unreadable, treating as empty (full re-upload)')
  }
}

// 3. Walk the sources, uploading only changed/new files.
const next = {}
let uploaded = 0
let skipped = 0
for (const { prefix, dir } of SOURCES) {
  if (!existsSync(dir)) {
    console.warn(`content-sync: source dir missing, skipping: ${dir}`)
    continue
  }
  for (const name of readdirSync(dir).sort()) {
    if (!FILE_RE.test(name)) continue // skip _audit.md, *.txt, nested, etc.
    const key = `${prefix}/${name}`
    const filePath = path.join(dir, name)
    const digest = sha256(readFileSync(filePath))
    next[key] = digest
    if (previous[key] === digest) {
      skipped += 1
      continue
    }
    wrangler([
      'r2',
      'object',
      'put',
      `${BUCKET}/${key}`,
      `--file=${filePath}`,
      '--content-type=application/json',
      '--remote',
    ])
    uploaded += 1
  }
}

// 4. Delete keys that disappeared from the source (e.g. a retired exam), so
//    R2 never keeps serving stale gated content.
let deleted = 0
for (const key of Object.keys(previous)) {
  if (key in next) continue
  wrangler(['r2', 'object', 'delete', `${BUCKET}/${key}`, '--remote'], { allowFail: true })
  deleted += 1
}

// 5. Persist the refreshed manifest.
writeFileSync(manifestFile, JSON.stringify(next))
wrangler([
  'r2',
  'object',
  'put',
  `${BUCKET}/${MANIFEST_KEY}`,
  `--file=${manifestFile}`,
  '--content-type=application/json',
  '--remote',
])

console.log(
  `content-sync: ${uploaded} uploaded, ${skipped} unchanged, ${deleted} deleted (${Object.keys(next).length} keys total)`,
)
