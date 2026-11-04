import type { ComponentProps, ReactNode } from 'react'

import { useFolioPrefs } from '../lib/folioPrefs'
import { useFolioMotion } from '../lib/useFolioMotion'
import { Kbd } from './Kbd'
import './ui.css'

type GoOwn = {
  /** The key cap after the label (↵). Left out of the name; hidden with kbd=off and in the phone dock. */
  kbd?: ReactNode
  /** The screen's own binding as `aria-keyshortcuts` ("Enter"); dropped while shortcuts are off. */
  keyshortcuts?: string
  /** The phone dock's action: on a phone it spans the dock and drops the hint. */
  dock?: boolean
  /** Full width, the label left and the hint right. */
  wide?: boolean
}
type GoButton = GoOwn & Omit<ComponentProps<'button'>, keyof GoOwn> & { href?: undefined }
type GoLink = GoOwn & Omit<ComponentProps<'a'>, keyof GoOwn> & { href: string }
export type GoProps = GoButton | GoLink

/**
 * The single ink-filled action of a screen state (map §1.4): a real link
 * with an `href`, otherwise a button. A palette may tint it (`--fa-go`).
 */
export function Go({ kbd, keyshortcuts, dock, wide, className, children, ...rest }: GoProps) {
  const shortcuts = useFolioPrefs((s) => s.kbd)
  const { level } = useFolioMotion()
  const look = {
    className: className ? `fa-ui-go ${className}` : 'fa-ui-go',
    'data-motion': level,
    'data-dock': dock ? '' : undefined,
    'data-wide': wide ? '' : undefined,
    'aria-keyshortcuts': shortcuts ? keyshortcuts : undefined,
  }
  const inner = (
    <>
      <span className="fa-ui-go-label">{children}</span>
      {kbd ? <Kbd aria-hidden="true">{kbd}</Kbd> : null}
    </>
  )
  if (rest.href !== undefined)
    return (
      <a {...rest} {...look}>
        {inner}
      </a>
    )
  return (
    <button type="button" {...rest} {...look}>
      {inner}
    </button>
  )
}
