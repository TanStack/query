import { assertType, describe, expectTypeOf, it, test } from 'vitest'
import { QueryClient, dataTagSymbol } from '@tanstack/query-core'
import { infiniteQueryOptions } from '../infinite-query-options'
import { injectInfiniteQuery } from '../inject-infinite-query'
import { injectQuery } from '../inject-query'
import type {
  DataTag,
  InfiniteData,
  InitialDataFunction,
} from '@tanstack/query-core'

describe('infiniteQueryOptions', () => {
  it('should not allow excess properties', () => {
    assertType(
      infiniteQueryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('data'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      }),
    )
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
      initialPageParam: 1,
      mode: 'manual',
    })

    const { data, fetchNextPage } = injectInfiniteQuery(() => options)

    // known issue: type of pageParams is unknown when returned from useInfiniteQuery
    expectTypeOf(data()).toEqualTypeOf<
      InfiniteData<string, unknown> | undefined
    >()
    fetchNextPage({ pageParam: 2 })

    // @ts-expect-error pageParam is required in manual mode
    fetchNextPage()
  })

  it('should preserve manual fetch method types', () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return pageParam * 5
      },
      initialPageParam: 1,
      mode: 'manual',
    })

    const { fetchNextPage, fetchPreviousPage } = injectInfiniteQuery(() => options)

    fetchNextPage({ pageParam: 2 })
    fetchPreviousPage({ pageParam: 0 })

    // @ts-expect-error pageParam is required in manual mode
    fetchNextPage()
  })

  it('should work when passed to fetchInfiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      mode: 'manual',
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

  test('should not be allowed to be passed to non-infinite query functions', () => {
    const queryClient = new QueryClient()
    const options = infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })
    assertType(
      // @ts-expect-error cannot pass infinite options to non-infinite query functions
      injectQuery(() => options),
    )
    assertType(
      // @ts-expect-error cannot pass infinite options to non-infinite query functions
      queryClient.ensureQueryData(options),
    )
    assertType(
      // @ts-expect-error cannot pass infinite options to non-infinite query functions
      queryClient.fetchQuery(options),
    )
    assertType(
      // @ts-expect-error cannot pass infinite options to non-infinite query functions
      queryClient.prefetchQuery(options),
    )
  })

  it('should reject missing mode / getNextPageParam and reject getters in manual mode', () => {
    // @ts-expect-error getNextPageParam is required unless mode is manual
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
    })

    // @ts-expect-error getNextPageParam is not allowed in manual mode
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      mode: 'manual',
      getNextPageParam: () => 1,
    })

    // @ts-expect-error getPreviousPageParam is not allowed in manual mode
    infiniteQueryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      mode: 'manual',
      getPreviousPageParam: () => 0,
    })
  })

  test('allow optional initialData function', () => {
    const initialData: { example: boolean } | undefined = { example: true }
    const queryOptions = infiniteQueryOptions({
      queryKey: ['example'],
      queryFn: () => initialData,
      initialData: initialData
        ? () => ({ pages: [initialData], pageParams: [] })
        : undefined,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })
    expectTypeOf(queryOptions.initialData).toMatchTypeOf<
      | InitialDataFunction<InfiniteData<{ example: boolean }, number>>
      | InfiniteData<{ example: boolean }, number>
      | undefined
    >()
  })

  test('allow optional initialData object', () => {
    const initialData: { example: boolean } | undefined = { example: true }
    const queryOptions = infiniteQueryOptions({
      queryKey: ['example'],
      queryFn: () => initialData,
      initialData: initialData
        ? { pages: [initialData], pageParams: [] }
        : undefined,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })
    expectTypeOf(queryOptions.initialData).toMatchTypeOf<
      | InitialDataFunction<InfiniteData<{ example: boolean }, number>>
      | InfiniteData<{ example: boolean }, number>
      | undefined
    >()
  })

  it('should return a custom query key type', () => {
    type MyQueryKey = [Array<string>, { type: 'foo' }]

    const options = infiniteQueryOptions({
      queryKey: [['key'], { type: 'foo' }] as MyQueryKey,
      queryFn: () => Promise.resolve(1),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(options.queryKey).toEqualTypeOf<
      DataTag<MyQueryKey, InfiniteData<number>, Error>
    >()
  })

  it('should return a custom query key type with datatag', () => {
    type MyQueryKey = DataTag<
      [Array<string>, { type: 'foo' }],
      number,
      Error & { myMessage: string }
    >

    const options = infiniteQueryOptions({
      queryKey: [['key'], { type: 'foo' }] as MyQueryKey,
      queryFn: () => Promise.resolve(1),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(options.queryKey).toEqualTypeOf<
      DataTag<MyQueryKey, InfiniteData<number>, Error & { myMessage: string }>
    >()
  })
})
