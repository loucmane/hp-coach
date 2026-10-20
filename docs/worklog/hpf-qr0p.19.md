# Worklog — hpf-qr0p.19

## Findings

- 2026-10-20: Claimed the assigned bead in its clean worktree at `9c6bc58dcbb0808032f378fd9023c32c04dbadc4`. No molecule. Scope: screens 9–11 and the three specified batch-1 audit fixes. Shared kit, specifications and dependencies are read-only.

## Decisions

- Preserve Lager's OKLCH field, opaque raised sheets, Newsreader passages, system/Inter controls and restrained Fraunces display. Candidate/result/evidence leads; archive and section ledger sit lower. Glass carries only short navigation controls. Phone stacks the same hierarchy.
- New UI copy is proposed Swedish copy. No fabricated scores, ranges, saved preferences or persistence acknowledgements. Delivery is uncommitted, then deferred for coordinator review.
- Regression tests precede the image, keyboard and completed-plan fixes. Browser checks depend on sandbox loopback support.

## Progress

- [S:codex-3|W:hpf-qr0p.19|H:inspect|E:base-9c6bc58] Read kit v2, direction spec, prior worklog and current source.

## Spec gaps

- Screen 9: kit supplies one running snapshot, not a pass bank keyed by selection, generated-pass start identifier, session persistence/pick/abort actions, start timestamp, loading/error/expired state or asynchronous settlement acknowledgement. Only a matching supplied snapshot can run locally; other selections request the host and wait for matching data. Local answers/flags/navigation demonstrate the preview without claiming persistence. Timeout can request submission once; no fabricated result is computed.
- Screen 10: no result-loading/error state or eligibility mapping from `missed` to a ready repetition batch. Use Till Idag as primary; raw counts, supplied score basis and section budgets remain visible.
- Screen 11: no diagnostic action or practice-history completion action. Keep practice history readable, and mock history separate with its supported result action. Cold start uses the supported Öva destination. Missing weekly scores remain gaps; no invented uncertainty.

## Handoff

- Implementation and verification in progress. Coordinator owns signed delivery, independent review and any host-only checks.

## Delivered implementation — 2026-10-20

- **9 · Provpass:** half selector, elevated candidate with actual available/previously-seen counts and composition, lower sitting archive, rules and earlier results. Opaque native-dialog start confirmation gates the host action. Only a matching supplied running snapshot opens locally; a different selected pass waits for matching host data. Runner removes the dock, keeps exit/position/countdown visible, and provides a labeled question grid (disclosure on phone), optional flags, mutable A–E choices, previous/next navigation and exact unanswered-count confirmation. Selection never grades or reveals explanations. English and Swedish passage sources, KVA/NOG/math, main figures and image options render from the supplied questions. Abort asks first; Escape never exits. Timeout submits once, locks inputs and also checks the deadline at input time to handle delayed background timers. An already-expired snapshot gives no invented result. A synchronous submission exception retains local answers and offers a deliberate retry.
- **10 · Provpassresultat:** foremost outcome sheet leads with correct/actual-presented, missing-question disclosure and supplied score/basis caveat; Till Idag is the primary action. A lower section ledger prints correct counts, time versus budget and over-budget wording. Prior exposure, blanks, optional trap and comparable pass history remain quieter. Missing norming and zero correct are distinct. Every history action passes the supplied result ID.
- **11 · Framsteg/Historik:** evidence sheet with prognosis, visible caveat and only supplied optional range/target/change; a raised next-focus sheet uses an evidenced section. The eight-section ledger shows scores, supplied uncertainty, answer counts and recency. Weekly path breaks at missing values and has a dated table alternative; fewer than two scored weeks gives no curve. The 84-day attendance view has a date/count disclosure, distinguishes unavailable attendance from recorded zero days, and avoids streak-loss messaging. History remains visible in overview and as its own subview, with practice/repetition and mock results explicitly separated.
- **Audit fixes:** Home excludes completed items from both upcoming actions and the primary recommendation, with a full-completion state. Quantitative grading requires every main/option image to be ready for both button and keyboard paths. Initial loading, error, retry, cached success/failure and two image instances sharing a URL are covered. The viewer contains digit and arrow events and marks its pan region with `data-rd-keyscope`; the real bake-off host verifies digits work again outside the viewer.
- **Lager identity:** retained the existing OKLCH materials, lowered-chroma dark palette, opaque content sheets, lagoon action, system/Inter controls and Newsreader passages. Commitment/outcome/evidence and supporting ledgers have different elevations rather than an equal-weight card grid. Glass remains limited to short controls; phone layouts stack sheets and retain 44px controls. New copy is proposed, including confirmation/recovery/empty states, score qualifications and progress summaries. Existing supplied rules and ÖVNINGSTEXT copy are preserved.

