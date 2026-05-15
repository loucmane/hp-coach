"""Build Variant-C ELF explanations for host-2025.

20 ELF entries (verb1 031-040 comprehension; verb2 031-035 cloze, 036-040
comprehension). English throughout. 4-6 steps each, 3 distractors,
varied empathy openers, step cross-references in `why_wrong`.

Voice anchor: data/explanations/host-2014.json — Variant C ultra-granular.
Saves every 5 entries to audit/_regen/host-2025-elf.json.
"""
from __future__ import annotations
import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}

OUT = Path("audit/_regen/host-2025-elf.json")


def entry(
    solution_path: str,
    steps: list[dict],
    distractors: list[dict],
    technique: str,
    pitfall: str | None,
) -> dict:
    return {
        "_meta": META,
        "solution_path": solution_path,
        "steps": steps,
        "framework_id": None,
        "distractors": distractors,
        "technique": technique,
        "pitfall": pitfall,
    }


def s(n: int, title: str, text: str, tier: str = "essential") -> dict:
    return {"n": n, "title": title, "text": text, "tier": tier}


def d(letter: str, why_tempting: str, why_wrong: str) -> dict:
    return {"letter": letter, "why_tempting": why_tempting, "why_wrong": why_wrong}


# ── verb1-031 — Paper / Kurlansky's basic point — Answer A ────────────────
v1_031 = entry(
    solution_path=(
        "Kurlansky calls the 'inventions create social change' view a "
        "'technological fallacy' and replaces it with the opposite "
        "direction: 'the world changes first and tools stick if they meet "
        "its new needs.' Successful innovations are downstream of social "
        "shifts, not the cause of them — answer A."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt is 'What is Kurlansky's basic point?' — so you need "
          "the central CLAIM he is making, not a side detail he mentions. "
          "Basic-point questions reward you for finding the sentence that "
          "carries the author's thesis, then matching its direction."),
        s(2, "Locate in the passage",
          "Three short sentences carry the argument: 'The notion that "
          "inventions create social change is what he calls a \"technological "
          "fallacy.\" In his view, the world changes first and tools stick "
          "if they meet its new needs. The same goes for the digital tools "
          "of a potentially paperless age.'"),
        s(3, "Restate in plain English",
          "Kurlansky is flipping the usual story. The popular legend says: "
          "an invention (paper, the printing press, computers) APPEARS and "
          "then it CHANGES the world. Kurlansky says: society changes "
          "first, and inventions only catch on if they happen to fit those "
          "new needs. So inventions REFLECT social change; they don't "
          "drive it."),
        s(4, "Vocabulary check",
          "A 'fallacy' is a flawed belief that sounds true but isn't. "
          "'Technological fallacy' is Kurlansky's label for the wrong "
          "direction of causation — believing tech causes change when in "
          "fact change causes tech. 'Predates' means 'is older than'. "
          "'Stick' here means 'catch on, become widely used'.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'Successful innovations reflect societal "
          "developments' — matches Kurlansky's claim exactly: tools STICK "
          "(i.e. succeed) when they MEET (i.e. reflect) the world's new "
          "needs. B narrows the argument to Gutenberg's overrated status; "
          "Kurlansky attacks the whole framework, not one inventor. C is "
          "the very view Kurlansky is rejecting — the inventions-drive-"
          "change story. D picks up the chronology side-remark and "
          "promotes it into the main point."),
        s(6, "Conclusion",
          "The answer is A. Kurlansky's basic point is a reversal of "
          "causal direction: society changes first; successful inventions "
          "are the ones that fit that change."),
    ],
    distractors=[
        d("B",
          "It's easy to read the Gutenberg sentence — 'thanks largely to "
          "Gutenberg's invention of the printing press' — and assume "
          "Kurlansky is debunking Gutenberg's status specifically.",
          "Kurlansky doesn't argue about Gutenberg's importance one way "
          "or the other. Step 2 shows he attacks the GENERAL framework "
          "('inventions create social change'), not a single inventor's "
          "reputation."),
        d("C",
          "First instinct on 'the same goes for the digital tools of a "
          "potentially paperless age' is to read Kurlansky as endorsing "
          "the idea that computers will drive long-term change.",
          "He uses the digital example to EXTEND his anti-causal point, "
          "not to confirm it. Step 3's paraphrase makes this explicit: "
          "even digital tools reflect change, they don't drive it."),
        d("D",
          "Many stop at 'paper predates Cai Lun' and conclude the "
          "passage is correcting the Chinese origin story.",
          "The dating is a side observation Kurlansky uses in passing "
          "('not just because paper predates Cai Lun'). Step 5 shows the "
          "main point lives in the technological-fallacy sentences, not "
          "the chronology footnote."),
    ],
    technique=(
        "When a passage names a 'fallacy' or a 'myth' and then offers a "
        "correction, the correct answer almost always captures the "
        "DIRECTION of the correction. Trigger to memorise: spot the word "
        "'fallacy', 'myth', 'wrongly assumes' → read the very next "
        "sentence as the headline."
    ),
    pitfall=(
        "Vivid side-facts (paper predates Cai Lun, Gutenberg's press, "
        "paperless age) are bait. They tempt you to pick the option that "
        "names the most concrete image. The thesis lives in the abstract "
        "framing sentence, not the colourful example."
    ),
)


# ── verb1-032 — Ageing Athletes / main focus — Answer B ───────────────────
v1_032 = entry(
    solution_path=(
        "The passage hammers one idea: athletes peak professionally before "
        "they have matured personally — 'Professional and emotional "
        "maturity are wildly out of sync.' That mismatch between athletic "
        "and personal development is the main focus. Answer B."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks for the MAIN FOCUS of the text. With main-focus "
          "items, look for the single contrast or claim that holds the "
          "whole paragraph together — not a stray detail mentioned once."),
        s(2, "Locate the key sentences",
          "Two sentences carry the argument. The thesis: 'Professional "
          "and emotional maturity are wildly out of sync.' The "
          "consequence: 'By the time they've grown up, their careers are "
          "gone… Only when they retire do they become young again as "
          "they rejoin civilian time.'"),
        s(3, "Restate in plain English",
          "An athlete's career peaks while they are still young and "
          "emotionally unfinished. By the time they finally feel grown "
          "up — confident, mature, ready to make big decisions — the "
          "career is already over. Two clocks are running at different "
          "speeds: the sporting clock (fast) and the personal clock "
          "(normal)."),
        s(4, "Vocabulary check",
          "'Played out in fast-forward' = compressed into a short time. "
          "'Out of sync' = not aligned, mismatched in timing. 'Civilian "
          "time' = ordinary, non-athlete life. 'Maturity' here covers "
          "both professional readiness (decisions, power) and emotional "
          "readiness (confidence outside sport).",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'attitude of society towards retired "
          "athletes' — the passage never discusses what society thinks; "
          "it's about the athlete's internal timeline. B 'mismatch "
          "between athletic and personal development' — exact paraphrase "
          "of 'professional and emotional maturity are wildly out of "
          "sync.' C 'difficulty finding alternative careers' — the text "
          "doesn't mention post-sport careers at all; it talks about "
          "rejoining 'civilian time'. D 'cult of youthfulness in sports' "
          "— the passage notes athletes are young, but doesn't critique "
          "any cultural worship of youth."),
        s(6, "Conclusion",
          "The answer is B. The whole paragraph is built around one "
          "out-of-sync relationship: sporting maturity arrives early, "
          "personal maturity arrives late."),
    ],
    distractors=[
        d("A",
          "If you remember 'only when they retire do they become young "
          "again', it's tempting to read the passage as being about how "
          "retired athletes are perceived.",
          "The 'civilian time' line is about the athlete's OWN sense of "
          "timing, not society's view of them. Step 5 shows the passage "
          "stays inside the athlete's experience throughout."),
        d("C",
          "Many stop at 'their careers are gone' and infer the passage "
          "must be about what comes next — finding a new career.",
          "The text never raises the question of post-sport employment. "
          "Step 3's paraphrase shows the focus is on the SIMULTANEITY "
          "problem during the career, not the aftermath."),
        d("D",
          "First instinct on 'still young', 'fast-forward', and "
          "'frighteningly early' is to assume this is a piece about "
          "society's obsession with youth in sport.",
          "The passage doesn't criticise any cultural worship of youth — "
          "it observes that the SPORT itself happens to mature people "
          "early. Step 2's thesis sentence is structural, not cultural."),
    ],
    technique=(
        "On 'main focus' items, scan for an abstract claim about a "
        "RELATIONSHIP between two things (here: professional vs. "
        "emotional maturity). That relationship is almost always the "
        "main focus. Concrete examples (early career, civilian time) are "
        "evidence for it, not the focus itself."
    ),
    pitfall=None,
)


