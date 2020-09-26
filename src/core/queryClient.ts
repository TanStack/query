import {
  QueryFilters,
  Updater,
  isDocumentVisible,
  isOnline,
  noop,
  parseFilterArgs,
  parseQueryArgs,
  uniq,
} from './utils'
import { DEFAULT_OPTIONS, mergeDefaultOptions } from './config'
import type {
  DefaultOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationOptions,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
  RefetchOptions,
} from './types'
import { notifyManager } from './notifyManager'
import { QueryCache } from './queryCache'
import { QueryObserver } from './queryObserver'
import { QueriesObserver } from './queriesObserver'

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
    this.defaultOptions = mergeDefaultOptions(
      DEFAULT_OPTIONS,
      config.defaultOptions
    )
  }

  mount(): void {
    mountedClients.push(this)
  }

  unmount(): void {
    const index = mountedClients.indexOf(this)
    if (index > -1) {
      mountedClients.splice(index, 1)
    }
  }

  isFetching(): number {
    return this.cache
      .getAll()
      .reduce((acc, q) => (q.state.isFetching ? acc + 1 : acc), 0)
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

  getQueryData<TData>(
    queryKey: QueryKey,
    filters?: QueryFilters
  ): TData | undefined {
    return this.cache.find<TData>(queryKey, filters)?.state.data
  }

  setQueryData<TData>(
    queryKey: QueryKey,
    updater: Updater<TData | undefined, TData>
  ): TData {
    const parsedOptions = parseQueryArgs(queryKey)
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)
    return this.cache.build(defaultedOptions).setData(updater)
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

  cancelQueries(filters?: QueryFilters): Promise<void>
  cancelQueries(queryKey?: QueryKey, filters?: QueryFilters): Promise<void>
  cancelQueries(
    arg1?: QueryKey | QueryFilters,
    arg2?: QueryFilters
  ): Promise<void> {
    const promises = notifyManager.batch(() =>
      this.cache.findAll(arg1, arg2).map(query => query.cancel())
    )
    return Promise.all(promises).then(noop)
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
      active: filters.refetchActive ?? true,
      inactive: filters.refetchInactive,
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
    options: QueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQueryData<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    options?: QueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQueryData<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TQueryFnData | TData>,
    options?: QueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQueryData<TData, TError, TQueryFnData = TData>(
    arg1: QueryKey | QueryOptions<TData, TError, TQueryFnData>,
    arg2?:
      | QueryFunction<TQueryFnData | TData>
      | QueryOptions<TData, TError, TQueryFnData>,
    arg3?: QueryOptions<TData, TError, TQueryFnData>
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

  prefetchQuery(options: QueryOptions): Promise<void>
  prefetchQuery(queryKey: QueryKey, options?: QueryOptions): Promise<void>
  prefetchQuery(
    queryKey: QueryKey,
    queryFn: QueryFunction,
    options?: QueryOptions
  ): Promise<void>
  prefetchQuery(
    arg1: QueryKey | QueryOptions,
    arg2?: QueryFunction | QueryOptions,
    arg3?: QueryOptions
  ): Promise<void> {
    return this.fetchQueryData(arg1 as any, arg2 as any, arg3)
      .then(noop)
      .catch(noop)
  }

  getCache(): QueryCache {
    return this.cache
  }

  defaultQueryOptions<TData, TError, TQueryFnData>(
    options?: QueryOptions<TData, TError, TQueryFnData>
  ): QueryOptions<TData, TError, TQueryFnData> {
    return {
      ...this.defaultOptions.queries,
      ...options,
    } as QueryOptions<TData, TError, TQueryFnData>
  }

  defaultQueryObserverOptions<TData, TError, TQueryFnData, TQueryData>(
    options?: QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  ): QueryObserverOptions<TData, TError, TQueryFnData, TQueryData> {
    return {
      ...this.defaultOptions.queries,
      ...options,
    } as QueryObserverOptions<TData, TError, TQueryFnData, TQueryData>
  }

  defaultMutationOptions<TData, TError, TVariables, TSnapshot>(
    options?: MutationOptions<TData, TError, TVariables, TSnapshot>
  ): MutationOptions<TData, TError, TVariables, TSnapshot> {
    return {
      ...this.defaultOptions.queries,
      ...options,
    } as MutationOptions<TData, TError, TVariables, TSnapshot>
  }
}

const mountedClients: QueryClient[] = []

export function onExternalEvent(type: 'focus' | 'online') {
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
