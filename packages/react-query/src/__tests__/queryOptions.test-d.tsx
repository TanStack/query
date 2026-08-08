import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueriesObserver,
  QueryClient,
  dataTagSymbol,
  skipToken,
} from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { queryOptions } from '../queryOptions'
import { useQuery } from '../useQuery'
import { useQueries } from '../useQueries'
import { useSuspenseQuery } from '../useSuspenseQuery'
import type { AnyUseQueryOptions } from '../types'
import type {
  DataTag,
  InitialDataFunction,
  QueryObserverResult,
  QueryPersister,
} from '@tanstack/query-core'

// Regression test for exported queryOptions inference under declaration emit.
// TypeScript should be able to name the return type without expanding the
// internal data tag symbols into the consumer's .d.ts output.
export const exportedQueryOptions = queryOptions({
  queryKey: ['invalid'],
})

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    assertType(
      queryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      }),
    )
  })
  it('should infer types for callbacks', () => {
    queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })
  it('should work when passed to useQuery', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const { data } = useQuery(options)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should work when passed to useSuspenseQuery', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const { data } = useSuspenseQuery(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should work when passed to fetchQuery', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().fetchQuery(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })
  it('should work when passed to useQueries', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const [{ data }] = useQueries({
      queries: [options],
    })

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should tag the queryKey even if no promise is returned', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => 5,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should tag the queryKey with unknown if there is no queryFn', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<unknown>()
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should return the proper type when passed to getQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(tagged)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should return the proper type when passed to getQueryState', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const state = queryClient.getQueryState(tagged)
    expectTypeOf(state?.data).toEqualTypeOf<number | undefined>()
  })
  it('should properly type updaterFn when passed to setQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(tagged, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should properly type value when passed to setQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    queryClient.setQueryData(tagged, '5')
    // @ts-expect-error value should be a number
    queryClient.setQueryData(tagged, () => '5')

    const data = queryClient.setQueryData(tagged, 5)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer even if there is a conditional skipToken', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer to unknown if we disable a query with just a skipToken', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: skipToken,
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should throw a type error when using queryFn with skipToken in a suspense query', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })
    // @ts-expect-error TS2345
    const { data } = useSuspenseQuery(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should return the proper type when passed to QueriesObserver', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const queriesObserver = new QueriesObserver(queryClient, [options])
    expectTypeOf(queriesObserver).toEqualTypeOf<
      QueriesObserver<Array<QueryObserverResult>>
    >()
  })

  it('should allow undefined response in initialData', () => {
    assertType((id: string | null) =>
      queryOptions({
        queryKey: ['todo', id],
        queryFn: () =>
          Promise.resolve({
            id: '1',
            title: 'Do Laundry',
          }),
        initialData: () =>
          !id
            ? undefined
            : {
                id,
                title: 'Initial Data',
              },
      }),
    )
  })

  it('should allow optional initialData object', () => {
    const testFn = (id?: string) => {
      const options = queryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve('something string'),
        initialData: id ? 'initial string' : undefined,
      })
      expectTypeOf(options.initialData).toExtend<
        InitialDataFunction<string> | string | undefined
      >()
    }
    testFn('id')
    testFn()
  })

  it('should be passable to UseQueryOptions', () => {
    function somethingWithQueryOptions<TQueryOpts extends AnyUseQueryOptions>(
      options: TQueryOpts,
    ) {
      return options.queryKey
    }

    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
    })

    assertType(somethingWithQueryOptions(options))
  })

  it('should return a custom query key type', () => {
    type MyQueryKey = [Array<string>, { type: 'foo' }]

    const options = queryOptions({
      queryKey: [['key'], { type: 'foo' }] as MyQueryKey,
      queryFn: () => Promise.resolve(1),
    })

    expectTypeOf(options.queryKey).toEqualTypeOf<
      DataTag<MyQueryKey, number, Error>
    >()
  })

  it('should return a custom query key type with datatag', () => {
    type MyQueryKey = DataTag<
      [Array<string>, { type: 'foo' }],
      number,
      Error & { myMessage: string }
    >

    const options = queryOptions({
      queryKey: [['key'], { type: 'foo' }] as MyQueryKey,
      queryFn: () => Promise.resolve(1),
    })

    expectTypeOf(options.queryKey).toEqualTypeOf<
      DataTag<MyQueryKey, number, Error & { myMessage: string }>
    >()
  })

  it('should infer TQueryFnData from persister paired with a queryFn declaring a parameter (#7842)', () => {
    const persister = undefined as unknown as QueryPersister<string, any>

    const options = queryOptions({
      queryKey: ['key'],
      queryFn: (_context) => 'hello',
      persister,
    })

    expectTypeOf(options.queryFn!).returns.toEqualTypeOf<
      string | Promise<string>
    >()
  })

  it('should still error when persister and queryFn return types genuinely conflict', () => {
    const persister = undefined as unknown as QueryPersister<string, any>

    assertType(
      queryOptions({
        queryKey: ['key'],
        // @ts-expect-error persister expects string, queryFn returns number
        queryFn: () => 42,
        persister,
      }),
    )

    assertType(
      queryOptions({
        queryKey: ['key'],
        // @ts-expect-error persister expects string, queryFn with arg returns number
        queryFn: (_context) => 42,
        persister,
      }),
    )
  })
})
