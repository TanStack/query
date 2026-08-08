import {
  dataTagSymbol,
  QueryClient,
  skipToken,
  type DefinedQueryObserverResult,
  type InfiniteData,
  type QueryObserverResult,
} from '@tanstack/query-core'
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
  it('L1: createQueriesController preserves tuple/combine inference', () => {
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
            queryKey: ['type-inference', 'tuple-number'] as const,
            queryFn: async () => 1,
          },
          {
            queryKey: ['type-inference', 'tuple-string'] as const,
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
            queryKey: ['type-inference', 'combined-number'] as const,
            queryFn: async () => 7,
          },
          {
            queryKey: ['type-inference', 'combined-string'] as const,
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
            queryKey: ['type-inference', 'defined-initial-data'] as const,
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
            queryKey: [
              'type-inference',
              'defined-initial-data-combine',
            ] as const,
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
        queryKey: ['type-inference', 'mapped-number', value] as const,
        queryFn: async () => value,
      }),
    )
    const mappedQueriesResult = createQueriesController(
      host,
      {
        queries: [
          ...numberQueries,
          queryOptions({
            queryKey: ['type-inference', 'mapped-boolean'] as const,
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

  it('L2: helper option generics preserve controller inference', () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

    const query = createQueryController(
      host,
      queryOptions({
        queryKey: ['type-inference', 'query'] as const,
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
      queryKey: ['type-inference', 'query-options'] as const,
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
        queryKey: ['type-inference', 'infinite'] as const,
        initialPageParam: 0,
        queryFn: async () => ({ page: 1 }),
        getNextPageParam: (lastPage) => lastPage.page + 1,
      }),
      client,
    )
    expectTypeOf(infinite().data?.pages).toEqualTypeOf<
      Array<{ page: number }> | undefined
    >()
  })

  it('L3: queryOptions integrates with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: ['type-inference', 'query'] as const,
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('L4: queryOptions with select integrates with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: ['type-inference', 'query-select'] as const,
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<string>()
  })

  it('L5: queryOptions with enabled: false integrates with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: ['type-inference', 'query-enabled-false'] as const,
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })

    const client = new QueryClient()
    // Disabled imperative queries require cached data; otherwise query() throws before type assertions run.
    client.setQueryData(options.queryKey, 5)

    const data = await client.query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('L6: queryOptions with skipToken integrates with queryClient.query', async () => {
    const options = queryOptions({
      queryKey: ['type-inference', 'query-skip-token'] as const,
      queryFn: skipToken,
    })

    const client = new QueryClient()
    // skipToken disables the query, so seed matching data to exercise the return type.
    client.setQueryData(options.queryKey, 5)

    const data = await client.query(options)
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('L7: infiniteQueryOptions integrates with queryClient.infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['type-inference', 'infinite-query'] as const,
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('L8: infiniteQueryOptions with select integrates with queryClient.infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['type-inference', 'infinite-query-select'] as const,
      queryFn: () => Promise.resolve('data'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      select: (data) => data.pages,
    })

    const data = await new QueryClient().infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<Array<string>>()
  })

  it('L9: infiniteQueryOptions with enabled: false integrates with queryClient.infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['type-inference', 'infinite-query-enabled-false'] as const,
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

  it('L10: infiniteQueryOptions with skipToken integrates with queryClient.infiniteQuery', async () => {
    const options = infiniteQueryOptions({
      queryKey: ['type-inference', 'infinite-query-skip-token'] as const,
      queryFn: skipToken,
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    const client = new QueryClient()
    // skipToken disables the infinite query, so seed data matching the InfiniteData shape.
    client.setQueryData(options.queryKey, {
      pages: ['data'],
      pageParams: [1],
    })

    const data = await client.infiniteQuery(options)
    expectTypeOf(data).toEqualTypeOf<InfiniteData<unknown, number>>()
  })
})
