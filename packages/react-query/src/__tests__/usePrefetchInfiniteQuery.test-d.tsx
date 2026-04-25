import { assertType, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { usePrefetchInfiniteQuery } from '..'

describe('usePrefetchInfiniteQuery', () => {
  it('should return nothing', () => {
    const result = usePrefetchInfiniteQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(result).toEqualTypeOf<void>()
  })

  it('should require initialPageParam and getNextPageParam', () => {
    assertType(
      // @ts-expect-error TS2345
      usePrefetchInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
      }),
    )
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    assertType(
      usePrefetchInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        refetchInterval: 1000,
      }),
    )

    assertType(
      usePrefetchInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        enabled: true,
      }),
    )

    assertType(
      usePrefetchInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        throwOnError: true,
      }),
    )
  })
})
