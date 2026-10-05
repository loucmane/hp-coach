"""PR #370 fix round 7 (bead hpf-klv6): the [FIX-INCOMPLETE][medium] finding of
Codex exact-head review R7 (hpf-geqt, HOLD at 6fbc6d2), closed as a family.

R7: the snake token was bounded by the regex word boundary, and `_` is a word
character, so a label wrapped in Markdown emphasis (_WORLD_KNOWLEDGE_,
__WORLD_KNOWLEDGE__) was no token at all. It was the third near-variant in a
row of round 5's defect: round 5 compared labels with their underscores
intact, and in round 6 NFD letters split the token. Round 7 closes the family
rather than the spelling, against the threat model in docs/worklog/hpf-klv6.md:

  * a token is bounded by anything that is not a letter or digit, and its
    segments are separated by runs of underscores;
  * every rule also runs on the text as a learner sees it. The plain view drops
    invisible characters, undoes right-to-left overrides, folds compatibility
    characters and drops stray combining marks. The app view does the same
    after KaTeX markup is interpreted between MathText's math delimiters (the
    app's own rendering). The markup view does it after Markdown, HTML and
    KaTeX markup is interpreted everywhere. Findings are reported against the
    scanned text.

The generative tests render every label the pipeline uses through every
transform of the threat model, and through pairs and stacks of transforms, and
assert that the default lint flags each rendering. The guards (marked "guard")
pin what must not flag: maths notation, ordinary prose with emphasis, the
store's own LaTeX, cloze blanks, and GATEREF's arithmetic exemption.

Red-first: the defect tests fail on head 6fbc6d2 and the guards pass there.
docs/worklog/hpf-klv6.md has both runs. Every exotic character below is built
with chr(), so no invisible character sits in this source.
"""
from __future__ import annotations

import functools
import itertools
import json
import re
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

import pytest

TESTS = Path(__file__).resolve().parent
SCRIPTS = TESTS.parent
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(TESTS))

import lint_learner_output as lint  # noqa: E402
from test_verdict_enum_and_label_vocabulary_round5 import (  # noqa: E402
    CONTRACT_EXAMPLES, STORE_FORMULA_NAMES, label_sources)

# MathText (app/src/components/MathText.tsx) renders the text between these
# private-use delimiters with KaTeX and everything else as plain text
OPEN, CLOSE = chr(0xE000), chr(0xE001)
RLO, PDF = chr(0x202E), chr(0x202C)
BS = "\\"


def nfc(s):
    return unicodedata.normalize("NFC", s)


def nfd(s):
    return unicodedata.normalize("NFD", s)


def sentence(x):
    return nfc("Låt ") + x + nfc(" vara här.")  # rounds 5 and 6's frame


def snake_hit(text):
    return any(rule == "L2-SNAKE" for rule, _ in lint.scan_text(text))


def _run(*args):
    return subprocess.run([sys.executable, str(SCRIPTS / "lint_learner_output.py"), *map(str, args)],
                          capture_output=True, text=True)


@functools.lru_cache(maxsize=1)
def labels():
    """Every label round 5's label_sources() finds, plus every vocabulary label."""
    found = {nfc(label) for labels_ in label_sources().values() for label in labels_}
    return tuple(sorted(found | {nfc(x) for x in lint._TAXONOMY_LABELS}))


# one label per shape, for the pairwise run: ALL_CAPS caught only as a whole
# label, lower case caught by a stem, accented, digits, three and more
# segments, and labels whose segments are short
SHAPES = tuple(map(nfc, (
    "WORLD_KNOWLEDGE", "MULTIPLE_DEFENSIBLE", "tone_misread", "outside_knowledge", "scope_shift",
    "detail_as_main", "reversed_causality", "författarens_hållning", "GODKÄNN_NOTED",
    "cloze_5gap", "long_passage_5q", "short_text_1q", "role_or_attribution_swap",
    "too_literal_or_too_far", "true_but_irrelevant", "BEARER_SAME_DOMAIN")))


# ============================================ 0. the review repro (R7)
REVIEW_TOKENS = ("_WORLD_KNOWLEDGE_", "__WORLD_KNOWLEDGE__", "_" + nfd(nfc("författarens_hållning")) + "_",
                 "__" + nfd(nfc("författarens_hållning")) + "__")


@pytest.mark.parametrize("token", REVIEW_TOKENS, ids=["em", "strong", "nfd-em", "nfd-strong"])
def test_review_repro_underscore_wrapped_label_flags(token):
    # head 6fbc6d2: [] — no word boundary between `_` and the label's letter
    hits = lint.scan_text(sentence(token))
    assert [rule for rule, _ in hits] == ["L2-SNAKE"]
    assert nfc(token).strip("_") in hits[0][1]


@pytest.mark.parametrize("suffix", [".md", ".json"])
def test_review_repro_cli_exits_1(tmp_path, suffix):
    # head 6fbc6d2: "learner-output lint: clean — 1 file(s)", exit 0
    f = tmp_path / f"r7{suffix}"
    body = "Q3 bär _WORLD_KNOWLEDGE_ och __WORLD_KNOWLEDGE__."
    f.write_text(json.dumps({"s": body}, ensure_ascii=False) if suffix == ".json" else body + "\n",
                 encoding="utf-8")
    r = _run(f)
    assert r.returncode == 1, r.stdout
    assert "L2-SNAKE" in r.stdout and "_WORLD_KNOWLEDGE_" in r.stdout


