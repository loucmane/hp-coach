// /dev/ovningstext-bakeoff page body: the variant × scene switcher and the
// stage. Router-free — the route passes the selection in and receives
// changes — so the same tree can be mounted outside the app shell.

import type { CSSProperties } from 'react'

import { DrillScene, type DrillSceneSpec } from '@/components/devbake/OvningstextDrill'
import { VARIANTS, type VariantKey } from '@/components/devbake/OvningstextKit'
import { EstimateScene, RetiredScene } from '@/components/devbake/OvningstextSurfaces'
import { ELF_CLOZE_UNIT, ELF_SHORT_UNIT, LAS_UNIT } from '@/components/devbake/ovningstextFixtures'
import { useViewport } from '@/hooks/useViewport'
import { useUiStore } from '@/stores/uiStore'

export type SceneKey = '1' | '2' | '3' | '4' | '5' | '6' | '7'

export const SCENES: { key: SceneKey; label: string; blurb: string }[] = [
  {
    key: '1',
    label: '1 · LÄS',
    blurb:
      'Texten och första frågan vid textens första visning, så noten syns. Svara och gå vidare för att se en senare visning.',
  },
  {
    key: '2',
    label: '2 · ELF-lucktext',
    blurb: 'Lucka 2 av 5 i samma text: en senare visning, noten är undanlagd.',
  },
  {
    key: '3',
    label: '3 · Telefon',
    blurb:
      '390 px, rullad till frågan så att texten är ur bild. Här ska märkningen synas vid frågan.',
  },
  {
    key: '4',
    label: '4 · Facit',
    blurb: 'Ett rättat felsvar med förklaringen, rullad till utfallet.',
  },
  {
    key: '5',
    label: '5 · Repetition',
    blurb: 'En miss som spelas upp igen från Repetera. Texten är redan sedd.',
  },
  {
    key: '6',
    label: '6 · Uppskattning',
    blurb:
      'Förbehållet där en uppskattning bygger på LÄS och ELF: Provpass-resultatet, Hem och Framsteg.',
  },
  {
    key: '7',
    label: '7 · Ur bruk',
    blurb:
      'Facit för ett pass där en av texterna sedan har tagits ur bruk. Svaren finns kvar, texten visas inte.',
  },
]

const DRILL_SPECS: Record<'1' | '2' | '3' | '4' | '5', DrillSceneSpec> = {
  '1': { unit: LAS_UNIT, start: 0, firstPosition: 1, total: 10, firstDisplay: true },
  '2': { unit: ELF_CLOZE_UNIT, start: 1, firstPosition: 1, total: 10, firstDisplay: false },
  '3': {
    unit: LAS_UNIT,
    start: 1,
    firstPosition: 1,
    total: 10,
    firstDisplay: false,
    anchor: 'question',
  },
  '4': {
    unit: LAS_UNIT,
    start: 0,
    firstPosition: 1,
    total: 10,
    firstDisplay: true,
    pick: 'C',
    anchor: 'outcome',
  },
  '5': { unit: ELF_SHORT_UNIT, start: 0, firstPosition: 2, total: 6, firstDisplay: false },
}

export type BakeoffSelection = { v?: VariantKey; s?: SceneKey }

