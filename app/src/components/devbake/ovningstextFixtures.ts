// Static fixture for /dev/ovningstext-bakeoff (P5 infold PR4a, bead hpf-8s3r.1).
//
// Real P5 content, copied verbatim — no loader is wired:
//   - units from the committed sample export
//     pipeline/synthetic/infold/preview/sample/p5-bank-sample.json
//   - their reviewed Layer-2 explanations from data/explanations/p5-pilot.json
//   - the retired unit's answer keys from its candidate file (its passage and
//     prompts are deliberately absent: a retired unit is no longer served)
// ovningstextFixtures.test.ts pins every string here to those files and the
// four disclosure strings to docs/p5-infold-design.md.
//
// The data was copied by script, not retyped. To change it, re-copy from the
// files above; a hand edit fails the test.

import type { Explanation } from '@/data/explanations'
import type { AnswerLetter, Option } from '@/data/questions'

// ── Approved disclosure copy ─────────────────────────────────────────
// docs/p5-infold-design.md §3 B and Amendment 1 row B (owner-approved).
// Verbatim; do not rewrite.

/** Rendered »ÖVNINGSTEXT«. Stored title-case and uppercased by CSS, the
 *  M3 rail-label convention (sectionRailLabel.ts): screen readers then
 *  read a word instead of spelling out capitals. */
export const OVNINGSTEXT_BADGE = 'Övningstext'

/** Shown at a unit's first display. */
export const OVNINGSTEXT_NOTE =
  'Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.'

/** Wherever an LÄS/ELF-based estimate is shown. */
export const ESTIMATE_CAVEAT =
  'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.'

/** In place of a retired unit's content. */
export const RETIRED_NOTICE = 'Den här övningstexten har tagits ur bruk.'

// ── Fixture types ────────────────────────────────────────────────────

export type P5FixtureQuestion = {
  qid: string
  number: number
  prompt: string
  options: Option[]
  answer: AnswerLetter
}

/** One P5 unit: a passage and its ordered questions (served whole). */
export type P5FixtureUnit = {
  unitId: string
  revision: number
  section: 'LÄS' | 'ELF'
  title: string
  /** The passage, byline included, exactly as exported. */
  context: string
  questions: P5FixtureQuestion[]
}

// ── Units ────────────────────────────────────────────────────────────

