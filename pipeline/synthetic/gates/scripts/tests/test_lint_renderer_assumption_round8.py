"""PR #370 fix round 8 (bead hpf-4xvy): the Layer-2 threat model, aligned with
the app's actual learner renderer (operator decision 2026-10-05, option A).
Fix round 9 (bead hpf-dhjn) closes MathText's KaTeX fallback. Fix round 10
(bead hpf-sn6u) makes a behavioural Vitest guard the authority for MathText
and leaves this file a tripwire.

The app shows every learner string through MathText
(app/src/components/MathText.tsx): as React text, character for character,
except the segments between U+E000 and the next U+E001, which KaTeX typesets.
When KaTeX throws instead of rendering a parse error itself, the segment is
shown as React text as well (round 9). Nothing in app/ renders Markdown or
HTML, so a learner sees markup as the characters it is made of. The literal
text and the KaTeX path (the scanned text, the plain view and the app view)
are therefore the real exposure. The markup view, which interprets Markdown
and HTML everywhere, stays as defense in depth: best effort, not a complete
model of CommonMark.

1. The renderer assumption. Its authority is the behavioural guard
   "MathText HTML-sink guard" in app/src/components/MathText.test.tsx, which
   CI's app job runs. It renders hostile markup through every MathText path
   and checks that KaTeX's output is the only HTML inserted and that segment
   and prose text are text nodes. Codex review R10 (hpf-xg9u) showed why a
   check of the source cannot be the authority: round 9's pin passed
   `html: katex.renderToString(…) + latex`, which makes markup in a segment
   live. What this file checks is a tripwire, and passing it proves nothing
   about what reaches the HTML sink. It fails with "learner renderer changed
   — revisit the Layer-2 threat model in LAYER2-RENDERING.md" when
   app/package.json declares a Markdown or HTML renderer; when MathText.tsx
   is gone, or changes its delimiters, its number of dangerouslySetInnerHTML
   or its KaTeX options, or, heuristically, how its sink's html is written;
   and when the guard's tests are no longer in the Vitest file. The checkers
   also run on mutants of the files they read, so one that stops detecting
   fails as well.
2. The inputs of Codex review R8 (hpf-vqbz, HOLD at 9d1fd11), with siblings of
   the same mechanisms: valid CommonMark that a Markdown renderer shows as
   WORLD_KNOWLEDGE and the markup view does not model. MathText shows each as
   its markup, a visibly different string. They are strict xfails: the gap is
   recorded, and a fix that closes one fails until the record is moved.
3. A segment KaTeX throws on (round 9): MathText shows it as literal text,
   and the lint reads a label in it from the scanned text.

Red-first, and the CommonMark check of the R8 inputs (markdown-it-py), are in
docs/worklog/hpf-4xvy.md; round 9's red-first is in docs/worklog/hpf-dhjn.md;
round 10's mutation proof of the guard is in docs/worklog/hpf-sn6u.md.
Every exotic character below is built with chr().
"""
from __future__ import annotations

import json
import re
import sys
import unicodedata
from pathlib import Path

import pytest

TESTS = Path(__file__).resolve().parent
SCRIPTS = TESTS.parent
REPO = SCRIPTS.parents[3]                      # gates/scripts -> the repository root
sys.path.insert(0, str(SCRIPTS))

import lint_learner_output as lint  # noqa: E402

PACKAGE_JSON = REPO / "app/package.json"
MATHTEXT = REPO / "app/src/components/MathText.tsx"
CONTRACT = REPO / "pipeline/synthetic/LAYER2-RENDERING.md"
CHANGED = "learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md"
BS = "\\"
# The authority for MathText's guarantee (round 10): the behavioural Vitest
# guard, which CI's app job runs. Its describe block and its test titles, as
# the test file spells them; this file only checks that they are still there.
GUARD = REPO / "app/src/components/MathText.test.tsx"
GUARD_SUITE = "MathText HTML-sink guard"
GUARD_TESTS = (
    "KaTeX renders a math segment: only its output is HTML — %s",
    "KaTeX throws on a math segment: it is a text node — %s",
    "prose without math: the string is a text node — %s",
    "prose beside math: each prose segment is a text node — %s",
)
AUTHORITY = ("this check is a tripwire; the authority for what reaches MathText's HTML sink is the "
             f'behavioural Vitest guard "{GUARD_SUITE}" in app/src/components/MathText.test.tsx')


