import { describe, expect, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import type { CreateInfiniteQueryOptions } from '../createInfiniteQueryController.js'

describe('infiniteQueryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object: CreateInfiniteQueryOptions = {
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    }

    expect(infiniteQueryOptions(object)).toBe(object)
  })
})
