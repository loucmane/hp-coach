---
bead: "hpf-c5tb"
project: "hpfetcher"
status: "batch_x4_implemented_uncommitted"
---

# Worklog — hpf-c5tb

P5 infold PR 2b: reviewed Layer-2 explanations for the 321 P5 questions outside the pilot, in seven batches (X1–X7), each its own PR with an independent correctness and language review. Spec: `docs/p5-infold-design.md` §4 row 2b (Amendment 1) and §D. One section per batch below. *2026-10-08: 313 questions since the owner retired `las-b3-001` and `las-b5-001`; see [Retirement 2026-10-08](#retirement-2026-10-08). Batch membership is pinned: X1 lost those two units and no other unit moved; see [Batch freeze](#batch-freeze).*

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

### X1 review fix

Bead `hpf-c5tb.3`: review finding B1 on PR #379 (review bead `hpf-9lkp`), a quotation that was not verbatim, and a mechanical scan of all 44 X1 entries for the same defect class.

**Snapshot and boundaries**
- Claimed with `gc hook --claim --json` (`hpf-c5tb.3`, assignee `gc__implementation-worker-ci-cc9ej`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.3 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- Branch `codex/hpf-c5tb-x1` at `335e4d47c9826cf48e7095521488fca3e48a5517`, as the bead states; no tracked change at start. No git writes and no network; the changes are uncommitted.
- The review worklog `hpf-9lkp.md` lives in the vault, which this lane's sandbox cannot read; B1 is taken from the bead text.
- The bead names no validator, so none was run (`gc.check_path` is the post-close dispatcher check, as for `hpf-c5tb.1`).

**B1.** `p5-las-b8-002-r1-LÄS-002`, distractor D `why_wrong`: `… den säger bara att trycket ”spelar större roll” där.` → `… den säger bara att trycket spelar större roll där.` The passage reads ”spelar trycket större roll”. The quotation marks are removed and the words kept.

**Scan.** Every ”…” span in every learner field of the 44 entries (solution_path, step titles and texts, why_tempting, why_wrong, technique, pitfall) was matched against the unit's student-facing text as `export_bank` exports it: title, passage, and every prompt and option of the unit. The only quotation character in X1's learner text is ” (U+201D): 490 marks in 245 pairs, none unpaired; there are no “, », «, „, single or ASCII quotes. The scan scripts ran from the session scratchpad and are not checked in; the new test below is the reproducible form.

After the fixes, 245 quotations: 216 exact, 18 that differ only in the case of the first letter, 11 that mark left-out words with "…", 0 not in the unit's text.

- **Not in the unit's text: 2, both fixed.** B1, and `las-b5-003` q1 technique: `… leta efter en mening med ”inte … utan” eller ”det avgörande”.` → `… eller ”avgörande”.` The unit never has "det avgörande"; it has "avgörande" only in q1's prompt (”Vad framställs i texten som avgörande för att …”). Corrected to the verbatim word rather than unquoted: without the marks the sentence would say "or the decisive thing" instead of naming the signal word.
- **First letter's case only: 18, unchanged.** Each is a whole-word match. Capitalized because the quote opens the sentence (10): `b1-001` q2 step 4 ”Horisontljus”; `b1-001` q4 step 1 ”Dra för slutsats” and ”Utifrån texten”; `b3-002` q1 A why_wrong ”Oavsett veckodag”; `b4-002` q1 C why_wrong ”Oavsett hur grannlotterna såg ut”; `b5-001` q4 B why_wrong ”Alltid”; `b5-002` q2 C why_wrong ”Den enskilt största”; `b6-003` q1 C why_wrong ”Alla elever”; `b7-001` q3 step 1 ”Dra för slutsats”; `b8-002` q2 B why_wrong ”Alla besöksförbud”. Lower case mid-sentence where the source word opens a sentence (8): `b1-001` q1 step 1 and technique ”enligt texten”; `b1-002` q1 technique ”det jag vänder mig mot”; `b3-002` q2 and `b5-003` q2 techniques ”jag menar”; `b3-003` q2 A why_tempting and pitfall ”oftast”; `b5-001` q3 technique ”samtidigt”. The words are verbatim and only the case fits the sentence. The merged pilot does the same (”Marginellt”, ”sju av tio”), and round 2 above treated a capital mid-sentence inside a quote as a language fault (`las-b1-001` q4 step 3). Restoring the source's case would start sentences in lower case or put capitals mid-sentence.
- **Marked omissions: 11, unchanged.** Each quotes a construction with "…" for the left-out words, and its pieces stand in order within one sentence of the unit: `b1-001` q2 technique ”Varför …?” (”Varför skulle några släckta lampor göra sådan skillnad?”); ”inte … utan” in `b5-001` q2 pitfall, `b5-003` q1 technique, `b6-002` q1 technique, `b7-001` q4 pitfall and `b7-003` q2 technique; `b7-001` q4 pitfall ”inte bara … utan lika mycket”; `b7-003` q2 technique ”det är … som”; `b8-002` q1 pitfall ”De hade väntat sig …”; `b8-002` q2 step 4 and technique ”mer … än” (options C and D).

If the review wants quotations byte for byte, these 29 are the complete list to settle.

**Pilot, read only.** The same scan on `data/explanations/p5-pilot.json` (merged; not changed here): its 8 LÄS entries pass (42 quotations: 40 exact, 2 first-letter case). Its ELF entries need a different rule. They have 56 quotations that are not in the text, all in the cloze unit `elf-b18-002` and all intended: fixed expressions and wrong collocations quoted as language (“take its toll on”, “the moral high floor”), the gap sentence quoted with ___ for the gap marker, and the Swedish false friend “eventuellt”. Separately, one quotation in `elf-b18-001` q1 step 3 matches only without its final full stop. A verbatim rule for X4–X7 needs an ELF form (for example: passage quotes verbatim, language examples exempt); that is for the ELF batches to settle.

**Test** (`test_infold_explanation_batches.py`, 2 new, deterministic, reads only committed files):
- `test_every_las_quotation_is_verbatim_from_its_unit`: every ”…” in every learner field of every LÄS entry of every batch file present must be the unit's own text, exactly or with only its first letter's case changed; "…" marks left-out words, whose pieces must stand in order within one sentence; an unpaired quotation mark fails. Today it covers the pilot's 8 LÄS entries and X1's 44 (287 quotations), and it picks up X2 and X3 when their files land. ELF rows are skipped (see above).
- `test_a_quotation_may_change_only_its_first_letter_case_and_mark_left_out_words`: pins the rule on a two-sentence text, B1's form included.
- Red on the committed X1: the same rule, run on `git show HEAD:…/x1-las.json` (read only), flags exactly the two fixed quotations, ”spelar större roll” and ”det avgörande” (2 of 246). On the working tree it flags 0 of 245.

**Verification (final tree)**
- `python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x1` → `batch x1: 18 units / 44 questions in pipeline/synthetic/infold/explanations/x1-las.json; every explanation gate passed, learner lint clean (1036 strings)`. The canonical-bytes gate is among them; the in-place edit kept the file canonical, so no regeneration was needed.
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1962 passed, 7 xfailed** (48 s): the 1960 of `hpf-c5tb.1` plus the 2 new tests. The 7 xfails are the strict ones in `test_lint_renderer_assumption_round8.py`.
- Diff: `x1-las.json` 2 lines (the two entries above, nothing else), the test module (+2 tests), this worklog.
- sha256: `pipeline/synthetic/infold/explanations/x1-las.json` `d7cc1951f1167b894418361fedb79adead6105750ff74e05ad848cc44a040066` (HEAD: `f891a829…`, the value recorded above); `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` `5b9fdd8e3fba0fe07f81eb4816d1e9f6d5645044013bc796da0e3351718a6599`; unchanged: `BATCHES.json` `a7c69228…`, `explanation_batches.py` `dedbce8a…`, `data/explanations/p5-pilot.json` `fd96f43f…`.

**Bead note**

X1 review fix on 335e4d4, uncommitted: B1 fixed (las-b8-002 q2 D why_wrong, quotation marks dropped); a scan of all 245 X1 quotations found one more not in the unit text, fixed (las-b5-003 q1 technique ”det avgörande” → ”avgörande”, the word in the q1 prompt); 18 first-letter-case and 11 marked-omission quotations reported, unchanged; a new test checks every LÄS quotation of every batch file (287 today) and flags exactly the two fixed ones on the old X1; check-batch x1 clean (1036 strings); 1962 passed, 7 xfailed. Evidence: docs/worklog/hpf-c5tb.md, section X1 review fix.
LANE DONE: hpf-c5tb.3

## Retirement 2026-10-08

Bead `hpf-c5tb.2`: retire `las-b3-001` and `las-b5-001` per the owner's ruling of 2026-10-08, given in reply to the X1 content-concern sheet (content concerns 1 and 2 above): "stop serving it". `las-b7-001` is kept as it is. No replacement: any replacement needs a later generation and gate cycle.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c5tb.2`, assignee `gc__implementation-worker-ci-wgpal`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.2 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- Precondition met: `git rev-parse HEAD origin/main` → `1cbbb84e7cd1b25e4fb623b9e67b65c784f8a9ef` for both (detached), the squash merge of PR #379 ("P5 infold PR2b X1: explanation batch tooling + 44 LÄS explanations (#379)"). origin/main is the local ref, not fetched (no network).
- No git writes and no network; every change is uncommitted. No candidate, sheet, audit, verdict, ratification or adjudication file was edited; the ratification record (`ratification-2026-10-07.json`, `4964c297…`) is unchanged. The untracked runtime, skill and sandbox paths present at start are untouched.
- The bead names no validator, so none was run; `gc.check_path` is the post-close dispatcher check (`…/checks/build-artifact-valid.sh`), as for hpf-c5tb.1.
- Baseline on HEAD: **1962 passed, 7 xfailed** (49 s).
- The lane's permission policy refused one pytest call (`-o junit_logging=system-err`); the same evidence came from a plain `--tb=short` run.

### Census

| | Before (HEAD) | After |
|---|---:|---:|
| Selected candidates | 128 / 373 | 128 / 373 |
| Retired | 8 / 33 | **10 / 41** |
| Retained = approved | 120 / 340 | **118 / 332** |
| LÄS | 52 / 136 | **50 / 128** |
| ELF | 68 / 204 | 68 / 204 |
| Batches 1–13 kept (ratified) | 81 / 219 | **79 / 211** |
| Batch 3: LÄS · retired | 3 / 8 · 0 / 0 | 2 / 4 · 1 / 4 |
| Batch 5: LÄS · retired | 3 / 8 · 0 / 0 | 2 / 4 · 1 / 4 |
| qid registry (units / qids / framework ids) | 120 / 340 / 14 | **118 / 332 / 14** |
| Eligible for Layer 2 (pilot + batches) | 340 (19 + 321) | **332 (19 + 313)** |

Each retired unit has 4 questions. Pending stays 0 / 0. The framework-id count stays 14: the registry reads only `data/explanations/p5-*.json`, and the pilot holds neither unit.

### Changes (uncommitted)

| Path | Change | How |
|---|---|---|
| `pipeline/synthetic/RETIRED.json` | Two entries in the existing format (reason, found_by, date `2026-10-08`, replacement none), after `elf-b19-004`; the existing lines are unchanged, so their evidence refs (`:5` … `:47`) hold | by hand: it is the input |
| `pipeline/synthetic/infold/build_roster.py` | `EXPECTED_CENSUS` rows 3 and 5, `EXPECTED_TOTALS` and its comment; the comment on kept legacy table rows (77 → 75) | by hand: the census assertion |
| `pipeline/synthetic/infold/approval-roster.json`, `ROSTER.md` | Both units `retired` (basis `RETIRED.json`, evidence `RETIRED.json:53` / `:59` plus their master row; the re-audit and ratification refs drop off); census; the batch 3 and 5 rows | `build_roster.py` |
| `worker/data/p5-qid-registry.json` | Both units' rows (8 qids) removed; counts; the roster and RETIRED.json hashes | `export_qid_registry.py` |
| `pipeline/synthetic/infold/explanation_batches.py` | `EXPECTED`, the re-cut table, and its comment; docstring 321 → 313 and 120 / 340 → 118 / 332; the expected-table error names both beads | by hand: the expected-table assertion |
| `pipeline/synthetic/infold/explanations/BATCHES.json` | The re-cut partition (below) | `explanation_batches.py` |
| `pipeline/synthetic/infold/explanations/x1-las.json` | The 8 retired entries removed; the 36 others byte-identical | whole-entry deletion (below) |
| `pipeline/synthetic/infold/preview/sample/_export-manifest.json` | The roster and RETIRED.json sha256 only; the sample bank is unchanged | `export_product.py --sample` |
| `pipeline/synthetic/infold/tests/test_infold_{roster,qid_registry,export,explanation_batches}.py` | Census and partition numbers (see Tests) | by hand |
| `worker/src/lib/provenance.test.ts` | Registry size 340 → 332; no fixture used a retired qid, so none changed | by hand |
| `worker/src/lib/fit.test.ts` | Three `HEAD_DIGESTS` re-recorded against 782f9c2's fit; **outside the files the bead names** (see Worker) | values from 782f9c2's fit |
| `docs/p5-infold-design.md` | Three dated additions; no original text changed (see Design doc) | by hand |
| `docs/worklog/hpf-c5tb.md` | Status, a dated note in the intro, this section | by hand |

The local, gitignored pilot preview (`export_product.py --pilot`) was refreshed too: 6 units / 19 questions, 107 strings; 19 explanations, 421 strings, the hpf-no7l numbers. The other local previews (`preview/approved`, `preview/full`) were already older than HEAD's roster and are untouched.

### The re-cut partition

Same rule; only `EXPECTED` changed. The new table is the generator's, not a hand count: before `EXPECTED` was updated, `explanation_batches.py --check` refused with `x1 is ('las-b1-001', 'las-b9-001', 18, 42), …`, which matched the cut worked out by hand. LÄS outside the pilot: 120 questions / 3 → boundaries 40 and 80, reached at 42 (`las-b9-001`) and 82 (`las-b14-003`). ELF is unchanged (193 / 4).

| Batch | First … last | Units | Questions | Before | File |
|---|---|---:|---:|---|---|
| x0-pilot | las-b7-002 … las-b19-002 | 6 | 19 | unchanged | `data/explanations/p5-pilot.json` (present) |
| x1 | las-b1-001 … **las-b9-001** | 18 | **42** | … las-b8-002, 18 / 44 | `…/explanations/x1-las.json` (present) |
| x2 | **las-b9-002 … las-b14-003** | **15** | **40** | las-b8-003 … las-b14-001, 16 / 42 | `…/explanations/x2-las.json` (missing) |
| x3 | **las-b15-001** … las-b19-003 | **14** | **38** | las-b14-003 …, 15 / 42 | `…/explanations/x3-las.json` (missing) |
| x4–x7 | unchanged | 65 | 193 | unchanged | missing |

Moves: `las-b8-003` and `las-b9-001` from x2 to x1; `las-b14-003` from x3 to x2. Total 19 + 42 + 40 + 38 + 52 + 45 + 48 + 48 = 332. No X2 or X3 batch file exists on any local branch (`git log --all` on both paths is empty), so no reviewed entry had to move between files.

### X1 file

The 8 entries of the retired units were removed as whole entries: lines 686–917 and 1370–1595 of the merged file, each range opening on an entry key and closing on its `},`. `git diff --numstat` → 0 added, 458 deleted; no explanation text was touched. A scratchpad check (not checked in) compared the result with `git show HEAD:…/x1-las.json`. The kept entries are HEAD's minus exactly the 8, in value and order. The file is exactly `export_product.render_json` of them, and each kept entry's rendered block occurs verbatim in both files. sha256 `6c72164bf35f1d8143b2901f2d31f3e9898aa6e1d9548a269f6922a862841159` (HEAD `d7cc1951…`).

The 36 kept entries pass every bank and explanation gate against exactly their 16 units: `export_bank(…, units=<the 16>, explanations=True, shard_path=x1-las.json)`, from a scratchpad script; learner lint clean (846 strings, against 1036 for the 44). No kept entry lies outside the re-cut X1.

**Gap: reported, not authored here (bead scope 3).** The re-cut X1 also holds `las-b8-003` (2 questions) and `las-b9-001` (4), which have no explanation. Their 6 qids are `p5-las-b8-003-r1-LÄS-001`, `-002` and `p5-las-b9-001-r1-LÄS-001` … `-004`. So:

- `explanation_batches.py --check-batch x1` → `REFUSED: batch x1 (…/x1-las.json): explanations: no explanation for 6 exported qid(s): [those 6]`, exit 1. The coverage gate runs first, which is why the 36 were gated separately above.
- `--assemble evidence-retire --partial` → the same refusal; nothing written (`data/explanations/p5-evidence-retire.json` does not exist).

Content concerns 1, 2, 14 and 16 of the X1 section are about the two retired units and lapse with them. Concerns 3, 4 and 13 (`las-b7-001`) stand as notes: the ruling keeps that unit as it is.

### Tests

Numbers moved to the derived census and partition; no assertion was dropped or loosened.
- `test_infold_roster.py`: the census (118 / 332; LÄS 50 / 128; retired 10 / 41) and the approval sums (79 / 211 for batches 1–13). `_design_table()` now reads design §2's last census table, the 2026-10-08 update, and asserts that §2 has exactly two; the original stays as the record of 2026-10-07. The ratification test now states three things: the record lists the 81 units kept on 2026-10-07, in roster order; the 79 still kept are the legacy units; and the two retired since are `retired`, with no `ratified_by` or note. Retirement wins over the record, which stays as it was given.
- `test_infold_qid_registry.py`: 118 units / 332 qids / LÄS 128; 10 retired units, none with a registered qid; the CLI summary string.
- `test_infold_export.py`: 118 / 332, LÄS 128, and the lint string count `118 × 2 + 332 × 5`.
- `test_infold_explanation_batches.py`:
  - the expected table; eligible 118 / 332, and 313 outside the pilot;
  - the loose cut without `las-b1-002` (now `las-b1-001 … las-b9-001`, 17 / 40) and its near-miss table;
  - X1 at 42 questions, and pilot + X1 = 61 entries;
  - two fixtures that named `las-b8-003` as another batch's unit, which it no longer is: "the first question of batch x2" is now `p5-las-b9-002-r1-LÄS-001`, and the "unit of another batch" label is `las-b9-002`.

Result: **1912 passed, 50 failed, 7 xfailed** (39 s). All 50 failures are in `test_infold_explanation_batches.py`, and all come from the gap. A scratchpad script classified them from a JUnit report:
- 42 are the coverage refusal naming exactly the 6 qids;
- 5 are a `KeyError` on one of the 6, where an X1 content test reads an entry the file lacks;
- 3 are CLI runs whose captured stderr is the same refusal (`--check-batch x1`, `--assemble … --partial`, `--assemble x1test`).

Nothing else fails. The tests' numbers are already those of the re-cut X1, so they should pass once the 6 entries exist and meet the X1 content checks. That cannot be verified until the entries are written.

### Worker

- **Provenance.** The regenerated registry no longer lists the 8 qids, and `worker/src/lib/provenance.ts` classifies by registry membership. A scratch-only vitest file checked all 8. It ran in a copy of `worker/` under the scratchpad, never in the repo, with HEAD's `provenance.ts` and the new registry. Each of the 8 is unlisted: `isRegisteredP5Qid` is false, `classifyAttempt` returns `{source: 'unknown', itemRevision: null}` and `p5FrameworkId` returns null. `p5-las-b3-002-r1-LÄS-001` and `p5-las-b5-002-r1-LÄS-001` stay synthetic. In the repo, the existing case "a retired unit (RETIRED.json)" covers the mechanism, and the Python registry test covers all ten retired units.
- **`provenance.test.ts`**: only the registry size, 340 → 332.
- **`fit.test.ts`, outside the files the bead names.** After the registry change, three trials failed: `trial 31/32/33: without the R2-B1 case every rating is what 782f9c2 fitted`. Their histories draw P5 qids from the registry (`fit.test.ts:472`), so 332 qids instead of 340 change every history, and the pinned digests had been recorded on the 340-qid registry. The digests were re-recorded and checked, not assumed, in the scratch copy of `worker/` with 782f9c2's `fit.ts` (`git show 782f9c2:worker/src/lib/fit.ts`):
  - 782f9c2's fit with HEAD's registry → the three pinned digests pass, so the harness runs the old fit faithfully;
  - 782f9c2's fit with the new registry → `4bd59118…885f`, `b8ff6c93…cc7f`, `3d435b8a…d798`;
  - HEAD's fit with the new registry (the real tree) → the same three;
  - the edited test passes against 782f9c2's fit.

  The test's claim therefore still holds on the new histories; a comment records the re-recording. Any later registry change (a retirement, a revision bump, batches 20–23, the release) will move these digests again. A fixed P5 pool for these trials would remove the coupling; that is not done here.
- **Results:** `npm --prefix worker run test` → **395 passed** (24 files); `npm --prefix worker run typecheck` → clean; `npm --prefix worker run lint` → clean (biome, 60 files).

### Design doc

Additions only, each dated; no original sentence or table row was changed (bead scope 5).
1. Under §2's headline: a one-line pointer giving the current census and saying the table below it is that of 2026-10-07.
2. At the end of §2: **Census update 2026-10-08**: the ruling and its reasons, the legacy inventory now 79 / 211, and the full current table, which the roster test reads.
3. At the end of Amendment 1: D's 340 questions and PR 2b's 321 are now 332 and 313; the batches are re-cut (`BATCHES.json`).

Not changed, as history: §2's "not a certification that 340 questions are export-ready", "39 / 121" (batches 14–19, still true) and "81 / 219" (the update gives 79 / 211). Two older line citations of the design doc already pointed two lines early on HEAD, after Amendment 1's banner: `AUDIT-batches-1-13.md:157` (→ `:102`) and `docs/worklog/hpf-535m.md:92` (→ `:72`). The additions move §3 onward by 29 more lines. They are left as written: they are history.

### Verification (final tree)

- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → 1912 passed, **50 failed** (all from the X1 gap, above), 7 xfailed.
- `build_roster.py --check` → `roster: 128 units / 373 questions; retained 118 / 332 (LÄS 50 / 128, ELF 68 / 204); retired 10 / 41; approved 118 / 332; pending owner ratification 0 / 0`.
- `export_qid_registry.py --check` → `checked 118 units / 332 qids / 14 framework ids`.
- `explanation_batches.py --check` → current: 8 batches, 118 units / 332 questions, the table above.
- `explanation_batches.py --check-batch x0-pilot` → passes (421 strings). `--check-batch x1` → **REFUSED** on the 6 gap qids.
- `export_product.py --sample --check` → current (4 units / 12 questions, 68 strings); `--pilot --check` → current.
- Determinism: every writer was rerun (`build_roster.py`, `export_qid_registry.py`, `explanation_batches.py`, `export_product.py --sample`), and every sha256 below stayed the same. The suite's subprocess runs under `PYTHONHASHSEED` 0 and 4242 pass for the manifest, the registry and the sample; the X1 batch-check ones fail on the gap.
- Worker: 395 passed; typecheck and biome clean.
- sha256 (final):
  - `pipeline/synthetic/RETIRED.json` `fd3ab88230f12b5378a58d7f3d5a8c99d19e6f8ba587b0d3a8a224550705d475` (HEAD `5e7a1031…`)
  - `pipeline/synthetic/infold/approval-roster.json` `9babcc8a6854bbcffe2f87b1fa1ec11f10f020136b9edf366a3b0b830869430e` (HEAD `e31eba36…`)
  - `pipeline/synthetic/infold/ROSTER.md` `8e0696fc9f45a25b1e7596452579a21c1851cd461b378029b828dcb3e3aebcee`
  - `worker/data/p5-qid-registry.json` `41480b7e61b28806b4c43e8b744979f270ac9c82fe3cc84584d6ef824f394c5a` (HEAD `c02c1eb2…`)
  - `pipeline/synthetic/infold/explanations/BATCHES.json` `d4ea1c9d01e10d3723a9e7753046558c4d83307212cf876e087e83ad7ab12fbb` (HEAD `a7c69228…`)
  - `pipeline/synthetic/infold/explanations/x1-las.json` `6c72164bf35f1d8143b2901f2d31f3e9898aa6e1d9548a269f6922a862841159` (HEAD `d7cc1951…`)
  - `pipeline/synthetic/infold/preview/sample/_export-manifest.json` `b6e19c8150bc72601c292ec69560519956bd69e58f4ebd8ebd7b76b8b627239a` (HEAD `e54cfc2d…`)
  - `build_roster.py` `a3ab220b…20c5`; `explanation_batches.py` `0f98750f…a7d7`; `worker/src/lib/fit.test.ts` `c2049157…5997`; `docs/p5-infold-design.md` `8a895d46…3f19`
  - unchanged: `export_product.py` `f627c815…`, `export_qid_registry.py` `875b10a9…`, `ratification-2026-10-07.json` `4964c297…`, `data/explanations/p5-pilot.json` `fd96f43f…`, `preview/sample/p5-bank-sample.json` `393ad817…`

### Handoff

- **To close the gap before this can merge:** write and review the 6 X1 entries (`las-b8-003` q1–q2, `las-b9-001` q1–q4) the way hpf-c5tb.1 wrote X1, second-reader review included. They go at the end of `x1-las.json`, after `las-b8-002`, which is bank order. Then `--check-batch x1` and the suite are expected to go green. The alternative is an owner change to the partition rule, which this bead held fixed.
- **For review:** the `fit.test.ts` digest re-recording (outside the bead's named files; evidence above).
- **For X2 and X3:** use the new table. X2 now runs from `las-b9-002` to `las-b14-003`, and X3 starts at `las-b15-001`.
- Not claimed: release readiness; the 6 missing explanations; any review of the two retired units beyond the ruling.

### Bead note

Retired las-b3-001 and las-b5-001 on 1cbbb84, uncommitted: RETIRED.json +2 entries; roster/ROSTER.md, qid registry, BATCHES.json and sample manifest regenerated by their generators (census 118 / 332, retired 10 / 41; registry 118 units / 332 qids / 14 fw ids); x1-las.json −8 entries (36 kept byte-identical, all gates pass); design doc dated notes; the unchanged partition rule re-cuts X1 to las-b1-001 … las-b9-001, so las-b8-003 + las-b9-001 (6 q, no explanation) join it: --check-batch x1 refuses and 50 batch tests fail on exactly those 6 qids (reported, not authored); fit.test.ts digests re-recorded against 782f9c2 (verified; outside the named files); worker 395 passed. Evidence: docs/worklog/hpf-c5tb.md, Retirement 2026-10-08.
LANE DONE: hpf-c5tb.2

### Progress

- 2026-10-08 [S:ci-wgpal|W:hpf-c5tb.2|H:research|E:1cbbb84] Read the ruling, RETIRED.json, the three generators, their tests, the worker provenance test and the design doc; worked out the re-cut by hand (X1 gains las-b8-003 and las-b9-001). Baseline 1962 passed, 7 xfailed.
- 2026-10-08 [S:ci-wgpal|W:hpf-c5tb.2|H:implement|E:pipeline/synthetic/RETIRED.json] Two entries; roster, registry, BATCHES.json (after the generator confirmed the re-cut) and sample manifest regenerated; X1 trimmed by whole-entry deletion and checked against HEAD; the kept 36 pass every gate.
- 2026-10-08 [S:ci-wgpal|W:hpf-c5tb.2|H:verify|E:pipeline/synthetic/infold/tests] Census and partition numbers in four test modules and the design doc's dated notes; 1912 passed, 50 failed (all the X1 gap, classified), 7 xfailed.
- 2026-10-08 [S:ci-wgpal|W:hpf-c5tb.2|H:verify|E:worker/src/lib/fit.test.ts] Worker: 3 registry-coupled fit digests stale; re-recorded against 782f9c2's fit in a scratch copy (control reproduces the old pins); 395 passed, typecheck and biome clean. Determinism reruns byte-identical.

## Batch freeze

Bead `hpf-c5tb.4`: freeze explanation batch membership. The rule of `hpf-c5tb.1` re-derived the partition from running question totals. So the retirement in `hpf-c5tb.2` re-cut X1 to `las-b1-001` … `las-b9-001` and pulled `las-b8-003` and `las-b9-001` (6 questions, no explanation) into a batch that is already merged and reviewed. Coordinator decision: the assignment is pinned to `BATCHES.json` as merged in 1cbbb84, the original 7-batch cut. A shipped or in-flight batch never gains units; retirement only removes them.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c5tb.4`, assignee `gc__implementation-worker-ci-vn2tn`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.4 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` → `1cbbb84e7cd1b25e4fb623b9e67b65c784f8a9ef` (detached), with `hpf-c5tb.2`'s 17 uncommitted files present. Their sha256 matched the Retirement section's (`x1-las.json` `6c72164b…`, `BATCHES.json` `d4ea1c9d…`, `explanation_batches.py` `0f98750f…`, the design doc `8a895d46…`).
- Baseline: **1912 passed, 50 failed, 7 xfailed** (38.7 s). The 50 failures are the X1 gap, as the Retirement section reports.
- No git writes and no network; every change is uncommitted. Nothing of `hpf-c5tb.2` was discarded: `RETIRED.json`, the roster, `ROSTER.md`, the qid registry, the sample manifest, `x1-las.json`, `build_roster.py`, the worker tests and the census tests are byte for byte as it left them (sha256 below).
- The bead names no validator, so none was run; `gc.check_path` is the post-close dispatcher check (`…/checks/build-artifact-valid.sh`).

### The rule

`BATCHES.json` is the record of which batch holds which unit; nothing re-derives it. Rerun, the generator (`explanation_batches.py`, no arguments) reads each batch's name, file and units from the committed file (`read_pin`). Then `assign()`:

- keeps each batch's units, in roster order, with their qids at their current revisions;
- drops each retired unit (`RETIRED.json`) from its batch and says so (`dropped retired unit(s) from their batch: x1: …`);
- refuses, writing nothing:
  - an eligible unit in no batch. A new unit, such as one from batches 20–23, is never assigned automatically. It waits until someone adds it by hand to a new batch, in `BATCHES.json` (name, file, units) and in `EXPECTED`;
  - a unit in two batches;
  - a listed unit that is not eligible for a reason other than retirement: not in the roster, or pending owner ratification;
  - a batch left with no unit;
  - a batch whose name or file is not its own: after the pilot, `x<N>`, one section, `…/x<N>-<las|elf>.json`;
  - a first batch that is not the exporter's pilot (`export_product.PILOT_UNITS` in `data/explanations/p5-pilot.json`);
  - a malformed pin.

A file that still lists a retired unit is refused, with the unit named:
- by `--check`: `STALE …: it still lists retired unit(s) (x1: …); rerun …`;
- by `current_manifest()`, so also by `--check-batch` and `--assemble`.

The table must still equal `EXPECTED`. So every membership change, a retirement included, needs `EXPECTED` changed by hand and shows up in review.

The quantile rule is kept only as the provenance of the initial cut: `initial_cut()` (the former `partition()`, body unchanged) and `cut()`. Nothing but the provenance tests runs them. The module docstring and the manifest's `rule` field state the pinned rule and give the initial cut as provenance.

### How BATCHES.json was produced

1. The working-tree file (the re-cut) was restored by reverting `hpf-c5tb.2`'s hunks with edits, without a git command. The result is the bytes merged in 1cbbb84: `git diff --exit-code` clean, sha256 `a7c69228…`, the value recorded for 1cbbb84.
2. With the new script, `--check` on that file → `STALE …: it still lists retired unit(s) (x1: las-b3-001, las-b5-001); rerun …`, exit 1.
3. The generator → `dropped retired unit(s) from their batch: x1: las-b3-001, las-b5-001`, then `wrote …: 8 batches, 118 units / 332 questions`.
4. `git diff` against 1cbbb84 shows only:
   - the `rule` text;
   - `eligible` 120 / 340 → 118 / 332;
   - x1's `unit_count` 18 → 16 and `question_count` 44 → 36;
   - x1's units without the two, and its qids without their 8.

   x0-pilot and x2–x7 are as merged.

### The table

| Batch | First … last | Units | Questions | Against 1cbbb84 | File |
|---|---|---:|---:|---|---|
| x0-pilot | las-b7-002 … las-b19-002 | 6 | 19 | unchanged | `data/explanations/p5-pilot.json` (present) |
| x1 | las-b1-001 … las-b8-002 | **16** | **36** | without las-b3-001, las-b5-001 | `…/explanations/x1-las.json` (present) |
| x2 | las-b8-003 … las-b14-001 | 16 | 42 | unchanged | `…/explanations/x2-las.json` (missing) |
| x3 | las-b14-003 … las-b19-003 | 15 | 42 | unchanged | `…/explanations/x3-las.json` (missing) |
| x4 | elf-b1-001 … elf-b5-002 | 16 | 52 | unchanged | missing |
| x5 | elf-b5-003 … elf-b10-002 | 17 | 45 | unchanged | missing |
| x6 | elf-b10-003 … elf-b14-003 | 16 | 48 | unchanged | missing |
| x7 | elf-b15-001 … elf-b19-002 | 16 | 48 | unchanged | missing |

118 units / 332 questions (19 + 313), the coordinator's table exactly. X1's 36 qids are exactly the 36 entries `x1-las.json` holds, in bank order. That file is not touched here: it is byte-identical to `hpf-c5tb.2`'s (`6c72164b…`), and `--check-batch x1` passes on it. The 6-qid gap is gone. `las-b8-003` and `las-b9-001` are back in X2, which has no file yet, and `las-b14-003` is back in X3. This supersedes the Retirement section's re-cut table, its "Gap" paragraph and its first handoff item.

### Changes (uncommitted, on top of hpf-c5tb.2's)

| Path | Change |
|---|---|
| `pipeline/synthetic/infold/explanation_batches.py` | `read_pin`, `assign`, `_build`; `build_manifest(…, pin_path=…)`; `current_manifest` reads the pin from the file it checks and names retired units; `partition` → `initial_cut` (provenance only, body unchanged); `RULE`, `EXPECTED`, docstring; the CLI reports dropped units; `_repeated` moved up |
| `pipeline/synthetic/infold/explanations/BATCHES.json` | The 1cbbb84 file without the two units, written by the generator |
| `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` | The pinned and initial tables, two partition tests rewritten, 23 new tests (below) |
| `docs/p5-infold-design.md` | The last sentence of `hpf-c5tb.2`'s uncommitted Amendment 1 note said the batches "are re-cut by the same rule"; it now says membership is pinned. Outside the files the bead names; changed because it would otherwise describe the superseded rule |
| `docs/worklog/hpf-c5tb.md` | Status, a pointer in the intro note, this section |

### Tests

Numbers follow the pinned table; no assertion was dropped or loosened:
- `EXPECTED_TABLE` is the table above;
- X1 is 16 units / 36 questions, with more than 36 × 10 strings;
- the CLI prints "36 questions";
- pilot + X1 is 55 entries, both partial and complete.

Fixtures are HEAD's again: "the first question of batch x2" is `p5-las-b8-003-r1-LÄS-001`, and the "unit of another batch" label is `las-b8-003`. A new case refuses an entry for a retired unit's qid (`p5-las-b3-001-r1-LÄS-001`).

Two tests encoded the cut rule:
- `test_each_section_is_cut_in_order_into_contiguous_chunks` → `test_each_section_is_held_in_order_by_contiguous_batches`. It still checks contiguity, coverage of the section, sections and file names on the current manifest; removing units keeps chunks contiguous. Its boundary assertion moved, unchanged, to the provenance test, the only place the rule still holds.
- `test_a_partition_that_differs_from_the_expected_table_fails_loudly` now moves `las-b8-003` from x2 to x1 by hand. The table refuses it; with `expected=None` the pin is kept as written. The roster without `las-b1-002` that it used is now its own refusal ("not in the roster").

New tests (23):
- **Provenance** (3):
  - `test_the_initial_cut_is_its_rule_on_the_roster_at_1cbbb84`: the roster at 1cbbb84 is rebuilt as today's eligible units plus `las-b3-001` and `las-b5-001`. The test asserts 120 / 340, the 1cbbb84 table and the boundary rule.
  - `test_the_pinned_partition_is_the_initial_cut_less_the_units_retired_since`: unit for unit, every batch.
  - `test_the_merged_cut_read_as_the_pin_gives_the_committed_manifest`: the initial cut, written as a pin and read on today's roster, gives the committed `BATCHES.json` byte for byte. As a manifest it is refused, with both units named.
- **Retirement never moves a unit** (2):
  - `test_retiring_a_unit_from_a_batch_never_moves_another_unit_between_batches` retires each of the 118 units on its own, the pilot's included. It also retires four sets: X1's edges; `las-b8-003`, `las-b14-001`, `las-b14-003` across the x2/x3 boundary; ELF edges; and pilot units with an X1 unit. In every case each batch keeps exactly its pinned units minus the retired ones, its name and its file, and `removed` names exactly the retired units. The test also pins the hazard: the old rule, re-run on today's roster, gives x1 = the 16 pinned units + `las-b8-003`, `las-b9-001`.
  - `test_a_new_retirement_drops_the_unit_from_its_batch_and_nothing_else` runs end to end in a throwaway tree with `las-b7-001` retired. The build drops it from X1 only. The expected table refuses until `EXPECTED` is changed. `current_manifest` and `--check` name the unit. The generator writes the pin without it, and `--check` is then current.
- **Refusals** (18):
  - an eligible unit in no batch: a unit dropped from the pin, and a new `las-b20-001` (1);
  - a unit in two batches (1);
  - not eligible for another reason: pending, and not in the roster (2);
  - a batch left with no unit (1);
  - a pin whose batches are not their own (7): pilot unit moved, pilot not first, file twice, wrong file, bad name, two sections, batch twice;
  - a malformed pin (5): JSON, format, empty, no units, a unit that is not a string;
  - the retired-qid entry (1).

**Mutation check.** Each mutation was applied to `explanation_batches.py` alone, the module (106 tests) run, and the mutation reverted. The file's sha256 is `34789ae1…` before and after.

| Mutation | Failing |
|---|---:|
| M1 `assign` returns the old rule's cut of today's roster | 7 failed, 81 errors (the module fixture's expected-table check) |
| M1b re-cut only after a retirement (the old behaviour; the committed manifest is unaffected) | 3 |
| M2 retired units stay in their batch | 4 |
| M3 an eligible unit in no batch is ignored | 1 |
| M4 a unit in two batches is allowed | 1 |
| M5 a pending unit is not refused | 1 |
| M6 `current_manifest` does not name retired units | 2 |
| M7 an empty batch is not refused | 1 |
| M8 the pilot check is skipped | 2 |
| M9 units kept in pin order, not roster order | 1 |

Under M1b, the never-moves test fails on its first case, a retired pilot unit, which the re-cut refuses. The end-to-end retirement test fails on its membership assertion.

### Verification (final tree)

- `explanation_batches.py --check` → current: 8 batches, 118 units / 332 questions, the table above.
- `--check-batch x1` → `batch x1: 16 units / 36 questions in pipeline/synthetic/infold/explanations/x1-las.json; every explanation gate passed, learner lint clean (846 strings)`. `--check-batch x0-pilot` → passes (421 strings).
- Assembler (nothing written):
  - `--assemble evidence-freeze --partial` → `partial: 55 explanations from x0-pilot, x1 pass every gate; missing: x2, x3, x4, x5, x6, x7. Nothing written`.
  - `--assemble evidence-freeze` → `REFUSED: release 'evidence-freeze': 277 of 332 eligible qids have no explanation (gaps): missing batch files x2 … x7`, exit 1.
  - `data/explanations/p5-evidence-freeze.json` does not exist.
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1985 passed, 7 xfailed** (40.7 s). That is `hpf-c5tb.2`'s 1962, whose 50 failures now pass, plus the 23 new tests. The batch module alone: 106 passed.
- Worker, not changed here: `npm --prefix worker run test` → 395 passed (24 files); `typecheck` clean; `lint` clean (biome, 60 files).
- Neighbouring checks:
  - `build_roster.py --check` → 118 / 332 retained, 10 / 41 retired;
  - `export_qid_registry.py --check` → 118 units / 332 qids / 14 framework ids;
  - `export_product.py --sample --check` → current.
- Determinism:
  - the generator, rerun, leaves `BATCHES.json` byte-identical;
  - `--check-batch x1` reruns identically;
  - the suite's subprocess runs of `--check` and `--check-batch x1` pass under `PYTHONHASHSEED` 0 and 4242;
  - every batch check runs `export_bank`'s double build.
- sha256 (final):
  - `pipeline/synthetic/infold/explanation_batches.py` `34789ae17e1cb846c0ccdbc1f54f27621f0020f5df164f657b98817df5aa9864`
  - `pipeline/synthetic/infold/explanations/BATCHES.json` `fd38ed33144bc1e89666a684b292b9533375ad5f9271e7c25591917d274f8e4a` (1cbbb84 `a7c69228…`)
  - `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` `7c9f68cdc8f06f76f4670b3446586b5462c285cd534c48b98c8c709d0047bf72`
  - `docs/p5-infold-design.md` `8b19fed6e7698848a3879870a8842a5a2bd3648e042381b898ea908cfbf57b2e`
  - unchanged from `hpf-c5tb.2`:
    - `x1-las.json` `6c72164b…`
    - `RETIRED.json` `fd3ab882…`
    - `approval-roster.json` `9babcc8a…`
    - `ROSTER.md` `8e0696fc…`
    - `worker/data/p5-qid-registry.json` `41480b7e…`
    - sample manifest `b6e19c81…`
    - `build_roster.py` `a3ab220b…`
  - unchanged from 1cbbb84: `export_product.py` `f627c815…`, `data/explanations/p5-pilot.json` `fd96f43f…`

### Handoff

- **For review:**
  - the pinned rule in `explanation_batches.py`;
  - `BATCHES.json` against 1cbbb84, where only x1 changes;
  - the test changes;
  - the design-doc sentence, which is outside the named files.
- **Superseded here:** in the Retirement section, the re-cut table, the "Gap" paragraph and the first handoff item (write 6 X1 entries, or change the rule). X1 needs no new entry.
- **X2–X7:** use the table above. X2 is `las-b8-003` … `las-b14-001` (16 / 42) and X3 is `las-b14-003` … `las-b19-003` (15 / 42), as first cut.
- **A later retirement:**
  - add the unit to `RETIRED.json`, rebuild the roster, change `EXPECTED` by hand and rerun the generator, which drops the unit and names it;
  - if the unit's batch file has entries for it, they must leave the file too, or `--check-batch` refuses them as outside the export;
  - if the unit is in x0–x7, add it to `RETIRED_SINCE_THE_CUT` in the test module; until then the provenance test's 120 / 340 assertion fails.
- **Batches 20–23:** their units are refused as "in no batch" until someone assigns them by hand to new batches (x8 …) in `BATCHES.json` and `EXPECTED`.
- **Not claimed:** release readiness; anything about X2–X7 content.

### Bead note

Batch membership frozen on 1cbbb84 plus the uncommitted hpf-c5tb.2 retirement: BATCHES.json is the pin (the 1cbbb84 cut less las-b3-001/las-b5-001; x1 16/36, x2–x7 unchanged, 118/332); the generator keeps the units of each batch, drops retired ones and refuses an unassigned (new units never auto-assigned), doubled or otherwise ineligible unit, an empty batch, a foreign batch name/file/pilot and a still-listed retired unit (named); the quantile rule survives only as initial_cut() provenance, tested on the 120/340 roster at 1cbbb84; x1-las.json untouched, --check-batch x1 passes (846 strings); 23 new tests incl. retire-never-moves over all 118 units, 9 mutations caught; 1985 passed, 7 xfailed; worker 395, typecheck clean; design-doc sentence corrected. Evidence: docs/worklog/hpf-c5tb.md, Batch freeze.
LANE DONE: hpf-c5tb.4

### Progress

- 2026-10-08 [S:ci-vn2tn|W:hpf-c5tb.4|H:research|E:1cbbb84] Read the bead, the batch script and its tests, the conftest, the exporter's selection and this worklog; confirmed HEAD and hpf-c5tb.2's uncommitted files (sha256 as recorded). Baseline 1912 passed, 50 failed (the X1 gap), 7 xfailed.
- 2026-10-08 [S:ci-vn2tn|W:hpf-c5tb.4|H:implement|E:pipeline/synthetic/infold/explanation_batches.py] Restored BATCHES.json to the 1cbbb84 bytes (`a7c69228…`); pinned the partition (`read_pin`, `assign`); `--check` named the two retired units; the generator dropped them from x1 and moved nothing; `--check-batch x1` passes on the untouched `x1-las.json`.
- 2026-10-08 [S:ci-vn2tn|W:hpf-c5tb.4|H:verify|E:pipeline/synthetic/infold/tests/test_infold_explanation_batches.py] Tables and fixtures; 23 new tests (provenance, retire-never-moves, refusals); module 106 passed, suite 1985 passed and 7 xfailed; 9 mutations caught, script restored byte for byte; worker 395, typecheck and biome clean; reruns byte-identical.

## Batch X2

Bead `hpf-c5tb.5`: the 42 LÄS explanations of X2 (`las-b8-003` … `las-b14-001`, 16 units), as pinned in `BATCHES.json`.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c5tb.5`, assignee `gc__implementation-worker-ci-vh54b`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.5 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` and `git rev-parse origin/main` → `2b1dabd3670847395be220bbf0139ab302ad39dc` for both (detached), the bead's snapshot. origin/main is the local ref, not fetched. No tracked change at start.
- No git writes and no network; every change is uncommitted. No tooling, partition, test, unit, candidate, roster or framework file was edited: their sha256 (below) equal the values the Batch freeze section records. Nothing under `app/` or `worker/`. The untracked runtime, skill and sandbox paths present at start are untouched.
- The bead names no validator, so none was run; `gc.check_path` is the post-close dispatcher check (`…/checks/build-artifact-valid.sh`).
- Lane policy: `git -C <path>` was refused, so plain `git` ran in the worktree. As for X1, the audit script below ran from the session scratchpad (`python3 <file>`) and is not checked in.

### Deliverables (uncommitted)

| Path | Change |
|---|---|
| `pipeline/synthetic/infold/explanations/x2-las.json` | New: the 42 X2 entries, bank order, canonical bytes |
| `docs/worklog/hpf-c5tb.md` | Status line and this section |

No test was added or changed. The verbatim-quotation test (`test_every_las_quotation_is_verbatim_from_its_unit`) reads every batch file that exists, so it now covers X2 as well; the bead keeps the test module as merged.

### X2 content

42 entries, one per qid of X2, in bank order and canonical bytes. Written the way X1 was:
- every question re-solved from the student-facing text before writing; all 42 keys hold;
- the rationale used as source only, each claim checked against the passage;
- the key argument as `solution_path` plus 5–6 ordered steps: what the question asks; the passage sentence it turns on, quoted verbatim; a paraphrase, or the limit that decides the question; a `detail` step where a glossary word needs it (bestånd, restyta, expropriation, borrmärke) or for the mechanism behind a kolmila; the options; the verdict, which ends "Svaret är X.";
- each wrong option once, with its own `why_tempting` and `why_wrong`; then `technique` and `pitfall`.

Persons are named by name or role (skribenten, textförfattaren: the word the question uses), never by a pronoun outside a verbatim quotation. Hedges are kept wherever the passage has them.

| Unit | Size | qids | framework_id per question |
|---|---|---|---|
| `las-b8-003` | short | `p5-las-b8-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b9-001` | long | `p5-las-b9-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 004, 001 |
| `las-b9-002` | short | `p5-las-b9-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b9-003` | short | `p5-las-b9-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b10-001` | long | `p5-las-b10-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 002, 001 |
| `las-b10-002` | short | `p5-las-b10-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b10-003` | short | `p5-las-b10-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b11-002` | short | `p5-las-b11-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b11-003` | short | `p5-las-b11-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 004 |
| `las-b12-001` | long | `p5-las-b12-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 003, 001 |
| `las-b12-002` | short | `p5-las-b12-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b12-003` | short | `p5-las-b12-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b13-001` | long | `p5-las-b13-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 003, 001 |
| `las-b13-002` | short | `p5-las-b13-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b13-003` | short | `p5-las-b13-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b14-001` | long | `p5-las-b14-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 003, 002 |

All 42 carry a framework_id, each checked against `frameworks/las_taxonomy.json` by the question's trigger, with X1's rules:
- **TYPE-001 (28):** "enligt texten"; "vad visade / framkom / framgick / kom fram"; "vilka krav", "vilken skyldighet", "vilken omständighet", "vad händer", "varför … enligt texten". Also the stem "Vilket påstående överensstämmer bäst med texten?" (7 questions: b9-001 q4, b9-003 q2, b10-001 q4, b10-003 q2, b12-001 q4, b12-003 q2, b13-001 q4). The authentic corpus tags that stem TYPE-001 (`data/explanations/host-2014.json`, host-2014-verb2-LÄS-012, re-read for this batch), and so does X1.
- **TYPE-002 (2):** "dra för slutsats" (b10-001 q3, b14-001 q4).
- **TYPE-003 (10):** the writer's hållning, kritik or invändning (b8-003 q2, b9-002 q2, b10-002 q2, b11-002 q2, b12-002 q2, b13-002 q2, b13-003 q2), or a named critic's invändning (b12-001 q3 Sandell, b13-001 q3 Frejmark, b14-001 q3 Nyfeldt).
- **TYPE-004 (2):** "Vilken funktion har berättelsen om …" (b9-001 q3) and "Vilken roll spelar exemplet …" (b11-003 q2): the entry's trigger "vilken funktion fyller …". The pilot uses TYPE-004 for a function question (`las-b14-002` q4); X1 had none.

No generation family is used as a framework id.

### Second-reader review (round 1)

Three independent, read-only second readers (general-purpose subagents of this session) split the 16 units, 14 questions each:
- A: b8-003 … b10-001;
- B: b10-002 … b12-002;
- C: b12-003 … b14-001.

Each first solved every question from title, passage, prompt and options alone, arguing for every option, and only then read the key and the entry. They checked the entry against the passage for:
- truth;
- verbatim quotations;
- paragraph and step references;
- voices and hedges;
- framework fit;
- Swedish;
- above all the main error class of the pilot and X1: a `why_wrong` whose argument does not exclude the option as worded.

Rationales were given to them as unverified notes, not authority.

**Keys.** All 42 keys hold for all three readers; no distractor is defensible.

**Findings.** 16 errors and 77 minor issues (A 6 + 23, B 4 + 24, C 6 + 30). Each was checked against the passage before it was applied. All were accepted, a few with different wording. For example, b12-001 q3 step 3 paraphrases Sandell instead of repeating step 2's quotation, and b14-001 q2 C states the transport point as "Enligt texten var det transporterna som avgjorde …".

- **Errors (16):**
  - Five arguments that did not exclude their option as worded:
    - b9-001 q4 D: the old argument denied what the key itself says ("ingen visshet"); the new one targets D's claim that uneven preservation is what makes the comparison uncertain;
    - b9-003 q1 B: the torg clocks refute a claim B never makes;
    - b10-002 q1 A: it refuted a causal "ledde till", where A claims only that hiring became more common;
    - b13-002 q2 C, in its why_wrong and in step 4: the writer does not miss the duty, but C is about the curiosity behind it.
  - Six false or contradictory statements:
    - b9-001 q4 A: the grant was what the stadga's conditions qualified for, not one of them;
    - b11-003 q1 D: "the only relation the text reports", which ignored the trained-teacher confound and contradicted the entry's own C;
    - b12-001 q3 step 3: Sandell's argument restated as "a third factor behind both";
    - b13-001 q4 pitfall: called the Ekelin–Frejmark dispute a side track, which the key needs;
    - b13-002 q1 solution_path: added "bara";
    - b13-003 q1 C: "kopplar aldrig" was false, since the text compares the private rise with the municipal loss; it now says the text never gives a causal link.
  - Two dropped hedges or causal readings: b9-001 q1 step 5 ("gett mer uthålliga cirklar"), b10-002 q1 D ("hängde ihop" for "tycktes").
  - Two wrong references or claims about the steps:
    - b10-001 q4 A cited step 3 for the channel clearing;
    - b10-001 q3 step 4 had "lagen" (read as "the law"), "värt något" for the text's "värt besväret", and stated the inference outright.
  - One misread function word: b14-001 q4 step 4 treated "framför allt" as a hedge; it ranks.
- **Minor, by kind:**
  - dropped limits and quantifiers: "noterad", "sorterade dagar", "minst", "i praktiken", "anmälda inbrott", "lärarna i de samhällsorienterande ämnena", "per flottad kubikmeter", "nästan undantagslöst", the limit to small groups (b11-003 q1 A);
  - attributions: "enligt Frejmark", "enligt Nyfeldt";
  - claims slightly stronger than the text: "avvisar / underkänner" for "duger sämre … säger föga om ålder"; "förklarar konflikterna"; "de rikaste" for "den skattekraften";
  - option wording misdescribed: C's "ungefär lika stor"; D's "ungefär lika stor", "det huvudsakliga betalningsmedlet";
  - step references attached to the wrong step: b9-003 q2 D, b10-002 q2 D, b12-001 q3 A;
  - idiom and grammar: "en vanlig klagan", "uppfattas som att tycka", "hur mycket de var", double negations, an over-long sentence, an antecedent-less "den siffran" inside a quotation, and the ambiguous "lagen".

**Rationale claims that did not hold.** Four findings came from framings in the units' rationales:
- b9-001 q4 A: "bokbidraget nämns som ett villkor i stadgan";
- b9-003 q1 B: the torg clocks used against B;
- b10-003 q2 C: the text "förklarar … konflikterna med hur ytorna fördelas";
- b13-001 q2 C: the text "underkänner" the moss.

As in the pilot and X1, rationale claims need checking against the passage.

**Sweep.** Reader B's last finding was a quotation in main-clause word order inside an att-clause (b12-002 q2 step 3, `att invändningarna … ”är inte tomma”`), the class X1's round 2 swept for. The same sweep over all 42 entries found six more cases. Each now has the quotation introduced with a colon, or no quotation:
- `betalades ”inte ut i pengar …”` (b9-001 q1 D);
- `”samvarierade inte alls”` (b11-003 q1 A);
- `”blev inte gjort alls”` (b12-003 q1 D);
- `låg ”varken i formen …”` (b13-001 q2 B);
- `”… skiljer dem inte åt”` (b13-001 q4 B);
- the embedded V2 clause `att av dem … ”levererade …”` (b14-001 q4 step 2).

After the fixes: batch check passes (970 strings), audit clean, 1985 passed, 7 xfailed.

### Second-reader review (round 2)

The same three-way split re-read the rewritten file. They reported only errors and clear language faults: false or added claims, non-verbatim quotations, non-excluding arguments, wrong step or paragraph references, wrong voice or dropped hedges, contradictions, rules that rule out the key, and Swedish grammar or idiom. They found 8 findings (A 4, B 3, C 1). All were checked against the passages and applied:

- **Voice (3):**
  - b9-002 q1 A gave a cause ("skälet var att gatorna ännu inte hunnit få någon muntlig historia"). The passage only places the new areas in a relative clause; the causal reading is the writer's conclusion, not Löwendahl's finding.
  - b9-003 q1 pitfall gave Ekvall's explanation to "textens poäng".
  - b11-003 q1 C gave Bergkvist's comparison to "texten".
- **Added or dropped content (2):**
  - b10-001 q3 C.why_tempting: "Flottningen skedde under vårfloden". The passage says only that the timber was thrown in during the spring flood, and the books show work in June and over summers.
  - b12-001 q4 pitfall dropped "En hel del i" before "akterna".
- **Language (3):**
  - Two quotations in main-clause word order inside an att-clause: b10-001 q1 step 2 and b13-001 q3 step 2. Round 1's sweep missed the first because its pattern capped the quotation at 80 characters. Rerun uncapped, the sweep found the second before reader C reported it.
  - b12-002 q2 pitfall: "kan tolkas som att vilja", the construction round 1 fixed in b8-003 q2. A sweep for "-s som att" finds none left.

No key changed, and no reader found a new content concern.

### Content concerns

All 42 keys stand. Nothing below was papered over: each explanation states the best case for the keyed answer and, where a learner could stumble, says why. No passage needs a change for a key to hold. Any option or stem change would need a new revision (r2), a re-gate and a ruling, which is outside this bead.

Low (an attentive learner may notice; the key holds):
1. **`las-b9-001` q4, option D, is the closest distractor.** Its "inte säger något säkert" says much the same as the key's own "materialet medger ingen visshet". D fails for two reasons:
   - it puts the uncertainty on uneven preservation, where the text names several sources and holds that the pattern "återkommer i för många orter för att avfärdas";
   - it makes one caveat the whole message, while B also carries the pattern.

   A strict reader may still find D partly true. The explanation says so in D's why_tempting and why_wrong.
2. **`las-b13-001` q4, key C: "det som i dag gör dem värdefulla … är dessutom omtvistat".** What the text leaves disputed is why the richest walls are rich, not their value. Under Frejmark's reading (no one lifted a stone), a protection that keeps the stones in place would reach what matters. The key follows the writer's closing claim that the protection "inte ändrat något" for the walls Ekelin found richest. No distractor competes. The explanation glosses "värdefulla" as the species-rich edge (step 2).
3. **`las-b14-001` q4, key C: "framför allt därför att" ranks seasonality as the main reason.** The text never ranks it. It follows from the seasons and from how the charcoal work bound the household, and no distractor competes. The explanation no longer calls "framför allt" a hedge.
4. **`las-b12-001` q3, key D: "de rikaste" is stronger than Sandell's "en stad med den skattekraften".** The stem also calls Rahmqvist's claim a "förklaring", where Rahmqvist claims "ett mönster som tål att räknas om, inte en förklaring". The explanation paraphrases Sandell from the passage, not from the option.

Minor (wording looser than the passage, harmless):
5. `las-b9-003` q1 key C gives the 27-of-32 tendency without a quantifier ("De ur som fortfarande gick rätt stod vid …"); "snarare än" keeps it comparative.
6. `las-b10-001` q2 key D says "senast den femtonde september"; the passage says "före den femtonde september".
7. `las-b10-001` q4 key C: "bestod mest av" for the text's "nära hälften" of the sorted days. Efterrensning is still the largest share.
8. `las-b10-002` q1 key C drops "tycktes" and the limits to the SO teachers and högstadiet. It contradicts nothing, and the explanation keeps all three.
9. `las-b12-002` q1 key C: "angav ofta" for "återkom … oftare än väntat"; step 3 bridges the two.
10. `las-b12-003` q2 key D: "lika mycket som elevens insats" is softer than "mäter vi inte elevens arbete utan hemmets"; step 4 says so.
11. `las-b9-002` q1 key B: "oftast" is weaker than "nästan undantagslöst" but follows from it; step 4 says so.
12. `las-b9-002` q2 key D: "fattar namnbeslut". The glossary has the namnberedning propose and examine names, and the criticism is addressed to the kommun and the beredning.
13. `las-b8-003` q2 key A: "som en gemensam angelägenhet" is the key's gloss of "inte … åt marknaden ensam"; step 4 explains it.
14. `las-b13-001` q3 key A drops Frejmark's "i regel".
15. `las-b12-001` q1: the passage carries its own counter-case. Almstorp had no heights and no church tower, yet got a plain cylinder, and the text says the pattern is not clean. The key's "förefaller" covers it.

### Verification (final tree)

- **Batch check:** `python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x2` → `batch x2: 16 units / 42 questions in pipeline/synthetic/infold/explanations/x2-las.json; every explanation gate passed, learner lint clean (970 strings)`. The gates are shard file, coverage (exactly X2's 42 qids), schema, distractor letters, framework ids, internal labels, rationale text, learner lint and canonical bytes. The check is fail-closed, so passing means zero findings.
- **Learner-output lint on X2:** `lint_learner_output.py pipeline/synthetic/infold/explanations/x2-las.json` → `clean — 1 file(s)`, 0 findings; `--strict` also clean.
- **Verbatim quotations:** `test_every_las_quotation_is_verbatim_from_its_unit` passes and now covers X2. The scratchpad audit (not checked in) applies the same rule. X2 has 512 quotation marks in 256 pairs, none unpaired:
  - 236 exact;
  - 19 that differ only in the first letter's case;
  - 1 that marks left-out words with "…";
  - 0 not in the unit's text.

  If the review wants quotations byte for byte, these 20 are the complete list to settle:
  - **First letter capitalized because the quotation opens a sentence or follows a colon (17):**
    - b9-001 q1 B ”Oavsett om de samlades …”; q4 C ”Genomgående”;
    - b10-001 q1 step 2 ”På de nedersta, flacka sträckorna …” and C ”Oberoende av hur brant fallet var”; q3 step 1 ”Dra för slutsats”; q4 D ”Entydigt”;
    - b10-002 q1 D ”Både utlåningen”;
    - b10-003 q1 step 3 ”Överblivna ytor” and B ”Ett stråk där folk ändå passerade”;
    - b11-002 q1 A ”Oavsett”;
    - b12-002 q1 pitfall ”Drygt en tredjedel”;
    - b13-001 q1 C ”Varje mur”;
    - b13-002 q1 D ”Lika kraftigt oavsett var på kroppen”;
    - b13-003 q1 A ”Oavsett hur gammal bebyggelsen i området var”;
    - b14-001 q3 C ”Aldrig”; q4 step 1 ”Dra för slutsats” and step 2 ”Av dem som sålde kol …”.
  - **Lower case mid-sentence (2):** b10-001 q4 pitfall ”knappt sju procent”, ”var tionde”.
  - **Marked omission (1):** b9-002 q2 technique ”Min invändning gäller inte … utan …”, whose pieces stand in order in one sentence of the passage.
- **The same audit, otherwise:**
  - every "(steg N)" points inside its entry;
  - every solution_path and last step ends "Svaret är <key>.";
  - every entry quotes its passage verbatim (15+ characters) in solution_path or steps, X1's content rule;
  - no han, hon, hans, hennes, honom, henne or hen outside a quotation;
  - every entry passes X1's Swedish-word ratio;
  - all framework ids are LÄS entries.
- **Partition:** `explanation_batches.py --check` → current: 8 batches, 118 units / 332 questions; x2 present.
- **Across batches (nothing written):** `--assemble evidence-x2 --partial` → `partial: 97 explanations from x0-pilot, x1, x2 pass every gate; missing: x3, x4, x5, x6, x7. Nothing written: a partial set is not a release`; `data/explanations/p5-evidence-x2.json` does not exist.
- **Test suite:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1985 passed, 7 xfailed** (40.4 s), the bead's baseline exactly; no test was added.
- **Determinism:**
  - the file is hand-written in canonical form, and the canonical-bytes gate compares it with `export_product.render_json` of its entries;
  - every batch check runs `export_bank`'s double build and compares the bytes;
  - two final runs of `--check-batch x2` gave identical output;
  - the file's sha256 did not change across them.
- **Changed files** (`git status`): `pipeline/synthetic/infold/explanations/x2-las.json` (new), `docs/worklog/hpf-c5tb.md` (modified). Nothing else.
- **sha256:**
  - `pipeline/synthetic/infold/explanations/x2-las.json` `1369803fa22b9b25d131beaa458b8c5618a4fcedff6c0832a6bf57853c81562d`
  - unchanged:
    - `BATCHES.json` `fd38ed33…`
    - `explanation_batches.py` `34789ae1…`
    - `export_product.py` `f627c815…`
    - `x1-las.json` `6c72164b…`
    - `data/explanations/p5-pilot.json` `fd96f43f…`
    - `tests/test_infold_explanation_batches.py` `7c9f68cd…`
    - `approval-roster.json` `9babcc8a…`
    - `frameworks/las_taxonomy.json` `2096323e…`

### Handoff

- **Ready for review:**
  - an independent correctness and language review of X2 (hpf-c5tb's plan: Codex);
  - then the owner's look at content concerns 1–4.

  Committing, pushing and opening the PR are outside this lane.
- **For X3:**
  - the same procedure, with two lessons from this batch:
    - run the att-clause word-order sweep without a length cap;
    - check rationale framings before reusing them (four of this batch's round-1 findings came from them);
  - quotations that start a sentence or follow a colon may change only the first letter's case;
  - "framför allt" ranks; it is not a hedge.
- **Not claimed:**
  - release readiness: no release shard was written, and nothing was synced or deployed;
  - semantic certification beyond the reviews recorded here (lint is necessary, not sufficient);
  - X3–X7.

### Bead note

P5 PR2b X2 implemented, uncommitted on 2b1dabd: pipeline/synthetic/infold/explanations/x2-las.json, 42 reviewed LÄS entries for las-b8-003…las-b14-001 (16 units). All keys hold. Framework ids: TYPE-001 28, -002 2, -003 10, -004 2. Two second-reader rounds (round 1: 16 errors and 77 minor; round 2: 8) plus an att-clause word-order sweep (6 more), all applied. 15 content concerns logged, 4 low, none needing a passage change. check-batch x2 clean (970 strings); lint default/strict clean; verbatim test passes (256 quotations); 1985 passed, 7 xfailed; reruns identical. Evidence: docs/worklog/hpf-c5tb.md, Batch X2.
LANE DONE: hpf-c5tb.5

### Progress

- 2026-10-08 [S:ci-vh54b|W:hpf-c5tb.5|H:research|E:2b1dabd] Read the design (§C/§D, Amendment 1), LAYER2-RENDERING.md, the app's explanation type, the schema, the exporter's gates, the pilot, X1, this worklog, BATCHES.json and the LÄS catalog. Read and re-solved all 16 units, 42 questions, from the student text: all keys hold.
- 2026-10-08 [S:ci-vh54b|W:hpf-c5tb.5|H:author|E:pipeline/synthetic/infold/explanations/x2-las.json] Wrote the 42 entries in canonical form, in four chunks. `--check-batch x2` passed on the first run (970 strings); lint clean; 1985 passed, 7 xfailed; the partial assembly of pilot + X1 + X2 passes.
- 2026-10-08 [S:ci-vh54b|W:hpf-c5tb.5|H:review|E:pipeline/synthetic/infold/explanations/x2-las.json] Second-reader round 1 (three readers): 16 errors and 77 minor, all checked and applied, plus the att-clause sweep (6). Round 2: 8, applied; the uncapped sweep had already caught reader C's one. Final checks green, reruns identical.

### X2 review fix

Bead `hpf-c5tb.6`: review finding B1 on PR #381 (review bead `hpf-gj5p`). B1 is an explanation that gives the writer a position the passage does not state, in `las-b13-003` q2. The bead also asked for a sweep of all 42 X2 entries for the same defect class.

**Snapshot and boundaries**
- Claimed with `gc hook --claim --json` (`hpf-c5tb.6`, assignee `gc__implementation-worker-ci-bs7qz`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.6 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- Branch `codex/hpf-c5tb-x2` at `77064a5dceb47cc309a72d2e6003fab805e08a62`, as the bead states; no tracked change at start. `x2-las.json` sha256 was `1369803f…`, the value the Batch X2 section records.
- No git writes and no network; the changes are uncommitted. The untracked runtime, skill and sandbox paths present at start are untouched.
- The review worklog `hpf-gj5p.md` lives in the vault, which this lane's sandbox cannot read (the read was refused). B1 is taken from the bead text and from `hpf-gj5p`'s closing note. The reviewer's suggested Swedish was therefore not available. The new wording is this lane's own, checked against the passage, which the bead allows ("or equivalent wording").
- The bead names no validator, so none was run (`gc.check_path` is the post-close dispatcher check, as for the earlier beads).

**B1.** `p5-las-b13-003-r1-LÄS-002`, "Vilken invändning riktar textförfattaren mot förslaget att utöka flaggdagslistan?", key D. Option C: "Förslaget lägger ansvaret för att dagarna märks på fastighetsägarna i stället för på den myndighet som fastställer listan."
- distractor C `why_wrong`
  - before: "Textförfattaren klagar inte på att ansvaret läggs på fastighetsägarna. Tvärtom efterlyses en rad i driftbudgeten och ”en person som vet att raden gäller henne” – ansvaret ska alltså ligga där stängerna sköts, inte hos den som fastställer listan (steg 3)."
  - after: "Texten säger aldrig att förslaget lägger ansvaret på fastighetsägarna, och textförfattaren klagar inte på något sådant. Invändningen gäller antagandet att seden bärs av almanackan: så länge ingen har uppgiften att sköta stängerna märks de nya dagarna inte (steg 2–3)."
- step 4 ("Pröva alternativen"), its last clause
  - before: "… och C vill lägga ansvaret hos den som fastställer listan, fast textförfattaren efterlyser någon som sköter stängerna."
  - after: "… och C påstår att förslaget lägger ansvaret på fastighetsägarna, vilket texten aldrig säger."

Why the old text was wrong:
- The passage never mentions who sets the list, and never says responsibility must be kept from that authority. The contrast "där stängerna sköts, inte hos den som fastställer listan" was invented.
- What the writer asks for, ”en rad i driftbudgeten, och en person som vet att raden gäller henne”, says nothing about which body provides it.
- "Tvärtom" turned the writer's request into the opposite of a complaint about the property owners, which the passage does not say either.
- "(steg 3)" pointed at a step that does not contain ”en person som vet att raden gäller henne”.

What the new text does:
- It rejects C on what C invents. The proposal in stycke 5 (”Nu föreslås att listan över allmänna flaggdagar ska utökas.”) says nothing about responsibility or property owners, and the writer complains about no such transfer.
- It then states the real objection: the assumption (step 2) and the unnoticed days (step 3), hence "(steg 2–3)".
- Origin: the framing came from the unit's rationale ("hela texten placerar ansvaret hos den som äger stången och betalar driften"). That makes five X2 rationale claims that did not hold, after the four of round 1.

**The whole entry, re-verified against the passage.** One more sentence gave the writer a position the passage does not take, and is fixed. Reader C (below) had marked it borderline:
- distractor B `why_wrong`, its last sentence
  - before: "Textförfattaren vill inte skjuta upp förslaget utan peka på vad som saknas: någon som sköter stängerna (steg 2–3)."
  - after: "Invändningen gäller inte när förslaget ska genomföras, utan vad som saknas: någon som sköter stängerna (steg 2–3)."
  - The passage takes no stance on postponing. ”Mot dagarna i sig har jag ingenting” and ”jag skulle flagga för den utan invändning” are about the days, not about timing. The new sentence says what the objection is about (stycke 5–6) and still answers B's "bör vänta". The sentence before it, "Texten för aldrig fram den som ett skäl att vänta.", is unchanged.

The rest holds and is unchanged:
- solution_path and steps 1–3 and 5: the quotations are verbatim (stycke 5 and 6). "ger bara fler dagar som inte märks" paraphrases ”Fler dagar på en lista som ingen verkställer ger fler dagar som inte märks”, and the key's own "ändrar ingenting" says the same.
- A: ”Mot dagarna i sig har jag ingenting.” and the "väl motiverad" concession are in the text, and the erosion argument is not.
- B, first two sentences: the economy appears only in Hollstensson's hedged caveat (”kan ha drivit fram”), never as a reason to wait.
- C `why_tempting`, "Texten handlar om vem som ska ansvara för flaggningen": a description of the lure. The passage is about who has the task: ”ingen längre har uppgiften” (stycke 2), entreprenad against egen regi (stycke 3), ”en person som vet att raden gäller henne” (stycke 6). Kept.
- technique and pitfall: true of the passage.

**Sweep.** The class, as the bead defines it: an explanation that gives the writer, a named person or "texten" a position, motive or contrast that the passage does not state. Every step text and every `why_wrong` of the 42 entries was re-read against the unit's student-facing text: title, passage with glossary and signature, prompts and options. So were solution_path, `why_tempting`, technique and pitfall. Two independent passes:
- this lane's own read of all 16 units;
- three read-only second readers (general-purpose subagents of this session), split as in the X2 rounds (b8-003 … b10-001; b10-002 … b12-002; b12-003 … b14-001). Each was given the class and B1 as the worked example, with the rationales marked as unverified notes. Each was asked to quote the passage for every finding and to classify it as a true instance or borderline. Their reports are not checked in.

Readers: 0 true instances, 5 borderline (A 1, B 2, C 2). Four of the five were also on this lane's own list. The fifth, the label "vänder på orsak och verkan", this lane had checked and cleared in each entry. Each borderline item was decided against the passage:
- fixed, if the explanation states a position or contrast that the passage does not draw;
- kept, if the passage states or clearly implies it.

Fixed (one, besides B1's entry):
- `p5-las-b9-001-r1-LÄS-004`, distractor A `why_wrong` (reader A and this lane)
  - before: "Texten säger aldrig att bokbidraget avgjorde vilka cirklar som fortsatte. Mönstret som träder fram gäller ansvaret, inte bidraget (steg 2)."
  - after: "Texten säger aldrig att bokbidraget avgjorde vilka cirklar som fortsatte. Bidraget hör till stadgan i andra stycket, och mönstret som träder fram gäller ansvaret (steg 2)."
  - The old sentence was the passage's own sentence, ”Mönstret som ändå träder fram gäller ansvaret snarare än stoffet”, with the contrast swapped from "stoffet" to "bidraget". It cited step 2, which quotes the original.
  - The text contrasts responsibility with what was read, never with the grant. A learner who checks step 2 meets a different contrast from the one cited, and could take "stoffet" for the book grant, which was paid in books.
  - The new sentence keeps the true content: the grant belongs to the stadga (stycke 2), as q1's D `why_wrong` already says, and the pattern concerns responsibility.

Kept (the passage states or clearly implies them):
- **"A vänder på orsak och verkan"** as the step-4 label of a reversed distractor in b8-003 q1, b9-001 q1, b10-001 q1, b10-002 q1 and b12-001 q1 (reader B marked b12-001 borderline). The same wording appears in b8-003 q1 A's `why_wrong` and as "D vänder på orsak och verkan" in b9-003 q2. Each passage gives the relation a direction:
  - b8-003: ”vad som händer i en bygd när det sista bankkontoret stänger”;
  - b9-001: ”där ledaren var hämtad ur den egna kretsen tycks …”, with the mechanism in stycke 4;
  - b10-001: the channels were cleared in the 1920s and the days rose ”under de följande decennierna”;
  - b10-002: ”tycktes undervisningen förändras … började”;
  - b12-001: ”därför måste” for the forced location;
  - b9-003: an explicit causal story.

  The hedges stay in the same steps. Where the researcher calls the finding a tendency, not an explanation (b9-001, b10-001, b12-001), X1's label "vänder på sambandet" would be more exact. That is a consistency polish, not a false claim, and it is left for the review.
- **b10-003 q2 step 2, "Skribenten drar samma slutsats"** (reader B): the writer ties the objection to Almstierna's point (”Här ligger min invändning.”), and both reject the count as the measure (”antalet anlagda rastgårdar”; ”inte för fler”).
- **b13-003 q2 C `why_tempting`** (reader C, secondary): see the entry above.
- **Cleared by the readers and by this lane:**
  - b8-003 q1 A "…, inte varför kontoren försvann": the scope of the study as the text defines it;
  - b9-003 q2 C "för att avvisa den": ”Den räcker inte.”, plus the counter-evidence;
  - b10-001 q3 C "Rensningen fortsatte alltså efter själva flottningen": call-outs ”varje höst”, always after 15 September;
  - b14-001 q2 C "…, inte var råvaran fanns": ”Den skillnaden avgjorde var hantverken kunde bedrivas” and ”trots att skogen längre bort var minst lika god”;
  - b12-003 q2 step 3, "Elmeruds mätningar stöder tanken";
  - b13-002 q2 D `why_wrong`;
  - b14-001 q1 D and its pitfall;
  - b14-001 q4 step 3, which step 4 marks as an inference.

**Verification (final tree)**
- `python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x2` → `batch x2: 16 units / 42 questions in pipeline/synthetic/infold/explanations/x2-las.json; every explanation gate passed, learner lint clean (970 strings)`. The edits were in place, and the canonical-bytes gate passes, so no regeneration was needed.
- `lint_learner_output.py pipeline/synthetic/infold/explanations/x2-las.json` → `clean — 1 file(s)`; `--strict` also clean.
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1985 passed, 7 xfailed** (41 s), the Batch X2 numbers. `test_every_las_quotation_is_verbatim_from_its_unit` is among them. X2 now has 255 quotations: the old C `why_wrong`'s ”en person som vet att raden gäller henne” went with it (closing marks 512 → 510). No new quotation was added.
- Diff: a scratchpad script (`python3 <file>`, not checked in) compared every learner field of the 42 entries with `git show HEAD:…/x2-las.json`. Exactly 4 fields in 2 entries changed, the four above:
  - `p5-las-b13-003-r1-LÄS-002`: step 4, B `why_wrong`, C `why_wrong`;
  - `p5-las-b9-001-r1-LÄS-004`: A `why_wrong`.

  Qid order, field sets and framework ids are unchanged.
- Changed files (`git status`): `pipeline/synthetic/infold/explanations/x2-las.json`, this worklog.
- sha256:
  - `pipeline/synthetic/infold/explanations/x2-las.json` `9071320aeb310356102cbbace8f9beaa4cff107e7235f349818e68da110081c5` (HEAD `1369803f…`);
  - unchanged: `BATCHES.json` `fd38ed33…`, `explanation_batches.py` `34789ae1…`, `x1-las.json` `6c72164b…`, `data/explanations/p5-pilot.json` `fd96f43f…`, `tests/test_infold_explanation_batches.py` `7c9f68cd…`, and the unit `batch13/candidates-final/las-b13-003.json` `4121c6ce…`, the roster's value.

**Handoff**
- Ready for an exact-head re-review of the four changed fields.
- Left for the review: the "orsak och verkan" label (a polish; see Kept).
- Committing, pushing and updating PR #381 are outside this lane.

**Bead note**

X2 review fix on 77064a5, uncommitted: B1 fixed in p5-las-b13-003-r1-LÄS-002 (C why_wrong and step 4 no longer give the writer a contrast between whoever runs the poles and the authority that sets the list; C is rejected on what it invents, a proposal moving responsibility to property owners); class sweep of all 42 entries (own read plus three second readers: 0 true instances, 5 borderline) fixed two more, the B why_wrong of that entry (a stance on postponing that the passage never takes) and b9-001 q4 A why_wrong (the contrast of the passage itself swapped from stoffet to bidraget under a step citation), and kept three with reasons (the orsak och verkan label left as a polish); 4 fields in 2 entries; check-batch x2 clean (970 strings), lint default and strict clean, 1985 passed, 7 xfailed. Evidence: docs/worklog/hpf-c5tb.md, section X2 review fix.
LANE DONE: hpf-c5tb.6

## Batch X3

Bead `hpf-c5tb.7`: the 42 LÄS explanations of X3 (`las-b14-003` … `las-b19-003`, 15 units), as pinned in `BATCHES.json`.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c5tb.7`, assignee `gc__implementation-worker-ci-uypph`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.7 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` and `git rev-parse origin/main` → `9ab23a6a943b46af40a7dfa18cd6a02b8021c03f` for both (detached), the bead's snapshot. origin/main is the local ref, not fetched. No tracked change at start.
- No git writes and no network; every change is uncommitted. No tooling, partition, test, unit, candidate, roster or framework file was edited: their sha256 (below) equal the values the earlier sections record. Nothing under `app/` or `worker/`. The untracked runtime, skill and sandbox paths present at start are untouched.
- The bead names no validator, so none was run; `gc.check_path` is the post-close dispatcher check (`…/checks/build-artifact-valid.sh`).
- Lane policy: `git -C <path>` was refused, so plain `git` ran in the worktree. As for X1 and X2, the drafting, assembly and audit scripts ran from the session scratchpad (`python3 <file>`) and are not checked in. The entries were drafted in five scratchpad chunks; an assembly script writes them in `BATCHES.json` order as `export_product.render_json` does, and `--check` confirms that the committed bytes are a fresh assembly.

### Deliverables (uncommitted)

| Path | Change |
|---|---|
| `pipeline/synthetic/infold/explanations/x3-las.json` | New: the 42 X3 entries, bank order, canonical bytes |
| `docs/worklog/hpf-c5tb.md` | Status line and this section |

No test was added or changed. `test_every_las_quotation_is_verbatim_from_its_unit` reads every batch file that exists, so it now covers X3 as well; the bead keeps the test module as merged.

### X3 content

42 entries, one per qid of X3, in bank order and canonical bytes. Written the way X1 and X2 were:
- every question re-solved from the student-facing text before writing; all 42 keys hold;
- the rationale used as source only, each claim checked against the passage;
- the key argument as `solution_path` plus 5–6 ordered steps: what the question asks; the passage sentence it turns on, quoted verbatim; a paraphrase, the limit or concession that decides the question, or the inference; the options; the verdict, which ends "Svaret är X.". A step that only supports the argument (a second result, a reservation, a concession) is `detail`;
- each wrong option once, with its own `why_tempting` and `why_wrong`; then `technique` and `pitfall`.

Persons are named by name or role ("textförfattaren", the word every X3 stem uses), never by a pronoun outside a verbatim quotation. Hedges and ranking words are kept wherever the passage has them ("tycks", "ofta", "inte sällan", "drygt", "i regel", "kunde"; "framför allt" ranks, it is not a hedge).

| Unit | Size | qids | framework_id per question |
|---|---|---|---|
| `las-b14-003` | long | `p5-las-b14-003-r1-LÄS-001` … `-004` | LAS-TYPE-001, 003, 004, 002 |
| `las-b15-001` | long | `p5-las-b15-001-r1-LÄS-001` … `-004` | LAS-TYPE-003, 001, 002, 001 |
| `las-b15-002` | short | `p5-las-b15-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b15-003` | short | `p5-las-b15-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b16-001` | long | `p5-las-b16-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 002, 001 |
| `las-b16-002` | short | `p5-las-b16-002-r1-LÄS-001`, `-002` | LAS-TYPE-003, 001 |
| `las-b16-003` | short | `p5-las-b16-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b17-001` | long | `p5-las-b17-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 001, 001 |
| `las-b17-002` | short | `p5-las-b17-002-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b17-003` | short | `p5-las-b17-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 001 |
| `las-b18-001` | long | `p5-las-b18-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 001, 002 |
| `las-b18-002` | short | `p5-las-b18-002-r1-LÄS-001`, `-002` | LAS-TYPE-003, 003 |
| `las-b18-003` | short | `p5-las-b18-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |
| `las-b19-001` | long | `p5-las-b19-001-r1-LÄS-001` … `-004` | LAS-TYPE-001, 001, 001, 002 |
| `las-b19-003` | short | `p5-las-b19-003-r1-LÄS-001`, `-002` | LAS-TYPE-001, 003 |

All 42 carry a framework_id, each checked against `frameworks/las_taxonomy.json` by the question's trigger, with X1's and X2's rules:
- **TYPE-001 (27):** "enligt texten"; "vad visade / framkom / framgick / fann"; "vad anges som skälet", "vad framställs som orsaken", "vad avgjorde", "vad talade emot", "vad var felet", "vad utmärkte", "vad hände", "vad sägs i texten om". Also the stem "Vilket påstående överensstämmer bäst med texten?" (6 questions: b15-003 q2, b16-003 q2, b17-001 q4, b17-003 q2, b18-001 q3, b19-001 q3), which the authentic corpus tags TYPE-001 (`data/explanations/host-2014.json`, host-2014-verb2-LÄS-012), as X1 and X2 do.
- **TYPE-002 (5):** "dra för slutsats" (b14-003 q4, b15-001 q3, b16-001 q3, b18-001 q4, b19-001 q4).
- **TYPE-003 (9):**
  - the writer's hållning or kritik, or the writer's view of the writer's own suspicion (7): b15-002 q2, b16-002 q1, b17-002 q2, b18-002 q1 ("Vilken svaghet … pekar textförfattaren på?"), b18-002 q2, b18-003 q2, b19-003 q2;
  - a named person's objection (2): b14-003 q2 (Karnstedt's invändning) and b15-001 q1 ("Vad anförde Kilbrand mot föreläggandet 1878?"). The second could also be read as a direct detail (TYPE-001); TYPE-003 follows X2's rule for a named person's objection.
- **TYPE-004 (1):** "Varför nämner textförfattaren fiskhandlarens isförråd under trappan?" (b14-003 q3), the function of an example. The pilot tags "Varför tar recensenten upp …" the same way (`las-b14-002` q4).

No generation family is used as a framework id.

### Second-reader review (round 1)

Three independent, read-only second readers (general-purpose subagents of this session) split the 15 units:
- A: b14-003 … b16-001 (16 questions);
- B: b16-002 … b17-003 (12 questions);
- C: b18-001 … b19-003 (14 questions).

Each ran a scratchpad script that prints only the student-facing text (title, passage with byline and glossary, prompts, options; no key, no rationale) and solved every question from it, arguing for every option, before reading the entries. They checked every field against the passage. The two error classes of the earlier reviews came first:
- a `why_wrong` whose argument does not exclude the option as worded;
- a position, motive or contrast given to the writer, a named person or "texten" that the passage does not state.

They also checked truth, hedges, verbatim quotations, step and paragraph references, voices, rules that rule out the key, framework fit and Swedish. Rationales were offered as unverified notes, not authority.

**Keys.** All 42 keys hold for all three readers; no distractor is defensible.

**Findings.** 18 errors and 44 minor items (A 7 + 13, B 6 + 16, C 5 + 15; several minor items had more than one point). Each was checked against the passage before it was applied. All were accepted, a few with different wording. For example, b14-003 q3 now quotes ”de var inga misstag” after a colon; in an att-clause it would break the ingen-rule.

- **Errors (18):**
  - Two arguments that did not exclude their option as worded:
    - b15-001 q1 step 4: "C strider mot själva föreläggandet" does not rule out C as something Kilbrand argued, since an appeal can dispute an order's premise. Now "C finns inte bland Kilbrands skäl".
    - b16-003 q2 pitfall: it rejected B on the word "minnesstöd", but a frame that spares you from remembering is close to one. The exclusion is the leafing: ”Stommen för bara skelettet vidare”, and in Rossmåla the lövning changed although the stomme was saved.
  - Five voice or stance errors:
    - b14-003 q2 solution_path widened Karnstedt's objection to Frödell's whole trial. It concerns the result with the wall without sawdust, and Karnstedt does not dispute the comparison of the stacks.
    - b15-001 q1 solution_path gave the narrated eleven months to Kilbrand's besvärsskrift. Only the last sentence is marked as his (”vore, skrev han, att börja arbetet från början”).
    - b18-002 q1 pitfall called B "en verklig kritik i texten", but the writer never objects that the runners were counted once. The objection to the August visit is the month: ”I augusti är det ljust till halv tio”.
    - b19-001 q4 recast Krokvall's ”dålig kontroll” as "slarv" and "vårdslöshet", and said that A "återger" Krokvall's reading; A sharpens it.
    - b15-002 q2 pitfall said a view reported in the text "är inte textförfattarens egen". That is false for this very text, where the writer agrees with Slättmar.
  - Six dropped hedges or limits:
    - "framför allt" (b15-002 q1 A) and "drygt" (b15-002 q1 steps 3 and 6);
    - "tycks" (b16-003 q2 C), and "C stämmer" for villages where the measures moved ”knappt” (b16-003 q1 pitfall);
    - "inte sällan" (b18-001 q4 step 5);
    - a speed level given for the whole of Tunbergsvägen, where the passage has one only for the straight part (b17-002 q1 A).
  - Four false or unsupported statements:
    - "bara" in b16-001 q3 A: the passage also gives the watering's purpose;
    - "först" in b17-003 q1 step 3: the passage gives two snapshots, not a start;
    - two claims about how the text ends (b18-003 q2 solution_path; b19-003 q2 C and pitfall), where a further paragraph follows.
  - One grammar fault: "ett av deras platser" (b17-001 q3 C).
- **Minor, by kind:**
  - precision against the passage: "fram till räkningen", not "betalningen"; "nämns två gånger"; "innermurar eller … de översta skiften"; "lagades eller revs och restes igen"; "vid de temperaturer en sådan ugn orkar hålla";
  - voices: "som Rimhall vänder på"; "skälet som anges i handlingarna"; "enligt textförfattaren"; "enligt Bråtemo";
  - techniques that stated an item-specific rule as general advice (b15-003 q2, b18-001 q3, b18-002 q2, b19-001 q3);
  - options misdescribed (b17-001 q4 B; b19-001 q1 D is about finding the layer, not digging it);
  - idiom: "när sommaren led", "låta som att", "struntar i", "ingen andra";
  - naming the difference between "grannbyns form" and the passage's nearest village with a saved stomme (b16-003 q1).

**Rationale claims that did not hold.** Three errors came from framings in the units' rationales:
- C "vänder på sakförhållandet" against the order (b15-001 q1);
- "stommen degraderas till ett minnesstöd" (b16-003 q2 B);
- A "återger just den tolkning som försöken talar emot" (b19-001 q4).

As in the pilot, X1 and X2, rationale claims need checking against the passage.

After the fixes: batch check passes (984 strings), audit clean, 1985 passed, 7 xfailed.

### Second-reader review (round 2)

Three fresh read-only readers (new subagents, same split) re-read the rewritten file. Each again solved every question blind first, and reported only errors and clear language faults. All 42 keys hold for all three; no distractor is defensible. 11 findings (A 3, B 5, C 3) in 16 fields, all checked against the passages and applied:
- **One argument that did not exclude its option** (b17-002 q1 A). The old `why_wrong` said the bumps went at a pipe excavation and were not chosen by speed, but A claims only *where* they were removed. It now says the text never gives where the speed was highest before, and that the measurements show a change (29 → 34 on the straight part, none on the curvy one).
- **Dropped hedges and limits (7):**
  - "ungefär" and "redovisad" (b15-002 q1 B why_tempting);
  - "kunde" (b15-003 q1 step 4 and q2 C);
  - "tycks" after a colon (b16-003 q1 A);
  - the factory-yard tests behind "dubbelt" (b17-001 q2 solution_path and step 5);
  - "Det mesta", which "Den såldes" had turned into all of it (b18-001 q2 C);
  - "inte sällan" (b18-001 q2 pitfall);
  - "där källorna räcker till" and "ofta" (b18-003 q1 step 5, pitfall and A), limits that the entry's own step 3 names.
- **Fields in tension (1).** b16-003 q2's pitfall ("B börjar rimligt …") accepted the "minnesstöd" half that step 4 and B's `why_wrong` reject. The pitfall now says only that B stretches the frame's role to the leafing. B's `why_wrong` now cites ”varken minnas eller besluta något” instead of "en instruktion", which reader B called weak.
- **Language (2):** "texten säger … den närmaste by" became "talar … om" (b16-003 q1 step 4); and a missing comma in b16-001 q4's solution_path made "kom varm fram" read as said of the stones.

Reader A also listed two points as checked but not counted. Both are applied:
- b14-003 q2's conclusion now gives Karnstedt's view to Karnstedt ("enligt Karnstedt");
- b14-003 q1 step 3 dates the prices ("vid mitten av 1890-talet").

**Sweeps.**
- **Quotations inside att-clauses**, uncapped, as X2 recommends. Every "att …" followed by a quotation was read, together with every att-clause holding a negation.
  - Before round 1, the sweep found two ingen-rule cases, now after colons: `att sådana förråd ”var inga misstag”` (b14-003 q3) and `att vattningen ”gjorde ingen sten hel igen”` (b16-001 q3 A).
  - After round 2, it found one case that a round-2 fix had introduced: `att den som reser stången ”behöver varken minnas …”` (b16-003 q2 B). It is now a main clause: "Enligt texten behöver den som reser stången dessutom ”varken minnas eller besluta något”".
- **Claims about where a paragraph or the text begins or ends** ("slutar", "sista stycket", "inleds"; 14 places): all true after round 1's two fixes.

### Self-check for invented stances

The bead asks for a self-check of every `why_wrong` and step for invented writer stances. This lane ran it twice:
- **While drafting.** Each entry was checked as it was written; one sentence was cut back before review. b15-001 q1 C's "Föreläggandet gällde tvärtom …" drew a contrast that the passage leaves implicit; the "tvärtom" went.
- **After round 1.** Every step and `why_wrong` of the revised file (and the other fields) was read against the passages again. The check looked for a position, motive or contrast given to the writer, a named person or "texten" that the passage does not state. Nothing turned up beyond what the readers had flagged.

Round 2's readers, given the same class, found no instance. Across the batch, the class produced the 5 round-1 errors listed above.

### Content concerns

All 42 keys stand. Nothing below was papered over: each explanation states the best case for the keyed answer and, where a learner could stumble, says why. No passage needs a change for a key to hold. Any option, stem or passage change would need a new revision (r2), a re-gate and a ruling, which is outside this bead.

Low (an attentive learner may notice; the key holds):
1. **`las-b14-003` q4, key B, "skrevs ned utan mätningar", is inferred, not stated.** Its support sits inside the later reading (”Regeln har senare lästs som en tumregel utan täckning, en av många i en näring som knappt mätte något alls”), together with ”Isarbetarna visste det här, om än inte i de termerna”. The text never says that Lorentzon himself measured nothing. B is still clearly best; the explanation says "Inget i texten tyder på att regeln byggde på mätningar".
2. **`las-b17-001` q4, key C, "Råvarans kvalitet styrde inköpen", generalises stycke 1** (”Vad som avgjorde ett inköp var sällan priset per kubikmeter”). Cost did weigh elsewhere: in 1911 the denser northern timber would have cost ”omkring arton procent mer”, and in wartime Bråneskog writes of aspen ”som en post i en kalkyl”. C is still the best option; A, B and D each have a wrong half.
3. **`las-b17-002` q2, key C, "både ljudet och farten skulle öka", is firmer on speed than the writer's words.** The writer only says ”farten har inte sjunkit någonstans där hindren blivit färre” and concedes ”trafikökningen kan jag inte räkna bort”. The writer's verdict (”Förslaget bör avslås i februari”) is not among the options.
4. **`las-b16-003` q2, option B, is thin.** "Minnesstöd" is close in effect to ”en instruktion … behöver varken minnas”, so the clean exclusion is ”och lövas på nytt” against ”Stommen för bara skelettet vidare”. D is clearly best, and the explanation now leads with the leafing.
5. **`las-b15-002` q2, key B, "inte behövs", drops the passage's scope** (”behövs inte för att skapa de timmarna”). The writer concedes that the freed hours fall late and rejects the hall partly on cost. B is still best.
6. **`las-b17-003` q2, key A, rests on the writer's reading that the change was deliberate** (”förändringen var avsiktlig”), after conceding Bråtemo's point that ”ingen vet vad läraren faktiskt sade”. "Lärarens besked" could be read as classroom practice. A is still best.
7. **`las-b18-001` q4, option B, is excluded only by reading ”Gillervalls uppmätningar” as measurements of the remains.** The text implies this (”ägnat tio år åt att inventera lämningarna”) but does not say it. "Gillervalls uppmätningar av lämningarna" would make it airtight.
8. **`las-b18-003` q1: the mantal finding is Tennlöv's only by context.** The sentence ”Men där källorna är fylliga nog att pröva saken tycks årplatserna ofta ha fördelats efter gårdarnas mantal …” has no attribution of its own. The natural reading supports the key.

Minor (wording looser than the passage, harmless):
9. `las-b15-002` q1 key D: "gått i arv" is figurative for ”förnyats år efter år utan att sökas om”, and "ungefär var femte" softens ”drygt en femtedel”. Step 3 bridges both.
10. `las-b16-003` q1 key B (and A): "grannbyns form" for ”formen i den närmaste by som hade en sparad stomme”. Step 4 names the difference.
11. `las-b15-003` q2 key B: "men sedan krävdes en rangordning". "Sedan" is vague; the passage ties the ranking to the cap that ”upphörde att vara självklart”.
12. `las-b17-001` q3 stem: "Vad fick fabriken att välja …" treats the documented reason as the factory's motive (”det skäl som anges i handlingarna”). The explanation keeps the source.
13. `las-b19-001` q4 key B drops ”vid de temperaturer en sådan ugn orkar hålla”; the explanation keeps it.
14. `las-b19-001` q3 key D: "bestämde … luppens storlek" is inferred, through ”Ur detta följer mycket av det som annars ser ut som fattigdom” and ”En blåsning gav några kilo järn”.
15. `las-b19-001` q3 option C: the passage does not say whether stycke 8's ”uppteckningarna” are the 1880s records of stycke 2. C is unsupported either way.
16. `las-b19-003` q2 key B: "den vanliga förklaringen" for ”Den förklaring som ligger närmast”.
17. `las-b16-002` q1 key C: "påvisbar" without ”i förväg”. `las-b17-003` q1 key C: "fulla av påståenden" for ”dominerade beskeden”. Both are bridged in the explanation.
18. `las-b18-001` q1 key A: "fräste … pulver" for ”sjuda … mjöl”.
19. `las-b18-003` q2's options ("Han …") and `las-b19-003`'s stem and options ("hon", "Hon …") refer to the writer with a gendered pronoun that only the byline's first name suggests; the passages say "jag". The explanations say "textförfattaren". Whether stems should do the same is a product decision.

### Verification (final tree)

- **Batch check:** `python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x3` → `batch x3: 15 units / 42 questions in pipeline/synthetic/infold/explanations/x3-las.json; every explanation gate passed, learner lint clean (984 strings)`.
  - The gates: shard file, coverage (exactly X3's 42 qids), schema, distractor letters, framework ids, internal labels, rationale text, learner lint and canonical bytes.
  - The check is fail-closed, so passing means zero findings.
- **Learner-output lint on X3:** `lint_learner_output.py pipeline/synthetic/infold/explanations/x3-las.json` → `clean — 1 file(s)`, 0 findings; `--strict` also clean.
- **Verbatim quotations:** `test_every_las_quotation_is_verbatim_from_its_unit` passes and now covers X3; run alone (`-k "verbatim or quotation"`), 2 passed. The scratchpad audit applies the same rule. X3 has 448 quotation marks in 224 pairs, none unpaired:
  - 214 exact;
  - 10 that differ only in the first letter's case;
  - 0 that mark left-out words;
  - 0 not in the unit's text.

  If the review wants quotations byte for byte, these 10 are the complete list to settle:
  - **First letter capitalized because the quotation opens a sentence (7):**
    - ”Dra för slutsats” in step 1 of b14-003 q4, b15-001 q3, b16-001 q3, b18-001 q4 and b19-001 q4;
    - b14-003 q4 A why_wrong ”En enda regel”;
    - b16-002 q1 B why_tempting ”Försiktigt och stegvis”.
  - **Lower case mid-sentence where the source word opens a sentence (3):**
    - b18-001 q3 pitfall ”framför allt” (”Framför allt var det dit kalken gick”);
    - b19-001 q1 D why_tempting ”ibland”, which opens option D (”Ibland kunde malmen …”);
    - b19-001 q3 step 3 ”tyngdpunkten i arbetet låg inte vid ugnen utan i smedjan efteråt, i räckningen”.
- **The same audit, otherwise:**
  - every "(steg N)" points inside its entry, and never at its own step;
  - every solution_path and last step ends "Svaret är <key>.", and no other verdict appears;
  - every entry quotes its passage verbatim (15+ characters) in solution_path or steps, X1's content rule;
  - no han, hon, hans, hennes, honom, henne or hen outside a quotation;
  - every entry passes X1's Swedish-word ratio;
  - 3–6 steps, the first and last `essential`;
  - all framework ids are LÄS entries.
- **Partition:** `explanation_batches.py --check` → current: 8 batches, 118 units / 332 questions; x3 present.
- **Across batches (nothing written):** `--assemble evidence-x3 --partial` → `partial: 139 explanations from x0-pilot, x1, x2, x3 pass every gate; missing: x4, x5, x6, x7. Nothing written: a partial set is not a release`; `data/explanations/` holds no `p5-evidence-x3.json`.
- **Test suite:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1985 passed, 7 xfailed** (39 s), the bead's baseline exactly; no test was added.
- **Determinism:**
  - the canonical-bytes gate compares the file with `export_product.render_json` of its entries;
  - every batch check runs `export_bank`'s double build and compares the bytes;
  - two final runs of `--check-batch x3` gave identical output;
  - a fresh assembly of the draft chunks reproduces the file byte for byte (`--check` → current), and its sha256 did not change across reruns.
- **Changed files** (`git status`): `pipeline/synthetic/infold/explanations/x3-las.json` (new), `docs/worklog/hpf-c5tb.md` (modified). Nothing else.
- **sha256:**
  - `pipeline/synthetic/infold/explanations/x3-las.json` `37cdba02dcb4b358702a2321d77654a3481327d243c7566dfcf90bbb780d2c12`
  - unchanged:
    - `BATCHES.json` `fd38ed33…`
    - `explanation_batches.py` `34789ae1…`
    - `export_product.py` `f627c815…`
    - `x1-las.json` `6c72164b…`
    - `x2-las.json` `9071320a…`
    - `data/explanations/p5-pilot.json` `fd96f43f…`
    - `tests/test_infold_explanation_batches.py` `7c9f68cd…`
    - `approval-roster.json` `9babcc8a…`
    - `RETIRED.json` `fd3ab882…`
    - `frameworks/las_taxonomy.json` `2096323e…`

### Handoff

- **Ready for review:**
  - an independent correctness and language review of X3 (hpf-c5tb's plan: Codex);
  - then the owner's look at content concerns 1–8.

  Committing, pushing and opening the PR are outside this lane.
- **For X4–X7 (ELF):**
  - dropped limits were again the largest error class in both rounds, so check every hedge in every field, not only in the quoted step: "tycks", "ofta", "inte sällan", "drygt", "kunde", and qualifiers like "på de prov som gjordes …";
  - check every sentence that says how a paragraph or the text ends (two were false);
  - a fix can bring in a new att-clause or ingen-rule fault, so rerun the sweep after each round;
  - the verbatim test skips ELF; X1's note on an ELF form of the rule stands.
- **Not claimed:**
  - release readiness: no release shard was written, and nothing was synced or deployed;
  - semantic certification beyond the reviews recorded here (lint is necessary, not sufficient);
  - X4–X7.

### Bead note

P5 PR2b X3 implemented, uncommitted on 9ab23a6: pipeline/synthetic/infold/explanations/x3-las.json, 42 reviewed LÄS entries for las-b14-003…las-b19-003 (15 units). All keys hold for this lane and six second readers. Framework ids: TYPE-001 27, -002 5, -003 9, -004 1. Two reader rounds (round 1: 18 errors and 44 minor; round 2: 11), the att-clause/ingen-rule and begin/end sweeps, and a stance self-check of every step and why_wrong; all applied. 19 content concerns logged, 8 low, none needing a passage change. check-batch x3 clean (984 strings); lint default/strict clean; verbatim test passes (224 quotations); pilot+X1–X3 partial passes (139); 1985 passed, 7 xfailed; reruns byte-identical. Evidence: docs/worklog/hpf-c5tb.md, Batch X3.
LANE DONE: hpf-c5tb.7

### Progress

- 2026-10-08 [S:ci-uypph|W:hpf-c5tb.7|H:research|E:9ab23a6] Read the design (§C/§D, Amendment 1), LAYER2-RENDERING.md, the app's explanation type, the schema, the exporter's gates, the X2 entries, this worklog, BATCHES.json and the LÄS catalog. Read and re-solved all 15 units, 42 questions, from the student text: all keys hold.
- 2026-10-08 [S:ci-uypph|W:hpf-c5tb.7|H:author|E:pipeline/synthetic/infold/explanations/x3-las.json] Wrote the 42 entries in five scratchpad chunks and assembled them in canonical form. `--check-batch x3` passed on the first run (984 strings); lint clean; the audit and the att-clause sweep found three drafting slips and two ingen-rule cases, all fixed; 1985 passed, 7 xfailed.
- 2026-10-08 [S:ci-uypph|W:hpf-c5tb.7|H:review|E:pipeline/synthetic/infold/explanations/x3-las.json] Second-reader round 1 (three readers): all keys hold; 18 errors and 44 minor, all checked against the passages and applied. Stance self-check of the revised file: nothing new. Round 2 (three fresh readers): 11 findings, applied, plus two points reader A had not counted and one att-clause case a fix had introduced. Final checks green; reruns byte-identical.

## Batch X4

Bead `hpf-c5tb.8`: the 52 ELF explanations of X4 (`elf-b1-001` … `elf-b5-002`, 16 units), as pinned in `BATCHES.json`, and an ELF form of the verbatim-quotation test. This is the first English batch.

### Snapshot and boundaries

- Claimed with `gc hook --claim --json` (`hpf-c5tb.8`, assignee `gc__implementation-worker-ci-0mh7o`, route `hpfetcher/gc.implementation-worker`); `bd show hpf-c5tb.8 --json` matched the id, status `in_progress`, the assignee and `gc.routed_to`.
- `git rev-parse HEAD` and `git rev-parse origin/main` → `c96a685f4a88df17466cc9836b81aa51ef088d2d` for both (detached), the bead's snapshot. origin/main is the local ref, not fetched. No tracked change at start.
- No git writes and no network; every change is uncommitted. No tooling, partition, unit, candidate, roster or framework file was edited: their sha256 (below) equal the values the earlier sections record. Nothing under `app/` or `worker/`. The untracked runtime, skill and sandbox paths present at start are untouched.
- The bead names no validator, so none was run; `gc.check_path` is the post-close dispatcher check (`…/checks/build-artifact-valid.sh`).
- Lane policy: `git -C <path>` was refused, so plain `git` ran in the worktree. The printing, drafting, assembly, audit, statistics and mutation scripts ran from the session scratchpad (`python3 <file>`) and are not checked in.
- Baseline: **1985 passed, 7 xfailed** (40.5 s).

### Deliverables (uncommitted)

| Path | Change |
|---|---|
| `pipeline/synthetic/infold/explanations/x4-elf.json` | New: the 52 X4 entries, bank order, canonical bytes |
| `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` | The ELF quotation rule: helpers and 3 new tests; in the LÄS test, the comment only |
| `docs/worklog/hpf-c5tb.md` | Status line and this section |

### The ELF quotation rule

The LÄS test (`test_every_las_quotation_is_verbatim_from_its_unit`) skipped ELF because the pilot's cloze entries quote language that is not in the text by design (X1 review fix, "Pilot, read only"). The new rule reads every ELF entry of every batch file present, the pilot's included. The LÄS test keeps its code byte for byte: `QUOTED`, `_plain`, `SENTENCE`, `_in_order` and `_verbatim` are unchanged, and only its comment now points to the ELF rule.

**The rule.** Every quotation in a learner field (solution_path, step titles and texts, why_tempting, why_wrong, technique, pitfall) must be the unit's own text under the LÄS rule (title, passage, every prompt and option; first-letter case may change; "…" marks left-out words within one sentence), with the apostrophes as the text spells them. Two allowances fit how English is quoted:
- `___` stands for a gap marker `___(n)___`, and gap n may be shown filled with one of question n's options, the frame as a learner reads it (“the moral high floor”);
- a full stop may close a quoted sentence that the source continues (the pilot's “…within a hand’s width of the stone.”, which the X1 review fix noted). No other final punctuation is allowed.

In a gap question's entry (prompt `Gap (n)`, the exporter's `GAP_PROMPT`), a quotation that is not the unit's text is a language example: a fixed expression, a wrong collocation or a false friend (“take its toll on”, “eventuellt”). Such an example cannot be checked against the text, so it may share no run of four words with any form of the unit's text. A misquoted frame (“quietly takes its ___ on the mood”) or a frame filled with a word that is not one of the gap's options (“takes its cost on the general mood”) is still flagged. Reading entries get no such allowance.

The rule also reads ‘…’ wherever it quotes: a ’ between two letters is an apostrophe and never closes a quotation. An unpaired “ or ”, an unclosed ‘ and any straight `"` are flagged, since a quotation in straight quotation marks would go unread. The known limit: a language example is not checked for being correct English. The rule only makes sure it is not a misquoted passage sentence. The readers (below) checked usage claims by hand.

**Tests** (3 new; deterministic; they read only committed files):
- `test_every_elf_quotation_is_its_units_text_or_a_language_example`: the rule over every ELF entry of every batch file present. Today that is the pilot (169 quotations) and X4 (670).
- `test_an_elf_quotation_may_show_a_gap_or_an_option_in_it_and_close_on_a_full_stop`: pins the rule on a one-gap text, with five accepted and ten flagged quotations.
- `test_a_non_verbatim_quotation_in_an_elf_pilot_entry_is_flagged`: two real pilot entries pass as they are. Three edits of them are each flagged: B1's form, a word left out (“there was nothing alive”); a word changed (“we believe”); and a misquoted gap frame.

**Red first.** The tests were written with a stub `_elf_quotation_problems` that returns `(0, [])`, which is the behaviour before the extension: no ELF quotation is read. With `-k "elf_quotation or elf_pilot_entry or verbatim"` the result was **3 failed, 1 passed** (the LÄS test):
- `assert 0 > 100`;
- the pin test's `AssertionError: “take its toll on”` (not flagged in a reading entry);
- `('p5-elf-b18-001-r1-ELF-001', '“there was nothing alive”', [])`, a non-verbatim ELF quotation not flagged.

With the rule in place, 4 passed. The first green version unified ’ and ' when comparing. The pilot passes without that allowance too (a scratchpad run over its 169 quotations), so the rule was tightened to the text's own apostrophe, and the pin test now flags “the cook's tone is light” against a text that has ’. On the final tree, mutant M1 below is the stub, and it gives the same 3 failures.

**Mutation check.** Each mutant was applied to a scratchpad copy of the test module, with a scratch conftest pointing at the real infold directory. The four quotation tests were run against the copy. The repo's test module was only read: its sha256 was `77563a40…` before and after. The final run was on the final tree.

| Mutant | Failing tests (of 4) |
|---|---:|
| M0 control (unmutated copy) | 0 |
| M1 no ELF quotation read (the behaviour before the extension) | 3 |
| M2 no gap filled with an option | 3 |
| M3 no language-example allowance | 3 |
| M4 language examples allowed in every entry | 2 |
| M5 language examples without the four-word-run check | 2 |
| M6 no full-stop allowance | 3 |
| M7 any final punctuation may close a quotation | 1 |
| M8 unpaired marks not flagged | 1 |
| M9 straight quotation marks not flagged | 1 |
| M10 apostrophes unified when comparing | 1 |
| M11 gap markers not shown as `___` | 3 |
| M12 single-quoted quotations not read | 1 |
| M13 no question is a gap question | 2 |

**It caught one of this batch's own drafts:** the `elf-b4-003` technique quoted “what did the data suggest”, where the prompt says “what did Marris's data suggest”. The quotation now has the prompt's words.

**Counts.**
- Pilot ELF entries, 169 quotations: 88 exact, 23 first-letter case, 1 marked omission, 5 gaps shown as `___`, 13 gaps filled with an option, 1 closing full stop, 38 language examples. All 38 are in the cloze unit `elf-b18-002`.
- X4, 670 quotations: 470 exact, 97 first-letter case, 11 marked omissions, 15 gaps shown as `___`, 56 gaps filled with an option, 2 closing full stops, 19 language examples. All 19 are in gap entries.
- X4 has 670 “ and 670 ”, no ‘ and no straight `"`.

### X4 content

52 entries, one per qid of X4, in bank order and canonical bytes. The entries were drafted in four scratchpad chunks. An assembly script writes them in `BATCHES.json` order with `export_product.render_json`, and its `--check` confirms that the committed bytes are a fresh assembly.
- **Blind solve first.** A scratchpad printer shows only the student text: title, passage, prompts and options, with no key and no rationale. Every question was solved from it before the keys were read. 51 of 52 matched. The exception is `elf-b1-002` gap 4, where this lane chose D "squander" and the key is A "erode" (content concern 1).
- **Source only.** The rationales served as source notes. Every claim taken from them was checked against the passage, and three did not hold (below).
- **Structure.** The pilot's form:
  - reading entries have 5–6 steps: understand the question, map or find the passage sentence (quoted verbatim), the paraphrase, inference or limit, test the options, conclusion;
  - cloze entries have 4 steps: read the frame, the clue or fixed phrase, check the other options (`detail`), conclusion;
  - steps 1 and last are `essential`;
  - solution_path and the last step end "The answer is X.";
  - each wrong option appears once, with its own why_tempting and why_wrong; then technique and pitfall.
- **English.** Plain English in short sentences, never Swedish, as in the pilot's ELF entries.
  - The explanations' own prose uses British spelling (colour, criticise, practised). Quotations keep the passage's spelling and characters: straight apostrophes, em dashes, AmE forms. "percent" follows the passages and the options.
  - Hard words that a key depends on are glossed in one clause, for example derision, reticent, precarious, underwrite, conjure, convalescent, predecessors, flush up, fix the position, false economy, qualified, backfires, bargain (a deal, not a cheap buy), defensible and tracked (in the statistical sense).
- **Persons.** Persons are named by name or role, and the writer is "the writer". No he, she, him, her, his, hers, himself or herself appears outside a quotation (audit).

| Unit | Shape | qids | framework_id per question |
|---|---|---|---|
| `elf-b1-001` | long passage | `p5-elf-b1-001-r1-ELF-001` … `-005` | ELF-TYPE-004, 001, 001, 002, 005 |
| `elf-b1-002` | cloze, 5 gaps | `p5-elf-b1-002-r1-ELF-001` … `-005` | none |
| `elf-b1-003` | short text | `p5-elf-b1-003-r1-ELF-001` | ELF-TYPE-001 |
| `elf-b1-004` | short text | `p5-elf-b1-004-r1-ELF-001` | ELF-TYPE-002 |
| `elf-b2-001` | long passage | `p5-elf-b2-001-r1-ELF-001` … `-005` | ELF-TYPE-004, 001, 001, 002, 005 |
| `elf-b2-002` | cloze, 5 gaps | `p5-elf-b2-002-r1-ELF-001` … `-005` | none |
| `elf-b2-003` | short text | `p5-elf-b2-003-r1-ELF-001` | ELF-TYPE-001 |
| `elf-b2-004` | short text | `p5-elf-b2-004-r1-ELF-001` | ELF-TYPE-002 |
| `elf-b3-002` | cloze, 5 gaps | `p5-elf-b3-002-r1-ELF-001` … `-005` | none |
| `elf-b3-003` | short text | `p5-elf-b3-003-r1-ELF-001` | ELF-TYPE-001 |
| `elf-b3-004` | short text | `p5-elf-b3-004-r1-ELF-001` | ELF-TYPE-002 |
| `elf-b4-001` | long passage | `p5-elf-b4-001-r1-ELF-001` … `-005` | ELF-TYPE-004, 001, 001, 002, 005 |
| `elf-b4-002` | cloze, 5 gaps | `p5-elf-b4-002-r1-ELF-001` … `-005` | none |
| `elf-b4-003` | short text | `p5-elf-b4-003-r1-ELF-001` | ELF-TYPE-001 |
| `elf-b5-001` | long passage | `p5-elf-b5-001-r1-ELF-001` … `-005` | ELF-TYPE-004, 001, 001, 002, 005 |
| `elf-b5-002` | long passage | `p5-elf-b5-002-r1-ELF-001` … `-005` | ELF-TYPE-004, 001, 001, 002, 005 |

32 reading questions carry a framework_id. Each was checked against `frameworks/elf_taxonomy.json` by the question's verb, the catalog's own recognition rule:
- **ELF-TYPE-004 (5):** "What is this text mainly about?"
- **ELF-TYPE-001 (14):** "What are we told about …" (2), "According to the text, …" (9) and "What does the text say about / was …" (3). `elf-b4-003` asks "According to the text, what did Marris's data suggest …": the suggestion is the data's, reported by the text, so it is direct detail.
- **ELF-TYPE-002 (8):** "suggest" (4) and "imply" (4). Two of them ask "suggest … why" (`elf-b1-004`, `elf-b2-004`). They stay inference, not TYPE-006: the catalog's TYPE-006 is for a cause the text names, and in both these texts the cause is left unstated.
- **ELF-TYPE-005 (5):** "What is the writer's attitude toward(s) …"

The 20 gap questions carry no framework_id, as in the pilot: no Layer-1 entry covers choosing a missing word (`docs/worklog/hpf-no7l.md`), and `ELF-CLOZE-001` is a generation family. No generation family is used as a framework id.

### Self-check for invented stances

The bead asks for a self-check of every `why_wrong` and step for invented writer stances. This lane ran it after drafting, against the passages, and again on every field the review rounds changed. The first pass changed 15 fields before any reader saw the file:
- one voice error: `elf-b4-002` gap 4 D gave the columnist's sentence “the boom is easy to overstate” to Almén;
- stances that the passages do not state:
  - "Pellerham’s opinion" for D's claim (`elf-b1-001` q1);
  - "believes" for Pellerham's "hunch", and "“sure” is the opposite of the writer’s position" (q5);
  - "quotes it in order to answer it" (`elf-b2-001` q1);
  - a causal "so" that turned the writer's "looked like a relic" into the operators' reason (`elf-b3-002` gap 1);
  - "took its visitors away" for "could carry … onward", in two fields (`elf-b3-004`);
  - "Teale’s finding" for what the passage calls her argument, in three fields (`elf-b5-002` q1);
  - "the text never tells recycling schemes what to do", which is false, since Feld does (`elf-b5-001` q1);
  - "criticise the push for more cullet" (q5);
  - "could learn a great deal" (`elf-b5-002` q3);
  - "the platforms rest on" for "most of their turnover" (`elf-b4-002` gap 4).

The round-1 readers, who read the first version, independently flagged 11 of these 15 fields as well.

### Second-reader review (round 1)

Four independent, read-only second readers (general-purpose subagents of this session) split the 16 units:
- R1: `elf-b1-001`, `-b1-002`, `-b1-003`, `-b1-004`, `-b2-003` (13 questions);
- R2: `elf-b2-001`, `-b2-002`, `-b2-004`, `-b3-003`, `-b3-004` (13);
- R3: `elf-b3-002`, `-b4-001`, `-b4-002` (15);
- R4: `elf-b4-003`, `-b5-001`, `-b5-002` (11).

Each first solved every question from the student-text printer, then read the keys and the rationales (as unverified notes), then the entries. They checked the error classes of X1–X3 first: arguments that do not exclude the option as worded, and invented stances. They also checked hedges, verbatim and fair quotation, step and paragraph references, contradictions between fields, rules that rule out the key, English usage claims, glosses, framework fit and pronouns.

**Keys.** All 52 keys hold for every reader except `elf-b1-002` gap 4, where R1 also chose D (content concern 1).

**Findings.** 110 in all (R1 25, R2 27, R3 35, R4 23): 35 errors and 75 minor. Each was checked against the passage before it was applied, and all were accepted but one: "per cent" was declined, and "percent" stays as the passages and options spell it.
- **Errors by class (35):**
  - Dropped hedges and limits, or claims stronger than the passage (17):
    - "Most" (`elf-b1-001` q2) and "most landlords" (`elf-b1-002` gap 1);
    - "the opposite" for "Margins are narrow" (gap 2);
    - "for a darkened lantern" (`elf-b1-004`);
    - "for now" (`elf-b2-001` q5);
    - "the grander guests" (`elf-b3-004`);
    - "seemed", "almost all" and "three of the new lines" (`elf-b3-002`);
    - "can return more … than one bought new and soon binned", "most of their turnover" and "official statistics" (`elf-b4-002`);
    - "her data suggested" (`elf-b4-003`);
    - the sixty-percent threshold and "past that point" (`elf-b5-001`);
    - "learn a great deal" (`elf-b5-002`).
  - False or unsupported statements (6):
    - "unsold games" (`elf-b1-002` gap 4);
    - two parallel conditions read as cause and effect (`elf-b2-002` gap 2);
    - "the fair’s money" (`elf-b2-004`);
    - "the cheerful start of the text", where the text opens on a relic (`elf-b3-002` gap 4);
    - Feld's advice denied, and "the saving is real only while the glass is clean" (`elf-b5-001`).
  - Voice and invented stances (5):
    - Pellerham's "certainty" for a hunch (`elf-b1-001` q5);
    - a technique that put the turn into the writer's voice in the wrong place (`elf-b2-001` q5);
    - an invented motive, "did not take the sleeper train seriously" (`elf-b3-002` gap 1);
    - the Almén sentence above;
    - the bias sentence given to Teale where it is the writer's (`elf-b5-002` q3).
  - Arguments that did not exclude their option (3):
    - squander (`elf-b1-002` gap 4);
    - "the income was not steady", which the text never says (`elf-b1-004` C);
    - "built from Baltic oak" against a Gotland chronology, though Gotland lies in the Baltic (`elf-b4-001` q2 C).
  - Wrong step references (3): `elf-b1-002` gap 3 B, `elf-b2-001` q1 D, `elf-b4-001` q2 D.
  - Fields that contradicted each other (1): `elf-b4-001` q5 said "qualifies" in one field and "rejects" in another.
- **Minor, by kind:**
  - glosses the key depends on (concession, flush up, earn their keep, stirring pitch, reticent, qualified, backfires, false economy, on the face of it);
  - overstated usage claims ("the usual phrase", "the natural phrase", "not an English expression", "equally formal", "never a person’s attitude");
  - definitions of "imply" and "suggest" that leaned on one text's content;
  - option wording misdescribed;
  - idiom ("lose their good look", "beside" for "alongside").
- **Added content:**
  - a split step in `elf-b2-001` q4, which now links occasional fog to "thick and dependable" and "water, arriving often enough to matter";
  - in `elf-b4-001` q2, the master chronology sentence, so that C is ruled out by what the text says about Gotland.

**Rationale claims that did not hold:**
- `elf-b1-004`: "the income was not in fact steady", which became an error;
- `elf-b1-002` gap 4: "squander takes money/chances/opportunities, not 'margins'", which is overstated;
- `elf-b4-001` q4: a "four-year record" the passage never gives, echoed as "a few years".

### Second-reader review (round 2)

Four fresh read-only readers (new subagents, same split) re-read the revised file. Each solved blind again and reported only errors and clear language faults. All keys hold except `elf-b1-002` gap 4, where R1 again chose D. There were 15 findings (R1 2, R2 5, R3 5, R4 3): 11 errors and 4 language faults, all checked against the passages and applied.
- **Arguments that did not exclude their option (4):**
  - `elf-b1-002` gap 4 D: "squander a margin" is normal English when the margin is a lead. The why_wrong now gives the honest best case for the key: D is the closest wrong option, and with profit margins the usual verb is "erode".
  - `elf-b2-004` step 5 used "no cancellation is recorded" against C, but C predicts exactly that. Step 5 and C now rest on the fact that the text mentions no order.
  - `elf-b3-004` A is true. Its why_wrong and pitfall now say so plainly: A is true, and D is the point the text builds towards (content concern 2).
  - `elf-b4-001` q3 D: being "on their way to a display case" does not show public view. D is now excluded because it treats the two sets as alike and calls the raised ones hidden.
- **Dropped hedges and limits (5):** "seemed to help" and "thick and dependable" (`elf-b2-001`), "on a good night" (`elf-b3-002` gap 3), "at the temperature glass does" (`elf-b5-001` q3), "about 1650" (`elf-b5-002` q2).
- **Voice (1):** "consistent, not settled" is Renlund's verdict, not the text's (`elf-b4-001` q2).
- **False statement (1):** `elf-b2-002` gap 5 C misstated the paragraph's open question.
- **Language (4):**
  - "the owls follow", which could be read as option D (`elf-b1-003` technique);
  - "bargain" and "defensible" glossed (`elf-b4-001` q5);
  - a frame quotation that had dropped its object (`elf-b3-002` gap 2);
  - "tracked" glossed (`elf-b4-003`).
- **Added:** in `elf-b1-001` q2, a note that key A leaves out "Most" but, unlike B, adds no "every".

**Sweeps** after each round:
- the scratchpad audit, below;
- all 47 fields that contain "never", each read against its passage: all true;
- the overclaim words "the usual", "the natural", "exactly", "the only", "always" and "not an English", each read in context.

### Content concerns

The keys stand, and nothing below was papered over. Each explanation states the best case for the keyed answer and, where a learner could stumble, says why. Any option, stem or passage change would need a new revision (r2), a re-gate and a ruling, which is outside this bead.

Worth an owner decision:
1. **`elf-b1-002` gap 4, key A "erode": every independent solver of this unit chose D "squander".** That is this lane blind, R1 in round 1 and a fresh R1 in round 2.
   - "Overnight" clashes with the core sense of "erode", which is slow wear.
   - "Squander" fits "overnight" and a careless subject ("a café that misjudges its stock").
   - "Squander a margin" is normal English when a margin is a lead.
   - The key rests only on "erode" being the usual verb for profit margins.

   Suggested fix: replace "overnight" with a gradual signal (for example "season by season"), or replace D with a verb that cannot take "margins".
2. **`elf-b3-004`, option A is true and arguably implied.** 1849 is stated, and "several years after the … hotels" follows from 1841 and "three hotels went up in as many years". D wins as the text's point ("The spring had not changed; the map around it had."). Suggested replacement from R2: "It reached the town in 1841, the same year Frane's pamphlet brought the first visitors."
3. **`elf-b5-002` q4, option A is true:** almost word for word one half of Teale's distinction (“The shared book did not make any single voyage more accurate”). D wins only by covering both halves. Suggested replacement from R4: "That the shared book did make each voyage more accurate, only more slowly", or a reworded stem.
4. **`elf-b4-001`, passage timeline.**
   - The wreck "was mapped in detail two winters ago", and the raise-or-leave trial came after that.
   - Yet the trial has frames "soaked for years", "For the first few years", "Then the longer record came in" and "Season after season". Q3's stem relies on "the first few years".
   - No key changes. Suggested fix: change "two winters ago", for example to "some fifteen years ago".

Low (an attentive learner may notice; the key holds):

5. `elf-b4-001` q1, key C, "only a raised wreck can be studied", goes further than the text, which shows study in place ("Some answers came without disturbing the wreck at all"). Step 5 says so; the passage's own limit is "no student will ever measure by hand".
6. `elf-b4-001` q3, option D, is not clearly false: no set was on public view in those years. Key B's "showed nothing anyone could observe" is broader than "doing nothing anyone could photograph", since instruments logged the frames.
7. `elf-b5-001` q4, option D, is literally true (colour-sorted against unsorted). Only "by color" makes it the wrong mechanism.
8. `elf-b4-001` q5, option D, is half-true: the writer leaves the raise-or-leave choice open ("depends on what the wreck is wanted for"). D fails on "declines to judge … at all".
9. `elf-b1-003`: the delay used "dimmed artificial light", which could act on the owls directly. The text names the bats as the cause, so the key holds.
10. `elf-b2-002` gap 4: "reticent" fits only in its sense "reserved, holding back", since Aldous "is the first to say so". "That restraint is worth heeding" secures it.
11. `elf-b2-001` q4: the stem says "occasional" fog, but the trial's fog-poor case is thin fog. The key holds through "thick and dependable".
12. `elf-b2-002` gap 2: "wither" is used for economic decline, so the rationale's "not idiomatic" is too absolute. "Slump" is clearly best "within a single quarter".
13. `elf-b1-002` gap 3: "proved superior to" is a common phrase, so B is ruled out by meaning, not grammar. The explanation does that.
14. `elf-b5-001` q5: all four options call the writer "she", while the passage's only "she" is Brandt. The key is unaffected.
15. `elf-b3-002` and `elf-b4-002` share one template: a revival, a contrast connective, an economist who has "audited" the lines or platforms, grant dependence, and gap 4 in the same frame ("a good deal more ___ than the cheering headlines suggest / the applause admits"). Doing one unit cues the other.

Minor (harmless):

16. `elf-b1-001` q2, key A, drops "Most"; the explanation notes it.
17. `elf-b1-001` q4, option D (a test-retest effect), fits the data, but the text never raises it.
18. `elf-b2-004`: the money half of D is weaker than the meadow half.
19. `elf-b4-001` q2, key A, states "pointed to" as fact.
20. `elf-b5-001` q5: key B's "backfires" is a little stronger than "handed back much of the fuel".
21. `elf-b5-002` q1: option C's "far more consistent than the hand-copied sheets" overstates the passage.
22. `elf-b4-002` gap 4: "mercantile" has a faint coherent reading ("more commercial").

### Verification (final tree)

- **Batch check:** `python3 pipeline/synthetic/infold/explanation_batches.py --check-batch x4` → `batch x4: 16 units / 52 questions in pipeline/synthetic/infold/explanations/x4-elf.json; every explanation gate passed, learner lint clean (1150 strings)`.
  - The gates: shard file, coverage (exactly X4's 52 qids), schema, distractor letters, framework ids, internal labels, rationale text, learner lint and canonical bytes.
  - The check is fail-closed, so passing means zero findings. It passed on the first draft and after each round.
- **Learner-output lint on X4:** `lint_learner_output.py pipeline/synthetic/infold/explanations/x4-elf.json` → `clean — 1 file(s)`, 0 findings; `--strict` also clean.
- **Quotations:** the extended test passes for X4 and the ELF pilot. `-k "verbatim or elf_quotation or elf_pilot_entry"` → 4 passed (the LÄS test and the 3 ELF tests). Counts are above.
- **The scratchpad audit, otherwise:**
  - every solution_path and last step ends "The answer is <key>.", and no other verdict appears;
  - 3–6 steps, the first and last `essential`; distractor letters are exactly the wrong options;
  - every "(step N)" lies inside its entry and never points at its own step;
  - every entry quotes its passage verbatim (15+ characters) in solution_path or steps;
  - no gendered pronoun outside a quotation, no straight quotation mark, no doubled space;
  - English-word ratio holds for every entry;
  - framework ids are ELF entries on the 32 reading questions and absent on the 20 gap questions;
  - no internal id or label, no rationale sentence, no lint finding.
- **Partition:** `explanation_batches.py --check` → current: 8 batches, 118 units / 332 questions; x4 present.
- **Across batches (nothing written):** `--assemble evidence-x4 --partial` → `partial: 191 explanations from x0-pilot, x1, x2, x3, x4 pass every gate; missing: x5, x6, x7. Nothing written: a partial set is not a release`. `data/explanations/` holds no `p5-evidence-x4.json`.
- **Test suite:** `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests pipeline/synthetic/infold/tests -q -p no:cacheprovider` → **1988 passed, 7 xfailed** (44.0 s). That is the baseline 1985 plus the 3 new tests.
- **Determinism:**
  - the canonical-bytes gate compares the file with `export_product.render_json` of its entries;
  - every batch check runs `export_bank`'s double build and compares the bytes;
  - two final runs of `--check-batch x4` gave identical output;
  - a fresh assembly of the chunks reproduces the file byte for byte (`--check` → current), and its sha256 did not change across reruns.
- **Changed files** (`git status`): `pipeline/synthetic/infold/explanations/x4-elf.json` (new), `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` and this worklog (modified). Nothing else.
- **sha256:**
  - `pipeline/synthetic/infold/explanations/x4-elf.json` `578e527cc9c86a8deecc1524124105e9d1a71e8db984fe3b29c242460efb7255`
  - `pipeline/synthetic/infold/tests/test_infold_explanation_batches.py` `77563a40aae1645edc99aba3f39c04b1496233767e9da73d7e378817aabe1292` (HEAD `7c9f68cd…`)
  - unchanged:
    - `BATCHES.json` `fd38ed33…`
    - `explanation_batches.py` `34789ae1…`
    - `export_product.py` `f627c815…`
    - `x1-las.json` `6c72164b…`
    - `x2-las.json` `9071320a…`
    - `x3-las.json` `37cdba02…`
    - `data/explanations/p5-pilot.json` `fd96f43f…`
    - `approval-roster.json` `9babcc8a…`
    - `RETIRED.json` `fd3ab882…`
    - `frameworks/elf_taxonomy.json` `84ab6524…`

### Handoff

- **Ready for review:**
  - an independent correctness and language review of X4 and of the test extension (hpf-c5tb's plan: Codex);
  - then the owner's look at content concerns 1–4.

  Committing, pushing and opening the PR are outside this lane.
- **For X5–X7:**
  - Dropped hedges and limits were again the largest error class (17 of round 1's 35). Check "most", "seemed", "almost all", "for now", "on a good night" and "past that point" in every field, not only in the quoted step.
  - Keep each voice with its owner: a researcher's quoted verdict, the columnist's own sentences, a passage sentence that has no attribution.
  - In cloze entries, check every usage claim ("the usual …", "is not English"), and gloss hard words in the key or options (qualified, bargain, tracked).
  - The ELF quotation test now reads every ELF batch file. Quote the passage byte for byte, its straight apostrophes included. Outside gap questions, every quotation must be the unit's text.
- **Not claimed:**
  - release readiness: no release shard was written, and nothing was synced or deployed;
  - semantic certification beyond the reviews recorded here (lint is necessary, not sufficient);
  - X5–X7.

### Bead note

P5 PR2b X4 implemented, uncommitted on c96a685: pipeline/synthetic/infold/explanations/x4-elf.json, 52 reviewed ELF entries (English) for elf-b1-001…elf-b5-002 (16 units, 20 cloze gaps without framework_id; ELF-TYPE-001 14, -002 8, -004 5, -005 5); the verbatim test extended to ELF (gap frames, gaps filled with the gap’s options, a closing full stop, and language examples only in gap entries and sharing no four-word run with the text), red first (3 failed under the old behaviour), 3 new tests, 13 of 13 mutants caught, LÄS test code unchanged; a stance self-check (15 fields) and two rounds of four second readers (round 1: 35 errors and 75 minor; round 2: 15), all applied but one; all keys hold except elf-b1-002 gap 4, where every solver chose D (content concern 1 of 22, 4 for an owner decision); check-batch x4 clean (1150 strings); lint default/strict clean; 670 X4 quotations pass; pilot+X1–X4 partial passes (191); 1988 passed, 7 xfailed; reruns byte-identical. Evidence: docs/worklog/hpf-c5tb.md, Batch X4.
LANE DONE: hpf-c5tb.8

### Progress

- 2026-10-08 [S:ci-0mh7o|W:hpf-c5tb.8|H:research|E:c96a685] Read the design (§C/§D, Amendment 1), LAYER2-RENDERING.md, the app's explanation type, the schema, the exporter's gates, the pilot's ELF entries, the X1–X3 reviews in this worklog, BATCHES.json and the ELF catalog. Baseline 1985 passed, 7 xfailed. Solved all 52 questions blind from the student text: 51 match the keys; elf-b1-002 gap 4 does not.
- 2026-10-08 [S:ci-0mh7o|W:hpf-c5tb.8|H:red|E:pipeline/synthetic/infold/tests/test_infold_explanation_batches.py] Prototyped the ELF rule on the pilot's 169 quotations (0 failures), wrote the 3 tests with a stub of the old behaviour: 3 failed, 1 passed. Rule in place: 4 passed; tightened to the text's own apostrophes.
- 2026-10-09 [S:ci-0mh7o|W:hpf-c5tb.8|H:author|E:pipeline/synthetic/infold/explanations/x4-elf.json] Wrote the 52 entries in four scratchpad chunks; the audit and the new test caught one misquotation in the draft; `--check-batch x4` passed on the first run (1148 strings); 13 mutants caught; 1988 passed, 7 xfailed.
- 2026-10-09 [S:ci-0mh7o|W:hpf-c5tb.8|H:review|E:pipeline/synthetic/infold/explanations/x4-elf.json] Stance self-check (15 fields), round 1 with four readers (110 findings, 35 errors), round 2 with four fresh readers (15), each checked against the passages and applied; final checks green; reruns byte-identical.
