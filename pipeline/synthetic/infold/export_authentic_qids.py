#!/usr/bin/env python3
"""Export the authentic qid set the worker bundles to classify attempts server-side.

docs/p5-infold-design.md Amendment 1 E (PR 3); beads hpf-94i5 and hpf-0jyp
(review finding B3 of hpf-aaqr). The worker calls an answered question authentic
exactly when its qid is a question of the authentic bank the app serves
(worker/src/lib/provenance.ts): the per-sitting files under app/public/data, one
for each exam of app/public/data/_index.json. It is membership, not the qid's
shape. A qid that looks like a bank qid but names a question the bank does not
hold, such as var-2024-verb1-ORD-015 (verb1's ORD questions are 001-010), is
unknown, and it fails closed.

Every row is checked before it is listed:
  · its exam_id is the sitting its file is named after;
  · its provpass is verb1, verb2, kvant1 or kvant2;
  · its section belongs to that pass's half (verb: ORD LÄS MEK ELF; kvant: XYZ
    KVA NOG DTK);
  · its number is an integer from 1 to 999;
  · its qid is exactly f"{exam_id}-{provpass}-{section}-{number:03d}".
A JSON file that is not an indexed sitting, an indexed sitting without a file, a
duplicate qid or a row that breaks the grammar is refused, and nothing is
written.

Output: worker/data/authentic-qids.json, outside worker/src so biome's
formatter leaves this rendering alone. It holds the format, the bank folder it
was read from, the counts, the sittings and the qids, both sorted by code point.
It is rendered as the P5 exporter renders JSON. The worker's provenance test
pins it to the bank, and --check fails when the bank changed without a
re-export.

--backfill-migration PATH renders the one-off provenance backfill,
worker/drizzle/0013_attempt_provenance_backfill.sql, from the same set. That
migration is frozen once it has been applied anywhere; render it again only
while it is unapplied.

  python3 pipeline/synthetic/infold/export_authentic_qids.py          # write
  python3 pipeline/synthetic/infold/export_authentic_qids.py --check  # exit 1 when stale
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from build_roster import REPO_ROOT
from export_product import render_json
from export_qid_registry import write_registry

BANK_REL = "app/public/data"
INDEX_NAME = "_index.json"
SET_REL = "worker/data/authentic-qids.json"
SET_PATH = REPO_ROOT / SET_REL
SET_FORMAT = "authentic-qid-set-v1"
GENERATED_BY = "pipeline/synthetic/infold/export_authentic_qids.py"
SPEC = "docs/p5-infold-design.md Amendment 1 E, PR 3"
SECTIONS_OF_PASS = {
    "verb1": ("ORD", "LÄS", "MEK", "ELF"),
    "verb2": ("ORD", "LÄS", "MEK", "ELF"),
    "kvant1": ("XYZ", "KVA", "NOG", "DTK"),
    "kvant2": ("XYZ", "KVA", "NOG", "DTK"),
}

# The backfill migration's helper table. It is created, filled, read and
# dropped inside the migration, so it never outlives it.
HELPER_TABLE = "tmp_0013_authentic_qid"
# Rows per INSERT statement: each statement stays far below D1's statement
# size limit.
INSERT_CHUNK = 500


class BankError(Exception):
    """The bank cannot be read as a set of authentic qids."""


def _read_json(path: Path, what: str):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        raise BankError(f"{what} is not readable JSON: {exc}") from None


def _indexed_exams(folder: Path) -> list[str]:
    index = _read_json(folder / INDEX_NAME, f"{BANK_REL}/{INDEX_NAME}")
    exams = index.get("exams") if type(index) is dict else None
    if type(exams) is not list or not exams:
        raise BankError(f"{BANK_REL}/{INDEX_NAME} has no exams list")
    ids = []
    for exam in exams:
        exam_id = exam.get("exam_id") if type(exam) is dict else None
        if type(exam_id) is not str or not exam_id:
            raise BankError(f"{BANK_REL}/{INDEX_NAME} lists an exam without an exam_id: {exam!r}")
        ids.append(exam_id)
    if len(set(ids)) != len(ids):
        raise BankError(f"{BANK_REL}/{INDEX_NAME} lists an exam_id twice")
    return ids


def _row_qid(row, exam_id: str, name: str) -> str:
    """The row's qid, after every grammar check above."""
    if type(row) is not dict:
        raise BankError(f"{BANK_REL}/{name}: a row is not an object: {row!r}")
    qid, provpass, section, number = (row.get(k) for k in ("qid", "provpass", "section", "number"))
    shown = qid if type(qid) is str else row
    if row.get("exam_id") != exam_id:
        raise BankError(f"{BANK_REL}/{name}: {shown!r} has exam_id {row.get('exam_id')!r}, not {exam_id!r}")
    if provpass not in SECTIONS_OF_PASS:
        raise BankError(f"{BANK_REL}/{name}: {shown!r} has provpass {provpass!r}")
    if section not in SECTIONS_OF_PASS[provpass]:
        raise BankError(f"{BANK_REL}/{name}: {shown!r} has section {section!r}, not one of {provpass}'s")
    if type(number) is not int or not 1 <= number <= 999:
        raise BankError(f"{BANK_REL}/{name}: {shown!r} has number {number!r}")
    expected = f"{exam_id}-{provpass}-{section}-{number:03d}"
    if qid != expected:
        raise BankError(f"{BANK_REL}/{name}: qid {shown!r} is not {expected!r}")
    return qid


