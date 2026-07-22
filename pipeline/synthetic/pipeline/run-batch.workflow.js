export const meta = {
  name: 'run-batch',
  description: 'Automate P5 batch stages 4-10: gate fleet -> resolve -> aggregate -> language correct -> pedagogy correct -> integrated sweep -> V-FINAL verify (fresh blind re-solve + adversarial meta-audit of the reviews) -> promote gate. Ends on promote.py --require-clean so a batch that skipped or failed any stage cannot report success. args:{batch:<N>, stopAfter?:"aggregate"|"sweep"|"promote", date:"YYYY-MM-DD"}',
  phases: [
    { title: 'Prep', detail: 'blind sheets + mech' },
    { title: 'GateFleet', detail: '11 Opus judges' },
    { title: 'Aggregate', detail: 'gkey_resolve + aggregate' },
    { title: 'Language', detail: 'expert-language-review applies edits' },
    { title: 'Pedagogy', detail: 'pedagogy-review applies fixes' },
    { title: 'Sweep', detail: 'integrated-review whole-unit cross-check' },
    { title: 'Verify', detail: 'V-FINAL: blind re-solve + meta-audit on final files' },
    { title: 'Promote', detail: 'promote.py --require-clean (the hard gate)' },
  ],
}

// ---- config from args -------------------------------------------------------
// The harness may deliver args as a JSON-encoded STRING (observed 2026-07-22 on
// scriptPath invocations): parse it. And batch is REQUIRED — a run that doesn't
// know its batch must die loudly, not default onto an already-shipped batch
// (a silent default-to-2 re-ran the full fleet over batch2 and trashed its
// working-tree artifacts; recovered from git, ~1.5M tokens wasted).
let A = args
if (typeof A === 'string') { try { A = JSON.parse(A) } catch (e) { A = null } }
if (!A || typeof A !== 'object') A = {}
if (A.batch == null) throw new Error('run-batch: args.batch is REQUIRED (got ' + JSON.stringify(args) + ')')
const BATCH = A.batch
const STOP_AFTER = A.stopAfter || 'promote' // aggregate | sweep | promote
const DATE = A.date || '2026-07-22' // stamp for review records (no Date.now in workflows)
const ROOT = 'pipeline/synthetic'
const BDIR = `${ROOT}/batches/batch${BATCH}`
const OPUS = { model: 'opus', agentType: 'general-purpose' } // bulk P5 runs on Opus; needs Bash/Read/Write

const VERDICT_FIELDS =
  `Every verdict line is one JSON object with EXACTLY these keys: ` +
  `candidate_id (string), gate (one of M-*/G-KEY/G-STEM/G-DISTRACTOR/G-SPRAK/G-ENG/G-REGISTER), ` +
  `target ("passage" or "q:<n>"), verdict ("pass"|"kill"|"flag"), findings (array; empty on pass, ` +
  `else each {severity:"lethal"|"major"|"minor", quote:"<verbatim excerpt>", note:"<why, English>"}), ` +
  `executed_by ("claude-opus-4-8/<GATE>"). G-KEY adds solver_answer ("A"|"B"|"C"|"D"|"NONE_DEFENSIBLE"|"MULTIPLE_DEFENSIBLE") ` +
  `and vote (1 or 2). G-SPRAK/G-ENG add vote (1..3). Append one line per applicable target to the named file with Bash (>>).`

const ANTIPARK =
  `Never launch a background job and wait on it; run every step as a foreground command in <=2-minute batches. ` +
  `NEVER touch dev ports 5173/8787. Do not push or open PRs.`

// ---- schemas ----------------------------------------------------------------
const REVIEW_SCHEMA = (verdictEnum) => ({
  type: 'object',
  required: ['candidate_id', 'verdict', 'edits_applied', 'regate_needed', 'summary'],
  properties: {
    candidate_id: { type: 'string' },
    verdict: { type: 'string', enum: verdictEnum },
    edits_applied: { type: 'integer' },
    regate_needed: { type: 'boolean' },
    regate_result: { type: 'string' }, // "clean" | "n/a" | "<problem>"
    summary: { type: 'string' },
  },
})
const SWEEP_SCHEMA = {
  type: 'object',
  required: ['candidate_id', 'sweep_verdict', 'findings'],
  properties: {
    candidate_id: { type: 'string' },
    sweep_verdict: { type: 'string', enum: ['CONSISTENT', 'MINOR_NOTES', 'INCONSISTENT', 'BLOCKED_SHIP'] },
    findings: { type: 'array', items: { type: 'object' } },
    fixed: { type: 'boolean' },
  },
}