# ── verb1-033 — Reading Abbey / first two paragraphs — Answer D ───────────
v1_033 = entry(
    solution_path=(
        "Paragraphs one and two complain that media attention 'focused "
        "chiefly on the possibility of finding the king's body, rather "
        "than on what we might learn from these investigations about the "
        "larger story of Reading Abbey.' The author is criticising a "
        "media tendency to fixate on individuals. Answer D."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks for the MAIN POINT of the FIRST TWO paragraphs "
          "about recent excavations. So you need the author's headline "
          "for those paragraphs specifically — not later sections."),
        s(2, "Locate the key sentence",
          "Paragraph two opens with the criticism: 'But it is rather a "
          "shame (though unsurprising) that media attention focused "
          "chiefly on the possibility of finding the king's body, rather "
          "than on what we might learn from these investigations about "
          "the larger story of Reading Abbey.' The 'searching for royal "
          "relics seems to be in vogue' sentence reinforces it."),
        s(3, "Restate in plain English",
          "The author is glad that Reading Abbey is being studied. But "
          "she is annoyed that journalists are obsessed with finding "
          "Henry I's bones, while ignoring the much more interesting "
          "history of the abbey itself. The same pattern — chasing royal "
          "remains — is happening at Winchester too. So this isn't a "
          "one-off; it's a media habit."),
        s(4, "Vocabulary check",
          "'Hot on the heels of' = shortly after, building on. 'In "
          "vogue' = currently fashionable. 'Royal relics' = the physical "
          "remains of kings. 'Unceremoniously jumbled up' = bones mixed "
          "together without proper care. 'Monastic site' = a place "
          "associated with monks and religious community.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'media even more excited about Henry I "
          "than Richard III' — wrong direction; the passage actually "
          "says Henry stirs LESS passion than Richard ('Henry I does "
          "not arouse such strong passions as Richard III'). B 'rarely "
          "been greater media interest in historical excavations' — too "
          "broad; the complaint is about WHICH excavations get covered, "
          "not how much excavation coverage exists. C 'media interest in "
          "Richard III died out quickly' — not stated; the passage notes "
          "controversies around his reburial but doesn't say interest "
          "faded. D 'tendency in the media to concentrate too much on "
          "historical individuals' — captures the central complaint: "
          "media fixates on kings' bodies rather than on the larger "
          "history of the sites."),
        s(6, "Conclusion",
          "The answer is D. The first two paragraphs frame a critique: "
          "the media is too narrowly focused on royal individuals at the "
          "expense of the broader institutional story."),
    ],
    distractors=[
        d("A",
          "It's easy to read 'hot on the heels of the finding of Richard "
          "III's body' as setting up a comparison in which Henry I "
          "generates even more interest than Richard.",
          "The text says the opposite a few lines down: 'Henry I does not "
          "arouse such strong passions as Richard III.' Step 5 catches "
          "this reversal — the comparison runs against A's direction."),
        d("B",
          "Many stop at 'much excitement', 'in vogue', and the run of "
          "named excavations (Richard III, Henry I, Alfred the Great, "
          "Cnut) and infer the headline is about overall volume of "
          "historical interest.",
          "The author isn't celebrating high interest — she's criticising "
          "WHERE the interest is focused. Step 3's paraphrase pins the "
          "complaint on focus, not volume."),
        d("C",
          "First instinct on 'controversies that surrounded Richard's "
          "reburial last year' is to read it as evidence that interest "
          "faded.",
          "Controversies during reburial aren't the same as dying "
          "interest. The text mentions them only to contrast with the "
          "expected mild reception for Henry. Step 2 shows the headline "
          "is media focus on kings, not the timeline of public attention."),
    ],
    technique=(
        "When a passage uses phrases like 'it is rather a shame', "
        "'unfortunately', or 'but', a critique is being set up. The "
        "correct answer for a main-point item on that section is "
        "almost always the substance of the critique."
    ),
    pitfall=(
        "Long passages with many named figures (Richard III, Henry I, "
        "Alfred, Cnut, Harthacnut, Ælfthryth, Æthelred) tempt you into "
        "picking an option that names one of them. The thesis lives in "
        "the author's framing about MEDIA BEHAVIOUR, not in the cast list."
    ),
)


# ── verb1-034 — History of Reading — Answer A ─────────────────────────────
v1_034 = entry(
    solution_path=(
        "The passage notes that 'a religious house for women was supposedly "
        "founded in Reading in the tenth century by Queen Ælfthryth' — "
        "more than a century before Henry I built the abbey in 1121. "
        "Reading had religious ties before the abbey. Answer A."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what is STATED about the history of Reading — "
          "so you're looking for a fact the passage explicitly gives, "
          "not an inference. Stated-fact questions reward careful "
          "matching to specific lines."),
        s(2, "Locate in the passage",
          "Two lines do the work. 'Henry is certainly an important part "
          "of Reading's history: he was the founder of the abbey, where "
          "he was buried — while it was still incomplete — after his "
          "death in 1135.' Then: 'But the monastic history of the town "
          "precedes him by more than a century: a religious house for "
          "women was supposedly founded in Reading in the tenth century "
          "by Queen Ælfthryth, mother of Æthelred the Unready.'"),
        s(3, "Restate in plain English",
          "Henry I founded the abbey in the early 1100s. But Reading "
          "already had a religious house — a community for women — "
          "founded in the 900s, more than a hundred years before Henry's "
          "abbey. So the town's religious story starts BEFORE the abbey, "
          "not WITH the abbey."),
        s(4, "Vocabulary check",
          "'Monastic history' = the history of monastic (monk/nun) "
          "communities. 'Religious house' = a monastery or convent. "
          "'Precedes' = comes before in time. 'Founded' = established, "
          "started.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'Reading had religious ties before the "
          "foundation of the abbey' — exact match with the tenth-century "
          "religious-house line. B 'Reading's origin coincided with the "
          "rule of Henry I' — the passage never claims Reading itself "
          "originated under Henry; only the abbey did. C 'Reading's "
          "religious connection was strong but curiously short-lived' — "
          "the text says the abbey lasted '400 years after Henry's "
          "time'; that's not short-lived. D 'Reading Abbey took almost "
          "500 years to complete' — confuses 'lasted 400 years AFTER "
          "Henry' with the time to BUILD it; the passage says it was "
          "'still incomplete' at Henry's death in 1135, but never gives "
          "a build duration."),
        s(6, "Conclusion",
          "The answer is A. Reading's religious connection dates from "
          "the tenth century, more than a century before Henry I founded "
          "the abbey in the twelfth."),
    ],
    distractors=[
        d("B",
          "If you remember 'Henry is certainly an important part of "
          "Reading's history' as the headline sentence, B feels close — "
          "Henry's reign and Reading's prominence go together.",
          "The passage carefully distinguishes Reading (the town) from "
          "Reading Abbey. Henry founded the abbey, not the town. Step 5 "
          "catches the slide between the two."),
        d("C",
          "Many stop at 'the last Abbot of Reading was hanged, drawn "
          "and quartered at his own abbey gate in 1539' and infer the "
          "religious connection ended abruptly.",
          "An abrupt END isn't the same as 'short-lived'. The abbey ran "
          "for four centuries; that's a long religious connection by any "
          "measure. Step 3's paraphrase keeps the duration straight."),
        d("D",
          "First instinct on 'where he was buried — while it was still "
          "incomplete' is that a building still incomplete at the king's "
          "death must have taken a very long time to finish.",
          "The text doesn't give a finishing date for the abbey, just "
          "notes that institutional life continued for 400 years. "
          "Construction duration is never quantified. Step 5 flags this "
          "as imported information."),
    ],
    technique=(
        "On 'stated' items in dense historical passages, hunt for "
        "temporal markers ('precedes him by more than a century', "
        "'tenth century', '1135'). The correct answer usually names a "
        "specific temporal relationship the passage made explicit."
    ),
    pitfall=None,
)


# ── verb1-035 — Reading Abbey — Answer C ──────────────────────────────────
v1_035 = entry(
    solution_path=(
        "The passage closes its history of the abbey with a violent end: "
        "'a long and distinguished institutional history, which concluded "
        "violently when the last Abbot of Reading was hanged, drawn and "
        "quartered at his own abbey gate in 1539.' After several centuries, "
        "the abbey's history ended abruptly. Answer C."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what is SAID 'in relation to Reading Abbey' "
          "specifically — narrow your reading to the abbey itself (not "
          "Reading the town, not the medieval kings in general)."),
        s(2, "Locate in the passage",
          "The relevant line: 'a long and distinguished institutional "
          "history, which concluded violently when the last Abbot of "
          "Reading was hanged, drawn and quartered at his own abbey gate "
          "in 1539.' Earlier the text told us the abbey continued 'for "
          "400 years after Henry's time'."),
        s(3, "Restate in plain English",
          "Henry I founded the abbey in the 1120s. It functioned for "
          "around four hundred years. Then in 1539, the last abbot was "
          "executed at the gates of his own abbey — a sudden, violent "
          "end to centuries of institutional life. The 'long and "
          "distinguished history' didn't taper off; it was cut off."),
        s(4, "Vocabulary check",
          "'Concluded violently' = ended in violence. 'Hanged, drawn "
          "and quartered' = a brutal English execution method. 'Abbot' "
          "= the head of an abbey. 'Institutional history' = the history "
          "of the abbey AS an institution (a community with continuous "
          "function).",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'long line of kings have been buried "
          "there' — the passage mentions Henry I being buried at the "
          "abbey, but says nothing about a 'long line' of buried kings; "
          "in fact, the kings (Alfred, Cnut, etc.) named earlier are "
          "buried elsewhere (Winchester). B 'cultural rather than "
          "religious centre' — never claimed; the abbey is described as "
          "monastic and religious. C 'after several hundred years its "
          "history came to an abrupt end' — matches: 400 years of "
          "history concluded violently in 1539. D 'controversial "
          "attempts to find Henry I' — controversies are described for "
          "RICHARD III, not Henry I ('there is unlikely to be a repeat "
          "of the controversies that surrounded Richard's reburial')."),
        s(6, "Conclusion",
          "The answer is C. Four hundred years of monastic life ended "
          "with the violent execution of the last abbot — an abrupt end."),
    ],
    distractors=[
        d("A",
          "It's tempting to read 'he was the founder of the abbey, where "
          "he was buried' and pair it with the long list of medieval "
          "kings the passage names — Alfred, Cnut, Harthacnut — to infer "
          "many royal burials.",
          "Only Henry I is described as buried at Reading Abbey. The "
          "other kings are at Winchester. Step 5 keeps the geography "
          "separate."),
        d("B",
          "Many stop at 'the first polyphonic song surviving in English… "
          "was written down' at Reading Abbey and infer the abbey "
          "functioned primarily as a cultural centre.",
          "The song is mentioned as 'one particular highlight' inside an "
          "otherwise MONASTIC history. Step 2 pins the abbey's identity "
          "as religious; the cultural detail is a single bright spot, "
          "not the function."),
        d("D",
          "First instinct on 'controversies' and 'reburial' is to read "
          "the controversies as attaching to the upcoming Henry I dig.",
          "The controversies are explicitly attributed to RICHARD III, "
          "and the text predicts Henry's case will be quieter ('unlikely "
          "to be a repeat'). Step 5 catches the misattribution."),
    ],
    technique=(
        "When a passage describes a long institution and then names a "
        "specific year of violent rupture (here, 1539), the correct "
        "answer for a 'what is said' item usually packages BOTH the "
        "duration AND the manner of ending. Look for options that "
        "include both elements."
    ),
    pitfall=None,
)


