# Home + surrounding-surface audit

Captured 2026-05-22 on the running dev server (vite :5173, worker :8787),
single dogfood user, authenticated session, phone (390×844) and studio
(1440×900) viewports. Screenshots in `audit/_homescreen_audit_*.png`.

The product *renders* well. The flow *narrates* poorly — Home prescribes
work and three downstream screens give different numbers, different
amounts, and zero acknowledgement that an onboarding diagnostic ever
ran. The dogfood user's "50 → 10" complaint is the most visible
symptom of a deeper count-coherence problem.

---

## Blocker (renders incorrectly or contradicts itself)

### 1. "50 missar" on Home → "Repetera 10 frågor" on /repetition

- **What user sees on `/`** — `Repetition · 50 missar` / `50 missar
  väntar på repetition — gör dem först, de förlorar effekt om de
  väntar för länge.` / `~50 MIN`.
  Source: `app/src/lib/scheduler.ts:196-212`, `repetitionItem()`.
  `estimatedMinutes: Math.max(1, count)` → 50 min for 50 missar.
- **What user sees on `/repetition`** — `Dina missar / Repetera 10
  frågor du svarat fel på. / 50 ATT REPETERA NU / Starta övning →`.
  Both numbers (50 *and* 10) rendered on the same screen.
- **What's actually true** — `DEFAULT_REPLAY_LENGTH = 10`
  (`app/src/lib/replay.ts:12`) is the hard cap. `pickReplayQuestions`
  in the route (`app/src/routes/repetition.tsx:62`) plays exactly
  `min(due, 10)`. The "50 → 10" cliff is intentional but invisible at
  prescription time, and the home-card's `~50 MIN` estimate is wildly
  wrong (each rep is ~30-60s; ten reps is ~5-10 min, not 50).
- **Bonus inconsistency** — Home and `/drill` say "50", `/progress`
  says "**71** att repetera nu / aktiva i kön 71". Two facts of the
  same name. `useDueMistakes` queries with `query: { limit: '50' }`
  (`app/src/api/hooks/useMistakes.ts:39-40`) so the *list* hook ceiling
  is 50, while `useStats()` uses raw `count()` against the same
  predicate in `worker/src/routes/me.ts:124-127` and returns the true
  71. Two different surfaces, two different numbers, same underlying
  query.
- **Recommended fix:**
  1. **Cap `repetitionItem()` count and estimate to a session size.**
     Define `REPETITION_SESSION_SIZE = 10` (single source of truth,
     shared with `DEFAULT_REPLAY_LENGTH`); render the headline as
     `Repetition · ${Math.min(count, SIZE)} av ${count} missar`
     (or `Repetition · 10 missar (50 i kö)`); use the *capped* count
     for `estimatedMinutes`, with a per-item heuristic (~45s ≈ ~8 min
     for 10) instead of `count` minutes flat.
  2. **Lift the `useDueMistakes` limit to match stats** (or unify on
     `count()` for *display* and only request the first
     `REPETITION_SESSION_SIZE` rows when actually playing). This
     removes the 50/71 cliff on `/progress`.

### 2. Scheduler ranks an unconfident 0.00-on-3-attempts section over a confident 1.89-on-1035-attempts section

- **What user sees on `/`** — `LEKTION · LÄS / LÄS-lektion · Direkt
  detalj / Svagast section — 0.0, börja med lektionen.` and right
  underneath `DRILL · ELF / ELF-drill · 10 frågor / Näst svagast —
  0.0, övning skärper formen.`
- **What user sees on `/progress`** — Same three sections (LÄS, ELF,
  DTK) all listed as `01 LÄS — 0.00, lägsta sektionen just nu` —
  but the per-section rows above each say `3 försök · liten
  provstorlek`, `5 försök · liten provstorlek`, `4 försök · liten
  provstorlek`. Progress KNOWS the sample is too small; the Fokus list
  and the daily plan don't honor that knowledge.
