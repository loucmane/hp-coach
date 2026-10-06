"""PR #370 fix round 8 (bead hpf-4xvy): the Layer-2 threat model, aligned with
the app's actual learner renderer (operator decision 2026-10-05, option A).
Fix round 9 (bead hpf-dhjn) closes MathText's KaTeX fallback.

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

1. The renderer assumption, pinned. The two pins fail with "learner renderer
   changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md" when
   app/package.json declares a Markdown or HTML renderer, or when MathText.tsx
   stops showing text outside math as React text with KaTeX's output as its
   only raw HTML. Since round 9 that includes the KaTeX fallback: Codex
   review R9 (hpf-wov1) made KaTeX throw past throwOnError: false, and the
   fallback put the raw segment into the page as HTML. The checkers also run
   on mutants of both files, so a pin that stops detecting fails as well.
2. The inputs of Codex review R8 (hpf-vqbz, HOLD at 9d1fd11), with siblings of
   the same mechanisms: valid CommonMark that a Markdown renderer shows as
   WORLD_KNOWLEDGE and the markup view does not model. MathText shows each as
   its markup, a visibly different string. They are strict xfails: the gap is
   recorded, and a fix that closes one fails until the record is moved.
3. A segment KaTeX throws on (round 9): MathText shows it as literal text,
   and the lint reads a label in it from the scanned text.

Red-first, and the CommonMark check of the R8 inputs (markdown-it-py), are in
docs/worklog/hpf-4xvy.md; round 9's red-first is in docs/worklog/hpf-dhjn.md.
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


# ============================================ 1. the renderer assumption
# ---- app/package.json declares no Markdown or HTML renderer
# A tripwire on package names, not a census: the bead's list (react-markdown,
# markdown-it, marked, remark*, rehype*, micromark, mdx), other Markdown
# renderers, and libraries that turn an HTML string into elements. A scoped
# name is tested on its scope and on its name. MathText's check below is the
# structural one.
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


# ---- MathText.tsx shows text outside math as React text, KaTeX's HTML inside
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
# the one raw-HTML sink takes the html field of a renderMath result, by name
_KATEX_SINK = re.compile(
    r"\bdangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(\w+)\.html\s*,?\s*\}\s*\}")
_RENDERED = re.compile(r"\bconst\s+(\w+)\s*=\s*renderMath\(")
# Round 9: what fills an html field. A key follows {, a comma or ; (an object
# or a type member). KaTeX's call fills it exactly once, types may declare it,
# and nothing else may write it: no other key, shorthand, computed key or
# assignment. So no path, the KaTeX fallback included, reaches the sink.
_HTML_KEY = re.compile(r"[{,;]\s*html\s*\??\s*:")
_HTML_FROM_KATEX = re.compile(r"[{,;]\s*html\s*:\s*katex\.renderToString\(")
_HTML_TYPE = re.compile(r"[{,;]\s*html\s*\??\s*:\s*string\b")
_HTML_OTHER_WRITE = re.compile(
    r"[{,]\s*html\s*[,}]"                          # shorthand { html }
    r"|\[\s*(['\"`])html\1\s*\]"                   # computed ['html']
    r"|\.html\s*(?:\+|\?\?|\|\||&&)?=(?![=>])")    # assignment .html = …
# Round 9: the fallback. The file's one catch hands the segment back as
# { text } and holds no html, and the result's text is shown as React text.
_CATCH = re.compile(r"\bcatch\b")
_CATCH_BLOCK = re.compile(r"\bcatch\s*(?:\([^()]*\)\s*)?\{((?:[^{}]|\{[^{}]*\})*)\}")
_RETURN_TEXT = re.compile(r"\breturn\s*\{\s*text\s*:")
_HTML_WORD = re.compile(r"\bhtml\b")
_SEGMENTS = re.compile(
    r"(?:=>|[({]|\breturn)\s*seg\.math\s*\?\s*\("
    r"\s*<MathSegment\b[^<>]*\blatex\s*=\s*\{\s*seg\.text\s*\}[^<>]*/>\s*\)"
    r"\s*:\s*\(\s*<span\b[^<>]*>\s*\{\s*seg\.text\s*\}\s*</span>\s*\)")
_FAST_PATH = re.compile(r"\breturn\s*\(?\s*<>\s*\{\s*children\s*\}\s*</>")
_KATEX_CALL = re.compile(r"\bkatex\.renderToString\(")
_THROW_OPTION = re.compile(r"\bthrowOnError\s*:\s*(\w+)")


def _js_value(body: str) -> str:
    return _JS_ESCAPE.sub(lambda m: chr(int(m.group(1) or m.group(2), 16)), body)


def _text_span(name: str) -> re.Pattern:
    """<span …>{name.text}</span>: the text of a renderMath result, as React text."""
    return re.compile(r"<span\b[^<>]*>\s*\{\s*" + re.escape(name) + r"\.text\s*\}\s*</span>")


def mathtext_problems(src: str) -> list[str]:
    """How MathText.tsx's source breaks the renderer assumption; empty when it holds."""
    code = _code(src)
    problems = []
    delimiters = {m.group(1): _js_value(m.group(3)) for m in _DELIMITER.finditer(code)}
    if delimiters != {"MATH_OPEN": lint._MATH_OPEN, "MATH_CLOSE": lint._MATH_CLOSE}:
        problems.append("its math delimiters are no longer U+E000 and U+E001, the lint's app view")
    sinks = _SINK.findall(code)
    katex_sink = _KATEX_SINK.search(code)
    rendered = _RENDERED.findall(code)
    if len(sinks) != 1 or not katex_sink or katex_sink.group(1) not in rendered:
        problems.append(f"{len(sinks)} dangerouslySetInnerHTML, where exactly one is allowed, "
                        f"fed by the html of a renderMath result ({{ __html: math.html }}, "
                        f"const math = renderMath(…))")
    if (len(_HTML_FROM_KATEX.findall(code)) != 1 or _HTML_OTHER_WRITE.search(code)
            or len(_HTML_KEY.findall(code)) != 1 + len(_HTML_TYPE.findall(code))):
        problems.append("the html the raw-HTML sink takes is no longer filled by katex.renderToString "
                        "alone, so the KaTeX fallback or another path can feed segment text to "
                        "dangerouslySetInnerHTML (round 9)")
    catch = _CATCH_BLOCK.search(code)
    if (len(_CATCH.findall(code)) != 1 or not catch or not _RETURN_TEXT.search(catch.group(1))
            or _HTML_WORD.search(catch.group(1)) or not any(_text_span(r).search(code) for r in rendered)):
        problems.append("when KaTeX throws, renderMath's catch no longer hands the segment back as "
                        "{ text } for MathText to show as React text, <span>{math.text}</span> (round 9)")
    if not _SEGMENTS.search(code):
        problems.append("the segments are no longer rendered as seg.math ? "
                        "(<MathSegment latex={seg.text} />) : (<span>{seg.text}</span>)")
    if not _FAST_PATH.search(code):
        problems.append("a string without math is no longer returned as React text, <>{children}</>")
    if not _KATEX_CALL.search(code) or set(_THROW_OPTION.findall(code)) != {"false"}:
        problems.append("renderMath no longer calls katex.renderToString with throwOnError: false, "
                        "which keeps a parse error in KaTeX's own escaped rendering")
    return problems


