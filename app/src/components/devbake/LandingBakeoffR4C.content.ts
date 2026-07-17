// LandingBakeoffR4C.content — original genomgång content for the v4C
// landing ("Tidslinjen"). Two NEW demo questions (KVA + MEK), each with
// the full vederhäftig-grade structure: verdict variants, 3 steg with
// kärna/detalj tiers, per-distractor fällor (varför det lockar / varför
// det är fel), trap tags for the kvitto beat.
//
// LEGAL: everything here is ORIGINAL work written for HP-Coach in
// authentic HP style — nothing from the © UHR corpus. Both questions are
// labeled "Exempeluppgift skriven för HP-Coach" on the page.
//
// VOICE AUTHORITY: docs/superpowers/consults/landing-pedagogy-consult.md
// § 3 — du-tilt, concrete micro-scenes, sparing CAPS emphasis, »…«
// quoting, 40–60 words per steg, 30–45 per distractor field.
//
// ENGINE COMPAT: both questions are deliberately authored with correct
// answer `b` and distractor letters within {a, c, d} so the R3 beat
// engine (`buildBeats`, which is bound to VEDERHÄFTIG's letter space
// a/c/d/e) can be REUSED unmodified — the page filters out the `e` beat
// for four-option questions. See LandingBakeoffR4C.tsx.

import type { DistractorLetter, OptionKey } from './LandingBakeoffR3.logic'
import { DISTRACTOR_LETTERS, TRAP_TAGS, VEDERHAFTIG } from './LandingBakeoffR3.logic'

/* ── the generic content shape (superset of R3's ORD-only shape) ──────── */

export interface R4CQuestion {
  id: string
  section: string
  kicker: string
  /** ORD sets a headword; KVA/MEK set a prompt (pre-line). */
  headword?: string
  prompt?: string
  options: { key: OptionKey; text: string }[]
  /** Always 'b' — see the ENGINE COMPAT note above. */
  correct: OptionKey
  verdictSub: { ratt: string; fel: string }
  lede: string
  steps: { title: string; tier: 'kärna' | 'detalj'; body: string }[]
  distractors: Partial<Record<DistractorLetter, { whyTempting: string; whyWrong: string }>>
  trapTags: Partial<Record<DistractorLetter, string>>
  /** The distractor letters that actually exist on this question. */
  letters: readonly DistractorLetter[]
  /** Short name for the schedule ledger ("vad som bokförs"). */
  schedLabel: string
}

/* ── uppgift 1 — the hero: vederhäftig, VERBATIM from R3 ──────────────── */

export const Q1_ORD: R4CQuestion = {
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
  letters: DISTRACTOR_LETTERS,
  schedLabel: 'vederhäftig',
}

/* ── uppgift 2 — KVA (original, written for this page) ────────────────── */

export const Q2_KVA: R4CQuestion = {
  id: 'kva-1',
  section: 'KVA',
  kicker: 'Vilken kvantitet är störst?',
  prompt: 'Kvantitet I:  5/8 av 112\nKvantitet II:  3/5 av 120',
  options: [
    { key: 'a', text: 'I är större än II' },
    { key: 'b', text: 'II är större än I' },
    { key: 'c', text: 'I är lika med II' },
    { key: 'd', text: 'informationen är otillräcklig' },
  ],
  correct: 'b',
  verdictSub: {
    ratt: 'Snyggt — räknat, inte gissat.',
    fel: 'Rätt svar är b) — kvantitet II är större. Häng med i varför.',
  },
  lede: 'Kvantitet I är 70 och kvantitet II är 72 — räknat, inte känt. Svaret är B.',
  steps: [
    {
      title: 'Räkna ut kvantitet I',
      tier: 'kärna',
      body: 'Fem åttondelar av 112: dela först, multiplicera sedan. 112 delat på 8 är 14, och 5 gånger 14 är 70. Ta alltid vägen genom divisionen — KVA-talen är valda för att gå jämnt ut.',
    },
    {
      title: 'Räkna ut kvantitet II',
      tier: 'kärna',
      body: 'Tre femtedelar av 120: 120 delat på 5 är 24, och 3 gånger 24 är 72. Två rader räkning per kvantitet — mer behöver aldrig hända innan du jämför.',
    },
    {
      title: 'Jämför siffror, inte känslor',
      tier: 'detalj',
      body: 'Sjuttio mot sjuttiotvå: kvantitet II är större. Lägg märke till hur nära det ligger — uppgiften är byggd för att magkänslan ska ta över där räkningen skulle avgöra. Kan båda kvantiteterna räknas ut är svaret aldrig en känslofråga.',
    },
  ],
  distractors: {
    a: {
      whyTempting:
        '5/8 ser större ut än 3/5 — större täljare, större nämnare, närmare ett helt. Den som jämför bråken och glömmer talen bakom dem stannar här.',
      whyWrong:
        'Andelen är bara halva kvantiteten. 5/8 är mycket riktigt mer än 3/5, men 112 är mindre än 120 — och här väger den skillnaden tyngre. Räknat: 70 mot 72.',
    },
    c: {
      whyTempting:
        'Uppgiften ser balanserad ut: en större andel av ett mindre tal mot en mindre andel av ett större. Precis så ser kvittningsuppgifter ut när de faktiskt går jämnt upp.',
      whyWrong:
        'Balansen är nästan perfekt — men »nästan« är fel svarsalternativ. 70 och 72 skiljer sig med två. KVA lägger ofta svaren tätt ihop just för att ungefär-lika ska kännas tryggt.',
    },
    d: {
      whyTempting:
        'Alternativ d) är KVA-vanans nödutgång: när något känns ounderbyggt räddar det dig. Bråkdelar av två olika tal kan se ut som ett sådant läge.',
      whyWrong:
        'd) är rätt när information faktiskt saknas — okända variabler, villkor som lämnar flera möjligheter öppna. Här står två färdiga tal i klartext. Allt som går att räkna ut är per definition tillräcklig information.',
    },
  },
  trapTags: { a: 'bråkjämförelse', c: 'nästan-lika', d: 'd-reflexen' },
  letters: ['a', 'c', 'd'],
  schedLabel: 'kvantitet I mot II',
}

