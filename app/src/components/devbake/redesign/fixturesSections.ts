// Multi-section drill fixtures for the redesign bake-off (round 6.5).
//
// Real corpus questions — one per canvas-stressing section — so the L12
// candidates can be judged against the HARD canvases, not just ORD:
//   las — host-2020 LÄS with full passage + Layer-2 explanation
//   nog — host-2020 NOG with the (1)/(2) statement apparatus + explanation
//   xyz — var-2026 XYZ with LaTeX-marked options + explanation
//   dtk — var-2026 DTK with its real figure page; NO explanation on
//         purpose (exercises the graceful missing-pedagogy state)
// The ORD question stays in fixtures.ts (the round-2-6 baseline).
//
// Data extracted verbatim from app/public/data + app/public/explanations;
// NOG prompt pre-split into stem/statements/coda so variants render the
// apparatus without re-parsing.

export type DrillKey = 'ord' | 'las' | 'xyz' | 'nog' | 'dtk'

export type SectionStep = { n: number; tier: string; title: string; text: string }
export type SectionDistractor = {
  letter: string
  text: string
  whyTempting: string
  whyWrong: string
}
export type SectionExplanation = {
  pregradeTactic: { handle: string; move: string }
  solution: string
  steps: SectionStep[]
  distractors: SectionDistractor[]
}
export type SectionQuestion = {
  qid: string
  section: string
  sectionLabel: string
  number: number
  total: number
  prompt: string
  options: { letter: string; text: string }[]
  answer: string
  context: string | null
  contextTitle: string | null
  statements: { n: number; text: string }[] | null
  coda: string | null
  figureSrc: string | null
  lede: string | null
}
export type DrillFixture = { question: SectionQuestion; explanation: SectionExplanation | null }

