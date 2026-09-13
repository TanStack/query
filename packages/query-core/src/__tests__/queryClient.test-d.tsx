import { assertType, describe, expectTypeOf, it } from 'vitest'
import { queryKey } from '@tanstack/query-test-utils'
import { QueryClient } from '../queryClient'
import { skipToken } from '../utils'
import type { MutationFilters, QueryFilters, Updater } from '../utils'
import type { Mutation } from '../mutation'
import type { Query, QueryState } from '../query'
import type { QueryCache } from '../queryCache'
import type { MutationCache } from '../mutationCache'
import type {
  DataTag,
  DefaultError,
  DefaultOptions,
  DefaultedQueryObserverOptions,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  MutationFunctionContext,
  MutationKey,
  MutationObserverOptions,
  MutationOptions,
  OmitKeyof,
  QueryClientConfig,
  QueryKey,
  QueryObserverOptions,
  SetDataOptions,
  UnsetMarker,
} from '../types'

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

const typedQueryOptions: EnsureQueryDataOptions<TypedData, TypedError> = {
  queryKey: ['key', 'query'],
}

const typedFetchInfiniteQueryOptions: FetchInfiniteQueryOptions<
  TypedData,
  TypedError
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

const untypedQueryOptions: EnsureQueryDataOptions = {
  queryKey: ['key'] as any,
}

