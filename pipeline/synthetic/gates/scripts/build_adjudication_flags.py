#!/usr/bin/env python3
"""Build <batch>/adjudication-flags.json mechanically — no triage judgement.

Stage 11 feeds adjudicate_fold.py two things: the fresh-eyes reader evidence
and a flags file. Batches 18/19 built the flags file by hand-triage in the
coordinator session; this script replaces that with a fixed rule so the file
is reproducible from the batch's own artefacts and can be bound by digest.

FAIL-CLOSED INVENTORY (2026-09-02 Codex review finding 2 — an absent
verdicts file or audit must never read as "zero flags"). Before any flag is
produced, ALL of the following must hold, else FlagsInputError (exit 2):

  candidates/*.json    >= 1 unit; each parses; candidate_id == file stem;
                       questions[] non-empty with q_index
  verdicts.jsonl       exists, non-empty, every record has candidate_id /
                       gate / target / verdict in {pass, flag, kill}; no
                       record for an unknown unit; identity
                       (candidate_id, gate, target, vote) unique; and for
                       EVERY unit: G-KEY votes 1 and 2, G-STEM, G-DISTRACTOR
                       on every q:<n>; G-REGISTER on passage; at least one
                       of G-SPRAK / G-ENG on passage; all six M-* gates
  verdicts-vfinal/verdicts-gdistractor.jsonl
                       exists; every unit's every q:<n> present; verdicts
                       in {pass, flag, kill}; identities unique
  audits/<cid>.json    one per unit; candidate_id matches; audit_verdict
                       present; findings[] items carry severity in
                       {minor, note, info, major, critical} /
                       stage_challenged / claim; `why` and `id` are optional
                       in the shipped audit contract (batch18/19 carry
                       findings without them); ids unique when present

RULE, per candidate, in this order:
  1. every canonical verdict with verdict in {flag, kill}
       source   "<GATE>:<target>"
       severity "minor" for flag, "major" for kill
       note     "; ".join(str(f) for f in findings) or justification
  2. every V-FINAL G-DISTRACTOR verdict in {flag, kill}
       source   "G-DISTRACTOR:vfinal:<target>"      (same severity/note rule)
  3. every audit finding
       source   "audit:<stage_challenged>"
       severity finding.severity
       note     claim + " — " + why   (claim alone when why is absent)
  4. every record in reviews/escalations.jsonl (lane evidence that was major/critical,
     a self-kill, a kill, a REFUTED audit or a reader blocker — written by
     lane_bundle.py ingest --record-escalations; optional file, never implied)
       source   "escalation:<lane_class>"
       severity the recorded severity (major/critical → adjudicate_fold escalates)
       note     <kind> @ <location>: <evidence>
  Every note is truncated to 400 characters. Output is JSON, indent=1,
  ensure_ascii=False, keys in candidate order of candidates/*.json.

adjudicate_fold.py then applies ITS rule: gate-sourced flags are auto-
dispositioned; any non-gate source with severity outside {minor, note, info}
escalates the unit to ÄGARBLICK. Nothing here decides anything.

--check compares against an existing flags file (exit 1 on mismatch).
Proven byte-identical against batches/batch19/adjudication-flags.json.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

NOTE_MAX = 400
VERDICTS = {"pass", "flag", "kill"}
SEVERITIES = {"minor", "note", "info", "major", "critical"}
MECH_GATES = ("M-SCHEMA", "M-BANDS", "M-TELL", "M-FORM", "M-ECHO", "M-PLAGIARISM")


class FlagsInputError(ValueError):
    """The batch does not carry the complete stage-11 evidence inventory."""


def _jsonl(p: Path, label: str) -> list[dict]:
    if not p.is_file():
        raise FlagsInputError(f"{label}: missing required file {p}")
    out = []
    for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            v = json.loads(line)
        except json.JSONDecodeError as e:
            raise FlagsInputError(f"{label}: {p}:{n} is not JSON ({e})") from e
        if not isinstance(v, dict):
            raise FlagsInputError(f"{label}: {p}:{n} is not an object")
        out.append(v)
    if not out:
        raise FlagsInputError(f"{label}: {p} is empty")
    return out


def _load_candidates(batch: Path) -> dict[str, list[str]]:
    cdir = batch / "candidates"
    files = sorted(cdir.glob("*.json")) if cdir.is_dir() else []
    if not files:
        raise FlagsInputError(f"candidates: no units under {cdir}")
    units: dict[str, list[str]] = {}
    for p in files:
        try:
            c = json.loads(p.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise FlagsInputError(f"candidates: {p} is not JSON ({e})") from e
        if not isinstance(c, dict):
            raise FlagsInputError(f"candidates: {p} is not an object")
        if c.get("candidate_id") != p.stem:
            raise FlagsInputError(f"candidates: {p} candidate_id {c.get('candidate_id')!r} != file stem")
        qs = c.get("questions")
        if not isinstance(qs, list) or not qs or any("q_index" not in q for q in qs):
            raise FlagsInputError(f"candidates: {p} has no usable questions[]")
        units[p.stem] = [f"q:{q['q_index']}" for q in qs]
    return units


def _check_records(recs: list[dict], units: dict[str, list[str]], label: str) -> None:
    seen: set[tuple] = set()
    for v in recs:
        for f in ("candidate_id", "gate", "target", "verdict"):
            if not isinstance(v.get(f), str) or not v[f]:
                raise FlagsInputError(f"{label}: record lacks {f}: {json.dumps(v, ensure_ascii=False)[:120]}")
        if v["candidate_id"] not in units:
            raise FlagsInputError(f"{label}: record for unknown unit {v['candidate_id']}")
        if v["verdict"] not in VERDICTS:
            raise FlagsInputError(f"{label}: verdict {v['verdict']!r} not in {sorted(VERDICTS)}")
        k = (v["candidate_id"], v["gate"], v["target"], v.get("vote"))
        if k in seen:
            raise FlagsInputError(f"{label}: duplicate identity {k}")
        seen.add(k)


def _check_canonical_coverage(recs: list[dict], units: dict[str, list[str]]) -> None:
    have = {(v["candidate_id"], v["gate"], v["target"], v.get("vote")) for v in recs}
    gates = {(v["candidate_id"], v["gate"], v["target"]) for v in recs}
    for cid, targets in units.items():
        for t in targets:
            for vote in (1, 2):
                if (cid, "G-KEY", t, vote) not in have:
                    raise FlagsInputError(f"verdicts.jsonl: {cid} {t} lacks G-KEY vote {vote}")
            for g in ("G-STEM", "G-DISTRACTOR"):
                if (cid, g, t) not in gates:
                    raise FlagsInputError(f"verdicts.jsonl: {cid} {t} lacks {g}")
        if (cid, "G-REGISTER", "passage") not in gates:
            raise FlagsInputError(f"verdicts.jsonl: {cid} lacks G-REGISTER")
        if (cid, "G-SPRAK", "passage") not in gates and (cid, "G-ENG", "passage") not in gates:
            raise FlagsInputError(f"verdicts.jsonl: {cid} lacks a language gate (G-SPRAK/G-ENG)")
        for g in MECH_GATES:
            if not any(x[0] == cid and x[1] == g for x in gates):
                raise FlagsInputError(f"verdicts.jsonl: {cid} lacks {g}")


def _check_vfinal_coverage(recs: list[dict], units: dict[str, list[str]]) -> None:
    have = {(v["candidate_id"], v["target"]) for v in recs}
    for cid, targets in units.items():
        for t in targets:
            if (cid, t) not in have:
                raise FlagsInputError(f"verdicts-vfinal/verdicts-gdistractor.jsonl: {cid} {t} missing")


def _load_audit(batch: Path, cid: str) -> dict:
    p = batch / "audits" / f"{cid}.json"
    if not p.is_file():
        raise FlagsInputError(f"audits: missing required {p}")
    try:
        a = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise FlagsInputError(f"audits: {p} is not JSON ({e})") from e
    if not isinstance(a, dict):
        raise FlagsInputError(f"audits: {p} is not an object (candidate_id mismatch)")
    if a.get("candidate_id") != cid:
        raise FlagsInputError(f"audits: {p} candidate_id mismatch")
    if not isinstance(a.get("audit_verdict"), str) or not a["audit_verdict"]:
        raise FlagsInputError(f"audits: {p} lacks audit_verdict")
    fs = a.get("findings")
    if not isinstance(fs, list):
        raise FlagsInputError(f"audits: {p} findings is not a list")
    ids: set[str] = set()
    for f in fs:
        if not isinstance(f, dict):
            raise FlagsInputError(f"audits: {p} finding is not an object")
        for k in ("severity", "stage_challenged", "claim"):
            if not isinstance(f.get(k), str) or not f[k]:
                raise FlagsInputError(f"audits: {p} finding lacks {k}: {json.dumps(f, ensure_ascii=False)[:120]}")
        if f["severity"] not in SEVERITIES:
            raise FlagsInputError(f"audits: {p} finding severity {f['severity']!r} invalid")
        fid = f.get("id")
        if fid is not None:
            if not isinstance(fid, str) or not fid:
                raise FlagsInputError(f"audits: {p} finding id must be a non-empty string when present")
            if fid in ids:
                raise FlagsInputError(f"audits: {p} duplicate finding id {fid}")
            ids.add(fid)
    return a


def _gate_note(v: dict) -> str:
    return ("; ".join(str(f) for f in (v.get("findings") or [])) or v.get("justification", ""))[:NOTE_MAX]


def build(batch: Path) -> dict:
    units = _load_candidates(batch)
    canonical = _jsonl(batch / "verdicts.jsonl", "verdicts.jsonl")
    _check_records(canonical, units, "verdicts.jsonl")
    _check_canonical_coverage(canonical, units)
    vfinal = _jsonl(batch / "verdicts-vfinal" / "verdicts-gdistractor.jsonl", "verdicts-vfinal/verdicts-gdistractor.jsonl")
    _check_records(vfinal, units, "verdicts-vfinal/verdicts-gdistractor.jsonl")
    _check_vfinal_coverage(vfinal, units)
    audits = {cid: _load_audit(batch, cid) for cid in units}

    flags = {cid: [] for cid in units}
    for v in canonical:
        if v["verdict"] in ("flag", "kill"):
            flags[v["candidate_id"]].append({
                "source": f"{v['gate']}:{v['target']}",
                "severity": "minor" if v["verdict"] == "flag" else "major",
                "note": _gate_note(v)})
    for v in vfinal:
        if v["verdict"] in ("flag", "kill"):
            flags[v["candidate_id"]].append({
                "source": f"G-DISTRACTOR:vfinal:{v['target']}",
                "severity": "minor" if v["verdict"] == "flag" else "major",
                "note": _gate_note(v)})
    for cid in units:
        for f in audits[cid]["findings"]:
            flags[cid].append({
                "source": f"audit:{f['stage_challenged']}",
                "severity": f["severity"],
                "note": (f"{f['claim']} — {f['why']}" if f.get("why") else f["claim"])[:NOTE_MAX]})
    esc_path = batch / "reviews" / "escalations.jsonl"
    if esc_path.is_file():
        for e in _jsonl(esc_path, "reviews/escalations.jsonl"):
            for k in ("candidate_id", "severity", "lane_class", "kind"):
                if not isinstance(e.get(k), str) or not e[k]:
                    raise FlagsInputError(f"reviews/escalations.jsonl: record lacks {k}")
            if e["candidate_id"] not in units:
                raise FlagsInputError(f"reviews/escalations.jsonl: unknown unit {e['candidate_id']}")
            if e["severity"] not in SEVERITIES:
                raise FlagsInputError(f"reviews/escalations.jsonl: severity {e['severity']!r} invalid")
            flags[e["candidate_id"]].append({
                "source": f"escalation:{e['lane_class']}",
                "severity": e["severity"],
                "note": f"{e['kind']} @ {e.get('location')}: {e.get('evidence')}"[:NOTE_MAX]})
    return flags


def dump(flags: dict) -> str:
    return json.dumps(flags, ensure_ascii=False, indent=1)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--batch-dir", required=True, type=Path)
    ap.add_argument("--out", type=Path)
    ap.add_argument("--check", type=Path)
    args = ap.parse_args()
    try:
        flags = build(args.batch_dir)
    except FlagsInputError as e:
        print(f"build_adjudication_flags: INPUT ERROR — {e}", file=sys.stderr)
        return 2
    n = sum(len(v) for v in flags.values())
    print(f"build_adjudication_flags: {len(flags)} unit(s), {n} flag(s)")
    if args.check:
        existing = args.check.read_text(encoding="utf-8")
        same = existing == dump(flags)
        same_semantic = json.loads(existing) == flags
        print(f"build_adjudication_flags --check {args.check}: byte-identical={same} semantic-identical={same_semantic}")
        if not same_semantic:
            return 1
    if args.out:
        args.out.write_text(dump(flags), encoding="utf-8")
        print(f"build_adjudication_flags: -> {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
