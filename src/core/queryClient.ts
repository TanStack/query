import {
  QueryFilters,
  Updater,
  noop,
  parseFilterArgs,
  parseQueryArgs,
  partialMatchKey,
} from './utils'
import type {
  DefaultOptions,
  FetchQueryOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationKey,
  MutationOptions,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
  RefetchOptions,
} from './types'
import type { QueryState, SetDataOptions } from './query'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { notifyManager } from './notifyManager'
import { CancelOptions } from './retryer'

// TYPES

interface QueryClientConfig {
  queryCache?: QueryCache
  mutationCache?: MutationCache
  defaultOptions?: DefaultOptions
}

interface QueryDefaults {
  queryKey: QueryKey
  defaultOptions: QueryOptions<any, any, any>
}

interface MutationDefaults {
  mutationKey: MutationKey
  defaultOptions: MutationOptions<any, any, any, any>
}

// CLASS

export class QueryClient {
  private queryCache: QueryCache
  private mutationCache: MutationCache
  private defaultOptions: DefaultOptions
  private queryDefaults: QueryDefaults[]
  private mutationDefaults: MutationDefaults[]
  private unsubscribeFocus?: () => void
  private unsubscribeOnline?: () => void

  constructor(config: QueryClientConfig = {}) {
    this.queryCache = config.queryCache || new QueryCache()
    this.mutationCache = config.mutationCache || new MutationCache()
    this.defaultOptions = config.defaultOptions || {}
    this.queryDefaults = []
    this.mutationDefaults = []
  }

  mount(): void {
    this.unsubscribeFocus = focusManager.subscribe(() => {
      if (focusManager.isFocused() && onlineManager.isOnline()) {
        this.mutationCache.onFocus()
        this.queryCache.onFocus()
      }
    })
    this.unsubscribeOnline = onlineManager.subscribe(() => {
      if (focusManager.isFocused() && onlineManager.isOnline()) {
        this.mutationCache.onOnline()
        this.queryCache.onOnline()
      }
    })
  }

  unmount(): void {
    this.unsubscribeFocus?.()
    this.unsubscribeOnline?.()
  }

  isFetching(filters?: QueryFilters): number
  isFetching(queryKey?: QueryKey, filters?: QueryFilters): number
  isFetching(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): number {
    const [filters] = parseFilterArgs(arg1, arg2)
    filters.fetching = true
    return this.queryCache.findAll(filters).length
  }

  getQueryData<TData = unknown>(
    queryKey: QueryKey,
    filters?: QueryFilters
  ): TData | undefined {
    return this.queryCache.find<TData>(queryKey, filters)?.state.data
  }

  setQueryData<TData>(
    queryKey: QueryKey,
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): TData {
    const parsedOptions = parseQueryArgs(queryKey)
    return this.queryCache.build(this, parsedOptions).setData(updater, options)
  }

  getQueryState<TData = unknown, TError = undefined>(
    queryKey: QueryKey,
    filters?: QueryFilters
  ): QueryState<TData, TError> | undefined {
    return this.queryCache.find<TData, TError>(queryKey, filters)?.state
  }

  removeQueries(filters?: QueryFilters): void
  removeQueries(queryKey?: QueryKey, filters?: QueryFilters): void
  removeQueries(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): void {
    const [filters] = parseFilterArgs(arg1, arg2)
    const queryCache = this.queryCache
    notifyManager.batch(() => {
      queryCache.findAll(filters).forEach(query => {
        queryCache.remove(query)
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
    const [filters, cancelOptions = {}] = parseFilterArgs(arg1, arg2, arg3)

    if (typeof cancelOptions.revert === 'undefined') {
      cancelOptions.revert = true
    }

    const promises = notifyManager.batch(() =>
      this.queryCache.findAll(filters).map(query => query.cancel(cancelOptions))
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
      this.queryCache.findAll(filters).forEach(query => {
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
      this.queryCache
        .findAll(filters)
        .map(query => query.fetch(undefined, { origin: 'clientRefetch' }))
    )

    let promise = Promise.all(promises).then(noop)

    if (!options?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  fetchQuery<TData = unknown, TError = unknown, TQueryFnData = TData>(
    options: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQuery<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    options?: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQuery<TData = unknown, TError = unknown, TQueryFnData = TData>(
    queryKey: QueryKey,
    queryFn: QueryFunction<TQueryFnData | TData>,
    options?: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData>
  fetchQuery<TData, TError, TQueryFnData = TData>(
    arg1: QueryKey | FetchQueryOptions<TData, TError, TQueryFnData>,
    arg2?:
      | QueryFunction<TQueryFnData | TData>
      | FetchQueryOptions<TData, TError, TQueryFnData>,
    arg3?: FetchQueryOptions<TData, TError, TQueryFnData>
  ): Promise<TData> {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)

    // https://github.com/tannerlinsley/react-query/issues/652
    if (typeof defaultedOptions.retry === 'undefined') {
      defaultedOptions.retry = false
    }

    const query = this.queryCache.build(this, defaultedOptions)

    return query.isStaleByTime(defaultedOptions.staleTime)
      ? query.fetch(defaultedOptions, { origin: 'clientFetch' })
      : Promise.resolve(query.state.data as TData)
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
    return this.fetchQuery(arg1 as any, arg2 as any, arg3)
      .then(noop)
      .catch(noop)
  }

  cancelMutations(): Promise<void> {
    const promises = notifyManager.batch(() =>
      this.mutationCache.getAll().map(mutation => mutation.cancel())
    )
    return Promise.all(promises).then(noop).catch(noop)
  }

  resumePausedMutations(): Promise<void> {
    return this.getMutationCache().resumePausedMutations()
  }

  executeMutation<
    TData = unknown,
    TError = unknown,
    TVariables = void,
    TContext = unknown
  >(
    options: MutationOptions<TData, TError, TVariables, TContext>
  ): Promise<TData> {
    return this.mutationCache.build(this, options).execute()
  }

  getQueryCache(): QueryCache {
    return this.queryCache
  }

  getMutationCache(): MutationCache {
    return this.mutationCache
  }

  getDefaultOptions(): DefaultOptions {
    return this.defaultOptions
  }

  setDefaultOptions(options: DefaultOptions): void {
    this.defaultOptions = options
  }

  setQueryDefaults(
    queryKey: QueryKey,
    options: QueryOptions<any, any, any>
  ): void {
    const result = this.queryDefaults.find(x =>
      partialMatchKey(x.queryKey, queryKey)
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.queryDefaults.push({ queryKey, defaultOptions: options })
    }
  }

  getQueryDefaults(
    queryKey: QueryKey
  ): QueryOptions<any, any, any> | undefined {
    return this.queryDefaults.find(x => partialMatchKey(x.queryKey, queryKey))
      ?.defaultOptions
  }

  setMutationDefaults(
    mutationKey: MutationKey,
    options: MutationOptions<any, any, any, any>
  ): void {
    const result = this.mutationDefaults.find(x =>
      partialMatchKey(x.mutationKey, mutationKey)
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.mutationDefaults.push({ mutationKey, defaultOptions: options })
    }
  }

  getMutationDefaults(
    mutationKey: MutationKey
  ): MutationOptions<any, any, any, any> | undefined {
    return this.mutationDefaults.find(x =>
      partialMatchKey(x.mutationKey, mutationKey)
    )?.defaultOptions
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

  clear(): void {
    this.queryCache.clear()
    this.mutationCache.clear()
  }
}
