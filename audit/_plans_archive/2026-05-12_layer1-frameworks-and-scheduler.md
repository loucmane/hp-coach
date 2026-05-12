# Plan — Layer 1 frameworks + curriculum scheduler design doc

## Context

The trajectory simulation thread closed (5 commits shipped, corpus
validated, 12 parser bugs patched, methodology proven). The natural
next work is unblocking Layer 3 — the adaptive layer that turns the
existing drill/repetition loop into a real curriculum.

PRD § 5.5 closes with: *"`docs/curriculum-scheduler.md` is written
**before** Phase 3 coding begins. The scheduler is the product's
hardest single problem; architectural decisions are made on paper,
not in real time."* That doc doesn't exist yet (§ 9.1 confirms).

**Discovery during planning:** the scheduler reads Layer 1 framework
IDs (`KVA-NEG-001`, `ORD-ROOT-CURR`) to identify clusters and tag
mistakes. None of those framework JSON files exist yet (per PRD § 5.3
schemas) — they're prerequisites for a clean scheduler design.

**Decision (locked):** author the frameworks FIRST (~5-7 days,
LLM-assisted from the existing 3071 explanations), THEN write the
scheduler design doc. The doc becomes ~30% shorter and far more
concrete because it can reference real cluster IDs that exist on
disk rather than degrading gracefully to section-level fallbacks.

This matches the PRD's own phase ordering — § 8 puts Layer 1
framework authoring in weeks 2-6, before the scheduler in Phase 3.

The doc itself is **not code**. It's the architectural contract that
the eventual Phase 3 implementation translates mechanically.

## What we're producing (two deliverables, in order)

### Deliverable 1: Layer 1 framework JSONs (Phase 0, ~5-7 days)

8 JSON files under `frameworks/`, one per section, populated mostly
via LLM-assisted extraction from existing explanations:

| File | Purpose | Est. entries | Source signal |
|---|---|---|---|
| `frameworks/ord_roots.json` | Greek/Latin/Germanic word roots | ~187 | ORD explanation `technique` fields + morphology |
| `frameworks/kva_traps.json` | KVA comparison-trap patterns | ~30-50 | KVA explanation `pitfall` + `technique` |
| `frameworks/nog_traps.json` | NOG sufficiency-trap patterns | ~20-30 | NOG explanation `pitfall` + `technique` |
| `frameworks/xyz_traps.json` | XYZ algebra-trap patterns | ~40-60 | XYZ explanation clusters (already partly known from trajectory's high-leverage catalog) |
| `frameworks/mek_protocol.json` | MEK syntactic + semantic rules | ~10-20 | MEK explanation clusters |
| `frameworks/las_taxonomy.json` | LÄS question-type taxonomy | ~6-8 types | LÄS prompt patterns |
| `frameworks/elf_taxonomy.json` | ELF question-type taxonomy | ~6-8 types | ELF prompt patterns |
| `frameworks/dtk_tactics.json` | DTK tactics catalog | ~10-20 | inferred from prompts (no Layer 2 to leverage) |

Total: ~300 framework entries across 8 files. Each entry has a stable
ID per PRD § 5.1.6 (e.g. `KVA-NEG-001`).

**Authoring approach per section:** a `pipeline/frameworks/extract.py`
script does a corpus scan, an Opus agent clusters and proposes IDs +
descriptions, I review the output. This was the same loop pattern that
worked for the persona pass and the trajectory pass.

### Deliverable 2: Scheduler design doc (after Phase 0)

`docs/curriculum-scheduler.md` (~500-600 lines, shorter than the
original 800 estimate because graceful-degradation is no longer
needed). A single markdown document, no code. Defines inputs,
outputs, algorithm, data contracts, edge cases, and verification
approach for the rules-based MVP scheduler (F5.5.1-6).

### Secondary artifact (small, done first): `audit/trajectory/_original_plan.md`

Copy of the previous trajectory-simulation plan (was at
`~/.claude/plans/hashed-twirling-zephyr.md`, embedded in this plan's
appendix below for preservation). User wants it kept alongside the
trajectory findings rather than discarded with the overwrite.

## Phase 0 detail — framework-authoring loop

For each section, the same loop pattern (mirrors the persona-pass and
trajectory-pass loops that already worked):

1. **Scan**: a small Python script extracts candidate signals from the
   corpus. For ORD: word stems via morphology heuristics. For
   KVA/NOG/XYZ/MEK: cluster `technique` + `pitfall` strings via
   embedding similarity or keyword overlap. For LÄS/ELF: prompt-type
   patterns. Output: a candidates list per section.

2. **Cluster & label**: dispatch an Opus agent with the candidates +
   the relevant PRD section + corpus examples. Agent returns
   structured JSON entries with IDs, descriptions, example qids.

3. **Review**: I (the dev) read the proposed entries, sanity-check the
   IDs against the trajectory's high-leverage catalog (which I already
   know is real), reject anything that's hand-wavy.

