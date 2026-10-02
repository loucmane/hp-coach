"""Fixture walkthrough of the completion package's stage transitions, end to end, through the
REAL scripts (no Gas City, no LLM). Two fixtures (Codex review v4): (A) a mixed ELF+LÄS
student-facing repair proposal that needs six re-validation sessions — the planner STOPS before
any repair, FIX_PROPOSED is preserved on both units, promote HOLDs them, and no record may clear
them; (B) an ELF-only proposal that needs exactly five sessions and runs the whole chain: S00 smoke,
the planner, the five-session conditional path (reval-gstem, reval-language G-ENG, reval-gkey ×2,
reval-gdistractor) followed by the fixed V-FINAL lanes with no collision,
an escalation (major G-KEY finding) that must reach ÄGARBLICK through escalations.jsonl →
build_adjudication_flags → adjudicate_fold; append-forward stage snapshots throughout."""
import json
import os
import subprocess
import sys
from pathlib import Path

S = Path(__file__).resolve().parents[1]
PY_ = sys.executable
ENV_GIT = {"GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t"}
IDS = ["u1", "u2", "u3"]                       # u1, u2 ELF (G-ENG); u3 LÄS (G-SPRAK)
SECTION = {"u1": "ELF", "u2": "ELF", "u3": "LÄS"}
LANG = {"ELF": "G-ENG", "LÄS": "G-SPRAK"}


def sh(*args, cwd=None, env=None, ok=True):
    r = subprocess.run([str(a) for a in args], cwd=cwd, capture_output=True, text=True, env={**os.environ, **(env or {})})
    if ok:
        assert r.returncode == 0, f"{[str(a) for a in args][:4]} rc={r.returncode}\n{r.stdout}\n{r.stderr}"
    return r


def unit(cid, key="B"):
    return {"candidate_id": cid, "section": SECTION.get(cid, "ELF"), "family": f"fam-{cid}", "title": f"T {cid}",
            "passage": f"The passage of {cid} says the answer is bee.", "generator_meta": {"origin": "fixture"},
            "questions": [{"q_index": i, "prompt": f"Q{i} of {cid}?", "key": key, "rationale": f"bee because {i}",
                           "options": [{"letter": L, "text": f"{L}{i}"} for L in "ABCD"]} for i in (1, 2)]}


def rec(cid, gate, target, verdict="pass", vote=None, **kw):
    r = {"candidate_id": cid, "gate": gate, "target": target, "verdict": verdict, "findings": [],
         "justification": "j", "executed_by": "fixture", "date": "2026-09-01", **kw}
    if vote is not None:
        r["vote"] = vote
    return r


def write_jsonl(p, recs):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in recs), encoding="utf-8")


def make_subject(tmp: Path):
    repo = tmp / "repo"
    (repo / "pipeline/synthetic/gates/scripts").mkdir(parents=True)
    (repo / "pipeline/synthetic/gates/scripts/tool.py").write_text("x\n")
    (repo / "pipeline/synthetic/gates/bands.json").write_text("{}\n")
    (repo / "pipeline/synthetic/evidence").mkdir(); (repo / "pipeline/synthetic/evidence/x.py").write_text("x\n")
    sh("git", "-C", repo, "init", "-q"); sh("git", "add", ".", cwd=repo); sh("git", "commit", "-q", "-m", "base", cwd=repo, env=ENV_GIT)
    b = repo / "pipeline/synthetic/batches/batch90"
    (b / "candidates").mkdir(parents=True)
    for cid in IDS:
        (b / "candidates" / f"{cid}.json").write_text(json.dumps(unit(cid), ensure_ascii=False, indent=2), encoding="utf-8")
    write_jsonl(b / "verdicts-mech.jsonl", [rec(c, g, "passage") for c in IDS for g in ("M-SCHEMA", "M-BANDS", "M-TELL", "M-FORM", "M-ECHO", "M-PLAGIARISM")])
    write_jsonl(b / "verdicts/verdicts-gkey-resolved.jsonl", [rec(c, "G-KEY", f"q:{i}", vote=v, solver_answer="B") for c in IDS for i in (1, 2) for v in (1, 2)])
    write_jsonl(b / "verdicts/verdicts-gstem.jsonl", [rec(c, "G-STEM", f"q:{i}", "flag" if (c, i) in (("u1", 1), ("u3", 2)) else "pass",
                                                        findings=["PARTIALLY: form"] if (c, i) in (("u1", 1), ("u3", 2)) else []) for c in IDS for i in (1, 2)])
    write_jsonl(b / "verdicts/verdicts-gdistractor.jsonl", [rec(c, "G-DISTRACTOR", f"q:{i}") for c in IDS for i in (1, 2)])
    write_jsonl(b / "verdicts/verdicts-geng.jsonl", [rec(c, "G-ENG", "passage", vote=v) for c in IDS if SECTION[c] == "ELF" for v in (1, 2, 3)])
    write_jsonl(b / "verdicts/verdicts-gsprak.jsonl", [rec(c, "G-SPRAK", "passage", vote=v) for c in IDS if SECTION[c] == "LÄS" for v in (1, 2, 3)])
    write_jsonl(b / "verdicts/verdicts-gregister.jsonl", [rec(c, "G-REGISTER", "passage") for c in IDS])
    sh(PY_, S / "assemble_verdicts.py", "--batch-dir", b, "--out", b / "verdicts.jsonl")
    sh(PY_, S / "make_sheets.py", "--batch-dir", b)
    corpus = tmp / "corpus"; corpus.mkdir(); (corpus / "c.json").write_text("{}")
    tool = tmp / "executed.py"; tool.write_text("executed\n")
    return repo, b, corpus, tool


