# Worklog — hpf-qr0p.51.12

## Findings
- 2026-11-04: Clean assigned worktree at a5772305dca188e37bdaa65e75106d6a5b977241. No molecule controls this bead. Dependencies are installed.
- The seven canonical catalogs contain 180 entries: KVA 54, XYZ 59, NOG 25, LÄS 8, ELF 8, MEK 16, DTK 10. ORD and prerequisites are outside this content scope.

## Decisions
- Author original, short transfer questions using the specific rule and typical error of each catalog entry; all answers use zero-based indices.
- Keep the catalog immutable and the synchronous lookup pure, with no request or mutable loading state. No UI changes.
- Apply expert-language-review and pedagogy-review per item. The bead explicitly requests retrieval, so the pedagogy checklist's passage-only criterion is adapted to rule application; reading items contain their own short evidence.
- Use escaped private-use math delimiters and U+2212 minus signs. Canonical and served JSON must be byte-identical.
- Deliver uncommitted work and defer the bead under its accepted delivery contract.

## Progress
- Tests authored before implementation: exact catalog coverage, unique options/index bounds, fresh prompts versus all served exams, balanced/renderable math, Swedish number typography and pure lookup behavior.
- Red: `pnpm test src/data/lockIn.test.ts --maxWorkers=2` failed because `./lockIn` did not exist (one suite failed; 2026-11-04).
- Authored all 180 items using each catalog's pattern/rule and worked examples as context, with new prompts. JSON serialized using Python json.dumps and explicit escaped U+E000/U+E001; served twin written from the same bytes. Correct option positions shuffled deterministically.
- Existing worked examples sometimes conflict with their own rule or calculation (for example KVA-TRAP-041 treats an approximate equality as exact). No source catalog edits; new answers derived independently.

## Handoff
- Implementation and verification in progress.

## Item review — 2026-11-04

Author self-review, not an independent merge review. All 180 prompts, options and explanations were checked against both skill hunt lists. The table gives a separately worked answer for every candidate; answer indices are zero-based.

Shared per-unit language fields: register_authenticity = natural, brief Swedish practice copy (ELF includes short original English excerpts); answer_key_language = all three alternatives grammatically fit and the key is unambiguous; findings = [] after the corrections recorded below. Reviewed calques/collocations, passive infinitives, BIFF order, agreement, derivation, register and framing. English excerpts were checked for interference, collocations, tone and spelling variety. Math uses decimal commas and U+2212 minus signs.

Shared per-unit pedagogy fields: findings = [] after corrections; construct_validity = one rule application, or a short self-contained reading/word-context task; both distractors checked against the premise, with the catalog-specific error named in why. Ten seconds is the authoring target, not a measured user result. Reading questions require the supplied excerpt; the other sections deliberately test retrieval under this bead, superseding the exam-review skill’s passage-only criterion.

Corrections before final review:
- MEK-RULE-012: original distractor "lösryckning" was filler (pedagogy: minor/distractor); replaced with "suspension", another mixture term that does not describe bronze. Exactly one key remains: legering. Re-gated the answer and both distractors.
- MEK-RULE-013: inserting "avlägsnade oss" or "förflyttade oss" before "vi" produced bad reflexive word order (language: major/grammar). Recast as three complete, grammatical paraphrases; the everyday version preserves the child’s voice, the two formal versions do not. Re-gated key and distractors.
- KVA-TRAP-028: "Alla kulor dras lika sannolikt" was stiff (language: minor/collocation); changed to "Varje kula har samma chans att dras".
- KVA-TRAP-052 and XYZ-TRAP-041: stated areas explicitly to avoid ambiguous dimension phrasing. DTK-TACTIC-001: supplied currency units. Keys unchanged and calculations rechecked.
- XYZ-TRAP-059: the delimiter guard caught the number of tosses written as a word in a math prompt; changed it to delimited math. The independent complement calculation remains 3/4.

