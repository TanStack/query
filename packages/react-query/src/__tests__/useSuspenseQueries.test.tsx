import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { act, fireEvent, render } from '@testing-library/react'
import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  skipToken,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type { UseSuspenseQueryOptions } from '..'

type NumberQueryOptions = UseSuspenseQueryOptions<number>

const QUERY_DURATION = 1000

const createQuery: (id: number) => NumberQueryOptions = (id) => ({
  queryKey: [id],
  queryFn: () => sleep(QUERY_DURATION).then(() => id),
})
const resolveQueries = () => vi.advanceTimersByTimeAsync(QUERY_DURATION)

const queryClient = new QueryClient()

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

    return <div>loading</div>
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
          queryFn: () => sleep(value * 10).then(() => ({ value: value * 10 })),
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
      <React.Suspense fallback="loading">
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    expect(spy).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(30))
    expect(rendered.getByText('data')).toBeInTheDocument()

    expect(spy).toHaveBeenCalled()
  })

  it('should handle duplicate query keys without infinite loops', async () => {
    const key = queryKey()
    const localDuration = 10
    let renderCount = 0

    function getUserData() {
      return {
        queryKey: key,
        queryFn: async () => {
          await sleep(localDuration)
          return { name: 'John Doe', age: 50 }
        },
      }
    }

    function getName() {
      return {
        ...getUserData(),
        select: (data: any) => data.name,
      }
    }

    function getAge() {
      return {
        ...getUserData(),
        select: (data: any) => data.age,
      }
    }

    function App() {
      renderCount++
      const [{ data }, { data: data2 }] = useSuspenseQueries({
        queries: [getName(), getAge()],
      })

      React.useEffect(() => {
        onQueriesResolution({ data, data2 })
      }, [data, data2])

      return (
        <div>
          <h1>Data</h1>
          {JSON.stringify({ data }, null, 2)}
          {JSON.stringify({ data2 }, null, 2)}
        </div>
      )
    }

    renderWithClient(
      queryClient,
      <React.Suspense fallback={<SuspenseFallback />}>
        <App />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(localDuration))

    expect(onSuspend).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenCalledTimes(1)

    await act(() => vi.advanceTimersByTimeAsync(100))

    expect(onQueriesResolution).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenLastCalledWith({
      data: 'John Doe',
      data2: 50,
    })

    // With the infinite loop bug, renderCount would be very high (e.g. > 100)
    // Without bug, it should be small (initial suspend + resolution = 2-3)
    expect(renderCount).toBeLessThan(10)
  })
})

describe('useSuspenseQueries 2', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(20))
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

    expect(results).toEqual(['loading', '1', '2'])
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
      // eslint-disable-next-line react-hooks/purity
      const ref = React.useRef(Math.random())
      const result = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () =>
              sleep(10).then(() => {
                refs.push(ref.current)
                results.push('1')
                return '1'
              }),
          },
          {
            queryKey: key2,
            queryFn: () =>
              sleep(20).then(() => {
                refs.push(ref.current)
                results.push('2')
                return '2'
              }),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(20))
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

    expect(refs.length).toBe(2)
    expect(refs[0]).toBe(refs[1])
  })

  // this addresses the following issue:
  // https://github.com/TanStack/query/issues/6344
  it('should suspend on offline when query changes, and data should not be undefined', async () => {
    function Page() {
      const [id, setId] = React.useState(0)

      const { data } = useSuspenseQuery({
        queryKey: [id],
        queryFn: () => sleep(10).then(() => `Data ${id}`),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('Data 0')).toBeInTheDocument()

    // go offline
    document.dispatchEvent(new CustomEvent('offline'))

    fireEvent.click(rendered.getByText('fetch'))
    expect(rendered.getByText('Data 0')).toBeInTheDocument()

    // go back online
    document.dispatchEvent(new CustomEvent('online'))

    fireEvent.click(rendered.getByText('fetch'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    // query should resume
    expect(rendered.getByText('Data 1')).toBeInTheDocument()
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
        queryFn: () =>
          sleep(10).then(() => {
            if (fail) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retry: 0,
      })

      return (
        <div>
          <button onClick={() => setFail(true)}>trigger fail</button>
          <div>rendered: {data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
        <React.Suspense fallback="loading">
          <Page />
        </React.Suspense>
      </ErrorBoundary>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('rendered: data')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('trigger fail'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

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
        queryFn: () => sleep(10).then(() => 'data' + count),
      })

      return (
        <div>
          <button onClick={() => startTransition(() => setCount(count + 1))}>
            inc
          </button>

          <div>{isPending ? 'pending' : data}</div>
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
    expect(rendered.getByText('data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    expect(rendered.getByText('pending')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data1')).toBeInTheDocument()
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
          <React.Suspense fallback="loading">
            <Page count={count} />
          </React.Suspense>
        </div>
      )
    }

    function Page({ count }: { count: number }) {
      const { data } = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: () =>
          sleep(10).then(() => {
            queryFnCount++
            return 'data' + count
          }),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data1')).toBeInTheDocument()

    expect(queryFnCount).toBe(2)
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
      const [count, setCount] = React.useState(0)
      const [isPending, startTransition] = React.useTransition()
      const { data } = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: () => sleep(10).then(() => 'data' + count),
      })

      return (
        <div>
          <button onClick={() => startTransition(() => setCount(count + 1))}>
            inc
          </button>
          <div>{isPending ? 'pending' : data}</div>
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
    expect(rendered.getByText('data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    expect(rendered.getByText('pending')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data1')).toBeInTheDocument()
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
        queryFn: () =>
          sleep(10).then(() => {
            count++
            throw new Error('Query failed')
          }),
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

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('There was an error!')).toBeInTheDocument()

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
          queryFn: () => sleep(3000).then(() => 'data'),
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

      expect(rendered.getByText('loading')).toBeInTheDocument()

      fireEvent.click(rendered.getByText('hide'))
      expect(rendered.getByText('page2')).toBeInTheDocument()
      // wait for query to be resolved
      await act(() => vi.advanceTimersByTimeAsync(3000))
      expect(queryClient.getQueryData(key)).toBe('data')
      // wait for gc
      await act(() => vi.advanceTimersByTimeAsync(1000))
      expect(queryClient.getQueryData(key)).toBe(undefined)
    })
  })

  it('should log an error when skipToken is passed as queryFn', () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})
    const key = queryKey()

    function Page() {
      useSuspenseQueries({
        queries: [
          {
            queryKey: key,
            // @ts-expect-error
            // eslint-disable-next-line react-hooks/purity
            queryFn: Math.random() >= 0 ? skipToken : () => Promise.resolve(5),
          },
        ],
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
      'skipToken is not allowed for useSuspenseQueries',
    )
    consoleErrorSpy.mockRestore()
  })

  it('should log an error when skipToken is used in development environment', () => {
    const envCopy = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page() {
      useSuspenseQueries({
        queries: [
          {
            queryKey: key,
            queryFn: skipToken as any,
          },
        ],
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
      'skipToken is not allowed for useSuspenseQueries',
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
      useSuspenseQueries({
        queries: [
          {
            queryKey: key,
            queryFn: skipToken as any,
          },
        ],
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
