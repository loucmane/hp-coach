# Worklog — hpf-qr0p.51.9 (LJ-12: confidence on attempts, session marks, lesson step and guess)

Marker: LJ12 CONFIDENCE

## Findings

- 2026-11-03: claimed on branch `codex/hpf-qr0p.51.9-ljusbord-lj-12-confidence-on-attempts-session-marks-lesson-s`, base `a5772305dca188e37bdaa65e75106d6a5b977241` (origin/main, which has migration 0016 from LJ-10). The tree was clean apart from the sandbox's `/dev/null` mounts at the worktree root (`.bashrc`, `.gitconfig`, `.mcp.json`, `.idea`, `.vscode` and others are character devices 1,3, not files). I left them alone and staged nothing outside the write set. `app/node_modules` and `worker/node_modules` were present.
- Read the rebuild map §0, §2 and the LJ-12 entry in §4, the LJ-10 worklog, `schema.ts`, `0016_ljusbord_expand.sql`, `lib/testD1.ts`, `lib/section.ts`, `lib/provenance.ts`, the three routes and their tests, `routes/mistakes.ts` (`PUT /round/:sessionId`), `routes/mockResults.ts`, and the app hooks that call these endpoints (`useAttempts.ts`, `useSessions.ts`, `useLessonProgress.ts`).
- LJ-10 already added every column this bead needs: `attempts.confidence` (typed with `CONFIDENCE_LEVELS`: `gissar`, `tror`, `saker`), `sessions.marks` (JSON `string[]`), and `lesson_progress.step` / `guess`. Every read that uses `select()` or `.returning()` already carries them. This bead adds the validated writes, plus the one explicit column list that lacked a field (`GET /sessions/:id/attempts`).
- Map §2 still lists `'guess', 'think', 'sure'` for confidence. The bead and the schema use the owner's `gissar` / `tror` / `saker`. The route validates against the schema's enum, and a test proves the English words get a 400.
- The repo's precedent for annotating an open session is `PUT /mistakes/round/:sessionId`. Another user's id is a 404 ("as everywhere"), the wrong kind is 400 `invalid_kind`, and an ended round is 400 `ended`. The open check sits in the UPDATE's WHERE ("still open at the write, too"). `POST /mock-results` does the same: 404, then 400 `invalid_kind`, then 400 `not_ended`. The header of `sessions.ts` says a forged id from another user "surfaces as 404, not 403, by design".
- Qid grammar: all 4,320 qids in `worker/data/authentic-qids.json` and all 315 in `p5-qid-registry.json` match `^[a-z0-9-]+-(ORD|LÄS|MEK|ELF|XYZ|KVA|NOG|DTK)-[0-9]{3}$`. I checked this with grep over the two files; the only P5 string that doesn't match is the `format` value. This is the shape `app/src/lib/trapIndex.test.ts` also asserts.
- The client keeps Markera as `mockSheet.flagged: Set<string>`, so it will send a duplicate-free list. The server still collapses duplicates, defensively.

## Decisions

- **Marks: status codes.** The bead says "403 or 409, matching the repo's conventions". I chose:
  - another user's (or a missing) session: **404** `not_found`, unchanged. This is the repo's documented ownership rule. The same PATCH already 404s there for position, device and end, and a 403 would tell a caller that someone else's session id exists.
  - the owner's session of another kind: **409** `invalid_kind`.
  - the owner's mock that has ended: **409** `ended`.

  The 409 codes reuse the repo's error-code names. **Flag for the coordinator:** if you want 403 for another user's id, or 400 to match `mockResults` and `mistakes/round`, each is a one-line change in the handler plus its test.
- **Marks: race-safe write.** The kind and open conditions sit in the UPDATE's WHERE, as in `mistakes/round`. A pass that ends on another device between two requests therefore keeps the marks it ended with. When the guarded write misses, one owner-scoped SELECT explains why. No route ever reopens a session or changes its kind, so an owned mock found there must have ended.
- **Marks: what is stored.**
  - A PATCH that carries `marks` is all-or-nothing: on a refusal, none of its other fields (position and so on) apply.
  - `marks` replaces the stored set. `[]` stores `[]` (the server knows there are none), while `null` still means "never stored".
  - Duplicates collapse to the first occurrence, as `layer1Ids` do in `POST /attempts`.
  - `marks` together with `end: true` is accepted on an open pass, so the client can flush its final marks with the submit.
  - Each entry must match the qid grammar above, including `lib/section.ts`'s legacy `LAS` spelling, and is at most 80 characters, like a plan entry. The list holds at most 80 entries.
  - Whether a mark is in the session's plan is not checked. The bead asks for format only.
