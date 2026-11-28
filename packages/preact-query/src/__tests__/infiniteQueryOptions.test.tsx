import { createKey } from '@tanstack/query-test-utils'
import { describe, expect, it } from 'vitest'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { UseInfiniteQueryOptions } from '../types'

describe('infiniteQueryOptions', () => {
  it('should create a new descriptor and preserve the supplied options', () => {
    const object: UseInfiniteQueryOptions = {
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    }

    const result = infiniteQueryOptions(object)
    expect(result).not.toBe(object)
    expect(result).toMatchObject(object)
  })
})
