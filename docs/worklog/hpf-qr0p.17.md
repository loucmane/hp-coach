# Worklog — hpf-qr0p.17

## Findings

- 2026-10-20: Claimed hpf-qr0p.17; no molecule. Assigned tree is clean at `17dc2e1806928229911b4e45c27babc39d386b49`. Read the accepted B3 contract, kit v2, Spår B0 sections 12–14, round-1 brief, prior Spår worklogs and existing implementation.
- The kit supplies catalogue summaries and one complete lesson body. `openLesson` in the bake-off changes screen only. The UI must retain the supplied body and acknowledge requests for other entries.
- Shared reading components are also used by quant/DTK. Changes there need regression coverage across screens 2, 3, 6 and 7.

## Decisions

- Keep Spår's existing OKLCH tokens, Bricolage display and Figtree reading/UI type. The lesson's contents path and the account's section index extend the existing path vocabulary; ELF uses the existing tray and feedback sheet.
- Build inside the exact admitted write set, leaving shared kit/spec files untouched. New screen data comes only from `useDirectionData`.
- New dialogs use native `showModal`, explicit close before unmount, and opener restoration. Only actual dialogs/menus own host shortcut keys.
- Delivery remains uncommitted and deferred for coordinator review, host verification and signed delivery.

## Progress

- [S:hpfetcher/codex-1|W:hpf-qr0p.17|H:inspect|E:clean-base-and-accepted-contract] Inspection complete; adding red-first coverage for the new screens and completed Home plans.

## Spec gaps

- §3 screen 12: Only one complete lesson body; no bookmark, catalogue blurbs, loading/error/retry state or deep-link action. Catalogue selection requests provider content without fabricating it. Counts derive from supplied entries.
- §3 screen 13: Mode supports light/dark only. Calm remains local to the mounted direction; there is no calm/tactic/goal/weekly-goal/import/reset-diagnostic action or save acknowledgement. Do not offer unsupported controls or claim persistence.
- §3 screen 13 / §5 question 8: Palette and coach are deliberately omitted per spec. Font and density remain real kit preferences and send individual patches.
- §3 screen 14: No feedback-vote or skip action. English citations and gaps must fit existing writable components; no new shared helper file.

## Handoff

- Implementation and verification in progress. Browser screenshots and any sandbox-blocked checks belong to the coordinator. All newly authored UI copy is proposed copy; approved disclosure text remains provider-owned and verbatim.

## Delivery — 2026-10-20

### Built

- **12 · Uppslag & lektion** (`SparUppslag.tsx:52`): Verbal/Kvant catalogue with derived read counts and reading rings, a library view with the currently open lesson, local search over supplied summaries, and one provider-owned lesson beside a contents path. Phone contents use a native modal sheet. `Contents` (`:416`) names the current step and read state; `LessonBody` (`:463`) renders protocol paths and distractors, four-beat worked trap examples, roots and example words, MEK rules, and DTK tactics. All body copy comes from the provider, math uses `MathText`, and practice without examples is disabled. Read toggles/next ask the host; a failed read toggle prevents advancing. A lesson request leaves the existing body visible until a new provider lesson arrives, with the contract's explicit notice.
- **13 · Konto & inställningar** (`SparKonto.tsx:24`): identity with an email fallback, section index, immediate light/dark, independent font/density patches, smart/random drill selection, local calm switch, exam date label, supplied help links, export, signout, and an in-page typed `radera` confirmation. Account changes do not produce unsupported save/sync/deletion-success claims. The preview is labelled; deletion calls the action only once after the exact word. Palette/coach omissions are declared with the spec reference in `meta.ts:22`. Errors remain local to their action.
- **14 · ELF** (`SparDrill.tsx:213`): the existing opaque reading column and Spår tray/sheet, English title/passage/byline/prompt/options/explanation, Swedish surrounding UI, verbatim ÖVNINGSTEXT copy, optional folded tactics, short-text options open at entry, and local grading without a jump to screen 3. Numbered gaps (`:628`) preview the selected word, reserve the intrinsic width of all supplied options, retain corrected words across questions, and show their sentence in the tray. English curly-quote/ordinal citations (`:766`) augment the shared citations without editing the kit. Missing passage/options/explanations render without invented content. The end sends “Till Öva” to `go('ova')`, or returns a framework drill to its entry.
- **Shared reading safeguards** (`SparDrill.tsx:492`): required question and option images gate click/Enter/Space through receipts keyed to source **and mounted element**; failures and retries block submission, cached complete images count, shared inline figures retain readiness, and a new source or layout-mounted replacement waits for its own load. A changed session/deck identity remounts the core, including a shrinking or emptied deck.
- **Frame and Home** (`Spar.tsx:207`, `:227`, `:460`; `SparHome.tsx:71`): routes 12–14, distinct Konto/Utseende/Hjälp menu targets, real account identity, no current main destination on Konto, no section scroll/focus on direct Konto entry, completed Home rows disabled and an explicit completed-plan message. The native dialog helper (`sparParts.tsx:590`) closes before unmount, handles backdrop coordinates/Escape, and restores its opener. Menus/dialogs alone own host keys; reading columns, options and feedback do not.
- **Design** (`spar.css`): existing colours/fonts/radii retained. Catalogue rings and the path encode real reading state; settings use large rounded cards and a quiet index; English gap slots borrow the existing stop shapes. Calm/reduced-motion rules apply. The batch-2 phone top-bar selectors around `spar.css:5662` remain intact.
- `meta.screens` now declares 1–14. No shared kit, spec, dependency, generated file, or other direction was edited.

