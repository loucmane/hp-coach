import { useEffect, useState } from 'react'

import { Mono } from '@/components/primitives'
import { loadProvteknik, type ProvteknikChapter } from '@/data/frameworks'
import { UHR_DELPROV, UHR_ORDER, uhrTimeMs } from '@/lib/uhrPacing'

import { ProvteknikCard } from './ProvteknikCard'

// Both standard pass types have the same total; derive it from the shared
// recommendations rather than introducing a second timing source.
const PASS_MINUTES = UHR_ORDER.slice(0, 4).reduce((sum, s) => sum + UHR_DELPROV[s].minutes, 0)

/** A reading surface only. It deliberately mounts no lesson progress hooks. */
export function ProvteknikReader() {
  const [chapter, setChapter] = useState<ProvteknikChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    loadProvteknik()
      .then((data) => {
        if (!alive) return
        setChapter(data)
        setLoading(false)
      })
      .catch(() => {
        if (!alive) return
        setFailed(true)
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div
      style={{
        flex: 1,
        width: '100%',
        maxWidth: 'calc(68ch + 2 * clamp(20px, 4vw + 12px, 56px))',
        marginInline: 'auto',
        paddingInline: 'clamp(20px, 4vw + 12px, 56px)',
        paddingTop: 'clamp(32px, 4vw + 16px, 64px)',
        paddingBottom: 'clamp(48px, 6vw, 96px)',
      }}
    >
      <header style={{ marginBottom: 32 }}>
        <Mono>UPPSLAG · ALLA DELPROV</Mono>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 'clamp(40px, 6vw + 12px, 72px)',
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
            overflowWrap: 'anywhere',
            color: 'var(--ink)',
            margin: '12px 0 0',
          }}
        >
          Provteknik
        </h1>
        <p
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(17px, 0.8vw + 14px, 22px)',
            lineHeight: 1.4,
            color: 'var(--ink-2)',
            marginTop: 16,
          }}
        >
          Fördela tiden, gå vidare när du fastnar och ge varje fråga en chans.
        </p>
      </header>
      {loading ? (
        <p role="status">Laddar provteknik…</p>
      ) : failed ? (
        <p role="alert">Kunde inte ladda provtekniken. Försök ladda om sidan.</p>
      ) : !chapter?.entries.length ? (
        <p>Provtekniken är inte tillgänglig just nu.</p>
      ) : (
        chapter.entries.map((entry) => (
          <ProvteknikCard key={entry.id} entry={entry}>
            {/* Stable authored IDs attach the shared, live pacing data to
                the rules and time-management entries without JSON copies. */}
            {entry.id === 'PROV-001' && <p>Ett vanligt provpass är {PASS_MINUTES} minuter.</p>}
            {entry.id === 'PROV-002' && <PacingTable />}
          </ProvteknikCard>
        ))
      )}
    </div>
  )
}

function PacingTable() {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: 24,
        fontSize: 15,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      <caption style={{ textAlign: 'left', color: 'var(--ink)', marginBottom: 10 }}>
        UHR:s rekommenderade tider
      </caption>
      <thead>
        <tr>
          {['Delprov', 'Frågor', 'Tid', 'Snitt per fråga'].map((label) => (
            <th key={label} scope="col" style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {UHR_ORDER.map((section) => (
          <tr key={section} style={{ borderTop: '1px solid var(--hairline)' }}>
            <th scope="row" style={{ textAlign: 'left', padding: '8px 8px 8px 0' }}>
              {section}
            </th>
            <td>{UHR_DELPROV[section].questions}</td>
            <td style={{ whiteSpace: 'nowrap', paddingRight: 8 }}>
              {UHR_DELPROV[section].minutes} min
            </td>
            <td style={{ whiteSpace: 'nowrap' }}>{(uhrTimeMs(section, 1) ?? 0) / 1000} s</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
