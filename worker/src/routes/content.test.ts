// Tests for /api/content/:file — the authenticated strict-tier content
// route that serves the question bank (data/*.json) and Layer 2
// explanations (explanations/*.json) from the CONTENT R2 bucket.
//
// Covers: auth gate (401 unauthenticated), path-traversal / whitelist
// rejection, correct content-type + Cache-Control, an R2-miss 404, and
// the happy path. The route is mounted the way index.ts mounts it —
// under the authed sub-app — so the auth middleware runs in front.

import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { requireAuth } from '../middleware/auth'
import type { Env, Vars } from '../types'
import { contentRoute, isValidContentPath } from './content'

// Minimal in-memory R2 stand-in — only the `get` method the route uses.
function makeFakeR2(files: Record<string, string>): R2Bucket {
  return {
    get: async (key: string) => {
      if (!(key in files)) return null
      const body = files[key]
      return {
        body: new Response(body).body,
        // The route reads .body only; the rest of the R2Object surface is
        // unused, so a partial shim is enough.
      } as unknown as R2ObjectBody
    },
  } as unknown as R2Bucket
}

// Build an app that mounts the content route under /api/content, guarded
// by the REAL requireAuth middleware, mirroring index.ts's authed sub-app.
function appFor(files: Record<string, string>) {
  const env = {
    CONTENT: makeFakeR2(files),
    CLERK_SECRET_KEY: 'sk_test_unused',
    ENVIRONMENT: 'staging',
  } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>().use('*', requireAuth)
  app.route('/api/content', contentRoute)
  return { app, env }
}

// Build an app where auth is pre-satisfied (a stub sets userId), so we can
// exercise the route body without a real Clerk token.
function authedAppFor(files: Record<string, string>) {
  const env = { CONTENT: makeFakeR2(files) } as unknown as Env
  const app = new Hono<{ Bindings: Env; Variables: Vars }>().use('*', async (c, next) => {
    c.set('userId', 'user_test')
    await next()
  })
  app.route('/api/content', contentRoute)
  return { app, env }
}

describe('isValidContentPath', () => {
  it('accepts known data/ and explanations/ json files', () => {
    expect(isValidContentPath('data/var-2024.json')).toBe(true)
    expect(isValidContentPath('data/_index.json')).toBe(true)
    expect(isValidContentPath('explanations/host-ver1-2019.json')).toBe(true)
    expect(isValidContentPath('explanations/_index.json')).toBe(true)
  })

  it('rejects path traversal', () => {
    expect(isValidContentPath('data/../secret.json')).toBe(false)
    expect(isValidContentPath('../data/var-2024.json')).toBe(false)
    expect(isValidContentPath('data/..%2fsecret.json')).toBe(false)
  })

  it('rejects non-whitelisted prefixes', () => {
    expect(isValidContentPath('figures/dtk/x.json')).toBe(false)
    expect(isValidContentPath('frameworks/ORD.json')).toBe(false)
    expect(isValidContentPath('secret.json')).toBe(false)
  })

  it('rejects non-json and nested paths', () => {
    expect(isValidContentPath('data/var-2024.txt')).toBe(false)
    expect(isValidContentPath('data/sub/dir.json')).toBe(false)
    expect(isValidContentPath('data/')).toBe(false)
  })
})

describe('GET /api/content/:file — auth', () => {
  it('401s without a bearer token', async () => {
    const { app, env } = appFor({ 'data/var-2024.json': '[]' })
    const res = await app.request('/api/content/data/var-2024.json', {}, env)
    expect(res.status).toBe(401)
  })
})

describe('GET /api/content/:file — authed', () => {
  it('serves a whitelisted file with json content-type and private cache', async () => {
    const payload = JSON.stringify([{ qid: 'var-2024-verb1-ORD-001' }])
    const { app, env } = authedAppFor({ 'data/var-2024.json': payload })
    const res = await app.request('/api/content/data/var-2024.json', {}, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(res.headers.get('cache-control')).toBe('private, max-age=3600')
    expect(await res.text()).toBe(payload)
  })

  it('serves an explanations file', async () => {
    const { app, env } = authedAppFor({ 'explanations/host-2025.json': '{}' })
    const res = await app.request('/api/content/explanations/host-2025.json', {}, env)
    expect(res.status).toBe(200)
  })

  it('400s a path-traversal / non-whitelisted request without touching R2', async () => {
    const { app, env } = authedAppFor({ 'data/var-2024.json': '[]' })
    const res = await app.request('/api/content/frameworks/ORD.json', {}, env)
    expect(res.status).toBe(400)
  })

  it('404s when the object is absent from R2', async () => {
    const { app, env } = authedAppFor({ 'data/var-2024.json': '[]' })
    const res = await app.request('/api/content/data/var-1999.json', {}, env)
    expect(res.status).toBe(404)
  })
})
