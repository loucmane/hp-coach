# Framework prerequisite graph: proposal

**Status:** draft for owner approval (hpf-yv5e). No code. hpf-0026.2 implements the
approved version. Data: `frameworks/framework_prereqs.draft.json`. Evidence and
validator output: `docs/worklog/hpf-yv5e.md`.

## What it is for

hpf-0026.2 (Taskmaster 26.2, `.taskmaster/tasks/tasks.json:1889-1896`) loads a
prerequisite graph and blocks selection when prerequisites are incomplete.
Today the scheduler picks the weakest section (`app/src/lib/scheduler.ts:428-442`),
then the first unread entry in catalog order (`app/src/hooks/useDailyPlan.ts:574`;
same rule as `nextUntaught`, `app/src/lib/frameworkProgress.ts:48`). Nothing
records that entry B builds on entry A. So any reordering can serve B before A:
cross-section steering, a difficulty sort (26.3) or diagnostic seeding.

The graph records only dependencies that the framework text itself states. It
decides which **new** entry gets introduced. It is not a curriculum and not a
mastery model.

## Granularity: entries only

`framework_progress` is keyed by framework entry id (`worker/src/lib/progress.ts:11-15`,
`worker/src/db/schema.ts:308-320`), so the graph uses the same 221 ids. Nodes are
implicit, meaning any id without an incoming edge is unconstrained.

- **Framework-level nodes rejected.** "xyz_traps → kva_traps" would block all 54
  KVA entries to express 14 real links. Sections are scheduled in parallel.
- **No virtual nodes.** Concepts that have no entry yet (section basics, the
  algebra refresher) are open questions below.

## Edges: 29 total, 21 hard and 8 soft, on 51 of 221 entries

**A. XYZ → KVA twins (14 hard).** Eleven KVA entries call themselves a *KVA-tvilling*
of an XYZ entry. Where the note spells out the split, the XYZ entry covers the
calculation and the KVA entry the verdict. KVA-TRAP-039, for example: "XYZ-entryn
fokuserar på den rena förenklingen; denna på hur tecknslarvet flippar en
I-mot-II-verdikt". Three XYZ entries carry "KVA-overlap" notes with the same
split ("använder samma mekanik för verdiktet. Här är fokus på själva räkningen").
In each pair, the KVA lesson assumes the XYZ calculation.

| Prereq → dependent | Topic | Evidence |
|---|---|---|
| XYZ-001 → KVA-039 · XYZ-006 → KVA-040 · XYZ-033 → KVA-041 · XYZ-032 → KVA-042 | minus sign, order of operations, √ of a sum, √ simplification | `kva_traps.json:889, 911, 933, 955` |
| XYZ-034 → KVA-043 · XYZ-026 → KVA-044 · XYZ-007 → KVA-045 | a⁰, power of a power, negative substitution | `kva_traps.json:977, 999, 1021` |
| XYZ-037 → KVA-051 · XYZ-041 → KVA-052 · XYZ-042 → KVA-053 · XYZ-052 → KVA-054 | parallel-line angles, composite area, r vs d, linear difference | `kva_traps.json:1153, 1175, 1197, 1219` |
| XYZ-005 → KVA-014 · XYZ-009 → KVA-032 · XYZ-029 → KVA-013 | inequality flip, ±√k, sign of (−a)ⁿ | `xyz_traps.json:124, 218, 702` |

**B. Inside XYZ (6 hard).** In each case the dependent entry uses the
prerequisite's rule without re-teaching it.

| Edge | Why | Evidence |
|---|---|---|
| XYZ-020 → 021 → 022 | p% = p/100 → change factor (1 ± p/100) → multiply factors | `xyz_traps.json:476, 502, 525` |
| XYZ-002 → 005 | an inequality "solved like an equation" assumes the equation routine | `xyz_traps.json:114-115, 133` |
| XYZ-003 → 012, XYZ-003 → 013 | conjugate and square rules fall back to FOIL ("full FOIL", "FOIL:a") | `xyz_traps.json:280, 305` |
| XYZ-040 → 044 | diagonal = Pythagoras ("glöms när man inte härleder via Pythagoras") | `xyz_traps.json:1061, 1071` |

