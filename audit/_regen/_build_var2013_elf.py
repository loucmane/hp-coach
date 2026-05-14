"""Build Layer-2 ELF explanations for var-2013 (Variant C, English).

Hand-authored — NO API. Writes incrementally every 5 entries.
"""
from __future__ import annotations

import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}

OUT_PATH = Path("audit/_regen/var-2013-elf.json")


def save(entries: dict) -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(
        json.dumps(entries, indent=2, sort_keys=True, ensure_ascii=False)
    )


def wrap(payload: dict) -> dict:
    return {"_meta": META, **payload}


entries: dict[str, dict] = {}


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-031 — Bugs short passage, "What is said in this text?", D
# Passage: mosquitoes' immune systems chop viral genetic material;
# discovery might lead to antivirals that mimic the trick.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-031"] = wrap({
    "solution_path": (
        "The 'Bugs' passage ends with the line that the discovery 'might lead to "
        "antivirals fashioned to mimic the mosquito's virus-killing tricks' — so "
        "the mosquito's defence becomes a model for human medicine. That matches D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is said in this text?' — you are looking for "
                "the option that the passage SAYS, not what you can vaguely infer. "
                "On a 'what is said' item, the correct answer is almost always a "
                "paraphrase of one specific sentence in the text."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentence",
            "text": (
                "The final sentence carries the headline: 'The discovery might lead "
                "to antivirals fashioned to mimic the mosquito's virus-killing "
                "tricks.' Everything before sets up the discovery; this line states "
                "what the discovery is FOR."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "Researchers found that the mosquito's own immune system chops up "
                "virus DNA. Because mosquitoes already do this trick, scientists can "
                "now design human antivirals that copy it. The mosquito becomes the "
                "blueprint for new drugs."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Antivirals' = drugs that fight viruses. 'Fashioned to mimic' = "
                "designed to imitate. 'Succumb to' = die from, be overcome by. "
                "'Pathogen's genetic material' = the virus's DNA/RNA. The closing "
                "phrase 'serve as models for medical treatment' in option D is the "
                "abstract version of 'fashioned to mimic the mosquito's tricks'."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says mosquitoes risk becoming endangered — the text never says "
                "that. B says the mosquito's immune system is MODIFIED by viruses — "
                "the text says the opposite: the immune system attacks the virus. "
                "C says scientists know how to DISTURB the harmony between viruses "
                "and mosquitoes — but the passage explicitly rejects the harmony "
                "theory ('quite the opposite to be true'), so there's no harmony to "
                "disturb. D says virus-carrying mosquitoes may serve as MODELS for "
                "medical treatment — this is exactly the closing line's claim."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The whole paragraph builds toward one idea: a "
                "biological trick mosquitoes already use can be borrowed to treat "
                "humans."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'died off more than four times as quickly' and "
                "imagine mosquitoes as a population at risk — endangered-species "
                "language sits one inference away."
            ),
            "why_wrong": (
                "The dying mosquitoes in the passage are the LAB ones whose immune "
                "system was disabled, not wild populations. Step 2's key sentence is "
                "about a benefit for humans, not a risk for mosquitoes."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at 'mosquito's immune system' + 'genetically modified "
                "version' and read the relationship backwards: the virus modifies the "
                "immune system."
            ),
            "why_wrong": (
                "The text is the other way round: the immune system attacks the "
                "virus by chopping its genetic material. Step 3's paraphrase keeps "
                "the agent (immune system) and the target (virus) straight."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct is that 'harmony' shows up in the passage, so an "
                "option that talks about disturbing harmony feels close."
            ),
            "why_wrong": (
                "The passage explicitly REJECTS the harmony theory — it says the "
                "opposite is true, the immune system fights the virus. There is no "
                "harmony to disturb. Step 5 catches the negation."
            ),
        },
    ],
    "technique": (
        "On 'what is said' items with a short passage, focus on the final sentence "
        "of the paragraph — it usually states the IMPLICATION or APPLICATION the "
        "rest of the text builds toward, and that line tends to be the answer. "
        "Skim for words like 'might lead to', 'could', 'may', 'discovery' — they "
        "flag the headline."
    ),
    "pitfall": (
        "Short ELF passages plant rejected theories ('the prevailing theory "
        "maintained…') as bait. Distractors recycle the wording of the theory the "
        "passage knocks down. Always check whether a phrase is being asserted or "
        "denied."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-032 — Unpredictability short passage, "What is claimed here?", C
# Many professions (economists, meteorologists, political pundits,
# sportswriters) are in the prediction business and risk being wrong.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-032"] = wrap({
    "solution_path": (
        "The 'Unpredictability' passage opens by listing professions whose work "
        "involves prediction — economists, meteorologists, political pundits, "
        "sportswriters — and notes their 'discredited forays into futurology'. "
        "Many professions have to predict the future; that matches C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is claimed here?' — so you want the broad "
                "assertion the passage actually makes, not a sub-detail or a "
                "tempting near-paraphrase. Watch for options that flip the claim or "
                "overshoot it."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentence",
            "text": (
                "The opening sentence does the heavy lifting: 'Unpredictability is "
                "the bane of economists, meteorologists, political pundits and "
                "sportswriters.' Then: 'They are always in danger of having their "
                "discredited forays into futurology flung back in their faces.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "A list of professions all share the same problem: their job "
                "involves predicting things (the economy, the weather, politics, "
                "sports), and predictions often turn out wrong. Historians, by "
                "contrast, look BACK and benefit from hindsight."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Bane' = a curse, a major source of trouble. 'Forays into "
                "futurology' = attempts to predict the future. 'Discredited' = "
                "shown to be wrong, no longer trusted. 'Flung back in their faces' = "
                "thrown back at them as evidence of failure. 'Inexorable march' = "
                "unstoppable forward movement. The first sentence is essentially "
                "saying: many jobs involve predicting the future, and prediction is "
                "hard."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says certain professions provide 'reliable and unquestionable' "
                "predictions — the OPPOSITE of the passage's claim ('discredited "
                "forays'). B says historians rarely describe events accurately — the "
                "passage says historians benefit from HINDSIGHT and tend to depict "
                "an 'inexorable march', not that they are inaccurate. C says many "
                "professions have to predict what might happen — matches the opening "
                "list directly. D says historians are the best predictors — but the "
                "passage's whole point is that historians look BACKWARD, they aren't "
                "predicting at all."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The passage's first claim is that prediction is a "
                "shared occupational hazard across many fields — and the list it "
                "gives spells exactly that out."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "If you scan the list of expert professions quickly, you might read "
                "the passage as describing them as authorities and infer their "
                "predictions are reliable."
            ),
            "why_wrong": (
                "The passage says exactly the opposite: their forays are "
                "'discredited' and 'flung back in their faces'. Step 4's gloss of "
                "'discredited' rules out 'reliable and unquestionable'."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to take 'depict an inexorable march of events' as a "
                "criticism of historical accuracy."
            ),
            "why_wrong": (
                "The passage is making a structural point — historians have "
                "hindsight, so the past LOOKS inevitable to them — not claiming "
                "they describe events wrongly. Step 3's paraphrase keeps that "
                "distinction."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct is that historians work with events, so they must be "
                "good at events; from there it's a small jump to 'best at predicting "
                "events'."
            ),
            "why_wrong": (
                "Historians don't predict — they look backward and benefit from "
                "hindsight. The passage explicitly contrasts predictive professions "
                "with historians, who write 'with the advantage of hindsight'. Step "
                "5 catches the category error."
            ),
        },
    ],
    "technique": (
        "On 'what is claimed here' items with a short passage, anchor on the first "
        "or second sentence — that is almost always where the claim lives. The rest "
        "of the paragraph supplies elaboration or contrast. Distractors often flip "
        "the polarity of the claim (reliable vs. discredited) or attribute the claim "
        "to the wrong subject (historians vs. forecasters)."
    ),
    "pitfall": (
        "Lists of professions in short ELF passages are bait for over-specific "
        "options. The claim usually generalises across the list, not about any one "
        "profession on it."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-033 — Warm Springs/polio long passage; "What is implied about
# polio in the first two paragraphs?", B
# First two paras: reviewer afraid of iron lung, friend's sister catches
# virus and is rushed to Boston to be saved — implies serious disease,
# hospitalization.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-033"] = wrap({
    "solution_path": (
        "The first two paragraphs describe the reviewer's childhood fear of the "
        "iron lung and a friend's sister who 'caught the virus' and had to be "
        "rushed to Boston 'to be saved' — polio comes across as a serious illness "
        "requiring hospitalization. That matches B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is implied about polio in the FIRST TWO "
                "paragraphs?' — so you restrict your search to the opening. The "
                "rest of the review is off-limits for this question. 'Implied' "
                "means the passage doesn't state it directly; you read what the "
                "details add up to."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key details",
            "text": (
                "Paragraph 1: 'I remember being scared of the iron lung… polio was "
                "a pretty vague menace.' Then: the friend's sister 'caught the "
                "virus', the whole town 'pitched in to send her to Boston to be "
                "saved'. Paragraph 2 carries this forward: Shreve spent two years "
                "in a 'polio rehabilitation hospital'."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "The author grew up frightened of polio. When someone she knew got "
                "it, the town reacted as if it were life-threatening — they raised "
                "money to send the girl to a Boston hospital. Shreve herself spent "
                "two years in a polio hospital. So polio in the passage is a "
                "serious disease that puts children in hospitals."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Iron lung' = a large machine that breathes for paralysed polio "
                "patients (it tells you the disease can paralyse the muscles you "
                "breathe with). 'Vague menace' = a fuzzy, looming threat. 'Pitched "
                "in' = chipped in, collectively helped. 'To be saved' = to be "
                "rescued from death. 'Rehabilitation hospital' = a hospital for "
                "long-term recovery. Each of these terms points to a serious "
                "illness with hospital-level treatment."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says parents didn't take the virus seriously enough — but the "
                "first paragraph shows parents in dinner-table conversations, March "
                "of Dimes collections, fundraising for a sick child. They take it "
                "very seriously. B says polio was a serious disease leading to "
                "hospitalisation — exactly the picture the first two paragraphs "
                "paint (iron lung, Boston, rehabilitation hospital). C says "
                "Roosevelt decided all children with polio were sent away — the "
                "passage only says Roosevelt established the hospital, not that he "
                "ordered children there. D says polio was a deadly epidemic "
                "spreading fast across the U.S. — the first paragraphs describe a "
                "vague menace in one small Massachusetts town, not a national "
                "epidemic."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. Iron lungs, Boston hospital, two-year "
                "rehabilitation stay — the first two paragraphs build up an image "
                "of polio as a serious illness requiring hospitalisation."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Many stop at 'vague menace' and read the parents as nonchalant. If "
                "polio felt vague to a child, maybe the adults around her didn't "
                "treat it as urgent either."
            ),
            "why_wrong": (
                "The same paragraph describes overheard dinner conversations and "
                "March of Dimes collections — that's serious adult engagement. "
                "'Vague' describes the child's perception, not the parents' "
                "behaviour. Step 5 separates the two."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Franklin Roosevelt does appear in paragraph two as the founder of "
                "the Warm Springs hospital, so an option naming him feels textually "
                "anchored."
            ),
            "why_wrong": (
                "He ESTABLISHED a hospital — he didn't decide that all children "
                "must be sent there. The passage gives him a single noun phrase, "
                "not a policy. Step 2's locate-the-details catches the inflation."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "'Deadly epidemic spreading fast' is a familiar polio narrative "
                "from American history, and 'epidemic' did appear in the dinner "
                "conversations."
            ),
            "why_wrong": (
                "The first two paragraphs describe one small Massachusetts town "
                "and one friend's sister — not a fast nationwide spread. The "
                "passage is concrete and local, while D is sweeping and "
                "demographic. Step 3's paraphrase keeps the scale honest."
            ),
        },
    ],
    "technique": (
        "On 'what is implied in paragraphs X–Y' items, treat the question as a "
        "scope filter: physically constrain yourself to those paragraphs only. "
        "Then collect 2–3 concrete details and ask what general claim they jointly "
        "support. The implied claim is the smallest generalisation that covers all "
        "the details."
    ),
    "pitfall": (
        "Distractors often borrow proper nouns from the constrained paragraphs "
        "(Roosevelt, Boston, Warm Springs) and surround them with claims the "
        "passage never makes. Check whether the proper noun is just NAMED in the "
        "text or actually given the action in the option."
    ),
})


