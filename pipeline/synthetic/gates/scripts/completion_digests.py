#!/usr/bin/env python3
"""Digest binding for a completion package: immutable baseline + stage snapshots.

Git HEAD does not bind an untracked batch directory. This tool does, in two
layers (2026-09-02 Codex review finding 4: a single rewritable manifest with
an all-or-nothing check cannot express "these paths were allowed to change"):

  baseline  DIGESTS-completion-<bead>.json — written ONCE. Re-running
            `baseline` on an existing file is refused unless --supersede,
            which moves the old file to DIGESTS-completion-<bead>.superseded-
            <sha8>.json and records its sha256 inside the new baseline.
  snapshot  DIGESTS-completion-<bead>.stage-<name>.json — the current state
            diffed against a named prior manifest (baseline or an earlier
            ACCEPTED stage), classifying every added / removed / changed path
            and checking each against --allow globs (relative to the batch
            dir, 'tooling:<relpath>' for tooling, 'subject:head' /
            'subject:tree' for the git transition after a commit).
            Append-forward history (Codex review v2, finding 4):
              * an accepted stage file is created EXCLUSIVELY — an existing
                file with that name is never overwritten (exit 4);
              * a DISALLOWED result is written under a distinct name,
                DIGESTS-completion-<bead>.stage-<name>.DISALLOWED-<utc>.json,
                so failed attempts are preserved and never occupy the
                accepted name;
              * --prior must be this bead's baseline or an ACCEPTED stage
                snapshot of this bead/batch, whose file sha256 is recorded
                in the new snapshot; a DISALLOWED or foreign prior is refused
                (exit 5).
            The prior manifest is never rewritten.
  verify    recompute and require exact equality with a manifest (nothing
            changed at all). Exit 1 otherwise.

Every manifest binds: every file under the batch dir; every gates/scripts/*.py
+ bands.json in the worktree with its git-tracked flag; the evidence toolkit;
the PR #370 head blobs (reference); the EXECUTED tool copies actually run
(--executed-tool PATH, repeatable; the scratchpad copies used during batches
20/21 by default when present); the Gas City runtime pieces defining the lane
worker; and the external corpus inventory.
"""
from __future__ import annotations

import argparse
import fnmatch
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

RUNTIME = [
    "/home/loucmane/gascity/city/agents/evidence-reviewer/agent.toml",
    "/home/loucmane/gascity/city/agents/evidence-reviewer/prompt.template.md",
    "/home/loucmane/gascity/city/city.toml",
    "/home/loucmane/gascity/bin/gc",
]
HARDENING_HEAD = "0294fd9673b27f116c99241843d949bcfefb4ec7"   # PR #370 head
HARDENING_FILES = ["check_assembly_dispositions.py", "check_sheet_sync.py",
                   "lint_learner_output.py", "merge_verdicts.py", "mech.py"]
DEFAULT_EXECUTED = [
    "/tmp/claude-1000/-home-loucmane-dev-hpfetcher/221ed52e-6f5e-4e4d-b87d-297d8baca514/scratchpad/hardened",
    "/tmp/claude-1000/-home-loucmane-dev-hpfetcher/221ed52e-6f5e-4e4d-b87d-297d8baca514/scratchpad/mechrun",
]
CORPUS = Path(os.environ.get("HPF_CORPUS_DIR", "/home/loucmane/dev/hpfetcher/data/parsed"))
VOLATILE = ("created_at", "note", "supersedes", "stage", "baseline_sha256", "prior", "allowed", "delta", "verdict")


def sha(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def git(repo: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(repo), *args], text=True).strip()


def tracked(repo: Path, rel: str) -> bool:
    r = subprocess.run(["git", "-C", str(repo), "ls-files", "--error-unmatch", rel],
                       capture_output=True, text=True)
    return r.returncode == 0


def _exclude(p: Path, batch: Path) -> bool:
    return "__pycache__" in p.parts or (p.parent == batch and p.name.startswith("DIGESTS-completion-"))


