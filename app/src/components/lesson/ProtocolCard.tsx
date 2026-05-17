// ProtocolCard — renders one entry from the non-trap framework families:
//
//   - DTK tactic-catalog: tactic + when_to_apply
//   - MEK constraint-protocol: constraint_type + rule
//   - LÄS/ELF question-type protocol: question_type + attack_protocol[]
//                                     + common_distractors[]
//
// One component for all three because the visual contract is the same:
// a headword in the summary (tactic / constraint_type / question_type),
// then a rule-or-protocol body in the expanded section. The protocol
// flavour (LÄS/ELF) renders the array as a numbered ordered list; the
// rule flavour (DTK/MEK) renders prose.
//
// Same collapsed-by-default accordion as TrapCard.

import { Link } from '@tanstack/react-router'

import { MathText } from '@/components/MathText'
import { Eyebrow } from '@/components/primitives'
import type {
  ConstraintEntry,
  ProtocolEntry as ProtocolEntryType,
  TacticEntry,
} from '@/data/frameworks'
import type { Section } from '@/data/questions'

type AnyProtocolEntry = TacticEntry | ConstraintEntry | ProtocolEntryType

function isTactic(e: AnyProtocolEntry): e is TacticEntry {
  return 'tactic' in e
}
function isConstraint(e: AnyProtocolEntry): e is ConstraintEntry {
  return 'constraint_type' in e
}
function isQuestionTypeProtocol(e: AnyProtocolEntry): e is ProtocolEntryType {
  return 'question_type' in e
}

function getHeadword(entry: AnyProtocolEntry): string {
  if (isTactic(entry)) return entry.tactic
  if (isConstraint(entry)) return entry.constraint_type
  if (isQuestionTypeProtocol(entry)) return entry.question_type
  return ''
}

function getKickerLabel(entry: AnyProtocolEntry): string {
  if (isTactic(entry)) return entry.id.replace('-TACTIC-', ' · TAKTIK ')
  if (isConstraint(entry)) return entry.id.replace('-CONSTRAINT-', ' · REGEL ')
  return entry.id.replace('-TYPE-', ' · TYP ')
}

export function ProtocolCard({ entry, section }: { entry: AnyProtocolEntry; section: Section }) {
  const headword = getHeadword(entry)
  const kicker = getKickerLabel(entry)

  return (
    <details
      style={{
        paddingBlock: 'clamp(20px, 2vw + 8px, 32px)',
        borderTop: '1px solid var(--hairline)',
        maxWidth: '68ch',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
          }}
        >
          <Eyebrow>{kicker}</Eyebrow>
          <span
            aria-hidden
            className="trap-card-toggle"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
            }}
          />
        </div>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 1.4vw + 13px, 26px)',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          <MathText>{headword}</MathText>
        </h3>
      </summary>

      <div style={{ marginTop: 20 }}>
        {/* DTK tactic body: when_to_apply as prose */}
        {isTactic(entry) && <ProseBody label="När" text={entry.when_to_apply} />}

        {/* MEK constraint body: rule as prose */}
        {isConstraint(entry) && <ProseBody label="Regel" text={entry.rule} />}

        {/* LÄS/ELF protocol body: attack_protocol as ordered list,
            common_distractors as italic note */}
        {isQuestionTypeProtocol(entry) && (
          <>
            <Eyebrow>Angreppsprotokoll</Eyebrow>
            <ol
              style={{
                marginTop: 10,
                marginBottom: 0,
                paddingLeft: '1.4em',
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
                lineHeight: 1.55,
                color: 'var(--ink)',
              }}
            >
              {entry.attack_protocol.map((step) => (
                <li key={step} style={{ marginBottom: 8 }}>
                  <MathText>{step}</MathText>
                </li>
              ))}
            </ol>
            {entry.common_distractors.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <Eyebrow>Vanliga fällor</Eyebrow>
                <dl
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(14px, 0.4vw + 12px, 15px)',
                    lineHeight: 1.55,
                  }}
                >
                  {entry.common_distractors.map((d) => (
                    <div key={d.pattern} style={{ marginBottom: 14 }}>
                      <dt style={{ color: 'var(--ink)', fontWeight: 500 }}>
                        <MathText>{d.pattern}</MathText>
                      </dt>
                      <dd
                        style={{
                          marginLeft: 0,
                          marginTop: 4,
                          color: 'var(--muted)',
                          fontStyle: 'italic',
                        }}
                      >
                        <MathText>{d.why_it_traps}</MathText>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 24 }}>
          <Link
            to="/drill"
            search={{ section, framework: entry.id }}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              lineHeight: 1.4,
              color: 'var(--ink)',
              textDecoration: 'none',
              borderBottom: '1px solid var(--ink)',
              paddingBottom: 2,
            }}
          >
            Öva denna sektion →
          </Link>
        </div>
      </div>
    </details>
  )
}

function ProseBody({ label, text }: { label: string; text: string }) {
  return (
    <div
      style={{
        paddingLeft: 'clamp(16px, 1vw + 10px, 24px)',
        borderLeft: '1px solid var(--hairline)',
      }}
    >
      <Eyebrow>{label}</Eyebrow>
      <p
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.55,
          color: 'var(--ink)',
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        <MathText>{text}</MathText>
      </p>
    </div>
  )
}