# ============================================ 1. the renderer assumption
# ---- app/package.json declares no Markdown or HTML renderer
# A tripwire on package names, not a census: the bead's list (react-markdown,
# markdown-it, marked, remark*, rehype*, micromark, mdx), other Markdown
# renderers, and libraries that turn an HTML string into elements. A scoped
# name is tested on its scope and on its name. What MathText renders is the
# behavioural guard's to check (GUARD).
_RENDERER_NAME = re.compile(
    r"markdown|mdx|commonmark|showdown|snarkdown"
    r"|(?:^|-)marked(?:$|-)|(?:^|-)(?:remark|rehype|micromark)"
    r"|^(?:html-react-parser|react-html-parser|html-to-react)$")
DEPENDENCY_FIELDS = ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies")


def markup_renderers(package: dict) -> list[str]:
    """Each declared dependency that renders Markdown or HTML, as "field: name"."""
    return [f"{field}: {name}" for field in DEPENDENCY_FIELDS for name in package.get(field) or {}
            if any(_RENDERER_NAME.search(part.lstrip("@")) for part in name.lower().split("/"))]


def test_app_declares_no_markdown_or_html_renderer():
    found = markup_renderers(json.loads(PACKAGE_JSON.read_text(encoding="utf-8")))
    assert not found, f"{CHANGED} (app/package.json declares {', '.join(found)})"


# ---- MathText.tsx: a tripwire on its source (round 10)
# Coarse: the delimiters the lint's app view assumes, exactly one
# dangerouslySetInnerHTML, and KaTeX with throwOnError: false. Heuristic: how
# the sink's html is written (below). A regex reads how the source is
# written, not what reaches the sink, so none of this is the authority: Codex
# review R10's `html: katex.renderToString(…) + latex` passes it all (recorded
# below as a strict xfail). The behavioural guard (GUARD) catches it.
def _code(src: str) -> str:
    """TSX without its comments. String and template literals are kept whole,
    and a backslash escapes the next character, so neither starts a comment."""
    out, i = [], 0
    while i < len(src):
        c = src[i]
        if c in "'\"`":
            j = i + 1
            while j < len(src) and src[j] != c:
                j += 2 if src[j] == BS else 1
            out.append(src[i:j + 1])
            i = j + 1
        elif c == BS:
            out.append(src[i:i + 2])
            i += 2
        elif src.startswith("//", i):
            end = src.find("\n", i)
            i = len(src) if end == -1 else end
        elif src.startswith("/*", i):
            end = src.find("*/", i + 2)
            i = len(src) if end == -1 else end + 2
            out.append(" ")
        else:
            out.append(c)
            i += 1
    return "".join(out)


# a JS string literal may spell a code point as a unicode escape, braced or not
_JS_ESCAPE = re.compile(re.escape(BS) + "u" + r"(?:\{([0-9A-Fa-f]{1,6})\}|([0-9A-Fa-f]{4}))")
_DELIMITER = re.compile(r"\bconst\s+(MATH_OPEN|MATH_CLOSE)\s*=\s*(['\"])(.*?)\2")
_SINK = re.compile(r"\bdangerouslySetInnerHTML\b")
_KATEX_CALL = re.compile(r"\bkatex\.renderToString\(")
_THROW_OPTION = re.compile(r"\bthrowOnError\s*:\s*(\w+)")
# Heuristic, how the sink's html is written: the one sink takes the html field
# of a renderMath result, by name, and katex.renderToString( is the only value
# an html key is written with. A key follows {, a comma or ; (an object or a
# type member); types may declare it; a shorthand, a computed key or an
# assignment counts as another write. It trips on the plain rewrites (the
# segment as the field, a second writer, a sink that reads something else) and
# misses the rest: whatever follows `katex.renderToString(` is not read.
_KATEX_SINK = re.compile(
    r"\bdangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(\w+)\.html\s*,?\s*\}\s*\}")
_RENDERED = re.compile(r"\bconst\s+(\w+)\s*=\s*renderMath\(")
_HTML_KEY = re.compile(r"[{,;]\s*html\s*\??\s*:")
_HTML_FROM_KATEX = re.compile(r"[{,;]\s*html\s*:\s*katex\.renderToString\(")
_HTML_TYPE = re.compile(r"[{,;]\s*html\s*\??\s*:\s*string\b")
_HTML_OTHER_WRITE = re.compile(
    r"[{,]\s*html\s*[,}]"                          # shorthand { html }
    r"|\[\s*(['\"`])html\1\s*\]"                   # computed ['html']
    r"|\.html\s*(?:\+|\?\?|\|\||&&)?=(?![=>])")    # assignment .html = …


