import {
  CancelOptions,
  QueryFilters,
  Updater,
  isDocumentVisible,
  isOnline,
  noop,
  parseFilterArgs,
  parseQueryArgs,
  uniq,
} from './utils'
import type {
  DefaultOptions,
  FetchQueryOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationOptions,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
  RefetchOptions,
} from './types'
import type { QueryState, SetDataOptions } from './query'
import type { QueryCache } from './queryCache'
import { QueriesObserver } from './queriesObserver'
import { QueryObserver } from './queryObserver'
import { initFocusHandler } from './focusHandler'
import { initOnlineHandler } from './onlineHandler'
import { notifyManager } from './notifyManager'

// TYPES

interface QueryClientConfig {
  cache: QueryCache
  defaultOptions?: DefaultOptions
}

// CLASS

export class QueryClient {
  private cache: QueryCache
  private defaultOptions: DefaultOptions

  constructor(config: QueryClientConfig) {
    this.cache = config.cache
    this.defaultOptions = config.defaultOptions || {}
  }

  getDefaultOptions(): DefaultOptions {
    return this.defaultOptions
  }

  setDefaultOptions(options: DefaultOptions): void {
    this.defaultOptions = options
  }

  mount(): void {
    mountedClients.push(this)
    initFocusHandler(onFocus)
    initOnlineHandler(onOnline)
  }

  unmount(): void {
    const index = mountedClients.indexOf(this)
    if (index > -1) {
      mountedClients.splice(index, 1)
    }
  }

  isFetching(filters?: QueryFilters): number
  isFetching(queryKey?: QueryKey, filters?: QueryFilters): number
  isFetching(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): number {
    const [filters] = parseFilterArgs(arg1, arg2)
    filters.fetching = true
    return this.cache.findAll(filters).length
  }