4. **Commit**: framework JSON lands in `frameworks/` (committed unlike
   `data/parsed/` which is gitignored). Stable IDs from this point on.

Sequencing: ORD first (largest, most mechanical, partly extractable
from existing explanations). Then KVA + NOG in parallel (already
prominent in the trajectory's high-leverage list). Then XYZ (biggest
trap surface but well-understood). MEK/LÄS/ELF in parallel after.
DTK last (no Layer 2 to leverage; smallest framework).

Verification per framework: spot-check that 10 random mistakes in
that section can each be tagged with at least one framework ID. If
< 80% taggability, the framework is too sparse and needs more entries.

## Design-doc structure (sections of `curriculum-scheduler.md`)

1. **Problem statement** — what the scheduler decides, what it does not
2. **System context** — where it sits between Layer 1 (frameworks),
   Layer 2 (explanations), Layer 3 (this layer), and the SPA's drill +
   repetition engines that already exist
3. **Data contracts** — exact schema for every table read/written:
   `framework_progress`, `mastery`, `srs_state`, `mistakes`, `attempts`,
   `users`. With field types, query patterns, and the canonical SQL
   used by each scheduler step
4. **The 5-state cluster state machine** — `untaught → learning →
   practicing → retaining → mastered`, with all 4 transition rules
   verbatim from PRD § 4 Screen 5 + the additional edge cases
   (regression: how does a cluster move *back* to learning if accuracy
   collapses?)
5. **The prioritization algorithm** — F5.5.1 made concrete:
   a. Pattern-repetition trigger (mid-session interrupt + planning bias)
   b. Due SRS items
   c. Weakest-mastery section (which clusters within it)
   d. Recent errors from mistake queue
   With explicit tie-breaking when multiple inputs compete
6. **Time-budget packing** — given 10/20/40/60 min total, how segments
   are sized and ordered. Includes minimum segment length (5 min,
   per ADHD-PI cognitive-switching cost), maximum segment count, and
   what to do when total budget < minimum segment
7. **Cold-start ordering** — F5.5.6 made concrete. The prerequisite
   graph between sections (ORD-roots → ORD-vocab; XYZ-algebra-refresher
   → XYZ-problem-solving → KVA → NOG) and within-section difficulty
   ascending
8. **Diagnostic seeding** — how Screen 2/3 results initialize
   `framework_progress` and `mastery` rows. Per § 5.10.5,
   `diagnostic-pending-review` mistakes stay tagged until section
   onboarding completes
9. **Pattern-repetition trigger** — § 3.3 / § 5.9.3 / Screen 9. When
   does it fire (3 errors on same Layer 1 ID within 7 days), how does
   it interrupt the current session, what does the targeted review
   look like (5 min, mini-lesson + 5 questions on that ID)
10. **Block-vs-interleaved mode rules** — F5.5.4. Block during `learning`
    and `practicing`; interleave only `retaining` clusters with each
    other in the same session. Concrete interleaving strategy: alternate
    by cluster, not by question
11. **Pseudocode walkthrough** — full `plan_session(user_state,
    time_budget) -> [segments]` function in TypeScript-ish pseudocode,
    so Phase 3 implementation is mechanical translation
12. **TypeScript type definitions** — the `Segment`, `ClusterState`,
    `SchedulerInput`, `SchedulerOutput` types that the Phase 3 code
    will import
13. **Edge cases** — what happens when:
    - Brand-new user, no diagnostic yet (Screen 1 → first session)
    - All clusters in section are `mastered`
    - No SRS due, no recent mistakes, all sections at retaining
    - User returns after 30+ days inactive
    - Time budget < 5 min
    - `learning` mode is requested but lesson content for that
      cluster isn't authored yet (Phase 1.5 workstream is upstream;
      cluster stays in `untaught` until lessons land)
14. **Verification approach** — 5 concrete user-state fixtures with
    expected scheduler outputs. These become the unit tests for the
    Phase 3 implementation
15. **Out of scope** — ML-adaptive scheduling (post-MVP),
    multi-device sync of partial-session state (worker handles that),
    content authoring (separate workstream per § 3.4)

