// Named-tactic coaching notes for the pre-grade right column.
//
// Each section family has 3–4 named strategies. The student sees a
// rotating tactic-handle + 1-line move while reading the question,
// builds tactical vocabulary across drills, and the same handles
// resurface as the `technique` field in post-grade Variant-C
// explanations — closing the learn → recognize → name → re-apply
// loop the PRD's three-layer architecture is meant to create.
//
// Selection: deterministic hash of the qid → modulo tactic count.
// Same qid always picks the same tactic (so the user can revisit
// a question and see the same hint), but across a 10-question drill
// the user sees varied tactic-handles. No state, no RNG.
//
// Voice: imperative, named-strategy first, then the move. Calm
// coaching register, same as Variant C explanations.

import type { Section } from '@/data/questions'

export type Tactic = {
  /** The named strategy ("handle"). Capitalised noun phrase. Becomes
   *  the visual hook the student starts recognising across questions. */
  handle: string
  /** 1-line description of the move. When to use it and what it does.
   *  Aim for 12-20 words; long enough to be useful, short enough to
   *  scan during reading time. */
  move: string
}

const TACTICS: Record<Section, Tactic[]> = {
  KVA: [
    {
      handle: 'Extremvärdestestet',
      move: 'Pröva 0, 1, stora tal och lika stora värden innan du räknar. Jämförelsen avgörs ofta redan där.',
    },
    {
      handle: 'Substitutionsstrategin',
      move: 'När frågan ger ett villkor (b = a + 1), byt ut variabeln överallt så att uttrycken bara har en variabel kvar.',
    },
    {
      handle: 'Förenklingsleken',
      move: 'Multiplicera ut, faktorisera eller utveckla en kvadrat. Identiska uttryck efter förenkling betyder lika.',
    },
    {
      handle: 'Konstantkvittot',
      move: 'Om båda uttrycken bara skiljer i en additiv konstant räcker det att jämföra konstanterna — strunta i resten.',
    },
  ],
  XYZ: [
    {
      handle: 'Variabeldefinitionen',
      move: 'Skriv ut vad x faktiskt står för innan du löser. Hälften av felen sitter i att svaret inte är x utan 2x + 5.',
    },
    {
      handle: 'Ekvationskedjan',
      move: 'Översätt en sats i taget till en ekvation. Lös sedan från botten upp — det blir nästan alltid två steg.',
    },
    {
      handle: 'Tillbakaräkningen',
      move: 'Om x bara dyker upp en gång, eller alternativen är symmetriska — stoppa in alternativen direkt istället för att lösa.',
    },
    {
      handle: 'Enhetskollen',
      move: 'Kvadratmeter, procent, kronor/styck? Glöm inte stoppa in enheten på sista raden — fel enhet är fel svar.',
    },
  ],
  NOG: [
    {
      handle: '(1)-och-(2)-rutinen',
      move: 'Pröva villkor 1 ensamt. Sedan villkor 2 ensamt. Sedan båda. Aldrig i någon annan ordning.',
    },
    {
      handle: 'Entydighetsfrågan',
      move: 'Räcker det att svaret går att beräkna, eller måste det vara unikt? Det är skillnaden mellan "tillräckligt" och "kan räknas".',
    },
    {
      handle: 'Motexempelmetoden',
      move: 'Hitta två scenarier som båda uppfyller villkoret men ger olika svar. Då räcker villkoret inte.',
    },
    {
      handle: 'Variabelräkningen',
      move: 'Antal okända vs. antal oberoende villkor. Färre villkor än okända betyder oftast otillräckligt — men inte alltid.',
    },
  ],
  DTK: [
    {
      handle: 'Cellpekfingret',
      move: 'Hitta exakt rad och kolumn frågan adresserar innan du räknar. Cellfel kostar mer än räknefel.',
    },
    {
      handle: 'Skalan-först',
      move: 'Vilken enhet? Procent, kronor, miljoner, hundratusen? Skalfel ger svar som är 1000× fel.',
    },
    {
      handle: 'Subtraktionen-sist',
      move: 'Om frågan vill ha skillnaden mellan två tal — läs båda först, subtrahera på sista raden.',
    },
    {
      handle: 'Storleksordningen',
      move: 'Innan räkning: är svaret ~10, ~100, ~1000? Stryk alternativ som inte ligger i rätt storleksordning.',
    },
  ],
  MEK: [
    {
      handle: 'Helhetsläsningen',
      move: 'Läs hela meningen utan luckorna först. Hör tonen och poängen innan du ger dig på orden.',
    },
    {
      handle: 'Kollokationskontrollen',
      move: '"Göra ett misstag", inte "ett fel". Vissa ord sitter ihop oavsett logik — testa svenskheten i frasen.',
    },
    {
      handle: 'Registermatchen',
      move: 'Är resten av meningen akademisk-formell ska luckorna vara det också. Stilbrott avslöjar fel alternativ.',
    },
    {
      handle: 'Logikfingret',
      move: 'Pek ut varje lucka i tur och ordning. Vilka två luckor syftar på samma sak? Det binder oftast valet.',
    },
  ],
  LÄS: [
    {
      handle: 'Eko-jakten',
      move: 'Hitta påståendets exakta eko i texten — inte "samma idé", utan samma formulering eller direkt parallell.',
    },
    {
      handle: 'Stycke-pekfingret',
      move: 'Hitta det specifika stycket frågan handlar om. Läs det noggrant, hoppa över resten.',
    },
    {
      handle: 'Ny-info-fällan',
      move: 'Alternativ som lägger till information utan textstöd är aldrig rätt, även om de "låter rimliga".',
    },
    {
      handle: 'Författarhållningen',
      move: 'Beundrar / kritiserar / refererar texten det den nämner? Ton skiljer ofta de två sista alternativen.',
    },
  ],
  ELF: [
    {
      handle: 'Skim-then-locate',
      move: 'Skim the gist in 30 seconds, then locate the exact phrase the question asks about. No deep reading on the first pass.',
    },
    {
      handle: 'Word-match trap',
      move: 'Options that recycle words from the passage but shift the meaning are the most tempting wrong answers.',
    },
    {
      handle: 'Tone detector',
      move: 'Does the passage admire / critique / merely describe? Tone separates the two most plausible options.',
    },
    {
      handle: 'Extreme paraphrase',
      move: '"Always", "never", "only", "must" rarely survive the actual passage. Watch for them in distractors.',
    },
  ],
  ORD: [
    {
      handle: 'Stamordskartan',
      move: 'Bryt ner ordet i bekanta delar — latin, grek, sammansättning. Hälften av valet görs av etymologin.',
    },
    {
      handle: 'Registerkontrollen',
      move: 'Är headword formellt eller vardagligt? Välj alternativet som rimmar i ton, inte bara i betydelse.',
    },
    {
      handle: 'Konnotationsfingret',
      move: 'Positiv, neutral eller negativ laddning? Det avgör de två sista alternativen oftare än betydelsenyansen.',
    },
    {
      handle: 'Ljudfällan',
      move: 'Alternativ som rimmar med headword (induktion / inkarnation) testar om du kan betydelsen eller bara känner igen formen.',
    },
  ],
}

/** Deterministic 32-bit hash (FNV-1a). Same qid → same hash forever,
 *  so a question always shows the same tactic. We just need uniform
 *  modulo distribution across the catalog. */
function hashQid(qid: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < qid.length; i++) {
    h ^= qid.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** Pick the tactic for a given qid + section. Deterministic — same
 *  inputs always produce the same output, no React state needed. */
export function pickTactic(qid: string, section: Section): Tactic {
  const catalog = TACTICS[section]
  const idx = hashQid(qid) % catalog.length
  return catalog[idx]
}
