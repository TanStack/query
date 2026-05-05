import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueryClient,
  dataTagErrorSymbol,
  dataTagSymbol,
  skipToken,
} from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { useQuery } from '../useQuery'
import { queryOptions } from '../queryOptions'

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

    const { data } = useQuery(() => options)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should work when passed to fetchQuery', async () => {
    const options = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(5),
    })

    const data = await new QueryClient().fetchQuery(options)
    expectTypeOf(data).toEqualTypeOf<number>()
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
  it('should tag the queryKey with the default error type', () => {
    const { queryKey: tagged } = queryOptions({
      queryKey: queryKey(),
      queryFn: () => Promise.resolve(1),
    })

    expectTypeOf(tagged[dataTagErrorSymbol]).toEqualTypeOf<Error>()
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
})
