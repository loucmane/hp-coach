"""Contract tests for .github/workflows/auto-merge.yml.

WHY THIS FILE EXISTS — the red witness (2026-08-09).

CLAUDE.md/AGENTS.md record a merge delegation: an ordinary PR may merge without
an operator prompt only after an INDEPENDENT EXACT-HEAD review passes and the
head-bound mechanical gates are green. The automation did not enforce any of
that. PR #361 is the live proof: the auto-merge workflow merged it ~12 seconds
after CI turned green, with no exact-head review attestation, and then
immediately dispatched a production deployment. The post-merge audit happened to
come out clean (merged tree byte-equal to the signed head, conflict resolutions
correct), so no rollback was requested — but the process, not the outcome, was
the defect.

A documented contract that the automation contradicts is worse than no contract:
it reads as a guarantee while behaving as a rubber stamp. These tests pin each
gap so the workflow cannot silently regress to "merge when CI is green".

Run:  python3 -m pytest .github/contract-tests -q
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml

WORKFLOW = Path(__file__).resolve().parents[1] / "workflows" / "auto-merge.yml"
REVIEW_STATUS_CONTEXT = "codex/exact-head-review"
DEPLOY_APPROVAL_LABEL = "deploy-approved"


@pytest.fixture(scope="module")
def raw() -> str:
    return WORKFLOW.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def doc() -> dict:
    return yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def merge_script(doc: dict) -> str:
    """Concatenated run: bodies of the merge job — the executable contract."""
    jobs = doc.get("jobs", {})
    steps = jobs.get("merge", {}).get("steps", [])
    return "\n".join(s.get("run", "") for s in steps)


# --------------------------------------------------------------- defect 1
def test_requires_exact_head_review_status(merge_script: str):
    """An exact-head review attestation must gate the merge.

    Defect: the merge proceeded on CI success alone, so 'independent review'
    existed only in prose.
    """
    assert REVIEW_STATUS_CONTEXT in merge_script, (
        f"merge must require the {REVIEW_STATUS_CONTEXT!r} commit status; "
        "CI success alone is not an independent review"
    )


def test_review_status_is_bound_to_the_head_sha(merge_script: str):
    """The attestation must be read from the PR's CURRENT head SHA.

    A review status attached to any other commit proves nothing about what is
    being merged; a new push must invalidate it by construction.
    """
    assert re.search(r"commits/\$\{?SHA\}?/(status|statuses)", merge_script), (
        "the review status must be queried at repos/<repo>/commits/$SHA/status "
        "so it is bound to the exact head being merged"
    )


# --------------------------------------------------------------- defect 2
def test_merge_pins_the_reviewed_head(merge_script: str):
    """`gh pr merge` must pin --match-head-commit.

    Without the pin there is a TOCTOU window: a push landing between the green
    check and the merge call would be merged unreviewed.
    """
    assert "--match-head-commit" in merge_script, (
        "gh pr merge must pass --match-head-commit \"$SHA\" so a race cannot "
        "merge a different commit than the one that was checked and reviewed"
    )


# --------------------------------------------------------------- defect 3
def test_requires_clean_mergeability(merge_script: str):
    assert "mergeStateStatus" in merge_script or "mergeable" in merge_script, (
        "merge must verify mergeability is clean before merging"
    )


# --------------------------------------------------------------- defect 4
def test_requires_zero_unresolved_review_threads(merge_script: str):
    assert "reviewThreads" in merge_script or "isResolved" in merge_script, (
        "merge must verify there are zero unresolved review threads"
    )


# --------------------------------------------------------------- defect 5
def test_deployment_is_not_dispatched_unconditionally(merge_script: str):
    """Production deployment must not ride along with a merge.

    Defect: every auto-merge ran `gh workflow run deploy.yml`, so merging was
    deploying. Deployment is an operator-owned boundary and needs its own
    explicit authorization.
    """
    dispatches_deploy = "deploy.yml" in merge_script
    if dispatches_deploy:
        assert DEPLOY_APPROVAL_LABEL in merge_script, (
            "deploy dispatch must be gated on the explicit "
            f"{DEPLOY_APPROVAL_LABEL!r} label; merging must never imply deploying"
        )


def test_merge_succeeds_even_when_deploy_is_not_authorized(merge_script: str):
    """Absent the approval label, the merge still completes and deploy is skipped."""
    if "deploy.yml" not in merge_script:
        return  # deployment removed entirely — contract satisfied
    window = merge_script[merge_script.index(DEPLOY_APPROVAL_LABEL):]
    assert re.search(r"(if\s|\[\[|\[\s)", window), (
        "the deploy dispatch must sit behind a conditional on the approval "
        "label, not run unconditionally after merge"
    )


# ------------------------------------------------------- structural safety
def test_still_requires_the_auto_merge_label(merge_script: str, raw: str):
    assert "auto-merge" in raw, "the auto-merge label gate must be preserved"


def test_workflow_parses_and_defines_a_merge_job(doc: dict):
    assert "merge" in doc.get("jobs", {}), "auto-merge.yml must define a 'merge' job"


def test_merge_is_squash(merge_script: str):
    assert "--squash" in merge_script, "merges must remain squash merges"


def test_post_merge_tree_equivalence_proof(merge_script: str):
    """After merging, prove the merged tree equals the reviewed source tree."""
    assert re.search(r"\^\{tree\}|\{tree\}|tree_sha|merged tree", merge_script), (
        "workflow must prove post-merge that the merged tree equals the "
        "reviewed head's tree"
    )
