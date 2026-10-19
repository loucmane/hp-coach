// B · Instrument's entry in the bake-off's direction registry (../directions.ts).

import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'b',
  slug: 'b-instrument',
  name: 'Instrument',
  tagline: 'Precisionsverktyg för proffs',
  traits: [
    'Ett grått chassi som håller ljusa paneler: lager av ton och 1 px kant, hårda hörn, inga mjuka skuggor – och en enda signalorange accent för huvudhandlingen.',
    'Geist och Geist Mono för gränssnitt, siffror och tangenter; texten i Atkinson Hyperlegible Next. Rörelse under 100 ms.',
    'Panelerna är indelade i celler med mono-rubriker, avläsningar och tangentchips; en statusrad på varje skärm.',
    'Idag är en kommandolista: ↑/↓ väljer, ↵ öppnar, och dagens tidsaxel följer markeringen.',
    'Övningen är två paneler i chassit med en flyttbar springa emellan; efter svaret blir frågepanelen en facitpanel, och F döljer allt utom text och fråga.',
  ],
  risk: 'Risk: kan läsas som ett utvecklarverktyg. Svar: Idag hålls glest, varje kortkommando är också en synlig knapp, och F tar bort allt utom text och fråga.',
  references: 'Linear, Raycast, Superhuman, Notion Calendar, Vercel Geist.',
}
