import { describe, expect, it } from 'vitest'
import { infiniteQueryOptions } from '../../src/index.js'

describe('infiniteQueryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    } as const

    expect(infiniteQueryOptions(object)).toBe(object)
  })
})
