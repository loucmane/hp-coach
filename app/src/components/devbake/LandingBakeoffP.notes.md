# LandingBakeoffP — product-demo lens (P2-2.1)

Two landing concepts from the **product-demo school**: instead of an argument
you read (the editorial lens), show the thing working — the landing IS a taste
of the app. Both are **phone-first** (designed at 390px, widened after) and
both are built from the **live `.hpc-m3-*` Boksidan classes** in `index.css`,
so the demo questions carry the app's real verdict treatment — indicator rail,
`is-ok` green fill, `is-bad` strike-through, the italic drawn verdict word —
not a recreation of it. No screenshots anywhere; nothing on the page is
dressier than reality because it *is* reality.

## LAND_P1 — "Första frågan" (the ambush)

Thesis: **the page opens with an answerable question before any pitch.** The
brand exists only as a whispered mono folio (`hp-coach.se · inför
högskoleprovet`); the hero is an ORD headword in the app's display italic with
five live option rows. Only after ink is on the page does the product speak —
the "Det där var appen" marginalia fades in (`.reveal`) on first grade.
Structure: one centered 680/720px reading column; claims land as
accent-ruled margin notes (`.lp-note`) between demo beats — ORD → zero-claim →
MEK → 2.0-claim → explanation specimen → ADHD + loop claims → honesty → price
→ CTA. Brand name in full appears once, at the very bottom, like a colophon.

Risk taken: withholding the brand from the hero entirely. For a 23:00
friend-link visit the question *is* the explanation of what this is.

## LAND_P2 — "Uppslaget" (the session facsimile)

Thesis: **the whole sales page is typeset as one drill session** on the M3
margin-rail chassis (`.hpc-m3-row`, linearizes below 600px via the existing
index.css rules). The rail labels read like a session's running heads:
UPPGIFT 1 / MARGINAL / UPPGIFT 2 / FÖRKLARING / UTFALL / VILLKOR / PRIS.
Includes a quant beat (KVA) for breadth, and a live session ledger under
UTFALL: answering the two demo questions books ✓/✗ marks in real time
("2 av 2 · varje fel taggas mot en känd fälla"). Brand-first masthead with a
1px ink rule; italic display thesis "Det här är inte en broschyr. Det är
appen."

Risk taken: selling copy demoted to literal marginalia — the rail idiom is
load-bearing sales structure, not decoration.

## Copy decisions (Swedish product strings)

- **Legal rule respected**: every demo question is ORIGINAL, written for
  HP-Coach in authentic HP style (ORD *vedermöda*, MEK sentence completion,
  KVA fraction comparison). Each is labeled on the page:
  "Exempeluppgift skriven för HP-Coach — inte hämtad från något prov."
  Nothing touches `data/` (© UHR).
- **Claims as annotations, no theater**: four claims only — zero-knowledge
  ("ordrötter före ordlistor, algebra före ekvationer"), 2.0 target, ADHD-first
  ("inga streak-skam", "appen väljer nästa uppgift"), the adaptive loop
  ("du övar på dina misstag — inte på slumpen").
- **Honest machine**: "Ärlighetsklausul" — no results promises, training tool;
  human accountability line "HP-Coach drivs av [namn] · org.nr [—]"
  (placeholders per brief).
- **Price placeholder, designed**: mono "X kr" on a dashed underline slot +
  folio "priset sätts före lansering — det blir ett tal, inte en trappa";
  terms "engångsköp · gäller till provdagen"; anchored against the 550 kr
  exam fee ("Förberedelsen ska inte kosta en prenumeration").
- **CTA**: "Skapa konto" → plain `<a href="/sign-up">`, with the
  zero-choice promise beneath: "Konto → betalning → första passet. Inga val
  på vägen."

## Motion

The demo verdicts perform via the existing M3 CSS animations (verdict draw-in,
option transitions); P1's post-answer marginalia uses the product `.reveal`
keyframe. Nothing loops; the page is still between interactions. Reduced
motion is covered by the global `prefers-reduced-motion` wildcard in
index.css (near-zero durations) — no component-local guards needed.

## Known trade-offs / residue

- P1's reveal block mounts on grade (page grows) rather than reserving space —
  the verdict growth already moves the page, so reservation bought nothing but
  a dead hole in the hero.
- P2's ledger orders marks by answer order, not rail order — acceptable for a
  bake-off; a real landing would key marks to questions.
- Dark mode inherits from tokens for free (all colors are token-bound) but was
  not separately art-directed in this round.
