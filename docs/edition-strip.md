# Edition Strip — visual-preference picker

> Design doc for the user-facing theme/font/layout switching system.
> Status: spec — implementation lives on the next branch.

## Problem

`uiStore` manages five visual axes (palette, mode, font, density, drill
layout) for a total of `4 × 2 × 4 × 3 × 3 = 288` raw combinations.
Today the only ways to switch any of them are:

- **`/dev` tweaks panel** — gated behind `import.meta.env.DEV` or
  `?dev=1`; not user-reachable
- **Cmd+K palette** — only has a single `"Öppna tweaks"` shortcut;
  doesn't expose individual axes

So the user has no way to change *anything* visual without leaving
production mode. And even when they do reach `/dev`, they face five
independent dropdowns and must hand-tune the bundle every time.

The user (ADHD-PI, dogfooding daily, 30–90 min sessions, targets 2.0)
needs a way to:

1. Shift the *kind of reading* (slow editorial vs math workbook vs
   compact cockpit) with one click
2. Shift the *aesthetic* (warm sand vs cool sage vs mono ink vs rose)
   independently
3. Toggle light/dark for the actual room lighting independently
4. NOT face a "choose your workspace" gate at session start

Earlier proposals — Cmd+K commands + a `/settings` page, or named
"workspaces" like "morgon / sen kväll" — were rejected. See
§ Explicitly rejected for why.

## Decision

Ship a **three-axis picker** inline in the running head, called the
**Edition Strip**. Three independent axes, each with a typographic
treatment matching the existing folio glyph signature.

```
┌────────────────────────────────────────────────────────────────────┐
│ HP · COACH · KVA                  ◐  sand sage ink rose · editorial workbook cockpit  │
│ ──────────                                                          │
│                                                                     │
│                  [page content]                                     │
│                                                                     │
│ -- ÖVNING -- ord · q12 · ▉▉▉▉▉░░░ · pp. 12/80 · esc · ⌘k          │
└────────────────────────────────────────────────────────────────────┘
```

The three axes:

| Axis | Choices | What it controls | Where in chrome |
|---|---|---|---|
| **Mode** | light · dark | Ambient light (matches OS dark-mode) | Single glyph `◐` |
| **Palette** | sand · sage · ink · rose | Page's "ink and paper" — color identity | 4 words, active styled in own accent |
| **Edition** | editorial · workbook · cockpit | Work shape (font + density + drill layout bundled) | 3 words, active gets under-rule |

`2 × 4 × 3 = 24` user-facing combinations. Down from 288.

## Why this beats workspaces

Earlier hypothesis was 5 named "workspaces" — `morgon / djup studie /
sen kväll / övning / cockpit` — each bundling all five axes including
palette + mode. Designer subagent ultrathought and rejected it:

1. **Mood-naming projects user's psychological state into chrome.** The
   running head should belong to the work (section, qid, exam), not to
   "what mood am I in." Same reason Stripe Press doesn't say "Sunday
   morning edition" on the book — it says "Penguin Classics, third
   printing."

2. **5 is over the self-evident cap.** Apple Books' actually-used
   theme set is 3 (white/sepia/black). Past 3, you have to *read* each
   option name. Past that, you're back at a settings page.

3. **The "diverged" state is the steady state.** Power user dogfooding
   12+ months will be off-preset most of the time — they tuned density
   once but the workspace name still says `〈sen kväll〉`. The chrome
   lies. Splitting orthogonal axes (mode, palette) out of the bundle
   makes divergence *only* possible within the bundle (font/density/
   drill layout) — and an `egen` ("own") word surfaces honestly when
   it happens.

4. **Mode is orthogonal in real life.** Toggling dark at 19:00 should
   not require re-picking palette + font + density + layout. OS-level
   dark mode has trained the muscle memory; respect it.

5. **Palette is aesthetic, edition is work-shape.** They're different
   *kinds* of decisions. Bundling them confuses category. Keep them
   independent.

