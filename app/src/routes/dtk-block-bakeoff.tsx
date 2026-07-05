// /dtk-block-bakeoff — DTK drilling: current (individual) vs block-grouping.
//
// Panel verdict (2026-07-05): DTK is the owner's most-avoided + worst
// section (6 attempts, 0 correct). The recommended fix is block-grouping:
// a DTK page + its cluster of ~3-4 questions worked as a unit, the figure
// shown ONCE and kept sticky, mirroring the real exam. This bake-off shows
// that against the status quo on the surface that matters — a phone.
//
// Real content: host-2014-kvant2-p18.jpg + its real 4-question block
// (DTK-031…034), all interrogating the same age/year discharge chart.
//
// Dev-gated.

import { createFileRoute } from '@tanstack/react-router'
import type { CSSProperties, ReactNode } from 'react'
import { isDevSurface } from '@/lib/devSurface'

export const Route = createFileRoute('/dtk-block-bakeoff')({
  component: DtkBlockBakeoff,
})

const FIG = '/figures/dtk/host-2014-kvant2-p18.jpg'

const BLOCK = [
  {
    n: 31,
    q: 'Studera de utskrivna kvinnorna 2005. Hur många fler per 100 000 var de i åldersgruppen 15–24 år jämfört med i åldersgruppen 45–64 år?',
    opts: ['100 fler', '140 fler', '190 fler', '250 fler'],
  },
  {
    n: 32,
    q: 'Vilket av följande år avses? De utskrivna männen i åldersgruppen 5–14 år var fler än 200 per 100 000 …',
    opts: ['2001', '2003', '2004', '2006'],
  },
  {
    n: 33,
    q: 'För hur många av åldersgrupperna gäller att antalet utskrivna män per 100 000 nådde sin topp år 2002?',
    opts: ['3', '5', '6', '7'],
  },
  {
    n: 34,
    q: 'Studera utskrivna män i de olika åldersgrupperna år 1999 och 2008. I vilken åldersgrupp var skillnaden störst?',
    opts: ['0–4 år', '25–44 år', '75–84 år', '85+ år'],
  },
]

function DtkBlockBakeoff() {
  if (!isDevSurface()) {
    return (
      <div style={{ minHeight: '100dvh', padding: '40px 24px', fontSize: 16 }}>
        Dev-only. Append <code>?dev=1</code>.
      </div>
    )
  }
  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'color-mix(in oklch, var(--bg) 94%, var(--ink))',
        color: 'var(--ink)',
        padding: '20px clamp(16px, 3vw, 40px) 80px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <header style={{ ...eyebrow, marginBottom: 6 }}>
        <strong>
          <span style={{ color: 'var(--accent)' }}>●</span>&nbsp; DTK-drill: nuvarande vs
          blockgruppering
        </strong>
      </header>
      <p style={{ fontSize: 11, color: 'var(--muted)', margin: '0 0 22px', maxWidth: '70ch' }}>
        Samma sida, samma 4 frågor (host-2014 · utskrivna per 100 000). Vänster: dagens individuella
        dragning — varje fråga en egen skärm, sidan laddas om. Höger: blocket som enhet — figuren
        visas en gång och sitter kvar medan du går igenom klustret.
      </p>

      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <Artboard tag="A" title="Nuvarande" note="Individuell dragning · en fråga per skärm">
          <CurrentMock />
        </Artboard>
        <Artboard tag="B" title="Blockgruppering" note="Figuren sitter kvar · Fråga N av 4">
          <BlockMock />
        </Artboard>
      </div>
    </div>
  )
}

