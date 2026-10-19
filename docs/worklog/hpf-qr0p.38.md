---
bead: "hpf-qr0p.38"
project: "hpfetcher"
session: "ci-wisp-gz5shsv"
status: "ready_for_review_uncommitted"
---

# Worklog — hpf-qr0p.38

## Findings

- 2026-10-19: Claimed the assigned B0 document task. The bead has no molecule. Its accepted design confines repository writes to `docs/redesign/directions/f-samtal.md` and this note, requires uncommitted delivery, and explicitly requires deferred status before drain. Those specific instructions govern this handoff.
- Starting HEAD: `e6bea079e07bbab4155e0565863be2f029674149`; initial `git --no-optional-locks status --short` was empty.
- Samtal currently implements screens 1–4 with fixed round-1 fixtures. `SamtalFrame` uses stubs for the other four doors; its account items mostly close the menu. The proposed screens must not be described as already implemented.
- Inspected Samtal's metadata, components, stylesheet, and regression-test descriptions; the shared brief and parent critique log; production practice, repetition, mock, progress/history, lesson, account, settings, math and figure sources. Data requirements will be expressed in plain terms for parallel bead hpf-qr0p.7.
- Source facts: production `ThemeMode` is light/dark only; no English `lang` markup was found under `app/src`; `MockResult` distinguishes official-derived and indicative scores; history currently lists drill/repetition only. `konto.tsx` has a stale top comment prohibiting deletion but actually mounts `DeleteAccountSection` with export-first typed confirmation. This contradiction requires explicit treatment in the design.

## Decisions

- Preserve the conversational hierarchy: one short coach invitation, right-aligned replies, one dominant action; long content stays an opaque document. Reuse actual `sa-` tokens and distinguish exported parts from local functions requiring adaptation.
- Keep five primary doors and exactly one account entry per layout; timed provpass retains its separate interaction contract. Specify proposed states and accessibility behavior without claiming backend or component support that does not exist.
- Write the worklog at the bead's explicitly allowed repository path. The narrow write set takes precedence over the generic vault-worklog destination. No generated vault task files are involved.

## Progress

- [S:ci-wisp-gz5shsv|W:hpf-qr0p.38|H:inspect|E:source] Accepted contract and clean base verified. Documentation drafting begins after the source audit; no source code, dependency, routing, credential, or git-metadata changes.

## Handoff

- Pending: finish ten-screen specification, check source references and per-screen coverage, append completion evidence, park deferred, verify status, then drain. Review/commit/delivery remain with the coordinator; this worker will not close the bead.

## Progress — completed specification, 2026-10-19

- [S:ci-wisp-gz5shsv|W:hpf-qr0p.38|H:write|E:spec] Created `docs/redesign/directions/f-samtal.md`: screens 5–14, 24 desktop/phone wireframes (including both provpass and lesson substates), per-screen purpose/primary action/data/reuse/new parts/states/navigation/ADHD-PI/accessibility/identity, shared token and interaction rules, three-batch inventory and five owner questions. Proposed UI copy and behavior are explicitly labelled.
- [S:ci-wisp-gz5shsv|W:hpf-qr0p.38|H:verify|E:coverage] Read-only document check passed: exactly screens 5 through 14; every screen contains all required topics, empty/loading/partial/done handling and at least two wireframes; code fences balanced; all 19 explicit repository path references exist; both files end in newlines and contain no trailing whitespace.
- [S:ci-wisp-gz5shsv|W:hpf-qr0p.38|H:verify|E:source-facts] All 33 explicit Samtal token names checked against the stylesheet exist. Quant option samples verified from committed `app/public/data/var-2024.json` (XYZ/KVA/DTK A–D, NOG A–E); repetition size verified as 10. The spec distinguishes local helpers from exported components, light/dark from demo-only System, English markup as new work, actual history links, required DTK figure failure, and score provenance.
- [S:ci-wisp-gz5shsv|W:hpf-qr0p.38|H:verify|E:scope] Git status reports only the two permitted new documents. `git --no-optional-locks diff --check` passed for tracked changes (there are none); the separate document whitespace check covers the untracked deliverables. HEAD remains the starting SHA. No source changes, test fixtures, builds, network requests or dependency changes were needed. No runtime, browser, contrast or assistive-technology pass is claimed for a document-only change.
- Specification SHA-256 after final copy edit: `fafbe8f6f7733ed71a85bfe631fb7c585f1510f257d2686b8295c65d52425246`.

## Handoff — ready for coordinator review, 2026-10-19

