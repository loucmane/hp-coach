// LandingBakeoffR4B.content — content + generic beat model for the v4
// bake-off variant B "Tryckpressen".
//
// The hero question stays VEDERHAFTIG verbatim (imported from
// LandingBakeoffR3.logic — content authority: landing-pedagogy-consult
// § 3). This module adds the v4 mechanics requirement — EVERY demo
// question gets the full genomgång — by (a) writing ORIGINAL genomgång
// content for two more questions in the same structure and register
// (verdict variants, steg with kärna/detalj tiers, per-distractor
// fällor), and (b) generalizing the R3 beat model over any option-letter
// set (KVA has four options a–d; ORD has five a–e).
//
// LEGAL: both questions below are ORIGINAL, written for HP-Coach in
// authentic HP style — nothing from the © UHR corpus. Labeled on-page
// ("Exempeluppgift skriven för HP-Coach").
//
// Pure data + pure functions — no JSX, unit-testable.

import {
  type Beat,
  buildBeats,
  type OptionKey,
  TRAP_TAGS,
  VEDERHAFTIG,
} from './LandingBakeoffR3.logic'

/* ── generic content shape (the VederhaftigContent shape, letter-generic) ── */

export interface PressStep {
  title: string
  tier: 'kärna' | 'detalj'
  body: string
}

export interface PressDistractor {
  whyTempting: string
  whyWrong: string
}

export interface PressContent {
  id: string
  section: string
  kicker: string
  /** ORD headword (display-scale) — or undefined for prompt questions. */
  headword?: string
  /** Prompt body (KVA/MEK) — rendered pre-line. */
  prompt?: string
  options: { key: string; text: string }[]
  correct: string
  verdictSub: { ratt: string; fel: string }
  lede: string
  steps: PressStep[]
  /** Keyed by option letter; exactly the non-correct options. */
  distractors: Record<string, PressDistractor>
  /** Canonical (product reading) order of the distractor letters. */
  distractorOrder: readonly string[]
  /** The fälla that leads on a CORRECT pick (the most instructive one). */
  exemplarLetter: string
  /** Mono trap-tag per distractor — the kvitto voice. */
  trapTags: Record<string, string>
}

/* ── the hero, adapted — VEDERHAFTIG content verbatim ─────────────────── */

export const PRESS_HERO: PressContent = {
  id: 'ord-1',
  section: VEDERHAFTIG.section,
  kicker: VEDERHAFTIG.kicker,
  headword: VEDERHAFTIG.headword,
  options: VEDERHAFTIG.options,
  correct: VEDERHAFTIG.correct,
  verdictSub: VEDERHAFTIG.verdictSub,
  lede: VEDERHAFTIG.lede,
  steps: VEDERHAFTIG.steps,
  distractors: VEDERHAFTIG.distractors,
  distractorOrder: ['a', 'c', 'd', 'e'],
  exemplarLetter: 'd',
  trapTags: TRAP_TAGS,
}

/* ── FORM 2 — KVA (original, written for HP-Coach) ────────────────────── */

export const PRESS_KVA: PressContent = {
  id: 'kva-1',
  section: 'KVA',
  kicker: 'Vilken kvantitet är störst?',
  prompt: 'x är ett positivt tal.\n\nKvantitet I:  40 % av 3x\nKvantitet II:  30 % av 4x',
  options: [
    { key: 'a', text: 'I är större än II' },
    { key: 'b', text: 'II är större än I' },
    { key: 'c', text: 'I är lika med II' },
    { key: 'd', text: 'informationen är otillräcklig' },
  ],
  correct: 'c',
  verdictSub: {
    ratt: 'Snyggt — rätt tänkt hela vägen.',
    fel: 'Rätt svar är c) I är lika med II. Häng med i varför.',
  },
  lede: 'Båda kvantiteterna är 1,2x — procenten och talet har bara bytt plats. Svaret är C.',
  steps: [
    {
      title: 'Skriv om till samma form',
      tier: 'kärna',
      body: 'Procent är multiplikation: 40 % av 3x är 0,4 · 3x = 1,2x, och 30 % av 4x är 0,3 · 4x = 1,2x. Samma produkt i olika förpackning — faktorerna har bara bytt plats.',
    },
    {
      title: 'Känslan jämför fel saker',
      tier: 'detalj',
      body: 'Ögat vill jämföra 40 mot 30, eller 4x mot 3x — en siffra i taget. Men en kvantitet är en PRODUKT: helheten avgör, inte den största delen. KVA-fällorna bor nästan alltid i den skillnaden.',
    },
    {
      title: 'Avgör om x spelar roll',
      tier: 'kärna',
      body: 'Båda kvantiteterna växer i samma takt när x växer — 1,2x mot 1,2x för varje positivt x. Att x är okänt ändrar alltså ingenting: likheten håller oavsett värde.',
    },
  ],
  distractors: {
    a: {
      whyTempting:
        '40 % är mer än 30 %, och ögat läser procentsatsen först — den känns som hela kvantitetens storlek.',
      whyWrong:
        'Procentsatsen är bara den ena faktorn. Den större procenten tas här av det mindre talet: 0,4 · 3x och 0,3 · 4x är exakt samma sak. Räkna klart innan du jämför.',
    },
    b: {
      whyTempting:
        '4x är mer än 3x — den som fastnar på talen i stället för procenten dras åt andra hållet.',
      whyWrong:
        'Samma fälla, spegelvänd: det större talet tas med den mindre procenten. Båda produkterna landar på 1,2x. En KVA-uppgift avgörs aldrig av en faktor i taget.',
    },
    d: {
      whyTempting:
        'x är okänt, och »okänt« låter som »otillräcklig information« — alternativet står ju där som en nödutgång.',
      whyWrong:
        '»Otillräcklig« gäller bara när olika x ger OLIKA utfall. Här ger varje positivt x samma resultat: 1,2x på båda sidor. Prova x = 10 — det blir 12 mot 12. Likheten är inte en slump, den är algebra.',
    },
  },
  distractorOrder: ['a', 'b', 'd'],
  exemplarLetter: 'd',
  trapTags: { a: 'procentögat', b: 'talögat', d: 'nödutgången' },
}

