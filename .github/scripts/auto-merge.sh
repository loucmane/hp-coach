#!/usr/bin/env bash
# Auto-merge decision logic for .github/workflows/auto-merge.yml.
#
# Lives in a script, not inline YAML, so its behaviour can be executed and
# asserted outside GitHub Actions (see .github/contract-tests/). It takes all
# GitHub context through the environment and uses no Actions template syntax.
#
# Contract (every gate evaluated against ONE pinned head SHA):
#   1. codex/exact-head-review status == success, read at that SHA
#   2. every check-run at that SHA that does NOT belong to this workflow run
#      completed successfully
#   3. mergeable == MERGEABLE
#   4. mergeStateStatus == CLEAN exactly (BEHIND/BLOCKED/HAS_HOOKS/DIRTY/
#      UNKNOWN are NOT clean — rejecting only DIRTY was the 2026-08-10 defect).
#      UNSTABLE is admitted ONLY when proven self-caused; see gate 4.
#   5. zero unresolved review threads across the COMPLETE connection; if the
#      connection has another page we fail closed rather than guess
#   6. gh pr merge --match-head-commit "$SHA" --squash
#   7. post-merge: merged tree must equal the reviewed tree
# Deployment is never implied by merging: it requires the deploy-approved label.
#
# Required env: EVENT_NAME REPO OWNER RUN_ID GH_TOKEN
# Optional env: WR_BRANCH PR_NUMBER STATUS_SHA STATUS_CONTEXT STATUS_STATE
set -euo pipefail

REVIEW_CONTEXT="codex/exact-head-review"
DEPLOY_LABEL="deploy-approved"
NAME="${REPO#*/}"

# ---- resolve the candidate PR from whichever event woke us ----------------
PR=""
case "$EVENT_NAME" in
  status)
    # A review attestation landing last must not strand the PR. Resolve the
    # open PR straight from the event's own SHA.
    if [ "${STATUS_CONTEXT:-}" != "$REVIEW_CONTEXT" ] || [ "${STATUS_STATE:-}" != "success" ]; then
      echo "status event is not a successful $REVIEW_CONTEXT — nothing to do."
      exit 0
    fi
    PR=$(gh pr list --repo "$REPO" --state open --search "${STATUS_SHA}" \
          --json number --jq '.[0].number // empty' || true)
    ;;
  workflow_run)
    PR=$(gh pr list --repo "$REPO" --head "${WR_BRANCH:-}" --state open \
          --json number --jq '.[0].number // empty' || true)
    ;;
  *)
    PR="${PR_NUMBER:-}"
    ;;
esac

if [ -z "$PR" ]; then
  echo "No open PR resolved for $EVENT_NAME — nothing to do."
  exit 0
fi

# ---- the auto-merge label is still the opt-in ----------------------------
LABELS_ALL=$(gh pr view "$PR" --repo "$REPO" --json labels --jq '[.labels[].name] | join(",")')
case ",$LABELS_ALL," in
  *,auto-merge,*) ;;
  *) echo "PR #$PR does not carry the auto-merge label — nothing to do."; exit 0 ;;
esac

# ---- pin ONE head SHA; every gate below is evaluated against it ----------
SHA=$(gh pr view "$PR" --repo "$REPO" --json headRefOid --jq '.headRefOid')
echo "PR #$PR pinned head: $SHA"

# ---- gate 1: independent exact-head review attestation -------------------
# Bound to $SHA by construction: a new commit is a new SHA, so a prior
# attestation cannot be inherited.
REVIEW=$(gh api "repos/$REPO/commits/$SHA/status" \
  --jq "[.statuses[] | select(.context == \"$REVIEW_CONTEXT\")] | map(.state) | first // \"missing\"")
if [ "$REVIEW" != "success" ]; then
  echo "::notice::PR #$PR head $SHA has no successful $REVIEW_CONTEXT (got: $REVIEW). Not merging."
  exit 0
fi