save(entries)


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-034 — Warm Springs, "What is suggested about Shreve's parents?", D
# Parents accept the illness but not its handicaps; mother devises
# exercises; Susan attends school, plays sport, goes to camp 'just like
# other children'.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-034"] = wrap({
    "solution_path": (
        "The third paragraph describes Shreve's parents as accepting 'the fact of "
        "her illness but not necessarily its handicaps' — mother devises exercises, "
        "daughter attends school, plays sport, goes to camp 'just like other "
        "children'. They refuse to let polio define a normal childhood, which "
        "matches D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is suggested about Susan Shreve's PARENTS?' — "
                "so you're looking for an option that captures the parents' "
                "approach or attitude. 'Suggested' tells you the answer is an "
                "inference, but a tight one — the text supports it without saying "
                "it word-for-word."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Third paragraph: 'Her parents – mother, loving and indomitable; "
                "father, loving and distant – accept the fact of her illness but "
                "not necessarily its handicaps. Her mother devises exercise after "
                "exercise to spark new life in her daughter's leg, turning the "
                "do-it-yourself restoration regime into a game. Shreve attends "
                "school, plays sport and goes to camp just like other children…'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "The parents accepted that Susan was ill but refused to let the "
                "illness limit her life. Mother kept inventing exercises and made "
                "them feel like a game. Susan was sent to school, sport, and camp "
                "alongside non-disabled kids. The pattern: don't let polio cut her "
                "off from a regular childhood."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Indomitable' = unconquerable, never gives up. 'Handicaps' = "
                "limitations imposed by the disability. 'Do-it-yourself restoration "
                "regime' = a home-made rehabilitation programme. 'Devises' = "
                "invents, comes up with. The pairing 'accept the fact… but not the "
                "handicaps' is the key contrast: they take the disease seriously "
                "but refuse to be limited by it."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says they disagreed on her upbringing but found good treatment — "
                "the passage describes the mother as loving-indomitable and the "
                "father as loving-distant, but nothing about disagreement on "
                "upbringing. B says they pretended she didn't have polio and "
                "forced her into sports — they ACKNOWLEDGE the illness ('accept "
                "the fact of her illness'); they don't pretend. C says they set up "
                "a training scheme offered to OTHER disabled children — the home "
                "regime is for Susan only, not a public programme. D says they "
                "were determined not to let polio interfere with a normal life for "
                "a girl her age — that's precisely 'accept the illness but not the "
                "handicaps' restated."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The parents' refusal to let the handicap define "
                "Susan's life — exercises at home, school, sport, camp with her "
                "peers — is the textbook example of D's claim."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'loving and indomitable' versus 'loving and "
                "distant' as a hint that the parents had different approaches and "
                "infer that as disagreement."
            ),
            "why_wrong": (
                "Different temperaments aren't the same as disagreement on "
                "upbringing — the passage shows them ALIGNED on the core decision "
                "(treat the illness, refuse the limits). Step 3's paraphrase "
                "centres the alignment, not the contrast."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at 'plays sport… just like other children' and read it "
                "as forced participation despite illness."
            ),
            "why_wrong": (
                "The passage explicitly says the parents ACCEPT the fact of the "
                "illness — they don't pretend it isn't there. And the sport is one "
                "activity among many (school, camp), not a forced regimen. Step 4 "
                "pins the 'accept the fact' phrase."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "The mother's invented exercises and the do-it-yourself regime "
                "sound like the kind of homemade programme that could be shared."
            ),
            "why_wrong": (
                "The text describes the exercises as a private game between mother "
                "and daughter — there's no mention of offering it to other disabled "
                "children. Step 5's option-by-option scan catches the leap."
            ),
        },
    ],
    "technique": (
        "On 'what is suggested about X' character items, find the descriptive "
        "phrase the passage uses for X and ask what behaviour pattern it implies. "
        "Often there's a contrast pair ('accept… but not…') and the answer "
        "restates the structural claim of that pair. The correct option is the "
        "minimal paraphrase that doesn't add new facts."
    ),
    "pitfall": (
        "Adjectives the passage applies to a character (loving, indomitable, "
        "distant) seed distractors that turn descriptive contrasts into "
        "behavioural conflicts. 'Different in temperament' is not the same as "
        "'disagreed on parenting'."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-035 — Warm Springs, "How is Shreve's time at Warm Springs best
# described?", B (rebellious and eventful)
# Crushes on a boy and a priest, flirts with Catholicism, transplants,
# defies Southern racial customs, first period, sanitary belt round her
# neck, disastrous wheelchair race, sent home in disgrace.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-035"] = wrap({
    "solution_path": (
        "The third paragraph lists Shreve's Warm Springs experiences as a string "
        "of crushes, defiance of Southern racial customs, a disastrous wheelchair "
        "race, and being sent home in disgrace. That portrait is rebellious and "
        "eventful — answer B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks how Shreve's time at Warm Springs is BEST "
                "described. You need the option that captures the overall texture "
                "of her stay, not just one mood. Pay attention to the verbs and "
                "events the passage lists; the answer is in the tone those "
                "actions create together."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the catalogue of events",
            "text": (
                "Third paragraph: 'During two stays there, she develops crushes on "
                "a boy named Joey and a priest named Father James, flirts with "
                "Catholicism, has muscles transplanted, defies accepted Southern "
                "racial customs, experiences her first period, wears a sanitary "
                "belt round her neck into the Bay's Ward, and engages in a "
                "disastrous wheelchair race and is sent home in disgrace.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "That sentence is a parade of incidents: romance, religious "
                "experimentation, surgery, defiance of racial norms, a clumsy "
                "puberty moment, a wild race, and ultimately expulsion. Two "
                "themes run through them: lots happens (eventful), and Shreve is "
                "breaking rules (rebellious)."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Defies' = openly disobeys. 'Disastrous' = catastrophic, deeply "
                "failed. 'In disgrace' = with public shame, in disrepute. 'Flirts "
                "with Catholicism' = explores religion casually, not seriously. "
                "Every one of these phrases is the opposite of calm or quiet — the "
                "vocabulary itself carries the rebellious-eventful weight."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says calm and healing — but the catalogue is anything but "
                "calm: crushes, defiance, disastrous race, sent home in disgrace. "
                "B says rebellious and eventful — defies racial customs, "
                "disastrous race, sent home in disgrace = rebellious; the long "
                "list of incidents = eventful. Direct fit. C says religious and "
                "reflective — 'flirts with Catholicism' is one item on a long "
                "list, not the dominant note, and there's no reflection vocabulary "
                "in the catalogue. D says lonely and sad — the passage shows "
                "Shreve immersed in crushes, friendships, and conflict, not "
                "isolation or sadness."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The defining moments — defiance of racial "
                "customs and being sent home in disgrace — make 'rebellious' the "
                "natural label; the sheer length of the list makes 'eventful' the "
                "natural pair."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Left-to-right reading gives 'rehabilitation hospital' a healing "
                "vibe, and you might project calm onto a place built for "
                "recovery."
            ),
            "why_wrong": (
                "The setting is a rehab hospital, but Shreve's BEHAVIOUR there "
                "is the catalogue of romance, defiance, and being sent home in "
                "disgrace. Step 2's catalogue is the evidence; calm isn't on the "
                "list."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember 'flirts with Catholicism' as the most striking "
                "phrase, religious feels like the natural label."
            ),
            "why_wrong": (
                "'Flirts with' signals casual exploration, not serious religious "
                "commitment — and Catholicism is one item among many. The "
                "passage is light on reflection vocabulary, heavy on incident "
                "vocabulary. Step 4's gloss of 'flirts with' settles the weight."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "The framing of Warm Springs as a hospital for sick children "
                "primes loneliness and sadness as plausible.."
            ),
            "why_wrong": (
                "The catalogue actively contradicts loneliness — crushes, "
                "friendships, racial defiance (which requires others to defy "
                "against), a race with peers — these are deeply social events. "
                "Step 3's paraphrase captures the immersion, not the isolation."
            ),
        },
    ],
    "technique": (
        "On 'how is X best described' items, look for a SENTENCE THAT LISTS — "
        "passages often pack a character's experience into one long enumerative "
        "sentence, and the dominant adjective pair lives in the verbs of that "
        "list. Read the verbs ('defies', 'engages in', 'is sent home in disgrace') "
        "and let them vote on the label."
    ),
    "pitfall": (
        "Setting words ('rehabilitation hospital', 'Catholicism') bait you into "
        "options that match the SCENE rather than the CHARACTER'S ACTIONS. The "
        "question is about Shreve's time, not the building's purpose."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-036 — Warm Springs, why Shreve didn't get in touch, D
# Direct quote: 'It was, I think, a place to be in the moment. And after
# the moment it was time to be someplace else.' Her stay was bounded in
# time; she wanted to move on.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-036"] = wrap({
    "solution_path": (
        "Shreve's own words explain it: Warm Springs was 'a place to be "
        "“in the moment”. And after the moment it was time to be someplace else.' "
        "She regarded the stay as time-bounded and wanted to move on — answer D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks WHY, according to the text, Shreve didn't reach "
                "out to other patients. 'According to the text' means the answer "
                "is explicit — find the passage where she or the reviewer gives "
                "a reason."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate Shreve's explanation",
            "text": (
                "Two quotes from Shreve carry the answer. First: 'A reason, maybe "
                "the real reason, I never made an effort to be in touch with these "
                "people… is part of the reason I wanted to write this book in the "
                "first place. Not so much to discover anyone I'd lost, but to "
                "understand why I wanted to lose them.' Then: 'It was, I think, a "
                "place to be in the moment. And after the moment it was time to "
                "be someplace else.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "Shreve says she wanted to LOSE the people from Warm Springs — to "
                "leave that chapter closed. The hospital was meant to be a "
                "self-contained period in her life; once it was over, she wanted "
                "to move on to other places and people. It wasn't dislike, fear, "
                "or embarrassment — it was a deliberate moving-on."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Omission of commission' = a deliberate gap, a not-doing that "
                "was done on purpose. 'In the moment' = fully present in a "
                "limited stretch of time. The key phrase 'after the moment it "
                "was time to be someplace else' means the stay was time-bounded; "
                "once it ended she moved on. 'Defined in time' (option D's "
                "wording) is the abstract version of that phrase."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says she did not like the patients — the passage explicitly "
                "calls them 'so central to me for an important period', the "
                "opposite of dislike. B says she was afraid they would remember "
                "differently — the passage never raises memory mismatch as a "
                "concern. C says she felt embarrassed to call them after so "
                "long — the passage gives a deliberate, time-defined reason, not "
                "social awkwardness. D says she regarded Warm Springs as defined "
                "in time and wished to move on from there — that's 'a place to "
                "be in the moment, then it was time to be someplace else' "
                "paraphrased exactly."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. Shreve's own quoted explanation — Warm Springs "
                "was a bounded period, and after it ended she chose to move on — "
                "is exactly what D says."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "It's tempting to fill a behavioural gap with dislike — if she "
                "didn't call them, maybe she didn't like them."
            ),
            "why_wrong": (
                "The passage names the patients as 'so central to me' during "
                "the period — that's affection, not dislike. Step 5's quote rules "
                "out the dislike reading."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you remember 'the truth of this story is in the way I see it "
                "now', you might infer she worried about competing memories."
            ),
            "why_wrong": (
                "That quote is about HER self-perception over time, not about "
                "fearing how her ex-patients would remember things. Step 3's "
                "paraphrase keeps the focus on Shreve's own moving-on, not on "
                "memory negotiation with others."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'all these years without any contact' and assume "
                "social awkwardness is the natural explanation."
            ),
            "why_wrong": (
                "The passage gives a DELIBERATE reason ('I wanted to lose them') "
                "rather than an embarrassment-based one. Step 2's first quote is "
                "explicit: she chose to lose them, she wasn't blocked from "
                "reaching out by shyness."
            ),
        },
    ],
    "technique": (
        "On 'why, according to the text' items, find the character's OWN words "
        "in the passage — when a character explains themselves in a direct quote, "
        "that quote is almost always the basis for the correct answer. Paraphrase "
        "the quote and match. Distractors typically substitute one of the standard "
        "emotional explanations (dislike, fear, embarrassment) the passage never "
        "uses."
    ),
    "pitfall": (
        "When a passage describes a not-doing (Shreve didn't call her ex-patients), "
        "the default human reading is to fill the gap with a negative emotion. The "
        "text often supplies a positive, deliberate reason instead. Read the quote "
        "before guessing the motive."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-037 — Warm Springs, reviewer's overall attitude, B
# Reviewer praises tender memoir, sensitive account, distinguishes it from
# 'vertical-pronoun bores', and finished the book wanting to know more.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-037"] = wrap({
    "solution_path": (
        "The reviewer calls Warm Springs a 'tender memoir' and a 'sensitive "
        "account', distinguishes it from self-indulgent 'vertical-pronoun bores', "
        "and ends saying that when he finished it he 'still wanted to know more'. "
        "That's a positive, non-sentimental, engaging assessment — answer B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks for the reviewer's OVERALL attitude — so you "
                "weigh the cumulative tone across the review, not one stray line. "
                "Look at the reviewer's adjectives for the book and at the closing "
                "judgement."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the evaluative phrases",
            "text": (
                "The reviewer calls it a 'tender memoir', a 'sensitive account', "
                "praises Shreve's approach 'with a reporter's eye', distinguishes "
                "the book from 'vertical-pronoun bores arriving at bookstores' "
                "(memoir-jargon for self-absorbed I-I-I writing), and ends with "
                "'when I finished the book… I still wanted to know more about "
                "what had become of the girl who left Georgia with her right leg "
                "three and a half inches shorter than her left one.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "The reviewer thinks the book is warm without being mushy "
                "(tender, sensitive, but reporter-disciplined), unlike the "
                "self-indulgent memoirs flooding bookstores. By the end he wanted "
                "more of the story — a sign of engagement. So: engaging, not "
                "sentimental, about a girl's life with polio."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Tender' = warm, gentle, but not saccharine. 'Reporter's eye' = "
                "factual, observant, disciplined. 'Vertical-pronoun bores' = "
                "memoirs full of 'I, I, I' — self-absorbed writing. 'Sentimental' "
                "= excessively emotional, mushy. 'Engaging' = holds the reader's "
                "attention. The reviewer is praising precisely the discipline "
                "that keeps the book from being sentimental."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says well-written but lacking empathy — 'tender' and "
                "'sensitive' are direct empathy words; the reviewer is signalling "
                "the OPPOSITE. B says without being sentimental, an engaging "
                "account of a girl's life with polio — 'reporter's eye' + 'tender' "
                "= warm but not sentimental; 'I still wanted to know more' = "
                "engaging; the subject is exactly the girl's life with polio. C "
                "says the focus is too much on the grown-up woman at the expense "
                "of the girl — the reviewer actually praises the way Shreve fits "
                "the girl back into 'a time and place a half-century gone'. D says "
                "it is a well-balanced book on how polio spread in the U.S. — the "
                "book is a personal memoir, not a public-health history."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The reviewer's vocabulary (tender, sensitive, "
                "reporter's eye) and his closing wish for more both add up to: "
                "engaging without being sentimental."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "'Reporter's eye' could be read as a CRITICISM if you take it as "
                "'detached, journalistic, lacking warmth'."
            ),
            "why_wrong": (
                "The reviewer pairs 'reporter's eye' with 'tender' and 'sensitive' "
                "— he is praising the combination, not contrasting them. Step 4's "
                "vocabulary check makes the praise explicit."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Of her present self Shreve is 'circumspect' — restrained — and "
                "you could over-read that as the reviewer complaining she focuses "
                "on the woman instead of the girl."
            ),
            "why_wrong": (
                "The reviewer says Shreve IS circumspect about her present self "
                "and that 'that's not the story Warm Springs sets out to tell' — "
                "no complaint. The book IS about the girl, which the reviewer "
                "praises. Step 2's locate catches the praise tone."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on a book-about-polio question is that the book "
                "is about polio in general."
            ),
            "why_wrong": (
                "The reviewer frames the book as a personal memoir into which "
                "Shreve weaves 'the history of this once-dreaded disease "
                "unobtrusively'. It's a girl's story with polio context, not a "
                "public-health book. Step 5's option scan catches the genre "
                "misread."
            ),
        },
    ],
    "technique": (
        "On 'reviewer's overall attitude' items, collect the EVALUATIVE adjectives "
        "the reviewer applies to the book and the closing sentence. The correct "
        "option is the one whose tone aligns with that adjective cluster. "
        "Distractors typically pick one adjective, flip its valence, or shift the "
        "topic ('about polio's spread' vs 'about a girl's life with polio')."
    ),
    "pitfall": (
        "Reviews often contain a contrast set ('not X, but Y') — 'not sentimental, "
        "but engaging' is exactly the structure here. Distractor C breaks the "
        "contrast by mishandling the not-X part; the correct option preserves "
        "both halves."
    ),
})


