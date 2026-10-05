# hpf-klv6 — PR #370 fix round 7: close the Layer-2 label-evasion family

Origin: Codex exact-head review R7, hpf-geqt (VERDICT: HOLD at 6fbc6d2), of PR #370 (pipeline
hardening, origin bead hpf-y1p4). This round closes its single [FIX-INCOMPLETE][medium] finding. The
finding is closed as a family, against a threat model, not as one more spelling. Rounds 1–6
(hpf-qo10, hpf-oy2w, hpf-96rj, hpf-wu46, hpf-6fkm, hpf-pvkp) are not reworked.

- Lane: `/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`.
- `git rev-parse HEAD` = `6fbc6d29d2ec06dd8912d45621fd7becd09f6f84`, verified first.
- All changes are UNCOMMITTED.

Notation: `U+XXXX` names one code point. This file holds no raw invisible, combining, bidi or
private-use character. Where an output line held one, it is written `<U+XXXX>`, which is also the
lane CLI's own notation.

## Outcome

- **Finding (lint, medium): closed, as a family.**
  - On head, the label rule matched only the stored spelling, bounded by `\b`. Every way a
    renderer shows a label differently from that spelling was therefore a new hole.
  - The threat model (section 1) has 26 rows:
    - 20 closed by this round (C5 only for the underscore; head already closed its other cases);
    - 1 closed on head (C1, case);
    - 2 that need no rule (C9 encoding, H4);
    - 3 knowingly left (C8, M7, K5), each with a reason.
  - Every closed row is a generative test.
- **Mechanism, at the tokenizer and normalization layer:**
  - **Boundary.** A token is bounded by anything that is not a letter or digit, and its segments
    are separated by runs of underscores. This closes the R7 finding.
  - **Three rendered views.** Every rule reads the scanned (NFC) text, then three views of it, each
    with a map back to the scanned text:
    - plain view: invisible characters dropped, RLO undone, NFKC, stray combining marks dropped;
    - app view: MathText's own rendering, with KaTeX only between the math delimiters;
    - markup view: Markdown, HTML and KaTeX interpreted everywhere.
  - **Fold.** Tier 1 compares in compatibility caseless form.
  - **Reporting.** A finding is still reported against the scanned text.
- **Generative tests:** a new file with 264 tests.
  - Every one of the 117 labels goes through every one of the 177 transforms: 20,709 renderings.
  - 5,776 compatible transform pairs run on 16 label shapes: 92,416 renderings.
  - 8 five-layer stacks run on every label.
  - Unicode-generated sets cover every Cf code point, every compatibility low line and every
    combining mark of the diacritic blocks.
  - Guards: the maths names under every transform (15,170 renderings must not flag), prose with
    emphasis, the store's own LaTeX, cloze blanks and GATEREF's arithmetic exemption.
- **Red-first.**
  - Red run 1 (the draft, 246 tests, lint at 6fbc6d2): 172 failed, 74 passed.
  - The draft was rebuilt byte-exactly, and on the head tree it reproduces all 246 outcomes and
    messages.
  - Red run 2 (the final file, head tree): 186 failed, 78 passed.
  - Green (final file, lane): 264 passed.
- **Suites.**
  - Gate suite: **712 passed** (baseline 448 + 264).
  - The exact CI command: **782 passed** (518 + 264).
- **Store probe: unchanged.**
  - Default mode gives 2 findings in 27 files; `--strict` gives 74.
  - Finding lines are identical, in the same order, and 0 of 169,988 strings change result.
  - 11,145 strings get at least one view. Those views hold 283 tokens the stored text lacks; all
    are math subscripts and none is a label.
- **Found and fixed by the generative run:**
  - `_fold` casefolded before NFKD, so a label in mathematical bold capitals missed on head
    (28/117).
  - The markup view alone could not see a label that MathText shows literally (row A1). The app
    view closes it: 256/256 renderings flag with it, 12/256 without it.

## Changed files (uncommitted)

| file | change | SHA-256 | blob |
|---|---|---|---|
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | boundary; three rendered views with span map; compatibility caseless fold; tier 2 on the scanned text only; HEDGAT and GATEREF on the views; CLI shows invisible characters; docstrings | `ce9ddd61a38a8c759f1c80180617139098125216949519040172a2094bb7799e` | `31732fe` |
| `pipeline/synthetic/gates/scripts/tests/test_lint_rendered_view_round7.py` | new, 264 tests | `bfcc3839e32433fc07ca35a68ffc505e5de500ce6d6cb60b65786912b14fa682` | `169eaab` |
| `pipeline/synthetic/LAYER2-RENDERING.md` | new section "Renderad text (PR #370 rond 7, bead hpf-klv6)" | `cffda8a11b2ba08ab419b25aa605f915617c46ca06e8b622bfaf4fc37ea8c6b3` | `8de1dab` |
| `docs/worklog/hpf-klv6.md` | this file | — | — |

No other file was touched, and `data/` was not edited. These were already there and are left alone:
- the untracked sandbox dotfiles;
- `.claude/skills/*`, `.agents/`, `.codex/` and `.gc/`;
- the ignored `__pycache__/` and `.pytest_cache/`.

---

## 1. Threat model (written before the fix)

### Scope

**What the lint reads, and who renders it.** The lint reads JSON string values (the store,
`data/explanations/*.json`), and `.md` and `.txt` text.

- **JSON values: the app's `MathText`** (`app/src/components/MathText.tsx`). It shows a string as
  React text: escaped plain text, with no Markdown and no HTML. Only what sits between U+E000 and
  the next U+E001 is typeset by KaTeX (`output: 'html'`).
  - `git grep` finds no Markdown renderer in `app/src`. The only raw-HTML sinks are KaTeX's output
    and SVG figures.
  - The store holds 14,384 math segments, which use `\text` 240 times and `\mathrm` 29 times.
- **`.md` text: any CommonMark/GFM renderer**, raw HTML included (GitHub also renders `$…$` math).
- **`.txt`: plain text.**

**What counts as a leak.** A student can read a vocabulary label: its letters and digits in order,
with underscores between its segments. Differences that do not hide the label:
- case;
- letter width or style: fullwidth, mathematical, circled, super- or subscript;
- diacritics;
- emphasis, code or strike styling;
- a longer run of underscores;
- characters that render as nothing.

A visibly different string is not a rendering of the label (row C8).

**Adversary.** The lint guards against accidental leakage: a rendering step, LLM or script, that
copies a bank rationale's label in some markup. It also covers cheap obfuscation. It does not
cover a determined adversary with a TeX engine.

### Table

Columns:
- *head* / *lane*: of the renderings the generative test makes for the row (every label through
  every transform of the row), how many the default lint does not flag (`repro_r7.py` section 2,
  appendix E).
- *mechanism*: what closes the row. B is the boundary, P the plain view, A the app view, M the
  markup view, F the fold. "head" means the row was already closed at 6fbc6d2.

| row | vector, as written in the text | head | lane | disposition |
|---|---|---|---|---|
| C1 | case: `world_knowledge`, `World_Knowledge`, `wORLD_kNOWLEDGE`, `wOrLd_KnOwLeDgE` | 0/585 | 0 | closed on head (round 5, `casefold` in F) |
| C2 | diacritics: precomposed `Ẃ`/`é` (round 6, F); NFD (round 6, NFC); a mark with no precomposed letter (`b` + U+0301, U+0347 under every letter, U+20DD enclosing circle) | 332/468 | 0 | **closed**: P/A/M drop the combining marks of the diacritic blocks; generative over all 263 of them |
| C3 | separator runs `WORLD__KNOWLEDGE`, `WORLD___KNOWLEDGE` | 234/234 | 0 | **closed**: B (`_+` separates segments) |
| C4 | invisible or format characters inside the token or around `_` (28 kinds, listed below), inside each segment and around each separator | 6,460/6,552 | 0 | **closed**: P/A/M drop general category Cf and every other Default_Ignorable_Code_Point; generative over all 170 Cf plus 13 named Default_Ignorables |
| C5 | adjacency: `(…)`, quotes, `«…»`, `„…“`, `:s`, `-fällan`, `/…/`, `.`, `,`, digit or letter before/after (the substring match), `_` before/after, math delimiters, `#`, `@`, `…`, `—`, newlines, NBSP | 234/2,808 (all from `_` before/after) | 0 | **closed** for `_` by B; the rest closed on head |
| C6 | compatibility forms: fullwidth letters (round 6, F); mathematical bold letters; circled letters (category So, not `\w`); `_` written as U+FF3F, U+FE4D, U+FE4E, U+FE4F, U+FE33, U+FE34 | 847/1,053 | 0 | **closed**: P/A/M apply NFKC; F folds case on both sides of NFKD (mathematical capitals missed on head: 28/117); generative over every code point whose NFKC is `_` |
| C7 | bidi override: U+202E + the reversed label + U+202C displays the label | 117/117 | 0 | **closed**: P/A/M reverse each RLO run up to its PDF or the end of its paragraph, as the bidirectional algorithm displays it |
| C8 | visibly different spellings: hyphen, space, en dash or dot as separator; U+203F, U+2017 (NFKC: space + combining mark), U+0332 as separator; confusable letters (Cyrillic/Greek lookalikes, dotless ı, small capitals, Arabic-Indic digits); visible junk inside the token; truncation, translation, paraphrase | — | — | **knowingly left**: not a rendering of the label; see residual 1 |
| C9 | encoding: JSON `\u` escapes (decoded by `json.loads` before any rule); NFD (round 6); a non-UTF-8 file or a JSON file with a BOM (INPUT-FAIL, round 2); labels in JSON keys, `_`-keys, `_`-files | — | — | n/a (closed upstream of the rules, or not rendered to learners; round 6 D4) |
| M1 | emphasis around: `*…*`, `**…**`, `***…***`, `_**…**_` (head) and `_…_`, `__…__`, `___…___`, `**_…_**` (R7) | 468/936 | 0 | **closed**: B (`_` beside the token no longer hides it) |
| M2 | emphasis inside: `*WORLD*_*KNOWLEDGE*`, `WORLD_**KNOWLEDGE**`, `**W**ORLD_KNOWLEDGE`, `_WORLD___KNOWLEDGE_`, `WORLD___KNOWLEDGE__` | 563/585 | 0 | **closed**: M drops `*`, `~` and backticks; B treats `_` runs as separators |
| M3 | strikethrough `~~…~~` / `~…~`: around (head), inside | 234/468 | 0 | **closed**: M |
| M4 | code spans: around (head), inside `WORLD_`` `KNOWLEDGE` `` `` | 117/351 | 0 | **closed**: M |
| M5 | backslash escape `WORLD\_KNOWLEDGE` | 117/117 | 0 | **closed**: M unescapes `\` + ASCII punctuation (A does the same inside math) |
| M6 | links: around `[L](url)`, `[L][1]`, `![L](x.png)` (head); inside `[WORLD](url)_KNOWLEDGE`, with a title, with `<…>` destination, as a reference | 468/819 | 0 | **closed**: M drops `](…)` with its title, `][…]`, `[` and `]` |
| M7 | soft/hard line break inside a label; extensions outside CommonMark/GFM (`==mark==`, `^sup^`, `++ins++`) | — | — | **knowingly left**: a break shows a split label; `=`, `^`, `+` are maths operators the views must keep (residual 3) |
| H1 | tags: around (head); inside `WORLD_<em>KNOWLEDGE</em>`, `<b>W</b>ORLD`, `<wbr>`, an empty `<span …></span>`, `_` as `<span>_</span>` | 545/1,053 | 0 | **closed**: M drops CommonMark-shaped tags |
| H2 | comments and CDATA: around (head); inside `KNOW<!-- -->LEDGE`, `<![CDATA[]]>` | 202/351 | 0 | **closed**: M drops complete comments, CDATA sections, processing instructions and declarations |
| H3 | character references: `_` as `&#95;`, `&#0095;`, `&#x5F;`, `&#X5f;`, `&lowbar;`, `&UnderBar;`; a letter as `&#87;` or `&#x57;`; invisibles as `&shy;`, legacy `&shy`, `&#8203;`, `&ZeroWidthSpace;` | 1,396/1,404 | 0 | **closed**: M decodes with `html.unescape` (HTML5 rules, legacy prefixes included), then drops what renders as nothing |
| H4 | double-encoded `&amp;#95;`; a label in an attribute, `alt` or `title`; hidden elements | — | — | n/a: `&amp;#95;` renders the text `&#95;`, and the scanned text already holds the rest |
| K1 | `_` written `\_` as its own math segment (`WORLD` + U+E000 `\_` U+E001 + `KNOWLEDGE`) | 117/117 | 0 | **closed**: A and M drop the delimiters and unescape `\_` |
| K2 | KaTeX style and grouping: the label as math (`WORLD\_KNOWLEDGE`), in `\text{}`, `\mathrm`, `\texttt`, `\textit`, `\textbf`, `\operatorname`, `\mathit`, `\underline`, `\boxed{\text{}}`, `\textcolor{red}{}`, `\color{blue}`, `\colorbox{yellow}{}`, `{…}`, per segment (`\text{WORLD}\_\text{KNOWLEDGE}`, `{WORLD}\_{KNOWLEDGE}`), or one segment in `\text{}` | 1,989/1,989 | 0 | **closed**: A and M drop style commands (keeping the argument), colour commands with their colour argument, and group braces |
| K3 | `\textunderscore` | 117/117 | 0 | **closed**: A and M |
| K4 | an empty math segment inside the label (`W` U+E000 U+E001 `ORLD`) | 115/117 | 0 | **closed**: A and M drop the delimiters |
| K5 | whitespace in math mode between label parts (`scope \_ shift`); spacing, kerning and phantoms (`\!`, `\kern0pt`, `\hspace{}`, `\phantom{}`); `\char"5F` | — | — | **knowingly left** (residual 2) |
| A1 | renderer interplay: the label inside Markdown/HTML that only a Markdown renderer hides (link target, tag, comment, reference), with a part written in KaTeX: `[se](WORLD` U+E000 `\_` U+E001 `KNOWLEDGE)`. The app shows it as it stands, M drops the construct, and P has no KaTeX. | 0/468 alone (the scanned text sees a plain `_`); 256/256 paired with K1–K4 | 0 | **closed**: A models MathText's split exactly (256/256 flag with A, 12/256 without A) |

