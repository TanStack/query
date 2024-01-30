import { describe, it } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import { doNotExecute } from './utils'
import type { InfiniteData, dataTagSymbol } from '@tanstack/query-core'
import type { Equal, Expect } from './utils'

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    doNotExecute(() => {
      return infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('data'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      })
    })
  })
  it('should infer types for callbacks', () => {
    doNotExecute(() => {
      return infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('data'),
        staleTime: 1000,
        getNextPageParam: () => 1,
        initialPageParam: 1,
        select: (data) => {
          const result: Expect<
            Equal<InfiniteData<string, number>, typeof data>
          > = true
          return result
        },
      })
    })
  })
  it('should work when passed to useInfiniteQuery', () => {
    doNotExecute(() => {
      const options = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const { data } = useInfiniteQuery(options)

      // known issue: type of pageParams is unknown when returned from useInfiniteQuery
      const result: Expect<
        Equal<typeof data, InfiniteData<string, unknown> | undefined>
      > = true
      return result
    })
  })
  it('should work when passed to useSuspenseInfiniteQuery', () => {
    doNotExecute(() => {
      const options = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const { data } = useSuspenseInfiniteQuery(options)

      const result: Expect<Equal<typeof data, InfiniteData<string, unknown>>> =
        true
      return result
    })
  })
  it('should work when passed to fetchInfiniteQuery', () => {
    doNotExecute(async () => {
      const options = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const data = await new QueryClient().fetchInfiniteQuery(options)

      const result: Expect<Equal<typeof data, InfiniteData<string, number>>> =
        true
      return result
    })
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    doNotExecute(() => {
      const { queryKey } = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const result: Expect<
        Equal<(typeof queryKey)[typeof dataTagSymbol], InfiniteData<string>>
      > = true
      return result
    })
  })
  it('should tag the queryKey even if no promise is returned', () => {
    doNotExecute(() => {
      const { queryKey } = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => 'string',
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const result: Expect<
        Equal<(typeof queryKey)[typeof dataTagSymbol], InfiniteData<string>>
      > = true
      return result
    })
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    doNotExecute(() => {
      const { queryKey } = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        select: (data) => data.pages,
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const result: Expect<
        Equal<(typeof queryKey)[typeof dataTagSymbol], InfiniteData<string>>
      > = true
      return result
    })
  })
  it('should return the proper type when passed to getQueryData', () => {
    doNotExecute(() => {
      const { queryKey } = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(queryKey)

      const result: Expect<
        Equal<typeof data, InfiniteData<string, unknown> | undefined>
      > = true
      return result
    })
  })
  it('should properly type when passed to setQueryData', () => {
    doNotExecute(() => {
      const { queryKey } = infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
      })

      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(queryKey, (prev) => {
        const result: Expect<
          Equal<typeof prev, InfiniteData<string, unknown> | undefined>
        > = true
        return result ? prev : { pages: ['foo'], pageParams: [1] }
      })

      const result: Expect<
        Equal<typeof data, InfiniteData<string, unknown> | undefined>
      > = true
      return result
    })
  })
})
