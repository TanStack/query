import { assertType, describe, expectTypeOf, it } from 'vitest'
import {
  cancelQueries,
  clearQueryClient,
  countFetchingQueries,
  defaultMutationOptions,
  defaultQueryOptions,
  query as fetchQueryData,
  findCachedQueries,
  getDefaultOptions,
  getMutationCache,
  getMutationDefaults,
  getQueriesData,
  getQueryCache,
  getQueryData,
  getQueryDefaults,
  getQueryState,
  infiniteQuery,
  invalidateQueries,
  isMutating,
  mountQueryClient,
  refetchQueries,
  removeQueries,
  resetQueries,
  resumePausedMutations,
  select,
  setMutationDefaults,
  setQueriesData,
  setQueryData,
  setQueryDefaults,
  unmountQueryClient,
} from '..'
import { QueryClient } from '../queryClient'
import { skipToken } from '../utils'
import { optionalSelect } from './helpers/projection'
import type { setDefaultOptions } from '..'
import type { Mutation } from '../mutation'
import type { MutationCache } from '../mutationCache'
import type { Query, QueryState } from '../query'
import type { QueryCache } from '../queryCache'
import type {
  DataTag,
  DefaultError,
  DefaultOptions,
  DefaultedQueryObserverOptions,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  MutationFunctionContext,
  MutationKey,
  MutationObserverOptions,
  MutationOptions,
  OmitKeyof,
  QueryClientConfig,
  QueryExecuteOptions,
  QueryFunction,
  QueryKey,
  QueryObserverOptionsBase,
  SetDataOptions,
  UnsetMarker,
} from '../types'
import type { MutationFilters, QueryFilters, Updater } from '../utils'

type OperationArgs<
  TOperation extends (...args: Array<never>) => unknown,
  TClient,
> = Parameters<TOperation> extends [TClient, ...infer TArgs] ? TArgs : never

type TypedData = { foo: string }
type TypedError = DefaultError & { bar: string }

const typedInfiniteQueryOptions: InfiniteQueryExecuteOptions<
  TypedData,
  TypedError,
  InfiniteData<TypedData>
> = {
  queryKey: ['key', 'infinite'],
  pages: 5,
  getNextPageParam: (lastPage) => {
    expectTypeOf(lastPage).toEqualTypeOf<TypedData>()
    return 0
  },
  initialPageParam: 0,
}

const typedMutationOptions: MutationOptions<TypedData, TypedError> = {}

const typedQueryFilters: QueryFilters<
  DataTag<QueryKey, TypedData, TypedError>
> = {}

const typedMutationFilters: MutationFilters<TypedData, TypedError> = {}

const typedFilterKey = typedQueryFilters.queryKey!
const typedMutationKey = typedMutationOptions.mutationKey!

const typedQueryOptions: QueryExecuteOptions<TypedData, TypedError> = {
  queryKey: ['key', 'query'],
}

const untypedQueryOptions: QueryExecuteOptions = {
  queryKey: ['key'],
}

const untypedInfiniteQueryOptions: InfiniteQueryExecuteOptions = {
  queryKey: ['key'],
  pages: 5,
  getNextPageParam: (lastPage) => {
    expectTypeOf(lastPage).toEqualTypeOf<unknown>()
    return 0
  },
  initialPageParam: 0,
}

const untypedMutationOptions: MutationOptions = {}
const untypedQueryFilters: QueryFilters = {}
const untypedMutationFilters: MutationFilters = {}
const untypedFilterKey = untypedQueryFilters.queryKey!
const untypedMutationKey = untypedMutationOptions.mutationKey!

type SuccessCallback = () => unknown

