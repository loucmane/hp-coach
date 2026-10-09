// Static fixture for /dev/redesign-2026-bakeoff — the whole-app redesign
// bake-off, round 1 (bead hpf-qr0p.1; brief docs/redesign/2026-10-round1-brief.md).
//
// Real P5 content, copied by script — no loader is wired:
//   - the unit from the committed sample export
//     pipeline/synthetic/infold/preview/sample/p5-bank-sample.json
//   - its reviewed Layer-2 explanations from data/explanations/p5-pilot.json
//   - the approved ÖVNINGSTEXT copy from docs/p5-infold-design.md §3 B and
//     Amendment 1 row B
//   - framework names and trap patterns from app/public/frameworks/*.json
// r1Fixtures.test.ts pins every one of those strings to its source. The Home
// state (plan, resume, prognosis, traps, recent passes) is invented but
// shaped like the live Home's data; the test checks it against the unit and
// the exam calendar so it cannot contradict them.
//
// The unit and explanations were copied by script, not retyped. To change
// them, re-copy from the files above; a hand edit fails the test.

import type { Explanation } from '@/data/explanations'
import type { AnswerLetter, Option } from '@/data/questions'

// ── Approved disclosure copy (verbatim; do not rewrite) ──────────────

/** Rendered »ÖVNINGSTEXT«: stored title-case, uppercased by CSS so screen
 *  readers read a word instead of spelling out capitals. */
export const OVNINGSTEXT_BADGE = 'Övningstext'

/** The authorship note (a unit's first display; on demand afterwards). */
export const OVNINGSTEXT_NOTE =
  'Den här texten och frågorna är skapade för övning av HP-Coach. De kommer inte från ett tidigare högskoleprov. Personer, citat och händelser kan vara påhittade.'

/** Wherever an LÄS/ELF-based estimate is shown (Home's prognosis). */
export const ESTIMATE_CAVEAT =
  'Uppskattningen för LÄS och ELF bygger på HP-Coachs övningstexter, vars svårighetsgrad ännu inte är kalibrerad mot riktiga HP-resultat.'

// ── The P5 unit ──────────────────────────────────────────────────────

export type R1Question = {
  qid: string
  number: number
  prompt: string
  options: Option[]
  answer: AnswerLetter
}

export type R1Unit = {
  unitId: string
  revision: number
  section: 'LÄS'
  title: string
  /** The passage, byline included, exactly as exported. */
  context: string
  questions: R1Question[]
}

