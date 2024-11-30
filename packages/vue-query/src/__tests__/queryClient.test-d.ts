import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import type {
  DataTag,
  DefaultError,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  InfiniteData,
  InvalidateQueryFilters,
  MutationOptions,
  QueryFilters,
  QueryOptions,
} from '@tanstack/query-core'

describe('getQueryData', () => {
  it('should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer unknown if key is not tagged', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(queryKey)

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer passed generic if passed', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryData<number>(queryKey)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should only allow Arrays to be passed', () => {
    const queryKey = 'key'
    const queryClient = new QueryClient()
    // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'QueryKey'
    return queryClient.getQueryData(queryKey)
  })
})

describe('setQueryData', () => {
  it('updater should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<number | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('value should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()

    // @ts-expect-error value should be a number
    queryClient.setQueryData(queryKey, '1')

    // @ts-expect-error value should be a number
    queryClient.setQueryData(queryKey, () => '1')

    const data = queryClient.setQueryData(queryKey, 1)

    expectTypeOf(data).toEqualTypeOf<number | undefined>()
  })

  it('should infer unknown for updater if key is not tagged', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<unknown>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer unknown for value if key is not tagged', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData(queryKey, 'foo')

    expectTypeOf(data).toEqualTypeOf<unknown>()
  })

  it('should infer passed generic if passed', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData<string>(queryKey, (prev) => {
      expectTypeOf(prev).toEqualTypeOf<string | undefined>()
      return prev
    })
    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })

  it('should infer passed generic for value', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.setQueryData<string>(queryKey, 'foo')

    expectTypeOf(data).toEqualTypeOf<string | undefined>()
  })
})

describe('fetchInfiniteQuery', () => {
  it('should allow passing pages', async () => {
    const data = await new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      getNextPageParam: () => 1,
      initialPageParam: 1,
      pages: 5,
    })

    expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
  })

  it('should not allow passing getNextPageParam without pages', () => {
    new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      getNextPageParam: () => 1,
    })
  })

  it('should not allow passing pages without getNextPageParam', () => {
    // @ts-expect-error Property 'getNextPageParam' is missing
    new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      pages: 5,
    })
  })
})

describe('fully typed usage', () => {
  it('type-checks various methods with data & error included in the type', () => {
    type Data = { foo: string }
    type Error = DefaultError & { bar: string }
    const queryOptions: EnsureQueryDataOptions<Data, Error> = {
      queryKey: ['key'] as any,
    }
    const fetchInfiniteQueryOptions: FetchInfiniteQueryOptions<Data, Error> = {
      queryKey: ['key'] as any,
      getNextPageParam() {},
      initialPageParam: 0,
    }
    const mutationOptions: MutationOptions<Data, Error> = {}
    const filters: QueryFilters<Data, Error> = {}
    const mutationKey = mutationOptions.mutationKey!
    const queryKey = filters.queryKey!

    const queryClient = new QueryClient()

    queryClient.getQueryState(queryKey)
    queryClient.invalidateQueries(filters)
    queryClient.isFetching(filters)
    queryClient.isMutating(filters)
    queryClient.getQueryData(queryKey)
    queryClient.ensureQueryData(queryOptions)
    queryClient.getQueriesData(filters)
    queryClient.setQueryData(queryKey, { foo: '' })
    queryClient.setQueriesData(filters, () => ({ foo: '' }))
    queryClient.getQueryState(queryKey)
    queryClient.removeQueries(filters)
    queryClient.resetQueries(filters)
    queryClient.cancelQueries(filters)
    queryClient.invalidateQueries(filters)
    queryClient.refetchQueries(filters)
    queryClient.fetchQuery(queryOptions)
    queryClient.prefetchQuery(queryOptions)
    queryClient.fetchInfiniteQuery(fetchInfiniteQueryOptions)
    queryClient.prefetchInfiniteQuery(fetchInfiniteQueryOptions)
    queryClient.ensureInfiniteQueryData(fetchInfiniteQueryOptions)
    queryClient.setQueryDefaults(queryKey, {} as any)
    queryClient.getQueryDefaults(queryKey)
    queryClient.setMutationDefaults(mutationKey, {})
    queryClient.getMutationDefaults(mutationKey)
    queryClient.defaultQueryOptions(queryOptions)
    queryClient.defaultMutationOptions(mutationOptions)
  })
})
