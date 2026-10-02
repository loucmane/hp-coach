"""completion_digests.py: immutable baseline, stage snapshots with allowed deltas, exact verify
(Codex review 2026-09-02, finding 4)."""
import json
import os
import subprocess
import sys
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "completion_digests.py"


def git(repo, *a):
    subprocess.run(["git", "-C", str(repo), *a], check=True, capture_output=True,
                   env={**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t",
                        "GIT_COMMITTER_EMAIL": "t@t"})


def make_repo(tmp: Path) -> tuple[Path, Path, Path]:
    repo = tmp / "repo"
    (repo / "pipeline/synthetic/gates/scripts").mkdir(parents=True)
    (repo / "pipeline/synthetic/gates/scripts/tool.py").write_text("print(1)\n")
    (repo / "pipeline/synthetic/gates/bands.json").write_text("{}\n")
    (repo / "pipeline/synthetic/evidence").mkdir(parents=True)
    (repo / "pipeline/synthetic/evidence/x.py").write_text("x\n")
    git(repo, "init", "-q"); git(repo, "add", "."); git(repo, "commit", "-q", "-m", "base")
    batch = repo / "pipeline/synthetic/batches/batch99"
    (batch / "candidates").mkdir(parents=True)
    (batch / "candidates/u1.json").write_text('{"candidate_id":"u1"}\n')
    (batch / "RESUME.md").write_text("r\n")
    corpus = tmp / "corpus"; corpus.mkdir(); (corpus / "a.json").write_text("{}")
    tool = tmp / "executed.py"; tool.write_text("executed\n")
    return repo, batch, tool


def run(batch, tool, *args, corpus=None):
    env = {**os.environ, "HPF_CORPUS_DIR": str(corpus or (batch.parents[3] / ".." / "corpus"))}
    return subprocess.run([sys.executable, str(SCRIPT), *args, "--batch-dir", str(batch), "--bead", "hpf-test",
                           "--executed-tool", str(tool)], capture_output=True, text=True, env=env)


def test_baseline_is_written_once_and_supersede_records_previous(tmp_path):
    repo, batch, tool = make_repo(tmp_path)
    corpus = tmp_path / "corpus"
    assert run(batch, tool, "baseline", corpus=corpus).returncode == 0
    base = batch / "DIGESTS-completion-hpf-test.json"
    m = json.loads(base.read_text())
    assert m["schema"] == "hpfetcher-completion-digests.v2"
    assert "candidates/u1.json" in m["batch_files"] and "RESUME.md" in m["batch_files"]
    assert m["subject"]["batch_git_tracked"] is False and m["subject"]["head"]
    assert str(tool) in m["tooling_executed"]
    assert m["tooling_worktree"]["pipeline/synthetic/gates/scripts/tool.py"]["git_tracked"] is True
    r = run(batch, tool, "baseline", corpus=corpus)
    assert r.returncode == 3 and "refusing" in r.stderr
    assert run(batch, tool, "baseline", "--supersede", corpus=corpus).returncode == 0
    m2 = json.loads(base.read_text())
    assert m2["supersedes"]["file"].startswith("DIGESTS-completion-hpf-test.superseded-")
    assert (batch / m2["supersedes"]["file"]).exists()


def test_verify_is_exact_and_snapshot_enforces_allowed_deltas(tmp_path):
    repo, batch, tool = make_repo(tmp_path)
    corpus = tmp_path / "corpus"
    assert run(batch, tool, "baseline", corpus=corpus).returncode == 0
    base = batch / "DIGESTS-completion-hpf-test.json"
    assert run(batch, tool, "verify", "--manifest", str(base), corpus=corpus).returncode == 0
    (batch / "candidates/u1.json").write_text('{"candidate_id":"u1","repaired":true}\n')
    (batch / "reviews").mkdir(); (batch / "reviews/language.jsonl").write_text("{}\n")
    r = run(batch, tool, "verify", "--manifest", str(base), corpus=corpus)
    assert r.returncode == 1 and "changed: batch:candidates/u1.json" in r.stdout
    r = run(batch, tool, "snapshot", "--stage", "d1", "--prior", str(base), corpus=corpus)
    assert r.returncode == 1 and "DISALLOWED" in r.stdout
    r = run(batch, tool, "snapshot", "--stage", "d1", "--prior", str(base),
            "--allow", "batch:candidates/*.json", "--allow", "batch:reviews/*", corpus=corpus)
    assert r.returncode == 0, r.stdout + r.stderr
    snap = json.loads((batch / "DIGESTS-completion-hpf-test.stage-d1.json").read_text())
    assert snap["verdict"] == "ALLOWED" and snap["prior"]["file"] == base.name
    assert snap["delta"]["changed"] == ["batch:candidates/u1.json"]
    assert snap["delta"]["added"] == ["batch:reviews/language.jsonl"]
    assert json.loads(base.read_text())["batch_files"]["candidates/u1.json"] != snap["batch_files"]["candidates/u1.json"]


