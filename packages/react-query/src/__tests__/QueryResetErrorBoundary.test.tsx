import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import * as React from 'react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryErrorResetBoundary,
  useQueries,
  useQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'

describe('QueryErrorResetBoundary', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  describe('useQuery', () => {
    it('should retry fetch if the reset error boundary has been reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key = queryKey()

      let succeed = false

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should not throw error if query is disabled', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key = queryKey()

      let succeed = false

      function Page() {
        const { data, status } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          enabled: !succeed,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('status: error')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should not throw error if query is disabled, and refetch if query becomes enabled again', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      let succeed = false

      function Page() {
        const [enabled, setEnabled] = React.useState(false)
        const { data } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          enabled,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should throw error if query is disabled and manually refetch', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      function Page() {
        const { data, refetch, status, fetchStatus } = useQuery<string>({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Error'))),
          retry: false,
          enabled: false,
          throwOnError: true,
        })

        return (
          <div>
            <button onClick={() => refetch()}>refetch</button>
            <div>
              status: {status}, fetchStatus: {fetchStatus}
            </div>
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
        </QueryErrorResetBoundary>,
      )

      expect(
        rendered.getByText('status: pending, fetchStatus: idle'),
      ).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(11)
      expect(
        rendered.getByText('status: pending, fetchStatus: idle'),
      ).toBeInTheDocument()

      fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should not retry fetch if the reset error boundary has not been reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      let succeed = false

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should retry fetch if the reset error boundary has been reset and the query contains data from a previous fetch', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      let succeed = false

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          throwOnError: true,
          initialData: 'initial',
        })

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
        </QueryErrorResetBoundary>,
      )

      expect(rendered.getByText('initial')).toBeInTheDocument()
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should not retry fetch if the reset error boundary has not been reset after a previous reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      let succeed = false
      let shouldReset = false

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = false
      shouldReset = true

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true
      shouldReset = false

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()

      succeed = true
      shouldReset = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should throw again on error after the reset error boundary has been reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()
      let fetchCount = 0

      function Page() {
        const { data } = useQuery<string>({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              fetchCount++
              throw new Error('Error')
            }),
          retry: false,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()

      expect(fetchCount).toBe(3)

      consoleMock.mockRestore()
    })

    it('should never render the component while the query is in error state', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()
      let fetchCount = 0
      let renders = 0

      function Page() {
        const { data } = useSuspenseQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              fetchCount++
              if (fetchCount > 2) return 'data'
              throw new Error('Error')
            }),
          retry: false,
        })

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
        </QueryErrorResetBoundary>,
      )

      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      fireEvent.click(rendered.getByText('retry'))
      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      fireEvent.click(rendered.getByText('retry'))
      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('data')).toBeInTheDocument()

      expect(fetchCount).toBe(3)
      expect(renders).toBe(1)

      consoleMock.mockRestore()
    })

    it('should render children', () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

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
        </QueryErrorResetBoundary>,
      )

      expect(rendered.queryByText('page')).not.toBeNull()

      consoleMock.mockRestore()
    })

    it('should show error boundary when using tracked queries even though we do not track the error field', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      let succeed = false

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: () =>
            sleep(10).then(() => {
              if (!succeed) throw new Error('Error')
              return 'data'
            }),
          retry: false,
          throwOnError: true,
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('should refetch after error when staleTime is Infinity and previous data exists (#9728)', async () => {
      const key = queryKey()
      const queryFn = vi.fn()
      let count = 0

      queryFn.mockImplementation(async () => {
        await sleep(10)
        count++
        if (count === 2) {
          throw new Error('Error ' + count)
        }
        return 'Success ' + count
      })

      function Page() {
        const [_, forceUpdate] = React.useState(0)

        React.useEffect(() => {
          forceUpdate(1)
        }, [])

        const { data, refetch } = useQuery({
          queryKey: key,
          queryFn,
          retry: false,
          staleTime: Infinity,
          throwOnError: true,
        })

        return (
          <div>
            <div>Data: {data}</div>
            <button onClick={() => refetch()}>Refetch</button>
          </div>
        )
      }

      const rendered = renderWithClient(
        queryClient,
        <React.StrictMode>
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
                <Page />
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </React.StrictMode>,
      )

      // 1. First mount -> fetching -> Success
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('Data: Success 1')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(1)

      // 2. Click Refetch -> Triggers fetch -> Fails (Error 2) -> ErrorBoundary
      fireEvent.click(rendered.getByText('Refetch'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('Status: error')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(2)

      // 3. Click Retry -> Remounts
      // Because staleTime is Infinity and we have Data from (1),
      // AND we are in Error state.
      fireEvent.click(rendered.getByText('Retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('Data: Success 3')).toBeInTheDocument()
      expect(queryFn).toHaveBeenCalledTimes(3)
    })
  })

  describe('useQueries', () => {
    it('should retry fetch if the reset error boundary has been reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key = queryKey()

      let succeed = false

      function Page() {
        const [{ data }] = useQueries({
          queries: [
            {
              queryKey: key,
              queryFn: () =>
                sleep(10).then(() => {
                  if (!succeed) throw new Error('Error')
                  return 'data'
                }),
              retry: false,
              throwOnError: true,
              retryOnMount: true,
            },
          ],
        })

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
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })

    it('with suspense should retry fetch if the reset error boundary has been reset', async () => {
      const key = queryKey()
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      let succeed = false

      function Page() {
        const [{ data }] = useSuspenseQueries({
          queries: [
            {
              queryKey: key,
              queryFn: () =>
                sleep(10).then(() => {
                  if (!succeed) throw new Error('Error')
                  return 'data'
                }),
              retry: false,
              retryOnMount: true,
            },
          ],
        })

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
              <React.Suspense fallback="loading">
                <Page />
              </React.Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>,
      )

      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('error boundary')).toBeInTheDocument()
      expect(rendered.getByText('retry')).toBeInTheDocument()

      succeed = true

      fireEvent.click(rendered.getByText('retry'))
      expect(rendered.getByText('loading')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(10))
      expect(rendered.getByText('data')).toBeInTheDocument()

      consoleMock.mockRestore()
    })
  })
})