## Critical design decisions to lock IN the doc

These are PRD-ambiguous and need to be resolved on paper before code.
My recommendation in **bold** for each.

1. **`framework_progress.status`: stored state vs derived view?**
   - PRD § 5.14 lists `last_transition_at` as a field → implies stored.
   - **RECOMMEND: stored state with explicit transitions.** Cleaner audit
     trail; survives bad-data recovery; matches the spec literally.

2. **Time-budget packing: sequential-fill vs proportional?**
   - Sequential: F5.5.1 priority order, fill until budget exhausted
   - Proportional: e.g., 20% SRS / 50% weakest / 30% mistakes
   - **RECOMMEND: sequential with minimum-segment-floors.** SRS first
     until empty or 30% of budget cap, then weakest until 70% of
     budget, then mistakes fill the tail. Caps prevent SRS from
     eating the whole session when many cards are due.

3. **"Weakest mastery": which metric?**
   - Lowest section-average `mastery.score`?
   - Most recent-mistakes? Most untaught clusters?
   - **RECOMMEND: section with lowest average `mastery.score` across
     all its non-mastered clusters.** Falls back to "section with
     most untaught clusters" if user has no mastery data yet.

4. **Recency window for `practicing → retaining` transition**
   - PRD says "≥80% on most recent 10 blocked-drill questions"
   - But: if user did 10 questions a month ago, does that still count?
   - **RECOMMEND: 10 most-recent attempts AND latest attempt ≤ 14
     days old. If older, attempts decay (de-weighted, eventually
     forces re-practice).**

5. **Pattern trigger: planning bias vs only mid-session interrupt?**
   - PRD § 3.3: "Interrupts the normal session and runs a targeted
     review"
   - But: should it also bias the next day's planning?
   - **RECOMMEND: both.** Trigger fires mid-session AS the PRD says,
     AND clusters with recent triggers get +1 priority in the next
     planning pass for 7 days.

6. **Cold-start prerequisite graph**
   - PRD examples: "ORD roots before vocabulary; algebra before XYZ"
   - **RECOMMEND a concrete graph in the doc:**
     - ORD: `ord_roots → ord_vocab`
     - XYZ: `xyz_algebra_refresher → xyz_linear → xyz_quadratic → xyz_geometry → xyz_combinatorics`
     - KVA depends on `xyz_algebra_refresher`
     - NOG depends on `xyz_algebra_refresher`
     - MEK, LÄS, ELF, DTK: no cross-section prereqs
   - These are bootstrap orderings; once user has performance data,
     mastery scores override

7. **(Deferred / no longer applicable)** — Phase 0 authors all 8
   framework JSONs before the design doc starts, so the doc assumes
   frameworks exist. The "section-level fallback" mode is dropped.
   If a Phase 0 framework lags for any reason, that section's
   scheduler behavior is "stay in untaught until framework arrives."

## Files

**New (Phase 0 — frameworks):**
- `frameworks/ord_roots.json` — ~187 Greek/Latin/Germanic roots
- `frameworks/kva_traps.json` — ~30-50 comparison-trap patterns
- `frameworks/nog_traps.json` — ~20-30 sufficiency-trap patterns
- `frameworks/xyz_traps.json` — ~40-60 algebra-trap patterns
- `frameworks/mek_protocol.json` — ~10-20 syntactic/semantic rules
- `frameworks/las_taxonomy.json` — ~6-8 question-type taxonomies
- `frameworks/elf_taxonomy.json` — ~6-8 question-type taxonomies
- `frameworks/dtk_tactics.json` — ~10-20 tactics
- `pipeline/frameworks/extract.py` — scan + cluster utility (one
  module with per-section functions)
- `pipeline/frameworks/prompts.py` — Opus agent prompts for each
  section's framework synthesis
- `pipeline/frameworks/schema.py` — Pydantic schema validation per
  framework type
- `pipeline/frameworks/README.md` — how to re-author or extend a
  framework

**New (Phase 1 — design doc):**
- `docs/curriculum-scheduler.md` — the design doc, primary artifact

**New (small, done immediately):**
- `audit/trajectory/_original_plan.md` — copy of the old trajectory
  plan (extracted from the appendix below)

**Read-only references during drafting:**
- `.taskmaster/docs/prd.txt` — especially §§ 3.3, 4 (Screen 4-9),
  5.5, 5.8, 5.9, 5.10, 5.14, 9.13, 5.3 (framework schemas)
