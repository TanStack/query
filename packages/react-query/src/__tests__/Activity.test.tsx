import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act } from '@testing-library/react'
import * as React from 'react'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  useQueries,
  useQuery,
  useSuspenseQueries,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'

type Options = {
  queryKey: Array<string>
  queryFn: () => Promise<string>
}

describe.each([
  {
    name: 'useQuery',
    useTestQuery: (options: Options) => useQuery(options).data,
  },
  {
    name: 'useSuspenseQuery',
    useTestQuery: (options: Options) => useSuspenseQuery(options).data,
  },
  {
    name: 'useQueries',
    useTestQuery: (options: Options) =>
      useQueries({ queries: [options] })[0].data,
  },
  {
    name: 'useSuspenseQueries',
    useTestQuery: (options: Options) =>
      useSuspenseQueries({ queries: [options] })[0].data,
  },
])('$name with Activity', ({ useTestQuery }) => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()
  })

  afterEach(() => {
    queryClient.clear()
    vi.useRealTimers()
  })

  it('should not fetch the old key when revealed after a hidden key change', async () => {
    const key = queryKey()
    const fetched: Array<string> = []

    function Page({ filter }: { filter: string }) {
      const data = useTestQuery({
        queryKey: [...key, filter],
        queryFn: async () => {
          fetched.push(filter)
          await sleep(10)
          return filter
        },
      })

      return <p>data: {data}</p>
    }

    function App({
      mode,
      filter,
    }: {
      mode: 'visible' | 'hidden'
      filter: string
    }) {
      return (
        <React.Activity mode={mode}>
          <React.Suspense fallback="loading">
            <Page filter={filter} />
          </React.Suspense>
        </React.Activity>
      )
    }

    const rendered = renderWithClient(
      queryClient,
      <App mode="visible" filter="a" />,
    )
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: a')).toBeVisible()

    rendered.rerender(<App mode="hidden" filter="b" />)
    // Hidden trees render without running effects. Also let suspense's minimum
    // staleTime elapse so that subscribing to the old key would refetch it.
    await act(() => vi.advanceTimersByTimeAsync(1100))
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: [...key, 'a'] })!
        .getObserversCount(),
    ).toBe(0)
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: [...key, 'b'] })!
        .getObserversCount(),
    ).toBe(0)

    rendered.rerender(<App mode="visible" filter="b" />)
    await act(() => vi.advanceTimersByTimeAsync(50))

    expect(rendered.getByText('data: b')).toBeVisible()
    expect(fetched).toContain('b')
    expect(fetched.filter((filter) => filter === 'a')).toStrictEqual(['a'])
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: [...key, 'b'] })!
        .getObserversCount(),
    ).toBe(1)
  })
})
