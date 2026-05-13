// KVA prompt layout — three-row composition matching the original PDF.
//
// KVA (Kvantitativa jämförelser) questions canonically have three
// parts:
//
//   condition (optional)        e.g. "b = a + 1"
//   Kvantitet I:    <quantity 1>
//   Kvantitet II:   <quantity 2>
//
// The parser collapses all three onto a single line with TAB
// (U+0009) separators, which the SPA renders as collapsed whitespace
// — the structure disappears and the prompt reads as a run-on
// sentence ("b = a + 1 Kvantitet I:   ab – 2a²   Kvantitet II:
// a(b – 2a)"). That's how the corpus has shipped since the original
// parse, but it makes KVA the hardest section to read.
//
// This component rescues the structure at render time: split the
// prompt on the literal "Kvantitet I:" / "Kvantitet II:" markers
// (513 of 540 KVA prompts contain both — see corpus sweep) and lay
// the three components out as discrete rows. Falls back to the
// raw single-line render for the ~5% that don't split cleanly.

import { MathText } from '@/components/MathText'

type Split = {
  condition: string
  kvI: string
  kvII: string
}

/** Returns the three KVA components if the prompt parses, else null. */
export function splitKvaPrompt(prompt: string): Split | null {
  // The markers are case-stable across the corpus; `Kvantitet I:` and
  // `Kvantitet II:` appear in every well-formed KVA prompt. Using a
  // string-search (not regex) so the U+E000/E001 KaTeX delimiters in
  // the surrounding math don't trip a regex engine.
  const iIdx = prompt.indexOf('Kvantitet I:')
  if (iIdx === -1) return null
  // Find Kvantitet II strictly after Kvantitet I, otherwise we'd
  // match the same "Kvantitet I" prefix inside "Kvantitet II".
  const iiIdx = prompt.indexOf('Kvantitet II:', iIdx + 'Kvantitet I:'.length)
  if (iiIdx === -1) return null
  const condition = prompt.slice(0, iIdx).trim()
  // Trim surrounding whitespace including the literal TAB (U+0009) the
  // quant parser emits where the PDF had a column separator; \s alone
  // covers TAB but biome flags inline TABs in regex literals as
  // suspicious — using \s keeps lint happy.
  const kvI = prompt.slice(iIdx + 'Kvantitet I:'.length, iiIdx).trim()
  const kvII = prompt.slice(iiIdx + 'Kvantitet II:'.length).trim()
  // Require both quantities to be non-empty — if either is missing the
  // parser produced something we can't safely lay out, fall back.
  if (!kvI || !kvII) return null
  return { condition, kvI, kvII }
}

type Props = {
  prompt: string
}

export function KvaPrompt({ prompt }: Props) {
  const split = splitKvaPrompt(prompt)
  if (!split) {
    // Graceful fallback for the ~5% that don't split — render as the
    // raw prompt at body weight (the DrillQuestion caller has already
    // sized us at display scale, so we just emit text + math here).
    return <MathText>{prompt}</MathText>
  }
  const { condition, kvI, kvII } = split
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'clamp(14px, 1.5vw + 6px, 24px)',
      }}
    >
      {condition && (
        <div
          data-testid="kva-condition"
          style={{
            // The condition (e.g. "b = a + 1") is the framing of the
            // problem; smaller than the quantities themselves but
            // still display-weight serif so it reads as part of the
            // composition, not a label.
            fontSize: 'clamp(18px, 1.125rem + 0.5vw, 28px)',
            lineHeight: 1.3,
            color: 'var(--ink-2, var(--ink))',
            fontWeight: 400,
          }}
        >
          <MathText>{condition}</MathText>
        </div>
      )}
      <Quantity label="Kvantitet I" body={kvI} testId="kva-i" />
      <Quantity label="Kvantitet II" body={kvII} testId="kva-ii" />
    </div>
  )
}

type QuantityProps = {
  label: string
  body: string
  testId: string
}

function Quantity({ label, body, testId }: QuantityProps) {
  // The label sits as a small-caps mono eyebrow (matches the section
  // masthead language elsewhere); the body is display-weight serif
  // at the size the caller has set for the prompt container. That
  // keeps the visual hierarchy: section masthead → KVA condition →
  // Kvantitet labels → quantities → options.
  return (
    <div
      data-testid={testId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: 'var(--font-mono-track)',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div
        style={{
          // Inherit fontFamily / fontSize from the parent prompt
          // container so the quantity reads at the same display
          // weight as a non-KVA prompt — but lineHeight tightens so
          // a wrapping fraction doesn't push neighbours around.
          lineHeight: 1.25,
        }}
      >
        <MathText>{body}</MathText>
      </div>
    </div>
  )
}
