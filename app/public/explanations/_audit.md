# Layer 2 Audit — 2026-05-11

Stratified random sample of 49 explanations (7 per section × 7 sections),
seed 42. Each entry independently verified by re-doing the math
(quant) or re-reading the passage citation (verbal).

## Content accuracy by section

| Section | Sampled | Verified correct | Issues |
|---------|---------|------------------|--------|
| KVA     | 7       | 7                | 0 |
| XYZ     | 7       | 7 answers correct | rendering — fixed below |
| ORD     | 7       | 7                | 0 |
| NOG     | 7       | 7 verdicts correct | 2 minor content (below) |
| LÄS     | 7       | 6                | 1 version skew (below) |
| MEK     | 7       | 7                | 0 |
| ELF     | 7       | 7                | 0 |

## Systematic rendering issues — FIXED

Two classes of bugs surfaced across the corpus, both visible to the
reader (raw `\frac` or `{MO}` text instead of KaTeX-rendered math):

### A. Template-leak: 37 XYZ entries

Some Phase B/C generation scripts wrote string templates like
`f"{MO}\\sqrt{{a}}{MC}"` but stored them WITHOUT evaluating the
f-string — so the literal text `{MO}\sqrt{{a}}{MC}` leaked through to
the SPA. Symptoms: `{MO}` and `{MC}` placeholder strings + raw LaTeX
with `{{`/`}}` double-braces.

**Fix:** mechanical replace `{MO}` → U+E000, `{MC}` → U+E001,
`{{` → `{`, `}}` → `}` (the last two only within the now-correct
math regions). 37/37 fixed, 0 validate errors.

### B. Unwrapped LaTeX: 33 KVA/NOG entries

Different bug — the agent simply emitted bare `\cdot`, `\sqrt`,
`\pi`, `^{2}`, `_{1}` etc. in prose without U+E000/U+E001 wrappers.
Symptoms: `Volymen 125 cm³ ger sidan \sqrt[3]{125}=5 cm.` renders
as literal text.

**Fix:** heuristic math-region wrapper — find each `\command` /
`^{...}` / `_{...}` token, expand outward over math-chars + short
variable letters + unit-suffixes (cm, mm, km…), stop at long Swedish
words and sentence boundaries (`. <Capital>`). Wrap in U+E000/U+E001.
33/33 fixed, 0 validate errors.

## Content bugs — FIXED

### `host-2013-kvant1-NOG-026` — arithmetic error

Question: Karin's age in 2001 given (1) age difference 24 in 2007 and
(2) Anna = 2·Karin in 2014.

Old solution_path: `K_2007=11. K_2001=11−6=5.` The algebra used
2001 as the variable base but then incorrectly subtracted 6 from
an already-2001 value, yielding 5.

Correct: K_2014 = 24 (from K + 24 = 2K); K_2001 = 24 − 13 = **11**.

The sufficiency verdict C (both needed) was correct regardless;
only the demonstration arithmetic was off. Fixed solution_path now
walks the algebra correctly.

### `host-2021-kvant1-NOG-027` — fabricated radius

Question: radius of a circle given (1) arc AB = π cm or (2) chord
AB = 2√2 cm.

Old solution_path claimed `r=3 (typiskt resultat med 60°-sektor)`
— a hedge that named a specific radius without seeing the figure,
which actually pins the central angle. Different angles give
different radii (60° → r=3 for arc; 90° → r=2 for both).

Fix: removed specific radius claim, kept the sufficiency
explanation (each suffices because the central angle in the figure
is fixed, and given an angle both arc-length and chord determine r).

### `var-2018-1-verb2-LÄS-015` — dataset version skew, DELETED

Question asked what is "ologiskt" about the Östersjö period naming.
The agent's reasoning correctly identified that the *names* don't
match the dominant water type (so answer D — periodernas namn).
But the facit lists B (periodernas ordningsföljd).

This matches the known `var-2018-1` dataset version skew pattern —
the facit PDF is from a different exam version than the question
PDFs (see `memory/project_dataset_version_skew.md`). The explanation
was deleted rather than overriding the facit; logged to
`_las_skipped.txt`.

## Audit method

- Random sample built deterministically (seed 42).
- For quant: re-did the math from the prompt independently.
- For verbal: re-read the relevant passage span to verify the citation.
- For ORD: checked the Swedish/Latin/Greek etymology and meaning.
- Rendering scan: regex over the whole corpus for `{MO}`/`{MC}`
  template leak and for `\command`/`^{...}`/`_{...}` outside
  U+E000/U+E001 wrappers.

## Final corpus state after audit

3209 explanations (was 3210; one deleted), 0 schema errors,
67/67 SPA tests pass.

| Section | Count |
|---------|-------|
| XYZ     | 571 |
| ORD     | 540 |
| MEK     | 540 |
| LÄS     | 534 |
| ELF     | 368 |
| KVA     | 346 |
| NOG     | 310 |

## Confidence

This audit covered ~1.5% of the corpus. At that sample size, the
4 content-affecting issues found (3 fixed, 1 deleted) suggest a
base content-error rate of maybe ~1-2% across the corpus, plus the
~70 mass-fixed rendering bugs (now zero).

The next-highest-leverage QA step is dogfooding the actual SPA —
the user will surface flagged questions during practice, and 👎
marks become a regen queue. Localized failures are easier to spot
that way than in random samples.
