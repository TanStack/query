import { describe, expect, it } from 'vitest'
import { createKey } from '@tanstack/query-test-utils'
import { infiniteQueryOptions } from '../infiniteQueryOptions'

describe('infiniteQueryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object = {
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    } as const

    expect(infiniteQueryOptions(object)).toBe(object)
  })
})