The 28 kinds of invisible character in C4: ZWSP, ZWNJ, ZWJ, WJ, ZWNBSP (BOM), SHY, MVS, INVISIBLE
TIMES, INVISIBLE PLUS, LRM, RLM, ALM, LRE, PDF, LRO, LRI, PDI, CGJ, VS16, VS17, TAG SPACE, HANGUL
FILLER, HALFWIDTH HANGUL FILLER, KHMER VOWEL INHERENT AQ, MONGOLIAN FVS1, MUSICAL SYMBOL BEGIN BEAM,
SHORTHAND FORMAT LETTER OVERLAP, ARABIC NUMBER SIGN.

The Hangul fillers are letters for `\w` (category Lo). On head they stayed inside the token and the
fold kept them, so even `WORLD_KNOW` + U+3164 + `LEDGE` missed.

**What head already closed.** C1, and C5 apart from `_`. C9 and H4 need no rule. The "around"
halves of M1, M3, M4, M6, H1 and H2 were closed on head too: there `*`, `~`, a backtick, `[`, `>`
and the like are non-word characters, so `\b` held.

**NFC vs NFKC (asked explicitly).** The round-6 decision stands for the scanned text and the
excerpts: they stay NFC, so `x²` or `aₙ` in an excerpt is never rewritten. The threat model does
show learner-visible leaks that NFC cannot close: rows C6 (the fullwidth low line and the other low
lines compatibility-equivalent to `_`) and circled letters. NFKC is therefore applied inside the
views only. Matching happens there, and the excerpt is still cut from the NFC text. See D3.

## 2. The defect family on head 6fbc6d2

Round 5 compared labels with their underscores intact. Round 6 found that NFD letters split the
token. Round 7 found that leading and trailing underscores defeat `\b`. These are one defect seen
three times: head matched the label only in the stored spelling, delimited by `\b`. Every way a
renderer shows a label differently from that spelling therefore evaded the default tier, one
spelling at a time:

- `_` is a word character, so `\b` never held between it and a letter. `_WORLD_KNOWLEDGE_`,
  `__WORLD_KNOWLEDGE__` and `WORLD__KNOWLEDGE` were no tokens at all. The same `\b` sat in
  L2-HEDGAT (`_hedgat_`) and in L2-GATEREF (`__G-STEM__`, `_M-FORM_`).
- A character that renders as nothing (Cf, a variation selector) is not a word character, so it
  split the token. A Hangul filler is a word character, so it stayed inside the token, and the fold
  kept it.
- Markup that renders as nothing was matched as visible text. That covers Markdown delimiters,
  escapes and link targets, HTML tags, comments and references, KaTeX commands, groups and
  delimiters.
- Compatibility characters (`＿`, circled letters) were not tokens, or folded too late
  (mathematical capitals).

## 3. The fix

All of it is in `lint_learner_output.py`.

- **Boundary (B).**
  - `_SNAKE_TOKEN = (?<![^\W_])[^\W_]+(?:_+[^\W_]+)+(?![^\W_])`: a token is bounded by anything
    that is not a letter or digit, and runs of underscores separate its segments.
  - HEDGAT and the G-gate and M-gate names in GATEREF use the same bound in place of `\b`. The
    M-gate's arithmetic lookbehinds are unchanged.
  - Each new pattern matches a superset of what its `\b` version matched.
- **Rendered views (P, A, M).** `_views(text)` builds up to three views of the NFC text. A view is
  built only when it can differ from the text, and only when it differs from the views before it:
  - **P (plain)** needs an invisible character, a stray mark or a non-NFKC character.
  - **A (app)** needs U+E000. It applies `_KATEX` (style and colour commands, group braces,
    `\textunderscore`, backslash escapes) between U+E000 and the next U+E001, exactly where
    MathText runs KaTeX.
  - **M (markup)** needs a markup character. It applies `_MARKUP` everywhere: HTML comments, CDATA,
    processing instructions, declarations and tags; Markdown link targets and references;
    `*`, `~`, backticks, `[`, `]`, `{`, `}`, the math delimiters, the KaTeX part, escapes and HTML
    character references.

  Every view then runs the same per-character pass:
  - drop Cf and Default_Ignorable characters (`_INVISIBLE_RANGES`) and the combining marks of the
    diacritic blocks (`_MARK_RANGES`);
  - reverse each RLO run;
  - replace every other character by its NFKC form.

  Each view character keeps the span of the scanned text that produced it. `_View.hit` maps a
  match back to (first start, last end) of its characters. `_Hit` answers `start()`, `end()` and
  `group(0)` like an `re.Match` on the scanned text.
- **Rules.**
  - Tier 1 of L2-SNAKE reads the scanned text, then each view.
  - Tier 2 (`--strict`) reads the scanned text only.
  - HEDGAT and GATEREF read the scanned text, then each view (`_Rendered`).
  - A match in the scanned text always wins. Whatever head flagged, the lane flags the same way,
    with the same excerpt.
- **Fold (F).** `_fold` folds case on both sides of the compatibility decomposition, as in Unicode's
  compatibility caseless match: `NFKD(casefold(NFKD(casefold(s))))`.
- **Reporting.**
  - `scan_text` still cuts the excerpt from the NFC scanned text, 30 characters either side of the
    match's span.
  - The CLI prints each invisible character of a finding line as `<U+XXXX>`. A hidden character is
    then visible, and an RLO cannot reorder the line.
- **Linear time.** An unterminated comment, CDATA section or processing instruction stops at the
  next opener, and a link title stops at the end of the line. 20,000 unterminated openers scan in
  well under a second (8 tests).
- **Unchanged:**
  - the vocabulary and both tiers' definitions;
  - NFC at the single entry point (`scan_text`);
  - fail-closed input handling, exit codes and the output format (path `-` for `.md`/`.txt`).

## 4. Decisions

- **D1 — The scanned text first, the views after.** Nothing head flags changes: the first match in
  the scanned text wins, with the same excerpt. On the store the lane prints exactly head's lines
  (section 9). The views can only add findings.
- **D2 — Three views, not one.** One "rendered text" cannot serve both kinds of renderer, because
  markup that one renderer hides, another shows.
  - The app (MathText) shows Markdown and HTML as they stand. A Markdown renderer hides a link
    target, a tag or a comment. So a view that drops them misses a label the app shows (row A1),
    and a view that keeps them misses a label the Markdown renderer shows (M2, H1, H3).
  - Hence: P for any renderer that shows the text as it stands, A modelling MathText exactly, and
    M over-approximating Markdown, HTML and KaTeX everywhere. A label that any of them shows is in
    the text or in a view.
  - The cost is that M over-approximates: it drops delimiters whether paired or not, and it decodes
    and unescapes inside code spans too. On the store this adds no finding (section 9).
- **D3 — NFC vs NFKC, decided explicitly.**
  - The scanned text and the excerpts stay NFC. That is the round-6 decision, kept: NFKC in the
    excerpts would rewrite learner math, `aₙ = 2ⁿ` into `an = 2n`.
  - The views apply NFKC, because rows C6 show learner-visible leaks that NFC cannot close. NFKC
    makes U+FF3F and the five other low lines `_` (generated from the Unicode database: exactly
    those six code points), and circled letters plain letters.
  - Matching happens on the views, and the excerpt is cut from the NFC text, so learner math is
    still never rewritten. Round 6's guard `test_the_scan_keeps_compatibility_characters_of_learner_math`
    stays green.
- **D4 — Tier 2 judges the stored spelling.**
  - A LaTeX subscript such as `V_{\text{gammal}}` is correct notation. In the views it reads
    `V_gammal`, which would look like formula-name style debt (bead hpf-gyo5) if tier 2 read the
    views.
  - Tier 2 reads only the scanned text, so `--strict` stays at 74 on the store. This is pinned by
    `test_strict_style_debt_is_judged_on_the_stored_spelling`.
- **D5 — HEDGAT and GATEREF get the same boundary and views.**
  - Same root cause: `_hedgat_`, `hedg` + SHY + `at`, `G&#45;STEM` and `round` + NBSP + `2 version`
    all missed on head. The last one was round 6's residual 3.
  - The boundary change is a superset. GATEREF's arithmetic exemption holds on the views, as pinned
    by five guards, including `y = kx + m` written in math before `-form`.
  - On the store, no view adds a HEDGAT or GATEREF match.
- **D6 — What "invisible" means.**
  - It means general category Cf plus the other Default_Ignorable_Code_Points: 25 ranges,
    hardcoded for Unicode 15.0, which is what Python 3.12 has and what CI runs.
  - Python's `unicodedata` has no Default_Ignorable property. The test therefore generates the Cf
    set from the running database, so a Python with newer Unicode fails loudly. It also names the
    non-Cf Default_Ignorables through `unicodedata.lookup`, so a typo in a code point cannot hide.
  - A visible Cf character (an Arabic number sign) is dropped too. That over-approximates (it
    flags) and cannot hide a label.
- **D7 — Excerpt honesty.**
  - A view match reports `(min start, max end)` of the scanned-text spans of the characters that
    produced it. The excerpt is cut there, from the scanned text. For an RLO run that is the
    reversed text as stored.
  - `group(0)` is that span. For `**WORLD**\_KNOWLEDGE` it is `WORLD**\_KNOWLEDGE`, the original
    spelling (8 tests).
  - The CLI shows invisible characters as `<U+XXXX>` anywhere in the line, JSON path included. It
    leaves the private-use math delimiters raw, as before, so the store's lines do not change.
- **D8 — Shape of the generative test.**
  - Transforms are grouped in 5 layers, applied in this order:
    1. letters;
    2. invisible characters;
    3. separators and letter encodings;
    4. markup inside the token;
    5. markup around it.
  - Each transform is tagged with the renderers that show it cleanly (app, md). A pair is generated
    only when one renderer shows both: an HTML reference inside KaTeX shows the reference text, so
    that pair is not a leak. Other exclusions: no nested math delimiters, and RLO only with
    direction-safe, markup-free transforms.
  - In-token insertions are unit-aware: an entity reference, or a letter with its combining marks,
    is never split.
  - Pairs run on 16 label shapes, a cost decision: on all 117 labels they would take about 20 s
    instead of about 3 s. The stacks cover all 117 labels.
