# Design-system conventions (Boksidan, 2026)

These are standing rules for the HP-Coach UI after the 2026 redesign bake-off. The chosen
direction is **M3 "Boksidan"** — F·Axis's hairline margin-rail chassis carrying L12's
editorial typesetting — on the **Spalt** palette (L12's ivory + cobalt). The live mockup
of record is `/redesign-l12?dev=1&v=3` on the `redesign-bakeoff-2026` branch.

## 1. Colour encodes meaning

**Cobalt `--accent` is for STRUCTURE only.** Use it for the page's wayfinding and identity:
mono margin labels (TEXTEN / UPPGIFTEN / PÅSTÅENDEN / UNDERLAGET / FRÅGAN / VÄLJ SVAR /
UTFALL), serif step numerals, the tactic block, and framework deep-links. Never use the
accent to signal correctness.

**Grading is STATE → use the semantic tokens.** The graded moment is the highest-value
information in the drill, so it carries semantic colour:

- correct → `--ok` (green): the "Rätt." verdict **and** the chosen option row.
- wrong → `--bad` (red): the "Fel." verdict **and** the picked option row.

Render the verdict as **L12's italic serif ink** in the semantic colour — green/red *ink*,
not a badge or a pill. It enters with a calm left-aligned draw at the picked row (no
scale/blur stamp, no auto-advance — pacing stays with the student).

Rationale: overloading cobalt to also mean "correct" muddies both identity and feedback.
Keeping the accent for structure and a separate semantic pair for state gives an ADHD-PI
daily driver an instantly glanceable right/wrong signal while preserving the editorial
identity. (Owner decision, 2026-06-12.)

## 2. Spalt is the default palette

`DEFAULT_THEME.palette = 'spalt'`. Spalt is a first-class token palette (light + a
night-ink dark with the cobalt at lamp strength) alongside sand / sage / ink / rose. All
surfaces are token-bound, so they respond to the live palette + dark switchers.

## 3. The figure viewer

`QuestionFigure` (the production DTK/SVG figure component) is a document-style zoom/pan
viewer: opens fit-to-page, native wheel/trackpad scroll, drag-to-pan, pinch + ± buttons to
zoom, rotate for sideways scans, rendered through a portal so variant CSS can't bleed in,
and the page floats on a soft shadow (no card frame).
