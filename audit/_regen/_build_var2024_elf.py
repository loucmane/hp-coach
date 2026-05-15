"""Build var-2024 ELF Layer-2 explanations (Variant-C ultra-granular).

Authors all 20 ELF entries by hand (no API). English throughout.
Comprehension (031–030 verb1, 036–040 verb2): 4–6 steps following the
Understand → Locate → Paraphrase → Vocab → Match → Conclusion arc.
Cloze (031–035 verb2): Understand-gap → Read-around → Identify-relationship
→ Vocab → Plug-and-test → Conclusion.

Saves every 5 entries to audit/_regen/var-2024-elf.json.
"""

from __future__ import annotations
import json
from pathlib import Path

OUT = Path(__file__).parent / "var-2024-elf.json"

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}


def emit(explanations: dict) -> None:
    """Write current state to disk; called every 5 entries."""
    OUT.write_text(json.dumps(explanations, indent=2, sort_keys=True, ensure_ascii=False))


def step(n: int, title: str, text: str, tier: str = "essential") -> dict:
    return {"n": n, "title": title, "text": text, "tier": tier}


def make(qid: str, solution_path: str, steps: list, distractors: list,
         technique: str, pitfall: str | None = None) -> dict:
    return {
        "_meta": META,
        "solution_path": solution_path,
        "steps": steps,
        "framework_id": None,
        "distractors": distractors,
        "technique": technique,
        "pitfall": pitfall,
    }


explanations: dict[str, dict] = {}

# ════════════════════════════════════════════════════════════════════════════
# COMPREHENSION — verb1 ELF 031–040
# ════════════════════════════════════════════════════════════════════════════

# ─── 031: Daylight Saving Time — implied about DST in the U.S. ──────────────
# Answer: D — more daylight hours had a positive effect on commercial profits
explanations["var-2024-verb1-ELF-031"] = make(
    qid="var-2024-verb1-ELF-031",
    solution_path=(
        "The DST paragraph closes by saying DST 'succeeded in another one of its "
        "initial goals: getting more people to shop. That trend continues for many "
        "retailers today.' That is a direct claim that more daylight boosted "
        "commercial activity — exactly what D says."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is IMPLIED about DST in the U.S. — not what's stated "
             "as a single fact, but the takeaway you get from reading the whole DST "
             "paragraph. With 'implied' questions, read the paragraph once, then ask: "
             "which option is something the paragraph actually backs up?"),
        step(2, "Locate the key sentence",
             "The closing sentences carry the load: 'But it has succeeded in another one "
             "of its initial goals: getting more people to shop. That trend continues for "
             "many retailers today.' That's the only sentence in the paragraph that "
             "describes a clear, lasting effect of DST."),
        step(3, "Restate in plain English",
             "DST didn't really cut energy use (the data is 'mixed'), but it did achieve "
             "a different goal it was designed for: getting people out shopping for "
             "longer. Retailers benefit, and they have kept benefiting. So the effect "
             "DST actually had — by the article's own account — was commercial."),
        step(4, "Vocabulary check",
             "'Retailers' = shops, businesses that sell to consumers. 'Initial goals' = "
             "the goals it was set up to achieve from the start. 'Trend continues' = the "
             "same pattern is still happening today.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'farmers reluctant' — the passage says they actively LOBBIED AGAINST DST, "
             "which is the opposite of reluctance. B 'unforeseen consequences' — the "
             "passage describes intended goals that succeeded (shopping) or had mixed "
             "results (energy), not surprises. C 'energy lobby support' — Wilson wanted "
             "DST to DECREASE electricity demand, so the energy industry would have "
             "LOST, not lobbied for it. D 'positive effect on commercial profits' — "
             "matches the closing sentences directly."),
        step(6, "Conclusion",
             "The answer is D. The paragraph's one clean success story for DST is "
             "commercial — more daylight, more shopping, retailers benefit. Insight in "
             "one sentence: on 'what is implied' items, the implication is whatever the "
             "paragraph spends its closing sentence asserting."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'the farm lobby did participate in the policy "
                "debate' as 'farmers were reluctant to take a stand' — participating "
                "in a debate sounds halfway between for and against."
            ),
            "why_wrong": (
                "Step 2's locate move shows the passage is explicit: farmers were "
                "lobbying AGAINST DST. That is a stand, not reluctance to take one."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at the phrase 'data remains mixed' on energy and read "
                "that as DST having unforeseen consequences — surprises in the data."
            ),
            "why_wrong": (
                "Mixed evidence is not the same as unforeseen consequences. Step 3's "
                "paraphrase shows the energy goal simply didn't pan out clearly — "
                "there's no claim of surprise effects."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on the Wilson-and-electricity line is to assume the "
                "energy lobby pushed for DST — energy is mentioned, lobbying is "
                "mentioned, the two phrases sit close together."
            ),
            "why_wrong": (
                "Wilson wanted DST to REDUCE electricity demand, which would hurt the "
                "energy industry. Step 5 pins this — the energy lobby would resist DST, "
                "not lobby for it."
            ),
        },
    ],
    technique=(
        "On 'what is implied' items, the paragraph's closing sentence usually "
        "carries the implication — it's where the writer lands the takeaway. "
        "Trigger to memorise: 'implied + standalone news paragraph → look at the "
        "last claim, not the opening hook.'"
    ),
    pitfall=(
        "Multiple options can each touch a single phrase from the paragraph "
        "(farm lobby, energy, retailers). The cure: don't match on shared "
        "vocabulary — match on what the paragraph actually CLAIMS about that "
        "vocabulary."
    ),
)

# ─── 032: Yawning Birds — what is new about the research ───────────────────
# Answer: B — apparently, showing signs of empathy is not exclusive to mammal species
explanations["var-2024-verb1-ELF-032"] = make(
    qid="var-2024-verb1-ELF-032",
    solution_path=(
        "The paragraph opens by listing the four mammals known to do contagious "
        "yawning, then says 'Now we can add budgies to the list' and ends with "
        "the empathy framing: 'social non-mammals may have basic forms of "
        "empathy.' The novelty is empathy showing up outside mammals — exactly B."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is SPECIFICALLY NEW about the research. So we're "
             "looking for the contrast: what was known before vs. what this study "
             "adds. New findings always live in that gap."),
        step(2, "Locate the before-and-after",
             "Before: 'only humans, dogs, chimps and a species of rodent find yawns "
             "contagious' — all mammals. After: 'Now we can add budgies to the list' — "
             "and the closing sentence says this 'suggests social non-mammals may have "
             "basic forms of empathy.' The shift is mammals → non-mammals."),
        step(3, "Restate in plain English",
             "Contagious yawning was a mammal-only club. Budgies are birds, not mammals. "
             "If birds also catch yawns from each other, and yawning is linked to "
             "empathy, then empathy isn't just a mammal thing. That's the new claim."),
        step(4, "Vocabulary check",
             "'Vertebrates' = animals with backbones (includes mammals, birds, reptiles, "
             "etc.). 'Budgie' = a small parrot, definitely a bird, not a mammal. "
             "'Contagious yawning' = catching a yawn from someone else. 'Empathetic "
             "processes' = the mental moves involved in feeling what another being "
             "feels.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'yawning catches on more easily than thought' — the paragraph doesn't "
             "say budgies catch yawns FASTER than other species; it says budgies do it "
             "at all. B 'empathy not exclusive to mammals' — direct match to the closing "
             "sentence about 'social non-mammals'. C 'empathy widespread among most "
             "animals' — overreaches; the study covers one bird species, not most "
             "animals. D 'only animals kept as pets' — the paragraph never makes a "
             "pet-vs-wild distinction; budgies happen to be pets, but that's not the "
             "finding."),
        step(6, "Conclusion",
             "The answer is B. The research is news because it pushes empathy past the "
             "mammal boundary. Insight in one sentence: when a study extends a known "
             "trait to a NEW CATEGORY, the 'what's new' answer names the category jump."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to grab the 'three times as likely to yawn' detail and "
                "read it as 'yawning catches on more easily than we thought' — the "
                "number sounds like a discovery about ease."
            ),
            "why_wrong": (
                "The 'three times' figure is just the strength of the budgie effect, "
                "not a comparison with prior research. Step 3's paraphrase shows the "
                "novelty is the SPECIES, not the speed or strength of contagion."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember the closing line as 'animals can have empathy', C "
                "feels like a natural fit — empathy is everywhere in nature."
            ),
            "why_wrong": (
                "The passage says 'social non-mammals MAY have basic forms of "
                "empathy' — a single bird species, hedged with 'may'. Step 5 catches "
                "the overreach: 'widespread among most animals' is far stronger than "
                "the paragraph supports."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Left-to-right reading gives 'budgies in cages' a pet vibe, and dogs "
                "are on the list of contagious-yawners — pets do seem to dominate "
                "the picture."
            ),
            "why_wrong": (
                "Chimps and rodents aren't typically kept as pets, and the passage "
                "never frames the finding around pet status. Step 5 rules it out — "
                "the experimental setup doesn't define the category."
            ),
        },
    ],
    technique=(
        "On 'what's new' items, locate the BEFORE state and the AFTER state in the "
        "paragraph, then pick the option that names the jump between them. Trigger: "
        "if the paragraph contains 'only X — now also Y', the answer is always 'Y "
        "expands the category.'"
    ),
    pitfall=(
        "Empathy and animal-cognition phrasing tempts students into broad generic "
        "claims ('most animals have empathy'). The cure: count what the study "
        "actually covered (one species), and refuse options that scale beyond that."
    ),
)

