# Plan — Corpus quality pass (drive Swedish errors → near-zero)

## Context

User caught two real LLM Swedish errors via reading:
- `höflig` (pre-1906 spelling, should be `hövlig`) — 3 instances
- `inflytanderik` (malformed compound, should be `inflytelserik`) — 4 instances

These are the visible tip. The corpus is ~3.2 MB of Swedish across
3071 explanations + 4320 parsed questions + 8 framework JSONs (just
shipped) ≈ **~500,000 Swedish words**. A native speaker's eye catches
errors no automated tool finds — already proven (user caught both
errors in <10 min of reading).

User directive: scan every word, fix everything, zero errors.

## The breakthrough during planning

`wordfreq` (pure-Python pip install, no sudo needed) was tested on
the two known bugs and **caught both perfectly**:

| Word | Status | wordfreq zipf score |
|---|---|---|
| `hövlig` | correct | 2.22 |
| `höflig` | bug | **0.00** |
| `inflytelserik` | correct | 3.17 |
| `inflytanderik` | bug | **0.00** |

`wordfreq` handles inflected forms (`hövliga` = 1.87, `hövligt` = 2.27)
and HP-specific vocab (`kvantitet` = 3.52, `parallellogram` = 1.85).

## Honest limits — wordfreq has two failure modes

Stress-test surfaced both:

### Failure mode 1: false negatives (real Swedish word, wordfreq doesn't know)

- `rättvinklig` scores 0.00 — but it's a real, correct Swedish word
  for "right-angled" that the corpus uses (correctly)
- Workaround: build a per-corpus whitelist of HP-specific terms that
  hand-review confirms are legitimate but wordfreq misses

### Failure mode 2: false positives (archaic form scores high)

- `öfver` (pre-1906) scores 3.13 — wordfreq's Swedish training data
  includes historical text
- `lif` scores 3.31, `qvinna` scores 1.60 — same problem
- Workaround: targeted regex for known pre-1906 reform residue,
  independent of wordfreq

## All 9 in-scope classes are attackable by a multi-pass system