| candidate_id | section | language_verdict | pedagogy_verdict | answer index and key | Independent answer verification |
|---|---|---|---|---|---|
| KVA-TRAP-001 | KVA | PUBLISH_READY | SOUND | 2: 5 och −5 | 5² = (−5)² = 25. |
| KVA-TRAP-002 | KVA | PUBLISH_READY | SOUND | 1: −7 | b = −a = −7. |
| KVA-TRAP-003 | KVA | PUBLISH_READY | SOUND | 1: Nej, b är fritt. | a = 31 allows b = 20 or b = 40. |
| KVA-TRAP-004 | KVA | PUBLISH_READY | SOUND | 2: Nej, sidorna kan vara 2 och 8 cm. | 2(2 + 8) = 20; longest side 8, not 5. |
| KVA-TRAP-005 | KVA | PUBLISH_READY | SOUND | 1: Nej, till exempel ger k=\frac12 värdet 3. | 6 × 1/2 = 3 < 6. |
| KVA-TRAP-006 | KVA | PUBLISH_READY | SOUND | 0: Det går inte att avgöra. | Intersection can be 0 through 12; 6 is only one possible overlap. |
| KVA-TRAP-007 | KVA | PUBLISH_READY | SOUND | 1: Ett. | Second equation = 2 × first. |
| KVA-TRAP-008 | KVA | PUBLISH_READY | SOUND | 1: Nej, den kan också vara 100^\circ. | 40° can be apex; if base, apex = 180° − 80° = 100°. |
| KVA-TRAP-009 | KVA | PUBLISH_READY | SOUND | 1: Inget bestämt värde. | x = y = 0 and x = y = 1 both satisfy the premise. |
| KVA-TRAP-010 | KVA | PUBLISH_READY | SOUND | 2: Nej, talen kan vara 6 och 10. | Sum = 16; (6, 10) is a counterexample to both being 8. |
| KVA-TRAP-011 | KVA | PUBLISH_READY | SOUND | 2: Det behövs också ett totalantal. | Totals 20 and 40 give 5 and 10 blue balls. |
| KVA-TRAP-012 | KVA | PUBLISH_READY | SOUND | 0: Nej, tiden kan vara både kortare och längre. | 60/90 h = 40 min; 60/60 h = 60 min, crossing 50. |
| KVA-TRAP-013 | KVA | PUBLISH_READY | SOUND | 2: Negativt. | Five negative factors give a negative product. |
| KVA-TRAP-014 | KVA | PUBLISH_READY | SOUND | 1: ka>kb | a < b and k < 0 imply ka > kb. |
| KVA-TRAP-015 | KVA | PUBLISH_READY | SOUND | 2: −3 | −3 lies to the right of −8. |
| KVA-TRAP-016 | KVA | PUBLISH_READY | SOUND | 0: Den är inte bestämd. | y = 4x + m permits any intercept m. |
| KVA-TRAP-017 | KVA | PUBLISH_READY | SOUND | 1: −\frac13 | 3 × (−1/3) = −1; −3 would give −9. |
| KVA-TRAP-018 | KVA | PUBLISH_READY | SOUND | 1: (\frac12)^2 | 1/4 > 1/8. |
| KVA-TRAP-019 | KVA | PUBLISH_READY | SOUND | 1: a−b | a > b implies a − b > 0 and b − a < 0. |
| KVA-TRAP-020 | KVA | PUBLISH_READY | SOUND | 2: 4 | (2r)²h/(r²h) = 4. |
| KVA-TRAP-021 | KVA | PUBLISH_READY | SOUND | 1: 2 | Sorted middle = 2; mean = 12/3 = 4. |
| KVA-TRAP-022 | KVA | PUBLISH_READY | SOUND | 2: De är lika stora. | Distances to x = 3 are 1 and 1; both f-values are 2. |
| KVA-TRAP-023 | KVA | PUBLISH_READY | SOUND | 2: \frac35 | 3/5 = 21/35 > 20/35 = 4/7. |
| KVA-TRAP-024 | KVA | PUBLISH_READY | SOUND | 0: 17 | 17(21 − 20) = 17. |
| KVA-TRAP-025 | KVA | PUBLISH_READY | SOUND | 0: 135 kr | (200 − 50) × 0,9 = 135; reverse order gives 130. |
| KVA-TRAP-026 | KVA | PUBLISH_READY | SOUND | 2: 0{,}7 m | 0,7 m = 70 cm > 65 cm. |
| KVA-TRAP-027 | KVA | PUBLISH_READY | SOUND | 1: 5 cm | \|7 − 4\| < c < 7 + 4; only 5 is strictly inside. |
| KVA-TRAP-028 | KVA | PUBLISH_READY | SOUND | 2: \frac38 | 3 favourable / 8 total = 3/8. |
| KVA-TRAP-029 | KVA | PUBLISH_READY | SOUND | 0: \frac7{12} | 7/12 > 7/13 because both denominators and numerator are positive. |
| KVA-TRAP-030 | KVA | PUBLISH_READY | SOUND | 2: De har samma medelhastighet. | 3/0,5 = 6 and 6/1 = 6 km/h. |
| KVA-TRAP-031 | KVA | PUBLISH_READY | SOUND | 1: 6 år | Subtracting 2 from both ages preserves difference 6. |
| KVA-TRAP-032 | KVA | PUBLISH_READY | SOUND | 2: x=2 eller x=5 | Each factor can vanish: roots 2 and 5. |
| KVA-TRAP-033 | KVA | PUBLISH_READY | SOUND | 1: Nej, omkretsarna är 16 och 20 cm. | Areas both 16; perimeters 4 × 4 = 16 and 2(2 + 8) = 20. |
| KVA-TRAP-034 | KVA | PUBLISH_READY | SOUND | 1: \frac1x<\frac16 | x > 6 > 0 implies 1/x < 1/6. |
| KVA-TRAP-035 | KVA | PUBLISH_READY | SOUND | 2: 0 | f(6) = 6 × 0 = 0; f(0) = 0 × (−6) = 0. |
| KVA-TRAP-036 | KVA | PUBLISH_READY | SOUND | 2: 4 | x ≥ 1 gives 2y ≤ 8; y = 4 works with x = 1. |
| KVA-TRAP-037 | KVA | PUBLISH_READY | SOUND | 2: 6 och −6 | Distance 6 from zero gives x = ±6. |
| KVA-TRAP-038 | KVA | PUBLISH_READY | SOUND | 1: De är lika stora. | 16 × 25/100 = 25 × 16/100 = 4. |
| KVA-TRAP-039 | KVA | PUBLISH_READY | SOUND | 0: 11 | 10 − (3 − 4) = 10 − (−1) = 11. |
| KVA-TRAP-040 | KVA | PUBLISH_READY | SOUND | 2: 14 | 2 + 12 = 14; left-first would give 20. |
| KVA-TRAP-041 | KVA | PUBLISH_READY | SOUND | 0: 2 | √25 − √9 = 5 − 3 = 2, not √16. |
| KVA-TRAP-042 | KVA | PUBLISH_READY | SOUND | 2: 2\sqrt5 | √20 = √(4 × 5) = 2√5; 4,5 is only an approximation. |
| KVA-TRAP-043 | KVA | PUBLISH_READY | SOUND | 2: 1 | 7⁰ = 1 since the base is nonzero. |
| KVA-TRAP-044 | KVA | PUBLISH_READY | SOUND | 0: 3^8 | (3²)⁴ = 3⁸; addition would produce 3⁶. |
| KVA-TRAP-045 | KVA | PUBLISH_READY | SOUND | 1: 16 | (−4) × (−4) = 16. |
| KVA-TRAP-046 | KVA | PUBLISH_READY | SOUND | 0: Ja, eftersom \pi>3. | Area = π × 1² = π > 3. |
| KVA-TRAP-047 | KVA | PUBLISH_READY | SOUND | 1: 10\,\% av 90 kr | 0,10 × 90 = 9 > 8 = 0,20 × 40. |
| KVA-TRAP-048 | KVA | PUBLISH_READY | SOUND | 2: 24 | 12 × 2 = 24; adding the last difference would give 18. |
| KVA-TRAP-049 | KVA | PUBLISH_READY | SOUND | 1: 36 km/h | 10 × 3600/1000 = 36 km/h. |
| KVA-TRAP-050 | KVA | PUBLISH_READY | SOUND | 2: \frac12 | √9 = 9^(1/2), hence x = 1/2. |
| KVA-TRAP-051 | KVA | PUBLISH_READY | SOUND | 0: 65^\circ | Alternate angles between parallel lines are equal: 65°. |
| KVA-TRAP-052 | KVA | PUBLISH_READY | SOUND | 0: 16 cm² | 20 − 2² = 16. |
| KVA-TRAP-053 | KVA | PUBLISH_READY | SOUND | 2: 4 cm | r = d/2 = 8/2 = 4. |
| KVA-TRAP-054 | KVA | PUBLISH_READY | SOUND | 2: 4 | (12 + 7) − (8 + 7) = 4. |
| XYZ-TRAP-001 | XYZ | PUBLISH_READY | SOUND | 1: −2x+10 | −2x + (−2)(−5) = −2x + 10. |
| XYZ-TRAP-002 | XYZ | PUBLISH_READY | SOUND | 1: x=5 | 3x = 19 − 4 = 15; x = 5. |
| XYZ-TRAP-003 | XYZ | PUBLISH_READY | SOUND | 2: x^2+5x+6 | x² + 3x + 2x + 6 = x² + 5x + 6. |
| XYZ-TRAP-004 | XYZ | PUBLISH_READY | SOUND | 2: 1 | 7 = 3 × 2 + m, so m = 1. |
| XYZ-TRAP-005 | XYZ | PUBLISH_READY | SOUND | 1: x>−3 | Division by −3 gives x > −3. |
| XYZ-TRAP-006 | XYZ | PUBLISH_READY | SOUND | 1: 8 | 12 − (8/2) = 12 − 4 = 8. |
| XYZ-TRAP-007 | XYZ | PUBLISH_READY | SOUND | 1: 11 | (−3)² + 2 = 9 + 2 = 11. |
| XYZ-TRAP-008 | XYZ | PUBLISH_READY | SOUND | 0: 0 och 4 | x(x − 4) = 0 gives x = 0 or 4. |
| XYZ-TRAP-009 | XYZ | PUBLISH_READY | SOUND | 2: −7 | Both roots ±7 exist; x < 0 chooses −7. |
| XYZ-TRAP-010 | XYZ | PUBLISH_READY | SOUND | 0: (x+2)(x+3) | 2 × 3 = 6 and 2 + 3 = 5. |
| XYZ-TRAP-011 | XYZ | PUBLISH_READY | SOUND | 1: 3x | gcd(6, 9) = 3; smallest shared x-exponent is 1. |
| XYZ-TRAP-012 | XYZ | PUBLISH_READY | SOUND | 0: x^2−16 | x² − 4² = x² − 16. |
| XYZ-TRAP-013 | XYZ | PUBLISH_READY | SOUND | 1: x^2+6x+9 | x² + 2 × x × 3 + 3². |
| XYZ-TRAP-014 | XYZ | PUBLISH_READY | SOUND | 2: 6=2x+x | Multiply all terms: 6 = 2x + x; x ≠ 0 specified. |
| XYZ-TRAP-015 | XYZ | PUBLISH_READY | SOUND | 0: x=\frac{y+8}4 | Divide both terms on the right: x = (y + 8)/4. |
| XYZ-TRAP-016 | XYZ | PUBLISH_READY | SOUND | 0: \frac12 | 2/6 + 1/6 = 3/6 = 1/2. |
| XYZ-TRAP-017 | XYZ | PUBLISH_READY | SOUND | 1: \frac56 | (2/3)(5/4) = 10/12 = 5/6. |
| XYZ-TRAP-018 | XYZ | PUBLISH_READY | SOUND | 1: 1+\frac6x | (x + 6)/x = 1 + 6/x; x ≠ 0 specified. |
| XYZ-TRAP-019 | XYZ | PUBLISH_READY | SOUND | 2: \frac58 | 5/8 = 15/24 < 16/24 = 2/3. |
| XYZ-TRAP-020 | XYZ | PUBLISH_READY | SOUND | 2: 0{,}4 | 0,5/100 × 80 = 0,4. |
| XYZ-TRAP-021 | XYZ | PUBLISH_READY | SOUND | 2: 180 kr | 150 × 1,2 = 180. |
| XYZ-TRAP-022 | XYZ | PUBLISH_READY | SOUND | 1: 99 kr | 100 × 1,1 × 0,9 = 99. |
| XYZ-TRAP-023 | XYZ | PUBLISH_READY | SOUND | 0: 8 | Five ratio parts; 20/5 = 4 per part; red = 8. |
| XYZ-TRAP-024 | XYZ | PUBLISH_READY | SOUND | 1: x=5 | xy + 2x = xy + 10 gives 2x = 10. |
| XYZ-TRAP-025 | XYZ | PUBLISH_READY | SOUND | 0: \frac{12}5 | 5x = 12; x = 12/5. |
| XYZ-TRAP-026 | XYZ | PUBLISH_READY | SOUND | 1: x^{12} | (x⁴)³ = x^(4 × 3) = x¹². |
| XYZ-TRAP-027 | XYZ | PUBLISH_READY | SOUND | 1: \frac32 | 4 = 2² and 8 = 2³; 2x = 3 gives 3/2. |
| XYZ-TRAP-028 | XYZ | PUBLISH_READY | SOUND | 2: \frac1{25} | 5^(−2) = 1/5² = 1/25. |
| XYZ-TRAP-029 | XYZ | PUBLISH_READY | SOUND | 1: 16 och −16 | (−2)⁴ = 16; −2⁴ = −(2⁴) = −16. |
| XYZ-TRAP-030 | XYZ | PUBLISH_READY | SOUND | 2: 8a^3 | (2a)³ = 2³a³ = 8a³. |
| XYZ-TRAP-031 | XYZ | PUBLISH_READY | SOUND | 2: 1{,}2\cdot10^6 | 3 × 4 × 10^(2 + 3) = 12 × 10⁵ = 1,2 × 10⁶. |
| XYZ-TRAP-032 | XYZ | PUBLISH_READY | SOUND | 0: 3\sqrt5 | √45 = √(9 × 5) = 3√5. |
| XYZ-TRAP-033 | XYZ | PUBLISH_READY | SOUND | 2: 2 | √36 − √16 = 6 − 4 = 2. |
| XYZ-TRAP-034 | XYZ | PUBLISH_READY | SOUND | 1: 5 | 5 × 2⁰ = 5 × 1 = 5. |
| XYZ-TRAP-035 | XYZ | PUBLISH_READY | SOUND | 1: 70^\circ | 180° − 50° − 60° = 70°. |
| XYZ-TRAP-036 | XYZ | PUBLISH_READY | SOUND | 0: 90^\circ | Total ratio 6; largest 3 × 180°/6 = 90°. |
| XYZ-TRAP-037 | XYZ | PUBLISH_READY | SOUND | 2: 70^\circ | Same-side interior sum 180°; 180° − 110° = 70°. |
| XYZ-TRAP-038 | XYZ | PUBLISH_READY | SOUND | 2: 115^\circ | Exterior angle = 35° + 80° = 115°; remaining interior = 65°. |
| XYZ-TRAP-039 | XYZ | PUBLISH_READY | SOUND | 1: 125^\circ | Opposite angles are equal: 125°; adjacent would be 55°. |
| XYZ-TRAP-040 | XYZ | PUBLISH_READY | SOUND | 2: 8 cm | Other leg² = 100 − 36 = 64; positive length 8. |
| XYZ-TRAP-041 | XYZ | PUBLISH_READY | SOUND | 2: 16 cm² | Disjoint areas 2 × 3 + 2 × 5 = 6 + 10 = 16. |
| XYZ-TRAP-042 | XYZ | PUBLISH_READY | SOUND | 2: 9\pi cm² | r = 6/2 = 3; area = 9π. |
| XYZ-TRAP-043 | XYZ | PUBLISH_READY | SOUND | 1: 8 | Three dimensions each double: factor 2³ = 8. |
| XYZ-TRAP-044 | XYZ | PUBLISH_READY | SOUND | 1: 5\sqrt2 cm | d² = 5² + 5² = 50, so d = 5√2. |
| XYZ-TRAP-045 | XYZ | PUBLISH_READY | SOUND | 2: 8 cm | Large/small scale = 6/3 = 2; corresponding side = 8. |
| XYZ-TRAP-046 | XYZ | PUBLISH_READY | SOUND | 0: 14 | (m − 1) + m + (m + 1) = 42; m = 14. |
| XYZ-TRAP-047 | XYZ | PUBLISH_READY | SOUND | 1: Alltid jämnt. | n + n = 2n is even. |
| XYZ-TRAP-048 | XYZ | PUBLISH_READY | SOUND | 0: 7 | 3 × 6 − 4 − 7 = 7. |
| XYZ-TRAP-049 | XYZ | PUBLISH_READY | SOUND | 0: 6 | Two central values 4 and 8; median = (4 + 8)/2 = 6. |
| XYZ-TRAP-050 | XYZ | PUBLISH_READY | SOUND | 0: \frac12 | After red removed: 2 red, 2 blue; probability 2/4. |
| XYZ-TRAP-051 | XYZ | PUBLISH_READY | SOUND | 0: 3 | (8 − 2)/(3 − 1) = 6/2 = 3. |
| XYZ-TRAP-052 | XYZ | PUBLISH_READY | SOUND | 1: 4 | (2 × 5 + 9) − (2 × 3 + 9) = 4. |
| XYZ-TRAP-053 | XYZ | PUBLISH_READY | SOUND | 1: 60 cm³ | 1 dm = 10 cm; 10 × 2 × 3 = 60 cm³. |
| XYZ-TRAP-054 | XYZ | PUBLISH_READY | SOUND | 1: 16 | 4 + (5 − 1) × 3 = 16. |
| XYZ-TRAP-055 | XYZ | PUBLISH_READY | SOUND | 2: 12 | A = 3B = 3 × 4 = 12. |
| XYZ-TRAP-056 | XYZ | PUBLISH_READY | SOUND | 2: 12 cm² | 6 × 4/2 = 12 cm². |
| XYZ-TRAP-057 | XYZ | PUBLISH_READY | SOUND | 1: 4 minuter | 1/8 + 1/8 = 1/4 tank/min; full tank in 4 min. |
| XYZ-TRAP-058 | XYZ | PUBLISH_READY | SOUND | 2: 0{,}003 | 0,3/100 = 0,003. |
| XYZ-TRAP-059 | XYZ | PUBLISH_READY | SOUND | 2: \frac34 | Four equally likely toss pairs; three include a crown: 3/4. |
| NOG-TRAP-001 | NOG | PUBLISH_READY | SOUND | 2: Nej, överlappningen är fri. | 30 total, 18 football, 10 piano permit overlaps 0 and 10. |
| NOG-TRAP-002 | NOG | PUBLISH_READY | SOUND | 0: Nej, x kan exempelvis vara 3 eller 4. | (x,y,z) = (3,5,5) and (4,4,6) both work. |
| NOG-TRAP-003 | NOG | PUBLISH_READY | SOUND | 0: Nej, summan kan variera. | (A,B) = (3,1) or (6,2); totals 4 and 8. |
| NOG-TRAP-004 | NOG | PUBLISH_READY | SOUND | 2: Nej, även 9 måste prövas. | Both initial candidates remain until ruled out; one witness is not uniqueness. |
| NOG-TRAP-005 | NOG | PUBLISH_READY | SOUND | 0: 2 | Intersection {2,4,6} ∩ {4,6,8} = {4,6}, size 2. |
| NOG-TRAP-006 | NOG | PUBLISH_READY | SOUND | 2: Nej, flera heltal är möjliga. | n = 12 and 13 both satisfy n > 11. |
| NOG-TRAP-007 | NOG | PUBLISH_READY | SOUND | 2: Nej, det gäller redan för triangeln. | Every triangle already obeys the angle sum; v = 30° or 60° still possible. |
| NOG-TRAP-008 | NOG | PUBLISH_READY | SOUND | 2: Ett. | Rearranging either produces a − b = 4; one relation. |
| NOG-TRAP-009 | NOG | PUBLISH_READY | SOUND | 0: Nej, samma skillnad upprepas. | Noor 10/Maja 15 and Noor 20/Maja 25 both work today and in 3 years. |
| NOG-TRAP-010 | NOG | PUBLISH_READY | SOUND | 0: Nej, utsagan gäller varje summa. | Half of any positive starting sum is 50%; no amount is selected. |
| NOG-TRAP-011 | NOG | PUBLISH_READY | SOUND | 0: Ja, det är 12 kr. | x + 5 = 17 gives x = 12, even in a hypothetical. |
| NOG-TRAP-012 | NOG | PUBLISH_READY | SOUND | 0: Nej, deras inbördes ordning är fri. | C = 1 allows (A,B) = (2,3) or (3,2). |
| NOG-TRAP-013 | NOG | PUBLISH_READY | SOUND | 2: A,B,C | B must be middle; A cannot be right; only A,B,C remains. |
| NOG-TRAP-014 | NOG | PUBLISH_READY | SOUND | 1: Grönt. | Red first and blue last leave green in the middle. |
| NOG-TRAP-015 | NOG | PUBLISH_READY | SOUND | 1: Ja, summan är 9. | 2(x + y) = 18 directly fixes x + y = 9. |
| NOG-TRAP-016 | NOG | PUBLISH_READY | SOUND | 1: Ja, svaret är ja. | A real cube is negative exactly when its base is negative. |
| NOG-TRAP-017 | NOG | PUBLISH_READY | SOUND | 0: Nej, till exempel 6 och 12 fungerar. | 6 and 12 are distinct positive multiples satisfying the condition. |
| NOG-TRAP-018 | NOG | PUBLISH_READY | SOUND | 2: Nej, antalet som läser ingetdera saknas. | Union = 12 + 10 − 4 = 18; neither-group is unconstrained. |
| NOG-TRAP-019 | NOG | PUBLISH_READY | SOUND | 0: Ja, en minskning med 40\,\%. | 1,2 × 0,5 = 0,6 means 40% decrease regardless of positive starting price. |
| NOG-TRAP-020 | NOG | PUBLISH_READY | SOUND | 1: Nej, det kan vara 6 eller 9. | (1,5,6) and (1,5,9) have the same median, different maxima. |
| NOG-TRAP-021 | NOG | PUBLISH_READY | SOUND | 1: Ja, den är 60^\circ. | 180° − 90° − 30° = 60°; no scale needed for an angle. |
| NOG-TRAP-022 | NOG | PUBLISH_READY | SOUND | 0: Nej, den andra sträckan saknas. | First trip 2/5 h; second trip could be 1/5 or 3/5 h. |
| NOG-TRAP-023 | NOG | PUBLISH_READY | SOUND | 1: Nej, det kan vara 17 eller 23. | \|x − 20\| = 3 gives 17 or 23. |
| NOG-TRAP-024 | NOG | PUBLISH_READY | SOUND | 1: Ja, det är 10. | (2 + 3)k = 25 gives k = 5; smaller amount = 10. |
| NOG-TRAP-025 | NOG | PUBLISH_READY | SOUND | 1: Nej, färgen är okänd. | Queue identity/order gives no assignment of ticket colours. |
| LAS-TYPE-001 | LAS | PUBLISH_READY | SOUND | 0: Lavar. | Jon is explicitly linked to lavar; mossor belongs to Mira. |
| LAS-TYPE-002 | LAS | PUBLISH_READY | SOUND | 2: Lina är medlem. | Only members may book and Lina books within rules, so she is a member. |
| LAS-TYPE-003 | LAS | PUBLISH_READY | SOUND | 2: Försiktigt positiv. | Lovande supplies positive valence; tunt underlag supplies reservation. |
| LAS-TYPE-004 | LAS | PUBLISH_READY | SOUND | 0: För att konkretisera påståendet. | The moved stop exemplifies the preceding claim about small changes. |
| LAS-TYPE-005 | LAS | PUBLISH_READY | SOUND | 1: Bibliotekets många roller. | Loans, homework help and meeting neighbours jointly support multiple roles. |
| LAS-TYPE-006 | LAS | PUBLISH_READY | SOUND | 0: När metoden bör införas. | First testing versus immediate introduction contrasts timing alone. |
| LAS-TYPE-007 | LAS | PUBLISH_READY | SOUND | 1: Avgiften måste höjas. | The conditional directly yields higher fees once support is removed. |
| LAS-TYPE-008 | LAS | PUBLISH_READY | SOUND | 1: Nej, orsaken anges inte. | The one sentence reports decline, with no cause stated. |
| ELF-TYPE-001 | ELF | PUBLISH_READY | SOUND | 1: Några stannade över vintern. | Some does not license all or none; Swedish key retains the quantifier. |
| ELF-TYPE-002 | ELF | PUBLISH_READY | SOUND | 0: Han kom för sent för att köpa där. | Sold out before arrival entails too late to buy at that desk, not a prior purchase. |
| ELF-TYPE-003 | ELF | PUBLISH_READY | SOUND | 1: Effekten skilde sig mellan patienterna. | Help for some plus no change for others entails varying effect. |
| ELF-TYPE-004 | ELF | PUBLISH_READY | SOUND | 2: Reparation sparar resurser. | Resource saving is the thesis; broken handles illustrate it. |
| ELF-TYPE-005 | ELF | PUBLISH_READY | SOUND | 1: Försiktigt optimistisk. | Encouraging plus uncertainty supports cautious optimism. |
| ELF-TYPE-006 | ELF | PUBLISH_READY | SOUND | 0: Översvämningen. | Flooding caused closure; delayed delivery is a downstream effect. |
| ELF-TYPE-007 | ELF | PUBLISH_READY | SOUND | 2: Metoden kan sänka små företags kostnader. | Key keeps both may and small firms; other options change scope or polarity. |
| ELF-TYPE-008 | ELF | PUBLISH_READY | SOUND | 1: Sköt upp behandlingen. | No decision this year supplies the contextual meaning postponed. |
| MEK-RULE-001 | MEK | PUBLISH_READY | SOUND | 1: Fatta. | Fatta ett beslut is the fixed verb-object phrase; synonyms of understand do not substitute. |
| MEK-RULE-002 | MEK | PUBLISH_READY | SOUND | 0: av | Beroende av is the required construction. |
| MEK-RULE-003 | MEK | PUBLISH_READY | SOUND | 1: som | Såväl pairs with som; both och and eller belong to other pairs. |
| MEK-RULE-004 | MEK | PUBLISH_READY | SOUND | 0: kritik – antaget | Kritik matches trots; antaget matches coming into force; each wrong pair breaks one link. |
| MEK-RULE-005 | MEK | PUBLISH_READY | SOUND | 0: avslagits | Avslagits matches formal decision register; nobbats/dissats are colloquial. |
| MEK-RULE-006 | MEK | PUBLISH_READY | SOUND | 2: Kardiologi. | Kardi- identifies heart; odont- teeth and geo- earth are other roots. |
| MEK-RULE-007 | MEK | PUBLISH_READY | SOUND | 2: nattaktiv | Verksam på natten directly defines nattaktiv, not day-active or resting. |
| MEK-RULE-008 | MEK | PUBLISH_READY | SOUND | 0: permanent | Permanent contrasts with tillfällig; both other words preserve intermittence. |
| MEK-RULE-009 | MEK | PUBLISH_READY | SOUND | 2: Plocka russinen ur kakan. | Selective benefits maps to russinen; the other idioms concern overreach and innocence. |
| MEK-RULE-010 | MEK | PUBLISH_READY | SOUND | 2: reell | Verklig paraphrases reell; ideell and partiell have other senses. |
| MEK-RULE-011 | MEK | PUBLISH_READY | SOUND | 1: inventera | Counting and listing existing stock means inventera; planning/developing are different operations. |
| MEK-RULE-012 | MEK | PUBLISH_READY | SOUND | 1: legering | Bronze is a metal alloy; emulsion and suspension denote other mixture types. |
| MEK-RULE-013 | MEK | PUBLISH_READY | SOUND | 1: Sedan gick vi hem till pappa. | The everyday sentence preserves voice; the other versions replace it with bureaucratic phrasing. |
| MEK-RULE-014 | MEK | PUBLISH_READY | SOUND | 1: lövträd | All three are deciduous trees; none of the named examples is a conifer or shrub. |
| MEK-RULE-015 | MEK | PUBLISH_READY | SOUND | 2: paradoxalt | More time off yet more stress is the specified unexpected contrast, matching paradoxalt. |
| MEK-RULE-016 | MEK | PUBLISH_READY | SOUND | 2: löpe – vassle – ost | Löpe/vassle/ost are coherent cheese-making terms; plasma and bread create field mismatches. |
| DTK-TACTIC-001 | DTK | PUBLISH_READY | SOUND | 2: 6 | Sales max is A = 80; its profit cell is 6, not B profit 9. |
| DTK-TACTIC-002 | DTK | PUBLISH_READY | SOUND | 0: Sök visuellt efter toppen. | Common scale supports finding the tallest visually before exact readings. |
| DTK-TACTIC-003 | DTK | PUBLISH_READY | SOUND | 0: 25\,\% | Required denominator is 20 children; 5/20 = 25%, not 5/80. |
| DTK-TACTIC-004 | DTK | PUBLISH_READY | SOUND | 2: 10 | 30 − 20 = 10 percentage points; relative increase would be 50%. |
| DTK-TACTIC-005 | DTK | PUBLISH_READY | SOUND | 0: 2:1 | 198/102 ≈ 1,94, closest to 2:1 among the options. |
| DTK-TACTIC-006 | DTK | PUBLISH_READY | SOUND | 2: 24 | Syd/2023 is 24; 27 is adjacent year, 18 is adjacent row. |
| DTK-TACTIC-007 | DTK | PUBLISH_READY | SOUND | 2: 1 | Only A has price < 50 and weight < 10; B/C each fail one condition. |
| DTK-TACTIC-008 | DTK | PUBLISH_READY | SOUND | 0: 60 | Counterfactual share is 30% × 200 = 60; old share would give 40. |
| DTK-TACTIC-009 | DTK | PUBLISH_READY | SOUND | 1: 10 km | 4 cm is two scale-bar lengths; 2 × 5 = 10 km. |
| DTK-TACTIC-010 | DTK | PUBLISH_READY | SOUND | 1: 2020 | 2019 is below threshold; 2020 first exceeds 20; 2021 is later. |

