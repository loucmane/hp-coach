---
bead: "hpf-e05m"
project: "hpfetcher"
session: "ci-t1i27"
status: "implementation_complete"
---

# Worklog — hpf-e05m

## Findings

- 2026-10-06: implementation follows the assigned brief at
  `/home/loucmane/vaults/main/GasCity/hpfetcher/Docs/briefs/hpf-e05m.md`
  and R1/R2 in the hpf-2nug review worklog. Starting HEAD is detached at
  `7d2e27c76583c30c0b52d133d48e1d1bde012c35`; no tracked changes existed.
- R1: `git log -p -- pipeline/synthetic/batches/batch16/verdicts.jsonl`
  identifies `96a6b50` as the last pre-GC-round version (154 records).
  `79e5ebf` replaced 35 mechanical records and appended 18 records, making
  172, including eight collisions between old and replacement ballot slots.
  The earlier 157-to-150 twin dedup and four G-REGISTER dispositions predate
  that round and belong in the restored base.
- R2: the original batch17 heading/body survives on `origin/main`
  (`d27d049c515eb52c7ccd75d3eb6ba5430859c3a0`). Git history orders the
  2026-08-31 package ruling (`dd106de`, 10:19 +0200) before reopening
  (`59a7cc6`, 10:53 +0200), then the three October 6 status entries.

## Decisions

- Restore batch16's canonical base byte-for-byte from `96a6b50`. Move all
  53 changed/new GC-round records, including the 42 mechanical passes,
  verbatim into `verdicts-gc-legs.jsonl`; merge base first, GC round second.
- Regenerate `report-final.json` from that merge. Preserve the old digest
  manifest as historical evidence and add a dated manifest binding the new
  base, re-gate input, merged-output digest, and regenerated report.
- Restore batch17's entire `origin/main` STATUS byte prefix. Append the
  August 31 package/reopening entries chronologically, preserving their
  text and all October 6 entries verbatim. No candidate or owner ruling changes.
- Per the corrected assignment, work only in the lane, leave edits
  uncommitted, and use no network, git writes, servers, or Gas City commands.
  This lane worklog is the required handoff destination.

## Progress

- Restored the 154-record base and split the 53 GC-round records. A temporary
  merge probe yields 164 records, 61 vote-bearing, 43 superseded, zero exact
  duplicates, zero unstamped twins. No evidence content was edited.
- Aggregation retains every per-unit status (5 SURVIVED_FLAGGED,
  2 SURVIVED_CLEAN, no DEAD/INCOMPLETE). The sole report change removes
  las-b16-003's superseded historical q2 G-STEM flag; its later GC flag is
  retained. The original flag remains in the restored base and git history.
- Restored batch17's original STATUS prefix and moved its August entries
  below the original body; October entries retain their bytes and order.

## Handoff

- Verification and final delivery evidence pending.

## Verification — 2026-10-06

The following commands ran with `PYTHONDONTWRITEBYTECODE=1`; all exited 0.
Temporary output directory: `/tmp/hpf-e05m-bmx_3bq0`.

```sh
python3 pipeline/synthetic/gates/scripts/merge_verdicts.py \
  pipeline/synthetic/batches/batch16/verdicts.jsonl \
  pipeline/synthetic/batches/batch16/verdicts-gc-legs.jsonl \
  --out /tmp/hpf-e05m-bmx_3bq0/verdicts-merged.jsonl
python3 pipeline/synthetic/gates/scripts/aggregate.py \
  /tmp/hpf-e05m-bmx_3bq0/verdicts-merged.jsonl \
  --candidates-dir pipeline/synthetic/batches/batch16/candidates-final \
  --json /tmp/hpf-e05m-bmx_3bq0/report-verified.json
python3 pipeline/synthetic/gates/scripts/promote.py \
  --batch-dir pipeline/synthetic/batches/batch16 \
  --verdicts /tmp/hpf-e05m-bmx_3bq0/verdicts-merged.jsonl \
  --candidates-dir pipeline/synthetic/batches/batch16/candidates-final \
  --require-clean
python3 pipeline/synthetic/gates/scripts/adjudicate_fold.py \
  --evidence-dir pipeline/synthetic/batches/batch16/adjudication-evidence \
  --candidates-dirs pipeline/synthetic/batches/batch16/candidates-final \
  --flags-file pipeline/synthetic/batches/batch16/adjudication-flags.json \
  --out /tmp/hpf-e05m-bmx_3bq0/adjudication.jsonl
python3 pipeline/synthetic/gates/scripts/check_sheet_sync.py \
  pipeline/synthetic/batches/batch17
python3 pipeline/synthetic/gates/scripts/check_assembly_dispositions.py \
  pipeline/synthetic/batches/batch17/ASSEMBLY.md \
  pipeline/synthetic/batches/batch17/verdicts.jsonl
python3 -m pytest .github/contract-tests pipeline/synthetic/evidence/tests \
  pipeline/synthetic/gates/scripts/tests -q -p no:cacheprovider
```

