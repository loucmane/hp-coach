#!/usr/bin/env python3
"""Facit-key consistency sweep.

Parses every exam's facit.pdf answer columns and compares each stored
pass's answer key (app/public/data) against ALL columns of the matching
type (kvant vs verb). A pass is CLEAN when its best column matches
~perfectly; CORRUPTED when the best match is chance-level (the
var-2018-1-kvant2 bug); SKEWED when it matches a column well but not the
one its provpass label implies (still fixable mechanically).

Run:  venv/bin/python audit/facit_sweep.py
Writes evidence to audit/dtk/facit_sweep_result.json.

Born from the 2026-07 DTK audit, which found var-2018-1-kvant2 stored
answers matching its true facit column 0/40. Keep as a permanent guard:
re-run after any parser change.
"""

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
PDF_DIR = ROOT / "data" / "pdfs"
BANK_DIR = ROOT / "app" / "public" / "data"
OUT = ROOT / "audit" / "dtk" / "facit_sweep_result.json"

CLEAN_MIN = 0.93  # ≥ ~37/40 on the best column

# Passes whose facit column is an IMAGE OVERLAY (text layer stale): their
# true keys were vision-read from the overlay crops (2× reads + 12/12
# figure-audit confirmation) and repaired by audit/repair_var2018_keys.mjs.
# The guard validates stored keys against these pinned values instead.
PINNED_KEYS = {
    ("var-2018-1", "kvant2"): "B B A B D C C D B C D A D A A B B B A C "
                              "B C B C D E B C C D A C B C D A B C C B".split(),
    ("var-2018-1", "verb2"): "B C C C B D C E E A B D C A D D A C B D "
                             "B D C B D A C C B A A C C B D B C B D D".split(),
}


def detect_overlays(pdf_path):
    """Image XObjects big enough to cover an answer column. ROOT CAUSE of
    the var-2018-1 corruption: its facit has corrected pp4/pp5 columns
    pasted as IMAGES over stale text — text extraction reads the old,
    wrong letters underneath. Any column overlapped by such an image has
    an untrustworthy text layer and must be read visually."""
    overlays = []
    with pdfplumber.open(pdf_path) as pdf:
        for pageno, page in enumerate(pdf.pages):
            for im in page.images:
                w = im["x1"] - im["x0"]
                h = im["bottom"] - im["top"]
                if w > 60 and h > 200:  # tall column-sized patches only
                    overlays.append({"page": pageno, "x0": im["x0"], "x1": im["x1"],
                                     "top": im["top"], "bottom": im["bottom"]})
    return overlays


def parse_facit_columns(pdf_path):
    """Return [{'provpass': int|None, 'kind': 'kvant'|'verb'|None,
    'answers': {qnum: letter}}] parsed from the facit's side-by-side
    columns, using word x-positions to bucket."""
    columns = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            words = page.extract_words()
            if not words:
                continue
            # host-2016/17/18 facits have no ToUnicode cmap — extraction
            # yields raw "(cid:NN)" tokens. Their subset encoding follows
            # chr(cid+29) for the ASCII range ((cid:43)→H in
            # "Högskoleprovet"), which covers digits and A–E.
            if "(cid:" in words[0]["text"]:
                for w in words:
                    w["text"] = re.sub(
                        r"\(cid:(\d+)\)",
                        lambda m: chr(int(m.group(1)) + 29),
                        w["text"],
                    )
            # 1) Column anchors: "Provpass N" headers. The footnote
            # ("Provpass 3 ingår ej!") is excluded by requiring the next
            # token to be a digit AND at least 2 anchors sharing a top-band.
            anchors = []
            for i, w in enumerate(words):
                m = re.match(r"Provpass\s+(\d)", w["text"])
                if m:
                    anchors.append({"pp": int(m.group(1)), "x": w["x0"], "top": w["top"]})
                elif w["text"] == "Provpass" and i + 1 < len(words):
                    nxt = words[i + 1]["text"]
                    if re.fullmatch(r"\d", nxt):
                        anchors.append({"pp": int(nxt), "x": w["x0"], "top": w["top"]})
            if not anchors:
                continue
            # keep the top-band group (headers share ~same vertical position)
            bands = defaultdict(list)
            for a in anchors:
                bands[round(a["top"] / 10)].append(a)
            header_band = max(bands.values(), key=len)
            if len(header_band) < 2:
                header_band = sorted(anchors, key=lambda a: a["top"])[: len(anchors)]
            cols = sorted(header_band, key=lambda a: a["x"])

            # 2) Column kind from the "Kvantitativ del X" / "Verbal del X"
            # subheader nearest each anchor's x.
            for c in cols:
                c["kind"] = None
            for w in words:
                head = w["text"].split()[0] if w["text"].split() else ""
                if head in ("Kvantitativ", "Verbal") and w["top"] > cols[0]["top"]:
                    nearest = min(cols, key=lambda c: abs(c["x"] - w["x0"]))
                    if nearest["kind"] is None and w["top"] - nearest["top"] < 60:
                        nearest["kind"] = "kvant" if head == "Kvantitativ" else "verb"

            # 3) Answer pairs: on each text line, a 1-40 integer token
            # immediately followed (in x-order) by a single A-E token.
            for c in cols:
                c["answers"] = {}
            lines = defaultdict(list)
            for w in words:
                lines[round(w["top"] / 4)].append(w)
            for line in lines.values():
                line.sort(key=lambda w: w["x0"])
                for i in range(len(line)):
                    a = line[i]
                    at = a["text"].strip()
                    # self-contained "12 D" token (cid-decoded facits merge them)
                    m = re.fullmatch(r"(\d{1,2})\s+([A-E])", at)
                    pair = None
                    if m:
                        pair = (int(m.group(1)), m.group(2))
                    elif i + 1 < len(line):
                        bt = line[i + 1]["text"].strip()
                        if re.fullmatch(r"\d{1,2}", at) and re.fullmatch(r"[A-E]", bt):
                            pair = (int(at), bt)
                    if not pair:
                        continue
                    q, letter = pair
                    if not (1 <= q <= 40):
                        continue
                    col = min(cols, key=lambda c: abs(c["x"] - a["x0"]))
                    # a pair belongs to a column only if reasonably close
                    if abs(col["x"] - a["x0"]) < 120 and q not in col["answers"]:
                        col["answers"][q] = letter

            for c in cols:
                if c["answers"]:
                    columns.append(
                        {"provpass": c["pp"], "kind": c["kind"], "x": c["x"],
                         "answers": c["answers"]}
                    )
    return columns


