"""BEHAVIOURAL contract tests for the auto-merge decision logic.

These supersede vocabulary-presence checking. Instead of asserting that a
string appears in the workflow, they EXECUTE the merge script against a stubbed
`gh` and assert what it actually decides.

Defects pinned here (review of head 9a4c6ff, 2026-08-09):

  1. WAKE PATHS. A successful `codex/exact-head-review` status did not wake
     anything, so a review landing last stranded the PR forever. Preview
     completion did not retry either. All orderings of review / label / checks
     must converge.
  2. EXACT CLEAN. The guard rejected only `DIRTY`, so BEHIND / BLOCKED /
     UNSTABLE / HAS_HOOKS passed as "clean enough". Must require
     `MERGE_STATE == CLEAN` exactly.
  3. COMPLETE THREAD CHECK. `reviewThreads(first:100)` silently ignored a
     101st thread. Must paginate or fail closed on `hasNextPage`.

Defect pinned here from LIVE evidence (run 31486935846, 2026-08-11):

  4. SELF-DEADLOCK. Fixing defect 2 created a new stranding path. A
     `pull_request`-triggered merge job is itself a check run on the PR head,
     so while it evaluates, GitHub reports the head as UNSTABLE ("a non-required
     check is pending") and the job refuses ITSELF. Re-labelling cannot help:
     every new run adds a fresh pending check. The recorded refusal was

         PR #363 pinned head: 6fa8e115...
         ::notice::PR #363 mergeStateStatus=UNSTABLE (not CLEAN). Not merging.

     UNSTABLE is therefore admissible, but ONLY when proven self-caused, and
     the proof must be exact:
       - the wake path is `pull_request` (status / workflow_run runs are not
         check runs on the head, so UNSTABLE there is genuinely foreign);
       - every commit-status context at the pinned SHA is successful (another
         status context could equally have caused UNSTABLE);
       - exactly one check run at the SHA is non-green — an ambiguous count is
         a refusal, not a judgement call;
       - that check belongs to THIS workflow run, identified by run id, never
         by the reusable job name `merge`;
       - and it is queued / in_progress, never failed or cancelled.

Requires the merge logic to live in an executable script so it can be run
outside GitHub Actions. Run:
    python3 -m pytest .github/contract-tests -q
"""

from __future__ import annotations

import os
import stat
import subprocess
import textwrap
from pathlib import Path

import pytest
import yaml

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "auto-merge.yml"
SCRIPT = ROOT / ".github" / "scripts" / "auto-merge.sh"

HEAD_SHA = "9a4c6ffc95cdc927b80f862a85fea762bf516be9"
OTHER_SHA = "1348012e6ff2d8070d688424fc322a8674ce25da"
TREE = "f6950e534a76bdfef541175c56108740f25d2e2c"
MERGE_SHA = "c1643a67cb030cf14b80ad993d0a0e6a2a3e9cbd"

# Shapes taken from the live refusal (run 31486935846 on head 6fa8e115...).
RUN_ID = "31486935846"
SELF_CHECK = "93536429331"     # the `merge` check run created BY that run
FOREIGN_CHECK = "93536107936"  # `app · typecheck · lint · test · build · e2e`


