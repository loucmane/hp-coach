// LandingBakeoffR3.logic — beat model + content for the landing v3
// bake-off (P3S "Scenen" / P3B "Bläddran").
//
// CONTENT AUTHORITY: docs/superpowers/consults/landing-pedagogy-consult.md
// § 3 "Demo content — publication-ready". The vederhäftig question, its
// 3 steg, all 4 distractor autopsies, the solution lede, and the three
// margin annotations are used VERBATIM from that consult (owner-approved,
// native-passed). Original work written for HP-Coach — nothing from the
// © UHR corpus.
//
// CHOREOGRAPHY AUTHORITY: docs/superpowers/consults/landing-format-consult.md
// (format e "Scenen" + runner-up b "Bläddran") plus the owner-ratified
// v3 decisions:
//   - Scenen plays din-fälla-först: on a wrong pick the visitor's own
//     distractor autopsy leads (full, `din gissning` tag, --bad-soft
//     wash); the remaining fällor follow compressed, canonical order.
//     On a correct pick the exemplar fälla d) (the syskonord — the
//     right-variant annotation names it) leads instead, untagged.
//   - Bläddran plays product-verbatim order: UTFALL → steg → ALL fällor
//     equally (canonical order, full); the picked one is tagged in place.
//
// Pure data + hooks — no JSX here so the beat model is unit-testable.

import { useEffect, useRef } from 'react'

/* ── content (consult § 3, verbatim) ─────────────────────────────────── */

export type OptionKey = 'a' | 'b' | 'c' | 'd' | 'e'
export type DistractorLetter = 'a' | 'c' | 'd' | 'e'

/** Canonical (product reading) order of the distractors. */
export const DISTRACTOR_LETTERS: readonly DistractorLetter[] = ['a', 'c', 'd', 'e']

export interface VederhaftigContent {
  section: string
  kicker: string
  headword: string
  options: { key: OptionKey; text: string }[]
  correct: OptionKey
  /** Product-verbatim verdict subs (consult "Verdict lines"). */
  verdictSub: { ratt: string; fel: string }
  /** The bold-serif solution lede (`solution_path`). */
  lede: string
  steps: { title: string; tier: 'kärna' | 'detalj'; body: string }[]
  distractors: Record<DistractorLetter, { whyTempting: string; whyWrong: string }>
  /** The three landing-voice margin annotations (fixed, exactly three). */
  annotations: { utfall: string; steg: string; fallor: string; fallorRatt: string }
}

export const VEDERHAFTIG: VederhaftigContent = {
  section: 'ORD',
  kicker: 'Vilket ord betyder ungefär detsamma?',
  headword: 'vederhäftig',
  options: [
    { key: 'a', text: 'häftig' },
    { key: 'b', text: 'tillförlitlig' },
    { key: 'c', text: 'motsträvig' },
    { key: 'd', text: 'vedertagen' },
    { key: 'e', text: 'omständlig' },
  ],
  correct: 'b',
  verdictSub: {
    ratt: 'Snyggt — rätt tänkt hela vägen.',
    fel: 'Rätt svar är b) tillförlitlig. Häng med i varför.',
  },
  lede: 'Vederhäftig betyder pålitlig och väl underbyggd — någon eller något som håller för granskning. Svaret är B.',
  steps: [
    {
      title: 'Vad betyder vederhäftig?',
      tier: 'kärna',
      body: 'Vederhäftig beskriver någon eller något du kan lita på: en vederhäftig källa håller för granskning, en vederhäftig person står för sitt ord. Ordet kommer från äldre juridiskt språk — den som »häftade för« en skuld kunde svara för den. Kärnan är PÅLITLIGHET som tål att prövas.',
    },
    {
      title: 'Veder-familjen',
      tier: 'detalj',
      body: 'Veder- är ett gammalt förled som betyder mot eller åter: vedergälla (ge tillbaka), vedermöda (motgång), vedertagen (antagen av alla). Familjelikheten är själva fällan — orden delar förled men inte betydelse. Det är efterledet som avgör vart ordet pekar.',
    },
    {
      title: 'Välj synonymen',
      tier: 'kärna',
      body: 'Tillförlitlig (b) fångar precis det vederhäftig står för: något som går att lita på och som håller när det prövas. De andra alternativen lånar bara en yta av ordet — en ordbit, ett förled eller en stilkänsla.',
    },
  ],
  distractors: {
    a: {
      whyTempting:
        'Ögat fastnar på slutet — häftig står ju bokstavligen där inne i ordet, och hjärnan vill gärna tro att ett längre ord bara är en finare version av ett kortare.',
      whyWrong:
        'Häftig i vederhäftig kommer från häfta — att sitta fast, att stå för något — inte från häftig som i intensiv. En vederhäftig utredning är sällan särskilt häftig: den är torr, noggrann och pålitlig.',
    },
    c: {
      whyTempting:
        'Veder- är släkt med mot (jämför vedersakare, vedergälla), så det ligger nära att läsa in något trotsigt — någon som strävar emot.',
      whyWrong:
        'Förledet pekar åt rätt håll men ordet har vandrat vidare: vederhäftig kommer från juridikens »häfta för något« — att svara för sitt ord. Motsträvig är närmast en motsats: den motsträviga vägrar, den vederhäftiga levererar.',
    },
    d: {
      whyTempting:
        'Syskonordet. Vedertagen och vederhäftig ser nästan likadana ut, båda är formella, och båda beskriver saker man litar på — en vedertagen sanning, en vederhäftig källa.',
      whyWrong:
        'Vedertagen betyder allmänt accepterad — något många enats om. Vederhäftig betyder pålitlig I SIG — något som håller för granskning. En uppgift kan vara vedertagen utan att vara vederhäftig: alla tror på den, men den stämmer inte.',
    },
    e: {
      whyTempting:
        'Vederhäftiga texter är ofta långa, noggranna och fulla av förbehåll — så associationen glider lätt över i omständlig.',
      whyWrong:
        'Det beskriver stilen, inte ordet. Omständlig betyder onödigt invecklad — en brist. Vederhäftig är ett beröm: väl underbyggd och att lita på. En vederhäftig rapport kan mycket väl vara kort.',
    },
  },
  annotations: {
    utfall: 'Det här är skillnaden mot att bara rätta.',
    steg: 'Varje fråga i kursen förklaras så här — från noll, inga förkunskaper.',
    fallor: 'Kursen vet varför du gissade som du gjorde. Det är det som tränar bort fällorna.',
    fallorRatt: 'Rätt — men visste du varför d) var fel? Kursen tränar det också.',
  },
}

