import { assertType, describe, expectTypeOf, it } from 'vitest'
import { keepPreviousData, skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'
import type { UseSuspenseInfiniteQueryOptions } from '../types'

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

  it('should allow placeholderData', () => {
    const query = useSuspenseInfiniteQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      placeholderData: keepPreviousData,
    })

    expectTypeOf(query.data).toEqualTypeOf<InfiniteData<number, unknown>>()
    expectTypeOf(query.isPlaceholderData).toEqualTypeOf<boolean>()

    const selected = useSuspenseInfiniteQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      placeholderData: (previousData) => {
        expectTypeOf(previousData).toEqualTypeOf<
          InfiniteData<number, number> | undefined
        >()
        return previousData ?? { pages: [0], pageParams: [1] }
      },
      select: (data) => data.pages.length,
    })

    expectTypeOf(selected.data).toEqualTypeOf<number>()
  })

  it('should not allow enabled or throwOnError props', () => {
    assertType(
      useSuspenseInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        placeholderData: { pages: [5], pageParams: [1] },
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

  it('should default TData of UseSuspenseInfiniteQueryOptions to InfiniteData<TQueryFnData>', () => {
    const options: UseSuspenseInfiniteQueryOptions<number, Error> = {
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    }
    const { data } = useSuspenseInfiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, unknown>>()
  })

  it('should return isPlaceholderData', () => {
    const query = useSuspenseInfiniteQuery({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(query).toHaveProperty('isPlaceholderData')
  })
})
