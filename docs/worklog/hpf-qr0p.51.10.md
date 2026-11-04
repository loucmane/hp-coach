# Worklog — hpf-qr0p.51.10 (LJ-13: mistake reason and confidence-aware scheduling)

Marker: LJ13 SCHEDULE

## Findings

- 2026-11-03: claimed on branch `codex/hpf-qr0p.51.10-ljusbord-lj-13-mistake-reason-and-confidence-aware-schedulin`, base `a5772305dca188e37bdaa65e75106d6a5b977241`, which already has migration 0016. The worktree was clean, and `app/node_modules` and `worker/node_modules` were present.
- Read the rebuild map §0 (owner decisions), §2 (the confidence rows) and the LJ-13 entry in §4. Also read `lib/srs.ts` and its tests, `routes/mistakes.ts` and its tests, the 0016 SQL and `schema.ts`:
  - `CONFIDENCE_LEVELS` = `gissar` / `tror` / `saker`;
  - `MISTAKE_REASONS` = `wrong` / `lucky` / `flagged` / `manual`;
  - `mistakes.reason` defaults to `'wrong'`; `mistakes.last_confidence` is nullable.
- The approved design states the policy in its copy:
  - Repetera's ladder: "Nytt fel · i slutet av passet, sedan i morgon", and "Ett nytt fel flyttar frågan ett steg ner, aldrig till början. Ett säkert fel kommer tillbaka lite tidigare."
  - facit-fel (a Säker miss): "Fällan kommer tillbaka i slutet av passet och i morgon".
  - provresultat: "rätt men gissad · tillbaka ändå".
- `scope=pile` counts a row touched today while `intervalMinutes ≤ RELEARN_MINUTES`. Any rule that left a row on the relearn rung with a due time tomorrow would therefore put an item on today's pile that cannot be done today. Neither rule below does that.
- No app code reads `intervalMinutes` today. The classic `/repetition` sends right answers through `/by-question` and misses through POST. `useAdaptiveReview` skips rows whose `lastErrorAt` is null.

## Decisions

- **Säker + wrong: the relearn rung is halved.** `SURE_RELEARN_MINUTES = RELEARN_MINUTES / 2`, so the row comes back in 5 min instead of 10. Everything else is a plain miss: the same banked height (lapse memory), the same climb back (day 1, or half the banked height), `errorCount7d + 1` and `lastErrorAt = now`. Why this rule:
  - it is sooner on every row, fresh or lapsed. The map's alternative ("no banked height") changes nothing for a fresh miss, and it contradicts "aldrig till början";
  - the row stays on the relearn rung, so the pile semantics are unchanged;
  - it is ready before a ten-question pass (about 8 min) ends, which matches "i slutet av passet";
  - the real ladder (1 day doubling to 30, graduation, exam rules) is untouched.
- **Gissar + right is not counted as known:**
  - **A question with no row** gets a new row: reason `'lucky'`, on the 1-day rung (`intervalMinutes` = 1 day), due in one day, `errorCount7d` 0 and `lastErrorAt` NULL, because no error happened. It is not on today's pile; it is on tomorrow's.
  - **A resolved (graduated) row** is reactivated the same way: status `active`, reason `lucky`, 1-day rung, due in one day. Its error history is kept.
  - **Any other existing row** (active, or a legacy pending-review status) is kept exactly as it is. Nothing advances, graduates or moves, and its reason stays. Only `lastConfidence` is written. Why not relabel it `'lucky'`: a lucky row graduates on one counted right answer, so relabelling a real miss would let a guess plus one right answer skip its whole ladder. Why not move it to tomorrow: a row missed today, on the relearn rung, would then sit on today's pile without being due.
  - **A lucky row's next counted right answer** (Tror det, Säker or none) graduates it to status `'resolved'`: it comes back once. There is no exam hold for this graduation, since it is not a capped ladder row. This applies on all three right-answer paths (`/:id/review`, `/by-question` and `PATCH /:id`), so it does not depend on which path a client uses.
  - A right Gissar answer on a lucky row keeps it. A miss turns it into a plain `'wrong'` row on the normal ladder.
- **Tror det, Gissar + wrong, Säker + right and no confidence** return today's `nextOnWrong` / `nextOnCorrect` unchanged. The unit tests compare them with `toEqual` on every rung, with and without an exam.
- **POST `/api/mistakes`:**
  - It takes an optional `confidence` (`CONFIDENCE_LEVELS`) and an optional `reason` (`MISTAKE_REASONS`, default `'wrong'`).
  - `'lucky'` records a right Gissar answer, so it must come with `confidence: 'gissar'`; otherwise the response is 400.
  - `'flagged'` and `'manual'` keep today's POST schedule exactly. Only a `'wrong'` POST is rated by its confidence: "Lägg i Repetera ändå" after a right Säker answer is not a confident error.
  - Every POST write stores `reason` and `lastConfidence` (null when none was sent).
- **PATCH `/:id/review`:**
  - It takes an optional `confidence`. The optional `reason` must be the one the answer implies: `'wrong'` for `correct: false`, `'lucky'` for a right Gissar answer. Anything else is a 400.
  - A miss writes reason `'wrong'`. Every write stores `lastConfidence`.
  - The early return for a counted right answer on a non-active row is unchanged: it writes nothing.
