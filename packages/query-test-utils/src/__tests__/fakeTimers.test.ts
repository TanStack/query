import { describe, expect, it, vi } from 'vitest'
import { fakeTimers } from '../fakeTimers'

describe('fakeTimers', () => {
  it('should switch back to real timers on dispose', () => {
    {
      using _timers = fakeTimers()
      expect(vi.isFakeTimers()).toBe(true)
    }
    expect(vi.isFakeTimers()).toBe(false)
  })
})
