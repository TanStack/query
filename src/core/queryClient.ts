import {
  QueryFilters,
  Updater,
  hashQueryKey,
  noop,
  parseFilterArgs,
  parseQueryArgs,
  partialMatchKey,
  hashQueryKeyByOptions,
  MutationFilters,
} from './utils'
import type {
  DefaultOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationKey,
  MutationObserverOptions,
  MutationOptions,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
  RefetchOptions,
  ResetOptions,
} from './types'
import type { QueryState, SetDataOptions } from './query'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { notifyManager } from './notifyManager'
import { CancelOptions } from './retryer'
import { infiniteQueryBehavior } from './infiniteQueryBehavior'

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

  isMutating(filters?: MutationFilters): number {
    return this.mutationCache.findAll({ ...filters, fetching: true }).length
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
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)
    return this.queryCache
      .build(this, defaultedOptions)
      .setData(updater, options)
  }

  setQueriesData<TData>(
    queryKey: QueryKey,
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): [QueryKey, TData][]

  setQueriesData<TData>(
    filters: QueryFilters,
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): [QueryKey, TData][]

  setQueriesData<TData>(
    queryKeyOrFilters: QueryKey | QueryFilters,
    updater: Updater<TData | undefined, TData>,
    options?: SetDataOptions
  ): [QueryKey, TData][] {
    return notifyManager.batch(() =>
      this.getQueryCache()
        .findAll(queryKeyOrFilters)
        .map(({ queryKey }) => [
          queryKey,
          this.setQueryData<TData>(queryKey, updater, options),
        ])
    )
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

  resetQueries(filters?: QueryFilters, options?: ResetOptions): Promise<void>
  resetQueries(
    queryKey?: QueryKey,
    filters?: QueryFilters,
    options?: ResetOptions
  ): Promise<void>
  resetQueries(
    arg1?: QueryKey | QueryFilters,
    arg2?: QueryFilters | ResetOptions,
    arg3?: ResetOptions
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)
    const queryCache = this.queryCache

    const refetchFilters: QueryFilters = {
      ...filters,
      active: true,
    }

    return notifyManager.batch(() => {
      queryCache.findAll(filters).forEach(query => {
        query.reset()
      })
      return this.refetchQueries(refetchFilters, options)
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
      // if filters.refetchActive is not provided and filters.active is explicitly false,
      // e.g. invalidateQueries({ active: false }), we don't want to refetch active queries
      active: filters.refetchActive ?? filters.active ?? true,
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
      this.queryCache.findAll(filters).map(query => query.fetch())
    )

    let promise = Promise.all(promises).then(noop)

    if (!options?.throwOnError) {
      promise = promise.catch(noop)
    }

    return promise
  }

  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<TData>
  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<TData>
  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<TData>
  fetchQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    arg1: TQueryKey | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<TData> {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)

    // https://github.com/tannerlinsley/react-query/issues/652
    if (typeof defaultedOptions.retry === 'undefined') {
      defaultedOptions.retry = false
    }

    const query = this.queryCache.build(this, defaultedOptions)

    return query.isStaleByTime(defaultedOptions.staleTime)
      ? query.fetch(defaultedOptions)
      : Promise.resolve(query.state.data as TData)
  }

  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    arg1: TQueryKey | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void> {
    return this.fetchQuery(arg1 as any, arg2 as any, arg3)
      .then(noop)
      .catch(noop)
  }

  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    arg1:
      | TQueryKey
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<InfiniteData<TData>> {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
    parsedOptions.behavior = infiniteQueryBehavior<
      TQueryFnData,
      TError,
      TData
    >()
    return this.fetchQuery(parsedOptions)
  }

  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    arg1:
      | TQueryKey
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  ): Promise<void> {
    return this.fetchInfiniteQuery(arg1 as any, arg2 as any, arg3)
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
    options: QueryObserverOptions<any, any, any, any>
  ): void {
    const result = this.queryDefaults.find(
      x => hashQueryKey(queryKey) === hashQueryKey(x.queryKey)
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.queryDefaults.push({ queryKey, defaultOptions: options })
    }
  }

  getQueryDefaults(
    queryKey?: QueryKey
  ): QueryObserverOptions<any, any, any, any, any> | undefined {
    return queryKey
      ? this.queryDefaults.find(x => partialMatchKey(queryKey, x.queryKey))
          ?.defaultOptions
      : undefined
  }

  setMutationDefaults(
    mutationKey: MutationKey,
    options: MutationObserverOptions<any, any, any, any>
  ): void {
    const result = this.mutationDefaults.find(
      x => hashQueryKey(mutationKey) === hashQueryKey(x.mutationKey)
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.mutationDefaults.push({ mutationKey, defaultOptions: options })
    }
  }

  getMutationDefaults(
    mutationKey?: MutationKey
  ): MutationObserverOptions<any, any, any, any> | undefined {
    return mutationKey
      ? this.mutationDefaults.find(x =>
          partialMatchKey(mutationKey, x.mutationKey)
        )?.defaultOptions
      : undefined
  }

  defaultQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey extends QueryKey
  >(
    options?: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  ): QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
    if (options?._defaulted) {
      return options
    }

    const defaultedOptions = {
      ...this.defaultOptions.queries,
      ...this.getQueryDefaults(options?.queryKey),
      ...options,
      _defaulted: true,
    } as QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >

    if (!defaultedOptions.queryHash && defaultedOptions.queryKey) {
      defaultedOptions.queryHash = hashQueryKeyByOptions(
        defaultedOptions.queryKey,
        defaultedOptions
      )
    }

    return defaultedOptions
  }

  defaultQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey extends QueryKey
  >(
    options?: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  ): QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey> {
    return this.defaultQueryOptions(options)
  }

  defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(
    options?: T
  ): T {
    if (options?._defaulted) {
      return options
    }
    return {
      ...this.defaultOptions.mutations,
      ...this.getMutationDefaults(options?.mutationKey),
      ...options,
      _defaulted: true,
    } as T
  }

  clear(): void {
    this.queryCache.clear()
    this.mutationCache.clear()
  }
}