- **D9 — Two fixes the tests found, beyond the finding.**
  - The `_fold` order. Mathematical bold capitals NFKD-decompose to plain capitals only after
    `casefold` has run, so on head 28/117 labels missed.
  - Row A1. While re-reading the design, the markup view turned out to drop constructs MathText
    shows. The app view was added, and tests pin it (4 transforms, 2 span cases, and the
    load-bearing count in section 8).

## 5. Tests: `tests/test_lint_rendered_view_round7.py` (264)

| group | tests | what it pins | on head 6fbc6d2 |
|---|---|---|---|
| review repro | 6 | `_WORLD_KNOWLEDGE_`, `__WORLD_KNOWLEDGE__` and the NFD `författarens_hållning` wrapped in `_` and `__` flag L2-SNAKE in `scan_text`; the CLI exits 1 on `.md` and `.json` | FAIL (`[]`; "clean — 1 file(s)") |
| every label × every transform | 177 | for each transform of rows C1–C7, M1–M6, H1–H3, K1–K4, A1: all 117 labels flag | 128 FAIL, 49 PASS (the rows closed on head) |
| pairwise | 10 (one per layer pair) | 5,776 compatible pairs × 16 label shapes flag | FAIL |
| stacks | 8 | five-layer compositions × 117 labels flag | FAIL |
| Unicode-generated | 3 | every Cf code point plus 13 named Default_Ignorables inside two labels; every code point whose NFKC is `_` as the separator of all labels (asserts exactly the six); all 263 combining marks of the diacritic blocks | FAIL |
| CLI, every rendering | 2 | one JSON file holding every transform × 3 labels gives one L2-SNAKE line per value; one `.md` file per transform, each flagged | FAIL |
| span and excerpt | 8 | a view hit's excerpt and `group(0)` are the original spelling (Markdown, zero-width, entity, KaTeX, RLO, fullwidth low line, app link target, app tag) | FAIL |
| CLI shows invisibles | 1 | `<U+200B>`, `<U+202E>`, `<U+202C>`, `<U+00AD>` in excerpts and in a JSON path; no Cf character in stdout | FAIL |
| strict precedence | 1 | with `--strict`, a label only a view shows wins over an earlier style token | FAIL (`värde_B`) |
| HEDGAT / GATEREF | 11 | `_hedgat_`, `__hedgning__`, SHY, entity, KaTeX-split; `__G-STEM__`, `_M-FORM_`, ZWSP, `&#45;`, `<b>`, NBSP in "round 2 version" | FAIL |
| linear time | 8 | 20,000 unterminated `<!--`, `<![CDATA[`, `<?`, `](`, `](x "`, `<a `, `&#`, `\color{` scan in under 5 s, and the label after them flags | FAIL |
| *guard* maths notation | 1 | the 8 contract examples and 74 store formula names under every transform and stack (15,170 renderings): no rule fires in default mode | PASS |
| *guard* prose and store LaTeX | 18 | prose with `_…_`, `*…*`, `**…**`, `__…__`, `~~…~~`, backticks, tags, links, entities, stems as words, and the store's own LaTeX (`V_{\text{ny}}`, `\theta_{1}`, `100\,000`, `1{,}91`): no finding in either mode | PASS |
| *guard* cloze blanks | 4 | `31_____ symptoms`, `____` and `(___)`: no token in either mode | PASS |
| *guard* GATEREF exemption | 5 | `y = kx + m-form` (plain, and with the term in math), `*k*-*m*-form`, `k-m-form`, `volym-formeln` | PASS |
| *guard* tier 2 | 1 | `V_{\text{gammal}}` and `t_{\text{låg}}` do not flag with `--strict`; `värde_B` does | PASS |
| **total** | **264** | | **186 FAIL, 78 PASS** |

The 78 tests that pass on head are the 29 guards plus 49 single-transform tests. Those 49 are the
rows head already closed:
- the 5 case variants, NFD and fullwidth letters;
- 4 emphasis wrappers made of `*` or bounded by `*`;
- strike, code and link wrappers (7 in all);
- the 4 HTML wrappers and the comments around the token (5);
- 22 adjacency transforms;
- the 4 A1 wrappers alone, which the scanned text sees with a plain `_`.

## 6. Red-first evidence

1. **Red run 1.** The first draft of the test file (246 tests), on the lane before any change to
   the lint (the 6fbc6d2 blob `b27282c`): **172 failed, 74 passed** (`red-head.xml`, SHA-256
   `b9bab1ca9fec512e09bfdea70a10482b9fcaa0640bf3c354f4982780a81f68d5`).
2. **The draft, rebuilt.** I did not save the draft before editing the test file, so
   `reconstruct_draft.py` (appendix H) rebuilds it from the final file. It reverses, exactly, each
   edit made after red run 1; every edit must match once.
   - The rebuilt draft has SHA-256 `752f8f3e93ec17413af7a1fbab11e0aeeeda1710ff477fa5c3274d04e8fe6e67`.
   - Run on the head tree, it gives 172 failed, 74 passed (`red-draft-headtree.xml`, SHA-256
     `14512a19a4ca86ef09e8b2d92a575840878d527d515f49c912166ecd44fe546c`).
   - `compare_junit.py` (appendix I) shows that all 246 tests have the same outcome and the same
     failure message as red run 1.

   The edits after red run 1, in order:
   - **a–d.** Unit-aware insertion helpers, and the three transforms that use them. The first green
     run exposed `letter-entity-dec × strong-star-first-letter` producing `**&**#87;ORLD`: a broken
     entity no renderer shows as the label (a test-composition bug, not a lint result).
   - **e–g.** The CLI test's JSON-path case and the 8 linear-time tests, added with the lint's regex
     hardening and the whole-line `<U+XXXX>`.
   - **h.** 4 entity-encoded invisible transforms (row H3), found while writing the table.
   - **i–k.** The app view: the module docstring, 4 A1 transforms and 2 span cases.
3. **Red run 2.** The final test file in a **head tree** (appendix D2). The tree is a copy of the
   lane's `pipeline/synthetic` with the lint and `LAYER2-RENDERING.md` put back to their 6fbc6d2
   blobs (`b27282c`, `ce7a868`, checked with `git hash-object`): **186 failed, 78 passed**
   (`red-headtree.xml`, SHA-256 `dc4953e88951756841caed9d287396fb301a4dfa4cc9f88ff4a9591cf0df4ec9`).
4. **Green.** The final file on the lane: **264 passed** (`green-final.xml`, SHA-256
   `a3cedca76431367a1eca2299a116dc6a671f1719613caf7bfdb624ed946da629`).

`junit_summary.py` and `outcome_patterns.py` (appendices F, G) over red 1, red 2 and green put every
test in exactly one row:

| red 1 | red 2 | green | tests |
|---|---|---|---|
| FAIL | FAIL | PASS | 172 |
| PASS | PASS | PASS | 74 (29 guards, 45 rows closed on head) |
| — | FAIL | PASS | 14 (added after red 1: 4 entity transforms, 2 app span cases, 8 linear-time) |
| — | PASS | PASS | 4 (added after red 1: the A1 wrappers alone) |

## 7. Full suites (lane, final files)

- `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` →
  **712 passed** (448 + 264).
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q`
  (the exact CI command) → **782 passed** (518 + 264).

All 96 round-5 tests and all 34 round-6 tests pass unchanged. Among them:
- `test_every_rule_sees_the_nfc_text`: each rule still receives the NFC text once, and the views
  are built inside the rules;
- `test_every_label_in_the_label_sources_flags_in_default_mode` (section 10).

## 8. Review repro and the app view (appendix E, `repro_r7.py`)

```
=== 1. the review repro (R7, hpf-geqt)
'_WORLD_KNOWLEDGE_':
  head []
  lane [('L2-SNAKE', 'Låt _WORLD_KNOWLEDGE_ vara här.')]
'__WORLD_KNOWLEDGE__':
  head []
  lane [('L2-SNAKE', 'Låt __WORLD_KNOWLEDGE__ vara här.')]
'_fo<U+0308>rfattarens_ha<U+030A>llning_':
  head []
  lane [('L2-SNAKE', 'Låt _författarens_hållning_ vara här.')]
'__fo<U+0308>rfattarens_ha<U+030A>llning__':
  head []
  lane [('L2-SNAKE', 'Låt __författarens_hållning__ vara här.')]
-- CLI .md head (exit 0):
     learner-output lint: clean — 1 file(s)
-- CLI .md lane (exit 1):
     L2-SNAKE r7-repro.md:-: …Q3 bär _WORLD_KNOWLEDGE_ och __WORLD_KNOWLEDGE__. …
     learner-output lint: 1 finding(s) in 1 file(s)
-- CLI .json head (exit 0):
     learner-output lint: clean — 1 file(s)
-- CLI .json lane (exit 1):
     L2-SNAKE r7-repro.json:$.s: …Q3 bär _WORLD_KNOWLEDGE_ och __WORLD_KNOWLEDGE__.…
     learner-output lint: 1 finding(s) in 1 file(s)

=== 3b. the app view is load-bearing
A1 wrappers x KaTeX-written parts: 16 pairs x 16 shapes = 256 renderings; flagged with the app view 256, without it 12, head 0

=== 4. the lane CLI on hidden characters
-- head (exit 0):
     learner-output lint: clean — 1 file(s)
-- lane (exit 1):
     L2-SNAKE hidden.json:$.a: …Låt WORLD_KNOW<U+200B>LEDGE vara här.…
     L2-SNAKE hidden.json:$.b: …Låt <U+202E>EGDELWONK_DLROW<U+202C> vara här.…
     L2-SNAKE hidden.json:$.c: …Låt [U+E000]\text{tone\_misread}[U+E001] vara här.…
     L2-SNAKE hidden.json:$.d: …Låt WORLD&#95;KNOWLEDGE vara här.…
     L2-HEDGAT hidden.json:$.e: …Svaret var hedg<U+00AD>at i sak.…
     learner-output lint: 5 finding(s) in 1 file(s)
```

How this block was transcribed:
- The script printed the two NFD tokens through `ascii()`. Their escapes are written here as
  `<U+XXXX>`.
- It printed head's last line through `ascii()` too; the em dash is written here as itself.
- In line `$.c` the lane prints the two private-use math delimiters raw; they are written here as
  `[U+E000]` and `[U+E001]`.
- Every `<U+XXXX>` in the lane's lines is the CLI's own output.

Section 3b knocks the app view out: it replaces `_app_pieces` with the plain pieces and clears the
view cache. 244 of the 256 A1 renderings then go unflagged, and head flags none.

The per-row counts behind the table's head and lane columns are in section 2 of the same report
(appendix E). The generative sizes are in its section 3:
- 177 transforms in 5 layers (12, 56, 20, 24, 65);
- 20,709 single renderings;
- 5,776 compatible pairs (from 192 to 1,064 per layer pair) × 16 shapes = 92,416;
- 8 stacks × 117 = 936;
- guards: 82 maths names × 185 transforms and stacks = 15,170.

## 9. Store probe (appendix A, `store_probe_r7.py`): `data/explanations`

```
store: data/explanations — 27 lintable file(s), 169988 learner string(s)

=== 1. the CLI, head vs lane
default: head exit 1, 2 finding(s) {'L2-HEDGAT': 2}, 1.88s; lane exit 1, 2 finding(s) {'L2-HEDGAT': 2}, 2.83s
  head summary: ['learner-output lint: 2 finding(s) in 27 file(s)']
  lane summary: ['learner-output lint: 2 finding(s) in 27 file(s)']
  finding lines identical (same order): True
  L2-HEDGAT /home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.distractors[2].why_wrong: …v. Och "i vissa avseenden" är hedgning som inte fångar förstärkninge…
  L2-HEDGAT /home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.steps[2].text: …kvens. "I vissa avseenden" är hedgning.…
--strict: head exit 1, 74 finding(s) {'L2-HEDGAT': 2, 'L2-SNAKE': 72}, 1.75s; lane exit 1, 74 finding(s) {'L2-HEDGAT': 2, 'L2-SNAKE': 72}, 2.82s
  head summary: ['learner-output lint: 74 finding(s) in 27 file(s)']
  lane summary: ['learner-output lint: 74 finding(s) in 27 file(s)']
  finding lines identical (same order): True

=== 2. scan_text per learner string, head vs lane
default: findings head 2, lane 2; strings whose result differs: 0
--strict: findings head 74, lane 74; strings whose result differs: 0

