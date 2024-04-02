import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import type { FetchDirection } from '../query'
import type { DataTag, InfiniteData, QueryKey } from '../types'

describe('getQueryData', () => {
  it('should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer unknown if key is not tagged', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer passed generic if passed', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData<number>(queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should only allow Arrays to be passed', () => {
    const queryKey = 'key' as const
    const queryClient = new QueryClient()
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'QueryKey'
    return queryClient.getQueryData(queryKey)
  })
})

describe('setQueryData', () => {
  it('updater should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('value should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    queryClient.setQueryData(queryKey, '1')

    // @ts-expect-error value should be a number
    queryClient.setQueryData(queryKey, () => '1')

    const data = queryClient.setQueryData(queryKey, 1)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer unknown for updater if key is not tagged', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<unknown>()
      return prev
    })

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer unknown for value if key is not tagged', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, 'foo')

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer passed generic if passed', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData<string>(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<string | undefined>()
      return prev
    })

    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })

  it('should infer passed generic for value', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData<string>(queryKey, 'foo')

    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })
})

describe('fetchInfiniteQuery', () => {
  it('should allow passing pages', async () => {
    const data = await new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      pages: 5,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should not allow passing getNextPageParam without pages', () => {
    new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })
  })

  it('should not allow passing pages without getNextPageParam', () => {
    // @ts-expect-error Property 'getNextPageParam' is missing
    return new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      pages: 5,
    })
  })
})

describe('defaultOptions', () => {
  it('should have a typed QueryFunctionContext', () => {
    new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: (context) => {
            expectTypeOf(context).toEqualTypeOf<{
              queryKey: QueryKey
              meta: Record<string, unknown> | undefined
              signal: AbortSignal
              pageParam?: unknown
              direction?: FetchDirection
            }>()
            return Promise.resolve('data')
          },
        },
      },
    })
  })
})