/* ── FORM 3 — ORD, second specimen (original, written for HP-Coach) ───── */

export const PRESS_ORD2: PressContent = {
  id: 'ord-2',
  section: 'ORD',
  kicker: 'Vilket ord betyder ungefär detsamma?',
  headword: 'förslagen',
  options: [
    { key: 'a', text: 'föreslagen' },
    { key: 'b', text: 'slug' },
    { key: 'c', text: 'uppslagsrik' },
    { key: 'd', text: 'påstridig' },
    { key: 'e', text: 'förtänksam' },
  ],
  correct: 'b',
  verdictSub: {
    ratt: 'Snyggt — rätt tänkt hela vägen.',
    fel: 'Rätt svar är b) slug. Häng med i varför.',
  },
  lede: 'Förslagen betyder listig och slug — den som hittar en utväg där ingen annan ser någon. Svaret är B.',
  steps: [
    {
      title: 'Vad betyder förslagen?',
      tier: 'kärna',
      body: 'En förslagen person är slug: påhittig på ett beräknande sätt, med blick för kryphål. Ordet är släkt med »slå« — den förslagne är slagfärdig i handling, inte bara i tal. Tonen är varnande snarare än berömmande.',
    },
    {
      title: 'Ett particip som inte är ett',
      tier: 'detalj',
      body: 'Förslagen ser ut som participet av föreslå — men det är ett självständigt adjektiv med egen historia. Provet älskar sådana ord: formen pekar åt ett håll, betydelsen åt ett annat. Läs ordet som ETT ord, inte som en böjning.',
    },
    {
      title: 'Välj synonymen',
      tier: 'kärna',
      body: 'Slug (b) träffar kärnan: list med baktanke. De andra alternativen lånar formen, associationen eller stilkänslan — men inget av dem bär det beräknande draget.',
    },
  ],
  distractors: {
    a: {
      whyTempting:
        'En enda bokstav skiljer — ögat läser förslagen som föreslagen och hjärnan fyller i resten. Under tidspress är det provets vanligaste felläsning.',
      whyWrong:
        'Föreslagen är particip av föreslå — den som blivit nominerad. Förslagen är ett eget adjektiv: listig. Orden delar stam men inte betydelse; bokstaven e gör hela jobbet.',
    },
    c: {
      whyTempting:
        'Förslag ger idéer, idéer ger uppslag — associationen glider från förslagen till den som är rik på uppslag.',
      whyWrong:
        'Uppslagsrik är kreativ i öppen, positiv mening. Förslagen är påhittig MED BAKTANKE — listen riktas mot ett kryphål. Berömmet i uppslagsrik saknar just det beräknande draget.',
    },
    d: {
      whyTempting:
        'Den sluge driver sin sak, och bilden ligger nära någon som är på och stridig — envist framåt.',
      whyWrong:
        'Påstridig beskriver trycket, inte listen: den påstridige tjatar sig fram öppet. Den förslagne gör tvärtom — hittar vägen runt utan att höras. Metoderna är närmast motsatta.',
    },
    e: {
      whyTempting:
        'Både förledet och klangen ligger nära, och båda orden beskriver någon som tänker före.',
      whyWrong:
        'Förtänksam är försiktigt planerande — ett oreserverat beröm. Förslagen planerar också, men med slughet i blicken. Nyansskillnaden är precis den provet frågar efter: samma yta, olika laddning.',
    },
  },
  distractorOrder: ['a', 'c', 'd', 'e'],
  exemplarLetter: 'a',
  trapTags: { a: 'bokstavsfälla', c: 'association', d: 'metodförväxling', e: 'betydelsegranne' },
}

/* ── generic beat model — the R3 Scenen choreography over any letters ─── */

export type PressBeat =
  | { kind: 'utfall'; correct: boolean }
  | { kind: 'steg'; stegIndex: number }
  | { kind: 'falla'; letter: string; dinGissning: boolean; compressed: boolean }
  | { kind: 'kvitto'; correct: boolean }

/** R3 Beat → PressBeat (identity-shaped; widens the letter type). */
function fromR3Beat(b: Beat): PressBeat {
  return b
}

/**
 * Build the Scenen beat sequence for a graded answer on any question.
 * The HERO rides R3's own `buildBeats` (the imported engine, verbatim
 * choreography); other questions get the same din-fälla-först ordering
 * generalized over their own letter sets.
 */
export function buildPressBeats(q: PressContent, picked: string): PressBeat[] {
  if (q.id === PRESS_HERO.id) {
    return buildBeats({ mode: 'scenen', picked: picked as OptionKey }).map(fromR3Beat)
  }
  const correct = picked === q.correct
  const beats: PressBeat[] = [{ kind: 'utfall', correct }]
  for (let i = 0; i < q.steps.length; i++) beats.push({ kind: 'steg', stegIndex: i })
  const lead = correct ? q.exemplarLetter : picked
  beats.push({ kind: 'falla', letter: lead, dinGissning: !correct, compressed: false })
  for (const letter of q.distractorOrder) {
    if (letter === lead) continue
    beats.push({ kind: 'falla', letter, dinGissning: false, compressed: true })
  }
  beats.push({ kind: 'kvitto', correct })
  return beats
}
