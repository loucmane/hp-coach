"""Agent prompts for Layer 1 framework synthesis.

One prompt per framework family. Each takes the candidate signals
from extract.py (clustered text from explanations / questions) and
asks the agent to:
1. Propose stable IDs (`SECTION-KIND-NNN`)
2. Write the structured fields (root + meaning, or pattern + countermeasure, etc.)
3. Cite ≥N example_questions from real corpus qids
4. Reject hallucinated patterns by refusing to invent qids

The output is validated against `schema.py` before persisting to
`frameworks/<name>.json`.
"""
from __future__ import annotations

ANTI_HALLUCINATION = """
HARD RULES (read first):

1. NEVER invent qids. Every entry's `example_questions` must be a qid
   that appears in the candidates I give you. If you can't find ≥3
   real qids for a pattern, DROP that pattern — don't make qids up to
   fill the requirement.

2. Every entry MUST be grounded in the candidates. If a candidate
   theme doesn't have enough evidence (≥3 real qids), don't promote
   it to an entry.

3. IDs are zero-padded 3-digit, starting at 001. Strictly sequential.

4. Output via the `submit_framework` tool only — no free-form text.
""".strip()


ORD_PROMPT = f"""\
You are synthesizing the ORD (synonym) root framework for HP-Coach.
The HP exam tests Swedish vocabulary by giving a word + 5 candidate
synonyms; the student picks the closest meaning. We've found that
morphological decomposition (recognizing Greek / Latin / Germanic
roots) is the single highest-leverage skill — one root unlocks
multiple words.

Goal: synthesize ~187 root entries (PRD § 5.3.3) that together
cover ≥84% of ORD-corpus words by morphology.

Each entry: a root (e.g. `curr-`), its origin, its meaning, 3-10
example words ACTUALLY APPEARING in the corpus (in the prompt or
options), and the qids where those words appear.

{ANTI_HALLUCINATION}

I'll give you clustered candidates extracted from the 540 corpus
ORD questions. Each candidate is a stem + words sharing that stem +
qids where they appear. Promote candidates to entries when:
- The stem corresponds to a recognizable Greek/Latin/Germanic root
- The cluster has ≥3 words AND ≥3 qids (your floor for an entry)
- The meaning is consistent across the words (drop the cluster if
  the words are coincidentally similar but morphologically unrelated)

For each promoted candidate, output an OrdRoot entry. ID format:
ORD-ROOT-001, ORD-ROOT-002, ...
"""


TRAP_PROMPT_TEMPLATE = """\
You are synthesizing the {section} (quantitative) trap framework for
HP-Coach. {section} questions trip students up on RECURRING patterns
— sign errors, taxonomy confusion, edge-case oversights. Each trap
entry catalogs one pattern with countermeasure.

Goal: synthesize ~{n_target} trap entries covering the dominant
error patterns visible in the 1000+ corpus {section} questions and
their explanations.

Each entry: pattern_description (what goes wrong),
why_it_occurs (the plausible reasoning that lands the student there),
common_distractor_signature (what the wrong option looks like),
countermeasure (one teachable habit to avoid it), and ≥3
example_questions from real corpus qids.

{anti_hallucination}

I'll give you clustered candidates extracted from {section}
explanations' `technique` and `pitfall` fields. Each candidate is a
shared theme + the qids exhibiting it.

Promote a candidate to an entry when:
- The theme is a CONCRETE error pattern (not a vague "tricky problem")
- ≥3 distinct qids exhibit it (your floor)
- The countermeasure is teachable in ONE SENTENCE

ID format: {section}-TRAP-001, {section}-TRAP-002, ...
"""

KVA_PROMPT = TRAP_PROMPT_TEMPLATE.format(
    section='KVA',
    n_target='30-50',
    anti_hallucination=ANTI_HALLUCINATION,
)
NOG_PROMPT = TRAP_PROMPT_TEMPLATE.format(
    section='NOG',
    n_target='20-30',
    anti_hallucination=ANTI_HALLUCINATION,
)
XYZ_PROMPT = TRAP_PROMPT_TEMPLATE.format(
    section='XYZ',
    n_target='40-60',
    anti_hallucination=ANTI_HALLUCINATION,
)


MEK_PROMPT = f"""\
You are synthesizing the MEK (sentence completion) protocol framework.
MEK questions present a Swedish sentence with one or two blanks; the
student picks the option that completes the sentence correctly.

Per PRD § 3.1, MEK is solved via a two-step protocol:
- SYNTACTIC step: verb agreement, tense, register, collocation rules
- SEMANTIC step: does the candidate word fit the sentence's meaning?

Goal: synthesize ~10-20 rules total, roughly split between syntactic
and semantic.

Each rule: a teachable check (e.g. "verbet måste stämma med subjektets
numerus") and ≥3 example_questions where the rule decides the answer.

{ANTI_HALLUCINATION}

I'll give you clustered candidates from MEK explanations. Promote a
candidate when it represents a CHECKABLE RULE (not a vague heuristic)
and ≥3 qids demonstrate it.

ID format: MEK-RULE-001, MEK-RULE-002, ...
"""