# --------------------------------------------------------------- stub `gh`
def _write_stub(tmp: Path, scenario: dict) -> Path:
    """A fake `gh` that answers from `scenario` and logs every invocation.

    It answers both the pre-fix query shapes and the post-fix ones, so the same
    scenarios can be run against either revision of the script. That is what
    makes the red commit legible: only the genuinely new expectations fail.
    """
    bindir = tmp / "bin"
    bindir.mkdir(parents=True, exist_ok=True)
    log = tmp / "gh.log"
    stub = bindir / "gh"
    stub.write_text(
        textwrap.dedent(f"""\
        #!/usr/bin/env python3
        import sys, pathlib
        argv = sys.argv[1:]
        joined = " ".join(argv)
        pathlib.Path({str(log)!r}).open("a").write(joined + "\\n")
        S = {scenario!r}

        def out(v):
            print(v)
            sys.exit(0)

        if argv[:2] == ["pr", "merge"]:
            out("")
        if argv[:2] == ["workflow", "run"]:
            out("")
        if "graphql" in joined:
            out(S["threads"])                       # "<unresolved> <hasNext>"
        if "/jobs" in joined:
            out(S.get("self_ids", ""))              # check-run ids of THIS run
        if "/check-runs" in joined:
            if "all(" in joined:
                out(S.get("checks_green", "true"))  # pre-fix aggregate shape
            out(S.get("check_runs", ""))            # "<id> <status> <concl> <name>"
        if "/status" in joined:
            if "select(.context" in joined:
                sha = [a for a in argv if "commits/" in a][0].split("commits/")[1].split("/")[0]
                out(S["review_status"].get(sha, "missing"))
            out(S.get("status_combined", "success"))
        if joined.endswith("commits/" + {MERGE_SHA!r}) or {MERGE_SHA!r} in joined:
            out(S.get("merged_tree", {TREE!r}))
        if "commits/" in joined:
            out(S.get("reviewed_tree", {TREE!r}))
        if "headRefOid" in joined:
            out(S["head_sha"])
        if "mergeStateStatus" in joined:
            out(S["merge_state"])
        if "mergeable" in joined:
            out(S["mergeable"])
        if "labels" in joined:
            out(S["labels"])
        if "mergeCommit" in joined:
            out({MERGE_SHA!r})
        if argv[:2] == ["pr", "list"] or "/pulls" in joined:
            out(S.get("pr", "363"))
        out("")
        """)
    )
    stub.chmod(stub.stat().st_mode | stat.S_IEXEC)
    return log


def _run(tmp: Path, scenario: dict, **env_over) -> tuple[str, str]:
    """Execute the merge script; return (stdout, gh invocation log)."""
    if not SCRIPT.exists():
        pytest.fail(
            "merge logic must live in an executable .github/scripts/auto-merge.sh "
            "so its behaviour can be tested outside GitHub Actions"
        )
    log = _write_stub(tmp, scenario)
    env = {
        **os.environ,
        "PATH": f"{tmp/'bin'}:{os.environ['PATH']}",
        "GH_TOKEN": "stub",
        "REPO": "loucmane/hp-coach",
        "OWNER": "loucmane",
        "JOB_NAME": "merge",
        "RUN_ID": RUN_ID,
        "EVENT_NAME": "status",
        "STATUS_SHA": HEAD_SHA,
        "STATUS_CONTEXT": "codex/exact-head-review",
        "STATUS_STATE": "success",
        "WR_BRANCH": "chore/record-merge-delegation",
        "PR_NUMBER": "363",
        **env_over,
    }
    p = subprocess.run(["bash", str(SCRIPT)], capture_output=True, text=True, env=env, timeout=60)
    return p.stdout + p.stderr, (log.read_text() if log.exists() else "")


def _ok(**over) -> dict:
    s = {
        "pr": "363",
        "head_sha": HEAD_SHA,
        "labels": "auto-merge",
        "review_status": {HEAD_SHA: "success"},
        "status_combined": "success",
        "checks_green": "true",
        "check_runs": f"{FOREIGN_CHECK} completed success app · typecheck · lint",
        "self_ids": "",
        "mergeable": "MERGEABLE",
        "merge_state": "CLEAN",
        "threads": "0 false",
        "reviewed_tree": TREE,
        "merged_tree": TREE,
    }
    s.update(over)
    return s


def _self_caused(**over) -> dict:
    """The exact live shape: our own check pending, everything else green."""
    base = {
        "merge_state": "UNSTABLE",
        "check_runs": (
            f"{FOREIGN_CHECK} completed success app · typecheck · lint\n"
            f"{SELF_CHECK} in_progress none merge"
        ),
        "self_ids": SELF_CHECK,
    }
    base.update(over)
    return _ok(**base)


def _merged(log: str) -> bool:
    return any(l.startswith("pr merge") for l in log.splitlines())


# ------------------------------------------------- happy path still merges
def test_merges_when_every_gate_is_satisfied(tmp_path):
    _, log = _run(tmp_path, _ok())
    assert _merged(log), "a fully compliant PR must still merge"
    merge_line = [l for l in log.splitlines() if l.startswith("pr merge")][0]
    assert "--match-head-commit" in merge_line and HEAD_SHA in merge_line
    assert "--squash" in merge_line


