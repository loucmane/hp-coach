---
bead: "hpf-jsnf"
project: "hpfetcher"
session: "ci-wh33e"
status: "report_uncommitted"
---

# Worklog — hpf-jsnf

Implements the owner's ratification of the legacy P5 batches 1–13 (owner 2026-10-07: "ratify them, make sure they are up to par") on the read-only re-audit [`pipeline/synthetic/infold/AUDIT-batches-1-13.md`](../../pipeline/synthetic/infold/AUDIT-batches-1-13.md) (bead hpf-v2nd). Learner text is Swedish; these notes are English.

## Result

| Roster status | Units / questions | Basis |
|---|---:|---|
| `approved` | **120 / 340** | batches 14–19 by owner rulings, 39 / 121; batches 1–13 by the ratification record, 81 / 219 |
| `pending-owner-ratification` | **0 / 0** | — |
| `retired` | 8 / 33 | `RETIRED.json`, unchanged |

- **Task 1, las-b7-002.** Renamed »Ellen Sundqvist« to »Frida Ullbrink«; the unit is now revision 2 and is ratified at r2. The full-name M-ECHO finding is gone for both `las-b7-002` and `las-b4-002`.
- **Task 2, las-b6-003.** The one-entity law-16 check of »Sandviken« is **PASS**: a bare locator ('near'). The unit was not edited and is ratified.
- **Task 3, roster.** `build_roster.py` reads a new ratification record, `pipeline/synthetic/infold/ratification-2026-10-07.json`, with 81 entries: ratify 48, ratify-with-note 32, fix 1.
- **Task 4, re-run.**
  - Tests: **1638 passed, 7 xfailed**, against a baseline of 1614 passed, 7 xfailed. The 24 added tests account for the difference.
  - Approved-only export: **120 units / 340 questions** (LÄS 52 / 136, ELF 68 / 204), not stamped PREVIEW, identical across processes, and lint-clean in default and `--strict` mode.

## Snapshot and boundaries

- **Claim.** `gc hook --claim --json` returned `hpf-jsnf`, assignee `gc__implementation-worker-ci-wh33e`, route `hpfetcher/gc.implementation-worker`. `bd show hpf-jsnf --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- **Head.** `git rev-parse HEAD` gave `989ccd66ccc269fba92d66b7bf36656bb0458019` on `codex/hpf-535m-infold-export-contract`, as the bead says. The audit's two untracked deliverables, `AUDIT-batches-1-13.md` and `docs/worklog/hpf-v2nd.md`, were present. They are kept for the PR and were not edited.
- **No git writes, no network.** Every change is uncommitted.
- **Untracked entries.** `.bash_profile` … `.zshrc`, `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc` and `.vscode` are the sandbox's `/dev/null` mounts, as noted in hpf-535m and hpf-v2nd. They and `.agents/`, `.claude/skills/`, `.codex/` and `.gc/` were left alone.
- **`gc.check_path`.** `build-artifact-valid.sh`, sha256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`, is the dispatcher's post-close check. The bead names no validator, so it was not run.
- **Baseline.** Before any edit, `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` gave **1614 passed, 7 xfailed**.
- **Scratch.** `/tmp/claude-1000/-home-loucmane-dev-hpfetcher-worktrees-hpfetcher-lane/23389875-751a-4ba2-a8cb-199ec0800cdf/scratchpad/hpf-jsnf/`, written `$S` below. Nothing in it is part of the deliverable.

## Task 1 — las-b7-002: the law-13 rename

### Choosing the name

The new name is **Frida Ullbrink**:
- **Female given name.** It keeps »säger hon« and the other pronouns in agreement.
- **Ordinary given name.** This follows the 2026-10-06 standing rule to include "at least one ordinary, unremarkable name" in a cast.
- **Coined surname.** Law 16 says "prefer distinctive coinages", and the batch15 addendum asks for "clearly invented but Swedish-plausible surname blends".
- **Saturated families avoided:** the Hal- prefix, Ingrid, Mar- given names, the -ius, -by and -qvist surname families, and the -mark, -myr and -fors endings already in the registry.

Uniqueness checks, all run before the edit:

