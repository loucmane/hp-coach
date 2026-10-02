#!/usr/bin/env python3
"""Apply EXACT old->new string fixes prescribed by a review lane — the only repair the
completion package lets the coordinator perform (ci-ar7o clause 2; no judgement).

Reads <batch>/reviews/<stage>.jsonl, takes the LAST record per candidate (append-forward,
last wins), and for every entry in its `fixes[]` ({path, old, new}) requires that the JSON
path resolves to a string containing `old` EXACTLY ONCE. Anything else fails closed and
nothing is written for that batch. TRANSACTION (Codex review v2, finding 5 — "all-or-nothing" must survive a write failure,
not only a validation failure): before any write, the before-image of every candidate to be
changed and of the review journal is copied to
<batch>/exact-fix-backups/<stage>-<utc>/ together with a txn.json ({stage, date, units,
journal, state: "pending"}). Writes then happen; on ANY exception the candidates are restored
byte-for-byte from the before-images and the journal is truncated to its recorded length,
the txn is marked "rolled_back", and the error is re-raised. On success the txn is marked
"committed". `--recover` scans exact-fix-backups/ for txns still "pending" (a crash between
writes) and rolls them back the same way. The before-images stay as repair evidence.

ATOMIC STATE PUBLICATION (Codex review v3, finding 1): every txn.json write goes to a
temporary file in the same directory and is published with os.replace(), so the record on
disk is always the previous valid state or the next valid state — never torn. The
"committed" publication happens INSIDE the protected region: if it fails, the candidates
and the journal are rolled back byte-for-byte and "rolled_back" is published; if even that
publication fails, txn.json still holds the valid "pending" record and the next `apply` /
`--recover` rolls back again (rollback is idempotent). A txn.json that is nevertheless
unreadable is reported as a FixError naming the directory — never a traceback, never
silently skipped.

On success, per changed unit:
  - the candidate file is rewritten (indent=2, ensure_ascii=False, no trailing newline —
    the house serialisation);
  - a repair_log entry {round: "exact-fix-<stage>", date, source, edits[]} is appended;
  - a review record {stage, verdict, reviewed_by: "coordinator/exact-fix-applied"} is
    appended: language FIX_PROPOSED -> CORRECTED; pedagogy MINOR_FIXES stays MINOR_FIXES.
Prints the changed candidate ids (one per line) — the re-validation lane selection.

Path grammar: $.passage | $.title | $.glossary | $.questions[<i>].prompt |
$.questions[<i>].rationale | $.questions[<i>].options[<j>].text  (0-based indices).
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from pathlib import Path

PATH_RE = re.compile(r"^\$\.(passage|title|glossary)$|^\$\.questions\[(\d+)\]\.(prompt|rationale)$|"
                     r"^\$\.questions\[(\d+)\]\.options\[(\d+)\]\.text$")
VERDICT_AFTER = {"language": {"FIX_PROPOSED": "CORRECTED"}, "pedagogy": {"MINOR_FIXES": "MINOR_FIXES"}}


class FixError(ValueError):
    pass


def _get_set(cand: dict, path: str, new: str | None = None) -> str:
    m = PATH_RE.match(path)
    if not m:
        raise FixError(f"unsupported path {path}")
    if m.group(1):
        holder, key = cand, m.group(1)
    elif m.group(2):
        holder, key = cand["questions"][int(m.group(2))], m.group(3)
    else:
        holder, key = cand["questions"][int(m.group(4))]["options"][int(m.group(5))], "text"
    val = holder.get(key)
    if not isinstance(val, str):
        raise FixError(f"{path} is not a string")
    if new is not None:
        holder[key] = new
    return val


def plan(batch: Path, stage: str) -> dict[str, dict]:
    p = batch / "reviews" / f"{stage}.jsonl"
    if not p.is_file():
        raise FixError(f"no review journal {p}")
    last: dict[str, dict] = {}
    for line in p.read_text(encoding="utf-8").splitlines():
        if line.strip():
            r = json.loads(line)
            last[r["candidate_id"]] = r
    todo = {}
    for cid, r in last.items():
        fixes = r.get("fixes") or []
        if r.get("verdict") in VERDICT_AFTER[stage] and fixes:
            todo[cid] = r
    return todo


def _write_candidate(path: Path, cand: dict) -> None:
    path.write_text(json.dumps(cand, ensure_ascii=False, indent=2), encoding="utf-8")


def _append_journal(path: Path, record: dict) -> None:
    with path.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(record, ensure_ascii=False) + "\n")


def _publish_txn(txn_dir: Path, txn: dict) -> None:
    """Atomically replace txn.json: write a sibling temp file, fsync, os.replace."""
    tmp = txn_dir / "txn.json.tmp"
    data = json.dumps(txn, ensure_ascii=False, indent=1)
    with tmp.open("w", encoding="utf-8") as fh:
        fh.write(data)
        fh.flush()
        os.fsync(fh.fileno())
    os.replace(tmp, txn_dir / "txn.json")


def _load_txn(txn_dir: Path) -> dict:
    tp = txn_dir / "txn.json"
    try:
        txn = json.loads(tp.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        raise FixError(f"unreadable transaction record {tp} ({e}); inspect before-images in {txn_dir} manually") from e
    if not isinstance(txn, dict) or txn.get("schema") != "hpfetcher-exact-fix-txn.v1":
        raise FixError(f"{tp} is not an exact-fix transaction record")
    return txn


def _rollback(batch: Path, txn_dir: Path, txn: dict) -> None:
    """Idempotent: restoring the same before-images twice is harmless."""
    for cid in txn["units"]:
        shutil.copyfile(txn_dir / f"{cid}.json", batch / "candidates" / f"{cid}.json")
    jp = batch / "reviews" / txn["journal"]["name"]
    if jp.exists():
        with jp.open("r+b") as fh:
            fh.truncate(txn["journal"]["length"])
    txn["state"] = "rolled_back"
    _publish_txn(txn_dir, txn)


def recover(batch: Path) -> list[str]:
    """Roll back every transaction left 'pending' by an interrupted run."""
    rolled = []
    root = batch / "exact-fix-backups"
    for txn_dir in sorted(root.glob("*")) if root.is_dir() else []:
        if (txn_dir / "txn.json").exists() or (txn_dir / "txn.json.tmp").exists():
            txn = _load_txn(txn_dir)
            if txn.get("state") == "pending":
                _rollback(batch, txn_dir, txn)
                rolled.append(txn_dir.name)
    return rolled


def apply(batch: Path, stage: str, date: str) -> list[str]:
    if recover(batch):
        raise FixError("a pending exact-fix transaction was rolled back; inspect exact-fix-backups/ and re-run")
    todo = plan(batch, stage)
    staged: dict[str, tuple[dict, list[dict]]] = {}
    for cid, r in todo.items():
        cp = batch / "candidates" / f"{cid}.json"
        cand = json.loads(cp.read_text(encoding="utf-8"))
        edits = []
        for f in r["fixes"]:
            cur = _get_set(cand, f["path"])
            n = cur.count(f["old"])
            if n != 1:
                raise FixError(f"{cid} {f['path']}: old string occurs {n} times, need exactly 1: {f['old'][:60]!r}")
            _get_set(cand, f["path"], cur.replace(f["old"], f["new"], 1))
            edits.append({"path": f["path"], "old": f["old"], "new": f["new"]})
        staged[cid] = (cand, edits)
    if not staged:
        return []
    # before-images + transaction record, BEFORE the first authoritative write
    journal = batch / "reviews" / f"{stage}.jsonl"
    txn_dir = batch / "exact-fix-backups" / f"{stage}-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')}"
    txn_dir.mkdir(parents=True, exist_ok=False)
    for cid in staged:
        shutil.copyfile(batch / "candidates" / f"{cid}.json", txn_dir / f"{cid}.json")
    shutil.copyfile(journal, txn_dir / journal.name)
    txn = {"schema": "hpfetcher-exact-fix-txn.v1", "stage": stage, "date": date, "units": sorted(staged),
           "journal": {"name": journal.name, "length": journal.stat().st_size}, "state": "pending"}
    _publish_txn(txn_dir, txn)          # nothing authoritative has been touched before this point
    try:
        for cid, (cand, edits) in staged.items():
            cand.setdefault("repair_log", []).append({
                "round": f"exact-fix-{stage}", "date": date, "applied_by": "coordinator/exact-fix-applied",
                "source": todo[cid].get("report_sha256"), "before_image": f"exact-fix-backups/{txn_dir.name}/{cid}.json",
                "edits": edits})
            _write_candidate(batch / "candidates" / f"{cid}.json", cand)
            _append_journal(journal, {"candidate_id": cid, "stage": stage,
                                      "verdict": VERDICT_AFTER[stage][todo[cid]["verdict"]],
                                      "reviewed_by": "coordinator/exact-fix-applied", "date": date,
                                      "notes": f"{len(edits)} exact fix(es) applied from report {todo[cid].get('report_sha256')}",
                                      "applied_from": todo[cid].get("report_sha256")})
        # finalisation is inside the protected region: a failure here rolls everything back
        _publish_txn(txn_dir, dict(txn, state="committed"))
    except BaseException:
        _rollback(batch, txn_dir, txn)  # may itself fail: txn.json then still says "pending" and recover() finishes the job
        raise
    return sorted(staged)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", required=True, type=Path)
    ap.add_argument("--stage", required=True, choices=sorted(VERDICT_AFTER))
    ap.add_argument("--date", default=datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    ap.add_argument("--recover", action="store_true", help="roll back pending transactions and exit")
    a = ap.parse_args()
    if a.recover:
        rolled = recover(a.batch_dir)
        print(f"apply_exact_fixes --recover: {len(rolled)} pending transaction(s) rolled back")
        for r in rolled:
            print(r)
        return 0
    try:
        changed = apply(a.batch_dir, a.stage, a.date)
    except FixError as e:
        print(f"apply_exact_fixes: FAILED — {e}", file=sys.stderr)
        return 2
    print(f"apply_exact_fixes {a.stage}: {len(changed)} unit(s) changed")
    for cid in changed:
        print(cid)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
