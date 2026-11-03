import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useFolioPrefs } from './folioPrefs'
import { type ScopedKeyBindings, useScopedKeys } from './useScopedKeys'

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Node[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag)
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value)
  // appendChild, not append: the worker types' global Element shadows the DOM signature.
  for (const child of children) node.appendChild(child)
  return node
}

let region: HTMLDivElement
let button: HTMLButtonElement
let link: HTMLAnchorElement
let field: HTMLInputElement
let area: HTMLTextAreaElement
let select: HTMLSelectElement
let editable: HTMLDivElement
let editableChild: HTMLSpanElement
let lockedChild: HTMLSpanElement
let outside: HTMLButtonElement

beforeEach(() => {
  localStorage.clear()
  useFolioPrefs.getState().resetPrefs()
  button = el('button', { type: 'button' })
  link = el('a', { href: '#fraga' })
  field = el('input')
  area = el('textarea')
  select = el('select', {}, el('option'))
  editableChild = el('span')
  editable = el('div', { contenteditable: 'true' }, editableChild)
  lockedChild = el('span', { tabindex: '-1' })
  region = el(
    'div',
    { tabindex: '-1' },
    button,
    link,
    field,
    area,
    select,
    editable,
    el('div', { contenteditable: 'false' }, lockedChild),
  )
  outside = el('button', { type: 'button' })
  document.body.appendChild(region)
  document.body.appendChild(outside)
})

afterEach(() => {
  region.remove()
  outside.remove()
})

/** Focus the target and send a keydown from it, as a browser does. */
function press(target: EventTarget, key: string, init: KeyboardEventInit = {}) {
  if (target instanceof HTMLElement) target.focus()
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })
  target.dispatchEvent(event)
  return event
}

type Props = { bindings: ScopedKeyBindings; enabled?: boolean }

function setup(bindings: ScopedKeyBindings, enabled?: boolean) {
  const ref = { current: region }
  return renderHook<void, Props>(
    (props) => useScopedKeys(ref, props.bindings, { enabled: props.enabled }),
    { initialProps: { bindings, enabled } },
  )
}

describe('useScopedKeys: focus scoping', () => {
  it('fires a bound key only while focus is inside the region', () => {
    const a = vi.fn()
    setup({ a })
    const event = press(button, 'a')
    expect(a).toHaveBeenCalledTimes(1)
    expect(a).toHaveBeenCalledWith(event)
    expect(event.defaultPrevented).toBe(true)
    press(region, 'a')
    expect(a).toHaveBeenCalledTimes(2)
    const away = press(outside, 'a')
    press(document.body, 'a')
    expect(a).toHaveBeenCalledTimes(2)
    expect(away.defaultPrevented).toBe(false)
  })

  it('ignores inputs, textareas, selects and contenteditable', () => {
    const a = vi.fn()
    setup({ a })
    for (const target of [field, area, select, editable, editableChild]) {
      expect(press(target, 'a').defaultPrevented).toBe(false)
    }
    expect(a).not.toHaveBeenCalled()
    // contenteditable="false" takes no typing, so shortcuts still work there.
    press(lockedChild, 'a')
    expect(a).toHaveBeenCalledTimes(1)
  })

  it('reads the region when the key arrives, so a region mounted later works', () => {
    const ref: { current: HTMLElement | null } = { current: null }
    const a = vi.fn()
    renderHook(() => useScopedKeys(ref, { a }))
    expect(press(button, 'a').defaultPrevented).toBe(false)
    ref.current = region
    press(button, 'a')
    expect(a).toHaveBeenCalledTimes(1)
  })
})

