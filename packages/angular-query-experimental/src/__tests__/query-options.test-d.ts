import { assertType, describe, expectTypeOf } from 'vitest'
import { QueryClient } from '@tanstack/query-core'
import { dataTagSymbol } from '@tanstack/query-core'
import { queryOptions } from '../query-options'
import { injectQuery } from '../inject-query'
import type { Signal } from '@angular/core'

describe('queryOptions', () => {
  test('should not allow excess properties', () => {
    return queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error this is a good error, because stallTime does not exist!
      stallTime: 1000,
    })
  })

  test('should infer types for callbacks', () => {
    return queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })
})

test('should work when passed to injectQuery', () => {
  const options = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
  })

  const { data } = injectQuery(() => options)
  expectTypeOf(data).toEqualTypeOf<Signal<number | undefined>>()
})

test('should work when passed to fetchQuery', () => {
  const options = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
  })

  const data = new QueryClient().fetchQuery(options)
  assertType<Promise<number>>(data)
})

test('should tag the queryKey with the result type of the QueryFn', () => {
  const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
  })
  assertType<number>(queryKey[dataTagSymbol])
})

test('should tag the queryKey even if no promise is returned', () => {
  const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => 5,
  })
  assertType<number>(queryKey[dataTagSymbol])
})

test('should tag the queryKey with unknown if there is no queryFn', () => {
  const { queryKey } = queryOptions({
    queryKey: ['key'],
  })

  assertType<unknown>(queryKey[dataTagSymbol])
})

test('should return the proper type when passed to getQueryData', () => {
  const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
  })

  const queryClient = new QueryClient()
  const data = queryClient.getQueryData(queryKey)

  expectTypeOf(data).toEqualTypeOf<number | undefined>()
})

test('should properly type updaterFn when passed to setQueryData', () => {
  const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
  })

  const queryClient = new QueryClient()
  const data = queryClient.setQueryData(queryKey, (prev) => {
    expectTypeOf(prev).toEqualTypeOf<number | undefined>()
    return prev
  })

  expectTypeOf(data).toEqualTypeOf<number | undefined>()
})

test('should properly type value when passed to setQueryData', () => {
  const { queryKey } = queryOptions({
    queryKey: ['key'],
    queryFn: () => Promise.resolve(5),
  })

  const queryClient = new QueryClient()

  // @ts-expect-error value should be a number
  queryClient.setQueryData(queryKey, '5')
  // @ts-expect-error value should be a number
  queryClient.setQueryData(queryKey, () => '5')

  const data = queryClient.setQueryData(queryKey, 5)

  expectTypeOf(data).toEqualTypeOf<number | undefined>()
})
