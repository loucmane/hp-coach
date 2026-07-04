// /mer — the M-settings hub (task #160): the mast corner's destination
// and the permanent home for everything that used to be ⌘K-only.
//
// Owner-ratified IA (2026-07-03): the mast keeps its four primary links;
// the quiet corner word 'mer' opens THIS page. Two rail sections on the
// M3 chassis:
//
//   INSTÄLLNINGAR   palette words · mode words · coach words — all
//                   through useSyncedPrefs so they persist cross-device
//   VERKTYG         Diagnostik / Avancerat / Feedback as M3 plan-style
//                   rows (the desktop paths that had no visible entry)
//
// ⌘K remains as an accelerator, but nothing on this page NEEDS it.

import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { MobileFrame } from '@/components/MobileFrame'
import { Page } from '@/components/Page'
import { PALETTES, type PaletteKey } from '@/lib/tokens'
import { COACH_BLURBS, COACH_LABELS, type CoachKey } from '@/lib/voice'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'

export const Route = createFileRoute('/mer')({
  component: MerRoute,
})

const PALETTE_KEYS = Object.keys(PALETTES) as PaletteKey[]
const COACH_KEYS: CoachKey[] = ['kompis', 'professor', 'taktiker']

const TOOLS = [
  {
    to: '/diagnostik',
    headline: 'Diagnostik',
    rationale: 'Mät om var du står — 10 frågor över alla sektioner, ny baslinje.',
  },
  {
    to: '/avancerat',
    headline: 'Avancerat',
    rationale: 'Typsnitt, täthet och andra finjusteringar bortom tema.',
  },
  {
    to: '/coach',
    headline: 'Feedback',
    rationale: 'Exportera dina flaggade frågor och förklaringar.',
  },
] as const

function MerRoute() {
  const navigate = useNavigate()
  const sitting = useSitting()
  const days = useDaysRemaining()

  return (
    <MobileFrame tabs={false}>
      <Page>
        <div className="hpc-m3-frame" style={{ width: '100%', color: 'var(--ink)' }}>
          <DrillRailSection
            meta={
              <>
                <strong>Mer</strong>
                {days} dagar · {sitting.label.toLowerCase()}
              </>
            }
            delay={0}
          >
            <h1 className="hpc-m3-display" style={{ marginTop: 0 }}>
              Inställningar.
            </h1>
          </DrillRailSection>

          <DrillRailSection meta="Inställningar" delay={120}>
            <h2 className="hpc-m3-h">Tema och röst</h2>
            <SettingRow label="Palett">
              <PaletteWords />
            </SettingRow>
            <SettingRow label="Läge">
              <ModeWords />
            </SettingRow>
            <SettingRow label="Coach">
              <CoachWords />
            </SettingRow>
          </DrillRailSection>

          <DrillRailSection meta="Verktyg" delay={240}>
            <h2 className="hpc-m3-h">Verktyg</h2>
            <div>
              {TOOLS.map((tool, i) => (
                <div className="hpc-m3-plan-item" key={tool.to}>
                  <span className="hpc-m3-plan-n" aria-hidden>
                    {i + 1}.
                  </span>
                  <Link
                    to={tool.to}
                    data-testid={`mer-tool-${tool.to.slice(1)}`}
                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                  >
                    <div className="hpc-m3-plan-t">{tool.headline}</div>
                    <div className="hpc-m3-plan-r">{tool.rationale}</div>
                  </Link>
                  <span className="hpc-m3-plan-min">→</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => navigate({ to: '/' })}
              className="hpc-m3-keys"
              style={{
                all: 'unset',
                cursor: 'pointer',
                marginTop: 28,
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.06em',
                color: 'var(--muted-2)',
              }}
            >
              ← tillbaka hem · esc fungerar också
            </button>
          </DrillRailSection>
        </div>
      </Page>
    </MobileFrame>
  )
}

// ── Setting rows — word-pickers in the M3 register ─────────────────
//
// Each setting is a row of mono words; the active word is ink with an
// underline (the same active-word signature the old EditionStrip used),
// the rest muted. All writes go through useSyncedPrefs → cross-device.

function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '96px 1fr',
        gap: 16,
        alignItems: 'baseline',
        padding: '13px 0',
        borderBottom: '1px solid var(--hairline-2)',
      }}
    >
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
      <span style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'baseline' }}>
        {children}
      </span>
    </div>
  )
}

function Word({
  active,
  onClick,
  children,
  ariaLabel,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={active}
      style={{
        all: 'unset',
        cursor: 'pointer',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: active ? 'var(--ink)' : 'var(--muted-2)',
        borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
        paddingBottom: 2,
      }}
    >
      {children}
    </button>
  )
}

function PaletteWords() {
  const palette = useUiStore((s) => s.palette)
  const synced = useSyncedPrefs()
  return (
    <>
      {PALETTE_KEYS.map((p) => (
        <Word
          key={p}
          active={p === palette}
          onClick={() => synced.setPalette(p)}
          ariaLabel={`Palett: ${p}${p === palette ? ' (aktiv)' : ''}`}
        >
          {p}
        </Word>
      ))}
    </>
  )
}

function ModeWords() {
  const mode = useUiStore((s) => s.mode)
  const synced = useSyncedPrefs()
  return (
    <>
      <Word
        active={mode === 'light'}
        onClick={() => synced.setMode('light')}
        ariaLabel="Växla till ljust läge"
      >
        ljus
      </Word>
      <Word
        active={mode === 'dark'}
        onClick={() => synced.setMode('dark')}
        ariaLabel="Växla till mörkt läge"
      >
        mörk
      </Word>
    </>
  )
}

function CoachWords() {
  const coach = useCoachStore((s) => s.coach)
  const synced = useSyncedPrefs()
  return (
    <>
      {COACH_KEYS.map((c) => (
        <Word
          key={c}
          active={c === coach}
          onClick={() => synced.setCoach(c)}
          ariaLabel={`${COACH_LABELS[c]} — ${COACH_BLURBS[c]}`}
        >
          {COACH_LABELS[c]}
        </Word>
      ))}
    </>
  )
}