## The model

### Edition bundle

`edition` is the only bundled axis. It writes three sub-axes atomically:

| Edition | font | density | drill layout | Best for |
|---|---|---|---|---|
| **editorial** | literary | comfy | A (editorial 2-column) | ORD · LÄS · MEK · ELF — slow reading |
| **workbook** | editorial | regular | B (workbook 2-column) | XYZ · KVA · NOG · DTK — math grinding |
| **cockpit** | hyperlegible | compact | C (cockpit terminal) | sprints, fatigue, power-user mode |

Naming is descriptive of **the work**, not the user's mood. Same
metaphor (a typographic "edition" of a textbook) across all three.

### Palette and mode

Palette and mode remain as `uiStore` already has them today. No
bundling, no compound state — pure orthogonal axes.

| Palette | accent | feel |
|---|---|---|
| **sand** | warm tan | default; the "paper" register |
| **sage** | muted green | the editorial-publication register |
| **ink** | near-black | high-contrast, monochrome |
| **rose** | rose pink | a softer alternative; useful for reading |

| Mode | feel |
|---|---|
| **light** | day; paper-on-desk |
| **dark** | night; ink-on-vellum |

### State shape

```ts
// uiStore.ts (additions)
type Edition = 'editorial' | 'workbook' | 'cockpit'

type UiState = {
  // existing
  palette: PaletteKey       // 'sand' | 'sage' | 'ink' | 'rose'
  mode: ThemeMode           // 'light' | 'dark'
  font: FontKey             // 'literary' | 'geometric' | 'editorial' | 'hyperlegible'
  density: Density          // 'compact' | 'regular' | 'comfy'

  // new
  drillLayout: 'a' | 'b' | 'c'      // editorial / workbook / cockpit layouts
  edition: Edition          // last setEdition() call; for picker label only
  // …existing setters…
  setDrillLayout: (l: 'a' | 'b' | 'c') => void
  setEdition: (e: Edition) => void  // atomic: writes font + density + drillLayout
}
```

`setEdition(e)` writes the three sub-axes atomically per the bundle
table. **The picker derives `'custom'` at render time** by comparing
current font/density/drillLayout to the active edition's bundle — it
is NOT a fourth value the store can be in. This means a custom-state
session that gets reloaded after closing the tab still reads as
`custom` correctly, with no extra state to migrate.

```ts
function getActiveEdition(state: UiState): Edition | 'custom' {
  const bundles: Record<Edition, [FontKey, Density, 'a' | 'b' | 'c']> = {
    editorial:  ['literary',     'comfy',   'a'],
    workbook:   ['editorial',    'regular', 'b'],
    cockpit:    ['hyperlegible', 'compact', 'c'],
  }
  const [f, d, l] = bundles[state.edition]
  if (state.font === f && state.density === d && state.drillLayout === l) {
    return state.edition
  }
  return 'custom'
}
```

## The surface — Edition Strip

### Placement

**Top-right of the running-head band** in `Page.tsx`'s
`RunningHeadBand`. The folio (`pp. 12 / 80`) moves OUT of the running
head and INTO the `StatusLine` at the bottom — page-count metadata
belongs in the vim-style mode line anyway.

```
┌────── running head ──────────────────────────────────────┐
│ HP · COACH · KVA       ◐  …palette…  ·  …edition…       │
└──────────────────────────────────────────────────────────┘
                           ↑
                           sits where folio used to live
```

### Visual treatment

All elements share the running head's typographic register: mono,
11px, `letter-spacing: 0.14em`, lowercase. Active-state indicator is
a 1px hairline under the word, exactly the word's width (mirrors the
folio glyph signature).

#### Mode glyph `◐`

- Single half-moon glyph at the typographic baseline
- `var(--muted)` default, `var(--ink)` on hover
- `◐` for light, `◑` for dark (or invert — pick whichever reads as
  "you're here" rather than "tap to go here")