### Verification

- Red first: the five initial B3 tests failed before implementation (lesson body/notice, zero-example practice, Konto/deletion, ELF, completed Home plan).
- Expanded B3 coverage includes all lesson body families; provider replacement and empty catalogue; local search; failed read update; independent preference patches; export/delete failure; native phone dialogs and opener restoration; required images including retry/cache/shared source/new source/layout replacement; changed/empty sessions; gaps and English citations; missing passage; and real-host light/dark.
- Real `Redesign2026Bakeoff` tests fire `3` and ArrowRight on the **focused** element at entry, in reading paragraphs, options, verdicts and feedback controls, for screens 2, 3, 12, 13 and 14 at both widths. They confirm host key routing without adding reading keyscopes.
- The full app suite passed before final optional-data refinements: 109 files, 3,078 tests. Final results are appended below.
- Browser probe: `pnpm -C app exec vite --host 127.0.0.1 --port 4173` was refused with `listen EPERM`. No browser screenshot, visual contrast/spacing check, or browser validation of the batch-2 phone top bar is claimed. Coordinator: run the requested screenshot matrix for 12–14 plus reading 2/3 and the preserved phone top bar; include native phone contents/account sheets and text-spacing overrides.

### Additional spec gaps

- §3 screen 12: the view model has no history/bookmark, full bodies for unselected entries, reading-time field, hash-navigation contract, or confirmed remote read acknowledgement. The library calls its existing body “Öppen lektion”; it does not imply a persisted bookmark. “Nästa” marks read only through the supplied action and waits for provider content.
- §3 screen 12 accessibility: `ProtocolEntry` mixes Swedish instruction prose and English examples in unannotated strings, including both Swedish and English quotations. The implementation preserves the mixed prose instead of guessing a language from quotation marks. Structured language spans are needed to switch voices reliably inside those lesson strings. This limitation does **not** apply to screen 14: every known English content block there is explicitly marked.
- §3 screen 13: font/density patches are real preferences, while the bake-off retains Spår typography/spacing; the page says so. There is no System mode, persistence result, import/reset action, goal setter or tactic preference. Hjälp opens the account's supplied help links because the kit has no separate help-navigation action.
- §3 screen 14: no prior-open history for disclosure, helpfulness vote, skip or persistence acknowledgement. The first ELF question opens the note; other entry points keep it folded. Session/deck replacement resets to the provider's clamped start, rather than retaining answers by a stale numeric index. An unacknowledged action is never described as a confirmed remote save.

### Proposed copy

All new UI text in this batch is proposed. In particular: “Öppen lektion”, catalogue/search/read-state labels, request/error/empty notices, the labelled deletion preview, the font/density preview hint, gap state labels, and “Dagens plan är klar. Välj själv om du vill öva mer.” Existing approved ÖVNINGSTEXT text and provider content remain verbatim. The prescribed lesson-request notice is used verbatim.

### Playbook proposal

- **gas-city-coordinator / 2026-10-20:** Symptom: tagging all ELF lesson quotations English also tags Swedish examples incorrectly. Cause: `ProtocolEntry` has mixed-language strings without span metadata; the ELF section code identifies the subject, not the language of its lesson instructions. Rule: distinguish English drill content from mixed-language framework prose in briefs; request annotated language spans before automatic tagging of lesson substrings. Proposal is retained here for coordinator relay because this managed worker's writable roots exclude `~/scratch/skill-gotchas/` (the astra-relay playbook documents this fallback).

### Final verification and handoff