def _js_value(body: str) -> str:
    return _JS_ESCAPE.sub(lambda m: chr(int(m.group(1) or m.group(2), 16)), body)


def mathtext_problems(src: str) -> list[str]:
    """What trips the tripwire in MathText.tsx's source; empty when nothing does.
    Empty proves nothing about what reaches the HTML sink: the behavioural
    Vitest guard (GUARD) is the authority for that."""
    code = _code(src)
    problems = []
    delimiters = {m.group(1): _js_value(m.group(3)) for m in _DELIMITER.finditer(code)}
    if delimiters != {"MATH_OPEN": lint._MATH_OPEN, "MATH_CLOSE": lint._MATH_CLOSE}:
        problems.append("its math delimiters are no longer U+E000 and U+E001, the lint's app view")
    sinks = len(_SINK.findall(code))
    if sinks != 1:
        problems.append(f"{sinks} dangerouslySetInnerHTML, where MathText has exactly one, for KaTeX's output")
    if not _KATEX_CALL.search(code) or set(_THROW_OPTION.findall(code)) != {"false"}:
        problems.append("renderMath no longer calls katex.renderToString with throwOnError: false, "
                        "which keeps a parse error in KaTeX's own escaped rendering")
    katex_sink = _KATEX_SINK.search(code)
    if (not katex_sink or katex_sink.group(1) not in _RENDERED.findall(code)
            or len(_HTML_FROM_KATEX.findall(code)) != 1 or _HTML_OTHER_WRITE.search(code)
            or len(_HTML_KEY.findall(code)) != 1 + len(_HTML_TYPE.findall(code))):
        problems.append("heuristic: the sink is no longer written {{ __html: math.html }} with "
                        "const math = renderMath(…), and html: katex.renderToString( as the only "
                        "html key written")
    return problems


def test_mathtext_source_tripwire():
    assert MATHTEXT.is_file(), f"{CHANGED} (app/src/components/MathText.tsx is gone; {AUTHORITY})"
    problems = mathtext_problems(MATHTEXT.read_text(encoding="utf-8"))
    assert not problems, f"{CHANGED} (app/src/components/MathText.tsx: {'; '.join(problems)}; {AUTHORITY})"


# ---- the behavioural guard is still in the Vitest file (round 10)
# Each title is a string literal outside comments, and nothing in the file
# switches a test off or inverts it. A test the file no longer runs is a guard
# that no longer guards.
_VITEST_OFF = re.compile(r"\.(?:skip|todo|fails|skipIf|runIf)\b")


def guard_problems(src: str) -> list[str]:
    """How the Vitest file no longer holds the behavioural guard; empty when it does."""
    code = _code(src)
    problems = [f"no {title!r}" for title in (GUARD_SUITE, *GUARD_TESTS)
                if not any(q + title + q in code for q in "'\"`")]
    off = sorted(set(_VITEST_OFF.findall(code)))
    if off:
        problems.append(f"{', '.join(off)} switches a test off or inverts it")
    return problems


def test_the_behavioural_guard_is_still_in_the_vitest_file():
    where = "app/src/components/MathText.test.tsx"
    assert GUARD.is_file(), f"{CHANGED} ({where} is gone, and with it the behavioural guard)"
    problems = guard_problems(GUARD.read_text(encoding="utf-8"))
    assert not problems, (f"{CHANGED} ({where} no longer holds the behavioural guard, the authority for "
                          f"MathText's HTML sink: {'; '.join(problems)})")


def test_the_pin_and_the_contract_name_each_other():
    # the failure message sends the reader to the contract, and the contract
    # names this file as the tripwire of its renderer assumption and the
    # behavioural guard, with each of its tests, as its authority
    assert "LAYER2-RENDERING.md" in CHANGED
    contract = CONTRACT.read_text(encoding="utf-8")
    assert Path(__file__).name in contract
    for name in (GUARD_SUITE, *(title.removesuffix(" — %s") for title in GUARD_TESTS)):
        assert name in contract, f"LAYER2-RENDERING.md does not name the behavioural guard's {name!r}"


