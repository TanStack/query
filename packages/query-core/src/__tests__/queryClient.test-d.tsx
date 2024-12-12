import { describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import type { MutationFilters, QueryFilters, Updater } from '../utils'
import type { Mutation } from '../mutation'
import type { Query, QueryState } from '../query'
import type {
  DataTag,
  DefaultError,
  DefaultedQueryObserverOptions,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  InfiniteData,
  MutationOptions,
  OmitKeyof,
  QueryKey,
  QueryObserverOptions,
} from '../types'

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

describe('getQueryState', () => {
  it('should be loose typed without tag', () => {
    const queryKey = ['key'] as const
    const queryClient = new QueryClient()
    const data = queryClient.getQueryState(queryKey)

    expectTypeOf(data).toEqualTypeOf<QueryState<unknown, Error> | undefined>()
  })

  it('should be typed if key is tagged', () => {
    const queryKey = ['key'] as DataTag<Array<string>, number>
    const queryClient = new QueryClient()
    const data = queryClient.getQueryState(queryKey)

    expectTypeOf(data).toEqualTypeOf<QueryState<number, Error> | undefined>()
  })

  it('should be typed including error if key is tagged', () => {
    type CustomError = Error & { customError: string }
    const queryKey = ['key'] as DataTag<Array<string>, number, CustomError>
    const queryClient = new QueryClient()
    const data = queryClient.getQueryState(queryKey)

    expectTypeOf(data).toEqualTypeOf<
      QueryState<number, CustomError> | undefined
    >()
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
    return new QueryClient().fetchInfiniteQuery({
      queryKey: ['key'],
      queryFn: () => Promise.resolve('string'),
      initialPageParam: 1,
      pages: 5,
    })
  })
})

describe('defaultOptions', () => {
  it('should have a typed QueryFunctionContext', () => {
    new QueryClient({
      defaultOptions: {
        queries: {
          queryFn: (context) => {
            expectTypeOf(context).toEqualTypeOf<{
              queryKey: QueryKey
              meta: Record<string, unknown> | undefined
              signal: AbortSignal
              pageParam?: unknown
              direction?: unknown
            }>()
            return Promise.resolve('data')
          },
        },
      },
    })
  })
})

describe('fully typed usage', () => {
  it('type-checks various methods with data & error included in the type', async () => {
    const queryClient = new QueryClient()

    type TData = { foo: string }
    type TError = DefaultError & { bar: string }

    //
    // Construct typed arguments
    //

    const queryOptions: EnsureQueryDataOptions<TData, TError> = {
      queryKey: ['key'] as any,
    }
    const fetchInfiniteQueryOptions: FetchInfiniteQueryOptions<TData, TError> =
      {
        queryKey: ['key'] as any,
        pages: 5,
        getNextPageParam: (lastPage) => {
          expectTypeOf(lastPage).toEqualTypeOf<TData>()
          return 0
        },
        initialPageParam: 0,
      }
    const mutationOptions: MutationOptions<TData, TError> = {}

    const queryFilters: QueryFilters<
      TData,
      TError,
      TData,
      QueryKey & DataTag<unknown, TData, TError>
    > = {
      predicate(query) {
        expectTypeOf(query).toEqualTypeOf<
          Query<
            TData,
            TError,
            TData,
            QueryKey & DataTag<unknown, TData, TError>
          >
        >()
        expectTypeOf(query.state.data).toEqualTypeOf<TData | undefined>()
        expectTypeOf(query.state.error).toEqualTypeOf<TError | null>()
        return false
      },
    }
    const queryKey = queryFilters.queryKey!

    const mutationFilters: MutationFilters<TData, TError> = {
      predicate(mutation) {
        expectTypeOf(mutation).toEqualTypeOf<Mutation<TData, TError>>()
        expectTypeOf(mutation.state.data).toEqualTypeOf<TData | undefined>()
        expectTypeOf(mutation.state.error).toEqualTypeOf<TError | null>()
        return false
      },
    }
    const mutationKey = mutationOptions.mutationKey!

    //
    // Method type tests
    //

    const state = queryClient.getQueryState(queryKey)
    expectTypeOf(state).toEqualTypeOf<QueryState<TData, TError> | undefined>()

    const queryData1 = queryClient.getQueryData(queryKey)
    expectTypeOf(queryData1).toEqualTypeOf<TData | undefined>()

    const queryData2 = await queryClient.ensureQueryData(queryOptions)
    expectTypeOf(queryData2).toEqualTypeOf<TData>()

    const queriesData = queryClient.getQueriesData(queryFilters)
    expectTypeOf(queriesData).toEqualTypeOf<
      Array<[QueryKey, TData | undefined]>
    >()

    const queryData3 = queryClient.setQueryData(queryKey, { foo: '' })
    type SetQueryDataUpdaterArg = Parameters<
      typeof queryClient.setQueryData<unknown, typeof queryKey>
    >[1]

    expectTypeOf<SetQueryDataUpdaterArg>().toEqualTypeOf<
      Updater<TData | undefined, TData | undefined>
    >()
    expectTypeOf(queryData3).toEqualTypeOf<TData | undefined>()

    const queriesData2 = queryClient.setQueriesData(queryFilters, { foo: '' }) // TODO: types here are wrong and coming up undefined
    type SetQueriesDataUpdaterArg = Parameters<
      typeof queryClient.setQueriesData<unknown, typeof queryFilters>
    >[1]

    expectTypeOf<SetQueriesDataUpdaterArg>().toEqualTypeOf<
      Updater<TData | undefined, TData | undefined>
    >()
    expectTypeOf(queriesData2).toEqualTypeOf<
      Array<[QueryKey, TData | undefined]>
    >()

    const queryState = queryClient.getQueryState(queryKey)
    expectTypeOf(queryState).toEqualTypeOf<
      QueryState<TData, TError> | undefined
    >()

    const fetchedQuery = await queryClient.fetchQuery(queryOptions)
    expectTypeOf(fetchedQuery).toEqualTypeOf<TData>()

    queryClient.prefetchQuery(queryOptions)

    const infiniteQuery = await queryClient.fetchInfiniteQuery(
      fetchInfiniteQueryOptions,
    )
    expectTypeOf(infiniteQuery).toEqualTypeOf<InfiniteData<TData, unknown>>()

    const infiniteQueryData = await queryClient.ensureInfiniteQueryData(
      fetchInfiniteQueryOptions,
    )
    expectTypeOf(infiniteQueryData).toEqualTypeOf<
      InfiniteData<TData, unknown>
    >()

    const defaultQueryOptions = queryClient.defaultQueryOptions(queryOptions)
    expectTypeOf(defaultQueryOptions).toEqualTypeOf<
      DefaultedQueryObserverOptions<TData, TError, TData, TData, QueryKey>
    >()

    const mutationOptions2 = queryClient.defaultMutationOptions(mutationOptions)
    expectTypeOf(mutationOptions2).toEqualTypeOf<
      MutationOptions<TData, TError, void, unknown>
    >()

    queryClient.setMutationDefaults(mutationKey, {
      onSettled(data, error, variables, context) {
        expectTypeOf(data).toEqualTypeOf<unknown>()
        expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
        expectTypeOf(variables).toEqualTypeOf<void>()
        expectTypeOf(context).toEqualTypeOf<unknown>()
      },
    })

    const queryDefaults = queryClient.getQueryDefaults(queryKey)
    expectTypeOf(queryDefaults).toEqualTypeOf<
      OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'>
    >()

    // Voids and Untyped returns
    queryClient.invalidateQueries(queryFilters)
    queryClient.isFetching(queryFilters)
    queryClient.isMutating(mutationFilters)
    queryClient.removeQueries(queryFilters)
    queryClient.resetQueries(queryFilters)
    queryClient.cancelQueries(queryFilters)
    queryClient.invalidateQueries(queryFilters)
    queryClient.refetchQueries(queryFilters)
    queryClient.prefetchInfiniteQuery(fetchInfiniteQueryOptions)
    queryClient.setQueryDefaults(queryKey, {} as any)
    queryClient.getMutationDefaults(mutationKey)
  })

  it('type-checks various methods with untyped arguments', async () => {
    const queryClient = new QueryClient()

    //
    // Construct typed arguments
    //

    const queryOptions: EnsureQueryDataOptions = {
      queryKey: ['key'] as any,
    }
    const fetchInfiniteQueryOptions: FetchInfiniteQueryOptions = {
      queryKey: ['key'] as any,
      pages: 5,
      getNextPageParam: (lastPage) => {
        expectTypeOf(lastPage).toEqualTypeOf<unknown>()
        return 0
      },
      initialPageParam: 0,
    }
    const mutationOptions: MutationOptions = {}

    const queryFilters: QueryFilters = {
      predicate(query) {
        expectTypeOf(query).toEqualTypeOf<Query<unknown, DefaultError>>()
        expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
        expectTypeOf(query.state.error).toEqualTypeOf<DefaultError | null>()
        return false
      },
    }
    const queryKey = queryFilters.queryKey!

    const mutationFilters: MutationFilters = {
      predicate(mutation) {
        expectTypeOf(mutation).toEqualTypeOf<Mutation>()
        expectTypeOf(mutation.state.data).toEqualTypeOf<unknown>()
        expectTypeOf(mutation.state.error).toEqualTypeOf<DefaultError | null>()
        return false
      },
    }
    const mutationKey = mutationOptions.mutationKey!

    //
    // Method type tests
    //

    const state = queryClient.getQueryState(queryKey)
    expectTypeOf(state).toEqualTypeOf<
      QueryState<unknown, DefaultError> | undefined
    >()

    const queryData1 = queryClient.getQueryData(queryKey)
    expectTypeOf(queryData1).toEqualTypeOf<unknown>()

    const queryData2 = await queryClient.ensureQueryData(queryOptions)
    expectTypeOf(queryData2).toEqualTypeOf<unknown>()

    const queriesData = queryClient.getQueriesData(queryFilters)
    expectTypeOf(queriesData).toEqualTypeOf<Array<[QueryKey, unknown]>>()

    const queryData3 = queryClient.setQueryData(queryKey, { foo: '' })
    type SetQueryDataUpdaterArg = Parameters<
      typeof queryClient.setQueryData<unknown, typeof queryKey>
    >[1]

    expectTypeOf<SetQueryDataUpdaterArg>().toEqualTypeOf<
      Updater<unknown, unknown>
    >()
    expectTypeOf(queryData3).toEqualTypeOf<unknown>()

    const queriesData2 = queryClient.setQueriesData(queryFilters, { foo: '' }) // TODO: types here are wrong and coming up undefined
    type SetQueriesDataUpdaterArg = Parameters<
      typeof queryClient.setQueriesData<unknown, typeof queryFilters>
    >[1]

    expectTypeOf<SetQueriesDataUpdaterArg>().toEqualTypeOf<
      Updater<unknown, unknown>
    >()
    expectTypeOf(queriesData2).toEqualTypeOf<Array<[QueryKey, unknown]>>()

    const queryState = queryClient.getQueryState(queryKey)
    expectTypeOf(queryState).toEqualTypeOf<
      QueryState<unknown, DefaultError> | undefined
    >()

    const fetchedQuery = await queryClient.fetchQuery(queryOptions)
    expectTypeOf(fetchedQuery).toEqualTypeOf<unknown>()

    queryClient.prefetchQuery(queryOptions)

    const infiniteQuery = await queryClient.fetchInfiniteQuery(
      fetchInfiniteQueryOptions,
    )
    expectTypeOf(infiniteQuery).toEqualTypeOf<InfiniteData<unknown, unknown>>()

    const infiniteQueryData = await queryClient.ensureInfiniteQueryData(
      fetchInfiniteQueryOptions,
    )
    expectTypeOf(infiniteQueryData).toEqualTypeOf<
      InfiniteData<unknown, unknown>
    >()

    const defaultQueryOptions = queryClient.defaultQueryOptions(queryOptions)
    expectTypeOf(defaultQueryOptions).toEqualTypeOf<
      DefaultedQueryObserverOptions<
        unknown,
        DefaultError,
        unknown,
        unknown,
        QueryKey
      >
    >()

    const mutationOptions2 = queryClient.defaultMutationOptions(mutationOptions)
    expectTypeOf(mutationOptions2).toEqualTypeOf<
      MutationOptions<unknown, DefaultError, void, unknown>
    >()

    queryClient.setMutationDefaults(mutationKey, {
      onSettled(data, error, variables, context) {
        expectTypeOf(data).toEqualTypeOf<unknown>()
        expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
        expectTypeOf(variables).toEqualTypeOf<void>()
        expectTypeOf(context).toEqualTypeOf<unknown>()
      },
    })

    const queryDefaults = queryClient.getQueryDefaults(queryKey)
    expectTypeOf(queryDefaults).toEqualTypeOf<
      OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'>
    >()

    // Voids and Untyped returns
    queryClient.invalidateQueries(queryFilters)
    queryClient.isFetching(queryFilters)
    queryClient.isMutating(mutationFilters)
    queryClient.removeQueries(queryFilters)
    queryClient.resetQueries(queryFilters)
    queryClient.cancelQueries(queryFilters)
    queryClient.invalidateQueries(queryFilters)
    queryClient.refetchQueries(queryFilters)
    queryClient.prefetchInfiniteQuery(fetchInfiniteQueryOptions)
    queryClient.setQueryDefaults(queryKey, {} as any)
    queryClient.getMutationDefaults(mutationKey)
  })
})
