# M3 fidelity report — M6 cross-surface sweep

**Date:** 2026-07-03 · **Branch:** `feat/m6-fidelity` (M0–M5 merged to main)
**Reference:** `/redesign-l12?dev=1&v=3` (M3.tsx) · palette **spalt** · motion **reduced**
**Verdict: PASS** — 417 element-cell comparisons green, **0 hard fails**; every
remaining delta is a ratified decision, a visually-identical rendering, or a
capture artifact (each named below). Rows owned by still-pending tasks (MC,
DrillResult) are listed under *Routed*, not silently passed.

## Method

Instead of eyeballing 72 screenshots, the sweep **measures computed styles**:
`app/scripts/m3-fidelity-capture.mjs` drives every cell of the matrix, captures
a live+ref screenshot pair, and extracts 18 style properties (font family/size/
style/weight, letter-spacing, line-height, colors, grid templates, paddings,
borders, text-decoration, white-space) for **43 paired elements** — the live
`.hpc-m3-*` class vs the reference `.m3-*` class — into
`audit/m3-fidelity/measurements.json`. A comparator diffs each pair with ±0.9px
numeric tolerance (±8px for fr-resolved grid columns). Colors resolve through
the same tokens on both sides, so string equality is exact.

**Pass bar:** an element-cell PASSes only when live matches the reference on
every probed property at the same viewport/palette/mode. Copy is validated via
the captured `_text` (Swedish strings verbatim: eyebrow `ORDFÖRSTÅELSE · FRÅGA
n AV total`, verdict `Rätt./Fel.`, verdict-sub `Rätt svar är x) …. Häng med i
varför.`, section titles `Så löser du den` / `Varför de andra lockar` /
`Dagens plan` / `Dina fällor just nu`, labels `Varför det lockar` / `Varför det
är fel`, tiers `kärna`/`detalj`, coda `Tillräcklig information för lösningen
erhålls`, missing `Förklaring saknas ännu för den här frågan.`).

**Regenerate:** `cd app && node scripts/m3-fidelity-capture.mjs` (needs `pnpm
dev` :5173, worker :8787, `tests-e2e/.auth/user.json`). Images + measurements +
`comparison.txt` land in `audit/m3-fidelity/` (untracked; ~14 MB, reproducible).

## Capture matrix — 36 cells, 72 images

9 surface-states × {1440, 402} × {light, dark}. Filenames:
`{live|ref}-{state}-{width}-{mode}.png` in `audit/m3-fidelity/`.

| # | Surface-state | Live | M3 ref | Interaction |
|---|---|---|---|---|
| 1 | Home | `/` | `&s=home` | — |
| 2 | Drill ORD pre-answer | `/drill?section=ORD` | `&s=drill&q=ord` | start |
| 3 | Drill ORD graded | 〃 | 〃 | start + pick a) |
| 4 | Drill LÄS pre-answer | `/drill?section=LÄS` | `&q=las` | start |
| 5 | Drill NOG pre-answer | `/drill?section=NOG` | `&q=nog` | start |
| 6 | Drill XYZ pre-answer | `/drill?section=XYZ` | `&q=xyz` | start |
| 7 | Drill DTK pre-answer | `/drill?section=DTK` | `&q=dtk` | start |
| 8 | Drill XYZ graded | 〃 | 〃 | start + pick a) |
| 9 | Drill DTK graded (missing-explanation) | 〃 | 〃 | start + pick a) |

