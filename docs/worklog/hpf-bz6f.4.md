---
bead: "hpf-bz6f.4"
project: "hpfetcher"
session: "ci-wisp-76zj57u"
status: "implemented_uncommitted"
---

# Worklog — hpf-bz6f.4

**The honest prognosis, first slice.** Home, the rail and Framsteg's hero now count each question's **first try** only:
- a retry of a question already answered does not count;
- a Repetera (`adaptive_review`) replay does not count;
- a changed answer inside a mock counts once.

The total carries a 95% band. A week-over-week change shows its figure only when it clears the noise; otherwise the screen says "stabil, inom felmarginalen". No D1 migration. The golden snapshot is unchanged.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-bz6f.4`, assignee `ci-wisp-76zj57u`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-bz6f.4 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`. The design text was the "LATEST INSTRUCTION (round 1)" brief.
- **Checkout.** `HEAD` = `origin/main` = `ff02475111a7d876a638a44c07eea40ddf528b7a`, on `codex/hpf-bz6f.4-honest-prognosis-timed-passes-and-first-attempts-drill-accur`.
  - The tracked tree was clean at the start, and `app/node_modules` and `worker/node_modules` were present (no wait needed).
  - The untracked dotfile names that `git status` lists (`.bashrc`, `.gitconfig`, `.mcp.json`, `.idea` and others) are this sandbox's path masks. They are not repository files and were left alone.
- **Constraints kept.**
  - No commit and no dependency change.
  - No network.
  - No migration.
  - No snapshot re-recorded.
  - Only the 12 write-set paths changed.
- **Check script.** `gc.check_path` is `build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`. The bead names no validator, so it was not run.

## One deviation from the brief: the first-try fields are opt-in (`?firstTry=1`)

The brief asks for two things: new per-section fields on `/me/stats`, and an `assessmentGolden.test.ts` that stays green unchanged. Both cannot hold if the fields are always sent:
- the golden test compares the **whole** `/me/stats` body with `toMatchSnapshot` (only `estimateBasis` and `uncalibrated` are stripped), so any new key changes the serialized snapshot and fails it;
- re-recording is forbidden, and the test file is outside the write set.

**Resolution.**
- `GET /api/me/stats` with no query returns exactly the old body. The golden test pins it, and the snapshot sha256 is unchanged (below).
- `GET /api/me/stats?firstTry=1` returns the same body **plus** six fields per section. `useStats` always sends `firstTry=1`, so there is still one request and one cache key, and every consumer gets the superset.
- A new route test asserts that the opt-in body, with the six fields removed, deep-equals the default body. Opting in changes no existing number.

## Deliverables (uncommitted, staged)

| Path | Change |
|---|---|
| `worker/src/routes/me.ts` | `StatsQuery` (`firstTry: '1'`, optional). `firstTries()` selects each question's first try. On `?firstTry=1`, `/stats` runs one more query (the retained history LEFT JOINed to `sessions`) and adds per section: `firstTry7d`, `firstTryCorrect7d`, `firstTry7to14d`, `firstTryCorrect7to14d`, `firstTry90d`, `firstTryCorrect90d`. Every existing field and query is untouched. |
| `worker/src/routes/me.test.ts` | New describe, 7 tests (below). |
| `app/src/lib/scoring.ts` | Optional `firstTry*` fields on `SectionStats`. New: `firstTryStats`, `honestSectionScores`, `computeHonestProjected` (+ `HonestProjection.band`), `computeHonestDelta` (+ `HonestDelta`). `computeProjectedDelta` now shares a private `pooledWeeks` with the honest delta (behavior identical; its tests pass). `scoreBand` shares `flooredPq` (same arithmetic). `formatDeltaSv` shares `roundTenth`. |
| `app/src/lib/scoring.test.ts` | 15 new tests. |
| `app/src/api/hooks/useStats.ts` | Sends `?firstTry=1`; docs. |
| `app/src/routes/index.tsx` | Home's `projected` = `computeHonestProjected`, `projectedDelta` = `computeHonestDelta`. |
| `app/src/screens/HomeMobile.tsx` | `projectedDelta` is a `HonestDelta`. A `change` prints "+0,3 sedan förra veckan" (colored by sign, as before). `stable` prints "stabil, inom felmarginalen" in `--muted`, with no figure. |
| `app/src/screens/HomeMobile.test.tsx` | The delta test is rewritten for `change`, `stable` and `null`. |
| `app/src/components/NavRail.tsx` | The Framsteg folio uses `computeHonestDelta`. Only a `change` prints a figure; a `stable` week leaves the folio empty (never "±0,0"). |
| `app/src/screens/ProgressMobile.tsx` | The hero numeral and `PrognosParagraph` read the honest projection, delta and section scores. One quiet mono line under the paragraph: "Prognosen räknar bara första försöket på varje fråga, inte repetitioner." |
| `app/src/screens/ProgressMobile.prognosis.test.tsx` | New, 6 tests. |
| `docs/worklog/hpf-bz6f.4.md` | This file. |

