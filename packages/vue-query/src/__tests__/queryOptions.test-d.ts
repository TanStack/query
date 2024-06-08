import { describe, expectTypeOf, it } from 'vitest'
import { reactive, ref } from 'vue-demi'
import { dataTagSymbol } from '@tanstack/query-core'
import { QueryClient } from '../queryClient'
import { queryOptions } from '../queryOptions'
import { useQuery } from '../useQuery'

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      // @ts-expect-error this is a good error, because stallTime does not exist!
      stallTime: 1000,
    })
  })
  it('should infer types for callbacks', () => {
    queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      staleTime: 1000,
      select: (data) => {
        expectTypeOf(data).toEqualTypeOf<number>()
      },
    })
  })
  it('should work when passed to useQuery', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const { data } = reactive(useQuery(options))
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should tag the queryKey with the result type of the QueryFn', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should tag the queryKey even if no promise is returned', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => 5,
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should tag the queryKey with unknown if there is no queryFn', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<unknown>()
  })
  it('should tag the queryKey with the result type of the QueryFn if select is used', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    expectTypeOf(queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })
  it('should return the proper type when passed to getQueryData', () => {
    const { queryKey } = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
  it('should properly type updaterFn when passed to setQueryData', () => {
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
  it('should properly type value when passed to setQueryData', () => {
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
  it('should allow to be passed to QueryClient methods while containing ref in queryKey', () => {
    const options = queryOptions({
      queryKey: ['key', ref(1), { nested: ref(2) }],
      queryFn: () => Promise.resolve(5),
    })

    const queryClient = new QueryClient()

    // Should not error
    const data = queryClient.invalidateQueries(options)
    // Should not error
    const data2 = queryClient.fetchQuery(options)

    expectTypeOf(data).toEqualTypeOf<Promise<void>>()
    expectTypeOf(data2).toEqualTypeOf<Promise<number>>()
  })
})
