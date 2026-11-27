import { describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  QueryObserver,
  clearQueryClient,
  getQueriesData,
  getQueryCache,
  getQueryObserverCount,
  invalidateCachedQuery,
  invalidateQueries,
  isQueryFetched,
  removeQueries,
  resetCachedQuery,
  setQueriesData,
} from '..'
import { getQueryData, getQueryState, setQueryData } from '../queryClient'

describe('cache operations', () => {
  it('applies imported cache operations to the supplied client', async () => {
    const client = new QueryClient()
    const otherClient = new QueryClient()
    const filters = { queryKey: ['posts'] }
    setQueryData(client, ['posts', 1], 2)
    setQueryData(client, ['posts', 2], 3)
    setQueryData(otherClient, ['posts', 1], 10)

    setQueriesData<number>(client, filters, (count = 0) => count * 2)
    expect(getQueriesData(client, filters)).toStrictEqual([
      [['posts', 1], 4],
      [['posts', 2], 6],
    ])
    await invalidateQueries(client, { ...filters, refetchType: 'none' })
    expect(getQueryState(client, ['posts', 1])?.isInvalidated).toBe(true)
    removeQueries(client, filters)
    expect(getQueriesData(client, filters)).toStrictEqual([])
    expect(getQueryData(otherClient, ['posts', 1])).toBe(10)
  })
})

describe('cached query operations', () => {
  it('invalidates an observed query once without starting a fetch', () => {
    const client = new QueryClient()
    const queryFn = vi.fn(() => 'fetched')
    const options = {
      queryKey: ['book'],
      initialData: 'seed',
      staleTime: Infinity,
      queryFn,
    }
    const first = new QueryObserver(client, options)
    const second = new QueryObserver(client, { ...options, enabled: false })
    const entry = first.getCurrentQuery()

    expect(getQueryObserverCount(entry)).toBe(0)
    const unsubscribeFirst = first.subscribe(() => {})
    const unsubscribeSecond = second.subscribe(() => {})
    expect(getQueryObserverCount(entry)).toBe(2)

    const actions: Array<string> = []
    const unsubscribeCache = getQueryCache(client).subscribe((event) => {
      if (event.type === 'updated' && event.query === entry) {
        actions.push(event.action.type)
      }
    })
    invalidateCachedQuery(entry)
    invalidateCachedQuery(entry)

    expect(actions).toStrictEqual(['invalidate'])
    expect(first.getCurrentResult().isStale).toBe(true)
    expect(queryFn).not.toHaveBeenCalled()
    expect(isQueryFetched(entry)).toBe(false)

    unsubscribeCache()
    unsubscribeSecond()
    expect(getQueryObserverCount(entry)).toBe(1)
    unsubscribeFirst()
    expect(getQueryObserverCount(entry)).toBe(0)
    clearQueryClient(client)
  })

  it('restores initial data and clears recorded fetches after success or failure', async () => {
    const client = new QueryClient()
    const queryFn = vi.fn<() => Promise<string>>()
    const entry = new QueryObserver(client, {
      queryKey: ['book'],
      initialData: 'seed',
      initialDataUpdatedAt: 123,
      retry: false,
      queryFn,
    }).getCurrentQuery()
    const initialState = entry.state
    expect(isQueryFetched(entry)).toBe(false)

    queryFn.mockResolvedValueOnce('fresh')
    await expect(entry.fetch()).resolves.toBe('fresh')
    expect(isQueryFetched(entry)).toBe(true)
    resetCachedQuery(entry)
    expect(entry.state).toStrictEqual(initialState)
    expect(isQueryFetched(entry)).toBe(false)

    queryFn.mockRejectedValueOnce(new Error('offline'))
    await expect(entry.fetch()).rejects.toThrow('offline')
    expect(isQueryFetched(entry)).toBe(true)
    resetCachedQuery(entry)
    expect(entry.state).toStrictEqual(initialState)
    expect(isQueryFetched(entry)).toBe(false)
    expect(queryFn).toHaveBeenCalledTimes(2)
    clearQueryClient(client)
  })
})
