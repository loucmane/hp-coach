---
bead: "hpf-yv5e"
project: "hpfetcher"
session: "gc__implementation-worker-ci-33ayd"
status: "draft_ready_pending_owner"
---

# Worklog: hpf-yv5e

Draft the framework prerequisite graph for hpf-0026.2. This bead produces data and a
proposal only. The owner approves the graph before any code is written.

## Scope and snapshot

- **Claim.** 2026-10-07: `gc hook --claim --json` returned `work` for `hpf-yv5e`.
  `bd show hpf-yv5e --json` confirmed the id, status `in_progress`, assignee
  `gc__implementation-worker-ci-33ayd` (matches the claim) and
  `metadata.gc.routed_to` `hpfetcher/gc.implementation-worker`. Bead metadata
  `gc.session_id` reads `ci-rl68g`; recorded as-is.
- **Snapshot.** `git rev-parse HEAD` and `git rev-parse origin/main` both returned
  `6a4511431652d0b66fd1ea2523807f286f3d772d`. `git status --short --branch` shows
  `## HEAD (no branch)`, so HEAD is detached as the bead states.
- **Pre-existing untracked files.** `docs/p5-infold-design.md` and
  `docs/worklog/hpf-6afv.md` were left untouched, along with runtime and skill paths
  (`.agents/skills/…`, `.claude/skills/…`, `.codex/`, `.gc/`). Inside the Bash
  sandbox, `git status` also lists dotfiles: `.bash_profile`, `.bashrc`,
  `.gitconfig`, `.gitmodules`, `.idea`, `.mcp.json`, `.profile`, `.ripgreprc`,
  `.vscode`, `.zprofile`, `.zshrc`. They are not in the pre-session status snapshot
  and `grep` gets "Permission denied" on them. They look like sandbox mount
  placeholders. This job did not create or touch them.
- **Files created (only these):**
  - `frameworks/framework_prereqs.draft.json`
  - `docs/framework-prereqs-proposal.md`
  - this worklog

  All are uncommitted. No git writes, no network. Helper scripts (survey, validator,
  citation checker) live only in the session scratchpad. The validator source is
  reproduced below.
- **Bead metadata `gc.check_path`.** It points at
  `…/gascity/assets/scripts/checks/build-artifact-valid.sh`. I read it but did not
  run it. It requires `gc.build.artifact_schema` and `gc.build.artifact_path_keys`
  step metadata, which this bead does not carry, and the bead description names no
  validator. A check bead that runs it against hpf-yv5e would fail on the missing
  metadata, not on the deliverables.

## Findings

### Requirement and provenance

- **The requirement.** Taskmaster 26.2, "Build prerequisite graph enforcement"
  (`.taskmaster/tasks/tasks.json:1889-1896`): load `framework_prereqs.json`, filter
  eligible clusters by topological order, block selection while prerequisites are
  incomplete. Its test strategy is "Test ORD->LÄS sequencing; Invalid paths
  rejected; Graph cycles detected". Parent #26 is marked data-blocked partly because
  "no prerequisite graph (framework_prereqs.json) exists" (`tasks.json:1867`;
  `docs/scheduler-loop-findings.md:94-95`).
- **Where "ORD before LÄS" comes from.** Only Taskmaster text:
  `tasks.json:1856, 1868, 1890, 1896`, plus `:1817`, which offers "ORD → LÄS" as a
  cold-start sequence example. The PRD's own example is F5.5.6: "ORD roots before
  vocabulary drilling, algebra refresher before XYZ problem-solving"
  (`.taskmaster/docs/prd.txt:380`).
- **PRD context.**
  - Layer 1 schemas: `prd.txt:81-111`. Layer 3 counts errors per Layer 1 id: `:140-147`.
  - §3.4 content gaps: NOG meta-skill lessons `:158`; XYZ refresher not authored `:161, 173`.
  - Cluster state machine: `:245-260`. F5.5.5 reads `framework_progress`: `:375-379`.
  - Pillars: zero knowledge `:46-57`, 2.0 target `:59-61`, ADHD-PI `:63-73`.
