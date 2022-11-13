import { fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import type { UseInfiniteQueryResult, UseQueryResult } from '..'
import {
  QueryCache,
  QueryErrorResetBoundary,
  useInfiniteQuery,
  useQueries,
  useQuery,
  useQueryErrorResetBoundary,
} from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

describe("useQuery's in Suspense mode", () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  it('should render the correct amount of times in Suspense mode', async () => {
    const key = queryKey()
    const states: UseQueryResult<number>[] = []

    let count = 0
    let renders = 0

    function Page() {
      renders++

      const [stateKey, setStateKey] = React.useState(key)

      const state = useQuery(
        stateKey,
        async () => {
          count++
          await sleep(10)
          return count
        },
        { suspense: true },
      )

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

    await waitFor(() => rendered.getByText('data: 1'))
    fireEvent.click(rendered.getByLabelText('toggle'))

    await waitFor(() => rendered.getByText('data: 2'))

    expect(renders).toBe(4)
    expect(states.length).toBe(2)
    expect(states[0]).toMatchObject({ data: 1, status: 'success' })
    expect(states[1]).toMatchObject({ data: 2, status: 'success' })
  })

  it('should return the correct states for a successful infinite query', async () => {
    const key = queryKey()
    const states: UseInfiniteQueryResult<number>[] = []

    function Page() {
      const [multiplier, setMultiplier] = React.useState(1)
      const state = useInfiniteQuery(
        [`${key}_${multiplier}`],
        async ({ pageParam = 1 }) => {
          await sleep(10)
          return Number(pageParam * multiplier)
        },
        {
          suspense: true,
          getNextPageParam: (lastPage) => lastPage + 1,
        },
      )
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

    await waitFor(() => rendered.getByText('data: 1'))

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [undefined] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    await waitFor(() => rendered.getByText('data: 2'))

    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
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
      useQuery([key], queryFn, { suspense: true })

      return <>rendered</>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      useQuery(
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

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find(key)).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await waitFor(() => rendered.getByText('rendered'))

    expect(queryCache.find(key)?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find(key)?.getObserversCount()).toBe(0)
  })

  it('should call onSuccess on the first successful call', async () => {
    const key = queryKey()

    const successFn = jest.fn()

    function Page() {
      useQuery(
        [key],
        async () => {
          await sleep(10)
          return key
        },
        {
          suspense: true,
          select: () => 'selected',
          onSuccess: successFn,
        },
      )

      return <>rendered</>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('rendered'))

    await waitFor(() => expect(successFn).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(successFn).toHaveBeenCalledWith('selected'))
  })

  it('should call every onSuccess handler within a suspense boundary', async () => {
    const key = queryKey()

    const successFn1 = jest.fn()
    const successFn2 = jest.fn()

    function FirstComponent() {
      useQuery(
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
      useQuery(
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

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <FirstComponent />
        <SecondComponent />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('second'))

    await waitFor(() => expect(successFn1).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(successFn2).toHaveBeenCalledTimes(1))
  })

  // https://github.com/tannerlinsley/react-query/issues/468
  it('should reset error state if new component instances are mounted', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      useQuery(
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
            <React.Suspense fallback={'Loading...'}>
              <Page />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => rendered.getByText('Loading...'))

    await waitFor(() => rendered.getByText('error boundary'))

    await waitFor(() => rendered.getByText('retry'))

    fireEvent.click(rendered.getByText('retry'))

    await waitFor(() => rendered.getByText('rendered'))
  })

  it('should retry fetch if the reset error boundary has been reset', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      useQuery(
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
            <React.Suspense fallback="Loading...">
              <Page />
            </React.Suspense>
          </ErrorBoundary>
        )}
      </QueryErrorResetBoundary>,
    )

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('rendered'))
  })

  it('should refetch when re-mounting', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = useQuery(
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
      const [show, setShow] = React.useState(true)
      return (
        <div>
          <button
            onClick={() => {
              setShow(!show)
            }}
          >
            {show ? 'hide' : 'show'}
          </button>
          <React.Suspense fallback="Loading...">
            {show && <Component />}
          </React.Suspense>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('data: 1'))
    await waitFor(() => rendered.getByText('fetching: false'))
    await waitFor(() => rendered.getByText('hide'))
    fireEvent.click(rendered.getByText('hide'))
    await waitFor(() => rendered.getByText('show'))
    fireEvent.click(rendered.getByText('show'))
    await waitFor(() => rendered.getByText('fetching: true'))
    await waitFor(() => rendered.getByText('data: 2'))
    await waitFor(() => rendered.getByText('fetching: false'))
  })

  it('should suspend when switching to a new query', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    function Component(props: { queryKey: Array<string> }) {
      const result = useQuery(
        props.queryKey,
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
          <React.Suspense fallback="Loading...">
            <Component queryKey={key} />
          </React.Suspense>
        </div>
      )
    }

    const rendered = renderWithClient(queryClient, <Page />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText(`data: ${key1}`))
    fireEvent.click(rendered.getByText('switch'))
    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText(`data: ${key2}`))
    expect(
      // @ts-expect-error
      queryClient.getQueryCache().find(key2)!.observers[0].listeners.length,
    ).toBe(1)
  })

  it('should retry fetch if the reset error boundary has been reset with global hook', async () => {
    const key = queryKey()

    let succeed = false

    function Page() {
      useQuery(
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('error boundary'))
    await waitFor(() => rendered.getByText('retry'))
    succeed = true
    fireEvent.click(rendered.getByText('retry'))
    await waitFor(() => rendered.getByText('rendered'))
  })

  it('should throw errors to the error boundary by default', async () => {
    const key = queryKey()

    function Page() {
      useQuery(
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
  })

  it('should not throw errors to the error boundary when useErrorBoundary: false', async () => {
    const key = queryKey()

    function Page() {
      useQuery(
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('rendered'))
  })

  it('should not throw errors to the error boundary when a useErrorBoundary function returns true', async () => {
    const key = queryKey()

    function Page() {
      useQuery(
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
  })

  it('should not throw errors to the error boundary when a useErrorBoundary function returns false', async () => {
    const key = queryKey()

    function Page() {
      useQuery(
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('rendered'))
  })

  it('should not call the queryFn when not enabled', async () => {
    const key = queryKey()

    const queryFn = jest.fn<Promise<string>, unknown[]>()
    queryFn.mockImplementation(async () => {
      await sleep(10)
      return '23'
    })

    function Page() {
      const [enabled, setEnabled] = React.useState(false)
      const result = useQuery([key], queryFn, { suspense: true, enabled })

      return (
        <div>
          <button onClick={() => setEnabled(true)}>fire</button>
          <h1>{result.data}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(queryFn).toHaveBeenCalledTimes(0)

    fireEvent.click(rendered.getByRole('button', { name: /fire/i }))

    await waitFor(() => {
      expect(rendered.getByRole('heading').textContent).toBe('23')
    })

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should error catched in error boundary without infinite loop', async () => {
    const key = queryKey()

    let succeed = true

    function Page() {
      const [nonce] = React.useState(0)
      const queryKeys = [`${key}-${succeed}`]
      const result = useQuery(
        queryKeys,
        async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return nonce
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
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={() => <div>error boundary</div>}
        >
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // render suspense fallback (Loading...)
    await waitFor(() => rendered.getByText('Loading...'))
    // resolve promise -> render Page (rendered)
    await waitFor(() => rendered.getByText('rendered'))

    // change query key
    succeed = false
    // reset query -> and throw error
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await waitFor(() => rendered.getByText('error boundary'))
  })

  it('should error catched in error boundary without infinite loop when query keys changed', async () => {
    let succeed = true

    function Page() {
      const [key, rerender] = React.useReducer((x) => x + 1, 0)
      const queryKeys = [key, succeed]

      const result = useQuery(
        queryKeys,
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // render suspense fallback (Loading...)
    await waitFor(() => rendered.getByText('Loading...'))
    // resolve promise -> render Page (rendered)
    await waitFor(() => rendered.getByText('rendered'))

    // change promise result to error
    succeed = false
    // change query key
    fireEvent.click(rendered.getByLabelText('fail'))
    // render error boundary fallback (error boundary)
    await waitFor(() => rendered.getByText('error boundary'))
  })

  it('should error catched in error boundary without infinite loop when enabled changed', async () => {
    function Page() {
      const queryKeys = '1'
      const [enabled, setEnabled] = React.useState(false)

      const result = useQuery<string>(
        [queryKeys],
        async () => {
          await sleep(10)
          throw new Error('Suspense Error Bingo')
        },
        {
          retry: false,
          suspense: true,
          enabled,
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
      const { reset } = useQueryErrorResetBoundary()
      return (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={() => <div>error boundary</div>}
        >
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    // render empty data with 'rendered' when enabled is false
    await waitFor(() => rendered.getByText('rendered'))

    // change enabled to true
    fireEvent.click(rendered.getByLabelText('fail'))

    // render pending fallback
    await waitFor(() => rendered.getByText('Loading...'))

    // render error boundary fallback (error boundary)
    await waitFor(() => rendered.getByText('error boundary'))
  })

  it('should render the correct amount of times in Suspense mode when cacheTime is set to 0', async () => {
    const key = queryKey()
    let state: UseQueryResult<number> | null = null

    let count = 0
    let renders = 0

    function Page() {
      renders++

      state = useQuery(
        key,
        async () => {
          count++
          await sleep(10)
          return count
        },
        { suspense: true, cacheTime: 0 },
      )

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

    await waitFor(() =>
      expect(state).toMatchObject({
        data: 1,
        status: 'success',
      }),
    )

    expect(renders).toBe(2)
    expect(rendered.queryByText('rendered')).not.toBeNull()
  })
})

describe('useQueries with suspense', () => {
  const queryClient = createQueryClient()
  it('should suspend all queries in parallel', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: string[] = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              results.push('1')
              await sleep(10)
              return '1'
            },
            suspense: true,
          },
          {
            queryKey: key2,
            queryFn: async () => {
              results.push('2')
              await sleep(20)
              return '2'
            },
            suspense: true,
          },
        ],
      })
      return (
        <div>
          <h1>data: {result.map((it) => it.data ?? 'null').join(',')}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<Fallback />}>
        <Page />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('data: 1,2'))

    expect(results).toEqual(['1', '2', 'loading'])
  })

  it('should allow to mix suspense with non-suspense', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: string[] = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              results.push('1')
              await sleep(10)
              return '1'
            },
            suspense: true,
          },
          {
            queryKey: key2,
            queryFn: async () => {
              results.push('2')
              await sleep(20)
              return '2'
            },
            suspense: false,
          },
        ],
      })
      return (
        <div>
          <h1>data: {result.map((it) => it.data ?? 'null').join(',')}</h1>
          <h2>status: {result.map((it) => it.status).join(',')}</h2>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<Fallback />}>
        <Page />
      </React.Suspense>,
    )
    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('status: success,loading'))
    await waitFor(() => rendered.getByText('data: 1,null'))
    await waitFor(() => rendered.getByText('data: 1,2'))

    expect(results).toEqual(['1', '2', 'loading'])
  })

  it("shouldn't unmount before all promises fetched", async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: string[] = []
    const refs: number[] = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const ref = React.useRef(Math.random())
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              refs.push(ref.current)
              results.push('1')
              await sleep(10)
              return '1'
            },
            suspense: true,
          },
          {
            queryKey: key2,
            queryFn: async () => {
              refs.push(ref.current)
              results.push('2')
              await sleep(20)
              return '2'
            },
            suspense: true,
          },
        ],
      })
      return (
        <div>
          <h1>data: {result.map((it) => it.data ?? 'null').join(',')}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<Fallback />}>
        <Page />
      </React.Suspense>,
    )
    await waitFor(() => rendered.getByText('loading'))
    expect(refs.length).toBe(2)
    await waitFor(() => rendered.getByText('data: 1,2'))
    expect(refs[0]).toBe(refs[1])
  })

  it('should suspend all queries in parallel - global configuration', async () => {
    const queryClientSuspenseMode = createQueryClient({
      defaultOptions: {
        queries: {
          suspense: true,
        },
      },
    })
    const key1 = queryKey()
    const key2 = queryKey()
    const results: string[] = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const result = useQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              results.push('1')
              await sleep(10)
              return '1'
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              results.push('2')
              await sleep(20)
              return '2'
            },
          },
        ],
      })
      return (
        <div>
          <h1>data: {result.map((it) => it.data ?? 'null').join(',')}</h1>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClientSuspenseMode,
      <React.Suspense fallback={<Fallback />}>
        <Page />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('data: 1,2'))

    expect(results).toEqual(['1', '2', 'loading'])
  })
})
