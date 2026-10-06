# hpf-pvkp — PR #370 fix round 6: NFC-normalize before tokenizing in the Layer-2 lint

Origin: Codex exact-head review R6 hpf-tipc (VERDICT: HOLD at 5e89c03) of PR #370 (pipeline
hardening, origin bead hpf-y1p4). This round closes its single [FIX-INCOMPLETE][medium] finding.
Rounds 1–5 (hpf-qo10, hpf-oy2w, hpf-96rj, hpf-wu46, hpf-6fkm) are not reworked. Lane
`/home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`, `git rev-parse HEAD` =
`5e89c03b880bd8f512252ba1c31b0c8d4af4e10e` (verified first). All changes are UNCOMMITTED.

Notation: `U+030A` names one code point. A combining mark is written in this file as
`a` + U+030A, never as the raw character, so that the decomposed forms stay visible.

## Outcome

- **Finding (lint, medium): closed.** Every rule runs through one function, `scan_text`. It is
  called once per JSON string value and once per .md/.txt file. It now normalizes its text to
  NFC before any regex runs. A canonically equivalent NFD spelling therefore lints exactly like
  the precomposed one, in all three rules: L2-SNAKE, L2-HEDGAT and L2-GATEREF. L2-GATEREF had
  the same hole, because its patterns hold a precomposed `å` (`G-SPRÅK`, `från runda`).
- **Token class.** A snake-token segment is now any run of Unicode letters and digits
  (`[^\W_]`), and `_` is still the only separator, so `idé_skifte` is one token.
- **Review repro.** Head's CLI called the three NFD labels "clean". The lane reports 3 L2-SNAKE
  findings, identical to the NFC file. That holds both when the JSON stores the combining marks
  raw and when it stores them as ASCII escapes, which is `json.dumps`' default.
- **Tests.** A new file with 34 tests. On head 5e89c03, 24 fail and the 10 guards pass; this was
  run twice, on the lane before the fix and in a head tree after it. On the lane, all 34 pass.
  Gate suite: **448 passed** (baseline 414 + 34). Exact CI command: **518 passed** (484 + 34).
- **Math preservation.** Every guard stays green in default mode, in NFC and in NFD:
  - the contract examples;
  - the 74 store formula names;
  - Greek and superscript names that the widened class now reaches.
- **Store probe: unchanged.**
  - Default mode gives the same 2 L2-HEDGAT findings in 27 files.
  - `--strict` gives the same 74, with identical lines in the same order.
  - The token inventory is identical: 1,331 occurrences, 236 distinct.
  - On an NFD copy of the store, the lane's result equals its NFC result for all 169,988
    learner strings.

## Changed files (uncommitted)

| file | change | SHA-256 | blob |
|---|---|---|---|
| `pipeline/synthetic/gates/scripts/lint_learner_output.py` | NFC in `scan_text`; token class `[^\W_]`; docstrings and comments | `9fdd0c31c5744efc6f5325f4089b5053d0725febeb2432c1f1cec6a9ea33f314` | `b27282c` |
| `pipeline/synthetic/gates/scripts/tests/test_lint_nfc_normalization_round6.py` | new, 34 tests | `7f475cf6db48ea4d0cac5e51f4041b0162262935ff0c746a6648977c9ccd098c` | `62b740b` |
| `pipeline/synthetic/LAYER2-RENDERING.md` | one sentence, appended to the tier-1 normalization paragraph of "Etikettvokabulär" | `004d41da00132802649853e8d7d2926a4195f5295337f9f6e42116ae8b44593b` | `ce7a868` |
| `docs/worklog/hpf-pvkp.md` | this file | — | — |

No other file was touched. `data/` was not edited. The untracked sandbox dotfiles (character
devices bound to `/dev/null`) and `.claude/skills/*`, `.agents/`, `.codex/` and `.gc/` were
already there and are left alone.

---

## The defect (head 5e89c03)

On head, `_SNAKE_TOKEN = \b[0-9A-Za-zÅÄÖåäö]+(?:_[0-9A-Za-zÅÄÖåäö]+)+\b` ran on the raw text, and
`_fold` normalized only the token the regex had already cut. That had two consequences.

1. **NFD splits a token.** For Python's `re`, a combining mark is not a word character, so `\b`
   holds on both sides of it and the token ends there.
   - `fo` + U+0308 + `rfattarens_ha` + U+030A + `llning` yields only `rfattarens_ha`, which folds
     onto no vocabulary entry. `relse_relation` and `NN_NOTED` fail the same way.
   - L2-GATEREF has the same hole: `G-SPRA` + U+030A + `K` and `fra` + U+030A + `n runda 2` miss
     the precomposed `å` in its patterns.
2. **Any other letter kills the whole match.** The class was narrower than `\w`. Where a token
   met a word character outside the class (é, ü, ï, a ligature, a superscript), `\b` could not
   hold, and the regex found no match at all, not a shorter one. `idé_skifte`,
   `naïve_scope_shift`, `finding_or_ruling` spelled with the fi ligature U+FB01, and `v_max²`
   were no tokens, and `surface_lexical_écho` flagged nothing.

## The fix

- **`scan_text(text)`** now starts with `text = unicodedata.normalize("NFC", text)`.
  - Every rule in `RULES` runs on that one normalized string, and the excerpt is cut from it.
    Excerpts therefore show NFC text, which the bead allows.
  - Nothing reaches a rule without passing through it. `walk_json` calls `scan_text` once per
    decoded string value, and `main` calls it once per .md/.txt file.
  - On text that is already NFC the call does nothing: CPython returns the same object (checked
    with `quick_checks.py`, appendix G).
- **`_SNAKE_TOKEN = re.compile(r"\b[^\W_]+(?:_[^\W_]+)+\b")`.** A segment is any run of word
  characters other than `_`, that is Unicode letters and digits. Digits stay allowed in
  segments. `_` stays the only separator: hyphens, combining marks and punctuation are not word
  characters.
- **Docstrings and comments.** The module docstring states the normalization. `_Snake` now says
  that `search()` expects canonical text and that `scan_text`, its only caller, provides it. The
  comments at `_SNAKE_TOKEN` and in `scan_text` explain both choices.
- **Unchanged:** `_fold`, the vocabulary, both tiers, the L2-GATEREF and L2-HEDGAT patterns, the
  fail-closed input handling and the exit codes.

## Decisions

