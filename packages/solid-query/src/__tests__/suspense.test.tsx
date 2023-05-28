import { fireEvent, render, screen, waitFor } from 'solid-testing-library'

import {
  createRenderEffect,
  createSignal,
  ErrorBoundary,
  on,
  Show,
  Suspense,
} from 'solid-js'
import type { CreateInfiniteQueryResult, CreateQueryResult } from '..'
import {
  createInfiniteQuery,
  createQuery,
  QueryCache,
  QueryClientProvider,
} from '..'
import { createQueryClient, queryKey, sleep } from './utils'

describe("useQuery's in Suspense mode", () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should render the correct amount of times in Suspense mode', async () => {
    const key = queryKey()
    const states: CreateQueryResult<number>[] = []

    let count = 0
    let renders = 0

    function Page() {
      const [stateKey, setStateKey] = createSignal(key())

      const state = createQuery(
        stateKey,
        async () => {
          count++
          await sleep(10)
          return count
        },
        { suspense: true },
      )

      createRenderEffect(() => {
        states.push({ ...state })
      })

      createRenderEffect(
        on([() => ({ ...state }), key], () => {
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 1'))
    fireEvent.click(screen.getByLabelText('toggle'))

    await waitFor(() => screen.getByText('data: 2'))

    expect(renders).toBe(4)
    // TODO(lukemurray): verify that this expectation is valid. this is 2 in
    // react, but 4 in solid, because in solid suspense is triggered on read and
    // the component needs to render in order to trigger suspense.
    expect(states.length).toBe(4)
    expect(states[1]).toMatchObject({ data: 1, status: 'success' })
    expect(states[3]).toMatchObject({ data: 2, status: 'success' })
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()
    const states: CreateInfiniteQueryResult<number>[] = []

    function Page() {
      const [multiplier, setMultiplier] = createSignal(1)
      const state = createInfiniteQuery(
        () => [`${key()}_${multiplier()}`],
        async ({ pageParam = 1 }) => {
          await sleep(10)
          return Number(pageParam * multiplier())
        },
        {
          suspense: true,
          getNextPageParam: (lastPage) => lastPage + 1,
        },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('data: 1'))

    // TODO(lukemurray): in react this is 1 in solid this is 2 because suspense
    // occurs on read.
    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [1], pageParams: [undefined] },
      status: 'success',
    })

    fireEvent.click(screen.getByText('next'))
    await waitFor(() => screen.getByText('data: 2'))

    // TODO(lukemurray): in react this is 2 and in solid it is 4
    expect(states.length).toBe(4)
    expect(states[3]).toMatchObject({
      data: { pages: [2], pageParams: [undefined] },
      status: 'success',
    })
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = jest.fn<string, unknown[]>()
    queryFn.mockImplementation(() => {
      sleep(10)
      return 'data'
    })

    function Page() {
      createQuery(() => [key()], queryFn, { suspense: true })

      return <>rendered</>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      createQuery(
        key,
        () => {
          sleep(10)
          return 'data'
        },
        { suspense: true },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    expect(screen.queryByText('rendered')).toBeNull()
    expect(queryCache.find(key())).toBeFalsy()

    fireEvent.click(screen.getByLabelText('toggle'))
    await waitFor(() => screen.getByText('rendered'))

    expect(queryCache.find(key())?.getObserversCount()).toBe(1)

    fireEvent.click(screen.getByLabelText('toggle'))

    expect(screen.queryByText('rendered')).toBeNull()
    expect(queryCache.find(key())?.getObserversCount()).toBe(0)
  })

  it('should call onSuccess on the first successful call', async () => {
    const key = queryKey()

    const successFn = jest.fn()

    function Page() {
      createQuery(
        () => [key()],
        async () => {
          await sleep(10)
          return key()
        },
        {
          suspense: true,
          select: () => 'selected',
          onSuccess: successFn,
        },
      )

      return <>rendered</>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('rendered'))

    await waitFor(() => expect(successFn).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(successFn).toHaveBeenCalledWith('selected'))
  })

  it('should call every onSuccess handler within a suspense boundary', async () => {
    const key = queryKey()

    const successFn1 = jest.fn()
    const successFn2 = jest.fn()

    function FirstComponent() {
      createQuery(
        key,
        () => {
          sleep(10)
          return 'data'
        },
        {
          suspense: true,
          onSuccess: successFn1,
        },
      )

      return <span>first</span>
    }

    function SecondComponent() {
      createQuery(
        key,
        () => {
          sleep(10)
          return 'data'
        },
        {
          suspense: true,
          onSuccess: successFn2,
        },
      )

      return <span>second</span>
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <FirstComponent />
          <SecondComponent />
        </Suspense>
        ,
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('second'))

    await waitFor(() => expect(successFn1).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(successFn2).toHaveBeenCalledTimes(1))
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
        key,
        async () => {
          await sleep(10)

          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retryDelay: 10,
          suspense: true,
        },
      )

      // Suspense only triggers if used in JSX
      return (
        <Show when={state.data}>
          <div>rendered</div>
        </Show>
      )
    }

    render(() => (
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

    await waitFor(() => screen.getByText('Loading...'))

    await waitFor(() => screen.getByText('error boundary'))

    await waitFor(() => screen.getByText('retry'))

    fireEvent.click(screen.getByText('retry'))

    await waitFor(() => screen.getByText('rendered'))
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      const state = createQuery(
        key,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          suspense: true,
        },
      )

      // Suspense only triggers if used in JSX
      return (
        <Show when={state.data}>
          <div>rendered</div>
        </Show>
      )
    }

    render(() => (
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

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('error boundary'))
    await waitFor(() => screen.getByText('retry'))
    succeed = true
    fireEvent.click(screen.getByText('retry'))
    await waitFor(() => screen.getByText('rendered'))
  })

  it('should refetch when re-mounting', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = createQuery(
        key,
        async () => {
          await sleep(100)
          count++
          return count
        },
        {
          retry: false,
          suspense: true,
          staleTime: 0,
        },
      )
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText('data: 1'))
    await waitFor(() => screen.getByText('fetching: false'))
    await waitFor(() => screen.getByText('hide'))
    fireEvent.click(screen.getByText('hide'))
    await waitFor(() => screen.getByText('show'))
    fireEvent.click(screen.getByText('show'))
    await waitFor(() => screen.getByText('fetching: true'))
    await waitFor(() => screen.getByText('data: 2'))
    await waitFor(() => screen.getByText('fetching: false'))
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: Array<string> }) {
      const result = createQuery(
        () => props.queryKey,
        async () => {
          await sleep(100)
          return props.queryKey
        },
        {
          retry: false,
          suspense: true,
        },
      )
      return <div>data: {result.data}</div>
    }

    function Page() {
      const [key, setKey] = createSignal(key1())
      return (
        <div>
          <button
            onClick={() => {
              setKey(key2())
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Page />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText(`data: ${key1()}`))
    fireEvent.click(screen.getByText('switch'))
    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText(`data: ${key2()}`))
    expect(
      // @ts-expect-error
      queryClient.getQueryCache().find(key2())!.observers[0].listeners.size,
    ).toBe(1)
  })

  it('should throw errors to the error boundary by default', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(
        key,
        async (): Promise<unknown> => {
          await sleep(10)
          throw new Error('Suspense Error a1x')
        },
        {
          retry: false,
          suspense: true,
        },
      )

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- trigger suspense
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should not throw errors to the error boundary when useErrorBoundary: false', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(
        key,
        async (): Promise<unknown> => {
          await sleep(10)
          throw new Error('Suspense Error a2x')
        },
        {
          retry: false,
          suspense: true,
          useErrorBoundary: false,
        },
      )

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- trigger suspense
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText('rendered'))
  })

  it('should not throw errors to the error boundary when a useErrorBoundary function returns true', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(
        key,
        async (): Promise<unknown> => {
          await sleep(10)
          return Promise.reject('Remote Error')
        },
        {
          retry: false,
          suspense: true,
          useErrorBoundary: (err) => err !== 'Local Error',
        },
      )

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- trigger suspense
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should not throw errors to the error boundary when a useErrorBoundary function returns false', async () => {
    const key = queryKey()

    function Page() {
      const state = createQuery(
        key,
        async (): Promise<unknown> => {
          await sleep(10)
          return Promise.reject('Local Error')
        },
        {
          retry: false,
          suspense: true,
          useErrorBoundary: (err) => err !== 'Local Error',
        },
      )

      // read state.data to trigger suspense.
      createRenderEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- trigger suspense
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    await waitFor(() => screen.getByText('Loading...'))
    await waitFor(() => screen.getByText('rendered'))
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = jest.fn<Promise<string>, unknown[]>()
    queryFn.mockImplementation(async () => {
      await sleep(10)
      return '23'
    })

    function Page() {
      const [enabled, setEnabled] = createSignal(false)
      const result = createQuery(() => [key()], queryFn, {
        suspense: true,
        get enabled() {
          return enabled()
        },
      })

      return (
        <div>
          <button onClick={() => setEnabled(true)}>fire</button>
          <h1>{result.data}</h1>
        </div>
      )
    }

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    expect(queryFn).toHaveBeenCalledTimes(0)
    await sleep(5)
    fireEvent.click(screen.getByRole('button', { name: /fire/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading').textContent).toBe('23')
    })

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should error catched in error boundary without infinite loop', async () => {
    const key = queryKey()

    let succeed = true

    function Page() {
      const [nonce] = createSignal(0)
      const queryKeys = () => [`${key()}-${succeed}`]
      const result = createQuery(
        queryKeys,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return nonce()
          }
        },
        {
          retry: false,
          suspense: true,
        },
      )
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // render suspense fallback (Loading...)
    await waitFor(() => screen.getByText('Loading...'))
    // resolve promise -> render Page (rendered)
    await waitFor(() => screen.getByText('rendered'))

    // change query key
    succeed = false
    // reset query -> and throw error
    fireEvent.click(screen.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should error catched in error boundary without infinite loop when query keys changed', async () => {
    let succeed = true

    function Page() {
      const [key, setKey] = createSignal(0)

      const result = createQuery(
        () => [`${key()}-${succeed}`],
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        {
          retry: false,
          suspense: true,
        },
      )
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // render suspense fallback (Loading...)
    await waitFor(() => screen.getByText('Loading...'))
    // resolve promise -> render Page (rendered)
    await waitFor(() => screen.getByText('rendered'))

    // change promise result to error
    succeed = false
    // change query key
    fireEvent.click(screen.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should error catched in error boundary without infinite loop when enabled changed', async () => {
    function Page() {
      const queryKeys = '1'
      const [enabled, setEnabled] = createSignal(false)

      const result = createQuery<string>(
        () => [queryKeys],
        async () => {
          await sleep(10)
          throw new Error('Suspense Error Bingo')
        },
        {
          retry: false,
          suspense: true,
          get enabled() {
            return enabled()
          },
        },
      )
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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    ))

    // render empty data with 'rendered' when enabled is false
    await waitFor(() => screen.getByText('rendered'))

    // change enabled to true
    fireEvent.click(screen.getByLabelText('fail'))

    // render pending fallback
    await waitFor(() => screen.getByText('Loading...'))

    // render error boundary fallback (error boundary)
    await waitFor(() => screen.getByText('error boundary'))
  })

  it('should render the correct amount of times in Suspense mode when cacheTime is set to 0', async () => {
    const key = queryKey()
    let state: CreateQueryResult<number> | null = null

    let count = 0
    let renders = 0

    function Page() {
      state = createQuery(
        key,
        async () => {
          count++
          await sleep(10)
          return count
        },
        { suspense: true, cacheTime: 0 },
      )

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

    render(() => (
      <QueryClientProvider client={queryClient}>
        <Suspense fallback="loading">
          <Page />
        </Suspense>
      </QueryClientProvider>
    ))

    await waitFor(() =>
      expect(state).toMatchObject({
        data: 1,
        status: 'success',
      }),
    )

    expect(renders).toBe(2)
    expect(screen.queryByText('rendered')).not.toBeNull()
  })
})