(Class 8 — math content — stays out of scope; that's the trajectory
simulation's domain.)

| Class | Example | Primary detection | Secondary detection |
|---|---|---|---|
| 1. Misspellings | `inflytanderik` | wordfreq zipf=0 | 3-pass Opus audit |
| 2. Archaic spellings | `höflig` | wordfreq + archaism regex | 3-pass Opus audit |
| 3. Malformed compounds | `inflytanderik` | wordfreq | 3-pass Opus audit |
| 4. Anglicisms | `First instinkten` | known-pattern regex | 3-pass Opus audit |
| 5. Wrong inflection | "en hus" → "ett hus" | **3-pass Opus audit** | — |
| 6. Wrong word in context | `betvinga` → `betvivla` | **3-pass Opus audit** | — |
| 7. Style template-fatigue | All-caps codas (340 known) | regex + batch regen | 3-pass Opus audit |
| 9. Punctuation / Unicode | curly-vs-straight quotes | regex normalize | — |
| 10. KaTeX / LaTeX | missing brace, raw command | regex | — |

**Key revision from v1 of this plan:** classes 5-6 are NOT residual.
They get caught by the multi-pass expert audit (Phase F below), which
is now the CORE mechanism, not a sample audit. User pushback was
correct — 5000 entries can't be hand-dogfooded; automation with
verifier-cross-check is the right answer.

## Why multi-pass expert audit works for classes LLMs "wrote"

The key distinction isn't different MODELS — it's different TASKS:

- **Generation mode** (writing 3071 Swedish explanations at speed):
  attention is split across content + structure + pedagogy + Swedish
  grammar simultaneously. Errors creep in.
- **Proofreading mode** (reading ONE entry with an explicit
  Swedish-only checklist): focused, single-axis, with grounding.

Different cognitive load. The model catches most errors when it's
proofreading rather than generating, *given the right prompt*. Adding
MORE passes with DIFFERENT prompts elicits different attention patterns
and catches what each pass alone missed.

For SUBJECTIVE judgments (is this pedagogy good?), shared-model bias
matters more. For FACTUAL ones (does this Swedish word exist? is this
inflection correct?), agents are reliable evaluators of work they
didn't produce themselves at generation time.

**Use Opus for every pass.** With the Max 20x plan, compute cost is
not a constraint. Opus has the highest per-pass recall of any model
we have access to. Maximum certainty comes from running it MORE
times with different prompts, not from substituting weaker models.

## The eight-phase plan

### Phase A — Build the linter (~3 hours)

Create `audit/corpus_lint/` with these tools:

```
audit/corpus_lint/
├── tokenize.py    — extract every Swedish word from corpus, skip math/code/English
├── lint.py        — run wordfreq + archaic-regex + anglicism-regex on tokens
├── whitelist.txt  — manually-curated legitimate words wordfreq misses
├── archaic.txt    — pre-1906 patterns to flag (öfver, lif, qvinna, qv-, ff→v, dt→tt)
├── anglicisms.txt — known English-in-Swedish patterns (Many, First, etc.)
├── report.py      — generate audit/corpus_lint/_report.md
└── README.md      — how to run + maintain
```

Key design points:
- **Tokenization respects PUA math markers** (U+E000…U+E001 spans are
  skipped — math, not Swedish)
- **ELF section is excluded** (legitimately English)
- **Proper nouns are heuristically detected** (capitalized mid-sentence,
  cross-referenced against a name list extracted from the corpus itself)
- **Output is structured JSON**: `{ token, qid_list, frequency_in_corpus,
  wordfreq_zipf, error_class_guess }`

### Phase B — Baseline scan (~30 min wall-clock, mostly compute)

Run linter on the full corpus. Output the raw flag list with
statistics:
- Total tokens scanned (~500k)
- Unique tokens flagged at zipf=0
- Unique tokens flagged at zipf<1
- Per-section breakdown
- Top-50 by frequency-in-corpus

This gives the actual error-rate baseline before any fixing.

### Phase C — Classify flag list (~3 hours of my eyes + dictionary lookups)

For each unique flagged token, decide:

| Category | Action |
|---|---|
| Real Swedish word wordfreq doesn't know | `whitelist.txt` |
| Proper noun (person, place, work title) | `whitelist.txt` (or filter heuristic) |
| Technical / scientific term | `whitelist.txt` |
| Archaic Swedish (1906 reform pattern) | `fix_list.json` class=archaic |
| Anglicism (English leaking through) | `fix_list.json` class=anglicism |
| Malformed compound | `fix_list.json` class=malformed |
| Genuine typo (single-char error) | `fix_list.json` class=typo |

Output: `fix_list.json` with `{token, error_class, correct_form, qids_affected[]}`.

Estimated counts (rough projection based on the 2 known bugs):
- Total unique flagged: ~3000-5000
- After whitelist filtering: ~500-1500 candidates
- After classification: ~100-300 real bugs across the corpus

### Phase D — Apply fixes (~3-5 hours)

Two pipelines by complexity:

**D.1 Simple find-and-replace (~1 hour, scripted)**

For tokens where the fix is unambiguous (`höflig`→`hövlig`,
`inflytanderik`→`inflytelserik`, archaic forms):
- `audit/corpus_lint/apply_fixes.py` reads `fix_list.json`, applies
  replacements across `data/explanations/*.json`, `data/parsed/*.json`,
  `frameworks/*.json`
- Validates each change doesn't break surrounding grammar (sanity:
  word boundaries respected, inflection forms handled)
- Commits one batch per error class

**D.2 Complex regen (~2-4 hours, agent-dispatched)**

For tokens where the fix requires sentence restructure (e.g. the
explanation says "personen är inflytanderik" but the right fix is
"personen är inflytelserik" AND surrounding language flow needs
adjustment):
- Batch dispatch a regen agent on the affected qid list
- Agent receives: the entry + the diagnosis + explicit examples of
  what NOT to do (the malformed compounds list)
- Output validated against existing schema before committing

### Phase E — Style sweep (~2-3 hours, agent-dispatched)

Tackle the 340 all-caps template-fatigue entries (the
"`Artig är HÖFLIG; X är Y`" pattern):
- Sample 20 entries to confirm the pattern is consistent
- Dispatch a regen agent on all 340 entries with explicit
  "no all-caps codas; vary opener; max 3 sentences" instructions
- Agent generates replacement explanations
- Spot-check 30 replacements before mass-commit

This is a Phase 1.5 issue from the persona pass that's been deferred.
Now is the right time.

