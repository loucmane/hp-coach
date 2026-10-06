---
bead: hpf-frjd
project: hpfetcher
status: implementation_complete
---

# Worklog — hpf-frjd

## Findings

- 2026-10-06: implementation follows the owner brief at
  `/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/briefs/hpf-frjd.md`.
  Lane HEAD confirmed as `b6776af7a82b9864c3c204c4b4ea4c58a280732b`.
- Work stays uncommitted in the lane. No network, Beads/runtime commands,
  independent review dispatch, or package approval is part of this task.
- The source unit's q3/B and q4/A repeat the q2/D glow vocabulary. Q4 also
  contrasts a two-factor key with distractors of noticeably different form.
- Batch17 has seven stems sheets but no blind/ or distractor/ directories.
- Batch16's flags file is a historical list of findings and provenance,
  without per-unit status fields. Preserve those entries; record the owner's
  disposition in the appended adjudication and status sections.

## Decisions

- Change only q3/q4 option text, the q4 rationale portions affected by the
  wording, and an appended `generator_meta.repair_log` entry. Preserve the
  passage, title, stems, keys, q1/q2, and prior generator metadata.
- Keep q3's causal comparison and each distractor's original trap. Remove
  glow terminology, avoid replacing it with another shared content-word
  chain, and give q4 distractors comparable qualifications and clause depth.
- Generate all fourteen missing blind/distractor sheets from final bytes
  using the documented house shape; rebuild the repaired unit's stems sheet.
- Preserve old ADJUDICATION.md and STATUS.md text byte-for-byte and append
  dated owner rulings. Package17 approval remains suspended pending the
  separate blind G-STEM re-check of las-b17-001.

## Assembly rule clarification

Original batch17 item 6, preserved verbatim here (the source wraps before
`process rule.`):

> Written dispositions owed for any named adjacency per the 2026-08-26 process rule.

The 2026-10-06 owner ruling classifies this as a standing process rule,
not a unit-specific obligation. Replace that item with “Written dispositions
are required for any named adjacency per the 2026-08-26 process rule.”
Append a dated explanation and link to this original quotation in ASSEMBLY.md.
The hardened checker scans quoted historical text too, so putting the exact
old quotation back in ASSEMBLY.md would recreate the same finding. Keeping
the quotation here preserves the record without altering or evading the gate.

Baseline outputs (before any content or assembly changes):

```text
DISPOSITION-OWED <no unit named>: line 55: Written dispositions owed for any named adjacency per the 2026-08-26 process rule.
assembly-dispositions: 1 undischarged of 1 marker(s)

DISPOSITION-OWED <no unit named>: line 48: one written disposition owed per the 2026-08-26 process rule.
DISPOSITION-OWED <no unit named>: line 50: disposition owed).
assembly-dispositions: 2 undischarged of 3 marker(s)
```

Both baseline commands exited 1. Batch16's two unscoped markers predate
this task; its assembly and verdicts will stay unchanged.

## Option changes (full before/after text)