/** las-b19-002 r1 — LÄS passage + question (scenes 1, 3, 4). */
export const LAS_UNIT: P5FixtureUnit = {
  unitId: 'las-b19-002',
  revision: 1,
  section: 'LÄS',
  title: 'Vässlingsbadet och Stångklippan',
  context:
    'Jag satt med när badföreningen formulerade sitt remissvar, och jag röstade för avgiften. Tjugo kronor för ett bad, pengarna oavkortat till livräddningsutrustning – det lät som en rimlig ordning. Föreningen skulle dessutom ersättas för tillsynen, vilket borde ha gjort mig misstänksam mot min egen entusiasm. Nu vill jag ta tillbaka min röst, och de som läste yttrandet har rätt att veta varför.\n\nAtt åtgärder behövs är ingen stridsfråga. Vid Vässlingsbadet hänger en livboj vars lina någon har kapat, och badstegen slutar en halvmeter ovanför vattenytan. Linan var hel fram till i somras, och vem som kapade den vet ingen. Närmaste hjärtstartare sitter i entrén till livsmedelsbutiken, 2,3 kilometer bort. Den som får upp en medvetslös person på trallen har alltså ingen annan utrustning än sina händer i väntan på ambulansen.\n\nRemissförslaget innebär tjugo kronor per bad, tvåhundra kronor för säsongskort och betalning via en kod på skylten vid landfästet. Förvaltningens kalkyl förutsätter 4 800 betalda bad och ger knappt hundratusen kronor per säsong. Utrustningen – två bojar med kastlina, en ny stege och en hjärtstartare i värmeskåp – är prissatt till 61 000 kronor plus omkring 9 000 i årlig tillsyn.\n\nSamma lösning infördes på ställplatsen för husbilar nere vid hamnen för två somrar sedan: en skylt, en kod och tilliten till att gästen skannar. Där finns sex uppställningsrutor, en tömningsstation och en grind som står öppen hela säsongen. Kommunens egen uppföljning landade på en betalningsgrad om 31 procent av gästnätterna. Vid bryggan finns varken bom, vakt eller registreringsskylt att fotografera av, och drivkrafterna att betala blir därför ännu svagare.\n\nDet allvarligaste problemet står ändå inte i kalkylen. Räddningstjänsten och badvärdarna har noterat fjorton tillbud i sjön sedan 2021, och elva av dem inträffade vid Stångklippan tvåhundra meter söderut, där ungdomarna hoppar och där ingen räddningsutrustning finns. Badvärdarna för visserligen dagbok bara under skolloven, men fördelningen mellan de två platserna har sett likadan ut varje år. En avgift vid bryggan lär förskjuta en del av badandet just dit. Då bekostas utrustningen av dem som badar där det sällan händer något, medan den plats där olyckorna faktiskt inträffar lämnas orörd. Köp bojarna, badstegen och hjärtstartaren över driftsbudgeten, och sätt upp en kastlina vid Stångklippan också.\n\nFörra torsdagskvällen räknade jag från bryggan: arton personer uppe på klippan, tre nere vid stegen. Bojen hängde där den hänger, med linan kapad.\n\n– Bengta Ödgren, ledamot i badföreningens styrelse',
  questions: [
    {
      qid: 'p5-las-b19-002-r1-LÄS-001',
      number: 1,
      prompt: 'Vad anser textförfattaren om avgiftsförslaget?',
      options: [
        {
          letter: 'A',
          text: 'Avgiften kan godtas, men den bör sättas högre än förslaget anger.',
        },
        {
          letter: 'B',
          text: 'Den utrustning som finns räcker om skötseln förbättras.',
        },
        {
          letter: 'C',
          text: 'Förslaget bör genomföras som det ligger, eftersom badgästerna har nytta av utrustningen.',
        },
        {
          letter: 'D',
          text: 'Utrustningen behövs, men avgiften är fel sätt att finansiera den.',
        },
      ],
      answer: 'D',
    },
    {
      qid: 'p5-las-b19-002-r1-LÄS-002',
      number: 2,
      prompt: 'Vad sägs i texten om ställplatsen för husbilar?',
      options: [
        {
          letter: 'A',
          text: 'Sju av tio nätter blev obetalda.',
        },
        {
          letter: 'B',
          text: 'Betalningsviljan visade sig svår att mäta.',
        },
        {
          letter: 'C',
          text: 'Nästan alla nätter blev betalda.',
        },
        {
          letter: 'D',
          text: 'Skylten togs ned efter en säsong.',
        },
      ],
      answer: 'A',
    },
  ],
}

