# Ljusbord LJ-01: tokens, type, fonts, palette layer and alias bridge — hpf-qr0p.51.1

Marker: `LJ01 TOKENS`. State at handoff: **question** (one owner decision, below). Everything else is done and green.

## Findings — 2026-11-03

- Claimed at base 71d26f97511b269cb644f65ac1448fa819203efa (origin/main). The coordinator staged the four woff2 files in `app/public/fonts/folio/` a minute after the claim; dependencies were installed.
- Two suites outside this write set read the token files, and both constrain them:
  - `screens/uppslag/uppslag.guard.test.ts` reads `--fa-ink`, `-2`, `-3`, `--fa-paper` and `--fa-leaf` from the first `[data-folio] {` block and from `[data-folio][data-theme='dark'] {`. It accepts opaque OKLCH only, and it resolves a single `var()` step (its worked-example bridge says `--bg: var(--fa-paper)`).
  - `routes/-root-direction-shell.test.ts` requires every selector in tokens, shell and palette CSS to start with `[data-folio]`, no inherited type on root rules, and focus rules only on the shell parts. So `@font-face` cannot go in tokens.css (it lives in fonts.css), and Ljusbord's body type cannot sit on the root.
- The brief's "fog" is the table ground: `--table` in system.css, `--fa-table` in map §1.2. No design file uses the word.
- system.css's line-2 is 1.77:1 on the light sheet and 1.66:1 on the dark one. The brief asks for 3:1, and also for Spalt to equal system.css exactly. Both cannot hold (open question below).
- `vite.config.ts` precaches `**/*.woff2`. The build's `sw.js` lists all four faces (136 KB), so every user downloads them, classic included. That file is outside this write set; adding `globIgnores: ['fonts/folio/**']` there would keep them out.

## Decisions

- **Values** are OKLCH literals that round back to system.css's hex; the guard pins both the text and the round trip. OKLCH because the uppslag guard parses nothing else, and because system.css's section `-ink` (`color-mix` in oklab toward black or white) is exact in OKLCH: L and C scale by 0.76, H stays.
- **Names** follow map §1.2–§1.4:
  - colours: `--fa-table/-2/-3`, `--fa-sheet/-2`, `--fa-ink/-2/-3/-4`, `--fa-line/-2`, `--fa-on-ink`, `--fa-mixk`, `--fa-on-c`;
  - the light: `--fa-lit-bg`, `--fa-lit-edge`, `--fa-halo`, `--fa-lift-1/-2`;
  - sections: `--fa-sec-<s>` with `-ink` and `-soft` (11 % alpha), light and dark;
  - type: `--fa-sans` (Ljus Siffror first), `--fa-display`, `--fa-mono`, `--fa-fs-base` 17 px;
  - shape and motion: `--fa-r1..r3` 10/14/22, `--fa-ease`, `--fa-d1..d3` 140/260/600 ms.
  - The 4 px space scale and the t12–t56 steps stay.
- **Accent family** is `--fa-go`, the one ink-filled action, plus `--fa-on-go`. Spalt keeps both ink. The focus ring is its own token, `--fa-ring` = ink, with `--fa-ring-w` 2.5 px and `--fa-ring-offset` 3 px (map §1.6); palettes do not tint it. `--fa-scrim` keeps its name with Ljusbord's shadow ink.
- **Palettes** move only the table steps, the sheets and go, each at Spalt's lightness:
  - Sand: warm (H 74–85), umber go.
  - Salvia: sage (H 165, dark 195), green-grey go.
  - Bläck: cool blue (H 250–265), navy go.
  - Ros: blush at H 350, plum go. It leans to pink because a blush white near hue 0 has high HSL saturation and fails the no-red rule (planted case `#FBF3F2`).
- **Selectors** are exactly the brief's: `[data-folio][data-palette='<name>']` and `…[data-theme='dark']`. A light palette rule weighs as much as the dark base and loads after it, so each dark rule restates every token its light rule sets. The guard checks this.
- **Alias bridge.** Every Folio+ name points at a Ljusbord token, and `--fa-accent*` land on go, which is ink in Spalt (map §1.9). `--fa-ok` → ink: "a verdict is words and shape" (facit.html). `--fa-mark` → lit-edge, `--fa-pop` → lift-2, `--fa-serif` → sans.
  - Exception: `--fa-paper` and `--fa-leaf` are literal copies of the table and the sheet in the base and dark blocks, and `[data-folio]:not([data-palette='spalt'])` points them at the live tokens. That keeps the uppslag guard's one-step resolver green. The token guard asserts both always equal their target in every palette and theme.
  - They can become plain aliases once that guard resolves more than one step (LJ-32 owns the file), or at LJ-40.
- **Fonts.** `fonts.css` is imported by `useFolioFonts.ts`, so it ships in the lazy Folio CSS chunk and never on the classic entry (checked in the build).
  - I rejected a `?url` runtime `<link>`: Vite 6.4.2 inlines assets under 4 KB as `data:` URLs, and `/fonts/…` cannot resolve against a `data:` stylesheet.
  - The hook warms the four files with `document.fonts.load` and adds no `<link>`.
- FolioShell.tsx and FolioShell.test.tsx needed no change. FolioShell still imports tokens, shell and palette in that order, and the palette assertions still hold.

## Open question for the owner

system.css's line-2 (#BFC4BD light, #3D444A dark) is 1.77:1 and 1.66:1 on the sheet. "Spalt exactly" and "line-2 at 3:1" cannot both hold.

The staged tokens keep system.css: the approved look, which the visual gate compares against. The guard records the line-2 check as `it.todo`.

- **Keep the design value.** line-2 draws ghost-button borders, link underlines and key caps, and every one of those controls is named by its text, so WCAG 1.4.11 does not require 3:1 there. The design panel raised 1.4.11 only for the provkörning cell states.
- **Darken to 3:1.** About #8E949A light and #6D747B dark (ink-4's values) would pass, but those borders and underlines get visibly heavier.
- **Recommendation:** keep the design value, and read the brief's 3:1 as the focus-ring rule. That check is asserted for every palette in both themes.

## Left for later beads

- `--fa-math-scale` stays 1.14em, tuned for Literata. Retune it against Atkinson's x-height on fråga and facit (map §1.3); there is no font-metrics tool offline.
- `[data-folio][data-text]` → `--fa-fs-base` (15/17/19/21) waits on the `text_size` values from LJ-02 and LJ-10. tokens.css is not in their write sets.
- Unported screens change in two visible ways: radii r1/r2 grow from 6/12 to 10/14 px, and shell focus rings become 2.5 px.

## Verification — 2026-11-03

- **Red first**, the new guard against the old tokens, palettes and hook: 48 tests, 45 failed, 2 passed, 1 todo. The failures:
  - Ljusbord tokens undefined (`--fa-table is undefined`);
  - palette selectors in the Folio+ `:not([data-theme='dark'])` form;
  - `fonts.css` missing (ENOENT);
  - `useFolioFonts` appending the Google Fonts stylesheet.
- **Green.** tokens.guard: 47 passed, 1 todo. With the planted red and contrast cases added, the guard plus uppslag.guard, repetera.guard, -root-direction-shell and FolioShell.test: 5 files, 163 passed, 1 todo.
- **pnpm typecheck:** passed.
- **pnpm lint:** passed. The four informational diagnostics are pre-existing, in unchanged devbake files.
- **Full app suite, `pnpm test` without --maxWorkers:** 183 files passed; 5,345 tests passed, 1 todo.
- **vite build** (into the scratchpad, not `app/dist`): passed, with the existing route-file and chunk-size warnings.
  - The faces sit in the shared Folio CSS chunk with `url(/fonts/folio/…)` intact.
  - `index.html` does not reference that chunk.
  - `sw.js` precaches the four woff2 files (see Findings).
- Visual check (idag and fråga, light and dark, Spalt plus one palette) is the coordinator's.

## Handoff

- Staged, uncommitted: tokens.css, palette.css, fonts.css, useFolioFonts.ts, tokens.guard.test.ts, the four woff2 files and this worklog.
- The untracked dotfiles at the worktree root (.bashrc, .gitconfig, .idea …) are sandbox artifacts, not mine. They are not staged.
- To close: the owner's line-2 decision (above), the coordinator's visual check, the signed commit and the review.
