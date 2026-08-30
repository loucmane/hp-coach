# Bead hpf-nqzf Report-only shadow evidence pilot for adjudicated HPFetcher batch – Implementation Notes

## Planned Workstreams
- Project-owned profile: `.gas-city-evidence.json` binds project/rig identity and two report-only lanes.
- Blind bundles: deterministic builders expose passage, stem, and options while structurally removing `key`, `rationale`, `generator_meta`, and `family` fields.
- Lane contracts: tracked prompts, rubrics, and JSON schemas define evidence-only blind-solver and adversarial-audit reports without reproducing HPFetcher promotion semantics.
- Pilot target: batch 13 is the latest adjudication-frozen main-branch batch; batch 14 is rejected by the builder precondition.
- Verification: focused stdlib/pytest fixtures are part of hosted CI's workflow-contract job.

## Remaining

- Commit the profile/assets at a clean frozen subject head.
- Freeze the run manifest and bind canonical external/full-visibility/authoritative inputs.
- Obtain and read back Fable's sealed full-visibility report before worker dispatch.
- Collect only declared lane reports, compare evidence, and prove authoritative bytes and process residue unchanged.
