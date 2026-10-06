# hpf-sn6u — PR #370 fix round 10: a behavioural Vitest guard is the authority for MathText's HTML sink; the source pin is a tripwire

Origin: Codex review R10, hpf-xg9u, finding [FIX-INCOMPLETE][high], on PR #370 (pipeline hardening, origin
bead hpf-y1p4). Round 9 (hpf-dhjn) pinned MathText's renderer guarantee with regular expressions over
`MathText.tsx`. R10 showed that the pin only proves that the `html:` initializer *starts* with
`katex.renderToString(`: the mutation `html: katex.renderToString(…) + latex` passes it, and the R8-H1
segment then becomes live HTML that shows WORLD_KNOWLEDGE while the lint passes. This round makes a
behavioural Vitest guard the authority and leaves the Python file a tripwire. The shipped `MathText.tsx`
and the lint do not change. `docs/worklog/hpf-dhjn.md` is history and is not edited.

- Lane: `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`.
- `git rev-parse HEAD` = `8adfd1bd57c3ac6069082e3f606321125196b2d7`, verified first.
- All changes are UNCOMMITTED. No git commit, checkout, stash, reset or push.

Notation: `U+XXXX` names one code point. This file holds no raw invisible, combining, bidi or
private-use character and no backslash-u sequence (check in section 8).

## Outcome

- **The behavioural guard.** `describe('MathText HTML-sink guard')` in
  `app/src/components/MathText.test.tsx` has 4 tests, one per rendering path. Each runs on 8 hostile
  strings through `it.each`, so 32 tests in all. CI's app job runs them (`pnpm test`, which is
  `vitest run` over `src/**/*.test.tsx`). The four tests:
  - `KaTeX renders a math segment: only its output is HTML`
  - `KaTeX throws on a math segment: it is a text node`
  - `prose without math: the string is a text node`
  - `prose beside math: each prose segment is a text node`
- **Mutation proof (section 3).** Scratch copies of the app hold a mutated `MathText.tsx`, never the
  lane's file. The guard fails on each of the bead's four mutations:
  - (i) R10's `}) + latex`: 8 of the 32 guard tests fail;
  - (ii) round 9's original raw fallback: 6 fail;
  - (iii) `html: latex`: 16 fail;
  - (iv) a prose segment through `dangerouslySetInnerHTML`: 6 fail.

  It also fails on 7 of 9 extra mutations. It passes an equivalent mutant, as it should. It misses a
  length-gated bypass, because it never renders an input that long (residual 1).
- **The Python pin is a tripwire (section 4).**
  - Its docstring, comments and failure messages no longer claim that a regex proves what reaches the
    sink. Every MathText failure message now ends by naming the Vitest guard as the authority.
  - Kept: the coarse checks (no Markdown or HTML renderer in `app/package.json`, `MathText.tsx` exists,
    its delimiters, exactly one `dangerouslySetInnerHTML`, KaTeX with `throwOnError: false`), and round
    9's sink-shape regexes, now labelled heuristic.
  - Dropped: the regexes for the `catch` block, the prose branch and the fast path.
  - R10's mutation is recorded as a strict xfail: the tripwire does not see it.
  - A new test fails if the guard's titles are missing from the Vitest file or a test there is switched
    off. It has 8 mutant and 3 cosmetic self-tests.
  - Pin file: 56 passed + 6 xfailed → **65 passed + 7 xfailed**.
- **The contract (section 5).** `LAYER2-RENDERING.md` gets a section, "Beteendevakten (PR #370 rond 10,
  bead hpf-sn6u)". It states the guarantee, names the guard and its four tests, says CI's app job runs
  them, calls the Python file a tripwire and states the guard's limits. Round 8's and round 9's
  bullets that made the pin the proof are revised. A test now fails if the contract stops naming the
  guard or any of its tests.
- **Unchanged.** `MathText.tsx` and `lint_learner_output.py` are byte-identical to HEAD's. The store
  probe gives default **2 findings in 27 files** and `--strict` **74**.
- **Suites (section 6).**

  | run | baseline (bead) | lane, final files |
  |---|---|---|
  | `cd app && npx vitest run --reporter=default src/components/MathText.test.tsx` | 16 passed | **48 passed** |
  | `cd app && npx vitest run --reporter=default`, run 1 | 762 passed, 75 files | **794 passed, 75 files** |
  | the same, run 2 | 762 passed, 75 files | **794 passed, 75 files** |
  | `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` | 768 passed, 6 xfailed | **777 passed, 7 xfailed** |
  | the exact CI command (section 6) | 838 passed, 6 xfailed | **847 passed, 7 xfailed** |
  | `npx biome check src/components/MathText.test.tsx` | — | clean |

## Changed files (uncommitted)

| file | change | SHA-256 | blob |
|---|---|---|---|
| `app/src/components/MathText.test.tsx` | the HTML-sink guard: 8 hostile strings through 4 paths; one header line | `c4cf754d18bb4dc52125e6b06ae5aa9b08305d8ebe1392945d80d5ebcd4d6d4b` | `deacf3a` |
| `pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py` | a tripwire: claims removed, authority named, catch and prose regexes dropped, R10 strict xfail, guard-presence check and its self-tests, contract check extended | `44bc23834259c41ca8cdd31fc8bf13bd818b50df25c3cd640efbd1806c5e21fc` | `05d294e` |
| `pipeline/synthetic/LAYER2-RENDERING.md` | new round-10 section; round 8's and round 9's pin bullets revised | `a74461129dac385a1ffbce671bdc6f9c28dac355c779fbb0ca034e90a27e0b12` | `d3d3e92` |
| `docs/worklog/hpf-sn6u.md` | this file | — | — |

`git diff --stat`: 3 files changed, 362 insertions, 103 deletions. Unchanged and byte-identical to HEAD:
`app/src/components/MathText.tsx` (`e0f6bebd…`) and the lint (`0d0455e7…`).

Nothing else was touched. These were already there and are left alone:
- the untracked dotfiles at the lane root (`.bashrc`, `.gitconfig`, `.mcp.json`, …). They are character
  devices, the sandbox's `/dev/null` mounts, and were in this session's first `git status`;
- `.claude/skills/*`, `.agents/`, `.codex/` and `.gc/`;
- `app/node_modules` and the ignored caches.

---

## 1. The finding, reproduced

**Round 9's suite is green on R10's mutation** (`pin_trees_r10.py`, appendix D, tree
`round9-pin-on-r10`). The tree holds HEAD's pin file, contract and Vitest file, and `MathText.tsx` with
R10's one-line change (`      }),` becomes `      }) + latex,` in `renderMath`'s `try`):

```
=== tree round9-pin-on-r10: differs from the lane in R10's mutation in MathText.tsx, with HEAD's pin file, contract and test file
  pytest exit 0: 56 passed, 6 xfailed in 0.11s
```

- **Why it passes.** Round 9's `_HTML_FROM_KATEX`, `[{,;]\s*html\s*:\s*katex\.renderToString\(`,
  matches the start of the initializer, and no check reads past the call's closing parenthesis. The
  mutation keeps every shape the regexes read: one sink, `__html: math.html`, one `html` key written
  with `katex.renderToString(`, and the `catch` returning `{ text }`.
- **What it does.** Section 3, mutation (i): for R8-H1, the `role="math"` span holds KaTeX's output
  and then the parsed segment, a live `<span title=">">KNOWLEDGE</span>`. The text after KaTeX's output
  reads `WORLD_KNOWLEDGE`.
- **The general point.** R10 holds for any regex over source: the regex sees how the code is written,
  not what the value is. The fix moves the authority to what the component renders.

## 2. The guard (`app/src/components/MathText.test.tsx`)

**The hostile strings.** The bead's minimum is R8-H1, an `<img>` with `onerror`, a bold label and an
entity form. Four more are added. The table describes the strings rather than quoting raw output,
because KaTeX's text holds U+200B. It comes from `hostile_probe.cjs` (appendix A): the lane's KaTeX
0.16.45 with MathText's options, and jsdom for "as HTML".