| Verification | Result |
|---|---|
| Ordered merge | 164 records; 61 vote-bearing; 43 superseded (35 mechanical + 8 judge); 0 duplicates/twins |
| Canonical base | Byte-identical to `96a6b50`; standalone merger also accepts all 154 records |
| GC evidence preservation | All original 172 verdict lines remain verbatim across the base and re-gate input; all 53 GC records survive the ordered merge |
| GC leg bundle comparison | New input equals the complete existing `verdicts-agardom-b16/*.jsonl` bundle after its eight unstamped twins collapse; all 42 mech passes retained |
| Aggregation | Same per-unit statuses: 5 SURVIVED_FLAGGED, 2 SURVIVED_CLEAN, 0 DEAD, 0 INCOMPLETE; regenerated report byte-reproducible |
| Promotion | 7 PASS, 0 HOLD |
| Adjudication fold | Byte-identical to existing `reviews/adjudication.jsonl`: 6 GODKANN_NOTED, only las-b16-003 AGARBLICK |
| Batch17 sheet sync | OK, 7 units |
| Batch17 assembly | OK, 0 markers, all discharged |
| Required pytest suite | 1,478 passed, 7 xfailed in 23.99s |

- Report detail, superseding the initial "sole report change" summary:
  only the old las-b16-003 q2 G-STEM flag leaves the flag set, and the
  retained GC q1/q2 flags move ahead of the language flags because the
  merger places replacements at their original slots. Other fields and
  all seven statuses are unchanged. Aggregation/promotion emit the existing
  elf-b15-002 orphan warning from a preserved cross-batch G-REGISTER
  disposition; both commands still succeed with the results above.
- The adjudication fold consumes unchanged evidence/flags/candidates,
  independently of the aggregate. Its historical 6+1 result does not
  replace the October 6 owner ruling of 7/7 GODKÄNN_NOTED.

### Digest record

Added `batch16/DIGESTS-agardom-2026-10-06-hpf-e05m.json`. It supersedes
only the current base/report bindings from `DIGESTS-agardom-hpf-gehr.json`,
adds the re-gate input and ordered-merge digest, and records the unchanged
fold digest. The old manifest remains byte-identical to HEAD; its old
verdict/report hashes were verified against `79e5ebf`. The new manifest's
four artifact bindings and merged-output hash all match local bytes.

| Artifact | SHA-256 |
|---|---|
| `verdicts.jsonl` | `6793ef214e9b7cf92ce7b1985428bd00305d7e662091dce9889071d7ad0757f4` |
| `verdicts-gc-legs.jsonl` | `bb650b09867c32a8034c210718b4a99cb7ef58892f3ea91ea29048fcd74e6034` |
| Ordered merged output | `c0ea9b8bb004797349e10c1d76ddfaec62784281dcb621f8086bec40439b747d` |
| `report-final.json` | `a6406229f82840867e57bb78732f6dd0a06106c68c0137285cae814c32221451` |
| `reviews/adjudication.jsonl` | `3a4c9bc45e2acde4afa99eee435329f65a3f338d49f05ec7c9c09167ab2accf2` |

### Append-forward and scope checks

For each of batch16/STATUS.md, batch16/ADJUDICATION.md, batch17/STATUS.md
and batch17/ADJUDICATION.md, checked both exact `origin/main` byte-prefix
preservation and `git diff --unified=0 origin/main -- <file>`: **zero
removed lines in all four files**. Batch16 STATUS and batch17 ADJUDICATION
were already compliant and are unchanged by this repair.

Batch17 STATUS line 1 is again the original heading verbatim. Every
previous nonblank STATUS line remains present, and all October entries
form a byte-identical suffix. The removals visible against HEAD are only
the verbatim August 31 entries moved below the original body, with package
ruling before reopening as proved by commit times; no historical text is lost.

`git diff --stat` covers only batch16/ and batch17/. The three new files
(not included by ordinary diff stat) are the dated batch16 manifest,
batch16 re-gate input, and this `docs/worklog/` note. `git diff --check`
is clean. No candidate, script, test, or other tracked path changed.

[S:ci-t1i27|W:hpf-e05m|H:R1-R2-verification|E:ordered merge; reproducible report/fold; 7/7 promote; sheet-sync and assembly OK; 1478 passed, 7 xfailed; four original protocol prefixes preserved]

## Handoff — completed 2026-10-06

This supersedes the earlier pending handoff. R1 and R2 are repaired and
verified in the lane, uncommitted and unstaged. HEAD remains detached at
`7d2e27c76583c30c0b52d133d48e1d1bde012c35`. The existing untracked runtime
and skill paths are preserved. The coordinator can commit these seven files
and obtain a new independent exact-head review; the earlier hpf-2nug HOLD
is not rewritten or represented as a new PASS. Beads/PR state is unchanged.
Publishing, import, and deployment remain outside this assignment.

## Bead note (pending)

R1/R2 fixed in the lane: batch16 base restored to 96a6b50; 53 GC records split into a later input; merge yields 164 records, same statuses and 6+1 fold. Report regenerated; dated digest added, old manifest preserved. Batch17 heading/history restored verbatim in chronological order; all four protocol diffs remove zero origin/main lines. Sheet sync/assembly OK; 1478 passed, 7 xfailed. Seven files uncommitted; new exact-head review pending.
LANE DONE: hpf-e05m
