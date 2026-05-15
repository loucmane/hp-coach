"""Build Layer-2 ELF explanations for var-2025 (Variant C, English).

Twenty entries: verb1 ELF-031..040 (4 comprehension passages), and
verb2 ELF-031..035 (cloze) + verb2 ELF-036..040 (mourning passage).

Save every 5 entries.
"""
from __future__ import annotations

import json
from pathlib import Path

OUT = Path('/home/loucmane/dev/hpfetcher/audit/_regen/var-2025-elf.json')

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}


def save(d: dict) -> None:
    OUT.write_text(json.dumps(d, indent=2, sort_keys=True, ensure_ascii=False))
    print(f"  saved {len(d)} entries -> {OUT}")


entries: dict[str, dict] = {}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-031 — Pedro II — "What is implied about Pedro II?"
# Answer: D — His removal was not in any obvious way related to his ability as a ruler.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-031"] = {
    "_meta": META,
    "solution_path": "The Pedro II passage spends most of its space cataloguing Pedro's successes — a growing economy, a thriving arts scene, victories in international disputes, the abolition of slavery — before noting his sudden overthrow. The contrast says his removal was not driven by failures as a ruler, which is exactly what D states.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What is implied about Pedro II?' — so you need an inference, not a direct quote. Look for a contrast the passage sets up, then ask which option captures it.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the framing sentence",
            "text": "The opening line frames the whole paragraph: 'Pedro II, emperor of Brazil, had already decided his throne would end with him when he was unexpectedly overthrown.' The word 'unexpectedly' is doing the heavy lifting — it signals that the coup did not follow naturally from how he governed.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Read the list of his achievements",
            "text": "The middle of the passage stacks up positives: 'Brazil's economy grew, the arts scene flourished and the emperor steered his country to victory in a string of international disputes. He also oversaw the abolition of slavery (in 1888).' These are the kinds of things a successful ruler does.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Inglorious' = shameful, disappointing. 'Disgruntled' = unhappy, dissatisfied. 'Sole heir' = the only person set to inherit. 'Drove him into exile' = forced him to leave the country. None of these words signal misrule; they describe an abrupt fall from a position of strength.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says immigration policy was unpopular — the passage says the opposite, Europeans 'arrived there in waves'. B says his rule led to slow decline — the passage describes growth and 'new glory days'. C says exile was a direct consequence of how he treated his daughter — the passage mentions the succession decision but never links it to the military coup. D says the removal was not obviously connected to his ability as a ruler — and that matches the full passage: a strong ruler abruptly overthrown.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is D. The passage sets up a clean contrast between a successful reign and an abrupt military coup — exactly the gap D names.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's easy to read 'disgruntled Europeans who arrived there in waves' as evidence that immigration was a sore point and assume the policy made him unpopular.",
            "why_wrong": "'Disgruntled' describes the immigrants' feelings about their home countries before they left — not Brazilians' feelings about Pedro. Step 5 makes this explicit: the passage frames the immigration influx as evidence of Brazil's attractiveness, not as a complaint.",
        },
        {
            "letter": "B",
            "why_tempting": "Many stop at the word 'overthrown' and read it as confirmation of a slow-burning failure — coups don't happen to successful rulers, the logic goes.",
            "why_wrong": "The passage explicitly says Brazil 'enjoyed new glory days under Pedro's care' and lists a string of successes. Step 3 inventories them. There is no decline narrative in the text — that is exactly the gap the question is asking you to notice.",
        },
        {
            "letter": "C",
            "why_tempting": "First instinct is to connect the daughter Isabel detail to the exile detail because they sit close together in the paragraph. Two facts next to each other invite a cause-effect reading.",
            "why_wrong": "Proximity is not causation. The passage describes the succession choice and the coup as separate facts; it never says the coup happened BECAUSE of how he treated Isabel. Step 2 flags 'unexpectedly' as the headline word — and an unexpected coup is the opposite of a coup with a clear cause.",
        },
    ],
    "technique": "On 'what is implied' items, look for a contrast or surprise the passage flags (here: 'unexpectedly overthrown' against a list of successes). The correct option usually names that gap explicitly. The trigger to memorise: words like 'unexpectedly', 'surprisingly', 'although', 'however' point to the inferred claim.",
    "pitfall": "When a passage lists positive achievements and then drops in a bad outcome, the correct inference is almost never 'the achievements were secretly bad'. It is usually 'the bad outcome did not follow from the achievements' — the contrast IS the implication.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-032 — Wildlife in Chernobyl — "What is the main point?"
# Answer: D — A human-free environment is highly beneficial for wildlife.
# NOTE: the parsed `context` is wrong (says Pedro II). Recovered from hp_databas.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-032"] = {
    "_meta": META,
    "solution_path": "The Chernobyl passage closes with Smith's quote — 'Whatever negative effects there are from radiation, they are not as large as the negative effects of having people there' — and the wildlife counts in the exclusion zone match or exceed those in clean reserves. The headline is that taking people out is doing more for the animals than radiation is doing against them, which is exactly D.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What is the main point?' — so you need the single idea the whole passage is built around, not a side fact. With main-point items, read once, then ask: if I had to title this paragraph in one sentence, what would I say?",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the closing claim",
            "text": "The final sentence is the headline: Smith says 'Whatever negative effects there are from radiation, they are not as large as the negative effects of having people there.' The passage builds up to this conclusion; everything earlier is evidence for it.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "After Chernobyl, people left. Wildlife counts in the exclusion zone match or beat counts in clean reserves nearby. Radiation hurts animals less than human presence does — so removing people has been a net win for the wildlife.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Fallout' = radioactive particles that fall to the ground after a nuclear accident. 'Vacated' = emptied of people. 'Abundance' = how many animals are there. 'Uncontaminated' = not polluted, clean. 'Reach or exceed' = match or beat. None of these words are about humans returning — they are about animal counts under conditions of human absence.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says humans may not safely return for a long time — the passage never makes a claim about future human return; it talks about the wildlife outcome of past departure. B says wildlife has recovered since the disaster — close, but 'recovered' implies a return to a previous baseline, while the passage says Chernobyl counts MATCH OR EXCEED nearby clean reserves. C compares radiation effects on wild animals vs. humans — the passage compares 'radiation' vs. 'having people there' as two separate harms; it does not compare species sensitivity. D says a human-free environment is highly beneficial for wildlife — exactly Smith's claim.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is D. Smith's closing quote is the headline; the wildlife counts in the body are the evidence; D names the structural claim both make together.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "First instinct on a radiation-themed passage is to assume the worry is about humans — 'Chernobyl is bad, humans can't go back' fits the cultural script around the disaster.",
            "why_wrong": "The passage is about wildlife, not the human return timeline. It does not even mention when or whether people might safely come back. Step 2 anchors you in the closing quote — radiation effects are described as smaller than human-presence effects, not as a barrier to human return.",
        },
        {
            "letter": "B",
            "why_tempting": "It's tempting to read 'wildlife counts match or exceed' as 'wildlife has recovered' — both phrases sound like good news for the animals.",
            "why_wrong": "'Recovered' implies the animals were once damaged and have now bounced back. The passage never establishes a damaged baseline — it just compares Chernobyl counts to clean reserves and finds them equal or higher. The main point is that human absence is a benefit, not that the animals are healing.",
        },
        {
            "letter": "C",
            "why_tempting": "Many stop at the contrast between 'radiation' and 'having people there' and read it as a comparison of how different species respond to radiation.",
            "why_wrong": "The contrast is between two separate harms (radiation and human presence) acting on the SAME animals — not between how wild animals and humans differ in radiation sensitivity. Step 5 makes the gap visible: the passage never claims wild animals are tougher than humans.",
        },
    ],
    "technique": "On 'main point' items, find the sentence that names the surprising mechanism (here: human presence harms wildlife more than radiation does). The correct option restates that mechanism. The trigger to memorise: a closing quote that sounds counter-intuitive is almost always the headline.",
    "pitfall": "Cultural priors about Chernobyl pull you toward options about humans and radiation. The passage redirects the focus to wildlife — read the question prompt before letting the topic word ('Chernobyl') decide your answer.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-033 — Florence Nightingale (intro paragraphs)
