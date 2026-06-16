// Layout decision bake-off (Task MD of the M3 faithful-rebuild plan).
//
// Lets the owner SEE the three layout calls before we commit M0–M6, on the
// real M3 component (click an option to grade it):
//   1. Desktop:  single-column 880px (M3-faithful) vs 2-column StudyDesk split
//   2. Phone:    M3's narrow margin-rail vs the current ≤600px linearisation
//   3. Chrome:   M3's bare page vs the EDITION running-head/folio/status shell
//
// It reuses the actual `<M3 screen="drill">` (so what you judge is exactly what
// ships) and applies the variants as scoped CSS overrides + a chrome wrapper —
// no markup is duplicated. Dev-only; deleted once the three calls are made.

import { type ReactElement, type ReactNode, useEffect, useState } from 'react'
import { M3 } from '@/components/devbake/l12/M3'
import type { DrillKey } from '@/components/devbake/redesign/fixturesSections'

type Col = 'single' | 'split'
type PhoneRail = 'rail' | 'linear'
type Chrome = 'bare' | 'shell'
type NextStyle = 'float' | 'flow'

const SECTIONS: { key: DrillKey; label: string }[] = [
  { key: 'ord', label: 'ORD' },
  { key: 'las', label: 'LÄS' },
  { key: 'nog', label: 'NOG' },
  { key: 'xyz', label: 'XYZ' },
  { key: 'dtk', label: 'DTK' },
]

// Scoped overrides on M3's `.m3-*` classes. The desktop split reflows the
// graded frame's three children (question section, options section, `.m3-ped`)
// into a sticky-left / scrolling-right 2-column grid — the StudyDesk pattern.
// The phone stage forces a narrow rail (M3's 900px @media won't fire inside a
// fixed-width container) or the live linearisation.
const OVERRIDES = `
.bk-stage[data-col="split"] .m3-frame {
  max-width: 1240px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.18fr);
  grid-template-rows: auto 1fr;
  column-gap: 56px;
}
.bk-stage[data-col="split"] .m3-frame > section:nth-of-type(1) { grid-column: 1; grid-row: 1; }
.bk-stage[data-col="split"] .m3-frame > section:nth-of-type(2) { grid-column: 1; grid-row: 2; }
.bk-stage[data-col="split"] .m3-frame > .m3-ped {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: start;
  position: sticky;
  top: 24px;
  border-left: 1px solid var(--hairline);
  padding-left: 40px;
}
.bk-stage[data-col="split"] .m3-frame > .m3-ped .m3-section:first-child { margin-top: 0; }

/* Phone stage: rail kept (narrowed) vs linearised */
.bk-phone { width: 402px; }
.bk-phone[data-phonerail="rail"] .m3-frame { padding: 28px 16px 48px; }
.bk-phone[data-phonerail="rail"] .m3-row { grid-template-columns: 68px 1px 1fr; column-gap: 14px; }
.bk-phone[data-phonerail="linear"] .m3-frame { padding: 28px 16px 48px; }
.bk-phone[data-phonerail="linear"] .m3-row { grid-template-columns: 1fr; row-gap: 8px; }
.bk-phone[data-phonerail="linear"] .m3-spine { display: none; }
.bk-phone[data-phonerail="linear"] .m3-meta { text-align: left; padding-top: 0; }

/* Floating-next demo: hide M3's static bottom button so the floating CTA is
   the only advance affordance. */
body[data-next="float"] .m3-next-row { display: none; }
`

// A viewport-pinned "Nästa fråga" — the proposed always-reachable advance
// affordance, so you don't scroll past the explanation. Bottom-centre (clears
// the dev share/tweaks pills bottom-right). Clicking it dispatches Enter,
// which M3's own keyboard handler treats as "advance" (resets to un-graded).
function FloatingNext(): ReactElement {
  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'clamp(20px, 4vh, 40px)',
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 20,
      }}
    >
      <button
        type="button"
        onClick={() => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        }}
        style={{
          all: 'unset',
          pointerEvents: 'auto',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 26px',
          borderRadius: 'var(--radius)',
          fontFamily: 'var(--font-display)',
          fontSize: 16,
          fontWeight: 500,
          color: 'var(--bg)',
          background: 'color-mix(in oklch, var(--ink) 92%, transparent)',
          backdropFilter: 'saturate(150%) blur(16px)',
          WebkitBackdropFilter: 'saturate(150%) blur(16px)',
          boxShadow: '0 18px 40px -16px rgba(0,0,0,0.32)',
        }}
      >
        Nästa fråga
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, opacity: 0.7 }}>↵</span>
      </button>
    </div>
  )
}

