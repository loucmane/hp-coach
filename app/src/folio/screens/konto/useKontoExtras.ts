import { useClerk, useUser } from '@clerk/clerk-react'
import { useRef, useState } from 'react'
import { downloadExport, useExportData } from '@/api/hooks/useDataExport'
import { useDeleteAccount } from '@/api/hooks/useDeleteAccount'
import { useSyncedPrefs } from '@/api/useSyncedPrefs'
import { useViewport } from '@/hooks/useViewport'
import { useCoachStore } from '@/stores/coachStore'
import { useDaysRemaining, useSitting } from '@/stores/examStore'
import { useUiStore } from '@/stores/uiStore'
import { type DeleteState, type ExportState, identityView, type Setting } from './kontoView'

/** All Folio data hooks stay behind the lazy screen boundary. */
export function useKontoExtras() {
  const { user } = useUser()
  const { signOut } = useClerk()
  const synced = useSyncedPrefs()
  const exportData = useExportData()
  const deleteAccount = useDeleteAccount()
  const viewport = useViewport()
  const days = useDaysRemaining()
  const sitting = useSitting()
  const coach = useCoachStore((s) => s.coach)
  const mode = useUiStore((s) => s.mode)
  const palette = useUiStore((s) => s.palette)
  const smartDrill = useUiStore((s) => s.smartDrill)
  const preview = useUiStore((s) => s.folioPreview)
  const setPreview = useUiStore((s) => s.setFolioPreview)
  const [saving, setSaving] = useState(false)
  const saveLock = useRef(false)
  const [failed, setFailed] = useState<Partial<Record<Setting, boolean>>>({})
  const [exported, setExported] = useState<ExportState>('idle')
  const exportLock = useRef(false)
  const [deletion, setDeletion] = useState<DeleteState>('idle')
  const deleteOnce = useRef(false)
  const signoutLock = useRef(false)
  const [logoutFailed, setLogoutFailed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  async function choose(key: Setting, run: () => Promise<unknown>) {
    // Serial writes also keep the synced setters' rollback snapshots valid.
    if (saveLock.current) return
    saveLock.current = true
    setSaving(true)
    setFailed((before) => ({ ...before, [key]: false }))
    try {
      await run()
    } catch {
      setFailed((before) => ({ ...before, [key]: true }))
    } finally {
      saveLock.current = false
      setSaving(false)
    }
  }
  async function exportNow() {
    if (exportLock.current) return
    exportLock.current = true
    setExported('pending')
    try {
      downloadExport(await exportData.mutateAsync())
      setExported('done')
    } catch {
      setExported('failed')
    } finally {
      exportLock.current = false
    }
  }
  async function finishSignOut() {
    if (signoutLock.current) return
    signoutLock.current = true
    setDeletion('signing-out')
    try {
      await signOut()
      setDeletion('done')
    } catch {
      setDeletion('signout-failed')
    } finally {
      signoutLock.current = false
    }
  }
  async function deleteNow() {
    if (deleteOnce.current) return
    deleteOnce.current = true
    setDeletion('pending')
    try {
      await deleteAccount.mutateAsync()
    } catch {
      deleteOnce.current = false
      setDeletion('failed')
      return
    }
    await finishSignOut()
  }
  async function logout() {
    if (signoutLock.current) return
    signoutLock.current = true
    setLoggingOut(true)
    setLogoutFailed(false)
    try {
      await signOut({ redirectUrl: '/' })
    } catch {
      setLogoutFailed(true)
    } finally {
      signoutLock.current = false
      setLoggingOut(false)
    }
  }
  return {
    identity: identityView(user),
    viewport,
    days,
    sitting,
    coach,
    mode,
    palette,
    smartDrill,
    preview,
    setPreview,
    synced,
    saving,
    failed,
    choose,
    exported,
    exportNow,
    deletion,
    deleteNow,
    finishSignOut,
    logout,
    logoutFailed,
    loggingOut,
  }
}
export type KontoExtras = ReturnType<typeof useKontoExtras>
