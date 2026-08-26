// The 2.0-native read-layer contract: data is an async computation — first
// loads suspend into <Loading>, settled reads are the value (non-nullable),
// refetches hold the committed UI until fresh data lands, and errors surface
// through the graph to <Errored>. These tests pin the semantics the rewrite
// is built around; the legacy suite pins v5 observer mechanics and is being
// re-pointed separately.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@solidjs/testing-library'
import { Errored, Loading, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, useQuery } from '..'
import { renderWithClient } from './utils'

describe('useQuery 2.0 read semantics', () => {
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

  it('suspends the first load into <Loading> and renders data on settle', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('test')).toBeInTheDocument()
  })

  it('serves settled data without guards', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'test'),
      }))
      // The settled read is TData, not TData | undefined — method calls
      // need no optional chaining once the boundary has resolved.
      return <span>{state.data.toUpperCase()}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('TEST')).toBeInTheDocument()
  })

  it('holds the committed UI through a refetch and swaps when it lands', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => `data${++count}`),
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data1')).toBeInTheDocument()

    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(5)
    // Mid-refetch: previous committed value stays visible — no fallback.
    expect(rendered.getByText('data1')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('data2')).toBeInTheDocument()
  })

  it('surfaces a first-load failure to <Errored>', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('fetch failed'))),
        retry: false,
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Errored
        fallback={(err) => <span>error: {(err() as Error).message}</span>}
      >
        <Loading fallback={<span>loading</span>}>
          <Page />
        </Loading>
      </Errored>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error: fetch failed')).toBeInTheDocument()
  })

  it('keeps stale data and exposes error state when a refetch fails', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() =>
            ++count === 1
              ? 'good'
              : Promise.reject(new Error('refetch failed')),
          ),
        retry: false,
      }))
      return (
        <div>
          <span>{state.data}</span>
          <span>refetchError: {String(state.isRefetchError)}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Errored fallback={() => <span>boundary</span>}>
        <Loading fallback={<span>loading</span>}>
          <Page />
        </Loading>
      </Errored>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('good')).toBeInTheDocument()

    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    // Stale data keeps serving; the failure is state, not a crash.
    expect(rendered.getByText('good')).toBeInTheDocument()
    expect(rendered.getByText('refetchError: true')).toBeInTheDocument()
    expect(rendered.queryByText('boundary')).not.toBeInTheDocument()
  })

  it('renders placeholderData immediately without suspending', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'real'),
        placeholderData: 'placeholder',
      }))
      return (
        <div>
          <span>{state.data}</span>
          <span>placeholder: {String(state.isPlaceholderData)}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('placeholder')).toBeInTheDocument()
    expect(rendered.getByText('placeholder: true')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('real')).toBeInTheDocument()
    expect(rendered.getByText('placeholder: false')).toBeInTheDocument()
  })

  it('renders initialData immediately while the mount refetch runs', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
        initialData: 'initial',
        staleTime: 0,
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('initial')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()
  })

  it('applies select to the settled value', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'solid' })),
        select: (d: { name: string }) => d.name.toUpperCase(),
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('SOLID')).toBeInTheDocument()
  })

  it('reflects setQueryData writes reactively', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'fetched'),
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetched')).toBeInTheDocument()

    queryClient.setQueryData(key, 'written')
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('written')).toBeInTheDocument()
  })

  it('suspends a disabled query until it is enabled', async () => {
    const key = queryKey()
    const [enabled, setEnabled] = createSignal(false)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'ready'),
        enabled: enabled(),
      }))
      return <span>{state.data}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    // Still parked: disabled means nothing is in flight to wait for.
    expect(rendered.getByText('loading')).toBeInTheDocument()

    setEnabled(true)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('ready')).toBeInTheDocument()
  })

  it('exposes background fetch state reactively', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      }))
      return (
        <div>
          <span>{state.data}</span>
          <span>fetching: {String(state.isFetching)}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()

    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('fetching: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()
  })

  it('settles isFetching after a key switch (settle events arrive before the hold commits)', async () => {
    // Regression: the cache-event subscription filtered by the committed
    // options hash only. On a key switch the new key's fetch settles while
    // the hold still serves the old options, so the settle event was dropped
    // — data landed (via the promise) but meta/isFetching stayed stale
    // forever. The filter now also matches the latest computed hash.
    const key = queryKey()

    function Page() {
      const [id, setId] = createSignal(1)
      const state = useQuery(() => ({
        queryKey: [key, id()],
        queryFn: ({ queryKey: [, k] }) => sleep(10).then(() => `v${k}`),
      }))
      return (
        <div>
          <button onClick={() => setId(2)}>next</button>
          <div>data: {state.data}</div>
          <div>isFetching: {String(state.isFetching)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: v1')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /next/i }))
    await vi.advanceTimersByTimeAsync(5)
    // Committed UI held, background fetch observable.
    expect(rendered.getByText('data: v1')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: true')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('data: v2')).toBeInTheDocument()
    expect(rendered.getByText('isFetching: false')).toBeInTheDocument()
  })
})
