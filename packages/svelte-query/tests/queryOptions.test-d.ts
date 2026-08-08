import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueriesObserver,
  QueryClient,
  dataTagSymbol,
  skipToken,
} from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { createQueries, queryOptions } from '../src/index.js'
import type { QueryObserverResult } from '@tanstack/query-core'

// Regression test for exported queryOptions inference under declaration emit.
// TypeScript should be able to name the return type without expanding the
// internal data tag symbols into the consumer's .d.ts output.
export const exportedQueryOptions = queryOptions({
  queryKey: ['invalid'],
})

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    const key = queryKey()
    assertType(
      queryOptions({
        queryKey: key,
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error this is a good error, because stallTime does not exist!
        stallTime: 1000,
      }),
    )
  })

  it('should infer types for callbacks', () => {
    const key = queryKey()
    queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })

  it('should work when passed to fetchQuery', async () => {
    const key = queryKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().fetchQuery(options)
    expectTypeOf(data).toEqualTypeOf<number>()
  })

  it('should work when passed to createQueries', () => {
    const key = queryKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queries = createQueries(() => ({
      queries: [options],
    }))

    expectTypeOf(queries[0].data).toEqualTypeOf<number | undefined>()
  })

  it('should tag the queryKey with the result type of the QueryFn', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should tag the queryKey even if no promise is returned', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => 5,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should tag the queryKey with unknown if there is no queryFn', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<unknown>()
  })

  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(tagged[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should return the proper type when passed to getQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(tagged)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should return the proper type when passed to getQueryState', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const state = queryClient.getQueryState(tagged)
    expectTypeOf(state?.data).toEqualTypeOf<number | undefined>()
  })

  it('should properly type updaterFn when passed to setQueryData', () => {
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
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
    const key = queryKey()
    const { queryKey: tagged } = queryOptions({
      queryKey: key,
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
    const key = queryKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer to unknown if we disable a query with just a skipToken', () => {
    const key = queryKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: skipToken,
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should return the proper type when passed to QueriesObserver', () => {
    const key = queryKey()
    const options = queryOptions({
      queryKey: key,
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const queriesObserver = new QueriesObserver(queryClient, [options])
    expectTypeOf(queriesObserver).toEqualTypeOf<
      QueriesObserver<Array<QueryObserverResult>>
    >()
  })

  it('should allow undefined response in initialData', () => {
    const key = queryKey()
    const options = (id: string | null) =>
      queryOptions({
        queryKey: [...key, id],
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
      })

    expectTypeOf(options(null).initialData).returns.toEqualTypeOf<
      { id: string; title: string } | undefined
    >()
  })
})
