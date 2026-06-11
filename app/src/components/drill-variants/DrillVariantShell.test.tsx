// DrillVariantShell missing-qid recovery — a qid that no longer
// resolves in the bank must render the Swedish not-found state, not
// crash the component tree (task 74: recoverable missing-qid states).

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { DrillVariantShell } from './DrillVariantShell'

// The shell's explanation fetch is out of scope here (and the test
// fetch shim only serves /data/) — resolve to "no explanation".
vi.mock('@/data/explanations', () => ({
  loadExplanation: async () => null,
}))

describe('DrillVariantShell', () => {
  it('renders a recoverable not-found state for a missing qid', async () => {
    render(
      <DrillVariantShell qid="missing-qid-xyz">
        {({ question }) => <div>{question.qid}</div>}
      </DrillVariantShell>,
    )
    expect(await screen.findByText(/hittades inte i banken/i)).toBeInTheDocument()
  })

  it('renders the variant for a resolvable qid', async () => {
    render(
      <DrillVariantShell>
        {({ question }) => <div data-testid="variant-qid">{question.qid}</div>}
      </DrillVariantShell>,
    )
    expect(await screen.findByTestId('variant-qid')).toHaveTextContent('host-2013-kvant2-KVA-016')
  })
})
