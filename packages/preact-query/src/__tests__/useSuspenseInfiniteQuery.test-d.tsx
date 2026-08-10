import { skipToken } from '@tanstack/query-core'
import type { InfiniteData } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'

import type { UseSuspenseInfiniteQueryResult } from '../types'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'

describe('useSuspenseInfiniteQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseInfiniteQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, unknown>>()
  })

  it('should not allow skipToken in queryFn', () => {
    assertType(
      useSuspenseInfiniteQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: skipToken,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: queryKey(),
        // @ts-expect-error
        queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
      }),
    )
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseInfiniteQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should not allow placeholderData, enabled or throwOnError props', () => {
    assertType(
      useSuspenseInfiniteQuery({
        queryKey: queryKey(),
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
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: queryKey(),
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
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(query).not.toHaveProperty('isPlaceholderData')
  })
})

describe('NoInfer', () => {
  // eslint-disable-next-line vitest/expect-expect
  it('TData should depend only on the arguments, not the annotated result', () => {
    // @ts-expect-error
    const result: UseSuspenseInfiniteQueryResult<InfiniteData<{ wow: string }>> =
      useSuspenseInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => ({ wow: true }),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      })

    void result
  })

  it('should preserve discriminated-union narrowing on data', () => {
    type Item =
      | { type: 'first'; first: string }
      | { type: 'second'; second: string }

    const { data } = useSuspenseInfiniteQuery({
      queryKey: queryKey(),
      queryFn: (): Item => ({ type: 'first', first: 'a' }),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      select: (infiniteData) => infiniteData.pages[0],
    })

    const second = data?.type === 'first' ? undefined : data

    expectTypeOf(second).toEqualTypeOf<
      { type: 'second'; second: string } | undefined
    >()
  })
})
