import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'h',
  slug: 'h-ljuskagla',
  name: 'Ljuskägla',
  tagline: 'Mörkt läge, ljus på stycket du läser',
  traits: [
    'Ett stilla läsrum i varm kolgrå. Ett enda upplyst fortsätt-kort på Idag; dagens plan, prognos och fällor väntar i skuggan.',
    'Manrope i gränssnittet, Spectral i texten. Generös radrytm och en varm ljuslinje i marginalen håller kvar läsplatsen.',
    'Ljuset följer klick, rullning och J/K eller piltangenter. En synlig strömbrytare låter hela texten få samma ljus.',
    'Text och fråga har varsin ogenomskinlig yta på datorn. På telefonen börjar du med texten och öppnar frågan från nederkanten.',
    'Facit följer en lugn ordning från felsvar till teknik. En hänvisning till ¶6 tänder stycket; på telefonen viker facit undan.',
    'Ljust läge är solbelyst papper med mjuk skugga. Menyn träder fram vid hovring och tangentbordsfokus; kontot är alltid nära.',
  ],
  risk: 'Risk: skuggad text kan försvinna ur sammanhanget. Svar: läsbar text även i skuggan, tydlig avstängning av styckeljuset och ett fullvärdigt ljust tema.',
  references:
    'iA Writers fokusläge, Ulysses skrivmaskinsläge, Kindles och Apple Books nattlägen, teaterns ljussättning och Endels stillhet.',
  screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  // docs/redesign/directions/h-ljuskagla.md §13 ("Reuse and additions":
  // palette controls must not recolor H's scoped comparison preview) and
  // owner question 6 ("leave H's comparison palette fixed here"): Konto
  // names the app's palette but offers no palette choice.
  omits: { konto: ['palette'] },
}
