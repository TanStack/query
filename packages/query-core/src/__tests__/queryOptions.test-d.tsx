import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import { queryOptions } from '../queryOptions'
import { dataTagErrorSymbol, dataTagSymbol } from '../types'
import { defaultQueryFn, skipToken } from '../utils'

// Verify consumers can export options without inaccessible data tag symbols.
export const exportedQueryOptions = queryOptions({
  queryKey: ['exported'],
  queryFn: defaultQueryFn,
})

describe('queryOptions', () => {
  it('should not allow excess properties', () => {
    assertType(
      queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error stallTime does not exist
        stallTime: 1000,
      }),
    )
  })

  it('should not allow framework-specific options', () => {
    assertType(
      queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error throwOnError depends on the framework adapter
        throwOnError: true,
      }),
    )
    assertType(
      queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error suspense depends on the framework adapter
        suspense: true,
      }),
    )
    assertType(
      queryOptions({
        queryKey: ['key'],
        queryFn: () => Promise.resolve(5),
        // @ts-expect-error notifyOnChangeProps depends on the framework adapter
        notifyOnChangeProps: ['data'],
      }),
    )
  })

  it('should require queryFn', () => {
    // @ts-expect-error queryFn is required
    assertType(queryOptions({ queryKey: ['key'] }))
  })

  it('should preserve raw cache data when select transforms the observer result', () => {
    const options = queryOptions({
      queryKey: ['selected'],
      queryFn: () => Promise.resolve({ id: 1 }),
      select: (data) => data.id.toString(),
    })
    expectTypeOf(options.select).returns.toEqualTypeOf<string>()
    expectTypeOf(
      new QueryClient().getQueryData(options.queryKey),
    ).toEqualTypeOf<{ id: number } | undefined>()
  })

  it('should accept optional initialData without promising defined data', () => {
    const options = queryOptions({
      queryKey: ['optional-initial-data'],
      queryFn: () => Promise.resolve('fetched'),
      initialData: Math.random() > 0.5 ? 'initial' : undefined,
    })
    expectTypeOf(options.initialData).toExtend<
      string | (() => string | undefined) | undefined
    >()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<string>()
  })

  it('should infer query data from queryFn', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
    })

    type QueryFn = Exclude<typeof options.queryFn, typeof defaultQueryFn>

    expectTypeOf<Awaited<ReturnType<QueryFn>>>().toEqualTypeOf<number>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
    expectTypeOf(options.queryKey[dataTagErrorSymbol]).toEqualTypeOf<Error>()
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

  it('should infer data from initialData with defaultQueryFn', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: defaultQueryFn,
      initialData: 1,
    })

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
    expectTypeOf(
      new QueryClient().getQueryData(options.queryKey),
    ).toEqualTypeOf<number | undefined>()
  })

  it('should infer data when initialData is undefined', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      initialData: undefined,
    })

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should infer a callable queryFn without skipToken', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      enabled: false,
    })

    expectTypeOf(options.queryFn).not.toEqualTypeOf<typeof skipToken>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<number>()
  })

  it('should allow skipToken', () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: skipToken,
    })

    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<unknown>()
  })

  it('should work when passed to query', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: () => Promise.resolve(5),
      select: (data) => data.toString(),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<string>()
  })

  it('should allow undefined data in query when queryFn can be skipToken', async () => {
    const options = queryOptions({
      queryKey: ['key'],
      queryFn: Math.random() > 0.5 ? skipToken : () => Promise.resolve(5),
    })

    const data = await new QueryClient().query(options)
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })
})
