---
bead: "hpf-qr0p.40"
project: "hpfetcher"
session: "ci-wisp-wzgqi4s"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.40

## Findings

- 2026-10-19: Claimed hpf-qr0p.40; no molecule controls this document-only B0 task. The checkout was clean at `43b0196a906961239bd126f3ebd4cb0bcc667c66`, on `codex/hpf-qr0p.40-redesign-round-2-direction-h-ljusk-gla-b0-screen-design-spec`.
- Read Ljuskägla's metadata, every direction source file and its tests, the round-1 brief and reviewer critique log, and the real route/component content for practice, quant/figures, repetition, mock passes/results, progress/history, lessons, account and settings. The signature is opaque room/paper/lamp surfaces, a warm margin beam, Manrope UI and Spectral prose, with one illuminated task and readable surrounding material.
- Source distinctions the specification must preserve: due repetitions versus today's pile; KVA A–D versus NOG A–E; DTK raster pages and image answers; practice feedback versus timed-pass submission; estimated versus table-derived scores; drill/repetition history versus mock history; lesson bookmarks versus explicit read marks.
- The account route has an outdated opening comment prohibiting deletion on the page, but its mounted `DeleteAccountSection` and later comment place export and typed-confirmation deletion deep in the account page, outside menus. The spec records the implemented boundary and flags the conflicting commentary for owner reconciliation without editing source.

## Decisions

- 2026-10-19: Follow the bead's exact two-file write set. This repository worklog is the named delivery evidence; any classified-vault copy is left to the coordinator. Do not change source, shared data contracts, task status or routing. Leave the work uncommitted and do not close the bead, as its accepted design explicitly requires.
- Preserve the existing light/dark palette and interaction rhythm. Extend the vocabulary with shared direction-local parts, not a new visual system per batch. Describe data in plain language while hpf-qr0p.7 owns the shared view model.
- Mark new interactions and fallback states as round-2 design requirements, not claims about shipped behavior. Do not invent persistence, figure transcriptions or official score calibration.

## Progress

- 2026-10-19 [S:ci-wisp-wzgqi4s|W:hpf-qr0p.40|H:inspect|E:source-read]: Verified starting SHA and clean worktree; inspected the accepted contract and source grounding before drafting.
- 2026-10-19 [S:ci-wisp-wzgqi4s|W:hpf-qr0p.40|H:document|E:docs/redesign/directions/h-ljuskagla.md]: Completed all ten screen specifications, 22 wireframe blocks (including both provpass modes), existing-token/component reuse, new component responsibilities, state/navigation/ADHD-PI/accessibility requirements and owner questions. Combined wireframes also depict lesson picker/reader and history subviews. Added explicit B1→B2/B3 shared-component boundaries and B2's dependency on B3 for final ELF integration.
- 2026-10-19 [S:ci-wisp-wzgqi4s|W:hpf-qr0p.40|H:verify|E:document-audit]: Read-only structural validation passed for screens 5–14 in order, all six required content categories on every screen, at least two desktop/phone wireframe blocks per screen, balanced fences, no trailing whitespace, and all 28 relative source links. Confirmed cited DTK question has a figure-index entry, the repetition batch limit is ten, KVA/NOG choices match the parsed corpus, and both cited ELF units exist in the P5 sample. `git diff --check` passed for tracked changes; the explicit text audit covers the new untracked document. Scope inspection showed only the two admitted files, both untracked. No application tests, build, browser/contrast probes, commit or remote operation was run for this documentation-only change.

## Handoff

- Drafting `docs/redesign/directions/h-ljuskagla.md`. Verification is document coverage, source consistency, relative-link resolution and whitespace/scope checks. This task changes no runtime behavior and does not call for application test suites or builds.
- 2026-10-19: Supersedes the drafting status above: the specification is ready for coordinator review. Base HEAD remains `43b0196a906961239bd126f3ebd4cb0bcc667c66`; there is no implementation commit or independent review verdict. Both deliverables remain uncommitted. The bead stays in its existing claimed state under its explicit no-close contract. Coordinator owns delivery and any vault projection; B1–B3 own runtime implementation and browser evidence. Open owner choices are listed at the end of the spec with bounded interim behavior.
- 2026-10-19 Playbook-proposal — `gas-city-coordinator` (hpfetcher content handoffs): symptom: carrying the production ELF cloze detector into a P5 preview would miss cloze questions with a nonempty prompt. Cause: `DrillQuestion` detects legacy corpus cloze by an empty prompt, while P5 `elf-b18-002` supplies `Gap (1)`. Rule: inspect real fixtures and let the shared data adapter identify cloze explicitly across content families; preserve gap labels without rewriting answers. Proposed here for coordinator relay because `~/scratch/skill-gotchas/` is outside this managed worker's writable roots and exact two-file write set; no write there was attempted.

