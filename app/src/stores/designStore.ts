import { create } from 'zustand'

import { isDevSurface } from '@/lib/devSurface'

// Type-only import expressions erase completely; this eager module must
// never pull the registry, fixtures, fonts or stages into the app bundle.
export type DirectionKey = import('@/components/devbake/redesign/r1Kit').DirectionKey

// Small label mirror, pinned to the lazy registry by the bundle guard test.
export const DESIGN_DIRECTIONS = [
  { key: 'a', name: 'Folio' },
  { key: 'b', name: 'Instrument' },
  { key: 'c', name: 'Spår' },
  { key: 'd', name: 'Lager' },
  { key: 'e', name: 'Svep' },
  { key: 'f', name: 'Samtal' },
  { key: 'g', name: 'Raster' },
  { key: 'h', name: 'Ljuskägla' },
] as const satisfies readonly { key: DirectionKey; name: string }[]

const STORAGE_KEY = 'hpc-design-direction'

function validDirection(value: unknown): DirectionKey | null {
  return DESIGN_DIRECTIONS.find((d) => d.key === value)?.key ?? null
}

function readDirection(): DirectionKey | null {
  try {
    return validDirection(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'))
  } catch {
    // SSR, private browsing and corrupt storage all start in the normal app.
    return null
  }
}

type DesignState = {
  /** Saved preference. UI consumers must use useDesignDirection for the dev gate. */
  direction: DirectionKey | null
  setDirection: (direction: DirectionKey | null) => void
}

export const useDesignStore = create<DesignState>((set) => ({
  direction: readDirection(),
  setDirection: (value) => {
    if (!isDevSurface()) return
    const direction = validDirection(value)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(direction))
    } catch {
      // A blocked localStorage must not prevent switching off the preview.
    }
    set({ direction })
  },
}))

/** Stored opt-in cannot enable direction code in a non-dev session. */
export function useDesignDirection(): DirectionKey | null {
  const direction = useDesignStore((s) => s.direction)
  return isDevSurface() ? direction : null
}
