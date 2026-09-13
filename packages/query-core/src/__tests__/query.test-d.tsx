import { afterEach, beforeEach, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '..'
import type {
  CancelOptions,
  DefaultError,
  Query,
  QueryKey,
  QueryObserver,
  QueryOptions,
  QueryState,
} from '..'
import type {
  Action,
  FetchContext,
  FetchDirection,
  FetchMeta,
  FetchOptions,
  QueryBehavior,
  fetchState,
} from '../query'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('query', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()
  })

  afterEach(() => {
    queryClient.clear()
  })

  describe('QueryState', () => {
    it('should declare every field with its own type', () => {
      expectTypeOf<QueryState<{ value: string }, CustomError>>().toEqualTypeOf<{
        data: { value: string } | undefined
        dataUpdateCount: number
        dataUpdatedAt: number
        error: CustomError | null
        errorUpdateCount: number
        errorUpdatedAt: number
        fetchFailureCount: number
        fetchFailureReason: CustomError | null
        fetchMeta: FetchMeta | null
        isInvalidated: boolean
        status: 'pending' | 'error' | 'success'
        fetchStatus: 'fetching' | 'paused' | 'idle'
      }>()
    })

    it('should default its data to unknown and its error to the default error', () => {
      expectTypeOf<QueryState>().toEqualTypeOf<
        QueryState<unknown, DefaultError>
      >()
      expectTypeOf<QueryState['data']>().toEqualTypeOf<unknown>()
      expectTypeOf<QueryState['error']>().toEqualTypeOf<DefaultError | null>()
    })

    it('should keep every field required and writable', () => {
      type State = QueryState<{ value: string }, CustomError>
      type OptionalKeys = {
        [K in keyof State]-?: {} extends Pick<State, K> ? K : never
      }[keyof State]

      expectTypeOf<[OptionalKeys]>().toEqualTypeOf<[never]>()
      expectTypeOf<State>().toEqualTypeOf<{
        -readonly [K in keyof State]: State[K]
      }>()
    })
  })

  describe('FetchMeta', () => {
    it('should carry an optional fetchMore direction', () => {
      expectTypeOf<FetchMeta>().toEqualTypeOf<{
        fetchMore?: { direction: 'forward' | 'backward' }
      }>()
    })
  })

  describe('FetchDirection', () => {
    it('should be the forward and backward literals', () => {
      expectTypeOf<FetchDirection>().toEqualTypeOf<'forward' | 'backward'>()
    })
  })

  describe('FetchOptions', () => {
    it('should type its initialPromise from its data type', () => {
      expectTypeOf<FetchOptions<{ value: string }>>().toEqualTypeOf<{
        cancelRefetch?: boolean
        meta?: FetchMeta
        initialPromise?: Promise<{ value: string }>
      }>()
    })

    it('should default its data type to unknown', () => {
      expectTypeOf<FetchOptions['initialPromise']>().toEqualTypeOf<
        Promise<unknown> | undefined
      >()
    })
  })

  describe('QueryBehavior', () => {
    it('should type the fetch context given to onFetch', () => {
      const behavior: QueryBehavior<
        { value: string },
        CustomError,
        { value: string },
        readonly ['a', 1]
      > = {
        onFetch: (context, query) => {
          expectTypeOf(context).toEqualTypeOf<
            FetchContext<
              { value: string },
              CustomError,
              { value: string },
              readonly ['a', 1]
            >
          >()
          expectTypeOf(query).toEqualTypeOf<Query>()
        },
      }

      expectTypeOf(behavior.onFetch).returns.toEqualTypeOf<void>()
    })

    it('should declare onFetch as its only, required member', () => {
      expectTypeOf<keyof QueryBehavior>().toEqualTypeOf<'onFetch'>()
      expectTypeOf<QueryBehavior>().toEqualTypeOf<{
        onFetch: (
          context: FetchContext<unknown, DefaultError, unknown, QueryKey>,
          query: Query,
        ) => void
      }>()
    })

    it('should default its type parameters', () => {
      expectTypeOf<QueryBehavior>().toEqualTypeOf<
        QueryBehavior<unknown, DefaultError, unknown, QueryKey>
      >()
    })

    it('should default its data type to its query fn data type', () => {
      expectTypeOf<QueryBehavior<{ value: string }>>().toEqualTypeOf<
        QueryBehavior<
          { value: string },
          DefaultError,
          { value: string },
          QueryKey
        >
      >()
    })
  })

  describe('FetchContext', () => {
    it('should declare exactly its own keys', () => {
      type TestFetchContext = FetchContext<
        { value: string },
        CustomError,
        { value: string },
        readonly ['a', 1]
      >

      expectTypeOf<keyof TestFetchContext>().toEqualTypeOf<
        | 'fetchFn'
        | 'fetchOptions'
        | 'signal'
        | 'options'
        | 'client'
        | 'queryKey'
        | 'state'
      >()
    })

    it('should type its fetchFn, signal and client', () => {
      type TestFetchContext = FetchContext<
        { value: string },
        CustomError,
        { value: string },
        readonly ['a', 1]
      >

      expectTypeOf<TestFetchContext['fetchFn']>().toEqualTypeOf<
        () => unknown | Promise<unknown>
      >()
      expectTypeOf<TestFetchContext['signal']>().toEqualTypeOf<AbortSignal>()
      expectTypeOf<TestFetchContext['client']>().toEqualTypeOf<QueryClient>()
    })

    it('should type its fetchOptions as optional and data-agnostic', () => {
      type TestFetchContext = FetchContext<
        { value: string },
        CustomError,
        { value: string },
        readonly ['a', 1]
      >

      // `Pick` rather than an index access: `T['k']` strips the `?` modifier,
      // so an index access cannot tell `fetchOptions?: X` from
      // `fetchOptions: X | undefined`.
      expectTypeOf<Pick<TestFetchContext, 'fetchOptions'>>().toEqualTypeOf<{
        fetchOptions?: FetchOptions<unknown>
      }>()
    })

    it('should carry its data and error types into its state', () => {
      type TestFetchContext = FetchContext<
        { value: string },
        CustomError,
        { value: string },
        readonly ['a', 1]
      >

      expectTypeOf<TestFetchContext['state']>().toEqualTypeOf<
        QueryState<{ value: string }, CustomError>
      >()
    })

    it('should keep its own queryKey while widening the queryKey of its options', () => {
      type TestFetchContext = FetchContext<
        { value: string },
        CustomError,
        { value: string },
        readonly ['a', 1]
      >

      expectTypeOf<TestFetchContext['queryKey']>().toEqualTypeOf<
        readonly ['a', 1]
      >()
      expectTypeOf<TestFetchContext['options']>().toEqualTypeOf<
        QueryOptions<{ value: string }, CustomError, { value: string }, any>
      >()
    })
  })

  describe('Action', () => {
    it('should discriminate the failed action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'failed' }>
      >().toEqualTypeOf<{
        type: 'failed'
        failureCount: number
        error: CustomError
      }>()
    })

    it('should discriminate the fetch action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'fetch' }>
      >().toEqualTypeOf<{ type: 'fetch'; meta?: FetchMeta }>()
    })

    it('should discriminate the success action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'success' }>
      >().toEqualTypeOf<{
        data: { value: string } | undefined
        type: 'success'
        dataUpdatedAt?: number
        manual?: boolean
      }>()
    })

    it('should discriminate the error action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'error' }>
      >().toEqualTypeOf<{ type: 'error'; error: CustomError }>()
    })

    it('should discriminate the invalidate action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'invalidate' }>
      >().toEqualTypeOf<{ type: 'invalidate' }>()
    })

    it('should discriminate the pause action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'pause' }>
      >().toEqualTypeOf<{ type: 'pause' }>()
    })

    it('should discriminate the continue action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'continue' }>
      >().toEqualTypeOf<{ type: 'continue' }>()
    })

    it('should discriminate the setState action by its type literal', () => {
      expectTypeOf<
        Extract<Action<{ value: string }, CustomError>, { type: 'setState' }>
      >().toEqualTypeOf<{
        type: 'setState'
        state: Partial<QueryState<{ value: string }, CustomError>>
      }>()
    })

    it('should union exactly the eight action type literals', () => {
      expectTypeOf<
        Action<{ value: string }, CustomError>['type']
      >().toEqualTypeOf<
        | 'continue'
        | 'error'
        | 'failed'
        | 'fetch'
        | 'invalidate'
        | 'pause'
        | 'setState'
        | 'success'
      >()
    })
  })

  describe('fetchState', () => {
    it('should return the fetching fields it resets', () => {
      expectTypeOf<ReturnType<typeof fetchState>>().toEqualTypeOf<{
        readonly fetchFailureCount: 0
        readonly fetchFailureReason: null
        readonly fetchStatus: 'fetching' | 'paused'
        readonly error?: null
        readonly status?: 'pending'
      }>()
    })
  })

  describe('queryKey', () => {
    // A literal queryKey is preserved by `queryCache.build`, which is where
    // that inference happens and where it is asserted
    // (queryCache.test-d.tsx > build > should preserve a literal queryKey).
    it('should default to a readonly unknown array', () => {
      expectTypeOf<Query['queryKey']>().toEqualTypeOf<ReadonlyArray<unknown>>()
    })

    it('should carry the query key type parameter of its instance', () => {
      const query = queryClient
        .getQueryCache()
        .build<
          { value: string },
          CustomError,
          { value: string },
          ['k', number]
        >(queryClient, {
          queryKey: ['k', 1],
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.queryKey).toEqualTypeOf<['k', number]>()
    })
  })

  describe('queryHash', () => {
    it('should be typed as a string', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.queryHash).toEqualTypeOf<string>()
    })
  })

  describe('state', () => {
    it('should carry the data and error types of the query', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.state).toEqualTypeOf<
        QueryState<{ value: string }, CustomError>
      >()
    })
  })

  describe('options', () => {
    it('should carry the type parameters of the query', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.options).toEqualTypeOf<
        QueryOptions<
          { value: string },
          CustomError,
          { value: string },
          ReadonlyArray<unknown>
        >
      >()
      expectTypeOf(query.options.queryKey).toEqualTypeOf<
        ReadonlyArray<unknown> | undefined
      >()
      expectTypeOf<Extract<typeof query.options.retry, Function>>()
        .parameter(1)
        .toEqualTypeOf<CustomError>()
      expectTypeOf(query.options.initialData).toEqualTypeOf<
        { value: string } | (() => { value: string } | undefined) | undefined
      >()
    })

    it('should always be declared', () => {
      type Query_ = Query<{ value: string }, CustomError>
      type OptionalKeys = {
        [K in keyof Query_]-?: {} extends Pick<Query_, K> ? K : never
      }[keyof Query_]

      expectTypeOf<
        'options' extends OptionalKeys ? true : false
      >().toEqualTypeOf<false>()
    })
  })

  describe('meta', () => {
    it('should be typed as the query meta or undefined', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.meta).toEqualTypeOf<
        Record<string, unknown> | undefined
      >()
    })
  })

  describe('resetState', () => {
    it('should carry the data and error types of the query', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.resetState).toEqualTypeOf<
        QueryState<{ value: string }, CustomError>
      >()
    })
  })

  describe('queryType', () => {
    it('should be the infinite literal or undefined', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.queryType).toEqualTypeOf<'infinite' | undefined>()
    })
  })

  describe('promise', () => {
    it('should resolve with the data type or be undefined', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.promise).toEqualTypeOf<
        Promise<{ value: string }> | undefined
      >()
    })
  })

  describe('observers', () => {
    it('should be an array', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.observers).toEqualTypeOf<
        Array<QueryObserver<any, any, any, any, any>>
      >()
    })
  })

  describe('setData', () => {
    it('should return the data type it is given', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.setData).returns.toEqualTypeOf<{
        value: string
      }>()
      expectTypeOf(query.setData)
        .parameter(0)
        .toEqualTypeOf<{ value: string }>()
    })

    it('should require manual on the options it is given', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      query.setData({ value: 'data' })
      query.setData({ value: 'data' }, { manual: true, updatedAt: 1 })
      // @ts-expect-error manual is required when options are given
      query.setData({ value: 'data' }, { updatedAt: 1 })

      expectTypeOf(query.setData).parameters.toEqualTypeOf<
        [
          newData: { value: string },
          options?: { updatedAt?: number } & { manual: boolean },
        ]
      >()
    })

    it('should reject a data type other than its own', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      // @ts-expect-error the data must be the query data type
      query.setData('data')

      expectTypeOf(query.setData).parameter(0).toEqualTypeOf<{
        value: string
      }>()
    })
  })

  describe('setState', () => {
    it('should accept a partial state and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      query.setState({ status: 'success' })

      expectTypeOf(query.setState)
        .parameter(0)
        .toEqualTypeOf<Partial<QueryState<{ value: string }, CustomError>>>()
      expectTypeOf(query.setState).returns.toEqualTypeOf<void>()
    })

    it('should reject a state field that is not its own type', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      // @ts-expect-error the data must be the query data type
      query.setState({ data: 'data' })

      expectTypeOf(query.setState)
        .parameter(0)
        .toHaveProperty('data')
        .toEqualTypeOf<{ value: string } | undefined>()
    })
  })

  describe('cancel', () => {
    it('should resolve with void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.cancel).returns.toEqualTypeOf<Promise<void>>()
    })

    it('should only accept CancelOptions', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.cancel).parameters.toEqualTypeOf<
        [options?: CancelOptions]
      >()
      expectTypeOf<CancelOptions>().toEqualTypeOf<{
        revert?: boolean
        silent?: boolean
      }>()
    })
  })

  describe('destroy', () => {
    it('should take no arguments and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.destroy).parameters.toEqualTypeOf<[]>()
      expectTypeOf(query.destroy).returns.toEqualTypeOf<void>()
    })
  })

  describe('reset', () => {
    it('should take no arguments and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.reset).parameters.toEqualTypeOf<[]>()
      expectTypeOf(query.reset).returns.toEqualTypeOf<void>()
    })
  })

  describe('isActive', () => {
    it('should return a boolean', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.isActive).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('isDisabled', () => {
    it('should return a boolean', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.isDisabled).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('isFetched', () => {
    it('should return a boolean', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.isFetched).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('isStatic', () => {
    it('should return a boolean', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.isStatic).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('isStale', () => {
    it('should return a boolean', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.isStale).returns.toEqualTypeOf<boolean>()
    })
  })

  describe('isStaleByTime', () => {
    it('should return a boolean', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.isStaleByTime).returns.toEqualTypeOf<boolean>()
    })

    it('should only accept an optional stale time', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      query.isStaleByTime(1000)
      query.isStaleByTime('static')
      query.isStaleByTime()
      // @ts-expect-error a stale time must be a number or the static literal
      query.isStaleByTime('soon')

      expectTypeOf(query.isStaleByTime).parameters.toEqualTypeOf<
        [staleTime?: number | 'static']
      >()
    })
  })

  describe('getObserversCount', () => {
    it('should return a number', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.getObserversCount).returns.toEqualTypeOf<number>()
    })
  })

  describe('invalidate', () => {
    it('should take no arguments and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.invalidate).parameters.toEqualTypeOf<[]>()
      expectTypeOf(query.invalidate).returns.toEqualTypeOf<void>()
    })
  })

  describe('onFocus', () => {
    it('should take no arguments and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.onFocus).parameters.toEqualTypeOf<[]>()
      expectTypeOf(query.onFocus).returns.toEqualTypeOf<void>()
    })
  })

  describe('onOnline', () => {
    it('should take no arguments and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.onOnline).parameters.toEqualTypeOf<[]>()
      expectTypeOf(query.onOnline).returns.toEqualTypeOf<void>()
    })
  })

  describe('addObserver', () => {
    it('should take a single observer and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.addObserver).parameters.toEqualTypeOf<
        [observer: QueryObserver<any, any, any, any, any>]
      >()
      expectTypeOf(query.addObserver).returns.toEqualTypeOf<void>()
    })
  })

  describe('removeObserver', () => {
    it('should take a single observer and return void', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.removeObserver).parameters.toEqualTypeOf<
        [observer: QueryObserver<any, any, any, any, any>]
      >()
      expectTypeOf(query.removeObserver).returns.toEqualTypeOf<void>()
    })
  })

  describe('setOptions', () => {
    it('should accept the query options or nothing', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      query.setOptions()
      query.setOptions({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })
      query.setOptions({
        queryKey: queryKey(),
        // @ts-expect-error the queryFn must return the query data type
        queryFn: () => 42,
      })

      expectTypeOf(query.setOptions).returns.toEqualTypeOf<void>()
    })
  })

  describe('fetch', () => {
    it('should resolve with the query data type', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.fetch).returns.toEqualTypeOf<
        Promise<{ value: string }>
      >()
    })

    it('should resolve with its data type while typing its fetch options from its query fn data type', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError, number>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      expectTypeOf(query.fetch).returns.toEqualTypeOf<Promise<number>>()
      expectTypeOf(query.fetch).parameters.toEqualTypeOf<
        [
          options?: QueryOptions<
            { value: string },
            CustomError,
            number,
            ReadonlyArray<unknown>
          >,
          fetchOptions?: FetchOptions<{ value: string }>,
        ]
      >()
    })

    it('should accept the query options or nothing', () => {
      const query = queryClient
        .getQueryCache()
        .build<{ value: string }, CustomError>(queryClient, {
          queryKey: queryKey(),
          queryFn: () => Promise.resolve({ value: 'data' }),
        })

      query.fetch()
      query.fetch({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve({ value: 'data' }),
      })
      query.fetch({
        queryKey: queryKey(),
        // @ts-expect-error the queryFn must return the query data type
        queryFn: () => 42,
      })

      expectTypeOf(query.fetch)
        .parameter(0)
        .toEqualTypeOf<
          | QueryOptions<
              { value: string },
              CustomError,
              { value: string },
              ReadonlyArray<unknown>
            >
          | undefined
        >()
    })
  })

  describe('Query', () => {
    it('should default its type parameters', () => {
      expectTypeOf<Query>().toEqualTypeOf<
        Query<unknown, DefaultError, unknown, QueryKey>
      >()
    })

    it('should derive its data type from its query fn data type', () => {
      expectTypeOf<Query<{ value: string }>>().toEqualTypeOf<
        Query<{ value: string }, DefaultError, { value: string }, QueryKey>
      >()
    })

    it('should keep its own fields writable', () => {
      type Fields = Pick<Query, 'queryKey' | 'queryHash' | 'options' | 'state'>

      expectTypeOf<Fields>().toEqualTypeOf<{
        -readonly [K in keyof Fields]: Fields[K]
      }>()
    })

    it('should declare exactly its public members', () => {
      expectTypeOf<keyof Query>().toEqualTypeOf<
        | 'queryKey'
        | 'queryHash'
        | 'options'
        | 'state'
        | 'observers'
        | 'meta'
        | 'promise'
        | 'queryType'
        | 'resetState'
        | 'gcTime'
        | 'setOptions'
        | 'setData'
        | 'setState'
        | 'cancel'
        | 'destroy'
        | 'reset'
        | 'isActive'
        | 'isDisabled'
        | 'isFetched'
        | 'isStatic'
        | 'isStale'
        | 'isStaleByTime'
        | 'onFocus'
        | 'onOnline'
        | 'addObserver'
        | 'removeObserver'
        | 'getObserversCount'
        | 'invalidate'
        | 'fetch'
      >()
    })
  })
})
