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
import type {
  InfiniteData,
  experimental_QueryHandle,
  experimental_QueryHandleWithData,
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

    it('should resolve awaited handles with defined data', async () => {
      const ensured = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })
      const fetched = await experimental_fetchHandle(queryClient, viewerQuery)

      expectTypeOf(ensured.data).toEqualTypeOf<Post>()
      expectTypeOf(ensured.dataUpdatedAt).toEqualTypeOf<number>()
      expectTypeOf(fetched.data).toEqualTypeOf<{ name: string }>()
    })

    it('should type infinite handles with InfiniteData', async () => {
      const handle = await experimental_ensureHandle(queryClient, feedQuery, {
        size: 1,
      })

      expectTypeOf(handle.data).toEqualTypeOf<
        InfiniteData<Array<number>, number>
      >()
    })
  })

  describe('experimental_fromHandle', () => {
    it('should type useQuery data as possibly undefined for a prefetched handle', () => {
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery(experimental_fromHandle(postQuery, handle))

      expectTypeOf(data).toEqualTypeOf<Post | undefined>()
    })

    it('should type useQuery data as defined for an awaited handle', async () => {
      const handle = await experimental_fetchHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery(experimental_fromHandle(postQuery, handle))

      expectTypeOf(data).toEqualTypeOf<Post>()
    })

    it('should type useSuspenseQuery data as defined for any handle', () => {
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useSuspenseQuery(
        experimental_fromHandle(postQuery, handle),
      )

      expectTypeOf(data).toEqualTypeOf<Post>()
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

    it('should keep the data of an awaited handle defined when read-site options are spread', async () => {
      const handle = await experimental_ensureHandle(queryClient, postQuery, {
        id: '1',
      })

      const { data } = useQuery({
        ...experimental_fromHandle(postQuery, handle),
        select: (post) => {
          expectTypeOf(post).toEqualTypeOf<Post>()
          return post.title
        },
        refetchInterval: 1000,
      })

      expectTypeOf(data).toEqualTypeOf<string>()
    })

    it('should keep the data of a prefetched handle possibly undefined when read-site options are spread', () => {
      const handle = experimental_prefetchHandle(queryClient, postQuery, {
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

    it('should pass the pages of an awaited infinite handle on as initialData', async () => {
      const handle = await experimental_ensureHandle(queryClient, feedQuery, {
        size: 1,
      })

      expectTypeOf(
        useInfiniteQuery(experimental_fromHandle(feedQuery, handle)).data,
      ).toEqualTypeOf<InfiniteData<Array<number>, unknown>>()
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
      const withData = {} as experimental_QueryHandleWithData<typeof postQuery>

      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, handle)).data,
      ).toEqualTypeOf<Post | undefined>()
      expectTypeOf(
        useQuery(experimental_fromHandle(postQuery, withData)).data,
      ).toEqualTypeOf<Post>()
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
