"""Hand-authored Variant-C Ultra-Granular ELF explanations for var-2026.

ALL ENGLISH. 20 entries, 4-6 steps each, 3 distractors each.

verb1 031–040: comprehension (Comics in Science, Impressions,
  Indie Bookstores ×5, Food for Thought, Breaking Up, 18th Century Criminals).
verb2 031–035: James Bond cloze.
verb2 036–040: Killer Cats comprehension.
"""
from __future__ import annotations
import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}


def E(**kwargs):
    """Build an explanation entry, attaching _meta."""
    kwargs["_meta"] = META
    return kwargs


EXPLANATIONS: dict[str, dict] = {}


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-031 — Comics in Science → B
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-031"] = E(
    solution_path=(
        "The 'Comics in Science' paragraph closes with two sentences that hand you the "
        "answer directly: 'making good comics takes as much time and skill as making a "
        "good documentary' and 'the communication of science in comics will be only as "
        "good as the comics themselves'. Effectiveness is a craft requirement — exactly "
        "what B says."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks what is ARGUED about using comics for learning science — "
                "so you are after the author's headline claim, not a side detail. With "
                "'what is argued' questions, the right option usually maps onto the "
                "paragraph's concluding sentence, where the author lands the punchline."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Two lines do the heavy lifting, both near the end: 'making good comics "
                "takes as much time and skill as making a good documentary' and 'the "
                "communication of science in comics will be only as good as the comics "
                "themselves'. The opening half lists POTENTIAL — storytelling, diagrams, "
                "metaphors — but the argument is the closing one: potential depends on "
                "craft."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "Comics CAN be a great science-learning tool, but only if the comic itself "
                "is well made. A badly drawn, badly written comic teaches badly; a "
                "well-crafted one teaches well. The format on its own guarantees nothing — "
                "design quality decides everything."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "Three phrases worth glossing. 'Promising tool' = something with potential, "
                "not a proven result. 'Engagement' = getting readers interested, not just "
                "informed. 'Only as good as' is the conditional structure that flags the "
                "argument: the outcome is conditional on the input quality."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option against the paraphrase. A claims comics 'mainly provide "
                "simplified versions' — the passage lists storytelling, structure, and "
                "metaphor as strengths, not simplification. B ('Making them effective "
                "requires them to be very well designed') is a direct restatement of "
                "'only as good as the comics themselves' plus the 'as much time and skill "
                "as a good documentary' clause. C predicts entertainment-only use — the "
                "passage frames comics as a learning tool. D narrows the audience to "
                "people 'already interested in science' — the passage says the opposite: "
                "comics may reach those 'less likely to seek other forms of science "
                "communication'."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The paragraph's argument hinges on a craft conditional: "
                "comics work IF they are well designed. Insight in one sentence: when a "
                "'what is argued' passage ends with an 'only as good as' clause, the "
                "right option almost always echoes that conditional."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'engaging storytelling', 'diagrams', and 'metaphors' "
                "as a list of ways comics SIMPLIFY science — visuals and stories feel "
                "like simplification by default."
            ),
            "why_wrong": (
                "The passage credits comics with combining storytelling WITH structure "
                "and mapping abstract concepts onto familiar ones — that's metaphor and "
                "translation, not simplification. Step 5's option-by-option pass shows "
                "the word 'simplified' never appears in the argument."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'engaging storytelling' and 'distant worlds with fictional "
                "characters' and predict that comics will end up as entertainment rather "
                "than learning."
            ),
            "why_wrong": (
                "The whole paragraph is built around the science-COMMUNICATION question, "
                "with the closing sentence declaring that 'the communication of science "
                "in comics will be only as good as the comics themselves'. Step 2's "
                "closing-sentence quote anchors comics as a learning tool, not a future "
                "entertainment product."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on a science-communication tool is preaching to the "
                "converted — readers who already like science will read science comics."
            ),
            "why_wrong": (
                "The passage explicitly states the opposite: 'the true value of comics "
                "may be engaging those readers who are LESS likely to seek other forms "
                "of science communication.' Step 3's paraphrase flags this — comics "
                "target new audiences, not the already-interested."
            ),
        },
    ],
    technique=(
        "Conditional-claim scanning: when the passage ends with an 'only as good as' or "
        "'as much skill as' clause, that's the argument. The correct option restates the "
        "conditional. Trigger to memorise: a closing sentence that ties outcome to "
        "craft-quality → pick the option that names design or skill."
    ),
    pitfall=(
        "Don't let the opening list of comic strengths (storytelling, diagrams, metaphor) "
        "fool you into picking the option that names ONE of those strengths. The opening "
        "describes potential; the closing sentence states the argument."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-032 — Impressions → D
# (The Q's prompt is 'What is said here?' referring to the 'Impressions' mini-passage)
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-032"] = E(
    solution_path=(
        "The 'Impressions' paragraph closes with Olivola and Todorov saying that "
        "appearance-based trait judgments are 'particularly hard to correct' because "
        "they are 'implicit' and often unrecognised — opinions formed unawares that are "
        "hard to change, which is exactly D."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is the broad 'What is said here?' — so you want the option "
                "the passage directly supports, not an option that merely sounds related. "
                "On 'what is said' items, scan for the option that paraphrases a specific "
                "claim verbatim, not the option that fits the topic."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentence",
            "text": (
                "The closing block is the headline: 'Getting people to overcome the "
                "influence of first impressions will not be an easy task. The speed, "
                "automaticity, and implicit nature of appearance-based trait inferences "
                "make them particularly hard to correct. Moreover, often people don't "
                "even recognize that they are forming judgments about others from their "
                "appearances.' Two claims sit inside: judgments form unconsciously, and "
                "they are hard to fix."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "You decide things about people the second you see them, without "
                "noticing you are doing it. Because the decision happens automatically "
                "and below conscious awareness, it is very hard to talk yourself out of "
                "it later. So: unaware → stuck."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Implicit' = happening without conscious thought, the opposite of "
                "explicit. 'Automaticity' = the quality of happening automatically. "
                "'Trait inferences' = guesses about someone's personality (honest, "
                "competent, cold, etc.). 'Unawares' (in option D) lines up exactly with "
                "'implicit nature' and 'don't even recognize' from the passage."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says overconfident people beat clever-looking ones "
                "— the passage never compares those two personality traits. B says the "
                "brain is 'remarkably good' at telling people's real characteristics — "
                "the passage says the opposite, that surface-based judgments are "
                "shortcuts, not accurate readings. C says elections are decided 'entirely "
                "by appearance' — the passage says appearance PREDICTS success, not that "
                "it decides it entirely. D ('Opinions formed unawares are often more "
                "difficult to change than conscious ones') maps line-for-line onto "
                "'implicit nature… particularly hard to correct… don't even recognize'."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The whole closing block argues that unconscious "
                "first-impression judgments resist correction. Insight in one sentence: "
                "when researchers are quoted at the END of a paragraph, that quotation "
                "almost always restates the headline — match it word for word."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's tempting to read 'rapid judgments about the personality traits of "
                "political candidates' and assume voters favour confident-looking "
                "candidates over intelligent-looking ones — a common cultural cliché."
            ),
            "why_wrong": (
                "The passage never names 'overconfident' versus 'clever-looking' as a "
                "comparison. The research describes appearance-based judgments in general "
                "and their resistance to correction. Step 5's option-by-option scan shows "
                "A introduces a trait pairing the passage does not make."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at 'voters rely heavily on appearances' and assume the article "
                "praises the brain's intuitive accuracy — fast, automatic, must be "
                "skilful."
            ),
            "why_wrong": (
                "The passage calls these judgments mental SHORTCUTS, not accurate "
                "readings — and warns they are 'hard to correct'. Step 3's paraphrase "
                "flags this: the article describes a bias, not a skill."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember the line 'predict their electoral success' as 'decide "
                "elections', C feels close — appearance and election outcome are linked "
                "in the passage."
            ),
            "why_wrong": (
                "'Predict' is far weaker than 'decide entirely by'. The passage says "
                "appearance is a strong cue voters use among many; it does not claim "
                "elections are settled solely on looks. Step 5 catches the over-strong "
                "phrasing in C."
            ),
        },
    ],
    technique=(
        "Closing-quote anchor: when a paragraph ends with a researcher's quotation, the "
        "right option restates that quotation. Trigger to memorise: 'Olivola and Todorov "
        "conclude: \"…\"' → match the option to the quoted sentence directly."
    ),
    pitfall=(
        "Beware options that take a real word from the passage ('predict') and inflate "
        "it ('decide entirely'). Step 5's option-by-option pass exists to catch this "
        "amplification trap."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-033 — Indie Bookstores, first two paragraphs → D
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-033"] = E(
    solution_path=(
        "The first two paragraphs set up an expectation (bookstores feel doomed and "
        "moribund) and then reverse it with a 'plot twist' — independent-bookstore "
        "membership has climbed for seven straight years and sales are up. The basic "
        "message is that the bookstore's reported death has been overstated, which is "
        "exactly what D says."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks for the BASIC MESSAGE in the FIRST TWO paragraphs — so "
                "you ignore the rest of the article and look for the single idea those "
                "two paragraphs build together. On 'basic message' items, look for a "
                "setup-and-reversal structure: expectation, then the twist."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Paragraph 1 sets the expectation: 'bookstores, especially independent "
                "ones, belong to a bygone era – there's a delicious moribund melancholy "
                "about them. Last chance to see.' Paragraph 2 lands the twist: 'Ironically, "
                "that reputation may have contributed to an unexpected plot twist – "
                "independent bookstores are actually really healthy.' Then the numbers: "
                "store count grew, the seventh straight year, sales up 5%."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "Everyone treats indie bookstores as a dying species — romantic, sad, "
                "soon to be gone. But the numbers say otherwise: more stores, more sales, "
                "year after year. So the 'bookstores are dying' story is wrong. The "
                "death has been exaggerated."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "Two phrases worth pinning down. 'Moribund' = dying, near death. "
                "'Greatly exaggerated' is a famous Mark Twain construction ('reports of "
                "my death are greatly exaggerated') — option D is borrowing that idiom "
                "to mean: the dying-story has been overstated. 'Plot twist' in paragraph "
                "2 signals the reversal of the setup in paragraph 1."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says demand for books has been in gradual decline — "
                "the second paragraph says sales are UP, the opposite. B claims the "
                "emotional image of bookstores is in the past — paragraph 1 actually "
                "USES that emotional image to set up paragraph 2's twist; it is "
                "expanded, not retired. C says the transformation will be the end of the "
                "paper book — paragraphs 1-2 say nothing about paper versus digital. "
                "D ('the death of the bookstore seems to have been greatly exaggerated') "
                "is the Mark-Twain restatement of paragraph 2's 'plot twist – independent "
                "bookstores are actually really healthy'."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The two-paragraph arc is setup (everyone expects "
                "death) plus reversal (the numbers show health). Insight in one sentence: "
                "when paragraph 1 paints a moribund picture and paragraph 2 opens with "
                "'Ironically' or 'plot twist', the basic message is that the moribund "
                "picture is wrong."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'bygone era' and 'moribund melancholy' in paragraph 1 "
                "as the article's verdict and infer that book demand has been declining "
                "for years."
            ),
            "why_wrong": (
                "Paragraph 1 only sets up the prevailing IMPRESSION; paragraph 2 reverses "
                "it with hard numbers. Step 3's paraphrase captures the reversal — the "
                "article ARGUES the gradual-decline story is wrong, so A inverts the "
                "actual message."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at the 'bygone era' phrasing and conclude that the emotional/"
                "romantic image of the bookstore can now be filed away as a thing of the "
                "past."
            ),
            "why_wrong": (
                "Paragraph 1 actively USES the emotional image — Shop Around the Corner, "
                "Notting Hill, Portlandia — as the setup for paragraph 2's reversal. The "
                "image is the article's hook, not its target. Step 2 shows the emotional "
                "image is alive in the text, not retired."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on a piece about bookstores is the paper-versus-digital "
                "framing — that fight is the dominant cultural story about books."
            ),
            "why_wrong": (
                "The first two paragraphs say nothing about paper books versus e-books; "
                "that comes much later in the article. Step 5 catches this — C imports a "
                "topic the named paragraphs do not cover."
            ),
        },
    ],
    technique=(
        "Setup-and-reversal scan: when paragraph 1 paints an emotional picture and "
        "paragraph 2 opens with 'Ironically' or 'unexpected plot twist', the basic "
        "message is the REVERSAL — pick the option that names the reversal, not the "
        "setup. Trigger: 'plot twist' + concrete numbers → the prior assumption was "
        "wrong."
    ),
    pitfall=(
        "Distractors often quote vivid words from the SETUP paragraph ('bygone era', "
        "'moribund') even though the article's argument lives in the REVERSAL. Cure: "
        "always identify both halves of a setup-reversal arc before matching options."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-034 — Indie Bookstores prospects across countries → C
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-034"] = E(
    solution_path=(
        "The article explicitly contrasts the US (member stores up, sales up 5%, "
        "seventh straight year of growth) with the UK (independents shrank 3% in 2015). "
        "Same year, opposite direction — indie prospects clearly vary by country, which "
        "is exactly C."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is argued in relation to independent bookstores?' — "
                "so you want a general claim ABOUT indies that the passage supports as a "
                "thesis, not a one-country fact. Scan the options first: A, B, D all make "
                "global / sweeping claims; C makes a comparative claim. That hint matters."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Two sentences carry the comparison. US: 'Independent-bookstore sales "
                "were up around 5% in the first four months of 2016. Indies accounted "
                "for about 10% of all books sold in 2015, up from 7% the year before.' "
                "UK: 'It's also not true in the U.K., where the number of independent "
                "bookstores (sorry, bookshops) shrank 3% in 2015.' The hinge phrase is "
                "'It's also not true in the U.K.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "Indie bookstores are doing well in the United States — more stores, "
                "more sales, every year for seven years. But in the United Kingdom the "
                "story flips: indie bookshops are shrinking. So whether indies are "
                "thriving depends on which country you ask about. The prospects vary."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Prospects' = future outlook, how things look going forward. 'Vary a "
                "great deal' is the precise phrase from option C — that is what the US/UK "
                "contrast literally illustrates: one rising, one falling. 'It's also not "
                "true in the U.K.' is the explicit signal that the two countries diverge."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says indies have 'dominant market share' — they "
                "account for about 10% of US sales, not dominance. B says they are "
                "heading for a 'brilliant future on a global scale' — directly "
                "contradicted by the UK decline. C ('Their prospects seem to vary a "
                "great deal between countries') maps onto the US-up / UK-down contrast "
                "the article explicitly draws. D says they have not realised their "
                "potential — the passage says they are growing, not that they are "
                "under-performing."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The article supplies one positive case (US) and one "
                "negative case (UK) precisely so the reader can see the comparison. "
                "Insight in one sentence: when a passage offers a deliberate 'this "
                "country yes, that country no' pair, pick the option that names the "
                "comparison itself."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read '10% of all books sold' as a big share and infer "
                "indies dominate the US market."
            ),
            "why_wrong": (
                "10% is significant but not dominant — the article never calls indies "
                "the leading retailer. Step 5's option-by-option pass shows A overstates "
                "the share by reading 'up to 10%' as 'dominant'."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "First instinct after the US growth numbers is to extrapolate globally — "
                "if it works in America, surely it spreads."
            ),
            "why_wrong": (
                "The very next sentence kills the extrapolation: 'It's also not true in "
                "the U.K.' Step 2's hinge quote shows the article deliberately blocks "
                "the global-future reading."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember the article as 'cautiously optimistic', D's 'still a "
                "long way from full potential' feels like a moderate, defensible "
                "summary."
            ),
            "why_wrong": (
                "The article says indies are HEALTHY and growing, not under-realised. "
                "Step 3's paraphrase shows the US story is one of unexpected strength, "
                "not unfulfilled promise."
            ),
        },
    ],
    technique=(
        "Two-country contrast detection: when a paragraph hands you one positive case "
        "and one negative case for the same phenomenon, the right answer almost always "
        "names the divergence. Trigger to memorise: 'It's also not true in [other "
        "country]' → pick the option that says 'varies between countries'."
    ),
    pitfall=(
        "Distractors love to take the upbeat country's numbers and globalise them, or "
        "the downbeat country's numbers and pessimise. Cure: before matching, write "
        "down BOTH countries' direction signs."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-035 — Indie comeback, what's implied → A
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-035"] = E(
    solution_path=(
        "Brian Lampkin at Scuppernong Books says 'We're letting Amazon and Barnes & "
        "Noble take care of the best sellers' and asks 'Where are you going to get "
        "poetry?' — explicitly pitching indies at the readers the big retailers ignore. "
        "The implication is that indies fill a gap for narrower, literary readerships — "
        "exactly A."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is IMPLIED about the comeback of indie bookstores?' "
                "— so you are looking for a claim the article supports through evidence "
                "but does not quite state outright. Implication questions reward you for "
                "catching what an example IS for, not just what the example says."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Lampkin's quote does the implication work: 'We're letting Amazon and "
                "Barnes & Noble take care of the best sellers. Where are you going to "
                "get poetry? Some Barnes & Nobles you walk into, you're lucky to find "
                "Emily Dickinson.' Scuppernong 'stocks a literary-leaning list'. So "
                "indies position themselves AGAINST the mass market by serving the "
                "narrower literary audience."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "The big chains and Amazon sell the bestsellers — what most people buy. "
                "Indie owners decide not to compete on that ground. Instead, they stock "
                "poetry, less-popular literature, the books a chain might not even carry. "
                "That gap, for the smaller specialist readership, is where indies live."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Literary-leaning' = tilting towards serious or artistic literature "
                "(poetry, literary fiction) rather than commercial fiction. 'Limited "
                "readership' in option A means a smaller, more specialist audience — "
                "exactly the poetry-reading customers Scuppernong serves. 'A gap' = a "
                "market slot the big players ignore."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A ('They fill a gap with regard to literature aimed "
                "at a more limited readership') restates Scuppernong's strategy directly: "
                "let the chains do bestsellers, we will stock the books for the smaller "
                "literary audience. B says e-books are a serious threat — the article "
                "later argues e-books have RECEDED and indies are benefiting from a "
                "rebalance. C says social media drives most profit — social media is "
                "mentioned as a help with promotion, not the source of profit. D "
                "predicts online sellers will put indies out of business — directly "
                "contradicted by the growth numbers."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. The Scuppernong example is in the article precisely "
                "to illustrate the niche-versus-mass-market positioning that makes "
                "indies viable. Insight in one sentence: when an owner quotes themselves "
                "saying 'we let X handle Y, we focus on Z', the implication is exactly "
                "that — they specialise in Z's narrower audience."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to assume that any article about bookstores will treat "
                "e-books as the looming threat — that is the most familiar cultural "
                "narrative about the book trade."
            ),
            "why_wrong": (
                "The article actually argues the e-book threat has RECEDED — e-book "
                "share dropped from 28% in 2013 to 24% in 2015. Step 2's quote frames "
                "the comeback through niche-positioning, not through e-book panic."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'The growth of social media makes it easier to promote "
                "events' and infer that social media drives the indie comeback."
            ),
            "why_wrong": (
                "Social media is named as a help for marketing, one of several "
                "'prosaic' causes. The implied story behind the comeback in this "
                "section is niche curation. Step 3's paraphrase locates the engine in "
                "specialist stocking, not promotion."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember the article as a David-versus-Goliath story, D's "
                "'massive competition from online booksellers will eventually put them "
                "out of business' feels like the pessimist's reasonable conclusion."
            ),
            "why_wrong": (
                "The article repeatedly says indie sales are UP, store counts are UP, "
                "and the comeback is real. D inverts the article's verdict. Step 5's "
                "option-by-option pass catches the inversion."
            ),
        },
    ],
    technique=(
        "Owner-quote anchor: when an article cites a small-business owner explaining "
        "their strategy ('we let X do Y, we do Z'), the implication question almost "
        "always rewards the option that names the strategy's audience. Trigger: 'where "
        "are you going to get [niche product]?' → niche-readership answer."
    ),
    pitfall=(
        "Don't import the dominant cultural narrative (e-book threat, online "
        "competition) when the article has already explicitly disposed of it. Cure: "
        "match each option to the SPECIFIC sentences about the comeback, not to "
        "external knowledge."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-036 — Indie, what's said about e-books → D
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-036"] = E(
    solution_path=(
        "The article tracks e-books from 9% of unit sales in 2010 to 28% in 2013, "
        "then notes that in 2015 the share 'actually receded to 24%'. An unbroken "
        "conquest narrative has hit an unexpected setback — exactly D."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is said as regards e-books?' — a 'what is said' "
                "item, so look for the option that paraphrases a specific claim, not "
                "the option that fits the topic in general. With numerical claims about "
                "share, pay attention to direction (up vs down) and surprise (expected "
                "vs unexpected)."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Two sentences carry the e-book story. The expectation: 'After Amazon "
                "launched the Kindle in 2007, e-books began a relentless conquest of "
                "the book market, from 9% of unit sales in 2010 to 28% in 2013, at "
                "which point their eventual dominance began to feel like technological "
                "manifest destiny.' The setback: 'In 2015, the share of e-books (at "
                "least the non-self-published kind) actually receded to 24%.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "Up until 2013, e-books looked like they would take over the whole book "
                "market — every year their share grew. Then something surprising "
                "happened: in 2015 their share went DOWN, from 28% to 24%. The "
                "inevitable takeover stalled. So the success story had an unexpected "
                "twist downward."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Receded' = went back, fell — the past tense of recede, the opposite "
                "of advance. 'Manifest destiny' is a historical idiom (originally "
                "American 19th-century westward expansion) used here to mean an "
                "inevitable, almost predestined takeover. 'Unexpected setback' in "
                "option D is the precise word-pair for 'manifest destiny → receded'."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says e-books were 'never regarded as a serious "
                "threat' — the passage calls them a 'relentless conquest' that felt "
                "like 'manifest destiny', so they were absolutely viewed as a threat. "
                "B says their takeover is 'virtually unstoppable' — true in 2013, "
                "but the article gives you the 2015 reversal. C says e-books will "
                "remain marginal for serious literature — the article does not make "
                "a literary-versus-popular distinction in the e-book paragraph. D "
                "('Their continuing success story has suffered an unexpected setback') "
                "is the precise wording for the receded-from-28%-to-24% reversal."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The arc is success → setback: e-book share rose for "
                "years, then fell. Insight in one sentence: when a passage gives you "
                "an ascending series of percentages followed by a SINGLE drop, the "
                "right option names that drop as a setback."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to invert the question — if e-books are receding, maybe "
                "they were never that scary — and slide into A's 'never regarded as a "
                "serious threat'."
            ),
            "why_wrong": (
                "The article explicitly says the opposite: e-books felt like "
                "'manifest destiny' and a 'relentless conquest'. They WERE seen as a "
                "serious threat, until the 2015 reversal. Step 2's first quote pins "
                "this down."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many remember 'relentless conquest' and 'manifest destiny' and pick "
                "the option that says 'virtually unstoppable' — the language matches."
            ),
            "why_wrong": (
                "Those phrases describe the 2010-2013 trajectory, not 2015's number. "
                "Step 3's paraphrase tracks the reversal — the takeover that LOOKED "
                "unstoppable then stalled."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct when paper books defend themselves is the high/low "
                "culture split — e-books for popular reading, paper for the serious "
                "stuff."
            ),
            "why_wrong": (
                "The article does not split readers into 'serious literature' versus "
                "casual readers in the e-book paragraph. Step 5's option-by-option "
                "pass catches this — C imports a distinction the passage does not draw."
            ),
        },
    ],
    technique=(
        "Trajectory-reversal scan: when a passage gives you a rising series of "
        "percentages followed by a single drop, the right option names the drop as a "
        "setback. Trigger to memorise: 'actually receded' inside a paragraph of "
        "growth numbers → pick the 'unexpected setback' option."
    ),
    pitfall=(
        "Distractors love to quote the FIRST half of a trajectory ('relentless "
        "conquest', 'manifest destiny') even though the question is about the WHOLE "
        "arc including the reversal. Cure: read the whole numerical series before "
        "matching."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-037 — Indie conclusion → B
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-037"] = E(
    solution_path=(
        "Near the end the article quotes Lampkin: 'I think they sort of get that there's "
        "no real reason to do this other than love and commitment,' and notes 'No one's "
        "getting rich.' In simple terms, indies are not in it for the money — exactly B."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt is 'What is concluded at the END of the text about indie "
                "bookstores?' — so you focus on the last paragraphs, not the article's "
                "opening or middle. With conclusion questions, the closing quote usually "
                "gives you the answer."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Two closing-block lines land the conclusion. The framing: 'Theirs is "
                "not a huge growth business. No one's getting rich.' The owner's "
                "verdict: 'The most surprising thing is how many times people just say "
                "thank you. I think they sort of get that there's no real reason to do "
                "this other than love and commitment.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "By the end, the article is clear that running an indie bookstore is "
                "not a money-making strategy. Owners do it because they love books and "
                "they care about the community, not because the business is lucrative. "
                "Customers seem to sense that and say thank you."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Lucrative' = profitable, money-making. 'In it just for the money' is "
                "the colloquial flipside — doing something only for profit. 'Love and "
                "commitment' is the explicit alternative motivation the article hands "
                "you. Option B's 'in simplistic terms, they do not seem to be in it "
                "just for the money' restates Lampkin's quote almost word for word."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says the strategy's long-term profitability is "
                "beyond doubt — but the article explicitly says 'no one's getting rich' "
                "and 'not a huge growth business'. B ('In simplistic terms, they do not "
                "seem to be in it just for the money') maps onto 'no real reason to do "
                "this other than love and commitment'. C says indies are temporary — "
                "the whole article argues the opposite, that they are healthy and "
                "growing. D claims indies have become 'increasingly lucrative' — "
                "directly contradicted by 'no one's getting rich'."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The article ends on motivation, not money: love and "
                "commitment, not profit. Insight in one sentence: when a closing quote "
                "names the OWNER'S MOTIVE explicitly, the conclusion option restates "
                "that motive, not the financial trajectory."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's tempting to read all the growth numbers earlier in the article "
                "(5% sales up, 10% market share, seven straight years of store growth) "
                "as evidence that the business model is solidly profitable."
            ),
            "why_wrong": (
                "The closing paragraph explicitly tempers that read: 'Theirs is not a "
                "huge growth business. No one's getting rich.' Step 2's first quote "
                "blocks A — growth in count and sales does not equal long-term "
                "profitability."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many remember the early 'bygone era' and 'moribund' framing and read "
                "the closing reflection as a hedge — indies are a temporary phenomenon "
                "that will pass."
            ),
            "why_wrong": (
                "The article's WHOLE arc is the opposite: the reported death has been "
                "exaggerated and indies are gaining ground. Step 3's paraphrase shows "
                "the closing reflection is about MOTIVE, not lifespan."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember the article as a feel-good comeback story, D's "
                "'increasingly lucrative business' sounds like the natural punchline."
            ),
            "why_wrong": (
                "The closing block says 'no one's getting rich' — the opposite of "
                "lucrative. Step 5's option-by-option pass catches this — D inverts "
                "the closing's explicit verdict."
            ),
        },
    ],
    technique=(
        "Closing-quote anchor for conclusion questions: the LAST quote from the "
        "owner or interviewee usually contains the article's punchline. Trigger to "
        "memorise: 'no real reason to do this other than [motive]' → pick the option "
        "that names the motive over the money."
    ),
    pitfall=(
        "Don't conflate 'growing in count' with 'increasingly profitable'. The "
        "article carefully separates the two. Cure: track motive and money as "
        "DIFFERENT claims before matching the closing options."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-038 — Food for Thought main argument → D
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-038"] = E(
    solution_path=(
        "The 'Food for Thought' paragraph says each new 'layer' of recipe change 'tells "
        "us something about a different group of consumers: their tastes, their economy, "
        "their language and their relationship with those from whom they adopted the "
        "dish'. Modified recipes are clues to the eaters — exactly D."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks for the MAIN ARGUMENT of the paragraph — the single "
                "thesis the whole text is built to support. With 'main argument' items "
                "the right option is usually a paraphrase of the SECOND-HALF sentence "
                "that connects the setup to the takeaway."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "The setup describes recipes being rewritten as dishes travel ('new "
                "ingredients are substituted for old, new methods of preparation are "
                "adopted'). The thesis lives in the next sentence: 'each new \"layer\" "
                "tells us something about a different group of consumers: their tastes, "
                "their economy, their language and their relationship with those from "
                "whom they adopted the dish.' That is the argument."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "As dishes move from one culture to another, the recipe gets "
                "rewritten. Each change is more than a cooking adjustment — it is "
                "evidence about the new eaters: what they liked, what they could "
                "afford, what they called things, who they borrowed from. So a modified "
                "dish is a clue about the people who modified it."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Accretion' = a gradual layering or build-up. 'Each new layer' is the "
                "metaphor that does the work: a recipe is read like a sedimentary "
                "deposit, with each generation adding a clue. 'Indirect clues' in "
                "option D restates this — you do not read the eaters directly, you "
                "read them through their recipe modifications."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says changing recipes 'may appeal to new groups "
                "of consumers' — appeal is not the paragraph's claim; the paragraph is "
                "about what changes REVEAL, not whom they attract. B says taste "
                "development drives acceptance of foreign cuisines — not in the text; "
                "the text describes a dish moving WITHIN cultures and being adapted, "
                "not consumers becoming more cosmopolitan. C says 'improved varieties' "
                "are loosely linked to the original — the paragraph never says the "
                "modified version is improved or loosely linked. D ('Modified dishes "
                "may give indirect clues about the people who eat them') is the "
                "paraphrase of 'each new layer tells us something about a different "
                "group of consumers'."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The paragraph is built to argue that recipe-changes "
                "are anthropological evidence. Insight in one sentence: when a "
                "paragraph uses the verb 'tells us something about', the right option "
                "names what the changes REVEAL, not who likes them."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'recipes get rewritten as they travel' and infer "
                "that the rewriting is meant to APPEAL to new consumers — that is the "
                "intuitive food-marketing reading."
            ),
            "why_wrong": (
                "The paragraph is not about why recipes change but about what their "
                "changes EXPOSE about the eaters. Step 3's paraphrase pins this — "
                "the argument is forensic (read the changes to read the people), not "
                "marketing."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many stop at 'passed between cultures' and 'shipped abroad' and read "
                "the paragraph as a story about culinary openness — new tastes "
                "embracing foreign food."
            ),
            "why_wrong": (
                "The paragraph never frames it as cosmopolitan acceptance; it frames "
                "modification as an inevitable consequence of any dish being eaten by "
                "many. Step 5's option-by-option pass shows B imports 'developing "
                "tastes' which the paragraph does not name."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you read 'changes out of all recognition' as a quality judgment, "
                "C's 'improved varieties' and 'loosely linked' feel close — the dish "
                "has drifted from its origin."
            ),
            "why_wrong": (
                "The paragraph never calls the modifications IMPROVEMENTS — it is "
                "neutral on quality. It also says each layer carries information about "
                "the eaters, which is the opposite of 'loosely linked'. Step 2's "
                "thesis sentence catches both errors."
            ),
        },
    ],
    technique=(
        "'Tells us about' anchor: when a paragraph says a phenomenon TELLS US SOMETHING "
        "ABOUT a group of people, the right option restates that revelatory link. "
        "Trigger to memorise: 'each X tells us something about Y' → pick the option "
        "that names Y as readable evidence."
    ),
    pitfall=(
        "Distractors often swap forensic claims ('changes reveal eaters') for market "
        "claims ('changes attract eaters'). Cure: check whether the paragraph is "
        "about CAUSE (why something changed) or about EVIDENCE (what the change shows "
        "us). This one is about evidence."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-039 — Breaking Up, albatross couples → A
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-039"] = E(
    solution_path=(
        "Biologist Francesco Ventura describes albatross 'divorce' as 'relatively "
        "understated and free from noisy squabbles' — the female just shows up with a "
        "different male next season. Compared with human separations, that is markedly "
        "less dramatic, which is exactly A."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks what is IMPLIED about black-browed albatross COUPLES — "
                "so you need a claim about how their partnerships behave (specifically "
                "when they end). On implication items, look at the descriptive word the "
                "scientist chooses ('understated', 'no squabbles') and ask what that "
                "word IMPLIES by contrast."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentence",
            "text": (
                "The pivotal sentence is Ventura's description of separation: 'The "
                "process is relatively understated and free from noisy squabbles… Often "
                "when a female deems the partnership unsuccessful over the course of a "
                "year, she will simply appear with a different male in the following "
                "breeding season.' 'Understated' and 'free from squabbles' are the "
                "implication-bearing words."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "When a female albatross decides her current partnership is not "
                "working, she does not stage a big drama. She quietly switches partners "
                "for the next breeding season. The implicit contrast is with human "
                "break-ups, which the word 'understated' tells you are noisier and more "
                "dramatic."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Understated' = quiet, low-key, not showy — the precise opposite of "
                "dramatic. 'Squabbles' = noisy quarrels. 'Less dramatic fashion' in "
                "option A is the direct translation of 'understated and free from noisy "
                "squabbles'. Note: the word 'human' is in the original sentence (the "
                "passage uses the comparative scaffold 'social monogamy' alongside "
                "marriages and divorces) — and it is also in option A, which is the "
                "implied comparison."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A ('They separate in a less dramatic fashion than "
                "humans do') restates 'understated and free from noisy squabbles' "
                "against the human-marriage scaffold the paragraph keeps using "
                "('marriages', 'divorce'). B says albatross partnerships are LESS "
                "STABLE than most other birds' — the paragraph says they are 'often "
                "mate for life', the opposite of unstable. C says mating patterns are "
                "not fully understood — the paragraph confidently describes them, with "
                "a biologist's quote, so they ARE understood. D says their partnerships "
                "are MORE TEMPORARY than humans' — the paragraph says they 'often mate "
                "for life', which is at least as durable as human marriage; the "
                "implied contrast is on STYLE of separation, not duration."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. The whole 'Breaking Up' framing uses human "
                "marriage-and-divorce metaphors to set up the contrast: same form, "
                "different drama level. Insight in one sentence: when a scientist "
                "describes animal behaviour as 'understated' inside a paragraph that "
                "leans on human relationship vocabulary, the implication is that the "
                "comparison-class is human, and the answer names the muted contrast."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to read 'divorce is not unheard of' and 'will leave a "
                "partnership that lacks breeding success' and infer that albatross "
                "couples are unstable — they split, they re-pair."
            ),
            "why_wrong": (
                "The paragraph opens with 'often mate for life' and frames divorce as "
                "the exception. Step 2's locate-line shows that separation is the "
                "EXCEPTIONAL case, not the rule — so albatross partnerships are stable "
                "as a general matter."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many stop at 'a female deems the partnership unsuccessful' and read "
                "the language as a hedge — scientists are still figuring it out."
            ),
            "why_wrong": (
                "The paragraph quotes Ventura with confidence, names specific behaviour "
                "patterns, and explains the practical purpose of pair-bonding "
                "(alternating foraging and incubation duties). The biology is "
                "described, not flagged as unknown. Step 5's option-by-option pass "
                "blocks C."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember the line 'divorce is not unheard of' as 'they break "
                "up easily' and forget the 'often mate for life' anchor, D's 'more "
                "temporary than humans' feels plausible."
            ),
            "why_wrong": (
                "The paragraph's stability claim is 'often mate for life'. Human "
                "marriages do not all last for life. So if anything, albatross "
                "partnerships are AS durable as human ones, possibly more so. The "
                "implication concerns SEPARATION STYLE, not partnership duration. "
                "Step 3's paraphrase captures the style/duration distinction."
            ),
        },
    ],
    technique=(
        "Style-versus-duration distinction: when a paragraph compares an animal "
        "relationship to a human one using words like 'understated' or 'noisy', the "
        "implication is about STYLE of behaviour, not LENGTH of relationship. "
        "Trigger: 'understated and free from squabbles' inside a marriage/divorce "
        "metaphor → pick the 'less dramatic' option, not the 'shorter' option."
    ),
    pitfall=(
        "Don't read 'divorce is not unheard of' as 'most relationships fail' — the "
        "paragraph qualifies that as the exception against an 'often mate for life' "
        "baseline. Cure: anchor the question on the strongest stability statement in "
        "the paragraph before reading implication options."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb1-ELF-040 — 18th Century Criminals → C
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb1-ELF-040"] = E(
    solution_path=(
        "The paragraph says it was 'generally held that anyone who would stoop to "
        "commit a crime was already morally bankrupt and was starting a spiral down "
        "into a life of villainy' — the public view was that a criminal would not "
        "improve, just slide further. That is C."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks which statement best reflects PUBLIC OPINION on crime "
                "in 18th-century Britain — so you want what people generally believed, "
                "not what was legally true or factually correct. Watch for phrases like "
                "'generally held' or 'in much the same way we do today' — those are "
                "the public-opinion markers."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentence",
            "text": (
                "The whole second half of the paragraph carries the public opinion: "
                "'it was generally held that anyone who would stoop to commit a crime "
                "was already morally bankrupt and was starting a spiral down into a "
                "life of villainy, if they weren't already there.' Inside this single "
                "sentence sit the words 'morally bankrupt' (no moral standing) and "
                "'spiral down into a life of villainy' (no upward trajectory)."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "In 18th-century Britain, the popular view was that committing a crime "
                "proved you were already a bad person — and that you would keep getting "
                "worse, not better. The starving child who stole an apple was seen the "
                "same as a hardened murderer: both were on a one-way downhill slope. "
                "Reform was not part of the picture."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Stoop to commit a crime' = lower oneself to do a crime — the verb "
                "implies a moral fall. 'Morally bankrupt' = without moral resources, "
                "no good in them. 'Spiral down into a life of villainy' = a downward "
                "trajectory into criminality. 'Unlikely to change for the better' in "
                "option C is the precise paraphrase of 'spiral down… if they weren't "
                "already there' — no upward path."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says all kinds of criminal acts require similar "
                "punishment — the paragraph is about LABELS and CHARACTER, not "
                "sentencing structure. B says lack of money is the root cause of most "
                "crimes — the paragraph specifically REJECTS this kind of "
                "circumstantial reading: the starving waif is not excused, the label "
                "'criminal' attaches regardless. C ('Criminals' behaviour is unlikely "
                "to change for the better') restates 'spiral down into a life of "
                "villainy'. D says crimes involving moral aspects are worse than "
                "others — the paragraph collapses ALL crimes into a single moral "
                "category, not a hierarchy."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The paragraph's whole public-opinion claim is that "
                "criminality is a moral identity, not a one-time act — and once you "
                "are on the spiral, you keep falling. Insight in one sentence: when a "
                "passage describes public opinion as 'morally bankrupt' plus 'spiral "
                "down', the right option says criminals do not improve."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's tempting to read 'the branding didn't distinguish them from a "
                "highwayman, murderer or career house breaker' as a punishment claim — "
                "everyone gets the same penalty."
            ),
            "why_wrong": (
                "The paragraph is about LABELS ('criminal' applied identically to all) "
                "and CHARACTER ('morally bankrupt'), not about uniform punishment. "
                "Step 3's paraphrase clarifies the scope — it is opinion about WHO "
                "criminals are, not what should be done to them."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "First instinct on the apple-stealing waif example is a sympathetic "
                "reading — surely poverty drove the crime, and the 18th-century public "
                "would have understood that."
            ),
            "why_wrong": (
                "The paragraph specifically blocks that reading: the waif's hunger "
                "DOES NOT distinguish them from a murderer in the public's eyes. "
                "Step 2's quote shows public opinion treated motive as irrelevant to "
                "the 'morally bankrupt' label."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember 'morally bankrupt' as a special category of bad — "
                "morally tinged crimes — D's 'crimes involving moral aspects are worse' "
                "feels close."
            ),
            "why_wrong": (
                "The paragraph applies 'morally bankrupt' to ALL crimes uniformly — "
                "stealing an apple counts as much as murder. Step 5's option-by-option "
                "pass catches this — D imports a hierarchy the paragraph deliberately "
                "denies."
            ),
        },
    ],
    technique=(
        "Public-opinion marker scan: when the question asks about PUBLIC OPINION and "
        "the paragraph uses phrases like 'generally held that…' or 'in much the same "
        "way we do today', match the option to whatever follows those phrases. "
        "Trigger: 'spiral down into a life of villainy' → pick the option that says "
        "criminals do not improve."
    ),
    pitfall=(
        "Don't read modern sympathetic intuitions (poverty causes crime) into an "
        "18th-century opinion paragraph. The whole point of the passage is to show "
        "how UNLIKE today's nuanced view the 18th-century blanket judgment was. Cure: "
        "ask 'what does THIS paragraph say', not 'what would I say'."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-031 — James Bond cloze: "many years of __" → A austerity
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-031"] = E(
    solution_path=(
        "The gap follows 'Britain was in a postwar slump… The economy was recovering, "
        "but there had been many years of ___, and some commodities were still "
        "rationed.' Slump + rationing = austerity. The other options either flip the "
        "polarity (prosperity) or do not fit the noun slot meaningfully (durability, "
        "liability)."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the gap",
            "text": (
                "Gap 31 needs a noun that names what Britain went through during its "
                "postwar slump — the cause that explains why commodities were still "
                "rationed. The sentence shape is 'many years of ___' with the next "
                "clause confirming 'some commodities were still rationed', so the noun "
                "must fit a deprivation/hardship slot."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read the surrounding clues",
            "text": (
                "Three signals all point in the same direction. 'Postwar slump' = a "
                "downturn after the war. 'Bombed-out buildings had yet to be "
                "reconstructed' = visible damage and shortage. 'Some commodities were "
                "still rationed' = goods were scarce enough to need government "
                "rationing. So the missing word names a stretch of economic hardship."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the semantic relationship",
            "text": (
                "The conjunction 'but' is decisive: 'the economy was recovering, BUT "
                "there had been many years of ___'. 'But' signals contrast — recovery "
                "is the positive side, so the gap is the negative side that recovery "
                "is climbing OUT OF. The gap is a synonym for hardship, deprivation, "
                "or scarcity."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary on each option",
            "text": (
                "'Austerity' (Latin austeritas, severity) = a long period of economic "
                "hardship, often imposed by government, with strict spending and "
                "rationing. 'Durability' = the ability to last a long time without "
                "damage — a quality of objects, not a national period. 'Prosperity' = "
                "wealth and economic flourishing — the opposite of what's needed. "
                "'Liability' = a debt or a disadvantage — close to deprivation but "
                "wrong register; you do not have 'many years of liability'."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": (
                "A — 'many years of austerity, and some commodities were still rationed' "
                "reads cleanly; austerity and rationing are the standard pairing for "
                "postwar Britain. B — 'many years of durability' makes no sense as a "
                "national-economic noun. C — 'many years of prosperity, and some "
                "commodities were still rationed' contradicts itself: prosperity does "
                "not coexist with rationing. D — 'many years of liability' is a "
                "register mismatch and does not name a national condition."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. Postwar slump + rationing + 'but recovering' all "
                "demand austerity. Insight in one sentence: when a postwar paragraph "
                "pairs 'rationing' and 'recovering' in adjacent clauses, the missing "
                "noun is austerity by collocation."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's easy to look at 'many years of ___' and reach for a word that "
                "names something lasting a long time — durability has 'lasting' in its "
                "meaning."
            ),
            "why_wrong": (
                "Durability is a property of objects (a car's durability, a fabric's "
                "durability), not a period a country can go through. 'Many years of "
                "durability' does not lexically work. Step 5's plug-and-test catches "
                "this."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "First instinct on 'the economy was recovering' is that recovery means "
                "good times — so the gap might name those good times. Prosperity sits "
                "in the right semantic field for the economy."
            ),
            "why_wrong": (
                "The conjunction 'but' demands a contrast with recovery, not a "
                "synonym. And prosperity directly contradicts the very next clause "
                "about rationing. Step 3's 'but'-contrast analysis blocks C."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you read 'a long stretch of bad things for Britain' loosely, "
                "liability (a downside, a problem) might feel close — both are "
                "negative."
            ),
            "why_wrong": (
                "Liability is wrong register: it names a debt or disadvantage you "
                "carry, not a period a country lives through. 'Many years of "
                "liability' is grammatically awkward. Step 4's gloss isolates the "
                "register mismatch."
            ),
        },
    ],
    technique=(
        "Collocation-and-contrast cloze: when the gap sits in a 'recovering BUT many "
        "years of ___' construction next to a 'rationed' clause, the answer is "
        "austerity by both collocation and contrast. Trigger to memorise: postwar + "
        "rationed + 'but recovering' → austerity."
    ),
    pitfall=(
        "Don't pick a word that names a quality of objects (durability) when the slot "
        "calls for a national-economic period. Cure: replace the gap with each "
        "candidate and check that the phrase 'many years of X' is something a country "
        "can actually have."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-032 — James Bond cloze: "the __ possibility" → C imaginary
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-032"] = E(
    solution_path=(
        "The critics' quote frames Bond as 'an escapist form of wish fulfilment' for "
        "an Empire in decline — England being 'placed at the centre of world affairs' "
        "while its real power was 'visibly and rapidly declining' is precisely a "
        "FICTITIOUS possibility, not a real one. C ('imaginary') is the only adjective "
        "that fits a wish-fulfilment scenario."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the gap",
            "text": (
                "Gap 32 sits inside a quotation from cultural critics: 'Bond embodied "
                "the ___ possibility that England might once again be placed at the "
                "centre of world affairs during a period when its world-power status "
                "was visibly and rapidly declining.' The missing adjective modifies "
                "'possibility' and has to fit the larger 'escapist wish fulfilment' "
                "frame the paragraph just established."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read the surrounding clues",
            "text": (
                "Two earlier lines set the frame. 'Fleming's novel was a glamorous tale "
                "of derring-do' and 'his books provided an escapist form of wish "
                "fulfilment.' Inside the quote itself the contrast is sharp: England "
                "'might once again be placed at the centre' WHILE its 'world-power "
                "status was visibly and rapidly declining'. The possibility is a "
                "fantasy held against the facts."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the semantic relationship",
            "text": (
                "The contrast inside the quote is the diagnostic: a 'possibility' that "
                "England regains centrality, set against a reality of decline, is by "
                "definition NOT REAL. So the missing adjective belongs to the "
                "fictional/wishful family, not the factual one."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary on each option",
            "text": (
                "'Strong' = forceful, robust — fits 'possibility' loosely but says "
                "nothing about whether it is real or imagined. 'Realistic' = grounded "
                "in reality — directly contradicts the wish-fulfilment frame. "
                "'Imaginary' = existing only in the mind, not in reality — the precise "
                "match for escapist wish fulfilment. 'Complex' = having many "
                "interconnected parts — irrelevant to whether the possibility is real."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": (
                "A — 'the strong possibility' suggests likelihood, but the rest of the "
                "sentence calls Bond escapist; you don't strongly believe in escapism. "
                "B — 'the realistic possibility that England might regain centrality "
                "WHILE declining' is a self-contradiction. C — 'the imaginary "
                "possibility' captures exactly the escapist/wish-fulfilment frame; "
                "imaginary lines up with 'might once again' as fantasy. D — 'the "
                "complex possibility' is empty rhetoric here — there's no nuance the "
                "passage is unpacking, just fantasy against reality."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. Bond as 'wish fulfilment' for a declining empire "
                "demands an adjective that names the fictional status of the "
                "possibility. Insight in one sentence: when the surrounding paragraph "
                "calls a narrative 'escapist wish fulfilment', the in-gap adjective "
                "for any 'possibility' it embodies will be in the imaginary/fictional "
                "family."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'might once again be placed at the centre' as a "
                "powerful wish and pick 'strong possibility' — strong fits 'wish' "
                "intuitively."
            ),
            "why_wrong": (
                "'Strong possibility' implies likelihood — that the thing might "
                "actually happen. The whole paragraph frames Bond as escapism, not "
                "plausible forecast. Step 3's contrast analysis catches this — "
                "'strong' is the wrong family of adjective."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "If you focus on the geopolitical specifics (MI6, Cold-War-era novels) "
                "you might read the quote as a sober political assessment and pick "
                "'realistic'."
            ),
            "why_wrong": (
                "The quote itself sets up the contradiction: England regaining "
                "centrality WHILE its power was visibly declining. That is the "
                "definition of unrealistic. Step 2's clue scan blocks B — the same "
                "sentence contains the word 'declining' which kills 'realistic'."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "Many reach for 'complex' as a safe-sounding intellectual adjective "
                "that could fit any literary-critical quote."
            ),
            "why_wrong": (
                "'Complex' would imply the critics are unpacking layered geopolitical "
                "nuance — but the critics are doing a clean wish-fulfilment reading. "
                "Step 4's gloss isolates 'complex' as an empty filler in this slot."
            ),
        },
    ],
    technique=(
        "Wish-fulfilment-frame matching: when a paragraph defines a narrative as "
        "'escapist wish fulfilment', any in-gap adjective modifying a 'possibility' "
        "or 'fantasy' within that narrative must come from the imaginary/fictional "
        "family. Trigger to memorise: escapist + wish fulfilment + 'might once again' "
        "→ imaginary."
    ),
    pitfall=(
        "Don't pick an adjective from a different family (likelihood, plausibility, "
        "complexity) just because it sounds intellectually serious. Cure: identify "
        "the frame the paragraph has already established before choosing the adjective."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-033 — James Bond cloze: "premise seems __" → D straightforward
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-033"] = E(
    solution_path=(
        "The sentence is built on a 'but' contrast: 'But if the premise seems ___, "
        "the making of the film was anything but.' The follow-up details (multiple "
        "title changes, five writers, several screenplay iterations) all describe "
        "messy, complicated production — so by contrast the premise itself must be "
        "SIMPLE. D ('straightforward') is the only adjective that means simple."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the gap",
            "text": (
                "Gap 33 takes the form 'the premise seems ___' inside a sentence that "
                "starts with 'But if'. The 'But if X, Y' shape signals a contrast: the "
                "filling of the gap must be set up to OPPOSE what comes next ('the "
                "making of the film was anything but')."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read the surrounding clues",
            "text": (
                "The 'but' contrasts the PREMISE with the MAKING. The making is "
                "described with three details: 'Its title was changed several times. "
                "The screenplay went through several iterations; five people are "
                "credited as writers.' All three describe a chaotic, complicated "
                "production process — so the premise it is being CONTRASTED with must "
                "be SIMPLE. The premise itself, summarised just before, is also one "
                "clean line: 'Bond brought out of retirement in Jamaica to track down "
                "a scientist'."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the semantic relationship",
            "text": (
                "The 'anything but' phrasing is decisive. 'The premise seems X, the "
                "making was anything but X' means the premise and the making sit on "
                "opposite ends of one quality. Since the making is described as messy "
                "(many title changes, many writers), the missing X is SIMPLE/CLEAN."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary on each option",
            "text": (
                "'Backward' = looking to the past, or moving in reverse — does not "
                "name simplicity. 'Adventurous' = involving exciting risk — Bond is "
                "adventurous, so the production-MAKING would not be 'anything but' "
                "adventurous; this would not set up the contrast. 'Sophisticated' = "
                "refined, complex — would imply the making was unsophisticated, but "
                "the making is described as overcomplicated, not unrefined. "
                "'Straightforward' = simple, clear, one-step — perfectly sets up the "
                "contrast with a tangled production process."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": (
                "A — 'premise seems backward, the making was anything but' is "
                "incoherent: a non-backward making does not describe the chaotic "
                "process detailed next. B — 'premise seems adventurous, the making was "
                "anything but' would mean a non-adventurous making, but the making is "
                "described as full of changes, not as cautious. C — 'premise seems "
                "sophisticated, the making was anything but' would mean a "
                "non-sophisticated making, but the making is described as elaborate, "
                "not crude. D — 'premise seems straightforward, the making was "
                "anything but [straightforward]' clicks: the premise is one line, the "
                "making is anything but simple."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The premise (track down a scientist) is simple; the "
                "production (five writers, multiple title changes) is not. Insight in "
                "one sentence: 'the X seems ___, but the Y was anything but' means X "
                "and Y sit on opposite ends of one axis — read Y to identify the axis "
                "and fill X with the opposite."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'Bond brought out of retirement' as a backward-"
                "looking premise — coming out of retirement is literally going back."
            ),
            "why_wrong": (
                "Even if 'backward' fit the plot, the 'anything but' construction "
                "needs the making to be the opposite of backward, which doesn't "
                "match the messy-production details. Step 3's contrast analysis blocks "
                "A — the axis here is simple/complex, not past/future."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many associate Bond with 'adventurous' — that is the whole genre. "
                "If the premise seems adventurous, the contrast 'anything but' could "
                "be read as 'mundane production'."
            ),
            "why_wrong": (
                "The making was 'changed several times' and went through 'several "
                "iterations' — that is messy and chaotic, not 'mundane'. Step 5's "
                "plug-and-test isolates the mismatch: adventurous's antonym (cautious "
                "/ ordinary) is not what the next lines describe."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you read 'globe-trotting tale of British exceptionalism' as "
                "polished and sophisticated, C feels like it fits — Bond is "
                "sophisticated."
            ),
            "why_wrong": (
                "The making is described as overcomplicated (many writers, many "
                "changes), not unsophisticated. The contrast needs simplicity, not "
                "refinement. Step 4's gloss separates 'sophisticated' (refined) from "
                "'complex' (many parts) — the axis here is simplicity."
            ),
        },
    ],
    technique=(
        "'X seems ___, Y was anything but' construction: the missing adjective is "
        "whatever Y is NOT. Read the description of Y first, decide the axis (here "
        "simple/complex), then fill X with the simple end. Trigger to memorise: "
        "'anything but' immediately after the gap → the gap is the opposite of what "
        "comes next."
    ),
    pitfall=(
        "Distractors here exploit Bond-genre associations (adventurous, sophisticated, "
        "backward). Cure: the answer depends on the CONTRAST grammar, not on the "
        "vibes of the franchise. Always solve 'anything but' constructions by "
        "describing the making first."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-034 — James Bond cloze: "__, many of the female characters have been
#  mere sexual props" → B Historically
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-034"] = E(
    solution_path=(
        "The next sentence begins #MeToo-era reform: Phoebe Waller-Bridge has just "
        "been hired to make female characters 'more realistic'. The gap-sentence "
        "describes the PRIOR pattern ('mere sexual props, often sporting provocative "
        "names') against which Waller-Bridge's reform is set. So the missing adverb "
        "places that prior pattern in the past — B ('Historically')."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the gap",
            "text": (
                "Gap 34 is a sentence-opening adverb followed by a comma: '___, many "
                "of the female characters have been mere sexual props…' The adverb "
                "modifies the whole clause. Since the verb tense is 'have been' "
                "(present perfect, looking back over time), the adverb should fit a "
                "long-running-pattern reading."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read the surrounding clues",
            "text": (
                "Two adjacent signals confirm the temporal frame. The preceding line "
                "says 'the clearest evidence of change may be found… of women' — so a "
                "change is in motion. The next sentence says 'In the wake of #MeToo, "
                "Phoebe Waller-Bridge was tasked with making its female figures more "
                "realistic.' Reform is happening now; the gap-sentence describes what "
                "is being reformed FROM. That positions the pattern in the past, "
                "across the long history of the franchise."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the semantic relationship",
            "text": (
                "The adverb has to mark a time-spanning pattern from the franchise's "
                "start up to the recent change. Of the four options, only one names "
                "an across-time pattern: Historically. The others name a manner "
                "(Reluctantly), a frequency (Occasionally), or a consequence "
                "(Consequently)."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary on each option",
            "text": (
                "'Reluctantly' = unwillingly — describes how someone does something, "
                "not a time-pattern. 'Historically' = over the course of history, as a "
                "general past pattern — exactly the long-running-pattern adverb the "
                "tense and the contrast call for. 'Occasionally' = sometimes, "
                "infrequently — would weaken 'many of the female characters' (which "
                "implies most-of-the-time, not sometimes). 'Consequently' = as a "
                "result — would mean the props-pattern is the EFFECT of what came "
                "before, but the prior clause is about evidence of change, not cause."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": (
                "A — 'Reluctantly, many of the female characters have been mere sexual "
                "props' would attribute reluctance to the franchise, which the "
                "passage does not — the franchise was not reluctant about its "
                "objectification. B — 'Historically, many of the female characters "
                "have been mere sexual props' reads as the franchise's long-running "
                "pattern, which is exactly the setup for Waller-Bridge's reform. C — "
                "'Occasionally, many… have been mere sexual props' is a contradiction "
                "between 'occasionally' and 'many'. D — 'Consequently' demands a "
                "cause-effect link to the prior clause that the prior clause does not "
                "supply."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The gap names the long-running pattern that the "
                "#MeToo-era reform is changing. Insight in one sentence: when a "
                "sentence-opening adverb sits before 'have been' and the next "
                "sentence describes a new reform, the right adverb is 'Historically'."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's tempting to read 'mere sexual props' as something the franchise "
                "did against its better judgment and reach for 'Reluctantly' — the "
                "adverb sounds apologetic."
            ),
            "why_wrong": (
                "Nothing in the passage suggests the franchise was reluctant about its "
                "earlier portrayals. The reform is recent (post-#MeToo), and the "
                "adverb needs to mark a long-running pattern, not a hesitant manner. "
                "Step 3's analysis catches this — the slot calls for time, not manner."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many read 'Occasionally' as a softener — perhaps the props-pattern "
                "wasn't ALL the time."
            ),
            "why_wrong": (
                "'Occasionally, MANY of the female characters' is internally "
                "inconsistent: 'occasionally' frequencies the action down, 'many' "
                "scales it up. Step 5's plug-and-test exposes the contradiction."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "First instinct on a paragraph-flow adverb is 'Consequently' — it is "
                "a common discourse marker and fits many slots."
            ),
            "why_wrong": (
                "'Consequently' demands a cause in the previous sentence — but the "
                "previous sentence is about EVIDENCE of change, not the cause of "
                "objectification. Step 4's gloss shows D fits a cause-effect frame "
                "the passage does not supply."
            ),
        },
    ],
    technique=(
        "Sentence-opening time-adverb scan: when the gap is a sentence-opening "
        "adverb followed by a 'have been' clause, and the next sentence describes a "
        "reform, pick the adverb that names the long-running pattern. Trigger to "
        "memorise: 'have been mere [X]' + reform in the next sentence → "
        "'Historically'."
    ),
    pitfall=(
        "Don't pick a manner adverb (Reluctantly) or a frequency adverb (Occasionally) "
        "when the slot needs a time-spanning adverb. Cure: read the next sentence to "
        "see what's being reformed, then match the gap to the long-running version of "
        "that pattern."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-035 — James Bond cloze: "__ abound that … MI6 has given the 007
#  codename to a black woman" → C Rumours
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-035"] = E(
    solution_path=(
        "The gap is a plural noun that 'abound' — meaning it occurs in large numbers "
        "— and what abounds is unverified speculation about a future plot point ('MI6 "
        "has given the 007 codename to a black woman'). The only option that "
        "describes unverified, widely-circulating talk is C ('Rumours')."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the gap",
            "text": (
                "Gap 35 takes a plural noun that pairs with the verb 'abound' (to "
                "exist in large numbers, to be plentiful). 'X abound that…' means many "
                "instances of X are circulating with a particular content. The "
                "following 'that'-clause supplies the content: MI6 has given the 007 "
                "codename to a black woman."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Read the surrounding clues",
            "text": (
                "The content of the gap-noun is speculation about a NEW casting "
                "decision that has not yet been confirmed in the article — the gap "
                "sits between Waller-Bridge's hire and the closing line about Bond "
                "'coming to terms with the modern world'. So the noun names "
                "speculative, unconfirmed talk about an upcoming change. The fact "
                "that the passage uses 'abound' (lots of them) signals informal, "
                "circulating speculation, not official statements."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Identify the semantic relationship",
            "text": (
                "The noun must (a) make sense as 'abounding' and (b) carry "
                "speculative, unverified content. Rumours abound, sayings abound, "
                "arguments abound, incidents abound — but only one of those names "
                "unverified informal speculation about future events."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary on each option",
            "text": (
                "'Sayings' = traditional short statements of wisdom (proverbs); they "
                "do not refer to specific contemporary news. 'Arguments' = "
                "reasoned cases for a position; they would imply justifications, not "
                "unverified speculation. 'Rumours' = unverified claims circulating "
                "informally — exactly what you would have when a casting decision is "
                "leaking before it's confirmed. 'Incidents' = specific things that "
                "happened — would name events, not speculation about events."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Plug and test",
            "text": (
                "A — 'Sayings abound that MI6 has given the 007 codename to a black "
                "woman' is a category error: sayings are proverbs, not casting leaks. "
                "B — 'Arguments abound that MI6 has given…' would mean people are "
                "REASONING about whether it happened; but the 'that'-clause is a "
                "factual claim about the codename, not a debated proposition. C — "
                "'Rumours abound that MI6 has given the 007 codename to a black "
                "woman' captures exactly the unverified-leak situation. D — "
                "'Incidents abound' is a register mismatch: incidents are events, not "
                "claims about events."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The article is reporting that speculation about a "
                "future casting choice is widespread, not that the choice has been "
                "made public. Insight in one sentence: 'X abound that [new "
                "development]' is the formal English construction for circulating "
                "rumours; the gap-noun is almost always 'rumours' when the content is "
                "an unconfirmed claim about a future event."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'Sayings abound' as a high-register variant of "
                "'people are saying' — and people are indeed saying things about Bond "
                "casting."
            ),
            "why_wrong": (
                "'Sayings' has a fixed sense: proverbs and traditional formulas, not "
                "current talk. Step 4's gloss isolates the register: 'sayings abound' "
                "would belong in a folk-wisdom paragraph, not in a casting-leak "
                "paragraph."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many read 'abound that…' as a debate marker — there must be many "
                "ARGUMENTS about whether the casting is happening."
            ),
            "why_wrong": (
                "'Arguments that X' implies reasoning IN FAVOUR of a position. The "
                "'that'-clause here states a fact-claim ('MI6 has given the codename "
                "to a black woman'), not a debated proposition. Step 5's plug-and-test "
                "shows arguments would demand reasoning, which the sentence does not "
                "supply."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember Bond as full of events ('incidents') and read "
                "'abound' as a generic plural verb, D feels grammatically plausible."
            ),
            "why_wrong": (
                "An 'incident' is a thing that happened, not a claim about something "
                "that might have happened. The sentence is about unverified "
                "speculation, not about events. Step 3's analysis blocks D — wrong "
                "noun-class for unconfirmed talk."
            ),
        },
    ],
    technique=(
        "'Rumours abound that' as a fixed collocation: when a paragraph reports "
        "circulating unverified speculation about a near-future event, the noun is "
        "'rumours'. Trigger to memorise: '___ abound that [unverified claim about a "
        "new development]' → rumours."
    ),
    pitfall=(
        "Don't confuse 'sayings' (proverbs) with current talk. Cure: ask whether the "
        "noun is timeless wisdom (sayings, proverbs) or current speculation (rumours, "
        "reports). 'Abound' fits both grammatically; the 'that'-clause content "
        "decides."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-036 — Killer Cats first two paragraphs → B
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-036"] = E(
    solution_path=(
        "Paragraph 1 says US cat owners have moved 70% of cats indoors because of "
        "research on cat-killed birds; paragraph 2 says UK cat owners take the "
        "opposite stance and have charities and the EU backing free roaming — there "
        "is no British equivalent of the US worry. So in Britain the issue has had "
        "limited attention, which is B."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks what can be CONCLUDED from the FIRST TWO paragraphs — "
                "so the answer must come from the US-vs-UK contrast those paragraphs "
                "construct. Conclusion questions reward you for synthesising the "
                "two-paragraph arc, not for repeating a single sentence."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "US side (paragraph 1): 'Research has shown that cats… kill billions "
                "of birds and mammals every year' and '70% of US cat owners now keep "
                "their cats inside, up from 35% in the late 1990s.' UK side "
                "(paragraph 2): 'UK cat owners feel differently: about 70% let their "
                "cats out' and 'there are few predators to worry about. The EU has "
                "even declared that it believes in the free movement of cats.' "
                "McDonald: 'It's a massive societal difference.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "Americans have absorbed the research on cat-caused wildlife harm and "
                "responded — most US cats are now indoor pets. Brits and other "
                "Europeans have gone the other way — most cats roam, charities and the "
                "EU support free movement, and the issue isn't a public preoccupation. "
                "So in Britain, the harm-caused-by-cats topic gets little public "
                "attention."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Limited attention' in option B = not widely discussed or worried "
                "about — the precise paraphrase of 'UK cat owners feel differently' "
                "plus a free-roaming culture, with charities and the EU on the "
                "free-roaming side. 'Societal difference' is McDonald's phrase for the "
                "same contrast. 'Massive' tells you the gap is large, not small."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says cats in Europe are 'overprotected' — the "
                "paragraphs say cats are MORE FREE in Europe, not more protected from "
                "the outside. B ('The negative impact of cats has so far received "
                "limited attention in Britain') maps onto the UK's free-roaming "
                "culture and absence of restrictions. C says European cat owners "
                "'deliberately ignored' the risks — there is no claim of deliberate "
                "ignoring; the paragraphs say Europeans feel differently, not that "
                "they cover up known risks. D says Americans 'exaggerate the figures' "
                "— the paragraphs report the US research as a finding, not as "
                "inflation."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is B. The US-vs-UK contrast in the first two paragraphs "
                "is precisely about WHERE the impact of cats has been taken seriously "
                "(US) and where it has not (Britain). Insight in one sentence: "
                "when paragraph 1 reports US behaviour change in response to research "
                "and paragraph 2 reports a UK that 'feels differently', the right "
                "option says the UK has not engaged the issue."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'access to the great outdoors is considered good "
                "for cats' wellbeing' as overprotection — Europeans pamper their cats "
                "with freedom."
            ),
            "why_wrong": (
                "'Overprotected' would mean protected from the outside; the "
                "paragraphs say the opposite — European cats are LET OUT more, not "
                "shielded more. Step 3's paraphrase tracks the direction: less "
                "restriction in Europe, not more protection."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many read 'McDonald says it's a massive societal difference' as a "
                "polite way of accusing Europeans of ignoring the science."
            ),
            "why_wrong": (
                "The paragraphs say European owners FEEL DIFFERENTLY and have "
                "different conditions (few predators, the EU's stance, Cats "
                "Protection charity). There is no claim that they know the risks and "
                "ignore them; they evaluate the issue differently. Step 5's "
                "option-by-option pass blocks C — 'deliberately ignored' is a stronger "
                "claim than the text supports."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember 'billions of birds' as a big number, you might "
                "suspect exaggeration — and pick D."
            ),
            "why_wrong": (
                "The article cites the figure as a research finding, then offers UK "
                "numbers (160-270 million animals annually) that align with the "
                "research direction. There is no skepticism about US figures. Step 2's "
                "first set of quotes shows the article TREATS the research as "
                "credible, not inflated."
            ),
        },
    ],
    technique=(
        "Two-paragraph behaviour-contrast: when paragraph 1 reports one country "
        "responding to research and paragraph 2 reports another country going the "
        "opposite way, the right conclusion names the second country's lack of "
        "engagement. Trigger to memorise: 'feel differently' + 'few predators to "
        "worry about' → limited attention to the issue."
    ),
    pitfall=(
        "Don't strengthen 'feel differently' into 'deliberately ignored' or "
        "'overprotected' — those are stronger claims than the text supports. Cure: "
        "match each option against the precise wording of the paragraphs, not "
        "against a confrontational reading."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-037 — Killer Cats, UK/Europe cats → C
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-037"] = E(
    solution_path=(
        "The article says 'cats are prolific hunters of wildlife in the UK and "
        "Europe, too' and cites a study estimating UK cats kill 160-270 million "
        "animals annually, with the real figure likely higher. The 'too' is the "
        "tell — UK/European cats are no less dangerous to wildlife than American "
        "ones, which is exactly C."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks what is said about cats in the UK and Europe — so "
                "you want a claim specifically about the UK/European cats' impact, "
                "not about owner attitudes. The relevant paragraph compares UK/EU "
                "cats' hunting record against the US baseline established in "
                "paragraph 1."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Two sentences carry the claim. 'But cats are prolific hunters of "
                "wildlife in the UK and Europe, too.' Then: 'A study based on the "
                "2011 pet population estimates that UK cats kill 160 to 270 million "
                "animals annually, a quarter of them birds. The real figure is "
                "likely to be even higher, boosted by the pandemic pet craze.' The "
                "word 'too' is the comparison hinge."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "UK and European cats hunt and kill wildlife at high rates, just like "
                "American cats do. The estimated UK kill count is between 160 and 270 "
                "million animals per year — and probably higher now. So British and "
                "European cats are not gentler than American ones; they are equally "
                "dangerous to wildlife."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Prolific hunters' = animals that hunt a great deal; 'prolific' "
                "carries the sense of producing a lot. 'No less dangerous than' in "
                "option C is a double-negative formulation meaning 'at least as "
                "dangerous as' — exactly the comparison the 'too' establishes. "
                "'Laissez-faire' (later in the article) = a hands-off attitude — "
                "describes owner behaviour, not the cats themselves."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says UK/EU cats cause LESS harm to other animals "
                "than American cats — directly contradicted by 'prolific hunters… "
                "too' and the 160-270 million figure. B says their hunting behaviour "
                "has been MODIFIED by long history as pets — the article says they "
                "are 'prolific hunters', not that they have evolved away from "
                "hunting. C ('They are no less dangerous to other animals than are "
                "American cats') captures the 'too' comparison precisely. D says "
                "their owners 'domesticated them in different ways' — the article "
                "talks about owner attitudes (let cats out vs keep them in), not "
                "about domesticating the cats themselves."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The article uses one short word — 'too' — to set "
                "up the cross-Atlantic comparison: UK/EU cats kill wildlife at "
                "American-level rates. Insight in one sentence: when a paragraph "
                "ends with 'X in [country B], too' after establishing the same "
                "phenomenon in [country A], the right option says the two countries "
                "are equal on that axis."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to read 'few predators to worry about' from paragraph 2 "
                "and infer that Europe is a safer environment where cats also do less "
                "harm."
            ),
            "why_wrong": (
                "'Few predators' refers to threats TO cats (foxes, coyotes), not "
                "harm DONE BY cats. The next paragraph explicitly says UK/EU cats are "
                "'prolific hunters' too. Step 2's hinge-quote ('too') blocks A — the "
                "comparison goes the opposite way."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many read 'introduced to Britain by the Romans' and 'longer history "
                "of dealing with any impact' as evolution toward gentler behaviour — "
                "the cats have been pets for so long they've changed."
            ),
            "why_wrong": (
                "The 'longer history' line refers to ECOSYSTEMS adapting to cats, not "
                "cats becoming less dangerous. The article still calls them prolific "
                "hunters today. Step 4's gloss separates owner-side change "
                "(historical absorption) from animal-side change (no such claim)."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember the article as a story of cultural differences in "
                "ownership style, D's 'owners have domesticated them in different "
                "ways' sounds like a plausible synthesis."
            ),
            "why_wrong": (
                "The article describes OWNER ATTITUDES (let out vs keep in), not "
                "different domestication processes producing different cats. Step 5's "
                "option-by-option pass shows D conflates owner behaviour with animal "
                "biology."
            ),
        },
    ],
    technique=(
        "The 'too' comparison hinge: when a paragraph opens with 'But X in [country "
        "B], too' after a different paragraph established X in [country A], the right "
        "option names the cross-country equivalence. Trigger to memorise: 'prolific "
        "hunters of wildlife in the UK and Europe, too' → no less dangerous."
    ),
    pitfall=(
        "Don't read 'few predators to worry about' as harm-by-cats; it is harm-TO-"
        "cats. Cure: track the direction of harm — DONE BY cats vs DONE TO cats — "
        "before matching options."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-038 — Killer Cats and UK bird decline → C
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-038"] = E(
    solution_path=(
        "The article cites Philip Baker noting that the birds most hunted by UK cats "
        "produce 'so many young they can afford to lose a lot of them' and that the "
        "RSPB is 'not particularly concerned' about cats' impact on the British "
        "mainland — UK bird declines are pinned on global warming, intensive "
        "agriculture, and habitat loss. So cats can hardly be assigned a significant "
        "role — exactly C."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks what can be CONCLUDED about cats in relation to the "
                "decline of birds in BRITAIN — so the answer is about cats' causal "
                "share in UK bird decline, not about cats' hunting in general. Note "
                "the question is specifically about decline, which is a "
                "narrower claim than 'cats hunt birds'."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Three lines anchor the answer. Baker on birds: 'the birds most "
                "hunted by cats have so many young that they can afford to lose a lot "
                "of them.' RSPB: 'is not particularly concerned about the impact of "
                "cats on the British mainland. Instead, it focuses on what it says is "
                "driving UK bird declines: global warming, intensive agriculture and "
                "expanding towns and cities leading to habitat and food loss.' And "
                "'cats primarily take \"the doomed surplus\": weak or injured birds "
                "likely to die anyway.'"
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "The big UK bird charity (RSPB) and the named expert (Baker) both "
                "say cats are not really driving the decline of British birds. The "
                "real causes are climate change, intensive farming, and habitat loss. "
                "Cats kill mostly the weak or already-doomed birds — the kind of "
                "kill that doesn't change population numbers. So cats hardly count "
                "as a significant cause of UK bird decline."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Doomed surplus' = the portion of a bird population already likely "
                "to die (weak, injured, redundant fledglings); cats kill these but "
                "their loss does not affect population totals. 'Hardly be assigned a "
                "significant role' in option C is the precise restatement of 'not "
                "particularly concerned' plus 'doomed surplus'. 'Beyond doubt' in "
                "option D is the opposite — high certainty of a major role."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says cats have been 'universally blamed' — the "
                "article says the opposite, that the RSPB is 'not particularly "
                "concerned'. B says cat owners often fail in responsibility — this "
                "is the AMERICAN expert Peter Marra's view at the end, not a "
                "conclusion about UK BIRD DECLINE. C ('Overall, cats can hardly be "
                "assigned a significant role') maps onto the RSPB position and "
                "Baker's 'doomed surplus' analysis. D says cats' harm to bird "
                "habitats is 'beyond doubt' — directly contradicted by the RSPB's "
                "stance."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is C. The article assembles two pieces of evidence — "
                "RSPB's stance and Baker's 'doomed surplus' point — to absolve cats "
                "of a significant role in UK bird decline. Insight in one sentence: "
                "when a passage names a national bird charity as 'not particularly "
                "concerned' about a suspected cause, the right option says that "
                "cause has a small role at most."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to look at the headline 'Killer Cats' and the 160-270 "
                "million figure and infer that cats are universally blamed in the "
                "UK for bird losses."
            ),
            "why_wrong": (
                "The article explicitly says the RSPB and Baker do NOT blame cats "
                "for UK bird decline. Step 2's RSPB quote is the diagnostic — the "
                "biggest UK bird charity is on record as 'not particularly concerned'."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many remember Peter Marra's closing line — 'people taking "
                "responsibility for their animal' — and infer that the article's "
                "conclusion about UK bird decline is about owner responsibility "
                "failures."
            ),
            "why_wrong": (
                "Marra is the AMERICAN ecologist; his point closes the article, but "
                "the QUESTION is about cats and UK bird decline specifically. The "
                "responsible-owner framing concerns owner behaviour, not the "
                "decline-cause assignment. Step 1's question-scoping rules out B."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you read 'cats kill 160-270 million animals annually' as a "
                "settled cause-of-decline figure, D's 'beyond doubt' might feel "
                "justified."
            ),
            "why_wrong": (
                "Killing a lot of animals is not the same as DRIVING bird DECLINE. "
                "The article distinguishes the two: cats kill many birds, but those "
                "birds are largely the 'doomed surplus' that wouldn't have lived "
                "anyway. Step 3's paraphrase tracks this distinction."
            ),
        },
    ],
    technique=(
        "Causal-share scan: when a question asks specifically about a phenomenon's "
        "role in a DECLINE, the right option distinguishes kill count from "
        "population effect. Trigger to memorise: 'doomed surplus' or 'so many young "
        "they can afford to lose a lot of them' → small role in decline."
    ),
    pitfall=(
        "Don't equate 'kills a lot of birds' with 'drives bird decline'. The article "
        "is precise on this — and the distractors exploit conflations. Cure: track "
        "whether the question is about KILL COUNT or POPULATION EFFECT before "
        "matching."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-039 — Killer Cats debate in Britain → A
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-039"] = E(
    solution_path=(
        "The article notes 'a growing minority are keeping their cats fully indoors' "
        "and reports Cats Protection's worry that 'if indoor-only became the norm…' "
        "— the trend Cummings is reacting to is a shift away from free roaming. So "
        "the current direction is toward LESS outdoor freedom, exactly A."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks what we are told about the DEBATE on cats in "
                "Britain — so you want a description of where the British "
                "conversation is heading, not a description of attitudes elsewhere. "
                "Watch for trend phrases like 'a growing minority' or 'becoming the "
                "norm'."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Three sentences carry the trend. 'So should the British adopt the "
                "American way and ditch free roaming? Though it is early days, a "
                "growing minority are keeping their cats fully indoors.' Then "
                "Cummings worries: 'if indoor-only became the norm, some cats would "
                "have significantly reduced welfare.' And Cats Protection now "
                "'recommends a dusk-till-dawn cat curfew' — restricted hours outdoors. "
                "All three signal movement toward less free roaming."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "More British cat owners are starting to keep their cats indoors, "
                "and the biggest cat charity now recommends a dusk-till-dawn curfew. "
                "The direction of the British debate is toward restricting "
                "outdoor time. Not everyone agrees, but the trend is real and the "
                "article frames it as the current movement."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Curfew' = a rule that requires you to stay inside during certain "
                "hours — exactly what Cats Protection recommends for dusk to dawn. "
                "'Less freedom' in option A is the precise paraphrase of 'fully "
                "indoors' and 'dusk-till-dawn curfew'. 'Dead against' in option D "
                "means strongly opposed — a sharper claim than the article supports."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A ('The current trend seems to be heading "
                "towards less freedom for cats to spend time outdoors') maps onto "
                "the growing-indoor-minority plus dusk-till-dawn curfew evidence. "
                "B says there is little interest in the issue — the article "
                "describes named charities, expert quotes, and a recommended policy, "
                "so the issue is engaged, not ignored. C says most cat-owners are "
                "worried — the worried minority is GROWING but the article says "
                "70% still let cats out. D says cat-lovers are 'dead against' "
                "restriction — overstates the position; Pirie and Cummings hold "
                "nuanced views, not flat opposition."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is A. The British debate is in motion, and the motion "
                "is toward less outdoor freedom for cats. Insight in one sentence: "
                "when an article uses 'a growing minority' plus a new policy "
                "recommendation in the same paragraph, the right option names the "
                "direction of motion, not the static majority."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "B",
            "why_tempting": (
                "It's tempting to read the British 'feel differently' framing from "
                "early paragraphs and infer the issue is dormant in the UK."
            ),
            "why_wrong": (
                "The article cites Cats Protection, the RSPB, Baker, Pirie, and "
                "Cummings — multiple named British actors actively engaging the "
                "issue with positions and policy recommendations. Step 2's "
                "evidence list rules out B; the debate is alive."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "Many read 'a growing minority' as 'lots of cat owners' and infer "
                "most are now worried."
            ),
            "why_wrong": (
                "'Minority' is the operative word — the article does not claim most "
                "owners are worried, only that the worried group is growing. Step 3's "
                "paraphrase keeps the proportion small: 70% still let cats out."
            ),
        },
        {
            "letter": "D",
            "why_tempting": (
                "If you remember Cummings saying 'we're not saying that all cats "
                "need to go outside' as a defence of free roaming, D's 'dead against "
                "restricting their pets' movement' feels close."
            ),
            "why_wrong": (
                "Cummings actually RECOMMENDS the dusk-till-dawn curfew — a "
                "restriction. So cat-lovers in the article support partial "
                "restriction; they are not flatly opposed to all restriction. Step "
                "5's option-by-option pass catches this — D overstates the "
                "opposition."
            ),
        },
    ],
    technique=(
        "Trend-direction scan in policy debates: when an article cites 'a growing "
        "minority' plus a new policy recommendation (curfew), the right option "
        "names the direction of change, not the static majority position. Trigger to "
        "memorise: 'growing minority' + 'dusk-till-dawn curfew' → less outdoor "
        "freedom."
    ),
    pitfall=(
        "Don't read 'growing minority' as 'majority' or 'dusk-till-dawn curfew' as "
        "'banned outdoors'. Cure: track the proportion and the partial-restriction "
        "scope before matching options."
    ),
)


# ─────────────────────────────────────────────────────────────────────────────
# verb2-ELF-040 — Killer Cats closing remarks → D
# ─────────────────────────────────────────────────────────────────────────────
EXPLANATIONS["var-2026-verb2-ELF-040"] = E(
    solution_path=(
        "The article's closing block quotes American Peter Marra demanding 'no "
        "compromise' and 'people taking responsibility for their animal', then "
        "explicitly states 'What that means, however, might prove to be a cultural "
        "difference.' The closing remarks summarise to a clear cross-cultural "
        "divergence — exactly D."
    ),
    steps=[
        {
            "n": 1,
            "title": "Understand the question",
            "text": (
                "The prompt asks how the CLOSING REMARKS about cats in Britain AND "
                "America can best be summarised — so you focus on the final "
                "paragraphs and look for the comparison the article ends on. With "
                "closing-summary items, the very last sentence usually hands you the "
                "answer."
            ),
            "tier": "essential",
        },
        {
            "n": 2,
            "title": "Locate the key sentences",
            "text": (
                "Two closing-block sentences are decisive. Marra (US): 'I don't think "
                "there should be a compromise. It's about people taking "
                "responsibility for their animal.' The article's commentary: 'What "
                "that means, however, might prove to be a cultural difference.' "
                "Earlier in the piece Cummings (UK) supports the dusk-till-dawn "
                "curfew as 'a sensible compromise' — so US no-compromise and UK "
                "compromise are explicitly opposed."
            ),
            "tier": "essential",
        },
        {
            "n": 3,
            "title": "Paraphrase in plain English",
            "text": (
                "The American expert says cat owners should not compromise — keep "
                "cats indoors, take responsibility, end of debate. The British "
                "expert says the sensible move is partial restriction — a curfew, "
                "not full confinement. The article closes by labelling this gap a "
                "cultural difference. So the closing summary is: Britain and America "
                "differ clearly in attitude."
            ),
            "tier": "essential",
        },
        {
            "n": 4,
            "title": "Vocabulary check",
            "text": (
                "'Cultural difference' is the article's own framing phrase — D "
                "echoes it directly with 'clear differences… between British and "
                "American attitudes'. 'Compromise' = a middle-ground solution; "
                "Britain says yes to compromise (curfew), America says no. "
                "'Profound disagreement' in option A is too strong — disagreement is "
                "about the strategy, not about the underlying scientific facts."
            ),
            "tier": "detail",
        },
        {
            "n": 5,
            "title": "Match against the options",
            "text": (
                "Walk each option. A says there is 'profound disagreement on the "
                "environmental harm done by cats' — the article actually shows broad "
                "agreement that cats kill wildlife; the disagreement is about what "
                "to DO. B says British people are 'more ignorant' of cats' impact — "
                "the article shows engaged British experts and charities, not "
                "ignorance. C says there is 'broad consensus' that cats need to roam "
                "— directly contradicted by Marra's no-compromise position. D ('Clear "
                "differences are to be found between British and American attitudes') "
                "maps onto the article's own closing phrase 'cultural difference'."
            ),
            "tier": "essential",
        },
        {
            "n": 6,
            "title": "Conclusion",
            "text": (
                "The answer is D. The article's own closing-line framing — 'cultural "
                "difference' — is the summary. Insight in one sentence: when an "
                "article ends with 'might prove to be a cultural difference', the "
                "right option restates that as 'clear differences between "
                "attitudes', not as scientific disagreement or ignorance."
            ),
            "tier": "essential",
        },
    ],
    framework_id=None,
    distractors=[
        {
            "letter": "A",
            "why_tempting": (
                "It's easy to mistake the policy disagreement for an underlying "
                "scientific one — if British and American experts say different "
                "things, surely the science is unsettled."
            ),
            "why_wrong": (
                "The article shows broad agreement on the FACTS — cats kill a lot, "
                "everyone knows it. The disagreement is about the response (full "
                "confinement vs curfew). Step 3's paraphrase keeps the science-vs-"
                "policy split clear."
            ),
        },
        {
            "letter": "B",
            "why_tempting": (
                "Many read British 'feel differently' and 'few predators to worry "
                "about' as ignorance — Brits just don't know what cats do."
            ),
            "why_wrong": (
                "The closing block has British experts citing real numbers, real "
                "studies, real policy recommendations. They engage the issue "
                "differently, not ignorantly. Step 5's option-by-option pass blocks "
                "B — 'ignorant' is a stronger word than the article supports."
            ),
        },
        {
            "letter": "C",
            "why_tempting": (
                "If you remember the UK culture of free roaming and the EU's "
                "endorsement, C's 'broad consensus that cats need to be allowed "
                "outdoors' feels close."
            ),
            "why_wrong": (
                "Marra explicitly rejects this — 'I don't think there should be a "
                "compromise.' The American closing position negates the consensus C "
                "claims. Step 2's Marra quote blocks C — there is no consensus, "
                "there is a culture gap."
            ),
        },
    ],
    technique=(
        "Article's own framing as anchor: when the article ends with a phrase like "
        "'cultural difference', the right option restates that phrase. Trigger to "
        "memorise: 'might prove to be a cultural difference' → 'clear differences "
        "between attitudes'."
    ),
    pitfall=(
        "Don't escalate a policy difference into a scientific dispute (A) or "
        "national ignorance (B). The article carefully labels the gap a cultural "
        "one. Cure: locate the article's own summary phrase before matching options."
    ),
)


def main():
    """Write the regen file (with checkpoints every 5 entries)."""
    out = Path("audit/_regen/var-2026-elf.json")
    # We have the full set in memory; emit incrementally for the
    # 'save every 5 entries' contract.
    sorted_keys = sorted(EXPLANATIONS.keys())
    accumulated = {}
    for i, qid in enumerate(sorted_keys, start=1):
        accumulated[qid] = EXPLANATIONS[qid]
        if i % 5 == 0 or i == len(sorted_keys):
            out.write_text(
                json.dumps(accumulated, indent=2, ensure_ascii=False, sort_keys=True)
            )
            print(f"  checkpoint at {i}/{len(sorted_keys)} → {len(accumulated)} entries on disk")
    print(f"done — {len(accumulated)} ELF entries written to {out}")


if __name__ == "__main__":
    main()