# ---- check-run facts at $SHA, fetched once -------------------------------
# One line per check: "<id> <status> <conclusion> <name...>". The name is last
# because real names contain spaces; only fields 1-3 are ever parsed.
CHECK_LINES=$(gh api "repos/$REPO/commits/$SHA/check-runs" --paginate \
  --jq '.check_runs[] | "\(.id) \(.status) \(.conclusion // "none") \(.name)"')

# This run's OWN check runs, resolved from the run id. Never from the job name:
# `merge` is reusable, so name-matching would silently excuse a DIFFERENT run's
# failing check. An id is an identity; a name is not.
SELF_IDS=$(gh api "repos/$REPO/actions/runs/$RUN_ID/jobs" --paginate \
  --jq '.jobs[] | .check_run_url | split("/") | last')

is_self() { [ -n "$SELF_IDS" ] && printf '%s\n' "$SELF_IDS" | grep -qx -- "$1"; }

NONGREEN=$(printf '%s\n' "$CHECK_LINES" \
  | awk 'NF && !($2 == "completed" && $3 == "success")')
TOTAL=$(printf '%s\n' "$CHECK_LINES" | awk 'NF' | wc -l)

# ---- gate 2: every check NOT owned by this run is green ------------------
if [ "$TOTAL" -eq 0 ]; then
  echo "No check runs reported at $SHA yet — deferring."
  exit 0
fi
FOREIGN_NONGREEN=0
while read -r cid _cstatus _crest; do
  [ -n "${cid:-}" ] || continue
  is_self "$cid" || FOREIGN_NONGREEN=$((FOREIGN_NONGREEN + 1))
done <<EOF
$NONGREEN
EOF
if [ "$FOREIGN_NONGREEN" -ne 0 ]; then
  echo "Checks on PR #$PR at $SHA are not all green ($FOREIGN_NONGREEN outstanding) — deferring."
  exit 0
fi

# ---- gate 3: mergeable ---------------------------------------------------
MERGEABLE=$(gh pr view "$PR" --repo "$REPO" --json mergeable --jq '.mergeable')
if [ "$MERGEABLE" != "MERGEABLE" ]; then
  echo "::notice::PR #$PR mergeable=$MERGEABLE. Not merging."
  exit 0
fi

# ---- gate 4: mergeStateStatus must be exactly CLEAN ----------------------
# ...with ONE proven exception. A pull_request-triggered run of this workflow is
# itself a check run on the PR head, so while it evaluates, GitHub reports the
# head as UNSTABLE ("a non-required check is pending") and the job refuses
# ITSELF — permanently, since every retry recreates the pending check. Live
# witness: run 31486935846 on PR #363 head 6fa8e115.
#
# UNSTABLE is therefore admitted only when all five facts prove WE are the
# cause. Any doubt — a foreign status context, an ambiguous count, a check we
# do not own, a check that already failed — is a refusal.
MERGE_STATE=$(gh pr view "$PR" --repo "$REPO" --json mergeStateStatus --jq '.mergeStateStatus')
if [ "$MERGE_STATE" != "CLEAN" ]; then
  if [ "$MERGE_STATE" != "UNSTABLE" ]; then
    echo "::notice::PR #$PR mergeStateStatus=$MERGE_STATE (not CLEAN). Not merging."
    exit 0
  fi

  # (a) only a pull_request run is a check on the head; elsewhere UNSTABLE is foreign.
  if [ "$EVENT_NAME" != "pull_request" ]; then
    echo "::notice::PR #$PR is UNSTABLE on the $EVENT_NAME wake path, where this job is not a check on the head. Not merging."
    exit 0
  fi

  # (b) a second commit-status context could cause UNSTABLE just as easily.
  #     The combined state is "success" only when EVERY context succeeded.
  COMBINED=$(gh api "repos/$REPO/commits/$SHA/status" --jq '.state')
  if [ "$COMBINED" != "success" ]; then
    echo "::notice::PR #$PR combined commit status is $COMBINED, so UNSTABLE is not proven self-caused. Not merging."
    exit 0
  fi

  # (c) exactly one non-green check — an ambiguous count is never a judgement call.
  NG_COUNT=$(printf '%s\n' "$NONGREEN" | awk 'NF' | wc -l)
  if [ "$NG_COUNT" -ne 1 ]; then
    echo "::notice::PR #$PR has $NG_COUNT non-green checks; UNSTABLE cannot be attributed to this run. Not merging."
    exit 0
  fi

  # (d) that one check must be OURS, by run id.
  NG_ID=$(printf '%s\n' "$NONGREEN" | awk 'NF {print $1; exit}')
  NG_STATUS=$(printf '%s\n' "$NONGREEN" | awk 'NF {print $2; exit}')
  if ! is_self "$NG_ID"; then
    echo "::notice::PR #$PR non-green check $NG_ID belongs to another run, not run $RUN_ID. Not merging."
    exit 0
  fi

  # (e) and it must be in flight — a failed or cancelled self-check is a failure.
  case "$NG_STATUS" in
    queued | in_progress) ;;
    *)
      echo "::notice::PR #$PR own check $NG_ID is $NG_STATUS, not in flight. Not merging."
      exit 0
      ;;
  esac

  echo "::notice::PR #$PR is UNSTABLE solely because this run's own check $NG_ID is $NG_STATUS; every external gate passed. Proceeding."