function ChromeBar({ section }: { section: string }): ReactElement {
  const mono = {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
  }
  return (
    <header
      style={{
        ...mono,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        padding: '20px clamp(24px, 5vw, 64px) 12px',
        borderBottom: '1px solid var(--hairline)',
        color: 'var(--ink)',
      }}
    >
      <span>HP · COACH · {section}</span>
      <span style={{ display: 'inline-flex', gap: 24, color: 'var(--muted)' }}>
        <span>Hem</span>
        <span style={{ color: 'var(--ink)' }}>Övning</span>
        <span>Lektion</span>
        <span>Framsteg</span>
      </span>
      <span style={{ color: 'var(--accent)' }}>Höst-2026 ↘</span>
    </header>
  )
}

function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { v: T; l: string }[]
  onChange: (v: T) => void
}): ReactElement {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'inline-flex', border: '1px solid var(--hairline)' }}>
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            style={{
              all: 'unset',
              cursor: 'pointer',
              padding: '5px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              color: value === o.v ? 'var(--accent-ink)' : 'var(--ink)',
              background: value === o.v ? 'var(--accent)' : 'transparent',
            }}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  )
}

function Stage({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section style={{ marginTop: 28 }}>
      <h2
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h2>
      <div style={{ border: '1px solid var(--hairline)' }}>{children}</div>
    </section>
  )
}

export function LayoutBakeoff(): ReactElement {
  const [section, setSection] = useState<DrillKey>('ord')
  const [col, setCol] = useState<Col>('single')
  const [phoneRail, setPhoneRail] = useState<PhoneRail>('rail')
  const [chrome, setChrome] = useState<Chrome>('bare')
  const [nextStyle, setNextStyle] = useState<NextStyle>('float')
  const sectionLabel = SECTIONS.find((s) => s.key === section)?.label ?? 'ORD'

  // Drive the CSS that hides M3's static bottom button when floating.
  useEffect(() => {
    document.body.setAttribute('data-next', nextStyle)
    return () => {
      document.body.removeAttribute('data-next')
    }
  }, [nextStyle])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg)', color: 'var(--ink)' }}>
      <style>{OVERRIDES}</style>

      {/* Control bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'var(--bg)',
          borderBottom: '1px solid var(--hairline)',
          padding: '16px clamp(20px, 4vw, 48px)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 20,
          alignItems: 'center',
        }}
      >
        <strong
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          Layout-bakeoff
        </strong>
        <Toggle
          label="Sektion"
          value={section}
          options={SECTIONS.map((s) => ({ v: s.key, l: s.label }))}
          onChange={setSection}
        />
        <Toggle
          label="Desktop"
          value={col}
          options={[
            { v: 'single', l: '1 kolumn (M3)' },
            { v: 'split', l: '2 kolumner' },
          ]}
          onChange={setCol}
        />
        <Toggle
          label="Telefon"
          value={phoneRail}
          options={[
            { v: 'rail', l: 'Räls (M3)' },
            { v: 'linear', l: 'Linjär' },
          ]}
          onChange={setPhoneRail}
        />
        <Toggle
          label="Ram"
          value={chrome}
          options={[
            { v: 'bare', l: 'Bar sida (M3)' },
            { v: 'shell', l: 'Löpande huvud' },
          ]}
          onChange={setChrome}
        />
        <Toggle
          label="Nästa"
          value={nextStyle}
          options={[
            { v: 'float', l: 'Flytande' },
            { v: 'flow', l: 'I flödet (M3)' },
          ]}
          onChange={setNextStyle}
        />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>
          klicka ett alternativ för rättat läge
        </span>
      </div>

      {nextStyle === 'float' && <FloatingNext />}

      <div style={{ padding: '0 clamp(20px, 4vw, 48px) 80px' }}>
        {/* Desktop stage — col + chrome */}
        <Stage
          title={`Desktop · ${col === 'split' ? '2 kolumner' : '1 kolumn'} · ${chrome === 'shell' ? 'löpande huvud' : 'bar sida'}`}
        >
          <div className="bk-stage" data-col={col}>
            {chrome === 'shell' && <ChromeBar section={sectionLabel} />}
            <M3 key={`d-${section}`} screen="drill" drill={section} />
          </div>
        </Stage>

        {/* Phone stage — rail behaviour */}
        <Stage
          title={`Telefon (402px) · ${phoneRail === 'rail' ? 'räls behålls (M3)' : 'linjäriserad'}`}
        >
          <div className="bk-phone" data-phonerail={phoneRail}>
            {chrome === 'shell' && <ChromeBar section={sectionLabel} />}
            <M3 key={`p-${section}`} screen="drill" drill={section} />
          </div>
        </Stage>
      </div>
    </div>
  )
}