### Phase F — Three-pass Opus expert audit on EVERY entry (~10-15 hours wall-clock, parallelized)

This is the CORE mechanism for classes 5 + 6 (wrong inflection,
wrong word in context) and a safety net catching anything Phases A-E
missed. All three passes are Opus 4.7 — different prompts elicit
different attention patterns.

**F.1 — Pass 1: Opus as careful proofreader (~3 hours)**

Dispatch Opus 4.7 in batches of 50 entries per agent call (~60 calls
total). Each agent gets a fixed checklist prompt:

```
You are a native-level Swedish proofreader (modern standard
Swedish, post-1906 reform). For each explanation entry below, read
carefully and flag ONLY Swedish-quality issues. Ignore pedagogy.

Check for:
- SPELLING: any word that's not modern standard Swedish
- ARCHAIC FORMS: pre-1906 spellings (höflig, öfver, qvinna, lif,
  hafva, etc.)
- MALFORMED COMPOUNDS: invented words like "inflytanderik" instead
  of "inflytelserik"
- INFLECTION: en/ett agreement, definite/indefinite, singular/plural
  agreement, verb tense consistency
- WORD CHOICE: real Swedish words used incorrectly in context (e.g.
  "betvinga" when "betvivla" was meant; paronyms; false friends)
- ANGLICISMS: English words/structures bleeding through ("First
  instinkten", "den var really bra")
- REGISTER: jarring tone mismatches within one entry

For each entry, output structured JSON:
{
  "qid": "...",
  "has_issues": bool,
  "issues": [
    {
      "class": "spelling|archaic|malformed|inflection|wordchoice|anglicism|register",
      "snippet": "the problematic text",
      "location": "solution_path|technique|pitfall|distractor[A].why_tempting|...",
      "suggested_fix": "what it should say",
      "confidence": "high|medium|low"
    }
  ]
}

If has_issues is false, issues=[].
```

Output: `/tmp/quality/pass1_<batch>.json` per batch, merged into
`/tmp/quality/pass1_flags.json`.

**F.2 — Pass 2: Opus as independent re-reader (~3 hours)**

Dispatch Opus 4.7 on each entry WITHOUT showing it Pass 1's output
yet. Same batch sizing. Different prompt that emphasizes a different
attention angle:

```
You are a native Swedish copy editor. Read this explanation as if
you've never seen it before. Your job is to find anything that
sounds non-native or wrong in Swedish.

Approach:
- Read the entire entry aloud in your head
- Note any phrase that makes you pause or re-read
- Check word-by-word for: spelling, inflection (en/ett, plural
  agreement), word choice (is this the RIGHT word for this
  context?), register consistency
- Flag any compound that sounds invented (e.g. "inflytanderik" —
  no native speaker says this)
- Flag any spelling that's pre-1906 reform (höflig, öfver, qvinna)

For each entry, output the same JSON shape as Pass 1.
```

Different angle (fresh-eyes copy editor vs systematic checklist) →
different errors caught. Independent of Pass 1's biases.

**F.3 — Pass 3: Opus as adversarial verifier (~3 hours)**

Dispatch Opus 4.7 with BOTH the entry AND the union of Pass 1+2 flags.
Its job: tie-break and find anything the first two missed.

```
Two proofreaders have flagged the following Swedish-quality issues
in this entry. You are the senior editor making the final call.

Three tasks:
1. CONFIRM each prior flag (yes/no + reason). Only confirm if you
   independently agree the snippet is genuinely wrong.
2. REJECT any flag where the prior proofreader was overreacting
   (e.g. uncommon-but-real Swedish word).
3. ADD anything BOTH proofreaders missed. Be specifically skeptical
   of long compounds and uncommon adjective forms.

Output:
{
  "qid": "...",
  "confirmed": [...flag IDs you confirm],
  "rejected": [{flag_id, reason}],
  "added": [...new issues}
}
```

**F.4 — Merge into authoritative fix list (~30 min, scripted)**

Three signal levels:
- **HIGH-confidence** = ≥2 of 3 passes agree → auto-fix
- **MEDIUM-confidence** = 1 of 3 passes flagged → my-eyes review
  before fixing
- **REJECTED** = flag dismissed by a downstream pass → drop, log

Output: `audit/corpus_lint/expert_fix_list.json`.