| Query | Scope | Result |
|---|---|---|
| `rg -n -i 'ullbrink\|ulbrink\|ullbrinck\|uhlbrink\|ullbring\|ullbrin\|llbrink'` | whole worktree: every batch, both name registries, the real-entity sweep | 0 hits |
| `rg -n -w -i 'frida\|fridas'` | `pipeline/` | 0 hits |
| `rg -n -o -i '\bUll[a-zåäö]*'` | `pipeline/synthetic/batches` | 0 hits |
| `rg -n -i 'brink' --glob '*.json'` | `pipeline/synthetic` | no unit has a -brink surname. The only hits are search logs and one audit note naming the real surnames Brinkhage (`las-b17-002`) and Nybrink (`las-b2-002`) |
| Name registries, read in full | `batches/batch15/BRIEF-ADDENDUM.md:76-120`; `batches/batch19/BRIEF-ADDENDUM.md:19-25, 217-225, 246-252` (231 used given names, 274 full pairs, the batch17/18 additions) | neither Frida nor Ullbrink |
| `rg -c -i 'ullbrink'` | authentic corpus `data/parsed` | 0 |
| `rg -c -i 'frida'` | authentic corpus `data/parsed` | 5 files. Frida appears only as a first name: in quantitative word problems, and in one LÄS byline, »Frida Lundberg« (`host-2013.json`). A shared first name is not a law-13 or law-16 collision. |

### Law-16 check of the new name: offline only

**Method.** The bead forbids network access, so no web index was queried. The batch19 addendum's RULE 14 recipe (sv.wikipedia CirrusSearch and Nominatim, each with a positive control) was not run, and no absence of real bearers is claimed. The check consisted of:
1. the repository, registry, sweep and authentic-corpus greps above;
2. a model-knowledge screen, which is recall, not a search. No notable person named Frida Ullbrink is known to the model, and no notable bearer of the surname Ullbrink, in transport planning or anywhere else. The nearest real surnames it knows are Ullberg, Åsbrink, Nybrink and Ulbricht, all 3 or more edits away.

**Result.** The name passes the offline screen: there is no known real notable person in the role. It is **flagged for a RULE-14 web check before release**. The bank's own search logs show that plausible coined blends often have real bearers (Brinkhage, Nybrink and Hjortmar were all rejected on web evidence).

This is written in the unit as a search log (`generator_meta.originality_note`), never as a certificate. It also appears in the ratification note and in batch7's ADJUDICATION and STATUS entries.

### Before and after

`pipeline/synthetic/batches/batch7/candidates-final/las-b7-002.json`. These five places were the only mentions of the person.

| Field (line) | Before | After |
|---|---|---|
| passage ¶2 (`:6`) | Trafikplaneraren Ellen Sundqvist har följt flödena före och efter bygget. | Trafikplaneraren Frida Ullbrink har följt flödena före och efter bygget. |
| passage ¶3 (`:6`) | Sundqvists slutsats är försiktig men tydlig: | Ullbrinks slutsats är försiktig men tydlig: |
| `questions[0].prompt` (`:10`) | Vad visade, enligt texten, Ellen Sundqvists mätningar vid den nya cykelvägen? | Vad visade, enligt texten, Frida Ullbrinks mätningar vid den nya cykelvägen? |
| `questions[0].rationale` (`:30`) | … inte det Sundqvist mätte. | … inte det Ullbrink mätte. |
| `generator_meta.self_blind_solve` (`:85`) | All entities fictional (Kvarnby, Ringleden, Ellen Sundqvist, Tobias Renander) | All entities fictional (Kvarnby, Ringleden, Frida Ullbrink, Tobias Renander) |

Unchanged:
- the title and every other passage byte, the byline Tobias Renander included;
- q2 in full and all eight option texts;
- both keys (C, B), `key_spread`, `planted_traps` and `question_families`.

In the unit, the old name now occurs only in the metadata that records the rename: `originality_note` (`:86`), the repair log's ticket (`:92`) and its five `from` fields (`:96`–`:120`).

**Metadata added to `generator_meta`:**
- `originality_note`, the search log above.
- `repair_log`, one entry: date, round `law13-fullname-rename`, `by`, ticket, the five edits with `from`, `to` and `note`, `unchanged` and `regate`.

Per hpf-jnkq, a unit without a top-level repair log gets `generator_meta.repair_log`.

