// /api/me/export + /api/me/import — full-account JSON backup/restore.
//
// Lock-in mitigation (task #28): the export is the user's own portable
// copy of everything HP-Coach knows about them, and import is the
// overwrite-mode restore. Both endpoints are typed via the Hono RPC
// client like the rest of the API surface — export returns the raw
// envelope object (the caller turns it into a downloadable Blob), import
// takes that same envelope shape as the POST body.

import { useMutation } from '@tanstack/react-query'

import { useApiClient } from '../useApiClient'

/** The export envelope shape. Deliberately loose (Record-of-unknown per
 *  table) on the client — the SPA never inspects these rows, it only
 *  round-trips them through download/upload. The worker owns the real
 *  validation on import. */
export type DataExportEnvelope = {
  schemaVersion: number
  exportedAt: string
  user: Record<string, unknown> | null
  tables: Record<string, unknown[]>
}

export type ImportResult = {
  ok: true
  restored: Record<string, number>
}

/** Fetch the full account export. Not a useQuery — this is triggered
 *  on-demand by a button press, not rendered reactively, so a plain
 *  mutation (no caching, no auto-refetch) is the right shape. */
export function useExportData() {
  const api = useApiClient()
  return useMutation({
    mutationFn: async (): Promise<DataExportEnvelope> => {
      const res = await api.api.me.export.$get()
      if (!res.ok) {
        throw new Error(`GET /api/me/export failed: ${res.status}`)
      }
      return (await res.json()) as DataExportEnvelope
    },
  })
}

/** POST a previously-exported envelope. Overwrite semantics — the caller
 *  MUST have already confirmed with the user before calling mutate(). */
export function useImportData() {
  const api = useApiClient()
  return useMutation({
    mutationFn: async (envelope: DataExportEnvelope): Promise<ImportResult> => {
      const res = await api.api.me.import.$post({ json: envelope as never })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        const message =
          body && typeof body === 'object' && 'error' in body
            ? // biome-ignore lint/suspicious/noExplicitAny: narrow error-shape unwrap from an unknown JSON body
              ((body as any).error?.message ?? `POST /api/me/import failed: ${res.status}`)
            : `POST /api/me/import failed: ${res.status}`
        throw new Error(message)
      }
      return (await res.json()) as ImportResult
    },
  })
}

/** Trigger a browser download of the export envelope as
 *  `hp-coach-backup-{YYYY-MM-DD}.json`. Pure DOM side effect — kept
 *  separate from the hook so it's trivially testable/mockable. */
export function downloadExport(envelope: DataExportEnvelope): void {
  const date = new Date().toISOString().slice(0, 10)
  const blob = new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `hp-coach-backup-${date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** Parse a File (from a file picker) into an export envelope, or throw a
 *  user-legible error if it isn't valid JSON / isn't envelope-shaped. The
 *  worker still does the authoritative validation on POST — this is just
 *  a fast client-side sanity check before we bother the user with the
 *  confirm dialog. */
export async function parseImportFile(file: File): Promise<DataExportEnvelope> {
  const text = await file.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Filen är inte giltig JSON.')
  }
  if (
    typeof json !== 'object' ||
    json === null ||
    !('schemaVersion' in json) ||
    !('tables' in json)
  ) {
    throw new Error('Filen ser inte ut som en HP-Coach-export.')
  }
  return json as DataExportEnvelope
}
