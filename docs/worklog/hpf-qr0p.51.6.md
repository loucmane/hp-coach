# Worklog — hpf-qr0p.51.6 (LJ-C1b: trap question titles and families)

Marker: `LJC1B TITLES` (the bead description says `LJC1 TITLES`; the final note carries both).

## Findings

- 2026-11-03: Base `2f2e6810414c6d98bd040ec6fc18c6e19efe82f8` (origin/main), branch
  `codex/hpf-qr0p.51.6-ljusbord-lj-c1b-trap-question-titles-and-families-both-catal`, clean at
  start. Dependencies were installed. The untracked dotfiles in the worktree root (`.bashrc`,
  `.gitconfig`, …) are sandbox mount points, not part of this bead, and are not staged.
- Read `hpf-qr0p.51.4-worklog.md` first. Its finding holds: repo-root `frameworks/` is the
  canonical source and `app/public/frameworks/` a hand-kept byte-identical copy (all seven
  pairs had the same sha256 at base). One correction: a copy guard already exists.
  `app/src/data/frameworkCopies.test.ts` (hpf-7og2, 2026-10-19) compares every JSON file in
  `frameworks/` with its served twin. The new `frameworksCopies.test.ts` does what the bead
  asks on top of it: it pins the seven titled catalogs by name, so losing one from both
  directories fails too.
- Every reader of the catalogs tolerates new optional fields:
  - `pipeline/frameworks/schema.py` uses pydantic models with the default `extra='ignore'`;
  - `leverage.py` reads only ids and `section`;
  - `build_worked_examples.mjs` reads only ids and `example_questions`;
  - `app/scripts/redesign-fixtures.mjs` reads only id, headword, `tldr` and the example count;
  - `useTopTraps`, `trapCluster` and `uppslagView` read only `tldr`/`pattern_description`;
  - `export_product.py` pins each catalog's sha256 in the sample manifest (updated, see below).
- The naming clash flagged in 51.4 is real: the catalog's top-level `family` is
  `'kva_traps'`, while the new per-entry `family` is the trap group. I kept the bead's field
  name. The per-entry value is always a Swedish display name ("Fri parameter"), never a slug,
  and both doc comments in `frameworks.ts` say which is which.

## Decisions

- **Data model.**
  - Every entry of the seven catalogs gets `question_title`, inserted right after `id`.
  - Each of the 138 KVA, XYZ and NOG traps gets `family`, inserted after `question_title`.
    Its value is the family's `name`.
  - Each quant catalog gets a top-level `families: [{name, description}]` before
    `entries`, listed in the order of each family's first trap.
  - No existing field changed: the authoring script deep-compares every catalog without the new
    keys against the original, and `git diff --numstat` shows additions only.
  - `version` is left alone, as an existing field.
  - Types in `app/src/data/frameworks.ts`: optional `question_title` on the trap, tactic,
    constraint and protocol entries; optional `family` on `TrapEntry`; a new `TrapFamily`
    type; optional `families` on `TrapCatalog`. ORD (`ord_roots.json`) is not in scope.
- **Title rules.** A short Swedish question, at most 60 characters. It names the situation the
  student sees, from the recognition cue, and may point at the relevant dimension, as the
  owner-approved "Låser x² = y² tecknet?" points at the sign. It never states the verdict
  ("låser inte", "räcker inte"), the remedy or the answer letter.
  - Most titles are open questions ("Hur jämför du …", "Vad händer …"). After the
    pedagogy review only three yes/no titles remain, KVA-001 (nej), KVA-025 (ja) and KVA-033
    (nej), so the yes/no form is no tell.
  - Titles are written for the trap in general rather than copying the worked example's
    setup, which sits next to the title in "Gissa först".
  - KVA-TRAP-001 keeps the design's title verbatim.
