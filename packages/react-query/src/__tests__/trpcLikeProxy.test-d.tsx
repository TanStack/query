import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueryClient,
  experimental_waterfallHandle,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import { createOptionsProxy } from './trpcLikeProxy'
import type {
  InfiniteData,
  experimental_InferQueryHandleData,
  experimental_QueryHandle,
} from '..'
import type { OptionsProxy } from './trpcLikeProxy'

type Post = { id: string; title: string }
type Comment = { id: string; text: string }
type FeedPage = { items: Array<string>; nextCursor: number | null }

const router = {
  'post.byId': (_input: { id: string }): Promise<Post> =>
    Promise.resolve({ id: '1', title: '' }),
  'post.comments': (_input: {
    postId: string
    page: number
  }): Promise<Array<Comment>> => Promise.resolve([]),
  feed: (_input: {
    limit: number
    cursor?: number | null
  }): Promise<FeedPage> => Promise.resolve({ items: [], nextCursor: null }),
}

type TRPC = OptionsProxy<typeof router>

const trpc = createOptionsProxy(router, new QueryClient())

describe('a tRPC-like proxy on the public handle APIs', () => {
  it("should type the verbs' input from the procedure", () => {
    assertType(trpc['post.byId'].$queryHandle({ id: '1' }))
    // @ts-expect-error the input has the wrong shape
    assertType(trpc['post.byId'].$queryHandle({ id: 1 }))
    // @ts-expect-error the input has the wrong shape
    assertType(trpc['post.byId'].$ensureQueryHandle({ id: 1 }))
    // @ts-expect-error a procedure whose output has no cursor has no infinite verbs
    assertType(trpc['post.byId'].$infiniteQueryHandleAsync)
  })

  it('should give awaited handles the same plain type as handles that are not awaited', async () => {
    const post = await trpc['post.byId'].$queryHandleAsync({ id: '1' })
    const feed = await trpc.feed.$infiniteQueryHandleAsync(
      { limit: 2 },
      { pages: 2 },
    )

    expectTypeOf(post).toEqualTypeOf(
      trpc['post.byId'].$queryHandle({ id: '1' }),
    )
    expectTypeOf(post).toEqualTypeOf(
      await trpc['post.byId'].$ensureQueryHandle({ id: '1' }),
    )
    expectTypeOf(post).not.toHaveProperty('data')
    expectTypeOf(post.input).toEqualTypeOf<{ id: string }>()
    expectTypeOf(feed.input).toEqualTypeOf<
      Omit<{ limit: number; cursor?: number | null }, 'cursor'>
    >()
  })

  it('should read any handle without naming its procedure', async () => {
    const post = trpc['post.byId'].$queryHandle({ id: '1' })
    const awaited = await trpc['post.byId'].$queryHandleAsync({ id: '1' })
    const feed = await trpc.feed.$infiniteQueryHandleAsync({ limit: 2 })

    expectTypeOf(
      useSuspenseQuery(trpc.$fromHandle(post)).data,
    ).toEqualTypeOf<Post>()
    expectTypeOf(useQuery(trpc.$fromHandle(post)).data).toEqualTypeOf<
      Post | undefined
    >()
    expectTypeOf(useQuery(trpc.$fromHandle(awaited)).data).toEqualTypeOf<
      Post | undefined
    >()
    expectTypeOf(
      useSuspenseQuery(trpc.$fromHandle(awaited)).data,
    ).toEqualTypeOf<Post>()
    expectTypeOf(
      useSuspenseInfiniteQuery(trpc.$fromHandle(feed)).data,
    ).toEqualTypeOf<InfiniteData<FeedPage, unknown>>()
  })

  it('should type select from the procedure when read-site options are spread', () => {
    const post = trpc['post.byId'].$queryHandle({ id: '1' })

    const { data } = useSuspenseQuery({
      ...trpc.$fromHandle(post),
      select: (value) => {
        expectTypeOf(value).toEqualTypeOf<Post>()
        return value.title
      },
    })

    expectTypeOf(data).toEqualTypeOf<string>()
  })

  it('should type handle props from the procedure', () => {
    const props = {} as {
      post: experimental_QueryHandle<TRPC['post.byId']['queryOptions']>
    }

    expectTypeOf(trpc['post.byId'].$queryHandle({ id: '1' })).toEqualTypeOf(
      props.post,
    )
    expectTypeOf(
      useSuspenseQuery(trpc.$fromHandle(props.post)).data,
    ).toEqualTypeOf<Post>()
  })

  it('should not accept handles the router did not start', () => {
    const unknownPath = {
      queryKey: ['nope', { input: { id: '1' }, type: 'query' }],
      input: { id: '1' },
    } as const
    const wrongInput = {
      queryKey: ['post.byId', { input: { id: 1 }, type: 'query' }],
      input: { id: 1 },
    } as const

    // @ts-expect-error the path isn't a procedure of the router
    assertType(trpc.$fromHandle(unknownPath))
    // @ts-expect-error the input doesn't match the procedure's
    assertType(trpc.$fromHandle(wrongInput))
  })

  it('should switch a handle with waterfallHandle', () => {
    const comments = trpc['post.comments'].$queryHandle({
      postId: '1',
      page: 1,
    })

    const next = experimental_waterfallHandle(
      trpc['post.comments'].queryOptions,
      comments,
      (input) => {
        expectTypeOf(input).toEqualTypeOf<{ postId: string; page: number }>()
        return { ...input, page: 2 }
      },
    )

    expectTypeOf(next).toEqualTypeOf(comments)
    expectTypeOf(useSuspenseQuery(trpc.$fromHandle(next)).data).toEqualTypeOf<
      Array<Comment>
    >()
  })

  it("should infer a procedure's data from its factory, the same as useSuspenseQuery", async () => {
    const post = trpc['post.byId'].$queryHandle({ id: '1' })
    const feed = await trpc.feed.$infiniteQueryHandleAsync({ limit: 2 })

    expectTypeOf<
      experimental_InferQueryHandleData<TRPC['post.byId']['queryOptions']>
    >().toEqualTypeOf<Post>()
    expectTypeOf<
      experimental_InferQueryHandleData<TRPC['post.byId']['queryOptions']>
    >().toEqualTypeOf(useSuspenseQuery(trpc.$fromHandle(post)).data)
    expectTypeOf<
      experimental_InferQueryHandleData<typeof post>
    >().toEqualTypeOf<Post>()
    expectTypeOf<
      experimental_InferQueryHandleData<TRPC['feed']['infiniteQueryOptions']>
    >().toEqualTypeOf(useSuspenseInfiniteQuery(trpc.$fromHandle(feed)).data)
    expectTypeOf<
      experimental_InferQueryHandleData<typeof feed>
    >().toEqualTypeOf<InfiniteData<FeedPage, unknown>>()
  })
})
