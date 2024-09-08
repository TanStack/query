import { describe, expectTypeOf, it } from 'vitest'
import { usePrefetchInfiniteQuery, usePrefetchQuery } from '..'

describe('usePrefetchQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      refetchInterval: 1000,
    })

    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      enabled: true,
    })

    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      throwOnError: true,
    })
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

  it('should require initialPageParam and getNextPageParam', () => {
    // @ts-expect-error TS2345
    usePrefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      refetchInterval: 1000,
    })

    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      enabled: true,
    })

    usePrefetchQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error TS2345
      throwOnError: true,
    })
  })
})
