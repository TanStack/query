import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@solidjs/testing-library'
import { Errored, Loading, createRenderEffect, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
} from '..'
import type { InfiniteData, UseInfiniteQueryResult, UseQueryResult } from '..'

describe("useQuery's in Loading mode", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    queryClient.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const queryCache = new QueryCache()
  const queryClient = new QueryClient({ queryCache })

  it('should render the correct amount of times in Loading mode', async () => {
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

      createRenderEffect(
        () => state,
        (s) => {
          states.push({ ...s })
        },
      )

      createRenderEffect(
        () => [{ ...state }, () => key],
        () => {
          renders++
        },
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
        <Loading fallback="loading">
          <Page />
        </Loading>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(renders).toBeGreaterThan(0)
    expect(states.length).toBeGreaterThan(0)
    expect(states.at(-1)?.status).toMatch(/pending|success/)
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

      createRenderEffect(
        () => state,
        (s) => {
          states.push({ ...s })
        },
      )

      return (
        <div>
          <button onClick={() => setMultiplier(2)}>next</button>
          data: {state.data?.pages.join(',')}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Loading fallback="loading">
          <Page />
        </Loading>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(states.length).toBeGreaterThan(0)
    expect(states.at(-1)?.status).toMatch(/pending|success/)

    fireEvent.click(rendered.getByText('next'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
    expect(states.length).toBeGreaterThan(0)
    expect(states.at(-1)?.status).toMatch(/pending|success/)
  })

  it('should not call the queryFn twice when used in Loading mode', async () => {
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
        <Loading fallback="loading">
          <Page />
        </Loading>
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
          {show() && <Page />}
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
    await vi.advanceTimersByTimeAsync(0)
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
            if (!succeed) throw new Error('Loading Error Bingo')
            return 'data'
          }),
        retryDelay: 10,
        suspense: true,
        throwOnError: true,
      }))

      return (
        <div>
          <span>rendered</span> <span>{state.data}</span>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Errored
          fallback={(_err, resetSolid) => (
            <div>
              <div>error boundary</div>
              <button
                onClick={() => {
                  succeed = true
                  queryClient.resetQueries({ queryKey: key })
                  resetSolid()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('retry'))
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
            if (!succeed) throw new Error('Loading Error Bingo')
            return 'data'
          }),
        retry: false,
        suspense: true,
        throwOnError: true,
      }))

      return (
        <div>
          <span>rendered</span> <span>{state.data}</span>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Errored
          fallback={(_err, resetSolid) => (
            <div>
              <div>error boundary</div>
              <button
                onClick={() => {
                  queryClient.resetQueries({ queryKey: key })
                  resetSolid()
                }}
              >
                retry
              </button>
            </div>
          )}
        >
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('retry'))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    succeed = true

    fireEvent.click(rendered.getByText('retry'))
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
          <Loading fallback="loading">{show() && <Component />}</Loading>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()
    expect(rendered.getByText('hide')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('hide'))
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('show')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('show'))
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
          <Loading fallback="loading">
            <Component queryKey={key()} />
          </Loading>
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()

    fireEvent.click(rendered.getByText('switch'))
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
          sleep(10).then(() => Promise.reject(new Error('Loading Error a1x'))),
        retry: false,
        suspense: true,
      }))

      return <div>rendered {state.data}</div>
    }

    function App() {
      return (
        <Errored
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

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
          sleep(10).then(() => Promise.reject(new Error('Loading Error a2x'))),
        retry: false,
        throwOnError: false,
      }))

      return <div>rendered {state.data}</div>
    }

    function App() {
      return (
        <Errored
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

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

      return <div>rendered {state.data}</div>
    }

    function App() {
      return (
        <Errored
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

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

      return <div>rendered {state.data}</div>
    }

    function App() {
      return (
        <Errored
          fallback={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

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
        <Loading fallback="loading">
          <Page />
        </Loading>
      </QueryClientProvider>
    ))

    expect(queryFn).toHaveBeenCalledTimes(0)

    await vi.advanceTimersByTimeAsync(10)
    fireEvent.click(rendered.getByRole('button', { name: /fire/i }))
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
            if (!succeed) throw new Error('Loading Error Bingo')
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
        <Errored fallback={() => <div>error boundary</div>}>
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

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
            if (!succeed) throw new Error('Loading Error Bingo')
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
        <Errored fallback={() => <div>error boundary</div>}>
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // resolve promise -> render Page (rendered)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change promise result to error
    succeed = false
    // change query key

    fireEvent.click(rendered.getByLabelText('fail'))
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
            Promise.reject(new Error('Loading Error Bingo')),
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
        <Errored fallback={() => <div>error boundary</div>}>
          <Loading fallback="loading">
            <Page />
          </Loading>
        </Errored>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)
    // render empty data with 'rendered' when enabled is false
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change enabled to true
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should render the correct amount of times in Loading mode when gcTime is set to 0', async () => {
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
        () => [() => ({ ...state })],
        () => {
          renders++
        },
      )

      return (
        <div>
          <span>rendered</span>
          {state.data}
        </div>
      )
    }

    const rendered = render(() => (
      <QueryClientProvider client={queryClient}>
        <Loading fallback="loading">
          <Page />
        </Loading>
      </QueryClientProvider>
    ))

    await vi.advanceTimersByTimeAsync(10)

    expect(state).toMatchObject({
      data: 1,
      status: 'success',
    })
    expect(renders).toBe(1)
    expect(rendered.queryByText('rendered')).toBeInTheDocument()
  })
})
