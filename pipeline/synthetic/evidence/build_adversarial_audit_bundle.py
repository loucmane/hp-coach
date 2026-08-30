#!/usr/bin/env python3
"""Build the closed adversarial-audit bundle for one adjudication-frozen batch."""

from bundle_common import run_lane


if __name__ == "__main__":
    raise SystemExit(run_lane("adversarial-audit"))