# ======================================= 1. the threat model as transforms
class Spelling:
    """A label as a rendering step may write it: segments, the separators
    between them, and what comes before and after."""

    def __init__(self, label):
        self.segs = re.split("_+", label)
        self.seps = ["_"] * (len(self.segs) - 1)
        self.pre = self.post = ""

    def copy(self):
        c = Spelling.__new__(Spelling)
        c.segs, c.seps, c.pre, c.post = list(self.segs), list(self.seps), self.pre, self.post
        return c

    def text(self):
        out = [self.pre, self.segs[0]]
        for sep, seg in zip(self.seps, self.segs[1:]):
            out += [sep, seg]
        return "".join(out + [self.post])


APP, MD = "app", "md"  # MathText (plain text + KaTeX); a CommonMark/GFM renderer with raw HTML
BOTH = frozenset({APP, MD})


class T:
    """One threat-model transform. layer orders composition (1 letters,
    2 invisible characters, 3 separators and letter encodings, 4 markup inside
    the token, 5 around it). row: its row in the worklog's threat model.
    shows: the renderers that show the label clean. math: the transform writes
    math delimiters. bidi_safe: an RLO-reversed copy still renders the label (no
    markup and no direction-sensitive character). pairwise: part of the
    pairwise run (one per kind of invisible character keeps that run small)."""

    def __init__(self, layer, row, name, fn, shows=BOTH, math=False, bidi_safe=False, pairwise=True):
        self.layer, self.row, self.name, self.fn = layer, row, name, fn
        self.shows, self.math, self.bidi_safe = frozenset(shows), math, bidi_safe
        self.pairwise = pairwise

    def apply(self, sp):
        sp = sp.copy()
        self.fn(sp)
        return sp

    def __repr__(self):
        return self.name


def segwise(f):
    def fn(sp):
        sp.segs = [f(s) for s in sp.segs]
    return fn


def last(f):
    def fn(sp):
        sp.segs[-1] = f(sp.segs[-1])
    return fn


def first(f):
    def fn(sp):
        sp.segs[0] = f(sp.segs[0])
    return fn


def seps(sep):
    """Write each separator's underscore as sep (keeping what layer 2 put around it)."""
    def fn(sp):
        sp.seps = [s.replace("_", sep) for s in sp.seps]
    return fn


def wrap(pre, post):
    def fn(sp):
        sp.pre, sp.post = pre + sp.pre, sp.post + post
    return fn


def first_unit(s):
    """Length of s's first unit: an HTML character reference (layer 3 may have
    encoded the letter), or a character with the combining marks after it."""
    m = re.match(r"&#?[0-9A-Za-z]+;", s)
    if m:
        return m.end()
    n = 1
    while n < len(s) and unicodedata.category(s[n]).startswith("M"):
        n += 1
    return n


def after_first_char(ins):
    return lambda s: s[:first_unit(s)] + ins + s[first_unit(s):]


def first_letter_in(pre, post):
    return lambda s: pre + s[:first_unit(s)] + post + s[first_unit(s):]


def alternating(s):
    return "".join(c.upper() if i % 2 else c.lower() for i, c in enumerate(s))


def fullwidth(s):
    return "".join(chr(ord(c) + 0xFEE0) if c.isascii() and c.isalnum() else c for c in s)


def _styled(c, upper, lower, digit):
    if "A" <= c <= "Z":
        return chr(upper + ord(c) - 65)
    if "a" <= c <= "z":
        return chr(lower + ord(c) - 97)
    if "0" <= c <= "9" and digit is not None:
        return chr(digit(int(c)))
    return c


def math_bold(s):
    return "".join(_styled(c, 0x1D400, 0x1D41A, lambda d: 0x1D7CE + d) for c in s)


def circled(s):
    return "".join(_styled(c, 0x24B6, 0x24D0, lambda d: 0x24EA if d == 0 else 0x2460 + d - 1) for c in s)


def acute(s):
    # precomposed where Unicode has the letter (á, é, ś …), a combining mark
    # that NFC leaves alone where it has not (b, d, t …)
    return nfc("".join(c + chr(0x0301) if c.isalpha() else c for c in s))


def math_seps(sp):
    """Inside KaTeX an underscore must be written \\_ (a bare _ is a subscript)."""
    sp.seps = [s.replace("_", BS + "_") for s in sp.seps]


def math_wrap(pre, post):
    def fn(sp):
        math_seps(sp)
        sp.pre, sp.post = OPEN + pre + sp.pre, sp.post + post + CLOSE
    return fn


def math_textseg(sp):
    sp.segs = [BS + "text{" + s + "}" for s in sp.segs]
    math_seps(sp)
    sp.pre, sp.post = OPEN + sp.pre, sp.post + CLOSE


def math_braceseg(sp):
    sp.segs = ["{" + s + "}" for s in sp.segs]
    math_seps(sp)
    sp.pre, sp.post = OPEN + sp.pre, sp.post + CLOSE


def rlo(sp):
    text = sp.text()
    sp.segs, sp.seps, sp.pre, sp.post = [RLO + text[::-1] + PDF], [], "", ""