- `worker/src/db/schema.ts` lines 74-146 — actual current schema
  with `framework_progress`, `mastery`, `mistakes.layer1Ids`
- `app/src/screens/HomeMobile.tsx`, `routes/drill.tsx`,
  `routes/repetition.tsx` — what the scheduler must drive
- `app/src/api/hooks/useMistakes.ts`, `useSessions.ts`,
  `useStats.ts` — the data-plane handles already in place
- `app/src/components/session/SessionPlayer.tsx` — the segment
  consumer
- `data/explanations/*.json` — source signal for framework
  extraction (Phase 0 inputs)

## Verification

### Phase 0 (frameworks) verification

For each section's framework JSON:
- Spot-check: pick 10 random mistakes (or 10 random questions) in
  that section, attempt to tag each with at least one framework ID.
  ≥ 80% taggable → framework is dense enough. < 80% → add entries.
- ID stability: IDs follow `{SECTION}-{KIND}-{NNN}` pattern, never
  reused, never renumbered. Adding a new entry appends to the list.
- Schema: each framework validates against its Pydantic schema in
  `pipeline/frameworks/schema.py` (no missing fields, no malformed
  example_questions, etc.)
- Coverage: the trajectory's high-leverage entry catalog (already in
  `audit/trajectory/_v3_findings.md`) names ~19 specific techniques
  per the v3 run. Each of those techniques should map to a framework
  ID. If not, the framework is missing a known-relevant entry.

### Phase 1 (design doc) verification — walk 5 fixtures end-to-end

1. **Brand-new user, post-diagnostic** — Screen 1 completed,
   diagnostic delivered scores (e.g. ORD 12/40, MEK 5/20, LÄS 8/20,
   ELF 6/20, full quant on Day 2). Time budget: 20 min. Expected:
   onboard to weakest section (MEK), serve lesson cards.

2. **Day 14, mid-curriculum** — User has 3 clusters in `learning`,
   8 in `practicing`, 2 in `retaining`. 5 SRS cards due. 2 mistakes
   from yesterday. Time budget: 30 min. Expected: clear SRS (≤9 min),
   continue weakest `practicing` cluster (≤15 min), interleaved
   retention (remaining ~6 min).

3. **Pattern-trigger fires** — User makes a 3rd error on
   `KVA-NEG-001` mid-drill on Day 21. Expected: drill interrupts,
   5-min adaptive review serves, then drill resumes from where it
   left off. Next day's planning bias adds `KVA-NEG-001` to
   prioritized drill set for 7 days.

4. **30-day return** — User last active 32 days ago, had 5 clusters
   at `retaining`. Expected: recency-decay forces a fraction of those
   back to `practicing`; scheduler runs a re-warmup pass.

5. **Lesson content not yet authored** — User's scheduler wants to
   serve `learning` mode for `XYZ-ALG-REFRESHER-12` but lessons for
   that cluster don't exist in the lesson DB yet. Expected: cluster
   stays in `untaught`, scheduler picks another cluster, doesn't
   crash, logs the gap for the content workstream.

Each fixture is written out with: input state JSON → algorithm trace
→ output segments. These become test fixtures for the Phase 3 coder.

A reader (you) should be able to predict output from input by reading
the doc. If the algorithm leaves room for "depends on coder's
judgment," the doc has failed.

## Risks

### Phase 0 (framework authoring)

1. **Framework IDs churn** — IDs need to be STABLE because mistakes
   are stored with them. If we re-number `KVA-NEG-001` to `KVA-NEG-005`
   later, historical mistakes break. Mitigation: IDs are stamped on
   first author and never renumbered. Adding new entries appends. The
   schema enforces append-only.

2. **Over-clustering or under-clustering** — too few clusters means
   the scheduler can't distinguish trap variants; too many means
   sparse mastery data per cluster. Mitigation: the trajectory's
   high-leverage list (already in the repo) gives a known-good
   resolution to aim for. Spot-checks via the 80% taggability test.

3. **LLM hallucinates patterns** — Opus may invent a "trap" that
   doesn't actually appear in the corpus. Mitigation: every framework
   entry requires `example_questions: [qid]` with ≥3 real qids that
   exhibit the pattern. If the agent can't cite 3 real qids, the
   entry gets rejected.

4. **DTK framework is speculative** — no Layer 2 explanations exist
   for DTK so we're inferring tactics from question structure alone.
   Mitigation: keep DTK framework minimal (~10 entries); flag as
   "v0, expand when Layer 2 DTK lands."