- **D1 — One normalization point: `scan_text`.** It is the one function the three rules share,
  and the only place the module runs a rule.
  - **Not the raw file text.** Normalizing the raw file text, instead or as well, was rejected.
    `json.dumps` defaults to `ensure_ascii=True`, which writes every combining mark as an ASCII
    escape (a backslash, `u` and four hex digits). A normalization of the raw text never sees
    those marks, and `json.loads` turns them back into NFD. This is pinned by
    `test_cli_lints_an_nfd_json_file_exactly_like_nfc[ascii-escaped]`.
  - **Not again inside the matchers.** That would be a second normalization point, against the
    bead's "once, at the single entry point all rules share". `_Snake.search` is private, and
    `scan_text` is its only caller.
  - **Consequence:** the review's literal call `_Snake().search(nfd_label)` still returns
    `None`, as it does on head. See residual 1 and "Review repro".
- **D2 — Token class `[^\W_]`, not a longer list of letters.**
  - It is the word-character class minus the separator, so the class and `\b` agree everywhere.
    A token is a maximal run of word characters with underscores inside it. It can no longer
    vanish because it sits next to a letter the class lacks.
  - Python's `\w` also includes Unicode digits and other numerics (², ½), so `v_max²` is a whole
    token. This matches "digits allowed in segments". Tier 2 treats such a name as style debt,
    like `värde_B`, and tier 1 leaves it alone (guard test).
  - Combining marks stay outside the class. After NFC, the only marks left are those without a
    precomposed letter. In learner text these are chiefly math accents, such as x-bar (`x` +
    U+0304) and r-hat (`r` + U+0302), and the math-preservation contract protects those names.
    The store and `pipeline/synthetic` contain no combining mark at all (survey).
- **D3 — NFC, not NFKC.** I judged the compatibility question relevant and decided against
  NFKC at the scan level. Tests pin the decision.
  - **Compatibility letters inside a token are already covered.** Tier 1 compares tokens
    through `_fold`, which applies NFKD. Once the token class admits these letters, two labels
    flag in default mode:
    - `finding_or_ruling` spelled with the fi ligature U+FB01, which PDF text extraction leaves;
    - fullwidth `ＷＯＲＬＤ_ＫＮＯＷＬＥＤＧＥ`.

    Pinned by `test_compatibility_letters_inside_a_label_flag`, red on head.
  - **NFKC would rewrite learner math in every excerpt:** `aₙ = 2ⁿ` would print as `an = 2n`,
    `x²` as `x2`, and `½` as `1⁄2`. The store writes ⁿ (26 times), ₐ (14), ᵦ (14), ₛ (12) and ˣ.
    The guard `test_the_scan_keeps_compatibility_characters_of_learner_math` fails if someone
    switches to NFKC.
  - **What only NFKC would add** is the fullwidth low line U+FF3F used as a separator, and
    no-break or thin spaces inside L2-GATEREF phrases (residual 3). That is deliberate evasion or
    rare typography, not the canonical-equivalence drift the finding is about. NFKC would not
    remove soft hyphens or zero-width spaces either. The bead also specifies NFC.
- **D4 — JSON keys are locators, not scanned text.** The lint never scans keys. The reported
  `$.key` path shows each key as written in the file, so the path still finds it. Keys are not
  normalized.
- **D5 — The tests reuse round 5's definitions.** They import `label_sources()`,
  `CONTRACT_EXAMPLES` and `STORE_FORMULA_NAMES` from the round-5 test module, which is round 5's
  single definition of "label". The accented labels from `label_sources()` are read at test
  time, so a new accented label in a source is covered automatically.

## Tests: `tests/test_lint_nfc_normalization_round6.py` (34)

| group | tests | what it pins | on head 5e89c03 |
|---|---|---|---|
| review repro | 3 | `författarens_hållning`, `jämförelse_relation`, `GODKÄNN_NOTED`: NFD `scan_text` equals NFC (L2-SNAKE, whole label in the excerpt) | FAIL `assert [] == [('L2-SNAKE', …)]` |
| every accented label | 1 | the 9 fixed accented labels and every accented label `label_sources()` yields (today `GODKÄNN_NOTED`): each flags L2-SNAKE, and NFD equals NFC | FAIL: NFD `[]` for all 9 |
| L2-GATEREF with å | 2 | `G-SPRÅK:s`, `versionen från runda 2`: NFD equals NFC (L2-GATEREF) | FAIL `assert [] == [('L2-GATEREF', …)]` |
| every rule sees NFC | 1 | spies on `RULES`: given NFD text, each of the 3 rules receives the NFC string, and all 3 fire | FAIL: the rules received the NFD string |
| CLI, JSON | 2 | an NFD file, with the combining marks stored raw (UTF-8) or as ASCII escapes, prints exactly what the NFC file prints | FAIL: only the mixed value's L2-HEDGAT line |
| CLI, .md/.txt | 2 | the same for raw text files | FAIL: only L2-HEDGAT |
| letters outside åäö | 4 | `idé_skifte`, `über_mått`, `naïve_reading`, `café_crème_2` are each one token | FAIL `assert None` |
| idé_skifte | 1 | no finding in default mode; L2-SNAKE on the whole token with `--strict`; NFD alike | FAIL `[] == ['L2-SNAKE']` |
| tier 1, other accents | 5 | `détail_as_main`, `Tóne_Misread`, `surface_lexical_écho`, `naïve_scope_shift`, `ÜBER_WORLD_KNOWLEDGE` flag; NFD alike | FAIL `[] == ['L2-SNAKE']` |
| compatibility letters | 2 | the fi ligature and fullwidth letters flag (D3) | FAIL `[] == ['L2-SNAKE']` |
| strict math, NFD | 1 | with `--strict`, the 82 formula sentences give the same result in NFD as in NFC | FAIL: 77 sentences differ |
| *guard* NFC, not NFKC | 1 | the excerpt keeps `aₙ = 2ⁿ och x² = ½` | PASS |
| *guard* default math | 1 | the 8 contract examples and the 74 store formula names never flag in default mode, in NFC or NFD | PASS |
| *guard* Greek and superscript | 7 | `Δ_total`, `θ_max`, `σ_A`, `μ_1`, `v_max²`, `x_1²`, `a_n²` never flag in default mode | PASS |
| *guard* CLI math, NFD | 1 | the default CLI over all 82 NFD formula sentences exits 0 | PASS |
| **total** | **34** | | **24 FAIL, 10 PASS** |

The 9 fixed accented labels:
- the review's three;
- the other accented label spellings in `pipeline/synthetic`: `essä_kulturhistoria`
  (`batches/batch16/gen-las-short-2.NOTES.md:47`), plus `Författarens_Hållning` and
  `hållning_stämning_ton` from round 5's test cases;
