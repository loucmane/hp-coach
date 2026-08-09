# Taskmaster to Beads authority cutover

Date: 2026-08-09

## Decision

Beads is the sole task authority for hpfetcher from this cutover forward. The
complete authoritative Taskmaster `master` graph was imported once. The
Taskmaster source is frozen historical evidence and must never be edited,
regenerated, or re-imported. The legacy Aegis workflow is likewise preserved
but is no longer a control plane.

This was a complete-history migration, not an unfinished-work filter. Closed,
cancelled, and deferred records remain in Beads with source provenance.

## Frozen source identity

- Repository: `/home/loucmane/dev/hpfetcher`
- Branch: `p5/law16-real-entity`
- Fetchable source head: `b7ef95776d8bed5dabc3561ed2384ae207232add`
- Authoritative tag: `master` (the only tag in the source)
- Top-level tasks: 92
- Subtasks: 275
- Total records: 367
- Frozen `tasks.json` SHA-256:
  `0b52e1e97b6d9a1ac1ae1de28ac5495bcc898946d957601cf411e04241e1a23b`
- Frozen PRD SHA-256:
  `f8e02723b96415a9bbb47f820619488adcad7908ff865644a50b4cc62acc82d5`
- Pre-cutover residue manifest SHA-256:
  `9f30bc157b9bbed82050569cd9018e4a3e6fc6e4e320773eb79a9211fe3d7a41`

The residue manifest covers 97 pre-existing untracked entries: 92 generated
Taskmaster task notes, two archived plans, and three SVG figures. They were
preserved in place and were neither cleaned nor adopted by this cutover.

## Native migration proof

The reviewed bridge ran from template head
`02e4937944e944983e374647f4581d8ff00e722e`, converter version `1.4.0`,
against native rig `hpfetcher` with prefix `hpf`.

- Empty export: 0 records, SHA-256
  `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Dry run: 367 accepted and 367 would be created; target stayed empty.
- First import: 367 reported created.
- Exact reconciliation: 367 identities and provenance rows, 394 blocker
  edges, 275 hierarchy edges, 81 closed, 11 deferred, and 275 open.
- Identical second import: Beads 1.1.0 reported the exact same 367 IDs as
  created and zero skipped, while both complete exports stayed byte-identical.
  This is the reviewed `replay-counted-as-created` compatibility form—not a
  second mutation.
- First/final/raw independent export SHA-256:
  `52216c70efbd9674417e071bc2e26a9a05e5707ad5a80d494f275993a619d850`.
- Canonical export SHA-256:
  `5e91dcc2fa7a461ab89b55175181de841cebb9757c08b9d2fa907f75a5cc74f9`.
- Semantic projection SHA-256:
  `43e61ea6744c7642c17b9a19a1326413bd5f49e9b7522962c38e43b7aeb00fec`.
- Conversion artifact-set SHA-256:
  `f226bd2ddb35408821a98050c961e60c5882feb656bddedcfa1e167e9d4856ce`.
- Successful migration receipt SHA-256:
  `88ebf33db221784aee2a4d67f856b67ae2d25ee07bc5cf82e50a78e0a27134a8`.

The first live invocation refused before mutation because its wrapper omitted
the inherited `BEADS_*` scrub. Its zero-byte owner-only receipt is preserved
with SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
The target was independently re-proven empty before the append-forward `r2`
run used the complete isolated environment.

## Continuation

All future task selection, status changes, dependency corrections, and
dispositions happen in native Beads through explicit `--rig hpfetcher`
routing. Historical source identities remain available as
`external_ref=taskmaster:master:<id>`. No migrated record is deleted merely to
tidy history, and there is no reverse sync to Taskmaster.
