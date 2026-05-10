"""Tool-use schema for forced structured output.

The Anthropic Messages API can be configured with `tool_choice` to
force the model to call a specific tool. We use that to constrain
the response to our `Explanation` shape — no free-form text, no
parse failures, validation by the API itself.

See docs/explanations.md for the canonical type definition.
"""
from __future__ import annotations

EXPLANATION_TOOL = {
    "name": "submit_explanation",
    "description": (
        "Submit the structured explanation for a single HP question. "
        "Every field is required except `pitfall`, which may be null "
        "when there is no trap structurally distinct from the technique."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "solution_path": {
                "type": "string",
                "description": (
                    "2-4 sentences. INSIGHT-FIRST: the first sentence states "
                    "the single thing the student needed to know to get this "
                    "right (not the setup or methodology). Remaining sentences "
                    "carry the work / reasoning / passage citation."
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
                                "charitably (not 'the student incorrectly assumes…')."
                            ),
                        },
                        "why_wrong": {
                            "type": "string",
                            "description": (
                                "The corrective insight in one sentence, specific "
                                "to this question's numbers / wording."
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
                    "ONE sentence naming a recurring pattern the student will "
                    "see across exams. Name the INSIGHT, not the operation."
                ),
            },
            "pitfall": {
                "type": ["string", "null"],
                "description": (
                    "Optional. Emit ONLY when the trap is structurally distinct "
                    "from the technique. Set to null if it would just paraphrase "
                    "the technique."
                ),
            },
        },
        "required": ["solution_path", "distractors", "technique", "pitfall"],
        "additionalProperties": False,
    },
}


def validate_explanation(payload: dict) -> list[str]:
    """Return a list of validation errors (empty = OK).

    The Anthropic API enforces the JSON schema at the protocol level
    so this is a belt-and-braces check that catches edge cases
    (e.g. a future SDK regression). Errors here block the write.
    """
    errors: list[str] = []
    for field in ("solution_path", "distractors", "technique", "pitfall"):
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

    # Sanity: opener variation. Soft check — log a warning rather
    # than block the write, since the prompt already enforces this.
    return errors