- **`/by-question` and `PATCH /:id`** take no new fields, and neither writes `lastConfidence`. The lucky graduation is their only change.
- **The pure function** is `applyConfidence(answer, row, now, examAt)` in `lib/srs.ts`. Its overloads give each route an exact result type:
  - a miss gives `WrongOutcome`;
  - a right Gissar answer gives `LuckyOutcome | KeepOutcome`, and only `LuckyOutcome` when there is no row;
  - a counted right answer gives `CorrectOutcome`.

  The routes call it instead of `nextOnWrong` and `nextOnCorrect`. Those two functions and every ladder constant are unchanged.

## Progress

- **Red first.** I wrote the tests before any implementation change. Command: `pnpm -C worker exec vitest run src/lib/srs.test.ts src/routes/mistakes.test.ts`.
  - Result: exit 1, **Test Files 2 failed (2); Tests 28 failed | 122 passed (150)**.
  - `srs.test.ts`: 51 tests, 11 failed, with `applyConfidence is not a function` and `SURE_RELEARN_MINUTES` undefined.
  - `mistakes.test.ts`: 99 tests, 17 failed, mostly 400 instead of 200/201 (the strict bodies rejected `confidence` and `reason`), plus the test helper reading `mistake.id` from a 400 body.
  - All existing tests passed. Three of the 20 new route tests passed already, as they should: a review miss with no confidence, a review right answer with no confidence, and the rejection test. They pin today's behaviour.
- **Green.** The same command gave **Test Files 2 passed (2); Tests 150 passed (150)**.
- **Typecheck fix.** The first worker typecheck flagged one new test, which passed an exam to the Gissar overload. That overload has no exam parameter, because the guess path never reads one, so I removed the exam loop from the test. Biome reformatted the two test files (`biome check --write` on the four changed files only).
- **Worker checks.**
  - `pnpm typecheck` passed.
  - `pnpm lint` passed (62 files).
  - `pnpm test` passed: **25 files, 570 tests** (539 before, plus 31 new), including `assessmentGolden.test.ts`, whose snapshot was not re-recorded.
- **App checks.**
  - `pnpm typecheck` passed; the RPC types still accept the old request bodies.
  - `pnpm lint` passed (758 files). The 4 informational notices are in existing devbake files that I didn't touch.
  - The full `pnpm test`, run once without `--maxWorkers`, passed: **198 files, 5574 tests** in 61.68 s.
- **Existing tests:** no existing srs or mistakes assertion was edited. `srs.test.ts` only gained two names in its import, and `mistakes.test.ts` one header sentence.
- **Diff hygiene:** `git diff --check` is clean, and the changed paths are exactly the write set.
  - `git status` also lists untracked dotfiles in the worktree root (`.bashrc`, `.gitconfig`, `.mcp.json`, `.idea`, …).
  - They are character devices 1,3, the sandbox's `/dev/null` bind mounts over protected paths, not files of this change. They are not staged.

## What the new tests cover

- **Unit tests (`srs.test.ts`):**
  - Säker + wrong is half the rung, sooner from every rung, banks the same height, stays at or below the relearn rung, and climbs back on the real ladder;
  - Gissar + right creates or reactivates a lucky item, or keeps a row already in Repetera;
  - a lucky row graduates on its next counted right answer, whatever the exam, and lapses like any row on a miss;
  - Tror det equals today's rules;
  - no confidence (absent or null) equals today's rules;
  - Gissar + wrong and Säker + right equal today's rules.
- **Route tests (`mistakes.test.ts`):** they drive the real routes and read the rows back:
  - a Säker miss is due after 5 minutes and is on today's pile at once;
  - a Säker lapse keeps 8 days banked and resumes at 4 days;
  - a lucky item is off today's pile and back tomorrow, then leaves for good on `/:id/review`, `/by-question` or `PATCH /:id`;
  - a lucky item guessed again is unchanged; missed, it becomes a plain miss with no shortcut;
  - a row already in Repetera is byte-equal after a right Gissar answer (POST and review), and its next counted right answer moves it as normal;
  - a graduated question comes back once (POST and review);
  - review misses and right answers for each confidence;
  - flagged and manual keep the miss schedule;
  - validation 400s that write nothing;
  - backward compatibility: a client sending no confidence gets exactly the rows a Tror det client gets, with reason `'wrong'` and nothing stored as confidence.

## Notes for later beads

- **LJ-17 / LJ-24 / LJ-28:**
  - send a right Gissar answer as POST `{questionId, confidence: 'gissar', reason: 'lucky'}`;
  - for a Repetera repeat of the same question answered right with Gissar, POST `'lucky'` too, which keeps the row. `/by-question` carries no confidence, so its answer always counts;
  - repeats with a new question use `/:id/review {correct, confidence}`.
- **LJ-11:** import maps a null `lastErrorAt` to the import time and does not restore `reason` or `lastConfidence`. To round-trip a lucky row, it must restore `reason` and keep `lastErrorAt` null.
- **LJ-26 / LJ-28:** a Säker miss sits at `intervalMinutes` 5. Bucket the rungs by `≤ RELEARN_MINUTES` or `< FIRST_INTERVAL_MINUTES`, never `=== 10`. A lucky row sits on the 1-day rung with reason `'lucky'` and comes back once.

## Final state: done

Every item in the write set is finished and checked. The changes are staged and uncommitted.