/** elf-b18-002 r1 — ELF cloze (scene 2). */
export const ELF_CLOZE_UNIT: P5FixtureUnit = {
  unitId: 'elf-b18-002',
  revision: 1,
  section: 'ELF',
  title: 'Left to Soak',
  context:
    'By four o’clock the office sink has acquired a saucepan, two plates, a mug and the lid of somebody’s lunchbox. Nobody saw any of them arrive. The mug among them is never anonymous: a name on the side, a chip everyone recognises, a teabag welded to the base, and an owner sitting twenty feet away, apparently unaware. The washing-up is nobody’s job, which in practice makes it somebody’s, and deciding whose is a contest nobody admits to entering, though it quietly takes its ___(1)___ on the general mood.\n\nThe first countermeasure is a notice. It appears above the taps, laminated against steam, and its wording is determinedly cheerful: a cartoon sponge, a pun about mugs, two exclamation marks. The tone is light, but nobody misreads it; beneath the sponge the message is ___(2)___, and it is aimed at certain chairs. For a day or two the draining board gleams. Then the crockery creeps back, and the notice stays up, curling at the corners, addressed to everyone in general and nobody in particular.\n\nA rota follows, drawn up at a meeting with some ceremony and signed by everyone. It survives about a fortnight. One turn falls during half-term, the promised swap is never recorded, and soon two people each believe the other is on duty while the saucepan sits it out. Complaining aloud works no better: the first person to raise the subject has, by raising it, volunteered; you cannot hold the moral high ___(3)___ and a dripping brush at the same time. So the kitchen waits. ___(4)___, somebody cracks – nearly always the same somebody, the one who minds the mess a little more than the rest and minds it first.\n\nOffices that install a dishwasher believe the question retired, and for a week they are right. Then the machine fills and the argument moves house: emptying it is a job with all the tedium and none of the visible virtue. The teaspoons, meanwhile, vanish at a rate no theory of the kitchen has ever explained. In the end temperament settles it: most kitchens ___(5)___ an uneasy balance between confrontation and squalor, held in place by whoever has stopped expecting credit. That colleague’s mug, at least, is clean. It goes home in a bag at half past five.\n– Prudence Dabbershaw writes a column on working life for a monthly magazine.',
  questions: [
    {
      qid: 'p5-elf-b18-002-r1-ELF-001',
      number: 1,
      prompt: 'Gap (1)',
      options: [
        {
          letter: 'A',
          text: 'price',
        },
        {
          letter: 'B',
          text: 'charge',
        },
        {
          letter: 'C',
          text: 'toll',
        },
        {
          letter: 'D',
          text: 'cost',
        },
      ],
      answer: 'C',
    },
    {
      qid: 'p5-elf-b18-002-r1-ELF-002',
      number: 2,
      prompt: 'Gap (2)',
      options: [
        {
          letter: 'A',
          text: 'relaxed',
        },
        {
          letter: 'B',
          text: 'spirited',
        },
        {
          letter: 'C',
          text: 'amused',
        },
        {
          letter: 'D',
          text: 'pointed',
        },
      ],
      answer: 'D',
    },
    {
      qid: 'p5-elf-b18-002-r1-ELF-003',
      number: 3,
      prompt: 'Gap (3)',
      options: [
        {
          letter: 'A',
          text: 'ground',
        },
        {
          letter: 'B',
          text: 'field',
        },
        {
          letter: 'C',
          text: 'horse',
        },
        {
          letter: 'D',
          text: 'floor',
        },
      ],
      answer: 'A',
    },
    {
      qid: 'p5-elf-b18-002-r1-ELF-004',
      number: 4,
      prompt: 'Gap (4)',
      options: [
        {
          letter: 'A',
          text: 'Similarly',
        },
        {
          letter: 'B',
          text: 'Eventually',
        },
        {
          letter: 'C',
          text: 'Presumably',
        },
        {
          letter: 'D',
          text: 'Ironically',
        },
      ],
      answer: 'B',
    },
    {
      qid: 'p5-elf-b18-002-r1-ELF-005',
      number: 5,
      prompt: 'Gap (5)',
      options: [
        {
          letter: 'A',
          text: 'cast',
        },
        {
          letter: 'B',
          text: 'deal',
        },
        {
          letter: 'C',
          text: 'strike',
        },
        {
          letter: 'D',
          text: 'land',
        },
      ],
      answer: 'C',
    },
  ],
}

/** elf-b19-003 r1 — short ELF reading unit (scene 5, replay). */
export const ELF_SHORT_UNIT: P5FixtureUnit = {
  unitId: 'elf-b19-003',
  revision: 1,
  section: 'ELF',
  title: 'Counting Pots from the Pavement',
  context:
    'Stand across the road from a terrace and count the pots along one stack. Under each is a separate flue dropping to its own grate, and the pots seldom match. Pattern tells you very little. Builders’ yards sold whatever was in stock, householders bought ornament to tell their own door from thirty identical ones, and a stack rebuilt in 1961 carries what came off the lorry. Height is the part worth reading. The pot that stands a course above its neighbours belongs to a flue that smoked, usually the shortest one on the stack, the flue from the attic bedroom, with the least warm air beneath it to do the lifting. Narrowing the mouth helps as well, since the same gases leave faster through less of an opening. A pot is bedded in a flaunching of mortar, so a sweep could try a taller one without calling a bricklayer.\n– Silas Ludderby, writing on the architecture of ordinary streets',
  questions: [
    {
      qid: 'p5-elf-b19-003-r1-ELF-001',
      number: 1,
      prompt: 'What does the writer say about the pots on a single stack?',
      options: [
        {
          letter: 'A',
          text: 'A pot raised above the others marks a flue that had been drawing badly.',
        },
        {
          letter: 'B',
          text: 'The narrowed mouth on a pot is mainly there to shut out rain and birds.',
        },
        {
          letter: 'C',
          text: 'Pattern and ornament on a stack record which flue below gave the most trouble.',
        },
        {
          letter: 'D',
          text: 'They were picked to match the ridge tiles and the brickwork of the house below.',
        },
      ],
      answer: 'A',
    },
  ],
}

