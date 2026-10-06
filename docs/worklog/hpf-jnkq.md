---
bead: "hpf-jnkq"
project: "hpfetcher"
session: "ci-dfiy6"
status: "implementation_complete_ci_blocked"
---

# Worklog — hpf-jnkq

## Findings

- Implementation authority: the operator's direct assignment and
  `/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/briefs/hpf-jnkq.md`.
  Detached starting HEAD verified as `e8f872cafa09485fd32edc47a9c99c1461c6749d`.
  The lane had no tracked changes; pre-existing runtime/skill files are untouched.
- After the corrected assignment, no Gas City commands, network calls, servers,
  git writes or commits were made. This lane file is the required handoff destination.
- Read both complete owner ledgers and STATUS records, the Layer-2 contract, the
  retirement manifest and the sheet-sync implementation. The rendering addenda in
  these exact bytes are dated **2026-09-01**, not September 2 as the brief calls them.
- Both batches ship from `candidates/`. Both have seven `stems/` sheets, no
  `candidates-final/`, no `blind/`, no `distractor/` and no `ASSEMBLY.md`.
  Historical STATUS claims about 21 sheets/tool absence do not describe this checkout.
- There is no separate name registry file in this tree. The shared inherited
  exclusion lists live in the two `BRIEF-ADDENDUM.md` copies; both receive the dated
  Vässlinge/Vässling- correction with the requirement to propagate it forward.
- The current default learner lint finds 37 findings in the 14 original units:
  batch18 18; batch19 19 (17 kept, 2 retired). The old 11-per-batch tallies predate
  the hardened vocabulary. All findings are in rationales; internal metadata is
  deliberately not an input to learner-output lint.

## Decisions

- Execute ruling 5 as seven GODKÄNN_NOTED approvals, with every ledger disposition
  explicitly recorded. Keep Stintbury and correct the false Saintbury clearance
  using the existing audit/owner evidence; no new name search is claimed.
- Execute ruling 6 as six GODKÄNN_NOTED approvals and retirement of elf-b19-004
  through the existing RETIRED.json convention. Preserve its candidate and all
  history byte-for-byte; a later infold must exclude it. No replacement is created.
- Rendered learner projection: `title`, `passage`, and each question's `q_index`,
  `prompt`, `options[].letter/text`, `key`, `rationale`. Question objects contain
  exactly these keys. Title, passage (including any inline glossary), question and
  answer/explanation text are all scanned. IDs, family, generator metadata and
  repair history are excluded as adjudication data, not hidden to suppress findings.
- Translate label meanings into native Swedish LÄS / English ELF explanations.
  Remove whole heuristic/design/gate sections, including unflagged internal prose;
  preserve the substance of each answer explanation and all internal taxonomy.
- Use fleet-repair-7 in batch18 and fleet-repair-6 in batch19. For batch19 LÄS,
  append full edits to the existing top-level canonical repair log and a pointer
  in generator_meta.repair_log. Other units use generator_meta.repair_log directly.
- Apply the exact optional trade-term fix specified by the package: `fillet` to
  `flaunching`, `Behind` to `Under`, and no other passage changes. The two rural
  fire-craft passages/themes remain unchanged; their standing separation rule is
  recorded in both briefs, ledgers and status addenda.
- All ADJUDICATION, STATUS and brief changes are appended, including intact first
  headings. Flags and existing verdict/review journals remain unchanged. New mech
  evidence is in separate dated files. Import belongs to a later infold PR.

## Progress

- [S:ci-dfiy6|W:hpf-jnkq|H:implementation|E:13 candidate repair tickets]
  Changed 33 rationale strings (17 batch18 + 16 batch19), one originality note,
  and the two authorised passage words. All 39 kept question keys, prompts,
  options and all 13 titles are unchanged.
- [S:ci-dfiy6|W:hpf-jnkq|H:records|E:dated owner addenda + RETIRED.json]
  Recorded every ledger item and approval, the retirement, Vässlinge registry fix,
  kiln/fire-craft ban, pairwise assembly exclusion, Margit~Marit standing rule,
  and the remaining next-brief carry-forwards. No later brief is claimed edited.
- [S:ci-dfiy6|W:hpf-jnkq|H:verification|E:78 mechanical passes; 14 synced stems]
  Default learner projection clean (13 units). All six mech gates pass on each
  changed unit; sheet-sync checks every existing sheet, including the retired
  candidate's unchanged historical stem sheet.

## Verification — 2026-10-06

Temporary evidence root: `/tmp/hpf-jnkq-u5g8hw0c`.
All gate/test runs use `PYTHONDONTWRITEBYTECODE=1`.

| Check | Result |
|---|---|
| Learner lint, baseline all 14 | 37 findings; 35 in the 13 kept units |
| Learner lint, edited kept projection | Clean, 13 files, default mode |
| Batch18 mech | 42/42 pass; M-ECHO corpus 114 units |
| Batch19 kept mech | 36/36 pass; M-ECHO corpus 121 units (114 finals + 7 approved batch18 candidates) |
| Direct sheet-sync on batch roots | Exit 1: missing candidates-final in both; no candidate-dir override exists |
| Same gate on temporary shipping-directory views | Exit 0: 14 units in sync; --allow-missing-dirs reports the absent blind/distractor directories |
| Assembly gate | Not applicable: neither batch has ASSEMBLY.md; standing pair exclusion recorded for later assembly |
| Candidate/record integrity | All old ledger/brief bytes are prefixes; flags unchanged; all old repair entries and taxonomy unchanged; complete exact field diffs recorded; retired candidate byte-identical; 14 stems byte-identical |
| Initial required pytest selection | 187 failed, 1,291 passed, 7 xfailed in 23.38s; pre-existing missing lint vocabulary, detailed below |

The first mech invocation could not find lane `data/parsed` and exited 2 before
writing verdicts. The successful runs explicitly read the existing authentic
corpus at `/home/loucmane/dev/hpfetcher/data/parsed`; no corpus files were changed
and neither plagiarism nor echo checks were skipped.

```sh
PYTHONDONTWRITEBYTECODE=1 python3 pipeline/synthetic/gates/scripts/run_mech.py \
  pipeline/synthetic/batches/batch18/candidates/*.json \
  --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed \
  --p5-corpus-dir auto --out /tmp/hpf-jnkq-u5g8hw0c/mech18.jsonl
PYTHONDONTWRITEBYTECODE=1 python3 pipeline/synthetic/gates/scripts/run_mech.py \
  pipeline/synthetic/batches/batch19/candidates/{elf-b19-001,elf-b19-002,elf-b19-003,las-b19-001,las-b19-002,las-b19-003}.json \
  --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed \
  --p5-corpus-dir pipeline/synthetic/batches/batch*/candidates-final \
    pipeline/synthetic/batches/batch18/candidates \
  --out /tmp/hpf-jnkq-u5g8hw0c/mech19.jsonl
PYTHONDONTWRITEBYTECODE=1 python3 -m pytest .github/contract-tests \
  pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests \
  -q -p no:cacheprovider
```

The successful mech outputs are preserved verbatim as
`batch18/verdicts-mech-owner-2026-10-06.jsonl` and
`batch19/verdicts-mech-owner-2026-10-06.jsonl`. Existing fleet results were not
rewritten or merged with these new records.

Reproduce the learner projection and shipping-directory adapter without adding a
second shipping tree or weakening the gate. Set `source_version` to `HEAD` for
baseline inspection, or `working` for edited bytes. For the full historical
14-unit baseline, omit the retirement skip in the projection loop only.

```python
import json, os, subprocess, tempfile
from pathlib import Path

root = Path(tempfile.mkdtemp(prefix="hpf-jnkq-verify-"))
source_version = "working"
for batch in (18, 19):
    src = Path(f"pipeline/synthetic/batches/batch{batch}").resolve()
    view = root / "sheets" / f"batch{batch}"
    view.mkdir(parents=True)
    (view / "candidates-final").symlink_to(src / "candidates", target_is_directory=True)
    for sheet in ("blind", "stems", "distractor"):
        if (src / sheet).is_dir():
            (view / sheet).symlink_to(src / sheet, target_is_directory=True)
    projection = root / "learner" / f"batch{batch}"
    projection.mkdir(parents=True)
    for p in sorted((src / "candidates").glob("*.json")):
        if p.stem == "elf-b19-004":
            continue  # retired by owner ruling, never imported
        rel = p.relative_to(Path.cwd())
        raw = p.read_text() if source_version == "working" else subprocess.check_output(
            ["git", "show", f"{source_version}:{rel}"], text=True)
        d = json.loads(raw)
        assert set(d) <= {"candidate_id", "section", "family", "title", "passage",
                          "questions", "generator_meta", "repair_log"}
        assert all(set(q) == {"q_index", "prompt", "options", "key", "rationale"}
                   for q in d["questions"])
        assert all(set(o) == {"letter", "text"} for q in d["questions"] for o in q["options"])
        (projection / p.name).write_text(json.dumps(
            {k: d[k] for k in ("title", "passage", "questions")},
            ensure_ascii=False, indent=2) + "\n")
env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1"}
subprocess.run(["python3", "pipeline/synthetic/gates/scripts/lint_learner_output.py",
                str(root / "learner")], env=env, check=True)
subprocess.run(["python3", "pipeline/synthetic/gates/scripts/check_sheet_sync.py",
                str(root / "sheets/batch18"), str(root / "sheets/batch19"),
                "--allow-missing-dirs"], env=env, check=True)
```

The adapter changes no candidates or sheets: its candidates-final symlink points
to the actual candidate directory, and its stems symlink points to the actual
stems directory. The documented historical option skips only the absent blind
and distractor directories; it still validates every existing sheet and rejects
contamination, drift, missing unit sheets or orphans. No existing sheet contains
the edited rationale/originality fields; the only passage edit has no blind or
distractor copy in this checkout. Therefore no existing sheet needed rebuilding.

### elf-b19-003 answerability reread

Read the edited passage, prompt and all four options. A remains uniquely licensed
by “The pot that stands a course above its neighbours belongs to a flue that
smoked” and the following explanation about too little warm air for draught.
B assigns narrowing a rain/bird function the passage never gives; C contradicts
“Pattern tells you very little”; D introduces matching that the text never states.
Neither changed word affects the height/draught anchor. This is the implementer's
local G-KEY-style reread, not a newly dispatched independent blind leg or a new
formal gate verdict. The later exact-head review retains its independent role.

### Initial CI vocabulary blocker and proposed resolution

All 187 failing tests concern the same six labels absent from the lint vocabulary:
`misplaced_evidence_limit`, `omkastad_ordning`, `reversed_inversion`,
`reversed_order_timing`, `stem_entailment_audit`, `unsupported_condition`.
They occur in unchanged internal candidate label fields. Reading the candidates
with `git show HEAD:<path>` and applying the existing inventory parser confirms
all six existed at starting HEAD. That baseline also has three labels only in
rationales which this scrub removes (`genre_gesture`, `half_right`,
`refuted_hypothesis_as_finding`). No internal label was renamed to make tests pass.

A three-line addition to `_TAXONOMY_LABELS` is prepared at
`/tmp/hpf-jnkq-u5g8hw0c/proposed-vocabulary.patch`. Applying it requires explicit
scope extension because `pipeline/synthetic/gates/scripts/lint_learner_output.py`
is outside the brief's allowed paths. The operator has been asked; the source file
has not been changed while that decision is pending. Any later disposition and
fresh CI result will be appended below, without rewriting this initial result.

## Candidate and evidence digests

SHA-256 values bind the tested candidate bytes, including their appended repair
logs. The retired candidate digest is a preservation check, not a fresh mech run.

| Unit | Verification | SHA-256 |
|---|---|---|
| elf-b18-001 | 2 fields; six mech passes | `8f48116ded7f6add87d4573c9bebb6ff417838c6cc8a62b10a430553159ac53f` |
| elf-b18-002 | 5 fields; six mech passes | `5f59bd3ffc517cda548464ca960be980250f88e7589bdadf8dca77401c984307` |
| elf-b18-003 | 1 fields; six mech passes | `281d9d94949b89e614a5698735dd1e244e99e8368fee832abe14a1954b923ddd` |
| elf-b18-004 | 2 fields; six mech passes | `90fbc2c9960e74af037d9ce98e63ba60454fb4a9f96ed7d909a1795d5eddf0c9` |
| las-b18-001 | 4 fields; six mech passes | `f22081ea444c7e9637597f22604d8421d6087f56000e8e4cfdaf520fee2a8bdd` |
| las-b18-002 | 2 fields; six mech passes | `c164dfa1c7429f5201d29214db68c19a2b6bfe31abfb9b0872f9e98f4fbc629e` |
| las-b18-003 | 2 fields; six mech passes | `53e63a1eddeb6844a3de3011a114256f49c45500fee36b8e46e62c1fef3d9543` |
| elf-b19-001 | 2 fields; six mech passes | `6c7f71375437dea34616ccc8df947ffe9bfd01a4da440082c162e84e6340c07a` |
| elf-b19-002 | 5 fields; six mech passes | `e9dfbdc7b8de0cc46c54aef162e1ac0b813d2d9c7502fefee0c640ecf62f50ff` |
| elf-b19-003 | 2 fields; six mech passes | `9a4915384c431b813f7c7af1b04bf9ae11f7b9c86ad3b11e09e1faa0c0ce08ac` |
| elf-b19-004 | retired, byte-identical | `22b9be6672201be42548a60d85ec34810d8a58a13ef3f566bfc70e57d5d4f9d9` |
| las-b19-001 | 4 fields; six mech passes | `002ba587dd9c1e1c48a935fc88a2f58bab7db0fa6c3b2e280ca9abf150ecf0bd` |
| las-b19-002 | 2 fields; six mech passes | `eb2bae6edc771ecdaced5030f45bd2812bd727f5db33fe0a06f19ef368f63e70` |
| las-b19-003 | 2 fields; six mech passes | `5b9454e2176e9145877647babc9584b21b2a97873ba11648e0b58c951be22a97` |

Batch18 mechanical evidence SHA-256: `2cd7acce12b257c062ec2b53b2ca39f7a0e83082bf3c702ecb4247b754f2af49`.

Batch19 mechanical evidence SHA-256: `01ba23db1f422bc088bee2918b38f69a5e1b4b77dbc65d986b3a20e75278894e`.

## Per-unit before/after text — 2026-10-06

Every changed string field is recorded below in full, matching the repair ticket's
zero-based JSON paths. These are development evidence, including the old internal
labels; they are not learner-output lint inputs. Earlier repair logs retain their
original bytes and are not repeated here.

### elf-b18-001 — fleet-repair-7

Field: `questions[1].rationale`

