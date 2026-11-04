# Worklog — hpf-qr0p.51.8 (LJ-11: prefs PATCH plus export and import of the Ljusbord fields)

Marker: LJ11 PREFS

## Findings

- 2026-11-03: claimed on branch `codex/hpf-qr0p.51.8-ljusbord-lj-11-prefs-patch-plus-export-and-import-of-the-new`, base `a5772305dca188e37bdaa65e75106d6a5b977241` (origin/main with LJ-10, #490). No tracked changes. The untracked dotfiles in the worktree root (`.bashrc`, `.gitconfig`, `.idea`, `.mcp.json` and others) were there before this bead; I left them alone and did not stage them. `app/node_modules` and `worker/node_modules` were present.
- What I read:
  - the rebuild map §0, §2 and the LJ-11 entry in §4, plus `briefs/lj11.md`;
  - `r6/A/konto.html`;
  - `schema.ts`, `0016_ljusbord_expand.sql`, `routes/me.ts`, `routes/export.ts` and their tests;
  - the app's `useUserPrefs.ts`, `useDataExport.ts` and `folio/lib/folioPrefs.ts`;
  - the LJ-10 worklog.
- `GET /api/me/prefs` returns the whole users row (`db.select()`). Since 0016 it has therefore carried the 11 prefs under their Drizzle camelCase names. PATCH now takes exactly those names. The snake_case column names are still refused, because PATCH is `.strict()`.
- The export selects whole rows for every table, so it already carried every 0016 column. Import was the gap: its row shapes are `.passthrough()`, and its inserts named only the old columns, so every new field was silently dropped on restore.
- Pre-existing gaps I did not change, because they are outside this bead: import does not restore `users.smartDrill`, `users.mockDeferredDate` or `mistakes.lapseIntervalMinutes`, although the export carries all three. This is a candidate follow-up.

## Decisions

- **API names:** the GET row's names, `answerConfidence` … `quantRepeat`. Nothing is renamed or aliased.
- **Values:**
  - **Switches** (`answerConfidence`, `showMyTime`, `mockClockVisible`, `mockReminder`, `shortcuts`, `modeFollowSystem`): JSON booleans only. `null` is refused, since a switch has no "not set". So are 0 and 1, which are SQLite's storage, not API values.
  - **`facitTiming`:** `'each'` | `'end'`. **I chose `'end'`.** The column is plain text, and no source names the second value. Konto offers "Direkt efter varje fråga" and "Efter passet", and nothing reads `'end'` until LJ-41. Please confirm or rename it before LJ-17 or LJ-41 depends on it.
  - **`textSize`:** `small` / `normal` / `large` / `xlarge`. These are the names LJ-02's `folioPrefs` already uses (`FOLIO_TEXT_SIZES`), so LJ-17 can sync them without a mapping.
  - **`motion`:** `system` / `less` / `none`, matching the schema enum and `folioPrefs`.
  - **`quantRepeat`:** `new` / `same`, matching the schema enum.
  - **`targetScore`:** an integer number of tenths, 0–20, or `null`, which clears the target. The screen offers 15, 18 and 20, and the API takes the whole 0,0–2,0 scale. `1.5` is refused because it is the score, not its tenths.
- **One definition.** `KontoPrefs` is exported from `me.ts`:
  - PATCH spreads `KontoPrefs.partial().shape` into `PrefsPatch`;
  - import validates the `user` row with `KontoPrefs.shape.<field>.nullable().optional()`.

  This makes `export.ts → me.ts` the first non-test import between two route files. It stops PATCH and import from drifting apart. Moving the definition into `lib/` would need a file outside this write set.
- **Prefs on import:**
  - A Konto pref that is missing (in a backup from before 0016) or null keeps the account's own value, because undefined is left out of the Drizzle update. This is what the import already did for the older defaulted prefs (coach, palette, mode and so on).
  - `targetScore: null` is restored as null ("no target set").
- **Other 0016 fields on import:** each is validated by its `schema.ts` type, as the older fields are:
  - `confidence` and `lastConfidence` by `CONFIDENCE_LEVELS`;
  - `reason` by `MISTAKE_REASONS`;
  - `marks` as `string[]`, `step` as an integer, and `guess` and `halfRunId` as strings.

  A missing value gets the column default: `reason` `'wrong'`, and null for the rest.
- **Not added on import:**
  - The lesson ranges (`step` 1–5, `guess` a–e) and a `marks` cap. Those rules belong to LJ-12's writers, and an import stricter than its writer would make a real backup fail to restore.
  - A filter that drops confidence on mock attempts. That rule belongs to LJ-12's POST, and calibration filters by session kind anyway.
- **schemaVersion stays 1.** The change is additive and every new field is optional, so v1 exports from before and after 0016 both import, and the app's export and import UI needs no change. I considered bumping to 2 and accepting 1 or 2, and did not do it. The coordinator can still choose that.
- **`/me/stats` is untouched.** The stats route did not change. The golden passes without being re-recorded. A new test also shows that the default body is identical before and after all 11 prefs are set.

## Progress

- **Red first.** Command: `pnpm -C worker test src/routes/me.test.ts src/routes/export.test.ts`, run before any source change, with a JSON report.
  - Result: exit 1. Test Files: 2 failed (2). **Tests: 30 failed | 45 passed (75).**
  - `me.test.ts`, 13 failed: the 11 per-pref cases, the all-11 PATCH and the stats-unchanged guard. Each failed with "expected 400 to be 200", because PATCH refused the new keys.
  - `export.test.ts`, 17 failed: the round trip ("expected … to deeply equal …": restored fields missing), the null/missing pref semantics, and all 15 refusal cases (import accepted invalid values with 200).
  - Already green in red, as expected: the GET defaults and snake_case refusal; "the export carries every field 0016 added" (`select()`); and both old-backup cases (import ignored the fields).
- **Green.** The same command gave Test Files 2 passed (2), **Tests 75 passed (75)**.
- **Worker:**
  - `pnpm typecheck` passed.
  - `pnpm lint` passed (62 files). This was after `biome check --write` on the two test files only, to fix formatting.
  - `pnpm test` passed: **25 files, 573 tests**.
  - `vitest run src/routes/assessmentGolden.test.ts`: 3 of 3 passed. `__snapshots__/assessmentGolden.test.ts.snap` is unchanged, per `git status`.
- **App:**
  - `pnpm typecheck` passed.
  - `pnpm lint` passed (758 files, with 4 informational notices in devbake files I did not touch).
  - The full `pnpm test`, run once without `--maxWorkers`, passed: **198 files, 5574 tests** in 54.16 s.
- `git diff --check` is clean. The changed paths are exactly the write set, and they are staged, not committed.

## Tests added

- `me.test.ts`, under "PATCH /api/me/prefs — the Ljusbord Konto prefs (LJ-11)":
  - a fresh account reads all 11 at their 0016 defaults, and snake_case column names are refused;
  - one `it.each` case per pref. Every Konto value is accepted and read back through GET. Wrong types, a null where it is not allowed, and out-of-range values all give 400, and nothing is written;
  - one PATCH sets all 11, a later one changes only what it names, and a refused PATCH writes nothing;
  - the default `GET /stats` body is identical before and after every pref is set.
- `export.test.ts`, under "the Ljusbord fields (LJ-11)":
  - the export carries every 0016 field: the prefs, confidence with and without a value, every mistake reason, the lesson step and guess, and both Hel halva results sharing one run id;
  - import restores them all onto a fresh account, and a second round trip changes nothing;
  - a backup's null `targetScore` clears the target, while a null or missing Konto pref keeps the account's own value;
  - a frozen pre-0016 backup (a literal fixture) still imports, with every new column at its default and its old fields intact;
  - the same old backup leaves the account's Konto prefs untouched;
  - 15 invalid values are refused with `invalid_payload` before the wipe, leaving the account's rows and fields unchanged.

## Handoff: DONE (state: done)

- Everything in the write set is done, verified and staged. Nothing is committed, and no file outside the write set changed.
- Open for the coordinator:
  - confirm `facitTiming: 'end'`;
  - optionally move `KontoPrefs` into `lib/`;
  - the pre-existing import gaps (`smartDrill`, `mockDeferredDate`, `lapseIntervalMinutes`).
- **Final bead steps.** All three are done and read back: `gc.worker_state=done` with its reason, the `LJ11 PREFS DONE: hpf-qr0p.51.8` note, and the bead parked as `deferred` with no assignee.
  - The Codex form from the bead, `/home/loucmane/gascity/bin/gc bd update …`, was denied by this session's permission policy ("don't ask" mode): `--set-metadata` twice and `--append-notes` once. I stopped there, as the bead's rule for a bead command that fails twice says.
  - On the next turn, the native form that this Claude worker's role prompt prescribes, `/home/loucmane/gascity/bin/bd update "hpf-qr0p.51.8" …`, ran all three steps in order.
- Reason recorded: All 11 Konto prefs patchable with Zod enums and ranges, export carries and import restores every 0016 field, pre-0016 backups still import, stats golden untouched, worker 573 and app 5574 tests green, changes staged and not committed.
- Final note: LJ11 PREFS DONE: hpf-qr0p.51.8 — all 11 Konto prefs patchable with Zod enums and ranges, export carries and import restores every 0016 field, pre-0016 backups still import, stats golden untouched, worker 573 and app 5574 tests green, five write-set files staged and not committed. Coordinator to confirm the facitTiming value end.