### Surface-tell audit

Correct-answer positions were independently permuted, with final counts below. The longest-key check is a descriptive editorial aid, not a proof of quality; it is not a systematic strategy for these items.

| Section | Items | Index 0 / 1 / 2 | Uniquely longest correct option |
|---|---|---|---|
| KVA | 54 | 12 / 19 / 23 | 17 |
| XYZ | 59 | 14 / 24 / 21 | 7 |
| NOG | 25 | 10 / 8 / 7 | 12 |
| LAS | 8 | 3 / 3 / 2 | 3 |
| ELF | 8 | 2 / 4 / 2 | 2 |
| MEK | 16 | 4 / 6 / 6 | 2 |
| DTK | 10 | 4 / 2 / 4 | 0 |

## Verification — 2026-11-04

- Targeted green: pnpm test src/data/lockIn.test.ts src/data/frameworkCopies.test.ts --maxWorkers=2 — 374 passed, two files.
- pnpm typecheck — PASS.
- pnpm lint — PASS; four existing informational diagnostics in unrelated devbake components, no fixes applied.
- Full app suite after final content corrections: pnpm test --maxWorkers=8 — 198 passed files / 1 failed; 5,937 passed tests / 1 failed. The sole failure is the existing trapIndex.test.ts generator spawnSync /usr/bin/node EPERM check. The new 363 retrieval tests and the byte-identical framework checks pass in that full run. This sandbox cannot complete that subprocess check; coordinator must rerun it on the host. No rerun or policy workaround attempted.
- grep -c over escaped math prompts returned 148, matching all KVA + XYZ + NOG + DTK entries. KaTeX renders every delimited expression without errors. All seven-catalog coverage, freshness versus every served bank JSON, duplicate-option, answer-bound, nonempty why, immutable lookup and unknown-ID checks pass.
- No worker files touched, so worker checks do not apply.

