# Worklog — hpf-90vb

## Findings

- 2026-11-10: Started on clean branch `codex/hpf-90vb-question-data-kva-020-host-2014-kvant2-option-d-has-a-stray-` at `87d0df4bf93b870de70691bfae565087cf50fbce`. No molecule controls this bead. Dependencies are present.
- Read all 27 served exam files: 4,320 questions and 18,145 options. Found 20 contaminated KVA D templates, three contaminated NOG E templates, and 20 ELF D options containing end-of-exam instructions plus a page-number footer. All 540 KVA A–C templates already match. NOG A–D have two established representations (plain and math-delimited); neither has a trailing artifact.
- Numeric-tail scan also finds legitimate thousands groups, signed values, algebra, years, labels, ratios, multi-column DTK answers, and damaged formula layouts. The main checkout has cached source PDFs, accessible read-only; `pdftotext -layout` can verify ambiguous tails offline.

## Decisions

- Use exact option corrections keyed by qid, letter, and complete old text in the existing post-parse curated fix list. Apply after the existing spelling/phrase corrections so regenerated parser spellings still match. Never strip arbitrary trailing numbers.
- Regression guards scan every served exam, enforce all four KVA templates and the NOG E template, reject page-footer chrome, and retain legitimate numeric endings.
- Preserve prompts, figures, answer keys, and unrelated Swedish text. Record every correction below; leave uncertain formula reconstruction outside this change.

## Progress

- [S:hpfetcher/codex-1|W:hpf-90vb|H:inspect|E:27-files-4320-questions-18145-options] Initial read-only audit complete; guards added before repairs.

## Handoff

- Work in progress. Delivery is uncommitted; coordinator owns review, signed commit, and publication. The accepted bead contract requires parking instead of closing.

### 2026-11-10: verified corrections (before application)

The expanded footer guard found four additional instruction-only tails: 24 ELF corrections total, of which 20 include a page number. Total: 61 exact corrections across 20 exams (20 KVA, 3 NOG, 24 ELF, 13 XYZ, 1 DTK). Math delimiters are shown as ⟦ ⟧ below.