- the Swedish spellings of the other folded vocabulary entries that carry åäö:
  `hållning_stance_tone`, `essä_kulturhistorisk`, `facktext_lärobok`.

No label anywhere has a letter outside a–z and åäö (survey), so the tokens in the two "outside
åäö" groups are constructed. They are the bead's `idé_skifte`, plus accents a rendering step
could put on a label.

## Red-first evidence

1. **Red run 1:** the first draft of the test file, on the lane before any fix, with the lint
   still the 5e89c03 blob `44bea2a`: **24 failed, 10 passed** (`red-head.xml`, SHA-256
   `be39cf62d20f0b7588b1f13c9309b132c24e28805a1c08ac08eefcdc4a09aedd`). The draft (SHA-256
   `48e9bd4ec4e789bc08042e497c27d0ec85b3bec37afc9cbb6f275e45f74cc25f`) has the same 34 tests
   and assertions as the final file. Two things differ, and the harness note explains why:
   - one comment is reworded;
   - the ligature argument is now built with `chr(0xFB01)` instead of being the raw character.
2. **Red run 2, on the final file and reproducible after the fix:** the final test file in a
   **head tree** (appendix D2). The tree is a copy of the lane's `pipeline/synthetic`, with both
   files this round changed put back to their 5e89c03 blobs (`44bea2a`, `f5dcd79`, checked with
   `git hash-object`): **24 failed, 10 passed** (`red-headtree.xml`,
   `946af5e4ed90574e022c7b28d4bd9cf87f6b873d6c7dec58bbd7992e9ac38ed4`).
3. **Green:** the final file on the lane after the fix: **34 passed** (`green-final.xml`,
   `539654f21582f24334d9c13d5ce7b72739d24b9a6511e9b3ccbee0154dfec6d2`).

`junit_summary.py` (appendix F) over the three files puts every test in one of two rows: FAIL,
FAIL, PASS (the 24 defect tests) or PASS, PASS, PASS (the 10 guards). That covers 34 of 34.

## Full suites (lane, final files)

- `python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests` →
  **448 passed** (414 + 34).
- `python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q`
  (the exact CI command) → **518 passed** (484 + 34).

All 96 round-5 tests still pass. That includes the label coverage test: with the widened class,
`label_sources()` yields the same 116 labels, and the default tier misses none (appendix B).

## Review repro, before/after (appendix E)

```
=== 1. the review's call: _Snake().search(label)
författarens_hållning: NFC 21 code points, NFD 23
  head: search(NFC) -> 'författarens_hållning'; search(NFD) -> None; tokens in NFD ['rfattarens_ha']
  lane: search(NFC) -> 'författarens_hållning'; search(NFD) -> None; tokens in NFD ['rfattarens_ha']
jämförelse_relation: NFC 19 code points, NFD 21
  head: search(NFC) -> 'jämförelse_relation'; search(NFD) -> None; tokens in NFD ['relse_relation']
  lane: search(NFC) -> 'jämförelse_relation'; search(NFD) -> None; tokens in NFD ['relse_relation']
GODKÄNN_NOTED: NFC 13 code points, NFD 14
  head: search(NFC) -> 'GODKÄNN_NOTED'; search(NFD) -> None; tokens in NFD ['NN_NOTED']
  lane: search(NFC) -> 'GODKÄNN_NOTED'; search(NFD) -> None; tokens in NFD ['NN_NOTED']

=== 2. scan_text (every rule) on the NFD sentence
författarens_hållning: head []
                       lane [('L2-SNAKE', 'Låt författarens_hållning vara här.')]
jämförelse_relation: head []
                     lane [('L2-SNAKE', 'Låt jämförelse_relation vara här.')]
GODKÄNN_NOTED: head []
               lane [('L2-SNAKE', 'Låt GODKÄNN_NOTED vara här.')]

=== 3. the CLI on the three NFD sentences
-- utf-8: file holds 11 raw combining mark(s), 0 escaped
   head (exit 0):
     learner-output lint: clean — 1 file(s)
   lane (exit 1):
     L2-SNAKE repro-nfd-utf-8.json:$.s0: …Låt författarens_hållning vara här.…
     L2-SNAKE repro-nfd-utf-8.json:$.s1: …Låt jämförelse_relation vara här.…
     L2-SNAKE repro-nfd-utf-8.json:$.s2: …Låt GODKÄNN_NOTED vara här.…
     learner-output lint: 3 finding(s) in 1 file(s)
-- ascii-escaped: file holds 0 raw combining mark(s), 11 escaped
   head (exit 0):
     learner-output lint: clean — 1 file(s)
   lane (exit 1):
     L2-SNAKE repro-nfd-ascii-escaped.json:$.s0: …Låt författarens_hållning vara här.…
     L2-SNAKE repro-nfd-ascii-escaped.json:$.s1: …Låt jämförelse_relation vara här.…
     L2-SNAKE repro-nfd-ascii-escaped.json:$.s2: …Låt GODKÄNN_NOTED vara här.…
     learner-output lint: 3 finding(s) in 1 file(s)

=== 4. other rules and letters
'Det här är G-SPRÅK:s dom.' NFD: head []
                                 lane [('L2-GATEREF', 'Det här är G-SPRÅK:s dom.')]
'Se versionen från runda 2 för detaljer.' NFD: head []
                                               lane [('L2-GATEREF', 'Se versionen från runda 2 för detaljer.')]
idé_skifte: head tokens [], --strict scan_text []
idé_skifte: lane tokens ['idé_skifte'], --strict scan_text [('L2-SNAKE', 'Låt idé_skifte vara.')]
```

Block 1 is the review's own probe, `_Snake().search()` on raw NFD text. It returns `None` on the
lane as on head, by design (D1). `_Snake.search` is the private matcher, and its only caller,
`scan_text`, hands it NFC text. Everything the lint reads goes through `scan_text`: JSON values
through `walk_json`, and .md/.txt files through `main`. Blocks 2–4 show the hole closed at every
entry point and for every rule. In blocks 1 and 2 the labels and sentences print in NFC,
whichever form went in: the NFD inputs are built inside the script, and `scan_text` reports
NFC excerpts.

## Store probe (appendix A): `data/explanations`, the store LAYER2-RENDERING.md names

