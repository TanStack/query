// Definitions by: Lukasz Fiszer <https://github.com/lukaszfiszer>
//                 Jace Hensley <https://github.com/jacehensley>
//                 Matteo Frana <https://github.com/matteofrana>
//                 Igor Oleinikov <https://github.com/igorbek>
// Minimum TypeScript Version: 3.7

import * as React from 'react'
import * as _ from 'ts-toolbelt'

// overloaded useQuery function
export function useQuery<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables = [],
  TError = Error
>({
  queryKey,
  variables,
  queryFn,
  config,
}: {
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined)
  variables?: TVariables
  queryFn: QueryFunctionWithVariables<TResult, TKey, TVariables>
  config?: QueryOptions<TResult, TError>
}): QueryResult<TResult, TError>

export function useQuery<
  TResult,
  TSingleKey extends string,
  TVariables extends AnyVariables = [],
  TError = Error
>({
  queryKey,
  variables,
  queryFn,
  config,
}: {
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined)
  variables?: TVariables
  queryFn: QueryFunctionWithVariables<TResult, [TSingleKey], TVariables>
  config?: QueryOptions<TResult, TError>
}): QueryResult<TResult, TError>

export function useQuery<TResult, TKey extends AnyQueryKey, TError = Error>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult, TError>
): QueryResult<TResult, TError>

export function useQuery<TResult, TSingleKey extends string, TError = Error>(
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined),
  queryFn: QueryFunction<TResult, [TSingleKey]>,
  config?: QueryOptions<TResult, TError>
): QueryResult<TResult, TError>

export function useQuery<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables,
  TError = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  variables: TVariables,
  queryFn: QueryFunctionWithVariables<TResult, TKey, TVariables>,
  config?: QueryOptions<TResult, TError>
): QueryResult<TResult, TError>

export function useQuery<
  TResult,
  TKey extends string,
  TVariables extends AnyVariables,
  TError = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  variables: TVariables,
  queryFn: QueryFunctionWithVariables<TResult, [TKey], TVariables>,
  config?: QueryOptions<TResult, TError>
): QueryResult<TResult, TError>

// usePaginatedQuery
export function usePaginatedQuery<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables = [],
  TError  = Error
>({
  queryKey,
  variables,
  queryFn,
  config,
}: {
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined)
  variables?: TVariables
  queryFn: QueryFunctionWithVariables<TResult, TKey, TVariables>
  config?: QueryOptions<TResult, TError>
}): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TSingleKey extends string,
  TVariables extends AnyVariables = [],
TError  = Error
>({
  queryKey,
  variables,
  queryFn,
  config,
}: {
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined)
  variables?: TVariables
  queryFn: QueryFunctionWithVariables<TResult, [TSingleKey], TVariables>
  config?: QueryOptions<TResult, TError>
}): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TKey extends AnyQueryKey, TError  = Error>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TKey extends string, TError  = Error>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, [TKey]>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables,
TError  = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  variables: TVariables,
  queryFn: QueryFunctionWithVariables<TResult, TKey, TVariables>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TKey extends string,
  TVariables extends AnyVariables,
  TError  = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  variables: TVariables,
  queryFn: QueryFunctionWithVariables<TResult, [TKey], TVariables>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// useInfiniteQuery
export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable,
  TVariables extends AnyVariables = [],
  TError  = Error
>({
  queryKey,
  variables,
  queryFn,
  config,
}: {
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined)
  variables?: TVariables
  queryFn: InfiniteQueryFunctionWithVariables<
    TResult,
    TKey,
    TVariables,
    TMoreVariable
  >
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
}): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TSingleKey extends string,
  TMoreVariable,
  TVariables extends AnyVariables = [],
  TError  = Error
>({
  queryKey,
  variables,
  queryFn,
  config,
}: {
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined)
  variables?: TVariables
  queryFn: InfiniteQueryFunctionWithVariables<
    TResult,
    [TSingleKey],
    TVariables,
    TMoreVariable
  >
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
}): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable,
  TError  = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: InfiniteQueryFunction<TResult, TKey, TMoreVariable>,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<TResult, TKey extends string, TMoreVariable, TError  = Error>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: InfiniteQueryFunction<TResult, [TKey], TMoreVariable>,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables,
  TMoreVariable,
  TError  = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  variables: TVariables,
  queryFn: InfiniteQueryFunctionWithVariables<
    TResult,
    TKey,
    TVariables,
    TMoreVariable
  >,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends string,
  TVariables extends AnyVariables,
  TMoreVariable,
  TError  = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  variables: TVariables,
  queryFn: InfiniteQueryFunctionWithVariables<
    TResult,
    [TKey],
    TVariables,
    TMoreVariable
  >,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export type QueryKeyPart =
  | string
  | object
  | boolean
  | number
  | null
  | readonly QueryKeyPart[]
  | null
  | undefined