| case | string | parsed as HTML | KaTeX, MathText's options |
|---|---|---|---|
| R8-H1, a quoted > in an attribute | `WORLD_<span title=">">KNOWLEDGE</span>` | a `span`; text `WORLD_KNOWLEDGE` | typeset, spans only; `<` ×2, `>` ×3, `"` ×2 kept as characters |
| an img with an event handler | `<img src=x onerror=alert(1)>` | an `img` | typeset; `<`, `>` kept |
| a bold label | `<b>WORLD_KNOWLEDGE</b>` | a `b` | typeset; `<` ×2, `>` ×2 kept |
| a numeric character reference | `WORLD&#95;KNOWLEDGE` | no element; text `WORLD_KNOWLEDGE` | parse error at `&`: KaTeX's `.katex-error` span (it has a `title`) shows the source |
| a named character reference | `WORLD&lowbar;KNOWLEDGE` | the same | the same |
| a span that spoofs KaTeX's class | `<span class="katex">WORLD</span>_KNOWLEDGE` | a `span.katex`; text `WORLD_KNOWLEDGE` | typeset; `<`, `>`, `"` kept |
| R8-M6, a Markdown link | `[WORLD](a(b(c)d)e)_KNOWLEDGE` | text (a Markdown renderer makes a link) | typeset |
| a KaTeX link to javascript: | `\href{javascript:alert(1)}{WORLD}` | text | with KaTeX's default `trust: false`, the text `\href` in red; with `trust: true`, an `<a>` |

**What each test asserts.** Tests 1 and 2 wrap the string in the delimiters with the file's `M()`
helper, with the prose `f ` and ` g` around it.

1. **`KaTeX renders a math segment: only its output is HTML`**, with `vi.spyOn(katex,
   'renderToString')` calling through.
   - KaTeX was called once. The `role="math"` span's `innerHTML` equals what that call returned, as
     the DOM serializes it. This is the guarantee itself: the sink holds KaTeX's return value and
     nothing else. It does not depend on MathText's options or on `wrapUnits`.
   - `strayElements(container)` is empty (below).
   - Every `<`, `>`, `&` and `"` of the segment is on screen: each one's count in the span's text
     equals its count in the segment. An HTML parser consumes these as tag, reference and attribute
     syntax.
   - The container reads `f `, the span's text, then ` g`.
2. **`KaTeX throws on a math segment: it is a text node`**. `mockImplementation` throws a `RangeError`.
   - KaTeX was called once.
   - The span has no element child, and its text is the segment, character for character.
   - There is no stray element, and the container reads `f <segment> g`.
3. **`prose without math: the string is a text node`**. The string has no delimiter. The container has
   no element at all, and its text is the string.
4. **`prose beside math: each prose segment is a text node`**. The input is the string, a space, a math
   segment `x^{2}`, a space, the string.
   - The container has exactly 3 children, and the middle one is `role="math"`.
   - Neither prose span has an element child, and each holds its prose as written.
   - There is no stray element.

**`strayElements`** is the bead's suggested assertion, tightened. MathText's own elements are the
container's children: a bare `<span>` (no attributes) per prose segment and a `<span role="math">` per
math segment. Below a `role="math"` span, an element counts as KaTeX's only when all three hold:
- it has a `katex*` class or sits inside `.katex`;
- it is a `span`, or one of KaTeX's SVG elements (`svg`, `path`, `line`);
- it has a `title` only if it is KaTeX's `.katex-error` span. KaTeX's parse errors carry a title, and
  so does R8-H1's injected span.

Every other element is returned as the first 120 characters of its `outerHTML`, so a failure names it.

**Why the exact checks as well.** A segment can spell `class="katex"` itself. Under mutation (iii) the
spoofed `span.katex` lands directly under the `role="math"` span, and the class rule accepts it. The
exact checks still catch it: KaTeX was not called, and the span's text has no `<` where the segment has
2. The tag rule covers what KaTeX itself emits once trusted. With `trust: true`, the `\href` case
produces `<a href="javascript:alert(1)">` (mutation vi). That `<a>` is KaTeX's own output, so the
equality check passes, but the tag rule fails it.

**Round 9's tests stay as they were.** The guard's exception path is round 9's mocked-throw test,
generalized to 8 strings. Round 9's 20 000-level test is the only one where the real KaTeX throws, and
it is kept.

**Typing and lint.** The four titles fit Biome's 100-column line, so `it.each` keeps its one-line form.
`mock.results[0]?.value` avoids `Array.prototype.at`, which the app's `lib: ES2020` lacks.
`npx biome check` on the file is clean. Section 6 has the typecheck.

## 3. Mutation proof (`mutation_proof_r10.py`, appendix B)

**Method.** For each mutation, a scratch tree copies `app/src` and the app's root `.json` and `.ts`
config files, links `node_modules` to the lane's, and holds the lane's test file. Only `MathText.tsx`
differs, and the lane's tracked files are never written. Vitest runs
`src/components/MathText.test.tsx` with the JSON reporter. The table counts failing guard tests out of
32 and failing round-9 tests out of 16. The last column is the lane's tripwire, `mathtext_problems()`,
on the same source.

| id | mutation of `MathText.tsx` | guard tests failing (of 32), by path | other tests failing | Python tripwire |
|---|---|---|---|---|
| — | none (baseline) | 0 | 0 | 0 problems |
| **i** | R10: `html: katex.renderToString(…) + latex` | **8**: KaTeX renders 8/8 | 3 (round 9's "with KaTeX") | **0: passes** |
| **ii** | round 9's original raw fallback: the whole file as at HEAD~1 (`cc52f74f…`), the `catch` returning `latex` into `dangerouslySetInnerHTML` | **6**: KaTeX throws 6/8 | 2 (round 9's exception tests) | 1 (heuristic) |
| **iii** | `html: latex` on the normal path; KaTeX not called | **16**: KaTeX renders 8/8, KaTeX throws 8/8 | 5 | 2 |
| **iv** | prose segment `<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />` | **6**: prose beside math 6/8 | 0 | 1 (two sinks) |
| ii-b | the raw fallback in today's shape: `catch` returns `{ html: latex }` | 6: KaTeX throws 6/8 | 2 | 1 (heuristic) |
| ii-c | the fallback's text into a second sink | 8: KaTeX throws 8/8 | 2 | 1 (two sinks) |
| iii-b | the sink takes the segment, `__html: latex` | 8: KaTeX renders 8/8 | 3 | 1 (heuristic) |
| v | the fast path through `dangerouslySetInnerHTML` | 8: prose without math 8/8 | 0 | 1 (two sinks) |
| vi | KaTeX trusted: `trust: true` | 1: KaTeX renders, the `\href` case | 0 | **0: passes** |
| vii | round 9's length gate: `html: latex.length > 4096 ? latex : katex.renderToString(` | **0** | 1 (round 9's 20 000-level test) | 1 (heuristic) |
| viii | branches swapped, `!seg.math ? (` | 24: KaTeX renders, KaTeX throws, prose beside math, 8/8 each | 6 | **0: passes** |
| ix | `throwOnError: true` | 2: KaTeX renders, the two reference cases | 1 | 1 |
| x | equivalent: the sink reads `'html' in math ? math.html : math.text` | 0 | 0 | 1 (heuristic, a false positive) |

(i) to (iv) are the bead's mutations. The others are extra. The first failure on each path, from the
report:

```
(i)    [R8-H1, a quoted > in an attribute] AssertionError: expected '<span class="katex"><span class="kate…' to be '<span class="katex"><span class="kate…' // Object.is equality
(ii)   [R8-H1, a quoted > in an attribute] AssertionError: expected 1 to be +0 // Object.is equality
(iii)  [R8-H1, a quoted > in an attribute] AssertionError: expected "renderToString" to be called once, but got 0 times
(iv)   [R8-H1, a quoted > in an attribute] AssertionError: expected 1 to be +0 // Object.is equality
(iii-b) [R8-H1, a quoted > in an attribute] AssertionError: expected 'WORLD_<span title=">">KNOWLEDGE</span>' to be '<span class="katex"><span class="kate…' // Object.is equality
(viii) [R8-H1, a quoted > in an attribute] AssertionError: expected "renderToString" to be called once, but got 2 times
```

- **(ii) and (iv) fail on 6 of 8 strings.** R8-M6 and `\href` hold no HTML, so inserting them as HTML
  shows the same characters. That is correct: the guard flags a change in what is rendered, not in
  how it is written.
