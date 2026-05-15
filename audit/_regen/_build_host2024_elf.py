"""Build host-2024 ELF Variant-C explanations (NO API).

20 entries: verb1-031..040 (10 comprehension) + verb2-031..035 (5 cloze) +
verb2-036..040 (5 comprehension on the Voynich passage).

Voice: Variant C — Ultra-Granular, English (ELF stays English by exam design).
Schema: 4-6 steps, 3 distractors (each ELF item has 4 options).
Openers rotate per item; `technique` names a recurring ELF pattern + trigger.
"""
from __future__ import annotations

import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}


def E(solution_path, steps, distractors, technique, pitfall=None):
    return {
        "_meta": META,
        "solution_path": solution_path,
        "steps": steps,
        "framework_id": None,
        "distractors": distractors,
        "technique": technique,
        "pitfall": pitfall,
    }


def S(n, title, text, tier="essential"):
    return {"n": n, "title": title, "text": text, "tier": tier}


def D(letter, why_tempting, why_wrong):
    return {"letter": letter, "why_tempting": why_tempting, "why_wrong": why_wrong}


REGEN = {}

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-031 — Medieval and Renaissance Maps. Ans C.
# Q: What is implied about old-fashioned maps?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-031"] = E(
    solution_path=(
        "The 'Medieval and Renaissance Maps' paragraph lists three reasons for "
        "sea monsters and ends with 'above all else, these monsters symbolised "
        "the possible hazards of the sea' — that 'above all else' flags the "
        "headline reason, which is exactly what C names: warnings of perceived "
        "dangers at sea."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks what is IMPLIED about old-fashioned maps. 'Implied' "
          "means the answer follows from the passage's framing — you are not "
          "hunting for a single quoted word, you are picking the option that "
          "fits the paragraph's overall claim."),
        S(2, "Locate the controlling sentence",
          "The paragraph offers a short list of reasons (belief in the creatures, "
          "decoration) and then closes with: 'But, above all else, these monsters "
          "symbolised the possible hazards of the sea, particularly in areas of "
          "the globe that were unexplored at the time.' The phrase 'above all "
          "else' tells you this is the headline reason."),
        S(3, "Restate in plain English",
          "Sea monsters did several jobs on the old maps, but the most important "
          "one was acting as a visual warning: 'careful — this stretch of ocean "
          "is unknown and potentially deadly'. The earlier reasons (belief, "
          "decoration) are real but secondary."),
        S(4, "Vocabulary check",
          "'Symbolised' = stood as a sign for. 'Hazards' = dangers. 'Adorn' = "
          "decorate. 'Unexplored' = not yet mapped or visited. Note that "
          "'implied' in the prompt does NOT mean hidden or secret — it means "
          "what the passage commits to as a whole.",
          tier="detail"),
        S(5, "Match against the options",
          "A talks about an educational goal, which the passage never raises — "
          "the maps weren't teaching tools. B says art outweighed geography; "
          "decoration is one listed reason but is overruled by 'above all else'. "
          "D claims the maps were not useful for geography; the passage takes "
          "no stance on overall usefulness, only on what the monsters meant. "
          "C — 'warnings of perceived dangers at sea' — maps directly onto the "
          "closing 'symbolised the possible hazards of the sea'."),
        S(6, "Conclusion",
          "The answer is C. The closing 'above all else' sentence is the "
          "controlling claim, and only C states it without distortion."),
    ],
    distractors=[
        D("A",
          "It's easy to read 'people truly believed that these so-called sea "
          "monsters existed' as a teaching purpose — if people believed it, "
          "surely the maps were instructing them.",
          "Belief in the creatures is a CULTURAL FACT the passage reports, not "
          "a goal the mapmakers held. Step 3's paraphrase keeps belief and "
          "purpose separate — the maps reflected the belief, they didn't teach "
          "it."),
        D("B",
          "Many stop at the sentence 'used to adorn the homes of the rich and "
          "wealthy' and slot decoration in as the lead purpose.",
          "Decoration is explicitly listed BEFORE the closing pivot 'But, "
          "above all else…' — step 2 shows that pivot rules every earlier "
          "reason. B treats a secondary motive as primary."),
        D("D",
          "First instinct on mythical-creature maps is to dismiss them as "
          "poor geography — if there are dragons on it, how useful can it be?",
          "The passage never weighs in on the maps' geographic usefulness; it "
          "talks about why the monsters were drawn. Step 5 shows D answers a "
          "question the paragraph doesn't ask."),
    ],
    technique=(
        "Watch for explicit ranking phrases — 'above all else', 'most "
        "importantly', 'first and foremost'. They tell you which item in a "
        "list the author wants you to weight highest, and the correct option "
        "almost always restates that ranked item."
    ),
    pitfall=(
        "A passage can mention several plausible reasons before pivoting. "
        "If you pick the FIRST reason offered instead of the one the author "
        "ranks last with 'above all else', you've inverted the structure of "
        "the paragraph."
    ),
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-032 — Social Learning. Ans D.
# Q: What is said here? (about social learning across species)
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-032"] = E(
    solution_path=(
        "The 'Social Learning' paragraph contrasts two facts: social learning "
        "within a species is widespread, but 'learning from representatives of "
        "a different species occurs much less frequently'. D — 'Animals learning "
        "from people is a relatively rare phenomenon' — is that exact claim."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt 'What is said here?' is the broadest possible reading "
          "task: find an option that matches a sentence the paragraph "
          "explicitly commits to. You're not inferring tone or implication; "
          "you're matching wording to claim."),
        S(2, "Locate the controlling sentence",
          "The key line is: 'The ability to learn socially is widespread "
          "among animals, but learning from representatives of a different "
          "species occurs much less frequently.' A second relevant line: "
          "'Yet science began probing the depth of this facility only a few "
          "years ago.'"),
        S(3, "Restate in plain English",
          "Two facts. (1) Animals routinely learn from members of their own "
          "species; cross-species learning is unusual. (2) Researchers only "
          "started studying dog-from-human learning seriously a few years "
          "ago. So cross-species learning is BOTH uncommon AND understudied."),
        S(4, "Vocabulary check",
          "'Social learning' = picking up behaviours by watching others. "
          "'Representatives of a different species' = members of a different "
          "kind of animal — for the dog-and-human case, dogs watching people. "
          "'Probing the depth' = studying carefully.",
          tier="detail"),
        S(5, "Match against the options",
          "A says researchers have LONG taken an interest in dogs learning "
          "from people — directly contradicted by 'science began probing… "
          "only a few years ago'. B says MOST animals imitate humans — "
          "contradicted by 'occurs much less frequently'. C narrows to sheep "
          "dogs being especially good copiers; the passage only mentions that "
          "shepherds have long noticed dogs' aptitude, not that sheep dogs "
          "are uniquely talented. D — 'Animals learning from people is a "
          "relatively rare phenomenon' — is a direct paraphrase of step 2's "
          "controlling sentence."),
        S(6, "Conclusion",
          "The answer is D. The contrast 'widespread within species, rare "
          "across species' is the paragraph's structural backbone, and only "
          "D names it."),
    ],
    distractors=[
        D("A",
          "It's tempting to read 'shepherds have long known as much' as "
          "evidence that researchers have long studied this — long folk "
          "knowledge sounds like long scientific knowledge.",
          "Shepherds noticing dogs ≠ scientists studying dogs. The passage "
          "explicitly says 'science began probing the depth of this facility "
          "only a few years ago' (step 3) — folk awareness predates the "
          "research."),
        D("B",
          "Many stop at the warm sentence about dogs being 'keen to learn by "
          "observation' and generalise that to 'most animals imitate humans'.",
          "The very next sentence reverses that: cross-species learning "
          "'occurs much less frequently'. B overreaches from one example "
          "(dogs) to most animals — step 5 spots the over-generalisation."),
        D("C",
          "First instinct on the shepherd line is to picture sheep dogs as the "
          "archetype — and to read 'shepherds have long known' as a claim "
          "about sheep dogs specifically.",
          "The passage uses shepherds only as a general source of folk wisdom "
          "about dogs; it never compares breeds. C invents a sheep-dog "
          "superiority the text doesn't support."),
    ],
    technique=(
        "On 'what is said here' items, hunt for a 'but' or 'however' sentence "
        "— the passage's contrast usually IS the question. Match the option "
        "that names the contrast (here: widespread vs. rare), and discard "
        "options that name only one side of it."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-033 — Moominland and Beyond, opening paragraph. Ans C.
# Q: What is argued about Tove Jansson's work in the opening paragraph?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-033"] = E(
    solution_path=(
        "The opening paragraph contrasts the bright surface of Moominvalley "
        "('snow-covered mountains, lush greenery, friendly creatures') with "
        "the wartime pain underneath ('however calm things may seem on the "
        "surface, life can be both frightening and unpredictable'). That "
        "surface-vs-underside split is exactly what C names."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt restricts you to the OPENING paragraph and asks what is "
          "argued about Jansson's work there. 'Argued' is stronger than "
          "'mentioned' — look for the paragraph's thesis, not a side detail."),
        S(2, "Locate the controlling lines",
          "Two sentences carry the argument. The opener: 'Moominvalley… seems "
          "as far as one can get from the horrors of war.' Then the turn: "
          "'But the Moomins have more to do with strife and struggle than is "
          "immediately obvious.' And the closing image: 'however calm things "
          "may seem on the surface, life can be both frightening and "
          "unpredictable.'"),
        S(3, "Restate in plain English",
          "On the surface, Moominland looks idyllic and far from war. "
          "Underneath, the stories are full of conflict and instability; "
          "Jansson channelled real wartime pain into her first book. So the "
          "paragraph's thesis is: 'the cheerful look is a thin layer over "
          "something darker.'"),
        S(4, "Vocabulary check",
          "'Strife' = serious conflict. 'Apocalyptic' = about catastrophic end-"
          "times. 'Skewering fascism' = sharply mocking it. 'On the surface' "
          "vs. underlying = appearance vs. reality. Note that 'argued' in "
          "the prompt just means 'claimed' here; it's not asking about an "
          "argument with someone.",
          tier="detail"),
        S(5, "Match against the options",
          "A claims Jansson's focus on war trauma is SUPERFICIAL — but the "
          "paragraph argues the OPPOSITE: the trauma is the underlying "
          "reality, not the surface. B claims the key message is "
          "international peace — the passage talks about strife and "
          "unpredictability, not peace promotion. D claims the idyllic "
          "setting is meant as ESCAPE from war — the paragraph actively "
          "denies this ('have more to do with strife and struggle than is "
          "immediately obvious'). C — 'tension between first impressions and "
          "the underlying realities' — names the surface-vs-underside split "
          "the whole paragraph is built around."),
        S(6, "Conclusion",
          "The answer is C. The paragraph is structured as 'looks like X / "
          "actually about Y', and C is the only option that names that "
          "structural tension."),
    ],
    distractors=[
        D("A",
          "Quick scans land here when you spot 'horrors of war' and "
          "'wartime pain' and assume the paragraph is criticising Jansson's "
          "treatment of war as shallow.",
          "Step 3 shows the paragraph treats the war content as DEEP, not "
          "superficial — Jansson 'channelled the wartime pain' INTO the work. "
          "A inverts the polarity."),
        D("B",
          "If you remember the rule as 'children's books = peace and "
          "tolerance', B sounds natural for the Moomin world.",
          "The opening paragraph nowhere promotes international peace — it "
          "talks about strife, struggle, and pain underneath calm surfaces. "
          "Step 2's controlling lines have no peace claim to match."),
        D("D",
          "Left-to-right reading gives 'Moominvalley… as far as one can get "
          "from the horrors of war' and stops there — sounds like the "
          "idyllic setting was deliberate escapism.",
          "The very next sentence reverses that reading: 'But the Moomins "
          "have MORE to do with strife and struggle than is immediately "
          "obvious.' D ignores the pivot 'But' and the entire argument that "
          "follows it (step 5)."),
    ],
    technique=(
        "On opening-paragraph items, find the FIRST 'but' or 'however' — "
        "everything after it is usually the paragraph's real claim. Distractors "
        "often quote the pre-pivot setup as if it were the thesis. The "
        "correct option names the post-pivot reversal."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-034 — Jansson's career. Ans D.
# Q: What is implied in relation to Jansson's career?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-034"] = E(
    solution_path=(
        "The passage says Jansson 'became overwhelmed by their success', that "
        "her brother Lars 'eventually took over drawing the comics', and that "
        "she 'saw herself primarily as a painter, taking on illustration work "
        "for the money'. Together these point to a steady step back from "
        "hands-on Moomin creation — exactly what D names."
    ),
    steps=[
        S(1, "Understand the question",
          "You are looking for what is IMPLIED about Jansson's career arc. "
          "'Implied' here means: the correct option follows from a pattern of "
          "claims, not from one quoted line. Read for the trajectory."),
        S(2, "Locate the controlling lines",
          "Three statements anchor the answer. (1) 'Jansson saw herself "
          "primarily as a painter, taking on illustration work for the money.' "
          "(2) 'As the Moomins took off… Jansson became overwhelmed by their "
          "success.' (3) 'Her brother Lars eventually took over drawing the "
          "comics, allowing her to concentrate on painting and writing novels "
          "and short stories for adults.'"),
        S(3, "Restate in plain English",
          "Jansson always wanted to be a painter; she only did Moomin "
          "illustrations because they paid. Once the Moomins exploded into "
          "fame, the workload swamped her, so she handed the comics off to "
          "her brother and went back to painting and adult fiction. The "
          "trajectory is hands-on → hands-off."),
        S(4, "Vocabulary check",
          "'Overwhelmed' = swamped, unable to keep up. 'Took over' = assumed "
          "responsibility instead of her. 'Concentrate on' = devote attention "
          "to. 'Hands-on creation' (in option D) means doing the drawing "
          "personally, not delegating it.",
          tier="detail"),
        S(5, "Match against the options",
          "A claims her passion for inventing new comic strips ran throughout "
          "her life — contradicted by Lars taking over the comics. B claims "
          "she was confident the Moomins would bring instant fame — the "
          "passage says she was overwhelmed when they DID take off, with no "
          "mention of advance confidence. C blames her Finnish background for "
          "slow international recognition — the passage says nothing about "
          "Finnish identity slowing her career; the brief biography note is "
          "about her parents, not her reception. D — 'gradually lost interest "
          "in the hands-on creation of the Moomin stories' — matches the "
          "trajectory in step 3."),
        S(6, "Conclusion",
          "The answer is D. The handoff to Lars and the return to painting "
          "form a clear arc away from hands-on Moomin work."),
    ],
    distractors=[
        D("A",
          "It's easy to read 'fiercely protective of the Moomin brand' as "
          "ongoing passion for the comics themselves.",
          "Protecting the brand against Disney is about licensing decisions, "
          "not about drawing the strips. Step 2 keeps these separate: Lars "
          "took over the DRAWING while Tove kept brand control."),
        D("B",
          "On a first read, 'worldwide fame' makes it sound like she predicted "
          "or planned for fame.",
          "The passage says she was OVERWHELMED when fame arrived — the "
          "opposite of confidence. Step 3's paraphrase has no advance-"
          "confidence claim to match."),
        D("C",
          "Many stop at 'Born in Helsinki to Swedish-speaking artist parents' "
          "and assume Finnish identity is being raised as a career obstacle.",
          "The Finnish detail is biographical context, not a cause of slow "
          "recognition. The slow-international claim in C is invented; the "
          "passage doesn't link her career pace to nationality (step 5)."),
    ],
    technique=(
        "On 'career' items spanning a long passage, look for HANDOFFS — when "
        "the subject delegates work to someone else, that almost always "
        "signals a shift in focus that an answer option will name. Here the "
        "brother taking over the comics is the structural pivot."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-035 — Dulwich exhibition. Ans A.
# Q: What is said in relation to Jansson's artwork as shown at the Dulwich
#    Picture Gallery?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-035"] = E(
    solution_path=(
        "The exhibition shows striking range — bold satirical typography, "
        "intricate Moomin illustrations, impressionistic seascapes — yet "
        "'the themes that run through all her work are instantly "
        "recognisable; a connection with nature — and water in particular — "
        "is always present.' Different techniques, shared themes — A."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt is anchored to the Dulwich Picture Gallery's retrospective "
          "specifically. You're looking for what the passage says about the "
          "RANGE of her work shown there — what's similar, what's different."),
        S(2, "Locate the controlling lines",
          "'What is clear from this exhibition is the breadth of Jansson's "
          "talent.' She worked with 'bold typography and bright colours' for "
          "Garm magazine, 'intricate illustrations' for the Moomins, and "
          "'impressionistic seascapes, the colours blurring into one another, "
          "a sharp contrast to her intricate illustrations.' Then: 'But the "
          "themes that run through all her work are instantly recognisable; "
          "a connection with nature — and water in particular — is always "
          "present.'"),
        S(3, "Restate in plain English",
          "The exhibition shows that Jansson worked in very different styles "
          "across her career — sharp graphic satire, careful pen illustration, "
          "loose abstract painting. But underneath the stylistic differences, "
          "the same themes keep coming back, especially nature and water. So "
          "the picture is: different surfaces, same core."),
        S(4, "Vocabulary check",
          "'Breadth of talent' = range of skills. 'Impressionistic' = loose, "
          "atmospheric (impressions of colour and light, not sharp lines). "
          "'Sharp contrast' = strongly different. 'Themes' = recurring ideas "
          "or subjects (not the same as style).",
          tier="detail"),
        S(5, "Match against the options",
          "A says 'despite striking differences in technique, there are a "
          "number of common features' — direct match for 'sharp contrast' "
          "in technique plus 'themes that run through all her work'. B says "
          "her many skills caused a LACK of expressive clarity — the passage "
          "praises the breadth, never says it muddies anything. C says she "
          "turned her back on political content — the political content lived "
          "in the early Garm work, but the passage doesn't track its later "
          "disappearance. D says the style comes across as surprisingly "
          "UNIFORM — directly opposite to 'sharp contrast' between styles."),
        S(6, "Conclusion",
          "The answer is A. The exhibition's headline is 'different "
          "techniques, shared themes', and only A names both halves."),
    ],
    distractors=[
        D("B",
          "It's tempting to read 'breadth' and 'overwhelmed by their success' "
          "as signs that her work was scattered or unfocused.",
          "Breadth is described approvingly here ('clear from this exhibition "
          "is the breadth of Jansson's talent'), and the exhibition's pitch "
          "is that themes UNIFY the work despite stylistic variety. Step 3 "
          "rules out the 'lack of expressive clarity' framing."),
        D("C",
          "If you remember 'mocking Hitler and Stalin' as her early period, "
          "C's claim that she later abandoned political content sounds like "
          "a plausible arc.",
          "The passage never tracks an abandonment — it places the political "
          "work in her Garm period without claiming she renounced it. The "
          "Amnesty International poster, in fact, shows she kept lending her "
          "characters to political causes (step 5)."),
        D("D",
          "Quick scans land here when you read 'themes… instantly "
          "recognisable' and assume that means stylistically uniform.",
          "Recognisable THEMES (nature, water) are not the same as uniform "
          "STYLE. The passage explicitly contrasts impressionistic seascapes "
          "with intricate illustrations — 'sharp contrast' is the exact word "
          "used (step 2)."),
    ],
    technique=(
        "Watch for the 'surface variety + underlying unity' structure: "
        "passages about an artist's exhibition almost always set up this "
        "split, and the correct option names BOTH the variety and the unity. "
        "Options that name only one side (only uniformity, only confusion) "
        "are typically wrong."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-036 — Personal life. Ans B.
# Q: What is argued in connection with Jansson's personal life?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-036"] = E(
    solution_path=(
        "The passage notes Jansson lived with Tuulikki Pietilä but 'the "
        "women's relationship was often glossed over' because 'being gay was "
        "illegal in Finland until 1971, and only declassified as an illness "
        "in 1981.' Concealment was forced by law and medical classification "
        "— exactly what B's 'reasons beyond her control' captures."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks what is argued about her PERSONAL LIFE. Focus on "
          "the section that contrasts the 'biography inside early children's "
          "editions' (lived alone) with the truth (lived with Pietilä)."),
        S(2, "Locate the controlling lines",
          "Three lines together: (1) 'The truth was she stayed in her remote "
          "summer home with her partner Tuulikki Pietilä… but the women's "
          "relationship was often glossed over.' (2) 'Being gay was illegal "
          "in Finland until 1971, and only declassified as an illness in "
          "1981.' (3) 'Jansson herself, however, defied labels' — her niece "
          "quoted: 'It wasn't gender that mattered to Tove, it was the "
          "individual.'"),
        S(3, "Restate in plain English",
          "Early children's-book bios pretended Jansson lived alone. In fact "
          "she shared her summer home with a female partner, but the "
          "relationship was hidden because being gay was actually illegal in "
          "Finland until 1971 and called an illness until 1981. So the "
          "concealment was forced by law and medicine — not by her own choice."),
        S(4, "Vocabulary check",
          "'Glossed over' = mentioned only briefly so that the reader doesn't "
          "notice. 'Declassified as an illness' = officially stopped being "
          "labelled a disease. 'Defied labels' = refused to accept categories "
          "imposed on her. The phrase 'beyond her control' in option B "
          "captures legal and medical-classification pressures she could not "
          "personally remove.",
          tier="detail"),
        S(5, "Match against the options",
          "A casts her as an eager feminist and gay-rights spokesperson — the "
          "passage shows a private relationship hushed up, not public "
          "activism. C says she was acutely aware of gender's importance for "
          "her career — the niece quote is the OPPOSITE ('it wasn't gender "
          "that mattered to Tove'). D says she eventually stopped being "
          "ashamed of the relationship — the passage doesn't describe shame "
          "and offers no 'in the end' turning point. B — 'at first, her "
          "sexual orientation had to be hushed up for reasons beyond her "
          "control' — matches step 2's law-and-illness explanation exactly."),
        S(6, "Conclusion",
          "The answer is B. 'Hushed up' fits 'glossed over', and 'reasons "
          "beyond her control' fits the legal/medical climate of 1950s–80s "
          "Finland."),
    ],
    distractors=[
        D("A",
          "Left-to-right reading gives 'Amnesty International poster' and "
          "'defied labels' and constructs an image of an outspoken activist.",
          "Defying labels in private speech ≠ public spokesperson role. The "
          "passage describes a hushed relationship, not an activist career "
          "(step 3). A overreaches."),
        D("C",
          "If you remember 'gender' and 'feminist' as adjacent concepts, the "
          "niece's quote about gender can be misread as confirming gender's "
          "importance.",
          "The niece's quote says the OPPOSITE: 'It wasn't gender that "
          "mattered to Tove, it was the individual.' Step 4 keeps the polarity "
          "straight."),
        D("D",
          "First instinct on hidden-relationship narratives is to assume "
          "shame, then later self-acceptance — that arc is a familiar "
          "biography shape.",
          "The passage frames the concealment as IMPOSED by law and "
          "classification, not chosen out of shame. There is no 'in the end' "
          "moment of public coming-out described — D writes an arc the text "
          "doesn't supply."),
    ],
    technique=(
        "When a passage explains concealment by citing LAWS or MEDICAL "
        "classifications, the correct option will name external constraints "
        "('beyond her control', 'forced to', 'had to'). Discard options "
        "that locate the cause inside the subject's feelings (shame, "
        "indifference) when the passage points outside."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-037 — Jansson's production. Ans C.
# Q: Which statement is most in accordance with the text?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-037"] = E(
    solution_path=(
        "The passage stacks female-subject evidence across Jansson's career — "
        "Print Maker (Pietilä), her self-portrait, Moominmamma, Little My, "
        "Too-Ticky, Thingumy-and-Bob — and states 'Jansson's admiration for "
        "strong women is clear.' That recurring focus is what C names."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks which statement is MOST IN ACCORDANCE with the "
          "text — i.e., which option matches the passage's pattern of "
          "evidence about her production, without overshooting."),
        S(2, "Locate the controlling lines",
          "The passage explicitly declares: 'Jansson's admiration for strong "
          "women is clear.' Then it lists female subjects: Print Maker (1975) "
          "shows Pietilä; her last self-portrait at 64; Moominmamma; Little "
          "My ('resembles Jansson herself'); Too-Ticky (modelled on Pietilä); "
          "Thingumy and Bob (Jansson and Vivica Bandler)."),
        S(3, "Restate in plain English",
          "Jansson keeps painting and writing women. Some are real people in "
          "disguise (Pietilä as Too-Ticky, Bandler as half of Thingumy-and-"
          "Bob), some are pure invention (Little My, Moominmamma). The "
          "common thread is female-centred portraiture and characterisation "
          "across decades of work."),
        S(4, "Vocabulary check",
          "'Production' here means her body of artistic work as a whole. "
          "'Paid homage to' = honoured. 'Motif' (in option C) = a recurring "
          "subject or image. 'Notable lack' (in option B) = a striking "
          "absence. Note the difference between 'fascination' (a positive "
          "draw) and 'absence' (a gap).",
          tier="detail"),
        S(5, "Match against the options",
          "A says she found imaginary characters more interesting than real "
          "people — but Print Maker and her self-portrait are real, and the "
          "passage treats them as central. B says there is a notable LACK of "
          "male characters — the passage doesn't make this comparison; it "
          "lists female motifs without claiming men are absent. D says ALL "
          "Moominland characters are true-to-life copies — too strong; the "
          "passage names only a few (Too-Ticky, Thingumy and Bob) as "
          "real-life portraits, and explicitly invents others ('Little My… "
          "resembles Jansson herself' is partial likeness, not full copy). "
          "C — 'special fascination with female motifs is obvious throughout "
          "her work' — restates 'admiration for strong women is clear' and "
          "the stacked evidence."),
        S(6, "Conclusion",
          "The answer is C. The passage explicitly names the female-subject "
          "focus and gives multiple examples; the other options either "
          "invert (A), invent (B), or overshoot (D)."),
    ],
    distractors=[
        D("A",
          "It's easy to picture a Moomin-creator as someone who preferred her "
          "invented troll-world to real human models.",
          "Print Maker (1975) shows a REAL person (Pietilä), and Jansson's "
          "last SELF-portrait — also real — is highlighted. Step 5 shows real "
          "subjects are central, not subordinate to invented ones."),
        D("B",
          "If you remember the rule as 'the passage lists women so men are "
          "missing', B feels like a tidy mirror image.",
          "Listing female subjects is not the same as asserting an absence "
          "of male ones. The passage simply doesn't make a claim about how "
          "many men appear (step 3); B invents a comparison the text avoids."),
        D("D",
          "Quick scans land here when you read 'Pietilä appears as a "
          "character called Too-Ticky' and assume every Moominland figure "
          "must have a real-world model.",
          "Only a handful are explicitly named as portraits of real people. "
          "'Little My… resembles Jansson herself' is a likeness, not a "
          "biographical copy. D's 'ALL' is the giveaway over-claim (step 5)."),
    ],
    technique=(
        "On 'most in accordance' items, the correct option restates an "
        "EXPLICIT claim the passage makes plus its stacked evidence — here, "
        "'admiration for strong women is clear' + the parade of female "
        "subjects. Distractors lean on absolute words ('all', 'no', 'never') "
        "that the passage doesn't actually support."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-038 — Seasonal Cycles. Ans B.
# Q: What is said about animals' seasonal cycles?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-038"] = E(
    solution_path=(
        "The passage says the cycles are 'hard-wired': captive ground "
        "squirrels keep hibernating 'even when kept in constant temperatures "
        "with unvarying periods of light and dark', and lab birds still molt "
        "and fatten on yearly cycles. Cycles persist despite stable "
        "environments — exactly what B names."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks what is said about seasonal cycles in general. "
          "You're testing each option against the paragraph's controlling "
          "claim, not against one anecdote."),
        S(2, "Locate the controlling lines",
          "'These cycles are hard-wired: captive ground squirrels continue to "
          "hibernate seasonally even when kept in constant temperatures with "
          "unvarying periods of light and dark. Likewise, birds in stable lab "
          "conditions get restless at migration time and keep molting and "
          "fattening in yearly cycles.'"),
        S(3, "Restate in plain English",
          "Animals run their seasonal cycles even when researchers strip out "
          "the seasonal cues — same temperature year-round, same light/dark "
          "pattern. The behaviour fires anyway. So the cycles are running on "
          "an internal clock, not on external triggers."),
        S(4, "Vocabulary check",
          "'Hard-wired' = built in, not learned. 'In captivity' = in a "
          "controlled setting like a lab or zoo. 'Unvarying' = unchanging. "
          "'Environmental factors' (in option B) = external things like "
          "temperature, daylight, and food availability — the very things "
          "the lab setup eliminates.",
          tier="detail"),
        S(5, "Match against the options",
          "A says some cycles are genetically determined and others are not — "
          "the passage gives no example of the 'are not' side; it calls the "
          "cycles 'hard-wired' as a class. B says cycles 'do not change in "
          "response to environmental factors' — matches the lab evidence "
          "directly (same behaviour despite constant temperature and light). "
          "C says cycles in captivity are 'irregular and distressing' — the "
          "passage says the opposite: they continue REGULARLY in captivity. "
          "D says the cycles are caused by shifting temperatures — directly "
          "contradicted by 'constant temperatures' producing the same "
          "hibernation pattern."),
        S(6, "Conclusion",
          "The answer is B. The lab experiments are designed precisely to "
          "show that the cycles are internal, not environment-driven."),
    ],
    distractors=[
        D("A",
          "Quick scans land here when you see 'hard-wired' and assume there "
          "must be a soft-wired counterpart described somewhere.",
          "The paragraph only describes hard-wired cycles; it doesn't "
          "introduce a second category. A invents a comparison the passage "
          "doesn't offer (step 3)."),
        D("C",
          "It's tempting to imagine that a hibernating squirrel in a "
          "constant-temperature room would be confused or distressed.",
          "The passage describes captive squirrels as continuing to hibernate "
          "SEASONALLY — i.e., on schedule — and birds 'get restless at "
          "migration time' on the expected calendar. Step 2's controlling "
          "lines describe regularity, not distress."),
        D("D",
          "Many stop at the spring-sandhill-crane image and the breeding-"
          "season hamster line and assume the temperature change is "
          "triggering the behaviour.",
          "The lab evidence in the very next sentences strips temperature out "
          "and the behaviour persists. Step 5's 'constant temperatures' line "
          "is the disconfirmation that D's claim cannot survive."),
    ],
    technique=(
        "When a passage introduces a finding ('these cycles are hard-wired') "
        "and follows it with controlled-experiment evidence ('even when "
        "kept in constant…'), the correct option will name the finding's "
        "negation of an alternative cause. Here: cycles persist DESPITE the "
        "environment being held constant, so the environment is ruled out."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-039 — Home, Sweet Home. Ans B.
# Q: What is John S. Allen's main point in relation to homes?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-039"] = E(
    solution_path=(
        "Allen argues homes let early humans 'sleep securely and soundly, "
        "which has been shown to increase brain functions like learning and "
        "memory formation', and gave them 'an opportunity to use our mental "
        "powers to better deal with that world.' That's a chain from "
        "dwellings to thinking — exactly what B's 'indirectly contributed "
        "to increased intellectual capacity' names."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks for Allen's MAIN POINT about homes. The paragraph "
          "lists several functions homes served; you want the one Allen "
          "elevates above the others."),
        S(2, "Locate the controlling lines",
          "The thesis: dwellings 'may be just as important – if not more so – "
          "than tools, language and controlled fire'. Then the chain: homes "
          "'enabled early humans to sleep securely and soundly, which has "
          "been shown to increase brain functions like learning and memory "
          "formation.' Allen's own words: dwellings are 'critical not only "
          "for resting but also for thinking'."),
        S(3, "Restate in plain English",
          "Allen's argument runs: homes → better sleep → better brain "
          "function → better thinking. Protection from predators and family "
          "bonding are mentioned as ALSO happening, but the headline claim is "
          "that homes upgraded our mental abilities. The link is indirect — "
          "homes don't make you smarter on their own; they make you sleep "
          "well, and good sleep makes you smarter."),
        S(4, "Vocabulary check",
          "'Dwellings' = places where people live. 'Brain functions like "
          "learning and memory formation' = cognitive capacity. 'Indirectly "
          "contributed to' (in option B) means caused via an intermediate "
          "step — here, via the sleep-and-quiet pathway, not directly. "
          "'Intellectual capacity' = thinking ability.",
          tier="detail"),
        S(5, "Match against the options",
          "A — 'better shelter for families and their children' — paraphrases "
          "one listed benefit ('mates and offspring could become families') "
          "but isn't the headline; Allen explicitly elevates thinking above "
          "shelter. C — 'increased the chances of survival' — never appears; "
          "Allen talks about thinking and family life, not survival rates. "
          "D — 'substantially improved sleeping conditions' — captures the "
          "middle of the chain but stops short; for Allen, sleep is the means, "
          "not the end. B — 'indirectly contributed to increased intellectual "
          "capacity' — names the end of the chain (thinking) and the indirect "
          "nature of the link (via sleep)."),
        S(6, "Conclusion",
          "The answer is B. Allen's headline is the upgrade in thinking; "
          "sleep is the mechanism but not the main point."),
    ],
    distractors=[
        D("A",
          "If you remember the rule as 'a house is for the family', A sounds "
          "like the natural main point of any 'home' argument.",
          "Allen ranks thinking above family-and-shelter in the sentence "
          "'may be just as important — if not more so — than tools, language "
          "and controlled fire' (step 2). The family benefit is one item in "
          "the list, not the main point."),
        D("C",
          "It's easy to translate 'protection from the elements and predators' "
          "into a survival claim, since that's how anthropology usually "
          "frames shelter.",
          "Allen does NOT make the survival argument here — he uses 'beyond "
          "providing protection from the elements and predators' to PUSH "
          "PAST shelter and into the cognitive benefit. C names the part "
          "Allen explicitly says he's going beyond (step 3)."),
        D("D",
          "First instinct on 'sleep securely and soundly' is to pick the "
          "option that names sleep — the sentence is right there.",
          "Sleep is the MECHANISM in Allen's chain, not the conclusion. "
          "Allen's own words 'critical not only for resting but also for "
          "thinking' show he's pointing past sleep toward cognition (step 5)."),
    ],
    technique=(
        "When an author lists several effects and then ranks one as more "
        "important ('not only X but also Y'), the correct option names Y, "
        "not X. Here 'not only for resting but also for thinking' is the "
        "tell — thinking is the headline, resting is the rung below it."
    ),
    pitfall=(
        "Multi-step causal chains (homes → sleep → brain function → "
        "thinking) tempt you to pick the middle step because it's quoted "
        "vividly. The correct answer is usually the END of the chain — the "
        "consequence the author is building toward."
    ),
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb1-ELF-040 — Jingoism. Ans D.
# Q: What are we told about British jingoism in the late 1800s?
# Context recovered from hp_databas.json (parsed context was truncated).
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb1-ELF-040"] = E(
    solution_path=(
        "The 'Jingoism' paragraph closes with politicians worrying about a "
        "working-class electorate and concluding that 'an assertive foreign "
        "policy was the best way to appeal to the public' — both parties "
        "used jingoism to keep voters onside. That deliberate political use "
        "is exactly D."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks what we are TOLD — a direct-match question. Look "
          "for an option that paraphrases an explicit claim about late-1800s "
          "British jingoism, not an inference about the wider empire."),
        S(2, "Locate the controlling lines",
          "Two anchor sentences. The setup: 'Jingoism… was rife within the "
          "British Empire, especially at its peak in the late 19th century. "
          "The aggressive shows of force by Britain to maintain and expand "
          "its reach were naturally exaggerated by the press, and clever "
          "propaganda put almost anything the empire did in a positive light.' "
          "The punchline: 'politicians were worried that a working-class "
          "electorate was dangerous to British politics. Both the "
          "Conservatives and Liberals came to realise that an assertive "
          "foreign policy was the best way to appeal to the public.'"),
        S(3, "Restate in plain English",
          "Both the main British political parties saw that newly-enfranchised "
          "working-class voters were a political risk. Their answer was to "
          "lean into aggressive foreign policy — jingoism — because it played "
          "well with the public. So the elite used patriotic spectacle "
          "deliberately, as a tool to keep voters on their side."),
        S(4, "Vocabulary check",
          "'Jingoism' = aggressive patriotism, the belief that your country "
          "should be assertive abroad. 'Rife' = widespread. 'Electorate' = "
          "the body of people allowed to vote. 'Routinely used by the elite' "
          "(in option D) describes politicians (Conservatives and Liberals) "
          "using patriotic feeling as a political strategy.",
          tier="detail"),
        S(5, "Match against the options",
          "A claims other European powers deliberately encouraged British "
          "jingoism — the passage says the OPPOSITE chain: the rise of "
          "Germany and Russia 'helped fuel' British jingoism, but as a "
          "reaction, not a deliberate foreign instigation. B claims jingoism "
          "was particularly widespread among working-class people — the "
          "passage says politicians used it TO REACH the working-class "
          "electorate, but doesn't say working-class people held it more "
          "strongly than others. C claims it was inspired by sentiments in "
          "Spain and France — the Spain/France line refers to Britain's old "
          "rivalries, not to imported sentiment. D — 'routinely used by the "
          "elite to keep citizens on their side' — matches step 2's punchline "
          "exactly: both parties (the political elite) deliberately deployed "
          "assertive foreign policy to win public support."),
        S(6, "Conclusion",
          "The answer is D. The paragraph's structural conclusion is that "
          "British politicians weaponised jingoism for political ends, which "
          "is what D names."),
    ],
    distractors=[
        D("A",
          "It's tempting to read 'the rise of other superpowers such as "
          "Germany and Russia only helped fuel jingoism' as proof that those "
          "powers actively stoked British feeling.",
          "Other powers RISING is what fuelled British reaction; the passage "
          "describes no deliberate foreign campaign to encourage British "
          "jingoism. Step 3's paraphrase keeps reaction and instigation "
          "separate."),
        D("B",
          "Quick scans land here on 'working-class electorate' and assume "
          "the working class HELD the jingoism most strongly.",
          "The working class is described as the AUDIENCE politicians targeted, "
          "not as the group with the strongest jingoist feelings. Step 5 "
          "shows B confuses who the message was aimed at with who held it."),
        D("C",
          "Left-to-right reading gives 'Britain had always had fierce "
          "rivalries with Spain and France' and reads that as Spanish or "
          "French sentiment seeping into British jingoism.",
          "The rivalry sentence is a historical aside — Britain's jingoism "
          "wasn't NEW, since it had rivalries before. It doesn't say Spanish "
          "or French sentiment inspired British jingoism (step 2)."),
    ],
    technique=(
        "On 'what we are told' items, find the paragraph's CLOSING sentence — "
        "in argument-style passages it often delivers the headline claim "
        "('an assertive foreign policy was the best way to appeal to the "
        "public'). The correct option restates that closer, even if earlier "
        "sentences offered juicier-sounding side claims."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-031 — Cloze gap 31 (Comic Books). Ans B (Rebranded).
# Text: "[GAP] as 'graphic novels' or 'sequential art', it's now okay for the
# literati to be seen reading such puerile material…"
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-031"] = E(
    solution_path=(
        "Gap 31 introduces the new labels 'graphic novels' / 'sequential art' "
        "that make it 'okay for the literati' to read comics. Only "
        "'Rebranded' fits the participle slot AND captures the rename-and-"
        "respectability move."
    ),
    steps=[
        S(1, "Understand the gap",
          "The gap opens a participle phrase: '[GAP] as \"graphic novels\" "
          "or \"sequential art\", it's now okay for the literati to be seen "
          "reading such puerile material'. The structure '[verb-ed] as X, "
          "main clause' means the verb is doing the renaming or reclassifying "
          "that licenses the main clause."),
        S(2, "Read around the gap",
          "The sentence right before is 'critics suddenly discover that "
          "mainstream comics have grown up.' The sentence after the gap "
          "phrase explains the effect: literati can now read them without "
          "embarrassment. So the gap word does the act that lets a low-status "
          "thing (comics) become high-status."),
        S(3, "Identify the relationship",
          "The relationship is 'rename → respectability'. The right verb is "
          "one that takes comics and presents them under new, more "
          "respectable labels. The two labels in the sentence ('graphic "
          "novels', 'sequential art') ARE the new names, so the verb must "
          "denote re-labelling."),
        S(4, "Vocabulary check",
          "Test each verb's meaning. 'Dismissed as X' = thrown out as X "
          "(negative). 'Rebranded as X' = relabelled with a new name to give "
          "a new image (matches the move exactly). 'Discouraged as X' = "
          "actively warned against under that name (doesn't fit). 'Revealed "
          "as X' = exposed to be X (treats the label as a hidden truth, not "
          "a marketing move).",
          tier="detail"),
        S(5, "Plug and test",
          "Plug each in. 'Dismissed as graphic novels, it's now okay…' — "
          "contradicts: if dismissed, it would NOT be okay to read. "
          "'Rebranded as graphic novels, it's now okay…' — clean fit: new "
          "label, new respectability. 'Discouraged as graphic novels' — "
          "wrong polarity, since 'now okay' is positive. 'Revealed as "
          "graphic novels' — implies a hidden identity; comics weren't "
          "secretly novels."),
        S(6, "Conclusion",
          "The answer is B (Rebranded). It's the only verb that captures "
          "the rename-equals-respectability mechanic the surrounding "
          "sentences set up."),
    ],
    distractors=[
        D("A",
          "It's easy to read 'puerile material' as a put-down and reach for "
          "a negative verb like 'Dismissed'.",
          "If comics were dismissed, the conclusion 'it's now okay for the "
          "literati to be seen reading' could not follow. Step 5's plug-and-"
          "test catches the polarity flip."),
        D("C",
          "First instinct on a sentence about cultural snobbery is to expect "
          "discouragement — so 'Discouraged as graphic novels' feels "
          "thematically right.",
          "The whole sentence describes a SUCCESSFUL upgrade in status, not "
          "discouragement. The verb has to license the positive 'now okay' "
          "outcome (step 3)."),
        D("D",
          "If you remember the rule as 'reveal the true nature of X', "
          "'Revealed as graphic novels' sounds insightful — like the medium's "
          "real identity is being uncovered.",
          "'Revealed as' would mean the labels are pre-existing truths "
          "uncovered after investigation. The passage frames them as marketing "
          "labels chosen by critics — re-naming, not unmasking."),
    ],
    technique=(
        "On cloze items where the gap is followed by 'as X, main clause', "
        "ask: does the verb need to MATCH or REVERSE the polarity of the "
        "main clause? Here the main clause is positive ('now okay'), so the "
        "gap verb must license positive status — that rules out 'dismissed' "
        "and 'discouraged' before you even compare them."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-032 — Cloze gap 32. Ans C (current).
# Text: "for the [GAP] crop of graphic classics we have to thank the
# cartoonists who cut their teeth churning out the 'trash mags' of the 1950s
# and underground comix of the 1960s."
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-032"] = E(
    solution_path=(
        "Gap 32 is an adjective in front of 'crop of graphic classics'. The "
        "passage credits 1950s and 1960s cartoonists for today's graphic "
        "classics — so the adjective must denote 'today's', which is what "
        "'current' captures."
    ),
    steps=[
        S(1, "Understand the gap",
          "The slot is between an article and a noun phrase: 'for the [GAP] "
          "crop of graphic classics'. The gap is an adjective describing "
          "which crop of classics we are talking about. The four options are "
          "all time-adjectives."),
        S(2, "Read around the gap",
          "The surrounding sentence is a time-anchored credit: 'stories for "
          "adult readers have been around since the inception of strips and "
          "comics in the 1800s, but for the [GAP] crop of graphic classics "
          "we have to thank the cartoonists who cut their teeth churning out "
          "the trash mags of the 1950s and underground comix of the 1960s.' "
          "Two time periods are named: 1800s (origin) and 1950s/60s (the "
          "teachers). The crop being credited is the one we have NOW."),
        S(3, "Identify the relationship",
          "The 'but' contrasts long-ago adult comics (since the 1800s) with "
          "the more recent graphic CLASSICS that we credit specific 1950s/60s "
          "cartoonists for. So the gap word picks out the present-day batch "
          "of classics."),
        S(4, "Vocabulary check",
          "'Actual' in English = real, genuine (NOT the same as 'current'; "
          "a common false-friend trap for Swedish speakers, where 'aktuell' "
          "means current). 'Past' = belonging to an earlier time. 'Current' "
          "= existing now, present-day. 'Late' = (a) deceased, (b) recent "
          "but past — sounds plausible but reads as 'last' rather than "
          "'present'.",
          tier="detail"),
        S(5, "Plug and test",
          "Plug each in. 'For the actual crop of graphic classics' — sounds "
          "like 'the real crop, not the fake one'; awkward and doesn't match "
          "the time contrast. 'For the past crop' — points backward, but the "
          "next clause talks about cartoonists whose work LED to this crop, "
          "so the crop itself must be present, not past. 'For the current "
          "crop of graphic classics' — present-day crop, credited to the "
          "1950s/60s mentors who shaped it. Clean fit. 'For the late crop' "
          "— suggests 'most recent' but in English collocates oddly with "
          "'crop of classics' and overlaps with 'past' rather than 'present'."),
        S(6, "Conclusion",
          "The answer is C (current). The sentence contrasts a long-ago "
          "origin (1800s) with the present-day classics shaped by 1950s/60s "
          "cartoonists; 'current' is the only adjective that pins the crop "
          "to the present."),
    ],
    distractors=[
        D("A",
          "Swedish speakers reading 'aktuell' will reach for the cognate "
          "'actual' instinctively — both look like 'current'.",
          "In English, 'actual' means real/genuine, not current. Step 4's "
          "false-friend note is the key: 'aktuell' ≠ 'actual'. Plugging it "
          "in produces an awkward sentence about a 'real crop' versus a "
          "fake one."),
        D("B",
          "If you remember the rule as 'the 1950s and 60s are the past', "
          "'past crop' feels matched to the dates that follow.",
          "The crop is what we have NOW — the 1950s/60s cartoonists are the "
          "MENTORS, not the crop itself. Step 3 keeps the two roles distinct: "
          "the crop is present, the influences are past."),
        D("D",
          "First instinct on 'recent' is to grab 'late', since 'late "
          "20th century' is a common phrase.",
          "'Late' before 'crop' reads as 'the last' or 'the dying', not 'the "
          "current'. The sentence needs present-day, not endpoint — step 5's "
          "plug-and-test surfaces the collocational mismatch."),
    ],
    technique=(
        "On cloze adjective slots, identify whether the surrounding sentence "
        "is asking for PAST, PRESENT, or FUTURE — then eliminate. Here the "
        "explicit dates (1800s origin, 1950s/60s mentors) leave a 'today' "
        "slot for the crop, and only 'current' is unambiguously present-day. "
        "Also watch for Swedish false friends: 'aktuell' = current, not "
        "'actual'."
    ),
    pitfall=(
        "Swedish 'aktuell' translates to English 'current', NOT 'actual'. "
        "English 'actual' means 'real/genuine'. Mistaking this pair is one "
        "of the most reliable traps in ELF cloze items — sense-check by "
        "asking 'is this slot about reality or about time?'."
    ),
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-033 — Cloze gap 33. Ans D (Rather than).
# Text: "[GAP] books of strips or compilations of magazines, the self-contained
# single-story comic book had arrived."
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-033"] = E(
    solution_path=(
        "Gap 33 sets up a contrast between an old format (books of strips, "
        "compilations) and a new one (the self-contained single-story comic "
        "book). The connector has to mark replacement / contrast — 'Rather "
        "than' is the only option that does that."
    ),
    steps=[
        S(1, "Understand the gap",
          "The slot is a sentence-initial connector: '[GAP] books of strips "
          "or compilations of magazines, the self-contained single-story "
          "comic book had arrived.' Two formats are named, and the connector "
          "tells us how they relate to each other."),
        S(2, "Read around the gap",
          "Just before, the passage describes how Maus and A Contract with "
          "God ranked beside Grass and Dickens — they are full standalone "
          "books, not magazine compilations. So the new format being "
          "introduced (self-contained single-story comic book) is replacing "
          "the older format (strip collections, magazine compilations)."),
        S(3, "Identify the relationship",
          "Old format vs. new format, with the new one arriving. The "
          "connector should mark 'instead of A, B'. That is exactly what "
          "'Rather than' does. The other options express similarity ('Just "
          "like'), exclusion within a set ('Other than'), or causation "
          "('Owing to') — none fit a replacement contrast."),
        S(4, "Vocabulary check",
          "'Just like X, Y' = Y resembles X. 'Other than X, Y' = besides X, "
          "Y (X is excluded from a set). 'Owing to X, Y' = X is the cause of "
          "Y. 'Rather than X, Y' = Y instead of X (replacement / contrast). "
          "These are four different logical relationships; only one matches "
          "'old format gone, new format arrived'.",
          tier="detail"),
        S(5, "Plug and test",
          "'Just like books of strips… the self-contained single-story comic "
          "book had arrived' — claims similarity, but the next sentence "
          "(Spiegelman and Eisner 'crossed over into book shops') shows a "
          "REPLACEMENT, not a continuation. 'Other than books of strips…' — "
          "treats compilations as one item in a larger set, which doesn't "
          "match. 'Owing to books of strips…' — implies the new format was "
          "CAUSED by the old; the passage frames it as a break, not a "
          "consequence. 'Rather than books of strips… the self-contained… "
          "had arrived' — clean fit: instead of compilations, a new format."),
        S(6, "Conclusion",
          "The answer is D (Rather than). Format A is replaced by format B; "
          "only 'Rather than' encodes the replacement."),
    ],
    distractors=[
        D("A",
          "If you read 'Maus and A Contract with God' as continuing the same "
          "tradition as strip compilations, 'Just like' feels right.",
          "The two books are presented as a BREAK from compilations — "
          "Spiegelman and Eisner 'crossed over into book shops', a new venue. "
          "Step 5 shows the relationship is contrast, not similarity."),
        D("B",
          "Many stop at 'other than' as a way of acknowledging the older "
          "formats before introducing the new one — it sounds polite.",
          "'Other than X, Y' means 'in addition to X, Y' or 'besides X, Y' — "
          "it doesn't establish replacement. The sentence needs 'instead of', "
          "which only 'Rather than' supplies (step 3)."),
        D("C",
          "On a first read, the older formats can look like they CAUSED the "
          "new self-contained comic book by inspiring it — 'Owing to' "
          "encodes that.",
          "The passage describes the new format as ARRIVING after the old, "
          "not as RESULTING FROM the old. 'Owing to' would need a causal "
          "chain the surrounding sentences don't supply."),
    ],
    technique=(
        "On cloze connector slots, classify the relationship before picking: "
        "is it similarity, addition, causation, or replacement? Sentence "
        "structure '[CONNECTOR] OLD, NEW had arrived' almost always wants a "
        "replacement marker — 'rather than', 'instead of'. Memorise this "
        "shape; it recurs in ELF cloze."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-034 — Cloze gap 34. Ans A (narrative).
# Text: "writer-artists who have taken the graphic [GAP] into areas which
# would astonish those who still believe comics mean testosterone in tights."
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-034"] = E(
    solution_path=(
        "Gap 34 is a noun in the phrase 'taken the graphic [GAP] into "
        "areas…'. The writers named (Sacco, Hernandez, Moore, Satrapi) are "
        "STORYTELLERS expanding what comics can tell — so 'graphic narrative' "
        "is the natural collocation, and the only option that means 'story'."
    ),
    steps=[
        S(1, "Understand the gap",
          "The slot is a noun after 'the graphic'. The verb 'taken into "
          "areas' demands an entity that can be expanded into new territory — "
          "a story form, a tradition, a medium. Look for the noun that names "
          "that kind of object."),
        S(2, "Read around the gap",
          "The writers named are Joe Sacco (Palestine), the Hernandez "
          "Brothers (Love & Rockets), Alan Moore (From Hell), and Marjane "
          "Satrapi (Persepolis) — all known for telling complex, serious "
          "STORIES through comics. The contrast at the end is 'those who "
          "still believe comics mean testosterone in tights' (i.e., "
          "superhero stories). So the gap noun is what those writers expand "
          "beyond superheroes — namely, the storytelling itself."),
        S(3, "Identify the relationship",
          "These four writers don't share a 'turn' or an 'average' or a "
          "'sign'; they share the act of telling sophisticated graphic "
          "STORIES. So the gap names the storytelling object. 'Graphic "
          "narrative' is a standard term in English literary criticism — it "
          "denotes 'story told through comics'."),
        S(4, "Vocabulary check",
          "'Narrative' = a story or storytelling form. 'Turn' = (a) a "
          "rotation, (b) one's time to act — neither fits 'graphic turn into "
          "areas'. 'Average' = the typical or middling level — semantically "
          "wrong: writers don't take averages into areas. 'Sign' = a marker "
          "or symbol — too small a unit to be 'taken into areas'.",
          tier="detail"),
        S(5, "Plug and test",
          "Plug each in. 'Taken the graphic narrative into areas which would "
          "astonish those who still believe comics mean testosterone in "
          "tights' — clean fit: serious storytellers expand what graphic "
          "stories can do. 'Taken the graphic turn' — doesn't refer to "
          "anything; 'graphic turn' isn't a standard noun phrase. 'Taken "
          "the graphic average' — meaningless; you can't take an average "
          "into territory. 'Taken the graphic sign' — too narrow; signs are "
          "individual marks, not a form that has 'areas'."),
        S(6, "Conclusion",
          "The answer is A (narrative). The four authors are storytellers, "
          "and 'graphic narrative' is the established English term for what "
          "they expand."),
    ],
    distractors=[
        D("B",
          "It's tempting to grab 'turn' from the cliché 'a new turn' — sounds "
          "like a new direction the medium is taking.",
          "'Graphic turn' isn't a real English collocation; the phrase you "
          "might be remembering is 'a new turn' on its own. Step 4 catches "
          "that 'turn' needs a different syntactic frame ('took a turn', not "
          "'taken the graphic turn into')."),
        D("C",
          "If you remember the rule as 'numbers and statistics belong in "
          "comics journalism', 'graphic average' might sound technical and "
          "right.",
          "Averages are quantities; you can't take a quantity 'into areas'. "
          "Step 5's plug-and-test produces nonsense. 'Average' fails the "
          "semantic class test — the slot wants a storytelling object."),
        D("D",
          "First instinct on 'graphic' is to think of icons or signs — both "
          "graphic in a visual sense.",
          "A 'sign' is an individual visual unit, not a form with areas to "
          "expand into. The writers named tell long stories, not single "
          "signs (step 3). 'Sign' is too small a unit for the slot."),
    ],
    technique=(
        "On cloze noun slots, identify the SEMANTIC CLASS the slot needs "
        "before consulting the options. 'Taken X into areas' demands a form "
        "or tradition (something with extent). Eliminate options that fail "
        "the class test (turn, average, sign — none denote a story form) "
        "before fine-tuning."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-035 — Cloze gap 35. Ans C (artwork).
# Text: "Many keep their objects of beauty in plastic envelopes and repeatedly
# return to them, maybe just one page, for it is the visceral quality of the
# [GAP] that compels."
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-035"] = E(
    solution_path=(
        "Gap 35 names what readers come back to in a graphic novel — page "
        "by page, like a kept-in-plastic 'object of beauty'. The whole "
        "paragraph stresses VISUAL labour ('drawing and inking') and "
        "treats the comic as art; 'artwork' captures both the visual unit "
        "and the 'object of beauty' framing."
    ),
    steps=[
        S(1, "Understand the gap",
          "The slot is a noun: 'the visceral quality of the [GAP] that "
          "compels'. The thing in the slot has a 'visceral quality' that "
          "draws readers back. Identify what kind of object the surrounding "
          "sentences treat the comic as — text? craft? image? language?"),
        S(2, "Read around the gap",
          "Just before: 'The work involved in filling a page is staggering "
          "by comparison with a page of text. The remuneration rarely "
          "matches all the writing and designing, drawing and inking, but "
          "the reward is a work of art which readers treat differently to a "
          "book with only a cover plate. Many keep their objects of beauty "
          "in plastic envelopes and repeatedly return to them, maybe just "
          "one page…' The paragraph stacks visual cues: filling a page, "
          "drawing and inking, work of art, objects of beauty, plastic "
          "envelopes."),
        S(3, "Identify the relationship",
          "The whole paragraph contrasts comics with plain text: comics are "
          "VISUAL OBJECTS readers preserve like collectibles. So the gap "
          "names the visual side of the comic — the artwork — as opposed to "
          "the writing. 'Visceral quality' (gut-level pull) fits with "
          "looking at pictures, not with reading words."),
        S(4, "Vocabulary check",
          "'Visceral' = felt in the body, gut-level (NOT intellectual). "
          "'Object of beauty' = aesthetic object kept for its visual value. "
          "'Artwork' = the visual art on the page. 'Method' = the technique "
          "used (process, not product). 'Language' = the verbal system "
          "(words, not images). 'Writing' = the text — the very thing the "
          "passage contrasts comics WITH ('staggering by comparison with a "
          "page of text').",
          tier="detail"),
        S(5, "Plug and test",
          "Plug each in. 'The visceral quality of the writing that compels' "
          "— directly contradicts the contrast with 'a page of text'; the "
          "paragraph is celebrating what makes comics DIFFERENT from "
          "writing. 'The visceral quality of the method that compels' — "
          "method is a process; you don't keep a process in a plastic "
          "envelope. 'The visceral quality of the artwork that compels' — "
          "clean fit: the visual labour, the objects of beauty kept in "
          "plastic, all point to artwork. 'The visceral quality of the "
          "language that compels' — same problem as 'writing': language is "
          "the verbal side."),
        S(6, "Conclusion",
          "The answer is C (artwork). The paragraph contrasts comics with "
          "plain text by celebrating their visual labour and aesthetic "
          "object-quality; 'artwork' names exactly that."),
    ],
    distractors=[
        D("A",
          "If you remember the rule as 'graphic novels are now literature', "
          "'writing' seems to fit the elevated literary status the rest of "
          "the article celebrates.",
          "The paragraph EXPLICITLY contrasts the page with 'a page of "
          "text' — writing is what graphic novels go BEYOND. Step 5 shows "
          "plugging 'writing' into the slot inverts the paragraph's "
          "central contrast."),
        D("B",
          "Quick scans land here when 'drawing and inking' is read as 'the "
          "method' rather than the product.",
          "Method describes HOW the artwork was made, not WHAT readers keep "
          "in plastic envelopes. Step 4 separates process from product; the "
          "slot needs the product (artwork)."),
        D("D",
          "It's tempting to read 'language' broadly as 'the language of "
          "comics' — a fashionable way to describe a medium.",
          "'Language' in standard English denotes a verbal system, and the "
          "paragraph is precisely about the NON-verbal side of comics. "
          "Step 3 surfaces this: visceral pull comes from images, not words."),
    ],
    technique=(
        "On cloze noun slots inside a paragraph that draws a CONTRAST (here, "
        "comics vs. plain text), the correct option names whichever side of "
        "the contrast the paragraph is currently celebrating. 'Visceral "
        "quality' + 'objects of beauty' + 'drawing and inking' all flag the "
        "VISUAL side — pick the option that names visuals (artwork), reject "
        "any option that names the side being contrasted against (writing, "
        "language)."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-036 — Voynich, Montemurro's claim. Ans D.
# Q: What is claimed by Marcelo Montemurro about the Voynich manuscript?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-036"] = E(
    solution_path=(
        "Montemurro's pitch is that an entropy-based analysis of word "
        "distribution can tell whether a text carries meaning. Apply it to "
        "the Voynich script and you find structure consistent with real "
        "language, which would falsify the hoax hypothesis. Studying word "
        "occurrence ⇒ fake-or-real verdict — exactly D."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks what is CLAIMED BY Montemurro specifically — "
          "filter for sentences attributed to him or his team. Skip Rugg's "
          "rebuttals and the author's framing; you only want Montemurro's "
          "own position."),
        S(2, "Locate the controlling lines",
          "His method: 'analysed the text using a technique that looks for "
          "word relationships that signify meaning.' His claim: information-"
          "rich words concentrate in topic-relevant sections (as in real "
          "language). His quoted line: 'Our analysis is the first that "
          "actually links these sections only by their linguistic structure.' "
          "The framing sentence: 'The idea is that information-rich words "
          "will appear more frequently…' tells you the entropy test is the "
          "fake-detector."),
        S(3, "Restate in plain English",
          "Montemurro's claim is methodological: by looking at WHERE words "
          "show up in a text (clustered vs. sprinkled), you can detect "
          "whether the text behaves like real meaningful language. Apply that "
          "test to Voynich and the Voynich text clusters like a real "
          "language. So word-occurrence patterns can settle the fake-or-real "
          "question, and his evidence points away from 'fake'."),
        S(4, "Vocabulary check",
          "'Entropy' here = a statistical measure of how evenly a word is "
          "spread across a text. 'Hoax' = a deliberate fake meant to deceive. "
          "'Information-rich' = carrying meaning specific to a topic. The "
          "phrase 'word occurrence' in option D maps onto 'how evenly "
          "distributed' a word is — exactly Montemurro's metric.",
          tier="detail"),
        S(5, "Match against the options",
          "A claims the 1912 copy isn't the original — Montemurro never "
          "makes a manuscript-authenticity claim about copies. B claims most "
          "depicted plants don't exist — that's Rugg-adjacent / botanical "
          "trivia, not Montemurro's analysis. C claims Voynich resembles "
          "Latin more than English/Chinese — the passage actually says "
          "'Voynichese' was 'most similar to the human languages' broadly, "
          "not specifically Latin. D — 'studying word occurrence can show "
          "whether or not the text is a fake' — names exactly Montemurro's "
          "methodological claim from step 3."),
        S(6, "Conclusion",
          "The answer is D. Montemurro's contribution is a method that uses "
          "word-occurrence patterns as a fake-detector, which is what D "
          "captures."),
    ],
    distractors=[
        D("A",
          "It's tempting to associate any analysis of a centuries-old "
          "manuscript with questions of provenance and authenticity.",
          "Montemurro's claims are about LINGUISTIC STRUCTURE in the text, "
          "not about which physical copy is older. Step 3 keeps method "
          "(word distribution) and provenance (manuscript copy) separate."),
        D("B",
          "Many stop at the colourful detail 'unrecognisable plants' in "
          "paragraph 1 and assume the analysis spoke to the plants.",
          "The plants are scene-setting in the opening paragraph; "
          "Montemurro's analysis is text-only (entropy of words). Step 1's "
          "filter — Montemurro-only — rules B out."),
        D("C",
          "If you remember the comparison set (Origin of Species in English, "
          "Records of the Grand Historien in Chinese, Confessions in "
          "Latin), 'Latin' looks specific and tempting.",
          "The passage says 'Voynichese' was 'most similar to the human "
          "languages' — meaning all three human-language references "
          "together, in contrast to Fortran code and yeast DNA. Step 5 catches "
          "the over-specific Latin claim."),
    ],
    technique=(
        "On 'what is claimed by NAMED PERSON' items, immediately filter the "
        "passage by attribution — only count sentences directly attributed "
        "to that person or their team. Distractors often quote facts from "
        "elsewhere in the article (other researchers, scene-setting, the "
        "author's voice) and put them in the named person's mouth."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-037 — Voynich. Ans A.
# Q: What is Montemurro's main conclusion?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-037"] = E(
    solution_path=(
        "Montemurro's headline finding is that the Voynich text behaves "
        "statistically like a real language — high-entropy words cluster by "
        "topic, scale domains match human languages — which 'links these "
        "sections only by their linguistic structure'. That is a conclusion "
        "of MEANINGFUL CONTENT, not nonsense. A."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks for Montemurro's MAIN conclusion. Distinguish "
          "between his method (his tool) and his conclusion (what the tool "
          "says). The conclusion is the verdict he reaches AFTER running the "
          "analysis."),
        S(2, "Locate the controlling lines",
          "Two main result lines. (1) 'When applied to the Voynich texts, "
          "the formula picked out several high-entropy words… they seemed "
          "to be specific to different sections of the manuscript, as in a "
          "real text.' (2) 'This revealed \"Voynichese\" to be most similar "
          "to the human languages' (compared with Fortran code and yeast "
          "DNA). Plus the direct quote: 'Our analysis is the first that "
          "actually links these sections only by their linguistic structure.'"),
        S(3, "Restate in plain English",
          "Run the entropy test on Voynich and you find the patterns of a "
          "REAL language: topic-specific clusters, scale domains that match "
          "human-language texts and don't match code or DNA. So Montemurro's "
          "conclusion is that the manuscript carries meaning — it isn't "
          "random nonsense."),
        S(4, "Vocabulary check",
          "'Meaningful text' = text that carries content, as opposed to "
          "random or hoax text. 'Scale domains' = stretches of text where "
          "topical words cluster together; large in novels, small in "
          "lists. 'Linguistic structure' = the patterns of a real language. "
          "Note: 'structure indicates meaningful text' is a CLAIM ABOUT "
          "CONTENT, not a claim about age or methodology.",
          tier="detail"),
        S(5, "Match against the options",
          "A — 'the structure of the script indicates that it contains "
          "meaningful text' — restates step 3 directly. B claims the script "
          "is older than previously believed — the passage never discusses "
          "dating. C claims more advanced mathematical models are needed — "
          "Montemurro thinks his model already settles the structural "
          "question; this is the OPPOSITE of his stance. D claims academic "
          "and non-academic texts differ in new ways — generic and unsupported; "
          "Montemurro compared Voynich to human languages and code/DNA, not "
          "academic vs. non-academic."),
        S(6, "Conclusion",
          "The answer is A. The whole experiment is designed to tell "
          "meaningful text from nonsense; the result lands on 'meaningful', "
          "which A names."),
    ],
    distractors=[
        D("B",
          "Quick scans land here when 'first that actually links these "
          "sections' is misread as a claim about dating priority.",
          "'First' modifies WHO links them via linguistic structure — i.e., "
          "the first STUDY to do so, not the first to date the manuscript. "
          "Step 3 keeps Montemurro's methodological priority and the "
          "manuscript's age separate."),
        D("C",
          "If you remember the rule as 'cautious scientists always say more "
          "work is needed', C sounds humble and methodologically correct.",
          "Montemurro presents his analysis as already settling the structural "
          "question — Rugg is the one offering competing low-tech "
          "explanations. Step 5 catches that 'more models needed' contradicts "
          "the assertive tone of Montemurro's quoted lines."),
        D("D",
          "On a first read, the academic comparison set (Darwin, Augustine, "
          "Chinese histories) suggests an academic-vs-non-academic axis.",
          "The comparison axis was HUMAN LANGUAGES vs. CODE/DNA, not academic "
          "vs. non-academic. D mis-classifies what was being compared "
          "(step 4)."),
    ],
    technique=(
        "On 'main conclusion' items, separate method from verdict before "
        "matching. The method is the tool; the conclusion is the verdict. "
        "Distractors often paraphrase the method ('a new analytical "
        "technique', 'a refined statistical approach') and dress it as a "
        "conclusion. The correct option states WHAT the analysis SAID, not "
        "WHAT the analysis IS."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-038 — Voynich. Ans A.
# Q: How can Gordon Rugg's opinion of Montemurro's analysis be best summarized?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-038"] = E(
    solution_path=(
        "Rugg accepts that Montemurro found real structural features but "
        "argues the same features could be produced by a low-tech hoax "
        "method (gibberish syllables under a punched card). He doesn't "
        "dispute the findings — he disputes the conclusion drawn from them. "
        "That's A."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks how Rugg's OPINION OF Montemurro's analysis is "
          "best summarised. You're characterising Rugg's stance toward "
          "Montemurro — does he reject the data, reject the interpretation, "
          "or want more evidence?"),
        S(2, "Locate the controlling lines",
          "Rugg's stance: 'The findings have not convinced Gordon Rugg of "
          "Keele University, UK, a proponent of the hoax hypothesis.' His "
          "alternative explanation: a 'low-tech method by which a smart "
          "trickster could create the entire Voynich manuscript without "
          "first inventing a secret language' — gibberish syllables under a "
          "card with three holes. His own concession: 'Rugg says this method "
          "could produce several of the features Montemurro found. \"You can "
          "have very simple processes that produce very complex outputs.\"'"),
        S(3, "Restate in plain English",
          "Rugg doesn't say the analysis is wrong or sloppy. He says: yes, "
          "Montemurro found patterns that look like language; but those "
          "patterns can be created by a clever hoax procedure, so the "
          "patterns don't prove meaning. So Rugg is rejecting the "
          "INTERPRETATION ('therefore Voynich is meaningful') while "
          "accepting the underlying observations."),
        S(4, "Vocabulary check",
          "'Proponent of the hoax hypothesis' = someone who argues Voynich "
          "is a fake. 'Smart trickster' = clever hoaxer. The phrase "
          "'interpretation of the result' in option A means the conclusion "
          "DRAWN from the data — which is what Rugg disputes, distinct from "
          "the data itself.",
          tier="detail"),
        S(5, "Match against the options",
          "A — 'Montemurro's interpretation of the result is not necessarily "
          "the correct one' — fits exactly: Rugg accepts the result, "
          "challenges the interpretation. B claims the methodology is "
          "seriously lacking — Rugg never attacks Montemurro's methodology; "
          "he offers an alternative explanation. C says the conclusions are "
          "probably correct but more evidence is needed — Rugg believes the "
          "OPPOSITE conclusion (hoax), not Montemurro's. D says Rugg's view "
          "STRENGTHENS Montemurro's claim — inverted; Rugg is a hoax "
          "proponent who weakens it."),
        S(6, "Conclusion",
          "The answer is A. Rugg doesn't attack the analysis itself, only "
          "the conclusion Montemurro draws from it — that's the textbook "
          "alternative-explanation move."),
    ],
    distractors=[
        D("B",
          "First instinct on an academic rebuttal is to assume the critic "
          "attacks the methodology — that's how most published critiques "
          "land.",
          "Rugg explicitly grants the findings — 'this method could produce "
          "several of the features Montemurro found'. Step 3 captures the "
          "stance: methodology accepted, interpretation rejected. B "
          "mis-identifies the target of the critique."),
        D("C",
          "If you remember the rule as 'more evidence is the cautious "
          "middle ground', C sounds like a fair-minded summary.",
          "Rugg isn't cautiously agreeing with Montemurro — he's actively "
          "arguing for the OPPOSITE conclusion (the manuscript is a hoax). "
          "Step 2 shows him offering a counter-mechanism, not asking for "
          "more data (step 5)."),
        D("D",
          "Left-to-right reading gives 'Rugg… proponent of the hoax "
          "hypothesis' and 'this method could produce several of the "
          "features' and misreads concession as endorsement.",
          "Rugg concedes that the features EXIST while arguing they can be "
          "explained without meaning — that WEAKENS Montemurro's case, not "
          "strengthens it. Step 5's polarity check catches this inversion."),
    ],
    technique=(
        "On 'how is X's opinion best summarised' items, classify the type "
        "of rebuttal before matching: (a) attacks the data, (b) attacks the "
        "methodology, (c) accepts the data but rejects the interpretation, "
        "(d) wants more evidence. Rugg here does (c) — the classic "
        "'underdetermination' move — and option A names that move."
    ),
    pitfall=(
        "Conceding the data while challenging the interpretation looks like "
        "agreement on a quick read. The hallmark of this move is the "
        "phrase 'could ALSO be explained by…' — when you see that, the "
        "critic is taking position (c), not endorsing the original "
        "conclusion."
    ),
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-039 — Voynich. Ans C.
# Q: What can be concluded about the author's general view of the debate?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-039"] = E(
    solution_path=(
        "The author lays out both sides without taking one, closes with "
        "Rugg's 'most interesting whodunnit ever, and somebody's ripped out "
        "the last three pages' (i.e., undecidable), and notes that even "
        "Rugg thinks Voynich 'will always have a special fascination'. The "
        "framing is 'no current way to settle it' — that's C."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks what can be CONCLUDED about the AUTHOR'S general "
          "view of the debate. You're reading for tone and structural "
          "framing, not for either Montemurro's or Rugg's position alone."),
        S(2, "Locate the controlling lines",
          "Structural moves by the author: (1) presents Montemurro's "
          "findings in detail; (2) presents Rugg's counter-hypothesis in "
          "equal detail, including Rugg's concession; (3) closes with Rugg's "
          "metaphor — 'the most interesting whodunnit ever, and somebody's "
          "ripped out the last three pages' — placed at the end without "
          "rebuttal. The author neither endorses nor dismisses either side."),
        S(3, "Restate in plain English",
          "The author reports two opposing positions and gives each one "
          "fair coverage. The final image — a whodunnit missing its last "
          "three pages — is a statement of UNSOLVABILITY at present. So the "
          "author's view is 'this debate is currently undecidable; we don't "
          "yet have a way to settle whether Voynich is real language or a "
          "hoax'."),
        S(4, "Vocabulary check",
          "'Whodunnit' = a mystery story whose central question is who did "
          "it. The metaphor 'ripped out the last three pages' = the "
          "resolution is missing. 'No obvious way to decide' in option C "
          "maps onto 'the last three pages are gone' — there is no current "
          "decision procedure.",
          tier="detail"),
        S(5, "Match against the options",
          "A claims all evidence indicates the manuscript is a fake — too "
          "one-sided; the author gives meaningful weight to Montemurro's "
          "case. B says we can be reasonably sure the text is meaningful — "
          "also one-sided in the opposite direction. C — 'no obvious way to "
          "decide whether the script is a fake' — names the unsolved-mystery "
          "framing (step 3) directly. D claims the arguments are based on "
          "opinion rather than evidence — but both sides bring concrete "
          "evidence (entropy analysis, the hoax-procedure demonstration); "
          "the author doesn't dismiss either as mere opinion."),
        S(6, "Conclusion",
          "The answer is C. The author's structural neutrality plus the "
          "closing 'missing last pages' image add up to 'currently "
          "undecidable'."),
    ],
    distractors=[
        D("A",
          "It's tempting to give Rugg's closing line extra weight because it "
          "comes LAST in the article — last word feels like author "
          "agreement.",
          "The closing line itself ('most interesting whodunnit ever') frames "
          "the question as UNRESOLVED, not as decided in favour of hoax. "
          "Step 4 makes the metaphor explicit. A reads the placement of the "
          "quote as endorsement, which it isn't."),
        D("B",
          "If you remember 'extraordinary findings make headlines' as a "
          "rule, you might assume the author shares Montemurro's "
          "enthusiasm.",
          "The author gives Rugg's counter-explanation full and respectful "
          "treatment — that's incompatible with 'reasonably sure the text "
          "is meaningful'. Step 2's structural reading shows the author "
          "stays neutral."),
        D("D",
          "Many stop at the strong personality contrast (Montemurro vs. "
          "Rugg) and read the debate as a personal dispute rather than a "
          "scientific one.",
          "Both sides present concrete evidence: entropy distributions on "
          "one side, a working hoax procedure on the other. Step 5 catches "
          "that D misclassifies the debate as opinion-only when the author "
          "frames it as evidence-based but unresolved."),
    ],
    technique=(
        "On 'author's general view' items, watch how the author DISTRIBUTES "
        "space and ORDERS the closing image. Equal coverage + an "
        "unresolved-mystery closing usually signals 'undecidable'. The "
        "correct option will use words like 'no obvious way', 'remains "
        "open', 'currently undecidable' — neutral framings, not partisan "
        "ones."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# host-2024-verb2-ELF-040 — Voynich. Ans A.
# Q: What is said about other possible uses for Montemurro's basic method?
# ─────────────────────────────────────────────────────────────────────────────
REGEN["host-2024-verb2-ELF-040"] = E(
    solution_path=(
        "Montemurro plans to apply the technique to DNA, neural signals, "
        "and — explicitly — to 'extract alien messages from background "
        "noise'. That alien-signal application is exactly what A names: "
        "identifying signs of life in outer space."
    ),
    steps=[
        S(1, "Understand the question",
          "The prompt asks about OTHER possible uses of Montemurro's basic "
          "method — i.e., applications beyond the Voynich script. Look for "
          "the sentences that project his technique outside this one "
          "manuscript."),
        S(2, "Locate the controlling lines",
          "'Montemurro hopes to apply the technique for text analysis next "
          "to DNA and neural signals. This might help geneticists home in "
          "on valuable stretches of DNA and reveal whether different parts "
          "of the brain communicate in specific ways. A similar method could "
          "extract alien messages from background noise.'"),
        S(3, "Restate in plain English",
          "Three planned uses are listed: (1) genetics — finding the "
          "meaningful stretches of DNA; (2) neuroscience — checking if brain "
          "regions communicate in language-like patterns; (3) SETI-style "
          "work — picking out alien messages from radio noise. Option A "
          "names the third use almost verbatim."),
        S(4, "Vocabulary check",
          "'Alien messages from background noise' = signals from extra-"
          "terrestrial intelligence buried in random radio static. "
          "'Identifying signs of life in outer space' in option A is the "
          "standard English description of the same SETI activity. The two "
          "phrasings are interchangeable here.",
          tier="detail"),
        S(5, "Match against the options",
          "A — 'identify signs of life in outer space' — matches 'extract "
          "alien messages from background noise' directly. B says it would "
          "improve readability of scientific texts — never mentioned. C "
          "says using it in DNA research is highly unrealistic — the OPPOSITE "
          "of the passage, which lists DNA as the first proposed application. "
          "D says the method's scientific value is doubtful — the passage's "
          "tone is enthusiastic about future applications, not sceptical."),
        S(6, "Conclusion",
          "The answer is A. The 'extract alien messages from background "
          "noise' line is the SETI use, and only A names that."),
    ],
    distractors=[
        D("B",
          "If you remember the rule as 'better text analysis = more "
          "readable text', B sounds like a natural extension of a textual "
          "method.",
          "The passage talks about IDENTIFYING meaningful structure in text, "
          "not about REWRITING text for clarity. Step 3's list doesn't "
          "include readability work; B invents an application."),
        D("C",
          "Quick scans land here when 'apply the technique next to DNA' is "
          "misread as 'next to' meaning 'instead of' or 'as opposed to' "
          "DNA.",
          "'Next' here means 'as the next target' — DNA is one of the "
          "planned applications, not something the method is ruled out for. "
          "Step 2's controlling line treats DNA enthusiastically (step 5)."),
        D("D",
          "First instinct on contested science is to land on 'doubtful "
          "scientific value' — the Rugg side has cast doubt on Voynich.",
          "Rugg's doubts are about the VOYNICH INTERPRETATION specifically; "
          "the future-applications paragraph is in Montemurro's voice and "
          "is unambiguously optimistic. Step 5's tone-check catches the "
          "voice mix-up."),
    ],
    technique=(
        "On 'other possible uses' items, hunt for paragraphs that switch "
        "tense or aspect — 'hopes to apply', 'might help', 'could extract' — "
        "they list future applications. Each option must either match one "
        "of the listed applications or be ruled out as invented. Treat any "
        "option that introduces an application NOT on the list as a "
        "fabrication."
    ),
    pitfall=None,
)

# ─────────────────────────────────────────────────────────────────────────────
# Write output every 5 entries, then final.
# ─────────────────────────────────────────────────────────────────────────────
OUT_PATH = Path("audit/_regen/host-2024-elf.json")
OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Stream in groups of 5 to satisfy "save every 5 entries"
ordered_keys = list(REGEN.keys())
partial = {}
for i, k in enumerate(ordered_keys, 1):
    partial[k] = REGEN[k]
    if i % 5 == 0 or i == len(ordered_keys):
        OUT_PATH.write_text(json.dumps(partial, indent=2, ensure_ascii=False, sort_keys=True))
        print(f"wrote {i}/{len(ordered_keys)}")

print(f"DONE. Total entries: {len(REGEN)}. Path: {OUT_PATH}")
