# hpf-dhjn — PR #370 fix round 9: MathText's KaTeX-exception fallback renders as text, not HTML; pinned

Origin: Codex review R9, hpf-wov1, finding [FIX-INCOMPLETE][high], on PR #370 (pipeline hardening, origin
bead hpf-y1p4). Operator decision 2026-10-06: fix inside PR #370. R9 showed that `MathText`'s
`renderMath()` caught a KaTeX exception and returned the raw segment, which the caller inserted with
`dangerouslySetInnerHTML`. Round 8 (hpf-4xvy) had made MathText's behaviour the Layer-2 threat-model
boundary, so the fallback has to be safe. `docs/worklog/hpf-4xvy.md` is history and is not edited; its
residual 3 ("The KaTeX fallback") is what this round closes.

- Lane: `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`.
- `git rev-parse HEAD` = `4eabf63147979e182de61696003edf5a430f5a53`, verified first.
- All changes are UNCOMMITTED. No git commit, checkout, stash, reset or push.

Notation: `U+XXXX` names one code point. This file holds no raw invisible, combining, bidi or
private-use character and no backslash-u sequence (check in section 9).

## Outcome

- **The fallback is text.** `renderMath` now returns a discriminated result,
  `{ html: string } | { text: string }`, and its `catch` returns `{ text: latex }`. A new
  `MathSegment` component renders the `html` case through the file's one `dangerouslySetInnerHTML`.
  It renders the `text` case as a React text child of the same `<span role="math" aria-label=…>`, so
  React escapes it.
  - The `throwOnError: false` path is unchanged, and so is `aria-label` (`flattenLatex` on both
    branches).
  - The DOM for normal math is unchanged. A test asserts that it is KaTeX's own HTML, character for
    character.