const untypedFetchInfiniteQueryOptions: FetchInfiniteQueryOptions = {
  queryKey: ['key'] as any,
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
      const data = queryClient.getQueryData(key)

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should infer unknown if key is not tagged', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(key)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })

    it('should infer passed generic if passed', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData<number>(key)

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should only allow Arrays to be passed', () => {
      assertType<Parameters<QueryClient['getQueryData']>>([
        // @ts-expect-error TS2345: Argument of type 'string' is not assignable to parameter of type 'QueryKey'
        { queryKey: 'key' },
      ])
    })

    it('should resolve the data type from a tagged filter key', () => {
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(typedFilterKey)

      expectTypeOf(data).toEqualTypeOf<TypedData | undefined>()
    })

    it('should resolve unknown from an untyped filter key', () => {
      const queryClient = new QueryClient()
      const data = queryClient.getQueryData(untypedFilterKey)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })
  })

  describe('setQueryData', () => {
    it('should type the updater if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<number | undefined>()
        return prev
      })

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should type the value if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      // @ts-expect-error value should be a number
      queryClient.setQueryData(key, '1')

      // @ts-expect-error value should be a number
      queryClient.setQueryData(key, () => '1')

      const data = queryClient.setQueryData(key, 1)

      expectTypeOf(data).toEqualTypeOf<number | undefined>()
    })

    it('should infer unknown for updater if key is not tagged', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<unknown>()
        return prev
      })

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })

    it('should infer unknown for value if key is not tagged', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(key, 'foo')

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })

    it('should infer passed generic if passed', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData<string>(key, (prev) => {
        expectTypeOf(prev).toEqualTypeOf<string | undefined>()
        return prev
      })

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should infer passed generic for value', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData<string>(key, 'foo')

      expectTypeOf(data).toEqualTypeOf<string | undefined>()
    })

    it('should preserve updater parameter type inference when used in functions with explicit return types', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      // Simulate usage inside a function with explicit return type
      // The outer function returns 'unknown' but this shouldn't affect the updater's type inference
      ;(() =>
        queryClient.setQueryData(key, (data) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          return data
        })) satisfies () => unknown
    })

    it('should infer the updater parameter inside an expression body arrow function', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      const callbackTest: SuccessCallback = () =>
        queryClient.setQueryData(key, (data) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          return data
        })
      expectTypeOf(callbackTest).toEqualTypeOf<SuccessCallback>()
    })

    it('should infer the updater parameter inside a block body arrow function', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      const callbackTest2: SuccessCallback = () => {
        queryClient.setQueryData(key, (data) => {
          expectTypeOf(data).toEqualTypeOf<number | undefined>()
          return data
        })
      }
      expectTypeOf(callbackTest2).toEqualTypeOf<SuccessCallback>()
    })

    it('should accept an optional SetDataOptions third argument', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()

      queryClient.setQueryData(key, 1)
      queryClient.setQueryData(key, 1, { updatedAt: 0 })

      type SetDataOptionsArg = Parameters<
        typeof queryClient.setQueryData<number, typeof key>
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
      const data = queryClient.setQueryData(typedFilterKey, newData)

      expectTypeOf(data).toEqualTypeOf<TypedData | undefined>()
      expectTypeOf<
        Parameters<
          typeof queryClient.setQueryData<unknown, typeof typedFilterKey>
        >[1]
      >().toEqualTypeOf<Updater<TypedData | undefined, TypedData | undefined>>()
    })

    it('should resolve unknown from an untyped filter key', () => {
      const queryClient = new QueryClient()
      const data = queryClient.setQueryData(untypedFilterKey, { foo: '' })

      expectTypeOf(data).toEqualTypeOf<unknown>()
      expectTypeOf<
        Parameters<
          typeof queryClient.setQueryData<unknown, typeof untypedFilterKey>
        >[1]
      >().toEqualTypeOf<Updater<unknown, unknown>>()
    })
  })

  describe('setQueriesData', () => {
    it('should resolve QueryKey and unknown for a tagged filter', () => {
      const queryClient = new QueryClient()
      // TODO: types here are wrong and coming up undefined
      const data = queryClient.setQueriesData(typedQueryFilters, { foo: '' })

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, unknown]>>()
      expectTypeOf<
        Parameters<
          typeof queryClient.setQueriesData<unknown, typeof typedQueryFilters>
        >[1]
      >().toEqualTypeOf<Updater<unknown, unknown>>()
    })

    it('should resolve QueryKey and unknown for an untyped filter', () => {
      const queryClient = new QueryClient()
      // TODO: types here are wrong and coming up undefined
      const data = queryClient.setQueriesData(untypedQueryFilters, { foo: '' })

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, unknown]>>()
      expectTypeOf<
        Parameters<
          typeof queryClient.setQueriesData<unknown, typeof untypedQueryFilters>
        >[1]
      >().toEqualTypeOf<Updater<unknown, unknown>>()
    })
  })

  describe('getQueryState', () => {
    it('should be loose typed without tag', () => {
      const key = ['key'] as const
      const queryClient = new QueryClient()
      const data = queryClient.getQueryState(key)

      expectTypeOf(data).toEqualTypeOf<QueryState<unknown, Error> | undefined>()
    })

    it('should be typed if key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      const data = queryClient.getQueryState(key)

      expectTypeOf(data).toEqualTypeOf<QueryState<number, Error> | undefined>()
    })

    it('should be typed including error if key is tagged', () => {
      type CustomError = Error & { customError: string }
      const key = ['key'] as DataTag<Array<string>, number, CustomError>
      const queryClient = new QueryClient()
      const data = queryClient.getQueryState(key)

      expectTypeOf(data).toEqualTypeOf<
        QueryState<number, CustomError> | undefined
      >()
    })

    it('should resolve the data and error from a tagged filter key', () => {
      const queryClient = new QueryClient()
      const state = queryClient.getQueryState(typedFilterKey)

      expectTypeOf(state).toEqualTypeOf<
        QueryState<TypedData, TypedError> | undefined
      >()
    })

    it('should resolve unknown and DefaultError from an untyped filter key', () => {
      const queryClient = new QueryClient()
      const state = queryClient.getQueryState(untypedFilterKey)

      expectTypeOf(state).toEqualTypeOf<
        QueryState<unknown, DefaultError> | undefined
      >()
    })
  })

  describe('fetchQuery', () => {
    it('should not allow passing select option', () => {
      assertType<Parameters<QueryClient['fetchQuery']>>([
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve('string'),
          // @ts-expect-error `select` is not supported on fetchQuery options
          select: (data: string) => data.length,
        },
      ])
    })

    it('should resolve with the data type', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.fetchQuery(typedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<TypedData>()
    })

    it('should resolve with unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.fetchQuery(untypedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })
  })

  describe('fetchInfiniteQuery', () => {
    it('should not allow passing select option', () => {
      assertType<Parameters<QueryClient['fetchInfiniteQuery']>>([
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve({ count: 1 }),
          initialPageParam: 1,
          getNextPageParam: () => 2,
          // @ts-expect-error `select` is not supported on fetchInfiniteQuery options
          select: (data: InfiniteData<{ count: number }, number>) => ({
            pages: data.pages.map((x) => `count: ${x.count}`),
            pageParams: data.pageParams,
          }),
        },
      ])
    })

    it('should allow passing pages', async () => {
      const data = await new QueryClient().fetchInfiniteQuery({
        queryKey: queryKey(),
        queryFn: () => Promise.resolve('string'),
        getNextPageParam: () => 1,
        initialPageParam: 1,
        pages: 5,
      })

      expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
    })

    it('should allow passing getNextPageParam without pages', () => {
      assertType<Parameters<QueryClient['fetchInfiniteQuery']>>([
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve('string'),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        },
      ])
    })

    it('should not allow passing pages without getNextPageParam', () => {
      assertType<Parameters<QueryClient['fetchInfiniteQuery']>>([
        // @ts-expect-error Property 'getNextPageParam' is missing
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve('string'),
          initialPageParam: 1,
          pages: 5,
        },
      ])
    })

    it('should resolve with InfiniteData of the data type', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.fetchInfiniteQuery(
        typedFetchInfiniteQueryOptions,
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<TypedData, unknown>>()
    })

    it('should resolve with InfiniteData of unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.fetchInfiniteQuery(
        untypedFetchInfiniteQueryOptions,
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<unknown, unknown>>()
    })
  })

  describe('query', () => {
    it('should allow passing select option', () => {
      const result = new QueryClient().query({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        select: (data) => data.length,
      })

      expectTypeOf(result).toEqualTypeOf<Promise<number>>()
    })

    it('should infer select type with skipToken queryFn', () => {
      const result = new QueryClient().query({
        queryKey: ['key'],
        queryFn: skipToken,
        select: (data: string) => data.length,
      })

      expectTypeOf(result).toEqualTypeOf<Promise<number>>()
    })

    it('should not allow enabled', () => {
      assertType<Parameters<QueryClient['query']>>([
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
      const data = await queryClient.query(typedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<TypedData>()
    })

    it('should resolve with unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.query(untypedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })
  })

  describe('ensureQueryData', () => {
    it('should resolve with the data type', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.ensureQueryData(typedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<TypedData>()
    })

    it('should resolve with unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.ensureQueryData(untypedQueryOptions)

      expectTypeOf(data).toEqualTypeOf<unknown>()
    })
  })

  describe('infiniteQuery', () => {
    it('should allow passing select option', () => {
      const result = new QueryClient().infiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve({ count: 1 }),
        initialPageParam: 1,
        getNextPageParam: () => 2,
        select: (data) => ({
          pages: data.pages.map(
            (x) => `count: ${(x as { count: number }).count}`,
          ),
        }),
      })

      expectTypeOf(result).toEqualTypeOf<Promise<{ pages: Array<string> }>>()
    })

    it('should allow passing pages', async () => {
      const result = await new QueryClient().infiniteQuery({
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

    it('should allow passing getNextPageParam without pages', () => {
      assertType<Parameters<QueryClient['infiniteQuery']>>([
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve({ count: 1 }),
          initialPageParam: 1,
          getNextPageParam: () => 1,
        },
      ])
    })

    it('should not allow passing pages without getNextPageParam', () => {
      assertType<Parameters<QueryClient['infiniteQuery']>>([
        // @ts-expect-error Property 'getNextPageParam' is missing
        {
          queryKey: ['key'],
          queryFn: () => Promise.resolve('string'),
          initialPageParam: 1,
          pages: 5,
        },
      ])
    })

    it('should default its page param to unknown', () => {
      const queryClient = new QueryClient()
      const result = queryClient.infiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        getNextPageParam: () => 2,
      })

      expectTypeOf(result).toEqualTypeOf<
        Promise<InfiniteData<string, number>>
      >()

      type PageParam = Parameters<
        typeof queryClient.infiniteQuery<string, Error>
      >[0]['initialPageParam']
      expectTypeOf<PageParam>().toEqualTypeOf<unknown>()
    })

    it('should resolve with InfiniteData of the data type', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.infiniteQuery(typedInfiniteQueryOptions)

      expectTypeOf(data).toEqualTypeOf<InfiniteData<TypedData, unknown>>()
    })

    it('should resolve with InfiniteData of unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.infiniteQuery(
        untypedFetchInfiniteQueryOptions,
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<unknown, unknown>>()
    })
  })

  describe('ensureInfiniteQueryData', () => {
    it('should resolve with InfiniteData of the data type', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.ensureInfiniteQueryData(
        typedFetchInfiniteQueryOptions,
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<TypedData, unknown>>()
    })

    it('should resolve with InfiniteData of unknown when untyped', async () => {
      const queryClient = new QueryClient()
      const data = await queryClient.ensureInfiniteQueryData(
        untypedFetchInfiniteQueryOptions,
      )

      expectTypeOf(data).toEqualTypeOf<InfiniteData<unknown, unknown>>()
    })

    it('should accept a revalidateIfStale that FetchInfiniteQueryOptions does not have', () => {
      const queryClient = new QueryClient()

      queryClient.ensureInfiniteQueryData({
        ...typedFetchInfiniteQueryOptions,
        revalidateIfStale: true,
      })

      type RevalidateIfStale = NonNullable<
        Parameters<QueryClient['ensureInfiniteQueryData']>[0]
      >['revalidateIfStale']
      expectTypeOf<RevalidateIfStale>().toEqualTypeOf<boolean | undefined>()
    })
  })

  describe('invalidateQueries', () => {
    it('should reject a non-array queryKey', () => {
      assertType<Parameters<QueryClient['invalidateQueries']>>([])
      assertType<Parameters<QueryClient['invalidateQueries']>>([
        { queryKey: ['1'] },
      ])
      assertType<Parameters<QueryClient['invalidateQueries']>>([
        // @ts-expect-error
        { queryKey: '1' },
      ])
    })
    it('should reject an object queryKey (#8684)', () => {
      assertType<Parameters<QueryClient['invalidateQueries']>>([
        // @ts-expect-error key is not an array
        { queryKey: { foo: true } },
      ])
    })
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      queryClient.invalidateQueries({
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

      expectTypeOf(queryClient.invalidateQueries()).toEqualTypeOf<
        Promise<void>
      >()
    })

    it('should accept a refetchType that QueryFilters does not have', () => {
      type RefetchType = NonNullable<
        Parameters<QueryClient['invalidateQueries']>[0]
      >['refetchType']
      expectTypeOf<RefetchType>().toEqualTypeOf<
        'all' | 'active' | 'inactive' | 'none' | undefined
      >()
    })

    it('should accept the refetch options it inherits as its second argument', () => {
      expectTypeOf<
        NonNullable<Parameters<QueryClient['invalidateQueries']>[1]>
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
      queryClient.cancelQueries({
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<Parameters<QueryClient['cancelQueries']>>([])
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.cancelQueries()).toEqualTypeOf<Promise<void>>()
    })
  })

  describe('removeQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      queryClient.removeQueries({
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<Parameters<QueryClient['removeQueries']>>([])
    })

    it('should return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.removeQueries()).toEqualTypeOf<void>()
    })
  })

  describe('refetchQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      queryClient.refetchQueries({
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<Parameters<QueryClient['refetchQueries']>>([])
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.refetchQueries()).toEqualTypeOf<Promise<void>>()
    })
  })

  describe('resetQueries', () => {
    it('should type the predicate if the key is tagged', () => {
      const key = ['key'] as DataTag<Array<string>, number>
      const queryClient = new QueryClient()
      queryClient.resetQueries({
        queryKey: key,
        predicate: (query) => {
          expectTypeOf(query.state.data).toEqualTypeOf<unknown>()
          expectTypeOf(query.queryKey).toEqualTypeOf<QueryKey>()
          return true
        },
      })
    })

    it('should accept being called without filters', () => {
      assertType<Parameters<QueryClient['resetQueries']>>([])
    })

    it('should return a promise of void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.resetQueries()).toEqualTypeOf<Promise<void>>()
    })

    it('should accept the refetch options it inherits as its second argument', () => {
      expectTypeOf<
        NonNullable<Parameters<QueryClient['resetQueries']>[1]>
      >().toEqualTypeOf<{
        throwOnError?: boolean
        cancelRefetch?: boolean
      }>()
    })
  })

  describe('isFetching', () => {
    it('should return a number', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.isFetching()).toEqualTypeOf<number>()
      expectTypeOf(
        queryClient.isFetching({ queryKey: ['key'] }),
      ).toEqualTypeOf<number>()
    })

    it('should accept being called without filters', () => {
      assertType<Parameters<QueryClient['isFetching']>>([])
    })

    it('should reject an unknown filter property', () => {
      assertType<Parameters<QueryClient['isFetching']>>([
        // @ts-expect-error unknown filter properties are rejected
        { notAFilter: true },
      ])
    })
  })

  describe('isMutating', () => {
    it('should return a number', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.isMutating()).toEqualTypeOf<number>()
      expectTypeOf(
        queryClient.isMutating({ mutationKey: ['key'] }),
      ).toEqualTypeOf<number>()
    })

    it('should accept being called without filters', () => {
      assertType<Parameters<QueryClient['isMutating']>>([])
    })

    it('should reject an unknown filter property', () => {
      assertType<Parameters<QueryClient['isMutating']>>([
        // @ts-expect-error unknown filter properties are rejected
        { notAFilter: true },
      ])
    })
    it('should accept typed and untyped mutation filters alike', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.isMutating(typedMutationFilters),
      ).toEqualTypeOf<number>()
      expectTypeOf(
        queryClient.isMutating(untypedMutationFilters),
      ).toEqualTypeOf<number>()
    })
  })

  describe('getQueriesData', () => {
    it('should require filters', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.getQueriesData({ queryKey: ['key'] }),
      ).toEqualTypeOf<Array<[QueryKey, unknown]>>()

      // @ts-expect-error filters are required
      queryClient.getQueriesData()
    })

    it('should infer the passed generic as the tuple data', () => {
      const queryClient = new QueryClient()
      const data = queryClient.getQueriesData<number>({ queryKey: ['key'] })

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, number | undefined]>>()
    })

    it('should widen the tuple to the filter key and unknown when tagged', () => {
      const queryClient = new QueryClient()
      const data = queryClient.getQueriesData(typedQueryFilters)

      expectTypeOf(data).toEqualTypeOf<
        Array<[ReadonlyArray<unknown>, unknown]>
      >()
    })

    it('should resolve QueryKey and unknown when untyped', () => {
      const queryClient = new QueryClient()
      const data = queryClient.getQueriesData(untypedQueryFilters)

      expectTypeOf(data).toEqualTypeOf<Array<[QueryKey, unknown]>>()
    })
  })

  describe('prefetchQuery', () => {
    it('should return a promise of void rather than the data', () => {
      const queryClient = new QueryClient()
      const result = queryClient.prefetchQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
      })

      expectTypeOf(result).toEqualTypeOf<Promise<void>>()
    })
  })

  describe('prefetchInfiniteQuery', () => {
    it('should return a promise of void rather than the pages', () => {
      const queryClient = new QueryClient()
      const result = queryClient.prefetchInfiniteQuery({
        queryKey: ['key'],
        queryFn: () => Promise.resolve('string'),
        initialPageParam: 1,
        getNextPageParam: () => 2,
      })

      expectTypeOf(result).toEqualTypeOf<Promise<void>>()
    })
  })

  describe('resumePausedMutations', () => {
    it('should return a promise of unknown', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.resumePausedMutations()).toEqualTypeOf<
        Promise<unknown>
      >()
    })
  })

  describe('mount', () => {
    it('should take no arguments and return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.mount).parameters.toEqualTypeOf<[]>()
      expectTypeOf(queryClient.mount()).toEqualTypeOf<void>()
    })
  })

  describe('unmount', () => {
    it('should take no arguments and return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.unmount).parameters.toEqualTypeOf<[]>()
      expectTypeOf(queryClient.unmount()).toEqualTypeOf<void>()
    })
  })

  describe('clear', () => {
    it('should take no arguments and return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.clear).parameters.toEqualTypeOf<[]>()
      expectTypeOf(queryClient.clear()).toEqualTypeOf<void>()
    })
  })

  describe('getQueryCache', () => {
    it('should return the QueryCache', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.getQueryCache()).toEqualTypeOf<QueryCache>()
    })
  })

  describe('getMutationCache', () => {
    it('should return the MutationCache', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.getMutationCache(),
      ).toEqualTypeOf<MutationCache>()
    })
  })

  describe('getDefaultOptions', () => {
    it('should return the DefaultOptions', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.getDefaultOptions(),
      ).toEqualTypeOf<DefaultOptions>()
    })
  })

  describe('setDefaultOptions', () => {
    it('should only accept DefaultOptions', () => {
      expectTypeOf<
        Parameters<QueryClient['setDefaultOptions']>[0]
      >().toEqualTypeOf<DefaultOptions>()

      assertType<Parameters<QueryClient['setDefaultOptions']>>([
        // @ts-expect-error unknown top-level options are rejected
        { notAnOption: true },
      ])
    })
  })

  describe('setQueryDefaults', () => {
    it('should only accept a QueryKey as its first argument', () => {
      const queryClient = new QueryClient()

      queryClient.setQueryDefaults(['key'], { staleTime: 1000 })

      expectTypeOf<
        Parameters<QueryClient['setQueryDefaults']>[0]
      >().toEqualTypeOf<QueryKey>()

      assertType<Parameters<QueryClient['setQueryDefaults']>>([
        // @ts-expect-error the query key must be an array
        'key',
        {},
      ])
    })

    it('should make every option optional and reject queryKey', () => {
      const queryClient = new QueryClient()

      queryClient.setQueryDefaults(['key'], {})
      queryClient.setQueryDefaults(['key'], { staleTime: 1000 })

      expectTypeOf<
        Parameters<typeof queryClient.setQueryDefaults>[1]
      >().not.toHaveProperty('queryKey')

      queryClient.setQueryDefaults(['key'], {
        // @ts-expect-error queryKey is omitted from the defaults
        queryKey: ['key'],
      })
    })

    it('should return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.setQueryDefaults(['key'], {}),
      ).toEqualTypeOf<void>()
    })
  })

  describe('getQueryDefaults', () => {
    it('should require a QueryKey', () => {
      const queryClient = new QueryClient()

      expectTypeOf<
        Parameters<QueryClient['getQueryDefaults']>[0]
      >().toEqualTypeOf<QueryKey>()

      // @ts-expect-error the query key is required
      queryClient.getQueryDefaults()
    })

    it('should return the query options without queryKey', () => {
      const queryClient = new QueryClient()
      const defaults = queryClient.getQueryDefaults(['key'])

      expectTypeOf(defaults).toEqualTypeOf<
        OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'>
      >()
      expectTypeOf(defaults).not.toHaveProperty('queryKey')
    })

    it('should resolve the same options for a tagged and an untyped key', () => {
      const queryClient = new QueryClient()

      expectTypeOf(queryClient.getQueryDefaults(typedFilterKey)).toEqualTypeOf<
        OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'>
      >()
      expectTypeOf(
        queryClient.getQueryDefaults(untypedFilterKey),
      ).toEqualTypeOf<
        OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'>
      >()
    })
  })

  describe('setMutationDefaults', () => {
    it('should only accept a MutationKey as its first argument', () => {
      const queryClient = new QueryClient()

      queryClient.setMutationDefaults(['key'], {})

      expectTypeOf<
        Parameters<QueryClient['setMutationDefaults']>[0]
      >().toEqualTypeOf<MutationKey>()

      assertType<Parameters<QueryClient['setMutationDefaults']>>([
        // @ts-expect-error the mutation key must be an array
        'key',
        {},
      ])
    })

    it('should reject mutationKey inside the defaults', () => {
      const queryClient = new QueryClient()

      queryClient.setMutationDefaults(['key'], { retry: 3 })

      expectTypeOf<
        Parameters<typeof queryClient.setMutationDefaults>[1]
      >().not.toHaveProperty('mutationKey')

      queryClient.setMutationDefaults(['key'], {
        // @ts-expect-error mutationKey is omitted from the defaults
        mutationKey: ['key'],
      })
    })

    it('should return void', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.setMutationDefaults(['key'], {}),
      ).toEqualTypeOf<void>()
    })

    it('should type the onSettled callback arguments', () => {
      const queryClient = new QueryClient()

      queryClient.setMutationDefaults(typedMutationKey, {
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
        Parameters<QueryClient['getMutationDefaults']>[0]
      >().toEqualTypeOf<MutationKey>()

      // @ts-expect-error the mutation key is required
      queryClient.getMutationDefaults()
    })

    it('should return the mutation options without mutationKey', () => {
      const queryClient = new QueryClient()
      const defaults = queryClient.getMutationDefaults(['key'])

      expectTypeOf(defaults).toEqualTypeOf<
        OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
      >()
      expectTypeOf(defaults).not.toHaveProperty('mutationKey')
    })

    it('should accept a mutation key taken from typed mutation options', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.getMutationDefaults(typedMutationKey),
      ).toEqualTypeOf<
        OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
      >()
      expectTypeOf(
        queryClient.getMutationDefaults(untypedMutationKey),
      ).toEqualTypeOf<
        OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
      >()
    })
  })

  describe('defaultQueryOptions', () => {
    it('should resolve the defaulted options from the data and error types', () => {
      const queryClient = new QueryClient()
      const options = queryClient.defaultQueryOptions(typedQueryOptions)

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

    it('should resolve unknown and DefaultError when untyped', () => {
      const queryClient = new QueryClient()
      const options = queryClient.defaultQueryOptions(untypedQueryOptions)

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
      assertType<Parameters<QueryClient['defaultMutationOptions']>>([])
    })

    it('should return the same type it is given', () => {
      const queryClient = new QueryClient()
      const options: MutationOptions<number, Error, string> = {}
      const defaulted = queryClient.defaultMutationOptions(options)

      expectTypeOf(defaulted).toEqualTypeOf<
        MutationOptions<number, Error, string>
      >()
    })

    it('should default its variables to void and its context to unknown', () => {
      const queryClient = new QueryClient()

      expectTypeOf(
        queryClient.defaultMutationOptions(typedMutationOptions),
      ).toEqualTypeOf<MutationOptions<TypedData, TypedError, void, unknown>>()
      expectTypeOf(
        queryClient.defaultMutationOptions(untypedMutationOptions),
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
                  direction?: unknown
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

      expectTypeOf(queryClient.getQueryState(key)).toEqualTypeOf<
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

      expectTypeOf(queryClient.getQueryData(reTagged)).toEqualTypeOf<
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
      assertType<Parameters<QueryClient['isFetching']>>([
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
      assertType<Parameters<QueryClient['isMutating']>>([
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

      type UpdaterArg = Parameters<
        typeof queryClient.setQueryData<number, typeof key>
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