- **(vi): KaTeX's own `<a>`.** The `\href` case fails on `strayElements`. `stray_r10.py` (appendix C)
  reran the tree with the default reporter:

  ```
  - []
  + [
  +   "<a href=\"javascript:alert(1)\"><span class=\"mord mathnormal\" style=\"margin-right:0.1389em;\">W</span><span class=\"mord mat",
  + ]
  ```

  The sink-equality assertion passes here: this `<a>` *is* KaTeX's output. The tag rule is what
  catches it. The tripwire does not read `trust` (residual 2).
- **(iii) fails the exception path too.** KaTeX is never called, so the mocked throw never happens,
  and the test's first assertion (KaTeX called once) fails.
- **(vii): the guard's limit.** None of the guard's strings is longer than 4 096 characters, so the
  gate never opens on them. Round 9's 20 000-level test (140 038 characters) does open it and fails.
  The tripwire's heuristic flags the shape. Residual 1 covers gates set higher, or keyed on content.
- **(viii) and (x).** These are two of the three mutants that round 10 dropped from the tripwire's
  self-tests, plus the equivalent mutant. The guard catches swapped branches by behaviour. The
  equivalent mutant changes nothing at runtime: the guard passes it, and the heuristic flags it on
  shape alone.

## 4. The Python tripwire (`test_lint_renderer_assumption_round8.py`)

**What it checks now.** `mathtext_problems()` returns no problem for the lane's file. Its docstring says
that an empty result proves nothing about the sink.

| check | kind | caught (self-tests) |
|---|---|---|
| `app/package.json` declares no Markdown or HTML renderer | coarse, unchanged | 19 renderer names in all 4 dependency fields; 6 other names left alone |
| `MathText.tsx` exists | coarse, new | an explicit message instead of a `FileNotFoundError` |
| delimiters are U+E000 and U+E001, the lint's app view | coarse, unchanged | `dollar-delimiter` |
| exactly one `dangerouslySetInnerHTML` (comments stripped) | coarse | `text-branch-raw-html`, `fast-path-raw-html`, `fallback-into-a-second-sink` |
| `katex.renderToString` with every `throwOnError` set to `false` | coarse, unchanged | `katex-throws-into-the-fallback` |
| the sink reads `{{ __html: <v>.html }}` with `const <v> = renderMath(…)`, and `html: katex.renderToString(` is the only `html` key written | **heuristic** (round 9's sink regexes, relabelled) | `math-branch-raw-text`, `r9-raw-segment-into-the-sink`, `fallback-as-html`, `sink-takes-the-fallback`, `html-not-only-katex` |

**Removed claims.** These round-9 claims are gone:
- the module docstring's "the two pins fail … when MathText.tsx stops showing text outside math as
  React text with KaTeX's output as its only raw HTML";
- the comment "So no path, the KaTeX fallback included, reaches the sink";
- the failure message "…so the KaTeX fallback or another path can feed segment text to
  dangerouslySetInnerHTML".

**What replaces them.**
- The docstring now says the file is a tripwire, explains why with R10's mutation, and names the
  guard, its describe title and CI's app job.
- Each MathText failure message ends with `AUTHORITY`. The tripwire's own failure, from tree
  `tripwire-two-sinks` (mutation iv applied, appendix D):

  ```
  AssertionError: learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md (app/src/components/MathText.tsx: 2 dangerouslySetInnerHTML, where MathText has exactly one, for KaTeX's output; this check is a tripwire; the authority for what reaches MathText's HTML sink is the behavioural Vitest guard "MathText HTML-sink guard" in app/src/components/MathText.test.tsx)
  ```

**Dropped checks.** Round 9's `catch`-block regexes (`_CATCH`, `_CATCH_BLOCK`, `_RETURN_TEXT`,
`_HTML_WORD`, `_text_span`) and round 8's prose-shape regexes (`_SEGMENTS`, `_FAST_PATH`) are gone.
- The guard now checks the same claims behaviourally: the fallback is text, and prose is text.
- Three self-test mutants were caught only by these regexes, and they are dropped:
  - `text-branch-markdown` and `fast-path-markdown`: a Markdown library would also trip the package
    check, and an undefined `<Markdown>` only crashes the render;
  - `branches-swapped`, which the guard catches (mutation viii).
- The tripwire keeps 10 mutants and 8 cosmetic changes.

**R10, recorded.**
- `test_the_mathtext_tripwire_flags_codex_r10s_mutation` is a strict xfail with the reason "a
  tripwire, not a proof: only the behavioural guard catches R10's mutation". It is the same pattern as
  round 8's R8 record. If the tripwire ever learns this one shape, the test XPASSes, and the record has
  to move.
- An anchor problem must not hide inside the xfail. So the shared `_apply` helper now calls
  `pytest.fail` (`Failed`, not an `AssertionError`) when an anchor is missing, and the xfail's
  `raises=AssertionError` cannot absorb it.

**The guard's presence.** `test_the_behavioural_guard_is_still_in_the_vitest_file` reads the Vitest
file with comments stripped (round 8's `_code`).
- It requires the describe title `MathText HTML-sink guard` and each of the four test titles, as they
  are spelled, as string literals.
- It rejects `.skip`, `.todo`, `.fails`, `.skipIf` and `.runIf` anywhere in the file. A test the file
  no longer runs is a guard that no longer guards.
- Self-tests: 8 mutants, all flagged:
  - `the-guard-deleted` cuts the file before the guard;
  - `the-suite-renamed`, `a-test-renamed`, `a-test-commented-out`;
  - `the-suite-skipped`, `a-test-skipped`, `a-test-marked-todo`, `a-test-inverted`.

  3 cosmetic changes are not flagged: a title on its own line, a double-quoted title, and a comment
  that names `describe.skip`.
- `test_the_pin_and_the_contract_name_each_other` now also requires the contract to name the describe
  title and the four test titles, and says which one is missing.

**Red-first on scratch trees** (`pin_trees_r10.py`, appendix D). Each tree copies the six files the
pin file reads to their repository paths.

| tree | differs from the lane in | result |
|---|---|---|
| lane | nothing | **65 passed, 7 xfailed** |
| guard-deleted | `MathText.test.tsx` as at HEAD, before the guard | **1 failed** (guard presence, all 5 titles missing), 53 passed, 11 skipped, 7 xfailed |
| guard-skipped | the lane's test file with `describe.skip` on the guard | **1 failed** (`.skip switches a test off or inverts it`), 53 passed, 11 skipped, 7 xfailed |
| contract-at-head | `LAYER2-RENDERING.md` as at HEAD | **1 failed** (the contract does not name `MathText HTML-sink guard`), 64 passed, 7 xfailed |
| tripwire-two-sinks | mutation (iv) in `MathText.tsx` | **1 failed** (the message above), 46 passed, 19 skipped, 6 xfailed |
| round9-pin-on-r10 | R10's mutation, with HEAD's pin, contract and test file | 56 passed, 6 xfailed: section 1 |

- Every failure and skip reason from the pin checks carries the sentence "learner renderer changed —
  revisit the Layer-2 threat model in LAYER2-RENDERING.md".
- The exception is the contract check. It is a documentation check, so its message names the missing
  title instead.
- The 11 skips are the guard self-tests on a base without the guard. The 19 skips are the 18 MathText
  self-tests and the R10 record on a base that trips the tripwire.
- In the lane, the contract test was also seen red before the contract edit: `1 failed, 64 passed, 7
  xfailed`, on the missing `MathText HTML-sink guard`.

**Count.** HEAD's file had 56 passed and 6 xfailed. This round removes 3 mutants and adds 1 guard
check, 8 guard mutants, 3 guard cosmetic changes and 1 R10 record, which gives **65 passed and 7
xfailed**. Three tests are renamed:
- `test_mathtext_shows_text_outside_math_as_react_text` → `test_mathtext_source_tripwire`;
- `test_the_mathtext_pin_flags_a_renderer_change` → `test_the_mathtext_tripwire_flags_a_renderer_change`;
- `test_the_mathtext_pin_ignores_a_cosmetic_change` → `test_the_mathtext_tripwire_ignores_a_cosmetic_change`.

## 5. The contract (`pipeline/synthetic/LAYER2-RENDERING.md`)

- **New section "Beteendevakten (PR #370 rond 10, bead hpf-sn6u)".**
  - **R10's mechanism**: round 9's pin read only the start of the `html` field, and every regex over
    source has the same class of bypass.
  - **"Garantin"**: `MathText` inserts only KaTeX's output as HTML, and segment text and prose are
    always text nodes.
  - **"Auktoriteten är beteendevakten"**: it names `MathText HTML-sink guard` in
    `app/src/components/MathText.test.tsx`, says that CI's app job runs it with Vitest (`pnpm test`),
    lists the 8 hostile strings and names each of the 4 tests with what it checks.
  - **"Python-nålen är en snubbeltråd"**: it lists the coarse checks and the heuristic, and says that
    R10's mutation passes the tripwire and is recorded as a strict xfail. It also covers the
    guard-presence check.
  - **"Mutationsbevis"** points here.
  - **"Gränser"**: the guard tests behaviour on its own strings; an input-conditional bypass is outside
    it. The 4 096-character gate is caught by round 9's 20 000-level test and by the heuristic.
- **Round 8's pin bullet** made the pin detect "ett [dangerouslySetInnerHTML] som matas med annat än
  KaTeX:s utdata". It now reads "Antagandet är bevakat": the guard is the authority, the Python file is
  a tripwire, and its trips are listed. The next bullet now says "När vakten eller snubbeltråden
  fäller".
- **Round 9's "Fastnålat." bullet** said the pin fails if "reservvägen eller någon annan väg kan föra
  segmenttext till `dangerouslySetInnerHTML`". It is now "Bevakat sedan rond 10", and the guard's
  `KaTeX throws on a math segment: it is a text node` holds the fallback to text.
- **No new label tokens.** Round 5's coverage test harvests the ALL_CAPS snake tokens of pipeline `.md`
  files as labels. The contract's set is unchanged: `SCOPE_SHIFT`, `WORLD_KNOWLEDGE` and
  `WORLD__KNOWLEDGE` (section 6).

## 6. Suites and checks (`evidence_r10.py`, appendix F; `tsc_r10.py`, appendix E)

**App, from `app/`**:
- `npx vitest run --reporter=default src/components/MathText.test.tsx` gives `Tests 48 passed (48)`.
  That is round 9's 16 plus the guard's 32.
- `npx vitest run --reporter=default`, twice: `Test Files 75 passed (75)`, `Tests 794 passed (794)`
  both times, at 7.89 s and 6.57 s.
  - The guard adds 32 to the bead's baseline of 762.
  - The MathText file took 2730 ms and 2170 ms, nearly all of it round 9's deep test (2344 ms and
    1853 ms).
  - The stderr lines (`act(...)` warnings, `useRouter must be used inside a <RouterProvider>`) come
    from other test files, as in round 9.

