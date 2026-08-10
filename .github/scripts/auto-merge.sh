#!/usr/bin/env bash
# Auto-merge decision logic for .github/workflows/auto-merge.yml.
#
# Lives in a script, not inline YAML, so its behaviour can be executed and
# asserted outside GitHub Actions (see .github/contract-tests/). It takes all
# GitHub context through the environment and uses no Actions template syntax.
#
# Contract (every gate evaluated against ONE pinned head SHA):
#   1. codex/exact-head-review status == success, read at that SHA
#   2. every other check-run at that SHA completed successfully
#   3. mergeable == MERGEABLE
#   4. mergeStateStatus == CLEAN exactly (BEHIND/BLOCKED/UNSTABLE/HAS_HOOKS
#      are NOT clean — rejecting only DIRTY was the 2026-08-10 defect)
#   5. zero unresolved review threads across the COMPLETE connection; if the
#      connection has another page we fail closed rather than guess
#   6. gh pr merge --match-head-commit "$SHA" --squash
#   7. post-merge: merged tree must equal the reviewed tree
# Deployment is never implied by merging: it requires the deploy-approved label.
#
# Required env: EVENT_NAME REPO OWNER JOB_NAME GH_TOKEN
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

# ---- gate 2: every other check at that SHA is green ----------------------
GREEN=$(gh api "repos/$REPO/commits/$SHA/check-runs" --paginate \
  --jq "[.check_runs[] | select(.name != \"$JOB_NAME\")]
        | length > 0 and all(.status == \"completed\" and .conclusion == \"success\")")
if [ "$GREEN" != "true" ]; then
  echo "Checks on PR #$PR at $SHA are not all green — deferring."
  exit 0
fi

# ---- gate 3: mergeable ---------------------------------------------------
MERGEABLE=$(gh pr view "$PR" --repo "$REPO" --json mergeable --jq '.mergeable')
if [ "$MERGEABLE" != "MERGEABLE" ]; then
  echo "::notice::PR #$PR mergeable=$MERGEABLE. Not merging."
  exit 0
fi

# ---- gate 4: mergeStateStatus must be exactly CLEAN ----------------------
MERGE_STATE=$(gh pr view "$PR" --repo "$REPO" --json mergeStateStatus --jq '.mergeStateStatus')
if [ "$MERGE_STATE" != "CLEAN" ]; then
  echo "::notice::PR #$PR mergeStateStatus=$MERGE_STATE (not CLEAN). Not merging."
  exit 0
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