// =============================================================================
// Stage: PREP — blind sheets + mech
// =============================================================================
phase('Prep')
const prep = await agent(
  `You are the PREP stage of the P5 batch pipeline. Work in the repo root.\n` +
  `Batch dir: ${BDIR}. Candidates: ${BDIR}/candidates/*.json.\n\n` +
  `1. mkdir -p ${BDIR}/verdicts ${BDIR}/blind ${BDIR}/distractor ${BDIR}/reviews\n` +
  `2. For EACH candidate file build a BLIND sheet (answer key + teaching payload removed):\n` +
  `   jq 'del(.questions[].key, .questions[].rationale, .questions[].generator_meta, .questions[].family) | del(.key, .rationale, .family, .generator_meta)' <cand> > ${BDIR}/blind/<id>.json\n` +
  `   Then VERIFY zero leaks: grep -E '"(key|rationale|generator_meta|family)"' ${BDIR}/blind/<id>.json must return NOTHING. If any blind sheet is contaminated, STOP and report contaminated:true — do not proceed.\n` +
  `3. For EACH candidate build a DISTRACTOR sheet (key KEPT, only teaching payload removed):\n` +
  `   jq 'del(.questions[].rationale, .questions[].generator_meta) | del(.rationale, .generator_meta)' <cand> > ${BDIR}/distractor/<id>.json\n` +
  `4. Run mechanical gates over the REAL candidates:\n` +
  `   python3 ${ROOT}/gates/scripts/run_mech.py ${BDIR}/candidates/*.json --parsed-dir data/parsed --out ${BDIR}/verdicts/verdicts-mech.jsonl\n` +
  `   (if data/parsed is absent, add --no-plagiarism and say so.)\n\n` +
  `${ANTIPARK}\n\n` +
  `Return JSON: {contaminated:bool, mech_kills:int, units:[{candidate_id, section}], notes:"..."}. ` +
  `Read each candidate's candidate_id and section for the units list.`,
  { label: 'prep', phase: 'Prep', ...OPUS, effort: 'low',
    schema: { type: 'object', required: ['contaminated', 'mech_kills', 'units'],
      properties: { contaminated: { type: 'boolean' }, mech_kills: { type: 'integer' },
        units: { type: 'array', items: { type: 'object', required: ['candidate_id', 'section'],
          properties: { candidate_id: { type: 'string' }, section: { type: 'string' } } } },
        notes: { type: 'string' } } } }
)

if (!prep || prep.contaminated) {
  return { aborted: 'prep', reason: prep ? 'blind sheet contaminated' : 'prep agent died', prep }
}
const units = prep.units
const lasUnits = units.filter(u => u.section === 'LÄS').map(u => u.candidate_id)
const elfUnits = units.filter(u => u.section === 'ELF').map(u => u.candidate_id)
log(`prep done: ${units.length} units (${lasUnits.length} LÄS, ${elfUnits.length} ELF), mech kills=${prep.mech_kills}`)

