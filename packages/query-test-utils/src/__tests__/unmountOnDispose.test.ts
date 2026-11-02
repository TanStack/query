import { describe, expect, it, vi } from 'vitest'
import { unmountOnDispose } from '../unmountOnDispose'

describe('unmountOnDispose', () => {
  it('should unmount on dispose', () => {
    const unmount = vi.fn<() => void>()
    {
      using rendered = unmountOnDispose({ unmount })
      expect(rendered.unmount).toBe(unmount)
      expect(unmount).not.toHaveBeenCalled()
    }
    expect(unmount).toHaveBeenCalledTimes(1)
  })
})
