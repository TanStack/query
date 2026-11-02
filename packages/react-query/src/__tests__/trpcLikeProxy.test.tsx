import { describe, expect, it, vi } from 'vitest'
import * as React from 'react'
import { act, fireEvent } from '@testing-library/react'
import {
  clearOnDispose,
  fakeTimers,
  sleep,
  unmountOnDispose,
} from '@tanstack/query-test-utils'
import {
  QueryClient,
  dehydrate,
  experimental_waterfallHandle,
  hydrate,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import { renderWithClient } from './utils'
import { createOptionsProxy } from './trpcLikeProxy'
import type { experimental_QueryHandle } from '..'
import type { OptionsProxy } from './trpcLikeProxy'

type Post = { id: string; title: string }
type FeedPage = { items: Array<string>; nextCursor: number | null }

describe('a tRPC-like proxy on the public handle APIs', () => {
  const createRouter = () => ({
    'post.byId': vi.fn<(input: { id: string }) => Promise<Post>>((input) =>
      sleep(10).then(() => ({ id: input.id, title: `post ${input.id}` })),
    ),
    'post.comments': vi.fn<
      (input: { postId: string; page: number }) => Promise<Array<string>>
    >((input) =>
      sleep(10).then(() => [`comment ${input.postId}-${input.page}`]),
    ),
    feed: vi.fn<
      (input: { limit: number; cursor?: number | null }) => Promise<FeedPage>
    >((input) =>
      sleep(10).then(() => {
        const cursor = input.cursor ?? 0
        return {
          items: [`item ${cursor}`],
          nextCursor: cursor + input.limit,
        }
      }),
    ),
  })

  it('should start queries on the server and read the handles on the client', async () => {
    using _timers = fakeTimers()
    const router = createRouter()
    type TRPC = OptionsProxy<typeof router>

    using serverClient = clearOnDispose(new QueryClient())
    const serverTrpc = createOptionsProxy(router, serverClient)
    const postPromise = serverTrpc['post.byId'].$ensure({ id: '1' })
    const feedPromise = serverTrpc.feed.$ensureInfinite(
      { limit: 10 },
      { pages: 2 },
    )
    await vi.advanceTimersByTimeAsync(10)
    const post = await postPromise
    const comments = serverTrpc['post.comments'].$prefetch({
      postId: post.data.id,
      page: 1,
    })
    await vi.advanceTimersByTimeAsync(10)
    const feed = await feedPromise
    const payload = JSON.parse(
      JSON.stringify({
        state: dehydrate(serverClient),
        post,
        comments,
        feed,
      }),
    ) as {
      state: ReturnType<typeof dehydrate>
      post: typeof post
      comments: typeof comments
      feed: typeof feed
    }

    using queryClient = clearOnDispose(new QueryClient())
    hydrate(queryClient, payload.state)
    const trpc = createOptionsProxy(router, queryClient)

    function Post(props: {
      post: experimental_QueryHandle<TRPC['post.byId']['queryOptions']>
    }) {
      const { data } = useSuspenseQuery({
        ...trpc.$fromHandle(props.post),
        select: (value) => value.title,
      })
      return <div>title: {data}</div>
    }

    function Comments(props: {
      comments: experimental_QueryHandle<TRPC['post.comments']['queryOptions']>
    }) {
      const [page, setPage] = React.useState(1)
      const handle = experimental_waterfallHandle(
        trpc['post.comments'].queryOptions,
        props.comments,
        (input) => ({ ...input, page }),
      )
      const { data } = useSuspenseQuery(trpc.$fromHandle(handle))
      return (
        <div>
          <div>comments: {data.join(', ')}</div>
          <button onClick={() => setPage(2)}>next</button>
        </div>
      )
    }

    function Feed(props: { feed: typeof feed }) {
      const { data } = useSuspenseInfiniteQuery(trpc.$fromHandle(props.feed))
      return (
        <div>feed: {data.pages.flatMap((page) => page.items).join(', ')}</div>
      )
    }

    using rendered = unmountOnDispose(
      renderWithClient(
        queryClient,
        <React.Suspense fallback="Loading...">
          <Post post={payload.post} />
          <Comments comments={payload.comments} />
          <Feed feed={payload.feed} />
        </React.Suspense>,
      ),
    )

    expect(rendered.getByText('title: post 1')).toBeInTheDocument()
    expect(rendered.getByText('comments: comment 1-1')).toBeInTheDocument()
    expect(rendered.getByText('feed: item 0, item 10')).toBeInTheDocument()
    expect(router['post.byId']).toHaveBeenCalledTimes(1)
    expect(router['post.comments']).toHaveBeenCalledTimes(1)
    expect(router.feed).toHaveBeenCalledTimes(2)

    fireEvent.click(rendered.getByText('next'))
    expect(rendered.getByText('Loading...')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(11))
    expect(rendered.getByText('comments: comment 1-2')).toBeInTheDocument()
    expect(router['post.comments']).toHaveBeenCalledTimes(2)
    expect(router['post.comments']).toHaveBeenLastCalledWith({
      postId: '1',
      page: 2,
    })
  })
})