// =============================================================================
// Stage: GATE FLEET — 11 blind/keyed judges, each writing its own verdicts file
// =============================================================================
phase('GateFleet')
const judge = (gate, vote, sheetDir, applyIds, promptFile, extra) => () =>
  agent(
    `You are gate ${gate}${vote ? ` (independent vote ${vote})` : ''} in the P5 gate fleet. ` +
    `Read the gate prompt at ${ROOT}/gates/prompts/${promptFile} and follow it EXACTLY. ` +
    `Judge these candidates by reading their sheets from ${BDIR}/${sheetDir}/: ${applyIds.join(', ')}. ` +
    `${sheetDir === 'blind' ? 'These sheets have NO answer key — if you see a key/rationale field, STOP and report contamination, do not guess. ' : 'These sheets KEEP the key so you can check for a second defensible answer. '}` +
    `${extra || ''}\n\n${VERDICT_FIELDS}\n` +
    `Write your lines to ${BDIR}/verdicts/verdicts-${gate.toLowerCase().replace(/-/g, '')}${vote ? `-${vote}` : ''}.jsonl (create/append with Bash). ` +
    `executed_by = "claude-opus-4-8/${gate}${vote ? `-${vote}` : ''}".\n\n${ANTIPARK}\n` +
    `Return JSON {gate, lines_written:int, kills:int, flags:int}.`,
    { label: `${gate}${vote ? `-${vote}` : ''}`, phase: 'GateFleet', ...OPUS, effort: 'high',
      schema: { type: 'object', required: ['gate', 'lines_written'],
        properties: { gate: { type: 'string' }, lines_written: { type: 'integer' },
          kills: { type: 'integer' }, flags: { type: 'integer' } } } }
  )

const allIds = units.map(u => u.candidate_id)
const fleet = [
  judge('G-KEY', 1, 'blind', allIds, 'G-KEY.md', 'Blind-solve EACH question; commit solver_answer BEFORE any key reasoning. Per-question target q:<n>.'),
  judge('G-KEY', 2, 'blind', allIds, 'G-KEY.md', 'Blind-solve EACH question independently; commit solver_answer. Per-question target q:<n>.'),
  judge('G-STEM', null, 'blind', allIds, 'G-STEM.md', 'Per-question: can the stem be answered without the passage? structural-leak/recall = kill; world-knowledge = flag.'),
  judge('G-DISTRACTOR', null, 'distractor', allIds, 'G-DISTRACTOR.md', 'Per-question: is any distractor a genuinely defensible SECOND answer given the kept key? Kill only genuine double-keys.'),
  judge('G-REGISTER', null, 'blind', allIds, 'G-REGISTER.md', 'Passage-level authenticity vs the corpus. target=passage.'),
]
if (lasUnits.length) for (const v of [1, 2, 3])
  fleet.push(judge('G-SPRAK', v, 'blind', lasUnits, 'G-SPRAK.md', 'Swedish register/idiom, passage-level. target=passage. >=2 kill votes kills the unit.'))
if (elfUnits.length) for (const v of [1, 2, 3])
  fleet.push(judge('G-ENG', v, 'blind', elfUnits, 'G-ENG.md', 'English register/idiom, passage-level. target=passage. >=2 kill votes kills the unit.'))

const fleetResults = (await parallel(fleet)).filter(Boolean)
log(`gate fleet: ${fleetResults.length} judges ran, ${fleetResults.reduce((a, r) => a + (r.kills || 0), 0)} kill line(s)`)

