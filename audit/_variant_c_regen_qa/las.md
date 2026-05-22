# Variant-C LÄS regen — QA pass

**Scope:** 61 LÄS entries regenerated under recipe `variant-c-regen-wave`. Sample n=15 (seed 42).

**Method:** For each qid, read corpus prompt/options/answer/context and the regenerated explanation. Checked passage grounding, answer alignment, distractor reasoning, language.

## Sample

```
var-2019-verb2-LÄS-020   ans D
host-2023-verb2-LÄS-019  ans B
host-2013-verb2-LÄS-018  ans B
var-2024-verb2-LÄS-012   ans B
var-2013-verb2-LÄS-019   ans B
var-2013-verb2-LÄS-017   ans A
var-2013-verb2-LÄS-016   ans D
host-2023-verb2-LÄS-020  ans D
var-2025-verb2-LÄS-017   ans D
host-2023-verb2-LÄS-018  ans A
var-2023-verb2-LÄS-018   ans D
var-2024-verb2-LÄS-017   ans A
var-2018-1-verb2-LÄS-018 ans A
host-2023-verb2-LÄS-017  ans C
var-2019-verb2-LÄS-017   ans A
```

## Verdicts

### Blocker (0)
None. No reversed answers, no misquotes, no language drift, no fabricated passage content.

### Weak (0)
None reached "weak" threshold. The two minor wobbles below are noted under patterns; they don't merit reauthoring.

### Clean (15)
All 15 entries pass on the four QA dimensions.

| qid | answer | step 6 letter | grounding |
|---|---|---|---|
| var-2019-verb2-LÄS-020 | D | D | quotes "relateras till fler geografiska kontexter än den nordiska" verbatim |
| host-2023-verb2-LÄS-019 | B | B | quotes Keller "Vi tror inte att systemet är stabilt" + the kin-selection follow-up verbatim |
| host-2013-verb2-LÄS-018 | B | B | quotes "båda föräldrarna ... lika ansvar ... överordnat enhetligt föräldraskap" verbatim |
| var-2024-verb2-LÄS-012 | B | B | quotes "anmärkningsvärt att en redovisningskonsult inte följer ... i sitt eget aktiebolag" verbatim |
| var-2013-verb2-LÄS-019 | B | B | quotes "Havsisen i sig isolerar ytvattnet från atmosfärens kyla" verbatim |
| var-2013-verb2-LÄS-017 | A | A | quotes "Mycket närsalter tillförs också med det vatten som transporteras upp från Atlanten" verbatim |
| var-2013-verb2-LÄS-016 | D | D | quotes "Jag utgår i mitt svar ifrån att det på din arbetsplats inte finns några kollektivavtalsregler" verbatim |
| host-2023-verb2-LÄS-020 | D | D | quotes Kulmuni's three-outcomes closing line verbatim |
| var-2025-verb2-LÄS-017 | D | D | enumerates and matches the four trends against actual paragraph allocation |
| host-2023-verb2-LÄS-018 | A | A | quotes "Detta ställer begreppet 'art' på ända" + the horse/donkey definition |
| var-2023-verb2-LÄS-018 | D | D | quotes "Han följer dock inte upp denna viktiga aspekt" about naturgeografi |
| var-2024-verb2-LÄS-017 | A | A | quotes "det var för teatern som rekvisita ... skapades" + the försörjningskedjan |
| var-2018-1-verb2-LÄS-018 | A | A | quotes "ansluter sig Nora till en inflytelserik trend ... dessvärre ..." verbatim |
| host-2023-verb2-LÄS-017 | C | C | quotes "ifrågasätter evolutionens grundlagar" + "unikt för människan" |
| var-2019-verb2-LÄS-017 | A | A | quotes "gör gemensam sak i att synliggöra ... en fråga om politik och makt" |

## Patterns (positive)

1. **Verbatim grounding is the norm, not the exception.** Every single sampled entry quotes the exact load-bearing sentence from the passage in either `solution_path` or step 2/3, in Swedish quote marks. This is the headline win versus paraphrase-only LÄS rationales.

