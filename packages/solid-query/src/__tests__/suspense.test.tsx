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
import { onlineManager } from '@tanstack/query-core'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQueries,
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
        queryFn: () => sleep(10).then(() => ++count),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

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
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => pageParam * multiplier()),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    // eslint-disable-next-line cspell/spellchecker
    // TODO(lukemurray): in react this is 1 in solid this is 2 because suspense
    // occurs on read.
    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
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

    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    function Page() {
      useQuery(() => ({
        queryKey: [key],
        queryFn,
        suspense: true,
      }))

      return <>rendered</>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('rendered')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
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

    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(0)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
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
          <Suspense fallback="loading">
            <Page />
          </Suspense>
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
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
          <Suspense fallback="loading">
            <Page />
          </Suspense>
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    succeed = true

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()
  })

  it('should refetch when re-mounting', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = useQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(100).then(() => ++count),
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
          <Suspense fallback="loading">{show() && <Component />}</Suspense>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()
    expect(rendered.getByText('hide')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('hide'))
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('show')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('show'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(0)
    expect(rendered.getByText('fetching: true')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: Array<string> }) {
      const result = useQuery(() => ({
        queryKey: props.queryKey,
        queryFn: () => sleep(100).then(() => props.queryKey),
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
          <Suspense fallback="loading">
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()

    fireEvent.click(rendered.getByText('switch'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText(`data: ${key2}`)).toBeInTheDocument()
  })

  it('should throw errors to the error boundary by default', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Suspense Error a1x'))),
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
          <Suspense fallback="loading">
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should not throw errors to the error boundary when throwOnError: false', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Suspense Error a2x'))),
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
          <Suspense fallback="loading">
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()
  })

  it('should throw errors to the error boundary when a throwOnError function returns true', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Remote Error'))),
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
          <Suspense fallback="loading">
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should not throw errors to the error boundary when a throwOnError function returns false', async () => {
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Local Error'))),
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
          <Suspense fallback="loading">
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = vi.fn(() => sleep(10).then(() => '23'))

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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(10)
    fireEvent.click(rendered.getByRole('button', { name: /fire/i }))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByRole('heading').textContent).toBe('23')
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
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return nonce()
          }),
        retry: false,
        suspense: true,
      }))

      return (
        <div>
          <span>rendered</span> <span>{result.data}</span>
          <button aria-label="fail" onClick={() => queryClient.resetQueries()}>
            fail
          </button>
        </div>
      )
    }

    function App() {
      return (
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Suspense fallback="loading">
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
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change query key
    succeed = false
    // reset query -> and throw error

    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

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
        queryFn: async () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
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
          <Suspense fallback="loading">
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
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change promise result to error
    succeed = false
    // change query key

    fireEvent.click(rendered.getByLabelText('fail'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // render error boundary fallback (error boundary)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

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
        queryFn: () =>
          sleep(10).then(() =>
            Promise.reject(new Error('Suspense Error Bingo')),
          ),
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
          <Suspense fallback="loading">
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    // render empty data with 'rendered' when enabled is false
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change enabled to true
    fireEvent.click(rendered.getByLabelText('fail'))
    // render pending fallback
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // render error boundary fallback (error boundary)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

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
        queryFn: () => sleep(10).then(() => ++count),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(10)

    expect(state).toMatchObject({
      data: 1,
      status: 'success',
    })
    expect(renders).toBe(2)
    expect(rendered.queryByText('rendered')).toBeInTheDocument()
  })
})

