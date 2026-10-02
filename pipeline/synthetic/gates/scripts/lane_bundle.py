#!/usr/bin/env python3
"""Build, verify and ingest report-only Gas City lane bundles for the P5 completion chain.

This is the executable form of the hpf-gehr lane mechanism (2026-09-02 Codex review
finding 3: lane classes were described, not bound). The bound evidence profile
(`.gas-city-evidence.json`, lanes blind-solver / adversarial-audit) freezes an
ADJUDICATED batch from `candidates-final/`; the completion chain runs BEFORE that,
on `candidates/`, so it needs its own builder. Nothing here bypasses the profile's
shadow-workflow checks: those runs keep using bundle_common.py unchanged.

Lane classes and what their bundle may contain (closed inventory; anything else is
a contamination):

  review-language / review-pedagogy   units.json   = full units minus generator_meta,
                                                     repair_log, _seed
  review-integrated                   units.json + verdicts.jsonl (this unit's canonical
                                                     records) + carry_ins.json
  vfinal-gkey / reval-gkey (BLIND)    blind.json   = make_sheets blind projection
  fresh-eyes   (BLIND)                blind.json
  reval-gstem  (STEMS ONLY)           stems.json   = make_sheets stems projection
  vfinal-gdistractor / reval-gdistractor (KEYED)   distractor.json = make_sheets distractor projection
  vfinal-audit                        unit.json (full, incl. repair_log) + verdicts.jsonl
                                      + reviews.jsonl (that unit's records)
  reval-language                      units.json + changed_spans.json

Every bundle also carries manifest.json (run/lane ids, class, params, inventory with
sha256), instructions.md (from gates/lanes/<class>.instructions.md) and
report.schema.json (from gates/lanes/<class>.schema.json). A byte scan for the
class's forbidden patterns runs over the whole bundle after building; a hit fails
the build. `bundle-digests.txt` is written beside the bundle.

Commands
  build          write <run-root>/lanes/<lane-id>/{bundle,reports}/ from the batch
  verify-bundle  (Codex review v2, finding 1) hash the files ACTUALLY on disk: the
                 on-disk set must equal the declared inventory exactly (no undeclared,
                 none missing), no symlinks / directories / special files, every
                 on-disk digest must equal bundle-digests.txt AND the reconstruction
                 from the CURRENT batch bytes (stage binding), and the class's
                 forbidden-pattern scan is re-run on the on-disk bytes
  verify-report  jsonschema-validate reports/report.json; header/inventory; class-
                 specific coverage AND unique identities (finding 2): one answer per
                 (unit, target); language votes 1, 2 and 3 per unit; a `pair`
                 judgement for every multi-question unit and none for single-question
                 units; one unit entry per unit. Returns the report's ESCALATIONS —
                 major/critical findings, MULTIPLE/NONE_DEFENSIBLE answers, kill
                 verdicts, REFUTED audits, reader blockers
  ingest         verify-bundle + verify-report, then write the batch records in the
                 shapes promote.py / vfinal_fold.py / adjudicate_fold.py read;
                 append-forward, refuses to write over an existing identity. Findings
                 are always carried into the records. If the report holds escalations
                 the ingest REFUSES unless --record-escalations, which also appends
                 them to <batch>/reviews/escalations.jsonl, from where
                 build_adjudication_flags.py surfaces them at their own severity so
                 adjudicate_fold.py escalates the unit (nothing can be lost)
  Phase binding (finding 3): vfinal-gkey / vfinal-gdistractor write ONLY to
  verdicts-vfinal/ and refuse --round; reval-gkey / reval-gdistractor / reval-gstem /
  reval-language REQUIRE --round and write ONLY to verdicts/*-<round>*.jsonl (canonical
  inputs picked up by assemble_verdicts.py; reval-gkey legs are resolved by
  gkey_resolve.py into verdicts-gkey-<round>-resolved.jsonl).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
LANES_DIR = HERE.parent / "lanes"
sys.path.insert(0, str(HERE))
from make_sheets import build as project_sheet  # noqa: E402

try:
    import jsonschema
except ImportError:  # pragma: no cover
    jsonschema = None

BLIND_FORBIDDEN = ['"key"', '"rationale"', '"generator_meta"', '"family"', '"repair_log"', ".git"]
CLASSES: dict[str, dict] = {
    "review-language":   {"sheet": "units", "forbidden": ['"generator_meta"', '"repair_log"', ".git"]},
    "review-pedagogy":   {"sheet": "units", "forbidden": ['"generator_meta"', '"repair_log"', ".git"]},
    "review-integrated": {"sheet": "units", "forbidden": ['"generator_meta"', '"repair_log"', ".git"], "with_verdicts": True},
    "vfinal-gkey":       {"sheet": "blind", "forbidden": BLIND_FORBIDDEN, "param": "vote", "phase": "vfinal"},
    "reval-gkey":        {"sheet": "blind", "forbidden": BLIND_FORBIDDEN, "param": "vote", "phase": "reval"},
    "fresh-eyes":        {"sheet": "blind", "forbidden": BLIND_FORBIDDEN, "single": True},
    "reval-gstem":       {"sheet": "stems", "forbidden": BLIND_FORBIDDEN + ['"passage"', '"title"'], "phase": "reval"},
    "vfinal-gdistractor": {"sheet": "distractor", "forbidden": ['"rationale"', '"generator_meta"', '"repair_log"', ".git"], "phase": "vfinal"},
    "reval-gdistractor":  {"sheet": "distractor", "forbidden": ['"rationale"', '"generator_meta"', '"repair_log"', ".git"], "phase": "reval"},
    "vfinal-audit":      {"sheet": "unit", "forbidden": [".git"], "single": True, "with_verdicts": True, "with_reviews": True},
    "reval-language":    {"sheet": "units", "forbidden": ['"generator_meta"', '"repair_log"', ".git"], "param": "gate", "phase": "reval"},
    "smoke":             {"sheet": "smoke", "forbidden": BLIND_FORBIDDEN, "fixture": True},
}
SMOKE_UNIT = {
    "candidate_id": "smoke-0001", "section": "ELF", "title": "The Ferry Bell",
    "passage": "The ferry bell rang twice each morning: once when the boat left the far bank, and once when it touched the near one. "
               "Nobody on the near bank could see the boat leave, so the first bell was the only warning they had.",
    "questions": [{"q_index": 1, "prompt": "Why did the first bell matter to the people on the near bank?",
                   "options": [{"letter": "A", "text": "It told them the boat had arrived."},
                               {"letter": "B", "text": "It was the only sign that the boat had set off."},
                               {"letter": "C", "text": "It marked the end of the morning crossings."},
                               {"letter": "D", "text": "It could be heard on both banks."}]}],
}
STRIP = ("generator_meta", "repair_log", "_seed")


class LaneError(ValueError):
    pass


def sha_bytes(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def _dump(obj) -> str:
    return json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def _jsonl(p: Path) -> list[dict]:
    return [json.loads(l) for l in p.read_text(encoding="utf-8").splitlines() if l.strip()] if p.is_file() else []


def load_units(batch: Path, units: list[str] | None) -> list[dict]:
    files = sorted((batch / "candidates").glob("*.json"))
    cands = [json.loads(p.read_text(encoding="utf-8")) for p in files]
    cands = [c for c in cands if "candidate_id" in c and "questions" in c]
    if units:
        by = {c["candidate_id"]: c for c in cands}
        missing = [u for u in units if u not in by]
        if missing:
            raise LaneError(f"units not in batch: {missing}")
        cands = [by[u] for u in units]
    if not cands:
        raise LaneError("no units selected")
    return cands


def make_bundle_files(batch: Path, cls: str, cands: list[dict], params: dict) -> dict[str, str]:
    """Return {filename: text} for the closed bundle inventory (deterministic)."""
    spec = CLASSES[cls]
    if spec.get("single") and len(cands) != 1:
        raise LaneError(f"{cls} takes exactly one unit")
    files: dict[str, str] = {}
    sheet = spec["sheet"]
    if sheet == "smoke":
        cands = [SMOKE_UNIT]
        files["smoke.json"] = _dump([SMOKE_UNIT])
    elif sheet in ("blind", "stems", "distractor"):
        files[f"{sheet}.json"] = _dump([project_sheet(c, sheet) for c in cands])
    elif sheet == "units":
        files["units.json"] = _dump([{k: v for k, v in c.items() if k not in STRIP} for c in cands])
    elif sheet == "unit":
        files["unit.json"] = _dump(cands[0])
    ids = {c["candidate_id"] for c in cands}
    if spec.get("with_verdicts"):
        recs = [r for r in _jsonl(batch / "verdicts.jsonl") if r.get("candidate_id") in ids]
        if not recs:
            raise LaneError(f"{cls}: no canonical verdict records for {sorted(ids)}")
        files["verdicts.jsonl"] = "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs)
    if spec.get("with_reviews"):
        recs = []
        for st in ("language", "pedagogy", "integrated"):
            recs += [dict(r, stage=r.get("stage", st)) for r in _jsonl(batch / "reviews" / f"{st}.jsonl")
                     if r.get("candidate_id") in ids]
        files["reviews.jsonl"] = "".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs)
    if cls == "review-integrated":
        files["carry_ins.json"] = _dump(params.get("carry_ins", []))
    if cls == "reval-language":
        files["changed_spans.json"] = _dump(params.get("changed_spans", []))
    instr = (LANES_DIR / f"{cls}.instructions.md").read_text(encoding="utf-8")
    instr = instr.replace("{vote}", str(params.get("vote", ""))).replace("{gate}", str(params.get("gate", "")))
    files["instructions.md"] = instr
    files["report.schema.json"] = (LANES_DIR / f"{cls}.schema.json").read_text(encoding="utf-8")
    manifest = {
        "schema": "hpfetcher-lane-bundle.v1", "run_id": params["run_id"], "lane_id": params["lane_id"],
        "lane_class": cls, "candidate_ids": [c["candidate_id"] for c in cands],
        "params": {k: v for k, v in params.items() if k in ("vote", "gate", "round", "model")},
        "source_candidates_sha256": ({} if spec.get("fixture") else
                                     {c["candidate_id"]: sha_bytes((batch / "candidates" / f"{c['candidate_id']}.json").read_bytes())
                                      for c in cands}),
        "inventory": {},
    }
    manifest["inventory"] = {name: sha_bytes(text.encode("utf-8")) for name, text in sorted(files.items())}
    files["manifest.json"] = _dump(manifest)
    return files


def scan_forbidden(files: dict[str, str], cls: str) -> list[str]:
    hits = []
    for name, text in files.items():
        if name in ("instructions.md", "report.schema.json"):
            continue  # prose/schema may mention the words; data files may not carry the fields
        for pat in CLASSES[cls]["forbidden"]:
            if pat in text:
                hits.append(f"{name}: {pat}")
    return hits


def write_bundle(lane_dir: Path, files: dict[str, str]) -> None:
    bdir = lane_dir / "bundle"
    if bdir.exists():
        raise LaneError(f"bundle already exists: {bdir}")
    bdir.mkdir(parents=True)
    (lane_dir / "reports").mkdir(exist_ok=True)
    for name, text in sorted(files.items()):
        (bdir / name).write_text(text, encoding="utf-8")
    (lane_dir / "bundle-digests.txt").write_text(
        "".join(f"{sha_bytes(text.encode('utf-8'))}  bundle/{name}\n" for name, text in sorted(files.items())),
        encoding="utf-8")


def read_manifest(lane_dir: Path) -> dict:
    return json.loads((lane_dir / "bundle" / "manifest.json").read_text(encoding="utf-8"))


def _reconstruct(batch: Path, lane_dir: Path) -> dict[str, str]:
    m = read_manifest(lane_dir)
    params = dict(m["params"], run_id=m["run_id"], lane_id=m["lane_id"])
    bdir = lane_dir / "bundle"
    if (bdir / "carry_ins.json").exists():
        params["carry_ins"] = json.loads((bdir / "carry_ins.json").read_text(encoding="utf-8"))
    if (bdir / "changed_spans.json").exists():
        params["changed_spans"] = json.loads((bdir / "changed_spans.json").read_text(encoding="utf-8"))
    units_ = [SMOKE_UNIT] if CLASSES[m["lane_class"]].get("fixture") else load_units(batch, m["candidate_ids"])
    files = make_bundle_files(batch, m["lane_class"], units_, params)
    return {n: sha_bytes(x.encode("utf-8")) for n, x in files.items()}


def verify_bundle(batch: Path, lane_dir: Path) -> dict:
    """Verify the bundle ACTUALLY on disk. Raises LaneError on the first defect."""
    bdir = lane_dir / "bundle"
    if not bdir.is_dir() or bdir.is_symlink():
        raise LaneError(f"no bundle dir at {bdir}")
    on_disk: dict[str, str] = {}
    for p in sorted(bdir.iterdir()):
        if p.is_symlink() or not p.is_file():
            raise LaneError(f"bundle contains a non-regular entry: {p.name}")
        on_disk[p.name] = sha_bytes(p.read_bytes())
    m = read_manifest(lane_dir)
    declared = dict(m["inventory"])
    declared["manifest.json"] = on_disk.get("manifest.json", "")
    if set(on_disk) != set(declared):
        raise LaneError(f"inventory mismatch: undeclared {sorted(set(on_disk) - set(declared))}, "
                        f"missing {sorted(set(declared) - set(on_disk))}")
    for name, digest in declared.items():
        if name != "manifest.json" and on_disk[name] != digest:
            raise LaneError(f"on-disk {name} differs from the declared inventory digest")
    digest_file = lane_dir / "bundle-digests.txt"
    if not digest_file.is_file() or digest_file.is_symlink():
        raise LaneError("bundle-digests.txt missing")
    listed = {}
    for line in digest_file.read_text(encoding="utf-8").splitlines():
        if line.strip():
            d, _, rel = line.partition("  ")
            listed[rel.removeprefix("bundle/")] = d
    if listed != on_disk:
        raise LaneError("on-disk digests differ from bundle-digests.txt")
    fresh = _reconstruct(batch, lane_dir)
    if fresh != on_disk:
        changed = sorted(n for n in set(fresh) | set(on_disk) if fresh.get(n) != on_disk.get(n))
        raise LaneError(f"bundle no longer matches the current batch bytes: {changed}")
    texts = {n: (bdir / n).read_text(encoding="utf-8") for n in on_disk}
    hits = scan_forbidden(texts, m["lane_class"])
    if hits:
        raise LaneError("forbidden pattern(s) on disk: " + "; ".join(hits))
    return {"files": len(on_disk), "lane_class": m["lane_class"], "candidate_ids": m["candidate_ids"]}


def rebuild_digests(batch: Path, lane_dir: Path) -> tuple[str, str]:
    """Kept for the build-time determinism check only; verify-bundle is the real check."""
    fresh = _reconstruct(batch, lane_dir)
    fresh_txt = "".join(f"{d}  bundle/{n}\n" for n, d in sorted(fresh.items()))
    return (lane_dir / "bundle-digests.txt").read_text(encoding="utf-8"), fresh_txt


ESCALATING = {"major", "critical"}


def _dupes(keys: list) -> list:
    seen, dup = set(), []
    for k in keys:
        (dup if k in seen else seen).append(k) if k in seen else seen.add(k)
    return sorted(set(map(str, dup)))


def escalations_of(report: dict, cls: str) -> list[dict]:
    """Evidence that must reach the owner ledger; none of it may be dropped by ingestion."""
    esc = []
    for f in report.get("findings", []) if isinstance(report.get("findings"), list) else []:
        if isinstance(f, dict) and f.get("severity") in ESCALATING:
            esc.append({"candidate_id": f.get("candidate_id"), "severity": f["severity"], "location": f.get("location"),
                        "evidence": f.get("evidence"), "kind": "finding", "id": f.get("id")})
    if cls in ("vfinal-gkey", "reval-gkey"):
        for a in report["answers"]:
            if a["solver_answer"] in ("MULTIPLE_DEFENSIBLE", "NONE_DEFENSIBLE"):
                esc.append({"candidate_id": a["candidate_id"], "severity": "critical", "location": a["target"],
                            "evidence": f"{a['solver_answer']}: {a['justification']}", "kind": "answer"})
    if cls in ("vfinal-gdistractor", "reval-gdistractor", "reval-gstem"):
        for j in report["judgements"]:
            if j["verdict"] == "kill":
                esc.append({"candidate_id": j["candidate_id"], "severity": "critical", "location": j["target"],
                            "evidence": "; ".join(j["findings"]) or j["justification"], "kind": "kill"})
    if cls == "reval-language":
        for p_ in report["passes"]:
            if p_["verdict"] == "kill":
                esc.append({"candidate_id": p_["candidate_id"], "severity": "major", "location": f"vote {p_['vote']}",
                            "evidence": "; ".join(p_["findings"]) or p_["justification"], "kind": "kill"})
    if cls in ("review-language", "review-pedagogy", "review-integrated"):
        for u in report["units"]:
            for f in u["findings"]:
                if f["severity"] in ESCALATING:
                    esc.append({"candidate_id": u["candidate_id"], "severity": f["severity"], "location": f["location"],
                                "evidence": f["evidence"], "kind": "finding", "id": f["id"]})
    if cls == "vfinal-audit":
        if report["audit_verdict"] == "REFUTED":
            esc.append({"candidate_id": report["candidate_id"], "severity": "critical", "location": "audit",
                        "evidence": report["scope_note"], "kind": "refuted"})
        for f in report["findings"]:
            if f["severity"] in ESCALATING:
                esc.append({"candidate_id": report["candidate_id"], "severity": f["severity"], "location": f["stage_challenged"],
                            "evidence": f["claim"], "kind": "finding", "id": f["id"]})
    if cls == "fresh-eyes" and report["reader_blockers"]:
        esc.append({"candidate_id": report["candidate_id"], "severity": "major", "location": "reader",
                    "evidence": "; ".join(report["reader_blockers"]), "kind": "blocker"})
    return esc


def verify_report(lane_dir: Path) -> tuple[dict, str, list[dict]]:
    m = read_manifest(lane_dir)
    rp = lane_dir / "reports" / "report.json"
    if not rp.is_file() or rp.is_symlink():
        raise LaneError(f"no regular report at {rp}")
    raw = rp.read_bytes()
    report = json.loads(raw)
    schema = json.loads((lane_dir / "bundle" / "report.schema.json").read_text(encoding="utf-8"))
    if jsonschema is None:
        raise LaneError("jsonschema not installed")
    errs = sorted(jsonschema.Draft202012Validator(schema).iter_errors(report), key=lambda e: list(e.path))
    if errs:
        raise LaneError("schema: " + "; ".join(f"{'/'.join(map(str, e.path))}: {e.message}" for e in errs[:5]))
    for k in ("run_id", "lane_id", "lane_class"):
        if report[k] != m[k]:
            raise LaneError(f"report {k}={report[k]!r} != bundle {m[k]!r}")
    if sorted(report["candidate_ids"]) != sorted(m["candidate_ids"]):
        raise LaneError("report candidate_ids != bundle inventory")
    cls = m["lane_class"]
    targets = _targets(lane_dir, m)
    units = set(m["candidate_ids"])
    nq = _question_counts(lane_dir, m)
    if cls in ("vfinal-gkey", "reval-gkey"):
        keys = [(a["candidate_id"], a["target"]) for a in report["answers"]]
        if _dupes(keys):
            raise LaneError(f"duplicate answers for {_dupes(keys)}")
        if set(keys) != targets:
            raise LaneError(f"{cls} coverage mismatch: missing {sorted(targets - set(keys))} extra {sorted(set(keys) - targets)}")
        if report["vote"] != m["params"].get("vote"):
            raise LaneError("report vote != bundle vote")
    elif cls in ("vfinal-gdistractor", "reval-gdistractor", "reval-gstem"):
        keys = [(j["candidate_id"], j["target"]) for j in report["judgements"]]
        if _dupes(keys):
            raise LaneError(f"duplicate judgements for {_dupes(keys)}")
        got = {k for k in keys if k[1] != "pair"}
        if got != targets:
            raise LaneError(f"{cls} coverage mismatch: missing {sorted(targets - got)} extra {sorted(got - targets)}")
        if cls == "reval-gstem":
            pairs = {k[0] for k in keys if k[1] == "pair"}
            need = {c for c, n in nq.items() if n >= 2}
            if pairs != need:
                raise LaneError(f"reval-gstem pair judgements: need {sorted(need)}, got {sorted(pairs)}")
    elif cls in ("review-language", "review-pedagogy", "review-integrated"):
        ids = [u["candidate_id"] for u in report["units"]]
        if _dupes(ids):
            raise LaneError(f"duplicate unit entries {_dupes(ids)}")
        if set(ids) != units:
            raise LaneError(f"{cls} unit coverage mismatch")
    elif cls in ("vfinal-audit", "fresh-eyes"):
        if report["candidate_id"] != m["candidate_ids"][0]:
            raise LaneError(f"{cls} candidate_id mismatch")
        if cls == "fresh-eyes":
            keys = [(report["candidate_id"], c["target"]) for c in report["cold_solve"]]
            if _dupes(keys) or set(keys) != targets:
                raise LaneError("fresh-eyes cold_solve must answer every target exactly once")
    elif cls == "smoke":
        if report["candidate_id"] != "smoke-0001":
            raise LaneError("smoke candidate_id mismatch")
    elif cls == "reval-language":
        if report["gate"] != m["params"].get("gate"):
            raise LaneError("report gate != bundle gate")
        keys = [(p_["candidate_id"], p_["vote"]) for p_ in report["passes"]]
        if _dupes(keys):
            raise LaneError(f"duplicate language votes {_dupes(keys)}")
        need = {(c, v) for c in units for v in (1, 2, 3)}
        if set(keys) != need:
            raise LaneError(f"reval-language needs votes 1-3 per unit; missing {sorted(need - set(keys))}")
    return report, sha_bytes(raw), escalations_of(report, cls)


def _question_counts(lane_dir: Path, m: dict) -> dict[str, int]:
    counts: dict[str, int] = {}
    for c, t in _targets(lane_dir, m):
        counts[c] = counts.get(c, 0) + 1
    return counts


def _targets(lane_dir: Path, m: dict) -> set[tuple[str, str]]:
    bdir = lane_dir / "bundle"
    for name in ("blind.json", "stems.json", "distractor.json", "units.json", "smoke.json"):
        p = bdir / name
        if p.exists():
            units = json.loads(p.read_text(encoding="utf-8"))
            return {(u["candidate_id"], f"q:{q['q_index']}") for u in units for q in u["questions"]}
    u = json.loads((bdir / "unit.json").read_text(encoding="utf-8"))
    return {(u["candidate_id"], f"q:{q['q_index']}") for q in u["questions"]}


def _append_jsonl(p: Path, recs: list[dict], identity) -> int:
    p.parent.mkdir(parents=True, exist_ok=True)
    existing = {identity(r) for r in _jsonl(p)}
    dup = [identity(r) for r in recs if identity(r) in existing]
    if dup:
        raise LaneError(f"{p.name}: identity already present (append-forward refuses): {dup[:3]}")
    with p.open("a", encoding="utf-8") as fh:
        for r in recs:
            fh.write(json.dumps(r, ensure_ascii=False) + "\n")
    return len(recs)


def _write_json_once(p: Path, obj: dict) -> None:
    if p.exists():
        raise LaneError(f"{p} exists; refusing to overwrite")
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")


def _fstr(f: dict) -> str:
    return f"{f.get('id', '?')}[{f.get('severity')}] {f.get('category', f.get('kind', ''))}: {f.get('evidence')}"


def ingest(batch: Path, lane_dir: Path, report: dict, report_sha: str, date: str, rnd: str | None,
           record_escalations: bool = False) -> list[str]:
    m = read_manifest(lane_dir)
    cls, lane = m["lane_class"], m["lane_id"]
    model = m["params"].get("model", "gpt-5.6-sol")
    by = f"gc-lane:{lane}/{model}"
    phase = CLASSES[cls].get("phase")
    if phase == "vfinal" and rnd:
        raise LaneError(f"{cls} is a V-FINAL lane and writes only to verdicts-vfinal/; --round is not allowed")
    if phase == "reval" and not rnd:
        raise LaneError(f"{cls} is a re-validation lane and needs --round (e.g. r5)")
    esc = escalations_of(report, cls)
    if esc and not record_escalations:
        raise LaneError(f"report carries {len(esc)} escalation(s) — ingest refused; re-run with --record-escalations "
                        "to preserve them in reviews/escalations.jsonl for the owner ledger: "
                        + "; ".join(f"{e['candidate_id']} {e['severity']} @ {e['location']}" for e in esc[:5]))
    written: list[str] = []
    if esc:
        _append_jsonl(batch / "reviews" / "escalations.jsonl",
                      [dict(e, lane_id=lane, lane_class=cls, source=f"escalation:{cls}", report_sha256=report_sha, date=date) for e in esc],
                      lambda r: (r["candidate_id"], r["lane_id"], r["kind"], str(r.get("location")), r["report_sha256"]))
        written.append("reviews/escalations.jsonl")
    report_findings = report.get("findings", []) if cls in ("vfinal-gkey", "reval-gkey") else []
    if cls == "smoke":
        return written  # a smoke lane leaves no trace in the batch; its report stays in the run root
    if cls in ("review-language", "review-pedagogy"):
        stage = cls.split("-")[1]
        recs = [{"candidate_id": u["candidate_id"], "stage": stage, "verdict": u["verdict"], "reviewed_by": by,
                 "date": date, "notes": "; ".join(f"{f['id']}[{f['severity']}] {f['location']}: {f['evidence']}" for f in u["findings"]) or "no findings",
                 "fixes": [f["fix"] for f in u["findings"] if "fix" in f], "report_sha256": report_sha} for u in report["units"]]
        _append_jsonl(batch / "reviews" / f"{stage}.jsonl", recs, lambda r: (r["candidate_id"], r["report_sha256"]))
        written.append(f"reviews/{stage}.jsonl")
    elif cls == "review-integrated":
        recs = [{"candidate_id": u["candidate_id"], "stage": "integrated", "reviewer": by, "date": date,
                 "sweep_verdict": u["sweep_verdict"], "verdict": u["sweep_verdict"],
                 "arithmetic_recomputed": u["arithmetic_recomputed"], "verified_carry_ins": u["verified_carry_ins"],
                 "findings": u["findings"], "report_sha256": report_sha} for u in report["units"]]
        _append_jsonl(batch / "reviews" / "integrated.jsonl", recs, lambda r: (r["candidate_id"], r["report_sha256"]))
        written.append("reviews/integrated.jsonl")
    elif cls in ("vfinal-gkey", "reval-gkey"):
        vote = report["vote"]
        recs = []
        for a in report["answers"]:
            fs = [_fstr(f) for f in report_findings if f.get("candidate_id") == a["candidate_id"]
                  and (f.get("location") in (a["target"], "", None) or f.get("location", "").startswith(a["target"]))]
            self_kill = a["solver_answer"] in ("MULTIPLE_DEFENSIBLE", "NONE_DEFENSIBLE")
            recs.append({"candidate_id": a["candidate_id"], "gate": "G-KEY", "target": a["target"],
                         "verdict": "kill" if self_kill else ("flag" if fs else "pass"),
                         "solver_answer": a["solver_answer"], "findings": fs, "justification": a["justification"],
                         "executed_by": by, "date": date, "vote": vote})
        rel = f"verdicts-vfinal/verdicts-gkey-{vote}.jsonl" if phase == "vfinal" else f"verdicts/verdicts-gkey-{rnd}-{vote}.jsonl"
        _append_jsonl(batch / rel, recs, lambda r: (r["candidate_id"], r["gate"], r["target"], r["vote"]))
        written.append(rel)
    elif cls in ("vfinal-gdistractor", "reval-gdistractor"):
        recs = [{"candidate_id": j["candidate_id"], "gate": "G-DISTRACTOR", "target": j["target"], "verdict": j["verdict"],
                 "findings": j["findings"], "justification": j["justification"], "executed_by": by, "date": date}
                for j in report["judgements"]]
        rel = "verdicts-vfinal/verdicts-gdistractor.jsonl" if phase == "vfinal" else f"verdicts/verdicts-gdistractor-{rnd}.jsonl"
        _append_jsonl(batch / rel, recs, lambda r: (r["candidate_id"], r["gate"], r["target"], None))
        written.append(rel)
    elif cls == "vfinal-audit":
        cid = report["candidate_id"]
        _write_json_once(batch / "audits" / f"{cid}.json", {
            "candidate_id": cid, "date": date, "auditor": by, "audit_verdict": report["audit_verdict"],
            "verdict": report["audit_verdict"], "scope_note": report["scope_note"], "findings": report["findings"],
            "resolved_findings": report["resolved_findings"], "cleared": report["cleared"],
            "audit_note": report["audit_note"], "report_sha256": report_sha})
        written.append(f"audits/{cid}.json")
    elif cls == "fresh-eyes":
        cid = report["candidate_id"]
        _write_json_once(batch / "adjudication-evidence" / f"{cid}.json", {
            k: report[k] for k in ("candidate_id", "cold_solve", "naturalness", "makes_sense", "reader_blockers", "reader_notes")})
        written.append(f"adjudication-evidence/{cid}.json")
    elif cls == "reval-gstem":
        recs = [{"candidate_id": j["candidate_id"], "gate": "G-STEM", "target": j["target"], "verdict": j["verdict"],
                 "blind_pick": j["blind_pick"], "confidence": j["confidence"], "findings": j["findings"],
                 "justification": j["justification"], "executed_by": by, "date": date} for j in report["judgements"]]
        _append_jsonl(batch / "verdicts" / f"verdicts-gstem-{rnd}.jsonl", recs,
                      lambda r: (r["candidate_id"], r["gate"], r["target"], None))
        written.append(f"verdicts/verdicts-gstem-{rnd}.jsonl")
    elif cls == "reval-language":
        recs = [{"candidate_id": p["candidate_id"], "gate": report["gate"], "target": "passage", "verdict": p["verdict"],
                 "findings": p["findings"], "justification": p["justification"], "executed_by": by, "date": date,
                 "vote": p["vote"]} for p in report["passes"]]
        _append_jsonl(batch / "verdicts" / f"verdicts-lang-{rnd}.jsonl", recs,
                      lambda r: (r["candidate_id"], r["gate"], r["target"], r["vote"]))
        written.append(f"verdicts/verdicts-lang-{rnd}.jsonl")
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("build")
    b.add_argument("--batch-dir", required=True, type=Path); b.add_argument("--lane-class", required=True, choices=sorted(CLASSES))
    b.add_argument("--lane-id", required=True); b.add_argument("--run-id", required=True); b.add_argument("--run-root", required=True, type=Path)
    b.add_argument("--units", nargs="*"); b.add_argument("--vote", type=int); b.add_argument("--gate", choices=["G-ENG", "G-SPRAK"])
    b.add_argument("--model", default="gpt-5.6-sol"); b.add_argument("--carry-in", action="append", default=[])
    b.add_argument("--changed-span", action="append", default=[])
    for name in ("verify-bundle", "verify-report", "ingest"):
        s = sub.add_parser(name); s.add_argument("--lane-dir", required=True, type=Path)
        if name != "verify-report":
            s.add_argument("--batch-dir", required=True, type=Path)
    sub.choices["ingest"].add_argument("--date", default=datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    sub.choices["ingest"].add_argument("--round")
    sub.choices["ingest"].add_argument("--record-escalations", action="store_true",
                                       help="preserve major/critical evidence in reviews/escalations.jsonl and proceed")
    a = ap.parse_args()
    try:
        if a.cmd == "build":
            spec = CLASSES[a.lane_class]
            params = {"run_id": a.run_id, "lane_id": a.lane_id, "model": a.model, "carry_ins": a.carry_in, "changed_spans": a.changed_span}
            if a.vote: params["vote"] = a.vote
            if a.gate: params["gate"] = a.gate
            if spec.get("param") == "vote" and not a.vote: raise LaneError("vfinal-gkey needs --vote")
            if spec.get("param") == "gate" and not a.gate: raise LaneError("reval-language needs --gate")
            units_ = [SMOKE_UNIT] if spec.get("fixture") else load_units(a.batch_dir, a.units)
            files = make_bundle_files(a.batch_dir, a.lane_class, units_, params)
            hits = scan_forbidden(files, a.lane_class)
            if hits:
                raise LaneError("forbidden pattern(s) in bundle: " + "; ".join(hits))
            lane_dir = a.run_root / "lanes" / a.lane_id
            write_bundle(lane_dir, files)
            old, fresh = rebuild_digests(a.batch_dir, lane_dir)
            if old != fresh:
                raise LaneError("bundle is not deterministic (rebuild differs)")
            print(f"lane_bundle build: {a.lane_class} {a.lane_id} -> {lane_dir} ({len(files)} files, deterministic, forbidden-scan clean)")
        elif a.cmd == "verify-bundle":
            info = verify_bundle(a.batch_dir, a.lane_dir)
            print(f"lane_bundle verify-bundle {a.lane_dir.name}: on-disk inventory exact, digests match, "
                  f"matches current batch bytes, forbidden-scan clean ({info['files']} files)")
        elif a.cmd == "verify-report":
            _, s, esc = verify_report(a.lane_dir)
            print(f"lane_bundle verify-report {a.lane_dir.name}: schema-valid, identities unique, coverage complete, "
                  f"sha256={s}, escalations={len(esc)}")
            for e in esc:
                print(f"  ESCALATION {e['candidate_id']} {e['severity']} @ {e['location']}: {str(e['evidence'])[:120]}")
        else:
            verify_bundle(a.batch_dir, a.lane_dir)
            report, s, esc = verify_report(a.lane_dir)
            written = ingest(a.batch_dir, a.lane_dir, report, s, a.date, a.round, a.record_escalations)
            print(f"lane_bundle ingest {a.lane_dir.name}: report sha256={s} escalations={len(esc)} -> {', '.join(written)}")
    except LaneError as e:
        print(f"lane_bundle: {a.cmd} FAILED — {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
