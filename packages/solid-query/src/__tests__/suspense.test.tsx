// Legacy suspense suite ported to the 2.0 model, where suspense IS the model:
// the `suspense` option is gone, first loads suspend into <Loading>, errors
// with no committed data surface to <Errored>, and refetches/key switches
// hold the committed UI. Tests that only exercised the old opt-in flag or
// render-count mechanics were deleted; see port-notes/suspense.md.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@solidjs/testing-library'
import { Errored, Loading, createSignal } from 'solid-js'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryCache, QueryClient, useInfiniteQuery, useQuery } from '..'
import { renderWithClient } from './utils'

describe('useQuery suspense semantics (Loading/Errored boundaries)', () => {
  let queryCache: QueryCache
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryCache = new QueryCache()
    queryClient = new QueryClient({ queryCache })
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()

    function Page() {
      const [multiplier, setMultiplier] = createSignal(1)
      const state = useInfiniteQuery(() => ({
        queryKey: [key, multiplier()],
        // Fetch inputs come from the queryKey, not closure reads: the
        // key-switch fetch resolves during a transition hold, where an
        // untracked `multiplier()` read returns the committed (old) value.
        queryFn: ({ pageParam, queryKey: [, keyMultiplier] }) =>
          sleep(10).then(() => pageParam * (keyMultiplier as number)),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage + 1,
      }))

      return (
        <div>
          <button onClick={() => setMultiplier(2)}>next</button>
          data: {state.data.pages.join(',')}
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback="loading">
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('next'))
    await vi.advanceTimersByTimeAsync(5)
    // Key switch: committed page holds — no fallback.
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(5)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
  })

  it('should not call the queryFn twice when used in Loading mode', async () => {
    const key = queryKey()

    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    function Page() {
      useQuery(() => ({
        queryKey: [key],
        queryFn,
      }))

      return <>rendered</>
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback="loading">
        <Page />
      </Loading>
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

    const rendered = renderWithClient(queryClient, () => <App />)

    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })).toBeUndefined()

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
      }))

      return (
        <div>
          <span>rendered</span> <span>{state.data}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
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
      }))

      return (
        <div>
          <span>rendered</span> <span>{state.data}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
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

    const rendered = renderWithClient(queryClient, () => <Page />)

    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()
    expect(rendered.getByText('hide')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('hide'))
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('show')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('show'))
    await vi.advanceTimersByTimeAsync(0)
    // Remount serves the cached value immediately while the mount refetch
    // runs in the background — no fallback.
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(rendered.getByText('fetching: true')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
    expect(rendered.getByText('fetching: false')).toBeInTheDocument()
  })

  it('should hold committed data when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: Array<string> }) {
      const result = useQuery(() => ({
        queryKey: props.queryKey,
        // Read the key from the query context, not from reactive props: a
        // queryFn resolving during the switch's hold would read the
        // COMMITTED (old) key from props and poison the new entry.
        queryFn: (ctx) => sleep(100).then(() => ctx.queryKey),
        retry: false,
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

    const rendered = renderWithClient(queryClient, () => <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()

    fireEvent.click(rendered.getByText('switch'))
    await vi.advanceTimersByTimeAsync(50)
    // Switching keys is a refetch shape, not a fresh first load: the
    // committed value holds and the fallback does not come back.
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(50)
    expect(rendered.getByText(`data: ${key2}`)).toBeInTheDocument()
    // Drain the observer's follow-up mount refetch of the new key so no
    // fetch is left in flight at teardown.
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

    const rendered = renderWithClient(queryClient, () => <App />)

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should not throw errors to the error boundary when throwOnError: false', async () => {
    // With no committed data, reading `.data` of an errored query always
    // routes to <Errored> — the read cannot produce a value. What
    // `throwOnError: false` preserves is the error-as-state channel:
    // metadata reads (status/error) never throw, so a component that does
    // not read `.data` renders the error without tripping the boundary.
    const key = queryKey()

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Loading Error a2x'))),
        retry: false,
        throwOnError: false,
      }))

      return (
        <div>
          <div>status: {state.status}</div>
          <div>error: {state.error?.message ?? 'none'}</div>
        </div>
      )
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

    const rendered = renderWithClient(queryClient, () => <App />)

    expect(rendered.getByText('status: pending')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('status: error')).toBeInTheDocument()
    expect(rendered.getByText('error: Loading Error a2x')).toBeInTheDocument()
    expect(rendered.queryByText('error boundary')).not.toBeInTheDocument()
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

    const rendered = renderWithClient(queryClient, () => <App />)

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should not throw errors to the error boundary when a throwOnError function returns false', async () => {
    // The throwOnError gate applies to reads that have a committed value to
    // keep serving: a failed refetch with stale data stays error-as-state
    // when the function returns false.
    const key = queryKey()
    let count = 0

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (++count === 1) return 'data'
            return Promise.reject(new Error('Local Error'))
          }),
        retry: false,
        throwOnError: (err: Error) => err.message !== 'Local Error',
      }))

      return (
        <div>
          <span>rendered</span> <span>{state.data}</span>
          <span>refetchError: {String(state.isRefetchError)}</span>
        </div>
      )
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

    const rendered = renderWithClient(queryClient, () => <App />)

    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()
    expect(rendered.getByText('data')).toBeInTheDocument()

    void queryClient.invalidateQueries({ queryKey: key })
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data')).toBeInTheDocument()
    expect(rendered.getByText('refetchError: true')).toBeInTheDocument()
    expect(rendered.queryByText('error boundary')).not.toBeInTheDocument()
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = vi.fn(() => sleep(10).then(() => '23'))
    const [enabled, setEnabled] = createSignal(false)

    function Page() {
      const result = useQuery(() => ({
        queryKey: [key],
        queryFn,
        enabled: enabled(),
      }))

      return <h1>{result.data}</h1>
    }

    const rendered = renderWithClient(queryClient, () => (
      <div>
        <button onClick={() => setEnabled(true)}>fire</button>
        <Loading fallback="loading">
          <Page />
        </Loading>
      </div>
    ))

    await vi.advanceTimersByTimeAsync(10)
    // Disabled: nothing fetches and the guard-free data read parks the
    // boundary.
    expect(queryFn).toHaveBeenCalledTimes(0)
    expect(rendered.getByText('loading')).toBeInTheDocument()

    fireEvent.click(rendered.getByRole('button', { name: /fire/i }))
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByRole('heading').textContent).toBe('23')
    // Exactly one fetch: the pull path syncs observer options before
    // fetching, so the deferred post-release options effect sees a no-op
    // diff instead of issuing a second policy fetch.
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should error caught in error boundary without infinite loop', async () => {
    const key = queryKey()

    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    let succeed = true

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Loading Error Bingo')
            return 'data'
          }),
        retry: false,
      }))

      return (
        <div>
          <span>rendered</span> <span>{state.data}</span>
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

    const rendered = renderWithClient(queryClient, () => <App />)

    // resolve promise -> render Page (rendered)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // make the next fetch fail
    succeed = false
    // reset query -> refetch fails -> throw error

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

    const rendered = renderWithClient(queryClient, () => <App />)

    // resolve promise -> render Page (rendered)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change promise result to error
    succeed = false
    // change query key -> new key's fetch fails -> throw error

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

    const [enabled, setEnabled] = createSignal(false)

    function Page() {
      const queryKeys = '1'

      const result = useQuery<string>(() => ({
        queryKey: [queryKeys],
        queryFn: () =>
          sleep(10).then(() =>
            Promise.reject(new Error('Loading Error Bingo')),
          ),
        retry: false,
        enabled: enabled(),
      }))

      return (
        <div>
          <span>rendered</span> <span>{result.data}</span>
        </div>
      )
    }

    function App() {
      return (
        <div>
          <button
            aria-label="fail"
            onClick={() => {
              setEnabled(true)
            }}
          >
            fail
          </button>
          <Errored fallback={() => <div>error boundary</div>}>
            <Loading fallback="loading">
              <Page />
            </Loading>
          </Errored>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => <App />)

    await vi.advanceTimersByTimeAsync(10)
    // Disabled: the guard-free data read parks the boundary — nothing to
    // render and nothing in flight.
    expect(rendered.getByText('loading')).toBeInTheDocument()

    // enable -> fetch fails -> throw error, exactly once
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should render the correct amount of times in Loading mode when gcTime is set to 0', async () => {
    const key = queryKey()

    let count = 0
    const queryFn = vi.fn(() => sleep(10).then(() => ++count))

    function Page() {
      const state = useQuery(() => ({
        queryKey: key,
        queryFn,
        gcTime: 0,
      }))

      return (
        <div>
          <span>rendered</span> <span>data: {state.data}</span>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, () => (
      <Loading fallback="loading">
        <Page />
      </Loading>
    ))

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered')).toBeInTheDocument()
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    // gcTime 0 must not evict a mounted query out from under its consumer:
    // the data stays committed and no refetch loop starts.
    await vi.advanceTimersByTimeAsync(100)
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })
})