**Revision.** `build_roster.py` now has `REVISIONS = {"las-b7-002": 2}`, and the roster row carries revision 2:
- content sha256 `1378306dc4e752fb2ca2a7be312c42a5b4bc6254468cbaf21be41a39342dcec1`;
- file sha256 `83e712a53bfa3b39afeed02fc16fdb9d239871e99fd696ac5caa4a81df99ebc1`, against r1's `859f7d88…eecc`;
- qids `p5-las-b7-002-r2-LÄS-001` and `-002`.

**Append-forward notes.**
- `batches/batch7/ADJUDICATION.md`, new section »Law-13 rename — 2026-10-07 (hpf-jsnf): las-b7-002 r2 …« (`:313`). The 2026-07-24 package text stays as historical evidence.
- `batches/batch7/STATUS.md`, new section »Current status — 2026-10-07 (hpf-jsnf)«.

**Scope.** Only `candidates-final/` was edited, as the bead specifies and as in PR #361, whose las-b12-002 rename left `candidates-corrected/` untouched. The pre-final copies keep the old name as historical stage artefacts: `candidates/`, `candidates-corrected/` and `gen-las-short-1.json` and its `.NOTES.md`. All three unit copies were byte-identical before the edit, at `859f7d88…eecc`.

### Mech and lint

Each run used:
- `run_mech.py … --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed`;
- `--p5-corpus-dir` set to the 19 roster source directories, batches 1–17 `candidates-final` and 18–19 `candidates`, spelled out in full;
- stderr `M-ECHO: indexed 128 shipped unit(s)`, the complete selection the audit used.

**Before the rename** (`$S/mech-before.jsonl`), M-ECHO:
- `las-b7-002`: flag, "name reuse: ['Ellen Sundqvist', 'Sundqvist'] already used in las-b4-002" and "name reuse: ['Sundqvist'] already used in las-b5-003";
- `las-b4-002`: flag. Lindqvist with las-b3-003 and with las-b5-001, Sundqvist with las-b5-003, and "name reuse: ['Ellen Sundqvist', 'Sundqvist'] already used in las-b7-002";
- `las-b5-003`: flag, Sundqvist with las-b4-002 and with las-b7-002.

**After, on the final bytes** (`$S/mech-final-3.jsonl`):

| Unit | M-SCHEMA | M-BANDS | M-TELL | M-FORM | M-ECHO | M-PLAGIARISM |
|---|---|---|---|---|---|---|
| las-b7-002 | pass | pass | pass | pass | **pass, no finding** | pass |
| las-b4-002 | pass | pass | pass | pass | flag: Lindqvist (las-b3-003), Lindqvist (las-b5-001), Sundqvist (las-b5-003) | pass |
| las-b5-003 | pass | pass | pass | pass | flag: Sundqvist (las-b4-002) | pass |

The full-name finding is gone for both units.

**All 81 legacy units, final bytes** (`$S/mech-81-final.jsonl`, same corpus):
- 486 verdicts: 468 pass, 18 flag, 0 kill.
- All 18 flags are M-ECHO, with 32 findings: 24 against kept units and 8 against retired ones.
- The audit had 19 flags and 36 findings, 28 kept and 8 retired. The difference is exactly las-b7-002's two findings, the full-name finding on las-b4-002 and las-b5-003's finding against las-b7-002.
- No finding mentions las-b7-002 or Ellen Sundqvist.

**Lint.** las-b7-002 r2 was exported alone:
- `export_product.py --include-pending --release preview-hpf-jsnf --units las-b7-002 --out preview/hpf-jsnf/las-b7-002-r2` → "learner lint clean (12 strings)";
- `lint_learner_output.py` on that export → `clean — 1 file(s)`, and `--strict` also clean;
- the export was then moved to `$S/preview-las-b7-002-r2`.

The full approved bank is linted under task 4.

## Task 2 — las-b6-003: the law-16 check of Sandviken

**The entity.** The passage reads: »En liten uppföljning som pedagogen Ellen Boström gjorde vid en grundskola i Sandviken satte ord på något jag länge anat.« (`batches/batch6/candidates-final/las-b6-003.json:6`). It is the only mention of Sandviken in the unit, with none in the prompts, options or rationales. Sandviken is a real Swedish town and municipality; the sweep itself establishes that at `adjudication/real-entity/verdicts-b11-12.json:397`.

**The question.** Is Sandviken a bare location for an invented person's small follow-up study? Or does the passage attach a fabricated specific fact to the real town, or identify a real private person?