# ── verb1-036 — Author's reflection at Abbey grounds — Answer B ───────────
v1_036 = entry(
    solution_path=(
        "Standing in the abbey grounds, the author describes the modern "
        "office towers as 'eerie' and 'just as expressive of the "
        "transitory nature of earthly wealth and power' as the medieval "
        "ruins beside them. The reflection is on the impermanence of "
        "human achievements. Answer B."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt completes a sentence: 'What is the author's "
          "reflection at the sight of the Abbey grounds? It provides …' "
          "So you need the SENTIMENT the author expresses while standing "
          "there, not a factual claim about the buildings."),
        s(2, "Locate in the passage",
          "Two sentences capture the reflection. 'I was struck by how "
          "ghostly and lifeless those tall buildings were, in their "
          "glittering glass emptiness, towering over the fragments of "
          "stone remaining from the abbey. They were more eerie than "
          "any medieval ruin could be and just as expressive (a medieval "
          "historian might think) of the transitory nature of earthly "
          "wealth and power.'"),
        s(3, "Restate in plain English",
          "The author stands on the abbey grounds. Modern office towers "
          "loom over a few stones left from a once-grand abbey. She "
          "feels how strange and empty the glass buildings look. Both "
          "the old ruins AND the new skyscrapers tell the same lesson: "
          "everything humans build — medieval abbeys, modern towers — "
          "eventually fades. Wealth and power don't last."),
        s(4, "Vocabulary check",
          "'Eerie' = strange in a way that feels unsettling, ghostly. "
          "'Transitory' = passing, not lasting. 'Earthly wealth and "
          "power' = worldly possessions and authority. 'Uncanny' = "
          "strangely familiar, unsettling. 'Impermanence' = the quality "
          "of not lasting forever.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'daunting example of the ruthlessness of "
          "medieval society' — never claimed; the violence is mentioned "
          "(the hanged abbot), but the author's reflection at the SIGHT "
          "of the grounds is about impermanence, not cruelty. B "
          "'uncanny reminder of the impermanence of human accomplishments' "
          "— matches 'eerie' + 'transitory nature of earthly wealth and "
          "power'. C 'encouraging sign of the possibilities of human "
          "collaboration' — wrong tone; the author calls the modern "
          "buildings 'ghostly and lifeless', not encouraging. D "
          "'striking parallel to the achievements of modern British "
          "society' — the parallel she draws is about DECLINE shared "
          "between old and new, not achievement."),
        s(6, "Conclusion",
          "The answer is B. The skyscraper-over-ruins image makes the "
          "author reflect on how nothing humans build lasts — an uncanny "
          "reminder of impermanence."),
    ],
    distractors=[
        d("A",
          "If you remember 'hanged, drawn and quartered' from a few "
          "lines earlier, it's easy to project medieval ruthlessness "
          "onto the author's reflection.",
          "The execution detail is part of the abbey's institutional "
          "history, not part of the author's reflection on the grounds. "
          "Step 2 isolates the reflective passage; it focuses on "
          "impermanence, not violence."),
        d("C",
          "Many stop at the contrast between medieval ruins and modern "
          "skyscrapers and read it as a story of progress and "
          "cooperation across centuries.",
          "The author describes the towers as 'ghostly and lifeless' "
          "with 'glittering glass emptiness' — language of hollowness, "
          "not collaboration. Step 5 catches the mismatched tone."),
        d("D",
          "First instinct on 'Reading's newest skyscraper was built in "
          "2009' is to read the author as celebrating modern British "
          "achievement next to medieval achievement.",
          "She immediately undercuts the skyscraper with the question "
          "'will it last centuries, decades, or just a few years?' The "
          "parallel is about shared MORTALITY, not shared achievement. "
          "Step 3's paraphrase pins the sentiment."),
    ],
    technique=(
        "When the prompt asks about an author's REFLECTION, mood words "
        "('eerie', 'ghostly', 'transitory') are decisive. Map those words "
        "to options before looking at content matches — the right option "
        "almost always matches the EMOTIONAL register the author sets."
    ),
    pitfall=None,
)


# ── verb1-037 — Henry of Huntingdon's epilogue — Answer C ─────────────────
v1_037 = entry(
    solution_path=(
        "Henry of Huntingdon stands in 1135 and looks back a thousand "
        "years and forward a thousand more, asking what survives of fame "
        "and why we 'torment our spirit in vain'. That's a philosophical "
        "meditation on mortality and the meaning of fame, not history or "
        "fantasy. Answer C."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks how Henry of Huntingdon's epilogue can be "
          "BEST CHARACTERIZED. So you're looking for the GENRE or NATURE "
          "of the writing, not its specific content."),
        s(2, "Locate in the passage",
          "The author summarises the epilogue: 'From his perspective in "
          "1135, he looks back to the year 135, and forward to 2135, to "
          "situate himself and the powerful people of his time within a "
          "considerably longer perspective.' Then quotes: 'If any of "
          "them strove to win fame, and no record of him now survives… "
          "why did the wretch torment his spirit in vain?' And: 'what "
          "gain has it been to us to have been great or famous? We had "
          "no fame at all, except in God.'"),
        s(3, "Restate in plain English",
          "Henry of Huntingdon stops writing history for a moment and "
          "starts thinking philosophically. He projects himself a "
          "thousand years into the past and a thousand into the future. "
          "He asks: of all the great men of the year 135, who is "
          "remembered today? Almost nobody. So why did they bother "
          "chasing fame? And what about us, in 1135 — will anyone "
          "remember US in 2135? It's a meditation on mortality, fame, "
          "and the limits of earthly achievement."),
        s(4, "Vocabulary check",
          "'Epilogue' = a closing reflection at the end of a work. "
          "'Strove to win fame' = struggled to become famous. 'Torment "
          "his spirit in vain' = exhaust his soul for nothing. 'A "
          "remarkable philosophical reflection' = a striking piece of "
          "abstract thinking about big questions (existence, meaning, "
          "mortality).",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'unusually accurate historical account' "
          "— the epilogue isn't reporting events; it's reflecting on "
          "them. B 'early example of fantasy literature' — looking "
          "forward to 2135 isn't fantasy; it's a thought experiment "
          "about time and memory. C 'remarkable philosophical reflection' "
          "— matches: the epilogue raises classic philosophical questions "
          "about fame, mortality, and meaning. D 'argument for respecting "
          "royal authority' — the epilogue does the opposite, levelling "
          "kings with everyone else who is forgotten."),
        s(6, "Conclusion",
          "The answer is C. Henry of Huntingdon's epilogue meditates on "
          "the vanity of fame and the brevity of life — a philosophical "
          "reflection, not history, fantasy, or royal endorsement."),
    ],
    distractors=[
        d("A",
          "It's easy to read 'the historian Henry of Huntingdon' and "
          "assume his epilogue is just more history-writing.",
          "Even historians break frame. The passage explicitly contrasts "
          "the epilogue with his main historical work, calling it a "
          "'memorable take' on questions about time. Step 3 catches the "
          "tonal shift."),
        d("B",
          "First instinct on 'forward to 2135' is to register the future "
          "projection as speculative fiction.",
          "Henry isn't imagining a future world; he's asking a "
          "philosophical question (will we be remembered?). Step 5 "
          "separates a thought experiment from narrative fantasy."),
        d("D",
          "If you remember 'the glorious and invincible Henry, king of "
          "the English' as the epilogue's opening, D looks like royal "
          "praise.",
          "That line is the SETUP — Henry immediately undercuts it by "
          "asking what survived of similarly 'glorious' men a thousand "
          "years before. Step 2 includes the full quote: 'We had no "
          "fame at all, except in God' — the opposite of royal "
          "endorsement."),
    ],
    technique=(
        "When a passage explicitly says someone is 'meditating' or "
        "'reflecting' or 'asking questions like…', the correct genre "
        "label is almost always 'philosophical reflection' rather than "
        "history, narrative, or rhetoric. Trigger: spot abstract "
        "questions about time, fame, mortality."
    ),
    pitfall=None,
)


