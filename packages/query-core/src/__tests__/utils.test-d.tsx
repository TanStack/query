import { assertType, describe, expectTypeOf, it } from 'vitest'
import { QueryClient } from '../queryClient'
import {
  addConsumeAwareSignal,
  addToEnd,
  addToStart,
  ensureQueryFn,
  functionalUpdate,
  hashKey,
  hashQueryKeyByOptions,
  isPlainArray,
  isPlainObject,
  isServer,
  isValidTimeout,
  keepPreviousData,
  matchMutation,
  matchQuery,
  noop,
  partialMatchKey,
  replaceData,
  replaceEqualDeep,
  resolveQueryValue,
  shallowEqualObjects,
  shouldThrowError,
  skipToken,
  sleep,
  timeUntilStale,
} from '../utils'
import type {
  MutationFilters,
  QueryFilters,
  QueryTypeFilter,
  SkipToken,
  Updater,
} from '../utils'
import type { Mutation } from '../mutation'
import type { Query } from '../query'
import type {
  DataTag,
  MutationStatus,
  QueryFunction,
  QueryKey,
  QueryOptions,
} from '../types'

class CustomError extends Error {
  name = 'CustomError' as const
}

describe('QueryFilters', () => {
  it('should be typed unknown even if tagged generics are passed', () => {
    type TData = { a: number; b: string }
    type TError = Error & { message: string }

    const filters: QueryFilters<DataTag<QueryKey, TData, TError>> = {
      predicate(query) {
        expectTypeOf(query.setData({ a: 1, b: '1' })).toEqualTypeOf<unknown>()
        return true
      },
      queryKey: ['key'] as DataTag<undefined, TData, TError>,
    }

    const queryClient = new QueryClient()

    const data = queryClient.getQueryData(filters.queryKey!)
    expectTypeOf(data).toEqualTypeOf<TData | undefined>()

    const error = queryClient.getQueryState(filters.queryKey!)?.error
    expectTypeOf(error).toEqualTypeOf<TError | null | undefined>()
  })

  it('should be loose typed if generics are defaults', () => {
    const a: QueryFilters = {
      predicate(query) {
        expectTypeOf(query.setData({ a: 1, b: '1' })).toEqualTypeOf<unknown>()
        return true
      },
      queryKey: ['key'],
    }

    const queryClient = new QueryClient()
    const data = queryClient.getQueryData(a.queryKey!)
    expectTypeOf(data).toEqualTypeOf<unknown>()

    const error = queryClient.getQueryState(a.queryKey!)?.error
    expectTypeOf(error).toEqualTypeOf<Error | null | undefined>()
  })

  it('should allow a partial query key to be passed', () => {
    const filters: QueryFilters<readonly ['key', { a: number; b: string }]> = {
      queryKey: ['key'],
    }

    expectTypeOf(filters.queryKey).toEqualTypeOf<
      | undefined
      | readonly []
      | readonly ['key']
      | readonly [
          'key',
          {
            a: number
            b: string
          },
        ]
    >()
  })

  it('should work with readonly union types', () => {
    const filters: QueryFilters<
      readonly ['key'] | readonly ['key', 'something']
    > = {
      queryKey: ['key'],
    }

    expectTypeOf(filters.queryKey).toEqualTypeOf<
      undefined | readonly [] | readonly ['key'] | readonly ['key', 'something']
    >()
  })

  // we test that there are not type errors here
  // eslint-disable-next-line vitest/expect-expect
  it('should work with unions of different lengths', () => {
    type Key =
      | readonly ['foo']
      | readonly ['foo', 'bar']
      | readonly ['foo', 'bar', 'baz']

    const queryKey: Key = ['foo', 'bar'] as any as Key

    new QueryClient().invalidateQueries({ queryKey })
  })

  it('should error on invalid query keys', () => {
    assertType<QueryFilters<readonly ['key', { a: number; b: string }]>>({
      // @ts-expect-error cannot pass invalid query key
      queryKey: ['invalid', { a: 1, b: '1' }],
    })
  })

  it('should type every filter as optional', () => {
    expectTypeOf<QueryFilters>().toEqualTypeOf<{
      type?: QueryTypeFilter
      exact?: boolean
      predicate?: (query: Query) => boolean
      queryKey?: QueryKey | ReadonlyArray<unknown>
      stale?: boolean
      fetchStatus?: 'fetching' | 'paused' | 'idle'
    }>()
  })

  it('should keep every filter writable', () => {
    // stripping `readonly` from every key must be a no-op
    expectTypeOf<{
      -readonly [Key in keyof QueryFilters]: QueryFilters[Key]
    }>().toEqualTypeOf<QueryFilters>()

    const filters: QueryFilters = {}

    filters.type = 'active'
    filters.exact = true
    filters.predicate = () => true
    filters.queryKey = ['key']
    filters.stale = true
    filters.fetchStatus = 'idle'
  })

  it('should default TQueryKey to QueryKey', () => {
    expectTypeOf<QueryFilters>().toEqualTypeOf<QueryFilters<QueryKey>>()
    expectTypeOf<QueryFilters['queryKey']>().toEqualTypeOf<
      ReadonlyArray<unknown> | undefined
    >()
  })

  it('should constrain TQueryKey to QueryKey', () => {
    expectTypeOf<QueryFilters<readonly ['key']>['queryKey']>().toEqualTypeOf<
      undefined | readonly [] | readonly ['key']
    >()

    assertType<
      // @ts-expect-error a non-array type does not satisfy the QueryKey constraint
      QueryFilters<{ key: string }>
    >({})
  })

  it('should type predicate with an untyped Query regardless of TQueryKey', () => {
    expectTypeOf<NonNullable<QueryFilters<readonly ['key']>['predicate']>>()
      .parameter(0)
      .toEqualTypeOf<Query>()

    expectTypeOf<NonNullable<QueryFilters['predicate']>>()
      .parameter(0)
      .toEqualTypeOf<Query<unknown, Error, unknown, ReadonlyArray<unknown>>>()
  })

  it('should type fetchStatus as FetchStatus', () => {
    expectTypeOf<QueryFilters['fetchStatus']>().toEqualTypeOf<
      'fetching' | 'paused' | 'idle' | undefined
    >()

    assertType<QueryFilters>({
      // @ts-expect-error 'success' is not a FetchStatus
      fetchStatus: 'success',
    })
  })

  describe('type', () => {
    it('should be typed as QueryTypeFilter', () => {
      expectTypeOf<Pick<QueryFilters, 'type'>>().toEqualTypeOf<{
        type?: 'all' | 'active' | 'inactive'
      }>()

      assertType<QueryFilters>({
        // @ts-expect-error 'stale' is not a QueryTypeFilter
        type: 'stale',
      })
    })
  })

  describe('exact', () => {
    it('should be typed as an optional boolean', () => {
      expectTypeOf<Pick<QueryFilters, 'exact'>>().toEqualTypeOf<{
        exact?: boolean
      }>()

      assertType<QueryFilters>({
        // @ts-expect-error exact must be a boolean
        exact: 'yes',
      })
    })
  })

  describe('stale', () => {
    it('should be typed as an optional boolean', () => {
      expectTypeOf<Pick<QueryFilters, 'stale'>>().toEqualTypeOf<{
        stale?: boolean
      }>()

      assertType<QueryFilters>({
        // @ts-expect-error stale must be a boolean
        stale: 'yes',
      })
    })
  })
})