- **Families by reasoning error, not topic.** The KVA catalog notes give only ID ranges
  (001–012 fri parameter, 013–022 tecken, 023–038 räknevägar), and the design sketch shows
  three families on that basis. The bead asks for the underlying reasoning error instead:
  - Traps outside 001–012 that make the same error now join "Fri parameter": 016, 021, 027,
    032, 033 and 037.
  - The 32-trap "Räknevägar och formler" bucket splits into four errors: Lånade regler,
    Förväxlade formler, Olika måttstockar and Räknevägar.
  - XYZ's notes group by topic (algebra, bråk, potenser, geometri, talteori). The new
    families cut across those topics. For example, "Förväxlade formler" holds the
    angle-relation traps next to median, sequences and probability.
  - Where KVA and XYZ share a trap, both put it in the same family: order of operations,
    roots of sums, a⁰, power of a power, radius against diameter, parallel angles,
    simplifying roots, same base, linear difference, fraction comparison and minus over a
    parenthesis.
- **Family names.** Short chip names, each with a "när …" description that completes it,
  following the design example "Fri parameter — när något fortfarande kan vandra" (kept
  verbatim). Final families, after both reviews:

  | Section | Family — description | Traps |
  |---|---|---|
  | KVA | Fri parameter — när något fortfarande kan vandra | 001–012, 016, 021, 027, 032, 033, 037 (18) |
  | KVA | Tecken och riktning — när ett minustecken eller en omvänd ordning avgör | 013, 014, 015, 018, 019, 034, 039, 045 (8) |
  | KVA | Förväxlade formler — när två närliggande samband blandas ihop | 017, 044, 051, 053 (4) |
  | KVA | Lånade regler — när en regel används där den inte gäller | 020, 023, 040, 041, 043, 048 (6) |
  | KVA | Räknevägar — när ett överslag eller en lång uträkning lockar | 022, 024, 028, 029, 031, 035, 036, 042, 046, 050, 052, 054 (12) |
  | KVA | Olika måttstockar — när talen mäts mot olika helheter eller enheter | 025, 026, 030, 038, 047, 049 (6) |
  | XYZ | Tecken och riktning — (as KVA) | 001, 002, 005, 007, 009, 028, 029, 051, 055 (9) |
  | XYZ | Hela uttrycket — när varje term ska med | 003, 010, 011, 014, 015, 030, 031 (7) |
  | XYZ | Räknevägar — (as KVA) | 004, 024, 027, 032, 041, 046, 047, 048, 052 (9) |
  | XYZ | Lånade regler — (as KVA) | 006, 008, 012, 013, 016, 017, 018, 019, 033, 034, 043 (11) |
  | XYZ | Olika måttstockar — (as KVA) | 020, 021, 022, 023, 036, 053, 057, 058 (8) |
  | XYZ | Förväxlade formler — (as KVA) | 025, 026, 035, 037, 038, 039, 040, 042, 044, 045, 049, 050, 054, 056, 059 (15) |
  | NOG | Fler obekanta än villkor — när något i systemet fortfarande är fritt | 001, 002, 018, 020, 022 (5) |
  | NOG | Kvoter utan ankare — när bara förhållanden och procent är kända | 003, 019 (2) |
  | NOG | Flera kandidater kvar — när mer än en lösning fortfarande passar | 004, 005, 006, 012, 017, 023, 025 (7) |
  | NOG | Upprepad information — när ett påstående säger det du redan vet | 007, 008, 009, 010 (4) |
  | NOG | Underskattade påståenden — när ett påstående som ser svagt ut säger mer än du tror | 011, 013, 014, 015, 016, 021, 024 (7) |

## Progress and red-first evidence

- 2026-11-03 19:08 — **Red, titles and families.** Wrote `frameworks.titles.test.ts` and
  `frameworksCopies.test.ts` before any data change, then ran
  `pnpm -C app test src/data/frameworks.titles.test.ts src/data/frameworksCopies.test.ts --maxWorkers=2`:
  - 10 failed, 7 passed;
  - every titles case failed with `KVA-TRAP-001: expected '' not to be ''` (and the same for
    XYZ-TRAP-001, NOG-TRAP-001, LAS-TYPE-001, ELF-TYPE-001, MEK-RULE-001, DTK-TACTIC-001);
  - all three family cases failed with `expected 0 to be greater than or equal to 3`;
  - the 7 copy cases passed, because the copies were still identical at base.
