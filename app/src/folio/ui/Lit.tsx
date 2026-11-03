import { type ComponentProps, useEffect } from 'react'

import { useFolioMotion } from '../lib/useFolioMotion'
import './ui.css'

let mounted = 0

/** Counts lit sheets: in development a second one means a broken screen state. */
function useOneLit() {
  useEffect(() => {
    mounted += 1
    if (import.meta.env.DEV && mounted > 1)
      console.warn(
        `Ljusbord: ${mounted} lit sheets are mounted. A screen state has one lit thing (rebuild map §1.4).`,
      )
    return () => {
      mounted -= 1
    }
  }, [])
}

export type LitProps = ComponentProps<'article'> & {
  as?: 'article' | 'section' | 'div' | 'aside'
}

/**
 * The one lit sheet of a screen state: `data-lit="true"`, the sheet and the
 * lift-2 elevation, rising in when motion allows. A screen test counts
 * `[data-lit="true"]`, and there must be exactly one.
 */
export function Lit({ as = 'article', className, ...rest }: LitProps) {
  const { level } = useFolioMotion()
  useOneLit()
  const Sheet = as as 'article'
  return (
    <Sheet
      {...rest}
      className={className ? `fa-ui-lit ${className}` : 'fa-ui-lit'}
      data-lit="true"
      data-motion={level}
    />
  )
}