- [S:hpfetcher/codex-1|W:hpf-qr0p.17|H:verify|E:3081-tests-typecheck-lint] Final `pnpm -C app typecheck`: PASS. Final `pnpm -C app lint`: PASS, four pre-existing informational findings in unrelated landing-bakeoff files. Final `pnpm -C app test`: **109 files / 3,081 tests PASS** (19.31 seconds). Spår now contains 206 tests, including 32 B3-specific cases. `git diff --check`: PASS.
- No shared test failed; no shared-test follow-up patch is required by this run.
- Work stays **uncommitted** on the assigned branch, based on `17dc2e1806928229911b4e45c27babc39d386b49`; no new implementation commit exists. Independent cross-vendor review is pending. The coordinator owns browser checks, signing, PR delivery and merge gates.
- Final source receipts (SHA-256, paths relative to `app/src/components/devbake/redesign/c-spar/`):

| File | SHA-256 |
| --- | --- |
| Spar.tsx | `4497ff86655bfd80d43e8221ecf83d2653925819f370ebb6fefe62d27d337f0d` |
| SparDrill.tsx | `468f5714deae3c6543cf55faed7cfc70cde39fec2c8bc8c593060115951676af` |
| SparHome.tsx | `14766f1a263a400dbdd6e5f46d59bd46dc41543c1755f42610f0fc6459fc9c0c` |
| SparKonto.tsx | `265034e32317623f38bfd991857b5c85725f5b876f1047e196803c9616f9cda0` |
| SparUppslag.tsx | `e997a2692f15b34b9e3c2d46eb64ec892d0c3af3f70b844be1b3a6700de850d1` |
| Spar.test.tsx | `071e50a452c0e3bc10fb6c6b3ea16befce8e720a78c778ba9127f514c9b1637c` |
| meta.ts | `fc7faa01246e012a34fc3155eb4720da3e47ffaf20f52ff39291d2ab1e90907d` |
| sparParts.tsx | `cf432463eea63c4b5112f151eff7c27d4bdc2b1dd79fca9b44bc1da4ef00cee9` |
| spar.css | `d7a6652f34576eb63eafbd29dcf70dd381bd7f8ae387eef2508991df646dc726` |

- Ready for the prescribed DONE note, deferred parking and drain. Browser validation remains outstanding because loopback listening is sandbox-blocked.
- [S:hpfetcher/codex-1|W:hpf-qr0p.17|H:handoff|E:deferred-readback] DONE note recorded; native `bd show` confirms DEFERRED after clearing the assignee. Work remains uncommitted for the coordinator. No further work is claimed.

## Round 2 — 2026-10-20

### Review fixes

The accepted review-fix contract starts from clean commit `a73b19aa2081dd449fc32eb9ee65b8081fadf709` (containing base `17dc2e1806928229911b4e45c27babc39d386b49`). The independent Claude review at `/home/loucmane/scratch/hpf-qr0p.17/review-r1.md` returned HOLD. No molecule controls this bead.

Paths below are relative to `app/src/components/devbake/redesign/c-spar/`.

| Finding | Fix | Red-first regression in `Spar.test.tsx` |
| --- | --- | --- |
| P2: stale Konto jump after a switcher return | `Spar.tsx:261` clears the jump when the host screen changes. Explicit menu jumps still land on their requested section. | `:234`, “consumes a menu Konto jump before a switcher return”, desktop and phone, through the real `Redesign2026Bakeoff`. Before: returning 12 → 13 focused Utseende. After: Ditt konto is focused, no `scrollIntoView` runs; another explicit Inställningar request still scrolls exactly once. |
| P2: ELF gap CSS overrides MEK | `SparDrill.tsx:643` uses `sp-gapslot`; `spar.css:8099` gives it inline-grid and intrinsic sizing, with measure/visible children sharing `grid-area: 1 / 1`. `spar.css:4856` restores the MEK `.sp-gap` block exactly to the pre-batch rule. | `:298`, “uses distinct classes for ELF gap slots and the MEK underline blank”. Before: the ELF element had `sp-gap`. After: it has `sp-gapslot` only; a rendered MEK blank retains `sp-gap` only. Existing gap preview/correction tests now select the scoped class. |
| P3: deletion failure copy | `SparKonto.tsx:340` uses “Kunde inte radera kontot. Inget raderades — försök igen.” verbatim. | `:468`, “handles export failure and uses the specified deletion failure copy”. Before: the required sentence was absent. After: the full specified copy appears, with no deletion-success claim. |
| P3: singular hit count | `SparUppslag.tsx:238` renders “1 träff”; other counts retain “träffar”. | `:180`, “uses the singular search count for exactly one catalogue hit”. Before: “1 träffar”. After: exact “1 träff”. |
| P3: contents path loses its current stop while a section request is pending | `SparUppslag.tsx:70`, `:191`, `:325` keep the path and phone contents label on the displayed lesson's section until the provider replaces it. | `:191`, “keeps the contents stop on the displayed lesson while another section loads”, desktop and phone. Before: the path switched to ORD while the displayed LÄS lesson had no current stop. After: the displayed lesson retains its stop, then the new provider lesson receives it. |
| P3: short ELF passage covered by the open tray | `SparDrill.tsx:1055`, `:1110` place the tray after the complete short passage inside the same desktop scroller. `spar.css:2566` makes that tray participate in normal flow with no height cap. Longer texts and feedback retain their existing docked layouts. | `:273`, “places the short ELF tray after the whole passage in the same desktop scroller”. Before: the tray sat outside the scroller as an overlay. After: it follows the passage, options start visible, grading still works, and long text/feedback stay outside that flow. Browser geometry remains a host check. |
| P3: Om texten starts open | `SparDrill.tsx:287` starts the disclosure closed while preserving its toggle and approved body text. This supersedes the initial delivery note describing an expanded first ELF question. | `:262`, “starts ELF with Om texten closed while retaining its disclosure”, desktop and phone. Before: toggle said Dölj and the note was expanded. After: Om texten starts collapsed and opens on request. |

