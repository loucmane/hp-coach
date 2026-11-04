# Worklog — hpf-qr0p.51.7

Ljusbord LJ-04: UI primitives (SecChip, RangeBand, Lit, Go, Seg, Kbd, Stepper, ChipRow). Marker: LJ04 UI.

These are the shared React pieces every Ljusbord screen is built from (rebuild map §1.4 and the LJ-04 entry in §4). No screen uses them yet, and no existing file imports them, so the classic app and today's Folio screens are unchanged. There is no visual route; the coordinator shoots the primitives inside LJ-05.

## Start

- 2026-11-03: Claimed on `codex/hpf-qr0p.51.7-ljusbord-lj-04-ui-primitives-secchip-rangeband-lit-go-seg-kb` at base `34e1f848776921b88cfafb6fcaf59a9d098d988f` (origin/main), clean. `app/node_modules` was present, so no WAITING note. The untracked dotfiles at the worktree root (`.bashrc`, `.idea` and so on) predate this work and stay unstaged.
- Read:
  - map §0, §1.2–§1.9, §2, and the §4 entries for LJ-04 and the beads that consume it (LJ-05, LJ-06, LJ-20, LJ-22, LJ-29, LJ-33, LJ-34, LJ-28, LJ-36);
  - `r6/A/system.css`, `direction.md`, and the sources of idag, ova, kapitel, konto, provresultat, framsteg and the facit generator (`gen_facit.py`), for the chips, the band, the stepper, the chip rows, the seg and the dock;
  - the LJ-01 tokens (`tokens.css`, `palette.css`, `tokens.guard.test.ts`), the LJ-02 libs (`folioPrefs`, `useFolioRootAttrs`, `useFolioMotion`, `useScopedKeys`), `useViewport`, the a11y helper, and the existing Folio guard tests (konto, idag) and link pattern (`IdagLink`).

## API (what later beads get)

Every file imports `./ui.css`. Classes are `fa-ui-…`, scoped `[data-folio] .fa-ui-…`.

