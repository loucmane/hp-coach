"""The authentic qid set the worker bundles (docs/p5-infold-design.md Amendment 1 E, PR 3;
beads hpf-94i5 and hpf-0jyp, review finding B3 of hpf-aaqr).

export_authentic_qids.py lists exactly the questions of the authentic bank the
app serves (app/public/data), so the worker calls an answered question authentic
by membership, never by the shape of its qid (worker/src/lib/provenance.ts). A
bank-shaped qid that names no question of the bank is therefore unknown.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys

import pytest

import build_roster
import export_authentic_qids as authentic

REPO_ROOT = build_roster.REPO_ROOT
SCRIPT = authentic.__file__
BankError = authentic.BankError


@pytest.fixture(scope="session")
def built() -> bytes:
    return authentic.build_set(REPO_ROOT)


@pytest.fixture(scope="session")
def bank_set(built) -> dict:
    return json.loads(built)


def _bank_rows() -> list[dict]:
    folder = REPO_ROOT / authentic.BANK_REL
    return [row for path in sorted(folder.glob("*.json")) if not path.name.startswith("_")
            for row in json.loads(path.read_text(encoding="utf-8"))]


def test_the_committed_set_is_the_current_build(built):
    # The worker bundles this file: a bank change that is not re-exported fails here.
    assert authentic.SET_PATH.read_bytes() == built, (
        "worker/data/authentic-qids.json is stale: rerun python3 pipeline/synthetic/infold/export_authentic_qids.py")


def test_the_set_lives_where_the_worker_imports_it():
    assert authentic.SET_PATH == REPO_ROOT / "worker/data/authentic-qids.json"
    source = (REPO_ROOT / "worker/src/lib/provenance.ts").read_text(encoding="utf-8")
    assert "from '../../data/authentic-qids.json'" in source


def test_the_set_is_every_bank_question_once_sorted(bank_set):
    assert list(bank_set) == ["format", "generated_by", "spec", "bank", "exam_count", "qid_count", "exams", "qids"]
    assert bank_set["format"] == "authentic-qid-set-v1"
    assert bank_set["generated_by"] == "pipeline/synthetic/infold/export_authentic_qids.py"
    assert bank_set["bank"] == "app/public/data"
    rows = _bank_rows()
    assert bank_set["qids"] == sorted(row["qid"] for row in rows)
    assert bank_set["qid_count"] == len(bank_set["qids"]) == len(set(bank_set["qids"])) == 4320
    index = json.loads((REPO_ROOT / "app/public/data/_index.json").read_text(encoding="utf-8"))
    assert bank_set["exams"] == sorted(e["exam_id"] for e in index["exams"])
    assert bank_set["exam_count"] == 27


def test_membership_not_shape(bank_set):
    qids = set(bank_set["qids"])
    # A sitting the bank holds, in the bank's grammar, but no question of it.
    for fabricated in ("var-2024-verb1-ORD-015", "var-2024-verb1-LÄS-001", "var-2024-kvant1-KVA-002",
                       "host-2013-kvant1-XYZ-041", "var-2026-kvant2-DTK-001"):
        assert fabricated not in qids
    assert "var-2024-verb1-ORD-001" in qids
    assert "var-2024-verb1-LÄS-011" in qids


def _write_bank(root, exams: dict[str, list[dict]], index: list[str] | None = None) -> None:
    folder = root / authentic.BANK_REL
    folder.mkdir(parents=True, exist_ok=True)
    index = list(exams) if index is None else index
    (folder / authentic.INDEX_NAME).write_text(json.dumps({"exams": [{"exam_id": e} for e in index]}),
                                               encoding="utf-8")
    for exam_id, rows in exams.items():
        (folder / f"{exam_id}.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")


def _row(exam_id: str, provpass: str, section: str, number: int, qid: str | None = None) -> dict:
    return {"qid": qid or f"{exam_id}-{provpass}-{section}-{number:03d}", "exam_id": exam_id,
            "provpass": provpass, "section": section, "number": number}


def _tiny_bank() -> dict[str, list[dict]]:
    return {
        "var-2030": [_row("var-2030", "verb1", "ORD", 1), _row("var-2030", "verb1", "LÄS", 11),
                     _row("var-2030", "kvant2", "DTK", 29)],
        "host-2030": [_row("host-2030", "verb2", "ELF", 31)],
    }


def test_a_tiny_bank_exports_its_sorted_set(tmp_path):
    _write_bank(tmp_path, _tiny_bank())
    exams, qids = authentic.bank_qids(tmp_path)
    assert exams == ["host-2030", "var-2030"]
    assert qids == ["host-2030-verb2-ELF-031", "var-2030-kvant2-DTK-029", "var-2030-verb1-LÄS-011",
                    "var-2030-verb1-ORD-001"]


@pytest.mark.parametrize("label, mutate", [
    ("a file that is not an indexed sitting",
     lambda bank: bank.update({"var-2031": [_row("var-2031", "verb1", "ORD", 1)]}) or (bank, ["var-2030", "host-2030"])),
    ("an indexed sitting without a file",
     lambda bank: (bank, ["var-2030", "host-2030", "var-2032"])),
    ("a duplicate qid",
     lambda bank: bank["host-2030"].append(_row("host-2030", "verb2", "ELF", 31)) or (bank, None)),
    ("a qid that disagrees with its fields",
     lambda bank: bank["var-2030"].append(_row("var-2030", "verb1", "ORD", 2, "var-2030-verb1-ORD-015"))
     or (bank, None)),
    ("a section of the other half",
     lambda bank: bank["var-2030"].append(_row("var-2030", "verb1", "XYZ", 2)) or (bank, None)),
    ("an unknown provpass",
     lambda bank: bank["var-2030"].append(_row("var-2030", "verb3", "ORD", 2)) or (bank, None)),
    ("a number out of range",
     lambda bank: bank["var-2030"].append(_row("var-2030", "verb1", "ORD", 1000)) or (bank, None)),
    ("a row of another sitting",
     lambda bank: bank["var-2030"].append(_row("host-2030", "verb1", "ORD", 2)) or (bank, None)),
])
def test_a_bank_that_breaks_the_rules_is_refused(tmp_path, label, mutate):
    bank, index = mutate(_tiny_bank())
    _write_bank(tmp_path, bank, index)
    with pytest.raises(BankError):
        authentic.build_set(tmp_path)


def test_an_unreadable_sitting_is_refused(tmp_path):
    _write_bank(tmp_path, _tiny_bank())
    (tmp_path / authentic.BANK_REL / "var-2030.json").write_text("[{", encoding="utf-8")
    with pytest.raises(BankError):
        authentic.build_set(tmp_path)


def test_the_cli_checks_and_writes_and_refuses_without_writing(tmp_path):
    _write_bank(tmp_path, _tiny_bank())
    out = tmp_path / "set.json"
    run = [sys.executable, SCRIPT, "--root", str(tmp_path), "--out", str(out)]
    assert subprocess.run([*run, "--check"], capture_output=True, text=True).returncode == 1
    written = subprocess.run(run, capture_output=True, text=True)
    assert written.returncode == 0, written.stderr
    assert out.read_bytes() == authentic.build_set(tmp_path)
    assert subprocess.run([*run, "--check"], capture_output=True, text=True).returncode == 0
    # A bank change makes the set stale.
    rows = json.loads((tmp_path / authentic.BANK_REL / "host-2030.json").read_text(encoding="utf-8"))
    rows.append(_row("host-2030", "verb2", "ELF", 32))
    (tmp_path / authentic.BANK_REL / "host-2030.json").write_text(json.dumps(rows), encoding="utf-8")
    assert subprocess.run([*run, "--check"], capture_output=True, text=True).returncode == 1
    # A refused bank writes nothing.
    (tmp_path / authentic.BANK_REL / "host-2030.json").write_text("[]", encoding="utf-8")
    before = out.read_bytes()
    refused = subprocess.run(run, capture_output=True, text=True)
    assert refused.returncode == 1 and "REFUSED" in refused.stderr
    assert out.read_bytes() == before


@pytest.mark.parametrize("seed", ["0", "4242"])
def test_the_committed_set_checks_clean_under_any_hash_seed(seed):
    env = dict(os.environ, PYTHONHASHSEED=seed)
    done = subprocess.run([sys.executable, SCRIPT, "--check"], capture_output=True, text=True, env=env)
    assert done.returncode == 0, done.stdout + done.stderr


def test_the_backfill_migration_loads_the_set_in_bounded_idempotent_statements(tmp_path):
    exams, qids = authentic.bank_qids(REPO_ROOT)
    sql = authentic.render_backfill_migration(exams, qids).decode("utf-8")
    statements = [s.strip() for s in sql.split("--> statement-breakpoint")]
    inserts = [s for s in statements if s.startswith("INSERT OR IGNORE INTO `tmp_0013_authentic_qid`")]
    assert len(inserts) == -(-len(qids) // authentic.INSERT_CHUNK)
    listed = [line[2:-3] for s in inserts for line in s.splitlines()[1:]]
    assert listed == qids
    for statement in statements:
        assert len(statement.encode("utf-8")) < 100_000  # D1's statement size limit
    assert "CREATE TABLE IF NOT EXISTS `tmp_0013_authentic_qid`" in statements[0]
    assert statements[-1] == "DROP TABLE IF EXISTS `tmp_0013_authentic_qid`;"
    # The legacy LAS spelling maps to the precomposed Ä the bank spells.
    assert "replace(`question_id`, '-LAS-', '-LÄS-')" in sql
    assert "Ä" not in sql
    # Only 'unknown' rows are ever promoted; the fit reset tests for leftovers.
    assert sql.count("WHERE `source` = 'unknown'\n") == 2
    assert sql.count("WHERE EXISTS (SELECT 1 FROM `item_stats` WHERE `source` = 'unknown');") == 3
    # wrangler splits a migration file on semicolons: no comment may hold one.
    assert not [line for line in sql.splitlines() if line.startswith("--") and ";" in line]


def test_the_committed_backfill_migration_holds_the_committed_set(bank_set):
    # 0013 is frozen once applied; until then it must load exactly the bundled set.
    sql = (REPO_ROOT / "worker/drizzle/0013_attempt_provenance_backfill.sql").read_text(encoding="utf-8")
    listed = [line[2:-3] for line in sql.splitlines() if line.startswith("('")]
    assert listed == bank_set["qids"]
    assert not [line for line in sql.splitlines() if line.startswith("--") and ";" in line]


def test_a_copied_bank_round_trips(tmp_path):
    shutil.copytree(REPO_ROOT / authentic.BANK_REL, tmp_path / authentic.BANK_REL)
    assert authentic.build_set(tmp_path) == authentic.build_set(REPO_ROOT)