=== 3. the lane's rendered views over the store
strings with at least one view: 11145 (plain view needed: 3132; markup characters: 8492)
snake tokens a view holds that the scanned text does not: 283 occurrence(s), 107 distinct
  most common: [('L_1', 16), ('L_2', 14), ('x_2', 13), ('y_2', 12), ('x_1', 11), ('y_1', 9), ('y_1x_2', 9), ('fracy_2', 9), ('a_1', 8), ('k_1', 6), ('k_2', 6), ('dfracx_1', 5), ('frac2k_33', 4), ('fracx_1', 4), ('y_22', 4), ('210_fem', 4), ('110111_två', 4), ('2x_2', 4), ('A_kvadrat', 4), ('frack_33', 3), ('s_1', 3), ('s_2', 3), ('s_3', 3), ('s_4', 3), ('x_22', 3)]
  of those, tier 1 (default mode would flag): []
L2-HEDGAT / L2-GATEREF matches only a view holds: []

=== 4. token inventory on the scanned text
head: 1331 occurrence(s), 236 distinct; lane: 1331 occurrence(s), 236 distinct; identical multisets: True
tokens whose count or flags differ head vs lane: 0

=== 5. the store in NFD (lane)
lane default: strings whose NFD result differs from the NFC result: 0
lane --strict: strings whose NFD result differs from the NFC result: 0
```

- **As expected, nothing changed.**
  - Default mode gives the same 2 L2-HEDGAT findings in `host-2017-verb2-MEK-025`, in 27 files.
  - `--strict` gives the same 74 (72 L2-SNAKE, 2 L2-HEDGAT).
  - Head and lane print identical lines in the same order, and in-process no string's result
    differs.
- **The views on real text.**
  - 11,145 strings get at least one view: 3,132 need the plain view, 8,492 hold a markup character,
    and the app view is built for every string with a math segment.
  - The views hold 283 snake-token occurrences the stored text lacks. All are maths: `L_{1}` reads
    `L_1`, and `\frac{y_2}` reads `fracy_2` because the brace is dropped and the backslash bounds
    the token.
  - None of them reaches tier 1, and no view adds a HEDGAT or GATEREF match. GATEREF's
    `y = kx + m-form` exemption holds in every view.
- **The boundary on real text.** The new token regex cuts exactly head's 1,331 occurrences in the
  stored text. The store has 1,361 strings with cloze blanks (`____`) and 173 with an underscore
  at a token edge; none of them becomes a token (survey, appendix B).
- **Cost.** About +1 s for the store CLI: 1.88 → 2.83 s in default mode, 1.75 → 2.82 s with
  `--strict`.
- **NFD.** Round 6's check still holds: on the lane, every string's NFD form lints like its NFC form.

## 10. `label_sources()` (round 5's coverage source; appendix C, `survey_labels.py`)

```
lane regex: 117 labels; head regex: 116 labels; identical: False
  lane only: WORLD__KNOWLEDGE ['ALL_CAPS classes and statuses in pipeline docs'] flags(lane default)=True
labels the lane's default mode does not flag: []
```

The one new label is the contract example `WORLD__KNOWLEDGE` in this round's LAYER2-RENDERING.md
section. Round 5's scan reads every pipeline `.md` for ALL_CAPS tokens, and with the new separator
rule this doc example is one token. It flags, so the coverage test stays green. Before the doc
section was written, both regexes gave the same 116 labels. On the 6fbc6d2 head tree the
generative tests run over 116 labels, and on the lane over 117.

---

## 11. Residual risks, knowingly left

1. **Visibly different spellings (C8).** These are not renderings of the label:
   - a hyphen, space, dot, U+203F or U+2017 as separator;
   - U+0332 under a letter;
   - confusable letters from other scripts, dotless ı, small capitals, Arabic-Indic digits;
   - visible junk inside the token;
   - truncation, translation, paraphrase.

   Closing them would make the lint a confusable or fuzzy matcher (UTS #39 skeletons). That would
   also hit legitimate Greek maths variables.
2. **KaTeX constructs (K5).** Whitespace between label parts in math mode, where KaTeX ignores it.
   Deleting all math whitespace would glue every formula, and it would defeat GATEREF's
   `kx + m-form` exemption. Spacing, kerning and phantom commands, and `\char"5F`, are deliberate
   constructions, and most leave a visible gap.
3. **Markdown (M7).** A line break inside a label shows a split label. Extensions outside
   CommonMark/GFM are not modelled, and `=`, `^`, `+` are maths operators.
4. **Bidi.** Only RLO is modelled: its run is reversed up to its PDF or the end of its paragraph,
   and nested overrides are ignored.
   - RLE, RLI and FSI are dropped without reordering. In display they can move a neighbouring `_`
     or punctuation; the views then over-approximate (they flag).
   - An LRO inside right-to-left text is not modelled, since labels are Latin in LTR paragraphs.
5. **The markup view over-approximates (D2).** It may flag a label that a strict CommonMark
   renderer shows with visible junk: an unpaired `*`, or an escape inside a code span. It cannot
   hide anything, since the scanned text and the other two views are always read too.
6. **Combining marks outside the generic diacritic blocks** still end a token. They render as
   dotted-circle junk on Latin letters, a visibly different string.
7. **Tags follow CommonMark's shape** (`[A-Za-z][A-Za-z0-9-]*`). An HTML-only renderer would also
   hide `<e` + U+200B + `m>`. No such renderer exists for the store: the app never renders a JSON
   value as HTML.
8. **Unicode version.** `_INVISIBLE_RANGES` is Unicode 15.0. A newer Python adds Cf characters,
   and the generative test (which reads Cf from the running `unicodedata`) then fails until the
   table is extended.
9. **The CLI prints the private-use math delimiters raw.** Only invisible characters are escaped,
   so the store's lines stay unchanged.
10. **Round 6's residuals.**
    - Residual 1 is now closed as a side effect. A direct `_Snake().search()` on NFD text finds the
      whole label, because the plain view drops the stray marks (head: `None`; appendix J).
    - Residual 3 (NBSP in a GATEREF phrase) is closed by the plain view's NFKC.
    - Residual 2 (`label_sources()` tokenizes raw source text) is unchanged.
11. **Cost.** About +1 s per store run (50–60%): views are built for 11,145 of the 169,988
    strings. The new test file runs in about 5 s.

## 12. Reproduction

```
git rev-parse HEAD   # 6fbc6d29d2ec06dd8912d45621fd7becd09f6f84
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests/test_lint_rendered_view_round7.py   # 264 passed
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests          # 712 passed
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q   # 782 passed
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations        # exit 1: the 2 known L2-HEDGAT
# S = a scratch dir; every script is an appendix below
python3 make_head_copy.py "$PWD" $S/head/lint_learner_output.py    # D1: blob b27282c == 6fbc6d2
python3 make_head_tree.py "$PWD" $S/headtree                       # D2: changed files back to 6fbc6d2
python3 -m pytest -q -p no:cacheprovider $S/headtree/pipeline/synthetic/gates/scripts/tests/test_lint_rendered_view_round7.py   # 186 failed, 78 passed
python3 reconstruct_draft.py pipeline/synthetic/gates/scripts/tests/test_lint_rendered_view_round7.py $S/headtree/pipeline/synthetic/gates/scripts/tests/test_lint_rendered_view_round7_draft.py   # 752f8f3e…
python3 -m pytest -q -p no:cacheprovider $S/headtree/pipeline/synthetic/gates/scripts/tests/test_lint_rendered_view_round7_draft.py --junitxml=$S/red-draft.xml   # 172 failed, 74 passed
python3 compare_junit.py red-head.xml $S/red-draft.xml                                # 246 identical
python3 store_probe_r7.py "$PWD" $S/head/lint_learner_output.py $S/store.txt          # A
python3 survey_markup.py "$PWD" $S/survey_markup.txt                                  # B
python3 survey_labels.py "$PWD" $S/head/lint_learner_output.py $S/labels.txt          # C
python3 repro_r7.py "$PWD" $S/head/lint_learner_output.py $S/repro $S/repro.txt       # E
python3 junit_summary.py $S/junit.txt red-head.xml red-headtree.xml green-final.xml   # F
python3 outcome_patterns.py $S/junit.txt $S/patterns.txt                              # G
python3 check_r6_residual.py "$PWD" $S/head/lint_learner_output.py                    # J
python3 facts.py $S/facts.txt; python3 facts2.py                                      # K
```