/** las-b14-002 r1 — a 4-question LÄS unit (a book review). */
export const UNIT: R1Unit = {
  unitId: 'las-b14-002',
  revision: 1,
  section: 'LÄS',
  title: 'Magasinet i Hökaryd: en handbok om socknens spannmål',
  context:
    'Ett sockenmagasin var i sin enklaste form en timrad bod med två lås. Där förvarade socknen ett gemensamt förråd av säd, och därifrån lånade bönderna utsäde – det korn som måste sparas till nästa års sådd – när det egna var uppätet eller förstört av väta. Rutger Grimlunds nya bok om dessa bodar är först och främst en handbok, och som handbok är den utmärkt. Den vill förklara hur magasinen fungerade, och den gör det tålmodigare än någon tidigare framställning jag har läst.\n\nPoängen med magasinet var att det lånade ut samma vara som det tog emot. Den som fick en tunna råg i mars skulle vid skörden lämna tillbaka lika mycket, jämte ett tillägg – vanligen en åttondel – också det i råg. Ingen sedel behövde växlas. I en bygd där kontanter förekom mest vid marknaderna och vid kronans uppbörd var det ingen liten sak: räntan togs i det enda som fanns i överflöd de goda åren. Grimlund kallar magasinet en bank vars valuta var säd, och liknelsen bär längre än man först tror. Skulden fördes in i en bok, den kunde ärvas med gården och den kunde skrivas av. Vad magasinet däremot inte kunde göra var att sprida risken. När missväxten kom drabbade den hela socknen på en gång, och då stod alla vid samma dörr samma vecka.\n\nHur ett magasin över huvud taget kom till är den fråga jag helst hade sett mer om. Grimlund visar att initiativet sällan kom från bönderna själva. I Hässle härad byggdes de flesta magasinen efter påtryckningar uppifrån, av landshövding och präst, och det första förrådet togs ut som en avgift per hemman, mätt i säd. Motståndet var stundtals påtagligt. I Sävlinge dröjde det elva år från beslut till färdig bod, och boken citerar ett par protokoll där uppbörden helt enkelt uteblev.\n\nBokens bästa kapitel återger magasinsordningen för Hökaryds socken från 1798, paragraf för paragraf. Där syns hur noga man tänkt sig saken. Magasinet fick öppnas endast när två personer var på plats, och de båda låsen hade skilda nycklar: kyrkvärden bar den ena, den föreståndare som sockenstämman valt bar den andra. Varje utlåning skulle skrivas in samma dag. Den som inte hade betalat tillbaka till Mikaeli, i slutet av september, fick stå över utlåningen följande vår. Det är regler skrivna av folk som visste precis var frestelsen satt, och Grimlund läser dem med rätt sorts nykterhet: en ordning berättar vad man fruktade, inte vad som faktiskt skedde.\n\nHur långt det kunde vara mellan regel och praktik visar han med ett stämmoprotokoll från Bjärnhult 1832. Kyrkvärden Jonas Ulfsäter hade under två svåra år lånat ut ur magasinet mot muntlig överenskommelse utan att föra in något i boken, och när stämman krävde redovisning räknade han upp varje låntagare och varje mått ur minnet. Sockenborna tycks ha trott honom. Han fick behålla sin nyckel men ålades att ha skrivaren med sig vid varje öppning. Episoden är typisk för bokens arbetssätt: ett dokument, noga läst, får bära ett helt resonemang.\n\nSvagare blir framställningen när den ska förklara varför magasinen försvann. Grimlund pekar på sparbankerna. När det gick att låna pengar mot ränta i pengar, skriver han, blev sädeslånet omodernt, magasinen tömdes och byggnaderna såldes. Det låter rimligt, men bokens eget bilagematerial talar delvis emot honom. I den förteckning över avvecklade magasin som avslutar boken ligger de tidigaste nedläggningarna i Hässle härad flera decennier före den första sparbanken i samma härad. Något annat måste alltså ha verkat först. Grimlund nämner saken i en fotnot och går vidare.\n\nDet ska sägas att nedläggningen i tre av de socknar han följer sammanfaller väl med sparbankens tillkomst, och att sambandet för de sista årtiondena är svårt att avfärda. Sannolikt rör det sig om flera förlopp som liknar varandra på ytan. Han antyder själv två. Spannmålspriserna blev rörligare sedan järnvägen nått bygden, så att den som hade säd hellre sålde än lånade ut. Och kommunreformen 1863 lämnade oklart vem som egentligen ägde magasinet, socknen eller den nya kommunen; oklarheten löstes påfallande ofta genom försäljning. Men detta står i förbigående, på en dryg sida, och läsaren får själv väga ihop det. Med det material Grimlund redovisar går frågan förmodligen inte att avgöra, och det hade varit klädsamt att säga det rakt ut.\n\nRoligast att läsa är annars de partier som inte ska bevisa något alls. Byggnaderna överlevde nämligen ofta sin uppgift. Magasinet i Hökaryd blev spruthus och rymmer fortfarande socknens gamla brandspruta; ett annat, i Sävlinge, flyttades tre kilometer och blev lada på en gård, och en av dörrarna med sina båda låsbleck hänger numera i en hembygdsförenings utställning. Grimlund noterar sådant i förbigående, som om det vore en avvikelse från ämnet. Det är det inte. Att en socken kunde göra sig av med inrättningen men behålla huset säger något om vad man ansåg vara värt att spara, och jag hade gärna läst tjugo sidor till om just det.\n\nBoken har ett fylligt ortregister, en ordlista över de gamla rymdmåtten och tre kartor, varav den över Hässle härad är för liten för att gå att läsa. Noterna står samlade i slutet och hänvisar genomgående till arkiv som är öppna för den som vill kontrollera. Den som vill veta hur en socken lånade sitt utsäde har nu en bok att gå till.\n– Malena Karnell, historiker',
  questions: [
    {
      qid: 'p5-las-b14-002-r1-LÄS-001',
      number: 1,
      prompt: 'Hur fungerade utlåningen ur ett sockenmagasin enligt texten?',
      options: [
        {
          letter: 'A',
          text: 'Säden lånades ut på våren och betalades tillbaka i pengar efter skörden, när låntagaren hade hunnit sälja sin gröda.',
        },
        {
          letter: 'B',
          text: 'Tillägget utöver lånet bestämdes av sockenstämman varje år, efter hur skörden det året hade utfallit.',
        },
        {
          letter: 'C',
          text: 'Låntagaren fick säd och lämnade tillbaka lika mycket vid skörden, jämte ett tillägg på vanligen en åttondel.',
        },
        {
          letter: 'D',
          text: 'Vid missväxt lånade magasinet ut till hela socknen samtidigt och kunde på så sätt fördela risken mellan gårdarna.',
        },
      ],
      answer: 'C',
    },
    {
      qid: 'p5-las-b14-002-r1-LÄS-002',
      number: 2,
      prompt: 'Vad föreskrev magasinsordningen från 1798, enligt texten?',
      options: [
        {
          letter: 'A',
          text: 'Den som stod i skuld till magasinet vid Mikaeli utestängdes från nästa vårs utlåning.',
        },
        {
          letter: 'B',
          text: 'Kyrkvärden förvarade båda nycklarna och kunde därför öppna magasinet utan att någon annan var närvarande.',
        },
        {
          letter: 'C',
          text: 'Utlåningen behövde inte skrivas in förrän vid årets slut, då alla skulder summerades på en gång.',
        },
        {
          letter: 'D',
          text: 'Föreståndaren utsågs av prästen bland socknens största jordägare och svarade ensam för räkenskaperna.',
        },
      ],
      answer: 'A',
    },
    {
      qid: 'p5-las-b14-002-r1-LÄS-003',
      number: 3,
      prompt:
        'Vilken kritik riktar recensenten mot Grimlunds förklaring till att magasinen försvann?',
      options: [
        {
          letter: 'A',
          text: 'Att han förbigår kommunreformen 1863, trots att den gjorde det oklart vem som ägde magasinen.',
        },
        {
          letter: 'B',
          text: 'Att han låter ett enda stämmoprotokoll bära hela resonemanget om avvecklingen.',
        },
        {
          letter: 'C',
          text: 'Att han överdriver sparbankernas roll så till den grad att ingen enda av socknarna i boken stöder sambandet.',
        },
        {
          letter: 'D',
          text: 'Att den vilar på sparbankerna fastän bokens egen förteckning visar nedläggningar långt före häradets första sparbank.',
        },
      ],
      answer: 'D',
    },
    {
      qid: 'p5-las-b14-002-r1-LÄS-004',
      number: 4,
      prompt: 'Varför tar recensenten upp spruthuset i Hökaryd och ladan i Sävlinge?',
      options: [
        {
          letter: 'A',
          text: 'För att ge läsaren en stunds förströelse utan betydelse för omdömet om boken.',
        },
        {
          letter: 'B',
          text: 'För att visa att husen säger mer om socknens värderingar än Grimlund inser.',
        },
        {
          letter: 'C',
          text: 'För att påpeka att Grimlund dröjer vid husen och tappar sitt ämne ur sikte.',
        },
        {
          letter: 'D',
          text: 'För att framhålla att bokens tyngd ligger i fältarbetet snarare än i arkivläsningen.',
        },
      ],
      answer: 'B',
    },
  ],
}

