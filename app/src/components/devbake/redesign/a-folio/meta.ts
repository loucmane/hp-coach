// A · Folio's entry in the bake-off's direction registry (../directions.ts).

import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'a',
  slug: 'a-folio',
  name: 'Folio',
  tagline: 'Redaktionellt papper, nästa generation',
  traits: [
    'HP-Coach som en vackert satt bok: ett enda ark varmt papper, kolsvart bläck och en enda bläckblå accent – inga paneler, inga kort.',
    'Literata för texter, rubriker och menyn, Inter med optisk storlek för gränssnittet, tabellsiffror.',
    'Menyn är en innehållsförteckning i ord; hopfälld blir den ett tumregister med en bokstav per mål. Kontot öppnas som en papperslapp.',
    'Idag är en förstasida: det du läser är ingressen under en kraftig linje med ett bokmärkesband, resten av dagen en innehållsförteckning med punktlinjer, prognosen i marginalen.',
    'Läsfrågan är ett uppslag utan appfält: varje sida har sin egen sidhuvudrad, ryggen skuggas och kan flyttas. Facit börjar med varför ditt svar lockade; förklaringens citat stryks under i själva texten.',
    'Öva och Repetera är innehållsförteckningar med punktlinjer fram till sidans siffror. Kvantfrågan är en sida som slås upp till ett uppslag när du svarar, och DTK-figuren är en inklistrad plansch som ligger kvar medan frågorna byts.',
    'Provpass är en kallelse – ”Anmälan.”, ett register med punktlinjer och villkoren på en lapp. Passet behåller bokens löphuvuden och har ett tumregister i sidkanten; resultatet är bokens slutsida med ⁂ och fotnot, Framsteg en rapport och Historik en liggare vecka för vecka.',
    'Uppslag är bokstavligen ett uppslag: kapitlets innehåll med bokmärkesband på vänstersidan, posten som en referenssida till höger och kapitlet som slutar med ⁂. Konto är bokens tryckortssida med ordval i stället för reglage. ELF är samma uppslag satt på engelska, med luckorna som linjerade blanketter där ordet skrivs in med blyerts.',
  ],
  risk: 'Risk: för tyst. Svar: en enda fylld knapp per skärm och en ingress vars rubrik är sidans största föremål.',
  references: 'Readwise Reader, Things 3, Craft, Khan Academys typografi, Linears varma grå.',
  screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  // docs/redesign/directions/a-folio.md, screen 13 "What it shows": the
  // palette is not carried into Folio, which is one palette (open question
  // 7), and the page has no font or density rows — users cannot set them
  // today (open question 8). The coach and the deletion are on the page.
  omits: { konto: ['palette', 'font', 'density'] },
}
