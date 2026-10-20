import type { DirectionMeta } from '@/components/devbake/redesign/r1Kit'

export const meta: DirectionMeta = {
  key: 'g',
  slug: 'g-raster',
  name: 'Raster',
  screens: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
  // B0 §13 / owner question 4: Raster retains its palette, typography and spacing.
  omits: { konto: ['palette', 'font', 'density'] },
  tagline: 'Schweiziskt raster, stora siffror',
  traits: [
    'Tolv kolumner, raka linjer och stora, smala Archivo-siffror. Inga kort eller skuggor.',
    'En signalgul fortsätt-rad. Resten av dagen som en numrerad tidtabell.',
    'Fem numrerade ingångar i överkant; samma index i telefonens nederkant.',
    'IBM Plex Serif för läsningen, hängande ¶-nummer och ett radindelat facit med belägg i marginalen.',
  ],
  risk: 'Kan kännas stramt eller tätt. Generösa mellanrum, stor lästext och en tydlig fortsättning ger rastret luft.',
  references:
    'Josef Müller-Brockmann · Vignellis tunnelbanemanual för New York · SBB:s tidtabeller · Teenage Engineering · Are.na',
}