- **"marks is returned where the session is read".**
  - `GET /active` uses `select()`, and the POST and PATCH responses use `.returning()`, so all three carry `marks`. Tests cover `/active` and the PATCH.
  - `GET /history` excludes `kind='mock'`, and only mock sessions take marks, so it has none to return. I left it unchanged.
- **Confidence.**
  - `z.enum(CONFIDENCE_LEVELS).optional()`. `null` is refused, as for the body's other optional fields (`timeTakenMs`, `layer1Ids`); absent means none was given.
  - It is validated on every session: the validator runs before the session lookup, so a bad value is a 400 on a mock too.
  - On `kind='mock'` a valid value is dropped and null is stored, as the bead says. This covers only `kind='mock'`: `mock_diagnostic` is a different kind and keeps its value.
  - The schedule rule is LJ-13's and is untouched here.
- **Lesson progress.**
  - `step` is an integer from 1 to 5, and `guess` is lower-case `a` to `e`, as in the bead and the LJ-10 schema comment. Both are nullable and optional, like `frameworkId` in the same body.
  - The PUT still replaces the whole bookmark. A PUT that leaves out `step` or `guess` stores null, exactly as one that leaves out `frameworkId` does. That way a step never outlives the entry it was taken on.
  - **Flag:** during the rollout, an old client's PUT clears a step that a new client wrote. That follows from the bookmark's existing replace semantics. The alternative, keeping the old step, could resume the wrong entry's lesson.
  - I folded the duplicated insert and conflict field lists into one `bookmark` object. Behaviour is unchanged: `section` and `userId` are still only in the insert.

## Progress

- **Red first.** I wrote the tests before touching any route. Command: `pnpm -C worker test src/routes/attempts.test.ts src/routes/sessions.test.ts src/routes/lessonProgress.test.ts`.
  - Result: exit 1, **Test Files 3 failed (3); Tests 16 failed | 34 passed (50)**.
  - `attempts.test.ts`: 25 tests, 2 failed. Valid confidence on a drill and on a mock both got 400 instead of 201, because the strict body refused the unknown key.
  - `sessions.test.ts`: 18 tests, 9 failed.
    - `GET /:id/attempts` had no `confidence`.
    - Every marks PATCH that should succeed got 400.
    - The 404 test got 400.
    - Both 409 tests got 400.
  - `lessonProgress.test.ts` (new file): 7 tests, 5 failed. Every PUT carrying `step` or `guess` got 400.
  - Some new tests passed on red, as expected:
    - the backward-compatibility tests: no confidence, a PATCH without marks, and the two "client that sends no step or guess" tests;
    - the two refusal tests ("refuses any other confidence value", "refuses anything but a list of qids"). They passed on red for a different reason: the strict schema refused the key itself.
- **Green.** After the route changes, the same command gave **Test Files 3 passed (3); Tests 50 passed (50)**.
- **Tests added** (22 in total):
  - `attempts.test.ts`, 4 tests:
    - each level is stored and returned;
    - 12 bad values (the English words, the Swedish labels, other casings, `''`, `2`, `true`, `null`, `['saker']`) each give 400, and nothing is written or counted;
    - a mock stores null, keeps the rest of the row, and still validates;
    - an answer without confidence lands as before.
  - `sessions.test.ts`, 11 tests:
    - confidence in `GET /:id/attempts`;
    - marks are stored and read back through `/active` on another device;
    - replace and clear;
    - duplicates collapse;
    - 80 marks accepted, 81 refused;
    - 12 malformed values refused with nothing written;
    - another user's session is a 404 and stays untouched;
    - drill, adaptive_review, mock_diagnostic and lesson sessions get 409, and none of the PATCH applies;
    - an ended pass gets 409 and keeps its marks and `endedAt`;
    - marks and `end` in one PATCH;
    - a PATCH without marks is unchanged on a drill, an open pass and an ended session.
  - `lessonProgress.test.ts`, new file, 7 tests:
    - step and guess are stored and returned on the PUT and on GET;
    - steps 1–5 and guesses a–e are accepted, with one row moved in place;
    - step 0, 6, -1, 2.5, `'2'` and `true`, and guess `f`, `A`, `ab`, `''` and `1`, are refused with nothing written;
    - null clears both;
    - each user's bookmark is scoped to that user;
    - a client that sends neither still works;
    - the whole bookmark is replaced.