/** Reviewed explanations for every question of the unit. */
export const EXPLANATIONS: Record<string, Explanation> = {
  'p5-las-b14-002-r1-LÄS-001': {
    solution_path:
      'Magasinet lånade ut säd och fick tillbaka säd: låntagaren lämnade vid skörden tillbaka samma mängd plus ett tillägg, vanligen en åttondel. Det är vad C säger. Svaret är C.',
    steps: [
      {
        n: 1,
        title: 'Vad frågan gäller',
        text: 'Frågan gäller hur utlåningen gick till, och ”enligt texten” betyder att svaret ska stå i texten. Leta upp beskrivningen av själva lånet: vad man fick, när man betalade tillbaka och med vad.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Hitta stället i texten',
        text: 'Andra stycket beskriver lånet: ”Den som fick en tunna råg i mars skulle vid skörden lämna tillbaka lika mycket, jämte ett tillägg – vanligen en åttondel – också det i råg. Ingen sedel behövde växlas.”',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Säg det med egna ord',
        text: 'Man lånade säd på våren och betalade tillbaka i säd vid skörden: samma mängd plus ett tillägg. Texten sammanfattar själv principen: ”Poängen med magasinet var att det lånade ut samma vara som det tog emot.”',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Pröva alternativen',
        text: 'C återger lånet utan att lägga till något. A byter säd mot pengar, B hittar på vem som bestämde tillägget, och D vänder på det texten säger om risken.',
        tier: 'essential',
      },
      {
        n: 5,
        title: 'Slutsats',
        text: 'Utlåningen var ett lån i säd som betalades tillbaka i säd, med ett tillägg på vanligen en åttondel. Svaret är C.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          'A har rätt tidpunkter – lån på våren och återbetalning efter skörden – och därför känns resten också rätt.',
        why_wrong:
          'Återbetalningen skedde inte i pengar. Texten säger att ingen sedel behövde växlas och att även tillägget betalades i råg (steg 2).',
      },
      {
        letter: 'B',
        why_tempting:
          'Det låter rimligt att en gemensam inrättning anpassade villkoren efter hur skörden blev.',
        why_wrong:
          'Om tillägget säger texten bara att det vanligen var en åttondel och att också det betalades i råg (steg 2). Vem som bestämde det, och om det berodde på hur skörden blev, står ingenstans – B lägger till båda delarna.',
      },
      {
        letter: 'D',
        why_tempting:
          'Magasinet var en gemensam inrättning för hela socknen, och då ligger det nära till hands att tro att det fördelade risken mellan gårdarna.',
        why_wrong:
          'Texten säger tvärtom: ”Vad magasinet däremot inte kunde göra var att sprida risken.” Missväxten drabbade hela socknen på en gång, så alla behövde låna samtidigt.',
      },
    ],
    technique:
      'När frågan gäller hur något fungerade enligt texten: leta upp stycket som beskriver mekanismen och pröva varje led i alternativet – vad, när och med vad. Ett enda felaktigt led räcker för att alternativet ska vara fel.',
    pitfall:
      'Liknelsen ”en bank vars valuta var säd” kan locka till en läsning där lånet gällde pengar. Liknelsen handlar om att skulden bokfördes, kunde ärvas och kunde skrivas av – själva lånet och återbetalningen skedde i säd.',
    framework_id: 'LAS-TYPE-001',
  },
  'p5-las-b14-002-r1-LÄS-002': {
    solution_path:
      'Ordningen från 1798 slog fast att den som inte hade betalat tillbaka till Mikaeli fick stå över nästa vårs utlåning. A säger samma sak med andra ord. Svaret är A.',
    steps: [
      {
        n: 1,
        title: 'Vad frågan gäller',
        text: 'Frågan gäller vad magasinsordningen från 1798 föreskrev, alltså vilka regler den innehöll. Svaret står i fjärde stycket, där recensenten går igenom ordningen.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Lista reglerna',
        text: 'Fjärde stycket nämner fyra regler: magasinet fick öppnas bara när två personer var på plats, låsen hade skilda nycklar (kyrkvärden bar den ena och den föreståndare som sockenstämman valt bar den andra), varje utlåning skulle skrivas in samma dag, och ”Den som inte hade betalat tillbaka till Mikaeli, i slutet av september, fick stå över utlåningen följande vår.”',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Jämför med A',
        text: 'A säger att den som fortfarande stod i skuld vid Mikaeli stängdes ute från nästa vårs utlåning. Det är samma regel: den som inte har betalat tillbaka står i skuld, och att stå över utlåningen är att stängas ute från den.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Pröva de andra',
        text: 'B, C och D strider var och en mot någon av de andra reglerna: nycklarna fanns hos två personer, inskrivningen skulle ske samma dag, och föreståndaren valdes av sockenstämman.',
        tier: 'essential',
      },
      {
        n: 5,
        title: 'Slutsats',
        text: 'Bara A stämmer med magasinsordningen. Svaret är A.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'B',
        why_tempting:
          'Kyrkvärden nämns som en av dem som bar nycklarna, och vid snabb läsning kan det verka som om kyrkvärden hade hand om magasinet ensam.',
        why_wrong:
          'Låsen hade skilda nycklar – kyrkvärden bar den ena och föreståndaren den andra – och magasinet fick öppnas bara när två personer var på plats (steg 2). B tar bort hela poängen med två nycklar.',
      },
      {
        letter: 'C',
        why_tempting:
          'Det låter praktiskt att föra räkenskaperna en gång om året, och många föreställer sig gammal bokföring just så.',
        why_wrong:
          'Ordningen krävde motsatsen: varje utlåning skulle skrivas in samma dag (steg 2).',
      },
      {
        letter: 'D',
        why_tempting:
          'Att prästen utsåg en betrodd storbonde låter som en trolig ordning för tiden, och prästen nämns faktiskt i texten.',
        why_wrong:
          'Texten säger att föreståndaren valdes av sockenstämman, inte av prästen (steg 2), och prästen nämns bara i samband med att magasinen byggdes. Att föreståndaren ensam svarade för räkenskaperna står inte heller i texten: ordningen säger att varje utlåning skulle skrivas in samma dag, men inte vem som skulle göra det.',
      },
    ],
    technique:
      'När frågan gäller vad en regel eller ett dokument föreskrev: lista först alla regler som texten nämner och pröva sedan varje alternativ mot listan. Felaktiga alternativ bryter ofta mot någon av de andra reglerna.',
    pitfall:
      'Det rätta alternativet är omformulerat – ”stod i skuld” och ”utestängdes” i stället för textens ”inte hade betalat tillbaka” och ”fick stå över”. Leta efter samma innebörd, inte samma ord.',
    framework_id: 'LAS-TYPE-001',
  },
  'p5-las-b14-002-r1-LÄS-003': {
    solution_path:
      'Recensentens huvudinvändning är att Grimlund förklarar nedläggningarna med sparbankerna, trots att bokens egen förteckning visar att de första magasinen lades ned flera decennier innan häradet fick en sparbank. D återger just den invändningen. Svaret är D.',
    steps: [
      {
        n: 1,
        title: 'Vad frågan gäller',
        text: 'Frågan gäller recensentens kritik, och bara den som riktas mot Grimlunds förklaring till att magasinen försvann. Leta upp det ställe där recensenten diskuterar avvecklingen, inte andra delar av boken.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Hitta kritiken',
        text: 'Sjätte stycket inleds med ”Svagare blir framställningen när den ska förklara varför magasinen försvann.” Grimlund pekar på sparbankerna, men recensenten invänder: ”I den förteckning över avvecklade magasin som avslutar boken ligger de tidigaste nedläggningarna i Hässle härad flera decennier före den första sparbanken i samma härad.”',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Säg det med egna ord',
        text: 'Grimlunds förklaring motsägs delvis av hans eget material: magasin lades ned långt innan det fanns någon sparbank att låna i. Något annat måste alltså ha drivit de tidigaste nedläggningarna, men Grimlund nämner motsägelsen bara i en fotnot och går vidare.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Se vad recensenten medger',
        text: 'Kritiken är avgränsad. I sjunde stycket medger recensenten att nedläggningen i tre av socknarna sammanfaller väl med sparbankens tillkomst. Invändningen är alltså inte att sparbankerna saknar betydelse, utan att de inte kan förklara de tidigaste nedläggningarna.',
        tier: 'detail',
      },
      {
        n: 5,
        title: 'Slutsats',
        text: 'D återger invändningen: förklaringen vilar på sparbankerna fastän bokens egen förteckning visar nedläggningar långt före häradets första sparbank. Svaret är D.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          'Kommunreformen 1863 nämns i texten, och recensenten är missnöjd med hur den behandlas. Ordet ”förbigår” ligger dessutom nära textens ”i förbigående”.',
        why_wrong:
          'Grimlund förbigår inte reformen – den är en av de två förklaringar som han själv antyder. Kritiken gäller att det sker ”i förbigående, på en dryg sida”, inte att reformen saknas.',
      },
      {
        letter: 'B',
        why_tempting:
          'Recensenten skriver att ”ett dokument, noga läst, får bära ett helt resonemang”, och det är lätt att koppla den meningen till avvecklingen.',
        why_wrong:
          'Den meningen gäller stämmoprotokollet från Bjärnhult, som visar avståndet mellan regel och praktik, och där berömmer recensenten bokens arbetssätt. Om förklaringen till avvecklingen säger recensenten inget sådant.',
      },
      {
        letter: 'C',
        why_tempting:
          'Recensenten är kritisk till sparbanksförklaringen, och C låter som en skarpare version av samma invändning.',
        why_wrong:
          'C överdriver kritiken. Recensenten medger att nedläggningen i tre av socknarna sammanfaller väl med sparbankens tillkomst (steg 4), så sambandet har stöd i en del av materialet.',
      },
    ],
    technique:
      'När frågan gäller vad en recensent kritiserar: avgränsa först vilket ämne kritiken gäller, och läs sedan både invändningen och det som recensenten medger. Rätt svar har samma räckvidd som kritiken – varken mer eller mindre.',
    pitfall:
      'Ord som liknar textens ord kan leda fel. Att förbigå något betyder att hoppa över det, medan att nämna det i förbigående betyder att ta upp det kort. Kontrollera innebörden, inte bara likheten.',
    framework_id: 'LAS-TYPE-003',
  },
  'p5-las-b14-002-r1-LÄS-004': {
    solution_path:
      'Recensenten använder husen för att visa något som Grimlund behandlar som en bisak: att socknarna gjorde sig av med inrättningen men behöll huset säger något om vad man ville spara. B fångar den poängen. Svaret är B.',
    steps: [
      {
        n: 1,
        title: 'Vad frågan gäller',
        text: 'Frågan gäller varför recensenten tar upp två hus, alltså vilken uppgift exemplen fyller i recensionen – inte vad som hände med husen.',
        tier: 'essential',
      },
      {
        n: 2,
        title: 'Hitta stället',
        text: 'Husen tas upp i åttonde stycket. Där konstateras att Grimlund noterar sådant ”i förbigående, som om det vore en avvikelse från ämnet”, och recensenten svarar: ”Det är det inte. Att en socken kunde göra sig av med inrättningen men behålla huset säger något om vad man ansåg vara värt att spara”.',
        tier: 'essential',
      },
      {
        n: 3,
        title: 'Säg det med egna ord',
        text: 'Grimlund ser husen som en bisak. Recensenten menar att de säger något viktigt om vad socknarna värderade och skulle gärna läsa tjugo sidor till om det. Exemplen bär alltså en invändning: Grimlund ser inte vad husen visar.',
        tier: 'essential',
      },
      {
        n: 4,
        title: 'Pröva alternativen',
        text: 'B fångar både poängen och invändningen. A stämmer bara till hälften, C tillskriver recensenten Grimlunds syn, och D lägger bokens tyngd i fältarbetet, fast texten framhåller arkivläsningen.',
        tier: 'essential',
      },
      {
        n: 5,
        title: 'Slutsats',
        text: 'Recensenten tar upp husen för att visa att de säger mer om socknens värderingar än Grimlund inser. Svaret är B.',
        tier: 'essential',
      },
    ],
    distractors: [
      {
        letter: 'A',
        why_tempting:
          'Recensenten kallar de här partierna de roligaste att läsa och säger att de inte ska bevisa något, så det kan verka som om de bara är till för nöjes skull.',
        why_wrong:
          'Att partierna är roliga att läsa betyder inte att de saknar betydelse. Recensenten menar tvärtom att de hör till ämnet och vill läsa mer om dem (steg 2–3).',
      },
      {
        letter: 'C',
        why_tempting:
          'Texten säger att husen behandlas som en avvikelse från ämnet, och C låter som kritik i samma anda.',
        why_wrong:
          'Det är Grimlund som behandlar husen som en avvikelse, inte recensenten. Han dröjer inte heller vid dem utan noterar dem bara i förbigående (steg 2).',
      },
      {
        letter: 'D',
        why_tempting:
          'Husen är konkreta platser som går att besöka, och det kan få det att låta som om bokens styrka är fältarbete.',
        why_wrong:
          'Texten pekar åt andra hållet: bokens bästa kapitel återger magasinsordningen från 1798, och noterna hänvisar genomgående till arkiv som är öppna för kontroll. Husen nämns bara i förbigående och är ingen tyngdpunkt.',
      },
    ],
    technique:
      'När frågan är varför författaren tar upp något: leta efter meningen före eller efter exemplet som säger vad det ska visa. Svaret är den poäng exemplet stöder, inte en beskrivning av exemplet självt.',
    pitfall:
      'Håll isär rösterna. En recension återger ofta bokförfattarens syn bredvid recensentens egen, och felaktiga alternativ lägger gärna den enas uppfattning i den andras mun.',
    framework_id: 'LAS-TYPE-004',
  },
}