Before:

```text
Key D paraphrases the stated common feature: bedded to an older specification, on coarse sand laid nearly twice as deep as the current rule allows. The stem now names the five streets without saying what happened on them (rule 12), so nothing on the sheet gives the group away. A fabricates a mechanical cause using passage furniture (the crates carry the traffic; nothing buckled – the roots rode over intact crates). B is an actor swap from the adjacent sentence, and it is hedged (‘seems to have’) so that the cautious form is not a key signature: the water main wrecked ONE other street, expressly separate from the five. C is the cautious-sounding wrong answer – it flatly contradicts ‘The five had one thing in common’; the hedged tone is bait for the pick-the-modest-option heuristic (rule 13: here the key is the confident specific claim).
```

After:

```text
Key D paraphrases the stated common feature: bedded to an older specification, on coarse sand laid nearly twice as deep as the current rule allows. A fabricates a mechanical cause using passage furniture (the crates carry the traffic; nothing buckled – the roots rode over intact crates). B assigns the event in the adjacent sentence to the wrong streets: the water main wrecked ONE other street, expressly separate from the five. C contradicts ‘The five had one thing in common’: the passage identifies a shared feature rather than leaving the comparison unresolved.
```

Field: `questions[4].rationale`

Before:

```text
Whole-text gist: the passage is a mechanism story (the slab builds its own lifting layer) plus a trial of a remedy built on that mechanism, with a mixed, still-open result. C names both halves without overclaiming. A promotes the vivid paragraph-1 claims detail to main topic – and distorts it slightly (‘rising’ is not stated). B is a rival umbrella of the same breadth, so the pick-the-widest-option heuristic cannot separate it from C: its first half is the passage’s own mechanism, but its second half is false – the ordinary remedies of paragraph 1 do keep failing, while the celled pavements have held for seven years on twenty-five streets, so ‘the remedies keep failing’ is not what the trial reports. D is a title-plausible theme the text never argues; nobody proposes replacing the trees.
```

After:

```text
Whole-text gist: the passage is a mechanism story (the slab builds its own lifting layer) plus a trial of a remedy built on that mechanism, with a mixed, still-open result. C names both halves without overclaiming. A promotes the vivid paragraph-1 claims detail to main topic – and distorts it slightly (‘rising’ is not stated). B also offers a broad summary: its first half is the passage’s own mechanism, but its second half is false – the ordinary remedies of paragraph 1 do keep failing, while the celled pavements have held for seven years on twenty-five streets, so ‘the remedies keep failing’ is not what the trial reports. D is a title-plausible theme the text never argues; nobody proposes replacing the trees.
```

### elf-b18-002 — fleet-repair-7

Field: `questions[0].rationale`

Before:

```text
Collocation gap. All four options are monosyllabic nouns from the vocabulary of payment and loss, so the set is POS-uniform and thematically level - nothing separates them on shape or register. The frame is 'it quietly takes its ___ on the general mood', and the fixed English idiom for slow cumulative damage is to take its toll on something. The sense is earned upstream: an unacknowledged contest running under the surface of the working day is exactly the kind of thing that wears a mood down by degrees. 'toll' locks. cost = collocation_misfit and the strongest lure, because it is the key's nearest synonym and 'count the cost' and 'at great cost' are both real; but English says 'takes its toll on', never 'takes its cost on'. price = collocation_misfit: 'pay the price' and 'exact a price' are real neighbours, yet 'takes its price on' has no reading. charge = collocation_misfit at a further remove: 'take charge' is real English but means assuming control, cannot take the possessive, and never governs an 'on'-phrase - 'takes its charge on the mood' is not English.
```

After:

```text
Collocation gap. All four options are monosyllabic nouns from the vocabulary of payment and loss, so the set is uniform in part of speech and thematically level - nothing separates them on shape or register. The frame is 'it quietly takes its ___ on the general mood', and the fixed English idiom for slow cumulative damage is to take its toll on something. The sense is earned upstream: an unacknowledged contest running under the surface of the working day is exactly the kind of thing that wears a mood down by degrees. 'toll' locks. 'cost' is tempting because it is the key's nearest synonym and 'count the cost' and 'at great cost' are both real; but English says 'takes its toll on', never 'takes its cost on'. 'price' also fails: 'pay the price' and 'exact a price' are real neighbours, yet 'takes its price on' has no reading. 'charge' is further removed from the required meaning: 'take charge' is real English but means assuming control, cannot take the possessive, and never governs an 'on'-phrase - 'takes its charge on the mood' is not English.
```

Field: `questions[1].rationale`

Before:

```text
Polarity gap. All four options are -ed adjectives of similar weight, fully suffix-rhymed, so form separates nothing. The frame is contrastive twice over: 'The tone is light, but nobody misreads it; beneath the sponge the message is ___'. The 'but' plus 'beneath' demand the opposite pole of 'light' - whatever the message really is, it is not what the cheerful surface performs - and English supplies the collocation for a barbed communication: a pointed message, a pointed reminder. The following clause ('aimed at certain chairs') confirms the notice has targets. 'pointed' locks. relaxed = polarity_mirror: it sits on the light, easy pole the frame has just ruled out; a skimmer who missed 'but nobody misreads it' finds it flattering. spirited = polarity_mirror plus collocation_misfit: 'a spirited defence' is real English, but spirited means lively and belongs with the breezy surface, precisely what the gap must contradict, and 'a spirited message' barely collocates. amused = polarity and sense misfit: it names the state of a mind, not of a text - a message cannot be amused - and its mild good humour also sits on the wrong pole.
```

After:

```text
Polarity gap. All four options are -ed adjectives of similar weight, fully suffix-rhymed, so form separates nothing. The frame is contrastive twice over: 'The tone is light, but nobody misreads it; beneath the sponge the message is ___'. The 'but' plus 'beneath' demand the opposite pole of 'light' - whatever the message really is, it is not what the cheerful surface performs - and English supplies the collocation for a barbed communication: a pointed message, a pointed reminder. The following clause ('aimed at certain chairs') confirms the notice has targets. 'pointed' locks. 'relaxed' has the wrong meaning here: it sits on the light, easy pole the frame has just ruled out; a skimmer who missed 'but nobody misreads it' finds it flattering. 'spirited' has the wrong meaning and does not fit the expression: 'a spirited defence' is real English, but spirited means lively and belongs with the breezy surface, precisely what the gap must contradict, and 'a spirited message' barely collocates. 'amused' also has the wrong meaning: it names the state of a mind, not of a text - a message cannot be amused - and its mild good humour also sits on the wrong pole.
```

Field: `questions[2].rationale`

Before:

```text
Collocation gap built on idiom assembly. All four options are monosyllabic concrete nouns for surfaces or terrain, POS-uniform and register-level. The frame is 'you cannot hold the moral high ___ and a dripping brush at the same time', and the fixed English idiom for the position of virtue in a dispute is the moral high ground, which one holds, takes or occupies. 'ground' locks. Each distractor is engineered to complete a DIFFERENT real idiom with one of the frame's other words while failing the whole noun phrase: floor = collocation_misfit via 'hold the floor' (real, parliamentary, means to keep speaking), but 'the moral high floor' is not assembled English; field = collocation_misfit via 'hold the field' (real, military), but 'the moral high field' does not exist; horse = collocation_misfit via the informally attested 'moral high horse', which fails on the verb frame - one gets on or off a high horse, one never holds it. The gap rewards parsing the full 'the moral high ___' unit rather than pairing the gap word with 'hold' alone.
```

After:

```text
Collocation gap built on idiom assembly. All four options are monosyllabic concrete nouns for surfaces or terrain, uniform in part of speech and register-level. The frame is 'you cannot hold the moral high ___ and a dripping brush at the same time', and the fixed English idiom for the position of virtue in a dispute is the moral high ground, which one holds, takes or occupies. 'ground' locks. Each wrong answer completes a different expression with one of the other words, but fails to complete the whole phrase: 'floor' may suggest 'hold the floor' (real, parliamentary, means to keep speaking), but 'the moral high floor' is not assembled English; 'field' may suggest 'hold the field' (real, military), but 'the moral high field' does not exist; 'horse' may suggest the informally attested 'moral high horse', which fails on the verb frame - one gets on or off a high horse, one never holds it. The gap rewards parsing the full 'the moral high ___' unit rather than pairing the gap word with 'hold' alone.
```

Field: `questions[3].rationale`

Before:

```text
Connective gap at ordinal 4. All four options are sentence-initial -ly adverbs of the same register: one temporal-culminative, one parallel-drawing, one epistemic, one evaluative. The upstream context is a completed escalation - the notice fails, the rota decays, complaint is self-defeating - compressed into 'So the kitchen waits.' The gapped sentence reports the endpoint of that waiting: somebody cracks. The connective that marks the terminal event of a drawn-out process is 'Eventually'. It locks - and for Swedish solvers it is also the classic false friend (eventuellt = 'possibly'), so the key rewards knowing that English 'eventually' is temporal, not modal. Similarly = wrong_logic: nothing parallel has been introduced for the cracking to resemble; the sentence is a culmination, not a comparison. Presumably = wrong_logic and the deliberate hedge trap: it frames the cracking as the writer's guess, but the writer immediately demonstrates detailed knowledge ('nearly always the same somebody'), so the epistemic hedge contradicts its own sentence - and for the hedge audit this puts the cautious-sounding option in the wrong column. Ironically = wrong_logic: someone finally yielding is exactly what the whole paragraph has led the reader to expect, and an expected outcome cannot be ironic.
```

After:

```text
Connective gap at ordinal 4. All four options are sentence-initial -ly adverbs of the same register: one temporal-culminative, one parallel-drawing, one epistemic, one evaluative. The upstream context is a completed escalation - the notice fails, the rota decays, complaint is self-defeating - compressed into 'So the kitchen waits.' The gapped sentence reports the endpoint of that waiting: somebody cracks. The connective that marks the terminal event of a drawn-out process is 'Eventually'. It locks - and for Swedish solvers it is also the classic false friend (eventuellt = 'possibly'), so the key rewards knowing that English 'eventually' is temporal, not modal. 'Similarly' does not fit the argument: nothing parallel has been introduced for the cracking to resemble; the sentence is a culmination, not a comparison. 'Presumably' introduces uncertainty that the sentence does not support: it frames the cracking as the writer's guess, but the writer immediately demonstrates detailed knowledge ('nearly always the same somebody'), so the epistemic hedge contradicts its own sentence. 'Ironically' does not fit the argument: someone finally yielding is exactly what the whole paragraph has led the reader to expect, and an expected outcome cannot be ironic.
```

Field: `questions[4].rationale`

Before:

```text
Collocation gap. All four options are monosyllabic present-tense verbs, each carrying a strong real idiom of impact or allocation, so every member of the set feels idiom-adjacent and none separates on shape. The frame is 'most kitchens ___ an uneasy balance between confrontation and squalor', and the fixed English collocation for arriving at a workable compromise is to strike a balance. 'strike' locks. deal = collocation_misfit lured by 'deal a blow' (and by dealing cards): the allocation sense is thematically flattering, but 'deal a balance' has no reading. cast = collocation_misfit lured by 'cast a shadow' and 'cast a vote': a real idiom family, but nothing with 'balance'. land = collocation_misfit lured by 'land a blow' or 'land a job': the achievement sense tempts, but 'land a balance' is not English. Design note: 'hit' was considered for this slot and rejected during drafting because 'hit the right balance' is colloquially attested and would have risked a second defensible key; the shipped set contains no such reading.
```

After:

```text
Collocation gap. All four options are monosyllabic present-tense verbs, each carrying a strong real idiom of impact or allocation, so every member of the set feels idiom-adjacent and none separates on shape. The frame is 'most kitchens ___ an uneasy balance between confrontation and squalor', and the fixed English collocation for arriving at a workable compromise is to strike a balance. 'strike' locks. 'deal' may suggest 'deal a blow' (and by dealing cards): the allocation sense is thematically flattering, but 'deal a balance' has no reading. 'cast' may suggest 'cast a shadow' and 'cast a vote': a real idiom family, but nothing with 'balance'. 'land' may suggest 'land a blow' or 'land a job': the achievement sense tempts, but 'land a balance' is not English.
```

### elf-b18-003 — fleet-repair-7

Field: `questions[0].rationale`

Before:

```text
TYPE-001 direct detail, key_derivation paraphrase_one_sentence, anchored on the mechanism sentence: 'But mortar that touches timber passes damp to it, and whatever wet reached the torching sat against the battens until they decayed along its line.' D recasts exactly that in different words - the mortar held the water it caught against the battens and the wood rotted there - and adds nothing the text does not supply. The mechanism is deliberately counterintuitive in the elf-b16-003 sense: lay world-knowledge says mortar is protection and adhesive, so an unread solver is pulled toward A or B, never toward the key. A is the reversed mechanism and carries the surface_word_match: it borrows 'shelter' from the final sentence (where FELT, not torching, does the sheltering) and claims the mortar protected the battens so the timber usually stayed sound - the passage says the opposite in its anchor sentence: the battens decayed along the torching's line. The hedge 'usually' also makes A the trap for a pick-the-qualified-option solver. B is the causal-glue trap built on the commonest lay belief about roofs, that mortar is what sticks tiles on. It glues a holding role onto torching that the passage assigns elsewhere: the tiles 'hang from two small lugs at the head, the nibs', with every fourth course nailed, and the torching 'went on after the tiles were hung' - the roof was already holding itself up before any mortar arrived. The text states torching's purpose exclusively ('it was there to stop the fine snow, dust and draughts'), and no holding function is ever stated. C is the scope upgrade: it inflates the enumerated job (fine snow, dust, draughts - wind-driven ingress) into full weathertightness in all weather, which the anchor sentence itself contradicts, since 'whatever wet reached the torching' presupposes that water did get past the tiles. Hedge balance: the key D is a flat, unhedged, specific claim; the only hedged option (A, 'usually') is wrong; no option carries a listed absolutizer, so neither pick-the-qualified nor strike-the-absolutes locates the key. Lengths under mech tokenisation: A 16, B 16, C 15, D 15 - the key is tied for shortest, ratio 1.07 against the 2.36 ELF cap.
```

After:

```text
The answer follows from the sentence explaining the damage: 'But mortar that touches timber passes damp to it, and whatever wet reached the torching sat against the battens until they decayed along its line.' D recasts exactly that in different words - the mortar held the water it caught against the battens and the wood rotted there - and adds nothing the text does not supply. A reverses the mechanism and borrows a word from elsewhere in the passage: it borrows 'shelter' from the final sentence (where FELT, not torching, does the sheltering) and claims the mortar protected the battens so the timber usually stayed sound - the passage says the opposite in its anchor sentence: the battens decayed along the torching's line. B is the causal-glue trap built on the commonest lay belief about roofs, that mortar is what sticks tiles on. It glues a holding role onto torching that the passage assigns elsewhere: the tiles 'hang from two small lugs at the head, the nibs', with every fourth course nailed, and the torching 'went on after the tiles were hung' - the roof was already holding itself up before any mortar arrived. The text states torching's purpose exclusively ('it was there to stop the fine snow, dust and draughts'), and no holding function is ever stated. C is the scope upgrade: it inflates the enumerated job (fine snow, dust, draughts - wind-driven ingress) into full weathertightness in all weather, which the anchor sentence itself contradicts, since 'whatever wet reached the torching' presupposes that water did get past the tiles.
```

### elf-b18-004 — fleet-repair-7

Field: `questions[0].rationale`

Before:

```text
TYPE-002, one_inch_inference read off a dated sequence in the documents themselves. The passage gives four facts and never connects them: (i) six middle-aisle pews are marked vacant in the 1848 plan and four in 1849; (ii) in the 1851 plan the vacant marks are gone; (iii) the same 1851 plan is the one where ruled lines first cut the boxes into single sittings at two shillings apiece, 'and names crowd where one household's name used to stand'; (iv) 'The wardens' minutes record the new lettings without a word of explanation' - so the passage explicitly withholds the reason, and the reader must supply it from the sequence. The only reading that carries all four facts is B: pews still stood unlet in the two plans before the change - six in 1848, four in 1849, a shortfall that was narrowing but had not closed - so whole boxes at whole-box prices were not all finding takers; the wardens changed the unit of sale to something smaller and cheaper per seat, and the vacancies disappeared in the same plan in which the lines appear. Pew 9 - an eighteen-shilling box in 1848, three surnames by 1856 - shows the mechanism at pew level: households now bought fractions of what one household used to take whole. The 1861 rise in the front-box price is deliberate loose residue: demand at the front never failed, which is consistent with B (the failure was in the middle, where the vacancies were) but points at no option. The prices cohere without being load-bearing. That a box held several sittings is shown by the ruled lines themselves ('Thin ruled lines now cut the boxes into single sittings', plural per box) and by pew 9 carrying three surnames - not by the price spread, which the passage states as a PROXIMITY gradient ('eighteen shillings for the boxes nearest the pulpit, falling row by row to three shillings at the west door') and which therefore says nothing about seats per box. Whether two shillings a sitting undercut the old per-seat rate depends on a figure the passage never gives - the number of sittings in a box - and in any case the boxes that stood vacant were middle-aisle boxes somewhere on the gradient, not the dearest ones. No arithmetic is needed to answer. A = reversed reading of the crowding detail, dressed in the standard Victorian church-room-shortage narrative (outside knowledge), with 'mainly' as hedge camouflage. 'Names crowd' invites it, but the document record forecloses it: a church short of room does not carry six pews marked vacant, then four, in the two plans immediately before the change, and the 1848 plan records free benches at the west door, with nothing in the passage reporting their removal - anyone merely wanting a seat had one. The crowding is names per box, not people per church. C = two-step leap (cheap, therefore for the poor) glued to an unsupported group claim, and cautious-sounding via 'meant chiefly'. The passage says nothing about who took the sittings; the one named example sits in pew 9, formerly an eighteen-shilling box in the dearest class, which is the wrong direction for C; and the free benches at the west door are recorded in 1848 and never reported as withdrawn, so nothing in the passage pushed bench-sitters into paying. C answers a question about takers the text never opens. D = too-literal price recall with the unit bent, per the law-11 corollary (the detail-as-main trap is available only distorted, never quoted faithfully). Two shillings is the passage's own figure, so D feels anchored, but it bought one sitting - 'let at two shillings apiece', the lines cutting each box into several such sittings - not a whole box; a reader who skims the price and not the unit takes it. Hedge balance (rules 10/13): the key B is a flat, unhedged causal assertion; the two cautious-sounding options (A 'mainly', C 'chiefly') are both wrong, so 'pick the qualified answer' selects a distractor, and no option carries a hard absolutizer, so 'strip the absolutes' gets no purchase either. Length: mech.py tokenize gives A 15, B 16, C 18, D 17 - the key is second-shortest, ratio 18/15 = 1.20 against the 2.36 ELF cap. Self-blind-solve (skeptical, passage only): A dies on the vacant marks, C on the absence of any statement about takers plus pew 9's price class, D on 'apiece'; B is the only option left standing, and no pair is jointly defensible.
```

After:

```text
The answer follows from the dated sequence in the documents. The passage gives four facts and never connects them: (i) six middle-aisle pews are marked vacant in the 1848 plan and four in 1849; (ii) in the 1851 plan the vacant marks are gone; (iii) the same 1851 plan is the one where ruled lines first cut the boxes into single sittings at two shillings apiece, 'and names crowd where one household's name used to stand'; (iv) 'The wardens' minutes record the new lettings without a word of explanation' - so the passage explicitly withholds the reason, and the reader must supply it from the sequence. The only reading that carries all four facts is B: pews still stood unlet in the two plans before the change - six in 1848, four in 1849, a shortfall that was narrowing but had not closed - so whole boxes at whole-box prices were not all finding takers; the wardens changed the unit of sale to something smaller and cheaper per seat, and the vacancies disappeared in the same plan in which the lines appear. Pew 9 - an eighteen-shilling box in 1848, three surnames by 1856 - shows the mechanism at pew level: households now bought fractions of what one household used to take whole. The 1861 rise in the front-box price adds context: demand at the front never failed, which is consistent with B (the failure was in the middle, where the vacancies were) but points at no option. The prices cohere without being load-bearing. That a box held several sittings is shown by the ruled lines themselves ('Thin ruled lines now cut the boxes into single sittings', plural per box) and by pew 9 carrying three surnames - not by the price spread, which the passage states as a PROXIMITY gradient ('eighteen shillings for the boxes nearest the pulpit, falling row by row to three shillings at the west door') and which therefore says nothing about seats per box. Whether two shillings a sitting undercut the old per-seat rate depends on a figure the passage never gives - the number of sittings in a box - and in any case the boxes that stood vacant were middle-aisle boxes somewhere on the gradient, not the dearest ones. No arithmetic is needed to answer. A = reversed reading of the crowding detail, dressed in the standard Victorian church-room-shortage narrative (outside knowledge), with 'mainly' as hedge camouflage. 'Names crowd' invites it, but the document record forecloses it: a church short of room does not carry six pews marked vacant, then four, in the two plans immediately before the change, and the 1848 plan records free benches at the west door, with nothing in the passage reporting their removal - anyone merely wanting a seat had one. The crowding is names per box, not people per church. C = two-step leap (cheap, therefore for the poor) glued to an unsupported group claim, and cautious-sounding via 'meant chiefly'. The passage says nothing about who took the sittings; the one named example sits in pew 9, formerly an eighteen-shilling box in the dearest class, which is the wrong direction for C; and the free benches at the west door are recorded in 1848 and never reported as withdrawn, so nothing in the passage pushed bench-sitters into paying. C answers a question about takers the text never opens. D recalls the price but applies it to the wrong unit of sale. Two shillings is the passage's own figure, so D feels anchored, but it bought one sitting - 'let at two shillings apiece', the lines cutting each box into several such sittings - not a whole box; a reader who skims the price and not the unit takes it.
```

Field: `generator_meta.originality_note`

Before:

```text
SEARCH LOG (2026-09-01), rule-14 transport. Names checked: 'Stintbury' (toponym), 'Fetterlow' / 'Dorothea Fetterlow' (byline), 'Tebbenholt' (surname on the plan). (1) en.wikipedia CirrusSearch exact phrase, https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=%22NAME%22 - POSITIVE CONTROL 'Pellew' first, same endpoint, same session: totalhits 701, top hit Edward Pellew, 1st Viscount Exmouth - PASS. Then: 'Stintbury' totalhits 0; 'Fetterlow' totalhits 0; 'Tebbenholt' totalhits 0; 'Dorothea Fetterlow' totalhits 0. (2) OSM Nominatim, https://nominatim.openstreetmap.org/search, UA header set, >=1s between calls - POSITIVE CONTROL 'Nether Stowey' countrycodes=gb: returned the Somerset village - PASS. Then: 'Stintbury' with countrycodes=gb empty array; 'Stintbury' unrestricted worldwide empty array; one-letter-variant probes per rule 14, all empty arrays: 'Stinbury', 'Sintbury', 'Stantbury'; 'Tebbenholt' and 'Fetterlow' as place queries both empty. (3) Exact-quoted WebSearch - recipe control '"Robert Brindlow"' returned no exact bearer, only fuzzy near-names (Brindley, Bristow, Brudenell), proving the index live but not exact-phrase-strict, so a supplementary positive control was run: '"Syd Dernley"' returned the real assistant executioner as top hit (Wikipedia) - PASS. Then: '"Stintbury"' no exact match; nearest real places surfaced are Stanbury (West Yorkshire), Kintbury (Berkshire), Saintbury (Gloucestershire), Stantonbury - each at edit distance 2 or more from Stintbury, none a one-letter variant. '"Fetterlow"' no exact bearer; neighbours surfaced are Fetterman, Fetterolf (a Pennsylvania valve firm), Fetterangus, Fetterley - none within one letter. '"Tebbenholt"' no exact bearer; nearest is the real living Dutch surname Tebbenhof (edit distance 2) and the US surname Tebbenkamp - unrelated domains (social media, dentistry, translational medicine), no church-history or local-history bearer; noted, not a one-letter variant, kept. '"Dorothea Fetterlow"' no exact match (only unrelated Dorotheas and Fetter/Fetterley bearers). NOT CONSULTED: forebears.io returned HTTP 403 to every request in this session including the positive control 'Skelhorn', so surname-incidence data was NOT obtained and no claim is made from it; no Companies House, Ordnance Survey gazetteer or census-index check was performed. Law 1: the passage anchors on no nameable famous thesis. Pew rents, graded seat prices, free benches and the letting of single sittings are real features of English parish practice, but the parish, the surname, the byline, every price, every date and the subdivision-after-vacancy sequence on which the item turns are invented; no general knowledge of pew-renting supplies the documented sequence the key is read from. All three kept names are flagged for V-FINAL re-verification regardless, per rule 14.
```

After:

```text
SEARCH LOG (2026-09-01), rule-14 transport. Names checked: 'Stintbury' (toponym), 'Fetterlow' / 'Dorothea Fetterlow' (byline), 'Tebbenholt' (surname on the plan). (1) en.wikipedia CirrusSearch exact phrase, https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=%22NAME%22 - POSITIVE CONTROL 'Pellew' first, same endpoint, same session: totalhits 701, top hit Edward Pellew, 1st Viscount Exmouth - PASS. Then: 'Stintbury' totalhits 0; 'Fetterlow' totalhits 0; 'Tebbenholt' totalhits 0; 'Dorothea Fetterlow' totalhits 0. (2) OSM Nominatim, https://nominatim.openstreetmap.org/search, UA header set, >=1s between calls - POSITIVE CONTROL 'Nether Stowey' countrycodes=gb: returned the Somerset village - PASS. Then: 'Stintbury' with countrycodes=gb empty array; 'Stintbury' unrestricted worldwide empty array; one-letter-variant probes per rule 14, all empty arrays: 'Stinbury', 'Sintbury', 'Stantbury'; 'Tebbenholt' and 'Fetterlow' as place queries both empty. (3) Exact-quoted WebSearch - recipe control '"Robert Brindlow"' returned no exact bearer, only fuzzy near-names (Brindley, Bristow, Brudenell), proving the index live but not exact-phrase-strict, so a supplementary positive control was run: '"Syd Dernley"' returned the real assistant executioner as top hit (Wikipedia) - PASS. Then: '"Stintbury"' no exact match; nearest real places recorded in the original search are Stanbury (West Yorkshire), Kintbury (Berkshire), Saintbury (Gloucestershire), Stantonbury. CORRECTION 2026-10-06 (owner ruling 5; audits/elf-b18-004.json LAW16-1): the earlier claim that all four were at edit distance 2 or more and none was a one-letter variant was false. Saintbury is a real village and civil parish in Gloucestershire with its own parish church, at Levenshtein distance exactly 1 from Stintbury (the second letter, a versus t). It is a known near-collision in the same parish-church domain, not a cleared neighbour. The enumerated variant probes omitted this substitution. The owner retains Stintbury as GODKÄNN_NOTED with this disclosure; the historical exact-name zero results above do not establish one-letter clearance. No new network search was performed for this correction. '"Fetterlow"' no exact bearer; neighbours surfaced are Fetterman, Fetterolf (a Pennsylvania valve firm), Fetterangus, Fetterley - none within one letter. '"Tebbenholt"' no exact bearer; nearest is the real living Dutch surname Tebbenhof (edit distance 2) and the US surname Tebbenkamp - unrelated domains (social media, dentistry, translational medicine), no church-history or local-history bearer; noted, not a one-letter variant, kept. '"Dorothea Fetterlow"' no exact match (only unrelated Dorotheas and Fetter/Fetterley bearers). NOT CONSULTED: forebears.io returned HTTP 403 to every request in this session including the positive control 'Skelhorn', so surname-incidence data was NOT obtained and no claim is made from it; no Companies House, Ordnance Survey gazetteer or census-index check was performed. Law 1: the passage anchors on no nameable famous thesis. Pew rents, graded seat prices, free benches and the letting of single sittings are real features of English parish practice, but the parish, the surname, the byline, every price, every date and the subdivision-after-vacancy sequence on which the item turns are invented; no general knowledge of pew-renting supplies the documented sequence the key is read from. All three kept names are flagged for V-FINAL re-verification regardless, per rule 14.
```

### las-b18-001 — fleet-repair-7

Field: `questions[0].rationale`

Before:

```text
Nyckeln A parafraserar släckningsbeskrivningen i stycke 2: den brända stenen som möter vatten sjuder, spricker och faller sönder till ett fint vitt mjöl (synonymskifte: fräste/pulver i stället för sjuda/mjöl, inget verbatimlyft). De tre distraktorerna är avsiktligt sant klingande för den som kan kalkhantverk men inte har läst texten – världskunskap räcker inte för att skilja dem åt, bara passagen gör det. B är en scope-eskalering av textens 'sjuda': släckning utvecklar i verkligheten stark värme, men texten säger ingenting om att hettan kunde antända ved. C vänder ordningen i stycke 3: det var den BRÄNDA stenen som förvarades torr till dess den skulle släckas, inte den släckta massan som lades i gropar för att mogna – gropmognad är ett verkligt kalkbruk, men inte textens (reversed order/timing). D lägger till ett villkor som texten aldrig ställer: stycke 2 säger bara att den släckta kalken blandad med sand ger murbruk, ingenting om att blandningen skulle ske medan massan ännu sjöd – varm blandning är ett verkligt hantverksgrepp, här ett textlöst tillägg (scope_shift).
```

