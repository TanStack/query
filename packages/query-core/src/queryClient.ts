import {
  functionalUpdate,
  hashKey,
  hashQueryKeyByOptions,
  noop,
  partialMatchKey,
  resolveStaleTime,
  skipToken,
} from './utils'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { notifyManager } from './notifyManager'
import { infiniteQueryBehavior } from './infiniteQueryBehavior'
import type {
  CancelOptions,
  DefaultError,
  DefaultOptions,
  DefaultedQueryObserverOptions,
  EnsureInfiniteQueryDataOptions,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InferDataFromTag,
  InferErrorFromTag,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationKey,
  MutationObserverOptions,
  MutationOptions,
  NoInfer,
  OmitKeyof,
  QueryClientConfig,
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
} from './types'
import type { QueryState } from './query'
import type { MutationFilters, QueryFilters, Updater } from './utils'

// TYPES

interface QueryDefaults {
  queryKey: QueryKey
  defaultOptions: OmitKeyof<QueryOptions<any, any, any>, 'queryKey'>
}

interface MutationDefaults {
  mutationKey: MutationKey
  defaultOptions: MutationOptions<any, any, any, any>
}

// CLASS

/**
 * The QueryClient is the central manager for all queries and mutations.
 * It holds the query and mutation caches, manages defaults, and provides
 * methods to interact with cached data imperatively.
 *
 * @example
 * ```ts
 * const queryClient = new QueryClient({
 *   defaultOptions: {
 *     queries: { staleTime: 5 * 60 * 1000 },
 *   },
 * })
 * ```
 */
export class QueryClient {
  #queryCache: QueryCache
  #mutationCache: MutationCache
  #defaultOptions: DefaultOptions
  #queryDefaults: Map<string, QueryDefaults>
  #mutationDefaults: Map<string, MutationDefaults>
  #mountCount: number
  #unsubscribeFocus?: () => void
  #unsubscribeOnline?: () => void

  /**
   * Creates a new QueryClient instance.
   * @param config - Optional configuration including query/mutation caches and default options
   */
  constructor(config: QueryClientConfig = {}) {
    this.#queryCache = config.queryCache || new QueryCache()
    this.#mutationCache = config.mutationCache || new MutationCache()
    this.#defaultOptions = config.defaultOptions || {}
    this.#queryDefaults = new Map()
    this.#mutationDefaults = new Map()
    this.#mountCount = 0
  }

