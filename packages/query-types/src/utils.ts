import type { MutationOf, QueryOf, RuntimeBinding } from './binding'
import type { fetchSignal } from './symbols'
import type {
  DefaultError,
  FetchStatus,
  MutationKey,
  MutationStatus,
  QueryKey,
} from './types'

type DropLast<T extends ReadonlyArray<unknown>> = T extends readonly [
  ...infer R,
  unknown,
]
  ? readonly [...R]
  : never

type TuplePrefixes<T extends ReadonlyArray<unknown>> = T extends readonly []
  ? readonly []
  : TuplePrefixes<DropLast<T>> | T

/**
 * Filters used to select queries, for example in `queryClient.getQueriesData` or `queryClient.invalidateQueries`.
 * All provided filters must match; filters that are left unspecified are ignored.
 */
export interface QueryFilters<
  TRuntime extends RuntimeBinding,
  TQueryKey extends QueryKey = QueryKey,
> {
  /**
   * Filter to active queries, inactive queries or all queries
   * @defaultValue 'all'
   */
  type?: QueryTypeFilter
  /**
   * Match query key exactly
   */
  exact?: boolean
  /**
   * Include queries matching this predicate function
   */
  predicate?: (query: QueryOf<TRuntime>) => boolean
  /**
   * Include queries matching this query key
   */
  queryKey?: TQueryKey | TuplePrefixes<TQueryKey>
  /**
   * Include or exclude stale queries
   */
  stale?: boolean
  /**
   * Include queries matching their fetchStatus
   */
  fetchStatus?: FetchStatus
}

/**
 * Filters used to select mutations, for example in `mutationCache.findAll` or `queryClient.isMutating`.
 * All provided filters must match; filters that are left unspecified are ignored.
 */
export interface MutationFilters<
  TRuntime extends RuntimeBinding,
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> {
  /**
   * Match mutation key exactly
   */
  exact?: boolean
  /**
   * Include mutations matching this predicate function
   */
  predicate?: (
    mutation: MutationOf<TRuntime, TData, TError, TVariables, TOnMutateResult>,
  ) => boolean
  /**
   * Include mutations matching this mutation key
   */
  mutationKey?: TuplePrefixes<MutationKey>
  /**
   * Filter by mutation status
   */
  status?: MutationStatus
}

/**
 * Either a plain value of type `TOutput`, or a function that receives `TInput` and returns `TOutput`.
 * Used for example by `setQueryData`-style updaters, which accept either the new data directly or a
 * function that computes it from the previous data. See {@link functionalUpdate}.
 * @example
 * ```ts
 * queryClient.setQueryData(['posts'], newPosts)
 *
 * // Or, using an updater function that receives the current data:
 * queryClient.setQueryData(['posts'], (oldPosts) =>
 *   oldPosts ? [...oldPosts, newPost] : oldPosts,
 * )
 * ```
 */
export type Updater<TInput, TOutput> = TOutput | ((input: TInput) => TOutput)

/**
 * Which queries a filter matches: all of them, only active ones (with enabled observers), or only
 * inactive ones.
 */
export type QueryTypeFilter = 'all' | 'active' | 'inactive'

export type { skipToken as SkipToken } from './symbols'

export type { defaultQueryFn as DefaultQueryFn } from './symbols'

/** Internal view of a context that exposes its signal without consuming it. */
interface FetchSignalContext {
  readonly signal: AbortSignal
  readonly [fetchSignal]?: AbortSignal
}

export type { DropLast, TuplePrefixes, FetchSignalContext }
