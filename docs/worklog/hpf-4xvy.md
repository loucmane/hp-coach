# hpf-4xvy — PR #370 fix round 8: align the Layer-2 threat model with the app's renderer, and pin it

Origin: Codex scoped review R8, hpf-vqbz (VERDICT: HOLD at 9d1fd11), of PR #370 (pipeline hardening,
origin bead hpf-y1p4). R8 found three valid-CommonMark constructions that render as WORLD_KNOWLEDGE yet
pass the lint's regex markup view. Operator decision 2026-10-05, option A: align the threat model with
the app's actual learner renderer instead of chasing CommonMark completeness. Rounds 1–7 (hpf-qo10,
hpf-oy2w, hpf-96rj, hpf-wu46, hpf-6fkm, hpf-pvkp, hpf-klv6) are not reworked, and
`docs/worklog/hpf-klv6.md` is history: it is not edited, and this file holds the revision.

- Lane: `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`.
- `git rev-parse HEAD` = `9d1fd113c404e660640f72a8391ab28a3d9b96bf`, verified first.
- All changes are UNCOMMITTED.

Notation: `U+XXXX` names one code point. This file holds no raw invisible, combining, bidi or
private-use character (check in section 9).

## Outcome

- **The renderer assumption is stated and verified.** Learner text is rendered by `MathText`
  (`app/src/components/MathText.tsx`): plain React text, except the segments between U+E000 and the
  next U+E001, which KaTeX typesets. There is no Markdown or HTML renderer in `app/`. Section 1 has the
  source evidence.
- **The threat model is re-classified against that renderer** (section 2):
  - the rows about the literal text or the KaTeX path stay as they are;
  - the rows whose closure depended on Markdown or HTML being rendered become "not applicable under
    the current renderer". That covers the in-token halves of M2 (`*`), M3, M4, M6, H1 and H2, plus M5
    and H3, with R8's H1, M6 and H2. For those rows the markup view stays as defense in depth, best
    effort;
  - the markup view is explicitly not a completeness claim for CommonMark.
