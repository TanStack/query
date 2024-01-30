import { describe, expect, it, vi } from 'vitest'
import { fireEvent, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import {
  QueryCache,
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
  useSuspenseInfiniteQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'
import type {
  InfiniteData,
  UseSuspenseInfiniteQueryResult,
  UseSuspenseQueryResult,
} from '..'

describe('useSuspenseQuery', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

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
        queryFn: async () => {
          count++
          await sleep(10)
          return count
        },
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
    const states: Array<UseSuspenseInfiniteQueryResult<InfiniteData<number>>> =
      []

    function Page() {
      const [multiplier, setMultiplier] = React.useState(1)
      const state = useSuspenseInfiniteQuery({
        queryKey: [`${key}_${multiplier}`],
        queryFn: async ({ pageParam }) => {
          await sleep(10)
          return Number(pageParam * multiplier)
        },
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

    await waitFor(() => rendered.getByText('data: 1'))

    expect(states.length).toBe(1)
    expect(states[0]).toMatchObject({
      data: { pages: [1], pageParams: [1] },
      status: 'success',
    })

    fireEvent.click(rendered.getByText('next'))
    await waitFor(() => rendered.getByText('data: 2'))

    expect(states.length).toBe(2)
    expect(states[1]).toMatchObject({
      data: { pages: [2], pageParams: [1] },
      status: 'success',
    })
  })

  it('should not call the queryFn twice when used in Suspense mode', async () => {
    const key = queryKey()

    const queryFn = vi.fn<Array<unknown>, string>()
    queryFn.mockImplementation(() => {
      sleep(10)
      return 'data'
    })

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

    await waitFor(() => rendered.getByText('rendered'))

    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should remove query instance when component unmounted', async () => {
    const key = queryKey()

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: () => {
          sleep(10)
          return 'data'
        },
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

    expect(rendered.queryByText('rendered')).toBeNull()
    expect(queryCache.find({ queryKey: key })).toBeFalsy()

    fireEvent.click(rendered.getByLabelText('toggle'))
    await waitFor(() => rendered.getByText('rendered'))

    expect(queryCache.find({ queryKey: key })?.getObserversCount()).toBe(1)

    fireEvent.click(rendered.getByLabelText('toggle'))

    expect(rendered.queryByText('rendered')).toBeNull()
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
        queryFn: async () => {
          await sleep(10)

          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
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

    expect(consoleMock).toHaveBeenCalledWith(
      expect.objectContaining(new Error('Suspense Error Bingo')),
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
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
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
    consoleMock.mockRestore()
  })

  it('should refetch when re-mounting', async () => {
    const key = queryKey()
    let count = 0

    function Component() {
      const result = useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
          await sleep(100)
          count++
          return count
        },
        retry: false,
        staleTime: 0,
      })
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
      const result = useSuspenseQuery({
        queryKey: props.queryKey,
        queryFn: async () => {
          await sleep(100)
          return props.queryKey
        },

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
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
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
        queryFn: async (): Promise<unknown> => {
          await sleep(10)
          throw new Error('Suspense Error a1x')
        },
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
          <React.Suspense fallback="Loading...">
            <Page />
          </React.Suspense>
        </ErrorBoundary>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('Loading...'))
    await waitFor(() => rendered.getByText('error boundary'))
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
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return nonce
          }
        },
        retry: false,
      })
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
    expect(consoleMock).toHaveBeenCalledWith(
      expect.objectContaining(new Error('Suspense Error Bingo')),
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
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
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
    expect(consoleMock).toHaveBeenCalledWith(
      expect.objectContaining(new Error('Suspense Error Bingo')),
    )

    consoleMock.mockRestore()
  })

  it('should render the correct amount of times in Suspense mode when gcTime is set to 0', async () => {
    const key = queryKey()
    let state: UseSuspenseQueryResult<number> | null = null

    let count = 0
    let renders = 0

    function Page() {
      renders++

      state = useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
          count++
          await sleep(10)
          return count
        },
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

    await waitFor(() =>
      expect(state).toMatchObject({
        data: 1,
        status: 'success',
      }),
    )

    expect(renders).toBe(2)
    expect(rendered.queryByText('rendered')).not.toBeNull()
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
        queryFn: async () => {
          await sleep(10)
          if (!succeed) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
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
    await waitFor(() => rendered.getByText('rendered data success'))

    // change promise result to error
    succeed = false
    // refetch
    fireEvent.click(rendered.getByRole('button', { name: 'refetch' }))
    // we are now in error state but still have data to show
    await waitFor(() => rendered.getByText('rendered data error'))

    consoleMock.mockRestore()
  })
})

describe('useSuspenseQueries', () => {
  const queryClient = createQueryClient()
  it('should suspend all queries in parallel', async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<string> = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const result = useSuspenseQueries({
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
          <h1>data: {result.map((item) => item.data ?? 'null').join(',')}</h1>
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

  it("shouldn't unmount before all promises fetched", async () => {
    const key1 = queryKey()
    const key2 = queryKey()
    const results: Array<string> = []
    const refs: Array<number> = []

    function Fallback() {
      results.push('loading')
      return <div>loading</div>
    }

    function Page() {
      const ref = React.useRef(Math.random())
      const result = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: async () => {
              refs.push(ref.current)
              results.push('1')
              await sleep(10)
              return '1'
            },
          },
          {
            queryKey: key2,
            queryFn: async () => {
              refs.push(ref.current)
              results.push('2')
              await sleep(20)
              return '2'
            },
          },
        ],
      })
      return (
        <div>
          <h1>data: {result.map((item) => item.data ?? 'null').join(',')}</h1>
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

  // this addresses the following issue:
  // https://github.com/TanStack/query/issues/6344
  it('should suspend on offline when query changes, and data should not be undefined', async () => {
    function Page() {
      const [id, setId] = React.useState(0)

      const { data } = useSuspenseQuery({
        queryKey: [id],
        queryFn: () => Promise.resolve(`Data ${id}`),
      })

      // defensive guard here
      if (data === undefined) {
        throw new Error('data cannot be undefined')
      }

      return (
        <>
          <div>{data}</div>
          <button onClick={() => setId(id + 1)}>fetch</button>
        </>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('loading'))
    await waitFor(() => rendered.getByText('Data 0'))

    // go offline
    document.dispatchEvent(new CustomEvent('offline'))

    fireEvent.click(rendered.getByText('fetch'))
    await waitFor(() => rendered.getByText('Data 0'))

    // go back online
    document.dispatchEvent(new CustomEvent('online'))
    fireEvent.click(rendered.getByText('fetch'))

    // query should resume
    await waitFor(() => rendered.getByText('Data 1'))
  })

  it('should throw error when queryKey changes and new query fails', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      const [fail, setFail] = React.useState(false)
      const { data } = useSuspenseQuery({
        queryKey: [key, fail],
        queryFn: async () => {
          await sleep(10)

          if (fail) {
            throw new Error('Suspense Error Bingo')
          } else {
            return 'data'
          }
        },
        retry: 0,
      })

      return (
        <div>
          <button onClick={() => setFail(true)}>trigger fail</button>

          <div>rendered: {String(data)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
        <React.Suspense fallback={'Loading...'}>
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )

    await waitFor(() => rendered.getByText('Loading...'))

    await waitFor(() => rendered.getByText('rendered: data'))

    fireEvent.click(rendered.getByText('trigger fail'))

    await waitFor(() => rendered.getByText('error boundary'))

    expect(consoleMock).toHaveBeenCalledWith(
      expect.objectContaining(new Error('Suspense Error Bingo')),
    )

    consoleMock.mockRestore()
  })

  it('should keep previous data when wrapped in a transition', async () => {
    const key = queryKey()

    function Page() {
      const [count, setCount] = React.useState(0)
      const [isPending, startTransition] = React.useTransition()
      const { data } = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: async () => {
          await sleep(10)
          return 'data' + count
        },
      })

      return (
        <div>
          <button onClick={() => startTransition(() => setCount(count + 1))}>
            inc
          </button>

          <div>{isPending ? 'Pending...' : String(data)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={'Loading...'}>
        <Page />
      </React.Suspense>,
    )

    await waitFor(() => rendered.getByText('Loading...'))

    await waitFor(() => rendered.getByText('data0'))

    fireEvent.click(rendered.getByText('inc'))

    await waitFor(() => rendered.getByText('Pending...'))

    await waitFor(() => rendered.getByText('data1'))
  })

  it('should not request old data inside transitions (issue #6486)', async () => {
    const key = queryKey()
    let queryFnCount = 0

    function App() {
      const [count, setCount] = React.useState(0)

      return (
        <div>
          <button
            onClick={() => React.startTransition(() => setCount(count + 1))}
          >
            inc
          </button>
          <React.Suspense fallback={'Loading...'}>
            <Page count={count} />
          </React.Suspense>
        </div>
      )
    }

    function Page({ count }: { count: number }) {
      const { data } = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: async () => {
          queryFnCount++
          await sleep(10)
          return 'data' + count
        },
      })

      return (
        <div>
          <div>{String(data)}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,

      <App />,
    )

    await waitFor(() => rendered.getByText('Loading...'))

    await waitFor(() => rendered.getByText('data0'))

    fireEvent.click(rendered.getByText('inc'))

    await waitFor(() => rendered.getByText('data1'))

    await sleep(20)

    expect(queryFnCount).toBe(2)
  })
})
