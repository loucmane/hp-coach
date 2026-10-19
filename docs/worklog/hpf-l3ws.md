---
bead: "hpf-l3ws"
project: "hpfetcher"
session: "ci-wisp-ot9d7h9"
status: "implementation_complete"
---

# Worklog — hpf-l3ws

## Findings

- 2026-10-19: branch
  `codex/hpf-l3ws-flaky-mobile-e2e-home-spec-bottom-tab-routing-and-palette-te`
  at base `7675036459e34cbcbafffca4b6050af1e6266ae1` (origin/main). The tree
  was clean apart from pre-existing untracked runtime dotfiles, which are left
  untouched.
- Red evidence (coordinator, local run of `7675036`, mobile project,
  `--retries=0 --repeat-each=15`): the palette test failed **15/15** and the
  bottom-tabs test failed **1/15**. In CI (PR 391, run 39118509142) both failed
  on the first attempt and passed on retry #1. A scratch timing experiment had
  Ctrl+K right after `goto` fail 3/4. It passed 4/4 after the "Dagens plan"
  heading was visible, and 4/4 after `networkidle`.
- Shared root: `page.goto` resolves on `load`, and both tests act right after
  it, before the app is usable. The two tests trip over two different things.

### Palette test (`dev affordances live in the palette`, was :138, now :148)

- ⌘K is a `window` keydown listener registered in a `useEffect` in
  `CommandPalette` (`app/src/components/CommandPalette.tsx:182-195`). The
  palette mounts in `RootShell` (`app/src/routes/__root.tsx:68`), which only
  renders after the bundle runs and the router has resolved its first
  matches. That async work is not tied to `load`.
- The two checks before the key press are `toHaveCount(0)`, which pass at
  once, even on an empty page. So `Control+K` went out right after `load`.
  If the listener was not registered yet, the key was dropped, and `cmdk`
  never appeared within 3 s. The failure snapshot shows a fully rendered
  Home: the app came up just after the key press.
- Supporting evidence: `responsive.spec.ts:97-104` and `drill.spec.ts:104-114`
  press Control+K only after `home-greeting` is visible, and they are not
  flaky.

### Bottom-tabs test (`Bottom tabs route between sections`, was :90, now :96)

- `index.html` puts `#boot-veil` (fixed, `inset: 0`, `z-index: 2147483647`)
  over the page. It is removed at the earliest of three moments:
  - two rAFs after `hpc:first-content` (first real content commits);
  - 1.2 s after Clerk resolves (`FIRST_CONTENT_GRACE_MS`,
    `__root.tsx:95,139-145`);
  - the inline 1.5 s failsafe (`index.html:105`).
- The tabs exist only once Home renders, which happens after Clerk resolves.
  If Clerk resolves inside the 1.5 s failsafe and Home's first content has
  not landed yet, the tabs are on screen but under the veil.
- `click({ force: true })` skips Playwright's actionability checks. That
  includes the hit-target check, which would otherwise have waited for the
  veil to go. The click is sent to the tab's coordinates, the topmost element
  there is the veil, and the button never receives it. The URL stays `/` and
  `toHaveURL(/\/progress$/)` fails after 5 s.
- This matches the reported failure: a click that "succeeded" on the
  Playwright side but never reached the button. A missing button would have
  failed as a click timeout instead.
- The low rate (1/15) fits too: the gap only opens when Clerk loads faster
  than the failsafe, and it closes as soon as first content lands.
- This mechanism comes from reading the code. The coordinator's repeat-each
  run is the proof.

## Decisions