describe('MutationFilters', () => {
  it('should type every filter as optional', () => {
    expectTypeOf<MutationFilters>().toEqualTypeOf<{
      exact?: boolean
      predicate?: (mutation: Mutation) => boolean
      mutationKey?: ReadonlyArray<unknown>
      status?: MutationStatus
    }>()
  })

  it('should keep every filter writable', () => {
    // stripping `readonly` from every key must be a no-op
    expectTypeOf<{
      -readonly [Key in keyof MutationFilters]: MutationFilters[Key]
    }>().toEqualTypeOf<MutationFilters>()

    const filters: MutationFilters = {}

    filters.exact = true
    filters.predicate = () => true
    filters.mutationKey = ['key']
    filters.status = 'success'
  })

  it('should default TData to unknown and TError to DefaultError', () => {
    expectTypeOf<NonNullable<MutationFilters['predicate']>>()
      .parameter(0)
      .toEqualTypeOf<Mutation<unknown, Error, unknown, unknown>>()
  })

  it('should default TVariables and TOnMutateResult to unknown', () => {
    expectTypeOf<
      NonNullable<MutationFilters<number, CustomError>['predicate']>
    >()
      .parameter(0)
      .toEqualTypeOf<Mutation<number, CustomError, unknown, unknown>>()
  })

  it('should forward TVariables into the predicate mutation', () => {
    const filters: MutationFilters<number, CustomError, string> = {
      predicate(mutation) {
        expectTypeOf(mutation).toEqualTypeOf<
          Mutation<number, CustomError, string, unknown>
        >()
        expectTypeOf(mutation.state.variables).toEqualTypeOf<
          string | undefined
        >()
        return true
      },
    }

    expectTypeOf(filters.predicate).toEqualTypeOf<
      | ((mutation: Mutation<number, CustomError, string, unknown>) => boolean)
      | undefined
    >()
  })

  it('should forward TOnMutateResult into the predicate mutation', () => {
    const filters: MutationFilters<
      number,
      CustomError,
      string,
      { rollback: () => void }
    > = {
      predicate(mutation) {
        expectTypeOf(mutation).toEqualTypeOf<
          Mutation<number, CustomError, string, { rollback: () => void }>
        >()
        expectTypeOf(mutation.state.context).toEqualTypeOf<
          { rollback: () => void } | undefined
        >()
        return true
      },
    }

    expectTypeOf(filters.predicate).toEqualTypeOf<
      | ((
          mutation: Mutation<
            number,
            CustomError,
            string,
            { rollback: () => void }
          >,
        ) => boolean)
      | undefined
    >()
  })

  it('should forward TData and TError into the predicate mutation state', () => {
    const filters: MutationFilters<number, CustomError> = {
      predicate(mutation) {
        expectTypeOf(mutation.state.data).toEqualTypeOf<number | undefined>()
        expectTypeOf(mutation.state.error).toEqualTypeOf<CustomError | null>()
        return true
      },
    }

    expectTypeOf(filters.predicate).toEqualTypeOf<
      | ((mutation: Mutation<number, CustomError, unknown, unknown>) => boolean)
      | undefined
    >()
  })

  it('should not parameterize mutationKey by any generic, unlike QueryFilters', () => {
    // `QueryFilters.queryKey` narrows with TQueryKey, but `MutationFilters` has
    // no key generic at all: `mutationKey` is always the prefixes of `MutationKey`
    expectTypeOf<
      MutationFilters<number, CustomError, string, void>['mutationKey']
    >().toEqualTypeOf<ReadonlyArray<unknown> | undefined>()

    expectTypeOf<MutationFilters['mutationKey']>().toEqualTypeOf<
      MutationFilters<number>['mutationKey']
    >()

    // any MutationKey is therefore accepted, whatever the generics are
    assertType<MutationFilters<number, CustomError, string, void>>({
      mutationKey: ['anything', { at: 'all' }, 1],
    })
  })

  it('should type status as MutationStatus', () => {
    expectTypeOf<MutationFilters['status']>().toEqualTypeOf<
      'idle' | 'pending' | 'success' | 'error' | undefined
    >()

    assertType<MutationFilters>({
      // @ts-expect-error 'fetching' is not a MutationStatus
      status: 'fetching',
    })
  })
})

