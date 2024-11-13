import { describe, expect, it } from 'vitest'

import { infiniteQueryOptions } from '../infiniteQueryOptions'
import type { UseInfiniteQueryOptions } from '../types'

describe('infiniteQueryOptions', () => {
  it('should return the object received as a parameter without any modification.', () => {
    const object: UseInfiniteQueryOptions = {
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      getNextPageParam: () => null,
      initialPageParam: null,
    }

    expect(infiniteQueryOptions(object)).toStrictEqual(object)
  })
})
