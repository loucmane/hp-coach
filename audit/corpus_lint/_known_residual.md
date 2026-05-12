# Known residual — corpus quality

This document catalogs deliberate decisions made during the multi-pass
corpus-quality audit. If you're auditing the corpus later and find one
of these patterns, **don't reintroduce a fix** — it was considered and
preserved on purpose. If context has changed and the rationale no longer
holds, update this file and surface the change.

The audit pipeline lives in `audit/corpus_lint/`. Process docs:
`hashed-twirling-zephyr.md` (current plan) +
`audit/_plans_archive/` (historical).

---

## 1. `fel rektion` → `fel kollokation` (rewrite KEPT)

**Context.** Pass-1 found ~426 sites in MEK rationales using "fel
rektion" to mean "wrong word-choice fit". In linguistics, *rektion* is
verb government (a verb's prepositional argument frame, e.g. `tycka om
någon`). The audit consensus across the early-harvest waves was that
this was a misuse — *rektion* doesn't cover collocation, lexical
selection, or semantic category errors — and 26 of 27 audit batches
agreed the rewrite improved clarity.

**Mass-fix applied (Phase F.1 wave 3):** 426 occurrences corpus-wide
rewritten per case:
- `fel rektion` → `fel kollokation` (lexical-pair mismatches)
- `fel rektion` → `fel betydelse` (semantic mismatches)
- `fel rektion` → `fel kategori` (paradigm/category mismatches)

**Dissent.** One Pass-3 batch (017) defended the original term as
"pedagogical jargon for wrong fit". The argument: students familiar
with the term *rektion* in its narrow grammatical sense can extend it
metaphorically and the wider audience benefits from a single covering
label.

**User META decision (2026-05-12).** **Keep the rewrite + document
here.** The native-speaker check sided with the 26-batch majority:
*rektion* in modern linguistics pedagogy is a technical term, not a
catchall, and using it for collocation errors would have confused
readers studying MEK who already know the actual meaning.

**If you later disagree** and want to revert, the mapping
(`fel rektion → fel kollokation/fel betydelse/fel kategori`) lives in
`audit/corpus_lint/typo_fixes.json` and the early-harvest commits
trail. Reverting is a single `apply_typo_fixes.py --invert` run.

---

## 2. ALL-CAPS coda style (KEPT as house convention)

**Context.** Many ORD distractor rationales use ALL-CAPS for
pedagogical emphasis:

> Tvång är YTTRE PRESS att handla; möda är INRE ANSTRÄNGNING.

Several audit passes flagged these as stylistic anomalies and proposed
rewrites to lower-case + italic. The pattern is **deliberate** — it
gives the dogfood user (ADHD-PI, target 2.0) a fast visual cue for the
conceptual contrast.

**User META decision.** **Keep the all-caps coda template.** Only fix
typos *inside* the all-caps strings (e.g. `OPENT → ÖPPET`,
`MÄNNISKLIG → MÄNSKLIG`). The structural template
`X är CAPS1; Y är CAPS2` stays.

**Enforcement.** `build_apply_list.py` post-filters any style-class
fix whose `final_fix` is identical to `snippet` lowercased (i.e. a
pure all-caps removal). 29 cycle-1 + 1 cycle-2 such fixes were
dropped automatically.

---

## 3. Middle-dot `·` (U+00B7) — disambiguated by context

**Context.** The corpus uses U+00B7 in two distinct ways:

1. **Quote marker** — `·X·` around a word/phrase, ~315 sites.
2. **Multiplication operator** — `12 · 6 = 72`, ~309 sites in
   math rationales.

**User META decision (cycle 3).** The quote-marker use was routed
through Pass-4 cycle-3 for in-context verification, then normalized
to standard Swedish double-quotes `"X"`. The multiplication operator
is preserved unchanged. The `build_pass4_cycle3_batches.py` regex
discriminates: it only fires when the inner content starts with a
letter and contains no internal middle-dot.

**If you find a middle-dot quote that survived the sweep**, it's
likely either (a) inside a math expression the regex couldn't tell
apart, or (b) the inner content has nested middle-dots. Either is
safe to leave; flag it manually if it causes a render issue.

---

## 4. `hitta själv i texten X` (canonical word order)

**Context.** A recurring LÄS template asks the student to verify the
text supports a claim. Two grammatical word orders surfaced during
the audit:

- `hitta i texten själv X` (preserves *själv* immediately after the
  verb position)
- `hitta själv i texten X` (more native Swedish word order)
- `hitta texten själv om X` (original, ungrammatical)

**User META decision.** Canonical form is **`hitta själv i texten X`**.
Cycle-3 Pass-4 verified 71 sites and rewrote them mechanically.

---

## 5. zero-frequency tokens (~4,469) — NOT all errors

**Context.** The wordfreq lint flags ~4,469 tokens that don't appear
in the `sv` frequency table. The vast majority are legitimate Swedish
compounds (`rektangelsida`, `summationspunkt`, `övergångsregler`)
that just aren't common enough to be in the lexicon. We don't try to
reduce this count further than the audit naturally does.

**Enforcement.** The lint is informational. A future change can
add a `whitelist.txt` entry per token if false positives cause
friction in a downstream check.

---

## 6. `the` inside quoted English citations (2 known sites)

**Context.** Two LÄS entries discuss English-language music/literary
criticism and quote source titles verbatim:

- `var-2014-verb1-LÄS-012` — Sedgwick's `'epistemology of the closet'`
- `var-2016-verb1-LÄS-011` — `'the Jacobean lutenists'` and
  `'Lutenists of the Golden Age'`

The Swedish solution_path quotes these English phrases as proper
nouns / book titles. The lint hook (`audit/corpus_lint/lint_entry.py`)
flags `the` as an English-bleed anglicism in both, which is a known
false positive — `the` IS English, but here it sits inside a
single-quoted citation, which is correct Swedish-academic style.

**Decision.** Keep `the` in `anglicisms.txt` (it's the strongest
signal for real English-bleed). Accept these 2 known false-positive
flags. The hook runs in `--lint warn` mode by default; both entries
save with the warning logged but no content change.

**If you later add quote-aware skip to lint_entry**, these are the
test cases to confirm the new rule preserves: both lines have
`'<EN phrase>'` (single quotes) with at least 3 English tokens
inside. Add a guard that skips tokens inside such spans.

---

## 7. ELF (English reading) section — Swedish lint does NOT apply

**Context.** ELF rationales are intentionally in English by exam
design — the section tests English reading comprehension. The
Swedish-quality audit explicitly excludes ELF.

**Enforcement.** `build_audit_batches.py` and `build_pass5_batches.py`
skip qids with `-ELF-` in their ID. If you add a Swedish-quality
check in CI later, exclude ELF the same way.

---

## How to add an entry here

If you make a deliberate decision to *not* fix a corpus pattern that
naive linting would flag, write a section like the ones above. Include:

- **Context** — what the pattern looks like in the corpus
- **Decision** — keep / revert / partial-fix
- **Rationale** — why the decision is correct
- **Enforcement** — where it's encoded (regex, filter, prompt, etc.)

This keeps future-eyes from re-litigating a closed question.
