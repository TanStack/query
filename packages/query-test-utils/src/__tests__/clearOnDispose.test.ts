import { describe, expect, it, vi } from 'vitest'
import { clearOnDispose } from '../clearOnDispose'

describe('clearOnDispose', () => {
  it('should clear the client on dispose', () => {
    const clear = vi.fn<() => void>()
    {
      using client = clearOnDispose({ clear })
      expect(client.clear).toBe(clear)
      expect(clear).not.toHaveBeenCalled()
    }
    expect(clear).toHaveBeenCalledTimes(1)
  })
})