def load_stored_keys():
    """{exam_id: {pass: {qnum: letter}}} from the served bank."""
    stored = defaultdict(lambda: defaultdict(dict))
    for f in sorted(BANK_DIR.glob("*.json")):
        if f.name.startswith("_"):
            continue
        data = json.loads(f.read_text())
        questions = data if isinstance(data, list) else data.get("questions", [])
        for q in questions:
            qid = q.get("qid", "")
            m = re.match(r"(.+)-(kvant\d|verb\d)-[A-ZÅÄÖ]+-(\d+)$", qid)
            if m and q.get("answer"):
                stored[m.group(1)][m.group(2)][int(m.group(3))] = q["answer"]
    return stored


def main():
    stored = load_stored_keys()
    report = {}
    flagged = []
    for exam_dir in sorted(PDF_DIR.iterdir()):
        facit = exam_dir / "facit.pdf"
        exam = exam_dir.name
        if not facit.exists():
            report[exam] = {"error": "no facit.pdf"}
            continue
        try:
            cols = parse_facit_columns(facit)
            overlays = detect_overlays(facit)
        except Exception as e:  # keep sweeping even if one PDF is odd
            report[exam] = {"error": f"parse failed: {e}"}
            flagged.append((exam, "-", "PARSE-FAIL"))
            continue
        # mark columns whose x-anchor is covered by an image overlay:
        # their text layer is UNTRUSTWORTHY (stale letters under the patch)
        for c in cols:
            c["overlaid"] = any(
                o["x0"] - 30 <= c["x"] <= o["x1"] for o in overlays
            ) if overlays else False
        exam_report = {"overlays": overlays, "columns": [
            {"provpass": c["provpass"], "kind": c["kind"], "n": len(c["answers"]),
             "overlaid": c["overlaid"]}
            for c in cols
        ], "passes": {}}
        for pass_name, key in sorted(stored.get(exam, {}).items()):
            pinned = PINNED_KEYS.get((exam, pass_name))
            if pinned:
                hits = sum(1 for q, a in key.items() if pinned[q - 1] == a)
                verdict = "REPAIRED-OK" if hits == len(key) else "PINNED-MISMATCH"
                exam_report["passes"][pass_name] = {
                    "best": {"provpass": "pinned", "hits": hits, "n": len(key)},
                    "verdict": verdict,
                }
                mark = "" if verdict == "REPAIRED-OK" else "  ← FLAG"
                print(f"{exam:22s} {pass_name:7s} pinned {hits}/{len(key)}  {verdict}{mark}")
                if verdict != "REPAIRED-OK":
                    flagged.append((exam, pass_name, verdict))
                continue
            want_kind = "kvant" if pass_name.startswith("kvant") else "verb"
            best = None
            for c in cols:
                if c["kind"] not in (want_kind, None):
                    continue
                common = [q for q in key if q in c["answers"]]
                if not common:
                    continue
                hits = sum(1 for q in common if key[q] == c["answers"][q])
                frac = hits / len(common)
                if best is None or frac > best["frac"]:
                    best = {"provpass": c["provpass"], "hits": hits,
                            "n": len(common), "frac": frac,
                            "overlaid": c["overlaid"]}
            if best is None:
                verdict = "NO-COLUMN"
            elif best["overlaid"]:
                # stored came FROM this stale text layer — a high match here
                # is circular, not clean. The truth is in the image patch.
                verdict = "UNTRUSTED-TEXT(overlay)"
            elif best["frac"] >= CLEAN_MIN:
                verdict = "CLEAN"
            else:
                verdict = "CORRUPTED"
            exam_report["passes"][pass_name] = {"best": best, "verdict": verdict}
            mark = "" if verdict == "CLEAN" else "  ← FLAG"
            b = best or {"provpass": "-", "hits": 0, "n": 0}
            print(f"{exam:22s} {pass_name:7s} best=pp{b['provpass']} "
                  f"{b['hits']}/{b['n']}  {verdict}{mark}")
            if verdict != "CLEAN":
                flagged.append((exam, pass_name, verdict))
        report[exam] = exam_report

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=1, ensure_ascii=False))
    print(f"\nflagged passes: {len(flagged)}")
    for exam, p, v in flagged:
        print(f"  {exam} {p}: {v}")
    print(f"evidence → {OUT.relative_to(ROOT)}")
    return 1 if flagged else 0


if __name__ == "__main__":
    sys.exit(main())
