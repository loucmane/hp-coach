# hpf-kihi — corpus follow-ups

## Findings

- 2026-11-13: Claimed hpf-kihi in its assigned worktree on base `328861d37c969ef4b69af06c61283a3dc50ec414`; clean tree, dependencies available, no molecule.
- Source `hp_databas.json` confirms the coordinate-system instruction belongs to `host-ver1-2019-kvant1-KVA-020`, `var-2022-1-kvant2-KVA-014`, and **`var-2023-kvant1-KVA-015`**. The brief's `016` is a parser attribution error: source question 15 contains the coordinate quadrilateral and instruction; question 16 contains only fraction comparisons. Both 2023 questions are in the approved `app/public/data/var-2023.json` file.
- Canonical and served explanation exam files and frameworks initially match byte for byte. `data/explanations/p5-pilot.json` is an audit artifact without a served twin; parity checks must use exam files rather than assume every canonical JSON file is an exam.
- The existing sweep omits served explanations/frameworks and counts every regex match, including identity replacements. The placeholder rules for `kateterna`, `drift`, and `Etisk` require review before applying anything.

## Decisions

- Restore the three source-verified instructions immediately before `Kvantitet I`, with exact qid/prompt rules. Keep question 016's mathematical prompt and all answer keys unchanged.
- Keep edits within the admitted write set. Preserve math content and ELF English. Serialize private-use math delimiters as JSON escapes.
- Add regression tests before implementation, then run the requested app checks with at most two workers. Leave source changes uncommitted for coordinator delivery.

## Progress

- [S:codex-1|W:hpf-kihi|H:inspect|E:source-text-and-store-comparison] Inspected source text, sweep code, rule list, residual contract, repository test patterns, and store inventories.

## Handoff

- Implementation and red-first verification pending.

## 2026-11-13 — red-first evidence and rule decisions

- Original Python dry run: 206 reported replacements in 14 files. The new Vitest test before implementation failed 3 of 4 checks: pending edits in 14 served files, missing instruction, and corruption/miscounting of correct text. Explanation parity passed. No corpus edits had been made.
- Removed `kateterna` (80 matches) and `drift` (66): identity placeholders for valid Swedish, not typos.
- Removed `Etisk` (13): identity placeholder that also wrongly capitalized lowercase `etisk`; retain the separate `Etisk och juridiskt` agreement rule. Existing text is preserved.
- Retained `av gud` (7): all corpus matches already have correct casing. Count only replacements that actually differ, so `av Gud` and `AV GUD` produce zero edits while lowercase `av gud` is still corrected.
- Retained `PEAK` (20 Swedish occurrences): all inspected contexts refer to a graph/traffic maximum. Use lowercase `kulmen` as the replacement base so source capitalizations remain meaningful; ELF occurrences stay English.
- Replaced broad `intercept` (7) with three verified phrases: `y-intercept`, `enklast intercept`, and `lutning −1 och intercept 10`. Three matches refer to y-axis crossings; the four `intercept-teoremet` / `Intercept-proportioner` geometry uses are preserved. The old rule would have produced `y-y-skärning` and misnamed a theorem. `x-intercept` is also protected by regression coverage.
- Tightened `negativ y` (4) with `exclude_hyphenated`: all current matches are the correct compound `negativ y-skärning`; preserve them. Standalone `negativ y` still becomes `negativt y`.
- Retained `Hypotetik` (2): malformed noun → `hypotes`; lowercase replacement base preserves lowercase prose and capitalized `Hypotetik-låsaren`.
- Retained `före du svarar` (1) → `innan du svarar`: action sequence.
- Retained `Båda tecken är möjliga` (1) → `Båda tecknen är möjliga`: definite plural, with the mathematical claim unchanged.
- Retained `groft` (1) → `grovt` and `specifierad` (1) → `specificerad`: spelling corrections.
- Retained `Total värde` (1) → `totalt värde`: neuter agreement; lowercase replacement base avoids capitalizing an interior phrase.
- Retained `ALLT FÖR` (1) → `ALLTFÖR`: the actual sentence is the intensifier “följer normen ALLT FÖR väl”, not the distinct construction “allt för någon”. Preserve the uppercase emphasis.
- Retained `Vart för sig` (1) → `Var för sig`: distributive idiom.
- All other existing rules had zero baseline matches and are unchanged. Exact option corrections remain intact. New exact prompt rules use the three source-verified qids; no answer keys change.
- Focused Python-backed regressions pass: actual edit counts and preservation, exact prompt replay and duplicate rejection, escaped math markers, canonical/served CLI routing, and options-only isolation (3 tests).
- Full pre-apply Python dry run reports 67 real replacements in 25 files, all inside the admitted write set: 32 prose corrections in each store plus three restored prompts. The two false-positive-only explanation files and `app/public/data/var-2016.json` need no edits after narrowing/removing rules.
- App typecheck passes. App lint passes after formatting the new test; four existing informational diagnostics remain in unrelated devbake files.

