"""One-shot diagnostic — figure out *why* the 137 non-DTK questions end up
parsing_status=answer_only. Instruments parse_quant._parse_one_question
without modifying it.

Approach: monkey-patch `_looks_garbled` and `_MAX_OPTION_LEN` to capture
the verdict path for every question the parser visits, then re-run
parse_xyz / parse_kva / parse_nog on the PDFs whose qids are filtered.

Output: counts of which filter trips most + 10 sample failures per
section so we can decide whether the digit-only rule, the
≥2-option-garbled rule, or the option-length cap is the over-eager one.

Usage:
    python3 audit/_diagnose_filter.py
"""
from __future__ import annotations

import json
from collections import Counter, defaultdict
from pathlib import Path

import fitz

import parser.parse_quant as PQ
from parser.parse_quant import parse_xyz, parse_kva, parse_nog
from parser.build import qid


ROOT = Path(__file__).resolve().parents[1]


# ── Wrap _looks_garbled to record verdicts per call ──────────────────
_garbled_calls: dict[str, list[tuple[str, str, bool]]] = defaultdict(list)
_active_qid: list[str] = []  # one-element stack used as a label

original_looks_garbled = PQ._looks_garbled


def looks_garbled_traced(text):
    verdict = original_looks_garbled(text)
    if _active_qid:
        _garbled_calls[_active_qid[0]].append(('check', text[:80], verdict))
    return verdict


PQ._looks_garbled = looks_garbled_traced


# ── Wrap _parse_one_question to label each call with its qid ─────────
original_parse_one = PQ._parse_one_question

# (qid_int) → (gate_label, sample_text)
_filter_verdicts: dict[int, tuple[str, str]] = {}


def parse_one_traced(num: int, qlines):
    """Re-run the parse + record which gate trips when result is None."""
    _active_qid.append(f'#{num}')
    try:
        # Replay the inner gating logic (cribbed from parse_quant)
        prompt_parts: list[str] = []
        options: list[dict] = []
        current_letter = None
        current_buf: list[str] = []
        from parser.parse_quant import OPT_HEAD_RE, _MAX_OPTION_LEN

        def flush_option():
            nonlocal current_letter, current_buf
            if current_letter is None:
                return
            text = ' '.join(s.strip() for s in current_buf if s.strip()).strip()
            options.append({'letter': current_letter, 'text': text})
            current_letter = None
            current_buf = []

        for ln in qlines or []:
            text = ln['text']
            m = OPT_HEAD_RE.match(text)
            if m:
                flush_option()
                current_letter = m.group(1)
                rest = text[m.end():].strip()
                current_buf = [rest] if rest else []
                continue
            if current_letter is not None:
                current_buf.append(text)
            else:
                prompt_parts.append(text)
        flush_option()

        prompt = ' '.join(p.strip() for p in prompt_parts if p.strip()).strip()
        result = original_parse_one(num, qlines)

        if result is None:
            # Diagnose which gate
            if not prompt or not options:
                _filter_verdicts[num] = ('empty_prompt_or_options',
                                         f'p={len(prompt)} o={len(options)}')
            elif original_looks_garbled(prompt):
                _filter_verdicts[num] = ('A_prompt_garbled', prompt[:80])
            elif any(len(o['text']) > _MAX_OPTION_LEN for o in options):
                long_o = next(o for o in options if len(o['text']) > _MAX_OPTION_LEN)
                _filter_verdicts[num] = (
                    'B_option_too_long',
                    f"{long_o['letter']}={len(long_o['text'])}ch — {long_o['text'][:60]}",
                )
            elif sum(1 for o in options if original_looks_garbled(o['text'])) > 1:
                garbled = [o['text'][:30] for o in options if original_looks_garbled(o['text'])]
                _filter_verdicts[num] = ('C_two+_garbled_options',
                                         f"{len(garbled)} garbled: {garbled}")
            else:
                _filter_verdicts[num] = ('other', prompt[:80])
        return result
    finally:
        _active_qid.pop()


PQ._parse_one_question = parse_one_traced


# ── Reload kept-canonical references in parse_xyz/parse_kva/parse_nog
# (they imported the original symbols at module load) ─────────────────
import parser.parse_quant as _PQ  # noqa
_PQ._looks_garbled = looks_garbled_traced
_PQ._parse_one_question = parse_one_traced


def find_quant_pages(doc, section):
    from parser.parse_quant import find_quant_section_pages
    return find_quant_section_pages(doc, section)


SECTION_FN = {'XYZ': parse_xyz, 'KVA': parse_kva, 'NOG': parse_nog}


def diagnose_exam(exam_id: str, pdf_dir: Path):
    by_section_filtered: dict[str, list[tuple[str, str, str]]] = defaultdict(list)

    for provpass, pdf_name in (('kvant1', 'kvant1.pdf'), ('kvant2', 'kvant2.pdf')):
        pdf_path = pdf_dir / pdf_name
        if not pdf_path.exists():
            continue
        doc = fitz.open(str(pdf_path))
        try:
            for section, fn in SECTION_FN.items():
                pages = find_quant_pages(doc, section)
                if not pages:
                    continue
                _filter_verdicts.clear()
                parsed_numbers = set()
                for q in fn(pages):
                    parsed_numbers.add(q['number'])

                from parser.build import SECTION_RANGES
                rng = next((r for s, r in SECTION_RANGES[provpass] if s == section), None)
                if rng is None:
                    continue
                for n in rng:
                    if n not in parsed_numbers:
                        qid_str = qid(exam_id, provpass, section, n)
                        gate, sample = _filter_verdicts.get(n, ('unattempted', ''))
                        by_section_filtered[section].append((qid_str, gate, sample))
        finally:
            doc.close()

    return by_section_filtered


def main():
    pdf_root = ROOT / 'data' / 'pdfs'

    # Iterate every exam dir
    all_filtered = defaultdict(list)
    for exam_dir in sorted(pdf_root.iterdir()):
        if not exam_dir.is_dir():
            continue
        if exam_dir.name.startswith('_'):
            continue
        result = diagnose_exam(exam_dir.name, exam_dir)
        for sec, qids in result.items():
            all_filtered[sec].extend(qids)

    print('━' * 60)
    print('Non-DTK filtered qids — by gate')
    print('━' * 60)
    total = 0
    gate_counter = Counter()
    for sec in sorted(all_filtered):
        gates = Counter(g for _, g, _ in all_filtered[sec])
        total += sum(gates.values())
        print(f'  {sec}: {sum(gates.values()):>3}')
        for gate, n in gates.most_common():
            print(f'      {gate:<32} {n:>3}')
            gate_counter[gate] += n
    print('━' * 60)
    print(f'  TOTAL: {total}')
    print()
    print('━' * 60)
    print('Sample failures by gate (3 per gate)')
    print('━' * 60)
    by_gate = defaultdict(list)
    for sec in all_filtered:
        for qid_str, gate, sample in all_filtered[sec]:
            by_gate[gate].append((qid_str, sample))
    for gate in sorted(by_gate):
        print(f'\n[{gate}]')
        for qid_str, sample in by_gate[gate][:3]:
            print(f'  {qid_str}')
            print(f'    → {sample}')


if __name__ == '__main__':
    main()