// ── Frameworks (app/public/frameworks/*_taxonomy.json) ───────────────

/** framework id → question_type, for the "Ramverk" link in feedback. */
export const FRAMEWORK_NAMES: Record<string, string> = {
  'LAS-TYPE-001': 'Direkt detalj',
  'LAS-TYPE-003': 'Författarens hållning',
  'LAS-TYPE-004': 'Retorisk funktion',
  'ELF-TYPE-002': 'Slutsatsdragning / implikation',
}

// ── The session the reader resumes ───────────────────────────────────

/** Where the drill opens: question 3 of the unit, after two answers. */
export const SESSION = {
  /** Index into UNIT.questions of the question on screen 2 (Läsfråga). */
  startIndex: 2,
  /** Earlier answers in this sitting — progress only, never graded aloud. */
  earlier: [
    { qid: UNIT.questions[0].qid, pick: 'C' as AnswerLetter },
    { qid: UNIT.questions[1].qid, pick: 'C' as AnswerLetter },
  ],
  /** The wrong pick screen 3 (Facit) shows, per question. A on question 3
   *  is the trap the pitfall names (»förbigår« vs »i förbigående«). */
  wrongPick: {
    [UNIT.questions[2].qid]: 'A',
    [UNIT.questions[3].qid]: 'C',
  } as Record<string, AnswerLetter>,
  /** Seconds on the clock when the drill opens. */
  elapsedSeconds: 9 * 60 + 24,
}

