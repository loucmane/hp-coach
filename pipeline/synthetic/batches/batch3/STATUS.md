# Batch 3 — status: GENERATED + assembled, mech 28/28, pipeline PENDING

7 units / 20 questions, fresh topics:

| unit | title | q |
|---|---|---|
| las-b3-001 | Värme ur ett övergivet berg (mine geothermal, long) | 4 |
| las-b3-002 | Nattåget hör hemma i infrastrukturbudgeten (debatt) | 2 |
| las-b3-003 | När ett jämnt brus dämpar det öppna kontoret | 2 |
| elf-b3-001 | Living Walls (green façades, long) | 5 |
| elf-b3-002 | Slow Trains Home (cloze) | 5 |
| elf-b3-003 | The Listening Ice (short) | 1 |
| elf-b3-004 | The Water Cure (short) | 1 |

- **Mech 28/28 pass** (M-SCHEMA/M-BANDS/M-TELL/M-PLAGIARISM with corpus) — `verdicts/verdicts-mech.jsonl`.
- Generated with the las-b2-001 G-STEM autopsy as a negative example (stem must
  never entail the key) and the precise-trap-label rule from the batch-1 sweep.

**Residue for batch 4 dispatch:** two units brush the same domain (night trains
LÄS debatt / slow trains ELF cloze) — different sections+languages so no
student-facing redundancy, but the orchestrator should assign disjoint topic
pools ACROSS generator agents, not just "distinct within your set".

**Next:** run `pipeline/run-batch.workflow.js` with `args:{batch:3}` (stages 4–9:
gate fleet → language → pedagogy → integrated sweep → promote --require-clean).
