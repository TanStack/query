import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import {
  clearOnDispose,
  createKey,
  fakeTimers,
  sleep,
  unmountOnDispose,
} from '@tanstack/query-test-utils'
import {
  HydrationBoundary,
  QueryClient,
  defaultShouldDehydrateQuery,
  dehydrate,
  experimental_fromHandle,
  experimental_queryHandle,
  experimental_queryHandleAsync,
  keepPreviousData,
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type { experimental_QueryHandle } from '..'

describe('query handles', () => {
  it('should stream a pending query from experimental_queryHandle to a reader without fetching it again', async () => {
    using _timers = fakeTimers()
    const key = createKey()
    const queryFn = vi.fn<(id: string) => Promise<string>>((id) =>
      sleep(10).then(() => `post ${id}`),
    )
    const postQuery = (input: { id: string }) =>
      queryOptions({
        queryKey: [...key, input.id],
        queryFn: () => queryFn(input.id),
        staleTime: 60 * 1000,
      })

    using serverClient = clearOnDispose(new QueryClient())
    const handle = experimental_queryHandle(serverClient, postQuery, {
      id: '1',
    })
    const dehydrated = dehydrate(serverClient, {
      shouldDehydrateQuery: (query) =>
        defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
    })
    expect(dehydrated.queries).toHaveLength(1)
    expect(dehydrated.queries[0]?.state.status).toBe('pending')

    function Post(props: { post: experimental_QueryHandle<typeof postQuery> }) {
      const { data } = useSuspenseQuery(
        experimental_fromHandle(postQuery, props.post),
      )
      return <div>data: {data}</div>
    }

    using queryClient = clearOnDispose(new QueryClient())
    using rendered = unmountOnDispose(
      renderWithClient(
        queryClient,
        <HydrationBoundary state={dehydrated}>
          <React.Suspense fallback="Loading...">
            <Post post={JSON.parse(JSON.stringify(handle))} />
          </React.Suspense>
        </HydrationBoundary>,
      ),
    )

    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(10))
    expect(rendered.getByText('data: post 1')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should give useQuery the cached data of an awaited handle on the first render', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const key = createKey()
    const postQuery = (input: { id: string }) =>
      queryOptions({
        queryKey: [...key, input.id],
        queryFn: () => sleep(10).then(() => `post ${input.id}`),
      })
    const promise = experimental_queryHandleAsync(queryClient, postQuery, {
      id: '1',
    })
    await vi.advanceTimersByTimeAsync(10)
    const handle = await promise
    const statuses: Array<string> = []

    function Post() {
      const { data, status } = useQuery(
        experimental_fromHandle(postQuery, handle),
      )
      statuses.push(status)
      return <div>data: {data}</div>
    }

    using rendered = unmountOnDispose(renderWithClient(queryClient, <Post />))

    expect(rendered.getByText('data: post 1')).toBeInTheDocument()
    expect(statuses[0]).toBe('success')
  })

  it("should let a component read the loader's query with plain options built from the handle's input", async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const key = createKey()
    const queryFn = vi.fn<(term: string) => Promise<string>>((term) =>
      sleep(10).then(() => `results for ${term}`),
    )
    const searchQuery = (input: { term: string }) =>
      queryOptions({
        queryKey: [...key, input.term],
        queryFn: () => queryFn(input.term),
      })
    const results = experimental_queryHandle(queryClient, searchQuery, {
      term: 'react',
    })

    function SearchBox(props: {
      results: experimental_QueryHandle<typeof searchQuery>
    }) {
      const [term, setTerm] = React.useState(props.results.input.term)
      const { data } = useQuery({
        ...searchQuery({ term }),
        placeholderData: keepPreviousData,
      })
      return (
        <div>
          <div>data: {data ?? 'none'}</div>
          <button onClick={() => setTerm('query')}>search</button>
        </div>
      )
    }

    using rendered = unmountOnDispose(
      renderWithClient(queryClient, <SearchBox results={results} />),
    )
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: results for react')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)

    fireEvent.click(rendered.getByText('search'))
    expect(rendered.getByText('data: results for react')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: results for query')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(2)
    expect(queryFn).toHaveBeenLastCalledWith('query')
  })
})
