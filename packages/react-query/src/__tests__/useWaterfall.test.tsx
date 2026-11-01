import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import {
  clearOnDispose,
  createKey,
  fakeTimers,
  sleep,
} from '@tanstack/query-test-utils'
import {
  QueryClient,
  experimental_fetchHandle,
  experimental_fromHandle,
  experimental_prefetchHandle,
  experimental_useWaterfall,
  queryOptions,
  useQuery,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import type { experimental_QueryHandle } from '..'

describe('experimental_useWaterfall', () => {
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

  it('should start the query for an input during render, once', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery, queryFn } = createPostsQuery()
    const handles: Array<experimental_QueryHandle<typeof postsQuery>> = []

    function Posts() {
      const handle = experimental_useWaterfall(postsQuery, { page: 1 })
      handles.push(handle)
      const { data } = useSuspenseQuery(
        experimental_fromHandle(postsQuery, handle),
      )
      return <div>data: {data}</div>
    }

    const rendered = renderWithClient(
      queryClient,
      <React.Suspense fallback="Loading...">
        <Posts />
      </React.Suspense>,
    )

    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: page 1')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(1)
    expect(handles.at(-1)).toStrictEqual({
      queryKey: postsQuery({ page: 1 }).queryKey,
      input: { page: 1 },
    })
  })

  it('should keep its handle while the input maps to the same query', () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery, queryFn } = createPostsQuery()
    const handles: Array<experimental_QueryHandle<typeof postsQuery>> = []

    function Posts(props: { page: number }) {
      handles.push(experimental_useWaterfall(postsQuery, { page: props.page }))
      return null
    }

    const rendered = renderWithClient(queryClient, <Posts page={1} />)
    rendered.rerender(<Posts page={1} />)
    rendered.rerender(<Posts page={2} />)

    expect(handles[0]).toBe(handles[1])
    expect(handles[2]).not.toBe(handles[1])
    expect(handles[2]?.input).toStrictEqual({ page: 2 })
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it('should keep the handle a loader passed down until the switched input maps to another query', async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery, queryFn } = createPostsQuery()
    const loaderHandle = experimental_prefetchHandle(queryClient, postsQuery, {
      page: 1,
    })
    const handles: Array<experimental_QueryHandle<typeof postsQuery>> = []

    function Posts(props: {
      posts: experimental_QueryHandle<typeof postsQuery>
    }) {
      const [page, setPage] = React.useState(1)
      const [filter, setFilter] = React.useState('')
      const posts = experimental_useWaterfall(
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

    const rendered = renderWithClient(
      queryClient,
      <Posts posts={loaderHandle} />,
    )
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: page 1')).toBeInTheDocument()
    expect(handles.every((handle) => handle === loaderHandle)).toBe(true)

    fireEvent.click(rendered.getByText('filter'))
    expect(handles.at(-1)).toBe(loaderHandle)

    fireEvent.click(rendered.getByText('next'))
    expect(handles.at(-1)).toStrictEqual({
      queryKey: postsQuery({ page: 2 }).queryKey,
      input: { page: 2, filter: 'new' },
    })
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('data: page 2')).toBeInTheDocument()
    expect(queryFn).toHaveBeenCalledTimes(2)
  })

  it("should give useQuery an awaited handle's data on the first render", async () => {
    using _timers = fakeTimers()
    using queryClient = clearOnDispose(new QueryClient())
    const { postsQuery } = createPostsQuery()
    const promise = experimental_fetchHandle(queryClient, postsQuery, {
      page: 1,
    })
    await vi.advanceTimersByTimeAsync(10)
    const handle = await promise
    using freshClient = clearOnDispose(new QueryClient())
    const statuses: Array<string> = []

    function Posts() {
      const { data, status } = useQuery(
        experimental_fromHandle(postsQuery, handle),
      )
      statuses.push(status)
      return <div>data: {data}</div>
    }

    const rendered = renderWithClient(freshClient, <Posts />)

    expect(rendered.getByText('data: page 1')).toBeInTheDocument()
    expect(statuses[0]).toBe('success')
  })
})