def bank_qids(root: Path) -> tuple[list[str], list[str]]:
    """The bank's sittings and qids, both sorted, or BankError."""
    folder = root / BANK_REL
    exams = _indexed_exams(folder)
    files = sorted(p.name for p in folder.glob("*.json") if not p.name.startswith("_"))
    expected = sorted(f"{exam_id}.json" for exam_id in exams)
    if files != expected:
        extra = sorted(set(files) - set(expected))
        missing = sorted(set(expected) - set(files))
        raise BankError(f"{BANK_REL} does not hold exactly the indexed sittings: "
                        f"not indexed {extra}, missing {missing}")
    seen: set[str] = set()
    for exam_id in exams:
        name = f"{exam_id}.json"
        rows = _read_json(folder / name, f"{BANK_REL}/{name}")
        if type(rows) is not list or not rows:
            raise BankError(f"{BANK_REL}/{name} is not a non-empty list of questions")
        for row in rows:
            qid = _row_qid(row, exam_id, name)
            if qid in seen:
                raise BankError(f"{BANK_REL}/{name}: qid {qid!r} appears twice")
            seen.add(qid)
    return sorted(exams), sorted(seen)


def build_set(root: Path) -> bytes:
    """The authentic set's bytes for root's bank, or BankError."""
    exams, qids = bank_qids(root)
    return render_json({
        "format": SET_FORMAT,
        "generated_by": GENERATED_BY,
        "spec": SPEC,
        "bank": BANK_REL,
        "exam_count": len(exams),
        "qid_count": len(qids),
        "exams": exams,
        "qids": qids,
    })


