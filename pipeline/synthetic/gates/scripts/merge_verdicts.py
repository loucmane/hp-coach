#!/usr/bin/env python3
"""Canonical verdict merge: vote-source contract + repair supersession.

Ägardom 2026-08-31 (bead hpf-y1p4, batch16 ÄGARBLICK 8b): batch16's merged
verdicts.jsonl carried the same G-KEY leg twice — once from the raw leg file
(no `vote` field) and once from its vote-stamped `-v` twin — so the raw
record count overstated blind coverage by seven answers. PR #370 review
(bead hpf-qo10): a repaired verdict usually carries a new executed_by and/or
justification, so merging on evidence identity alone kept the obsolete
verdict beside its repair, and an obsolete kill reads as DEAD. The contract:

  SLOT      = (candidate_id, gate, target, vote)       — one ballot position
  IDENTITY  = (candidate_id, gate, target, executed_by, justification, run)
                                                       — one piece of evidence

  1. Twins. An unstamped record (no `vote`) folds into a vote-stamped
     record of the same IDENTITY only when the two are EQUAL once `vote` is
     removed — the same evidence, a raw leg and its `-v` copy — whichever
     file or order either arrives in. A shared IDENTITY with any other
     difference (PR #370 round 2, bead hpf-oy2w: a stamped pass and an
     unstamped kill) is contradictory evidence and FAILS CLOSED.
  2. Same input file. Records sharing a SLOT must be the same evidence
     restated (same IDENTITY: the later line wins) or numbered ballots
     (every one carries an integer `run` and the runs differ: all are kept,
     e.g. a unit-level G-SPRAK re-gate run x3). Anything else FAILS CLOSED.
     In the real batch verdict files an appended re-gate (kill, then a
     `-regate` pass) and a second unstamped ballot (leg 1 and leg 2 of a
     G-KEY resolve) have the same shape — both differ only in executed_by /
     justification — so keeping both resurrects obsolete kills and last-wins
     silently deletes a ballot. Put a re-gate in its own later input file;
     stamp distinct ballots with `vote` or `run`.
  3. Repair supersession across files (BATCH-RUNBOOK "Repair re-gates must
     flow into the batch merge"). For each SLOT the LAST input file in argv
     order that carries it wins: its records replace every record for that
     SLOT from earlier files, whatever their executed_by/justification/run.

Every record is validated first, line by line, before any rule above can
replace, fold or collapse it (PR #370 round 5, bead hpf-6fkm): `verdict` and
`gate` must each be exactly one of the verdict schema's enum values, read
from gates/schemas/verdict.schema.json (no second copy here). aggregate.py
reads any verdict other than kill/flag as a pass and counts kills only under
gates it knows, so an unknown verdict in a repair record used to supersede a
kill, and a kill under a misspelt gate vanished. Every refusal names the
file and line.

Accounting, printed so a silent no-op stays visible: `superseded` counts
records replaced by different content (a repair took effect, or a same-
IDENTITY restatement changed something), `duplicates` counts byte-identical
copies collapsed (no-ops), `twins` counts unstamped copies folded into their
vote-stamped twin.

Deterministic: output keeps first-seen order, and replacing records take
the places of the records they replace, in order (repairs land in place, as
the batch16/17 hand merges laid them out). Exit 0 on success; a contract
violation prints MERGE CONTRACT VIOLATION, writes nothing, and exits 1.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


class MergeContractError(ValueError):
    """A record violates the merge contract; the merge fails closed."""


SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schemas" / "verdict.schema.json"


def schema_enum(schema: dict, prop: str) -> frozenset[str]:
    """The verdict schema's enum for `prop`. A schema that lost the enum stops
    the merge instead of letting every value through."""
    try:
        values = schema["properties"][prop]["enum"]
    except (KeyError, TypeError) as exc:
        raise RuntimeError(f"{SCHEMA_PATH}: no properties.{prop}.enum") from exc
    if (not isinstance(values, list) or not values
            or not all(isinstance(x, str) and x for x in values)):
        raise RuntimeError(f"{SCHEMA_PATH}: properties.{prop}.enum must be a non-empty "
                           f"list of non-empty strings, got {values!r}")
    return frozenset(values)


_SCHEMA = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
VERDICTS = schema_enum(_SCHEMA, "verdict")
GATES = schema_enum(_SCHEMA, "gate")


@dataclass
class MergeStats:
    superseded: int = 0  # replaced by different content
    duplicates: int = 0  # byte-identical copies collapsed
    twins: int = 0       # unstamped copies folded into their vote-stamped twin


def _validate(v: dict, source: str) -> None:
    # `source` is "<file>:<line>"; merge() runs this on every record before
    # any merge rule, so a record a rule would drop is checked as well.
    if not isinstance(v, dict):
        raise MergeContractError(
            f"{source}: record must be a JSON object, got "
            f"{json.dumps(v, ensure_ascii=False)[:120]}")
    # Hardened per the 2026-08-31 GC hardening-review lane: identity built
    # from silently-None optional fields lets distinct evidence collide.
    for field in ("candidate_id", "gate", "target"):
        if not isinstance(v.get(field), str) or not v[field].strip():
            raise MergeContractError(
                f"{source}: record missing required identity field "
                f"'{field}': {json.dumps(v, ensure_ascii=False)[:120]}")
    # PR #370 round 5 (bead hpf-6fkm): exact schema enum values only — no
    # case folding, no stripping. aggregate.py ignores a kill under a gate
    # it does not know and reads any verdict but kill/flag as a pass.
    if v["gate"] not in GATES:
        raise MergeContractError(
            f"{source}: gate must be exactly one of {', '.join(sorted(GATES))} "
            f"(verdict.schema.json), got {v['gate']!r}")
    if not isinstance(v.get("verdict"), str) or v["verdict"] not in VERDICTS:
        got = repr(v["verdict"]) if "verdict" in v else "no verdict"
        raise MergeContractError(
            f"{source}: verdict must be exactly one of {', '.join(sorted(VERDICTS))} "
            f"(verdict.schema.json), got {got}")
    # Deliberately not enforced (docs/worklog/hpf-6fkm.md): the schema's
    # `target` pattern (837 real records use 'unit', 'q1'..'q5' or 'q:') and
    # `findings` presence/type (10 real G-KEY passes carry a string). Neither
    # can turn a kill or a flag into a pass; aggregate.py reads `findings`
    # only to report flags and a lone language kill.
    if v.get("executed_by") is None and v.get("justification") is None:
        raise MergeContractError(
            f"{source}: record carries neither executed_by nor "
            f"justification — identity too weak to dedup safely: "
            f"{json.dumps(v, ensure_ascii=False)[:120]}")
    # `run` numbers same-file ballots (rule 2), so it is held to the same
    # standard as `vote`: "1" and 1 must not pass as two different ballots.
    for field in ("vote", "run"):
        if field in v and (isinstance(v[field], bool)
                           or not isinstance(v[field], int) or v[field] < 1):
            raise MergeContractError(
                f"{source}: {field} must be a positive integer, got "
                f"{v[field]!r}")


def identity(v: dict) -> tuple:
    return (v.get("candidate_id"), v.get("gate"), v.get("target"),
            v.get("executed_by"), v.get("justification"), v.get("run"))


def slot(v: dict) -> tuple:
    return (v.get("candidate_id"), v.get("gate"), v.get("target"), v.get("vote"))


def _without_vote(v: dict) -> dict:
    return {k: x for k, x in v.items() if k != "vote"}


_MISSING = object()


def _not_a_twin(files: list[Path], recs: list[tuple[int, int, dict]], raw: int,
                copies: list[int]) -> str:
    fi, n, v = recs[raw]
    seen = []
    for j in copies:
        fj, m, s = recs[j]
        diff = sorted(k for k in set(s) | set(v)
                      if k != "vote" and s.get(k, _MISSING) != v.get(k, _MISSING))
        seen.append(f"{files[fj]}:{m} (vote={s['vote']}, verdict={s.get('verdict')!r}; "
                    f"differs in {', '.join(diff)})")
    return (f"{files[fi]}:{n}: unstamped record (verdict={v.get('verdict')!r}) shares its "
            f"evidence IDENTITY (candidate_id, gate, target, executed_by, justification, run) "
            f"with vote-stamped {'; '.join(seen)} — not a twin: a raw leg must equal its "
            f"stamped copy apart from `vote`. Contradictory evidence is never folded; drop "
            f"the stale copy or re-stamp the leg from the raw file")


def merge(files: list[Path]) -> tuple[list[dict], MergeStats]:
    recs: list[tuple[int, int, dict]] = []  # (input file index, line no, record)
    for fi, fp in enumerate(files):
        for n, line in enumerate(fp.read_text(encoding="utf-8").splitlines(), 1):
            line = line.strip()
            if not line:
                continue
            try:
                v = json.loads(line)
            except json.JSONDecodeError as exc:
                raise MergeContractError(f"{fp}:{n}: not valid JSON ({exc})") from exc
            _validate(v, f"{fp}:{n}")
            recs.append((fi, n, v))

    stats = MergeStats()
    alive = set(range(len(recs)))
    anchor = list(range(len(recs)))  # output position: earliest record absorbed

    def absorb(loser: int, winner: int) -> None:
        alive.discard(loser)
        anchor[winner] = min(anchor[winner], anchor[loser])

    # 1. twins: the stamped copy wins, in whichever order the two arrive —
    #    but only a copy of the SAME evidence (equal once `vote` is removed)
    #    is a twin; a shared IDENTITY alone fails closed
    stamped: dict[tuple, list[int]] = defaultdict(list)
    for i, (_, _, v) in enumerate(recs):
        if v.get("vote") is not None:
            stamped[identity(v)].append(i)
    for i, (_, _, v) in enumerate(recs):
        if v.get("vote") is not None or identity(v) not in stamped:
            continue
        copies = stamped[identity(v)]
        bare = _without_vote(v)
        twin = next((j for j in copies if _without_vote(recs[j][2]) == bare), None)
        if twin is None:
            raise MergeContractError(_not_a_twin(files, recs, i, copies))
        absorb(i, twin)
        stats.twins += 1

    # 2. same input file: restatements collapse, numbered ballots stay,
    #    any other collision on a SLOT is ambiguous and fails closed
    per_file_slot: dict[tuple, list[int]] = defaultdict(list)
    for i in sorted(alive):
        fi, _, v = recs[i]
        per_file_slot[(fi, slot(v))].append(i)
    for (fi, key), members in per_file_slot.items():
        by_identity: dict[tuple, list[int]] = defaultdict(list)
        for i in members:
            by_identity[identity(recs[i][2])].append(i)
        runs = [ident[-1] for ident in by_identity]
        if len(by_identity) > 1 and (None in runs or len(set(runs)) != len(runs)):
            seen = ", ".join(
                f"line {recs[same[-1]][1]} executed_by={ident[3]!r} run={ident[-1]!r}"
                for ident, same in by_identity.items())
            raise MergeContractError(
                f"{files[fi]}: same file carries {len(by_identity)} different records "
                f"for (candidate_id, gate, target, vote)={key!r} without distinct "
                f"integer `run` numbers ({seen}) — an appended re-gate and a second "
                f"ballot are indistinguishable here; put the re-gate in its own "
                f"later input file, or stamp the ballots with `vote`/`run`")
        for same in by_identity.values():
            last = same[-1]
            for i in same[:-1]:
                absorb(i, last)
                if recs[i][2] == recs[last][2]:
                    stats.duplicates += 1
                else:
                    stats.superseded += 1

    # 3. repair supersession: the last input file carrying a SLOT wins it
    last_file: dict[tuple, int] = {}
    for i in sorted(alive):
        fi, _, v = recs[i]
        last_file[slot(v)] = fi  # positions run in argv order, so this ends at the max
    winners: dict[tuple, list[int]] = defaultdict(list)
    replaced: dict[tuple, list[int]] = defaultdict(list)
    for i in sorted(alive):
        fi, _, v = recs[i]
        (winners if fi == last_file[slot(v)] else replaced)[slot(v)].append(i)
    for key, old in replaced.items():
        ws = winners[key]
        for i in old:
            alive.discard(i)
            if any(recs[w][2] == recs[i][2] for w in ws):
                stats.duplicates += 1
            else:
                stats.superseded += 1
        # the k-th replacing record takes the k-th replaced record's place
        # (extras line up behind the last), so a re-run set lands where the
        # set it replaces stood, interleaving with other units intact
        old.sort(key=lambda i: anchor[i])
        for k, w in enumerate(ws):
            anchor[w] = min(anchor[w], anchor[old[min(k, len(old) - 1)]])

    order = sorted(alive, key=lambda i: (anchor[i], i))
    return [recs[i][2] for i in order], stats


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("inputs", nargs="+", type=Path,
                    help="verdict jsonl files, base first, re-gate legs after "
                         "(a later file supersedes earlier ones per slot)")
    ap.add_argument("--out", type=Path, required=True)
    args = ap.parse_args()
    try:
        records, stats = merge(args.inputs)
    except MergeContractError as exc:
        print(f"merge_verdicts: MERGE CONTRACT VIOLATION — {exc}", file=sys.stderr)
        return 1
    with args.out.open("w", encoding="utf-8") as fh:
        for v in records:
            fh.write(json.dumps(v, ensure_ascii=False) + "\n")
    votes = sum(1 for v in records if v.get("vote") is not None)
    print(f"merge_verdicts: {len(records)} record(s) ({votes} vote-bearing); "
          f"{stats.superseded} superseded by later input, "
          f"{stats.duplicates} exact duplicate(s), "
          f"{stats.twins} unstamped twin(s) collapsed -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
