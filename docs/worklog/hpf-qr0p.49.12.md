# Worklog — hpf-qr0p.49.12

## Findings

- 2026-10-30: Claimed the assigned bead at clean base bd59f8021556b37475af0801a67551c831caaf13. Dependencies are present and no molecule controls the bead. SessionPlayer owns asynchronously hydrated picks, while the Folio call passes only the current pick.

## Decisions

- Add a regression through the real SessionPlayer and Folio stage before wiring the missing prop. Verify already available and delayed saved attempts without disturbing the current choice or submitting historical answers.
- Inspect the 36 prior-audit candidates against checked-in passages. Correct only demonstrated explanation errors; preserve paraphrases and ambiguous extraction cases. Keep changed source and served JSON byte-identical.
- Follow accepted delivery rules: uncommitted changes, verification evidence, then park the bead for coordinator delivery.

## Progress

- [S:codex-2|W:hpf-qr0p.49.12|H:inspect|E:clean base, accepted design and prior audit inspected]

## Handoff

- Work in progress.

## 2026-10-30 — implementation and content triage

- Passed the plan-aligned `picks` from SessionPlayer to LazyFolioSessionStage, adjacent to the current `picked`. Classic rendering is unchanged.
- Added three integration regressions through the real SessionPlayer and lazy Folio stage. The session resumes at the third gap of a block following another block, so the fixture exercises whole-plan indexing. Cached history, delayed history while choosing, and delayed history after grading all restore one wrong and one right earlier answer; the current choice/verdict persists, and only the current answer is submitted.
- Red-first: `pnpm test src/components/session/SessionPlayer.resume.test.tsx --maxWorkers=2` failed all three cases because prior gaps remained blank. An earlier fixture assertion was corrected from the nonexistent state future to the actual unfilled state blank before the final red run. After the single production prop change, the same command passed **3/3**.
- Triage used the current bank text and the paragraph numbers displayed by `toDrillQuestion`, excluding its recognized title. **32 direct references corrected across 14 files**, with identical edits to the source and served stores. Only ordinal words changed; quotes, options, answers, math and ELF English are untouched.
- Several displayed paragraphs reflect extraction splits, collapsed text, or a separate bibliographic notice. The corrections make direct locators accurate for the text currently served; they do not repair extraction or claim agreement with the original PDF paragraph layout. The corpus is unchanged.
- Four field-level candidates below are retained because their quote match does not identify the ordinal’s referent. The separate 80 unlocatable and 18 unpaired fields remain untouched.

### Corrected references

Array indices in field paths are zero-based. Quoted anchors are excerpts; the complete unchanged quotation remains in each JSON field.