- 2026-11-03 19:11 — Added the types. A scratch authoring script added the fields to the seven
  canonical files. It verified that the JSON formatting round-trips, that each entry has one
  title of at most 60 characters ending in "?", that each trap is in exactly one family, and
  that every catalog with the new keys removed equals the original.
  - `git diff --numstat -- frameworks`: KVA +134/−0, XYZ +144/−0, NOG +72/−0, LÄS +8/−0,
    ELF +8/−0, MEK +16/−0, DTK +10/−0.
- 2026-11-03 19:11 — **Red, copies.** With only the canonical copies edited,
  `pnpm -C app test src/data/frameworksCopies.test.ts --maxWorkers=2` gave 7 failed out of 7
  (`expected false to be true` on `served.equals(canonical)`).
- 2026-11-03 19:11 — Copied the seven files byte-for-byte with `cp`. Then the titles test, the
  new copies test and the existing `frameworkCopies.test.ts` gave 3 files and 27 tests passed.
  - Added one assertion to the titles test: `families` is in the order of each family's first
    trap, the contract the type doc states.
- **Downstream checks:**
  - `python3 -m pytest pipeline/synthetic/infold/tests -q`, before the manifest update:
    4 failed, 527 passed. The failures were
    `test_the_committed_sample_is_reproduced_under_any_hash_seed[0]` and `[4242]`,
    `test_the_prerequisite_graph_is_the_one_framework_file_that_is_not_a_catalog` and
    `test_the_committed_sample_is_current_and_balanced`. All four report only
    `_export-manifest.json` stale, because it pins the catalogs' sha256.
  - `python3 pipeline/frameworks/leverage.py --check`:
    `app/public/leverage/framework_leverage.json is up to date`. No regeneration needed;
    leverage reads only ids and sections.
  - `pipeline/frameworks/schema.py` has no CLI (no `__main__`). I called
    `validate_framework_file` from a scratch script on both copies and on each file at HEAD:
    - KVA, XYZ, NOG, LÄS and ELF are valid, both copies and HEAD.
    - MEK fails on `constraint_type`: `'Lexikal kollokation'` is not `'syntactic' | 'semantic'`.
    - DTK fails because DTK-TACTIC-001's `tactic` is over 200 characters.
    - Both failures are identical at HEAD. They are existing-field drift that predates this
      bead, outside the write set and covered by "never change existing fields", so I left
      them as they are. CI does not run this validation.
- `pnpm -C app typecheck` passed. `pnpm -C app lint` passed: no finding in the bead's
  files, and the 4 informational findings are in devbake files outside this bead.
- 2026-11-03 19:15 — **Full app suite** `pnpm -C app test`, without `--maxWorkers`: 191 files
  passed, 1 failed; 5,376 tests passed, 1 failed.
  - The failure is `src/components/devbake/redesign/r2Fixtures.test.ts > opens the lesson
    verbatim from its catalog`. The diff is the single line
    `"question_title": "Vilken hållning har författaren?"`.
  - The devbake fixture `app/src/components/devbake/redesign/r2Fixtures.ts` embeds
    LAS-TYPE-003 verbatim (`OPEN_LESSON`). It is generated by
    `app/scripts/redesign-fixtures.mjs`, and the test compares it with the served catalog.
  - The fixture is outside the write set, so it is not touched: see Handoff.

## Reviews

The project skills `expert-language-review` and `pedagogy-review` are not registered with
this session's Skill tool. I applied each skill by running a separate read-only reviewer that
followed the skill's `SKILL.md`, adapted from exam items to UI titles. Both reviewers worked
from a generated packet that puts every new title and family next to the hidden content it
must not reveal: tldr, pattern, the worked example's setup and answer, and the protocol.

- **Language** (`expert-language-review`): **MINOR_EDITS**, with 8 minor findings and nothing
  major. The script checks found no problem with typography (”…”, the minus sign, spaces
  around %, decimal commas), agreement, definiteness or word order. All 8 fixes are applied:
  - XYZ-057 "fyller tanken samtidigt" (the verb needs an object);
  - DTK-004 "skiljer dem åt" and MEK-010 "Vad är skillnaden mellan …" (*skilja åt*);
  - NOG-016 "svara … på frågan om";
  - NOG-001 "för att bestämma …";
  - NOG-022 "tidsmässigt" ("i tid" reads as "on time");
  - MEK-015 "bygger upp en paradox";
  - ELF-005 "författaren", because the app never says "skribent".
