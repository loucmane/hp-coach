# Worklog — hpf-qr0p.51.5 (LJ-03: Ljusbord capture harness)

## Findings

- 2026-11-03: claimed on base `718b4da23004d7baff0e664b29fededf5fe90a8f` (origin/main), branch
  `codex/hpf-qr0p.51.5-ljusbord-lj-03-capture-harness-4-modes-palettes-overflow-and`. The
  worktree was clean, and app dependencies were installed.
- Read rebuild-map §0 (all five palettes stay), §1.8 (dark and "Som systemet"), the §4 LJ-03
  entry and the visual-gate convention. Read `r6/A/_src/capture.mjs` too, which is how the
  approved shots were taken: 1440×900 and 390×844, DSF 1, `reducedMotion: 'reduce'`,
  `colorScheme`, the viewport grown to the document height, JPEG q72. Also read its
  `overflow.mjs`.
- `m3-fidelity-capture.mjs` uses a saved `tests-e2e/.auth/user.json`. It sets the server mode
  with the /dev Tema buttons, which writes the account's prefs. The dev-login recipe is
  `app/src/routes/dev-login.tsx`: POST `/api/dev/login`, Clerk ticket, `setActive`, then
  `navigate('/')`. It shows `Fel: …` on failure.
- On main today, `[data-folio]` takes `data-theme` and `data-palette` from the persisted
  `hpc-ui` store (`mode`, `palette`). `useHydratePrefs` re-applies `GET /api/me/prefs`
  (`{ prefs: { palette, mode } }`) on every load. So `colorScheme` alone cannot switch the
  current app: the follow-system path (LJ-02 `useFolioRootAttrs`) is not merged yet.
- Gates:
  - welcome: `isWelcomed()` is true when `hpc-welcomed` is `'1'` or any `hpc-ui` exists;
  - Folio: `useUiStore((s) => s.folioPreview)`, persisted under `hpc-ui` as zustand
    `{ state, version: 0 }`.
- Worker:
  - `DELETE /api/account` is the only handler in `worker/src/routes/account.ts`;
  - `/health` answers, so the preflight uses it;
  - the app calls the worker directly through `VITE_API_BASE_URL`, with no Vite proxy.
- The Folio shell scrolls the document (`shell.css`):
  - `.fa-main` has `overflow: visible`;
  - the phone `.fa-tabs` bar is fixed to the bottom;
  - the rail is sticky.
- `/drill?section=KVA&start=true` starts a drill straight away (`start` in `drill.tsx`), so
  that route writes a session for the dev user. The route list causes this, not the
  harness.

## Decisions

- **Sign-in.**
  - The run signs in once through `/dev-login`. It polls until the pathname leaves
    `/dev-login`, fails fast on the page's `Fel:` line, then waits for `window.Clerk.session`.
  - Its `storageState()` stays in memory, is never written to disk, and is reused by every
    mode's context.
- **Dark and light.**
  - Dark is `colorScheme: 'dark'` (the system path) and light is `'light'`.
  - Today the theme comes from `hpc-ui` and the server prefs, so the harness also seeds
    `hpc-ui.mode`. It rewrites `GET /api/me/prefs` in flight too: the mode, plus the palette
    with `--palettes`. CORS headers are kept; the length and encoding headers are dropped.
  - Nothing is PATCHed, so the account's stored prefs never change.
  - Each shot reports what rendered: `data-theme`, `data-palette`, `html.dark` and
    `prefers-color-scheme`. A mismatch is a warning; attributes are never forced.
- **Palette.**
  - It is set through the app's own store: `hpc-ui.palette` becomes `[data-folio]`
    `data-palette`.
  - The palette must be one of the 5 PaletteKeys. A test pins that list to `PALETTES` in
    `src/lib/tokens.ts`.
- **Capture settings.**
  - They match `r6/A/_src/capture.mjs`, with no mobile or touch emulation and DSF 1, so shots
    compare 1:1 with `r6/A/shots`.
  - The browser runs in sv-SE and Europe/Stockholm.
  - Service workers are blocked, so every request passes the routes.
- **Account guard.** Every context aborts `DELETE /api/account` and its subpaths. Each shot
  lists any blocked attempts.
- **Viewport.**
  - The viewport grows to the larger of the html and body `scrollHeight`, in up to 4 passes,
    waiting for images after each resize.
  - It is capped at 16,000 px, with a warning; the tallest r6/A shot is about 6,000 px.
