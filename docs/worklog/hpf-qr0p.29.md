---
bead: "hpf-qr0p.29"
project: "hpfetcher"
session: "ci-wisp-c3dkv9h"
status: "implemented_uncommitted"
---

# Worklog — hpf-qr0p.29

## Findings

- 2026-10-20: Claimed the assigned bead, no molecule. Clean base `a0aaedb77a7b6201b24ba3a1d7c9ebb55aeab549`. Read kit v2, Raster B0 sections 12–14, the round-1 brief, earlier Raster worklogs and source. Only the admitted files may change.

## Decisions

- Reuse Raster paper/ink/signal OKLCH tokens, Archivo headings and controls, IBM Plex Serif reading, ruled registers and contents margin. Library uses a 3/9 contents/lesson split; Konto a 4/8 identity/settings split; ELF preserves the 7/5 reading/answer workspace and opaque phone tray.
- Read all content from the provider. Preserve each lesson family, actual practice scope and reversible read state. Account actions never imply acknowledgment the kit cannot supply. English content has its own language scopes; Swedish controls stay Swedish.
- Fix pass navigation clearing, symmetric phone navigation padding, and verify completed Home plans. All new UI copy is proposed; supplied content/disclosure remains verbatim.

## Progress

- [S:ci-wisp-c3dkv9h|W:hpf-qr0p.29|H:inspect|E:clean base, contract and write set verified] Begin new-screen contract and behavior regressions before implementation.

## Spec gaps

- §12: no bookmark, return anchor, lesson loading/error state or complete catalog bodies in kit v2. Only `uppslag.open` carries a body. Requesting another entry must retain the actual supplied lesson with an honest request status until the provider changes it. No fabricated bookmarks or read-time estimates.
- §13: preference actions return void and there is no save/sync/error model. Render provider values and report requests without claiming a confirmed save. No advanced/diagnostics/feedback action is supplied; only supplied links can be shown. Raster fixes palette/type/spacing per §13 and owner question 4; declare palette/font/density omissions.
- §14: no loading status or explanation language field; ELF explanation content uses English, per screen-14 contract. Shared citation resolver understands only its existing validated references; unsupported English paragraph references remain prose. Existing cloze helpers are private to DrillQuestion; reproduce their semantics locally without editing shared files.

## Handoff

- Implementation in progress. Leave uncommitted. Coordinator owns browser verification if sockets are blocked, independent Claude review, delivery and closure. Final order: DONE note, deferred/unassigned park, verify, drain.

## Implementation and verification — 2026-10-20

- **Screen 12:** `RasterUppslag.tsx` supplies the eight-section register, read/learning status, ordered contents and a single actual lesson. The contents margin is 3/9 on desktop and a collapsed native disclosure on phone. Protocols, traps (including worked/counter examples), roots, tactics and rules retain their own fields and appropriate practice labels. Mathematics uses MathText. Read marking is reversible and provider-authoritative; opening/reading does not fabricate a bookmark or mastery change. Missing examples disable entry practice while keeping explicitly labelled whole-section practice. A requested lesson never replaces the supplied body with an invented one; a new provider entry receives focus only after a user request.
- **Screen 13:** `RasterKonto.tsx` provides identity with wrapping email, actual plan when supplied, light/dark through `onTheme`, coach, smart/random and streak preferences through separate patches, current daily minutes, supplied help/legal links and an explicit Öva return. Palette/font/density remain fixed and are declared in `meta.omits.konto` per B0. Export, signout and deletion live in the deep account disclosure; export precedes deletion. Exact typed `radera` and an explicit confirm are required. The request is latched once, never claimed successful, and the opener remains focusable with guarded `aria-disabled` after confirmation. Synchronous/rejected action failures produce truthful status without optimistic preference state.
- **Screen 14:** generalized `RasterDrill` uses `data.drills.elf` and the shared controller, with no round-1 screen-number transitions. Passage/title, prompt, choices, answer summary and explanation content are English; Swedish controls/headings/accessible paragraph labels keep Swedish scopes. Synthetic content retains the approved disclosure; authentic text omits it. Cloze items preserve the actual gap-number chain, underscores and surrounding real numbers using the existing private helper semantics. Missing passage/options has an Öva exit and no answer action; missing explanations retain the actual verdict. Completed sessions show actual right/total and never recommend completed plan items.
- **Reading robustness:** new session/deck identities remount the core before a shrinking deck can dereference an old index. Same-passage questions retain passage scroll; new passage content resets it. Required inline and option images gate Svara, Enter and Space during loading, error and retry; mounted copies own readiness, cached images are detected and a shared consecutive figure retains its state. Citation visits preserve expanded details, expose the paragraph and provide Till förklaringen with the previous tray/scroll state. Scroll regions own host keys. The phone tray reserves its actual height instead of covering the last paragraph; its full prompt wraps and its controls stay reachable.
- **Carry-overs:** `Raster.tsx` clears the active pass when navigating away or selecting the hub after the runner has ended, so a passive host cannot remount a failed runner and resubmit. Phone bottom navigation has symmetric 12 px side padding. Existing completed-Home-plan behavior is retained and its desktop/phone regressions pass. The old destination placeholder is removed; own navigation now reaches Uppslag and Konto.
- **Raster identity:** existing scoped paper/ink/signal tokens, narrow Archivo quantities, IBM Plex Serif reading, flat ruled rows, real ordered contents/step numbers and one yellow continuation remain intact. New styles inherit opaque surfaces, focus rings, 44 px targets and reduced motion. Phone and narrow-container layouts stack the contents/account columns, preserve safe-area clearance and avoid clipped English prompts.
- **Red-first evidence:** declaring screens 12–14 before their implementation produced 10 failures / 151 passes. Final focused suite: **196 Raster tests PASS**. New regressions cover family-aware lessons, requested versus supplied content, exact practice/read actions, absent examples, preference rejection, typed deletion/focus/backdrop/single request, ELF language scopes/cloze/partial content/images/session changes/citations, and failed-pass navigation under a passive host. Real-host tests also verify scroll key scopes and the account preview leaving switcher focus alone.
- **Required checks:** `pnpm -C app typecheck` PASS; `pnpm -C app lint` PASS (four existing informational messages outside Raster); `pnpm -C app test --reporter=dot` **109 files / 2,666 tests PASS**; `git --no-optional-locks diff --check` PASS. No shared-test failure or shared-file correction is required.
- **Browser limit:** `pnpm -C app dev --host 127.0.0.1 --port 5178 --strictPort` failed with `listen EPERM`. No screenshots, computed contrast, native browser focus, touch/drag or enlarged-text layout verification is claimed. Coordinator must run the requested 16-view screenshot pass per new screen, plus phone navigation padding and reading/dialog states, outside the sandbox.

