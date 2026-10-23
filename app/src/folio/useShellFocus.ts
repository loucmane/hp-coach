import { useContext, useEffect, useRef } from 'react'
import { type FocusRequest, ShellFocusContext } from './host'

/** Registers focus chrome; does not manipulate history or remount the session. */
export function useShellFocus({
  active = true,
  onExit,
  exitLabel,
}: {
  active?: boolean
  onExit?: () => void
  exitLabel?: string | null
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
    const request: FocusRequest = {
      ...(hasExit ? { onExit: () => latest.current?.() } : {}),
      exitLabel,
    }
    register(request)
    // A lazy child can register before its parent's passive cleanup runs.
    // Only release this effect's own request, never a newer focus owner.
    return () => register((current) => (current === request ? null : current))
  }, [register, active, hasExit, exitLabel])
}
