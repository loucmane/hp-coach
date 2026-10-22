import { type RefObject, useEffect } from 'react'

/** Disclosure dismissal; phone sheets also contain keyboard focus. */
export function useDismiss(
  open: boolean,
  close: () => void,
  root: RefObject<HTMLElement | null>,
  trigger: RefObject<HTMLButtonElement | null>,
  modal = false,
) {
  useEffect(() => {
    if (!open) return
    const panel = root.current
    const opener = trigger.current
    const focusable = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>('*') ?? []).filter((element) =>
        element.matches('button:not(:disabled), a[href], [tabindex="0"]'),
      )
    focusable()[0]?.focus()
    const onPointer = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !panel?.contains(event.target) &&
        !opener?.contains(event.target)
      )
        close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        close()
      }
      if (!modal || event.key !== 'Tab') return
      const items = focusable()
      const first = items[0],
        last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey, true)
      if (opener?.isConnected) opener.focus()
    }
  }, [open, close, root, trigger, modal])
}