- **Earlier design (May 2026 archived plan).** It already proposed an ORD-internal
  edge and quant edges, and stated "MEK, LÄS, ELF, DTK: no cross-section prereqs"
  (`audit/_plans_archive/2026-05-12_layer1-frameworks-and-scheduler.md:130-133, 208-217`).
- **`docs/curriculum-scheduler.md`.** Adaptive scheduling is a v1 non-goal
  (`:36-38`). Rule 2 serves the "first non-mastered entry (initially: first entry in
  the array)" (`:102-106`).

### How selection works today

- **Section choice.** Sections are ranked by weakness (`app/src/lib/scheduler.ts:428`).
  The weakest gets a lesson when `needsLesson` holds (`:430-442`, `:501-504`). Trap
  drills come from real misses (`:452-470`). The hot-trap boost runs at `:483`.
- **Entry choice.** The lesson hint is the first unread entry in catalog order, over
  server ∪ localStorage reads (`app/src/hooks/useDailyPlan.ts:566-585`, at `:574`).
  The new progress summary picks `nextUntaught` the same way
  (`app/src/lib/frameworkProgress.ts:41-49`).
- No prerequisite logic exists anywhere.

### The progress model the gate would read

- **Key.** `framework_progress` is keyed by user and `layer1_id`, and `layer1_id` is
  the framework entry id (`worker/src/db/schema.ts:308-320`;
  `worker/src/lib/progress.ts:11-15`). The statuses are listed at `progress.ts:54-62`.
- **How statuses move:**
  - untaught → learning on a lesson read (`progress.ts:169-186`, via
    `worker/src/routes/lessonReads.ts:15, 74`).
  - Each tagged graded attempt updates an EWMA score (`progress.ts:45-52, 105-110`),
    banded into practicing, retaining (≥ 0.75) or mastered (≥ 0.85)
    (`:112-125, 209-243`).
  - Practising without reading lands on practicing (`:213-216`).
  - Demotion stops at practicing (`:117-120`). Un-reading reverts only
    learning → untaught (`:188-207`).
- **Tags.** Attempt tags come from the client (`worker/src/routes/attempts.ts:19-23, 49-52, 117-119`).
- **Reader.** `GET /api/framework-progress` (`worker/src/routes/frameworkProgress.ts:9-17`)
  calls `readFrameworkProgress` (`progress.ts:74-95`), which keeps the newest row per
  id and maps unknown statuses to untaught.
- **App summary.** A missing row counts as untaught (`app/src/lib/frameworkProgress.ts:46`)
  and orphan ids are set aside (`:83`).

### Catalogs

- **Counts.** 8 files, 221 entries: ORD 41, MEK 16, LÄS 8, ELF 8, XYZ 59, KVA 54,
  NOG 25, DTK 10.
- **Canonical source and copy.** `frameworks/` is canonical and
  `app/public/frameworks/` is a copy (`app/src/data/frameworks.ts:4-5`). By
  `sha256sum`, 7 of the 8 files are byte-identical.
- **`ord_roots.json` differs:**

  | Copy | Size | sha256 |
  |---|---|---|
  | `frameworks/` (canonical) | 32931 B | `1c36a62d…0383` |
  | `app/public/frameworks/` | 31316 B | `3fd61bae…1950` |

  The diff shows `example_words` formatting changes and different
  `example_questions` sets. The entry-id sets are identical (see Validation).
- **No code reads the draft.** Nothing globs `frameworks/`. Checked: `glob(`,
  `readdirSync` and `import.meta.glob` across `pipeline/`, `scripts/`,
  `app/scripts`, `app/src`, `worker/src` and `.github`.
  `scripts/backfill_framework_id.py:29, 54` opens named files only, and
  `scripts/content-sync.mjs:39-42` syncs only `app/public/data` and
  `app/public/explanations`. The draft file is inert.

### Authored cross-references (survey of every entry's text)