```
store: data/explanations — 27 lintable file(s), 169988 learner string(s)

=== 1. the CLI, head vs lane
default: head exit 1, 2 finding(s) {'L2-HEDGAT': 2}; lane exit 1, 2 finding(s) {'L2-HEDGAT': 2}
  head summary: ['learner-output lint: 2 finding(s) in 27 file(s)']
  lane summary: ['learner-output lint: 2 finding(s) in 27 file(s)']
  finding lines identical (same order): True
  L2-HEDGAT /home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.distractors[2].why_wrong: …v. Och "i vissa avseenden" är hedgning som inte fångar förstärkninge…
  L2-HEDGAT /home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane/data/explanations/host-2017.json:$.host-2017-verb2-MEK-025.steps[2].text: …kvens. "I vissa avseenden" är hedgning.…
--strict: head exit 1, 74 finding(s) {'L2-HEDGAT': 2, 'L2-SNAKE': 72}; lane exit 1, 74 finding(s) {'L2-HEDGAT': 2, 'L2-SNAKE': 72}
  head summary: ['learner-output lint: 74 finding(s) in 27 file(s)']
  lane summary: ['learner-output lint: 74 finding(s) in 27 file(s)']
  finding lines identical (same order): True

=== 2. token inventory
head: 1331 occurrence(s), 236 distinct; lane: 1331 occurrence(s), 236 distinct; identical multisets: True
tokens whose count or flags differ head vs lane: 0
tier-1 (default) flagged tokens on the lane: []

=== 3. the store in NFD (every learner string re-scanned decomposed)
learner strings whose NFD form differs from the stored form: 87113
lane default: findings NFC 2, NFD 2; strings whose result differs: 0
lane --strict: findings NFC 74, NFD 74; strings whose result differs: 0
head default: findings NFC 2, NFD 2; strings whose result differs: 2
    e.g. host-2017.json:$.host-2017-verb2-MEK-025.distractors[2].why_wrong: NFC [('L2-HEDGAT', 'v. Och "i vissa avseenden" är hedgning som inte fångar förstärkninge')] / NFD [('L2-HEDGAT', '. Och "i vissa avseenden" är hedgning som inte fångar förstärkni')]
head --strict: findings NFC 74, NFD 63; strings whose result differs: 63
    e.g. host-2013.json:$.host-2013-kvant1-NOG-026.steps[2].text: NFC [('L2-SNAKE', ' om K år går har K blivit K + K_diff och A blivit A + K_diff. Dett')] / NFD [('L2-SNAKE', 'm K år går har K blivit K + K_diff och A blivit A + K_diff. Dett')]
```

The probe printed the two head NFD excerpts in section 3 decomposed, as they came out of the NFD
text. This file shows them composed. Every other character is as printed.

- **As expected, nothing changed.** Head and lane run the real CLI and print the same lines in
  the same order, in both modes:
  - default mode gives the 2 known L2-HEDGAT findings in `host-2017-verb2-MEK-025`, in 27 files;
  - `--strict` gives 74 findings (72 L2-SNAKE, 2 L2-HEDGAT).

  The store is entirely NFC (survey), so normalization is an identity on it. No store token
  touches a letter outside the old class, so the widened class cuts the same 1,331 tokens.
- **Section 3 shows the fix on real text.** 87,113 learner strings decompose differently under
  NFD. For each of them, the lane gives the same result in NFD as in NFC, in both modes.
  - Head loses 11 `--strict` findings in NFD (74 → 63). These are formula names that become
    fragments too short for tier 2, such as `t_hög` → `t_ho`.
  - On head, 2 default-mode and 63 `--strict` results differ. An excerpt cut from NFD text
    covers fewer visible characters.

## Surveys (appendices B, C; run before the round-6 test file and the doc sentence existed)

- **Store** (`data/explanations`):
  - 169,988 learner strings: 0 are non-NFC, and 0 contain a combining mark;
  - letters outside the old class do occur, among them é (638), π (958), Δ (152), ç (47) and
    ü (41);
  - none of them sits inside or next to a snake token: head and lane cut all 1,331 occurrences
    alike.
- **`pipeline/synthetic`:** 1,650 text files: 0 are non-NFC, and 0 contain a combining mark.
- **`label_sources()`:** 116 labels with either token class. One is accented: `GODKÄNN_NOTED`,
  16 occurrences, in batch14 and batch15 `ADJUDICATION.md`.
- **Accented snake tokens in `pipeline/synthetic`:** 28 distinct.
  - 6 are tier 1: the label spellings listed under Tests.
  - 22 are tier 2 only: the formula names (`värde_B` and the others), plus `Bråtnäs_naturreservat`
    (a place name in a batch15 candidate) and `rätt_svar` (`gates/scripts/check_sheet_sync.py`).
  - None has a letter outside åäö.

---

## Residual risks, knowingly left

1. **The private matchers still see raw text.** A direct call to `SNAKE.search`,
   `GATEREF.search` or `HEDGAT.search`, bypassing `scan_text`, sees the caller's text
   unnormalized. The review's literal `_Snake().search(nfd)` therefore still returns `None`.
   No module path makes such a call, and the `_Snake` docstring states the precondition. A tool
   or test that wants lint results must call `scan_text` or the CLI.
2. **Round 5's `label_sources()` tokenizes raw source text.** If a future source carries an NFD
   label, it is collected as fragments.
   - When a fragment is label-shaped, the failure is loud: `NN_NOTED` fails the coverage test.
   - Otherwise the label is skipped silently.

   All 1,650 text files under `pipeline/synthetic` are NFC today. Changing this would rework
   round 5, which the bead rules out.
3. **NFC leaves compatibility separators and spaces alone (D3).**
   - `WORLD_KNOWLEDGE` written in fullwidth letters with the fullwidth low line U+FF3F as its
     separator is no snake token.
   - `round` + U+00A0 (no-break space) + `2 version` misses the L2-GATEREF phrase, whose spaces
     are literal. That pattern is pre-existing.
   - Format characters such as the soft hyphen and the zero-width space split tokens and words
     under every normalization form.

   The threat model is accidental leakage, not adversarial evasion.
4. **A combining mark with no precomposed letter still splits a token after NFC**, for example
   `j` + U+0308, or the math x-bar `x` + U+0304. Such text is not canonically equivalent to any
   label, so it is not the finding's hole. The store and the corpus contain none.
5. **`--strict` now sees more formula names whole.** Names with Greek letters, other accented
   letters or superscripts (`θ_max`, `v_max²`, `idé_skifte`) become tier-2 style debt, under the
   same rule as hpf-gyo5. None is in the store today, so the `--strict` count is unchanged at
   74. Default mode is unaffected (guards).