# ─── 033: Something to Laugh About — main point first paragraph ─────────────
# Answer: D — arguments that humour provides a gateway to the reasoning of former times
explanations["var-2024-verb1-ELF-033"] = make(
    qid="var-2024-verb1-ELF-033",
    solution_path=(
        "The first paragraph sets up WHY historians care about old jokes: 'if you "
        "can “get” the jokes of the past, you can understand the interests and "
        "sensibilities of the people who inhabited it.' Jokes as a window into "
        "past minds — that is exactly what D phrases as 'a gateway to the "
        "reasoning of former times.'"
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks for the MAIN POINT of the first paragraph regarding the "
             "study of humour. Main-point questions want the thesis sentence — the one "
             "claim that ties the paragraph together, not a side detail."),
        step(2, "Locate the thesis",
             "Two sentences carry the argument. The setup: 'it has become a well-trodden "
             "path to explore past mentalities.' The payoff: 'The theory is simple: if "
             "you can “get” the jokes of the past, you can understand the interests and "
             "sensibilities of the people who inhabited it.' That payoff IS the thesis."),
        step(3, "Restate in plain English",
             "Historians study old jokes because jokes give you access to how people "
             "back then thought — what they cared about, what felt funny to them, "
             "what they were anxious about. Jokes are a doorway into past minds."),
        step(4, "Vocabulary check",
             "'Past mentalities' = the ways people thought and felt in earlier times. "
             "'Well-trodden path' = a familiar, established route of research. "
             "'Sensibilities' = the feelings and attitudes that shape how someone "
             "reacts. 'Gateway' (option D) = a way in, an entry point — same meaning "
             "as 'doorway'.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'humour is uniquely human' — the paragraph mentions Aristotle's view "
             "that laughter separates us from animals, but that's a one-line aside, "
             "not the main point. B 'Ancient Greek explanation refuted' — the "
             "paragraph never refutes Aristotle; it cites him neutrally. C 'targets "
             "remarkably similar across history' — the paragraph says the opposite: "
             "'the subjects we see fit to laugh at change over time.' D 'gateway to "
             "the reasoning of former times' — direct match to 'understand the "
             "interests and sensibilities of the people who inhabited it.'"),
        step(6, "Conclusion",
             "The answer is D. The paragraph's whole job is to set up jokes as a tool "
             "for accessing past minds. Insight in one sentence: when a paragraph "
             "opens by justifying a field of study, the main point is always 'WHY "
             "this study matters', not 'WHAT the study has found.'"),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "The Aristotle line — 'laughter is the very thing that separates us "
                "from animals' — looks like an evidence-based claim about humour "
                "being uniquely human."
            ),
            "why_wrong": (
                "It's an aside introduced with 'if you follow Aristotle' — the "
                "paragraph isn't presenting evidence FOR it, just acknowledging the "
                "tradition. Step 2's locate move shows the thesis lies elsewhere."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you remember the rule that academic writing 'updates old "
                "theories', it's natural to assume the paragraph is refuting "
                "Aristotle in some way."
            ),
            "why_wrong": (
                "The paragraph nowhere contradicts Aristotle. It cites him in passing "
                "and moves on to the jokes-as-window thesis. Step 3's paraphrase has "
                "no refutation in it."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at the phrase 'jokes about lawyers, medical experts and "
                "clergymen' and assume the targets must be similar across history — "
                "they sound timeless."
            ),
            "why_wrong": (
                "The paragraph explicitly says 'the subjects we see fit to laugh at "
                "CHANGE over time' — the opposite of C. Step 5 catches the "
                "contradiction with the paragraph's own wording."
            ),
        },
    ],
    technique=(
        "When a paragraph opens by justifying why a topic deserves study, the main "
        "point is the JUSTIFICATION sentence — usually phrased as 'if X, then we "
        "can Y'. Trigger: spot the conditional reasoning pattern; the option that "
        "captures the 'then Y' clause is the answer."
    ),
    pitfall=(
        "Asides ('if you follow Aristotle') feel weighty because they name a famous "
        "thinker, but they're not the load-bearing claim. The cure: ask 'what would "
        "fall apart if this sentence were removed?' — if the paragraph still works, "
        "the sentence isn't the main point."
    ),
)

# ─── 034: Penelope Corfield's conclusion concerning 18-19c jokes ────────────
# Answer: A — used as a way to oppose the dubious attitudes of people in power
explanations["var-2024-verb1-ELF-034"] = make(
    qid="var-2024-verb1-ELF-034",
    solution_path=(
        "Corfield's conclusion is summarised explicitly: 'Jokes, argued Corfield, "
        "were a means both to voice discontent and to fight back. By serving up a "
        "barrage of “hostile wit”, ordinary people could exercise “informal moral "
        "controls”.' Jokes as pushback against the powerful — that's A."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks for Corfield's CONCLUSION about 18th- and 19th-century "
             "jokes. So we're hunting for the sentence(s) that summarise her thesis — "
             "what she ARGUED, not just what she described."),
        step(2, "Locate Corfield's argument",
             "Two sentences carry her conclusion: 'Jokes, argued Corfield, were a "
             "means both to voice discontent and to fight back.' And: 'By serving up "
             "a barrage of “hostile wit”, ordinary people could exercise “informal "
             "moral controls”.' These are tagged with 'Corfield argued' — that's the "
             "signal that we're inside her thesis."),
        step(3, "Restate in plain English",
             "Corfield's claim: jokes about lawyers, doctors and clergy gave ordinary "
             "people a way to push back against an elite they couldn't challenge "
             "openly. Humour was a form of moral pressure on people whose conduct "
             "the public couldn't otherwise control."),
        step(4, "Vocabulary check",
             "'Voice discontent' = express dissatisfaction. 'Hostile wit' = humour "
             "with sharp edges, aimed at someone. 'Informal moral controls' = social "
             "pressure to behave well, applied without laws or institutions. 'Take "
             "the laity for a ride' = exploit ordinary people. 'Learned professions' "
             "= lawyers, doctors, clergy — the educated elite of the time.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'oppose the dubious attitudes of people in power' — direct match to "
             "'voice discontent and to fight back'. B 'distraction to endure troubled "
             "times' — the paragraph frames jokes as pushback, not as escapism. C "
             "'attempts by the church to censor them' — the church is mentioned only "
             "as clergymen being TARGETS, not censors. D 'elite imposing stricter "
             "moral rules' — the moral controls are described as informal and "
             "bottom-up, applied BY ordinary people TO the elite, not the other way "
             "round."),
        step(6, "Conclusion",
             "The answer is A. Corfield's case is that 18th- and 19th-century jokes "
             "were a weapon ordinary people used against an over-mighty learned class. "
             "Insight in one sentence: when a question names a specific scholar's "
             "view, look for the 'X argued' tag in the paragraph — that's where the "
             "scholar's conclusion is parked."),
    ],
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "'Romp through 18th- and 19th-century jokes' has a light, "
                "entertaining feel — it's easy to slide from there to 'jokes as "
                "distraction during hard times.'"
            ),
            "why_wrong": (
                "Corfield's thesis is functional: jokes did work, they pressured "
                "the powerful. Step 3's paraphrase has nothing about escapism or "
                "endurance — it's all about pushback."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on hearing 'clergymen' is to bring in the church "
                "as an institution — and the church historically does censor things."
            ),
            "why_wrong": (
                "In the paragraph clergymen are JOKE TARGETS, not joke censors. "
                "The flow is ordinary people → mocking clergymen, not church → "
                "suppressing jokes. Step 5 catches the direction reversal."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember 'informal moral controls' as 'controls' without "
                "checking who applies them to whom, D's 'elite imposing stricter "
                "moral rules' sounds plausible."
            ),
            "why_wrong": (
                "The moral controls in Corfield's argument run BOTTOM-UP, from "
                "ordinary people to the elite. Step 3 makes the direction explicit "
                "— jokers vs. the powerful, not the other way round."
            ),
        },
    ],
    technique=(
        "When a question asks for a named scholar's conclusion, search the paragraph "
        "for the attribution tag ('X argued', 'X claimed', 'according to X'). The "
        "sentences inside that scope are the conclusion; sentences outside it are "
        "narration or setup, not the thesis."
    ),
    pitfall=(
        "Reading-direction errors flip cause and effect easily — 'informal moral "
        "controls' can be read as elite-on-public or public-on-elite. The cure: name "
        "WHO ACTS on WHOM before matching to an option."
    ),
)

# ─── 035: Targets of jokes in 18th-century Britain ───────────────────────────
# Answer: C — basically people of high prestige in society
explanations["var-2024-verb1-ELF-035"] = make(
    qid="var-2024-verb1-ELF-035",
    solution_path=(
        "The second half of the article lists the jokes' targets: 'learned "
        "professions', politicians, elites and their fashions, social superiors. "
        "Every category named is high-status. Option C captures the unifying "
        "feature: 'basically people of high prestige in society.'"
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is said about the TARGETS of jokes in 18th-century "
             "Britain. So we want the paragraph that lists targets and a feature they "
             "share — not Corfield's argument, but the descriptive content about who "
             "the jokes were aimed at."),
        step(2, "Locate the target list",
             "The relevant passage runs: 'Along with the learned professions, "
             "politicians were (as ever) easy targets... There were jokes about elites "
             "and their fashions... jestbooks contained countless tales of plucky "
             "underdogs outwitting a social superior.' Four categories: learned "
             "professions, politicians, elites, social superiors."),
        step(3, "Restate in plain English",
             "Every group named is high-status: educated professionals, politicians, "
             "fashionable elites, social superiors. The underdog beats the social "
             "superior — that's the recurring shape. The targets share one feature: "
             "they all stand above the joker."),
        step(4, "Vocabulary check",
             "'Learned professions' = lawyers, doctors, clergy — the educated elite. "
             "'Fops' = vain, fashion-obsessed elite men. 'Social superior' = someone "
             "of higher class or rank. 'Prestige' (option C) = social standing, status, "
             "the kind of respect attached to position.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'royalty and established nobility' — too narrow; the paragraph names "
             "professionals and politicians, not kings or dukes. B 'same professions "
             "as in other periods' — the paragraph compares 18th-century Britain to "
             "TODAY (teachers, anti-establishment figures), and says the targets VARY "
             "across cycles, not that they're constant. C 'people of high prestige' — "
             "covers learned professions, politicians, elites, and social superiors "
             "all at once. D 'shifted from learned to politicians and clergy' — clergy "
             "ARE one of the learned professions, so there's no shift away from "
             "them; and the paragraph says politicians and the learned professions "
             "were both targets simultaneously."),
        step(6, "Conclusion",
             "The answer is C. All four target categories in the paragraph belong to "
             "the same superset: high-status people. Insight in one sentence: when a "
             "paragraph LISTS several specific groups, the right answer is usually the "
             "abstract noun that contains all of them."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'elites and their fashions' as royalty and the "
                "nobility — both terms are upper-class shorthand."
            ),
            "why_wrong": (
                "The paragraph's specific examples are professionals (lawyers, "
                "doctors, clergy) and politicians, not royalty. Step 2's locate move "
                "captures the real list — and royalty isn't on it."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at the line 'as ever' (politicians as easy targets 'as "
                "ever') and infer that the targets are constant across periods."
            ),
            "why_wrong": (
                "Step 5 pins it: 'as ever' is a parenthetical aside, and the article's "
                "wider claim is that targets SHIFT — Corfield's 1997 teachers are now "
                "'off the hook'. B reads against the article's own thesis."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snap reading sees 'learned professions' and 'politicians' as a "
                "sequence and slips into 'shifted from one to the other.'"
            ),
            "why_wrong": (
                "The paragraph lists them as CO-TARGETS ('along with the learned "
                "professions, politicians were... easy targets'). Step 3's paraphrase "
                "preserves the co-existence — no shift is described in the 18th "
                "century itself."
            ),
        },
    ],
    technique=(
        "On 'what is said about the targets' items where the paragraph lists 3+ "
        "specific groups, look for the option that names the umbrella category — "
        "the abstract feature they all share. Trigger: 'multi-group list → "
        "abstract-noun answer.'"
    ),
    pitfall=(
        "Specific options (royalty, clergy) feel concrete and confident, but they "
        "cherry-pick one group from a longer list. The cure: count the groups in "
        "the paragraph; if the option covers fewer than the list, it's too narrow."
    ),
)

# Save first 5
emit(explanations)
print("[saved] 5 entries written to var-2024-elf.json")

