"""Resolve blind G-KEY verdicts into kill/pass by comparing to the stored key.

A G-KEY executor is a *blind* solver: it never sees the intended key, so it
emits `verdict:"pass"` with a committed `solver_answer` (or self-kills on
`MULTIPLE_DEFENSIBLE`/`NONE_DEFENSIBLE`). The wrong-key kill therefore cannot
happen at the executor and would be invisible to aggregate.py. This script does
the comparison mechanically, so it is not skippable orchestrator discipline:

  solver_answer == key            -> pass (unchanged)
  solver_answer != key            -> kill (lethal: wrong key)
  MULTIPLE_/NONE_DEFENSIBLE        -> kill (lethal: item not single-answerable)
  already verdict:"kill"          -> passed through untouched

Reads one or more raw G-KEY verdict files, writes normalized verdicts (every
record carries a proper `verdict` + `findings`) to --out.

Usage:
  gkey_resolve.py verdicts-gkey-*.jsonl --candidates-dir <dir> --out resolved.jsonl
"""

from __future__ import annotations

import argparse
import glob
import json
from pathlib import Path

DEFENSIBLE_SELF_KILL = {"MULTIPLE_DEFENSIBLE", "NONE_DEFENSIBLE"}


def load_keys(candidates_dir: Path) -> dict[tuple[str, int], str]:
    """(candidate_id, q_index) -> key letter, from candidates/*.json."""
    keys: dict[tuple[str, int], str] = {}
    for f in sorted(candidates_dir.glob("*.json")):
        cand = json.loads(f.read_text(encoding="utf-8"))
        cid = cand["candidate_id"]
        for q in cand.get("questions", []):
            keys[(cid, int(q["q_index"]))] = q["key"]
    return keys


def resolve(verdict: dict, keys: dict[tuple[str, int], str]) -> dict:
    v = dict(verdict)
    # Already a kill (e.g. executor self-killed with a verdict field): keep it.
    if v.get("verdict") == "kill":
        v.setdefault("findings", [])
        return v

    sa = v.get("solver_answer")
    cid = v.get("candidate_id")
    target = v.get("target", "")
    qn = int(target.split(":")[1]) if ":" in target else None

    if sa in DEFENSIBLE_SELF_KILL:
        v["verdict"] = "kill"
        v["findings"] = [{"severity": "lethal", "note": f"blind solver: {sa}"}]
        return v

    key = keys.get((cid, qn)) if qn is not None else None
    if key is None:
        # Cannot resolve without a key: mark INCOMPLETE-ish by leaving a flag so
        # aggregation surfaces it rather than silently passing.
        v["verdict"] = "flag"
        v["findings"] = [{"severity": "minor",
                          "note": f"no key found for ({cid}, q:{qn}) — cannot resolve G-KEY"}]
        return v

    if sa == key:
        v["verdict"] = "pass"
        v.setdefault("findings", [])
    else:
        v["verdict"] = "kill"
        v["findings"] = [{"severity": "lethal",
                          "note": f"blind solver answered {sa}, stored key is {key}"}]
    return v


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("verdicts", nargs="+", help="raw G-KEY verdict jsonl file(s) or glob(s)")
    ap.add_argument("--candidates-dir", required=True, type=Path)
    ap.add_argument("--out", required=True, type=Path)
    args = ap.parse_args()

    keys = load_keys(args.candidates_dir)

    paths: list[str] = []
    for pat in args.verdicts:
        paths.extend(sorted(glob.glob(pat)) or ([pat] if Path(pat).exists() else []))
    # Self-inclusion guard: the conventional input glob verdicts-gkey-*.jsonl
    # matches our own --out file; re-ingesting it re-emits superseded verdicts
    # AFTER fresh appends and breaks last-wins superseding downstream.
    out_resolved = args.out.resolve()
    paths = [p for p in paths if Path(p).resolve() != out_resolved]

    resolved, kills = [], 0
    for p in paths:
        for line in Path(p).read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            out = resolve(json.loads(line), keys)
            if out["verdict"] == "kill":
                kills += 1
            resolved.append(out)

    args.out.write_text(
        "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in resolved),
        encoding="utf-8",
    )
    print(f"gkey_resolve: {len(resolved)} verdicts, {kills} kill(s) -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