## Verification — final source tree, 2026-10-20

- Base and current HEAD: `9c6bc58dcbb0808032f378fd9023c32c04dbadc4`. Branch: `codex/hpf-qr0p.19-redesign-round-2-direction-d-lager-batch-2-provpass-provpass`. The implementation is **uncommitted and unstaged**, comprising the ten admitted repository files. No shared kit/spec/dependency edits.
- Red first: initial regression run was **6 failed / 66 passed**. Five failures demonstrated the loading/cached-failure/completed-plan defects; the sixth exposed a host-test setup omission (zero jsdom stage dimensions), subsequently corrected with scoped dimension spies. Replaying the old viewer event handling against the final regression produced **1 expected failure**, with three digit events escaping. Additional tests first reproduced a late answer after a throttled timer and early enablement when an option shared the main figure URL, then passed after the fixes.
- Focused Lager suite: **106/106 passed**. Coverage includes shared screen contracts at desktop/phone and light/dark, all audit fixes, start/cancel/focus, mismatched pass selection, actual partial counts, optional flags, answer revision and grid navigation without grading, submit/abort gates, one-shot and delayed timeout, expired snapshots, synchronous settlement retry, English passage support, zero/missing-score results, actual history identifiers, weekly gaps, focus routing, and cold/optional progress data.
- `pnpm typecheck`: **PASS**, exit 0.
- `pnpm lint`: **PASS**, exit 0; four pre-existing informational findings in unrelated landing/l12 files, no errors or warnings.
- Final `pnpm test`: **107 files passed; 1,768/1,768 tests passed**, exit 0. No shared-test failures remain at this base.
- `git diff --check`: **PASS**. Final status contains only the ten admitted repository paths; the classified worklog is also maintained.
- Browser attempt: `pnpm dev --host 127.0.0.1 --port 5186 --strictPort` failed with **listen EPERM**. No screenshots, measured pixel contrast, browser layout or native modal focus-trap sign-off is claimed. Coordinator must run the requested 16-view screenshot pass per new screen, plus the running pass, confirmations, image failure/retry, figure viewer, narrow/enlarged text, reduced motion/transparency and dark-mode checks on the host. jsdom verifies behavior and dialog lifecycle only.
- [S:codex-3|W:hpf-qr0p.19|H:verify|E:106-lager-1768-app] Required app checks pass; browser verification and independent review remain coordinator work.

## Spec gaps — final clarifications

- Screen 9: no generated-pass identifier or source, so no nonfunctional generated-mode switch. The provided running snapshot's remaining seconds are the only time source; no claim of reload-safe elapsed time, persisted picks, durable abort invalidation or save acknowledgement. The host owns these integrations. Async settlement/retry outcomes cannot be modeled by the current void action; only thrown synchronous failures are handled locally.
- Screen 10: result completion date is not supplied; it is not fabricated. Bake-off `openProvResult(id)` requests the right ID but currently shows the kit's fixed result preview; the host must supply that selected result for a real history integration. No promise that supplied missed question IDs are eligible for immediate repetition.
- Screen 11: practice-history rows remain readable summaries because no completion-view action exists. Mock rows use `openProvResult`. No fabricated diagnostic route or question count is exposed. History subview state is local while mounted; persistent history position across host unmounts needs a host contract.

## Playbook proposal — astra-relay

- 2026-10-20 · Symptom: the real redesign host rendered its switcher but never mounted the requested direction in a jsdom regression test, even after awaiting it. Cause: `Redesign2026Bakeoff.Single` intentionally renders no stage while measured width is zero; `stubLayout()` supplies APIs, not element dimensions. Rule/fix: tests through this host must scope `clientWidth`/`clientHeight` spies around the render, restore them afterward, and include a positive outside-dialog key assertion. Recorded here and in the classified worklog because `~/scratch/skill-gotchas/` is outside this managed session's writable roots; the astra-relay playbook documents the worklog fallback.

## Handoff — ready for coordinator delivery

- Supersedes the initial in-progress handoff: implementation and required app checks are complete. No commit, push, PR, merge, dependency change or bead closure was attempted. Independent cross-vendor review is **pending** until the coordinator commits the source and binds review/gates to that exact head.
- Coordinator next: inspect the listed kit limitations, run host visual/accessibility checks, commit and obtain the independent review, then deliver through the normal project gates. Park the bead deferred before runtime drain; this is a handoff, not closure or merge approval.

LAGER2 DONE: hpf-qr0p.19

- 2026-10-20: Delivery note recorded; native Beads readback confirms **DEFERRED** with no assignee. Runtime drain follows. No further work claim.
