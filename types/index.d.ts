// Definitions by: Lukasz Fiszer <https://github.com/lukaszfiszer>
//                 Jace Hensley <https://github.com/jacehensley>
//                 Matteo Frana <https://github.com/matteofrana>
//                 Igor Oleinikov <https://github.com/igorbek>
// Minimum TypeScript Version: 3.7

import * as React from 'react'
import * as _ from 'ts-toolbelt'

// overloaded useQuery function
export function useQuery<TResult, TKey extends AnyQueryKey, TError = Error>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey: TKey
  queryFn: QueryFunction<TResult, TKey>
  config?: QueryOptions<TResult, TError>
}): QueryResult<TResult, TError>

export function useQuery<TResult, TSingleKey extends string, TError = Error>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined)
  queryFn: QueryFunction<TResult, [TSingleKey]>
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

export function useQuery<TResult, TKey extends string, TError = Error>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, [TKey]>,
  config?: QueryOptions<TResult, TError>
): QueryResult<TResult, TError>

// usePaginatedQuery
export function usePaginatedQuery<
  TResult,
  TKey extends AnyQueryKey,
  TError = Error
>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined)
  queryFn: QueryFunction<TResult, TKey>
  config?: QueryOptions<TResult, TError>
}): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TSingleKey extends string,
  TError = Error
>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined)
  queryFn: QueryFunction<TResult, [TSingleKey]>
  config?: QueryOptions<TResult, TError>
}): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TKey extends AnyQueryKey,
  TError = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TKey extends string, TError = Error>(
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
  TError = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TKey extends string, TError = Error>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: QueryFunction<TResult, [TKey]>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// useInfiniteQuery
export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable,
  TError = Error
>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined)
  queryFn: InfiniteQueryFunction<TResult, TKey, TMoreVariable>
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
}): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TSingleKey extends string,
  TMoreVariable,
  TError = Error
>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey:
    | TSingleKey
    | false
    | null
    | undefined
    | (() => TSingleKey | false | null | undefined)
  queryFn: InfiniteQueryFunction<TResult, [TSingleKey], TMoreVariable>
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
}): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable,
  TError = Error
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

export function useInfiniteQuery<
  TResult,
  TKey extends string,
  TMoreVariable,
  TError = Error
>(
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
  TMoreVariable,
  TError = Error
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

export function useInfiniteQuery<
  TResult,
  TKey extends string,
  TMoreVariable,
  TError = Error
>(
  queryKey:
    | TKey
    | false
    | null
    | undefined
    | (() => TKey | false | null | undefined),
  queryFn: InfiniteQueryFunction<TResult, [TKey], TMoreVariable>,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export type DefinedQueryKeyPart =
  | string
  | object
  | boolean
  | number
  | readonly QueryKeyPart[]

export type QueryKeyPart =
  | string
  | object
  | boolean
  | number
  | readonly QueryKeyPart[]
  | null
  | undefined

export type AnyQueryKey = readonly [DefinedQueryKeyPart, ...QueryKeyPart[]] // this forces the key to be inferred as a tuple

export type QueryFunction<TResult, TKey extends AnyQueryKey> = (
  ...key: TKey
) => Promise<TResult>

export type InfiniteQueryFunction<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable
> = (
  ...keysAndMore: _.List.Append<TKey, TMoreVariable> | TKey
) => Promise<TResult>

export interface BaseSharedOptions {
  suspense: boolean
}

export interface BaseQueryOptions<TError = Error> {
  /**
   * Set this to `true` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   */
  manual?: boolean
  enabled?: boolean
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
  onSuccess?: (data: any) => void
  onError?: (err: TError) => void
  onSettled?: (data: any | undefined, error: TError | null) => void
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
  useErrorBoundary?: boolean
}

export interface QueryOptions<TResult, TError = Error>
  extends BaseQueryOptions<TError> {
  suspense?: boolean
  onSuccess?: (data: TResult) => void
  onSettled?: (data: TResult | undefined, error: TError | null) => void
  initialData?: TResult | (() => TResult | undefined)
  initialStale?: boolean | (() => boolean | undefined)
}

export interface PrefetchQueryOptions<TResult, TError = Error>
  extends QueryOptions<TResult, TError> {
  force?: boolean
  throwOnError?: boolean
}

export interface SetQueryDataQueryOptions<TResult, TError = Error>
  extends QueryOptions<TResult, TError> {
  exact?: boolean
}

export interface InfiniteQueryOptions<TResult, TMoreVariable, TError = Error>
  extends QueryOptions<TResult[], TError> {
  getFetchMore: (
    lastPage: TResult,
    allPages: TResult[]
  ) => TMoreVariable | false
}

export type QueryStatus = 'idle' | 'loading' | 'error' | 'success'

export interface QueryResultBase<TResult, TError = Error> {
  status: QueryStatus
  error: null | TError
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  isFetching: boolean
  isStale: boolean
  failureCount: number
  refetch: ({ throwOnError }?: { throwOnError?: boolean }) => Promise<TResult>
}

export interface QueryLoadingResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'loading'
  isLoading: true
  isSuccess: false
  isError: false
  data: TResult | undefined // even when error, data can have stale data
  error: TError | null // it still can be error
}

export interface QueryErrorResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'error'
  isError: true
  isLoading: false
  isSuccess: false
  data: TResult | undefined // even when error, data can have stale data
  error: TError
}

