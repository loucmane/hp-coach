# Worklog — hpf-qr0p.49.11

## Findings

- 2026-10-22: Claimed the assigned bead in its declared worktree, initially clean at fbd4c26c7af3bb6ab955ceec743e788d290342c0. Dependencies are present. No molecule controls this item.
- Existing drill state and paragraph refs can serve the reading spread. Authentic ELF uses printed gap numbers; passage titles and instruction paragraphs must not enter body numbering.

## Decisions

- Keep SessionPlayer as lifecycle owner and one useDrillCore per contiguous block. Add reading UI inside the existing stage, scoped to the admitted drill files.
- Keep the figure viewer inside the Folio drill, pause drill keys during viewing, and return focus to the question/verdict. Phone feedback covers an inert document region.
- Deliver uncommitted work for coordinator review. Owner visual approval and independent exact-head review remain required before merge.

## Progress

- [S:codex-3|W:hpf-qr0p.49.11|H:inspect|E:clean git status; installed app dependencies; prototype and current core inspected]

## Handoff

- Implementation and verification in progress.

## 2026-10-22 — implementation and verification handoff

- Added ReadingSpread, PassageView, ElfGaps, PhoneSheet, DtkPlate, FigureViewer and the verbatim Övningstext disclosure. The reading/plate column sticks under the 56 px drill head and scrolls independently; question and feedback flow in the document. The phone dock has peek/open/full feedback, keeps covered document content inert, folds for citations and restores focus on return.
- Extended the seam to all eight sections only when options exist, and constrained contiguous blocks to the same section. The mapper separates body paragraphs from title/instructions; the core recognizes ASCII, English curly and Swedish quotations with the existing minimum length.
- ELF content uses English language tags while chrome stays Swedish. Authentic and P5 gap formats preserve ordinary numeric text; chosen/graded words use neutral ink and strike-through. DTK retains one plate/core across three questions, shows its source caption and an ordinal cue in words, and opens an in-scope modal with keyboard zoom, focus containment and paused answer keys.
- Confirmed by source inspection that the Folio SessionPlayer branch renders the stage directly, outside QuestionPan/StageInk; the Folio shell introduces no transformed ancestor in this path. Actual viewport geometry remains a browser check.

### Verification

- Red-first: before implementation, mapper/core/SessionPlayer tests produced 11 expected failures and 22 passes across three files: unsupported LÄS/ELF/DTK controls, missing title split, missing ASCII citations, disclosure/phone/DTK flows.
- Final focused run: `pnpm test src/folio/screens/drill --maxWorkers=2` — 8 files, 74 tests passed. Includes real host-2022-verb1-LÄS-011 and host-2013-verb2-ELF-031 fixtures; one core/plate across DTK advances; figure viewer in question and feedback; phone full/peek/open states; disclosure; English scope; and axe checks. Axe in jsdom does not establish contrast or real layout.
- Full app run: `pnpm test --maxWorkers=2` — 152 files passed, one failed; 4701 tests passed and one failed. The sole failure is `src/lib/trapIndex.test.ts`, whose generator check is refused with `spawnSync /usr/bin/node EPERM`. No source fix or policy workaround attempted. Two later regression cases and the final focus refinement are included in the 74-test focused run above.
- `pnpm typecheck` passed. `pnpm lint` passed (four pre-existing informational diagnostics in devbake). `git diff --check` passed.
- The full app run includes DrillQuestion, dtkBlockPosition, MockRunner, StudyDesk, foundation, Idag and existing drill tests. No worker files or dependencies changed.
- `pnpm test:e2e question-identity.spec.ts drill.spec.ts soak-drill.spec.ts figure-zoom.spec.ts --list` collected 11 entries including auth setup. This is collection evidence only: browser execution requires Clerk/staging under the current configuration and was not run under the offline contract.

### Remaining delivery gates