/**
 * Trap tags for the kvitto beat — the taxonomy comes from the consult's
 * own steg 3 ("en ordbit, ett förled eller en stilkänsla") and fälla d
 * ("syskonordet").
 */
export const TRAP_TAGS: Record<DistractorLetter, string> = {
  a: 'ordbit',
  c: 'förledsassociation',
  d: 'syskonord',
  e: 'stilkänsla',
}

/* ── beat model ──────────────────────────────────────────────────────── */

export type GenomgangMode = 'scenen' | 'bladdran'

export type Beat =
  | { kind: 'utfall'; correct: boolean }
  | { kind: 'steg'; stegIndex: 0 | 1 | 2 }
  | { kind: 'falla'; letter: DistractorLetter; dinGissning: boolean; compressed: boolean }
  | { kind: 'kvitto'; correct: boolean }

/**
 * Build the full genomgång beat sequence for a graded hero answer.
 * Both modes: UTFALL → steg 1–3 → fällor (all four, always) → KVITTO.
 */
export function buildBeats({ mode, picked }: { mode: GenomgangMode; picked: OptionKey }): Beat[] {
  const correct = picked === VEDERHAFTIG.correct
  const pickedDistractor = correct ? null : (picked as DistractorLetter)

  const beats: Beat[] = [
    { kind: 'utfall', correct },
    { kind: 'steg', stegIndex: 0 },
    { kind: 'steg', stegIndex: 1 },
    { kind: 'steg', stegIndex: 2 },
  ]

  if (mode === 'scenen') {
    // Din-fälla-först: the visitor's own trap leads (or the exemplar
    // syskonord d) on a correct pick); the rest follow compressed.
    const lead: DistractorLetter = pickedDistractor ?? 'd'
    beats.push({ kind: 'falla', letter: lead, dinGissning: !correct, compressed: false })
    for (const letter of DISTRACTOR_LETTERS) {
      if (letter === lead) continue
      beats.push({ kind: 'falla', letter, dinGissning: false, compressed: true })
    }
  } else {
    // Product-verbatim order — all fällor equal, picked tagged in place.
    for (const letter of DISTRACTOR_LETTERS) {
      beats.push({
        kind: 'falla',
        letter,
        dinGissning: letter === pickedDistractor,
        compressed: false,
      })
    }
  }

  beats.push({ kind: 'kvitto', correct })
  return beats
}

/* ── P3B takeover history contract ───────────────────────────────────── */

/**
 * Push exactly ONE marker history entry while the takeover is open, so
 * the phone back button closes the takeover instead of leaving the SPA.
 *
 *   open flips true  → pushState (same URL, marker state) — idempotent:
 *                      if the marker entry is already current (StrictMode
 *                      remount) nothing is pushed
 *   browser back     → popstate past the marker → onClose()
 *   UI close (stäng/Esc/Klart) → call `closeTakeover()` (history.back());
 *                      the resulting popstate fires onClose — ONE close
 *                      path, no cleanup-time back() (a queued back()
 *                      resolves its target at CALL time, which poisons
 *                      StrictMode's unmount/remount cycle)
 */
export function useTakeoverHistory(open: boolean, onClose: () => void): void {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const state = window.history.state as { hpcLandingTakeover?: boolean } | null
    if (!state?.hpcLandingTakeover) {
      // TanStack Router patches history.pushState and treats ANY push as
      // a navigation (which re-runs its scroll handling and yanks the
      // page). `_ignoreSubscribers` is the escape hatch the router's own
      // internals use for state-only writes — the URL doesn't change, so
      // the router has nothing to do here. The marker entry preserves
      // the router's state keys so a later pop lands on a valid entry.
      const h = window.history as History & { _ignoreSubscribers?: boolean }
      const prev = h._ignoreSubscribers
      h._ignoreSubscribers = true
      try {
        h.pushState({ ...(state ?? {}), hpcLandingTakeover: true }, '')
      } finally {
        h._ignoreSubscribers = prev
      }
    }
    const onPop = (e: PopStateEvent) => {
      // A pop that still lands on a marker entry is bookkeeping, not the
      // user leaving the takeover. Only a pop past the marker closes.
      if ((e.state as { hpcLandingTakeover?: boolean } | null)?.hpcLandingTakeover) return
      onCloseRef.current()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [open])
}

/** The takeover's single UI close path: consume the marker entry. The
 *  popstate this triggers is what actually flips the takeover closed. */
export function closeTakeover(): void {
  window.history.back()
}