- **Pedagogy** (`pedagogy-review`): **MINOR_FIXES**, with 1 lethal, 8 major and 23 minor
  findings. One of the majors depends on where families are displayed, which is a UI decision
  (below). All the wording, title and family-assignment fixes are applied:
  - **Lethal.** KVA-030 "Dubbel sträcka på dubbel tid — …" did the step the trap tests, and
    with the setup it gave away C. It is now "Hur jämför du två hastigheter med olika sträcka
    och tid?".
  - **Major, surface tell.** "Vad säger X om Y?" predicted D: all five KVA uses were D. Changed
    KVA-009, 016 and 021, and added counter-cases (KVA-027, B; NOG-021 and 024, both
    sufficient).
  - **Major, family answers the question.** The two NOG yes/no "Räcker …?" titles (021, 024)
    were answered by their family line. Rewritten.
  - **Major, family description.** "Underskattade påståenden — … ändå räcker" used the verdict
    word, and was false for NOG-011 and 014, whose answer is C. It now ends "… säger mer än
    du tror" ("man" became "du" in the language re-check).
  - **Major, false situation.** NOG-025 "Räcker det att veta var alla sitter?" misstated its
    own example: the statements fix the winner's seat, not who sits in it. I re-derived the
    seating by hand to confirm. It is now "Vad låser placeringen, och vad söker frågan?".
  - **Minor, title fit.** Titles that didn't fit their own setup now do: KVA-010, 015, 022,
    027, 039, 045, 047; XYZ-007, 014, 023, 059; NOG-002; LÄS-003; ELF-005, 006; MEK-007, 016;
    DTK-001.
  - **Minor, family moves.**
    - XYZ-001 goes to "Tecken och riktning", matching KVA-039.
    - XYZ-031 goes to "Hela uttrycket".
    - NOG-022 goes to "Fler obekanta än villkor".
    - "Flera kandidater kvar" now says "lösning", not "svar", which reads as an answer option.
    - "Andelar och enheter" is renamed to the error it shares, "Olika måttstockar — när talen
      mäts mot olika helheter eller enheter", in both KVA and XYZ.
  - **Three changes to the reviewer's wording:**
    - KVA-022 uses "symmetrilinje", because an upward parabola has no "topp".
    - KVA-045 says "sätter in ett värde", because the verb needs its object. XYZ-007 later got
      its own wording (see the re-check).
    - ELF-005 is merged with the language fix.
  - **After the fixes** (recomputed from the data with a scratch script):
    - 3 yes/no titles remain: KVA-001 (nej), KVA-025 (ja) and KVA-033 (nej).
    - "Vad säger" opens 3 KVA titles, D in 2 of them. Its 6 NOG uses spread over A 1, C 1,
      D 2, E 2.
    - "Hur jämför du …" opens 14 KVA titles, D in 3 of them, close to the base rate of 14 in
      54.
  - **Not fixed here, a display decision for the owner and the screen beads (LJ-32/33).**
    Families named by reasoning error predict the verdict:
    - "Fri parameter" is D in 14 of 18;
    - "Tecken och riktning" is A or B in 8 of 8;
    - "Fler obekanta än villkor" is E in 4 of 5;
    - "Underskattade påståenden" is E in 0 of 7.

    The design shows family headings in the Kapitel sidebar and in Dina fällor before the
    guess. The reviewer recommends showing a trap's family only after the guess, or accepting
    the hint as the approved "Fri parameter — när något fortfarande kan vandra" heading
    already does. No wording removes this without dropping the reasoning-error grouping the
    bead asks for.
  - **Existing-content defects, out of scope.** These would change existing fields, so they
    are not touched. Each needs its own bead:
    - KVA-TRAP-041's worked answer says "C — ungefär lika (≈ 6)", but √84 − √10 ≈ 6.0029 > 6,
      so the KVA answer is A.
    - KVA-TRAP-051's setup says "i alternatläge", which gives away C on the guess screen.
    - Several worked-example setups print raw exam ids ("Detta är host-2013-kvant2-KVA-014") on
      the guess screen.