# ── verb1-038 — Crop Protection / sonic shield — Answer C ─────────────────
v1_038 = entry(
    solution_path=(
        "The sonic-shield idea is to disrupt the birds' own communication: "
        "'biologists hypothesized that interrupting the conversation "
        "would increase birds' vigilance, leaving less time for loitering "
        "and dining.' Disturbing their focus on talking to each other is "
        "what protects the crops. Answer C."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what is SAID about crop protection — so you "
          "need an explicit claim the passage makes about how this "
          "method works."),
        s(2, "Locate the key sentences",
          "Two sentences carry the mechanism. 'Since birds vocalize to "
          "alert each other to predators and food sources, biologists "
          "hypothesized that interrupting the conversation would "
          "increase birds' vigilance, leaving less time for loitering "
          "and dining.' Plus the result: 'food patches subjected to "
          "eight hours of the so-called sonic net saw a 46 percent drop "
          "in bird presence.'"),
        s(3, "Restate in plain English",
          "Birds talk to each other — they call out warnings about "
          "predators and shout when they find food. The researchers "
          "play a buzzing noise that scrambles those calls. With their "
          "communication broken, the birds get nervous and watchful, "
          "so they don't relax and eat. Result: they leave the field "
          "alone. Forty-six percent fewer birds in test patches."),
        s(4, "Vocabulary check",
          "'Avian interlopers' = bird intruders. 'Sonic shield' / "
          "'sonic net' = a sound-based barrier. 'Vocalize' = make "
          "calls. 'Vigilance' = watchfulness. 'Loitering and dining' = "
          "hanging around and feeding. 'Pyrotechnics' = fireworks-like "
          "noise-makers used as deterrents.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'sending out recordings of birds' OWN "
          "warning signals' — the passage describes a 'directional "
          "buzzing noise', not the birds' own calls played back. B "
          "'about half as effective as harmful pesticides' — never "
          "stated; 46% refers to bird-presence drop, not a comparison "
          "with pesticide effectiveness. C 'effective method of "
          "protection is to disturb birds' focus on communication' — "
          "exact paraphrase of the hypothesis: interrupting the "
          "conversation increases vigilance. D 'bird calls effective for "
          "protection against insects' — not stated; this is about "
          "birds eating crops, not insects."),
        s(6, "Conclusion",
          "The answer is C. The sonic shield works by disrupting bird "
          "communication, which makes the birds too anxious to settle "
          "and feed."),
    ],
    distractors=[
        d("A",
          "It's easy to hear 'sonic shield' and 'birds vocalize to alert "
          "each other' and conflate the two: maybe the recording IS the "
          "birds' own alarm.",
          "The passage specifies 'a directional buzzing noise' — a "
          "synthetic interrupter, not playback of bird calls. Step 2 "
          "names the mechanism precisely; it's about masking the "
          "conversation, not amplifying it."),
        d("B",
          "Many stop at '46 percent drop' and the mention of 'poisons' "
          "and try to make the number into a comparative statistic.",
          "The 46% is bird presence vs. control groups — no number is "
          "given for pesticide effectiveness. Step 5 catches the "
          "imported comparison."),
        d("D",
          "First instinct on 'crop protection' is that crops need "
          "protection from pests in general, which could include insects.",
          "The whole passage discusses BIRDS as the pests ('avian "
          "interlopers', 'feathered pests'). Insects are never "
          "mentioned. Step 3's paraphrase keeps the target species "
          "clear."),
    ],
    technique=(
        "When a passage describes a NEW METHOD, look for the sentence "
        "starting with 'biologists hypothesized that…' or 'the idea is "
        "that…'. That sentence almost always paraphrases the correct "
        "answer for a how-does-it-work item."
    ),
    pitfall=None,
)


# ── verb1-039 — Mozambique — Answer C ─────────────────────────────────────
v1_039 = entry(
    solution_path=(
        "The passage lists positive drivers in sequence: 'Fertile land, a "
        "skyrocketing demand for soybeans and rice, and a government "
        "willing to cut big land deals', plus 'world-class coal and gas "
        "deposits' and 'massive infrastructure projects'. Several "
        "circumstances point to a promising future. Answer C."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what is CLAIMED about Mozambique — so look "
          "for the overall picture the paragraph paints, not a single "
          "side detail."),
        s(2, "Locate the key sentences",
          "The opening lists multiple advantages: 'Fertile land, a "
          "skyrocketing demand for soybeans and rice, and a government "
          "willing to cut big land deals, have put the former Portuguese "
          "colony of Mozambique at the center of the land rush sweeping "
          "the African continent.' Then: 'Recent discoveries of "
          "world-class coal and gas deposits in the north, as well as "
          "other mining and forestry concessions, are slowly changing "
          "its fortunes. Massive infrastructure projects are springing "
          "up.'"),
        s(3, "Restate in plain English",
          "Mozambique starts the passage as one of the poorest countries "
          "in the world. But several things are turning around at once: "
          "the land is fertile, global demand for its crops is soaring, "
          "the government is signing big deals, huge coal and gas "
          "deposits have been found, and infrastructure is being built. "
          "All of these together suggest the country's prospects are "
          "improving."),
        s(4, "Vocabulary check",
          "'Skyrocketing demand' = rapidly rising demand. 'Cut big land "
          "deals' = sign large agreements over land use. 'Stunted by "
          "malnutrition' = physical growth held back by lack of food. "
          "'Changing its fortunes' = improving its economic situation. "
          "'Curry favor with' = try to please someone for advantage.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'urgent need for extensive land reform' "
          "— not stated; the passage describes land deals being signed, "
          "not a call for reform. B 'long been exploited by international "
          "companies' — never claimed; the foreign loans are described "
          "as recent ('eager to curry favor'), not a long pattern. C "
          "'several circumstances indicate a promising future' — "
          "captures the list of positive drivers: fertile land + demand "
          "+ deals + minerals + infrastructure. D 'population unlikely "
          "to benefit from foreign investments' — never stated; the "
          "paragraph notes hardship (poverty, malnutrition) but doesn't "
          "predict the population WON'T benefit."),
        s(6, "Conclusion",
          "The answer is C. Multiple favourable circumstances stack up "
          "in the paragraph, all pointing in the same hopeful direction."),
    ],
    distractors=[
        d("A",
          "If you remember 'a government willing to cut big land deals', "
          "it can read as evidence of dysfunction that demands reform.",
          "The text frames the deals as drivers of OPPORTUNITY, not "
          "evidence of a broken system. Step 5 catches the projection — "
          "reform isn't mentioned anywhere."),
        d("B",
          "Many stop at 'former Portuguese colony' and 'foreign loans' "
          "and infer a long colonial-exploitation story.",
          "The Portuguese connection is named only as a historical fact, "
          "and the loans are recent. Step 3's paraphrase keeps the "
          "tense straight: this is a forward-looking paragraph, not a "
          "history of past exploitation."),
        d("D",
          "First instinct on 'almost half its children under five "
          "stunted by malnutrition' is to read the paragraph as warning "
          "that the people won't gain from the new wealth.",
          "The malnutrition line is the BEFORE picture; the rest of the "
          "paragraph describes the AFTER. Step 2 keeps both sides of "
          "the contrast visible — the passage doesn't predict who "
          "benefits, only that the country's fortunes are improving."),
    ],
    technique=(
        "When a paragraph opens with a SHORT LIST of positive drivers "
        "and then names additional favourable developments, the correct "
        "answer is usually a summary umbrella ('several circumstances "
        "indicate…'). Look for options that AGGREGATE rather than fixate "
        "on a single item."
    ),
    pitfall=None,
)


# ── verb1-040 — Silver Coins — Answer B ───────────────────────────────────
v1_040 = entry(
    solution_path=(
        "A coin found in Devon, dated 1652, was actually minted in the "
        "Massachusetts Bay Colony 'in the 1660s or 70s, when the colony "
        "understood it had no rights to mint coinage and backdated its "
        "issues.' Settlers worked around English law by backdating their "
        "currency. Answer B."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what can be CONCLUDED about 17th-century "
          "silver coins. Conclusion questions ask you to combine the "
          "stated facts into a single inference the passage clearly "
          "supports."),
        s(2, "Locate in the passage",
          "The key sentence: 'It probably dates from the 1660s or 70s, "
          "when the colony understood it had no rights to mint coinage "
          "and backdated its issues.' Plus: 'all presumed to have been "
          "brought home by sailors and merchants.'"),
        s(3, "Restate in plain English",
          "A silver coin says '1652' on it. But it wasn't actually made "
          "in 1652 — and it wasn't made in England. It was struck in "
          "Massachusetts about twenty years later, when the colonists "
          "knew they weren't legally allowed to mint coins. So they "
          "made the coins anyway and stamped them with an older date "
          "(1652), which was a window when minting had been temporarily "
          "tolerated. A workaround for an English ban."),
        s(4, "Vocabulary check",
          "'Backdated' = stamped with an earlier date than when actually "
          "produced. 'Minted' = produced (as coins). 'Massachusetts Bay "
          "Colony' = an English settlement in colonial North America. "
          "'Detectorist' = someone who searches for metal objects with "
          "a metal detector. 'Bypass' = get around, evade.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'English merchants directly involved in "
          "illegal activities' — the passage says merchants brought the "
          "coins HOME, but doesn't say they participated in the illegal "
          "minting. B 'Settlers in North America found ingenious ways "
          "to bypass English laws' — exact match: the colonists knew "
          "they had no minting rights and used backdating to mint "
          "anyway. C 'produced in a remote part of southern England' — "
          "wrong direction; the passage says the coin was 'first from "
          "the south-west of England' as a FIND, not as the place of "
          "production (production was in Massachusetts). D 'twopenny "
          "coins are apparently older than their markings suggest' — "
          "reversed: the coins are actually YOUNGER than their stamped "
          "date, because the date was backdated."),
        s(6, "Conclusion",
          "The answer is B. The backdating trick is a textbook example "
          "of settlers cleverly working around the English ban on "
          "colonial minting."),
    ],
    distractors=[
        d("A",
          "It's tempting to combine 'illegal minting' with 'brought home "
          "by sailors and merchants' and conclude the merchants were "
          "active accomplices in the illegality.",
          "Transporting an existing coin home isn't the same as "
          "producing it illegally. The mint operated in Massachusetts; "
          "the merchants are described only as carriers. Step 5 keeps "
          "production and transport separate."),
        d("C",
          "If you remember 'the first from the south-west of England', "
          "it's easy to read 'south-west of England' as the place of "
          "PRODUCTION rather than the place of FINDING.",
          "The south-west of England is where the coin was FOUND today "
          "by the detectorist. The coin was MINTED in Massachusetts. "
          "Step 3's paraphrase splits the two locations."),
        d("D",
          "First instinct on 'apparently older than… markings' is to "
          "match it directly to '1652' on the coin and to its actual "
          "1660s–70s origin.",
          "The direction is flipped. The coin is YOUNGER than its "
          "stamped 1652 date (made in the 1660s–70s, dated as if 1652). "
          "Step 4's vocabulary check on 'backdated' nails it."),
    ],
    technique=(
        "When a passage tells you a date is on an object AND the actual "
        "production happened later, the magic word is 'backdated'. "
        "Conclusion options should match the DIRECTION of the discrepancy "
        "(coin is younger than its stamp, not older). Trigger: any "
        "explicit 'backdated' or 'predates' wording calls for a "
        "direction-of-time check."
    ),
    pitfall=(
        "Distractors often flip the direction (D says 'older than "
        "markings'; the truth is the opposite). Always re-state the "
        "direction in plain English before scanning options: 'the coin "
        "is YOUNGER than its date.'"
    ),
)


