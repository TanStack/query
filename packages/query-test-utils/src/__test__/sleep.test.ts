import { describe, expect, it } from 'vitest'
import { sleep } from '../sleep'

describe('sleep', () => {
  it('should sleep for the given amount of time', async () => {
    const start = Date.now()
    await sleep(100)
    const end = Date.now()
    expect(end - start).toBeGreaterThanOrEqual(100)
  })
})