// =============================================================================
// Stage: AGGREGATE — resolve blind G-KEY, merge, aggregate
// =============================================================================
phase('Aggregate')
const agg = await agent(
  `You are the AGGREGATE stage. Work in the repo root.\n` +
  `1. Resolve blind G-KEY against the stored keys:\n` +
  `   python3 ${ROOT}/gates/scripts/gkey_resolve.py ${BDIR}/verdicts/verdicts-gkey-*.jsonl --candidates-dir ${BDIR}/candidates --out ${BDIR}/verdicts/verdicts-gkey-resolved.jsonl\n` +
  `2. Merge ALL verdict files EXCEPT the raw gkey ones (use the resolved file instead):\n` +
  `   cat ${BDIR}/verdicts/verdicts-mech.jsonl ${BDIR}/verdicts/verdicts-gkey-resolved.jsonl ${BDIR}/verdicts/verdicts-gstem.jsonl ${BDIR}/verdicts/verdicts-gdistractor.jsonl ${BDIR}/verdicts/verdicts-gregister.jsonl ${BDIR}/verdicts/verdicts-gsprak-*.jsonl ${BDIR}/verdicts/verdicts-geng-*.jsonl 2>/dev/null > ${BDIR}/verdicts.jsonl\n` +
  `3. Aggregate:\n` +
  `   python3 ${ROOT}/gates/scripts/aggregate.py ${BDIR}/verdicts.jsonl --candidates-dir ${BDIR}/candidates --json ${BDIR}/report.json\n` +
  `   Treat any "WARNING ... not in candidates/" as a STOP-and-report (id namespace mismatch).\n\n` +
  `${ANTIPARK}\n\n` +
  `Return JSON {orphan_warning:bool, statuses:{<candidate_id>:"<status>"}, dead:[ids], incomplete:[ids], survived:[ids]} ` +
  `read from report.json (status field per candidate).`,
  { label: 'aggregate', phase: 'Aggregate', ...OPUS, effort: 'low',
    schema: { type: 'object', required: ['statuses', 'survived'],
      properties: { orphan_warning: { type: 'boolean' }, statuses: { type: 'object' },
        dead: { type: 'array' }, incomplete: { type: 'array' }, survived: { type: 'array' } } } }
)
log(`aggregate: ${(agg && agg.survived || []).length} survived, ${(agg && agg.dead || []).length} dead, ${(agg && agg.incomplete || []).length} incomplete`)
if (STOP_AFTER === 'aggregate' || !agg) return { stage: 'aggregate', prep, fleet: fleetResults, agg }

const survivors = agg.survived || []

// =============================================================================
// Stages 6-8: LANGUAGE -> PEDAGOGY -> SWEEP, pipelined per survivor
// (each survivor flows through all three without a barrier)
// =============================================================================
const editRecipe =
  `Apply edits by loading the JSON in python3, changing only the flagged field(s), and dumping with ` +
  `json.dump(d, open(p,'w'), ensure_ascii=False, indent=1) then stripping the trailing newline ` +
  `(so the file stays byte-consistent with its siblings). NEVER reflow untouched fields.`

const reGate =
  `Re-gate: run python3 ${ROOT}/gates/scripts/run_mech.py <file> --no-plagiarism (must pass M-SCHEMA/M-BANDS/M-TELL), ` +
  `and confirm option letters + keys are byte-identical to the input UNLESS you deliberately changed an answer ` +
  `(in which case set regate_needed:true and describe it).`

const record = (stage, cid, verdict) =>
  `Append EXACTLY one line to ${BDIR}/reviews/${stage}.jsonl with Bash: ` +
  `{"candidate_id":"${cid}","stage":"${stage}","verdict":"${verdict}","reviewed_by":"${stage}-review/opus","date":"${DATE}"} ` +
  `(use the verdict you actually assigned).`

