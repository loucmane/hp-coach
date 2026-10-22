import { useContext, useEffect, useRef } from 'react'
import { ShellFocusContext } from './host'

/** Registers focus chrome; does not manipulate history or remount the session. */
export function useShellFocus({
  active = true,
  onExit,
}: {
  active?: boolean
  onExit?: () => void
} = {}) {
  const register = useContext(ShellFocusContext)
  const hasExit = !!onExit
  const latest = useRef(onExit)
  useEffect(() => {
    latest.current = onExit
  }, [onExit])
  useEffect(() => {
    if (!register || !active) return
    // An omitted callback is handled by the shell's remembered destination.
    register(hasExit ? { onExit: () => latest.current?.() } : {})
    return () => register(null)
  }, [register, active, hasExit])
}