// ── Home (Idag) ──────────────────────────────────────────────────────

export const TODAY = {
  /** Friday 9 October 2026, mid-afternoon. */
  iso: '2026-10-09T15:40:00',
  weekday: 'Fredag',
  dateLabel: 'Fredag 9 oktober',
  shortDate: 'fre 9 okt',
  greeting: 'God eftermiddag',
}

/** The next sitting (lib/dates EXAM_SITTINGS[0]): Höstprov 26, 25 Oct 2026. */
export const EXAM = {
  id: 'host-2026',
  label: 'Höstprov 26',
  name: 'Högskoleprovet',
  dateLabel: 'söndag 25 oktober',
  shortDate: '25 okt',
  daysLeft: 16,
}

/** The paused LÄS session — Home's one primary action. */
export const RESUME = {
  section: 'LÄS' as const,
  kind: 'LÄS-övning',
  /** The unit title up to its colon, as the resume card sets it. */
  title: 'Magasinet i Hökaryd',
  subtitle: 'en handbok om socknens spannmål',
  position: 3,
  total: 4,
  answered: 2,
  device: 'telefon',
  pausedAt: 'Idag · 07:52',
  minutesLeft: 6,
}

export type PlanItem = {
  id: string
  kind: 'repetition' | 'lektion' | 'övning'
  /** Section code, or null for the cross-section repetition. */
  section: string | null
  title: string
  detail: string
  rationale: string
  minutes: number
  /** The one item Home points at after the resume. */
  primary?: boolean
}

