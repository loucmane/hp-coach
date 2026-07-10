// Kallelse — "Kallelsen färgad" (V4A FINAL, owner-approved). The Provpass
// summons block that anchors a provpass-dag on Home, ABOVE Dagens plan.
// Ports the accent-soft-fill treatment (KallelseFilled/KallelseFilledDesk,
// devbake/NavCtaBakeoff.tsx L1335-1389 phone, L1682-1734 desktop) into a
// real, wired component: a real click handler instead of the bakeoff's
// inert `cursor:default` span, and the heading half derived from data
// instead of hardcoded "Verbal".
//
// One component adapts phone vs desktop via useViewport(), matching how
// HomeMobile/MockRunner/Frame already branch layout (see `isPhone` /
// `viewport === 'studio'` precedent) rather than exporting two named
// components — the content is identical, only type scale + padding + the
// desktop DrillRailSection wrapper differ.

import { useEffect } from 'react'

import { DrillRailSection } from '@/components/drill/DrillRailSection'
import { useViewport } from '@/hooks/useViewport'
import { logMockEvent } from '@/lib/mockEvents'
import type { PlanItem } from '@/lib/scheduler'

const MONO_TRACK = 'var(--font-mono-track, 0.04em)'

type KallelseProps = {
  item: PlanItem
  onStart: () => void
  /** Test-only override for viewport detection (mirrors HomeMobile's forceLayout). */
  forceLayout?: 'phone' | 'reader' | 'studio'
}

const SHOWN_KEY = 'hpc-kallelse-shown-date'

/** Fire provpassdag_shown at most once per calendar day — mirrors the
 *  date-string comparison idiom lib/visitMemory.ts uses for "once per
 *  visit" facts, scoped here to "once per day" instead. */
function logShownOncePerDay(): void {
  if (typeof window === 'undefined') return
  try {
    const today = new Date().toISOString().slice(0, 10)
    const last = window.localStorage.getItem(SHOWN_KEY)
    if (last === today) return
    window.localStorage.setItem(SHOWN_KEY, today)
    logMockEvent('provpassdag_shown')
  } catch {
    // storage unavailable — still fine to skip the dedupe and log once;
    // but err on NOT double-logging in that edge case.
  }
}

/** Derives "Verbal · 55 minuter" / "Kvant · 55 minuter" from the plan
 *  item's headline ("Provpass · Verbal" / "Provpass · Kvant") — the
 *  scheduler-shaped item doesn't carry a typed `half` field itself
 *  (that's MockPrescription's job, out of scope here), so we parse the
 *  part after the separator. Falls back to the bare headline if it
 *  doesn't match the expected shape, so this never crashes on unknown
 *  copy. */
function deriveHeading(item: PlanItem): string {
  const parts = item.headline.split('·').map((s) => s.trim())
  const half = parts.length > 1 ? parts[parts.length - 1] : item.headline
  return `${half} · ${item.estimatedMinutes} minuter`
}

export function Kallelse({ item, onStart, forceLayout }: KallelseProps) {
  const isMock = item.kind === 'mock'
  const detectedViewport = useViewport()
  const viewport = forceLayout ?? detectedViewport
  const isPhone = viewport === 'phone'

  useEffect(() => {
    if (!isMock) return
    logShownOncePerDay()
  }, [isMock])

  if (!isMock) return null

  const heading = deriveHeading(item)

  if (isPhone) {
    // Phone composition — accent-soft notice, own section, above the plan.
    return (
      <section style={{ padding: '26px 22px 0' }}>
        <KallelseBody
          heading={heading}
          rationale={item.rationale}
          onStart={onStart}
          desktop={false}
        />
      </section>
    )
  }

  // Desktop composition — its own KALLELSE rail section, larger type,
  // placed ABOVE Dagens plan by the caller (HomeMobile).
  return (
    <DrillRailSection meta="Kallelse">
      <KallelseBody heading={heading} rationale={item.rationale} onStart={onStart} desktop />
    </DrillRailSection>
  )
}

function KallelseBody({
  heading,
  rationale,
  onStart,
  desktop,
}: {
  heading: string
  rationale: string
  onStart: () => void
  desktop: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--accent-soft)',
        borderTop: '2px solid var(--accent)',
        padding: desktop ? '22px 26px 24px' : '16px 18px 18px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
        }}
      >
        Kallelse · Provpass
      </div>
      <h2
        className="hpc-m3-display"
        style={{
          fontSize: desktop ? 34 : 27,
          margin: desktop ? '12px 0 0' : '10px 0 0',
          fontStyle: 'italic',
          lineHeight: desktop ? 1.1 : 1.12,
          color: 'var(--ink)',
        }}
      >
        {heading}
      </h2>
      <p
        style={{
          fontSize: desktop ? 15 : 13.5,
          color: 'var(--ink-2)',
          lineHeight: 1.5,
          margin: desktop ? '10px 0 0' : '8px 0 0',
          maxWidth: desktop ? 280 : '42ch',
        }}
      >
        {rationale}
      </p>
      <div style={{ textAlign: desktop ? undefined : 'right', marginTop: desktop ? 20 : 16 }}>
        <button
          type="button"
          className="hpc-m3-cta"
          onClick={onStart}
          data-testid="kallelse-start"
          style={{
            display: 'inline-block',
            borderRadius: 999,
            padding: desktop ? '12px 26px' : '11px 22px',
            fontFamily: 'var(--font-mono)',
            fontSize: desktop ? 12.5 : 12,
            letterSpacing: MONO_TRACK,
            textTransform: 'uppercase',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Starta →
        </button>
      </div>
    </div>
  )
}
