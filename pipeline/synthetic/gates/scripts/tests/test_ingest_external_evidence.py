from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import pytest

MODULE = Path(__file__).resolve().parents[1] / "ingest_external_evidence.py"
SPEC = importlib.util.spec_from_file_location("ingest_ext", MODULE)
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


def _record(tmp_path: Path, **over) -> Path:
    report = tmp_path / "report.json"
    if not report.exists():
        report.write_text('{"x": 1}', encoding="utf-8")
    import hashlib

    rec = {
        "schema": "hpfetcher-external-evidence.v1",
        "source": "sol-adversarial-audit",
        "source_finding_id": "AA-TEST-001",
        "subject_commit": "f" * 40,
        "candidate_id": "las-b99-001",
        "severity": "critical",
        "finding": "test finding",
        "report_sha256": hashlib.sha256(report.read_bytes()).hexdigest(),
        "report_path": str(report),
        "role": "finding",
    }
    rec.update(over)
    p = tmp_path / "evidence.json"
    p.write_text(json.dumps(rec), encoding="utf-8")
    return p


def _flags(tmp_path: Path) -> Path:
    p = tmp_path / "flags.json"
    p.write_text("{}", encoding="utf-8")
    return p


def test_ingest_then_duplicate_is_noop_and_idempotent(tmp_path: Path) -> None:
    ev, fl = _record(tmp_path), _flags(tmp_path)
    assert mod.ingest(ev, fl) == "ingested"
    first = fl.read_bytes()
    assert mod.ingest(ev, fl) == "duplicate (no-op)"
    assert fl.read_bytes() == first
    flags = json.loads(first)
    entry = flags["las-b99-001"][0]
    assert entry["source"] == "external:sol-adversarial-audit"
    assert entry["severity"] == "critical"
    assert entry["provenance"]["external"] is True
    assert entry["provenance"]["subject_commit"] == "f" * 40


def test_conflicting_record_same_identity_fails_closed(tmp_path: Path) -> None:
    ev, fl = _record(tmp_path), _flags(tmp_path)
    mod.ingest(ev, fl)
    ev2 = _record(tmp_path, finding="different text")
    with pytest.raises(mod.IngestError, match="conflicting record"):
        mod.ingest(ev2, fl)


def test_digest_mismatch_fails_closed(tmp_path: Path) -> None:
    ev, fl = _record(tmp_path, report_sha256="0" * 64), _flags(tmp_path)
    with pytest.raises(mod.IngestError, match="digest mismatch"):
        mod.ingest(ev, fl)


def test_counterevidence_role_downgrades_to_info(tmp_path: Path) -> None:
    ev = _record(tmp_path, role="counterevidence", source_finding_id="BLIND-1")
    fl = _flags(tmp_path)
    mod.ingest(ev, fl)
    entry = json.loads(fl.read_text())["las-b99-001"][0]
    assert entry["severity"] == "info"
    assert entry["provenance"]["role"] == "counterevidence"


def test_missing_fields_and_bad_schema_fail_closed(tmp_path: Path) -> None:
    fl = _flags(tmp_path)
    ev = _record(tmp_path, schema="wrong.v9")
    with pytest.raises(mod.IngestError, match="unsupported evidence schema"):
        mod.ingest(ev, fl)
    bad = tmp_path / "bad.json"
    bad.write_text('{"schema": "hpfetcher-external-evidence.v1"}', encoding="utf-8")
    with pytest.raises(mod.IngestError, match="required fields"):
        mod.ingest(bad, fl)
