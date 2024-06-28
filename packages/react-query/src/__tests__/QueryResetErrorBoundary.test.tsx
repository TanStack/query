import { describe, expect, it, vi } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import { ErrorBoundary } from 'react-error-boundary'
import * as React from 'react'

import {
  QueryCache,
  QueryErrorResetBoundary,
  useQueries,
  useQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

describe('QueryErrorResetBoundary', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

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
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('data'))
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
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('status: error'))
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
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('data'))
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
          queryFn: async () => {
            throw new Error('Error')
          },
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

      await waitFor(() =>
        rendered.getByText('status: pending, fetchStatus: idle'),
      )
      fireEvent.click(rendered.getByRole('button', { name: /refetch/i }))
      await waitFor(() => rendered.getByText('error boundary'))
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
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('error boundary'))
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
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('data'))
      consoleMock.mockRestore()
    })

    it('should not retry fetch if the reset error boundary has not been reset after a previous reset', async () => {
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()

      let succeed = false
      let shouldReset = true

      function Page() {
        const { data } = useQuery({
          queryKey: key,
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()
      let fetchCount = 0

      function Page() {
        const { data } = useQuery<string>({
          queryKey: key,
          queryFn: async () => {
            fetchCount++
            await sleep(10)
            throw new Error('Error')
          },
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
      const consoleMock = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined)

      const key = queryKey()
      let fetchCount = 0
      let renders = 0

      function Page() {
        const { data } = useSuspenseQuery({
          queryKey: key,
          queryFn: async () => {
            fetchCount++
            await sleep(10)
            if (fetchCount > 2) {
              return 'data'
            } else {
              throw new Error('Error')
            }
          },
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
          queryFn: async () => {
            await sleep(10)
            if (!succeed) {
              throw new Error('Error')
            } else {
              return 'data'
            }
          },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('data'))
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
              queryFn: async () => {
                await sleep(10)
                if (!succeed) {
                  throw new Error('Error')
                } else {
                  return 'data'
                }
              },
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

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('data'))
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
              queryFn: async () => {
                await sleep(10)
                if (!succeed) {
                  throw new Error('Error')
                } else {
                  return 'data'
                }
              },
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
              <React.Suspense fallback="Loader">
                <Page />
              </React.Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>,
      )

      await waitFor(() => rendered.getByText('error boundary'))
      await waitFor(() => rendered.getByText('retry'))
      succeed = true
      fireEvent.click(rendered.getByText('retry'))
      await waitFor(() => rendered.getByText('data'))
      consoleMock.mockRestore()
    })
  })
})
