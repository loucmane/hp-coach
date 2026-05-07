// voice.jsx — coach personality string table + helpers
// Three voices for the SAME pedagogical moments. Lifted into UI via tweaks.coach.
const VOICE = {
  kompis: {
    onboardHandoff: { title: 'Vi kör en halva först. Det kommer att kännas tungt — det är meningen.', body: 'Så vet vi var vi står. Resultatet säger inget om dig som person.' },
    sectionOnboard: 'Nu kör vi KVA — kvantitativa jämförelser. Lite knepigt format, men du kommer in i det.',
    feedbackWrong: 'Du gick på en klassisk. Vi tar den igen senare.',
    feedbackRight: 'Snyggt. Vidare.',
    sessionEnd: 'Bra jobbat idag. Imorgon: ORD-repetition och lite ELF.',
    adaptive: 'Den här har dykt upp tre gånger den senaste veckan — vi tar fem minuter på den nu.',
    homeLine: 'Idag kör vi 10 min ORD · 30 min KVA · 5 min på gårdagens fel.',
    cta: 'Kör igång',
  },
  professor: {
    onboardHandoff: { title: 'Första passet är en verbal halva på cirka 160 minuter. Räkna med ett lågt resultat.', body: 'Det är diagnostiskt motiverat. Utan tidigare studier har en högre mätning inget prediktivt värde.' },
    sectionOnboard: 'Vi inleder med KVA. Observera att svaret "går ej att avgöra" kräver två motexempel.',
    feedbackWrong: 'Svaret är felaktigt. Notera mönstret innan du går vidare.',
    feedbackRight: 'Rätt. Notera även varför distraktorerna inte fungerar.',
    sessionEnd: 'Passet är avslutat. 23 frågor, 17 rätta. Imorgon: ORD-repetition samt introduktion till ELF.',
    adaptive: 'Mönstret har återkommit tre gånger på sju dagar. En kort repetition är pedagogiskt motiverad.',
    homeLine: 'Dagens program: 10 min ORD-repetition, 30 min KVA-grunder, 5 min felanalys från förra passet.',
    cta: 'Påbörja',
  },
  taktiker: {
    onboardHandoff: { title: 'Första passet är en verbal halva på cirka 160 minuter. Du kommer att klara den dåligt.', body: 'Det är poängen — du har inte pluggat än. Resultatet visar var vi börjar, inte vem du är.' },
    sectionOnboard: 'Idag börjar du med KVA — kvantitativa jämförelser.',
    feedbackWrong: 'Fel. Du känner mönstret nu. Vidare.',
    feedbackRight: 'Rätt. Vidare.',
    sessionEnd: 'Klart. 23 frågor, 17 rätta. Imorgon: ORD-repetition och ELF-grunder.',
    adaptive: 'Du har missat KVA-NEG-001 tre gånger. Vi tar fem minuter på det mönstret nu.',
    homeLine: 'Idag · 10 min ORD-repetition · 30 min KVA-grunder · 5 min på gårdagens fel.',
    cta: 'Fortsätt',
  },
};

// Tiny context so any nested screen can read the active voice without prop-drilling
const VoiceCtx = React.createContext(VOICE.taktiker);
const useVoice = () => React.useContext(VoiceCtx);

const COACH_LABELS = { kompis: 'Kompis', professor: 'Professor', taktiker: 'Taktiker' };
const COACH_BLURBS = {
  kompis: 'Vi-form. Värme. Säger inte bra-jobbat — men signalerar samhörighet.',
  professor: 'Lugn pedagog. Förklarar varför, inte bara vad. Inga utrop.',
  taktiker: 'Direkt. Strategisk. Tid är poäng. Ingen utfyllnad.',
};

// Coach attribution wrapper — renders any string from VOICE as monologue.
// `as` controls scale; `coach` is the active key (kompis/professor/taktiker).
function CoachLine({ children, coach = 'taktiker', as = 'body', style = {} }) {
  const sizes = {
    headline: { fontSize: 32, lineHeight: 1.15 },
    title:    { fontSize: 22, lineHeight: 1.2 },
    body:     { fontSize: 17, lineHeight: 1.5 },
    small:    { fontSize: 14, lineHeight: 1.5 },
  };
  const s = sizes[as] || sizes.body;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      borderLeft: '1.5px solid var(--accent)',
      paddingLeft: 14,
      ...style,
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 'var(--font-display-w)',
        letterSpacing: 'var(--font-display-track)', textWrap: 'pretty',
        color: 'var(--ink)',
        ...s,
      }}>{children}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10.5,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: 'var(--muted)',
      }}>— Coach · {COACH_LABELS[coach] || coach}</div>
    </div>
  );
}

Object.assign(window, { VOICE, VoiceCtx, useVoice, CoachLine, COACH_LABELS, COACH_BLURBS });