6. **Excerpts show NFC text, and JSON paths show keys as written** (D4).
7. **The token class follows the running Python's Unicode database** (`\w`). A letter added in a
   later Unicode version counts once the interpreter knows it. The lane runs Python 3.12.3.

## Reproduction

```
git rev-parse HEAD   # 5e89c03b880bd8f512252ba1c31b0c8d4af4e10e
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests/test_lint_nfc_normalization_round6.py   # 34 passed
python3 -m pytest -q -p no:cacheprovider pipeline/synthetic/gates/scripts/tests          # 448 passed
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests pipeline/synthetic/gates/scripts/tests -q   # 518 passed
python3 pipeline/synthetic/gates/scripts/lint_learner_output.py data/explanations        # exit 1: the 2 known L2-HEDGAT
# S = a scratch dir
python3 make_head_copy.py "$PWD" $S/head/lint_learner_output.py     # appendix D1: blob 44bea2a == 5e89c03
python3 make_head_tree.py "$PWD" $S/headtree                        # appendix D2: changed files back to 5e89c03
python3 -m pytest -q -p no:cacheprovider $S/headtree/pipeline/synthetic/gates/scripts/tests/test_lint_nfc_normalization_round6.py  # 24 failed, 10 passed
python3 store_probe_r6.py "$PWD" $S/head/lint_learner_output.py $S/store.txt         # appendix A
python3 survey_unicode.py "$PWD" $S/survey_unicode.txt                               # appendix B
python3 survey_accented.py "$PWD" $S/survey_accented.txt                             # appendix C
python3 repro_r6.py "$PWD" $S/head/lint_learner_output.py $S/repro $S/repro.txt      # appendix E
python3 junit_summary.py $S/junit.txt red-head.xml red-headtree.xml green-final.xml  # appendix F
python3 quick_checks.py                                                              # appendix G
```

**Coordination note.** The bead's metadata names `gc.check_path`:
`/home/loucmane/gascity/home/cache/repos/954ed14987da288bfb98feee4cdab5043a44de1a8a9cf47afaaa0ce6e438fd5f/gascity/assets/scripts/checks/build-artifact-valid.sh`
(SHA-256 `71f17450e127055c8304a3cb44ce87b2439abe04ba41f225c7b386be3dc73911`).
- It is the same script, with the same digest, as in round 5.
- It is the dispatcher's producer-stage gate, and this bead's description does not ask the worker
  to run it. I read it and did not run it.
- It needs the step metadata `gc.build.artifact_schema` and `gc.build.artifact_path_keys`, and
  this bead carries neither.

**Harness notes.**
- The session's command policy refuses `python3 -c`, so every check ran as a script file.
- The file-writing tool replaces a written backslash-u escape with the character itself. Other
  backslash sequences (`\n`, `\b`, `\w`) pass through unchanged.
- That hit the first draft of this worklog, the first draft of the test file and the first
  `quick_checks.py`. In the test file, the escape sat in one comment and in the
  ligature literal.
- Fix: those files now name code points in `U+` notation (prose) or build them with `chr()`
  (code), and contain no raw combining mark, no-break space or ligature (checked with `grep -P`).
- After the rewrite, the test file was rerun on head (head tree) and on the lane, the full
  suites were rerun, and `quick_checks.py` was rerun. Results were unchanged.

## Appendices

Each appendix below is the exact source of a probe script. A generator appended them from the
files, and its header line carries the SHA-256 of the file as run. Appendix C's script and
appendix B's survey ran before the test file existed. Appendix G is the rewritten
`quick_checks.py`, which states the same facts as the first version.

### Appendix A — `store_probe_r6.py` (SHA-256 `5b7a6b0ba836e6f5288054bc0369a9d145d8e8bc854aafe576e30f32acc0ac1e`)

Head vs lane over `data/explanations`: the CLI in both modes, the token inventory, and the store re-scanned in NFD.

```python
"""Store probe for bead hpf-pvkp: head (5e89c03) lint vs the lane lint over the
learner store named in LAYER2-RENDERING.md (data/explanations). Read-only.

  1. the real CLI, head and lane, default and --strict: exit code, summary
     line, and every finding line only one side prints;
  2. token inventory: every snake_case occurrence in the store's learner
     strings, head token regex on the raw text vs lane token regex on NFC text,
     and each distinct token's tier-1/tier-2 flags on head and on the lane;
  3. the store in NFD: every learner string re-scanned in its NFD form
     (in-process, scan_text), default and --strict — lane must equal its NFC
     result string for string; head shown for contrast.

usage: store_probe_r6.py <lane-root> <head-lint-path> <report-path>
"""
from __future__ import annotations

import builtins
import importlib.util
import json
import subprocess
import sys
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
    r = subprocess.run([sys.executable, str(path), *(["--strict"] if strict else []), str(STORE)],
                       capture_output=True, text=True)
    lines = r.stdout.splitlines()
    return r.returncode, [ln for ln in lines if ln.startswith("L2-")], [ln for ln in lines if not ln.startswith("L2-")]


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
        (hc, hf, hs), (nc, nf, ns) = cli(HEAD_PATH, strict), cli(LANE_PATH, strict)
        rules_h = Counter(ln.split()[0] for ln in hf)
        rules_n = Counter(ln.split()[0] for ln in nf)
        print(f"{mode}: head exit {hc}, {len(hf)} finding(s) {dict(sorted(rules_h.items()))}; "
              f"lane exit {nc}, {len(nf)} finding(s) {dict(sorted(rules_n.items()))}")
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

    print("\n=== 2. token inventory")
    head_occ, new_occ = Counter(), Counter()
    for _, _, s in items:
        head_occ.update(m.group(0) for m in HEAD._SNAKE_TOKEN.finditer(s))
        new_occ.update(m.group(0) for m in NEW._SNAKE_TOKEN.finditer(unicodedata.normalize("NFC", s)))
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
    print(f"tier-1 (default) flagged tokens on the lane: "
          f"{sorted(t for t in new_occ if NEW._Snake().search(f'x {t} y'))}")

    print("\n=== 3. the store in NFD (every learner string re-scanned decomposed)")
    decomposable = sum(1 for _, _, s in items if unicodedata.normalize("NFD", s) != s)
    print(f"learner strings whose NFD form differs from the stored form: {decomposable}")
    for label, mod in (("lane", NEW), ("head", HEAD)):
        for strict in (False, True):
            mode = "--strict" if strict else "default"
            n_nfc = n_nfd = differ = 0
            example = None
            for name, path, s in items:
                a = scan(mod, s, strict)
                b = scan(mod, unicodedata.normalize("NFD", s), strict)
                n_nfc += len(a)
                n_nfd += len(b)
                if a != b:
                    differ += 1
                    example = example or (name, path, a, b)
            print(f"{label} {mode}: findings NFC {n_nfc}, NFD {n_nfd}; strings whose result differs: {differ}")
            if example:
                print(f"    e.g. {example[0]}:{example[1]}: NFC {example[2]} / NFD {example[3]}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### Appendix B — `survey_unicode.py` (SHA-256 `1b26ec54536c54c7c6a7d6ac85c9257bada2884152a1c86fd5052a081b55e6db`)

NFC facts of the store and `pipeline/synthetic`; `label_sources()` with the head vs the new token class.

```python
"""Survey for bead hpf-pvkp (read-only): what NFC normalization before
tokenizing, and a Unicode-letter snake-token class, change on

  1. the learner store data/explanations (every learner string the lint scans);
  2. the round-5 label sources (label_sources() in the round-5 test), and
     whether the files those sources read are NFC;
  3. pipeline/synthetic as a whole: non-NFC text and combining marks.

usage: survey_unicode.py <lane-root> <report-path>
"""
from __future__ import annotations

