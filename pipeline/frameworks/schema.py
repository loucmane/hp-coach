"""Schemas for Layer 1 framework JSONs.

One file per section, each holding a list of typed entries with stable
IDs. The scheduler reads these to identify clusters; the regen
pipeline writes Layer 1 IDs into mistakes table; the SPA renders them
in adaptive-review screens.

Five distinct entry shapes:
- OrdRoot          (ORD: Greek/Latin/Germanic word roots)
- TrapPattern      (KVA / NOG / XYZ: error patterns)
- MekRule          (MEK: syntactic + semantic protocol rules)
- ReadingTaxonomy  (LÄS / ELF: question-type taxonomy)
- DtkTactic        (DTK: heuristic tactics)

ID conventions (PRD § 5.1.6, frozen on first authoring):
- `ORD-ROOT-{NNN}`  e.g. ORD-ROOT-001 = curr-
- `KVA-TRAP-{NNN}`  e.g. KVA-TRAP-001 = "missed variable can be negative"
- `NOG-TRAP-{NNN}`
- `XYZ-TRAP-{NNN}`
- `MEK-RULE-{NNN}`
- `LAS-TYPE-{NNN}`  (LÄS — ASCII fold for filesystem safety)
- `ELF-TYPE-{NNN}`
- `DTK-TACTIC-{NNN}`

IDs are append-only. Adding a new entry appends; never renumber.
"""
from __future__ import annotations

from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints


# Stable-ID pattern: SECTION-KIND-NNN where NNN is 3-digit zero-padded
QID_RX = r'^[a-z0-9_-]+-(?:XYZ|KVA|NOG|DTK|ORD|LÄS|MEK|ELF)-\d+$'
ID_RX_BY_FAMILY = {
    'ord_roots': r'^ORD-ROOT-\d{3}$',
    'kva_traps': r'^KVA-TRAP-\d{3}$',
    'nog_traps': r'^NOG-TRAP-\d{3}$',
    'xyz_traps': r'^XYZ-TRAP-\d{3}$',
    'mek_protocol': r'^MEK-RULE-\d{3}$',
    'las_taxonomy': r'^LAS-TYPE-\d{3}$',
    'elf_taxonomy': r'^ELF-TYPE-\d{3}$',
    'dtk_tactics': r'^DTK-TACTIC-\d{3}$',
}


def _qid(field_name: str) -> Annotated[str, StringConstraints]:
    return Annotated[
        str,
        StringConstraints(pattern=QID_RX, strip_whitespace=True),
    ]


QID = Annotated[str, StringConstraints(pattern=QID_RX, strip_whitespace=True)]


# ── ORD: roots ────────────────────────────────────────────────────────

class OrdRoot(BaseModel):
    """One Greek / Latin / Germanic root with example HP-corpus words."""

    id: Annotated[str, StringConstraints(pattern=r'^ORD-ROOT-\d{3}$')]
    root: Annotated[str, StringConstraints(min_length=1, max_length=20)]
    origin: Literal['Latin', 'Greek', 'Germanic', 'Old Norse', 'French',
                    'Other', 'Unknown']
    meaning: Annotated[str, StringConstraints(min_length=2, max_length=120)]
    example_words: Annotated[list[str], Field(min_length=3, max_length=10)]
    example_questions: Annotated[list[QID], Field(min_length=1, max_length=10)]
    corpus_frequency: Annotated[int, Field(ge=0)] = Field(
        description='Number of corpus questions where a word built on '
                    'this root appears in the prompt or options.'
    )
    notes: str | None = None


# ── KVA / NOG / XYZ: trap patterns ────────────────────────────────────

class TrapPattern(BaseModel):
    """A specific error pattern with diagnosis + countermeasure."""

    id: Annotated[str, StringConstraints(pattern=r'^(KVA|NOG|XYZ)-TRAP-\d{3}$')]
    pattern_description: Annotated[str, StringConstraints(min_length=10, max_length=200)]
    why_it_occurs: Annotated[str, StringConstraints(min_length=10, max_length=300)]
    common_distractor_signature: Annotated[
        str, StringConstraints(min_length=5, max_length=200)
    ] = Field(
        description='What the wrong option(s) look like when a student '
                    'falls into this trap.'
    )
    countermeasure: Annotated[str, StringConstraints(min_length=10, max_length=300)] = Field(
        description='One concrete habit / check / formula a student '
                    'applies to dodge this trap. Should be teachable in '
                    'one sentence.'
    )
    example_questions: Annotated[list[QID], Field(min_length=3, max_length=15)]
    notes: str | None = None