- This entry supersedes the earlier pending drafting/checks entry. Deliverables are complete and uncommitted at the base HEAD above. Independent review and any delivery commit remain pending with the coordinator; no merge-review PASS is claimed.
- The final native sequence is completion note ending `SPECF DONE: hpf-qr0p.38`, deferred/unassigned update, read-back of deferred status, then runtime drain acknowledgement. The bead is intentionally not closed, per its accepted contract.
- Owner questions are recorded in the spec rather than silently resolved: persistent System theme, the conflicting account-deletion comment, verified raster figure alternatives, personal goals/unified history, and first-open source disclosure.
- **Playbook-proposal — gas-city-coordinator, 2026-10-19:** Symptom: UI source headers gave stale feature claims during a screen-spec audit (`konto.tsx` says no deletion while rendering it; `MockResult.tsx` describes an older scoring model). Cause: comments outlived implementation changes. Rule: verify feature and policy claims against the rendered component body and active helpers; flag ownership-policy contradictions for the owner instead of treating a header as acceptance authority. Proposal retained here because `~/scratch/skill-gotchas/` is outside this managed session's writable roots; no write outside the accepted two-file set was attempted.

## Round 2 — review fixes, 2026-10-19

- [S:ci-wisp-qk8kgd8|W:hpf-qr0p.38|H:inspect|E:review-contract] Read the latest five-item fix contract after claiming this bead. No molecule is attached. The existing two untracked documents are the starting deliverables; preserve all other content and leave delivery uncommitted. This entry supersedes the earlier completed handoff only for the review fixes below.
- **Fix 1 — calibration:** `f-samtal.md:570–571` names the stored server-decided estimate basis / calibration status separately from table conversion. Lines 628–632 require a visible adjacent P5 / övningstext caveat even with “normerat (härlett)”, retain P5 questions in raw counts, and forbid inferring calibration from Genererat pass mode. Lines 654–666 apply the same basis/caveat rule to prognosis. Verified against `normering.ts:122–141`, `provenance.ts:61–62` and `useMockResults.ts:44–50`.
- **Fix 2 — XYZ exception:** `f-samtal.md:261–262` and the B1 exercise at 1064–1065 name `host-ver2-2019-kvant1-XYZ-002` and require its five supplied option entries instead of hard-coded A–D. The source array in `app/public/data/host-ver2-2019.json:2513` contains five entries, including a repeated C label; the spec does not misdescribe it as A–E or change the data.
- **Fix 3 — cloze forms:** `f-samtal.md:955–957` and 1019–1021 distinguish legitimate empty stems and explicit P5 “Gap (1)” prompts from missing content. Verified the explicit prompt in `ovningstextFixtures.ts:133`.
- **Fix 4 — fixture coverage:** `f-samtal.md:959–964` identifies `elf-b19-003` as the one-paragraph, one-question short unit and `elf-b18-002` as the five-question cloze; neither claims to cover the three-paragraph “Fråga 2 av 4” wireframe. B3 requires a multi-paragraph ELF reading fixture from shared kit hpf-qr0p.7 with real counts and references. Verified both unit definitions in `ovningstextFixtures.ts:121–289`.
- **Fix 5 — settings hint:** `f-samtal.md:860–862` requires B3 to replace the demo “Provdatum och mål” hint with supported-settings copy, consistent with the no-goal-forms rule. Verified the current hint in `SamtalNav.tsx:312`; source remains unchanged.
- [S:ci-wisp-qk8kgd8|W:hpf-qr0p.38|H:verify|E:scope] Compared the revised spec with its in-memory round-1 snapshot: every changed passage belongs to those five fixes. This worklog is append-only. Git status still lists exactly the two accepted untracked files; HEAD remains `e6bea079e07bbab4155e0565863be2f029674149`. No source, fixture, dependency or git-metadata changes were made.
- Specification SHA-256 for Round 2: `c7442e1edd35e00aeae5431d0672d1eebb6a16ba12937bbe36dd00d3f088bd3f`.
- **Playbook-proposal — gas-city-coordinator, 2026-10-19:** Symptom: a bank item marked complete has five XYZ option entries but only four distinct letters. Cause: its stored option array includes a repeated C label. Rule: inspect actual option arrays and label uniqueness when auditing screen specs; do not infer answer shape from section or option count, and keep data repair outside a documentation-only fix. Proposal retained here because the required scratch proposal directory is outside this session's writable roots and the accepted scope permits only these two files.
- **Handoff:** ready for independent Claude re-review of these five fixes. No review PASS or delivery commit is claimed. Append completion evidence to the bead, park deferred/unassigned, confirm deferred, then acknowledge drain; do not close the bead.
- [S:ci-wisp-qk8kgd8|W:hpf-qr0p.38|H:verify|E:whitespace] `git --no-optional-locks diff --check` is clean. Separate `git --no-optional-locks diff --no-index --check /dev/null <file>` checks on both new documents emitted no whitespace diagnostics (exit 1 denotes the new-file difference). Independent text checks confirm no trailing whitespace or conflict markers, final newlines, balanced spec fences, and the original worklog preserved verbatim. No runtime suite is needed for these documentation-only corrections. Final repository scope remains exactly the two accepted untracked files.