| Option | Before | After | Reason |
|---|---|---|---|
| q3/A | Verkan var ungefär densamma, och badet krävde varken nytt avtal eller längre transport. | Metoderna gav likvärdiga resultat, men behandlingen kunde införas med befintliga utrymmen och personal. | Keep equivalent performance plus practical fit; remove the word längre repeated in q2 and state the passage's room/staff evidence. |
| q3/B | Badet visade sig släcka glöden bättre än det norra virket gjorde. | Behandlingen gav bättre resultat än materialet från norr och valdes därför. | Remove the explicit glow bridge; retain the false claim that superior performance caused the choice. |
| q3/C | Skillnaden i verkan var stor, men badet var ändå enklare att införa. | Resultaten skilde sig kraftigt, men behandlingen var ändå enkel att införa. | Retain the half-right conjunction: practical ease is true, a substantial performance difference is false; match A's clause depth. |
| q3/D | Priset på asp från socknarna norrut hade stigit så att virket inte gick att få. | Virket från de nordliga socknarna hade blivit så kostsamt att det inte gick att köpa. | Remove asp and price wording shared with q2; retain the unsupported upgrade from an 18% premium to unavailable purchases. |
| q4/A | Efterglöden var den svåraste tekniska frågan i hela tändsticksindustrin. | Trots tekniska framsteg tycks brandrisken ha varit det svåraste problemet för branschen som helhet. | Remove afterglow vocabulary; keep detail-as-main and unsupported industry-wide ranking, with a qualified concession comparable in depth to the key. |
| q4/B | Fabriken avvisade varje förändring som skulle ha krävt en ny maskin. | Tillverkningen förändrades på flera sätt, men företaget avstod från att byta ut maskiner. | Replace the overt universal with a two-clause claim; retain the rejection-of-machine-change trap contradicted by the 1938 replacement. |
| q4/C | Fabrikens val avgjordes av virkets egenskaper och av vad anläggningen redan rymde. | Råvarans beskaffenhet och anläggningens förutsättningar satte ramarna för de beslut som fattades. | Preserve the two grounded constraints in the key, using a compact affirmative sentence without q3's content vocabulary. |
| q4/D | Priset på virket tycks ha styrt fabrikens val, medan träets egenskaper spelade mindre roll. | Ekonomiska överväganden tycks ha vägt tyngst, medan kraven på råvarans kvalitet kom i andra hand. | Retain the hedged cost-over-properties inversion; use a comparable two-factor synthesis so this form no longer singles out C. |

Q3 rationale is unchanged: it still explains the same four claims and traps.
Q4's C/A/B explanation is synchronized; its original key evidence and
D explanation are preserved. Historical hedge-map prose is retained, with
the current option structure explained in the dated repair log.

## Progress and verification — 2026-10-06

[S:ci-0r6rj|W:hpf-frjd|H:implementation|E:final-byte checks below]

Final content check: q3/C uses “kraftigt” to contradict the passage's small
effect difference explicitly. Q4/B now says the factory abstained from machine
replacement, directly contradicted by the 1938 replacement; this avoids an
arguable distinction between a new machine and a new working method.

The runbook invokes `run_mech.py`, which runs `mech.py`. The lane has no
`data/parsed/`; the authentic corpus was read from the existing primary
checkout at `/home/loucmane/dev/hpfetcher/data/parsed`. M-ECHO used the lane's
final-unit corpus, including this repair, and indexed 114 units. No gate was
skipped. All six mechanical verdicts pass with empty findings.

### Sheet synchronization

```sh
python3 pipeline/synthetic/gates/scripts/check_sheet_sync.py pipeline/synthetic/batches/batch17
```

Exit 0:

```text
sheet-sync: OK — 7 unit(s) in sync
```

### Batch17 assembly

```sh
python3 pipeline/synthetic/gates/scripts/check_assembly_dispositions.py pipeline/synthetic/batches/batch17/ASSEMBLY.md pipeline/synthetic/batches/batch17/verdicts.jsonl
```

Exit 0:

```text
assembly-dispositions: OK — 0 marker(s), all discharged
```

### Batch16 assembly

```sh
python3 pipeline/synthetic/gates/scripts/check_assembly_dispositions.py pipeline/synthetic/batches/batch16/ASSEMBLY.md pipeline/synthetic/batches/batch16/verdicts.jsonl
```

Exit 1:

```text
DISPOSITION-OWED <no unit named>: line 48: one written disposition owed per the 2026-08-26 process rule.
DISPOSITION-OWED <no unit named>: line 50: disposition owed).
assembly-dispositions: 2 undischarged of 3 marker(s)
```

### Mechanical gates on repaired final bytes

```sh
python3 pipeline/synthetic/gates/scripts/run_mech.py pipeline/synthetic/batches/batch17/candidates-final/las-b17-001.json --parsed-dir /home/loucmane/dev/hpfetcher/data/parsed --p5-corpus-dir auto
```

Exit 0:

```text
M-ECHO: indexed 114 shipped unit(s)
{"candidate_id": "las-b17-001", "gate": "M-SCHEMA", "target": "passage", "verdict": "pass", "findings": [], "executed_by": "mech.py/1", "executed_at": "2026-10-06T17:04:37+00:00"}
{"candidate_id": "las-b17-001", "gate": "M-BANDS", "target": "passage", "verdict": "pass", "findings": [], "executed_by": "mech.py/1", "executed_at": "2026-10-06T17:04:37+00:00"}
{"candidate_id": "las-b17-001", "gate": "M-TELL", "target": "unit", "verdict": "pass", "findings": [], "executed_by": "mech.py/1", "executed_at": "2026-10-06T17:04:37+00:00"}
{"candidate_id": "las-b17-001", "gate": "M-FORM", "target": "unit", "verdict": "pass", "findings": [], "executed_by": "mech.py/1", "executed_at": "2026-10-06T17:04:37+00:00"}
{"candidate_id": "las-b17-001", "gate": "M-ECHO", "target": "unit", "verdict": "pass", "findings": [], "executed_by": "mech.py/1", "executed_at": "2026-10-06T17:04:37+00:00"}
{"candidate_id": "las-b17-001", "gate": "M-PLAGIARISM", "target": "passage", "verdict": "pass", "findings": [], "executed_by": "mech.py/1", "executed_at": "2026-10-06T17:04:37+00:00"}
```

### Learner-visible text lint

```sh
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py /tmp/hpf-frjd/learner-visible.json
```

Exit 0:

```text
learner-output lint: clean — 1 file(s)
```

The batch16 output is identical to the pre-edit baseline: two unscoped
markers (lines 48 and 50) out of three. Existing G-REGISTER dispositions
cannot supply a missing unit from another sentence under the hardened
gate. Neither its assembly nor verdict stream was changed. Batch17 has
zero unit-specific markers after the authorized standing-rule clarification.

Lint input was an exact JSON projection of the repaired title, passage
(including byline/glossary), all four prompts and all sixteen option texts.
Internal rationales and generator metadata were excluded under the existing
Layer-2 contract; no rendered explanation output is added by this task.

### Preservation, lengths, lexical check and artifact digests

Checked against `git show HEAD:<path>` using read-only Git operations.
The lexical intersection check checks exact tokens and makes no claim about
semantic blind answerability; the independent G-STEM re-check remains pending.

```text
Scope: only 8 q3/q4 option texts, affected q4 rationale and 1 repair-log entry changed.
Preserved: passage, title, every stem/key, q1/q2 in full, q3 rationale and all prior generator metadata.
History: all four adjudication/status files append-only; 13 other final units, six other stems sheets, both flags/verdict streams and batch16 assembly byte-identical to HEAD.
q1 option tokens: A=10, B=8, C=8, D=7
q2 option tokens: A=5, B=7, C=4, D=6
q3 option tokens: A=13, B=11, C=11, D=15
q4 option tokens: A=14, B=13, C=12, D=15
q2/q3 exact shared tokens (function words only): att, de, var, än
q2/q4 exact shared tokens (function words only): att, de, i
q3/q4 exact shared tokens (function words only): att, de, det, från, men, och
No glöd/efterglöd vocabulary in q3/q4 options; this lexical check is not an independent blind G-STEM review.
SHA256 pipeline/synthetic/batches/batch17/candidates-final/las-b17-001.json b71c856a0d1f62cc4a16a69852cd7a5c633176af2d7cffaf5cc90cc81671ff4f
SHA256 pipeline/synthetic/batches/batch17/stems/las-b17-001.json 8e97c4f0ac55ff0f937aae8059aef534f894f00ae67f58ea192dcda7d38efabc
SHA256 pipeline/synthetic/batches/batch17/blind/las-b17-001.json bbbbda55a4106529f3ff399ff4d1f6a8bb0d05bd404e3645eec7dfefb076ea7d
SHA256 pipeline/synthetic/batches/batch17/distractor/las-b17-001.json 00edb21cdc9de8514160f66c65dbb61cce0018c8ff9827943e6acc60242beaf2
Diff scope and whitespace: PASS; changes limited to permitted paths.
```

### Diff and generated-file scope

