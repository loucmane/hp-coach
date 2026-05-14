"""Author Layer-2 ELF explanations for var-2023.

Variant-C Ultra-Granular voice, NO API. Hand-authored from the
passage text and answer key in data/parsed/var-2023.json (passage
'Intellectuals' recovered from hp_databas.json).

Saves checkpoint every 5 entries to audit/_regen/var-2023-elf.json.
"""
from __future__ import annotations

import json
from pathlib import Path

META = {
    "model": "claude-opus-4-7",
    "generated_at": "2026-05-14",
    "recipe": "variant-c-ultra-granular",
}

OUT = Path(__file__).parent / "var-2023-elf.json"


def emit(store: dict, qid: str, payload: dict) -> None:
    payload["_meta"] = META
    store[qid] = payload
    if len(store) % 5 == 0:
        OUT.write_text(json.dumps(store, indent=2, sort_keys=True, ensure_ascii=False))
        print(f"  checkpoint: {len(store)} entries -> {OUT}")


def main() -> None:
    s: dict = {}

    # ===== PASSAGE 1: "Experts and Nonexperts" =====
    # ELF-031 (ans A)
    emit(s, "var-2023-verb1-ELF-031", {
        "solution_path": "The 'Experts and Nonexperts' passage argues that specialists are essential for some problems (surgery) while generalists outperform on others (climate, inequality, policing) — exactly the 'different problems require different degrees of expertise' framing in A.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "The prompt asks for a general conclusion. That means the option that captures the WHOLE argument, not a slogan from one sentence. Read the paragraph end-to-end, then ask: what single claim does every sentence support?",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the two anchors",
                "text": "The paragraph has two balancing claims. One: 'in a variety of situations, certain nonexperts, or generalists, can actually make better predictions than experts'. Two: 'Such situations, of course, do not include, say, picking a surgical procedure, for which subject-matter expertise is an enormous asset.' These two sentences together do the work.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "Specialization is useful, but it isn't the right tool for every problem. For narrow, technical questions (which surgery to pick) you want an expert. For broad, cross-disciplinary questions (climate change, inequality, policing) generalists can outperform experts. So the right approach depends on the problem.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Generalist' = someone who knows a little about a lot, the opposite of a specialist. 'Eclectic array of perspectives' = a varied mix of viewpoints. 'Subject-matter expertise' = deep knowledge in one field. 'Untold value' = enormous, hard-to-measure value.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "Walk each option past both anchors. A ('different types of problems require different degrees of expertise') captures exactly the surgery-vs-climate split. B ('specialist knowledge has been replaced by common sense') — the passage never says specialists are obsolete; it says they are right for some problems. C ('expert competence tends to be undervalued') — the passage gives experts full credit for surgery; it does not say they are undervalued overall. D ('nonspecialists are just as useful as experts in any given field') — too strong; the passage explicitly carves out surgery as expert territory.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is A. The passage's structural move is a balanced split — experts for narrow technical problems, generalists for broad cross-disciplinary ones — and only A names that split without overshooting.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "B",
                "why_tempting": "It's easy to read 'untold value in knowing a little about a lot' as a victory lap for common sense over expert knowledge — as if specialists are being replaced.",
                "why_wrong": "The passage never says specialists have been replaced. Step 2's second anchor — surgery requires 'an enormous asset' of expertise — keeps the specialist firmly in business.",
            },
            {
                "letter": "C",
                "why_tempting": "Many stop at the word 'dangerous' in the second sentence and read the passage as a complaint that experts are being underrated.",
                "why_wrong": "'Dangerous' modifies the implication that EVERYONE should specialize, not the value of expert competence itself. Step 3's paraphrase shows the author still respects expertise; the worry is overreach, not underestimation.",
            },
            {
                "letter": "D",
                "why_tempting": "First instinct is to grab the boldest pro-generalist claim — 'nonspecialists make better predictions than experts' — and read it as a blanket equivalence.",
                "why_wrong": "The passage qualifies that claim 'in a variety of situations' and immediately excludes surgery. Step 5 catches the overreach: D drops the qualifier and overgeneralises to 'any given field'.",
            },
        ],
        "technique": "On 'general conclusion' items, find the option that names the STRUCTURE of the argument (a contrast, a split, a balanced trade-off) rather than just echoing a memorable phrase. The right answer almost always covers both sides the paragraph sets up; wrong answers tend to pick a single side and inflate it.",
        "pitfall": "Strong language in one sentence ('dangerous', 'untold value', 'better predictions than experts') pulls your attention to that side of the argument and tempts you to pick an option that one-sidedly endorses it. The general-conclusion question rewards readers who notice the qualifier that follows.",
    })

    # ELF-032 (ans C) — "What is further implied?"
    emit(s, "var-2023-verb1-ELF-032", {
        "solution_path": "The paragraph names the kinds of problems where generalists outperform: 'inequality, climate change, policing — that require thinking broadly (and smartly) across many disciplines'. Those are exactly contemporary political/social issues, so 'major political questions may benefit from participation by nonexperts' (C) is the implication.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'Further implied' is an inference question: the answer is not stated word-for-word but follows directly from a specific sentence. Look for the option that names a logical next step from a concrete claim in the text.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the trigger sentence",
                "text": "The final sentence is the implication source: 'But they do include solving contemporary issues – inequality, climate change, policing – that require thinking broadly (and smartly) across many disciplines.' This lists the kinds of problems where generalists shine.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Restate in plain English",
                "text": "Inequality, climate change and policing are political and social issues. The author says these benefit from broad, cross-disciplinary thinking — i.e. from generalists, not just experts. So when society faces these problems, nonexperts have a useful role to play.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Contemporary issues' = current, present-day problems. 'Across many disciplines' = involving multiple fields of study at once. 'Cutting-edge' (in option B) = the most advanced, the frontier. 'Public demand' (in option D) = what people ask for in general.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('education should pay more attention to present-day urgent matters') — the passage talks about who solves the problems, not how schools should change. B ('current emphasis on cutting-edge expertise is not in doubt') — the passage actively QUESTIONS that emphasis ('the implication … is dangerous'). C ('major political questions may benefit from participation by nonexperts') — maps directly onto inequality/climate/policing as 'contemporary issues' solved by generalists. D ('public demand for experts has gradually started to rise') — the passage trends the other way, toward valuing generalists.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is C. The closing list (inequality, climate, policing) is the inference fuel: those are political questions, and the passage assigns them to generalists. C names that pairing exactly.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "Left-to-right reading gives a strong feeling that the author wants something to CHANGE about how society approaches these issues, and 'education' is the most familiar lever.",
                "why_wrong": "The passage is about who is better at making predictions on these issues, not about curriculum design. Step 3's paraphrase has no claim about schools.",
            },
            {
                "letter": "B",
                "why_tempting": "It's easy to skim 'superficially, this trend makes sense' and conclude the author endorses the current pro-expert consensus.",
                "why_wrong": "The very next sentence calls the implication 'dangerous'. Step 2 shows the passage's centre of gravity is the OPPOSITE of 'not in doubt' — it's actively in doubt.",
            },
            {
                "letter": "D",
                "why_tempting": "If you remember 'specialization' as today's dominant ideology, D feels like a natural extrapolation: more specialization means more demand for experts.",
                "why_wrong": "Even if expert-demand were rising elsewhere, this paragraph offers no evidence for it; it only argues for more space for generalists. Step 5 catches the misdirection — D would be a counter to the author, not an implication of the author.",
            },
        ],
        "technique": "On 'further implied' items, anchor the inference to a SPECIFIC sentence — usually the last one in the paragraph, which names the consequence the author wants you to draw. The right option restates that consequence in slightly different words; wrong options bring in ideas the text doesn't touch.",
        "pitfall": None,
    })

    # ===== PASSAGE 2: "Kroomen – Hunting Down Black Slavers" =====
    # ELF-033 (ans D) — intro paragraph
    emit(s, "var-2023-verb1-ELF-033", {
        "solution_path": "The introductory paragraph says Britain 'negotiated deals with local African rulers, many of whom engaged in war and kidnapping on behalf of slave traders'. That matches D — many African leaders had a positive attitude toward involvement in slave trading.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "The question restricts you to the introductory paragraph. Re-read only that paragraph; ignore everything that comes after, even if it's tempting context.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentence",
                "text": "Late in the first paragraph: 'They also negotiated deals with local African rulers, many of whom engaged in war and kidnapping on behalf of slave traders from Europe and the Americas.' That single sentence is the centre of gravity for this question.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "Many African rulers were ACTIVE participants in the slave trade — fighting wars and abducting people to sell to European and American slave traders. So they were not victims of the trade so much as partners in it.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Engage in' = take part in. 'On behalf of' = working for. 'Kidnapping' here is the literal abduction of people for the slave trade. 'Local rulers' = the chiefs or kings of West African coastal states. 'Instigated wars' = started wars on purpose.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('the Royal Navy initially sabotaged Parliament's ban') — the paragraph says the Navy patrolled to enforce the ban; the word 'sabotage' is invented. B ('Europe and Africa were united in helping Britain end the slave trade') — directly contradicted: African rulers were on the OTHER side of the trade. C ('Britain forced other European nations to join') — the paragraph says Britain 'built a system of treaties' (negotiation), not coercion. D ('African leaders often had a positive attitude towards involvement in slave trading') — matches the key sentence; 'many of whom engaged in war and kidnapping on behalf of slave traders' is exactly a positive attitude toward participation.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is D. The intro paragraph deliberately complicates the standard 'Britain vs slavery' picture by noting that many African rulers were partners in the trade — that complication is the point of the paragraph.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to read 'only a few ships could be spared from the long war against Napoleon' as evidence that the Navy was dragging its feet on enforcement.",
                "why_wrong": "Limited resources because of a separate war is not sabotage; the Navy was actively patrolling with what it had. Step 3's paraphrase has no claim about sabotage anywhere.",
            },
            {
                "letter": "B",
                "why_tempting": "Many stop at 'Britain slowly built a system of treaties with European powers' and assume the international coalition extended to African partners too.",
                "why_wrong": "The very next sentence flips this for Africa — many African rulers were ON THE OPPOSITE SIDE of the trade. Step 2's key sentence forecloses unity.",
            },
            {
                "letter": "C",
                "why_tempting": "First instinct on a colonial-era passage is to read British power as coercive: 'forced' feels like an authentic 19th-century verb.",
                "why_wrong": "The paragraph uses 'built a system of treaties' and 'negotiated deals' — both negotiation verbs. Step 5 shows C imports coercion the text does not use.",
            },
        ],
        "technique": "On 'what are we told in paragraph X' items, refuse the temptation to use the whole text. Re-read only the specified paragraph, then look for the ONE sentence that complicates an obvious reading — that complication is almost always the answer.",
        "pitfall": "Background-knowledge bias is the trap here: readers who know slavery was forced upon Africa may auto-pick a passive-victim option (B) and ignore the paragraph's actual claim that many local rulers were active participants. Trust the text over your priors.",
    })

    # ELF-034 (ans B)
    emit(s, "var-2023-verb1-ELF-034", {
        "solution_path": "Paragraph 2 of the body calls the Kroomen 'the slaver hunters par excellence', describes 'acts of bravery' and 'the lion's share of landing parties', and later says 'there is almost no overstating the esteem that captains had for their Kroomen'. That matches B — much appreciated for their achievements as slaver hunters.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'What is said about the Kroomen?' is a broad question — but four narrow options are on offer, and each one tests a specific claim. Read the paragraphs that describe the Kroomen's role, then match.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "Three sentences carry the answer. First: 'These so-called Kroomen, from the West African coast, were the slaver hunters par excellence.' Second: 'They built a reputation for acts of bravery, usually forming the lion's share of landing parties hunting for slavers ashore.' Third, much later: 'There is almost no overstating the esteem that captains had for their Kroomen.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "The Kroomen were the BEST at hunting down slavers. They did the most dangerous landings, were famous for bravery, and captains thought extremely highly of them. The text spends multiple paragraphs underscoring how valued they were.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Par excellence' = the prime example, the best of the best. 'Lion's share' = the largest portion. 'Esteem' = high respect. 'Manpower' = the workforce of a ship's crew. 'Men-of-war' = naval warships of the era.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('relieved of routine work') — the text says the OPPOSITE: 'They did the typical duties of an ordinary sailor but also specialised in ship-to-shore communications'. B ('much appreciated for their achievements as slaver hunters') — matches 'par excellence' + 'esteem'. C ('preferred to operate in independence from Royal Navy orders') — overreach; they had some semi-autonomy on enlistment terms but operated INSIDE Navy structures and orders during service. D ('made up a majority of slaver hunters') — too strong; the text says 'as much as one third of the manpower' and 'the lion's share of LANDING parties', not a majority of the whole effort.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is B. 'Par excellence', 'reputation for acts of bravery', and 'almost no overstating the esteem' all point the same way: deep professional appreciation.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to read 'specialised in ship-to-shore communications' as a special exemption — as if specialists are relieved of grunt work.",
                "why_wrong": "The same sentence specifies 'They did the typical duties of an ordinary sailor BUT ALSO specialised'. Step 5 shows it was an addition to ordinary duties, not a substitute.",
            },
            {
                "letter": "C",
                "why_tempting": "Later in the passage the Kroomen 'could enter and leave [Navy service] on terms worked out with the captain'. That semi-autonomy can look like operational independence.",
                "why_wrong": "Semi-autonomy on enlistment is about WHEN they served, not WHOSE ORDERS they followed during service. The passage explicitly says they 'were integrated into the Royal Navy' with 'commensurate pay', i.e. inside the command structure.",
            },
            {
                "letter": "D",
                "why_tempting": "Numbers like 'one third' and 'lion's share' can blur into 'most' on a quick read.",
                "why_wrong": "'One third of the manpower' is explicitly not a majority. 'Lion's share of LANDING parties' is a narrower claim than 'majority of slaver hunters' overall. Step 5 forces the distinction.",
            },
        ],
        "technique": "On 'what is said about X' items where the passage spends multiple paragraphs on X, look for the option that captures the OVERALL EVALUATION the author makes, not a single specific detail. Here the evaluation is 'highly esteemed' and it appears three different ways across the text.",
        "pitfall": None,
    })

    # ELF-035 (ans A)
    emit(s, "var-2023-verb1-ELF-035", {
        "solution_path": "The 'Kroomen' passage says the Kru group's identity 'cannot be disentangled from the rise of European trading along the West African coast and, more importantly, the history of the British Preventative Squadron'. That is exactly A — their sense of being a special group was partly linked to contact with Europeans.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'What is argued in relation to the Kru tribe?' — the verb 'argued' signals that the author is making a CLAIM about the tribe, not just describing it. Look for the option that names that claim.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentence",
                "text": "The third paragraph: 'But their identity as a nation or community was not based on just ethnicity or a common homeland. It cannot be disentangled from the rise of European trading along the West African coast and, more importantly, the history of the British Preventative Squadron.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "The Kru did share a language and a stretch of coastline, but those things alone don't explain their identity as a group. Their sense of being one people grew out of their dealings with Europeans — and especially their work with the British anti-slavery squadron. Identity here is RELATIONAL, not just genealogical.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Disentangle' = separate one thing from another. 'Common homeland' = shared geographic origin. 'Tribal loyalties' (in option C) = loyalty to one's tribe. 'Reorient their livelihood' = adapt how they make a living. The argument's pivot is on 'not based on JUST' — that 'just' is doing all the work.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('their sense of making up a special group was partly linked to their contacts with Europeans') — maps onto 'cannot be disentangled from… European trading' exactly. B ('traditional way of life under threat by foreign traders') — the passage says they REORIENTED toward European trade, not that traders threatened them. C ('tribal loyalties put to the test when confronted with the Preventative Squadron') — the squadron was an OPPORTUNITY they embraced, not a test of loyalty. D ('language and customs alone defined them as a separate national group') — directly contradicted: the passage says their identity was NOT based on just ethnicity or homeland.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is A. The passage's whole argument about Kru identity is that it was shaped IN PART by their European-coast trade and Royal Navy service — not by tribe-as-such alone.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "B",
                "why_tempting": "It's easy to overlay a generic colonial-encounter template — foreign traders arrive, indigenous way of life suffers — on any 19th-century African passage.",
                "why_wrong": "The passage describes Kru traders APPROACHING European ships and 'reorienting their livelihood' to that trade. Step 3's paraphrase shows adaptation, not threat.",
            },
            {
                "letter": "C",
                "why_tempting": "If you remember 'loyalty' as the central tension in any group-identity story, C sounds like the kind of sentence that should be true.",
                "why_wrong": "The Kroomen JOINED the squadron and built a reputation on it — there is no test of loyalty in the passage. Step 5 catches the invented tension.",
            },
            {
                "letter": "D",
                "why_tempting": "Language and a shared homeland ARE mentioned, and at a quick glance the passage seems to be doing standard tribe-defining work.",
                "why_wrong": "The next sentence flips it: identity was NOT based on just ethnicity or homeland. Step 4's emphasis on the word 'just' is decisive — D drops that qualifier.",
            },
        ],
        "technique": "On 'what is argued' items, scan for 'not just X' or 'cannot be disentangled from Y' constructions. They explicitly mark the author's argumentative claim: not the obvious explanation (X) but a less obvious one (Y). The correct option names Y.",
        "pitfall": "The word 'just' in 'not based on JUST ethnicity' is the linchpin. A quick read can drop it and land on D's full-strength ethnicity claim — the very claim the author is correcting. Underline qualifying words like 'just', 'only', 'primarily' on first read.",
    })

    # ELF-036 (ans A)
    emit(s, "var-2023-verb1-ELF-036", {
        "solution_path": "The fourth paragraph notes that a Krooman 'could enter and leave [Royal Navy service] on terms worked out with the captain' and that 'for Royal Navy sailors, this kind of semi-autonomy was unthinkable'. That is a privilege beyond the Navy's regular employment terms — exactly A.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'In relation to the Kroomen in the Royal Navy' narrows you to the paragraph that describes their service conditions. That paragraph contrasts them with ordinary sailors — that contrast is where the answer will live.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "'A special feature of a Krooman's service in the Royal Navy was that he could enter and leave it on terms worked out with the captain. That might mean a change even in the middle of a patrol, if beneficial to both sides. For Royal Navy sailors, this kind of semi-autonomy was unthinkable.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "Ordinary Royal Navy sailors signed up for fixed terms; they couldn't just leave when they felt like it. Kroomen could — they negotiated their own enlistment and exit, sometimes mid-patrol. That is a clear privilege over what ordinary sailors got.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Semi-autonomy' = partial independence. 'Bounties' = financial rewards for captures. 'Commensurate pay' = pay matching the position. 'Conform' (in option D) = follow the rules. 'Privileges apart from regular terms' (in option A) = perks above and beyond the standard contract.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('enjoyed a number of privileges apart from the Navy's regular terms of employment') — the enter-and-leave-on-their-terms autonomy is literally a privilege beyond regular terms. Earlier in the passage they also kept their own canoes onto warships — another non-standard perk. B ('endured a great deal of prejudice') — the passage stresses ESTEEM, not prejudice; question 037 will return to this. C ('got into unnecessary trouble') — no mention of trouble; the only mention of their conduct is bravery. D ('refused to conform to general working requirements') — they 'were subject to the same hardships and fighting as their shipmates, perhaps more' — they did conform.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is A. The Kroomen had a privilege Royal Navy sailors found 'unthinkable' — negotiable terms of service — and that privilege is the centrepiece of the paragraph.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "B",
                "why_tempting": "It's easy to project a default 19th-century racial-prejudice picture onto a black-sailors-in-the-Royal-Navy story.",
                "why_wrong": "The text actively says racism was hardly an issue on these ships — captains held the Kroomen in 'esteem' that was 'almost impossible to overstate'. Step 5 forecloses prejudice in this specific context.",
            },
            {
                "letter": "C",
                "why_tempting": "First instinct when reading about a 'special' group of sailors with their own canoes and customs is that they probably clashed with the regulars.",
                "why_wrong": "The passage gives no example of trouble; the only behaviour described is bravery and integration ('integrated into the Royal Navy, ranging from ship's boys to able seamen').",
            },
            {
                "letter": "D",
                "why_tempting": "If you remember 'refused to convert to Christianity' and 'refused to learn or write English' from the same paragraph, D's framing (refusing to conform) feels close.",
                "why_wrong": "Those refusals were about religion and language, not WORK. The text explicitly says they DID conform to the working requirements: 'subject to the same hardships and fighting as their shipmates, perhaps more.' Step 5 separates job conformity from cultural autonomy.",
            },
        ],
        "technique": "On 'what is said about X in context Y' items, find the paragraph that describes X in exactly context Y, then look for the sentence the author marks as special ('a special feature was', 'notably', 'unlike others'). That marker is the author saying THIS is the contrast you should remember.",
        "pitfall": None,
    })

    # ELF-037 (ans C)
    emit(s, "var-2023-verb1-ELF-037", {
        "solution_path": "The author writes that the Kroomen built their reputation BEFORE 'scientific racism' took hold, that Europeans then accepted them as 'a particularly estimable race', and that captains' esteem 'is almost impossible to overstate'. That implies racist attitudes were hardly an issue on board — exactly C.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'In their heyday' restricts you to the period BEFORE scientific racism — roughly mid-19th century — when the Kroomen were at peak influence. The question asks what's IMPLIED about racism in that window, not stated outright.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "'For one thing, the Kroomen established their reputation before so-called scientific racism made African inferiority a general, predetermined, almost genetic condition. Before pseudo-science proclaimed that Africans were lower on some kind of universal ladder of evolution, Europeans and Americans could more easily accept that a particular African nation were a particularly estimable race. There is almost no overstating the esteem that captains had for their Kroomen.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "During the Kroomen's heyday, scientific racism wasn't yet the dominant ideology. Without that ideological pressure, Europeans and Americans could simply respect a specific African group on merit. On these ships, in this period, racism wasn't a significant factor in how the Kroomen were treated.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Heyday' = period of greatest success or influence. 'Scientific racism' / 'pseudo-science' = the 19th-century ideology claiming biological hierarchies between races. 'Estimable' = worthy of high respect. 'Universal ladder of evolution' = a (fake) single ranking of all peoples.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('racism was so common… they hardly took any notice of it') — backwards; the passage says racism was NOT yet common in this form. B ('Kroomen chose to ignore racial problems') — the passage describes EUROPEAN attitudes, not Kroomen coping. C ('racist attitudes were hardly an issue on board the ships') — matches the trio: pre-scientific-racism + estimable-race acceptance + 'almost impossible to overstate' esteem. D ('ordinary sailors expressed openly racist views') — the text gives no such example; the only attitude described is high regard.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is C. The author's whole point in this paragraph is that the Kroomen's golden age happened in a brief window before scientific racism reshaped attitudes — and in that window, racism on these ships was a non-issue.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to read 'before so-called scientific racism' as 'before scientific racism became formalised, ordinary racism was still everywhere'.",
                "why_wrong": "The author argues the opposite: BEFORE scientific racism gave African inferiority a 'general, predetermined' status, individual African groups could be respected on merit. Step 3 makes the chronological direction explicit.",
            },
            {
                "letter": "B",
                "why_tempting": "Default modern reading of any historical black-in-white-institution scenario is that the black subjects must have been coping with constant prejudice.",
                "why_wrong": "The question asks about ATTITUDES on board, not about Kroomen coping strategies. The paragraph describes European/American attitudes as accepting. Step 5 catches the misdirected subject.",
            },
            {
                "letter": "D",
                "why_tempting": "If you remember 'ordinary sailor' from the earlier paragraph about manpower, you might import a generic 'sailors were racist' assumption.",
                "why_wrong": "The text gives zero examples of sailor racism toward Kroomen. The only sailor-Kroomen interactions described are integration into ranks and shared hardships. Step 5 shows D supplies an attitude the text never reports.",
            },
        ],
        "technique": "On 'what is implied about X' items where the author marks a historical PERIOD ('in their heyday', 'before scientific racism'), respect that bracketing. The answer is about that specific window, not about the broader era's reputation. The author is often distinguishing a brief exceptional period from the dominant pattern.",
        "pitfall": "Modern hindsight makes 'racism was everywhere in the 19th century' feel like a safe assumption. The author goes out of his way to mark a brief window when that wasn't yet true on these specific ships — and the question is locked to that window.",
    })

    # ===== PASSAGE 3: "Eggs" / "An Invention" =====
    # ELF-038 (ans C) — final-sentence tone, refers to "Eggs"
    emit(s, "var-2023-verb1-ELF-038", {
        "solution_path": "The 'Eggs' passage closes with 'overall it's the bird that shapes the egg, forever proving which comes first' — a deadpan punch line that flips the chicken-and-egg cliché. The tone is humorous (C).",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "Tone questions ask you to characterise the WAY the author writes the final sentence, not what it says. Read it aloud in your head; ask which of the four labels (sarcastic, confident, humorous, surprised) actually fits the delivery.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the line",
                "text": "Final sentence of 'Eggs': 'So overall it's the bird that shapes the egg, forever proving which comes first.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Read it in plain English",
                "text": "The line is a deliberate echo of the 'chicken or the egg, which came first?' riddle. The author plays on it: since the bird's body determines the egg's shape, the bird comes first. It's a lighthearted joke, not a serious philosophical claim.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Sarcastic' = mockingly insincere, usually saying the opposite of what you mean. 'Confident' = expressing certainty without humour. 'Humorous' = playful, intended to amuse. 'Surprised' = startled by an unexpected finding. The chicken-and-egg riddle is a classic English idiom for an unanswerable question.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('sarcastic') — sarcasm requires the speaker to mean the opposite of the literal words; here the author actually does mean the bird shapes the egg. B ('confident') — too flat; confidence wouldn't reach for the chicken-and-egg gag. C ('humorous') — matches the playful punch-line move on a famous riddle. D ('surprised') — the rest of the paragraph reports the finding calmly; the closing line is a smile, not a gasp.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is C. The author wraps a scientific finding in a one-liner that resolves a folk-philosophy riddle — that pivot from data to joke is the humour.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to read any cute closing line as ironic, especially when the writer seems to be 'too clever' about a known cliché.",
                "why_wrong": "Sarcasm needs the speaker to mean the opposite; here the literal claim (the bird shapes the egg) is the author's actual conclusion from the study. Step 3 separates wit from sarcasm.",
            },
            {
                "letter": "B",
                "why_tempting": "Many stop at 'overall' and 'forever proving' and read declarative confidence in those phrases.",
                "why_wrong": "Confident prose doesn't reach for the chicken-and-egg gag — it states the conclusion directly. The reach for the riddle is what makes the line playful rather than plain.",
            },
            {
                "letter": "D",
                "why_tempting": "If you missed the chicken-and-egg riddle, the line can feel like a startled scientist exclaiming a new discovery.",
                "why_wrong": "The earlier sentences treat the finding calmly ('researchers finally cracked the case', 'they found no nesting habit links'). Step 5 shows the closing line follows the same calm register, just with a wink.",
            },
        ],
        "technique": "On 'tone of the final sentence' items, ask first whether the line is doing a SPECIFIC THING beyond stating its content: a pun, an idiom, a callback, a deflation. If yes, the answer is almost always 'humorous' (or 'ironic' / 'self-deprecating' if those are options). Pure straight-faced prose rarely 'has a tone'.",
        "pitfall": None,
    })

    # ELF-039 (ans B) — refers to "An Invention" / the zip
    emit(s, "var-2023-verb1-ELF-039", {
        "solution_path": "The 'An Invention' passage describes the zip as a 'workaday' device that was 'slow to ripen', 'shift[ed] from novelty to necessity, without much song and dance'. That is a seemingly trivial device gradually conquering the world — B.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "The question asks how the zip is CHARACTERIZED according to the text — so find the author's framing claims and pick the option that paraphrases them. Watch for words that signal pace (slow/instant) and importance (trivial/essential).",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "Three lines build the characterisation. 'The zip was one of the later fruits of the Industrial Revolution, and one that was slow to ripen.' 'It was not born of radical new science or cunning craft, nor even of any deep need.' 'It is like thousands of workaday inventions that shift from novelty to necessity, without much song and dance, and end up hard to better.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "The zip wasn't a breakthrough or an obvious must-have. It was a small, practical idea that took its time to spread but eventually became something we can't really replace. The trajectory is slow + ordinary → essential and global.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Slow to ripen' = took a long time to develop and spread. 'Workaday' = ordinary, everyday, unglamorous. 'Without much song and dance' = without fanfare. 'Hard to better' = difficult to improve on. 'Cunning craft' = clever workmanship. The phrase 'gradually conquering the world' in option B is a near-synonym for this whole trajectory.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('a striking example of unexpected but instant success') — directly contradicted: 'slow to ripen', 'without much song and dance' both block 'instant'. B ('a seemingly trivial device gradually conquering the world') — matches 'workaday' + 'slow to ripen' + 'novelty to necessity'. C ('a timely flash of genius meeting a hidden demand') — contradicted: 'not born of radical new science or cunning craft, nor even of any deep need'. D ('even more essential than some more famous technological advances') — the passage compares the zip's SPREAD to the engine/turbine/light bulb (the zip spread slower), not its essentiality.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is B. The whole passage paints the zip as humble, slow, and eventually inescapable — the very arc B names.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to read 'gesture up and a seam comes together' and the word 'magic' in the opening and infer the zip had dazzling early success.",
                "why_wrong": "The very next sentence says it was 'slow to ripen' — the opposite of 'instant'. Step 5 shows the opening magic is about the EXPERIENCE of using it now, not about its 19th-century launch.",
            },
            {
                "letter": "C",
                "why_tempting": "First instinct on an invention story is the classic 'lone genius + unmet need' narrative; C packs both clichés.",
                "why_wrong": "The passage explicitly denies both: 'not born of radical new science or cunning craft, nor even of any deep need.' Step 2's second key sentence rules C out word for word.",
            },
            {
                "letter": "D",
                "why_tempting": "The passage compares the zip to the engine, turbine and light bulb — that comparison can read as a claim that the zip is even more important.",
                "why_wrong": "The comparison is about SPEED OF ADOPTION (the others spread faster than the zip), not relative importance. Step 5 catches the swapped axis.",
            },
        ],
        "technique": "On 'how is X characterized' items where the passage stacks adjectives, write down the THREE most loaded words (here: 'slow', 'workaday', 'hard to better') and pick the option that combines them. Wrong options usually drop one of those words and import a different idea.",
        "pitfall": "The metaphor 'magic' in the opening sentence is bait. It describes the USER EXPERIENCE of zipping, not the invention's reception in history. Step 3's paraphrase keeps the timeline straight: the zip felt magical immediately to its users, but spread slowly across society.",
    })

    # ===== PASSAGE 4: "Intellectuals" =====
    # ELF-040 (ans A)
    emit(s, "var-2023-verb1-ELF-040", {
        "solution_path": "The 'Intellectuals' passage states 'celebrity destroys quality: the more famous an author becomes, the more likely he is to produce hot air' and lists lecture circuits, dinners with the great and the good, and speeches crowding out 'serious thought'. That is exactly A — fame makes them neglect what they should be doing.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'Main argument' means the headline claim the whole paragraph supports — find the opening assertion and check that every subsequent sentence backs it up.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the thesis",
                "text": "The first sentence is the thesis: 'A basic rule of intellectual life is that celebrity destroys quality: the more famous an author becomes, the more likely he is to produce hot air.' Everything after is supporting evidence: lecture-circuit trips, dinner-party sourcing, too many speeches and backs slapped.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "When intellectuals become famous, they stop doing the work that made them worth listening to. They give speeches instead of doing research, network at dinners instead of digging into sources, and there's no time left for serious thought. Fame crowds out the actual job.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Hot air' = empty talk, content-free speech. 'Lecture circuit' = the rotation of paid public-speaking gigs. 'Brand-name journalists' = famous, recognised journalists. 'Hard digging' = serious investigative research. 'The great and the good' = the elite social class.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('their fame often makes them neglect what they should really be doing') — maps directly onto 'celebrity destroys quality' + 'abandon libraries for the lecture circuit'. B ('they should spend less time making their views public property') — that's prescriptive (should-do); the passage is descriptive (this is what happens). The author isn't telling intellectuals to publish less; he's diagnosing what happens when they get famous. C ('their capacity should be made useful beyond their areas of expertise') — the passage argues the opposite: branching out to dinners and speeches is precisely what hurts them. D ('they take their celebrity status too much for granted') — the passage doesn't talk about their ATTITUDE to fame, only its EFFECT on their output.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is A. The thesis 'celebrity destroys quality' equals 'fame makes them neglect what they should be doing' — A is the same sentence in everyday English.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "B",
                "why_tempting": "Many stop at 'too many speeches must be given' and read it as a recommendation: 'they should give fewer speeches'.",
                "why_wrong": "The passage describes a CONSEQUENCE, not a prescription. Step 5 separates 'this is what happens to famous intellectuals' (the author's actual claim) from 'they should change their behaviour' (a recommendation the author never makes explicitly).",
            },
            {
                "letter": "C",
                "why_tempting": "It's easy to read 'superstar academics abandon libraries for the lecture circuit' as a complaint that intellectuals are NOT spreading their expertise enough.",
                "why_wrong": "The author's complaint is the OPPOSITE: they're spreading themselves TOO THIN, leaving no time for serious work. Step 3's paraphrase makes the direction explicit.",
            },
            {
                "letter": "D",
                "why_tempting": "If you remember 'take for granted' as a stock phrase about famous people, D feels like a natural moral lesson.",
                "why_wrong": "The passage never describes the intellectuals' attitude toward their own celebrity — only its effect on their output. Step 5 catches D adding a psychology claim the text doesn't make.",
            },
        ],
        "technique": "On 'main argument' items, find the OPENING THESIS sentence (often built around a colon: 'A basic rule of X is Y: Z') and pick the option that paraphrases it most faithfully. The supporting sentences exist to back the thesis up; wrong options usually mistake supporting details for the thesis.",
        "pitfall": "Prescriptive options (containing 'should', 'ought to', 'must') are bait when the passage is descriptive. The author of this passage is DIAGNOSING what happens, not prescribing what to do. Reject 'should' options unless the passage itself uses 'should'.",
    })

    # ===== PASSAGE 5: CLOZE — "Alternatives Vegetarianism" =====
    # ELF-031 (verb2, ans B) — gap 31: "in the vanguard of moral ___"
    emit(s, "var-2023-verb2-ELF-031", {
        "solution_path": "The Victorian vegetarians 'tended to see themselves as on the side of history, in the vanguard of moral ___' — analogous to abolitionists and anti-racists. The right word is 'progress' (B): being in the vanguard of moral progress.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the gap",
                "text": "This is a noun-completion gap inside a fixed idiom. The phrase 'in the vanguard of moral X' needs a positive noun that the speakers — vegetarians who think they are 'on the side of history' — would self-apply.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Read around the gap",
                "text": "Before: 'They tended to see themselves as on the side of history.' After (sentence 2): 'In their imagined future, meat eating would be seen as being as barbarous as slavery, racism and homophobia.' So they saw themselves as moral pioneers, equivalent to anti-slavery and anti-racism reformers.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Identify the relationship",
                "text": "Self-image + on-the-right-side-of-history + comparison to abolitionists → the noun must name 'forward moral motion'. 'Vanguard' (the leading edge) reinforces this: the vanguard of moral X is the front of moral X — X has to be something that MOVES forward.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Vanguard' = the leading position in a movement. 'Relevance' (A) = the quality of being currently important. 'Progress' (B) = forward movement, improvement over time. 'Controversy' (C) = public disagreement. 'Backlash' (D) = a strong negative reaction. Only 'progress' is a thing that has a vanguard — you can lead progress, you don't lead controversy or backlash.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Plug and test each option",
                "text": "'in the vanguard of moral relevance' — relevance isn't a moral movement; doesn't fit. 'in the vanguard of moral progress' — fits perfectly: moral progress is a recognised phrase; abolition and anti-racism are textbook examples. 'in the vanguard of moral controversy' — flips the self-image: vegetarians saw themselves as RIGHT, not as stirring up controversy. 'in the vanguard of moral backlash' — backwards: a backlash is a reactionary response, not a forward movement, and 'moral backlash' would mean opposing change, not leading it.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is B. 'Moral progress' is the standard English collocation for the long arc of reform (abolitionism, civil rights), and the next sentence explicitly compares vegetarianism to those movements.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "If you read 'on the side of history' as 'on top of the current debate', 'relevance' can feel like a near-synonym.",
                "why_wrong": "'Vanguard of relevance' is not a real English collocation, and the comparison to slavery and racism is about WORLDVIEW change, not about staying current. Step 4's collocation check rules it out.",
            },
            {
                "letter": "C",
                "why_tempting": "Vegetarianism really was controversial in Victorian Britain — 'controversy' has a surface connection to the topic.",
                "why_wrong": "The speakers see themselves as righteous reformers, not provocateurs. 'Vanguard of controversy' would frame them as troublemakers — the opposite of the self-image step 2 captures.",
            },
            {
                "letter": "D",
                "why_tempting": "First instinct on 'history will judge meat-eating as barbarous' is to read forward-looking moral certainty, and 'backlash' can ride that wave.",
                "why_wrong": "A backlash is a REACTION AGAINST progress, not a leadership of it. Step 5 catches the direction mismatch — vanguard means leading the way forward, not pushing back.",
            },
        ],
        "technique": "On cloze items where the gap fills a fixed phrase ('in the vanguard of moral ___'), test each option as an English collocation first. Real phrases beat semantically-adjacent invented ones. 'Moral progress' is a well-attested phrase; 'moral relevance/controversy/backlash' are not — that alone resolves most of the question.",
        "pitfall": None,
    })

    # ELF-032 (verb2, ans D) — gap 32: connector
    emit(s, "var-2023-verb2-ELF-032", {
        "solution_path": "Before the gap: vegetarian numbers have not been rising. After the gap: 'studies suggest that anything between 50 and 84 per cent of those who give up meat eventually go back'. The connector adds a second damaging fact in the same direction — 'What's more' (D).",
        "steps": [
            {
                "n": 1,
                "title": "Understand the gap",
                "text": "This is a discourse-connector gap. The four options ('At least', 'Then again', 'Even so', 'What's more') do very different jobs: concede a point, contrast, undercut, or pile on. You pick by checking the LOGICAL RELATION between the sentence before and the sentence after.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Read around the gap",
                "text": "Before: 'it is clear the number of vegetarians has not been rising over recent decades on either side of the Atlantic.' After: 'studies suggest that anything between 50 and 84 per cent of those who give up meat eventually go back to being carnivores.' Both sentences are bad news for the vegetarian movement — they describe the same kind of failure (movement stagnation), in two different ways.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Identify the relationship",
                "text": "Two facts pulling in the SAME direction → you need an ADDITIVE connector ('and on top of that…'). Concessions ('at least') and contrasts ('then again', 'even so') would signal that the second fact pulls the OTHER way — but the second fact is actually a deeper version of the first.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'At least' = at minimum, often used to find a silver lining. 'Then again' = on the other hand, introduces a counter-thought. 'Even so' = despite that, introduces a contrast. 'What's more' = and additionally, piles on more evidence in the SAME direction. Only the last one is purely additive.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Plug and test each option",
                "text": "'At least, studies suggest 50-84% of those who give up meat go back' — silver-lining framing; nothing positive in the second fact to salvage. 'Then again, studies suggest…' — would signal a counterclaim; the second fact is a worse version of the first, not a counter. 'Even so, studies suggest…' — same problem; 'even so' expects a contrast. 'What's more, studies suggest…' — fits: vegetarianism isn't growing, AND most ex-meat-eaters relapse. Two pieces of bad news for the movement, stacked.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is D. The author is building a case AGAINST the Victorian vegetarian dream, and the connector adds the second damaging statistic on top of the first.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to skim 'at least' as a casual filler, especially if you're not slowing down to test the logical direction.",
                "why_wrong": "'At least' looks for a positive note inside bad news; the second fact (most quitters relapse) is not a positive note. Step 5's plug-and-test catches the wrong direction.",
            },
            {
                "letter": "B",
                "why_tempting": "'Then again' is a common pivot in English essays, and after a flat statistic it can feel like the right place to pivot to a different angle.",
                "why_wrong": "'Then again' signals a counterclaim, but the second sentence doesn't counter — it reinforces. Step 3's same-direction check rules out all contrast connectors.",
            },
            {
                "letter": "C",
                "why_tempting": "'Even so' is a frequent connector after a setback, and 'studies suggest' can feel like a hopeful pivot.",
                "why_wrong": "'Even so' expects 'despite the bad news, here's a hopeful exception'; what follows is more bad news. Step 5 catches it.",
            },
        ],
        "technique": "On connector gaps, label the sentence before and after with +/− (positive/negative for the author's thesis), then pick the connector whose function matches the +/− pattern. Same sign (− then −, or + then +) → additive ('what's more', 'moreover'). Opposite signs → contrast ('even so', 'then again', 'however').",
        "pitfall": "Three of these four connectors (at least, then again, even so) introduce a CHANGE in direction. Only one (what's more) keeps the same direction. When two facts agree, only the same-direction connector fits — a quick sign-check on each clause resolves the gap faster than re-reading.",
    })

    # ELF-033 (verb2, ans C) — gap 33: "pastures not ___ to crops edible by humans"
    emit(s, "var-2023-verb2-ELF-033", {
        "solution_path": "'It makes good sense to graze animals on pastures not ___ to crops edible by humans' — the missing past participle plus 'to' must mean 'fit for' or 'usable for'. The right word is 'suited' (C): pastures not SUITED to human crops.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the gap",
                "text": "The gap is a past participle followed by 'to'. The slot wants a verb that takes 'to' in the past participle and means something like 'appropriate for'. Test each option for the grammar AND the meaning.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Read around the gap",
                "text": "'It makes good sense to graze animals on pastures NOT ___ to crops edible by humans, and to use by-products of the human food chain to fatten livestock.' The clause is making a 'don't waste arable land' argument: graze on land that wouldn't grow human food anyway.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Identify the relationship",
                "text": "We need a past participle that combines with 'to' to mean 'usable for / fit for' human crops. The negation 'not ___' then describes pastures UNFIT for growing food crops — exactly the marginal land you'd want to graze livestock on.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Turned to X' = converted to X (you turn a hand to a task). 'Reduced to X' = brought down to X. 'Suited to X' = appropriate for X, fits the requirements of X. 'Attributed to X' = credited to X as the cause. Only 'suited' carries the 'fit for / appropriate for' meaning the sentence needs.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Plug and test each option",
                "text": "'pastures not turned to crops' — 'turned to' can mean 'converted to', but the negation ('not turned to') would suggest land that HAS NOT BEEN converted yet, which sneaks in a conversion that isn't relevant. The argument is about LAND TYPE, not about historical use. 'pastures not reduced to crops' — 'reduced to' is wrong both grammatically (you reduce X TO a lower form) and semantically (crops aren't a reduction of pasture). 'pastures not suited to crops' — clean match: land that's not appropriate for growing food crops. 'pastures not attributed to crops' — 'attributed' means assigned credit, not land use; doesn't fit at all.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is C. 'Suited to crops' is the standard English for 'fit to grow crops' — the negation gives 'unfit', which is the marginal-land argument the sentence makes.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "'Turned to' is a familiar phrase ('she turned to farming'), and 'pastures not turned to crops' has a folksy ring.",
                "why_wrong": "'Turned to' as 'converted to' would mean the pastures WERE converted at some point — the sentence is about whether they ever COULD be. Step 5 catches the temporal misframing.",
            },
            {
                "letter": "B",
                "why_tempting": "If you grasp at 'reduced' as a farming verb (reduce stubble, reduce yields), it can feel adjacent.",
                "why_wrong": "'Reduced to crops' is not idiomatic English; reduction goes from larger to smaller, not from pasture to crops. Step 4's collocation check rules it out.",
            },
            {
                "letter": "D",
                "why_tempting": "'Attributed' often appears in essay registers and can feel like the kind of formal word a New Statesman writer would pick.",
                "why_wrong": "'Attributed to' means 'credited to as cause' — it has nothing to do with land suitability. Step 5 catches the wrong semantic field.",
            },
        ],
        "technique": "On past-participle + preposition cloze gaps, identify the FIXED COLLOCATION the slot is asking for. 'Suited to' = fit for. 'Attributed to' = credited to. 'Reduced to' = brought down to. 'Turned to' = converted to / sought help from. Match the collocation's MEANING to the sentence's meaning, not just its grammar.",
        "pitfall": None,
    })

    # ELF-034 (verb2, ans A) — gap 34: "the health evidence ___ some, but much less, meat eating"
    emit(s, "var-2023-verb2-ELF-034", {
        "solution_path": "'In turn, the health evidence ___ some, but much less, meat eating: the consensus among dieticians is that the optimal human diet contains relatively small amounts of animal protein and fat.' The colon explains the gap: dieticians AGREE with some meat eating. The verb is 'supports' (A).",
        "steps": [
            {
                "n": 1,
                "title": "Understand the gap",
                "text": "The gap is a verb whose object is 'some, but much less, meat eating'. The colon after the gap is the give-away: whatever the verb means, it has to match the consensus that comes after the colon.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Read around the gap",
                "text": "Before: 'the health evidence ___ some, but much less, meat eating'. After the colon: 'the consensus among dieticians is that the optimal human diet contains relatively small amounts of animal protein and fat.' So the evidence and the consensus point the same way: small amounts of meat are OK.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Identify the relationship",
                "text": "Consensus = small amounts of animal protein are healthy. So the health evidence ENDORSES some meat eating. The verb must mean 'backs up / endorses / argues for'.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Supports' (A) = backs up, provides evidence for. 'Accounts for' (B) = explains, makes up (a percentage of). 'Rejects' (C) = refuses, dismisses. 'Depends on' (D) = relies on, varies with. Only 'supports' means 'argues in favour of'.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Plug and test each option",
                "text": "'health evidence supports some, but much less, meat eating' — clean fit: evidence argues for a reduced level of meat eating; matches the colon's explanation. 'health evidence accounts for some, but much less, meat eating' — would mean the evidence EXPLAINS people's meat eating, not that it endorses it; wrong direction. 'health evidence rejects some, but much less, meat eating' — backwards: rejecting some meat eating contradicts 'the optimal diet contains relatively small amounts'. 'health evidence depends on some, but much less, meat eating' — doesn't make sense; evidence doesn't depend on people's behaviour to be valid.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is A. The colon explicitly says what the dieticians' consensus IS — small amounts are optimal — and 'supports' is the verb that connects 'evidence' to that consensus.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "B",
                "why_tempting": "It's easy to read 'accounts for' as a clinical-sounding verb that pairs naturally with 'evidence' in academic prose.",
                "why_wrong": "'Account for' means 'explain' or 'make up' (e.g. 'fat accounts for 30% of calories'). It doesn't carry the endorsement meaning the colon demands. Step 4's gloss separates explanation from endorsement.",
            },
            {
                "letter": "C",
                "why_tempting": "If you remember the earlier vegetarian-friendly tone of the passage, you might expect any verb in this sentence to push against meat eating.",
                "why_wrong": "The sentence's whole job is to PIVOT toward 'some meat is fine'. Rejecting some meat eating would put the evidence against the consensus that follows — Step 5 forces the consistency check.",
            },
            {
                "letter": "D",
                "why_tempting": "'Depends on' is a flexible phrase and can land in 'evidence depends on the data' or similar academic patter.",
                "why_wrong": "'Evidence depends on meat eating' would mean the evidence's validity needs meat to exist — incoherent in context. Step 5 catches the semantic dead end.",
            },
        ],
        "technique": "On cloze gaps with a colon or dash right after, treat the post-colon clause as a DEFINITION of the missing verb's effect. Whatever the right verb is, the post-colon clause has to be its explanation. Here 'consensus that small amounts are optimal' explains 'supports some meat eating' but contradicts 'rejects' and is unrelated to 'accounts for' or 'depends on'.",
        "pitfall": "The phrase 'much less' inside the slot can mislead you toward 'rejects' (negative-sounding). But 'much less' modifies the AMOUNT of meat, not the verb's polarity. The author is saying: yes, eat meat — just much less of it. Step 3's paraphrase keeps the polarity straight.",
    })

    # ELF-035 (verb2, ans C) — gap 35: "done society a great ___"
    emit(s, "var-2023-verb2-ELF-035", {
        "solution_path": "'The vegetarian movement has done society a great ___ by putting important issues on the agenda.' The fixed English collocation is 'done someone a great SERVICE' — answer C.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the gap",
                "text": "This is a fixed-phrase gap. 'Do someone a great X' is a stock English idiom; the slot wants the noun that completes it. Test each option as a phrase.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Read around the gap",
                "text": "'The vegetarian movement has done society a great ___ by putting important issues on the agenda. But the most sensible conclusion to draw is that we ought to eat fewer, better-reared animal products.' Tone: the author is conceding a genuine contribution to society from the movement before pivoting to his own recommendation.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Identify the relationship",
                "text": "We need a positive noun that fits 'do someone a great X' as a stock phrase. The phrase has to convey 'made a real contribution', because the next sentence acknowledges that contribution.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Justice' (A) — 'do someone justice' exists, but it means 'represent them fairly', not 'help them'. 'Deal' (B) — 'a great deal' means 'a lot' (quantity) or refers to an agreement; doesn't fit 'do society a great deal'. 'Service' (C) — 'do someone a great service' = make a major positive contribution to them; perfectly idiomatic. 'Cause' (D) — 'a great cause' is a noble project; you don't DO someone a cause.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Plug and test each option",
                "text": "'has done society a great justice' — 'do justice' usually takes a direct object ('the film didn't do the book justice') and means 'represent fairly', which isn't what the vegetarian movement did. 'has done society a great deal' — would mean 'a large quantity'; you can't 'do' someone 'a deal'. 'has done society a great service' — the canonical idiom for 'made a major positive contribution to society'. 'has done society a great cause' — ungrammatical; you don't DO someone a cause, you SERVE one.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is C. 'Done society a great service' is the established English idiom, and the post-gap content ('putting important issues on the agenda') is exactly the kind of contribution the idiom names.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "'Justice' is morally charged and the passage has been talking about moral progress, so 'a great justice' can feel topic-appropriate.",
                "why_wrong": "'Do justice' as an idiom means 'represent fairly' (e.g. 'the photo doesn't do her justice'), not 'help'. Step 4's idiom check separates moral resonance from grammatical fit.",
            },
            {
                "letter": "B",
                "why_tempting": "'A great deal' is one of the commonest English phrases, and the eye can drift to it on autopilot.",
                "why_wrong": "'A great deal' means 'a lot of' (a great deal of money, a great deal of trouble) — it's a quantifier, not the object of 'do someone'. Step 5 catches the grammar.",
            },
            {
                "letter": "D",
                "why_tempting": "'A great cause' (a worthy mission) is a familiar phrase, and vegetarianism is plausibly described as a cause.",
                "why_wrong": "'Cause' takes verbs like 'support', 'serve', 'champion' — not 'do someone'. Step 4's collocation check rules out 'do society a cause'.",
            },
        ],
        "technique": "On idiom-completion cloze gaps, ignore semantic atmosphere and test the noun strictly as a slot in the idiom 'do someone a great ___'. Only 'service' and 'favour' fit that template natively; the other options redirect the phrase to a different idiom that doesn't match the surrounding context.",
        "pitfall": "Three of the four options ('justice', 'deal', 'cause') are positive nouns that pair with OTHER common phrases ('do justice to', 'a great deal of', 'a great cause'). It's tempting to confuse 'fits a great X' with 'fits do someone a great X'. The fixed phrase is the test — not just the adjective.",
    })

    # ===== PASSAGE 6: "No Smiling Matter" =====
    # ELF-036 (verb2, ans A)
    emit(s, "var-2023-verb2-ELF-036", {
        "solution_path": "The opening paragraph says 'novelties are worthless unless they can be replicated' — i.e. scientific findings must be reproducible under similar conditions to be considered valid. That is exactly A.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'What is stated in the opening paragraph?' — find the thesis of the first paragraph and pick the option that paraphrases it most faithfully. Don't use later paragraphs.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentence",
                "text": "First paragraph, second sentence: 'But, as any seasoned researcher knows, such novelties are worthless unless they can be replicated.' That is the thesis. The rest of the paragraph notes that replication rarely happens, and that replication studies are hard to publish.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "An exciting new discovery means nothing if other scientists can't repeat the experiment and get the same result. Reproducibility is the test of whether a finding is real.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Replicate' = repeat (an experiment, with the goal of getting the same result). 'Reproducible' (in option A) = able to be repeated with the same outcome. 'Conventional scientific wisdom' (in B) = the established consensus in science. 'Dawn of scientific research' (in C) = the very beginning of science as a discipline. 'Elementary criticism' (in D) = basic, low-level objections.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('scientific findings must be reproducible under similar conditions to be considered valid') — exactly the thesis: novelties are worthless unless replicated. B ('many researchers seem to be ignorant of conventional scientific wisdom') — the passage says the opposite: 'any seasoned researcher knows' the replication norm. C ('repeated experimentation is even more crucial now than in the dawn of scientific research') — the passage makes no historical comparison; it talks about current practice. D ('today's science is becoming increasingly open to elementary criticism') — the passage talks about replication, not criticism.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is A. 'Worthless unless they can be replicated' equals 'must be reproducible to be considered valid' — A is the thesis in technical clothing.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "B",
                "why_tempting": "It's easy to read 'replication does not get done as thoroughly as it should' as a complaint that researchers don't know the rules.",
                "why_wrong": "The author says 'any seasoned researcher KNOWS' the rules — they know them and still don't replicate, because of career incentives. Step 3's paraphrase separates ignorance from incentive.",
            },
            {
                "letter": "C",
                "why_tempting": "If you read 'an endless stream of new discoveries' as a sign of MODERN scientific volume, you might infer the author is comparing today to the past.",
                "why_wrong": "The paragraph makes no comparison to past eras. 'Endless stream' just sets the stage for the replication problem. Step 5 catches the imported historical claim.",
            },
            {
                "letter": "D",
                "why_tempting": "'Critics often argue…' appears later in the passage, and on a quick read you might think the opening paragraph is about openness to criticism.",
                "why_wrong": "The 'critics' reference is in paragraph four, about 'hidden moderators' — not in the opening paragraph. Step 1's instruction (use only the opening paragraph) blocks this slide.",
            },
        ],
        "technique": "On 'what is stated in the opening paragraph' items, find the sentence containing 'must', 'cannot', 'unless', or another categorical word — that sentence is almost always the thesis. Here 'worthless UNLESS they can be replicated' is the load-bearing claim.",
        "pitfall": None,
    })

    # ELF-037 (verb2, ans C)
    emit(s, "var-2023-verb2-ELF-037", {
        "solution_path": "The text says of Abel and Kruger's 2010 study: 'It was also an intriguing result. It dovetailed well with ideas then emerging that happiness induces biological effects which lead to improved health.' That is C — its outcome appeared to support developing notions.",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "Find what the passage SAYS about the 2010 Abel & Kruger study — not what we now think of it, not what Dufner found later. Focus on how the original study is described.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "'The original study, published in 2010 by Ernest Abel and Michael Kruger… seemed sound enough.' 'Statistically, this was a strong result.' 'It was also an intriguing result. It dovetailed well with ideas then emerging that happiness induces biological effects which lead to improved health.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "The 2010 study looked solid: a good sample, blind raters, a statistically strong result. And on top of that, it fit nicely with new ideas about happiness affecting health. So it landed on an audience that was already warming up to that kind of finding.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Dovetail' = fit together neatly (originally a carpentry term). 'Then emerging' = becoming established at that time. 'Developing notions' (in option C) = ideas that were taking shape. 'Methodologically innovative' (in B) = new in METHOD. 'Controversial' (in D) = generating public disagreement.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('basic design suffered from obvious flaws') — directly contradicted: 'seemed sound enough', strong stats. B ('greeted as methodologically innovative') — the design (mugshots + blind raters + death records) was conventional, not innovative; the passage praises its soundness, not its novelty. C ('outcome appeared to support developing notions') — matches 'dovetailed well with ideas then emerging'; 'developing notions' = 'emerging ideas', 'support' = 'dovetail'. D ('regarded as controversial from the very start') — the opposite: it was 'intriguing' and well-received.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is C. 'Dovetailed well with ideas then emerging' = 'appeared to support developing notions' — same claim, different vocabulary.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "If you read forward to the replication failure, you may infer retroactively that the original study must have had design flaws.",
                "why_wrong": "The passage's careful framing is the opposite: the design 'seemed sound enough' and the failure is attributed to chance (one in fifty), not to flaws. Step 3's paraphrase keeps the original-study evaluation positive.",
            },
            {
                "letter": "B",
                "why_tempting": "Mugshots + blind raters + death records can sound like a creative methodological mash-up.",
                "why_wrong": "The passage uses 'seemed sound enough', not 'innovative'. Soundness and novelty are different claims, and the text praises only the former. Step 4's gloss separates them.",
            },
            {
                "letter": "D",
                "why_tempting": "If you skim 'attempted replication is important' as a flag of controversy, the original study can feel controversial by association.",
                "why_wrong": "The text describes the 2010 study as 'intriguing' and well-received from the start. Step 5 catches the imported controversy.",
            },
        ],
        "technique": "On 'what is said about study X' items in a science passage, look for the author's EVALUATION sentence (often containing 'seemed', 'appeared', 'was greeted as'). That sentence is the author's verdict on the study at the time of publication; the correct option paraphrases it.",
        "pitfall": "Knowing the study later failed to replicate can poison your reading of how it was received at the time. Keep the timelines separate: the 2010 reception was positive ('intriguing', 'dovetailed', 'sound'); the 2020s replication failure is a separate event.",
    })

    # ELF-038 (verb2, ans D)
    emit(s, "var-2023-verb2-ELF-038", {
        "solution_path": "'All of the players in [the original sample] were included, along with a larger, non-overlapping set of 527 Baseball-Register images.' Dufner used the original sample PLUS extra players — an extended version of the original study (D).",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'Concerning Dufner's investigation' — find the design details of Dufner's study and compare them to the original. Look for sample, raters and procedure.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "'Together with a team of colleagues, he worked with a sample based on the one used in the original study. All of the players in that were included, along with a larger, non-overlapping set of 527 Baseball-Register images of players who were active slightly before, or after, 1952. Just like the researchers in the first experiment, Dr Dufner relied on blind volunteers to rate the intensity of the smiles in the images.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "Dufner kept everything that mattered about Abel and Kruger's design — same kind of photos, same blind-rater method — and then ADDED 527 more players from slightly before and after 1952. So his study was the original study PLUS a bigger sample bolted on.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Non-overlapping set' = a separate group with no players in common. 'Blind volunteers' = raters who don't know what hypothesis is being tested. 'Hidden moderators' (later in passage) = unrecognised factors that might affect the result. 'Extended version' (in option D) = a longer, larger version of the same study.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('limited to the same data as Abel and Kruger') — false; Dufner ADDED 527 more players. B ('introduced a number of highly relevant new parameters') — false; the passage stresses 'The photos were the same. Only the volunteer examiners were different.' He didn't change variables; he expanded the sample. C ('relied on volunteers' familiarity with its overall purpose') — false and the reverse: he used BLIND volunteers, who by definition were unfamiliar with the purpose. D ('extended version of Abel and Kruger's experiment') — matches: same design, same kind of data, bigger sample.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is D. Original sample + 527 extra players + same blind-rater method = an extension of the original study, exactly as D says.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "If you read 'sample based on the one used in the original study' as 'same sample', A feels like a clean restatement.",
                "why_wrong": "'Based on' is followed by 'along with a larger, non-overlapping set' — that's an addition, not equality. Step 3's paraphrase keeps the expansion explicit.",
            },
            {
                "letter": "B",
                "why_tempting": "When a replication study fails, it's natural to assume the second researcher CHANGED something important.",
                "why_wrong": "Dufner deliberately kept the design the same so the failure couldn't be blamed on hidden moderators. The text underscores: 'The photos were the same. Only the volunteer examiners were different.' Step 5 catches the wrong narrative.",
            },
            {
                "letter": "C",
                "why_tempting": "'Volunteers' familiarity with the overall purpose' is a real concept (un-blinding) and can feel relevant in a methodology question.",
                "why_wrong": "The text says the OPPOSITE: 'Dr Dufner relied on BLIND volunteers' — i.e. they did NOT know the purpose. Step 4's gloss on 'blind' rules C out completely.",
            },
        ],
        "technique": "On 'what we are told about study X' items where X is a replication, anchor on the relationship between X's design and the ORIGINAL. The author almost always characterises the replication as 'identical', 'extended', 'modified', or 'narrowed' — the correct option names that exact relationship.",
        "pitfall": "The phrase 'sample based on the one used in the original study' is a gentle understatement that hides the 527-player addition. Step 2 catches the 'along with a larger, non-overlapping set' phrase that pivots the description from 'same' to 'extended'.",
    })

    # ELF-039 (verb2, ans B)
    emit(s, "var-2023-verb2-ELF-039", {
        "solution_path": "'When Dr Dufner compared these numbers with how long each of the players lived, however, he found no correlation between lifespan and smile intensity in either the original or the extended samples.' Abel & Kruger found a strong correlation; Dufner found none. The results differed significantly (B).",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'What is CLAIMED about the result of Dufner's study?' — find the outcome statement and compare it to Abel & Kruger's outcome. The two results either agree, disagree, can't be compared, or are unreliable; pick the one the text actually supports.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "Dufner: 'he found no correlation between lifespan and smile intensity in either the original or the extended samples of players.' Abel and Kruger: 'players with full smiles were more likely to have lived to a ripe old age' (strong statistical effect, one-in-fifty chance). The two results point in opposite directions.",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "Abel & Kruger said: big smiles → longer life, statistically strong. Dufner said: no relationship at all between smile intensity and lifespan, in either his bigger sample or the original players. The two studies disagree sharply.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'No correlation' = no statistical relationship between two variables. 'Coincided' (in option D) = matched, agreed. 'Hidden moderators' = unrecognised variables that might cause divergence between studies. 'Unforeseen circumstances' (in option A) = unexpected events that disrupt a plan.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('unreliable due to a number of unforeseen circumstances') — the passage actually argues the OPPOSITE: there were no hidden moderators ('The photos were the same. Only the volunteer examiners were different'), so the result is more reliable, not less. B ('differed significantly from that of Abel and Kruger's investigation') — matches: strong positive correlation vs no correlation = significant difference. C ('could not be meaningfully compared') — incorrect; the studies were specifically designed to be comparable, and the passage compares them throughout. D ('coincided in important respects with that of the previous study') — directly contradicted: 'no correlation' is the opposite of Abel & Kruger's 'strong result'.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is B. The strong original effect disappeared completely in the replication — a textbook 'failure to replicate' = results differ significantly.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "When a result is surprising, it's intuitive to suspect that something must have gone wrong with the design.",
                "why_wrong": "The passage explicitly defends Dufner's reliability: he kept the design identical and the photos were the same — no hidden moderators. Step 3's paraphrase keeps the reliability framing intact.",
            },
            {
                "letter": "C",
                "why_tempting": "'Meaningful comparison' is a phrase that sounds methodologically responsible.",
                "why_wrong": "The whole article is structured around comparing the two studies. The author treats the comparison as not just possible but as the very point of the piece. Step 5 catches the unjustified disclaimer.",
            },
            {
                "letter": "D",
                "why_tempting": "If you skimmed 'replicated' as a positive word and missed the 'failed to' in 'unable to replicate', D can feel like the expected outcome of a replication.",
                "why_wrong": "The passage's headline finding is that the replication FAILED — no correlation. 'Coincided in important respects' would describe a successful replication, not the actual outcome. Step 2's quote forecloses this.",
            },
        ],
        "technique": "On 'what is claimed about the result' items in a replication-failure article, the correct option names the FAILURE directly ('differed', 'contradicted', 'failed to reproduce'). Wrong options often soften the disagreement to 'didn't really compare' or 'unreliable for technical reasons' — both are misdirection.",
        "pitfall": "The word 'replication' has positive connotations (matching, confirming) in everyday English, but in scientific journalism 'replication study' often means 'study that tried and failed to confirm an earlier result'. Step 3's paraphrase nails the opposite-direction finding so the word's everyday glow doesn't mislead.",
    })

    # ELF-040 (verb2, ans D)
    emit(s, "var-2023-verb2-ELF-040", {
        "solution_path": "The final paragraph says Dufner contacted Abel to see the original data; Abel had thrown the data out. The closing sentence: 'A cautionary tale, then, of the importance both of replication and of keeping the data that a study is based on safe and sound, just in case they need to be checked again.' That implies an in-depth comparison of the two studies' data would have been desirable (D).",
        "steps": [
            {
                "n": 1,
                "title": "Understand the question",
                "text": "'What is IMPLIED in connection with the two studies?' — implications follow from a specific concrete claim. The two studies' data couldn't be cross-checked because Abel discarded his data; ask which option follows from that fact.",
                "tier": "essential",
            },
            {
                "n": 2,
                "title": "Locate the key sentences",
                "text": "'To check in detail what had happened, Dr Dufner contacted Dr Abel, the first paper's senior author, and asked if he could see the original data. Unfortunately, these were unavailable.' And the closing moral: 'A cautionary tale, then, of the importance both of replication and of keeping the data that a study is based on safe and sound, just in case they need to be checked again.'",
                "tier": "essential",
            },
            {
                "n": 3,
                "title": "Paraphrase in plain English",
                "text": "Dufner wanted to look at Abel's raw data to see WHY the two studies disagreed. Abel had thrown the data out. So a detailed side-by-side check became impossible — the author treats this as a loss, calling it a 'cautionary tale'. The implication is: such a check would have been valuable.",
                "tier": "essential",
            },
            {
                "n": 4,
                "title": "Vocabulary check",
                "text": "'Cautionary tale' = a story told as a warning. 'In-depth comparison' = a detailed, side-by-side analysis. 'Falsify research data' (in option C) = fabricate fraudulent results — a serious accusation, distinct from poor data management. 'Overstated' (in option B) = exaggerated.",
                "tier": "detail",
            },
            {
                "n": 5,
                "title": "Match against the options",
                "text": "A ('loss of Abel's basic data seriously affects Dufner's conclusions') — the opposite: Dufner's conclusions stand on his own data; the loss affects only the diagnostic comparison, not the validity of Dufner's null result. B ('necessity of replication may have been overstated') — directly contradicted by the closing line: replication is treated as IMPORTANT. C ('too easy to falsify research data') — falsification is a fraud accusation; the passage describes data MANAGEMENT (Abel chose to discard old files), not fraud. D ('in-depth comparison of Abel's and Dufner's results would have been desirable') — matches: Dufner wanted to do exactly that, couldn't, and the author calls it a cautionary tale.",
                "tier": "essential",
            },
            {
                "n": 6,
                "title": "Conclusion",
                "text": "The answer is D. The closing moral specifically laments the lost opportunity to compare data sets in detail — that is the exact desideratum D names.",
                "tier": "essential",
            },
        ],
        "framework_id": None,
        "distractors": [
            {
                "letter": "A",
                "why_tempting": "It's easy to read 'unfortunately these were unavailable' as something that undermines the whole piece, including Dufner's conclusions.",
                "why_wrong": "Dufner's null result rests on his own (intact) data; what was lost was the chance to DIAGNOSE the disagreement. Step 3 separates the validity of Dufner's finding from the lost diagnostic step.",
            },
            {
                "letter": "B",
                "why_tempting": "If you read forward to 'cautionary tale' on autopilot, 'overstated' can feel like the kind of skeptical move a journalist makes.",
                "why_wrong": "The cautionary tale is about the importance of replication AND data preservation — it ARGUES FOR replication, not against. Step 5 catches the inverted direction.",
            },
            {
                "letter": "C",
                "why_tempting": "Discarded data + a failed replication + the word 'falsify' as a real-world worry can blur into 'this might be fraud'.",
                "why_wrong": "The passage never insinuates fraud; Abel's quote ('Time to move on') reads as bureaucratic retirement housekeeping, not concealment. Step 4's gloss on 'falsify' (fabricate) keeps it out of the inference space.",
            },
        ],
        "technique": "On 'what is implied in connection with X and Y' items, anchor on the closing 'moral' sentence — articles like this almost always state the implication explicitly in the final sentence. Here 'a cautionary tale of the importance of replication and of keeping the data… safe' IS the implication, and the correct option paraphrases it.",
        "pitfall": "The word 'falsify' in option C sounds neutral enough that on a quick read it can pass as a synonym for 'mess up'. But it specifically means 'fabricate fraudulent data' — a much stronger claim than the passage supports. Step 4's gloss matters here.",
    })

    # Final save
    OUT.write_text(json.dumps(s, indent=2, sort_keys=True, ensure_ascii=False))
    print(f"\nFinal save: {len(s)} entries -> {OUT}")


if __name__ == "__main__":
    main()
