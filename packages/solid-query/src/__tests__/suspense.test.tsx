import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import {
  ErrorBoundary,
  Show,
  Suspense,
  createRenderEffect,
  createSignal,
  on,
} from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '..'
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '..'

describe("useQuery's in Suspense mode", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should render the correct amount of times in Suspense mode', async () => {
    const key = queryKey()
    const states: Array<UseQueryResult<number>> = []

    let count = 0
    let renders = 0

    function Page() {
      const [stateKey, setStateKey] = createSignal(key)

      const state = useQuery(() => ({
        queryKey: stateKey(),
        queryFn: async () => {
          count++
          await sleep(10)
          return count
        },
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createRenderEffect(
        on([() => ({ ...state }), () => key], () => {
          renders++
        }),
      )

      return (
        <div>
          <button aria-label="toggle" onClick={() => setStateKey(queryKey())} />
          data: {String(state.data)}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await vi.waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByLabelText('toggle'))

    await vi.waitFor(() => rendered.getByText('data: 2'))

    expect(renders).toBe(4)
    expect(states.length).toBe(4)
    expect(states[1]).toMatchObject({ data: 1, status: 'success' })
    expect(states[3]).toMatchObject({ data: 2, status: 'success' })
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()
    const states: Array<UseInfiniteQueryResult<InfiniteData<number>>> = []

    function Page() {
      const [multiplier, setMultiplier] = createSignal(1)
      const state = useInfiniteQuery(() => ({
        queryKey: [`${key}_${multiplier()}`],
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam * multiplier())
        },
        initialPageParam: 1,
        suspense: true,
        getNextPageParam: (lastPage) => lastPage + 1,
      }))

      createRenderEffect(() => {
        states.push({ ...state })
      })

      return (
        <div>
          <button onClick={() => setMultiplier(2)}>next</button>
          data: {state.data?.pages.join(',')}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await vi.waitFor(() => rendered.getByText('data: 1'))

    // eslint-disable-next-line cspell/spellchecker
    // TODO(lukemurray): in react this is 1 in solid this is 2 because suspense
    // occurs on read.
    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    await vi.waitFor(() => rendered.getByText('data: 2'))

    // eslint-disable-next-line cspell/spellchecker
    // TODO(lukemurray): in react this is 2 and in solid it is 4
    expect(states.length).toBe(4)
    expect(states[3]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => string>()
    queryFn.mockImplementation(() => {
      sleep(10)
      return 'data'
    })

    function Page() {
      useQuery(() => ({ queryKey: [key], queryFn, suspense: true }))

      return <>rendered</>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await vi.waitFor(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      useQuery(() => ({
        queryKey: key,
        queryFn: () => {
          sleep(10)
          return 'data'
        },
      }))

      return <>rendered</>
    }

    function App() {
      const [show, setShow] = createSignal(false)

      return (
        <>
          <Suspense fallback="loading">{show() && <Page />}</Suspense>
          <button
            aria-label="toggle"
            onClick={() => setShow((prev) => !prev)}
          />
        </>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find({ queryKey: key })).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await vi.waitFor(() => rendered.getByText('rendered'))

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(0)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        retryDelay: 10,
        suspense: true,
      }))

      // Suspense only triggers if used in JSX
      return (
        <Show when={state.data}>
          <div>rendered</div>
        </Show>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary
          fallback={(_err, resetSolid) => (
            <div>
              <div>error boundary</div>
              <button
                onClick={() => {
                  succeed = true
                  resetSolid()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          <Suspense fallback={'Loading...'}>
            <Page />
          </Suspense>
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )

    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )

    await vi.waitFor(() =>
      expect(rendered.getByText('retry')).toBeInTheDocument(),
    )

    fireEvent.click(rendered.getByText('retry'))

    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        retry: false,
        suspense: true,
      }))

      // Suspense only triggers if used in JSX
      return (
        <Show when={state.data}>
          <div>rendered</div>
        </Show>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
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
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('retry')).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByText('retry'))
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('retry')).toBeInTheDocument(),
    )
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )
  })

  it('should refetch when re-mounting', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          await sleep(100)
          count++
          return count
        },

        retry: false,
        suspense: true,
        staleTime: 0,
      }))
      return (
        <div>
          <span>data: {result.data}</span>
          <span>fetching: {result.isFetching ? 'true' : 'false'}</span>
        </div>
      )
    }

    function Page() {
      const [show, setShow] = createSignal(true)
      return (
        <div>
          <button
            onClick={() => {
              setShow(!show())
            }}
          >
            {show() ? 'hide' : 'show'}
          </button>
          <Suspense fallback="Loading...">{show() && <Component />}</Suspense>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('data: 1')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('fetching: false')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('hide')).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByText('hide'))
    await vi.waitFor(() =>
      expect(rendered.getByText('show')).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByText('show'))
    await vi.waitFor(() =>
      expect(rendered.getByText('fetching: true')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('data: 2')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('fetching: false')).toBeInTheDocument(),
    )
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: Array<string> }) {
      const result = useQuery(() => ({
        queryKey: props.queryKey,
        queryFn: async () => {
          await sleep(100)
          return props.queryKey
        },
        retry: false,
        suspense: true,
      }))
      return <div>data: {result.data}</div>
    }

    function Page() {
      const [key, setKey] = createSignal(key1)
      return (
        <div>
          <button
            onClick={() => {
              setKey(key2)
            }}
          >
            switch
          </button>
          <Suspense fallback="Loading...">
            <Component queryKey={key()} />
          </Suspense>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument(),
    )
    fireEvent.click(rendered.getByText('switch'))
    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText(`data: ${key2}`)).toBeInTheDocument(),
    )
  })

  it('should throw errors to the error boundary by default', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async (): Promise<unknown> => {
          await sleep(10)
          throw new Error('Suspense Error a1x')
        },
        retry: false,
        suspense: true,
      }))

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        state.data
      })

      return <div>rendered</div>
    }

    function App() {
      return (
        <ErrorBoundary
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )

    consoleMock.mockRestore()
  })

  it('should not throw errors to the error boundary when throwOnError: false', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async (): Promise<unknown> => {
          await sleep(10)
          throw new Error('Suspense Error a2x')
        },
        retry: false,
        throwOnError: false,
      }))

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        state.data
      })

      return <div>rendered</div>
    }

    function App() {
      return (
        <ErrorBoundary
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )
  })

  it('should throw errors to the error boundary when a throwOnError function returns true', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async (): Promise<unknown> => {
          await sleep(10)
          return Promise.reject(new Error('Remote Error'))
        },
        retry: false,
        throwOnError: (err) => err.message !== 'Local Error',
      }))

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        state.data
      })

      return <div>rendered</div>
    }

    function App() {
      return (
        <ErrorBoundary
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )

    consoleMock.mockRestore()
  })

  it('should not throw errors to the error boundary when a throwOnError function returns false', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: async (): Promise<unknown> => {
          await sleep(10)
          return Promise.reject(new Error('Local Error'))
        },

        retry: false,
        suspense: true,
        throwOnError: (err) => err.message !== 'Local Error',
      }))

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        state.data
      })

      return <div>rendered</div>
    }

    function App() {
      return (
        <ErrorBoundary
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = vi.fn<(...args: Array<unknown>) => Promise<string>>()
    queryFn.mockImplementation(async () => {
      await sleep(10)
      return '23'
    })

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const result = useQuery(() => ({
        queryKey: [key],
        queryFn,
        suspense: true,
        enabled: enabled(),
      }))

      return (
        <div>
          <button onClick={() => setEnabled(true)}>fire</button>
          <h1>{result.data}</h1>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(queryFn).toHaveBeenCalledTimes(0)
    await vi.advanceTimersByTimeAsync(5)
    fireEvent.click(rendered.getByRole('button', { name: /fire/i }))

    await vi.waitFor(() => {
      expect(rendered.getByRole('heading').textContent).toBe('23')
    })

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should error caught in error boundary without infinite loop', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    let succeed = true

    function Page() {
      const [nonce] = createSignal(0)
      const queryKeys = [`${key}-${succeed}`]
      const result = useQuery(() => ({
        queryKey: queryKeys,
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return nonce()
          }
        },
        retry: false,
        suspense: true,
      }))
      return (
        <div>
          <span>rendered</span> <span>{result.data}</span>
          <button
            aria-label="fail"
            onClick={async () => {
              await queryClient.resetQueries()
            }}
          >
            fail
          </button>
        </div>
      )
    }

    function App() {
      return (
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // render suspense fallback (Loading...)
    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    // resolve promise -> render Page (rendered)
    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )

    // change query key
    succeed = false
    // reset query -> and throw error
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )

    consoleMock.mockRestore()
  })

  it('should error caught in error boundary without infinite loop when query keys changed', async () => {
    let succeed = true

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const [key, setKey] = createSignal(0)

      const result = useQuery(() => ({
        queryKey: [`${key()}-${succeed}`],
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        retry: false,
        suspense: true,
      }))
      return (
        <div>
          <span>rendered</span> <span>{result.data}</span>
          <button aria-label="fail" onClick={() => setKey((k) => k + 1)}>
            fail
          </button>
        </div>
      )
    }

    function App() {
      return (
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // render suspense fallback (Loading...)
    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )
    // resolve promise -> render Page (rendered)
    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )

    // change promise result to error
    succeed = false
    // change query key
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )

    consoleMock.mockRestore()
  })

  it('should error caught in error boundary without infinite loop when enabled changed', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const queryKeys = '1'
      const [enabled, setEnabled] = createSignal(false)

      const result = useQuery<string>(() => ({
        queryKey: [queryKeys],
        queryFn: async () => {
          await sleep(10)
          throw new Error('Suspense Error Bingo')
        },

        retry: false,
        suspense: true,
        enabled: enabled(),
      }))
      return (
        <div>
          <span>rendered</span> <span>{result.data}</span>
          <button
            aria-label="fail"
            onClick={() => {
              setEnabled(true)
            }}
          >
            fail
          </button>
        </div>
      )
    }

    function App() {
      return (
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Suspense fallback="Loading...">
            <Page />
          </Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // render empty data with 'rendered' when enabled is false
    await vi.waitFor(() =>
      expect(rendered.getByText('rendered')).toBeInTheDocument(),
    )

    // change enabled to true
    fireEvent.click(rendered.getByLabelText('fail'))

    // render pending fallback
    await vi.waitFor(() =>
      expect(rendered.getByText('Loading...')).toBeInTheDocument(),
    )

    // render error boundary fallback (error boundary)
    await vi.waitFor(() =>
      expect(rendered.getByText('error boundary')).toBeInTheDocument(),
    )

    consoleMock.mockRestore()
  })

  it('should render the correct amount of times in Suspense mode when gcTime is set to 0', async () => {
    const key = queryKey()
    let state: UseQueryResult<number> | null = null

    let count = 0
    let renders = 0

    function Page() {
      state = useQuery(() => ({
        queryKey: key,
        queryFn: async () => {
          count++
          await sleep(10)
          return count
        },
        gcTime: 0,
      }))

      createRenderEffect(
        on([() => ({ ...state })], () => {
          renders++
        }),
      )

      return (
        <div>
          <span>rendered</span>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await vi.waitFor(() =>
      expect(state).toMatchObject({
        data: 1,
        status: 'success',
      }),
    )

    expect(renders).toBe(2)
    expect(rendered.queryByText('rendered')).not.toBeNull()
  })
})