**Biome** 2.4.14, `npx biome check src/components/MathText.test.tsx`: `Checked 1 file … No fixes
applied.`

**Typecheck.** `tsc -p tsconfig.app.json --noEmit` exits 2 with 165 diagnostics in 27 files.
- All of them are under `../worker/`, and none is in a MathText file. `tsconfig.node.json` is clean.
- Round 9 reported the same count, 165 in 27 files, for the same reason: `worker/` has no
  `node_modules` in the lane (`docs/worklog/hpf-dhjn.md`, section 3).
- No diagnostic is in `app/src`, so the guard's code adds none.

**Python, from the lane root:**
- `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` gives `777 passed,
  7 xfailed`.
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests
  pipeline/synthetic/gates/scripts/tests -q`, the `contract` job's command in `.github/workflows/ci.yml`,
  gives `847 passed, 7 xfailed`.
- The deltas from the bead's baselines (768 and 838 passed, 6 xfailed) are +9 passed and +1 xfailed,
  all in the pin file. Round 5's label-vocabulary test passes on the revised contract.

**The rest of the evidence** (`evidence_r10.py`, verbatim):

```
app/src/components/MathText.tsx byte-identical to HEAD's: True (SHA-256 e0f6bebde60da68bd12df2354fa4576dfe78caad4b876f50b71159e85e36639b)
pipeline/synthetic/gates/scripts/lint_learner_output.py byte-identical to HEAD's: True (SHA-256 0d0455e73e5bc0992eb6d6c05e29a81340e83a8f7c2c400bdfedf7eca8805aeb)

=== B. the lint's store probe
default: exit 1, 2 finding(s), ['learner-output lint: 2 finding(s) in 27 file(s)']
--strict: exit 1, 74 finding(s), ['learner-output lint: 74 finding(s) in 27 file(s)']