  /**
   * Mounts the client, subscribing to focus and online events.
   * Called automatically by framework adapters (e.g., QueryClientProvider).
   */
  mount(): void {
    this.#mountCount++
    if (this.#mountCount !== 1) return

    this.#unsubscribeFocus = focusManager.subscribe(async (focused) => {
      if (focused) {
        await this.resumePausedMutations()
        this.#queryCache.onFocus()
      }
    })
    this.#unsubscribeOnline = onlineManager.subscribe(async (online) => {
      if (online) {
        await this.resumePausedMutations()
        this.#queryCache.onOnline()
      }
    })
  }

  /**
   * Unmounts the client, unsubscribing from focus and online events.
   * Called automatically by framework adapters when the provider unmounts.
   */
  unmount(): void {
    this.#mountCount--
    if (this.#mountCount !== 0) return

    this.#unsubscribeFocus?.()
    this.#unsubscribeFocus = undefined

    this.#unsubscribeOnline?.()
    this.#unsubscribeOnline = undefined
  }

  /**
   * Returns the number of queries currently fetching.
   * @param filters - Optional filters to narrow down which queries to count
   * @returns The count of queries with fetchStatus 'fetching'
   */
  isFetching<TQueryFilters extends QueryFilters<any> = QueryFilters>(
    filters?: TQueryFilters,
  ): number {
    return this.#queryCache.countMatching({
      ...filters,
      fetchStatus: 'fetching',
    })
  }

  /**
   * Returns the number of mutations currently executing.
   * @param filters - Optional filters to narrow down which mutations to count
   * @returns The count of mutations with status 'pending'
   */
  isMutating<
    TMutationFilters extends MutationFilters<any, any> = MutationFilters,
  >(filters?: TMutationFilters): number {
    return this.#mutationCache.findAll({ ...filters, status: 'pending' }).length
  }

  /**
   * Imperative (non-reactive) way to retrieve data for a QueryKey.
   * Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
   *
   * Hint: Do not use this function inside a component, because it won't receive updates.
   * Use `useQuery` to create a `QueryObserver` that subscribes to changes.
   */
  getQueryData<
    TQueryFnData = unknown,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
  >(queryKey: TTaggedQueryKey): TInferredQueryFnData | undefined {
    const options = this.defaultQueryOptions({ queryKey })

    return this.#queryCache.get<TInferredQueryFnData>(options.queryHash)?.state
      .data
  }

  /**
   * Returns cached data if available, otherwise fetches the query.
   * Useful for preloading data or ensuring data exists before rendering.
   * @param options - Query options including queryKey and queryFn
   * @returns Promise resolving to the query data
   */
  ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData> {
    const defaultedOptions = this.defaultQueryOptions(options)
    const query = this.#queryCache.build(this, defaultedOptions)
    const cachedData = query.state.data

    if (cachedData === undefined) {
      return this.fetchQuery(options)
    }

    if (
      options.revalidateIfStale &&
      query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))
    ) {
      void this.prefetchQuery(defaultedOptions)
    }

    return Promise.resolve(cachedData)
  }

  /**
   * Returns an array of [queryKey, data] tuples for all queries matching the filters.
   * @param filters - Filters to select which queries to return data for
   * @returns Array of tuples containing queryKey and cached data
   */
  getQueriesData<
    TQueryFnData = unknown,
    TQueryFilters extends QueryFilters<any> = QueryFilters,
  >(filters: TQueryFilters): Array<[QueryKey, TQueryFnData | undefined]> {
    return this.#queryCache.findAll(filters).map(({ queryKey, state }) => {
      const data = state.data as TQueryFnData | undefined
      return [queryKey, data]
    })
  }

  /**
   * Imperatively updates cached data for a query.
   * Useful for optimistic updates or syncing data from other sources.
   * @param queryKey - The query key to update
   * @param updater - New data or a function receiving old data and returning new data
   * @param options - Optional settings like updatedAt timestamp
   * @returns The updated data, or undefined if the updater returned undefined
   */
  setQueryData<
    TQueryFnData = unknown,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
    updater: Updater<
      NoInfer<TInferredQueryFnData> | undefined,
      NoInfer<TInferredQueryFnData> | undefined
    >,
    options?: SetDataOptions,
  ): NoInfer<TInferredQueryFnData> | undefined {
    const defaultedOptions = this.defaultQueryOptions<
      any,
      any,
      unknown,
      any,
      QueryKey
    >({ queryKey })

    const query = this.#queryCache.get<TInferredQueryFnData>(
      defaultedOptions.queryHash,
    )
    const prevData = query?.state.data
    const data = functionalUpdate(updater, prevData)

    if (data === undefined) {
      return undefined
    }

    return this.#queryCache
      .build(this, defaultedOptions)
      .setData(data, { ...options, manual: true })
  }

  /**
   * Updates cached data for multiple queries matching the filters.
   * @param filters - Filters to select which queries to update
   * @param updater - New data or a function receiving old data and returning new data
   * @param options - Optional settings like updatedAt timestamp
   * @returns Array of tuples containing queryKey and updated data
   */
  setQueriesData<
    TQueryFnData,
    TQueryFilters extends QueryFilters<any> = QueryFilters,
  >(
    filters: TQueryFilters,
    updater: Updater<
      NoInfer<TQueryFnData> | undefined,
      NoInfer<TQueryFnData> | undefined
    >,
    options?: SetDataOptions,
  ): Array<[QueryKey, TQueryFnData | undefined]> {
    return notifyManager.batch(() =>
      this.#queryCache
        .findAll(filters)
        .map(({ queryKey }) => [
          queryKey,
          this.setQueryData<TQueryFnData>(queryKey, updater, options),
        ]),
    )
  }

  /**
   * Returns the full state object for a query, including status, error, and metadata.
   * @param queryKey - The query key to get state for
   * @returns The query state or undefined if the query doesn't exist
   */
  getQueryState<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
  ): QueryState<TInferredQueryFnData, TInferredError> | undefined {
    const options = this.defaultQueryOptions({ queryKey })
    return this.#queryCache.get<TInferredQueryFnData, TInferredError>(
      options.queryHash,
    )?.state
  }

  /**
   * Removes queries from the cache. Observers will be notified and become inactive.
   * @param filters - Optional filters to select which queries to remove
   */
  removeQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
  ): void {
    const queryCache = this.#queryCache
    notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        queryCache.remove(query)
      })
    })
  }

  /**
   * Resets queries to their initial state and optionally refetches them.
   * Unlike invalidateQueries, this clears the data to initialData (if provided).
   * @param filters - Optional filters to select which queries to reset
   * @param options - Optional refetch options
   * @returns Promise that resolves when active queries finish refetching
   */
  resetQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: ResetOptions,
  ): Promise<void> {
    const queryCache = this.#queryCache

    return notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        query.reset()
      })
      return this.refetchQueries(
        {
          type: 'active',
          ...filters,
        },
        options,
      )
    })
  }

  /**
   * Cancels in-flight queries. Useful before performing optimistic updates.
   * @param filters - Optional filters to select which queries to cancel
   * @param cancelOptions - Options like whether to revert optimistic updates
   * @returns Promise that resolves when queries have been cancelled
   */
  cancelQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    cancelOptions: CancelOptions = {},
  ): Promise<void> {
    const defaultedCancelOptions = { revert: true, ...cancelOptions }

    const promises = notifyManager.batch(() =>
      this.#queryCache
        .findAll(filters)
        .map((query) => query.cancel(defaultedCancelOptions)),
    )

    return Promise.all(promises).then(noop).catch(noop)
  }

  /**
   * Marks queries as stale and optionally refetches them.
   * This is the primary way to trigger refetches after mutations.
   * @param filters - Optional filters to select which queries to invalidate
   * @param options - Options like whether to throw on error
   * @returns Promise that resolves when active queries finish refetching
   */
  invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: InvalidateQueryFilters<TTaggedQueryKey>,
    options: InvalidateOptions = {},
  ): Promise<void> {
    return notifyManager.batch(() => {
      this.#queryCache.findAll(filters).forEach((query) => {
        query.invalidate()
      })

      if (filters?.refetchType === 'none') {
        return Promise.resolve()
      }
      return this.refetchQueries(
        {
          ...filters,
          type: filters?.refetchType ?? filters?.type ?? 'active',
        },
        options,
      )
    })
  }

  /**
   * Refetches queries matching the filters.
   * Unlike invalidateQueries, this always triggers a fetch regardless of staleness.
   * @param filters - Optional filters to select which queries to refetch
   * @param options - Options like cancelRefetch and throwOnError
   * @returns Promise that resolves when all matching queries finish refetching
   */
  refetchQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: RefetchQueryFilters<TTaggedQueryKey>,
    options: RefetchOptions = {},
  ): Promise<void> {
    const fetchOptions = {
      ...options,
      cancelRefetch: options.cancelRefetch ?? true,
    }
    const promises = notifyManager.batch(() => {
      const result: Array<Promise<unknown>> = []
      for (const query of this.#queryCache.findAll(filters)) {
        if (query.isDisabled() || query.isStatic()) {
          continue
        }
        let promise = query.fetch(undefined, fetchOptions)
        if (!fetchOptions.throwOnError) {
          promise = promise.catch(noop)
        }
        result.push(
          query.state.fetchStatus === 'paused' ? Promise.resolve() : promise,
        )
      }
      return result
    })

    return Promise.all(promises).then(noop)
  }

  /**
   * Fetches a query and returns the data. If the data is fresh, returns cached data.
   * Use this for imperative data fetching outside of components.
   * @param options - Query options including queryKey and queryFn
   * @returns Promise resolving to the query data
   * @throws Rejects if the query fails (no automatic retries by default)
   */
  fetchQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: FetchQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<TData> {
    const defaultedOptions = this.defaultQueryOptions(options)

    // https://github.com/tannerlinsley/react-query/issues/652
    if (defaultedOptions.retry === undefined) {
      defaultedOptions.retry = false
    }

    const query = this.#queryCache.build(this, defaultedOptions)

    return query.isStaleByTime(
      resolveStaleTime(defaultedOptions.staleTime, query),
    )
      ? query.fetch(defaultedOptions)
      : Promise.resolve(query.state.data as TData)
  }

  /**
   * Prefetches a query in the background for later use.
   * Unlike fetchQuery, errors are silently caught and the promise always resolves.
   * @param options - Query options including queryKey and queryFn
   */
  prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void> {
    return this.fetchQuery(options).then(noop).catch(noop)
  }

  /**
   * Fetches an infinite query and returns the paginated data.
   * @param options - Infinite query options including queryKey, queryFn, and page params
   * @returns Promise resolving to InfiniteData containing pages and pageParams
   */
  fetchInfiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: FetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<InfiniteData<TData, TPageParam>> {
    options.behavior = infiniteQueryBehavior<
      TQueryFnData,
      TError,
      TData,
      TPageParam
    >(options.pages)
    return this.fetchQuery(options as any)
  }

  /**
   * Prefetches an infinite query in the background for later use.
   * Unlike fetchInfiniteQuery, errors are silently caught.
   * @param options - Infinite query options including queryKey, queryFn, and page params
   */
  prefetchInfiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: FetchInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<void> {
    return this.fetchInfiniteQuery(options).then(noop).catch(noop)
  }

  /**
   * Returns cached infinite query data if available, otherwise fetches it.
   * @param options - Infinite query options including queryKey and queryFn
   * @returns Promise resolving to InfiniteData containing pages and pageParams
   */
  ensureInfiniteQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: EnsureInfiniteQueryDataOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<InfiniteData<TData, TPageParam>> {
    options.behavior = infiniteQueryBehavior<
      TQueryFnData,
      TError,
      TData,
      TPageParam
    >(options.pages)

    return this.ensureQueryData(options as any)
  }

  /**
   * Resumes any mutations that were paused due to lack of network connectivity.
   * @returns Promise that resolves when paused mutations have been resumed
   */
  resumePausedMutations(): Promise<unknown> {
    if (onlineManager.isOnline()) {
      return this.#mutationCache.resumePausedMutations()
    }
    return Promise.resolve()
  }

  /**
   * Returns the query cache instance.
   */
  getQueryCache(): QueryCache {
    return this.#queryCache
  }

  /**
   * Returns the mutation cache instance.
   */
  getMutationCache(): MutationCache {
    return this.#mutationCache
  }

  /**
   * Returns the default options for queries and mutations.
   */
  getDefaultOptions(): DefaultOptions {
    return this.#defaultOptions
  }

  /**
   * Sets the default options for queries and mutations.
   * @param options - New default options to apply
   */
  setDefaultOptions(options: DefaultOptions): void {
    this.#defaultOptions = options
  }

  /**
   * Sets default options for queries matching a specific query key pattern.
   * These defaults are merged with global defaults when queries are created.
   * @param queryKey - The query key pattern to match
   * @param options - Default options to apply for matching queries
   */
  setQueryDefaults<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
  >(
    queryKey: QueryKey,
    options: Partial<
      OmitKeyof<
        QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>,
        'queryKey'
      >
    >,
  ): void {
    this.#queryDefaults.set(hashKey(queryKey), {
      queryKey,
      defaultOptions: options,
    })
  }

  /**
   * Gets the default options for queries matching a specific query key.
   * @param queryKey - The query key to get defaults for
   * @returns Merged default options for matching queries
   */
  getQueryDefaults(
    queryKey: QueryKey,
  ): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'> {
    const defaults = [...this.#queryDefaults.values()]

    const result: OmitKeyof<
      QueryObserverOptions<any, any, any, any, any>,
      'queryKey'
    > = {}

    defaults.forEach((queryDefault) => {
      if (partialMatchKey(queryKey, queryDefault.queryKey)) {
        Object.assign(result, queryDefault.defaultOptions)
      }
    })
    return result
  }

  /**
   * Sets default options for mutations matching a specific mutation key pattern.
   * @param mutationKey - The mutation key pattern to match
   * @param options - Default options to apply for matching mutations
   */
  setMutationDefaults<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TOnMutateResult = unknown,
  >(
    mutationKey: MutationKey,
    options: OmitKeyof<
      MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
      'mutationKey'
    >,
  ): void {
    this.#mutationDefaults.set(hashKey(mutationKey), {
      mutationKey,
      defaultOptions: options,
    })
  }

  /**
   * Gets the default options for mutations matching a specific mutation key.
   * @param mutationKey - The mutation key to get defaults for
   * @returns Merged default options for matching mutations
   */
  getMutationDefaults(
    mutationKey: MutationKey,
  ): OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'> {
    const defaults = [...this.#mutationDefaults.values()]

    const result: OmitKeyof<
      MutationObserverOptions<any, any, any, any>,
      'mutationKey'
    > = {}

    defaults.forEach((queryDefault) => {
      if (partialMatchKey(mutationKey, queryDefault.mutationKey)) {
        Object.assign(result, queryDefault.defaultOptions)
      }
    })

    return result
  }

  /**
   * Merges provided options with global and query-specific defaults.
   * This is used internally to compute final options for queries.
   * @param options - Options to merge with defaults
   * @returns Options with all defaults applied
   */
  defaultQueryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options:
      | QueryObserverOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey,
          TPageParam
        >
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
    if (options._defaulted) {
      return options as DefaultedQueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >
    }

    const defaultedOptions = {
      ...this.#defaultOptions.queries,
      ...this.getQueryDefaults(options.queryKey),
      ...options,
      _defaulted: true,
    }

    if (!defaultedOptions.queryHash) {
      defaultedOptions.queryHash = hashQueryKeyByOptions(
        defaultedOptions.queryKey,
        defaultedOptions,
      )
    }

    // dependent default values
    if (defaultedOptions.refetchOnReconnect === undefined) {
      defaultedOptions.refetchOnReconnect =
        defaultedOptions.networkMode !== 'always'
    }
    if (defaultedOptions.throwOnError === undefined) {
      defaultedOptions.throwOnError = !!defaultedOptions.suspense
    }

    if (!defaultedOptions.networkMode && defaultedOptions.persister) {
      defaultedOptions.networkMode = 'offlineFirst'
    }

    if (defaultedOptions.queryFn === skipToken) {
      defaultedOptions.enabled = false
    }

    return defaultedOptions as DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  }

  /**
   * Merges provided options with global and mutation-specific defaults.
   * This is used internally to compute final options for mutations.
   * @param options - Options to merge with defaults
   * @returns Options with all defaults applied
   */
  defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(
    options?: T,
  ): T {
    if (options?._defaulted) {
      return options
    }
    return {
      ...this.#defaultOptions.mutations,
      ...(options?.mutationKey &&
        this.getMutationDefaults(options.mutationKey)),
      ...options,
      _defaulted: true,
    } as T
  }

  /**
   * Clears all queries and mutations from the cache.
   * Use with caution as this removes all cached data.
   */
  clear(): void {
    this.#queryCache.clear()
    this.#mutationCache.clear()
  }
}