def entity_dec(c):
    return f"&#{ord(c)};"


def entity_hex(c):
    return f"&#x{ord(c):X};"


# invisible characters (general category Cf or Default_Ignorable_Code_Point),
# by name; RLO is not here: it reverses what follows (see the rlo transform)
INVISIBLE = {
    "ZWSP": 0x200B, "ZWNJ": 0x200C, "ZWJ": 0x200D, "WJ": 0x2060, "ZWNBSP": 0xFEFF, "SHY": 0x00AD,
    "MVS": 0x180E, "INVISIBLE-TIMES": 0x2062, "INVISIBLE-PLUS": 0x2064, "LRM": 0x200E, "RLM": 0x200F,
    "ALM": 0x061C, "LRE": 0x202A, "PDF": 0x202C, "LRO": 0x202D, "LRI": 0x2066, "PDI": 0x2069,
    "CGJ": 0x034F, "VS16": 0xFE0F, "VS17": 0xE0100, "TAG-SPACE": 0xE0020, "HANGUL-FILLER": 0x3164,
    "HALFWIDTH-HANGUL-FILLER": 0xFFA0, "KHMER-INHERENT-AQ": 0x17B4, "MONGOLIAN-FVS1": 0x180B,
    "MUSICAL-BEGIN-BEAM": 0x1D173, "SHORTHAND-OVERLAP": 0x1BCA0, "ARABIC-NUMBER-SIGN": 0x0600,
}
# every code point Unicode makes compatibility-equivalent to `_` (NFKC)
COMPAT_LOW_LINES = {"FULLWIDTH": 0xFF3F, "DASHED": 0xFE4D, "CENTRELINE": 0xFE4E, "WAVY": 0xFE4F,
                    "VERTICAL": 0xFE33, "VERTICAL-WAVY": 0xFE34}