def test_deploy_not_dispatched_without_label(tmp_path):
    _, log = _run(tmp_path, _ok())
    assert not any("workflow run" in l for l in log.splitlines()), (
        "merging must not imply deploying"
    )


def test_deploy_dispatched_only_with_deploy_approved(tmp_path):
    _, log = _run(tmp_path, _ok(labels="auto-merge,deploy-approved"))
    assert any("workflow run" in l for l in log.splitlines())


# ----------------------------------------------------- defect 1: wake paths
def test_status_event_wakes_and_resolves_pr_from_event_sha(tmp_path):
    out, log = _run(tmp_path, _ok(), EVENT_NAME="status")
    assert _merged(log), (
        "a successful codex/exact-head-review status must wake merge evaluation "
        "and resolve the PR from the event SHA; otherwise a review landing last "
        "strands the PR"
    )


def test_workflow_run_event_wakes(tmp_path):
    _, log = _run(tmp_path, _ok(), EVENT_NAME="workflow_run")
    assert _merged(log)


def test_label_event_wakes(tmp_path):
    _, log = _run(tmp_path, _ok(), EVENT_NAME="pull_request")
    assert _merged(log)


def test_workflow_triggers_cover_status_ci_preview_and_label():
    doc = yaml.safe_load(WORKFLOW.read_text(encoding="utf-8"))
    on = doc.get(True, doc.get("on"))
    assert "status" in on, "a status event must wake merge evaluation"
    wf = on.get("workflow_run", {}).get("workflows", [])
    assert "CI" in wf and "Preview" in wf, (
        f"both CI and Preview completion must retry evaluation; got {wf}"
    )
    assert "labeled" in on.get("pull_request", {}).get("types", [])


# --------------------------------------------------- defect 2: exact CLEAN
@pytest.mark.parametrize("state", ["BEHIND", "BLOCKED", "UNSTABLE", "HAS_HOOKS", "DIRTY", "UNKNOWN"])
def test_refuses_any_merge_state_other_than_clean(tmp_path, state):
    """Default wake path here is `status`, where UNSTABLE has no self excuse."""
    _, log = _run(tmp_path, _ok(merge_state=state))
    assert not _merged(log), (
        f"mergeStateStatus={state} is not CLEAN and must block the merge; "
        "rejecting only DIRTY lets BEHIND/BLOCKED/UNSTABLE through"
    )


def test_refuses_when_mergeable_is_not_mergeable(tmp_path):
    _, log = _run(tmp_path, _ok(mergeable="CONFLICTING"))
    assert not _merged(log)


# ------------------------------------------------ defect 3: thread coverage
def test_fails_closed_when_review_threads_have_another_page(tmp_path):
    _, log = _run(tmp_path, _ok(threads="0 true"))
    assert not _merged(log), (
        "zero unresolved on page 1 with hasNextPage=true does not prove zero "
        "unresolved overall — must paginate or fail closed"
    )


def test_refuses_with_unresolved_threads(tmp_path):
    _, log = _run(tmp_path, _ok(threads="2 false"))
    assert not _merged(log)


# ------------------------------------------------- defect 4: self-deadlock
def test_accepts_unstable_proven_self_caused_on_the_label_path(tmp_path):
    """The live shape from run 31486935846 must converge, not strand.

    Every external gate passed; the only thing keeping the head out of CLEAN
    was this very job's own pending check. Refusing here is a permanent
    stranding, because each retry recreates the same pending check.
    """
    out, log = _run(tmp_path, _self_caused(), EVENT_NAME="pull_request")
    assert _merged(log), (
        "UNSTABLE caused solely by this run's own in-flight check must not "
        "block the merge; every retry reproduces it, so this strands the PR "
        f"forever. Script said:\n{out}"
    )


def test_unstable_self_excuse_does_not_apply_to_the_status_path(tmp_path):
    _, log = _run(tmp_path, _self_caused(), EVENT_NAME="status")
    assert not _merged(log), (
        "a status-triggered run is not a check run on the head, so UNSTABLE "
        "there is foreign and must still refuse"
    )