def report(lane_dir: Path, body: dict) -> None:
    m = json.loads((lane_dir / "bundle/manifest.json").read_text())
    r = {"schema": "gas-city-evidence-report.v1", "run_id": m["run_id"], "lane_id": m["lane_id"], "lane_class": m["lane_class"],
         "status": "evidence-only", "summary": "fixture", "candidate_ids": m["candidate_ids"], **body}
    (lane_dir / "reports/report.json").write_text(json.dumps(r, ensure_ascii=False), encoding="utf-8")


def gkey_answers(units):
    return [{"candidate_id": c, "target": f"q:{i}", "solver_answer": "B", "justification": "j"} for c in units for i in (1, 2)]


def gd_judgements(units):
    return [{"candidate_id": c, "target": f"q:{i}", "verdict": "pass", "findings": [], "justification": "j"} for c in units for i in (1, 2)]


def _setup(tmp_path, mixed: bool):
    repo, b, corpus, tool = make_subject(tmp_path)
    run = tmp_path / "evidence-runs" / "run-1"
    env = {"HPF_CORPUS_DIR": str(corpus)}
    dig = lambda *a: sh(PY_, S / "completion_digests.py", *a, "--batch-dir", b, "--bead", "hpf-t", "--executed-tool", tool, env=env, ok=False)
    lane = lambda *a: sh(PY_, S / "lane_bundle.py", *a, ok=False)
    build = lambda cls, lid, *extra: lane("build", "--batch-dir", b, "--lane-class", cls, "--lane-id", lid, "--run-id", "run-1", "--run-root", run, *extra)
    ingest = lambda lid, *extra: lane("ingest", "--batch-dir", b, "--lane-dir", run / "lanes" / lid, "--date", "2026-09-02", *extra)
    base = b / "DIGESTS-completion-hpf-t.json"
    stage = lambda name: b / f"DIGESTS-completion-hpf-t.stage-{name}.json"

    # S0 baseline
    assert dig("baseline").returncode == 0 and base.exists()

    # S00 smoke: ordinary report-only startup lane on the embedded fixture; leaves no trace in the batch
    assert build("smoke", "s00-smoke").returncode == 0
    report(run / "lanes/s00-smoke", {"candidate_id": "smoke-0001", "answer": "B", "note": "bundle read, report written"})
    assert ingest("s00-smoke").returncode == 0
    assert dig("verify", "--manifest", base).returncode == 0          # batch byte-identical after the smoke

    # S1 reviews (three lanes) -> ingest; language proposes fixes for u1 (ELF) and u3 (LÄS)
    for cls in ("review-language", "review-pedagogy", "review-integrated"):
        assert build(cls, cls).returncode == 0
    fix = lambda c, path, old, new: {"candidate_id": c, "verdict": "FIX_PROPOSED", "findings": [{"id": f"L-{c}", "candidate_id": c, "location": path,
                     "severity": "minor", "category": "idiom", "evidence": "x", "fix": {"path": path, "old": old, "new": new}}]}
    clear = lambda c: {"candidate_id": c, "verdict": "CLEAR", "findings": []}
    report(run / "lanes/review-language", {"units": [fix("u1", "$.passage", "is bee", "is B"), clear("u2"),
                                                     fix("u3", "$.passage", "is bee", "is B") if mixed else clear("u3")]})
    report(run / "lanes/review-pedagogy", {"units": [{"candidate_id": c, "verdict": "SOUND", "findings": []} for c in IDS]})
    report(run / "lanes/review-integrated", {"units": [{"candidate_id": c, "sweep_verdict": "CONSISTENT", "arithmetic_recomputed": ["none"],
                                                        "verified_carry_ins": [], "findings": []} for c in IDS]})
    for cls in ("review-language", "review-pedagogy", "review-integrated"):
        assert ingest(cls).returncode == 0
    r = dig("snapshot", "--stage", "s1-reviews", "--prior", base, "--allow", "batch:reviews/*")
    assert r.returncode == 0 and "ALLOWED" in r.stdout

    return repo, b, corpus, tool, run, env, dig, lane, build, ingest, base, stage