# "What is implied about Florence Nightingale and nursing in the introductory paragraphs?"
# Answer: B — Her once revolutionary ideas have long been common practice the world over.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-033"] = {
    "_meta": META,
    "solution_path": "The opening paragraphs frame Nightingale as the founder of modern nursing and hospital sanitation, and add that if she dropped in on a hospital today she would be 'pleased to see the progress'. The implication is that the principles she pioneered are now standard practice — exactly what B says.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks what is IMPLIED in the INTRODUCTORY paragraphs — so confine your search to the opening two paragraphs and look for an inference, not a direct quote.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the framing sentence",
            "text": "Two sentences carry the implication. First: Nightingale 'established the principles of modern nursing and hospital sanitation'. Second: 'If she were to drop in on a hospital today, Nightingale would be pleased to see the progress in nursing since her day.' The second sentence is the key — being 'pleased' means today's nursing reflects what she set out to do.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "Nightingale invented modern nursing and hospital cleanliness. If she visited a hospital today, she would approve — because the things she fought for (sanitation, professional standards, evidence) are now just how hospitals work. Her ideas, once new, are now everywhere.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Established the principles' = laid down the rules that became standard. 'Poised to change' = about to change. 'Revolutionary' = radically new at the time. 'Common practice' = the ordinary, standard way of doing things. The shift from 'revolutionary' to 'common practice' is exactly the arc the opening paragraphs describe.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says she was guided by intuition rather than hard facts — the passage says she pioneered statistical infographics and was the first woman in the Royal Statistical Society; she ran on data, not intuition. B says her once revolutionary ideas have long been common practice — fits the framing exactly. C says she had to endure male prejudice in using statistical evidence — the passage notes she was the first woman admitted to the Royal Statistical Society but says nothing about prejudice she had to endure; it celebrates her achievement, not her struggles. D says her reputation rests on practical work rather than scientific insights — the intro paragraphs highlight BOTH her practical work AND her statistical innovation, with no ranking.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is B. The intro paragraphs frame her ideas as foundational principles that today's hospitals have absorbed — once revolutionary, now ordinary.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "First instinct on a Victorian-era nurse is to imagine bedside instinct and compassion; the option leans on that stereotype.",
            "why_wrong": "The intro paragraphs explicitly call her work in statistical infographics 'pioneering' and note she was the first woman admitted to the Royal Statistical Society. Step 5 catches this: she was data-driven, not intuition-driven.",
        },
        {
            "letter": "C",
            "why_tempting": "It's tempting to read 'first woman admitted' as code for 'had to fight male prejudice to get there' — a familiar narrative about Victorian women.",
            "why_wrong": "The intro paragraphs report the achievement; they do not describe the prejudice she faced in using statistics. C imports an idea the introductory paragraphs do not state — and the question is restricted to those paragraphs.",
        },
        {
            "letter": "D",
            "why_tempting": "Many stop at her bedside work in the Crimean War and rank that above the pie-chart line, especially if 'practical' feels like the more obvious image of nursing.",
            "why_wrong": "The intro paragraphs give the practical work AND the scientific insight equal weight — they describe her as founder of nursing schools AND author of 200 papers AND a pioneer in statistical infographics. No ranking is implied. Step 2 anchors the comparison.",
        },
    ],
    "technique": "On 'introductory paragraphs' items, scan ONLY those paragraphs and look for the contrast they set up. Here: 'pleased to see the progress' implies what was once new is now standard. The trigger to memorise: a hypothetical visit ('if she could see today') is almost always the author's way of saying 'her ideas have become the default'.",
    "pitfall": "When a question scopes itself to a paragraph range, options often pull material from later in the passage. Always check whether the option's claim is actually IN the assigned section before picking it.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-034 — Florence Nightingale (present-day nursing)
# "What is argued in connection with present-day nursing?"
# Answer: D — It is increasingly blurring the old distinction between doctors and nurses.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-034"] = {
    "_meta": META,
    "solution_path": "The paragraph on today's nursing details how nurses are now doing tasks 'conventionally reserved for doctors' — administering anaesthetics, performing surgery, doing emergency caesarean sections, replacing GPs for chronic care. That is exactly the doctor-nurse line getting blurred, which is what D says.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks what is ARGUED about PRESENT-DAY nursing — so find the paragraph that describes nursing today and look for the structural claim the author is making about it.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key claim",
            "text": "The relevant paragraph opens with a headline sentence: 'In the years to come, nurses will be doing a growing number of tasks conventionally reserved for doctors, both in acute and chronic care.' Then it backs that up with examples: anaesthetics in America, abdominal/orthopaedic/cardiac surgery in Britain, emergency caesarean sections in sub-Saharan Africa, GP-replacement for diabetes.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "Doctors used to do A and nurses used to do B. The author is saying that line is moving — nurses are now doing more of A. They handle anaesthesia, parts of surgery, emergency C-sections, and ongoing chronic-disease care. The old wall between the two professions is becoming a softer boundary.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Conventionally reserved for' = traditionally only done by. 'Acute care' = short-term, urgent treatment. 'Chronic care' = long-term management of ongoing conditions. 'Blurring the distinction' = making the line between two things less clear. 'Tapped to replace' = chosen to take over from. These all describe a shift in WHO does WHAT, which is exactly D's claim.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says nursing is still mainly focused on practical patient needs — the passage says the opposite, nurses are doing increasingly technical doctor-level tasks. B claims patient safety always depends on doctor-nurse collaboration — the passage talks about role overlap, not about safety. C says nursing will gradually lose its personal qualities — the passage explicitly says the human touch remains central (later paragraph); the present-day paragraph emphasises expanded clinical scope, not loss of intimacy. D says nursing is blurring the doctor-nurse distinction — fits the four examples exactly.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is D. The paragraph stacks up four examples of nurses taking on doctor work — that is the structural argument, and D names it.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "If you remember nursing as bed-making and bedside care, A reads like the default truth about the profession.",
            "why_wrong": "The whole point of the paragraph is that this stereotype is outdated. Step 3's paraphrase makes it explicit: nurses now do anaesthetics and surgery. A describes nursing in Nightingale's time, not today.",
        },
        {
            "letter": "B",
            "why_tempting": "Doctor-nurse collaboration is the kind of always-true sentiment that feels safe to pick when you are unsure.",
            "why_wrong": "The passage is making a SPECIFIC argument about role overlap — not a generic safety claim. Step 2 anchors you in the headline sentence: 'tasks conventionally reserved for doctors'. That is about boundaries shifting, not about cooperation.",
        },
        {
            "letter": "C",
            "why_tempting": "Many stop at the words 'doctoral-level studies' and 'specialise in myriad clinical disciplines' and infer that more science means less intimacy — a familiar worry about modernisation.",
            "why_wrong": "The intimacy concern shows up much later in the passage as something Nightingale would NOT worry about ('its healing powers remain rooted in empathy'). The present-day paragraph itself argues the opposite of C — it celebrates expanded scope without claiming any loss.",
        },
    ],
    "technique": "On 'what is argued' items, find the headline sentence of the relevant paragraph and check whether the body examples support that headline. Here four examples (anaesthetics, surgery, C-sections, GP replacement) all back the same claim: boundary blurring. The trigger to memorise: when a paragraph opens with a 'tasks conventionally reserved for X' sentence, the argument is about role expansion.",
    "pitfall": "Options that sound like timeless wisdom about a profession (A's bedside focus, B's collaboration) are often distractors on 'what is ARGUED' items. The question is asking what THIS passage claims — pick the option whose evidence appears in THIS paragraph.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-035 — Florence Nightingale (most in accordance with the text)
# "Which of the following statements is most in accordance with the text?"
# Answer: B — Recent changes in nursing have left traces only in some parts of the world.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-035"] = {
    "_meta": META,
    "solution_path": "The passage names India, Germany and Portugal as places where nurses are 'still largely treated as doctors' minions' — meaning the modernisation described elsewhere has NOT reached every country evenly. That uneven spread is exactly what B claims.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks which statement is 'most in accordance with the text' — so you need the option that the passage as a whole supports, not the one that matches a single sentence in isolation.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the uneven-spread claim",
            "text": "The relevant paragraph opens: 'What would disappoint Nightingale in her time-travel to the present is that the transformation of nursing has been uneven.' Then it names countries: 'In countries as varied as India, Germany and Portugal, nurses are still largely treated as doctors' minions and may not even diagnose common ailments or prescribe medication.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "The earlier paragraphs talked about nurses doing more — surgery, anaesthetics, chronic-care management. But this paragraph adds a caveat: that progress is not everywhere. In countries like India, Germany and Portugal, nurses are still subordinate to doctors. So the modernisation is real but patchy — left traces in some places, not in others.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Uneven' = not the same everywhere; patchy. 'Doctors' minions' = subordinates with little independent authority. 'Left traces' = left visible signs of change. The phrase 'left traces only in some parts' is just a careful way of saying 'the changes happened in some countries but not others'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says nurses' close patient connections have been negatively affected — the passage says the opposite, that empathy and human touch remain central and that nurses are 'invariably' the most trusted profession. B says recent changes have left traces only in some parts of the world — matches the 'uneven' claim directly. C says the new role has been a 'global success story' — the word 'global' contradicts the 'uneven' framing. D says nursing has brought new political insights into health-care systems worldwide — the passage actually notes nurses are 'often not at the table when health-policy decisions are made', which is the opposite.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is B. The whole second half of the passage hinges on the word 'uneven'; B is the option that respects that word.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's tempting to read the expansion into surgical and technical roles as crowding out the close patient relationships nurses have traditionally had.",
            "why_wrong": "The passage explicitly says the healing powers of nursing 'remain rooted in empathy and a human touch' and that nurses 'invariably come top' in trust surveys. Step 5 catches A: it inverts the passage's actual claim.",
        },
        {
            "letter": "C",
            "why_tempting": "The passage's headline argument is positive — nursing has grown into a more capable profession — and 'global success story' captures that mood.",
            "why_wrong": "The word 'global' is the trap. The passage names India, Germany and Portugal as exceptions and uses the word 'uneven' explicitly. Step 2 anchors you: the success is real but not global.",
        },
        {
            "letter": "D",
            "why_tempting": "Many stop at phrases like 'health-care workforce' and 'health-policy decisions' and assume the passage is celebrating nurses' political influence.",
            "why_wrong": "The passage says the opposite: nurses are 'often not at the table when health-policy decisions are made'. The political-influence line is a complaint, not a celebration. Step 5 makes this contrast visible.",
        },
    ],
    "technique": "On 'most in accordance with the text' items, prefer the option that captures a qualified or partial claim — the passage's careful word ('uneven', 'in some countries', 'often') usually beats the option that overgeneralises ('global', 'worldwide', 'always'). The trigger: an option with a universal quantifier in a passage that names exceptions is almost always wrong.",
    "pitfall": "When a passage celebrates progress and then adds 'but it has been uneven', the correct option lives in the BUT, not in the celebration. The exception clause is where the question gets settled.",
}


