import {
  defaultQueryFn,
  hashKeyByOptions,
  partialMatchKey,
  skipToken,
} from '@tanstack/query-core/primitives'
import { identity } from './identity'
import type * as Core from '@tanstack/query-core'
import type { DefaultQueryFn, SkipToken } from '@tanstack/query-core/primitives'
import type { Mutation } from './mutation'
import type { FetchOptions, Query } from './query'
import type {
  CacheKeyConfig,
  DefaultError,
  MutationKey,
  QueryFunction,
  QueryKey,
} from './types'

/**
 * Filters used to select queries, for example in `getQueriesData` or `invalidateQueries`.
 * All provided filters must match; filters that are left unspecified are ignored.
 */
export interface QueryFilters<
  TQueryKey extends QueryKey = QueryKey,
> extends Omit<Core.QueryFilters<TQueryKey>, 'predicate'> {
  /**
   * Include queries matching this predicate function
   */
  predicate?: (query: Query) => boolean
}

/**
 * Filters used to select mutations, for example in `mutationCache.findAll` or `isMutating`.
 * All provided filters must match; filters that are left unspecified are ignored.
 */
export interface MutationFilters<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> extends Omit<
  Core.MutationFilters<TData, TError, TVariables, TOnMutateResult>,
  'predicate'
> {
  /**
   * Include mutations matching this predicate function
   */
  predicate?: (
    mutation: Mutation<TData, TError, TVariables, TOnMutateResult>,
  ) => boolean
}

/**
 * Resolves an option that can be given either as a value or as a function of the query, such as
 * `staleTime`.
 * @param value - The option value, or a function that receives `query` and returns the value.
 * @param query - The query passed to `value` if it is a function.
 * @returns The resolved value, or `undefined` if `value` is `undefined`.
 */
export function resolveQueryValue<
  TValue,
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  value:
    | undefined
    | TValue
    | ((query: Query<TQueryFnData, TError, TData, TQueryKey>) => TValue),
  query: Query<TQueryFnData, TError, TData, TQueryKey>,
): TValue | undefined {
  return typeof value === 'function'
    ? (
        value as (
          query: Query<TQueryFnData, TError, TData, TQueryKey>,
        ) => TValue
      )(query)
    : value
}

/**
 * Checks whether a query matches the given {@link QueryFilters}.
 * Every filter that is specified must match; filters that are left unspecified are ignored.
 * @param filters - The filters to check the query against.
 * @param query - The query to check.
 * @param keyConfig - The cache configuration for key comparison and hashing.
 * @returns `true` if the query matches every specified filter.
 * @example
 * ```ts
 * const queryCache = getQueryCache(queryClient)
 *
 * const matchingQueries = queryCache
 *   .getAll()
 *   .filter((query) => matchQuery({ queryKey: ['posts'] }, query))
 * ```
 */
export function matchQuery(
  filters: QueryFilters,
  query: Query<any, any, any, any>,
  keyConfig?: CacheKeyConfig<QueryKey>,
): boolean {
  const {
    type = 'all',
    exact,
    fetchStatus,
    predicate,
    queryKey,
    stale,
  } = filters

  if (queryKey) {
    if (exact) {
      if (query.queryHash !== hashKeyByOptions(queryKey, keyConfig)) {
        return false
      }
    } else if (
      !partialMatchKey(query.queryKey, queryKey, keyConfig?.equalityFn)
    ) {
      return false
    }
  }

  if (type !== 'all') {
    const isActive = query.isActive()
    if (type === 'active' && !isActive) {
      return false
    }
    if (type === 'inactive' && isActive) {
      return false
    }
  }

  if (typeof stale === 'boolean' && query.isStale() !== stale) {
    return false
  }

  if (fetchStatus && fetchStatus !== query.state.fetchStatus) {
    return false
  }

  if (predicate && !predicate(query)) {
    return false
  }

  return true
}

