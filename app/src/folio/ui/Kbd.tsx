import type { ComponentProps } from 'react'

import { useFolioPrefs } from '../lib/folioPrefs'
import './ui.css'

export type KbdProps = ComponentProps<'kbd'> & {
  /** Spoken in place of a glyph a screen reader would garble ("Enter" for ↵). */
  label?: string
}

/**
 * A key cap. It hints at a single-key shortcut, so it is not drawn while
 * Konto's Enbokstavs-kortkommandon is off; ui.css also hides it under
 * `[data-folio][data-kbd='off']`.
 */
export function Kbd({ label, className, children, ...rest }: KbdProps) {
  const shortcuts = useFolioPrefs((s) => s.kbd)
  if (!shortcuts) return null
  return (
    <kbd {...rest} className={className ? `fa-ui-kbd ${className}` : 'fa-ui-kbd'}>
      {label ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="fa-ui-sr">{label}</span>
        </>
      ) : (
        children
      )}
    </kbd>
  )
}

/** A hint row of caps and words ("J K nästa och förra fällan"); it goes with its caps. */
export function Keys({ className, ...rest }: ComponentProps<'span'>) {
  const shortcuts = useFolioPrefs((s) => s.kbd)
  if (!shortcuts) return null
  return <span {...rest} className={className ? `fa-ui-keys ${className}` : 'fa-ui-keys'} />
}
