import { assertType, describe, expectTypeOf, it } from 'vitest'
import { dataTagSymbol } from '@tanstack/query-core'
import { reactive, unref } from 'vue-demi'
import { queryKey } from '@tanstack/query-test-utils'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { QueryClient } from '../queryClient'
import { useInfiniteQuery } from '../useInfiniteQuery'
import type { InfiniteData } from '@tanstack/query-core'

describe('infiniteQueryOptions', () => {
  it('should not allow excess properties', () => {
    const key = queryKey()
    assertType(
      infiniteQueryOptions({
        queryKey: key,
        queryFn: () => Promise.resolve('data'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      }),
    )
  })
  it('should infer types for callbacks', () => {
    const key = queryKey()
    infiniteQueryOptions({
      queryKey: key,
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
    const key = queryKey()
    const options = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const { data } = reactive(useInfiniteQuery(options))

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
  it('should work when passed to infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery({
      ...unref(options),
      enabled: true,
      staleTime: 0,
      pages: 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })
  it('should work when passed to infiniteQuery with select', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => data.pages,
    })

    const data = await new QueryClient().infiniteQuery({
      ...unref(options),
      enabled: true,
      staleTime: 0,
      pages: 1,
    })

    expectTypeOf(data).toEqualTypeOf<Array<string>>()
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should tag the queryKey even if no promise is returned', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => 'string',
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      select: (data) => data.pages,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })
  it('should return the proper type when passed to getQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(tagged)

    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
  })
  it('should properly type when passed to setQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(tagged, (prev) => {
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