# ── verb2-031 — Cloze 'while' — Answer C ──────────────────────────────────
v2_031 = entry(
    solution_path=(
        "The clause '_____ about 80% of former students gained financially "
        "from attending university, 20% earned less' sets up a CONTRAST "
        "between two groups. 'While' is the contrast conjunction that "
        "fits — 'although' in a balanced sense. Answer C."
    ),
    steps=[
        s(1, "Understand the gap type",
          "This is a cloze item with four conjunctions: 'as', 'when', "
          "'while', 'since'. They all introduce a clause, so the choice "
          "depends on the LOGICAL RELATIONSHIP between the two halves of "
          "the sentence — cause, time, contrast, or condition."),
        s(2, "Read around the gap",
          "'Analysis by the Institute for Fiscal Studies (IFS) found that "
          "[31] about 80% of former students gained financially from "
          "attending university, 20% earned less than those with similar "
          "school results who did not attend.' Two statistics: 80% "
          "winners, 20% losers. The sentence is balancing them."),
        s(3, "Identify the relationship",
          "The clause needs a CONTRAST conjunction. The structure is "
          "'while X, Y' — 'while most gained, a minority lost'. Not "
          "causal (gaining doesn't CAUSE the others to lose), not "
          "temporal (no time relationship), not conditional. Just a "
          "balanced opposition."),
        s(4, "Vocabulary check",
          "'As' = either causal ('because') or simultaneous time. "
          "'When' = temporal ('at the time that'). 'While' = either "
          "simultaneous time OR contrast ('although') depending on "
          "context. 'Since' = causal ('because') or temporal ('from "
          "the time that'). Only 'while' carries the contrast meaning "
          "this sentence needs.",
          tier="detail"),
        s(5, "Plug and test",
          "A 'as about 80% gained, 20% earned less' — reads as 'because' "
          "or 'in proportion as'; doesn't fit the balanced contrast. B "
          "'when about 80% gained, 20% earned less' — temporal; "
          "suggests the 20% lost AT THE TIME the 80% gained, which is "
          "nonsense for a statistical contrast. C 'while about 80% "
          "gained, 20% earned less' — natural contrast: most won, but "
          "some lost. D 'since about 80% gained, 20% earned less' — "
          "causal; suggests the 80% gaining CAUSED the 20% to lose, "
          "which isn't the relationship."),
        s(6, "Conclusion",
          "The answer is C. 'While' is the right conjunction for "
          "balancing two contrasting statistics inside one finding."),
    ],
    distractors=[
        d("A",
          "It's easy to read 'as' as a flexible all-purpose conjunction "
          "and pick it when no other fits obviously.",
          "'As' here would read as 'because' or 'in proportion to', "
          "neither of which fits two coexisting percentages. Step 5's "
          "plug-test catches it — the sentence isn't causal."),
        d("B",
          "First instinct on a statistic-vs-statistic clause is to read "
          "the 80% and 20% as happening at the same time, which suggests "
          "a 'when' clause.",
          "'When' marks a temporal event, not a statistical breakdown. "
          "Step 4's gloss separates time-of from contrast-of."),
        d("D",
          "Many stop at 'about 80% gained financially' and read it as "
          "the cause of something — 'since most gained, …' — and that "
          "makes 'since' feel natural.",
          "The 20% earning less isn't a consequence of the 80% gaining; "
          "it's the other half of a single finding. Step 3 names the "
          "relationship as balanced contrast, not cause."),
    ],
    technique=(
        "On cloze conjunctions, name the LOGICAL RELATION before "
        "scanning the options: cause? time? contrast? condition? Then "
        "test only the conjunctions that carry that relation. Two "
        "balanced statistics in one sentence almost always need a "
        "contrast word."
    ),
    pitfall=(
        "'While' and 'as' both have multiple senses. Don't pick by "
        "what 'sounds English-y' — pick by which meaning of the word "
        "matches the relationship the sentence needs."
    ),
)


# ── verb2-032 — Cloze 'peers' — Answer D ──────────────────────────────────
v2_032 = entry(
    solution_path=(
        "The comparison group is 'their [____] who didn't enter higher "
        "education' — people of the same age and background as the "
        "graduates. 'Peers' captures that exactly. Answer D."
    ),
    steps=[
        s(1, "Understand the gap type",
          "This is a noun-choice cloze. Four nouns are offered: parents, "
          "rivals, siblings, peers. The right one names WHO the "
          "graduates are being compared to economically."),
        s(2, "Read around the gap",
          "'After accounting for taxes and student loans, men gained on "
          "average £130,000 and women £100,000 over their careers, "
          "compared with their [32] who didn't enter higher education.' "
          "The earlier sentence said the comparison is between "
          "graduates and 'non-graduates… with similar school results who "
          "did not attend.'"),
        s(3, "Identify the relationship",
          "The comparison group is people who SHARE THE GRADUATES' "
          "BACKGROUND but chose differently — same school results, same "
          "age cohort, no university. We need a word that means 'people "
          "of the same generation/standing'."),
        s(4, "Vocabulary check",
          "'Parents' = mother and father. 'Rivals' = competitors. "
          "'Siblings' = brothers and sisters. 'Peers' = people of equal "
          "status, age, or background — the standard sociological term "
          "for a comparison group of the same generation.",
          tier="detail"),
        s(5, "Plug and test",
          "A 'compared with their parents who didn't enter higher "
          "education' — wrong generation; we want same-age comparisons, "
          "not previous generation. B 'compared with their rivals' — "
          "'rivals' implies active competition; non-graduates aren't "
          "competitors of graduates in any defined contest. C 'compared "
          "with their siblings' — too narrow; the IFS study compares "
          "cohorts, not just brothers and sisters. D 'compared with "
          "their peers who didn't enter higher education' — perfect: "
          "same age, same background, different choice."),
        s(6, "Conclusion",
          "The answer is D. 'Peers' is the standard term for the "
          "matched comparison group used in this kind of earnings study."),
    ],
    distractors=[
        d("A",
          "If you remember 'lifetime earnings' and 'over their careers', "
          "it can feel like a generational comparison (graduates today "
          "vs. their parents' generation).",
          "The earlier sentence pins the comparison to people 'with "
          "similar school results who did not attend' — same cohort, "
          "not previous generation. Step 2's wider read catches this."),
        d("B",
          "It's tempting to read graduates and non-graduates as "
          "competitors for jobs and money, which would make 'rivals' "
          "fit.",
          "An economic comparison group isn't the same as a rivalry. "
          "Step 4's gloss separates statistical matching from "
          "antagonism."),
        d("C",
          "Many stop at the idea of comparing two paths in life and "
          "default to a family-comparison frame, hence 'siblings'.",
          "The IFS study compares COHORTS, not families. Step 3 names "
          "the comparison group as 'same school results, no university' "
          "— a peer group definition, not a sibling definition."),
    ],
    technique=(
        "When the surrounding sentence describes a CONTROLLED COMPARISON "
        "('similar school results who did not attend'), the missing noun "
        "is almost always 'peers'. Trigger: any phrase like 'with the "
        "same X but without Y' calls for a peer-group word."
    ),
    pitfall=None,
)


# ── verb2-033 — Cloze 'depending on' — Answer B ───────────────────────────
v2_033 = entry(
    solution_path=(
        "'The premium also differed _____ the subject studied' needs a "
        "phrase meaning 'varied according to'. 'Depending on' is the "
        "natural collocation with 'differed'. Answer B."
    ),
    steps=[
        s(1, "Understand the gap type",
          "This is a phrasal-verb cloze. All four options are two-word "
          "verb phrases that can follow a verb of difference. The right "
          "one names how the premium relates to the subject studied."),
        s(2, "Read around the gap",
          "'The premium also differed [33] the subject studied.' The "
          "earlier paragraph established that graduates from creative "
          "arts saw 'negative financial returns' while others gained. So "
          "the premium VARIES BY SUBJECT — the subject is the factor "
          "that changes the outcome."),
        s(3, "Identify the relationship",
          "The phrase needs to mean 'varied according to' or 'changed "
          "based on'. The subject studied isn't a topic referred to or "
          "a commitment — it's the VARIABLE that determines the size "
          "of the premium."),
        s(4, "Vocabulary check",
          "'Referring to' = mentioning, pointing at. 'Depending on' = "
          "varying according to. 'Committing to' = pledging oneself to. "
          "'Counting on' = relying on, expecting. Only 'depending on' "
          "names a relationship of VARIATION-BY-FACTOR.",
          tier="detail"),
        s(5, "Plug and test",
          "A 'differed referring to the subject studied' — 'referring "
          "to' means 'mentioning'; doesn't fit a statistical variation. "
          "B 'differed depending on the subject studied' — natural: "
          "premiums vary, and the subject is what they vary by. C "
          "'differed committing to the subject studied' — students "
          "commit to subjects, but premiums don't 'commit'; verbs don't "
          "match. D 'differed counting on the subject studied' — "
          "'counting on' means relying on; premiums don't rely on "
          "subjects in this sense."),
        s(6, "Conclusion",
          "The answer is B. 'Depending on' is the standard collocation "
          "for 'varied according to the factor of …'."),
    ],
    distractors=[
        d("A",
          "First instinct on 'differed [____] the subject' is that the "
          "premium might 'refer to' the subject in some way.",
          "'Refer to' means MENTION; a statistic doesn't refer to a "
          "subject, it varies by it. Step 4's gloss separates "
          "mentioning from depending."),
        d("C",
          "If you remember 'students commit to subjects', it's easy to "
          "carry that collocation over to the premium.",
          "The subject of 'differed' is THE PREMIUM, not the student. "
          "Premiums don't commit to anything. Step 5's plug-test "
          "isolates the grammatical subject."),
        d("D",
          "Many stop at 'graduate premium' and the idea of relying on "
          "future earnings, and 'counting on' feels economic.",
          "'Counting on' means 'relying on with expectation' (you count "
          "on a friend, on a paycheck). A premium doesn't 'count on' a "
          "subject; it varies with it. Step 3 separates dependence-on "
          "from reliance-on."),
    ],
    technique=(
        "On cloze items after a verb of variation ('differed', 'varied', "
        "'changed'), look for the phrase that means 'as a function of'. "
        "'Depending on' is the natural fit. Trigger: any preceding word "
        "for variation calls for a function-of phrase."
    ),
    pitfall=None,
)