phase('Language')
const pipelined = await pipeline(
  survivors,
  // Stage 6: language
  (cid) => agent(
    `Invoke the expert-language-review skill and adjudicate this unit for NATIVE language quality: ` +
    `${BDIR}/candidates/${cid}.json (${lasUnits.includes(cid) ? 'Swedish' : 'English'}). ` +
    `APPLY your fixes (calques, agreement, register breaks) — do not just flag. ` +
    `Write the corrected unit to ${BDIR}/candidates-corrected/${cid}.json (mkdir -p first; if no edits needed, copy it verbatim). ${editRecipe} ${reGate} ` +
    `Then ${record('language', cid, '<CLEAR|CORRECTED|REJECT>')} ${ANTIPARK} ` +
    `Return the review result (verdict CLEAR if already clean, CORRECTED if you edited, REJECT if unsalvageable).`,
    { label: `lang:${cid}`, phase: 'Language', ...OPUS, effort: 'high', schema: REVIEW_SCHEMA(['CLEAR', 'CORRECTED', 'REJECT']) }
  ).then(r => ({ cid, language: r })),
  // Stage 7: pedagogy
  (prev) => {
    const cid = prev.cid
    return agent(
      `Invoke the pedagogy-review skill and adjudicate this LANGUAGE-CLEARED unit: ${BDIR}/candidates-corrected/${cid}.json. ` +
      `Probe comprehension-not-recall, distractor pedagogical value, RATIONALE FACTUAL ACCURACY, and surface tells. ` +
      `APPLY fixes (you may edit keys/distractors/rationales, but PRESERVE exactly one defensible key). ` +
      `Write the result to ${BDIR}/candidates-final/${cid}.json (mkdir -p first; copy verbatim if no edits). ${editRecipe} ` +
      `If you changed a key/distractor, set regate_needed:true. ${reGate} ` +
      `Then ${record('pedagogy', cid, '<SOUND|MINOR_FIXES|NEEDS_REDESIGN|REJECT>')} ${ANTIPARK} ` +
      `Return the review result.`,
      { label: `ped:${cid}`, phase: 'Pedagogy', ...OPUS, effort: 'high', schema: REVIEW_SCHEMA(['SOUND', 'MINOR_FIXES', 'NEEDS_REDESIGN', 'REJECT']) }
    ).then(r => ({ ...prev, pedagogy: r }))
  },
  // Stage 8: integrated sweep
  (prev) => {
    const cid = prev.cid
    return agent(
      `Invoke the integrated-review skill and run the FINAL whole-unit cross-consistency sweep of ` +
      `${BDIR}/candidates-final/${cid}.json. Work every checklist row; a finding names TWO conflicting loci. ` +
      `The highest-yield row is rationale<->CURRENT option/passage fidelity (the pedagogy stage just edited this file). ` +
      `If you find an INCONSISTENT/BLOCKED_SHIP issue whose fix is rationale/metadata-only (regate:false), APPLY the fix ` +
      `in place (${editRecipe}) and re-read to confirm it now coheres; set fixed:true and downgrade the verdict to CONSISTENT/MINOR_NOTES. ` +
      `If the fix would touch a key/option/stem, do NOT apply it — leave the verdict INCONSISTENT and describe it. ` +
      `Then ${record('integrated', cid, '<CONSISTENT|MINOR_NOTES|INCONSISTENT|BLOCKED_SHIP>')} ${ANTIPARK} ` +
      `Return the sweep result.`,
      { label: `sweep:${cid}`, phase: 'Sweep', ...OPUS, effort: 'high', schema: SWEEP_SCHEMA }
    ).then(r => ({ ...prev, integrated: r }))
  }
)
const reviewed = pipelined.filter(Boolean)
log(`reviews done for ${reviewed.length}/${survivors.length} survivors`)
if (STOP_AFTER === 'sweep') return { stage: 'sweep', prep, agg, reviewed }

// =============================================================================
// Stage 9: V-FINAL VERIFY — the double cross-check over the reviewers.
// Fresh blind G-KEY x2 + G-DISTRACTOR on the EXACT shipping files, plus an
// adversarial meta-audit of the recorded stage verdicts. The VERIFIED/REFUTED
// fold is deterministic script code, not agent judgment.
// =============================================================================
phase('Verify')
const VDIR = `${BDIR}/verdicts-vfinal`
const vprep = await agent(
  `You are V-FINAL PREP. Repo root. Rebuild judge sheets from the FINAL files (they were edited since the fleet ran):\n` +
  `For EACH ${BDIR}/candidates-final/*.json: overwrite ${BDIR}/blind/<id>.json with ` +
  `jq 'del(.questions[].key, .questions[].rationale, .questions[].generator_meta, .questions[].family) | del(.key, .rationale, .family, .generator_meta)' <final>, ` +
  `and ${BDIR}/distractor/<id>.json with jq 'del(.questions[].rationale, .questions[].generator_meta) | del(.rationale, .generator_meta)' <final>. ` +
  `VERIFY zero leaks on every blind sheet (grep -E '"(key|rationale|generator_meta|family)"' returns nothing) — contaminated => STOP, report contaminated:true. mkdir -p ${VDIR}.\n${ANTIPARK}\n` +
  `Return JSON {contaminated:bool, sheets:int}.`,
  { label: 'v-prep', phase: 'Verify', ...OPUS, effort: 'low',
    schema: { type: 'object', required: ['contaminated', 'sheets'],
      properties: { contaminated: { type: 'boolean' }, sheets: { type: 'integer' } } } }
)
if (!vprep || vprep.contaminated) return { aborted: 'v-prep', vprep }