## Design

### 1. What a first try is (worker, `firstTries`)

The input is the user's whole retained history, oldest first (`created_at`, then `id`), each row with its session's kind via a LEFT JOIN.

- **The earliest answer** to a question is its first try. Every later answer is a retry, whatever its kind.
- **Repetera.** An `adaptive_review` answer is never a first try, because Repetera only replays questions already missed.
  - The rule is applied as "earliest overall, and not Repetera". If a Repetera answer is the earliest one held (its original was pruned), the question has **no** first try.
  - The alternative reading, "drop Repetera rows, then take the earliest", would turn the next drill answer, which is a retry, into a first try.
- **Mock.** For `kind = 'mock'` only, every later pick of the same question **in the same session** replaces the answer. So the last pick counts, once. Elsewhere a second answer in the same session (a drill's second pass) is a retry.
- **Missing session.** A session row that is gone gives `kind = null`, which counts as an ordinary answer, as before.
- **Unknown answers** count as having seen the question but are never assessed: the counting step skips `source = 'unknown'`, as every assessment number does.
- **Legacy LAS.** The LAS spelling of a LÄS qid is the same bank question (`split('-LAS-').join('-LÄS-')`; the app's `tsc` walks worker source with an older `lib`, so no `replaceAll`).
- **Windows.** A first try counts in the window of its answer's own `created_at` (for a mock, the last pick): 7d, 7–14d, 90d. These are the same boundaries as the existing fields.
- **The 90-day edge.** The history is read past the 90-day window, so a question first answered 91–120 days ago and retried inside the window is correctly **not** a first try.

### 2. The honest projection and its band (app, `computeHonestProjected`)

- `firstTryStats(st)` maps the first-try counts into the six standard window fields. Each field falls back to its every-attempt counterpart when the worker did not send it (an older worker), so nothing goes blank during a rollout.
- The score structure is the existing one: `computeProjected(honestSectionScores(bySection))`, that is section → half (mean of the scored sections) → total (mean of the halves).
- The band on the TOTAL pools scoreBand's per-section Wald variances, with the sections treated as independent samples:

  ```
  Var(sᵢ)    = 4·pᵢ(1−pᵢ)/nᵢ        sᵢ = 2·pᵢ on nᵢ first tries; pᵢ floored to [0.05, 0.95] (scoreBand)
  Var(half)  = Σ Var(sᵢ) / k²       the mean of its k scored sections
  Var(total) = (Var(verbal) + Var(quant)) / 4
  band       = 1.96 · √Var(total)
  ```

- A section with a single first try has no Wald interval of its own (`scoreBand` returns null). It pools at the worst case, p(1−p) = 1/4, so one lucky answer widens the band instead of reading as certainty.
- The band is null when there is no total.

### 3. The honest week delta (app, `computeHonestDelta`)

> **Superseded in Round 2** (below): the pooled formula here let a shift of practice between sections pass for a change. The delta now weights sections, then halves, then the total.

- It uses `computeProjectedDelta`'s like-with-like pool (sections where both weeks have ≥ 5 first tries), read through `firstTryStats`.
- The formulas:

  ```
  delta = 2·p₇ − 2·p₁₄                            pooled first-try accuracy, this week vs last
  band  = 1.96 · √(4·p₇(1−p₇)/n₇ + 4·p₁₄(1−p₁₄)/n₁₄)   (p floored as in scoreBand)
  ```

- **`change`** requires |delta| > band **and** the one-decimal figure `formatDeltaSv` prints to be > band. So no figure on screen is ever smaller than the noise. Example: 0,14 against a band of 0,123 would print "+0,1", so it is `stable`.
- **`stable`** has no `delta` field at all, so a screen cannot print one by mistake.
- **`null`** means the weeks are not comparable, and no line is shown, as before.

### 4. Display

| Surface | Before | Now |
|---|---|---|
| Home prognosis | every attempt, 90d | first tries |
| Home delta line | "+0,1 sedan förra veckan" for any non-null delta | a change beyond the noise: "+0,3 sedan förra veckan"; inside it: "stabil, inom felmarginalen" (muted, no figure); not comparable: nothing |
| Rail Framsteg folio | any delta, e.g. "+0,1" | only a change beyond the noise; otherwise empty |
| Framsteg hero numeral | every attempt | first tries |
| Framsteg paragraph | "Prognosen steg/föll ±x den här veckan" or "låg still"; halves and gap from every attempt | a change: "Prognosen steg +0,6 den här veckan"; inside the noise: "Prognosen är stabil, inom felmarginalen —"; halves and the gap-to-1,8 sentence from first-try section scores, so the paragraph agrees with itself |
| Framsteg note | — | one quiet mono line, shown only with a prognosis: "Prognosen räknar bara första försöket på varje fråga, inte repetitioner." |

## Verification

### Baseline (before any edit)

- Worker `pnpm test`: **24 files, 395 tests passed.**
- App `pnpm test`: **111 files, 3973 tests passed.**
- Golden snapshot `worker/src/routes/__snapshots__/assessmentGolden.test.ts.snap`: sha256 `2ec42900caf266511dbd3b9fd1e43ddb2856b57a54f0e794dfbc7fb17563d5c0`.

### Red first, against the unchanged implementation

- **Worker** (`pnpm --dir worker test`): `Test Files 1 failed | 23 passed (24)`, `Tests 7 failed | 395 passed (402)`.
  - All 7 are the new first-try tests, and every failure is the missing `firstTry*` fields.
  - The every-attempt assertions inside those tests already matched (for example "11 matching properties omitted"), which confirms the fixtures' arithmetic.
- **App** (`pnpm --dir app test` on the three files):
  - `scoring.test.ts`: 15 failed, all with `firstTryStats` / `computeHonestProjected` / `computeHonestDelta` "is not a function".
  - `HomeMobile.test.tsx`: 2 failed (the `change` figure and the stable wording).
  - `ProgressMobile.prognosis.test.tsx`: 4 failed at first. One change test passed by coincidence: the every-attempt delta also rounded to +0,6. Its fixture was changed so every attempt reads +0,3 and first tries +0,6. On the re-run: **5 failed, 1 passed** (the guard "no note before there is a prognosis"). The failures:
    - the hero printed `1,80`; first tries give `1,20`;
    - the paragraph printed "Verbal (1,80) och kvant (1,80)";
    - the note was missing;
    - the stable case printed **"Prognosen steg +0,6 den här veckan"**: the week's retries were right, while first tries moved +0,1 against a ≈ 0,55 band;
    - the change case printed "+0,3", the every-attempt figure; first tries rose +0,6.

### Tests added

- **Worker** (`me.test.ts`, "GET /api/me/stats?firstTry=1 — first tries only"):
  1. the default body has no first-try field, the opt-in body has all six in every section, and opt-in minus those six equals the default body;
  2. a retry is not a first try, across the 7–14d and 7d windows, and the legacy LAS spelling is the same question as its LÄS qid;
  3. a Repetera answer is never a first try, and a question first met in Repetera has none;
  4. a mock answer change counts once, as its last pick; a later drill answer to it is a retry; in a drill the first answer stands;
  5. the 90-day edge: a question first answered 95 days ago and retried 10 days ago has no first try in the window, while one first answered 89 days ago does;
  6. an attempt whose session row is gone (FKs off, LEFT JOIN) counts as an ordinary first try;
  7. an unknown answer is not assessed, and still makes the later answer a retry.
- **App** (`scoring.test.ts`):
  - `firstTryStats`: the mapping, and the older-worker fallback;
  - `computeHonestProjected`:
    - first tries rather than every attempt, section → half → total;
    - the total band against the formula;
    - the p floor;
    - the 1-answer worst case;
    - no total means no band;
    - a retries-only section drops out;
    - the older-worker fallback;
  - `computeHonestDelta`:
    - a change, and a drop;
    - stable inside the noise (no `delta` key);
    - stable when only the rounded figure is inside the noise;
    - first tries instead of retries (every attempt read +0,9);
    - the like-with-like pool and `null`.
- **App** (`HomeMobile.test.tsx`): a change prints its figure; stable prints "stabil, inom felmarginalen" and no `+`/`−`/`±` figure; `null` prints nothing.
- **App** (`ProgressMobile.prognosis.test.tsx`):
  - the hero shows first tries;
  - the paragraph's halves and gap use first-try scores;
  - the note appears exactly once;
  - there is no note without a prognosis;
  - the stable wording comes with no figure;
  - a change beyond the noise shows its first-try figure.

### Green (final runs, after formatting)

- **Worker.** `pnpm typecheck` (`tsc --noEmit`) is clean. `pnpm lint` (`biome check src`) reports "Checked 60 files … No fixes applied", clean. `pnpm test`: **24 files, 402 tests passed** (+7).
- **App.**
  - `pnpm typecheck` (`tsc -b --noEmit`) is clean.
  - `pnpm lint` (`biome check src`) shows only the 4 pre-existing devbake infos and exits 0. `biome format --write` was run on `scoring.test.ts` and `HomeMobile.tsx` first; it changed formatting only, and every final test run came after it.
  - `pnpm test`: **112 files, 3996 tests passed** (+1 file, +23 tests).
- **Golden.** `assessmentGolden.test.ts` passes unchanged. The snapshot sha256 after the work is `2ec42900caf266511dbd3b9fd1e43ddb2856b57a54f0e794dfbc7fb17563d5c0`, identical; nothing was written or updated.
- **Not run.**
  - **Visual check.** Work was offline and the signed-in app needs Clerk over the network; the brief rules out ad-hoc harnesses. The UI change is copy inside existing classes: Home reuses `hpc-m3-stat-d` with `--muted`, and Framsteg adds one `mono11` line. It still deserves a look on `/` and `/progress` before merge.
  - Playwright e2e, which needs Clerk secrets and network.

## Follow-ups and open edges (for the coordinator)

1. **Still on every attempt, by the brief:** the scheduler (`prescribeMock`, `rankWeakness`), the daily plan, and Framsteg's Fokus list (which uses `rankWeakness`, so it stays consistent with the plan).
2. **Still on every attempt, outside this slice's display list.** These now differ from the honest hero on the same page:
   - the Sektioner ledger (scores, ±band, trend arrows);
   - the "Prognos över tid" sparkline (`weekly` buckets have no first-try counterpart yet);
   - `DrillResult`'s per-section "X-prognos" stat (`DrillResult.tsx:170–186`, outside the write set).

   Suggested next step: a first-try weekly series on `?firstTry=1`, then switch the ledger, the sparkline and DrillResult together.
3. **Retention.** "First" means first within the retained 120 days (`lib/retention.ts`). A question first answered more than 120 days ago and retried inside the 90-day window still reads as a first try. Closing that needs a stored first-seen record, which is a D1 migration and out of scope.
4. **The band on the total** is computed and tested but not shown. The error-budget PR ("för 2,0: högst N fel per halva") is the natural place to show it.
5. **A user whose recent work in one half is only retries** now gets no total (the honest result) and Framsteg's existing "Ingen prognos än …" copy. That copy was written for a cold start; a retry-specific line may be wanted.
6. **The rail on a stable week** shows no Framsteg folio: no change means no numeral, following "signals are real data or nothing".

## Round 2 — the week delta weights sections and halves (Codex review hpf-is2d)

### Snapshot

- **Claim.** `gc hook --claim --json` returned `hpf-bz6f.4`, assignee `ci-wisp-ef7657a`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-bz6f.4 --json` matched the id, the status (`in_progress`), the assignee and `gc.routed_to`. The design text was the "LATEST INSTRUCTION (round 2, fix round)" brief.
- **Checkout.** `HEAD` = `e5dd5b1cea9bc2ffa87c59b999179844c526f4be` (round 1, committed by the coordinator), clean tracked tree.
- **Constraints kept.** No commit, no dependency change, no network, no migration, no snapshot written. Only 3 write-set paths changed: `app/src/lib/scoring.ts`, `app/src/lib/scoring.test.ts` and this file.

### The finding (P2, `scoring.ts:431-437` at e5dd5b1)

`computeHonestDelta` pooled the questions of every eligible section into a single accuracy per week. A section's weight was therefore its share of that week's volume, so moving practice from one section to another moved the estimate. The review's example (first-try correct/attempts):

| Section | This week | Last week |
|---|---|---|
| ORD | 90/100 | 9/10 |
| KVA | 1/10 | 10/100 |

Both sections read the same in both weeks, yet the pooled delta was 91/110 − 19/110 → **+1,309** against a band of 0,1998, so the page said "+1,3". Section → half → total reads 1,0 in both weeks.

### The fix (`computeHonestDelta`)

- **Eligibility.** E is the set of sections whose first tries clear `minAttempts` (5) in **both** weeks. A section eligible in only one week takes part in neither week's estimate.
- **Weights.** Each week is estimated as the projection is: the mean of the sections within each half, then the mean of the halves. The weights depend on E alone, so both weeks and both variances use the same ones.
- **Significance.** A `change` must clear the combined band of the two weighted estimates. The round 1 rule still holds: both |delta| and its printed one-decimal figure must exceed the band. Documented in the function's doc comment:

  ```
  For each week (7d, then 7–14d):
    sᵢ     = 2·cᵢ/nᵢ                section i's first-try score that week
    wᵢ     = 1/(m·kₕ)               kₕ = sections of E in i's half, m = halves with a section in E
    T      = Σ wᵢ·sᵢ                 the mean of the half means
    Var(T) = Σ wᵢ²·4·pᵢ(1−pᵢ)/nᵢ     pᵢ floored as in scoreBand
  delta = T₇ − T₁₄
  band  = 1.96 · √(Var(T₇) + Var(T₁₄))
  ```

- **One half only.** A half with no section in E drops out (m = 1), so weeks compared on one half give that half's change. For a single-section E this is exactly round 1's formula: every round 1 test and both `ProgressMobile.prognosis` delta fixtures (ORD only) are unchanged and still pass.
- **`pooledWeeks` removed.** Round 1 had factored it out of `computeProjectedDelta` so the two deltas could share it; the honest delta no longer pools. `computeProjectedDelta` (read by the bake-offs only) is back to its exact body on `main`. Its doc now says it pools questions, and why the honest delta does not.
- **Guard.** The floor is at least 1 first try a week (`Math.max(1, minAttempts)`), so no section score divides by zero. This replaces the old `a7 === 0` guard.
- **Test rename.** The round 1 test "pools only sections where both weeks clear the floor" is now "takes only sections where both weeks clear the floor"; its assertions are unchanged.

### Red first, against e5dd5b1's implementation

Four new tests in `scoring.test.ts` were added before the fix. `pnpm --dir app test src/lib/scoring.test.ts` gave `Tests 4 failed | 56 passed (60)`:

1. **Swapped-volume regression** (the review's example, expects `stable`). Received `{ kind: 'change', delta: 1.309090909090909, band: 0.19980646383496434 }`, the review's numbers. Expected `stable` with band 0,27580.
2. **A true change at equal weights clears the band** (100 first tries per section and week; ORD 0,50 → 0,80, KVA steady at 0,30; expects +0,3). The delta matched (equal volumes make pooling agree on it), but the band was the pooled 0,19353 instead of the weighted 0,17856.
3. **A section eligible in only one week is excluded from both** (ORD and KVA in both weeks; LÄS this week only, NOG last week only). The assertion that LÄS and NOG change nothing already held. The value did not: pooled +0,400 against 0,21338 where the weighted estimate is +0,300 against 0,22941. If LÄS or NOG counted in its half for its one week, the delta would read +0,4 or +0,6.
4. **Sections are weighted within their half, then the halves** (ORD and LÄS steady at 0,75; KVA alone in quant, 0,40 → 0,80; 20 first tries each; expects +0,4). Received `stable` against the pooled band 0,32448. A flat mean over three sections, or pooling, reads +0,27, inside the noise; KVA is the whole quant half, so the total rises (1,6 − 0,8)/2 = +0,4 against 0,33593.

### Green (final runs, after formatting)

- **App.**
  - `pnpm typecheck` (`tsc -b --noEmit`) is clean.
  - `pnpm lint` (`biome check src`): only the 4 pre-existing devbake infos, exit 0. One format fix in the new test (two long `stats({…})` lines wrapped) came before every final run.
  - `pnpm test`: **112 files, 4000 tests passed** (+4 over round 1).
  - The three files that read the delta (`scoring.test.ts`, `ProgressMobile.prognosis.test.tsx`, `HomeMobile.test.tsx`): 101/101.
- **Worker.** `pnpm test`: **24 files, 402 tests passed**. The worker is unchanged in round 2.
- **Golden.** The snapshot sha256 is still `2ec42900caf266511dbd3b9fd1e43ddb2856b57a54f0e794dfbc7fb17563d5c0`.
- **Not run.** The visual check and Playwright, for the same reasons as round 1. Round 2 changes no markup or copy.

### Open edges added in round 2

7. **Weeks compared on one half** report that half's change (m = 1), as every single-section pool did in round 1. The stricter reading is "no total without both halves", which would return `null` here. That would hide the line, and the "stabil" wording, for a student who practiced only one half in both weeks. Left as is to keep round 1's behavior; it is a one-line change if the coordinator prefers the strict reading.
8. **`computeProjectedDelta`** (bake-offs only) still pools questions and keeps the same volume-mix sensitivity. It is documented, not fixed: no product surface reads it.
