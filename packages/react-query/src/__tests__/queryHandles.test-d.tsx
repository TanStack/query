import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  QueryClient,
  experimental_ensureHandle,
  experimental_fetchHandle,
  experimental_fromHandle,
  experimental_prefetchHandle,
  experimental_waterfallHandle,
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
  useInfiniteQuery,
  useQuery,
  useSuspenseInfiniteQuery,
  useSuspenseQuery,
} from '..'
import type { InfiniteData, experimental_QueryHandle } from '..'

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
      assertType(
        experimental_prefetchHandle(queryClient, postQuery, { id: '1' }),
      )
      assertType(experimental_prefetchHandle(queryClient, viewerQuery))

      // @ts-expect-error the input is required
      assertType(experimental_prefetchHandle(queryClient, postQuery))
      assertType(
        // @ts-expect-error the input has the wrong shape
        experimental_prefetchHandle(queryClient, postQuery, { id: 1 }),
      )
      assertType(
        // @ts-expect-error the factory takes no input
        experimental_prefetchHandle(queryClient, viewerQuery, { id: '1' }),
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
        experimental_prefetchHandle(queryClient, optionsQuery, { id: '1' }),
      )
      assertType(
        experimental_prefetchHandle(
          queryClient,
          optionsQuery,
          { id: '1' },
          // @ts-expect-error the handle only carries the input
          { staleTime: 60_000 },
        ),
      )
      assertType(
        await experimental_ensureHandle(
          queryClient,
          optionsQuery,
          { id: '1' },
          // @ts-expect-error the handle only carries the input
          { staleTime: 60_000 },
        ),
      )
      assertType(
        await experimental_fetchHandle(
          queryClient,
          optionsQuery,
          { id: '1' },
          // @ts-expect-error the handle only carries the input
          { staleTime: 60_000 },
        ),
      )
      const opts = { staleTime: 60_000 }
      // @ts-expect-error the handle only carries the input
      assertType(experimental_waterfallHandle(optionsQuery, { id: '1' }, opts))
    })

    it('should take an optional input', () => {
      const listQuery = (input?: { page: number }) =>
        queryOptions({
          queryKey: ['list', input?.page ?? 1] as const,
          queryFn: () => Promise.resolve([input?.page ?? 1]),
        })

      assertType(experimental_prefetchHandle(queryClient, listQuery))
      const handle = experimental_prefetchHandle(queryClient, listQuery, {
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
      const handle = experimental_prefetchHandle(queryClient, pageQuery, {
        id: '1',
      })

      expectTypeOf(handle.queryKey).toEqualTypeOf<
        readonly [string, string, (number | undefined)?]
      >()
    })

    it('should return a plain handle with the key and input', () => {
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      expectTypeOf(handle.queryKey).toEqualTypeOf<readonly ['post', string]>()
      expectTypeOf(handle.input).toEqualTypeOf<{ id: string }>()
      expectTypeOf(handle).not.toHaveProperty('data')
    })

    it('should give a factory without input an undefined input', () => {
      const handle = experimental_prefetchHandle(queryClient, viewerQuery)

      expectTypeOf(handle.input).toEqualTypeOf<undefined>()
    })

    it('should resolve awaited handles with the same plain handle', async () => {
      const ensured = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })
      const fetched = await experimental_fetchHandle(queryClient, viewerQuery)

      expectTypeOf(ensured).toEqualTypeOf<
        experimental_QueryHandle<typeof postQuery>
      >()
      expectTypeOf(fetched).toEqualTypeOf<
        experimental_QueryHandle<typeof viewerQuery>
      >()
      expectTypeOf(ensured).not.toHaveProperty('data')
    })
  })

  describe('experimental_fromHandle', () => {
    it('should type useQuery data as possibly undefined for handles from every verb', async () => {
      const prefetched = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })
      const ensured = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })
      const fetched = await experimental_fetchHandle(queryClient, postQuery, {
        id: '1',
      })
      const waterfall = experimental_waterfallHandle(postQuery, { id: '1' })

      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, prefetched)).data,
      ).toEqualTypeOf<Post | undefined>()
      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, ensured)).data,
      ).toEqualTypeOf<Post | undefined>()
      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, fetched)).data,
      ).toEqualTypeOf<Post | undefined>()
      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, waterfall)).data,
      ).toEqualTypeOf<Post | undefined>()
    })

    it('should type useSuspenseQuery data as defined for handles from every verb', async () => {
      const prefetched = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })
      const ensured = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })
      const fetched = await experimental_fetchHandle(queryClient, postQuery, {
        id: '1',
      })
      const waterfall = experimental_waterfallHandle(postQuery, { id: '1' })

      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, prefetched)).data,
      ).toEqualTypeOf<Post>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, ensured)).data,
      ).toEqualTypeOf<Post>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, fetched)).data,
      ).toEqualTypeOf<Post>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postQuery, waterfall)).data,
      ).toEqualTypeOf<Post>()
    })

    it('should keep useQuery data possibly undefined when read-site options are spread', async () => {
      const handle = await experimental_fetchHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery({
        ...experimental_fromHandle(postQuery, handle),
        select: (post) => post.title,
      })

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should accept keepPreviousData as placeholderData', () => {
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery({
        ...experimental_fromHandle(postQuery, handle),
        placeholderData: keepPreviousData,
      })

      expectTypeOf(data).toEqualTypeOf<Post | undefined>()
    })

    it('should work with infinite queries', () => {
      const handle = experimental_prefetchHandle(queryClient, feedQuery, {
        size: 1,
      })

      const { data } = useSuspenseInfiniteQuery(
        experimental_fromHandle(feedQuery, handle),
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
    })

    it('should type infinite data as possibly undefined for useInfiniteQuery and defined for useSuspenseInfiniteQuery', async () => {
      const handle = await experimental_ensureHandle(queryClient, feedQuery, {
        size: 1,
      })

      expectTypeOf(
        useInfiniteQuery(experimental_fromHandle(feedQuery, handle)).data,
      ).toEqualTypeOf<InfiniteData<Array<number>, unknown> | undefined>()
      expectTypeOf(
        useSuspenseInfiniteQuery(experimental_fromHandle(feedQuery, handle))
          .data,
      ).toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
    })

    it('should take no third argument', () => {
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
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
      const handle = experimental_prefetchHandle(queryClient, otherQuery, {
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

  describe('experimental_waterfallHandle', () => {
    it("should take the factory's input", () => {
      const handle = experimental_waterfallHandle(postQuery, { id: '1' })
      const viewer = experimental_waterfallHandle(viewerQuery)

      expectTypeOf(handle).toEqualTypeOf<
        experimental_QueryHandle<typeof postQuery>
      >()
      expectTypeOf(viewer.input).toEqualTypeOf<undefined>()
      // @ts-expect-error the input has the wrong shape
      experimental_waterfallHandle(postQuery, { id: 1 })
    })

    it('should switch a handle to a new input', () => {
      const handle = {} as experimental_QueryHandle<typeof postQuery>

      const next = experimental_waterfallHandle(postQuery, handle, (input) => {
        expectTypeOf(input).toEqualTypeOf<{ id: string }>()
        return { ...input, id: '2' }
      })

      expectTypeOf(next).toEqualTypeOf<
        experimental_QueryHandle<typeof postQuery>
      >()
      experimental_waterfallHandle(
        postQuery,
        handle,
        // @ts-expect-error the new input has the wrong shape
        () => ({ id: 2 }),
      )
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
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
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
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
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
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
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
      const handle = experimental_prefetchHandle(queryClient, feedQuery, {
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
      const prefetched = experimental_prefetchHandle(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )
      const ensured = await experimental_ensureHandle(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )
      const fetched = await experimental_fetchHandle(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )
      const waterfall = experimental_waterfallHandle(postTitleQuery, {
        id: '1',
      })

      expectTypeOf(
        useQuery(experimental_fromHandle(postTitleQuery, prefetched)).data,
      ).toEqualTypeOf<string | undefined>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postTitleQuery, ensured)).data,
      ).toEqualTypeOf<string>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postTitleQuery, fetched)).data,
      ).toEqualTypeOf<string>()
      expectTypeOf(
        useSuspenseQuery(experimental_fromHandle(postTitleQuery, waterfall))
          .data,
      ).toEqualTypeOf<string>()
    })

    it("should keep a selecting factory's cache data as the queryFn's data", async () => {
      const handle = await experimental_ensureHandle(
        queryClient,
        postTitleQuery,
        { id: '1' },
      )

      expectTypeOf(handle).toEqualTypeOf<
        experimental_QueryHandle<typeof postTitleQuery>
      >()
      expectTypeOf(handle.queryKey).toEqualTypeOf<
        readonly ['post-title', string]
      >()
      expectTypeOf(
        queryClient.getQueryData(postTitleQuery({ id: '1' }).queryKey),
      ).toEqualTypeOf<Post | undefined>()
    })

    it("should type data from an infinite factory's select", () => {
      const handle = experimental_prefetchHandle(queryClient, feedItemsQuery, {
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
      const handle = experimental_prefetchHandle(queryClient, postTitleQuery, {
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
})