| Question | Option | Before | After |
| --- | --- | --- | --- |
| host-2013-verb1-ELF-040 | D | The present system will have to be revised to be fair to all taxpayers PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | The present system will have to be revised to be fair to all taxpayers |
| host-2013-verb2-ELF-040 | D | It is difficult to avoid presenting intelligence in an oversimplified way PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | It is difficult to avoid presenting intelligence in an oversimplified way |
| host-2013-kvant2-XYZ-008 | D | 81⟦x^{12}⟧ ⟦y^{8}⟧ ⟦z^{4}⟧ 2 4 | 81⟦x^{12}⟧ ⟦y^{8}⟧ ⟦z^{4}⟧ |
| host-2013-kvant2-XYZ-010 | D | ⟦\frac{m}{7}⟧ x x x x 1 1 1 | ⟦\frac{m}{7}⟧ |
| host-2013-kvant2-DTK-040 | D | 19 gånger så många År 2002 | 19 gånger så många |
| host-2014-verb1-ELF-040 | D | Cleopatra appears in many cultural genres due to her intriguing life. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | Cleopatra appears in many cultural genres due to her intriguing life. |
| host-2014-verb2-ELF-040 | D | It provides few new insights but is nonetheless well worth reading. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | It provides few new insights but is nonetheless well worth reading. |
| host-2014-kvant1-XYZ-002 | D | 72 4 x + 1 4 17 | 72 |
| host-2014-kvant1-XYZ-010 | D | 2 · 2 · 39 1 5 45 | 2 · 2 · 39 |
| host-2014-kvant1-KVA-016 | D | informationen är otillräcklig 3 | informationen är otillräcklig |
| host-2014-kvant2-XYZ-005 | D | 3,8 16 22 | 3,8 |
| host-2014-kvant2-KVA-020 | D | informationen är otillräcklig 0,4 | informationen är otillräcklig |
| host-2015-verb1-ELF-040 | D | Brain activity seems relatively slow when briefly exposed to single words. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | Brain activity seems relatively slow when briefly exposed to single words. |
| host-2015-verb2-ELF-040 | D | a request for greater respect among researchers for forensic practitioners. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | a request for greater respect among researchers for forensic practitioners. |
| host-2015-kvant1-XYZ-010 | D | x > 2 6 | x > 2 |
| host-2016-verb1-ELF-040 | D | Iatrogenic deaths can easily be avoided with more solid research. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. | Iatrogenic deaths can easily be avoided with more solid research. |
| host-2016-verb2-ELF-040 | D | The discovery of new diseases for which there are no vaccines is unavoidable. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | The discovery of new diseases for which there are no vaccines is unavoidable. |
| host-2016-kvant1-XYZ-005 | D | 200 minuter 3 | 200 minuter |
| host-2016-kvant1-XYZ-010 | D | 24 cm 2 | 24 cm |
| host-2017-verb1-ELF-040 | D | The spread of democracy has tended to devalue the quality of education in many parts of the world. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | The spread of democracy has tended to devalue the quality of education in many parts of the world. |
| host-2017-verb2-ELF-040 | D | Many men continued to be suspicious of women’s involvement in diplomatic affairs. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | Many men continued to be suspicious of women’s involvement in diplomatic affairs. |
| host-2017-kvant1-NOG-026 | E | ej genom de båda påståendena 3 . 4 | ej genom de båda påståendena |
| host-2018-verb1-ELF-040 | D | They appear to have a well-developed sense of justice. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. | They appear to have a well-developed sense of justice. |
| host-2018-verb2-ELF-040 | D | Humans are likely to release fewer pheromones than most other species. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | Humans are likely to release fewer pheromones than most other species. |
| host-2018-kvant1-KVA-014 | D | informationen är otillräcklig 1 1 1 1 1 | informationen är otillräcklig |
| host-2018-kvant2-KVA-022 | D | informationen är otillräcklig 4  om man fyller på med den konstanta 5 2  om man fyller på med den konstanta 3 | informationen är otillräcklig |
| host-2020-kvant1-KVA-019 | D | informationen är otillräcklig 1 | informationen är otillräcklig |
| host-2020-kvant2-KVA-014 | D | informationen är otillräcklig ⟦\frac{1}{6}⟧ | informationen är otillräcklig |
| host-2021-kvant2-XYZ-010 | D | x = ⟦\frac{3}{2}⟧ · ⟦\frac{7}{4}⟧ 4 ? 7 | x = ⟦\frac{3}{2}⟧ · ⟦\frac{7}{4}⟧ |
| host-2021-kvant2-NOG-028 | E | ej genom de båda påståendena 2  av antalet gröna kulor som läggs i 3 | ej genom de båda påståendena |
| host-2022-kvant1-KVA-019 | D | informationen är otillräcklig ⟦3^{2}⟧ | informationen är otillräcklig |
| host-2023-kvant1-KVA-014 | D | informationen är otillräcklig ⟦5^{5}⟧ | informationen är otillräcklig |
| host-2024-kvant2-KVA-017 | D | informationen är otillräcklig x 2 y | informationen är otillräcklig |
| host-2024-kvant2-NOG-026 | E | ej genom de båda påståendena 3  av tiden som Agnes cyklar. 5 | ej genom de båda påståendena |
| host-ver1-2019-kvant1-XYZ-010 | D | 77 1  av arean av cirkeln B. 4 | 77 |
| host-ver1-2019-kvant1-KVA-020 | D | informationen är otillräcklig Koordinatsystemet kan användas för att lösa uppgiften. | informationen är otillräcklig |
| var-2013-verb1-ELF-040 | D | The author has written a fairy tale taking place in India PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | The author has written a fairy tale taking place in India |
| var-2013-verb2-ELF-040 | D | It should replace language instruction in kindergarten PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | It should replace language instruction in kindergarten |
| var-2013-kvant1-XYZ-005 | D | 72 x(y - z) 1 | 72 |
| var-2013-kvant1-KVA-015 | D | informationen är otillräcklig . | informationen är otillräcklig |
| var-2014-verb1-ELF-040 | D | The Indian government has managed to prevent Congo fever from spreading. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | The Indian government has managed to prevent Congo fever from spreading. |
| var-2014-verb2-ELF-040 | D | He finds it a good example of a book within the ‘real-life spy story’ genre. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | He finds it a good example of a book within the ‘real-life spy story’ genre. |
| var-2014-kvant1-XYZ-008 | D | 6 1 | 6 |
| var-2015-verb1-ELF-040 | D | Well-established cultural celebrities led quite unconventional lives at the time. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | Well-established cultural celebrities led quite unconventional lives at the time. |
| var-2015-verb2-ELF-040 | D | It has a lot to offer but suffers from an overly complicated style. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | It has a lot to offer but suffers from an overly complicated style. |
| var-2015-kvant1-KVA-020 | D | informationen är otillräcklig 1 -2 | informationen är otillräcklig |
| var-2015-kvant2-XYZ-011 | D | 6 1 | 6 |
| var-2016-verb1-ELF-040 | D | Their dubious behavior seems to be prompted by research. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. | Their dubious behavior seems to be prompted by research. |
| var-2016-verb2-ELF-040 | D | His connections with the art world were key to their international careers. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | His connections with the art world were key to their international careers. |
| var-2016-kvant2-KVA-016 | D | informationen är otillräcklig 1 | informationen är otillräcklig |
| var-2017-verb1-ELF-040 | D | A recently developed vaccine is less sensitive to high temperatures. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 15 – | A recently developed vaccine is less sensitive to high temperatures. |
| var-2017-verb2-ELF-040 | D | It shows that, despite new findings, the overall view of humans in relation to other animals is basically familiar. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | It shows that, despite new findings, the overall view of humans in relation to other animals is basically familiar. |
| var-2018-1-verb1-ELF-040 | D | It is well written but its style could have been more personal. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. – 13 – | It is well written but its style could have been more personal. |
| var-2018-1-verb2-ELF-040 | D | His new job was due not only to his eminent musical qualifications. PROVET ÄR SLUT. FINNS TID ÖVER, KONTROLLERA DINA SVAR. | His new job was due not only to his eminent musical qualifications. |
| var-2018-1-kvant1-KVA-013 | D | informationen är otillräcklig ⟦7^{2}⟧ | informationen är otillräcklig |
| var-2018-1-kvant1-KVA-018 | D | informationen är otillräcklig b = | informationen är otillräcklig |
| var-2022-1-kvant1-KVA-016 | D | informationen är otillräcklig ⟦2^{2}⟧ | informationen är otillräcklig |
| var-2022-1-kvant2-KVA-014 | D | informationen är otillräcklig ⟦\frac{Koordinatsystemet}{kan användas för}⟧ att lösa uppgiften. | informationen är otillräcklig |
| var-2022-1-kvant2-KVA-018 | D | informationen är otillräcklig 1 | informationen är otillräcklig |
| var-2023-kvant1-KVA-016 | D | informationen är otillräcklig Koordinatsystemet kan användas för att lösa uppgiften. | informationen är otillräcklig |
| var-2023-kvant1-KVA-018 | D | informationen är otillräcklig ⟦10^{3}⟧ | informationen är otillräcklig |