export type AnyQueryKey = readonly [string, ...QueryKeyPart[]] // this forces the key to be inferred as a tuple

export type AnyVariables = readonly [] | readonly [any, ...any[]] // this forces the variables to be inferred as a tuple

export type QueryFunction<TResult, TKey extends AnyQueryKey> = (
  ...key: TKey
) => Promise<TResult>

export type QueryFunctionWithVariables<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables
> = (...key: _.List.Concat<TKey, TVariables>) => Promise<TResult>

export type InfiniteQueryFunction<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable
> = (
  ...keysAndMore: _.List.Append<TKey, TMoreVariable> | TKey
) => Promise<TResult>

export type InfiniteQueryFunctionWithVariables<
  TResult,
  TKey extends AnyQueryKey,
  TVariables extends AnyVariables,
  TMoreVariable
> = (
  ...keysAndVariablesAndMore:
    | _.List.Append<_.List.Concat<TKey, TVariables>, TMoreVariable>
    | _.List.Concat<TKey, TVariables>
) => Promise<TResult>

export interface BaseQueryOptions<TError = Error> {
  /**
   * Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   */
  manual?: boolean
  /**
   * If `false`, failed queries will not retry by default.
   * If `true`, failed queries will retry infinitely., failureCount: num
   * If set to an integer number, e.g. 3, failed queries will retry until the failed query count meets that number.
   * If set to a function `(failureCount, error) => boolean` failed queries will retry until the function returns false.
   */
  retry?: boolean | number | ((failureCount: number, error: TError) => boolean)
  retryDelay?: (retryAttempt: number) => number
  staleTime?: number
  cacheTime?: number
  refetchInterval?: false | number
  refetchIntervalInBackground?: boolean
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  onError?: (err: TError) => void
  suspense?: boolean
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
}

export interface QueryOptions<TResult, TError = Error> extends BaseQueryOptions<TError> {
  onSuccess?: (data: TResult) => void
  onSettled?: (data: TResult | undefined, error: TError | null) => void
  initialData?: TResult | (() => TResult | undefined)
}

export interface PrefetchQueryOptions<TResult, TError = Error> extends QueryOptions<TResult, TError> {
  force?: boolean
  throwOnError?: boolean
}

export interface InfiniteQueryOptions<TResult, TMoreVariable, TError = Error>
  extends QueryOptions<TResult[], TError> {
  getFetchMore: (
    lastPage: TResult,
    allPages: TResult[]
  ) => TMoreVariable | false
}

export interface QueryResultBase<TResult, TError = Error> {
  status: 'loading' | 'error' | 'success'
  error: null | TError
  isFetching: boolean
  isStale: boolean
  failureCount: number
  refetch: ({
    force,
    throwOnError,
  }?: {
    force?: boolean
    throwOnError?: boolean
  }) => Promise<TResult>
}

export interface QueryLoadingResult<TResult, TError = Error> extends QueryResultBase<TResult, TError> {
  status: 'loading'
  data: TResult | undefined // even when error, data can have stale data
  error: TError | null // it still can be error
}

export interface QueryErrorResult<TResult, TError = Error> extends QueryResultBase<TResult, TError> {
  status: 'error'
  data: TResult | undefined // even when error, data can have stale data
  error: TError
}

export interface QuerySuccessResult<TResult> extends QueryResultBase<TResult> {
  status: 'success'
  data: TResult
  error: null
}

export type QueryResult<TResult, TError = Error> =
  | QueryLoadingResult<TResult, TError>
  | QueryErrorResult<TResult, TError>
  | QuerySuccessResult<TResult>

export interface PaginatedQueryLoadingResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'loading'
  resolvedData: undefined | TResult // even when error, data can have stale data
  latestData: undefined | TResult // even when error, data can have stale data
  error: null | TError // it still can be error
}

export interface PaginatedQueryErrorResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'error'
  resolvedData: undefined | TResult // even when error, data can have stale data
  latestData: undefined | TResult // even when error, data can have stale data
  error: TError
}

export interface PaginatedQuerySuccessResult<TResult>
  extends QueryResultBase<TResult> {
  status: 'success'
  resolvedData: TResult
  latestData: TResult
  error: null
}