describe('useScopedKeys: which keys count', () => {
  it('ignores any modifier, and Shift only fires its own binding', () => {
    const a = vi.fn()
    const strike = vi.fn()
    setup({ a, 'Shift+a': strike })
    press(button, 'a', { metaKey: true })
    press(button, 'a', { ctrlKey: true })
    press(button, 'a', { altKey: true })
    press(button, 'a', { ctrlKey: true, altKey: true })
    press(button, 'A', { shiftKey: true, metaKey: true })
    expect(a).not.toHaveBeenCalled()
    expect(strike).not.toHaveBeenCalled()
    press(button, 'A', { shiftKey: true })
    expect(strike).toHaveBeenCalledTimes(1)
    expect(a).not.toHaveBeenCalled()
  })

  it('does nothing for a Shift chord that has no binding of its own', () => {
    const a = vi.fn()
    const enter = vi.fn()
    setup({ a, Enter: enter })
    expect(press(region, 'A', { shiftKey: true }).defaultPrevented).toBe(false)
    expect(press(region, 'Enter', { shiftKey: true }).defaultPrevented).toBe(false)
    expect(a).not.toHaveBeenCalled()
    expect(enter).not.toHaveBeenCalled()
  })

  it('matches letters in either case (Caps Lock) and named keys exactly', () => {
    const j = vi.fn()
    const right = vi.fn()
    setup({ j, ArrowRight: right })
    press(button, 'J')
    press(button, 'ArrowRight')
    press(button, 'arrowright')
    expect(j).toHaveBeenCalledTimes(1)
    expect(right).toHaveBeenCalledTimes(1)
  })

  it('accepts binding names in either case', () => {
    const m = vi.fn()
    const strike = vi.fn()
    setup({ M: m, 'Shift+A': strike })
    press(button, 'm')
    press(button, 'A', { shiftKey: true })
    expect(m).toHaveBeenCalledTimes(1)
    expect(strike).toHaveBeenCalledTimes(1)
  })

  it('takes a character that needs Shift on the layout as that character', () => {
    const one = vi.fn()
    setup({ 1: one })
    press(button, '1', { shiftKey: true })
    press(button, '!', { shiftKey: true })
    expect(one).toHaveBeenCalledTimes(1)
  })

  it('leaves a focused control its own Enter and Space', () => {
    const enter = vi.fn()
    const space = vi.fn()
    setup({ Enter: enter, ' ': space })
    expect(press(button, 'Enter').defaultPrevented).toBe(false)
    expect(press(link, 'Enter').defaultPrevented).toBe(false)
    expect(press(button, ' ').defaultPrevented).toBe(false)
    expect(enter).not.toHaveBeenCalled()
    expect(space).not.toHaveBeenCalled()
    expect(press(region, 'Enter').defaultPrevented).toBe(true)
    expect(enter).toHaveBeenCalledTimes(1)
  })

  it('ignores held-down repeats, IME composition and keys another handler took', () => {
    const a = vi.fn()
    setup({ a })
    press(button, 'a', { repeat: true })
    press(button, 'a', { isComposing: true })
    button.addEventListener('keydown', (event) => event.preventDefault(), { once: true })
    press(button, 'a')
    expect(a).not.toHaveBeenCalled()
  })

  it('leaves unbound keys alone, and lets a handler decline with false', () => {
    const a = vi.fn(() => false)
    setup({ a })
    expect(press(button, 'b').defaultPrevented).toBe(false)
    expect(press(button, 'a').defaultPrevented).toBe(false)
    expect(a).toHaveBeenCalledTimes(1)
  })
})

describe('useScopedKeys: on and off', () => {
  it('is off while enabled is false', () => {
    const a = vi.fn()
    const { rerender } = setup({ a }, false)
    press(button, 'a')
    expect(a).not.toHaveBeenCalled()
    rerender({ bindings: { a }, enabled: true })
    press(button, 'a')
    expect(a).toHaveBeenCalledTimes(1)
  })

  it('is fully off while the Konto keyboard pref is off', () => {
    const a = vi.fn()
    setup({ a })
    act(() => useFolioPrefs.getState().setPrefs({ kbd: false }))
    expect(press(button, 'a').defaultPrevented).toBe(false)
    expect(a).not.toHaveBeenCalled()
    act(() => useFolioPrefs.getState().setPrefs({ kbd: true }))
    press(button, 'a')
    expect(a).toHaveBeenCalledTimes(1)
  })

  it('stays off inside a Folio root marked data-kbd="off"', () => {
    const root = el('div', { 'data-folio': '', 'data-kbd': 'off' }, region)
    document.body.appendChild(root)
    const a = vi.fn()
    setup({ a })
    press(button, 'a')
    expect(a).not.toHaveBeenCalled()
    root.setAttribute('data-kbd', 'on')
    press(button, 'a')
    expect(a).toHaveBeenCalledTimes(1)
    root.remove()
  })

  it('calls the latest bindings without subscribing again', () => {
    const add = vi.spyOn(document, 'addEventListener')
    const first = vi.fn()
    const second = vi.fn()
    const { rerender } = setup({ a: first })
    rerender({ bindings: { a: second } })
    press(button, 'a')
    expect(first).not.toHaveBeenCalled()
    expect(second).toHaveBeenCalledTimes(1)
    expect(add.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(1)
    add.mockRestore()
  })

  it('stops listening on unmount', () => {
    const a = vi.fn()
    const { unmount } = setup({ a })
    unmount()
    expect(press(button, 'a').defaultPrevented).toBe(false)
    expect(a).not.toHaveBeenCalled()
  })
})