- **The contract says so.** `pipeline/synthetic/LAYER2-RENDERING.md` gets a new section, "Elevens
  renderare (PR #370 rond 8, bead hpf-4xvy)". In the round-7 section, the two sentences that claimed
  completeness ("markup-vyn tar med allt som en sådan kan dölja. En etikett som någon renderare visar
  finns därför i texten eller i en vy.") are replaced.
- **The assumption is pinned.** A new file, `tests/test_lint_renderer_assumption_round8.py`, holds
  52 tests: 46 pass and 6 are strict xfails. It contains:
  - two pins, one on `app/package.json` and one on `MathText.tsx`. Each fails with "learner renderer
    changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md";
  - self-tests: each pin's checker runs on mutants, so a pin that stops detecting fails as well;
  - a test that the pin and the contract name each other.
- **The R8 inputs are recorded, not hidden.**
  - R8's three inputs and three siblings of the same mechanisms (single-quoted attribute, three-level
    nesting, nested CDATA opener) are strict xfails (`raises=AssertionError`), with the reason
    "known markup-view gap: not a learner-visible rendering under MathText".
  - Six passing tests show that MathText puts the markup, and no label, on screen.
  - None was closed (section 3 says why). No parser work.
- **Red-first** (section 5). The pins were run on scratch copies of the tree:
  - a copy with `react-markdown` added to its `package.json` fails exactly the package pin;
  - a copy whose `MathText.tsx` renders its text branch as raw HTML fails exactly the MathText pin;
  - both failures carry the required sentence, and the real tree passes.
- **The lint's behaviour is unchanged.**
  - `lint_learner_output.py` gets comment and docstring changes only. The module AST minus its
    docstring is identical to head's, and so is the docstring's first line, which argparse uses.
  - Store probe: default mode gives **2 findings in 27 files** and `--strict` gives **74**. The lines
    are identical to head's, in the same order.
- **Suites.**
  - Gate suite: **758 passed, 6 xfailed** (baseline 712 + 46).
  - The exact CI command: **828 passed, 6 xfailed** (baseline 782 + 46).

## Changed files (uncommitted)

| file | change | SHA-256 | blob |
|---|---|---|---|
| `pipeline/synthetic/LAYER2-RENDERING.md` | new section "Elevens renderare (PR #370 rond 8, bead hpf-4xvy)"; the round-7 section's completeness claim replaced, with pointers to round 8 | `6e85dbd7bb08c5a39d8572c7480fe209402808ebf6f1b901e73eba71a4bd40c7` | `d3111bc` |
| `pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py` | new, 52 tests (46 pass, 6 strict xfail) | `d1f541e725229ccd40040c37f37a52cb7ddb1f0550d51de4d8fa81beb4489363` | `bac3023` |
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | comments and docstring only: the markup view is best effort, and the renderer assumption is referenced | `0d0455e73e5bc0992eb6d6c05e29a81340e83a8f7c2c400bdfedf7eca8805aeb` | `be1faad` |
| `docs/worklog/hpf-4xvy.md` | this file | — | — |

No other file was touched: neither `app/` nor `data/`, and not `docs/worklog/hpf-klv6.md`. These were
already there and are left alone:
- the untracked dotfiles at the lane root (`.bashrc`, `.gitconfig`, `.mcp.json`, …). They are
  character devices 1,3 dated Sep 24, the sandbox's mount points, not files of this round;
- `.claude/skills/*`, `.agents/`, `.codex/` and `.gc/`;
- the ignored `__pycache__/` and `.pytest_cache/`.

---

## 1. The renderer, verified at 9d1fd11

**`app/src/components/MathText.tsx`** (read in full; `inspect_mathtext.py`, appendix D):
- Lines 28–29: `MATH_OPEN` and `MATH_CLOSE` are string literals holding the raw U+E000 and U+E001.
  Each occurs once in the file, and these are the lint's `_MATH_OPEN` and `_MATH_CLOSE`.
- Lines 125–127, the fast path: a string without U+E000 is returned as `<>{children}</>`, which is
  React text. React escapes it, so the browser shows every character of the string.
- Lines 129–150: the string is split into segments. A U+E000 with no U+E001 after it makes the rest
  plain text.
- Lines 154–170, the segment map: `seg.math ? (<span … dangerouslySetInnerHTML={{ __html:
  renderMath(seg.text) }} />) : (<span key={idx}>{seg.text}</span>)`. The text branch is React text.
  The math branch's raw HTML is `renderMath`'s output.
- Lines 105–118, `renderMath`: `katex.renderToString(wrapUnits(latex), { output: 'html',
  throwOnError: false, strict: 'ignore' })`. With `throwOnError: false`, KaTeX renders a parse error
  itself, as escaped source text. The `catch` returns the raw LaTeX, which would then go into the
  page as HTML. That path is reachable only on an exception that is not a parse error (residual 3).
- `flattenLatex` and `flattenMathText` produce plain strings for `aria-label` and titles: attribute
  text, not HTML.

**`app/package.json`:**
- Dependencies `katex` and `react-katex`.
- No Markdown or HTML renderer in any dependency field.

**`git grep` over `app/src`, `app/package.json` and `app/vite.config.ts`:**
- No package, import or plugin named react-markdown, markdown-it, marked, remark, rehype, micromark
  or mdx. A case-insensitive search for those names (plus commonmark and showdown) hits only:
  - English words in comments and test titles, such as "marked read" and "marks the active palette
    dot";
  - two comments in `debugSnapshot.ts`, which writes a Markdown report to the clipboard.
- The raw-HTML sinks:
  - `MathText.tsx:164`, KaTeX;
  - `QuestionFigure.tsx:99` and `:666`, SVG figures;
  - `debugSnapshot.ts:292`, an `outerHTML` read for the debug snapshot;
  - test-only `innerHTML` in `exitInk.test.ts` and `a11y-helper.test.ts`.

**Who renders a store string.** Every field of `data/explanations` the app shows goes through
`MathText`:
- `ExplanationPanel.tsx` lines 265, 283, 355, 368, 406 and 443;
- `PedagogyPanel.tsx` lines 172, 197, 209, 399, 406, 436, 442 and 446;
- the drill variants `StyleA/B/C.tsx` and `routes/explanation-bake-off.tsx`.

The design bake-offs under `components/devbake/` render their own fixtures as plain JSX text.
`devbake/l12/M2.tsx`'s `renderText` is either the identity or `MathText`. The loader
`data/explanations.ts` fetches the JSON and does not transform the text.

**The store.** `data/explanations` has 27 lintable files, all `.json`. Its `.md` and `.txt` files are
`_`-prefixed bookkeeping, which the lint skips, so no learner-facing `.md` exists.

So the learner sees Markdown and HTML markup as the characters it is made of. The lint's exposure is
the literal text, which rounds 5–7 closed through the scanned text and the plain view, plus the KaTeX
path through the app view.

## 2. The threat model, re-classified (round 8)

Rows and closures are those of `docs/worklog/hpf-klv6.md`, section 1. Mechanisms: B is the boundary,
P the plain view, A the app view, M the markup view and F the fold. "Under MathText" says what a
learner sees in the app.

| row | vector (short) | round-7 closure | under MathText | round-8 disposition |
|---|---|---|---|---|
| C1 | case | F (head) | the label, in another case | **applies**, unchanged |
| C2 | diacritics, stray combining marks | P/A/M | the label with marks | **applies**, unchanged |
| C3 | separator runs `WORLD__KNOWLEDGE` | B | the label, longer underscores | **applies**, unchanged |
| C4 | invisible and format characters | P/A/M | the label (the browser draws nothing) | **applies**, unchanged |
| C5 | adjacency | B, head | the label beside punctuation | **applies**, unchanged |
| C6 | compatibility forms | P/A/M, F | the label in another width or style | **applies**, unchanged |
| C7 | RLO override | P/A/M | the label (bidi display) | **applies**, unchanged |
| C8 | visibly different spellings | knowingly left | a different string | unchanged (knowingly left) |
| C9 | encoding | n/a upstream | — | unchanged |
| M1 | emphasis *around* (`_…_`, `**…**`, …) | B, head | the label between visible delimiters | **applies**, unchanged |
| M2 | emphasis *inside* | M for `*`; B for `_` runs | `*` cases: visible `*` inside the token (C8); `_` cases: the label with longer underscore runs | `*` cases: **n/a under the current renderer**, defense in depth; `_` cases: **applies** |
| M3 | strikethrough | around: head; inside: M | around: the label; inside: visible `~` (C8) | around **applies**; inside **n/a** |
| M4 | code spans | around: head; inside: M | around: the label; inside: visible backticks (C8) | around **applies**; inside **n/a** |
| M5 | `\_` escape outside math | M | a visible backslash (C8) | **n/a**. The same escape inside math is K1, which applies |
| M6 | links | around: head; inside: M | around: the label; inside: a visible `](…)` (C8) | around **applies**; inside **n/a**, and R8's nested parentheses are a recorded gap |
| M7 | line break; extensions | knowingly left | a split or literal label | unchanged (knowingly left) |
| H1 | tags | around: head; inside: M | around: the label; inside: a visible tag (C8) | around **applies**; inside **n/a**, and R8's quoted `>` is a recorded gap |
| H2 | comments, CDATA, PIs | around: head; inside: M | around: the label; inside: visible markup (C8) | around **applies**; inside **n/a**, and R8's nested `<?` is a recorded gap |
| H3 | character references | M | React escapes `&`, so the reference text is on screen (C8) | **n/a** |
| H4 | double encoding; attributes | n/a | a label in an attribute stands in the literal tag, where the scanned text holds it | unchanged |
| K1–K4 | KaTeX escapes, styles, groups, empty segments | A (and M) | KaTeX's typeset label | **applies**, unchanged |
| K5 | math whitespace, phantoms | knowingly left | — | unchanged |
| A1 | Markdown or HTML literal plus a KaTeX part | A | the literal markup with the typeset part | **applies**, unchanged |

The same split holds for L2-HEDGAT and L2-GATEREF (round 7, D5):
- **n/a:** `hedg&#97;t` and `G&#45;STEM` (H3) and `G-<b>STEM</b>` (H1 inside);
- **apply:** `_hedgat_`, `__hedgning__`, `__G-STEM__` and `_M-FORM_` (B); SHY, ZWSP and NBSP (P);
  the KaTeX-split `hedgat` (A).

"n/a" is not "removed": the markup view still runs on every string, and all 264 round-7 tests still
pass. What changes is the claim. The markup view is defense in depth for a renderer the app does not
use, best effort and not complete. The lint's coverage of what a learner sees comes from the scanned
text and the plain and app views. Literal-text detection (rounds 5–7) is untouched: the lint's AST is
identical (section 7).

## 3. The R8 inputs (appendix A, `r8_probe.py`)

`r8_probe.py` puts each input in rounds 5–7's sentence frame and reads it three ways:
- **the lane lint**: `scan_text` and the text of each view;
- **CommonMark**: markdown-it-py 3.0.0 renders it, and the visible text is the HTML's text nodes
  (`html.parser`; comments, processing instructions, declarations and CDATA carry no text);
- **MathText**: a string without U+E000 is React text, so the visible text is the input itself.

```
markdown-it-py 3.0.0, preset commonmark (html=True)

=== R8 H1: a quoted > inside a tag's attribute value
  input           WORLD_<span title=">">KNOWLEDGE</span>
  lint            []
  lint view 0     'Låt WORLD_">KNOWLEDGE vara här.'
  CommonMark html <p>Låt WORLD_<span title=">">KNOWLEDGE</span> vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt WORLD_<span title=">">KNOWLEDGE</span> vara här.'  labels on screen: []

=== R8 M6: a link destination with nested balanced parentheses
  input           [WORLD](a(b(c)d)e)_KNOWLEDGE
  lint            []
  lint view 0     'Låt WORLD(a(b(c)d)e)_KNOWLEDGE vara här.'
  CommonMark html <p>Låt <a href="a(b(c)d)e">WORLD</a>_KNOWLEDGE vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt [WORLD](a(b(c)d)e)_KNOWLEDGE vara här.'  labels on screen: []

=== R8 H2: a second <? inside a processing instruction
  input           WORLD_KN<?x <? y?>OWLEDGE
  lint            []
  lint view 0     'Låt WORLD_KN<?x OWLEDGE vara här.'
  CommonMark html <p>Låt WORLD_KN<?x <? y?>OWLEDGE vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt WORLD_KN<?x <? y?>OWLEDGE vara här.'  labels on screen: []

=== sibling H1: the same, single-quoted
  input           WORLD_<span title='>'>KNOWLEDGE</span>
  lint            []
  lint view 0     "Låt WORLD_'>KNOWLEDGE vara här."
  CommonMark html <p>Låt WORLD_<span title='>'>KNOWLEDGE</span> vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   "Låt WORLD_<span title='>'>KNOWLEDGE</span> vara här."  labels on screen: []

=== sibling M6: the same, three levels deep
  input           [WORLD](a(b(c(d)e)f)g)_KNOWLEDGE
  lint            []
  lint view 0     'Låt WORLD(a(b(c(d)e)f)g)_KNOWLEDGE vara här.'
  CommonMark html <p>Låt <a href="a(b(c(d)e)f)g">WORLD</a>_KNOWLEDGE vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt [WORLD](a(b(c(d)e)f)g)_KNOWLEDGE vara här.'  labels on screen: []

=== sibling H2: a second <!-- inside a comment
  input           WORLD_KN<!-- <!-- -->OWLEDGE
  lint            []
  lint view 0     'Låt WORLD_KN<!-- OWLEDGE vara här.'
  CommonMark html <p>Låt WORLD_KN&lt;!-- <!-- -->OWLEDGE vara här.</p>
  CommonMark text 'Låt WORLD_KN<!-- OWLEDGE vara här.'  labels on screen: []
  MathText text   'Låt WORLD_KN<!-- <!-- -->OWLEDGE vara här.'  labels on screen: []

=== sibling H2: a second <![CDATA[ inside a CDATA section
  input           WORLD_KN<![CDATA[ <![CDATA[ ]]>OWLEDGE
  lint            []
  lint view 0     'Låt WORLD_KN<!CDATA OWLEDGE vara här.'
  CommonMark html <p>Låt WORLD_KN<![CDATA[ <![CDATA[ ]]>OWLEDGE vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt WORLD_KN<![CDATA[ <![CDATA[ ]]>OWLEDGE vara här.'  labels on screen: []

=== control H1: round 7, closed by the markup view
  input           WORLD_<em>KNOWLEDGE</em>
  lint            [('L2-SNAKE', 'Låt WORLD_<em>KNOWLEDGE</em> vara här.')]
  lint view 0     'Låt WORLD_KNOWLEDGE vara här.'
  CommonMark html <p>Låt WORLD_<em>KNOWLEDGE</em> vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt WORLD_<em>KNOWLEDGE</em> vara här.'  labels on screen: []

=== control M6: round 7, closed by the markup view
  input           [WORLD](https://exempel.se/a)_KNOWLEDGE
  lint            [('L2-SNAKE', 'Låt [WORLD](https://exempel.se/a)_KNOWLEDGE vara här.')]
  lint view 0     'Låt WORLD_KNOWLEDGE vara här.'
  CommonMark html <p>Låt <a href="https://exempel.se/a">WORLD</a>_KNOWLEDGE vara här.</p>
  CommonMark text 'Låt WORLD_KNOWLEDGE vara här.'  labels on screen: ['WORLD_KNOWLEDGE']
  MathText text   'Låt [WORLD](https://exempel.se/a)_KNOWLEDGE vara här.'  labels on screen: []
```

- **R8's finding is confirmed.** A real CommonMark implementation renders all three inputs as
  WORLD_KNOWLEDGE, and the lane lint flags none of them.
- **None is a learner-visible rendering under MathText.** The learner sees the markup inside the
  token, which makes a visibly different string (class C8). The two controls are rows that round 7
  closed in the markup view; they show the harness agrees with the lint where the view models
  CommonMark. Under MathText they are not on screen either, which is the re-classification of
  section 2.
- **Siblings.**
  - Three have the same mechanism and are confirmed by the renderer: the single-quoted attribute,
    three-level nesting, and the nested `<![CDATA[`. They are recorded with R8's three.
  - The nested comment, `<!-- <!-- -->`, is spec-dependent. CommonMark 0.31's comment rule and the
    HTML5 parser make the whole span one comment. markdown-it-py 3.0.0 implements 0.30's rule, which
    forbids `--` inside a comment, and escapes the first opener. With no executed renderer to show
    the label, it is recorded here and not in a test.
- **Recorded in the test file, section 2:**
  - `test_mathtext_shows_the_r8_markup_and_no_label`: 6 pass. The input has no math delimiter, and
    the literal text holds no label token.
  - `test_the_markup_view_models_the_r8_commonmark_rendering`: 6 xfail, `strict=True`,
    `raises=AssertionError`, with the reason "known markup-view gap: not a learner-visible rendering
    under MathText". A future fix that closes one makes it XPASS, which strict mode turns into a
    failure, so the record has to be moved by hand. Only an assertion counts as the expected failure,
    so a broken test cannot pass as a known gap.
- **Why none was closed** ("cheaply, without new parsing complexity" does not hold for any):
  - H1 needs CommonMark's attribute grammar, with quoted values, in the tag rule. That changes which
    strings are tags for every existing input, with a new linearity argument.
  - M6 needs unbounded nesting of balanced parentheses. That is not regular; deepening the one level
    the regex has only moves the next variant one level down, as the three-level sibling shows.
  - H2 needs the first-terminator rule. As a backtracking regex that is quadratic on unterminated
    openers: round 7's "stop at the next opener" is what keeps it linear, and 8 tests pin that.
    Otherwise it needs a pre-pass.

  Under option A the markup view is best effort, so none of this was started.

## 4. The pin: `tests/test_lint_renderer_assumption_round8.py`

It runs from the repository root in CI, or from any directory: paths come from `__file__`. It needs
only the standard library and pytest. CI installs pytest and PyYAML; markdown-it-py was used only by
the probe in section 3.

**(a) `app/package.json`** (`test_app_declares_no_markdown_or_html_renderer`):
- The file is parsed as JSON, and `dependencies`, `devDependencies`, `peerDependencies` and
  `optionalDependencies` are scanned.
- Each name is tested, on its scope and on its own, against:
  - the bead's list: react-markdown, markdown-it, marked, `remark*`, `rehype*`, micromark, mdx;
  - any name containing `markdown`, `mdx`, `commonmark`, `showdown` or `snarkdown`;
  - `marked` as a hyphen-bounded word, and `remark`, `rehype` and `micromark` as hyphen-bounded
    prefixes (`remarkable` included);
  - the HTML-string renderers html-react-parser, react-html-parser and html-to-react.
- On a match it fails with: `learner renderer changed — revisit the Layer-2 threat model in
  LAYER2-RENDERING.md (app/package.json declares dependencies: react-markdown)`.

**(b) `MathText.tsx`** (`test_mathtext_shows_text_outside_math_as_react_text`): a focused source
check. Comments are stripped first, by a scanner that keeps string and template literals whole, so a
comment that names a sink cannot count. The check then requires:
1. `MATH_OPEN` and `MATH_CLOSE` decode, with raw characters or JS unicode escapes, to the lint's
   U+E000 and U+E001;
2. exactly one `dangerouslySetInnerHTML`, and that one is `{{ __html: renderMath(seg.text) }}`;
3. that sink sits in the `seg.math ? (…)` branch, introduced by `=>`, `(`, `{` or `return`, so a
   negated `!seg.math` does not match. The other branch must be `<span …>{seg.text}</span>`, which
   is React text;
4. the fast path is `return <>{children}</>`, which is React text;
5. `katex.renderToString` is called, and every `throwOnError` is `false`.

A failure lists every broken item after the same sentence.

**Self-tests.** Each pin's checker runs on inputs that must and must not trip it:
- 19 renderer package names, each put in every one of the four dependency fields, are each flagged
  alone;
- 6 neighbours are not flagged: `katex`, `react-katex`, `@remix-run/react`, `mark.js`, `recharts`
  and `@base-ui/react`;
- 8 MathText mutants are flagged, each made by one anchor replacement in today's file:
  - the text branch as raw HTML, or through a `<Markdown>` component;
  - the fast path as raw HTML, or through `<Markdown>`;
  - the math sink fed `seg.text` raw;
  - the branches swapped (`!seg.math`);
  - `throwOnError: true`;
  - `$` as the delimiter;
- 4 cosmetic changes are not flagged:
  - a `//` and a `/* */` comment naming the sink;
  - the delimiters as JS unicode escapes, in the plain and in the braced form;
  - the text branch reformatted.

When `MathText.tsx` itself already breaks the assumption, the MathText self-tests skip, and their
skip reason carries the sentence. The pin above has failed by then. When a self-test's anchor is
gone, it fails with the sentence and asks for the anchor to be moved.

**Contract link** (`test_the_pin_and_the_contract_name_each_other`): the failure sentence names
`LAYER2-RENDERING.md`, and the contract names this file.

## 5. Red-first

1. **Before the contract edit.** The test file ran on the lane before `LAYER2-RENDERING.md` was
   changed: **1 failed, 45 passed, 6 xfailed** (`r8-before-contract.xml`). The one failure was
   `test_the_pin_and_the_contract_name_each_other`, because the contract did not name the pin yet.
   Both pins were already green on the real tree.
2. **Scratch trees** (`red_first_r8.py`, appendix B). Each tree copies, at their repository paths,
   `app/package.json`, `MathText.tsx`, `LAYER2-RENDERING.md`, the lint and the new test file, into
   the session scratchpad. The lane's tracked files were never modified.
   - `markdown-dep` adds `"react-markdown": "^9.0.1"` to the copied `package.json`'s dependencies.
   - `html-text-branch` replaces the copied MathText's `<span key={idx}>{seg.text}</span>` with
     `<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />`.
   - `control` keeps both files as they are, and `both` applies both changes.

| tree | the two pins | the whole file |
|---|---|---|
| control | 2 passed | 46 passed, 6 xfailed |
| markdown-dep (package.json `be1ef529…`) | package pin **FAILED**, MathText pin passed | 1 failed, 45 passed, 6 xfailed |
| html-text-branch (MathText `9f2b6eb5…`) | MathText pin **FAILED**, package pin passed | 1 failed, 33 passed, 12 skipped, 6 xfailed |
| both | both pins **FAILED** | 2 failed, 32 passed, 12 skipped, 6 xfailed |
| the real lane tree | 2 passed | (section 6) |

Every failure message carries the required sentence:

```
markdown-dep:      AssertionError: learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md (app/package.json declares dependencies: react-markdown)
html-text-branch:  AssertionError: learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md (app/src/components/MathText.tsx: 2 dangerouslySetInnerHTML, where exactly one is allowed, fed by renderMath(seg.text); the segments are no longer rendered as seg.math ? (KaTeX's HTML) : (<span>{seg.text}</span>))
```

The 12 skips are the MathText self-tests (8 mutants, 4 cosmetic changes), and every skip reason
carries the sentence.

3. **Found and fixed by the red-first run.** The first version of the self-tests did not skip on a
   broken base. In `html-text-branch` the whole file then gave **7 failed**:
   - the pin;
   - two mutants whose anchor the mutation had removed (with the sentence);
   - the reformatted-text-branch guard (with the sentence);
   - three cosmetic guards that failed with a bare `assert [...] == []`, without the sentence.

   A developer who changed MathText would have met three misleading failures. `_mutated` now skips
   when the base already breaks the assumption, and the anchor message asks for a re-check. The
   table above comes from the final file.

The trees were copied from these lane files (SHA-256 from the final report):
- `app/package.json` `ba37a92c2214c289542e5f4dee206902bb63cf7fadde858bc8259060b3856e1c`;
- `MathText.tsx` `cc52f74f211b732d2c375cdc587cf952e547d37e2c1eb445897c42817aced145`.

Both are unchanged from HEAD. The other three are as in the changed-files table.

## 6. Full suites (lane, final files)

| run | at HEAD, before any edit | lane |
|---|---|---|
| `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` | 712 passed | **758 passed, 6 xfailed** |
| `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q` (the exact CI command) | 782 passed | **828 passed, 6 xfailed** |
| the four lint files, rounds 5–8 | — | 440 passed, 6 xfailed |

The 46 new passing tests are 2 pins, 1 contract link, 19 + 6 package self-tests, 8 + 4 MathText
self-tests and 6 R8 display tests. The 6 xfails are the R8 record. All 712 earlier tests pass
unchanged, including round 7's 264 and round 5's coverage test.

## 7. The lint is unchanged; the store probe (appendix C, `evidence_r8.py`)

```
=== B. the lint, head vs lane
AST without the module docstring identical: True
docstring first line identical: True ('Learner-output lint: enforce the Layer-2 rendering contract.')
changed lines (head side + lane side): 17; outside the module docstring and # comments: []

=== C. store probe: data/explanations, head lint vs lane lint
default: head exit 1, 2 finding(s), ['learner-output lint: 2 finding(s) in 27 file(s)'], 2.76s
         lane exit 1, 2 finding(s), ['learner-output lint: 2 finding(s) in 27 file(s)'], 2.86s
         finding lines identical, same order: True
    L2-HEDGAT …/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.distractors[2].why_wrong: …v. Och "i vissa avseenden" är hedgning som inte fångar förstärkninge…
    L2-HEDGAT …/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.steps[2].text: …kvens. "I vissa avseenden" är hedgning.…
--strict: head exit 1, 74 finding(s), ['learner-output lint: 74 finding(s) in 27 file(s)'], 2.74s
          lane exit 1, 74 finding(s), ['learner-output lint: 74 finding(s) in 27 file(s)'], 2.64s
          finding lines identical, same order: True

=== D. label sources
round 5 label_sources(): 208 (source, label) pairs, 117 distinct labels
round 7 labels() (label sources + vocabulary): 117
labels the default lint does not flag: []
LAYER2-RENDERING.md ALL_CAPS tokens: head ['SCOPE_SHIFT', 'WORLD_KNOWLEDGE', 'WORLD__KNOWLEDGE'], lane ['SCOPE_SHIFT', 'WORLD_KNOWLEDGE', 'WORLD__KNOWLEDGE'], identical: True
```

The finding lines' lane path is shortened to `…` here. The full report prints it.

- **The lint.** The lint compiles to the same module, apart from the docstring.
- **The store.** Default mode gives the 2 known L2-HEDGAT findings in `host-2017-verb2-MEK-025`, and
  `--strict` gives 74. Head's and the lane's lines are identical, in the same order.
- **The label set.** Round 5's coverage test harvests every ALL_CAPS snake token in pipeline `.md`
  files, and those tokens become round 7's generative labels. The contract text was therefore
  written without a new one: R8's H2 input is described in prose rather than quoted, because quoted
  it would add the non-label token `WORLD_KN`. The label set stays at 117.

## 8. Residual risks

1. **The pin's reach.** It covers `app/package.json` and `MathText.tsx`. It does not catch:
   - a component that renders a store string without `MathText`, such as its own raw-HTML sink or a
     hand-rolled Markdown transform. At this head no component does (section 1);
   - a Markdown library that is imported but not declared, for example one that arrives
     transitively.

   The name list is a tripwire, not a census. The structural check is MathText's.
2. **Shape coupling.** The MathText check reads the component's shape. A refactor that keeps the
   semantics may trip it; the branches swapped back to `!seg.math ? text : math` is one example. The
   message then asks for a re-check against the contract, and the self-tests' anchors may need to
   move.
3. **The KaTeX fallback.** If `katex.renderToString` throws anyway, MathText puts the raw segment
   into the page as HTML (`return latex` inside the `dangerouslySetInnerHTML` branch). A parse error
   does not reach that path, since `throwOnError: false` is pinned; only another exception does. The
   app view does not model this path.
4. **The comment stripper.** `_code` keeps string and template literals whole and treats a
   backslash as an escape. A regex literal containing a quote character could desynchronise it.
   `MathText.tsx` has none today.
5. **The markup view is best effort.** Six gaps are recorded as xfails, and the nested comment is
   noted in section 3. More exist by construction: any CommonMark or HTML construct the regex view
   does not model. Under the current renderer none of them is on screen.
6. **`.md` and `.txt` inputs.** The lint reads them as literal text with the same views. If a `.md`
   file is ever made learner-facing through a Markdown renderer, that is a renderer change outside
   the two pinned files. The contract says to revisit the threat model then.

## 9. Reproduction

```
git rev-parse HEAD   # 9d1fd113c404e660640f72a8391ab28a3d9b96bf
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py -rxX   # 46 passed, 6 xfailed
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests          # 758 passed, 6 xfailed
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q   # 828 passed, 6 xfailed
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations          # exit 1: the 2 known L2-HEDGAT, 27 files
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py --strict data/explanations # exit 1: 74
# S = a scratch dir; every script is an appendix below
python3 r8_probe.py "$PWD" $S/r8_probe.txt                  # A (needs markdown-it-py; read-only)
python3 red_first_r8.py "$PWD" $S $S/red_first_r8.txt       # B (writes only under $S/trees)
python3 evidence_r8.py "$PWD" $S $S/evidence_r8.txt         # C (writes head copies under $S/head)
python3 inspect_mathtext.py "$PWD"                          # D
python3 check_chars_r8.py "$PWD"                            # E
```

**Coordination note.** The bead's metadata names `gc.check_path`:
`/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`
(SHA-256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`). It has the same digest
as in rounds 5–7. It is the dispatcher's producer-stage gate, and this bead's description names no
validator, so it was hashed and not run.

**Harness notes.**
- Every check ran as a script file or one command each, with no pipelines. An inline `python3 -c`
  with `;` separators was refused by the worker permission policy and was not retried in another
  form.
- Every exotic character in the new test file is built with `chr()`. A JS unicode escape is
  assembled from `BS + "u…"`, so no backslash-u sequence sits in a written file.
- This file's first draft quoted the escape forms literally in section 4. The write tool turned the
  backslash-u escape of U+E000 into the raw private-use character, as round 7 had observed.
  `check_chars_r8.py` caught it, and `fix_worklog_line.py` (appendix G) rewrote the line in words.
- `check_chars_r8.py` (appendix E) ran after the last edit of this file and found the four files
  clean.

## Appendices

Each appendix is the exact source of a probe script, appended from its file by
`append_appendices_r8.py` (appendix F). Its header carries the file's SHA-256 as run. Every script
is read-only towards the lane's tracked files; `red_first_r8.py` and `evidence_r8.py` write only
under the scratch directory.

### Appendix A — `r8_probe.py` (SHA-256 `0609a7a0368d799319e6fb965d241c3a3fcfc9e397836d0f29d092626ad6635c`)

The R8 inputs, their siblings and two controls, read by the lane lint, by markdown-it-py's CommonMark and by MathText (section 3).

```python
"""Read-only probe for bead hpf-4xvy: the three inputs of Codex review R8
(hpf-vqbz, HOLD at 9d1fd11) and their same-mechanism siblings, seen three ways.

  lint      the lane's default lint (scan_text) on the input in rounds 5-7's
            sentence frame, plus the text of each rendered view;
  CommonMark  markdown-it-py (preset "commonmark", raw HTML on) renders the
            input; the visible text is the HTML's text nodes (html.parser:
            comments, processing instructions, declarations and CDATA carry no
            text), which is what a browser shows;
  MathText  the app's renderer: a string without U+E000 is shown as React
            text, character for character, so the visible text is the input.

For each it reports whether WORLD_KNOWLEDGE is on screen as one token.
Controls: two round-7 rows the markup view closes, to show the harness agrees
with the lint where the lint already models CommonMark.

usage: r8_probe.py <lane-root> <report-path>
"""
from __future__ import annotations

import builtins
import html.parser
import sys
import unicodedata
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts"))

import lint_learner_output as lint  # noqa: E402
import markdown_it  # noqa: E402

OPEN = chr(0xE000)


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


class _Text(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.out = []

    def handle_data(self, data):
        self.out.append(data)


def visible(rendered_html: str) -> str:
    p = _Text()
    p.feed(rendered_html)
    p.close()
    return "".join(p.out)


MD = markdown_it.MarkdownIt("commonmark")


def sentence(x):
    return unicodedata.normalize("NFC", "Låt ") + x + unicodedata.normalize("NFC", " vara här.")


def label_tokens(text):
    return [m.group(0) for m in lint._SNAKE_TOKEN.finditer(text) if lint._is_label(m.group(0))]


CASES = [
    ("R8 H1", 'WORLD_<span title=">">KNOWLEDGE</span>', "a quoted > inside a tag's attribute value"),
    ("R8 M6", "[WORLD](a(b(c)d)e)_KNOWLEDGE", "a link destination with nested balanced parentheses"),
    ("R8 H2", "WORLD_KN<?x <? y?>OWLEDGE", "a second <? inside a processing instruction"),
    ("sibling H1", "WORLD_<span title='>'>KNOWLEDGE</span>", "the same, single-quoted"),
    ("sibling M6", "[WORLD](a(b(c(d)e)f)g)_KNOWLEDGE", "the same, three levels deep"),
    ("sibling H2", "WORLD_KN<!-- <!-- -->OWLEDGE", "a second <!-- inside a comment"),
    ("sibling H2", "WORLD_KN<![CDATA[ <![CDATA[ ]]>OWLEDGE", "a second <![CDATA[ inside a CDATA section"),
    ("control H1", "WORLD_<em>KNOWLEDGE</em>", "round 7, closed by the markup view"),
    ("control M6", "[WORLD](https://exempel.se/a)_KNOWLEDGE", "round 7, closed by the markup view"),
]

print(f"markdown-it-py {markdown_it.__version__}, preset commonmark (html={MD.options['html']})")
for row, src, what in CASES:
    text = sentence(src)
    hits = lint.scan_text(text)
    rendered = MD.render(text)
    shown_md = visible(rendered)
    assert OPEN not in text
    shown_app = text                       # MathText: no math delimiter, so React text as it stands
    print(f"\n=== {row}: {what}")
    print(f"  input           {src}")
    print(f"  lint            {hits}")
    for i, view in enumerate(lint._views(unicodedata.normalize('NFC', text))):
        print(f"  lint view {i}     {view.text!r}")
    print(f"  CommonMark html {rendered.strip()}")
    print(f"  CommonMark text {shown_md.strip()!r}  labels on screen: {label_tokens(shown_md)}")
    print(f"  MathText text   {shown_app!r}  labels on screen: {label_tokens(shown_app)}")
REPORT.close()
```

### Appendix B — `red_first_r8.py` (SHA-256 `dd3c617fb236fedbb6fb01c90eda181ffae863accdbda1e714cfd10ee7c8659c`)

The two pins and the whole file on scratch trees: control, a Markdown dependency, a raw-HTML text branch, and both (section 5).

```python
"""Red-first for bead hpf-4xvy's renderer pins, on scratch copies of the tree.
Read-only towards the lane: every tree is written under <scratch>/trees.

Each tree copies, at their repository paths, the files the new test file
reads: app/package.json, app/src/components/MathText.tsx,
pipeline/synthetic/LAYER2-RENDERING.md, the lint and the new test file. Then:

  control           nothing changed (the copy itself must pass)
  markdown-dep      app/package.json gains "react-markdown" in dependencies
  html-text-branch  MathText.tsx's text branch renders seg.text as raw HTML
  both              both mutations

For each tree: pytest on (1) the two pins only, (2) the whole file, with
JUnit XML; per test the outcome, and whether each failure message carries the
required sentence. Then (3) the two pins on the real lane tree.

usage: red_first_r8.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import builtins
import hashlib
import json
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
TEST_REL = "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py"
FILES = ("app/package.json", "app/src/components/MathText.tsx", "pipeline/synthetic/LAYER2-RENDERING.md",
         "pipeline/synthetic/gates/scripts/lint_learner_output.py", TEST_REL)
PINS = ("test_app_declares_no_markdown_or_html_renderer", "test_mathtext_shows_text_outside_math_as_react_text")
CHANGED = "learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md"
TEXT_SPAN = "<span key={idx}>{seg.text}</span>"
RAW_HTML_SPAN = "<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def add_markdown_dep(root: Path):
    p = root / "app/package.json"
    pkg = json.loads(p.read_text(encoding="utf-8"))
    pkg["dependencies"]["react-markdown"] = "^9.0.1"
    p.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")


def html_text_branch(root: Path):
    p = root / "app/src/components/MathText.tsx"
    src = p.read_text(encoding="utf-8")
    assert src.count(TEXT_SPAN) == 1
    p.write_text(src.replace(TEXT_SPAN, RAW_HTML_SPAN), encoding="utf-8")


TREES = {"control": (), "markdown-dep": (add_markdown_dep,), "html-text-branch": (html_text_branch,),
         "both": (add_markdown_dep, html_text_branch)}


def build(name, mutations) -> Path:
    root = SCRATCH / "trees" / name
    if root.exists():
        shutil.rmtree(root)
    for rel in FILES:
        (root / rel).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(LANE / rel, root / rel)
    for m in mutations:
        m(root)
    return root


def run(root: Path, selection, xml: Path):
    targets = [f"{root / TEST_REL}::{t}" for t in selection] if selection else [str(root / TEST_REL)]
    r = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", *targets,
                        f"--junitxml={xml}"], capture_output=True, text=True, cwd=root)
    outcomes = {}
    for case in ET.parse(xml).getroot().iter("testcase"):
        name = case.get("name")
        failure = case.find("failure")
        skipped = case.find("skipped")
        if failure is not None:
            outcomes[name] = ("FAILED", failure.get("message") or "")
        elif skipped is not None:
            outcomes[name] = ("XFAIL" if "xfail" in (skipped.get("type") or "") else "SKIPPED",
                              skipped.get("message") or "")
        else:
            outcomes[name] = ("PASSED", "")
    return r.returncode, r.stdout.strip().splitlines()[-1], outcomes


def main():
    print("lane files copied into each tree (SHA-256 of the lane copy):")
    for rel in FILES:
        print(f"  {sha(LANE / rel)}  {rel}")
    for name, mutations in TREES.items():
        root = build(name, mutations)
        print(f"\n=== tree {name}: {root}")
        for rel in FILES[:2]:
            changed = sha(root / rel) != sha(LANE / rel)
            print(f"  {rel}: {'MUTATED ' + sha(root / rel) if changed else 'as in the lane'}")
        for label, selection in (("the two pins", PINS), ("the whole file", None)):
            xml = SCRATCH / "trees" / f"{name}-{'pins' if selection else 'file'}.xml"
            code, summary, outcomes = run(root, selection, xml)
            print(f"  -- {label}: exit {code}, {summary}")
            for test, (outcome, message) in outcomes.items():
                if outcome == "FAILED":
                    print(f"     {outcome} {test}")
                    print(f"       carries the required sentence: {CHANGED in message}")
                    print(f"       message: {message[:600]}")
            skips = [(t, m) for t, (o, m) in outcomes.items() if o == "SKIPPED"]
            if skips:
                print(f"     SKIPPED {len(skips)}: {[t for t, _ in skips]}")
                print(f"       every skip reason carries the required sentence: "
                      f"{all(CHANGED in m for _, m in skips)}")
                print(f"       first reason: {skips[0][1][:300]}")
            if selection:
                for test in PINS:
                    print(f"     {test}: {outcomes[test][0]}")
            else:
                counts = {}
                for outcome, _ in outcomes.values():
                    counts[outcome] = counts.get(outcome, 0) + 1
                print(f"     outcomes: {dict(sorted(counts.items()))}")
    print("\n=== the real lane tree")
    xml = SCRATCH / "trees" / "lane-pins.xml"
    code, summary, outcomes = run(LANE, PINS, xml)
    print(f"  -- the two pins: exit {code}, {summary}")
    for test in PINS:
        print(f"     {test}: {outcomes[test][0]}")


main()
REPORT.close()
```

### Appendix C — `evidence_r8.py` (SHA-256 `5cccbb0f9b2fb8df00bc6ad904657eca43a7cc1d127cf5c04b966282985e4537`)

HEAD and the changed files, the lint head vs lane (AST and diff), the store probe, the label sources and raw characters (sections 6 and 7).

```python
"""Evidence for bead hpf-4xvy (read-only towards the lane; head copies go to
<scratch>/head). Sections:

  A. HEAD, and every changed or new file with its SHA-256 and git blob id;
  B. the lint, head vs lane: the module AST minus the module docstring is
     identical, the docstring's first line (argparse's description) is
     identical, and every differing line is a comment or docstring line;
  C. store probe: head lint CLI vs lane lint CLI over data/explanations,
     default and --strict: exit code, summary, finding lines;
  D. label sources: round 5's label_sources() and round 7's labels() on the
     lane, and the ALL_CAPS tokens round 5 harvests from LAYER2-RENDERING.md,
     head vs lane;
  E. raw characters: no Cf, default-ignorable, private-use, combining or
     unusual space character in the changed files.

usage: evidence_r8.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import ast
import builtins
import difflib
import hashlib
import subprocess
import sys
import time
import unicodedata
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
LINT = "pipeline/synthetic/gates/scripts/lint_learner_output.py"
DOC = "pipeline/synthetic/LAYER2-RENDERING.md"
NEW_TEST = "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def git(*args) -> str:
    return subprocess.run(["git", *args], cwd=LANE, capture_output=True, text=True, check=True).stdout


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def head_copy(rel: str) -> Path:
    out = SCRATCH / "head" / Path(rel).name
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(git("show", f"HEAD:{rel}"), encoding="utf-8")
    return out


# ------------------------------------------------------------------ A
print(f"HEAD {git('rev-parse', 'HEAD').strip()}")
status = [ln for ln in git("status", "--porcelain", "--untracked-files=all").splitlines()
          if not ln[3:].startswith((".claude/skills/", ".agents/", ".codex/", ".gc/"))]
print("git status (tracked changes and new files; the pre-existing gc/agent dirs left out):")
for ln in status:
    print(f"  {ln}")
for rel in (LINT, DOC, NEW_TEST):
    print(f"  {sha(LANE / rel)}  blob {git('hash-object', rel).strip()[:7]}  {rel}")

# ------------------------------------------------------------------ B
print("\n=== B. the lint, head vs lane")
head_lint = head_copy(LINT)
lane_src, head_src = (LANE / LINT).read_text(encoding="utf-8"), head_lint.read_text(encoding="utf-8")


def without_module_docstring(src: str) -> str:
    tree = ast.parse(src)
    if tree.body and isinstance(tree.body[0], ast.Expr) and isinstance(tree.body[0].value, ast.Constant):
        tree.body = tree.body[1:]
    return ast.dump(tree, include_attributes=False)


print(f"AST without the module docstring identical: {without_module_docstring(head_src) == without_module_docstring(lane_src)}")
head_doc, lane_doc = ast.get_docstring(ast.parse(head_src)), ast.get_docstring(ast.parse(lane_src))
print(f"docstring first line identical: {head_doc.splitlines()[0] == lane_doc.splitlines()[0]} "
      f"({lane_doc.splitlines()[0]!r})")
def docstring_and_comment_lines(src: str) -> set:
    doc = ast.parse(src).body[0]
    return set(range(doc.lineno, doc.end_lineno + 1)) | {
        n for n, ln in enumerate(src.splitlines(), 1) if ln.lstrip().startswith("#")}


head_ok, lane_ok = docstring_and_comment_lines(head_src), docstring_and_comment_lines(lane_src)
matcher = difflib.SequenceMatcher(a=head_src.splitlines(), b=lane_src.splitlines(), autojunk=False)
changed, outside = 0, []
for tag, i1, i2, j1, j2 in matcher.get_opcodes():
    if tag != "equal":
        changed += (i2 - i1) + (j2 - j1)
        outside += [("head", n) for n in range(i1 + 1, i2 + 1) if n not in head_ok]
        outside += [("lane", n) for n in range(j1 + 1, j2 + 1) if n not in lane_ok]
print(f"changed lines (head side + lane side): {changed}; outside the module docstring and # comments: {outside}")
for ln in difflib.unified_diff(head_src.splitlines(), lane_src.splitlines(), "head", "lane", lineterm="", n=0):
    print(f"  {ln}")

# ------------------------------------------------------------------ C
print("\n=== C. store probe: data/explanations, head lint vs lane lint")


def cli(path: Path, strict: bool):
    t = time.perf_counter()
    r = subprocess.run([sys.executable, str(path), *(["--strict"] if strict else []), str(LANE / "data/explanations")],
                       capture_output=True, text=True)
    lines = r.stdout.splitlines()
    return r.returncode, [ln for ln in lines if ln.startswith("L2-")], [ln for ln in lines if not ln.startswith("L2-")], \
        time.perf_counter() - t


for strict in (False, True):
    mode = "--strict" if strict else "default"
    (hc, hf, hs, ht), (lc, lf, ls, lt) = cli(head_lint, strict), cli(LANE / LINT, strict)
    print(f"{mode}: head exit {hc}, {len(hf)} finding(s), {hs}, {ht:.2f}s")
    print(f"{' ' * len(mode)}  lane exit {lc}, {len(lf)} finding(s), {ls}, {lt:.2f}s")
    print(f"{' ' * len(mode)}  finding lines identical, same order: {hf == lf}")
    if not strict:
        for ln in lf:
            print(f"    {ln}")

# ------------------------------------------------------------------ D
print("\n=== D. label sources")
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts/tests"))
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts"))
import lint_learner_output as lint  # noqa: E402
import test_lint_rendered_view_round7 as r7  # noqa: E402
import test_verdict_enum_and_label_vocabulary_round5 as r5  # noqa: E402

sources = r5.label_sources()
print(f"round 5 label_sources(): {sum(len(v) for v in sources.values())} (source, label) pairs, "
      f"{len({lab for v in sources.values() for lab in v})} distinct labels")
print(f"round 7 labels() (label sources + vocabulary): {len(r7.labels())}")
missed = sorted({lab for v in sources.values() for lab in v if not r5._flags(lab)})
print(f"labels the default lint does not flag: {missed}")


def doc_caps(text: str) -> set:
    return {m.group(0) for line in text.splitlines() for m in lint._SNAKE_TOKEN.finditer(line)
            if m.group(0).isupper() and m.group(0) not in r5.NOT_LABELS and r5._is_label_shaped(m.group(0))}


head_doc_caps = doc_caps(git("show", f"HEAD:{DOC}"))
lane_doc_caps = doc_caps((LANE / DOC).read_text(encoding="utf-8"))
print(f"LAYER2-RENDERING.md ALL_CAPS tokens: head {sorted(head_doc_caps)}, lane {sorted(lane_doc_caps)}, "
      f"identical: {head_doc_caps == lane_doc_caps}")

# ------------------------------------------------------------------ E
print("\n=== E. raw characters in the changed files")
DEFAULT_IGNORABLE_EXTRA = {0x034F, 0x115F, 0x1160, 0x17B4, 0x17B5, 0x3164, 0xFFA0} | set(range(0x180B, 0x1810)) \
    | set(range(0xFE00, 0xFE10)) | set(range(0xE0100, 0xE01F0))


def odd(c: str) -> bool:
    cat = unicodedata.category(c)
    return (cat in ("Cf", "Co", "Cs", "Mn", "Me", "Mc") or ord(c) in DEFAULT_IGNORABLE_EXTRA
            or (cat == "Zs" and c != " ") or (cat == "Cc" and c not in "\n\t"))


for rel in (LINT, DOC, NEW_TEST):
    bad = [(n, f"U+{ord(c):04X}") for n, line in enumerate((LANE / rel).read_text(encoding="utf-8").splitlines(), 1)
           for c in line if odd(c)]
    print(f"  {rel}: {'clean' if not bad else bad[:20]}")
REPORT.close()
```

### Appendix D — `inspect_mathtext.py` (SHA-256 `adf14f0a46cbb889475e6d09642841ba50dc82ea1980105a6f2d678b8fa8e3ec`)

Where MathText.tsx's delimiters, raw-HTML sink, text children and KaTeX options sit (section 1).

```python
"""Read-only: how MathText.tsx spells its math delimiters, and where its
raw-HTML sink and text children sit. usage: inspect_mathtext.py <lane-root>"""
import sys
from pathlib import Path

src = (Path(sys.argv[1]) / "app/src/components/MathText.tsx").read_text(encoding="utf-8")
lines = src.splitlines()
for n, line in enumerate(lines, 1):
    if "MATH_OPEN =" in line or "MATH_CLOSE =" in line:
        print(n, ascii(line))
print("U+E000 count", src.count(chr(0xE000)), "U+E001 count", src.count(chr(0xE001)))
for needle in ("dangerouslySetInnerHTML", "DangerouslySetInnerHtml", "{seg.text}", "{children}",
               "renderToString", "throwOnError", "seg.math"):
    print(repr(needle), [n for n, line in enumerate(lines, 1) if needle in line])
```

### Appendix E — `check_chars_r8.py` (SHA-256 `95c4a5d48e2aded0ec24692ffc59071ace465e7833d69a30784b06d5ffb57732`)

No raw invisible, private-use, combining or unusual space character in the changed files; any backslash-u sequence listed (section 9).

```python
"""Read-only: the changed files of bead hpf-4xvy hold no raw invisible (Cf or
other default-ignorable), private-use, surrogate, combining, unusual space or
control character, and show where a backslash-u sequence sits.

usage: check_chars_r8.py <lane-root>
"""
import sys
import unicodedata
from pathlib import Path

LANE = Path(sys.argv[1])
FILES = ("pipeline/synthetic/gates/scripts/lint_learner_output.py",
         "pipeline/synthetic/LAYER2-RENDERING.md",
         "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py",
         "docs/worklog/hpf-4xvy.md")
EXTRA_IGNORABLE = ({0x034F, 0x115F, 0x1160, 0x17B4, 0x17B5, 0x3164, 0xFFA0} | set(range(0x180B, 0x1810))
                   | set(range(0xFE00, 0xFE10)) | set(range(0xE0100, 0xE01F0)))
BACKSLASH_U = chr(0x5C) + "u"


def odd(c):
    cat = unicodedata.category(c)
    return (cat in ("Cf", "Co", "Cs", "Mn", "Me", "Mc") or ord(c) in EXTRA_IGNORABLE
            or (cat == "Zs" and c != " ") or (cat == "Cc" and c not in "\n\t"))


for rel in FILES:
    text = (LANE / rel).read_text(encoding="utf-8")
    bad = [(n, f"U+{ord(c):04X}") for n, line in enumerate(text.splitlines(), 1) for c in line if odd(c)]
    escapes = [(n, line.strip()[:100]) for n, line in enumerate(text.splitlines(), 1) if BACKSLASH_U in line]
    print(f"{rel}: {'clean' if not bad else bad[:20]}")
    for n, line in escapes:
        print(f"    backslash-u on line {n}: {line}")
```

### Appendix F — `append_appendices_r8.py` (SHA-256 `c5399088b1ee80bce2aa8afc7b9e421b793ddb2c1c791f274b5edc8e37ae5af8`)

This appendix list.

```python
"""Append each probe script's exact source, with its SHA-256, to the worklog's
"## Appendices" section. Idempotent: anything after the section's intro
paragraph is cut first. usage: append_appendices_r8.py <worklog-path> <scratch-dir>"""
import hashlib
import sys
from pathlib import Path

WORKLOG = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
APPENDICES = [
    ("A", "r8_probe.py", "The R8 inputs, their siblings and two controls, read by the lane lint, by "
                         "markdown-it-py's CommonMark and by MathText (section 3)."),
    ("B", "red_first_r8.py", "The two pins and the whole file on scratch trees: control, a Markdown "
                             "dependency, a raw-HTML text branch, and both (section 5)."),
    ("C", "evidence_r8.py", "HEAD and the changed files, the lint head vs lane (AST and diff), the store "
                            "probe, the label sources and raw characters (sections 6 and 7)."),
    ("D", "inspect_mathtext.py", "Where MathText.tsx's delimiters, raw-HTML sink, text children and KaTeX "
                                 "options sit (section 1)."),
    ("E", "check_chars_r8.py", "No raw invisible, private-use, combining or unusual space character in the "
                               "changed files; any backslash-u sequence listed (section 9)."),
    ("F", "append_appendices_r8.py", "This appendix list."),
    ("G", "fix_worklog_line.py", "The one-off rewrite of the line the write tool had changed (section 9)."),
]
MARK = "## Appendices\n"
FENCE = "`" * 3

text = WORKLOG.read_text(encoding="utf-8")
head, sep, tail = text.partition(MARK)
assert sep, "no '## Appendices' heading"
intro = tail.split("\n### Appendix ", 1)[0].rstrip("\n") + "\n"
out = [head, MARK, intro]
for letter, name, what in APPENDICES:
    data = (SCRATCH / name).read_bytes()
    source = data.decode("utf-8")
    assert FENCE not in source, name
    out.append(f"\n### Appendix {letter} — `{name}` (SHA-256 `{hashlib.sha256(data).hexdigest()}`)\n\n"
               f"{what}\n\n{FENCE}python\n{source.rstrip()}\n{FENCE}\n")
WORKLOG.write_text("".join(out), encoding="utf-8")
print(f"appended {len(APPENDICES)} appendices to {WORKLOG}")
```

### Appendix G — `fix_worklog_line.py` (SHA-256 `82907aa7c254d8f84d8e6482a0c201d8b051b2702ad35497e868bb1f37b01877`)

The one-off rewrite of the line the write tool had changed (section 9).

```python
"""One-off: rewrite the worklog line where the write tool turned a written
backslash-u escape into a raw U+E000. Every special character is built with
chr(). usage: fix_worklog_line.py <worklog-path>"""
import sys
from pathlib import Path

p = Path(sys.argv[1])
lines = p.read_text(encoding="utf-8").split("\n")
old = "- the delimiters as `" + chr(0xE000) + "` and as `" + chr(0x5C) + "u{E001}` escapes;"
hits = [i for i, line in enumerate(lines) if line.strip() == old]
assert len(hits) == 1, hits
i = hits[0]
indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
lines[i] = indent + "- the delimiters as JS unicode escapes, in the plain and in the braced form;"
p.write_text("\n".join(lines), encoding="utf-8")
print(f"rewrote line {i + 1}: {lines[i].strip()}")
```

## Bead note (pending)

`bd update hpf-4xvy --append-notes …` failed on 2026-10-06: "failed to open database: Dolt server unreachable at 127.0.0.1:53381: dial tcp 127.0.0.1:53381: connect: connection refused" (dolt.auto-start: false). Per the bead it was not retried, and no server was started. The close with `gc.outcome=pass` is pending for the same reason. The exact note text is the 2 lines below (538 characters).

R8 fix, uncommitted on 9d1fd11: threat model aligned to MathText (plain text + KaTeX for U+E000/U+E001); M*/H* rows needing Markdown/HTML rendering reclassified n/a, markup view = best-effort defense in depth (LAYER2-RENDERING.md). New test_lint_renderer_assumption_round8.py pins app/package.json + MathText.tsx, red-first on scratch trees; R8 H1/M6/H2 + 3 siblings = strict xfails. Lint comments only, AST-identical. Gates 758 passed/6 xfailed, CI 828/6; store 2 in 27, --strict 74. Evidence docs/worklog/hpf-4xvy.md
LANE DONE: hpf-4xvy
