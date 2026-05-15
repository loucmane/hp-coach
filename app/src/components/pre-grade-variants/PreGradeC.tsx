// Variant C — Apparatus criticus
//
// Editorial register: the page apparatus of a critical edition.
// Year + half + section + qid + running position, set in mono
// definition-list style. Zero content burden (everything derived
// from the qid + a position counter); reads as deliberate and gives
// the student useful in-flow context (where am I in the session, how
// far through, what's this question's address).
//
// Voice: typographic, not coaching. The intentional refusal to fill
// the column with prose IS the move.

import type { Section } from '@/data/questions'

const SECTION_NAMES: Record<Section, string> = {
  KVA: 'kvantitativ jämförelse',
  XYZ: 'algebra & aritmetik',
  NOG: 'tillräcklig information',
  DTK: 'diagram / tabell / karta',
  MEK: 'meningskomplettering',
  LÄS: 'svensk läsförståelse',
  ELF: 'engelsk läsförståelse',
  ORD: 'ordförståelse',
}

type ApparatusProps = {
  qid: string
  section: Section
  position: number // 1-indexed in the session plan
  total: number
}

export function PreGradeC({ qid, section, position, total }: ApparatusProps) {
  // qid format: <exam>-<provpass>-<section>-<number>
  // exam: e.g. 'host-2013' or 'var-2018-1'
  // provpass: 'kvant1' | 'kvant2' | 'verb1' | 'verb2'
  const parts = qid.split('-')
  const sectionIdx = parts.indexOf(section)
  const exam = parts.slice(0, sectionIdx - 1).join('-')
  const provpass = parts[sectionIdx - 1]
  const half = provpass?.startsWith('kvant')
    ? 'II · kvantitativ'
    : provpass?.startsWith('verb')
      ? 'I · verbal'
      : '?'

  return (
    <div style={{ paddingTop: 'clamp(28px, 4vh, 48px)', maxWidth: '52ch' }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          marginBottom: 24,
        }}
      >
        Apparatus
      </div>
      <dl
        style={{
          margin: 0,
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 10ch) 1fr',
          columnGap: 20,
          rowGap: 12,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          color: 'var(--ink-2)',
        }}
      >
        <Term label="Edition" value={exam} />
        <Term label="Half" value={half} />
        <Term label="Section" value={`${section} · ${SECTION_NAMES[section]}`} />
        <Term label="Position" value={`${position} / ${total}`} />
        <Term label="Qid" value={qid} mono />
      </dl>
      <hr
        style={{
          margin: '32px 0 16px',
          border: 0,
          borderTop: '1px solid var(--hairline)',
          maxWidth: '6em',
        }}
      />
      <p
        style={{
          margin: 0,
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--muted)',
          fontStyle: 'italic',
        }}
      >
        Förklaring följer efter grade.
      </p>
    </div>
  )
}

function Term({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <>
      <dt
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          alignSelf: 'baseline',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
          fontSize: mono ? 12 : 14,
          color: 'var(--ink-2)',
          wordBreak: 'break-all',
        }}
      >
        {value}
      </dd>
    </>
  )
}
