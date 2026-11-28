import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  QueryClient,
  dehydrate,
  getQueryCache,
  hydrate,
  infiniteQuery,
  query,
  refetchQueries,
} from '..'
import {
  clearQueryClient,
  getQueryData,
  setQueryDefaults,
} from '../queryClient'
import type { InfiniteData } from '..'

describe('infiniteQuery', () => {
  it('retains the page fetcher if a cache listener replaces the query options', async () => {
    const client = new QueryClient()
    getQueryCache(client).subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'fetch') {
        event.query.setOptions({
          ...event.query.options,
          queryFn: () => 'replacement',
        })
      }
    })
    const pages = await infiniteQuery(client, {
      queryKey: ['infinite'],
      queryFn: ({ pageParam }) => pageParam,
      initialPageParam: 0,
      getNextPageParam: (lastPage) => lastPage + 1,
      pages: 2,
    })
    expect(pages).toStrictEqual({ pages: [0, 1], pageParams: [0, 1] })

    // An ordinary fetch looks up its query function when the retryer starts.
    await expect(
      query(client, { queryKey: ['ordinary'], queryFn: () => 'original' }),
    ).resolves.toBe('replacement')
    clearQueryClient(client)
  })

  it('refetches hydrated pages before any observer subscribes', async () => {
    const server = new QueryClient()
    const client = new QueryClient()
    const queryKey = ['pages']
    const fetchPage = vi.fn<(context: { pageParam?: unknown }) => number>(
      ({ pageParam }) => (typeof pageParam === 'number' ? pageParam : -1),
    )
    const options = {
      queryKey,
      queryFn: fetchPage,
      initialPageParam: 0,
      getNextPageParam: (lastPage: number) => lastPage + 1,
      pages: 2,
    }

    const promise = infiniteQuery(server, options)
    expectTypeOf(promise).toEqualTypeOf<Promise<InfiniteData<number, number>>>()
    expect(
      fetchPage.mock.calls.map(([context]) => context.pageParam),
    ).toStrictEqual([0])
    await promise

    setQueryDefaults(client, queryKey, options)
    hydrate(client, dehydrate(server))
    fetchPage.mockClear()
    await refetchQueries(client, { queryKey })
    expect(
      fetchPage.mock.calls.map(([context]) => context.pageParam),
    ).toStrictEqual([0, 1])
    expect(getQueryData(client, queryKey)).toStrictEqual({
      pages: [0, 1],
      pageParams: [0, 1],
    })
    clearQueryClient(client)
    clearQueryClient(server)
  })
})
