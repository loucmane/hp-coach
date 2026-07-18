// LandingBakeoffR4A.content — content + generic beat model for landing
// v4 variant A ("Sidan öppnar som frågan").
//
// The hero question is the R3 vederhäftig genomgång VERBATIM (imported
// from LandingBakeoffR3.logic — content authority: docs/superpowers/
// consults/landing-pedagogy-consult.md § 3, owner-approved). Questions
// 2 (KVA) and 3 (MEK) are ORIGINAL work written for HP-Coach in the
// same structure and register — verdict variants, steg with kärna/
// detalj tiers, per-distractor fällor, trap tags. NOTHING from the
// © UHR corpus; every question is labeled as an example on the page.
//
// The beat model generalises R3's buildBeats (Scenen semantics:
// din-fälla-först, the rest compressed) over arbitrary option keys so
// ONE player can run all three questions. R3 files are imported, never
// modified.

import { TRAP_TAGS, VEDERHAFTIG } from './LandingBakeoffR3.logic'

/* ── generic content shape (mirrors R3's VederhaftigContent, but with
 *    arbitrary option keys + per-question kvitto copy) ─────────────── */

export interface GenContent {
  id: string
  section: string
  kicker: string
  /** ORD-style single headword hero (display italic). */
  headword?: string
  /** Prompt for KVA/MEK-style questions (pre-line). */
  prompt?: string
  options: { key: string; text: string }[]
  correct: string
  verdictSub: { ratt: string; fel: string }
  lede: string
  steps: { title: string; tier: 'kärna' | 'detalj'; body: string }[]
  distractors: Record<string, { whyTempting: string; whyWrong: string }>
  /** Fault-taxonomy tag per distractor (the kvitto's bookkeeping). */
  trapTags: Record<string, string>
  /** Distractor that leads the fällor on a CORRECT pick. */
  exemplar: string
  /** The kvitto beat's landing-voice note (unique per question). */
  kvittoNote: string
  /** Landing margin annotations — hero only (exactly three, per the
   *  pedagogy consult); undefined on the other questions. */
  annotations?: { utfall: string; steg: string; fallor: string; fallorRatt: string }
}

/* ── question 1 — the hero: vederhäftig, verbatim from R3 ──────────── */

export const Q1_HERO: GenContent = {
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
  trapTags: TRAP_TAGS,
  exemplar: 'd',
  kvittoNote: 'Det du just läste är appens riktiga genomgång — varje fråga i kursen rättas så här.',
  annotations: VEDERHAFTIG.annotations,
}

/* ── question 2 — KVA (original, written for HP-Coach) ─────────────── */

export const Q2_KVA: GenContent = {
  id: 'kva-1',
  section: 'KVA',
  kicker: 'Vilken kvantitet är störst?',
  prompt: 'Kvantitet I:  25 % av 84\nKvantitet II:  84 % av 25',
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
  lede: '25 % av 84 och 84 % av 25 är samma tal — x procent av y är alltid lika med y procent av x. Svaret är C.',
  steps: [
    {
      title: 'Skriv om procenten',
      tier: 'kärna',
      body: 'Procent av betyder gånger: 25 % av 84 är 0,25 · 84, och 84 % av 25 är 0,84 · 25. Så fort orden blivit multiplikation är kvantiteterna bara två produkter — inget mer.',
    },
    {
      title: 'Byt plats på faktorerna',
      tier: 'kärna',
      body: 'Skriv båda som hundradelar: 25 · 84 / 100 och 84 · 25 / 100. Samma två tal, samma hundradel — ordningen spelar ingen roll för en produkt. Därför är x % av y ALLTID lika med y % av x.',
    },
    {
      title: 'Döm utan att räkna klart',
      tier: 'detalj',
      body: 'KVA frågar aldrig efter värdet, bara efter jämförelsen. Den som ser symmetrin är klar på fem sekunder; den som räknar ut 21 gör samma jobb två gånger. Svaret är c — och du behövde aldrig veta produkten.',
    },
  ],
  distractors: {
    a: {
      whyTempting:
        '84 är det största talet i uppgiften, och en fjärdedel av något stort känns tyngre än en hög andel av lilla 25.',
      whyWrong:
        'Känslan väger talen, inte produkterna. 25 · 84 och 84 · 25 är exakt samma multiplikation — samma värde på båda raderna. Ett stort utgångstal ger inget försprång när andelen är liten.',
    },
    b: {
      whyTempting:
        '84 % låter som nästan hela talet, medan 25 % bara är en fjärdedel. Ögat jämför procentsiffrorna och låter dem avgöra.',
      whyWrong:
        'En stor andel av ett litet tal och en liten andel av ett stort tal kan mycket väl mötas — och här möts de exakt: båda kvantiteterna är 25 · 84 hundradelar.',
    },
    d: {
      whyTempting:
        'Två olika tal, två olika procentsatser, ingen miniräknare — det känns som en uppgift man måste räkna färdigt för att våga döma.',
      whyWrong:
        'Alternativ d handlar om vad som går att avgöra, inte om vad som är jobbigt. Symmetrin x % av y = y % av x avgör jämförelsen utan en enda uträkning — informationen räcker med god marginal.',
    },
  },
  trapTags: { a: 'storlekskänsla', b: 'procentöga', d: 'falsk återvändsgränd' },
  exemplar: 'd',
  kvittoNote:
    'Samma behandling som ordfrågan — appen gör så här med varje uppgift, även de kvantitativa.',
}