export const SECTION_DRILLS: Record<Exclude<DrillKey, 'ord'>, DrillFixture> = {
  las: {
    question: {
      qid: 'host-2020-verb1-LÄS-011',
      section: 'LÄS',
      sectionLabel: 'Svensk läsförståelse',
      number: 11,
      total: 20,
      options: [
        {
          letter: 'A',
          text: 'Att man har kunnat klarlägga att den skandinaviska befolkningen för 5 000 år sedan inte var genetiskt homogen.',
        },
        {
          letter: 'B',
          text: 'Att dagens invånare på Sardinien uppvisar samma genetiska profil som de som föds i Västergötland.',
        },
        {
          letter: 'C',
          text: 'Att man har kunnat komplettera arkeologiskt skelettmaterial med andra historiska individdata.',
        },
        {
          letter: 'D',
          text: 'Att flera genetiska skillnader nu kan förklaras med förändringar i jordbruket.',
        },
      ],
      answer: 'A',
      prompt: 'Vad framstår som det mest intressanta resultatet i Pontus Skoglunds avhandling?',
      context:
        'Forskare från Uppsala universitet har tidigare visat att jordbruket spreds till norra Europa med migranter från södra Europa. Resultaten var baserade på en individ från en bondekultur i Västergötland. I doktorsavhandlingen Reconstructing the human past using ancient and modern genomes visar Pontus Skoglund nu resultat från ytterligare tre västgötska individer från stenåldern. Resultaten stärker kopplingen till Medelhavet och visar att de fyra bönderna delar DNA-profil med personer som idag lever på Sardinien. På samma sätt som människans rika historia har lämnat spår i form av arkeologiskt material och språks utbredning över världen, så har historien också lämnat spår i DNA-variationen hos dagens individer. Svårigheterna med att analysera DNA direkt från arkeologiskt skelettmaterial har dock inneburit att storskaliga DNA-studier av populationshistoria länge har varit begränsade till att tolka mönster av variation i nu levande människor, utan tillgång till direkta historiska observationer. I sin avhandling i evolutionär genetik vid Uppsala universitet har Pontus Skoglund tillsammans med kollegor utarbetat nya metoder som möjliggör analys av stora mängder genetiska data från forntida människor för att kartlägga historiska händelser. En delstudie som publicerades förra året blev uppmärksammad för att den presenterade storskaliga DNA- bevis för att cirka 5 000 år gamla individer associerade\n\nmed jordbrukskulturer respektive jägar–samlar-kulturer i Skandinavien representerade två skilda grupper. Denna studie var baserad på tre jägar–samlar-individer från Gotland och en individ från en bondekultur i Gökhem i Västergötland. Bondeindividens DNA matchade DNA-profilen hos människor som nu lever i södra Europa, medan de andra individerna var mest lika nordeuropeiska grupper. Detta tydde på att invandring varit drivande för jordbrukets utbredning över Europa. Nya resultat som presenteras i avhandlingen visar nu att den så kallade Gökhemsindividen inte var ensam om sin oväntade genetiska profil: tre andra individer från samma plats visar samma typ av signatur. DNA-profilen hos alla dessa fyra individer matchar den hos personer som idag lever på Sardinien, trots att de alltså är funna i Västergötland. Detta fastslår att grupper med väldigt olika härkomst levde i dagens Skandinavien för 5 000 år sedan, men var de kom ifrån och vad som hände med deras ättlingar är inte helt klart. Eftersom jägar–samlarindividerna på Gotland inte heller passar in i dagens genetiska variation är det sannolikt att dagens variation är ett resultat av genflöde mellan en mångfald av grupper under efterföljande årtusenden. – Vad vi behöver göra nu är att kombinera informationen från dessa grupper med andra stenåldersindivider för att rekonstruera de historiska händelser som ligger bakom detta mönster, säger Pontus Skoglund.',
      contextTitle: 'Kopplingen till Medelhavet',
      statements: null,
      coda: null,
      figureSrc: null,
      lede: null,
    },
    explanation: {
      pregradeTactic: {
        handle: 'Resultat inte metod',
        move: 'När frågan ber om huvudfyndet eller det mest intressanta resultatet, skilj på medel (metod, datakälla) och resultat (slutsats om världen).',
      },
      solution:
        'Skoglunds nya fynd är att flera individer från samma plats i Västergötland har en sardinsk DNA-profil — alltså att olika genetiska grupper levde sida vid sida i Skandinavien för 5 000 år sedan. Att befolkningen inte var genetiskt enhetlig är textens centrala slutsats. Svaret är A.',
      steps: [
        {
          n: 1,
          tier: 'essential',
          title: 'Vad frågar texten?',
          text: 'Frågan vill veta vad som framstår som det MEST INTRESSANTA resultatet i Skoglunds avhandling — alltså huvudfyndet, inte en sidoteknisk detalj. Vi ska leta efter den slutsats som texten lyfter fram som ny och betydelsefull.',
        },
        {
          n: 2,
          tier: 'essential',
          title: 'Hitta stället',
          text: 'Det centrala fyndet beskrivs i andra halvan: "DNA-profilen hos alla dessa fyra individer matchar den hos personer som idag lever på Sardinien... Detta fastslår att grupper med väldigt olika härkomst levde i dagens Skandinavien för 5 000 år sedan."',
        },
        {
          n: 3,
          tier: 'essential',
          title: 'Parafrasera',
          text: 'På vardagssvenska: tre nya individer från Gökhem visar samma sardinska DNA-signatur som den första. Det betyder att den första inte var en slump — och att åtminstone två väldigt olika folkgrupper (bönder från medelhavsområdet och jägar-samlare med nordeuropeisk profil) faktiskt levde tillsammans i samma område. Befolkningen var alltså inte enhetlig.',
        },
        {
          n: 4,
          tier: 'detail',
          title: 'Vad betyder "genetiskt homogen"?',
          text: 'Homogen betyder enhetlig, av samma slag. En genetiskt homogen befolkning skulle ha samma DNA-bakgrund — alla nedstammade från samma grupp. Skoglund visar motsatsen: i Skandinavien för 5 000 år sedan fanns minst två tydligt olika DNA-profiler vid samma tidpunkt.',
        },
        {
          n: 5,
          tier: 'essential',
          title: 'Matcha mot alternativen',
          text: 'A "inte var genetiskt homogen" — passar steg 3 exakt: två väldigt olika grupper på samma plats samtidigt. B vänder logiken: texten säger att personer i Västergötland hade DNA likt SARDINIENS — inte tvärtom. C handlar om metoden (att skelettmaterial kan kompletteras med annan data) — det är hur Skoglund jobbade, inte hans resultat. D pratar om "förändringar i jordbruket" som förklaring — texten kopplar fyndet till MIGRATION, inte till förändringar i själva jordbruket.',
        },
        {
          n: 6,
          tier: 'essential',
          title: 'Slutsats',
          text: 'Svaret är A. Avhandlingens huvudresultat är att två genetiskt mycket olika befolkningsgrupper levde sida vid sida i Skandinavien för 5 000 år sedan — befolkningen var alltså inte homogen.',
        },
      ],
      distractors: [
        {
          letter: 'B',
          text: 'Att dagens invånare på Sardinien uppvisar samma genetiska profil som de som föds i Västergötland.',
          whyTempting:
            'Det är frestande att läsa snabbt och se kopplingen Sardinien–Västergötland och dra slutsatsen att dagens sardiska invånare delar profil med dagens västgötar.',
          whyWrong:
            'Texten säger att DE FORNTIDA individerna i Västergötland delade profil med dagens sardiska invånare — inte att dagens västgötar gör det. Steg 3 parafraserar fyndet: jämförelsen går från 5 000 år gamla skelett till nutida Sardinien.',
        },
        {
          letter: 'C',
          text: 'Att man har kunnat komplettera arkeologiskt skelettmaterial med andra historiska individdata.',
          whyTempting:
            'Många stannar vid den metodologiska delen — att Skoglund utvecklat nya analysmetoder — och tror att det är hans huvudresultat.',
          whyWrong:
            'Nya metoder är medlet, inte resultatet. Frågan ber om vad avhandlingen VISAR, inte hur den jobbar. Det egentliga fyndet är slutsatsen om befolkningens sammansättning (steg 5).',
        },
        {
          letter: 'D',
          text: 'Att flera genetiska skillnader nu kan förklaras med förändringar i jordbruket.',
          whyTempting:
            'Eftersom texten genomgående handlar om jordbrukets spridning kan man tro att skillnader förklaras av förändringar i själva jordbruket.',
          whyWrong:
            'Skoglund kopplar de genetiska skillnaderna till MIGRATION — att människor från södra Europa flyttade in — inte till hur jordbruket förändrades. Som steg 3 visar handlar fyndet om att olika grupper levde sida vid sida, inte om jordbruksteknik.',
        },
      ],
    },
  },
  nog: {
    question: {
      qid: 'host-2020-kvant1-NOG-023',
      section: 'NOG',
      sectionLabel: 'Kvantitativa resonemang',
      number: 1,
      total: 12,
      options: [
        {
          letter: 'A',
          text: 'i (1) men ej i (2)',
        },
        {
          letter: 'B',
          text: 'i (2) men ej i (1)',
        },
        {
          letter: 'C',
          text: 'i (1) tillsammans med (2)',
        },
        {
          letter: 'D',
          text: 'i (1) och (2) var för sig',
        },
        {
          letter: 'E',
          text: 'ej genom de båda påståendena',
        },
      ],
      answer: 'C',
      prompt: 'Alvar, Benjamin, Cecilia, Dessi och Elina är vänner. Vem av dem är äldst?',
      context: null,
      contextTitle: null,
      statements: [
        {
          n: 1,
          text: 'Alvar är äldre än Benjamin, men yngre än Cecilia.',
        },
        {
          n: 2,
          text: 'Dessi är äldre än Elina, men yngre än Benjamin.',
        },
      ],
      coda: 'Tillräcklig information för lösningen erhålls',
      figureSrc: null,
      lede: null,
    },
    explanation: {
      pregradeTactic: {
        handle: 'Gemensam nod länkar',
        move: 'Översätt varje påstående till en kedja — om två kedjor delar en person kan du länka ihop dem till en total ordning.',
      },
      solution:
        '(1) ordnar C > A > B men säger inget om D och E. (2) ordnar B > D > E men säger inget om A och C. Tillsammans ger båda kedjorna en full ordning: C > A > B > D > E, alltså är Cecilia äldst. Svaret är C.',
      steps: [
        {
          n: 1,
          tier: 'essential',
          title: 'Förstå frågan',
          text: 'Fem vänner: Alvar (A), Benjamin (B), Cecilia (C), Dessi (D), Elina (E). Vi vill veta vem som är ÄLDST — ett unikt namn krävs.',
        },
        {
          n: 2,
          tier: 'detail',
          title: "Vad betyder 'tillräcklig information' i NOG?",
          text: "Räcker bara när informationen utesluter alla utom EN möjlig 'äldst'. Två eller fler möjliga kandidater = otillräckligt.",
        },
        {
          n: 3,
          tier: 'essential',
          title: 'Översätt påstående (1)',
          text: 'Alvar > Benjamin (A äldre än B). Alvar < Cecilia (A yngre än C). Slå ihop: C > A > B.',
        },
        {
          n: 4,
          tier: 'essential',
          title: 'Test (1) ensamt',
          text: '(1) ger C > A > B, men ingenting om D eller E. Cecilia kan vara äldst, men D eller E kan också vara äldre än Cecilia — inget villkor utesluter det. Otillräckligt.',
        },
        {
          n: 5,
          tier: 'detail',
          title: 'Konkret motexempel för (1)',
          text: 'Tänk dig åldrarna: C = 30, A = 25, B = 20. (1) är uppfyllt. Men om D = 40 och E = 50 så är E äldst, inte C. (1) säger inget om D och E.',
        },
        {
          n: 6,
          tier: 'essential',
          title: 'Översätt påstående (2)',
          text: 'Dessi > Elina (D äldre än E). Dessi < Benjamin (D yngre än B). Slå ihop: B > D > E.',
        },
        {
          n: 7,
          tier: 'essential',
          title: 'Test (2) ensamt',
          text: '(2) ger B > D > E, men säger inget om A eller C. Vem som helst av A, B eller C kan vara äldst. Otillräckligt.',
        },
        {
          n: 8,
          tier: 'detail',
          title: 'Konkret motexempel för (2)',
          text: "Tänk: B = 30, D = 25, E = 20. (2) uppfyllt. Men A kan vara 40 (äldst) eller 5 (yngst); samma med C. Två möjliga 'äldst' alltså.",
        },
        {
          n: 9,
          tier: 'essential',
          title: 'Test (1) + (2) tillsammans',
          text: 'Vi har två kedjor som DELAR en gemensam person: B. \n  Från (1): C > A > B.\n  Från (2): B > D > E.\nEftersom B förekommer i båda kan vi länka ihop: C > A > B > D > E.',
        },
        {
          n: 10,
          tier: 'essential',
          title: 'Identifiera äldst',
          text: 'I den länkade kedjan står C längst till vänster — Cecilia är äldst.',
        },
        {
          n: 11,
          tier: 'detail',
          title: 'Verifiera',
          text: 'Kontrollera: C > A ✓ (från 1), A > B ✓ (från 1), B > D ✓ (från 2), D > E ✓ (från 2). Alla fyra villkor uppfyllda, och ingen kan vara över C — ingen olikhet säger att någon annan är äldre än C.',
        },
        {
          n: 12,
          tier: 'essential',
          title: 'Slutsats',
          text: "Tillräcklig information bara i (1) tillsammans med (2). Svaret är C. Insikten i en mening: när två partiella ordningar DELAR en person, kopplas de ihop till en total ordning — den 'kopplande' personen är nyckeln.",
        },
      ],
      distractors: [
        {
          letter: 'A',
          text: 'i (1) men ej i (2)',
          whyTempting:
            "Det är lätt att tro att (1):s kedja C > A > B är 'mest informativ' och utesluta att D eller E kan vara äldre.",
          whyWrong:
            'Steg 5 visar konkret att D = 40 är förenligt med (1) — Cecilia är inte garanterat äldst utan information om D och E.',
        },
        {
          letter: 'B',
          text: 'i (2) men ej i (1)',
          whyTempting:
            'Snabbsvar är ofta att (2):s ordning B > D > E ser komplett ut för tre namn.',
          whyWrong:
            '(2) säger inget om A eller C. Steg 8 ger ett motexempel där A är äldst. Otillräckligt ensamt.',
        },
        {
          letter: 'D',
          text: 'i (1) och (2) var för sig',
          whyTempting: "Om du tror att varje påstående 'är informativt nog' landar du på D.",
          whyWrong:
            'Steg 4 och 7 visar att VARDERA påståendet ENSAMT lämnar två kandidater. D kräver att vartdera ensamt ger unikt svar — det gör de inte.',
        },
        {
          letter: 'E',
          text: 'ej genom de båda påståendena',
          whyTempting:
            'Det är frestande att tro att fem personer med två partiella villkor inte räcker.',
          whyWrong:
            'Steg 9 visar att kedjorna kan länkas via den gemensamma personen B. Två partiella ordningar med EN gemensam person ger ALLTID en total ordning.',
        },
      ],
    },
  },
  xyz: {
    question: {
      qid: 'var-2026-kvant1-XYZ-001',
      section: 'XYZ',
      sectionLabel: 'Matematisk problemlösning',
      number: 1,
      total: 12,
      options: [
        {
          letter: 'A',
          text: 'x^{2} - 15',
        },
        {
          letter: 'B',
          text: 'x^{2} - 2',
        },
        {
          letter: 'C',
          text: 'x^{2} - 2x - 15',
        },
        {
          letter: 'D',
          text: 'x^{2} - 2x - 8',
        },
      ],
      answer: 'C',
      prompt: 'Vilket svarsalternativ motsvarar uttrycket (x + 3)(x - 5)?',
      context: null,
      contextTitle: null,
      statements: null,
      coda: null,
      figureSrc: null,
      lede: null,
    },
    explanation: {
      pregradeTactic: {
        handle: 'Korsmultiplikationen',
        move: 'Två parenteser bredvid varandra — gångra varje term i första med varje term i andra, fyra produkter totalt.',
      },
      solution:
        'Multiplicera ut parentesen med distributiva lagen — varje term i första parentesen gångras med varje term i andra. Resultatet är x^{2} - 2x - 15, så svaret är C.',
      steps: [
        {
          n: 1,
          tier: 'essential',
          title: 'Förstå problemet',
          text: 'Du ska skriva uttrycket (x + 3)(x - 5) på en form utan parenteser. Det handlar inte om att lösa en ekvation — bara om att förenkla.',
        },
        {
          n: 2,
          tier: 'detail',
          title: 'Vad betyder parenteser intill varandra?',
          text: 'När två parenteser står direkt bredvid varandra som (x + 3)(x - 5) betyder det MULTIPLIKATION. Det är samma sak som (x + 3) \\cdot (x - 5).',
        },
        {
          n: 3,
          tier: 'detail',
          title: 'Distributiva lagen i kort form',
          text: 'Distributiva lagen säger att varje term i första parentesen ska gångras med varje term i andra. För (a + b)(c + d) blir det fyra produkter: a \\cdot c + a \\cdot d + b \\cdot c + b \\cdot d. Vi använder samma mönster här.',
        },
        {
          n: 4,
          tier: 'essential',
          title: 'Gångra x med båda termerna i andra parentesen',
          text: 'Första x-et i (x + 3) ska gångras med både x och −5: x \\cdot x = x^{2} och x \\cdot (-5) = -5x.',
        },
        {
          n: 5,
          tier: 'detail',
          title: 'Vad betyder x · x?',
          text: 'Att gångra ett tal med sig självt skrivs som en kvadrat: x \\cdot x = x^{2}. Det är bara en kortform — inga nya regler, bara ett kortare sätt att skriva.',
        },
        {
          n: 6,
          tier: 'essential',
          title: 'Gångra 3 med båda termerna i andra parentesen',
          text: 'Trean i (x + 3) ska gångras med både x och −5: 3 \\cdot x = 3x och 3 \\cdot (-5) = -15.',
        },
        {
          n: 7,
          tier: 'detail',
          title: 'Tecken vid multiplikation',
          text: 'Positivt gånger negativt blir negativt. Därför ger 3 · (−5) talet −15, inte +15. Glöm aldrig minustecknet när du flyttar ner det i nästa rad.',
        },
        {
          n: 8,
          tier: 'essential',
          title: 'Skriv ner alla fyra produkterna',
          text: 'Lägg ihop dem: x^{2} - 5x + 3x - 15. Inget mer behöver räknas, men termerna kan slås ihop.',
        },
        {
          n: 9,
          tier: 'detail',
          title: "Vad betyder 'liknande termer'?",
          text: 'Termer som har samma variabel-del kan slås ihop. Här är -5x och +3x liknande — båda har x utan kvadrat. Du adderar bara koefficienterna (talen framför): -5 + 3 = -2.',
        },
        {
          n: 10,
          tier: 'essential',
          title: 'Slå ihop −5x och +3x',
          text: '−5x + 3x = −2x. Konstanten −15 har ingen liknande term så den står kvar. Resultatet blir x^{2} - 2x - 15.',
        },
        {
          n: 11,
          tier: 'essential',
          title: 'Slutsats',
          text: '(x + 3)(x - 5) = x^{2} - 2x - 15, vilket matchar C. Insikten i en mening: dubbel parentes utvecklas alltid till fyra produkter, sen slår man ihop liknande termer.',
        },
      ],
      distractors: [
        {
          letter: 'A',
          text: 'x^{2} - 15',
          whyTempting:
            'Det är frestande att tro att (x + 3)(x - 5) bara blir x^{2} - 15 — som om man bara gångrade första med första och andra med andra (x \\cdot x och 3 \\cdot (-5)).',
          whyWrong:
            'Det är bara HALVA distributiva lagen — två av fyra produkter saknas. Steg 4 och 6 visar att x också ska gångras med −5 och att 3 också ska gångras med x. Korstermerna ger −2x.',
        },
        {
          letter: 'B',
          text: 'x^{2} - 2',
          whyTempting:
            'Många tänker felaktigt att (x + 3)(x - 5) betyder x^{2} + 3 - 5 — som om man bara adderar konstanterna och låter x i fred.',
          whyWrong:
            'Det är två operationer som blandas ihop. Parenteser bredvid varandra betyder MULTIPLIKATION, inte addition (se steg 2). Hela distributiva lagen i steg 3 ska tillämpas.',
        },
        {
          letter: 'D',
          text: 'x^{2} - 2x - 8',
          whyTempting:
            'Om du räknar 3 \\cdot (-5) = -15 fel som 3 \\cdot (-5) = -8 (som om du adderade istället för multiplicerade), landar du på −8 som konstant.',
          whyWrong:
            'Jämför tecken-multiplikationen i steg 7: 3 \\cdot (-5) är alltid −15. Det är två separata regler — addition (3 + (−5) = −2) och multiplikation (3 · (−5) = −15) — och det är multiplikation som gäller här.',
        },
      ],
    },
  },
  dtk: {
    question: {
      qid: 'var-2026-kvant1-DTK-029',
      section: 'DTK',
      sectionLabel: 'Diagram, tabeller och kartor',
      number: 1,
      total: 12,
      options: [
        {
          letter: 'A',
          text: '45 minuter',
        },
        {
          letter: 'B',
          text: '60 minuter',
        },
        {
          letter: 'C',
          text: '90 minuter',
        },
        {
          letter: 'D',
          text: '105 minuter',
        },
      ],
      answer: 'B',
      prompt:
        'Hur mycket mer tid per vecka lade kvinnor på Diskning, avdukning 1990 jämfört med 2010?',
      context: null,
      contextTitle: null,
      statements: null,
      coda: null,
      figureSrc: '/figures/dtk/var-2026-kvant1-p16.jpg',
      lede: null,
    },
    explanation: null,
  },
}
