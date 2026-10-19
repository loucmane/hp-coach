// D · Lager's entry in the bake-off's direction registry (../directions.ts).

import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'd',
  slug: 'd-lager',
  name: 'Lager',
  tagline: 'Rumsligt djup, glas på rätt sätt',
  traits: [
    'Ett ogenomskinligt läsark svävar över ett stilla, delprovsfärgat fält som tonas ned när läsningen börjar.',
    'Glas bara på navigering och kontroller – aldrig brödtext på glas.',
    'Newsreader för texter, systemets typsnitt (SF) med Inter som reserv, Fraunces för sällsynta rubriker.',
    'Tre nivåer: fält, ark och glaskontroller. En flytande docka med etiketter som krymper när sidan rullas men aldrig döljs.',
    'Frågan är ett eget ark bredvid texten; förklaringen läggs ovanpå som ett tredje ark.',
  ],
  risk: 'Risk: kontrast. Svar: kontrollerna testas mot den sämsta bakgrunden och får ogenomskinlig reserv.',
  references:
    'Apple Liquid Glass och HIG Materials, Things för OS 26, Arc/Dia; NN/g ”Liquid Glass Is Cracked” som lista över fel.',
}
