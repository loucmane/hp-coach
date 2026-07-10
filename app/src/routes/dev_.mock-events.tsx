// /dev/mock-events — dev-only viewer for the Provpass instrumentation
// trail (lib/mockEvents.ts). No analytics backend exists yet; this is a
// local, functional list so the Kallelse / ProvpassStatusLine / ConfirmSheet
// funnel can be eyeballed during dogfooding. Newest first.
//
// Dev-gated via isDevSurface() — same mechanism as every other dev route.

import { createFileRoute } from '@tanstack/react-router'

import { type AdaptiveEvent, loadAdaptiveEvents } from '@/lib/adaptiveEvents'
import { isDevSurface } from '@/lib/devSurface'
import { loadMockEvents, type MockEvent } from '@/lib/mockEvents'

/** Stamp a stable key from each event's ORIGINAL position before reversing
 *  to newest-first — avoids using the post-reverse render index as the React
 *  key (which would shuffle identities every time an event is appended). */
function newestFirst<T extends { at: number }>(events: T[]): Array<T & { _key: string }> {
  return events.map((e, i) => ({ ...e, _key: `${e.at}-${i}` })).reverse()
}

function EventTable({ events }: { events: Array<(MockEvent | AdaptiveEvent) & { _key: string }> }) {
  if (events.length === 0) {
    return <p style={{ fontSize: 12, color: 'var(--muted)' }}>Inga events ännu.</p>
  }
  return (
    <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
      <thead>
        <tr style={{ textAlign: 'left', color: 'var(--muted)' }}>
          <th style={{ padding: '6px 12px 6px 0', borderBottom: '1px solid var(--hairline)' }}>
            Tid
          </th>
          <th style={{ padding: '6px 12px', borderBottom: '1px solid var(--hairline)' }}>Typ</th>
          <th style={{ padding: '6px 0', borderBottom: '1px solid var(--hairline)' }}>Meta</th>
        </tr>
      </thead>
      <tbody>
        {events.map((e) => (
          <tr key={e._key} style={{ borderBottom: '1px solid var(--hairline-2)' }}>
            <td style={{ padding: '6px 12px 6px 0', color: 'var(--muted)', whiteSpace: 'nowrap' }}>
              {new Date(e.at).toISOString()}
            </td>
            <td style={{ padding: '6px 12px', color: 'var(--accent)' }}>{e.type}</td>
            <td style={{ padding: '6px 0', color: 'var(--ink-2)' }}>
              {e.meta ? JSON.stringify(e.meta) : ''}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export const Route = createFileRoute('/dev_/mock-events')({
  component: MockEventsRoute,
})

function MockEventsRoute() {
  if (!isDevSurface()) {
    return (
      <div style={{ padding: 40, fontFamily: 'var(--font-display)', color: 'var(--ink)' }}>
        /dev/mock-events is a dev-only surface. Append <code>?dev=1</code> to opt in.
      </div>
    )
  }

  const mockEvents = newestFirst(loadMockEvents())
  const adaptiveEvents = newestFirst(loadAdaptiveEvents())

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'color-mix(in oklch, var(--bg) 94%, var(--ink))',
        color: 'var(--ink)',
        padding: 'clamp(24px, 4vw, 56px)',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Provpass event log
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          {mockEvents.length} event{mockEvents.length === 1 ? '' : 's'} · newest first ·
          localStorage only, no backend
        </div>
      </header>

      <EventTable events={mockEvents} />

      <header style={{ margin: '40px 0 24px' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; Adaptive review event log
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
          {adaptiveEvents.length} event{adaptiveEvents.length === 1 ? '' : 's'} · offer → accept /
          decline → treated funnel (task #16)
        </div>
      </header>

      <EventTable events={adaptiveEvents} />
    </div>
  )
}