# ---- the checks detect what they check
RENDERER_PACKAGES = (
    "react-markdown", "markdown-it", "markdown-it-katex", "marked", "marked-react", "@types/marked",
    "remark", "remark-gfm", "remarkable", "rehype-raw", "rehype-katex", "micromark",
    "micromark-extension-gfm", "@mdx-js/react", "@mdx-js/rollup", "markdown-to-jsx", "showdown",
    "commonmark", "html-react-parser")
OTHER_PACKAGES = ("katex", "react-katex", "@remix-run/react", "mark.js", "recharts", "@base-ui/react")


@pytest.mark.parametrize("name", RENDERER_PACKAGES)
def test_the_package_pin_flags_a_renderer_in_every_dependency_field(name):
    for field in DEPENDENCY_FIELDS:
        package = {"dependencies": {"react": "19", "katex": "^0.16.45", "react-katex": "^3.1.0"},
                   "devDependencies": {"vitest": "^4.1.5"}}
        package.setdefault(field, {})[name] = "^1.0.0"
        assert markup_renderers(package) == [f"{field}: {name}"]


@pytest.mark.parametrize("name", OTHER_PACKAGES)
def test_the_package_pin_leaves_other_packages_alone(name):
    assert markup_renderers({"dependencies": {name: "^1.0.0"}}) == []


_TEXT_SPAN = "<span key={idx}>{seg.text}</span>"
_FAST = "return <>{children}</>"
_FALLBACK = "return { text: latex }"
_SINK_HTML = "__html: math.html"
# [(anchor in today's MathText.tsx, its replacement), …]. Round 10 dropped the
# mutants that only the prose's source shape gave away (a <Markdown> text
# branch or fast path, swapped branches): what prose renders as is the
# behavioural guard's to check, and a Markdown library trips the package check.
MATHTEXT_MUTANTS = {
    "text-branch-raw-html": [(_TEXT_SPAN, "<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />")],
    "fast-path-raw-html": [(_FAST, "return <span dangerouslySetInnerHTML={{ __html: children }} />")],
    "math-branch-raw-text": [(_SINK_HTML, "__html: latex")],
    "katex-throws-into-the-fallback": [("throwOnError: false", "throwOnError: true")],
    "dollar-delimiter": [("'" + chr(0xE000) + "'", "'$'")],
    # round 9: segment text reaching the sink, through the fallback or otherwise.
    # The first is R9's own shape: the catch hands back the raw segment, and
    # the sink takes whatever renderMath returns.
    "r9-raw-segment-into-the-sink": [(_FALLBACK, "return latex"), (_SINK_HTML, "__html: renderMath(latex)")],
    "fallback-as-html": [(_FALLBACK, "return { html: latex }")],
    "fallback-into-a-second-sink": [("{math.text}", "<span dangerouslySetInnerHTML={{ __html: math.text }} />")],
    "sink-takes-the-fallback": [(_SINK_HTML, "__html: 'html' in math ? math.html : math.text")],
    "html-not-only-katex": [("html: katex.renderToString(",
                             "html: latex.length > 4096 ? latex : katex.renderToString(")],
}
# changes that must not trip the tripwire
MATHTEXT_COSMETIC = {
    "a-comment-naming-the-sink": [(
        "export function MathText",
        "// never dangerouslySetInnerHTML={{ __html: seg.text }} for text\n/* nor\n"
        "dangerouslySetInnerHTML */\nexport function MathText")],
    "escaped-delimiters": [("'" + chr(0xE000) + "'", "'" + BS + "uE000'")],
    "braced-escape-delimiter": [("'" + chr(0xE001) + "'", "'" + BS + "u{E001}'")],
    "reformatted-text-branch": [(_TEXT_SPAN, "<span key={idx}>\n            { seg.text }\n          </span>")],
    # round 9
    "catch-binding-and-logging": [("} catch {", "} catch (error) {\n    console.warn('KaTeX threw', error)")],
    "renamed-result": [("const math = renderMath(latex)", "const rendered = renderMath(latex)"),
                       ("'html' in math", "'html' in rendered"), (_SINK_HTML, "__html: rendered.html"),
                       ("{math.text}", "{rendered.text}")],
    "inline-result-type": [("): RenderedMath {", "): { html: string } | { text: string } {")],
    "reformatted-sink": [("{{ " + _SINK_HTML + " }}", "{{\n        " + _SINK_HTML + ",\n      }}")],
}


