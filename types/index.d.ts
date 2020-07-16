// Definitions by: Lukasz Fiszer <https://github.com/lukaszfiszer>
//                 Jace Hensley <https://github.com/jacehensley>
//                 Matteo Frana <https://github.com/matteofrana>
//                 Igor Oleinikov <https://github.com/igorbek>
// Minimum TypeScript Version: 3.9

import * as React from 'react'
import * as _ from 'ts-toolbelt'

// overloaded useQuery function
export type UseQueryRest<TResult, TKey extends AnyQueryKey, TError> =
  | []
  | [QueryFunction<TResult, TKey>]
  | [QueryFunction<TResult, TKey>, QueryOptions<TResult, TError> | undefined]
  | [QueryOptions<TResult, TError>]

// Object Syntax
export function useQuery<TResult, TKey extends AnyQueryKey, TError = Error>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey: TKey
  queryFn?: QueryFunction<TResult, TKey>
  config?: QueryOptions<TResult, TError>
}): QueryResult<TResult, TError>

export function useQuery<TResult, TKey extends string, TError = Error>({
  queryKey,
  queryFn,
  config,
}: {
  queryKey: TKey
  queryFn?: QueryFunction<TResult, [TKey]>
  config?: QueryOptions<TResult, TError>
}): QueryResult<TResult, TError>

// Parameters Syntax
export function useQuery<TResult, TKey extends AnyQueryKey, TError = Error>(
  queryKey: TKey | false | null | undefined,
  ...rest: UseQueryRest<TResult, TKey, TError>
): QueryResult<TResult, TError>

export function useQuery<TResult, TKey extends string, TError = Error>(
  queryKey: TKey | false | null | undefined,
  ...rest: UseQueryRest<TResult, [TKey], TError>
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
  queryKey: TKey | false | null | undefined
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
  queryKey: TSingleKey | false | null | undefined
  queryFn: QueryFunction<TResult, [TSingleKey]>
  config?: QueryOptions<TResult, TError>
}): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TKey extends AnyQueryKey,
  TError = Error
