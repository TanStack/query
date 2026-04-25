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

describe('useSuspenseQueries', () => {
  let queryClient: QueryClient
  const onSuspend = vi.fn()
  const onQueriesResolution = vi.fn()

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    vi.useRealTimers()
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

  it('should suspend on mount', () => {
    function Page() {
      const queriesResults = useSuspenseQueries(
        {
          queries: [1, 2].map((id) => ({
            queryKey: [id],
            queryFn: () => sleep(1000).then(() => id),
          })),
          combine: (results) => results.map((r) => r.data),
        },
        queryClient,
      )

      React.useEffect(() => {
        onQueriesResolution(queriesResults)
      }, [queriesResults])

      return null
    }

    render(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page />
      </React.Suspense>,
    )

    expect(onSuspend).toHaveBeenCalledOnce()
  })

  it('should resolve queries', async () => {
    function Page() {
      const queriesResults = useSuspenseQueries(
        {
          queries: [1, 2].map((id) => ({
            queryKey: [id],
            queryFn: () => sleep(1000).then(() => id),
          })),
          combine: (results) => results.map((r) => r.data),
        },
        queryClient,
      )

      React.useEffect(() => {
        onQueriesResolution(queriesResults)
      }, [queriesResults])

      return null
    }

    render(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(onQueriesResolution).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenLastCalledWith([1, 2])
  })

  it('should not suspend on mount if query has been already fetched', () => {
    const key = queryKey()
    const queryFn = () => sleep(1000).then(() => 1)

    queryClient.setQueryData(key, queryFn)

    function Page() {
      const queriesResults = useSuspenseQueries(
        {
          queries: [{ queryKey: key, queryFn }],
          combine: (results) => results.map((r) => r.data),
        },
        queryClient,
      )

      React.useEffect(() => {
        onQueriesResolution(queriesResults)
      }, [queriesResults])

      return null
    }

    render(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page />
      </React.Suspense>,
    )

    expect(onSuspend).not.toHaveBeenCalled()
  })

  it('should not break suspense when queries change without resolving', async () => {
    const initQueries = [1, 2].map((id) => ({
      queryKey: [id],
      queryFn: () => sleep(1000).then(() => id),
    }))
    const nextQueries = [3, 4, 5, 6].map((id) => ({
      queryKey: [id],
      queryFn: () => sleep(1000).then(() => id),
    }))

    function Page({
      queries,
    }: {
      queries: Array<UseSuspenseQueryOptions<number>>
    }) {
      const queriesResults = useSuspenseQueries(
        {
          queries,
          combine: (results) => results.map((r) => r.data),
        },
        queryClient,
      )

      React.useEffect(() => {
        onQueriesResolution(queriesResults)
      }, [queriesResults])

      return null
    }

    const { rerender } = render(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page queries={initQueries} />
      </React.Suspense>,
    )

    rerender(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page queries={nextQueries} />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(onSuspend).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenLastCalledWith([3, 4, 5, 6])
  })

  it('should suspend only once per queries change', async () => {
    const initQueries = [1, 2].map((id) => ({
      queryKey: [id],
      queryFn: () => sleep(1000).then(() => id),
    }))
    const nextQueries = [3, 4, 5, 6].map((id) => ({
      queryKey: [id],
      queryFn: () => sleep(1000).then(() => id),
    }))

    function Page({
      queries,
    }: {
      queries: Array<UseSuspenseQueryOptions<number>>
    }) {
      const queriesResults = useSuspenseQueries(
        {
          queries,
          combine: (results) => results.map((r) => r.data),
        },
        queryClient,
      )

      React.useEffect(() => {
        onQueriesResolution(queriesResults)
      }, [queriesResults])

      return null
    }

    const { rerender } = render(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page queries={initQueries} />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(1000))

    rerender(
      <React.Suspense fallback={<SuspenseFallback />}>
        <Page queries={nextQueries} />
      </React.Suspense>,
    )

    await act(() => vi.advanceTimersByTimeAsync(1000))

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

  it('should not call combine while reset queries are pending again', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()
    let shouldError = false

    function Page() {
      const data = useSuspenseQueries({
        queries: [
          {
            queryKey: key,
            queryFn: () =>
              sleep(10).then(() => {
                if (shouldError) {
                  throw new Error('Suspense Error Bingo')
                }

                return 'data'
              }),
            retry: false,
          },
        ],
        combine: (result) => result.map((query) => query.data.toUpperCase()),
      })

      return (
        <div>
          <button
            onClick={() => void queryClient.resetQueries({ queryKey: key })}
          >
            reset
          </button>
          <div>data: {data.join(',')}</div>
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
    expect(rendered.getByText('data: DATA')).toBeInTheDocument()

    shouldError = true

    expect(() => {
      fireEvent.click(rendered.getByText('reset'))
    }).not.toThrow()

    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    expect(consoleMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )

    consoleMock.mockRestore()
  })

  it('should handle duplicate query keys without infinite loops', async () => {
    const key = queryKey()
    const localDuration = 10
    let renderCount = 0

    function getUserData() {
      return {
        queryKey: key,
        queryFn: () =>
          sleep(localDuration).then(() => ({ name: 'John Doe', age: 50 })),
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

    await vi.advanceTimersByTimeAsync(100)

    expect(onQueriesResolution).toHaveBeenCalledTimes(1)
    expect(onQueriesResolution).toHaveBeenLastCalledWith({
      data: 'John Doe',
      data2: 50,
    })

    // With the infinite loop bug, renderCount would be very high (e.g. > 100)
    // Without bug, it should be small (initial suspend + resolution = 2-3)
    expect(renderCount).toBeLessThan(10)
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
      await vi.advanceTimersByTimeAsync(3000)
      expect(queryClient.getQueryData(key)).toBe('data')
      // wait for gc
      await vi.advanceTimersByTimeAsync(1000)
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

  it('should only suspend queries that are pending when the slower query already has data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached')

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(2000).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(1000).then(() => 'data2'),
          },
        ],
      })

      return (
        <div>
          <div>data1: {result1.data}</div>
          <div>data2: {result2.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    // key2 resolves: suspend lifts, key1 shows cached data, key2 shows fresh data
    await act(() => vi.advanceTimersByTimeAsync(1000))

    expect(rendered.getByText('data1: cached')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()

    // key1 stale timer fires, triggering background refetch
    await vi.advanceTimersByTimeAsync(1000)

    // key1 background refetch completes: key1 updates to fresh data
    await vi.advanceTimersByTimeAsync(2000)

    expect(rendered.getByText('data1: data1')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()
  })

  it('should only suspend queries that are pending when the faster query already has data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key2, 'cached')

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(2000).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(1000).then(() => 'data2'),
          },
        ],
      })

      return (
        <div>
          <div>data1: {result1.data}</div>
          <div>data2: {result2.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    // key1 resolves: suspend lifts, key1 shows fresh data, key2 shows cached data
    await act(() => vi.advanceTimersByTimeAsync(2000))

    expect(rendered.getByText('data1: data1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached')).toBeInTheDocument()

    // key2 stale timer fires, triggering background refetch
    await vi.advanceTimersByTimeAsync(1000)

    // key2 background refetch completes: key2 updates to fresh data
    await vi.advanceTimersByTimeAsync(1000)

    expect(rendered.getByText('data1: data1')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()
  })

  it('should not suspend and not refetch when all queries have fresh cached data', () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached1')
    queryClient.setQueryData(key2, 'cached2')

    const queryFn1 = vi.fn(() => sleep(20).then(() => 'data1'))
    const queryFn2 = vi.fn(() => sleep(10).then(() => 'data2'))

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: queryFn1,
          },
          {
            queryKey: key2,
            queryFn: queryFn2,
          },
        ],
      })

      return (
        <div>
          <div>data1: {result1.data}</div>
          <div>data2: {result2.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    // No suspend, fresh cached data shown immediately
    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached2')).toBeInTheDocument()

    // No background refetch because data is still fresh (within staleTime)
    expect(queryFn1).toHaveBeenCalledTimes(0)
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })

  it('should not suspend and only refetch the stale query when one query has fresh and the other has stale cached data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached1')
    queryClient.setQueryData(key2, 'cached2')

    // Advance past staleTime (min 1000ms in suspense) so key2 becomes stale before mount
    vi.advanceTimersByTime(1000)

    // Make key1 fresh again by resetting its data
    queryClient.setQueryData(key1, 'cached1')

    const queryFn1 = vi.fn(() => sleep(20).then(() => 'data1'))

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: queryFn1,
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'data2'),
          },
        ],
      })

      return (
        <div>
          <div>data1: {result1.data}</div>
          <div>data2: {result2.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    // No suspend, cached data shown immediately
    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached2')).toBeInTheDocument()

    // key1 is fresh, no refetch
    expect(queryFn1).toHaveBeenCalledTimes(0)

    // key2 background refetch completes
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()

    // key1 is still fresh, no refetch triggered
    expect(queryFn1).toHaveBeenCalledTimes(0)

    // after key2 refetch completes, key1 is still fresh with no refetch triggered
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()
    expect(queryFn1).toHaveBeenCalledTimes(0)
  })

  it('should not suspend and only refetch the stale query when one query has stale and the other has fresh cached data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached1')
    queryClient.setQueryData(key2, 'cached2')

    // Advance past staleTime (min 1000ms in suspense) so key1 becomes stale before mount
    vi.advanceTimersByTime(1000)

    // Make key2 fresh again by resetting its data
    queryClient.setQueryData(key2, 'cached2')

    const queryFn2 = vi.fn(() => sleep(20).then(() => 'data2'))

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(10).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: queryFn2,
          },
        ],
      })

      return (
        <div>
          <div>data1: {result1.data}</div>
          <div>data2: {result2.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    // No suspend, cached data shown immediately
    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached2')).toBeInTheDocument()

    // key2 is fresh, no refetch
    expect(queryFn2).toHaveBeenCalledTimes(0)

    // key1 background refetch completes
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('data1: data1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached2')).toBeInTheDocument()

    // key2 is still fresh, no refetch triggered
    expect(queryFn2).toHaveBeenCalledTimes(0)

    // after key1 refetch completes, key2 is still fresh with no refetch triggered
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('data1: data1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached2')).toBeInTheDocument()
    expect(queryFn2).toHaveBeenCalledTimes(0)
  })

  it('should not suspend but refetch when all queries have stale cached data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached1')
    queryClient.setQueryData(key2, 'cached2')

    // Advance past staleTime (min 1000ms in suspense) so data becomes stale before mount
    vi.advanceTimersByTime(1000)

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(20).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(10).then(() => 'data2'),
          },
        ],
      })

      return (
        <div>
          <div>data1: {result1.data}</div>
          <div>data2: {result2.data}</div>
        </div>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback={<div>loading</div>}>
        <Page />
      </React.Suspense>,
    )

    // No suspend, stale cached data shown immediately with background refetch started
    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: cached2')).toBeInTheDocument()

    // key2 background refetch completes
    await vi.advanceTimersByTimeAsync(11)

    expect(rendered.getByText('data1: cached1')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()

    // key1 background refetch completes
    await vi.advanceTimersByTimeAsync(10)

    expect(rendered.getByText('data1: data1')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()
  })
})
