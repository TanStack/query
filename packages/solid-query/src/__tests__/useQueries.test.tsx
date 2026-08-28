import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render } from '@solidjs/testing-library'
import { Loading } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { IsRestoringContext, QueryCache, QueryClient, useQueries } from '..'
import { renderWithClient } from './utils'

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

  it('should render each result as it settles', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const results = useQueries(() => ({
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

      return (
        <div>
          <div>
            status1: {results[0].status}, status2: {results[1].status}
          </div>
          <Loading fallback={<span>loading1</span>}>
            <span>data1: {String(results[0].data)}</span>
          </Loading>
          <Loading fallback={<span>loading2</span>}>
            <span>data2: {String(results[1].data)}</span>
          </Loading>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <Page />)

    // Metadata reads never suspend; data reads park their own boundary.
    expect(
      rendered.getByText('status1: pending, status2: pending'),
    ).toBeInTheDocument()
    expect(rendered.getByText('loading1')).toBeInTheDocument()
    expect(rendered.getByText('loading2')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data1: 1')).toBeInTheDocument()
    expect(rendered.getByText('loading2')).toBeInTheDocument()
    expect(
      rendered.getByText('status1: success, status2: pending'),
    ).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(90)
    expect(rendered.getByText('data1: 1')).toBeInTheDocument()
    expect(rendered.getByText('data2: 2')).toBeInTheDocument()
    expect(
      rendered.getByText('status1: success, status2: success'),
    ).toBeInTheDocument()
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

    const rendered = render(() => (
      <Loading fallback={<span>loading</span>}>
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
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
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <IsRestoringContext value={() => true}>
        <Page />
      </IsRestoringContext>
    ))

    await vi.advanceTimersByTimeAsync(0)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByTestId('status1')).toHaveTextContent('pending')
    expect(rendered.getByTestId('status2')).toHaveTextContent('pending')
    expect(rendered.getByTestId('fetchStatus1')).toHaveTextContent('idle')
    expect(rendered.getByTestId('fetchStatus2')).toHaveTextContent('idle')
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })
})