describe('QueryTypeFilter', () => {
  it('should be a union of the three query types', () => {
    expectTypeOf<QueryTypeFilter>().toEqualTypeOf<
      'all' | 'active' | 'inactive'
    >()
  })
})

describe('Updater', () => {
  it('should be a union of the value and the updater function', () => {
    expectTypeOf<Updater<number, string>>().toEqualTypeOf<
      string | ((input: number) => string)
    >()
  })

  it('should accept both branches for the same instantiation', () => {
    const value: Updater<number, string> = 'next'
    const fn: Updater<number, string> = (input) => {
      // the annotation alone contextually types the parameter as TInput
      expectTypeOf(input).toEqualTypeOf<number>()
      return String(input)
    }

    // the annotation narrows each variable down to the branch it was given
    expectTypeOf(value).toEqualTypeOf<string>()
    expectTypeOf(fn).toEqualTypeOf<(input: number) => string>()
  })

  it('should keep the value branch assignable but not callable', () => {
    expectTypeOf<
      Exclude<Updater<number, string>, Function>
    >().toEqualTypeOf<string>()

    // @ts-expect-error the value branch is not a function
    const _fn: Extract<Updater<number, string>, string> = (input: number) =>
      String(input)
  })

  it('should type the function branch input as TInput and output as TOutput', () => {
    type UpdaterFn = Extract<Updater<number, string>, Function>

    expectTypeOf<UpdaterFn>().parameter(0).toEqualTypeOf<number>()
    expectTypeOf<UpdaterFn>().returns.toEqualTypeOf<string>()
  })
})

