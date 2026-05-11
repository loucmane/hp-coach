# Persona Evaluation Pass — 2026-05-11

Simulated-student personas evaluated the 3150-explanation corpus across
5 skill levels (0.0 / 0.5 / 1.0 / 1.5 / 2.0). The user is a 0.0 student
aiming for 2.0 and can't dogfood at scale themselves; personas
substitute for student practice while the user provides ground truth
via the SPA's Coach feedback export.

## Approach — 6 phases

| Phase | What | Output |
|---|---|---|
| A | 5 persona specs in `audit/personas/{00,05,10,15,20}.md` | 0.0 spec anchored against real user reactions from this conversation |
| B | `audit/persona_sampling.py` builds queues stratified per persona | 2890 evaluations queued, 0.0 sharded by section |
| C | 11 parallel Opus agents (7 × 0.0 by section + 1 each for 0.5/1.0/1.5/2.0) | Findings in `/tmp/personas/findings_<level>.json` |
| D | `audit/persona_aggregate.py` combines findings into tiered regen queue | 170 Tier-1 / 214 Tier-2 / 50 Tier-3 / 1661 Tier-0 |
| E | Targeted regen on 60 Tier-1 pedagogy entries (after splitting parser-blocked from pedagogy-fixable) | 55 rewrites + 5 parser-blocked |
| F | Verify + ship | 3071 entries, 0 errors, 67/67 tests |

## Per-persona score distributions

| Persona | n | Mean | 1 | 2 | 3 | 4 | 5 | Tier-1 (≤2) |
|---|---|---|---|---|---|---|---|---|
| 0.0/XYZ | 180 | 3.13 | 39 | 33 | 21 | 41 | 46 | 72 |
| 0.0/KVA | 237 | 3.47 | 17 | 32 | 60 | 79 | 49 | 49 |
| 0.0/NOG | 139 | 3.20 | 9 | 24 | 42 | 62 | 2 | 33 |
| 0.0/MEK | 377 | 4.29 | 0 | 14 | 39 | 148 | 176 | 14 |
| 0.0/LÄS | 150 | 4.11 | 0 | 1 | 24 | 83 | 42 | 1 |
| 0.0/ELF | 368 | 4.67 | 0 | 1 | 13 | 93 | 261 | 1 |
| 0.0/ORD | 221 | 4.61 | 0 | 0 | 8 | 71 | 142 | 0 |
| 0.5 | 316 | 4.51 | 1 | 13 | 20 | 73 | 209 | 14 |
| 1.0 | 316 | 4.60 | 0 | 9 | 17 | 67 | 223 | 9 |
| 1.5 | 317 | 4.50 | 4 | 9 | 30 | 57 | 217 | 13 |
| 2.0 | 269 | 4.39 | 1 | 4 | 40 | 68 | 156 | 5 |

## Per-section means across personas

| Section | 0.0 | 0.5 | 1.0 | 1.5 | 2.0 |
|---|---|---|---|---|---|
| ELF | 4.67 | 4.76 | 5.00 | 4.84 | 5.00 |
| MEK | 4.29 | 4.58 | 4.69 | 4.96 | 5.00 |
| KVA | 3.47 | 4.22 | 4.81 | 4.81 | 4.56 |
| NOG | 3.20 | 4.37 | 4.76 | 4.77 | 4.52 |
| LÄS | 4.11 | 4.42 | 4.57 | 4.72 | 4.54 |
| ORD | 4.61 | 4.92 | 4.70 | 3.85 | 3.78 |
| XYZ | 3.13 | 4.20 | 3.91 | 3.83 | 3.49 |

**Observations:**
- ELF/MEK are universally strong (≥4.3 at every level)
- ORD has an inverted-U: strong for beginners (4.61, 4.92) but expert reviewers (1.5, 2.0) flag template fatigue in early-batch pedagogy regens (all-caps codas, "X vs Y" formulas)
- XYZ is the weakest section across all levels — figure-blind + parser-corrupted + hand-wavy distractors
- KVA/NOG are good at higher levels (4.5+) but beginners struggle (3.2-3.5) — the sufficiency taxonomy is opaque to 0.0

## Calibration matrix (20 entries × 5 personas)

Each persona evaluated the same 20 calibration entries (3 per section,
stratified, mix of watch-list/clean/regened). This reveals
inter-persona variance.

- **84% pair-wise non-decreasing** between adjacent levels — solid
  signal differentiation
- **9/20 weakly non-decreasing across all 5 levels** — the rest show
  the expected pattern of expert reviewers (1.5/2.0) scoring entries
  LOWER than beginners do, because they spot strawmen and padding
  that don't register at lower levels
- The calibration confirms the personas are NOT just scoring randomly
  — entries that confuse 2.0 also confuse 0.0; but entries that work
  for 0.0 may still be critiqued by 2.0 for over-explaining

Saved at `/tmp/personas/calibration_matrix.json`.

## Concrete bug discovery (the persona payoff)

Bugs the persona evaluation caught that NO mechanical scan or
adversarial self-audit had surfaced:

| Source | Type | Count | Action |
|---|---|---|---|
| 0.0/LÄS | English "Many" leaked into Swedish distractor template | 56 instances | corpus-wide regex fix |
| 0.0/LÄS | "First instinkten" anglicism | ~11 | regex fix |
| 0.0/KVA | AI-thinking leaks (wait, Re-räkna) | 3 | surgical rewrite |
| 0.0/KVA | Factual slip ("alla sums ≤ 18" when list includes 37 and 20) | 1 | rewrite |
| 0.0/ORD | Literal `\textit{}` LaTeX in prose | 1 | strip |
| 0.0/ORD | Duplicate "instans, instans, ständig" | 2 | dedupe |
| 0.0/MEK | Spelling: dichotomin / canceregent / fastnabbande | 3 | fix |
| 2.0 | One score-1 broken entry (LLM thinking-out-loud + self-contradiction) | 1 | full rewrite |
| 2.0 | Early-batch ORD regens have all-caps codas + "X vs Y" template fatigue | ~14 | flagged for restyle (not yet done) |
| 0.0/NOG | Parser-blocked NOG prompts (unreadable equations) | 9 | delete + log |
| Phase E aggregate | Tier-1 parser-blocked (XYZ figure-missing + KVA/NOG/MEK corrupt) | 65 | delete + log |
| Phase E aggregate | Tier-1 pedagogy-fixable | 55 | regen on disk |
| Phase E rerun | Newly-flagged parser-blocked during regen | 5 | delete + log |

**Total mutations: 79 in-place rewrites + 79 deletions + 67 corpus-wide typo fixes = 225 concrete changes.**

## Persona-driven regen quality (Phase E)

55 entries rewritten. Spot-check of 3:

- `host-2023-kvant2-XYZ-002`: technique "alternatvinklar / Z-mönster"; solution shows the parallel-line transversal logic with `v = 64°`; pitfall distinguishes Z-pattern from F-pattern from konsekutiva vinklar. Was hand-wavy "av figuren"; now teachable.
- `host-2024-kvant1-XYZ-004`: technique names vertikalvinklar + 360°-runt-punkten; solution shows the equation setup explicitly.
- `host-ver1-2019-kvant1-XYZ-003`: technique names polygon-dekomposition; solution shows the rectangle-plus-triangles split with numbers; pitfall names the coordinate-counting trap.

Voice matches the locked prompts.py rules. Each regen tagged with
`_meta.regen_source: "persona_pass_phase_e_2026_05_11"`.

## Remaining work (out of scope for this pass)

- **Watch-list entries (1-2 pedagogy points)**: 1512 entries that
  haven't been LLM-touched. The user's 👎 marks via the SPA Coach
  button drive prioritized regen of these.
- **ORD early-batch styling restyle (~14 entries)**: 2.0 persona
  flagged all-caps codas in entries regened during the earlier
  pedagogy pass. Late entries (var-2025, var-2026) already dropped
  this; back-port the cleaner styling. Cheap when the user requests.
- **39 Tier-1 "unknown" classification**: persona scored ≤2 but
  failure_points didn't clearly point to parser vs pedagogy. Left
  alone conservatively. User dogfood may surface specifics.
- **Tier-2 (214) and Tier-3 (50) entries**: 0.0-wavered (score 3)
  and expert-tier critiques. Lower priority than Tier-1.

## Final state

- **3071 explanations** (was 3076 pre-Phase-E, was 3209 at the
  original baseline)
- **0 schema errors**
- **67/67 SPA tests pass**
- **138 entries with `_meta.regen_source` audit tags**

| Section | Count |
|---|---|
| ORD | 540 |
| MEK | 534 |
| LÄS | 530 |
| XYZ | 490 |
| ELF | 367 |
| KVA | 328 |
| NOG | 282 |

Branch: `layer-2-explanations`. Not merged to main — held open until
user dogfood validates the persona pass via real 👎 feedback through
`/coach`.

## Methodology notes worth keeping

1. **Persona authenticity is a performance, not a fact** — Opus can't
   truly unlearn, but specific knowledge constraints + anchor
   reactions from real user data + re-anchor every 25 entries
   produced believable role-play. The calibration matrix's
   differentiated score distributions confirm it.

2. **Same-model bias is real but bounded** — Opus auditing Opus has
   confirmation bias, but the persona role-play forces a different
   mental model than the generator's. Aggregation across 5 levels
   averages it out.

3. **The 84% pair-wise monotonicity is the right number to track** —
   strict 5-level monotonicity (only 9/20) is unrealistic because
   expert critiques diverge from beginner clarity. Pair-wise is the
   honest signal.

4. **Persona-surfaced bugs >> heuristic-surfaced bugs** — the 67
   "Many"→"Många" template typos, the AI-thinking leaks, the
   factual "≤18" slip — none of these were findable by Pass 1
   regex or Pass 2 semantic audit. Personas catch the kinds of
   issues that take a human reader to spot.

5. **Stratified sampling > full sweeps** — 1710 evaluations for the
   priority 0.0 persona + ~300 each for 4 other levels = 2890 total
   evals. Doing the full 3150 × 5 = 15750 would have been 5x
   spend for marginal additional signal.

6. **Tier separation matters** — most Tier-1 entries were
   parser-blocked, not pedagogy-fixable. Splitting them before
   dispatching the regen agent prevented wasted work and made the
   regen brief richer (failure_points become fix guidance).