# ── verb2-034 — Cloze 'prestige' — Answer C ───────────────────────────────
v2_034 = entry(
    solution_path=(
        "'It is no surprise our universities attract students from all "
        "over the world. That _____ is built on quality and my role is "
        "to safeguard that.' The noun refers back to the universities' "
        "international appeal — that is, their PRESTIGE. Answer C."
    ),
    steps=[
        s(1, "Understand the gap type",
          "This is a noun-substitution cloze. The word fills 'That "
          "_____' — a noun that summarises what the previous sentence "
          "said. The four options are 'effort', 'rumour', 'prestige', "
          "'issue'."),
        s(2, "Read around the gap",
          "Donelan's quote: 'It is no surprise our universities attract "
          "students from all over the world. That [34] is built on "
          "quality and my role is to safeguard that, while ensuring "
          "students and the taxpayer are getting the value they would "
          "expect for their investment.'"),
        s(3, "Identify the relationship",
          "The pronoun 'That' refers back to 'our universities attract "
          "students from all over the world.' Attracting students "
          "globally is a measure of REPUTATION / RENOWN. The noun in "
          "the blank summarises that international appeal in one word."),
        s(4, "Vocabulary check",
          "'Effort' = work, exertion. 'Rumour' = unverified gossip. "
          "'Prestige' = high reputation or social esteem, especially "
          "for excellence. 'Issue' = problem or topic. Only 'prestige' "
          "names a positive reputation that could 'be built on quality' "
          "and be 'safeguarded' by a minister.",
          tier="detail"),
        s(5, "Plug and test",
          "A 'That effort is built on quality' — 'effort' implies "
          "active work, not the standing the universities have earned. "
          "B 'That rumour is built on quality' — odd; 'rumour' is "
          "unverified and usually negative; a minister wouldn't claim "
          "to safeguard a rumour. C 'That prestige is built on quality' "
          "— natural: international appeal = prestige, which a "
          "minister safeguards. D 'That issue is built on quality' — "
          "'issue' implies a problem; the minister is praising "
          "universities, not naming a problem."),
        s(6, "Conclusion",
          "The answer is C. 'Prestige' is the one noun that captures "
          "the universities' international standing AND fits 'built on "
          "quality' AND can be 'safeguarded' by a minister."),
    ],
    distractors=[
        d("A",
          "It's tempting to read 'safeguard that, while ensuring… "
          "value' as the minister's WORK — and pick 'effort'.",
          "The pronoun 'That' refers back to the universities' appeal, "
          "not to the minister's own effort. Step 3 traces the "
          "referent: 'that' = 'attract students from all over the "
          "world'."),
        d("B",
          "If you read the minister's defensive tone — 'I'm concerned "
          "about value for money' — as a rebuttal, 'rumour' might fit "
          "a story being denied.",
          "There's no rumour being addressed; the sentence is "
          "POSITIVE: 'built on quality'. You don't build a rumour on "
          "quality. Step 4's gloss rules it out."),
        d("D",
          "Many stop at 'concerned about value for money' and read the "
          "whole quote as discussing a problem — hence 'issue'.",
          "The blank substitutes for the POSITIVE achievement (global "
          "attraction), not the concern that comes next. Step 2 keeps "
          "the antecedent visible: 'That' = international appeal."),
    ],
    technique=(
        "On cloze items where the blank fills 'That _____ is built on "
        "X', the noun is almost always a POSITIVE ABSTRACT NOUN "
        "(prestige, reputation, success). 'Built on' is a builder's "
        "metaphor — you build something valuable, not a problem."
    ),
    pitfall=None,
)


# ── verb2-035 — Cloze 'ignores' — Answer A ────────────────────────────────
v2_035 = entry(
    solution_path=(
        "Grady is criticising a NARROW lens — 'education is about much "
        "more than just financial benefit. Focusing on future income… "
        "_____ the wider benefits.' The verb names what that narrow "
        "focus DOES to the wider benefits — it IGNORES them. Answer A."
    ),
    steps=[
        s(1, "Understand the gap type",
          "This is a verb-choice cloze. Four verbs: ignores, confirms, "
          "rejects, includes. The right one names what 'focusing on "
          "future income' DOES to 'the wider benefits that education "
          "brings'."),
        s(2, "Read around the gap",
          "Grady: 'It is vital to recognise that education is about "
          "much more than just financial benefit. Focusing on future "
          "income following university [35] the wider benefits that "
          "education brings to individuals and to society.' The first "
          "sentence sets up the critique: education is MORE than money."),
        s(3, "Identify the relationship",
          "Grady is arguing that the financial-focus framing is "
          "INCOMPLETE — it leaves out the social and personal "
          "benefits. So the verb should describe LEAVING SOMETHING "
          "OUT, not confirming or actively rejecting it."),
        s(4, "Vocabulary check",
          "'Ignores' = fails to consider, leaves out. 'Confirms' = "
          "verifies, validates. 'Rejects' = actively refuses or "
          "dismisses. 'Includes' = takes into account. The action here "
          "is passive omission, not active dismissal — that points to "
          "'ignores'.",
          tier="detail"),
        s(5, "Plug and test",
          "A 'focusing on future income ignores the wider benefits' — "
          "natural critique: the narrow focus passes over what's "
          "broader. B 'confirms the wider benefits' — reversed; "
          "focusing on income doesn't VERIFY social benefits. C "
          "'rejects the wider benefits' — too active; the focus "
          "doesn't ACTIVELY refuse the wider benefits, it just leaves "
          "them out. D 'includes the wider benefits' — opposite of the "
          "critique; the whole point is that income-focus EXCLUDES "
          "them."),
        s(6, "Conclusion",
          "The answer is A. 'Ignores' captures the soft-omission Grady "
          "is criticising — narrow framing leaves the wider benefits "
          "unaddressed."),
    ],
    distractors=[
        d("B",
          "If you read 'wider benefits' and the gentle tone of Grady's "
          "quote, 'confirms' could feel like a polite acknowledgement.",
          "Grady's sentence is a CRITIQUE — 'much more than just "
          "financial benefit' — so the verb should be negative-toward "
          "the income focus, not validating. Step 3 names the "
          "relationship as critique."),
        d("C",
          "Left-to-right reading gives 'focusing on X rejects Y' as a "
          "clean opposition, which feels like the obvious critique.",
          "'Rejects' is too strong — it implies active dismissal. "
          "Income-focus doesn't dismiss social benefits; it simply "
          "fails to count them. Step 4's gloss separates passive "
          "omission from active refusal."),
        d("D",
          "Many stop at Grady's diplomatic register and pick "
          "'includes' as the neutral middle option.",
          "If the verb were 'includes', the whole sentence would "
          "contradict the previous one ('much more than just financial "
          "benefit'). Step 5's plug-test catches the contradiction."),
    ],
    technique=(
        "On cloze critiques, identify the SENTIMENT first: is the "
        "speaker accusing of OMISSION ('ignores', 'overlooks'), of "
        "ACTIVE REFUSAL ('rejects', 'denies'), or of FALSE INCLUSION "
        "('confuses', 'conflates')? Most critiques in academic English "
        "are omission critiques."),
    pitfall=None,
)


