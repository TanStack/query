import { describe, expectTypeOf, it } from 'vitest'
import { usePrefetchInfiniteQuery, usePrefetchQuery } from '../prefetch'

describe('usePrefetchQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })
})

describe('useInfinitePrefetchQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })
})