=== C. ALL_CAPS snake tokens in LAYER2-RENDERING.md (round 5's doc label source)
head ['SCOPE_SHIFT', 'WORLD_KNOWLEDGE', 'WORLD__KNOWLEDGE'], lane ['SCOPE_SHIFT', 'WORLD_KNOWLEDGE', 'WORLD__KNOWLEDGE'], identical: True

=== D. raw characters, head vs lane
  app/src/components/MathText.test.tsx
    odd characters: head {}, lane {}, same: True
    backslash-u lines: head [16, 60], lane [17, 61], same count: True
  pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py
    odd characters: head {}, lane {}, same: True
    backslash-u lines: head [], lane [], same count: True
  pipeline/synthetic/LAYER2-RENDERING.md
    odd characters: head {}, lane {}, same: True
    backslash-u lines: head [], lane [], same count: True
  app/src/components/MathText.tsx
    odd characters: head {'U+200B': 1, 'U+E000': 1, 'U+E001': 1}, lane {'U+200B': 1, 'U+E000': 1, 'U+E001': 1}, same: True
    backslash-u lines: head [], lane [], same count: True
```

The test file's two backslash-u lines are its existing `M()` helper and the unbalanced-delimiter test,
one line lower because of the new header line. The guard takes its delimiters from `M()`.

## 7. Residual risks

1. **The guard is example-based.** It proves behaviour on its 8 strings through 4 paths, not on every
   input. A bypass conditional on other inputs is not caught by the guard. Mutation (vii), a 4 096
   length gate, is caught only by round 9's 140 038-character test and by the tripwire's heuristic. A
   gate set higher, or one keyed on content the strings lack, would pass all three. Code review
   remains the control there, as for any test.
2. **The KaTeX path trusts KaTeX's return value.** Whatever `katex.renderToString` returns counts as
   KaTeX's output.
   - KaTeX options that make the output active are KaTeX's output too.
   - The tag rule catches `trust: true` through `\href` (vi), and would catch an `<img>` from
     `\includegraphics`.
   - It does not inspect the attributes that trusted `\htmlClass`, `\htmlStyle`, `\htmlId` and
     `\htmlData` put on spans.
   - Today's options do not set `trust`, and the tripwire reads only `throwOnError`. A `trust` check
     would be a one-line coarse addition, but it was out of this round's scope.
3. **jsdom is not a browser.** The guard checks the DOM jsdom builds from the sink's HTML. Differences
   between jsdom's HTML parser and a browser's (mutation-XSS class) are not modelled. What the sink
   receives is KaTeX's escaped spans.
4. **The presence check reads titles, not bodies.** It catches a deleted, renamed, commented-out,
   skipped, todo or inverted test. It does not catch a test whose title stays and whose assertions are
   removed. Review covers that, and so does re-running the mutation proof (appendix B).
5. **The heuristic is a shape check.** It flags the equivalent mutant (x), and its message says
   "heuristic". It is defence in depth, not the authority.
6. **Unchanged from earlier rounds.** Round 8's residual 1 still applies: components that bypass
   `MathText` are not covered by this guard. So does round 9's residual 2: the depth at which KaTeX
   throws depends on the stack.

## 8. Reproduction, coordination and harness notes

```
git rev-parse HEAD   # 8adfd1bd57c3ac6069082e3f606321125196b2d7
cd app && npx vitest run --reporter=default src/components/MathText.test.tsx   # 48 passed
cd app && npx vitest run --reporter=default                                    # 75 files, 794 passed (twice)
cd app && npx biome check src/components/MathText.test.tsx                     # clean
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py   # 65 passed, 7 xfailed
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests          # 777 passed, 7 xfailed
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q   # 847 passed, 7 xfailed
# S = a scratch dir; every script is an appendix below
node hostile_probe.cjs "$PWD"                                     # A
python3 mutation_proof_r10.py "$PWD" $S $S/mutation_proof_r10.txt # B (writes only under $S/mut)
python3 stray_r10.py "$PWD" $S vi javascript $S/stray_vi.txt      # C (runs in $S/mut/vi; needs B first)
python3 pin_trees_r10.py "$PWD" $S $S/pin_trees_r10.txt           # D (writes only under $S/pin)
python3 tsc_r10.py "$PWD" $S/tsc_r10.txt                          # E
python3 evidence_r10.py "$PWD" $S/evidence_r10.txt                # F
python3 check_chars_r10.py "$PWD"                                 # G
```

**Coordination note.** The bead's metadata names `gc.check_path`:
`/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`.
- Its SHA-256 is `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`, the same as in
  rounds 5–9.
- It is the dispatcher's producer-stage gate, and this bead names no validator, so it was hashed and
  not run.

**Harness notes.**
- **One command per call.** Every check ran as one command or as a script file, with no pipelines.
  The `cd app && …` lines ran as a separate `cd`, then the command.
- **`cd` affected edits.** While the shell sat in `app/`, an edit to the pin file was refused. After a
  `cd` back to the lane root, the same edit went through. Edits were made from the lane root from then
  on.
- **A `cd` outside the project is reset.** One `cd` into a scratch tree was reset to the lane root.
  The next command, a Vitest run meant for that tree, ran from the lane root without the app's config,
  and 4 tests failed with `document is not defined`.
  - That run is not evidence. Its only write was Vitest's results cache,
    `node_modules/.vite/vitest/<hash>/results.json`, in a new, gitignored `node_modules/` at the lane
    root. That directory was inspected and removed.
  - Appendix C's script runs Vitest in the tree through `subprocess` with that tree as its working
    directory.
- **Inline code is not allowed.** `python3 -c '…'` was refused by the worker policy. Probes are script
  files instead, listed below.
- **No new raw characters.** No written file holds a raw private-use character or a new backslash-u
  sequence:
  - the guard builds its strings with the existing `M()` helper;
  - the scripts build any such character with `chr()`;
  - the probe output, which holds KaTeX's U+200B, is described in section 2, not pasted.

  `check_chars_r10.py` (appendix G) ran after the last edit of this file.

## Appendices

Each appendix is the exact source of a probe script, appended from its file by
`append_appendices_r10.py` (appendix H). Its header carries the file's SHA-256 as run. Every script is
read-only towards the lane's tracked files. `mutation_proof_r10.py` and `pin_trees_r10.py` write only
under the scratch directory.

### Appendix A — `hostile_probe.cjs` (SHA-256 `208088ada36b3397f17141e3bfa93689545c0d721fffb965ed67f966fe3a7386`)

KaTeX 0.16.45 and jsdom on the guard's eight hostile strings (section 2).

```javascript
// Read-only probe for bead hpf-sn6u: what the lane's locked KaTeX, with
// MathText's options, makes of each hostile segment the behavioural guard
// uses, and what an HTML parser would make of the same segment if it were
// inserted as HTML. Uses the lane's app/node_modules (katex, jsdom).
// usage: node hostile_probe.cjs <lane-root>
const path = require('node:path')
const { createRequire } = require('node:module')

const lane = process.argv[2]
const appRequire = createRequire(path.join(lane, 'app/package.json'))
const katex = appRequire('katex')
const { JSDOM } = appRequire('jsdom')
const OPTIONS = { output: 'html', throwOnError: false, strict: 'ignore' }

// the guard's HOSTILE list in MathText.test.tsx, string for string
const HOSTILE = [
  ['R8-H1, a quoted > in an attribute', 'WORLD_<span title=">">KNOWLEDGE</span>'],
  ['an img with an event handler', '<img src=x onerror=alert(1)>'],
  ['a bold label', '<b>WORLD_KNOWLEDGE</b>'],
  ['a numeric character reference', 'WORLD&#95;KNOWLEDGE'],
  ['a named character reference', 'WORLD&lowbar;KNOWLEDGE'],
  ["a span that spoofs KaTeX's class", '<span class="katex">WORLD</span>_KNOWLEDGE'],
  ['R8-M6, a Markdown link', '[WORLD](a(b(c)d)e)_KNOWLEDGE'],
  ['a KaTeX link to javascript:', '\\href{javascript:alert(1)}{WORLD}'],
]

const { document } = new JSDOM('<!doctype html><body></body>').window
const count = (s, c) => s.split(c).length - 1

function describe(html) {
  const span = document.createElement('span')
  span.innerHTML = html
  const tags = [...span.querySelectorAll('*')].map((el) => el.tagName.toLowerCase())
  const titled = [...span.querySelectorAll('[title]')].map((el) => el.className || el.tagName.toLowerCase())
  return { text: span.textContent, tags: [...new Set(tags)].sort(), titled }
}

console.log(`katex ${katex.version}, node ${process.version}`)
for (const [name, segment] of HOSTILE) {
  console.log(`\n=== ${name}: ${JSON.stringify(segment)}`)
  let html
  try {
    html = katex.renderToString(segment, OPTIONS)
  } catch (e) {
    console.log(`  KaTeX THROWS ${e?.constructor?.name}: ${String(e?.message).slice(0, 100)}`)
    continue
  }
  const k = describe(html)
  console.log(`  KaTeX: katex-error=${html.includes('katex-error')}, tags ${JSON.stringify(k.tags)}, ` +
    `title on ${JSON.stringify(k.titled)}`)
  console.log(`  KaTeX text: ${JSON.stringify(k.text)}`)
  for (const c of ['<', '>', '&', '"']) {
    if (count(segment, c)) console.log(`    ${c}: segment ${count(segment, c)}, KaTeX text ${count(k.text, c)}`)
  }
  const h = describe(segment)
  console.log(`  as HTML: tags ${JSON.stringify(h.tags)}, text ${JSON.stringify(h.text)}`)
  // the same segment with trust: true, the KaTeX option the guard's tag rule watches
  const t = describe(katex.renderToString(segment, { ...OPTIONS, trust: true }))
  if (JSON.stringify(t.tags) !== JSON.stringify(k.tags)) {
    console.log(`  KaTeX with trust: true: tags ${JSON.stringify(t.tags)}`)
  }
}
```

### Appendix B — `mutation_proof_r10.py` (SHA-256 `0a38876503671d6c9c462acc9625265746599e9dfde05c28550f0efa207b1463`)

The guard against each mutation of MathText.tsx, on scratch app trees, with the tripwire alongside (section 3).

```python
"""Mutation proof for bead hpf-sn6u: the behavioural guard in MathText.test.tsx
against mutations of MathText.tsx, on scratch copies of the app. Read-only
towards the lane's tracked files: every tree is written under <scratch>/mut.

Each tree copies app/src and the app's root config files (.json, .ts), links
node_modules to the lane's, and holds the lane's MathText.test.tsx. The trees
differ only in MathText.tsx: the lane's file unchanged (baseline), or one
mutation. (i)-(iv) are the bead's; the rest are extra.

Vitest runs src/components/MathText.test.tsx in each tree with the JSON
reporter. Per tree: the mutation as a diff; the counts; for each of the
guard's four tests, how many of the 8 hostile strings fail; the other tests
that fail; one failure message per failing guard test. Then the lane's Python
tripwire, mathtext_problems(), on the same MathText.tsx.

usage: mutation_proof_r10.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import builtins
import difflib
import hashlib
import importlib.util
import json
import shutil
import subprocess
import sys
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2]) / "mut"
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
COMPONENT = "app/src/components/MathText.tsx"
TESTS = "app/src/components/MathText.test.tsx"
PIN = "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py"
SUITE = "MathText HTML-sink guard"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def git(*args) -> bytes:
    return subprocess.run(["git", *args], cwd=LANE, capture_output=True, check=True).stdout


def lane_component() -> str:
    return (LANE / COMPONENT).read_text(encoding="utf-8")


def edited(*changes) -> str:
    src = lane_component()
    for anchor, replacement in changes:
        assert src.count(anchor) == 1, anchor
        src = src.replace(anchor, replacement)
    return src


KATEX_INIT = ("      html: katex.renderToString(wrapUnits(latex), {\n"
              "        output: 'html',\n"
              "        throwOnError: false,\n"
              "        strict: 'ignore',\n"
              "      }),\n")
TEXT_SPAN = "<span key={idx}>{seg.text}</span>"
# (id, what it does, MathText.tsx source)
MUTATIONS = [
    ("baseline", "the lane's MathText.tsx, unchanged", lane_component),
    ("i", "R10: the html field is KaTeX's output with the raw segment appended",
     lambda: edited(("      }),\n    }\n  } catch {", "      }) + latex,\n    }\n  } catch {"))),
    ("ii", "round 9's original raw fallback: MathText.tsx as at HEAD~1, R9's code",
     lambda: git("show", f"HEAD~1:{COMPONENT}").decode("utf-8")),
    ("iii", "html: latex on the normal path, KaTeX not called",
     lambda: edited((KATEX_INIT, "      html: latex,\n"))),
    ("iv", "a prose segment rendered with dangerouslySetInnerHTML",
     lambda: edited((TEXT_SPAN, "<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />"))),
    ("ii-b", "the raw fallback in today's shape: the catch returns { html: latex }",
     lambda: edited(("return { text: latex }", "return { html: latex }"))),
    ("ii-c", "the fallback's text into a second sink",
     lambda: edited(("{math.text}", "<span dangerouslySetInnerHTML={{ __html: math.text }} />"))),
    ("iii-b", "the sink takes the segment: __html: latex",
     lambda: edited(("__html: math.html", "__html: latex"))),
    ("v", "the fast path (no math) rendered with dangerouslySetInnerHTML",
     lambda: edited(("return <>{children}</>", "return <span dangerouslySetInnerHTML={{ __html: children }} />"))),
    ("vi", "KaTeX trusted: trust: true",
     lambda: edited(("        strict: 'ignore',\n", "        strict: 'ignore',\n        trust: true,\n"))),
    ("vii", "round 9's length-gated bypass: html: latex.length > 4096 ? latex : katex.renderToString(",
     lambda: edited(("html: katex.renderToString(", "html: latex.length > 4096 ? latex : katex.renderToString("))),
    ("viii", "branches swapped: !seg.math ? (",
     lambda: edited(("seg.math ? (", "!seg.math ? ("))),
    ("ix", "KaTeX throws parse errors: throwOnError: true",
     lambda: edited(("throwOnError: false", "throwOnError: true"))),
    ("x", "an equivalent mutant: the sink reads 'html' in math ? math.html : math.text",
     lambda: edited(("__html: math.html", "__html: 'html' in math ? math.html : math.text"))),
]


def build(name: str, component: str) -> Path:
    root = SCRATCH / name
    if root.exists():
        shutil.rmtree(root)
    shutil.copytree(LANE / "app/src", root / "app/src")
    for f in sorted((LANE / "app").iterdir()):
        if f.is_file() and f.suffix in (".json", ".ts"):
            shutil.copyfile(f, root / "app" / f.name)
    (root / "app/node_modules").symlink_to(LANE / "app/node_modules")
    (root / COMPONENT).write_text(component, encoding="utf-8")
    assert (root / TESTS).read_bytes() == (LANE / TESTS).read_bytes()
    return root


def load_pin():
    spec = importlib.util.spec_from_file_location("pin_r10", LANE / PIN)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def first_line(messages: list[str]) -> str:
    for line in (messages[0] if messages else "").splitlines():
        if line.strip():
            return line.strip()[:220]
    return ""


def main():
    pin = load_pin()
    print(f"HEAD {git('rev-parse', 'HEAD').decode().strip()}, HEAD~1 {git('rev-parse', 'HEAD~1').decode().strip()}")
    print(f"lane {TESTS}: SHA-256 {hashlib.sha256((LANE / TESTS).read_bytes()).hexdigest()}")
    print(f"lane {COMPONENT}: SHA-256 {hashlib.sha256((LANE / COMPONENT).read_bytes()).hexdigest()}")
    summary = []
    for ident, what, make in MUTATIONS:
        component = make()
        root = build(ident, component)
        out = SCRATCH / f"{ident}.json"
        r = subprocess.run([str(LANE / "app/node_modules/.bin/vitest"), "run", "src/components/MathText.test.tsx",
                            "--reporter=json", f"--outputFile={out}"],
                           cwd=root / "app", capture_output=True, text=True)
        data = json.loads(out.read_text(encoding="utf-8"))
        tests = [t for suite in data["testResults"] for t in suite["assertionResults"]]
        print(f"\n=== ({ident}) {what}")
        print(f"MathText.tsx SHA-256 {hashlib.sha256(component.encode('utf-8')).hexdigest()}")
        diff = [ln for ln in difflib.unified_diff(lane_component().splitlines(), component.splitlines(),
                                                  lineterm="", n=0)
                if ln[:1] in "+-" and not ln.startswith(("+++", "---"))]
        if ident == "ii":
            print(f"diff vs the lane: {len(diff)} changed lines (HEAD~1's whole file; not listed)")
        else:
            for ln in diff:
                print(f"  {ln}")
        print(f"vitest exit {r.returncode}: {data['numPassedTests']} passed, {data['numFailedTests']} failed, "
              f"of {data['numTotalTests']}")
        guard = [t for t in tests if t["ancestorTitles"] == [SUITE]]
        by_path: dict[str, list] = {}
        for t in guard:
            by_path.setdefault(t["title"].split(" — ")[0], []).append(t)
        failed_paths = []
        for path, ts in by_path.items():
            failed = [t for t in ts if t["status"] == "failed"]
            passed = [t["title"].split(" — ", 1)[1] for t in ts if t["status"] == "passed"]
            print(f"  guard: {path}: {len(failed)}/{len(ts)} failed"
                  + (f"; passed: {passed}" if failed and passed else ""))
            if failed:
                failed_paths.append(path)
                print(f"      e.g. [{failed[0]['title'].split(' — ', 1)[1]}] {first_line(failed[0]['failureMessages'])}")
        others = [t["fullName"] for t in tests if t["ancestorTitles"] != [SUITE] and t["status"] != "passed"]
        print(f"  other tests failing: {others if others else 'none'}")
        problems = pin.mathtext_problems(component)
        short = [p.split(",")[0][:90] for p in problems]
        print(f"  Python tripwire: {len(problems)} problem(s) {short}")
        summary.append((ident, sum(t["status"] == "failed" for t in guard), len(guard), failed_paths, others,
                        len(problems)))
    print("\n=== summary: (mutation, guard tests failed, of, guard paths failing, other tests failing, "
          "tripwire problems)")
    for row in summary:
        print(f"  {row}")
    REPORT.close()


main()
```

### Appendix C — `stray_r10.py` (SHA-256 `53f9b2acf76ee1c190113b5c5ed4bab303fb8f48a61525a62f496e45ed2fc915`)

One scratch tree rerun with Vitest's default reporter, for the assertion diff (section 3, mutation vi).

```python
"""For bead hpf-sn6u: rerun one scratch tree of mutation_proof_r10.py with
Vitest's default reporter, which prints assertion diffs, filtered by a test
name pattern. Read-only towards the lane: Vitest runs in <scratch>/mut/<tree>/app.
usage: stray_r10.py <lane-root> <scratch-dir> <tree> <name-pattern> <report-path>
"""
import subprocess
import sys
from pathlib import Path

LANE, SCRATCH, TREE, PATTERN, REPORT = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3], sys.argv[4], sys.argv[5]
app = SCRATCH / "mut" / TREE / "app"
r = subprocess.run([str(LANE / "app/node_modules/.bin/vitest"), "run", "src/components/MathText.test.tsx",
                    "--reporter=default", "-t", PATTERN], cwd=app, capture_output=True, text=True)
Path(REPORT).write_text(f"tree {TREE}, cwd {app}, exit {r.returncode}\n{r.stdout}\n--- stderr\n{r.stderr}",
                        encoding="utf-8")
```

### Appendix D — `pin_trees_r10.py` (SHA-256 `3ecc9fe20c4b70dba74b109ffb288ea44c920896e90f7d66517d8d3a53d5592d`)

The Python checks on scratch trees, and R10's finding reproduced (sections 1 and 4).

```python
"""Red-first for bead hpf-sn6u's Python checks, on scratch copies of the tree.
Read-only towards the lane: every tree is written under <scratch>/pin.

Each tree copies, at their repository paths, the files the pin file reads:
app/package.json, MathText.tsx, MathText.test.tsx, LAYER2-RENDERING.md, the
lint and the pin file. "lane" is the lane's copy, "HEAD" is git show HEAD:.

  lane               the lane's files
  guard-deleted      MathText.test.tsx as at HEAD: no behavioural guard
  guard-skipped      the lane's MathText.test.tsx with describe.skip on the guard
  contract-at-head   LAYER2-RENDERING.md as at HEAD: the guard is not named
  tripwire-two-sinks MathText.tsx with a prose segment as raw HTML: the
                     tripwire's own failure message
  round9-pin-on-r10  Codex R10's finding: round 9's pin file, contract and
                     test file (all HEAD) on MathText.tsx with R10's mutation

For each tree: pytest on the pin file with JUnit XML; each failure, and
whether its message carries the required sentence; skip reasons; counts.

usage: pin_trees_r10.py <lane-root> <scratch-dir> <report-path>
"""
from __future__ import annotations

import builtins
import collections
import hashlib
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

LANE = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2]) / "pin"
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
MATHTEXT = "app/src/components/MathText.tsx"
GUARD = "app/src/components/MathText.test.tsx"
CONTRACT = "pipeline/synthetic/LAYER2-RENDERING.md"
PIN = "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py"
FILES = ("app/package.json", MATHTEXT, GUARD, CONTRACT,
         "pipeline/synthetic/gates/scripts/lint_learner_output.py", PIN)
CHANGED = "learner renderer changed — revisit the Layer-2 threat model in LAYER2-RENDERING.md"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def head(rel: str) -> bytes:
    return subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, check=True).stdout


def lane(rel: str) -> bytes:
    return (LANE / rel).read_bytes()


def r10_mathtext() -> bytes:
    """The lane's MathText.tsx with Codex R10's mutation: KaTeX's output + the raw segment."""
    src = lane(MATHTEXT).decode("utf-8")
    anchor = "      }),\n    }\n  } catch {"
    assert src.count(anchor) == 1
    return src.replace(anchor, "      }) + latex,\n    }\n  } catch {").encode("utf-8")


def two_sinks_mathtext() -> bytes:
    """The lane's MathText.tsx with a prose segment rendered as raw HTML: a second sink."""
    src = lane(MATHTEXT).decode("utf-8")
    anchor = "<span key={idx}>{seg.text}</span>"
    assert src.count(anchor) == 1
    return src.replace(anchor, "<span key={idx} dangerouslySetInnerHTML={{ __html: seg.text }} />").encode("utf-8")


def skipped_guard() -> bytes:
    src = lane(GUARD).decode("utf-8")
    anchor = "describe('MathText HTML-sink guard'"
    assert src.count(anchor) == 1
    return src.replace(anchor, "describe.skip('MathText HTML-sink guard'").encode("utf-8")


# name: (what differs from the lane, {path: source of its bytes})
TREES = {
    "lane": ("nothing: all lane files", {}),
    "guard-deleted": ("MathText.test.tsx as at HEAD, before the guard", {GUARD: lambda: head(GUARD)}),
    "guard-skipped": ("the lane's MathText.test.tsx with describe.skip on the guard", {GUARD: skipped_guard}),
    "contract-at-head": ("LAYER2-RENDERING.md as at HEAD", {CONTRACT: lambda: head(CONTRACT)}),
    "tripwire-two-sinks": ("MathText.tsx with a prose segment as raw HTML (mutation iv)",
                           {MATHTEXT: two_sinks_mathtext}),
    # Codex R10's finding, reproduced: round 9's whole suite (HEAD's pin,
    # contract and test file) on MathText.tsx with R10's mutation
    "round9-pin-on-r10": ("R10's mutation in MathText.tsx, with HEAD's pin file, contract and test file",
                          {MATHTEXT: r10_mathtext, PIN: lambda: head(PIN), CONTRACT: lambda: head(CONTRACT),
                           GUARD: lambda: head(GUARD)}),
}


def build(name: str, overrides: dict) -> Path:
    root = SCRATCH / name
    if root.exists():
        shutil.rmtree(root)
    for rel in FILES:
        (root / rel).parent.mkdir(parents=True, exist_ok=True)
        (root / rel).write_bytes(overrides[rel]() if rel in overrides else lane(rel))
    return root


def main():
    for rel in FILES:
        print(f"lane {hashlib.sha256(lane(rel)).hexdigest()}  {rel}")
    for name, (differs, overrides) in TREES.items():
        root = build(name, overrides)
        xml = SCRATCH / f"{name}.xml"
        r = subprocess.run([sys.executable, "-m", "pytest", "-q", "-p", "no:cacheprovider", str(root / PIN),
                            f"--junitxml={xml}"], capture_output=True, text=True, cwd=root)
        print(f"\n=== tree {name}: differs from the lane in {differs}")
        print(f"  pytest exit {r.returncode}: {r.stdout.strip().splitlines()[-1]}")
        outcomes = collections.Counter()
        skips = []
        for case in ET.parse(xml).getroot().iter("testcase"):
            failure, skipped = case.find("failure"), case.find("skipped")
            if failure is not None:
                outcomes["failed"] += 1
                message = failure.get("message") or ""
                print(f"  FAILED {case.get('name')}")
                print(f"    carries the required sentence: {CHANGED in message}")
                print(f"    message: {message[:700]}")
            elif skipped is not None:
                kind = "xfailed" if "xfail" in (skipped.get("type") or "") else "skipped"
                outcomes[kind] += 1
                if kind == "skipped":
                    skips.append(skipped.get("message") or "")
            else:
                outcomes["passed"] += 1
        print(f"  outcomes: {dict(sorted(outcomes.items()))}")
        if skips:
            print(f"  {len(skips)} skipped; every skip reason carries the sentence: "
                  f"{all(CHANGED in s for s in skips)}; first: {skips[0][:200]}")
    REPORT.close()


main()
```

### Appendix E — `tsc_r10.py` (SHA-256 `a3972b5b9bf1b1c24bf37de9fa4b5f06162bfd2f44fe30609386dc2de1c0173d`)

The app's typecheck, offline (section 6).

```python
"""Typecheck evidence for bead hpf-sn6u: the app project's diagnostics, with
none in app/src (the known offline failures are all under ../worker/src, whose
node_modules the lane does not have; see docs/worklog/hpf-dhjn.md section 3).
Read-only: tsc runs with --noEmit.
usage: tsc_r10.py <lane-root> <report-path>
"""
import collections
import re
import subprocess
import sys
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = Path(sys.argv[2])
TSC = LANE / "app/node_modules/typescript/bin/tsc"
DIAG = re.compile(r"^(?P<file>[^\s(][^(]*)\((?P<line>\d+),(?P<col>\d+)\): error (?P<code>TS\d+): (?P<msg>.*)$")
lines = []
for project in ("tsconfig.app.json", "tsconfig.node.json"):
    r = subprocess.run(["node", str(TSC), "-p", project, "--noEmit"], cwd=LANE / "app", capture_output=True, text=True)
    diags = [m.groupdict() for m in map(DIAG.match, r.stdout.splitlines()) if m]
    files = collections.Counter(d["file"] for d in diags)
    outside = sorted({d["file"] for d in diags if not d["file"].startswith("../worker/")})
    lines.append(f"tsc -p {project} --noEmit: exit {r.returncode}, {len(diags)} diagnostics in {len(files)} files")
    lines.append(f"  files outside ../worker/: {outside}")
    lines.append(f"  MathText files: {[f for f in files if 'MathText' in f]}")
REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")
```

### Appendix F — `evidence_r10.py` (SHA-256 `31514a8e1f56d945afabb0c9be49d62c230fc8502635e1fb97ccb7e4cec485c4`)

HEAD, the changed files, the unchanged lint and store probe, the contract's ALL_CAPS tokens, raw characters (section 6).

```python
"""Evidence for bead hpf-sn6u (read-only towards the lane). Sections:

  A. HEAD; git status, with the pre-existing gc/agent directories and the
     sandbox's /dev/null mounts counted apart; each changed file's SHA-256 and
     git blob id; git diff --stat; MathText.tsx and the lint byte-identical to
     HEAD's;
  B. the lint's store probe (its CLI over data/explanations, default and
     --strict);
  C. LAYER2-RENDERING.md's ALL_CAPS snake tokens, which round 5 harvests as
     labels, head vs lane;
  D. raw characters: per changed file, every Cf, default-ignorable,
     private-use, surrogate, combining, unusual space or control character,
     and the backslash-u lines, head vs lane.

usage: evidence_r10.py <lane-root> <report-path>
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
MATHTEXT = "app/src/components/MathText.tsx"
CHANGED = ("app/src/components/MathText.test.tsx",
           "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py", DOC)
PRE_EXISTING = (".claude/skills/", ".agents/", ".codex/", ".gc/")
EXTRA_IGNORABLE = ({0x034F, 0x115F, 0x1160, 0x17B4, 0x17B5, 0x3164, 0xFFA0} | set(range(0x180B, 0x1810))
                   | set(range(0xFE00, 0xFE10)) | set(range(0xE0100, 0xE01F0)))
BACKSLASH_U = chr(0x5C) + "u"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def git(*args) -> str:
    return subprocess.run(["git", *args], cwd=LANE, capture_output=True, text=True, check=True).stdout


def head_bytes(rel: str) -> bytes:
    return subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, check=True).stdout


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
for rel in (MATHTEXT, LINT):
    data = (LANE / rel).read_bytes()
    print(f"{rel} byte-identical to HEAD's: {data == head_bytes(rel)} (SHA-256 {hashlib.sha256(data).hexdigest()})")

# ------------------------------------------------------------------ B
print("\n=== B. the lint's store probe")
for strict in (False, True):
    r = subprocess.run([sys.executable, str(LANE / LINT), *(["--strict"] if strict else []),
                        str(LANE / "data/explanations")], capture_output=True, text=True)
    lines = r.stdout.splitlines()
    findings = [ln for ln in lines if ln.startswith("L2-")]
    print(f"{'--strict' if strict else 'default'}: exit {r.returncode}, {len(findings)} finding(s), "
          f"{[ln for ln in lines if not ln.startswith('L2-')]}")

# ------------------------------------------------------------------ C
print("\n=== C. ALL_CAPS snake tokens in LAYER2-RENDERING.md (round 5's doc label source)")
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts/tests"))
sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts"))
import lint_learner_output as lint  # noqa: E402
import test_verdict_enum_and_label_vocabulary_round5 as r5  # noqa: E402


def doc_caps(text: str) -> set:
    return {m.group(0) for line in text.splitlines() for m in lint._SNAKE_TOKEN.finditer(line)
            if m.group(0).isupper() and m.group(0) not in r5.NOT_LABELS and r5._is_label_shaped(m.group(0))}


h, l_ = doc_caps(head_bytes(DOC).decode("utf-8")), doc_caps((LANE / DOC).read_text(encoding="utf-8"))
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


for rel in (*CHANGED, MATHTEXT):
    (hc, he), (lc, le) = census(head_bytes(rel).decode("utf-8")), census((LANE / rel).read_text(encoding="utf-8"))
    print(f"  {rel}")
    print(f"    odd characters: head {hc}, lane {lc}, same: {hc == lc}")
    print(f"    backslash-u lines: head {he}, lane {le}, same count: {len(he) == len(le)}")
REPORT.close()
```

### Appendix G — `check_chars_r10.py` (SHA-256 `d6a956d37a3a7694ba6830bfcd43d95bb8afd2089dec1115cb186484f87f2346`)

No raw invisible, private-use or combining character and no backslash-u sequence in this file (section 8).

```python
"""Read-only: bead hpf-sn6u's worklog holds no raw invisible (Cf or other
default-ignorable), private-use, surrogate, combining, unusual space or
control character and no backslash-u sequence; the changed files hold the
same such characters as at HEAD, and MathText.tsx is byte-identical to HEAD's.

