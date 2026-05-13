"""Tool-use schema for forced structured output.

The Anthropic Messages API can be configured with `tool_choice` to
force the model to call a specific tool. We use that to constrain
the response to our `Explanation` shape — no free-form text, no
parse failures, validation by the API itself.

Phase A.6 update: structured `steps[]` walk-through is now REQUIRED
for all sections except ORD (single-step semantic lookup, doesn't
benefit from numbered cards). The schema enforces step length and
ordering so the SPA's PedagogyPanel can render numbered cards
deterministically.

See docs/explanations.md for the canonical type definition.
"""
from __future__ import annotations

EXPLANATION_TOOL = {
    "name": "submit_explanation",
    "description": (
        "Submit the structured explanation for a single HP question. "
        "All fields required except `pitfall` and `framework_id`, which "
        "may be null. `steps[]` must contain at least one entry; for "
        "ORD a single step is fine, every other section should have 3+."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "solution_path": {
                "type": "string",
                "description": (
                    "1-2 sentences. CONCISE SUMMARY — the headline of the "
                    "explanation that a student reading the closed-state "
                    "ExplanationPanel sees first. The depth lives in "
                    "`steps[]`; this is the tweet-length summary."
                ),
            },
            "steps": {
                "type": "array",
                "description": (
                    "Pedagogical walk-through, IN ORDER. Each step gets a "
                    "card in the Study Desk panel. The student is starting "
                    "from zero knowledge — assume nothing. Step 1 is "
                    "ALWAYS 'understand the problem' (restate in plain "
                    "language). The final step is ALWAYS the verdict + "
                    "why it matters. Aim for 4-7 steps in quant (XYZ / KVA "
                    "/ NOG), 2-4 in verbal (MEK / LÄS), 1-2 in ORD."
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "n": {
                            "type": "integer",
                            "minimum": 1,
                            "description": "1-indexed step ordinal.",
                        },
                        "title": {
                            "type": "string",
                            "description": (
                                "Micro-heading shown as a small-caps eyebrow "
                                "above the step body. 2-5 words. Example: "
                                "'Förstå problemet', 'Sätt upp ekvationen', "
                                "'Multiplicera ut parentesen', 'Jämför och dra "
                                "slutsats'. Never just 'Steg 1' — name the move."
                            ),
                        },
                        "text": {
                            "type": "string",
                            "description": (
                                "Step body. 1-3 sentences in Swedish (English "
                                "for ELF). Name every move and explain WHY in "
                                "the same step. Example: 'Multiplicera ut a in i "
                                "parentesen. Multiplikation betyder att gångra "
                                "varje term: a·(a+1) = a·a + a·1 = a² + a.' "
                                "Math wrapped in U+E000 / U+E001 markers."
                            ),
                        },
                    },
                    "required": ["n", "title", "text"],
                    "additionalProperties": False,
                },
                "minItems": 1,
            },
            "framework_id": {
                "type": ["string", "null"],
                "description": (
                    "Optional Layer 1 framework this question exercises. "
                    "Null for now (Phase A.6 doesn't have a curated "
                    "framework catalog yet) — leave as null."
                ),
            },
            "distractors": {
                "type": "array",
                "description": (
                    "One entry per WRONG option. Skip the correct option. "
                    "Vary the empathy opener across distractors — never reuse "
                    "the same opener twice in one explanation."
                ),
                "items": {
                    "type": "object",
                    "properties": {
                        "letter": {
                            "type": "string",
                            "description": "Option letter (A, B, C, D, or E for NOG).",
                        },
                        "why_tempting": {
                            "type": "string",
                            "description": (
                                "The believable mistake that lands here, framed "
                                "charitably (not 'the student incorrectly assumes…'). "
                                "Name the specific algebraic or reading move that "
                                "produces this wrong answer."
                            ),
                        },
                        "why_wrong": {
                            "type": "string",
                            "description": (
                                "The corrective insight in 1-2 sentences, specific "
                                "to this question's numbers / wording. Reference "
                                "the step number from `steps[]` where this would "
                                "have been caught when possible."
                            ),
                        },
                    },
                    "required": ["letter", "why_tempting", "why_wrong"],
                    "additionalProperties": False,
                },
            },
            "technique": {
                "type": "string",
                "description": (
                    "1-2 sentences naming a recurring pattern the student will "
                    "see across exams. Name the INSIGHT, not just the operation. "
                    "Example for KVA substitution: 'Substitutionsstrategin: när "
                    "du har ett villkor (b = a + 1) och två uttryck med flera "
                    "variabler, byt ut villkorets variabel överallt så att du "
                    "har en variabel kvar och kan jämföra direkt.'"
                ),
            },
            "pitfall": {
                "type": ["string", "null"],
                "description": (
                    "Optional. Emit ONLY when the trap is structurally distinct "
                    "from the technique. 1-2 sentences, naming what trips most "
                    "students up specifically on THIS question shape. Set to "
                    "null if it would just paraphrase the technique."
                ),
            },
        },
        "required": [
            "solution_path",
            "steps",
            "framework_id",
            "distractors",
            "technique",
            "pitfall",
        ],
        "additionalProperties": False,
    },
}


def validate_explanation(payload: dict) -> list[str]:
    """Return a list of validation errors (empty = OK).

    The Anthropic API enforces the JSON schema at the protocol level
    so this is a belt-and-braces check that catches edge cases.
    """
    errors: list[str] = []
    required = ("solution_path", "steps", "distractors", "technique", "pitfall")
    for field in required:
        if field not in payload:
            errors.append(f"missing field: {field}")
    if errors:
        return errors

    if not isinstance(payload["solution_path"], str) or not payload["solution_path"].strip():
        errors.append("solution_path must be a non-empty string")
    if not isinstance(payload["technique"], str) or not payload["technique"].strip():
        errors.append("technique must be a non-empty string")
    if payload["pitfall"] is not None and not isinstance(payload["pitfall"], str):
        errors.append("pitfall must be a string or null")
    framework_id = payload.get("framework_id")
    if framework_id is not None and not isinstance(framework_id, str):
        errors.append("framework_id must be a string or null")

    # steps[] validation
    steps = payload["steps"]
    if not isinstance(steps, list) or not steps:
        errors.append("steps must be a non-empty list")
    else:
        seen_n: set[int] = set()
        for i, s in enumerate(steps):
            if not isinstance(s, dict):
                errors.append(f"steps[{i}] must be an object")
                continue
            for f in ("n", "title", "text"):
                if f not in s:
                    errors.append(f"steps[{i}].{f} missing")
            if "n" in s:
                if not isinstance(s["n"], int) or s["n"] < 1:
                    errors.append(f"steps[{i}].n must be a positive integer")
                elif s["n"] in seen_n:
                    errors.append(f"steps[{i}].n={s['n']} duplicates an earlier step")
                else:
                    seen_n.add(s["n"])
            for f in ("title", "text"):
                if f in s and (not isinstance(s[f], str) or not s[f].strip()):
                    errors.append(f"steps[{i}].{f} must be a non-empty string")

    # distractors[] validation (unchanged from v1)
    if not isinstance(payload["distractors"], list):
        errors.append("distractors must be a list")
    else:
        for i, d in enumerate(payload["distractors"]):
            if not isinstance(d, dict):
                errors.append(f"distractors[{i}] must be an object")
                continue
            for f in ("letter", "why_tempting", "why_wrong"):
                if f not in d or not isinstance(d[f], str) or not d[f].strip():
                    errors.append(f"distractors[{i}].{f} missing or empty")

    return errors