- WAITING: coordinator rerun of the trap-index generator check outside the child-process sandbox; authenticated flag-off E2E execution; desktop/phone light/dark visual checks; owner visual OK; independent exact-head review after the coordinator commits. No browser screenshots or independent review verdict are claimed.
- Work is uncommitted, based on fbd4c26c7af3bb6ab955ceec743e788d290342c0. No implementation commit SHA exists yet. No merge, push, deployment, closure, status change or reassignment performed.
- [S:codex-3|W:hpf-qr0p.49.11|H:verify|E:74 focused passes; full app 4701 passes and one sandbox EPERM; typecheck/lint pass; E2E collection only]

### Playbook proposal for coordinator relay

- 2026-10-22, astra-relay: Offline UI workers can finish component/axe checks but cannot execute a visual gate when the repository E2E configuration authenticates with Clerk/staging and the brief forbids ad-hoc harnesses. Brief an existing offline visual command or explicitly assign desktop/phone and light/dark screenshots to the coordinator; E2E --list proves collection only. The requested append to `/home/loucmane/scratch/skill-gotchas/astra-relay.md` was rejected by the sandbox as outside the project. Proposal preserved here for relay.

- Final delivery note: the explicit `git add` of the 23 admitted files was refused because `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.11/index.lock` is on a read-only filesystem. Changes are therefore UNSTAGED and UNCOMMITTED. The final typecheck and lint reruns passed. Coordinator must stage and commit; no alternate git metadata or signing route was used.

## 2026-10-22 — round 2 start

- Claimed the same bead at clean HEAD 905ccfceb1d41c9c857e007e89712667160868bb. No molecule is attached. Scope is the five review follow-ups in the latest design; the write set is unchanged.
- Added regression assertions before implementation for question-mark titles, citation highlight versus flash, sheet handle focus, synthetic gap order, and prior-answer hydration.
- Item 4 needs a caller change outside the admitted write set: SessionPlayer owns private `picks` and passes only `picked={picks[index]}`. Question objects in `plan` contain no prior selections. Sent a bead QUESTION; will implement/test an optional `picks` stage prop and record the exact caller line for coordinator application. No metadata widening or caller edit.
- [S:codex-1|W:hpf-qr0p.49.11|H:inspect-r2|E:clean base; current caller and prototype inspected; regression tests added]

### Round 2 changes and red-first evidence

- The short-title rule now accepts a trailing question mark. Real `var-2013-verb2-LÄS-012` verifies that the quoted pedagogy passage and “tredje stycket” both resolve to body paragraph 3. ELF instruction/title separation has its own regression.
- Citation assertions now prove `data-cited` is already true in feedback and unchanged by clicking; the click changes `data-flash` from false to true.
- The phone sheet layout effect focuses the verdict only on peek → full. The grab handle retains focus through full → open → full; returning from text still focuses the verdict.
- Synthetic ELF blanks with empty prompts use their order within the passage/unit, including explicitly named gaps in that order. Authentic printed numbers remain unchanged. Synthetic passages without blanks do not get a false gap label.
- The stage accepts optional plan-aligned `picks`, initializes `start.results` from earlier answers in the current block, and merges late-arriving history into the displayed results without resetting current selection or feedback. Tests cover both initial and delayed hydration, prior right/wrong words, and a single submission of the current answer.
- Red-first command: `pnpm test src/folio/screens/drill/toDrillQuestion.test.ts src/folio/screens/drill/ElfGaps.test.ts src/folio/screens/drill/ReadingSpread.test.tsx src/folio/screens/drill/FolioSessionStage.test.tsx --maxWorkers=2`. Result: **7 expected failures, 55 passes** (two title tests, two synthetic-gap tests, handle focus, and two resume cases). Citation strengthening passed before the fixes, as expected.
- After implementation: **81 drill tests passed**. Added the real-bank audit afterward; the mapper file then passed **16/16**. Typecheck passed; lint passed with four existing informational devbake diagnostics after formatting the changed files.

### Real-bank ordinal/quotation audit

