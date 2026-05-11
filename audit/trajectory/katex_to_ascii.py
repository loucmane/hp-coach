"""
Render `\\ue000…\\ue001`-wrapped KaTeX strings as ASCII math so the
trajectory-simulation agent sees roughly what a real student sees
on screen (a rendered fraction, not raw markup).

The SPA uses katex.renderToString to display these in the browser.
The trajectory brief is plain text — feeding raw KaTeX leaks math
notation into the persona's "no KaTeX literacy" rejection.

Scope: minimal, only the patterns that actually appear in the corpus.
Validates against a regex-match audit after running.
"""
import re


PUA_OPEN = ''
PUA_CLOSE = ''


def _frac(m):
    return f'({m.group(1)})/({m.group(2)})'


def _sqrt(m):
    return f'sqrt({m.group(1)})'


def _superscript(m):
    return f'^({m.group(1)})'


def _subscript(m):
    return f'_({m.group(1)})'


# STRUCTURAL rules — peel `\frac{X}{Y}`, `\sqrt{X}`, `^{X}`, `_{X}` from
# innermost-out. Inner-only regex (`[^{}]*`) means each pass peels one
# level; we iterate until stable.
STRUCTURAL = [
    (re.compile(r'\\frac\{([^{}]*)\}\{([^{}]*)\}'), _frac),
    (re.compile(r'\\sqrt\{([^{}]*)\}'), _sqrt),
    (re.compile(r'\^\{([^{}]*)\}'), _superscript),
    (re.compile(r'_\{([^{}]*)\}'), _subscript),
]

# SYMBOL rules — single-token Unicode substitutions, no braces involved.
SYMBOLS = [
    # `\left(` and `\right)` are size-modifier wrappers — strip cleanly so
    # they don't leak through the catch-all as "left " / "right ".
    (re.compile(r'\\left\s*\('), '('),
    (re.compile(r'\\right\s*\)'), ')'),
    (re.compile(r'\\left\s*\['), '['),
    (re.compile(r'\\right\s*\]'), ']'),
    (re.compile(r'\\left\s*\|'), '|'),
    (re.compile(r'\\right\s*\|'), '|'),
    (re.compile(r'\\cdot'), '·'),
    (re.compile(r'\\times'), '×'),
    (re.compile(r'\\div'), '÷'),
    (re.compile(r'\\pi'), 'π'),
    (re.compile(r'\\geq'), '≥'),
    (re.compile(r'\\leq'), '≤'),
    (re.compile(r'\\neq'), '≠'),
    (re.compile(r'\\approx'), '≈'),
    (re.compile(r'\\infty'), '∞'),
    (re.compile(r'\\angle'), '∠'),
    (re.compile(r'\\degree'), '°'),
    (re.compile(r'\\sin'), 'sin'),
    (re.compile(r'\\cos'), 'cos'),
    (re.compile(r'\\tan'), 'tan'),
    (re.compile(r'\\log'), 'log'),
    (re.compile(r'\\ln'), 'ln'),
]

# CLEANUP rules — run ONCE after structural+symbol passes converge.
# Catch-all backslash-commands and stray braces — these MUST run last
# or they'd destroy structural patterns before they can match.
CLEANUP = [
    (re.compile(r'\\([a-zA-Z]+)\s*'), r'\1 '),
    (re.compile(r'\{([^{}]*)\}'), r'\1'),
]


def katex_to_ascii(text: str) -> str:
    """Strip PUA markers and convert KaTeX inside to ASCII math.

    Peels structural patterns innermost-out (handles nested \\sqrt{\\frac{...}{...}}),
    then substitutes symbol tokens, then runs catch-all cleanup once.
    """
    if not isinstance(text, str):
        return text

    def replace_span(match):
        inner = match.group(1)
        # Peel structural patterns until stable
        for _ in range(8):
            new = inner
            for rx, repl in STRUCTURAL:
                new = rx.sub(repl, new)
            if new == inner:
                break
            inner = new
        # Symbol substitutions
        for rx, repl in SYMBOLS:
            inner = rx.sub(repl, inner)
        # Final cleanup: any leftover backslash-commands or braces
        for rx, repl in CLEANUP:
            inner = rx.sub(repl, inner)
        return inner

    span_rx = re.compile(re.escape(PUA_OPEN) + r'(.*?)' + re.escape(PUA_CLOSE))
    rendered = span_rx.sub(replace_span, text)
    return rendered.replace(PUA_OPEN, '').replace(PUA_CLOSE, '')


if __name__ == '__main__':
    samples = [
        '\\frac{1}{3} + \\frac{2}{5}',
        'x^{5}',
        '\\sqrt{2} + \\frac{1}{2}',
        '\\frac{27-18+15-7}{81}=\\frac{17}{81}',
    ]
    for s in samples:
        print(f'IN : {s!r}')
        print(f'OUT: {katex_to_ascii(s)!r}')
        print()
