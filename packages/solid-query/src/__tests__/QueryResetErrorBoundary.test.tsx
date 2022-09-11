import { waitFor, fireEvent, render, screen } from 'solid-testing-library'

import { sleep, createQueryClient } from '../../../../tests/utils'
import { queryKey } from './utils'
import {
  createQuery,
  QueryCache,
  QueryClientProvider,
  QueryErrorResetBoundary,
} from '..'
import { createEffect, createSignal, ErrorBoundary, Suspense } from 'solid-js'

describe('QueryErrorResetBoundary', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
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
        },
      )
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
        ,
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })

  it('should not throw error if query is disabled', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
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
        },
      )
      return (
        <div>
          <div>status: {state.status}</div>
          <div>{state.data}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('status: error'))
  })

  it('should not throw error if query is disabled, and refetch if query becomes enabled again', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const state = createQuery(
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
          enabled: enabled(),
          useErrorBoundary: true,
        },
      )

      createEffect(() => {
        setEnabled(true)
      })

      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })

  it('should throw error if query is disabled and manually refetched', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery<string>(
        key,
        async () => {
          throw new Error('Error')
        },
        {
          retry: false,
          enabled: false,
          useErrorBoundary: true,
        },
      )

      return (
        <div>
          <button onClick={() => state.refetch()}>refetch</button>
          <div>
            status: {state.status}, fetchStatus: {state.fetchStatus}
          </div>
          <div>{state.data}</div>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('status: loading, fetchStatus: idle'))
    fireEvent.click(screen.getByRole('button', { name: /refetch/i }))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should not retry fetch if the reset error boundary has not been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
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
        },
      )
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {() => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should retry fetch if the reset error boundary has been reset and the query contains data from a previous fetch', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
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
        },
      )
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })

  it('should not retry fetch if the reset error boundary has not been reset after a previous reset', async () => {
    const key = queryKey()

    let succeed = false
    let shouldReset = true

    function Page() {
      const state = createQuery(
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
        },
      )
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      if (shouldReset) {
                        reset()
                      }
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    shouldReset = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    succeed = true
    shouldReset = false
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should throw again on error after the reset error boundary has been reset', async () => {
    const key = queryKey()
    let fetchCount = 0

    function Page() {
      const state = createQuery<string>(
        key,
        async () => {
          fetchCount++
          await sleep(10)
          throw new Error('Error')
        },
        {
          retry: false,
          useErrorBoundary: true,
        },
      )
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    expect(fetchCount).toBe(3)
  })

  it('should never render the component while the query is in error state', async () => {
    const key = queryKey()
    let fetchCount = 0
    let renders = 0

    function Page() {
      const state = createQuery(
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
        },
      )
      renders++
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
                    }}
                  >
                    retry
                  </button>
                </div>
              )}
            >
              <Suspense fallback={<div>loading</div>}>
                <Page />
              </Suspense>
            </ErrorBoundary>
          )}
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
    expect(fetchCount).toBe(3)
    expect(renders).toBe(1)
  })

  it('should render children', async () => {
    function Page() {
      return (
        <div>
          <span>page</span>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          <Page />
        </QueryErrorResetBoundary>
      </QueryClientProvider>
    ))

    expect(screen.queryByText('page')).not.toBeNull()
  })

  it('should show error boundary when using tracked queries even though we do not track the error field', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
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
        },
      )
      return <div>{state.data}</div>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <QueryErrorResetBoundary>
          {({ reset: resetQuery }) => (
            <ErrorBoundary
              fallback={(_err, resetSolid) => (
                <div>
                  <div>error boundary</div>
                  <button
                    onClick={() => {
                      resetQuery()
                      resetSolid()
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
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('data'))
  })
})