save(entries)


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-038 — H2S short text, 'What is said in this text?', A
# H2S is poisonous (rotten-egg toxic gas) but essential to many processes
# in the body — could help treat heart attacks and trauma. Poisonous but
# necessary for human health.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-038"] = wrap({
    "solution_path": (
        "The H2S passage calls the gas 'toxic' and notes that scientists have "
        "discovered it is 'actually essential to a number of processes in the "
        "body' and could help treat heart-attack and trauma patients. Toxic but "
        "essential = poisonous but necessary for human health — answer A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'What is said in this text?' — the correct option will paraphrase "
                "a claim the passage actually makes. Short ELF passages tend to "
                "carry one headline idea that the question tests."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the two anchor sentences",
            "text": (
                "First: 'the toxic gas synonymous with that smell – hydrogen "
                "sulfide (H2S) – may well become a fixture in such settings in "
                "the future.' Second: 'Over the past decade scientists have "
                "discovered that H2S is actually essential to a number of "
                "processes in the body, including controlling blood pressure "
                "and regulating metabolism.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "H2S is poisonous — it's a toxic gas that smells like rotten "
                "eggs. But the body actually NEEDS it for normal functions "
                "like blood-pressure control and metabolism. So it's both "
                "deadly and necessary, depending on dose and context."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Toxic gas' = poisonous gas. 'Essential to processes in the "
                "body' = necessary for the body to function. 'Harnessed properly' "
                "= controlled and put to use carefully. 'Fixture' = a regular, "
                "permanent feature. The passage is built on the toxic-but-needed "
                "paradox; option A's 'poisonous but necessary' is the same idea "
                "in plainer words."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says H2S is poisonous but necessary for human health — direct "
                "paraphrase of 'toxic gas… essential to a number of processes in "
                "the body'. B says it is increasingly used in operation rooms — "
                "the passage says it MAY become a fixture in the future, not that "
                "it is already increasingly used. C says it is a new and "
                "unwelcome presence in hospitals — the passage frames it as a "
                "potential FUTURE treatment, not an unwelcome contaminant. D "
                "says it is a dangerous substance found in many heart patients — "
                "the passage says it could TREAT heart-attack patients, not that "
                "it is FOUND in them."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. The paragraph's whole point is the paradox: "
                "the same gas that's toxic enough to evoke a hospital stench is "
                "also essential to several body processes."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "'May well become a fixture in such settings' sounds close to "
                "'increasingly being used' — both gesture at hospital adoption."
            ),
            "why_wrong": (
                "'May become' is future, conditional; 'increasingly being used' "
                "is present, ongoing. The passage projects future use, not "
                "current use. Step 4's gloss of 'fixture' pins it as future."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you read 'the stench of rotten eggs' and 'toxic gas' "
                "literally, H2S sounds exactly like an unwelcome hospital "
                "contaminant."
            ),
            "why_wrong": (
                "The passage frames that image as a juxtaposition — distasteful "
                "smell next to potential medical use. H2S is being presented as "
                "a FUTURE TREATMENT, not as a contaminant. Step 2's anchor "
                "sentences keep the framing clear."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "'Help treat heart attack patients' could be misread as 'is "
                "found in heart attack patients'."
            ),
            "why_wrong": (
                "The passage says H2S could TREAT heart-attack patients — it "
                "would be administered, not detected in them. Step 5 catches "
                "the direction-of-relationship flip."
            ),
        },
    ],
    "technique": (
        "On 'what is said' items with a paradox passage (toxic but useful, small "
        "but powerful, etc.), the correct option preserves both halves of the "
        "paradox. Distractors usually keep one half and drop the other. Skim for "
        "the contrast connector ('but', 'yet', 'though', 'actually') — that "
        "sentence carries the headline."
    ),
    "pitfall": (
        "Future-conditional language ('may', 'could', 'might') gets compressed "
        "into present-tense distractors. 'May become a fixture' is not the same "
        "as 'is increasingly used'. Read the modal verb before matching."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-039 — OTC short text, 'What is suggested here?', B
# 'OTC derivatives are traded privately… if the latter were drugs, they
# would probably be supplied only on prescription: they carry a big risk of
# unpleasant side-effects.' → financial market would benefit from stricter
# regulation.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-039"] = wrap({
    "solution_path": (
        "The OTC passage says OTC drugs can be bought off the shelf, while OTC "
        "derivatives carry 'a big risk of unpleasant side-effects' — and 'if they "
        "were drugs, they would probably be supplied only on prescription'. The "
        "analogy implies that derivatives should be more controlled. That matches "
        "B: stricter regulation in the financial market."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'What is suggested here?' — the passage doesn't say it outright; "
                "you derive it from the ANALOGY the passage draws. Short OTC text "
                "uses the medicine/finance comparison to make a point. Find the "
                "point."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the analogy",
            "text": (
                "'OTC drugs can be picked off the shelf with no prescriptions; "
                "OTC derivatives are traded privately between two parties rather "
                "than on exchange. If the latter were drugs, they would probably "
                "be supplied only on prescription: they carry a big risk of "
                "unpleasant side-effects.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "Drugs sold over-the-counter are safe enough that you don't need "
                "a doctor. Derivatives traded over-the-counter are NOT that safe — "
                "they're risky enough that, if they were drugs, you'd need a "
                "prescription. The unstated conclusion: financial OTC trading "
                "should be more tightly controlled, the way risky drugs are."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Over-the-counter (OTC)' = sold without a prescription (drugs) "
                "or traded privately, not on an exchange (finance). 'Derivatives' "
                "= financial contracts whose value derives from an underlying "
                "asset. 'Side-effects' = unwanted consequences. 'Supplied only on "
                "prescription' = requires a doctor's authorisation — a regulatory "
                "control. The whole analogy maps drug regulation onto financial "
                "regulation."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says medicine and finance share common features in how they "
                "are dealt with — the passage actually CONTRASTS them: OTC drugs "
                "are casual, OTC derivatives are risky despite the same label. B "
                "says the financial market might benefit from stricter "
                "regulation — that's the analogy's punchline: risky-enough "
                "products should be prescription-only. C says 'over-the-counter' "
                "is a term for illicit drug dealing — not what the passage says; "
                "OTC drugs are legal and casual. D says drugs should be more "
                "controlled because they often have unwanted effects — but the "
                "passage's worry is about derivatives, not drugs; drugs are the "
                "well-regulated model, not the target."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The analogy borrows the prescription model from "
                "medicine to suggest that risky financial products should be "
                "treated the same way — i.e., more strictly regulated."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "First instinct is that an analogy IMPLIES similarity between "
                "the two domains, so 'medicine and finance share features' sounds "
                "like the takeaway."
            ),
            "why_wrong": (
                "The passage builds the analogy precisely to point out a MISMATCH: "
                "in medicine, OTC means safe; in finance, OTC means risky. The "
                "structure is contrast-via-analogy, not similarity. Step 3's "
                "paraphrase keeps the contrast."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "The phrase 'over-the-counter' has multiple meanings, and a "
                "reader scanning fast might pull in the slang sense (illicit "
                "drug dealing) by association."
            ),
            "why_wrong": (
                "The passage explicitly defines OTC drugs as ones you can pick "
                "off the shelf without a prescription — that's legal, casual "
                "purchasing, not illicit dealing. Step 4's gloss settles the "
                "meaning."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snap reading swaps the analogy's source for its target: 'drugs "
                "have side-effects, so drugs need more control'."
            ),
            "why_wrong": (
                "Drugs in the analogy are already the well-regulated reference "
                "point — prescription drugs HAVE the controls; the suggestion is "
                "to extend that model to derivatives. Step 2's locate-the-analogy "
                "step keeps source and target straight."
            ),
        },
    ],
    "technique": (
        "On 'what is suggested here' analogy items, identify the analogy's source "
        "(here: drug regulation) and target (here: financial OTC). The suggestion "
        "is almost always: apply the source's RULES or LESSONS to the target. "
        "Distractors typically (a) infer that the two domains are SIMILAR rather "
        "than mismatched, or (b) flip source and target."
    ),
    "pitfall": (
        "Conditional clauses ('if the latter were drugs') are doing the "
        "argumentative work. They signal an implied recommendation, not a "
        "description. When you see one, ask: what does the writer want to "
        "happen because of this comparison?"
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb1-ELF-040 — Book Review India, "most in line with the text", B
# 'totally without personal points of reference for the reader. You never
# get that flash of recognition: oh yes, as a child I used to ritually
# behead a goat just like that!' → reader will struggle to relate.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb1-ELF-040"] = wrap({
    "solution_path": (
        "The reviewer says the book is 'totally without personal points of "
        "reference for the reader' — no flash of recognition for ordinary readers "
        "(no childhood goats or elephant prams). The princedom's world 'seems "
        "centuries away'. That matches B: the reader may find it difficult to "
        "relate."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'Most in line with the text' means: find the option whose claim "
                "fits the passage's overall judgement. The short book review "
                "praises the book's exoticism but warns that ordinary readers "
                "have no shared frame for it."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "'This vibrant tale of growing up in princely India is unlike any "
                "other memoir in that it is so totally without personal points of "
                "reference for the reader. You never get that flash of "
                "recognition: oh yes, as a child I used to ritually behead a goat "
                "just like that! Or: how like the elephant I had as a pram when I "
                "was little!' Then: 'This description of a dusty princedom in the "
                "1920s and 30s seems centuries away.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "The book describes a world (a 1920s–30s Indian princedom with "
                "ritual goat sacrifice and elephant prams) that ordinary readers "
                "share nothing with. There's no 'oh yes, I did that too' moment. "
                "The reviewer signals: this book is rich, but distant — readers "
                "will struggle to find common ground."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Personal points of reference' = familiar experiences a reader "
                "can map to. 'Flash of recognition' = the moment a reader feels "
                "'yes, that's me too'. 'Centuries away' = so culturally distant "
                "it feels like a different era. 'Vibrant' = lively, vivid. The "
                "vocabulary is praising the book's vividness while flagging its "
                "remoteness from the reader."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says Indian culture is similar to that of the rest of the "
                "world — the passage says the opposite: 'totally without personal "
                "points of reference', 'centuries away'. B says the reader may "
                "find it difficult to relate to events in the book — exactly the "
                "'no flash of recognition' point. C says Indian literature is a "
                "mixture of old rituals and modern life — the passage describes "
                "this one book about a 1920s–30s princedom, not Indian literature "
                "as a whole, and doesn't talk about modern life. D says the "
                "author has written a fairy tale taking place in India — "
                "'fairy tale' isn't a label the passage uses; the book is "
                "presented as a memoir, not a fairy tale."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The reviewer makes one main point about the "
                "READER'S experience — and that point is that the book gives no "
                "common ground, so readers will struggle to relate."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "First instinct on a 'most in line with the text' item is to pick "
                "a soft-claim option about cultural similarity — it sounds like a "
                "reasonable book-review takeaway in general."
            ),
            "why_wrong": (
                "The passage explicitly insists on cultural DISTANCE: no shared "
                "points of reference, no flash of recognition, centuries away. "
                "Step 3's paraphrase pins the distance, not the similarity."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'Indian' + 'rituals' and reach for a generic claim "
                "about Indian literature being a blend of old and new."
            ),
            "why_wrong": (
                "The passage is about ONE memoir of a 1920s–30s princedom, with "
                "no claim about Indian literature in general and no modern-life "
                "element. Step 5's option scan keeps the scope to this book."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "The vivid imagery (elephant pram, ritual goat) reads as "
                "fairy-tale exotic, so labelling the book a fairy tale feels "
                "intuitive."
            ),
            "why_wrong": (
                "The passage calls it a 'tale of growing up' and a 'memoir' — a "
                "real-life account of childhood. Fairy tale would be a fictional "
                "genre label the passage never applies. Step 4's vocabulary keeps "
                "the genre honest."
            ),
        },
    ],
    "technique": (
        "On 'most in line with the text' items for short book reviews, find the "
        "review's one main verdict (what is the reviewer most concerned to "
        "communicate?) and match the option that restates it. Distractors widen "
        "the scope ('Indian literature' instead of 'this book') or swap the "
        "genre label."
    ),
    "pitfall": (
        "Cultural-other passages bait readers into generic globalisation claims "
        "('similar to the rest of the world'). The reviewer is signalling the "
        "OPPOSITE here — read the specific phrases before reaching for a "
        "universalist option."
    ),
})


