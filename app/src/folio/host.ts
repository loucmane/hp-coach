import { createContext } from 'react'

// Lightweight: legacy layout components can consume this without loading the shell.
export const FolioHostContext = createContext(false)

export type FocusRequest = { onExit?: () => void }
export const ShellFocusContext = createContext<((request: FocusRequest | null) => void) | null>(
  null,
)