>(
  queryKey: TKey | false | null | undefined,
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TKey extends string, TError = Error>(
  queryKey: TKey | false | null | undefined,
  queryFn: QueryFunction<TResult, [TKey]>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<
  TResult,
  TKey extends AnyQueryKey,
  TError = Error
>(
  queryKey: TKey | false | null | undefined,
  queryFn: QueryFunction<TResult, TKey>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

export function usePaginatedQuery<TResult, TKey extends string, TError = Error>(
  queryKey: TKey | false | null | undefined,
  queryFn: QueryFunction<TResult, [TKey]>,
  config?: QueryOptions<TResult, TError>
): PaginatedQueryResult<TResult, TError>

// useInfiniteQuery
export type InfiniteQueryKey<T> = T | false | null | undefined
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
  queryKey: InfiniteQueryKey<TKey>
  queryFn?: InfiniteQueryFunction<TResult, TKey, TMoreVariable>
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
  queryKey: InfiniteQueryKey<TSingleKey>
  queryFn?: InfiniteQueryFunction<TResult, [TSingleKey], TMoreVariable>
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
}): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable,
  TError = Error
>(
  queryKey: InfiniteQueryKey<TKey>,
  queryFn: InfiniteQueryFunction<TResult, TKey, TMoreVariable>,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends string,
  TMoreVariable,
  TError = Error
>(
  queryKey: InfiniteQueryKey<TKey>,
  queryFn: InfiniteQueryFunction<TResult, [TKey], TMoreVariable>,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends AnyQueryKey,
  TMoreVariable,
  TError = Error
>(
  queryKey: InfiniteQueryKey<TKey>,
  queryFn: InfiniteQueryFunction<TResult, TKey, TMoreVariable>,
  config?: InfiniteQueryOptions<TResult, TMoreVariable, TError>
): InfiniteQueryResult<TResult, TMoreVariable, TError>

export function useInfiniteQuery<
  TResult,
  TKey extends string,
  TMoreVariable,
  TError = Error
>(
  queryKey: InfiniteQueryKey<TKey>,
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
  ...key: Readonly<TKey>
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

export interface BaseQueryOptions<TResult = unknown, TError = Error> {
  /**
   * Set this to `false` to disable automatic refetching when the query mounts or changes query keys.
   * To refetch the query, use the `refetch` method returned from the `useQuery` instance.
   */
  enabled?: boolean | unknown
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
  onSuccess?: (data: TResult) => void
  onError?: (err: TError) => void
  onSettled?: (data: TResult | undefined, error: TError | null) => void
  isDataEqual?: (oldData: unknown, newData: unknown) => boolean
  useErrorBoundary?: boolean
  queryFnParamsFilter?: (args: any[]) => any[]
}

export interface QueryOptions<TResult, TError = Error>
  extends BaseQueryOptions<TResult, TError> {
  suspense?: boolean
  initialData?: TResult | (() => TResult | undefined)
  initialStale?: boolean | (() => boolean | undefined)
}

export interface PrefetchQueryOptions {
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
  canFetchMore?: boolean
  markedForGarbageCollection: boolean
  query: object
  updatedAt: number
  refetch: ({ throwOnError }?: { throwOnError?: boolean }) => Promise<TResult>
  clear: () => void
}

export interface QueryIdleResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'idle'
  isIdle: true
  isLoading: false
  isSuccess: false
  isError: false
  data: undefined
  error: null
}

export interface QueryLoadingResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'loading'
  isIdle: false
  isLoading: true
  isSuccess: false
  isError: false
  data: TResult | undefined // even when error, data can have stale data
  error: TError | null // it still can be error
}

export interface QueryErrorResult<TResult, TError = Error>
  extends QueryResultBase<TResult, TError> {
  status: 'error'
  isIdle: false
  isError: true
  isLoading: false
  isSuccess: false
  data: TResult | undefined // even when error, data can have stale data
  error: TError
}

export interface QuerySuccessResult<TResult> extends QueryResultBase<TResult> {
  status: 'success'
  isIdle: false
  isSuccess: true
  isLoading: false
  isError: false
  data: TResult
  error: null
}

export type QueryResult<TResult, TError = Error> =
  | QueryIdleResult<TResult, TError>
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
  data: TResult[] | undefined
  isFetchingMore: false | 'previous' | 'next'
  canFetchMore: boolean | undefined
  fetchMore: (
    moreVariable?: TMoreVariable | false,
    options?: { previous: boolean }
  ) => Promise<TResult[]> | undefined
}

export function useMutation<
  TResult,
  TVariables = undefined,
  TError = Error,
  TSnapshot = unknown
>(
  mutationFn: MutationFunction<TResult, TVariables, TError, TSnapshot>,
  mutationOptions?: MutationOptions<TResult, TVariables, TError, TSnapshot>
): MutationResultPair<TResult, TVariables, TError>

export type MutationResultPair<TResult, TVariables, TError> = [
  MutateFunction<TResult, TVariables, TError>,
  MutationResult<TResult, TError>
]

export type MutationFunction<
  TResult,
  TVariables,
  TError = Error,
  TSnapshot = unknown
> = (
  variables: TVariables,
  mutateOptions?: MutateOptions<TResult, TVariables, TError, TSnapshot>
) => Promise<TResult>

export interface MutateOptions<
  TResult,
  TVariables,
  TError = Error,
  TSnapshot = unknown
> {
  onSuccess?: (data: TResult, variables: TVariables) => Promise<void> | void
  onError?: (
    error: TError,
    variables: TVariables,
    snapshotValue: TSnapshot
  ) => Promise<void> | void
  onSettled?: (
    data: undefined | TResult,
    error: TError | null,
    variables: TVariables,
    snapshotValue?: TSnapshot
  ) => Promise<void> | void
  throwOnError?: boolean
}

export interface MutationOptions<
  TResult,
  TVariables,
  TError = Error,
  TSnapshot = unknown
> extends MutateOptions<TResult, TVariables, TError, TSnapshot> {
  onMutate?: (variables: TVariables) => Promise<TSnapshot> | TSnapshot
  useErrorBoundary?: boolean
}

export type MutateFunction<
  TResult,
  TVariables,
  TError = Error
> = TVariables extends undefined
  ? (options?: MutateOptions<TResult, TVariables, TError>) => Promise<TResult>
  : (
      variables: TVariables,
      options?: MutateOptions<TResult, TVariables, TError>
    ) => Promise<TResult>

export interface MutationResultBase<TResult, TError = Error> {
  status: 'idle' | 'loading' | 'error' | 'success'
  data: undefined | TResult
  error: undefined | null | TError
  isIdle: boolean
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
  reset: () => void
}

export interface IdleMutationResult<TResult, TError = Error>
  extends MutationResultBase<TResult, TError> {
  status: 'idle'
  data: undefined
  error: null
  isIdle: true
  isLoading: false
  isSuccess: false
  isError: false
}

export interface LoadingMutationResult<TResult, TError = Error>
  extends MutationResultBase<TResult, TError> {
  status: 'loading'
  data: undefined
  error: undefined
  isIdle: false
  isLoading: true
  isSuccess: false
  isError: false
}

export interface ErrorMutationResult<TResult, TError = Error>
  extends MutationResultBase<TResult, TError> {
  status: 'error'
  data: undefined
  error: TError
  isIdle: false
  isLoading: false
  isSuccess: false
  isError: true
}

export interface SuccessMutationResult<TResult>
  extends MutationResultBase<TResult> {
  status: 'success'
  data: TResult
  error: undefined
  isIdle: false
  isLoading: false
  isSuccess: true
  isError: false
}

export type MutationResult<TResult, TError = Error> =
  | IdleMutationResult<TResult, TError>
  | LoadingMutationResult<TResult, TError>
  | ErrorMutationResult<TResult, TError>
  | SuccessMutationResult<TResult>

export interface CachedQueryState<T, TError = Error> {
  data?: T
  error?: TError | null
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
  state: CachedQueryState<T, TError>
  setData(
    dataOrUpdater:
      | unknown
      | undefined
      | ((oldData: unknown | undefined) => unknown | undefined)
  ): void
  clear(): void
}

export type QueryKey<TKey> = TKey | false | null | undefined

export type QueryKeyOrPredicateFn =
  | AnyQueryKey
  | string
  | boolean
  | ((query: CachedQuery<unknown>) => boolean)

export interface QueryCache {
  prefetchQuery<TResult, TKey extends AnyQueryKey, TError = Error>(
    queryKey: QueryKey<TKey>,
    queryFn: QueryFunction<TResult, TKey>,
    config?: QueryOptions<TResult, TError>,
    prefetch?: PrefetchQueryOptions
  ): Promise<TResult>

  prefetchQuery<TResult, TKey extends string, TError = Error>(
    queryKey: QueryKey<TKey>,
    queryFn: QueryFunction<TResult, [TKey]>,
    config?: QueryOptions<TResult, TError>,
    prefetch?: PrefetchQueryOptions
  ): Promise<TResult>

  prefetchQuery<TResult, TKey extends AnyQueryKey, TError = Error>(
    queryKey: QueryKey<TKey>,
    queryFn: QueryFunction<TResult, TKey>,
    prefetch?: PrefetchQueryOptions,
    config?: QueryOptions<TResult, TError>
  ): Promise<TResult>

  prefetchQuery<TResult, TKey extends string, TError = Error>(
    queryKey: QueryKey<TKey>,
    queryFn: QueryFunction<TResult, [TKey]>,
    prefetch?: PrefetchQueryOptions,
    config?: QueryOptions<TResult, TError>
  ): Promise<TResult>

  prefetchQuery<TResult, TKey extends AnyQueryKey, TError = Error>({
    queryKey,
    queryFn,
    config,
  }: {
    queryKey: QueryKey<TKey>
    queryFn: QueryFunction<TResult, TKey>
    config?: QueryOptions<TResult, TError>
    prefetch?: PrefetchQueryOptions
  }): Promise<TResult>

  getQueryData<T = unknown>(key: QueryKeyOrPredicateFn): T | undefined
  setQueryData<TResult, TError = Error>(
    queryKeyOrPredicateFn: QueryKeyOrPredicateFn,
    dataOrUpdater:
      | TResult
      | undefined
      | ((oldData: TResult | undefined) => TResult | undefined),
    config?: SetQueryDataQueryOptions<TResult, TError>
  ): void
  invalidateQueries<TResult>(
    queryKeyOrPredicateFn: QueryKeyOrPredicateFn,
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
    queryKeyOrPredicateFn: QueryKeyOrPredicateFn,
    { exact }?: { exact?: boolean }
  ): void
  getQuery(
    queryKeyOrPredicateFn: QueryKeyOrPredicateFn
  ): CachedQuery<unknown> | undefined
  getQueries(
    queryKeyOrPredicateFn: QueryKeyOrPredicateFn,
    { exact }?: { exact?: boolean }
  ): Array<CachedQuery<unknown>>
  cancelQueries(
    queryKeyOrPredicateFn: QueryKeyOrPredicateFn,
    { exact }?: { exact?: boolean }
  ): void
  isFetching: number
  subscribe(callback: (queryCache: QueryCache, query?: CachedQuery<unknown>) => void): () => void
  clear(options?: { notify?: boolean }): void
  resetErrorBoundaries: () => void
}

export const queryCache: QueryCache
export const queryCaches: QueryCache[]

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
  queries?: BaseQueryOptions<unknown, TError> & {
    /** Defaults to the value of `suspense` if not defined otherwise */
    useErrorBoundary?: boolean
    refetchOnWindowFocus?: boolean
    queryFn?: QueryFunction<unknown, AnyQueryKey>
    queryKeySerializerFn?: (
      queryKey: QueryKeyPart[] | string | false | undefined
    ) => [string, QueryKeyPart[]] | []
  }
  shared?: BaseSharedOptions
  mutations?: MutationOptions<unknown, unknown, TError>
}

export type ConsoleFunction = (...args: any[]) => void
export interface ConsoleObject {
  log: ConsoleFunction
  warn: ConsoleFunction
  error: ConsoleFunction
}

export function setConsole(consoleObject: ConsoleObject): void

export function deepIncludes(haystack: unknown, needle: unknown): boolean
