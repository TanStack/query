import { waitFor, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import React from 'react'

import { sleep, queryKey, mockConsoleError, renderWithClient } from './utils'
import {
  useQuery,
  QueryClient,
  QueryCache,
  QueryErrorResetBoundary,
} from '../..'

describe('QueryErrorResetBoundary', () => {
  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        }
      )
      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('data'))

    consoleMock.mockRestore()
  })

  it('should not throw error if query is disabled', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const { data, status } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          enabled: !succeed,
          useErrorBoundary: true,
        }
      )
      return (
        <div>
          <div>status: {status}</div>
          <div>{data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('status: error'))

    consoleMock.mockRestore()
  })

  it('should not throw error if query is disabled, and refetch if query becomes enabled again', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          enabled,
          useErrorBoundary: true,
        }
      )

      React.useEffect(() => {
        setEnabled(true)
      }, [])

      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('data'))

    consoleMock.mockRestore()
  })

  it('should throw error if query is disabled and manually refetched', async () => {
    const key = queryKey()

    const consoleMock = mockConsoleError()

    function Page() {
      const { data, refetch, status } = useQuery(
        key,
        async () => {
          throw new Error('Error')
        },
        {
          retry: false,
          enabled: false,
          useErrorBoundary: true,
        }
      )

      return (
        <div>
          <button onClick={() => refetch()}>refetch</button>
          <div>status: {status}</div>
          <div>{data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('status: idle'))
    rendered.getByRole('button', { name: /refetch/i }).click()
    await waitFor(() => rendered.getByText('error boundary'))

    consoleMock.mockRestore()
  })

  it('should not retry fetch if the reset error boundary has not been reset', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        }
      )
      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {() => (
          <ErrorBoundary
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))

    consoleMock.mockRestore()
  })

  it('should retry fetch if the reset error boundary has been reset and the query contains data from a previous fetch', async () => {
    const key = queryKey()

    let succeed = false
    const consoleMock = mockConsoleError()

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
          initialData: 'initial',
        }
      )
      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('data'))

    consoleMock.mockRestore()
  })

  it('should not retry fetch if the reset error boundary has not been reset after a previous reset', async () => {
    const key = queryKey()

    let succeed = false
    let shouldReset = true
    const consoleMock = mockConsoleError()

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Error')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          useErrorBoundary: true,
        }
      )
      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
          <ErrorBoundary
            onReset={() => {
              if (shouldReset) {
                reset()
              }
            }}
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    shouldReset = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    succeed = true
    shouldReset = false
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))

    consoleMock.mockRestore()
  })

  it('should throw again on error after the reset error boundary has been reset', async () => {
    const key = queryKey()
    const consoleMock = mockConsoleError()
    let fetchCount = 0

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          throw new Error('Error')
        },
        {
          retry: false,
          useErrorBoundary: true,
        }
      )
      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    expect(fetchCount).toBe(3)

    consoleMock.mockRestore()
  })

  it('should never render the component while the query is in error state', async () => {
    const key = queryKey()
    const consoleMock = mockConsoleError()
    let fetchCount = 0
    let renders = 0

    function Page() {
      const { data } = useQuery(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          if (fetchCount > 2) {
            return 'data'
          } else {
            throw new Error('Error')
          }
        },
        {
          retry: false,
          suspense: true,
        }
      )
      renders++
      return <div>{data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        {({ reset }) => (
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
            <React.Suspense fallback={<div>loading</div>}>
              <Page />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>
    )

    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('data'))
    expect(fetchCount).toBe(3)
    expect(renders).toBe(1)

    consoleMock.mockRestore()
  })

  it('should render children', async () => {
    function Page() {
      return (
        <div>
          <span>page</span>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <QueryErrorResetBoundary>
        <Page />
      </QueryErrorResetBoundary>
    )

    expect(rendered.queryByText('page')).not.toBeNull()
  })
})