### Final content digest

- frameworks/lock_in.json SHA-256: 86bb4617c2146238351bc9c1fb64e7997ac2cabb9be6af8fd03fda00391a3184
- Served copy SHA-256 and final scope/staging evidence are recorded below at handoff.

## Playbook proposal — gas-city-coordinator

2026-11-04 — Symptom: framework worked examples can contradict their own rule or use approximate equality as an exact KVA verdict (KVA-TRAP-041). Cause: inherited authored examples are not verified answer keys. Rule: content-worker briefs must require independent recomputation of every new answer, treating catalog examples only as context; preserve out-of-scope catalogs and report discrepancies separately.

## Final handoff — 2026-11-04

- Implementation complete: 180 reviewed retrieval items, typed immutable loader and pure `lockInFor`, plus 363 retrieval tests. Exactly the five admitted source/worklog paths are new; existing catalogs are untouched. The classified vault worklog is maintained separately under the standing worklog contract.
- Both JSON files have SHA-256 `86bb4617c2146238351bc9c1fb64e7997ac2cabb9be6af8fd03fda00391a3184`.
- `lockIn.ts` SHA-256 `b2aa7d37bd310a74fc8976decdc718f76afc3b1248d0382bb1c814ab2fe94bdc`; `lockIn.test.ts` SHA-256 `fe0120724ebbe43ea0f41373f192da2b0bcdea42cb72ba268da53507cba347b1`.
- HEAD remains `a5772305dca188e37bdaa65e75106d6a5b977241`; there is no implementation commit or independent exact-head merge review yet.
- Staging attempted once using the five literal admitted paths. Git refused to create the shared worktree `index.lock` because its filesystem is read-only. Files remain unstaged and uncommitted; no workaround or commit attempted.
- Worker state: BLOCKED for delivery. Coordinator actions: rerun the existing trap-index generator check outside the sandbox, stage the five files, and carry out signed delivery and independent Claude review. All assigned source edits and author reviews are complete; the single subprocess gate remains unverified here.
- The playbook proposal above is ready for `~/scratch/skill-gotchas/gas-city-coordinator.md`. That inbox is outside this session's writable roots, so no write there was attempted. Coordinator can forward the proposal to the permanent playbook workflow.
- Leave this bead deferred with no assignee, then drain. Do not close it before coordinator delivery evidence is complete.