## Additional spec gaps

- §12: the model supplies only the open lesson body, without bookmark/read-time/loading/failure/return-context fields. All section indexes remain discoverable, but opening another body depends on the host supplying it. No unsupported “Till frågan” or bookmark state is invented.
- §13: the current action contract has no asynchronous save acknowledgment or deletion/export result. Requests and observed failures are labelled as such; there is no “Sparat”, synchronized state or successful export/deletion claim. Daily minutes are displayed; no unsupported goal/exam editor or new tool destination is introduced.
- §14: the existing citation resolver handles only references it can validate against the actual paragraphs. Unsupported English paragraph references remain prose. There is no separate loading state to distinguish absent content from an unfinished fetch. A changed question-ID sequence restarts the local core rather than preserving indexes/results belonging to the old deck.

## Playbook proposals — 2026-10-20

- **Playbook-proposal / astra-relay:** Real bake-off host tests can time out despite a valid direction: `stubLayout` alone leaves `clientWidth/clientHeight` at zero, so the host does not mount a stage. Stub both measurements before rendering; after a keyboard direction change, assert the switcher selection and await removal of the previous lazy/Suspense stage instead of assuming immediate unmount. This cost two verification rounds here and applies to future direction tests.
- `~/scratch/skill-gotchas/` is outside this managed worker's actual writable roots. Proposal retained here and in the vault worklog using the astra-relay managed-worker fallback; coordinator should relay it to the playbook.

## Delivery handoff — 2026-10-20

- HEAD remains `a0aaedb77a7b6201b24ba3a1d7c9ebb55aeab549`. Changes are **uncommitted and unstaged**, limited to the eleven admitted Raster files and this repository worklog; the classified worklog is maintained separately. No shared-kit/spec edits, dependency changes, signing, commits, remote actions or closure.
- Source/test/CSS snapshot SHA-256: `c213e068587e7fe1cd5a13cec3e2603133f13fe3f3578f17c5b865ee22fac346`. Reproduce by sorting basenames `Raster.tsx`, `Raster.test.tsx`, `RasterDrill.tsx`, `RasterFeedback.tsx`, `RasterHome.tsx`, `RasterKonto.tsx`, `RasterNav.tsx`, `RasterParts.tsx`, `RasterUppslag.tsx`, `meta.ts`, `raster.css`, then hashing basename + NUL + bytes + NUL for each.
- Independent Claude review has not run. Coordinator owns the browser pass, provider-gap disposition before production integration, independent review, delivery and closure. Worker finishes with a DONE note, parks deferred/unassigned, confirms it, then drains.
- [S:ci-wisp-c3dkv9h|W:hpf-qr0p.29|H:handoff|E:2666 app tests and 196 Raster tests pass; typecheck/lint/diff check pass] Implementation ready for coordinator visual review and delivery.

RASTER3 DONE: hpf-qr0p.29