def _apply(src: str, name: str, changes) -> str:
    """src with each (anchor, replacement) applied; a None replacement cuts the
    file at the anchor. A missing anchor fails outright (pytest.fail, not an
    AssertionError, so a strict xfail cannot absorb it)."""
    for anchor, replacement in changes:
        if src.count(anchor) != 1:
            pytest.fail(f"{CHANGED} ({name} no longer holds this self-test's anchor {anchor!r} once: "
                        f"re-check the assumption, then move the anchor)")
        src = src.partition(anchor)[0] if replacement is None else src.replace(anchor, replacement)
    return src


def _mutated(changes) -> str:
    """Today's MathText.tsx with each (anchor, replacement) applied. A self-test
    needs a base that passes the tripwire: when the file itself trips it,
    test_mathtext_source_tripwire fails, and the self-tests skip rather than
    fail a second time without its reason."""
    src = MATHTEXT.read_text(encoding="utf-8")
    if mathtext_problems(src):
        pytest.skip(f"{CHANGED} (MathText.tsx already trips the tripwire, see test_mathtext_source_tripwire)")
    return _apply(src, "MathText.tsx", changes)


@pytest.mark.parametrize("mutant", MATHTEXT_MUTANTS)
def test_the_mathtext_tripwire_flags_a_renderer_change(mutant):
    assert mathtext_problems(_mutated(MATHTEXT_MUTANTS[mutant]))


@pytest.mark.parametrize("change", MATHTEXT_COSMETIC)
def test_the_mathtext_tripwire_ignores_a_cosmetic_change(change):
    assert mathtext_problems(_mutated(MATHTEXT_COSMETIC[change])) == []


# Codex review R10 (hpf-xg9u): KaTeX's output with the raw segment appended,
# which makes markup in a segment live. The source keeps every shape the
# tripwire reads, so the tripwire passes it; the behavioural guard fails it
# (docs/worklog/hpf-sn6u.md, mutation i). A strict xfail, like the R8 record
# below: the gap is on record, and if the tripwire learns this one shape, the
# record has to move. The guard stays the authority either way.
R10_MUTANT = [("      }),\n    }\n  } catch {", "      }) + latex,\n    }\n  } catch {")]


@pytest.mark.xfail(strict=True, raises=AssertionError,
                   reason="a tripwire, not a proof: only the behavioural guard catches R10's mutation")
def test_the_mathtext_tripwire_flags_codex_r10s_mutation():
    assert mathtext_problems(_mutated(R10_MUTANT))


# ---- the guard check detects what it checks
_GUARD_DESCRIBE = "describe('" + GUARD_SUITE + "'"
# [(anchor in today's MathText.test.tsx, its replacement or None to cut), …]
GUARD_MUTANTS = {
    "the-guard-deleted": [("// The HTML-sink guard (PR #370 round 10", None)],
    "the-suite-renamed": [(_GUARD_DESCRIBE, "describe('MathText sink checks'")],
    "a-test-renamed": [("'" + GUARD_TESTS[0] + "'", "'KaTeX renders a math segment — %s'")],
    "a-test-commented-out": [("  it.each(HOSTILE)('KaTeX throws on", "  // it.each(HOSTILE)('KaTeX throws on")],
    "the-suite-skipped": [(_GUARD_DESCRIBE, "describe.skip('" + GUARD_SUITE + "'")],
    "a-test-skipped": [("it.each(HOSTILE)('prose without math", "it.skip.each(HOSTILE)('prose without math")],
    "a-test-marked-todo": [("it.each(HOSTILE)('prose beside math", "it.todo('prose beside math")],
    "a-test-inverted": [("it.each(HOSTILE)('KaTeX renders", "it.fails.each(HOSTILE)('KaTeX renders")],
}
# changes that must not trip the guard check
GUARD_COSMETIC = {
    "a-title-on-its-own-line": [("it.each(HOSTILE)('prose without math",
                                 "it.each(HOSTILE)(\n    'prose without math")],
    "a-double-quoted-title": [("'" + GUARD_TESTS[1] + "'", '"' + GUARD_TESTS[1] + '"')],
    "a-comment-naming-skip": [(_GUARD_DESCRIBE, "// never describe.skip or it.todo here\n" + _GUARD_DESCRIBE)],
}


