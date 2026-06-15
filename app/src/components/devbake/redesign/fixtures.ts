// Shared fixtures for the 2026 redesign bake-off (/redesign-bakeoff).
//
// One real ORD question (var-2026) + its full Layer-2 explanation, plus
// the Home data shape, hardcoded so all three design-language variants
// render identical production-fidelity content with zero network/auth
// dependencies. The variants import ONLY from this file.

export type RedesignScreen = 'home' | 'drill'

export const QUESTION = {
  qid: 'var-2026-verb1-ORD-003',
  section: 'ORD',
  sectionLabel: 'Ordförståelse',
  number: 3,
  total: 10,
  prompt: 'eftertrakta',
  options: [
    { letter: 'A', text: 'ta reda på' },
    { letter: 'B', text: 'följa efter' },
    { letter: 'C', text: 'härma' },
    { letter: 'D', text: 'vilja ha' },
    { letter: 'E', text: 'fundera på' },
  ],
  answer: 'D',
} as const

export const EXPLANATION = {
  pregradeTactic: {
    handle: 'Stamordskartan',
    move: "När ordet börjar på efter- — tänk 'i riktning mot', inte 'bakom', och fråga vad man rör sig mot.",
  },
  solution:
    'Eftertrakta betyder att vilja ha — att intensivt önska och sträva efter något. Svaret är D.',
  steps: [
    {
      n: 1,
      tier: 'essential',
      title: 'Vad betyder eftertrakta?',
      text: "Att eftertrakta något är att VILJA HA DET STARKT — att längta efter det och rikta sina handlingar mot att få det. Det är ett tyngre, mer litterärt ord än 'vilja ha'; man eftertraktar en tjänst, en titel, en plats i ensemblen, ett pris. Det finns ofta ett moment av konkurrens — det är något som ANDRA också vill ha, vilket är just det som gör det eftertraktansvärt.",
    },
    {
      n: 2,
      tier: 'detail',
      title: 'Sammansatt: efter + trakta',
      text: "Ordet är byggt av efter (i riktning mot, jaga) och trakta (sträva, söka — släkt med tysk trachten, 'sträva efter'). Bokstavligen 'sträva i riktning mot' något. Samma efter finns i eftersträva (synonymt), eftersöka (leta efter) och eftergiven (ge efter för). Bilden är att handlingen pekar FRAMÅT mot ett mål man inte ännu nått.",
    },
    {
      n: 3,
      tier: 'essential',
      title: 'Välj synonymen',
      text: 'Vilja ha (D) fångar exakt detta begär riktat mot ett objekt — en eftertraktad post är en post som många vill ha. Båda uttryckens kärna är samma viljeriktning mot ett föremål.',
    },
  ],
  distractors: [
    {
      letter: 'A',
      text: 'ta reda på',
      whyTempting:
        "Det är lätt att läsa eftertrakta som 'undersöka noga' eftersom 'efter-' i andra ord (eftersöka, efterforska) just betyder att gräva fram information.",
      whyWrong:
        'Ta reda på handlar om KUNSKAP (jag vill veta något jag inte vet). Eftertrakta handlar om BEGÄR (jag vill ha något jag inte har). Den ena fyller en informationslucka, den andra fyller en ägandelucka.',
    },
    {
      letter: 'B',
      text: 'följa efter',
      whyTempting:
        "Många stannar vid 'efter' i eftertrakta och hör 'gå efter någon' — alltså följa efter.",
      whyWrong:
        "Följa efter är RÖRELSE i fysisk eller temporal mening (gå i någons spår, komma efter någon). Eftertrakta är ÖNSKAN riktad mot ett mål. Steg 2 visar att 'efter-' här inte betyder 'bakom' utan 'i riktning mot' — samma 'efter' som i eftersträva.",
    },
    {
      letter: 'C',
      text: 'härma',
      whyTempting: "Snabbsvar är ofta att associera 'efter' med 'göra efter någon' = härma.",
      whyWrong:
        'Härma är IMITATION (göra som någon annan gör). Eftertrakta är ÖNSKAN (vilja ha det någon annan har, eller det ingen ännu har). Du kan eftertrakta utan att kunna eller vilja härma — du vill ha posten, inte spela rollen.',
    },
    {
      letter: 'E',
      text: 'fundera på',
      whyTempting:
        "Eftertrakta kan låta begrundande och eftertänk- samt — alltså 'fundera på' något.",
      whyWrong:
        'Fundera på är TANKEAKTIVITET utan begärsfärg (jag överväger, jag vrider på frågan). Eftertrakta bär alltid det starka önskemålet. Tänkande är passivt, eftertraktan är riktad mot besittning — helt olika mentala tillstånd.',
    },
  ],
} as const

export const HOME = {
  dateLabel: 'Torsdag 11 juni',
  greeting: 'God eftermiddag',
  projectedScore: '1.4',
  scoreDelta: '+0.1 sedan förra veckan',
  streakDays: 12,
  estimatedMinutes: 16,
  resume: {
    kind: 'Övning',
    section: 'ORD',
    position: 4,
    total: 10,
    device: 'telefon',
    when: '11:07',
  },
  plan: [
    {
      id: 'rep',
      kind: 'repetition',
      section: null as string | null,
      headline: 'Repetition · 10 av 100 missar',
      rationale: '10 av 100 missar denna session — de äldsta först.',
      minutes: 8,
    },
    {
      id: 'lesson',
      kind: 'lektion',
      section: 'XYZ' as string | null,
      headline: 'XYZ-lektion',
      rationale: 'Distribuera ett minustecken över ett uttryck inom parentes.',
      minutes: 5,
    },
    {
      id: 'drill',
      kind: 'övning',
      section: 'ORD' as string | null,
      headline: 'ORD-övning · 10 frågor',
      rationale: 'Snabb runda för att hålla synonymflödet uppe.',
      minutes: 3,
    },
  ],
  traps: [
    {
      id: 'XYZ-TRAP-016',
      section: 'XYZ',
      count: 3,
      headline: 'Bråkaddition kräver gemensam nämnare innan täljarna får adderas.',
    },
    {
      id: 'ELF-TYPE-002',
      section: 'ELF',
      count: 2,
      headline: 'Slutsatsdragning / implikation — vad följer av texten?',
    },
    {
      id: 'LAS-TYPE-001',
      section: 'LÄS',
      count: 2,
      headline: 'Direkt detalj — notera triggerfrasen, leta bara där.',
    },
  ],
} as const
