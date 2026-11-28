import {
  QueryClient,
  infiniteQuery as infiniteQueryOption,
  isFetchNextPageError as isFetchNextPageErrorOption,
  isFetchPreviousPageError as isFetchPreviousPageErrorOption,
  isLoadingError as isLoadingErrorOption,
  isRefetchError as isRefetchErrorOption,
  select,
} from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { describe, expectTypeOf, it } from 'vitest'
import { infiniteQueryOptions, useQuery } from '..'
import type { InfiniteData } from '@tanstack/query-core'
import type { UseInfiniteQueryOptions } from '../types'

describe('pageParam', () => {
  it('should define type of param passed to queryFunctionContext with initialPageParam', () => {
    useQuery(
      infiniteQueryOptions({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          expectTypeOf(pageParam).toEqualTypeOf<number>()
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }),
    )
  })

  it('should define type of param passed to queryFunctionContext with initialPageParam for infiniteQuery', () => {
    const queryClient = new QueryClient()
    infiniteQueryOption(queryClient, {
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return Promise.resolve(pageParam)
      },
      getNextPageParam: () => undefined,
      initialPageParam: 1,
    })
  })
})

describe('select', () => {
  it('should still return paginated data if no select result', () => {
    const infiniteQuery = useQuery(
      infiniteQueryOptions({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }),
    )

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<number, number> | undefined
    >()
  })

  it('should be able to transform data to arbitrary result', () => {
    const infiniteQuery = useQuery(
      infiniteQueryOptions({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        select: [
          select,
          (data) => {
            expectTypeOf(data).toEqualTypeOf<InfiniteData<number, number>>()
            return 'selected' as const
          },
        ],
      }),
    )

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<'selected' | undefined>()
  })
})

describe('getNextPageParam / getPreviousPageParam', () => {
  it('should get typed params', () => {
    const infiniteQuery = useQuery(
      infiniteQueryOptions({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return String(pageParam)
        },
        initialPageParam: 1,
        getNextPageParam: (
          lastPage,
          allPages,
          lastPageParam,
          allPageParams,
        ) => {
          expectTypeOf(lastPage).toEqualTypeOf<string>()
          expectTypeOf(allPages).toEqualTypeOf<Array<string>>()
          expectTypeOf(lastPageParam).toEqualTypeOf<number>()
          expectTypeOf(allPageParams).toEqualTypeOf<Array<number>>()
          return undefined
        },
        getPreviousPageParam: (
          firstPage,
          allPages,
          firstPageParam,
          allPageParams,
        ) => {
          expectTypeOf(firstPage).toEqualTypeOf<string>()
          expectTypeOf(allPages).toEqualTypeOf<Array<string>>()
          expectTypeOf(firstPageParam).toEqualTypeOf<number>()
          expectTypeOf(allPageParams).toEqualTypeOf<Array<number>>()
          return undefined
        },
      }),
    )

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<string, number> | undefined
    >()
  })
})

describe('error booleans', () => {
  it('should not be permanently `false`', () => {
    const result = useQuery(
      infiniteQueryOptions({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }),
    )
    const isFetchNextPageError = isFetchNextPageErrorOption(result)
    const isFetchPreviousPageError = isFetchPreviousPageErrorOption(result)
    const isLoadingError = isLoadingErrorOption(result)
    const isRefetchError = isRefetchErrorOption(result)

    expectTypeOf(isFetchNextPageError).toEqualTypeOf<boolean>()
    expectTypeOf(isFetchPreviousPageError).toEqualTypeOf<boolean>()
    expectTypeOf(isLoadingError).toEqualTypeOf<boolean>()
    expectTypeOf(isRefetchError).toEqualTypeOf<boolean>()
  })
})

describe('UseInfiniteQueryOptions', () => {
  it('should default TData to InfiniteData<TQueryFnData>', () => {
    const options: UseInfiniteQueryOptions<number, Error> = {
      queryKey: createKey(),
      queryFn: () => 5,
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    }
    const infiniteQuery = useQuery(infiniteQueryOptions(options))

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<number, unknown> | undefined
    >()
  })
})