- **Overflow.**
  - The report lists the innermost elements with `scrollWidth > innerWidth`, because a parent
    inherits a child's width. Each has a `contained` flag: a scrolling or clipping ancestor
    holds it, or it scrolls its own content.
  - At page level, `horizontalScroll` is `documentElement.scrollWidth > innerWidth`.
- **Red text.**
  - These count:
    - every rendered element with its own text;
    - `::before` and `::after` content;
    - filled text fields (their values are never recorded).
  - A colour that is not `rgb()` is normalised to sRGB on a 1×1 canvas.
  - Node then applies `isRed`: r > 150, g < 90, b < 90.
- **File names.**
  - `/` becomes `idag`, the r6/A name.
  - The query stays in the name, Swedish letters fold to ASCII, and a clash gets `-2`, `-3`.
- **Typing the test.**
  - The test imports the untyped `.mjs` with `@ts-expect-error`: `tsconfig.app` has no
    `allowJs`, and a `.d.mts` file is outside the write set.
  - A local `Helpers` type keeps the test typed.
  - `typecheck` passing proves the directive is used: an unused one would fail with TS2578.
- **Script checks.** I added three static checks on the main script, because tsc and biome
  only cover `src/`:
  - it parses;
  - it imports only names the helpers export;
  - its header documents the host prefix.

## Red first

- Before the helpers existed, `pnpm test src/test/ljusbordCapture.test.ts --maxWorkers=2`
  exited 1 with `Failed to resolve import "../../scripts/ljusbord-capture.helpers.mjs" from
  "src/test/ljusbordCapture.test.ts". Does the file exist?` (0 tests ran).
- Green once the helpers existed: 1 file, 26 tests.
- For the three script checks, I broke the script on purpose: an unknown import
  `NOT_A_HELPER` and `const SETTLE_MS = = 1200`. Two tests failed, with `Expression
  expected.` and `[ 'NOT_A_HELPER' ]`. I reverted both edits, and the file went green at
  29/29.

## Verification (final files)

- `pnpm typecheck`: passed.
- `pnpm lint`: passed (730 files). The only output is 4 infos in existing devbake files. Two
  earlier runs had failed on the new test's formatting only, which I fixed to biome's layout.
- `pnpm test src/test/ljusbordCapture.test.ts --maxWorkers=2`: 1 file, 29 tests passed.
- Full `pnpm test`, without `--maxWorkers`, default TMPDIR: **188 files, 5,348 tests passed**
  in 58.42 s. The generator checks passed in this session, with no EPERM.
- The worker is untouched, so no worker checks were needed.
- **Not run:**
  - `node --check` and `node app/scripts/ljusbord-capture.mjs --help`. This session's
    permission mode denies direct node calls. Per the bead, I made one attempt and stopped;
    the static script checks above replace it.
  - No browser: the end-to-end run needs the local stack, so it belongs to the coordinator.
    No run of the harness against a live app has happened yet.

## Handoff

- The 4 write-set files are staged and uncommitted, and `git diff --cached --check` is
  clean. They are the only intended change. The worktree root also shows untracked
  `.bashrc`, `.gitconfig`, `.idea`, `.mcp.json` and similar entries. They are not mine and
  look like sandbox mount points; leave them out of the commit.
- Coordinator next:
  1. Smoke check:
     `env -u WAYLAND_DISPLAY -u DISPLAY LIBGL_ALWAYS_SOFTWARE=1 GALLIUM_DRIVER=llvmpipe MESA_LOADER_DRIVER_OVERRIDE=llvmpipe node app/scripts/ljusbord-capture.mjs --help`.
  2. With the stack up and `DEV_LOGIN_EMAIL` in `worker/.dev.vars`, run the same prefix with
     `node app/scripts/ljusbord-capture.mjs --out ~/scratch/hpf-qr0p.51.5/shots --routes '/,/ova,/drill?section=KVA&start=true' --palettes spalt,sand`.
     Quote the routes, since `?` and `&` are shell syntax.
  3. In `report.json`, on Folio routes, `theme.dataTheme` should equal each shot's `scheme`,
     and `warnings` should be empty. Exit codes:
     - 0: every shot was taken;
     - 1: a shot failed;
     - 2: preflight or sign-in failed.
