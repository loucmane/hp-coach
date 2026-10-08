---
bead: "hpf-c5tb"
project: "hpfetcher"
status: "x1_implemented_uncommitted"
---

# Worklog — hpf-c5tb

P5 infold PR 2b: reviewed Layer-2 explanations for the 321 P5 questions outside the pilot, in seven batches (X1–X7), each its own PR with an independent correctness and language review. Spec: `docs/p5-infold-design.md` §4 row 2b (Amendment 1) and §D. One section per batch below.

## Batch X1

Bead `hpf-c5tb.1`: the batch tooling (partition manifest, batch check, assembler) and the 44 LÄS explanations of X1 (`las-b1-001` … `las-b8-002`, 18 units).

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c5tb.1`, assignee `gc__implementation-worker-ci-alb6h`, route `hpfetcher/gc.implementation-worker`). `bd show hpf-c5tb.1 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` → `7be960102d4aeca2fd457489b706ac758fc3d20c` (detached, = origin/main per the bead).
- No git writes and no network. Nothing under `app/`, `worker/` or `app/public/`. No unit, candidate, roster or ruling file edited. The untracked runtime, skill and sandbox paths present at start are untouched.
- Sandbox note: inline interpreters (`python3 -c`) are denied in this lane, so every check below runs a checked-in script or pytest.
- `gc.check_path` is the post-close dispatcher check `…/gascity/assets/scripts/checks/build-artifact-valid.sh`, as for hpf-no7l. This bead names no validator, so this worker ran none.

### Deliverables (uncommitted)

| Path | Change |
|---|---|
| `pipeline/synthetic/infold/explanation_batches.py` | New: the partition, the batch check and the assembler (CLI and API) |
| `pipeline/synthetic/infold/explanations/BATCHES.json` | New: the partition manifest, written by the script |
| `pipeline/synthetic/infold/explanations/x1-las.json` | New: the 44 X1 entries, canonical bytes |
| `pipeline/synthetic/infold/export_product.py` | `export_bank(shard_path=…)`; `check_release` (moved out of `_build`); `read_shard(…, shown)` names the file read |
| `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` | New: 81 tests |
| `pipeline/synthetic/infold/tests/test_infold_explanations.py` | One wrapper in the determinism test passes `read_shard`'s new optional argument through |
| `pipeline/synthetic/infold/preview/sample/_export-manifest.json` | Regenerated with `export_product.py --sample`: only the exporter sha256 changed |
| `docs/worklog/hpf-c5tb.md` | New: this evidence file |

CI needs no change: `.github/workflows/ci.yml:30` already runs `pipeline/synthetic/infold/tests`.

### Tooling

**The partition** (`explanation_batches.py`, no arguments → `BATCHES.json`; `--check` → exit 1 when stale). Eligible units are selected by the exporter's own code (`_load_roster`, `_check_retirement`, `select_units`): approved and not retired, 120 units / 340 qids. The pilot's six units are batch `x0-pilot`, file `data/explanations/p5-pilot.json`. Each section's other units, sorted by (batch number, unit id), are cut by `cut()`: chunk k closes on the unit that takes the running question total to k × total / chunks, compared in integers (`running · chunks ≥ k · total`), so no float rounding. The result must equal `EXPECTED` or the build fails loudly. Each batch records its units, first/last unit, counts, file and its exported qids (`make_qid` per unit and question).

| Batch | First … last | Units | Questions | File |
|---|---|---:|---:|---|
| x0-pilot | las-b7-002 … las-b19-002 | 6 | 19 | `data/explanations/p5-pilot.json` |
| x1 | las-b1-001 … las-b8-002 | 18 | 44 | `…/explanations/x1-las.json` |
| x2 | las-b8-003 … las-b14-001 | 16 | 42 | `…/explanations/x2-las.json` |
| x3 | las-b14-003 … las-b19-003 | 15 | 42 | `…/explanations/x3-las.json` |
| x4 | elf-b1-001 … elf-b5-002 | 16 | 52 | `…/explanations/x4-elf.json` |
| x5 | elf-b5-003 … elf-b10-002 | 17 | 45 | `…/explanations/x5-elf.json` |
| x6 | elf-b10-003 … elf-b14-003 | 16 | 48 | `…/explanations/x6-elf.json` |
| x7 | elf-b15-001 … elf-b19-002 | 16 | 48 | `…/explanations/x7-elf.json` |

Total 321 + 19 = 340, the bead's table exactly. LÄS boundaries: 128 questions / 3 → 42.67 and 85.33, reached at 44 (`las-b8-002`) and 86 (`las-b14-001`). ELF: 193 / 4.

**The batch check** (`--check-batch x1`). No gate is re-implemented. The batch file is read as the shard of an export of the batch's units, through a new keyword `export_bank(…, shard_path=path)`: the export runs every bank gate and every explanation gate (shard file, coverage, schema, distractor letters, framework ids, internal labels, rationale text, learner lint, canonical bytes), twice, and compares the builds. Coverage is therefore exactly the batch's qids: a missing qid, an extra one, one from another batch or revision, an authentic qid and `_meta` are all refused. Before the export, the manifest's qids are checked against the roster's current revisions, so a revision bump names the stale manifest instead of reporting the new qids as unexplained; after it, the export's qids must equal the manifest's, in order.

**The exporter change.** `shard_path` only changes which file is read. The shard keeps the release's name in the returned files, and the manifest block records the real source path. `shard_path` without `explanations=True` is refused. `read_shard(path, release, shown=None)` names the file in messages, so a batch file is not reported as `data/explanations/…`. `check_release` is the release-name rule moved out of `_build` unchanged, so the assembler can refuse a bad name before any work. The CLI is unchanged; existing behaviour and messages for the release shard are identical.

**The assembler** (`--assemble RELEASE`, `--partial`, `--check`; API `assemble()` and `write_release_shard()`). It refuses, writing nothing, on: a bad release name; a release whose shard would overwrite a batch file (`pilot` → `p5-pilot.json`); a batch, file, unit or qid listed twice in the manifest; a manifest qid that is not eligible; for a release, any missing batch file or eligible qid in no batch (the gap count is reported); a qid present in more than one batch file; any gate of any batch; and any gate of the combined shard, validated through `export_bank(shard_path=…)` from a temporary file against every eligible row (or, for `--partial`, the present batches' rows). The last step catches what shows only across batches, such as one unit's rationale text in another unit's explanation (tested). Entries come out in bank order (roster order, so the pilot's units sit among the batches') and canonical bytes. `--partial` never writes. A release is written only to `data/explanations/p5-<release>.json`: each directory entered with `O_NOFOLLOW`, a symlinked or non-regular target refused, bytes written to a fresh temporary file and renamed over the old one (`export_product._replace`). **No release shard was written in this PR**; the real repo refuses one anyway (6 batch files missing).

### Tests

`test_infold_explanation_batches.py`, 81 tests, written before the module (red: `ModuleNotFoundError`):
- **Partition** (10): the expected table, verbatim from the bead; the committed manifest is current (in-process and in two subprocesses with `PYTHONHASHSEED` 0 and 4242); every eligible qid in exactly one batch, equal to the approved export's rows; each batch's qids are its units' exported qids; contiguous, in-order chunks with the boundary rule checked numerically; a roster without `las-b1-002` fails loudly (and `expected=None` still cuts: x1 17 units / 42); a changed expected table fails; `cut` needs a unit per chunk; a stale or missing manifest is refused.
- **Batch check** (47): the pilot is batch x0 and passes; X1 passes with its committed bytes; the CLI, also in two subprocesses; refusals for a missing qid, 7 qids outside the batch (another question, another revision, the pilot's, x2's, x4's, an authentic qid, `_meta`), 7 bad distractor-letter cases (missing, duplicate, E, lowercase, order, none, the key), 8 invalid framework ids, 5 leaked internal labels (unit id, framework id, a unit of another batch, a qid, the unit's family label), a copied rationale sentence, 3 lint classes, 5 non-canonical renderings, a missing and a symlinked file, an unknown batch, stale manifest qids, a revision bump, and `shard_path` without explanations.
- **X1 content** (6): lint CLI default and strict; every entry states its key and explains exactly the wrong options; every entry quotes its passage verbatim (≥ 15 characters); Swedish; framework ids are LÄS entries.
- **Assembler** (18): pilot + X1 assemble cleanly as a partial (63 entries, bank order, the entries unchanged) and are refused as a release (gap); a complete set in a tree where pilot + X1 are every eligible question assembles, reruns byte-identically, is written, and pairs with `export_bank(…, explanations=True)` byte for byte; refusals for a qid in two files, a unit in two batches, a missing batch file (gap; the pilot alone still assembles as a partial), an eligible qid in no batch, a gate that fails only across batches, three bad release names, and a symlinked target; the CLI never writes a partial, writes a complete release only, and `--check` reports stale/current; five conflicting option sets.

**Mutation check.** Each mutation was applied to `explanation_batches.py` alone, the module's tests run, and the mutation reverted; the file's sha256 is identical before and after (`dedbce8a…`).

| Mutation | Failing tests |
|---|---:|
| M1 "qid in more than one batch file" refusal removed | 1 |
| M2 release accepts missing batch files | 1 |
| M3 combined-shard gate skipped | 1 |
| M4 chunk boundary `>` instead of `≥` | 1 |
| M5 manifest-vs-roster qid pre-check removed | 0 → 1 after adding `test_a_revision_bump_makes_the_manifest_stale_before_any_gate_runs` |
| M6 symlinked release target not refused | 1 |
| M7 batch check without `shard_path` | 49 |
| M8 assembled entries in file order, not bank order | 4 |

M5 first survived: the post-export qid comparison caught the test's stale manifest anyway. The pre-check's own job is a revision bump, where the coverage gate would otherwise fire first and blame the explanations; the added test pins that and is red under M5.

### X1 content

44 entries, one per qid, in `pipeline/synthetic/infold/explanations/x1-las.json`, in bank order and canonical bytes. Each was written the way the pilot was: every question re-solved from the student-facing text first; the rationale used as source only and checked against the passage; the key argument as `solution_path` plus 5–6 ordered steps (what the question asks; the passage sentence it turns on, quoted verbatim; a paraphrase; a `detail` step where a word, a concession or a second voice needs it; the options; the verdict); each wrong option once with its own `why_tempting` and `why_wrong`; `technique`; `pitfall`. Swedish product voice as in the pilot: short sentences, ”…” quotes, "Svaret är X." Persons are named by name or role (skribenten, författaren), not by a pronoun guessed from a name.

| Unit | Size | qids | framework_id per question |
|---|---|---|---|
| `las-b1-001` | long | `p5-las-b1-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 005, 002 |
| `las-b1-002` | short | `p5-las-b1-002-r1-LÄS-001`, `-002` | LAS-TYPE-003, 001 |
| `las-b1-003` | short | `p5-las-b1-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 006 |
| `las-b2-002` | short | `p5-las-b2-002-r1-LÄS-001`, `-002` | LAS-TYPE-003, 001 |
| `las-b2-003` | short | `p5-las-b2-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 006 |
| `las-b3-001` | long | `p5-las-b3-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 005, 002 |
| `las-b3-002` | short | `p5-las-b3-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b3-003` | short | `p5-las-b3-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b4-002` | short | `p5-las-b4-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b4-003` | short | `p5-las-b4-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b5-001` | long | `p5-las-b5-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 003, 005 |
| `las-b5-002` | short | `p5-las-b5-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b5-003` | short | `p5-las-b5-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b6-002` | short | `p5-las-b6-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b6-003` | short | `p5-las-b6-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b7-001` | long | `p5-las-b7-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 002, 001 |
| `las-b7-003` | short | `p5-las-b7-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b8-002` | short | `p5-las-b8-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 005 |