# Save first batch of 5
save(entries)


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-036 — Florence Nightingale (job opportunities for nurses)
# "What is implied concerning job opportunities for nurses?"
# Answer: A — There will be plenty of positions available in most parts of the world.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-036"] = {
    "_meta": META,
    "solution_path": "The passage says nursing 'has lost its lustre, so most posts are hard to fill' and that 'In many countries, no profession has a higher number of vacancies' and that the world will be short of 7.6 million nurses by 2030. The implication for job opportunities is straightforward: open positions everywhere — exactly what A says.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What is implied concerning JOB OPPORTUNITIES for nurses?' — focus on the parts of the passage that discuss vacancies, shortages, and recruitment. Look for what these facts mean for someone considering nursing as a career.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the shortage facts",
            "text": "Three numbers tell the story: 'most posts are hard to fill', 'In many countries, no profession has a higher number of vacancies', and 'By 2030, the world will be short of 7.6m nurses, which is a third of their number today.' That is a labour-market gap measured in millions.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "There are not enough nurses now, and there will be even fewer relative to demand by 2030. Hospitals are desperate to recruit. For someone considering the field, that means lots of open jobs — wide geographic spread, almost no competition for positions. Plenty of opportunity.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Lost its lustre' = lost its appeal or attractiveness. 'Vacancies' = unfilled positions. 'Short of 7.6m nurses' = will need 7.6 million more than will be available. 'Hard to fill' = employers cannot find enough applicants. All of these mean the same thing from the worker's side: jobs are easy to get.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says there will be plenty of positions available in most parts of the world — matches the shortage data directly. B says old-style nursing will be carried out by robots — the passage actually says nursing 'may be the only aspect of the health-care profession in which machines will not replace human beings', the opposite of B. C says the prospects look rather dim — the prospects for the PROFESSION's image may look dim, but the prospects for someone seeking a job are bright; C confuses the two. D says today's lack of nurses is predicted to change — the passage predicts the shortage will get WORSE (a third more shortage by 2030), not improve.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is A. A global shortage of millions of nurses means abundant openings; A is the only option that respects that fact.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": "Many stop at the technology paragraph ('diagnostic systems and surgical robots advance') and infer that robots are coming for nurses' jobs too.",
            "why_wrong": "The very next clause says nursing 'may be the only aspect of the health-care profession in which machines will not replace human beings'. Step 2 anchors the contrast: technology will help, not replace.",
        },
        {
            "letter": "C",
            "why_tempting": "It's easy to read 'nursing has lost its lustre' as 'nursing has a dim future' and apply that to job prospects.",
            "why_wrong": "'Lost its lustre' describes the PROFESSION's image (why few new people are joining), not the JOB MARKET. Step 3 makes the inversion visible: a profession with a poor image but high demand is a buyer's market for any worker who DOES join.",
        },
        {
            "letter": "D",
            "why_tempting": "First instinct is to read all the recruitment-campaign paragraphs as a sign the shortage is being solved.",
            "why_wrong": "The passage describes campaigns as efforts that 'will accelerate' but explicitly predicts the gap will GROW: 7.6m short by 2030, a third of today's total. Step 5 catches D: a worsening shortage is the opposite of a change for the better.",
        },
    ],
    "technique": "On 'job opportunities' items, separate the PROFESSION's reputation from the WORKER's job-market situation. A profession with a dim public image but high demand creates abundant opportunities. The trigger to memorise: when a passage names a shortage in millions, the implication for an individual job seeker is always 'plenty of openings'.",
    "pitfall": "Words like 'lost its lustre' and 'hard to fill' describe the same situation from two angles — bad for the field's image, great for anyone hunting a job. Distractors exploit the negative angle; the correct answer respects the worker's perspective.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-037 — Florence Nightingale (future of nursing and technology)
# "What is said about the future of nursing and technology?"
# Answer: C — Nursing will in various ways benefit from modern developments.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-037"] = {
    "_meta": META,
    "solution_path": "The closing paragraphs say technology will be 'roped in to make their work more manageable and reduce burnout', that nursing is the one health profession machines will NOT replace, and that medical science and technology have shaped nursing since Nightingale's time. The forecast is technology as helper — exactly what C says.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What is said about the future of nursing and technology?' — find the part of the passage that explicitly forecasts how tech will interact with nursing, and pick the option that matches its tone.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the forecast",
            "text": "Two sentences carry the forecast. 'Technology will be roped in to make their work more manageable and reduce burnout.' And: 'At the same time, as diagnostic systems and surgical robots advance, nursing may be the only aspect of the health-care profession in which machines will not replace human beings.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "Technology is going to help nurses: less burnout, more manageable workloads. And even as robots take over other medical tasks, nurses are safe — the human touch is the core of nursing and machines cannot replace that. So tech is an ally, not a threat.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Roped in' = brought in to help. 'Manageable' = easier to handle. 'Burnout' = exhaustion from chronic overwork. 'Will not replace human beings' = will work alongside, not instead. These words all paint a cooperative picture, not an adversarial one.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says there will be a conflict between human and technological aspects — the passage explicitly says the opposite, technology will reduce burnout, not create tension. B says nursing is bound to change beyond recognition — too strong; the passage says the human, empathic core REMAINS, only the tooling shifts. C says nursing will benefit from modern developments — fits both forecast sentences directly. D says technological innovation will result in inferior care — the passage says care will become MORE manageable and that humans remain central; quality is not predicted to drop.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is C. The forecast paragraph says technology will help nurses — less burnout, more manageable work, no replacement risk. C captures that benefit cleanly.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "First instinct when 'technology' and 'human profession' appear together is to imagine tension — robots vs. nurses is a familiar cultural script.",
            "why_wrong": "The passage explicitly frames tech as an ally: it will 'make their work more manageable' and 'reduce burnout'. Step 2's quotes leave no room for conflict — and even surgical robots are framed as advancing without threatening nursing.",
        },
        {
            "letter": "B",
            "why_tempting": "It's tempting to read 'diagnostic systems and surgical robots advance' as 'nursing will be unrecognisable' — when surgery is automated, the whole profession must transform.",
            "why_wrong": "The closing sentence says the healing powers of nursing 'remain rooted in empathy and a human touch'. Step 4 highlights the verb 'remain' — continuity, not transformation beyond recognition. B overshoots.",
        },
        {
            "letter": "D",
            "why_tempting": "Many stop at the word 'robots' and assume robots in healthcare means worse care — the cultural default for any 'human replaced by machine' story.",
            "why_wrong": "The passage explicitly says machines will NOT replace nurses, and that tech is reducing burnout (a quality-of-care benefit). Step 5 makes the gap visible: D imports a negative outcome the passage rejects.",
        },
    ],
    "technique": "On 'future of X and technology' items, find the verb the passage attaches to technology. 'Roped in', 'help', 'advance', 'support' point to benefit; 'replace', 'threaten', 'displace' point to conflict. The trigger to memorise: when a passage uses the future tense to describe technology AND human roles surviving, the forecast is collaborative.",
    "pitfall": "Cultural priors about AI and robots in medicine push you toward conflict and replacement options. Read the actual verbs the passage uses around technology before letting the topic word decide your answer.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-038 — Bread (first farming communities)
# "What is implied in connection with the first farming communities?"
# Answer: C — The introduction of bread did not generally lead to a more healthy food intake.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-038"] = {
    "_meta": META,
    "solution_path": "The Bread passage says 'the agriculturalist diet was less nutritionally diverse than that of earlier hunter gatherers' — meaning when bread arrived with the first farmers, the diet got less varied, not healthier. That implication maps directly onto C.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What is implied in connection with the first farming communities?' — so look at the part of the passage that describes those communities and pull out an inference about their diet or health, not a direct quote.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the comparison",
            "text": "The key sentence is: 'Although the agriculturalist diet was less nutritionally diverse than that of earlier hunter gatherers, the importance of bread in the development of human society shouldn't be underestimated.' That 'although' is doing the work: bread had social importance even though it made diets less diverse.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "When humans switched from hunting-and-gathering to farming, their diet got NARROWER — fewer kinds of foods, even though bread became a staple. Bread mattered for civilisation (it freed people to do art and literature) but did NOT make people eat better. The introduction of bread was a step backwards nutritionally.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Agriculturalist diet' = the food intake of farmers. 'Nutritionally diverse' = a wide range of nutrients across different foods. 'Hunter gatherers' = pre-farming humans who foraged and hunted. 'Less nutritionally diverse' = fewer different nutrients available. That phrase is a polite way of saying 'less healthy'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says early farmers were healthier than previous societies — the passage says the opposite, hunter gatherers had a more nutritionally diverse diet. B says bread's importance has been exaggerated in research — the passage says bread's importance 'shouldn't be underestimated' (it was crucial for civilisation), so B inverts the claim. C says the introduction of bread did not generally lead to healthier food intake — fits the 'less nutritionally diverse' line exactly. D says bread's role in civilisation is hotly debated — the passage states the role confidently, not as a debate.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is C. The passage's 'although' sentence is the headline: bread was civilisationally important but nutritionally a downgrade — exactly what C captures.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "Cultural priors push you toward 'farming was a leap forward' — the agricultural revolution is usually framed as progress, so early farmers should be healthier than their hunting predecessors.",
            "why_wrong": "The passage explicitly inverts that prior: farmers had LESS nutritionally diverse diets. Step 2's 'although' clause is the whole point of the paragraph. A flips it.",
        },
        {
            "letter": "B",
            "why_tempting": "First instinct when a passage qualifies a claim ('shouldn't be underestimated') is to read it as pushback against an opposing view — implying that some researchers DO underestimate it.",
            "why_wrong": "'Shouldn't be underestimated' is the AUTHOR's defence of bread's importance, not a complaint that researchers have overstated it. The passage argues bread MATTERS, not that it has been over-praised. B inverts the rhetorical move.",
        },
        {
            "letter": "D",
            "why_tempting": "Academic-sounding topics often feel like they should be 'debated' — and 'role in human civilisation' sounds like a contested claim.",
            "why_wrong": "The passage states bread's role with confidence — 'Without bread, civilisation could have taken a very different turn.' That is a strong, settled claim, not a debate. Step 5 catches this: there is no mention of disagreement in the text.",
        },
    ],
    "technique": "On 'what is implied' items with an 'although' or 'while' clause, the implication is almost always in the subordinate part — the concession is what the question is testing. The trigger to memorise: when the passage acknowledges a downside in passing, that downside is usually the inferred answer.",
    "pitfall": "Cultural priors about historical progress (farming = better) override what the text actually says. Read the comparison sentence carefully — sometimes the passage explicitly contradicts the conventional wisdom.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-039 — African Art / Museum of Black Civilizations
