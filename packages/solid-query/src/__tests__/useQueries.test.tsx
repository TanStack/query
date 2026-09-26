import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import * as QueryCore from '@tanstack/query-core'
import { createRenderEffect, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  IsRestoringProvider,
  QueriesObserver,
  QueryCache,
  QueryClient,
  useQueries,
} from '..'
import { renderWithClient } from './utils'
import type { UseQueryResult } from '..'

describe('useQueries', () => {
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

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<Array<UseQueryResult>> = []

    function Page() {
      const result = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 1),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(100).then(() => 2),
          },
        ],
      }))

      createRenderEffect(() => {
        results.push([{ ...result[0] }, { ...result[1] }])
      })

      return (
        <div>
          <div>
            data1: {String(result[0].data ?? 'null')}, data2:{' '}
            {String(result[1].data ?? 'null')}
          </div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data1: 1, data2: 2')).toBeInTheDocument()

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  // eslint-disable-next-line vitest/expect-expect
  it('should not change state if unmounted', async () => {
    const key1 = queryKey()

    // We have to mock the QueriesObserver to not unsubscribe
    // the listener when the component is unmounted
    class QueriesObserverMock extends QueriesObserver {
      subscribe(listener: any) {
        super.subscribe(listener)
        return () => void 0
      }
    }

    const QueriesObserverSpy = vi
      .spyOn(QueryCore, 'QueriesObserver')
      .mockImplementation(function (
        client: InstanceType<typeof QueryCore.QueryClient>,
        queries: Array<QueryCore.QueryObserverOptions>,
      ) {
        return new QueriesObserverMock(client, queries)
      })

    function Queries() {
      useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 1),
          },
        ],
      }))

      return (
        <div>
          <span>queries</span>
        </div>
      )
    }

    function Page() {
      const [mounted, setMounted] = createSignal(true)

      return (
        <div>
          <button onClick={() => setMounted(false)}>unmount</button>
          {mounted() && <Queries />}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    fireEvent.click(rendered.getByText('unmount'))

    // Should not display the console error
    // "Warning: Can't perform a React state update on an unmounted component"

    await vi.advanceTimersByTimeAsync(20)
    QueriesObserverSpy.mockRestore()
  })

  it('should use provided custom queryClient', async () => {
    const key = queryKey()
    const queryFn = () => sleep(10).then(() => 'custom client')

    function Page() {
      const queries = useQueries(
        () => ({
          queries: [
            {
              queryKey: key,
              queryFn,
            },
          ],
        }),
        () => queryClient,
      )

      return <div>data: {queries[0].data}</div>
    }

    const rendered = render(() => <Page />)

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: custom client')).toBeInTheDocument()
  })

  it('should not fetch for the duration of the restoring period when isRestoring is true', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const queryFn1 = vi.fn(() => sleep(10).then(() => 'data1'))
    const queryFn2 = vi.fn(() => sleep(10).then(() => 'data2'))

    function Page() {
      const results = useQueries(() => ({
        queries: [
          { queryKey: key1, queryFn: queryFn1 },
          { queryKey: key2, queryFn: queryFn2 },
        ],
      }))

      return (
        <div>
          <div data-testid="status1">{results[0].status}</div>
          <div data-testid="status2">{results[1].status}</div>
          <div data-testid="fetchStatus1">{results[0].fetchStatus}</div>
          <div data-testid="fetchStatus2">{results[1].fetchStatus}</div>
          <div data-testid="data1">{results[0].data ?? 'undefined'}</div>
          <div data-testid="data2">{results[1].data ?? 'undefined'}</div>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <IsRestoringProvider value={() => true}>
        <Page />
      </IsRestoringProvider>
    ))

    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(rendered.getByTestId('data1')).toHaveTextContent('undefined')
    expect(rendered.getByTestId('data2')).toHaveTextContent('undefined')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })
  it('should keep updating a destructured result', async () => {
    const key = queryKey()

    function Page() {
      const [query] = useQueries(() => ({
        queries: [
          { queryKey: key, queryFn: () => sleep(10).then(() => 'data') },
        ],
      }))

      return <div>{`status: ${query.status}, data: ${String(query.data)}`}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(
      rendered.getByText('status: pending, data: undefined'),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('status: success, data: data'),
    ).toBeInTheDocument()
  })

  it('should keep updating a destructured result when combine returns the results', async () => {
    const key = queryKey()

    function Page() {
      const [query] = useQueries(() => ({
        queries: [
          { queryKey: key, queryFn: () => sleep(10).then(() => 'data') },
        ],
        combine: (results) => results,
      }))

      return <div>{`status: ${query.status}, data: ${String(query.data)}`}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(
      rendered.getByText('status: pending, data: undefined'),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('status: success, data: data'),
    ).toBeInTheDocument()
  })

  it('should drop the results of removed queries', async () => {
    const key = queryKey()

    function Page() {
      const [count, setCount] = createSignal(2)
      const queries = useQueries(() => ({
        queries: Array.from({ length: count() }, (_, index) => ({
          queryKey: [...key, index],
          queryFn: () => sleep(10).then(() => `data ${index}`),
        })),
      }))

      return (
        <div>
          <div>{`length: ${queries.length}, data: ${queries.map((query) => String(query.data)).join(',')}`}</div>
          <button onClick={() => setCount(1)}>remove</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('length: 2, data: data 0,data 1'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByText('remove'))
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('length: 1, data: data 0')).toBeInTheDocument()
  })

  it('should return the object that combine returns', async () => {
    const key = queryKey()

    function Page() {
      const combined = useQueries(() => ({
        queries: [1, 2].map((id) => ({
          queryKey: [...key, id],
          queryFn: () => sleep(10).then(() => `post ${id}`),
        })),
        combine: (results) => ({
          data: results.map((result) => result.data),
          isPending: results.some((result) => result.isPending),
        }),
      }))

      return (
        <div>{`isPending: ${combined.isPending}, data: ${combined.data.join(',')}`}</div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('isPending: true, data: ,')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('isPending: false, data: post 1,post 2'),
    ).toBeInTheDocument()
  })

  it('should drop the keys that combine no longer returns', async () => {
    const key = queryKey()

    function Page() {
      const combined = useQueries(() => ({
        queries: [
          { queryKey: key, queryFn: () => sleep(10).then(() => 'data') },
        ],
        combine: ([result]): Record<string, string> =>
          result.data === undefined
            ? { pending: 'yes' }
            : { data: result.data },
      }))

      return <div>{`keys: ${Object.keys(combined).join(',')}`}</div>
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('keys: pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('keys: data')).toBeInTheDocument()
  })

  it('should report the paused fetchStatus while offline', async ({
    onTestFinished,
  }) => {
    const key = queryKey()

    function Page() {
      const [id, setId] = createSignal(0)
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: [...key, id()],
            queryFn: () => sleep(10).then(() => `data ${id()}`),
          },
        ],
      }))

      return (
        <div>
          <div>
            {`data: ${String(queries[0].data)}, fetchStatus: ${queries[0].fetchStatus}`}
          </div>
          <button onClick={() => setId((prev) => prev + 1)}>next</button>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('data: data 0, fetchStatus: idle'),
    ).toBeInTheDocument()

    QueryCore.onlineManager.setOnline(false)
    onTestFinished(() => {
      QueryCore.onlineManager.setOnline(true)
    })

    void queryClient.refetchQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: data 0, fetchStatus: paused'),
    ).toBeInTheDocument()

    fireEvent.click(rendered.getByText('next'))
    await vi.advanceTimersByTimeAsync(0)
    expect(
      rendered.getByText('data: undefined, fetchStatus: paused'),
    ).toBeInTheDocument()
  })
})