export const PLAN: { minutes: number; items: PlanItem[] } = {
  minutes: 19,
  items: [
    {
      id: 'rep',
      kind: 'repetition',
      section: null,
      title: 'Repetition',
      detail: '8 av 23 missar',
      rationale: 'De äldsta missarna först, innan de hinner glömmas.',
      minutes: 9,
      primary: true,
    },
    {
      id: 'lektion',
      kind: 'lektion',
      section: 'ELF',
      title: 'ELF-lektion',
      detail: 'Slutsatsdragning / implikation',
      rationale: 'Två av dina tre senaste ELF-missar var slutsatsfrågor.',
      minutes: 6,
    },
    {
      id: 'ord',
      kind: 'övning',
      section: 'ORD',
      title: 'ORD-övning',
      detail: '10 frågor',
      rationale: 'En snabb runda som håller ordförrådet varmt.',
      minutes: 4,
    },
  ],
}

/** Projected total on the 0–2,0 scale, with the halves and the honest
 *  week-over-week delta. LÄS and ELF feed it, so it carries the caveat. */
export const PROGNOSIS = {
  total: 1.4,
  delta: 0.1,
  verbal: 1.5,
  quant: 1.3,
  low: 1.25,
  high: 1.55,
  target: 2.0,
  /** Weekly projected totals, oldest first (the last is this week). */
  weeks: [1.1, 1.15, 1.2, 1.2, 1.25, 1.3, 1.4],
}