# "What are we told here about the Museum of Black Civilizations?"
# Answer: A — One of its chief aims is to promote African consciousness in a wide sense.
# NOTE: parser bundled this under "Bread" context; recovered from hp_databas.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-039"] = {
    "_meta": META,
    "solution_path": "The passage describes the museum as 'a creative laboratory that will help shape the continent's future sense of identity' — that is exactly the wide-sense African consciousness A names.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What are we told here about the Museum of Black Civilizations?' — so look for a direct statement about the museum's purpose or character, not an inference about its surroundings.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the mission statement",
            "text": "The director's quote is the headline: the museum is 'designed to be a creative laboratory that will help shape the continent's future sense of identity, according to museum director Hamady Bocoum.' That is the explicit mission.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "The museum is in Senegal, holds African art and history, and was 50 years and $34 million in the making. Its director says it is not just a display space — it is a workshop for African identity, helping the continent define who it wants to be. That is a broad cultural-consciousness mission, not a narrow archive role.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Repository' = a storage place, especially for valued things. 'Creative laboratory' = a workshop for new ideas. 'Sense of identity' = a shared understanding of who a group is. 'Restitution' = giving back something that was taken. 'In a wide sense' = broadly, across many dimensions. African consciousness 'in a wide sense' is a clean fit for 'shape the continent's future sense of identity'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says one of its chief aims is to promote African consciousness in a wide sense — matches the director's quote about shaping the continent's identity. B says the majority of its exhibits derive from European museums — the passage says the opposite, many galleries are NOT YET FILLED and Senegal is demanding restitution; nothing is said about most exhibits being European-sourced. C says its main purpose is to remind people of Africa's colonial past — the colonial past is mentioned as motivation for restitution, but the museum's stated mission is future-facing identity, not memorial. D says some of its space is reserved for European artworks — the passage says France LENT pieces for the opening, not that any space is permanently reserved for European art.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is A. The director's own description — 'creative laboratory… continent's future sense of identity' — is a textbook statement of broad African consciousness.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": "It's easy to read 'most prominent homes for African art were within museums in Europe' as 'and now those European collections are at this museum'.",
            "why_wrong": "The passage actually says the opposite — Senegal is DEMANDING restitution of artworks stolen during colonial times, and France has only LENT pieces for the opening. Many galleries 'are not yet filled'. Step 5 makes the gap visible: B would require a majority of exhibits to be European-sourced, but the text says the opposite.",
        },
        {
            "letter": "C",
            "why_tempting": "Many stop at the words 'restitution' and 'colonial times' and assume the museum's main purpose is to memorialise the colonial period.",
            "why_wrong": "Restitution is mentioned as one current activity, not the museum's central purpose. Step 2 anchors the mission in the director's quote — the museum is forward-looking ('future sense of identity'), not backward-looking. C confuses one activity with the overall mission.",
        },
        {
            "letter": "D",
            "why_tempting": "First instinct is to read 'France lent pieces for the opening' as 'there is a French wing here', so a permanent European section feels natural.",
            "why_wrong": "Lent ≠ permanently reserved. The passage describes France's loan as a response to restitution demands, not as a long-term partnership. Step 4 catches the gap: 'reserved for' is a much stronger claim than the passage supports.",
        },
    ],
    "technique": "On 'what are we told' items, prefer the option that matches the subject's own stated mission (here: the director's quote). Press releases and mission statements are stronger evidence than the surrounding context. The trigger to memorise: when a named person describes the subject in their own words, that quote usually decides the question.",
    "pitfall": "Restitution and colonial-past mentions pull readers toward backward-looking options. The museum's mission can use the past as material while pointing forward — read whether the stated PURPOSE is past or future before picking.",
}


# ════════════════════════════════════════════════════════════════════
# verb1 ELF-040 — John Falstaff
# "What word best describes the character of John Falstaff as depicted by Shakespeare?"
# Answer: A — Immoral
# NOTE: parser bundled this under "Bread" context; recovered from hp_databas.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb1-ELF-040"] = {
    "_meta": META,
    "solution_path": "The passage describes Falstaff as 'a fat, vain, cowardly knight who is contemptuous of honourable virtues' and as someone who introduces Prince Hal to 'a hedonistic lifestyle'. Vanity, cowardice, contempt for virtue, hedonism — that is the dictionary picture of immoral, which is what A says.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt is 'What word best describes the character of John Falstaff as depicted by Shakespeare?' — so you are picking the one-word label that fits the passage's description, not your prior knowledge of Falstaff.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the character description",
            "text": "Two sentences carry the full picture. 'A fat, vain, cowardly knight who is contemptuous of honourable virtues.' And: 'Falstaff introduces Hal to a hedonistic lifestyle amongst the commoners of Eastcheap, London.' Plus the framing label: he is the 'father ruffian' figure.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "Falstaff is fat, full of himself, scared of fights, and openly disdains good behaviour. He pulls the prince into a partying lifestyle in shady neighbourhoods. He is a fun rogue, but morally he is the opposite of a virtuous knight. The summary word for that profile is 'immoral'.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Vain' = excessively proud of oneself. 'Cowardly' = afraid in situations that demand courage. 'Contemptuous of honourable virtues' = openly looking down on virtues like honesty, courage, loyalty. 'Hedonistic' = devoted to pleasure-seeking. 'Ruffian' = a violent or disreputable person. 'Immoral' = lacking moral principles. Each phrase in the passage maps to a piece of 'immoral'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says immoral — fits the 'contemptuous of honourable virtues' and 'hedonistic' descriptions directly. B says sympathetic — Falstaff is a popular comic character, but the passage describes him in negative terms (cowardly, contemptuous of virtue); the question asks what Shakespeare DEPICTS, not how audiences feel. C says disloyal — the passage does not actually name disloyalty; Falstaff is a companion to Hal, and the passage describes vices but not betrayal. D says generous — the passage gives no example of generosity; everything described is self-serving (hedonism, vanity).",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is A. Every adjective the passage uses for Falstaff lines up with 'immoral'; none of the other options match the actual description.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": "Cultural priors about Falstaff position him as a beloved comic character — audiences have always liked him, so 'sympathetic' feels natural.",
            "why_wrong": "The question asks how Shakespeare DEPICTS him, and the passage's depiction is unambiguously negative — cowardly, vain, contemptuous of virtue. Step 1 anchors you in the source: the depiction in the text, not the audience's affection for the character.",
        },
        {
            "letter": "C",
            "why_tempting": "It's tempting to read 'introduces Hal to a hedonistic lifestyle' as a corrupting influence and slide from there to disloyalty against the prince.",
            "why_wrong": "The passage describes Falstaff as a 'father ruffian' to Hal — a kind of mentor, not a traitor. He is morally bad, but he is not depicted as DISloyal to Hal in the passage. Step 5 catches the gap: disloyalty would require a betrayal that the text never names.",
        },
        {
            "letter": "D",
            "why_tempting": "Hedonism and tavern life carry a folk image of free-spending, jovial generosity — buying rounds, sharing food.",
            "why_wrong": "The passage gives zero textual evidence of generosity. Every adjective is about self-indulgence (vain, hedonistic) or self-protection (cowardly). Step 3 makes the point: Falstaff's described profile is self-serving, not generous.",
        },
    ],
    "technique": "On 'one word best describes X' items, tally the adjectives the passage actually uses for X and pick the option that is the closest synonym for that cluster. The trigger to memorise: when the passage stacks negative adjectives, the answer is the negative summary word — even if cultural priors about the character are warmer.",
    "pitfall": "Famous characters bring cultural baggage. The question is always asking about THIS text's depiction. Force yourself to list the actual words the passage uses before picking the option that matches your memory of the character.",
}


