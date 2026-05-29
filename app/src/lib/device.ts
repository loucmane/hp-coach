// Coarse device class for resumption provenance ("pausad på telefon").
//
// Width-based, matched to the responsive frame's phone/reader/studio
// bands rather than UA sniffing — what matters for the resumption panel
// is "was I on the small screen or the big one", which width captures
// well and degrades gracefully. Read at write-time (on pause/start), not
// reactively.

export type DeviceKind = 'phone' | 'tablet' | 'desktop'

export function currentDevice(): DeviceKind {
  if (typeof window === 'undefined') return 'desktop'
  const w = window.innerWidth
  if (w < 768) return 'phone'
  if (w < 1100) return 'tablet'
  return 'desktop'
}

/** Swedish surface label for a device tag, or null when unknown. */
export function deviceLabel(d: DeviceKind | null | undefined): string | null {
  if (d === 'phone') return 'telefon'
  if (d === 'tablet') return 'surfplatta'
  if (d === 'desktop') return 'dator'
  return null
}
