import { createKey } from '@tanstack/query-test-utils'
import { reusesQueryOptions } from '@tanstack/query-test-utils/descriptors'
import { describe, expect, it } from 'vitest'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { UseInfiniteQueryOptions } from '../types'

describe('infiniteQueryOptions', () => {
  it('should preserve the options with the reference identity promised by the package', () => {
    const object: UseInfiniteQueryOptions = {
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    }

    const result = infiniteQueryOptions(object)
    expect(result === object).toBe(reusesQueryOptions)
    expect(result).toMatchObject(object)
  })
})
