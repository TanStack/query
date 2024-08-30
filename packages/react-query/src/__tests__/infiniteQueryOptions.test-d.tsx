import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient, dataTagSymbol } from '@tanstack/query-core'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { useInfiniteQuery } from '../useInfiniteQuery'
import { useSuspenseInfiniteQuery } from '../useSuspenseInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      // @ts-expect-error this is a good error, because stallTime does not exist!
      stallTime: 1000,
    })
  })
  it('should infer types for callbacks', () => {
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('data'),
      staleTime: 1000,
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
      },
    })
  })
  it('should work when passed to useInfiniteQuery', () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const { data } = useInfiniteQuery(options)

    // known issue: type of pageParams is unknown when returned from useInfiniteQuery
    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
  it('should work when passed to useSuspenseInfiniteQuery', () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const { data } = useSuspenseInfiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, unknown>>()
  })
  it('should work when passed to fetchInfiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().fetchInfiniteQuery(options)

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey } = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should tag the queryKey even if no promise is returned', () => {
    const { queryKey } = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => 'string',
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const { queryKey } = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      select: (data) => data.pages,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should return the proper type when passed to getQueryData', () => {
    const { queryKey } = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
  it('should properly type when passed to setQueryData', () => {
    const { queryKey } = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<
        InfiniteData<string, unknown> | undefined
      >()
      return prev
    })

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
})
