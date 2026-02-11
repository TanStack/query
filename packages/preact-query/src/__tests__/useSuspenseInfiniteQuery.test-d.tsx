import { skipToken } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { assertType, describe, expectTypeOf, it } from 'vitest'

import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'

describe('useSuspenseInfiniteQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, unknown>>()
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      useSuspenseInfiniteQuery({
        queryKey: ['key'],
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: ['key'],
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    assertType(
      useSuspenseInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2345
        placeholderData: 5,
        enabled: true,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2345
        throwOnError: true,
      }),
    )
  })

  it('should not return isPlaceholderData', () => {
    const query = useSuspenseInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(query).not.toHaveProperty('isPlaceholderData')
  })
})