## 2026-11-13 — corpus application and semantic verification

- Applied the reviewed sweep: 67 real replacements across 25 admitted files. No changes were needed in the admitted `var-2016`/`var-2018-1` explanation files or the `var-2016` bank after removing false positives.
- The old serializer changed one-space explanations to two-space indentation and dropped final newlines. Updated the walker to preserve source indentation and final-newline style, added a regression, and restored the original layout of the 25 touched files. Private-use math delimiters are escaped as required; this accounts for most textual diff lines.
- Compared every changed corpus JSON with base `328861d37c969ef4b69af06c61283a3dc50ec414`: 59 changed string fields, with identical object keys, answers, numeric values/tokens, mathematical spans, multiplication dots, and ELF objects. The only semantic bank changes are the three intended prompt fields. All 25 rewritten corpus files contain no literal U+E000/U+E001 characters.
- Verified byte parity for all 28 canonical/served explanation exam pairs and all 9 framework pairs. `git diff --check` passes.
- Full app suite and final Python no-op dry run started after corpus writes finished.

## 2026-11-13 — BLOCKED handoff

- Final Python dry run: **TOTAL 0; Files changed: 0**, exit 0.
- Final app typecheck: exit 0. Final app lint: exit 0, four pre-existing informational diagnostics in unrelated devbake files.
- Full app suite, `pnpm test --maxWorkers=2`: **213 files passed, 2 failed; 6,354 tests passed, 2 failed** (172.93 seconds). All eight new typo-sweep tests passed, as did the existing option and corpus checks.
- The new failure is `src/components/devbake/redesign/r2Fixtures.test.ts > round-2 fixtures: frameworks, normering, passes and copy > indexes every catalog in exam order with the app’s own headwords`. `app/src/components/devbake/redesign/r2Fixtures.ts:3913` copies NOG-TRAP-011's tldr and still says `hypotetik`; the corrected canonical/served framework now says `hypotes`. That fixture file is outside the admitted write set. No edit or workaround was made there.
- Required companion: change that one copied kicker from `hypotetik` to `hypotes`, then rerun its existing fixture test. The coordinator must supply a companion change or a follow-up with the required path admitted. Do not remove the valid framework correction just to bypass the write-set boundary.
- The other failure is `src/lib/trapIndex.test.ts > committed trap index > equals what scripts/build_trap_index.mjs derives from the explanations`: `spawnSync /usr/bin/node EPERM`. It fails before running the generator; this is the documented sandbox limitation, not evidence of a stale index. Run the existing generator check on the host. No Node workaround was attempted.
- No worker files were touched, so worker checks do not apply. No implementation commit or independent review exists yet; source changes remain uncommitted on base `328861d37c969ef4b69af06c61283a3dc50ec414`. All implementation edits are inside the admitted write set. Merge/publication remain outside this worker's authority.
- State: **BLOCKED**, pending the fixture companion and host generator check. The bead must remain open/deferred, not closed or marked done.

### Playbook gotcha proposal

2026-11-13 — hpf-kihi: correcting `frameworks/nog_traps.json` tldr left the copied NOG-TRAP-011 kicker in `app/src/components/devbake/redesign/r2Fixtures.ts` stale; full app CI failed, but that fixture was outside the admitted write set. Before routing corpus or framework edits, trace pinned fixture copies and admit their companion paths (here `r2Fixtures.ts` and its existing test). Preserve source JSON indentation/newlines and compare semantic changes separately from required math-delimiter escaping.

Appending this proposal to `/home/loucmane/scratch/skill-gotchas/gas-city-coordinator.md` was refused with a read-only filesystem error. It is retained here for the coordinator to forward; no alternate write route was attempted.

## 2026-11-13 coordinator companion and host verification

- Companion (outside the admitted set): regenerated app/src/components/devbake/redesign/r2Fixtures.ts with `node scripts/redesign-fixtures.mjs` (`--check` passes).
- Host: typecheck and lint clean, full app suite 215/215 files, 6356/6356 tests; `apply_typo_fixes.py` dry run on the result: TOTAL 0, files changed 0 (a no-op).
- Bank: three prompts restored (host-ver1-2019 kvant1 KVA-020, var-2022-1 kvant2 KVA-014, var-2023 kvant1 KVA-015), answers unchanged (D, A, B). The worker's correction from the brief's KVA-016 to KVA-015 is confirmed against hp_databas.json.
