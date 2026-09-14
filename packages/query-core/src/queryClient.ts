import {
  functionalUpdate,
  hashKey,
  hashQueryKeyByOptions,
  noop,
  partialMatchKey,
  resolveQueryValue,
  skipToken,
} from './utils'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { notifyManager } from './notifyManager'
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
  InfiniteQueryExecuteOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationKey,
  MutationObserverOptions,
  MutationOptions,
  OmitKeyof,
  QueryClientConfig,
  QueryExecuteOptions,
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
 * `QueryClient` is used to interact with a cache of queries and mutations. It owns a
 * `QueryCache` and a `MutationCache` (creating default ones if none are passed in) and holds
 * the default options that are applied to queries and mutations created through it.
 *
 * @example
 * ```ts
 * const queryClient = new QueryClient({
 *   defaultOptions: {
 *     queries: {
 *       staleTime: Infinity,
 *     },
 *   },
 * })
 *
 * await queryClient.query({ queryKey: ['posts'], queryFn: fetchPosts })
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

  constructor(config: QueryClientConfig = {}) {
    this.#queryCache = config.queryCache || new QueryCache()
    this.#mutationCache = config.mutationCache || new MutationCache()
    this.#defaultOptions = config.defaultOptions || {}
    this.#queryDefaults = new Map()
    this.#mutationDefaults = new Map()
    this.#mountCount = 0
  }

  /**
   * Called by a framework adapter's `QueryClientProvider`-equivalent when it mounts, to start
   * listening for focus/online events and resume paused mutations. Ref-counted via an internal
   * mount count, so nested or multiple providers sharing the same `QueryClient` don't tear down
   * the shared listeners until the last one unmounts.
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
   * The inverse of {@link QueryClient#mount} — called by a framework adapter's
   * `QueryClientProvider`-equivalent when it unmounts. Only tears down the focus/online
   * listeners once the mount count returns to `0`.
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
   * Returns the number of queries in the cache that are currently fetching, optionally
   * matching a set of filters. This includes background-fetching, loading new pages, and
   * loading more infinite query results.
   *
   * @example
   * ```ts
   * if (queryClient.isFetching()) {
   *   console.log('At least one query is fetching!')
   * }
   * ```
   */
  isFetching<TQueryFilters extends QueryFilters<any> = QueryFilters>(
    filters?: TQueryFilters,
  ): number {
    return this.#queryCache.findAll({ ...filters, fetchStatus: 'fetching' })
      .length
  }

  /**
   * Returns the number of mutations in the cache that are currently pending, optionally
   * matching a set of filters.
   *
   * @example
   * ```ts
   * if (queryClient.isMutating()) {
   *   console.log('At least one mutation is pending!')
   * }
   * ```
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
   *
   * @see {@link QueryClient#getQueriesData}
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
   * @deprecated Use queryClient.query({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.
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
      query.isStaleByTime(resolveQueryValue(defaultedOptions.staleTime, query))
    ) {
      void this.prefetchQuery(defaultedOptions)
    }

    return Promise.resolve(cachedData)
  }

  /**
   * Imperative (non-reactive) way to retrieve the cached data of multiple queries at once.
   * Only queries matching the given filters are returned; if none match, an empty array is
   * returned.
   *
   * Because the matched queries can hold data of different shapes (e.g. a broad filter can match
   * queries with unrelated data types), the `TQueryFnData` generic defaults to `unknown` rather
   * than being inferred. Passing a more specific type is a convenience for call sites that know
   * every matched query holds the same shape — it is not checked against the actual cache
   * contents.
   *
   * @see {@link QueryClient#getQueryData}
   * @example
   * ```ts
   * const data = queryClient.getQueriesData({ queryKey: ['posts'] })
   * ```
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
   * Synchronous way to immediately update a query's cached data. If the updater (or the value
   * passed) resolves to `undefined`, the cache is left untouched and no query is created;
   * otherwise, if the query does not exist yet, it will be created. To update multiple queries
   * at once by partially matching query keys, use {@link QueryClient#setQueriesData} instead.
   *
   * Updates must be performed immutably: do not mutate `oldData`, or data previously retrieved
   * via {@link QueryClient#getQueryData}, in place.
   *
   * @param queryKey - The query key to set data for.
   * @param updater - Either the new data, or a function that receives the current data (which
   * may be `undefined`) and returns the new data.
   *
   * @example
   * ```ts
   * queryClient.setQueryData(['posts'], newPosts)
   *
   * // Or, using an updater function that receives the current data:
   * queryClient.setQueryData(['posts'], (oldPosts) => [...oldPosts, newPost])
   * ```
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
   * Synchronous way to immediately update the cached data of multiple queries at once, using
   * filters or partial query key matching. Only queries that already exist and match the given
   * filters are updated; no new cache entries are created. Internally this calls
   * {@link QueryClient#setQueryData} for each matching query.
   *
   * @example
   * ```ts
   * queryClient.setQueriesData({ queryKey: ['posts'] }, (oldPosts) =>
   *   oldPosts ? oldPosts.filter((post) => post.id !== deletedId) : oldPosts,
   * )
   * ```
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
   * Imperative (non-reactive) way to retrieve an existing query's state. If the query does not
   * exist, `undefined` is returned.
   *
   * @example
   * ```ts
   * const state = queryClient.getQueryState(['posts'])
   * console.log(state?.dataUpdatedAt)
   * ```
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
   * Removes queries from the cache that match the given filters. Unlike
   * {@link QueryClient#invalidateQueries} or {@link QueryClient#refetchQueries}, this removes
   * matching queries from the cache instead of refetching them. Without filters, every query in
   * the cache is removed.
   *
   * @example
   * ```ts
   * queryClient.removeQueries({ queryKey: ['posts'], exact: true })
   * ```
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
   * Resets queries matching the given filters back to their initial state (e.g. any
   * `initialData`), notifying subscribers rather than removing them. Active queries among the
   * matched set are then refetched, and the returned promise resolves once that refetch settles.
   *
   * @example
   * ```ts
   * await queryClient.resetQueries({ queryKey: ['posts'], exact: true })
   * ```
   */
  resetQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: ResetOptions,
  ): Promise<void> {
    const queryCache = this.#queryCache

    return notifyManager.batch(() => {
      const matched = queryCache.findAll(filters)
      const queriesToRefetch = new Set(matched)
      matched.forEach((query) => {
        query.reset()
      })
      return this.refetchQueries(
        {
          type: 'active',
          predicate: (query) => queriesToRefetch.has(query),
        },
        options,
      )
    })
  }

  /**
   * Cancels outgoing fetches for queries matching the given filters. Most useful when performing
   * optimistic updates, since any outgoing refetch that resolves afterwards would otherwise
   * overwrite the optimistic update. By default (`revert: true`), a cancelled query's data is
   * reverted to its state before the outgoing fetch started.
   *
   * The returned promise never rejects, even if individual cancellations fail.
   *
   * @example
   * ```ts
   * await queryClient.cancelQueries({ queryKey: ['posts'], exact: true })
   * ```
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
   * Marks queries matching the given filters as invalidated. Unlike
   * {@link QueryClient#removeQueries}, invalidated queries stay in the cache.
   *
   * Unless `filters.refetchType` is `'none'`, matching queries are then refetched via
   * {@link QueryClient#refetchQueries}, using `filters.refetchType` if set, otherwise
   * `filters.type`, otherwise `'active'`.
   *
   * @example
   * ```ts
   * await queryClient.invalidateQueries({ queryKey: ['posts'], refetchType: 'active' })
   * ```
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
   * Refetches queries matching the given filters, regardless of whether they are stale. Without
   * filters, every query in the cache is refetched. Queries that are disabled, or static (only
   * have observers with a static `staleTime`), are never refetched.
   *
   * By default (`cancelRefetch: true`), a currently running fetch is cancelled before the new
   * one starts. The returned promise resolves once all matching queries have settled; it does
   * not reject on individual query failures unless `throwOnError` is set.
   *
   * @example
   * ```ts
   * // refetch all active queries partially matching a query key:
   * await queryClient.refetchQueries({ queryKey: ['posts'], type: 'active' })
   * ```
   */
  refetchQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: RefetchQueryFilters<TTaggedQueryKey>,
    options: RefetchOptions = {},
  ): Promise<void> {
    const fetchOptions = {
      ...options,
      cancelRefetch: options.cancelRefetch ?? true,
    }
    const promises = notifyManager.batch(() =>
      this.#queryCache
        .findAll(filters)
        .filter((query) => !query.isDisabled() && !query.isStatic())
        .map((query) => {
          let promise = query.fetch(undefined, fetchOptions)
          if (!fetchOptions.throwOnError) {
            promise = promise.catch(noop)
          }
          return query.state.fetchStatus === 'paused'
            ? Promise.resolve()
            : promise
        }),
    )

    return Promise.all(promises).then(noop)
  }

  /**
   * Asynchronous method to fetch and cache a query, resolving with the data or throwing with
   * the error.
   *
   * If the query already exists in the cache and its data is not stale (per the given
   * `staleTime`), the cached data is returned without fetching. Otherwise, the query is fetched
   * and the promise resolves once the fetch settles. If a `select` function is provided, it is
   * applied to the data in both cases (cached or freshly fetched) before it is returned.
   *
   * Unlike a reactive observer, retries are disabled by default here (`retry: false`) unless
   * explicitly configured, since there is no component to catch a thrown error and retry through
   * re-render.
   *
   * The accepted options are `QueryObserverOptions` minus the fields that only make sense for a
   * reactive observer — `enabled`, `refetchInterval`, `refetchIntervalInBackground`,
   * `refetchOnWindowFocus`, `refetchOnReconnect`, `refetchOnMount`, `retryOnMount`,
   * `notifyOnChangeProps`, `throwOnError`, `suspense`, and `placeholderData` are not part of this
   * method's options.
   *
   * This method replaces the deprecated `fetchQuery`, and — combined with
   * `{ staleTime: 'static' }` — the deprecated `ensureQueryData`.
   *
   * @example
   * ```ts
   * try {
   *   const data = await queryClient.query({ queryKey, queryFn, staleTime: 10000 })
   * } catch (error) {
   *   console.log(error)
   * }
   * ```
   */
  async query<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
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

    const isStale = query.isStaleByTime(
      resolveQueryValue(defaultedOptions.staleTime, query),
    )

    const queryData = isStale
      ? await query.fetch(defaultedOptions)
      : (query.state.data as TQueryData)

    const select = defaultedOptions.select

    if (select) {
      return select(queryData)
    }

    return queryData as unknown as TData
  }

  /**
   * @deprecated Use queryClient.query(options) instead. This method will be removed in the next major version.
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
      resolveQueryValue(defaultedOptions.staleTime, query),
    )
      ? query.fetch(defaultedOptions)
      : Promise.resolve(query.state.data as TData)
  }

  /**
   * @deprecated Use queryClient.query(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.
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
   * Asynchronous method to fetch and cache an infinite query, resolving with an
   * {@link InfiniteData} object or throwing with the error.
   *
   * Behaves like {@link QueryClient#query}, accepting the same options (minus
   * `initialPageParam`), plus the required `initialPageParam`, and an optional `pages` /
   * `getNextPageParam` pair used to refetch a fixed number of pages from the start.
   *
   * This method replaces the deprecated `fetchInfiniteQuery`, and — combined with
   * `{ staleTime: 'static' }` — the deprecated `ensureInfiniteQueryData`.
   *
   * @example
   * ```ts
   * try {
   *   const data = await queryClient.infiniteQuery({ queryKey, queryFn, initialPageParam: 0 })
   *   console.log(data.pages)
   * } catch (error) {
   *   console.log(error)
   * }
   * ```
   */
  infiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): Promise<
    Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData
  > {
    options._type = 'infinite'
    return this.query(options as any)
  }

  /**
   * @deprecated Use queryClient.infiniteQuery(options) instead. This method will be removed in the next major version.
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
    options._type = 'infinite'
    return this.fetchQuery(options as any)
  }

  /**
   * @deprecated Use queryClient.infiniteQuery(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.
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
   * @deprecated Use queryClient.infiniteQuery({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.
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
    options._type = 'infinite'

    return this.ensureQueryData(options as any)
  }

  /**
   * Resumes mutations that were paused because there was no network connection. Does nothing
   * (resolving immediately) if the client is currently offline.
   *
   * @example
   * ```ts
   * import { QueryClient } from '@tanstack/query-core'
   *
   * const queryClient = new QueryClient()
   * await queryClient.resumePausedMutations()
   * ```
   */
  resumePausedMutations(): Promise<unknown> {
    if (onlineManager.isOnline()) {
      return this.#mutationCache.resumePausedMutations()
    }
    return Promise.resolve()
  }

  /**
   * Returns the query cache this client is connected to.
   *
   * @example
   * ```ts
   * import { QueryClient } from '@tanstack/query-core'
   *
   * const queryClient = new QueryClient()
   * const queryCache = queryClient.getQueryCache()
   * const queries = queryCache.findAll({ queryKey: ['posts'] })
   * ```
   */
  getQueryCache(): QueryCache {
    return this.#queryCache
  }

  /**
   * Returns the mutation cache this client is connected to.
   *
   * @example
   * ```ts
   * import { QueryClient } from '@tanstack/query-core'
   *
   * const queryClient = new QueryClient()
   * const mutationCache = queryClient.getMutationCache()
   * const mutations = mutationCache.findAll({ status: 'pending' })
   * ```
   */
  getMutationCache(): MutationCache {
    return this.#mutationCache
  }

  /**
   * Returns the default options that were set when creating the client, or via
   * {@link QueryClient#setDefaultOptions}.
   *
   * @example
   * ```ts
   * import { QueryClient } from '@tanstack/query-core'
   *
   * const queryClient = new QueryClient()
   * const defaultOptions = queryClient.getDefaultOptions()
   * ```
   */
  getDefaultOptions(): DefaultOptions {
    return this.#defaultOptions
  }

  /**
   * Dynamically sets the default options for this client, overwriting any previously defined
   * default options.
   *
   * @see {@link QueryClient#getDefaultOptions}
   * @example
   * ```ts
   * import { QueryClient } from '@tanstack/query-core'
   *
   * const queryClient = new QueryClient()
   * queryClient.setDefaultOptions({
   *   queries: {
   *     staleTime: Infinity,
   *   },
   * })
   * ```
   */
  setDefaultOptions(options: DefaultOptions): void {
    this.#defaultOptions = options
  }

  /**
   * Sets default options for queries whose query key partially matches the given `queryKey`.
   *
   * If several registered query defaults match a given query key, they are merged together in
   * registration order by {@link QueryClient#getQueryDefaults}, so register defaults from the
   * most generic key to the least generic one — more specific defaults should be registered
   * after more generic ones so they take precedence.
   *
   * @example
   * ```ts
   * queryClient.setQueryDefaults(['posts'], { queryFn: fetchPosts })
   *
   * await queryClient.query({ queryKey: ['posts'] })
   * ```
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
   * Returns the default options registered for queries whose query key partially matches the
   * given `queryKey`, via {@link QueryClient#setQueryDefaults}. If multiple registered defaults
   * match, they are merged together in registration order.
   *
   * @example
   * ```ts
   * const defaultOptions = queryClient.getQueryDefaults(['posts'])
   * ```
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
   * Sets default options for mutations whose mutation key partially matches the given
   * `mutationKey`. As with {@link QueryClient#setQueryDefaults}, the order of registration
   * matters when several registered defaults match the same mutation key.
   *
   * @see {@link QueryClient#getMutationDefaults}
   * @example
   * ```ts
   * queryClient.setMutationDefaults(['addPost'], { mutationFn: addPost })
   * ```
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
   * Returns the default options registered for mutations whose mutation key partially matches
   * the given `mutationKey`, via {@link QueryClient#setMutationDefaults}. If multiple registered
   * defaults match, they are merged together in registration order.
   *
   * @example
   * ```ts
   * const defaultOptions = queryClient.getMutationDefaults(['addPost'])
   * ```
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
   * Called by framework adapters (e.g. inside `useQuery`) to resolve the options passed by the
   * caller into their final, defaulted form: merging `queryClient.setQueryDefaults` for the
   * given `queryKey`, then the client's own `defaultOptions.queries`, then the caller's options
   * on top. A no-op if the options are already defaulted (`_defaulted: true`).
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
   * The mutation counterpart of {@link QueryClient#defaultQueryOptions}. Called by framework
   * adapters (e.g. inside `useMutation`) to merge `queryClient.setMutationDefaults` for the
   * given `mutationKey`, then the client's `defaultOptions.mutations`, then the caller's options
   * on top. A no-op if the options are already defaulted (`_defaulted: true`).
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
   * Clears both the query cache and the mutation cache this client is connected to.
   *
   * @example
   * ```ts
   * import { QueryClient } from '@tanstack/query-core'
   *
   * const queryClient = new QueryClient()
   * queryClient.clear()
   * ```
   */
  clear(): void {
    this.#queryCache.clear()
    this.#mutationCache.clear()
  }
}