All 44 carry a framework_id, each checked against `frameworks/las_taxonomy.json` by the question's trigger: "enligt texten", "vad fann/visade", "hur förklarar X" → TYPE-001 (direct detail, 26); "dra för slutsats", "vad talar texten för" → TYPE-002 (3); the writer's or a named person's hållning, kritik or invändning → TYPE-003 (9); "huvudbudskap", "texten som helhet" → TYPE-005 (4); "vad skiljer X från Y", "vilken skillnad" → TYPE-006 (2). Six questions use the stem "Vilket påstående överensstämmer bäst med texten?"; the authentic corpus tags that stem TYPE-001 (`data/explanations/host-2014.json`, host-2014-verb2-LÄS-012), and so does this batch. "… överensstämmer bäst med textens huvudbudskap?" (`las-b8-002` q2) names the main message and is TYPE-005. No generation family is used as a framework id.

### Second-reader review (round 1)

Three independent, read-only second readers (general-purpose subagents of this session) split the 18 units (14 + 14 + 16 questions). Each first solved every question from the passage alone, then checked each entry for truth against the passage, verbatim quotes, step references, voices and hedges, framework fit, Swedish, and above all the pilot's main error class: a `why_wrong` whose argument does not exclude the option as worded. Rationales were given to them as source notes, not authority.

