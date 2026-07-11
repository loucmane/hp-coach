// Canonical Swedish naming for HP sittings and passes — the shared LAW.
//
// The bank identifies a sitting by an ASCII `exam_id` ("host-2025",
// "var-2022-1") and a pass by a `provpass` code ("verb1", "kvant2").
// Those are storage ids — never user-visible. Everywhere a sitting or a
// pass is shown to a student, it must be rendered through these two
// functions, so the product speaks one consistent Swedish vocabulary
// instead of leaking filenames into the UI.
//
// This file is the single home of the grammar. `formatSitting`/
// `formatPass` began life in the provpass-picker bake-off
// (components/devbake/ProvpassPickerB.tsx); they were lifted here when
// the winning picker (PPH · "Kallelsen & registret") shipped to /prov,
// and the bake-off files now thin-re-export from here so there is never
// a second copy of the grammar to drift.
//
// ── Grammar cases (all six shapes the bank produces) ────────────────────
//   var-2026        → "Våren 2026"
//   host-2025       → "Hösten 2025"
//   var-2022-1      → "Våren 2022 · provtillfälle 1"   (multiple sittings
//   var-2022-2      → "Våren 2022 · provtillfälle 2"    in one season)
//   host-ver1-2019  → "Hösten 2019 · version 1"        (multiple exam
//   host-ver2-2019  → "Hösten 2019 · version 2"         versions)
//
// The lone-qualifier case is grammar-faithful, not cosmetic: var-2018-1
// has no `var-2018-2` sibling in the bank, yet it still renders
// "Våren 2018 · provtillfälle 1". The `-1` is part of the real exam id
// (that spring ran more than one provtillfälle nationally even though we
// only hold one), so dropping it would misname the sitting. The
// qualifier reflects the id, not the count of siblings we happen to have.

/** `var-2026` → "Våren 2026" · `host-2025` → "Hösten 2025" ·
 *  `var-2022-1` → "Våren 2022 · provtillfälle 1" ·
 *  `host-ver1-2019` → "Hösten 2019 · version 1". Unknown shapes fall
 *  back to the raw id rather than guessing. */
export function formatSitting(examId: string): string {
  const m = /^(var|host)-(?:ver(\d+)-)?(\d{4})(?:-(\d+))?$/.exec(examId)
  if (!m) return examId
  const [, seasonKey, version, year, sitting] = m
  const season = seasonKey === 'var' ? 'Våren' : 'Hösten'
  let out = `${season} ${year}`
  if (sitting) out += ` · provtillfälle ${sitting}`
  if (version) out += ` · version ${version}`
  return out
}

/** `verb1`/`kvant1` → "Provpass 1"; `verb2`/`kvant2` → "Provpass 2".
 *  The half (Verbal / Kvantitativ) is chosen by the page toggle — it is
 *  never repeated per pass. Unknown shapes fall back to the raw code. */
export function formatPass(provpass: string): string {
  const m = /^(?:verb|kvant)([12])$/.exec(provpass)
  return m ? `Provpass ${m[1]}` : provpass
}
