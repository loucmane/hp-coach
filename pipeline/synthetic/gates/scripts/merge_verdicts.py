#!/usr/bin/env python3
"""Canonical verdict merge with a vote-source contract.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 8b): batch16's merged
verdicts.jsonl carried the same G-KEY leg twice — once from the raw leg file
(no `vote` field) and once from its vote-stamped `-v` twin — so the raw
record count overstated blind coverage by seven answers. The merge contract
below makes that impossible:

  IDENTITY  = (candidate_id, gate, target, executed_by, justification, run)
  Two records with the same IDENTITY are the SAME evidence. They are merged
  to one output record; a vote-bearing copy wins over an unstamped copy.
  Two same-IDENTITY records carrying DIFFERENT votes are distinct ballots
  and are both kept (a solver may legitimately sit in both fleet votes).
  Records with different IDENTITY are always both kept (last file wins on
  full-key collisions, preserving the established last-wins repair flow).

Deterministic: output order is first-seen order over inputs in argv order.
Exit 0 on success; prints a one-line summary with the dedup count so a
silent no-op is visible in logs.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path


class MergeContractError(ValueError):
    """A record violates the merge contract; the merge fails closed."""


def _validate(v: dict, source: str) -> None:
    # Hardened per the 2026-08-31 GC hardening-review lane: identity built
    # from silently-None optional fields lets distinct evidence collide.
    for field in ("candidate_id", "gate", "target"):
        if not isinstance(v.get(field), str) or not v[field].strip():
            raise MergeContractError(
                f"{source}: record missing required identity field "
                f"'{field}': {json.dumps(v, ensure_ascii=False)[:120]}")
    if v.get("executed_by") is None and v.get("justification") is None:
        raise MergeContractError(
            f"{source}: record carries neither executed_by nor "
            f"justification — identity too weak to dedup safely: "
            f"{json.dumps(v, ensure_ascii=False)[:120]}")
    if "vote" in v and (isinstance(v["vote"], bool)
                       or not isinstance(v["vote"], int) or v["vote"] < 1):
        raise MergeContractError(
            f"{source}: vote must be a positive integer, got "
            f"{v['vote']!r}")


def identity(v: dict) -> tuple:
    return (v.get("candidate_id"), v.get("gate"), v.get("target"),
            v.get("executed_by"), v.get("justification"), v.get("run"))


def merge(files: list[Path]) -> tuple[list[dict], int]:
    kept: dict[tuple, dict] = {}
    order: list[tuple] = []
    dropped = 0
    for fp in files:
        for line in fp.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            v = json.loads(line)
            _validate(v, fp.name)
            base = identity(v)
            key = base + (v.get("vote"),)
            unstamped = base + (None,)
            if v.get("vote") is not None and unstamped in kept:
                # vote-stamped twin of an unstamped copy: upgrade in place
                kept.pop(unstamped)
                idx = order.index(unstamped)
                order[idx] = key
                kept[key] = v
                dropped += 1
                continue
            if v.get("vote") is None:
                # is any stamped twin already present? then this copy is a dup
                if any(k[:-1] == base and k[-1] is not None for k in kept):
                    dropped += 1
                    continue
            if key in kept:
                dropped += 1  # exact same evidence again — last wins
            else:
                order.append(key)
            kept[key] = v
    return [kept[k] for k in order], dropped


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("inputs", nargs="+", type=Path,
                    help="verdict jsonl files, base first, legs after (argv order wins)")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    records, dropped = merge(args.inputs)
    with args.out.open("w", encoding="utf-8") as fh:
        for v in records:
            fh.write(json.dumps(v, ensure_ascii=False) + "\n")
    votes = sum(1 for v in records if v.get("vote") is not None)
    print(f"merge_verdicts: {len(records)} record(s) ({votes} vote-bearing), "
          f"{dropped} duplicate copy/copies collapsed -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