def test_A_mixed_section_repair_stops_at_the_budget_with_fix_proposed_preserved(tmp_path):
    repo, b, corpus, tool, run, env, dig, lane, build, ingest, base, stage = _setup(tmp_path, mixed=True)
    r = sh(PY_, S / "plan_revalidation.py", "--batch-dir", b, "--stages", "language", "--budget", "5", ok=False)
    assert r.returncode == 1 and "6 re-validation session(s)" in r.stdout and "STOP" in r.stdout
    assert dig("verify", "--manifest", stage("s1-reviews")).returncode == 0            # nothing changed by planning
    last = {}
    for l in (b / "reviews/language.jsonl").read_text().splitlines():
        rec_ = json.loads(l); last[rec_["candidate_id"]] = rec_["verdict"]
    assert last == {"u1": "FIX_PROPOSED", "u2": "CLEAR", "u3": "FIX_PROPOSED"}         # nothing cleared
    assert sh(PY_, S / "check_review_integrity.py", "--batch-dir", b).returncode == 0
    r = sh(PY_, S / "promote.py", "--batch-dir", b, ok=False)
    assert "HOLD  u1" in r.stdout and "HOLD  u3" in r.stdout                           # the unapplied proposals keep their units on HOLD
    # the forbidden shortcut: a coordinator CLEAR would flip promote — the integrity check and the planner refuse it
    with (b / "reviews/language.jsonl").open("a") as fh:
        fh.write(json.dumps({"candidate_id": "u3", "stage": "language", "verdict": "CLEAR", "reviewed_by": "coordinator/deferred-over-budget"}) + "\n")
    assert sh(PY_, S / "check_review_integrity.py", "--batch-dir", b, ok=False).returncode == 1
    assert sh(PY_, S / "plan_revalidation.py", "--batch-dir", b, "--stages", "language", "--budget", "5", ok=False).returncode == 3
    # the legitimate deferral verdict keeps the HOLD visible
    with (b / "reviews/language.jsonl").open("a") as fh:
        fh.write(json.dumps({"candidate_id": "u3", "stage": "language", "verdict": "DEFERRED", "reviewed_by": "coordinator/over-budget"}) + "\n")
    assert sh(PY_, S / "check_review_integrity.py", "--batch-dir", b, ok=False).returncode == 1   # the CLEAR record before it is still a violation
    assert "HOLD  u3" in sh(PY_, S / "promote.py", "--batch-dir", b, ok=False).stdout