```text
 pipeline/synthetic/batches/batch16/ADJUDICATION.md | 29 ++++++++
 pipeline/synthetic/batches/batch16/STATUS.md       | 17 +++++
 pipeline/synthetic/batches/batch17/ADJUDICATION.md | 41 +++++++++++
 pipeline/synthetic/batches/batch17/ASSEMBLY.md     | 14 +++-
 pipeline/synthetic/batches/batch17/STATUS.md       | 16 ++++
 .../batch17/candidates-final/las-b17-001.json      | 86 +++++++++++++++++++---
 .../batches/batch17/stems/las-b17-001.json         | 16 ++--
 7 files changed, 199 insertions(+), 20 deletions(-)
```

`git diff --check` passes. The stat covers seven tracked files only.
The new `docs/worklog/hpf-frjd.md` is untracked. Fourteen new JSON sheets
(seven each under `batch17/blind/` and `batch17/distractor/`) exist on disk
and pass sheet-sync, but root `.gitignore` lines 84–85 ignore those generated
directories; they do not appear in the stat. No index writes or ignore-policy
changes were made. Preserve those files for the later review, or regenerate
them with the recipe below if transferring only tracked diffs.

### Regenerating review sheets and the lint projection

Run from the lane root; the sheet recipe preserves all other stems sheets.

```python
import json
from pathlib import Path

batch = Path("pipeline/synthetic/batches/batch17")
for path in sorted((batch / "candidates-final").glob("*.json")):
    candidate = json.loads(path.read_text())
    for kind in ("blind", "distractor", "stems"):
        if kind == "stems" and path.stem != "las-b17-001":
            continue
        fields = ["candidate_id", "section"]
        if kind != "stems":
            fields += (["family"] if kind == "distractor" else []) + ["title", "passage"]
        sheet = {k: candidate[k] for k in fields if k in candidate}
        qfields = ["q_index", "prompt", "options"] + (["key"] if kind == "distractor" else [])
        sheet["questions"] = [{k: q[k] for k in qfields if k in q} for q in candidate["questions"]]
        target = batch / kind / path.name
        target.parent.mkdir(exist_ok=True)
        ending = "\n" if not target.exists() or target.read_text().endswith("\n") else ""
        target.write_text(json.dumps(sheet, ensure_ascii=False, indent=1) + ending)

candidate = json.loads((batch / "candidates-final/las-b17-001.json").read_text())
learner = {k: candidate[k] for k in ("title", "passage")}
learner["questions"] = [
    {"prompt": q["prompt"], "options": [o["text"] for o in q["options"]]}
    for q in candidate["questions"]
]
output = Path("/tmp/hpf-frjd/learner-visible.json")
output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(learner, ensure_ascii=False, indent=2) + "\n")
```

### Required regression suite

```sh
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q -p no:cacheprovider
```

Exit 0 on the final content; bytecode writing disabled with
`PYTHONDONTWRITEBYTECODE=1`. Output:

```text
1478 passed, 7 xfailed in 21.20s
```

## Handoff

Implementation is complete and uncommitted at the unchanged lane HEAD
`b6776af7a82b9864c3c204c4b4ea4c58a280732b`. No Beads write was attempted,
as directed; the note below is pending for the coordinator. Existing
untracked runtime/skill files were preserved. No gate code, verdict stream,
other unit content, or frozen authority state changed.

The later, separate bead must perform the independent blind G-STEM re-check
of las-b17-001 using the regenerated stems sheet. Do not treat this worklog,
the repair reasoning, or the mechanical passes as a blind review. Package
approval remains suspended until that re-check passes. The batch16 assembly
findings predate this task and remain documented without an unauthorized
assembly repair. The generated-sheet recipe above supports transfer to
another checkout without changing repository ignore rules.

## Bead note (pending)

Implemented q3/q4 repair, synchronized all 7 units, and recorded owner rulings append-forward. Keys/passage/stems unchanged. Mech 6/6, lint clean, tests 1478 passed/7 xfailed. Batch17 assembly clear; batch16 retains two pre-existing unscoped markers. Package approval stays suspended pending the separate blind G-STEM re-check. Changes uncommitted; new blind/distractor sheets exist as ignored generated files in the lane.
LANE DONE: hpf-frjd