**C. NOG (1 hard, 4 soft).** NOG-002 is "the foundational algebraic-sufficiency
rule" (`nog_traps.json:47`).

- **Hard:** 002 → 024. "Ratio + sum = two equations in two unknowns" applies 002's counting rule (`:532`).
- **Soft:**
  - 002 → 008, the dependent-equation case (`:179, 191`).
  - 002 → 015, the exception for combination targets (`:345`).
  - 003 → 024, a rule followed by its over-correction (`:63`).
  - 006 → 016, the authored exception "se NOG-TRAP-016" (`:142`).

**D. Reading and MEK (4 soft).**

- LAS-TYPE-001 → 002: inference defines itself against literal statements (`las_taxonomy.json:52`).
- ELF-TYPE-001 → 002: "retrieval, inte inferens" (`elf_taxonomy.json:57`).
- ELF-TYPE-001 → 007: retrieval without a named target (`elf_taxonomy.json:293`).
- MEK-RULE-004 → 016: authored "Komplement till MEK-RULE-004" (`mek_protocol.json:236`).

**Left out.** ORD and DTK have no edges, because roots and tactics are independent
units. ORD → MEK-RULE-006 (morpheme analysis) is out: the rule teaches with its own
examples, and only "-log" of its five sample morphemes is in the ORD lexicon
(`mek_protocol.json:82`). Parallel LÄS ↔ ELF types are out because each protocol
stands alone. Contrast and pairing notes ("skiljer sig från", "se även", "paras
med") are not prerequisites.

## "ORD before LÄS": dropped

1. **Provenance.** The example comes from Taskmaster text (`tasks.json:1856, 1868,
   1890, 1896`), not the PRD. The PRD's example is "ORD roots before vocabulary
   drilling, algebra refresher before XYZ problem-solving"
   (`.taskmaster/docs/prd.txt:380`). The May design plan already concluded
   "MEK, LÄS, ELF, DTK: no cross-section prereqs"
   (`audit/_plans_archive/2026-05-12_layer1-frameworks-and-scheduler.md:208-217`).
2. **Content.** No LÄS entry assumes ORD knowledge. LAS-TYPE-001…008 are
   passage-level reasoning protocols, and the taxonomy has no word-meaning type.
3. **Cost.** It could only be a section-level gate: a whole verbal section blocked
   behind 41 roots, for a long-run correlation rather than a dependency. That
   contradicts parallel progress toward 2.0 and the low-friction ADHD-PI pillar
   (`prd.txt:59-73`).
4. **What survives of the PRD example.** "Roots before drilling" is the lesson-then-
   practice order inside each entry, which the state machine already encodes
   (`prd.txt:245-258`). The algebra refresher does not exist yet
   (`prd.txt:161, 173`). Group B covers its most important dependencies until it does.

## Semantics proposal

- **Hard A → B.**
  - **Rule:** the scheduler does not *introduce* an untaught B until every hard A is
    no longer `untaught`, that is, A is `learning`, `practicing`, `retaining` or
    `mastered`.
  - **`learning` means taught.** It is the implemented "lesson read" event
    (`progress.ts:169-186`). Practising without reading lands directly on
    `practicing` (`progress.ts:209-216`), which also satisfies the gate.
  - **Why not `practicing`.** That would require a tagged attempt. Tags come from the
    client (`worker/src/routes/attempts.ts:19-23, 49-52`), so the gate would measure
    tagging coverage instead of teaching.
  - **Why not `retaining`.** Score bands demote by design (`progress.ts:112-125`), so
    eligibility would flicker and could starve a struggling learner. Accuracy
    problems belong to Layer 3.
  - **Introduction only.** Once B is introduced, later changes to A (demotion, or
    un-marking a read, `progress.ts:188-207`) never re-block B.
- **Soft A → B.** Never blocks. Among eligible entries, prefer those whose soft
  prerequisites are taught, and break ties by catalog order. Equivalently: a
  topological order over hard and soft edges with catalog position as the
  tie-break, then filtered by hard eligibility. All 15 same-catalog edges already
  follow catalog order, so today's lesson order does not change; the graph guards
  against future reorderings.
- **Never gated:** repetition (Rule 1), trap drills from real misses
  (`scheduler.ts:452-470`), the hot-trap boost (`:483`), Provpass, free drills, and
  a lesson the learner opens themselves.
- **The loader rejects** unknown ids, self-loops, duplicate pairs, bad `strength`
  values and cycles across hard and soft edges. The draft passes all of these, and
  the worklog records the check.

| Status of prerequisite A | Hard A → B | Soft A → B |
|---|---|---|
| `untaught`, no row, unknown value | B is not introduced | B is deprioritised |
| `learning` / `practicing` / `retaining` / `mastered` | satisfied | satisfied |

Read statuses from `GET /api/framework-progress` (`progress.ts:74-95`). It is
cross-device and maps unknown values to `untaught`. Missing rows count as
`untaught` (`app/src/lib/frameworkProgress.ts:46`). Impact: 21 entries are gated, and the
deepest chains have two steps (XYZ-002 → XYZ-005 → KVA-014 and
XYZ-020 → 021 → 022).

## Open owner questions

1. **Threshold.** Is "not `untaught`" the right hard threshold? Revisit when lessons
   get micro-checks (`prd.txt:255-256`).
2. **Blocked candidate.** *Recommended:* pull the unmet prerequisite forward, with
   learner copy such as "Grunden först: läs XYZ-regeln som den här KVA-fällan
   bygger på." *Alternative:* skip to the next eligible entry. Skipping is simpler but
   can starve: a strong section rarely gets lessons (`scheduler.ts:501-504`).
3. **XYZ → KVA twins.** Hard (recommended) or soft? They are 14 of the 21 hard
   edges and gate KVA-013, 014, 032, 039–045 and 051–054.
4. **Section basics.** The real "NOG basics before NOG traps" content is not in any
   entry:
   - KVA's option taxonomy is "NOT cataloged as a trap; it is assumed" (`kva_traps.json:6`).
   - NOG's answer structure and "judge, don't solve" (`prd.txt:158, 174`) have no entry.
   - The app has no per-section onboarding (Screen 4.5, `prd.txt:223-237`).

   *Option 1:* a section-level gate in the scheduler. *Option 2:* author basics
   entries (e.g. `NOG-BASE-001`), then add hard edges from them.
5. **Unauthored candidates.** Add them now, or after the authors cross-reference them?
   - near-twins XYZ-024 ↔ KVA-024 and XYZ-019 ↔ KVA-023
   - XYZ geometry → NOG-TRAP-007 ("känd geometrisk sats", `nog_traps.json:155`)
6. **Data fixes (separate bead).**
   - `ord_roots.json:298` calls ORD-ROOT-018 the Latin in-/inter- root, but 018 is
     "-full" (`:361-362`); the intended entries are 031/030.
   - `xyz_traps.json:6` pairs KVA-014/032/038 with XYZ-009/031/024 "respectively",
     contradicting the entry notes (XYZ-005/009/029).
   - `app/public/frameworks/ord_roots.json` has drifted from the canonical copy
     (same ids, different `example_questions`).
7. **Confirm the drop and the file location.**
   - Drop "ORD before LÄS", and replace 26.2's "Test ORD->LÄS sequencing" with
     "KVA-TRAP-014 is blocked until XYZ-TRAP-005 is taught".
   - Ship the approved file as `frameworks/framework_prereqs.json`, copied to
     `app/public/frameworks/` like the catalogs (`app/src/data/frameworks.ts:4-5`).
