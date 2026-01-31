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
  useTrackQueryHash,
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

  describe('Scoped Registry', () => {
    it('should isolate resets between different boundaries', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key1 = queryKey()
      const key2 = queryKey()
      let count1 = 0
      let count2 = 0

      function Comp1() {
        useQuery({
          queryKey: key1,
          queryFn: async () => {
            await sleep(10)
            count1++
            throw new Error('fail1')
          },
          retry: false,
          throwOnError: true,
        })
        return null
      }

      function Comp2() {
        useQuery({
          queryKey: key2,
          queryFn: async () => {
            await sleep(10)
            count2++
            throw new Error('fail2')
          },
          retry: false,
          throwOnError: true,
        })
        return null
      }

      const rendered = renderWithClient(
        queryClient,
        <>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <div>
                    <button onClick={resetErrorBoundary}>reset1</button>
                  </div>
                )}
              >
                <React.Suspense fallback="loading1">
                  <Comp1 />
                </React.Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
          <QueryErrorResetBoundary>
            {({ reset }) => (
              <ErrorBoundary
                onReset={reset}
                fallbackRender={({ resetErrorBoundary }) => (
                  <div>
                    <button onClick={resetErrorBoundary}>reset2</button>
                  </div>
                )}
              >
                <React.Suspense fallback="loading2">
                  <Comp2 />
                </React.Suspense>
              </ErrorBoundary>
            )}
          </QueryErrorResetBoundary>
        </>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('reset1')).toBeInTheDocument()
      expect(rendered.getByText('reset2')).toBeInTheDocument()
      expect(count1).toBe(1)
      expect(count2).toBe(1)

      fireEvent.click(rendered.getByText('reset1'))

      await vi.advanceTimersByTimeAsync(11)
      expect(count1).toBe(2)
      expect(count2).toBe(1)

      consoleMock.mockRestore()
    })

    it('should clear registry after reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key = queryKey()
      let count = 0

      function Comp() {
        useQuery({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            throw new Error('fail')
          },
          retry: false,
          throwOnError: true,
        })
        return null
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ resetErrorBoundary }) => (
                <div>
                  <button onClick={resetErrorBoundary}>reset</button>
                </div>
              )}
            >
              <React.Suspense fallback="loading">
                <Comp />
              </React.Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(rendered.getByText('reset')).toBeInTheDocument()
      expect(count).toBe(1)

      fireEvent.click(rendered.getByText('reset'))
      await vi.advanceTimersByTimeAsync(11)
      expect(count).toBe(2)

      consoleMock.mockRestore()
    })

    it('should handle StrictMode double registration gracefully', async () => {
      const key = queryKey()
      let count = 0

      function Comp() {
        useQuery({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            return 'ok'
          },
        })
        return null
      }

      renderWithClient(
        queryClient,
        <React.StrictMode>
          <QueryErrorResetBoundary>
            <Comp />
          </QueryErrorResetBoundary>
        </React.StrictMode>,
      )

      await vi.advanceTimersByTimeAsync(11)
      expect(count).toBeGreaterThanOrEqual(1)
    })

    it('should support tracking queries outside the boundary via useTrackQueryHash', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)
      const key = queryKey()
      let count = 0

      function Child() {
        const { data } = useSuspenseQuery({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            count++
            if (count === 1) {
              throw new Error('fail')
            }
            return 'ok'
          },
          retry: false,
        })
        return <div>{data}</div>
      }

      function TrackedChild() {
        const hash = queryClient
          .getQueryCache()
          .build(queryClient, { queryKey: key }).queryHash
        useTrackQueryHash({ queryHash: hash })
        return null
      }
      }

      const rendered = renderWithClient(
        queryClient,
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              onReset={reset}
              fallbackRender={({ resetErrorBoundary }) => (
                <button onClick={resetErrorBoundary}>retry</button>
              )}
            >
              <React.Suspense fallback="loading">
                <TrackedChild />
                <Child />
              </React.Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>,
      )

      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(rendered.getByText('retry')).toBeInTheDocument()
      expect(count).toBe(1)

      fireEvent.click(rendered.getByText('retry'))
      await act(() => vi.advanceTimersByTimeAsync(11))
      expect(count).toBe(2)
      expect(rendered.getByText('ok')).toBeInTheDocument()

      consoleMock.mockRestore()
    })
  })
})
