#!/usr/bin/env python3
"""Assemble a batch's canonical verdicts.jsonl deterministically.

The gate fleet writes one file per (gate, round); repairs between rounds make
later records supersede earlier ones for the same target. The canonical file
is the LAST-WINS projection of every round, in an explicit, reproducible
order, so that two people running this script on the same inputs get the
same bytes and the file can be bound by digest.

Rules (all explicit, none inferred from mtimes):

  ROUNDS   the suffixes "", "-r2", "-r3", ... discovered from the files that
           exist; processed in ascending round order.
  ORDER    inside a round: mech file first, then the gates in FIXED order
             G-KEY (the gkey_resolve.py output, which carries both votes and
             the resolved kill verdicts), G-STEM, G-DISTRACTOR, G-SPRAK,
             G-ENG, G-REGISTER. A combined language file
             verdicts-lang<round>.jsonl (records carry their own gate) is
             read at the G-SPRAK slot, before any per-gate language file.
  NORMAL   language gates (G-SPRAK, G-ENG, G-REGISTER) are per-unit: their
           target is normalised to "passage"; a legacy "run" field becomes
           "vote".
  IDENTITY (candidate_id, gate, target, vote). A later record with the same
           identity REPLACES the earlier one and takes the later position
           (pop + reinsert), so a re-legged target sits with the round that
           last judged it. Records never judged again keep their round-1
           position.

--check compares the projection with an existing file on THREE levels and
exits 0 only on the strictest one that ordering can legitimately differ on:
  identity-set     same (candidate_id, gate, target, vote) identities
  record-multiset  same complete normalised records (verdict, findings,
                   justification, executed_by, date, ... — every field), as a
                   multiset; only ORDER may differ.  <- required for exit 0
  byte-identical   same bytes in the same order (what a digest binds)
A changed verdict or finding with the same identity fails the check
(2026-09-02 Codex review finding 1: identity-only comparison let a
pass->kill edit report set-identical=True).

Usage:
  assemble_verdicts.py --batch-dir batches/batch21 --out batches/batch21/verdicts.jsonl
  assemble_verdicts.py --batch-dir batches/batch20 --check batches/batch20/verdicts.jsonl
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

GATE_ORDER = ("gkey", "gstem", "gdistractor", "gsprak", "geng", "gregister")
PER_UNIT_GATES = {"G-SPRAK", "G-ENG", "G-REGISTER"}


def _load(p: Path) -> list[dict]:
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()]


def _normalise(v: dict) -> dict:
    v = dict(v)
    if v.get("gate") in PER_UNIT_GATES:
        v["target"] = "passage"
    if "run" in v and "vote" not in v:
        v["vote"] = v.pop("run")
    return v


def discover_rounds(batch: Path) -> list[str]:
    sfx: set[str] = {""}
    for p in list((batch / "verdicts").glob("verdicts-*.jsonl")) + list(batch.glob("verdicts-mech*.jsonl")):
        m = re.search(r"-(r\d+)(?:-resolved|-\d)?\.jsonl$", p.name)
        if m:
            sfx.add("-" + m.group(1))
    return sorted(sfx, key=lambda s: (0 if s == "" else int(s[2:])))


def file_order(batch: Path) -> list[Path]:
    order: list[Path] = []
    for r in discover_rounds(batch):
        mech = batch / f"verdicts-mech{r}.jsonl"
        if mech.exists():
            order.append(mech)
        for g in GATE_ORDER:
            if g == "gkey":
                f = batch / "verdicts" / (f"verdicts-gkey{r}-resolved.jsonl" if r else "verdicts-gkey-resolved.jsonl")
            else:
                f = batch / "verdicts" / f"verdicts-{g}{r}.jsonl"
            if g == "gsprak":
                lang = batch / "verdicts" / f"verdicts-lang{r}.jsonl"
                if lang.exists():
                    order.append(lang)
            if f.exists():
                order.append(f)
    return order


def assemble(batch: Path) -> tuple[list[dict], list[Path]]:
    order = file_order(batch)
    kept: dict[tuple, dict] = {}
    for f in order:
        for v in _load(f):
            v = _normalise(v)
            k = (v["candidate_id"], v["gate"], v.get("target"), v.get("vote"))
            kept.pop(k, None)
            kept[k] = v
    return list(kept.values()), order


def _dump(records: list[dict]) -> str:
    return "".join(json.dumps(v, ensure_ascii=False) + "\n" for v in records)


def _canon(v: dict) -> str:
    """Complete normalised record as one canonical string (all fields)."""
    return json.dumps(v, ensure_ascii=False, sort_keys=True)


def compare(existing: list[dict], projection: list[dict]) -> dict:
    """Three-level comparison; see module docstring."""
    key = lambda v: str((v["candidate_id"], v["gate"], v.get("target"), v.get("vote")))
    ex_c, pr_c = sorted(map(_canon, existing)), sorted(map(_canon, projection))
    ex_set, pr_set = set(ex_c), set(pr_c)
    return {
        "identity_set_identical": sorted(map(key, existing)) == sorted(map(key, projection)),
        "record_multiset_identical": ex_c == pr_c,
        "byte_identical": _dump(existing) == _dump(projection),
        "only_in_existing": sorted(ex_set - pr_set),
        "only_in_projection": sorted(pr_set - ex_set),
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", required=True, type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--check", type=Path, help="compare projection with this existing file")
    args = ap.parse_args()

    records, order = assemble(args.batch_dir)
    kills = sum(1 for v in records if v.get("verdict") == "kill")
    print(f"assemble_verdicts: {len(order)} input file(s), {len(records)} record(s), {kills} kill(s)")
    for f in order:
        print(f"  <- {f.relative_to(args.batch_dir)}")

    if args.check:
        existing = [_normalise(v) for v in _load(args.check)]
        result = compare(existing, records)
        print(f"assemble_verdicts --check {args.check}: records {len(existing)} vs {len(records)}; "
              f"identity-set-identical={result['identity_set_identical']}; "
              f"record-multiset-identical={result['record_multiset_identical']}; "
              f"byte-identical={result['byte_identical']}")
        for label in ("only_in_existing", "only_in_projection"):
            for rec in result[label][:5]:
                print(f"  {label}: {rec[:200]}")
        if not result["record_multiset_identical"]:
            return 1
    if args.out:
        args.out.write_text(_dump(records), encoding="utf-8")
        print(f"assemble_verdicts: -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
