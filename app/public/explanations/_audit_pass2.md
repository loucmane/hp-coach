# Layer 2 Pass 2 Audit — 2026-05-11

Systemic semantic audit: 7 Opus 4.7 subagents in parallel, one per
section, each adversarially auditing its full corpus by independently
computing the answer from the prompt before reading the explanation.

## Per-section results

| Section | Audited | Verified | Discrepancies | Real bugs | Skew |
|---------|---------|----------|---------------|-----------|------|
| MEK     | 535     | 535      | 0             | 0         | 0 |
| LÄS     | 530     | 530      | 0 (169 info)  | 0         | 0 |
| KVA     | 345     | 343      | 2             | 2         | 0 |
| ORD     | 540     | 538      | 2             | 2         | 0 |
| NOG     | 310     | 301      | 9             | 3         | 6 |
| ELF     | 368     | 365      | 3 (info)      | 0         | 0 |
| XYZ     | 569     | 476      | 93            | 5         | 4 |
| **Total** | **3197** | **3088** | **109**     | **12**    | **10** |

**Real content-error rate: 0.38%** (12 / 3197).
The 91 XYZ "discrepancies" tagged `parser_corruption` are upstream
parser issues, not explanation bugs — the math reasoning is correct,
the prompt display is garbled. Filed separately.

## Actions applied

### Deletions — 15 entries

**var-2018-1 dataset version skew cluster (10):**
- `var-2018-1-kvant2-NOG-023` through `NOG-028` (6 entries) — agent
  flagged internal contradictions matching the known facit-mismatch
  pattern
- `var-2018-1-kvant2-XYZ-001`, `XYZ-002`, `XYZ-005`, `XYZ-006`,
  `XYZ-009` — answer_skew + distractor_error cluster

**Parser-truncated / corrupted (5):**
- `host-2014-kvant1-NOG-027` — (1) cut off mid-clause
- `var-2017-kvant1-NOG-027` — (2) cut off; agent conflated Markus's
  shirts (owned) with shirts washed
- `host-ver1-2019-kvant2-XYZ-005` — prompt shows `7^3=49` (false);
  original irrecoverable
- `host-ver2-2019-kvant2-XYZ-005` — same as ver1
- (1 already-handled in Pass 1: `host-2018-verb2-LÄS-017` —
  passage-truncated)

### Surgical fixes — 6 entries

1. `host-ver1-2019-kvant2-KVA-021` — cherry-picked 3-4-5 triangle
   example replaced with general triangle-inequality argument
   (perimeter > 2·hypotenuse = 10x for any right triangle with
   hypotenuse 5x).
2. `host-ver2-2019-kvant2-KVA-021` — same fix (byte-identical
   exam pair).
3. `host-2023-verb1-ORD-003` (dementera) — etymology corrected:
   French *démentir* (deny), not Latin *dementire* (madness). The
   madness association is folk-etymology.
4. `var-2018-1-verb1-ORD-003` (gemen) — etymology corrected:
   Middle Low German *gemein(e)*, not Latin *gemenus* (which
   doesn't exist).
5. `var-2025-kvant2-NOG-028` — enumeration miscount: agent listed 2
   candidate pairs after (1)∩(2), correct count is 3 (added missing
   pair `(−10, 7)`); verdict E remains correct.
6. `host-2018-kvant1-XYZ-012` — arithmetic: `√72/√8 = √9 = 3`, not
   `72/8 = 9`. Verdict D unchanged.

## Audit methodology

For each section the agent:
1. Read the queue of qids for its section.
2. For each qid: loaded prompt + options + facit from
   `data/parsed/<exam>.json`; loaded explanation from
   `data/explanations/<exam>.json`.
3. **Independently solved the problem** (math redo for quant, passage
   re-read for verbal, dictionary lookup for ORD, idiom check for
   MEK) before reading the explanation.
4. Compared its own answer + reasoning against the explanation.
5. Emitted `{qid, status, findings}` to `/tmp/audit/findings/<sec>.json`.

Adversarial framing in each brief: "Trust nothing the explanation
claims." Resume-aware: append-write findings every ~25 qids.
Read-only on the corpus → safe for parallel dispatch.

## Calibration insights worth keeping

- **Soft hyphens (U+00AD) + adjacent whitespace** break naive
  substring matching of citations against PDF-parsed passages.
  Strip together: `re.sub(r'\xad\s*', '', s)`.
- **LÄS passages end with author byline** (no period). Don't use
  "ends in period" as truncation heuristic.
- **Distractor `why_wrong` quotes often cite the option text**, not
  the passage. Treat option text + prompt text as legitimate
  citation targets.
- **Verdict-letter regex** must require capital letter + non-letter
  boundary, or it matches `alternativa` (lowercase, mid-word) as
  `alternativ A`.
- **Single Latin variables in math** confuse stopword-based
  language-detection: a Swedish entry like
  `f(x)=3x^{3}+2x^{2}-5x+1` looks like English to a naive scan.
- **host-ver1-2019 and host-ver2-2019** are byte-identical (parser
  populates both). 176 duplicate-solution_path findings were all
  legit reuse, not bugs.
- **Phantom citations in solution_path** were mostly paraphrases in
  quotation marks (pedagogically sloppy) rather than fabricated
  claims. Charitable rule: if the underlying answer is correctly
  defended, info-level not discrepancy.

## Final corpus state

3182 explanations (was 3197), 0 schema errors, 67/67 SPA tests pass.

| Section | Count |
|---------|-------|
| XYZ     | 562 |
| ORD     | 540 |
| MEK     | 535 |
| LÄS     | 530 |
| ELF     | 368 |
| KVA     | 345 |
| NOG     | 302 |

## Confidence

After Pass 1 (mechanical, all 3209) + Pass 2 (semantic, all 3197),
the corpus has been adversarially verified for:

- Schema compliance ✓
- Rendering (markers + math wrapping) ✓
- Answer-letter correctness ✓ (modulo dataset skew, now isolated)
- Citation accuracy ✓ (paraphrase-in-quotes flagged info-only)
- Math correctness ✓ (1 arithmetic fix applied)
- Etymology correctness ✓ (2 false-etymology fixes applied)
- Distractor letter coverage ✓
- Distractor reasoning soundness ✓
- Language consistency (English in ELF, Swedish elsewhere) ✓

Remaining work surfaces only via dogfooding — pedagogical quality,
ADHD-PI-friendly voice, cultural nuance in Swedish phrasings. The
`ExplanationPanel` 👎 button captures those for regen.

## Out of scope

- **91 XYZ parser-corrupted prompts** are display-layer bugs (math
  reasoning is correct). Filed for the parser-fix workstream.
- **var-2018-1** entire exam shows skew across kvant2 and verb2;
  kvant1 and verb1 are mostly intact but worth a focused re-scrape
  of the source PDFs to confirm version alignment.