TRANSFORMS = [
    # ---- layer 1: letters (threat-model rows C1, C2, C6)
    T(1, "C1", "lower", segwise(str.lower), bidi_safe=True),
    T(1, "C1", "upper", segwise(str.upper), bidi_safe=True),
    T(1, "C1", "title", segwise(str.title), bidi_safe=True),
    T(1, "C1", "swapcase", segwise(str.swapcase), bidi_safe=True),
    T(1, "C1", "alternating", segwise(alternating), bidi_safe=True),
    T(1, "C2", "acute", segwise(acute), bidi_safe=True),
    T(1, "C2", "mark-below", segwise(lambda s: "".join(c + chr(0x0347) if c.isalpha() else c for c in s)),
      bidi_safe=True),
    T(1, "C2", "enclosing-circle", segwise(after_first_char(chr(0x20DD))), bidi_safe=True),
    T(1, "C2", "nfd", segwise(nfd), bidi_safe=True),
    T(1, "C6", "fullwidth-letters", segwise(fullwidth), bidi_safe=True),
    T(1, "C6", "math-bold", segwise(math_bold), bidi_safe=True),
    T(1, "C6", "circled", segwise(circled), bidi_safe=True),
    # ---- layer 3: separators and letter encodings (C3, C6, M5, H3, K1, K3)
    T(3, "C3", "sep-double", seps("__"), bidi_safe=True),
    T(3, "C3", "sep-triple", seps("___"), bidi_safe=True),
    *(T(3, "C6", f"sep-{name.lower()}-low-line", seps(chr(cp)), bidi_safe=True)
      for name, cp in COMPAT_LOW_LINES.items()),
    T(3, "M5", "sep-escaped", seps(BS + "_"), shows={MD}),
    T(3, "H3", "sep-entity-dec", seps("&#95;"), shows={MD}),
    T(3, "H3", "sep-entity-dec-zeros", seps("&#0095;"), shows={MD}),
    T(3, "H3", "sep-entity-hex", seps("&#x5F;"), shows={MD}),
    T(3, "H3", "sep-entity-hex-upper", seps("&#X5f;"), shows={MD}),
    T(3, "H3", "sep-entity-lowbar", seps("&lowbar;"), shows={MD}),
    T(3, "H3", "sep-entity-UnderBar", seps("&UnderBar;"), shows={MD}),
    T(3, "H1", "sep-in-span", seps("<span>_</span>"), shows={MD}),
    T(3, "K1", "sep-math-escaped", seps(OPEN + BS + "_" + CLOSE), shows={APP}, math=True),
    T(3, "K3", "sep-math-textunderscore", seps(OPEN + BS + "textunderscore" + CLOSE), shows={APP}, math=True),
    T(3, "H3", "letter-entity-dec", segwise(lambda s: entity_dec(s[0]) + s[1:]), shows={MD}),
    T(3, "H3", "letter-entity-hex", segwise(lambda s: entity_hex(s[0]) + s[1:]), shows={MD}),
    # ---- layer 4: markup inside the token (M2, M3, M4, M6, H1, H2, K2, K4)
    T(4, "M2", "em-star-each", segwise(lambda s: f"*{s}*"), shows={MD}),
    T(4, "M2", "strong-star-last", last(lambda s: f"**{s}**"), shows={MD}),
    T(4, "M2", "strong-star-first-letter", first(first_letter_in("**", "**")), shows={MD}),
    T(4, "M2", "em-underscore-each", segwise(lambda s: f"_{s}_"), shows={MD}),
    T(4, "M2", "strong-underscore-last", last(lambda s: f"__{s}__"), shows={MD}),
    T(4, "M3", "strike-last", last(lambda s: f"~~{s}~~"), shows={MD}),
    T(4, "M3", "strike-single-first", first(lambda s: f"~{s}~"), shows={MD}),
    T(4, "M4", "code-last", last(lambda s: f"`{s}`"), shows={MD}),
    T(4, "M6", "link-first", first(lambda s: f"[{s}](https://exempel.se/a)"), shows={MD}),
    T(4, "M6", "link-titled-first", first(lambda s: f'[{s}](https://exempel.se/a "titel")'), shows={MD}),
    T(4, "M6", "link-angle-first", first(lambda s: f"[{s}](<https://exempel.se/a b>)"), shows={MD}),
    T(4, "M6", "link-reference-first", first(lambda s: f"[{s}][1]"), shows={MD}),
    T(4, "H1", "tag-last", last(lambda s: f"<em>{s}</em>"), shows={MD}),
    T(4, "H1", "tag-first-letter", first(first_letter_in("<b>", "</b>")), shows={MD}),
    T(4, "H1", "wbr-each", segwise(after_first_char("<wbr>")), shows={MD}),
    T(4, "H1", "empty-span-last", last(after_first_char('<span class="x"></span>')), shows={MD}),
    T(4, "H2", "comment-last", last(after_first_char("<!-- -->")), shows={MD}),
    T(4, "H2", "cdata-last", last(after_first_char("<![CDATA[]]>")), shows={MD}),
    T(4, "H3", "entity-shy-each", segwise(after_first_char("&shy;")), shows={MD}),
    T(4, "H3", "entity-shy-legacy-each", segwise(after_first_char("&shy")), shows={MD}),
    T(4, "H3", "entity-zwsp-dec-each", segwise(after_first_char("&#8203;")), shows={MD}),
    T(4, "H3", "entity-ZeroWidthSpace-each", segwise(after_first_char("&ZeroWidthSpace;")), shows={MD}),
    T(4, "K2", "math-text-last", last(lambda s: OPEN + BS + "text{" + s + "}" + CLOSE), shows={APP}, math=True),
    T(4, "K4", "math-empty-each", segwise(after_first_char(OPEN + CLOSE)), shows={APP}, math=True),
    # ---- layer 5: around the token (C5, C7, M1, M3, M4, M6, H1, H2, K2)
    *(T(5, "M1", f"md-{name}", wrap(pre, post)) for name, pre, post in (
        ("em-star", "*", "*"), ("strong-star", "**", "**"), ("strong-em-star", "***", "***"),
        ("em-underscore", "_", "_"), ("strong-underscore", "__", "__"), ("triple-underscore", "___", "___"),
        ("em-strong-mixed", "_**", "**_"), ("strong-em-mixed", "**_", "_**"))),
    T(5, "M3", "md-strike", wrap("~~", "~~")),
    T(5, "M3", "md-strike-single", wrap("~", "~")),
    T(5, "M4", "md-code", wrap("`", "`")),
    T(5, "M4", "md-code-double", wrap("`` ", " ``")),
    T(5, "M6", "md-link", wrap("[", "](https://exempel.se)")),
    T(5, "M6", "md-link-reference", wrap("[", "][1]")),
    T(5, "M6", "md-image-alt", wrap("![", "](bild.png)")),
    T(5, "H1", "html-em", wrap("<em>", "</em>")),
    T(5, "H1", "html-code", wrap("<code>", "</code>")),
    T(5, "H1", "html-span-attr", wrap('<span class="etikett" title="x">', "</span>")),
    T(5, "H1", "html-nested", wrap("<b><i>", "</i></b>")),
    T(5, "H2", "html-comments-around", wrap("<!-- a -->", "<!-- b -->")),
    *(T(5, "K2", f"math-{name}", math_wrap(pre, post), shows={APP}, math=True) for name, pre, post in (
        ("bare", "", ""), ("text", BS + "text{", "}"), ("mathrm", BS + "mathrm{", "}"),
        ("texttt", BS + "texttt{", "}"), ("textit", BS + "textit{", "}"), ("textbf", BS + "textbf{", "}"),
        ("operatorname", BS + "operatorname{", "}"), ("mathit", BS + "mathit{", "}"),
        ("underline", BS + "underline{", "}"), ("boxed-text", BS + "boxed{" + BS + "text{", "}}"),
        ("textcolor", BS + "textcolor{red}{", "}"), ("color", BS + "color{blue}", ""),
        ("colorbox", BS + "colorbox{yellow}{", "}"), ("braced", "{", "}"))),
    T(5, "K2", "math-text-each-segment", math_textseg, shows={APP}, math=True),
    T(5, "K2", "math-brace-each-segment", math_braceseg, shows={APP}, math=True),
    # MathText shows Markdown and HTML as they stand, so a label inside a link
    # target, a tag or a comment is on screen there; paired with a part written
    # in KaTeX (layers 3 and 4), only the app view assembles it
    *(T(5, "A1", f"app-literal-{name}", wrap(pre, post), shows={APP}) for name, pre, post in (
        ("link-target", "[se här](", ")"), ("tag", "<x ", ">"), ("comment", "<!-- ", " -->"),
        ("reference", "[se här][", "]"))),
    *(T(5, "C5", f"adjacent-{name}", wrap(pre, post)) for name, pre, post in (
        ("parens", "(", ")"), ("double-quotes", '"', '"'), ("single-quotes", "'", "'"),
        ("guillemets", chr(0xAB), chr(0xBB)), ("low-high-quotes", chr(0x201E), chr(0x201C)),
        ("genitive-colon", "", ":s"), ("compound-hyphen", "", nfc("-fällan")), ("slashes", "/", "/"),
        ("period", "", "."), ("comma", "", ","), ("digit-before", "2", ""), ("digit-after", "", "2"),
        ("letter-before", "x", ""), ("letter-after", "", "s"), ("underscore-before", "_", ""),
        ("underscore-after", "", "_"), ("math-delimiters-after", "", OPEN + CLOSE),
        ("math-delimiters-before", OPEN + CLOSE, ""), ("hash", "#", ""), ("at", "@", ""),
        ("ellipsis", "", chr(0x2026)), ("dashes", chr(0x2014), chr(0x2014)),
        ("newlines", "\n", "\n"), ("nbsp", chr(0xA0), chr(0xA0)))),
    T(5, "C7", "rlo-reversed", rlo),
]
# layer 2: every invisible character, inside each segment and around each separator
_DIRECTIONAL = ("LRE", "PDF", "LRO", "LRI", "PDI", "RLM", "ALM")
_PAIRWISE_INVISIBLE = ("ZWSP", "SHY", "WJ", "ZWNBSP", "CGJ", "VS16", "TAG-SPACE", "HANGUL-FILLER")
for _name, _cp in INVISIBLE.items():
    TRANSFORMS.append(T(2, "C4", f"invisible-{_name}-inside", segwise(after_first_char(chr(_cp))),
                        bidi_safe=_name not in _DIRECTIONAL, pairwise=_name in _PAIRWISE_INVISIBLE))

    def _around(sp, ch=chr(_cp)):
        sp.seps = [ch + s + ch for s in sp.seps]
    TRANSFORMS.append(T(2, "C4", f"invisible-{_name}-around-separator", _around,
                        bidi_safe=_name not in _DIRECTIONAL, pairwise=_name in _PAIRWISE_INVISIBLE))
