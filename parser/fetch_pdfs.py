#!/usr/bin/env python3
"""
Download HP exam PDFs from allakando.se to data/pdfs/{exam_id}/.

Pulls the URLs from the existing CATALOG in bygg_hp_databas.py so we
have a single source of truth. Idempotent — already-downloaded files
are skipped on rerun.

The scraper's hp_databas.json was produced via pdfplumber, which loses
column structure on multi-column pages (ORD, KVA). PyMuPDF gives us
better text-block geometry, so we re-pull the PDFs once and reparse
locally with fitz instead of relying on the flat text dump.
"""
from __future__ import annotations

import sys
import time
from pathlib import Path

import requests

# Reuse the catalog rather than redefining URLs.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from bygg_hp_databas import CATALOG, HEADERS, DELAY  # type: ignore

OUT_ROOT = Path(__file__).resolve().parents[1] / "data" / "pdfs"


def fetch(exam_id: str, force: bool = False) -> None:
    if exam_id not in CATALOG:
        raise KeyError(f"Unknown exam id: {exam_id}")
    out_dir = OUT_ROOT / exam_id
    out_dir.mkdir(parents=True, exist_ok=True)

    for slot, url in CATALOG[exam_id].items():
        out = out_dir / f"{slot}.pdf"
        if out.exists() and out.stat().st_size > 0 and not force:
            print(f"  skip   {slot}  ({out.stat().st_size:>7} B already on disk)")
            continue
        print(f"  fetch  {slot}  {url}")
        resp = requests.get(url, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        out.write_bytes(resp.content)
        print(f"    → {out}  ({len(resp.content):>7} B)")
        time.sleep(DELAY)


def main() -> None:
    targets = sys.argv[1:] or ["var-2026"]
    for exam_id in targets:
        print(f"== {exam_id} ==")
        fetch(exam_id)


if __name__ == "__main__":
    main()
