"""Generate Layer 2 explanations for HP-Coach questions.

Reads `data/parsed/<exam>.json`, calls the Anthropic Messages API
with tool-use forcing the explanation schema, writes results to
`data/explanations/<exam>.json` (one file per exam, keyed by qid).

Resumable: on rerun, only generates explanations for qids that
don't already exist in the output file (unless `--force`).

Filters narrow the work:
  --section=XYZ        only one section
  --exam=host-2025     only one exam
  --qids file.txt      explicit qid list (one per line) — used for
                       Phase 2A backfill of the user's mistakes
  --limit=N            cap the number of generations (smoke testing)
  --all                no filter (full corpus backfill)

Cost is logged per call (input + thinking + output) and totalled at
the end. Sonnet 4.6 with extended thinking runs ~$0.012/question
including thinking budget; ~$42 for the full ~3500-question backfill.

Usage:
  python pipeline/explanations/generate.py --exam=host-2025 --section=XYZ --limit=3 --dry-run
  python pipeline/explanations/generate.py --qids mistakes.txt
  python pipeline/explanations/generate.py --all
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

import anthropic

# Allow running as a script or as a module.
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from pipeline.explanations.prompts import build_system_prompt, build_user_message  # noqa: E402
from pipeline.explanations.schema import EXPLANATION_TOOL, validate_explanation  # noqa: E402
from audit.corpus_lint.lint_entry import lint_entry, format_failures  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
PARSED_DIR = ROOT / "data" / "parsed"
EXPL_DIR = ROOT / "data" / "explanations"

DEFAULT_MODEL = "claude-sonnet-4-6"
DEFAULT_MAX_TOKENS = 8000
DEFAULT_THINKING_BUDGET = 5000

# Sonnet 4.6 pricing (USD per 1M tokens) — used for cost tracking.
# Extended-thinking tokens are billed as output. Update if pricing changes.
PRICING = {
    "claude-sonnet-4-6": {"input": 3.00, "output": 15.00},
    "claude-opus-4-7": {"input": 15.00, "output": 75.00},
    "claude-haiku-4-5-20251001": {"input": 1.00, "output": 5.00},
}


def estimate_cost(model: str, in_tok: int, out_tok: int) -> float:
    """Estimate USD cost for a single call. `out_tok` includes thinking."""
    p = PRICING.get(model)
    if p is None:
        return 0.0
    return (in_tok * p["input"] + out_tok * p["output"]) / 1_000_000


def load_questions(filters: dict) -> list[dict]:
    """Load questions matching the filter set.

    Filters honoured:
      exam: substring match against exam_id
      section: exact match against section
      qids: explicit set; overrides exam/section
      limit: post-filter cap
    """
    qids_filter: set[str] | None = filters.get("qids")
    exam_filter: str | None = filters.get("exam")
    section_filter: str | None = filters.get("section")
    limit: int | None = filters.get("limit")

    out: list[dict] = []
    paths = sorted(PARSED_DIR.glob("*.json"))
    for path in paths:
        if path.name == "_index.json":
            continue
        if exam_filter and exam_filter not in path.stem:
            continue
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            print(f"WARN: skipping unparseable {path.name}", file=sys.stderr)
            continue
        if isinstance(data, dict):
            data = data.get("questions", [])
        for q in data:
            if not isinstance(q, dict):
                continue
            if q.get("parsing_status") != "complete":
                continue
            if section_filter and q.get("section") != section_filter:
                continue
            if qids_filter is not None and q.get("qid") not in qids_filter:
                continue
            # Skip DTK until Phase C provides the figure spec.
            if q.get("section") == "DTK":
                continue
            out.append(q)

    if limit is not None:
        out = out[:limit]
    return out


def load_existing(exam_id: str) -> dict[str, dict]:
    path = EXPL_DIR / f"{exam_id}.json"
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        print(f"WARN: existing {path.name} is unparseable, starting fresh", file=sys.stderr)
        return {}


def save_exam(exam_id: str, payload: dict[str, dict]) -> None:
    path = EXPL_DIR / f"{exam_id}.json"
    path.parent.mkdir(parents=True, exist_ok=True)
    # Sort keys for stable diffs.
    text = json.dumps(payload, ensure_ascii=False, indent=2, sort_keys=True)
    path.write_text(text + "\n")


def write_index() -> None:
    """Write _index.json so the SPA can quickly tell which qids have
    explanations (without fetching every exam file)."""
    qids: list[str] = []
    for path in sorted(EXPL_DIR.glob("*.json")):
        if path.name == "_index.json":
            continue
        try:
            data = json.loads(path.read_text())
        except json.JSONDecodeError:
            continue
        qids.extend(sorted(data.keys()))
    (EXPL_DIR / "_index.json").write_text(
        json.dumps({"qids": sorted(qids), "count": len(qids)}, indent=2) + "\n"
    )


def generate_one(
    client: anthropic.Anthropic,
    question: dict,
    model: str,
    max_tokens: int,
    thinking_budget: int,
) -> tuple[dict, dict]:
    """Generate one explanation. Returns (explanation, usage_metadata)."""
    section = question["section"]
    system = build_system_prompt(section)
    user = build_user_message(question)

    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        thinking={"type": "enabled", "budget_tokens": thinking_budget},
        tools=[EXPLANATION_TOOL],
        # Forcing tool_choice with extended thinking is supported as of
        # Anthropic API 2024-11; the thinking happens BEFORE the tool call.
        tool_choice={"type": "tool", "name": "submit_explanation"},
        system=system,
        messages=[{"role": "user", "content": user}],
    )

    # The response's content blocks contain the thinking trace and
    # the forced tool_use. Find the tool_use block and extract its input.
    tool_payload: dict | None = None
    for block in resp.content:
        if getattr(block, "type", None) == "tool_use" and block.name == "submit_explanation":
            tool_payload = block.input
            break
    if tool_payload is None:
        raise RuntimeError(f"no submit_explanation tool_use in response for {question['qid']}")

    errors = validate_explanation(tool_payload)
    if errors:
        raise RuntimeError(f"schema validation failed for {question['qid']}: {errors}")

    # Wrap with metadata so we can trace which model + when generated.
    explanation = {
        **tool_payload,
        "_meta": {
            "model": model,
            "generated_at": int(time.time() * 1000),
        },
    }
    usage = {
        "input_tokens": resp.usage.input_tokens,
        "output_tokens": resp.usage.output_tokens,
        "cost_usd": estimate_cost(model, resp.usage.input_tokens, resp.usage.output_tokens),
    }
    return explanation, usage


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--exam", help="filter by exam_id substring (e.g. host-2025)")
    parser.add_argument("--section", help="filter by section (e.g. XYZ)")
    parser.add_argument("--qids", type=Path, help="file with one qid per line")
    parser.add_argument("--limit", type=int, help="cap the number of generations")
    parser.add_argument("--all", action="store_true", help="no filter — full backfill")
    parser.add_argument("--force", action="store_true", help="regenerate even if explanation exists")
    parser.add_argument("--dry-run", action="store_true", help="print what would be generated, no API calls")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"override model (default: {DEFAULT_MODEL})")
    parser.add_argument("--thinking-budget", type=int, default=DEFAULT_THINKING_BUDGET)
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS)
    parser.add_argument(
        "--lint",
        choices=("off", "warn", "strict"),
        default="warn",
        help="Swedish-quality lint mode after each generation: "
             "off (skip), warn (log + save anyway; default), "
             "strict (drop the explanation and count as error if lint fails).",
    )
    args = parser.parse_args()

    if not (args.exam or args.section or args.qids or args.all):
        parser.error("must pass at least one filter (--exam, --section, --qids, or --all)")

    # Load filter set
    qids_set: set[str] | None = None
    if args.qids:
        qids_set = {ln.strip() for ln in args.qids.read_text().splitlines() if ln.strip()}
        if not qids_set:
            print("WARN: --qids file is empty", file=sys.stderr)

    questions = load_questions({
        "exam": args.exam,
        "section": args.section,
        "qids": qids_set,
        "limit": args.limit,
    })
    if not questions:
        print("no questions matched filters", file=sys.stderr)
        return 1

    # Group by exam_id so we open each exam file once.
    by_exam: dict[str, list[dict]] = {}
    for q in questions:
        by_exam.setdefault(q["exam_id"], []).append(q)

    print(f"matched {len(questions)} questions across {len(by_exam)} exam(s)")
    if args.dry_run:
        for exam_id, qs in by_exam.items():
            existing = load_existing(exam_id) if not args.force else {}
            new = [q for q in qs if q["qid"] not in existing]
            print(f"  {exam_id}: {len(qs)} matched, {len(new)} would be generated")
            for q in new[:3]:
                print(f"    {q['qid']} ({q['section']})")
            if len(new) > 3:
                print(f"    ... and {len(new) - 3} more")
        return 0

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ERROR: ANTHROPIC_API_KEY not set", file=sys.stderr)
        return 2
    client = anthropic.Anthropic(api_key=api_key)

    total_cost = 0.0
    total_in = 0
    total_out = 0
    n_done = 0
    n_skipped = 0
    n_errors = 0
    n_lint_warn = 0
    n_lint_drop = 0

    for exam_id, qs in by_exam.items():
        existing = load_existing(exam_id)
        for q in qs:
            qid = q["qid"]
            if qid in existing and not args.force:
                n_skipped += 1
                continue
            try:
                explanation, usage = generate_one(
                    client, q, args.model, args.max_tokens, args.thinking_budget
                )
            except Exception as e:
                n_errors += 1
                print(f"  ERROR on {qid}: {e}", file=sys.stderr)
                continue

            # ── Swedish-quality lint hook ──
            lint_msg = ''
            if args.lint != "off":
                lint_result = lint_entry(explanation, qid=qid)
                if not lint_result["passed"]:
                    lint_msg = format_failures(lint_result)
                    if args.lint == "strict":
                        n_lint_drop += 1
                        # Track cost (we paid for it) but DROP the artifact.
                        total_cost += usage["cost_usd"]
                        total_in += usage["input_tokens"]
                        total_out += usage["output_tokens"]
                        print(
                            f"  ✗ {qid} DROPPED — {lint_msg} "
                            f"(${usage['cost_usd']:.4f}; running ${total_cost:.2f})",
                            file=sys.stderr,
                        )
                        continue
                    # warn mode: save anyway, log the warning
                    n_lint_warn += 1

            existing[qid] = explanation
            save_exam(exam_id, existing)
            n_done += 1
            total_cost += usage["cost_usd"]
            total_in += usage["input_tokens"]
            total_out += usage["output_tokens"]
            tail = f" — {lint_msg}" if lint_msg else ""
            print(
                f"  ✓ {qid} "
                f"({usage['input_tokens']} in / {usage['output_tokens']} out, "
                f"${usage['cost_usd']:.4f}; "
                f"running ${total_cost:.2f}){tail}"
            )

    write_index()
    print()
    print(f"== summary ==")
    print(f"  generated:  {n_done}")
    print(f"  skipped:    {n_skipped} (already exist; pass --force to regenerate)")
    print(f"  errors:     {n_errors}")
    if args.lint != "off":
        print(f"  lint warn:  {n_lint_warn} (saved with anglicism/archaic flag)")
        print(f"  lint drop:  {n_lint_drop} (dropped by --lint strict)")
    print(f"  tokens:     {total_in} in / {total_out} out")
    print(f"  total cost: ${total_cost:.2f}")
    return 0 if n_errors == 0 else 3


if __name__ == "__main__":
    sys.exit(main())
