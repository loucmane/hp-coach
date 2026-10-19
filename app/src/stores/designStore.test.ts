import { beforeEach, describe, expect, it, vi } from 'vitest'

const gate = vi.hoisted(() => ({ enabled: true }))
vi.mock('@/lib/devSurface', () => ({ isDevSurface: () => gate.enabled }))

beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  gate.enabled = true
})

describe('device-local design direction', () => {
  it('starts in the normal app and persists all eight directions and off across reloads', async () => {
    let { useDesignStore, DESIGN_DIRECTIONS } = await import('./designStore')
    expect(useDesignStore.getState().direction).toBeNull()
    for (const direction of [...DESIGN_DIRECTIONS.map((d) => d.key), null]) {
      useDesignStore.getState().setDirection(direction)
      expect(JSON.parse(localStorage.getItem('hpc-design-direction')!)).toBe(direction)
      vi.resetModules()
      ;({ useDesignStore } = await import('./designStore'))
      expect(useDesignStore.getState().direction).toBe(direction)
    }
  })

  it.each([
    'broken json',
    '"unknown"',
    '{}',
    '42',
  ])('ignores corrupt stored selection %s', async (value) => {
    localStorage.setItem('hpc-design-direction', value)
    const { useDesignStore } = await import('./designStore')
    expect(useDesignStore.getState().direction).toBeNull()
  })

  it('ignores selection writes outside the dev surface', async () => {
    localStorage.setItem('hpc-design-direction', '"a"')
    gate.enabled = false
    const { useDesignStore } = await import('./designStore')
    useDesignStore.getState().setDirection('h')
    expect(localStorage.getItem('hpc-design-direction')).toBe('"a"')
  })

  it('still switches in memory when storage is unavailable', async () => {
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage denied')
    })
    try {
      const { useDesignStore } = await import('./designStore')
      expect(useDesignStore.getState().direction).toBeNull()
      expect(() => useDesignStore.getState().setDirection('c')).not.toThrow()
      expect(useDesignStore.getState().direction).toBe('c')
    } finally {
      read.mockRestore()
      write.mockRestore()
    }
  })
})
