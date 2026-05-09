# Layer 2 — per-question explanations

Position in the pedagogical architecture (PRD § 3, § 5.10):

```
Layer 1 — frameworks       (manually authored, zero-knowledge curriculum)
Layer 2 — explanations     ← this doc
Layer 3 — adaptive logic   (uses L1 + L2 to drive what to drill next)
Layer 4 — synthetic gen    (uses L1 patterns to manufacture practice)
Lessons (§ 5.16)           (sequenced L1 + L2 + teach-back gates)
```

Layer 2 turns the drill engine from quiz-mode into coaching-mode: every
graded question produces an explanation that names the technique,
walks the fast solution path, and analyses each distractor (why it's
tempting, why it's wrong). Without this layer the user practices
without learning — the highest-leverage gap in the product as of
2026-05-09, post Phase B (vector quant rendering shipped).

This doc is the authoritative spec for L2. Read it before opening
`pipeline/explanations/` or any L2-related SPA component.

## Mission framing

HP-Coach is a paid subscription product, not a single-user tool.
The dogfood phase (one user — the developer — studying for HP) is
real and immediate, but every architectural choice has to survive
the multi-tenant paid-service mission without rewrite. The principle
this doc applies: **invariant where possible, evolving where required.**

## The three-axis decomposition

The core architectural insight: "explanations" isn't one thing.
It's three things, each with a different scaling profile.

| Axis | Per-user? | Changes per request? | Scaling substrate |
|---|---|---|---|
| **Content** (the explanation text) | No — global | No — deterministic | Static asset, generated once, served from R2 / CDN |
| **Interaction state** (👍/👎, last-seen, time spent) | Yes | Yes | D1 + worker, server-authoritative |
| **Delivery gating** (free vs paid tier, abuse limits) | Yes | Per-request | Worker at the edge, Clerk-aware |

**Each axis chooses its own substrate independently.** Conflating
them is the mistake that produced the original "lazy-LLM-on-Workers"
plan; splitting them produces an architecture that's simpler today
AND scales cleanly to paid.

The CONTENT axis carries 95 % of the value and 95 % of the cost.
The state and gating axes are thin layers on top.

## Three-phase delivery evolution

The generation pipeline is invariant; the delivery layer evolves.

```
Phase / "dogfood"             Phase / "multi-user beta"     Phase / "paid scale"
──────────────────             ──────────────────────────     ──────────────────────
generate.py (Python script)    generate.py (same)             generate.py (same)
  ↓                              ↓                              ↓
data/explanations/*.json       data/explanations/*.json       data/explanations/*.json
  ↓ (sync-dataset.sh mirror)     ↓ (upload-r2.py)               ↓ (upload-r2.py)
app/public/explanations/       R2 bucket                      R2 bucket (multi-region)
  ↓                              ↓                              ↓ (KV warm cache)
SPA direct fetch               Worker /api/explanations       Worker /api/explanations
                                 + Clerk auth                   + Clerk auth
                                                                + subscription tier check
                                                                + abuse rate-limit
                                                                + analytics emit
```

The pipeline is identical across all three phases. The delivery
layer evolves through three small steps, each non-rewriting.

## Scope

- **All 8 sections.** ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK.
- **All 4320 questions** are the eventual target.
- **3535 fully-parsed today** are eligible for backfill.
- **DTK and other partially-parsed (~785) wait for Phase C** —
  without the figure-derived structured spec, the LLM can't write a
  useful walk-through.
- **ELF stays in English** (per `CLAUDE.md` — exam content is English
  by design); every other section produces Swedish explanations.

## Output schema

Per-question, structured JSON. We intentionally do not let the model
return free-form text — distinct fields give the SPA distinct UI
affordances and make the QA workflow tractable.

```typescript
type Explanation = {
  solution_path: string             // 2-4 sentences. Insight-first.
  distractors: Array<{
    letter: string                  // 'A' | 'B' | ... | 'E' (NOG has 5)
    why_tempting: string            // believable mistake, charitable framing
    why_wrong: string               // corrective insight, one sentence
  }>
  technique: string                 // generalisable pattern name
  pitfall: string | null            // nullable; only emit if orthogonal to technique
}
```

Storage: one JSON file per exam, keyed by `qid`:

```
data/explanations/host-2025.json
─────────────────────────────────
{
  "host-2025-kvant1-XYZ-002": { ...Explanation },
  "host-2025-kvant1-XYZ-003": { ...Explanation },
  ...
}
```

Plus an index `_index.json` listing which qids have approved
explanations (read by the SPA to decide whether the panel mounts).

## Prompt design

System prompt skeleton — locked during Stage 1 against five
hand-picked questions across XYZ / NOG / ORD / LÄS / KVA / ELF.

```
You are an HP-Coach instructor. The student is preparing for the
Swedish högskoleprov (HP) and just answered the question below.

Output a JSON object matching the schema. Voice: calm, encouraging
coach. Second person ('du'). Swedish unless section is ELF (English).
No filler — get to the work.

MATH: wrap LaTeX in U+E000 ... U+E001 markers (the SPA's renderer
splits on these and feeds the contents to KaTeX). Inline only;
display math is rare in HP and looks wrong on a 390 px artboard.

SOLUTION_PATH STRUCTURE:
- First sentence: THE INSIGHT — the single thing the student needed
  to know to get this right. Not the setup, not the methodology.
- Remaining sentences: arithmetic / passage / reasoning path.
- Total length: 2-4 sentences; cut anything that doesn't pull weight.
- Optimise for the FAST path — students get ~75 s/question.

DISTRACTORS:
- One entry per WRONG option (skip the correct one).
- why_tempting names the believable mistake, charitably.
- Vary the empathy framing across distractors. Acceptable openers:
  "Det är lätt att..." / "Många stannar vid..." / "Första instinkten är..."
  / "Vänster-till-höger-läsning ger..." / "Om du minns regeln som..."
  / "Snabbsvar är ofta..."
  Never reuse the same opener twice in one explanation.
- why_wrong delivers the corrective insight in one sentence.

TECHNIQUE:
- One sentence, names a recurring pattern the student will see again
  across exams.
- Don't over-fit ('Multiplikation av bråktal') — name the INSIGHT,
  not just the operation.

PITFALL (NULLABLE):
- Optional. Emit ONLY when the trap is structurally distinct from
  the technique.
- Skip if pitfall would just paraphrase the technique ("follow rule
  X to avoid violating rule X"). Set to null instead.

Stay specific to THIS question's numbers and wording. Generic
explanations are worse than nothing.

[per-section addenda — see below]
```

Anthropic API call uses **tool use** to force the JSON schema — no
parse failures, automatic schema validation.

Model: **Claude Sonnet 4.6 with extended thinking enabled.**
The extended-thinking budget closes most of the quality gap to
Opus 4.7 on multi-step reasoning (KVA structural analysis, NOG
sufficiency proofs, LÄS passage triangulation) at ~$60 for the full
corpus instead of ~$84 for Opus. Adaptive escalation later: if Stage
3 spot-checks reveal a section underperforming, regenerate that
section with Opus 4.7 (~$5/section).

## Per-section addenda

The system prompt grows by a small section-conditional block:

### ORD (synonym, 40 q)

```
solution_path leads with the modern Swedish meaning. Add etymology
ONLY when there's an English cognate or transparent root the
student can hook on (e.g. gourmand → gormandize). Drop "this is a
French/Latin loanword" filler.
```

### LÄS / MEK (Swedish reading + cloze)

```
solution_path cites the passage by paraphrase ('texten lyfter
fram...' / 'i tredje stycket konstaterar författaren...'), not by
line number.
distractors classify each wrong option's failure mode:
  - contradicts the text
  - overreaches beyond what's stated
  - under-reaches and ignores key claims
  - inverts the cause-effect direction
```

### ELF (English reading, 20 q)

```
Full output in English. Use natural English idioms; do not
Swedish-translate. solution_path cites the passage by paraphrase,
same conventions as LÄS.
```

### XYZ (algebra, 12 q)

```
solution_path shows the WORK, not just the result. Use KaTeX
liberally for any non-trivial expression.
```

### KVA (quantitative comparison, 12 q)

```
Option letters have FIXED structural meanings:
  A = I är större än II
  B = II är större än I
  C = I är lika med II
  D = informationen är otillräcklig
technique field must include the QUANTITATIVE verdict (which way
the inequality goes, or why information is insufficient).
distractors:
  - A/B mismatches: name the calculation error that flipped the
    direction.
  - C: name the false-equivalence assumption.
  - D: name what specifically the student thought was missing.
```

### NOG (data sufficiency, 12 q)

```
Option letters have FIXED structural meanings:
  A = sufficient in (1) but not (2)
  B = sufficient in (2) but not (1)
  C = sufficient in (1) together with (2)
  D = sufficient in (1) and (2) separately
  E = neither alone nor together
Each why_tempting must name the SUFFICIENCY mistake the letter
represents (e.g. "if you concluded each statement alone places the
answer above all others, you'd land here").
```

### DTK (deferred to Phase C)

```
Skip until Phase C provides the structured figure spec. The LLM
cannot write a useful walk-through from text alone for chart /
table / map questions.
```

## Generation pipeline

```
pipeline/explanations/
├── prompts.py             system prompt + per-section addenda
├── schema.py              JSON schema for Anthropic tool-use
├── generate.py            CLI entrypoint, resumable, idempotent
└── upload_r2.py           v2 stub — uploads data/explanations/ to R2
```

### `generate.py`

CLI:

```
python pipeline/explanations/generate.py [options]

Options:
  --filter mistakes         only generate for qids in user's mistakes table
  --filter section=XYZ      only generate for one section
  --filter exam=host-2025   only generate for one exam
  --all                     full backfill
  --force                   regenerate even if explanation exists
  --model claude-sonnet-4-6 model override (default: from env)
  --thinking-budget 8000    extended-thinking token budget
  --concurrency 5           parallel API calls
  --dry-run                 print what would be generated, don't call API
```

Behaviour:

- Reads `data/parsed/<exam_id>.json` for question payloads.
- For each question with `parsing_status === 'complete'` and (without
  `--force`) no existing explanation:
  - Constructs the user message from `prompt`, `options`, `answer`,
    `section`, optionally `context` (LÄS).
  - Calls Anthropic Messages API with tool-use forcing the schema.
  - Validates response against `schema.py`.
  - Appends to `data/explanations/<exam_id>.json` (atomic write per
    file).
- Resumable: existing file is read first; only missing qids are
  generated unless `--force`.
- Logs per-question cost; prints running total at end.

### `upload_r2.py` (v2 stub)

Stub that exists today but isn't called. When v2 lands:

```python
# Upload data/explanations/*.json to R2 bucket hpc-explanations
# Wrangler-equivalent: wrangler r2 object put hpc-explanations/...
```

Documenting the path now so v2 = "uncomment + add credentials"
rather than "design from scratch."

## Storage & delivery

### v1 — dogfood (now)

```
data/explanations/<exam>.json
  ↓ (app/scripts/sync-dataset.sh)
app/public/explanations/<exam>.json
  ↓ (Vite dev / Pages production serve)
SPA → loadExplanation(qid) → fetch('/explanations/<exam>.json')
```

The `sync-dataset.sh` extension is one line — same pattern as the
figure mirror that already exists.

### v2 — multi-user beta

```
data/explanations/<exam>.json
  ↓ (pipeline/explanations/upload_r2.py)
R2 bucket hpc-explanations
  ↓ (worker /api/explanations/:qid + Clerk auth)
SPA → loadExplanation(qid) → fetch('/api/explanations/:qid', { auth })
```

The SPA's `loadExplanation` abstraction (see below) hides this
swap from every call site.

### v3 — paid scale

Adds:

- KV warm-cache for the top-N hot questions (sub-5ms reads).
- Subscription tier check in the worker (free tier: limited;
  paid: unlimited).
- Per-user rate limit in KV (abuse prevention).
- Analytics emit on every read (engagement / churn signals).
- Optional: signed R2 URLs to skip the worker proxy on warm reads.

None of this changes the SPA call signature or the generation
pipeline.

## SPA integration

### Loader

`app/src/data/explanations.ts` — typed loader, hides the delivery
layer from every call site:

```typescript
export type Explanation = {
  solution_path: string
  distractors: Array<{
    letter: string
    why_tempting: string
    why_wrong: string
  }>
  technique: string
  pitfall: string | null
}

// v1 implementation: static-asset fetch
// v2: swap to /api/explanations/:qid worker route, no call-site changes
export async function loadExplanation(qid: string): Promise<Explanation | null>
```

Memory cache + lazy fetch by `exam_id` extracted from qid. Same
pattern as `app/src/data/questions.ts`.

### Component

`app/src/components/drill/ExplanationPanel.tsx`:

```
ExplanationPanel
├── SolutionPath           (paragraph, KaTeX via existing MathText)
├── DistractorAccordion    (one row per wrong option, click to expand)
├── TechniqueTag           (chip with the technique name)
├── PitfallCallout         (subtle highlight; rendered only if pitfall !== null)
└── QABar                  (👍 / 👎 + optional comment)
```

Mounted in `DrillQuestion` after `phase === 'graded'`.

Default behaviour:

- **Wrong answer** → panel auto-expands. Highest-value content on
  screen at that moment.
- **Right answer** → panel collapsed with `'Visa förklaring'` link.
  ADHD-PI pattern: "I guessed correctly but want to verify my
  reasoning."
- **Skeleton on load** with copy `'Tänker igenom uppgiften…'`. v1
  is blocking (5-15 s on first call); v2 introduces prefetch on
  question mount.

Coach voice (`kompis` / `professor` / `taktiker`) influences the
**wrapper UI only** — intro line, encouragement copy. The technical
content stays neutral. Generating per-voice would 3× API spend and
3× QA load with no proportional pedagogical gain.

## QA workflow

### v1 — localStorage with server-friendly shape

The 👍 / 👎 buttons in `ExplanationPanel` write to localStorage:

```typescript
// localStorage key: hpc:explanation-feedback:<qid>
type FeedbackEntry = {
  qid: string
  status: 'approved' | 'rejected'
  notes?: string
  model: string             // which model generated the explanation
  generatedAt: number       // ms epoch — copied from explanation metadata
  reviewedAt: number        // ms epoch — when the user pressed 👍/👎
}
```

The shape is **already server-friendly** — the same object will be
POSTed to `/api/explanations/feedback` in v2. Migration is mechanical.

### Regenerate-from-feedback workflow

```
python pipeline/explanations/regen.py --from-localstorage-export feedback.json
```

User pastes a one-liner into devtools to dump localStorage feedback
to a file:

```js
// In devtools console
copy(JSON.stringify(
  Object.entries(localStorage)
    .filter(([k]) => k.startsWith('hpc:explanation-feedback:'))
    .map(([_, v]) => JSON.parse(v))
))
```

Then runs the regen script which re-generates 👎'd explanations with
the user's notes appended to the prompt as feedback context. Diff
the result, commit.

### v2 — server-side feedback capture

Adds `/api/explanations/feedback` POST endpoint. SPA's
`submitFeedback({ qid, status, notes? })` swaps from localStorage
to the API. Same shape, same call sites.

`feedback` table in D1:

```sql
CREATE TABLE explanation_feedback (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       TEXT    NOT NULL,
  qid           TEXT    NOT NULL,
  status        TEXT    NOT NULL,
  notes         TEXT,
  model         TEXT    NOT NULL,
  generated_at  INTEGER NOT NULL,
  reviewed_at   INTEGER NOT NULL,
  UNIQUE(user_id, qid)
);
```

At paid scale, aggregated 👎 signal per question becomes a quality
metric — questions with high 👎 rates surface for prompt-tuning
attention.

## Migration seams

The three places where v1 → v2 → v3 transitions land. Naming them
explicitly here so future-me doesn't have to rediscover them:

1. **`loadExplanation(qid)` in `app/src/data/explanations.ts`** — the
   only place the delivery layer is named. v1 = direct fetch. v2 =
   worker proxy. v3 = same as v2 with KV cache hint header.

2. **`submitFeedback(entry)` in `app/src/api/feedback.ts`** — the only
   place the QA capture is named. v1 = localStorage. v2 = `fetch(...)`.

3. **`app/scripts/sync-dataset.sh` target line for explanations** —
   v1 = `app/public/explanations/`. v2 = R2 bucket via wrangler r2.

Anything else changing between phases is a bug; these three are by
design.

## Build sequence

### Stage 1 — prompt design (DONE in conversation, 2026-05-09)

Iterated the system prompt against five hand-picked questions
across XYZ / NOG / ORD / LÄS, plus KVA and ELF samples for
structural variety. Key locked decisions:

- Solution-path is insight-first, 2-4 sentences.
- Distractor empathy framings rotate; no opener used twice.
- `pitfall` is nullable; emit only when orthogonal to technique.
- ORD etymology only when there's a real cognate hook.
- NOG / KVA / ELF have section-specific structural addenda.
- Math markers: U+E000 / U+E001, validated end-to-end in Stage 2.

### Stage 2 — pipeline + SPA (this branch, ~6 hours active)

| Step | Time |
|---|---|
| `pipeline/explanations/{prompts,schema}.py` | 30 min |
| `pipeline/explanations/generate.py` (resumable, with filters) | 90 min |
| `pipeline/explanations/upload_r2.py` (stub for v2) | 10 min |
| `app/scripts/sync-dataset.sh` extension | 10 min |
| `app/src/data/explanations.ts` typed loader | 30 min |
| `app/src/api/feedback.ts` (localStorage today) | 20 min |
| `ExplanationPanel.tsx` + sub-components + styling | 90 min |
| Wire into `DrillQuestion` graded state | 20 min |
| Phase 2A: generate for user's mistakes (~150 q, ~$2) | 30 min wait |
| Spot-check 20 explanations + iterate prompt if needed | 30 min |
| **Total** | **~6 hours active** |

### Stage 3 — full backfill + dogfood (~30 min active)

- Run `generate.py --all` on remaining ~3385 questions (~$58, ~30-60
  min wait, runs unattended).
- Spot-check a random sample.
- Use the app over study sessions.
- Fill the QA queue with 👍 / 👎. Regenerate the 👎s periodically.

### Stage 4 (deferred) — multi-user delivery

- Implement v2 transitions at the three migration seams.
- Trigger when there's a second user OR when explanations need
  subscription gating, whichever comes first.

## Risks & mitigations

1. **Latency on first explanation view (v1).** Static-fetch is
   instant; this risk only materialises in v2 when worker proxy
   adds 50-150 ms. Mitigation: KV warm-cache for top-N qids in v3.

2. **Anthropic SDK on Workers (v2).** `@anthropic-ai/sdk` v0.30+
   supports the Workers runtime, but extended-thinking via the SDK
   on Workers is not yet validated. Mitigation: the v1 path doesn't
   use the SDK on Workers at all; we validate in a separate Stage 4
   spike before committing v2 layout.

3. **Cost runaway from prompt tuning.** Each prompt iteration that
   needs a full regen costs ~$60. Mitigation: Stage 2A validates
   prompt against ~150 questions ($2) before Stage 3 commits the
   full $60.

4. **Quality drift without strict QA.** Counter: prominent 👍 / 👎
   inline; treat 👎 as a regen signal; periodic regen-from-feedback
   pass. Comments accumulate as prompt-tuning evidence — once a
   pattern repeats, the system prompt gets revised and offending
   sections regenerate in batch.

5. **Math markers in explanations.** The LLM has to reliably
   produce U+E000 / U+E001 wrappers. Stage 2A validates this
   end-to-end by generating an XYZ explanation and confirming
   `MathText` renders the markers correctly into KaTeX.

6. **L1 frameworks not written yet.** The `technique` field is a
   one-sentence string today; later it'll join to `frameworks.id`.
   The string is searchable today, easy to migrate to FK later.

7. **Voice variations cost.** Hold the line on neutral content +
   voice in the wrapper. Per-voice generation is 3× cost and 3× QA
   load with no proportional pedagogical gain.

8. **Subscription gating (v3).** Free tier might see 50
   explanations/day; paid sees all. Worker enforces. Caching gets
   trickier with auth headers — KV cache by `(qid, tier)` rather
   than just `qid` is the v3 design.

## Open questions

- **Streaming vs blocking on first view (v1).** Currently blocking;
  static fetch hides this. In v2 the worker proxy adds latency only
  on cold cache; streaming becomes a v2 polish question.
- **Coach voice integration depth.** Confirmed: neutral content +
  voice in wrapper. Revisit if user-testing shows different voices
  hit different learning styles.
- **Per-distractor explanation routing.** When a user picks the
  wrong answer, the SPA could foreground THAT distractor's
  why-tempting/why-wrong block on first reveal. Likely v1.5
  enhancement. Schema already supports it.
- **Multi-language.** HP is Swedish-only; ELF stays English. If the
  product expands to other Nordic exam markets, the pipeline already
  supports per-locale generation — `data/explanations/<locale>/<exam>.json`.
- **Adaptive difficulty.** Pre-generate compact / detailed / visual
  variants? Defer to a Phase E once user data shows learning style
  variance.
- **Multi-user QA process.** Aggregated 👎 signal at scale, sampling
  rates per section, audit trail of QA decisions. Phase D concern.
- **PRD § 9.2 legal status.** Whether HP-Coach can commercially
  redistribute UHR-copyrighted material is unresolved. Doesn't
  block dogfood; must be addressed before public launch.
