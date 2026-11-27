import { keepPreviousData, skipToken } from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import {
  placeholderOption,
  selectOption,
} from '@tanstack/query-test-utils/projection'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'
import type { NumericPageParam } from '@tanstack/query-test-utils/descriptors'
import type { UseSuspenseInfiniteQueryOptions } from '../types'

describe('useSuspenseInfiniteQuery', () => {
  it('should always have data defined', () => {
    const { data } = useSuspenseInfiniteQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, NumericPageParam>>()
  })

  it('should allow undefined data when queryFn can be skipToken', () => {
    const result = useSuspenseInfiniteQuery({
      queryKey: createKey(),
      queryFn:
        Math.random() > 0.5
          ? skipToken
          : ({ pageParam }) => pageParam.toFixed(),
      initialPageParam: 1,
      getNextPageParam: () => undefined,
      [selectOption]: (data) => data.pages,
    })

    expectTypeOf(result.data).toEqualTypeOf<Array<string> | undefined>()
    if (result.isSuccess) {
      expectTypeOf(result.data).toEqualTypeOf<Array<string>>()
    }
    expectTypeOf(result.isPlaceholderData).toEqualTypeOf<boolean>()
    expectTypeOf(result.fetchNextPage).toBeFunction()
  })

  it('should not have pending status', () => {
    const { status } = useSuspenseInfiniteQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(status).toEqualTypeOf<'error' | 'success'>()
  })

  it('should allow placeholderData', () => {
    const query = useSuspenseInfiniteQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      [placeholderOption]: keepPreviousData,
    })

    expectTypeOf(query.data).toEqualTypeOf<
      InfiniteData<number, NumericPageParam>
    >()
    expectTypeOf(query.isPlaceholderData).toEqualTypeOf<boolean>()

    const selected = useSuspenseInfiniteQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
      [placeholderOption]: (previousData) => {
        expectTypeOf(previousData).toEqualTypeOf<
          InfiniteData<number, number> | undefined
        >()
        return previousData ?? { pages: [0], pageParams: [1] }
      },
      [selectOption]: (data) => data.pages.length,
    })

    expectTypeOf(selected.data).toEqualTypeOf<number>()
  })

  it('should not allow enabled or throwOnError props', () => {
    assertType(
      useSuspenseInfiniteQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        [placeholderOption]: { pages: [5], pageParams: [1] },
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: createKey(),
        queryFn: () => Promise.resolve(5),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        // @ts-expect-error TS2345
        enabled: true,
      }),
    )

    assertType(
      useSuspenseInfiniteQuery({
        queryKey: createKey(),
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
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    }
    const { data } = useSuspenseInfiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<number, unknown>>()
  })

  it('should return isPlaceholderData', () => {
    const query = useSuspenseInfiniteQuery({
      queryKey: createKey(),
      queryFn: () => Promise.resolve(5),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })

    expectTypeOf(query).toHaveProperty('isPlaceholderData')
  })
})
