import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sleep } from '../sleep'

describe('sleep', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should sleep for the given amount of time', async () => {
    const onResolve = vi.fn<() => void>()

    void sleep(100).then(onResolve)

    await vi.advanceTimersByTimeAsync(99)
    expect(onResolve).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(onResolve).toHaveBeenCalledTimes(1)
  })
})