# Save second batch (total 10)
save(entries)


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-031 — Moral Rules cloze (gap 31)
# Passage context: 'Is it just a bug in our ethical _____ ?'
# Options: A confusion, B wrongdoing, C condition, D processing
# Answer: D — processing
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-031"] = {
    "_meta": META,
    "solution_path": "The gap sits inside a computing metaphor — 'a bug in our ethical _____' — and the only option that completes the metaphor cleanly is 'processing'. A bug appears in software processing, not in confusion, wrongdoing, or condition.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": "This is a vocabulary cloze: the gap is a noun, and you have to pick the word that fits the surrounding metaphor and meaning. Identify what KIND of word goes here — and the surrounding phrase 'a bug in our' tells you the writer is using a computer-software metaphor.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": "The full sentence: 'Most people strictly adhere to moral rules — such as \"thou shalt not kill\" — even when breaking them leads to a better outcome, such as sacrificing one person to save five. Is it just a bug in our ethical 31?' The gap completes a metaphor where moral reasoning is treated like a computational process.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the metaphor",
            "text": "The trigger word is 'bug'. In everyday English, 'bug in X' means 'an error inside X', and X is almost always a software system or a mental process treated like one. So the missing word names the SYSTEM that the bug lives in — the ethical processing or ethical software of the mind.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Confusion' = a state of being mixed up; bugs don't live IN confusion. 'Wrongdoing' = bad behaviour; you can't have a bug in wrongdoing. 'Condition' = a state of being; 'a bug in our ethical condition' is grammatical but weak — it would mean 'a flaw in our ethical state', which is just a paraphrase of the question itself, not an answer to it. 'Processing' = the mental operation of working something out; 'a bug in our ethical processing' completes the software metaphor cleanly.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": "Slot each option into the sentence and feel the fit. 'A bug in our ethical confusion' — awkward, no real meaning. 'A bug in our ethical wrongdoing' — incoherent. 'A bug in our ethical condition' — vague, philosophical, but does not connect to the bug metaphor. 'A bug in our ethical processing' — clean, idiomatic, names a mental operation that could plausibly contain an error.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is D, processing. The 'bug in our ethical X' phrase is a computing metaphor and 'processing' is the only option that lives inside that metaphor.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's easy to read the moral dilemma as a moment of mental confusion (thou-shalt-not-kill vs. save-five) and reach for 'confusion' as the noun the bug sits in.",
            "why_wrong": "'A bug in our confusion' is not idiomatic — bugs live inside operating processes, not inside emotional states. Step 4 separates the two: confusion is a feeling, processing is a mechanism, and only mechanisms have bugs.",
        },
        {
            "letter": "B",
            "why_tempting": "The whole paragraph is about moral rules and breaking them, so a word like 'wrongdoing' feels topically related to the discussion.",
            "why_wrong": "Topic-overlap is not collocation. 'A bug in our wrongdoing' is grammatically odd — wrongdoing is the bad act itself, not a process containing errors. Step 3 makes the metaphor clear: the bug is INSIDE the moral reasoning system, not inside its outputs.",
        },
        {
            "letter": "C",
            "why_tempting": "Many stop at the philosophical register of the sentence and pick 'condition' as a serious-sounding noun that fits abstract talk.",
            "why_wrong": "'Ethical condition' is acceptable as a phrase but the surrounding metaphor needs a PROCESS, not a STATE. Step 5 catches the difference: 'bug in our ethical condition' does not click with 'bug', while 'bug in our ethical processing' clicks immediately.",
        },
    ],
    "technique": "On cloze items, identify the surrounding metaphor BEFORE you look at the options — once you see 'bug in our X', the lexical field narrows to software/process words. The trigger to memorise: idiom-anchored gaps are decided by collocation strength, not by topic relatedness.",
    "pitfall": "Topically relevant nouns (confusion, wrongdoing) feel safe in a moral-philosophy paragraph but break the metaphor. Always test the option against the IMMEDIATE neighbour word ('bug'), not against the paragraph theme.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-032 — Moral Rules cloze (gap 32)
# 'A recent paper measures people's _____ behavior toward those who make such utilitarian decisions.'
# Options: A past, B actual, C immoral, D current
# Answer: B — actual
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-032"] = {
    "_meta": META,
    "solution_path": "The gap sits before 'behavior' in a sentence contrasting what people CLAIM about morality with what they actually DO. The author wants a word that signals 'real, observable conduct rather than reported attitudes' — and 'actual' is the only option that hits that meaning.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": "This is an adjective slot before 'behavior'. The right word will narrow 'behavior' down to a specific kind — observed real-world behavior versus reported, hypothetical, or past behavior. Look at the surrounding contrast to figure out which narrowing fits.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": "The previous sentence says people CLAIM it is moral to throw a dying man overboard, but they VIEW such a person as lacking empathy — there is a gap between stated belief and judgment. Then: 'A recent paper measures people's 32 behavior toward those who make such utilitarian decisions.' The next sentence describes experiments where people INTERACT with respondents and entrust them with money in a game.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": "The contrast in the paragraph is CLAIMS vs. ACTIONS. The 2013 study measured what people SAID. The new paper measures what people actually DO — they really treat the utilitarian decision-makers differently in a game, with real money. So the missing word marks the move from saying to doing.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Past behavior' = what someone did before; the experiment is observing behavior in real time, not historical conduct. 'Actual behavior' = real, observable behavior as opposed to stated intentions — exactly the claims-vs-actions distinction. 'Immoral behavior' = morally wrong behavior; but the experiment is measuring HOW people treat utilitarians, which is not framed as immoral. 'Current behavior' = behavior right now; weak fit because the contrast in the paragraph is not present-vs-past but stated-vs-real.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": "'Measures people's past behavior toward those who make such utilitarian decisions' — awkward, because the experiment is creating the interaction, not measuring history. 'Measures people's actual behavior' — clean fit; signals real, observed conduct vs. stated attitudes. 'Measures people's immoral behavior' — wrong frame; the experiment isn't classifying behavior as immoral. 'Measures people's current behavior' — weakly OK but lacks the stated-vs-real edge the paragraph is making.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is B, actual. The whole paragraph hinges on the gap between what people say about morality and what they really do; 'actual behavior' names that real conduct.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's easy to read 'measures' as 'looks at history' and assume past behavior is being studied.",
            "why_wrong": "The next sentence describes live experiments where 'psychologists asked American adults to respond' and play games. That is current, observed conduct. Step 5 catches A: nothing in the design is historical.",
        },
        {
            "letter": "C",
            "why_tempting": "The paragraph is about moral judgements, and 'immoral' is the topical adjective hanging in the air.",
            "why_wrong": "The paper measures HOW people treat utilitarians — judging them, entrusting them with less money. That is the act of judging, not itself an immoral act. Step 4 separates the two: 'immoral behavior' would label the subjects' conduct, but the paper is studying their REACTIONS to others' choices.",
        },
        {
            "letter": "D",
            "why_tempting": "Many stop at 'A recent paper measures' and reach for 'current' to match the recency.",
            "why_wrong": "'Current' is grammatically fine but vague — it doesn't capture the paragraph's stated-vs-real contrast. Step 3 anchors the distinction: 'actual' is the word that contrasts with the 2013 study's CLAIMS; 'current' just contrasts with 'old'.",
        },
    ],
    "technique": "On cloze items where a paragraph contrasts what people SAY with what they DO, the answer almost always names the doing side — 'actual', 'real', 'observed'. The trigger to memorise: when the previous sentence describes a stated belief and the next sentence describes an experiment, the gap between is filled by 'actual' or its synonyms.",
    "pitfall": "Topical adjectives ('immoral' in a morality piece, 'current' in a 'recent paper' sentence) are recurring distractor traps. Always test against the paragraph's CONTRAST structure, not against the topic word cloud.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-033 — Moral Rules cloze (gap 33)
# 'When those respondents said they would push a man off a footbridge..., 33 rated them as less moral'
# Options: A applicants, B experimenters, C interviewers, D participants
# Answer: D — participants
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-033"] = {
    "_meta": META,
    "solution_path": "The earlier sentence describes the psychologists asking 'American adults to respond to moral dilemmas and then interact with other supposed respondents online'. The people doing the rating are these American adults — the study's participants. That is the only role-name that fits the experimental setup.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": "This is a noun slot for a role in an experiment. Someone is rating the utilitarian respondents as less moral and entrusting them with less money. You need the option that names the experimental role of those raters.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": "Two sentences earlier: 'psychologists Jim Everett, Molly Crockett and David Pizarro asked American adults to respond to moral dilemmas and then interact with other supposed respondents online.' Then: 'When those respondents said they would push a man off a footbridge to block a trolley from killing five rail workers, 33 rated them as less moral and trustworthy, and they entrusted them with less money in an investment game.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the role",
            "text": "The setup names three groups: the psychologists (researchers), the 'supposed respondents' (decoys giving the utilitarian answers), and 'American adults' (the real subjects who rate the respondents). The American adults are the ones doing the rating in the gap sentence. In experimental psychology, the standard label for the people whose responses are being measured is PARTICIPANTS.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Applicants' = people applying for something (a job, a grant); wrong register for an experiment. 'Experimenters' = the people running the experiment (here: the three named psychologists). 'Interviewers' = people conducting interviews; the study uses an online interaction, not interviews. 'Participants' = the people whose behaviour is being studied; the standard psychology term for the subject pool.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": "'Applicants rated them as less moral' — wrong frame; nobody is applying for anything. 'Experimenters rated them as less moral' — would mean the psychologists themselves are the raters, but the design is built around CIVILIANS rating the respondents, not researchers. 'Interviewers rated them as less moral' — there are no interviews in this setup. 'Participants rated them as less moral' — clean fit; the American adults brought in to interact and rate are the participants.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is D, participants. The American adults recruited into the experiment are the participants, and they are the ones doing the rating in the gap sentence.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "Words like 'applicants' carry a vague sense of 'people being judged' — and the sentence is about judgement.",
            "why_wrong": "The judgement here flows FROM the raters TO the respondents, not toward applicants. Step 3 anchors the design: nobody is applying for anything. 'Applicants' is the wrong experimental role.",
        },
        {
            "letter": "B",
            "why_tempting": "First instinct is to read the sentence as 'the researchers tested moral judgements' and slot 'experimenters' as the subject.",
            "why_wrong": "The researchers run the design; they don't personally rate every respondent. The whole point of the study is to see what ordinary people do. Step 5 catches B: it collapses the researcher/subject distinction the paragraph builds.",
        },
        {
            "letter": "C",
            "why_tempting": "An online interaction sounds like a structured exchange, and 'interviewers' fits that register.",
            "why_wrong": "The setup is an interaction-and-rating task with an investment game — not an interview. Step 4 separates the words: interviewers conduct interviews, participants act in experiments, and only the latter matches this design.",
        },
    ],
    "technique": "On cloze items naming experimental roles, lock in the design first (who is studied, who runs the study, who the decoys are) before scanning the options. The trigger to memorise: in psychology experiments, the subjects are 'participants', the runners are 'experimenters', and the actors-in-between are 'confederates' — pick the one that matches the role description in the paragraph.",
    "pitfall": "Words like 'interviewers' and 'applicants' sound professional and study-related but come from the wrong genre (HR, hiring, journalism). Always match the role-word to the specific experimental design the passage describes.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-034 — Moral Rules cloze (gap 34)