const finalIds = reviewed.map(r => r.cid)
const vjudge = (gate, vote, sheetDir, promptFile, extra) => () =>
  agent(
    `You are gate ${gate}${vote ? ` (independent vote ${vote})` : ''} in the V-FINAL verification pass (final shipping files). ` +
    `Read ${ROOT}/gates/prompts/${promptFile} and follow it EXACTLY. Judge from ${BDIR}/${sheetDir}/: ${finalIds.join(', ')}. ` +
    `${sheetDir === 'blind' ? 'Sheets have NO key — if you see key/rationale fields, STOP and report contamination. ' : 'Sheets KEEP the key so you can hunt second defensible answers. '}` +
    `${extra || ''}\n${VERDICT_FIELDS}\n` +
    `Write to ${VDIR}/verdicts-${gate.toLowerCase().replace(/-/g, '')}${vote ? `-${vote}` : ''}.jsonl\n${ANTIPARK}\n` +
    `Return JSON {gate, lines_written:int, kills:int, flags:int}.`,
    { label: `v:${gate}${vote ? `-${vote}` : ''}`, phase: 'Verify', ...OPUS, effort: 'high',
      schema: { type: 'object', required: ['gate', 'lines_written'],
        properties: { gate: { type: 'string' }, lines_written: { type: 'integer' }, kills: { type: 'integer' }, flags: { type: 'integer' } } } }
  )

const AUDIT_SCHEMA = {
  type: 'object', required: ['candidate_id', 'audit_verdict', 'findings'],
  properties: {
    candidate_id: { type: 'string' },
    audit_verdict: { type: 'string', enum: ['CONFIRMED', 'CONFIRMED_NOTES', 'REFUTED'] },
    findings: { type: 'array', items: { type: 'object',
      required: ['severity', 'stage_challenged', 'claim', 'evidence', 'why'],
      properties: { severity: { type: 'string', enum: ['blocker', 'major', 'minor'] }, stage_challenged: { type: 'string' },
        claim: { type: 'string' }, evidence: { type: 'string' }, why: { type: 'string' } } } },
  },
}
const vaudit = (cid) => () =>
  agent(
    `You are the ADVERSARIAL META-AUDITOR — the reviewer of the reviewers. Try to REFUTE the recorded reviews of this unit: ` +
    `find a real defect the stages should have caught, or prove a recorded verdict wrong.\n` +
    `Unit (exact shipping file): ${BDIR}/candidates-final/${cid}.json\n` +
    `Records to audit: the ${cid} lines in ${BDIR}/reviews/language.jsonl, pedagogy.jsonl, integrated.jsonl.\n` +
    `Work each: (1) LANGUAGE — hunt passage+options for a missed calque/agreement/register/spelling-variety defect; ` +
    `(2) PEDAGOGY — fact-check every factual claim in every rationale; one false claim refutes the verdict; ` +
    `(3) INTEGRATED — every quoted phrase in every rationale must appear VERBATIM in current option/passage text; no self-contradiction; no cross-question leak; trap labels name the actual trap; ` +
    `(4) KEY SANITY — each keyed answer must be the single best per the passage, defensible to a complaining student.\n` +
    `Refute with EVIDENCE (exact quotes), not vibes; report only defects that would change a stage verdict. ` +
    `CONFIRMED is the expected outcome for a clean unit. CONFIRMED_NOTES for real-but-minor observations. REFUTED only for a demonstrable miss.\n` +
    `Persist YOUR OWN audit result (this is your finding, not someone else's): mkdir -p ${BDIR}/audits and write the exact JSON object you return to ${BDIR}/audits/${cid}.json. Edit nothing else.\n` +
    `${ANTIPARK}\nReturn the structured audit for ${cid}.`,
    { label: `v-audit:${cid}`, phase: 'Verify', ...OPUS, effort: 'high', schema: AUDIT_SCHEMA }
  )