### Phase 1 (design doc)

5. **Over-specifying** — design doc becomes a 2000-line monster that
   nobody reads. Mitigation: hard cap at 600 lines; pseudocode > prose;
   defer non-MVP concerns to a future doc.

6. **Under-specifying** — leaves coder with ambiguities. Mitigation:
   the 5 fixtures force concreteness; if I can't generate the right
   output from input by reading the doc, the doc is incomplete.

7. **Premature optimization** — designing for ML adaptation when MVP
   isn't shipped. Mitigation: scope explicitly excludes adaptive ML
   (out-of-scope section).

8. **Drift from PRD** — design doc proposes something the PRD didn't
   sanction. Mitigation: every section cites the PRD lines it derives
   from. Where it goes beyond, it says so explicitly.

## Out of scope for this design doc

- ML-adaptive scheduling (item-response theory, knowledge tracing) —
  post-MVP, separate doc
- Multi-device session resume (handled by `sessions.position` in
  schema, no scheduler involvement)
- Content authoring (Phase 1.5 workstream per § 3.4)
- DTK pipeline (Layer 2 doesn't exist yet)
- Frontend rendering of segments (drill/repetition engines already
  consume them)
- Notification scheduling (push, calendar) — separate Layer 3.5 doc

## How this changes the project

After Phase 0 (frameworks):
- Mistakes can be auto-tagged with Layer 1 IDs in the explanation
  regen pipeline — closes a known gap (per Explore findings, the
  `mistakes.layer1Ids` field is in the DB schema but always empty)
- The trajectory simulation's high-leverage entries each map to a
  concrete framework ID, which makes "voice anchors for regen" a
  mechanical operation
- Per-cluster state tracking becomes possible (currently the
  `framework_progress` table is defined but unused)

After Phase 1 (design doc):
- Phase 3 scheduler implementation is mechanical translation, not
  design
- The "Fortsätt" button on Screen 4 graduates from a static link to
  `/drill` into the centerpiece of the daily UX
- Pattern-repetition triggers fire on real Layer 1 IDs, not
  placeholders
- The trajectory pass becomes the regression check for whether the
  scheduler's outputs actually teach (re-running it after the
  scheduler ships measures end-to-end product effectiveness)

Total timeline: ~7-10 working days for both deliverables, then
Phase 3 (scheduler code) is unblocked.

## Appendix: Previous plan (preserve before overwrite)

The previous plan file was the trajectory-simulation design doc
(now shipped — 5 commits, methodology validated, 5 reports + 3
findings docs + README in the repo). User requested it be preserved
in the repo at `audit/trajectory/_original_plan.md` so the original
design intent lives alongside the outcomes. Implementation step 1:
extract the content below to that path.

````markdown
# Plan — Automated 0.0 → 2.0 student trajectory simulation

## Context

Every audit pass so far has measured the corpus along ONE axis at a
time:
- **Correctness** (Pass 2): is each entry mathematically/textually right?
- **Heuristic pedagogy** (`audit/pedagogy_scan.py`): do entries follow the locked
  prompt rules?
- **Persona evaluation** (just shipped): does each entry work for skill
  level X?

What's missing: **integrated curriculum effectiveness**. None of those
passes asks the most important question: *does someone who practices
through this corpus actually become better at the HP?*

The user's framing: *simulate the 0.0 → 2.0 journey itself*. A
persona-agent starts at 0.0 with minimal HP knowledge, practices
through the corpus question-by-question, and we observe whether and
how their knowledge state evolves.

This collapses multiple problems into one signal:
- **Curriculum validation** — does the corpus, as a whole, teach?
- **Per-entry leverage** — which explanations actually move the
  student? Which don't?
- **Bottleneck detection** — where does the trajectory plateau?
- **Ordering effects** — does sequence matter?

It also becomes the natural automation: one trajectory run replaces
the entire scan+eval+regen multi-agent cycle. Bottleneck entries
auto-feed the regen queue. High-leverage entries become voice anchors
for future regens. **The simulation IS the dogfood AND the regen
signal.**

## Approach — 7 phases

### Phase A — Knowledge state schema

`audit/trajectory/state.py` defines the persistent state of a
simulated student. Compact enough to fit in agent context, structured
enough to verify learning honestly:

