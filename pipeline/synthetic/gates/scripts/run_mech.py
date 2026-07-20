#!/usr/bin/env python3
"""Run the mechanical gate stage over a batch of candidate JSON files.

Usage:
    python3 run_mech.py CANDIDATE.json [CANDIDATE.json ...] \
        [--parsed-dir data/parsed] [--no-plagiarism] [--out verdicts.jsonl]

Emits one verdict per line (verdict.schema.json) to --out (default stdout,
append mode for files so the batch verdicts.jsonl accumulates across stages).
Exit code: 0 if no kills, 1 if any candidate was killed, 2 on usage error.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from mech import Corpus, run_all  # noqa: E402


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("candidates", nargs="+", type=Path)
    ap.add_argument("--parsed-dir", type=Path, default=None,
                    help="authentic corpus dir (default: <repo>/data/parsed)")
    ap.add_argument("--no-plagiarism", action="store_true",
                    help="skip M-PLAGIARISM (e.g. corpus unavailable in CI)")
    ap.add_argument("--out", type=Path, default=None, help="append verdicts here instead of stdout")
    args = ap.parse_args(argv)

    corpus = None
    if not args.no_plagiarism:
        parsed = args.parsed_dir or Path(__file__).resolve().parents[4] / "data" / "parsed"
        if not parsed.is_dir():
            print(f"error: parsed corpus dir not found: {parsed} (use --parsed-dir or --no-plagiarism)",
                  file=sys.stderr)
            return 2
        corpus = Corpus(parsed)

    sink = args.out.open("a", encoding="utf-8") if args.out else sys.stdout
    killed = 0
    try:
        for path in args.candidates:
            cand = json.loads(path.read_text(encoding="utf-8"))
            cand.pop("_seed", None)  # never let seed docs influence anything
            verdicts = run_all(cand, corpus)
            for v in verdicts:
                sink.write(json.dumps(v, ensure_ascii=False) + "\n")
            if any(v["verdict"] == "kill" for v in verdicts):
                killed += 1
                print(f"KILL {cand.get('candidate_id', path.name)}", file=sys.stderr)
    finally:
        if args.out:
            sink.close()
    return 1 if killed else 0


if __name__ == "__main__":
    raise SystemExit(main())