- **One shared helper, `waitForHomeReady(page)`** in
  `app/tests-e2e/fixtures.ts` (the brief's `waitForAppReady` example). It is
  named after the signal it waits on, so nobody calls it after navigating to
  another route, where it would time out. It waits for two things:
  1. `getByTestId('home-greeting')` is visible.
     - `HomeMobile.tsx:268-271` renders it unconditionally at every viewport
       (phone/reader/studio) and in every scheduler state: loading, card,
       complete, mock-only Kallelse day, or plan error.
     - It renders inside the signed-in shell, after Clerk resolves. Once it
       is visible, the root shell (with the palette) has committed and its
       effects have run, so the keydown listener exists.
     - It is the same load indicator `home.spec.ts:66`,
       `responsive.spec.ts:61`, `account.spec.ts:14` and `drill.spec.ts:109`
       already wait on.
  2. `#boot-veil` has count 0.
     - The veil is the same element on both projects, and the failsafe
       bounds this wait to 1.5 s from page start, so it cannot hang.
     - It is the moment the user can actually see and touch the app.
- **Why not the "Dagens plan" heading:** it is not unconditional.
  - On a mock-only day, `DailyPlanCard` returns null (`DailyPlanCard.tsx:138`;
    `HomeMobile.test.tsx:106` "hides 'Dagens plan' entirely on a mock-only
    day").
  - Neither target test seeds scheduler state.
  - The coordinator's 4/4 with the heading is consistent with the greeting:
    the skeleton renders the heading in the same first Home commit.
- **Why not the four plan testids** (`card | skeleton | complete | kallelse`):
  - They describe plan data, not shell readiness.
  - The union misses `daily-plan-error` (`DailyPlanCard.tsx:212`).
  - It would tie two chrome tests to worker data.
- **No sleeps, no retries, no timeout bumps, no `networkidle`.** The
  greeting's 10 s budget is the one the specs already give this indicator.
  The veil check uses the default expect timeout. Every existing assertion
  and locator is unchanged.
- **`force: true` kept.**
  - `force: true` is part of the race: it skips the hit-target check that
    would have waited out the veil.
  - The smaller fix is to make the veil gone before the first tap.
  - Removing `force` could bring back the route-transition overlap described
    in the test's own comment, for the second tap on `/progress`.
  - The veil exists only in the initial HTML and never comes back on SPA
    navigation, so the second forced tap is not exposed to it.
- **Opt-in, not in the fixture.**
  - The palette test does its own `goto('/?dev=1')`, so a wait inside the
    fixture would not cover it.
  - A Home-specific wait in the shared fixture would make every authed test
    depend on `/` rendering the greeting.
  - No other spec was touched.
- **Call sites.**
  - Bottom tabs: the wait comes right after `test.skip`, before the first tap
    (`home.spec.ts:104`).
  - Palette: the wait comes right after `goto('/?dev=1')`, before the two
    `toHaveCount(0)` checks and Control+K (`home.spec.ts:153`). Those
    "no pills" checks now run against a rendered Home instead of passing
    vacuously on an empty page.

## Changes

- `app/tests-e2e/fixtures.ts`: new exported `waitForHomeReady(page)`, with a
  doc comment covering both mechanisms.
- `app/tests-e2e/home.spec.ts`: imports the helper and calls it once in each
  of the two tests. The `./fixtures` import line is wrapped, because it now
  exceeds the 100-column format width.
- `docs/worklog/hpf-l3ws.md`: this file.

## Verification — 2026-10-19 (offline; no Playwright run possible here)

- **Strict ad-hoc typecheck of both edited e2e files: PASS, exit 0.** It also
  passed on pristine HEAD before the edit. Command:
  `app/node_modules/.bin/tsc --noEmit --strict --target es2022 --module esnext --moduleResolution bundler --skipLibCheck --types node --typeRoots app/node_modules/@types app/tests-e2e/home.spec.ts app/tests-e2e/fixtures.ts`.
- **`pnpm lint` from `app/` (`biome check src`): PASS, exit 0.** It reports
  4 infos, all pre-existing, in `src/components/devbake/*`.
  - Note: `pnpm lint` does not cover `tests-e2e`. `biome.json`
    `files.includes` is `src/**` only, and
    `biome check tests-e2e/home.spec.ts tests-e2e/fixtures.ts` answers
    "No files were processed … ignored".
  - To still lint the edits, I ran a scratch config with the repo's exact
    formatter and linter settings, on HEAD copies and on the edited files:
    - HEAD: 3 findings — `organizeImports` in both files, plus a format
      finding for the over-long `./fixtures` import and the untouched
      `mast "mer"` test signature.
    - After: the same two `organizeImports` findings (the specifier order
      pre-dates this change). The format finding now covers only the
      untouched `mast "mer"` test.
    - No new findings.
- **`pnpm typecheck` from `app/` (`tsc -b --noEmit`): FAIL, exit 2, from the
  environment, not this diff.**
  - All 179 errors are in `../worker/src/**`. 67 are TS2307 "Cannot find
    module" for `hono`, `drizzle-orm`, `zod`, `@hono/zod-validator`,
    `@clerk/backend` and `@sentry/cloudflare`; the rest are implicit-`any`
    knock-on errors.
  - Cause: this lane worktree has `app/node_modules` but no
    `worker/node_modules`.
  - There are 0 errors in `app/src` or `vite.config.ts`. `tests-e2e` is in
    neither tsconfig's `include` (`tsconfig.app.json`: `src`;
    `tsconfig.node.json`: `vite.config.ts`), so this diff cannot change the
    result.
  - I did not install worker dependencies: that would write outside the
    write set.
- **`playwright test --list tests-e2e/home.spec.ts`:** the spec loads with the
  new import, and 8 tests are collected per project (17 with setup). With the
  coordinator's grep and `--repeat-each=15` on mobile, the selection is
  exactly the two target tests × 15, plus setup (31).
- **`git diff --check`:** clean. 2 files changed (+33/−1), plus this new
  worklog. Nothing is staged or committed, and HEAD is still `7675036`.

[S:ci-wisp-ot9d7h9|W:hpf-l3ws|H:implementation-verification|E:7675036 + uncommitted lane diff; e2e tsc strict PASS; pnpm lint PASS; pnpm typecheck env-blocked (worker deps absent); playwright --list OK]

## Coordinator e2e commands (from `app/`)

```sh
# Target: the two tests, mobile, no retries. Expect 30/30 passed (before: palette 15/15 failed, tabs 1/15).
pnpm exec playwright test tests-e2e/home.spec.ts --project=mobile --grep "Bottom tabs route|dev affordances live" --repeat-each=15 --retries=0

# Whole spec on both projects.
pnpm exec playwright test tests-e2e/home.spec.ts --project=chromium --project=mobile --retries=0

# Typecheck in an environment with worker deps installed (CI installs both).
pnpm typecheck
```

| Run | Before (7675036) | After (this diff) |
| --- | --- | --- |
| mobile, repeat-each=15, palette | 15/15 failed | _coordinator to paste_ |
| mobile, repeat-each=15, bottom tabs | 1/15 failed | _coordinator to paste_ |
| home.spec.ts, chromium + mobile | — | _coordinator to paste_ |

## Other candidates (not edited)

- **Key presses right after a `goto`:** no others.
  - `responsive.spec.ts:102` and `drill.spec.ts:112` wait for `home-greeting`
    first.
  - `account.spec.ts:40` presses Escape after the menu is visible.
- **Forced taps after a fresh document, guarded only by `toBeVisible`:** the
  veil can still be up, and `force` skips the hit-target check.
  - `soak-drill.spec.ts:53-56`: `drill-start` is tapped with force right
    after `page.reload()` and `drill-idle`. It already wraps the tap in a
    4-attempt retry loop for a "brief no-op", which could be this same race.
  - `motion-winners.spec.ts:69`: the first forced option tap after
    `goto('/drill?section=ORD&start=true')` and `option-A` visible.
  - `motion-settle.spec.ts:161`: a forced option tap after `goto`,
    `option-A`, and `waitSettled`. Lowest risk, since the settle wait likely
    outlasts the veil.
- **Not candidates:** `drill.spec.ts:90`, `mistakes.spec.ts:190` and
  `sf1-loop.spec.ts:142,363`. Each follows an unforced click in the same
  document, and unforced clicks wait out the veil.
- **Side observation, not changed:** in the bottom-tabs test,
  `.filter({ hasNot: page.locator('[aria-current="page"]') })` only matches
  descendants, but `aria-current` sits on the button itself
  (`MobileFrame.tsx:79`), so the filter never excludes anything. This is
  harmless today: RouteScene's exit clone is `aria-hidden` and `inert`
  (`RouteScene.tsx:100-102`), so `getByRole` only sees the live bar.

## Handoff

The change is complete in the lane and left uncommitted and unstaged:
`app/tests-e2e/fixtures.ts`, `app/tests-e2e/home.spec.ts`, and this
worklog. No dependencies, servers, network, or git writes were used, and the
Bead is not closed. The coordinator owns the Playwright repeat-each and
full-spec runs, `pnpm typecheck` in a worktree with worker deps, and the
review of the eventual commit.

## Bead note

Fixed both flaky mobile home.spec tests with a shared `waitForHomeReady` that
waits for `home-greeting` and for `#boot-veil` to be gone. Before the fix, ⌘K
was pressed before its window listener mounted, and the forced tab tap landed
on the boot veil. Assertions, `force: true` and timeouts are unchanged; no
sleeps or retries. The e2e files pass a strict tsc and add no Biome findings,
and `pnpm lint` passes. `pnpm typecheck` is env-blocked: 179 errors, all in
`../worker`, because worker deps are not installed. Changes are uncommitted.
The repeat-each=15 run is pending the coordinator.

FLAKE1 DONE: hpf-l3ws
