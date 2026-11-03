# Worklog — hpf-wmp8

Nine quant questions showed raw LaTeX (missing math delimiters). Marker: BANK MATH FIX.

Notation below: ⟦ stands for U+E000 and ⟧ for U+E001. Strings are the decoded JSON values (one backslash, `\t` = tab).

## Findings

- 2026-11-03: Claimed at base `bd59f8021556b37475af0801a67551c831caaf13`, clean branch (only pre-existing untracked dotfiles at the worktree root, not created or staged by this work). `app/node_modules` present. `data/hp_question_bank.json` does not exist (neither here nor in the main checkout), so the served bank is the only copy to fix.
- A bank-wide scan found exactly the nine listed questions (17 fields) with a backslash command outside a delimiter pair. No delimiter is unbalanced anywhere in the bank.
- The nine files store delimiters as literal characters (`host-2017.json`: 101 lines with a literal U+E000, none in JSON-escaped form). The fix script asserted the same literal-only storage for all nine files before editing, and wrote literal characters to match. In the script they came from Python escapes, never from typed literals.
- Root cause: the strings were written after parsing, by hand-repair commits straight into `app/public/data`:
  - #70 `scripts/fix_quant_blocker_subset.py`: var-2022-2 XYZ-006 (prompt only; its options were already delimited).
  - #73 `scripts/fix_xyz_009_dropped_fraction.py`: host-ver1/ver2-2019 XYZ-009.
  - #78 `scripts/fix_quant_blockers_v2.py`: host-2017 KVA-018, host-2020 KVA-015, host-2024 XYZ-002, var-2026 XYZ-012.
  - #90 XYZ PDF recovery batch: the var-2024 XYZ-008 options.
  - #191 DTK regen wave: the var-2018-1 KVA-022 prompt.
  - The three scripts wrap LaTeX with `m()`, but their `E0`/`E1` constants are empty strings. Checked by code point, there are 0 private-use characters in each file, so `m()` was a no-op. The delimiters were lost when the scripts were written (see the gotcha below).
- Trap found: KaTeX 0.16.45 rejects `\mathrm` in text mode (`font.ts` lacks `allowedInText`). MathText's `wrapUnits` rewrites `cm` as `\mathrm{cm}`, including inside `\text{cm}`. Wrapping var-2024 XYZ-008's options verbatim would therefore swap raw LaTeX for a red KaTeX error. This is proven below (evidence run).
- host-ver1/ver2-2019-kvant1-XYZ-009 are currently in `EXCLUDED_QUESTIONS` (broken figures), so they are off the drill pool. Their prompts are fixed anyway, ready for re-admission. var-2018-1-kvant2-KVA-022 is worked example KVA-TRAP-050, so the fix also reaches the Lektion surface.

## Decisions

- Wrap each LaTeX run only, matching delimited neighbours. A whole equation goes in one pair, as in `⟦3x \cdot \sqrt{2} = \sqrt{72}⟧ Vad är x?` (host-2025-kvant2-XYZ-006). In KVA prompts, `Kvantitet I:` prose stays outside and each quantity is wrapped. Bare variables (`x`, `y`) and plain-number options (`2`, `4`, `1`) stay as prose, as the neighbours do.
- var-2024-kvant2-XYZ-008: `\text{cm}` becomes `\mathrm{cm}` inside the new pair, the form the bank already uses (`125 ⟦\mathrm{cm}^{3}⟧`, `40 ⟦\mathrm{cm}^{2}⟧`). Numbers, answers and wording are unchanged. This is the one edit beyond inserting delimiters, and it is needed to typeset.
- Parser: no change and no parser test (see Parser below). pytest was not run, because the parser is untouched.
- Out-of-scope defects found on the way are reported under Follow-ups, not fixed ("other questions stay byte-identical").

## Parser