/* ── question 3 — MEK (original, written for HP-Coach) ─────────────── */

export const Q3_MEK: GenContent = {
  id: 'mek-1',
  section: 'MEK',
  kicker: 'Vilket alternativ passar bäst in i meningen?',
  prompt:
    'Kritiken var hård men ____ — den gällde metoden, inte personen — och lämnade därför dörren öppen för ett ____ samtal.',
  options: [
    { key: 'a', text: 'saklig – fortsatt' },
    { key: 'b', text: 'skoningslös – avslutat' },
    { key: 'c', text: 'orättvis – hetsigt' },
    { key: 'd', text: 'mild – nytt' },
  ],
  correct: 'a',
  verdictSub: {
    ratt: 'Snyggt — rätt tänkt hela vägen.',
    fel: 'Rätt svar är a) saklig – fortsatt. Häng med i varför.',
  },
  lede: 'Saklig bryter mot hård utan att motsäga den — och en dörr som lämnas öppen leder till ett fortsatt samtal. Svaret är A.',
  steps: [
    {
      title: 'Lyssna på signalordet',
      tier: 'kärna',
      body: 'Men lovar en vändning: det som kommer efter ska bryta mot hård, inte förstärka det. Redan där faller alternativ som bara ekar första ledet med mer av samma.',
    },
    {
      title: 'Hitta rätt axel för kontrasten',
      tier: 'kärna',
      body: 'Vändningen får inte bli en motsägelse. Hård och mild mäter samma sak och krockar i samma andetag. Hård men saklig byter skala — styrkan står kvar, men tonen är renhårig. Det är så men används på riktigt.',
    },
    {
      title: 'Lås med den andra luckan',
      tier: 'detalj',
      body: 'Meningen slutar med en öppen dörr, och en öppen dörr pekar framåt: samtalet fortsätter. Bara fortsatt håller den riktningen — och då är hela raden a.',
    },
  ],
  distractors: {
    b: {
      whyTempting:
        'Skoningslös känns som ett naturligt nästa steg efter hård — hjärnan fyller gärna luckan med mer av samma.',
      whyWrong:
        'Men kräver ett brott, inte en förstärkning: hård men skoningslös säger samma sak två gånger. Och ett avslutat samtal går rakt emot dörren som lämnas öppen.',
    },
    c: {
      whyTempting:
        'Hård kritik läses lätt som orättvis kritik — orden umgås ofta i vardagsspråket, så paret känns bekant.',
      whyWrong:
        'Inskottet avgör: kritiken gällde metoden, inte personen. Det beskriver en renhårig kritik — motsatsen till orättvis. Och ett hetsigt samtal rimmar illa med en öppet lämnad dörr.',
    },
    d: {
      whyTempting:
        'Mild ger exakt den kontrast mot hård som men verkar beställa — den lättaste vändningen att ta till.',
      whyWrong:
        'Det blir en motsägelse i stället för en vändning: samma kritik kan inte vara både hård och mild. Kontrasten måste byta axel — styrka mot ton — och det är precis vad saklig gör.',
    },
  },
  trapTags: { b: 'ekofälla', c: 'vardagspar', d: 'fel axel' },
  exemplar: 'd',
  kvittoNote: 'Tredje frågan, samma ritual. Det är det här du köper.',
}

/* ── generic beat model (R3 Scenen semantics over arbitrary keys) ──── */

export type GenBeat =
  | { kind: 'utfall'; correct: boolean }
  | { kind: 'steg'; i: number }
  | { kind: 'falla'; letter: string; din: boolean; compressed: boolean }
  | { kind: 'kvitto'; correct: boolean }

/** Distractor letters in canonical (option) order. */
export function distractorLetters(c: GenContent): string[] {
  return c.options.map((o) => o.key).filter((k) => k !== c.correct)
}

/**
 * The Scenen beat sequence: UTFALL → steg → fällor (din-fälla-först on
 * a wrong pick, the exemplar leading on a correct one; the rest follow
 * compressed in canonical order) → KVITTO.
 */
export function buildGenBeats(c: GenContent, picked: string): GenBeat[] {
  const correct = picked === c.correct
  const lead = correct ? c.exemplar : picked
  const beats: GenBeat[] = [{ kind: 'utfall', correct }]
  for (let i = 0; i < c.steps.length; i++) beats.push({ kind: 'steg', i })
  beats.push({ kind: 'falla', letter: lead, din: !correct, compressed: false })
  for (const letter of distractorLetters(c)) {
    if (letter === lead) continue
    beats.push({ kind: 'falla', letter, din: false, compressed: true })
  }
  beats.push({ kind: 'kvitto', correct })
  return beats
}
