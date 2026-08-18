import { expect, it } from 'vitest'

import { makeExitClone } from './exitInk'

it('strips question identity only from dead ink while preserving the live tree', () => {
  const live = document.createElement('section')
  live.className = 'question-sheet'
  live.setAttribute('aria-label', 'Question sheet')
  live.setAttribute('data-qid', 'question-root')
  live.setAttribute('data-exit-role', 'source')
  live.innerHTML = `
    <article data-qid="question-prompt" data-content-kind="prompt">
      <span data-qid="question-answer" aria-label="Answer">42</span>
    </article>
  `

  const clone = makeExitClone(live)

  expect(clone).not.toHaveAttribute('data-qid')
  expect(clone.querySelectorAll('[data-qid]')).toHaveLength(0)

  expect(live).toHaveAttribute('data-qid', 'question-root')
  expect(
    [...live.querySelectorAll('[data-qid]')].map((node) => node.getAttribute('data-qid')),
  ).toEqual(['question-prompt', 'question-answer'])

  expect(clone).toHaveClass('question-sheet')
  expect(clone).toHaveAttribute('aria-label', 'Question sheet')
  expect(clone).toHaveAttribute('data-exit-role', 'source')
  expect(clone.querySelector('article')).toHaveAttribute('data-content-kind', 'prompt')
  expect(clone.querySelector('span')).toHaveAttribute('aria-label', 'Answer')
})
