# Worklog — hpf-qr0p.51.34 (LJ16 FEEDBACK)

LJ-16: the explanation feedback endpoint ("Hjälpte förklaringen?" to the server), round 1, Claude worker.

## Start
- 2026-11-23: claimed via `gc hook --claim --json` (session ci-wisp-9nxk3c6, route hpfetcher/gc.implementation-worker). Branch `codex/hpf-qr0p.51.34-ljusbord-lj-16-explanation-feedback-endpoint-put-get-client-`, base 5fe0287747e30f488d5793bcea1e3855d9dca461. The tree was clean apart from sandbox placeholder dotfiles (`.bashrc`, `.gitconfig`, `.idea`, `.mcp.json`, ...), which are untracked and not mine. `app/node_modules` and `worker/node_modules` were present.
- Read: rebuild-map §0, §2 (the feedback row) and the §4 LJ-16 entry; `app/src/api/feedback.ts` and its four consumers; `app/src/data/contentSource.ts` and `main.tsx` (ContentAuthBridge); `worker/src/index.ts`, the `explanation_feedback` table (schema.ts and 0016), the migration test's verdict values (`ja`, `delvis`, `nej`), and the mistakes, dailyPlans, sessions and insights routes and tests.

## Decisions
- **Paths** follow the bead, which supersedes the map's `/api/explanation-feedback`: `PUT /api/explanations/feedback/:qid` and `GET /api/explanations/feedback`, mounted in the authed sub-app as `.route('/explanations/feedback', …)`, like `/mistakes`.
- **Verdicts** are stored as `ja`, `delvis` and `nej`, the values the 0016 migration test already writes.
- **The QID pattern** is the Markera pattern from `routes/sessions.ts` (LJ-12). It is a module-local const there and sessions.ts is outside the write set, so the route repeats it verbatim. A parity test sends 23 ids (valid and invalid) to both routes and requires the same status from each, so the two copies cannot drift. Follow-up 3 below hoists it.
- **PUT replaces the whole row.** A note or model that the later answer leaves out is cleared, and `created_at` becomes the time of the later answer, so GET's newest-first order follows the latest answer. `created_at` is whole seconds, so the row id breaks ties. The body is `.strict()`: `verdict` (ja, delvis or nej), `note` (at most 500 characters) and `model` (1 to 100 characters). No field can name an owner or a question.
- **GET** returns `qid`, `verdict`, `note`, `model` and `createdAt`, never `user_id` or the row id. There is one row per question, so the question bank bounds the list and it needs no paging.
- **Client mapping, nothing lost.** approved maps to `ja`. A rejection whose notes are exactly `Delvis` (what the Facit stores for its Delvis choice) maps to `delvis`. Any other rejection maps to `nej`. The note is sent verbatim, cut to 500 characters. The model is sent only when it is 1 to 100 characters (the Facit falls back to `''`). A server row therefore reads back as the local entry.
- **Transport:** the typed hono client (`makeApiClient`), so the path and the body are checked against the worker's AppType at compile time. The token comes from a new `contentAuthToken()` in contentSource.ts, which awaits the getter that ContentAuthBridge registers, as `contentFetch` does. That function is the only change in that file.
- **Retry once.** A failed PUT (a network error or any non-2xx status) puts its qid on an unsent list in localStorage (`hpc:explanation-feedback-unsent`). The key is outside the entry prefix, so getAllFeedback and clearFeedback never see it. The next submit, or the next app load (when the module loads), takes the list and sends each answer as it is stored by then, exactly once. A retry that fails as well is dropped, and the local copy stays. A new answer to the same question replaces its unsent one, and a cleared answer is not brought back. With no token (signed out, or no Clerk) nothing is sent and nothing is queued. An app load with a list waiting holds off until a token is there.
- **Identity:** the local store belongs to the device, not to an account. Each unsent qid therefore records the Clerk user who gave the answer (the token's `sub`, decoded locally and only compared on the device). A retry goes out only under that user's token, so another account signing in on the same device never sends someone else's answer.
- **Ordering:** PUTs for the same question are chained. Two quick answers (Nej, then Delvis) reach the server in the order given, and the later one is the one kept. I found this while reviewing my own code and added it red-first.

## Red-first evidence
- Worker, before the route existed: `pnpm test src/routes/explanationFeedback.test.ts --maxWorkers=8` failed 1 file, with 10 tests failed and 1 passed (of 11). Every PUT and GET got 404 (`expected 404 to be 200`, `expected 404 to be 400`). The parity test failed on `[ORD, 404]` against `[ORD, 200]`. The one pass is the auth test: requireAuth guards every `/api/*` path, so the 401 already held. It stays as the guard on the mounted route.
- Client, on the v1 seam: `pnpm test src/api/feedback.test.ts --maxWorkers=8` gave 12 failed and 5 passed (of 17). Every PUT expectation saw `[]` because nothing was sent. The five passes are the API-shape guards and the no-token cases, which v1 already met.
- Ordering, before `putInOrder`: 1 failed and 17 passed (of 18). The second ORD answer was sent while the first was still pending.

## Verification (final code)
- worker: `pnpm typecheck` PASS. `pnpm lint` PASS (69 files). `pnpm test --maxWorkers=8`: 29 files and 729 tests passed; the feedback file passed 11/11.
- app: `pnpm typecheck` PASS. `pnpm lint` PASS, with the 4 pre-existing informational notices in devbake files. `pnpm test --maxWorkers=8`: 216 files and 6,381 tests passed in 55.4 s; `feedback.test.ts` passed 18/18. No browser or timing check overlapped the run.
- After two comment-only edits (the index.ts CORS note and the feedback.ts header), I reran: worker lint, typecheck and feedback tests (11/11) PASS; app typecheck PASS; biome check on the 3 changed app files clean; the feedback, contentSource and Facit tests 31/31.
- `git diff --check` and `git diff --cached --check` are clean.
- No migration was added and no dependencies changed. The four consumers (Facit.tsx, ExplanationPanel.tsx, PedagogyPanel.tsx, coach.tsx) are untouched. No UI changed, so there is no visual check.

## Files (SHA-256)
- `worker/src/routes/explanationFeedback.ts` df77f4fd84ce41d3f06fd1af875275d39f1f93c49d0f48417342b7bd4db5350d
- `worker/src/routes/explanationFeedback.test.ts` 3272107f47bfc21c432f4b8023c198f5a10cce4ef93945814ad875c7ec122b80
- `worker/src/index.ts` f6dc3b2047704e7201273fb7fd4443a6478712d5c78af0a6396a34b7230740ce
- `app/src/api/feedback.ts` a0c3257b410aff3bb8f73df4092d1b42b591f401c70155304e483717d640d257
- `app/src/api/feedback.test.ts` bdfe1f4b689a83c30b3ab0d69d7deeef201a69deb20ada2d77c2624200640532
- `app/src/data/contentSource.ts` 373c20ad24a25ea9da31b643b31959d53f189a4df261ea02f8a1e888404c0afb

## Follow-ups (outside this write set)
1. `worker/src/routes/export.ts`: its header says `explanation_feedback` has no route and is not exported, which is now stale. /me/export and /me/import should carry these rows (rebuild map line 281).
2. `app/src/routes/coach.tsx`: a comment says "POST /api/explanations/feedback", but the route is `PUT /:qid`. Its dashboard still reads localStorage, which is by design, since reads stay local.
3. Hoist the QID pattern into `worker/src/lib/section.ts` and import it in both sessions.ts and explanationFeedback.ts. The parity test can then go.
4. `created_at` is the time the server receives the answer, so a retried answer is dated at its retry, not at the click. The bead's body has no client time; add one if Konto needs the click time.
5. Rebuild map §2 still names `PUT/GET /api/explanation-feedback`; the bead's path is the one built.

## Delivery
- HEAD is still the base, 5fe0287; nothing is committed. The 7 write-set files are staged. The sandbox's untracked dotfiles are not mine and are not staged.
- One `bd update --append-notes` attempt, and it succeeded.
- The bead is left open and in progress for the coordinator to park.

## Final state: done
Every goal and test in the bead is met: the worker route with upsert, validation, user isolation, ordered GET and refused unauthenticated requests; the client seam with the local write, the mapped PUT, a swallowed and once-retried failure, local-only when signed out, and the exported API unchanged; and the token getter in contentSource.ts. Nothing remains inside this write set.

LJ16 FEEDBACK DONE: hpf-qr0p.51.34 — PUT/GET /api/explanations/feedback mounted under the authed API, plus the v2 client seam (local cache, fire-and-forget PUT, one retry, lossless Ja/Delvis/Nej mapping), red-first; worker 729/729, app 6381/6381, typecheck and lint clean; 7 files staged, uncommitted
