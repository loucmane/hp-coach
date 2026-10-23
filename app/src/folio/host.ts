import { createContext, type Dispatch, type SetStateAction } from 'react'

// Lightweight: legacy layout components can consume this without loading the shell.
export const FolioHostContext = createContext(false)

// null hides the exit action on terminal views while retaining focus chrome.
export type FocusRequest = { onExit?: () => void; exitLabel?: string | null }
export const ShellFocusContext = createContext<Dispatch<
  SetStateAction<FocusRequest | null>
> | null>(null)