- **Language re-check** of the 32 changed titles and 3 changed family lines, by the same
  language reviewer: **MINOR_EDITS**, with 2 minor findings, both applied.
  - KVA-021 → "Hur jämför du medianerna i två serier med olika medelvärden?". The "med" phrase
    had given the means to the medians.
  - The "Underskattade påståenden" line → "… säger mer än du tror", keeping the du-voice
    instead of "man".
  - The other 33 strings are clean. The reviewer noted that KVA-045 and XYZ-007 had become
    one identical string. Dina fällor ranks traps across sections, so XYZ-007 is now "Vad
    händer med tecknen när ett värde sätts in i en funktion?".

## Final state (after both reviews)

- The authoring script was re-run on the final content, and the seven files were copied again
  byte-for-byte with `cp`.
  - Both copies are additions only (`git diff --numstat`): KVA +134, XYZ +144, NOG +72,
    LÄS +8, ELF +8, MEK +16 and DTK +10, with nothing removed.
  - 180 titles, the longest 60 characters; 17 families.
- `_export-manifest.json`: a scratch script replaced only the seven catalog sha256 values in
  the `frameworks` block. It checked that nothing else in the manifest changed; `ord_roots.json`
  keeps its pin.
- `python3 -m pytest pipeline/synthetic/infold/tests -q`: **531 passed**.
- `python3 pipeline/frameworks/leverage.py --check`: up to date. `framework_leverage.json` is
  unchanged.
- Schema (`validate_framework_file` from a scratch script): KVA, XYZ, NOG, LÄS and ELF are
  valid in both copies. MEK and DTK fail only on the existing-field drift that predates this
  bead, identical at HEAD (see Progress).
- Title, family and copy tests (`frameworks.titles.test.ts`, `frameworksCopies.test.ts`,
  `frameworkCopies.test.ts`): 3 files, 27 tests passed.
- `pnpm -C app typecheck` passed. `pnpm -C app lint` passed, with the 4 old informational
  findings in devbake files.
- `git diff --check`: clean.
- No TypeScript changed after the last typecheck and lint run. Only JSON data changed, which
  neither reads.
- 2026-11-03 19:53 — **Full app suite on the final data**, `pnpm -C app test` without
  `--maxWorkers`: 190 files passed, 2 failed; 5,375 tests passed, 2 failed.
  1. `r2Fixtures.test.ts > opens the lesson verbatim from its catalog`: the same out-of-write-set
     fixture as before. It now misses
     `"question_title": "Vilken hållning har författaren eller en person i texten?"`.
  2. `SessionPlayer.resume.test.tsx > … > shows graded earlier gaps when attempts arrive
     cached` (`aria-pressed` was "false", expected "true", at line 154). This is unrelated to
     this bead:
     - the file reads no framework data (`grep -c` for framework, catalog and title names
       gives 0);
     - it passed in the first full run;
     - it passed 3 of 3 when run alone with
       `pnpm -C app test src/components/session/SessionPlayer.resume.test.tsx --maxWorkers=2`.

     It is a timing-dependent flake under full parallel load.
- 2026-11-03 19:56 — **Full app suite, rerun** on the same final state: 191 files passed,
  1 failed; 5,376 tests passed, 1 failed. The only failure is the out-of-write-set
  `r2Fixtures.test.ts` case, and the SessionPlayer flake passed.

## Handoff

- **State: blocked**, on one file outside the write set. DO steps 1–6 are finished inside the
  write set, with the evidence above.
- **Blocker.** `app/src/components/devbake/redesign/r2Fixtures.ts` has to be regenerated.
  - The fixture embeds LAS-TYPE-003 verbatim as `OPEN_LESSON`.
    `r2Fixtures.test.ts > opens the lesson verbatim from its catalog` compares it with
    `app/public/frameworks/las_taxonomy.json`, which now carries `question_title`.
  - Fix with the generator's own command, from `app/`: `node scripts/redesign-fixtures.mjs`.
    Its `--check` mode should then report up to date. The only expected change is
    `question_title: 'Vilken hållning har författaren eller en person i texten?'` in
    `OPEN_LESSON`.
  - Either admit the fixture to the write set or regenerate it on the host. I neither
    edited nor ran the generator: the file is outside the write set, and the bead forbids
    ad-hoc node runs.
  - Until then, CI's `pnpm test` fails on that one case.
