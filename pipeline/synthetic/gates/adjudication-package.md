# Adjudication package — what the owner sees per surviving item

Every candidate that reaches final status `SURVIVED_CLEAN` or
`SURVIVED_FLAGGED` becomes one **adjudication card**. The owner is a native
Swedish speaker judging quickly, often on a phone. The card must let a fast,
confident human verdict happen without opening any other file. Design for the
thumb: one item per screen, decision buttons always reachable, no horizontal
scroll.

Clean survivors and flagged survivors are both shown — the owner is the final
gate, and the gates' job was to make the owner's read fast and well-armed,
not to pre-decide. Flagged items sort first (they carry an open question).

## Card contents (top to bottom)

1. **Header** — `candidate_id`, section badge (LÄS / ELF), `family`, and the
   status chip (`CLEAN` green / `FLAGGED` amber). One line.

2. **The item, exactly as a student would see it** — title, full passage,
   the question(s), the four options with the **key marked**. This is the
   thing being judged; it dominates the card. Swedish renders in the product
   font so register reads true.

3. **The open questions first (flagged items only)** — every `flag` finding,
   grouped by gate, each as: the **verbatim quote**, the gate's one-line
   note, and the gate that raised it. A single dissenting language vote
   appears here verbatim (labelled "1 of 3 language reviewers objected"). This
   is what the owner is actually adjudicating; it sits directly under the item
   so the eye lands on it.

4. **Gate verdict strip** — a compact row of all nine gates with a
   pass/kill/flag glyph each, so the owner sees at a glance that the lethal
   gates all passed and exactly where the flags are. Tapping a gate expands
   its full finding list (including the passed gates' evidence, e.g. the
   G-KEY blind solvers' answers and the G-DISTRACTOR per-option ruling).

5. **Exemplar comparison** — the three `exemplar_pool` qids G-REGISTER used,
   each as a one-tap expandable showing that authentic passage, so the owner
   can hold the candidate against real HP texts of the same section and length
   class. Plus the gate's `comparative_note`.

6. **Family context** — how many candidates in this `family` reached
   adjudication, and their statuses, so a systematic family-level weakness
   (e.g. every item from one recipe draws the same G-SPRÅK flag) is visible
   rather than hidden one card at a time.

7. **Generator's own case (collapsed by default)** — the item's `rationale`
   fields (key argument, distractor reasoning). Available for a contested
   call but never shown first: the owner should judge the item, not the
   generator's confidence.

## Decision affordances

Three always-visible buttons: **Godkänn** (accept into the bank), **Avvisa**
(reject), **Ändra** (accept with an edit — opens a note field for the fix,
e.g. "byt 'spenderade' mot 'ägnade'"). Every decision writes
`{candidate_id, decision, note, adjudicated_at}` to the batch's decision log;
`Ändra` decisions feed the generation analysts' revision list.

## What is deliberately NOT on the card

- No aggregate scores or gate "confidence" numbers — they invite the owner to
  defer to the machine. The lethal gates already removed everything they
  could remove; what remains is a human call.
- No DEAD candidates — they are in the batch kill log for auditing the gates,
  not for adjudication. (If the owner suspects the gates are over-killing,
  that is an eval-set question, handled by `run-protocol.md`, not per card.)
- The ÖVNINGSTEXT / synthetic-content disclosure is a **product** surface
  (owner-ratified copy, shown to students), not part of adjudication — out of
  scope for this package.

## Format

The package is generated as a single self-contained artifact (one scrollable
page, cards stacked, anchor-linked from a top index that lists candidate_id +
status). Phone-first: single column, ~16px+ body, tap-to-expand for every
secondary layer so the default view is item + open questions + decision
buttons and nothing else competing for attention.