TRANSFORMS.sort(key=lambda t: t.layer)
BY_NAME = {t.name: t for t in TRANSFORMS}
assert len(BY_NAME) == len(TRANSFORMS), "duplicate transform name"


def render(label, *transforms):
    sp = Spelling(label)
    for t in sorted(transforms, key=lambda t: t.layer):
        sp = t.apply(sp)
    return sp.text()


def compatible(*transforms):
    """Some renderer shows the composition clean (see T)."""
    if len({t.layer for t in transforms}) != len(transforms):
        return False
    if sum(t.math for t in transforms) > 1:
        return False                      # nested math delimiters
    shows = functools.reduce(frozenset.__and__, (t.shows for t in transforms))
    if not shows:
        return False
    rev = [t for t in transforms if t.name == "rlo-reversed"]
    return not rev or all(t.bidi_safe for t in transforms if t not in rev)


def _misses(pairs):
    """[(label, transforms, text)] the default lint does not flag."""
    return [(label, ts, text) for label, ts in pairs
            for text in [sentence(render(label, *ts))] if not snake_hit(text)]


def _report(misses, limit=12):
    lines = [f"  {label!r} via {list(ts)}: {ascii(text)}" for label, ts, text in misses[:limit]]
    more = f"\n  … and {len(misses) - limit} more" if len(misses) > limit else ""
    return f"{len(misses)} rendering(s) the default lint does not flag:\n" + "\n".join(lines) + more


@pytest.mark.parametrize("transform", TRANSFORMS, ids=lambda t: f"{t.layer}-{t.name}")
def test_every_label_flags_under_every_transform(transform):
    # each transform of the threat model, applied to every label the pipeline
    # uses (label_sources()) and every vocabulary label
    misses = _misses((label, (transform,)) for label in labels())
    assert not misses, _report(misses)


LAYER_PAIRS = list(itertools.combinations(sorted({t.layer for t in TRANSFORMS}), 2))


@pytest.mark.parametrize("layers", LAYER_PAIRS, ids=lambda p: f"layers-{p[0]}x{p[1]}")
def test_pairwise_transforms_flag(layers):
    # every compatible pair of transforms from two layers, on one label per shape
    a = [t for t in TRANSFORMS if t.layer == layers[0] and t.pairwise]
    b = [t for t in TRANSFORMS if t.layer == layers[1] and t.pairwise]
    pairs = [(x, y) for x, y in itertools.product(a, b) if compatible(x, y)]
    assert pairs
    misses = _misses((label, pair) for pair in pairs for label in SHAPES)
    assert not misses, _report(misses)


