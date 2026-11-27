import { QueryClient } from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { selectOption } from '@tanstack/query-test-utils/projection'
import { describe, expectTypeOf, it } from 'vitest'
import { useInfiniteQuery } from '../useInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'
import type { NumericPageParam } from '@tanstack/query-test-utils/descriptors'
import type { UseInfiniteQueryOptions } from '../types'

describe('pageParam', () => {
  it('should define type of param passed to queryFunctionContext with initialPageParam', () => {
    useInfiniteQuery({
      queryKey: createKey(),
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
  })

  it('should define type of param passed to queryFunctionContext with initialPageParam for infiniteQuery', () => {
    const queryClient = new QueryClient()
    queryClient.infiniteQuery({
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
    const infiniteQuery = useInfiniteQuery({
      queryKey: createKey(),
      queryFn: ({ pageParam }) => {
        return pageParam * 5
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<number, NumericPageParam> | undefined
    >()
  })

  it('should be able to transform data to arbitrary result', () => {
    const infiniteQuery = useInfiniteQuery({
      queryKey: createKey(),
      queryFn: ({ pageParam }) => {
        return pageParam * 5
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
      [selectOption]: (data) => {
        expectTypeOf(data).toEqualTypeOf<InfiniteData<number, number>>()
        return 'selected' as const
      },
    })

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<'selected' | undefined>()
  })
})

describe('getNextPageParam / getPreviousPageParam', () => {
  it('should get typed params', () => {
    const infiniteQuery = useInfiniteQuery({
      queryKey: createKey(),
      queryFn: ({ pageParam }) => {
        return String(pageParam)
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) => {
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
    })

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<string, NumericPageParam> | undefined
    >()
  })
})

describe('error booleans', () => {
  it('should not be permanently `false`', () => {
    const result = useInfiniteQuery({
      queryKey: createKey(),
      queryFn: ({ pageParam }) => {
        return pageParam * 5
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
    const isFetchNextPageError = result.isFetchNextPageError
    const isFetchPreviousPageError = result.isFetchPreviousPageError
    const isLoadingError = result.isLoadingError
    const isRefetchError = result.isRefetchError

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
    const infiniteQuery = useInfiniteQuery(options)

    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<number, unknown> | undefined
    >()
  })
})