describe('functionalUpdate', () => {
  it('should type the updater parameter as Updater<TInput, TOutput>', () => {
    expectTypeOf(functionalUpdate<number, string>)
      .parameter(0)
      .toEqualTypeOf<string | ((input: number) => string)>()
  })

  it('should type the input parameter as TInput', () => {
    expectTypeOf(functionalUpdate<number, string>)
      .parameter(1)
      .toEqualTypeOf<number>()
  })

  it('should return TOutput', () => {
    expectTypeOf(
      functionalUpdate<number, string>,
    ).returns.toEqualTypeOf<string>()

    const result = functionalUpdate<number, string>((input) => String(input), 1)
    expectTypeOf(result).toEqualTypeOf<string>()
  })

  it('should infer both generics from the value branch', () => {
    const result = functionalUpdate('next', 1)
    expectTypeOf(result).toEqualTypeOf<string>()
  })
})

describe('noop', () => {
  it('should resolve to the void overload when called', () => {
    expectTypeOf(noop()).toEqualTypeOf<void>()
  })

  it('should be usable as a VoidFunction', () => {
    const fn: VoidFunction = noop
    expectTypeOf(fn).toEqualTypeOf<VoidFunction>()
  })
})

describe('isValidTimeout', () => {
  it('should narrow unknown to number', () => {
    const value: unknown = 1

    if (isValidTimeout(value)) {
      expectTypeOf(value).toEqualTypeOf<number>()
    } else {
      expectTypeOf(value).toEqualTypeOf<unknown>()
    }
  })

  it('should accept unknown as its parameter', () => {
    expectTypeOf(isValidTimeout).parameter(0).toEqualTypeOf<unknown>()
    expectTypeOf(isValidTimeout).returns.toEqualTypeOf<boolean>()
  })
})

describe('isPlainArray', () => {
  it('should narrow unknown to Array<unknown>', () => {
    const value: unknown = []

    if (isPlainArray(value)) {
      expectTypeOf(value).toEqualTypeOf<Array<unknown>>()
    } else {
      expectTypeOf(value).toEqualTypeOf<unknown>()
    }
  })

  it('should accept unknown as its parameter', () => {
    expectTypeOf(isPlainArray).parameter(0).toEqualTypeOf<unknown>()
  })
})

describe('isPlainObject', () => {
  it('should narrow unknown to Record<PropertyKey, unknown>', () => {
    const value: unknown = {}

    if (isPlainObject(value)) {
      expectTypeOf(value).toEqualTypeOf<Record<PropertyKey, unknown>>()
    } else {
      expectTypeOf(value).toEqualTypeOf<unknown>()
    }
  })

  it('should accept any as its parameter, unlike the other guards', () => {
    expectTypeOf(isPlainObject).parameter(0).toBeAny()
  })
})

describe('partialMatchKey', () => {
  it('should only expose the QueryKey overload, not the any implementation', () => {
    expectTypeOf(partialMatchKey)
      .parameter(0)
      .toEqualTypeOf<ReadonlyArray<unknown>>()
    expectTypeOf(partialMatchKey)
      .parameter(1)
      .toEqualTypeOf<ReadonlyArray<unknown>>()
    expectTypeOf(partialMatchKey).returns.toEqualTypeOf<boolean>()

    expectTypeOf(partialMatchKey(['a'], ['a'])).toEqualTypeOf<boolean>()
    // @ts-expect-error a non-QueryKey argument is rejected
    partialMatchKey(1, 2)
  })
})