**What the passage claims about Sandviken.** Nothing:
- the follow-up is by an invented educator, Ellen Boström, swept clear at `verdicts-b4-5-6.json:388-391`;
- it takes place at an unnamed compulsory school, one of many in the municipality, so no school is identifiable;
- its finding concerns pupils' spatial problem-solving in general, not the town, its schools or its administration;
- the pupils are anonymous and plural, and the passage itself hedges the result ("svag och osäker … gällde långtifrån alla");
- the batch6 generator recorded the intent: "Sandviken is a real town, the study and people are fictional" (`batches/batch6/gen-las-short-2.NOTES.md:14-16`).

**The sweep's precedent.**
- *Bare locator, 'near'.* Norrköping as the seat of an invented institute: "The passage makes no factual claim about Norrköping itself beyond hosting the invented institute, so this stays a near rather than a collision" (`verdicts-b11-12.json:388-391`).
- *Bare locator, 'near'.* Kvarnby with invented traffic counts: "Real place, unrelated specific claim -- worth noting, not blocking" (`verdicts-b7-8.json:152-155`).
- *Ship-blocking.* Sandviken in las-b12-002, because that passage attached "a specific, verifiable-sounding, fabricated fact" about the town's own facilities, a 1927 cast-iron urinal "som ingen förvaltning vill kännas vid", and "an unnamed but identifiable private individual", the retired plumber (`verdicts-b11-12.json:394-397`).
- *The bar for RENAME REQUIRED* is "a notable real entity of the SAME type" carrying falsified detail (`verdicts-b13-14.json:443`).

**Verdict: PASS, a bare locator ('near').** No fabricated fact is attached to the town, its administration or a named school, and no real private person is identifiable. The unit was not edited and is ratified with this note. The verdict is recorded in the unit's ratification entry and in this worklog. The real-entity register `verdicts-b4-5-6.json` was not amended.

## Task 3 — the roster

**The ratification record** is `pipeline/synthetic/infold/ratification-2026-10-07.json`, format `p5-ratification-v1`, new:
- **Top-level fields:** `ratified_by: "owner 2026-10-07"`, the ruling, the audit path, the audited roster sha256 `9ccfe9a4…dc65`, `implemented_in`, and `units`.
- **One entry per kept legacy unit, in roster order:** `unit_id`, `revision`, `content_sha256`, `recommendation` (`ratify`, `ratify-with-note` or `fix`) and `note`.
  - The digests were copied from the audited roster; las-b7-002's was taken from the rebuilt r2 row.
  - The notes are copied from the audit: each unit's flag text and the "Why" of its group in list (b), with the unit's own names and line refs.
  - The two conditional rows also say how their condition was met.
  - las-b2-003 and las-b3-002 are `ratify` with a context note: the »bäst« stem, and the topic pair. That follows the audit's remarks in list (a).

**`build_roster.py`:**
- `load_ratification`, plus `check_ratification`, which refuses and never repairs any of these:
  - other top-level or entry fields;
  - a wrong format or audit path;
  - an empty ruling or `ratified_by`;
  - a unit outside batches 1–13, unknown, or listed twice;
  - a malformed or non-hex digest;
  - a revision the unit has not reached;
  - a digest that differs from the unit's content at that revision;
  - an unknown recommendation;
  - a missing or empty note.
- An entry for an earlier revision covers nothing: the unit is pending with "revision N: no ruling recorded for this revision". Retirement still wins over a ratification.
- Approval resolves after the census, so the record can be checked against every row.
- A ratified row:
  - gets `approval: approved`, `ratified_by: "owner 2026-10-07"` and `ratification_note`;
  - keeps its old evidence, the shipped-final record and the master row;
  - adds the audit summary row `| <unit> | <SEC> | <n> |` in `AUDIT-batches-1-13.md` and the record entry `"unit_id": "<unit>"`;
  - for las-b7-002, also cites batch7's ADJUDICATION note.
- Every row now has `ratified_by` and `ratification_note`, null outside batches 1–13. The roster gains a top-level `ratification` block. `REVISIONS = {"las-b7-002": 2}`.
- **ROSTER.md** is regenerated:
  - "For the owner: ratify batches 1–13" becomes "Ratification of batches 1–13", with the counts, the fix at r2 and "Still pending: none";
  - the topic-pair line is computed from the pair's status;
  - the Revisions line is computed and lists las-b7-002 r2.