def compute(batch: Path, bead: str, executed: list[Path]) -> dict:
    repo = Path(git(batch, "rev-parse", "--show-toplevel"))
    synthetic = repo / "pipeline" / "synthetic"
    files = {p.relative_to(batch).as_posix(): sha(p)
             for p in sorted(batch.rglob("*")) if p.is_file() and not _exclude(p, batch)}
    tooling = {}
    for p in sorted((synthetic / "gates" / "scripts").glob("*.py")) + [synthetic / "gates" / "bands.json"] \
             + sorted((synthetic / "gates" / "lanes").glob("*")) if (synthetic / "gates" / "lanes").is_dir() else \
             sorted((synthetic / "gates" / "scripts").glob("*.py")) + [synthetic / "gates" / "bands.json"]:
        if p.is_file():
            rel = p.relative_to(repo).as_posix()
            tooling[rel] = {"sha256": sha(p), "git_tracked": tracked(repo, rel)}
    evidence = {}
    for p in sorted((synthetic / "evidence").rglob("*")):
        if p.is_file() and "__pycache__" not in p.parts:
            rel = p.relative_to(repo).as_posix()
            evidence[rel] = {"sha256": sha(p), "git_tracked": tracked(repo, rel)}
    hardening = {}
    for f in HARDENING_FILES:
        try:
            blob = subprocess.check_output(["git", "-C", str(repo), "show",
                                            f"{HARDENING_HEAD}:pipeline/synthetic/gates/scripts/{f}"],
                                           stderr=subprocess.DEVNULL)
            hardening[f"pipeline/synthetic/gates/scripts/{f}"] = hashlib.sha256(blob).hexdigest()
        except subprocess.CalledProcessError:
            hardening[f"pipeline/synthetic/gates/scripts/{f}"] = None
    executed_tools = {}
    for root in executed:
        if root.is_file():
            executed_tools[str(root)] = sha(root)
        elif root.is_dir():
            for p in sorted(root.rglob("*")):
                if p.is_file() and "__pycache__" not in p.parts:
                    executed_tools[str(p)] = sha(p)
    runtime = {p: sha(Path(p)) for p in RUNTIME if Path(p).exists()}
    inv, n = hashlib.sha256(), 0
    if CORPUS.is_dir():
        for p in sorted(CORPUS.rglob("*")):
            if p.is_file():
                inv.update(f"{sha(p)}  {p.relative_to(CORPUS).as_posix()}\n".encode())
                n += 1
    try:
        gcv = subprocess.check_output(["/home/loucmane/gascity/bin/gc", "version"], text=True,
                                      env={"GC_HOME": "/home/loucmane/gascity/home", "PATH": "/usr/bin:/bin"}).strip()
    except Exception:
        gcv = None
    return {
        "schema": "hpfetcher-completion-digests.v2",
        "bead": bead, "batch": batch.name,
        "hash_method": "sha256 over file bytes; corpus inventory = sha256 over sorted 'sha256  relpath\\n' lines",
        "subject": {"worktree": str(repo), "branch": git(repo, "branch", "--show-current"),
                    "head": git(repo, "rev-parse", "HEAD"), "tree": git(repo, "rev-parse", "HEAD^{tree}"),
                    "batch_dir": batch.relative_to(repo).as_posix(),
                    "batch_git_tracked": tracked(repo, batch.relative_to(repo).as_posix() + "/"),
                    "file_count": len(files)},
        "batch_files": files,
        "tooling_worktree": tooling,
        "evidence_toolkit": evidence,
        "tooling_hardening_pr370": {"commit": HARDENING_HEAD, "files": hardening,
                                    "note": "reference blobs; the EXECUTED copies are listed under tooling_executed"},
        "tooling_executed": executed_tools,
        "runtime_gas_city": {"gc_version": gcv, "files": runtime},
        "external_inputs": {"corpus_dir": str(CORPUS), "file_count": n, "inventory_sha256": inv.hexdigest()},
    }


def _flatten(m: dict) -> dict[str, str | None]:
    """Every bound thing as 'kind:relpath' -> digest, for diffing."""
    out: dict[str, str | None] = {}
    out.update({f"batch:{k}": v for k, v in m["batch_files"].items()})
    out.update({f"tooling:{k}": v["sha256"] for k, v in m["tooling_worktree"].items()})
    out.update({f"evidence:{k}": v["sha256"] for k, v in m["evidence_toolkit"].items()})
    out.update({f"executed:{k}": v for k, v in m.get("tooling_executed", {}).items()})
    out.update({f"runtime:{k}": v for k, v in m["runtime_gas_city"]["files"].items()})
    out["subject:head"] = m["subject"]["head"]
    out["subject:tree"] = m["subject"]["tree"]
    out["subject:branch"] = m["subject"]["branch"]
    out["corpus:inventory"] = m["external_inputs"]["inventory_sha256"]
    return out


def diff(prior: dict, current: dict) -> dict[str, list[str]]:
    a, b = _flatten(prior), _flatten(current)
    return {"added": sorted(k for k in b if k not in a),
            "removed": sorted(k for k in a if k not in b),
            "changed": sorted(k for k in a if k in b and a[k] != b[k])}


def allowed_by(key: str, allow: list[str]) -> bool:
    return any(fnmatch.fnmatchcase(key, pat) for pat in allow)


def _write(path: Path, m: dict) -> None:
    path.write_text(json.dumps(m, ensure_ascii=False, indent=1), encoding="utf-8")


def _strip_volatile(m: dict) -> dict:
    return {k: v for k, v in m.items() if k not in VOLATILE}