| Reference | Location | Edges it supports |
|---|---|---|
| 11 × "KVA-tvilling till XYZ-TRAP-…" | `frameworks/kva_traps.json:889, 911, 933, 955, 977, 999, 1021, 1153, 1175, 1197, 1219` | 11 hard XYZ → KVA edges |
| 3 × "KVA-overlap" | `frameworks/xyz_traps.json:124, 218, 702` | 3 hard XYZ → KVA edges |
| NOG-002 "foundational algebraic-sufficiency rule" | `nog_traps.json:47` | NOG-002 edges |
| NOG-006 "se NOG-TRAP-016" | `nog_traps.json:142` | NOG-006 → 016 |
| "Komplement till MEK-RULE-004" | `mek_protocol.json:236` | MEK-004 → 016 |
| ELF-002 protocol "retrieval, inte inferens" | `elf_taxonomy.json:57` | ELF-001 → 002 |
| ELF-007 "Skiljer sig från ELF-TYPE-001 retrieval…" | `elf_taxonomy.json:293` | ELF-001 → 007 |
| LÄS-002 protocol "Svaret står INTE ordagrant i texten" | `las_taxonomy.json:52` | LAS-001 → 002 |

Contrast or pairing notes were deliberately not turned into edges:

- KVA-029 ↔ 034 "besläktade"
- KVA-047 "Skild från" 011/038
- KVA-045 "Se även KVA-TRAP-013"
- ELF-003 distinguished from 002 and 004
- ELF-008 fold-in note
- DTK-006 "paras ofta med TACTIC-001" (`dtk_tactics.json:99`)
- DTK-010 "para med TACTIC-007"
- ORD-014 ↔ 031 disambiguation (`ord_roots.json:298, 643`)

### Section basics are not entries

- KVA's option taxonomy is "NOT cataloged as a trap; it is assumed" (`kva_traps.json:6`).
- The NOG file note claims "the core meta-skill" (`nog_traps.json:6`); the nearest
  entry is NOG-002.
- `grep -i onboarding` over `app/src` finds only welcome, diagnostik and the
  scheduler's day-zero comments. There is no per-section onboarding (Screen 4.5).

### Data defects found (reported, not fixed: outside this bead's file scope)

1. **Stale cross-reference in `ord_roots.json`.** The ORD-ROOT-014 note
   (`ord_roots.json:298`) calls ORD-ROOT-018 the Latin in-/inter- root, but
   ORD-ROOT-018 is "-full" (`:361-362`). The Latin roots are ORD-ROOT-031 (`:625`)
   and ORD-ROOT-030 "inter-" (`:604-605`).
2. **Mismatched pairing in the XYZ file note.** `xyz_traps.json:6` pairs
   KVA-014/032/038 with XYZ-009/031/024 "respectively". This contradicts the entry
   notes (XYZ-005 ↔ KVA-014, XYZ-009 ↔ KVA-032, XYZ-029 ↔ KVA-013) and the content:
   XYZ-031 covers powers of ten, XYZ-024 distribute-and-cancel.
3. **Drifted app copy.** `app/public/frameworks/ord_roots.json` has drifted from
   the canonical file (see Catalogs).

### Unreferenced candidates (owner question 5)

- XYZ-TRAP-024 (`xyz_traps.json:567`) ↔ KVA-TRAP-024 (`kva_traps.json:529`): the
  same "compute both sides instead of using the structure" pattern.
- XYZ-TRAP-019 (`xyz_traps.json:449`) ↔ KVA-TRAP-023 (`kva_traps.json:504`):
  fraction comparison.
- NOG-TRAP-007 says "känd geometrisk sats" (`nog_traps.json:155`), pointing at
  XYZ-035, 038 and 040.
- NOG-TRAP-019 (`nog_traps.json:419`) builds on percent factor chains (XYZ-022).

## Decisions (draft, pending owner)

- **Granularity.** Entry ids only. Nodes are implicit, and there are no
  framework-level or virtual nodes.