# '...we want our friends to at least flinch before personally 34 others.'
# Options: A encountering, B judging, C harming, D disregarding
# Answer: C — harming
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-034"] = {
    "_meta": META,
    "solution_path": "The gap sits at the end of a sentence about pushing a man off a footbridge to save five rail workers. 'Flinch before personally _____ others' is referring to the act of doing violence to a person. 'Harming' is the only option that names that act.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": "This is a gerund slot ('before personally _____ others') describing an action. The surrounding paragraph is about the trolley dilemma — pushing a man to his death. The right word names the action a friend might 'flinch before personally' doing.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": "Full sentence: 'Coolheaded calculation has its benefits, but we want our friends to at least flinch before personally 34 others.' Just before: the trolley dilemma — pushing someone off a footbridge to save five. Just after: 'people in the study who had argued for pushing the man were trusted more when they claimed that the decision was difficult.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the action",
            "text": "The act in question is PUSHING A MAN OFF A FOOTBRIDGE — that is, hurting or killing him. We want our friends to flinch before doing THIS. So the gap names the category of action that pushing-to-death belongs to: causing physical damage to another person.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Encountering' = meeting or coming across; flinching before meeting people makes no sense. 'Judging' = forming an opinion about; we don't usually flinch at judging people, and the surrounding context is about action, not assessment. 'Harming' = causing injury or damage; flinching before harming someone is the canonical moral instinct the paragraph is naming. 'Disregarding' = ignoring; flinching at ignoring others is too mild for the trolley-dilemma context.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": "'Flinch before personally encountering others' — wrong action, encountering is neutral. 'Flinch before personally judging others' — possible in everyday morality, but the paragraph is specifically about pushing-to-death, not about judging. 'Flinch before personally harming others' — exact fit; pushing is harming, and flinching is the moral instinct the paragraph wants. 'Flinch before personally disregarding others' — too weak; disregarding is ignoring, not the killing act in the dilemma.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is C, harming. The trolley dilemma is about physically hurting one person to save many; flinching before harming is the moral instinct that makes us trust someone who finds the decision difficult.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "'Encountering others' is a smooth phrase that reads naturally on first pass.",
            "why_wrong": "The context is the trolley dilemma — a moment of doing violence. Encountering is neutral and has no flinch-worthy weight. Step 3 anchors the action category: we are looking for an act of physical harm, not a meeting.",
        },
        {
            "letter": "B",
            "why_tempting": "Many stop at 'rated them as less moral' from earlier sentences and reach for 'judging' as the relevant action word.",
            "why_wrong": "Judging fits the EVALUATION side of the paragraph, not the DOING side. The gap is about what friends DO to others, not about how they assess others. Step 4 separates the two: harming is action, judging is assessment.",
        },
        {
            "letter": "D",
            "why_tempting": "Disregarding others sounds cold and morally cool — and the paragraph criticises 'coolheaded calculation'.",
            "why_wrong": "Disregarding is too weak for the trolley dilemma — the dilemma is about killing, not ignoring. Step 5 catches the gap: a friend flinching before disregarding someone is a much milder scene than the paragraph is invoking.",
        },
    ],
    "technique": "On cloze items, anchor the gap in the SPECIFIC scenario the surrounding paragraph builds — here, pushing a man off a footbridge. The verb that fits that scenario is the right answer. The trigger to memorise: when the paragraph spells out an action ('push to his death'), the gap should name the same action in general terms ('harming').",
    "pitfall": "Cool-sounding abstract verbs (judging, disregarding) lure readers when the paragraph mentions moral evaluation. But the gap might still need a concrete physical verb — re-read the trigger scenario before picking.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-035 — Moral Rules cloze (gap 35)
# '...you want your leader to genuinely have - or at least be good at displaying - the right kind of 35 when they're talking about that decision'
# Options: A emotions, B enthusiasm, C issues, D opinion
# Answer: A — emotions
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-035"] = {
    "_meta": META,
    "solution_path": "The paragraph builds toward Pizarro's point that we trust leaders who at least SHOW empathy or moral discomfort when making hard trade-offs. The right kind of 'X' to display when talking about a painful decision is emotions — and the closing line about 'didn't arrive at it callously' confirms the emotional register.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": "This is a noun slot inside a Pizarro quote about leadership: 'the right kind of _____ when they're talking about that decision'. The right word names what we want leaders to display — and the immediately following clause is the key: 'to show that they didn't arrive at it callously.'",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": "Pizarro's full sentence: 'you want your leader to genuinely have — or at least be good at displaying — the right kind of 35 when they're talking about that decision, to show that they didn't arrive at it callously.' And the earlier setup: 'we want our friends to at least flinch before personally harming others.' The whole paragraph is about visible moral feeling.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": "'Callously' = without feeling, coldly. The right word is the OPPOSITE of callous — what someone DOES show when they DIDN'T arrive at a decision coldly. That is emotion: visible feeling, the flinch, the empathy, the moral discomfort. The earlier 'flinch' line is the same instinct in friend-form.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Emotions' = feelings, especially feelings visible in someone's manner; opposite of callousness. 'Enthusiasm' = eager excitement; wrong tone for talking about war or benefit cuts. 'Issues' = problems or matters of concern; grammatically 'the right kind of issues' is awkward and does not contrast with callous. 'Opinion' = a view or judgement; opinions can be cold or warm but the contrast with 'callously' is about feeling, not view.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": "'The right kind of emotions when they're talking about that decision, to show that they didn't arrive at it callously' — clean opposition: emotion vs. callousness. 'The right kind of enthusiasm' — wrong register; enthusiasm for cutting benefits or starting a war is exactly what we DON'T want. 'The right kind of issues' — does not name what the leader displays. 'The right kind of opinion' — close but misses the feeling-vs-coldness axis; opinions don't directly counter callousness.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is A, emotions. The whole paragraph is about showing visible feeling so people know you didn't decide callously; 'emotions' is the direct antonym of 'callously' and the only option that fits.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": "Leaders are often praised for being passionate, and 'enthusiasm' is a positive trait that pairs naturally with leadership talk.",
            "why_wrong": "The context is hard trade-offs — wars, employee benefit cuts. Enthusiasm in that context is exactly what we fear. Step 4 catches the register: we want regret and weight, not eagerness. Enthusiasm and callousness are not opposites.",
        },
        {
            "letter": "C",
            "why_tempting": "'The right kind of issues' has the cadence of business-speak, and the paragraph mentions decisions and trade-offs.",
            "why_wrong": "Issues are problems the leader is FACING, not something they DISPLAY. Step 5 catches the grammar: the right word names something a leader shows, and issues are not displayable in the way emotions are.",
        },
        {
            "letter": "D",
            "why_tempting": "Leaders express opinions all the time, and 'the right kind of opinion' is a smooth phrase.",
            "why_wrong": "The contrast in the sentence is callous vs. not-callous — about FEELING, not about VIEW. Opinions don't oppose callousness. Step 3 anchors the axis: the right word is the antonym of 'callous', which is 'emotional', not 'opinionated'.",
        },
    ],
    "technique": "On cloze items with an explicit contrast word ('callously', 'genuinely', 'sincerely'), pick the option that is the direct antonym. The trigger to memorise: when a sentence ends with 'to show they DIDN'T do X coldly', the missing earlier word is the warm-side opposite of cold.",
    "pitfall": "Leadership vocabulary (enthusiasm, opinion, issues) sounds at home in the sentence but misses the feeling-vs-coldness axis the writer is actually drawing. Always anchor the gap to the SPECIFIC antonym signal in the surrounding clause.",
}


