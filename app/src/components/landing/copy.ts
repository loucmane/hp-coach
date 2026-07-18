// Landing copy — the public page's Swedish product strings.
//
// Owner-ratified in the landing bake-off (V5A "Frågan under datumet" +
// facit graft; native-Swedish pass logged in the bake-off .notes files).
// Copied verbatim from the winning bake-off strings — change only with
// owner sign-off.
//
// LEGAL: every demo question the landing shows is ORIGINAL, written for
// HP-Coach in authentic HP style. Nothing from the © UHR corpus; each
// question is labeled as an example on the page itself.

export const COPY = {
  brand: 'HP-Coach',
  domain: 'hp-coach.se',
  tagline: 'inför högskoleprovet',
  claims: {
    zero: {
      label: 'Börjar från noll',
      text: 'Kursen förutsätter inga förkunskaper. Ordrötter före ordlistor, mönster före formler — allt byggs från grunden.',
    },
    target: {
      label: 'Siktet är 2.0',
      text: 'Appen mäter varje delprov för sig och visar exakt var nästa tiondel finns. Du övar alltid på det som lyfter poängen mest.',
    },
    adhd: {
      label: 'En sak i taget',
      text: 'Appen väljer nästa uppgift åt dig. Ett pass tar tio minuter, och det är alltid tydligt var du ska börja.',
    },
    loop: {
      label: 'Felen är läroplanen',
      text: 'Varje fel matchas mot en känd fälla och läggs i din repetitionskö. Du övar på rätt saker — inte på måfå.',
    },
  },
  revealLabel: 'Det där var appen',
  // TODO(owner): accountability line — fill in namn + org.nr before launch.
  human: 'HP-Coach drivs av [namn] · org.nr [—]',
  // TODO(owner): price placeholder — decision D2 (pricing) is undecided;
  // 'X kr' ships deliberately until the owner sets the number.
  priceX: 'X kr',
  priceTerms: 'engångsköp · gäller till provdagen',
  priceFolio: 'priset sätts före lansering',
  priceAnchor:
    'Anmälan till provet kostar 550 kr. Förberedelsen ska vara ett köp — inte en prenumeration.',
  cta: 'Skapa konto',
  ctaSub: 'Konto → betalning → första passet. Inga val på vägen.',
  exampleTag: 'Exempeluppgift skriven för HP-Coach — inte hämtad från något prov.',
}

/* ── the hero facit — an invented answer-key PATTERN (not from any exam),
 *    one line: V5C's two-row strip compressed for the title page ──────── */

export const FACIT_ROW = '21 C   22 A   23 E   24 B'

/* ── the schedule ledger — what each question is called once booked ───── */

export interface SchedEntry {
  id: string
  label: string
  ok: boolean
  /** Trap tag for a wrong pick; null on a correct answer. */
  tag: string | null
}

/** The repetition cadence the page prints for a booked mistake. */
export const SCHED_CADENCE = 'i morgon · om tre dagar · veckan före provet'
