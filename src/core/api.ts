import type { Environment } from './environment'
import { infiniteQueryBehavior } from './infiniteQueryBehavior'
import { InfiniteQueryObserver } from './infiniteQueryObserver'
import { MutationObserver } from './mutationObserver'
import { notifyManager } from './notifyManager'
import { QueriesObserver } from './queriesObserver'
import type { SetDataOptions, QueryState, Query } from './query'
import { QueryObserver } from './queryObserver'
import type {
  QueryKey,
  InvalidateQueryFilters,
  InvalidateOptions,
  RefetchOptions,
  FetchQueryOptions,
  MutationOptions,
  QueryObserverOptions,
  InfiniteQueryObserverOptions,
  InfiniteData,
} from './types'
import {
  QueryFilters,
  parseFilterArgs,
  Updater,
  parseQueryArgs,
  CancelOptions,
  noop,
  matchQuery,
} from './utils'

// API

export function findQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  environment: Environment,
  queryKey: QueryKey
): Query<TData, TError, TQueryFnData> | undefined
export function findQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  environment: Environment,
  filters: QueryFilters
): Query<TData, TError, TQueryFnData> | undefined
export function findQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  environment: Environment,
  arg2: QueryKey | QueryFilters
): Query<TData, TError, TQueryFnData> | undefined {
  const [filters] = parseFilterArgs(arg2)
  return environment
    .getQueryCache()
    .getAll()
    .find(query => matchQuery(filters, query)) as Query<
    TData,
    TError,
    TQueryFnData
  >
}

export function findQueries(
  environment: Environment,
  queryKey?: QueryKey
): Query[]
export function findQueries(
  environment: Environment,
  filters?: QueryFilters
): Query[]
export function findQueries(
  environment: Environment,
  arg2?: QueryKey | QueryFilters
): Query[] {
  const [filters] = parseFilterArgs(arg2)
  const queryCache = environment.getQueryCache()
  return filters
    ? queryCache.getAll().filter(query => matchQuery(filters, query))
    : queryCache.getAll()
}

export function isFetching(
  environment: Environment,
  queryKey?: QueryKey
): number
export function isFetching(
  environment: Environment,
  filters?: QueryFilters
): number
export function isFetching(
  environment: Environment,
  arg2?: QueryKey | QueryFilters
): number {
  const [filters] = parseFilterArgs(arg2)
  filters.fetching = true
  return findQueries(environment, filters).length
}

export function getQueryData<TData = unknown>(
  environment: Environment,
  queryKey: QueryKey
): TData | undefined
export function getQueryData<TData = unknown>(
  environment: Environment,
  filters: QueryFilters
): TData | undefined
export function getQueryData<TData = unknown>(
  environment: Environment,
  arg2: QueryKey | QueryFilters
): TData | undefined {
  return findQuery<TData>(environment, arg2 as QueryKey)?.state.data
}

export function setQueryData<TData>(
  environment: Environment,
  queryKey: QueryKey,
  updater: Updater<TData | undefined, TData>,
  options?: SetDataOptions
): TData {
  const parsedOptions = parseQueryArgs(queryKey)
  return environment
    .getQueryCache()
    .build(environment, parsedOptions)
    .setData(updater, options)
}

export function getQueryState<TData = unknown, TError = undefined>(
  environment: Environment,
  queryKey: QueryKey
): QueryState<TData, TError> | undefined
export function getQueryState<TData = unknown, TError = undefined>(
  environment: Environment,
  filters: QueryFilters
): QueryState<TData, TError> | undefined
export function getQueryState<TData = unknown, TError = undefined>(
  environment: Environment,
  arg2: QueryKey | QueryFilters
): QueryState<TData, TError> | undefined {
  return findQuery<TData, TError>(environment, arg2 as QueryKey)?.state
}

export function removeQueries(
  environment: Environment,
  queryKey?: QueryKey
): void
export function removeQueries(
  environment: Environment,
  filters: QueryFilters
): void
export function removeQueries(
  environment: Environment,
  arg2?: QueryKey | QueryFilters
): void {
  const [filters] = parseFilterArgs(arg2)
  const queryCache = environment.getQueryCache()
  notifyManager.batch(() => {
    findQueries(environment, filters).forEach(query => {
      queryCache.remove(query)
    })
  })
}