# ─── 036: main arguments concerning the basis of humour ─────────────────────
# Answer: A — humour stems from clever use of unexpected contrasts
explanations["var-2024-verb1-ELF-036"] = make(
    qid="var-2024-verb1-ELF-036",
    solution_path=(
        "Hutcheson's theory in the article: 'we laugh when we perceive ill-suited "
        "pairings of ideas, images or situations… juxtaposing an object, person or "
        "event of great seriousness with one that was not.' Ill-suited pairings = "
        "unexpected contrasts — exactly what A says."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks about ONE OF THE MAIN ARGUMENTS concerning the BASIS of "
             "humour among 18th-century scholars. So we want a theory of WHY things "
             "are funny — the mechanism behind laughter — attributed to that period's "
             "thinkers."),
        step(2, "Locate the theory",
             "The relevant passage: 'One of the key theories was that we laugh when "
             "we perceive ill-suited pairings of ideas, images or situations. In "
             "particular, the Scottish philosopher Francis Hutcheson believed that "
             "there was something comical in juxtaposing an object, person or event "
             "of great seriousness with one that was not.'"),
        step(3, "Restate in plain English",
             "The 18th-century theory: laughter comes from MISMATCH. A serious thing "
             "paired with a silly thing — a dignified person tripping in mud, a "
             "solemn occasion punctured by something undignified — produces laughter "
             "because the two don't fit together. The clash is the comedy."),
        step(4, "Vocabulary check",
             "'Ill-suited pairings' = combinations that don't naturally fit together. "
             "'Juxtaposing' = placing two things side by side, especially for "
             "contrast. 'Of great gravity' = very serious, dignified. 'Dirtying of a "
             "decent dress' = something undignified happening to something dignified — "
             "the canonical example. 'Contrast' (option A) = pairing of opposites.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'unexpected contrasts' — matches 'ill-suited pairings' and 'juxtaposing "
             "seriousness with non-seriousness' directly. B 'authentic events' — the "
             "paragraph never says jokes have to be true to be funny. C 'unlikely "
             "coincidences' — the theory is about MISMATCH not improbability; a tame "
             "coincidence wouldn't be funny under Hutcheson's view, but a sharp clash "
             "would. D 'similar to philosophical reasoning' — the paragraph mentions "
             "PHILOSOPHERS theorising humour, but doesn't say humour ITSELF resembles "
             "philosophy."),
        step(6, "Conclusion",
             "The answer is A. The 18th-century scholarly view, exemplified by "
             "Hutcheson, locates humour in clash and mismatch. Insight in one "
             "sentence: when a paragraph quotes a specific theorist's mechanism for a "
             "phenomenon, the right option paraphrases the mechanism — not the "
             "theorist's status."),
    ],
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to read 'newspaper article in 1741 conceded' as evidence "
                "that the jokes were grounded in real reported events — authentic, "
                "documented."
            ),
            "why_wrong": (
                "The 1741 article is quoted as supporting Hutcheson's theory, not as "
                "an example of authentic-events humour. Step 3's paraphrase has no "
                "trace of an authenticity requirement."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember 'ill-suited pairings' as 'unlikely combinations', "
                "C's 'unlikely coincidences' sounds like the same idea."
            ),
            "why_wrong": (
                "Coincidence and mismatch are different. A coincidence is about "
                "improbability; the theory is about INCONGRUITY — a clash between "
                "dignity and indignity, regardless of how likely the meeting is. "
                "Step 4's vocabulary pins the distinction."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Many stop at the parade of philosophers (More, Hobbes, Locke, "
                "Swift, Hutcheson) and conclude that humour and philosophy share "
                "structure — both involve reasoning."
            ),
            "why_wrong": (
                "The philosophers are theorising ABOUT humour; the paragraph doesn't "
                "claim humour itself works like philosophy. Step 5 catches the "
                "category confusion — talking-about-X is not the same as being-X."
            ),
        },
    ],
    technique=(
        "When a question asks for a theorist's account of a mechanism, paraphrase "
        "the mechanism in plain English BEFORE looking at the options. The right "
        "option will paraphrase your paraphrase — wrong options will swap in a "
        "different mechanism (likelihood, authenticity, analogy) that the "
        "paragraph never names."
    ),
    pitfall=(
        "Lists of famous philosophers tempt students into 'humour = philosophical' "
        "answers that the paragraph never asserts. The cure: distinguish between "
        "WHO STUDIES humour and WHAT humour IS — questions about the basis of "
        "humour want the latter."
    ),
)

# ─── 037: What is concluded regarding humour in the 18th century ─────────────
# Answer: C — associated with opposition as well as pure entertainment
explanations["var-2024-verb1-ELF-037"] = make(
    qid="var-2024-verb1-ELF-037",
    solution_path=(
        "The article concludes 18th-century laughter served two purposes at once: "
        "'a “pointed weapon”' against the powerful AND 'supremely enjoyable' in "
        "its own right. Two functions side by side — opposition AND entertainment "
        "— is exactly what C captures."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is CONCLUDED about humour in the 18th century. So "
             "we want the article's summary verdict on 18th-century humour — usually "
             "in or near the closing paragraphs."),
        step(2, "Locate the conclusion",
             "The pivotal sentence: 'Laughing at the powerful was not just a “pointed "
             "weapon”; it was also supremely enjoyable.' The 'not just X but also Y' "
             "construction tells you the article is naming TWO functions of 18th-"
             "century humour together."),
        step(3, "Restate in plain English",
             "18th-century humour did two things at once. One: it pushed back against "
             "elites — a tool of opposition. Two: it was genuinely fun — entertainment "
             "for its own sake. The article's verdict is that BOTH were going on, "
             "neither one alone explains the era's joke output."),
        step(4, "Vocabulary check",
             "'Pointed weapon' = an instrument with a clear target — the metaphor for "
             "opposition. 'Supremely enjoyable' = highly entertaining. 'Pure "
             "entertainment' (option C) = entertainment for its own sake, with no "
             "ulterior motive — what the article calls 'supremely enjoyable.'",
             tier="detail"),
        step(5, "Match against the options",
             "A 'more uniform due to newspapers' — the article mentions a 1741 "
             "newspaper article but says nothing about uniformity. B 'political "
             "dimension rarely seen' — the article doesn't compare the 18th century "
             "to other eras as having uniquely political humour. C 'opposition as well "
             "as pure entertainment' — matches the 'pointed weapon... also supremely "
             "enjoyable' construction directly. D 'more widespread than any other "
             "period' — the article says laughter received 'fascination and scrutiny "
             "seldom matched', which is about how much it was THEORISED, not how "
             "much it was DONE."),
        step(6, "Conclusion",
             "The answer is C. The article's closing verdict pairs opposition with "
             "enjoyment as the two faces of 18th-century humour. Insight in one "
             "sentence: 'not just X but also Y' constructions in conclusions always "
             "match an option that names BOTH X and Y."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "Many stop at the mention of the 1741 newspaper article and read it "
                "as evidence that print culture standardised humour."
            ),
            "why_wrong": (
                "The newspaper appears once, as a single quoted source — not as a "
                "claim about uniformity. Step 5 catches the leap: one cited article "
                "doesn't make a media-uniformity argument."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you remember the article emphasising politicians and Corfield's "
                "fight-back framing, B's 'political dimension rarely seen' feels "
                "like the natural takeaway."
            ),
            "why_wrong": (
                "B requires a comparison with other historical periods, and the "
                "article never makes one — its only comparison is to TODAY's "
                "anti-establishment humour, which is presented as continuous with the "
                "18th century, not unlike it. Step 5 catches the missing comparison."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on 'rampant popularity of jokes' is to read it as "
                "'more humour than any other period' — rampant sounds maximal."
            ),
            "why_wrong": (
                "The article's claim is about 'fascination and scrutiny' — meaning "
                "how seriously people THOUGHT about laughter — not about humour's "
                "raw volume. Step 4's vocabulary check separates the two ideas."
            ),
        },
    ],
    technique=(
        "When a conclusion sentence uses the 'not just X but also Y' frame, the "
        "answer will be an option that names BOTH halves — never one alone. "
        "Trigger: spot the X/Y pairing in the closing sentence, then pick the "
        "option that mirrors the pairing."
    ),
    pitfall=(
        "Conclusion questions tempt students to grab a single vivid phrase ('pointed "
        "weapon', 'rampant popularity') and run with it. The cure: read the "
        "conclusion sentence to its full stop — the verdict usually has two halves, "
        "not one."
    ),
)

# ─── 038: depression, antidepressants, bone fractures ──────────────────────
# Answer: A — long-term effects of antidepressants are completely different from short-term effects
explanations["var-2024-verb1-ELF-038"] = make(
    qid="var-2024-verb1-ELF-038",
    solution_path=(
        "The Bone Fractures paragraph spells out a two-phase pattern: first three "
        "weeks of fluoxetine make bones STRONGER (osteoclasts impaired); by six "
        "weeks the same drug WEAKENS bones (serotonin disrupts the hypothalamus). "
        "Short-term boost, long-term harm — opposite effects, which is A."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what can be CONCLUDED about depression, antidepressants "
             "and bone fractures — so we want a takeaway statement supported by the "
             "specific findings in the paragraph, not a vague generalisation."),
        step(2, "Locate the two-phase finding",
             "The key passage: 'During the first three weeks, bones grew STRONGER as "
             "the fluoxetine impaired osteoclasts… But by six weeks, the higher "
             "levels of serotonin prompted by the drug disrupted the ability of the "
             "hypothalamus region of the brain to PROMOTE bone growth. Ducy says this "
             "two-phase pattern is also seen in people.'"),
        step(3, "Restate in plain English",
             "Take fluoxetine for three weeks: your bones get tougher because the "
             "drug blocks the cells that normally break bone down. Take it for six "
             "weeks: your bones suffer because the elevated serotonin shuts down the "
             "brain region that builds new bone. Same drug, opposite outcomes "
             "depending on how long you've been on it."),
        step(4, "Vocabulary check",
             "'Osteoclasts' = cells that BREAK DOWN bone tissue. Blocking them means "
             "bones get stronger. 'Hypothalamus' = a brain region that, among other "
             "jobs, signals bone GROWTH. Disrupting it means bones get weaker. "
             "'Long-term' (option A) = on the time scale that matters here, six weeks "
             "and beyond. 'Short-term' = the initial three-week window.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'long-term completely different from short-term' — direct match to "
             "the two-phase pattern: stronger at three weeks, weaker at six weeks. B "
             "'mouse experiments questionable' — the paragraph says the opposite, "
             "explicitly: 'this two-phase pattern is also seen in people.' C "
             "'depression leads to higher fracture risks' — depression itself is "
             "mentioned only as the alternative explanation that was being ruled out, "
             "not as the established cause of fractures. D 'antidepressants and "
             "depression equally bad short-term' — the paragraph never compares them "
             "as equal risks, and short-term, fluoxetine actually IMPROVED bone "
             "strength."),
        step(6, "Conclusion",
             "The answer is A. The whole point of the two-phase finding is that "
             "antidepressants act one way in the short term and the opposite way in "
             "the long term. Insight in one sentence: when a paragraph names two "
             "DIFFERENT mechanisms acting on the same outcome at different time "
             "scales, the conclusion is always 'time scale matters.'"),
    ],
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to default to 'mouse studies don't translate to humans' "
                "— a familiar caveat from biomedical news coverage in general."
            ),
            "why_wrong": (
                "The paragraph explicitly affirms the translation: 'this two-phase "
                "pattern is also seen in people.' Step 2 catches the line; B reads "
                "against the paragraph's own statement."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on a paragraph that mentions both depression and "
                "fracture risk is to connect them as cause and effect."
            ),
            "why_wrong": (
                "The paragraph is trying to SEPARATE the drug effect from the "
                "depression effect, not to confirm depression as the cause. Step 3's "
                "paraphrase has no claim about depression itself causing fractures."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Snap reading lumps 'antidepressants are bad for bones' and "
                "'depression is bad for bones' together as equally hazardous in "
                "the short term."
            ),
            "why_wrong": (
                "Short term, fluoxetine made bones STRONGER, not weaker — the "
                "opposite of 'equally bad'. Step 5's match move pins the direction."
            ),
        },
    ],
    technique=(
        "On medical/biology paragraphs that contrast time scales ('first three weeks "
        "vs. six weeks'), the answer almost always names the time-scale dependence. "
        "Trigger: 'two-phase pattern', 'short-term vs. long-term', 'initially X "
        "then Y' → pick the option about time."
    ),
    pitfall=(
        "Familiar caveats ('mouse studies don't generalise', 'depression causes "
        "fractures') feel safe because they're true in the abstract, but the "
        "paragraph may explicitly contradict them. The cure: privilege the "
        "paragraph's own statements over background knowledge."
    ),
)