- **What's actually true** — `weaknessWeight()`
  (`app/src/lib/scoring.ts:145-158`) discounts low-confidence by
  `0.6×`. For a 0.00-on-3-attempts section: `(2 - 0) * 0.6 = 1.2`.
  For 1.89-on-1035: `(2 - 1.89) * 1.0 = 0.11`. So a 3-attempt 0.00
  beats a 1035-attempt 1.89 by ~11×. Confidence is named but not
  enforced as a floor.
- **Why this is a blocker, not friction** — the dogfood user is
  literally being told "your weakest section is LÄS at 0.0" based on
  3 questions. That's not coaching; that's noise. And the FÅR Hi-Conf
  ORD score of 1.89 — actually meaningful signal — is invisible.
- **Recommended fix:** add a confidence floor to `rankWeakness`
  (require `confidence !== 'low'` to qualify, OR fall back to *highest
  confidence with non-mastery score* when no medium/high sections
  exist). Same gate should apply in `needsLesson` / `needsDrill`
  (`app/src/lib/scheduler.ts:176-187`).

### 3. Diagnostic report ships but downstream is invisible

- **What user sees** — runs `/diagnostik` (10 questions across
  sections), sees a `DiagnosticReport` summary at the end. Tapping
  Hem → `/`. **Home does not acknowledge the diagnostic ran.**
  `/progress` does not say "based on your diagnostic". The score
  *number* updates because attempts are recorded, but there is no
  semantic continuity — a fresh user has no idea the diagnostic
  shaped the plan.
- **What's actually true** — the diagnostic is wired as a normal
  `SessionPlayer` session (`app/src/routes/diagnostik.tsx:27-46`).
  It produces attempt rows. No diagnostic-specific row in the DB,
  no `lastDiagnosticAt`, no "vad vi tror nu" persisted state. Task
  #140 ('Vad vi tror nu' post-diagnostic coached report) is still
  in_progress / blocked — confirmed.
