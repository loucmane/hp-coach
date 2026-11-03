# Worklog — hpf-qr0p.51.3

Ljusbord LJ-02: Folio behaviour libraries. Marker: LJ02 LIBS.

Six small libraries for the Ljusbord screens (rebuild map §1.6–§1.8 and the LJ-02 entry in §4). Nothing is wired into a screen yet; later beads import them. With the `folioPreview` flag off nothing changes, because no existing file imports these modules.

## Start

- 2026-11-03: Claimed on `codex/hpf-qr0p.51.3-ljusbord-lj-02-folio-behaviour-libraries` at base `71d26f97511b269cb644f65ac1448fa819203efa` (origin/main), clean. `app/node_modules` present, so no WAITING note. The pre-existing untracked dotfiles at the worktree root (`.bashrc`, `.idea` and so on) are not part of this work and are left unstaged.
- Read: map §0, §1.6–§1.8, §2 (Konto prefs row) and the §4 entries for LJ-02 and its consumers (LJ-05, LJ-17, LJ-24, LJ-25, LJ-28, LJ-30, LJ-31, LJ-33, LJ-36, LJ-37); `r6/A/_src/build.py`, `system.css`, `direction.md`, the konto and fraga sketches (key list, Tema / Rörelse / Textstorlek copy, the sketch's own region key handler); the existing Folio key handlers (FolioSessionStage, OvaLead, FolioRepetera, FolioShell ⌘B), `lib/motion.ts`, `drillCore.prefersReducedMotion`, `uiStore`, `designStore` and their test idioms, and MathText's sentinel handling.

## API (what later beads get)

### useScopedKeys(regionRef, bindings, { enabled })
- Bindings map a `KeyboardEvent.key` name to a handler: `{ a, b, J, ArrowRight, Enter, 'Shift+a', 1 }`. Single characters match in either case (Caps Lock), and binding names are normalised the same way (`J` = `j`, `Shift+A` = `Shift+a`).
- Fires only when the event target is inside `regionRef.current` (the region element itself counts). The region is read when the key arrives, so a region that mounts later works without a new subscription.
- Ignored:
  - inputs, textareas, selects and contenteditable (`contenteditable="false"` is not a typing target);
  - Meta, Ctrl or Alt held, so modifier shortcuts such as ⌘K stay global (AltGr = Ctrl+Alt is ignored too);
  - Shift, unless the binding is named `Shift+x`. Shift only counts as a modifier for letters and named keys: a character that needs Shift on the layout (AZERTY digits) still matches, and US Shift+1 is `!`, which matches no `1` binding;
  - held-down repeats, IME composition, and keys already `defaultPrevented`;
  - Enter and Space on a focused `a[href]`, `button`, `summary`, `[role=button]` or `[role=link]`. The control keeps its own activation, the rule OvaLead and FolioRepetera follow today.
- Fully off (no listener) while `enabled` is false or the Konto pref `kbd` is off. It is also off at key time inside `[data-folio][data-kbd="off"]` (map §1.6).
- A handled key is `preventDefault`ed. A handler can return `false` to decline (no preventDefault), e.g. a letter that is not an option on this question.
- One `document` keydown listener per hook. Because it sits on `document`, React handlers inside the region run first and can claim a key with `preventDefault`. Bindings update through a ref, so new handler objects never re-subscribe. Nested regions should not bind the same key.

### keepMathTogether(text)
- A port of `keep_math_together()` from R6 `build.py` with every rule in build.py's order:
  - operators − + = ≠ ≈ × ± ≤ ≥ < > joined to both operands (the minus is U+2212; ASCII `-` is a dash, as in build.py);
  - an operator at the start or end of a run;
  - `I:`/`II:` with their term;
  - number + km/h, m/s, km;
  - coordinate pairs;
  - the three `·` product rules;
  - the HTML-level product rule (`</sub> · <span class="math">`). In plain text this becomes: a math segment or a super/subscript digit on the left; a math segment, a digit or an indexed variable (`k₂`) on the right.
- Text inside U+E000…U+E001 is never edited. Each math segment is masked as one U+E000 stand-in while the rules run. That stand-in cannot occur outside math, and no rule adds or drops one. The segment then acts as build.py's `<span class="math">` operand: `x = y` between two segments is joined, and so are coordinate pairs and products of segments.
- An unclosed U+E000 runs to the end and is left alone, as in MathText.
- It uses regex lookbehind, which classic `components/drill/DrillQuestion.tsx` (`CLOZE_GAP_RE`) and Folio `drillCore.ts` (`RARE_RE`) already use at module scope, so it adds no new browser requirement.
- Pure, idempotent, ES2020-safe (no `replaceAll`). The source holds ` `/``/`` as escape text. Checked by code point: 0 literal U+E000/U+E001/U+00A0 in either file.

### wilson(k, n)
- Returns `{ low, high }`, the 95 % Wilson score interval (z = 1.959963984540054). `wilson(10, 12)` = 0.552–0.953, about 55–95 %.
- k = 0 gives exactly `low: 0`; k = n gives exactly `high: 1`.
- n = 0, or a k or n that is not finite, gives `{ low: 0, high: 1 }`: no evidence, no claim. A k outside 0…n is clamped.

### folioPrefs (zustand, persisted)
- `useFolioPrefs`, stored under localStorage key `hpc-folio-prefs`, version 1, with `setPrefs(patch)` and `resetPrefs()`.
- Values, with defaults in brackets:
  - `theme`: `light` / `dark` / `system` [`system`];
  - `motion`: `system` / `less` / `none` [`system`];
  - `kbd` [true];
  - `textSize`: `small` / `normal` / `large` / `xlarge` [`normal`], i.e. Mindre 15 / Normal 17 / Större 19 / Störst 21 px;
  - `palette`: the classic `PaletteKey`, so `spalt` / `sand` / `sage` / `ink` / `rose` = Spalt, Sand, Salvia, Bläck, Ros [`spalt`];
  - `showMyTime` [false].
- Lists in Konto order: `FOLIO_THEMES`, `FOLIO_MOTIONS`, `FOLIO_TEXT_SIZES`, `FOLIO_PALETTES`. A `Record<PaletteKey, true>` keeps the palette list complete at compile time.
- `sanitizeFolioPrefs(unknown)` keeps only valid fields. It is used for:
  - storage `merge`, so corrupt JSON, wrong types and unknown enums fall back field by field;
  - `migrate`, so another version's record keeps what is still valid;
  - `setPrefs`, which also skips a write that changes nothing (no persist, no re-render; good for LJ-17's hydration echoes).
- Storage access is wrapped, so private browsing or blocked storage keeps the prefs in memory and never throws.
- Only a type import from `@/lib/tokens`. Classic stores and `ThemeMode` are untouched.

### useFolioRootAttrs()
- Returns `{ 'data-theme', 'data-palette', 'data-motion', 'data-kbd', 'data-text' }` (memoised) to spread on the `[data-folio]` root. `system` never reaches the DOM:
  - `data-theme` is `light`/`dark`. `system` follows `prefers-color-scheme: dark` live (`useSyncExternalStore` on matchMedia `change`).
  - `data-motion` is `full`/`less`/`none`. `system` follows `prefers-reduced-motion: reduce` live and resolves to `none` under reduce. That matches the approved design's own rule: system.css turns every animation and transition off under reduce.
  - `data-kbd` is `on`/`off`; `data-text` is the textSize value; `data-palette` is the palette key.
- Without matchMedia: light and full motion.
- Also exported: `useSystemDark`, `useSystemReducedMotion`, `resolveFolioTheme`, `resolveFolioMotion`, `useFolioMotionLevel`.

### useFolioMotion()
- Returns `{ allowed, level, durations: { d1: 140, d2: 260, d3: 600 } (ms), ease: [0.2, 0.7, 0.2, 1], scrollBehavior }`, mirroring system.css `--ease`/`--t1..t3` (map: `--fa-ease`, `--fa-d1..d3`).
- `allowed` is true only at `full`. `less` still allows opacity fades (check `level`).
- One frozen-shape object per level, so it is safe as an effect dependency.
- There is no `useFolioMotion.test.ts` in the write set, so its tests live in `useFolioRootAttrs.test.ts` (same resolution path).

## Progress

- [S:hpfetcher/implementation-worker-2|W:hpf-qr0p.51.3|H:red|E:5-suites-unresolved] Wrote the five test files first. `pnpm test <5 files> --maxWorkers=2`: Test Files 5 failed (5), no tests. Every suite failed with `Failed to resolve import` for its module.
- [S:hpfetcher/implementation-worker-2|W:hpf-qr0p.51.3|H:red|E:vitest-72-failed] Second red round against naive stand-ins, so the assertions are proven to bite and not only the imports:
  - identity `keepMathTogether`;
  - Wald p ± 1.96·se for `wilson`;
  - an unpersisted, unvalidated store with a `light` default;
  - today's window-level listener for `useScopedKeys` (no region, input, modifier or pref checks);
  - no system resolution in the root attrs;
  - always-allowed motion.

  Result: 90 tests, 72 failed and 18 passed, from the JSON report. The 18 that passed are guards an identity or default stand-in meets by construction: "leaves plain prose alone" ×8, "never touches the text inside a math pair", "is idempotent", the attrs defaults, "explicit Ljust or Mörkt ignores the OS", "passes kbd, text size and palette through", "falls back without matchMedia", the useFolioMotion defaults, "a character that needs Shift…", "stops listening on unmount", and "narrows as the evidence grows".
- [S:hpfetcher/implementation-worker-2|W:hpf-qr0p.51.3|H:green|E:vitest-90-passed] Real implementations: 5 files, 90/90 passed on the first run.
- [S:hpfetcher/implementation-worker-2|W:hpf-qr0p.51.3|H:static|E:typecheck-lint] The first `pnpm typecheck` failed on test-only typing:
  - The app tsconfig loads `@cloudflare/workers-types`, whose global HTMLRewriter `Element` merges into the DOM `Element`. `Element.append` therefore takes `string | Response | ReadableStream`, and `HTMLSelectElement` stops being assignable to `Element`, because the two `remove()` return types clash.
  - The test now uses `appendChild` and types `press()` on `EventTarget`. It also gives `renderHook` explicit generics.
  - Biome flagged `void` in a union (the handler type is now `=> unknown`) and one long import.

  After the fixes, `pnpm typecheck` passes. `pnpm lint` passes: 733 files, only the 4 pre-existing informational suggestions in devbake files (LandingBakeoffR3/R4A/R4C `useIndexOf`, l12/M3 `noUselessFragments`).
- [S:hpfetcher/implementation-worker-2|W:hpf-qr0p.51.3|H:folio-lib|E:92-passed] `pnpm test src/folio/lib --maxWorkers=2`: 6 files, 92 tests passed (the 90 new plus format.test.ts).
- [S:hpfetcher/implementation-worker-2|W:hpf-qr0p.51.3|H:full-suite|E:5379-passed] `pnpm test`, full suite without `--maxWorkers`: 187 files passed, 5,379 tests passed, 0 failed, 64.17 s. That is the hpf-wmp8 baseline (182 / 5,289) plus exactly these 5 files and 90 tests. The generator freshness checks ran (ord-words up to date, 520 words; worked examples up to date, 140). There was no EPERM. Stderr noise (act() warnings, `<div>` in `<p>`, jsdom navigation) comes from pre-existing tests.
- After the full run, the only change was a comment in `folioPrefs.ts`. The final re-run of folio/lib tests, typecheck and lint is recorded in the Handoff.
- No worker/ change, so the worker checks were not run. No dependency changes, no network.

## Handoff notes for later beads

- **LJ-01 (tokens.css)** should style the resolved values only:
  - `[data-folio][data-motion='less']` (fades only) and `[data-motion='none']`;
  - `[data-text='small'|'normal'|'large'|'xlarge']` → `--fa-fs-base` 15/17/19/21;
  - `[data-kbd='off'] .fa-kbd { display: none }`;
  - `data-palette` = the five PaletteKeys.

  A Folio `@media (prefers-reduced-motion)` rule is not needed, because the hook resolves it, but it is harmless.
- **LJ-05 (shell):** `<div data-folio="" {...useFolioRootAttrs()}>` replaces `data-theme={mode} data-palette={palette}` from uiStore. Map §1.8 also wants `color-scheme` and `<meta name=theme-color>`. They are not in this bead's contract: `color-scheme` belongs in tokens.css and theme-color in FolioShell, restoring index.html's `#f5efe0` on unmount.
- **LJ-10 / LJ-11 / LJ-17 (server sync):** map the store to the server columns:
  - `kbd` ↔ `shortcuts`;
  - `theme` `system` ↔ `mode_follow_system=1`, and `light`/`dark` ↔ `mode` + `mode_follow_system=0`;
  - `motion` ↔ `motion` (`system`/`less`/`none`);
  - `textSize` ↔ `text_size` (`small`/`normal`/`large`/`xlarge`, default `normal`);
  - `showMyTime` ↔ `show_my_time`.

  Hydrate through `sanitizeFolioPrefs` and `setPrefs`.
- **Screen beads (LJ-22 Öva, LJ-24 fråga, LJ-25 facit J/K, LJ-28 Repetera, LJ-30 provkörning, LJ-32 Uppslag, LJ-33 kapitel):** replace window listeners with `useScopedKeys(ref, {...})` on the screen's focusable region (`tabIndex={-1}`). Use `'Shift+a'` for Stryk and `1`/`2`/`3` for confidence. Return `false` for letters that are not options. Enter on a focused option button stays native.
- **drillCore.prefersReducedMotion:** wrap it with `useFolioMotion().scrollBehavior`/`.allowed` (LJ-24).

## Handoff

- Delivery: 11 library and test files plus this worklog, staged and uncommitted, exactly the write set. Staging details are in the final bead note.
