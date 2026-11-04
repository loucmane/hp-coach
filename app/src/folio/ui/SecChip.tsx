import type { ComponentProps } from 'react'

import type { Section } from '@/data/questions'
import './ui.css'

/** A section's token key: `--fa-sec-<key>`, with its `-ink` and `-soft`. */
export type SecKey = 'ord' | 'las' | 'mek' | 'elf' | 'xyz' | 'kva' | 'nog' | 'dtk'

export const SEC_KEY: Readonly<Record<Section, SecKey>> = {
  ORD: 'ord',
  LÄS: 'las',
  MEK: 'mek',
  ELF: 'elf',
  XYZ: 'xyz',
  KVA: 'kva',
  NOG: 'nog',
  DTK: 'dtk',
}

export type SecChipProps = Omit<ComponentProps<'span'>, 'children'> & {
  section: Section
  /** The chapter heading's chip (kapitel). */
  size?: 'l'
}

/**
 * The section chip: the section's code in its `-ink` on its `-soft` tint,
 * led by a dot of the hue. This colour is data, the section's identity.
 */
export function SecChip({ section, size, className, ...rest }: SecChipProps) {
  return (
    <span
      {...rest}
      className={className ? `fa-ui-sec ${className}` : 'fa-ui-sec'}
      data-sec={SEC_KEY[section]}
      data-size={size}
    >
      {section}
    </span>
  )
}