**F.5 — Apply fixes**

Same pipeline as Phase D (simple find-replace or regen-by-agent).
HIGH-confidence: automated. MEDIUM: my-eyes pass.

**F.6 — Iterate until convergence**

Re-run F.1+F.2+F.3 on the fixed corpus. If new flags appear → fix →
re-run. Loop until three consecutive passes return zero new
high-confidence flags.

Typically converges in 2-4 iterations.

**Why three passes (not two):**
- Pass 1 (systematic checklist) and Pass 2 (fresh-eyes read) catch
  DIFFERENT errors because they attend differently. Same model, but
  different cognitive entry points.
- Pass 3 (adversarial verifier with both flag-sets) tie-breaks the
  noise AND catches what BOTH missed (the "specifically skeptical"
  instruction primes attention to compound-word red flags).
- With the Max 20x plan, three Opus passes is the same dispatch
  complexity as two — no reason to underprovision.

50-entry batches keep context manageable (~80 KB per batch).

### Phase F-bis (optional) — LanguageTool grammar pass

If LanguageTool's Swedish ruleset can be installed (it requires Java
+ a local server, which may or may not be feasible without sudo),
run it as an independent third check. Rule-based grammar tools catch
errors LLMs systematically miss (regular inflection patterns,
agreement rules) because they don't share LLM training-data biases.

If install isn't feasible, skip — Phase F (two-model audit) should
already cover the major inflection/word-choice classes.

### Phase G — Verification + permanent capability (~1 hour)

After all fixes land:
- Re-run linter (Phase B)
- Confirm: flag list now consists only of whitelisted-tokens (no new
  bugs)
- Document residual: `audit/corpus_lint/_known_residual.md` lists
  classes 5-6 that automation can't cover + how the `/coach` dogfood
  loop handles them

### Phase H — Wire into the regen pipeline (~30 min)

Every future explanation regen (from any of the existing pipelines)
gets auto-linted before commit:
- Add a `pre_commit_lint(explanation_text)` hook to
  `pipeline/explanations/generate.py`
- Returns: pass / fail-list
- Fail-list blocks the commit; regen agent retries

This is the regression preventive: errors of these classes can't
re-accumulate after we fix them.

## Total estimated time

- My-hands work: **~6-8 hours** (linter build, flag classification,
  fix-list curation, verification, hook wiring)
- Agent wall-clock: **~12-18 hours** parallelized:
  - Phase E style sweep: ~2-3 hours
  - Phase F.1 Opus checklist pass: ~3 hours (60 batches × 50 entries)
  - Phase F.2 Opus fresh-eyes pass: ~3 hours
  - Phase F.3 Opus adversarial verifier: ~3 hours
  - Phase F.6 iteration (2-3 more cycles, smaller as flags shrink):
    ~4-6 hours total
- Compute cost: covered by Max 20x plan — not a constraint
- Total elapsed: **~18-26 hours of focused work** across multiple
  sessions

The big-picture trade-off: this isn't a one-evening sprint. It's a
multi-session quality pass that systematically drives errors to the
floor and leaves a permanent linter behind.

## Verification — how we know we're done

1. `wordfreq` flag list shrinks to whitelist-only (no zero-zipf tokens
   outside the curated whitelist)
2. Archaic-form regex returns zero matches across all corpus files
3. Known-anglicism regex returns zero matches
4. Sonnet semantic audit precision is documented; flagged residual
   either fixed or moved to a known-residual list with rationale
5. The pre-commit lint hook is active on the regen pipeline
6. A diff of `fix_list.json` shows N→0 over the course of fixes
7. Re-run trajectory simulation post-fixes — final estimated level
   should hold or improve (not regress) — sanity check that fixes
   didn't break pedagogy

## What this plan promises — and what it doesn't

**Promises (verifiable post-pass):**
- 100% of corpus tokens have been seen by ≥2 independent automated
  passes (wordfreq baseline + expert + verifier)
- Zero high-confidence flagged tokens at convergence (any flag both
  expert + verifier agree on has been fixed)
- A permanent linter that runs on future regens (Phase H pre-commit
  hook) — no regression possible

**Does not promise:**
- Literal 100% on classes 5-6 (some subtle errors that even careful
  proofreaders miss). The two-pass + iteration approach gets us to
  ~99% which is the achievable ceiling.