- **Inclusion rule.** An edge goes in only if the dependent's authored text names
  the prerequisite or uses its rule as already known, and a coach would teach the
  two in that order.
  - **Hard:** the dependent's reasoning uses the prerequisite's mechanic without
    re-teaching it.
  - **Soft:** a rule followed by its exception, a complement pair, or simplest first.
- **Result.** 29 edges:
  - 21 hard: 14 XYZ → KVA, 6 inside XYZ, 1 inside NOG.
  - 8 soft: 4 NOG, 1 LÄS, 2 ELF, 1 MEK.
  - None for ORD or DTK.
- **"ORD before LÄS" is dropped.** The proposal gives four reasons. "Roots before
  drilling" is already the lesson → practice order inside each entry.
- **Hard gate.** Satisfied when the prerequisite is not `untaught`. It applies to
  introducing an entry only and never gates remediation.
- **`reason` strings.** English and developer-facing; never shown to learners.
  Learner copy (Swedish) belongs to the scheduler, e.g. the proposed
  "Grunden först: …".

### Considered and rejected

| Candidate | Why it was rejected |
|---|---|
| XYZ-035 → 038 (`xyz_traps.json:833, 907`) | 038 calls itself "en direkt identitet" (`:911`); it is self-contained |
| XYZ-023 → 036 (`:543, 857`) | 036 re-teaches the unit-size method |
| XYZ-051 → 052 (`:1225, 1253`) | 052 is derivable algebraically |
| XYZ-011 → 008 (`:252, 185`) | 008 shows the factoring inline; the edge would also invert catalog order |
| NOG-010 ↔ 011 and NOG-012 ↔ 013 (`nog_traps.json:219, 240, 264, 286`) | contrast pairs with no authored link |
| DTK-006 → 001 (`dtk_tactics.json:87, 99`) | a pairing note in a v0, speculative framework |
| ORD-ROOT-033 → MEK-RULE-006 (`ord_roots.json:662`; `mek_protocol.json:80-82`) | only one of the rule's five sample morphemes is in the ORD lexicon |
| LÄS ↔ ELF parallel types | each protocol stands alone |

## Edge evidence (all 29)

