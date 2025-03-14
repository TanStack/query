import { describe, expect, it, vi } from 'vitest'
import React from 'react'
import { waitFor } from '@testing-library/react'
import { QueryCache, usePrefetchQueries, useSuspenseQueries } from '..'
import { createQueryClient, queryKey, renderWithClient, sleep } from './utils'

import type { UseSuspenseQueryOptions } from '..'

const generateQueryFn = (data: string) =>
  vi
    .fn<(...args: Array<any>) => Promise<string>>()
    .mockImplementation(async () => {
      await sleep(10)

      return data
    })

describe('usePrefetchQueries', () => {
  const queryCache = new QueryCache()
  const queryClient = createQueryClient({ queryCache })

  function Suspended<TData = unknown>(props: {
    queriesOpts: Array<
      UseSuspenseQueryOptions<TData, Error, TData, Array<string>>
    >
    children?: React.ReactNode
  }) {
    const state = useSuspenseQueries({
      queries: props.queriesOpts,
      combine: (results) => results.map((r) => r.data),
    })

    return (
      <div>
        <div>data: {state.map((data) => String(data)).join(', ')}</div>
        {props.children}
      </div>
    )
  }

  it('should prefetch queries if query states do not exist', async () => {
    const queryOpts1 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('prefetchQuery1'),
    }

    const queryOpts2 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('prefetchQuery2'),
    }

    const componentQueryOpts1 = {
      ...queryOpts1,
      queryFn: generateQueryFn('useSuspenseQuery1'),
    }

    const componentQueryOpts2 = {
      ...queryOpts2,
      queryFn: generateQueryFn('useSuspenseQuery2'),
    }

    function App() {
      usePrefetchQueries({
        queries: [queryOpts1, queryOpts2],
      })

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queriesOpts={[componentQueryOpts1, componentQueryOpts2]} />
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() =>
      rendered.getByText('data: prefetchQuery1, prefetchQuery2'),
    )
    expect(queryOpts1.queryFn).toHaveBeenCalledTimes(1)
    expect(queryOpts2.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not prefetch queries if query states exist', async () => {
    const queryOpts1 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('The usePrefetchQueries hook is smart! 1'),
    }

    const queryOpts2 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('The usePrefetchQueries hook is smart! 2'),
    }

    function App() {
      usePrefetchQueries({
        queries: [queryOpts1, queryOpts2],
      })

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queriesOpts={[queryOpts1, queryOpts2]} />
        </React.Suspense>
      )
    }

    await queryClient.fetchQuery(queryOpts1)
    await queryClient.fetchQuery(queryOpts2)
    queryOpts1.queryFn.mockClear()
    queryOpts2.queryFn.mockClear()

    const rendered = renderWithClient(queryClient, <App />)

    expect(rendered.queryByText('fetching: true')).not.toBeInTheDocument()
    await waitFor(() =>
      rendered.getByText(
        'data: The usePrefetchQueries hook is smart! 1, The usePrefetchQueries hook is smart! 2',
      ),
    )
    expect(queryOpts1.queryFn).not.toHaveBeenCalled()
    expect(queryOpts2.queryFn).not.toHaveBeenCalled()
  })

  it('should only prefetch queries that do not exist', async () => {
    const queryOpts1 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('The usePrefetchQueries hook is smart! 1'),
    }

    const queryOpts2 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('The usePrefetchQueries hook is smart! 2'),
    }

    function App() {
      usePrefetchQueries({
        queries: [queryOpts1, queryOpts2],
      })

      return (
        <React.Suspense fallback="Loading...">
          <Suspended queriesOpts={[queryOpts1, queryOpts2]} />
        </React.Suspense>
      )
    }

    await queryClient.fetchQuery(queryOpts1)
    queryOpts1.queryFn.mockClear()
    queryOpts2.queryFn.mockClear()

    const rendered = renderWithClient(queryClient, <App />)

    await waitFor(() =>
      rendered.getByText(
        'data: The usePrefetchQueries hook is smart! 1, The usePrefetchQueries hook is smart! 2',
      ),
    )
    expect(queryOpts1.queryFn).not.toHaveBeenCalled()
    expect(queryOpts2.queryFn).toHaveBeenCalledTimes(1)
  })

  it('should not create an endless loop when using inside a suspense boundary', async () => {
    const queryOpts1 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('prefetchedQuery1'),
    }

    const queryOpts2 = {
      queryKey: queryKey(),
      queryFn: generateQueryFn('prefetchedQuery2'),
    }

    function Prefetch({ children }: { children: React.ReactNode }) {
      usePrefetchQueries({
        queries: [queryOpts1, queryOpts2],
      })
      return <>{children}</>
    }

    function App() {
      return (
        <React.Suspense>
          <Prefetch>
            <Suspended queriesOpts={[queryOpts1, queryOpts2]} />
          </Prefetch>
        </React.Suspense>
      )
    }

    const rendered = renderWithClient(queryClient, <App />)
    await waitFor(() =>
      rendered.getByText('data: prefetchedQuery1, prefetchedQuery2'),
    )
    expect(queryOpts1.queryFn).toHaveBeenCalledTimes(1)
    expect(queryOpts2.queryFn).toHaveBeenCalledTimes(1)
  })
})