/* ── uppgift 3 — MEK (original, written for this page) ────────────────── */

export const Q3_MEK: R4CQuestion = {
  id: 'mek-1',
  section: 'MEK',
  kicker: 'Vilket alternativ passar bäst in i meningen?',
  prompt:
    'Kritiken mot förslaget var ____: remissinstanserna avstyrkte det inte bara, de ____ själva grundtanken.',
  options: [
    { key: 'a', text: 'väntad – förbigick' },
    { key: 'b', text: 'förödande – underkände' },
    { key: 'c', text: 'splittrad – bejakade' },
    { key: 'd', text: 'återhållsam – prisade' },
  ],
  correct: 'b',
  verdictSub: {
    ratt: 'Snyggt — båda luckorna på plats.',
    fel: 'Rätt svar är b) förödande – underkände. Häng med i varför.',
  },
  lede: 'Meningen är en trappa: »avstyrkte det inte bara, de ____« kräver ett andra led som är starkare än avstyrkte — och en förstalucka som sammanfattar den styrkan. Svaret är B.',
  steps: [
    {
      title: 'Hitta meningens skelett',
      tier: 'kärna',
      body: 'Stryk allt utom bindeorden: »kritiken var ____: de avstyrkte inte bara, de ____«. Konstruktionen »inte bara X, de Y« är en trappa — Y måste ta i MER än X. Grammatiken gör halva jobbet innan ordförrådet ens behövs.',
    },
    {
      title: 'Pröva andra luckan först',
      tier: 'kärna',
      body: 'Avstyrkte är redan hårt, så steget uppåt måste vara hårdare. Underkände (b) fungerar. Prisade (d) och bejakade (c) pekar åt motsatt håll, och förbigick (a) är svagare — att gå förbi något är mindre än att avstyrka det.',
    },
    {
      title: 'Låt första luckan bekräfta',
      tier: 'detalj',
      body: 'När andra ledet är underkände ska första ordet sammanfatta kritik i samma register: förödande. Läs hela meningen med b) insatt en sista gång — ett MEK-svar ska klicka i båda luckorna, inte bara i en.',
    },
  ],
  distractors: {
    a: {
      whyTempting:
        'Väntad glider förbi — kritik mot förslag är ofta väntad, och förbigick låter lagom formellt för att inte väcka misstanke. Båda orden känns hemma i meningen var för sig.',
      whyWrong:
        'Trappan kräver upptrappning: att förbigå grundtanken är MINDRE än att avstyrka förslaget. »Inte bara X, de Y« med ett svagare Y låter fel så fort du läser meningen högt.',
    },
    c: {
      whyTempting:
        'Remissrundor ÄR ofta splittrade, så första ordet känns sant om verkligheten. Den som prövar en lucka i taget och nöjer sig där hinner aldrig till verbet.',
      whyWrong:
        'Men meningen beskriver ingen splittring — alla avstyrkte. Och att bejaka grundtanken är motsatsen till att underkänna den. Sant om världen är inte samma sak som rätt i meningen.',
    },
    d: {
      whyTempting:
        'Återhållsam är ett typiskt remissord — myndighetsprosa låter ofta precis så, och ögat köper stilkänslan innan det hunnit läsa meningen klart.',
      whyWrong:
        'Meningen säger själv emot det: den som avstyrker och därtill gör något MER är inte återhållsam — och prisade vänder trappan upp och ner. Båda luckorna faller på samma faktum.',
    },
  },
  trapTags: { a: 'svagt andraled', c: 'sant-om-världen', d: 'stilkänsla' },
  letters: ['a', 'c', 'd'],
  schedLabel: 'luckparet',
}

/* ── provdagen — the page's destination ───────────────────────────────── */

/** Next HP sitting (hösten 2026). Placeholder-precision is fine for the
 *  bake-off; the real launch reads this from config. */
export const PROV_DATE = new Date(2026, 9, 18) // 18 oktober 2026
export const PROV_DATE_LABEL = 'söndag 18 oktober'
export const PROV_DATE_SHORT = '18 okt'

/** Whole days from `now` until provdagen, never negative. */
export function daysUntilProv(now: Date = new Date()): number {
  const ms = PROV_DATE.getTime() - now.getTime()
  return Math.max(0, Math.ceil(ms / 86_400_000))
}

/* ── the schedule ledger (the signature moment's bookkeeping) ─────────── */

export interface SchedEntry {
  id: string
  label: string
  ok: boolean
  /** Trap tag for a wrong pick; null on a correct answer. */
  tag: string | null
}

/** The repetition cadence the page prints for a booked mistake. */
export const SCHED_CADENCE = 'i morgon · om tre dagar · veckan före provet'