import builtins
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


SCRIPTS = LANE / "pipeline/synthetic/gates/scripts"
sys.path.insert(0, str(SCRIPTS))
sys.path.insert(0, str(SCRIPTS / "tests"))
import lint_learner_output as lint  # noqa: E402

HEAD_RX = lint._SNAKE_TOKEN
NEW_RX = re.compile(r"\b[^\W_]+(?:_[^\W_]+)+\b")
SWEDISH = set("åäöÅÄÖ")


def nfc(s):
    return unicodedata.normalize("NFC", s)


def strings(obj, path="$"):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if not k.startswith("_"):
                yield from strings(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from strings(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        yield path, obj


def flags(tok, strict):
    s = lint._Snake(strict=strict)
    return s.search(f"x {tok} y") is not None


def store():
    print("=== 1. store data/explanations")
    files, failures = lint.collect([LANE / "data/explanations"])
    print(f"{len(files)} file(s), input failures {failures}")
    n = non_nfc = with_marks = 0
    mark_chars = Counter()
    letters = Counter()
    head_occ, new_occ = Counter(), Counter()
    where = {}
    for fp in files:
        text = fp.read_text(encoding="utf-8")
        if not unicodedata.is_normalized("NFC", text):
            print(f"  raw file text not NFC: {fp.name}")
        items = (strings(json.loads(text)) if fp.suffix == ".json" else [("-", text)])
        for path, s in items:
            n += 1
            if s != nfc(s):
                non_nfc += 1
                print(f"  NON-NFC string {fp.name}:{path}: {s[:80]!r}")
            c = nfc(s)
            ms = [ch for ch in c if unicodedata.combining(ch)]
            if ms:
                with_marks += 1
                mark_chars.update(f"U+{ord(ch):04X} {unicodedata.name(ch, '?')}" for ch in ms)
                print(f"  combining mark after NFC {fp.name}:{path}: {c[:80]!r}")
            for ch in c:
                if ch.isalpha() and not ch.isascii() and ch not in SWEDISH:
                    letters[ch] += 1
            for m in HEAD_RX.finditer(s):
                head_occ[m.group(0)] += 1
                where.setdefault(m.group(0), f"{fp.name}:{path}")
            for m in NEW_RX.finditer(c):
                new_occ[m.group(0)] += 1
                where.setdefault(m.group(0), f"{fp.name}:{path}")
    print(f"strings scanned: {n}; non-NFC: {non_nfc}; with combining marks after NFC: {with_marks}")
    print(f"combining marks after NFC: {dict(mark_chars)}")
    print(f"non-ASCII letters other than åäöÅÄÖ: {sorted(letters.items())}")
    print(f"snake occurrences: head regex {sum(head_occ.values())} ({len(head_occ)} distinct), "
          f"new regex on NFC {sum(new_occ.values())} ({len(new_occ)} distinct)")
    for tok in sorted(set(head_occ) | set(new_occ), key=str.casefold):
        if head_occ[tok] != new_occ[tok]:
            print(f"  DIFF {tok!r}: head x{head_occ[tok]} new x{new_occ[tok]} "
                  f"default={flags(tok, False)} strict={flags(tok, True)} first at {where[tok]}")
    # characters adjacent to a snake token that are word chars outside the head class
    print()


def label_sources_diff():
    print("=== 2. round-5 label_sources(): head token regex vs new token regex")
    import test_verdict_enum_and_label_vocabulary_round5 as r5
    lint._SNAKE_TOKEN = HEAD_RX
    head = r5.label_sources()
    lint._SNAKE_TOKEN = NEW_RX
    new = r5.label_sources()
    lint._SNAKE_TOKEN = HEAD_RX

    def flat(found):
        out = defaultdict(set)
        for source, labels in found.items():
            for label, wh in labels.items():
                out[label] |= {f"{source}: {w}" for w in wh}
        return out

    h, n = flat(head), flat(new)
    print(f"labels: head {len(h)}, new {len(n)}")
    for label in sorted(set(h) ^ set(n), key=str.casefold):
        side = "ONLY-NEW " if label in n else "ONLY-HEAD"
        print(f"  {side} {label!r}  {sorted(n.get(label) or h.get(label))[:3]}")
    accented = sorted((x for x in n if not x.isascii()), key=str.casefold)
    print(f"accented labels (new regex): {len(accented)}")
    for label in accented:
        print(f"  {label!r} NFC={label == nfc(label)} sources={sorted(n[label])[:2]}")
    lint._SNAKE_TOKEN = NEW_RX
    missed = [x for x in n if not r5._flags(x)]
    lint._SNAKE_TOKEN = HEAD_RX
    print(f"labels (new regex) the default tier would miss with the new regex: {missed}")
    print()


def corpus_nfc():
    print("=== 3. pipeline/synthetic: non-NFC files and combining marks")
    root = LANE / "pipeline/synthetic"
    bad = 0
    total = 0
    marks = Counter()
    for fp in sorted(root.rglob("*")):
        if not fp.is_file() or fp.suffix not in (".md", ".json", ".jsonl", ".py", ".js", ".txt"):
            continue
        if "__pycache__" in fp.parts:
            continue
        total += 1
        try:
            text = fp.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            print(f"  not UTF-8: {fp.relative_to(LANE)}")
            continue
        if not unicodedata.is_normalized("NFC", text):
            bad += 1
            c = nfc(text)
            i = next(i for i, (a, b) in enumerate(zip(text, c)) if a != b)
            print(f"  NON-NFC {fp.relative_to(LANE)} first at char {i}: {text[max(0, i - 20):i + 20]!r}")
        for ch in nfc(text):
            if unicodedata.combining(ch):
                marks[f"U+{ord(ch):04X} {unicodedata.name(ch, '?')}"] += 1
    print(f"{total} text file(s); non-NFC: {bad}; combining marks left after NFC: {dict(marks)}")


store()
label_sources_diff()
corpus_nfc()
REPORT.close()
```

### Appendix C — `survey_accented.py` (SHA-256 `aeeaa716e9ad03cf58adb42152e00e02c7acc8cd75a45311d43e03744614db29`)

Every snake token with a non-ASCII letter in `pipeline/synthetic`, by tier.

```python
"""Survey for bead hpf-pvkp (read-only): every snake_case token with a
non-ASCII letter in pipeline/synthetic (text files), tokenized with the
Unicode-letter class on NFC text, and how the lint's two tiers treat it.

usage: survey_accented.py <lane-root> <report-path>
"""
from __future__ import annotations

import builtins
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

LANE = Path(sys.argv[1])
REPORT = open(sys.argv[2], "w", encoding="utf-8")  # noqa: SIM115


def print(*a, **k):  # noqa: A001
    builtins.print(*a, **k, file=REPORT)


sys.path.insert(0, str(LANE / "pipeline/synthetic/gates/scripts"))
import lint_learner_output as lint  # noqa: E402

NEW_RX = re.compile(r"\b[^\W_]+(?:_[^\W_]+)+\b")
lint._SNAKE_TOKEN = NEW_RX
SWEDISH = set("åäöÅÄÖ")

occ = defaultdict(list)
root = LANE / "pipeline/synthetic"
for fp in sorted(root.rglob("*")):
    if not fp.is_file() or fp.suffix not in (".md", ".json", ".jsonl", ".py", ".js", ".txt"):
        continue
    if "__pycache__" in fp.parts:
        continue
    text = unicodedata.normalize("NFC", fp.read_text(encoding="utf-8"))
    for n, line in enumerate(text.splitlines(), 1):
        for m in NEW_RX.finditer(line):
            tok = m.group(0)
            if not tok.isascii():
                occ[tok].append(f"{fp.relative_to(root)}:{n}")


def tiers(tok):
    return (lint._Snake(strict=False).search(f"x {tok} y") is not None,
            lint._Snake(strict=True).search(f"x {tok} y") is not None)


print(f"{len(occ)} distinct non-ASCII snake tokens in pipeline/synthetic")
for label, want in (("DEFAULT-FLAGGED (tier 1)", (True, True)),
                    ("STRICT-ONLY (tier 2)", (False, True)),
                    ("NEVER", (False, False))):
    toks = sorted((t for t in occ if tiers(t) == want), key=str.casefold)
    print(f"\n== {label}: {len(toks)}")
    for t in toks:
        non_swe = sorted({c for c in t if c.isalpha() and not c.isascii() and c not in SWEDISH})
        print(f"  {t!r} x{len(occ[t])} {'NON-ÅÄÖ ' + ''.join(non_swe) if non_swe else ''} first {occ[t][0]}")
print("\nPYTHON-LIST default-flagged:")
print(repr(sorted((t for t in occ if tiers(t)[0]), key=str.casefold)))
REPORT.close()
```

### Appendix D1 — `make_head_copy.py` (SHA-256 `e3284b3639a9c0704a7b39939beb16723c0032082a2b5999aa9be9d9c0aeed07`)

The 5e89c03 lint, blob-verified.

```python
"""Write the head (5e89c03) lint_learner_output.py to <out> and verify its blob.

usage: make_head_copy.py <lane-root> <out-path>
Prints: <blob of copy> <blob at 5e89c03> <equal?> <sha256 of copy>
"""
import hashlib
import subprocess
import sys
from pathlib import Path

lane, out = Path(sys.argv[1]), Path(sys.argv[2])
rel = "pipeline/synthetic/gates/scripts/lint_learner_output.py"


def git(*args, text=True):
    return subprocess.run(["git", "-C", str(lane), *args], capture_output=True, check=True, text=text).stdout


data = git("show", f"5e89c03:{rel}", text=False)
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(data)
blob = git("hash-object", str(out)).strip()
want = git("rev-parse", f"5e89c03:{rel}").strip()
print(blob, want, blob == want, hashlib.sha256(data).hexdigest())
```

### Appendix D2 — `make_head_tree.py` (SHA-256 `15388c767643937add237de56b3fb65fcacf210e7ba9d295c24184413748b3d2`)

The head tree for red run 2.

```python
"""Head tree for the round-6 red re-run (bead hpf-pvkp): the lane's
pipeline/synthetic copied to <dest>/pipeline/synthetic, with every file this
round changed swapped back to its 5e89c03 blob. Only the new round-6 test
file then differs from head. Verifies each swapped blob against 5e89c03.

usage: make_head_tree.py <lane-root> <dest>
"""
import shutil
import subprocess
import sys
from pathlib import Path

lane, dest = Path(sys.argv[1]), Path(sys.argv[2])
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
    out.write_bytes(git("show", f"5e89c03:{rel}", text=False))
    blob, want = git("hash-object", str(out)).strip(), git("rev-parse", f"5e89c03:{rel}").strip()
    print(f"{rel}: copy {blob} head {want} equal={blob == want}")
# the lane's uncommitted changes under pipeline/synthetic, so nothing else differs
status = git("status", "--porcelain", "--", "pipeline/synthetic")
print("lane changes under pipeline/synthetic:\n" + status)
```

### Appendix E — `repro_r6.py` (SHA-256 `887b6d3d7b605062600b8815699b6609ed7b7c05ff95e110f135b2a455747544`)

The review repro, head vs lane.

```python
"""Review repro for bead hpf-pvkp, head (5e89c03) vs lane, read-only.

  1. the review's own call, _Snake().search(), on NFC and NFD, plus the token
     fragments the head regex cuts the NFD form into;
  2. scan_text (the entry point every rule shares) on the NFD forms;
  3. the CLI on JSON files holding the three NFD sentences, written raw
     (UTF-8) and ASCII-escaped (json.dumps' default), head vs lane;
  4. G-SPRÅK / "från runda" in NFD (L2-GATEREF) and idé_skifte (--strict).

usage: repro_r6.py <lane-root> <head-lint-path> <work-dir> <report-path>
"""
from __future__ import annotations

import builtins
import importlib.util
import json
import subprocess
import sys
import unicodedata
from pathlib import Path

LANE, HEAD_PATH, WORK = Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3])
REPORT = open(sys.argv[4], "w", encoding="utf-8")  # noqa: SIM115
LANE_PATH = LANE / "pipeline/synthetic/gates/scripts/lint_learner_output.py"
WORK.mkdir(parents=True, exist_ok=True)