After:

```text
Nyckeln A parafraserar släckningsbeskrivningen i stycke 2: den brända stenen som möter vatten sjuder, spricker och faller sönder till ett fint vitt mjöl (fräste och pulver återger här sjuda och mjöl). De tre distraktorerna är avsiktligt sant klingande för den som kan kalkhantverk men inte har läst texten – världskunskap räcker inte för att skilja dem åt, bara passagen gör det. B går längre än textens 'sjuda': släckning utvecklar i verkligheten stark värme, men texten säger ingenting om att hettan kunde antända ved. C vänder ordningen i stycke 3: det var den BRÄNDA stenen som förvarades torr till dess den skulle släckas, inte den släckta massan som lades i gropar för att mogna – gropmognad är ett verkligt kalkbruk, men inte textens. D lägger till ett villkor som texten aldrig ställer: stycke 2 säger bara att den släckta kalken blandad med sand ger murbruk, ingenting om att blandningen skulle ske medan massan ännu sjöd – varm blandning är ett verkligt hantverksgrepp, här ett textlöst tillägg.
```

Field: `questions[1].rationale`

Before:

```text
Nyckeln D parafraserar stycke 4: en ugn var för stor för ett enskilt hushåll och restes och brändes av ett ugnslag, en handfull grannar. Tre av alternativen ligger på samma ägar- och organisationsaxel, så motsatsparet enskild/gemensam är inte längre ensamt i uppsättningen. A inverterar textens grund (reversed/inversion): den säger uttryckligen att en ugn var för stor för ett hushåll, så 'var sin ugn' motsäger organisationens själva förutsättning. B är plausible_worldknowledge på samma axel: att en välbärgad gård ägde ugnen och lät de andra betala för sig är en fullt tänkbar ordning, men texten säger att var och en sköt till sin andel ved och att den färdiga kalken delades efter insats – ingen köper sig plats vid elden. C vänder avsättningens riktning (reversed_causality): det mesta av kalken gick till avsalu och gav kontanter, inte till husbehov.
```

After:

```text
Nyckeln D parafraserar stycke 4: en ugn var för stor för ett enskilt hushåll och restes och brändes av ett ugnslag, en handfull grannar. A vänder på textens grund: den säger uttryckligen att en ugn var för stor för ett hushåll, så 'var sin ugn' motsäger organisationens själva förutsättning. B föreslår en tänkbar ägarordning som texten inte stöder: att en välbärgad gård ägde ugnen och lät de andra betala för sig är en fullt tänkbar ordning, men texten säger att var och en sköt till sin andel ved och att den färdiga kalken delades efter insats – ingen köper sig plats vid elden. C vänder avsättningens riktning: det mesta av kalken gick till avsalu och gav kontanter, inte till husbehov.
```

Field: `questions[2].rationale`

Before:

```text
Nyckeln B spänner över texten som helhet: kalkens vikt och böndernas bränning (stycke 1), binäringen som för många hushåll över huvud taget gav kontanter (stycke 4) och marknaden som mot seklets slut gick förlorad till kalkverkens ugnar och till cementen (stycke 7). Att spåren efter näringen ännu ligger kvar som rösen i skogsbrynet (stycke 6–7) hör till samma bild, men behövs inte för att välja B. A är detail_as_main med rangordningsfel: åkrarna fick 'något' medan kalken 'framför allt' gick till murningen av stenhus, broar och kyrktorn – att åkerkalkning är den mest kända kalkanvändningen i dag gör alternativet lockande, men texten rangordnar tvärtom. C är en tidsomkastning byggd på ett ytligt eko av stycke 7: det är VID järnvägarna som kalkverken växer, och de tar marknaden FRÅN ugnslagen – järnvägen avslutar alltså binäringen, den startar den inte. Att bränningen fanns långt dessförinnan slås fast redan i stycke 1: i socknar med kalksten i backarna hade den sedan länge varit böndernas sak. C har med flit samma sammanfattande form som nyckeln och samma medgivande ('binäring'), så alternativens form skiljer dem inte åt; bara texten gör det. D är ett aktörsbyte i orsaksledet (half_right/actor-swap): enskilda ugnar övergavs när SKOGEN omkring dem var uthuggen, och näringen dog av kalkverkens och cementens konkurrens – berget var uttryckligen sällan något bekymmer, kalkstenen gick i dagen.
```

After:

```text
Nyckeln B spänner över texten som helhet: kalkens vikt och böndernas bränning (stycke 1), binäringen som för många hushåll över huvud taget gav kontanter (stycke 4) och marknaden som mot seklets slut gick förlorad till kalkverkens ugnar och till cementen (stycke 7). Att spåren efter näringen ännu ligger kvar som rösen i skogsbrynet (stycke 6–7) hör till samma bild, men behövs inte för att välja B. A gör en detalj till huvudämne och vänder på rangordningen: åkrarna fick 'något' medan kalken 'framför allt' gick till murningen av stenhus, broar och kyrktorn – att åkerkalkning är den mest kända kalkanvändningen i dag gör alternativet lockande, men texten rangordnar tvärtom. C är en tidsomkastning byggd på ett ytligt eko av stycke 7: det är VID järnvägarna som kalkverken växer, och de tar marknaden FRÅN ugnslagen – järnvägen avslutar alltså binäringen, den startar den inte. Att bränningen fanns långt dessförinnan slås fast redan i stycke 1: i socknar med kalksten i backarna hade den sedan länge varit böndernas sak. D är ett aktörsbyte i orsaksledet: enskilda ugnar övergavs när SKOGEN omkring dem var uthuggen, och näringen dog av kalkverkens och cementens konkurrens – berget var uttryckligen sällan något bekymmer, kalkstenen gick i dagen.
```

Field: `questions[3].rationale`

Before:

```text
Nyckeln C kräver att två textfakta kombineras i angiven riktning: ett sjuttiotal ugnsrester har räknats in (stycke 6), men äldre ugnar övergavs när skogen runt dem huggits ut och ersattes av en yngre längre bort, och en och samma ugn brändes dessutom bara vartannat eller vart tredje år (stycke 5–6). Resterna är alltså avlagringar av en följd av generationer, inte spår av lika många samtidiga ugnar – antalet överdriver verksamhetens samtidiga omfattning. A är ett aktörsbyte i evidensledet och resonerar, precis som nyckeln, om vad lämningarna kan bära: rösena ligger enligt stycke 6 påfallande ofta i gränsen mellan inägor och utmark, alltså en gräns inne i byns egna marker, inte mellan socknar – läget kan därför inte kartlägga gamla sockengränser. B stannar också i evidensledet, men drar gränsen på fel ställe: texten säger att lämningarnas ÅLDER inte går att avgöra utan utgrävning, aldrig att deras byggnadssätt är oläsbart. Tvärtom är det Gillervalls uppmätningar av just dessa lämningar som tillsammans med handbokens kapitel utgör förlagan när länsmuseet murar upp en ugn på nytt (stycke 8). Det som enligt samma stycke inte längre går att fråga någon om är hantverket – hur elden ska föras, hur länge, med vilken ved – inte formen. D är reversed_causality mot en explicit utsaga: texten säger att de äldsta lämningarnas ålder INTE går att avgöra utan utgrävning – alternativet vänder påståendet rakt om.
```

After:

```text
Nyckeln C kräver att två textfakta kombineras i angiven riktning: ett sjuttiotal ugnsrester har räknats in (stycke 6), men äldre ugnar övergavs när skogen runt dem huggits ut och ersattes av en yngre längre bort, och en och samma ugn brändes dessutom bara vartannat eller vart tredje år (stycke 5–6). Resterna är alltså avlagringar av en följd av generationer, inte spår av lika många samtidiga ugnar – antalet överdriver verksamhetens samtidiga omfattning. A är ett aktörsbyte i evidensledet och resonerar, precis som nyckeln, om vad lämningarna kan bära: rösena ligger enligt stycke 6 påfallande ofta i gränsen mellan inägor och utmark, alltså en gräns inne i byns egna marker, inte mellan socknar – läget kan därför inte kartlägga gamla sockengränser. B stannar också i evidensledet, men drar gränsen på fel ställe: texten säger att lämningarnas ÅLDER inte går att avgöra utan utgrävning, aldrig att deras byggnadssätt är oläsbart. Tvärtom är det Gillervalls uppmätningar av just dessa lämningar som tillsammans med handbokens kapitel utgör förlagan när länsmuseet murar upp en ugn på nytt (stycke 8). Det som enligt samma stycke inte längre går att fråga någon om är hantverket – hur elden ska föras, hur länge, med vilken ved – inte formen. D vänder på ett uttryckligt påstående: texten säger att de äldsta lämningarnas ålder INTE går att avgöra utan utgrävning – alternativet vänder påståendet rakt om.
```

### las-b18-002 — fleet-repair-7

Field: `questions[0].rationale`

Before:

```text
Nyckeln C parafraserar målmeningen i stycke 4: kvicksilverlamporna byttes mot ledbelysning vintern 2023 och förbrukningen föll med ungefär två tredjedelar, men kalkylen utgår ändå från de gamla lamporna – besparingen är alltså räknad på en belysning som inte längre sitter uppe. Stammen säger uttryckligen ”besparingskalkyl”, så alla fyra optioner prövas mot samma räkning: den som ger 38 000 kronor om året. Tre av dem – A, C och D – angriper dessutom kalkylen i samma riktning: de påstår att besparingen är för högt räknad, så ingen av de tre går att stryka på riktningen allena; det är innehållet som skiljer dem. B ligger på en annan axel och påstår ingenting om beloppets storlek: den invänder mot underlagets tunnhet, mot att löpare har räknats vid ett enda tillfälle. A (surface_lexical_echo med fel dimension): formuleringen plockar upp passagens egna ord ”de armaturer som faktiskt sitter i stolparna”, och en överräkning av armaturer skulle mycket riktigt blåsa upp besparingen – men textens invändning gäller aldrig hur många armaturer som sitter uppe, utan vilka: gamla kvicksilverlampor i kalkylen mot den ledbelysning som sitter där i dag. Rätt riktning, fel storhet. B (scope_shift): räkningen av löpare på spåret redovisas i tjänsteskrivelsen som stöd för beskrivningen ”begränsat för flertalet motionärer”, inte som underlag för besparingskalkylen – rätt dokument, fel del av det, och en räkning av personer är över huvud taget ingen post i en besparing räknad i kronor. D (scope_shift till annan post i samma räkning): ett uppblåst timantal skulle mycket riktigt förstora besparingen, men beslutet är på pappret två timmar – ”spåret släcks klockan 21 i stället för klockan 23” – och författarens egen omräkning utgår från precis samma ”två kvällstimmar” när han landar på omkring tolv tusen kronor. Den post D pekar ut bestrider han alltså aldrig – lika lite som han bestrider armaturantalet eller elpriset; det är lampsorten, och bara den, som hans invändning gäller.
```

After:

```text
Nyckeln C parafraserar målmeningen i stycke 4: kvicksilverlamporna byttes mot ledbelysning vintern 2023 och förbrukningen föll med ungefär två tredjedelar, men kalkylen utgår ändå från de gamla lamporna – besparingen är alltså räknad på en belysning som inte längre sitter uppe. Stammen säger uttryckligen ”besparingskalkyl”, så alla fyra alternativ prövas mot samma räkning: den som ger 38 000 kronor om året. Tre av dem – A, C och D – angriper dessutom kalkylen i samma riktning: de påstår att besparingen är för högt räknad, så ingen av de tre går att stryka på riktningen allena; det är innehållet som skiljer dem. B ligger på en annan axel och påstår ingenting om beloppets storlek: den invänder mot underlagets tunnhet, mot att löpare har räknats vid ett enda tillfälle. A återanvänder textens ord men pekar ut fel storhet: formuleringen plockar upp passagens egna ord ”de armaturer som faktiskt sitter i stolparna”, och en överräkning av armaturer skulle mycket riktigt blåsa upp besparingen – men textens invändning gäller aldrig hur många armaturer som sitter uppe, utan vilka: gamla kvicksilverlampor i kalkylen mot den ledbelysning som sitter där i dag. Rätt riktning, fel storhet. B flyttar invändningen till en annan del av underlaget: räkningen av löpare på spåret redovisas i tjänsteskrivelsen som stöd för beskrivningen ”begränsat för flertalet motionärer”, inte som underlag för besparingskalkylen – rätt dokument, fel del av det, och en räkning av personer är över huvud taget ingen post i en besparing räknad i kronor. D flyttar invändningen till en annan post i samma räkning: ett uppblåst timantal skulle mycket riktigt förstora besparingen, men beslutet är på pappret två timmar – ”spåret släcks klockan 21 i stället för klockan 23” – och författarens egen omräkning utgår från precis samma ”två kvällstimmar” när han landar på omkring tolv tusen kronor. Den post D pekar ut bestrider han alltså aldrig – lika lite som han bestrider armaturantalet eller elpriset; det är lampsorten, och bara den, som hans invändning gäller.
```

Field: `questions[1].rationale`

Before:

```text
Nyckeln B spänner över både medgivandet och kravet i stycke 5: författaren godtar tidig släckning under sommaren (”för sommaren har nämnden faktiskt en poäng”) men kräver tänt till elva från oktober till mars. A (overgeneralisation): driver hållningen förbi det uttryckliga sommarmedgivandet till ett krav på kvällsbelysning året om, vilket texten aldrig reser. C (half_right_conjunction med fel dimension): medgivandet är textnära – ”Spartrycket är verkligt”, skriver författaren – och att neddragningen träffar fel ligger nära hans hållning. Men andra ledet flyttar invändningen till fel storhet. Han vill inte att besparingen hämtas i någon annan VERKSAMHET; han vill att den hämtas under andra MÅNADER: ”Släck vid nio på sommaren, håll tänt till elva från oktober till mars.” Frågan om vilken verksamhet som ska bära besparingen reser texten aldrig, och rubriken namnger den riktiga dimensionen. D (plausible_worldknowledge/motståndarhållning): en resignerad acceptans av försämringen motsägs av textens hela ärende, uppmaningen att göra om beslutet redan på novembermötet.
```

After:

```text
Nyckeln B spänner över både medgivandet och kravet i stycke 5: författaren godtar tidig släckning under sommaren (”för sommaren har nämnden faktiskt en poäng”) men kräver tänt till elva från oktober till mars. A driver hållningen förbi det uttryckliga sommarmedgivandet till ett krav på kvällsbelysning året om, vilket texten aldrig reser. C förenar ett riktigt medgivande med en invändning om fel storhet: medgivandet är textnära – ”Spartrycket är verkligt”, skriver författaren – och att neddragningen träffar fel ligger nära hans hållning. Men andra ledet flyttar invändningen till fel storhet. Han vill inte att besparingen hämtas i någon annan VERKSAMHET; han vill att den hämtas under andra MÅNADER: ”Släck vid nio på sommaren, håll tänt till elva från oktober till mars.” Frågan om vilken verksamhet som ska bära besparingen reser texten aldrig, och rubriken namnger den riktiga dimensionen. D tillskriver författaren en annan hållning: en resignerad acceptans av försämringen motsägs av textens hela ärende, uppmaningen att göra om beslutet redan på novembermötet.
```

### las-b18-003 — fleet-repair-7

Field: `questions[0].rationale`

Before:

```text
Nyckeln C parafraserar fyndmeningen i stycke 2: där källorna är fylliga nog att pröva saken tycks årplatserna ofta ha fördelats efter gårdarnas mantal, med de största hemmanen närmast aktern – hedgat (”ofta”, ”tycks”), riktat (gårdens mantal → plats i båten) och avgränsat (bara där källorna räcker till). A är reversed_causality: pilen vänds så att platsen i båten blir det som avgör gårdens anseende; texten beskriver båten som en flytande spegel av en rangordning som redan fanns, inte som rangordningens källa. B är reversed_inversion på källornas egen karaktär: stammen talar om en genomgång av protokoll, och det ligger nära till hands att tänka sig att platserna då skulle ha förts in i protokollen löpande – men texten utesluter den läsningen två gånger, först med att fördelningen var ”så självklar att den sällan skrevs ned” och sedan med Tennlövs eget resultat, att ordningen ”mest kom på tal när den var i gungning: vid tvister, arvskiften, nybyggen”. Protokollen ger alltså strödda nedslag i konfliktögonblick, inte en regelbundet förd serie att följa år för år. D är plausible_worldknowledge: turordningar mellan gårdar fanns i byalagens värld och känns rimliga, men texten säger att styrmanstoften krävde väderkännedom, inte anor, och att fördelningen återkom år efter år – någon omgång nämns aldrig.
```

After:

```text
Nyckeln C parafraserar fyndmeningen i stycke 2: där källorna är fylliga nog att pröva saken tycks årplatserna ofta ha fördelats efter gårdarnas mantal, med de största hemmanen närmast aktern – garderat (”ofta”, ”tycks”), riktat (gårdens mantal → plats i båten) och avgränsat (bara där källorna räcker till). A vänder på orsakssambandet: pilen vänds så att platsen i båten blir det som avgör gårdens anseende; texten beskriver båten som en flytande spegel av en rangordning som redan fanns, inte som rangordningens källa. B misstolkar källornas karaktär: stammen talar om en genomgång av protokoll, och det ligger nära till hands att tänka sig att platserna då skulle ha förts in i protokollen löpande – men texten utesluter den läsningen två gånger, först med att fördelningen var ”så självklar att den sällan skrevs ned” och sedan med Tennlövs eget resultat, att ordningen ”mest kom på tal när den var i gungning: vid tvister, arvskiften, nybyggen”. Protokollen ger alltså strödda nedslag i konfliktögonblick, inte en regelbundet förd serie att följa år för år. D bygger på en tänkbar ordning utanför texten: turordningar mellan gårdar fanns i byalagens värld och känns rimliga, men texten säger att styrmanstoften krävde väderkännedom, inte anor, och att fördelningen återkom år efter år – någon omgång nämns aldrig.
```

Field: `questions[1].rationale`

Before:

```text
Nyckeln B fångar hållningen i stycke 4: författaren prövar den sociala läsningen och den praktiska, finner att samma källrader bär båda och slutar i uttalad ovisshet (”Jag vet ärligt talat inte vad sätena visade”). A är detail_as_main: den upphöjer stycke 3:s motförklaring till författarens slutsats, men han stannar aldrig där – vissa veckor ser han teknik, andra veckor rang, och texten avgör aldrig saken. C gör samma operation på stycke 4:s ena misstanke: att eftervärlden läser in för mycket ”går inte att lägga undan”, men den motsatta misstanken går inte heller att belägga, så något ”slår fast” finns inte i texten, och ”bör överges” saknar täckning helt. D är half_right_conjunction med plausible_worldknowledge: att frågan är svår att avgöra stämmer, men grunden är fel – texten framställer aldrig uppgifterna som tillrättalagda; svårigheten ligger i att samma protokollrader bär två tolkningar. Dessutom bygger texten på protokoll, inte på minnesbilder.
```

After:

```text
Nyckeln B fångar hållningen i stycke 4: författaren prövar den sociala läsningen och den praktiska, finner att samma källrader bär båda och slutar i uttalad ovisshet (”Jag vet ärligt talat inte vad sätena visade”). A gör en del av resonemanget till slutsats: den upphöjer stycke 3:s motförklaring till författarens slutsats, men han stannar aldrig där – vissa veckor ser han teknik, andra veckor rang, och texten avgör aldrig saken. C gör samma operation på stycke 4:s ena misstanke: att eftervärlden läser in för mycket ”går inte att lägga undan”, men den motsatta misstanken går inte heller att belägga, så något ”slår fast” finns inte i texten, och ”bör överges” saknar täckning helt. D förenar en riktig slutsats med en förklaring som texten inte ger: att frågan är svår att avgöra stämmer, men grunden är fel – texten framställer aldrig uppgifterna som tillrättalagda; svårigheten ligger i att samma protokollrader bär två tolkningar. Dessutom bygger texten på protokoll, inte på minnesbilder.
```

### elf-b19-001 — fleet-repair-6

Field: `questions[1].rationale`

Before:

```text
Key B paraphrases the paragraph-two result: per square foot the mixed-flow dryers carried what the cross-flow columns carried, within a few percent. It is a flat, confident claim with no hedge – deliberately, so that ‘pick the cautious option’ misfires here. A is the conventional expectation the swabs defeated, and it tempts because paragraph one has just told the reader that mixed-flow ducts are the dirty ones; a reader running on prior knowledge of dryer fires picks it. C is a quantifier upgrade with an invented target: the finding was parity, not absence, and the passage never sorts machines by age. D is the over-hedged distractor – cautious in form, unsupported in content. Nobody in the passage says the comparison is too small to read: Grendisham’s complaint is that a September swab misses what her crews pull out in February, which is an argument about when you swab rather than how many machines you swab, and the writer calls the swabs the one thing in the argument that is hard to walk past.
```

After:

```text
Key B paraphrases the paragraph-two result: per square foot the mixed-flow dryers carried what the cross-flow columns carried, within a few percent. A is the conventional expectation the swabs defeated, and it tempts because paragraph one has just told the reader that mixed-flow ducts are the dirty ones; a reader running on prior knowledge of dryer fires picks it. C is a quantifier upgrade with an invented target: the finding was parity, not absence, and the passage never sorts machines by age. D is the over-hedged distractor – cautious in form, unsupported in content. Nobody in the passage says the comparison is too small to read: Grendisham’s complaint is that a September swab misses what her crews pull out in February, which is an argument about when you swab rather than how many machines you swab, and the writer calls the swabs the one thing in the argument that is hard to walk past.
```

Field: `questions[4].rationale`

Before:

```text
The final paragraph is the writer speaking in her own voice, and she says two things about Calverend’s account. It fits: the swabs are hard to walk past, the county’s standard advice rests on a difference in dirt that twenty-six machines failed to show, and nobody now defends that advice on the old ground. And it has not been tested: Grendisham’s objection has not been answered, it cannot be answered from files like these, and answering it would need a probe inside a machine that later burns, which nobody has. C states both halves in her own terms – it fits the facts, and it has not been tested. A is the measured overclaim, and what tempts is that one objection really is dead: the old ground for the fines explanation has no defenders left. The live one is not, and the paragraph says so twice over – ‘Grendisham’s objection has not been answered, and it cannot be answered from files like these …’ A reader who slides from the retired objection to the objections generally picks A. B is the neutral-reporter misread; a writer who calls one account untested, records that nobody defends the old advice any longer, and disposes of a third party’s remedy as something the mutual has no power to grant has not stayed out of it. D turns her verdict into a recommendation she declines to make. She does say the remedy is nearly free, and she does dispose of the rival remedy as not the mutual’s to give, which together make D feel like where the piece is heading; the very next sentence refuses it – ‘Whether writing a run-on clause into next year’s policies would be worth anything turns on something nobody has worked out how to check’ – and the piece ends on that question rather than on an answer. Note for the hedge audit: D carries a scoped qualifier of its own (‘convinced enough to’), so ‘pick the measured-sounding one’ still does not isolate the key here.
```

After:

```text
The final paragraph is the writer speaking in her own voice, and she says two things about Calverend’s account. It fits: the swabs are hard to walk past, the county’s standard advice rests on a difference in dirt that twenty-six machines failed to show, and nobody now defends that advice on the old ground. And it has not been tested: Grendisham’s objection has not been answered, it cannot be answered from files like these, and answering it would need a probe inside a machine that later burns, which nobody has. C states both halves in her own terms – it fits the facts, and it has not been tested. A is the measured overclaim, and what tempts is that one objection really is dead: the old ground for the fines explanation has no defenders left. The live one is not, and the paragraph says so twice over – ‘Grendisham’s objection has not been answered, and it cannot be answered from files like these …’ A reader who slides from the retired objection to the objections generally picks A. B is the neutral-reporter misread; a writer who calls one account untested, records that nobody defends the old advice any longer, and disposes of a third party’s remedy as something the mutual has no power to grant has not stayed out of it. D turns her verdict into a recommendation she declines to make. She does say the remedy is nearly free, and she does dispose of the rival remedy as not the mutual’s to give, which together make D feel like where the piece is heading; the very next sentence refuses it – ‘Whether writing a run-on clause into next year’s policies would be worth anything turns on something nobody has worked out how to check’ – and the piece ends on that question rather than on an answer.
```

### elf-b19-002 — fleet-repair-6

Field: `questions[0].rationale`

Before:

```text
Collocation gap. All four options are short nouns of seeing and prospect, three of them monosyllables, so the set is POS-uniform and shape gives no purchase. The frame is 'is being asked, in the politest possible terms, to take the long ___', and English carries exactly one fixed phrase here: to take the long view, meaning to accept a distant payoff. The paragraph has already earned the sense - the bottom of the list is twelve years from a key, and the secretary says so to anyone who telephones - so what the applicant is being asked for is patience about a result a long way off. 'view' locks. outlook = collocation_misfit and the strongest lure, because 'a long-term outlook' is real and sits in exactly this semantic field; the noun simply does not take this frame, and 'take the long outlook' has no reading in English. sight = collocation_misfit with a genuine near-collocation behind it, since 'long sight' and 'long-sighted' both exist and a solver who has met them will feel the shape fit; but 'take the long sight' is not English, and the ophthalmic sense is the wrong one in any case. gaze = collocation_misfit: 'a long gaze' is perfectly good English as a noun phrase, which makes it available to the ear, but a gaze is held, met or returned and never taken in this sense. Only 'view' completes the idiom.
```

After:

```text
Collocation gap. All four options are short nouns of seeing and prospect, three of them monosyllables, so the set is uniform in part of speech and shape gives no purchase. The frame is 'is being asked, in the politest possible terms, to take the long ___', and English carries exactly one fixed phrase here: to take the long view, meaning to accept a distant payoff. The paragraph has already earned the sense - the bottom of the list is twelve years from a key, and the secretary says so to anyone who telephones - so what the applicant is being asked for is patience about a result a long way off. 'view' locks. 'outlook' is tempting because 'a long-term outlook' is real and sits in exactly this semantic field; the noun simply does not take this frame, and 'take the long outlook' has no reading in English. 'sight' may seem to fit because 'long sight' and 'long-sighted' both exist and a solver who has met them will feel the shape fit; but 'take the long sight' is not English, and the ophthalmic sense is the wrong one in any case. 'gaze' does not fit this expression: 'a long gaze' is perfectly good English as a noun phrase, which makes it available to the ear, but a gaze is held, met or returned and never taken in this sense. Only 'view' completes the idiom.
```

Field: `questions[1].rationale`

Before:

```text
Connective gap. All four options are sentence-initial adverbs in -ly, of the same weight and formality, and each parses cleanly in front of the clause that follows, so register and shape separate nothing. The gapped sentence states the rule - a plot cannot be inherited - and the next two sentences treat that rule as settled and undisputed, while the final paragraph shows the arrangement that grows around it: an elderly tenant's nephew who begins as a helper, takes over the digging, and ends with the tenancy in his name and one line in the minutes. The adverb the text needs is the one that marks a statement as true of the written rule and not of the practice, and that is 'Strictly'. The following sentence now names that reading outright - the clause 'as written' - so the frame selects the precision adverb positively and not merely by elimination. It locks. Increasingly = wrong_logic and the sharpest lure, since a reader primed by the twelve-year wait will accept a sentence about pressure growing; but the clause is presented as standing and fixed ('That is the clause as written, and nobody disputes it or finds it odd'), and nothing in the passage dates it or reports any change in how it is applied. Curiously = wrong_logic: it asserts that the rule is surprising, and the passage now says the opposite in as many words - nobody disputes the clause or finds it odd - before moving straight past it. Privately = wrong_logic, and it inverts the text twice over: the paragraph above says nothing here is hidden and the order is numbered, and the only thing kept private on this site is the phrase the older hands use, not the rule.
```

After:

```text
Connective gap. All four options are sentence-initial adverbs in -ly, of the same weight and formality, and each parses cleanly in front of the clause that follows, so register and shape separate nothing. The gapped sentence states the rule - a plot cannot be inherited - and the next two sentences treat that rule as settled and undisputed, while the final paragraph shows the arrangement that grows around it: an elderly tenant's nephew who begins as a helper, takes over the digging, and ends with the tenancy in his name and one line in the minutes. The adverb the text needs is the one that marks a statement as true of the written rule and not of the practice, and that is 'Strictly'. The following sentence names that reading outright - the clause 'as written' - so the frame selects the precision adverb positively and not merely by elimination. It locks. 'Increasingly' may seem plausible because a reader primed by the twelve-year wait will accept a sentence about pressure growing; but the clause is presented as standing and fixed ('That is the clause as written, and nobody disputes it or finds it odd'), and nothing in the passage dates it or reports any change in how it is applied. 'Curiously' does not fit the argument: it asserts that the rule is surprising, and the passage says the opposite in as many words - nobody disputes the clause or finds it odd - before moving straight past it. 'Privately' contradicts the text in two ways: the paragraph above says nothing here is hidden and the order is numbered, and the only thing kept private on this site is the phrase the older hands use, not the rule.
```