export function cancelQueries(
  environment: Environment,
  queryKey?: QueryKey,
  options?: CancelOptions
): Promise<void>
export function cancelQueries(
  environment: Environment,
  filters?: QueryFilters,
  options?: CancelOptions
): Promise<void>
export function cancelQueries(
  environment: Environment,
  arg2?: QueryKey | QueryFilters,
  arg3?: CancelOptions
): Promise<void> {
  const [filters, cancelOptions = {}] = parseFilterArgs(arg2, arg3)

  if (typeof cancelOptions.revert === 'undefined') {
    cancelOptions.revert = true
  }

  const promises = notifyManager.batch(() =>
    findQueries(environment, filters).map(query => query.cancel(cancelOptions))
  )

  return Promise.all(promises).then(noop).catch(noop)
}

export function invalidateQueries(
  environment: Environment,
  queryKey?: QueryKey,
  options?: InvalidateOptions
): Promise<void>
export function invalidateQueries(
  environment: Environment,
  filters?: InvalidateQueryFilters,
  options?: InvalidateOptions
): Promise<void>
export function invalidateQueries(
  environment: Environment,
  arg2?: QueryKey | InvalidateQueryFilters,
  arg3?: InvalidateOptions
): Promise<void> {
  const [filters, options] = parseFilterArgs(arg2, arg3)

  const refetchFilters: QueryFilters = {
    ...filters,
    active: filters.refetchActive ?? true,
    inactive: filters.refetchInactive ?? false,
  }

  return notifyManager.batch(() => {
    findQueries(environment, filters).forEach(query => {
      query.invalidate()
    })
    return refetchQueries(environment, refetchFilters, options)
  })
}

export function refetchQueries(
  environment: Environment,
  queryKey?: QueryKey,
  options?: RefetchOptions
): Promise<void>
export function refetchQueries(
  environment: Environment,
  filters?: QueryFilters,
  options?: RefetchOptions
): Promise<void>
export function refetchQueries(
  environment: Environment,
  arg2?: QueryKey | QueryFilters,
  arg3?: RefetchOptions
): Promise<void> {
  const [filters, options] = parseFilterArgs(arg2, arg3)

  const promises = notifyManager.batch(() =>
    findQueries(environment, filters).map(query => query.fetch())
  )

  let promise = Promise.all(promises).then(noop)

  if (!options?.throwOnError) {
    promise = promise.catch(noop)
  }

  return promise
}

export function fetchQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  environment: Environment,
  options: FetchQueryOptions<TData, TError, TQueryFnData>
): Promise<TData> {
  const defaultedOptions = environment.defaultQueryOptions(options)

  // https://github.com/tannerlinsley/react-query/issues/652
  if (typeof defaultedOptions.retry === 'undefined') {
    defaultedOptions.retry = false
  }

  const query = environment.getQueryCache().build(environment, defaultedOptions)

  return query.isStaleByTime(defaultedOptions.staleTime)
    ? query.fetch(defaultedOptions)
    : Promise.resolve(query.state.data as TData)
}

export function prefetchQuery(
  environment: Environment,
  options: FetchQueryOptions
): Promise<void> {
  return fetchQuery(environment, options).then(noop).catch(noop)
}

export function fetchInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData
>(
  environment: Environment,
  options: FetchQueryOptions<InfiniteData<TData>, TError, TQueryFnData>
): Promise<InfiniteData<TData>> {
  return fetchQuery(environment, {
    ...options,
    behavior: infiniteQueryBehavior<TData, TError, TQueryFnData>(),
  })
}

export function prefetchInfiniteQuery(
  environment: Environment,
  options: FetchQueryOptions<InfiniteData<unknown>>
): Promise<void> {
  return fetchInfiniteQuery(environment, options).then(noop).catch(noop)
}

export function watchQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
>(
  environment: Environment,
  options: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
): QueryObserver<TData, TError, TQueryFnData, TQueryData> {
  return new QueryObserver(environment, options)
}

export function watchQueries(
  environment: Environment,
  queries: QueryObserverOptions[]
): QueriesObserver {
  return new QueriesObserver(environment, queries)
}

export function watchInfiniteQuery<
  TData = unknown,
  TError = unknown,
  TQueryFnData = TData,
  TQueryData = TQueryFnData
>(
  environment: Environment,
  options: InfiniteQueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
): InfiniteQueryObserver<TData, TError, TQueryFnData, TQueryData> {
  return new InfiniteQueryObserver(environment, options)
}

export function runMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  environment: Environment,
  options: MutationOptions<TData, TError, TVariables, TContext>
): Promise<TData> {
  return environment.getMutationCache().build(environment, options).execute()
}

export function watchMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown
>(
  environment: Environment,
  options: MutationOptions<TData, TError, TVariables, TContext>
): MutationObserver<TData, TError, TVariables, TContext> {
  return new MutationObserver(environment, options)
}