describe('hashKey', () => {
  it('should only accept an array key', () => {
    // `QueryKey | MutationKey` collapses to a single type here: with an empty
    // `Register`, both resolve to `ReadonlyArray<unknown>`, so the declared
    // union is structurally indistinguishable from either member alone.
    expectTypeOf(hashKey).parameter(0).toEqualTypeOf<ReadonlyArray<unknown>>()

    // @ts-expect-error a non-array key is rejected
    hashKey('a')
  })

  it('should return a string', () => {
    expectTypeOf(hashKey).returns.toEqualTypeOf<string>()
  })
})

describe('hashQueryKeyByOptions', () => {
  it('should accept the options argument optionally', () => {
    expectTypeOf(hashQueryKeyByOptions(['a'])).toEqualTypeOf<string>()
    expectTypeOf(
      hashQueryKeyByOptions(['a'], { queryKeyHashFn: hashKey }),
    ).toEqualTypeOf<string>()
  })
})

describe('resolveQueryValue', () => {
  it('should default TData to TQueryFnData', () => {
    const query = {} as Query<number, Error, number, readonly ['key']>

    resolveQueryValue<string, number>((q) => {
      expectTypeOf(q).toEqualTypeOf<
        Query<number, Error, number, ReadonlyArray<unknown>>
      >()
      return 'value'
    }, query as never)
  })

  it('should widen the return type with undefined', () => {
    const query = {} as Query<number, Error, number, readonly ['key']>

    const value = resolveQueryValue<
      string,
      number,
      Error,
      number,
      readonly ['key']
    >('value', query)
    expectTypeOf(value).toEqualTypeOf<string | undefined>()
  })

  it('should type the query parameter with every generic', () => {
    expectTypeOf(
      resolveQueryValue<string, number, CustomError, boolean, readonly ['key']>,
    )
      .parameter(1)
      .toEqualTypeOf<Query<number, CustomError, boolean, readonly ['key']>>()
  })

  it('should accept both a plain value and a resolver function', () => {
    const query = {} as Query<number, Error, number, readonly ['key']>

    const fromFn = resolveQueryValue<
      string,
      number,
      Error,
      number,
      readonly ['key']
    >((q) => {
      expectTypeOf(q).toEqualTypeOf<
        Query<number, Error, number, readonly ['key']>
      >()
      return 'value'
    }, query)
    expectTypeOf(fromFn).toEqualTypeOf<string | undefined>()

    const fromUndefined = resolveQueryValue<
      string,
      number,
      Error,
      number,
      readonly ['key']
    >(undefined, query)
    expectTypeOf(fromUndefined).toEqualTypeOf<string | undefined>()
  })
})

describe('matchQuery', () => {
  it('should accept a QueryFilters and any Query', () => {
    expectTypeOf(matchQuery).parameter(0).toEqualTypeOf<QueryFilters>()
    expectTypeOf(matchQuery).returns.toEqualTypeOf<boolean>()

    expectTypeOf(
      matchQuery({ queryKey: ['a'] }, {} as Query<number, Error>),
    ).toEqualTypeOf<boolean>()
  })
})

describe('matchMutation', () => {
  it('should accept a MutationFilters and any Mutation', () => {
    expectTypeOf(matchMutation).parameter(0).toEqualTypeOf<MutationFilters>()
    expectTypeOf(matchMutation).returns.toEqualTypeOf<boolean>()

    expectTypeOf(
      matchMutation({ mutationKey: ['a'] }, {} as Mutation<number, Error>),
    ).toEqualTypeOf<boolean>()
  })
})

describe('replaceEqualDeep', () => {
  it('should return the type of b and not relate it to a', () => {
    const result = replaceEqualDeep({ a: 1 } as unknown, { b: '1' })
    expectTypeOf(result).toEqualTypeOf<{ b: string }>()

    expectTypeOf(replaceEqualDeep<number>)
      .parameter(0)
      .toEqualTypeOf<unknown>()
    expectTypeOf(replaceEqualDeep<number>)
      .parameter(1)
      .toEqualTypeOf<number>()
  })

  it('should accept the depth argument optionally', () => {
    expectTypeOf(replaceEqualDeep(1 as unknown, 2)).toEqualTypeOf<number>()
    expectTypeOf(replaceEqualDeep(1 as unknown, 2, 0)).toEqualTypeOf<number>()
  })
})

