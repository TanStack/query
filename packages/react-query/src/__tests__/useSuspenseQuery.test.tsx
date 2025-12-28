import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryCache,
  QueryClient,
  QueryErrorResetBoundary,
  skipToken,
  useQueryErrorResetBoundary,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type {
  InfiniteData,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from '..'

describe('useSuspenseQuery', () => {
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
    const states: Array<UseSuspenseQueryResult<number>> = []

    let count = 0
    let renders = 0

    function Page() {
      renders++

      const [stateKey, setStateKey] = React.useState(key)

      const state = useSuspenseQuery({
        queryKey: stateKey,
        queryFn: () => sleep(10).then(() => ++count),
      })

      states.push(state)

      return (
        <div>
          <button aria-label="toggle" onClick={() => setStateKey(queryKey())} />
          data: {String(state.data)}
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(renders).toBe(6)
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: 1, status: 'success' })
    expect(states[1]).toMatchObject({ data: 2, status: 'success' })
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()
    const states: Array<UseSuspenseInfiniteQueryResult<InfiniteData<number>>> =
      []

    function Page() {
      const [multiplier, setMultiplier] = React.useState(1)
      const state = useSuspenseInfiniteQuery({
        queryKey: [`${key}_${multiplier}`],
        queryFn: ({ pageParam }) =>
          sleep(10).then(() => pageParam * multiplier),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage + 1,
      })

      states.push(state)

      return (
        <div>
          <button onClick={() => setMultiplier(2)}>next</button>
          data: {state.data?.pages.join(',')}
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = vi.fn(() => sleep(10).then(() => 'data'))

    function Page() {
      useSuspenseQuery({ queryKey: [key], queryFn })

      return <>rendered</>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
      })

      return <>rendered</>
    }

    function App() {
      const [show, setShow] = React.useState(false)

      return (
        <>
          <React.Suspense fallback="loading">{show && <Page />}</React.Suspense>
          <button
            aria-label="toggle"
            onClick={() => setShow((prev) => !prev)}
          />
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(0)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    let succeed = false

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retryDelay: 10,
      })

      return <div>rendered</div>
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
                    succeed = true
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
    await act(() => vi.advanceTimersByTimeAsync(70))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(consoleMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )

    consoleMock.mockRestore()
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    let succeed = false

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retry: false,
      })
      return <div>rendered</div>
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

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    succeed = true

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should set staleTime when having passed a function', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ++count),
        staleTime: () => 60 * 1000,
      })
      return (
        <div>
          <span>data: {result.data}</span>
        </div>
      )
    }

    function Page() {
      return (
        <React.Suspense fallback="loading">
          <Component />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(
      typeof queryClient.getQueryCache().find({ queryKey: key })?.observers[0]
        ?.options.staleTime,
    ).toBe('function')
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: Array<string> }) {
      const result = useSuspenseQuery({
        queryKey: props.queryKey,
        queryFn: () => sleep(10).then(() => props.queryKey),
        retry: false,
      })
      return <div>data: {result.data}</div>
    }

    function Page() {
      const [key, setKey] = React.useState(key1)
      return (
        <div>
          <button
            onClick={() => {
              setKey(key2)
            }}
          >
            switch
          </button>
          <React.Suspense fallback="loading">
            <Component queryKey={key} />
          </React.Suspense>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()

    fireEvent.click(rendered.getByText('switch'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText(`data: ${key2}`)).toBeInTheDocument()
  })

  it('should retry fetch if the reset error boundary has been reset with global hook', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    let succeed = false

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retry: false,
      })
      return <div>rendered</div>
    }

    function App() {
      const { reset } = useQueryErrorResetBoundary()
      return (
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
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    succeed = true

    fireEvent.click(rendered.getByText('retry'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should throw errors to the error boundary by default', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Suspense Error a1x'))),
        retry: false,
      })
      return <div>rendered</div>
    }

    function App() {
      return (
        <ErrorBoundary
          fallbackRender={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should throw select errors to the error boundary by default', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ({ a: { b: 'c' } })),
        select: () => {
          throw new Error('foo')
        },
      })
      return <div>rendered</div>
    }

    function App() {
      return (
        <ErrorBoundary
          fallbackRender={() => (
            <div>
              <div>error boundary</div>
            </div>
          )}
        >
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    consoleMock.mockRestore()
  })

  it('should error caught in error boundary without infinite loop', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    let succeed = true

    function Page() {
      const [nonce] = React.useState(0)
      const queryKeys = [`${key}-${succeed}`]
      const result = useSuspenseQuery({
        queryKey: queryKeys,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return nonce
          }),
        retry: false,
      })
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
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={() => <div>error boundary</div>}
        >
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // render suspense fallback (loading)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change query key
    succeed = false

    // reset query -> and throw error
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    expect(consoleMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )

    consoleMock.mockRestore()
  })

  it('should error caught in error boundary without infinite loop when query keys changed', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    let succeed = true

    function Page() {
      const [key, rerender] = React.useReducer((x) => x + 1, 0)
      const queryKeys = [key, succeed]

      const result = useSuspenseQuery({
        queryKey: queryKeys,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retry: false,
      })

      if (result.error) {
        throw result.error
      }

      return (
        <div>
          <span>rendered</span> <span>{result.data}</span>
          <button aria-label="fail" onClick={rerender}>
            fail
          </button>
        </div>
      )
    }

    function App() {
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={() => <div>error boundary</div>}
        >
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // render suspense fallback (loading)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change promise result to error
    succeed = false

    // change query key
    fireEvent.click(rendered.getByLabelText('fail'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // render error boundary fallback (error boundary)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    expect(consoleMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )

    consoleMock.mockRestore()
  })

  it('should render the correct amount of times in Suspense mode when gcTime is set to 0', async () => {
    const key = queryKey()
    let state: UseSuspenseQueryResult<number, Error | null> | null = null

    let count = 0
    let renders = 0

    function Page() {
      renders++

      state = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ++count),
        gcTime: 0,
      })

      return (
        <div>
          <span>rendered</span>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(state).toMatchObject({
      data: 1,
      status: 'success',
    })
    expect(renders).toBe(3)
  })

  it('should not throw background errors to the error boundary', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    let succeed = true
    const key = queryKey()

    function Page() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: () =>
          sleep(10).then(() => {
            if (!succeed) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retry: false,
      })

      return (
        <div>
          <span>
            rendered {result.data} {result.status}
          </span>
          <button onClick={() => result.refetch()}>refetch</button>
        </div>
      )
    }

    function App() {
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={() => <div>error boundary</div>}
        >
          <React.Suspense fallback="loading">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // render suspense fallback (loading)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered data success')).toBeInTheDocument()

    // change promise result to error
    succeed = false

    // refetch
    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))
    // we are now in error state but still have data to show
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('rendered data error')).toBeInTheDocument()

    consoleMock.mockRestore()
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
    const states: Array<UseSuspenseQueryResult<number>> = []

    let count = 0

    function Page() {
      const [stateKey, setStateKey] = React.useState(key)

      const state = useSuspenseQuery({
        queryKey: stateKey,
        queryFn: async () => sleep(10).then(() => ++count),
      })

      states.push(state)

      return (
        <div>
          <button aria-label="toggle" onClick={() => setStateKey(queryKey())} />
          data: {String(state.data)}
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClientWithPlaceholder,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    fireEvent.click(rendered.getByLabelText('toggle'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
  })

  it('should log an error when skipToken is passed as queryFn', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        // @ts-expect-error
        // eslint-disable-next-line react-hooks/purity
        queryFn: Math.random() >= 0 ? skipToken : () => Promise.resolve(5),
      })

      return null
    }

    function App() {
      return (
        <React.Suspense fallback="loading">
          <Page />
        </React.Suspense>
      )
    }

    renderWithClient(queryClient, <App />)

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseQuery',
    )
    consoleErrorSpy.mockRestore()
  })

  it('should properly refresh data when refetchInterval is set', async () => {
    const key = queryKey()
    let count = 0

    function Page() {
      const state = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ++count),
        refetchInterval: 10,
      })

      return <div>count: {state.data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(21))
    expect(rendered.getByText('count: 2')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(21))
    expect(rendered.getByText('count: 3')).toBeInTheDocument()

    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('should log an error when skipToken is used in development environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: skipToken as any,
      })

      return null
    }

    renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseQuery',
    )

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })

  it('should not log an error when skipToken is used in production environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: skipToken as any,
      })

      return null
    }

    renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(consoleErrorSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })
})
