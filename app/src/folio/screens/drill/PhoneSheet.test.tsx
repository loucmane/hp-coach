import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { expect, it } from 'vitest'
import { formatViolations, runAxe } from '@/test/a11y'
import { PhoneSheet, type SheetState } from './PhoneSheet'

function Harness() {
  const [state, setState] = useState<SheetState>('full')
  return (
    <main data-folio="" lang="sv">
      <div className="fa-drill">
        <PhoneSheet
          state={state}
          setState={setState}
          feedback
          position="Fråga 1 av 3"
          action={<button type="button">Nästa fråga</button>}
          onQuestion={() => {}}
          onReturn={() => setState('full')}
        >
          <h2>Förklaringen</h2>
        </PhoneSheet>
      </div>
    </main>
  )
}
it('offers accessible full, open and peek states without losing feedback', async () => {
  const { container } = render(<Harness />)
  for (const state of ['full', 'open', 'peek', 'full']) {
    expect(screen.getByTestId('rd-sheet')).toHaveAttribute('data-state', state)
    expect(screen.getByText('Förklaringen').closest('[hidden]') !== null).toBe(state === 'peek')
    const violations = await runAxe(container)
    expect(violations, formatViolations(violations)).toEqual([])
    if (state === 'full') fireEvent.click(screen.getByRole('button', { name: 'Visa mindre facit' }))
    else if (state === 'open') fireEvent.click(screen.getByRole('button', { name: 'Visa texten' }))
    else fireEvent.click(screen.getByRole('button', { name: 'Tillbaka till facit' }))
  }
})
