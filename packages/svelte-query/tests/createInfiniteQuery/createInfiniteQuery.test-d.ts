import { QueryClient } from '@tanstack/query-core'
import { createKey } from '@tanstack/query-test-utils'
import { describe, expectTypeOf, it } from 'vitest'
import { createInfiniteQuery, infiniteQueryOptions } from '../../src/index.js'
import type { InfiniteData } from '@tanstack/query-core'

describe('createInfiniteQuery', () => {
  describe('pageParam', () => {
    it('should define type of param passed to queryFunctionContext with initialPageParam', () => {
      createInfiniteQuery(() => ({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          expectTypeOf(pageParam).toEqualTypeOf<number>()
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }))
    })

    it('should define type of param passed to queryFunctionContext with initialPageParam for infiniteQuery', () => {
      const queryClient = new QueryClient()
      queryClient.infiniteQuery({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          expectTypeOf(pageParam).toEqualTypeOf<number>()
        },
        getNextPageParam: () => undefined,
        initialPageParam: 1,
      })
    })
  })

  describe('initialData', () => {
    it('should always define TData when initialData is provided', () => {
      const infiniteQuery = createInfiniteQuery(() => ({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        initialData: { pages: [5], pageParams: [1] },
      }))

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<number, unknown>
      >()
    })

    it('should always define TData when initialData is provided through infiniteQueryOptions', () => {
      const options = infiniteQueryOptions({
        queryKey: createKey(),
        queryFn: ({ pageParam }: { pageParam: number }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        initialData: { pages: [5], pageParams: [1] },
      })
      const infiniteQuery = createInfiniteQuery(() => options)

      // known issue: type of pageParams is unknown when returned from createInfiniteQuery
      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<number, unknown>
      >()
    })

    it('should have undefined in the TData union when initialData is NOT provided', () => {
      const infiniteQuery = createInfiniteQuery(() => ({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }))

      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<number, unknown> | undefined
      >()
    })
  })

  describe('select', () => {
    it('should still return paginated data if no select result', () => {
      const infiniteQuery = createInfiniteQuery(() => ({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }))

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<number, unknown> | undefined
      >()
    })

    it('should be able to transform data to arbitrary result', () => {
      const infiniteQuery = createInfiniteQuery(() => ({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<InfiniteData<number, number>>()
          return 'selected' as const
        },
      }))

      expectTypeOf(infiniteQuery.data).toEqualTypeOf<'selected' | undefined>()
    })
  })

  describe('getNextPageParam / getPreviousPageParam', () => {
    it('should get typed params', () => {
      const infiniteQuery = createInfiniteQuery(() => ({
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
      }))

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<string, unknown> | undefined
      >()
    })
  })

  describe('error booleans', () => {
    it('should not be permanently `false`', () => {
      const infiniteQuery = createInfiniteQuery(() => ({
        queryKey: createKey(),
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      }))

      expectTypeOf(infiniteQuery.isFetchNextPageError).toEqualTypeOf<boolean>()
      expectTypeOf(
        infiniteQuery.isFetchPreviousPageError,
      ).toEqualTypeOf<boolean>()
      expectTypeOf(infiniteQuery.isLoadingError).toEqualTypeOf<boolean>()
      expectTypeOf(infiniteQuery.isRefetchError).toEqualTypeOf<boolean>()
    })
  })

  describe('queryClient', () => {
    it('should accept queryClient as second argument', () => {
      const queryClient = new QueryClient()

      const infiniteQuery = createInfiniteQuery(
        () => ({
          queryKey: createKey(),
          queryFn: ({ pageParam }) => {
            return pageParam * 5
          },
          initialPageParam: 1,
          getNextPageParam: () => undefined,
        }),
        () => queryClient,
      )

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      expectTypeOf(infiniteQuery.data).toEqualTypeOf<
        InfiniteData<number, unknown> | undefined
      >()
    })
  })
})