- **Worker checks** (`worker/`):
  - `pnpm typecheck` passed.
  - `pnpm lint` passed, 63 files. The first run found one formatter issue in `sessions.test.ts`, which I fixed by hand.
  - `pnpm test` passed: **26 files, 561 tests**. This includes `assessmentGolden.test.ts`, whose snapshot was not re-recorded.
- **App checks** (`app/`):
  - `pnpm typecheck` passed. The typed hono client picks up the new optional request fields, the 409 responses and the extra `confidence` field without errors.
  - `pnpm lint` passed: 758 files, and the only output is 4 informational notices in existing devbake files that this bead doesn't touch.
  - The full `pnpm test`, run once without `--maxWorkers`, passed: **198 files, 5574 tests** in 66.31 s.
- `git diff --check` is clean, and the staged paths are exactly the write set.

## Result: done (work), but the bead could not be updated from this session

- Every item in the bead's goal and tests is done and verified. The changes are staged and uncommitted.
- Two decisions are flagged for the coordinator:
  1. the marks status codes (404 / 409 / 409);
  2. the lesson-progress PUT replacing the whole bookmark.

  The flagged alternatives are one-line changes.

### Bead commands failed (final steps not applied)

- **Step 1, the worker state.** `gc bd update "hpf-qr0p.51.9" --set-metadata "gc.worker_state=done" --set-metadata "gc.worker_state_reason=…"` was **denied twice by the managed permission policy** (don't-ask mode). The first reason text contained `;` and parentheses; the second was plain text. I did not try any other form, because a command outside the worker allowlist must fail and be reported.
- **Step 2, the note.** The allowlisted form `gc bd update hpf-qr0p.51.9 --append-notes '…'` passed the permission check, but **failed with exit 1** on the sandbox's read-only filesystem:
  - `open /home/loucmane/dev/hpfetcher-gc-main/.beads.gate.lock: read-only file system` (only a warning: the gate continued ungated);
  - `failed to open uow provider: … open /home/loucmane/gascity/city/.beads/dolt/proxy.lock: read-only file system` (the fatal error).

  This is deterministic, so I did not retry it.
- **Step 3, the park** (`--status deferred --assignee ""`). Not attempted: it needs the same store write, and the policy already refuses this command form.
- **Help needed (coordinator):** apply the three final steps by hand.
  - Set `gc.worker_state=done` and `gc.worker_state_reason` to "LJ-12 done. Confidence on attempts, null on mock. Marks PATCH on the owner open mock only. Lesson step and guess. Worker and app checks green. Seven files staged, uncommitted."
  - Append the note below.
  - Park the bead with `--status deferred --assignee ""`.

  The bead is still `in_progress` under this session's claim. To run these steps from a worker session, the sandbox needs write access to `/home/loucmane/gascity/city/.beads/dolt/` and the gate lock, and the policy must allow the metadata and park forms.

Final note, verbatim:

> LJ12 CONFIDENCE DONE: hpf-qr0p.51.9 — Confidence on attempts is validated and stored null on mock. PATCH sessions marks works only on the owner open mock, 404 for another user, 409 for another kind or an ended pass. Lesson progress PUT takes step 1 to 5 and guess a to e, returned on GET. Worker 561 tests and app 5574 tests green, typecheck and lint clean. The 7 write set files are staged, uncommitted. The worker_state metadata update was denied twice by the permission policy, please set it and park the bead by hand. Two decisions are flagged in the worklog.
