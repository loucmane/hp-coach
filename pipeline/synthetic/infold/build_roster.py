#!/usr/bin/env python3
"""Build the P5 infold approval roster (approval-roster.json + ROSTER.md).

docs/p5-infold-design.md §4 row 1 (export contract), using §2 (inventory),
§C and §F; bead hpf-535m. One row per candidate unit in batches 1–19 —
batches 1–17 from candidates-final/, 18–19 from candidates/ — carrying the
SHA-256 of its exact bytes, a digest of its student-facing content, its
revision, its approval status with the file:line evidence behind it, its
RETIRED.json flag and its exclusion pairs.

Approval comes from recorded evidence, never from a directory name or an old
promote PASS:
  approved                    an explicit owner ruling (batches 14–19)
  pending-owner-ratification  legacy shipped units (batches 1–13): the
                              whole-bank master records recommendations, not
                              an owner response; the owner ratifies the exact
                              rows in the PR 1 review
  retired                     listed in RETIRED.json; retirement always wins

The census must equal the design's §2 table, batch by batch, or the build
fails. Evidence line numbers are resolved from quoted anchors at build time:
a moved line updates the roster, a vanished or ambiguous one fails the build.

  python3 pipeline/synthetic/infold/build_roster.py          # write both files
  python3 pipeline/synthetic/infold/build_roster.py --check  # exit 1 if stale

Revisions: every unit is r1. A unit whose student-facing content (title,
passage, prompts, options, keys) changes needs a higher revision in REVISIONS
— the build refuses to reuse a revision for different content — and a bumped
revision stays pending until a ruling is recorded for it. A revision is a
plain integer from 1 to MAX_REVISION (99), the r<revision> segment of every
qid: this build and the exporter refuse anything else (0, a negative, a bool,
a float, a string, nested data). Stdlib only.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

INFOLD_DIR = Path(__file__).resolve().parent
REPO_ROOT = INFOLD_DIR.parents[2]
ROSTER_PATH = INFOLD_DIR / "approval-roster.json"
ROSTER_MD_PATH = INFOLD_DIR / "ROSTER.md"
BUILDER_REL = "pipeline/synthetic/infold/build_roster.py"
DESIGN_DOC_REL = "docs/p5-infold-design.md"
RETIRED_REL = "pipeline/synthetic/RETIRED.json"
MASTER_REL = "pipeline/synthetic/ADJUDICATION-MASTER.md"
FORMAT = "p5-approval-roster-v1"

BATCHES = range(1, 20)
LEGACY_BATCHES = range(1, 14)
UNIT_ID = re.compile(r"(las|elf)-b(\d+)-(\d{3})")
SECTION_OF_PREFIX = {"las": "LÄS", "elf": "ELF"}

APPROVED = "approved"
PENDING = "pending-owner-ratification"
RETIRED = "retired"

# docs/p5-infold-design.md §2, per batch: retained units / questions per
# section, and retired units / questions.
EXPECTED_CENSUS = {
    1: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    2: {"LÄS": (2, 4), "ELF": (4, 12), "retired": (0, 0)},
    3: {"LÄS": (3, 8), "ELF": (3, 7), "retired": (0, 0)},
    4: {"LÄS": (2, 4), "ELF": (3, 11), "retired": (0, 0)},
    5: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    6: {"LÄS": (2, 4), "ELF": (3, 7), "retired": (2, 9)},
    7: {"LÄS": (3, 8), "ELF": (3, 7), "retired": (1, 5)},
    8: {"LÄS": (2, 4), "ELF": (3, 7), "retired": (2, 9)},
    9: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    10: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    11: {"LÄS": (2, 4), "ELF": (4, 12), "retired": (1, 4)},
    12: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    13: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    14: {"LÄS": (3, 12), "ELF": (2, 10), "retired": (1, 5)},
    15: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    16: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    17: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    18: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    19: {"LÄS": (3, 8), "ELF": (3, 11), "retired": (1, 1)},
}
EXPECTED_TOTALS = {"retained": (120, 340), "LÄS": (52, 136), "ELF": (68, 204), "retired": (8, 33)}

# Units whose student-facing content changed after their evidence was
# recorded: unit_id -> revision. Empty — every unit is revision 1.
REVISIONS: dict[str, int] = {}
MAX_REVISION = 99


def _b(batch: int, name: str) -> str:
    return f"pipeline/synthetic/batches/batch{batch}/{name}"


# Evidence anchors: (file, quoted text that occurs on exactly one line, note).
RULINGS = {
    14: [(_b(14, "ADJUDICATION.md"), "## ÄGARDOM (2026-08-26)",
          "owner ruling 2026-08-26: »godkänn alla utom elf-b14-001 och las-b14-001«")],
    15: [(_b(15, "ADJUDICATION.md"), "## ÄGARDOM (2026-08-26)", "owner ruling 2026-08-26: »godkänn alla«"),
         (_b(15, "ADJUDICATION.md"), "Samtliga sju enheter **GODKÄNDA**", "all seven units approved")],
    16: [(_b(16, "STATUS.md"), "**Owner adjudication: 7/7 GODKÄNN_NOTED.**", "owner adjudication 2026-10-06"),
         (_b(16, "ADJUDICATION.md"), "Current owner adjudication: **7/7 GODKÄNN_NOTED**",
          "owner rulings 2026-10-06 (hpf-frjd)")],
    17: [(_b(17, "STATUS.md"), "**PAKETDOM ÅTERSTÄLLD — GODKÄNN PAKETET, 7/7 GODKÄNN_NOTED",
          "package approval restored 2026-10-06 (hpf-41yh)"),
         (_b(17, "ADJUDICATION.md"), "## ÅTERSTÄLLD PAKETDOM (2026-10-06)", "restored package ruling")],
    18: [(_b(18, "STATUS.md"), "**GODKÄNN PAKETET: 7 GODKÄNN_NOTED / 20 questions.**",
          "owner ruling 5 (2026-10-06)"),
         (_b(18, "ADJUDICATION.md"), "Owner ruling **5**, implemented in bead **hpf-jnkq**",
          "owner ruling 5: GODKÄNN PAKETET")],
    19: [(_b(19, "STATUS.md"), "**6 GODKÄNN_NOTED / 19 questions; elf-b19-004 RETIRED.**",
          "owner ruling 6 (2026-10-06)"),
         (_b(19, "ADJUDICATION.md"), "Owner ruling **6**, implemented in bead **hpf-jnkq**",
          "owner ruling 6: six kept units approved")],
}
_B14_AS_IS = (_b(14, "ADJUDICATION.md"), "elf-b14-002, elf-b14-003, las-b14-002, las-b14-003: **GODKÄNDA**",
              "approved as it stands")
_B14_EXECUTED = (_b(14, "ADJUDICATION.md"), "## Tillägg (orkestrator, 2026-08-26): ÄGARDOM verkställd",
                 "ordered changes executed, re-gated and re-promoted (6 PASS)")
UNIT_RULINGS = {
    "elf-b14-003": [_B14_AS_IS],
    "las-b14-002": [_B14_AS_IS],
    "las-b14-003": [_B14_AS_IS],
    "elf-b14-001": [(_b(14, "ADJUDICATION.md"), "- elf-b14-001: **ÄNDRA** enligt rekommendation",
                     "approved with ordered changes (ÄNDRA)"), _B14_EXECUTED],
    "las-b14-001": [(_b(14, "ADJUDICATION.md"), "- las-b14-001: **ÄNDRA** enligt rekommendation",
                     "approved with ordered changes (ÄNDRA)"), _B14_EXECUTED],
}
LEGACY_SHIPPED = {1: (_b(1, "ADJUDICATION.md"), "promote-grind (exit 0)",
                      "batch1 package: every unit through V-FINAL and promote (exit 0)")}
LEGACY_SHIPPED.update({n: (_b(n, "STATUS.md"), "— status: COMPLETE", f"batch{n} shipped final, promote clean")
                       for n in range(2, 14)})
MASTER_NO_RESPONSE = (MASTER_REL, "## Svarsinstruktion",
                      "the master suggests a reply; no owner response is recorded")
# Kept legacy units that were ÄGARBLICK items in the master rather than plain
# approve-with-note rows; the other 77 kept units are table rows.
LEGACY_NOTES = {
    "las-b2-003": "ÄGARBLICK D: q1's 'bäst' stem was left to the owner's eye; a third q1 redesign "
                  "landed in 4791084 (PR #356) and its audit returned CONFIRMED_NOTES",
    "las-b3-002": "ÄGARBLICK C: approve with a scheduler rule; the unit carries the matching "
                  "serving_constraint, kept here as the elf-b3-002 exclusion pair",
    "elf-b5-002": "ÄGARBLICK B: ÄNDRA for the 'Ottilie Brandt' name collision with elf-b5-001; "
                  "the rename landed in 4791084 (PR #356)",
    "las-b10-002": "ÄGARBLICK B: ÄNDRA for the Salomonsson name collision with las-b10-001; "
                   "the rename landed in 4791084 (PR #356)",
}
RETIRED_EXTRA = {
    "elf-b14-002": [(_B14_AS_IS[0], _B14_AS_IS[1],
                     "the ruling text lists it as approved; RETIRED.json wins (design §2), not reinstated")],
    "elf-b19-004": [(_b(19, "ADJUDICATION.md"), "| 1 — BLIND-1, elf-b19-004 | **RETIRE**",
                     "owner ruling 6, ledger item 1: RETIRE")],
}
EXCLUSION_PAIRS = (
    {"units": ("las-b18-001", "las-b19-001"), "status": "owner-ruling",
     "rule": "Never combine in one test pass or adaptive session (owner rulings 5 and 6, 2026-10-06); "
             "design §A keeps them apart in drills and replay too.",
     "anchors": [(_b(18, "ADJUDICATION.md"), "| 3 — rural kiln/fire-craft pair |", "batch18 ledger item 3"),
                 (_b(19, "ADJUDICATION.md"), "| 3 — rural kiln/fire-craft pair |", "batch19 ledger item 3")]},
    {"units": ("elf-b3-002", "las-b3-002"), "status": "pending-owner-confirmation",
     "rule": "Topic pair on the same night-train argument axis: never serve both close together. "
             "A master recommendation, enforced conservatively until the owner confirms it (design §5).",
     "anchors": [(MASTER_REL, "### C. Ämnespar (1 enhet)", "ADJUDICATION-MASTER topic-pair spacing"),
                 (_b(3, "candidates-final/las-b3-002.json"), '"serving_constraint": "avoid-adjacent: elf-b3-002',
                  "serving constraint recorded in the unit")]},
)


class RosterError(Exception):
    """The roster cannot be built or does not match its contract."""


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def is_revision(value) -> bool:
    """A plain int from 1 to MAX_REVISION; a bool is not a revision."""
    return type(value) is int and 1 <= value <= MAX_REVISION


def content_digest(unit: dict) -> str:
    """Digest of the student-facing, answer-bearing content only: a change
    here needs a new revision, an internal-metadata change does not."""
    projection = {
        "section": unit["section"],
        "title": unit["title"],
        "passage": unit["passage"],
        "questions": [{"q_index": q["q_index"], "prompt": q["prompt"], "options": q["options"],
                       "key": q["key"]} for q in unit["questions"]],
    }
    canonical = json.dumps(projection, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return sha256_bytes(canonical.encode("utf-8"))


def source_dir(batch: int) -> str:
    return "candidates" if batch in (18, 19) else "candidates-final"


def load_retired(root: Path) -> dict:
    return json.loads((root / RETIRED_REL).read_text(encoding="utf-8"))["retired"]


class _Anchors:
    def __init__(self, root: Path):
        self.root = root
        self._lines: dict[str, list[str]] = {}

    def _hits(self, rel: str, quote: str) -> list[int]:
        if rel not in self._lines:
            self._lines[rel] = (self.root / rel).read_text(encoding="utf-8").splitlines()
        return [n for n, line in enumerate(self._lines[rel], 1) if quote in line]

    def cite(self, rel: str, quote: str, note: str) -> dict:
        hits = self._hits(rel, quote)
        if len(hits) != 1:
            raise RosterError(f"evidence anchor {quote!r} matches {len(hits)} lines of {rel}; need exactly one")
        return {"ref": f"{rel}:{hits[0]}", "quote": quote, "note": note}

    def master_row(self, uid: str) -> dict:
        """The unit's approve-with-note table row in the master, or else its
        ÄGARBLICK mention."""
        if self._hits(MASTER_REL, f"| {uid} |"):
            return self.cite(MASTER_REL, f"| {uid} |",
                             "master: GODKÄNN MED ANTECKNING (a recommendation; no owner response recorded)")
        return self.cite(MASTER_REL, f"**{uid}**", "master: " + LEGACY_NOTES.get(uid, "ÄGARBLICK item"))


def _approval(uid: str, batch: int, revision: int, registry: dict, anchors: _Anchors):
    if uid in registry:
        evidence = [anchors.cite(RETIRED_REL, f'"{uid}": {{',
                                 f"RETIRED.json ({registry[uid]['date']}): excluded from every import")]
        evidence += [anchors.cite(*a) for a in RETIRED_EXTRA.get(uid, ())]
        if batch in LEGACY_BATCHES:
            evidence.append(anchors.master_row(uid))
        return RETIRED, "RETIRED.json", evidence
    if batch in RULINGS:
        evidence = [anchors.cite(*a) for a in RULINGS[batch] + UNIT_RULINGS.get(uid, [])]
        approval, basis = APPROVED, f"owner ruling, batch {batch}"
    else:
        master = anchors.master_row(uid)
        evidence = [anchors.cite(*LEGACY_SHIPPED[batch]), master]
        approval = PENDING
        basis = ("legacy shipped final; master " +
                 ("ÄGARBLICK item" if uid in LEGACY_NOTES else "GODKÄNN MED ANTECKNING"))
    if revision != 1:
        # The rulings above were given on revision 1's bytes (design §F).
        approval, basis = PENDING, f"revision {revision}: no ruling recorded for this revision"
    return approval, basis, evidence


def _census(units: list[dict]) -> dict:
    batches = []
    for batch in BATCHES:
        row = {"batch": batch, "source": source_dir(batch), "LÄS": [0, 0], "ELF": [0, 0], "retired": [0, 0]}
        for unit in units:
            if unit["batch"] == batch:
                cell = row["retired" if unit["retired"] else unit["section"]]
                cell[0] += 1
                cell[1] += unit["question_count"]
        batches.append(row)

    def total(key):
        return [sum(b[key][i] for b in batches) for i in (0, 1)]

    las, elf, retired = total("LÄS"), total("ELF"), total("retired")
    retained = [las[0] + elf[0], las[1] + elf[1]]
    return {"batches": batches, "selected": [retained[0] + retired[0], retained[1] + retired[1]],
            "retired": retired, "retained": retained, "LÄS": las, "ELF": elf}


def _check_census(census: dict, expected: dict) -> None:
    def pair(cell) -> str:
        return " / ".join(map(str, cell)) if cell else "nothing"

    problems = []
    for row in census["batches"]:
        want = expected.get(row["batch"], {})
        for key in ("LÄS", "ELF", "retired"):
            if tuple(row[key]) != tuple(want.get(key, ())):
                problems.append(f"batch {row['batch']} {key} expected {pair(want.get(key))}, found {pair(row[key])}")
    for key, want in EXPECTED_TOTALS.items():
        if tuple(census[key]) != want:
            problems.append(f"total {key} expected {pair(want)}, found {pair(census[key])}")
    if problems:
        raise RosterError(f"census differs from {DESIGN_DOC_REL} §2: " + "; ".join(problems))


def build_roster(root: Path = REPO_ROOT, *, expected_census: dict = EXPECTED_CENSUS,
                 revisions: dict | None = None) -> dict:
    revisions = REVISIONS if revisions is None else revisions
    registry = load_retired(root)
    anchors = _Anchors(root)
    units: list[dict] = []
    for batch in BATCHES:
        folder = root / "pipeline/synthetic/batches" / f"batch{batch}" / source_dir(batch)
        files = sorted(folder.glob("*.json"))
        if not files:
            raise RosterError(f"batch {batch}: no candidate files in {folder.relative_to(root)}")
        for path in files:
            raw = path.read_bytes()
            unit = json.loads(raw)
            uid = unit.get("candidate_id")
            m = UNIT_ID.fullmatch(uid or "")
            if uid != path.stem or not m or int(m.group(2)) != batch:
                raise RosterError(f"{path.relative_to(root)}: candidate_id {uid!r} does not match its file/batch")
            if unit.get("section") != SECTION_OF_PREFIX[m.group(1)]:
                raise RosterError(f"{uid}: section {unit.get('section')!r} does not match its id")
            revision = revisions.get(uid, 1)
            if not is_revision(revision):
                raise RosterError(f"{uid}: revision {revision!r} is not an integer from 1 to {MAX_REVISION}")
            approval, basis, evidence = _approval(uid, batch, revision, registry, anchors)
            units.append({
                "unit_id": uid, "batch": batch, "section": unit["section"], "title": unit["title"],
                "source": path.relative_to(root).as_posix(),
                "sha256": sha256_bytes(raw), "content_sha256": content_digest(unit),
                "question_count": len(unit["questions"]), "revision": revision,
                "approval": approval, "approval_basis": basis, "evidence": evidence,
                "retired": uid in registry, "exclusion_pairs": [],
            })
    ids = [u["unit_id"] for u in units]
    if len(ids) != len(set(ids)):
        raise RosterError("duplicate candidate ids across batches")
    unresolved = sorted(set(registry) - set(ids))
    if unresolved:
        raise RosterError(f"RETIRED.json ids not found in the selected directories: {unresolved}")
    census = _census(units)
    _check_census(census, expected_census)

    by_id = {u["unit_id"]: u for u in units}
    pairs = []
    for pair in EXCLUSION_PAIRS:
        a, b = pair["units"]
        by_id[a]["exclusion_pairs"].append(b)
        by_id[b]["exclusion_pairs"].append(a)
        pairs.append({"units": [a, b], "status": pair["status"], "rule": pair["rule"],
                      "evidence": [anchors.cite(*x) for x in pair["anchors"]]})
    for unit in units:
        unit["exclusion_pairs"].sort()
    return {
        "format": FORMAT,
        "generated_by": BUILDER_REL,
        "spec": f"{DESIGN_DOC_REL} §2, §4 row 1, §C, §F",
        "approval_values": {
            APPROVED: "an explicit owner ruling covers this unit at these bytes",
            PENDING: "legacy shipped unit; awaits the owner's ratification of this exact row",
            RETIRED: "listed in RETIRED.json; never exported",
        },
        "legacy_basis": anchors.cite(*MASTER_NO_RESPONSE),
        "census": census,
        "exclusion_pairs": pairs,
        "units": units,
    }


def check_revision_continuity(previous: dict, roster: dict) -> None:
    """Refuse to reuse a revision for different student-facing content, and
    refuse a revision that goes backwards or is not a revision at all."""
    old = {u["unit_id"]: u for u in previous.get("units", [])}
    problems = []
    for unit in roster["units"]:
        before = old.get(unit["unit_id"])
        if before is None:
            continue
        uid, rev, was = unit["unit_id"], unit.get("revision"), before.get("revision")
        if not (is_revision(rev) and is_revision(was)):
            problems.append(f"{uid}: revision {was!r} -> {rev!r} is not an integer from 1 to {MAX_REVISION}")
        elif rev < was:
            problems.append(f"{uid}: revision went back from r{was} to r{rev}")
        elif rev == was and unit["content_sha256"] != before["content_sha256"]:
            problems.append(f"{uid}: student-facing content changed under r{rev}; bump REVISIONS[{uid!r}] "
                            f"to {rev + 1} and record a ruling for it")
    if problems:
        raise RosterError("revision continuity: " + "; ".join(problems))


def render_roster_json(roster: dict) -> str:
    return json.dumps(roster, ensure_ascii=False, indent=2) + "\n"


def _count(units) -> str:
    return f"{len(units)} / {sum(u['question_count'] for u in units)}"


def _refs(units) -> str:
    by_file: dict[str, set[int]] = {}
    for unit in units:
        for item in unit["evidence"]:
            path, _, line = item["ref"].rpartition(":")
            by_file.setdefault(path, set()).add(int(line))
    order = sorted(by_file, key=lambda p: (p == RETIRED_REL, p == MASTER_REL, p))
    return "; ".join(f"`{p.removeprefix('pipeline/synthetic/')}:{','.join(map(str, sorted(by_file[p])))}`"
                     for p in order)


def render_roster_md(roster: dict) -> str:
    units, census = roster["units"], roster["census"]
    by_status = {s: [u for u in units if u["approval"] == s] for s in (APPROVED, PENDING, RETIRED)}
    short = {APPROVED: "approved", PENDING: "pending", RETIRED: "retired"}
    out = [
        "# P5 approval roster",
        "",
        f"Generated by `{BUILDER_REL}`; do not edit by hand. The rows, the SHA-256 of every candidate's "
        "exact bytes and every file:line reference are in [`approval-roster.json`](approval-roster.json). "
        f"Spec: `{DESIGN_DOC_REL}` §2 and §4 row 1 (bead hpf-535m).",
        "",
        f"**Census, equal to the design's §2 table:** {census['selected'][0]} candidate units / "
        f"{census['selected'][1]} questions (batches 1–17 `candidates-final/`, 18–19 `candidates/`); "
        f"{census['retired'][0]} / {census['retired'][1]} retired; **{census['retained'][0]} / "
        f"{census['retained'][1]} retained** — LÄS {census['LÄS'][0]} / {census['LÄS'][1]}, "
        f"ELF {census['ELF'][0]} / {census['ELF'][1]}.",
        "",
        "| Approval | Units / questions | Basis |",
        "|---|---:|---|",
        f"| `{APPROVED}` | {_count(by_status[APPROVED])} | explicit owner rulings, batches 14–19 |",
        f"| `{PENDING}` | {_count(by_status[PENDING])} | batches 1–13: shipped final; the whole-bank master "
        "records recommendations, not an owner response |",
        f"| `{RETIRED}` | {_count(by_status[RETIRED])} | `RETIRED.json`; never exported, whatever a ruling says |",
        "",
        "## Per batch (units / questions)",
        "",
        "| Batch | LÄS | ELF | Retired | Approval | Evidence |",
        "|---:|---:|---:|---:|---|---|",
    ]
    for row in census["batches"]:
        batch_units = [u for u in units if u["batch"] == row["batch"]]
        status = " · ".join(f"{short[s]} {sum(u['approval'] == s for u in batch_units)}"
                            for s in (APPROVED, PENDING, RETIRED)
                            if any(u["approval"] == s for u in batch_units))
        cells = [f"{row[k][0]} / {row[k][1]}" for k in ("LÄS", "ELF", "retired")]
        out.append(f"| {row['batch']} | {' | '.join(cells)} | {status} | {_refs(batch_units)} |")
    legacy_ref = roster["legacy_basis"]["ref"].removeprefix("pipeline/synthetic/")
    out += [
        "",
        "## For the owner: ratify batches 1–13",
        "",
        f"Ratifying approves exactly the {len(by_status[PENDING])} `{PENDING}` rows in `approval-roster.json`, "
        "at the SHA-256 recorded for each. Their evidence is each batch's shipped-final record plus the unit's "
        "row in the whole-bank master, which ends with a suggested reply and no recorded owner response "
        f"(`{legacy_ref}`). Until ratified, the exporter leaves them out; `export_product.py --include-pending` "
        "adds them to preview exports only, stamped PREVIEW. Reply, for example, **“ratify batches 1–13 as "
        "listed”**, or name the units to hold back.",
        "",
        "Four kept units were ÄGARBLICK items rather than plain approve-with-note rows:",
        "",
    ]
    for uid, note in LEGACY_NOTES.items():
        out.append(f"- `{uid}` — {note}.")
    retired_ids = ", ".join(f"`{u['unit_id']}`" for u in by_status[RETIRED])
    out += [
        "",
        f"Retired, never exported ({_count(by_status[RETIRED])}): {retired_ids}. `elf-b14-002` stays retired "
        "although the batch14 ruling text lists it as approved.",
        "",
        "## Exclusion pairs",
        "",
        "| Pair | Status | Rule |",
        "|---|---|---|",
    ]
    for pair in roster["exclusion_pairs"]:
        out.append(f"| `{pair['units'][0]}` · `{pair['units'][1]}` | {pair['status']} | {pair['rule']} |")
    out += [
        "",
        "A bank export may hold both members of a pair; keeping them apart is the session pickers' job "
        "(design §A, PR 4). An export made for one session (`export_product.py --single-session`) is refused "
        "if it holds both members of any pair. Please confirm the topic pair together with the ratification.",
        "",
        "## Revisions",
        "",
        "Every unit is revision 1 (qids `p5-<unit>-r1-<SECTION>-<nnn>`). A change to a unit's title, passage, "
        "prompts, options or keys needs a higher revision in `REVISIONS` (the build refuses to reuse one), "
        "and a bumped revision stays pending until a ruling is recorded for it.",
        "",
    ]
    return "\n".join(out)


def summary(roster: dict) -> str:
    c = roster["census"]
    counts = {s: [u for u in roster["units"] if u["approval"] == s] for s in (APPROVED, PENDING)}
    return (f"roster: {c['selected'][0]} units / {c['selected'][1]} questions; retained {c['retained'][0]} / "
            f"{c['retained'][1]} (LÄS {c['LÄS'][0]} / {c['LÄS'][1]}, ELF {c['ELF'][0]} / {c['ELF'][1]}); "
            f"retired {c['retired'][0]} / {c['retired'][1]}; approved {_count(counts[APPROVED])}; "
            f"pending owner ratification {_count(counts[PENDING])}")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--check", action="store_true",
                    help="write nothing; exit 1 when approval-roster.json or ROSTER.md is stale")
    args = ap.parse_args(argv)
    try:
        roster = build_roster()
        if ROSTER_PATH.exists():
            check_revision_continuity(json.loads(ROSTER_PATH.read_text(encoding="utf-8")), roster)
    except RosterError as exc:
        print(f"ROSTER FAILED: {exc}", file=sys.stderr)
        return 1
    outputs = {ROSTER_PATH: render_roster_json(roster), ROSTER_MD_PATH: render_roster_md(roster)}
    if args.check:
        stale = [p for p, text in outputs.items() if not p.exists() or p.read_text(encoding="utf-8") != text]
        for path in stale:
            print(f"STALE {path.relative_to(REPO_ROOT)}: rerun {BUILDER_REL} and review the diff")
        if stale:
            return 1
    else:
        for path, text in outputs.items():
            path.write_text(text, encoding="utf-8", newline="\n")
    print(summary(roster))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
