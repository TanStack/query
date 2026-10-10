import { QueryClient } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { describe, expectTypeOf, it } from 'vitest'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import type {
  InfiniteData,
  InfiniteQueryObserverResult,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { CreateInfiniteQueryOptions } from '../createInfiniteQueryController.js'

class Host extends LitElement {}

describe('pageParam', () => {
  it('should define type of param passed to queryFunctionContext with initialPageParam', () => {
    createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => {
          expectTypeOf(pageParam).toEqualTypeOf<number>()
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      new QueryClient(),
    )
  })

  it('should pass direction to queryFn of createInfiniteQueryController', () => {
    createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ direction }) => {
          expectTypeOf(direction).toEqualTypeOf<'forward' | 'backward'>()
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      new QueryClient(),
    )
  })
})

describe('select', () => {
  it('should still return paginated data if no select result', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      new QueryClient(),
    )

    // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
    expectTypeOf(infiniteQuery().data).toEqualTypeOf<
      InfiniteData<number, unknown> | undefined
    >()
  })

  it('should be able to transform data to arbitrary result', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<InfiniteData<number, number>>()
          return 'selected' as const
        },
      },
      new QueryClient(),
    )

    expectTypeOf(infiniteQuery().data).toEqualTypeOf<'selected' | undefined>()
  })
})

describe('getNextPageParam / getPreviousPageParam', () => {
  it('should get typed params', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
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
      },
      new QueryClient(),
    )

    // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
    expectTypeOf(infiniteQuery().data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
})

describe('error booleans', () => {
  it('should not be permanently `false`', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      },
      new QueryClient(),
    )
    const {
      isFetchNextPageError,
      isFetchPreviousPageError,
      isLoadingError,
      isRefetchError,
    } = infiniteQuery()

    expectTypeOf(isFetchNextPageError).toEqualTypeOf<boolean>()
    expectTypeOf(isFetchPreviousPageError).toEqualTypeOf<boolean>()
    expectTypeOf(isLoadingError).toEqualTypeOf<boolean>()
    expectTypeOf(isRefetchError).toEqualTypeOf<boolean>()
  })
})

describe('CreateInfiniteQueryOptions', () => {
  it('should default TData to InfiniteData<TQueryFnData>', () => {
    const options: CreateInfiniteQueryOptions<number, Error> = {
      queryKey: queryKey(),
      queryFn: () => 5,
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    }
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      options,
      new QueryClient(),
    )

    expectTypeOf(infiniteQuery().data).toEqualTypeOf<
      InfiniteData<number, unknown> | undefined
    >()
  })
})

describe('refetch / fetchNextPage / fetchPreviousPage', () => {
  it('should type refetch with correct return type', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => pageParam,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        getPreviousPageParam: (firstPage) => firstPage - 1,
      },
      new QueryClient(),
    )

    expectTypeOf(infiniteQuery.refetch()).toEqualTypeOf<
      Promise<QueryObserverResult<InfiniteData<number, unknown>, Error>>
    >()
  })

  it('should type fetchNextPage with correct return type', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => pageParam,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        getPreviousPageParam: (firstPage) => firstPage - 1,
      },
      new QueryClient(),
    )

    expectTypeOf(infiniteQuery.fetchNextPage()).toEqualTypeOf<
      Promise<InfiniteQueryObserverResult<InfiniteData<number, unknown>, Error>>
    >()
  })

  it('should type fetchPreviousPage with correct return type', () => {
    const infiniteQuery = createInfiniteQueryController(
      new Host(),
      {
        queryKey: queryKey(),
        queryFn: ({ pageParam }) => pageParam,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage + 1,
        getPreviousPageParam: (firstPage) => firstPage - 1,
      },
      new QueryClient(),
    )

    expectTypeOf(infiniteQuery.fetchPreviousPage()).toEqualTypeOf<
      Promise<InfiniteQueryObserverResult<InfiniteData<number, unknown>, Error>>
    >()
  })
})
