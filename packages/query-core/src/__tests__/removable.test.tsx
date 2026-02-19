import { describe, expect, test } from 'vitest'
import { Removable } from '../removable'

class TestRemovable extends Removable {
  removed = 0

  optionalRemove() {
    this.removed++
  }

  // expose protected method for testing
  public _updateGcTime(v: number | undefined) {
    this.updateGcTime(v)
  }
}

describe('removable (windowless env)', () => {
  test('defaults gcTime to 5 minutes when window is undefined', () => {
    const originalWindow = (globalThis as any).window
    // simulate windowless client runtime (vscode/chrome extension contexts)
    ;(globalThis as any).window = undefined

    try {
      const r = new TestRemovable()
      r._updateGcTime(undefined)

      expect(r.gcTime).toBe(5 * 60 * 1000)
    } finally {
      ;(globalThis as any).window = originalWindow
    }
  })
})
