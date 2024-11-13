import { describe, expectTypeOf, it } from 'vitest'
import { usePrefetchInfiniteQuery } from '..'

describe('usePrefetchInfiniteQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should require initialPageParam and getNextPageParam', () => {
    // @ts-expect-error TS2345
    usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      // @ts-expect-error TS2353
      refetchInterval: 1000,
    })

    usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      // @ts-expect-error TS2353
      enabled: true,
    })

    usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      // @ts-expect-error TS2353
      throwOnError: true,
    })
  })
})
