import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from plan_revalidation import plan_lanes  # noqa: E402


def mk(tmp: Path, fixes_by_unit: dict, sections: dict):
    b = tmp / "b"; (b / "candidates").mkdir(parents=True); (b / "reviews").mkdir()
    for cid, sec in sections.items():
        (b / "candidates" / f"{cid}.json").write_text(json.dumps({"candidate_id": cid, "section": sec, "passage": "p",
            "questions": [{"q_index": 1, "prompt": "q", "rationale": "r", "options": [{"letter": "A", "text": "a"}]}]}))
    lines = [json.dumps({"candidate_id": cid, "stage": "language", "verdict": "FIX_PROPOSED", "fixes": fx, "report_sha256": "s"})
             for cid, fx in fixes_by_unit.items()]
    (b / "reviews" / "language.jsonl").write_text("\n".join(lines) + "\n")
    return b


def test_elf_only_student_facing_repair_needs_exactly_five_sessions(tmp_path):
    b = mk(tmp_path, {"u1": [{"path": "$.passage", "old": "a", "new": "b"}]}, {"u1": "ELF", "u2": "ELF"})
    p = plan_lanes(b, ["language"])
    assert p["sessions_required"] == 5
    assert [l["lane_class"] for l in p["lanes"]] == ["reval-gstem", "reval-gkey", "reval-gkey", "reval-gdistractor", "reval-language"]
    assert p["lanes"][-1]["gate"] == "G-ENG"


def test_mixed_section_student_facing_repair_needs_six_and_does_not_fit(tmp_path):
    b = mk(tmp_path, {"u1": [{"path": "$.passage", "old": "a", "new": "b"}], "u3": [{"path": "$.questions[0].prompt", "old": "q", "new": "r"}]},
           {"u1": "ELF", "u3": "LÄS"})
    p = plan_lanes(b, ["language"])
    assert p["sessions_required"] == 6
    assert sorted(l["gate"] for l in p["lanes"] if l["lane_class"] == "reval-language") == ["G-ENG", "G-SPRAK"]


def test_rationale_only_repairs_need_language_lanes_only(tmp_path):
    b = mk(tmp_path, {"u1": [{"path": "$.questions[0].rationale", "old": "r", "new": "s"}], "u3": [{"path": "$.questions[0].rationale", "old": "r", "new": "s"}]},
           {"u1": "ELF", "u3": "LÄS"})
    p = plan_lanes(b, ["language"])
    assert p["sessions_required"] == 2 and p["sheet_change_units"] == []
    b = mk(tmp_path / "x", {"u1": [{"path": "$.questions[0].rationale", "old": "r", "new": "s"}]}, {"u1": "ELF"})
    assert plan_lanes(b, ["language"])["sessions_required"] == 1


def test_cli_stops_when_over_budget(tmp_path):
    import subprocess
    b = mk(tmp_path, {"u1": [{"path": "$.passage", "old": "a", "new": "b"}], "u3": [{"path": "$.passage", "old": "a", "new": "b"}]},
           {"u1": "ELF", "u3": "LÄS"})
    script = Path(__file__).resolve().parents[1] / "plan_revalidation.py"
    r = subprocess.run([sys.executable, str(script), "--batch-dir", str(b), "--stages", "language", "--budget", "5"], capture_output=True, text=True)
    assert r.returncode == 1 and "STOP: exceeds budget" in r.stdout
    r = subprocess.run([sys.executable, str(script), "--batch-dir", str(b), "--stages", "language", "--budget", "6"], capture_output=True, text=True)
    assert r.returncode == 0 and "FITS" in r.stdout