def test_B_elf_only_repair_runs_the_five_session_path_end_to_end(tmp_path):
    repo, b, corpus, tool, run, env, dig, lane, build, ingest, base, stage = _setup(tmp_path, mixed=False)
    r = sh(PY_, S / "plan_revalidation.py", "--batch-dir", b, "--stages", "language", "--budget", "5", "--json", run / "reval-plan.json")
    assert "5 re-validation session(s)" in r.stdout and "FITS" in r.stdout
    plan_ = json.loads((run / "reval-plan.json").read_text())
    assert [l["lane_class"] for l in plan_["lanes"]] == ["reval-gstem", "reval-gkey", "reval-gkey", "reval-gdistractor", "reval-language"]
    # D1 exact fixes (transactional; before-images kept) -> only u1 changes; stale review bundle no longer binds
    r = sh(PY_, S / "apply_exact_fixes.py", "--batch-dir", b, "--stage", "language")
    changed = r.stdout.strip().splitlines()[1:]
    assert changed == ["u1"]
    sh(PY_, S / "make_sheets.py", "--batch-dir", b)
    assert lane("verify-bundle", "--batch-dir", b, "--lane-dir", run / "lanes/review-language").returncode == 2
    allow_d1 = ["--allow", "batch:reviews/language.jsonl", "--allow", "batch:exact-fix-backups/*"]
    for c in changed:
        allow_d1 += ["--allow", f"batch:candidates/{c}.json", "--allow", f"batch:blind/{c}.json", "--allow", f"batch:distractor/{c}.json", "--allow", f"batch:stems/{c}.json"]
    r = dig("snapshot", "--stage", "d1-exact-fix", "--prior", stage("s1-reviews"), *allow_d1)
    assert r.returncode == 0, r.stdout
    snap = json.loads(stage("d1-exact-fix").read_text())
    assert "batch:candidates/u2.json" not in snap["delta"]["changed"] and any(k.startswith("batch:exact-fix-backups/") for k in snap["delta"]["added"])

    # S2 the complete conditional path exactly as planned (5 sessions), round r5: gstem, gkey×2, gdistractor, language G-ENG
    sessions = 0
    assert build("reval-gstem", "r5-gstem", "--units", *changed).returncode == 0
    report(run / "lanes/r5-gstem", {"judgements": [{"candidate_id": c, "target": t, "verdict": "pass", "blind_pick": "A", "confidence": "low",
                                                    "findings": [], "justification": "j"} for c in changed for t in ("q:1", "q:2", "pair")]})
    assert ingest("r5-gstem", "--round", "r5").returncode == 0; sessions += 1
    for lane_ in (l for l in plan_["lanes"] if l["lane_class"] == "reval-language"):
        g = lane_["gate"]
        assert build("reval-language", f"r5-lang-{g}", "--units", *lane_["units"], "--gate", g).returncode == 0
        report(run / "lanes" / f"r5-lang-{g}", {"gate": g, "passes": [{"candidate_id": c, "vote": v, "verdict": "pass", "findings": [], "justification": "j"}
                                                                      for c in lane_["units"] for v in (1, 2, 3)]})
        assert ingest(f"r5-lang-{g}", "--round", "r5").returncode == 0; sessions += 1
    for vote in (1, 2):
        assert build("reval-gkey", f"r5-gkey-{vote}", "--units", *changed, "--vote", str(vote)).returncode == 0
        report(run / "lanes" / f"r5-gkey-{vote}", {"vote": vote, "answers": gkey_answers(changed), "findings": []})
        assert ingest(f"r5-gkey-{vote}", "--round", "r5").returncode == 0; sessions += 1
    assert build("reval-gdistractor", "r5-gd", "--units", *changed).returncode == 0
    report(run / "lanes/r5-gd", {"judgements": gd_judgements(changed)})
    assert ingest("r5-gd", "--round", "r5").returncode == 0; sessions += 1
    assert sessions == plan_["sessions_required"] == 5
    assert sorted(p.name for p in (b / "verdicts").glob("*-r5*")) == ["verdicts-gdistractor-r5.jsonl", "verdicts-gkey-r5-1.jsonl",
                                                                       "verdicts-gkey-r5-2.jsonl", "verdicts-gstem-r5.jsonl", "verdicts-lang-r5.jsonl"]
    sh(PY_, S / "gkey_resolve.py", b / "verdicts/verdicts-gkey-r5-1.jsonl", b / "verdicts/verdicts-gkey-r5-2.jsonl",
       "--candidates-dir", b / "candidates", "--out", b / "verdicts/verdicts-gkey-r5-resolved.jsonl")
    sh(PY_, S / "assemble_verdicts.py", "--batch-dir", b, "--out", b / "verdicts.jsonl")
    canon = [json.loads(l) for l in (b / "verdicts.jsonl").read_text().splitlines()]
    def cv(c, g, t, v=None):
        return next(x for x in canon if x["candidate_id"] == c and x["gate"] == g and x["target"] == t and x.get("vote") == v)["verdict"]
    assert cv("u1", "G-STEM", "q:1") == "pass" and cv("u2", "G-STEM", "q:1") == "pass"
    assert cv("u3", "G-STEM", "q:2") == "flag"                       # u3 was NOT repaired: its round-1 flag stands
    assert cv("u1", "G-ENG", "passage", 3) == "pass" and cv("u1", "G-KEY", "q:1", 1) == "pass"
    # fixed V-FINAL lanes on the final bytes of ALL units: no collision with the r5 conditional records
    for vote in (1, 2):
        assert build("vfinal-gkey", f"vf-gkey-{vote}", "--vote", str(vote)).returncode == 0
        findings = [{"id": "M1", "candidate_id": "u2", "location": "q:1", "severity": "major", "category": "double-answer",
                     "evidence": "C is arguably defensible from the second sentence"}] if vote == 1 else []
        report(run / "lanes" / f"vf-gkey-{vote}", {"vote": vote, "answers": gkey_answers(IDS), "findings": findings})
    r = ingest("vf-gkey-1")
    assert r.returncode == 2 and "escalation" in r.stderr           # major finding blocks a silent ingest
    assert ingest("vf-gkey-1", "--record-escalations").returncode == 0
    assert ingest("vf-gkey-2").returncode == 0
    assert build("vfinal-gdistractor", "vf-gd").returncode == 0
    report(run / "lanes/vf-gd", {"judgements": gd_judgements(IDS)})
    assert ingest("vf-gd").returncode == 0
    esc = [json.loads(l) for l in (b / "reviews/escalations.jsonl").read_text().splitlines()]
    assert len(esc) == 1 and esc[0]["candidate_id"] == "u2" and esc[0]["severity"] == "major" and esc[0]["source"] == "escalation:vfinal-gkey"
    vf1 = [json.loads(l) for l in (b / "verdicts-vfinal/verdicts-gkey-1.jsonl").read_text().splitlines()]
    assert next(x for x in vf1 if x["candidate_id"] == "u2" and x["target"] == "q:1")["findings"] == ["M1[major] double-answer: C is arguably defensible from the second sentence"]
    r = dig("snapshot", "--stage", "s2-reval-vfinal", "--prior", stage("d1-exact-fix"),
            "--allow", "batch:verdicts/*", "--allow", "batch:verdicts.jsonl", "--allow", "batch:verdicts-vfinal/*", "--allow", "batch:reviews/escalations.jsonl")
    assert r.returncode == 0, r.stdout

    # S3 audits -> resolve -> fold -> aggregate -> promote --require-clean
    for c in IDS:
        assert build("vfinal-audit", f"audit-{c}", "--units", c).returncode == 0
        report(run / "lanes" / f"audit-{c}", {"candidate_id": c, "audit_verdict": "CONFIRMED_NOTES", "scope_note": "s",
                                              "findings": [{"id": "N1", "severity": "note", "stage_challenged": "rationale", "claim": "cl", "evidence": "e", "why": "w", "disposition": "d", "key_impact": "none"}],
                                              "resolved_findings": [], "cleared": [], "audit_note": ""})
        assert ingest(f"audit-{c}").returncode == 0
    sh(PY_, S / "gkey_resolve.py", b / "verdicts-vfinal/verdicts-gkey-1.jsonl", b / "verdicts-vfinal/verdicts-gkey-2.jsonl",
       "--candidates-dir", b / "candidates", "--out", b / "verdicts-vfinal/verdicts-gkey-resolved.jsonl")
    sh(PY_, S / "vfinal_fold.py", "--verdicts-dir", b / "verdicts-vfinal", "--audits-dir", b / "audits", "--candidates-dir", b / "candidates",
       "--out", b / "reviews/final_verify.jsonl", "--date", "2026-09-02")
    fv = [json.loads(l) for l in (b / "reviews/final_verify.jsonl").read_text().splitlines()]
    assert {r["verdict"] for r in fv} <= {"VERIFIED", "VERIFIED_NOTES"}, fv
    sh(PY_, S / "aggregate.py", b / "verdicts.jsonl", "--candidates-dir", b / "candidates", "--json", b / "report-final.json")
    r = sh(PY_, S / "promote.py", "--batch-dir", b, "--require-clean")
    assert "PASS: 3   HOLD: 0" in r.stdout, r.stdout
    r = dig("snapshot", "--stage", "s3-fold-promote", "--prior", stage("s2-reval-vfinal"),
            "--allow", "batch:audits/*", "--allow", "batch:verdicts-vfinal/*", "--allow", "batch:reviews/final_verify.jsonl", "--allow", "batch:report-final.json")
    assert r.returncode == 0, r.stdout

    # S4 stage 11: fresh-eyes -> mechanical flags (escalation surfaced at its own severity) -> adjudicate_fold escalates u2
    for c in IDS:
        assert build("fresh-eyes", f"fresh-{c}", "--units", c).returncode == 0
        report(run / "lanes" / f"fresh-{c}", {"candidate_id": c, "cold_solve": [{"target": f"q:{i}", "reader_answer": "B"} for i in (1, 2)],
                                              "naturalness": "natural", "makes_sense": True, "reader_blockers": [], "reader_notes": []})
        assert ingest(f"fresh-{c}").returncode == 0
    sh(PY_, S / "build_adjudication_flags.py", "--batch-dir", b, "--out", b / "adjudication-flags.json")
    flags = json.loads((b / "adjudication-flags.json").read_text())
    assert [f["source"] for f in flags["u2"]] == ["audit:rationale", "escalation:vfinal-gkey"] and flags["u2"][1]["severity"] == "major"
    assert [f["source"] for f in flags["u1"]] == ["audit:rationale"]
    assert [f["source"] for f in flags["u3"]] == ["G-STEM:q:2", "audit:rationale"]
    sh(PY_, S / "adjudicate_fold.py", "--evidence-dir", b / "adjudication-evidence", "--candidates-dirs", b / "candidates",
       "--flags-file", b / "adjudication-flags.json", "--out", b / "reviews/adjudication.jsonl")
    adj = {r["candidate_id"]: r["recommendation"] for r in map(json.loads, (b / "reviews/adjudication.jsonl").read_text().splitlines())}
    assert adj == {"u1": "GODKANN_NOTED", "u2": "AGARBLICK", "u3": "GODKANN_NOTED"}, adj
    r = dig("snapshot", "--stage", "s4-stage11", "--prior", stage("s3-fold-promote"),
            "--allow", "batch:adjudication-evidence/*", "--allow", "batch:adjudication-flags.json", "--allow", "batch:reviews/adjudication.jsonl")
    assert r.returncode == 0, r.stdout

    # S5 commit -> head transition is an explicit allowed delta; rejected attempts are preserved, never overwritten
    sh("git", "add", "pipeline/synthetic/batches/batch90", cwd=repo); sh("git", "commit", "-q", "-m", "batch90 package", cwd=repo, env=ENV_GIT)
    r = dig("snapshot", "--stage", "s5-post-commit", "--prior", stage("s4-stage11"))
    assert r.returncode == 1 and "subject:head" in r.stdout
    assert not stage("s5-post-commit").exists() and len(list(b.glob("DIGESTS-completion-hpf-t.stage-s5-post-commit.DISALLOWED-*.json"))) == 1
    r = dig("snapshot", "--stage", "s5-post-commit", "--prior", stage("s4-stage11"), "--allow", "subject:head", "--allow", "subject:tree")
    assert r.returncode == 0, r.stdout
    post = json.loads(stage("s5-post-commit").read_text())
    assert post["subject"]["batch_git_tracked"] is True and post["prior"]["file"] == stage("s4-stage11").name

    # S6 the next batch's baseline starts from the post-commit head; the original baseline is untouched
    b2 = repo / "pipeline/synthetic/batches/batch91"; (b2 / "candidates").mkdir(parents=True)
    (b2 / "candidates/v1.json").write_text(json.dumps(unit("v1")))
    sh(PY_, S / "completion_digests.py", "baseline", "--batch-dir", b2, "--bead", "hpf-n", "--executed-tool", tool, env=env)
    nb = json.loads((b2 / "DIGESTS-completion-hpf-n.json").read_text())
    assert nb["subject"]["head"] == post["subject"]["head"] != json.loads(base.read_text())["subject"]["head"]
    assert dig("verify", "--manifest", base).returncode == 1