save(entries)


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-031 — SPIDER cloze "to ___ the accumulated evolutionary wisdom", A=exploit
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-031"] = wrap({
    "solution_path": (
        "Gap 31 sits in 'Engineers who would like to _____ the accumulated "
        "evolutionary wisdom embodied in biological materials are fascinated by "
        "silk.' Engineers want to PUT TO USE that wisdom — they admire spider "
        "silk because it could feed engineering. The verb is 'exploit'. Answer A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": (
                "This is a cloze (gap-fill) with four verbs. You're picking the "
                "verb whose meaning fits the relationship the sentence sets up "
                "between engineers and 'the accumulated evolutionary wisdom'. "
                "Read the full sentence, then ask: what do engineers WANT to do "
                "with that wisdom?"
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": (
                "'Engineers who would like to _____ the accumulated evolutionary "
                "wisdom embodied in biological materials are fascinated by silk.' "
                "The whole passage is about engineers borrowing tricks from nature "
                "(spider silk) to make better human materials. So the verb has to "
                "describe USING nature's tricks for engineering ends."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": (
                "Engineers + accumulated evolutionary wisdom = engineers want to "
                "TAP that wisdom for their own purposes. The relationship is "
                "extraction-for-use, putting nature's design to work. The verb "
                "should mean 'make productive use of'."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Exploit' = make use of, take advantage of (in engineering and "
                "science contexts, this is neutral-to-positive — 'exploit a "
                "property of the material'). 'Ban' = forbid. 'Ruin' = destroy. "
                "'Question' = challenge or doubt. Only 'exploit' carries the "
                "make-use-of meaning the sentence needs."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test each option",
            "text": (
                "A 'exploit the accumulated evolutionary wisdom' — engineers want "
                "to USE nature's accumulated tricks for their own designs. Fits. "
                "B 'ban the accumulated evolutionary wisdom' — engineers don't "
                "want to forbid biology; nonsensical here. C 'ruin the accumulated "
                "evolutionary wisdom' — engineers admire and want to LEVERAGE it, "
                "not destroy it. D 'question the accumulated evolutionary wisdom' "
                "— engineers in the passage are not sceptical of biology; they "
                "trust it enough to copy it."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. 'Exploit' in the engineering-science register "
                "means making productive use of something — exactly what the "
                "engineers in this passage want to do with nature's silk-making "
                "tricks."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "If you read 'evolutionary wisdom' as a value claim, you might "
                "look for a regulatory verb — engineers ban dangerous things "
                "all the time."
            ),
            "why_wrong": (
                "Engineers in this passage admire silk; they're not regulating "
                "biology. The whole paragraph is about copying nature, not "
                "forbidding it. Step 5's plug-and-test rules it out as nonsensical."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "'Exploit' can mean 'misuse' in everyday English, and 'ruin' "
                "shares that negative shade — a reader avoiding pejorative "
                "verbs might flip past A and land on C as the next closest."
            ),
            "why_wrong": (
                "Engineers are STARTING from nature's design and building on it "
                "— that's the opposite of ruining it. Step 4's gloss of 'exploit' "
                "in scientific English (neutral) reopens A."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on academic prose is that engineers QUESTION "
                "things — testing, doubting, falsifying."
            ),
            "why_wrong": (
                "The passage frames engineers as wanting to USE evolution's "
                "results, not challenge them — 'fascinated by silk' is "
                "admiration, not scrutiny. Step 3's relationship analysis keeps "
                "the focus on extraction-for-use."
            ),
        },
    ],
    "technique": (
        "On cloze verbs, name the RELATIONSHIP between the two nouns the verb "
        "connects (subject — object) before scanning options. Here: engineers "
        "(actor) + evolutionary wisdom (resource) = make use of. The verb that "
        "matches make-use-of is the only candidate."
    ),
    "pitfall": (
        "'Exploit' has a stronger negative shade in casual English than in "
        "scientific writing, where it just means 'put to use'. On ELF cloze, "
        "trust the academic register — 'exploit a property', 'exploit a "
        "mechanism' are standard neutral usage."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-032 — SPIDER cloze "The problem with the products of evolution, _____,"  C=though
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-032"] = wrap({
    "solution_path": (
        "Gap 32 sits in 'The problem with the products of evolution, _____, is "
        "that they are honed to do jobs for the creatures they come from, not "
        "for humanity.' The previous paragraph praised spider silk; this sentence "
        "introduces a downside. The connector signals contrast: 'though'. "
        "Answer C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": (
                "Cloze with four discourse connectors. The gap is a parenthetical "
                "adverb that links this sentence to the previous paragraph. Your "
                "job: identify the logical RELATIONSHIP between the two passages "
                "and pick the connector that signals it."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": (
                "Previous paragraph: spider silk is amazing — stronger than "
                "steel, stretches 40%, has variety. This sentence: 'The problem "
                "with the products of evolution, _____, is that they are honed to "
                "do jobs for the creatures they come from, not for humanity.' "
                "First the good (silk's strengths), now the catch (designed for "
                "spiders, not us)."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": (
                "The relationship is GOOD-NEWS → BUT-CATCH. The connector has "
                "to express 'in spite of all that, here's the problem'. That's a "
                "concessive contrast — and 'though' is the canonical mid-sentence "
                "concessive adverb."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Thus' = therefore, as a consequence. 'Namely' = specifically, "
                "to be precise. 'Though' (as an adverb) = however, in spite of "
                "that. 'Fortunately' = luckily. Of these, only 'though' signals "
                "concessive contrast — 'however much the previous paragraph "
                "praised silk, here's a snag'."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test each option",
            "text": (
                "A 'thus' — would mean the problem is a CONSEQUENCE of silk's "
                "wonders; but the problem isn't caused by them, it's a "
                "limitation alongside them. B 'namely' — would introduce a "
                "specification of a previously named problem; no problem was "
                "named yet, so 'namely' has nothing to specify. C 'though' — "
                "'in spite of all that praise, here's the snag'; fits the "
                "concessive turn the paragraph takes. D 'fortunately' — would "
                "make the limitation a piece of good news, which is the opposite "
                "of the framing."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. 'Though' marks the pivot from celebrating "
                "spider silk to noting its mismatch with human engineering needs."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "If you read the sentence in isolation, 'the problem' feels like "
                "a logical CONSEQUENCE of previous claims — and 'thus' is the "
                "consequence connector."
            ),
            "why_wrong": (
                "Spider silk's strength doesn't CAUSE the spider-not-human "
                "mismatch — they're two independent facts, one positive and one "
                "negative. Step 3's relationship analysis identifies the "
                "contrast, not the consequence."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "'Namely' is a familiar mid-sentence adverb in academic prose "
                "and would feel grammatically smooth here."
            ),
            "why_wrong": (
                "'Namely' specifies something already mentioned, and no problem "
                "has been named yet. You can't specify a problem before you've "
                "introduced one. Step 4's vocabulary check rules it out."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snap reading might cue on 'evolution' as a positive frame and "
                "reach for an upbeat adverb."
            ),
            "why_wrong": (
                "The sentence explicitly says 'the problem' — that's bad news, "
                "not good news, so 'fortunately' inverts the polarity. Step 5's "
                "plug-and-test catches the flip."
            ),
        },
    ],
    "technique": (
        "On cloze discourse connectors, the relationship between THIS sentence "
        "and the PREVIOUS one is what fixes the answer. Read the previous "
        "sentence, then ask: is this sentence agreeing, contrasting, "
        "exemplifying, or concluding? Pick the connector that names that move."
    ),
    "pitfall": (
        "Mid-sentence concessives like 'though' and 'however' often look "
        "interchangeable with consequence connectives like 'thus' to a fast "
        "reader. Test the logic: does the second sentence FOLLOW FROM or "
        "PUSH BACK ON the first? Follow-from = thus; push-back = though."
    ),
})