Field: `questions[2].rationale`

Before:

```text
Collocation gap. All four options are plural nouns for worn articles, identically shaped and identically plausible after a plural possessive, so nothing separates them on form. The frame is 'a phrase for this among themselves, about waiting for dead men’s ___', and English has one fixed phrase of that shape: waiting for dead men’s shoes, said of advancement that can come only when somebody ahead of you stops. The paragraph has built the sense in advance - the list moves when a knee gives out, when somebody moves away, when a winter settles it - and the sentence after the gap ('It is not affectionate and it is not quite a joke') confirms that the phrase is a hard one. 'shoes' locks. hats = collocation_misfit: the hat is as ordinary a worn article as the other three and sits in plenty of fixed phrases of its own - at the drop of a hat, old hat, to take one's hat off to somebody, to wear several hats - none of which is about succession, about waiting, or about the dead, so 'waiting for dead men’s hats' forms no idiom at all and can only be read literally. coats = collocation_misfit with a thematic pull: a coat is the classic inherited garment and this passage is about inheritance, but no idiom of waiting attaches to it. gloves = collocation_misfit: 'the gloves are off' and 'handle with kid gloves' are both real and both belong to the register of set phrases, yet neither yields this frame. Only 'shoes' completes the proverb.
```

After:

```text
Collocation gap. All four options are plural nouns for worn articles, identically shaped and identically plausible after a plural possessive, so nothing separates them on form. The frame is 'a phrase for this among themselves, about waiting for dead men’s ___', and English has one fixed phrase of that shape: waiting for dead men’s shoes, said of advancement that can come only when somebody ahead of you stops. The paragraph has built the sense in advance - the list moves when a knee gives out, when somebody moves away, when a winter settles it - and the sentence after the gap ('It is not affectionate and it is not quite a joke') confirms that the phrase is a hard one. 'shoes' locks. 'hats' does not fit this expression: the hat is as ordinary a worn article as the other three and sits in plenty of fixed phrases of its own - at the drop of a hat, old hat, to take one's hat off to somebody, to wear several hats - none of which is about succession, about waiting, or about the dead, so 'waiting for dead men’s hats' forms no idiom at all and can only be read literally. 'coats' may seem to fit the topic: a coat is the classic inherited garment and this passage is about inheritance, but no idiom of waiting attaches to it. 'gloves' does not fit this expression: 'the gloves are off' and 'handle with kid gloves' are both real and both belong to the register of set phrases, yet neither yields this frame. Only 'shoes' completes the proverb.
```

Field: `questions[3].rationale`

Before:

```text
Polarity gap. All four options are -ous adjectives of manner and attitude, fully suffix-rhymed, and each of them is predicable of a tone in ordinary English, so neither shape nor collocation separates the set. The work is done by the frame: 'the tone of that line is not approving, but it is not ___ either'. A 'but ... either' pair of this kind puts its two terms on one scale and requires them to sit at opposite ends of it, so the missing word has to name disapproval, on the very axis that 'approving' has just opened. The sentence reports a committee that has watched a plot pass to a nephew while the tenant is still alive - outside the reach of its own clause rather than in defiance of it, which is what the paragraph's own opening sentence says: the clause cannot reach what grows around it - and has written the transfer up in a single flat line. 'censorious' is the word at that pole. It locks. gracious = polarity_mirror and the designed trap: it sits on the same approving side of the scale as the first term, so the 'but' is left with no contrast to carry and the sentence says the same thing twice - and it is close enough to ordinary talk about tone to feel available to a solver who has skimmed the construction. cautious = wrong axis: 'a cautious tone' is real English, but caution measures how carefully a thing is said and not whether it is approved of, so the contrast the 'but' promises never arrives; there is a second reason to drop it, which is that a committee giving a transfer exactly one line is being careful rather than careless. For the hedge audit, this puts the cautious-sounding word firmly in the wrong column. anxious = wrong axis for the same reason - it names worry rather than a position for or against - and the passage gives the committee nothing to worry about, since it is recording an outcome it has already allowed to happen. Note for the hedge audit: on this gap the key is the severe, unsoftened word and every milder option is wrong.
```

After:

```text
Polarity gap. All four options are -ous adjectives of manner and attitude, fully suffix-rhymed, and each of them is predicable of a tone in ordinary English, so neither shape nor collocation separates the set. The work is done by the frame: 'the tone of that line is not approving, but it is not ___ either'. A 'but ... either' pair of this kind puts its two terms on one scale and requires them to sit at opposite ends of it, so the missing word has to name disapproval, on the very axis that 'approving' has just opened. The sentence reports a committee that has watched a plot pass to a nephew while the tenant is still alive - outside the reach of its own clause rather than in defiance of it, which is what the paragraph's own opening sentence says: the clause cannot reach what grows around it - and has written the transfer up in a single flat line. 'censorious' is the word at that pole. It locks. 'gracious' has the wrong meaning here: it sits on the same approving side of the scale as the first term, so the 'but' is left with no contrast to carry and the sentence says the same thing twice - and it is close enough to ordinary talk about tone to feel available to a solver who has skimmed the construction. 'cautious' describes a different aspect of the tone: 'a cautious tone' is real English, but caution measures how carefully a thing is said and not whether it is approved of, so the contrast the 'but' promises never arrives; there is a second reason to drop it, which is that a committee giving a transfer exactly one line is being careful rather than careless. 'anxious' describes a different aspect for the same reason - it names worry rather than a position for or against - and the passage gives the committee nothing to worry about, since it is recording an outcome it has already allowed to happen.
```

Field: `questions[4].rationale`

Before:

```text
Collocation gap. All four options are past participles and the frame takes any of them grammatically, so grammar separates nothing; three of the four - provoked, invoked, evoked - also rhyme on -oked, while summoned does not, so the set is uniform in part of speech and in semantic field without being uniform in sound. The frame is 'The rules say a second refusal sends a name to the foot of the list. The rule has not been ___', and the verb English uses for a rule that stands on the books but has not been applied to anyone is to invoke it. The three refusals recorded just before the gap supply the occasion on which it could have been used and was not. 'invoked' locks. evoked = collocation_misfit and much the strongest lure, since the two words differ by one letter, share a Latin root and are confused by fluent speakers as well as learners; but to evoke is to call up a memory, an image or a feeling, and a rule in a handbook is none of those. summoned = collocation_misfit with a real semantic pull, because summoning is also a calling-upon and a committee does summon; what it summons is a person or a meeting, never one of its own rules. provoked = collocation_misfit: one provokes a reaction, a quarrel or a response, and the noun in this frame is the rule itself rather than anything the rule might cause. Only 'invoked' takes this object.
```

After:

```text
Collocation gap. All four options are past participles and the frame takes any of them grammatically, so grammar separates nothing; three of the four - provoked, invoked, evoked - also rhyme on -oked, while summoned does not, so the set is uniform in part of speech and in semantic field without being uniform in sound. The frame is 'The rules say a second refusal sends a name to the foot of the list. The rule has not been ___', and the verb English uses for a rule that stands on the books but has not been applied to anyone is to invoke it. The three refusals recorded just before the gap supply the occasion on which it could have been used and was not. 'invoked' locks. 'evoked' is tempting because the two words differ by one letter, share a Latin root and are confused by fluent speakers as well as learners; but to evoke is to call up a memory, an image or a feeling, and a rule in a handbook is none of those. 'summoned' may seem plausible because summoning is also a calling-upon and a committee does summon; what it summons is a person or a meeting, never one of its own rules. 'provoked' does not fit this expression: one provokes a reaction, a quarrel or a response, and the noun in this frame is the rule itself rather than anything the rule might cause. Only 'invoked' takes this object.
```

### elf-b19-003 — fleet-repair-6

Field: `questions[0].rationale`

Before:

```text
TYPE-001 direct detail, key_derivation paraphrase_one_sentence, anchored on 'The pot that stands a course above its neighbours belongs to a flue that smoked, usually the shortest one on the stack, the flue from the attic bedroom, with the least warm air beneath it to do the lifting.' A recasts that in different words - a pot standing higher than its neighbours belongs to the flue that had been drawing badly - and adds nothing the passage does not supply ('smoked' is the passage's word for a flue that draws badly, and the sentence supplies the reason: the least warm air beneath it to do the lifting). The direction is counterintuitive: lay priors read a tall ornate pot as display, status or the best room, so an unread solver is pulled toward D (matching) or B (rain and birds) and away from the key. B is the causal-glue trap built on the commonest lay belief about anything fitted to the top of a chimney: that the narrowing is a weather and vermin measure. The passage assigns the narrowing a different job entirely - 'the same gases leave faster through less of an opening' - and never mentions rain, birds or a cowl; 'mainly' additionally makes B the option a pick-the-qualified solver takes, and it is wrong. C is the true-idea-from-the-wrong-place trap: it keeps the passage's real proposition (something about the stack records which flue misbehaved) and attaches it to the feature the passage explicitly disqualifies. 'Pattern tells you very little' is flat, and the following sentence gives three non-diagnostic causes of pattern - builders'-yard stock, householders telling their own door from thirty identical ones, a 1961 rebuild. A solver who has read only the first half of the passage takes C. D is the plausible-outside-knowledge trap: real chimney pots are terracotta and matching them to brick and ridge tiles is a sensible real-world thought, but the passage says nothing about matching, and what it does say about ornament runs the other way, since householders bought it to tell one door from thirty identical ones. Hedge balance: the key A is a flat, unhedged, specific claim; the only hedged option is B ('mainly') and it is wrong; no option carries any token from the completed absolutizer family, so neither pick-the-qualified nor strike-the-absolutes locates the key. Lengths under mech tokenisation: A 14, B 15, C 14, D 15 - the key is tied for shortest, ratio 1.07 against the 2.36 ELF cap.
```

After:

```text
The answer follows directly from 'The pot that stands a course above its neighbours belongs to a flue that smoked, usually the shortest one on the stack, the flue from the attic bedroom, with the least warm air beneath it to do the lifting.' A recasts that in different words - a pot standing higher than its neighbours belongs to the flue that had been drawing badly - and adds nothing the passage does not supply ('smoked' is the passage's word for a flue that draws badly, and the sentence supplies the reason: the least warm air beneath it to do the lifting). B is the causal-glue trap built on the commonest lay belief about anything fitted to the top of a chimney: that the narrowing is a weather and vermin measure. The passage assigns the narrowing a different job entirely - 'the same gases leave faster through less of an opening' - and never mentions rain, birds or a cowl. C is the true-idea-from-the-wrong-place trap: it keeps the passage's real proposition (something about the stack records which flue misbehaved) and attaches it to the feature the passage explicitly disqualifies. 'Pattern tells you very little' is flat, and the following sentence gives three non-diagnostic causes of pattern - builders'-yard stock, householders telling their own door from thirty identical ones, a 1961 rebuild. A solver who has read only the first half of the passage takes C. D is the plausible-outside-knowledge trap: real chimney pots are terracotta and matching them to brick and ridge tiles is a sensible real-world thought, but the passage says nothing about matching, and what it does say about ornament runs the other way, since householders bought it to tell one door from thirty identical ones.
```

Field: `passage`

Before:

```text
Stand across the road from a terrace and count the pots along one stack. Behind each is a separate flue dropping to its own grate, and the pots seldom match. Pattern tells you very little. Builders’ yards sold whatever was in stock, householders bought ornament to tell their own door from thirty identical ones, and a stack rebuilt in 1961 carries what came off the lorry. Height is the part worth reading. The pot that stands a course above its neighbours belongs to a flue that smoked, usually the shortest one on the stack, the flue from the attic bedroom, with the least warm air beneath it to do the lifting. Narrowing the mouth helps as well, since the same gases leave faster through less of an opening. A pot is bedded in a fillet of mortar, so a sweep could try a taller one without calling a bricklayer.
– Silas Ludderby, writing on the architecture of ordinary streets
```

After:

```text
Stand across the road from a terrace and count the pots along one stack. Under each is a separate flue dropping to its own grate, and the pots seldom match. Pattern tells you very little. Builders’ yards sold whatever was in stock, householders bought ornament to tell their own door from thirty identical ones, and a stack rebuilt in 1961 carries what came off the lorry. Height is the part worth reading. The pot that stands a course above its neighbours belongs to a flue that smoked, usually the shortest one on the stack, the flue from the attic bedroom, with the least warm air beneath it to do the lifting. Narrowing the mouth helps as well, since the same gases leave faster through less of an opening. A pot is bedded in a flaunching of mortar, so a sweep could try a taller one without calling a bricklayer.
– Silas Ludderby, writing on the architecture of ordinary streets
```

### las-b19-001 — fleet-repair-6

Field: `questions[0].rationale`

Before:

```text
Nyckeln C parafraserar första styckets ordningsföljd: arbetet gjordes sent på hösten när vattnet sjunkit undan, malmen låg ute vintern över tills frosten sprängt sönder klumparna, och först därefter rostades den. A är en riktningsvändning i tid (scope_shift/omkastad ordning): den flyttar brytningen till vårvintern och låter rostningen komma före lagringen, alltså tvärtemot texten – och är extra lockande för den som vet att tunga transporter annars gjordes på tjäle. B är overgeneralisation: texten slår uttryckligen fast att långt ifrån varje mosse bär ett skikt och att de som gör det bär det ojämnt. D är en överhedgad reservation utan stöd i texten (plausible_worldknowledge): texten säger tvärtom att skiktet inte gick att finna utan spett, eftersom det inte syns på ytan; formuleringens försiktiga ”ibland” gör den lockande utan att ge den stöd.
```

After:

```text
Nyckeln C parafraserar första styckets ordningsföljd: arbetet gjordes sent på hösten när vattnet sjunkit undan, malmen låg ute vintern över tills frosten sprängt sönder klumparna, och först därefter rostades den. A är en riktningsvändning i tid: den flyttar brytningen till vårvintern och låter rostningen komma före lagringen, alltså tvärtemot texten – och är extra lockande för den som vet att tunga transporter annars gjordes på tjäle. B generaliserar för långt: texten slår uttryckligen fast att långt ifrån varje mosse bär ett skikt och att de som gör det bär det ojämnt. D är en överdriven reservation utan stöd i texten: texten säger tvärtom att skiktet inte gick att finna utan spett, eftersom det inte syns på ytan; formuleringens försiktiga ”ibland” gör den lockande utan att ge den stöd.
```

Field: `questions[1].rationale`

Before:

```text
Nyckeln A parafraserar det första av de två utfallen: de hårdast drivna omgångarna gav inte större utan sprödare resultat, och texten anger orsaken: kolet gick in i järnet och gjorde klumpen skör. B är reversed_causality: samma två storheter, motsatt riktning (svagare drift skulle ge sprödare järn). C är overgeneralisation: texten talar om de hårdast drivna omgångarna, inte om alla, och den säger inte att de havererade – luppar bildades, men de var sprödare och sprack under släggan. D är scope_shift/metod-som-resultat: att ugnar murades ingår i upplägget, men texten redovisar två helt andra ting som utfall, och ”framför allt” gör påståendet falskt.
```

After:

```text
Nyckeln A parafraserar det första av de två utfallen: de hårdast drivna omgångarna gav inte större utan sprödare resultat, och texten anger orsaken: kolet gick in i järnet och gjorde klumpen skör. B vänder på orsakssambandet: samma två storheter, motsatt riktning (svagare drift skulle ge sprödare järn). C generaliserar för långt: texten talar om de hårdast drivna omgångarna, inte om alla, och den säger inte att de havererade – luppar bildades, men de var sprödare och sprack under släggan. D förväxlar metod med resultat: att ugnar murades ingår i upplägget, men texten redovisar två helt andra ting som utfall, och ”framför allt” gör påståendet falskt.
```

Field: `questions[2].rationale`

Before:

```text
Nyckeln D spänner över hela texten: temperaturen räckte till slaggen men inte till metallen, klumpen bakades ihop utan att någonsin rinna, utbytet per omgång blev därför litet, och huvuddelen av mödan hamnade i räckningen efteråt – samma mekanism förklarar båda leden. A är detail_as_main och sträcker dessutom ut hantverket för långt i tiden: att anläggningen var billig är ett delspår i ett enda stycke, och kolet ur tappgroparna daterar bruket till tiden mellan 300-talet och 1200-talet, medan tillverkningen flyttade från socknarna till bruken i och med hyttan. B är reversed_direction: vattenkraften var hyttans villkor, inte blästbrukets – där kostade ugnen lera, sten och ved, och den restes på nytt nästa höst. C är scope_shift: texten använder uppteckningarna för en enda upplysning och slår uttryckligen fast att de säger nästan ingenting om själva blåsningen, medan kunskapen kommer från utgrävningar och försök.
```

After:

```text
Nyckeln D spänner över hela texten: temperaturen räckte till slaggen men inte till metallen, klumpen bakades ihop utan att någonsin rinna, utbytet per omgång blev därför litet, och huvuddelen av mödan hamnade i räckningen efteråt – samma mekanism förklarar båda leden. A gör ett delspår till huvudämne och sträcker dessutom ut hantverket för långt i tiden: att anläggningen var billig är ett delspår i ett enda stycke, och kolet ur tappgroparna daterar bruket till tiden mellan 300-talet och 1200-talet, medan tillverkningen flyttade från socknarna till bruken i och med hyttan. B knyter villkoret till fel slags järnframställning: vattenkraften var hyttans villkor, inte blästbrukets – där kostade ugnen lera, sten och ved, och den restes på nytt nästa höst. C ger uppteckningarna större betydelse än texten gör: texten använder uppteckningarna för en enda upplysning och slår uttryckligen fast att de säger nästan ingenting om själva blåsningen, medan kunskapen kommer från utgrävningar och försök.
```

Field: `questions[3].rationale`

Before:

```text
Nyckeln B kräver att två uppgifter läggs ihop i den riktning texten anger: en fattigare slagg blir trögflytande vid de temperaturer ugnen orkar hålla, och en slagg som inte rinner undan blir kvar kring kornen – alltså är halten en förutsättning, inte ett slöseri. A är plausible_worldknowledge och återger just den tolkning som försöken talar emot; att en stor del stannade i avfallet är sant, men orsaken är inte vårdslöshet. C blandar ihop mätvärde och tolkning: texten säger rakt ut att Krokvalls mätvärden är oomtvistade och att det är tolkningen av dem som försöken talar emot. Alternativet är frestande för den som läser ”försöken talar emot” som att siffrorna kullkastats. D är half_right_conjunction: första ledet är rimligt – järn som stannar i slaggen ger tunga varphögar – men andra ledet motsägs, eftersom texten räknar spridningen i utbyte till det som är oklart och säger att varken malmens halt eller ugnarnas mått räcker för att förklara den.
```

After:

```text
Nyckeln B kräver att två uppgifter läggs ihop i den riktning texten anger: en fattigare slagg blir trögflytande vid de temperaturer ugnen orkar hålla, och en slagg som inte rinner undan blir kvar kring kornen – alltså är halten en förutsättning, inte ett slöseri. A bygger på en tänkbar förklaring utanför texten och återger just den tolkning som försöken talar emot; att en stor del stannade i avfallet är sant, men orsaken är inte vårdslöshet. C blandar ihop mätvärde och tolkning: texten säger rakt ut att Krokvalls mätvärden är oomtvistade och att det är tolkningen av dem som försöken talar emot. Alternativet är frestande för den som läser ”försöken talar emot” som att siffrorna kullkastats. D förenar ett rimligt första led med ett andra led som texten motsäger: första ledet är rimligt – järn som stannar i slaggen ger tunga varphögar – men andra ledet motsägs, eftersom texten räknar spridningen i utbyte till det som är oklart och säger att varken malmens halt eller ugnarnas mått räcker för att förklara den.
```

### las-b19-002 — fleet-repair-6

Field: `questions[0].rationale`

Before:

```text
KEY D: Texten gör två drag som hänger ihop. Först medges behovet rakt av – kapad lina, för kort badstege, hjärtstartaren 2,3 kilometer bort – och kravet är att bojarna, badstegen och hjärtstartaren ska köpas in. Sedan avvisas avgiften som väg dit: betalningsgraden vid ställplatsen talar emot intäktsantagandet, och en avgift vid bryggan antas flytta badandet till Stångklippan, där olyckorna faktiskt inträffar. Den uttalade alternativa finansieringen är driftsbudgeten. D återger båda leden utan att skärpa något av dem.

A (scope_shift / omvänd riktning på slutsatsen): texten granskar visserligen avgiftens storlek och intäktsantagandet i detalj, och en läsare som fastnar i sifferstycket kan tro att invändningen gäller nivån. Men slutsatsen är inte att avgiften ska justeras uppåt utan att den ska bort; en högre avgift skulle förstärka just den förflyttning till klippan som texten varnar för.

B (half_right / scope_shift – underhåll i stället för inköp): texten beskriver faktiskt två skötselfel – en kapad lina och en stege som slutar för högt – vilket gör det frestande att tolka det som att den befintliga utrustningen räcker om den underhålls. Halva ledet stämmer, men räckvidden är för snäv: texten kräver inköp av två nya bojar, ny stege och hjärtstartare, alltså komplettering, inte enbart bättre underhåll av det gamla.

C (plausible_worldknowledge): uppsättningens enda rena ja till förslaget som det ligger. Nyttoprincipen – den som badar får också betala för säkerheten – är den vanligaste invändningen mot textens linje, och en läsare som stannar i tredje stycket får dessutom intrycket att kalkylen går ihop. Texten fäller den uttryckligen på geografin: elva av fjorton tillbud har inträffat vid Stångklippan, en avgift vid bryggan väntas flytta en del av badandet just dit, och då bekostas utrustningen av dem som badar där det sällan händer något medan olycksplatsen lämnas orörd. Nyttan och kostnaden hamnar alltså på olika platser, vilket är precis det argument texten bygger sin slutsats på.
```

After:

```text
Nyckeln D: Texten gör två drag som hänger ihop. Först medges behovet rakt av – kapad lina, för kort badstege, hjärtstartaren 2,3 kilometer bort – och kravet är att bojarna, badstegen och hjärtstartaren ska köpas in. Sedan avvisas avgiften som väg dit: betalningsgraden vid ställplatsen talar emot intäktsantagandet, och en avgift vid bryggan antas flytta badandet till Stångklippan, där olyckorna faktiskt inträffar. Den uttalade alternativa finansieringen är driftsbudgeten. D återger båda leden utan att skärpa något av dem.

A vänder på slutsatsens riktning: texten granskar visserligen avgiftens storlek och intäktsantagandet i detalj, och en läsare som fastnar i sifferstycket kan tro att invändningen gäller nivån. Men slutsatsen är inte att avgiften ska justeras uppåt utan att den ska bort; en högre avgift skulle förstärka just den förflyttning till klippan som texten varnar för.

B blandar ihop underhåll med inköp: texten beskriver faktiskt två skötselfel – en kapad lina och en stege som slutar för högt – vilket gör det frestande att tolka det som att den befintliga utrustningen räcker om den underhålls. Halva ledet stämmer, men räckvidden är för snäv: texten kräver inköp av två nya bojar, ny stege och hjärtstartare, alltså komplettering, inte enbart bättre underhåll av det gamla.

C bygger på ett tänkbart resonemang utanför texten: uppsättningens enda rena ja till förslaget som det ligger. Nyttoprincipen – den som badar får också betala för säkerheten – är den vanligaste invändningen mot textens linje, och en läsare som stannar i tredje stycket får dessutom intrycket att kalkylen går ihop. Texten fäller den uttryckligen på geografin: elva av fjorton tillbud har inträffat vid Stångklippan, en avgift vid bryggan väntas flytta en del av badandet just dit, och då bekostas utrustningen av dem som badar där det sällan händer något medan olycksplatsen lämnas orörd. Nyttan och kostnaden hamnar alltså på olika platser, vilket är precis det argument texten bygger sin slutsats på.
```

Field: `questions[1].rationale`

Before:

```text
KEY A: Uppföljningen anges landa på en betalningsgrad om 31 procent. Komplementet är drygt två tredjedelar, alltså ungefär sju av tio obetalda. A uttrycker samma sak från andra hållet och är den enda av alternativen som stämmer med siffran.

B (överdriven reservation – felaktig i sak): formuleringen låter försiktig och ansvarsfull, och en läsare som är van vid att det hedgade alternativet är rätt kan välja den. Texten redovisar dock ett bestämt mätvärde; att betalningsviljan skulle ha varit omöjlig att fastställa är alltså tvärtemot vad som står.

C (quantifier_upgrade / överdrift): rätt storhet, vänd riktning. 31 procent blir här nästan alla i stället för knappt en tredjedel. Den läsningen skulle stödja förslaget i stället för att undergräva det.

D (surface_lexical_echo): skylten återkommer flera gånger i texten – vid landfästet, på ställplatsen – vilket gör påståendet bekant. Men ingenstans sägs att någon skylt togs ned; uppgiften är hämtad utifrån och saknar stöd i texten.
```

After:

```text
Nyckeln A: Uppföljningen anges landa på en betalningsgrad om 31 procent. Komplementet är drygt två tredjedelar, alltså ungefär sju av tio obetalda. A uttrycker samma sak från andra hållet och är den enda av alternativen som stämmer med siffran.

B (överdriven reservation – felaktig i sak): formuleringen låter försiktig och ansvarsfull, men försiktigheten gör inte påståendet riktigt. Texten redovisar dock ett bestämt mätvärde; att betalningsviljan skulle ha varit omöjlig att fastställa är alltså tvärtemot vad som står.

C överdriver andelen: rätt storhet, vänd riktning. 31 procent blir här nästan alla i stället för knappt en tredjedel. Den läsningen skulle stödja förslaget i stället för att undergräva det.

D återanvänder ett ord ur texten: skylten återkommer flera gånger i texten – vid landfästet, på ställplatsen – vilket gör påståendet bekant. Men ingenstans sägs att någon skylt togs ned; uppgiften är hämtad utifrån och saknar stöd i texten.
```

### las-b19-003 — fleet-repair-6

Field: `questions[0].rationale`

Before:

```text
KEY D parafraserar den planterade målsatsen i fjärde stycket: ”I de fall där skriften gick att jämföra med annat i mappen härrörde yrkesordet i regel från abonnenten själv.” Satsen är hedgad (i regel), riktad (abonnenten skrev, inte kassören) och avgränsad (endast där skriften gick att jämföra). D behåller båda förbehållen och byter ut innehållsorden.

A = reversed_causality (aktörsbyte): vänder pilen och låter kassören skriva titeln. Frestande därför att kassören faktiskt nämns i andra stycket som en av de tre tänkbara mekanismerna, och därför att A bär samma försiktiga form som nyckeln (i de flesta fall, tycks) – men jämförelsen av skriften pekar åt motsatt håll.

B = detail_as_main (restpost gjord till fynd): texten nämner att ett ord i ett tjugotal fall hade strukits över och ett annat skrivits ovanför, men den säger uttryckligen att överstrykningarna lika gärna kan vara ändrade beslut som rättelser av en felläsning och att materialet inte svarar på den frågan. B gör den ena av de två läsningarna till ett avgjort fynd, vilket är just vad texten avstår från. Frestande för den som läser restposten som en slutsats.

C = refuted_hypothesis_as_finding (avvisad hypotes ur texten gjord till fynd): en förteckning över godkända beteckningar var en av författarens egna hypoteser, och texten avvisar den med ”ingen lista över godkända ord”. Frestande för den som minns hypotesen men inte prövningen.
```

After:

```text
Nyckeln D parafraserar meningen i fjärde stycket: ”I de fall där skriften gick att jämföra med annat i mappen härrörde yrkesordet i regel från abonnenten själv.” Satsen är garderad (i regel), riktad (abonnenten skrev, inte kassören) och avgränsad (endast där skriften gick att jämföra). D behåller båda förbehållen och byter ut innehållsorden.

A byter aktör: det vänder pilen och låter kassören skriva titeln. Frestande därför att kassören faktiskt nämns i andra stycket som en av de tre tänkbara mekanismerna, och därför att A bär samma försiktiga form som nyckeln (i de flesta fall, tycks) – men jämförelsen av skriften pekar åt motsatt håll.

B gör en öppen delfråga till ett avgjort fynd: texten nämner att ett ord i ett tjugotal fall hade strukits över och ett annat skrivits ovanför, men den säger uttryckligen att överstrykningarna lika gärna kan vara ändrade beslut som rättelser av en felläsning och att materialet inte svarar på den frågan. B gör den ena av de två läsningarna till ett avgjort fynd, vilket är just vad texten avstår från. Frestande för den som läser restposten som en slutsats.

C gör en avvisad hypotes till ett fynd: en förteckning över godkända beteckningar var en av författarens egna hypoteser, och texten avvisar den med ”ingen lista över godkända ord”. Frestande för den som minns hypotesen men inte prövningen.
```

Field: `questions[1].rationale`

Before:

```text
KEY B spänner över hela essäns rörelse: misstanken formuleras i andra stycket (tre tänkbara mekanismer), prövas i fjärde och avskrivs i femte med ”Ingen av mina tre mekanismer fanns alltså. Jag får ge Rämnestad rätt, och den förklaring som från början låg närmast är också den som står kvar.” Den förklaring hon återvänder till är den som beskrivs som närmast till hands, alltså fåfängan. B är ett rakt, ohedgat påstående – nyckeln är här inte den försiktigaste formuleringen.

A = surface_lexical_echo (omvänd hållning): texten säger ordagrant att hon ”höll fast vid misstanken länge” (andra stycket) och att hon tog arkivariens snabba svar för ett tecken på att han aldrig hade prövat saken (tredje stycket), vilket lockar den som stannar strax före ”Där hade jag fel”. Båda leden gäller tiden före prövningen, och slutsatsen är den motsatta.

C = detail_as_main: texten säger att materialet inte svarar – men det gäller överstrykningarna, en delfråga i restposten, inte huvudfrågan. Frestande därför att essän slutar i öppna detaljer, men huvudfrågan avgörs uttryckligen. Det är också den försiktigt klingande formuleringen i uppsättningen, och den är fel.

D = genre_gesture (essägesten): en sammanjämkning av typen ”båda behövs” är den vanliga essägesten och låter rimlig, men texten säger att ingen av hennes tre mekanismer fanns – det finns inget kvar att jämka ihop med.
```

After:

```text
Nyckeln B spänner över hela essäns rörelse: misstanken formuleras i andra stycket (tre tänkbara mekanismer), prövas i fjärde och avskrivs i femte med ”Ingen av mina tre mekanismer fanns alltså. Jag får ge Rämnestad rätt, och den förklaring som från början låg närmast är också den som står kvar.” Den förklaring hon återvänder till är den som beskrivs som närmast till hands, alltså fåfängan.

A återanvänder textens ord men vänder på hållningen: texten säger ordagrant att hon ”höll fast vid misstanken länge” (andra stycket) och att hon tog arkivariens snabba svar för ett tecken på att han aldrig hade prövat saken (tredje stycket), vilket lockar den som stannar strax före ”Där hade jag fel”. Båda leden gäller tiden före prövningen, och slutsatsen är den motsatta.

C gör en delfråga till huvudfråga: texten säger att materialet inte svarar – men det gäller överstrykningarna, en delfråga i restposten, inte huvudfrågan. Frestande därför att essän slutar i öppna detaljer, men huvudfrågan avgörs uttryckligen. Det är också den försiktigt klingande formuleringen i uppsättningen, och den är fel.

D tillskriver essän en sammanjämkande slutsats: en sammanjämkning av typen ”båda behövs” är den vanliga essägesten och låter rimlig, men texten säger att ingen av hennes tre mekanismer fanns – det finns inget kvar att jämka ihop med.
```

## Final verification and scope handoff — 2026-10-06

- Reconfirmed starting HEAD unchanged, all 14 candidate digests match the tested
  bytes, and `git diff --check` passes. Every tracked edit is under batch18,
  batch19 or RETIRED.json; the only new task files are this worklog and the two
  dated mechanical-verdict files. Pre-existing runtime/skill files remain untouched.
- A repeated lane CI run after the records/evidence changes reproduces exactly
  **187 failed, 1,291 passed, 7 xfailed** (23.28s). The first attempt to run the
  isolated probe was inadvertently launched with the lane as its working directory;
  it is this unchanged-lane repetition, not evidence for the proposed patch.
- The correctly isolated `/tmp/.../vocabulary-probe` run, with only the proposed
  vocabulary addition, reports **1,474 passed, 4 failed, 7 xfailed** (21.41s).
  All 187 vocabulary failures disappear. Its four failures are bundle-builder
  tests rejecting the temporary directory because it is not a Git worktree;
  those four pass in the actual lane. This diagnostic is not a claim that the
  required lane CI has passed, and no test or worktree check was bypassed.
- The scope-extension question remains unanswered. No elapsed time was treated
  as permission. The exact proposed patch follows for a concrete owner decision.
  Once authorised, apply it and rerun the required selection in the actual lane.
  Until then, full acceptance is blocked; the worklogs/ledgers explicitly say so.

```diff
--- a/pipeline/synthetic/gates/scripts/lint_learner_output.py
+++ b/pipeline/synthetic/gates/scripts/lint_learner_output.py
@@ -153,6 +153,9 @@
     "short_text_1q", "society_commentary", "stance_inversion", "stem_lexis_note",
     "too_far", "too_literal", "true_but_distorted", "two_step_leap", "umbrella_decoy",
     "whole_text_gist", "wrong_logic", "wrong_transfer", "zero_sum_displacement",
+    # Batch18/19 labels retained in internal adjudication metadata.
+    "misplaced_evidence_limit", "omkastad_ordning", "reversed_inversion",
+    "reversed_order_timing", "stem_entailment_audit", "unsupported_condition",
 )
 _TIER1 = frozenset(_fold(x) for x in _TAXONOMY_STEMS + _TAXONOMY_LABELS)
 
```

### git diff --stat

```text
 pipeline/synthetic/RETIRED.json                    |  6 +++
 pipeline/synthetic/batches/batch18/ADJUDICATION.md | 50 +++++++++++++++++
 .../synthetic/batches/batch18/BRIEF-ADDENDUM.md    | 39 ++++++++++++++
 pipeline/synthetic/batches/batch18/STATUS.md       | 56 +++++++++++++++++++
 .../batches/batch18/candidates/elf-b18-001.json    | 27 +++++++++-
 .../batches/batch18/candidates/elf-b18-002.json    | 48 +++++++++++++++--
 .../batches/batch18/candidates/elf-b18-003.json    | 20 ++++++-
 .../batches/batch18/candidates/elf-b18-004.json    | 27 +++++++++-
 .../batches/batch18/candidates/las-b18-001.json    | 41 ++++++++++++--
 .../batches/batch18/candidates/las-b18-002.json    | 27 +++++++++-
 .../batches/batch18/candidates/las-b18-003.json    | 27 +++++++++-
 pipeline/synthetic/batches/batch19/ADJUDICATION.md | 53 ++++++++++++++++++
 .../synthetic/batches/batch19/BRIEF-ADDENDUM.md    | 39 ++++++++++++++
 pipeline/synthetic/batches/batch19/STATUS.md       | 62 ++++++++++++++++++++++
 .../batches/batch19/candidates/elf-b19-001.json    | 27 +++++++++-
 .../batches/batch19/candidates/elf-b19-002.json    | 48 +++++++++++++++--
 .../batches/batch19/candidates/elf-b19-003.json    | 27 +++++++++-
 .../batches/batch19/candidates/las-b19-001.json    | 52 ++++++++++++++++--
 .../batches/batch19/candidates/las-b19-002.json    | 36 ++++++++++++-
 .../batches/batch19/candidates/las-b19-003.json    | 36 ++++++++++++-
 20 files changed, 713 insertions(+), 35 deletions(-)
```

`git diff --stat` omits these three new, untracked task artifacts:

- `docs/worklog/hpf-jnkq.md`
- `pipeline/synthetic/batches/batch18/verdicts-mech-owner-2026-10-06.jsonl` (42 records)
- `pipeline/synthetic/batches/batch19/verdicts-mech-owner-2026-10-06.jsonl` (36 records)

## Handoff

Scoped implementation is complete and uncommitted. Required CI acceptance is
blocked on the six-label vocabulary addition outside the assigned paths, with a
concrete patch and an operator scope question pending. Independent exact-head
review and the later infold PR remain subsequent work; no merge/import/deploy is
claimed. Resume from this lane's unchanged HEAD and current uncommitted bytes;
do not rerun generation, retire another unit, or rewrite the preserved history.

## Bead note (pending)

Implemented the batch18/19 rulings uncommitted: 13 kept units lint clean, mech 78/78, 14 stems synced; elf-b19-004 retired with history intact. Originality, registry, terms, ledgers and standing rules updated. CI remains blocked: 187 failed, 1,291 passed, 7 xfailed from six pre-existing lint vocabulary gaps. The prepared three-line fix is outside the brief's scope; operator decision is pending. No infold performed.
LANE DONE: hpf-jnkq


## Scope extension and verification — 2026-10-06, round 2

The coordinator explicitly approved the prepared vocabulary patch. Applied
`/tmp/hpf-jnkq-u5g8hw0c/proposed-vocabulary.patch` exactly: one explanatory
comment and exactly these six entries appended to `_TAXONOMY_LABELS` in
`pipeline/synthetic/gates/scripts/lint_learner_output.py`:

- `misplaced_evidence_limit`
- `omkastad_ordning`
- `reversed_inversion`
- `reversed_order_timing`
- `stem_entailment_audit`
- `unsupported_condition`

No other lint source bytes changed. AST comparison confirms the old vocabulary
is retained in order, followed by exactly these six labels. All prior candidate,
ledger, brief, manifest and mechanical-verdict bytes are unchanged from round 1;
no further mechanical or sheet rerun was needed. The worklog's previous bytes,
including its original frontmatter and first pending note, remain an exact prefix.
This dated result supersedes the earlier CI-blocked status and pending scope
question; those statements remain as historical evidence.

[S:ci-dfiy6|W:hpf-jnkq|H:scope-extension-verification|E:1478 passed; store 2/74; learner 13 clean]

All requested commands ran in the actual lane with `PYTHONDONTWRITEBYTECODE=1`.
This is the lane CI result, not the earlier isolated probe. Captured output is in
`/tmp/hpf-jnkq-u5g8hw0c/round2/`.

```sh
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q -p no:cacheprovider
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations --strict
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py /tmp/hpf-jnkq-u5g8hw0c/round2/learner
```

| Check | Result | Exit |
|---|---|---|
| Exact required CI selection | **1,478 passed, 7 xfailed in 21.97s**, zero failures | 0 |
| Store, default | **Exactly 2 findings in 27 files** | 1 (expected findings) |
| Store, strict | **Exactly 74 findings in 27 files** | 1 (expected findings) |
| Default learner projection | **Clean — 13 files** | 0 |
| Patch and artifact integrity | Exactly six vocabulary additions; all round-1 artifacts unchanged; `git diff --check` clean | 0 |

The default store findings remain the two L2-HEDGAT occurrences in
`data/explanations/host-2017.json`, at
`$.host-2017-verb2-MEK-025.distractors[2].why_wrong` and
`$.host-2017-verb2-MEK-025.steps[2].text`. The 27-file count excludes the store's
underscore-prefixed metadata file by the lint's normal collection rules.
No explanation-store content was changed.

The learner projection was rebuilt from the current candidate bytes using the
same explicitly verified fields documented above: title, passage, and complete
question objects (q_index, prompt, option letters/text, key and rationale).
The current retirement manifest excludes elf-b19-004, leaving seven batch18 and
six batch19 units. No internal metadata or repair history entered that projection.

### Round-2 evidence digests

| Artifact | SHA-256 |
|---|---|
| Lint source | `76b986534dd90ca21abaaf37dc20b9f54a5cb6c5e7e6bb2295b9333a05ea877b` |
| Actual-lane CI output | `31a10d578b12f19e1cee5be865dadb6b9c1be63def65c8abdd3d84ad7e74ecf6` |
| Store default output | `b59592763f6449d8cfb2872e8494781acda4b0b9ecc9d6a2f6bcf55255c8ccf2` |
| Store strict output | `ae99eb3838b8b2efcfbdf9d82f3a1aa31b4bea75aca28ba670fb4693df748ad9` |
| Learner lint output | `e58bd1fff799eeec94c22408f348cb80f910611676b9d3ba86550db0c15e9d49` |

### Updated git diff --stat

```text
 pipeline/synthetic/RETIRED.json                    |  6 +++
 pipeline/synthetic/batches/batch18/ADJUDICATION.md | 50 +++++++++++++++++
 .../synthetic/batches/batch18/BRIEF-ADDENDUM.md    | 39 ++++++++++++++
 pipeline/synthetic/batches/batch18/STATUS.md       | 56 +++++++++++++++++++
 .../batches/batch18/candidates/elf-b18-001.json    | 27 +++++++++-
 .../batches/batch18/candidates/elf-b18-002.json    | 48 +++++++++++++++--
 .../batches/batch18/candidates/elf-b18-003.json    | 20 ++++++-
 .../batches/batch18/candidates/elf-b18-004.json    | 27 +++++++++-
 .../batches/batch18/candidates/las-b18-001.json    | 41 ++++++++++++--
 .../batches/batch18/candidates/las-b18-002.json    | 27 +++++++++-
 .../batches/batch18/candidates/las-b18-003.json    | 27 +++++++++-
 pipeline/synthetic/batches/batch19/ADJUDICATION.md | 53 ++++++++++++++++++
 .../synthetic/batches/batch19/BRIEF-ADDENDUM.md    | 39 ++++++++++++++
 pipeline/synthetic/batches/batch19/STATUS.md       | 62 ++++++++++++++++++++++
 .../batches/batch19/candidates/elf-b19-001.json    | 27 +++++++++-
 .../batches/batch19/candidates/elf-b19-002.json    | 48 +++++++++++++++--
 .../batches/batch19/candidates/elf-b19-003.json    | 27 +++++++++-
 .../batches/batch19/candidates/las-b19-001.json    | 52 ++++++++++++++++--
 .../batches/batch19/candidates/las-b19-002.json    | 36 ++++++++++++-
 .../batches/batch19/candidates/las-b19-003.json    | 36 ++++++++++++-
 .../synthetic/gates/scripts/lint_learner_output.py |  3 ++
 21 files changed, 716 insertions(+), 35 deletions(-)
```

The worklog and the two dated mechanical-verdict files remain untracked and are
not included in that tracked diff summary. All changes are uncommitted; HEAD is
still `e8f872cafa09485fd32edc47a9c99c1461c6749d`. No Gas City command, network
operation, git write, import, merge or deploy was performed in round 2.

### Round-2 handoff

The scope-extension blocker is resolved and the required CI selection now passes.
The store finding counts are unchanged and all 13 kept learner projections are
clean. Independent exact-head review and the later infold PR remain subsequent
work; no independent review, import or merge is claimed by this implementation.

## Bead note (pending, after scope extension)

Approved six-label vocabulary patch applied exactly; changes remain uncommitted. Required CI: 1,478 passed, 7 xfailed. Store probes: exactly 2 default and 74 strict findings, each in 27 files. Refreshed learner projection: clean, 13 kept units. Earlier CI blocker resolved; round-1 artifacts unchanged. No gc commands or infold.
LANE DONE: hpf-jnkq (round 2)
