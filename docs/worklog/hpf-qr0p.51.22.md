# hpf-qr0p.51.22: answer leak in the lesson resume line (LEAK22 RESUME)

## Findings

- 2026-11-05: claimed hpf-qr0p.51.22 through `gc hook --claim --json` (session ci-wisp-8ij0o9z) and verified the id, status, assignee and route with `bd show`. Base and unchanged HEAD: `8ebaa9d5628ed4aed8ae2ded7b13bb40c405c648`.
- Cause confirmed. The lesson branch of `pickCandidate` built `progress` as `vid ${entryHeadword(entry, framework)}`. For a trap catalog that is the whole `pattern_description`, and for KVA-TRAP-001 it states the answer ("… missar att x = -y är lika giltigt.").
- These consumers get the fix through the hook, with no consumer edits:
  - classic `NavRail` (`RailResume` renders `c.progress`);
  - classic `ResumptionPanel`;
  - the Folio rail's Idag, Öva and Historik lines (`useShellData` passes the candidate to `shellSubtitles`);
  - Folio Idag (`useIdagExtras` passes `resume` to `idagView`).
- **The Uppslag rail line does not come through the hook.** `app/src/folio/data/useShellData.ts:58-59` calls `entryHeadword` itself and passes `lesson: { section, title }` (line 112) to `shellSubtitles`. That renders `uppslag` as "KVA · <headword>", so the Uppslag line still leaks. The file is outside the write set; see the final section.

## Decisions

- New helper `lessonPlace(entry, framework)` in the hook, used only by the lesson branch:
  1. If the entry has a non-blank `question_title`, use it, passed through `keepMathTogether`. For KVA-TRAP-001 the line is `vid Låser x² = y² tecknet?`, with no-break spaces around `=`.
  2. Otherwise, in a trap catalog (`nog_traps`, `kva_traps` or `xyz_traps`), use `vid fälla N`, where N is the id's trailing number (KVA-TRAP-016 gives "fälla 16").
  3. Otherwise use `pågående lektion`.
  The headword, tldr, recognition cue and every other field are never read.
- Behaviour change beyond traps: a non-trap entry without a question title now reads `pågående lektion`. This includes ORD roots, which used to show the root (`vid o-`). It follows the bead's rule, "pågående lektion for anything else". All seven titled catalogs carry `question_title` (guarded by `frameworks.titles.test.ts`), so DTK, MEK, LÄS and ELF show their question titles in practice.
- Design note for the visual check: the approved rail in `r6/A/idag.html:84-89` names a paused lesson by number: "Avsluta fälla 1 först", "KVA · pausad i fälla 1" and "Pågår: fälla 1". This bead's instruction puts the question title first, and I followed it. If the shorter design copy is wanted in the rail, the only change needed is to swap steps 1 and 2 in `lessonPlace`.
- No live visual check. The sandbox is offline, so Clerk sign-in can't complete. Both surfaces are checked by tests: the classic `ResumptionPanel` render test, and `useFolioShellData` through the real hook into `shellSubtitles` for the Folio rail. `NavRail` renders the same `c.progress`.

## Red-first evidence

- Command, from app/: `pnpm test src/components/home/useResumptionCandidate.test.tsx src/folio/data/mappers.test.ts --maxWorkers=8`, run with `pnpm --dir app`.
- Red, with the tests written and the source untouched: exit 1. `Test Files 2 failed (2)`, `Tests 14 failed | 33 passed (47)`. Examples:
  - `Expected: "vid Låser x² = y² tecknet?"`, received `"vid Student ser x² = y² (eller kvadratlikhet) och drar slutsatsen x = y — missar att x = -y är lika giltigt."`
  - `Expected: "vid fälla 16"`, received the same headword.
  - `Expected: "vid Hur hittar du det största eller minsta värdet?"`, received `"vid Skanna visuellt vid extremvärden — läs INTE av varje värde."` (the DTK tactic headword).
  - mappers: `Expected: "Fortsätt KVA-lektion, Låser x² = y² tecknet?"`, received `"Fortsätt KVA-lektion, Student ser x² = y² …"`.
  - mappers: `Expected: "Pågår: NOG-lektion · fälla 1"`, received `"Pågår: NOG-lektion · Två påståenden"`.
- Green, after the fix: the same command exited 0. `Test Files 2 passed (2)`, `Tests 47 passed (47)`.

## Tests added or changed

- `useResumptionCandidate.test.tsx`:
  - The fixture is KVA-TRAP-001 as served (headword, tldr, cue), plus an untitled KVA-TRAP-016, a blank-titled KVA-TRAP-017, DTK tactics with and without a title, and an ORD root.
  - New block "lesson progress before 'Gissa först'":
    - the question form, with the math kept together;
    - `vid fälla 16` and `vid fälla 17`;
    - a DTK question title, and `pågående lektion` for an untitled DTK entry and for an ORD root;
    - per entry: no headword, tldr, cue, answer (`x = −y`) or raw id.
  - Hook tests:
    - the cached title, and the cached untitled trap shown as "fälla 16";
    - neutral while loading, then the question title;
    - section switches KVA → DTK → ORD;
    - the classic panel render, now also checking for answer text. It reads `textContent`, because `toHaveTextContent` folds no-break spaces.