The 14 XYZ/DTK changes were verified against cached PDFs under /home/loucmane/dev/hpfetcher/data/pdfs/<exam>/<provpass>.pdf using pdftotext -layout. Examples: host-2015 kvant1 question 10 ends at x > 2; its trailing 6 belongs to question 11. host-2016 kvant1 question 5 ends at 200 minuter; the 3 is the next question numerator. Question 10 ends at 24 cm, so its trailing 2 is not a unit exponent. host-2013 kvant2 page 23 places År 2002 above the chart, while question 40 D ends at 19 gånger så många.

Red-first: initial pnpm test src/data/optionText.test.ts --maxWorkers=2 failed the KVA, NOG and footer guards (3 failed, 8 passed). After adding the curated-fix assertion, it also fails before application. A test-fixture shared-list alias was corrected before the final run; it did not affect corpus data.

### Numeric endings retained for separate formula-layout review

These candidates are incomplete fractions, powers, or mathematical layouts rather than confidently removable suffixes. No correction was guessed; their exact before/after text is unchanged:

| Question | Option | Unchanged text |
| --- | --- | --- |
| host-2013-kvant1-XYZ-002 | B | ⟦\frac{19 1710}{L 350}⟧= L 1710 |
| host-2013-kvant1-XYZ-002 | C | = 350 19 19 1710 |
| host-2014-kvant2-XYZ-008 | A | r + b + 5 |
| host-2014-kvant2-XYZ-008 | B | r + 5 r + b + 5 |
| host-2014-kvant2-XYZ-008 | C | r r + b + 12 r + 5 |
| host-2014-kvant2-XYZ-008 | D | r + b + 12 |
| host-2015-kvant1-XYZ-006 | B | 1 3 |
| host-2015-kvant1-XYZ-012 | C | 14 5 |
| host-2015-kvant2-XYZ-003 | C | 1 8 |
| host-2017-kvant1-XYZ-011 | D | ( -1) 4 4 |
| host-2018-kvant1-XYZ-012 | C | ⟦72^{·}⟧ 9 72 |
| host-2018-kvant2-XYZ-012 | D | 2x - 2 πx2 4 |
| host-2020-kvant2-XYZ-008 | B | 2 10 |
| host-2021-kvant2-XYZ-009 | B | x 5 |
| var-2014-kvant1-XYZ-001 | D | 10 9 |
| var-2014-kvant2-XYZ-012 | A | 6  cm 7 |
| var-2016-kvant2-XYZ-010 | C | 625 4 |
| var-2018-1-kvant2-XYZ-010 | B | 2 15 |
| var-2018-1-kvant2-XYZ-010 | C | 2 14  cm 25 |
| var-2018-1-kvant2-XYZ-010 | D | 2 21  cm 25 |