def test_unstable_self_excuse_does_not_apply_to_the_workflow_run_path(tmp_path):
    _, log = _run(tmp_path, _self_caused(), EVENT_NAME="workflow_run")
    assert not _merged(log), (
        "a workflow_run-triggered run is not a check run on the head, so "
        "UNSTABLE there is foreign and must still refuse"
    )


def test_unstable_refuses_when_a_commit_status_context_is_not_successful(tmp_path):
    """A second status context can cause UNSTABLE just as easily as our check."""
    _, log = _run(
        tmp_path,
        _self_caused(status_combined="pending"),
        EVENT_NAME="pull_request",
    )
    assert not _merged(log), (
        "with a non-successful commit status at the head, UNSTABLE is not "
        "proven self-caused"
    )


def test_unstable_refuses_when_more_than_one_check_is_non_green(tmp_path):
    """An ambiguous count is a refusal, never a judgement call."""
    scenario = _self_caused()
    scenario["check_runs"] += f"\n{FOREIGN_CHECK}9 in_progress none deploy preview"
    _, log = _run(tmp_path, scenario, EVENT_NAME="pull_request")
    assert not _merged(log), (
        "two non-green checks cannot prove that OUR check is the cause"
    )


def test_unstable_refuses_when_the_pending_check_belongs_to_another_run(tmp_path):
    """Name-matching is not identity: another run's `merge` check is foreign."""
    _, log = _run(
        tmp_path,
        _self_caused(self_ids="777777777"),
        EVENT_NAME="pull_request",
    )
    assert not _merged(log), (
        "the pending check must be identified by THIS run's id; a check that "
        "merely shares the reusable job name `merge` is another run's"
    )


@pytest.mark.parametrize("concl", ["failure", "cancelled", "timed_out"])
def test_unstable_refuses_when_our_own_check_did_not_pass(tmp_path, concl):
    scenario = _self_caused()
    scenario["check_runs"] = (
        f"{FOREIGN_CHECK} completed success app · typecheck · lint\n"
        f"{SELF_CHECK} completed {concl} merge"
    )
    _, log = _run(tmp_path, scenario, EVENT_NAME="pull_request")
    assert not _merged(log), (
        f"our own check ending {concl} is a failure, not an in-flight excuse"
    )


def test_gate_two_identifies_our_check_by_run_id_not_by_job_name(tmp_path):
    """Isolate gate 2: hold the merge state CLEAN so only gate 2 can refuse.

    A non-green check that shares the reusable job name `merge` but belongs to
    a different workflow run is an ordinary foreign failure and must block.
    """
    _, log = _run(
        tmp_path,
        _ok(
            check_runs=f"{FOREIGN_CHECK} completed failure merge",
            self_ids=SELF_CHECK,
        ),
        EVENT_NAME="pull_request",
    )
    assert not _merged(log), (
        "excluding checks by job name lets another run's failing `merge` check "
        "pass as green; exclusion must be by run id"
    )


def test_clean_still_merges_without_any_self_check_present(tmp_path):
    """CLEAN remains the ordinary path; the exception must not become the rule."""
    _, log = _run(tmp_path, _ok(), EVENT_NAME="pull_request")
    assert _merged(log)


# ------------------------------------- approved properties must still hold
def test_refuses_without_review_status_at_head(tmp_path):
    _, log = _run(tmp_path, _ok(review_status={}))
    assert not _merged(log)


def test_review_status_on_a_different_sha_does_not_count(tmp_path):
    _, log = _run(tmp_path, _ok(review_status={OTHER_SHA: "success"}))
    assert not _merged(log), "an attestation for another commit must not authorize this head"


def test_refuses_when_checks_not_green(tmp_path):
    _, log = _run(
        tmp_path,
        _ok(checks_green="false", check_runs=f"{FOREIGN_CHECK} completed failure app · e2e"),
    )
    assert not _merged(log)


def test_refuses_without_auto_merge_label(tmp_path):
    _, log = _run(tmp_path, _ok(labels="something-else"))
    assert not _merged(log)


def test_post_merge_tree_mismatch_is_an_error(tmp_path):
    out, log = _run(tmp_path, _ok(merged_tree="0000000000000000000000000000000000000000"))
    assert _merged(log)
    assert "::error" in out or "!=" in out, "a tree mismatch after merge must fail loudly"