export type PaginatedQueryResult<TResult, TError = Error> =
  | PaginatedQueryLoadingResult<TResult, TError>
  | PaginatedQueryErrorResult<TResult, TError>
  | PaginatedQuerySuccessResult<TResult>

export interface InfiniteQueryResult<TResult, TMoreVariable, TError = Error>
  extends QueryResultBase<TResult[], TError> {
  data: TResult[]
  isFetchingMore: boolean
  canFetchMore: boolean | undefined
  fetchMore: (
    moreVariable?: TMoreVariable | false
  ) => Promise<TResult[]> | undefined
}

export function useMutation<TResults, TVariables = undefined, TError  = Error>(
  mutationFn: MutationFunction<TResults, TVariables>,
  mutationOptions?: MutationOptions<TResults, TVariables, TError>
): [MutateFunction<TResults, TVariables, TError>, MutationResult<TResults, TError>]

export type MutationFunction<TResults, TVariables> = (
  variables: TVariables
) => Promise<TResults>

export interface MutateOptions<TResult, TVariables, TError = Error> {
  onSuccess?: (data: TResult, variables: TVariables) => Promise<void> | void
  onError?: (
    error: TError,
    variables: TVariables,
    snapshotValue: unknown
  ) => Promise<void> | void
  onSettled?: (
    data: undefined | TResult,
    error: TError | null,
    variables: TVariables,
    snapshotValue?: unknown
  ) => Promise<void> | void
  throwOnError?: boolean
}

export interface MutationOptions<TResult, TVariables, TError = Error>
  extends MutateOptions<TResult, TVariables, TError> {
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown
  useErrorBoundary?: boolean
}

export type MutateFunction<TResult, TVariables, TError = Error> = undefined extends TVariables
  ? (
      variables?: TVariables,
      options?: MutateOptions<TResult, TVariables, TError>
    ) => Promise<TResult>
  : (
      variables: TVariables,
      options?: MutateOptions<TResult, TVariables, TError>
    ) => Promise<TResult>

export interface MutationResultBase<TResult, TError = Error> {
  status: 'idle' | 'loading' | 'error' | 'success'
  data: undefined | TResult
  error: undefined | null | TError
  promise: Promise<TResult>
  reset: () => void
}

export interface IdleMutationResult<TResult, TError = Error>
  extends MutationResultBase<TResult, TError> {
  status: 'idle'
  data: undefined
  error: null
}

export interface LoadingMutationResult<TResult, TError = Error>
  extends MutationResultBase<TResult, TError> {
  status: 'loading'
  data: undefined
  error: undefined
}

export interface ErrorMutationResult<TResult, TError = Error>
  extends MutationResultBase<TResult, TError> {
  status: 'error'
  data: undefined
  error: TError
}

export interface SuccessMutationResult<TResult>
  extends MutationResultBase<TResult> {
  status: 'success'
  data: TResult
  error: undefined
}

export type MutationResult<TResult, TError = Error> =
  | IdleMutationResult<TResult, TError>
  | LoadingMutationResult<TResult, TError>
  | ErrorMutationResult<TResult, TError>
  | SuccessMutationResult<TResult>

export interface CachedQueryState<T> {
  data?: T
  error?: Error | null
  failureCount: number
  isFetching: boolean
  canFetchMore?: boolean
  isStale: boolean
  status: 'loading' | 'error' | 'success'
  updatedAt: number
}

export interface CachedQuery<T, TError = unknown> {
  queryKey: AnyQueryKey
  queryVariables: AnyVariables
  queryFn: (...args: any[]) => unknown
  config: QueryOptions<unknown, TError>
  state: CachedQueryState<T>
  setData(
    dataOrUpdater: unknown | undefined | ((oldData: unknown | undefined) => unknown | undefined)
  ): void
  clear(): void
}

export interface QueryCache {
  prefetchQuery<TResult, TKey extends AnyQueryKey, TError = Error>(
    queryKey:
      | TKey
      | false
      | null
      | undefined
      | (() => TKey | false | null | undefined),
    queryFn: QueryFunction<TResult, TKey>,
    config?: PrefetchQueryOptions<TResult, TError>
  ): Promise<TResult>

  prefetchQuery<TResult, TKey extends string, TError = Error>(
    queryKey:
      | TKey
      | false
      | null
      | undefined
      | (() => TKey | false | null | undefined),
    queryFn: QueryFunction<TResult, [TKey]>,
    config?: PrefetchQueryOptions<TResult, TError>
  ): Promise<TResult>

