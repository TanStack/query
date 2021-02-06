import { fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

import { mockConsoleError, queryKey, renderWithClient, sleep } from './utils'
import {
  useQueries,
  QueryClient,
  UseQueryResult,
  QueryCache,
  useQueryErrorResetBoundary,
} from '../..'

describe('useQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should return the correct states', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: UseQueryResult[][] = []

    function Page() {
      const result = useQueries([
        { queryKey: key1, queryFn: () => 1 },
        { queryKey: key2, queryFn: () => 2 },
      ])
      results.push(result)
      return null
    }

    renderWithClient(queryClient, <Page />)

    await sleep(10)

    expect(results.length).toBe(3)
    expect(results[0]).toMatchObject([{ data: undefined }, { data: undefined }])
    expect(results[1]).toMatchObject([{ data: 1 }, { data: undefined }])
    expect(results[2]).toMatchObject([{ data: 1 }, { data: 2 }])
  })

  it('should render the correct amount of times in suspense mode', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: UseQueryResult[][] = []

    let renders = 0
    let count1 = 10
    let count2 = 20

    function Page() {
      renders++

      const [stateKey1, setStateKey1] = React.useState(key1)

      const result = useQueries([
        {
          queryKey: stateKey1,
          queryFn: async () => {
            count1++
            await sleep(10)
            return count1
          },
        },
        {
          queryKey: key2,
          queryFn: async () => {
            count2++
            await sleep(10)
            return count2
          },
          suspense: true,
        },
      ])

      results.push(result)

      return (
        <button aria-label="toggle" onClick={() => setStateKey1(queryKey())} />
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>
    )

    await sleep(50)

    await waitFor(() => rendered.getByLabelText('toggle'))
    fireEvent.click(rendered.getByLabelText('toggle'))

    await sleep(50)

    expect(renders).toBe(5)
    expect(results.length).toBe(3)

    // First load
    expect(results[0]).toMatchObject([
      { data: 11, status: 'success' },
      { data: 21, status: 'success' },
    ])

    // Set state
    expect(results[1]).toMatchObject([
      { data: 11, status: 'success' },
      { data: 21, status: 'success' },
    ])

    // Second load
    expect(results[2]).toMatchObject([
      { data: 12, status: 'success' },
      { data: 21, status: 'success' },
    ])
  })

  it('should retry fetch if the reset error boundary has been reset with global hook', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const results = useQueries<string>([
        {
          queryKey: key1,
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Suspense Error Bingo')
            } else {
              return 'data1'
            }
          },
          retry: false,
          suspense: true,
        },
        {
          queryKey: key2,
          queryFn: () => 'data2',
          staleTime: Infinity,
        },
      ])

      return (
        <div>
          <div>data1: {results[0].data}</div>
          <div>data2: {results[1].data}</div>
        </div>
      )
    }

    function App() {
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ resetErrorBoundary }) => (
            <div>
              <div>error boundary</div>
              <button
                onClick={() => {
                  resetErrorBoundary()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('data1: data1'))
    await waitFor(() => rendered.getByText('data2: data2'))

    consoleMock.mockRestore()
  })
})