- **`SecChip`** `{ section: Section, size?: 'l' }` plus span props. Renders the code ("LÄS") in `--fa-sec-<key>-ink` on `--fa-sec-<key>-soft`, led by a dot of `--fa-sec-<key>`, with `data-sec="las"`. `SEC_KEY` maps `Section` to the token key. `size="l"` is the kapitel heading chip.
- **`RangeBand`** `{ low, high, min = 0, max = 1, point?, goal?: { value, label }, ticks?: string[], section?, size?: 'mini', label?, decorative?, format? }`.
  - `bandGeometry(low, high, min, max)` widens the drawn box so its solid core, 20–80 % of the box (`BAND_CORE`), is exactly low–high. It reproduces every band in r6/A: Idag/Framsteg 0,4–0,7 on 0–2 → left 15 %, width 25 %; Öva 0,3–1,0 → 3,33/58,33; Öva KVA 0,0–0,6 → −10/50; Provresultat 55–95 % → 41,67/66,67. The track clips what falls past the axis ends.
  - Named `role="img"` "mellan 0,4 och 0,7" (`svNumber`: a decimal comma, a real minus, at most two decimals), or by `label`; `decorative` makes it `aria-hidden` beside text that already says the numbers (as on Idag's Prognos card).
  - `point` is Provresultat's observed-value ring; `goal` the "Mål 2,0" tick; `ticks` the evenly spread axis words; `section` a section's own band (data colour); `size="mini"` Öva's thin level band.
  - It grows from the lower bound: `transform-origin` sits on the core's start, 20 %. Rörelse `less` fades it in, and `none` (or Som systemet under an OS reduce) gives no animation, through `data-motion` from `useFolioMotion()`.
- **`Lit`** `{ as?: 'article' | 'section' | 'div' | 'aside' }` plus element props. Sets `data-lit="true"`, the sheet, `--fa-lift-2` and the `rise` entrance (fade only at `less`, none at `none`). In development a second mounted `Lit` logs one `console.warn` ("… one lit thing …").
- **`Go`** `{ kbd?, keyshortcuts?, dock?, wide? }` plus button props, or link props with `href`. A real `<a href>` or a `<button type="button">`, filled `--fa-go` / `--fa-on-go`, so a palette may tint it. The `kbd` cap is `aria-hidden` and left out of the name. `keyshortcuts` becomes `aria-keyshortcuts`, which is dropped while the kbd pref is off. With `dock`, on a phone (below 768 px) the button spans the dock with its label left and hides the hint. `wide` spans its row. Hover and press lift only at `data-motion="full"`.
- **`Seg`** `{ label | aria-labelledby, options: { value, label, hint?, disabled? }[], value, onChange, stretch? }`. A `<fieldset>` (role group) of `aria-pressed` toggle buttons, 44 px targets, exactly one pressed. Picking the pressed one does not call `onChange`. `hint` is the quieter second line inside the name ("Vårprovet 2027 lördag 10 april · 158 dagar"). `stretch` shares the row.
- **`Kbd`** `{ label? }` plus kbd props: a key cap. `label` speaks a glyph ("Enter" for ↵). **`Keys`** is a hint row ("J K nästa och förra fällan") that goes with its caps. Both render nothing while Konto's Enbokstavs-kortkommandon is off (`useFolioPrefs.kbd`), and ui.css also hides `.fa-ui-kbd` and `.fa-ui-keys` under `[data-folio][data-kbd='off']`.
- **`Stepper`** `{ label, steps: { id, label, done?, href | onSelect }[], current? }`. A `<nav aria-label>` around an `<ol>`. Every step is a link (`href`, with an optional `onSelect(event)` for router navigation) or a button (`onSelect`). The current step gets `aria-current="step"` and the halo; done steps show ✓. The numeral is `aria-hidden`, and the name reads "Gissa först, steg 2 av 5" or "Känn igen, steg 1 av 5, klart". The `<ol>` is a wrapping `ChipRow`, so it lays out on lines from 768 px and scrolls on a phone.
- **`ChipRow`** `{ as?: 'div' | 'nav' | 'ol' | 'ul', wrap? }` plus element props, and **`Chip`** `{ current?: boolean | 'page' | 'step' | 'location' }` plus link or button props.
  - One scrolling row. `data-overflow` is `end`, `start` or `both` only while chips are actually hidden (it is measured on scroll, resize and every commit), and only that edge fades.
  - A clipped current chip (`[aria-current]`) is scrolled to 16 px from the start: at once on arrival, then with `useFolioMotion().scrollBehavior`. Scrolling is horizontal only (`row.scrollTo`), so the page never jumps. A re-render with the same current chip leaves the row alone, and so does a row with no layout yet.
  - A current `Chip` takes `--fa-lit-bg` / `--fa-lit-edge` (facit).

## Choices where the design was not taken literally

Every value was read from r6/A. These are the places where the rule set (tokens only, AA in all five palettes and both themes, no opacity tricks) or the app forced a different expression. Each is pinned by a test.

- **Seg hint colour.** system.css draws `.seg button small` in ink-3 on the table-2 track. Measured with the guard's resolver, that is 4.48 / 4.47 / 4.50 / 4.48 / 4.45:1 in the light Spalt / Sand / Salvia / Bläck / Ros (dark is 6.8–6.9). That is below AA, so the hint keeps its option's ink (ink-2, or ink when pressed), and its weight (400) and size (13 px) carry the hierarchy.
- **Go's shadow and its hint.** `rgba(16,20,24,.5)` becomes `var(--fa-scrim)`, in the dock too. The hint's `rgba(255,255,255,.35)` rim plus `opacity: .85` becomes an ink-3 rim on the action's own ink. 35 % white over #15181B is about #676A6B, nearly ink-3's #61686F, so the light look holds, and nothing relies on opacity.
- **Chip-row fade.** The mask's `#000` stop becomes `currentColor`; a mask reads alpha only. The fade is drawn only on an edge that hides chips, so a short row never fakes "there is more". The start-edge fade (`transparent → 18 %`) mirrors the design's end fade (82 % → transparent) for a row scrolled away from its start.
- **Band growth.** system.css grows `.range` from `left center`, which is the start of the faded tail. The bead asks for growth from the lower bound, so the origin is the core's start (20 %), which is the lower bound itself.
- **Phone width.** The design switches at 760 px. The app's phone shell switches at `useViewport`'s 768 px, so the dock and lit-sheet rules use `max-width: 767px` and the wrapping row uses `min-width: 768px`. The guard reads `READER_MIN`.
- **Seg as a fieldset.** Biome's `useSemanticElements` rejects `div role="group"`; production Folio already uses `<fieldset>` (ThemePicker). The fieldset's frame and its min-content width are reset (`min-width: 0; margin: 0; border: 0`). Seg also wraps by default (Konto adds `flex-wrap` in the design), so a long choice wraps instead of widening the page at 390 px.
- **Focus.** A 2.5 px `--fa-ring` outline 3 px out, from the LJ-01 ring tokens. The design's global `:focus-visible { border-radius: 6px }` is not copied, because it would square the pill chips and steps on focus. The chip row has 6 px of padding (offset by a −6 px margin) so the ring is not clipped by the scroller.
- **Not in the design, token-only:**
  - a disabled `Go` (table-3 / ink-2, no lift) and a disabled `Seg` option (ink-3; disabled controls are exempt from contrast);
  - the stepper's screen-reader words ", steg N av M" and ", klart", from the design's own "steg 2 av 5" and "klart ✓". **Flagged for the language review**, since the rule is to invent no copy.
- **Flagged, not changed:** the pressed `Seg` option is shown by elevation (sheet + lift-1) and ink text on the table-2 track, which is about 1.3:1 sheet against track. That is the approved design; `aria-pressed` carries the state for assistive tech. Worth a look against WCAG 1.4.11 in the LJ-05 shots.
- **Characters:** Biome's formatter writes the minus (U+2212) and the no-break spaces (U+00A0) in `RangeBand.tsx` and `ui.test.tsx` as literal characters. Neither is a private-use character; grep confirms 4 real U+00A0 lines in the test.

## Tests

- **`ui.test.tsx`**, 63 tests, behaviour and a11y:
  - all 8 section keys;
  - the band geometry against the four r6/A bands, its label, `svNumber`, the decorative mode, the point/goal/ticks inside the image, the section band, and motion full/less/none/OS-reduce;
  - Go as button and link, its hint left out of the name, `aria-keyshortcuts`, kbd=off, dock, Tab order and motion;
  - Lit's `data-lit`, `as`, the dev warning only on a second sheet, and motion;
  - Seg's group, `aria-pressed`, no re-pick, keyboard, the hint in the name, `aria-labelledby`, disabled and stretch;
  - Stepper's nav, list, links and buttons, names, a single `aria-current="step"`, ✓ and numerals hidden, `onSelect`, and the wrapping row;
  - ChipRow's element, chips, buttons, the overflow fade per edge, scroll-into-view (at once on arrival, smooth after, none on a plain re-render, `auto` when motion is off, the stepper's own row, nothing before layout);
  - one axe run over every primitive on one lit sheet, which also counts one `[data-lit]` and one `.fa-ui-go`.
