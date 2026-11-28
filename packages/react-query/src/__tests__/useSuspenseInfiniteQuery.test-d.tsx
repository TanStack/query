import {
  isSuccess,
  keepPreviousData,
  placeholderData,
  select,
  skipToken,
} from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { suspenseInfiniteQueryOptions, useQuery } from '..'
import type { InfiniteData } from '@tanstack/query-core'
import type { UseSuspenseInfiniteQueryOptions } from '../types'

describe('useSuspenseInfiniteQuery', () => {
  it('should always have data defined', () => {
    const { data } = useQuery(
      suspenseInfiniteQueryOptions({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      }),
    )

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, number>>()
  })

  it('should allow undefined data when queryFn can be skipToken', () => {
    const result = useQuery(
      suspenseInfiniteQueryOptions({
        queryKey: createKey(),
        queryFn:
          Math.random() > 0.5
            ? skipToken
            : ({ pageParam }) => pageParam.toFixed(),
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        select: [select, (data) => data.pages],
      }),
    )

    expectTypeOf(result.data).toEqualTypeOf<Array<string> | undefined>()
    if (isSuccess(result)) {
      expectTypeOf(result.data).toEqualTypeOf<Array<string>>()
    }
    expectTypeOf(result.isPlaceholderData).toEqualTypeOf<boolean>()
    expectTypeOf(result.fetchNextPage).toBeFunction()
  })

  it('should not have pending status', () => {
    const { status } = useQuery(
      suspenseInfiniteQueryOptions({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      }),
    )

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should allow placeholderData', () => {
    const query = useQuery(
      suspenseInfiniteQueryOptions({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        placeholderData: placeholderData(keepPreviousData),
      }),
    )

    expectTypeOf(query.data).toEqualTypeOf<InfiniteData<number, number>>()
    expectTypeOf(query.isPlaceholderData).toEqualTypeOf<boolean>()

    const selected = useQuery(
      suspenseInfiniteQueryOptions({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        placeholderData: [
          placeholderData,
          (previousData) => {
            expectTypeOf(previousData).toEqualTypeOf<
              InfiniteData<number, number> | undefined
            >()
            return previousData ?? { pages: [0], pageParams: [1] }
          },
        ],
        select: [select, (data) => data.pages.length],
      }),
    )

    expectTypeOf(selected.data).toEqualTypeOf<number>()
  })

  it('should not allow enabled or throwOnError props', () => {
    assertType(
      useQuery(
        suspenseInfiniteQueryOptions({
          queryKey: createKey(),
          queryFn: () => Promise.resolve(5),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          placeholderData: placeholderData({
            pages: [5],
            pageParams: [1],
          }),
          // @ts-expect-error TS2345
          enabled: true,
        }),
      ),
    )

    assertType(
      useQuery(
        suspenseInfiniteQueryOptions({
          queryKey: createKey(),
          queryFn: () => Promise.resolve(5),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          // @ts-expect-error TS2345
          enabled: true,
        }),
      ),
    )

    assertType(
      useQuery(
        suspenseInfiniteQueryOptions({
          queryKey: createKey(),
          queryFn: () => Promise.resolve(5),
          initialPageParam: 1,
          getNextPageParam: () => 1,
          // @ts-expect-error TS2345
          throwOnError: true,
        }),
      ),
    )
  })

  it('should default TData of UseSuspenseInfiniteQueryOptions to InfiniteData<TQueryFnData>', () => {
    const options: UseSuspenseInfiniteQueryOptions<number, Error> = {
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    }
    const { data } = useQuery(suspenseInfiniteQueryOptions(options))

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, unknown>>()
  })

  it('should return isPlaceholderData', () => {
    const query = useQuery(
      suspenseInfiniteQueryOptions({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      }),
    )

    expectTypeOf(query).toHaveProperty('isPlaceholderData')
  })
})
