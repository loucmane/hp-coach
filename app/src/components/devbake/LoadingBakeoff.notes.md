# LoadingBakeoff — theses, parameters, perf

Wave W1 round 2. Owner verdict on the shipped drying-ink treatment (D1 /
`InkDry.tsx`): **"i didnt get the drying ink feeling."** The static gray
impressions that fade to content read as a quieter skeleton, not ink. Three
competing loading-arrival languages, each on the same stage (a faithful
re-render of the DailyPlanCard surface with the product's `hpc-m3-*` classes +
an Öva counts row + a Framsteg ledger), replayable via "Ladda om ↻" at snabb
(300 ms) and långsam (2,5 s). Chips `L1/L2/L3` on `/dev/motion-bakeoff?dev=1`.

Note on the stage: the plan card is re-rendered with the product's own classes
rather than mounting the literal `DailyPlanCard`, because that component owns
the shipped InkSlot grammar internally — mounting it would demo D1's language
on all three chips. Content, chrome, and layout are identical to D1's stage.

## L1 · Bläckfläcken — the ink school

**Thesis.** The metaphor made literal: the placeholder is a soft blurred ghost
of the settled typography — real text shapes at low opacity + blur, perfectly
static — and arriving content sharpens into focus like ink bleeding into
paper. No skeleton grammar at all: what you wait for is the page itself, seen
through wet paper.

**Params.** Ghost: `blur(7px)` at opacity 0.38, static (ADHD law: a static
ghost is fine, an animated one is not). Sharpen: 640 ms, ease
`[0.3, 0.25, 0.25, 1]` — deliberately NOT the house reading ease
`[0.16, 1, 0.3, 1]`, which front-loads so hard the focus-pull was over in ~3
frames (verified on captured frames at 460 ms; the arrival read as a cheap
blur-fade). The milder curve keeps visible blur through the middle of the
tween, which is what sells "coming into focus". The ghost→real glyph swap
happens on the first frame of the sharpen, at full blur — invisible, no
shimmer. Ghost strings are placeholder glyphs of matching length (what
production would use), so nothing depends on knowing the data beforehand.

**Perf (the blur question).** `filter: blur()` promotes each element to its
own compositor layer, but animating the radius re-rasterizes the layer every
frame — cost scales with painted area. Discipline: blur lives on many small
line boxes, never one card-sized surface; radius capped at 7 px; `willChange:
filter` pins the layers (product usage should drop the hint after settle).
Measured on this stage via rAF frame deltas across the whole sharpen window
(headless Chromium, 1280×960, `scripts-dev/capture-loading.mjs` probe):
**86 frames, avg 16.44 ms, max 16.8 ms, 0 frames over 24 ms** — a clean 60 Hz
through the entire arrival. Do not scale this treatment to full-viewport
surfaces without re-measuring.

## L2 · Skriften — the pen school

**Thesis.** Before data, almost nothing: a faint baseline rule per line, a
ruled sheet waiting. When data lands the content writes in — per-line
clip-path wipes left→right on a short top-to-bottom cadence, Bläcket's
drawn-mark grammar applied to arrival. The page is not loaded; it is written.

**Params.** Real content is always in flow, fully clipped while waiting
(`inset(-8% 108% -8% -8%)` → `inset(-8% -8% -8% -8%)`; the 8 % over-scan
protects italic overhangs and descenders) — honest dimensions, zero jump.
Wipe: 380 ms, ease `[0.38, 0.05, 0.5, 1]` (near-linear with a soft landing —
the house reading ease made the wipe read as a snap, not a hand travelling
the line). Cadence: 70 ms per line, indices threaded top-to-bottom across the
stage (13 lines → last line starts ~840 ms after data). Baseline rule lifts
(90 ms, exit ease) as its line is written. Trade-off named honestly: the full
write-in costs ~1.2 s after data lands — at snabb the ceremony outlasts the
query several times over.

## L3 · Vita arket — the blank-paper school

**Thesis.** The anti-skeleton position: no placeholders. Honest reserved
space (the settled layout at opacity 0 — nothing jumps), calm empty paper
under real chrome; when data lands the whole block arrives in ONE composed
beat — a single tork, zero per-element stagger. Nothing until ready, then
instant and calm (the Linear school).

**Params.** One beat: 260 ms opacity, reading ease, identical transition and
zero delay on every frame on the stage so the arrival reads as one composed
event, not a sequence. Reserved space in the demo is the settled layout at
opacity 0; production reserves with known min-heights. No settle transform —
pure opacity keeps the position honest (any per-element choreography would
concede the argument to the other schools).

## Shared laws (all three)

Nothing loops/pulses/shimmers ever; reduced motion → instant swap (every
transition collapses to duration 0 via `useArketMotion`); transform / opacity
/ filter / clip-path only; zero layout jump; accent pixels only where they
already live; all beats state-driven (`ready` flips, `initial={false}`
everywhere — the K-chips' pattern, so RouteScene's mount suppression has
nothing to suppress); Swedish product strings.

## How the frames were made

`node scripts-dev/capture-loading.mjs` from `app/` with vite on :5193 and the
saved Clerk storageState. Frames in `screenshots-loading/`:
`{l1,l2,l3}-{snabb,langsam}-<offset>ms.png`, offsets measured from the
"Ladda om" click (latency 300 / 2500 ms — frames after the latency mark are
the arrival). The script ends with the L1 rAF perf probe quoted above.
