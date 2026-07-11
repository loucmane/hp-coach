"""Upload `data/explanations/` to the production R2 bucket.

SUPERSEDED 2026-07-11 by `scripts/content-sync.mjs`, which is the shipped
implementation (content-gating PR 1.0a). That Node script syncs BOTH the
question bank (data/*.json) and the explanations (explanations/*.json) to
the single `hpc-content` bucket, keyed `data/<exam>.json` /
`explanations/<exam>.json`, checksum-skipping unchanged files, and is
wired into .github/workflows/deploy.yml. The worker serves them auth-gated
via /api/content. Prefer that script; this stub remains only as the
original design note (note the bucket/key/cache shape below differs from
what shipped — the shipped route uses `Cache-Control: private, max-age=3600`).

Original v2 design sketch (historical):

Production shape:
  - R2 bucket name: hpc-explanations
  - Key: <exam_id>.json (matching the local file path)
  - Content-Type: application/json
  - Cache-Control: public, max-age=300, stale-while-revalidate=86400
    (short fresh window so prompt re-tunes propagate; SWR keeps things
    fast on cache misses)

Auth: wrangler-equivalent. Either:
  a) `wrangler r2 object put hpc-explanations/<key> --file=...` per file
  b) Boto3-compatible S3 client pointed at the R2 endpoint with the
     `hpc-explanations` access key

Idempotency: same content → same key → no-op. Different content →
overwrites. Cloudflare CDN purges on the worker route invalidate the
edge cache.

Workflow when v2 is live:
  python pipeline/explanations/generate.py --section=XYZ
  python pipeline/explanations/upload_r2.py --section=XYZ
  # Worker route /api/explanations/:qid serves from R2 + KV cache.
"""
from __future__ import annotations

import sys


def main() -> int:
    print(
        "upload_r2.py is a STUB. Implement when v2 (multi-user beta) is "
        "live. See docstring for the production shape.",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