Legitimate numeric tails retained include thousands-separated values, algebraic constants, signed values, times, years, label numbers, ratios, and paired/table DTK values (including var-2019-kvant1-DTK-039 and var-2025-kvant1-DTK-036). The PDF for var-2014-kvant1-XYZ-001 confirms 10 9 is the fraction 10/9, not an orphan 9. NOG A–D math-delimited templates also remain unchanged.

## Verification and handoff — 2026-11-10

- Implementation complete: 61 exact option corrections in 20 exam files; all 27 exams audited. All changes remain within the admitted write set. No worker/ changes.
- Focused test: pnpm test src/data/optionText.test.ts --maxWorkers=2 — 13/13 PASS, including the real Python post-parse walker, exact qid/letter/text matching, dry-run, no-op reapplication, and spelling-before-option ordering.
- App pnpm typecheck — PASS (exit 0). App pnpm lint — PASS (exit 0; four existing informational diagnostics in unrelated bakeoff files).
- Full app pnpm test --maxWorkers=8 --reporter=dot — 205 files passed, 1 failed; 6202 tests passed, 1 failed out of 6203, 64.33 seconds. The only failure is src/lib/trapIndex.test.ts:39, which cannot spawn /usr/bin/node for its generator check (EPERM). The new option tests pass in the full run. No retry or sandbox workaround attempted.
- apply_typo_fixes.py --options-only dry run reported exactly 61 corrections, then --apply changed 20 files. A second dry run reported zero replacements and zero changed files.
- Semantic comparison against HEAD across every served JSON file proves the only changes are the 61 curated option texts; prompts, answers, figures and every other option are unchanged. Original JSON layout was preserved after the existing sweep reserialized files. git diff --check passes.
- git add was refused: /home/loucmane/dev/hpfetcher/.git/worktrees/hpf-90vb/index.lock is on a read-only filesystem. Changes remain unstaged and uncommitted. No signing, commit, merge, push or publication attempted.
- Base and current HEAD: 87d0df4bf93b870de70691bfae565087cf50fbce. Implementation manifest SHA-256: 0d6cecfe1111d0c73834afa92f9e0f292890baf7cad0daa55fc006133d5f5cab (SHA-256 of sorted lines consisting of each file SHA-256, two spaces, relative path, newline; excludes append-forward worklogs).
- [S:hpfetcher/codex-1|W:hpf-90vb|H:verify|E:13-focused-pass-6202-suite-pass-1-sandbox-block] BLOCKED only on host verification/staging. Coordinator must rerun the trap-index generator check outside the sandbox, stage/review this exact tree, and handle signed delivery. The bead remains open and will be parked deferred with worker_state=blocked.
- Review disposition: worker self-review complete; independent cross-vendor review pending. Remaining boundary: coordinator delivery, with no authority to publish or merge from this worker. The 14 recorded formula-layout question candidates are unchanged and need separate triage; they were not treated as removable numeric tails.

### Playbook proposal — gas-city-coordinator

2026-11-10 — Symptom: applying a handful of curated option fixes produced almost 10,000 diff lines in var-2018-1.json and expanded unrelated compact option arrays. Cause: the existing corpus sweep serializes complete JSON files with uniform two-space indentation. Rule: for a narrow bank correction, inspect the diff size, preserve the original layout, and compare parsed JSON against the intended qid/letter/text changes before handoff. The required proposal queue at /home/loucmane/scratch/skill-gotchas/gas-city-coordinator.md is outside this session writable roots; the proposal is retained here instead.

- 2026-11-10: Native Beads read-back confirms status deferred, empty assignee, worker_state blocked, and durable escalation note recorded. Implementation remains uncommitted and unstaged. Draining after this handoff.

## 2026-11-10 coordinator host verification

- Host: typecheck and lint clean, full app suite 206/206 files, 6203/6203 tests (the trap-index generator check passes on the host).
- Parsed-value review against main: exactly 61 option texts changed, all suffix removals; no other field, no qid set change, line diff +61/-61, no reformatting. Kinds: ELF "PROVET ÄR SLUT. FINNS TID ÖVER …" booklet footers (24), KVA option D tails after "informationen är otillräcklig" (19), NOG option E fragments (3), XYZ/DTK last-option figure labels (15).
- Idempotence: the new 61 option rules are no-ops on re-run. Separately, apply_typo_fixes.py in dry-run reports 206 word replacements in 14 files on clean main too (for example "kateterna" and "drift"). That predates this bead; follow-up.
- Follow-up: in host-ver1-2019 kvant1 KVA-020, var-2022-1 kvant2 KVA-014 and var-2023 kvant1 KVA-016, the removed tail was the real instruction "Koordinatsystemet kan användas för att lösa uppgiften.", which likely belongs in the question prompt.
