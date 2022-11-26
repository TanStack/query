import type { QueryFilters, Updater, MutationFilters } from './utils'
import {
  hashQueryKey,
  noop,
  parseFilterArgs,
  parseQueryArgs,
  partialMatchKey,
  hashQueryKeyByOptions,
  functionalUpdate,
} from './utils'
import type {
  QueryClientConfig,
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
  RefetchQueryFilters,
  ResetOptions,
  ResetQueryFilters,
  SetDataOptions,
  WithRequired,
} from './types'
import type { QueryState } from './query'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { notifyManager } from './notifyManager'
import { infiniteQueryBehavior } from './infiniteQueryBehavior'
import type { CancelOptions, DefaultedQueryObserverOptions } from './types'
import type { Logger } from './logger'
import { defaultLogger } from './logger'

// TYPES

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
  private logger: Logger
  private defaultOptions: DefaultOptions
  private queryDefaults: QueryDefaults[]
  private mutationDefaults: MutationDefaults[]
  private unsubscribeFocus?: () => void
  private unsubscribeOnline?: () => void

  constructor(config: QueryClientConfig = {}) {
    this.queryCache = config.queryCache || new QueryCache()
    this.mutationCache = config.mutationCache || new MutationCache()
    this.logger = config.logger || defaultLogger
    this.defaultOptions = config.defaultOptions || {}
    this.queryDefaults = []
    this.mutationDefaults = []

    if (process.env.NODE_ENV !== 'production' && config.logger) {
      this.logger.error(
        `Passing a custom logger has been deprecated and will be removed in the next major version.`,
      )
    }
  }

  mount(): void {
    this.unsubscribeFocus = focusManager.subscribe(() => {
      if (focusManager.isFocused()) {
        this.resumePausedMutations()
        this.queryCache.onFocus()
      }
    })
    this.unsubscribeOnline = onlineManager.subscribe(() => {
      if (onlineManager.isOnline()) {
        this.resumePausedMutations()
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
    filters.fetchStatus = 'fetching'
    return this.queryCache.findAll(filters).length
  }

  isMutating(filters?: MutationFilters): number {
    return this.mutationCache.findAll({ ...filters, fetching: true }).length
  }

  getQueryData<TQueryFnData = unknown>(
    queryKey: QueryKey,
    filters?: QueryFilters,
  ): TQueryFnData | undefined {
    return this.queryCache.find<TQueryFnData>(queryKey, filters)?.state.data
  }

  ensureQueryData<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: WithRequired<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey'
    >,
  ): Promise<TData>
  ensureQueryData<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    options?: Omit<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey'
    >,
  ): Promise<TData>
  ensureQueryData<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: Omit<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey' | 'queryFn'
    >,
  ): Promise<TData>
  ensureQueryData<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1:
      | TQueryKey
      | WithRequired<
          FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
          'queryKey'
        >,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData> {
    const parsedOptions = parseQueryArgs(arg1, arg2, arg3)
    const cachedData = this.getQueryData<TData>(parsedOptions.queryKey!)

    return cachedData
      ? Promise.resolve(cachedData)
      : this.fetchQuery(parsedOptions)
  }

  getQueriesData<TQueryFnData = unknown>(
    queryKey: QueryKey,
  ): [QueryKey, TQueryFnData | undefined][]
  getQueriesData<TQueryFnData = unknown>(
    filters: QueryFilters,
  ): [QueryKey, TQueryFnData | undefined][]
  getQueriesData<TQueryFnData = unknown>(
    queryKeyOrFilters: QueryKey | QueryFilters,
  ): [QueryKey, TQueryFnData | undefined][] {
    return this.getQueryCache()
      .findAll(queryKeyOrFilters)
      .map(({ queryKey, state }) => {
        const data = state.data as TQueryFnData | undefined
        return [queryKey, data]
      })
  }

  setQueryData<TQueryFnData>(
    queryKey: QueryKey,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): TQueryFnData | undefined {
    const query = this.queryCache.find<TQueryFnData>(queryKey)
    const prevData = query?.state.data
    const data = functionalUpdate(updater, prevData)

    if (typeof data === 'undefined') {
      return undefined
    }

    const parsedOptions = parseQueryArgs(queryKey)
    const defaultedOptions = this.defaultQueryOptions(parsedOptions)
    return this.queryCache
      .build(this, defaultedOptions)
      .setData(data, { ...options, manual: true })
  }

  setQueriesData<TQueryFnData>(
    queryKey: QueryKey,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, TQueryFnData | undefined][]

  setQueriesData<TQueryFnData>(
    filters: QueryFilters,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, TQueryFnData | undefined][]

  setQueriesData<TQueryFnData>(
    queryKeyOrFilters: QueryKey | QueryFilters,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, TQueryFnData | undefined][] {
    return notifyManager.batch(() =>
      this.getQueryCache()
        .findAll(queryKeyOrFilters)
        .map(({ queryKey }) => [
          queryKey,
          this.setQueryData<TQueryFnData>(queryKey, updater, options),
        ]),
    )
  }

  getQueryState<TQueryFnData = unknown, TError = undefined>(
    queryKey: QueryKey,
    filters?: QueryFilters,
  ): QueryState<TQueryFnData, TError> | undefined {
    return this.queryCache.find<TQueryFnData, TError>(queryKey, filters)?.state
  }

  removeQueries(filters?: QueryFilters): void
  removeQueries(queryKey?: QueryKey, filters?: QueryFilters): void
  removeQueries(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): void {
    const [filters] = parseFilterArgs(arg1, arg2)
    const queryCache = this.queryCache
    notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        queryCache.remove(query)
      })
    })
  }

  resetQueries<TPageData = unknown>(
    filters?: ResetQueryFilters<TPageData>,
    options?: ResetOptions,
  ): Promise<void>
  resetQueries<TPageData = unknown>(
    queryKey?: QueryKey,
    filters?: ResetQueryFilters<TPageData>,
    options?: ResetOptions,
  ): Promise<void>
  resetQueries(
    arg1?: QueryKey | ResetQueryFilters,
    arg2?: ResetQueryFilters | ResetOptions,
    arg3?: ResetOptions,
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)
    const queryCache = this.queryCache

    const refetchFilters: RefetchQueryFilters = {
      type: 'active',
      ...filters,
    }

    return notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        query.reset()
      })
      return this.refetchQueries(refetchFilters, options)
    })
  }

  cancelQueries(filters?: QueryFilters, options?: CancelOptions): Promise<void>
  cancelQueries(
    queryKey?: QueryKey,
    filters?: QueryFilters,
    options?: CancelOptions,
  ): Promise<void>
  cancelQueries(
    arg1?: QueryKey | QueryFilters,
    arg2?: QueryFilters | CancelOptions,
    arg3?: CancelOptions,
  ): Promise<void> {
    const [filters, cancelOptions = {}] = parseFilterArgs(arg1, arg2, arg3)

    if (typeof cancelOptions.revert === 'undefined') {
      cancelOptions.revert = true
    }

    const promises = notifyManager.batch(() =>
      this.queryCache
        .findAll(filters)
        .map((query) => query.cancel(cancelOptions)),
    )

    return Promise.all(promises).then(noop).catch(noop)
  }

  invalidateQueries<TPageData = unknown>(
    filters?: InvalidateQueryFilters<TPageData>,
    options?: InvalidateOptions,
  ): Promise<void>
  invalidateQueries<TPageData = unknown>(
    queryKey?: QueryKey,
    filters?: InvalidateQueryFilters<TPageData>,
    options?: InvalidateOptions,
  ): Promise<void>
  invalidateQueries(
    arg1?: QueryKey | InvalidateQueryFilters,
    arg2?: InvalidateQueryFilters | InvalidateOptions,
    arg3?: InvalidateOptions,
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)

    return notifyManager.batch(() => {
      this.queryCache.findAll(filters).forEach((query) => {
        query.invalidate()
      })

      if (filters.refetchType === 'none') {
        return Promise.resolve()
      }
      const refetchFilters: RefetchQueryFilters = {
        ...filters,
        type: filters.refetchType ?? filters.type ?? 'active',
      }
      return this.refetchQueries(refetchFilters, options)
    })
  }

  refetchQueries<TPageData = unknown>(
    filters?: RefetchQueryFilters<TPageData>,
    options?: RefetchOptions,
  ): Promise<void>
  refetchQueries<TPageData = unknown>(
    queryKey?: QueryKey,
    filters?: RefetchQueryFilters<TPageData>,
    options?: RefetchOptions,
  ): Promise<void>
  refetchQueries(
    arg1?: QueryKey | RefetchQueryFilters,
    arg2?: RefetchQueryFilters | RefetchOptions,
    arg3?: RefetchOptions,
  ): Promise<void> {
    const [filters, options] = parseFilterArgs(arg1, arg2, arg3)

    const promises = notifyManager.batch(() =>
      this.queryCache
        .findAll(filters)
        .filter((query) => !query.isDisabled())
        .map((query) =>
          query.fetch(undefined, {
            ...options,
            cancelRefetch: options?.cancelRefetch ?? true,
            meta: { refetchPage: filters.refetchPage },
          }),
        ),
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
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1: TQueryKey | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
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
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1: TQueryKey | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void> {
    return this.fetchQuery(arg1 as any, arg2 as any, arg3)
      .then(noop)
      .catch(noop)
  }

  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1:
      | TQueryKey
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
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
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TQueryKey,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1:
      | TQueryKey
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    arg3?: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void> {
    return this.fetchInfiniteQuery(arg1 as any, arg2 as any, arg3)
      .then(noop)
      .catch(noop)
  }

  resumePausedMutations(): Promise<void> {
    return this.mutationCache.resumePausedMutations()
  }

  getQueryCache(): QueryCache {
    return this.queryCache
  }

  getMutationCache(): MutationCache {
    return this.mutationCache
  }

  getLogger(): Logger {
    return this.logger
  }

  getDefaultOptions(): DefaultOptions {
    return this.defaultOptions
  }

  setDefaultOptions(options: DefaultOptions): void {
    this.defaultOptions = options
  }

  setQueryDefaults(
    queryKey: QueryKey,
    options: QueryObserverOptions<unknown, any, any, any>,
  ): void {
    const result = this.queryDefaults.find(
      (x) => hashQueryKey(queryKey) === hashQueryKey(x.queryKey),
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.queryDefaults.push({ queryKey, defaultOptions: options })
    }
  }

  getQueryDefaults(
    queryKey?: QueryKey,
  ): QueryObserverOptions<any, any, any, any, any> | undefined {
    if (!queryKey) {
      return undefined
    }

    // Get the first matching defaults
    const firstMatchingDefaults = this.queryDefaults.find((x) =>
      partialMatchKey(queryKey, x.queryKey),
    )

    // Additional checks and error in dev mode
    if (process.env.NODE_ENV !== 'production') {
      // Retrieve all matching defaults for the given key
      const matchingDefaults = this.queryDefaults.filter((x) =>
        partialMatchKey(queryKey, x.queryKey),
      )
      // It is ok not having defaults, but it is error prone to have more than 1 default for a given key
      if (matchingDefaults.length > 1) {
        this.logger.error(
          `[QueryClient] Several query defaults match with key '${JSON.stringify(
            queryKey,
          )}'. The first matching query defaults are used. Please check how query defaults are registered. Order does matter here. cf. https://react-query.tanstack.com/reference/QueryClient#queryclientsetquerydefaults.`,
        )
      }
    }

    return firstMatchingDefaults?.defaultOptions
  }

  setMutationDefaults(
    mutationKey: MutationKey,
    options: MutationObserverOptions<any, any, any, any>,
  ): void {
    const result = this.mutationDefaults.find(
      (x) => hashQueryKey(mutationKey) === hashQueryKey(x.mutationKey),
    )
    if (result) {
      result.defaultOptions = options
    } else {
      this.mutationDefaults.push({ mutationKey, defaultOptions: options })
    }
  }

  getMutationDefaults(
    mutationKey?: MutationKey,
  ): MutationObserverOptions<any, any, any, any> | undefined {
    if (!mutationKey) {
      return undefined
    }

    // Get the first matching defaults
    const firstMatchingDefaults = this.mutationDefaults.find((x) =>
      partialMatchKey(mutationKey, x.mutationKey),
    )

    // Additional checks and error in dev mode
    if (process.env.NODE_ENV !== 'production') {
      // Retrieve all matching defaults for the given key
      const matchingDefaults = this.mutationDefaults.filter((x) =>
        partialMatchKey(mutationKey, x.mutationKey),
      )
      // It is ok not having defaults, but it is error prone to have more than 1 default for a given key
      if (matchingDefaults.length > 1) {
        this.logger.error(
          `[QueryClient] Several mutation defaults match with key '${JSON.stringify(
            mutationKey,
          )}'. The first matching mutation defaults are used. Please check how mutation defaults are registered. Order does matter here. cf. https://react-query.tanstack.com/reference/QueryClient#queryclientsetmutationdefaults.`,
        )
      }
    }

    return firstMatchingDefaults?.defaultOptions
  }

  defaultQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey extends QueryKey,
  >(
    options?:
      | QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
      | DefaultedQueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey
        >,
  ): DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > {
    if (options?._defaulted) {
      return options as DefaultedQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >
    }

    const defaultedOptions = {
      ...this.defaultOptions.queries,
      ...this.getQueryDefaults(options?.queryKey),
      ...options,
      _defaulted: true,
    }

    if (!defaultedOptions.queryHash && defaultedOptions.queryKey) {
      defaultedOptions.queryHash = hashQueryKeyByOptions(
        defaultedOptions.queryKey,
        defaultedOptions,
      )
    }

    // dependent default values
    if (typeof defaultedOptions.refetchOnReconnect === 'undefined') {
      defaultedOptions.refetchOnReconnect =
        defaultedOptions.networkMode !== 'always'
    }
    if (typeof defaultedOptions.useErrorBoundary === 'undefined') {
      defaultedOptions.useErrorBoundary = !!defaultedOptions.suspense
    }

    return defaultedOptions as DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  }

  defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(
    options?: T,
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
