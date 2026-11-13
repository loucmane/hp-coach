import { type ReactNode, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { Lit } from '@/folio/ui/Lit'

export type ReadingTab = 'text' | 'question'

/** Both panels stay mounted: switching tabs must not reset a plate or an answer. */
export function PhoneSheet({
  tab,
  setTab,
  questionKey,
  passage,
  children,
  action,
  suspended = false,
}: {
  tab: ReadingTab
  setTab: (tab: ReadingTab) => void
  questionKey: string
  passage: ReactNode
  children: ReactNode
  action: ReactNode
  suspended?: boolean
}) {
  const id = useId()
  const positions = useRef({ text: 0, question: 0 })
  const previous = useRef({ tab, questionKey })
  const tabs = useRef<HTMLDivElement>(null)
  useEffect(() => {
    // Record while visible, before hiding a long panel can clamp scrollY.
    const remember = () => {
      if (!suspended) positions.current[tab] = window.scrollY
    }
    window.addEventListener('scroll', remember, { passive: true })
    return () => window.removeEventListener('scroll', remember)
  }, [tab, suspended])
  useLayoutEffect(() => {
    const newQuestion = previous.current.questionKey !== questionKey
    if (newQuestion) positions.current.question = 0
    if (!suspended && (previous.current.tab !== tab || (newQuestion && tab === 'question')))
      window.scrollTo({ top: positions.current[tab], behavior: 'instant' })
    previous.current = { tab, questionKey }
  }, [tab, questionKey, suspended])
  const choose = (next: ReadingTab) => {
    positions.current[tab] = window.scrollY
    tabs.current
      ?.querySelector<HTMLButtonElement>(`[data-tab="${next}"]`)
      ?.focus({ preventScroll: true })
    setTab(next)
  }
  return (
    <div className="rd-sheet" data-testid="rd-sheet" data-tab={tab}>
      <div className="rd-tabs" role="tablist" aria-label="Visa" ref={tabs}>
        {(['text', 'question'] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            id={`${id}-${value}-tab`}
            data-tab={value}
            aria-selected={tab === value}
            aria-controls={`${id}-${value}`}
            tabIndex={tab === value ? 0 : -1}
            onClick={() => choose(value)}
            onKeyDown={(event) => {
              if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
              let next: ReadingTab
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
                next = value === 'text' ? 'question' : 'text'
              else if (event.key === 'Home') next = 'text'
              else if (event.key === 'End') next = 'question'
              else return
              event.preventDefault()
              event.stopPropagation()
              choose(next)
            }}
          >
            {value === 'text' ? 'Texten' : 'Frågan'}
          </button>
        ))}
      </div>
      <Lit as="div" className="rd-phone-sheet">
        <div
          className="rd-document"
          data-testid="rd-document"
          id={`${id}-text`}
          role="tabpanel"
          aria-labelledby={`${id}-text-tab`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a tab panel is the keyboard entry point to its reading content.
          tabIndex={0}
          hidden={tab !== 'text'}
        >
          {passage}
        </div>
        <div
          className="rd-sheet-body"
          id={`${id}-question`}
          role="tabpanel"
          aria-labelledby={`${id}-question-tab`}
          // biome-ignore lint/a11y/noNoninteractiveTabindex: a tab panel is the keyboard entry point to its question content.
          tabIndex={0}
          hidden={tab !== 'question'}
        >
          {children}
        </div>
      </Lit>
      <div className="rd-dock">{action}</div>
    </div>
  )
}