usage: check_chars_r10.py <lane-root>
"""
import collections
import subprocess
import sys
import unicodedata
from pathlib import Path

LANE = Path(sys.argv[1])
WORKLOG = "docs/worklog/hpf-sn6u.md"
CHANGED = ("app/src/components/MathText.test.tsx",
           "pipeline/synthetic/gates/scripts/tests/test_lint_renderer_assumption_round8.py",
           "pipeline/synthetic/LAYER2-RENDERING.md")
MATHTEXT = "app/src/components/MathText.tsx"
EXTRA_IGNORABLE = ({0x034F, 0x115F, 0x1160, 0x17B4, 0x17B5, 0x3164, 0xFFA0} | set(range(0x180B, 0x1810))
                   | set(range(0xFE00, 0xFE10)) | set(range(0xE0100, 0xE01F0)))
BACKSLASH_U = chr(0x5C) + "u"


def odd(c):
    cat = unicodedata.category(c)
    return (cat in ("Cf", "Co", "Cs", "Mn", "Me", "Mc") or ord(c) in EXTRA_IGNORABLE
            or (cat == "Zs" and c != " ") or (cat == "Cc" and c not in "\n\t"))


def census(text):
    return dict(sorted(collections.Counter(f"U+{ord(c):04X}" for c in text if odd(c)).items()))


def head(rel):
    return subprocess.run(["git", "show", f"HEAD:{rel}"], cwd=LANE, capture_output=True, check=True).stdout


text = (LANE / WORKLOG).read_text(encoding="utf-8")
bad = [(n, f"U+{ord(c):04X}") for n, line in enumerate(text.splitlines(), 1) for c in line if odd(c)]
escapes = [n for n, line in enumerate(text.splitlines(), 1) if BACKSLASH_U in line]
print(f"{WORKLOG}: {'clean' if not bad and not escapes else f'odd {bad[:20]}, backslash-u lines {escapes}'}")
for rel in CHANGED:
    lane = (LANE / rel).read_text(encoding="utf-8")
    print(f"{rel}: lane {census(lane)}, same as HEAD: {census(lane) == census(head(rel).decode('utf-8'))}")
print(f"{MATHTEXT}: byte-identical to HEAD's: {(LANE / MATHTEXT).read_bytes() == head(MATHTEXT)}")
```

### Appendix H — `append_appendices_r10.py` (SHA-256 `86db65331f45249a7470488872c0ba08838bf08df6817d5e707a90051b7b90b9`)

This appendix list.

```python
"""Append each probe script's exact source, with its SHA-256, to the worklog's
"## Appendices" section. Idempotent: anything after the section's intro
paragraph is cut first, and a trailing "## Bead note (pending)" section, if
any, is kept after the appendices.
usage: append_appendices_r10.py <worklog-path> <scratch-dir>"""
import hashlib
import sys
from pathlib import Path

WORKLOG = Path(sys.argv[1])
SCRATCH = Path(sys.argv[2])
APPENDICES = [
    ("A", "hostile_probe.cjs", "javascript", "KaTeX 0.16.45 and jsdom on the guard's eight hostile strings "
                                             "(section 2)."),
    ("B", "mutation_proof_r10.py", "python", "The guard against each mutation of MathText.tsx, on scratch app "
                                             "trees, with the tripwire alongside (section 3)."),
    ("C", "stray_r10.py", "python", "One scratch tree rerun with Vitest's default reporter, for the assertion "
                                    "diff (section 3, mutation vi)."),
    ("D", "pin_trees_r10.py", "python", "The Python checks on scratch trees, and R10's finding reproduced "
                                        "(sections 1 and 4)."),
    ("E", "tsc_r10.py", "python", "The app's typecheck, offline (section 6)."),
    ("F", "evidence_r10.py", "python", "HEAD, the changed files, the unchanged lint and store probe, the "
                                       "contract's ALL_CAPS tokens, raw characters (section 6)."),
    ("G", "check_chars_r10.py", "python", "No raw invisible, private-use or combining character and no "
                                          "backslash-u sequence in this file (section 8)."),
    ("H", "append_appendices_r10.py", "python", "This appendix list."),
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