- Reproducible command from `app/`: `pnpm test src/folio/screens/drill/toDrillQuestion.test.ts --maxWorkers=2 --silent=false --reporter=verbose`.
- Scanned every checked-in public LÄS/ELF explanation associated with a reading question, recursively across all string fields. Found **143 explanations / 178 fields** mentioning first through tenth `stycket` (including `styckets`). For each field, used the production `findQuotes` matching rules (ASCII/English/Swedish quotation marks, at least 12 characters) against both the previous title-inclusive numbering and the revised body numbering.
- **80 fields** have one distinct ordinal and one quoted paragraph location. Candidate mismatches are **36 before / 36 after**; matching fields are **44 before / 44 after**. This unchanged total is not a clean-bank verdict: one defect is fixed and one existing extraction defect becomes visible after removing its title.
- `var-2013-verb2-LÄS-012.steps[1].text`: named ¶3, quote **¶4 → ¶3**, fixed. `var-2026-verb2-LÄS-017.steps[1].text`: named ¶2, quote **¶2 → ¶1**. Its source begins `En afrikansk vår?`; the following extracted paragraph collapses multiple original paragraphs together, including the quoted argument. Keeping the title as ¶1 had coincidentally aligned this one quotation. The source still contains later page/paragraph breaks, including one splitting a sentence. No corpus repair was made within this drill-only write set.
- **80 fields have no matching quotation** under the production rules (often no quote, paraphrase, or ellipsis); **18 have multiple ordinals/quote locations** and cannot be paired unambiguously at field level. These are unresolved by this mechanical audit, not claimed as matches. Even a single-location candidate may quote a different part of the field than its ordinal; the mismatch inventory needs content review before source corrections.
- Other observed candidates remain unchanged. Representative examples: `host-2022-verb1-LÄS-014.steps[1].text` names ¶2 while its quote is in displayed ¶1; `host-2017-verb2-LÄS-019.steps[1].text` names ¶8 while its quote is in ¶9. This work cannot certify every bank ordinal as aligned.

### Required coordinator wiring for item 4 (not applied)

`app/src/components/session/SessionPlayer.tsx` owns `picks` and hydrates it asynchronously from adopted session attempts. At the existing `<LazyFolioSessionStage>` call, insert this one prop immediately after `picked={picked}`:

```tsx
picks={picks}
```

The caller is outside `lanes.admitted_write_set`; it has not been edited. The stage-side tests pass with that prop, but the production resume path remains incomplete until the coordinator applies the line and verifies a resumed ELF session through SessionPlayer. Do not treat the stage-only regression tests as proof of end-to-end resume behavior.

### Round 2 playbook proposal for coordinator relay

- 2026-10-22, gas-city-coordinator: A resume fix confined to a child stage could not restore earlier choices because the parent kept them private, and its attempts also hydrate after the child mounts. Before admitting a resume fix, trace the persisted-answer owner and include the caller in the write set; test both preloaded and delayed history without remounting/resetting the current answer. The managed sandbox excludes `~/scratch/skill-gotchas/`, so this proposal is preserved here for relay under the astra-relay playbook's documented worker fallback.

### Audit follow-up inventory

There are **5 LÄS / 7 ELF distinct extracted contexts** affected by the short-question-title rule in this checkout. The 36 remaining field-level candidate mismatches below use zero-based JSON array indices; the pair is **named ordinal → quoted paragraph after mapping**. This is a diagnostic inventory, not a verdict that every quoted fragment belongs to the field's named ordinal.

