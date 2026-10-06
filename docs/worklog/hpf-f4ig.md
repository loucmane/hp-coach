# Worklog — hpf-f4ig

## Findings

- Base verified before implementation: `746b6e1dd50d9af18e53765ff156ec817311f8ef`.
- KaTeX 0.16.45 registers `mathsfit` in `src/functions/font.ts`; the lint's
  handwritten style list omits it. Font registrations also live in `text.ts`
  and `pmb.ts`. `styling.ts` and `sizing.ts` declare math styles and font sizes
  that leave the content's letters intact.
- No nested AGENTS.md exists in the affected pipeline or docs directories.

## Decisions

- Generate a deterministic JSON inventory from every `defineFunction` names
  declaration in those five KaTeX files, including the `sizeFuncs` constant.
  Record the installed package version and source paths. Reject unfamiliar
  declaration syntax rather than silently generating an incomplete list.
- Load the checked-in inventory relative to the lint file. Node, node_modules,
  and the generator are not runtime dependencies of the lint.
- Keep the existing non-font wrappers (boxes, cancellation, math classes, and
  similar commands) separately, preserving their behavior.
- Add public scan_text and default JSON CLI regressions for each generated
  command, plus all seven requested mathematics guards. Prove the failures
  before changing the lint, and check regeneration against installed KaTeX.
- Per operator instruction, use this lane worklog for evidence and the pending
  bead note. Do not call Gas City or write the Beads database. Leave all changes
  uncommitted and leave MathText.tsx untouched.

## Progress

- [S:ci-6hkfn|W:hpf-f4ig|H:inspect|E:git rev-parse HEAD and installed KaTeX sources]
  Scope and base confirmed; implementation and validation are pending.

## Handoff

- Work in progress in the requested lane; no commits or workflow mutations.

## Red-first evidence

- Before changing `lint_learner_output.py`, generated the inventory and ran:
  `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests/test_katex_style_inventory_round11.py`.
  Result on the unchanged base lint: **37 failed, 594 passed** (3.49 s).
- Failures: both split labels (`WORLD_KNOWLEDGE` and `tone_misread`) under
  each of the 12 missing styles (24 scan_text failures), the corresponding
  default CLI cases (12 failures), and the standalone CLI mathsfit repro
  (1 failure: exit 0, clean). Every mathematics guard passed before the fix.
- Generated 48 commands from KaTeX 0.16.45: 22 from font.ts, 10 from text.ts,
  1 from pmb.ts, 4 from styling.ts, and 11 from sizing.ts.
- Inventory difference from the old 55-command list: added `mathsfit`, `Huge`,
  `LARGE`, `Large`, `footnotesize`, `huge`, `large`, `normalsize`, `scriptsize`,
  `sixptsize`, `small`, `tiny`. The old list's 36 font/style entries remain;
  its other 19 commands move unchanged to the separate non-font wrapper list.
  No prior command is removed; the combined set is now 67 commands.
- Baseline public CLI store probe: default exit 1, **2 findings in 27 files**;
  strict exit 1, **74 findings in 27 files**. Full outputs retained for exact
  before/after comparison in `/tmp/hpf-f4ig-1uic9of3/store-before-default.txt`
  and `/tmp/hpf-f4ig-1uic9of3/store-before-strict.txt`.
- [S:ci-6hkfn|W:hpf-f4ig|H:red-first|E:/tmp/hpf-f4ig-1uic9of3/red.txt]
  Failure evidence captured before the lint edit; generated inventory now
  loaded by the lint, and the K2 contract documents regeneration.

## Verification and delivery

All required runs passed on the uncommitted implementation. The baseline
counts below are the task brief's counts; the red-first tests and both store
probes were actually run against the unchanged base lint in this session.