  prefetchQuery<
    TResult,
    TKey extends AnyQueryKey,
    TVariables extends AnyVariables,
    TError = Error
  >(
    queryKey:
      | TKey
      | false
      | null
      | undefined
      | (() => TKey | false | null | undefined),
    variables: TVariables,
    queryFn: QueryFunctionWithVariables<TResult, TKey, TVariables>,
    config?: PrefetchQueryOptions<TResult, TError>
  ): Promise<TResult>

  prefetchQuery<TResult, TKey extends string, TVariables extends AnyVariables, TError = Error>(
    queryKey:
      | TKey
      | false
      | null
      | undefined
      | (() => TKey | false | null | undefined),
    variables: TVariables,
    queryFn: QueryFunctionWithVariables<TResult, [TKey], TVariables>,
    config?: PrefetchQueryOptions<TResult, TError>
  ): Promise<TResult>

  prefetchQuery<
    TResult,
    TKey extends AnyQueryKey,
    TVariables extends AnyVariables = [],
    TError = Error
  >({
    queryKey,
    variables,
    queryFn,
    config,
  }: {
    queryKey:
      | TKey
      | false
      | null
      | undefined
      | (() => TKey | false | null | undefined)
    variables?: TVariables
    queryFn: QueryFunctionWithVariables<TResult, TKey, TVariables>
    config?: PrefetchQueryOptions<TResult, TError>
  }): Promise<TResult>

  getQueryData<T = unknown>(key: AnyQueryKey | string): T | undefined
  setQueryData<T = unknown>(
    key: AnyQueryKey | string,
    dataOrUpdater: T | undefined | ((oldData: T | undefined) => T | undefined)
  ): void
  refetchQueries<TResult>(
    queryKeyOrPredicateFn:
      | AnyQueryKey
      | string
      | ((query: CachedQuery<unknown>) => boolean),
    {
      exact,
      throwOnError,
      force,
    }?: { exact?: boolean; throwOnError?: boolean; force?: boolean }
  ): Promise<TResult>
  removeQueries(
    queryKeyOrPredicateFn:
      | AnyQueryKey
      | string
      | ((query: CachedQuery<unknown>) => boolean),
    { exact }?: { exact?: boolean }
  ): void
  getQuery(queryKey: AnyQueryKey): CachedQuery<unknown> | undefined
  getQueries(queryKey: AnyQueryKey): Array<CachedQuery<unknown>>
  cancelQueries(
    queryKeyOrPredicateFn:
      | AnyQueryKey
      | string
      | ((query: CachedQuery<unknown>) => boolean),
    { exact }?: { exact?: boolean }
  ): void
  isFetching: number
  subscribe(callback: (queryCache: QueryCache) => void): () => void
  clear(): void
}

export const queryCache: QueryCache

/**
 * a factory that creates a new query cache
 */
export function makeQueryCache(): QueryCache

/**
 * A hook that uses the query cache context
 */
export function useQueryCache(): QueryCache

export const ReactQueryCacheProvider: React.ComponentType<{
  queryCache?: QueryCache
}>

/**
 * A hook that returns the number of the queries that your application is loading or fetching in the background
 * (useful for app-wide loading indicators).
 * @returns the number of the queries that your application is currently loading or fetching in the background.
 */
export function useIsFetching(): number

export function ReactQueryConfigProvider<TError = Error>(props: {
  config?: ReactQueryProviderConfig<TError>;
  children?: React.ReactNode;
}): React.ReactElement;

export interface ReactQueryProviderConfig<TError = Error> extends BaseQueryOptions<TError> {
  /** Defaults to the value of `suspense` if not defined otherwise */
  useErrorBoundary?: boolean
  throwOnError?: boolean
  refetchAllOnWindowFocus?: boolean
  queryKeySerializerFn?: (
    queryKey:
      | QueryKeyPart[]
      | string
      | false
      | undefined
      | (() => QueryKeyPart[] | string | false | undefined)
  ) => [string, QueryKeyPart[]] | []

  onMutate?: (variables: unknown) => Promise<unknown> | unknown
  onSuccess?: (data: unknown, variables?: unknown) => void
  onError?: (err: TError, snapshotValue?: unknown) => void
  onSettled?: (
    data: unknown | undefined,
    error: TError | null,
    snapshotValue?: unknown
  ) => void
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
}

export type ConsoleFunction = (...args: any[]) => void
export interface ConsoleObject {
  log: ConsoleFunction
  warn: ConsoleFunction
  error: ConsoleFunction
}

export function setConsole(consoleObject: ConsoleObject): void

export function deepIncludes(haystack: unknown, needle: unknown): boolean