```text
host-2013-verb1-LÄS-012.distractors.1.why_tempting: 5 → 6
host-2013-verb1-LÄS-013.steps.4.text: 6 → 7
host-2014-verb1-LÄS-014.steps.1.text: 5 → 6
host-2014-verb1-LÄS-018.steps.1.text: 5 → 7
host-2015-verb1-LÄS-016.steps.1.text: 2 → 3
host-2016-verb2-LÄS-012.steps.1.text: 4 → 5
host-2017-verb2-LÄS-019.steps.1.text: 8 → 9
host-2020-verb1-LÄS-012.steps.1.text: 3 → 1
host-2020-verb2-LÄS-017.steps.1.text: 3 → 1
host-2020-verb2-LÄS-019.steps.1.text: 4 → 1
host-2022-verb1-LÄS-014.steps.1.text: 2 → 1
host-2022-verb1-LÄS-016.steps.1.text: 3 → 2
host-2024-verb1-LÄS-020.steps.1.text: 5 → 1
host-2024-verb2-LÄS-013.steps.1.text: 4 → 1
host-2025-verb1-LÄS-014.steps.4.text: 1 → 2
host-ver1-2019-verb2-LÄS-011.steps.1.text: 2 → 1
host-ver2-2019-verb1-LÄS-012.steps.1.text: 3 → 2
host-ver2-2019-verb2-LÄS-017.steps.1.text: 4 → 1
var-2013-verb1-LÄS-019.steps.1.text: 6 → 7
var-2013-verb2-LÄS-015.steps.1.text: 5 → 8
var-2014-verb1-LÄS-013.solution_path: 3 → 4
var-2015-verb2-LÄS-020.steps.1.text: 4 → 13
var-2016-verb1-LÄS-011.steps.1.text: 1 → 2
var-2016-verb1-LÄS-011.steps.3.text: 2 → 3
var-2016-verb1-LÄS-012.steps.1.text: 5 → 7
var-2016-verb1-LÄS-013.steps.1.text: 6 → 7
var-2016-verb1-LÄS-014.distractors.1.why_wrong: 5 → 6
var-2016-verb1-LÄS-014.steps.1.text: 6 → 7
var-2016-verb1-LÄS-014.steps.2.text: 7 → 8
var-2016-verb1-LÄS-015.steps.3.text: 5 → 6
var-2026-verb1-LÄS-011.steps.1.text: 3 → 2
var-2026-verb1-LÄS-012.steps.1.text: 2 → 1
var-2026-verb1-LÄS-014.steps.2.text: 3 → 5
var-2026-verb2-LÄS-011.steps.1.text: 2 → 1
var-2026-verb2-LÄS-013.steps.1.text: 3 → 1
var-2026-verb2-LÄS-017.steps.1.text: 2 → 1
```

### Round 2 final verification and delivery state

- `pnpm test --maxWorkers=2`: **4711 passed, 1 failed; 152 files passed, 1 failed**. The only failure is the existing trap-index generator check, blocked by `spawnSync /usr/bin/node EPERM`. The full run includes all 82 drill tests, which passed. Coordinator must rerun the generator check outside the sandbox.
- Final `pnpm typecheck`: passed. Final `pnpm lint`: passed with four pre-existing informational devbake diagnostics. `pnpm build`: passed (Vite production build and PWA generation); existing test-route and chunk-size warnings remain. `git diff --check`: passed.
- Explicit staging of the nine changed admitted files failed because the linked worktree index lock is on a read-only filesystem. Changes remain **unstaged and uncommitted** at base **905ccfceb1d41c9c857e007e89712667160868bb**. No signing, alternative git-metadata path, push, merge, status/assignee change, or bead closure was attempted.
- Handoff: four localized fixes and stage-side resume support are ready. The caller wiring above is still required for the production resume fix. The bank audit exposes unresolved content/extraction candidates; no claim of universal ordinal alignment is made. Coordinator applies the caller line, verifies resume through SessionPlayer and host checks, commits, obtains fresh independent exact-head review and owner desktop/phone light/dark visual approval. Round 1's review does not cover this uncommitted round.
- [S:codex-1|W:hpf-qr0p.49.11|H:handoff-r2|E:4711 passes and one sandbox EPERM; typecheck/lint/build pass; staging read-only; caller wiring and content audit handed off]

## 2026-10-22 — round 3 start