- The roster and ROSTER.md are regenerated by `build_roster.py`, never hand-edited, and `--check` reports them current.

**Tests:**
- `test_infold_roster.py` reflects the new counts: approved 120 / 340 (81 / 219 ratified, 39 / 121 by ruling), pending 0 / 0, retired 8 / 33. The evidence-kind test now requires the master, audit and record references on ratified rows. The revision tests merge into `REVISIONS` rather than replace it.
- 24 tests are new:
  - full coverage of the record and its counts;
  - the r2 fix and its student strings;
  - the pending-on-a-later-revision rule;
  - a record ahead of the unit's revision;
  - retirement winning over a ratification;
  - 18 malformed-record cases.
- `test_infold_export.py`:
  - the approved export is now 340 rows with no pending exclusions;
  - the two tests that used `las-b2-003` as their pending unit mark a tree copy pending instead;
  - a new test pins las-b7-002's r2 qids.
- **Committed sample.** `export_product.py --sample` rewrote only the roster sha256 in `preview/sample/_export-manifest.json`. The bank bytes are unchanged at `08938291…6d28`.

**The audit's count slip.**
- The audit's verdict table (`AUDIT-batches-1-13.md:14`) and the hpf-v2nd worklog say "31 ratify-with-note (2 of them conditional), 1 fix". The bead repeats "the 31 ratify-with-note units".
- The audit's own summary table and list (b) give **32** ratify-with-note: 30 unconditional plus the 2 conditional ones, las-b4-002 and las-b6-003. With 48 ratify and 1 fix that makes 81.
- Read the bead's way, 48 + 31 + 3 would be 82, so the record follows the per-unit table: 48 + 32 + 1 = 81, every kept legacy unit.
- `AUDIT-batches-1-13.md` itself was not edited; it is hpf-v2nd's deliverable.

## Task 4 — re-run

