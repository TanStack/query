import { describe, expect, it } from 'vitest'

import { infiniteQueryOptions } from '../infinite-query-options'
import type { CreateInfiniteQueryOptions } from '../types'

describe('infiniteQueryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object: CreateInfiniteQueryOptions = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    }

    expect(infiniteQueryOptions(object)).toStrictEqual(object)
  })
})