save(entries)


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-033 — SPIDER cloze, "_____ studies have identified the sequences of DNA…" B=Previous
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-033"] = wrap({
    "solution_path": (
        "Gap 33 sits in '_____ studies have identified the sequences of DNA within "
        "genes for spider silk proteins.' DNA sequencing is recent science, so "
        "'Ancient', 'Social', or 'Cultural' all clash. 'Previous' studies — earlier "
        "work that set up Kaplan's research — fits. Answer B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": (
                "Cloze with four adjectives modifying 'studies'. The sentence "
                "describes work that has identified DNA sequences for spider silk "
                "proteins. Your job: pick the adjective whose meaning is "
                "compatible with that kind of scientific work and with the "
                "paragraph's narrative position."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": (
                "'And that is what David Kaplan and his colleagues at Tufts "
                "University have been trying to do. _____ studies have identified "
                "the sequences of DNA within genes for spider silk proteins.' "
                "The narrative flow: Kaplan's team is now extending the work that "
                "earlier studies started. The 'studies' in the gap are the prior "
                "research Kaplan builds on."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": (
                "The adjective marks these studies as EARLIER in the chronology "
                "of research — coming before Kaplan's current work. The "
                "relationship is temporal-prior. 'Previous' (= earlier in time) "
                "names exactly that."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Ancient' = thousands of years old, classical antiquity. "
                "'Previous' = before, prior, earlier. 'Social' = relating to "
                "society. 'Cultural' = relating to culture. DNA sequencing is a "
                "20th–21st-century technique — incompatible with 'ancient'; "
                "'social' and 'cultural' don't describe the type of laboratory "
                "research being done. Only 'previous' fits the temporal-prior "
                "slot."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test each option",
            "text": (
                "A 'Ancient studies have identified the sequences of DNA' — DNA "
                "sequencing is modern; ancient studies can't have done it. Out. "
                "B 'Previous studies have identified the sequences of DNA' — "
                "earlier scientific work feeds into Kaplan's current project; "
                "fits the chronology. C 'Social studies' is a specific subject "
                "name (sociology/civics in schools), unrelated to DNA work. D "
                "'Cultural studies' is another specific academic field, also "
                "unrelated to molecular biology."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The narrative needs the adjective for 'earlier, "
                "prior research', and 'previous' is the only candidate in the "
                "set."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "'Accumulated evolutionary wisdom' showed up earlier — 'ancient' "
                "might feel thematically aligned with deep evolutionary time."
            ),
            "why_wrong": (
                "Evolutionary time runs in the biology; the STUDIES are modern "
                "lab work. Step 4's vocabulary check separates the two "
                "timescales."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you skim 'studies' without checking what they study, 'social "
                "studies' is a familiar fixed phrase."
            ),
            "why_wrong": (
                "The studies in question are sequencing DNA — laboratory "
                "molecular biology, not sociology. 'Social studies' is a "
                "subject-area name, not an adjective for general research. Step "
                "5's plug-and-test rules it out."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "'Cultural' and 'social' both describe types of academic "
                "research; either could be reached for as a placeholder when "
                "you're not paying attention."
            ),
            "why_wrong": (
                "Same problem as C — cultural studies is a field about culture, "
                "not lab work on spider silk DNA. Step 3's temporal-prior "
                "relationship analysis rules out non-temporal adjectives."
            ),
        },
    ],
    "technique": (
        "On cloze adjectives modifying a noun like 'studies' or 'research', "
        "check which kind of research the sentence describes. The adjective "
        "has to match the type of work named. Temporal adjectives ('previous', "
        "'recent', 'earlier') anchor research in time; subject adjectives "
        "('social', 'cultural') anchor it in a field."
    ),
    "pitfall": (
        "'Social studies' and 'cultural studies' are fixed phrases that read "
        "smoothly even when they make no sense in context. Always check what "
        "the studies STUDY before accepting a familiar collocation."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-034 — SPIDER cloze, "link up spontaneously with other proteins and thus form larger, more _____ structures." D=complex
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-034"] = wrap({
    "solution_path": (
        "Gap 34 sits in 'link up spontaneously with other proteins and thus form "
        "larger, more _____ structures.' The proteins are combining into bigger, "
        "more elaborate assemblies — the matching adjective is 'complex'. "
        "Answer D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": (
                "Cloze with four adjectives describing 'structures' the proteins "
                "form by linking up. The comparative 'more _____' is paired with "
                "'larger' — so the adjective should describe what BIGGER protein "
                "assemblies are like compared to smaller ones."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": (
                "'…the ability to link up spontaneously with other proteins and "
                "thus form larger, more _____ structures.' Proteins linking with "
                "more proteins = bigger building blocks. Bigger building blocks "
                "tend to be more elaborate, not simpler."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": (
                "The adjective is paired with 'larger' by 'and' — so it should "
                "RUN IN THE SAME DIRECTION as 'larger' (positive correlation). "
                "More links → more components → more elaborate. The adjective "
                "needs to mean 'more elaborate / more intricate'."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Simple' = uncomplicated, having few parts. 'Partial' = "
                "incomplete, only part of something. 'Even' (as an adjective) = "
                "smooth, flat, uniform. 'Complex' = made of many connected "
                "parts, intricate. The biology of protein assembly: more "
                "subunits → more interactions → more complex. Only 'complex' "
                "fits."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test each option",
            "text": (
                "A 'larger, more simple structures' — contradicts 'larger'; "
                "bigger assemblies of proteins aren't simpler. B 'larger, more "
                "partial structures' — 'partial' means incomplete; 'larger and "
                "more incomplete' makes no sense as a pair. C 'larger, more even "
                "structures' — 'even' (smooth/uniform) doesn't follow from "
                "adding more protein partners. D 'larger, more complex "
                "structures' — bigger protein assemblies are by definition more "
                "intricate; fits."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. 'Larger' and 'more complex' are the standard "
                "pair when describing protein assemblies that build out of more "
                "subunits."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "Some readers reach for adjectives that 'sound technical' and "
                "'simple' has scientific associations (simple molecule, simple "
                "experiment)."
            ),
            "why_wrong": (
                "'Larger' and 'simpler' run in opposite directions — you don't "
                "get simpler structures by adding more components. Step 3's "
                "co-direction check rules it out."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you read 'link up' as 'incomplete linking', you might pick "
                "'partial' as a description of half-assembled structures."
            ),
            "why_wrong": (
                "'Partial' means incomplete, not bigger or more elaborate. The "
                "sentence describes a SUCCESSFUL assembly, not a half-finished "
                "one. Step 4's gloss of 'partial' rules it out."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'even' as a familiar engineering word — smooth, "
                "regular surfaces feel like material-science vocabulary."
            ),
            "why_wrong": (
                "'Even' (smooth/uniform) doesn't describe the result of "
                "combining different protein subunits — combination produces "
                "VARIETY, not uniformity. Step 5's plug-and-test catches the "
                "mismatch."
            ),
        },
    ],
    "technique": (
        "On cloze comparative adjectives paired with another comparative by "
        "'and' ('larger and more _____'), the second adjective almost always "
        "runs in the same direction. Test co-direction: if 'larger' goes up, "
        "the gap should also go up on some scale."
    ),
    "pitfall": (
        "Material-science vocabulary ('simple', 'partial', 'even') sounds "
        "domain-appropriate without being context-appropriate. Always check "
        "the local pairing ('larger AND more __') before trusting domain "
        "feel."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-035 — SPIDER cloze, "a useful new _____ of polymers" C=family
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-035"] = wrap({
    "solution_path": (
        "Gap 35 sits in 'a useful new _____ of polymers looks ready to be spun.' "
        "'Polymers' is a class of molecules; the noun in the gap names a GROUP "
        "of related polymers. 'Family' is the standard scientific word for "
        "groups of related substances. Answer C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the gap type",
            "text": (
                "Cloze with four nouns. The collocation is '_____ of polymers' — "
                "a group word that classifies a set of related polymers. Your "
                "job: pick the noun that scientific English uses for groups of "
                "related substances."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read around the gap",
            "text": (
                "'If all goes well, then, a useful new _____ of polymers looks "
                "ready to be spun.' The paragraph just described how Kaplan can "
                "produce silks with new properties, opening up new TYPES of "
                "polymers. The gap classifies them as a new group."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the relationship",
            "text": (
                "The noun has to mean 'a related group of polymers'. In "
                "chemistry, biology, and materials science, the standard term "
                "for that is 'family' (e.g., 'a family of compounds', 'a family "
                "of proteins'). The relationship is taxonomic-grouping."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Factory' = an industrial building. 'Shop' = a retail outlet or "
                "workshop. 'Family' = a related group (in science: 'a family of "
                "compounds', 'a family of polymers'). 'School' = a teaching "
                "institution. Only 'family' is a standard scientific "
                "classification noun."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test each option",
            "text": (
                "A 'a factory of polymers' — factories MAKE things, they aren't "
                "groupings of substances. Wrong noun type. B 'a shop of polymers' "
                "— even less idiomatic; shops sell things. C 'a family of "
                "polymers' — standard scientific phrase for a related group of "
                "polymer compounds. D 'a school of polymers' — schools are for "
                "fish or for learners, not for chemicals."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. 'A family of polymers' is the conventional "
                "scientific phrase for a related set of polymer compounds, and "
                "the only option that means 'group' here."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "If you read the paragraph as industrial — polymers being "
                "produced — 'factory' has manufacturing connotations."
            ),
            "why_wrong": (
                "A factory PRODUCES polymers; it isn't a TYPE of polymer. The "
                "gap needs a grouping noun, not a production noun. Step 3's "
                "taxonomic-grouping check rules it out."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "'Shop' shares manufacturing/workshop vibes with 'factory' and "
                "might feel like the soft alternative."
            ),
            "why_wrong": (
                "'A shop of polymers' isn't an English phrase — shops sell, "
                "they don't classify. Step 4's vocabulary check eliminates it."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "'School' shows up in 'school of thought' and 'school of fish' "
                "— it can mean a group in some collocations."
            ),
            "why_wrong": (
                "'School of fish', 'school of thought' — yes; 'school of "
                "polymers' — no. Polymer chemistry uses 'family', not 'school'. "
                "Step 5's plug-and-test catches the wrong collocation."
            ),
        },
    ],
    "technique": (
        "On cloze nouns in 'a _____ of [chemicals/compounds/proteins]' "
        "collocations, the answer is almost always 'family' or 'class' — those "
        "are the standard scientific grouping nouns. Familiarity with the "
        "register beats word-by-word translation."
    ),
    "pitfall": (
        "Industrial-production nouns (factory, shop) bait readers when a "
        "passage is about manufacturing applications. The gap is asking for a "
        "TAXONOMIC group, not a production site. Read the syntactic frame "
        "('a __ of polymers') and ask what slot it opens."
    ),
})


save(entries)


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-036 — Science Education, "What are we told in the first paragraph?", C
# Negative views by kindergarten; barely a third show knowledge; girls already
# less interested. Gender appears at an early age.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-036"] = wrap({
    "solution_path": (
        "The first paragraph notes that 'even before first grade, fewer girls "
        "than boys say they like science' — and lists other early signals "
        "(white-coated-men drawings, kindergartners saying science isn't for "
        "them). Gender attitudes show up early. Answer C."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'What are we told in the first paragraph?' restricts your "
                "search to paragraph one. You need a claim the passage makes "
                "there, paraphrased into one of the options."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the first paragraph's claims",
            "text": (
                "First paragraph: kindergartners 'are already forming negative "
                "views about science'; 'barely a third of the children showed "
                "any knowledge of science'; 'many children said that science "
                "was for older kids and adults, not kindergartners like them'; "
                "'ask a room of five-year-olds to draw a scientist, and you "
                "will likely get lots of pictures of white-coated men in "
                "laboratories'; 'even before first grade, fewer girls than "
                "boys say they like science.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "Even at five years old, children have already taken on "
                "ideas about science — many say it isn't for them, they "
                "picture scientists as white-coated men, and girls in "
                "particular already report less interest than boys. Gender "
                "patterns and other biases set in before formal school "
                "starts."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Negative views' = unfavourable opinions. 'Cast a shadow "
                "across' = darken / set a lasting bad tone for. 'Even before "
                "first grade' = already at kindergarten age, before formal "
                "school. 'White-coated men' = a gendered, stereotyped image of "
                "scientists. The paragraph's loudest single claim is the "
                "gendered one — girls already saying they like science less."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says science has for some time been part of the kindergarten "
                "curriculum — the paragraph says science gets 'short shrift' in "
                "most classrooms; the opposite. B says young children look "
                "forward to science in higher grades — the paragraph says they "
                "form NEGATIVE views; the opposite again. C says gender appears "
                "to come into play at an early age as regards views on science "
                "— exactly the 'fewer girls than boys say they like science "
                "before first grade' point. D says young children today are "
                "more updated on science than previous generations — the "
                "passage gives no generational comparison."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The paragraph names early gender divergence "
                "in attitudes toward science as one of its key signals — and "
                "C is the option that captures it."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "The paragraph talks at length about kindergartners and science, "
                "so it might feel like science is part of the curriculum."
            ),
            "why_wrong": (
                "The paragraph says science gets 'short shrift' in most "
                "classrooms — meaning very little time and attention. That's "
                "the opposite of an established curriculum. Step 2's locate "
                "catches the negation."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Hopeful default: young kids look forward to science in higher "
                "grades — it's a soft, optimistic claim."
            ),
            "why_wrong": (
                "The paragraph describes children forming NEGATIVE views early "
                "— the opposite of looking forward. Step 3's paraphrase pins "
                "the negativity."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Generational-progress framing is a common education narrative "
                "and might feel like a reasonable thing to be told."
            ),
            "why_wrong": (
                "The paragraph makes NO comparison between today's children "
                "and previous generations — it describes current attitudes "
                "without time-comparison data. Step 5's option scan catches "
                "the absent claim."
            ),
        },
    ],
    "technique": (
        "On 'what are we told in paragraph X' items, list the paragraph's "
        "actual claims first, then match. The correct option restates ONE "
        "of those claims; wrong options either invert a claim or add one "
        "the paragraph never makes."
    ),
    "pitfall": (
        "When a paragraph offers a list of related observations, distractors "
        "often pluck a single related-but-absent claim ('children today are "
        "more updated'). Check whether each option's claim is in your list "
        "from Step 2."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-037 — Science Education, language ability statement, B
# Language learning is enhanced by AUTHENTIC use — recording and reporting
# predictions and observations, used for a 'genuine purpose'.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-037"] = wrap({
    "solution_path": (
        "The passage says the Purdue approach enhances language learning by "
        "providing 'situations in which written language is used for a genuine "
        "purpose — recording and reporting predictions and observations'. "
        "Language ability is best promoted by use in authentic communication. "
        "Answer B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'Which statement about language ability is true, according to "
                "the text? It is best promoted…' — you're completing a sentence "
                "with the option that the passage backs. Find the passage's "
                "claim about WHEN or HOW language is learned best."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentence",
            "text": (
                "Second paragraph: 'It also enhances language learning by "
                "providing situations in which written language is used for a "
                "genuine purpose – recording and reporting predictions and "
                "observations – instead of a task devoid…' The Purdue approach "
                "boosts language learning because the writing actually serves a "
                "REAL goal (science observation), not an artificial exercise."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "Language ability grows when language is used for something "
                "real — not as a textbook exercise but as part of doing actual "
                "work (here, science observation and reporting). Real-purpose "
                "use = authentic communication."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Genuine purpose' = a real reason, not an artificial one. "
                "'Devoid' (cut off in the passage) = lacking, empty of. "
                "'Authentic communication' = real, meaningful exchange — same "
                "idea as 'genuine purpose'. The passage's frame: language thrives "
                "when it has a job to do."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says best promoted in the safe environment of the home — the "
                "passage describes a school programme, not home learning. B says "
                "by use in authentic communication — direct paraphrase of "
                "'written language is used for a genuine purpose'. C says by "
                "concentrating on vocabulary — the passage's example is reporting "
                "predictions and observations, a USE-based approach, not "
                "vocabulary drill. D says in a conventional educational setting "
                "— the passage praises an UNCONVENTIONAL integration of language "
                "with science, not the conventional alternative."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The passage's mechanism is explicit: "
                "language learning is enhanced when writing serves a real "
                "purpose — that's authentic communication."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "If you remember 'safe environment' as a positive language-"
                "learning frame, home pops up as a natural setting."
            ),
            "why_wrong": (
                "The passage is about a CLASSROOM programme at Purdue — there's "
                "no home-learning claim. Step 2's locate-the-sentence keeps the "
                "context in school."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Vocabulary is a classic language-ability ingredient, and "
                "language-instruction options often reach for it."
            ),
            "why_wrong": (
                "The passage's mechanism is USE-IN-CONTEXT (recording, "
                "reporting), not vocabulary drilling. Step 3's paraphrase "
                "centres the use, not the lexicon."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on a language-learning question is to credit "
                "conventional schooling — that's where most language teaching "
                "happens."
            ),
            "why_wrong": (
                "The passage's whole point is that the Purdue approach BEATS "
                "conventional language classes by integrating science. Step 5 "
                "catches the contrast — conventional is the foil, not the "
                "answer."
            ),
        },
    ],
    "technique": (
        "On 'which statement about X is true' items, find the passage's "
        "explicit causal or mechanistic claim about X ('enhances by…', "
        "'depends on…', 'best when…') and match. The wording of the option "
        "is often more abstract ('authentic communication') than the "
        "passage's wording ('genuine purpose') — translate before matching."
    ),
    "pitfall": (
        "Default education-research options (vocabulary focus, conventional "
        "settings) feel right because they show up so often in other "
        "passages. Anchor on this passage's specific mechanism, not on the "
        "genre's typical answers."
    ),
})


