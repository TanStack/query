import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueryClient,
  experimental_ensureQueryHandle,
  experimental_fromHandle,
  experimental_getQueryHandleData,
  experimental_queryHandle,
  experimental_queryHandleAsync,
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import type {
  InfiniteData,
  experimental_DefinedQueryHandle,
  experimental_InferQueryHandleData,
  experimental_QueryHandle,
} from '..'

type Post = { id: string; title: string }

const postQuery = (input: { id: string }) =>
  queryOptions({
    queryKey: ['post', input.id] as const,
    queryFn: (): Promise<Post> => Promise.resolve({ id: input.id, title: '' }),
  })

const viewerQuery = () =>
  queryOptions({
    queryKey: ['viewer'] as const,
    queryFn: () => Promise.resolve({ name: 'viewer' }),
  })

const feedQuery = (input: { size: number }) =>
  infiniteQueryOptions({
    queryKey: ['feed', input.size] as const,
    queryFn: ({ pageParam }) => Promise.resolve([pageParam]),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage[0],
  })

const queryClient = new QueryClient()

describe('query handles', () => {
  describe('verbs', () => {
    it("should take the factory's input", () => {
      assertType(experimental_queryHandle(queryClient, postQuery, { id: '1' }))
      assertType(experimental_queryHandle(queryClient, viewerQuery))

      // @ts-expect-error the input is required
      assertType(experimental_queryHandle(queryClient, postQuery))
      assertType(
        // @ts-expect-error the input has the wrong shape
        experimental_queryHandle(queryClient, postQuery, { id: 1 }),
      )
      assertType(
        // @ts-expect-error the factory takes no input
        experimental_queryHandle(queryClient, viewerQuery, { id: '1' }),
      )
      assertType(
        // @ts-expect-error the input has the wrong shape
        experimental_ensureQueryHandle(queryClient, postQuery, { id: 1 }),
      )
    })

    it("should not take a factory's other parameters, which the handle can't carry", async () => {
      const optionsQuery = (
        input: { id: string },
        opts?: { staleTime?: number },
      ) =>
        queryOptions({
          queryKey: ['post', input.id] as const,
          queryFn: () => Promise.resolve(input.id),
          staleTime: opts?.staleTime,
        })

      assertType(
        experimental_queryHandle(queryClient, optionsQuery, { id: '1' }),
      )
      assertType(
        experimental_queryHandle(
          queryClient,
          optionsQuery,
          { id: '1' },
          // @ts-expect-error the handle only carries the input
          { staleTime: 60_000 },
        ),
      )
      assertType(
        await experimental_queryHandleAsync(
          queryClient,
          optionsQuery,
          { id: '1' },
          // @ts-expect-error the handle only carries the input
          { staleTime: 60_000 },
        ),
      )
      assertType(
        await experimental_ensureQueryHandle(
          queryClient,
          optionsQuery,
          { id: '1' },
          // @ts-expect-error the handle only carries the input
          { staleTime: 60_000 },
        ),
      )
    })

    it('should take an optional input', () => {
      const listQuery = (input?: { page: number }) =>
        queryOptions({
          queryKey: ['list', input?.page ?? 1] as const,
          queryFn: () => Promise.resolve([input?.page ?? 1]),
        })

      assertType(experimental_queryHandle(queryClient, listQuery))
      const handle = experimental_queryHandle(queryClient, listQuery, {
        page: 2,
      })

      expectTypeOf(handle.input).toEqualTypeOf<{ page: number } | undefined>()
    })

    it('should keep optional key elements and drop the data tag', () => {
      const pageQuery = (input: { id: string; page?: number }) =>
        queryOptions({
          queryKey: (input.page === undefined
            ? ['page', input.id]
            : ['page', input.id, input.page]) as readonly [
            string,
            string,
            number?,
          ],
          queryFn: () => Promise.resolve(input.id),
        })
      const handle = experimental_queryHandle(queryClient, pageQuery, {
        id: '1',
      })

      expectTypeOf(handle.queryKey).toEqualTypeOf<
        readonly [string, string, (number | undefined)?]
      >()
    })

    it('should return a plain handle with the key and input', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      expectTypeOf(handle.queryKey).toEqualTypeOf<readonly ['post', string]>()
      expectTypeOf(handle.input).toEqualTypeOf<{ id: string }>()
      expectTypeOf(handle).not.toHaveProperty('data')
    })

    it('should give a factory without input an undefined input', () => {
      const handle = experimental_queryHandle(queryClient, viewerQuery)

      expectTypeOf(handle.input).toEqualTypeOf<undefined>()
    })

    it('should resolve awaited handles with a defined handle', async () => {
      const post = await experimental_queryHandleAsync(queryClient, postQuery, {
        id: '1',
      })
      const viewer = await experimental_queryHandleAsync(
        queryClient,
        viewerQuery,
      )
      const ensured = await experimental_ensureQueryHandle(
        queryClient,
        viewerQuery,
      )

      expectTypeOf(post).toEqualTypeOf<
        experimental_DefinedQueryHandle<typeof postQuery>
      >()
      expectTypeOf(ensured).toEqualTypeOf<
        experimental_DefinedQueryHandle<typeof viewerQuery>
      >()
      expectTypeOf(viewer).toEqualTypeOf<
        experimental_DefinedQueryHandle<typeof viewerQuery>
      >()
      expectTypeOf(post).toExtend<experimental_QueryHandle<typeof postQuery>>()
      expectTypeOf(post).not.toHaveProperty('data')
    })

    it('should return a plain handle from experimental_queryHandle', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      expectTypeOf(handle).toEqualTypeOf<
        experimental_QueryHandle<typeof postQuery>
      >()
    })
  })

  describe('experimental_getQueryHandleData', () => {
    it('should take an awaited handle and give the data', async () => {
      const awaited = await experimental_queryHandleAsync(
        queryClient,
        postQuery,
        { id: '1' },
      )
      const ensured = await experimental_ensureQueryHandle(
        queryClient,
        viewerQuery,
      )

      expectTypeOf(
        experimental_getQueryHandleData(queryClient, postQuery, awaited),
      ).toEqualTypeOf<Post>()
      expectTypeOf(
        experimental_getQueryHandleData(queryClient, viewerQuery, ensured),
      ).toEqualTypeOf<{ name: string }>()
    })

    it("should give what a factory's select returns, and InfiniteData for an infinite factory", async () => {
      const postTitleQuery = (input: { id: string }) =>
        queryOptions({
          queryKey: ['post-title', input.id] as const,
          queryFn: (): Promise<Post> =>
            Promise.resolve({ id: input.id, title: '' }),
          select: (post) => post.title,
        })
      const title = await experimental_queryHandleAsync(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )
      const feed = await experimental_queryHandleAsync(queryClient, feedQuery, {
        size: 1,
      })

      expectTypeOf(
        experimental_getQueryHandleData(queryClient, postTitleQuery, title),
      ).toEqualTypeOf<string>()
      expectTypeOf(
        experimental_getQueryHandleData(queryClient, feedQuery, feed),
      ).toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof title>
      >().toEqualTypeOf<string>()
    })

    it('should not take a handle whose query was only started', () => {
      const started = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      assertType(
        // @ts-expect-error the query may not have data yet
        experimental_getQueryHandleData(queryClient, postQuery, started),
      )
    })

    it("should not take another factory's handle", async () => {
      const viewer = await experimental_queryHandleAsync(
        queryClient,
        viewerQuery,
      )

      assertType(
        // @ts-expect-error the handle belongs to viewerQuery
        experimental_getQueryHandleData(queryClient, postQuery, viewer),
      )
    })
  })

  describe('experimental_fromHandle', () => {
    it('should type useQuery data as possibly undefined for handles from every verb', async () => {
      const started = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })
      const awaited = await experimental_queryHandleAsync(
        queryClient,
        postQuery,
        {
          id: '1',
        },
      )
      const ensured = await experimental_ensureQueryHandle(
        queryClient,
        postQuery,
        { id: '1' },
      )

      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, ensured)).data,
      ).toEqualTypeOf<Post | undefined>()
      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, started)).data,
      ).toEqualTypeOf<Post | undefined>()
      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, awaited)).data,
      ).toEqualTypeOf<Post | undefined>()
    })

    it('should type useSuspenseQuery data as defined for handles from every verb', async () => {
      const started = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })
      const awaited = await experimental_queryHandleAsync(
        queryClient,
        postQuery,
        {
          id: '1',
        },
      )
      const ensured = await experimental_ensureQueryHandle(
        queryClient,
        postQuery,
        { id: '1' },
      )

      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, ensured)).data,
      ).toEqualTypeOf<Post>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, started)).data,
      ).toEqualTypeOf<Post>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, awaited)).data,
      ).toEqualTypeOf<Post>()
    })

    it('should keep useQuery data possibly undefined when read-site options are spread', async () => {
      const handle = await experimental_queryHandleAsync(
        queryClient,
        postQuery,
        {
          id: '1',
        },
      )

      const { data } = useQuery({
        ...experimental_fromHandle(postQuery, handle),
        select: (post) => post.title,
      })

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should accept keepPreviousData as placeholderData', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery({
        ...experimental_fromHandle(postQuery, handle),
        placeholderData: keepPreviousData,
      })

      expectTypeOf(data).toEqualTypeOf<Post | undefined>()
    })

    it('should work with infinite queries', () => {
      const handle = experimental_queryHandle(queryClient, feedQuery, {
        size: 1,
      })

      const { data } = useSuspenseInfiniteQuery(
        experimental_fromHandle(feedQuery, handle),
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
    })

    it('should type infinite data as possibly undefined for useInfiniteQuery and defined for useSuspenseInfiniteQuery', async () => {
      const handle = await experimental_queryHandleAsync(
        queryClient,
        feedQuery,
        { size: 1 },
      )

      expectTypeOf(
        useInfiniteQuery(experimental_fromHandle(feedQuery, handle)).data,
      ).toEqualTypeOf<InfiniteData<Array<number>, unknown> | undefined>()
      expectTypeOf(
        useSuspenseInfiniteQuery(experimental_fromHandle(feedQuery, handle))
          .data,
      ).toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
    })

    it('should take no third argument', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      assertType(
        // @ts-expect-error read-site options are spread over the result instead
        experimental_fromHandle(postQuery, handle, { enabled: false }),
      )
    })

    it("should not accept another factory's handle", () => {
      const otherQuery = (input: { id: string }) =>
        queryOptions({
          queryKey: ['other', input.id] as const,
          queryFn: (): Promise<Post> =>
            Promise.resolve({ id: input.id, title: '' }),
        })
      const handle = experimental_queryHandle(queryClient, otherQuery, {
        id: '1',
      })

      // @ts-expect-error the keys differ
      assertType(experimental_fromHandle(postQuery, handle))
    })

    it('should accept handles typed by their factory', () => {
      const handle = {} as experimental_QueryHandle<typeof postQuery>

      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, handle)).data,
      ).toEqualTypeOf<Post | undefined>()
    })
  })

  describe('select', () => {
    const postTitleQuery = (input: { id: string }) =>
      queryOptions({
        queryKey: ['post-title', input.id] as const,
        queryFn: (): Promise<Post> =>
          Promise.resolve({ id: input.id, title: '' }),
        select: (post) => post.title,
      })

    const feedItemsQuery = (input: { size: number }) =>
      infiniteQueryOptions({
        queryKey: ['feed-items', input.size] as const,
        queryFn: ({ pageParam }) => Promise.resolve([pageParam]),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage[0],
        select: (data) => data.pages.flat(),
      })

    it('should infer a read-site select from the factory with useQuery', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery({
        ...experimental_fromHandle(postQuery, handle),
        select: (post) => {
          expectTypeOf(post).toEqualTypeOf<Post>()
          return post.title
        },
        placeholderData: (previous) => {
          expectTypeOf(previous).toEqualTypeOf<Post | undefined>()
          return previous
        },
        enabled: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<Post | undefined>()
          return true
        },
      })

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should infer a read-site select from the factory with useSuspenseQuery', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useSuspenseQuery({
        ...experimental_fromHandle(postQuery, handle),
        select: (post) => {
          expectTypeOf(post).toEqualTypeOf<Post>()
          return post.title
        },
      })

      expectTypeOf(data).toEqualTypeOf<string>()
    })

    it('should type read-site placeholderData and enabled from the factory', () => {
      const handle = experimental_queryHandle(queryClient, postQuery, {
        id: '1',
      })

      assertType(
        useQuery({
          ...experimental_fromHandle(postQuery, handle),
          placeholderData: { id: '1', title: '' },
          enabled: false,
        }),
      )
      assertType(
        useQuery({
          ...experimental_fromHandle(postQuery, handle),
          // @ts-expect-error placeholderData has the query's data type
          placeholderData: 'title',
        }),
      )
      assertType(
        useQuery({
          ...experimental_fromHandle(postQuery, handle),
          // @ts-expect-error enabled is a boolean or a function of the query
          enabled: 'yes',
        }),
      )
    })

    it('should infer a read-site select from an infinite factory', () => {
      const handle = experimental_queryHandle(queryClient, feedQuery, {
        size: 1,
      })

      const { data } = useInfiniteQuery({
        ...experimental_fromHandle(feedQuery, handle),
        select: (feed) => {
          expectTypeOf(feed).toEqualTypeOf<
            InfiniteData<Array<number>, number>
          >()
          return feed.pages.flat()
        },
      })
      const suspense = useSuspenseInfiniteQuery({
        ...experimental_fromHandle(feedQuery, handle),
        select: (feed) => feed.pages.flat(),
      })

      expectTypeOf(data).toEqualTypeOf<Array<number> | undefined>()
      expectTypeOf(suspense.data).toEqualTypeOf<Array<number>>()
    })

    it("should type data from a factory's select", async () => {
      const started = experimental_queryHandle(queryClient, postTitleQuery, {
        id: '1',
      })
      const awaited = await experimental_queryHandleAsync(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )

      expectTypeOf(
        useQuery(experimental_fromHandle(postTitleQuery, started)).data,
      ).toEqualTypeOf<string | undefined>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postTitleQuery, awaited)).data,
      ).toEqualTypeOf<string>()
    })

    it("should keep a selecting factory's cache data as the queryFn's data", async () => {
      const handle = await experimental_queryHandleAsync(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )

      expectTypeOf(handle).toEqualTypeOf<
        experimental_DefinedQueryHandle<typeof postTitleQuery>
      >()
      expectTypeOf(handle.queryKey).toEqualTypeOf<
        readonly ['post-title', string]
      >()
      expectTypeOf(
        queryClient.getQueryData(postTitleQuery({ id: '1' }).queryKey),
      ).toEqualTypeOf<Post | undefined>()
    })

    it("should type data from an infinite factory's select", () => {
      const handle = experimental_queryHandle(queryClient, feedItemsQuery, {
        size: 1,
      })

      expectTypeOf(
        useInfiniteQuery(experimental_fromHandle(feedItemsQuery, handle)).data,
      ).toEqualTypeOf<Array<number> | undefined>()
      expectTypeOf(
        useSuspenseInfiniteQuery(
          experimental_fromHandle(feedItemsQuery, handle),
        ).data,
      ).toEqualTypeOf<Array<number>>()
    })

    it("should replace a factory's select with a read-site select over the queryFn's data", () => {
      const handle = experimental_queryHandle(queryClient, postTitleQuery, {
        id: '1',
      })

      const { data } = useSuspenseQuery({
        ...experimental_fromHandle(postTitleQuery, handle),
        select: (post) => {
          expectTypeOf(post).toEqualTypeOf<Post>()
          return post.id.length
        },
      })

      expectTypeOf(data).toEqualTypeOf<number>()
    })
  })

  describe('experimental_InferQueryHandleData', () => {
    const postTitleQuery = (input: { id: string }) =>
      queryOptions({
        queryKey: ['post-title', input.id] as const,
        queryFn: (): Promise<Post> =>
          Promise.resolve({ id: input.id, title: '' }),
        select: (post) => post.title,
      })

    const feedItemsQuery = (input: { size: number }) =>
      infiniteQueryOptions({
        queryKey: ['feed-items', input.size] as const,
        queryFn: ({ pageParam }) => Promise.resolve([pageParam]),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage[0],
        select: (data) => data.pages.flat(),
      })

    const handle = {} as experimental_QueryHandle<typeof postQuery>

    it("should give a factory's data, the same as useSuspenseQuery", () => {
      expectTypeOf<
        experimental_InferQueryHandleData<typeof postQuery>
      >().toEqualTypeOf<Post>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof viewerQuery>
      >().toEqualTypeOf<{ name: string }>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof postQuery>
      >().toEqualTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, handle)).data,
      )
    })

    it("should give what a factory's select returns, the same as useSuspenseQuery", () => {
      const titleHandle = {} as experimental_QueryHandle<typeof postTitleQuery>

      expectTypeOf<
        experimental_InferQueryHandleData<typeof postTitleQuery>
      >().toEqualTypeOf<string>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof postTitleQuery>
      >().toEqualTypeOf(
        useSuspenseQuery(experimental_fromHandle(postTitleQuery, titleHandle))
          .data,
      )
    })

    it("should give an infinite factory's data, the same as useSuspenseInfiniteQuery", () => {
      const feedHandle = {} as experimental_QueryHandle<typeof feedQuery>

      expectTypeOf<
        experimental_InferQueryHandleData<typeof feedQuery>
      >().toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof feedQuery>
      >().toEqualTypeOf(
        useSuspenseInfiniteQuery(experimental_fromHandle(feedQuery, feedHandle))
          .data,
      )
    })

    it("should give what an infinite factory's select returns, the same as useSuspenseInfiniteQuery", () => {
      const itemsHandle = {} as experimental_QueryHandle<typeof feedItemsQuery>

      expectTypeOf<
        experimental_InferQueryHandleData<typeof feedItemsQuery>
      >().toEqualTypeOf<Array<number>>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof feedItemsQuery>
      >().toEqualTypeOf(
        useSuspenseInfiniteQuery(
          experimental_fromHandle(feedItemsQuery, itemsHandle),
        ).data,
      )
    })

    it('should take a handle type', async () => {
      const awaited = await experimental_queryHandleAsync(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )

      expectTypeOf<
        experimental_InferQueryHandleData<typeof handle>
      >().toEqualTypeOf<Post>()
      expectTypeOf<
        experimental_InferQueryHandleData<typeof awaited>
      >().toEqualTypeOf<string>()
    })

    it('should type a prop that takes the data', () => {
      function PostTitle(props: {
        post: experimental_InferQueryHandleData<typeof postQuery>
      }) {
        return props.post.title
      }
      const { data } = useSuspenseQuery(
        experimental_fromHandle(postQuery, handle),
      )
      const maybe = useQuery(experimental_fromHandle(postQuery, handle)).data

      assertType(PostTitle({ post: data }))
      // @ts-expect-error useQuery data may be undefined
      assertType(PostTitle({ post: maybe }))
    })
  })
})
