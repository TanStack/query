import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InfiniteQueryObserver, dehydrate } from '@tanstack/query-core'
import { setIsRestoring } from '../../src/core/index.js'
import {
  MutationBinding,
  QueriesBinding,
  QueryBinding,
  idleMutationResult,
  readIsFetching,
  readMutationState,
  readQueries,
  readQuery,
  toPlainResult,
  watchIsFetching,
  watchIsMutating,
  watchMutationState,
} from '../../src/core/internal.js'
import { createClient, setServer, sleep } from './utils.js'
import type { QueryObserverResult } from '@tanstack/query-core'

describe('bindings', () => {
  afterEach(() => setServer(true))

  const fresh = { staleTime: 60_000 }

  describe('readQuery (server render)', () => {
    beforeEach(() => setServer(true))

    it('returns the plain optimistic result and the dehydrated entry', async () => {
      const client = createClient()
      await client.query({ queryKey: ['a'], queryFn: () => 'A' })
      const snapshot = readQuery<QueryObserverResult>(client, {
        queryKey: ['a'],
        queryFn: () => 'A',
        ...fresh,
      })
      expect(snapshot.result).toMatchObject({ status: 'success', data: 'A' })
      expect(
        Object.values(snapshot.result).some((v) => typeof v === 'function'),
      ).toBe(false)
      expect('promise' in snapshot.result).toBe(false)
      expect(snapshot.hydration?.queries.map((q) => q.queryHash)).toStrictEqual(
        ['["a"]'],
      )
      expect(snapshot.error).toBeUndefined()
    })

    it('a query that was not fetched is pending and has nothing to hydrate', () => {
      const client = createClient()
      const snapshot = readQuery<QueryObserverResult>(client, {
        queryKey: ['missing'],
        queryFn: () => 1,
      })
      expect(snapshot.result.status).toBe('pending')
      expect(snapshot.hydration).toBeUndefined()
    })

    it('honours throwOnError', async () => {
      const client = createClient()
      const error = new Error('boom')
      await client
        .query({ queryKey: ['e'], queryFn: () => Promise.reject(error) })
        .catch(() => {})
      const options = { queryKey: ['e'], queryFn: () => 1, retryOnMount: false }
      expect(readQuery(client, options).error).toBeUndefined()
      expect(readQuery(client, { ...options, throwOnError: true }).error).toBe(
        error,
      )
    })

    it("respects the client's dehydrate defaults", async () => {
      const client = createClient()
      client.setDefaultOptions({
        ...client.getDefaultOptions(),
        dehydrate: { serializeData: (data) => `serialized:${data}` },
      })
      await client.query({ queryKey: ['s'], queryFn: () => 'x' })
      const snapshot = readQuery(client, {
        queryKey: ['s'],
        queryFn: () => 'x',
      })
      expect(snapshot.hydration?.queries[0]?.state.data).toBe('serialized:x')
    })
  })

  describe('QueryBinding (browser)', () => {
    beforeEach(() => setServer(false))

    it('hydrates the server entry first, so fresh data is not refetched', async () => {
      setServer(true)
      const server = createClient()
      await server.query({ queryKey: ['h'], queryFn: () => 'server' })
      const hydration = dehydrate(server)
      setServer(false)

      const client = createClient()
      const queryFn = vi.fn<() => string>(() => 'browser')
      const results: Array<QueryObserverResult> = []
      const binding = new QueryBinding(
        client,
        { queryKey: ['h'], queryFn, ...fresh },
        (r) => results.push(r),
        undefined,
        hydration,
      )
      await sleep(5)
      expect(queryFn).not.toHaveBeenCalled()
      expect(results.at(-1)).toMatchObject({
        data: 'server',
        fetchStatus: 'idle',
      })
      binding.destroy()
    })

    it('the first result is optimistic and updates follow', async () => {
      const client = createClient()
      const results: Array<QueryObserverResult> = []
      const binding = new QueryBinding(
        client,
        { queryKey: ['o'], queryFn: () => sleep(5).then(() => 'done') },
        (r) => results.push(r),
      )
      expect(results[0]).toMatchObject({
        status: 'pending',
        fetchStatus: 'fetching',
      })
      await sleep(20)
      expect(results.at(-1)).toMatchObject({ status: 'success', data: 'done' })
      binding.destroy()
    })

    it('setOptions switches the query', async () => {
      const client = createClient()
      const results: Array<QueryObserverResult> = []
      const binding = new QueryBinding(
        client,
        { queryKey: ['p', 1], queryFn: () => 1 },
        (r) => results.push(r),
      )
      await sleep(5)
      binding.setOptions({ queryKey: ['p', 2], queryFn: () => 2 })
      await sleep(5)
      expect(results.at(-1)).toMatchObject({ data: 2 })
      binding.destroy()
    })

    it('subscribed: false does not fetch until it is true', async () => {
      const client = createClient()
      const queryFn = vi.fn<() => number>(() => 1)
      const options = { queryKey: ['sub'], queryFn }
      const binding = new QueryBinding(
        client,
        { ...options, subscribed: false } as never,
        () => {},
      )
      await sleep(5)
      expect(queryFn).not.toHaveBeenCalled()
      binding.setOptions(options)
      await sleep(5)
      expect(queryFn).toHaveBeenCalledTimes(1)
      binding.destroy()
    })

    it('waits while the cache is restoring', async () => {
      const client = createClient()
      setIsRestoring(client, true)
      const queryFn = vi.fn<() => number>(() => 1)
      const results: Array<QueryObserverResult> = []
      const binding = new QueryBinding(
        client,
        { queryKey: ['r'], queryFn },
        (r) => results.push(r),
      )
      await sleep(5)
      expect(queryFn).not.toHaveBeenCalled()
      expect(results[0]?.fetchStatus).toBe('idle')
      setIsRestoring(client, false)
      await sleep(5)
      expect(queryFn).toHaveBeenCalledTimes(1)
      binding.destroy()
    })

    it('infinite queries use the infinite observer', async () => {
      const client = createClient()
      const results: Array<QueryObserverResult> = []
      const binding = new QueryBinding(
        client,
        {
          queryKey: ['inf'],
          queryFn: ({ pageParam }: { pageParam: number }) => pageParam,
          initialPageParam: 0,
          getNextPageParam: (last: number) => last + 1,
        } as never,
        (r) => results.push(r),
        InfiniteQueryObserver,
      )
      await sleep(5)
      await (
        binding.observer as unknown as InfiniteQueryObserver
      ).fetchNextPage()
      await sleep(1)
      expect(results.at(-1)?.data).toStrictEqual({
        pages: [0, 1],
        pageParams: [0, 1],
      })
      binding.destroy()
    })

    it('destroy is idempotent and stops updates', async () => {
      const client = createClient()
      const onResult = vi.fn<(result: QueryObserverResult) => void>()
      const binding = new QueryBinding(
        client,
        { queryKey: ['d'], queryFn: () => 1 },
        onResult,
      )
      binding.destroy()
      binding.destroy()
      const calls = onResult.mock.calls.length
      await client.refetchQueries()
      expect(onResult).toHaveBeenCalledTimes(calls)
    })
  })

  describe('queries', () => {
    it('read and observe several queries, with combine', async () => {
      setServer(true)
      const client = createClient()
      await client.query({ queryKey: ['q', 1], queryFn: () => 1 })
      const input = {
        queries: [
          { queryKey: ['q', 1], queryFn: () => 1, ...fresh },
          { queryKey: ['q', 2], queryFn: () => 2, ...fresh },
        ],
      }
      const snapshot = readQueries(client, input)
      expect(
        (snapshot.result as Array<QueryObserverResult>).map((r) => r.status),
      ).toStrictEqual(['success', 'pending'])
      expect(snapshot.hydration?.queries).toHaveLength(1)

      setServer(false)
      const values: Array<unknown> = []
      const binding = new QueriesBinding(
        client,
        {
          ...input,
          combine: (results: Array<QueryObserverResult>) =>
            results.map((r) => r.data),
        },
        (value) => values.push(value.combined),
      )
      await sleep(5)
      expect(values.at(-1)).toStrictEqual([1, 2])
      binding.destroy()
    })
  })

  describe('mutations', () => {
    beforeEach(() => setServer(false))

    it('mutate works before subscribing, swallows errors; mutateAsync rejects', async () => {
      const client = createClient()
      const binding = new MutationBinding(client, {
        mutationFn: (n: number) =>
          n < 0 ? Promise.reject(new Error('neg')) : Promise.resolve(n * 2),
      })
      binding.mutate(-1)
      await sleep(5)
      expect(binding.observer.getCurrentResult().status).toBe('error')
      const results: Array<string> = []
      binding.subscribe((r) => results.push(r.status))
      await expect(binding.mutateAsync(2)).resolves.toBe(4)
      await expect(binding.mutateAsync(-1)).rejects.toThrow('neg')
      await sleep(1)
      expect(results).toContain('success')
      binding.destroy()
    })

    it('idleMutationResult is the plain idle result', () => {
      const result = idleMutationResult()
      expect(result.status).toBe('idle')
      expect(Object.values(result).some((v) => typeof v === 'function')).toBe(
        false,
      )
    })
  })

  describe('cache watchers', () => {
    beforeEach(() => setServer(false))

    it('isFetching, isMutating and mutation state', async () => {
      const client = createClient()
      const fetching: Array<number> = []
      const mutating: Array<number> = []
      const states: Array<Array<unknown>> = []
      const a = watchIsFetching(client, undefined, (v) => fetching.push(v))
      const b = watchIsMutating(client, undefined, (v) => mutating.push(v))
      const c = watchMutationState(
        client,
        { filters: { status: 'success' }, select: (m) => m.state.data },
        (v) => states.push(v),
      )
      expect(readIsFetching(client)).toBe(0)
      void client.query({
        queryKey: ['w'],
        queryFn: () => sleep(5).then(() => 1),
      })
      await expect
        .poll(() => fetching.at(-1), { timeout: 2_000, interval: 5 })
        .toBe(1)
      await expect
        .poll(() => fetching.at(-1), { timeout: 2_000, interval: 5 })
        .toBe(0)

      const binding = new MutationBinding(client, {
        mutationFn: (n: number) => sleep(5).then(() => n),
      })
      const pending = binding.mutateAsync(7)
      await expect
        .poll(() => mutating.at(-1), { timeout: 2_000, interval: 5 })
        .toBe(1)
      await pending
      await expect
        .poll(() => mutating.at(-1), { timeout: 2_000, interval: 5 })
        .toBe(0)
      expect(states.at(-1)).toStrictEqual([7])
      expect(readMutationState(client)).toHaveLength(1)
      a.destroy()
      b.destroy()
      c.destroy()
    })
  })

  it('toPlainResult drops functions', () => {
    const plain = toPlainResult({ a: 1, refetch() {} })
    expect(plain).toStrictEqual({ a: 1 })
  })
})