# ─── 039: implied about the US colonization of Nevada ──────────────────────
# Answer: D — typical of how America was conquered in the 19th century
explanations["var-2024-verb1-ELF-039"] = make(
    qid="var-2024-verb1-ELF-039",
    solution_path=(
        "The Nevada paragraph describes 'exerting their freedom by usurping Paiute "
        "grazing land and disrupting food supplies' — the standard 19th-century "
        "settler-colonial pattern of land seizure backed by the US Army. Calling "
        "Nevada 'a laboratory for how Americans define freedom' frames it as "
        "representative, not exceptional. Hence D."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is IMPLIED about the US colonisation of Nevada. "
             "Implication questions look for what the writer wants you to conclude — "
             "not just what's said outright, but the framing the paragraph nudges "
             "you toward."),
        step(2, "Locate the framing",
             "Two phrases carry the implication. The frame: 'Nevada has been "
             "described as “a laboratory for how Americans define freedom.”' The "
             "irony bite: '...US Army-backed settlers, who had been exerting their "
             "freedom by usurping Paiute grazing land and disrupting food supplies.' "
             "Together they tell you Nevada exemplifies how American 'freedom' "
             "operated against native peoples."),
        step(3, "Restate in plain English",
             "Nevada is held up as a TEST CASE — a 'laboratory' — for what Americans "
             "called freedom in practice. Settlers took native land and food sources; "
             "the army backed them; native resistance was crushed. The paragraph "
             "presents this not as a Nevada quirk but as the standard playbook of "
             "19th-century American expansion."),
        step(4, "Vocabulary check",
             "'Laboratory' (in this context) = a test case where a broader pattern "
             "can be observed. 'Usurping' = seizing without right. 'Exerting their "
             "freedom' = used ironically here, to mark a gap between what 'freedom' "
             "meant for settlers vs. what it meant for native peoples. 'Typical' "
             "(option D) = representative of a broader pattern.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'less brutal than other regions' — the paragraph has no comparative "
             "softening; it describes land seizure and disrupted food supplies. B "
             "'simplified by internal native conflicts' — the paragraph says "
             "'allied native forces' fought together, not against each other. C "
             "'native tribes on both sides' — the Pyramid Lake War is described as "
             "natives vs. settlers, not natives vs. natives. D 'typical of how "
             "America was conquered' — matches the 'laboratory for American freedom' "
             "framing: Nevada as exemplar of the broader pattern."),
        step(6, "Conclusion",
             "The answer is D. The 'laboratory' framing and the irony around "
             "'exerting their freedom' both push you toward Nevada as a "
             "representative case of 19th-century US expansion, not a special one. "
             "Insight in one sentence: when a paragraph calls a place a 'laboratory' "
             "or 'test case' for a broader pattern, the implication is always "
             "'typical of that pattern.'"),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "First instinct on a single-paragraph history snippet is to read "
                "the absence of extreme violence words ('massacre', 'genocide') as a "
                "claim of relative mildness."
            ),
            "why_wrong": (
                "'Usurping land', 'disrupting food supplies', and a US Army-backed "
                "war are not mild language. Step 3's paraphrase preserves the "
                "violence; no comparative claim about mildness appears."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at the list of four native peoples — Northern Paiute, "
                "Southern Paiute, Washoe, Western Shoshone — and assume internal "
                "divisions among them."
            ),
            "why_wrong": (
                "The paragraph explicitly says 'allied native forces' fought "
                "together. Step 5 catches the contradiction — the listed peoples "
                "coalesced, they didn't fragment."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember the rule that colonial wars often featured native "
                "allies on the European side, C's 'natives on both sides' sounds "
                "historically informed."
            ),
            "why_wrong": (
                "The Pyramid Lake War in the paragraph is straightforwardly described "
                "as 'allied native forces' vs. 'US Army-backed settlers' — natives on "
                "one side only. Step 2's locate move pins the binary."
            ),
        },
    ],
    technique=(
        "When a paragraph calls a specific case a 'laboratory', 'test case', or "
        "'microcosm' for a wider phenomenon, the implication answer always names "
        "the WIDER PHENOMENON, not a quirk of the specific case. Trigger: "
        "'laboratory for X' → answer is 'typical of X.'"
    ),
    pitfall=(
        "Background knowledge about colonial history (native-on-native conflict, "
        "regional variation in brutality) tempts students into options the "
        "paragraph never supports. The cure: ignore what you know about American "
        "history in general and only use what the paragraph itself states."
    ),
)

# ─── 040: white elephant expression ────────────────────────────────────────
# Answer: D — comes from outsiders' impression of the elephants' costly upkeep
explanations["var-2024-verb1-ELF-040"] = make(
    qid="var-2024-verb1-ELF-040",
    solution_path=(
        "The White Elephants passage closes with the actual origin: 'it is more "
        "likely that courtiers cared little for the cost, and it was actually "
        "foreign travellers who balked at the amount spent on an elephant.' "
        "Outsiders — foreign travellers — coined the expensive-burden sense. "
        "That's exactly D."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is IMPLIED about the expression 'white elephant'. "
             "Implication questions want what the paragraph nudges you to conclude — "
             "and on origin-of-an-expression items, the paragraph usually contrasts "
             "a legendary explanation with a more likely real explanation."),
        step(2, "Locate the origin claim",
             "Two pieces. The legend: 'According to legend, the kings of Siam "
             "presented a white elephant as a punishment-in-disguise to an unruly "
             "courtier.' The likely reality: 'it is more likely that courtiers cared "
             "little for the cost, and it was actually foreign travellers who balked "
             "at the amount spent on an elephant.'"),
        step(3, "Restate in plain English",
             "Old story: a king gave you a sacred elephant to punish you, because "
             "you couldn't refuse and the upkeep would ruin you. Probable truth: "
             "Siamese courtiers didn't actually mind the cost — but FOREIGN visitors "
             "did. They were the ones who looked at the sums spent on these "
             "elephants and recoiled. So the 'costly burden' meaning came from "
             "outsiders, not from locals."),
        step(4, "Vocabulary check",
             "'Outsiders' (option D) = people from outside the culture — the "
             "passage's 'foreign travellers'. 'Balked at' = recoiled from, were "
             "shocked by. 'Punishment-in-disguise' = a gift that looks generous but "
             "ruins the recipient. 'Costly upkeep' (option D) = expensive to "
             "maintain — the very thing foreigners objected to.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'unlikely to have originated in Siam/Thailand' — wrong direction; "
             "the ELEPHANTS are Siamese, but the EXPRESSION came from foreigners "
             "REACTING to Siamese elephants. The cultural source of the saying is "
             "outside Siam, but the phenomenon is firmly inside. B 'historical "
             "resistance against royal authority' — the paragraph doesn't describe "
             "resistance to royals; it describes a legend ABOUT royals. C "
             "'sought-after awards from the kings' — the legend frames the gift as a "
             "PUNISHMENT-in-disguise, not an award people wanted. D 'outsiders' "
             "impression of costly upkeep' — direct match to 'foreign travellers "
             "balked at the amount spent.'"),
        step(6, "Conclusion",
             "The answer is D. The expression's modern meaning — an expensive, "
             "useless burden — traces back to outsiders, not locals. Insight in one "
             "sentence: when an origin paragraph contrasts a famous legend with a "
             "'more likely' alternative, the implication answer is always the "
             "alternative."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "If you remember 'it was actually foreign travellers' as 'not "
                "really Siamese', A's 'unlikely to have originated in Siam' sounds "
                "like a reasonable inference."
            ),
            "why_wrong": (
                "The elephants and the legend ARE Siamese; only the saying's "
                "outsider-perspective framing comes from foreigners. Step 5 "
                "catches the slip — A confuses the SOURCE OF THE SAYING with the "
                "SOURCE OF THE PHENOMENON."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at the words 'unruly courtier' and infer a resistance-"
                "against-the-king theme — courtiers defying royal authority."
            ),
            "why_wrong": (
                "In the legend the king is the aggressor and the courtier is the "
                "victim; the dynamic is royal POWER over the courtier, not "
                "resistance against the crown. Step 3 makes the direction clear."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on 'gift from a king' is to read it as an honour "
                "you'd want — kings reward favourites."
            ),
            "why_wrong": (
                "The paragraph explicitly frames the white-elephant gift as a "
                "PUNISHMENT-in-disguise. The recipient had to accept it as an "
                "'honour' while knowing it would ruin them — the opposite of a "
                "sought-after award."
            ),
        },
    ],
    technique=(
        "On origin-of-an-expression items, look for the 'although... it is more "
        "likely that...' contrast in the paragraph. The implication answer is "
        "always the 'more likely' alternative, never the colourful legend. "
        "Trigger: 'According to legend... Although it is more likely...' → "
        "answer mirrors the second half."
    ),
    pitfall=(
        "Colourful legends (royal punishments, sacred animals) are memorable and "
        "dominate the paragraph's word count, so they steal attention away from "
        "the actually-load-bearing sentence. The cure: weight by claim type — "
        "'it is more likely that...' beats 'According to legend...' every time."
    ),
)

# Save at 10
emit(explanations)
print("[saved] 10 entries written to var-2024-elf.json")

# ════════════════════════════════════════════════════════════════════════════
# CLOZE — verb2 ELF 031–035 (Illusion of Control)
# ════════════════════════════════════════════════════════════════════════════