def print(*a, **k):  # noqa: A001 — the report goes to the file
    builtins.print(*a, **k, file=REPORT)


def _load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


HEAD, NEW = _load("lint_head", HEAD_PATH), _load("lint_new", LANE_PATH)


def nfc(s):
    return unicodedata.normalize("NFC", s)


def nfd(s):
    return unicodedata.normalize("NFD", s)


def grp(m):
    return None if m is None else m.group(0)


LABELS = tuple(map(nfc, ("författarens_hållning", "jämförelse_relation", "GODKÄNN_NOTED")))

print("=== 1. the review's call: _Snake().search(label)")
for label in LABELS:
    d = nfd(label)
    print(f"{label}: NFC {len(label)} code points, NFD {len(d)}")
    for side, mod in (("head", HEAD), ("lane", NEW)):
        print(f"  {side}: search(NFC) -> {grp(mod._Snake().search(label))!r}; "
              f"search(NFD) -> {grp(mod._Snake().search(d))!r}; "
              f"tokens in NFD {[m.group(0) for m in mod._SNAKE_TOKEN.finditer(d)]!r}")

print("\n=== 2. scan_text (every rule) on the NFD sentence")
for label in LABELS:
    s = nfd(nfc("Låt ") + label + nfc(" vara här."))
    print(f"{label}: head {HEAD.scan_text(s)!r}")
    print(f"{' ' * len(label)}  lane {NEW.scan_text(s)!r}")

