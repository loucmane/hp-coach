// /dev/dtk-browser — grid view of every DTK figure JPEG.
//
// Quick QA surface for DTK-1: scroll through all 216 rasterized
// figures side by side, spot bad rasters, confirm pairing. Each tile
// shows the figure + the qids that reference it (typically 3 per
// figure: e.g., NNN+29, +30, +31).
//
// Dev-only — no production gate beyond the route being under /dev.
// Doesn't show up in the bottom tab bar or the running-head nav.

import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { Mono } from '@/components/primitives'

type DtkIndex = Record<string, { figure: string }>

export const Route = createFileRoute('/dtk-browser')({
  component: DtkBrowserRoute,
})

function DtkBrowserRoute() {
  const [index, setIndex] = useState<DtkIndex | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/figures/dtk/_index.json')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<DtkIndex>
      })
      .then((data) => setIndex(data))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  // Group qids by figure so each tile renders the figure once with
  // the qids that share it.
  const grouped = index ? groupByFigure(index) : null

  return (
    <MobileFrame activeTab="home">
      <Page
        runningHead={['HP · COACH', 'DTK Browser']}
        status={{
          mode: 'DEV',
          context: 'dtk figure QA',
          hints: ['esc tillbaka', '⌘k palett'],
        }}
      >
        <div
          style={{
            flex: 1,
            padding: 'clamp(28px, 4vw, 56px) clamp(20px, 4vw, 56px)',
            overflowY: 'auto',
          }}
        >
          <Mono>DEV · DTK</Mono>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(36px, 4vw + 12px, 56px)',
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: '8px 0 24px 0',
            }}
          >
            {grouped
              ? `${grouped.length} figurer · ${index ? Object.keys(index).length : 0} frågor`
              : 'DTK figurer'}
          </h1>

          {error && <ErrorBlock message={error} />}
          {!index && !error && <p style={{ color: 'var(--muted)' }}>Laddar…</p>}

          {grouped && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 24,
              }}
            >
              {grouped.map((g) => (
                <FigureTile key={g.figure} {...g} />
              ))}
            </div>
          )}
        </div>
      </Page>
    </MobileFrame>
  )
}

function FigureTile({ figure, qids }: { figure: string; qids: string[] }) {
  return (
    <figure
      style={{
        margin: 0,
        borderTop: '1px solid var(--hairline)',
        paddingTop: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <img
        src={`/figures/dtk/${figure}`}
        alt={figure}
        loading="lazy"
        style={{
          width: '100%',
          aspectRatio: '210 / 297', // A4 portrait
          objectFit: 'contain',
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
        }}
      />
      <figcaption
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          color: 'var(--muted)',
          lineHeight: 1.5,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        <div style={{ color: 'var(--ink)' }}>{figure}</div>
        <div>
          {qids.length} qid{qids.length === 1 ? '' : 's'}: {qids.map(shortQid).join(' · ')}
        </div>
      </figcaption>
    </figure>
  )
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        color: 'var(--accent)',
      }}
    >
      Kunde inte ladda DTK-index: {message}
    </p>
  )
}

function groupByFigure(index: DtkIndex): { figure: string; qids: string[] }[] {
  const map = new Map<string, string[]>()
  for (const [qid, entry] of Object.entries(index)) {
    if (!map.has(entry.figure)) map.set(entry.figure, [])
    map.get(entry.figure)?.push(qid)
  }
  return Array.from(map.entries())
    .map(([figure, qids]) => ({ figure, qids: qids.sort() }))
    .sort((a, b) => a.figure.localeCompare(b.figure))
}

// "host-2024-kvant1-DTK-029" → "DTK-029"
function shortQid(qid: string): string {
  const m = qid.match(/DTK-\d+$/)
  return m ? m[0] : qid
}