const vRes = await parallel([
  vjudge('G-KEY', 1, 'blind', 'G-KEY.md', 'Blind-solve every question; commit solver_answer before any key reasoning. target q:<n>.'),
  vjudge('G-KEY', 2, 'blind', 'G-KEY.md', 'Independent blind solve. target q:<n>.'),
  vjudge('G-DISTRACTOR', null, 'distractor', 'G-DISTRACTOR.md', 'Kill only genuinely defensible 2nd answers.'),
  ...finalIds.map(cid => vaudit(cid)),
])
const vAudits = vRes.slice(3).filter(Boolean)

const vresolve = await agent(
  `You are V-FINAL RESOLVE. Repo root. Run mechanically:\n` +
  `1. python3 ${ROOT}/gates/scripts/gkey_resolve.py '${VDIR}/verdicts-gkey-*.jsonl' --candidates-dir ${BDIR}/candidates-final --out ${VDIR}/verdicts-gkey-resolved.jsonl\n` +
  `2. From the resolved file + ${VDIR}/verdicts-gdistractor.jsonl count per candidate_id: gkey kill lines, gdistractor kill lines, gdistractor flag lines.\n` +
  `${ANTIPARK}\nReturn JSON {per_unit:{cid:{gkey_kills:int, gdistr_kills:int, gdistr_flags:int}}}.`,
  { label: 'v-resolve', phase: 'Verify', ...OPUS, effort: 'low',
    schema: { type: 'object', required: ['per_unit'], properties: { per_unit: { type: 'object' } } } }
)
if (!vresolve) return { aborted: 'v-resolve', vAudits }

// final_verify derivation: vfinal_fold.py derives the records from on-disk
// evidence (resolved G-KEY + G-DISTRACTOR lines + the audits/ files the
// auditors persisted themselves). No agent ever writes a verification record —
// a record an agent can write is a record an agent can fabricate.
const vfold = await agent(
  `You are V-FINAL FOLD. Repo root. Run mechanically and report raw output:\n` +
  `python3 ${ROOT}/gates/scripts/vfinal_fold.py --verdicts-dir ${VDIR} --audits-dir ${BDIR}/audits --candidates-dir ${BDIR}/candidates-final --out ${BDIR}/reviews/final_verify.jsonl --date ${DATE}\n` +
  `Do NOT edit any file yourself — the script is the only writer. ${ANTIPARK}\n` +
  `Return JSON {verified:int, verified_notes:int, refuted:int, raw_stdout:"..."}.`,
  { label: 'v-fold', phase: 'Verify', ...OPUS, effort: 'low',
    schema: { type: 'object', required: ['verified', 'verified_notes', 'refuted'],
      properties: { verified: { type: 'integer' }, verified_notes: { type: 'integer' },
        refuted: { type: 'integer' }, raw_stdout: { type: 'string' } } } }
)

// =============================================================================
// Stage 10: PROMOTE — the hard "nothing slips" gate
// =============================================================================
phase('Promote')
const promoteResult = await agent(
  `You are the PROMOTE stage — the hard gate. Run:\n` +
  `  python3 ${ROOT}/gates/scripts/promote.py --batch-dir ${BDIR} --candidates-dir ${BDIR}/candidates-final --require-clean\n` +
  `Report its FULL stdout and its exit code exactly. Exit 0 = every unit cleared every stage; exit 1 = at least one HOLD. ` +
  `Do NOT edit anything to force a pass. ${ANTIPARK}\n` +
  `Return JSON {exit_code:int, pass:[ids], hold:[{candidate_id, reasons:[...]}], raw_stdout:"..."}.`,
  { label: 'promote', phase: 'Promote', ...OPUS, effort: 'low',
    schema: { type: 'object', required: ['exit_code', 'pass', 'hold'],
      properties: { exit_code: { type: 'integer' }, pass: { type: 'array' },
        hold: { type: 'array' }, raw_stdout: { type: 'string' } } } }
)

return {
  batch: BATCH,
  units: units.length,
  gate_dead: agg.dead || [],
  gate_incomplete: agg.incomplete || [],
  survivors,
  reviewed,
  final_verify_fold: vfold,
  audit_refutations: vAudits.filter(a => a.audit_verdict === 'REFUTED'),
  promote: promoteResult,
  clean: !!promoteResult && promoteResult.exit_code === 0,
}
