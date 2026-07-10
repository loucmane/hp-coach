#!/usr/bin/env python3
"""Download UHR normeringstabell PDFs and emit per-sitting JSON.

Schema (mirrors the source faithfully AND gives the app an O(1) lookup):
  {
    "exam_id": "var-2024",
    "source_url": "<studera.nu index page>",
    "verbal": { "bands": [{"lo":0,"hi":18,"score":0.0}, ...],
                "table": [ <81 floats, index = raw score 0..80> ] },
    "kvant":  { same shape }
  }
The 21 bands (0.0..2.0 in 0.1 steps) come straight off the PDF; `table`
is the dense expansion (band applied to every raw score it covers).
"""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from manifest import MANIFEST  # noqa: E402

# Emit into the repo data store by default; caller mirrors OUT ->
# app/public/normering/ (identical copy) after a run.
REPO_ROOT = Path(__file__).resolve().parents[2]
OUT = REPO_ROOT / "data" / "normering"
PDFS = Path(__file__).parent / "pdfs"
OUT.mkdir(exist_ok=True)
PDFS.mkdir(exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0 (normering-import)"}

# Row like: "   0 - 18    0.0    2122 ...", or single "  80    2.0 ...".
# Handles hyphen or en/em-dash (– —) between range bounds, and normed
# scores printed either as "0.0"/"1.5" or as bare "0"/"2" (older PDFs
# drop the decimal on the endpoints). Capture raw-lo, optional raw-hi,
# and the score.
DASH = r"[-‐-―−]"
ROW_RE = re.compile(
    rf"^\s*(\d{{1,2}})\s*(?:{DASH}\s*(\d{{1,2}}))?\s+([0-2](?:[.,]\d)?)\s"
)


def fetch(url: str, dest: Path) -> bool:
    if dest.exists() and dest.stat().st_size > 1000:
        return True
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as r:
            data = r.read()
        if len(data) < 1000 or not data[:4] == b"%PDF":
            return False
        dest.write_bytes(data)
        return True
    except Exception as e:  # noqa: BLE001
        print(f"  ! fetch failed {url}: {e}", file=sys.stderr)
        return False


def parse_pdf(pdf: Path) -> dict:
    """Return {'bands':[...], 'table':[81]} or raise on implausible parse."""
    txt = subprocess.run(
        ["pdftotext", "-layout", str(pdf), "-"],
        capture_output=True, text=True, check=True,
    ).stdout
    bands = []
    for line in txt.splitlines():
        m = ROW_RE.match(line)
        if not m:
            continue
        lo = int(m.group(1))
        hi = int(m.group(2)) if m.group(2) else lo
        score = float(m.group(3).replace(",", "."))
        if lo > 80 or hi > 80 or lo > hi:
            continue
        bands.append({"lo": lo, "hi": hi, "score": score})
    # Sanity: bands must cover 0..80 contiguously and reach 2.0.
    bands.sort(key=lambda b: b["lo"])
    if not bands or bands[0]["lo"] != 0:
        raise ValueError(f"first band not 0: {bands[:2]}")
    if bands[-1]["hi"] != 80:
        raise ValueError(f"last band not ...80: {bands[-3:]}")
    table = [None] * 81
    prev_hi = -1
    for b in bands:
        if b["lo"] != prev_hi + 1:
            raise ValueError(f"gap/overlap at {b} (prev_hi={prev_hi})")
        for r in range(b["lo"], b["hi"] + 1):
            table[r] = b["score"]
        prev_hi = b["hi"]
    if any(v is None for v in table):
        raise ValueError("table has holes")
    if table[80] != 2.0 or table[0] != 0.0:
        raise ValueError(f"endpoints wrong: 0->{table[0]} 80->{table[80]}")
    return {"bands": bands, "table": table}


def main():
    index = []
    for exam_id, (src, verb_url, kvant_url) in sorted(MANIFEST.items()):
        vp = PDFS / f"{exam_id}_verb.pdf"
        kp = PDFS / f"{exam_id}_kvant.pdf"
        ok_v = fetch(verb_url, vp)
        ok_k = fetch(kvant_url, kp)
        status = {"exam_id": exam_id, "verbal": False, "kvant": False}
        rec = {"exam_id": exam_id, "source_url": src}
        try:
            if ok_v:
                rec["verbal"] = parse_pdf(vp)
                rec["verbal"]["source_pdf"] = verb_url
                status["verbal"] = True
            if ok_k:
                rec["kvant"] = parse_pdf(kp)
                rec["kvant"]["source_pdf"] = kvant_url
                status["kvant"] = True
        except Exception as e:  # noqa: BLE001
            print(f"  ! parse {exam_id}: {e}", file=sys.stderr)
        if status["verbal"] or status["kvant"]:
            (OUT / f"{exam_id}.json").write_text(
                json.dumps(rec, ensure_ascii=False, indent=2) + "\n"
            )
        index.append(status)
        print(f"{exam_id:16s} verb={status['verbal']} kvant={status['kvant']}")
    (OUT / "_index.json").write_text(
        json.dumps(
            {"sittings": index,
             "note": "UHR normeringstabeller per sitting. verbal/kvant true = official 80q table present.",
             "count": sum(1 for s in index if s['verbal'] and s['kvant'])},
            ensure_ascii=False, indent=2) + "\n"
    )
    full = sum(1 for s in index if s["verbal"] and s["kvant"])
    print(f"\nFull (both halves): {full}/{len(index)}")


if __name__ == "__main__":
    main()
