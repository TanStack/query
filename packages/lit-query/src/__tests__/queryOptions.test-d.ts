import { QueryClient, dataTagSymbol, skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { LitElement } from 'lit'
import { assertType, describe, expectTypeOf, it } from 'vitest'
import { createQueriesController } from '../createQueriesController.js'
import { createQueryController } from '../createQueryController.js'
import { queryOptions } from '../queryOptions.js'
import type {
  DataTag,
  InitialDataFunction,
  QueryPersister,
} from '@tanstack/query-core'
import type { CreateQueryOptions } from '../createQueryController.js'

class Host extends LitElement {}

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

  it('should work when passed to createQueryController', () => {
    const query = createQueryController(
      new Host(),
      queryOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ id: 1, name: 'Ada' }),
      }),
      new QueryClient(),
    )

    expectTypeOf(query().data).toEqualTypeOf<
      { id: number; name: string } | undefined
    >()
  })

  it('should work when passed to query', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should work when passed to query with select', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<string>()
  })

  it('should work when passed to query with enabled: false', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should work when passed to query with skipToken', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: skipToken,
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should work when passed to createQueriesController', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const queries = createQueriesController(
      new Host(),
      { queries: [options] },
      new QueryClient(),
    )

    const [{ data }] = queries()
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ id: 2, name: 'Grace' }),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<{
      id: number
      name: string
    }>()
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
      queryFn: () => Promise.resolve({ id: 2, name: 'Grace' }),
    })

    const data = new QueryClient().getQueryData(tagged)
    expectTypeOf(data).toEqualTypeOf<{ id: number; name: string } | undefined>()
  })

  it('should return the proper type when passed to getQueryState', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const state = new QueryClient().getQueryState(tagged)
    expectTypeOf(state?.data).toEqualTypeOf<number | undefined>()
  })

  it('should properly type updaterFn when passed to setQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const data = new QueryClient().setQueryData(tagged, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should properly type value when passed to setQueryData', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve({ id: 2, name: 'Grace' }),
    })

    const queryClient = new QueryClient()

    // @ts-expect-error value should be an object with id and name
    queryClient.setQueryData(tagged, '5')
    // @ts-expect-error value should be an object with id and name
    queryClient.setQueryData(tagged, () => '5')

    const data = queryClient.setQueryData(tagged, {
      id: 3,
      name: 'Lin',
    })
    expectTypeOf(data).toEqualTypeOf<{ id: number; name: string } | undefined>()
  })

  it('should infer even if there is a conditional skipToken', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })

    const data = new QueryClient().getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer to unknown if we disable a query with just a skipToken', () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: skipToken,
    })

    const data = new QueryClient().getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<unknown>()
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
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve('something string'),
      initialData: Math.random() > 0.5 ? 'initial string' : undefined,
    })

    expectTypeOf(options.initialData).toExtend<
      InitialDataFunction<string> | string | undefined
    >()
  })

  it('should be passable to CreateQueryOptions', () => {
    function somethingWithQueryOptions<
      TQueryOpts extends CreateQueryOptions<any, any, any, any, any>,
    >(options: TQueryOpts) {
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
      queryKey: queryKey(),
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
        queryKey: queryKey(),
        // @ts-expect-error persister expects string, queryFn returns number
        queryFn: () => 42,
        persister,
      }),
    )

    assertType(
      queryOptions({
        queryKey: queryKey(),
        // @ts-expect-error persister expects string, queryFn with arg returns number
        queryFn: (_context) => 42,
        persister,
      }),
    )
  })
})