  setQueryDefaults<TData = unknown, TError = unknown, TQueryFnData = TData>(
    options: QueryOptions<TData, TError, TQueryFnData>
  ): void
  setQueryDefaults<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    options?: QueryOptions<TData, TError, TQueryFnData>
  ): void
  setQueryDefaults<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TQueryFnData | TData>,
    options?: QueryOptions<TData, TError, TQueryFnData>
  ): void
  setQueryDefaults<TData, TError, TQueryFnData = TData>(
    arg1: QueryKey | QueryOptions<TData, TError, TQueryFnData>,
    arg2?:
      | QueryFunction<TQueryFnData | TData>
      | QueryOptions<TData, TError, TQueryFnData>,
    arg3?: QueryOptions<TData, TError, TQueryFnData>
  ): void {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)
    this.cache.build(defaultedOptions).setDefaultOptions(defaultedOptions)
  }

  getQueryData<TData = unknown>(
    queryKey: QueryKey,
    filters?: QueryFilters
  ): TData | undefined {
    return this.cache.find<TData>(queryKey, filters)?.state.data
  }

  setQueryData<TData>(
    queryKey: QueryKey,
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): TData {
    const parsedOptions = parseQueryArgs(queryKey)
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)
    return this.cache.build(defaultedOptions).setData(updater, options)
  }

  getQueryState<TData = unknown, TError = undefined>(
    queryKey: QueryKey,
    filters?: QueryFilters
  ): QueryState<TData, TError> | undefined {
    return this.cache.find<TData, TError>(queryKey, filters)?.state
  }

  removeQueries(filters?: QueryFilters): void
  removeQueries(queryKey?: QueryKey, filters?: QueryFilters): void
  removeQueries(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): void {
    notifyManager.batch(() => {
      this.cache.findAll(arg1, arg2).forEach(query => {
        this.cache.remove(query)
      })
    })
  }

  cancelQueries(filters?: QueryFilters, options?: CancelOptions): Promise<void>
  cancelQueries(
    queryKey?: QueryKey,
    filters?: QueryFilters,
    options?: CancelOptions
  ): Promise<void>
  cancelQueries(
    arg1?: QueryKey | QueryFilters,
    arg2?: QueryFilters | CancelOptions,
    arg3?: CancelOptions
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)
    const cancelOptions = options || {}

    if (typeof cancelOptions.revert === 'undefined') {
      cancelOptions.revert = true
    }

    const promises = notifyManager.batch(() =>
      this.cache.findAll(filters).map(query => query.cancel(cancelOptions))
    )

    return Promise.all(promises).then(noop).catch(noop)
  }

  invalidateQueries(
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions
  ): Promise<void>
  invalidateQueries(
    queryKey?: QueryKey,
    filters?: InvalidateQueryFilters,
    options?: InvalidateOptions
  ): Promise<void>
  invalidateQueries(
    arg1?: QueryKey | InvalidateQueryFilters,
    arg2?: InvalidateQueryFilters | InvalidateOptions,
    arg3?: InvalidateOptions
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)

    const refetchFilters: QueryFilters = {
      ...filters,
      active: filters.refetchActive ?? true,
      inactive: filters.refetchInactive ?? false,
    }

    return notifyManager.batch(() => {
      this.cache.findAll(filters).forEach(query => {
        query.invalidate()
      })
      return this.refetchQueries(refetchFilters, options)
    })
  }

  refetchQueries(
    filters?: QueryFilters,
    options?: RefetchOptions
  ): Promise<void>
  refetchQueries(
    queryKey?: QueryKey,
    filters?: QueryFilters,
    options?: RefetchOptions
  ): Promise<void>
  refetchQueries(
    arg1?: QueryKey | QueryFilters,
    arg2?: QueryFilters | RefetchOptions,
    arg3?: RefetchOptions
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)

    const promises = notifyManager.batch(() =>
      this.cache.findAll(filters).map(query => query.fetch())
    )

    let promise = Promise.all(promises).then(noop)

    if (!options?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  watchQuery<
    TData = unknown,
    TError = unknown,
    TQueryFnData = TData,
    TQueryData = TQueryFnData
  >(
    options: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): QueryObserver<TData, TError, TQueryFnData, TQueryData>
  watchQuery<
    TData = unknown,
    TError = unknown,
    TQueryFnData = TData,
    TQueryData = TQueryFnData
  >(
    queryKey: QueryKey,
    options?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): QueryObserver<TData, TError, TQueryFnData, TQueryData>
  watchQuery<
    TData = unknown,
    TError = unknown,
    TQueryFnData = TData,
    TQueryData = TQueryFnData
  >(
    queryKey: QueryKey,
    queryFn: QueryFunction<TQueryFnData | TData>,
    options?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): QueryObserver<TData, TError, TQueryFnData, TQueryData>
  watchQuery<TData, TError, TQueryFnData = TData, TQueryData = TQueryFnData>(
    arg1:
      | QueryKey
      | QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>,
    arg2?:
      | QueryFunction<TQueryFnData | TData>
      | QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>,
    arg3?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): QueryObserver<TData, TError, TQueryFnData, TQueryData> {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
    return new QueryObserver({ client: this, options: parsedOptions })
  }

  watchQueries(queries: QueryObserverOptions[]): QueriesObserver {
    return new QueriesObserver({ client: this, queries })
  }

  fetchQueryData<TData = unknown, TError = unknown, TQueryFnData = TData>(
    options: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQueryData<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    options?: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQueryData<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TQueryFnData | TData>,
    options?: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQueryData<TData, TError, TQueryFnData = TData>(
    arg1: QueryKey | FetchQueryOptions<TData, TError, TQueryFnData>,
    arg2?:
      | QueryFunction<TQueryFnData | TData>
      | FetchQueryOptions<TData, TError, TQueryFnData>,
    arg3?: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData> {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)

    // https://github.com/tannerlinsley/react-query/issues/652
    if (typeof parsedOptions.retry === 'undefined') {
      parsedOptions.retry = false
    }

    const defaultedOptions = this.defaultQueryOptions(parsedOptions)

    let query = this.cache.find<TData, TError, TQueryFnData>(
      defaultedOptions.queryKey!
    )

    if (!query) {
      query = this.cache.build(defaultedOptions)
    } else if (!query.isStaleByTime(defaultedOptions.staleTime)) {
      return Promise.resolve(query.state.data as TData)
    }

    return query.fetch(defaultedOptions)
  }

  prefetchQuery(options: FetchQueryOptions): Promise<void>
  prefetchQuery(queryKey: QueryKey, options?: FetchQueryOptions): Promise<void>
  prefetchQuery(
    queryKey: QueryKey,
    queryFn: QueryFunction,
    options?: FetchQueryOptions
  ): Promise<void>
  prefetchQuery(
    arg1: QueryKey | FetchQueryOptions,
    arg2?: QueryFunction | FetchQueryOptions,
    arg3?: FetchQueryOptions
  ): Promise<void> {
    return this.fetchQueryData(arg1 as any, arg2 as any, arg3)
      .then(noop)
      .catch(noop)
  }

  getCache(): QueryCache {
    return this.cache
  }

  defaultQueryOptions<T extends QueryOptions<any, any>>(options?: T): T {
    return { ...this.defaultOptions.queries, ...options } as T
  }

  defaultQueryObserverOptions<T extends QueryObserverOptions<any, any>>(
    options?: T
  ): T {
    return { ...this.defaultOptions.queries, ...options } as T
  }

  defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(
    options?: T
  ): T {
    return { ...this.defaultOptions.mutations, ...options } as T
  }
}

const mountedClients: QueryClient[] = []

function onFocus() {
  onExternalEvent('focus')
}

function onOnline() {
  onExternalEvent('online')
}

function onExternalEvent(type: 'focus' | 'online') {
  if (isDocumentVisible() && isOnline()) {
    notifyManager.batch(() => {
      uniq(mountedClients.map(x => x.getCache())).forEach(cache => {
        cache.getAll().forEach(query => {
          if (type === 'focus') {
            query.onFocus()
          } else {
            query.onOnline()
          }
        })
      })
    })
  }
}