| # | From → to | Strength | Evidence |
|---|---|---|---|
| 1 | XYZ-TRAP-020 → XYZ-TRAP-021 | hard | `xyz_traps.json:476` ("Ersätt ALLTID a% med a/100"); 021 uses (1 + p/100) at `:500, 502` |
| 2 | XYZ-TRAP-021 → XYZ-TRAP-022 | hard | `xyz_traps.json:522, 525` ("multiplicera faktorerna … 1,5 · 0,5") |
| 3 | XYZ-TRAP-002 → XYZ-TRAP-005 | hard | `xyz_traps.json:114` ("löst som ekvation"), `:115` ("ser identiska ut mellan ekvation och olikhet"), `:133` ("den vanliga algebrarutinen räcker") |
| 4 | XYZ-TRAP-003 → XYZ-TRAP-012 | hard | `xyz_traps.json:280` ("Vid annan kombination: full FOIL.") |
| 5 | XYZ-TRAP-003 → XYZ-TRAP-013 | hard | `xyz_traps.json:305` ("skriv ut som (a+b)(a+b) och FOIL:a") |
| 6 | XYZ-TRAP-040 → XYZ-TRAP-044 | hard | `xyz_traps.json:1061, 1071` ("via Pythagoras") |
| 7 | XYZ-TRAP-001 → KVA-TRAP-039 | hard | `kva_traps.json:889` |
| 8 | XYZ-TRAP-006 → KVA-TRAP-040 | hard | `kva_traps.json:911` |
| 9 | XYZ-TRAP-033 → KVA-TRAP-041 | hard | `kva_traps.json:933` |
| 10 | XYZ-TRAP-032 → KVA-TRAP-042 | hard | `kva_traps.json:955` |
| 11 | XYZ-TRAP-034 → KVA-TRAP-043 | hard | `kva_traps.json:977` |
| 12 | XYZ-TRAP-026 → KVA-TRAP-044 | hard | `kva_traps.json:999` |
| 13 | XYZ-TRAP-007 → KVA-TRAP-045 | hard | `kva_traps.json:1021` |
| 14 | XYZ-TRAP-037 → KVA-TRAP-051 | hard | `kva_traps.json:1153` |
| 15 | XYZ-TRAP-041 → KVA-TRAP-052 | hard | `kva_traps.json:1175` |
| 16 | XYZ-TRAP-042 → KVA-TRAP-053 | hard | `kva_traps.json:1197` |
| 17 | XYZ-TRAP-052 → KVA-TRAP-054 | hard | `kva_traps.json:1219` |
| 18 | XYZ-TRAP-005 → KVA-TRAP-014 | hard | `xyz_traps.json:124` (KVA-014 at `kva_traps.json:301`) |
| 19 | XYZ-TRAP-009 → KVA-TRAP-032 | hard | `xyz_traps.json:218` (KVA-032 at `kva_traps.json:721`) |
| 20 | XYZ-TRAP-029 → KVA-TRAP-013 | hard | `xyz_traps.json:702` (KVA-013 at `kva_traps.json:278`) |
| 21 | NOG-TRAP-002 → NOG-TRAP-024 | hard | `nog_traps.json:47`; 024 at `:530, 532` ("två ekvationer i två obekanta") |
| 22 | NOG-TRAP-002 → NOG-TRAP-008 | soft | `nog_traps.json:179, 191` |
| 23 | NOG-TRAP-002 → NOG-TRAP-015 | soft | `nog_traps.json:345` ("resonerar att man behöver två ekvationer") |
| 24 | NOG-TRAP-003 → NOG-TRAP-024 | soft | `nog_traps.json:63` (003 already states ratio + absolute = closed) |
| 25 | NOG-TRAP-006 → NOG-TRAP-016 | soft | `nog_traps.json:142` |
| 26 | LAS-TYPE-001 → LAS-TYPE-002 | soft | `las_taxonomy.json:52` |
| 27 | ELF-TYPE-001 → ELF-TYPE-002 | soft | `elf_taxonomy.json:57` |
| 28 | ELF-TYPE-001 → ELF-TYPE-007 | soft | `elf_taxonomy.json:293` |
| 29 | MEK-RULE-004 → MEK-RULE-016 | soft | `mek_protocol.json:236` |

## Validation

- 2026-10-07: ran the validator below against
  `frameworks/framework_prereqs.draft.json`
  (sha256 `fced557e7524a270e1092fc77b51120e4350bd0215d4827a2562952aeb6b5c54`).
  - Validator: scratchpad `validate_prereqs.py`, sha256
    `3c2711868f604acd01e2a3e3ca9dc49d85e97d099d5c93e3fe158ac6b349be23`.
  - Command: `python3 <scratchpad>/validate_prereqs.py /home/loucmane/dev/hpfetcher-worktrees/hpfetcher-lane`.
  - Exit status: 0.

```text
catalog ids: frameworks/=221 app/public/frameworks/=221 identical_id_sets=True
edges=29 hard=21 soft=8 nodes_touched=51
by catalog pair: {'elf_taxonomy->elf_taxonomy': 2, 'las_taxonomy->las_taxonomy': 1, 'mek_protocol->mek_protocol': 1, 'nog_traps->nog_traps': 5, 'xyz_traps->kva_traps': 14, 'xyz_traps->xyz_traps': 6}
same-catalog edges=15 against_catalog_order=none
hard-gated nodes: 21 | multi-step chains: {'KVA-TRAP-014': ['XYZ-TRAP-002', 'XYZ-TRAP-005'], 'XYZ-TRAP-022': ['XYZ-TRAP-020', 'XYZ-TRAP-021']}
RESULT: VALID
negative self-test: 4/4 broken graphs rejected {'cycle': "cycle among ['KVA-TRAP-014', 'XYZ-TRAP-002', 'XYZ-TRAP-005']", 'unknown id': "edge 29: unknown id 'ORD-ROOT-999'", 'self-loop': "cycle among ['DTK-TACTIC-001']", 'duplicate': "edge 29: duplicate ('XYZ-TRAP-020', 'XYZ-TRAP-021')"}
```