save(entries)


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-038 — Science Ed, "What are we told about the Purdue approach?", D
# 'experiments as simple as seeing if salt will dissolve, reading well-chosen
# non-fiction books'… 'Low-tech methods suffice'. Focus on everyday phenomena.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-038"] = wrap({
    "solution_path": (
        "The passage describes the Purdue Scientific Literacy Project as using "
        "experiments 'as simple as seeing if salt will dissolve' and 'low-tech "
        "methods' — not expensive equipment, not animations or games. The focus "
        "is on everyday phenomena. Answer D."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'What are we told about the Purdue approach?' is a "
                "direct-info question — find what the passage explicitly says "
                "about the project's method and pick the matching option."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the description",
            "text": (
                "'The Purdue approach, the Scientific Literacy Project, "
                "introduces children to the most fundamental idea – that "
                "science is about carefully conducted inquiry to learn about "
                "the world. The lessons do not depend on expensive equipment "
                "or the latest in animations and computer games. Low-tech "
                "methods suffice, including experiments as simple as seeing "
                "if salt will dissolve, reading well-chosen non-fiction books "
                "– which many adults mistakenly imagine to be inappropriate "
                "or uninteresting to such young children – and maintaining "
                "individual science journals.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "Purdue's project uses cheap, hands-on, everyday science — "
                "salt dissolving, simple observations, science journals — "
                "and avoids fancy gear or computer animations. It teaches "
                "kids that science is about asking real questions about the "
                "world around them."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Low-tech' = not high-tech, no expensive equipment. 'Inquiry' "
                "= asking questions, investigation. 'Well-chosen non-fiction' "
                "= carefully selected real-world reading. 'Everyday "
                "phenomena' (option D) = ordinary, day-to-day events — "
                "exactly what salt-dissolving and similar experiments tap into."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says many of the books used are regular adult books on "
                "science — the passage says 'well-chosen non-fiction books… "
                "which many adults mistakenly imagine to be inappropriate'; "
                "they are CHILDREN'S non-fiction, not regular adult science "
                "books. B says much of the work is done in high-tech "
                "laboratories — the passage explicitly says 'low-tech methods "
                "suffice'. C says it succeeds because children are familiar "
                "with computer games — the passage RULES OUT 'the latest in "
                "animations and computer games'. D says the focus is on "
                "everyday scientific phenomena — exactly the salt-dissolving, "
                "low-tech, hands-on description."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The Purdue method's signature is "
                "low-tech, everyday experiments — salt dissolving is the "
                "canonical example."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "'Reading well-chosen non-fiction books' might be misread as "
                "borrowing from adult-level science reading."
            ),
            "why_wrong": (
                "The passage explicitly notes that ADULTS mistakenly think these "
                "books are inappropriate for young children — meaning they are "
                "CHILDREN'S non-fiction, age-appropriate. Step 2's locate quotes "
                "the explicit framing."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at 'Purdue' (a research university) and assume the "
                "project involves university labs."
            ),
            "why_wrong": (
                "The passage's own words — 'low-tech methods suffice' — close "
                "the high-tech-lab reading off completely. Step 4's gloss of "
                "'low-tech' settles it."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Computer games and animations are mentioned right next to "
                "Purdue, so a quick scan might pair them positively."
            ),
            "why_wrong": (
                "The passage mentions them only to say the lessons DO NOT "
                "depend on them — the opposite of the success-via-games claim "
                "in C. Step 5's option scan catches the negation."
            ),
        },
    ],
    "technique": (
        "On 'what are we told about X' items where X is a named project or "
        "approach, find the passage's defining sentence ('the X approach is "
        "about…', 'X consists of…') and then check the FOIL sentences ('the "
        "lessons do NOT depend on…'). Distractors very often promote a foil "
        "to a feature."
    ),
    "pitfall": (
        "When a passage names what something is NOT (no computer games, no "
        "expensive equipment), distractors recycle exactly those forbidden "
        "features as if they were core. Read the negations carefully."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-039 — Science Ed, National Research Council, A
# NRC standards stress science as inquiry and a few fundamental concepts
# AHEAD of the traditional smattering of content knowledge — a new pedagogy
# to raise students' engagement.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-039"] = wrap({
    "solution_path": (
        "The passage says the National Research Council's standards 'stress "
        "science as inquiry and grasp of a few fundamental concepts, ahead of "
        "the more traditional focus on a wide smattering of content knowledge'. "
        "That's a new pedagogical approach aimed at raising engagement. "
        "Answer A."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'What is said about the National Research Council?' — find "
                "the sentence(s) about the NRC and pick the option that "
                "summarises its position."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the NRC paragraph",
            "text": (
                "'An emphasis on “inquiry science” has long been advocated by the "
                "National Research Council, whose national science education "
                "standards stress science as inquiry and grasp of a few "
                "fundamental concepts, ahead of the more traditional focus on a "
                "wide smattering of content knowledge.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "The NRC has long pushed for teaching science as INQUIRY (asking "
                "questions, doing experiments) and learning a few BIG IDEAS — "
                "rather than the old way of cramming a little bit of everything. "
                "It's a pedagogy shift toward depth and engagement."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Advocated by' = pushed for, championed by. 'Inquiry science' "
                "= science taught as investigation rather than fact memorisation. "
                "'Smattering' = a superficial, scattered amount. 'Fundamental "
                "concepts' = core ideas. 'Pedagogical methods' (option A) = "
                "teaching methods — what the NRC's standards prescribe."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says NRC wants to raise students' interest through new "
                "pedagogical methods — 'inquiry-based learning, depth over "
                "breadth' is the new pedagogy, and the passage frames it as the "
                "antidote to the demotivating traditional approach. B says NRC "
                "wants to maintain the traditional view — the passage says they "
                "push the inquiry alternative AHEAD of the traditional approach. "
                "C says NRC initiated the Purdue Approach — the passage says NRC "
                "has long ADVOCATED inquiry science, but it doesn't credit them "
                "with starting Purdue's specific project. D says NRC ignores the "
                "complexity — the passage notes the approach 'depends on' "
                "instructors understanding inquiry-based lessons, so the NRC "
                "is aware of the difficulty."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. The NRC's standards swap content-cramming for "
                "inquiry — a deliberate pedagogical shift to make science "
                "education more engaging and meaningful."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "B",
            "why_tempting": (
                "'Long advocated' might be misread as 'long-standing, "
                "traditional' — a council advocating something for a long time "
                "feels conservative."
            ),
            "why_wrong": (
                "'Long advocated' refers to how long the NRC has championed the "
                "NEW approach, not to defending the old. The standards put "
                "inquiry AHEAD of traditional content-cramming. Step 2's locate "
                "shows the explicit reversal."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "The NRC and the Purdue project both push inquiry science, so "
                "it's tempting to credit one as the founder of the other."
            ),
            "why_wrong": (
                "The passage treats them as separate things — the NRC advocates "
                "inquiry generally; Purdue developed a specific kindergarten "
                "project. No initiation link is stated. Step 5 catches the "
                "absent claim."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "'It is not enough to give them courses to bolster their "
                "science content knowledge' could be misread as the NRC "
                "underestimating complexity."
            ),
            "why_wrong": (
                "That sentence is the author's gloss on what the NRC approach "
                "DEMANDS — it acknowledges the complexity of teacher training, "
                "not ignores it. The NRC's whole point is the depth-over-breadth "
                "design. Step 3's paraphrase keeps the NRC on the right side of "
                "the complexity."
            ),
        },
    ],
    "technique": (
        "On 'what is said about [organisation/figure]' items, find the "
        "passage's verb attached to that organisation ('advocates', "
        "'stresses', 'opposes') and reconstruct their position from it. The "
        "correct option restates the position; distractors flip the verb's "
        "polarity or reassign the position to a different actor."
    ),
    "pitfall": (
        "'Long advocated' is the trap phrase — it does NOT mean 'has long "
        "kept the same conservative view'. It means 'has championed for a "
        "long time' — and what they've championed is the NEW pedagogy. "
        "Always check WHAT is being advocated."
    ),
})


