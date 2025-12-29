// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { queryKey } from '@tanstack/query-test-utils'
import {
  QueryClient,
  QueryClientProvider,
  QueryErrorResetBoundary,
  useQuery,
} from '..'

describe('issue 9728', () => {
  it('should refetch after error when staleTime is Infinity and previous data exists', async () => {
    const key = queryKey()
    const queryFn = vi.fn()
    let count = 0

    queryFn.mockImplementation(async () => {
      count++
      if (count === 2) {
        throw new Error('Error ' + count)
      }
      return 'Success ' + count
    })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
        },
      },
    })

    function Page() {
      const [_, forceUpdate] = React.useState(0)

      React.useEffect(() => {
        forceUpdate(1)
      }, [])

      const { data, refetch } = useQuery({
        queryKey: key,
        queryFn,
        throwOnError: true,
      })

      return (
        <div>
          <div>Data: {data}</div>
          <button onClick={() => refetch()}>Refetch</button>
        </div>
      )
    }

    function App() {
      return (
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ resetErrorBoundary }) => (
                <div>
                  <div>Status: error</div>
                  <button onClick={resetErrorBoundary}>Retry</button>
                </div>
              )}
            >
              <React.Suspense fallback={<div>Loading...</div>}>
                <Page />
              </React.Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      )
    }

    const { getByText, findByText } = render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </React.StrictMode>,
    )

    // 1. First mount -> Success
    await findByText('Data: Success 1')
    expect(queryFn).toHaveBeenCalledTimes(1)

    // 2. Click Refetch -> Triggers fetch -> Fails (Error 2) -> ErrorBoundary
    fireEvent.click(getByText('Refetch'))

    // Wait for error UI
    await findByText('Status: error')
    expect(queryFn).toHaveBeenCalledTimes(2)

    // 3. Click Retry -> Remounts
    // Because staleTime is Infinity and we have Data from (1),
    // AND we are in Error state.
    fireEvent.click(getByText('Retry'))

    // Should call queryFn again (3rd time) and succeed
    await findByText('Data: Success 3')
    expect(queryFn).toHaveBeenCalledTimes(3)
  })
})
