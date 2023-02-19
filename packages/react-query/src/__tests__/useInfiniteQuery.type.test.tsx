import { useInfiniteQuery } from '../useInfiniteQuery'
import { useQuery } from '../useQuery'
import type { Expect, Equal } from './utils'
import { doNotExecute } from './utils'
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
