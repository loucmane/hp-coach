// Nav contract — the owner-locked IA (2026-07-11 redesign): five
// identical doors, same set and order in BOTH chromes, and "Feedback"
// absent from the phone bar but present in /mer · Verktyg.
//
// Both the desktop rail (NavRail) and the phone bar (MobileFrame's
// BottomTabs) render the SAME `DOORS` list, so they cannot drift; this
// pins that list and the phone-bar render, plus Feedback's relocation.

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { MobileFrame } from '@/components/MobileFrame'
import { DOORS } from '@/lib/nav'
import { TOOLS as MER_TOOLS } from '@/routes/mer'

const EXPECTED_DOORS = ['Hem', 'Öva', 'Provpass', 'Uppslag', 'Framsteg'] as const

describe('primary nav — the five doors', () => {
  it('DOORS is exactly the locked set, in order', () => {
    expect(DOORS.map((d) => d.label)).toEqual([...EXPECTED_DOORS])
  })

  it('no retired label survives in the door set', () => {
    const labels = DOORS.map((d) => d.label)
    for (const gone of ['Feedback', 'Övning', 'Lektion', 'Coach']) {
      expect(labels).not.toContain(gone)
    }
  })

  it('Provpass sits dead-center (slot 3)', () => {
    expect(DOORS[2]?.id).toBe('provpass')
  })
})

describe('phone tab bar', () => {
  function renderBar() {
    return render(
      <MobileFrame tabs forceLayout="phone">
        <div />
      </MobileFrame>,
    )
  }

  it('renders the five doors as buttons, same labels as the rail', () => {
    renderBar()
    for (const label of EXPECTED_DOORS) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('does NOT render a Feedback tab', () => {
    renderBar()
    expect(screen.queryByRole('button', { name: 'Feedback' })).not.toBeInTheDocument()
  })
})

describe('Feedback relocation', () => {
  it('lives under /mer · Verktyg (the dogfood exporter → /coach)', () => {
    const feedback = MER_TOOLS.find((t) => t.headline === 'Feedback')
    expect(feedback).toBeDefined()
    expect(feedback?.to).toBe('/coach')
  })
})