def _sql_text(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


_BACKFILL_HEADER = """\
-- Custom SQL migration file, put your code below! --
-- One-off backfill of attempts.source and item_stats.source, and a reset of the
-- fitted state that rests on answers that are now unknown (P5 infold PR 3,
-- beads hpf-94i5 and hpf-0jyp, docs/p5-infold-design.md Amendment 1 E).
--
-- Rendered by pipeline/synthetic/infold/export_authentic_qids.py
-- --backfill-migration from {bank} ({exam_count} sittings, {qid_count} qids),
-- the set worker/data/authentic-qids.json holds. Frozen once applied anywhere.
--
-- 1. Provenance. Rows that predate the columns took their fail-closed default,
--    'unknown'. A row becomes 'authentic' exactly when isAuthenticQid in
--    worker/src/lib/provenance.ts accepts its qid: the qid is a question of the
--    authentic bank, or its legacy LAS spelling is (-LAS- for -LÄS-, the
--    corpus-import quirk lib/section.ts normalises). It is membership, not a
--    shape: a bank-shaped qid the bank does not hold stays 'unknown'. The set
--    is loaded into a helper table, which is dropped at the end. Everything
--    else stays 'unknown'. No P5 question was served before the columns
--    existed, so nothing is backfilled 'synthetic', and attempts.item_revision
--    stays null.
-- 2. Fitted state. Before provenance, the Elo fit (lib/fit.ts) folded every
--    graded answer whose qid has a section, and every answer it folded left an
--    item_stats row for that qid. An item_stats row that is still 'unknown'
--    after step 1 is therefore exact evidence that user_ability and item_stats
--    hold the contribution of an answer that is now unknown. Elo ratings are
--    path-dependent, so the contribution cannot be subtracted. When such a row
--    exists, every user_ability and item_stats row is deleted and the fit
--    watermark goes back to 0. The next fit run (the nightly cron, or POST
--    /api/fit/run) then refits every retained attempt under the provenance
--    rules, with unknown answers skipped. Attempts that retention has already
--    pruned (older than 120 days) cannot be refitted. When no such row exists,
--    nothing is reset.
--
-- Re-running is safe. Step 1 only promotes 'unknown' rows. The provenance fit
-- never writes an 'unknown' item_stats row, so after a reset step 2 finds
-- nothing. Re-run this file once after the worker deploy, for the rows the
-- pre-migration worker wrote between `migrations apply` and the deploy.
"""

_PROMOTE = """\
UPDATE `{table}` SET `source` = 'authentic'
WHERE `source` = 'unknown'
  AND (
    `question_id` IN (SELECT `qid` FROM `{helper}`)
    OR replace(`question_id`, '-LAS-', '-LÄS-') IN (SELECT `qid` FROM `{helper}`)
  );"""

_RESET = (
    "DELETE FROM `user_ability`\nWHERE EXISTS (SELECT 1 FROM `item_stats` WHERE `source` = 'unknown');",
    "UPDATE `fit_state` SET `last_attempt_id` = 0\nWHERE EXISTS (SELECT 1 FROM `item_stats` WHERE `source` = 'unknown');",
    # Last: these rows are the evidence the two statements above test.
    "DELETE FROM `item_stats`\nWHERE EXISTS (SELECT 1 FROM `item_stats` WHERE `source` = 'unknown');",
)

BREAKPOINT = "\n--> statement-breakpoint\n"


def render_backfill_migration(exams: list[str], qids: list[str]) -> bytes:
    """The backfill migration's bytes for this set: the helper table, the
    promotions, the conditional fit reset, the drop."""
    statements = [f"CREATE TABLE IF NOT EXISTS `{HELPER_TABLE}` (`qid` text PRIMARY KEY NOT NULL);"]
    for start in range(0, len(qids), INSERT_CHUNK):
        chunk = qids[start:start + INSERT_CHUNK]
        values = ",\n".join(f"({_sql_text(qid)})" for qid in chunk)
        statements.append(f"INSERT OR IGNORE INTO `{HELPER_TABLE}` (`qid`) VALUES\n{values};")
    statements += [_PROMOTE.format(table=table, helper=HELPER_TABLE) for table in ("attempts", "item_stats")]
    statements += _RESET
    statements.append(f"DROP TABLE IF EXISTS `{HELPER_TABLE}`;")
    header = _BACKFILL_HEADER.format(bank=BANK_REL, exam_count=len(exams), qid_count=len(qids))
    return (header + BREAKPOINT.join(statements) + "\n").encode("utf-8")


def _shown(path: Path) -> str:
    try:
        return path.resolve().relative_to(REPO_ROOT.resolve()).as_posix()
    except ValueError:
        return str(path)


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--out", type=Path, default=SET_PATH, help=f"set path (default: {SET_REL})")
    ap.add_argument("--root", type=Path, default=REPO_ROOT, help="repository root holding the bank")
    ap.add_argument("--check", action="store_true",
                    help="write nothing; exit 1 when the set differs from a fresh export")
    ap.add_argument("--backfill-migration", type=Path, metavar="PATH",
                    help="also render the one-off provenance backfill migration to PATH")
    args = ap.parse_args(argv)
    try:
        exams, qids = bank_qids(args.root)
        data = build_set(args.root)
    except BankError as exc:
        print(f"REFUSED: {exc}", file=sys.stderr)
        return 1
    summary = f"{len(exams)} sittings / {len(qids)} qids"
    if args.check:
        current = args.out.read_bytes() if args.out.is_file() else None
        if current != data:
            print(f"STALE {_shown(args.out)}: rerun without --check")
            return 1
        print(f"checked {summary} -> {_shown(args.out)}")
        return 0
    write_registry(data, args.out)
    print(f"exported {summary} -> {_shown(args.out)}")
    if args.backfill_migration is not None:
        write_registry(render_backfill_migration(exams, qids), args.backfill_migration)
        print(f"rendered the backfill migration -> {_shown(args.backfill_migration)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
