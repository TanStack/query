import { useInfiniteQuery } from '../useInfiniteQuery'
import { useQuery } from '../useQuery'
import type { Expect, Equal } from './utils'
import { doNotExecute } from './utils'
import type { InfiniteData } from '@tanstack/query-core'
import { QueryClient } from '@tanstack/query-core'

describe('pageParam', () => {
  it('defaultPageParam should define type of param passed to queryFunctionContext', () => {
    doNotExecute(() => {
      useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          const result: Expect<Equal<number, typeof pageParam>> = true
          return result
        },
        defaultPageParam: 1,
        getNextPageParam: () => undefined,
      })
    })
  })

  it('there should be no pageParam passed to queryFn of useQuery', () => {
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

  it('defaultPageParam should define type of param passed to queryFunctionContext for fetchInfiniteQuery', () => {
    doNotExecute(() => {
      const queryClient = new QueryClient()
      queryClient.fetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          const result: Expect<Equal<number, typeof pageParam>> = true
          return result
        },
        defaultPageParam: 1,
      })
    })
  })

  it('defaultPageParam should define type of param passed to queryFunctionContext for prefetchInfiniteQuery', () => {
    doNotExecute(() => {
      const queryClient = new QueryClient()
      queryClient.prefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          const result: Expect<Equal<number, typeof pageParam>> = true
          return result
        },
        defaultPageParam: 1,
      })
    })
  })
})

describe('select', () => {
  it('should be able to transform data to arbitrary result', () => {
    doNotExecute(() => {
      const infiniteQuery = useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        defaultPageParam: 1,
        getNextPageParam: () => undefined,
        select: (data) => {
          const result: Expect<Equal<InfiniteData<number>, typeof data>> = true
          return result
        },
      })

      const result: Expect<
        Equal<true | undefined, (typeof infiniteQuery)['data']>
      > = true
      return result
    })
  })
  it('should pass transformed data to onSuccess', () => {
    doNotExecute(() => {
      const infiniteQuery = useInfiniteQuery({
        queryKey: ['key'],
        queryFn: ({ pageParam }) => {
          return pageParam * 5
        },
        defaultPageParam: 1,
        getNextPageParam: () => undefined,
        select: (data) => {
          return {
            ...data,
            pages: data.pages.map((page) => page.toString()),
          }
        },
        onSuccess: (data) => {
          const result: Expect<Equal<InfiniteData<string>, typeof data>> = true
          doNotExecute(() => result)
        },
      })

      const result: Expect<
        Equal<InfiniteData<string> | undefined, (typeof infiniteQuery)['data']>
      > = true
      return result
    })
  })
})
