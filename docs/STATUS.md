# STATUS — HP-Coach working ledger

**The single place to answer "what's done / what's next / what's deferred."**
Check this first each session instead of reconstructing from git + memory.
`tasks.json` (taskmaster) covers the older parser/design/corpus arc (#47–150);
this file owns everything since the cloud pivot (xdevice, scaling, auth, AI).

_Last updated: 2026-05-30 · branch at write time: main @ post-#129_

---

## Now

- **State:** all shipped work merged, no open PRs, tree clean.
- **In flight:** AI on-demand tutoring — in **design** (brainstorm nearly
  complete, see Decisions below).

## Recently shipped (cloud-pivot arc)

| Theme | PRs | Notes |
|---|---|---|
| Cross-device session reconciliation | #119–122 | Server source of truth; ≤1 active session/kind; adopt-on-resume; ordered `plan`; device provenance; phone resumption line |
| Scaling (200 → many users) | #123–126 | Atomic end-prior+insert; hot-path indexes; lifetime counters; daily retention cron (`RETENTION_DAYS=120`); `docs/scaling.md` ledger |
| Clerk load-failure recovery | #127 | 15s timeout → recoverable "kunde inte ladda" instead of permanent blank |
| Sign-in bake-off + winner E | #128, #129 | Killed Clerk's bolted-on card; flush form + Sage left-rail |
| WSL DNS → Clerk blank screen | — (env) | Root-caused; fixed permanently via `dnsTunneling=true` in `.wslconfig`; in memory as `env-wsl-dns-clerk-blank-screen` |

## Next

- **AI on-demand tutoring** (headline AI-native feature). Blocked only on
  confirming the inference-path/abuse model (see Open decisions), then:
  finish brainstorm → spec (`docs/superpowers/specs/`) → plan → implement.
  Mount point: post-answer pedagogy surface (`PedagogyPanel` desktop /
  `ExplanationPanel` phone). New worker route behind existing Clerk auth +
  KV rate-limiter. PRD frames this as the deferred v0.5 "Förklara mer"
  (§7, lines 282/614).

## Open decisions (need the user)

1. **Tutor inference path + abuse model.** Recommended: Anthropic API,
   Haiku-default / Sonnet-for-quant, with 6-lever cost guard (structural
   bound · per-user daily quota · global circuit breaker · response cache ·
   scope guard · auth). Alt hedge: quant-only tutor first, tighter quota,
   prove cost on the dogfood user before widening.
2. **Prod D1 migration** (`db:apply:prod`, migrations 0003–0005) — staged to
   staging only; needs greenlight before onboarding real users
   (`docs/scaling.md` deploy note).
3. **Clerk Swedish localization** (`localization: sv`) — sign-in currently
   renders English field labels ("Continue", "Email address"); the
   Swedish-UI requirement wants these translated. Pre-existing, not a
   regression from #129.

## Deferred / debt (cheap, do when convenient)

- **Dead dev bake-off routes** (winners all shipped): `drill-bake-off`,
  `explanation-bake-off`, `home-bakeoff`, `home-phone-resume-bakeoff`,
  `sign-in-bakeoff`, `loop-bakeoff`. Dev-gated + harmless, but cleanup debt.
  (`dev-login` stays — it's the dev auth bootstrap.)
- **Sign-in residual:** faint border on the Clerk email-input wrapper could be
  tightened with a CSS escape in `index.css`.
- **taskmaster #107** marked `in_progress` (test-reset endpoint) but
  `worker/src/routes/testReset.ts` exists — stale status to verify + close.

## Decisions locked (AI tutoring brainstorm)

- **Teaching stance:** adaptive by signal (repeated miss on a `framework_id`
  → Socratic; first-time slip / low-energy → direct explain).
- **Interaction shape:** bounded to the question now (2–4 turns, resolves back
  into the drill); persistent coach thread is a later phase.
- **Context payload:** question + student's pick · Layer 1 framework + Layer 2
  explanation (corpus-as-guardrail) · this-trap mistake history · broader
  profile.
- **Teach-back gate:** optional, never blocks (offer a check question, always
  skippable).

## How to use this file

Update it at the end of any session that ships a PR or makes a decision.
Keep it short — it's a board, not a journal. Git history holds the detail.
