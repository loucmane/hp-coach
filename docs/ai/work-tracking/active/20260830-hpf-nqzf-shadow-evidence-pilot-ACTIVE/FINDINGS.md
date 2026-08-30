# Findings

- 2026-08-30 — Batch 13 is the newest main-branch batch with all three freeze prerequisites:
  `status: COMPLETE`, `promote CLEAN`, and preserved adjudication/report artifacts. Batch 14 is
  intentionally ineligible until its own adjudication is complete.
- 2026-08-30 — Blindness must be constructed rather than requested. The builders copy only the
  candidate passage, title, section, question prompt, options, and stable indices into a fresh
  closed directory; they never expose keys, rationales, generator metadata, family labels, Git,
  or the batch's existing adjudication artifacts.
