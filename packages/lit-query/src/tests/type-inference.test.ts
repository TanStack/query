import { type QueryObserverResult, QueryClient } from '@tanstack/query-core'
import { describe, expectTypeOf, it } from 'vitest'
import { createInfiniteQueryController } from '../createInfiniteQueryController.js'
import { createMutationController } from '../createMutationController.js'
import { createQueriesController } from '../createQueriesController.js'
import { createQueryController } from '../createQueryController.js'
import { infiniteQueryOptions } from '../infiniteQueryOptions.js'
import { mutationOptions } from '../mutationOptions.js'
import { queryOptions } from '../queryOptions.js'
import { TestControllerHost } from './testHost.js'

describe('type inference', () => {
  it('L1: createQueriesController preserves tuple/combine inference', () => {
    const client = new QueryClient()
    const host = new TestControllerHost()

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

    expectTypeOf(tupleResult()).toMatchTypeOf<
      readonly [QueryObserverResult, QueryObserverResult]
    >()

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
          first: result[0]?.data as number | undefined,
          second: result[1]?.data as string | undefined,
        }),
      },
      client,
    )

    expectTypeOf(combinedResult()).toEqualTypeOf<{
      first: number | undefined
      second: string | undefined
    }>()
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
})