export function OvningstextBakeoff({
  variant,
  scene,
  frame = false,
  onSelect,
}: {
  variant: VariantKey
  scene: SceneKey
  /** Bare stage, no switcher — the phone preview's iframe. */
  frame?: boolean
  onSelect: (next: BakeoffSelection) => void
}) {
  const viewport = useViewport()
  const layout = viewport === 'phone' ? 'phone' : 'desktop'
  const mode = useUiStore((s) => s.mode)
  const toggleMode = useUiStore((s) => s.toggleMode)

  const stage = (
    <div data-testid="ovn-stage" data-variant={variant} data-scene={scene}>
      <Stage
        // A fresh scene per selection: the player state and the note's
        // first-display state start over.
        key={`${variant}-${scene}-${layout}`}
        variant={variant}
        scene={scene}
        layout={layout}
        mode={mode}
      />
    </div>
  )
  if (frame) return stage

  const v = VARIANTS.find((x) => x.key === variant) ?? VARIANTS[0]
  const s = SCENES.find((x) => x.key === scene) ?? SCENES[0]
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg)', color: 'var(--ink)' }}>
      <header
        style={{
          padding: '18px 16px 16px',
          borderBottom: '1px solid var(--hairline)',
          background: 'var(--bg)',
        }}
      >
        <div
          style={{
            maxWidth: 980,
            margin: '0 auto',
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
              gap: 12,
            }}
          >
            <div style={eyebrow}>Bake-off · ÖVNINGSTEXT-märkningen</div>
            <button
              type="button"
              onClick={toggleMode}
              data-testid="ovn-theme"
              aria-label={mode === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge'}
              style={{
                ...eyebrow,
                padding: '4px 0',
                border: 0,
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {mode === 'dark' ? 'mörk' : 'ljus'} ◐
            </button>
          </div>
          <Pills
            label="Variant"
            items={VARIANTS}
            active={variant}
            onPick={(k) => onSelect({ v: k })}
            testid="ovn-variant"
          />
          <Pills
            label="Scen"
            items={SCENES}
            active={scene}
            onPick={(k) => onSelect({ s: k })}
            testid="ovn-scene"
          />
          <p style={blurb}>
            <strong style={{ color: 'var(--ink)' }}>{v.label}.</strong> {v.blurb}
          </p>
          <p style={blurb}>
            <strong style={{ color: 'var(--ink)' }}>Scen {s.label}.</strong> {s.blurb}
          </p>
        </div>
      </header>
      {stage}
    </div>
  )
}

function Stage({
  variant,
  scene,
  layout,
  mode,
}: {
  variant: VariantKey
  scene: SceneKey
  layout: 'desktop' | 'phone'
  mode: 'light' | 'dark'
}) {
  if (scene === '6') return <EstimateScene variant={variant} />
  if (scene === '7') return <RetiredScene variant={variant} layout={layout} />
  // The chassis linearises by viewport media query, so a phone scene on a
  // desktop screen is shown at true 390px width in a frame of this page.
  if (scene === '3' && layout === 'desktop') return <PhonePreview variant={variant} mode={mode} />
  return <DrillScene variant={variant} spec={DRILL_SPECS[scene]} layout={layout} />
}

function PhonePreview({ variant, mode }: { variant: VariantKey; mode: 'light' | 'dark' }) {
  const src = `${window.location.pathname}?v=${variant}&s=3&frame=1&dev=1`
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        padding: '28px 16px 72px',
        background: 'var(--panel-2)',
      }}
    >
      <iframe
        // Re-key on the theme so the frame reloads into the new mode.
        key={mode}
        title="Scen 3 i telefonbredd"
        src={src}
        data-testid="ovn-phone-frame"
        style={{
          width: 390,
          height: 844,
          border: '1px solid var(--hairline)',
          borderRadius: 28,
          background: 'var(--bg)',
          boxShadow: 'var(--shadow-card)',
        }}
      />
      {/* ink-2: --muted on --panel-2 falls just under 4.5:1 in dark. */}
      <p style={{ ...eyebrow, color: 'var(--ink-2)', margin: 0 }}>
        390 × 844 · samma sida i telefonbredd
      </p>
    </div>
  )
}

function Pills<K extends string>({
  label,
  items,
  active,
  onPick,
  testid,
}: {
  label: string
  items: { key: K; label: string }[]
  active: K
  onPick: (key: K) => void
  testid: string
}) {
  return (
    <fieldset style={{ margin: 0, padding: 0, border: 0, minWidth: 0 }}>
      <legend style={visuallyHidden}>{label}</legend>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.map((item) => {
          const on = item.key === active
          return (
            <button
              type="button"
              key={item.key}
              aria-pressed={on}
              data-testid={`${testid}-${item.key}`}
              onClick={() => onPick(item.key)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                letterSpacing: '0.04em',
                padding: '7px 13px',
                borderRadius: 999,
                border: `1px solid ${on ? 'var(--ink)' : 'var(--hairline)'}`,
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? 'var(--bg)' : 'var(--ink-2)',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

const visuallyHidden: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  margin: -1,
  padding: 0,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

const eyebrow: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  color: 'var(--muted)',
  textTransform: 'uppercase',
}

const blurb: CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  lineHeight: 1.5,
  color: 'var(--ink-2)',
  maxWidth: '78ch',
}
