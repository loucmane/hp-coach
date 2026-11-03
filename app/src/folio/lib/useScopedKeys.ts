import { type RefObject, useEffect, useRef } from 'react'

import { useFolioPrefs } from './folioPrefs'

/** Runs a shortcut. Return `false` to leave the key unhandled (no preventDefault). */
export type ScopedKeyHandler = (event: KeyboardEvent) => unknown

/**
 * Shortcut name → handler. Names are `KeyboardEvent.key` values: letters in
 * either case ('a', 'J'), digits, or named keys ('Enter', 'ArrowRight', ' ').
 * Shift has to be bound on its own, as 'Shift+a'.
 */
export type ScopedKeyBindings = Readonly<Record<string, ScopedKeyHandler | undefined>>

// Typing targets: a shortcut there would eat a character.
const TYPING = 'input, textarea, select, [contenteditable]:not([contenteditable="false"])'
// Controls that activate on Enter or Space; their own action wins.
const ACTIVATES = 'a[href], button, summary, [role="button"], [role="link"]'

/** Lower-cases single characters, also after a 'Shift+' prefix. */
function normalize(name: string): string {
  if (name.length === 1) return name.toLowerCase()
  if (name.startsWith('Shift+') && name.length === 7) return `Shift+${name.slice(6).toLowerCase()}`
  return name
}

/**
 * The binding name of a keydown. Shift is a modifier for letters and named
 * keys. For other characters it is part of typing them: Shift+1 types '!' on
 * a US layout, and '1' itself on AZERTY.
 */
function shortcutName(event: KeyboardEvent): string {
  const { key } = event
  const char = key.length === 1 && key !== ' '
  const name = char ? key.toLowerCase() : key
  const shiftIsModifier = !char || key.toLowerCase() !== key.toUpperCase()
  return event.shiftKey && shiftIsModifier ? `Shift+${name}` : name
}

/**
 * Single-key shortcuts that fire only while focus is inside `regionRef`
 * (WCAG 2.1.4). They are ignored:
 * - in inputs, textareas, selects and contenteditable;
 * - with Meta, Ctrl or Alt held (modifier shortcuts such as ⌘K stay global);
 * - on held-down repeats, during IME composition, and on keys another handler
 *   already took (defaultPrevented);
 * - for Enter and Space on a focused link or button, which keep their own action.
 *
 * It is fully off while `enabled` is false, while the Konto keyboard pref is
 * off, and inside a `[data-folio][data-kbd="off"]` root. A handled key is
 * prevented. Handlers and the region are read when the key arrives, so new
 * bindings or a region mounted later need no new subscription.
 */
export function useScopedKeys(
  regionRef: RefObject<HTMLElement | null>,
  bindings: ScopedKeyBindings,
  { enabled = true }: { enabled?: boolean } = {},
): void {
  const kbd = useFolioPrefs((s) => s.kbd)
  const latest = useRef(new Map<string, ScopedKeyHandler>())
  useEffect(() => {
    const map = new Map<string, ScopedKeyHandler>()
    for (const [name, handler] of Object.entries(bindings)) {
      if (handler) map.set(normalize(name), handler)
    }
    latest.current = map
  }, [bindings])
  const on = enabled && kbd
  useEffect(() => {
    if (!on) return
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const region = regionRef.current
      const target = event.target
      if (!region || !(target instanceof Element) || !region.contains(target)) return
      if (target.closest(TYPING) || region.closest('[data-folio][data-kbd="off"]')) return
      const name = shortcutName(event)
      const handler = latest.current.get(name)
      if (!handler) return
      if ((name === 'Enter' || name === ' ') && target.closest(ACTIVATES)) return
      if (handler(event) !== false) event.preventDefault()
    }
    // On document, after React's own handlers, so a component in the region can claim a key first.
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [on, regionRef])
}