```json
{
  "trajectory_id": "00-to-20-2026-05-12-001",
  "config": {
    "start_level": "0.0",
    "target_level": "2.0",
    "ordering": "random-stratified",
    "max_rounds": 200
  },
  "round": 47,
  "questions_practiced": [
    {"qid": "...", "round": 1, "attempted_before": "B", "facit": "A",
     "explanation_helped": true, "transfer_test": {"qid": "...", "passed": true}}
  ],
  "facts_learned": [
    "Pythagoras: a²+b²=c² in right triangle, c is hypotenuse",
    "KVA option meanings: A=I>II, B=II>I, C=I=II, D=otillräcklig",
    "Triangle inequality: a+b > c for any non-degenerate triangle",
    "'kollokation' = fixed word-pair (e.g. 'taga del av', 'stå pall')",
    "Idiom 'inte på långt när' = far from / not nearly"
  ],
  "concepts_struggling_with": [
    "logarithm manipulation (seen 3 times, still shaky)",
    "long LÄS passages (>5KB, citation hunt feels random)"
  ],
  "section_proficiency": {
    "XYZ": 0.6, "KVA": 0.4, "NOG": 0.2,
    "ORD": 0.7, "LÄS": 0.5, "MEK": 0.6, "ELF": 0.5
  },
  "estimated_level": 0.85,
  "started_at": 1715539200000,
  "last_updated": 1715542800000
}
```

The state file IS the persona. Each round reads it, executes one
practice round, writes the updated state. Resumable across Claude
sessions.

### Phase B — Practice round protocol

`audit/trajectory/practice_round.py` orchestrates one round:

1. **Load state** from `audit/trajectory/states/<id>/state.json`
2. **Pick next question** from the corpus per the ordering strategy
   (random stratified, section-cycling, or technique-grouped)
3. **Attempt phase**: dispatch agent with the state-as-persona + the
   question. Agent outputs:
   - `attempted_letter`: their answer based on current knowledge
   - `confidence`: 0-1
   - `reasoning`: brief note on what they tried
4. **Reveal phase**: agent reads the facit + explanation
5. **State update phase**: SAME agent (continuity) outputs:
   - `explanation_helped`: bool — did this explanation teach me anything new?
   - `facts_added`: list of new facts (small, atomic)
   - `concepts_struggling_with`: updated list
   - `section_proficiency_delta`: small adjustments
6. **Transfer test phase** (every 5th round): pick another corpus
   entry that uses the SAME technique (matched via the `technique`
   field). Show only the question (not the explanation). Agent attempts.
   - If correct → explanation transferred; mark this entry as
     high-leverage
   - If wrong → explanation didn't stick; mark as low-leverage
7. **Persist** updated state

Each round is ~30-60s of agent compute. Transfer tests add ~30s.

### Phase C — Trajectory orchestrator

`audit/trajectory/run.py` is the driver. Subcommands:

| Subcommand | What |
|---|---|
| `start --config <path>` | Initialize a new trajectory, write state |
| `step` | Run ONE practice round (read state → round → write state) |
| `run --max-rounds N` | Loop until N rounds OR target level OR plateau |
| `status` | Print current round, estimated level, recent log entries |
| `report` | Generate analysis markdown for the completed run |
| `compare <id1> <id2>` | Diff two trajectory runs |

Loop strategy: stop when ANY of:
- `max_rounds` hit
- `estimated_level >= 2.0` (target reached)
- No improvement in `estimated_level` for 20 consecutive rounds
  (plateau)

### Phase D — Validation tests (anti-cheat)

The biggest risk: Opus has model-baseline HP knowledge. A naive
simulation would have the "0.0 student" answer every question
correctly from round 1 — useless.

Mitigations baked into the prompt + protocol:

1. **State-only constraint**: the attempt prompt says "Answer using
   ONLY the knowledge in your `facts_learned` list. If a question
   requires a concept not in your facts, output `cant_solve` with
   reason." This forces honest cheating-detection by the agent itself.

2. **Trick rounds**: every 20th round, inject a question whose
   technique was NEVER seen. The persona should output `cant_solve`,
   not the correct answer. If they get it right, we know they're
   cheating with model-baseline.

3. **Calibration baseline**: round 0 is "evaluate yourself" — agent
   attempts 10 sample questions across sections WITHOUT any state.
   This is the real 0.0 baseline. If they score >2/10, the persona
   is leaking model knowledge; adjust prompt and restart.

4. **Forgetting**: explanations the agent "learned" but hasn't applied
   in 30+ rounds get marked as "fading" — agent must reconfirm
   before using.

### Phase E — Run a baseline trajectory

The first run is the proof. Configuration:
- start_level: 0.0
- max_rounds: 200
- ordering: random-stratified across all 7 sections
- target_level: 2.0

