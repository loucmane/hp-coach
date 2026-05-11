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