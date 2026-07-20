# G-SPRÅK — native-register Swedish audit (language gate, LÄS only, 3 independent votes)

Adversarial brief: **find any construction a native Swedish writer of
edited sakprosa would not produce.** The passage will be read by native
speakers preparing for a national exam whose authentic texts are edited
Swedish from real publications. One off-native sentence breaks the spell and
the product's credibility. Assume the text is guilty until you have failed
to convict it.

Calibration anchor: this project's landing-copy review caught defects like
*"slipen"* (non-word where *slipningen/sliprörelsen* was meant) and *"bokför
sig självt"* (an English "books itself" calque no native would write). That
is the depth of scrutiny required — defects that Google Translate quality
checks miss but any native copy editor catches instantly.

## Contamination rule

Input is the passage plus questions/options text ONLY. No key rationale, no
other verdicts, no `_seed`, no knowledge of whether other votes exist or
what they said. Each of the 3 votes is a fresh agent.

## Input (pasted by the orchestrator)

- `candidate_id`, `vote` (1–3)
- Title, passage, and all question prompts + option texts (options are
  student-visible Swedish too — they are in scope)

## Procedure — hunt in this order, sentence by sentence

1. **Non-words and wrong derivations** — words that do not exist or are
   derived wrongly (the *slipen* class); wrong compound joints
   (foge-s errors: *arbetsmiljöarbete* vs *arbetsmiljösarbete*); wrongly
   split compounds (*en långhårig sjuksköterska* vs *en lång hårig …*).
2. **Calques and translationese** — English structure wearing Swedish words:
   *spendera tid* (för *tillbringa/ägna tid*), *ta plats* for "take place"
   (för *äga rum*), *bokför sig självt*-style reflexives, *icke-* stacking,
   overuse of *av*-genitives where an s-genitive or compound is idiomatic,
   *det är* + adjective + *att*-clause chains mirroring "it is X that",
   English punctuation habits (serial comma, colon usage).
3. **Word order** — V2 violations in main clauses; adverb placement in
   subordinate clauses (BIFF: *eftersom forskarna **inte** har hävdat*, never
   *eftersom forskarna har **inte** hävdat*); *inte/alltid/ofta* placed as in
   English; fronting that no native would choose.
4. **Agreement and form** — en/ett gender slips, adjective agreement
   (*ett stort hus*, *huset är stort*, *de stora husen*), definiteness
   (double definiteness: *det stora huset*, never *det stora hus*),
   pronoun case, *sin/sitt/sina* vs *hans/hennes/deras* reflexive errors.
5. **Register coherence** — the passage must hold one register: edited
   sakprosa (tidskrift/populärvetenskap/essä). Convict on: sudden
   colloquialisms (*typ*, *kul*, *jättemånga*), talshow-Swedish, direct
   reader address (*du kanske undrar…*), bureaucratese in an essay, stiff
   formal words (*erhålla*, *tillhandahålla*) in journalistic prose, tone
   lurches between paragraphs.
6. **Idiomatic temperature** — the hardest class: every word is correct but
   the phrase is off (*göra en poäng av* where *poängtera* is natural;
   collocation misses like *stark regn* for *kraftigt regn*). If you would
   pause on it as a copy editor, record it.

For every conviction record a **verbatim quote**, the class (1–6), why it is
off-native, and what a native writer would have written instead.

## Severity — decide per finding

- `lethal` — a native writer would not produce this: non-words, grammatical
  errors (agreement, word order, reflexives), unmistakable calques.
- `major` — off-register or unidiomatic but grammatical: register breaks,
  class-6 temperature misses, borderline calques.
- `minor` — taste-level; a copy editor might change it, might not.

## Output — exactly this JSON, nothing else

```json
{
  "candidate_id": "…",
  "gate": "G-SPRAK",
  "target": "passage",
  "vote": 1,
  "verdict": "pass | kill | flag",
  "findings": [
    {"severity": "lethal | major | minor", "quote": "<verbatim>", "note": "class N: why off-native; native alternative: '…'"}
  ],
  "executed_by": "<agent/model tag>"
}
```

Verdict mapping (apply it yourself, per vote):

- Any `lethal` finding → `kill`.
- Only `major`/`minor` findings → `flag`.
- No findings → `pass`.

Aggregation across the 3 votes is the orchestrator's job (2+ kill votes =
dead; 1 kill vote = flagged for adjudication). You vote alone; never soften
a conviction because it "might just be you" — the vote structure exists so
you don't have to.

## Calibration

Must kill the planted-Swedish-defect seeds (calques, BIFF violations,
register breaks — each vote is expected to find them) and pass authentic
passages. Authentic texts are real edited Swedish: convictions against them
are eval failures unless the quote is a legitimate archaism from an older
source text (record it, protocol adjudicates).