STACKS = [
    ("upper", "invisible-ZWSP-inside", "sep-escaped", "strong-star-last", "md-em-underscore"),
    ("title", "invisible-SHY-inside", "sep-entity-hex", "tag-last", "md-link"),
    ("fullwidth-letters", "invisible-WJ-around-separator", "sep-fullwidth-low-line", "math-text-last",
     "adjacent-parens"),
    ("alternating", "invisible-VS16-inside", "sep-math-escaped", "md-strong-star"),
    ("nfd", "invisible-CGJ-inside", "sep-double", "strike-last", "html-code"),
    ("math-bold", "invisible-ZWNJ-around-separator", "sep-wavy-low-line", "rlo-reversed"),
    ("circled", "invisible-HANGUL-FILLER-inside", "math-text"),
    ("acute", "invisible-TAG-SPACE-inside", "sep-entity-lowbar", "comment-last", "md-strike"),
]


@pytest.mark.parametrize("stack", STACKS, ids=lambda s: "+".join(s))
def test_every_label_flags_under_a_stack_of_transforms(stack):
    ts = tuple(BY_NAME[n] for n in stack)
    assert compatible(*ts)
    misses = _misses((label, ts) for label in labels())
    assert not misses, _report(misses)


# ------------------------------------------------ generated from Unicode
def _every_codepoint(pred):
    return [cp for cp in range(0x110000) if not 0xD800 <= cp <= 0xDFFF and pred(chr(cp))]


def test_every_format_character_inside_a_label_is_invisible_to_the_lint():
    # every code point of general category Cf in the running Python's Unicode
    # database, plus the Default_Ignorable code points outside Cf, named. RLO
    # is left out: it reverses everything after it (rlo-reversed covers it).
    cps = _every_codepoint(lambda c: unicodedata.category(c) == "Cf")
    cps += [ord(unicodedata.lookup(n)) for n in (
        "COMBINING GRAPHEME JOINER", "HANGUL FILLER", "HANGUL CHOSEONG FILLER", "HANGUL JUNGSEONG FILLER",
        "HALFWIDTH HANGUL FILLER", "KHMER VOWEL INHERENT AQ", "KHMER VOWEL INHERENT AA",
        "MONGOLIAN FREE VARIATION SELECTOR ONE", "MONGOLIAN FREE VARIATION SELECTOR FOUR",
        "VARIATION SELECTOR-1", "VARIATION SELECTOR-16", "VARIATION SELECTOR-17", "VARIATION SELECTOR-256")]
    assert len(cps) > 170
    misses = [f"U+{cp:04X}" for cp in cps if cp != 0x202E
              for label in ("WORLD_KNOWLEDGE", "tone_misread")
              if not snake_hit(sentence(label[:3] + chr(cp) + label[3:7] + chr(cp) + label[7:]))]
    assert not misses, misses


def test_every_compatibility_low_line_separates_like_an_underscore():
    cps = _every_codepoint(lambda c: c != "_" and unicodedata.normalize("NFKC", c) == "_")
    assert sorted(cps) == sorted(COMPAT_LOW_LINES.values())
    misses = [(label, f"U+{cp:04X}") for cp in cps for label in labels()
              if not snake_hit(sentence(label.replace("_", chr(cp))))]
    assert not misses, misses[:20]


def test_every_combining_mark_of_the_diacritic_blocks_inside_a_label():
    blocks = [(0x0300, 0x036F), (0x0483, 0x0489), (0x1AB0, 0x1AFF), (0x1DC0, 0x1DFF), (0x20D0, 0x20FF),
              (0xFE20, 0xFE2F)]
    cps = [cp for a, b in blocks for cp in range(a, b + 1) if unicodedata.category(chr(cp)).startswith("M")]
    assert len(cps) == 263
    misses = [f"U+{cp:04X}" for cp in cps if not snake_hit(sentence("WORLD_KN" + chr(cp) + "OWLEDGE"))]
    assert not misses, misses


# ------------------------------------------------ end to end, the CLI
CLI_LABELS = tuple(map(nfc, ("WORLD_KNOWLEDGE", "författarens_hållning", "cloze_5gap")))


def test_cli_flags_every_single_rendering_in_one_json_file(tmp_path):
    values = [sentence(render(label, t)) for t in TRANSFORMS for label in CLI_LABELS]
    f = tmp_path / "every.json"
    f.write_text(json.dumps({f"s{i}": v for i, v in enumerate(values)}, ensure_ascii=True), encoding="utf-8")
    r = _run(f)
    assert r.returncode == 1
    assert sum(line.startswith("L2-SNAKE ") for line in r.stdout.splitlines()) == len(values), r.stdout[-3000:]


def test_cli_flags_every_single_rendering_in_md_files(tmp_path):
    files = []
    for i, t in enumerate(TRANSFORMS):
        f = tmp_path / f"t{i:03d}.md"
        f.write_text("# Förklaring\n\n" + sentence(render("WORLD_KNOWLEDGE", t)) + "\n", encoding="utf-8")
        files.append(f)
    r = _run(*files)
    assert r.returncode == 1
    flagged = {line.split()[1].rsplit(":", 2)[0] for line in r.stdout.splitlines() if line.startswith("L2-SNAKE ")}
    missed = [t.name for t, f in zip(TRANSFORMS, files) if str(f) not in flagged]
    assert not missed, missed


