// useQueries under the 2.0 read layer: every result is a full useQuery-shaped
// read (suspending data, non-nullable when settled), positionally keyed so
// option changes flow into existing rows and length changes create/dispose
// tail rows. `combine` is a derived read over the results.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { For, Loading, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, useQueries } from '..'
import { renderWithClient } from './utils'

describe('useQueries 2.0 read semantics', () => {
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

  it('suspends all first loads into <Loading> and renders when settled', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const results = useQueries(() => ({
        queries: [
          { queryKey: key1, queryFn: () => sleep(10).then(() => 'one') },
          { queryKey: key2, queryFn: () => sleep(20).then(() => 'two') },
        ],
      }))
      return (
        <div>
          <span>{results[0].data}</span>
          <span>{results[1].data}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('one')).toBeInTheDocument()
    expect(rendered.getByText('two')).toBeInTheDocument()
  })

  it('derives combine reactively over the results', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const summary = useQueries(() => ({
        queries: [
          { queryKey: key1, queryFn: () => sleep(10).then(() => 1) },
          { queryKey: key2, queryFn: () => sleep(10).then(() => 2) },
        ],
        combine: (results) => ({
          total: results.reduce((sum, r) => sum + r.data, 0),
        }),
      }))
      return <span>total: {summary.total}</span>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('total: 3')).toBeInTheDocument()

    queryClient.setQueryData(key2, 10)
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('total: 11')).toBeInTheDocument()
  })

  it('creates and disposes rows as the queries array grows and shrinks', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const [keys, setKeys] = createSignal([key1])

    function Page() {
      const results = useQueries(() => ({
        queries: keys().map((key, i) => ({
          queryKey: key,
          queryFn: () => sleep(10).then(() => `value${i + 1}`),
        })),
      }))
      return (
        <div>
          <For each={results}>{(result) => <span>{result.data}</span>}</For>
          <span>count: {results.length}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('value1')).toBeInTheDocument()
    expect(rendered.getByText('count: 1')).toBeInTheDocument()

    setKeys([key1, key2])
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('value1')).toBeInTheDocument()
    expect(rendered.getByText('value2')).toBeInTheDocument()
    expect(rendered.getByText('count: 2')).toBeInTheDocument()

    setKeys([key1])
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.queryByText('value2')).not.toBeInTheDocument()
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
  })
})