**Coordination note.** The bead's metadata names `gc.check_path`:
`/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`
(SHA-256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`).
- It is the same digest as in rounds 5 and 6.
- It is the dispatcher's producer-stage gate. This bead's description does not ask the worker to
  run it, so it was read, hashed and not run.

**Harness notes.**
- Every check ran as a script file, one command each, with no pipelines.
- The file-writing tool turns a written backslash-u escape into the raw character; a probe confirmed
  it. Every exotic character in the new files is therefore built with `chr()`, or named as U+XXXX in
  prose. `check_chars.py` (appendix L) finds no raw invisible, combining, private-use or odd-space
  character in the three changed files or in this one; all four print `clean`.
- The appendices below were appended by `append_appendices.py` (appendix M) straight from the
  script files, and each header carries the SHA-256 of the file as run. A first run of the
  generator was cut off again by `truncate_appendices.py` (which keeps everything up to the
  "## Appendices" heading), so that appendices L and M could join the list.

## Appendices

Each appendix below is the exact source of a probe script, appended from the file by `append_appendices.py`. Its header line carries the SHA-256 of the file as run. Every script is read-only towards the lane, except that `make_head_tree.py` writes the head tree into a scratch directory.

### Appendix A — `store_probe_r7.py` (SHA-256 `ca560cfb468a4af50bde47db2ed0916dbcdf1b5b7fcc3f95cf9ad52487acc891`)

Head vs lane over `data/explanations`: the CLI in both modes, every string in-process, the views, the token inventory, NFD.

```python
"""Store probe for bead hpf-klv6: head (6fbc6d2) lint vs the lane lint over
the learner store named in LAYER2-RENDERING.md (data/explanations). Read-only.

  1. the real CLI, head and lane, default and --strict: exit code, summary
     line, wall time, and every finding line only one side prints;
  2. in-process, every learner string: scan_text head vs lane, both modes —
     strings whose result differs;
  3. the lane's rendered views over the store: how many strings get a plain
     or a markup view, every snake token a view holds that the scanned text
     does not, which of those tier 1 flags, and any L2-HEDGAT / L2-GATEREF
     match a view adds;
  4. token inventory on the scanned text: head token regex vs lane token regex;
  5. the store in NFD (round 6's check, kept): lane NFD result == NFC result.

usage: store_probe_r7.py <lane-root> <head-lint-path> <report-path>
"""
from __future__ import annotations

import builtins
import importlib.util
import json
import subprocess
import sys
import time
import unicodedata
from collections import Counter
from pathlib import Path

LANE = Path(sys.argv[1])
HEAD_PATH = Path(sys.argv[2])
REPORT = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
STORE = LANE / "data/explanations"
LANE_PATH = LANE / "pipeline/synthetic/gates/scripts/lint_learner_output.py"


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def _load(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


HEAD = _load("lint_head", HEAD_PATH)
NEW = _load("lint_new", LANE_PATH)


def cli(path: Path, strict: bool):
    t = time.perf_counter()
    r = subprocess.run([sys.executable, str(path), *(["--strict"] if strict else []), str(STORE)],
                       capture_output=True, text=True)
    dt = time.perf_counter() - t
    lines = r.stdout.splitlines()
    return (r.returncode, [ln for ln in lines if ln.startswith("L2-")],
            [ln for ln in lines if not ln.startswith("L2-")], dt)


def strings(obj, path):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if not k.startswith("_"):          # the lint's own convention
                yield from strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        yield path, obj


def learner_strings():
    files, failures = NEW.collect([STORE])
    assert not failures, failures
    out = []
    for fp in files:
        text = fp.read_text(encoding="utf-8")
        if fp.suffix.lower() == ".json":
            out += [(fp.name, p, s) for p, s in strings(json.loads(text), "$")]
        else:
            out.append((fp.name, "-", text))
    return files, out


def scan(mod, s, strict):
    mod.SNAKE.strict = strict
    try:
        return mod.scan_text(s)
    finally:
        mod.SNAKE.strict = False


def main() -> int:
    files, items = learner_strings()
    print(f"store: {STORE.relative_to(LANE)} — {len(files)} lintable file(s), {len(items)} learner string(s)")

    print("\n=== 1. the CLI, head vs lane")
    for strict in (False, True):
        mode = "--strict" if strict else "default"
        (hc, hf, hs, ht), (nc, nf, ns, nt) = cli(HEAD_PATH, strict), cli(LANE_PATH, strict)
        rules_h = Counter(ln.split()[0] for ln in hf)
        rules_n = Counter(ln.split()[0] for ln in nf)
        print(f"{mode}: head exit {hc}, {len(hf)} finding(s) {dict(sorted(rules_h.items()))}, {ht:.2f}s; "
              f"lane exit {nc}, {len(nf)} finding(s) {dict(sorted(rules_n.items()))}, {nt:.2f}s")
        print(f"  head summary: {hs}")
        print(f"  lane summary: {ns}")
        print(f"  finding lines identical (same order): {hf == nf}")
        for ln in sorted(set(nf) - set(hf)):
            print(f"  ONLY LANE  {ln}")
        for ln in sorted(set(hf) - set(nf)):
            print(f"  ONLY HEAD  {ln}")
        if not strict:
            for ln in nf:
                print(f"  {ln}")

    print("\n=== 2. scan_text per learner string, head vs lane")
    for strict in (False, True):
        mode = "--strict" if strict else "default"
        differ = []
        n_h = n_n = 0
        for name, path, s in items:
            a, b = scan(HEAD, s, strict), scan(NEW, s, strict)
            n_h += len(a)
            n_n += len(b)
            if a != b:
                differ.append((name, path, a, b))
        print(f"{mode}: findings head {n_h}, lane {n_n}; strings whose result differs: {len(differ)}")
        for d in differ[:10]:
            print(f"    {d}")

    print("\n=== 3. the lane's rendered views over the store")
    n_plain = n_markup = n_any = 0
    extra_tokens = Counter()
    extra_tier1 = []
    view_rule_hits = []
    for name, path, s in items:
        text = unicodedata.normalize("NFC", s)
        views = NEW._views(text)
        if not views:
            continue
        n_any += 1
        plain_needed = bool(NEW._DROPPED.search(text)) or not unicodedata.is_normalized("NFKC", text)
        n_plain += plain_needed
        n_markup += bool(NEW._MARKUP_START.search(text))
        raw_tokens = Counter(m.group(0) for m in NEW._SNAKE_TOKEN.finditer(text))
        for view in views:
            view_tokens = Counter(m.group(0) for m in NEW._SNAKE_TOKEN.finditer(view.text))
            for tok in view_tokens - raw_tokens:
                extra_tokens[tok] += 1
                if NEW._is_label(tok):
                    extra_tier1.append((name, path, tok))
            for rule, rx in (("L2-HEDGAT", NEW.HEDGAT), ("L2-GATEREF", NEW.GATEREF)):
                if not any(p.search(text) for p in rx.patterns) and any(p.search(view.text) for p in rx.patterns):
                    view_rule_hits.append((rule, name, path))
    print(f"strings with at least one view: {n_any} (plain view needed: {n_plain}; markup characters: {n_markup})")
    print(f"snake tokens a view holds that the scanned text does not: {sum(extra_tokens.values())} occurrence(s), "
          f"{len(extra_tokens)} distinct")
    print(f"  most common: {extra_tokens.most_common(25)}")
    print(f"  of those, tier 1 (default mode would flag): {extra_tier1}")
    print(f"L2-HEDGAT / L2-GATEREF matches only a view holds: {view_rule_hits}")

    print("\n=== 4. token inventory on the scanned text")
    head_occ, new_occ = Counter(), Counter()
    for _, _, s in items:
        text = unicodedata.normalize("NFC", s)
        head_occ.update(m.group(0) for m in HEAD._SNAKE_TOKEN.finditer(text))
        new_occ.update(m.group(0) for m in NEW._SNAKE_TOKEN.finditer(text))
    print(f"head: {sum(head_occ.values())} occurrence(s), {len(head_occ)} distinct; "
          f"lane: {sum(new_occ.values())} occurrence(s), {len(new_occ)} distinct; "
          f"identical multisets: {head_occ == new_occ}")
    changed = []
    for tok in sorted(set(head_occ) | set(new_occ), key=str.casefold):
        f = tuple(mod._Snake(strict=st).search(f"x {tok} y") is not None
                  for mod in (HEAD, NEW) for st in (False, True))
        if f[:2] != f[2:] or head_occ[tok] != new_occ[tok]:
            changed.append((tok, head_occ[tok], new_occ[tok], f))
    print(f"tokens whose count or flags differ head vs lane: {len(changed)}")
    for row in changed:
        print(f"  {row}")

    print("\n=== 5. the store in NFD (lane)")
    for strict in (False, True):
        mode = "--strict" if strict else "default"
        differ = sum(1 for _, _, s in items
                     if scan(NEW, unicodedata.normalize("NFD", s), strict) != scan(NEW, s, strict))
        print(f"lane {mode}: strings whose NFD result differs from the NFC result: {differ}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### Appendix B — `survey_markup.py` (SHA-256 `db65930f3676f95fed5602941c36106e28564ca45b0a4e2ce8f81fa836d20d24`)

What markup, invisible and compatibility characters and math segments the store holds; head vs lane token regex on the stored text. Run before the fix.

```python
"""Survey for bead hpf-klv6 (read-only): what markup, invisible and
compatibility characters, and math segments the learner store actually holds,
so the rendered-view design and the store probe have a baseline.

Every exotic character is built with chr(); this source is ASCII apart from
Swedish words.

usage: survey_markup.py <lane-root> <report-path>
"""
from __future__ import annotations

import builtins
import html
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115
STORE = LANE / "data/explanations"
OPEN, CLOSE = chr(0xE000), chr(0xE001)


def print(*a, **k):  # noqa: A001
    builtins.print(*a, **k, file=REPORT)


def strings(obj, path):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if not k.startswith("_"):
                yield from strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        yield path, obj


items = []
for fp in sorted(STORE.rglob("*")):
    if fp.is_file() and fp.suffix.lower() in (".json", ".md", ".txt") and not fp.name.startswith("_"):
        text = fp.read_text(encoding="utf-8")
        if fp.suffix.lower() == ".json":
            items += [(fp.name, p, s) for p, s in strings(json.loads(text), "$")]
        else:
            items.append((fp.name, "-", text))
print(f"{len(items)} learner strings")


def split_math(s):
    """(plain parts, math parts) the way MathText splits them."""
    plain, math = [], []
    i = 0
    while i < len(s):
        a = s.find(OPEN, i)
        if a == -1:
            plain.append(s[i:])
            break
        plain.append(s[i:a])
        b = s.find(CLOSE, a + 1)
        if b == -1:
            plain.append(s[a + 1:])
            break
        math.append(s[a + 1:b])
        i = b + 1
    return plain, math


def show(c):
    cp = ord(c)
    try:
        name = unicodedata.name(c)
    except ValueError:
        name = "?"
    return f"U+{cp:04X} {name} [{unicodedata.category(c)}]"


cats = Counter()
cat_ex = {}
nfkc = Counter()
marks = Counter()
pua = Counter()
for name, path, s in items:
    for c in s:
        cat = unicodedata.category(c)
        if cat in ("Cf", "Co", "Cn", "Cs", "Cc") and c not in "\n\t\r":
            cats[show(c)] += 1
            cat_ex.setdefault(show(c), (name, path))
        if cat.startswith("M"):
            marks[show(c)] += 1
        if unicodedata.normalize("NFKC", c) != c:
            nfkc[show(c) + " -> " + ascii(unicodedata.normalize("NFKC", c))] += 1

print("\n=== control/format/private-use characters (excluding newline/tab)")
for k, v in cats.most_common():
    print(f"  {v:7d}  {k}   e.g. {cat_ex[k]}")
print("\n=== combining marks")
for k, v in marks.most_common():
    print(f"  {v:7d}  {k}")
print("\n=== characters whose NFKC differs")
for k, v in nfkc.most_common():
    print(f"  {v:7d}  {k}")

print("\n=== math segments")
n_math_strings = 0
segs = 0
cw = Counter()
csym = Counter()
unbalanced = 0
math_ws = 0
for name, path, s in items:
    if OPEN not in s and CLOSE not in s:
        continue
    n_math_strings += 1
    plain, math = split_math(s)
    if s.count(OPEN) != s.count(CLOSE):
        unbalanced += 1
    segs += len(math)
    for m in math:
        cw.update(re.findall(r"\\[A-Za-z]+", m))
        csym.update(re.findall(r"\\[^A-Za-z]", m))
        if re.search(r"\s", m):
            math_ws += 1
print(f"strings with a sentinel: {n_math_strings}; segments: {segs}; strings with unequal "
      f"open/close counts: {unbalanced}; segments containing whitespace: {math_ws}")
print(f"control words: {cw.most_common()}")
print(f"control symbols: {csym.most_common()}")

print("\n=== markup characters and constructs (whole string)")
PATTERNS = {
    "asterisk": r"\*",
    "tilde": r"~",
    "backtick": r"`",
    "html-tag-like": r"</?[A-Za-z][A-Za-z0-9-]*(?:\s[^<>]*)?/?>",
    "html-comment": r"<!--",
    "lt-letter": r"<[A-Za-z!/?]",
    "entity-like": r"&(?:#[0-9]+|#[xX][0-9a-fA-F]+|[A-Za-z][A-Za-z0-9]*);?",
    "backslash-punct": r"\\[!-/:-@\[-`{-~]",
    "backslash-any": r"\\",
    "md-link": r"\]\(",
    "md-refl": r"\]\[",
    "bracket": r"[\[\]]",
    "brace-outside-math": None,
    "underscore-run>=2": r"__+",
    "underscore-edge": r"(?<![^\W_])_+[^\W_]|[^\W_]_+(?![^\W_])",
    "m-form": r"[mM]-form",
}
for key, pat in PATTERNS.items():
    hit_strings = 0
    ex = []
    for name, path, s in items:
        if pat is None:
            plain, _ = split_math(s)
            found = [c for p in plain for c in p if c in "{}"]
        else:
            found = re.findall(pat, s)
        if key == "entity-like":
            found = [f for f in found if html.unescape(f) != f]
        if found:
            hit_strings += 1
            if len(ex) < 6:
                k = s.find(found[0]) if isinstance(found[0], str) else 0
                ex.append((name, path, found[:3], s[max(0, k - 40):k + 40]))
    print(f"{key}: {hit_strings} string(s)")
    for e in ex:
        print(f"    {e}")

print("\n=== snake tokens: head regex vs lookaround + run-separator regex")
HEAD = re.compile(r"\b[^\W_]+(?:_[^\W_]+)+\b")
NEW = re.compile(r"(?<![^\W_])[^\W_]+(?:_+[^\W_]+)+(?![^\W_])")
ho, no = Counter(), Counter()
diff_ex = []
for name, path, s in items:
    s = unicodedata.normalize("NFC", s)
    h = [m.group(0) for m in HEAD.finditer(s)]
    n = [m.group(0) for m in NEW.finditer(s)]
    ho.update(h)
    no.update(n)
    if h != n and len(diff_ex) < 20:
        diff_ex.append((name, path, h, n))
print(f"head {sum(ho.values())} occ / {len(ho)} distinct; new {sum(no.values())} occ / {len(no)} distinct; "
      f"equal: {ho == no}")
for e in diff_ex:
    print(f"    {e}")
REPORT.close()
```

### Appendix C — `survey_labels.py` (SHA-256 `ddb559e2fc7bf3b319137cf15df8a2a4c479c242fcc034df4b0bcf47e49c3488`)

`label_sources()` under the head and the lane token regex.

```python
"""label_sources() (round 5's coverage source) under the head token regex and
the lane token regex (bead hpf-klv6): the labels must be the same, or every
new one must flag in default mode.

usage: survey_labels.py <lane-root> <head-lint-path> <report-path>
"""
import importlib.util
import sys
from pathlib import Path

lane, head_path = Path(sys.argv[1]), Path(sys.argv[2])
out = open(sys.argv[3], "w", encoding="utf-8")  # noqa: SIM115
tests = lane / "pipeline/synthetic/gates/scripts/tests"
sys.path.insert(0, str(tests.parent))
sys.path.insert(0, str(tests))
import lint_learner_output as lint  # noqa: E402  (the lane lint)
import test_verdict_enum_and_label_vocabulary_round5 as r5  # noqa: E402

spec = importlib.util.spec_from_file_location("lint_head", head_path)
head = importlib.util.module_from_spec(spec)
spec.loader.exec_module(head)


def collect():
    src = r5.label_sources()
    return {label: sorted({s for s, labs in src.items() if label in labs})
            for labs in src.values() for label in labs}


lane_labels = collect()
saved = lint._SNAKE_TOKEN
lint._SNAKE_TOKEN = head._SNAKE_TOKEN
head_labels = collect()
lint._SNAKE_TOKEN = saved
print(f"lane regex: {len(lane_labels)} labels; head regex: {len(head_labels)} labels; "
      f"identical: {set(lane_labels) == set(head_labels)}", file=out)
for label in sorted(set(lane_labels) ^ set(head_labels)):
    side = "lane only" if label in lane_labels else "head only"
    print(f"  {side}: {label} {lane_labels.get(label) or head_labels.get(label)} "
          f"flags(lane default)={lint._Snake().search(f'x {label} y') is not None}", file=out)
missed = [lab for lab in lane_labels if lint._Snake().search(f"Låt {lab} vara här.") is None]
print(f"labels the lane's default mode does not flag: {missed}", file=out)
out.close()
```

### Appendix D1 — `make_head_copy.py` (SHA-256 `98d672d609775e7e31b3e6d5ae868dce866fa01fd65ed6da83aa7152221f44d0`)

The 6fbc6d2 lint, blob-verified.

```python
"""Write the head (6fbc6d2) lint_learner_output.py to <out> and verify its blob.

usage: make_head_copy.py <lane-root> <out-path>
Prints: <blob of copy> <blob at 6fbc6d2> <equal?> <sha256 of copy>
"""
import hashlib
import subprocess
import sys
from pathlib import Path

lane, out = Path(sys.argv[1]), Path(sys.argv[2])
rel = "pipeline/synthetic/gates/scripts/lint_learner_output.py"
HEAD = "6fbc6d29d2ec06dd8912d45621fd7becd09f6f84"


def git(*args, text=True):
    return subprocess.run(["git", "-C", str(lane), *args], capture_output=True, check=True, text=text).stdout


data = git("show", f"{HEAD}:{rel}", text=False)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(data)
blob = git("hash-object", str(out)).strip()
want = git("rev-parse", f"{HEAD}:{rel}").strip()
print(blob, want, blob == want, hashlib.sha256(data).hexdigest())
```

### Appendix D2 — `make_head_tree.py` (SHA-256 `dd6c9a9ec29f728baed7147382d7d4cd2353954802b7a1c877b5c16bc10d93e5`)

The head tree for red run 2.

```python
"""Head tree for the round-7 red re-run (bead hpf-klv6): the lane's
pipeline/synthetic copied to <dest>/pipeline/synthetic, with every tracked
file this round changed swapped back to its 6fbc6d2 blob. Only the new
round-7 test file then differs from head. Verifies each swapped blob.

usage: make_head_tree.py <lane-root> <dest>
"""
import shutil
import subprocess
import sys
from pathlib import Path

lane, dest = Path(sys.argv[1]), Path(sys.argv[2])
HEAD = "6fbc6d29d2ec06dd8912d45621fd7becd09f6f84"
CHANGED = ("pipeline/synthetic/gates/scripts/lint_learner_output.py",
           "pipeline/synthetic/LAYER2-RENDERING.md")


def git(*args, text=True):
    return subprocess.run(["git", "-C", str(lane), *args], capture_output=True, check=True, text=text).stdout


target = dest / "pipeline/synthetic"
if target.exists():
    shutil.rmtree(target)
shutil.copytree(lane / "pipeline/synthetic", target, ignore=shutil.ignore_patterns("__pycache__"))
for rel in CHANGED:
    out = dest / rel
    out.write_bytes(git("show", f"{HEAD}:{rel}", text=False))
    blob, want = git("hash-object", str(out)).strip(), git("rev-parse", f"{HEAD}:{rel}").strip()
    print(f"{rel}: copy {blob} head {want} equal={blob == want}")
# the lane's uncommitted changes under pipeline/synthetic, so nothing else differs
print("lane changes under pipeline/synthetic:\n" + git("status", "--porcelain", "--", "pipeline/synthetic"))
```

### Appendix E — `repro_r7.py` (SHA-256 `971bdc911937624b6a752d091c7b2b311f9ae65287687f2e42fb5650fc5c73c4`)

Review repro, per-row head/lane counts, generative sizes, the app view knocked out, the CLI on hidden characters.

```python
"""Review repro and threat-model table data for bead hpf-klv6, head (6fbc6d2)
vs lane. Read-only; reuses the round-7 test module's transforms.

  1. the review repro: scan_text and the CLI (.md and .json), head vs lane;
  2. per threat-model row and transform: labels head misses, labels the lane
     misses (every label of label_sources() and the vocabulary);
  3. the size of the generative run: renderings per test family;
  4. one CLI line per kind of hidden character, as the lane prints it.

usage: repro_r7.py <lane-root> <head-lint-path> <work-dir> <report-path>
"""
from __future__ import annotations

import builtins
import importlib.util
import itertools
import json
import subprocess
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

LANE, HEAD_PATH, WORK = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
REPORT = open(sys.argv[4], "w", encoding="utf-8")  # noqa: SIM115
TESTS = LANE / "pipeline/synthetic/gates/scripts/tests"
LANE_PATH = TESTS.parent / "lint_learner_output.py"
WORK.mkdir(parents=True, exist_ok=True)
sys.path.insert(0, str(TESTS.parent))
sys.path.insert(0, str(TESTS))
import test_lint_rendered_view_round7 as r7  # noqa: E402  (imports the lane lint as lint_learner_output)

NEW = r7.lint


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


spec = importlib.util.spec_from_file_location("lint_head", HEAD_PATH)
HEAD = importlib.util.module_from_spec(spec)
spec.loader.exec_module(HEAD)


def flags(mod, text):
    return any(rule == "L2-SNAKE" for rule, _ in mod.scan_text(text))


def nfc(s):
    return unicodedata.normalize("NFC", s)


print("=== 1. the review repro (R7, hpf-geqt)")
for token in r7.REVIEW_TOKENS:
    s = r7.sentence(token)
    print(f"{ascii(token)}:")
    print(f"  head {HEAD.scan_text(s)!r}")
    print(f"  lane {NEW.scan_text(s)!r}")
for suffix in (".md", ".json"):
    f = WORK / f"r7-repro{suffix}"
    body = "Q3 bär _WORLD_KNOWLEDGE_ och __WORLD_KNOWLEDGE__."
    f.write_text(json.dumps({"s": body}, ensure_ascii=False) if suffix == ".json" else body + "\n",
                 encoding="utf-8")
    for side, path in (("head", HEAD_PATH), ("lane", LANE_PATH)):
        r = subprocess.run([sys.executable, str(path), str(f)], capture_output=True, text=True)
        print(f"-- CLI {suffix} {side} (exit {r.returncode}):")
        for line in r.stdout.replace(str(f), f.name).splitlines():
            print(f"     {line}")

print("\n=== 2. per threat-model row: labels missed, head vs lane")
labels = r7.labels()
print(f"labels: {len(labels)} (label_sources() plus the vocabulary labels)")
rows = defaultdict(list)
for t in r7.TRANSFORMS:
    texts = [r7.sentence(r7.render(label, t)) for label in labels]
    h = sum(not flags(HEAD, s) for s in texts)
    n = sum(not flags(NEW, s) for s in texts)
    rows[t.row].append((t.name, h, n))
for row in sorted(rows):
    items = rows[row]
    print(f"{row}: {len(items)} transform(s); head misses {sum(h for _, h, _ in items)} of "
          f"{len(items) * len(labels)} renderings, lane misses {sum(n for _, _, n in items)}")
    for name, h, n in items:
        print(f"    {name}: head {h}/{len(labels)}, lane {n}/{len(labels)}")

print("\n=== 3. the generative run")
singles = len(r7.TRANSFORMS) * len(labels)
print(f"transforms: {len(r7.TRANSFORMS)} in layers "
      f"{dict(sorted((k, sum(t.layer == k for t in r7.TRANSFORMS)) for k in {t.layer for t in r7.TRANSFORMS}))}")
print(f"singles: {len(r7.TRANSFORMS)} transforms x {len(labels)} labels = {singles} renderings")
total_pairs = 0
for a_layer, b_layer in r7.LAYER_PAIRS:
    a = [t for t in r7.TRANSFORMS if t.layer == a_layer and t.pairwise]
    b = [t for t in r7.TRANSFORMS if t.layer == b_layer and t.pairwise]
    pairs = [(x, y) for x, y in itertools.product(a, b) if r7.compatible(x, y)]
    total_pairs += len(pairs)
    print(f"  layers {a_layer}x{b_layer}: {len(a)} x {len(b)} transforms, {len(pairs)} compatible pairs")
print(f"pairwise: {total_pairs} pairs x {len(r7.SHAPES)} label shapes = {total_pairs * len(r7.SHAPES)} renderings")
print(f"stacks: {len(r7.STACKS)} x {len(labels)} labels = {len(r7.STACKS) * len(labels)} renderings")
cf = [cp for cp in range(0x110000) if not 0xD800 <= cp <= 0xDFFF and unicodedata.category(chr(cp)) == "Cf"]
print(f"Unicode-generated: {len(cf)} Cf code points (+13 named Default_Ignorable), 6 compatibility low "
      f"lines x {len(labels)} labels, 263 combining marks")
print(f"guards: {len(r7.WRAPPED_MATH)} maths names x {len(r7.TRANSFORMS) + len(r7.STACKS)} transforms and stacks = "
      f"{len(r7.WRAPPED_MATH) * (len(r7.TRANSFORMS) + len(r7.STACKS))} renderings; {len(r7.PROSE)} prose "
      f"sentences, {len(r7.CLOZE)} cloze sentences, {len(r7.GATEREF_EXEMPT)} GATEREF exemptions")

print("\n=== 3b. the app view is load-bearing")
app_pairs = [(x, y) for x in r7.TRANSFORMS if x.layer in (3, 4) and x.math
             for y in r7.TRANSFORMS if y.row == "A1" and r7.compatible(x, y)]
texts = [r7.sentence(r7.render(label, x, y)) for x, y in app_pairs for label in r7.SHAPES]
with_app = sum(flags(NEW, s) for s in texts)
orig = NEW._app_pieces
NEW._app_pieces = lambda text: [(text, 0, len(text), True)]   # the app view degraded to the plain view
NEW._views.cache_clear()
without_app = sum(flags(NEW, s) for s in texts)
NEW._app_pieces = orig
NEW._views.cache_clear()
print(f"A1 wrappers x KaTeX-written parts: {len(app_pairs)} pairs x {len(r7.SHAPES)} shapes = {len(texts)} "
      f"renderings; flagged with the app view {with_app}, without it {without_app}, head "
      f"{sum(flags(HEAD, s) for s in texts)}")

print("\n=== 4. the lane CLI on hidden characters")
f = WORK / "hidden.json"
f.write_text(json.dumps({"a": r7.sentence("WORLD_KNOW" + chr(0x200B) + "LEDGE"),
                         "b": r7.sentence(r7.RLO + "EGDELWONK_DLROW" + r7.PDF),
                         "c": r7.sentence(r7.OPEN + r7.BS + "text{tone" + r7.BS + "_misread}" + r7.CLOSE),
                         "d": r7.sentence("WORLD&#95;KNOWLEDGE"),
                         "e": nfc("Svaret var hedg") + chr(0xAD) + nfc("at i sak.")}), encoding="utf-8")
for side, path in (("head", HEAD_PATH), ("lane", LANE_PATH)):
    r = subprocess.run([sys.executable, str(path), str(f)], capture_output=True, text=True)
    print(f"-- {side} (exit {r.returncode}):")
    for line in r.stdout.replace(str(f), f.name).splitlines():
        print(f"     {ascii(line) if side == 'head' else line}")
REPORT.close()
```

### Appendix F — `junit_summary.py` (SHA-256 `a5e9ccbe48a89f8ed563fc64df88e91ffccef805af5d4a519fc2d1b606c527fa`)

Per-test outcome table over JUnit XML files (round 6's script).

```python
"""Per-test outcome table for one or more pytest JUnit XML files (bead hpf-klv6;
round 6's appendix F script, unchanged in behaviour).

usage: junit_summary.py <report-path> <xml> [<xml> ...]
For each test: the outcome in every file, its time in the last file, and the
first line of the failure message (from the first file that failed it).
"""
from __future__ import annotations

import sys
import xml.etree.ElementTree as ET

report = open(sys.argv[1], "w", encoding="utf-8")  # noqa: SIM115
files = sys.argv[2:]
rows: dict[str, list] = {}
order: list[str] = []
for i, fp in enumerate(files):
    root = ET.parse(fp).getroot()
    for suite in root.iter("testsuite"):
        print(f"{fp}: tests={suite.get('tests')} failures={suite.get('failures')} "
              f"errors={suite.get('errors')} skipped={suite.get('skipped')} time={suite.get('time')}",
              file=report)
    for case in root.iter("testcase"):
        name = case.get("name")
        if name not in rows:
            rows[name] = [None] * len(files) + [None, ""]
            order.append(name)
        fail = case.find("failure")
        err = case.find("error")
        outcome = "FAIL" if fail is not None else "ERROR" if err is not None else "PASS"
        rows[name][i] = outcome
        rows[name][len(files)] = case.get("time")
        node = fail if fail is not None else err
        if node is not None and not rows[name][-1]:
            msg = (node.get("message") or "").strip().splitlines()
            rows[name][-1] = msg[0][:150] if msg else ""
print(file=report)
for name in order:
    r = rows[name]
    print(f"{' '.join(o or '-' for o in r[:len(files)])}  {float(r[len(files)] or 0):.3f}s  {name}"
          + (f"\n      {r[-1]}" if r[-1] else ""), file=report)
report.close()
```

### Appendix G — `outcome_patterns.py` (SHA-256 `0637b010a282143e8483bb9072a8ce41ed2bf28e020ff8ae98d27378ac7df93c`)

Outcome patterns across the three runs.

```python
"""Count outcome patterns in a junit_summary.py table (bead hpf-klv6).

usage: outcome_patterns.py <junit-summary-txt> <report-path>
Every test row starts with one outcome per XML file (PASS/FAIL/ERROR/-).
"""
import re
import sys
from collections import Counter, defaultdict

rows = [ln for ln in open(sys.argv[1], encoding="utf-8").read().splitlines()
        if re.match(r"^(PASS|FAIL|ERROR|-) ", ln)]
pat = Counter()
names = defaultdict(list)
for ln in rows:
    parts = ln.split()
    outcomes = tuple(p for p in parts if p in ("PASS", "FAIL", "ERROR", "-"))
    k = len(outcomes)
    name = parts[k + 1]
    pat[outcomes] += 1
    names[outcomes].append(name)
with open(sys.argv[2], "w", encoding="utf-8") as out:
    print(f"{len(rows)} tests", file=out)
    for p, n in pat.most_common():
        print(f"{' '.join(p)}: {n}", file=out)
    for p, ns in names.items():
        if p not in (("FAIL", "FAIL", "PASS"),):
            print(f"\n{' '.join(p)}:", file=out)
            for n in ns:
                print(f"  {n}", file=out)
```

### Appendix H — `reconstruct_draft.py` (SHA-256 `3d960364afd52c8c007b69e1925a5d13227ce2d1fecc5ed23b8573862c9e43ea`)

Rebuilds the red-run-1 draft by reversing the later edits.

```python
"""Rebuild the round-7 test-file draft that red run 1 ran (bead hpf-klv6), by
reversing, exactly, each edit made to the test file after that run:

  a. unit-aware insertion helpers (first_unit, first_letter_in)
  b-d. three transforms switched to them
  e. the CLI test's JSON-path case, and the linear-time test
  f. `import time`
  g. (the linear-time test's text: part of e here, it was added after the run)
  h. the four entity-encoded invisible-character transforms

Every reversed edit must match exactly once. Writes the draft to <out> and
prints its SHA-256.

usage: reconstruct_draft.py <final-test-file> <out>
"""
import hashlib
import sys
from pathlib import Path

final = Path(sys.argv[1]).read_text(encoding="utf-8")
BS = "\\"

EDITS = [
    # a
    ('def first_unit(s):\n'
     '    """Length of s\'s first unit: an HTML character reference (layer 3 may have\n'
     '    encoded the letter), or a character with the combining marks after it."""\n'
     '    m = re.match(r"&#?[0-9A-Za-z]+;", s)\n'
     '    if m:\n'
     '        return m.end()\n'
     '    n = 1\n'
     '    while n < len(s) and unicodedata.category(s[n]).startswith("M"):\n'
     '        n += 1\n'
     '    return n\n'
     '\n'
     '\n'
     'def after_first_char(ins):\n'
     '    return lambda s: s[:first_unit(s)] + ins + s[first_unit(s):]\n'
     '\n'
     '\n'
     'def first_letter_in(pre, post):\n'
     '    return lambda s: pre + s[:first_unit(s)] + post + s[first_unit(s):]\n',
     'def after_first_char(ins):\n'
     '    return lambda s: s[:1] + ins + s[1:]\n'),
    # b
    ('    T(4, "M2", "strong-star-first-letter", first(first_letter_in("**", "**")), shows={MD}),\n',
     '    T(4, "M2", "strong-star-first-letter", first(lambda s: f"**{s[:1]}**{s[1:]}"), shows={MD}),\n'),
    # c
    ('    T(4, "H1", "tag-first-letter", first(first_letter_in("<b>", "</b>")), shows={MD}),\n',
     '    T(4, "H1", "tag-first-letter", first(lambda s: f"<b>{s[:1]}</b>{s[1:]}"), shows={MD}),\n'),
    # d
    ('    T(1, "C2", "enclosing-circle", segwise(after_first_char(chr(0x20DD))), bidi_safe=True),\n',
     '    T(1, "C2", "enclosing-circle", segwise(lambda s: s[:1] + chr(0x20DD) + s[1:]), bidi_safe=True),\n'),
    # e (+ g)
    ('def test_cli_shows_invisible_code_points_instead_of_printing_them(tmp_path):\n'
     '    # the excerpt and the JSON path are printed with each invisible character\n'
     '    # as <U+XXXX>: the line shows where it sits, and an RLO cannot reorder it\n'
     '    f = tmp_path / "hidden.json"\n'
     '    f.write_text(json.dumps({"a": sentence("WORLD_KNOW" + chr(0x200B) + "LEDGE"),\n'
     '                             "b": sentence(RLO + "EGDELWONK_DLROW" + PDF),\n'
     '                             "c": sentence("WORLD_KNOW" + chr(0xAD) + "LEDGE"),\n'
     '                             "steg" + RLO + "x": sentence("tone_misread")}), encoding="utf-8")\n'
     '    r = _run(f)\n'
     '    assert r.returncode == 1\n'
     '    assert "<U+200B>" in r.stdout and "<U+202E>" in r.stdout and "<U+202C>" in r.stdout and "<U+00AD>" in r.stdout\n'
     '    assert ":$.steg<U+202E>x: " in r.stdout\n'
     '    assert not [c for c in r.stdout if unicodedata.category(c) == "Cf"]\n'
     '\n'
     '\n'
     '# added for the fix: unterminated markup keeps the markup view linear, and\n'
     '# a label after it that only the markup view shows still flags\n'
     '@pytest.mark.parametrize("opener", ["<!--", "<![CDATA[", "<?", "](", \'](x "\', "<a ", "&#", BS + "color{"])\n'
     'def test_unterminated_markup_scans_in_linear_time(opener):\n'
     '    text = opener * 20000 + " WORLD" + BS + "_KNOWLEDGE"\n'
     '    t = time.perf_counter()\n'
     '    hits = lint.scan_text(text)\n'
     '    assert time.perf_counter() - t < 5\n'
     '    assert [rule for rule, _ in hits] == ["L2-SNAKE"]\n',
     'def test_cli_shows_invisible_code_points_instead_of_printing_them(tmp_path):\n'
     '    f = tmp_path / "hidden.json"\n'
     '    f.write_text(json.dumps({"a": sentence("WORLD_KNOW" + chr(0x200B) + "LEDGE"),\n'
     '                             "b": sentence(RLO + "EGDELWONK_DLROW" + PDF),\n'
     '                             "c": sentence("WORLD_KNOW" + chr(0xAD) + "LEDGE")}), encoding="utf-8")\n'
     '    r = _run(f)\n'
     '    assert r.returncode == 1\n'
     '    assert "<U+200B>" in r.stdout and "<U+202E>" in r.stdout and "<U+202C>" in r.stdout and "<U+00AD>" in r.stdout\n'
     '    assert not [c for c in r.stdout if unicodedata.category(c) == "Cf"]\n'),
    # f
    ("import subprocess\nimport sys\nimport time\nimport unicodedata\n",
     "import subprocess\nimport sys\nimport unicodedata\n"),
    # h
    ('    T(4, "H3", "entity-shy-each", segwise(after_first_char("&shy;")), shows={MD}),\n'
     '    T(4, "H3", "entity-shy-legacy-each", segwise(after_first_char("&shy")), shows={MD}),\n'
     '    T(4, "H3", "entity-zwsp-dec-each", segwise(after_first_char("&#8203;")), shows={MD}),\n'
     '    T(4, "H3", "entity-ZeroWidthSpace-each", segwise(after_first_char("&ZeroWidthSpace;")), shows={MD}),\n',
     ""),
    # i. the app view in the module docstring
    ('    characters and drops stray combining marks. The app view does the same\n'
     '    after KaTeX markup is interpreted between MathText\'s math delimiters (the\n'
     '    app\'s own rendering). The markup view does it after Markdown, HTML and\n'
     '    KaTeX markup is interpreted everywhere. Findings are reported against the\n'
     '    scanned text.\n',
     '    characters and drops stray combining marks. The markup view does the same\n'
     '    after Markdown, HTML and KaTeX markup is interpreted. Findings are reported\n'
     '    against the scanned text.\n'),
    # j. the A1 transforms
    ('    # MathText shows Markdown and HTML as they stand, so a label inside a link\n'
     '    # target, a tag or a comment is on screen there; paired with a part written\n'
     '    # in KaTeX (layers 3 and 4), only the app view assembles it\n'
     '    *(T(5, "A1", f"app-literal-{name}", wrap(pre, post), shows={APP}) for name, pre, post in (\n'
     '        ("link-target", "[se här](", ")"), ("tag", "<x ", ">"), ("comment", "<!-- ", " -->"),\n'
     '        ("reference", "[se här][", "]"))),\n',
     ""),
    # k. the app-view span cases
    ('    (sentence("[se](WORLD" + OPEN + BS + "_" + CLOSE + "KNOWLEDGE)"),\n'
     '     "WORLD" + OPEN + BS + "_" + CLOSE + "KNOWLEDGE"),\n'
     '    (sentence("<x tone" + OPEN + BS + "textunderscore" + CLOSE + "misread>"),\n'
     '     "tone" + OPEN + BS + "textunderscore" + CLOSE + "misread"),\n'
     ']\n'
     '\n'
     '\n'
     '@pytest.mark.parametrize("text,span", VIEW_CASES,\n'
     '                         ids=["markdown", "zero-width", "entity", "katex", "rlo", "fullwidth-low-line",\n'
     '                              "app-link-target", "app-tag"])\n',
     ']\n'
     '\n'
     '\n'
     '@pytest.mark.parametrize("text,span", VIEW_CASES,\n'
     '                         ids=["markdown", "zero-width", "entity", "katex", "rlo", "fullwidth-low-line"])\n'),
]
draft = final
for i, (new, old) in enumerate(EDITS):
    n = draft.count(new)
    assert n == 1, f"edit {i}: the final text occurs {n} times"
    draft = draft.replace(new, old)
out = Path(sys.argv[2])
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(draft, encoding="utf-8")
print(hashlib.sha256(draft.encode("utf-8")).hexdigest(), len(draft.splitlines()), "lines")
```

### Appendix I — `compare_junit.py` (SHA-256 `017e9888698720a5b6def4d5059365614502471f911ffdbc08dba117ac63b4b1`)

Red run 1 vs the rebuilt draft, test by test.

```python
"""Compare two pytest JUnit XML files test by test (bead hpf-klv6): outcome
and the failure message's first line, with pytest's tmp directories
normalized. Prints the number of tests, of identical rows, and every row that
differs.

usage: compare_junit.py <a.xml> <b.xml>
"""
import re
import sys
import xml.etree.ElementTree as ET


def rows(fp):
    out = {}
    for case in ET.parse(fp).getroot().iter("testcase"):
        node = case.find("failure")
        if node is None:
            node = case.find("error")
        outcome = "PASS" if node is None else node.tag.upper()
        msg = "" if node is None else (node.get("message") or "").strip().splitlines()[0]
        out[case.get("name")] = (outcome, re.sub(r"pytest-\d+/[^/\s]+", "<tmp>", msg))
    return out


a, b = rows(sys.argv[1]), rows(sys.argv[2])
same = sum(1 for k in a if b.get(k) == a[k])
print(f"{len(a)} vs {len(b)} tests; identical outcome and message: {same}; names equal: {set(a) == set(b)}")
for k in sorted(set(a) | set(b)):
    if a.get(k) != b.get(k):
        print(f"  DIFF {k}: {a.get(k)} / {b.get(k)}")
```

### Appendix J — `check_r6_residual.py` (SHA-256 `559804deb8caedff64ff920e0fc0f507d9f765dbe5d39227e3763b90e9a919f7`)

Round 6's residual 1 on head and lane.

```python
"""Round 6's residual 1 on the lane (bead hpf-klv6): _Snake().search() called
directly on NFD text, bypassing scan_text's NFC.

usage: check_r6_residual.py <lane-root> <head-lint-path>
"""
import importlib.util
import sys
import unicodedata
from pathlib import Path


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


lane = load("lane", Path(sys.argv[1]) / "pipeline/synthetic/gates/scripts/lint_learner_output.py")
head = load("head", Path(sys.argv[2]))
for label in ("författarens_hållning", "jämförelse_relation", "GODKÄNN_NOTED"):
    d = unicodedata.normalize("NFD", unicodedata.normalize("NFC", label))
    for side, mod in (("head", head), ("lane", lane)):
        m = mod._Snake().search(d)
        print(f"{side} {ascii(label)}: {None if m is None else ascii(m.group(0))}")
```

### Appendix K — `facts.py` (SHA-256 `846570a7a4e015ec794593c0cf5308bc6d586a7d1f4706eff624a28d942f08f1`)

Unicode and HTML facts the design relies on (Cf ranges, NFKC low lines, precompositions, entity decoding).

```python
"""Unicode/HTML facts the round-7 design relies on (bead hpf-klv6).
Exotic characters are built with chr(); the source is ASCII.

usage: facts.py <report-path>
"""
import html
import re
import sys
import unicodedata as u

out = open(sys.argv[1], "w", encoding="utf-8")  # noqa: SIM115


def p(*a):
    print(*a, file=out)


p("unicodedata version:", u.unidata_version)
for ent in ("&#95;", "&#095;", "&#x5F;", "&#X5f;", "&lowbar;", "&UnderBar;", "&lowbar", "&shy;", "&shy",
            "&ZeroWidthSpace;", "&zwj;", "&zwnj;", "&NoBreak;", "&InvisibleTimes;", "&#8203;",
            "&amp;#95;", "&notit;", "&As", "&T"):
    p(f"unescape {ent!r} -> {ascii(html.unescape(ent))}")

# every code point whose NFKC is exactly "_"
low = [cp for cp in range(0x110000) if not 0xD800 <= cp <= 0xDFFF and u.normalize("NFKC", chr(cp)) == "_"]
p("NFKC == '_':", [f"U+{cp:04X} {u.name(chr(cp), '?')}" for cp in low])

# general category Cf, as ranges
cf = [cp for cp in range(0x110000) if u.category(chr(cp)) == "Cf"]
ranges = []
for cp in cf:
    if ranges and ranges[-1][1] == cp - 1:
        ranges[-1][1] = cp
    else:
        ranges.append([cp, cp])
p(f"Cf: {len(cf)} code points in {len(ranges)} ranges:")
p("  " + ", ".join(f"{a:04X}" if a == b else f"{a:04X}..{b:04X}" for a, b in ranges))

DICP = [(0x00AD, 0x00AD), (0x034F, 0x034F), (0x061C, 0x061C), (0x115F, 0x1160), (0x17B4, 0x17B5),
        (0x180B, 0x180F), (0x200B, 0x200F), (0x202A, 0x202E), (0x2060, 0x206F), (0x3164, 0x3164),
        (0xFE00, 0xFE0F), (0xFEFF, 0xFEFF), (0xFFA0, 0xFFA0), (0xFFF0, 0xFFF8), (0x1BCA0, 0x1BCA3),
        (0x1D173, 0x1D17A), (0xE0000, 0xE0FFF)]
cats = {}
for a, b in DICP:
    for cp in range(a, b + 1):
        cats.setdefault(u.category(chr(cp)), []).append(cp)
p("DICP categories:", {k: len(v) for k, v in cats.items()})
p("DICP not Cf (non-Cn):", [f"U+{cp:04X} {u.category(chr(cp))} {u.name(chr(cp), '?')}"
                            for k, v in cats.items() if k not in ("Cf", "Cn") for cp in v][:40])
p("Cf not DICP:", [f"U+{cp:04X} {u.name(chr(cp), '?')}" for cp in cf
                   if not any(a <= cp <= b for a, b in DICP)])

w = re.compile(r"\w")
for cp in (0x3164, 0x115F, 0x1160, 0xFFA0, 0x17B4, 0x034F, 0xFE0F, 0x200B, 0x00AD, 0x24CC, 0x1D416,
           0xFF3F, 0x2017, 0x0332, 0x0347, 0x20DD, 0xE000, 0x2464, 0x0131):
    ch = chr(cp)
    p(f"U+{cp:04X} {u.name(ch, '?')} [{u.category(ch)}] \\w={bool(w.fullmatch(ch))} isalnum={ch.isalnum()} "
      f"NFKC={ascii(u.normalize('NFKC', ch))} NFKD={ascii(u.normalize('NFKD', ch))} combining={u.combining(ch)}")

# which ASCII letters have a precomposed form with U+0301 / U+0347 / U+20DD
for mark in (0x0301, 0x0347, 0x20DD, 0x0308):
    pre = [c for c in "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
           if len(u.normalize("NFC", c + chr(mark))) == 1]
    p(f"precomposed with U+{mark:04X}: {''.join(pre)}")

# marks in the diacritic blocks
BLOCKS = [(0x0300, 0x036F), (0x0483, 0x0489), (0x1AB0, 0x1AFF), (0x1DC0, 0x1DFF), (0x20D0, 0x20FF),
          (0xFE20, 0xFE2F)]
for a, b in BLOCKS:
    c = {}
    for cp in range(a, b + 1):
        c[u.category(chr(cp))] = c.get(u.category(chr(cp)), 0) + 1
    p(f"block {a:04X}..{b:04X}: {c}")
allm = sum(1 for cp in range(0x110000) if u.category(chr(cp)).startswith("M"))
inb = sum(1 for a, b in BLOCKS for cp in range(a, b + 1) if u.category(chr(cp)).startswith("M"))
p(f"marks total {allm}, in the diacritic blocks {inb}")
p("is_normalized NFKC of 'x2' and of superscript two:", u.is_normalized("NFKC", "x2"),
  u.is_normalized("NFKC", "x" + chr(0xB2)))
out.close()
```

### Appendix K2 — `facts2.py` (SHA-256 `2fc0b2f4caa0f692343326372fd84c20785c806907db0881ca74ccb3f450eeb0`)

`html.unescape` on legacy references glued to letters.

```python
"""html.unescape on legacy references glued to letters (bead hpf-klv6)."""
import html

for s in ("&shyORLD", "&shy;ORLD", "&ampx", "&notit", "&#8203;x", "&#x200B;x", "&ZeroWidthSpace;x"):
    print(repr(s), "->", ascii(html.unescape(s)))
```

### Appendix L — `check_chars.py` (SHA-256 `fc081d96af1941f5506c5e1f6628c732247f51ac73562dd743c46c6512bb23f4`)

No raw invisible, combining, private-use or odd-space character in the round-7 files.

```python
"""No raw invisible, combining, private-use or odd-space character in the
round-7 files (bead hpf-klv6). Prints, per file, every such character with
its line, or "clean".

usage: check_chars.py <file> [<file> ...]
"""
import sys
import unicodedata

for name in sys.argv[1:]:
    bad = []
    for n, line in enumerate(open(name, encoding="utf-8"), 1):
        for c in line.rstrip("\n"):
            cat = unicodedata.category(c)
            if cat in ("Cf", "Co", "Cs", "Cn", "Zl", "Zp") or cat.startswith("M") \
                    or (cat == "Zs" and c != " ") or (cat == "Cc" and c != "\t") \
                    or 0xFE00 <= ord(c) <= 0xFE0F or ord(c) in (0x115F, 0x1160, 0x3164, 0xFFA0):
                bad.append(f"{n}: U+{ord(c):04X} {unicodedata.name(c, '?')}")
    print(f"{name}: {'clean' if not bad else bad}")
```

### Appendix M — `append_appendices.py` (SHA-256 `294e88493db31fbb5e5ae671d9fd76379feee7d45924da5694c4028b094752af`)

This generator.

```python
"""Append the probe scripts to docs/worklog/hpf-klv6.md as appendices (bead
hpf-klv6): each file's exact source, under a header carrying its SHA-256.

usage: append_appendices.py <worklog> <scratch-dir>
"""
import hashlib
import sys
from pathlib import Path

worklog, scratch = Path(sys.argv[1]), Path(sys.argv[2])
APPENDICES = [
    ("A", "store_probe_r7.py", "Head vs lane over `data/explanations`: the CLI in both modes, every string "
                               "in-process, the views, the token inventory, NFD."),
    ("B", "survey_markup.py", "What markup, invisible and compatibility characters and math segments the "
                              "store holds; head vs lane token regex on the stored text. Run before the fix."),
    ("C", "survey_labels.py", "`label_sources()` under the head and the lane token regex."),
    ("D1", "make_head_copy.py", "The 6fbc6d2 lint, blob-verified."),
    ("D2", "make_head_tree.py", "The head tree for red run 2."),
    ("E", "repro_r7.py", "Review repro, per-row head/lane counts, generative sizes, the app view knocked "
                         "out, the CLI on hidden characters."),
    ("F", "junit_summary.py", "Per-test outcome table over JUnit XML files (round 6's script)."),
    ("G", "outcome_patterns.py", "Outcome patterns across the three runs."),
    ("H", "reconstruct_draft.py", "Rebuilds the red-run-1 draft by reversing the later edits."),
    ("I", "compare_junit.py", "Red run 1 vs the rebuilt draft, test by test."),
    ("J", "check_r6_residual.py", "Round 6's residual 1 on head and lane."),
    ("K", "facts.py", "Unicode and HTML facts the design relies on (Cf ranges, NFKC low lines, "
                      "precompositions, entity decoding)."),
    ("K2", "facts2.py", "`html.unescape` on legacy references glued to letters."),
    ("L", "check_chars.py", "No raw invisible, combining, private-use or odd-space character in the "
                            "round-7 files."),
    ("M", "append_appendices.py", "This generator."),
]
parts = ["",
         "Each appendix below is the exact source of a probe script, appended from the file by "
         "`append_appendices.py`. Its header line carries the SHA-256 of the file as run. Every "
         "script is read-only towards the lane, except that `make_head_tree.py` writes the head "
         "tree into a scratch directory.",
         ""]
for key, name, what in APPENDICES:
    data = (scratch / name).read_bytes()
    parts += [f"### Appendix {key} — `{name}` (SHA-256 `{hashlib.sha256(data).hexdigest()}`)", "", what, "",
              "```python", data.decode("utf-8").rstrip("\n"), "```", ""]
with worklog.open("a", encoding="utf-8") as f:
    f.write("\n".join(parts))
print(f"appended {len(APPENDICES)} appendices")
```