# ── MEK: protocol rules ───────────────────────────────────────────────

class MekRule(BaseModel):
    """A syntactic or semantic rule from the two-step MEK protocol."""

    id: Annotated[str, StringConstraints(pattern=r'^MEK-RULE-\d{3}$')]
    constraint_type: Literal['syntactic', 'semantic']
    rule: Annotated[str, StringConstraints(min_length=10, max_length=200)] = Field(
        description='Concrete check the student applies. E.g. "verb '
                    'agreement: subject and verb must agree in number".'
    )
    example_questions: Annotated[list[QID], Field(min_length=3, max_length=15)]
    notes: str | None = None


# ── LÄS / ELF: reading taxonomy ───────────────────────────────────────

class ReadingDistractor(BaseModel):
    pattern: Annotated[str, StringConstraints(min_length=5, max_length=120)]
    why_it_traps: Annotated[str, StringConstraints(min_length=10, max_length=200)]


class ReadingTaxonomy(BaseModel):
    """One question type in LÄS / ELF with attack protocol."""

    id: Annotated[str, StringConstraints(pattern=r'^(LAS|ELF)-TYPE-\d{3}$')]
    question_type: Annotated[str, StringConstraints(min_length=3, max_length=60)] = Field(
        description='E.g. "literal retrieval", "tone / purpose", '
                    '"inference", "logical completion".'
    )
    attack_protocol: Annotated[list[str], Field(min_length=2, max_length=8)] = Field(
        description='Ordered steps a student applies for this question '
                    'type. Each step is a single concrete action.'
    )
    common_distractors: Annotated[list[ReadingDistractor], Field(min_length=2, max_length=6)]
    example_questions: Annotated[list[QID], Field(min_length=3, max_length=15)]
    notes: str | None = None


# ── DTK: tactics ──────────────────────────────────────────────────────

class DtkTactic(BaseModel):
    """A heuristic tactic for DTK (data-interpretation) questions."""

    id: Annotated[str, StringConstraints(pattern=r'^DTK-TACTIC-\d{3}$')]
    tactic: Annotated[str, StringConstraints(min_length=10, max_length=200)]
    when_to_apply: Annotated[str, StringConstraints(min_length=10, max_length=200)]
    example_questions: Annotated[list[QID], Field(min_length=1, max_length=15)] = Field(
        description='Fewer required than other frameworks because Layer '
                    '2 explanations for DTK do not exist yet.'
    )
    notes: str | None = None


# ── Top-level container per file ──────────────────────────────────────

class Framework(BaseModel):
    """The full content of one `frameworks/<name>.json` file."""

    section: Literal['ORD', 'KVA', 'NOG', 'XYZ', 'MEK', 'LÄS', 'ELF', 'DTK']
    family: str  # one of the keys in ID_RX_BY_FAMILY
    version: int = 1
    authored_at: str  # ISO date
    notes: str | None = None
    entries: list  # union of the entry types above; validated by family-specific loader


def validate_framework_file(path: str, family: str) -> Framework:
    """Load and validate a framework file by name. Returns the parsed
    Framework, raising on malformed input.
    """
    import json
    import re

    with open(path) as f:
        data = json.load(f)

    fw = Framework.model_validate(data)
    if fw.family != family:
        raise ValueError(
            f'family mismatch: file is {fw.family!r}, expected {family!r}'
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

    id_pattern = ID_RX_BY_FAMILY[family]
    seen_ids = set()
    for i, entry in enumerate(fw.entries):
        parsed = entry_class.model_validate(entry)
        if not re.match(id_pattern, parsed.id):
            raise ValueError(
                f'entry {i}: id {parsed.id!r} does not match pattern '
                f'{id_pattern}'
            )
        if parsed.id in seen_ids:
            raise ValueError(f'duplicate id: {parsed.id}')
        seen_ids.add(parsed.id)
        # Replace the raw dict with the validated model — caller can
        # iterate `fw.entries` and get typed objects.
        fw.entries[i] = parsed

    return fw


__all__ = [
    'Framework',
    'OrdRoot',
    'TrapPattern',
    'MekRule',
    'ReadingTaxonomy',
    'ReadingDistractor',
    'DtkTactic',
    'ID_RX_BY_FAMILY',
    'validate_framework_file',
]