**Keys.** All 44 keys hold for all three readers.

**Findings.** 10 errors and about 100 minor issues. Each was checked against the passage before it was applied; all were accepted, some with different wording (no pronoun guessed from a name; standard Swedish instead of "gradord"; a quoted main clause introduced with a colon instead of being placed inside an att-clause).

- **Errors (10):**
  - Six arguments that did not exclude their option:
    - `las-b4-003` q1 B: a correlation that B also predicts, plus the writer's own reading presented as the study's finding;
    - `las-b5-002` q2 B: rising costs do not show that saving money was not the aim; the passage instead states the basin's purpose;
    - `las-b6-002` q1 D: a small difference in villa areas says nothing about where the best-coping households lived;
    - `las-b7-001` q1 A: "not a coincidence" does not answer a systematic bookkeeping bias; the objection is only a possibility ("kan ha varit") in the text;
    - `las-b7-001` q3 B: gaining most from a resident bearer does not exclude worse post overall; B is unsupported, and the text says "mindre roll", not "överflödiga" (the round-1 rewrite also claimed B does not answer the question, which round 2 corrected);
    - `las-b7-003` q1 C: undamaged ground is not the opposite of picking every mushroom.
  - Four false or self-contradicting statements:
    - `las-b1-002` q1 step 3 said the exhibitions "have not failed", where the writer only declines to claim they have;
    - `las-b3-002` q1 pitfall called D true, but D's "den viktigaste lärdomen" is not in the text;
    - `las-b5-001` q1 pitfall said B is almost verbatim in paragraph 5; it is a paraphrase;
    - `las-b7-003` q1 steps 3–4 used "den andra sorten" for two different groups.