- **Recommended fix:** persist a `last_diagnostic_at` flag (D1 or
  localStorage v1) on diagnostic completion. Home renders a one-line
  marginalia under the date kicker: `Diagnostik klar för X dagar
  sedan — baseline 0.65`. `/progress` projected hero gets a
  `BASERAT PÅ DIAGNOSTIK · X DAGAR SEDAN` eyebrow when the user
  hasn't drilled enough to override it. Bonus: when *no* diagnostic
  has run, Home's cold-start item is already `Diagnos · några
  frågor` → `/diagnostik` (scheduler.ts:313-327) — that path is
  fine; it's the post-diagnostic memory that's missing.

### 4. `/drill` idle echoes the broken "50 missar" claim — same root, second surface

- **What user sees on `/drill?section=ORD`** —
  `Du har 50 missar att repetera →` (`audit/_homescreen_audit_phone_drill.png`).
- **What's actually true** — same `useDueMistakes` (`app/src/routes/drill.tsx:90-91`),
  same 50-row cap, same misleading prompt. The arrow CTA routes to
  `/repetition` where the user gets 10, not 50. Fix is identical to
  blocker #1; flagged separately because the surface needs the same
  cap edit.
- **Recommended fix:** consume the unified `repetitionPrescription`
  (single hook with capped count + total) so all three surfaces
  (Home card, /drill banner, /repetition idle) show the same
  language: "10 av 71 missar redo · ~8 min".

---

## Friction (works but confusing or empty)

- **`/coach` is not a coach** — renders `COACH / Dogfood-feedback /
  0 SPARADE POSTER / Träna i Övning eller Repetition och tryck 👎 på
  förklaringar som var otydliga. Här exporterar du listan till
  Claude för regenerering.` It's a dev-only feedback exporter behind
  a 5th tab named "Coach". For the dogfood user this is their tab,
  but for any future user this is a broken promise: the surface
  named "Coach" should be where coaching lives (the daily plan, the
  diagnostic report, the score model commentary). At minimum,
  rename the tab to `Feedback` and put coaching-content here, OR
  move the daily plan content to `/coach`.

- **`/avancerat` is empty** — renders `AVANCERAT / Inställningar
  och allt utöver vardagsflödet. / Tillbaka till hem`. Nothing
  else. It's reachable but does nothing. Either populate it
  (preferences live in the running-head edition strip; what *would*
  belong here? streak settings, data export, sign-out, dev tools)
  or remove the entry point.

- **DailyPlanCard never says what's *not* prescribed** — when the
  scheduler emits 3 items (Repetition / Lesson LÄS / Drill ELF),
  the user has no visibility into "why not KVA?" or "is XYZ done?".
  At dogfood scale this is fine; at "ADHD-PI user trying to trust
  the system" scale it matters. A one-line tail beneath the card
  ("KVA + ORD i bra form · XYZ vilar idag") would close the gap.

- **`/progress` "FOKUS" list duplicates the daily plan rationale**
  — same three sections, same `0.00 — lägsta sektionen just nu`
  copy. If Home already prescribes #1/#2/#3, /progress should
  enrich the picture (per-section history, time-on-task), not
  echo the prescription. Both surfaces are right; together they
  feel like the system has one note.

- **Plan minutes are not credible** — Home reads `IDAG · 65 MIN`.
  Of that, 50 min is the repetition over-estimate (blocker #1) and
  5+10 min are sectional drills (`SECTION_DURATIONS` constants).
  Once blocker #1 lands the new total will be ~23 min; even then,
  the user has no way to know "65 min" is a generated estimate vs.
  a measured commitment. A subtitle like `IDAG · ~23 MIN
  UPPSKATTAT` (mono, ink-2) would set expectations.

- **`/repetition` idle copy `50 ATT REPETERA NU` is mono kicker
  next to the headline** — visually it reads as a status label, but
  it's actually the surplus count that contradicts the body text
  "Repetera 10 frågor". The kicker should match: `10 AV 50 KLARA
  NU` or `~ 10 MIN · 8 PER SESSION`.

- **`/drill?section=DTK` works (verified end-to-end this session)**
  but `app/src/screens/ProgressMobile.tsx:412-416` still carries a
  comment "DTK is not yet drillable (image pipeline pending)" and
  routes DTK to `/drill` with no section param. Stale guardrail;
  drill it directly.

- **Streak badge `1 dag` appears alongside `STREAK 1 d` on
  /progress and `streak 1 d` in the Home status line** — three
  copies, three formats, same fact. Pick one location.

- **`SECTIONER` table on `/progress`** shows sections in mixed
  order (ORD, LÄS, MEK, ELF, XYZ, KVA, NOG, DTK) but no
  half-grouping rule — verbal/quant labels above the table would
  help the user map the table to the `VERBAL 0.81 / KVANT 0.49`
  hero.

---

## Missing (would be expected at this stage of Phase B)

- **B4 follow-through.** Per the plan, "Subsequent home screen
  renders the seeded grade." It does (the number is correct
  *mechanically* because attempt rows seed everything), but the
  *acknowledgement* is missing — no "based on your diagnostic" / no
  date-since marker / no link back to re-run the diagnostic from
  the home itself. The cold-start item is the only path; once
  diagnostic runs, that item disappears and the diagnostic becomes
  un-rediscoverable except by typing the URL.

- **B2 — "confidence interval" was explicitly deferred** and that
  deferral is now biting Blocker #2. The scheduler treats low/medium
  /high as a 0.6×/0.85×/1.0× multiplier, but the UI never tells
  the user the score has low confidence. `/progress` shows `LÄS 3
  försök · liten provstorlek — 0.00` then the FOKUS list happily
  says "lägsta sektionen just nu". The phrase `liten provstorlek`
  knows the truth; the prescription forgets.

- **Per-section weakness signal on Home.** B3 plan §5: "Home
  should integrate diagnostic seed + daily plan + repetition queue
  + score signal". The score signal *isn't* there — the home only
  shows the prescription, not the current grade. The user can't
  tell at a glance "where am I, vs where do I need to go". Even a
  one-line `Just nu · 0.65 / 2.0 · senast 0.62` between the
  greeting and the plan would close it.

- **Across 8 sections — which have I touched?** The user can see
  this only on `/progress` (`SECTIONER` table). Home doesn't tell.
  Drill section picker doesn't tell. Lektion section picker
  doesn't tell. The user has no way to feel "I've covered NOG
  this week" without manually visiting /progress.

- **"Last action" recall.** B3.2 daily-plan-card derives
  completion from signals — but the user never sees *what they did*
  yesterday. There's no `IGÅR · 18 min · 12 frågor · 75%` rail.
  This is the recall that makes a streak feel earned.

- **First-action clarity for a cold user.** Cold-start item is
  `Diagnos · några frågor → /diagnostik` (scheduler.ts:313-327).
  That's correct. But the diagnostic itself uses the same idle copy
  as a drill (`Starta övning →`) so the user lands and isn't sure
  "is this the test?". A diagnostic-specific eyebrow (currently
  `DIAGNOS`, ok) plus a one-line "we'll use this to set your
  baseline" would help. Already present-ish but easy to miss.

---

## Suggested next ship (3–5 tasks ordered by impact-to-effort)

1. **Repetition session-size sanity pass (Blocker #1 fix).** Define
   `REPETITION_SESSION_SIZE = 10` in one place; thread it through
   `scheduler.ts:repetitionItem`, `repetition.tsx:idleSubcopy /
   idleMeta`, `drill.tsx`'s `Du har N missar att repetera` banner,
   and the `~N min` estimate. WHY — directly fixes the user's
   #1 complaint; eliminates the most embarrassing self-contradiction
   in the product; ~1 hour of work; unblocks trust.

2. **Confidence floor in scheduler weakness ranking (Blocker #2
   fix).** In `rankWeakness` and the scheduler's `needsLesson`/
   `needsDrill`, require `confidence !== 'low'` to qualify a section
   as weakest. If no medium/high section is low-scoring, fall through
   to the mastery-maintenance fallback OR to a `Diagnostik
   (rebaseline)` item. WHY — stops the daily plan from prescribing
   work on sections the system *knows* it doesn't know yet; pairs
   well with #5 below; ~half a day with tests.

3. **Score signal on Home.** Add a one-line between the greeting
   and the plan: `Just nu · 0.65 / 2.0 · verbal 0.81 · kvant 0.49`
   (mono, ink-2, tabular-nums). Optionally a sparkline if cheap.
   WHY — closes the B3 "score signal on Home" gap from the plan;
   gives the user a why for the prescription without needing
   /progress; ~2 hours including tests.

4. **Diagnostic memory + re-baseline path.** Persist
   `last_diagnostic_at` (and projected score at that moment) to D1.
   Render on Home as `DIAGNOSTIK · 2 d sedan · baseline 0.62 ·
   rebaseline →`. Render on `/progress` as a kicker over the
   projected hero. WHY — completes B4 (the plan said the diagnostic
   "seeds the score model"; users need to *feel* that); makes the
   diagnostic re-discoverable; ~half a day.

5. **Coach tab content audit.** Either rename the current "Coach"
   tab to `Feedback` and move the daily plan + diagnostic report
   into a real `Coach` tab, OR collapse `/coach` into `/avancerat`
   and free the 5th slot for something else (e.g., `Plan` as a
   stable home for the daily-plan card so Home becomes the
   greeting/score, Plan becomes the action surface). WHY — the
   word "Coach" anchors the whole product positioning; right now
   it points at a dev export tool. Low complexity, high meaning.

---

## Surfaces touched (with screenshots)

| Surface | Phone | Studio | Notable |
|--------|-------|--------|---------|
| `/` Home | `_phone_home.png` | `_studio_home.png` | Prescribes 50 missar / 65 min total |
| `/repetition` | `_phone_repetition.png` | — | "Repetera 10" vs "50 ATT REPETERA NU" contradiction |
| `/progress` | `_phone_progress.png` | — | 71 vs 50; LÄS/ELF/DTK 0.00 elevated despite tiny n |
| `/lektion` | `_phone_lektion.png` | — | Clean section picker; no "weakest" signal |
| `/coach` | `_phone_coach.png` | — | Feedback export, not coaching |
| `/diagnostik` | `_phone_diagnostik.png` | — | Idle screen clean; no rebaseline path elsewhere |
| `/drill` | `_phone_drill.png` | — | Repeats "50 missar" banner |
| `/avancerat` | `_phone_avancerat.png` | — | Empty stub |
