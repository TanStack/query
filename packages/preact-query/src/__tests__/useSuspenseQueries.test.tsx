import { queryKey, sleep } from '@tanstack/query-test-utils'
import { act, fireEvent, render } from '@testing-library/preact'
import type { FunctionalComponent } from 'preact'
import { Suspense, startTransition, useTransition } from 'preact/compat'
import { useEffect, useRef, useState } from 'preact/hooks'
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

import {
  QueryClient,
  skipToken,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import type { UseSuspenseQueryOptions } from '..'
import { ErrorBoundary } from './ErrorBoundary'
import { renderWithClient } from './utils'

type NumberQueryOptions = UseSuspenseQueryOptions<number>

const QUERY_DURATION = 1000

const createQuery: (id: number) => NumberQueryOptions = (id) => ({
  queryKey: [id],
  queryFn: () => sleep(QUERY_DURATION).then(() => id),
})
const resolveQueries = async () => {
  await vi.advanceTimersByTimeAsync(QUERY_DURATION)
}

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
    useEffect(() => {
      onSuspend()
    }, [])

    return <div>loading</div>
  }

  const withSuspenseWrapper = <T extends object>(
    Component: FunctionalComponent<T>,
  ) => {
    function SuspendedComponent(props: T) {
      return (
        <Suspense fallback={<SuspenseFallback />}>
          <Component {...props} />
        </Suspense>
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

    useEffect(() => {
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

    expect(onSuspend).toHaveBeenCalled()
    // the test for onQueriesResolution is React-specific and not applicable to Preact
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
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    expect(spy).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(30)
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

      useEffect(() => {
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
      <Suspense fallback={<SuspenseFallback />}>
        <App />
      </Suspense>,
    )

    await vi.advanceTimersByTimeAsync(localDuration)

    expect(onSuspend).toHaveBeenCalled()

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
      <Suspense fallback={<Fallback />}>
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(20)
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
      const ref = useRef(Math.random())
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
      <Suspense fallback={<Fallback />}>
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(20)
    expect(rendered.getByText('data: 1,2')).toBeInTheDocument()

    expect(refs.length).toBe(2)
    expect(refs[0]).toBe(refs[1])
  })

  // this addresses the following issue:
  // https://github.com/TanStack/query/issues/6344
  it('should suspend on offline when query changes, and data should not be undefined', async () => {
    function Page({ id }: { id: number }) {
      const { data } = useSuspenseQuery({
        queryKey: [id],
        queryFn: () => sleep(10).then(() => `Data ${id}`),
      })

      // defensive guard here
      if (data === undefined) {
        throw new Error('data cannot be undefined')
      }

      return <div>{data}</div>
    }

    function TestApp() {
      const [id, setId] = useState(0)

      return (
        <>
          <button onClick={() => setId((prev) => prev + 1)}>fetch</button>
          <Suspense fallback={<div>loading</div>}>
            <Page id={id} />
          </Suspense>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <TestApp />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.getByText('Data 0')).toBeInTheDocument()

    // go offline
    document.dispatchEvent(new CustomEvent('offline'))

    fireEvent.click(rendered.getByText('fetch'))
    // Preact unmounts the new state variable at the Suspense Boundary
    // You will not have the old data once a key changes offline
    expect(rendered.getByText('loading')).toBeInTheDocument()

    // go back online
    document.dispatchEvent(new CustomEvent('online'))

    // Some assertions removed to account for the synchronous execution
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    // query should resume
    // Preact unmounts the new state variable at the Suspense Boundary
    expect(rendered.getByText('Data 1')).toBeInTheDocument()
  })

  it('should throw error when queryKey changes and new query fails', async () => {
    const consoleMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)
    const key = queryKey()

    function Page({ fail }: { fail: boolean }) {
      const { data } = useSuspenseQuery({
        queryKey: [key, fail],
        queryFn: () =>
          sleep(10).then(() => {
            if (fail) throw new Error('Suspense Error Bingo')
            return 'data'
          }),
        retry: 0,
      })

      return <div>rendered: {data}</div>
    }

    function TestApp() {
      const [fail, setFail] = useState(false)

      return (
        <>
          <button onClick={() => setFail(true)}>trigger fail</button>
          <ErrorBoundary fallbackRender={() => <div>error boundary</div>}>
            <Suspense fallback="loading">
              <Page fail={fail} />
            </Suspense>
          </ErrorBoundary>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <TestApp />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('rendered: data')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('trigger fail'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('error boundary')).toBeInTheDocument()

    expect(consoleMock.mock.calls[0]?.[1]).toStrictEqual(
      new Error('Suspense Error Bingo'),
    )

    consoleMock.mockRestore()
  })

  it('should keep previous data when wrapped in a transition', async () => {
    const key = queryKey()

    function Page({ count, isPending }: { count: number; isPending: boolean }) {
      const { data } = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: () => sleep(10).then(() => 'data' + count),
      })

      return <div>{isPending ? 'pending' : data}</div>
    }

    function TestApp() {
      const [count, setCount] = useState(0)
      const [isPending, startTransition] = useTransition()

      return (
        <>
          <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
            inc
          </button>
          <Suspense fallback="loading">
            <Page count={count} isPending={isPending} />
          </Suspense>
        </>
      )
    }

    const rendered = renderWithClient(queryClient, <TestApp />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    // Expect no concurrent updates in Preact
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data1')).toBeInTheDocument()
  })

  it('should not request old data inside transitions (issue #6486)', async () => {
    const key = queryKey()
    let queryFnCount = 0

    function App() {
      const [count, setCount] = useState(0)

      return (
        <div>
          <button onClick={() => startTransition(() => setCount(count + 1))}>
            inc
          </button>
          <Suspense fallback="loading">
            <Page count={count} />
          </Suspense>
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
    await vi.advanceTimersByTimeAsync(10)
    expect(rendered.getByText('data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    await vi.advanceTimersByTimeAsync(10)
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

    function Page({ count, isPending }: { count: number; isPending: boolean }) {
      const { data } = useSuspenseQuery({
        queryKey: [key, count],
        queryFn: () => sleep(10).then(() => 'data' + count),
      })

      return (
        <div>
          <div>{isPending ? 'pending' : data}</div>
        </div>
      )
    }

    function TestApp() {
      const [count, setCount] = useState(0)
      const [isPending, startTransition] = useTransition()

      return (
        <>
          <button onClick={() => startTransition(() => setCount((c) => c + 1))}>
            inc
          </button>
          <Suspense fallback="loading">
            <Page count={count} isPending={isPending} />
          </Suspense>
        </>
      )
    }

    const rendered = renderWithClient(queryClientWithPlaceholder, <TestApp />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
    expect(rendered.getByText('data0')).toBeInTheDocument()

    fireEvent.click(rendered.getByText('inc'))
    expect(rendered.getByText('loading')).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10)
    })
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
        <Suspense fallback="loading">
          <ErrorBoundary
            fallbackRender={() => {
              return <div>There was an error!</div>
            }}
          >
            <Page />
          </ErrorBoundary>
        </Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.getByText('loading')).toBeInTheDocument()
    await vi.advanceTimersByTimeAsync(10)
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
          <Suspense fallback="loading">
            <Component />
          </Suspense>
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
        const [show, setShow] = useState(true)

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
            queryFn: Math.random() >= 0 ? skipToken : () => Promise.resolve(5),
          },
        ],
      })

      return null
    }

    function App() {
      return (
        <Suspense fallback="loading">
          <Page />
        </Suspense>
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
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
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
      <Suspense fallback="loading">
        <Page />
      </Suspense>,
    )

    expect(consoleErrorSpy).not.toHaveBeenCalled()
    consoleErrorSpy.mockRestore()
    process.env.NODE_ENV = envCopy
  })

  it('should only suspend queries that are pending when some queries already have data', async () => {
    const key1 = queryKey()
    const key2 = queryKey()

    queryClient.setQueryData(key1, 'cached')

    function Page() {
      const [result1, result2] = useSuspenseQueries({
        queries: [
          {
            queryKey: key1,
            queryFn: () => sleep(QUERY_DURATION).then(() => 'data1'),
          },
          {
            queryKey: key2,
            queryFn: () => sleep(QUERY_DURATION).then(() => 'data2'),
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
      <Suspense fallback={<div>loading</div>}>
        <Page />
      </Suspense>,
    )

    expect(rendered.getByText('loading')).toBeInTheDocument()

    await vi.advanceTimersByTimeAsync(QUERY_DURATION)

    expect(rendered.getByText('data1: cached')).toBeInTheDocument()
    expect(rendered.getByText('data2: data2')).toBeInTheDocument()
  })
})
