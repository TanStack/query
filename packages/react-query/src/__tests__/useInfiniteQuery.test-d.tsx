import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { useInfiniteQuery } from '../useInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'

describe('pageParam', () => {
  it('initialPageParam should define type of param passed to queryFunctionContext', () => {
    useInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
  })

  it('direction should be passed to queryFn of useInfiniteQuery', () => {
    useInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ direction }) => {
        expectTypeOf(direction).toEqualTypeOf<'forward' | 'backward'>()
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
  })

  it('initialPageParam should define type of param passed to queryFunctionContext for fetchInfiniteQuery', () => {
    const queryClient = new QueryClient()
    queryClient.fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
      },
      initialPageParam: 1,
      mode: 'imperative',
    })
  })

  it('initialPageParam should define type of param passed to queryFunctionContext for prefetchInfiniteQuery', () => {
    const queryClient = new QueryClient()
    queryClient.prefetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
      },
      initialPageParam: 1,
      mode: 'imperative',
    })
  })

  it('should require pageParam on imperative fetch methods', () => {
    const infiniteQuery = useInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return pageParam * 5
      },
      initialPageParam: 1,
      mode: 'imperative',
    })

    infiniteQuery.fetchNextPage({ pageParam: 2 })
    infiniteQuery.fetchPreviousPage({ pageParam: 0 })

    // @ts-expect-error pageParam is required in imperative mode
    infiniteQuery.fetchNextPage()
  })
})
describe('select', () => {
  it('should still return paginated data if no select result', () => {
    const infiniteQuery = useInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        return pageParam * 5
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })

    // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<number, unknown> | undefined
    >()
  })

  it('should be able to transform data to arbitrary result', () => {
    const infiniteQuery = useInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        return pageParam * 5
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
      select: (data) => {
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
      queryKey: ['key'],
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

    // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
    expectTypeOf(infiniteQuery.data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })

  it('should infer async object page types for getNextPageParam', () => {
    useInfiniteQuery({
      queryKey: ['key'],
      queryFn: async ({ pageParam = 0 }) => {
        return {
          nextCursor: pageParam + 1,
          data: `page-${pageParam}`,
        }
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage) => {
        expectTypeOf(lastPage).toEqualTypeOf<{
          nextCursor: number
          data: string
        }>()
        return lastPage.nextCursor
      },
      retry: false,
    })
  })
})

describe('error booleans', () => {
  it('should not be permanently `false`', () => {
    const {
      isFetchNextPageError,
      isFetchPreviousPageError,
      isLoadingError,
      isRefetchError,
    } = useInfiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        return pageParam * 5
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })

    expectTypeOf(isFetchNextPageError).toEqualTypeOf<boolean>()
    expectTypeOf(isFetchPreviousPageError).toEqualTypeOf<boolean>()
    expectTypeOf(isLoadingError).toEqualTypeOf<boolean>()
    expectTypeOf(isRefetchError).toEqualTypeOf<boolean>()
  })
})