| qid | Field | Old ordinal | New ordinal | Quoted anchor | Reason |
| --- | --- | --- | --- | --- | --- |
| host-2013-verb1-LÄS-012 | `distractors.1.why_tempting` | femte | sjätte | kunskapsluckor | The quoted word occurs in numbered paragraph 6; paragraph 5 discusses who initiates conflict. |
| host-2014-verb1-LÄS-014 | `steps.1.text` | femte | sjätte | Svekregeln var därmed tillämplig och domstolen ogiltigförklarade avtalet. | The decision quote is in paragraph 6, after the extraction split between kunde and bevisa. |
| host-2014-verb1-LÄS-018 | `steps.1.text` | femte | sjunde | Denna synvinkel är något skev eftersom nihilism, som jag förstår den, förutsätter en extrem subjektivism som i mina ögon bäst gestaltas av Gös… | The objection is in paragraph 7. Paragraph 5 is only the continuation ending gemensamma nämnare. |
| host-2015-verb1-LÄS-016 | `steps.1.text` | andra | tredje | Putins stålgrå blick, ofta mytologiserad, ser hon som ett uttryck för hans kameleontlika natur. Putin är egentligen ointressant. Han är den ha… | The review notice is numbered paragraph 1; the quoted assessment is in paragraph 3. |
| host-2016-verb2-LÄS-012 | `steps.1.text` | fjärde | femte | Infektionen är i princip omöjlig att utrota eftersom smittan finns hos både vilda och tama fåglar. | The extraction splits framför allt across paragraphs 3–4; all quoted reasons are in paragraph 5. |
| host-2017-verb2-LÄS-019 | `steps.1.text` | åttonde | nionde | Där Calocaris lever finns till exempel också ofta ormstjärnor av släktet Amphiura chiaei. Ormstjärnorna finns i stora tätheter (1 000/m2) stra… | Paragraph 8 concerns total oxygen use; paragraph 9 describes the brittle stars. |
| host-2020-verb1-LÄS-012 | `steps.1.text` | tredje | första | I sin avhandling i evolutionär genetik vid Uppsala universitet har Pontus Skoglund tillsammans med kollegor utarbetat nya metoder som möjliggö… | The extracted introduction has collapsed into paragraph 1, which contains the methods quote. |
| host-2020-verb2-LÄS-017 | `steps.1.text` | tredje | första | Internationella jämförande kunskapsmätningar som PISA, PIRLS och TIMSS har övertagit forskningens roll som utbildningspolitisk riktningsgivare. | The international-comparison sentence is in extracted paragraph 1. |
| host-2020-verb2-LÄS-019 | `steps.1.text` | fjärde | första | Men till skillnad från i Sverige väljer man att söka stöd i den pedagogiska forskningen för att analysera problemet och finna lösningar. Sålun… | The Norway comparison is also in extracted paragraph 1. |
| host-2022-verb1-LÄS-014 | `steps.1.text` | andra | första | Det är en ständig kamp om vem som ska ta ansvar för att driva utvecklingen. Rektorer tycker att de saknar ekonomiska resurser medan politiker … | The responsibility dispute is in extracted paragraph 1; paragraph 2 begins mid-sentence. |
| host-2024-verb1-LÄS-020 | `steps.1.text` | femte | första | De mål och riktlinjer som statsmakterna satte upp för omstruktureringen har med ett par undantag uppfyllts. Integreringen av geografisk inform… | The findings quote is in the long introduction, paragraph 1; paragraph 5 is a proposal bullet. |
| host-2024-verb2-LÄS-013 | `steps.1.text` | fjärde | första | Numera används neuropsykiatri ofta i en vidare mening. Eftersom alla mentala avvikelser – i enlighet med den filosofiska materialis- men – ger… | The modern definition occurs in extracted paragraph 1; paragraph 4 is the byline. |
| host-ver1-2019-verb2-LÄS-011 | `steps.1.text` | andra | första | Med motsvarande motivering kom HFD fram till att regeringens beslut skulle stå fast i mål nr 982-12, 2686-12, 2803-12, 2828-12, 3132-12 och 36… | The quoted cases and preceding justification are both in paragraph 1. |
| host-ver2-2019-verb1-LÄS-012 | `steps.1.text` | tredje | andra | För Piaget handlade det om hur barns tänkande och kunskap uttrycks i språket, för Vygotskij snarare om en rörelse i motsatt riktning: hur soci… | The question is paragraph 1; the answer containing the comparison is paragraph 2. |
| host-ver2-2019-verb2-LÄS-017 | `steps.1.text` | fjärde | första | rätta listan | The debate-logic quotation occurs in paragraph 1; paragraph 4 concerns the book’s self-analysis. |
| var-2013-verb1-LÄS-019 | `steps.1.text` | sjätte | sjunde | Eftersom den etablerade arbetarrörelsen så kraftigt beskar arbetslöshetsrörelsens möjligheter till mobilisering och dess handlingsutrymme kan … | The bibliographic notice is numbered paragraph 1; the quoted question occurs in paragraph 7. |
| var-2013-verb2-LÄS-015 | `steps.1.text` | femte | åttonde | Det rimliga vore, i brist på överenskommelse, att situationen tolkas som att du skall kompenseras för din nedlagda övertid, särskilt som det b… | The question and signature occupy paragraphs 1–4; the compensation argument is in paragraph 8. |
| var-2014-verb1-LÄS-013 | `solution_path` | tredje | fjärde | Ännu ett krav är att det inte får finnas någon annan lämplig lösning på problemet. | The subtitle is numbered paragraph 1; the statutory requirement is in paragraph 4. |
| var-2016-verb1-LÄS-011 | `steps.1.text` | första | andra | En mer passande skivtitel hade kanske varit The Lutenists of the Golden Age, som ju innefattar både den elisabetanska och den efterföljande pe… | The record notice is numbered paragraph 1; the proposed title is in paragraph 2. |
| var-2016-verb1-LÄS-011 | `steps.3.text` | andra | tredje | alla mer eller mindre djupt rotade i den elisabetanska myllan | The composers’ roots are described in paragraph 3 after the record notice. |
| var-2016-verb1-LÄS-012 | `steps.1.text` | femte | sjunde | Därför är det av ett visst intresse att få mer detaljerad information om vilka källor som använts för respektive verk. Det saknas här, samtidi… | The missing source information is in paragraph 7, after the notice and the split Almain sentence. |
| var-2016-verb1-LÄS-013 | `steps.1.text` | sjätte | sjunde | Den förklaringsmodell som Berglund sedan utarbetar grundar sig på antagandet att ovanstående attityder i allt väsentligt formas i den arbetssi… | The model assumption is in paragraph 7, after the extraction split in paragraphs 4–5. |
| var-2016-verb1-LÄS-014 | `distractors.1.why_wrong` | femte | sjätte | övervägande fokusering på inkomstaspekten av en anställning | The definition of instrumental attitude is in paragraph 6. |
| var-2016-verb1-LÄS-014 | `steps.1.text` | sjätte | sjunde | chefer och professionella är överordnade medan servicearbetare och manuella arbetare är underordnade. | The hierarchy statement is in paragraph 7. |
| var-2016-verb1-LÄS-014 | `steps.2.text` | sjunde | åttonde | överordnade vilka är lojala mot organisationen | The four hypotheses and both quoted groups are in paragraph 8. |
| var-2016-verb1-LÄS-015 | `steps.3.text` | femte | sjätte | en positiv värdering av möjligheten att hjälpa andra och vara nyttig för samhället | The definition of altruistic attitude is in paragraph 6. |
| var-2026-verb1-LÄS-011 | `steps.1.text` | tredje | andra | Det övergripande syftet med vårt forskningsprojekt är att undersöka om refor- men av gymnasieskolan påverkar yrkesprogramelevernas medborgarko… | The purpose statement opens paragraph 2; paragraph 3 is the byline. |
| var-2026-verb1-LÄS-012 | `steps.1.text` | andra | första | Reformen av gymnasieskolan (Gy 11) innebar en förändring så till vida att mindre fokus numera läggs på skolans medborgarfostrande uppdrag meda… | The reform-focus sentence ends extracted paragraph 1. |
| var-2026-verb1-LÄS-014 | `steps.2.text` | tredje | femte | Ola Nilssons påpekande att läsning till skillnad från lyssning kräver att man på egen hand för texten framåt är visserligen korrekt, men gör d… | Åberg’s response appears in paragraph 5 of the combined two-article context, not paragraph 3. |
| var-2026-verb2-LÄS-011 | `steps.1.text` | andra | första | tiden och dess nitiska budbärare och handgångna män oavbrutet söker hindra oss. De stryker ut reflexerna i fönstrens glas, imfigurerna i badru… | The messenger passage is in the only body paragraph (1); paragraph 2 is the byline. |
| var-2026-verb2-LÄS-013 | `steps.1.text` | tredje | första | Arbetet startade med utgångspunkt i forskares och verksamhetsföreträdares bedömning av inom vilka områden det fanns kunskap att sammanställa o… | The guidelines passage is in extracted paragraph 1, not the later leadership discussion. |
| var-2026-verb2-LÄS-017 | `steps.1.text` | andra | första | Men mycket skiljer nord från syd, och den viktigaste skillnaden är att länder som Egypten och Tunisien är långt mer homogena samhällen än vad … | The northern/southern comparison is in paragraph 1 after excluding the title En afrikansk vår?. |

