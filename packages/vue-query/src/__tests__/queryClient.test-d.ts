import { assertType, describe, expectTypeOf, it } from 'vitest'
import { skipToken } from '@tanstack/query-core'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import type { DataTag, InfiniteData } from '@tanstack/query-core'

describe('getQueryData', () => {
  it('should be typed if key is tagged', () => {
    const key = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(key)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer unknown if key is not tagged', () => {
    const key = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(key)

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer passed generic if passed', () => {
    const key = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData<number>(key)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should only allow Arrays to be passed', () => {
    assertType<Parameters<QueryClient['getQueryData']>>([
      // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'QueryKey'
      { queryKey: 'key' },
    ])
  })
})

describe('setQueryData', () => {
  it('updater should be typed if key is tagged', () => {
    const key = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(key, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('value should be typed if key is tagged', () => {
    const key = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    queryClient.setQueryData(key, '1')

    // @ts-expect-error value should be a number
    queryClient.setQueryData(key, () => '1')

    const data = queryClient.setQueryData(key, 1)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer unknown for updater if key is not tagged', () => {
    const key = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(key, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<unknown>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer unknown for value if key is not tagged', () => {
    const key = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(key, 'foo')

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer passed generic if passed', () => {
    const key = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData<string>(key, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<string | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })

  it('should infer passed generic for value', () => {
    const key = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData<string>(key, 'foo')

    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })

  it('should preserve updater parameter type inference when used in functions with explicit return types', () => {
    const key = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()

    // Simulate usage inside a function with explicit return type
    // The outer function returns 'unknown' but this shouldn't affect the updater's type inference
    ;(() =>
      queryClient.setQueryData(key, (data) => {
        expectTypeOf(data).toEqualTypeOf<number | undefined>()
        return data
      })) satisfies () => unknown
  })
})

describe('fetchInfiniteQuery', () => {
  it('should allow passing pages', async () => {
    const key = queryKey()
    const data = await new QueryClient().fetchInfiniteQuery({
      queryKey: key,
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      pages: 5,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should not allow passing getNextPageParam without pages', () => {
    const key = queryKey()
    assertType<Parameters<QueryClient['fetchInfiniteQuery']>>([
      {
        queryKey: key,
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        getNextPageParam: () => 1,
      },
    ])
  })

  it('should not allow passing pages without getNextPageParam', () => {
    const key = queryKey()
    assertType<Parameters<QueryClient['fetchInfiniteQuery']>>([
      // @ts-expect-error Property 'getNextPageParam' is missing
      {
        queryKey: key,
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        pages: 5,
      },
    ])
  })
})

describe('query', () => {
  it('should return the selected type', () => {
    const result = new QueryClient().query({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      select: (data) => data.length,
    })

    expectTypeOf(result).toEqualTypeOf<Promise<number>>()
  })

  it('should infer select type with skipToken', () => {
    const result = new QueryClient().query({
      queryKey: ['key'],
      queryFn: skipToken,
      select: (data: string) => data.length,
    })

    expectTypeOf(result).toEqualTypeOf<Promise<number>>()
  })

  it('should infer select type with skipToken and enabled false', () => {
    const result = new QueryClient().query({
      queryKey: ['key'],
      queryFn: skipToken,
      enabled: false,
      select: (data: string) => data.length,
    })

    expectTypeOf(result).toEqualTypeOf<Promise<number>>()
  })

  it('should infer select type with skipToken and enabled true', () => {
    const result = new QueryClient().query({
      queryKey: ['key'],
      queryFn: skipToken,
      enabled: true,
      select: (data: string) => data.length,
    })

    expectTypeOf(result).toEqualTypeOf<Promise<number>>()
  })
})

describe('infiniteQuery', () => {
  it('should return infinite data', async () => {
    const data = await new QueryClient().infiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should return the selected type', () => {
    const result = new QueryClient().infiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve({ count: 1 }),
      getNextPageParam: () => 2,
      initialPageParam: 1,
      select: (data) => data.pages.map((page) => page.count),
    })

    expectTypeOf(result).toEqualTypeOf<Promise<Array<number>>>()
  })

  it('should allow passing pages with getNextPageParam', () => {
    assertType<Parameters<QueryClient['infiniteQuery']>>([
      {
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        getNextPageParam: () => 1,
        pages: 5,
      },
    ])
  })

  it('should not allow passing pages without getNextPageParam', () => {
    assertType<Parameters<QueryClient['infiniteQuery']>>([
      // @ts-expect-error Property 'getNextPageParam' is missing
      {
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        pages: 5,
      },
    ])
  })

  it('should preserve page param inference', () => {
    new QueryClient().infiniteQuery({
      queryKey: ['key'],
      queryFn: ({ pageParam }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        return Promise.resolve(pageParam.toString())
      },
      initialPageParam: 1,
      getNextPageParam: () => undefined,
    })
  })
})