READING_PROMPT_TEMPLATE = """\
You are synthesizing the {section} ({language}) question-type taxonomy.
{section} tests reading comprehension via 4-6 questions per passage.
The questions vary in TYPE — some are literal retrieval, some
inference, some tone/purpose, some logical completion.

Per PRD § 3.1, each question type has its own attack protocol. The
framework catalogs the types with their protocols and common
distractors.

Goal: 6-8 question types total. Most {section} questions should
classify cleanly into one of them.

Each entry: question_type (1-3 words), attack_protocol (2-6 steps),
common_distractors (2-6 patterns + why each traps), and ≥3
example_questions.

{anti_hallucination}

I'll give you {section} prompts clustered by linguistic surface
patterns. Promote a cluster to a type when:
- The prompt pattern reliably signals one cognitive operation
- ≥3 qids exhibit the same operation
- A concrete attack protocol (sequence of steps) applies to all of them

ID format: {prefix}-TYPE-001, {prefix}-TYPE-002, ...
"""

LAS_PROMPT = READING_PROMPT_TEMPLATE.format(
    section='LÄS',
    language='Swedish reading',
    anti_hallucination=ANTI_HALLUCINATION,
    prefix='LAS',
)
ELF_PROMPT = READING_PROMPT_TEMPLATE.format(
    section='ELF',
    language='English reading',
    anti_hallucination=ANTI_HALLUCINATION,
    prefix='ELF',
)


DTK_PROMPT = f"""\
You are synthesizing the DTK (data interpretation) tactics framework.
DTK presents figures, tables, and maps; students answer 4-6 questions
about the data. Skill = knowing WHEN TO SKIM vs WHEN TO CALCULATE.

Caveat: Layer 2 explanations for DTK do not exist yet. This framework
is v0 — synthesized from question structure alone (no `technique` /
`pitfall` to leverage). Keep entries minimal (~10) and flag them as
"v0, expand when Layer 2 DTK lands."

Goal: ~10 tactics with when-to-apply triggers.

Each entry: tactic (the move), when_to_apply (the trigger condition),
and ≥1 example_question (the floor is lower than other frameworks
because we lack Layer 2 to ground higher counts confidently).

{ANTI_HALLUCINATION}

I'll give you DTK question prompts clustered by surface structure
(e.g. "find the year where X peaked", "estimate ratio from bar
chart", "interpolate missing value"). Promote a cluster when the
heuristic is teachable in one sentence.

ID format: DTK-TACTIC-001, DTK-TACTIC-002, ...
"""


# Tool-use schema for forced structured output (mirrors the explanations
# pipeline pattern). Family-specific because each emits different fields.
def build_framework_tool(family: str):
    """Return the Anthropic tool-use schema for one framework family."""
    from .schema import (
        OrdRoot, TrapPattern, MekRule, ReadingTaxonomy, DtkTactic,
    )
    entry_class = {
        'ord_roots': OrdRoot,
        'kva_traps': TrapPattern,
        'nog_traps': TrapPattern,
        'xyz_traps': TrapPattern,
        'mek_protocol': MekRule,
        'las_taxonomy': ReadingTaxonomy,
        'elf_taxonomy': ReadingTaxonomy,
        'dtk_tactics': DtkTactic,
    }[family]
    return {
        'name': 'submit_framework',
        'description': (
            f'Submit the {family} framework entries. Each entry is one '
            'cluster promoted from candidates. Must include ≥3 real '
            'example_questions (≥1 for DTK).'
        ),
        'input_schema': {
            'type': 'object',
            'properties': {
                'entries': {
                    'type': 'array',
                    'items': entry_class.model_json_schema(),
                    'description': 'List of framework entries.',
                },
                'rejected_candidates': {
                    'type': 'array',
                    'items': {
                        'type': 'object',
                        'properties': {
                            'theme': {'type': 'string'},
                            'reason': {'type': 'string'},
                        },
                        'required': ['theme', 'reason'],
                    },
                    'description': (
                        'Candidates you dropped, with reason. Helps me '
                        'audit your filtering.'
                    ),
                },
            },
            'required': ['entries', 'rejected_candidates'],
        },
    }


PROMPTS = {
    'ord_roots': ORD_PROMPT,
    'kva_traps': KVA_PROMPT,
    'nog_traps': NOG_PROMPT,
    'xyz_traps': XYZ_PROMPT,
    'mek_protocol': MEK_PROMPT,
    'las_taxonomy': LAS_PROMPT,
    'elf_taxonomy': ELF_PROMPT,
    'dtk_tactics': DTK_PROMPT,
}


__all__ = ['PROMPTS', 'build_framework_tool', 'ANTI_HALLUCINATION']