Expected wall-clock: ~3-4 hours (200 rounds × ~60s each).

Success criteria for proof-of-concept:
- Round 0 baseline score: 0-3/10 (confirming 0.0 baseline)
- Trick-round detection: 0% cheating (cant_solve when expected)
- Estimated level curve: monotonically non-decreasing (or with small
  forgetting drops)
- Final estimated level: ≥0.8 (showing the corpus teaches at all)

If proof passes, run 3 more trajectories with different orderings and
random seeds for statistical signal.

### Phase F — Analysis

`audit/trajectory/analysis.py` produces:

1. **Trajectory curve**: estimated_level vs round number. PNG plot.
2. **Per-section proficiency curves**: 7 lines on one chart.
3. **Per-entry leverage**: for each qid practiced, did the next
   transfer test pass? Score per entry: +1 if explanation helped AND
   transfer passed; 0 if helped but transfer failed; -1 if not even
   helped.
4. **Bottleneck list**: top 20 entries with lowest leverage scores.
   These become the **regen priority queue**.
5. **High-leverage list**: top 20 entries with highest leverage.
   These become **voice anchors for future regens**.
6. **Plateau detection**: rounds where estimated_level stalls. What
   sections/techniques are stuck?

Output: `data/explanations/_trajectory_report_<id>.md` with all of
the above + raw stats table.

### Phase G — Integration with the regen cycle

The bottleneck list IS the next regen queue. Wire it:

1. After a trajectory run completes, `audit/trajectory/analysis.py`
   writes `audit/dogfood/regen_queue.json` with the bottleneck qids
2. Re-running the previous-session's regen agents on these specific
   qids becomes a one-line invocation
3. Closes the loop: trajectory → bottlenecks → regen → next trajectory
   should show improvement on those qids

The orchestration script (`audit/dogfood.py` from the prior plan)
becomes a thin wrapper: `dogfood trajectory` runs Phase E + F + G in
sequence.

## Files

**New:**
- `audit/trajectory/state.py` (~80 lines) — schema + persistence
- `audit/trajectory/practice_round.py` (~200 lines) — round orchestrator
- `audit/trajectory/agent_briefs.py` (~150 lines) — attempt/reveal/update prompt templates
- `audit/trajectory/run.py` (~180 lines) — CLI driver
- `audit/trajectory/analysis.py` (~250 lines) — metrics + plots
- `audit/trajectory/technique_index.py` (~80 lines) — pre-compute
  qid → similar-qid map via the `technique` field for transfer tests
- `audit/trajectory/states/<trajectory_id>/state.json` (gitignored)
- `audit/trajectory/states/<trajectory_id>/log.jsonl` (gitignored)
- `audit/trajectory/states/<trajectory_id>/report.md`
- `data/explanations/_trajectory_report.md` — most-recent run

**Edited:**
- `audit/dogfood.py` (planned previously) — add `trajectory` subcommand
- `.gitignore` — `audit/trajectory/states/*/state.json` and `log.jsonl`
  but keep `report.md`

**Read-only references:**
- `audit/personas/00.md` — voice anchor for the simulated student
- `pipeline/explanations/{prompts,schema}.py`
- All `data/explanations/*.json` and `data/parsed/*.json`

## Verification

**Phase A** — state schema:
- Pretty-print a sample state; humans should be able to read it as
  a "student profile"
- State serializes to <50KB even after 200 rounds

**Phase B** — round protocol:
- Run 5 rounds manually, inspect each state transition
- Confirm `facts_learned` only grows with NEW facts (no dupes)
- Confirm trick-round detection fires

**Phase D** — anti-cheat:
- Run round 0 baseline; should score 0-3/10
- Inject 10 trick-round questions; expect 100% `cant_solve`
- If baseline is too high, tighten the state-only constraint

**Phase E** — baseline trajectory:
- Full 200-round run completes without errors
- Trajectory curve is sensible (not flat at 0, not jumping to 2.0
  immediately)
- Final state file is human-readable

**Phase F** — analysis:
- Bottleneck list has ≥10 entries with substantive failure_reasons
- High-leverage list has ≥10 entries
- Compare bottleneck list to the persona-pass Tier-1 list — overlap
  should be ~50%+ (the two methods should agree on truly weak entries)

**Phase G** — integration:
- After bottleneck regen, a 2nd trajectory should show improvement
  on those qids

## Risks & mitigations