# ── verb2-036 — Cross-Cultural Psych / first paragraph — Answer A ─────────
v2_036 = entry(
    solution_path=(
        "The first paragraph names a debate: some say psychological "
        "phenomena are universal, but 'in recent decades some researchers "
        "have started questioning this approach, arguing that many "
        "psychological phenomena are shaped by the individual cultures.' "
        "The scope and nature of psych mechanisms are under debate. "
        "Answer A."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what is STATED in the FIRST paragraph — so "
          "stay inside paragraph one only. Don't reach for examples "
          "that appear later in the article."),
        s(2, "Locate in the passage",
          "Paragraph one names a contrast: 'Some would argue that "
          "[psychology] has been remarkably successful in understanding "
          "what drives human behavior and mental processes, which have "
          "long been thought to be universal. But in recent decades "
          "some researchers have started questioning this approach, "
          "arguing that many psychological phenomena are shaped by the "
          "individual cultures in which we live.'"),
        s(3, "Restate in plain English",
          "For a long time, psychologists assumed that the patterns "
          "they discovered applied to everyone, everywhere. Recently, "
          "though, some researchers have pushed back: maybe culture "
          "shapes the patterns, and what looks universal is actually "
          "Western. So there's an open debate about WHICH psychological "
          "patterns are truly universal and which are culture-specific."),
        s(4, "Vocabulary check",
          "'Psychological mechanisms' = the underlying processes "
          "(thinking, perception, memory, behaviour) that psychology "
          "studies. 'Universal' = the same everywhere, for everyone. "
          "'Scope and nature' = the extent and the character (how "
          "broadly they apply and what kind they are).",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'scope and nature of psychological "
          "mechanisms are being debated' — exact match for "
          "'questioning this approach' over universality vs. cultural "
          "shaping. B 'long-established methods… have now been "
          "discarded' — too strong; the paragraph notes researchers "
          "are QUESTIONING the assumption, not abandoning the methods. "
          "C 'claims about the Western origin of psychology… are "
          "dubious' — the paragraph says psychology was developed in "
          "North America and Europe (it accepts the Western origin); "
          "what's dubious is universality, not the origin. D 'some "
          "phenomena are not suited for scientific study' — never "
          "claimed; the debate is about cultural variation, not "
          "study-ability."),
        s(6, "Conclusion",
          "The answer is A. The first paragraph stages a debate about "
          "how broad and how universal psychological mechanisms really "
          "are."),
    ],
    distractors=[
        d("B",
          "If you read 'researchers have started questioning this "
          "approach' as 'researchers have abandoned the approach', B "
          "feels like a natural inference.",
          "Questioning is not discarding. The paragraph says the "
          "questioning is RECENT and ongoing — methods aren't gone. "
          "Step 3 distinguishes ongoing debate from completed change."),
        d("C",
          "It's tempting to read 'developed largely in North America "
          "and Europe' as the controversial claim being challenged.",
          "The Western origin is presented as a FACT in the first "
          "sentence, not as a dubious claim. What's challenged is the "
          "ASSUMPTION OF UNIVERSALITY of findings, not the origin. "
          "Step 2 keeps the two separate."),
        d("D",
          "Many stop at 'shaped by the individual cultures' and infer "
          "that culture-bound phenomena resist scientific study.",
          "The paragraph never claims any phenomenon is unstudyable; "
          "it claims SCOPE (where findings apply) is the live question. "
          "Step 5 catches the imported claim."),
    ],
    technique=(
        "When a first paragraph opens with 'some argue X, but recently "
        "others have questioned X', it is staging a DEBATE. The correct "
        "answer for 'what is stated' almost always uses the word "
        "'debated', 'questioned', or 'contested' — name the debate, "
        "don't pick a side."
    ),
    pitfall=None,
)


# ── verb2-037 — Experimental psychology / WEIRD — Answer A ────────────────
v2_037 = entry(
    solution_path=(
        "Henrich's 2010 study found 'more than 90 percent of participants "
        "in psychological studies come from… countries that are WEIRD' — "
        "and the paragraph explicitly says 'the people who live in these "
        "countries are not a random sample.' Experimental psych has "
        "relied on a much too narrow selection. Answer A."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks what is IMPLIED about experimental "
          "psychology. Implication questions want you to combine the "
          "stated facts into a conclusion the text clearly supports."),
        s(2, "Locate in the passage",
          "Two key claims. 'For decades, psychologists have "
          "disproportionately relied on undergraduate students to serve "
          "as subjects… simply because they are readily available to "
          "researchers at universities.' Then Henrich's finding: 'more "
          "than 90 percent of participants in psychological studies come "
          "from… countries that are WEIRD (Western, Educated, "
          "Industrialized, Rich, and Democratic). Clearly, the people "
          "who live in these countries are not a random sample.'"),
        s(3, "Restate in plain English",
          "Psychologists kept assuming their findings applied to all "
          "humans, but they were drawing almost all their subjects from "
          "a narrow pool: undergrads in wealthy Western countries. "
          "Ninety per cent of participants came from WEIRD societies. "
          "That's a tiny, biased slice of humanity. So the discipline "
          "has been built on a selection that's much too narrow."),
        s(4, "Vocabulary check",
          "'Disproportionately' = more than would be expected. "
          "'WEIRD' = Western, Educated, Industrialized, Rich, "
          "Democratic — a sampling frame coined to flag the bias. "
          "'Not a random sample' = not a representative cross-section "
          "of humanity.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'often relied on a much too narrow "
          "selection of subjects' — exact paraphrase of "
          "'disproportionately relied on undergraduate students' and "
          "'90 percent come from WEIRD countries'. B 'participants not "
          "always likely to be trustworthy' — the paragraph doesn't "
          "question subject honesty; it questions subject "
          "representativeness. C 'not focused on determining universal "
          "human behavior' — opposite of what's stated; psychologists "
          "ASSUMED their findings WERE universal. D 'deliberately "
          "rejected results based on less educated subjects' — the "
          "passage describes accidental over-reliance on the educated, "
          "not deliberate rejection of the less educated."),
        s(6, "Conclusion",
          "The answer is A. Experimental psychology has relied on a "
          "narrow, biased subject pool — exactly the implication of "
          "the WEIRD finding."),
    ],
    distractors=[
        d("B",
          "It's easy to read 'not a random sample' as 'the data isn't "
          "trustworthy', which slides into 'the participants aren't "
          "trustworthy'.",
          "Sample bias is about who you tested, not about whether they "
          "lied. Step 4's gloss on 'random sample' keeps the issue at "
          "selection, not honesty."),
        d("C",
          "Left-to-right reading gives 'mental processes… have long "
          "been thought to be universal' as if the discipline "
          "ABANDONED universalism.",
          "The paragraph says the universalist ASSUMPTION is what's "
          "being challenged, but for decades the discipline DID aim "
          "for universal claims. Step 5 inverts the temporal frame "
          "back to the right direction."),
        d("D",
          "Many stop at 'undergraduate students… readily available' "
          "and infer an active filtering policy in favour of educated "
          "subjects.",
          "The passage describes convenience sampling, not deliberate "
          "filtering. Undergrads were used because they were AVAILABLE, "
          "not because less-educated subjects were rejected. Step 3 "
          "makes the convenience-vs-policy distinction explicit."),
    ],
    technique=(
        "When a passage names a SAMPLING BIAS (90% from WEIRD "
        "countries), the implied critique is almost always about "
        "narrow representativeness. Trigger: 'not a random sample' or "
        "'disproportionately' calls for an answer that names the "
        "narrowness of the sample."
    ),
    pitfall=None,
)


# ── verb2-038 — Memory effects, Masuda & Nisbett — Answer C ───────────────
v2_038 = entry(
    solution_path=(
        "Masuda and Nisbett's follow-up found that Japanese participants "
        "recognised objects better in their ORIGINAL settings than in "
        "new ones, 'whereas this manipulation had relatively little "
        "effect on Americans.' Background changes affected one group "
        "(Japanese) much more than the other. Answer C."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks about MEMORY EFFECTS in the Masuda-Nisbett "
          "study — specifically how the two thinking styles differed in "
          "memory performance. Stay focused on the recall results, not "
          "the broader cultural argument."),
        s(2, "Locate the key sentences",
          "First test: both groups equally remembered SALIENT objects "
          "like big fish. Then 'the Japanese participants were better "
          "than the American participants at recalling background "
          "information, such as the color of the water.' Follow-up: "
          "'the Japanese participants \"recognized previously seen "
          "objects more accurately when they saw them in their "
          "original settings rather than in novel settings, whereas "
          "this manipulation had relatively little effect on Americans.\"'"),
        s(3, "Restate in plain English",
          "Japanese viewers remembered the SCENE around the object — "
          "the water colour, the plants, the context. So when you "
          "move an object to a NEW background, their recognition "
          "drops, because the original background was part of what "
          "they encoded. Americans only encoded the object itself; "
          "moving it didn't disturb them. The BACKGROUND change "
          "specifically hurt one group much more than the other."),
        s(4, "Vocabulary check",
          "'Salient objects' = the most noticeable, prominent objects. "
          "'Background information' = the surrounding context, not the "
          "main subject. 'Holistic thinking' = perceiving objects "
          "together with their context. 'Analytic thinking' = "
          "perceiving objects in isolation. 'Manipulation' here = the "
          "experimental change (new vs. original setting).",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'American subjects excelled when objects "
          "occurred in their original context' — reversed; it was "
          "JAPANESE who did better with original context, not "
          "Americans. B 'holistic thinking… more effective in all of "
          "the tests' — too sweeping; both groups did equally on "
          "salient objects. C 'background changes mainly affected one "
          "of the two participant groups' — matches: the new-setting "
          "manipulation hurt Japanese recognition; 'relatively little "
          "effect on Americans.' D 'Japanese subjects better at "
          "remembering objects out of context' — reversed; Japanese "
          "were BETTER IN context, not out of it."),
        s(6, "Conclusion",
          "The answer is C. The new-background manipulation specifically "
          "affected Japanese participants and barely touched Americans "
          "— an asymmetric effect."),
    ],
    distractors=[
        d("A",
          "If you remember 'excellent recall' and 'original settings' "
          "as a strength, it's tempting to attach the strength to the "
          "Americans (a familiar comparison group).",
          "The strength belongs to the JAPANESE participants — they "
          "did better with original settings. Step 2's quote pins the "
          "asymmetry to the Japanese group. The American performance "
          "was unaffected by the manipulation."),
        d("B",
          "First instinct on 'better than the American participants at "
          "recalling background' is to generalise holistic thinking as "
          "always superior.",
          "On SALIENT-object recall, the two groups were equal. "
          "Holistic thinking helped only on background-sensitive tasks. "
          "Step 3 keeps the two test conditions separate."),
        d("D",
          "Snapshot reading of 'recognized previously seen objects "
          "more accurately when they saw them in their original "
          "settings' can flip in your head to 'remembered objects out "
          "of context'.",
          "The direction is opposite: Japanese did better IN their "
          "original settings, worse in NOVEL settings. Step 5 sets the "
          "direction straight."),
    ],
    technique=(
        "When a study reports an ASYMMETRIC effect — manipulation X "
        "affects group A but not group B — the correct answer is "
        "almost always the option that NAMES the asymmetry. Watch for "
        "options that flip the direction of who benefited."
    ),
    pitfall=(
        "Dense methodological passages mix multiple test conditions. "
        "Pin down which finding corresponds to which manipulation "
        "(salient-object recall vs. context-change recognition) before "
        "matching options."
    ),
)