# ============================== 2. findings point at the scanned text
VIEW_CASES = [
    (sentence("**WORLD**" + BS + "_KNOWLEDGE"), "WORLD**" + BS + "_KNOWLEDGE"),
    (sentence("WORLD_KNOW" + chr(0x200B) + "LEDGE"), "WORLD_KNOW" + chr(0x200B) + "LEDGE"),
    (sentence("WORLD&#95;KNOWLEDGE"), "WORLD&#95;KNOWLEDGE"),
    (sentence(OPEN + BS + "text{tone" + BS + "_misread}" + CLOSE), "tone" + BS + "_misread"),
    (sentence(RLO + "EGDELWONK_DLROW" + PDF), "EGDELWONK_DLROW"),
    (sentence("WORLD" + chr(0xFF3F) + "KNOWLEDGE"), "WORLD" + chr(0xFF3F) + "KNOWLEDGE"),
    (sentence("[se](WORLD" + OPEN + BS + "_" + CLOSE + "KNOWLEDGE)"),
     "WORLD" + OPEN + BS + "_" + CLOSE + "KNOWLEDGE"),
    (sentence("<x tone" + OPEN + BS + "textunderscore" + CLOSE + "misread>"),
     "tone" + OPEN + BS + "textunderscore" + CLOSE + "misread"),
]


@pytest.mark.parametrize("text,span", VIEW_CASES,
                         ids=["markdown", "zero-width", "entity", "katex", "rlo", "fullwidth-low-line",
                              "app-link-target", "app-tag"])
def test_a_rendered_hit_reports_the_original_span_and_excerpt(text, span):
    hits = lint.scan_text(text)
    assert [rule for rule, _ in hits] == ["L2-SNAKE"]
    assert hits[0][1] == text                    # the whole sentence is within 30 characters
    m = lint.SNAKE.search(text)
    assert m.group(0) == span and text[m.start():m.end()] == span


def test_cli_shows_invisible_code_points_instead_of_printing_them(tmp_path):
    # the excerpt and the JSON path are printed with each invisible character
    # as <U+XXXX>: the line shows where it sits, and an RLO cannot reorder it
    f = tmp_path / "hidden.json"
    f.write_text(json.dumps({"a": sentence("WORLD_KNOW" + chr(0x200B) + "LEDGE"),
                             "b": sentence(RLO + "EGDELWONK_DLROW" + PDF),
                             "c": sentence("WORLD_KNOW" + chr(0xAD) + "LEDGE"),
                             "steg" + RLO + "x": sentence("tone_misread")}), encoding="utf-8")
    r = _run(f)
    assert r.returncode == 1
    assert "<U+200B>" in r.stdout and "<U+202E>" in r.stdout and "<U+202C>" in r.stdout and "<U+00AD>" in r.stdout
    assert ":$.steg<U+202E>x: " in r.stdout
    assert not [c for c in r.stdout if unicodedata.category(c) == "Cf"]


# added for the fix: unterminated markup keeps the markup view linear, and
# a label after it that only the markup view shows still flags
@pytest.mark.parametrize("opener", ["<!--", "<![CDATA[", "<?", "](", '](x "', "<a ", "&#", BS + "color{"])
def test_unterminated_markup_scans_in_linear_time(opener):
    text = opener * 20000 + " WORLD" + BS + "_KNOWLEDGE"
    t = time.perf_counter()
    hits = lint.scan_text(text)
    assert time.perf_counter() - t < 5
    assert [rule for rule, _ in hits] == ["L2-SNAKE"]


def test_strict_mode_reports_a_rendered_label_before_style_debt(monkeypatch):
    # head 6fbc6d2: värde_B, the tier-2 fallback, hides the label after it
    monkeypatch.setattr(lint.SNAKE, "strict", True)
    text = nfc("Sätt värde_B = 2; se WORLD") + BS + "_KNOWLEDGE."
    assert lint.SNAKE.search(text).group(0) == "WORLD" + BS + "_KNOWLEDGE"


# ===================================== 3. the other rules, same layer
OTHER_RULES = [
    ("L2-HEDGAT", "Svaret var _hedgat_ i sak."),
    ("L2-HEDGAT", "Svaret var __hedgning__ i sak."),
    ("L2-HEDGAT", "Svaret var hedg" + chr(0xAD) + "at i sak."),
    ("L2-HEDGAT", "Svaret var hedg&#97;t i sak."),
    ("L2-HEDGAT", "Svaret var " + OPEN + BS + "text{hed}" + BS + "text{gat}" + CLOSE + " i sak."),
    ("L2-GATEREF", "Se __G-STEM__ för domen."),
    ("L2-GATEREF", "Enligt _M-FORM_ är det fel."),
    ("L2-GATEREF", "Se G-ST" + chr(0x200B) + "EM för domen."),
    ("L2-GATEREF", "Se G&#45;STEM för domen."),
    ("L2-GATEREF", "Se G-<b>STEM</b> för domen."),
    ("L2-GATEREF", "The round" + chr(0xA0) + "2 version of this paragraph."),
]


@pytest.mark.parametrize("rule,text", OTHER_RULES, ids=[f"{r}-{i}" for i, (r, _) in enumerate(OTHER_RULES)])
def test_hedgat_and_gateref_hold_on_the_rendered_text(rule, text):
    # head 6fbc6d2: none of these flag — `_` blocks the word boundary, or the
    # word only exists once the markup or invisible character is gone
    assert [r for r, _ in lint.scan_text(text)] == [rule]