# Save third batch (total 15)
save(entries)


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-036 — Public Mourning (first two paragraphs, clothing manufacturers)
# "What is said about clothing manufacturers in the first two paragraphs?"
# Answer: B — For many manufacturers, public mourning was economically disastrous.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-036"] = {
    "_meta": META,
    "solution_path": "The second paragraph names the textile industry as something that 'often faced ruin when stocks of luxury and coloured fabrics became instantly unsellable' — and George II's halving of mourning periods was motivated specifically to assist that industry. That is exactly the economic disaster B describes.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks what is said about clothing MANUFACTURERS in the FIRST TWO PARAGRAPHS — so confine your search to those paragraphs and look for direct claims about how manufacturers fared during mourning.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the textile-industry sentence",
            "text": "The key sentence is in paragraph two: George II 'received only six months, thanks to a change he himself had implemented in 1728. This halved all future mourning periods and was motivated in large part by a need to assist the textile industry, which often faced ruin when stocks of luxury and coloured fabrics became instantly unsellable.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "When the king died, everyone wore black for months. That meant any clothing maker holding stock of coloured or fancy fabric suddenly had inventory nobody could buy. It was bad enough that George II shortened the mourning rules to keep the industry from collapsing. So for clothing manufacturers, a royal death was an economic shock — exactly B's 'economically disastrous'.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Faced ruin' = was on the brink of going out of business. 'Instantly unsellable' = could not be sold at all once the mourning order came. 'Assist the textile industry' = help the textile makers stay solvent. 'Disastrous' = catastrophically bad. The passage's 'faced ruin' is a direct synonym for B's 'economically disastrous'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says coloured fabrics were difficult to come by during mourning — the passage says manufacturers HAD stocks of coloured fabric that became unsellable, the opposite of scarce. B says public mourning was economically disastrous for many manufacturers — fits 'faced ruin' directly. C says once mourning ended, expensive stocks were hard to sell — the passage says the problem was DURING mourning, not after; once mourning ended, the problem would reverse. D says public mourning was generally highly profitable — direct contradiction; the passage says it brought ruin.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is B. 'Faced ruin' and 'unsellable stocks' explicitly map to 'economically disastrous'; the king himself stepped in to halve mourning to save the industry.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's easy to associate mourning with mostly-black wardrobes and assume colourful fabric became hard to find.",
            "why_wrong": "The passage says the problem was the opposite — manufacturers HAD coloured fabric they couldn't sell. Step 3 makes the inversion visible: stock surplus, not stock shortage.",
        },
        {
            "letter": "C",
            "why_tempting": "Many stop at 'stocks of luxury and coloured fabrics' and assume the unsellability problem applies after mourning ends as well.",
            "why_wrong": "The passage frames the unsellability DURING mourning, not after. Once mourning ended, the colour ban lifted and the inventory could move. Step 2 anchors the timing: the harm is during, not after.",
        },
        {
            "letter": "D",
            "why_tempting": "Later in the passage, the writer notes manufacturers of Norwich crape DID profit; if you read ahead, D feels supported.",
            "why_wrong": "The question scopes to the FIRST TWO paragraphs, where the only claim is about ruin, not profit. The Norwich crape benefit appears much later. Step 1 keeps the scope tight: D pulls from material outside the question's range.",
        },
    ],
    "technique": "On 'in the first two paragraphs' items, confine your search strictly to those paragraphs and pick the option supported THERE. The trigger to memorise: a passage may make conflicting claims in different sections — paragraph-scoped questions test whether you obey the scope.",
    "pitfall": "Later paragraphs introduce nuance (some manufacturers profited) that contradicts the first-paragraph framing (most faced ruin). Always anchor in the paragraph range the question names, even if you remember a different claim from elsewhere.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-037 — Public Mourning (people in more distant regions)
# "What is implied about public mourning in relation to people in more distant regions of the British Isles?"
# Answer: D — They generally got late notification about what clothes were required.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-037"] = {
    "_meta": META,
    "solution_path": "The passage says 'Sufficient time was not allowed for the information to reach more provincial regions… and as a result mourning frequently began late in these areas.' Mourning orders simply didn't reach distant regions in time — exactly D's late notification.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks what is IMPLIED about people in MORE DISTANT regions of the British Isles. Find the sentence that names provincial or distant areas and pick the inference it supports.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the provincial-regions sentence",
            "text": "The key passage: 'To ensure synchronised mourning (in southern England at least) and to clarify for the public what clothing was acceptable, mourning orders were issued and placed in newspapers, with mourning delayed until a week or so after the death to allow people to update their wardrobes. Sufficient time was not allowed for the information to reach more provincial regions though, let alone Ireland or the north of Scotland, and as a result mourning frequently began late in these areas.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "Mourning orders were printed in newspapers in southern England and gave about a week for people to update their wardrobes. But the news travelled slowly to distant regions — Ireland, the north of Scotland — so by the time people there learned what to wear and went shopping for it, the official mourning had already begun. They got the message late.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Synchronised' = happening at the same time. 'Provincial regions' = areas outside the main centre, here outside southern England. 'Mourning orders' = official rules about what to wear and for how long. 'Notification' = being officially told. The passage's 'information' arriving late maps onto D's 'late notification' directly.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says they were more free to choose what clothes to wear — the passage does say enforcement was weaker outside the royal court (later paragraph about Dublin and Devonshire), but the FIRST mention of distant regions is about notification timing, not freedom of choice. B says they were less interested in participating — the passage says nothing about interest level; it says the information arrived late. C says they found appropriate clothes harder to find — the passage doesn't say availability was different in the provinces, only that the notification was late. D says they got late notification about what clothes were required — direct match to 'sufficient time was not allowed for the information to reach' them.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is D. The passage names timing of notification as THE issue for distant regions; D restates that exactly.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "Later in the passage, Dublin is described as ignoring mourning once the Lord Lieutenant left — that DOES suggest distant regions had more freedom.",
            "why_wrong": "That paragraph is about how some elites EVADED mourning rules — a different mechanism. The question is asking about the implication of the SPECIFIC sentence on distant regions and information arrival. Step 1 keeps you in the right paragraph: notification timing, not enforcement laxity.",
        },
        {
            "letter": "B",
            "why_tempting": "If notification was slow, you might infer people simply cared less — distance equals indifference.",
            "why_wrong": "The passage says nothing about interest level. Late notification is a logistical fact, not a measure of enthusiasm. Step 3 separates the two: people might have been keen but uninformed.",
        },
        {
            "letter": "C",
            "why_tempting": "It's tempting to add 'and then they couldn't find the right clothes either' to the late-notification story — the inconvenience compounds.",
            "why_wrong": "The passage does not claim distant regions had a harder time finding appropriate clothing; the problem was being TOLD about the rules, not sourcing the fabric. Step 4 catches the import: C adds material the text doesn't include.",
        },
    ],
    "technique": "On 'what is implied about people in distant regions' items, locate the sentence that NAMES those regions and pick the option whose claim sits inside that sentence. The trigger to memorise: passages about communication infrastructure (newspapers, mail, ships) often test whether students notice the LOGISTICAL inference rather than reaching for a behavioural one.",
    "pitfall": "Later paragraphs may add unrelated material about the same group (Dublin elites bypassing mourning). The question is anchored to the IMPLICATION of the specific named sentence — don't import claims from elsewhere.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-038 — Public Mourning (changes during first half of 18th century)
# "How did public mourning change during the first half of the 18th century?"
# Answer: C — Public mourning started to involve an increasing number of dimensions.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-038"] = {
    "_meta": META,
    "solution_path": "The passage says that by George I's death, mourning orders 'had become far more elaborate and the use of phases was emerging, which varied in length and had their own specific sartorial requirements', and lists additional dimensions — black-hung churches, muffled bells, eulogies, suspended court functions, black sealing wax. Mourning grew into more and more areas of life — exactly C's 'increasing number of dimensions'.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks how public mourning CHANGED during the first half of the 18th century. Find the paragraph that describes the change over time and identify what kind of change it names.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the change-over-time sentences",
            "text": "Two sentences carry the change. 'In the early part of the century, mourning orders were fairly rudimentary: on the death of William III they stipulated only that all persons \"put themselves into the deepest Mourning that may be\".' Then: 'By the time of George I's death, however, mourning had become far more elaborate and the use of phases was emerging, which varied in length and had their own specific sartorial requirements.' Followed by the catalogue: churches in black, bells muffled, eulogies, court suspended, black wax.",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "At the start of the 1700s, mourning rules were simple: wear deep mourning, the end. By a few decades later, the rules had branches — phases with their own clothing requirements, black-hung churches, muffled bells, eulogies, suspended court life, even black sealing wax on letters. Mourning grew from one rule into many practices touching different parts of life. C calls that an 'increasing number of dimensions' — exact match.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Rudimentary' = basic, undeveloped. 'Elaborate' = detailed, with many parts. 'Sartorial' = relating to clothing. 'Phases' = distinct stages with their own rules. 'Dimensions' = aspects or areas. The trajectory from rudimentary to elaborate, with multiple new aspects (churches, bells, eulogies, wax), is dimensions multiplying.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says the prescribed mourning period got longer with each monarch — the passage actually says George II halved it; the trend on LENGTH is downward, not upward. B says the public became more negative about participating — the passage notes 'frequent complaints' but does not say negativity grew specifically during the first half-century; the complaint paragraph is more general. C says public mourning started to involve more dimensions — matches the rudimentary-to-elaborate trajectory and the catalogue of new practices. D says people from all walks of life were increasingly forced to participate — the passage actually says it was 'hard to avoid' but does not claim the FORCING expanded; participation was wide throughout the century.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is C. The change described is qualitative — mourning ramified into more practices and more aspects of life. C captures that exactly.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's easy to read 'mourning had become far more elaborate' as 'longer' — elaborate sounds like more time.",
            "why_wrong": "The passage explicitly halves the duration with George II's 1728 change. Step 4 separates elaboration from length: more dimensions, less time. A inverts the duration trend.",
        },
        {
            "letter": "B",
            "why_tempting": "Frequent complaints about expense and inconvenience are mentioned, and that sounds like growing public negativity.",
            "why_wrong": "The complaint paragraph appears later and is not framed as a growth trend in the first half-century — it is a description of a steady state. Step 5 catches B: there is no 'increasingly negative' arc in the relevant paragraph.",
        },
        {
            "letter": "D",
            "why_tempting": "The passage says mourning was 'hard to avoid completely, even for the poor or disinterested', which sounds like forced participation expanding.",
            "why_wrong": "The 'hard to avoid' line describes the state of mourning's pervasiveness, not a CHANGE in how forcefully it was imposed during the first half-century. Step 3 anchors the question: how did mourning CHANGE — and the answer is in dimensions added, not in coercion expanded.",
        },
    ],
    "technique": "On 'how did X change' items, find the before/after sentences that anchor the trajectory ('In the early part… By the time of…') and pick the option that names the AXIS of change. The trigger to memorise: lists of new practices (churches, bells, eulogies, wax) signal 'dimensions multiplying', not 'duration increasing' or 'coercion intensifying'.",
    "pitfall": "Words like 'elaborate' and 'pervasive' can be misread as 'longer' or 'more enforced'. Always check whether the passage's other evidence (here: George II halving the period) supports your interpretation of the change.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-039 — Public Mourning (entertainment business, George I)