# ─────────────────────────────────────────────────────────────────────────
# verb2-ELF-040 — Science Ed, conclusion regarding teaching of science, B
# Final paragraphs: teachers need training in HOW to teach science; not
# enough to bolster content knowledge or fast-track science graduates into
# teaching. Regular training is not sufficient.
# ─────────────────────────────────────────────────────────────────────────
entries["var-2013-verb2-ELF-040"] = wrap({
    "solution_path": (
        "The passage closes with 'The teachers need training in how to teach "
        "science. It is not enough to give them courses to bolster their "
        "science content knowledge – or to fast-track science graduates into "
        "teaching.' Conclusion: regular teacher training is not sufficient. "
        "Answer B."
    ),
    "steps": [
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "'What conclusion may be drawn from the text regarding the "
                "teaching of science?' — a synthesis question. Look at the "
                "passage's overall recommendation, especially the closing "
                "paragraphs where conclusions usually live."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the conclusion",
            "text": (
                "'The approach does, however, depend on the instructors "
                "understanding how to carry out inquiry-based lessons "
                "effectively. The teachers need training in how to teach "
                "science. It is not enough to give them courses to bolster "
                "their science content knowledge – or to fast-track science "
                "graduates into teaching with insufficient schooling in the "
                "science of how children learn.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Restate in plain English",
            "text": (
                "For science teaching to work, teachers need to understand "
                "HOW to teach science (pedagogy), not just KNOW science "
                "(content). Two failed shortcuts: piling on content courses "
                "for current teachers, and fast-tracking science graduates "
                "into classrooms without learning how children learn. So "
                "regular training isn't enough; pedagogy-specific training "
                "is required."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Inquiry-based lessons' = teaching that has students "
                "investigating, not just receiving facts. 'Bolster' = "
                "strengthen, reinforce. 'Fast-track' = speed up the usual "
                "process. 'Insufficient schooling' = not enough training. "
                "The passage's verdict word is 'not enough' — the heart of "
                "option B's 'is not sufficient'."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "A says university science students are needed as an extra "
                "resource at primary school — the passage warns AGAINST "
                "fast-tracking science graduates into teaching. B says "
                "regular teacher training is not sufficient for science "
                "teaching to be successful — direct paraphrase of 'It is "
                "not enough to give them courses to bolster… or to "
                "fast-track…'. C says NRC needs to offer special training "
                "sessions — the passage doesn't assign training duty to NRC; "
                "it just says training is needed. D says science should "
                "replace language instruction in kindergarten — the passage "
                "describes Purdue INTEGRATING the two; replacement would "
                "miss the point."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The passage's recommendation is that "
                "teaching science well requires specialised training in HOW "
                "to teach it — and that ordinary content-focused or "
                "fast-tracked training falls short."
            ),
            "tier": "essential",
        },
    ],
    "framework_id": None,
    "distractors": [
        {
            "letter": "A",
            "why_tempting": (
                "'Fast-track science graduates into teaching' is mentioned, so "
                "an option about university science students might look like a "
                "natural conclusion."
            ),
            "why_wrong": (
                "The passage names that idea only to REJECT it as inadequate "
                "('with insufficient schooling in the science of how children "
                "learn'). Step 2's locate shows the exact negation."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "The NRC is mentioned and could be imagined as the natural "
                "provider of teacher training."
            ),
            "why_wrong": (
                "The passage assigns the NRC the role of setting STANDARDS, "
                "not running training sessions — and no part of the text says "
                "the NRC should provide special training. Step 5's option scan "
                "catches the unwarranted reassignment."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snap reading equates 'integrating language and science' with "
                "'replacing language with science', so D feels like a kindred "
                "claim."
            ),
            "why_wrong": (
                "The Purdue model COMBINES the two; it never proposes to "
                "REPLACE language. Step 3's paraphrase keeps the integration "
                "intact. Replacement misreads the very mechanism the passage "
                "praises."
            ),
        },
    ],
    "technique": (
        "On 'what conclusion may be drawn' items, look for the passage's "
        "RECOMMENDATION word ('need', 'must', 'should', 'is not enough') in "
        "the closing paragraphs — that sentence almost always carries the "
        "conclusion. Match the option whose claim paraphrases that "
        "recommendation."
    ),
    "pitfall": (
        "Conclusion options often paraphrase fragments the passage uses as "
        "FOILS (fast-tracking science grads, replacing language). Always "
        "check whether the fragment is being recommended or rejected before "
        "matching."
    ),
})


save(entries)


print(f"wrote {len(entries)} entries to {OUT_PATH}")