Theming: palette pinned to spalt via a prefs-response intercept (never mutates
the dogfood user's prefs); mode set server-side per phase via `/dev`'s synced
Tema buttons and verified by reload. All 36 cells verified themed; a mean-luma
spot-check confirms dark cells are genuinely dark.

## Element verdicts

All 43 paired elements PASS across their applicable cells (417 green
comparisons): frame/row/meta chassis, eyebrow, italic display, tactic aside
(h+t), keys hint, option rows incl. `is-ok`/`is-bad`/`is-dim` semantics,
verdict word + sub, solution lede, steps (n/h/tier/t), distractors
(h/struck `<s>` option text/l/p), home stats (n/l), resume band (+t, CTA),
plan rows (n/t/r/min, tag), trap rows (t/n), LÄS passage (h/p), NOG
statements (n/t) + coda, DTK figure + `m3-missing` graded state, section `h`
headings.

Deltas the sweep itself found and fixed (in this branch, owned by M0/M1/M2):

1. **Chassis base type** — live inherited the app body's 16px/1.5; M3's page
   reads at 15px/1.55 (M3.tsx L46-52). Every em-derived size inside drifted
   ~1px. Fixed on `.hpc-studydesk`/`.hpc-m3-frame`/`.hpc-m3-page` (the last
   covers the phone drill path, which renders outside both frames). *(M0)*
2. **Frame paddings** — desktop top was clamp-36px vs M3's fixed 56px; phone
   lacked the ≤900px `40px 18px 72px` media step (M3.tsx L719-721). *(M0)*
3. **Content column width** — DrillQuestion kept its own horizontal `--pad-lg`
   inside StudyDesk's 24px gutters, squeezing content to 567px vs the
   reference's 647px. `fill=false` now drops the inner gutters. *(M1)*
4. **Solution lede** — clamp(17..19px) + 16px padding vs M3's fixed
   19px/18px (M3.tsx L451-463). *(M2)*

## Exemptions (named, not silent)

| Delta | Cells | Why it is not a FAIL |
|---|---|---|
| `row`/`meta`/`opt*` grid + padding at 402 | 402 only | **Owner decision** (MD bake-off): phone linearizes the margin rail; the mock keeps its desktop rail at all widths. Live is the target. |
| `optK` textTransform `lowercase` vs `none` | all | Rendered glyphs identical — option letters are already lowercase. |
| `passageP`/`stepT` white-space pre | LÄS/graded | **M4 decision**: corpus passages/steps carry real newlines (880/1080 passages open with a title; 112 steps have breaks). |
| verdict/option colors in 2 cells | ord/dtk-graded few | **Capture artifact**: live picked the *correct* option (green `Rätt.`) while the fixture pick was wrong (red `Fel.`). The is-ok/is-bad token pairs verify green in the cells where both sides graded wrong. |

## Routed to pending tasks (not part of this gate)

| Row | State | Owner |
|---|---|---|
| Desktop minimal-mast chrome (brand + nav, no section echo, no status line) | Live still renders the EDITION `Page` shell (`page-shell`/`running-head`/`status-line` testids in use, pinned by `responsive.spec.ts:142-144`) | **MC (#159)** — also rewrites those assertions |
| Home content column 557px vs 647px | The `Page` shell's gutters nest inside `.hpc-m3-frame` | **MC (#159)** — resolves when the shell is demolished |
| Phone floating bottom-center "Nästa fråga" pill + visible touch exit | Phone next is a full-width bottom button; no dedicated touch exit | **M1 follow-up / MC** — decision row, tracked |
| "Klart." end-of-session screen | Not in the 9 surface-states | **DrillResult (#161)** |
| Carry-over surfaces (diagnostik/auth/repetition/lektion/progress) | No M3 ref; M5 verified them against the drill/home pattern (idle heroes italic, no card chrome, muted rails) — see PR #163 | **M5 ✅** |

## Findings

- **`mode` never persists server-side from the EditionStrip** — the ◐ toggle
  calls the raw store setter (local-only), while `/dev`'s Tema buttons go
  through `useSyncedPrefs` and persist. Cross-device dark mode is therefore
  broken from the strip. The `prefs` DB schema has the column; the wire-up is
  the gap. → follow-up task.
- **`UserPrefsPatch.palette` union lacks `spalt`** (`useUserPrefs.ts:22`) — the
  server accepts and persists it, but the client type is stale. → same
  follow-up.

## Test evidence

- `pnpm vitest run`: **232 passed** (0 failed).
- `pnpm test:e2e`: **38 passed, 16 skipped**; one mobile `api.spec` failure in
  the parallel run passes in isolation (known Clerk-refresh flake, documented
  in the spec itself at `api.spec.ts:36`).
- Contract testids confirmed live: `drill-idle`, `drill-prompt`, `drill-next`,
  `option-*`, `home-greeting`, `daily-plan-card`, `daily-plan-skeleton`,
  `pedagogy-*` (incl. `pedagogy-flag-missing`), `auth-form-pane`,
  `auth-brand-pane`. At-risk EDITION testids (`page-shell`, `running-head`,
  `status-line`) are still present *and still asserted* — they belong to MC's
  demolition, flagged above.
