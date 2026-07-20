# ELF anti-plagiarism verification — originality of generated English passages

ELF has the worst rights exposure of all sections: authentic passages are
adapted from *published English media* (The Economist ×12, New Scientist ×10,
History Today ×7, Scientific American ×10 … — see corpus-analysis.md §4), so a
generated passage has TWO ways to fail:

1. **Corpus reconstruction** — echoing a UHR/source passage we trained the
   blueprints on.
2. **Web reconstruction** — independently converging on a published article
   (the model has read The Economist too). A passage that reproduces a famous
   text it never "saw" in our corpus is still plagiarism in effect.

Structure is not copyrightable; expression is. Blueprints deliberately carry
only structure (formats, bands, trap mechanics, stem formulas). Verification
must prove the *expression* is new. Three tiers, all must pass, in order of
cost.

## Tier 1 — corpus n-gram screen (local, deterministic, every candidate)

Compare the candidate against **all real ELF contexts** (140 blocks) plus,
cheaply since it's the same corpus format, LÄS/ORD contexts.

- Normalize: lowercase, strip punctuation, collapse whitespace.
- **Hard fail: any shared 8-gram** with any corpus passage (8 content tokens
  in a row is far beyond formulaic-English collision; stock phrases like
  "at the end of the day" are ≤5-grams).
- **Soft fail: shared 5-gram density > 2 per 1000 words** after subtracting a
  stoplist of the corpus's own most frequent 5-grams (formulaic frames).
- **Fuzzy layer**: winnowing/MinHash fingerprint (k=5 shingles, Jaccard) —
  reject candidate–passage pairs with **similarity > 0.06**; corpus
  passage-to-passage baseline should be measured first and the threshold set
  at baseline p99 (distinct real articles are the natural null distribution).
- **Topic-level check** (blueprint time, not text time): candidate topic must
  not be a specific-entity match to a corpus passage topic (no generated
  "Moomin merchandise" passage because host-2024 used Moominland; category
  overlap like "another history-of-medicine piece" is fine and inevitable).

Implementation note: pure stdlib, ~100 lines; lives beside
`scripts/corpus_stats.py` when the generation phase starts.

## Tier 2 — web originality probe (per passage that survives Tier 1)

The candidate must not reconstruct any published text. Practical probe given
our tooling (search MCP available in-session; no Turnitin):

- Extract the candidate's **8 least-probable distinctive phrases** (5–8
  tokens each: proper-noun collocations, unusual metaphors, statistic+noun
  frames — the phrases a real article would own).
- Exact-phrase web search each (quoted query). **Hard fail: any exact hit** on
  a phrase ≥6 tokens. Investigate any hit on 5-token phrases (idiom vs echo).
- Search the candidate's title + topic entities; skim top hits; **fail if any
  single published article covers the same specific angle with the same
  invented-sounding details** (convergence risk is highest for science
  journalism, where real articles saturate popular topics).
- Named entities in the passage must be verifiably **fictional**: invented
  researchers, invented studies, invented publications. A real person's name
  attached to an invented quote is an automatic fail (defamation risk, not
  just copyright). Whitelist: uncontested historical facts and public figures
  in history passages, but their *quotes* must be either genuine-and-ancient
  or clearly absent.

Thresholds are deliberately paranoid because the cost of a false positive is
one regeneration, while the cost of a false negative is shipping a derivative
of a copyrighted article on the launch path.

## Tier 3 — model-generation hygiene + human spot pass

- **Prompt hygiene**: generation prompts receive blueprints ONLY — never a
  source passage, never a source title/byline, never "in the style of The
  Economist" (style-of-a-genre is fine: "analytic weekly-magazine
  commentary"). Fictional-source fields in the blueprint are invented at
  blueprint time, so the generator cannot anchor on real mastheads.
- **Self-check pass**: a second model call, given the candidate and asked
  "does this reconstruct any specific published article you know? name it" —
  cheap, catches famous-text convergence (the model recognizing its own
  memorized sources) that phrase search can miss when wording drifts.
- **Human spot pass** (owner or delegate): 100% of passages before launch
  while volume is small (the section needs ~8 passages per generated sitting);
  sample-based only after the pipeline has a track record.

## Recordkeeping

Every accepted passage stores an originality dossier next to the item:
Tier-1 max-similarity score + nearest corpus passage id, Tier-2 phrases
searched + zero-hit confirmation date, Tier-3 self-check output. If a rights
question ever surfaces, the dossier is the evidence that originality was
verified at creation time, not asserted after the fact.

## Known limits (honest)

- Web search cannot see paywalled archives verbatim; Tier 2 catches phrase
  reuse only where an indexed copy exists. The mitigation is Tier 3 prompt
  hygiene (the model never sees a source text in-context) plus the
  self-check.
- N-gram thresholds (8-gram hard, 0.06 Jaccard) are principled defaults, not
  yet calibrated: the corpus passage-to-passage baseline measurement is the
  first task of the generation phase and may tighten them.
- Paraphrase-level plagiarism (same argument, new words, of one specific
  article) is not mechanically detectable; the topic-novelty rule at
  blueprint time is the real defense — generated topics are invented, not
  sourced from any article.
