// HP-Coach coach personality voice. Three voices for the same pedagogical
// moments. Selected via tweaks.coach; lifted into UI through a tiny context.
//
// Ported from the Claude Design prototype (voice.jsx). Swedish strings reviewed
// for idiomaticity in the design chat — do not lightly rewrite.

export type CoachKey = 'kompis' | 'professor' | 'taktiker'

export type CoachVoice = {
  onboardHandoff: { title: string; body: string }
  sectionOnboard: string
  feedbackWrong: string
  feedbackRight: string
  sessionEnd: string
  adaptive: string
  homeLine: string
  cta: string
}

export const VOICE: Record<CoachKey, CoachVoice> = {
  kompis: {
    onboardHandoff: {
      title: 'Vi kör en halva först. Det kommer att kännas tungt — det är meningen.',
      body: 'Så vet vi var vi står. Resultatet säger inget om dig som person.',
    },
    sectionOnboard:
      'Nu kör vi KVA — kvantitativa jämförelser. Lite knepigt format, men du kommer in i det.',
    feedbackWrong: 'Du gick på en klassisk. Vi tar den igen senare.',
    feedbackRight: 'Snyggt. Vidare.',
    sessionEnd: 'Bra jobbat idag. Imorgon: ORD-repetition och lite ELF.',
    adaptive: 'Den här har dykt upp tre gånger den senaste veckan — vi tar fem minuter på den nu.',
    homeLine: 'Idag kör vi 10 min ORD · 30 min KVA · 5 min på gårdagens fel.',
    cta: 'Kör igång',
  },
  professor: {
    onboardHandoff: {
      title: 'Första passet är en verbal halva på cirka 160 minuter. Räkna med ett lågt resultat.',
      body: 'Det är diagnostiskt motiverat. Utan tidigare studier har en högre mätning inget prediktivt värde.',
    },
    sectionOnboard:
      'Vi inleder med KVA. Observera att svaret "går ej att avgöra" kräver två motexempel.',
    feedbackWrong: 'Svaret är felaktigt. Notera mönstret innan du går vidare.',
    feedbackRight: 'Rätt. Notera även varför distraktorerna inte fungerar.',
    sessionEnd:
      'Passet är avslutat. 23 frågor, 17 rätta. Imorgon: ORD-repetition samt introduktion till ELF.',
    adaptive:
      'Mönstret har återkommit tre gånger på sju dagar. En kort repetition är pedagogiskt motiverad.',
    homeLine:
      'Dagens program: 10 min ORD-repetition, 30 min KVA-grunder, 5 min felanalys från förra passet.',
    cta: 'Påbörja',
  },
  taktiker: {
    onboardHandoff: {
      title:
        'Första passet är en verbal halva på cirka 160 minuter. Du kommer att klara den dåligt.',
      body: 'Det är poängen — du har inte pluggat än. Resultatet visar var vi börjar, inte vem du är.',
    },
    sectionOnboard: 'Idag börjar du med KVA — kvantitativa jämförelser.',
    feedbackWrong: 'Fel. Du känner mönstret nu. Vidare.',
    feedbackRight: 'Rätt. Vidare.',
    sessionEnd: 'Klart. 23 frågor, 17 rätta. Imorgon: ORD-repetition och ELF-grunder.',
    adaptive: 'Du har missat KVA-NEG-001 tre gånger. Vi tar fem minuter på det mönstret nu.',
    homeLine: 'Idag · 10 min ORD-repetition · 30 min KVA-grunder · 5 min på gårdagens fel.',
    cta: 'Fortsätt',
  },
}

export const COACH_LABELS: Record<CoachKey, string> = {
  kompis: 'Kompis',
  professor: 'Professor',
  taktiker: 'Taktiker',
}

export const COACH_BLURBS: Record<CoachKey, string> = {
  kompis: 'Vi-form. Värme. Säger inte bra-jobbat — men signalerar samhörighet.',
  professor: 'Lugn pedagog. Förklarar varför, inte bara vad. Inga utrop.',
  taktiker: 'Direkt. Strategisk. Tid är poäng. Ingen utfyllnad.',
}
