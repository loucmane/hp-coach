import { describe, expect, it } from 'vitest'
import { facitOrder } from './facitOrder'

describe('facitOrder', () => {
  const learning = ['core', 'steps', 'alternatives', 'takeaway', 'framework']
  it.each([
    'guess',
    'think',
    'sure',
    null,
  ] as const)('keeps the chosen wrong option first: %s', (confidence) => {
    expect(facitOrder(false, confidence)).toEqual(['own', ...learning, 'lock', 'feedback'])
  })
  it.each([
    'guess',
    'think',
    null,
  ] as const)('teaches before retrieval after an uncertain right answer: %s', (confidence) => {
    expect(facitOrder(true, confidence)).toEqual([...learning, 'lock', 'feedback'])
  })
  it('offers retrieval first only after a confident right answer', () => {
    expect(facitOrder(true, 'sure')).toEqual(['lock', ...learning, 'feedback'])
  })
})
