import { describe, expectTypeOf, it } from 'vitest'
import { infiniteQueryOptions } from '../infiniteQueryOptions'
import { QueryClient } from '../queryClient'
import { dataTagErrorSymbol, dataTagSymbol } from '../types'
import { skipToken } from '../utils'
import type { CoreInfiniteQueryOptions, InfiniteData } from '../index'

// Consumers must be able to emit declarations for exported options.
export const exportedInfiniteOptions = infiniteQueryOptions({
  queryKey: ['exported-infinite'],
  initialPageParam: 0,
  getNextPageParam: () => undefined,
})

describe('infiniteQueryOptions', () => {
  it('infers page data and parameters in callbacks and cache APIs', () => {
    const options = infiniteQueryOptions({
      queryKey: ['pages'] as const,
      initialPageParam: 0,
      queryFn: ({ pageParam, queryKey }) => {
        expectTypeOf(pageParam).toEqualTypeOf<number>()
        expectTypeOf(queryKey).toEqualTypeOf<readonly ['pages']>()
        return Promise.resolve({ next: pageParam + 1 })
      },
      getNextPageParam: (lastPage, pages, lastParam, params) => {
        expectTypeOf(lastPage).toEqualTypeOf<{ next: number }>()
        expectTypeOf(pages).toEqualTypeOf<Array<{ next: number }>>()
        expectTypeOf(lastParam).toEqualTypeOf<number>()
        expectTypeOf(params).toEqualTypeOf<Array<number>>()
        return lastPage.next
      },
      getPreviousPageParam: (_firstPage, _pages, firstParam) => firstParam - 1,
      enabled: (query) => {
        expectTypeOf(query.state.data).toEqualTypeOf<
          InfiniteData<{ next: number }, number> | undefined
        >()
        return true
      },
    })
    expectTypeOf(options.initialData).toEqualTypeOf<undefined>()
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<{ next: number }, number>
    >()
    expectTypeOf(options.queryKey[dataTagErrorSymbol]).toEqualTypeOf<Error>()
    const client = new QueryClient()
    expectTypeOf(client.getQueryData(options.queryKey)).toEqualTypeOf<
      InfiniteData<{ next: number }, number> | undefined
    >()
    expectTypeOf(client.infiniteQuery(options)).toEqualTypeOf<
      Promise<InfiniteData<{ next: number }, number>>
    >()
    client.setQueryData(options.queryKey, {
      pages: [{ next: 1 }],
      pageParams: [0],
    })
    client.setQueryData(options.queryKey, {
      pages: [{ next: 1 }],
      // @ts-expect-error cached page parameters must be numbers
      pageParams: ['0'],
    })
  })

  it('tags raw cached pages when select transforms the result', () => {
    const options = infiniteQueryOptions({
      queryKey: ['selected-pages'],
      initialPageParam: 'first',
      queryFn: ({ pageParam }) => Promise.resolve({ id: pageParam }),
      getNextPageParam: () => undefined,
      select: (data) => data.pages.map((page) => page.id).join(','),
      throwOnError: (error: Error & { code: string }) => error.code === 'fatal',
    })
    expectTypeOf(options.select).returns.toEqualTypeOf<string>()
    expectTypeOf(options.queryKey[dataTagErrorSymbol]).toEqualTypeOf<
      Error & { code: string }
    >()
    expectTypeOf(
      new QueryClient().getQueryData(options.queryKey),
    ).toEqualTypeOf<InfiniteData<{ id: string }, string> | undefined>()
    expectTypeOf(new QueryClient().infiniteQuery(options)).toEqualTypeOf<
      Promise<string>
    >()
  })

  it('preserves defined initial data', () => {
    const options = infiniteQueryOptions({
      queryKey: ['initial-pages'],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => Promise.resolve(pageParam),
      getNextPageParam: () => undefined,
      initialData: { pages: [1], pageParams: [0] },
    })
    expectTypeOf(options.initialData).toEqualTypeOf<
      InfiniteData<number, number> | (() => InfiniteData<number, number>)
    >()
  })

  it('accepts optional initial data without introducing skipToken', () => {
    const options = infiniteQueryOptions({
      queryKey: ['optional-pages'],
      initialPageParam: 0,
      queryFn: ({ pageParam }) => Promise.resolve(pageParam),
      getNextPageParam: () => undefined,
      initialData:
        Math.random() > 0.5 ? { pages: [1], pageParams: [0] } : undefined,
    })
    expectTypeOf<NonNullable<typeof options.queryFn>>().not.toEqualTypeOf<
      typeof skipToken
    >()
    expectTypeOf(options.initialData).toExtend<
      | InfiniteData<number, number>
      | (() => InfiniteData<number, number> | undefined)
      | undefined
    >()
  })

  it('supports skipToken without a query function', () => {
    const options = infiniteQueryOptions({
      queryKey: ['skipped'],
      initialPageParam: 0,
      queryFn: skipToken,
      getNextPageParam: () => undefined,
    })
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<unknown, number>
    >()
  })

  it('supports conditional skipToken', () => {
    const options = infiniteQueryOptions({
      queryKey: ['skipped-pages'],
      initialPageParam: 0,
      queryFn:
        Math.random() > 0.5
          ? ({ pageParam }) => Promise.resolve(pageParam)
          : skipToken,
      getNextPageParam: () => undefined,
    })
    expectTypeOf(options.queryKey[dataTagSymbol]).toEqualTypeOf<
      InfiniteData<number, number>
    >()
  })

  it('requires pagination options and rejects excess properties', () => {
    // @ts-expect-error initialPageParam is required
    infiniteQueryOptions({
      queryKey: ['missing-param'],
      getNextPageParam: () => undefined,
    })
    // @ts-expect-error getNextPageParam is required
    infiniteQueryOptions({ queryKey: ['missing-next'], initialPageParam: 0 })
    infiniteQueryOptions({
      queryKey: ['excess'],
      initialPageParam: 0,
      getNextPageParam: () => undefined,
      // @ts-expect-error misspelled option
      stallTime: 1000,
    })
    expectTypeOf<CoreInfiniteQueryOptions<number>>().toHaveProperty(
      'initialPageParam',
    )
  })
})
