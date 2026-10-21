import type { ReactNode } from 'react'

import { Eyebrow } from '@/components/primitives'
import type { ProvteknikEntry } from '@/data/frameworks'

export function ProvteknikCard({
  entry,
  children,
}: {
  entry: ProvteknikEntry
  children?: ReactNode
}) {
  return (
    <details
      id={entry.id}
      style={{
        paddingBlock: 'clamp(20px, 2vw + 8px, 32px)',
        borderTop: '1px solid var(--hairline)',
        maxWidth: '68ch',
        scrollMarginTop: 'clamp(48px, 8vw, 96px)',
      }}
    >
      <summary style={{ listStyle: 'none', cursor: 'pointer' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            marginBottom: 10,
          }}
        >
          <Eyebrow>{entry.delprov ?? 'Alla delprov'}</Eyebrow>
          <span
            aria-hidden
            className="trap-card-toggle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}
          />
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(20px, 1.4vw + 13px, 26px)',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          {entry.headline}
        </h2>
      </summary>
      <div
        style={{
          marginTop: 20,
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(15px, 0.6vw + 13px, 17px)',
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        <p style={{ margin: 0 }}>{entry.body}</p>
        {entry.steps && (
          <ol style={{ paddingLeft: 24, marginBlock: 20 }}>
            {entry.steps.map((step) => (
              <li key={step} style={{ marginBlock: 10 }}>
                {step}
              </li>
            ))}
          </ol>
        )}
        {entry.table && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
            <caption style={{ textAlign: 'left', color: 'var(--ink)', marginBottom: 10 }}>
              {entry.delprov === 'NOG'
                ? 'Tillräcklig information för lösningen erhålls'
                : entry.headline}
            </caption>
            <thead>
              <tr>
                <th scope="col" style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>
                  Svar
                </th>
                <th scope="col" style={{ textAlign: 'left', paddingBlock: 8 }}>
                  Information
                </th>
              </tr>
            </thead>
            <tbody>
              {entry.table.map(([label, meaning]) => (
                <tr key={label} style={{ borderTop: '1px solid var(--hairline)' }}>
                  <th scope="row" style={{ textAlign: 'left', padding: '8px 16px 8px 0' }}>
                    {label}
                  </th>
                  <td style={{ paddingBlock: 8 }}>{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {children}
      </div>
    </details>
  )
}