def test_mathtext_shows_text_outside_math_as_react_text():
    problems = mathtext_problems(MATHTEXT.read_text(encoding="utf-8"))
    assert not problems, f"{CHANGED} (app/src/components/MathText.tsx: {'; '.join(problems)})"


def test_the_pin_and_the_contract_name_each_other():
    # the failure message sends the reader to the contract, and the contract
    # names this file as the pin of its renderer assumption
    assert "LAYER2-RENDERING.md" in CHANGED
    assert Path(__file__).name in CONTRACT.read_text(encoding="utf-8")


# ---- the pins detect what they pin
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
# [(anchor in today's MathText.tsx, its replacement), …]
MATHTEXT_MUTANTS = {
    "text-branch-raw-html": [(_TEXT_SPAN, "<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />")],
    "text-branch-markdown": [(_TEXT_SPAN, "<Markdown key={idx}>{seg.text}</Markdown>")],
    "fast-path-raw-html": [(_FAST, "return <span dangerouslySetInnerHTML={{ __html: children }} />")],
    "fast-path-markdown": [(_FAST, "return <Markdown>{children}</Markdown>")],
    "math-branch-raw-text": [(_SINK_HTML, "__html: latex")],
    "branches-swapped": [("seg.math ? (", "!seg.math ? (")],
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
# changes that keep the assumption and must not trip the pin
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


def _mutated(changes) -> str:
    """Today's MathText.tsx with each (anchor, replacement) applied. A self-test
    needs a base that keeps the assumption: when the file itself breaks it, the
    pin above fails, and the self-tests skip rather than fail a second time
    without its reason."""
    src = MATHTEXT.read_text(encoding="utf-8")
    if mathtext_problems(src):
        pytest.skip(f"{CHANGED} (MathText.tsx already breaks the assumption, "
                    f"see test_mathtext_shows_text_outside_math_as_react_text)")
    for anchor, replacement in changes:
        assert src.count(anchor) == 1, (
            f"{CHANGED} (MathText.tsx no longer holds this self-test's anchor {anchor!r} once: "
            f"re-check the assumption, then move the anchor)")
        src = src.replace(anchor, replacement)
    return src


@pytest.mark.parametrize("mutant", MATHTEXT_MUTANTS)
def test_the_mathtext_pin_flags_a_renderer_change(mutant):
    assert mathtext_problems(_mutated(MATHTEXT_MUTANTS[mutant]))


@pytest.mark.parametrize("change", MATHTEXT_COSMETIC)
def test_the_mathtext_pin_ignores_a_cosmetic_change(change):
    assert mathtext_problems(_mutated(MATHTEXT_COSMETIC[change])) == []


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