1. **Persona fidelity over 200 rounds** — Opus drift toward
   model-baseline knowledge.
   - Mitigation: state file is THE persona; agent's `facts_learned`
     list constrains what they can use; trick rounds detect cheating;
     "fading" mechanism for unused facts

2. **State explosion** — `facts_learned` grows unbounded.
   - Mitigation: cap at 100 facts; older unused facts compressed to
     section_proficiency deltas; periodic "knowledge consolidation"
     rounds where redundant facts merge

3. **Trick-round false positives** — agent legitimately solves a
   trick by partial application of existing facts.
   - Mitigation: trick rounds use techniques DEMONSTRABLY absent
     from current facts; reviewer (me) curates the trick set

4. **Compute cost** — 200 rounds × ~60s = ~3.5h per trajectory; 3
   trajectories = ~10h.
   - Mitigation: start with 100-round trajectory + 1 run; scale up
     only if signal is good; transfer tests every 5th round (not
     every round)

5. **No real-student ground truth** — can't validate that simulated
   trajectory matches real-student trajectory.
   - Mitigation: the real user IS a 0.0; their pace through the SPA
     (recorded via the existing localStorage) provides eventual
     ground truth; until then, the simulation is "structurally
     plausible" rather than "empirically validated"

6. **Section ordering bias** — random ordering may give the corpus
   more credit than it deserves (good entries pulled out early).
   - Mitigation: run multiple trajectories with different orderings;
     compare. Realistic ordering = sequential by exam year (mimics
     a real student doing one mock at a time)

7. **Same-model auditing** — the LLM playing the student is the
   same model that wrote the explanations. Confirmation bias.
   - Mitigation: persona constraints + state-only + trick rounds;
     also: planned future work to run the trajectory with a
     DIFFERENT model (e.g., Sonnet) as the student. Different model
     ≠ different mind, but reduces shared-blindspot risk

## Decisions locked

- **Anti-cheat: STRICT** — state-only + `cant_solve` protocol. Agent
  MUST refuse to answer if the question requires a concept absent
  from `facts_learned`. Round 0 baseline must score 0-3/10. Trick
  rounds enforce honesty. This is the most faithful simulation; the
  small cost in `cant_solve` overhead is worth the clean signal.
- **Bottleneck signal: FAILED TRANSFER TESTS** — an entry is a
  bottleneck if its post-explanation transfer test fails. Direct,
  per-entry measurement of "did this explanation teach me
  transferable knowledge?". Plateau detection is informational only
  (in the analysis report), not a bottleneck source.
- **Default ordering: random-stratified** — gives the corpus a fair
  test. Realistic ordering (by exam year) as a comparison baseline
  run #2 if the first run validates.
- **Default trajectory length: 200 rounds** — matches a motivated
  student's ~2-week practice. With transfer tests every 5 rounds:
  200 rounds = ~40 transfer tests = ~40 bottleneck signals per run.
- **Single trajectory first** — proof of concept. Scale to 3
  trajectories only if the first run's signals are sensible
  (baseline score 0-3/10, sensible trajectory curve, bottleneck
  list with substantive failure_reasons).
- **Auto-feed bottlenecks to regen queue** — yes. The whole point is
  closing the loop without manual intervention.

## Out of scope

- **Multi-model trajectories** (Opus vs Sonnet vs Haiku as the
  student) — methodologically valuable, but a follow-up
- **Real-student ground truth comparison** — needs real-user
  localStorage data we don't have yet
- **Adaptive curriculum** — using trajectory data to RE-ORDER the
  corpus for individual students. Big feature, separate plan
- **The dogfood orchestrator** (`audit/dogfood.py` from prior plan) —
  the trajectory pass becomes a SUBCOMMAND of it; the orchestrator
  itself is a separate (and smaller) build
- **DTK section** — still no Layer 2

## How this changes the automation story

The prior automation plan was: orchestrate the existing audit + regen
passes. This plan SUBSUMES it: the trajectory pass is a higher-signal
audit that auto-produces the regen queue. Sequence:

1. Run trajectory (3-4 hr, single command)
2. Trajectory writes bottleneck queue
3. Regen agent dispatched on bottleneck queue (~30 min)
4. Verify + commit (~5 min)

One slash command, one cycle, integrated end-to-end. The dogfood
orchestrator becomes:

```bash
python audit/dogfood.py trajectory --max-rounds 200
# (~4 hours wall-clock)
python audit/dogfood.py regen-from-trajectory
# (~30 min)
python audit/dogfood.py ship
# (commit + push)
```

Or `/dogfood trajectory` as a one-liner runbook.
````
