"""Structural contract tests for the auto-merge workflow wiring.

Scope note (2026-08-10): this file used to assert that certain strings appeared
in the workflow. Vocabulary presence proves nothing about behaviour — a guard
can mention `mergeStateStatus` and still accept BEHIND. Those assertions moved
to test_auto_merge_behavior.py, which executes the merge script against a
stubbed `gh` and checks what it actually decides.

What remains here is genuinely structural: the workflow must wake on the right
events, must delegate to an executable script (so the logic is testable at
all), and must not hand itself more permissions than the contract needs.

Run:  python3 -m pytest .github/contract-tests -q
"""

from __future__ import annotations

import os
import re
import stat
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "auto-merge.yml"
SCRIPT = ROOT / ".github" / "scripts" / "auto-merge.sh"
REVIEW_STATUS_CONTEXT = "codex/exact-head-review"


@pytest.fixture(scope="module")
def doc() -> dict:
    return yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def triggers(doc: dict) -> dict:
    # PyYAML parses the bare `on:` key as the boolean True.
    return doc.get(True, doc.get("on"))


@pytest.fixture(scope="module")
def merge_job(doc: dict) -> dict:
    jobs = doc.get("jobs", {})
    assert "merge" in jobs, "auto-merge.yml must define a 'merge' job"
    return jobs["merge"]


@pytest.fixture(scope="module")
def script_text() -> str:
    if not SCRIPT.exists():
        pytest.fail(f"{SCRIPT.relative_to(ROOT)} must exist and hold the merge logic")
    return SCRIPT.read_text(encoding="utf-8")


# ------------------------------------------------------------- wake matrix
def test_status_event_is_a_wake_path(triggers: dict):
    assert "status" in triggers, (
        "a codex/exact-head-review status arriving last must wake evaluation"
    )


def test_ci_and_preview_completion_both_retry(triggers: dict):
    wf = triggers.get("workflow_run", {}).get("workflows", [])
    assert "CI" in wf and "Preview" in wf, f"CI and Preview must both retry; got {wf}"


def test_label_remains_a_wake_path(triggers: dict):
    assert "labeled" in triggers.get("pull_request", {}).get("types", [])


def test_job_condition_admits_all_three_orderings(merge_job: dict):
    cond = merge_job.get("if", "")
    assert "status" in cond and REVIEW_STATUS_CONTEXT in cond, (
        "the job condition must admit a successful review status event"
    )
    assert "workflow_run" in cond and "pull_request" in cond, (
        "the job condition must still admit CI/Preview completion and labelling"
    )


# --------------------------------------------------- testability of logic
def test_logic_lives_in_an_executable_script(script_text: str):
    assert SCRIPT.exists()
    mode = SCRIPT.stat().st_mode
    assert mode & stat.S_IEXEC, f"{SCRIPT.name} must be executable"
    assert len(script_text.splitlines()) > 20, "the merge logic must live in the script"


def test_workflow_delegates_to_the_script(merge_job: dict):
    runs = "\n".join(s.get("run", "") for s in merge_job.get("steps", []))
    assert "auto-merge.sh" in runs, "the workflow must call .github/scripts/auto-merge.sh"


def test_script_reads_context_from_env_not_actions_expressions(script_text: str):
    assert "${{" not in script_text, (
        "the script must take GitHub context via environment variables so it can "
        "run outside Actions; ${{ }} expressions would make it untestable"
    )


def test_workflow_passes_the_required_context(merge_job: dict):
    env_blocks = " ".join(str(s.get("env", "")) for s in merge_job.get("steps", []))
    for var in ("EVENT_NAME", "REPO", "STATUS_SHA", "STATUS_CONTEXT", "STATUS_STATE"):
        assert var in env_blocks, f"the workflow must pass {var} to the script"


# ------------------------------------------------------- guard semantics
def test_merge_state_guard_requires_exact_clean(script_text: str):
    """Must compare against CLEAN, not merely exclude DIRTY."""
    assert re.search(r'MERGE_STATE"?\s*!=\s*"?CLEAN', script_text), (
        'the guard must require MERGE_STATE == "CLEAN" exactly; excluding only '
        "DIRTY admits BEHIND, BLOCKED, UNSTABLE and HAS_HOOKS"
    )
    assert not re.search(r'MERGE_STATE"?\s*=\s*"?DIRTY', script_text), (
        "the old not-DIRTY guard must be gone"
    )


def test_thread_check_is_complete_or_fails_closed(script_text: str):
    assert "hasNextPage" in script_text, (
        "the review-thread check must observe pageInfo.hasNextPage and fail "
        "closed, or paginate the full connection"
    )


def test_permissions_are_scoped(merge_job: dict):
    perms = merge_job.get("permissions", {})
    assert perms.get("contents") == "write" and perms.get("pull-requests") == "write"


def test_squash_and_head_pin_preserved(script_text: str):
    assert "--squash" in script_text
    assert "--match-head-commit" in script_text


def test_deploy_requires_separate_authorization(script_text: str):
    if "deploy.yml" in script_text:
        assert "deploy-approved" in script_text
