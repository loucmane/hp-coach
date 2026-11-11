# Worklog — hpf-ydaz

Marker: `YDAZ REASONING`

## Findings

- 2026-11-11: Claimed hpf-ydaz in its declared worktree (`/home/loucmane/dev/hpfetcher-worktrees/hpf-ydaz`, base `5fdff642125527bfdb0b2ecc1430b665d8c75eea`, branch `codex/hpf-ydaz-explanation-corpus-generator-reasoning-v-nta-hmm-vi-g-r-p-fa`). Tree clean apart from untracked dotfiles that are not mine; `app/node_modules` present.
- The two explanation stores were byte-identical at base (`git diff --no-index` showed only `data/explanations/p5-pilot.json`, which exists in one store only). Every edit was written to both stores from the same text.
- The JSON files mix literal U+E000/U+E001 characters with `\uE000`/`\uE001` escapes. Every new fence in this bead is an escape; untouched strings keep their original encoding byte for byte (the apply step re-serialised each original entry first and refused to run unless it reproduced the file exactly).
- The original exam PDFs (`/home/loucmane/dev/hpfetcher/data/pdfs/<exam>/<pass>.pdf`, read-only) and the DTK page images (`app/public/figures/dtk/`) were the ground truth. `hp_databas.json` loses radicals, fraction bars and superscripts (`$` is the PDF's `·` glyph), which is what misled the generator in the KVA/XYZ cases.
- Substring scans over-match (OVÄNTAT, FÖRVÄNTAN, VÄNTAN, förvänta). The guard matches whole words, case-sensitively.

## Per-question verdicts

Field paths are zero-based. "Rewrite" = whole entry re-derived (`_meta` keeps its generation fields and gains provenance stamps; `framework_id` unchanged so `trap-index.json` and worked examples stay current).

| # | Question | Flagged field | Verdict | Ground truth | Action |
| --- | --- | --- | --- | --- | --- |
| 1 | host-2018-kvant1-XYZ-001 | steps[8] | leaked ("Hmm — … BETYDER samma sak") | PDF p2: option D is 14^(46+35), a power; data had lost the exponent (two equal "correct" options) | **Bank fix** (options A, C, D). Rewrote steps[8].text, distractors[2] (D) tempting + wrong; `_meta.prompt_repaired` |
| 2 | host-2018-kvant1-KVA-019 | solution_path | leaked + wrong (read II as √(2/3), then "9/5 vs 3/2" to fit facit) | PDF p11: √(5/9) vs 2/3; data correct | Rewrite (√5/3 vs √4/3) |
| 3 | host-2020-verb2-ORD-003 | steps[0] | false positive ("nöjer dig inte med att vänta, du …") | — | none |
| 4 | host-2020-kvant1-KVA-020 | steps[5].title | leaked ("Mest sannolik tolkning", built on a stale 27³ parse) | PDF p11: 27^(1/3) vs 9; data correct | Rewrite (tredjerot = 3 < 9) |
| 5 | host-2023-kvant1-NOG-024 | steps[4] | leaked ("— vänta, stora = 43 ✓") | maths otherwise correct | steps[4].text |
| 6 | host-2023-kvant1-NOG-027 | steps[8] | leaked ("NEJ — vänta … Hm … Låt mig korrigera"); steps[7] had the typo 25471 it was correcting; solution_path also thought aloud ("Faktiskt: …") and wrongly ended with three candidates | E correct; two numbers 25741 and 43782 | solution_path, steps[7].text, steps[8].text |
| 7 | host-2023-kvant2-KVA-013 | solution_path | leaked (the headline case) | PDF p8: √x · √x vs x; data had lost both radicals | **Bank fix** (prompt). Rewrite; `_meta.prompt_repaired` |
| 8 | host-2023-kvant2-XYZ-001 | distractors[1].why_tempting | leaked ("… vänta, eller bara …") | C = x + 16 comes from dividing only the x-term | distractors[1] tempting + wrong (wrong did not explain x + 16); review fix: distractors[2].why_tempting invented "− 6" |
| 9 | host-ver1-2019-kvant2-NOG-026 | solution_path | leaked ("— vänta, … Faktiskt: … Nej") | A correct | solution_path |
| 10 | var-2013-kvant2-KVA-020 | steps[4] | leaked ("— vänta, då är z > y") | PDF p11 figure: interior angles; rest correct | steps[4].text |
| 11 | var-2014-kvant2-DTK-036 | distractors[2].why_wrong | leaked ("— vänta, 142 är 2005-talet"); whole entry guessed an ~18 % share from a "manga boom" | p20 table: 735 översatta förstaupplagor 2006; p21 pie (question page): japanska 17,5 % → 128,6 ≈ 130 | Rewrite; `_meta.figure_corrected` |
| 12 | var-2016-kvant1-DTK-034 | distractors[2].why_wrong | leaked ("Hmm … facit avgör"); values from neighbouring rows; claimed 1992/93 met all three conditions | p18 table: 1992/93 has 185 utländska premiärer (Totalt 204); 1987/88 Sv premiär 2 432 304 | Rewrite; `_meta.figure_corrected` |
| 13 | var-2016-kvant2-NOG-024 | solution_path | leaked ("nej — … fel — vänta") | C correct (r = AF + FC = 5 + 8) | solution_path |
| 14 | var-2016-kvant2-NOG-027 | steps[7] | leaked ("— vänta, då är alla 4 … Vänta:"); the entry claimed "2, 3 eller 4" — three 69s are impossible (the fourth is forced to 69) | E correct, counts are 2 or 4 | solution_path, steps[6], steps[7], steps[11], distractors[0–2].why_wrong |
| 15 | var-2017-kvant2-KVA-013 | solution_path | leaked ("Hmm. … Per facit A"); placeholder steps ("Samma.", "Ja.") | PDF p8: I = 10/3, II = (3·5·26)/(13·15) = 2; data glued II's numerator onto I | **Bank fix** (prompt). Rewrite; `_meta.prompt_repaired` |
| 16 | var-2019-kvant1-DTK-030 | steps[7] | leaked ("Hmm — men det överskattar"); readings invented (1990 ≈ 700) and choice anchored on facit | p16, measured against the grid: ≈ 571, 582, 810, 885, 926, 943, 939, 990, 968, 982, 1001 → mean ≈ 872 → 850 | Rewrite; `_meta.figure_corrected` |
| 17 | var-2022-1-kvant1-DTK-030 | steps[6] | leaked ("Hmm — det ger 1 år … Behöver omläsning"); then forced 2003 to qualify | p16, measured: 11–15 år 15/10/9/13/14/9/28/15/12/8, 16–20 år 3/3/1/8/9/1/10/3/8/8 → only 2002, 2009 | Rewrite; `_meta.figure_corrected`. B = counting 2003 (exactly 10), C = second condition only (5 years), D = first only (6) |
| 18 | var-2024-kvant1-XYZ-011 | solution_path | leaked ("= 5/9... vänta, vi måste tänka noggrannare") | D correct | solution_path |
| 19 | var-2024-kvant2-DTK-032 | distractors[0].why_wrong | leaked ("Hmm … mina avläsningar … facit som auktoritativ källa") | p18 pie: Illegal jakt 20, El 84, Vindkraftverk 4, Annan olycka 16 (legend order = slices clockwise); A = 104 ≈ 503/5 | Rewrite; `_meta.figure_corrected` |
| 20 | var-2024-kvant2-XYZ-012 | solution_path | leaked ("Vänta — låt mig kolla … Hmm"); concluded D against key C and listed C as a distractor | PDF p7: options B √3, C √5; data correct | solution_path, steps[7–11], all distractors (C entry → D), pitfall; `_meta.rewritten` |
| 21 | var-2025-verb2-ORD-008 | distractors[1].why_tempting | false positive (ALL-CAPS gloss "VÄNTA SIG") | — | none; allow-listed in the guard |
| 22 | var-2026-kvant1-KVA-018 | steps[9] | leaked ("Ja: 3 + 8? — nej … Hmm — inget 20") | D correct | steps[9].text; review fix: solution_path claimed II can equal 20 (sum of three odd numbers is odd) |
| 23 | var-2026-verb2-LÄS-020 | distractors[1].why_tempting + solution_path | why_tempting leaked ("Sandman… vänta, fel text"); solution_path false positive ("om en afrikansk vår är att vänta") | — | distractors[1].why_tempting only |

Totals: 21 entries changed in each store (12 files per store), 2 false positives left untouched, no answer key changed.

### Question-bank repairs (`app/public/data`, against the exam PDFs)

| Question | Field | Before | After |
| --- | --- | --- | --- |
| host-2018-kvant1-XYZ-001 | options[0] (A) | `⟦14^{·}⟧ 46+35` | `⟦14 \cdot 46 + 35⟧` |
| host-2018-kvant1-XYZ-001 | options[2] (C) | `⟦14^{·}⟧ (46+35)` | `⟦14 \cdot (46 + 35)⟧` |
| host-2018-kvant1-XYZ-001 | options[3] (D) | `14(46+35)` | `⟦14^{(46 + 35)}⟧` |
| host-2023-kvant2-KVA-013 | prompt | `x > 0 Kvantitet I: x · x Kvantitet II: x` | `x > 0 Kvantitet I: ⟦\sqrt{x} \cdot \sqrt{x}⟧ Kvantitet II: x` |
| var-2017-kvant2-KVA-013 | prompt | `Kvantitet I:\t ⟦\frac{10}{3}⟧ ⟦3^{·}⟧ ⟦5^{·}⟧ 26 Kvantitet II: ⟦13^{·}⟧ 15` | `Kvantitet I:\t ⟦\frac{10}{3}⟧ Kvantitet II: ⟦\frac{3 \cdot 5 \cdot 26}{13 \cdot 15}⟧` |

⟦ ⟧ stand for the U+E000/U+E001 fences. Answer keys (C, C, A) unchanged and consistent with the repaired questions. No BLOCKED qid.

## Self-review (pedagogy-review + expert-language-review), per rewrite

Both skills were worked as checklists on every changed field: fact-check of every number against the PDF/figure, one believable named misconception per distractor (and each distractor's arithmetic reproduces its option), no surface tells, opener variety within each entry, no facit appeals, then the Swedish hunt-list (calques, register, agreement, word order).

- Pedagogy: all 21 SOUND after these fixes from the review pass: KVA-019 B's step reference (now steg 4 och 6); KVA-020 cube-root wording ("upphöjt till 3", not "gånger sig självt tre gånger"); XYZ-001 (host-2023) D "täljaren" → "bråket"; var-2017 C now names a real heuristic (a reducible fraction "built to equal" the other side); DTK-030 (var-2019) states distances 20 vs 80 instead of "fyra gånger"; DTK-032 C share 17,5 %; XYZ-012 dropped "avrundning uppåt". Every rewritten distractor now reproduces its option's number (e.g. DTK-036: A = 11 % · 625 ≈ 69, B = 17,5 % · 625 ≈ 109, D = 17,5 % · 877 ≈ 153; XYZ-012: A = 2 · 20/25, B = √(4 − 1), D = 2 · 1,25, matching trap XYZ-TRAP-043). Pregrade tactics give the method, not the answer.
- Language: all 21 PUBLISH_READY after the edits above. No calques or register breaks; "dottad" (anglicism) replaced by "prickig" in the rewritten DTK-030 (var-2022-1) tactic; "cirkeldiagram", "teckenförklaring" and "rutnät" replace "paj", "legend" and "tick-värden" in rewritten text.
- Not changed (outside the flagged fields, noted for a follow-up): typo "divsion" and hyphenation residue "gynn- samt" in var-2024-kvant1-XYZ-011; "tack- samt"/"blyg- samt" in var-2025-verb2-ORD-008 steps[1]; "ter- men" in host-2018-kvant1-XYZ-001 (steps[11], pregrade_tactic); var-2026-kvant1-KVA-018 distractor C's why_tempting argues against C instead of naming a temptation; "Mata fram" in host-2023-kvant2-XYZ-001 steps[0]; the mangled NOG statement markers `⟦(_{1}⟧ )` in the var-2016 NOG prompts (known parser cosmetic).

## Guard test — `app/src/data/explanationReasoning.test.ts`

- Scans every string (titles, steps, distractors, `_meta`) in every served `app/public/explanations/*.json` exam file for: `VÄNTA` (whole word), `Hm+`, `Men vänta`, `Vi går på facit`, `Mest sannolik tolkning`, `Okej, så`, `Ah,`, plus `vänta,` directly after a dash or an ellipsis. A bare "vänta," stays legal ("att vänta, du …"); every leaked "vänta," in the corpus followed "—" or "…", so this closes the gap without the false positives. Case-sensitive, Unicode letter boundaries.
- Allow-list (file + qid + field + marker): one entry, var-2025-verb2-ORD-008 `distractors[1].why_tempting` / VÄNTA. A second test fails if an allow-listed field stops containing its marker, so stale exemptions surface.
- Also asserts `data/explanations` is byte-identical to the served store for every exam file, and that the five repaired bank fields hold the restored LaTeX as one fenced span and render through `MathText` without a KaTeX error or raw command.
- Marker semantics table (18 cases) documents what does and does not match.

## Verification

- Red first (before any data change): `pnpm -C app test src/data/explanationReasoning.test.ts --maxWorkers=2` → 6 failed / 17 passed: the corpus scan listed 15 hits; all five repaired-field checks failed on the old data. After adding the dash-anchored `vänta,` marker the scan listed 26 hits in 21 entries (exactly the real leaks; no false positive flagged).
- Green: `pnpm -C app test src/data/explanationReasoning.test.ts src/data/explanationFences.test.ts src/data/bankMath.test.ts src/data/explanations.test.ts src/data/questions.test.ts src/data/workedExamples.test.ts src/lib/trapIndex.test.ts src/data/optionText.test.ts --maxWorkers=4` → 8 files, 110/110 passed (KaTeX parses every span incl. the new ones; no LaTeX outside fences in the bank; `build_worked_examples: up to date (140 examples)`; trap index current).
- `pnpm -C app typecheck`: PASS. `pnpm -C app lint`: PASS (4 pre-existing infos in devbake files, none mine).
- Parsed-value check against HEAD (independent script): both stores identical for all 13 write-set exams; 21 changed entries, exactly the inventory above; literal PUA counts never increased (every new fence escaped); bank: only the 5 listed fields changed, answer keys equal.
- Full suite: see Final.

## Follow-ups (outside this bead's write set or scope; not edited)

1. host-2024-kvant1-DTK-036 `steps[4]`: "Vänta, OK detta är ett gränsfall … Faktiskt: …" — leaked reasoning; `host-2024.json` is not in the write set.
2. More generator-voice families the bead's marker list does not cover:
   - "Per facit X" — about 60 KVA entries from recipe `variant-c-regen-wave-missing-fill` (e.g. host-2016-kvant1-KVA-015, host-2016-kvant2-KVA-017, host-2018-kvant1-KVA-014/017, host-2020-kvant2-KVA-015, host-2020-kvant1-KVA-021, host-2021-kvant1-KVA-022, host-2022-kvant2-KVA-022, host-2023-kvant1-KVA-017, host-2025-kvant1-KVA-013, var-2013-kvant1-KVA-018/021, var-2014-kvant2-KVA-014, var-2016-kvant2-KVA-017, var-2022-1-kvant1-KVA-020, var-2022-1-kvant2-KVA-019, var-2023-kvant1-KVA-019, var-2023-kvant2-KVA-018, var-2026-kvant2-KVA-014, …). Several compute one answer and then defer to facit; like this bead's KVA cases they likely sit on misparsed prompts and need the PDF-first treatment.
   - "Vänta —" at sentence start: host-2017-kvant1-XYZ-012 steps[9].title, host-2017-kvant2-KVA-021 solution_path, host-2018-kvant1-NOG-026 steps[8].title, host-2020-kvant1-NOG-025 steps[8], host-ver1-2019-kvant2-KVA-021 and NOG-024 solution_path, var-2013-kvant1-NOG-026 solution_path ("Låt mig tänka om"), var-2015-kvant2-DTK-029 distractors[0].why_wrong ("låt mig återgranska"), var-2016-kvant1-XYZ-003 steps[9], var-2016-kvant2-NOG-023 steps[7].title. (var-2016-verb1-ORD-004 "Vänta på" is genuine.)
   - "Faktiskt:" (host-2021-kvant1-DTK-035 steps[8], var-2025-kvant2-XYZ-010 steps[10].title); "mina avläsningar" (host-2024-kvant2-DTK-029 steps[6]); pixel coordinates exposed in var-2023-kvant2-DTK-034 steps[5] ("x = 600 i pixlar … Mest sannolikt 190 km").
   Once fixed, extend the guard with "Vänta —", "Låt mig", "Faktiskt:", "Per facit", "facit avgör" and "i pixlar".
3. Figure gap: var-2014-kvant2-DTK-036 needs the language pie chart printed on the question page (PDF p21), but `app/public/figures/dtk/_index.json` maps the question only to p20, so the app shows the table without the 17,5 %. Same class as the known var-2019-kvant2-DTK-037 gap.
4. The redesign-fixture generator was not run; none of the changed questions is a fixture question, and its source-parity tests run in the full suite.

## 2026-11-11 coordinator host verification

- Host: typecheck and lint clean, full app suite 211/211 files, 6327/6327 tests. KaTeX scan of app/public/explanations: 14315 spans, 0 errors.
- Bank check against HEAD: 3 questions changed (host-2018 kvant1 XYZ-001 options; host-2023 kvant2 KVA-013 and var-2017 kvant2 KVA-013 prompts); every answer key unchanged.
- Needs a Codex exact-head review before merge (Claude-built).