| Check | Baseline | Result |
|---|---|---|
| New round-11 regression file | 37 failed, 594 passed (red-first) | 631 passed |
| `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` | 777 passed, 7 xfailed | 1408 passed, 7 xfailed |
| `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q` | 847 passed, 7 xfailed | 1478 passed, 7 xfailed |
| `cd app && npx vitest run --reporter=default` | 794 passed | 794 passed, 75 files |
| Default CLI over `data/explanations` | 2 findings in 27 files | Identical output, exit 1 |
| CLI over `data/explanations --strict` | 74 findings in 27 files | Identical output, exit 1 |
| New tests in a scratch tree with no app or node_modules | — | 630 passed, 1 skipped |

- App tests ran with `NPM_CONFIG_OFFLINE=true`; no dependency installation or
  network access was needed. All 7 existing strict xfails remain unchanged.
- Full logs: `/tmp/hpf-f4ig-1uic9of3/{red,green,gates,ci,vitest,without-katex}.txt`.
  The store logs use `store-{before,after}-{default,strict}.txt` in that folder.
  Before/after store outputs compared equal byte-for-byte, not merely by count.
- The isolated scratch tree contains only the lint, generated JSON, generator,
  and new test file under the same relative paths. Its single skip says:
  `app/node_modules/katex is absent; regeneration requires installed KaTeX sources`.
  All other regressions still run. A separate regression copies only the lint
  and JSON to a temporary directory and runs the public CLI there.
- With the installed KaTeX 0.16.45 and jsdom, rendered each of the 48 commands
  around `KNOWLEDGE` and `WORLD\_KNOWLEDGE`, using `throwOnError: true`.
  The `.katex-html` textContent matched the expected letters for all 96 cases;
  no parse failures or content mismatches. The split case supplies `WORLD_`
  from prose, so it renders as the reported label.
- `MathText.tsx` is byte-identical to HEAD. All 55 previously recognized
  commands remain recognized; only the 12 discovered font/style commands are
  added. No changes to the vocabulary, matching rules, rendered views, CLI
  handling, or the existing non-font wrappers.
- Reviewed the implementation and generated inventory against the installed
  sources. This is implementation/self-check evidence, not an independent PR
  review verdict. The source reader intentionally supports literal names
  arrays and constant-array references; an unfamiliar source declaration
  fails regeneration and must be reviewed.
- [S:ci-6hkfn|W:hpf-f4ig|H:verify|E:required suites, exact store-output comparison, installed-source regeneration]
  Required checks green; all requested files remain uncommitted.

Implementation files and SHA-256 (base HEAD remains
`746b6e1dd50d9af18e53765ff156ec817311f8ef`):

| File | SHA-256 |
|---|---|
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | `2c62de6f213d4ffb59b191a76113a79b71eeef039269afbad0a8192e2268a837` |
| `pipeline/synthetic/gates/scripts/katex_inventory.py` | `f129a393e86298b7c498ea883db530a587a817538665b4976f8ae0dcb89725ba` |
| `pipeline/synthetic/gates/scripts/katex_style_commands.json` | `c1ceaf6ef9c60c5746d653214ecb2d7b6e33c5be76746134b163b01607478a90` |
| `pipeline/synthetic/gates/scripts/tests/test_katex_style_inventory_round11.py` | `d042134d325b30086aae48c01e57b735cc1a354f82adfc26ade165d132705fcf` |
| `pipeline/synthetic/LAYER2-RENDERING.md` | `947b7fe3d9f74ae21e1537f8ff3545e4f0b223c74a0eb7b3a4a36bee921c78b6` |

## Handoff — complete

Six scoped files are ready for collection: the five implementation files above
and this worklog. No commit, checkout, stash, reset, push, Beads operation,
Gas City lifecycle call, or authority change was made for this task. Existing
untracked runtime/skill files remain untouched. The database note is pending
below as instructed; no implementation blocker remains.

## Bead note (pending)

Implemented R11 from 746b6e1: offline generator + 48-command KaTeX inventory; lint catches mathsfit and 11 size styles, preserving all prior commands. Red: 37 failures; green: 631. Gates 1408 passed/7 xfailed; exact CI 1478/7; Vitest 794. Store unchanged: 2 default/74 strict in 27 files. MathText unchanged. All six scoped files uncommitted; evidence in docs/worklog/hpf-f4ig.md. No Beads writes.
LANE DONE: hpf-f4ig