def _prior_rejection(prior: dict, prior_path: Path, batch: Path, bead: str) -> str | None:
    """Why a --prior manifest may not be built on; None when it is acceptable."""
    if prior_path.parent.resolve() != batch.resolve():
        return "not in this batch directory"
    if not prior_path.name.startswith(f"DIGESTS-completion-{bead}."):
        return "not this bead's manifest"
    if ".DISALLOWED-" in prior_path.name or prior.get("verdict") == "DISALLOWED":
        return "predecessor was DISALLOWED; a rejected state cannot be built on"
    if prior.get("schema") != "hpfetcher-completion-digests.v2":
        return f"unexpected schema {prior.get('schema')!r}"
    if prior.get("bead") != bead or prior.get("batch") != batch.name:
        return "bead/batch identity mismatch"
    if "stage" in prior and prior.get("verdict") != "ALLOWED":
        return "predecessor stage carries no ALLOWED verdict"
    return None


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("baseline", "snapshot", "verify"):
        sp = sub.add_parser(name)
        sp.add_argument("--batch-dir", required=True, type=Path)
        sp.add_argument("--bead", required=True)
        sp.add_argument("--executed-tool", action="append", type=Path, default=None,
                        help="path (file or dir) of a tool copy actually executed; repeatable")
        sp.add_argument("--note", default="")
    sub.choices["baseline"].add_argument("--supersede", action="store_true")
    sub.choices["snapshot"].add_argument("--stage", required=True)
    sub.choices["snapshot"].add_argument("--prior", required=True, type=Path, help="baseline or earlier stage manifest")
    sub.choices["snapshot"].add_argument("--allow", action="append", default=[],
                                         help="glob over 'batch:<rel>' / 'tooling:<rel>' / 'executed:<abs>' / 'subject:head' ...; repeatable")
    sub.choices["verify"].add_argument("--manifest", required=True, type=Path)
    a = ap.parse_args()

    batch = a.batch_dir.resolve()
    executed = a.executed_tool if a.executed_tool is not None else [Path(p) for p in DEFAULT_EXECUTED]
    cur = compute(batch, a.bead, executed)
    cur["created_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    cur["note"] = a.note

    if a.cmd == "baseline":
        out = batch / f"DIGESTS-completion-{a.bead}.json"
        if out.exists():
            if not a.supersede:
                print(f"completion_digests: baseline {out.name} exists; refusing to overwrite (use --supersede)", file=sys.stderr)
                return 3
            old_sha = sha(out)
            moved = out.with_name(f"DIGESTS-completion-{a.bead}.superseded-{old_sha[:8]}.json")
            out.rename(moved)
            cur["supersedes"] = {"file": moved.name, "sha256": old_sha}
            cur["batch_files"] = {k: v for k, v in cur["batch_files"].items()}  # moved file is excluded by prefix
        _write(out, cur)
        print(f"completion_digests baseline: {cur['subject']['file_count']} batch file(s), "
              f"{len(cur['tooling_worktree'])} tooling, {len(cur['tooling_executed'])} executed, "
              f"{len(cur['evidence_toolkit'])} evidence -> {out}")
        return 0

    if a.cmd == "verify":
        prior = json.loads(a.manifest.read_text(encoding="utf-8"))
        d = diff(prior, cur)
        same = not any(d.values())
        print(f"completion_digests verify {a.manifest.name}: identical={same}")
        for k, v in d.items():
            for item in v[:20]:
                print(f"  {k}: {item}")
        return 0 if same else 1

    # snapshot
    prior_path = a.prior.resolve()
    try:
        prior = json.loads(prior_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as e:
        print(f"completion_digests: prior {a.prior} unreadable ({e})", file=sys.stderr)
        return 5
    why = _prior_rejection(prior, prior_path, batch, a.bead)
    if why:
        print(f"completion_digests: prior {a.prior.name} refused — {why}", file=sys.stderr)
        return 5
    accepted_name = batch / f"DIGESTS-completion-{a.bead}.stage-{a.stage}.json"
    if accepted_name.exists():
        print(f"completion_digests: stage {a.stage} already accepted ({accepted_name.name}); "
              f"append-forward refuses to overwrite — choose a new stage name", file=sys.stderr)
        return 4
    d = diff(prior, cur)
    disallowed = {k: [x for x in v if not allowed_by(x, a.allow)] for k, v in d.items()}
    ok = not any(disallowed.values())
    cur["stage"] = a.stage
    cur["prior"] = {"file": prior_path.name, "sha256": sha(prior_path),
                    "kind": "baseline" if "stage" not in prior else "stage", "stage": prior.get("stage")}
    cur["allowed"] = a.allow
    cur["delta"] = d
    cur["disallowed"] = disallowed
    cur["verdict"] = "ALLOWED" if ok else "DISALLOWED"
    if ok:
        out = accepted_name
    else:
        out = batch / f"DIGESTS-completion-{a.bead}.stage-{a.stage}.DISALLOWED-{cur['created_at'].replace(':', '')}.json"
    try:
        fd = os.open(out, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o644)
    except FileExistsError:
        print(f"completion_digests: {out.name} exists; refusing to overwrite", file=sys.stderr)
        return 4
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        fh.write(json.dumps(cur, ensure_ascii=False, indent=1))
    print(f"completion_digests snapshot {a.stage}: prior={prior_path.name} added={len(d['added'])} "
          f"removed={len(d['removed'])} changed={len(d['changed'])} verdict={cur['verdict']} -> {out.name}")
    for k, v in disallowed.items():
        for item in v[:20]:
            print(f"  DISALLOWED {k}: {item}")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