2. **Step 6 always names the corpus letter.** Slutsats explicitly states "Svar B" / "Svar D" etc., matching the corpus `.answer` in 15/15 cases.

3. **Distractor `why_wrong` points to specific reasoning errors, not vague gestures.** Examples:
   - var-2024-LÄS-012 distractor C: "Texten säger uttryckligen att åtgärder PÅGÅR ('bolaget har numera förstärkt sina interna resurser ...')" — direct refutation by quote.
   - host-2023-LÄS-020 distractor A: "hon räknar upp tre alternativa utfall — inte väljer ett" — refutes by referencing the structure of Kulmuni's citat.
   - var-2019-LÄS-017 distractor C: "Det är ETT bidrag av många — inte vad som förenar antologin" — refutes by scope.

4. **Pregrade tactic is a real tactic, not a slogan.** "Anmärkningsvärt-flaggan", "Subjunktions-jakten", "Anslutningsverbet" — each names a textual cue the reader can actually scan for during a timed attempt. ADHD-PI friendly.

5. **Swedish throughout.** Every field (solution_path, steps, distractors, technique, pitfall, pregrade_tactic) is Swedish across 15/15. No English leaks.

6. **Tier discipline.** `essential` vs `detail` is used meaningfully: vocabulary stubs (e.g. "närsalter & primärproduktion", "altruism") and side-evidence verifications are tagged `detail`, which keeps the essential trail tight at ~5 steps.

## Patterns (minor, not blockers)

1. **var-2025-LÄS-017 (the four-trends question) leans on "räkna utrymme" rather than a direct quote.** This question genuinely doesn't have one quotable sentence — the answer comes from observing which trends get developed and which are mentioned once. The explanation handles this honestly by listing what the text actually does with each trend (content/skills debate for trend 4, Seixas + danska fördjupningsprojekt for trend 1, single-sentence mention for trends 2 and 3). It works, but it's the one entry where grounding is "structural" rather than "quotable." Acceptable; just worth flagging that LÄS occasionally requires aggregating across paragraphs and the current rationale handles that without faking a quote.

2. **var-2018-1-LÄS-018 distractor C wording is slightly soft.** The why_wrong for "vidareutvecklar deras tankar" relies on the verb distinction "ansluter sig" vs "vidareutvecklar". That's a valid micro-distinction but a sharp student could push back that "ansluter sig till en inflytelserik trend" does imply *some* development. The rationale stands because the recensent never says Nora extends the work, but the distinction is finer than usual. Not a blocker — just noting the lightest distractor refutation in the sample.

3. **One typographical artifact carried over from corpus.** "gemen- samt" appears in host-2013-LÄS-018 option B (PDF hyphenation) and the explanation echoes it as "gemen- samt" when quoting. This is the corpus's problem, not the regen's — the regen correctly mirrors the option text. Flag only because it's a reminder that LÄS option strings still contain soft-hyphen artifacts from the parser; if those get cleaned upstream, the regen text would update on next run.

## Recommendation

**Ship as-is.** The variant-c-regen-wave recipe is performing at the quality bar set by the pilot. Passage grounding is the single biggest improvement over earlier LÄS rationales: verbatim quotes with Swedish quotation marks, located in the right paragraph, named in the right step. Step 6 reliably matches the corpus answer letter. Distractor reasoning consistently points to *where* in the passage the wrong reading breaks down.

No blockers in the sample. If the remaining 46 entries follow the same recipe (and the `_meta.recipe` stamp suggests they do), the wave can be merged without further QA gating.

**Sample qids file paths (for cross-reference):**
- Corpus: `/home/loucmane/dev/hpfetcher/app/public/data/{exam_id}.json`
- Explanations: `/home/loucmane/dev/hpfetcher/app/public/explanations/{exam_id}.json`
- This audit: `/home/loucmane/dev/hpfetcher/audit/_variant_c_regen_qa/las.md`