describe("useQueries's in Suspense mode", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should suspend when data is accessed in JSX', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(20).then(() => 'data2'),
          },
        ],
      }))

      return (
        <div>
          data1: {String(queries[0].data)} data2: {String(queries[1].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data1: data1 data2: data2')).toBeInTheDocument()
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: [key],
            queryFn,
          },
        ],
      }))

      return <div>data: {String(queries[0].data)}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'data'),
          },
        ],
      }))

      return <div>data: {String(queries[0].data)}</div>
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

    expect(rendered.queryByText('data:')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.queryByText('data:')).not.toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(0)
  })

  it('should suspend when switching query keys', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const [key, setKey] = createSignal(key1)

      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key(),
            queryFn: () => sleep(10).then(() => String(key())),
          },
        ],
      }))

      return (
        <div>
          <button onClick={() => setKey(key2)}>switch</button>
          data: {String(queries[0].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()

    fireEvent.click(rendered.getByText('switch'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText(`data: ${key2}`)).toBeInTheDocument()
  })

  it('should not suspend when queries are disabled', async () => {
    const key = queryKey()

    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    function Page() {
      const [enabled, setEnabled] = createSignal(false)

      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: [key],
            queryFn,
            enabled: enabled(),
          },
        ],
      }))

      return (
        <div>
          <button onClick={() => setEnabled(true)}>enable</button>
          data: {String(queries[0].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(10)
    fireEvent.click(rendered.getByRole('button', { name: /enable/i }))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not suspend on mount if query has been already fetched', () => {
    const key = queryKey()

    queryClient.setQueryData(key, 'cached-data')

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(10).then(() => 'fresh-data'),
          },
        ],
      }))

      return <div>data: {String(queries[0].data)}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: cached-data')).toBeInTheDocument()
  })

  it('should suspend all queries in parallel', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<string> = []

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              sleep(10).then(() => {
                results.push('1')
                return '1'
              }),
          },
          {
            queryKey: key2,
            queryFn: () =>
              sleep(20).then(() => {
                results.push('2')
                return '2'
              }),
          },
        ],
      }))

      return (
        <div>
          data: {String(queries[0].data)},{String(queries[1].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

    expect(results).toEqual(['1', '2'])
  })

  it('should only call combine after resolving', async () => {
    const key = queryKey()
    const combineSpy = vi.fn()

    function Page() {
      const queries = useQueries(() => ({
        queries: [1, 2, 3].map((value) => ({
          queryKey: [...key, { value }],
          queryFn: () => sleep(value * 10).then(() => ({ value: value * 10 })),
        })),
        combine: (result) => {
          combineSpy(result.map((r) => r.data))
          return result
        },
      }))

      return (
        <div>data: {queries.map((q) => JSON.stringify(q.data)).join(',')}</div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(30)

    const resolvedCalls = combineSpy.mock.calls.filter((call) =>
      call[0].every((d: unknown) => d !== undefined),
    )
    expect(resolvedCalls.length).toBeGreaterThanOrEqual(1)
    expect(resolvedCalls[0]![0]).toEqual([
      { value: 10 },
      { value: 20 },
      { value: 30 },
    ])
  })

  it('should handle duplicate query keys without infinite loops', async () => {
    const key = queryKey()
    let renderCount = 0

    function getUserData() {
      return {
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ name: 'John Doe', age: 50 })),
      }
    }

    function getName() {
      return {
        ...getUserData(),
        select: (data: { name: string; age: number }) => data.name,
      }
    }

    function getAge() {
      return {
        ...getUserData(),
        select: (data: { name: string; age: number }) => data.age,
      }
    }

    function Page() {
      renderCount++
      const queries = useQueries(() => ({
        queries: [getName(), getAge()],
      }))

      return (
        <div>
          name: {String(queries[0].data)}, age: {String(queries[1].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('name: John Doe, age: 50')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(100)

    expect(renderCount).toBeLessThan(10)
  })

  it('should not break suspense when queries change without resolving', async () => {
    const key = queryKey()

    function Page(props: { ids: Array<number> }) {
      const queries = useQueries(() => ({
        queries: props.ids.map((id) => ({
          queryKey: [...key, id],
          queryFn: () => sleep(10).then(() => id),
        })),
      }))

      return <div>data: {queries.map((q) => String(q.data)).join(',')}</div>
    }

    function App() {
      const [ids, setIds] = createSignal([1, 2])

      return (
        <>
          <button onClick={() => setIds([3, 4])}>change</button>
          <Suspense fallback="loading">
            <Page ids={ids()} />
          </Suspense>
        </>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()

    // Change queries before they resolve
    fireEvent.click(rendered.getByText('change'))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 3,4')).toBeInTheDocument()
  })

  it('should suspend only once per queries change', async () => {
    const key = queryKey()
    let suspenseCount = 0

    function Fallback() {
      suspenseCount++
      return <div>loading</div>
    }

    function Page() {
      const [ids, setIds] = createSignal([1, 2])

      const queries = useQueries(() => ({
        queries: ids().map((id) => ({
          queryKey: [...key, id],
          queryFn: () => sleep(10).then(() => id),
        })),
      }))

      return (
        <div>
          <button onClick={() => setIds([3, 4])}>change</button>
          data: {queries.map((q) => String(q.data)).join(',')}
        </div>
      )
    }

    function App() {
      return (
        <Suspense fallback={<Fallback />}>
          <Page />
        </Suspense>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('change'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 3,4')).toBeInTheDocument()

    expect(suspenseCount).toBe(2)
  })

  it("shouldn't unmount before all promises fetched", async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<string> = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              sleep(10).then(() => {
                results.push('1')
                return '1'
              }),
          },
          {
            queryKey: key2,
            queryFn: () =>
              sleep(20).then(() => {
                results.push('2')
                return '2'
              }),
          },
        ],
      }))

      return (
        <div>
          data: {String(queries[0].data)},{String(queries[1].data)}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<Fallback />}>
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

    // Both queries should have resolved before the component rendered
    // The order should be: loading -> query 1 resolves -> query 2 resolves
    expect(results).toEqual(['loading', '1', '2'])
  })

  it('should throw error when queryKey changes and new query fails', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      const [fail, setFail] = createSignal(false)
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: [key, fail()],
            queryFn: () =>
              sleep(10).then(() => {
                if (fail()) throw new Error('Suspense Error Bingo')
                return 'data'
              }),
            retry: false,
            throwOnError: true,
          },
        ],
      }))

      return (
        <div>
          <button onClick={() => setFail(true)}>trigger fail</button>
          data: {String(queries[0].data)}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary fallback={() => <div>error boundary</div>}>
          <Suspense fallback="loading">
            <Page />
          </Suspense>
        </ErrorBoundary>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('trigger fail'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should show error boundary even with gcTime:0', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()
    let count = 0

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: () =>
              sleep(10).then(() => {
                count++
                throw new Error('Query failed')
              }),
            gcTime: 0,
            retry: false,
            throwOnError: true,
          },
        ],
      }))

      return <div>data: {String(queries[0].data)}</div>
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <ErrorBoundary fallback={() => <div>There was an error!</div>}>
            <Page />
          </ErrorBoundary>
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('There was an error!')).toBeInTheDocument()

    expect(count).toBe(1)

    consoleMock.mockRestore()
  })

  it('should gc when unmounted while fetching with low gcTime', async () => {
    const key = queryKey()

    function Component() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key,
            queryFn: () => sleep(3000).then(() => 'data'),
            gcTime: 1000,
          },
        ],
      }))

      return <div>data: {String(queries[0].data)}</div>
    }

    function App() {
      const [show, setShow] = createSignal(true)

      return (
        <div>
          <Show when={show()} fallback={<div>page2</div>}>
            <Suspense fallback="loading">
              <Component />
            </Suspense>
          </Show>
          <button onClick={() => setShow(false)}>hide</button>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('hide'))
    expect(rendered.getByText('page2')).toBeInTheDocument()
    // wait for query to be resolved
    await vi.advanceTimersByTimeAsync(3000)
    expect(queryClient.getQueryData(key)).toBe('data')
    // wait for gc
    await vi.advanceTimersByTimeAsync(1000)
    expect(queryClient.getQueryData(key)).toBe(undefined)
  })

  it('should suspend on offline when query changes, and data should not be undefined', async () => {
    const key = queryKey()

    function Page() {
      const [id, setId] = createSignal(0)

      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: [...key, id()],
            queryFn: () => sleep(10).then(() => `Data ${id()}`),
          },
        ],
      }))

      return (
        <div>
          <div>{String(queries[0].data)}</div>
          <button onClick={() => setId((prev) => prev + 1)}>fetch</button>
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('Data 0')).toBeInTheDocument()

    // go offline
    onlineManager.setOnline(false)

    // click changes id to 1, but query is paused so previous data should be kept
    fireEvent.click(rendered.getByText('fetch'))
    expect(rendered.getByText('Data 0')).toBeInTheDocument()

    // go back online
    onlineManager.setOnline(true)

    // click changes id to 2, which triggers a new fetch
    fireEvent.click(rendered.getByText('fetch'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    // Solid signals update immediately (unlike React useState which preserves
    // the previous render tree during suspense), so id is 2 after two clicks
    expect(rendered.getByText('Data 2')).toBeInTheDocument()

    // restore online state for subsequent tests
    onlineManager.setOnline(true)
  })

  it('should still suspense if queryClient has placeholderData config', async () => {
    const key = queryKey()
    const queryClientWithPlaceholder = new QueryClient({
      defaultOptions: {
        queries: {
          placeholderData: (previousData: any) => previousData,
        },
      },
    })

    function Page() {
      const [count, setCount] = createSignal(0)

      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: [...key, count()],
            queryFn: () => sleep(10).then(() => 'data' + count()),
          },
        ],
      }))

      return (
        <div>
          <button onClick={() => setCount((prev) => prev + 1)}>inc</button>
          <div>data: {String(queries[0].data)}</div>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClientWithPlaceholder}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data1')).toBeInTheDocument()
  })

  it('should suspend only pending queries when some already have cached data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const key3 = queryKey()

    // Pre-populate cache for key1
    queryClient.setQueryData(key1, 'cached1')

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'fresh1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'data2'),
          },
          {
            queryKey: key3,
            queryFn: () => sleep(20).then(() => 'data3'),
          },
        ],
      }))

      return (
        <div>
          q1: {String(queries[0].data)}, q2: {String(queries[1].data)}, q3:{' '}
          {String(queries[2].data)}
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

    // key2 and key3 are pending, so should suspend
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    // key1 had cached data, key2 resolved at 10ms, key3 still pending
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    // All resolved — key1 refetched in background so shows fresh data
    expect(
      rendered.getByText('q1: fresh1, q2: data2, q3: data3'),
    ).toBeInTheDocument()
  })

  it('should suspend when queries count increases dynamically', async () => {
    const key = queryKey()

    function Page() {
      const [count, setCount] = createSignal(2)

      const queries = useQueries(() => ({
        queries: Array.from({ length: count() }, (_, i) => ({
          queryKey: [...key, i],
          queryFn: () => sleep(10).then(() => `data${i}`),
        })),
      }))

      return (
        <div>
          <button onClick={() => setCount(3)}>add</button>
          data: {queries.map((q) => String(q.data)).join(',')}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data0,data1')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('add'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: data0,data1,data2')).toBeInTheDocument()
  })

  it('should suspend with select option', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => ({ value: 42 })),
            select: (data: { value: number }) => data.value * 2,
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'raw'),
          },
        ],
      }))

      return (
        <div>
          q1: {String(queries[0].data)}, q2: {String(queries[1].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('q1: 84, q2: raw')).toBeInTheDocument()
  })

  it('should not suspend disabled queries while enabled queries suspend', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'enabled-data'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'disabled-data'),
            enabled: false,
          },
        ],
      }))

      return (
        <div>
          q1: {String(queries[0].data)}, q2: {String(queries[1].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(
      rendered.getByText('q1: enabled-data, q2: undefined'),
    ).toBeInTheDocument()
  })

  it('should not re-suspend when invalidating queries with existing data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'data2'),
          },
        ],
      }))

      return (
        <div>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: key1 })}
          >
            invalidate
          </button>
          q1: {String(queries[0].data)}, q2: {String(queries[1].data)}
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('q1: data1, q2: data2')).toBeInTheDocument()

    // Invalidate should refetch in background, not re-suspend
    fireEvent.click(rendered.getByText('invalidate'))
    expect(
      rendered.getByText('q1: data1, q2: data2'),
    ).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('q1: data1, q2: data2')).toBeInTheDocument()
  })

  it('should not suspend when all queries have staleTime: Infinity and cached data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached1')
    queryClient.setQueryData(key2, 'cached2')

    function Page() {
      const queries = useQueries(() => ({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'fresh1'),
            staleTime: Infinity,
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'fresh2'),
            staleTime: Infinity,
          },
        ],
      }))

      return (
        <div>
          q1: {String(queries[0].data)}, q2: {String(queries[1].data)}
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

    // Should not suspend because data is cached and not stale
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(
      rendered.getByText('q1: cached1, q2: cached2'),
    ).toBeInTheDocument()
  })
})