### Retained candidates

| qid | Field | Old → retained ordinal | Matched quote / referent | Decision |
| --- | --- | --- | --- | --- |
| host-2013-verb1-LÄS-013 | `steps.4.text` | sjätte → sjätte | “rent konstnärligt värde” occurs in ¶7, but the ordinal describes the utility arguments in ¶6. | Correct reference to a different sentence; changing to seventh would introduce an error. |
| host-2022-verb1-LÄS-016 | `steps.1.text` | tredje → tredje | “Vi lever i digitaliseringens tidevarv” and the internet-entertainment quote occur in ¶2; the ordinal qualifies the later MIK paraphrase instead. | Leave the paraphrase alone as instructed. Its original paragraph boundaries are flattened into current ¶1; the mechanical 3 → 2 proposal does not follow the named referent. |
| host-2025-verb1-LÄS-014 | `steps.4.text` | första → första | “rättmätiga erkännande” is in ¶2; the ordinal describes the rejection of option B in ¶1 (“Det finns anledning att ifrågasätta detta påstående”). | Different referents within the same field; retain. |
| var-2015-verb2-LÄS-020 | `steps.1.text` | fjärde → fjärde | The “multitablett” quote is in ¶13 and explicitly located in the final part. The following vitality/wellbeing quote is correctly located in ¶4. | The audit pairs the ordinal with the wrong quote. Retain both. |