- **Minor, by kind:** dropped hedges (mostly "tycktes", also "i värsta fall", "om än ojämlik"); voices (a researcher's or critic's claim given to "texten", a writer's critique stated as fact); step references pointing at a step that does not contain the fact; three ”…” spans that were not verbatim; option wording misdescribed (las-b1-001 q4 A says "så få", not none); "Hedda" ordered by finding order, not by place; idiom ("drar ut den skepsisen", "gör det försiktigt", "lägger … i kritiken", "årtal" for a decade).
- **Added content:** a `detail` step in `las-b7-001` q2 that says plainly that the key's word "bofast" is not in the paragraph and why D is still the best answer; a gloss of the non-standard "vare sig … eller" sentence in `las-b5-001` q3; in `las-b5-003` q2 the author is "textförfattaren", because that passage uses "skribentens" for the diary writer.

**Rationale claims that did not hold.** Four errors above came from framings in the units' rationales: the cost argument (`las-b5-002` q2 B), the villa argument (`las-b6-002` q1 D), "marken tog ingen skada" against C (`las-b7-003` q1) and "vänder på resultatet" (`las-b7-001` q3 B). As in the pilot, rationale claims need checking against the passage, and the leak gate cannot judge paraphrase.

After the fixes: batch check passes (1036 strings), lint clean, 1960 passed, 7 xfailed.

### Second-reader review (round 2)

The same three-way split re-read the rewritten file, reporting only errors (false claims, non-verbatim quotes, non-excluding arguments, wrong step references, voice or hedge errors, fields that contradict each other) and clear language faults. Every ”…” passage quote, paragraph number and attribution checked out. 15 findings, all checked against the passages and applied:

- **A general rule that ruled out its own key (3).** In `las-b5-001` q1 the technique said "behåll alla begränsningar", but key A keeps only one of the passage's two limits. In `las-b5-001` q4 the pitfall and technique ("stryker förbehållen") would reject key D, which omits the limits without contradicting them. In `las-b7-001` q2 "Ett enda led som inte stämmer" clashed with the step that admits "bofast" is not in the paragraph. All three now say the right thing: a correct option may leave a limit out but may not contradict one. A sweep of all 44 techniques found two more of the same shape, also fixed (`las-b6-002` q1, `las-b1-002` q2).
- **Arguments and claims (5):** `las-b7-001` q3 B's why_wrong said B does not answer the question, which is false (it offers a reason); it now says the text gives "mindre roll", not "överflödiga". `las-b7-001` q2 C turned "kunde sträcka sig flera mil" into a claim that rounds were never short. `las-b5-003` q2 step 4 gave C's value to the notes rather than to the amateurs' interest. `las-b3-003` q2 step 4 turned B's "de flesta" into "nästan allt". `las-b6-003` q1's pitfall put the caveat "direkt efter" the observation, one sentence too early.
- **Precision and references (5):** two step references attached to the wrong sentence (`las-b1-002` q2 A and D); "allergier" where the passage says "allergener" (`las-b2-002` q1 C); "niotusen passager natt efter natt" read as per night (`las-b4-002` q1 D); a step reference to a step that does not state the fact (`las-b5-001` q3 D).
- **Language (2 + 3):** a capital letter mid-sentence inside a quote (`las-b1-001` q4 step 3) and a stacked preposition (`las-b2-002` q2 B). A sweep for quotes in main-clause word order inside att-clauses found three non-standard cases (”berördes inte alls…”, ”gick ingen förändring…”, ”ersätter aldrig…”), now introduced with a colon.

No key changed and no reader found a new content concern.

### Content concerns

All 44 keys stand. Nothing below was papered over: each explanation states the best case for the keyed answer and, where a learner could stumble, says why. A passage or option change would need a new revision (r2), a re-gate and a ruling, which is outside this bead.

Worth an owner decision:
1. **`las-b3-001` (q1, q2, q4): the passage contradicts itself on where the warm water lies.** Paragraph 5 says warm water ”lägger sig överst i det utrymme det fyller” and that a fast uptake draws cold water ”underifrån”; q2's key calls it ”det varma ytlagret”. Paragraph 4 says recovery was higher ”där det varma vattnet fick ligga orört längst ner” and that ”I de översta hundra metrarna syntes ingen vinst alls”. Each key is tied to an explicit sentence, so the keys hold, but an attentive learner meets a physical contradiction.
2. **`las-b5-001` q3: non-standard "vare sig … eller".** ”Att vare sig förhärliga dem … eller avfärda dem … vore att göra historien orätt” has no negation, so it can be read as the opposite of what it means, and q3's key paraphrases it. The explanation glosses it. Suggested fix: ”Att antingen förhärliga … eller avfärda …”.
3. **`las-b7-001` q2 key D: "bofast" is not in the paragraph it summarizes,** and in this passage the word is the study's variable (a bearer living in the parish versus one ”inhyrd … från en annan bygd”). D is still the only defensible option, since A, B and C contradict paragraph 2. Suggested fix: drop "bofast" from D.
4. **`las-b7-001` passage: "bara" against "som tydligast".** Paragraph 1 says the effect appeared ”men bara där avståndet till närmaste järnvägsstation var stort”; paragraph 4 says ”som tydligast” far from the railway and ”mindre roll” near a station. Q3's option D ("helt och hållet saknade betydelse") gets partial support from paragraph 1; the key holds because D also claims that no letters were ever lost. Suggested fix: ”framför allt där” in paragraph 1.

Low (wording looser than the passage; the key or the distractor verdict holds):
5. `las-b1-003` q2 key D: "Hedda lät platsen och minnet göra det". The passage gives Hedda one ordering principle, ”i den ordning hon fann dem”; place and memory are on the labels. The explanation bridges this.
6. `las-b2-003` q2 key A: "organistens spel" needs one inference from ”gjord för att lyssnas till”; no organist is named. Option D ("en och samme byggmästare") is unsupported rather than contradicted: the passage never says who first built the Töreby organ. The explanation says so and does not claim otherwise.
7. `las-b5-003` q1 key B: "tydligt igenkännbara" is not in the text, the kind of added idea LAS-TYPE-001 tells students to reject. B is still clearly best.
8. `las-b8-002` q2 option D: ”spelar trycket större roll” can be read as "than wetness", so D's comparison is arguably supported; D still fails as the main message. The rationale's claim that D adds a comparison the text never makes is debatable, and the explanation does not repeat it.

Minor (harmless):
9. `las-b1-001` q1 key D: "ängar längre bort inte förändrades" overstates ”gick ingen förändring att mäta”.
10. `las-b3-002` q1 key C: "framför allt … på de längsta delsträckorna" is weaker than the text's ”bara på de längsta delsträckorna”.
11. `las-b3-003` q2 option D is nearly true of the study's own participants and fails only on its generic present tense; C is clearly best.
12. `las-b2-002` q2 stem: "försöket i Ödsberga" presupposes a trial; the passage describes a switch and calls it ”Erfarenheten”.
13. `las-b7-001` q3: the "slutsats" is stated almost verbatim in paragraph 4 (”eftersom vägen till posten redan var kort”), so the item tests retrieval more than inference.
14. `las-b5-001` q4 key D states Wennberg's disputed causal claim without the hedge the passage's objection invites.
15. `las-b4-002` q2 key C: its "prydlig" half is said outright only in the journalist's closing paragraph; Sundqvist's own words support the stance.
16. `las-b3-001` q3: option A alone is a bare "Att …" clause.

### Verification (final tree)

- **Batch check:** `python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x1` → `batch x1: 18 units / 44 questions …; every explanation gate passed, learner lint clean (1036 strings)`. The batch check is fail-closed: any gate failure is a refusal, so passing means zero findings.
- **Learner-output lint on X1:** `lint_learner_output.py pipeline/synthetic/infold/explanations/x1-las.json` → `clean — 1 file(s)`, 0 findings; `--strict` also clean.
- **Partition:** `explanation_batches.py --check` → current; 8 batches, 120 units / 340 questions, the bead's table exactly.
- **Assembler on the real tree (nothing written):** `--assemble evidence-x1 --partial` → `partial: 63 explanations from x0-pilot, x1 pass every gate; missing: x2 … x7. Nothing written`. `--assemble evidence-x1` → `REFUSED: release 'evidence-x1': 277 of 340 eligible qids have no explanation (gaps): missing batch files x2 … x7 …`, exit 1, and `data/explanations/p5-evidence-x1.json` does not exist.
- **Pilot preview (local, gitignored):** `export_product.py --pilot` → `6 units / 19 questions …; learner lint clean (107 strings); 19 explanations in p5-pilot.json, lint clean (421 strings)`, the hpf-no7l numbers.
- **Test suite:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1960 passed, 7 xfailed** (102 s), the baseline 1879 plus the 81 new tests. Infold suite alone: 482.
- **Determinism:** every batch check and assembly runs `export_bank`'s double build and compares bytes; the manifest check and the X1 batch check also pass in subprocesses under `PYTHONHASHSEED` 0 and 4242 (tests); a complete assembly reruns byte-identically (test); `--sample --check` and the qid registry `--check` pass in the suite.
- **sha256:**
  - `pipeline/synthetic/infold/explanations/x1-las.json` `f891a829fb89f070203e18bcb985fad27bdca3bfab2ead4c08c7c54f6022e41b`
  - `pipeline/synthetic/infold/explanations/BATCHES.json` `a7c69228e36f6d0397f666927ca8b7e9392f58e9aa2449620142943a24e26c5e`
  - `pipeline/synthetic/infold/explanation_batches.py` `dedbce8ac56c83f14c1a5f9883fbd16615c37cc88246634f591da87c329e8d43`
  - `pipeline/synthetic/infold/export_product.py` `f627c8152e09019343cac6491e4721def4cc8d55a8b02fb9cf9f4512cf73aad3`, the value the regenerated sample manifest pins
  - `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` `f045c63407c57833422ada1ab5b58d68a3fd56c611274d830eeb809436cf17a5`
  - `pipeline/synthetic/infold/preview/sample/_export-manifest.json` `e54cfc2d449c1f246e828b2c6c18f12f641660f50aaa1744574913b18d8d2f38`
  - unchanged: `approval-roster.json` `e31eba36…`, `data/explanations/p5-pilot.json` `fd96f43f…`, `worker/data/p5-qid-registry.json` `c02c1eb2…`
- **Changed files** (all uncommitted): `export_product.py`, `preview/sample/_export-manifest.json`, `tests/test_infold_explanations.py` (modified); `explanation_batches.py`, `explanations/BATCHES.json`, `explanations/x1-las.json`, `tests/test_infold_explanation_batches.py`, this worklog (new).

### Notes for X2–X7 and PR 5

- **Authoring a batch:** write `x<N>-<las|elf>.json` in bank order and canonical form (two-space JSON, fields in the shard order, one final newline), then `explanation_batches.py --check-batch x<N>`; the canonical gate names the first differing line. The batch tests here are X1-specific; each later batch PR can add its own content tests in the same shape.
- **Lessons from this batch's reviews:** check every `why_wrong` for an argument that excludes the option as worded (6 of the 10 round-1 errors); keep hedges ("tycktes") in every field, not just the quoted step; write techniques and pitfalls so they never rule out the key (a correct option may omit a limit but not contradict one); attach "(steg N)" to the sentence the step supports; give views to the right voice; check rationale framings against the passage before reusing them.
- **The release shard (PR 5):** `--assemble <release>` writes `data/explanations/p5-<release>.json` only when all eight batches are present and every gate passes. That directory is read by `export_qid_registry.py` (framework ids for mastery), so the registry must be rebuilt in the same PR, and by the offline readers listed in `docs/worklog/hpf-no7l.md` ("Offline readers"). The release shard contains the pilot's 19 entries byte for byte, so the pilot and release shards agree on framework ids. A release named `pilot` is refused: it would overwrite the pilot shard, which is an input.

### Handoff

- **Ready for review:** an independent correctness and language review of X1 (bead hpf-c5tb's plan: Codex), then the owner's look at the content concerns. Committing, pushing and opening the PR are outside this lane.
- **Not claimed:** release readiness (no release shard, nothing synced or deployed); semantic certification beyond the reviews recorded here (lint is necessary, not sufficient); X2–X7.

### Bead note

P5 PR2b X1 implemented, uncommitted on 7be9601: explanation_batches.py (partition → BATCHES.json, exactly the expected table; --check-batch runs every export gate on a batch file via export_bank(shard_path=…), no gate re-implemented; --assemble refuses duplicates, gaps, any gate failure and a partial set, --partial validates without writing; no release shard written), 44 reviewed LÄS entries in pipeline/synthetic/infold/explanations/x1-las.json (all keys hold; framework ids TYPE-001 26, -002 3, -003 9, -005 4, -006 2; 16 content concerns logged, 4 for an owner decision), two second-reader rounds (round 1: 10 errors and ~100 minor; round 2: 15; all applied), 81 red-first tests, 8 mutations caught, batch check and lint clean, 1960 passed, 7 xfailed. Evidence: docs/worklog/hpf-c5tb.md.
LANE DONE: hpf-c5tb.1

### Progress

- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:research|E:7be9601] Read the design, LAYER2-RENDERING.md, the app's explanation type, the schema, the exporter and its gates, the pilot shard and `docs/worklog/hpf-no7l.md`. Baseline: **1879 passed, 7 xfailed** (46.46 s).
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:red|E:pipeline/synthetic/infold/tests/test_infold_explanation_batches.py] Wrote the 80-test module first. Red: collection error, `ModuleNotFoundError: No module named 'explanation_batches'`.
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:green-tooling|E:pipeline/synthetic/infold/explanation_batches.py] Implemented the partition, batch check and assembler; `export_bank(shard_path=…)` and `check_release` in the exporter; BATCHES.json written (matches the expected table); sample regenerated (exporter sha256 only). Infold suite: 56 failed (all: X1 batch file missing), 425 passed.
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:author|E:pipeline/synthetic/infold/explanations/x1-las.json] Re-solved and wrote batches 1–3 (8 units, 22 questions); lint clean. Framework precedent for the stem "Vilket påstående överensstämmer bäst med texten?": the authentic corpus tags it LAS-TYPE-001 (`data/explanations/host-2014.json`, host-2014-verb2-LÄS-012).
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:author|E:pipeline/synthetic/infold/explanations/x1-las.json] Batches 4–5 (5 units, 10 questions) re-solved and written: 32 of 44; lint clean.
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:author|E:pipeline/synthetic/infold/explanations/x1-las.json] Batches 6–8 (5 units, 12 questions) written: 44 of 44. `--check-batch x1` passed on the first run (1034 strings); infold suite 481 passed; full selection 1959 passed, 7 xfailed.
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:verify|E:pipeline/synthetic/infold/explanation_batches.py] Eight mutations; M5 survived, so `test_a_revision_bump_makes_the_manifest_stale_before_any_gate_runs` was added (red under M5, green after). File restored byte for byte.
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:review|E:pipeline/synthetic/infold/explanations/x1-las.json] Second-reader round 1 (three readers): all keys hold; 10 errors and about 100 minor issues, all checked against the passages and applied. Batch check passes (1036 strings); 1960 passed, 7 xfailed. Round 2 (errors and clear language faults only) launched on the rewritten file.
- 2026-10-08 [S:ci-alb6h|W:hpf-c5tb.1|H:review|E:pipeline/synthetic/infold/explanations/x1-las.json] Round 2: 15 findings (3 rules that ruled out their own key, 5 arguments or claims, 5 precision, 2 language), plus 2 more rules and 3 att-clause quotes from sweeps; all applied. Batch check and lint (default, strict) clean; 1960 passed, 7 xfailed.
