import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  QueryClient,
  dehydrate,
  fetchInfiniteQuery,
  hydrate,
  refetchQueries,
} from '..'
import {
  clearQueryClient,
  getQueryData,
  setQueryDefaults,
} from '../runtime/queryClient'
import type { InfiniteData } from '..'

describe('fetchInfiniteQuery', () => {
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

    const promise = fetchInfiniteQuery(server, options)
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
