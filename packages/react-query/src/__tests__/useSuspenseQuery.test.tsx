import { createKey, sleep } from '@tanstack/query-test-utils'
import { act, fireEvent } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryCache,
  QueryClient,
  QueryErrorResetBoundary,
  experimental_streamedQuery,
  keepPreviousData,
  skipToken,
  useQueryErrorResetBoundary,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import { renderWithSuspense } from './utils'
import type {
  InfiniteData,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from '..'

describe('useSuspenseQuery', () => {
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

  it('should render the correct amount of times in Suspense mode', async () => {
    const key = createKey()
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
          <button
            aria-label="toggle"
            onClick={() => setStateKey(createKey())}
          />
          data: {String(state.data)}
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    await act(() => fireEvent.click(rendered.getByLabelText('toggle')))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(renders).toBe(6)
    expect(states).toHaveLength(2)
    expect(states[0]).toMatchObject({ data: 1, status: 'success' })
    expect(states[1]).toMatchObject({ data: 2, status: 'success' })
  })

  it('should not create uncached promises for multiple queries in a transition', async () => {
    const consoleMock = vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()

    function Item({ id, count }: { id: number; count: number }) {
      const { data } = useSuspenseQuery({
        queryKey: [key, id, count],
        queryFn: () => sleep(10).then(() => `data-${id}-${count}`),
      })

      return <div>{data}</div>
    }

    function Page() {
      const [count, setCount] = React.useState(0)

      return (
        <>
          <button
            onClick={() => React.startTransition(() => setCount(count + 1))}
          >
            next
          </button>
          <Item id={1} count={count} />
          <Item id={2} count={count} />
        </>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data-1-0')).toBeInTheDocument()
    expect(rendered.getByText('data-2-0')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('next'))
    })
    await act(() => vi.advanceTimersByTimeAsync(10))

    expect(rendered.getByText('data-1-1')).toBeInTheDocument()
    expect(rendered.getByText('data-2-1')).toBeInTheDocument()
    expect(
      consoleMock.mock.calls.some((call) =>
        call.some(
          (value) =>
            typeof value === 'string' && value.includes('uncached promise'),
        ),
      ),
    ).toBe(false)

    consoleMock.mockRestore()
  })

  it('should not warn when a suspense promise settles before a replay', async () => {
    const consoleMock = vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()

    function Page() {
      const [id, setId] = React.useState(0)
      const { data } = useSuspenseQuery({
        queryKey: [key, id],
        queryFn: () => Promise.resolve(id),
      })

      return (
        <>
          <button onClick={() => React.startTransition(() => setId(1))}>
            next
          </button>
          <div>data: {data}</div>
        </>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    await act(() => {
      fireEvent.click(rendered.getByText('next'))
    })

    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(
      consoleMock.mock.calls.some((call) =>
        call.some(
          (value) =>
            typeof value === 'string' && value.includes('uncached promise'),
        ),
      ),
    ).toBe(false)

    consoleMock.mockRestore()
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = createKey()
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

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(states).toHaveLength(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    await act(() => {
      fireEvent.click(rendered.getByText('next'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()

    expect(states).toHaveLength(2)
    expect(states[1]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = createKey()

    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(10).then(() => 'data'),
    )

    function Page() {
      useSuspenseQuery({ queryKey: [key], queryFn })

      return <>rendered</>
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <App />)

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })).toBeUndefined()

    await act(() => {
      fireEvent.click(rendered.getByLabelText('toggle'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(1)

    await act(() => {
      fireEvent.click(rendered.getByLabelText('toggle'))
    })
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.queryByText('rendered')).not.toBeInTheDocument()
    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(0)
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
    const key = createKey()

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

    const rendered = await renderWithSuspense(
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
            <Page />
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(70))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('retry'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(consoleErrorMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()

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

    const rendered = await renderWithSuspense(
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('retry'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    succeed = true

    await act(() => {
      fireEvent.click(rendered.getByText('retry'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()
  })

  it('should set staleTime when having passed a function', async () => {
    const key = createKey()
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

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    expect(
      queryClient.getQueryCache().find({ queryKey: key })?.observers[0]?.options
        .staleTime,
    ).toBeTypeOf('function')
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = createKey()
    const key2 = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText(`data: ${key1}`)).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('switch'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText(`data: ${key2}`)).toBeInTheDocument()
  })

  it('should retry fetch if the reset error boundary has been reset with global hook', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('retry'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(rendered.getByText('retry')).toBeInTheDocument()

    succeed = true

    await act(() => {
      fireEvent.click(rendered.getByText('retry'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()
  })

  it('should throw errors to the error boundary by default', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
  })

  it('should throw select errors to the error boundary by default', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()
  })

  it('should error caught in error boundary without infinite loop', async () => {
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
    const key = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <App />)

    // render suspense fallback (loading)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change query key
    succeed = false

    // reset query -> and throw error
    await act(() => {
      fireEvent.click(rendered.getByLabelText('fail'))
      return Promise.resolve()
    })
    // render error boundary fallback (error boundary)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    expect(consoleErrorMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )
  })

  it('should error caught in error boundary without infinite loop when query keys changed', async () => {
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
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

    const rendered = await renderWithSuspense(queryClient, <App />)

    // render suspense fallback (loading)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    // change promise result to error
    succeed = false

    // change query key
    await act(() => {
      fireEvent.click(rendered.getByLabelText('fail'))
    })
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // render error boundary fallback (error boundary)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    expect(consoleErrorMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )
  })

  it('should render the correct amount of times in Suspense mode when gcTime is set to 0', async () => {
    const key = createKey()
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

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered')).toBeInTheDocument()

    expect(state).toMatchObject({
      data: 1,
      status: 'success',
    })
    expect(renders).toBe(3)
  })

  it('should not throw background errors to the error boundary', async () => {
    vi.spyOn(console, 'error').mockReturnValue(undefined)
    let succeed = true
    const key = createKey()

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

    const rendered = await renderWithSuspense(queryClient, <App />)

    // render suspense fallback (loading)
    expect(rendered.getByText('loading')).toBeInTheDocument()
    // resolve promise -> render Page (rendered)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered data success')).toBeInTheDocument()

    // change promise result to error
    succeed = false

    // refetch
    await act(() => {
      fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))
    })
    // we are now in error state but still have data to show
    await vi.advanceTimersByTimeAsync(11)
    expect(rendered.getByText('rendered data error')).toBeInTheDocument()
  })

  it('should use cache-derived placeholderData without suspending', async () => {
    const key = createKey()
    const queryFn = vi.fn<() => Promise<{ id: number; text: string }>>(() =>
      sleep(10).then(() => ({ id: 1, text: 'full' })),
    )
    const states: Array<UseSuspenseQueryResult<{ id: number; text: string }>> =
      []

    queryClient.setQueryData([...key, 'list'], [{ id: 1, text: 'preview' }])

    function Page() {
      const state = useSuspenseQuery({
        queryKey: [...key, 'detail', 1],
        queryFn,
        placeholderData: () =>
          queryClient
            .getQueryData<Array<{ id: number; text: string }>>([...key, 'list'])
            ?.find((item) => item.id === 1),
      })

      states.push(state)
      return <div>data: {state.data.text}</div>
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: preview')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(states.at(-1)).toMatchObject({
      isPlaceholderData: true,
      isFetching: true,
      status: 'success',
    })

    await act(() => vi.advanceTimersByTimeAsync(11))

    expect(rendered.getByText('data: full')).toBeInTheDocument()
    expect(states.at(-1)).toMatchObject({
      isPlaceholderData: false,
      isFetching: false,
      status: 'success',
    })
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should use keepPreviousData from queryClient defaults', async () => {
    const key = createKey()
    const queryClientWithPlaceholder = new QueryClient({
      defaultOptions: {
        queries: {
          placeholderData: keepPreviousData,
        },
      },
    })
    const states: Array<UseSuspenseQueryResult<number>> = []
    const fallback = vi.fn<() => React.JSX.Element>(() => <div>loading</div>)

    let count = 0

    function Page() {
      const [stateKey, setStateKey] = React.useState(key)

      const state = useSuspenseQuery({
        queryKey: stateKey,
        queryFn: () => sleep(10).then(() => ++count),
      })

      states.push(state)

      return (
        <div>
          <button
            aria-label="toggle"
            onClick={() => setStateKey(createKey())}
          />
          data: {String(state.data)}
        </div>
      )
    }

    const rendered = await renderWithSuspense(
      queryClientWithPlaceholder,
      <Page />,
      React.createElement(fallback),
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    expect(fallback).toHaveBeenCalledTimes(1)
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: 1')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByLabelText('toggle'))
    })
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: 1')).toBeInTheDocument()
    expect(states.at(-1)).toMatchObject({
      data: 1,
      isPlaceholderData: true,
      isFetching: true,
    })
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: 2')).toBeInTheDocument()
    expect(states.at(-1)).toMatchObject({
      data: 2,
      isPlaceholderData: false,
      isFetching: false,
    })
    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it('should suspend when placeholderData returns undefined', async () => {
    const key = createKey()

    function Page() {
      const state = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => 'data'),
        placeholderData: () => undefined,
      })

      return <div>data: {state.data}</div>
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: data')).toBeInTheDocument()
  })

  it('should stop suspending when placeholderData becomes defined', async () => {
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>(() =>
      sleep(100).then(() => 'data'),
    )

    function Content({ showPlaceholder }: { showPlaceholder: boolean }) {
      const state = useSuspenseQuery({
        queryKey: key,
        queryFn,
        placeholderData: showPlaceholder ? 'placeholder' : undefined,
      })

      return <div>data: {state.data}</div>
    }

    function Page() {
      const [showPlaceholder, setShowPlaceholder] = React.useState(false)

      return (
        <div>
          <button onClick={() => setShowPlaceholder(true)}>
            show placeholder
          </button>
          <React.Suspense fallback="loading">
            <Content showPlaceholder={showPlaceholder} />
          </React.Suspense>
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)

    await act(() => {
      fireEvent.click(rendered.getByText('show placeholder'))
    })

    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(rendered.getByText('data: placeholder')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(101))
    expect(rendered.getByText('data: data')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should throw a placeholder-backed fetch error to the error boundary', async () => {
    const consoleMock = vi.spyOn(console, 'error').mockReturnValue(undefined)
    const key = createKey()
    const queryFn = vi.fn<() => Promise<string>>((): Promise<string> =>
      sleep(10).then(() => Promise.reject(new Error('failed'))),
    )

    function Page() {
      const state = useSuspenseQuery({
        queryKey: key,
        queryFn,
        placeholderData: 'placeholder',
        retry: false,
      })

      return <div>data: {state.data}</div>
    }

    const rendered = await renderWithSuspense(
      queryClient,
      <ErrorBoundary fallback={<div>error boundary</div>}>
        <Page />
      </ErrorBoundary>,
    )

    expect(rendered.getByText('data: placeholder')).toBeInTheDocument()
    expect(rendered.queryByText('loading')).not.toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(11))

    expect(rendered.getByText('error boundary')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
    consoleMock.mockRestore()
  })

  it('should log an error when skipToken is passed as queryFn', async () => {
    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const key = createKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        // @ts-expect-error
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

    await renderWithSuspense(queryClient, <App />)

    expect(consoleErrorMock).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseQuery',
    )
  })

  it('should properly refresh data when refetchInterval is set', async () => {
    const key = createKey()
    let count = 0

    function Page() {
      const state = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10).then(() => ++count),
        refetchInterval: 10,
      })

      return <div>count: {state.data}</div>
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('count: 1')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('count: 2')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(21)
    expect(rendered.getByText('count: 3')).toBeInTheDocument()

    expect(count).toBeGreaterThanOrEqual(3)
  })

  it('should log an error when skipToken is used in development environment', async () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
    const key = createKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: skipToken as any,
      })

      return null
    }

    await renderWithSuspense(queryClient, <Page />)

    expect(consoleErrorMock).toHaveBeenCalledWith(
      'skipToken is not allowed for useSuspenseQuery',
    )

    process.env.NODE_ENV = envCopy
  })

  it('should not log an error when skipToken is used in production environment', async () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    const consoleErrorMock = vi
      .spyOn(console, 'error')
      .mockReturnValue(undefined)
    const key = createKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: skipToken as any,
      })

      return null
    }

    await renderWithSuspense(queryClient, <Page />)

    expect(consoleErrorMock).not.toHaveBeenCalled()

    process.env.NODE_ENV = envCopy
  })

  it('should release suspense when setQueryData is called while fetch is in-flight', async () => {
    const key = createKey()

    function Content() {
      const { data } = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10000).then(() => 'fetched'),
      })
      return <div>data: {data}</div>
    }

    function Page() {
      return (
        <div>
          <button onClick={() => queryClient.setQueryData(key, 'manual data')}>
            set data
          </button>
          <React.Suspense fallback="loading">
            <Content />
          </React.Suspense>
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('set data'))
    })
    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(rendered.getByText('data: manual data')).toBeInTheDocument()
  })

  it('should release suspense when streamedQuery receives first chunk', async () => {
    const key = createKey()

    async function* numberGenerator() {
      await sleep(10)
      yield 'chunk1'
      await sleep(10)
      yield 'chunk2'
    }

    function Page() {
      const { data } = useSuspenseQuery({
        queryKey: key,
        queryFn: experimental_streamedQuery({
          streamFn: () => numberGenerator(),
        }),
      })
      return <div>data: {data}</div>
    }

    const streamedClient = new QueryClient({
      queryCache,
    })

    const rendered = await renderWithSuspense(streamedClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: chunk1')).toBeInTheDocument()
  })

  it('should release suspense when setQueryData is called before component mounts', async () => {
    const key = createKey()
    queryClient.setQueryData(key, 'preloaded')

    function Page() {
      const { data } = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10000).then(() => 'fetched'),
      })
      return <div>data: {data}</div>
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    await act(() => vi.advanceTimersByTimeAsync(0))
    expect(rendered.getByText('data: preloaded')).toBeInTheDocument()
  })

  it('should NOT release suspense when setQueryData is called with undefined', async () => {
    const key = createKey()

    function Content() {
      const { data } = useSuspenseQuery({
        queryKey: key,
        queryFn: () => sleep(10000).then(() => 'fetched'),
      })
      return <div>data: {data}</div>
    }

    function Page() {
      return (
        <div>
          <button onClick={() => queryClient.setQueryData(key, undefined)}>
            set undefined
          </button>
          <React.Suspense fallback="loading">
            <Content />
          </React.Suspense>
        </div>
      )
    }

    const rendered = await renderWithSuspense(queryClient, <Page />)

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await act(() => {
      fireEvent.click(rendered.getByText('set undefined'))
    })
    await act(() => vi.advanceTimersByTimeAsync(0))

    // Suspense should NOT release — setQueryData(undefined) doesn't satisfy
    // the query.state.data !== undefined guard in fetchOptimistic
    expect(rendered.getByText('loading')).toBeInTheDocument()
  })
})
