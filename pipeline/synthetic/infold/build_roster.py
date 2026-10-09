#!/usr/bin/env python3
"""Build the P5 infold approval roster (approval-roster.json + ROSTER.md).

docs/p5-infold-design.md §4 row 1 (export contract), using §2 (inventory),
§C and §F; beads hpf-535m and hpf-jsnf. One row per candidate unit in
batches 1–19 — batches 1–17 from candidates-final/, 18–19 from candidates/ —
carrying the SHA-256 of its exact bytes, a digest of its student-facing
content, its revision, its approval status with the file:line evidence
behind it, its RETIRED.json flag and its exclusion pairs.

Approval comes from recorded evidence, never from a directory name or an old
promote PASS:
  approved                    an explicit owner ruling (batches 14–19), or
                              the owner's ratification of batches 1–13
                              (RATIFICATION_REL) for this revision
  pending-owner-ratification  a kept unit that no ruling or ratification
                              covers at its current revision
  retired                     listed in RETIRED.json; retirement always wins

The ratification record lists each ratified legacy unit with the revision
and the student-facing content digest the owner ratified, plus the re-audit's
recommendation (AUDIT_REL, bead hpf-v2nd) and its note. The build refuses a
record that is not that shape, names a unit outside batches 1–13 or twice,
names a revision the unit has not reached, or pins other content than the
unit has at that revision; a later revision is pending again.

The census must equal the design's §2 table, batch by batch, or the build
fails. Evidence line numbers are resolved from quoted anchors at build time:
a moved line updates the roster, a vanished or ambiguous one fails the build.

  python3 pipeline/synthetic/infold/build_roster.py          # write both files
  python3 pipeline/synthetic/infold/build_roster.py --check  # exit 1 if stale

Revisions: a unit is r1 unless REVISIONS says otherwise. A unit whose
student-facing content (title, passage, prompts, options, keys) changes needs
a higher revision in REVISIONS — the build refuses to reuse a revision for
different content — and a bumped revision stays pending until a ruling or a
ratification is recorded for it. A revision is a plain integer from 1 to
MAX_REVISION (99), the r<revision> segment of every qid: this build and the
exporter refuse anything else (0, a negative, a bool, a float, a string,
nested data). Stdlib only.
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
RATIFICATION_REL = "pipeline/synthetic/infold/ratification-2026-10-07.json"
AUDIT_REL = "pipeline/synthetic/infold/AUDIT-batches-1-13.md"
FORMAT = "p5-approval-roster-v1"
RATIFICATION_FORMAT = "p5-ratification-v1"

BATCHES = range(1, 20)
LEGACY_BATCHES = range(1, 14)
UNIT_ID = re.compile(r"(las|elf)-b(\d+)-(\d{3})")
SECTION_OF_PREFIX = {"las": "LÄS", "elf": "ELF"}

APPROVED = "approved"
PENDING = "pending-owner-ratification"
RETIRED = "retired"

# docs/p5-infold-design.md §2, per batch: retained units / questions per
# section, and retired units / questions. Since the owner's ruling of
# 2026-10-08 (bead hpf-c5tb.2) las-b3-001 and las-b5-001 are retired, since
# the ruling of 2026-10-09 (bead hpf-c5tb.13) elf-b1-002, elf-b3-004,
# elf-b4-001, elf-b5-002, elf-b7-002 and elf-b8-002, and since a second ruling
# that day (bead hpf-c5tb.17) elf-b12-001: §2's census update for
# elf-b12-001, which supersedes its earlier tables.
EXPECTED_CENSUS = {
    1: {"LÄS": (3, 8), "ELF": (3, 7), "retired": (1, 5)},
    2: {"LÄS": (2, 4), "ELF": (4, 12), "retired": (0, 0)},
    3: {"LÄS": (2, 4), "ELF": (2, 6), "retired": (2, 5)},
    4: {"LÄS": (2, 4), "ELF": (2, 6), "retired": (1, 5)},
    5: {"LÄS": (2, 4), "ELF": (3, 7), "retired": (2, 9)},
    6: {"LÄS": (2, 4), "ELF": (3, 7), "retired": (2, 9)},
    7: {"LÄS": (3, 8), "ELF": (2, 2), "retired": (2, 10)},
    8: {"LÄS": (2, 4), "ELF": (2, 2), "retired": (3, 14)},
    9: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    10: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    11: {"LÄS": (2, 4), "ELF": (4, 12), "retired": (1, 4)},
    12: {"LÄS": (3, 8), "ELF": (3, 7), "retired": (1, 5)},
    13: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    14: {"LÄS": (3, 12), "ELF": (2, 10), "retired": (1, 5)},
    15: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    16: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    17: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    18: {"LÄS": (3, 8), "ELF": (4, 12), "retired": (0, 0)},
    19: {"LÄS": (3, 8), "ELF": (3, 11), "retired": (1, 1)},
}
EXPECTED_TOTALS = {"retained": (111, 301), "LÄS": (50, 128), "ELF": (61, 173), "retired": (17, 72)}

# Units whose student-facing content changed after their evidence was
# recorded: unit_id -> revision; every other unit is revision 1. las-b7-002
# r2 is the law-13 full-name rename of 2026-10-07 (bead hpf-jsnf).
REVISIONS: dict[str, int] = {"las-b7-002": 2}
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
                      "the master suggests a reply and records no owner response; the owner's "
                      "ratification is recorded in " + RATIFICATION_REL)
# The ratification record (owner 2026-10-07, bead hpf-jsnf): its top-level
# fields and, per unit, exactly these fields, in this order.
RATIFICATION_KEYS = ("format", "ratified_by", "ruling", "audit", "audited_roster_sha256", "implemented_in",
                     "units")
RATIFIED_FIELDS = ("unit_id", "revision", "content_sha256", "recommendation", "note")
RECOMMENDATIONS = ("ratify", "ratify-with-note", "fix")
SHA256_HEX = re.compile(r"[0-9a-f]{64}")
# A ratified unit whose batch records the change the ratification covers.
RATIFIED_EXTRA = {
    "las-b7-002": [(_b(7, "ADJUDICATION.md"), "## Law-13 rename — 2026-10-07 (hpf-jsnf): las-b7-002 r2",
                    "the revision-2 rename that the ratification covers")],
}
# Legacy units that were ÄGARBLICK items in the master rather than plain
# approve-with-note rows. Three are kept, and the other 69 kept units are
# table rows; elf-b5-002 is retired (2026-10-09, bead hpf-c5tb.13), and its
# retired row still cites the master with its note.
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


def load_ratification(root: Path):
    return json.loads((root / RATIFICATION_REL).read_text(encoding="utf-8"))


def check_ratification(record, units: list[dict]) -> dict[str, dict]:
    """The ratification record's entries by unit id. A record is refused,
    never repaired: other fields than RATIFICATION_KEYS / RATIFIED_FIELDS, a
    unit outside batches 1–13 or listed twice, a revision the unit has not
    reached, or other student-facing content than the unit has at that
    revision. An entry for an earlier revision is kept and covers nothing."""
    if type(record) is not dict or list(record) != list(RATIFICATION_KEYS):
        got = list(record) if type(record) is dict else type(record).__name__
        raise RosterError(f"ratification record {RATIFICATION_REL}: fields {got}, "
                          f"expected {list(RATIFICATION_KEYS)}")
    problems = []
    if record["format"] != RATIFICATION_FORMAT:
        problems.append(f"format {record['format']!r} is not {RATIFICATION_FORMAT!r}")
    if record["audit"] != AUDIT_REL:
        problems.append(f"audit {record['audit']!r} is not {AUDIT_REL!r}")
    for key in ("ratified_by", "ruling", "implemented_in"):
        if type(record[key]) is not str or not record[key].strip():
            problems.append(f"{key} must be a non-empty string")
    if type(record["audited_roster_sha256"]) is not str or not SHA256_HEX.fullmatch(record["audited_roster_sha256"]):
        problems.append("audited_roster_sha256 is not a SHA-256 hex digest")
    entries = record["units"]
    if type(entries) is not list or not entries:
        problems.append("units must be a non-empty array")
        entries = []
    by_id = {u["unit_id"]: u for u in units}
    ratified: dict[str, dict] = {}
    for n, entry in enumerate(entries):
        if type(entry) is not dict or list(entry) != list(RATIFIED_FIELDS):
            problems.append(f"units[{n}]: fields must be {list(RATIFIED_FIELDS)}")
            continue
        uid, revision, digest, note = entry["unit_id"], entry["revision"], entry["content_sha256"], entry["note"]
        unit = by_id.get(uid) if type(uid) is str else None
        if unit is None:
            problems.append(f"units[{n}]: {uid!r} is not a selected candidate")
            continue
        if unit["batch"] not in LEGACY_BATCHES:
            problems.append(f"{uid}: batch {unit['batch']} has its own owner ruling; the record ratifies batches 1–13")
        if uid in ratified:
            problems.append(f"{uid}: listed twice")
        if type(digest) is not str or not SHA256_HEX.fullmatch(digest):
            problems.append(f"{uid}: content_sha256 is not a SHA-256 hex digest")
        if not is_revision(revision):
            problems.append(f"{uid}: revision {revision!r} is not an integer from 1 to {MAX_REVISION}")
        elif revision > unit["revision"]:
            problems.append(f"{uid}: ratified at r{revision}, but the unit is r{unit['revision']}")
        elif revision == unit["revision"] and digest != unit["content_sha256"]:
            problems.append(f"{uid}: the record pins r{revision} content {str(digest)[:12]}…, the candidate's is "
                            f"{unit['content_sha256'][:12]}…; changed content needs a new revision")
        if entry["recommendation"] not in RECOMMENDATIONS:
            problems.append(f"{uid}: recommendation {entry['recommendation']!r} is not one of {list(RECOMMENDATIONS)}")
        elif note is None and entry["recommendation"] != "ratify":
            problems.append(f"{uid}: a {entry['recommendation']} entry needs a note")
        if note is not None and (type(note) is not str or not note.strip()):
            problems.append(f"{uid}: note must be null or a non-empty string")
        ratified[uid] = entry
    if problems:
        raise RosterError(f"ratification record {RATIFICATION_REL}: " + "; ".join(problems))
    return ratified


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


def _approval(unit: dict, registry: dict, anchors: _Anchors, ratified: dict[str, dict], ratified_by: str) -> dict:
    uid, batch, revision = unit["unit_id"], unit["batch"], unit["revision"]
    if uid in registry:
        evidence = [anchors.cite(RETIRED_REL, f'"{uid}": {{',
                                 f"RETIRED.json ({registry[uid]['date']}): excluded from every import")]
        evidence += [anchors.cite(*a) for a in RETIRED_EXTRA.get(uid, ())]
        if batch in LEGACY_BATCHES:
            evidence.append(anchors.master_row(uid))
        return {"approval": RETIRED, "approval_basis": "RETIRED.json", "evidence": evidence}
    if batch in RULINGS:
        evidence = [anchors.cite(*a) for a in RULINGS[batch] + UNIT_RULINGS.get(uid, [])]
        approval, basis = APPROVED, f"owner ruling, batch {batch}"
    else:
        evidence = [anchors.cite(*LEGACY_SHIPPED[batch]), anchors.master_row(uid)]
        entry = ratified.get(uid)
        if entry is not None and entry["revision"] == revision:
            recommendation = entry["recommendation"]
            evidence += [anchors.cite(AUDIT_REL, f"| {uid} | {unit['section']} | {unit['question_count']} |",
                                      f"re-audit row: {recommendation}"),
                         anchors.cite(RATIFICATION_REL, f'"unit_id": "{uid}"',
                                      f"ratified by {ratified_by} at r{revision}")]
            evidence += [anchors.cite(*a) for a in RATIFIED_EXTRA.get(uid, ())]
            return {"approval": APPROVED,
                    "approval_basis": f"owner ratification of batches 1–13 at r{revision}; "
                                      f"re-audit recommendation {recommendation}",
                    "ratified_by": ratified_by, "ratification_note": entry["note"], "evidence": evidence}
        approval = PENDING
        basis = ("legacy shipped final; master " +
                 ("ÄGARBLICK item" if uid in LEGACY_NOTES else "GODKÄNN MED ANTECKNING"))
    if revision != 1:
        # The rulings above were given on revision 1's bytes (design §F).
        approval, basis = PENDING, f"revision {revision}: no ruling recorded for this revision"
    return {"approval": approval, "approval_basis": basis, "evidence": evidence}


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
                 revisions: dict | None = None, ratification=None) -> dict:
    """The roster from the files under root. revisions replaces REVISIONS
    and ratification replaces the record at RATIFICATION_REL (tests)."""
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
            units.append({
                "unit_id": uid, "batch": batch, "section": unit["section"], "title": unit["title"],
                "source": path.relative_to(root).as_posix(),
                "sha256": sha256_bytes(raw), "content_sha256": content_digest(unit),
                "question_count": len(unit["questions"]), "revision": revision,
                "approval": None, "approval_basis": None, "ratified_by": None, "ratification_note": None,
                "evidence": [], "retired": uid in registry, "exclusion_pairs": [],
            })
    ids = [u["unit_id"] for u in units]
    if len(ids) != len(set(ids)):
        raise RosterError("duplicate candidate ids across batches")
    unresolved = sorted(set(registry) - set(ids))
    if unresolved:
        raise RosterError(f"RETIRED.json ids not found in the selected directories: {unresolved}")
    census = _census(units)
    _check_census(census, expected_census)
    record = load_ratification(root) if ratification is None else ratification
    ratified = check_ratification(record, units)
    for unit in units:
        unit.update(_approval(unit, registry, anchors, ratified, record["ratified_by"]))

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
            APPROVED: "an explicit owner ruling (batches 14–19) or the owner's recorded ratification "
                      "(batches 1–13) covers this unit at this revision",
            PENDING: "a kept unit that no ruling or ratification covers at its current revision",
            RETIRED: "listed in RETIRED.json; never exported",
        },
        "legacy_basis": anchors.cite(*MASTER_NO_RESPONSE),
        "ratification": {
            "record": RATIFICATION_REL, "ratified_by": record["ratified_by"], "ruling": record["ruling"],
            "audit": AUDIT_REL,
            "recommendations": {name: [uid for uid, entry in ratified.items() if entry["recommendation"] == name]
                                for name in RECOMMENDATIONS},
        },
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
    units, census, ratification = roster["units"], roster["census"], roster["ratification"]
    by_status = {s: [u for u in units if u["approval"] == s] for s in (APPROVED, PENDING, RETIRED)}
    short = {APPROVED: "approved", PENDING: "pending", RETIRED: "retired"}
    record, audit = (ratification[key].rpartition("/")[2] for key in ("record", "audit"))
    out = [
        "# P5 approval roster",
        "",
        f"Generated by `{BUILDER_REL}`; do not edit by hand. The rows, the SHA-256 of every candidate's "
        "exact bytes and every file:line reference are in [`approval-roster.json`](approval-roster.json). "
        f"Spec: `{DESIGN_DOC_REL}` §2 and §4 row 1 (bead hpf-535m); the ratification of batches 1–13 is bead "
        "hpf-jsnf.",
        "",
        f"**Census, equal to the design's §2 table:** {census['selected'][0]} candidate units / "
        f"{census['selected'][1]} questions (batches 1–17 `candidates-final/`, 18–19 `candidates/`); "
        f"{census['retired'][0]} / {census['retired'][1]} retired; **{census['retained'][0]} / "
        f"{census['retained'][1]} retained** — LÄS {census['LÄS'][0]} / {census['LÄS'][1]}, "
        f"ELF {census['ELF'][0]} / {census['ELF'][1]}.",
        "",
        "| Approval | Units / questions | Basis |",
        "|---|---:|---|",
        f"| `{APPROVED}` | {_count(by_status[APPROVED])} | explicit owner rulings, batches 14–19; the owner's "
        f"ratification, batches 1–13 ([`{record}`]({record})) |",
        f"| `{PENDING}` | {_count(by_status[PENDING])} | kept units that no ruling or ratification covers at their "
        "current revision |",
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
    recommendations = ratification["recommendations"]
    revision_of = {u["unit_id"]: u["revision"] for u in units}
    fixed = ", ".join(f"`{uid}`, now revision {revision_of[uid]}" for uid in recommendations["fix"]) or "none"
    pending = ", ".join(f"`{u['unit_id']}`" for u in by_status[PENDING]) or "none"
    out += [
        "",
        "## Ratification of batches 1–13",
        "",
        f"**Ratified, {ratification['ratified_by']}:** {ratification['ruling']}. The whole-bank master ends on a "
        f"suggested reply and records no owner response (`{legacy_ref}`); this ratification is the response. It was "
        f"given on the read-only re-audit [`{audit}`]({audit}) (bead hpf-v2nd) and is recorded per unit in "
        f"[`{record}`]({record}), by re-audit recommendation: "
        + ", ".join(f"{name} {len(ids)}" for name, ids in recommendations.items()) + ".",
        "",
        "Each entry pins the revision and the digest of the student-facing content that were ratified. The build "
        "refuses an entry that disagrees with the candidate at that revision, and a later revision is pending "
        "again until a ruling covers it. Every ratify-with-note row carries its note in `ratification_note`, "
        "the conditional ones with how their condition was met.",
        "",
        f"Fixed before ratification: {fixed}. Still pending: {pending}.",
        "",
    ]
    retired_units = {u["unit_id"] for u in by_status[RETIRED]}
    kept_notes = {uid: note for uid, note in LEGACY_NOTES.items() if uid not in retired_units}
    out += ["Kept units that were ÄGARBLICK items in the master rather than plain approve-with-note rows "
            f"({len(kept_notes)}):", ""]
    for uid, note in kept_notes.items():
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
        "if it holds both members of any pair.",
    ]
    unconfirmed = [p for p in roster["exclusion_pairs"] if p["status"] == "pending-owner-confirmation"]
    if unconfirmed:
        listed = "; ".join(f"`{p['units'][0]}` · `{p['units'][1]}`" for p in unconfirmed)
        out += ["", f"Still awaiting the owner's confirmation, and enforced conservatively until then: {listed}. "
                    "The ratification of batches 1–13 ratified the units, not the pairing."]
    bumped = ", ".join(f"`{u['unit_id']}`, revision {u['revision']} (qids `p5-{u['unit_id']}-r{u['revision']}-"
                       f"{u['section']}-<nnn>`)" for u in units if u["revision"] != 1)
    out += [
        "",
        "## Revisions",
        "",
        "Every unit is revision 1 (qids `p5-<unit>-r1-<SECTION>-<nnn>`)" + (f" except {bumped}" if bumped else "")
        + ". A change to a unit's title, passage, prompts, options or keys needs a higher revision in "
        "`REVISIONS` (the build refuses to reuse one), and a bumped revision stays pending until a ruling or a "
        "ratification is recorded for it.",
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