def test_head_transition_is_an_explicit_allowed_delta(tmp_path):
    repo, batch, tool = make_repo(tmp_path)
    corpus = tmp_path / "corpus"
    assert run(batch, tool, "baseline", corpus=corpus).returncode == 0
    base = batch / "DIGESTS-completion-hpf-test.json"
    (repo / "pipeline/synthetic/gates/scripts/new_tool.py").write_text("new\n")
    git(repo, "add", "."); git(repo, "commit", "-q", "-m", "package commit")
    r = run(batch, tool, "snapshot", "--stage", "post-commit", "--prior", str(base), corpus=corpus)
    assert r.returncode == 1 and "subject:head" in r.stdout
    r = run(batch, tool, "snapshot", "--stage", "post-commit", "--prior", str(base),
            "--allow", "subject:head", "--allow", "subject:tree", "--allow", "tooling:*", corpus=corpus)
    assert r.returncode == 0, r.stdout
    snap = json.loads((batch / "DIGESTS-completion-hpf-test.stage-post-commit.json").read_text())
    assert snap["subject"]["head"] != json.loads(base.read_text())["subject"]["head"]


def test_executed_tool_digest_changes_are_detected(tmp_path):
    repo, batch, tool = make_repo(tmp_path)
    corpus = tmp_path / "corpus"
    assert run(batch, tool, "baseline", corpus=corpus).returncode == 0
    tool.write_text("tampered\n")
    r = run(batch, tool, "verify", "--manifest", str(batch / "DIGESTS-completion-hpf-test.json"), corpus=corpus)
    assert r.returncode == 1 and "executed:" in r.stdout


def test_stage_files_are_append_forward_and_rejected_states_cannot_be_built_on(tmp_path):
    repo, batch, tool = make_repo(tmp_path)
    corpus = tmp_path / "corpus"
    assert run(batch, tool, "baseline", corpus=corpus).returncode == 0
    base = batch / "DIGESTS-completion-hpf-test.json"
    (batch / "candidates/u1.json").write_text('{"candidate_id":"u1","x":1}\n')
    # a rejected attempt is preserved under its own name and never takes the accepted name
    r = run(batch, tool, "snapshot", "--stage", "d1", "--prior", str(base), corpus=corpus)
    assert r.returncode == 1
    rejected = sorted(batch.glob("DIGESTS-completion-hpf-test.stage-d1.DISALLOWED-*.json"))
    assert len(rejected) == 1 and not (batch / "DIGESTS-completion-hpf-test.stage-d1.json").exists()
    assert json.loads(rejected[0].read_text())["verdict"] == "DISALLOWED"
    # building on the rejected predecessor is refused
    r = run(batch, tool, "snapshot", "--stage", "d2", "--prior", str(rejected[0]), "--allow", "batch:*", corpus=corpus)
    assert r.returncode == 5 and "DISALLOWED" in r.stderr
    # the accepted snapshot is created exclusively; a second accept under the same name is refused
    assert run(batch, tool, "snapshot", "--stage", "d1", "--prior", str(base), "--allow", "batch:candidates/*", corpus=corpus).returncode == 0
    acc = batch / "DIGESTS-completion-hpf-test.stage-d1.json"
    before = acc.read_bytes()
    r = run(batch, tool, "snapshot", "--stage", "d1", "--prior", str(base), "--allow", "batch:*", corpus=corpus)
    assert r.returncode == 4 and acc.read_bytes() == before
    # a hand-edited "ALLOWED" verdict on a rejected file does not make it a valid predecessor
    forged = json.loads(rejected[0].read_text()); forged["verdict"] = "ALLOWED"
    rejected[0].write_text(json.dumps(forged))
    r = run(batch, tool, "snapshot", "--stage", "d3", "--prior", str(rejected[0]), "--allow", "batch:*", corpus=corpus)
    assert r.returncode == 5
    # a foreign manifest (other bead) is refused as prior
    foreign = batch / "DIGESTS-completion-hpf-other.json"; foreign.write_text(base.read_text().replace("hpf-test", "hpf-other"))
    r = run(batch, tool, "snapshot", "--stage", "d4", "--prior", str(foreign), "--allow", "batch:*", corpus=corpus)
    assert r.returncode == 5
    # the accepted chain records its predecessor's identity
    snap = json.loads(acc.read_text())
    assert snap["prior"]["kind"] == "baseline" and snap["prior"]["sha256"] == __import__("hashlib").sha256(base.read_bytes()).hexdigest()