What the output shows:

- Every id exists in both catalog copies.
- The graph is acyclic over hard and soft edges.
- All 15 same-catalog edges follow catalog order, so today's first-unread lesson
  order is unchanged.
- 21 entries are gated, and the longest hard chains have two steps.
- The negative self-test confirms the cycle, unknown-id, self-loop and duplicate
  checks reject bad input.

Validator source (verbatim):

```python
"""Validate frameworks/framework_prereqs.draft.json against the shipped Layer-1 catalogs.

Stdlib only, read-only. Checks: edge shape, strength enum, one-line reason, no
self-loops or duplicate pairs, every endpoint exists in BOTH catalog copies
(frameworks/ and app/public/frameworks/), and no cycle in hard+soft edges.
Then proves the checks bite by feeding four broken graphs (negative self-test).
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(sys.argv[1] if len(sys.argv) > 1 else ".")
GRAPH = ROOT / "frameworks" / "framework_prereqs.draft.json"
CATALOGS = ["ord_roots", "mek_protocol", "las_taxonomy", "elf_taxonomy",
            "xyz_traps", "kva_traps", "nog_traps", "dtk_tactics"]


def catalog(base):
    ids, order = {}, {}
    for name in CATALOGS:
        for i, e in enumerate(json.loads((base / f"{name}.json").read_text(encoding="utf-8"))["entries"]):
            ids[e["id"]] = name
            order[e["id"]] = i
    return ids, order


def problems(edges, known):
    out, seen = [], set()
    for k, e in enumerate(edges):
        if set(e) != {"from", "to", "reason", "strength"}:
            out.append(f"edge {k}: keys {sorted(e)}")
        if e.get("strength") not in ("hard", "soft"):
            out.append(f"edge {k}: strength {e.get('strength')!r}")
        reason = e.get("reason")
        if not isinstance(reason, str) or not reason.strip() or "\n" in reason:
            out.append(f"edge {k}: reason must be one non-empty line")
        for end in ("from", "to"):
            if e.get(end) not in known:
                out.append(f"edge {k}: unknown id {e.get(end)!r}")
        if e.get("from") == e.get("to"):
            out.append(f"edge {k}: self-loop {e.get('from')}")
        pair = (e.get("from"), e.get("to"))
        if pair in seen:
            out.append(f"edge {k}: duplicate {pair}")
        seen.add(pair)
    # Kahn's algorithm over hard+soft: leftover nodes sit on a cycle.
    succ, indeg = defaultdict(list), defaultdict(int)
    nodes = {n for e in edges for n in (e.get("from"), e.get("to"))}
    for e in edges:
        succ[e.get("from")].append(e.get("to"))
        indeg[e.get("to")] += 1
    queue = [n for n in nodes if indeg[n] == 0]
    done = 0
    while queue:
        n = queue.pop()
        done += 1
        for m in succ[n]:
            indeg[m] -= 1
            if indeg[m] == 0:
                queue.append(m)
    if done != len(nodes):
        out.append(f"cycle among {sorted(n for n in nodes if indeg[n] > 0)}")
    return out


graph = json.loads(GRAPH.read_text(encoding="utf-8"))
edges = graph["edges"]
canon, order = catalog(ROOT / "frameworks")
app_copy, _ = catalog(ROOT / "app" / "public" / "frameworks")
print(f"catalog ids: frameworks/={len(canon)} app/public/frameworks/={len(app_copy)} "
      f"identical_id_sets={set(canon) == set(app_copy)}")
errs = problems(edges, set(canon)) + [f"missing in app copy: {e[k]}" for e in edges for k in ("from", "to")
                                      if e[k] in canon and e[k] not in app_copy]
hard = [e for e in edges if e["strength"] == "hard"]
print(f"edges={len(edges)} hard={len(hard)} soft={len(edges) - len(hard)} "
      f"nodes_touched={len({n for e in edges for n in (e['from'], e['to'])})}")
pairs = defaultdict(int)
for e in edges:
    pairs[f"{canon.get(e['from'])}->{canon.get(e['to'])}"] += 1
print("by catalog pair:", dict(sorted(pairs.items())))
same = [e for e in edges if canon.get(e["from"]) == canon.get(e["to"])]
against = [f"{e['from']}->{e['to']}" for e in same if order[e["from"]] > order[e["to"]]]
print(f"same-catalog edges={len(same)} against_catalog_order={against or 'none'}")
anc = defaultdict(set)
for e in hard:  # transitive hard ancestors, expanded to a fixpoint below
    anc[e["to"]].add(e["from"])
changed = True
while changed:
    changed = False
    for n in list(anc):
        extra = set().union(*(anc[p] for p in anc[n] if p in anc)) - anc[n]
        if extra:
            anc[n] |= extra
            changed = True
print("hard-gated nodes:", len(anc), "| multi-step chains:",
      {n: sorted(a) for n, a in sorted(anc.items()) if len(a) > 1})
print("RESULT:", "VALID" if not errs else "INVALID")
for msg in errs:
    print("  ERROR", msg)

broken = {
    "cycle": edges + [{"from": "KVA-TRAP-014", "to": "XYZ-TRAP-002", "reason": "x", "strength": "soft"}],
    "unknown id": edges + [{"from": "ORD-ROOT-999", "to": "LAS-TYPE-001", "reason": "x", "strength": "hard"}],
    "self-loop": edges + [{"from": "DTK-TACTIC-001", "to": "DTK-TACTIC-001", "reason": "x", "strength": "soft"}],
    "duplicate": edges + [dict(edges[0])],
}
caught = sum(bool(problems(g, set(canon))) for g in broken.values())
print(f"negative self-test: {caught}/{len(broken)} broken graphs rejected",
      {k: problems(g, set(canon))[-1] for k, g in broken.items()})
sys.exit(0 if not errs and caught == len(broken) else 1)
```

