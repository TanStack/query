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

    it('should type select from the factory when read-site options are spread', () => {
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
})
