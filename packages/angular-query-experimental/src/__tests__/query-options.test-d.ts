import { assertType, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient, dataTagSymbol, injectQuery, queryOptions } from '..'
import type { Signal } from '@angular/core'

// Regression test for exported queryOptions inference under declaration emit.
// TypeScript should be able to name the return type without expanding the
// internal data tag symbols into the consumer's .d.ts output.
export const exportedQueryOptions = queryOptions({
  queryKey: ['invalid'],
})

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    expectTypeOf(queryOptions).parameter(0).not.toHaveProperty('stallTime')
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

it('should work when passed to injectQuery', () => {
  const key = queryKey()
  const options = queryOptions({
    queryKey: key,
    queryFn: () => Promise.resolve(5),
  })

  const { data } = injectQuery(() => options)
  expectTypeOf(data).toEqualTypeOf<Signal<number | undefined>>()
})

it('should work when passed to fetchQuery', () => {
  const key = queryKey()
  const options = queryOptions({
    queryKey: key,
    queryFn: () => Promise.resolve(5),
  })

  const data = new QueryClient().fetchQuery(options)
  assertType<Promise<number>>(data)
})

it('should tag the queryKey with the result type of the QueryFn', () => {
  const key = queryKey()
  const { queryKey: tagged } = queryOptions({
    queryKey: key,
    queryFn: () => Promise.resolve(5),
  })
  assertType<number>(tagged[dataTagSymbol])
})

it('should tag the queryKey even if no promise is returned', () => {
  const key = queryKey()
  const { queryKey: tagged } = queryOptions({
    queryKey: key,
    queryFn: () => 5,
  })
  assertType<number>(tagged[dataTagSymbol])
})

it('should tag the queryKey with unknown if there is no queryFn', () => {
  const key = queryKey()
  const { queryKey: tagged } = queryOptions({
    queryKey: key,
  })

  assertType<unknown>(tagged[dataTagSymbol])
})

it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
  const key = queryKey()
  const { queryKey: tagged } = queryOptions({
    queryKey: key,
    queryFn: () => Promise.resolve(5),
    select: (data) => data.toString(),
  })

  assertType<number>(tagged[dataTagSymbol])
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