describe('shallowEqualObjects', () => {
  it('should allow b to be undefined but not a', () => {
    expectTypeOf(shallowEqualObjects<{ a: number }>)
      .parameter(0)
      .toEqualTypeOf<{ a: number }>()
    expectTypeOf(shallowEqualObjects<{ a: number }>)
      .parameter(1)
      .toEqualTypeOf<{ a: number } | undefined>()

    expectTypeOf(
      shallowEqualObjects({ a: 1 }, undefined),
    ).toEqualTypeOf<boolean>()
    // @ts-expect-error a cannot be undefined
    shallowEqualObjects(undefined, { a: 1 })
  })

  it('should constrain T to a record', () => {
    expectTypeOf(
      shallowEqualObjects({ a: 1 }, { a: 1 }),
    ).toEqualTypeOf<boolean>()
    // @ts-expect-error a primitive does not satisfy Record<string, any>
    shallowEqualObjects(1, 1)
  })
})

describe('keepPreviousData', () => {
  it('should return the previous data widened with undefined', () => {
    expectTypeOf(keepPreviousData<string>('x')).toEqualTypeOf<
      string | undefined
    >()
    expectTypeOf(keepPreviousData<string>)
      .parameter(0)
      .toEqualTypeOf<string | undefined>()
  })
})

describe('addToEnd', () => {
  it('should return a mutable Array<T>', () => {
    const result = addToEnd([1, 2], 3)
    expectTypeOf(result).toEqualTypeOf<Array<number>>()

    // the result is mutable, so push is available
    result.push(4)
  })

  it('should accept the max argument optionally', () => {
    expectTypeOf(addToEnd([1], 2)).toEqualTypeOf<Array<number>>()
    expectTypeOf(addToEnd([1], 2, 5)).toEqualTypeOf<Array<number>>()
  })

  it('should reject a readonly array of items', () => {
    const items: ReadonlyArray<number> = [1, 2]
    expectTypeOf(addToEnd([...items], 3)).toEqualTypeOf<Array<number>>()
    // @ts-expect-error a readonly array is not assignable to Array<T>
    addToEnd(items, 3)
  })
})

describe('addToStart', () => {
  it('should return a mutable Array<T>', () => {
    const result = addToStart([1, 2], 3)
    expectTypeOf(result).toEqualTypeOf<Array<number>>()

    result.push(4)
  })

  it('should reject a readonly array of items', () => {
    const items: ReadonlyArray<number> = [1, 2]
    expectTypeOf(addToStart([...items], 3)).toEqualTypeOf<Array<number>>()
    // @ts-expect-error a readonly array is not assignable to Array<T>
    addToStart(items, 3)
  })
})

describe('skipToken', () => {
  it('should be a unique symbol, not the widened symbol type', () => {
    expectTypeOf(skipToken).toEqualTypeOf<SkipToken>()
    expectTypeOf(skipToken).not.toEqualTypeOf<symbol>()

    // the sentinel narrows to itself, so a plain symbol is not assignable to it
    const plainSymbol: symbol = skipToken
    expectTypeOf(plainSymbol).toEqualTypeOf<symbol>()

    // @ts-expect-error a plain symbol is not the skipToken sentinel
    assertType<SkipToken>(plainSymbol)
  })
})

describe('ensureQueryFn', () => {
  it('should accept a SkipToken in queryFn but never return one', () => {
    const queryFn = skipToken as
      | QueryFunction<number, readonly ['key']>
      | SkipToken

    expectTypeOf<
      Parameters<typeof ensureQueryFn<number, readonly ['key']>>[0]['queryFn']
    >().toEqualTypeOf<
      QueryFunction<number, readonly ['key']> | SkipToken | undefined
    >()

    const resolved = ensureQueryFn<number, readonly ['key']>({ queryFn })
    expectTypeOf(resolved).toEqualTypeOf<
      QueryFunction<number, readonly ['key']>
    >()
  })

  it('should accept the fetchOptions argument optionally', () => {
    expectTypeOf(ensureQueryFn<number, readonly ['key']>({})).toEqualTypeOf<
      QueryFunction<number, readonly ['key']>
    >()
  })

  it('should only read queryFn and queryHash from the options', () => {
    expectTypeOf<
      Parameters<typeof ensureQueryFn<number, readonly ['key']>>[0]
    >().toEqualTypeOf<{
      queryFn?: QueryFunction<number, readonly ['key']> | SkipToken
      queryHash?: string
    }>()
  })
})