- `mappers.test.ts`:
  - "maps live counts…" now expects `fälla 1` in Idag and Historik. Uppslag is unchanged, since it comes from `useShellData`.
  - New: "keeps the trap answer out of the resume lines before 'Gissa först'". It drives KVA-TRAP-001 through the real hook into the rail and checks that Idag, Öva and Historik carry no headword, tldr or answer. It then checks an untitled trap: `Fortsätt KVA-lektion, fälla 16` and `Pågår: KVA-lektion · fälla 16`.

## Verify

- app `pnpm typecheck` (`tsc -b --noEmit`): exit 0.
- app `pnpm lint` (`biome check src`): exit 0 over 774 files. The 4 info diagnostics are older ones in devbake files (`LandingBakeoffR3/R4A/R4C` useIndexOf, `l12/M3` noUselessFragments); none are in this diff.
- app `pnpm test --maxWorkers=8` (full suite, run once): exit 0. `Test Files 203 passed (203)`, `Tests 6115 passed (6115)`, 48.4 s.
- worker/: not touched and not run.
- `git diff --check`: clean.
- SHA-256:
  - `useResumptionCandidate.ts` = `3e21fd84d8b73877e81f28f74cbb35f9408a6ebd8c5ed940f877727995190221`
  - `useResumptionCandidate.test.tsx` = `94bc0de58cbeddd86e4b8207a79fee713f5fcd389aa0469c0bf8bad296dd44a5`
  - `mappers.test.ts` = `d18a21ebdb366055b4d612006bc9b33c8ff9bb89a0f8abbd2c845ceadf7a874e`

## Scope

- Edited only the write set:
  - `app/src/components/home/useResumptionCandidate.ts`
  - `app/src/components/home/useResumptionCandidate.test.tsx`
  - `app/src/folio/data/mappers.test.ts`
  - `docs/worklog/hpf-qr0p.51.22.md`
- Untracked dotfiles in the worktree root (`.bashrc`, `.zshrc`, `.gitconfig`, `.mcp.json`, `.idea`, `.vscode` and others) were there before this work. They look like sandbox mount points. I didn't touch or stage them.
- FYI, not audited: other `entryHeadword` call sites in folio may also run before an answer. They are `useIdagExtras` (trapNames), `useOvaExtras`, `useFramstegExtras`, `uppslagView`, `useDrillContent` and `useProvResultExtras`. They are outside this bead's bug report, and I didn't check them for leaks.

## Final

State: **blocked**

- Done: the hook fix and its tests, with typecheck, lint and the full app suite green. The resume line no longer carries the headword on the classic NavRail and ResumptionPanel, the Folio rail's Idag, Öva and Historik lines, or Folio Idag.
- Remaining: the Uppslag rail line still shows the trap headword. The path is `app/src/folio/data/useShellData.ts:58-59` (`entryHeadword`), then `lesson.title` at line 112, then `shellSubtitles().uppslag`. The fix needs that file:
  1. Apply the same pre-answer rule to its title, for example by exporting `lessonPlace` from the hook and reusing it.
  2. Then change the `uppslag` expectation in mappers.test.ts "maps live counts…" from `NOG · Två påståenden`.
  3. Add Uppslag to the loop in the new LEAK22 mappers test.
  The design's Uppslag copy is "KVA · pausad i fälla 1"; which copy to use is the coordinator's call.
- Staged exactly the four write-set files with `git add`, which succeeded. Nothing is committed; the coordinator reviews and makes the signed commit on the host.
- Bead note: one `bd update hpf-qr0p.51.22 --append-notes` attempt succeeded. The bead was not closed and its status was not changed.

BLOCKED: blocked — the hook fix is done and verified (Folio rail Idag/Öva/Historik, classic NavRail and ResumptionPanel), but the Uppslag rail line still shows the trap headword through its own entryHeadword call in app/src/folio/data/useShellData.ts:58-59, which is outside the write set; help needed: admit app/src/folio/data/useShellData.ts so the Uppslag line can use the same question-title / "fälla N" rule

## 2026-11-05 coordinator companion and host verification

- Companion (outside the admitted set, one line plus import): `app/src/folio/data/useShellData.ts` now builds the Uppslag rail line with the hook's exported `lessonPlace` instead of `entryHeadword`; `mappers.test.ts` expectation updated from 'NOG · Två påståenden' to 'NOG · fälla 1' and asserts the headword is absent.
- Host: typecheck clean, lint clean (4 pre-existing infos), full app suite 6115/6115 at 8 workers.
- Follow-up filed separately: a sweep of the other pre-answer `entryHeadword` call sites (Idag, Öva, Uppslag index, daily-plan headlines).
