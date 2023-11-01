import { describe, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { useQuery } from '../useQuery'
import { doNotExecute } from './utils'
import type { Equal, Expect } from './utils'
import type { InfiniteData } from '@tanstack/query-core'

describe('pageParam', () => {
  it('initialPageParam should define type of param passed to queryFunctionContext', () => {
    doNotExecute(() => {
      useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          const result: Expect<Equal<number, typeof pageParam>> = true
          return result
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      })
    })
  })

  it('direction should be passed to queryFn of useInfiniteQuery', () => {
    doNotExecute(() => {
      useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ direction }) => {
          const result: Expect<
            Equal<'forward' | 'backward', typeof direction>
          > = true
          return result
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      })
    })
  })

  it('there should be no pageParam passed to the queryFn of useQuery', () => {
    doNotExecute(() => {
      useQuery({
        queryKey: ['key'],
        // @ts-expect-error there should be no pageParam passed to queryFn of useQuery
        queryFn: ({ pageParam }) => {
          return String(pageParam)
        },
      })
    })
  })

  it('there should be no direction passed to the queryFn of useQuery', () => {
    doNotExecute(() => {
      useQuery({
        queryKey: ['key'],
        // @ts-expect-error there should be no pageParam passed to queryFn of useQuery
        queryFn: ({ direction }) => {
          return String(direction)
        },
      })
    })
  })

  it('initialPageParam should define type of param passed to queryFunctionContext for fetchInfiniteQuery', () => {
    doNotExecute(() => {
      const queryClient = new QueryClient()
      queryClient.fetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          const result: Expect<Equal<number, typeof pageParam>> = true
          return result
        },
        initialPageParam: 1,
      })
    })
  })

  it('initialPageParam should define type of param passed to queryFunctionContext for prefetchInfiniteQuery', () => {
    doNotExecute(() => {
      const queryClient = new QueryClient()
      queryClient.prefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          const result: Expect<Equal<number, typeof pageParam>> = true
          return result
        },
        initialPageParam: 1,
      })
    })
  })
})
describe('select', () => {
  it('should still return paginated data if no select result', () => {
    doNotExecute(() => {
      const infiniteQuery = useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
      })

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      const result: Expect<
        Equal<
          InfiniteData<number, unknown> | undefined,
          (typeof infiniteQuery)['data']
        >
      > = true

      return result
    })
  })

  it('should be able to transform data to arbitrary result', () => {
    doNotExecute(() => {
      const infiniteQuery = useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        initialPageParam: 1,
        getNextPageParam: () => undefined,
        select: (data) => {
          const result: Expect<
            Equal<InfiniteData<number, number>, typeof data>
          > = true
          return result
        },
      })

      const result: Expect<
        Equal<true | undefined, (typeof infiniteQuery)['data']>
      > = true
      return result
    })
  })
})
describe('getNextPageParam / getPreviousPageParam', () => {
  it('should get typed params', () => {
    doNotExecute(() => {
      const infiniteQuery = useInfiniteQuery({
        queryKey: ['key'],
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
          doNotExecute(() => {
            const lastPageResult: Expect<Equal<string, typeof lastPage>> = true
            return lastPageResult
          })
          doNotExecute(() => {
            const allPagesResult: Expect<
              Equal<Array<string>, typeof allPages>
            > = true
            return allPagesResult
          })
          doNotExecute(() => {
            const lastPageParamResult: Expect<
              Equal<number, typeof lastPageParam>
            > = true
            return lastPageParamResult
          })
          doNotExecute(() => {
            const allPageParamsResult: Expect<
              Equal<Array<number>, typeof allPageParams>
            > = true
            return allPageParamsResult
          })

          return undefined
        },
        getPreviousPageParam: (
          firstPage,
          allPages,
          firstPageParam,
          allPageParams,
        ) => {
          doNotExecute(() => {
            const firstPageResult: Expect<Equal<string, typeof firstPage>> =
              true
            return firstPageResult
          })
          doNotExecute(() => {
            const allPagesResult: Expect<
              Equal<Array<string>, typeof allPages>
            > = true
            return allPagesResult
          })
          doNotExecute(() => {
            const firstPageParamResult: Expect<
              Equal<number, typeof firstPageParam>
            > = true
            return firstPageParamResult
          })
          doNotExecute(() => {
            const allPageParamsResult: Expect<
              Equal<Array<number>, typeof allPageParams>
            > = true
            return allPageParamsResult
          })

          return undefined
        },
      })

      // TODO: Order of generics prevents pageParams to be typed correctly. Using `unknown` for now
      const result: Expect<
        Equal<
          InfiniteData<string, unknown> | undefined,
          (typeof infiniteQuery)['data']
        >
      > = true
      return result
    })
  })
})