export interface QuerySuccessResult<TResult> extends QueryResultBase<TResult> {
  status: 'success'
  isSuccess: true
  isLoading: false
  isError: false
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
  isLoading: true
  isError: false
  isSuccess: false
  resolvedData: undefined | TResult // even when error, data can have stale data
  latestData: undefined | TResult // even when error, data can have stale data
  error: null | TError // it still can be error
}

export interface PaginatedQueryErrorResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'error'
  isError: true
  isLoading: false
  isSuccess: false
  resolvedData: undefined | TResult // even when error, data can have stale data
  latestData: undefined | TResult // even when error, data can have stale data
  error: TError
}

export interface PaginatedQuerySuccessResult<TResult>
  extends QueryResultBase<TResult> {
  status: 'success'
  isSuccess: true
  isError: false
  isLoading: false
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
  isFetchingMore: false | 'previous' | 'next'
  canFetchMore: boolean | undefined
  fetchMore: (
    moreVariable?: TMoreVariable | false
  ) => Promise<TResult[]> | undefined
}

export function useMutation<TResults, TVariables = undefined, TError = Error>(
  mutationFn: MutationFunction<TResults, TVariables, TError>,
  mutationOptions?: MutationOptions<TResults, TVariables, TError>
): [
  MutateFunction<TResults, TVariables, TError>,
  MutationResult<TResults, TError>
]

export type MutationFunction<TResults, TVariables, TError = Error> = (
  variables: TVariables,
  mutateOptions?: MutateOptions<TResults, TVariables, TError>
) => Promise<TResults>

export interface MutateOptions<TResult, TVariables, TError = Error> {
  onSuccess?: (data: TResult, variables: TVariables) => Promise<void> | void
  onError?: (
    error: TError,
    snapshotValue: unknown,
    onMutateValue: (variable: TVariables) => Promise<unknown> | unknown
  ) => Promise<void> | void
  onSettled?: (
    data: undefined | TResult,
    error: TError | null,
    snapshotValue?: unknown
  ) => Promise<void> | void
}

export interface MutationOptions<TResult, TVariables, TError = Error>
  extends MutateOptions<TResult, TVariables, TError> {
  onMutate?: (variables: TVariables) => Promise<unknown> | unknown
  useErrorBoundary?: boolean
}

export type MutateFunction<
  TResult,
  TVariables,
  TError = Error
> = undefined extends TVariables
  ? (options?: MutateOptions<TResult, TVariables, TError>) => Promise<TResult>
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
  queryFn: (...args: any[]) => unknown
  config: QueryOptions<unknown, TError>
  state: CachedQueryState<T>
  setData(
    dataOrUpdater:
      | unknown
      | undefined
      | ((oldData: unknown | undefined) => unknown | undefined)
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

  prefetchQuery<TResult, TKey extends AnyQueryKey, TError = Error>({
    queryKey,

    queryFn,
    config,
  }: {
    queryKey:
      | TKey
      | false
      | null
      | undefined
      | (() => TKey | false | null | undefined)
    queryFn: QueryFunction<TResult, TKey>
    config?: PrefetchQueryOptions<TResult, TError>
  }): Promise<TResult>

  getQueryData<T = unknown>(key: AnyQueryKey | string): T | undefined
  setQueryData<TResult, TError>(
    key: AnyQueryKey | string,
    dataOrUpdater:
      | TResult
      | undefined
      | ((oldData: TResult | undefined) => TResult | undefined),
    config?: SetQueryDataQueryOptions<TResult, TError>
  ): void
  invalidateQueries<TResult>(
    queryKeyOrPredicateFn:
      | AnyQueryKey
      | string
      | ((query: CachedQuery<unknown>) => boolean),
    {
      exact,
      throwOnError,
      refetchActive,
      refetchInactive,
    }?: {
      exact?: boolean
      throwOnError?: boolean
      refetchActive?: boolean
      refetchInactive?: boolean
    }
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

export interface MakeQueryCacheOptions {
  frozen?: boolean
  defaultConfig?: BaseQueryOptions
}

/**
 * a factory that creates a new query cache
 */
export function makeQueryCache(
  makeQueryCacheOptions?: MakeQueryCacheOptions
): QueryCache

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
  config?: ReactQueryProviderConfig<TError>
  children?: React.ReactNode
}): React.ReactElement

export interface ReactQueryProviderConfig<TError = Error> {
  queries?: BaseQueryOptions & {
    /** Defaults to the value of `suspense` if not defined otherwise */
    useErrorBoundary?: boolean
    refetchOnWindowFocus?: boolean
    queryKeySerializerFn?: (
      queryKey:
        | QueryKeyPart[]
        | string
        | false
        | undefined
        | (() => QueryKeyPart[] | string | false | undefined)
    ) => [string, QueryKeyPart[]] | []
  }
  shared?: BaseSharedOptions
  mutations?: {
    throwOnError?: boolean
    useErrorBoundary?: boolean
    onMutate?: (variables: unknown) => Promise<unknown> | unknown
    onSuccess?: (data: unknown, variables?: unknown) => void
    onError?: (err: TError, snapshotValue?: unknown) => void
    onSettled?: (
      data: unknown | undefined,
      error: TError | null,
      snapshotValue?: unknown
    ) => void
  }
}

export type ConsoleFunction = (...args: any[]) => void
export interface ConsoleObject {
  log: ConsoleFunction
  warn: ConsoleFunction
  error: ConsoleFunction
}

export function setConsole(consoleObject: ConsoleObject): void

export function deepIncludes(haystack: unknown, needle: unknown): boolean
