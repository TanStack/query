import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useSuspenseQueries, useSuspenseQuery } from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'
import type { UseSuspenseQueryOptions } from '..'

type NumberQueryOptions = UseSuspenseQueryOptions<number>

const QUERY_DURATION = 1000

const createQuery: (id: number) => NumberQueryOptions = (id) => ({
  queryKey: [id],
  queryFn: async () => {
    await sleep(QUERY_DURATION)
    return id
  },
})
const resolveQueries = () => vi.advanceTimersByTimeAsync(QUERY_DURATION)

const queryClient = createQueryClient()

describe('useSuspenseQueries', () => {
  const onSuspend = vi.fn()
  const onQueriesResolution = vi.fn()

  beforeAll(() => {
    vi.useFakeTimers()
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  afterEach(() => {
    queryClient.clear()
    onSuspend.mockClear()
    onQueriesResolution.mockClear()
  })

  function SuspenseFallback() {
    React.useEffect(() => {
      onSuspend()
    }, [])

    return null
  }

  const withSuspenseWrapper = <T extends object>(Component: React.FC<T>) => {
    function SuspendedComponent(props: T) {
      return (
        <React.Suspense fallback={<SuspenseFallback />}>
          <Component {...props} />
        </React.Suspense>
      )
    }

    return SuspendedComponent
  }

  function QueriesContainer({
    queries,
  }: {
    queries: Array<NumberQueryOptions>
  }) {
    const queriesResults = useSuspenseQueries(
      { queries, combine: (results) => results.map((r) => r.data) },
      queryClient,
    )

    React.useEffect(() => {
      onQueriesResolution(queriesResults)
    }, [queriesResults])

    return null
  }

  const TestComponent = withSuspenseWrapper(QueriesContainer)

  it('should suspend on mount', () => {
    render(<TestComponent queries={[1, 2].map(createQuery)} />)

    expect(onSuspend).toHaveBeenCalledOnce()
  })

  it('should resolve queries', async () => {
    render(<TestComponent queries={[1, 2].map(createQuery)} />)

    await act(resolveQueries)

    expect(onQueriesResolution).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenLastCalledWith([1, 2])
  })

  it('should not suspend on mount if query has been already fetched', () => {
    const query = createQuery(1)

    queryClient.setQueryData(query.queryKey, query.queryFn)

    render(<TestComponent queries={[query]} />)

    expect(onSuspend).not.toHaveBeenCalled()
  })

  it('should not break suspense when queries change without resolving', async () => {
    const initQueries = [1, 2].map(createQuery)
    const nextQueries = [3, 4, 5, 6].map(createQuery)

    const { rerender } = render(<TestComponent queries={initQueries} />)

    rerender(<TestComponent queries={nextQueries} />)

    await act(resolveQueries)

    expect(onSuspend).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenLastCalledWith([3, 4, 5, 6])
  })

  it('should suspend only once per queries change', async () => {
    const initQueries = [1, 2].map(createQuery)
    const nextQueries = [3, 4, 5, 6].map(createQuery)

    const { rerender } = render(<TestComponent queries={initQueries} />)

    await act(resolveQueries)

    rerender(<TestComponent queries={nextQueries} />)

    await act(resolveQueries)

    expect(onSuspend).toHaveBeenCalledTimes(2)
    expect(onQueriesResolution).toHaveBeenCalledTimes(2)
    expect(onQueriesResolution).toHaveBeenLastCalledWith([3, 4, 5, 6])
  })

  it('should only call combine after resolving', async () => {
    const spy = vi.fn()
    const key = queryKey()

    function Page() {
      const data = useSuspenseQueries({
        queries: [1, 2, 3].map((value) => ({
          queryKey: [...key, { value }],
          queryFn: async () => {
            await sleep(value * 10)
            return { value: value * 10 }
          },
        })),
        combine: (result) => {
          spy(result)
          return 'data'
        },
      })

      return <h1>{data}</h1>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="loading...">
        <Page />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(10))

    rendered.getByText('loading...')

    expect(spy).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(30))
    rendered.getByText('data')

    expect(spy).toHaveBeenCalled()
  })
})

describe('useSuspenseQueries 2', () => {
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

    expect(consoleMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
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

  it('should still suspense if queryClient has placeholderData config', async () => {
    const key = queryKey()
    const queryClientWithPlaceholder = createQueryClient({
      defaultOptions: {
        queries: {
          placeholderData: (previousData: any) => previousData,
        },
      },
    })

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
      queryClientWithPlaceholder,
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

  it('should show error boundary even with gcTime:0 (#7853)', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()
    let count = 0

    function Page() {
      useSuspenseQuery({
        queryKey: key,
        queryFn: async () => {
          count++
          console.log('queryFn')
          throw new Error('Query failed')
        },
        gcTime: 0,
        retry: false,
      })

      return null
    }

    function App() {
      return (
        <React.Suspense fallback="loading">
          <ErrorBoundary
            fallbackRender={() => {
              return <div>There was an error!</div>
            }}
          >
            <Page />
          </ErrorBoundary>
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() => rendered.getByText('There was an error!'))
    expect(count).toBe(1)
    consoleMock.mockRestore()
  })

  describe('gc (with fake timers)', () => {
    beforeAll(() => {
      vi.useFakeTimers()
    })

    afterAll(() => {
      vi.useRealTimers()
    })

    it('should gc when unmounted while fetching with low gcTime (#8159)', async () => {
      const key = queryKey()

      function Page() {
        return (
          <React.Suspense fallback="loading">
            <Component />
          </React.Suspense>
        )
      }

      function Component() {
        const { data } = useSuspenseQuery({
          queryKey: key,
          queryFn: async () => {
            await sleep(3000)
            return 'data'
          },
          gcTime: 1000,
        })

        return <div>{data}</div>
      }

      function Page2() {
        return <div>page2</div>
      }

      function App() {
        const [show, setShow] = React.useState(true)
        return (
          <div>
            {show ? <Page /> : <Page2 />}
            <button onClick={() => setShow(false)}>hide</button>
          </div>
        )
      }

      const rendered = renderWithClient(queryClient, <App />)

      await act(() => vi.advanceTimersByTimeAsync(200))

      rendered.getByText('loading')

      // unmount while still fetching
      fireEvent.click(rendered.getByText('hide'))

      await act(() => vi.advanceTimersByTimeAsync(800))

      rendered.getByText('page2')

      // wait for query to be resolved
      await act(() => vi.advanceTimersByTimeAsync(2000))

      expect(queryClient.getQueryData(key)).toBe('data')

      // wait for gc
      await act(() => vi.advanceTimersByTimeAsync(1000))

      expect(queryClient.getQueryData(key)).toBe(undefined)
    })
  })
})