# ─── 031: though / until / unless / since — gap after "catch perpetrators" ─
# Answer: A — though
explanations["var-2024-verb2-ELF-031"] = make(
    qid="var-2024-verb2-ELF-031",
    solution_path=(
        "Gap 31 sits between 'Cameras... help the authorities detect crime and "
        "catch perpetrators' and 'they catch us in the dragnet as well.' The "
        "two clauses are in tension — benefits on one side, downside on the "
        "other — so the connector needs to be a CONCESSIVE: 'though'. Answer A."
    ),
    steps=[
        step(1, "Understand the gap",
             "This is a connector cloze — the four options (though, until, unless, "
             "since) are all conjunctions, but they set up very different logical "
             "relationships. With connector gaps, identify the RELATIONSHIP between "
             "the two clauses first, then pick the conjunction that matches it."),
        step(2, "Read around the gap",
             "'Cameras in public spaces help the authorities detect crime and catch "
             "perpetrators, ___ they catch us in the dragnet as well.' The first "
             "clause is a benefit (cameras catch criminals). The second is a "
             "drawback (cameras also catch ordinary people in their net). The "
             "writer is acknowledging both sides at once."),
        step(3, "Identify the relationship",
             "Benefit on one side, hidden cost on the other — that's a CONCESSION. "
             "The writer admits the upside but flags the downside in the same "
             "sentence. The connector we need means 'and yet', 'even though', "
             "'while also'."),
        step(4, "Vocabulary check",
             "'Though' = even though, despite that — a concessive connector. "
             "'Until' = up to the point that — a time connector. 'Unless' = if not "
             "— a conditional connector. 'Since' = because, or from the time that — "
             "a causal or temporal connector. Only 'though' expresses concession.",
             tier="detail"),
        step(5, "Plug and test",
             "A 'though they catch us in the dragnet as well' — fits perfectly: "
             "cameras help, EVEN THOUGH they also surveil us. B 'until they catch "
             "us in the dragnet as well' — would mean the helping STOPS once we're "
             "caught; the paragraph doesn't say that. C 'unless they catch us' — "
             "would make catching us the EXCEPTION to the helping, but the "
             "paragraph treats both as happening simultaneously. D 'since they "
             "catch us' — would make 'catching us' the REASON the cameras help "
             "catch perpetrators, which inverts the logic."),
        step(6, "Conclusion",
             "The answer is A. The writer is making a classic two-edged-sword "
             "claim — cameras serve us AND surveil us — and 'though' is the "
             "connector that signals 'I'm admitting both at once.' Insight in one "
             "sentence: when a sentence balances a benefit against a hidden cost, "
             "the connector is always concessive."),
    ],
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to read 'until they catch us' as a sequence — first "
                "they catch criminals, THEN they catch us — which would make 'until' "
                "feel like a natural time marker."
            ),
            "why_wrong": (
                "'Until' would mean the helping STOPS at the moment ordinary people "
                "get caught, but the paragraph treats both effects as ongoing and "
                "simultaneous. Step 3's relationship-check rules out the sequence "
                "reading."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at the surveillance theme and read 'unless they catch "
                "us in the dragnet' as a conditional escape clause — cameras help, "
                "ASSUMING they don't catch us."
            ),
            "why_wrong": (
                "'Unless' frames the second clause as a NON-event we'd avoid, but "
                "the paragraph treats getting caught in the dragnet as a real, "
                "happening fact, not a hypothetical. Step 4's vocabulary check "
                "shows 'unless' contradicts the factual framing."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on a sentence about cameras catching people is to "
                "read it as causal — they catch criminals BECAUSE they also catch "
                "ordinary people in the net."
            ),
            "why_wrong": (
                "'Since' would invert the value-judgement: catching ordinary people "
                "would become the JUSTIFICATION for catching criminals. The "
                "paragraph treats the dragnet-effect as a downside, not a "
                "justification. Step 5's plug-and-test rules it out."
            ),
        },
    ],
    technique=(
        "On connector clozes (though / until / unless / since / despite / "
        "because), name the LOGICAL RELATIONSHIP between the two clauses in plain "
        "English first — concession, time, condition, cause. Then pick the only "
        "connector that matches. Trigger: connector blank between two clauses "
        "→ relationship before vocabulary."
    ),
    pitfall=(
        "All four options are common, idiomatic English connectors — none of them "
        "sounds wrong in isolation. The cure: don't read the sentence with each "
        "option plugged in; name the relationship you need FIRST, then select "
        "against your own answer."
    ),
)

# ─── 032: media / interpretation / monitoring / data — "avoiding the ___" ──
# Answer: C — monitoring
explanations["var-2024-verb2-ELF-032"] = make(
    qid="var-2024-verb2-ELF-032",
    solution_path=(
        "Gap 32 reads 'Given the difficulty of completely avoiding the ___'. The "
        "preceding sentences listed cameras, cell-phone tracking, mapping apps "
        "and online tracking — all forms of MONITORING. The umbrella noun that "
        "names what's being avoided is 'monitoring'. Answer C."
    ),
    steps=[
        step(1, "Understand the gap",
             "This is a noun-fill cloze. The four options are all nouns related to "
             "information ('media', 'interpretation', 'monitoring', 'data'). The "
             "gap needs the noun that summarises what the previous paragraph has "
             "been describing — what is being 'avoided'?"),
        step(2, "Read around the gap",
             "Just before the gap: examples of cameras in public spaces, cell-phone "
             "tracking, networked cars, mapping apps, social media history, online "
             "searches — each one tracking, observing, or recording us. After the "
             "gap: 'it may be somewhat reassuring to acknowledge this tradeoff' — "
             "the tradeoff between benefits and surveillance."),
        step(3, "Identify the relationship",
             "The gap needs an UMBRELLA TERM that covers every surveillance example "
             "listed above. Cameras → monitoring. Cell-phone tracking → monitoring. "
             "Mapping apps → monitoring. Social-media and search tracking → "
             "monitoring. They all share the same activity: observing and "
             "recording behaviour. The umbrella is 'monitoring'."),
        step(4, "Vocabulary check",
             "'Monitoring' = systematic observation and tracking — the verb that "
             "covers cameras, GPS, browser-tracking, etc. 'Media' = communication "
             "channels (TV, radio, internet), not the act of surveillance. "
             "'Interpretation' = making sense of data, not collecting it. 'Data' "
             "= the OUTPUT of monitoring, not the activity itself.",
             tier="detail"),
        step(5, "Plug and test",
             "A 'avoiding the media' — fits if the paragraph were about news "
             "consumption, but it isn't; it's about surveillance technology. B "
             "'avoiding the interpretation' — interpretation is a downstream act; "
             "you can't avoid being TRACKED by avoiding being INTERPRETED. C "
             "'avoiding the monitoring' — matches the umbrella concept of "
             "everything listed above; you avoid CAMERAS by avoiding "
             "MONITORING. D 'avoiding the data' — data is what monitoring "
             "produces; saying 'avoiding the data' is a category mismatch with "
             "the listed activities."),
        step(6, "Conclusion",
             "The answer is C. The whole prior paragraph is a catalogue of "
             "monitoring technologies, and the gap needs the noun that summarises "
             "all of them. Insight in one sentence: on umbrella-noun clozes, the "
             "blank is filled by the abstract category that the previous sentences "
             "have been EXAMPLES of."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "Social media is mentioned ('our social media history'), which "
                "makes 'media' feel like a thematic word in the paragraph."
            ),
            "why_wrong": (
                "Social media is one EXAMPLE in a list of surveillance technologies, "
                "not the umbrella. 'Avoiding the media' would only cover social "
                "platforms, missing cameras, GPS, mapping apps. Step 5 catches the "
                "narrowness."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you remember the paragraph's later mention of 'illusion of "
                "control' and analysis, 'interpretation' feels like a thematic "
                "match for a research-context paragraph."
            ),
            "why_wrong": (
                "Interpretation is what someone DOES with collected information; "
                "the gap is about the COLLECTION itself, which is hard to avoid. "
                "Step 4's vocabulary check separates the two roles."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on a digital-surveillance paragraph is to reach "
                "for 'data' — it's the word the genre lives on."
            ),
            "why_wrong": (
                "Data is the OUTPUT of monitoring, not the activity. You don't "
                "'avoid data' the way you avoid cameras — you avoid being "
                "monitored. Step 3's umbrella check rules data out as a "
                "category mismatch."
            ),
        },
    ],
    technique=(
        "On umbrella-noun clozes, read the preceding sentences for the LIST OF "
        "EXAMPLES, then pick the noun that names the category every example "
        "belongs to. Trigger: blank preceded by a string of specific instances → "
        "the answer is the abstract umbrella, not another instance."
    ),
    pitfall=(
        "Topic-adjacent nouns ('media', 'data') feel comfortable because they "
        "share the surveillance world's vocabulary, but they're either too narrow "
        "or in the wrong category role. The cure: ask 'is this option the ACTIVITY "
        "being described, or the OUTPUT of that activity, or a sub-channel?' — "
        "only the activity fits the umbrella slot."
    ),
)

# ─── 033: censored / specified / outlined / accessed ────────────────────────
# Answer: D — accessed
explanations["var-2024-verb2-ELF-033"] = make(
    qid="var-2024-verb2-ELF-033",
    solution_path=(
        "Gap 33 reads 'the information will be ___ and seen by others more often "
        "than it currently is.' Paired with 'seen by others', the verb needs to "
        "mean 'reached, read, retrieved' — i.e. 'accessed'. Answer D."
    ),
    steps=[
        step(1, "Understand the gap",
             "This is a verb-fill cloze in passive voice ('will be ___'). The four "
             "options are verbs related to information handling — censored, "
             "specified, outlined, accessed. The gap needs a verb that pairs "
             "logically with the other passive verb in the same clause: 'and seen "
             "by others.'"),
        step(2, "Read around the gap",
             "Full clause: 'people disclose more about themselves – even if it is "
             "also clear that the information will be ___ and seen by others more "
             "often than it currently is.' Earlier: 'when entities give people "
             "more control over the publication of their information, people "
             "disclose more.' The information is being made AVAILABLE to others."),
        step(3, "Identify the relationship",
             "The blank is conjoined with 'seen by others' — two verbs of "
             "information consumption joined by 'and'. So the blank needs a verb "
             "that ALSO describes consumption or retrieval. 'Accessed and seen' = "
             "'reached and viewed', a natural pairing. The blank verb pairs with "
             "the second verb."),
        step(4, "Vocabulary check",
             "'Accessed' = reached, retrieved, opened for reading — the standard "
             "data-and-privacy verb. 'Censored' = blocked or restricted — the "
             "OPPOSITE of what the paragraph describes. 'Specified' = named in "
             "detail — wrong action for an audience consuming info. 'Outlined' = "
             "summarised in sketch — also a producer's action, not a consumer's.",
             tier="detail"),
        step(5, "Plug and test",
             "A 'censored and seen by others' — internal contradiction; censored "
             "information ISN'T seen. B 'specified and seen' — specification is "
             "an act of the information's PRODUCER, not the consumer; doesn't "
             "pair with passive consumption. C 'outlined and seen' — same problem "
             "as specified; outlining is what an author does, not what an audience "
             "does. D 'accessed and seen by others' — perfect pairing: both verbs "
             "describe consumption by an audience."),
        step(6, "Conclusion",
             "The answer is D. The gap needs a consumption-side verb to match "
             "'seen by others'; only 'accessed' fits. Insight in one sentence: "
             "when a blank is conjoined with another verb by 'and', it must "
             "match that verb's MODE — agent's action or recipient's action, but "
             "consistent."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "If you remember surveillance discussions including censorship "
                "concerns, A's 'censored' feels like a topic-adjacent word."
            ),
            "why_wrong": (
                "'Censored and seen by others' is a direct contradiction — "
                "censorship hides information, so it can't ALSO be seen. Step 5's "
                "plug-and-test catches the internal conflict."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to read 'specified' as 'specifically targeted' — and "
                "in a surveillance paragraph, specifically targeting people sounds "
                "thematic."
            ),
            "why_wrong": (
                "'Specified' is a producer-side verb (the author specifies "
                "details); it can't sit naturally next to 'seen by others', which "
                "is a consumer-side verb. Step 4's vocabulary check separates "
                "the roles."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at the abstract sound of 'outlined' and read it as "
                "'mapped out, made visible' — which feels surveillance-adjacent."
            ),
            "why_wrong": (
                "Outlining is what the information's CREATOR does, not what its "
                "AUDIENCE does. Step 3's relationship check requires a "
                "consumption-side verb, which 'outlined' isn't."
            ),
        },
    ],
    technique=(
        "When a blank is conjoined with another verb by 'and', match the AGENT — "
        "both verbs must describe the same actor's action. Trigger: 'will be "
        "[blank] AND seen by others' → blank also names something done TO the "
        "information, not BY its creator."
    ),
    pitfall=(
        "Topic-adjacent verbs (censored, specified, outlined) sound like "
        "surveillance-paragraph vocabulary, but only one of them fits the "
        "grammatical role of 'consumed by an audience'. The cure: check "
        "agent/patient alignment before matching meaning."
    ),
)