- **Citation check.** 2026-10-07: every `file:line` in both documents resolves to
  an existing line range.
  - Checker: scratchpad `check_citations.py`, final sha256
    `251480d38a2e864d89e8d3b178f6197e046aceb56780b02282930de3d8107fef`. The final
    version only adds the two `scripts/` paths to its known-file list.
  - Proposal (sha256
    `309fb64bd4bfc34a7511e86190ebf4337e6e6a1f4335c16cf2ea6a3df342fc70`):
    `citations checked: 72; problems: 0`, after fixing one ambiguous
    `frameworkProgress.ts` short path.
  - This worklog: `citations checked: 149; problems: 0`.
  - Quoted Swedish source strings were checked by hand against the cited lines.
- **Not run.** No app or worker tests: no source code changed, and the draft JSON is
  not loaded by any code path.

## Handoff

- **Status.** Ready for owner review. All three deliverables are uncommitted. HEAD
  is unchanged at `6a4511431652d0b66fd1ea2523807f286f3d772d`.
- **Owner decisions needed.** Questions 1–7 in the proposal:
  1. hard threshold
  2. pull-forward or skip for blocked candidates
  3. twins hard or soft
  4. section basics
  5. unauthored candidates
  6. data fixes
  7. drop "ORD before LÄS" and confirm the file location
- **After approval.** Rename the file to `frameworks/framework_prereqs.json`, add the
  `app/public/frameworks/` copy, and have hpf-0026.2 implement the loader (same
  checks as the validator) plus the eligibility filter. Update 26.2's test strategy
  to replace the ORD→LÄS case.

## Bead note

Drafted frameworks/framework_prereqs.draft.json (29 edges: 21 hard incl. 14 authored XYZ→KVA twins, 8 soft; no ORD/DTK edges; "ORD before LÄS" dropped) and docs/framework-prereqs-proposal.md (hard = no intro while prereq untaught; 7 owner questions); validator VALID on 221 ids, acyclic; uncommitted, owner approval required.
LANE DONE: hpf-yv5e