- Click flips light/dark
- 14px gap to the next element

#### Palette strip `sand  sage  ink  rose`

- Four lowercase mono words
- 8px gap between words; no separator dots inside the group
- **Each word rendered in its own palette's accent color** so the
  picker SHOWS the palette via its typography:
  - `sand` → `oklch(0.61 0.13 42)` (warm tan)
  - `sage` → `oklch(0.55 0.06 145)` (muted green)
  - `ink` → `oklch(0.18 0.011 70)` (near-black)
  - `rose` → `oklch(0.62 0.14 5)` (rose pink)
- Active palette word gets a 1px hairline beneath, exactly word-width
- Hover lifts inactive words from `--muted` opacity to full color
  (preview of what they'd look like if active)

#### Group divider `·`

- Single mid-dot `·` in `var(--hairline)`
- 14px padding either side
- Separates palette group from edition group

#### Edition strip `editorial  workbook  cockpit`

- Three lowercase mono words
- 8px gap between words
- All in `var(--muted)` by default; active gets:
  - color flips to `var(--ink)`
  - 1px hairline beneath (same word-width signature)
  - `font-weight: 600`
- Hover lifts inactive word color to `var(--ink-2)`

#### Custom state `· egen`

When `getActiveEdition()` returns `'custom'`, append a fourth word:

```
editorial  workbook  cockpit  ·  egen
```

`egen` ("own") appears as the active word (with the under-rule),
colored `var(--muted)` (it's a *status*, not an *action* — distinct
from the three named editions that are styled like buttons).

**Palette has no `egen`** — palette is atomic; you're always exactly
on one of the four.

### Interaction

| Action | Trigger | Effect |
|---|---|---|
| Switch mode | Click `◐` glyph OR press `m` | Toggle light/dark |
| Switch palette | Click any palette word OR press `p` / `P` | Cycle forward/backward through sand → sage → ink → rose |
| Switch edition | Click any edition word OR press `e` / `E` | Cycle forward/backward through editorial → workbook → cockpit |
| Surgical divergence | Cmd+K → `font: literary`, `density: compact`, `drill layout: c` | Change one sub-axis; edition flips to `egen` |
| Re-snap to preset | Click any named edition word | Abandons `egen`, snaps to that bundle |

**Keyboard rules:** the single-letter shortcuts (`m` / `p` / `e`) only
fire when no input is focused (`document.activeElement?.tagName !==
'INPUT|TEXTAREA'`). Pressing them in an input field types the letter
normally. Shift-versions cycle backward.

### A11y

- Mode glyph: `<button aria-label="Växla till mörkt läge" aria-pressed={isDark} />`
- Palette words: `<button aria-label="Palette: sand (aktiv)" aria-pressed={active} />`
- Edition words: `<button aria-label="Edition: editorial (aktiv)" aria-pressed={active} />`
- `egen`: rendered as `<span>` (status, not interactive)
- Focus ring: existing 2px `var(--accent)` outline at 2px offset
- Tab order: mode → 4 palette words → 3 edition words

### First-time user

On first paint (no localStorage entry):

- Defaults to `mode: light` + `palette: sand` + `edition: editorial`
- Strip renders in the running head with no animation; the user
  encounters it peripherally while reading
- Click cost to recover from a wrong default = 1 (click any other word)
- No onboarding panel, no "pick your edition" gate, no modal

The discovery moment happens when the user notices the lowercase
mono words at the top-right while their eyes are mostly on the
prompt. Editorial chrome trains them to read those typographic slots
as metadata; the slot's affordance becomes self-evident.

## Brand restyle bonus

The `HP · COACH` wordmark in the running head restyles itself by the
active edition × palette combination. The picker's effect appears
3cm away from the picker itself, every click — instant feedback
without an animation.

| Edition | Wordmark font | Plus current palette accent |
|---|---|---|
| **editorial** | `var(--font-display)` — literary serif | accent tint on the `·` separators |
| **workbook** | `var(--font-display)` — editorial serif (chosen for engineering-notebook feel) | accent on `·` |
| **cockpit** | `var(--font-mono)` — JetBrains Mono | accent on `·` |

Three editions × four palettes = twelve distinct wordmark looks.
None of them is animated; the difference is visible at rest, every
moment.

## Implementation plan

### Phase 1 — state + dispatch

1. `app/src/lib/tokens.ts`
   - Add `EditionKey = 'editorial' | 'workbook' | 'cockpit'`
   - Add `EDITIONS: Record<EditionKey, EditionBundle>` table
   - Add `DrillLayoutKey = 'a' | 'b' | 'c'`
   - Extend `DEFAULT_THEME` with `drillLayout: 'a'` and `edition: 'editorial'`

2. `app/src/stores/uiStore.ts`
   - Add `drillLayout` and `edition` fields with setters
   - Add `setEdition(e)` that atomically writes `font + density + drillLayout`
     from the bundle table
   - Export `getActiveEdition(state): EditionKey | 'custom'` selector

3. `app/index.html` anti-FOUC inline script
   - Read `drillLayout` and `edition` from the persisted `hpc-ui` key
     so first paint matches saved state

### Phase 2 — drill route dispatch (the load-bearing piece)

4. `app/src/routes/drill.tsx`
   - Read `drillLayout` from `useUiStore()`
   - When `drillLayout === 'a'`: render `StyleA`
   - When `drillLayout === 'b'`: render `StyleB`
   - When `drillLayout === 'c'`: render `StyleC`
   - The current `StudyDesk` becomes the default but is dispatched as
     one of the three — TBD whether to map current to `'a'` (editorial)
     or retire it. Cleanest: A === current refined. Final call belongs
     in this PR.
   - Pass the same `question + picked + graded + onPick` props through

5. `app/src/components/session/SessionPlayer.tsx`
   - If currently builds `<StudyDesk>` directly, pull the variant
     selection up here

### Phase 3 — Edition Strip in chrome

6. `app/src/components/EditionStrip.tsx` (new)
   - Renders mode glyph + palette strip + edition strip + optional
     `egen` status, all per the visual spec above
   - Reads from `useUiStore()`; calls setters on click

7. `app/src/components/Page.tsx`
   - `RunningHeadBand`: replace `<Folio>` with `<EditionStrip>`
   - `StatusLine`: render folio (`pp. X / Y`) before the keyboard hints

### Phase 4 — keyboard

8. `app/src/components/EditionStrip.tsx` (or a hook)
   - `useEffect` mounting `keydown` listener on `window`
   - `m` / `p` / `P` / `e` / `E` handlers per § Interaction
   - Guard against input fields

### Phase 5 — Cmd+K palette

9. `app/src/components/CommandPalette.tsx`
   - Add three command groups:
     - **Edition**: `edition: editorial`, `edition: workbook`,
       `edition: cockpit`
     - **Palette**: `palette: sand` / `sage` / `ink` / `rose`
     - **Just this axis** (surgical): `font: literary` / `geometric` /
       `editorial` / `hyperlegible`; `density: compact` / `regular` /
       `comfy`; `drill layout: a` / `b` / `c`; `mode: light` / `dark`

### Phase 6 — wordmark restyle

10. `app/src/components/Page.tsx`
    - `RunningHeadBand` reads `edition` from store
    - Wordmark span (`HP · COACH · KVA`) sets `font-family` based on edition
    - `·` separator color tinted by current palette accent

### Phase 7 — sync + tests

11. `app/src/api/useSyncedPrefs.ts`
    - Extend synced shape with `drillLayout + edition`
    - Multi-device sync per PRD § 7

12. Tests
    - `EditionStrip.test.tsx` — renders three groups, click cycles each
      axis correctly, `egen` appears when diverged
    - `uiStore.test.ts` — `setEdition()` writes bundle atomically;
      `getActiveEdition()` returns `'custom'` on divergence
    - Update `responsive.spec.ts` if folio testid moves

### What stays

- `/dev` route stays as the power-tool surface. End-users aren't
  expected to find it; if they do, it works.
- `TweaksLauncher` floating button stays gated to dev mode.
- `CommandPalette` stays as the surgical surface for power moments.
- `tokens.ts` palette / font / density tables are unchanged; only the
  edition bundle is added.

## Estimated effort

Roughly 3.5 hours of focused work:

- Phase 1–2 (state + dispatch): 1 h. The drill route dispatch is the
  load-bearing piece; without it the picker does nothing visible.
- Phase 3 (`EditionStrip` component): 1 h. Three groups, careful
  visual treatment, hairline-under-word signature.
- Phase 4–5 (keyboard + Cmd+K commands): 30 min.
- Phase 6 (wordmark restyle): 20 min.
- Phase 7 (sync + tests): 40 min.

## Explicitly rejected

| Pattern | Rejected because |
|---|---|
| **`/settings` page** | Too far from the work; mid-session navigation is friction; the existing `/dev` panel already shows the form factor doesn't fit. |
| **Cmd+K alone as primary picker** | Discoverable only to power users; Beta-2 user with no muscle memory never finds it; PRD requires Cmd+K as a *complement*, not the sole surface. |
| **5-workspace flyout (morgon / djup studie / sen kväll / övning / cockpit)** | Mood names project user's psychological state into chrome; cardinality past self-evident cap; "diverged" state silently lies; flyout is settings-page in disguise. |
| **Mood-on-entry screen ("how are you feeling?")** | Adds a decision before work; hostile to ADHD-PI initiation energy; works for Calm, not for a coaching tool. |
| **Time-of-day adaptive theming** | Removes the agency the user explicitly built the 5-axis system to have; mid-session flips read as bugs, not features. |
| **Apple-Books-style `aA` button** | One button hiding 288 states behind a panel is just `/dev` in a popover; relocates the problem instead of solving it. |
| **Persistent swatch strip for *all* axes** | Scales beautifully for palette alone, becomes a toolbar at multiple axes, breaks editorial register. |
| **Auto-pick edition by section** (e.g., always cockpit for KVA) | Removes agency; every auto-switch is a "why did it change" event for ADHD-PI brains; possible future *suggestion* glyph, not an override. |
| **Saving custom workspaces by name** | Naming things is work; the honest `egen` status word is enough; if a custom config deserves a named slot, the user can edit the editions table in code. |

## References

- `app/src/stores/uiStore.ts` — current 5-axis store
- `app/src/lib/tokens.ts` — palette / font / density definitions
- `app/src/components/Page.tsx` — running head + status line
- `app/src/components/CommandPalette.tsx` — Cmd+K, PRD § 6.4
- `app/src/components/drill-variants/StyleA|B|C.tsx` — the three drill layouts
- `app/src/routes/dev.tsx` — power-tool surface (unchanged)
- PRD `.taskmaster/docs/prd.txt` § 5.10 (theme system) and § 7 (Clerk/sync)

## Naming note

The three editions ship as `editorial / workbook / cockpit` — the
working names from the variant bake-off. These are placeholders we
may rename later. Other candidates considered:

- `läs / räkne / natt` — Swedish; rejected because they project the
  user's mood into chrome
- `paper / notebook / terminal` — English; aesthetic-driven
- `slow / standard / fast` — work-rhythm framing

The placeholder convention reads as "edition" framing (typographic
editions of a textbook), which is the metaphor the picker is named
after. If we rename in a future PR, the store key `edition` and the
public-facing words are independent — only the picker labels + Cmd+K
command names need to change.
