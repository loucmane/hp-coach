// NOG apparatus parser — splits a NOG question's flat prompt string into its
// question stem + the two sufficiency statements (and the canonical tail).
//
// Extracted from the drill variants so DrillQuestion (Boksidan rail chassis),
// StudyDesk, and StyleA all parse the apparatus the same way instead of each
// re-implementing it.
//
// The statement markers are private-use sentinels the parser emits around the
// "(1)" / "(2)" labels: U+E000 … U+E001. They MUST stay as \uXXXX escapes —
// the editor harness silently strips literal PUA chars from written files.
// Both marker forms appear in the corpus depending on parser vintage. Returns
// null when the prompt doesn't split cleanly into 3 parts (markers missing or
// extra) — callers fall back to inline prose.
const NOG_MARKER = /[]?\(\s*_?\{?[12]\}?\s*[]?\s*\)\s*\t?/g

// "Tillräcklig information för lösningen erhålls" is the canonical tail that
// grammatically links to the option list. Pulled out of statement II so it
// renders as a separate apparatus caption rather than running into the
// statement prose.
const NOG_TAIL = /\s*Tillräcklig information för lösningen erhålls\s*$/

export type NogParts = {
  question: string
  statement1: string
  statement2: string
  tail: string | null
}

export function parseNogPrompt(prompt: string): NogParts | null {
  const parts = prompt.split(NOG_MARKER)
  if (parts.length !== 3) return null
  const question = parts[0].trim()
  const statement1 = parts[1].trim()
  let statement2 = parts[2].trim()
  let tail: string | null = null
  const tailMatch = statement2.match(NOG_TAIL)
  if (tailMatch) {
    tail = tailMatch[0].trim()
    statement2 = statement2.slice(0, tailMatch.index).trim()
  }
  if (!question || !statement1 || !statement2) return null
  return { question, statement1, statement2, tail }
}
