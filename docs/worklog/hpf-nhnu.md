# hpf-nhnu — Passage paragraph boundaries

## 2026-11-14 — Start

- Claimed the assigned bead; no molecule controls sequencing. Base: `5fe0287747e30f488d5793bcea1e3855d9dca461`; worktree initially clean.
- Dependencies and `hp_databas.json` are present. Work is offline, confined to the admitted write set, and remains uncommitted.
- Initial scan covered 330 distinct LÄS/ELF contexts across the exam bank. Found 248 blocks whose first letter is lowercase, including glossaries, a numeric title, and already-truncated older contexts. Titles and bylines also trigger a missing-terminal-punctuation heuristic, so no blanket joining rule is safe.
- Plan: source-check exact boundaries, preserve named exceptions, replay scoped context corrections through the existing post-parse sweep, and audit paragraph citations in both stores. Add the corpus guard before editing data for red-first evidence.

## Verification

Pending.

## Handoff

Implementation and verification in progress. Coordinator retains signing, review, and delivery.

## 2026-11-14 — Implementation and source audit

- Repaired 141 distinct LÄS/ELF passages, shared by 525 questions across all 27 admitted exam files. The final sweep contains 141 exact original-to-corrected context rules, scoped by question ID and reading section. It preserves real paragraph starts within PDF columns as well as joining false page/column boundaries. No runtime guessing from capitalization is used.
- Checked the raw text in `hp_databas.json`. Where flattened raw text interleaves columns or loses layout, checked the cached originals under `/home/loucmane/dev/hpfetcher/data/pdfs/<exam>/<verb1|verb2>.pdf` using `pdftotext -bbox-layout`. Paragraph indentation and line gaps identify source paragraph starts; text matching binds each insertion to its passage. Reviewed the proposed starts before applying them.
- The initially joined passages exposed another extraction defect: some entire columns were flattened, hiding true paragraphs. Restored those source breaks before the final citation audit. This supersedes the earlier progress note's provisional 217 fragment rules and 50 citation edits.
- 133 of the 141 repaired passages preserve the complete alphanumeric text in order. Eight source-checked exceptions are listed below. All bank fields other than `context` compare equal to the base, including every answer key, prompt, option, and parsing status. ELF content remains English.
- Final citation audit covered numeric, ordinal, possessive, plural, and spelled-out paragraph references in explanations for affected questions. Compared cited claims and quotations with the rendered paragraph numbering, including the adapter's instruction/title removal. Corrected 47 exact fields in 42 questions across 19 exams; canonical and served stores are byte-identical. No other explanation fields changed semantically. General study advice and the phrase `samma stycke 35 gånger` were not treated as numbered passage citations.
- Added 33 exact, question-scoped glossary/bullet exceptions and seven exact boundary exceptions for signed letters and a poem. The corpus guard checks all reading passages through the production drill adapter, including punctuation before lowercase letters and unfinished preceding prose. Named tests cover the reported `grubbleriets ekorrhjul` and carbon-dioxide examples, plus preservation of true paragraphs across a column join.
- Extended the existing post-parse sweep to apply context and exact explanation-field repairs. The normal parser pipeline already invokes this sweep. `--passages-only` enables a narrow audit; `--options-only` remains isolated. Tests exercise replay, idempotence, duplicate rejection, field/question/section isolation, and both explanation stores.
- JSON serialization preserves each edited file's indentation and escapes U+E000/U+E001. Removed serialization-only diffs from explanation files with no citation changes. No dependencies, parser inputs, historical control-plane files, or fixture code were changed.

### Source-checked exceptions to whitespace-only repair

| Passage | Evidence and repair |
| --- | --- |
| `host-2015-verb2-LÄS-017` through `020` | Joined interrupted sentences, moved the displaced `doxa` glossary after the byline, and removed a leaked `Uppgifter` heading. |
| `host-2017-verb1-ELF-033` through `037` | Restored the missing opening column of Religion and Well-being from verb1 PDF page 12. |
| `host-2018-verb1-LÄS-017` through `020` | Restored the missing opening of Tio år eller livstid from PDF pages 6–7. |
| `host-2018-verb2-LÄS-017` through `020` | Restored the missing opening of Hälsa, vård och tillväxt from PDF pages 6–7. |
| `var-2018-1-verb1-LÄS-017` through `020` | Restored the missing opening of Bussförare och tillit from PDF pages 6–7. |
| `var-2018-1-verb2-LÄS-013` through `016` | Restored the missing opening of Yoldiahavet from PDF pages 4–5. |
| `var-2018-1-verb2-LÄS-017` through `020` | Restored the missing opening of Kollektiva minnen from PDF pages 6–7. |
| `host-2023-verb1-ELF-040` | Restored the PDF's 16th- and 17th-century superscript ordering on page 15. |