- **Decision for the owner, and the brief for LJ-32 and LJ-33.** Family labels predict the
  verdict (counts in Reviews). The approved Kapitel and Dina fällor sketches show family
  headings before the guess. The reviewer recommends showing a trap's family only after the
  guess. The data supports either choice, since `family` is a separate field from
  `question_title`.
- **Follow-up beads.** Each would change existing fields, so none is done here:
  - KVA-TRAP-041's worked answer should be A, not "C ≈ 6";
  - KVA-TRAP-051's setup gives away C ("i alternatläge");
  - raw exam ids appear in several worked-example setups;
  - `schema.py` drift: the MEK `constraint_type` labels against `syntactic`/`semantic`, and
    DTK-TACTIC-001's `tactic` is over 200 characters.
- **For the consumers.** Every entry of the seven catalogs now has `question_title`, so
  LJ-32's and LJ-33's "Fälla N" fallback is no longer reached for these catalogs.
  `TrapCatalog.families` lists the families in the order of each one's first trap, and
  `TrapEntry.family` names one of them.
- Nothing is committed. Only the write-set files are staged; the sandbox's untracked dotfiles
  are left out. `framework_leverage.json` needed no change. Scratch scripts (authoring, manifest
  sync, schema check, review packet) live in the session scratchpad, outside the repo.

## Final steps: bead commands failed twice

1. The `--set-metadata` update was denied by the session's "don't ask" permission mode.
2. The `--append-notes` update, in the exact Codex form, exited 1 on a sandbox restriction:
   - `failed to open uow provider: … open /home/loucmane/gascity/city/.beads/dolt/proxy.lock: read-only file system`;
   - also the warning `workspacegate: open gate /home/loucmane/dev/hpfetcher-gc-main/.beads.gate.lock: … read-only file system`.

Per the bead's rule, I stopped issuing bead commands after the second failure and did not try
the park command. The bead is still `in_progress` under this session, which did not drain. The
coordinator needs to run these three commands:

```bash
/home/loucmane/gascity/bin/gc bd update "hpf-qr0p.51.6" --set-metadata "gc.worker_state=blocked" --set-metadata "gc.worker_state_reason=All six DO steps done inside the write set; app pnpm test fails only on r2Fixtures.test.ts because the devbake fixture app/src/components/devbake/redesign/r2Fixtures.ts, outside the write set, embeds LAS-TYPE-003 verbatim and must be regenerated with node scripts/redesign-fixtures.mjs from app"
/home/loucmane/gascity/bin/gc bd update "hpf-qr0p.51.6" --append-notes "BLOCKED: blocked — LJC1B TITLES (LJC1 TITLES) hpf-qr0p.51.6: all six DO steps are done inside the write set (180 question titles, 17 reasoning-error families in KVA, XYZ and NOG, both copies byte-identical, types and red-first tests, manifest hashes, language and pedagogy reviews applied; infold pytest 531 passed, leverage up to date, typecheck and lint pass). Full app suite: 191 of 192 files pass; the only failure is r2Fixtures.test.ts, because the devbake fixture app/src/components/devbake/redesign/r2Fixtures.ts embeds LAS-TYPE-003 verbatim. Remaining work and requested help: admit that fixture to the write set or regenerate it on the host with node scripts/redesign-fixtures.mjs from app (expected change: OPEN_LESSON gains its question_title), then rerun app pnpm test. Owner decision for LJ-32 and LJ-33: show a trap family only after the guess, since family names predict the verdict. Evidence in docs/worklog/hpf-qr0p.51.6.md"
/home/loucmane/gascity/bin/gc bd update "hpf-qr0p.51.6" --status deferred --assignee ""
```

BLOCKED: hpf-qr0p.51.6 — titles and families done in the write set; the
`r2Fixtures.ts` regeneration (outside the write set) and the bead bookkeeping remain for the
coordinator.
