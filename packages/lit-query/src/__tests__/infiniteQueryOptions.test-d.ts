import {
  QueryClient,
  dataTagErrorSymbol,
  dataTagSymbol,
  skipToken,
} from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import type {
  DataTag,
  InfiniteData,
  InitialDataFunction,
} from '@tanstack/query-core'

class Host extends LitElement {}

describe('infiniteQueryOptions', () => {
  it('should not allow excess properties', () => {
    assertType(
      infiniteQueryOptions({
        queryKey: queryKey(),
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
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      staleTime: 1000,
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
      },
    })
  })

  it('should work when passed to createInfiniteQueryController', () => {
    const infinite = createInfiniteQueryController(
      new Host(),
      infiniteQueryOptions({
        queryKey: queryKey(),
        initialPageParam: 0,
        queryFn: () => Promise.resolve({ page: 1 }),
        getNextPageParam: (lastPage) => lastPage.page + 1,
      }),
      new QueryClient(),
    )

    expectTypeOf(infinite().data?.pages).toEqualTypeOf<
      Array<{ page: number }> | undefined
    >()
  })

  it('should work when passed to createInfiniteQueryController with select', () => {
    const infinite = createInfiniteQueryController(
      new Host(),
      infiniteQueryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        select: (data) => data.pages,
      }),
      new QueryClient(),
    )

    expectTypeOf(infinite().data).toEqualTypeOf<Array<string> | undefined>()
  })

  it('should work when passed to infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should work when passed to infiniteQuery with select', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => data.pages,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<Array<string>>()
  })

  it('should work when passed to infiniteQuery with enabled: false', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      enabled: false,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should work when passed to infiniteQuery with skipToken', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: skipToken,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<unknown, number>>()
  })

  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: () => Promise.resolve({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<{ page: number }>
    >()
    expectTypeOf(tagged[dataTagErrorSymbol]).toEqualTypeOf<Error>()
  })

  it('should tag the queryKey even if no promise is returned', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => 'string',
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })

  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('string'),
      select: (data) => data.pages,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<InfiniteData<string>>()
  })

  it('should return the proper type when passed to getQueryData', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: () => Promise.resolve({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })

    const data = new QueryClient().getQueryData(tagged)
    expectTypeOf(data).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()
  })

  it('should properly type when passed to setQueryData', () => {
    const { queryKey: tagged } = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: () => Promise.resolve({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })

    const queryClient = new QueryClient()
    const updatedPages = queryClient.setQueryData(tagged, {
      pages: [{ page: 4 }],
      pageParams: [0],
    })
    expectTypeOf(updatedPages).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()

    const updatedPagesViaCallback = queryClient.setQueryData(
      tagged,
      (previous) => {
        expectTypeOf(previous).toEqualTypeOf<
          InfiniteData<{ page: number }> | undefined
        >()
        return previous
      },
    )
    expectTypeOf(updatedPagesViaCallback).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()
  })

  it('should not be allowed to be passed to non-infinite query functions', () => {
    const queryClient = new QueryClient()
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })
    assertType(
      // @ts-expect-error cannot pass infinite options to non-infinite query functions
      queryClient.query(options),
    )
  })

  it('allow optional initialData function', () => {
    const initialData: { example: boolean } | undefined = { example: true }
    const queryOptions = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => initialData,
      initialData: initialData
        ? () => ({ pages: [initialData], pageParams: [] })
        : undefined,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })
    expectTypeOf(queryOptions.initialData).toExtend<
      | InitialDataFunction<InfiniteData<{ example: boolean }, number>>
      | InfiniteData<{ example: boolean }, number>
      | undefined
    >()
  })

  it('allow optional initialData object', () => {
    const initialData: { example: boolean } | undefined = { example: true }
    const queryOptions = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => initialData,
      initialData: initialData
        ? { pages: [initialData], pageParams: [] }
        : undefined,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })
    expectTypeOf(queryOptions.initialData).toExtend<
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
