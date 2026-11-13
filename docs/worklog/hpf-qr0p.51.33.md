# Worklog — hpf-qr0p.51.33

## Findings

- 2026-11-13: Claimed LJ-27 at base `328861d37c969ef4b69af06c61283a3dc50ec414`; no molecule. Read the accepted contract, rebuild map §0/§1/§2/LJ-27, and r6/A direction, tokens, provkorning markup and reference shots.
- ReadingSpread currently uses a continuous phone document with a folding facit drawer. SessionPlayer supplies the focus-bar location; its reading stage also renders the same location in DrillHead. FolioPassRun consumes ReadingSpread without grading.

## Decisions

- Follow the approved two-sheet desktop composition and Texten/Frågan phone tabs. Keep passage and question mounted to retain DTK rotation, input state and complete facit content; restore each tab's scroll position.
- Retain ReadingSpread's public props, source attribution, DTK block cue and controls, ELF language, citation navigation, and the quant path. Keep the phone dock outside Lit.
- Restrict source edits to the accepted write set. Coordinator owns signed delivery and the four-mode LÄS/ELF/DTK visual check.

## Progress

- Implementation and verification pending.
- Red-first: `pnpm test src/folio/screens/drill/PhoneSheet.test.tsx src/folio/screens/drill/ReadingSpread.test.tsx src/folio/screens/drill/FolioSessionStage.test.tsx --maxWorkers=2` failed as expected: 5 failures, 63 passes. Failures identified the missing tabs, missing lit question sheet, and duplicated LÄS/ELF/DTK headings. Production changes began only after this run completed.
- Additional red-first: PhoneSheet/ReadingSpread (2 workers) had 2 failures and 15 passes, proving that a new question incorrectly restored the prior question's scroll and that the reading action had not yet adopted Go. New questions now start at the top while passage scroll persists within the block; reading actions use the shared Go primitive without changing quant markup.
- Consumer regression red-first: FolioPassRun had 1 failure and 24 passes when navigating forward and back after selecting Texten. A derived default without updating the saved question key revived a stale Texten selection and hid the focused question. ReadingSpread now commits each question/phase transition to Frågan; FolioPassRun source remains unchanged.
- Implemented two desktop sheets, ¶ paragraph labels, source captions, a lit question and Go action; phone Texten/Frågan tabs with keyboard navigation, independent scroll memory, question resets, and a fixed dock outside Lit. DTK rotation, enlargement and same-figure cues remain; monochrome SVG plates follow the existing dark-theme convention. ELF language and complete facit content are retained. QuantPage, classic code, dependencies, and FolioPassRun source are unchanged.
- Final `pnpm typecheck`: PASS (exit 0).
- Final `pnpm lint`: PASS (exit 0), 790 files checked; four pre-existing informational devbake notices, no errors.
- Focused four-file suite: PASS, 94/94 tests, with axe checks in both phone tabs and reading question/feedback states. Final rerun also covers the small CSS finishing changes (unbroken paragraph labels and 44px plate controls).
- Full app suite: `pnpm test --maxWorkers=8`, 213 files passed / 1 failed; 6354 tests passed / 1 failed. The sole failure was `src/lib/trapIndex.test.ts` → generator parity: child-process `spawnSync /usr/bin/node EPERM`. This is the brief's known sandbox limitation. No check was bypassed and no generator or data file was changed. Coordinator must rerun this test outside the sandbox.
- `git --no-optional-locks diff --check`: PASS. All source/test edits are within the admitted write set. Source review retained every prior content assertion while replacing obsolete drawer-state assertions with tab-state, focus and visibility checks.
- Final implementation source SHA-256 (all under `app/src/folio/screens/drill/`):
  - `ReadingSpread.tsx`: `e7ea7814836e077012aeb80bc998a9e9f5ee3f2b99a5b8aed5c42914476db7ca`
  - `PassageView.tsx`: `67df89ebe1e0dbd0ef2dc9f38deab9247484044a8c9fa6607be01113f54a5532`
  - `DtkPlate.tsx`: `b8d3c5894a76f19b3709b1ce05b0fcda3781e38cd1a0ade27fc95f49cea10d76`
  - `PhoneSheet.tsx`: `eb475bfca58d13c388944979d228a061ebf0b3a4a20d12a94bcd8bd2eb652a87`
  - `reading.css`: `9e8d135e4bacc1efb406358c071db4e2bb5168762fcff4ead7eb48db9a2921cf`
  - `FolioSessionStage.tsx`: `f05a07883c912aa6bbbde6e603c895189a4bf1954f5eda966cc4d8b7d4af7ebb`

## Handoff

- Work in progress; changes will remain uncommitted for coordinator delivery.
- 2026-11-13: Implementation complete. Delivery remains BLOCKED on host verification of the generator parity test. Coordinator also owns the planned LÄS/ELF/DTK screenshots in desktop/phone × light/dark, independent review and signed delivery. HEAD is still base `328861d37c969ef4b69af06c61283a3dc50ec414`; no implementation commit has been created.
- Playbook proposal for `gas-city-coordinator`, 2026-11-13: shared reading UI can pass forward-only drill tests but hide the focused question on pass-run back navigation. Cause: a derived default tab leaves an earlier question's saved tab key intact. Rule: test forward/back through each real consumer and commit question/phase transitions while preserving passage scroll. The requested `~/scratch/skill-gotchas/` queue is outside this session's writable roots, so the proposal is retained here for the coordinator to forward.
- Staging attempted once for the exact changed source/test files and this log. `git add` exited 128: unable to create the worktree `index.lock` on a read-only filesystem. No workaround or commit attempted. Coordinator must stage the final tree, rerun generator parity outside the sandbox, complete visual/review gates and sign delivery. Worker state: blocked; park deferred with no assignee, retain the bead open.

## 2026-11-13 coordinator host verification and polish

- Host: typecheck and lint clean, full app suite 214/214 files, 6355/6355 tests (the generator parity checks pass on the host).
- Visual: LÄS, ELF and DTK first questions in 4 modes. Text and question columns with ¶ numbers; the question column sticky; the DTK plate with Rotera/Förstora and its "samma sida" caption; phone Texten/Frågan tabs with Svara in the dock; the duplicated in-page head is gone (the focus bar carries "LÄS · 1 av 10"). 0 side scroll, 0 wide, 0 red, 0 page errors.
- Coordinator polish in reading.css: the ¶ number column is widened from 22px to 32px (padding 30px to 40px), because two-digit numbers ("¶ 10") overflowed into the text.
- Seen, pre-existing data defect: passage paragraphs are split at PDF page breaks mid-sentence, so ¶ numbers can differ from the exam's paragraphs. Filed separately.