The six recovered openings retain the entire old body in order after layout/hyphen normalization. The glossary move and superscript ordering are deliberate, scoped exceptions; no answer key changed.

## 2026-11-14 — Verification evidence

- Red first: the new reported-sentence and corpus guard tests failed against the untouched bank, showing the split after `grubbleriets` and the lowercase continuation scan. They pass after repair.
- Final focused run: `pnpm test src/data/passageParagraphs.test.ts src/data/typoSweep.test.ts --maxWorkers=2` — 2 files, 14 tests passed, 3.67 s.
- Final `pnpm typecheck` — passed.
- Final `pnpm lint` — passed; four pre-existing informational notices in unrelated devbake components, no new diagnostics.
- `python3 -B audit/corpus_lint/apply_typo_fixes.py --passages-only` — zero pending replacements, zero changed files.
- Semantic audit — all 27 banks retain every non-context field; exactly the declared 47 explanation fields differ per store; both stores match byte for byte; no literal math delimiters in edited JSON.
- `git diff --check` — passed.
- Earlier full app run: 6,367 tests passed; one generator test failed with `spawnSync /usr/bin/node EPERM` in `src/lib/trapIndex.test.ts`. A final full run is in progress after the source-layout and citation refinements; its result will be appended below.
- R2 fixture source inspection confirms the changed reading contexts/citations are not fixture inputs: R2 uses the specified quantitative questions, unchanged repetition prompts, the synthetic ELF sample, frameworks, normering, and pass counts. No regeneration is needed. The required standalone `NODE_OPTIONS=--max-old-space-size=3072 node scripts/redesign-fixtures.mjs --check` produced no output and did not complete; it was interrupted once, exit 130. It was not retried. The coordinator must run this command on the host. R2 fixture tests passed in the earlier full suite.

## 2026-11-14 — Gotcha proposal and remaining verification

- Proposed for the machine's gas-city-coordinator playbook: raw PDF text can interleave columns, bank separators can contain four newlines, and some bank blocks flatten a whole column or omit an opening page. Inspect cached PDF layout, handle the entire separator, and verify both lowercase continuations and preservation of real paragraphs before renumbering citations.
- Attempting to append this proposal to `/home/loucmane/scratch/skill-gotchas/gas-city-coordinator.md` was rejected because that directory is outside the session's writable roots. The proposal remains recorded here for the coordinator to transfer; no alternate scratch location or permission workaround was used.
- Changes remain uncommitted. Host generator verification and the coordinator's independent exact-head review/signing/delivery remain outstanding. Final state and staging evidence follow below.

## 2026-11-14 — Final result: BLOCKED

- Final full run: `pnpm test --maxWorkers=2` — 6,367 passed, two failed; 214 test files passed and two failed, 148.10 s. The new passage tests and existing typo sweep passed. R2 fixture tests also passed.
- Failure 1: `src/lib/trapIndex.test.ts:39`, generator subprocess `spawnSync /usr/bin/node EPERM`. The coordinator must rerun the generator check on the host.
- Failure 2: `app/src/folio/screens/drill/toDrillQuestion.test.ts:119` hardcodes the old flattened paragraph numbering for `var-2026-verb2-LÄS-017`. The exact expected entry is currently `{ ordinal: 1, before: 2, after: 1 }`; source-corrected content produces `{ ordinal: 2, before: 3, after: 2 }`. The cited contrast between northern and southern Africa is in source paragraph 2. The question-mark title remains correctly excluded by the adapter.
- That test file is outside the bead's admitted write set. It was inspected but not edited. Required help: authorize or perform the expectation/comment update in `app/src/folio/screens/drill/toDrillQuestion.test.ts`, rerun the relevant audit/full suite, and run the outstanding standalone R2 generator `--check` on the host. Do not undo the source paragraph restoration to satisfy the stale expectation.
- Acceptance is not complete, so the worker will record `blocked`, leave this bead open, park it deferred with no assignee, and acknowledge drain. No commit, push, merge, or publication was performed.
- One authorized staging attempt failed: Git could not create `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-nhnu/index.lock` because the shared Git metadata is read-only. No retry or workaround was attempted. The deliverable remains uncommitted and unstaged; the coordinator must stage it on the host.

## 2026-11-14 coordinator companion and host verification

- Companion (outside the admitted set): app/src/folio/screens/drill/toDrillQuestion.test.ts, the pinned reading-ordinal audit row for var-2026-verb2-LÄS-017 updated from 1/2/1 to 2/3/2, because the passage's restored paragraph breaks shift its numbering.
- Host: typecheck and lint clean, full app suite 216/216 files, 6369/6369 tests; fixtures up to date (`--check` passes); typo sweep dry run TOTAL 0 (a no-op); contract and infold pytest 587 passed.
- Bank check against HEAD: 27 files, 525 questions changed, only the shared passage `context` field; no answer keys changed.