def _guard_mutated(changes) -> str:
    """Today's MathText.test.tsx with each change applied; skips, like
    _mutated, when the file itself no longer holds the guard."""
    src = GUARD.read_text(encoding="utf-8")
    if guard_problems(src):
        pytest.skip(f"{CHANGED} (MathText.test.tsx no longer holds the behavioural guard, "
                    f"see test_the_behavioural_guard_is_still_in_the_vitest_file)")
    return _apply(src, "MathText.test.tsx", changes)


@pytest.mark.parametrize("mutant", GUARD_MUTANTS)
def test_the_guard_check_flags_a_guard_that_no_longer_runs(mutant):
    assert guard_problems(_guard_mutated(GUARD_MUTANTS[mutant]))


@pytest.mark.parametrize("change", GUARD_COSMETIC)
def test_the_guard_check_ignores_a_cosmetic_change(change):
    assert guard_problems(_guard_mutated(GUARD_COSMETIC[change])) == []


# ============================================ 2. the R8 inputs, recorded
def sentence(x):
    return unicodedata.normalize("NFC", "Låt ") + x + unicodedata.normalize("NFC", " vara här.")  # rounds 5-7


# case: (threat-model row, input, what a CommonMark renderer does with it).
# markdown-it-py 3.0.0's commonmark preset renders each as WORLD_KNOWLEDGE
# (docs/worklog/hpf-4xvy.md, section 3).
R8_GAPS = {
    "R8-H1": ("H1", 'WORLD_<span title=">">KNOWLEDGE</span>',
              "a quoted > in an attribute value does not end the tag"),
    "R8-M6": ("M6", "[WORLD](a(b(c)d)e)_KNOWLEDGE",
              "balanced parentheses nest in a link destination"),
    "R8-H2": ("H2", "WORLD_KN<?x <? y?>OWLEDGE",
              "a processing instruction runs to the first ?>, past a second <?"),
    # siblings of the same mechanisms, found while confirming R8
    "H1-single-quoted": ("H1", "WORLD_<span title='>'>KNOWLEDGE</span>", "the same, single-quoted"),
    "M6-three-levels": ("M6", "[WORLD](a(b(c(d)e)f)g)_KNOWLEDGE", "the same, three levels deep"),
    "H2-cdata": ("H2", "WORLD_KN<![CDATA[ <![CDATA[ ]]>OWLEDGE",
                 "a CDATA section runs to the first ]]>, past a second opener"),
}


@pytest.mark.parametrize("case", R8_GAPS)
def test_mathtext_shows_the_r8_markup_and_no_label(case):
    # MathText shows a string without a math delimiter as React text: all of
    # its markup is on screen, so the label is not (a visibly different
    # string, threat-model class C8)
    _, text, _ = R8_GAPS[case]
    shown = sentence(text)
    assert lint._MATH_OPEN not in shown
    assert not [m.group(0) for m in lint._SNAKE_TOKEN.finditer(shown) if lint._is_label(m.group(0))]


@pytest.mark.xfail(strict=True, raises=AssertionError,
                   reason="known markup-view gap: not a learner-visible rendering under MathText")
@pytest.mark.parametrize("case", R8_GAPS)
def test_the_markup_view_models_the_r8_commonmark_rendering(case):
    # a CommonMark renderer shows WORLD_KNOWLEDGE here, and the markup view
    # does not model the construct: it stays best effort (round 8)
    _, text, _ = R8_GAPS[case]
    assert [rule for rule, _ in lint.scan_text(sentence(text))] == ["L2-SNAKE"]


# ============================================ 3. a segment KaTeX throws on (round 9)
def test_the_lint_reads_a_segment_katex_throws_on_as_literal_text():
    # Nested this deep, KaTeX throws a RangeError, which throwOnError: false
    # does not catch (R9 used 835 levels; plain Node 22 throws from about
    # 1000). MathText then shows the segment as React text, which is the
    # scanned text without its delimiters, so a label in it is flagged like
    # any literal label.
    segment = (BS + "frac{") * 1000 + "WORLD_KNOWLEDGE" + "}" * 1000
    assert [rule for rule, _ in lint.scan_text(sentence(lint._MATH_OPEN + segment + lint._MATH_CLOSE))] \
        == ["L2-SNAKE"]