- Errors in proper nouns / quoted material / English-bleed in ELF
  section (deliberately excluded from scanning).

**The 1% residual** is acknowledged but no longer requires you to
hand-dogfood 5000 entries. The `/coach` 👎 button stays as the
opportunistic catcher when you happen to spot something, but it's
no longer the PRIMARY mechanism for classes 5-6 — the two-pass
expert audit is.

## Why this plan is right

1. **Tooling chain is real and tested.** `wordfreq` caught both
   known bugs cleanly. The breakthrough during planning made
   Phases A-D viable. Two-pass expert audit (F) is editorial
   industry standard for human authors and equally applicable to
   LLM-generated text.

2. **No reliance on user dogfood for the bulk.** User correctly
   pointed out that 5000-entry hand-review is unrealistic.
   Automation handles the bulk; user dogfood becomes opportunistic
   catcher, not primary mechanism.

3. **Iterates to convergence.** Phase F.5 explicitly loops until two
   consecutive passes return zero high-confidence flags. Closure is
   mechanical, not aspirational.

4. **Permanent capability, not one-shot.** Phase H wires the linter
   into the regen pipeline; the corpus can't re-accumulate these
   error classes.

5. **Uses everything we already built.** Reuses the regen agent
   pattern from prior passes, the persona-pass anglicism list, the
   trajectory simulation as the post-fix sanity check.

6. **Different-model audit (Phase F.2 — Sonnet)** breaks same-model
   blindspots for classes Phase A-D + F.1 can't reach.

## Files this plan creates / modifies

**New:**
- `audit/corpus_lint/tokenize.py`
- `audit/corpus_lint/lint.py`
- `audit/corpus_lint/apply_fixes.py`
- `audit/corpus_lint/report.py`
- `audit/corpus_lint/whitelist.txt`
- `audit/corpus_lint/archaic.txt`
- `audit/corpus_lint/anglicisms.txt`
- `audit/corpus_lint/fix_list.json` (gitignored — regenerated per run)
- `audit/corpus_lint/_report.md` (gitignored — regenerated)
- `audit/corpus_lint/_known_residual.md` (committed — the cataloged residual)
- `audit/corpus_lint/README.md`

**Modified:**
- `pipeline/explanations/generate.py` — add pre-commit lint hook
- Many `data/explanations/*.json` — fixes applied
- Many `data/parsed/*.json` — fixes applied (where applicable)
- `frameworks/*.json` — fixes applied if linter flags any tokens

## Risks + mitigations

1. **Linter false-positive flood** — first run flags too many
   legitimate words. Mitigation: aggressive whitelisting after first
   pass; ELF section excluded; proper-noun heuristic; HP-vocab seed
   list.

2. **Regen introduces new errors** — agent fixing one bug creates
   another. Mitigation: pre-commit lint hook (Phase H); explicit
   examples-of-what-NOT-to-do in regen prompts; spot-check 30 of
   every batch.

3. **Sonnet audit low precision** — different-model audit might
   flag too much noise. Mitigation: 300-entry sample first; only
   scale if precision passes a threshold (>30%).

4. **Whitelist drift** — every regen pass could be blocked by new
   words wordfreq doesn't know. Mitigation: whitelist is committed
   + reviewable; new additions require explicit justification in PR.

5. **Pedagogical regression** — fixes might dumb down explanations.
   Mitigation: trajectory simulation re-run as the final
   sanity-check (Phase G item 7).

## What we'll have when done

- `audit/corpus_lint/` as a permanent corpus-quality tool
- `audit/corpus_lint/expert_fix_list.json` showing every error
  flagged + fixed, indexed by class
- `data/explanations/*.json`, `data/parsed/*.json`, and
  `frameworks/*.json` with two-pass-clean Swedish
- A pre-commit lint hook preventing future regression
- A measurable error-rate trajectory (baseline → after wordfreq →
  after expert pass → after iteration → final)
- Conviction that "zero" is as close as automation can get without
  a native-speaker reading every word — and concrete numbers for
  what convergence looks like

The user's directive — "nothing should be wrong" — is honored
within the scope of what wordfreq + targeted regex + two-pass
expert audit + iteration to convergence can reach. The residual
after all that is roughly the same size as the residual after a
professional human proofreader pass (no editor is perfect either).