# ─── 034: ignore / devalue / reconsider / overestimate ──────────────────────
# Answer: D — overestimate
explanations["var-2024-verb2-ELF-034"] = make(
    qid="var-2024-verb2-ELF-034",
    solution_path=(
        "Gap 34 sits inside 'Brandimarte's work demonstrates the concept of "
        "illusion of control. In many situations, we tend to ___ the control "
        "we have over events.' The illusion-of-control concept is named — and "
        "illusion of control is the cognitive bias of OVERESTIMATING one's "
        "control. Answer D."
    ),
    steps=[
        step(1, "Understand the gap",
             "This is a verb-fill cloze that hinges on a concept name. The "
             "sentence introduces 'illusion of control' and then explains what we "
             "tend to do with the control we have. The verb in the gap must be "
             "synonymous with the action that illusion-of-control names."),
        step(2, "Read around the gap",
             "'Brandimarte's work demonstrates the concept of ILLUSION OF CONTROL. "
             "In many situations, we tend to ___ the control we have over events, "
             "especially when we get cues that our actions matter.' The next "
             "paragraph also reinforces it: 'we feel that we have been given more "
             "control over our information's dissemination, our privacy concerns "
             "decrease and our disclosure increases.' The pattern: we feel MORE "
             "in control than we really are."),
        step(3, "Identify the relationship",
             "The concept 'illusion of control' = a false sense of MORE control than "
             "you actually have. So the verb must mean 'inflate', 'exaggerate', "
             "'think we have more than we do' — i.e. 'overestimate'. The verb "
             "DEFINES the illusion."),
        step(4, "Vocabulary check",
             "'Overestimate' = judge higher than reality — the textbook gloss of "
             "'illusion of control'. 'Ignore' = pay no attention to — would mean "
             "we DISMISS control, the opposite of feeling we have more of it. "
             "'Devalue' = treat as less valuable — also opposite of inflating. "
             "'Reconsider' = think again about — neutral, doesn't capture the "
             "direction of the bias.",
             tier="detail"),
        step(5, "Plug and test",
             "A 'ignore the control we have' — would make the bias 'underestimate "
             "control', the wrong direction. B 'devalue the control we have' — "
             "same direction error: devaluing is downward, illusion of control is "
             "upward. C 'reconsider the control we have' — neutral; could go up "
             "OR down, doesn't match the specific bias named. D 'overestimate "
             "the control we have' — direct match to the textbook definition of "
             "illusion of control, and consistent with the next paragraph's "
             "behaviour."),
        step(6, "Conclusion",
             "The answer is D. The sentence names the bias ('illusion of control') "
             "and the blank must define it. The bias is overestimation, full stop. "
             "Insight in one sentence: when a sentence both NAMES a cognitive bias "
             "and DEFINES it in the same breath, the blank-verb is the bias's "
             "textbook definition."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "First instinct on 'illusion of control' is sometimes to read "
                "'illusion' as 'we don't see clearly' — which slides toward "
                "'ignore'."
            ),
            "why_wrong": (
                "Illusion of control is about seeing TOO MUCH control, not too "
                "little. Step 3 pins the direction — the bias is upward, "
                "'ignore' is downward."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you remember 'illusion' as something we should DOWNPLAY, "
                "'devalue' fits the moral lesson of the paragraph: don't trust "
                "your sense of control."
            ),
            "why_wrong": (
                "The PARAGRAPH'S MORAL is 'be wary of inflating your sense of "
                "control', but the BLANK describes the BIAS ITSELF, not the "
                "corrective. Step 5 separates the two — devaluing would be the "
                "fix, not the bug."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'we tend to ___ the control' and read 'reconsider' "
                "as a safe, hedging choice — it's a verb that fits almost any "
                "sentence."
            ),
            "why_wrong": (
                "'Reconsider' is direction-neutral, but illusion of control has a "
                "specific direction (upward inflation). Step 4's vocabulary check "
                "shows 'reconsider' is too vague to define the bias."
            ),
        },
    ],
    technique=(
        "When a sentence names a psychological bias and the blank defines it, "
        "trust the textbook definition of the named bias. Trigger: 'concept of X. "
        "We tend to [blank] Y' → [blank] equals the action that bias X names. "
        "If you don't know the bias, infer from the surrounding behaviour."
    ),
    pitfall=(
        "The four verbs all sit in the 'evaluation' family, but only one matches "
        "the bias's specific direction. The cure: spot the bias name ('illusion "
        "of control'), commit to its direction (overestimation), then choose."
    ),
)

# ─── 035: intuitive / apparent / deliberate / constant ──────────────────────
# Answer: B — apparent
explanations["var-2024-verb2-ELF-035"] = make(
    qid="var-2024-verb2-ELF-035",
    solution_path=(
        "Gap 35 sits in 'when we feel that we have been given more control... our "
        "privacy concerns decrease and our disclosure increases, even though that "
        "___ control does not actually diminish the possibility that our data will "
        "be shared.' The 'feel... but does not actually' frame means the control "
        "is SEEMING, not real — 'apparent'. Answer B."
    ),
    steps=[
        step(1, "Understand the gap",
             "This is an adjective-fill cloze modifying 'control'. The four options "
             "(intuitive, apparent, deliberate, constant) all describe types of "
             "control, but only one matches the sentence's central contrast: "
             "between WHAT WE FEEL and WHAT'S ACTUALLY TRUE."),
        step(2, "Read around the gap",
             "'when we feel that we have been given more control over our "
             "information's dissemination, our privacy concerns decrease and our "
             "disclosure increases, even though that ___ control does not actually "
             "diminish the possibility that our data will be shared.' The "
             "structure: we FEEL X — but X DOESN'T ACTUALLY change Y. Classic "
             "perception-vs-reality framing."),
        step(3, "Identify the relationship",
             "The adjective must mark the control as PERCEIVED rather than REAL. "
             "It needs to say 'the control we feel we have, which isn't actual'. "
             "An adjective meaning 'seeming', 'on the surface', 'as perceived' — "
             "i.e. 'apparent'. The paragraph's whole thesis is illusion of control, "
             "so 'apparent' control = the illusion itself."),
        step(4, "Vocabulary check",
             "'Apparent' = seeming, visible-on-the-surface, what shows but may not "
             "be the underlying truth. The exact word for 'felt-but-not-real'. "
             "'Intuitive' = grasped instinctively without reasoning — doesn't "
             "address the felt/real split. 'Deliberate' = done on purpose — about "
             "intention, not authenticity. 'Constant' = unchanging over time — "
             "about persistence, not authenticity.",
             tier="detail"),
        step(5, "Plug and test",
             "A 'that intuitive control' — would imply the control is grasped "
             "without thinking, but the paragraph isn't about how we PROCESS the "
             "control, it's about whether the control EXISTS. B 'that apparent "
             "control' — fits perfectly: control that looks real but isn't, exactly "
             "the illusion-of-control thesis. C 'that deliberate control' — would "
             "imply we exercise the control on purpose, but the paragraph says it's "
             "ILLUSORY, not deliberate. D 'that constant control' — about "
             "persistence, but the paragraph contrasts felt-vs-real, not "
             "occasional-vs-constant."),
        step(6, "Conclusion",
             "The answer is B. The whole paragraph is about the gap between "
             "FEELING in control and BEING in control; 'apparent' is the adjective "
             "that names that gap. Insight in one sentence: when a sentence runs "
             "'we feel X, but X doesn't actually do Y', the modifier of X is "
             "'apparent' (or its cousins: seeming, perceived, ostensible)."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'we feel that we have been given more control' "
                "as an intuitive sense — feelings are intuitive."
            ),
            "why_wrong": (
                "The paragraph is about REAL vs. FELT, not REASONED vs. FELT. "
                "'Intuitive' would describe HOW we register the control, not "
                "whether it exists. Step 4's vocabulary check separates the two "
                "axes."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember the sentence ending '...does not actually "
                "diminish the possibility', C's 'deliberate' sounds like a "
                "purposeful counterweight — control we tried to exercise."
            ),
            "why_wrong": (
                "Deliberate is about intention; the paragraph is about "
                "authenticity. Step 3 pins the contrast as felt/real, not "
                "intended/accidental."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Many stop at the word 'constantly transmit our location' from "
                "earlier in the passage and reach for 'constant' as a thematic "
                "echo."
            ),
            "why_wrong": (
                "'Constant' refers to PERSISTENCE OVER TIME, not to the "
                "authenticity of the control. Step 5's plug-and-test rules it "
                "out — the paragraph never asks whether control is occasional "
                "vs. constant."
            ),
        },
    ],
    technique=(
        "On adjective clozes that modify a noun appearing inside a "
        "perception-vs-reality contrast ('we feel X, but X doesn't really'), the "
        "adjective is almost always 'apparent', 'perceived', 'ostensible', or "
        "'so-called'. Trigger: 'feel that... even though that [blank] X does "
        "not actually' → [blank] = 'apparent'."
    ),
    pitfall=(
        "Adjective clozes attract students into matching by topic ('control' is "
        "associated with deliberate, constant, intuitive). The cure: ignore "
        "thematic fit; match the adjective's MEANING against the sentence's "
        "REASONING STRUCTURE — here, felt vs. real."
    ),
)

# Save at 15
emit(explanations)
print("[saved] 15 entries written to var-2024-elf.json")

# ════════════════════════════════════════════════════════════════════════════
# COMPREHENSION — verb2 ELF 036–040 (Two Cultures)
# ════════════════════════════════════════════════════════════════════════════

