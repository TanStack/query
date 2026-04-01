import { assertType, describe, expectTypeOf, it } from 'vitest'
import { ref } from 'vue-demi'
import { skipToken } from '@tanstack/query-core'
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
    assertType(
      // @ts-expect-error TS2345
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
      }),
    )
  })

  it('should not allow refetchInterval, enabled or throwOnError options', () => {
    assertType(
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        refetchInterval: 1000,
      }),
    )

    assertType(
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        enabled: true,
      }),
    )

    assertType(
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2353
        throwOnError: true,
      }),
    )
  })

  it('should accept refs in infinite query options', () => {
    assertType(
      usePrefetchInfiniteQuery({
        queryKey: ['key', ref('id')],
        queryFn: () => Promise.resolve(5),
        initialPageParam: ref(1),
        getNextPageParam: () => 1,
        staleTime: ref(1000),
      }),
    )
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )

    assertType(
      usePrefetchInfiniteQuery({
        queryKey: ['key'],
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })
})