/** Retired unit for scene 7: las-b5-001, retired by the owner on
 *  2026-10-08 (pipeline/synthetic/RETIRED.json). Only the keys are kept —
 *  enough to replay a historical answer row without serving the text. */
export const RETIRED_UNIT: { unitId: string; section: 'LÄS'; keys: AnswerLetter[] } = {
  unitId: 'las-b5-001',
  section: 'LÄS',
  keys: ['A', 'C', 'B', 'D'],
}

// ── Reviewed explanations (data/explanations/p5-pilot.json) ──────────

export const EXPLANATIONS: Record<string, Explanation> = {
  'p5-las-b19-002-r1-LÄS-001': {
    solution_path:
      'Textförfattaren håller med om att utrustningen behövs men vill inte att den ska betalas med en avgift – den ska köpas över driftsbudgeten. D säger båda sakerna. Svaret är D.',
    steps: [
      {
        n: 1,
        title: 'Vad frågan gäller',
        text: 'Frågan gäller textförfattarens egen uppfattning om förslaget att ta ut en avgift. Texten är ett debattinlägg, så svaret står där textförfattaren drar slutsatser och föreslår något.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Hitta ståndpunkten',
        text: 'Redan i första stycket tar textförfattaren tillbaka sitt stöd för avgiften: ”Nu vill jag ta tillbaka min röst”. I femte stycket kommer förslaget: ”Köp bojarna, badstegen och hjärtstartaren över driftsbudgeten”.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Se de två leden',
        text: 'Ståndpunkten har två delar. Behovet medges: ”Att åtgärder behövs är ingen stridsfråga.” Men avgiften avvisas, eftersom bara 31 procent av gästnätterna betalades när samma lösning prövades vid ställplatsen och eftersom en del av badandet kan flytta till Stångklippan, där de flesta olyckorna sker.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Pröva alternativen',
        text: 'D återger båda delarna. A godtar avgiften men vill höja den, B förnekar att ny utrustning behövs, och C säger ja till förslaget som det ligger.',
        tier: 'essential',
      },
      {
        n: 5,
        title: 'Slutsats',
        text: 'Textförfattaren vill ha utrustningen men inte avgiften. Svaret är D.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          'Texten granskar avgiften och intäktskalkylen i detalj, och den som fastnar i siffrorna kan tro att invändningen gäller avgiftens storlek.',
        why_wrong:
          'Textförfattaren vill inte justera avgiften utan slopa den: stödet för avgiften tas tillbaka, och utrustningen ska köpas över driftsbudgeten (steg 2).',
      },
      {
        letter: 'B',
        why_tempting:
          'Texten beskriver en kapad lina och en badstege som slutar ovanför vattnet, och det kan låta som om bättre skötsel skulle räcka.',
        why_wrong:
          'Vid badet finns ingen hjärtstartare alls – den närmaste sitter 2,3 kilometer bort. Textförfattaren vill köpa in bojar, en ny badstege och en hjärtstartare, alltså ny utrustning och inte bara bättre skötsel.',
      },
      {
        letter: 'C',
        why_tempting:
          'Tanken att de som badar också ska betala för säkerheten låter rimlig, och intäktskalkylen i tredje stycket ser ut att gå ihop.',
        why_wrong:
          'Textförfattaren avvisar förslaget. Avgiften väntas flytta en del av badandet till Stångklippan, där elva av fjorton tillbud har skett, och då betalar de som badar där det sällan händer något (steg 3).',
      },
    ],
    technique:
      'I debattinlägg står ståndpunkten ofta i två led: något medges och något avvisas. Rätt svar på en hållningsfråga fångar båda leden – här att utrustningen behövs men att avgiften är fel väg.',
    pitfall:
      'Siffror kan dra uppmärksamheten åt fel håll. Att texten räknar på avgiften betyder inte att textförfattaren vill ändra den – kontrollera vad slutsatsen blir.',
    framework_id: 'LAS-TYPE-003',
  },
  'p5-las-b19-002-r1-LÄS-002': {
    solution_path:
      'Kommunens uppföljning visade att bara 31 procent av gästnätterna betalades. Då var 69 procent obetalda – ungefär sju av tio, som A säger. Svaret är A.',
    steps: [
      {
        n: 1,
        title: 'Vad frågan gäller',
        text: 'Frågan gäller vad texten säger om ställplatsen för husbilar. Leta upp stycket om ställplatsen och se vilken uppgift som står där.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Hitta uppgiften',
        text: 'I fjärde stycket står det: ”Kommunens egen uppföljning landade på en betalningsgrad om 31 procent av gästnätterna.”',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Räkna om',
        text: 'Om 31 procent av nätterna betalades var resten obetalda: 100 procent minus 31 procent ger 69 procent. Det är nära 70 procent, alltså ungefär sju av tio nätter.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Pröva alternativen',
        text: 'A uttrycker samma andel från andra hållet. B talar om svårigheter att mäta betalningsviljan, men några sådana nämns inte i texten. C gör 31 procent till nästan alla, och det som D påstår står inte heller i texten.',
        tier: 'essential',
      },
      {
        n: 5,
        title: 'Slutsats',
        text: 'Ungefär sju av tio nätter blev obetalda. Svaret är A.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'B',
        why_tempting: 'B låter försiktigt och sakligt, och försiktiga alternativ kan kännas säkra.',
        why_wrong:
          'Om betalningen vid ställplatsen säger texten att kommunens uppföljning ”landade på en betalningsgrad om 31 procent av gästnätterna” (steg 2). Texten nämner inga svårigheter att mäta och inget förbehåll om siffran, så B lägger till något som inte står i texten.',
      },
      {
        letter: 'C',
        why_tempting:
          'Den som minns att det fanns ett betalsystem men inte siffran kan anta att de flesta betalade.',
        why_wrong:
          'Betalningsgraden var 31 procent, knappt en tredjedel (steg 2). Det är långt från nästan alla – tvärtom var de flesta nätter obetalda.',
      },
      {
        letter: 'D',
        why_tempting:
          'Skylten nämns flera gånger i texten, både vid badplatsen och vid ställplatsen, så påståendet låter bekant.',
        why_wrong:
          'Texten säger ingenting om att någon skylt togs ned. Uppgiften saknar stöd i texten.',
      },
    ],
    technique:
      'När ett alternativ uttrycker en siffra från texten på ett annat sätt – till exempel som ”sju av tio” i stället för som en procentsats, eller från andra hållet – räkna om innan du väljer. Rätt svar säger ofta samma sak med andra ord.',
    pitfall:
      'Det rätta alternativet nämner inte 31 procent utan de obetalda nätterna. Den som letar efter samma siffra som i texten missar det.',
    framework_id: 'LAS-TYPE-001',
  },
  'p5-elf-b18-002-r1-ELF-001': {
    solution_path:
      '“Take its toll on” is the fixed English expression for gradual damage, so “toll” is the only option that fits “it quietly takes its ___ on the general mood”. The answer is C.',
    steps: [
      {
        n: 1,
        title: 'Read the frame',
        text: 'The gap sits in “it quietly takes its ___ on the general mood”. Here “it” is the unspoken contest over whose job the washing-up is, and the sentence says that this contest slowly harms the mood.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Find the fixed expression',
        text: 'English has a fixed expression for damage that builds up gradually: something takes its toll on something else. Only “toll” fits the pattern “take its ___ on”.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Check the near misses',
        text: '“Cost”, “price” and “charge” all belong to the same field of payment, but none of them fits this pattern. You can “pay the price” or “count the cost”, but not “take its cost on” or “take its price on”.',
        tier: 'detail',
      },
      {
        n: 4,
        title: 'Conclusion',
        text: '“Takes its toll on the general mood” is the only natural completion. The answer is C.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          '“Price” suggests a cost that has to be paid, and expressions like “pay the price” are common.',
        why_wrong:
          'There is no expression “take its price on”. The pattern “take its ___ on” works only with “toll” (step 2).',
      },
      {
        letter: 'B',
        why_tempting:
          '“Take charge” is a common phrase, so “takes its charge” can sound half familiar.',
        why_wrong:
          '“Take charge” means to take control, which makes no sense here, and it does not combine with “its” and “on”. Only “toll” fits the pattern (step 2).',
      },
      {
        letter: 'D',
        why_tempting:
          '“Cost” is the closest in meaning to “toll”, and both are about something being lost.',
        why_wrong:
          'In a fixed expression, meaning alone is not enough. English says “take its toll on”, never “take its cost on” (step 2).',
      },
    ],
    technique:
      'In gap-fill questions, read the words around the gap as a pattern – here “take its ___ on” – and ask which option completes a fixed expression.',
    pitfall:
      'The near-synonym trap: “cost” means almost the same as “toll”, but fixed expressions do not allow swaps. Choose the word the expression requires, not the one closest in meaning.',
  },
  'p5-elf-b18-002-r1-ELF-002': {
    solution_path:
      'The sentence contrasts the notice’s light tone with what lies beneath it, and the next clause says that the message is aimed at certain people. A message with a target is a pointed one. The answer is D.',
    steps: [
      {
        n: 1,
        title: 'Read the frame',
        text: 'The gap sits in “The tone is light, but nobody misreads it; beneath the sponge the message is ___, and it is aimed at certain chairs.”',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Follow the contrast',
        text: '“But” and “beneath” tell you that the real message is different from the light, cheerful surface. The gap needs a word for something sharp, not something light.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Use the clue after the gap',
        text: '“It is aimed at certain chairs” means that the notice targets particular people. “Pointed” is the usual word for a remark or message aimed at someone, as in “a pointed reminder”.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Conclusion',
        text: 'Only “pointed” gives the sharp, targeted meaning that the contrast requires. The answer is D.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          'The notice is described as cheerful, with a cartoon sponge and exclamation marks, so a light word seems to fit.',
        why_wrong:
          'That describes the surface. “But” and “beneath” say that the real message differs from the light tone (step 2), so “relaxed” points the wrong way.',
      },
      {
        letter: 'B',
        why_tempting:
          '“Spirited” sounds lively and positive, which matches the cheerful wording of the notice.',
        why_wrong:
          'Like “relaxed”, it belongs to the light surface that the sentence contrasts with, and “a spirited message” is not a natural combination.',
      },
      {
        letter: 'C',
        why_tempting: 'The notice contains a pun, so a word about humour seems to fit.',
        why_wrong:
          '“Amused” describes a person’s state of mind, not a message: a message cannot be amused. It also sits on the light side of the contrast.',
      },
    ],
    technique:
      'When a gap follows a contrast word such as “but” or “beneath”, first decide which side of the contrast the gap belongs to, then choose the word with that meaning.',
    pitfall:
      'The first half of the sentence (“The tone is light”) describes the surface, while the gap describes what lies beneath it. Check the clue after the gap – here “aimed at certain chairs” – before you choose.',
  },
  'p5-elf-b18-002-r1-ELF-003': {
    solution_path:
      'The fixed expression is “the moral high ground”, the position of being morally in the right, and it is something you hold. The answer is A.',
    steps: [
      {
        n: 1,
        title: 'Read the frame',
        text: 'The gap sits in “you cannot hold the moral high ___ and a dripping brush at the same time”. The writer’s point is that whoever complains about the washing-up ends up doing it.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Complete the whole phrase',
        text: '“The moral high ground” means the position of being morally in the right, and you can hold, take or occupy it. The joke is that you cannot claim to be in the right and hold a washing-up brush at once.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Check the other words',
        text: 'Each wrong option fits part of the frame: “hold the floor” and “hold the field” are real phrases, and people also speak of a “moral high horse”. But “the moral high floor” and “the moral high field” do not exist, and a high horse is something you get on or off, not something you hold.',
        tier: 'detail',
      },
      {
        n: 4,
        title: 'Conclusion',
        text: 'Only “ground” completes the whole expression. The answer is A.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'B',
        why_tempting:
          '“Hold the field” is a real expression, so “field” seems to fit after “hold”.',
        why_wrong:
          'The gap must complete “the moral high ___”, and “the moral high field” is not an English expression (step 2).',
      },
      {
        letter: 'C',
        why_tempting:
          'People on their “high horse” act morally superior, which is close to the meaning here.',
        why_wrong:
          'You get on or off a high horse; you do not hold it. With the verb “hold”, only “the moral high ground” works (step 2).',
      },
      {
        letter: 'D',
        why_tempting:
          '“Hold the floor” is a real expression, so “floor” sounds natural after “hold”.',
        why_wrong:
          '“Hold the floor” means to keep speaking, and “the moral high floor” does not exist. Read the whole phrase, not just the verb (step 3).',
      },
    ],
    technique:
      'When a gap sits inside a longer expression, read the whole expression – here “hold the moral high ___” – and check that the option completes all of it, not just the words next to the gap.',
    pitfall:
      'Wrong options often fit one neighbouring word. “Floor”, “field” and “horse” each fit part of the frame, which makes them feel right on a quick read.',
  },
  'p5-elf-b18-002-r1-ELF-004': {
    solution_path:
      'After a long wait, somebody finally gives in: the sentence describes the end point of a drawn-out process, and “Eventually” is the word for that. The answer is B.',
    steps: [
      {
        n: 1,
        title: 'Read the frame',
        text: 'The gap opens the sentence that follows “So the kitchen waits”: “___, somebody cracks – nearly always the same somebody”. The connective must link the waiting to what happens in the end.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Find the relationship',
        text: 'The paragraph describes a series of failed attempts followed by a period of waiting. The cracking is the end point of that process, so the connective must mean “in the end, after a long time”.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Watch the false friend',
        text: 'English “eventually” means “in the end”, not “possibly”. Swedish “eventuellt” means “possibly”, so a Swedish reader can easily misread it.',
        tier: 'detail',
      },
      {
        n: 4,
        title: 'Conclusion',
        text: '“Eventually” marks the final event of a drawn-out process. The answer is B.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          'The paragraph lists several similar failures, so a connective of comparison might seem to fit.',
        why_wrong:
          '“Similarly” introduces something parallel to what came before. The cracking is not like the waiting; it is how the waiting ends (step 2).',
      },
      {
        letter: 'C',
        why_tempting: '“Presumably” sounds careful, and careful words can feel safe.',
        why_wrong:
          'It would turn the sentence into a guess, but the writer states the outcome with confidence and even knows who usually gives in: “nearly always the same somebody”.',
      },
      {
        letter: 'D',
        why_tempting:
          'The column has a wry, humorous tone, so an ironic connective seems in keeping.',
        why_wrong:
          'The gapped sentence holds no twist for “Ironically” to mark. Somebody cracking is simply how the waiting ends, and the sentence itself explains who gives in: “the one who minds the mess a little more than the rest and minds it first”. That person gives in first because they mind the mess most, which overturns nothing set up earlier. What the gap must supply is the link in time between the waiting and its end (step 2).',
      },
    ],
    technique:
      'For a connective gap, work out how the gapped sentence relates to the one before – as a result, a contrast, a comparison or a step in time – and choose the word that names that relationship.',
    pitfall:
      'Beware of false friends. English “eventually” means “in the end” and never “possibly”, as Swedish “eventuellt” does.',
  },
  'p5-elf-b18-002-r1-ELF-005': {
    solution_path:
      '“Strike a balance” is the fixed English expression for reaching a compromise, so “most kitchens strike an uneasy balance” is the only natural fit. The answer is C.',
    steps: [
      {
        n: 1,
        title: 'Read the frame',
        text: 'The gap sits in “most kitchens ___ an uneasy balance between confrontation and squalor”. The writer means that kitchens settle into an uncomfortable compromise between arguing and living with the mess.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Find the fixed expression',
        text: 'English says “strike a balance” for arriving at a compromise between two things. The verb belongs with “balance”, so “strike” is the word that completes the expression.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Check the other verbs',
        text: '“Cast”, “deal” and “land” all have strong expressions of their own – cast a vote, deal a blow, land a job – but none of them goes with “balance”.',
        tier: 'detail',
      },
      {
        n: 4,
        title: 'Conclusion',
        text: '“Strike an uneasy balance” is the only natural completion. The answer is C.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          '“Cast” appears in many fixed expressions, such as “cast a vote” and “cast a shadow”.',
        why_wrong:
          'None of those expressions goes with “balance”: you cannot “cast a balance” (step 2).',
      },
      {
        letter: 'B',
        why_tempting:
          '“Deal” suggests sharing things out, which can sound right for a balance between two sides.',
        why_wrong:
          'English says “deal a blow” or “deal the cards”, but not “deal a balance”. The expression needs “strike” (step 2).',
      },
      {
        letter: 'D',
        why_tempting:
          '“Land” suggests achieving something, as in “land a job”, and the kitchens do arrive at a result.',
        why_wrong:
          '“Land a balance” is not English. Arriving at a compromise is expressed with “strike a balance” (step 2).',
      },
    ],
    technique:
      'In collocation gaps, look at the noun after the gap and ask which verb normally goes with it – here “balance” goes with “strike”.',
    pitfall:
      'All four verbs belong to strong, familiar expressions, so each one feels natural on its own. Test each verb with the actual noun in the frame.',
  },
  'p5-elf-b19-003-r1-ELF-001': {
    solution_path:
      'According to the writer, height is the clue: the pot standing above its neighbours belongs to a flue that smoked, usually the shortest one on the stack. A says the same in other words. The answer is A.',
    steps: [
      {
        n: 1,
        title: 'Understand the question',
        text: 'The question asks what the writer says about the pots on one stack, so the answer must be stated in the text. The passage first dismisses one clue and then names another.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Set pattern aside',
        text: 'The writer says “Pattern tells you very little” and gives three reasons: builders’ yards sold whatever was in stock, householders bought ornament to tell their own door apart, and a stack rebuilt in 1961 carries whatever came off the lorry.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Find the real clue',
        text: 'Then comes the point: “Height is the part worth reading. The pot that stands a course above its neighbours belongs to a flue that smoked, usually the shortest one on the stack”.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Match the wording',
        text: 'A flue that “smoked” is one that did not carry the smoke away properly – in other words, one that drew badly. The text also gives the reason: the shortest flue has “the least warm air beneath it to do the lifting”.',
        tier: 'detail',
      },
      {
        n: 5,
        title: 'Conclusion',
        text: 'The writer says that a raised pot marks the flue that drew badly. The answer is A.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'B',
        why_tempting:
          'Many people believe that whatever sits on top of a chimney is there to keep out rain and birds.',
        why_wrong:
          'The writer gives the narrowed mouth a different purpose: “the same gases leave faster through less of an opening.” Rain and birds are never mentioned.',
      },
      {
        letter: 'C',
        why_tempting:
          'C keeps the text’s idea that the stack can tell you which flue misbehaved, so it sounds close to the passage.',
        why_wrong:
          'It attaches that idea to the wrong feature. The writer says that pattern tells you very little and that height is what matters (steps 2 and 3).',
      },
      {
        letter: 'D',
        why_tempting:
          'Matching the pots to the rest of the house sounds like a sensible thing for a builder to do.',
        why_wrong:
          'The text never says that the pots were picked to match the house. It says that builders’ yards sold “whatever was in stock”, that a stack rebuilt in 1961 “carries what came off the lorry”, and that householders bought ornament “to tell their own door from thirty identical ones” – to stand out, not to blend in.',
      },
    ],
    technique:
      'When a short text dismisses one explanation and then gives another, the answer is usually the explanation the writer keeps. Look for signals such as “tells you very little” and “is the part worth reading”.',
    pitfall:
      'Options that match common sense, such as keeping out rain or matching materials, are tempting because they sound true. The question asks what the writer says, so only the text counts.',
    framework_id: 'ELF-TYPE-001',
  },
}