- **Tests.** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` gave **1638 passed, 7 xfailed** in 22.7 s, run last on the final state. The infold tests alone are 160 passed.
- **Roster check.** `build_roster.py --check` printed `roster: 128 units / 373 questions; retained 120 / 340 (LÄS 52 / 136, ELF 68 / 204); retired 8 / 33; approved 120 / 340; pending owner ratification 0 / 0`.
- **Approved-only export.** `export_product.py --out pipeline/synthetic/infold/preview/approved`, without `--include-pending`, printed `exported 120 units / 340 questions …; learner lint clean (1940 strings); excluded 8 retired, 0 pending`.
  - The manifest has `"preview": false` and `"include_pending": false`, an empty pending exclusion list and `"findings": []`.
  - The bank holds 136 LÄS rows and 204 ELF rows.
  - The same command with `--check` printed `checked 120 units / 340 questions`, so the bytes are identical across processes.
  - `lint_learner_output.py preview/approved preview/sample` → `clean — 2 file(s)`; `--strict` on `preview/approved` → `clean — 1 file(s)`.
- **Sample.** `export_product.py --sample --check` passes.
- `preview/full`, the include-pending export from hpf-535m, is a stale, gitignored local artifact. It was not refreshed.

## Files

| Path | Change | sha256 (final) |
|---|---|---|
| `pipeline/synthetic/batches/batch7/candidates-final/las-b7-002.json` | rename, `originality_note`, `repair_log` | `83e712a53bfa3b39afeed02fc16fdb9d239871e99fd696ac5caa4a81df99ebc1` |
| `pipeline/synthetic/batches/batch7/ADJUDICATION.md` | appended dated section | — |
| `pipeline/synthetic/batches/batch7/STATUS.md` | appended dated status | — |
| `pipeline/synthetic/infold/ratification-2026-10-07.json` | new: the ratification record | `4964c2973b2ea49ccf26b3941a5a8334630909296bef77a7f91e4b7c6e3a37b6` |
| `pipeline/synthetic/infold/build_roster.py` | reads the record; REVISIONS r2 | `30fcc01d5f5a7af58840569e13dc80e8dadb2ec4377fae8a95f1322ec55474d4` |
| `pipeline/synthetic/infold/approval-roster.json` | regenerated | `e31eba3603de4053606e20d48c2d805f05fbb1e1b9b4009c0261cdb43078b58d` |
| `pipeline/synthetic/infold/ROSTER.md` | regenerated | `a691020cc9b03184a6d3f397b8d002e8abed1cdc166ce7fd22455bebc71cc905` |
| `pipeline/synthetic/infold/preview/sample/_export-manifest.json` | roster sha256 only | `85db52a4e02c3731fbdddce22d648aa49a8460a6d8d401a7cfce40785537b0c5` |
| `pipeline/synthetic/infold/tests/test_infold_roster.py` | counts, ratification tests | — |
| `pipeline/synthetic/infold/tests/test_infold_export.py` | counts, pending-unit tests, r2 qids | — |
| `docs/worklog/hpf-jsnf.md` | this log | — |

Tools were used unmodified: `export_product.py` `b370f30c…a97e`, `mech.py` `516478b5…bfcd`, `run_mech.py` `cd4a4518…8077`, `lint_learner_output.py` `76b98653…877b` and `RETIRED.json` `5e7a1031…15d0`, all equal to the hpf-v2nd record. The local approved bank is `0d68913c…0b6c`.

## Open items for the owner

1. **Web-check »Frida Ullbrink«.** Run RULE 14 (sv.wikipedia exact phrase and Nominatim, each with a positive control) before release. The lane had no network, and the name is approved on an offline screen only.
2. **The topic pair `elf-b3-002` · `las-b3-002`.** It is still `pending-owner-confirmation` and enforced conservatively. The audit asked for the owner's word on it with the ratification; the ruling ratified the units, not the pairing.
3. **Batch 7's pre-final copies keep »Ellen Sundqvist«.** That covers `candidates/las-b7-002.json`, `candidates-corrected/las-b7-002.json` and `gen-las-short-1.*`. Re-running `promote.py --promote` for batch 7 would copy `candidates-corrected/` over the r2 file, so it should not be run on this shipped batch.
4. **Optional housekeeping from the audit, not done:** re-derive batch 1's `final_verify.jsonl` (E1), re-run `gkey_resolve.py` with `q:N` targets (E2), and re-run G-KEY ×2 plus the audit for las-b10-002 (E3).
5. **Observed in las-b7-002, not changed.** The passage still uses »Invändningen kommer genast« and em dashes. Both are on later generation lists (law 14's phrase blocklist; the batch15 addendum's dash rule). The unit predates both, no gate flags them, and the audit did not raise them.

## Commands refused or replaced

- `git -C <worktree> rev-parse HEAD`, `status` and `branch` were denied by the permission policy. The plain `git` forms, run from the worktree, were used instead.
- The Read tool could not open a persisted tool-output file under `~/.claude`. The same roster facts came from a compact `rg -o -r '$1'` re-run instead.

## Progress

- 2026-10-07 [S:ci-wh33e|W:hpf-jsnf|H:research|E:989ccd66ccc269fba92d66b7bf36656bb0458019] Claimed and verified the bead. Read the audit, the hpf-v2nd worklog, the builder, exporter and tests, GENERATION.md laws 13 and 16, both name registries and the real-entity sweep. Baseline 1614 passed, 7 xfailed.
- 2026-10-07 [S:ci-wh33e|W:hpf-jsnf|H:implement|E:$S/mech-before.jsonl] Chose »Frida Ullbrink«: 0 hits in the repo, the registries, the sweep and the authentic corpus. Renamed the five loci and recorded mech before and after: las-b7-002 6/6 pass, and the full-name finding gone for both units.
- 2026-10-07 [S:ci-wh33e|W:hpf-jsnf|H:implement|E:pipeline/synthetic/infold/ratification-2026-10-07.json] Bumped REVISIONS to r2 and wrote the 81-entry ratification record. Extended `build_roster.py` and appended the batch7 notes. The roster is approved 120 / 340, pending 0 / 0.
- 2026-10-07 [S:ci-wh33e|W:hpf-jsnf|H:verify|E:verdicts-b11-12.json:388-397] las-b6-003 Sandviken law-16 check: PASS, a bare locator.
- 2026-10-07 [S:ci-wh33e|W:hpf-jsnf|H:verify|E:$S/mech-81-final.jsonl] Updated the tests and regenerated the sample. 1638 passed, 7 xfailed. The approved-only export is 120 / 340, lint-clean and identical across processes. Mech over 81 units shows 18 M-ECHO flags and 32 findings, none naming las-b7-002.

## Bead note

LANE DONE: hpf-jsnf
