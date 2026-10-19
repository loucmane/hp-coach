# hpf-qr0p.2 — redesign round 1b enabler: per-folder direction registry, eight directions (E–H stubs)

Epic hpf-qr0p (whole-app redesign bake-off). Owner decision 2026-10-19: keep A Folio, B Instrument, C Spår and D Lager, and add four new directions on the same screens, built in parallel by four workers that must not touch a shared file. This bead makes the bake-off registry per-folder, extends it to eight keys and adds E–H as placeholder stubs.

- Worktree: `/home/loucmane/dev/hpfetcher-worktrees/hpf-qr0p.2`, branch `codex/hpf-qr0p.2-redesign-round-1b-enabler-per-folder-direction-registry-eigh`, base `3b4ecf0` (origin/main).
- All changes are UNCOMMITTED. The bead is not closed.

## Outcome

- **Registry.** `redesign/directions.ts` imports every folder's `meta` statically and its stage lazily, in key order a–h. It exports `DIRECTIONS` and `STAGES`, and the page reads both from there only.
- **Per-folder metadata.** Each direction's `DirectionMeta` lives in its own `meta.ts`. A–D moved verbatim from `r1Kit.ts`. `r1Kit.ts` keeps the `DirectionMeta`, `DirectionKey` and `DirectionProps` types and re-exports `DIRECTIONS` from the registry, so the existing `import { DIRECTIONS } from …/r1Kit` (the route's pin test) still works. A test checks that it is the same array.
- **Eight keys everywhere:**
  - the route's `DIRECTION_KEYS` and `validateSearch` (`?d=a…h`);
  - `DirectionKey`;
  - keyboard 1–8 (the digit of the direction's position, `9` does nothing);
  - the switcher;
  - side by side;
  - the info panel, whose key hint reads "1–8".
- **E–H stubs.** `e-svep/`, `f-samtal/`, `g-raster/` and `h-ljuskagla/` each hold:
  - `meta.ts`: name and tagline as specified, one placeholder line each for traits, risk and references, and `stub: true`;
  - a stage (`Svep`, `Samtal`, `Raster`, `Ljuskagla`) that renders the shared `DirectionStub`, a calm "Under arbete" card.
  The card takes the same `DirectionProps` and names the screen, width and theme the switcher picked, for example "Skärm 2 · Läsfråga · Telefon · Mörkt", so every key works on every screen, width and theme.
- **A–D unchanged.** Nothing inside `a-folio/`, `b-instrument/`, `c-spar/` or `d-lager/` changed apart from the new `meta.ts`. The 56 A–D contract tests pass untouched. No route or component was deleted.

## Files

| File | Change |
|---|---|
| `app/src/components/devbake/redesign/directions.ts` | new: the registry (`DIRECTIONS`, `STAGES`) |
| `app/src/components/devbake/redesign/{a-folio,b-instrument,c-spar,d-lager}/meta.ts` | new: A–D metadata, moved verbatim |
| `app/src/components/devbake/redesign/{e-svep,f-samtal,g-raster,h-ljuskagla}/meta.ts` | new: E–H placeholder metadata (`stub: true`) |
| `app/src/components/devbake/redesign/{e-svep/Svep,f-samtal/Samtal,g-raster/Raster,h-ljuskagla/Ljuskagla}.tsx` | new: E–H placeholder stages |
| `app/src/components/devbake/redesign/DirectionStub.tsx`, `directionStub.css` | new: the shared "Under arbete" stage, scoped under `[data-rd='stub']` |
| `app/src/components/devbake/redesign/r1Kit.ts` | `DirectionKey` a–h, slug union of the 8 folders, optional `stub`, `DIRECTIONS` re-exported; header comment |
| `app/src/components/devbake/redesign/Redesign2026Bakeoff.tsx` | reads the registry; keys 1–8; two-row bar; side by side 4 × 2; `Seg` takes an optional `className` |
| `app/src/components/devbake/redesign/redesign2026.css` | two-row bar, narrow 4 × 2 direction grid, info-panel height and narrow placement, thumbnail caption clamp |
| `app/src/components/devbake/redesign/Redesign2026Bakeoff.test.tsx` | 16 new tests (below); the existing tests unchanged |
| `app/src/routes/dev_.redesign-2026-bakeoff.tsx` | `DIRECTION_KEYS` a–h; header comment (eight directions, keys 1–8) |

`routeTree.gen.ts` is untouched (the route file was not renamed).

## Decisions

- **The stub marker is data, not a test list.** The new test "a stub shows Under arbete…" iterates `DIRECTIONS.filter((d) => d.stub)`, which is E–H today.
  - When a builder rewrites their `meta.ts` without `stub: true`, the shared test stops expecting the placeholder for that key, and no builder has to edit a shared file.
  - A second test keeps A–D from ever being marked as stubs.
  - The "every key mounts its stage" test finds each root by the existing `rd-<name>` convention (`rd-folio` … `rd-svep`, `rd-ljuskagla`), which the stub root also carries.
- **One shared stub component.** The four stages are three-line wrappers around `DirectionStub`, not four copies. A builder replaces their wrapper. `DirectionStub` stays as the placeholder for any later empty slot.
- **Side by side: two rows of four** at both widths, as long as the window is ≥ 720 px; a narrower window still scrolls one column.
  - At 1440 × 900, desktop tiles are 330 × 206 and phone tiles 149 × 322, with no scroll.
  - The top row is round 1 and the bottom row round 1b.
- **The bar needed a second row.** Eight direction buttons need about 705 px. The probe found that at 1440 the single-row bar gave them 341 px, so E–H were drawn under the screen switcher.
  - The old four-direction bar was already about 10 px over at exactly 1440.
  - Every desktop width from 961 to 1920 px now has two rows:
    1. the brand and the eight directions, with their 1–8 key chips;
    2. the screen switcher, width, theme, side by side, "Om" and hide.
  - The bar is 97 px tall instead of 53. The ⌃ button and `&bare=1` still hide it.
  - The narrow breakpoint moved from 860 to 960 px, because brand plus directions need about 940 px.
  - Below 960 px the directions are a 4 × 2 grid (round 1 above, round 1b below), so all eight stay visible on a phone. Before, the narrow strip hid G and H behind a horizontal scroll.
- **Three fixes the new layout made necessary:**
  - The "Om" panel's max-height is now `100dvh − 134px`, because it opens under the second row; it would otherwise run 7 px past the bottom at 900 px.
  - Below 960 px the panel hangs from the whole bar. It was already off-screen on a phone (x = −82 at 390 px) and would otherwise run 22 px past the bottom at 861 × 800.
  - A side-by-side caption is clamped to its cell (the tagline ellipsizes). A long caption in a quarter-width cell otherwise pushed tile A to x = −47 at 861 px.

## For the four direction builders (E–H)

- Your folder is your write set: rewrite `meta.ts` (drop `stub: true`) and replace your stage file.
  - Keep the file name and the export (`e-svep/Svep.tsx` → `Svep`, `f-samtal/Samtal.tsx` → `Samtal`, `g-raster/Raster.tsx` → `Raster`, `h-ljuskagla/Ljuskagla.tsx` → `Ljuskagla`). The registry imports exactly those.
  - Add any other files you need inside the folder.
- Give your root `data-testid="rd-<name>"` (`rd-svep`, `rd-samtal`, `rd-raster`, `rd-ljuskagla`) and the rd-* ids of the shared contract, as A–D do.
- Read only: `r1Kit.ts` (the headless kit), `directions.ts`, `DirectionStub.tsx` and the page.

## Verification

From `app/`:

**`pnpm typecheck`:** pass, no output.
```
> app@0.0.0 typecheck /home/loucmane/dev/hpfetcher-worktrees/hpf-qr0p.2/app
> tsc -b --noEmit
```

**`pnpm lint`:** pass, exit 0. The 4 infos are pre-existing, in files this bead does not touch: `LandingBakeoffR3.tsx`, `LandingBakeoffR4A.tsx`, `LandingBakeoffR4C.tsx` and `l12/M3.tsx`.
```
Checked 433 files in 150ms. No fixes applied.
Found 4 infos.
```

**`pnpm test`:** 1077 passed, 1 failed. The failure is outside this bead's write set; see the next section.
```
 ❯ src/routes/-redesign-2026-bakeoff.test.ts (3 tests | 1 failed) 14ms
     × reads the selection from the URL and drops anything else 8ms
 FAIL  … > reads the selection from the URL and drops anything else
AssertionError: expected { d: 'e' } to deeply equal {}
 ❯ src/routes/-redesign-2026-bakeoff.test.ts:53:83
 Test Files  1 failed | 90 passed (91)
      Tests  1 failed | 1077 passed (1078)
```

The 16 new tests in `Redesign2026Bakeoff.test.tsx` all pass:

- **The bar.** It offers the eight directions in order with key chips 1–8; keys 1–8 select a–h; a click on H selects h; `9` does nothing.
- **The side-by-side "Om" panel.** It lists eight directions and the key hint "1–8".
- **The registry.**
  - Keys are a–h in order, with the eight expected slugs.
  - Keys, slugs and names are unique; every direction has a tagline and traits.
  - `STAGES` has exactly these keys.
  - `r1Kit`'s `DIRECTIONS` is the registry's array.
  - A–D are never stubs.
- **The stage (8 tests).** `?d=a…h` each mounts the folder's stage, found by its `rd-<name>` root.
- **The stubs (2 tests, desktop and phone).** For every stub direction, the card shows "Under arbete", the name and the tagline. On every screen 1–4 in both themes, it also shows the matching "Skärm n · label · width · theme" line and the root's `data-theme`.
- **Side by side (2 tests, desktop and phone).**
  - `--rb26-cols` is 4.
  - Eight thumbnails appear in order a–h, each mounting its stage.
  - "Öppna Ljuskägla i full storlek" selects h.

## Coordinator action: one stale assertion outside the write set

`app/src/routes/-redesign-2026-bakeoff.test.ts:53` uses `d: 'e'` as its example of a junk direction. Since `?d=e` is now valid (scope item 3), the assertion fails. The file is not in this bead's admitted write set, so I left it alone. The fix:

```diff
--- a/app/src/routes/-redesign-2026-bakeoff.test.ts
+++ b/app/src/routes/-redesign-2026-bakeoff.test.ts
@@ -1,5 +1,5 @@
 // /dev/redesign-2026-bakeoff — the bundle boundary. The route module is in
 // the entry bundle (routeTree.gen imports it eagerly; autoCodeSplitting
-// splits off `component` only), so it reaches the page, the four directions,
+// splits off `component` only), so it reaches the page, the eight directions,
 // their fixtures and fonts through import() alone. Three guards:
 //   1. KEYS — validateSearch's inline keys match the page's metadata, the
@@ -50,7 +50,8 @@ describe('/dev/redesign-2026-bakeoff route', () => {
       sbs: true,
       bare: true,
     })
-    expect(validateSearch({ d: 'e', s: '5', w: 'tablet', t: 'sepia', sbs: '0' })).toEqual({})
+    expect(validateSearch({ d: 'h', s: 1 })).toEqual({ d: 'h', s: 1 })
+    expect(validateSearch({ d: 'i', s: '5', w: 'tablet', t: 'sepia', sbs: '0' })).toEqual({})
   })
```

The file's other two guards pass unchanged:
- KEYS: `DIRECTION_KEYS` equals the registry's keys through the `r1Kit` re-export.
- SOURCE: the route still has no static import from `components/devbake`.

## Screenshots

The real route needs a Clerk session the sandbox cannot reach. The page is router-free, so a scratchpad harness mounts it with the route's selection from the query string:
- a Vite config with the app's `@` alias;
- Vite started inside the same process as Playwright, because each sandboxed command has its own network namespace;
- the installed Playwright Chromium.

The fonts are fallbacks: Google Fonts is blocked by the sandbox proxy, as in hpf-qr0p.1.

- **Final set:** `/tmp/claude-1000/-home-loucmane-dev-hpfetcher-worktrees-hpf-qr0p-2/e0ad22e3-c3b2-43be-9c86-448be92f53ae/scratchpad/harness/shots/final/`, 23 PNGs plus `report.json`. This is a session scratchpad, so expect it to be cleaned up.
  - `a-desktop-light` (`?d=a`), `e-desktop-light` (`?d=e`), `sbs-desktop-light` (`?sbs=1`): the three views the bead asked for.
  - `e-desktop-dark-s2`, `g-desktop-light-s4`, `f-phone-light-s3`, `h-phone-dark-s4`: stubs on other screens, widths and themes.
  - `sbs-desktop-dark-s2`, `sbs-phone-light`, `sbs-phone-dark-s3`: side by side.
  - `info-sbs`, `info-e`, `info-390`, `info-861`: the "Om" panel.
  - `narrow-390-e`, `narrow-390-sbs`: a 390 px window.
  - `bar-{1920,1280,1180,1024,961,861,860}`: the bar at each width.
  - `keys`: the keyboard probe.
- **Probe results on the final code:**
  - The bar never overflows; the direction segment's scroll width equals its client width at every width from 390 to 1920.
  - Keys 5→e, 6→f, 7→g, 8→h and 1→a select those directions; 9 leaves a selected.
  - Side by side at 1440 has no scroll: desktop tiles 330 × 206, phone tiles 149 × 322, all aligned.
  - The "Om" panel is fully on screen at 1440, 861 and 390.
  - There are no page or console errors.
- **Before the bar fix**, the run in `shots/v1/` showed E–H drawn under the screen switcher at 1440. The first two-row run, `shots/v2/`, still had the panel and caption overflows that the last three fixes address.

## Notes

- **Sandbox artifacts.** `git status` inside this sandbox lists `.bash_profile`, `.bashrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`, `.vscode`, `.zprofile` and `.zshrc` at the worktree root as untracked. They are character devices 1,3 (`/dev/null`) dated 10:53, before this session began: the sandbox's bind-mount guards, not part of this change. They were left alone.
- **Owner-facing chrome.**
  - The pill still reads "omgång 1". Renaming it to "omgång 1b" is the coordinator's call.
  - In side by side the last caption ("Ljuskägla — Mörkt läge, ljus på stycket du läser") ellipsizes at 1440 with the sandbox's wide fallback face. With the system UI font it should fit.

RB1B0 DONE: hpf-qr0p.2