print("\n=== 3. the CLI on the three NFD sentences")
values = [nfd(nfc("Låt ") + label + nfc(" vara här.")) for label in LABELS]
for mode, ensure_ascii in (("utf-8", False), ("ascii-escaped", True)):
    f = WORK / f"repro-nfd-{mode}.json"
    f.write_text(json.dumps({f"s{i}": v for i, v in enumerate(values)}, ensure_ascii=ensure_ascii),
                 encoding="utf-8")
    raw = f.read_text(encoding="utf-8")
    print(f"-- {mode}: file holds {raw.count(chr(0x308)) + raw.count(chr(0x30A))} raw combining mark(s), "
          f"{raw.count(chr(92) + 'u0308') + raw.count(chr(92) + 'u030a')} escaped")
    for side, path in (("head", HEAD_PATH), ("lane", LANE_PATH)):
        r = subprocess.run([sys.executable, str(path), str(f)], capture_output=True, text=True)
        print(f"   {side} (exit {r.returncode}):")
        for line in r.stdout.replace(str(f), f.name).splitlines():
            print(f"     {line}")

print("\n=== 4. other rules and letters")
for text in map(nfc, ("Det här är G-SPRÅK:s dom.", "Se versionen från runda 2 för detaljer.")):
    print(f"{text!r} NFD: head {HEAD.scan_text(nfd(text))!r}")
    print(f"{' ' * len(repr(text))}      lane {NEW.scan_text(nfd(text))!r}")
tok = nfc("idé_skifte")
for side, mod in (("head", HEAD), ("lane", NEW)):
    mod.SNAKE.strict = True
    print(f"{tok}: {side} tokens {[m.group(0) for m in mod._SNAKE_TOKEN.finditer(tok)]!r}, "
          f"--strict scan_text {mod.scan_text(nfc('Låt ') + tok + ' vara.')!r}")
    mod.SNAKE.strict = False
REPORT.close()
```

### Appendix F — `junit_summary.py` (SHA-256 `ad9166dd999c7e30d81fc931eb26f19668d1716ee59eaa9d2883236f16f0c7d5`)

Per-test outcome table over JUnit XML files.

```python
"""Per-test outcome table for one or more pytest JUnit XML files (bead hpf-pvkp).

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

### Appendix G — `quick_checks.py` (SHA-256 `cdd2a9addfc8a138e6e42f0a422ceab2b3e0ef8bae3e8d53e51cb8c886b5a612`)

The Unicode facts the design relies on.

```python
"""Quick Unicode facts the round-6 design relies on (bead hpf-pvkp).
Every exotic character is built with chr(), so this source is plain ASCII
apart from the Swedish test words."""
import re
import unicodedata as u

print("lone surrogate NFC:", ascii(u.normalize("NFC", chr(0xD800) + "x")))
t = "ok å"
print("NFC of NFC text is the same object:", u.normalize("NFC", t) is t)
w = re.compile(r"\w")
for cp in (0xFB01, 0xFF37, 0xFF3F, 0x00B2, 0x0308, 0x2099, 0x00E9, 0x03C0, 0x00BD):
    ch = chr(cp)
    print(f"U+{cp:04X} {u.name(ch)}: \\w={bool(w.fullmatch(ch))} "
          f"isalpha={ch.isalpha()} isdigit={ch.isdigit()} cat={u.category(ch)} "
          f"NFC={ascii(u.normalize('NFC', ch))} NFKC={ascii(u.normalize('NFKC', ch))}")
HEAD = re.compile(r"\b[0-9A-Za-zÅÄÖåäö]+(?:_[0-9A-Za-zÅÄÖåäö]+)+\b")
NEW = re.compile(r"\b[^\W_]+(?:_[^\W_]+)+\b")
fw = "".join(chr(ord(c) + 0xFEE0) if c != "_" else c for c in "WORLD_KNOWLEDGE")
for s in ["idé_skifte", chr(0xFB01) + "nding_or_ruling", fw, "v_max" + chr(0xB2), "x_1" + chr(0xB2),
          u.normalize("NFD", "författarens_hållning"), "a__b", "foo_bar_", "_foo_bar",
          "K_2007", "scope_2_shift", "naïve_scope_shift"]:
    print(f"{ascii(s)}: head={[m.group(0) for m in HEAD.finditer(s)]} new={[m.group(0) for m in NEW.finditer(s)]}")
```
