import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { act, render } from '@testing-library/react'
import * as React from 'react'
import { useSuspenseQueries } from '..'
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
