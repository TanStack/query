import {
  dataTagErrorSymbol,
  dataTagSymbol,
  QueryClient,
  type DefinedQueryObserverResult,
  type InfiniteData,
  type QueryObserverResult,
} from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { describe, expectTypeOf, it } from 'vitest'
import { createMutationController } from '../createMutationController.js'
import { createQueriesController } from '../createQueriesController.js'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createQueryController } from '../createQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import { mutationOptions } from '../mutationOptions.js'
import { queryOptions } from '../queryOptions.js'
import { TestControllerHost } from './testHost.js'

describe('type inference', () => {
  it('should preserve tuple/combine inference in createQueriesController', () => {
    const client = new QueryClient()
    const host = new TestControllerHost()
    const expectTupleResult = (
      value: [QueryObserverResult<number>, QueryObserverResult<string>],
    ) => value
    const expectDefinedInitialDataTuple = (
      value: [DefinedQueryObserverResult<{ id: number; name: string }>],
    ) => value
    const expectMappedQueriesResult = (
      value: [
        ...Array<QueryObserverResult<number>>,
        QueryObserverResult<boolean>,
      ],
    ) => value

    const tupleResult = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: queryKey(),
            queryFn: async () => 1,
          },
          {
            queryKey: queryKey(),
            queryFn: async () => 'x',
          },
        ] as const,
      },
      client,
    )

    const tupleData = expectTupleResult(tupleResult())
    expectTypeOf(tupleData[0].data).toEqualTypeOf<number | undefined>()
    expectTypeOf(tupleData[1].data).toEqualTypeOf<string | undefined>()

    const combinedResult = createQueriesController(
      host,
      {
        queries: [
          {
            queryKey: queryKey(),
            queryFn: async () => 7,
          },
          {
            queryKey: queryKey(),
            queryFn: async () => 'ok',
          },
        ] as const,
        combine: (result) => ({
          first: result[0].data,
          second: result[1].data,
        }),
      },
      client,
    )

    expectTypeOf(combinedResult().first).toEqualTypeOf<number | undefined>()
    expectTypeOf(combinedResult().second).toEqualTypeOf<string | undefined>()

    const definedInitialDataResult = createQueriesController(
      host,
      {
        queries: [
          queryOptions({
            queryKey: queryKey(),
            queryFn: async () => ({ id: 4, name: 'Marie' }),
            initialData: { id: 0, name: 'Seed' },
          }),
        ] as const,
      },
      client,
    )

    const definedInitialDataTuple = expectDefinedInitialDataTuple(
      definedInitialDataResult(),
    )
    expectTypeOf(definedInitialDataTuple[0].data).toEqualTypeOf<{
      id: number
      name: string
    }>()

    const definedInitialDataCombined = createQueriesController(
      host,
      {
        queries: [
          queryOptions({
            queryKey: queryKey(),
            queryFn: async () => ({ id: 5, name: 'Katherine' }),
            initialData: { id: 1, name: 'Init' },
          }),
        ] as const,
        combine: (result) => result[0].data.name,
      },
      client,
    )

    const definedInitialDataCombinedValue: string = definedInitialDataCombined()
    expectTypeOf(definedInitialDataCombinedValue).toEqualTypeOf<string>()

    const numberQueries = [1, 2, 3].map((value) =>
      queryOptions({
        queryKey: queryKey(),
        queryFn: async () => value,
      }),
    )
    const mappedQueriesResult = createQueriesController(
      host,
      {
        queries: [
          ...numberQueries,
          queryOptions({
            queryKey: queryKey(),
            queryFn: async () => true,
          }),
        ],
      },
      client,
    )

    const mappedQueriesData = expectMappedQueriesResult(mappedQueriesResult())
    expectTypeOf(mappedQueriesData[0].data).toEqualTypeOf<
      number | boolean | undefined
    >()
  })

  it('should preserve controller inference with helper option generics', () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const query = createQueryController(
      host,
      queryOptions({
        queryKey: queryKey(),
        queryFn: async () => ({ id: 1, name: 'Ada' }),
      }),
      client,
    )
    expectTypeOf(query().data).toEqualTypeOf<
      { id: number; name: string } | undefined
    >()

    const mutation = createMutationController(
      host,
      mutationOptions({
        mutationFn: async (input: { id: number }) => input.id.toString(),
      }),
      client,
    )
    expectTypeOf(mutation().data).toEqualTypeOf<string | undefined>()
    expectTypeOf(mutation().variables).toEqualTypeOf<
      { id: number } | undefined
    >()

    const queryOpts = queryOptions({
      queryKey: queryKey(),
      queryFn: async () => ({ id: 2, name: 'Grace' }),
    })
    expectTypeOf(queryOpts.queryKey[dataTagSymbol]).toEqualTypeOf<{
      id: number
      name: string
    }>()
    const cachedData = client.getQueryData(queryOpts.queryKey)
    expectTypeOf(cachedData).toEqualTypeOf<
      { id: number; name: string } | undefined
    >()
    const updatedData = client.setQueryData(queryOpts.queryKey, {
      id: 3,
      name: 'Lin',
    })
    expectTypeOf(updatedData).toEqualTypeOf<
      { id: number; name: string } | undefined
    >()

    const infinite = createInfiniteQueryController(
      host,
      infiniteQueryOptions({
        queryKey: queryKey(),
        initialPageParam: 0,
        queryFn: async () => ({ page: 1 }),
        getNextPageParam: (lastPage) => lastPage.page + 1,
      }),
      client,
    )
    expectTypeOf(infinite().data?.pages).toEqualTypeOf<
      Array<{ page: number }> | undefined
    >()

    const infiniteQueryOpts = infiniteQueryOptions({
      queryKey: queryKey(),
      initialPageParam: 0,
      queryFn: async () => ({ page: 3 }),
      getNextPageParam: (lastPage) => lastPage.page + 1,
    })
    expectTypeOf(infiniteQueryOpts.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<{ page: number }>
    >()
    expectTypeOf(
      infiniteQueryOpts.queryKey[dataTagErrorSymbol],
    ).toEqualTypeOf<Error>()
    const cachedPages = client.getQueryData(infiniteQueryOpts.queryKey)
    expectTypeOf(cachedPages).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()
    const updatedPages = client.setQueryData(infiniteQueryOpts.queryKey, {
      pages: [{ page: 4 }],
      pageParams: [0],
    })
    expectTypeOf(updatedPages).toEqualTypeOf<
      InfiniteData<{ page: number }> | undefined
    >()
    const updatedPagesViaCallback = client.setQueryData(
      infiniteQueryOpts.queryKey,
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

  it('should integrate queryOptions with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should integrate queryOptions with select with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<string>()
  })

  it('should integrate queryOptions with enabled: false with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })

    const client = new QueryClient()
    // Disabled imperative queries require cached data; otherwise query() throws before type assertions run.
    client.setQueryData(options.queryKey, 5)

    const data = await client.query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should integrate infiniteQueryOptions with queryClient.infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should integrate infiniteQueryOptions with select with queryClient.infiniteQuery', async () => {
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

  it('should integrate infiniteQueryOptions with enabled: false with queryClient.infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      enabled: false,
    })

    const client = new QueryClient()
    // Disabled imperative infinite queries require cached data to avoid throwing before type assertions.
    client.setQueryData(options.queryKey, {
      pages: ['data'],
      pageParams: [1],
    })

    const data = await client.infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })
})