describe('queryClient', () => {
  describe('getQueryData', () => {
    it('should be typed if key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = getQueryData(queryClient, key)

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should infer unknown if key is not tagged', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = getQueryData(queryClient, key)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })

    it('should infer passed generic if passed', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = getQueryData<number>(queryClient, key)

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should only allow Arrays to be passed', () => {
      assertType<OperationArgs<typeof getQueryData, QueryClient>>([
        // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'QueryKey'
        { queryKey: 'key' },
      ])
    })

    it('should resolve the data type from a tagged filter key', () => {
      const queryClient = new QueryClient()
      const data = getQueryData(queryClient, typedFilterKey)

      expectTypeOf(data).toEqualTypeOf<TypedData | undefined>()
    })

    it('should resolve unknown from an untyped filter key', () => {
      const queryClient = new QueryClient()
      const data = getQueryData(queryClient, untypedFilterKey)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })
  })

  describe('setQueryData', () => {
    it('should type the updater if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = setQueryData(queryClient, key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<number | undefined>()
        return prev
      })

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should type the value if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      // @ts-expect-error value should be a number
      setQueryData(queryClient, key, '1')

      // @ts-expect-error value should be a number
      setQueryData(queryClient, key, () => '1')

      const data = setQueryData(queryClient, key, 1)

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should infer unknown for updater if key is not tagged', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = setQueryData(queryClient, key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<unknown>()
        return prev
      })

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })

    it('should infer unknown for value if key is not tagged', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = setQueryData(queryClient, key, 'foo')

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })

    it('should infer passed generic if passed', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = setQueryData<string>(queryClient, key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<string | undefined>()
        return prev
      })

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should infer passed generic for value', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = setQueryData<string>(queryClient, key, 'foo')

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should preserve updater parameter type inference when used in functions with explicit return types', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      // Simulate usage inside a function with explicit return type
      // The outer function returns 'unknown' but this shouldn't affect the updater's type inference
      ;(() =>
        setQueryData(queryClient, key, (data) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          return data
        })) satisfies () => unknown
    })

    it('should infer the updater parameter inside an expression body arrow function', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      const callbackTest: SuccessCallback = () =>
        setQueryData(queryClient, key, (data) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          return data
        })
      expectTypeOf(callbackTest).toEqualTypeOf<SuccessCallback>()
    })

    it('should infer the updater parameter inside a block body arrow function', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      const callbackTest2: SuccessCallback = () => {
        setQueryData(queryClient, key, (data) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          return data
        })
      }
      expectTypeOf(callbackTest2).toEqualTypeOf<SuccessCallback>()
    })

    it('should accept an optional SetDataOptions third argument', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      setQueryData(queryClient, key, 1)
      setQueryData(queryClient, key, 1, { updatedAt: 0 })

      type SetDataOptionsArg = OperationArgs<
        typeof setQueryData<number, typeof key>,
        typeof queryClient
      >[2]
      expectTypeOf<SetDataOptionsArg>().toEqualTypeOf<
        SetDataOptions | undefined
      >()
      expectTypeOf<NonNullable<SetDataOptionsArg>['updatedAt']>().toEqualTypeOf<
        number | undefined
      >()
    })

    it('should resolve the data type from a tagged filter key', () => {
      const queryClient = new QueryClient()

      // Type the value before passing it: TypeScript 5.4's `NoInfer` can't match
      // an inline object literal against the value branch of the `Updater` union
      // here, so it falls back to the function branch and reports the literal as
      // excess properties. Annotating sidesteps that (TS >= 5.5 handles it).
      const newData: TypedData = { foo: '' }
      const data = setQueryData(queryClient, typedFilterKey, newData)

      expectTypeOf(data).toEqualTypeOf<TypedData | undefined>()
      expectTypeOf<
        OperationArgs<
          typeof setQueryData<unknown, typeof typedFilterKey>,
          typeof queryClient
        >[1]
      >().toEqualTypeOf<Updater<TypedData | undefined, TypedData | undefined>>()
    })

    it('should resolve unknown from an untyped filter key', () => {
      const queryClient = new QueryClient()
      const data = setQueryData(queryClient, untypedFilterKey, { foo: '' })

      expectTypeOf(data).toEqualTypeOf<unknown>()
      expectTypeOf<
        OperationArgs<
          typeof setQueryData<unknown, typeof untypedFilterKey>,
          typeof queryClient
        >[1]
      >().toEqualTypeOf<Updater<unknown, unknown>>()
    })
  })

  describe('setQueriesData', () => {
    it('should resolve QueryKey and unknown for a tagged filter', () => {
      const queryClient = new QueryClient()
      // TODO: types here are wrong and coming up undefined
      const data = setQueriesData(queryClient, typedQueryFilters, { foo: '' })

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, unknown]>>()
      expectTypeOf<
        OperationArgs<
          typeof setQueriesData<unknown, typeof typedQueryFilters>,
          typeof queryClient
        >[1]
      >().toEqualTypeOf<Updater<unknown, unknown>>()
    })

    it('should resolve QueryKey and unknown for an untyped filter', () => {
      const queryClient = new QueryClient()
      // TODO: types here are wrong and coming up undefined
      const data = setQueriesData(queryClient, untypedQueryFilters, { foo: '' })

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, unknown]>>()
      expectTypeOf<
        OperationArgs<
          typeof setQueriesData<unknown, typeof untypedQueryFilters>,
          typeof queryClient
        >[1]
      >().toEqualTypeOf<Updater<unknown, unknown>>()
    })
  })

  describe('getQueryState', () => {
    it('should be loose typed without tag', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = getQueryState(queryClient, key)

      expectTypeOf(data).toEqualTypeOf<QueryState<unknown, Error> | undefined>()
    })

    it('should be typed if key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = getQueryState(queryClient, key)

      expectTypeOf(data).toEqualTypeOf<QueryState<number, Error> | undefined>()
    })

    it('should be typed including error if key is tagged', () => {
      type CustomError = Error & { customError: string }
      const key = ['key'] as DataTag<Array<string>, number, CustomError>
      const queryClient = new QueryClient()
      const data = getQueryState(queryClient, key)

      expectTypeOf(data).toEqualTypeOf<
        QueryState<number, CustomError> | undefined
      >()
    })

    it('should resolve the data and error from a tagged filter key', () => {
      const queryClient = new QueryClient()
      const state = getQueryState(queryClient, typedFilterKey)

      expectTypeOf(state).toEqualTypeOf<
        QueryState<TypedData, TypedError> | undefined
      >()
    })

    it('should resolve unknown and DefaultError from an untyped filter key', () => {
      const queryClient = new QueryClient()
      const state = getQueryState(queryClient, untypedFilterKey)

      expectTypeOf(state).toEqualTypeOf<
        QueryState<unknown, DefaultError> | undefined
      >()
    })
  })

  describe('query', () => {
    it('should allow passing select option', () => {
      const result = fetchQueryData(new QueryClient(), {
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        select: [select, (data) => data.length],
      })

      expectTypeOf(result).toEqualTypeOf<Promise<number>>()
    })

    it('should infer select type with skipToken queryFn', () => {
      const result = fetchQueryData(new QueryClient(), {
        queryKey: ['key'],
        queryFn: skipToken,
        select: optionalSelect((data: string) => data.length),
      })

      expectTypeOf(result).toEqualTypeOf<Promise<number | undefined>>()
    })

    it('should not allow enabled', () => {
      assertType<OperationArgs<typeof fetchQueryData, QueryClient>>([
        {
          queryKey: ['key'],
          queryFn: skipToken,
          // @ts-expect-error enabled is not supported for imperative queries
          enabled: false,
        },
      ])
    })

    it('should resolve with the data type', async () => {
      const queryClient = new QueryClient()
      const data = await fetchQueryData(queryClient, typedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<TypedData | undefined>()
    })

    it('should resolve with unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await fetchQueryData(queryClient, untypedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })
  })

  describe('infiniteQuery', () => {
    it('should allow passing select option', () => {
      const result = infiniteQuery(new QueryClient(), {
        queryKey: ['key'],
        queryFn: () => Promise.resolve({ count: 1 }),
        initialPageParam: 1,
        getNextPageParam: () => 2,
        select: [
          select,
          (data) => ({
            pages: data.pages.map((x) => `count: ${x.count}`),
          }),
        ],
      })

      expectTypeOf(result).toEqualTypeOf<Promise<{ pages: Array<string> }>>()
    })

    it('should allow passing pages', async () => {
      const result = await infiniteQuery(new QueryClient(), {
        queryKey: ['key'],
        queryFn: () => Promise.resolve({ count: 1 }),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        pages: 5,
      })

      expectTypeOf(result).toEqualTypeOf<
        InfiniteData<{ count: number }, number>
      >()
    })

    it('should type pages as an optional number', () => {
      expectTypeOf<
        InfiniteQueryExecuteOptions<
          { count: number },
          Error,
          unknown,
          QueryKey,
          number
        >['pages']
      >().toEqualTypeOf<number | undefined>()
    })

    it('should allow passing getNextPageParam without pages', () => {
      assertType<OperationArgs<typeof infiniteQuery, QueryClient>>([
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve({ count: 1 }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        },
      ])
    })

    it('should require getNextPageParam even without pages', () => {
      assertType<OperationArgs<typeof infiniteQuery, QueryClient>>([
        // @ts-expect-error Property 'getNextPageParam' is missing
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve('string'),
          initialPageParam: 1,
        },
      ])
    })

    it('should default its page param to unknown', () => {
      const queryClient = new QueryClient()
      const result = infiniteQuery(queryClient, {
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        getNextPageParam: () => 2,
      })

      expectTypeOf(result).toEqualTypeOf<
        Promise<InfiniteData<string, number>>
      >()

      type PageParam = OperationArgs<
        typeof infiniteQuery<string, Error>,
        typeof queryClient
      >[0]['initialPageParam']
      expectTypeOf<PageParam>().toEqualTypeOf<unknown>()
    })

    it('should resolve with InfiniteData of the data type', async () => {
      const queryClient = new QueryClient()
      const data = await infiniteQuery(queryClient, typedInfiniteQueryOptions)

      expectTypeOf(data).toEqualTypeOf<
        InfiniteData<TypedData, unknown> | undefined
      >()
    })

    it('should resolve with InfiniteData of unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await infiniteQuery(queryClient, untypedInfiniteQueryOptions)

      expectTypeOf(data).toEqualTypeOf<
        InfiniteData<unknown, unknown> | undefined
      >()
    })
  })

  describe('invalidateQueries', () => {
    it('should reject a non-array queryKey', () => {
      assertType<OperationArgs<typeof invalidateQueries, QueryClient>>([])
      assertType<OperationArgs<typeof invalidateQueries, QueryClient>>([
        { queryKey: ['1'] },
      ])
      assertType<OperationArgs<typeof invalidateQueries, QueryClient>>([
        // @ts-expect-error
        { queryKey: '1' },
      ])
    })

    it('should reject an object queryKey (#8684)', () => {
      assertType<OperationArgs<typeof invalidateQueries, QueryClient>>([
        // @ts-expect-error key is not an array
        { queryKey: { foo: true } },
      ])
    })

    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      invalidateQueries(queryClient, {
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(invalidateQueries(queryClient)).toEqualTypeOf<
        Promise<void>
      >()
    })

    it('should accept a refetchType that QueryFilters does not have', () => {
      type RefetchType = NonNullable<
        OperationArgs<typeof invalidateQueries, QueryClient>[0]
      >['refetchType']
      expectTypeOf<RefetchType>().toEqualTypeOf<
        'all' | 'active' | 'inactive' | 'none' | undefined
      >()
    })

    it('should accept the refetch options it inherits as its second argument', () => {
      expectTypeOf<
        NonNullable<OperationArgs<typeof invalidateQueries, QueryClient>[1]>
      >().toEqualTypeOf<{
        throwOnError?: boolean
        cancelRefetch?: boolean
      }>()
    })
  })

  describe('cancelQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      cancelQueries(queryClient, {
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<OperationArgs<typeof cancelQueries, QueryClient>>([])
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(cancelQueries(queryClient)).toEqualTypeOf<Promise<void>>()
    })
  })

  describe('removeQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      removeQueries(queryClient, {
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<OperationArgs<typeof removeQueries, QueryClient>>([])
    })

    it('should return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(removeQueries(queryClient)).toEqualTypeOf<void>()
    })
  })

  describe('refetchQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      refetchQueries(queryClient, {
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<OperationArgs<typeof refetchQueries, QueryClient>>([])
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(refetchQueries(queryClient)).toEqualTypeOf<Promise<void>>()
    })
  })

  describe('resetQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      resetQueries(queryClient, {
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<OperationArgs<typeof resetQueries, QueryClient>>([])
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(resetQueries(queryClient)).toEqualTypeOf<Promise<void>>()
    })

    it('should accept the refetch options it inherits as its second argument', () => {
      expectTypeOf<
        NonNullable<OperationArgs<typeof resetQueries, QueryClient>[1]>
      >().toEqualTypeOf<{
        throwOnError?: boolean
        cancelRefetch?: boolean
      }>()
    })
  })

  describe('isFetching', () => {
    it('should reject a fetchStatus filter', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        countFetchingQueries(queryClient, {
          queryKey: ['key'],
          // @ts-expect-error countFetchingQueries always filters by fetchStatus: 'fetching'
          fetchStatus: 'fetching',
        }),
      ).toEqualTypeOf<number>()
      expectTypeOf(
        countFetchingQueries(queryClient, {
          queryKey: ['key'],
          // @ts-expect-error countFetchingQueries always filters by fetchStatus: 'fetching'
          fetchStatus: 'paused',
        }),
      ).toEqualTypeOf<number>()
      expectTypeOf(
        countFetchingQueries(queryClient, {
          queryKey: ['key'],
          // @ts-expect-error countFetchingQueries always filters by fetchStatus: 'fetching'
          fetchStatus: 'idle',
        }),
      ).toEqualTypeOf<number>()
    })

    it('should accept the other query filters', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        countFetchingQueries(queryClient, {
          queryKey: ['key'],
          exact: true,
          type: 'active',
          stale: true,
          predicate: (query) => query.state.data !== undefined,
        }),
      ).toEqualTypeOf<number>()
    })

    it('should allow fetchStatus in query cache filters', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        findCachedQueries(getQueryCache(queryClient), {
          fetchStatus: 'paused',
        }),
      ).toBeArray()
    })

    it('should return a number', () => {
      const queryClient = new QueryClient()

      expectTypeOf(countFetchingQueries(queryClient)).toEqualTypeOf<number>()
      expectTypeOf(
        countFetchingQueries(queryClient, { queryKey: ['key'] }),
      ).toEqualTypeOf<number>()
    })

    it('should accept being called without filters', () => {
      assertType<OperationArgs<typeof countFetchingQueries, QueryClient>>([])
    })

    it('should reject an unknown filter property', () => {
      assertType<OperationArgs<typeof countFetchingQueries, QueryClient>>([
        // @ts-expect-error unknown filter properties are rejected
        { notAFilter: true },
      ])
    })
  })

  describe('isMutating', () => {
    it('should return a number', () => {
      const queryClient = new QueryClient()

      expectTypeOf(isMutating(queryClient)).toEqualTypeOf<number>()
      expectTypeOf(
        isMutating(queryClient, { mutationKey: ['key'] }),
      ).toEqualTypeOf<number>()
    })

    it('should accept being called without filters', () => {
      assertType<OperationArgs<typeof isMutating, QueryClient>>([])
    })

    it('should reject an unknown filter property', () => {
      assertType<OperationArgs<typeof isMutating, QueryClient>>([
        // @ts-expect-error unknown filter properties are rejected
        { notAFilter: true },
      ])
    })

    it('should accept typed and untyped mutation filters alike', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        isMutating(queryClient, typedMutationFilters),
      ).toEqualTypeOf<number>()
      expectTypeOf(
        isMutating(queryClient, untypedMutationFilters),
      ).toEqualTypeOf<number>()
    })

    it('should accept an explicit mutation filter type', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        isMutating<MutationFilters<TypedData, TypedError>>(queryClient, {
          predicate(mutation) {
            expectTypeOf(mutation).toEqualTypeOf<
              Mutation<TypedData, TypedError>
            >()
            expectTypeOf(mutation.state.data).toEqualTypeOf<
              TypedData | undefined
            >()
            expectTypeOf(
              mutation.state.error,
            ).toEqualTypeOf<TypedError | null>()
            return true
          },
        }),
      ).toEqualTypeOf<number>()
    })

    it('should reject a status filter', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        // @ts-expect-error isMutating always filters by status: 'pending'
        isMutating(queryClient, { mutationKey: ['key'], status: 'pending' }),
      ).toEqualTypeOf<number>()
    })
  })

  describe('getQueriesData', () => {
    it('should require filters', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        getQueriesData(queryClient, { queryKey: ['key'] }),
      ).toEqualTypeOf<Array<[QueryKey, unknown]>>()

      // @ts-expect-error filters are required
      getQueriesData(queryClient)
    })

    it('should infer the passed generic as the tuple data', () => {
      const queryClient = new QueryClient()
      const data = getQueriesData<number>(queryClient, { queryKey: ['key'] })

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, number | undefined]>>()
    })

    it('should widen the tuple to the filter key and unknown when tagged', () => {
      const queryClient = new QueryClient()
      const data = getQueriesData(queryClient, typedQueryFilters)

      expectTypeOf(data).toEqualTypeOf<
        Array<[ReadonlyArray<unknown>, unknown]>
      >()
    })

    it('should resolve QueryKey and unknown when untyped', () => {
      const queryClient = new QueryClient()
      const data = getQueriesData(queryClient, untypedQueryFilters)

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, unknown]>>()
    })
  })

  describe('resumePausedMutations', () => {
    it('should return a promise of unknown', () => {
      const queryClient = new QueryClient()

      expectTypeOf(resumePausedMutations(queryClient)).toEqualTypeOf<
        Promise<unknown>
      >()
    })
  })

  describe('mount', () => {
    it('should take no arguments and return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf<
        OperationArgs<typeof mountQueryClient, typeof queryClient>
      >().toEqualTypeOf<[]>()
      expectTypeOf(mountQueryClient(queryClient)).toEqualTypeOf<void>()
    })
  })

  describe('unmount', () => {
    it('should take no arguments and return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf<
        OperationArgs<typeof unmountQueryClient, typeof queryClient>
      >().toEqualTypeOf<[]>()
      expectTypeOf(unmountQueryClient(queryClient)).toEqualTypeOf<void>()
    })
  })

  describe('clear', () => {
    it('should take no arguments and return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf<
        OperationArgs<typeof clearQueryClient, typeof queryClient>
      >().toEqualTypeOf<[]>()
      expectTypeOf(clearQueryClient(queryClient)).toEqualTypeOf<void>()
    })
  })

  describe('getQueryCache', () => {
    it('should return the QueryCache', () => {
      const queryClient = new QueryClient()

      expectTypeOf(getQueryCache(queryClient)).toEqualTypeOf<QueryCache>()
    })
  })

  describe('getMutationCache', () => {
    it('should return the MutationCache', () => {
      const queryClient = new QueryClient()

      expectTypeOf(getMutationCache(queryClient)).toEqualTypeOf<MutationCache>()
    })
  })

  describe('getDefaultOptions', () => {
    it('should return the DefaultOptions', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        getDefaultOptions(queryClient),
      ).toEqualTypeOf<DefaultOptions>()
    })
  })

  describe('setDefaultOptions', () => {
    it('should only accept DefaultOptions', () => {
      expectTypeOf<
        OperationArgs<typeof setDefaultOptions, QueryClient>[0]
      >().toEqualTypeOf<DefaultOptions>()

      assertType<OperationArgs<typeof setDefaultOptions, QueryClient>>([
        // @ts-expect-error unknown top-level options are rejected
        { notAnOption: true },
      ])
    })
  })

  describe('setQueryDefaults', () => {
    it('should only accept a QueryKey as its first argument', () => {
      const queryClient = new QueryClient()

      setQueryDefaults(queryClient, ['key'], { staleTime: 1000 })

      expectTypeOf<
        OperationArgs<typeof setQueryDefaults, QueryClient>[0]
      >().toEqualTypeOf<QueryKey>()

      assertType<OperationArgs<typeof setQueryDefaults, QueryClient>>([
        // @ts-expect-error the query key must be an array
        'key',
        {},
      ])
    })

    it('should make every option optional and reject queryKey', () => {
      const queryClient = new QueryClient()

      setQueryDefaults(queryClient, ['key'], {})
      setQueryDefaults(queryClient, ['key'], { staleTime: 1000 })

      expectTypeOf<
        OperationArgs<typeof setQueryDefaults, typeof queryClient>[1]
      >().not.toHaveProperty('queryKey')

      setQueryDefaults(queryClient, ['key'], {
        // @ts-expect-error queryKey is omitted from the defaults
        queryKey: ['key'],
      })
    })

    it('should return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        setQueryDefaults(queryClient, ['key'], {}),
      ).toEqualTypeOf<void>()
    })
  })

  describe('getQueryDefaults', () => {
    it('should require a QueryKey', () => {
      const queryClient = new QueryClient()

      expectTypeOf<
        OperationArgs<typeof getQueryDefaults, QueryClient>[0]
      >().toEqualTypeOf<QueryKey>()

      // @ts-expect-error the query key is required
      getQueryDefaults(queryClient)
    })

    it('should return the query options without queryKey', () => {
      const queryClient = new QueryClient()
      const defaults = getQueryDefaults(queryClient, ['key'])

      expectTypeOf(defaults).toEqualTypeOf<
        OmitKeyof<QueryObserverOptionsBase<any, any, any, any, any>, 'queryKey'>
      >()
      expectTypeOf(defaults).not.toHaveProperty('queryKey')
    })

    it('should resolve the same options for a tagged and an untyped key', () => {
      const queryClient = new QueryClient()

      expectTypeOf(getQueryDefaults(queryClient, typedFilterKey)).toEqualTypeOf<
        OmitKeyof<QueryObserverOptionsBase<any, any, any, any, any>, 'queryKey'>
      >()
      expectTypeOf(
        getQueryDefaults(queryClient, untypedFilterKey),
      ).toEqualTypeOf<
        OmitKeyof<QueryObserverOptionsBase<any, any, any, any, any>, 'queryKey'>
      >()
    })
  })

  describe('setMutationDefaults', () => {
    it('should only accept a MutationKey as its first argument', () => {
      const queryClient = new QueryClient()

      setMutationDefaults(queryClient, ['key'], {})

      expectTypeOf<
        OperationArgs<typeof setMutationDefaults, QueryClient>[0]
      >().toEqualTypeOf<MutationKey>()

      assertType<OperationArgs<typeof setMutationDefaults, QueryClient>>([
        // @ts-expect-error the mutation key must be an array
        'key',
        {},
      ])
    })

    it('should reject mutationKey inside the defaults', () => {
      const queryClient = new QueryClient()

      setMutationDefaults(queryClient, ['key'], { retry: 3 })

      expectTypeOf<
        OperationArgs<typeof setMutationDefaults, typeof queryClient>[1]
      >().not.toHaveProperty('mutationKey')

      setMutationDefaults(queryClient, ['key'], {
        // @ts-expect-error mutationKey is omitted from the defaults
        mutationKey: ['key'],
      })
    })

    it('should return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        setMutationDefaults(queryClient, ['key'], {}),
      ).toEqualTypeOf<void>()
    })

    // oxlint-disable-next-line vitest/expect-expect -- Oxlint does not find assertions inside object methods
    it('should type the onSettled callback arguments', () => {
      const queryClient = new QueryClient()

      setMutationDefaults(queryClient, typedMutationKey, {
        onSettled(data, error, variables, onMutateResult, context) {
          expectTypeOf(data).toEqualTypeOf<unknown>()
          expectTypeOf(error).toEqualTypeOf<DefaultError | null>()
          expectTypeOf(variables).toEqualTypeOf<void>()
          expectTypeOf(onMutateResult).toEqualTypeOf<unknown>()
          expectTypeOf(context).toEqualTypeOf<MutationFunctionContext>()
        },
      })
    })
  })

  describe('getMutationDefaults', () => {
    it('should require a MutationKey', () => {
      const queryClient = new QueryClient()

      expectTypeOf<
        OperationArgs<typeof getMutationDefaults, QueryClient>[0]
      >().toEqualTypeOf<MutationKey>()

      // @ts-expect-error the mutation key is required
      getMutationDefaults(queryClient)
    })

    it('should return the mutation options without mutationKey', () => {
      const queryClient = new QueryClient()
      const defaults = getMutationDefaults(queryClient, ['key'])

      expectTypeOf(defaults).toEqualTypeOf<
        OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
      >()
      expectTypeOf(defaults).not.toHaveProperty('mutationKey')
    })

    it('should accept a mutation key taken from typed mutation options', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        getMutationDefaults(queryClient, typedMutationKey),
      ).toEqualTypeOf<
        OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
      >()
      expectTypeOf(
        getMutationDefaults(queryClient, untypedMutationKey),
      ).toEqualTypeOf<
        OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
      >()
    })
  })

  describe('defaultQueryOptions', () => {
    it('should resolve the defaulted options from the data and error types', () => {
      const queryClient = new QueryClient()
      const options = defaultQueryOptions(queryClient, typedQueryOptions)

      expectTypeOf(options).toEqualTypeOf<
        DefaultedQueryObserverOptions<
          TypedData,
          TypedError,
          TypedData,
          TypedData,
          QueryKey
        >
      >()
    })

    it('should preserve the query function page parameter', () => {
      const options = defaultQueryOptions(new QueryClient(), {
        queryKey: ['key'],
        queryFn: ({ pageParam }: { pageParam: number }) => pageParam.toFixed(),
      })

      expectTypeOf(options.queryFn)
        .extract<(...args: Array<never>) => unknown>()
        .toEqualTypeOf<QueryFunction<string, Array<string>, number>>()
    })

    it('should resolve unknown and DefaultError when untyped', () => {
      const queryClient = new QueryClient()
      const options = defaultQueryOptions(queryClient, untypedQueryOptions)

      expectTypeOf(options).toEqualTypeOf<
        DefaultedQueryObserverOptions<
          unknown,
          DefaultError,
          unknown,
          unknown,
          QueryKey
        >
      >()
    })
  })

  describe('defaultMutationOptions', () => {
    it('should accept being called without options', () => {
      assertType<OperationArgs<typeof defaultMutationOptions, QueryClient>>([])
    })

    it('should return the same type it is given', () => {
      const queryClient = new QueryClient()
      const options: MutationOptions<number, Error, string> = {}
      const defaulted = defaultMutationOptions(queryClient, options)

      expectTypeOf(defaulted).toEqualTypeOf<
        MutationOptions<number, Error, string>
      >()
    })

    it('should default its variables to void and its context to unknown', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        defaultMutationOptions(queryClient, typedMutationOptions),
      ).toEqualTypeOf<MutationOptions<TypedData, TypedError, void, unknown>>()
      expectTypeOf(
        defaultMutationOptions(queryClient, untypedMutationOptions),
      ).toEqualTypeOf<MutationOptions<unknown, DefaultError, void, unknown>>()
    })
  })

  describe('QueryClientConfig', () => {
    it('should be optional', () => {
      assertType<ConstructorParameters<typeof QueryClient>>([])
    })

    it('should declare exactly its three options', () => {
      expectTypeOf<keyof QueryClientConfig>().toEqualTypeOf<
        'queryCache' | 'mutationCache' | 'defaultOptions'
      >()
    })

    it('should declare every option as optional', () => {
      type OptionalKeys = {
        [K in keyof QueryClientConfig]-?: {} extends Pick<QueryClientConfig, K>
          ? K
          : never
      }[keyof QueryClientConfig]

      expectTypeOf<OptionalKeys>().toEqualTypeOf<keyof QueryClientConfig>()
    })

    it('should reject unknown options', () => {
      assertType<ConstructorParameters<typeof QueryClient>>([
        // @ts-expect-error unknown config options are rejected
        { notAnOption: true },
      ])
    })

    describe('defaultOptions', () => {
      it('should have a typed QueryFunctionContext', () => {
        new QueryClient({
          defaultOptions: {
            queries: {
              queryFn: (context) => {
                expectTypeOf(context).toEqualTypeOf<{
                  client: QueryClient
                  queryKey: QueryKey
                  meta: Record<string, unknown> | undefined
                  signal: AbortSignal
                  pageParam?: unknown
                }>()
                return Promise.resolve('data')
              },
            },
          },
        })
      })
    })
  })

  describe('DataTag', () => {
    it('should default its error to UnsetMarker so an untagged error falls back', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      expectTypeOf(getQueryState(queryClient, key)).toEqualTypeOf<
        QueryState<number, Error> | undefined
      >()

      type Tagged = DataTag<Array<string>, number>
      type TaggedError =
        Tagged extends DataTag<unknown, unknown, infer E> ? E : never
      expectTypeOf<TaggedError>().toEqualTypeOf<UnsetMarker>()
    })

    it('should not re-tag a key that is already tagged', () => {
      type Tagged = DataTag<Array<string>, number>

      // re-tagging returns the original tag rather than layering a second one
      expectTypeOf<DataTag<Tagged, string>>().toEqualTypeOf<Tagged>()

      const queryClient = new QueryClient()
      const reTagged = ['key'] as DataTag<Tagged, string>

      expectTypeOf(getQueryData(queryClient, reTagged)).toEqualTypeOf<
        number | undefined
      >()
    })
  })

  describe('QueryFilters', () => {
    it('should type every filter property', () => {
      expectTypeOf<QueryFilters['type']>().toEqualTypeOf<
        'all' | 'active' | 'inactive' | undefined
      >()
      expectTypeOf<QueryFilters['exact']>().toEqualTypeOf<boolean | undefined>()
      expectTypeOf<QueryFilters['stale']>().toEqualTypeOf<boolean | undefined>()
      expectTypeOf<QueryFilters['fetchStatus']>().toEqualTypeOf<
        'fetching' | 'paused' | 'idle' | undefined
      >()
    })

    it('should keep every filter property writable', () => {
      expectTypeOf<QueryFilters>().toEqualTypeOf<{
        -readonly [K in keyof QueryFilters]: QueryFilters[K]
      }>()
    })

    it('should reject a non-QueryTypeFilter type', () => {
      assertType<OperationArgs<typeof countFetchingQueries, QueryClient>>([
        // @ts-expect-error 'paused' is not a QueryTypeFilter
        { type: 'paused' },
      ])
    })

    it('should type the query given to a predicate as fully unknown', () => {
      const filters: QueryFilters<DataTag<QueryKey, TypedData, TypedError>> = {
        predicate(query) {
          expectTypeOf(query).toEqualTypeOf<
            Query<unknown, Error, unknown, ReadonlyArray<unknown>>
          >()
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.state.error).toEqualTypeOf<Error | null>()
          return false
        },
      }
      expectTypeOf(filters.predicate).toEqualTypeOf<
        ((query: Query) => boolean) | undefined
      >()
    })

    it('should type the query given to an untyped predicate', () => {
      const filters: QueryFilters = {
        predicate(query) {
          expectTypeOf(query).toEqualTypeOf<Query<unknown, DefaultError>>()
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.state.error).toEqualTypeOf<DefaultError | null>()
          return false
        },
      }
      expectTypeOf(filters.predicate).toEqualTypeOf<
        ((query: Query) => boolean) | undefined
      >()
    })
  })

  describe('MutationFilters', () => {
    it('should reject a mutationKey that is not an array', () => {
      assertType<OperationArgs<typeof isMutating, QueryClient>>([
        // @ts-expect-error the mutation key must be an array
        { mutationKey: 'key' },
      ])
    })

    it('should type the mutation given to a predicate from its generics', () => {
      const filters: MutationFilters<TypedData, TypedError> = {
        predicate(mutation) {
          expectTypeOf(mutation).toEqualTypeOf<
            Mutation<TypedData, TypedError>
          >()
          expectTypeOf(mutation.state.data).toEqualTypeOf<
            TypedData | undefined
          >()
          expectTypeOf(mutation.state.error).toEqualTypeOf<TypedError | null>()
          return false
        },
      }
      expectTypeOf(filters.predicate).toEqualTypeOf<
        ((mutation: Mutation<TypedData, TypedError>) => boolean) | undefined
      >()
    })

    it('should type the mutation given to an untyped predicate', () => {
      const filters: MutationFilters = {
        predicate(mutation) {
          expectTypeOf(mutation).toEqualTypeOf<Mutation>()
          expectTypeOf(mutation.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(
            mutation.state.error,
          ).toEqualTypeOf<DefaultError | null>()
          return false
        },
      }
      expectTypeOf(filters.predicate).toEqualTypeOf<
        ((mutation: Mutation) => boolean) | undefined
      >()
    })
  })

  describe('Updater', () => {
    it('should require the previous data argument on the function branch', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      type UpdaterArg = OperationArgs<
        typeof setQueryData<number, typeof key>,
        typeof queryClient
      >[1]
      expectTypeOf<UpdaterArg>().toEqualTypeOf<
        Updater<number | undefined, number | undefined>
      >()
      expectTypeOf<Extract<UpdaterArg, (...args: any) => any>>().toEqualTypeOf<
        (input: number | undefined) => number | undefined
      >()
    })
  })
})