/**
 * Checks whether a mutation matches the given {@link MutationFilters}.
 * Every filter that is specified must match; filters that are left unspecified are ignored.
 * If a `mutationKey` filter is provided but the mutation has no `mutationKey` of its own, it does not match.
 * @param filters - The filters to check the mutation against.
 * @param mutation - The mutation to check.
 * @param keyConfig - The cache configuration for key comparison and hashing.
 * @returns `true` if the mutation matches every specified filter.
 * @example
 * ```ts
 * const mutationCache = getMutationCache(queryClient)
 *
 * const matchingMutations = mutationCache
 *   .getAll()
 *   .filter((mutation) => matchMutation({ mutationKey: ['addPost'] }, mutation))
 * ```
 */
export function matchMutation(
  filters: MutationFilters,
  mutation: Mutation<any, any>,
  keyConfig?: CacheKeyConfig<MutationKey>,
): boolean {
  const { exact, status, predicate, mutationKey } = filters
  if (mutationKey) {
    if (!mutation.options.mutationKey) {
      return false
    }
    if (exact) {
      if (
        hashKeyByOptions(mutation.options.mutationKey, keyConfig) !==
        hashKeyByOptions(mutationKey, keyConfig)
      ) {
        return false
      }
    } else if (
      !partialMatchKey(
        mutation.options.mutationKey,
        mutationKey,
        keyConfig?.equalityFn,
      )
    ) {
      return false
    }
  }

  if (status && mutation.state.status !== status) {
    return false
  }

  if (predicate && !predicate(mutation)) {
    return false
  }

  return true
}

/**
 * Intended to be passed as a query's `placeholderData` option, for example
 * `placeholderData: keepPreviousData`. Instead of resetting the query's data to `undefined` while a new
 * query key is fetching, it keeps displaying the previously fetched data until the new data arrives.
 * @param previousData - The data of the previous query key, passed by the observer.
 * @returns The previous data, unchanged.
 * @example
 * ```ts
 * new QueryObserver(queryClient, {
 *   queryKey: ['posts', page],
 *   queryFn: () => fetchPosts(page),
 *   placeholderData: keepPreviousData,
 * })
 * ```
 */
export const keepPreviousData: <T>(
  previousData: T | undefined,
) => T | undefined = identity

/**
 * Returns the function to call for a fetch. If there is no `queryFn` but the fetch was started from
 * an `initialPromise`, that promise is returned instead. If there is no usable `queryFn`, the returned
 * function rejects with a `Missing queryFn` error.
 * @param options - The query options with the `queryFn`, and the `queryHash` used in error messages.
 * @param fetchOptions - The fetch options, which may carry an `initialPromise`.
 * @returns The function to call for the fetch.
 */
export function ensureQueryFn<
  TQueryFnData = unknown,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: {
    queryFn?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | SkipToken
      | DefaultQueryFn
    queryHash?: string
  },
  fetchOptions?: FetchOptions<TQueryFnData>,
): QueryFunction<TQueryFnData, TQueryKey> {
  if (process.env.NODE_ENV !== 'production') {
    if (options.queryFn === skipToken) {
      console.error(
        `Attempted to invoke queryFn when set to skipToken. This is likely a configuration error. Query hash: '${options.queryHash}'`,
      )
    }
  }

  // if we attempt to retry a fetch that was triggered from an initialPromise
  // when we don't have a queryFn yet, we can't retry, so we just return the already rejected initialPromise
  // if an observer has already mounted, we will be able to retry with that queryFn
  if (!options.queryFn && fetchOptions?.initialPromise) {
    return () => fetchOptions.initialPromise!
  }

  if (
    !options.queryFn ||
    options.queryFn === skipToken ||
    options.queryFn === defaultQueryFn
  ) {
    return () =>
      Promise.reject(new Error(`Missing queryFn: '${options.queryHash}'`))
  }

  return options.queryFn
}

export {
  addConsumeAwareSignal,
  addToArray,
  defaultQueryFn,
  fetchSignal,
  functionalUpdate,
  hashKey,
  hashKeyByOptions,
  isPlainArray,
  isPlainObject,
  isValidTimeout,
  noop,
  partialMatchKey,
  replaceData,
  replaceEqualDeep,
  shallowEqualObjects,
  shouldThrowError,
  skipToken,
  sleep,
  timeUntilStale,
} from '@tanstack/query-core/primitives'
export type {
  DefaultQueryFn,
  FetchSignalContext,
  QueryTypeFilter,
  SkipToken,
  Updater,
} from '@tanstack/query-core/primitives'