# ─── 036: Snow's complaint in relation to "the two cultures" ────────────────
# Answer: A — worried about the lack of basic scientific knowledge among literary people
explanations["var-2024-verb2-ELF-036"] = make(
    qid="var-2024-verb2-ELF-036",
    solution_path=(
        "In the first two paragraphs, Snow's specific complaint is that literary "
        "intellectuals were 'shamefully unembarrassed about not grasping... the "
        "second law of thermodynamics' — i.e. they lacked basic scientific "
        "literacy and felt no shame about it. That is A."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks for Snow's COMPLAINT regarding 'the two cultures', "
             "based ONLY on the first two paragraphs. So the answer must come from "
             "the early setup, not the later geopolitical discussion."),
        step(2, "Locate Snow's specific gripe",
             "The relevant passage: 'Snow largely blamed literary types for this "
             "“gulf of mutual incomprehension.” These intellectuals, Snow asserted, "
             "were shamefully unembarrassed about not grasping, say, the second "
             "law of thermodynamics — even though asking if someone knows it... "
             "“is about the scientific equivalent of: Have you read a work of "
             "Shakespeare's?”'"),
        step(3, "Restate in plain English",
             "Snow's gripe was one-sided: literary intellectuals didn't know basic "
             "science (thermodynamics-level basic), and they weren't embarrassed "
             "about it. Snow's analogy: this would be like a scientist proudly "
             "not having read Shakespeare. Literary people, in Snow's view, were "
             "the ones with the gap."),
        step(4, "Vocabulary check",
             "'Schism' = a serious split, a deep divide. 'Gulf of mutual "
             "incomprehension' = a wide gap where neither side understands the "
             "other. 'Shamefully unembarrassed' = without the embarrassment they "
             "ought to feel — Snow's value judgement against literary types. "
             "'Basic scientific knowledge' (option A) = grasping things like the "
             "second law of thermodynamics, exactly Snow's benchmark.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'lack of basic scientific knowledge among literary people' — "
             "direct match to Snow's complaint about literary types not grasping "
             "thermodynamics. B 'science getting more than its fair share of "
             "attention' — opposite direction: Snow thought science was being "
             "neglected, not over-attended. C 'scientists' patronising attitude "
             "to literary culture' — Snow blames LITERARY people, not scientists, "
             "in the first two paragraphs. D 'different kinds of knowledge equally "
             "valued' — this is a later, more general claim about education; "
             "Snow's first-two-paragraphs complaint is sharper and one-sided."),
        step(6, "Conclusion",
             "The answer is A. The opening of the article frames Snow's complaint "
             "specifically as literary people's scientific illiteracy, and his "
             "Shakespeare/thermodynamics analogy makes it crisp. Insight in one "
             "sentence: when a question specifies WHICH paragraphs to consult, "
             "restrict yourself there — answers drawn from later paragraphs "
             "almost always miss the mark."),
    ],
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "Later in the article, Snow is described as an 'evangelist of our "
                "technological future', which can be misread back into the early "
                "complaint as 'science gets too much credit'."
            ),
            "why_wrong": (
                "Snow's view is the opposite — science gets too LITTLE credit, "
                "and literary types ignore it. Step 5 catches the direction "
                "reversal."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember the article's framing of Snow's pro-science "
                "tilt, it's easy to slide into 'scientists looking down on "
                "literary culture' — same kind of cultural-divide claim."
            ),
            "why_wrong": (
                "In Snow's first-two-paragraph complaint, literary types are the "
                "ones being criticised, not the ones being patronised. The "
                "patronising direction in C is reversed from Snow's actual gripe. "
                "Step 3's paraphrase preserves the direction."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Many stop at the general idea of 'two cultures' and read it as a "
                "call for equal valuation of science and humanities — a "
                "modern-sounding interpretation."
            ),
            "why_wrong": (
                "Snow's specific complaint in the first two paragraphs isn't "
                "balanced — it's a one-sided attack on literary types. The "
                "even-handed framing in D belongs to later discussion of his "
                "broader education view. Step 5 separates the specific complaint "
                "from the broader thesis."
            ),
        },
    ],
    technique=(
        "When the prompt restricts the search to specific paragraphs ('according "
        "to the first two paragraphs'), confine your locate move there. Any "
        "option that requires evidence from later paragraphs is wrong, even if "
        "it correctly describes the article's broader view. Trigger: paragraph-"
        "scoped prompt → paragraph-scoped evidence."
    ),
    pitfall=(
        "Articles that develop a thinker's view across many paragraphs invite "
        "students to import later-paragraph nuance back into an early-paragraph "
        "question. The cure: respect the prompt's scope — first two paragraphs "
        "means first two paragraphs only."
    ),
)

# ─── 037: writer's views on Snow's ideas ────────────────────────────────────
# Answer: C — Snow's views on humanity's path to the future may still hold some interest
explanations["var-2024-verb2-ELF-037"] = make(
    qid="var-2024-verb2-ELF-037",
    solution_path=(
        "The writer says of Snow: 'Snow's expression of this optimism is dated, "
        "yet his thoughts about progress are more relevant today than his "
        "cultural typologies' and closes with 'For all the book's continuing "
        "interest, we should... genuinely reconsider it.' The progress-and-"
        "future part is what the writer thinks still has value — option C."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks which statement is most in keeping with the WRITER'S "
             "views on Snow — not Snow's own views, but what the article's author "
             "thinks ABOUT Snow. So we hunt for the writer's evaluative sentences "
             "(yet/but/however constructions)."),
        step(2, "Locate the writer's evaluations",
             "Key sentences. 'Snow's expression of this optimism is dated, YET "
             "his thoughts about progress are more relevant today than his "
             "cultural typologies.' Also: 'This question is the aspect of Snow's "
             "book that speaks most directly to us today.' And: 'For all the "
             "book's continuing interest, we should spend less time merely citing "
             "The Two Cultures, and more time genuinely reconsidering it.'"),
        step(3, "Restate in plain English",
             "The writer thinks Snow's 'two cultures' framing is dated and not "
             "very subtle, BUT Snow's deeper question — does science change the "
             "world by itself, or does it need direction? — is still worth "
             "engaging with. The writer is downplaying the cultural-typology side "
             "and elevating the progress-and-future side."),
        step(4, "Vocabulary check",
             "'Cultural typologies' = Snow's classification of scientists vs. "
             "literary types. 'Thoughts about progress' = Snow's argument about "
             "whether science drives change on its own or needs top-down direction. "
             "'Humanity's path to the future' (option C) = exactly the progress-"
             "and-direction question the writer flags as still relevant. "
             "'Continuing interest' = still worth reading.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'great care to back up with anthropological evidence' — the writer "
             "actually says the opposite: 'his descriptions of the two cultures "
             "are not exactly subtle' and 'misleading to imagine Snow as the "
             "eagle-eyed anthropologist.' B 'professional background gave him "
             "insight into literary culture' — Snow was a physicist, and the "
             "writer doesn't say his background equipped him to understand "
             "literary culture; if anything, the article suggests he misjudged "
             "it. C 'views on humanity's path to the future may still hold some "
             "interest' — matches 'thoughts about progress are more relevant "
             "today' and the closing call to reconsider the book. D 'tended to "
             "downplay the real differences between “the two cultures”' — wrong "
             "direction; Snow EMPHASISED the differences, often crudely."),
        step(6, "Conclusion",
             "The answer is C. The writer's verdict on Snow is mixed: the cultural "
             "framing is dated, but the progress-and-future question remains "
             "worth engaging. Option C captures the writer's surviving "
             "endorsement. Insight in one sentence: when a writer hedges with "
             "'X is dated, YET Y is still relevant', the option matching Y "
             "captures the writer's stance."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "If you remember the article mentioning Snow's lecture and "
                "extensive writing, A's 'anthropological evidence' sounds like "
                "the kind of rigour a serious author would have."
            ),
            "why_wrong": (
                "The writer explicitly says Snow's two-cultures descriptions are "
                "'not exactly subtle' and that imagining him as 'eagle-eyed "
                "anthropologist' is MISLEADING. Step 5 catches the direct "
                "contradiction with the writer's own words."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at Snow being 'an English physicist' and assume the "
                "writer credits his outsider's view of literary culture as "
                "insightful."
            ),
            "why_wrong": (
                "The writer's stance is that Snow MISJUDGED literary culture "
                "(blaming it crudely). Step 3's paraphrase preserves the "
                "writer's mixed verdict — Snow isn't being credited with insight "
                "into literature."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on 'the separateness of Snow's two cultures is a "
                "very slippery thing' (the closing-paragraph remark) is to read "
                "it as Snow downplaying the gap."
            ),
            "why_wrong": (
                "'Slippery' is the WRITER'S verdict on the concept's coherence, "
                "not Snow's stance. Snow himself EMPHASISED a hard gap. Step 5 "
                "catches the misattribution."
            ),
        },
    ],
    technique=(
        "On 'writer's views on X' items, find the YET / BUT / HOWEVER pivot in "
        "the article — the writer's stance always lives on the second side of "
        "the pivot. Trigger: 'X is dated, YET Y remains relevant' → writer's "
        "endorsement is Y."
    ),
    pitfall=(
        "Articles that engage critically with a thinker can be mistaken for "
        "wholesale rejection or wholesale endorsement. The cure: identify what "
        "the writer DISMISSES and what they KEEP — every nuanced critique has "
        "both, and the right option mirrors the keeping side."
    ),
)

# ─── 038: reception of Snow's ideas ─────────────────────────────────────────
# Answer: D — squarely rejected by prominent intellectuals
explanations["var-2024-verb2-ELF-038"] = make(
    qid="var-2024-verb2-ELF-038",
    solution_path=(
        "The article reports two named responses: 'a roaring, ad hominem response "
        "from the Cambridge literary critic F. R. Lewis and a more measured one "
        "from Lionel Trilling.' Trilling accused Snow of 'cultural tribalism' "
        "that 'impaired the possibility of rational discourse.' Both prominent, "
        "both negative — that's D."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what is IMPLIED about the RECEPTION of Snow's ideas. "
             "Reception = how others received and responded to them. We need the "
             "passage that names specific responders and characterises their "
             "responses."),
        step(2, "Locate the reception passage",
             "The relevant passage: 'Snow's essay provoked a roaring, ad hominem "
             "response from the Cambridge literary critic F. R. Lewis and a more "
             "measured one from Lionel Trilling. Snow's cultural tribalism, "
             "Trilling argued, impaired the “possibility of rational discourse.”' "
             "Two named critics, both hostile (one explosively, one measuredly)."),
        step(3, "Restate in plain English",
             "When Snow's essay came out, two big-name critics — F. R. Lewis at "
             "Cambridge and Lionel Trilling — pushed back. Lewis went after Snow "
             "personally and loudly ('roaring, ad hominem'). Trilling was calmer "
             "but cut to the bone: Snow's framing was so tribal, he said, that it "
             "killed rational discussion. Two prominent thinkers, both rejecting "
             "Snow's argument."),
        step(4, "Vocabulary check",
             "'Ad hominem' = attacking the person rather than the argument — a "
             "harsh rhetorical mode. 'Cultural tribalism' = treating one's own "
             "cultural side as superior — Trilling's diagnosis of Snow. "
             "'Squarely rejected' (option D) = decisively rejected, not "
             "qualified or mixed. 'Prominent intellectuals' = well-known "
             "thinkers — both Lewis (Cambridge critic) and Trilling are.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'first ignored by most literary experts' — wrong; the response "
             "was vocal and immediate, not silent. B 'heated arguments among "
             "natural scientists' — the responses described are from LITERARY "
             "critics (Lewis and Trilling), not natural scientists. C 'logic "
             "respected by both sides' — Trilling's whole complaint is that Snow's "
             "tribalism made rational discourse IMPOSSIBLE; nobody's logic gets "
             "due respect in the article's account. D 'squarely rejected by "
             "prominent intellectuals' — matches both named critics' negative "
             "responses, the 'roaring' Lewis and the 'measured' Trilling."),
        step(6, "Conclusion",
             "The answer is D. The only two reception-data points the article "
             "gives are two prominent critics, both hostile. Insight in one "
             "sentence: when an article reports reception by NAMING SPECIFIC "
             "RESPONDERS and characterising their responses, the implied verdict "
             "comes from those named responses, not from generalisations."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "If you remember 'nowadays few people actually seem to have read "
                "Snow's book' from the opening, it's tempting to project that "
                "neglect backward and assume early reception was also quiet."
            ),
            "why_wrong": (
                "The article describes early reception as 'roaring' and 'measured' "
                "— immediate and engaged, not ignored. Step 2's locate move pins "
                "the noisy response."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at the words 'rational discourse' and Snow's scientific "
                "background and assume the heated arguments were inside the "
                "scientific community."
            ),
            "why_wrong": (
                "Both named responders — F. R. Lewis and Lionel Trilling — are "
                "LITERARY critics, exactly the camp Snow attacked. Step 3 makes "
                "the camp identification explicit."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on 'a more measured response from Lionel Trilling' "
                "is to read 'measured' as 'respectful, even-handed' — implying "
                "mutual respect for logic."
            ),
            "why_wrong": (
                "Trilling was measured in TONE, not in conclusion — his measured "
                "verdict was that Snow IMPAIRED rational discourse. Step 4's "
                "vocabulary check separates manner from substance."
            ),
        },
    ],
    technique=(
        "On reception/response items, list the NAMED RESPONDERS the article cites "
        "and the LABEL it applies to each. The right option matches the "
        "responders' camp AND the direction of their response. Trigger: "
        "'roaring response from X' + 'measured response from Y' → both negative, "
        "answer matches rejection by prominent voices."
    ),
    pitfall=(
        "Tone-words ('measured', 'civil') can be mistaken for substance-words "
        "('respectful', 'agreeing'). The cure: separate HOW someone responded "
        "from WHAT they concluded — Trilling was calm but still hostile."
    ),
)

