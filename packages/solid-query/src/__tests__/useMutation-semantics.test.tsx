// useMutation on core `action`: each mutate() is one transaction. Transient
// flight state is an optimistic overlay (auto-drops at settle); durable state
// commits post-yield atomically with invalidation-triggered refetches;
// query-core supplies retry/offline/scope policy through
// mutationCache.build().execute(). One mutate, returning a safe-to-ignore
// promise. onMutate is the optimistic-overlay window — no context, no
// rollback plumbing.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Loading, createOptimistic, createRenderEffect } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, useMutation, useQuery } from '..'
import { renderWithClient } from './utils'

describe('useMutation 2.0 semantics', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('shows pending during flight and lands data on success', async () => {
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (name: string) => sleep(10).then(() => `hello ${name}`),
      }))
      return (
        <div>
          <span>
            status: {mutation.status}, data: {mutation.data ?? 'none'}
          </span>
          <button onClick={() => mutation.mutate('world')}>go</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    expect(rendered.getByText('status: idle, data: none')).toBeInTheDocument()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('status: pending, data: none'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('status: success, data: hello world'),
    ).toBeInTheDocument()
  })

  it('routes errors to state; the ignored promise never surfaces as unhandled', async () => {
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('nope'))),
      }))
      return (
        <div>
          <span>
            status: {mutation.status}, error: {mutation.error?.message ?? 'none'}
          </span>
          <button onClick={() => mutation.mutate()}>go</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('status: error, error: nope'),
    ).toBeInTheDocument()
  })

  it('awaiting mutate rejects with the mutation error', async () => {
    let caught: unknown
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () => sleep(5).then(() => Promise.reject(new Error('boom'))),
      }))
      return (
        <button
          onClick={() => {
            mutation.mutate().catch((error) => {
              caught = error
            })
          }}
        >
          go
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(5)
    expect((caught as Error).message).toBe('boom')
  })

  it('onMutate optimistic overlay shows during flight and reverts on failure', async () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'alice')

    function Page() {
      const [draft, setDraft] = createOptimistic<string | null>(null)
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(5).then(() => 'alice'),
        staleTime: 60_000,
      }))
      const mutation = useMutation(() => ({
        mutationFn: (_name: string) =>
          sleep(10).then(() => Promise.reject(new Error('rejected'))),
        onMutate: (name) => setDraft(name),
      }))
      return (
        <div>
          <span>name: {draft() ?? query.data}</span>
          <button onClick={() => mutation.mutate('bob')}>rename</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    expect(rendered.getByText('name: alice')).toBeInTheDocument()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('name: bob')).toBeInTheDocument()

    // Failure settles the transition; the overlay drops with nothing
    // durable behind it — automatic rollback.
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('name: alice')).toBeInTheDocument()
  })

  it('onMutate overlay + onSuccess cache write hand off without a gap', async () => {
    const key = queryKey()
    queryClient.setQueryData(key, 'alice')

    function Page() {
      const [draft, setDraft] = createOptimistic<string | null>(null)
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(5).then(() => 'alice'),
        staleTime: 60_000,
      }))
      const mutation = useMutation(() => ({
        mutationFn: (name: string) => sleep(10).then(() => name),
        onMutate: (name) => setDraft(name),
        onSuccess: (name, _vars, _result, context) => {
          context.client.setQueryData(key, name)
        },
      }))
      return (
        <div>
          <span>name: {draft() ?? query.data}</span>
          <button onClick={() => mutation.mutate('bob')}>rename</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('name: bob')).toBeInTheDocument()

    // The overlay drops in the same settle that commits the cache write:
    // never a frame showing 'alice' again.
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('name: bob')).toBeInTheDocument()
  })

  it('settles atomically with invalidation-triggered refetches', async () => {
    const key = queryKey()
    let serverCount = 0
    const commits: Array<string> = []

    function Page() {
      const query = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(5).then(() => serverCount),
        staleTime: 60_000,
      }))
      const mutation = useMutation(() => ({
        mutationFn: () =>
          sleep(10).then(() => {
            serverCount++
          }),
        onSuccess: (_data, _vars, _result, context) => {
          void context.client.invalidateQueries({ queryKey: key })
        },
      }))
      createRenderEffect(
        () => `${query.data}:${mutation.isPending}`,
        (pair) => {
          commits.push(pair)
        },
      )
      return (
        <div>
          <span>
            count: {query.data}, pending: {String(mutation.isPending)}
          </span>
          <button onClick={() => mutation.mutate()}>increment</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))
    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('count: 0, pending: false')).toBeInTheDocument()

    rendered.getByRole('button').click()
    // Mutation in flight: pending overlay visible, data unchanged.
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('count: 0, pending: true')).toBeInTheDocument()

    // Mutation succeeds at +10ms, invalidation refetch needs +5ms more.
    // The settle holds until fresh data lands. Engine sequencing for
    // optimistic overlays: async landings commit UNDER the overlay mask,
    // then the mask lifts in the immediately-following commit — so fresh
    // data appears first with pending still up, and pending clears next.
    // The invariant that matters: stale data is never paired with a
    // settled mutation — (0, false) never reappears, (0-settled) and
    // (1-before-success-landed) don't exist.
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('count: 1, pending: false')).toBeInTheDocument()
    expect(commits).toEqual(['0:false', '0:true', '1:true', '1:false'])
  })

  it('reset returns to idle', async () => {
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () => sleep(5).then(() => 'done'),
      }))
      return (
        <div>
          <span>status: {mutation.status}</span>
          <button onClick={() => mutation.mutate()}>go</button>
          <button onClick={() => mutation.reset()}>reset</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    rendered.getByText('go').click()
    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('status: success')).toBeInTheDocument()

    rendered.getByText('reset').click()
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('status: idle')).toBeInTheDocument()
  })

  it('runs scoped mutations serially through query-core', async () => {
    const order: Array<string> = []
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: (id: string) => {
          order.push(`start:${id}`)
          return sleep(10).then(() => {
            order.push(`end:${id}`)
            return id
          })
        },
        scope: { id: 'serial' },
      }))
      return (
        <button
          onClick={() => {
            mutation.mutate('a')
            mutation.mutate('b')
          }}
        >
          go
        </button>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(30)
    expect(order).toEqual(['start:a', 'end:a', 'start:b', 'end:b'])
  })

  it('applies query-core retry policy', async () => {
    let attempts = 0
    function Page() {
      const mutation = useMutation(() => ({
        mutationFn: () => {
          attempts++
          return sleep(5).then(() =>
            attempts < 2 ? Promise.reject(new Error('flaky')) : 'recovered',
          )
        },
        retry: 1,
        retryDelay: 5,
      }))
      return (
        <div>
          <span>
            status: {mutation.status}, data: {mutation.data ?? 'none'}
          </span>
          <button onClick={() => mutation.mutate()}>go</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)
    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(30)
    expect(attempts).toBe(2)
    expect(
      rendered.getByText('status: success, data: recovered'),
    ).toBeInTheDocument()
  })
})