fi

# ---- gate 5: zero unresolved threads across the COMPLETE connection ------
# Returns "<unresolved> <hasNextPage>". A truncated page cannot prove zero, so
# hasNextPage=true fails closed.
THREADS=$(gh api graphql -f query='
  query($owner:String!,$name:String!,$pr:Int!){
    repository(owner:$owner,name:$name){
      pullRequest(number:$pr){
        reviewThreads(first:100){
          pageInfo{ hasNextPage }
          nodes{ isResolved }
        }
      }
    }
  }' -F owner="$OWNER" -F name="$NAME" -F pr="$PR" \
  --jq '.data.repository.pullRequest.reviewThreads
        | "\([.nodes[] | select(.isResolved == false)] | length) \(.pageInfo.hasNextPage)"')
UNRESOLVED="${THREADS%% *}"
HAS_NEXT="${THREADS##* }"
if [ "$HAS_NEXT" != "false" ]; then
  echo "::notice::PR #$PR review threads span more than one page — cannot prove zero unresolved. Failing closed."
  exit 0
fi
if [ "$UNRESOLVED" != "0" ]; then
  echo "::notice::PR #$PR has $UNRESOLVED unresolved review thread(s). Not merging."
  exit 0
fi

# ---- record the reviewed tree, then merge pinned to $SHA -----------------
REVIEWED_TREE=$(gh api "repos/$REPO/commits/$SHA" --jq '.commit.tree.sha')
echo "Contract satisfied. Squash-merging PR #$PR at $SHA (tree $REVIEWED_TREE)."
gh pr merge "$PR" --repo "$REPO" --squash --match-head-commit "$SHA" --delete-branch

# ---- post-merge proof: merged tree == reviewed tree ---------------------
MERGE_SHA=$(gh pr view "$PR" --repo "$REPO" --json mergeCommit --jq '.mergeCommit.oid')
MERGED_TREE=$(gh api "repos/$REPO/commits/$MERGE_SHA" --jq '.commit.tree.sha')
if [ "$MERGED_TREE" != "$REVIEWED_TREE" ]; then
  echo "::error::Merged tree $MERGED_TREE != reviewed tree $REVIEWED_TREE for PR #$PR."
  exit 1
fi
echo "Verified: merged tree $MERGED_TREE equals the reviewed tree."

# ---- deployment is a SEPARATE operator-owned authorization --------------
if echo "$LABELS_ALL" | tr ',' '\n' | grep -qx "$DEPLOY_LABEL"; then
  echo "$DEPLOY_LABEL present — dispatching Deploy for main."
  gh workflow run deploy.yml --repo "$REPO" --ref main
else
  echo "No $DEPLOY_LABEL label — merge complete, production untouched."
fi