### Verification and remaining companion edit

- `pnpm typecheck`: passed.
- `pnpm lint`: passed after formatting the new test, with the same four informational devbake diagnostics.
- Full `pnpm test` **without --maxWorkers**: **5,279 passed / 2 failed**, **180 files passed / 2 failed**, in 59.17 seconds. The resume tests and existing classic/Folio tests passed.
- One failure is the known sandbox limitation in `src/lib/trapIndex.test.ts`: `spawnSync /usr/bin/node EPERM`. Coordinator must rerun this generator check on the host; no process-policy workaround was attempted.
- The other failure is the real-bank audit’s frozen content expectation at `app/src/folio/screens/drill/toDrillQuestion.test.ts:119`. It expects `ordinal: 2` for `var-2026-verb2-LÄS-017.steps.1.text`, which this content correction changes to 1. The file is outside the admitted write set. Required coordinator companion edit:

```diff
-      { qid: 'var-2026-verb2-LÄS-017', path: '.steps.1.text', ordinal: 2, before: 2, after: 1 },
+      { qid: 'var-2026-verb2-LÄS-017', path: '.steps.1.text', ordinal: 1, before: 2, after: 1 },
```

- Read-only Python verification passed: **32 ordinal-only field changes, 14 byte-identical source/served pairs, all 32 new ordinals match the unchanged quote’s numbered paragraph, and no other JSON values differ from HEAD**.
- Repository sync inspection: `app/scripts/sync-dataset.sh` synchronizes all bank/figure/explanation trees with `rsync --delete`; it has no read-only check mode and would exceed this bead’s scope. Used the bounded byte-comparison check instead. CI has no separate explanation sync/lint gate.
- `git diff --check`: passed. Build pending at this entry. Worker source and dependencies are unchanged.
- [S:codex-2|W:hpf-qr0p.49.12|H:verify|E:3 expected red then 3 green; 32 ordinal-only corrections; source/served equality; full app 5279 passes and two documented failures]

### Playbook-proposal — gas-city-coordinator / astra-relay

- 2026-10-30: A content-only correction broke a prior corpus audit because it pinned the old erroneous ordinal in a source test outside the write set. Before admitting explanation fixes, include tests that assert live corpus values or replace those assertions with invariants that survive valid content corrections. Managed worker roots exclude `~/scratch/skill-gotchas/`; this proposal is preserved here for coordinator relay using the astra-relay worker fallback.

### Reproducing the bounded content check

Run the following read-only Python from the repository root against the unchanged base HEAD (before committing this slice). It checks source/served byte equality, the precise allowed JSON delta, and quote locations in the current bank; it is intentionally scoped to this 36-candidate inventory.