- **`ui.guard.test.ts`**, 64 tests:
  - every selector scoped `[data-folio] .fa-ui-…`, including in @media;
  - no token set except `--fa-ui-` helpers, which are set from tokens only;
  - only Ljusbord tokens, never a Folio+ alias;
  - paint values reduced to tokens and keywords, with no literal colour, colour-mix, opacity, filter or var() fallback, plus 8 planted tricks it must catch;
  - section hues only in `[data-sec]` rules, painting only the chip and the band;
  - text only in ink (never ink-4 or a raw hue);
  - lift-2 only on Lit, go only on Go, halo and lamp only on `[aria-current]`, lift-1 only on selected states;
  - motion only under `data-motion`, `less` only fading, and the three keyframes;
  - the band's 20/80 gradient and its 20 % origin;
  - kbd=off and the phone dock hiding hints, and the 767/768 media;
  - the ink focus ring on every control, and no outline removed;
  - 44 px Seg, the fieldset reset, and ≥ 40 px steps and chips;
  - styled classes ⊆ rendered classes;
  - a contrast matrix in all **5 palettes × 2 themes**: each primitive's text ≥ 4.5:1 on its surface, each section chip's -ink on its -soft over sheet, sheet-2, table and table-2 ≥ 4.5:1, and band cores (ink and all 8 hues), goal and point ≥ 3:1 on sheet and table-2. Each pair is tied to the exact declaration in ui.css;
  - the TSX: only React, the Folio libs, siblings and a type-only `Section`; no devbake; geometry-only JSX styles (4 planted cases).

## Progress

- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:red|E:2-suites-unresolved] Wrote both test files first. `pnpm -C app test src/folio/ui --maxWorkers=2`: Test Files 2 failed (2), no tests; `Failed to resolve import "./RangeBand"` and `"./ChipRow"`.
- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:red|E:vitest-79-failed] Second red round against naive stand-ins, to prove the assertions bite and not only the imports. The stand-ins:
  - a system.css port by renaming only (rgba, color-mix, opacity, `:root[data-kbd]`, unprefixed keyframes);
  - a chip with no `data-sec`; a Kbd and Keys that ignore the pref;
  - a Go whose glyph sits in its name, with no type and no shortcut;
  - a plain Lit; a band at left = low, width = high − low;
  - a Seg with no group or `aria-pressed`; a flat nav stepper; a plain div row.

  Result: 127 tests, **79 failed, 48 passed** (JSON report). The 48 that passed are met by construction:
  - the 8 planted-CSS and 4 planted-JSX detector self-tests;
  - the 20 token-contrast cases, which measure token pairs (the test tying them to ui.css failed);
  - 8 import checks and the JSX geometry check;
  - "styles only classes the primitives render";
  - six behaviours a naive version meets: a key cap, a Go link, Go Tab order, Seg from the keyboard, a row left alone while its chip is in view, and nothing before layout.
- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:green|E:vitest-127-passed] Real implementations: 127/127 passed on the first run.
- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:static|E:typecheck-lint] `pnpm -C app typecheck` passed.
  - The first `pnpm -C app lint` failed on formatting in 3 new files (Biome `format --write src/folio/ui`, CSS untouched) and on one `lint/a11y/useSemanticElements` error: `div role="group"` in Seg, now a `<fieldset>` with its reset and a test line.
  - Then Go and Chip were simplified to one destructure with a narrowed rest.
  - After that, typecheck passes and lint passes: 768 files, only the 4 pre-existing informational suggestions in devbake files (LandingBakeoffR3/R4A/R4C `useIndexOf`, l12/M3 `noUselessFragments`).
- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:probe|E:ink3-on-table2-4.45-4.50] A temporary probe in the guard measured the design's ink-3 hint on the table-2 track: Spalt 4.48, Sand 4.47, Salvia 4.50, Bläck 4.48, Ros 4.45 (light); 6.83–6.88 (dark). Removed after the reading.
- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:ui|E:127-passed] `pnpm -C app test src/folio/ui --maxWorkers=2`: 2 files, 127 tests passed after the last edit.
- [S:hpfetcher/implementation-worker-1|W:hpf-qr0p.51.7|H:full-suite|E:5701-passed] `pnpm -C app test` (full suite, no `--maxWorkers`): **200 files passed, 5,701 tests passed, 0 failed, 60.07 s**. The 2 new files and 127 new tests are part of it.
  - The generator freshness checks ran (ord-words up to date, 520 words; worked examples up to date, 140). There was no EPERM.
  - Stderr noise (act() warnings, `<div>` in `<p>`, jsdom navigation, useRouter outside a provider) comes from pre-existing tests.
- No worker/ change, so the worker checks were not run. No dependency changes, no network.

## Handoff notes for later beads

- **One lit, one go (map §1.4):** a screen test counts `[data-lit="true"]` (Lit) and `.fa-ui-go` (Go), not the map's `.fa-go`.
- **LJ-05 (shell):** spread `useFolioRootAttrs()` on `[data-folio]`, so ui.css's `[data-folio][data-kbd='off']` rule backs up the components' own kbd check. The primitives already read motion and kbd from the prefs, so they work before LJ-05 too.
  - The phone dock's action is `<Go dock kbd="↵" keyshortcuts="Enter">Fortsätt fälla 1 · ca 1 min</Go>`. The dock container positions it; on a phone Go fills it (`flex: 1 1 0%; width: 100%`) and drops the hint.
- **Screens:**
  - Bind the key with `useScopedKeys` and mirror it in `keyshortcuts`.
  - Use `RangeBand decorative` where the numbers are already printed beside it (Idag's Prognos card).
  - Kapitel's stepper is `<Stepper label="Stegen i fällan" steps current>`. Konto's jumps are `<ChipRow as="nav" aria-label="På sidan">` with `Chip`s, and the screen bleeds the row to the edge with its own margin. Facit's chips are `Chip current`.
  - A section chip is `<SecChip section="KVA" />`.
- **Review asks:** the stepper's screen-reader words (", steg N av M", ", klart") for the language review, and the pressed-Seg contrast (WCAG 1.4.11) in the LJ-05 shots.

## Handoff

- Delivery: 11 new files under `app/src/folio/ui/` plus this worklog, staged and uncommitted, exactly the write set. Nothing outside the write set changed.
- **The bead could not be updated from this session; the coordinator needs to apply the final steps.** The work itself is finished: the state is `done`.
  - `gc bd update "hpf-qr0p.51.7" --set-metadata "gc.worker_state=done" --set-metadata "gc.worker_state_reason=…"` was refused twice by the session's command permissions, so it was not retried.
  - `gc bd update hpf-qr0p.51.7 --append-notes '…'`, in the documented form, passed the permission check but failed in the sandbox: `open /home/loucmane/gascity/city/.beads/dolt/proxy.lock: read-only file system` (and the workspace gate `/home/loucmane/dev/hpfetcher-gc-main/.beads.gate.lock`, also read-only). Every bead write takes that lock, so parking (`--status deferred --assignee ""`) was not attempted.
  - To apply:
    - `gc.worker_state=done`
    - `gc.worker_state_reason=8 Ljusbord UI primitives and ui.css with 127 new tests, typecheck lint and full app suite 200 files 5701 tests green, 12 write-set files staged and uncommitted`
    - note: `LJ04 UI DONE: hpf-qr0p.51.7 — 8 Ljusbord UI primitives and ui.css, 127 new tests incl. axe, a CSS guard and a contrast matrix over 5 palettes and 2 themes, red first with 79 of 127 failing on naive stand-ins, typecheck, lint and the full app suite green with 200 files and 5701 tests, 12 write-set files staged and uncommitted, review asks and the worker_state metadata gap are in the worklog`
    - then park with `--status deferred --assignee ""`.