function Artboard({
  tag,
  title,
  note,
  children,
}: {
  tag: string
  title: string
  note: string
  children: ReactNode
}) {
  return (
    <section>
      <div style={{ padding: '0 2px 10px' }}>
        <div style={{ ...eyebrow, marginBottom: 3 }}>
          <span style={{ color: 'var(--accent)' }}>{tag}</span> · {title}
        </div>
        <div style={{ fontSize: 10, color: 'var(--muted)' }}>{note}</div>
      </div>
      {/* phone device frame */}
      <div
        style={{
          width: 390,
          height: 780,
          background: 'var(--bg)',
          border: '10px solid color-mix(in oklch, var(--ink) 82%, var(--bg))',
          borderRadius: 34,
          overflow: 'hidden',
          boxShadow: '0 20px 44px -22px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ height: '100%', overflowY: 'auto' }}>{children}</div>
      </div>
    </section>
  )
}

const eyebrow: CSSProperties = {
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

function Figure({ zoomHint = true }: { zoomHint?: boolean }) {
  return (
    <div style={{ position: 'relative', margin: '0 auto 16px', width: 'calc(100% - 8px)' }}>
      <img
        src={FIG}
        alt="DTK-figur"
        style={{
          display: 'block',
          width: '100%',
          height: 300,
          objectFit: 'contain',
          objectPosition: 'top',
          background: 'var(--panel)',
          border: '1px solid var(--hairline)',
          borderRadius: 6,
        }}
      />
      {zoomHint && (
        <span
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            fontFamily: 'var(--font-mono)',
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-2)',
            background: 'color-mix(in oklch, var(--bg) 90%, transparent)',
            border: '1px solid var(--hairline)',
            borderRadius: 999,
            padding: '4px 8px',
          }}
        >
          ⤢ förstora
        </span>
      )}
    </div>
  )
}

function Options({ opts }: { opts: string[] }) {
  return (
    <div style={{ marginTop: 12 }}>
      {opts.map((o, i) => (
        <div
          key={o}
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'baseline',
            padding: '11px 0',
            borderBottom: '1px solid var(--hairline-2)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--muted-2)',
              width: 14,
            }}
          >
            {String.fromCharCode(97 + i)}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15 }}>{o}</span>
        </div>
      ))}
    </div>
  )
}

function Prompt({ text }: { text: string }) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: 16,
        lineHeight: 1.5,
        color: 'var(--ink)',
        margin: '0 0 4px',
      }}
    >
      {text}
    </p>
  )
}

// ── A · Nuvarande (individual) ─────────────────────────────────────

function CurrentMock() {
  const q = BLOCK[0]
  return (
    <div style={{ padding: '18px 16px' }}>
      <div style={{ ...eyebrow, fontSize: 9.5, color: 'var(--muted)', marginBottom: 12 }}>
        DTK · fråga 3 av 10
      </div>
      <Figure />
      <Prompt text={q.q} />
      <Options opts={q.opts} />
      <p style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 20, lineHeight: 1.5 }}>
        Nästa fråga → ny skärm, sidan laddas om (kan vara en annan figur). Du orienterar dig i en
        tät sida på nytt varje gång.
      </p>
    </div>
  )
}

// ── B · Blockgruppering ────────────────────────────────────────────

function BlockMock() {
  const active = 1 // showing question 2 of 4 (0-indexed) to make the "kvar" state visible
  const q = BLOCK[active]
  return (
    <div style={{ padding: '18px 16px' }}>
      <div
        style={{
          ...eyebrow,
          fontSize: 9.5,
          color: 'var(--muted)',
          marginBottom: 12,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>DTK · block 1</span>
        <span style={{ color: 'var(--accent)' }}>samma sida ↓</span>
      </div>
      <Figure />
      {/* the block cue — the sticky figure + which question of the cluster */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--accent-soft)',
          borderRadius: 6,
          marginBottom: 14,
        }}
      >
        <span style={{ display: 'flex', gap: 5 }}>
          {BLOCK.map((b, i) => (
            <span
              key={b.n}
              style={{
                width: 7,
                height: 7,
                borderRadius: 999,
                background:
                  i < active ? 'var(--accent)' : i === active ? 'var(--accent)' : 'var(--hairline)',
                outline: i === active ? '2px solid var(--accent)' : 'none',
                outlineOffset: 1,
                opacity: i <= active ? 1 : 0.5,
              }}
            />
          ))}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.04em',
            color: 'var(--ink-2)',
          }}
        >
          Fråga {active + 1} av 4 · samma sida
        </span>
      </div>
      <Prompt text={q.q} />
      <Options opts={q.opts} />
      <p style={{ fontSize: 9.5, color: 'var(--muted)', marginTop: 20, lineHeight: 1.5 }}>
        Figuren sitter kvar hela blocket. Du orienterar dig en gång och svarar på 4 frågor mot samma
        sida — som på riktiga provet.
      </p>
    </div>
  )
}