# "What is implied about consequences for the entertainment business in relation to the death of George I?"
# Answer: C — There were essentially no effects.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-039"] = {
    "_meta": META,
    "solution_path": "The passage says 'George I's passing, for instance, had little impact on the theatre industry, as the playhouses were already closed for the summer.' Mourning would normally close theatres, but they were already shut — so the death made essentially no difference. That is C's 'essentially no effects'.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks what is IMPLIED about the entertainment business in relation to the death of GEORGE I specifically. Find the sentence that names George I and the entertainment industry.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the George I theatre line",
            "text": "The relevant sentence: 'Even some of mourning's more irksome aspects might be alleviated by a well-timed death. George I's passing, for instance, had little impact on the theatre industry, as the playhouses were already closed for the summer.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "Royal mourning would normally hurt theatres — public mourning meant closing entertainment venues. But George I died in summer, when the playhouses were already shut for the season. So the mourning order didn't actually take anything away from them — the closures would have happened anyway. The net effect on the theatre business was basically zero.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Irksome' = annoying. 'Alleviated' = lessened. 'Well-timed' = happening at a convenient moment. 'Little impact' = essentially no effect. The passage's 'little impact' is a direct match for C's 'essentially no effects'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says highly positive — the passage frames the death as neutralized, not beneficial; no extra revenue is mentioned. B says largely negative — the passage explicitly says 'little impact', the opposite. C says essentially no effects — direct match for 'little impact'. D says both positive and negative — the passage names only the neutralisation, not mixed outcomes.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is C. The summer-closure coincidence meant the death didn't move the theatre's situation in either direction — effectively zero impact.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "If you read 'alleviated' and 'well-timed death' fast, it can sound like the death was good news for theatres — a holiday boost or similar.",
            "why_wrong": "Alleviation here means relief from a HARM that would otherwise have occurred — not active benefit. Step 3 makes the asymmetry visible: the death avoided a closure that would otherwise have happened, but did not add anything positive.",
        },
        {
            "letter": "B",
            "why_tempting": "First instinct is to assume mourning is bad for entertainment, and so any royal death must hurt theatres.",
            "why_wrong": "The passage explicitly says George I's death had LITTLE IMPACT — because the seasonal closure had already happened. Step 2 anchors the exception: this particular death missed the normal mechanism that would hurt theatres.",
        },
        {
            "letter": "D",
            "why_tempting": "Many stop at the word 'alleviated' and read it as a positive plus the avoided closure as a negative — adding up to mixed effects.",
            "why_wrong": "Both effects are about the SAME mechanism: the closure was avoided because it would have been redundant. There is no separate positive effect alongside a negative one. Step 5 makes the gap visible: the passage gives no second mechanism.",
        },
    ],
    "technique": "On 'effects of X on Y' items where the passage describes a near-zero outcome ('little impact'), pick the option that names that neutrality directly. The trigger to memorise: 'well-timed' and 'alleviated' often signal NEUTRALISATION (avoiding a bad outcome), not BENEFIT (adding a good one).",
    "pitfall": "The verb 'alleviated' sounds positive but only means 'lessened'. Confirm whether the passage names a BENEFIT or just an AVOIDED HARM before reaching for the 'positive effects' option.",
}


# ════════════════════════════════════════════════════════════════════
# verb2 ELF-040 — Public Mourning (recent example, Diana)
# "What is argued with regard to a recent example of general mourning?"
# Answer: B — Such feelings may be more authentic today than in the 1700s.
# ════════════════════════════════════════════════════════════════════
entries["var-2025-verb2-ELF-040"] = {
    "_meta": META,
    "solution_path": "The passage's closing thought is that the spontaneous grief for Princess Diana in 1997 shows public mourning can still happen — but because we now feel we KNOW the royals through media exposure, modern mourning is 'perhaps a sign of genuine respect and affection rather than the compulsory duty fulfilled by so many of past generations.' Genuine vs. compulsory — that is B's authenticity contrast.",
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": "The prompt asks what is ARGUED about a RECENT example of general mourning. The passage mentions Diana's death in 1997 as the recent example. Look at what the writer says about that case versus the 18th-century cases.",
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the Diana contrast",
            "text": "The closing paragraph: 'Today few traces of general mourning remain in the UK, though the widespread and spontaneous outpouring of grief upon the death of Diana, Princess of Wales, in 1997, shows that it can still emerge, albeit in a different form than that of the 18th century. Indeed, the sense that we know the modern British royal family thanks to the media exposure they are subject to, means that, while general mourning is no longer enforced, when it does occur it is perhaps a sign of genuine respect and affection rather than the compulsory duty fulfilled by so many of past generations.'",
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": "In the 1700s, mourning was an enforced public duty — most people went through the motions out of convention. Today's mourning is no longer required, so when it does happen (like the grief for Diana) it reflects real feeling rather than compliance. We feel we know the royals through TV and newspapers, so the affection is personal. Modern mourning is voluntary and genuine; old mourning was compulsory and often performative.",
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": "'Spontaneous outpouring' = unplanned, voluntary expression. 'Albeit' = although. 'Compulsory duty' = required obligation. 'Genuine respect and affection' = real, felt regard. 'Authentic' = real, not faked. The contrast 'genuine vs. compulsory' is the same axis B names with 'authentic'.",
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": "A says public mourning is just as relevant today as before — the passage says the opposite, 'few traces' remain. B says feelings may be more authentic today than in the 1700s — fits the 'genuine respect and affection' versus 'compulsory duty' contrast directly. C says prescribed mourning is not just a thing of the past — the passage explicitly says mourning is no longer enforced; what remains is voluntary, not prescribed. D says grief in the 1700s may have been more genuine than we think — the passage argues the opposite, that many in the 1700s 'simply went through the motions out of deference'.",
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": "The answer is B. The writer's closing claim is that mourning has shifted from compulsory duty to voluntary feeling — which makes modern instances more authentic than 18th-century ones. That is exactly B.",
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": "It's tempting to read Diana's mass grief as proof that mourning is 'still just as big a deal' — and the option captures that vibe.",
            "why_wrong": "The passage says 'few traces of general mourning remain' and frames Diana as a notable EXCEPTION ('though… shows that it can still emerge'). Step 2 anchors the relevance claim: today's mourning is residual, not equal. A overstates.",
        },
        {
            "letter": "C",
            "why_tempting": "If you remember the line 'general mourning is no longer enforced, when it does occur', it can sound like prescribed mourning persists in some form.",
            "why_wrong": "The passage explicitly contrasts no-longer-enforced (modern) with compulsory (18th century). What persists is voluntary, not prescribed. Step 5 makes the gap: C inverts the modern voluntariness into ongoing prescription.",
        },
        {
            "letter": "D",
            "why_tempting": "Many readers, sympathetic to past generations, might want to defend their grief as real — and D voices that defence.",
            "why_wrong": "The passage actually says many in the 1700s 'simply went through the motions out of deference to convention'. The writer's view is that 18th-century mourning was often performative, while modern mourning is more genuine. D inverts the writer's argument. Step 3 makes the direction visible.",
        },
    ],
    "technique": "On 'what is argued about a recent example' items where a passage contrasts then-and-now, pick the option that respects the writer's DIRECTION of contrast. The trigger to memorise: 'compulsory then, voluntary now' is the standard arc — and the modern side is the side the writer rates as more authentic.",
    "pitfall": "The phrase 'when it does occur' can be misread as evidence that prescribed mourning still happens. Read whether the writer says 'when it does occur, IT IS NOW VOLUNTARY' before reaching for an option about ongoing prescription.",
}


# Save final batch (total 20)
save(entries)

print()
print(f"DONE — wrote {len(entries)} entries to {OUT}")
