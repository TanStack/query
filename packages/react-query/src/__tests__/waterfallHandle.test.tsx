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
  QueryClient,
  experimental_fromHandle,
  experimental_queryHandle,
  experimental_queryHandleAsync,
  experimental_waterfallHandle,
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type { experimental_QueryHandle } from '..'

describe('experimental_waterfallHandle', () => {
  const createPostsQuery = () => {
    const key = createKey()
    const queryFn = vi.fn<(page: number) => Promise<string>>((page) =>
      sleep(10).then(() => `page ${page}`),
    )
    const postsQuery = (input: { page: number; filter?: string }) =>
      queryOptions({
        queryKey: [...key, input.page],
        queryFn: () => queryFn(input.page),
      })
    return { postsQuery, queryFn }
  }

  it('should let the reader fetch the query once', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery, queryFn } = createPostsQuery()

    function Posts() {
      const posts = experimental_waterfallHandle(postsQuery, { page: 1 })
      const { data } = useSuspenseQuery(
        experimental_fromHandle(postsQuery, posts),
      )
      return <div>data: {data}</div>
    }

    using rendered = unmountOnDispose(
      renderWithClient(
        queryClient,
        <React.Suspense fallback="Loading...">
          <Posts />
        </React.Suspense>,
      ),
    )

    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: page 1')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it("should keep the loader's handle until the new input maps to another query", async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery, queryFn } = createPostsQuery()
    const loaderHandle = experimental_queryHandle(queryClient, postsQuery, {
      page: 1,
    })
    const handles: Array<experimental_QueryHandle<typeof postsQuery>> = []

    function Posts(props: {
      posts: experimental_QueryHandle<typeof postsQuery>
    }) {
      const [page, setPage] = React.useState(1)
      const [filter, setFilter] = React.useState('')
      const posts = experimental_waterfallHandle(
        postsQuery,
        props.posts,
        (input) => ({ ...input, page, filter }),
      )
      handles.push(posts)
      const { data } = useQuery(experimental_fromHandle(postsQuery, posts))
      return (
        <div>
          <div>data: {data ?? 'none'}</div>
          <button onClick={() => setFilter('new')}>filter</button>
          <button onClick={() => setPage(2)}>next</button>
        </div>
      )
    }

    using rendered = unmountOnDispose(
      renderWithClient(queryClient, <Posts posts={loaderHandle} />),
    )
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: page 1')).toBeInTheDocument()
    expect(handles.every((handle) => handle === loaderHandle)).toBe(true)

    fireEvent.click(rendered.getByText('filter'))
    expect(handles.at(-1)).toBe(loaderHandle)
    expect(queryFn).toHaveBeenCalledTimes(1)

    fireEvent.click(rendered.getByText('next'))
    expect(handles.at(-1)).toStrictEqual({
      queryKey: postsQuery({ page: 2 }).queryKey,
      input: { page: 2, filter: 'new' },
    })
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: page 2')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should give useQuery the cached data of an awaited handle on the first render', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery } = createPostsQuery()
    const promise = experimental_queryHandleAsync(queryClient, postsQuery, {
      page: 1,
    })
    await vi.advanceTimersByTimeAsync(10)
    const handle = await promise
    const statuses: Array<string> = []

    function Posts() {
      const { data, status } = useQuery(
        experimental_fromHandle(postsQuery, handle),
      )
      statuses.push(status)
      return <div>data: {data}</div>
    }

    using rendered = unmountOnDispose(renderWithClient(queryClient, <Posts />))

    expect(rendered.getByText('data: page 1')).toBeInTheDocument()
    expect(statuses[0]).toBe('success')
  })
})
