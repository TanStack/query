import { describe, expectTypeOf, it } from 'vitest'
import { dataTagErrorSymbol, dataTagSymbol } from '../types'
import { skipToken } from '../utils'
import { QueryClient } from '../queryClient'
import { queryOptions } from '../queryOptions'

describe('queryOptions', () => {
  it('should infer query data from queryFn', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })
    type QueryFn = Exclude<typeof options.queryFn, typeof skipToken | undefined>

    expectTypeOf<Awaited<ReturnType<QueryFn>>>().toEqualTypeOf<number>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
    expectTypeOf(options.queryKey[dataTagErrorSymbol]).toEqualTypeOf<Error>()
  })

  it('should tag queryKey with the query data type', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should type check values passed to setQueryData from the tagged queryKey', () => {
    const options = queryOptions({
      queryKey: ['todo'],
      queryFn: () => Promise.resolve({ id: '1', title: 'Do Laundry' }),
    })
    const queryClient = new QueryClient()

    queryClient.setQueryData(options.queryKey, {
      id: '1',
      title: 'Wash dishes',
    })

    queryClient.setQueryData(options.queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<
        { id: string; title: string } | undefined
      >()
      return prev
    })

    // @ts-expect-error title should be a string
    queryClient.setQueryData(options.queryKey, { id: '1', title: 1 })

    // @ts-expect-error title is required
    queryClient.setQueryData(options.queryKey, { id: '1' })
  })

  it('should allow initialData without a queryFn', () => {
    const options = queryOptions({
      queryKey: ['key'],
      initialData: 1,
    })
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(options.queryKey)

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer data when initialData is undefined', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialData: undefined,
    })

    expectTypeOf(options.initialData).toEqualTypeOf<undefined>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
    expectTypeOf(options.queryKey[dataTagErrorSymbol]).toEqualTypeOf<Error>()
  })

  it('should infer a callable queryFn without skipToken', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })
    type QueryFn = Exclude<typeof options.queryFn, undefined>

    expectTypeOf<QueryFn>().not.toEqualTypeOf<typeof skipToken>()
    expectTypeOf<Awaited<ReturnType<QueryFn>>>().toEqualTypeOf<number>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should allow skipToken', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: skipToken,
    })

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<unknown>()
  })
})