```python
import json, pathlib, re, subprocess

root = pathlib.Path(".")
old_log = (root / "docs/worklog/hpf-qr0p.49.11.md").read_text()
rows = re.findall(r"^((?:host|var)-[^.]+)\.([^:]+): (\d+) → (\d+)$", old_log, re.M)
ordinals = "första andra tredje fjärde femte sjätte sjunde åttonde nionde tionde".split()
retained = {1, 11, 14, 21}
changed = [row for index, row in enumerate(rows) if index not in retained]
assert len(rows) == 36 and len(changed) == 32
files = sorted({qid.split("-verb")[0] + ".json" for qid, *_ in changed})
for file in files:
    source = root / "data/explanations" / file
    served = root / "app/public/explanations" / file
    assert source.read_bytes() == served.read_bytes(), file
    expected = json.loads(subprocess.check_output(
        ["git", "--no-optional-locks", "show", "HEAD:data/explanations/" + file], text=True))
    for qid, field, old, new in changed:
        if qid.split("-verb")[0] + ".json" != file:
            continue
        obj = expected[qid]
        parts = field.split(".")
        for part in parts[:-1]:
            obj = obj[int(part)] if isinstance(obj, list) else obj[part]
        original = obj[parts[-1]]
        replacement = ordinals[int(new) - 1]
        updated, count = re.subn(
            r"\b" + ordinals[int(old) - 1] + r"(?=\s+stycket)",
            lambda m: replacement.capitalize() if m[0][0].isupper() else replacement,
            original, flags=re.I)
        assert count == 1, (qid, field)
        obj[parts[-1]] = updated
        bank = json.loads((root / "app/public/data" / file).read_text())
        question = next(q for q in bank if q["qid"] == qid)
        paragraphs = re.split(r"\n\n+", question["context"])
        if len(paragraphs[0]) <= 90 and paragraphs[0][-1:] not in ".!":
            paragraphs.pop(0)
        quotations = [next(s for s in match if s) for match in re.findall(
            r'"([^"\n]+)"|“([^”\n]+)”|”([^”\n]+)”', updated)]
        quotations = [re.sub(r"\s+", " ", s).strip() for s in quotations if len(s.strip()) >= 12]
        locations = {i + 1 for s in quotations for i, p in enumerate(paragraphs)
            if s.lower() in p.lower() or re.sub(r"[.,;:…]+$", "", s).lower() in p.lower()}
        assert locations == {int(new)}, (qid, locations)
    assert json.loads(source.read_text()) == expected, file
print("PASS: 32 ordinal-only edits; 14 synchronized pairs; all quote locations verified.")
```

### Final verification update

- `pnpm build` passed, including TypeScript, Vite and PWA generation (278 precache entries). Existing route-test discovery and chunk-size warnings remain.
- The content-check script above was executed and passed. Full-suite failures remain the two named above; no checks were skipped to claim a green run.

### Delivery handoff

- Explicit staging of the 31 changed/new admitted files was refused: the linked worktree index lock at `/home/loucmane/dev/hpfetcher/.git/worktrees/hpf-qr0p.49.12/index.lock` is on a read-only filesystem. The source changes are **unstaged and uncommitted**, based on **bd59f8021556b37475af0801a67551c831caaf13**. No alternate metadata path, signer, commit, push, merge or deployment was attempted.
- Implementation is ready for coordinator review, but the bead must remain **blocked** until the coordinator applies the exact one-line audit-test companion edit above, reruns the audit/full suite and trap-index generator on the host, and stages the changes. The out-of-scope test was preserved. No independent review or signed implementation head exists yet.
- Planned final control actions: record blocked worker state and the durable handoff on the bead, park it deferred with no assignee, verify that state, then drain. Do not close this bead.
- [S:codex-2|W:hpf-qr0p.49.12|H:handoff|E:typecheck/lint/build pass; full app 5279 pass and 2 fail; 32 content fields verified; staging read-only; coordinator companion edit required]