# ── verb2-039 — Conventional self-description — Answer D ──────────────────
v2_039 = entry(
    solution_path=(
        "Social psychologists have 'long maintained that people are much "
        "more likely to describe themselves and others in terms of "
        "stable personal characteristics than they are to describe "
        "themselves in terms of their preferences or relationships.' "
        "'I am quiet and shy' is a stable personal characteristic. "
        "Answer D."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks which option REPRESENTS what social "
          "psychologists have CONVENTIONALLY taken as the standard way "
          "to describe oneself. So you need the option that matches "
          "the conventional category — not the new culturally-variable "
          "view."),
        s(2, "Locate in the passage",
          "The text lists three possible self-descriptions: personal "
          "characteristics ('intelligent or funny'), preferences ('I "
          "love pizza'), and social relationships ('I am a parent'). "
          "Then: 'Social psychologists have long maintained that people "
          "are much more likely to describe themselves and others in "
          "terms of stable personal characteristics than they are to "
          "describe themselves in terms of their preferences or "
          "relationships.'"),
        s(3, "Restate in plain English",
          "Three flavours of self-description: (1) 'I am X' as a stable "
          "trait — quiet, intelligent, ambitious. (2) 'I like X' as a "
          "preference — I love pizza, I enjoy reading. (3) 'I am X' as "
          "a social relation — I am a parent, I come from a large "
          "family. Social psychologists traditionally said: people pick "
          "(1). The other two were considered secondary. So the "
          "'conventional' self-description is a TRAIT description."),
        s(4, "Vocabulary check",
          "'Stable personal characteristics' = lasting traits of "
          "personality or temperament (shy, kind, ambitious). "
          "'Preferences' = likes and dislikes (food, music, hobbies). "
          "'Social relationships' = how you connect to others (parent, "
          "sibling, friend). 'Self-construal' = how a person "
          "understands and describes themselves.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'I enjoy reading' — a PREFERENCE, not a "
          "stable trait. B 'I come from a large family' — a SOCIAL "
          "RELATIONSHIP / background fact, not a trait. C 'I want to "
          "become a teacher' — a GOAL or aspiration, not a stable "
          "current trait. D 'I am quiet and shy' — two stable personal "
          "characteristics; matches the conventional category."),
        s(6, "Conclusion",
          "The answer is D. 'Quiet and shy' is the textbook example of "
          "the trait-based self-description social psychology has long "
          "treated as conventional."),
    ],
    distractors=[
        d("A",
          "It's easy to skim the passage and remember 'I love pizza' as "
          "the example given by the author, then map 'I enjoy reading' "
          "onto the same slot.",
          "'I love pizza' / 'I enjoy reading' are PREFERENCES — the "
          "very category the passage says was treated as SECONDARY to "
          "stable traits. Step 3 keeps the three categories separate."),
        d("B",
          "Many stop at 'I am a parent' as a self-description example "
          "and assume any family-related answer fits the conventional "
          "frame.",
          "'I am a parent' / 'I come from a large family' are SOCIAL "
          "RELATIONSHIPS — also the secondary category. The "
          "conventional category is traits. Step 4's gloss separates "
          "relations from traits."),
        d("C",
          "First instinct on 'I want to become a teacher' is that "
          "career aspirations sound like the 'serious' kind of "
          "self-description psychology might endorse.",
          "An aspiration is a future goal, not a current stable trait. "
          "The passage's conventional category is about WHO YOU ARE "
          "NOW (quiet, shy, intelligent), not WHAT YOU WANT TO BECOME. "
          "Step 5 catches the time-frame mismatch."),
    ],
    technique=(
        "When a passage names three categories (traits, preferences, "
        "relationships) and identifies ONE as conventional, scan the "
        "options and assign each to a category. The correct option is "
        "the only one in the conventional category."
    ),
    pitfall=None,
)


# ── verb2-040 — Deviant behavior — Answer C ───────────────────────────────
v2_040 = entry(
    solution_path=(
        "The passage warns that the conceptual framework 'based on "
        "detecting deviant or nonnormative behaviors' isn't complete: "
        "'What may be seen as normal in one culture (for example "
        "modesty) could be seen as deviating from the norm in another.' "
        "Deviance is culture-specific. Answer C."
    ),
    steps=[
        s(1, "Understand the question",
          "The prompt asks for the MAIN POINT in the DISCUSSION OF "
          "'DEVIANT BEHAVIOR' — so narrow your attention to the final "
          "paragraph where mental health and deviance are discussed."),
        s(2, "Locate in the passage",
          "The relevant sentences: 'Because of the existence of "
          "cultural differences in behavior, the conceptual framework "
          "– based on detecting deviant or nonnormative behaviors – "
          "isn't complete. What may be seen as normal in one culture "
          "(for example modesty) could be seen as deviating from the "
          "norm in another, and might be treated as a disorder or a "
          "social phobia.'"),
        s(3, "Restate in plain English",
          "Mental health frameworks define disorders partly by spotting "
          "behaviour that breaks social norms — that's the 'deviance' "
          "approach. But what counts as breaking the norm changes "
          "culture by culture. Modesty might be a virtue in one place "
          "and a social phobia in another. So you can't define "
          "'deviant' without saying WHICH culture's norms you mean. "
          "Deviance is always relative to a specific cultural baseline."),
        s(4, "Vocabulary check",
          "'Deviant behavior' = behavior that departs from the social "
          "norm. 'Nonnormative' = not matching what is typical or "
          "expected. 'Modesty' = reserved, humble behavior. 'Social "
          "phobia' = a clinical anxiety disorder marked by fear of "
          "social situations. 'Conceptual framework' = the theoretical "
          "basis for how a discipline operates.",
          tier="detail"),
        s(5, "Match against the options",
          "Walk each option. A 'more difficult to detect in some "
          "cultures than in others' — the passage doesn't claim "
          "detection difficulty varies; it claims the DEFINITION "
          "varies. B 'rarely be distinguished from nonnormative "
          "behavior' — the two terms are used as near-synonyms in the "
          "passage, but the point isn't about distinguishing them — "
          "it's about cultural relativity. C 'can only be defined in "
          "the context of a specific culture' — exact match for "
          "'cultural differences' and 'seen as normal in one culture… "
          "deviating from the norm in another'. D 'more common in "
          "developed than in less developed countries' — never stated; "
          "the passage talks about cultural difference, not "
          "development level."),
        s(6, "Conclusion",
          "The answer is C. The deviance framework only makes sense "
          "INSIDE a particular culture's norms — outside that frame, "
          "the same behaviour could be called normal or even virtuous."),
    ],
    distractors=[
        d("A",
          "If you read 'isn't complete' as 'is hard to apply', A feels "
          "close — detection in different cultures might be tricky.",
          "The incompleteness isn't about DETECTION; it's about "
          "DEFINITION. The behaviour doesn't HIDE in some cultures — "
          "the label 'deviant' refuses to attach the same way across "
          "cultures. Step 3 separates spotting from defining."),
        d("B",
          "Many stop at the appositive 'deviant or nonnormative "
          "behaviors' and try to make the point about telling those "
          "two terms apart.",
          "The two terms are used together, but the passage's point "
          "isn't about distinguishing them — it's about how both "
          "depend on cultural baseline. Step 2 keeps the central claim "
          "visible: cultural variation in WHAT COUNTS AS deviant."),
        d("D",
          "If you remember 'WEIRD countries' (Western, Educated, "
          "Industrialized, Rich, Democratic) from earlier paragraphs, "
          "it's tempting to read the mental-health section as "
          "comparing developed and less developed nations.",
          "The passage in this paragraph contrasts CULTURES (Asia / "
          "Latin America / Africa vs. Europe / North America), not "
          "developed vs. less developed. Step 5 keeps the geographical "
          "frame culture-based, not development-based."),
    ],
    technique=(
        "When a passage says a concept 'isn't complete' or 'isn't "
        "universal' or 'depends on context', the correct answer for "
        "a main-point item almost always begins with 'can only be "
        "defined in the context of …' or 'depends on …'. Trigger: any "
        "explicit acknowledgement of incompleteness signals a "
        "context-dependence answer."
    ),
    pitfall=None,
)


# ── Assemble ──────────────────────────────────────────────────────────────
ENTRIES = [
    ("host-2025-verb1-ELF-031", v1_031),
    ("host-2025-verb1-ELF-032", v1_032),
    ("host-2025-verb1-ELF-033", v1_033),
    ("host-2025-verb1-ELF-034", v1_034),
    ("host-2025-verb1-ELF-035", v1_035),
    ("host-2025-verb1-ELF-036", v1_036),
    ("host-2025-verb1-ELF-037", v1_037),
    ("host-2025-verb1-ELF-038", v1_038),
    ("host-2025-verb1-ELF-039", v1_039),
    ("host-2025-verb1-ELF-040", v1_040),
    ("host-2025-verb2-ELF-031", v2_031),
    ("host-2025-verb2-ELF-032", v2_032),
    ("host-2025-verb2-ELF-033", v2_033),
    ("host-2025-verb2-ELF-034", v2_034),
    ("host-2025-verb2-ELF-035", v2_035),
    ("host-2025-verb2-ELF-036", v2_036),
    ("host-2025-verb2-ELF-037", v2_037),
    ("host-2025-verb2-ELF-038", v2_038),
    ("host-2025-verb2-ELF-039", v2_039),
    ("host-2025-verb2-ELF-040", v2_040),
]


def main() -> None:
    out: dict = {}
    for i, (qid, expl) in enumerate(ENTRIES, start=1):
        out[qid] = expl
        if i % 5 == 0:
            OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False, sort_keys=True))
            print(f"saved after {i} entries → {OUT}")
    # final write
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False, sort_keys=True))
    print(f"final save: {len(out)} entries → {OUT}")


if __name__ == "__main__":
    main()