# ======================================================= 4. guards
WRAPPED_MATH = [name for name in CONTRACT_EXAMPLES + STORE_FORMULA_NAMES]


# guard (green on head): maths notation never flags in default mode, under
# every transform of the threat model and every stack above
def test_math_notation_never_flags_in_default_mode_under_any_transform():
    flagged = []
    for name in WRAPPED_MATH:
        for ts in [(t,) for t in TRANSFORMS] + [tuple(BY_NAME[n] for n in s) for s in STACKS]:
            text = nfc("Sätt ") + render(name, *ts) + nfc(" = 2 och räkna vidare.")
            if lint.scan_text(text):
                flagged.append((name, ts, ascii(text)))
    assert not flagged, flagged[:20]


PROSE = tuple(map(nfc, (
    "Det är *inte* samma sak som i stycke två.",
    "Ordet _scope_ betyder räckvidd, och **shift** betyder skifte.",
    "A *shift* in tone is __not__ the same as a *swap* of roles.",
    "*Tempting*, men fel: _causal_ samband saknas i texten.",
    "Han ~~tvekade~~ var säker, skriver författaren.",
    "Tryck på `shift` och välj sedan **Svar:** B.",
    "Se <em>scope</em> och <b>shift</b> i ordlistan.",
    "_world_ _knowledge_ är två ord, inte ett.",
    "Ett [skifte](https://exempel.se/skifte) i berättelsen, se [1].",
    "Svaret är __B__ — **inte** C.",
    "The *world*-*knowledge* trap is a distractor in prose.",
    "Jämför *v*_*r* och *a*_*n* i formeln.",
    "Kvoten är " + OPEN + BS + "frac{a}{2}" + BS + "cdot" + BS + "frac{b}{2}" + CLOSE + ".",
    "Volymen " + OPEN + "V_{" + BS + "text{ny}}=" + BS + "frac{V_{" + BS + "text{gammal}}}{8}" + CLOSE + ".",
    "Vinklarna " + OPEN + BS + "theta_{1}+" + BS + "theta_{2}+" + BS + "theta_{3}=180" + BS + "degree" + CLOSE + ".",
    "Summan " + OPEN + "10^{11} = 100" + BS + ",000" + BS + ",000" + BS + ",000" + CLOSE + " kr.",
    "Färgerna {svart, vit, blå} och 1{,}91 cm.",
    "R&D-avdelningen och AT&T, se &amp; och &lt;b&gt;.",
)))


# guard (green on head): ordinary prose with emphasis and the store's own
# LaTeX never flag, in either mode
@pytest.mark.parametrize("text", PROSE, ids=[f"prose-{i}" for i in range(len(PROSE))])
def test_prose_with_emphasis_and_store_latex_never_flags(text, monkeypatch):
    assert lint.scan_text(text) == []
    monkeypatch.setattr(lint.SNAKE, "strict", True)
    assert lint.scan_text(text) == []


CLOZE = tuple(map(nfc, (
    "Gap 31 sits in 'it begins with very 31_____ symptoms.'",
    "men det är SVÅRT att upprätta ____ över den förhistoriska tiden",
    "identifiera ev. \"inte X, utan ____\"-strukturen innan du väljer ord.",
    "Luckan (___) står före verbet; jämför ___ och ____.",
)))


# guard (green on head): cloze blanks are not tokens, in either mode
@pytest.mark.parametrize("text", CLOZE, ids=[f"cloze-{i}" for i in range(len(CLOZE))])
def test_cloze_blanks_are_not_tokens(text, monkeypatch):
    assert lint.scan_text(text) == []
    monkeypatch.setattr(lint.SNAKE, "strict", True)
    assert lint.scan_text(text) == []


GATEREF_EXEMPT = tuple(map(nfc, (
    "Två linjer på y = kx + m-form. Jämför lutningarna.",
    "Två linjer på " + OPEN + "y = kx + m" + CLOSE + "-form. Jämför lutningarna.",
    "Skriv linjen på *k*-*m*-form.",
    "Skriv linjen på k-m-form, alltså " + OPEN + "y = kx + m" + CLOSE + ".",
    "Volym-formeln och cylindervolym-formeln.",
)))


# guard (green on head): GATEREF's arithmetic exemption holds on the
# rendered text as on the raw text
@pytest.mark.parametrize("text", GATEREF_EXEMPT, ids=[f"exempt-{i}" for i in range(len(GATEREF_EXEMPT))])
def test_gateref_arithmetic_exemption_holds_in_the_rendered_view(text):
    assert lint.scan_text(text) == []


# guard (green on head): tier 2 judges the stored spelling. A LaTeX subscript
# is correct notation, not formula-name style debt, and stays unflagged with
# --strict, while a plain formula name still flags.
def test_strict_style_debt_is_judged_on_the_stored_spelling(monkeypatch):
    monkeypatch.setattr(lint.SNAKE, "strict", True)
    latex = nfc("Volymen ") + OPEN + "V_{" + BS + "text{gammal}}" + CLOSE + nfc(" och ") + OPEN + "t_{" + BS + "text{låg}}" + CLOSE + "."
    assert lint.scan_text(nfc(latex)) == []
    plain = nfc("Sätt värde_B = 2.")
    assert [r for r, _ in lint.scan_text(plain)] == ["L2-SNAKE"]