- Reconfirmed the existing assignment and latest round 3 design. Clean base is d573c7ea481ed2cabb9e6fcac2964d6d073eda6c; no molecule controls this bead.
- Scope: place the desktop verdict after graded options, preserve phone sheet order with a distinct verdict and quieter question restatement, and suppress only the programmatically focused question container's outline. Keep focus management and interactive control rings intact.
- Added regression tests before implementation for desktop/phone order, focus retention, spacing and the narrowly scoped outline override. Existing host tests cover citations, toggles and figure-viewer focus return.
- [S:codex-1|W:hpf-qr0p.49.11|H:inspect-r3|E:accepted design and shared styles inspected; red-first regressions added]

### Round 3 changes and regression evidence

- Desktop reading/DTK feedback now keeps the prompt first, followed by graded options, the verdict and Facit. The verdict has a separate top margin to introduce the answer explanation.
- Phone feedback retains verdict → question → graded options → Facit. The verdict is explicitly block-level with a six-unit bottom margin; the prompt uses the existing smaller `data-after` restatement style.
- Only `.rd-question[tabindex='-1']:focus` suppresses its outline, scoped to the reading drill. It outranks the shared `:focus-visible` rule without matching child controls. The general interactive ring remains unchanged; question and verdict focus, phone sheet focus and figure-viewer focus return remain covered by host tests.
- Red-first command: `pnpm test src/folio/screens/drill/ReadingSpread.test.tsx --maxWorkers=2` — **4 expected failures / 7 passes**: desktop ordering, phone restatement styling, spacing, and the absent question focus override.
- After implementation: `pnpm test src/folio/screens/drill --maxWorkers=2` — **8 files / 86 tests passed**. `pnpm typecheck` passed. `pnpm lint` passed after formatting the new test; its four pre-existing informational devbake diagnostics remain. `git diff --check` passed.
- The wrong-answer regression also exposed a React duplicate-key warning from GradedOptions and Facit sharing `q.qid` as sibling keys. They now use distinct `options:` and `facit:` prefixes while retaining per-question state resets; the green run emits no duplicate-key warning.

### Round 3 playbook proposal for coordinator relay

- 2026-10-22, astra-relay: A wrong-answer UI regression exposed duplicate sibling keys even though the two components had different types: both used the same question ID as a reset key. Prefix per-question reset keys by component role when siblings share an ID, and exercise both right and wrong feedback when changing their order. The managed sandbox excludes `~/scratch/skill-gotchas/`; this proposal uses the playbook's documented worker-worklog fallback for coordinator relay.

### Round 3 final verification and handoff

- Full `pnpm test --maxWorkers=2`: **4715 passed / 1 failed; 152 files passed / 1 failed**. The only failure is the existing trap-index generator check, refused with `spawnSync /usr/bin/node EPERM`. All 86 drill tests passed. The coordinator must rerun that generator check outside the sandbox.
- `pnpm typecheck`, `pnpm lint`, and `pnpm build` passed. Lint has four existing informational devbake diagnostics. The production build completed with the existing route-test discovery and chunk-size warnings and generated the PWA assets. No worker source or dependencies changed.
- Staging the four changed admitted files was refused because `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.11/index.lock` is on a read-only filesystem. Changes are **unstaged and uncommitted** on **d573c7ea481ed2cabb9e6fcac2964d6d073eda6c**. There is no new implementation commit or independent review verdict for round 3.
- Coordinator handoff: park the bead, stage and sign the changes, rerun the host generator check, obtain independent exact-head review, and inspect desktop/phone in light/dark before owner visual approval. The prior round's visual check and review do not cover these edits. No source changes were made outside the admitted write set; no merge, push, closure, status change, reassignment or signing was attempted.
- [S:codex-1|W:hpf-qr0p.49.11|H:handoff-r3|E:4 red regressions; 86 focused passes; full app 4715 passes and one sandbox EPERM; typecheck/lint/build pass; staging read-only; visual and independent review gates remain]