export type Trap = {
  frameworkId: string
  section: string
  /** The framework's question type. */
  name: string
  /** A common-distractor pattern from the framework (LÄS/ELF), or a short rule. */
  pattern: string
  count: number
  rising?: boolean
}

export const TRAPS: Trap[] = [
  {
    frameworkId: 'LAS-TYPE-003',
    section: 'LÄS',
    name: 'Författarens hållning',
    pattern: 'Rätt valens, fel objekt',
    count: 3,
    rising: true,
  },
  {
    frameworkId: 'ELF-TYPE-002',
    section: 'ELF',
    name: 'Slutsatsdragning / implikation',
    pattern: 'Två-stegs-hopp (rimligt men ostött)',
    count: 2,
  },
  {
    frameworkId: 'XYZ-TRAP-016',
    section: 'XYZ',
    name: 'Bråkaddition',
    pattern: 'Bråkaddition kräver gemensam nämnare innan täljarna får adderas.',
    count: 2,
  },
]

export type RecentPass = {
  id: string
  label: string
  correct: number
  total: number
  when: string
}

export const RECENT: RecentPass[] = [
  { id: 'p1', label: 'ORD', correct: 9, total: 10, when: 'Igår' },
  { id: 'p2', label: 'Repetition', correct: 7, total: 8, when: 'Igår' },
  { id: 'p3', label: 'NOG', correct: 4, total: 6, when: 'Onsdag' },
]

/** Forgiving consistency: days practised this week against a weekly goal —
 *  no streak to lose. */
export const WEEK = { daysPractised: 4, goal: 5, minutesToday: 14 }

/** Öva's spaced-repetition queue size (the nav badge). */
export const OVA_DUE = 23