describe('shouldThrowError', () => {
  it('should tie params to the parameters of the throwOnError function', () => {
    type ThrowOnError = (error: CustomError, query: Query) => boolean

    expectTypeOf(shouldThrowError<ThrowOnError>)
      .parameter(1)
      .toEqualTypeOf<[error: CustomError, query: Query]>()

    expectTypeOf(
      shouldThrowError<ThrowOnError>,
    ).returns.toEqualTypeOf<boolean>()
  })

  it('should constrain the throwOnError function to one returning a boolean', () => {
    expectTypeOf(
      shouldThrowError<(error: CustomError) => boolean>(
        (_error) => true,
        [new CustomError()],
      ),
    ).toEqualTypeOf<boolean>()

    shouldThrowError<
      // @ts-expect-error a throwOnError function has to return a boolean
      (error: CustomError) => unknown
    >((_error) => undefined, [new CustomError()])
  })

  it('should accept a boolean or undefined as throwOnError', () => {
    type ThrowOnError = (error: CustomError) => boolean

    expectTypeOf(shouldThrowError<ThrowOnError>)
      .parameter(0)
      .toEqualTypeOf<boolean | ThrowOnError | undefined>()

    expectTypeOf(
      shouldThrowError<ThrowOnError>(true, [new CustomError()]),
    ).toEqualTypeOf<boolean>()
  })
})

describe('sleep', () => {
  it('should return a Promise<void>', () => {
    expectTypeOf(sleep(1)).toEqualTypeOf<Promise<void>>()
    expectTypeOf(sleep).parameter(0).toEqualTypeOf<number>()
  })
})

describe('addConsumeAwareSignal', () => {
  it('should intersect the object with a signal property', () => {
    const result = addConsumeAwareSignal(
      { queryKey: ['key'] },
      () => new AbortController().signal,
      noop,
    )

    expectTypeOf(result).toEqualTypeOf<
      { queryKey: Array<string> } & { signal: AbortSignal }
    >()
    expectTypeOf(result.signal).toEqualTypeOf<AbortSignal>()
    expectTypeOf(result.queryKey).toEqualTypeOf<Array<string>>()
  })

  it('should only accept an onCancelled callback taking no arguments', () => {
    expectTypeOf(addConsumeAwareSignal<{ a: number }>)
      .parameter(2)
      .toEqualTypeOf<VoidFunction>()
  })
})

describe('isServer', () => {
  it('should be typed as a boolean', () => {
    expectTypeOf(isServer).toEqualTypeOf<boolean>()
  })
})

describe('timeUntilStale', () => {
  it('should return a number', () => {
    expectTypeOf(timeUntilStale).returns.toEqualTypeOf<number>()
  })

  it('should accept the staleTime argument optionally', () => {
    expectTypeOf(timeUntilStale).parameters.toEqualTypeOf<
      [updatedAt: number, staleTime?: number]
    >()

    expectTypeOf(timeUntilStale(1)).toEqualTypeOf<number>()
    expectTypeOf(timeUntilStale(1, 2)).toEqualTypeOf<number>()
  })
})

describe('replaceData', () => {
  it('should return TData rather than the options type', () => {
    expectTypeOf(
      replaceData<{ value: string }, QueryOptions<any, any, any, any>>,
    ).returns.toEqualTypeOf<{ value: string }>()
  })

  it('should widen only the previous data with undefined', () => {
    type Params = Parameters<
      typeof replaceData<{ value: string }, QueryOptions<any, any, any, any>>
    >

    expectTypeOf<Params[0]>().toEqualTypeOf<{ value: string } | undefined>()
    expectTypeOf<Params[1]>().toEqualTypeOf<{ value: string }>()
  })

  it('should constrain TOptions to QueryOptions', () => {
    expectTypeOf(
      replaceData<{ value: string }, QueryOptions<any, any, any, any>>,
    )
      .parameter(2)
      .toEqualTypeOf<QueryOptions<any, any, any, any>>()

    // @ts-expect-error a primitive does not satisfy the QueryOptions constraint
    replaceData<{ value: string }, number>({ value: 'a' }, { value: 'b' }, 1)
  })
})