- `parser/parse_quant.py` holds the real delimiter characters in `MATH_OPEN`/`MATH_CLOSE` (one literal U+E000 and one U+E001, checked by code point). It wraps every LaTeX fragment it emits: superscripts (line 293), sub/superscript groups (522) and stacked fractions (611, 650, 655, 815). `_wrap_unit_base` only runs inside those wrapped strings.
- It never emits `\sqrt`, `\dfrac`, `\cdot`, `\left`, `\text` or `\pi` (0 hits in `parser/*.py`). So no emit path produces the nine strings, and adding wrappers for constructs it never outputs would be dead, untestable code.
- A re-parse cannot reintroduce these strings. The parser's own output for these questions is the pre-repair garbled text, and its LaTeX is delimited. The main checkout's untracked `data/parsed/` shows `Kvanttiet I: ⟦\frac{6}{1}⟧ ⟦\frac{6}{1}⟧ …` for host-2020 KVA-015, `Vad är medelvärdet av 3 5` for var-2022-2 XYZ-006, and `answer_only` for host-2024 XYZ-002 and var-2024 XYZ-008.
- The real hazard is different and pre-existing: `parser/build.py` writes `data/parsed/`, and `app/scripts/sync-dataset.sh` copies it over `app/public/data`. That would discard every post-parse repair. If a re-sync brings back any undelimited command, `bankMath.test.ts` fails.

## Progress

- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:inspect|E:source] Read MathText, the bank loader and test idioms, the parser emit sites, KaTeX's font/parser source, the provenance commits and the fix scripts. Dumped the nine questions and their delimited neighbours.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:red|E:vitest-10-failed] Added `app/src/data/bankMath.test.ts` before touching data. `pnpm test src/data/bankMath.test.ts --maxWorkers=2` gave 11 tests, 10 failed and 1 passed (manifest coverage). The invariant listed 17 offenders:
  - host-2017-kvant1-KVA-018 prompt `\dfrac`
  - host-2020-kvant2-KVA-015 prompt `\dfrac`
  - host-2024-kvant1-XYZ-002 prompt `\sqrt`, options B and C `\sqrt`
  - host-ver1-2019-kvant1-XYZ-009 and host-ver2-2019-kvant1-XYZ-009 prompt `\frac`
  - var-2018-1-kvant2-KVA-022 prompt `\sqrt`
  - var-2022-2-kvant1-XYZ-006 prompt `\frac`
  - var-2024-kvant2-XYZ-008 options A–C `\left`, option D `\pi`
  - var-2026-kvant1-XYZ-012 prompt `\frac`, B `\frac`, C `\sqrt`, D `\sqrt`

  All nine render cases failed: raw commands reached `textContent`.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:evidence|E:katex-parse-error] Evidence run: wrapped everything but kept var-2024's `\text{cm}`. The invariant passed, but the render case failed with 10 passed and 1 failed. The failure was a `katex-error` span: `ParseError: KaTeX parse error: Can't use function '\mathrm' in text mode at position 39`, source `\left(12+\dfrac{\pi}{2}\right)\,\text{\mathrm{cm}}^{2}`.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:implement|E:17-fields] Final run of the scratch Python fix. It does targeted replacement on the raw text inside each question's own span and matches `"prompt": <json>` / `"text": <json>` exactly once. It reads and writes bytes, so line endings and each file's own indentation (some files use 1-space indent) survive.
  - Built-in checks: only the targeted fields change; the new text equals the old text plus delimiters (and the unit swap on var-2024); question counts and line counts are unchanged; exactly one line changes per field.
  - A first attempt aborted on a difflib autojunk miscount before writing host-2024. The verifier was replaced with an exact line-by-line comparison, and every run starts from pristine copies.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:green|E:vitest-11-passed] `pnpm test src/data/bankMath.test.ts --maxWorkers=2`: 11/11 passed.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:verify-data|E:json-load] An independent `json.load` of all nine files, compared field by field with the pristine copies, found 17 changed fields, all targeted. It found 19 delimiter pairs added (host-2017 1, host-2020 2, host-2024 3, host-ver1-2019 1, host-ver2-2019 1, var-2018-1 1, var-2022-2 2, var-2024 4, var-2026 4), no JSON-escaped delimiters introduced, no non-text keys changed, and trailing newlines kept. `git diff --stat`: 9 files, 17 insertions and 17 deletions.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:full-suite|E:5289-passed] `pnpm test` (full suite, no `--maxWorkers`): 182 files passed, 5,289 tests passed, 0 failed, 46.06 s. The generator freshness checks ran (ord-words up to date, worked examples up to date, 140); no EPERM in this session.
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:static|E:typecheck-lint] `pnpm typecheck` passed. `pnpm lint` passed: 722 files, plus the 4 pre-existing informational bake-off suggestions (LandingBakeoffR3/R4A/R4C `useIndexOf`, l12/M3 `noUselessFragments`).
- [S:hpfetcher/implementation-worker-1|W:hpf-wmp8|H:escape-text|E:code-points] The test file came out of the Write tool with literal U+E000/U+E001 where escape text was intended. A chr()-built script rewrote both constants and both regexes as escape text: now 0 literal and 2+2 escape occurrences, the house style of `MathText.test.tsx`. Afterwards bankMath, MathText and questions tests passed (3 files, 64 tests), and lint and typecheck passed again. The full-suite run above preceded this rewrite, which changes no runtime value.
- No worker/, parser/ or dependency changes. No browser screenshot was taken (offline worker). JSDOM with the real KaTeX proves every prompt and option of the nine typesets without a KaTeX error or a raw command, but not the pixels.

## Render check (before → after)

host-2017-kvant1-KVA-018, prompt. Typesets the inequality with stacked fractions.
- before: `\dfrac{x}{3} - \dfrac{y}{3} < \dfrac{372}{12}  Kvantitet I: x  Kvantitet II: y`
- after: `⟦\dfrac{x}{3} - \dfrac{y}{3} < \dfrac{372}{12}⟧  Kvantitet I: x  Kvantitet II: y`

host-2020-kvant2-KVA-015, prompt. Both compound fractions are typeset.
- before: `Kvantitet I: \dfrac{\frac{1}{6}}{\frac{6}{1}}  Kvantitet II: \dfrac{\frac{6}{1}}{\frac{1}{6}}`
- after: `Kvantitet I: ⟦\dfrac{\frac{1}{6}}{\frac{6}{1}}⟧  Kvantitet II: ⟦\dfrac{\frac{6}{1}}{\frac{1}{6}}⟧`

host-2024-kvant1-XYZ-002, prompt plus options B and C. Shows √3 · x = 6, 3√2 and 2√3; A `2` and D `4` stay as prose.
- prompt: `\sqrt{3} \cdot x = 6  Vilket värde har x?` → `⟦\sqrt{3} \cdot x = 6⟧  Vilket värde har x?`
- B: `3\sqrt{2}` → `⟦3\sqrt{2}⟧`
- C: `2\sqrt{3}` → `⟦2\sqrt{3}⟧`

host-ver1-2019-kvant1-XYZ-009 and host-ver2-2019-kvant1-XYZ-009, prompt (identical). Shows ¼ as a fraction.
- before: `Cirkeln A har radien 3 cm, och dess area är \frac{1}{4} av arean av cirkeln B. Hur stor radie har cirkeln B?`
- after: `Cirkeln A har radien 3 cm, och dess area är ⟦\frac{1}{4}⟧ av arean av cirkeln B. Hur stor radie har cirkeln B?`

var-2018-1-kvant2-KVA-022, prompt. Shows √5 · √9 = 45^x, with the exponent raised.
- before: `\sqrt{5} \cdot \sqrt{9} = 45^{x} Kvantitet I:\t 0,5 Kvantitet II:\t x`
- after: `⟦\sqrt{5} \cdot \sqrt{9} = 45^{x}⟧ Kvantitet I:\t 0,5 Kvantitet II:\t x`

var-2022-2-kvant1-XYZ-006, prompt. Options were already delimited and are unchanged.
- before: `Vad är medelvärdet av \frac{1}{3} och \frac{1}{5}?`
- after: `Vad är medelvärdet av ⟦\frac{1}{3}⟧ och ⟦\frac{1}{5}⟧?`

var-2024-kvant2-XYZ-008, options A–D. Shows (12 + π/2) cm² and so on, with an upright unit.
- A: `\left(12+\dfrac{\pi}{2}\right)\,\text{cm}^{2}` → `⟦\left(12+\dfrac{\pi}{2}\right)\,\mathrm{cm}^{2}⟧`
- B: `\left(12+\dfrac{\pi}{4}\right)\,\text{cm}^{2}` → `⟦\left(12+\dfrac{\pi}{4}\right)\,\mathrm{cm}^{2}⟧`
- C: `\left(16-\dfrac{\pi}{2}\right)\,\text{cm}^{2}` → `⟦\left(16-\dfrac{\pi}{2}\right)\,\mathrm{cm}^{2}⟧`
- D: `(16-\pi)\,\text{cm}^{2}` → `⟦(16-\pi)\,\mathrm{cm}^{2}⟧`

var-2026-kvant1-XYZ-012, prompt plus options B–D; A `1` stays as prose.
- prompt: `Vilket svarsalternativ motsvarar \frac{2\sqrt{3}}{3\sqrt{2}}?` → `Vilket svarsalternativ motsvarar ⟦\frac{2\sqrt{3}}{3\sqrt{2}}⟧?`
- B: `\frac{\sqrt{3}}{6}` → `⟦\frac{\sqrt{3}}{6}⟧`
- C: `\sqrt{\frac{2}{3}}` → `⟦\sqrt{\frac{2}{3}}⟧`
- D: `\sqrt{\frac{3}{2}}` → `⟦\sqrt{\frac{3}{2}}⟧`

## Follow-ups (found, not fixed: outside the nine or the write set)

1. host-2020-kvant1-XYZ-010 prompt `Vad är (2^{4} + 1)(2^{2} + 1)(2^{2} - 1)?` has raw `^{…}` outside delimiters, so it renders as raw `2^{4}`. The same #70 empty-delimiter script wrote it. The invariant does not catch it because it contains no backslash command. Fix: wrap the expression.
2. var-2022-2-kvant1-XYZ-010 option D, `⟦⟦\frac{x}{x}⟧_{2}⟧ ⟦\frac{x-3}{x}⟧ ⟦\frac{1}{x}⟧`, nests delimiters (a parser stacked-fraction artifact), so `_{2}` and a stray closer show as prose. It needs a PDF check.
3. Explanations: 12 explanations (27 strings) in `app/public/explanations`, identical in `data/explanations`, have a command outside delimiters. Some are learner-visible `pregrade_tactic.move` text, e.g. var-2024-kvant2-XYZ-008 `multiplicera \pi r^{2} med (vinkel/360°)` and host-2016-kvant2-XYZ-008 `Addera \frac{1}{x} + \frac{1}{y} …`. Some are internal `_meta` notes. A sibling invariant over explanation strings is the natural next step.
4. The main checkout's untracked `data/parsed/*.json` (Jul 2–8) is a stale mixed snapshot. Three of the nine questions equal HEAD's broken served text, and six are pre-repair garbled parser output; all nine files differ from HEAD. Running `sync-dataset.sh` from there would regress the served bank. Not touched.
5. `scripts/fix_quant_blockers_v2.py`, `fix_quant_blocker_subset.py` and `fix_xyz_009_dropped_fraction.py` still define empty `E0`/`E1`. They are one-shot and target pre-repair text, but they should not be reused as templates.

### Playbook gotcha proposal

2026-11-03: private-use characters do not survive Write/Edit payloads predictably. In this session the same intended Python/TS escape for U+E000 came out three ways:
- as a literal U+E000 in the test file and in 10 of 13 scratch scripts;
- as the intended escape text in the other 3 scripts and in this worklog;
- in 2026-05, as nothing at all (three fix scripts with empty delimiter constants).

Terminal and Read output hide these characters, so no outcome is visible by eye. Rules:
- In scripts, build the characters with `chr(0xE000)`/`chr(0xE001)`.
- When source must hold escape text, post-process with a script that writes `chr(92) + "uE000"`.
- Verify every write by code-point count.

## Handoff

- Delivery: 9 bank files + `app/src/data/bankMath.test.ts` + this worklog. All are staged and uncommitted:
  - `git add` of exactly these 11 paths succeeded.
  - `git diff --cached --stat`: 11 files; the nine bank files account for 17 insertions and 17 deletions.
  - `git diff --cached --check` is clean.
  - The pre-existing untracked dotfiles at the worktree root are left unstaged. HEAD remains `bd59f80`.
- Bead tooling: `gc bd show` failed because its lock file is on a read-only path in this sandbox (`proxy.lock: read-only file system`). The native `bd` from the role protocol works, so bead reads and updates use it.
- Needs coordinator: commit, then an independent exact-head review. Optionally run a real-browser look at the nine questions in the Folio+ and classic drills. The two host-2019 questions are excluded from the pool, so view them directly.
