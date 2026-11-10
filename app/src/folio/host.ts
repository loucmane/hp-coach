import { createContext, type Dispatch, type ReactNode, type SetStateAction } from 'react'

import type { Section } from '@/data/questions'

// Lightweight: legacy layout components can consume this without loading the shell.
export const FolioHostContext = createContext(false)

export type FocusStripCell = {
  /** Stable question identity, including when skipped questions move to the end. */
  id: string
  /** Omitted for an unanswered question ahead. */
  state?: 'ok' | 'back' | 'cur'
  /** Keeps the halo on an answered cell (ok/back) while its facit is open. */
  current?: boolean
  onSelect: () => void
  disabled?: boolean
}
export type FocusStrip = { section: Section; cells: readonly FocusStripCell[] }
export type FocusAction = {
  label: string
  onClick: () => void
  disabled?: boolean
}
export type FocusDock = {
  primary: FocusAction & { kbd?: string }
  secondary?: FocusAction
  /** Caller-owned next-question detail; the shell never invents counts or times. */
  detail?: ReactNode
}

export type FocusRequest = {
  onExit?: () => void
  // null hides the exit action on terminal views while retaining focus chrome.
  exitLabel?: string | null
  strip?: FocusStrip
  where?: ReactNode
  dock?: FocusDock
}
export const ShellFocusContext = createContext<Dispatch<
  SetStateAction<FocusRequest | null>
> | null>(null)
