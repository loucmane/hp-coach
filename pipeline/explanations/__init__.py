"""Layer 2 explanations — generation pipeline.

See docs/explanations.md for the design spec. Pipeline shape:
  prompts.py    — system prompt + per-section addenda
  schema.py     — tool-use schema for forced structured output
  generate.py   — CLI entry: read questions, call Anthropic, write JSON
  upload_r2.py  — v2 stub for R2 deploy
"""