- **Vitest, red-first.** 5 new tests in `MathText.test.tsx`:
  - The 2 exception-path tests (a mocked throw, and R9's deep nesting with the real KaTeX) were
    written first and failed on HEAD's component. In both, the segment's markup became a live
    `<span>`. They pass on the fix.
  - The 3 KaTeX guards pass on both: normal math, units, and KaTeX's own parse-error rendering.
  - Full app suite: **757 → 762 passed, 75 files**.
- **Typecheck and Biome.**
  - The project's `tsc -b --noEmit` runs offline but exits 2 with 165 diagnostics. All of them are in
    `../worker/src`, whose dependencies are not installed in the lane.
  - The diagnostic set is identical with HEAD's MathText files, and none is in `app/src`.
  - `biome check` on the two files is clean.
- **The pin is extended.** `test_lint_renderer_assumption_round8.py`'s MathText check now pins the
  flow into the sink. It fails with "learner renderer changed — revisit the Layer-2 threat model in
  LAYER2-RENDERING.md" if any path, the KaTeX fallback included, can hand segment text to
  `dangerouslySetInnerHTML`. Section 4 gives the shape and its justification.
  - New self-tests: 5 mutants (one of them R9's own shape) and 4 cosmetic changes.
  - One test backs the contract's new claim.
  - The file goes from 52 to 62 tests: 56 pass and 6 are strict xfails.
- **Red-first for the pin** (scratch trees, section 5):
  - The new pin is red on HEAD's `MathText.tsx` and on three targeted fallback variants of the fix,
    and green on the fix.
  - Round 8's pin was green on HEAD's file, which is how R9 got through. It is red on the fix: it
    fails closed on the new shape.
- **The contract.** `LAYER2-RENDERING.md` gets a section, "KaTeX-reservvägen (PR #370 rond 9, bead
  hpf-dhjn)": the failure path renders the segment as literal text, so the literal-text lint covers
  it. Round 8's pin bullet had a clause about the injecting fallback, and that clause is revised.
- **The lint is unchanged.** `lint_learner_output.py` is byte-identical to HEAD's. The store probe
  gives default **2 findings in 27 files** and `--strict` **74**.
- **Suites.**
  - Gate suite: **768 passed, 6 xfailed** (bead baseline 758 + 10).
  - The exact CI command: **838 passed, 6 xfailed** (bead baseline 828 + 10).

## Changed files (uncommitted)

| file | change | SHA-256 | blob |
|---|---|---|---|
| `app/src/components/MathText.tsx` | `renderMath` returns `{ html } \| { text }`; new `MathSegment` renders the fallback as React text; comments | `e0f6bebde60da68bd12df2354fa4576dfe78caad4b876f50b71159e85e36639b` | `e3f9fe4` |
| `app/src/components/MathText.test.tsx` | 5 new tests: 2 on the exception path (red-first), 3 KaTeX guards | `81d6d24c42541008fcc4d38969dfd30ba6bbcdcd6231cdecff24252108ff4a80` | `2fcfd1e` |
| `pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py` | the MathText check pins the flow into the sink; 9 self-tests and 1 literal-text test added | `8a5cee7295fee7af4cc92b7b4e6efdeefa9060661a80915b6dead5a375b3ad1c` | `ced0d2a` |
| `pipeline/synthetic/LAYER2-RENDERING.md` | new round-9 section; round 8's pin bullet revised | `7af88619e9a58b4ed3b686ecbe7f6cb226bc196f18ef4ea38cb6f9924017f8e4` | `56bdeff` |
| `docs/worklog/hpf-dhjn.md` | this file | — | — |

Nothing else was touched: no other file in `app/`, nothing in `worker/`, and not the lint. These were
already there and are left alone:
- the untracked dotfiles at the lane root (`.bashrc`, `.gitconfig`, `.mcp.json`, …). They are in this
  session's first `git status`, before any edit;
- `.claude/skills/*`, `.agents/`, `.codex/` and `.gc/`;
- `app/node_modules` and the ignored caches.

---

## 1. The finding, reproduced

**KaTeX** (`katex_probe.mjs`, appendix A). This is the lane's locked KaTeX, with MathText's options,
on R9's segment, `\frac{` n times + `WORLD_<span title=">">KNOWLEDGE</span>` + `}` n times:

```
katex 0.16.45 from /home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane/app/node_modules/katex/dist/katex.mjs
node v22.17.0
frac depth 10: no throw, 2.3 ms, katex-error=true, raw markup in output=false, length 345
frac depth 100: no throw, 2.9 ms, katex-error=true, raw markup in output=false, length 983
frac depth 500: no throw, 8.6 ms, katex-error=true, raw markup in output=false, length 3784
frac depth 834: no throw, 15.5 ms, katex-error=true, raw markup in output=false, length 6122
frac depth 835: no throw, 13.3 ms, katex-error=true, raw markup in output=false, length 6129
frac depth 1000: THROWS RangeError (ParseError: false), 18.2 ms, message "Maximum call stack size exceeded"
frac depth 2000: THROWS RangeError (ParseError: false), 42.5 ms, message "Maximum call stack size exceeded"
frac depth 5000: THROWS RangeError (ParseError: false), 96.9 ms, message "Maximum call stack size exceeded"
frac depth 20000: THROWS RangeError (ParseError: false), 437.8 ms, message "Maximum call stack size exceeded"
frac depth 100000: THROWS RangeError (ParseError: false), 52.5 ms, message "Maximum call stack size exceeded"
parse error (unterminated group): no throw, 0.2 ms, katex-error=true, raw markup in output=false, length 271
plain markup, no math commands: no throw, 2.2 ms, katex-error=false, raw markup in output=false, length 3118
normal math x^{2} - 15: no throw, 0.2 ms, katex-error=false, raw markup in output=false, length 860
```

- **R9 is confirmed, with one nuance.** Deep enough, KaTeX throws a `RangeError`. That is not a
  `ParseError`, so `throwOnError: false` does not catch it. KaTeX's `renderError` rethrows every
  non-`ParseError` (`if (options.throwOnError || !(error instanceof ParseError)) { throw error; }`,
  `app/node_modules/katex/dist/katex.mjs` line 16376), and the error reaches MathText's `catch`.
- **The nuance.** Here, on plain Node 22.17, R9's 835 levels do not overflow. KaTeX renders them as a
  parse error (`katex-error`), and the overflow starts between 835 and 1000. The threshold depends on
  the stack: its size, and how deep the caller already is. So the tests below use 20 000 levels and
  assert the throw as a precondition.
- **The safe paths.** A parse error, plain markup and normal math come back as KaTeX's HTML, with no
  raw markup in it: KaTeX escapes the source text.

**MathText.** At HEAD, the exception reaches `renderMath`'s `catch`, which returns `latex` into
`dangerouslySetInnerHTML`. The red-first run in section 3 shows the result in jsdom: an element made
from the segment's `<span title=">">`, inside the `role="math"` span.

## 2. The fix (`app/src/components/MathText.tsx`)

Condensed: comments abridged, the `biome-ignore` line left out, the sink's JSX attributes joined.

```tsx
type RenderedMath = { html: string } | { text: string }

function renderMath(latex: string): RenderedMath {
  try {
    return {
      html: katex.renderToString(wrapUnits(latex), {
        output: 'html',
        throwOnError: false,
        strict: 'ignore',
      }),
    }
  } catch {
    // (comment: a parse error stays KaTeX's; other exceptions land here;
    //  the raw segment goes back as text for React to escape)
    return { text: latex }
  }
}

function MathSegment({ latex }: { latex: string }) {
  const math = renderMath(latex)
  return 'html' in math ? (
    <span role="math" aria-label={flattenLatex(latex)}
      dangerouslySetInnerHTML={{ __html: math.html }} />
  ) : (
    <span role="math" aria-label={flattenLatex(latex)}>
      {math.text}
    </span>
  )
}
```

The segment map renders `<MathSegment key={idx} latex={seg.text} />` for a math segment. The text
branch, the fast path, the segmenting loop and the delimiters are unchanged.

- **This is the bead's preferred shape.** The result is discriminated, and the fallback is a React
  text node. There is no hand-written escaper: React escapes text children, and a text child cannot
  become markup.
- **The types help.** With `RenderedMath`, TypeScript rejects a `catch` that returns the bare
  segment, which was R9's `return latex`. A mislabelled `{ html: latex }` would still type-check. The
  pin (section 4) catches that one.
- **The rendered output is the same.**
  - For normal math the DOM is unchanged: `<span role="math" aria-label="…">` holding KaTeX's HTML.
    `MathSegment` is a function component, so it adds no DOM.
  - `renderMath` runs once per render, as before.
  - The fallback span keeps `role="math"` and the flattened `aria-label`.
- **Comments.**
  - The old `catch` comment ("throwOnError:false should cover this") was wrong. It now says what does
    and does not get through.
  - The old sink comment said "no user text ever reaches `seg.text`", but Layer-2 store text does.
    It is replaced by the actual guarantee: KaTeX's output is the only HTML inserted. The new comment
    names the contract and the pin.

## 3. The app tests

**New tests** (`app/src/components/MathText.test.tsx`). Delimiters come from the file's existing `M()`
helper. `MARKUP` is R9's payload, `WORLD_<span title=">">KNOWLEDGE</span>`.

| test | checks | HEAD | fix |
|---|---|---|---|
| when KaTeX throws: shows the segment as text, not HTML | `vi.spyOn(katex, 'renderToString')` throws a `RangeError`. The `role="math"` span has no element children, the container has no `[title]` element, its `textContent` is the literal markup and its `aria-label` is `flattenLatex(segment)` | **fails** (`childElementCount` 1) | passes |
| when KaTeX throws: R9's deep-nesting segment, real KaTeX | 20 000 levels of `\frac{` around `MARKUP`. Precondition: `katex.renderToString(segment, options)` throws `RangeError`. Then the same assertions as above | **fails** (`childElementCount` 1) | passes |
| with KaTeX: typesets a math segment as KaTeX HTML, without MathML | `innerHTML` equals KaTeX's HTML for `x^{2} - 15` (parsed and serialized the same way), with `.katex-html` present, `.katex-mathml` absent and `aria-label` `x^2 - 15` | passes | passes |
| with KaTeX: sets multi-letter units upright | `12 dm^{3}` renders exactly as KaTeX's `12 \mathrm{dm}^{3}` | passes | passes |
| with KaTeX: leaves a parse error to KaTeX's own error rendering, as text | `\frac{` + `MARKUP` renders as KaTeX's HTML. The `.katex-error` span's text is the segment, and no `[title=">"]` element exists | passes | passes |

**Red-first in the lane.** The tests were written first and run against HEAD's component. This is an
excerpt of the Vitest output, with `src/components/MathText.test.tsx` shortened to `…` in the FAIL
lines and the diff blocks left out:

```
 ❯ src/components/MathText.test.tsx (16 tests | 2 failed) 1221ms
     × shows the segment as text, not HTML 12ms
     × shows the R9 deep-nesting segment as text, with the real KaTeX 1139ms
 FAIL  … > MathText when KaTeX throws > shows the segment as text, not HTML
AssertionError: expected 1 to be +0 // Object.is equality
 ❯ expectShownAsText src/components/MathText.test.tsx:90:37
     90|     expect(math?.childElementCount).toBe(0)
 FAIL  … > MathText when KaTeX throws > shows the R9 deep-nesting segment as text, with the real KaTeX
AssertionError: expected 1 to be +0 // Object.is equality
      Tests  2 failed | 14 passed (16)
```

After the fix: `Tests  16 passed (16)`.

**Reproduced on scratch trees** (`vitest_red_first.py`, appendix B). Both trees copy `app/src` and the
app's config files, link `node_modules`, and hold the new test file. The `head` tree has HEAD's
`MathText.tsx` (`cc52f74f…`): **14 passed, 2 failed**, the same two tests with the same assertion. The
`fix` tree has the lane's (`e0f6bebd…`): **16 passed**.

**The whole app suite** (`cd app && npx vitest run`):

| run | test files | tests |
|---|---|---|
| HEAD, before any edit | 75 passed | **757 passed** |
| lane, final files | 75 passed | **762 passed** (+5) |

**Typecheck** (`tsc_compare.py`, appendix C). The project's script is `tsc -b --noEmit`, TypeScript
5.8.3. It runs offline and exits 2 with 165 diagnostics in 27 files, all under `../worker/src`:

- the codes are TS2307 ×65 (`hono`, `drizzle-orm`, `zod`, `@sentry/cloudflare`, …), TS7006 ×55,
  TS18046 ×42, TS2345, TS2571 and TS7031;
- the cause: `app/src/api/client.ts` imports the worker's `AppType`, and `worker/` has no
  `node_modules` in the lane, so this is the environment, not this round;
- to show that, the app and worker sources were copied into two scratch trees, `control` with the
  lane's MathText files and `head` with HEAD's. `tsc -p tsconfig.app.json --noEmit` and
  `-p tsconfig.node.json` gave the same diagnostic set in the lane, in `control` and in `head`;
- in all three, no diagnostic is outside `../worker/`, none is in a MathText file, and the node
  project is clean.

**Biome** 2.4.14, `npx biome check src/components/MathText.tsx src/components/MathText.test.tsx`:
`Checked 2 files … No fixes applied.`

## 4. The pin: what it checks, and why this shape

Round 8's MathText check required exactly one sink, written `{{ __html: renderMath(seg.text) }}`. It
trusted `renderMath`'s return value, so `return latex` in the `catch` passed: that is how R9 got
through a green pin. Round 9 pins the flow into the sink, end to end. `mathtext_problems()` runs on
the comment-stripped source (round 8's `_code`) and now requires:

1. **One sink, fed by one field.** Exactly one `dangerouslySetInnerHTML`, written
   `{{ __html: <v>.html }}`, where `<v>` is a `const` bound to `renderMath(…)`.
2. **Only KaTeX fills that field (new).** In the whole file, a key `html` (after `{`, a comma or `;`)
   occurs exactly once as `html: katex.renderToString(`. Every other occurrence is a type annotation,
   `html: string`. A shorthand `{ html }`, a computed `['html']` and an assignment (`.html =`, `+=`,
   `??=`, `||=`, `&&=`) all fail. So no path can give the sink anything but KaTeX's return value: not
   the `catch`, not a guard in the `try`, not a helper elsewhere in the file.
3. **The fallback is text (new).** The file's one `catch` returns `{ text: … }` and does not mention
   `html`, and a `renderMath` result's text is rendered as `<span …>{<v>.text}</span>`. That is the
   contract's claim that a failure shows the segment as literal text.
4. **The segments.** `seg.math ? (<MathSegment … latex={seg.text} … />) : (<span …>{seg.text}</span>)`.
   This is round 8's branch check, re-anchored on the new math branch. A negated `!seg.math` still
   does not match.
5. **Unchanged.** The delimiters (U+E000 and U+E001, raw or escaped); the fast path
   `return <>{children}</>`; `katex.renderToString` with every `throwOnError` set to `false`. The
   last check's message now gives its current reason: it keeps a parse error in KaTeX's own escaped
   rendering.

**Why this shape.**

- **It pins the property, not the symptom.** R9 was a value of the wrong kind flowing into the sink.
  Check 2 forbids every other writer of the sink's field; it does not look for R9's `return latex`.
  That is why `fallback-as-html` and `html-not-only-katex` are red, although neither looks like R9's
  code (table below).
- **It is file-wide, not scoped to `renderMath`.** A fallback moved to a helper, or a second object
  with an `html` key, is still seen. There is also no brace-matching of function bodies to get
  wrong; only the one `catch` block is read, by a bounded regex.
- **It works with the types.** `RenderedMath` makes TypeScript reject a bare string from `renderMath`.
  The pin covers what the types cannot: a mislabelled `{ html: latex }`, and a sink that reads `.text`.
- **It ignores cosmetic changes.** Comments are stripped and the regexes tolerate whitespace and a
  trailing comma. The 8 cosmetic self-tests pass: four from round 8, plus a renamed result variable,
  a `catch (error)` binding that logs, an inline result type and a reformatted sink.
- **It fails closed.** A refactor it does not model trips it with the required sentence, and the
  message names what to re-check. Examples: `html` written another way, a second sink, or the
  fallback leaving `<span>{x.text}</span>`. This is round 8's stated trade-off (hpf-4xvy, residual 2).
- **It is not a proof.** It is a static check of one file's source, not a data-flow analysis.
  Deliberate obfuscation is not modelled: an object built elsewhere and spread in, a key in a
  variable, `Reflect.set`, `JSON.parse` (residual 1).

**Self-tests** (`red_first_r9.py`, appendix D, section "the self-tests"): which checks catch each
mutant of today's file.

| mutant | anchor change | caught by |
|---|---|---|
| text-branch-raw-html | text span gets `dangerouslySetInnerHTML={{ __html: seg.text }}` | 1 (two sinks), 4 |
| text-branch-markdown | text span becomes `<Markdown>` | 4 |
| fast-path-raw-html | fast path as raw HTML | 1 (two sinks), 5 |
| fast-path-markdown | fast path through `<Markdown>` | 5 |
| math-branch-raw-text | sink `__html: latex` | 1 |
| branches-swapped | `!seg.math ? (` | 4 |
| katex-throws-into-the-fallback | `throwOnError: true` | 5 |
| dollar-delimiter | `'$'` as `MATH_OPEN` | 5 |
| **r9-raw-segment-into-the-sink** | `catch` returns `latex` and the sink takes `renderMath(latex)`: R9's shape | 1, 3 |
| **fallback-as-html** | `catch` returns `{ html: latex }` | 2, 3 |
| **fallback-into-a-second-sink** | `{math.text}` becomes a span with `dangerouslySetInnerHTML={{ __html: math.text }}` | 1 (two sinks), 3 |
| **sink-takes-the-fallback** | sink `__html: 'html' in math ? math.html : math.text` | 1 |
| **html-not-only-katex** | `html: latex.length > 4096 ? latex : katex.renderToString(` | 2 |

Bold rows are new. `math-branch-raw-text` is re-anchored on the new sink, since its round-8 anchor
`__html: renderMath(seg.text)` is gone. `_mutated` now takes a list of anchor changes, so R9's shape
can be built in two steps. Its skip on a broken base and its anchor message are unchanged.

**Literal-text coverage** (section 3 of the test file, new):
`test_the_lint_reads_a_segment_katex_throws_on_as_literal_text`. A 1 000-level segment holding
`WORLD_KNOWLEDGE` gets exactly one L2-SNAKE finding from the lint. This backs the contract's claim
that what the fallback shows, the scanned text without its delimiters, is read by the literal-text
lint. It tests the unchanged lint, so it would pass at HEAD too: it supports the contract and is not
a red-first test of the fix.

## 5. Red-first for the pin (`red_first_r9.py`, appendix D)

Each scratch tree copies the five files the pin file reads, at their repository paths: `package.json`,
`MathText.tsx`, the contract, the lint and the pin file. The lane's tracked files were never
modified.

| tree | `MathText.tsx` | pin file and contract | the MathText pin | the whole file |
|---|---|---|---|---|
| fix | lane | lane | passed | **56 passed, 6 xfailed** |
| old-fallback | HEAD (`cc52f74f…`) | lane | **FAILED**, 4 problems | 1 failed, 34 passed, 21 skipped, 6 xfailed |
| fallback-as-html | lane, `catch` returns `{ html: latex }` | lane | **FAILED**: checks 2 and 3 only | 1 failed, 34 passed, 21 skipped, 6 xfailed |
| sink-takes-the-fallback | lane, sink also takes `math.text` | lane | **FAILED**: check 1 | 1 failed, 34 passed, 21 skipped, 6 xfailed |
| r9-shape-in-the-fix | lane, `catch` returns `latex`, sink takes `renderMath(latex)` | lane | **FAILED**: checks 1 and 3 | 1 failed, 34 passed, 21 skipped, 6 xfailed |
| round8-pin-on-old | HEAD | HEAD | passed: **round 8 missed R9** | 46 passed, 6 xfailed |
| round8-pin-on-fix | lane | HEAD | **FAILED**: fails closed on the new shape | 1 failed, 33 passed, 12 skipped, 6 xfailed |

Every failure message and every skip reason carries the required sentence. The new pin on HEAD's
file:

```
AssertionError: learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md (app/src/components/MathText.tsx: 1 dangerouslySetInnerHTML, where exactly one is allowed, fed by the html of a renderMath result ({ __html: math.html }, const math = renderMath(…)); the html the raw-HTML sink takes is no longer filled by katex.renderToString alone, so the KaTeX fallback or another path can feed segment text to dangerouslySetInnerHTML (round 9); when KaTeX throws, renderMath's catch no longer hands the segment back as { text } for MathText to show as React text, <span>{math.text}</span> (round 9); the segments are no longer rendered as seg.math ? (<MathSegment latex={seg.text} />) : (<span>{seg.text}</span>))
```

The 21 skips are the MathText self-tests (13 mutants, 8 cosmetic changes), which skip on a base that
already breaks the assumption (round 8's design).

Also observed in the lane: after the component fix and before the pin update, round 8's pin file
gave **1 failed, 33 passed, 12 skipped, 6 xfailed**, with the required sentence. That is the
fail-closed row above, seen on the real tree.

## 6. The contract (`pipeline/synthetic/LAYER2-RENDERING.md`)

- **The new section "KaTeX-reservvägen (PR #370 rond 9, bead hpf-dhjn)"** states:
  - R9's mechanism: `throwOnError: false` covers parse errors only, and a deep `\frac{` nesting throws
    a `RangeError`, whose depth depends on the stack;
  - that the old fallback made the segment's markup live;
  - **"Reservvägen är text"**: if KaTeX throws, MathText shows the segment as React text, character
    for character, without U+E000 and U+E001. That is the segment's source, which the scanned text
    holds, so the literal-text lint (the scanned text and the plain view) covers the failure path;
  - that parse errors are unchanged, since KaTeX renders them itself as escaped source, which is also
    literal text;
  - what the pin now checks;
  - that the lint is unchanged.
- **Round 8's pin bullet is revised.** It ended with "eller ett KaTeX som får kasta fel in i
  reservvägen som lägger in segmentets råtext som HTML", which described the fallback that is gone.
  It now reads "ett som matas med annat än KaTeX:s utdata (sedan rond 9 även via reservvägen, se
  nedan), eller ett KaTeX som får kasta parsningsfel i stället för att sätta dem själv
  (`throwOnError`)".
- **No new label tokens.** Round 5's coverage test harvests the ALL_CAPS snake tokens of pipeline
  `.md` files as labels. The contract's set is identical before and after: `SCOPE_SHIFT`,
  `WORLD_KNOWLEDGE` and `WORLD__KNOWLEDGE` (section 7). R9's payload was already quoted in round 8's
  section, so the label set does not grow.

## 7. Suites, and the lint unchanged (`evidence_r9.py`, appendix E)

| run | baseline at HEAD (bead) | lane, final files |
|---|---|---|
| `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` | 758 passed, 6 xfailed | **768 passed, 6 xfailed** |
| `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q` (the exact CI command) | 828 passed, 6 xfailed | **838 passed, 6 xfailed** |
| the pin file alone | 46 passed, 6 xfailed (HEAD's file, `round8-pin-on-old` tree) | **56 passed, 6 xfailed** |

The 10 new passing tests are all in the pin file: 5 mutants, 4 cosmetic changes and 1 literal-text
test. The 6 xfails are round 8's R8 record, unchanged.

```
=== B. the lint
lane lint byte-identical to HEAD's: True (SHA-256 0d0455e73e5bc0992eb6d6c05e29a81340e83a8f7c2c400bdfedf7eca8805aeb)
default: exit 1, 2 finding(s), ['learner-output lint: 2 finding(s) in 27 file(s)']
    L2-HEDGAT …/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.distractors[2].why_wrong: …v. Och "i vissa avseenden" är hedgning som inte fångar förstärkninge…
    L2-HEDGAT …/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.steps[2].text: …kvens. "I vissa avseenden" är hedgning.…
--strict: exit 1, 74 finding(s), ['learner-output lint: 74 finding(s) in 27 file(s)']

=== C. ALL_CAPS snake tokens in LAYER2-RENDERING.md (round 5's doc label source)
head ['SCOPE_SHIFT', 'WORLD_KNOWLEDGE', 'WORLD__KNOWLEDGE'], lane ['SCOPE_SHIFT', 'WORLD_KNOWLEDGE', 'WORLD__KNOWLEDGE'], identical: True

=== D. raw characters, head vs lane
  app/src/components/MathText.tsx
    odd characters: head {'U+200B': 1, 'U+E000': 1, 'U+E001': 1}, lane {'U+200B': 1, 'U+E000': 1, 'U+E001': 1}, same: True
    backslash-u lines: head [], lane [], same count: True
  app/src/components/MathText.test.tsx
    odd characters: head {}, lane {}, same: True
    backslash-u lines: head [11, 55], lane [16, 60], same count: True
  pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py
    odd characters: head {}, lane {}, same: True
    backslash-u lines: head [], lane [], same count: True
  pipeline/synthetic/LAYER2-RENDERING.md
    odd characters: head {}, lane {}, same: True
    backslash-u lines: head [], lane [], same count: True
```

Sections B to D are verbatim from the report; the script itself prints the lane path as `…` in the
finding lines. Section A (HEAD, `git status`, the SHA-256s) is in the changed-files table above.

`MathText.tsx` keeps its raw delimiters on lines 28–29, which the edits did not touch and which were
re-checked after each edit, and the U+200B in its header comment, all as at HEAD. The test file's two
backslash-u lines are its existing `M()` helper and unbalanced-delimiter test, moved down by the new
header comment.

## 8. Residual risks

1. **A static check, not a proof.** The pin reads one file's source. It models the realistic ways to
   write an `html` field or a sink, and it fails closed on shapes it does not know. It does not model
   deliberate obfuscation: a spread of an object built elsewhere, a key in a variable,
   `Reflect.set`, `JSON.parse`. Round 8's residuals 1 (components that bypass `MathText`) and 4 (the
   comment stripper and regex literals that hold a quote) are unchanged. `MathText.tsx` has no such
   regex literal.
2. **The stack threshold depends on the environment.** On Node 22.17 here, 835 levels render as a
   parse error and 1 000 throw.
   - The deep Vitest test uses 20 000 levels and asserts the `RangeError` first, so it cannot pass
     vacuously. If a future KaTeX stops throwing on it, the precondition fails loudly and the test
     needs a new trigger.
   - The mocked-throw test covers the fallback independently of KaTeX.
3. **KaTeX's parse-error rendering is trusted** to escape the source, as in round 8. A Vitest guard
   now covers it: the `katex-error` span holds R9's markup as text, and there is no `[title=">"]`
   element.
4. **The fallback shows raw LaTeX source** to the learner, with `role="math"` and the flattened
   `aria-label`. It happens only on pathological input such as deep nesting, and it is safe but not
   pretty. Styling it is out of scope.
5. **Test time.** The deep test takes about 1.1 s, most of the MathText file's runtime.

## 9. Reproduction

```
git rev-parse HEAD   # 4eabf63147979e182de61696003edf5a430f5a53
cd app && npx vitest run src/components/MathText.test.tsx   # 16 passed
cd app && npx vitest run                                    # 75 files, 762 passed
cd app && npx tsc -b --noEmit                               # exit 2: 165 diagnostics, all in ../worker/src
cd app && npx biome check src/components/MathText.tsx src/components/MathText.test.tsx   # clean
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py   # 56 passed, 6 xfailed
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests          # 768 passed, 6 xfailed
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q   # 838 passed, 6 xfailed
# S = a scratch dir; every script is an appendix below
node katex_probe.mjs "$PWD"                                 # A
python3 vitest_red_first.py "$PWD" $S $S/vitest_red_first.txt   # B (writes only under $S/vitest)
python3 tsc_compare.py "$PWD" $S $S/tsc_compare.txt         # C (writes only under $S/tsc)
python3 red_first_r9.py "$PWD" $S $S/red_first_r9.txt       # D (writes only under $S/trees)
python3 evidence_r9.py "$PWD" $S/evidence_r9.txt            # E
python3 check_chars_r9.py "$PWD"                            # F
```

**Coordination note.** The bead's metadata names `gc.check_path`:
`/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`.
Its SHA-256 is `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`, the same digest
as in rounds 5–8. It is the dispatcher's producer-stage gate, and this bead's description names no
validator, so it was hashed and not run.

**Harness notes.**
- Every check ran as one command or as a script file, with no pipelines. The `cd app && …` lines
  above ran as a separate `cd`, then the command.
- `git -C <lane> diff --stat` was refused by the worker permission policy. Plain `git diff --stat`,
  run from the lane, was used instead; the evidence script runs git with the lane as its working
  directory.
- No written file holds a raw private-use character or a backslash-u sequence that is new:
  - the new tests take their delimiters from the test file's existing `M()` helper;
  - `MathText.tsx`'s raw delimiters were never inside an edited region, and `grep -P` re-checked
    them after every edit;
  - the Python scripts build such characters with `chr()`.
- `check_chars_r9.py` (appendix F) ran after the last edit of this file.

## Appendices

Each appendix is the exact source of a probe script, appended from its file by
`append_appendices_r9.py` (appendix G). Its header carries the file's SHA-256 as run. Every script
is read-only towards the lane's tracked files. `vitest_red_first.py`, `tsc_compare.py` and
`red_first_r9.py` write only under the scratch directory.

### Appendix A — `katex_probe.mjs` (SHA-256 `71cd3b7f4a5a6fa3c929282c7f367c073db831dc9b72ec40239728c51ab0e4b7`)

KaTeX 0.16.45 on R9's segment at several nesting depths, with MathText's options (section 1).

```javascript
// Read-only probe for bead hpf-dhjn: how the locked KaTeX (app/node_modules)
// handles Codex R9's deep-nesting segment with MathText's options. For each
// nesting depth: does renderToString throw, which error, is it a ParseError
// (the kind throwOnError:false renders itself), and how long it takes.
// usage: node katex_probe.mjs <lane-root>
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'
import path from 'node:path'

const lane = process.argv[2]
const katexPath = path.join(lane, 'app/node_modules/katex/dist/katex.mjs')
const { default: katex } = await import(pathToFileURL(katexPath).href)
const OPTIONS = { output: 'html', throwOnError: false, strict: 'ignore' }
const MARKUP = 'WORLD_<span title=">">KNOWLEDGE</span>'

console.log(`katex ${katex.version} from ${katexPath}`)
console.log(`node ${process.version}`)

function probe(label, latex) {
  const t = performance.now()
  try {
    const html = katex.renderToString(latex, OPTIONS)
    const ms = (performance.now() - t).toFixed(1)
    console.log(`${label}: no throw, ${ms} ms, katex-error=${html.includes('katex-error')}, ` +
      `raw markup in output=${html.includes(MARKUP)}, length ${html.length}`)
  } catch (e) {
    const ms = (performance.now() - t).toFixed(1)
    console.log(`${label}: THROWS ${e?.constructor?.name} (ParseError: ${e instanceof katex.ParseError}), ` +
      `${ms} ms, message ${JSON.stringify(String(e?.message).slice(0, 80))}`)
  }
}

for (const depth of [10, 100, 500, 834, 835, 1000, 2000, 5000, 20000, 100000]) {
  probe(`frac depth ${depth}`, '\\frac{'.repeat(depth) + MARKUP + '}'.repeat(depth))
}
probe('parse error (unterminated group)', `\\frac{${MARKUP}`)
probe('plain markup, no math commands', MARKUP)
probe('normal math x^{2} - 15', 'x^{2} - 15')
```

### Appendix B — `vitest_red_first.py` (SHA-256 `40755221c822e4b14b2da1b268dd4019e70fcff4359d35807428e143c0853a37`)

The MathText Vitest file on scratch app trees: HEAD's component and the fix (section 3).

```python
"""Vitest red-first for bead hpf-dhjn, reproduced on scratch copies of the app.
Read-only towards the lane: trees go under <scratch>/vitest.

Both trees copy app/src and the app's root config files, link node_modules to
the lane's, and hold the lane's new MathText.test.tsx. They differ only in
MathText.tsx:

  head  MathText.tsx as at HEAD (git show): R9's fallback
  fix   the lane's MathText.tsx

Vitest runs src/components/MathText.test.tsx in each, with the JSON reporter;
the report lists each test's outcome and the first line of any failure.

usage: vitest_red_first.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import builtins
import hashlib
import json
import shutil
import subprocess
import sys
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2]) / "vitest"
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
COMPONENT = "app/src/components/MathText.tsx"
TESTS = "app/src/components/MathText.test.tsx"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def head(rel: str) -> bytes:
    return subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, check=True).stdout


def build(name: str, component: bytes) -> Path:
    root = SCRATCH / name
    if root.exists():
        shutil.rmtree(root)
    shutil.copytree(LANE / "app/src", root / "app/src")
    for f in sorted((LANE / "app").iterdir()):
        if f.is_file() and f.suffix in (".json", ".ts"):
            shutil.copyfile(f, root / "app" / f.name)
    (root / "app/node_modules").symlink_to(LANE / "app/node_modules")
    (root / COMPONENT).write_bytes(component)
    assert (root / TESTS).read_bytes() == (LANE / TESTS).read_bytes()
    return root


print(f"lane {TESTS}: {hashlib.sha256((LANE / TESTS).read_bytes()).hexdigest()}")
for name, component in (("head", head(COMPONENT)), ("fix", (LANE / COMPONENT).read_bytes())):
    root = build(name, component)
    out = SCRATCH / f"{name}.json"
    r = subprocess.run([str(LANE / "app/node_modules/.bin/vitest"), "run", "src/components/MathText.test.tsx",
                        "--reporter=json", f"--outputFile={out}"],
                       cwd=root / "app", capture_output=True, text=True)
    print(f"\n=== tree {name}: MathText.tsx {hashlib.sha256(component).hexdigest()}, vitest exit {r.returncode}")
    data = json.loads(out.read_text(encoding="utf-8"))
    print(f"  tests: {data['numPassedTests']} passed, {data['numFailedTests']} failed, of {data['numTotalTests']}")
    for suite in data["testResults"]:
        for t in suite["assertionResults"]:
            first = t["failureMessages"][0].splitlines()[0] if t["failureMessages"] else ""
            print(f"  {t['status']:7} {t['fullName']}" + (f"\n          {first}" if first else ""))
REPORT.close()
```

### Appendix C — `tsc_compare.py` (SHA-256 `c156887a68ffaf893807430546a6e11e817c07686ef0b7dffdd81ab6a9b4c278`)

The typecheck, lane vs scratch trees with the lane's and HEAD's MathText files (section 3).

```python
"""Typecheck evidence for bead hpf-dhjn: the app's diagnostics with HEAD's
MathText files and with the lane's are the same set, and none is in app/src.

The lane's `tsc -b --noEmit` fails offline because worker/ has no
node_modules (app/src/api/client.ts imports the worker's AppType). To show
those failures are not this round's, the app and worker sources are copied
into two scratch trees that differ only in the two MathText files:

  control  the lane's MathText.tsx and MathText.test.tsx
  head     both files as at HEAD (git show)

Each tree links app/node_modules to the lane's. tsc runs per project
(-p tsconfig.app.json / tsconfig.node.json, --noEmit, no build info written)
in the lane, control and head; then the lane's own `tsc -b --noEmit`.
Read-only towards the lane's tracked files: trees go under <scratch>/tsc.

usage: tsc_compare.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import builtins
import collections
import re
import shutil
import subprocess
import sys
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2]) / "tsc"
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
TSC = LANE / "app/node_modules/typescript/bin/tsc"
FILES = ("app/src/components/MathText.tsx", "app/src/components/MathText.test.tsx")
DIAG = re.compile(r"^(?P<file>[^\s(][^(]*)\((?P<line>\d+),(?P<col>\d+)\): error (?P<code>TS\d+): (?P<msg>.*)$")


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def git_show(rel: str) -> bytes:
    return subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, check=True).stdout


def build(name: str, head_files: bool) -> Path:
    root = SCRATCH / name
    if root.exists():
        shutil.rmtree(root)
    for pkg in ("app", "worker"):
        (root / pkg).mkdir(parents=True)
        shutil.copytree(LANE / pkg / "src", root / pkg / "src")
        for f in sorted((LANE / pkg).iterdir()):
            if f.is_file() and f.suffix in (".json", ".ts"):
                shutil.copyfile(f, root / pkg / f.name)
    (root / "app/node_modules").symlink_to(LANE / "app/node_modules")
    for rel in FILES:
        if head_files:
            (root / rel).write_bytes(git_show(rel))
        assert (root / rel).read_bytes() == (git_show(rel) if head_files else (LANE / rel).read_bytes())
    return root


def tsc(cwd: Path, *args: str):
    r = subprocess.run(["node", str(TSC), *args], cwd=cwd, capture_output=True, text=True)
    lines = r.stdout.splitlines()
    diags = [m.groupdict() for m in map(DIAG.match, lines) if m]
    return r.returncode, diags, len(lines)


def summary(label: str, code: int, diags: list, nlines: int):
    files = collections.Counter(d["file"] for d in diags)
    codes = collections.Counter(d["code"] for d in diags)
    in_app = sorted({d["file"] for d in diags if not d["file"].startswith("../worker/")})
    print(f"  {label}: exit {code}, {len(diags)} diagnostics in {len(files)} files ({nlines} output lines)")
    print(f"    codes: {dict(sorted(codes.items()))}")
    print(f"    files outside ../worker/: {in_app}")
    print(f"    MathText files: {[f for f in files if 'MathText' in f]}")


def key(diags: list) -> list:
    return sorted((d["file"], int(d["line"]), int(d["col"]), d["code"], d["msg"]) for d in diags)


print(f"tsc: {TSC} ({subprocess.run(['node', str(TSC), '--version'], capture_output=True, text=True).stdout.strip()})")
trees = {"lane": LANE, "control": build("control", False), "head": build("head", True)}
results = {}
for project in ("tsconfig.app.json", "tsconfig.node.json"):
    print(f"\n=== tsc -p {project} --noEmit")
    for name, root in trees.items():
        code, diags, nlines = tsc(root / "app", "-p", project, "--noEmit")
        results[(project, name)] = diags
        summary(name, code, diags, nlines)
    print(f"  control == lane: {key(results[(project, 'control')]) == key(results[(project, 'lane')])}")
    print(f"  head == control: {key(results[(project, 'head')]) == key(results[(project, 'control')])}")

print("\n=== the lane's own typecheck script: tsc -b --noEmit")
code, diags, nlines = tsc(LANE / "app", "-b", "--noEmit")
summary("lane", code, diags, nlines)
per_project = key(results[("tsconfig.app.json", "lane")] + results[("tsconfig.node.json", "lane")])
print(f"  same set as the two -p runs: {key(diags) == per_project}")
REPORT.close()
```

### Appendix D — `red_first_r9.py` (SHA-256 `c93b751f08b858c7f2e2483116acc740406c718d261cc2fdcdaaca1bfc807109`)

The pin on scratch trees, and mathtext_problems() per variant, mutant and cosmetic change (sections 4 and 5).

```python
"""Red-first for bead hpf-dhjn's MathText pin, on scratch copies of the tree.
Read-only towards the lane: every tree is written under <scratch>/trees.

Each tree copies, at their repository paths, the files the pin file reads:
app/package.json, app/src/components/MathText.tsx,
pipeline/synthetic/LAYER2-RENDERING.md, the lint and the pin file itself.
"lane" is the lane's copy, "HEAD" is `git show HEAD:<path>`.

  fix                       the lane's files: the fixed MathText, the new pin
  old-fallback              the new pin on HEAD's MathText.tsx (R9's fallback)
  fallback-as-html          the fixed MathText, its catch returning { html: latex }
  sink-takes-the-fallback   the fixed MathText, its sink taking math.text too
  r9-shape-in-the-fix       the fixed MathText, its catch returning the raw
                            segment and its sink taking renderMath's return value
  round8-pin-on-old         HEAD's pin and contract on HEAD's MathText.tsx
  round8-pin-on-fix         HEAD's pin and contract on the fixed MathText.tsx

For each tree: pytest on (1) the MathText pin only, (2) the whole file, with
JUnit XML; per failure, whether its message carries the required sentence.
Then mathtext_problems() of the new pin on each MathText variant and on every
self-test mutant and cosmetic change, to show which check catches what.

usage: red_first_r9.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import builtins
import collections
import hashlib
import importlib.util
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
MATHTEXT = "app/src/components/MathText.tsx"
CONTRACT = "pipeline/synthetic/LAYER2-RENDERING.md"
TEST_REL = "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py"
FILES = ("app/package.json", MATHTEXT, CONTRACT, "pipeline/synthetic/gates/scripts/lint_learner_output.py",
         TEST_REL)
PIN = "test_mathtext_shows_text_outside_math_as_react_text"
CHANGED = "learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def head(rel: str) -> bytes:
    return subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, check=True).stdout


def lane(rel: str) -> bytes:
    return (LANE / rel).read_bytes()


def edited(*changes):
    """The lane's MathText.tsx with each (anchor, replacement) applied once."""
    def make() -> bytes:
        src = lane(MATHTEXT).decode("utf-8")
        for anchor, replacement in changes:
            assert src.count(anchor) == 1, anchor
            src = src.replace(anchor, replacement)
        return src.encode("utf-8")
    return make


FALLBACK, SINK = "return { text: latex }", "__html: math.html"
TREES = {
    "fix": {},
    "old-fallback": {MATHTEXT: lambda: head(MATHTEXT)},
    "fallback-as-html": {MATHTEXT: edited((FALLBACK, "return { html: latex }"))},
    "sink-takes-the-fallback": {MATHTEXT: edited((SINK, "__html: 'html' in math ? math.html : math.text"))},
    "r9-shape-in-the-fix": {MATHTEXT: edited((FALLBACK, "return latex"), (SINK, "__html: renderMath(latex)"))},
    "round8-pin-on-old": {MATHTEXT: lambda: head(MATHTEXT), TEST_REL: lambda: head(TEST_REL),
                          CONTRACT: lambda: head(CONTRACT)},
    "round8-pin-on-fix": {TEST_REL: lambda: head(TEST_REL), CONTRACT: lambda: head(CONTRACT)},
}


def build(name: str, overrides: dict) -> Path:
    root = SCRATCH / "trees" / name
    if root.exists():
        shutil.rmtree(root)
    for rel in FILES:
        (root / rel).parent.mkdir(parents=True, exist_ok=True)
        (root / rel).write_bytes(overrides[rel]() if rel in overrides else lane(rel))
    return root


def run(root: Path, selection, xml: Path):
    targets = [f"{root / TEST_REL}::{t}" for t in selection] if selection else [str(root / TEST_REL)]
    r = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", *targets,
                        f"--junitxml={xml}"], capture_output=True, text=True, cwd=root)
    outcomes = {}
    for case in ET.parse(xml).getroot().iter("testcase"):
        failure, skipped = case.find("failure"), case.find("skipped")
        if failure is not None:
            outcomes[case.get("name")] = ("FAILED", failure.get("message") or "")
        elif skipped is not None:
            outcomes[case.get("name")] = ("XFAIL" if "xfail" in (skipped.get("type") or "") else "SKIPPED",
                                          skipped.get("message") or "")
        else:
            outcomes[case.get("name")] = ("PASSED", "")
    return r.returncode, r.stdout.strip().splitlines()[-1], outcomes


def load_pin():
    """The lane's pin module, imported from its own path (it imports the lint)."""
    spec = importlib.util.spec_from_file_location("pin_r9", LANE / TEST_REL)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    print("lane files (SHA-256):")
    for rel in FILES:
        print(f"  {sha(lane(rel))}  {rel}")
    print(f"HEAD's MathText.tsx: {sha(head(MATHTEXT))}; HEAD's pin file: {sha(head(TEST_REL))}")
    for name, overrides in TREES.items():
        root = build(name, overrides)
        print(f"\n=== tree {name}")
        for rel in (MATHTEXT, TEST_REL, CONTRACT):
            data = (root / rel).read_bytes()
            origin = "lane" if data == lane(rel) else "HEAD" if data == head(rel) else "EDITED"
            print(f"  {rel}: {origin} {sha(data)[:16]}")
        for label, selection in (("the MathText pin", (PIN,)), ("the whole file", None)):
            xml = SCRATCH / "trees" / f"{name}-{'pin' if selection else 'file'}.xml"
            code, summary, outcomes = run(root, selection, xml)
            print(f"  -- {label}: exit {code}, {summary}")
            for test, (outcome, message) in outcomes.items():
                if outcome == "FAILED":
                    print(f"     FAILED {test}")
                    print(f"       carries the required sentence: {CHANGED in message}")
                    print(f"       message: {message[:900]}")
            skips = [m for o, m in outcomes.values() if o == "SKIPPED"]
            if skips:
                print(f"     SKIPPED {len(skips)}; every skip reason carries the sentence: "
                      f"{all(CHANGED in m for m in skips)}")
            if not selection:
                counts = collections.Counter(o for o, _ in outcomes.values())
                print(f"     outcomes: {dict(sorted(counts.items()))}")

    pin = load_pin()
    print("\n=== the new pin's mathtext_problems() per MathText variant")
    variants = {"fix (lane)": lane(MATHTEXT), "HEAD (R9's fallback)": head(MATHTEXT)}
    for name in ("fallback-as-html", "sink-takes-the-fallback", "r9-shape-in-the-fix"):
        variants[name] = TREES[name][MATHTEXT]()
    for name, data in variants.items():
        problems = pin.mathtext_problems(data.decode("utf-8"))
        print(f"  {name}: {len(problems)} problem(s)")
        for p in problems:
            print(f"    - {p}")
    print("\n=== the self-tests: mathtext_problems() per mutant and cosmetic change")
    for title, table in (("mutant", pin.MATHTEXT_MUTANTS), ("cosmetic", pin.MATHTEXT_COSMETIC)):
        for name, changes in table.items():
            problems = pin.mathtext_problems(pin._mutated(changes))
            short = [p.split(",")[0].split(" (")[0][:70] for p in problems]
            print(f"  {title} {name}: {len(problems)} {short}")
    REPORT.close()


main()
```

### Appendix E — `evidence_r9.py` (SHA-256 `8cf53c794e2b20ff05aff431a625cf0261f5d99ac701be5ab8661ae008dd35e9`)

HEAD, the changed files, the lint and the store probe, the contract's ALL_CAPS tokens, raw characters (sections 6 and 7).

```python
"""Evidence for bead hpf-dhjn (read-only towards the lane). Sections:

  A. HEAD; git status, with the pre-existing gc/agent directories counted
     apart; each changed file's SHA-256 and git blob id;
  B. the lint: byte-identical to HEAD's, and the store probe (the lane's lint
     CLI over data/explanations, default and --strict);
  C. LAYER2-RENDERING.md's ALL_CAPS snake tokens, which round 5 harvests as
     labels, head vs lane;
  D. raw characters: per changed file, every Cf, default-ignorable,
     private-use, surrogate, combining, unusual space or control character,
     and the backslash-u sequences, head vs lane.

usage: evidence_r9.py <lane-root> <report-path>
"""
from __future__ import annotations

import builtins
import collections
import hashlib
import os
import stat
import subprocess
import sys
import unicodedata
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115
LINT = "pipeline/synthetic/gates/scripts/lint_learner_output.py"
DOC = "pipeline/synthetic/LAYER2-RENDERING.md"
CHANGED = ("app/src/components/MathText.tsx", "app/src/components/MathText.test.tsx",
           "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py", DOC)
PRE_EXISTING = (".claude/skills/", ".agents/", ".codex/", ".gc/")
EXTRA_IGNORABLE = ({0x034F, 0x115F, 0x1160, 0x17B4, 0x17B5, 0x3164, 0xFFA0} | set(range(0x180B, 0x1810))
                   | set(range(0xFE00, 0xFE10)) | set(range(0xE0100, 0xE01F0)))
BACKSLASH_U = chr(0x5C) + "u"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def git(*args) -> str:
    return subprocess.run(["git", *args], cwd=LANE, capture_output=True, text=True, check=True).stdout


def head_text(rel: str) -> str:
    return git("show", f"HEAD:{rel}")


# ------------------------------------------------------------------ A
print(f"HEAD {git('rev-parse', 'HEAD').strip()}")
entries = git("status", "--porcelain", "--untracked-files=all").splitlines()
pre = [e for e in entries if e[3:].startswith(PRE_EXISTING)]
print(f"git status: {len(entries)} entries; {len(pre)} under {', '.join(PRE_EXISTING)} (pre-existing, left out)")
for e in entries:
    if e not in pre:
        path = LANE / e[3:]
        kind = "char device" if path.exists() and stat.S_ISCHR(os.stat(path).st_mode) else \
            "dir" if path.is_dir() else "file"
        print(f"  {e}  ({kind})")
print("changed files:")
for rel in CHANGED:
    data = (LANE / rel).read_bytes()
    print(f"  {hashlib.sha256(data).hexdigest()}  blob {git('hash-object', rel).strip()[:7]}  {rel}")
print("diff --stat:")
for line in git("diff", "--stat").splitlines():
    print(f"  {line}")

# ------------------------------------------------------------------ B
print("\n=== B. the lint")
print(f"lane lint byte-identical to HEAD's: {(LANE / LINT).read_bytes() == head_text(LINT).encode('utf-8')} "
      f"(SHA-256 {hashlib.sha256((LANE / LINT).read_bytes()).hexdigest()})")
for strict in (False, True):
    r = subprocess.run([sys.executable, str(LANE / LINT), *(["--strict"] if strict else []),
                        str(LANE / "data/explanations")], capture_output=True, text=True)
    lines = r.stdout.splitlines()
    findings = [ln for ln in lines if ln.startswith("L2-")]
    print(f"{'--strict' if strict else 'default'}: exit {r.returncode}, {len(findings)} finding(s), "
          f"{[ln for ln in lines if not ln.startswith('L2-')]}")
    if not strict:
        for ln in findings:
            print(f"    {ln.replace(str(LANE), '…')}")

# ------------------------------------------------------------------ C
print("\n=== C. ALL_CAPS snake tokens in LAYER2-RENDERING.md (round 5's doc label source)")
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts/tests"))
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts"))
import lint_learner_output as lint  # noqa: E402
import test_verdict_enum_and_label_vocabulary_round5 as r5  # noqa: E402


def doc_caps(text: str) -> set:
    return {m.group(0) for line in text.splitlines() for m in lint._SNAKE_TOKEN.finditer(line)
            if m.group(0).isupper() and m.group(0) not in r5.NOT_LABELS and r5._is_label_shaped(m.group(0))}


h, l_ = doc_caps(head_text(DOC)), doc_caps((LANE / DOC).read_text(encoding="utf-8"))
print(f"head {sorted(h)}, lane {sorted(l_)}, identical: {h == l_}")

# ------------------------------------------------------------------ D
print("\n=== D. raw characters, head vs lane")


def odd(c: str) -> bool:
    cat = unicodedata.category(c)
    return (cat in ("Cf", "Co", "Cs", "Mn", "Me", "Mc") or ord(c) in EXTRA_IGNORABLE
            or (cat == "Zs" and c != " ") or (cat == "Cc" and c not in "\n\t"))


def census(text: str):
    chars = collections.Counter(f"U+{ord(c):04X}" for c in text if odd(c))
    escapes = [n for n, line in enumerate(text.splitlines(), 1) if BACKSLASH_U in line]
    return dict(sorted(chars.items())), escapes


for rel in CHANGED:
    (hc, he), (lc, le) = census(head_text(rel)), census((LANE / rel).read_text(encoding="utf-8"))
    print(f"  {rel}")
    print(f"    odd characters: head {hc}, lane {lc}, same: {hc == lc}")
    print(f"    backslash-u lines: head {he}, lane {le}, same count: {len(he) == len(le)}")
REPORT.close()
```

### Appendix F — `check_chars_r9.py` (SHA-256 `eee16924559bcc4866e953eca539cf09d35707d384da2df6698cd88fbbbe1381`)

No raw invisible, private-use or combining character and no backslash-u sequence in this file (section 9).

```python
"""Read-only: bead hpf-dhjn's worklog holds no raw invisible (Cf or other
default-ignorable), private-use, surrogate, combining, unusual space or
control character and no backslash-u sequence; the changed files hold the
same such characters as at HEAD (MathText.tsx: its two delimiters and the
U+200B in its header comment).

usage: check_chars_r9.py <lane-root>
"""
import collections
import subprocess
import sys
import unicodedata
from pathlib import Path

LANE = Path(sys.argv[1])
WORKLOG = "docs/worklog/hpf-dhjn.md"
CHANGED = ("app/src/components/MathText.tsx", "app/src/components/MathText.test.tsx",
           "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py",
           "pipeline/synthetic/LAYER2-RENDERING.md")
EXTRA_IGNORABLE = ({0x034F, 0x115F, 0x1160, 0x17B4, 0x17B5, 0x3164, 0xFFA0} | set(range(0x180B, 0x1810))
                   | set(range(0xFE00, 0xFE10)) | set(range(0xE0100, 0xE01F0)))
BACKSLASH_U = chr(0x5C) + "u"


def odd(c):
    cat = unicodedata.category(c)
    return (cat in ("Cf", "Co", "Cs", "Mn", "Me", "Mc") or ord(c) in EXTRA_IGNORABLE
            or (cat == "Zs" and c != " ") or (cat == "Cc" and c not in "\n\t"))


def census(text):
    return dict(sorted(collections.Counter(f"U+{ord(c):04X}" for c in text if odd(c)).items()))


text = (LANE / WORKLOG).read_text(encoding="utf-8")
bad = [(n, f"U+{ord(c):04X}") for n, line in enumerate(text.splitlines(), 1) for c in line if odd(c)]
escapes = [n for n, line in enumerate(text.splitlines(), 1) if BACKSLASH_U in line]
print(f"{WORKLOG}: {'clean' if not bad and not escapes else f'odd {bad[:20]}, backslash-u lines {escapes}'}")
for rel in CHANGED:
    head = subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, text=True,
                          check=True).stdout
    lane = (LANE / rel).read_text(encoding="utf-8")
    print(f"{rel}: lane {census(lane)}, same as HEAD: {census(lane) == census(head)}")
```

### Appendix G — `append_appendices_r9.py` (SHA-256 `dd37855a9ce36f998b035a51193271d1731bdc5c88cf087f30dddbaa231ae7d0`)

This appendix list.

```python
"""Append each probe script's exact source, with its SHA-256, to the worklog's
"## Appendices" section. Idempotent: anything after the section's intro
paragraph is cut first, and a trailing "## Bead note (pending)" section, if
any, is kept after the appendices.
usage: append_appendices_r9.py <worklog-path> <scratch-dir>"""
import hashlib
import sys
from pathlib import Path

WORKLOG = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
APPENDICES = [
    ("A", "katex_probe.mjs", "javascript", "KaTeX 0.16.45 on R9's segment at several nesting depths, with "
                                           "MathText's options (section 1)."),
    ("B", "vitest_red_first.py", "python", "The MathText Vitest file on scratch app trees: HEAD's component "
                                           "and the fix (section 3)."),
    ("C", "tsc_compare.py", "python", "The typecheck, lane vs scratch trees with the lane's and HEAD's "
                                      "MathText files (section 3)."),
    ("D", "red_first_r9.py", "python", "The pin on scratch trees, and mathtext_problems() per variant, "
                                       "mutant and cosmetic change (sections 4 and 5)."),
    ("E", "evidence_r9.py", "python", "HEAD, the changed files, the lint and the store probe, the "
                                      "contract's ALL_CAPS tokens, raw characters (sections 6 and 7)."),
    ("F", "check_chars_r9.py", "python", "No raw invisible, private-use or combining character and no "
                                         "backslash-u sequence in this file (section 9)."),
    ("G", "append_appendices_r9.py", "python", "This appendix list."),
]
MARK = "## Appendices\n"
PENDING = "\n## Bead note (pending)\n"
FENCE = "`" * 3

text = WORKLOG.read_text(encoding="utf-8")
head, sep, tail = text.partition(MARK)
assert sep, "no '## Appendices' heading"
tail, psep, pending = tail.partition(PENDING)
intro = tail.split("\n### Appendix ", 1)[0].rstrip("\n") + "\n"
out = [head, MARK, intro]
for letter, name, lang, what in APPENDICES:
    data = (SCRATCH / name).read_bytes()
    source = data.decode("utf-8")
    assert FENCE not in source, name
    out.append(f"\n### Appendix {letter} — `{name}` (SHA-256 `{hashlib.sha256(data).hexdigest()}`)\n\n"
               f"{what}\n\n{FENCE}{lang}\n{source.rstrip()}\n{FENCE}\n")
if psep:
    out.append(PENDING + pending)
WORKLOG.write_text("".join(out), encoding="utf-8")
print(f"appended {len(APPENDICES)} appendices to {WORKLOG}")
```

---

## Round 9b (bead hpf-n5xp): an explicit timeout for the deep-nesting test

Origin: in a cold coordinator run, the round-9 test "shows the R9 deep-nesting segment as text, with
the real KaTeX" failed once, both alone and in the full app suite, and passed on the next runs. It
takes about 1.5 s warm and Vitest's default per-test timeout is 5 s, so a cold start or a loaded CI
runner can push it over. This is a test-only fix on top of the round-9 changes, which are kept as
they are. HEAD is still `4eabf63147979e182de61696003edf5a430f5a53`, and everything stays UNCOMMITTED.

- **The change: 2 lines in `app/src/components/MathText.test.tsx`.** The test gets `30_000` as the
  third `it(...)` argument, and a one-line comment above it says why:
  `// 30 s: forcing KaTeX's RangeError takes deep recursion, slow on a cold start or loaded CI.`
  - Vitest 4.1.5 reads a number there as the test's timeout: `@vitest/runner`'s `parseArguments`
    turns `it('', () => {}, 1000)` into `{ timeout: 1000 }`. Vitest 4 removed only the
    options-object form of that third argument.
  - `biome check` on the two MathText files is clean.
- **The depth stays 20 000.** The bead allowed a smaller depth only with proof that the `RangeError`
  precondition still holds. The timeout alone removes the flake, and 20 000 keeps the margin over a
  stack threshold that moves with the environment (section 8, residual 2). The precondition
  assertion is unchanged.
- **The reporter.** Vitest 4.1 picks its `agent` reporter when std-env detects an AI agent
  (`isAgent ? "agent" : "default"`), and that reporter prints only failures. Two bare runs of the
  MathText file gave 16 passed each (tests 910 ms and 832 ms in total) but no per-test duration. So
  the counted runs below add `--reporter=default`, the reporter CI and a terminal get, and send the
  output to a file. That reporter lists every passing test slower than 300 ms with its duration.

**Verification**, from `app/`: `npx vitest run src/components/MathText.test.tsx --reporter=default`
five times in a row, then `npx vitest run --reporter=default` twice.

| run | tests | deep-nesting test | its file | wall time |
|---|---|---|---|---|
| MathText file, 1 | 16 passed | 1498 ms | 1625 ms | 3.06 s |
| MathText file, 2 | 16 passed | 1291 ms | 1375 ms | 2.31 s |
| MathText file, 3 | 16 passed | 1191 ms | 1267 ms | 2.09 s |
| MathText file, 4 | 16 passed | 972 ms | 1040 ms | 1.71 s |
| MathText file, 5 | 16 passed | 800 ms | 858 ms | 1.45 s |
| full suite, 1 | 75 files, 762 passed | 1922 ms | 2106 ms | 6.24 s |
| full suite, 2 | 75 files, 762 passed | 1626 ms | 1784 ms | 6.94 s |

- The slowest run, 1.9 s, is in the full suite, where files run in parallel. That is 38% of the old
  5 s limit and about 1/15 of the new one.
- The counts match round 9: 16 tests in the file, and 75 files with 762 tests in the suite.
- In the full suite, other test files write to stderr, for example `useRouter must be used inside a
  <RouterProvider>` from `HomeMobile.test.tsx`. None of it comes from MathText, and no run printed a
  timeout or deprecation warning.

**Files.**
- `app/src/components/MathText.test.tsx`: SHA-256
  `bb3a69f0e77847a531b4026aba53cc4f517464390e902ea39c12f909edd511d4`, blob `93f0273` (round 9:
  `81d6d24c…`, blob `2fcfd1e`). Its backslash-u lines are still 16 and 60, and it holds no
  private-use or invisible character.
- The other three round-9 files keep the SHA-256s in the changed-files table: `e0f6bebd…`,
  `8a5cee72…` and `7af88619…`.
- The Python gate suites were not re-run, because nothing under `pipeline/` or `.github/` reads the
  test file.
- Appendix G's `append_appendices_r9.py` rewrites everything after `## Appendices` and keeps only a
  trailing `## Bead note (pending)`. Re-running it would drop this section.
- `git status` now also lists `app/.claude/` and `app/.mcp.json` as untracked. Inside the sandbox
  they are `/dev/null` bind mounts (character device 1,3) on the sandbox's protected paths for `app/`,
  and they showed up once commands ran from `app/`. Like the lane-root dotfiles, they are not part of
  the change and were left alone.