## Round 2

- 2026-10-19 [S:ci-wisp-llbgkcw|W:hpf-qr0p.40|H:review-fix|E:accepted-design]: Resumed the same two untracked files at unchanged base HEAD `43b0196a906961239bd126f3ebd4cb0bcc667c66`. The accepted design records an independent Claude HOLD on round 1. This round addresses its eight requested fixes only; prior worklog entries remain unchanged.

Final line references below are in `docs/redesign/directions/h-ljuskagla.md`:

1. Lines 529 and 539: identify `elf-b19-003` as the one-paragraph, one-question `ELF_SHORT_UNIT`; remove the long-reading claim and “beginning with”. State that it cannot exercise the drawn long-passage/paragraph-light layout, require a genuine multi-paragraph approved P5 fixture through hpf-qr0p.7 or an authentic corpus passage with its real source, and keep cloze a separate state. Replace the short unit's title in the long-passage wireframe with a fixture placeholder. Checked against `ovningstextFixtures.ts:253–289`, the candidate's short family/paragraph count and the committed sample's two ELF units.
2. Line 527: mark adding `lang="en"` content boundaries as new work; the current H root has only `lang="sv"` (`Ljuskagla.tsx:28`). The content-level language requirements remain at line 565.
3. Line 607: add the owner question covering H's opening theme, its dark-first tagline versus the brief's light reading default, and whether a separate stored default-theme preference is wanted. Distinguish that proposed default preference from production's existing light/dark mode selection (`tokens.ts:14`, `mer.tsx:302–320`, `useSyncedPrefs.ts:123`).
4. Lines 127–128, 176–177, 296–297 and 551–552: add Konto to the phone focus headers for screens 6, 7, 9 and 14, keeping section/progress/clock visible on a second row. This follows the focus-header account entry in `LjuskaglaDrill.tsx:156`.
5. Line 356: label `PassReview` as a new capability dependent on hpf-qr0p.7 for question content and picked answers from session attempts. Explain the stored breakdown's question-ID-only per-question detail and retain the missing-review-content fallback (`MockResult.tsx:5–10`, `mockSheet.ts:130–150`).
6. Line 321: require the visible result caveat to say a result containing P5 questions is not calibrated, including when a sitting table supplies the conversion; keep those questions in the raw score (`normering.ts:27–31`).
7. Lines 241 and 313: identify “Granska svar” and the named abandonment/submission dialogs as new UI work; production uses `window.confirm` for the latter decisions (`MockRunner.tsx:275–288`).
8. Line 233: use production's “Inget är redo just nu” wording (`ova.tsx:277`).

- 2026-10-19 [S:ci-wisp-llbgkcw|W:hpf-qr0p.40|H:verify|E:round-2-document-audit]: Compared against the captured round-1 document: exactly 13 intended edit locations cover the eight fixes; all other specification content is byte-identical. Ten screen sections, 22 wireframes, balanced fences and all 28 relative source links remain valid. Whitespace checks pass, including an explicit check of the untracked document; `git diff --check` also passes. Only the two admitted files appear in worktree status. No runtime tests, browser/contrast checks, commit or remote operation were run for this wording-only change. Final specification SHA-256: `3e28c81405162dceca9af41546cf62ac5bc5f42300bd69263055ecf6dc42d601`.
- 2026-10-19 Handoff: supersedes the round-1 ready-for-review entry only for the revised document. Round 2 is ready for coordinator re-review; no new independent verdict is claimed. Both files remain uncommitted, the bead remains open in its claimed state, and coordinator delivery/vault projection boundaries are unchanged.
- 2026-10-19 Playbook-proposal — `gas-city-coordinator` (design fixture review): symptom: round-1 review held the spec because a short ELF unit was presented as a long-reading specimen. Cause: citing an existing unit ID did not verify the paragraph and question counts needed by the wireframe. Rule: check fixture shape against each depicted reading interaction; record an explicit shared-kit dependency when the committed sample cannot exercise it. Proposed here for coordinator relay because the exact two-file write set and managed writable roots exclude `~/scratch/skill-gotchas/`; no write there was attempted.