The “gratis dogfood” plan wording is unchanged as requested.

### Verification

- [S:hpfetcher/codex-1|W:hpf-qr0p.17|H:red|E:10-intended-regressions] Before source edits, `pnpm -C app exec vitest run src/components/devbake/redesign/c-spar/Spar.test.tsx -t 'singular search|contents stop|menu Konto|Om texten closed|short ELF tray|distinct classes|specified deletion'` failed all **10 selected tests**, each for the intended defect. After the fixes, the same selection passed **10/10**. Nine cases are new; the existing deletion-failure case was updated to the accepted copy.
- [S:hpfetcher/codex-1|W:hpf-qr0p.17|H:verify|E:3090-tests-typecheck-lint] Final `pnpm -C app typecheck`: PASS. Final `pnpm -C app lint`: PASS, with the same four pre-existing informational findings in unrelated landing-bakeoff files. Final `pnpm -C app test`: **109 files / 3,090 tests PASS** (18.33 seconds); Spår contains 215 tests. `git --no-optional-locks diff --check`: PASS.
- No browser layout PASS is claimed. The accepted contract assigns the browser check to the coordinator; the prior delivery recorded Vite loopback `listen EPERM` in this sandbox. Verify ELF with actual gaps, long option words, short text with the tray open, expanded disclosure, text-spacing overrides, and both themes; check MEK blanks remain underlines. Unit tests establish DOM/state behavior, not rendered geometry.
- Only six admitted source/test files and this worklog changed. No dependencies, other direction, shared kit, frozen Aegis/Taskmaster files, or unrelated source were changed.

### Source receipts and handoff

All changes remain **uncommitted** on the assigned branch at `a73b19aa2081dd449fc32eb9ee65b8081fadf709`. Round-2 independent review, browser validation, signing and delivery belong to the coordinator. The bead is ready for its DONE note, deferred parking, confirmation and drain; it must not be closed by this worker.

| File | SHA-256 |
| --- | --- |
| Spar.tsx | `01838cbf643e9f9b5496fe1e63f378de5997e380746470a0572be10105e1f0a8` |
| SparDrill.tsx | `b74ebfe9811780934d5e5df934a521ae76c5115b21d7f761e24df291aa55c387` |
| SparKonto.tsx | `a999ec2ec228f7717c12e9691c87a691f1537f6f0ea2438e3addfc0d636b0498` |
| SparUppslag.tsx | `f0da21808a8588dcb1ef5f39128300754f53abdf35489aa53fcf46c56be08384` |
| spar.css | `4f2469225f08dd58abf3c39e3b63cbec9d553cf8201a4d2683b091ef47decbf6` |
| Spar.test.tsx | `9d05d5767f51c2bf1f7b80b8ef897d1fbaa40e5746bf01995a8d51ce9aaa2f08` |

### Playbook-proposal

- **gas-city-coordinator / 2026-10-20:** Symptom: ELF gap slots passed unit tests and screenshots while MEK's shared selector broke their layout and altered MEK blanks. Cause: jsdom ignores the stylesheet and the default screenshot fixture contains no ELF gap. Rule: give structurally different controls distinct classes, add DOM isolation coverage, and require browser fixtures for each content form (including gap-fill and short-text/open-tray states). Retained here and in the classified worklog for coordinator relay to `~/scratch/skill-gotchas/gas-city-coordinator.md`; that directory is outside this managed worker's writable roots, as documented in the astra-relay playbook.
