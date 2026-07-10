#!/usr/bin/env python3
"""Apply verified promotions for the pdf-recovered campaign.

Consumes audit/_pdf_recovered_promotion/verdict_{A..F}.json (written by
the vision-verification subagents; math fenced with visible markers
U+27E6/U+27E7) and applies, per question:

  - verdict match/drift  -> patch prompt/options if final_* given
                            (converting markers to U+E000/U+E001), then
                            set parsing_status to 'complete'.
  - verdict rough/flag   -> leave untouched.
  - answer_check disagree-> never promote (belt and braces; those come
                            in as verdict 'flag' anyway).

All file mutations are targeted raw-string replacements on the JSON
source text — files are never re-serialized (heterogeneous indentation
must survive). PUA sentinels are constructed at runtime (chr(0xE000))
because literal PUA characters do not survive some editor toolchains.

Every fenced fragment in text we touch is verified against KaTeX
(throwOnError) via node before the patch is applied.

Usage:
    python3 scripts/apply_pdf_recovered_promotion.py [--dry-run]
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
AUDIT = REPO / "audit" / "_pdf_recovered_promotion"
DATA = REPO / "app" / "public" / "data"
KATEX = REPO / "app" / "node_modules" / "katex"

S, E = chr(0xE000), chr(0xE001)  # runtime construction — do not inline literals
MS, ME = "⟦", "⟧"  # visible markers used in verdict files


def markers_to_pua(text: str) -> str:
    return text.replace(MS, S).replace(ME, E)


def fenced_fragments(text: str) -> list[str]:
    return re.findall(re.escape(S) + "(.*?)" + re.escape(E), text, flags=re.S)


def katex_verify(fragments: list[str]) -> list[str]:
    """Return the subset of fragments KaTeX rejects (throwOnError)."""
    if not fragments:
        return []
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        json.dump(fragments, f)
        tmp = f.name
    script = (
        f"const k=require({json.dumps(str(KATEX))});"
        f"const fr=require({json.dumps(tmp)});"
        "const bad=[];"
        "for(const x of fr){try{k.renderToString(x,{throwOnError:true,strict:'ignore'})}"
        "catch(e){bad.push(x)}}"
        "process.stdout.write(JSON.stringify(bad));"
    )
    out = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def json_string_encode(value: str) -> str:
    """Encode a Python string exactly as it appears inside the JSON file
    (ensure_ascii=False, literal PUA chars, escaped backslashes/quotes)."""
    return json.dumps(value, ensure_ascii=False)


def main() -> int:
    dry = "--dry-run" in sys.argv

    verdicts: dict[str, dict] = {}
    for vf in sorted(AUDIT.glob("verdict_*.json")):
        for v in json.loads(vf.read_text()):
            verdicts[v["qid"]] = v
    print(f"verdicts loaded: {len(verdicts)}")

    # Load the raw text of every data file that has pdf-recovered rows.
    results = {"promoted": [], "repaired": [], "left": [], "flagged": [], "errors": []}

    for path in sorted(DATA.glob("*.json")):
        if path.name.startswith("_"):
            continue
        raw = path.read_text()
        rows = json.loads(raw)
        touched = False
        for q in rows:
            if q.get("parsing_status") != "pdf-recovered":
                continue
            qid = q["qid"]
            v = verdicts.get(qid)
            if v is None:
                results["errors"].append((qid, "no verdict"))
                continue
            verdict = v["verdict"]
            if verdict in ("rough", "flag"):
                key = "left" if verdict == "rough" else "flagged"
                results[key].append((qid, v.get("reason") or v.get("derivation") or ""))
                continue
            if v.get("answer_check") == "disagree":
                results["flagged"].append((qid, "answer disagree: " + (v.get("derivation") or "")))
                continue

            # Build the replacement edits for this question.
            edits: list[tuple[str, str]] = []  # (old_json_fragment, new_json_fragment)
            repaired = False

            fp = v.get("final_prompt")
            if fp is not None:
                new_prompt = markers_to_pua(fp)
                bad = katex_verify(fenced_fragments(new_prompt))
                if bad:
                    results["errors"].append((qid, f"katex reject in prompt: {bad}"))
                    continue
                old_frag = '"prompt": ' + json_string_encode(q["prompt"])
                new_frag = '"prompt": ' + json_string_encode(new_prompt)
                edits.append((old_frag, new_frag))
                repaired = True

            fo = v.get("final_options") or {}
            opt_err = False
            for opt in q.get("options") or []:
                new_text = fo.get(opt["letter"])
                if new_text is None:
                    continue
                new_text = markers_to_pua(new_text)
                bad = katex_verify(fenced_fragments(new_text))
                if bad:
                    results["errors"].append((qid, f"katex reject in option {opt['letter']}: {bad}"))
                    opt_err = True
                    break
                old_frag = '"text": ' + json_string_encode(opt["text"])
                new_frag = '"text": ' + json_string_encode(new_text)
                edits.append((old_frag, new_frag))
                repaired = True
            if opt_err:
                continue

            # Locate this question's object span in the raw text so edits
            # are applied only within it (option texts repeat across
            # questions, e.g. plain "2" or "x").
            anchor = f'"qid": "{qid}"'
            start = raw.index(anchor)
            # span ends at the next '"qid"' anchor or EOF
            nxt = raw.find('"qid"', start + len(anchor))
            end = nxt if nxt != -1 else len(raw)
            span = raw[start:end]

            ok = True
            for old_frag, new_frag in edits:
                if span.count(old_frag) != 1:
                    results["errors"].append(
                        (qid, f"fragment count {span.count(old_frag)} != 1: {old_frag[:80]!r}")
                    )
                    ok = False
                    break
                span = span.replace(old_frag, new_frag, 1)
            if not ok:
                continue

            status_old = '"parsing_status": "pdf-recovered"'
            status_new = '"parsing_status": "complete"'
            if span.count(status_old) != 1:
                results["errors"].append((qid, "parsing_status fragment not unique in span"))
                continue
            span = span.replace(status_old, status_new, 1)

            raw = raw[:start] + span + raw[end:]
            touched = True
            results["repaired" if (repaired and v["verdict"] == "drift") else "promoted"].append(
                (qid, "fenced/normalized" if repaired else "as-is")
            )

        if touched and not dry:
            # sanity: still valid JSON and sentinels balanced
            json.loads(raw)
            if raw.count(S) != raw.count(E):
                raise SystemExit(f"sentinel imbalance in {path.name} — aborting before write")
            path.write_text(raw)

    for key in ("promoted", "repaired", "left", "flagged", "errors"):
        print(f"\n{key.upper()} ({len(results[key])}):")
        for qid, note in results[key]:
            print(f"  {qid}: {note[:140]}")
    return 0


if __name__ == "__main__":
    main()