# ─── 039: what caused Snow to present his argument ──────────────────────────
# Answer: B — viewed the schism as relevant in an urgent political context
explanations["var-2024-verb2-ELF-039"] = make(
    qid="var-2024-verb2-ELF-039",
    solution_path=(
        "The article spells out Snow's motivation: the schism keeps capable minds "
        "from science, which prevents solving 'the world's “main issue,” the "
        "wealth gap caused by industrialization, which threatens global stability.' "
        "If democracies don't modernise undeveloped countries, 'the Communist "
        "countries will.' That's an urgent political context — exactly B."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks what ESPECIALLY caused Snow to present his argument. "
             "'Especially' signals one cause above others — Snow's deepest "
             "motivation. So we want the article's account of his ULTIMATE "
             "concern, not just his surface complaint."),
        step(2, "Locate Snow's deeper motive",
             "Two sentences carry it. 'So why did Snow think the supposed gulf "
             "between the two cultures was such a problem? Because, in his view, "
             "it leads many capable minds to ignore science as a vocation, which "
             "prevents us from solving the world's “main issue,” the wealth gap "
             "caused by industrialization, which threatens global stability.' And: "
             "'This brings The Two Cultures to its ultimate concern, which has "
             "less to do with intellectual life than with geopolitics.'"),
        step(3, "Restate in plain English",
             "Snow didn't write the book just to scold literary types. He wrote it "
             "because of a Cold War-era worry: if the West can't channel "
             "scientific talent into modernising poor countries, the Communist "
             "bloc will, and the West will become 'an enclave in a different "
             "world.' The cultural schism mattered because solving global "
             "inequality and winning the Cold War depended on it. That's the "
             "urgent political context."),
        step(4, "Vocabulary check",
             "'Ultimate concern' = the deepest motivation, what the book is "
             "really about. 'Geopolitics' = world politics, the relationships "
             "between countries — exactly 'urgent political context'. 'Cold war "
             "document' = a text shaped by the East-West tensions of the 1950s "
             "and 60s. 'Wealth gap caused by industrialization' = the unequal "
             "distribution of industrial prosperity across countries.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'constant misunderstanding between them' — too mild; the article "
             "explicitly says Snow's concern was 'less about intellectual life "
             "than about geopolitics.' B 'schism relevant in an urgent political "
             "context' — direct match to 'ultimate concern... geopolitics' and "
             "the Cold War framing. C 'little role for science in bridging "
             "rich/poor' — opposite direction; Snow saw science as THE BRIDGE "
             "between rich and poor, not as marginal. D 'low opinion of "
             "humanistic research' — Snow's contempt for humanistic ethics is "
             "real but is the surface complaint, not the deep motivation. The "
             "prompt asks what ESPECIALLY caused his argument, and the article "
             "answers: geopolitics."),
        step(6, "Conclusion",
             "The answer is B. The article explicitly frames Snow's deepest "
             "motivation as Cold War geopolitics — getting the West to modernise "
             "before the Communist bloc does. Insight in one sentence: when an "
             "article distinguishes between an author's SURFACE complaint and "
             "their ULTIMATE concern, 'especially caused' questions always "
             "track the ultimate concern."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "The phrase 'gulf of mutual incomprehension' from the opening "
                "sounds like constant misunderstanding, which makes A feel like "
                "Snow's main worry."
            ),
            "why_wrong": (
                "The article ranks misunderstanding as the SURFACE issue and "
                "geopolitics as the DEEP issue. Step 3's paraphrase pins the "
                "hierarchy — 'especially' tracks the deep level, not the surface."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember Snow's distaste for literary culture, it's "
                "easy to read him as cynical about science's role too — "
                "science doesn't really help anyone."
            ),
            "why_wrong": (
                "Snow's view is exactly the opposite: science is the KEY to "
                "solving global inequality. C inverts his stance entirely. Step 5 "
                "catches the direction reversal."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Many stop at Snow's harsh remarks about literary ethics "
                "('temporary periods of moral failure', the fascist poets) and "
                "infer that the book was MOTIVATED by contempt for humanistic "
                "research."
            ),
            "why_wrong": (
                "The contempt is real but is the SURFACE polemic. The article "
                "explicitly distinguishes 'ultimate concern' (geopolitics) from "
                "the contempt rhetoric. Step 2's locate move pins where the "
                "article says 'ultimate concern' — and it's not the moral attack."
            ),
        },
    ],
    technique=(
        "When a question uses 'especially' or 'most of all' about an author's "
        "motivation, look for explicit ranking language in the article — "
        "'ultimate concern', 'deeper point', 'really about'. The right option "
        "matches the top of the ranking, not the surface complaint."
    ),
    pitfall=(
        "Rhetorical flair (Snow's polemic against literary types) is more "
        "memorable than the analytic core (Snow's Cold War argument), so it "
        "steals attention on 'why did he argue this' items. The cure: respect "
        "the article's own ranking words and match to the top-tier concern."
    ),
)

# ─── 040: writer's main impression of Snow's book ───────────────────────────
# Answer: C — now noteworthy for other reasons than in the mid-20th century
explanations["var-2024-verb2-ELF-040"] = make(
    qid="var-2024-verb2-ELF-040",
    solution_path=(
        "The writer's overall verdict: the cultural typologies are dated, the "
        "two-cultures framing is 'slippery', BUT 'his thoughts about progress are "
        "more relevant today than his cultural typologies' and 'this question is "
        "the aspect of Snow's book that speaks most directly to us today.' "
        "Different reasons today than in 1959 — that is C."
    ),
    steps=[
        step(1, "Understand the question",
             "The prompt asks for the writer's MAIN IMPRESSION of Snow's book — "
             "the overall takeaway after weighing the pros and cons. So we want "
             "the closing-paragraph verdict, not any single mid-article remark."),
        step(2, "Locate the writer's overall verdict",
             "Multiple sentences converge. 'Snow's expression of this optimism is "
             "dated, yet his thoughts about progress are more relevant today than "
             "his cultural typologies.' 'In other ways The Two Cultures remains "
             "irretrievably a cold war document.' 'This question [science as "
             "irrepressible force or in need of direction] is the aspect of Snow's "
             "book that speaks most directly to us today.' 'For all the book's "
             "continuing interest, we should spend less time merely citing The "
             "Two Cultures, and more time genuinely reconsidering it.'"),
        step(3, "Restate in plain English",
             "The writer says: yes, the book is dated in parts (the cultural "
             "typology, the Cold War framing), BUT a different part of it — Snow's "
             "deeper question about whether science needs direction — still speaks "
             "to today's debates (climate change, scientific policy). The book "
             "matters today FOR DIFFERENT REASONS than it mattered in 1959."),
        step(4, "Vocabulary check",
             "'Irretrievably a cold war document' = stuck in its 1950s moment in "
             "some ways. 'Continuing interest' = it's still worth reading. "
             "'Genuinely reconsider' = engage with what's actually there, not the "
             "stock summary. 'Noteworthy for other reasons' (option C) = worth "
             "attention now, but on different grounds than originally.",
             tier="detail"),
        step(5, "Match against the options",
             "A 'difficult to understand the controversy' — wrong direction; the "
             "writer treats the original controversy as understandable and largely "
             "agrees with Trilling's critique. B 'political and moral message has "
             "lost little of its original force' — wrong; the writer says Snow's "
             "optimism is 'dated' and the book is 'irretrievably a cold war "
             "document' in parts. C 'now noteworthy for other reasons than in the "
             "mid-20th century' — matches the 'thoughts about progress are more "
             "relevant today than his cultural typologies' line directly. D 'view "
             "of the split between fields remains valid' — wrong; the writer "
             "calls the separateness 'a very slippery thing' and explicitly says "
             "the cultural typology is dated."),
        step(6, "Conclusion",
             "The answer is C. The writer's overall impression is that the book "
             "still matters but for a question — the role of science in progress — "
             "that wasn't its original headline. Insight in one sentence: when a "
             "writer's verdict separates 'what was once the point' from 'what's "
             "now the point', the right answer names the shift in reasons, not "
             "the survival of the original ones."),
    ],
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "Snap reading on 'the book's main point seems so obvious' might "
                "make A — 'difficult to understand the controversy' — sound "
                "plausible; if the point is obvious, why the fight?"
            ),
            "why_wrong": (
                "The writer never says the original controversy was hard to "
                "understand. The article RECOUNTS the controversy in detail and "
                "engages with Trilling's critique seriously. Step 5 catches the "
                "missing claim."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you remember Snow's geopolitical framing being labelled the "
                "'ultimate concern', it's easy to slide into 'the political "
                "message hasn't lost its force.'"
            ),
            "why_wrong": (
                "The writer explicitly calls the political framing 'irretrievably "
                "a cold war document' and Snow's optimism 'dated'. Step 4's "
                "vocabulary pins the writer's verdict — the political force HAS "
                "faded; the progress question is what survives."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Many stop at the line 'his view that education should not be too "
                "specialised remains broadly persuasive' and read it as the "
                "two-cultures split being still valid."
            ),
            "why_wrong": (
                "The broad anti-specialisation point survives, but the "
                "TWO-CULTURES SPLIT ITSELF is what the writer calls 'slippery' "
                "and 'not exactly subtle'. The validity claim in D is broader "
                "than what the writer endorses. Step 3's paraphrase makes the "
                "distinction explicit."
            ),
        },
    ],
    technique=(
        "On 'writer's main impression' items at the end of a long article, "
        "weigh the YES/BUT structure: what does the writer concede is dated, and "
        "what does the writer say still matters? The right option always names "
        "the SHIFT between the two."
    ),
    pitfall=(
        "Long critical articles tempt students into 'wholesale rejection' or "
        "'wholesale endorsement' options, but the verdict is usually 'mixed but "
        "with a specific surviving merit'. The cure: locate the YET / "
        "NEVERTHELESS / FOR ALL THAT pivot — the right answer almost always "
        "lives on its second side."
    ),
)

# Final save (20 entries)
emit(explanations)
print(f"[saved] FINAL: {len(explanations)} entries written to var-2024-elf.json")
print(f"keys: {sorted(explanations.keys())}")
