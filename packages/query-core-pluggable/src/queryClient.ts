import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { QueryCache } from './queryCache'
import { clearQueryCache, findCachedQueries } from './queryCacheOperations'
import {
  defaultQueryFn,
  functionalUpdate,
  hashKeyByOptions,
  partialMatchKey,
  resolveQueryValue,
  skipToken,
} from './utils'
import type { MutationCache } from './mutationCache'
import type { QueryState } from './query'
import type {
  CacheKeyConfig,
  DefaultError,
  DefaultOptions,
  DefaultedQueryObserverOptions,
  InferDataFromTag,
  InferErrorFromTag,
  MutationKey,
  MutationObserverOptions,
  MutationOptions,
  OmitKeyof,
  QueryClientConfig,
  QueryExecuteOptions,
  QueryKey,
  QueryObserverOptionsBase,
  QueryOptions,
  SetDataOptions,
} from './types'
import type { MutationFilters, QueryFilters, Updater } from './utils'

/** Options whose query function always executes. */
export type WithoutSkipToken<T extends { queryFn?: unknown }> = Omit<
  T,
  'queryFn'
> & {
  queryFn?: Exclude<T['queryFn'], typeof skipToken>
}

type QueryDefaults = OmitKeyof<QueryOptions<any, any, any>, 'queryKey'>
type MutationDefaults = MutationOptions<any, any, any, any>

class KeyDefaults<
  TKey extends ReadonlyArray<unknown>,
  TOptions extends object,
> {
  #entries = new Map<string, { key: TKey; options: TOptions }>()

  set(key: TKey, options: TOptions, config?: CacheKeyConfig<TKey>): void {
    this.#entries.set(hashKeyByOptions(key, config), { key, options })
  }

  get(key: TKey, config?: CacheKeyConfig<TKey>): Partial<TOptions> {
    const result: Partial<TOptions> = {}
    for (const entry of this.#entries.values()) {
      if (partialMatchKey(key, entry.key, config?.equalityFn)) {
        Object.assign(result, entry.options)
      }
    }
    return result
  }
}

/** @internal */
export const mutationCacheKey = Symbol.for(
  '@tanstack/query-core-pluggable/mutationCache',
)

const clientState = Symbol.for('@tanstack/query-core-pluggable/clientState')

/** Holds the caches, defaults and subscriptions shared by this client's consumers. */
export class QueryClient {
  /** @internal */
  [mutationCacheKey]?: MutationCache
  /** @internal */
  readonly [clientState]: {
    queryCache: QueryCache
    defaultOptions: DefaultOptions
    queryDefaults?: KeyDefaults<QueryKey, QueryDefaults>
    mutationDefaults?: KeyDefaults<MutationKey, MutationDefaults>
    mountCount: number
    unsubscribeFocus?: () => void
    unsubscribeOnline?: () => void
  }

  constructor(config: QueryClientConfig = {}) {
    this[mutationCacheKey] = config.mutationCache
    this[clientState] = {
      queryCache: config.queryCache ?? new QueryCache(),
      defaultOptions: config.defaultOptions ?? {},
      mountCount: 0,
    }
  }
}

/**
 * Called by a framework adapter's `QueryClientProvider`-equivalent when it mounts, to start
 * listening for focus/online events and resume paused mutations. Ref-counted via an internal
 * mount count, so nested or multiple providers sharing the same `QueryClient` don't tear down
 * the shared listeners until the last one unmounts.
 * @param client - The client whose subscriptions are managed.
 */
export function mountQueryClient(client: QueryClient): void {
  client[clientState].mountCount++
  if (client[clientState].mountCount !== 1) return

  client[clientState].unsubscribeFocus = focusManager.subscribe(
    async (focused) => {
      if (focused) {
        await resumePausedMutations(client)
        client[clientState].queryCache.onFocus()
      }
    },
  )
  client[clientState].unsubscribeOnline = onlineManager.subscribe(
    async (online) => {
      if (online) {
        await resumePausedMutations(client)
        client[clientState].queryCache.onOnline()
      }
    },
  )
}

/**
 * The inverse of {@link mountQueryClient} — called by a framework adapter's
 * `QueryClientProvider`-equivalent when it unmounts. Only tears down the focus/online
 * listeners once the mount count returns to `0`.
 * @param client - The client whose subscriptions are managed.
 */
export function unmountQueryClient(client: QueryClient): void {
  client[clientState].mountCount--
  if (client[clientState].mountCount !== 0) return

  client[clientState].unsubscribeFocus?.()
  client[clientState].unsubscribeFocus = undefined

  client[clientState].unsubscribeOnline?.()
  client[clientState].unsubscribeOnline = undefined
}

/**
 * Returns the number of queries in the cache that are currently fetching, optionally
 * matching a set of filters. This includes background-fetching, loading new pages, and
 * loading more infinite query results.
 * @param client - The client that owns this operation.
 * @param filters - Narrows down which fetching queries are counted. Without filters, every
 * fetching query is counted.
 * @returns The number of matching queries whose `fetchStatus` is `'fetching'`.
 * @example
 * ```ts
 * if (countFetchingQueries(queryClient)) {
 *   console.log('At least one query is fetching!')
 * }
 * ```
 */
export function countFetchingQueries(
  client: QueryClient,
  filters?: Omit<QueryFilters, 'fetchStatus'>,
): number {
  return findCachedQueries(client[clientState].queryCache, {
    ...filters,
    fetchStatus: 'fetching',
  }).length
}

/**
 * Returns the number of mutations in the cache that are currently pending, optionally
 * matching a set of filters.
 * @param client - The client that owns this operation.
 * @param filters - Narrows down which pending mutations are counted. Without filters, every
 * pending mutation is counted.
 * @returns The number of matching mutations whose `status` is `'pending'`.
 * @example
 * ```ts
 * if (isMutating(queryClient)) {
 *   console.log('At least one mutation is pending!')
 * }
 * ```
 */
export function isMutating<
  TMutationFilters extends MutationFilters<any, any> = MutationFilters<
    any,
    any
  >,
>(
  client: QueryClient,
  filters?: NoInfer<Omit<TMutationFilters, 'status'>>,
): number {
  return (
    client[mutationCacheKey]?.findAll({ ...filters, status: 'pending' })
      .length ?? 0
  )
}

/**
 * Imperative (non-reactive) way to retrieve data for a QueryKey.
 * Should only be used in callbacks or functions where reading the latest data is necessary, e.g. for optimistic updates.
 *
 * Hint: Do not use this function inside a component, because it won't receive updates.
 * Use `useQuery` to create a `QueryObserver` that subscribes to changes.
 * @param client - The client that owns this operation.
 * @param queryKey - The query key of the query to read.
 * @returns The cached data for the query, or `undefined` if no query with this key has been observed yet.
 * @see {@link getQueriesData}
 */
export function getQueryData<
  TQueryFnData = unknown,
  TTaggedQueryKey extends QueryKey = QueryKey,
  TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
>(
  client: QueryClient,
  queryKey: TTaggedQueryKey,
): TInferredQueryFnData | undefined {
  const options = defaultQueryOptions(client, { queryKey })

  return client[clientState].queryCache.get<TInferredQueryFnData>(
    options.queryHash,
  )?.state.data
}

/**
 * Synchronous way to immediately update a query's cached data. If the updater (or the value
 * passed) resolves to `undefined`, the cache is left untouched and no query is created;
 * otherwise, if the query does not exist yet, it will be created. To update multiple queries
 * at once by partially matching query keys, import `setQueriesData`.
 *
 * Updates must be performed immutably: do not mutate `oldData`, or data previously retrieved
 * via {@link getQueryData}, in place.
 * @param client - The client that owns this operation.
 * @param queryKey - The query key to set data for.
 * @param updater - Either the new data, or a function that receives the current data (which
 * may be `undefined`) and returns the new data.
 * @param options - Set `updatedAt` to override the timestamp the written data is recorded with.
 * @returns The data that was written, or `undefined` if the updater returned `undefined` — in that case
 * the write is skipped and the cache is left unchanged.
 * @example
 * ```ts
 * setQueryData(queryClient, ['posts'], newPosts)
 *
 * // Or, using an updater function that receives the current data:
 * setQueryData(queryClient, ['posts'], (oldPosts) => [...oldPosts, newPost])
 * ```
 */
export function setQueryData<
  TQueryFnData = unknown,
  TTaggedQueryKey extends QueryKey = QueryKey,
  TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
>(
  client: QueryClient,
  queryKey: TTaggedQueryKey,
  updater: Updater<
    InferDataFromTag<NoInfer<TQueryFnData>, TTaggedQueryKey> | undefined,
    NoInfer<TInferredQueryFnData> | undefined
  >,
  options?: SetDataOptions,
): NoInfer<TInferredQueryFnData> | undefined {
  const defaultedOptions = defaultQueryOptions<
    any,
    any,
    unknown,
    any,
    QueryKey
  >(client, { queryKey })

  const query = client[clientState].queryCache.get<
    InferDataFromTag<NoInfer<TQueryFnData>, TTaggedQueryKey>
  >(defaultedOptions.queryHash)
  const prevData = query?.state.data
  const data = functionalUpdate(updater, prevData)

  if (data === undefined) {
    return undefined
  }

  return client[clientState].queryCache
    .build(client, defaultedOptions)
    .setData(data, { ...options, manual: true })
}

/**
 * Imperative (non-reactive) way to retrieve an existing query's state. If the query does not
 * exist, `undefined` is returned.
 * @param client - The client that owns this operation.
 * @param queryKey - The query key of the query to read.
 * @returns The query's state, or `undefined` if no query with this key exists.
 * @example
 * ```ts
 * const state = getQueryState(queryClient, ['posts'])
 * console.log(state?.dataUpdatedAt)
 * ```
 */
export function getQueryState<
  TQueryFnData = unknown,
  TError = DefaultError,
  TTaggedQueryKey extends QueryKey = QueryKey,
  TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
  TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
>(
  client: QueryClient,
  queryKey: TTaggedQueryKey,
): QueryState<TInferredQueryFnData, TInferredError> | undefined {
  const options = defaultQueryOptions(client, { queryKey })
  return client[clientState].queryCache.get<
    TInferredQueryFnData,
    TInferredError
  >(options.queryHash)?.state
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
 * Shared query options can contain `skipToken` as their `queryFn`. If the supplied options contain
 * the token, the call skips fetching and resolves with existing data regardless of freshness.
 * It applies `select` when data exists and resolves to `undefined` on a cache miss.
 * Use {@link getQueryData} to read the cache directly.
 * @param client - The client that owns this operation.
 * @param options - The query options, including the `queryKey` and the `queryFn` used if the
 * query needs to fetch.
 * @returns A promise that resolves to the data, or to the result of `select` if provided. It
 * rejects with the error from the fetch or from `select`.
 * @example
 * ```ts
 * try {
 *   const data = await fetchQuery(queryClient, { queryKey, queryFn, staleTime: 10000 })
 * } catch (error) {
 *   console.log(error)
 * }
 * ```
 */
export function fetchQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: WithoutSkipToken<
    QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<TData>

export function fetchQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: QueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
): Promise<TData | undefined>

export async function fetchQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: QueryExecuteOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
): Promise<TData | undefined> {
  const defaultedOptions = defaultQueryOptions(client, options)
  let queryData: TQueryData

  if (options.queryFn === skipToken) {
    const cachedData = client[clientState].queryCache.get<
      TQueryFnData,
      TError,
      TQueryData,
      TQueryKey
    >(defaultedOptions.queryHash)?.state.data
    if (cachedData === undefined) return undefined
    queryData = cachedData
  } else {
    // https://github.com/tannerlinsley/react-query/issues/652
    if (defaultedOptions.retry === undefined) {
      defaultedOptions.retry = false
    }

    const query = client[clientState].queryCache.build(client, defaultedOptions)

    const isStale = query.isStaleByTime(
      resolveQueryValue(defaultedOptions.staleTime, query),
    )

    queryData = isStale
      ? await query.fetch(defaultedOptions)
      : (query.state.data as TQueryData)
  }

  const select = defaultedOptions.select

  if (select) {
    return select[1](queryData)
  }

  return queryData as unknown as TData
}

/**
 * Resumes mutations that were paused because there was no network connection. Does nothing
 * (resolving immediately) if the client is currently offline.
 * @param client - The client that owns this operation.
 * @returns A promise that resolves once the resumed mutations have settled.
 * @example
 * ```ts
 * import { QueryClient, resumePausedMutations } from '@tanstack/query-core-pluggable'
 *
 * const queryClient = new QueryClient()
 * await resumePausedMutations(queryClient)
 * ```
 */
export function resumePausedMutations(client: QueryClient): Promise<unknown> {
  if (onlineManager.isOnline()) {
    return (
      client[mutationCacheKey]?.resumePausedMutations() ?? Promise.resolve([])
    )
  }
  return Promise.resolve()
}

/**
 * Returns the query cache this client is connected to.
 * @param client - The client that owns this operation.
 * @returns The {@link QueryCache} instance.
 * @example
 * ```ts
 * import { QueryClient, getQueryCache } from '@tanstack/query-core-pluggable'
 *
 * const queryClient = new QueryClient()
 * const queryCache = getQueryCache(queryClient)
 * const queries = findCachedQueries(queryCache, { queryKey: ['posts'] })
 * ```
 */
export function getQueryCache(client: QueryClient): QueryCache {
  return client[clientState].queryCache
}

/**
 * Returns the default options that were set when creating the client, or via
 * {@link setDefaultOptions}.
 * @param client - The client that owns this operation.
 * @returns The client's current default options.
 * @example
 * ```ts
 * import { QueryClient, getDefaultOptions } from '@tanstack/query-core-pluggable'
 *
 * const queryClient = new QueryClient()
 * const defaultOptions = getDefaultOptions(queryClient)
 * ```
 */
export function getDefaultOptions(client: QueryClient): DefaultOptions {
  return client[clientState].defaultOptions
}

/**
 * Dynamically sets the default options for this client, overwriting any previously defined
 * default options.
 * @param client - The client that owns this operation.
 * @param options - The new default options for queries and mutations.
 * @see {@link getDefaultOptions}
 * @example
 * ```ts
 * import { QueryClient, setDefaultOptions } from '@tanstack/query-core-pluggable'
 *
 * const queryClient = new QueryClient()
 * setDefaultOptions(queryClient, {
 *   queries: {
 *     staleTime: Infinity,
 *   },
 * })
 * ```
 */
export function setDefaultOptions(
  client: QueryClient,
  options: DefaultOptions,
): void {
  client[clientState].defaultOptions = options
}

/**
 * Sets default options for queries whose query key partially matches the given `queryKey`.
 *
 * If several registered query defaults match a given query key, they are merged together in
 * registration order by {@link getQueryDefaults}, so register defaults from the
 * most generic key to the least generic one — more specific defaults should be registered
 * after more generic ones so they take precedence.
 * @param client - The client that owns this operation.
 * @param queryKey - The query key that query keys are partially matched against.
 * @param options - The default options applied to matching queries.
 * @example
 * ```ts
 * setQueryDefaults(queryClient, ['posts'], { queryFn: fetchPosts })
 *
 * await fetchQuery(queryClient, { queryKey: ['posts'] })
 * ```
 */
export function setQueryDefaults<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
>(
  client: QueryClient,
  queryKey: QueryKey,
  options: Partial<
    OmitKeyof<
      QueryObserverOptionsBase<TQueryFnData, TError, TData, TQueryData>,
      'queryKey'
    >
  >,
): void {
  ;(client[clientState].queryDefaults ??= new KeyDefaults()).set(
    queryKey,
    options,
    client[clientState].queryCache.config.queryKey,
  )
}

/**
 * Returns the default options registered for queries whose query key partially matches the
 * given `queryKey`, via {@link setQueryDefaults}. If multiple registered defaults
 * match, they are merged together in registration order.
 * @param client - The client that owns this operation.
 * @param queryKey - The query key to look up registered defaults for.
 * @returns The merged default options of every registration that matches, or an empty object if
 * none match.
 * @example
 * ```ts
 * const defaultOptions = getQueryDefaults(queryClient, ['posts'])
 * ```
 */
export function getQueryDefaults(
  client: QueryClient,
  queryKey: QueryKey,
): OmitKeyof<QueryObserverOptionsBase<any, any, any, any, any>, 'queryKey'> {
  return (
    client[clientState].queryDefaults?.get(
      queryKey,
      client[clientState].queryCache.config.queryKey,
    ) ?? {}
  )
}

/**
 * Sets default options for mutations whose mutation key partially matches the given
 * `mutationKey`. As with {@link setQueryDefaults}, the order of registration
 * matters when several registered defaults match the same mutation key.
 * @param client - The client that owns this operation.
 * @param mutationKey - The mutation key that mutation keys are partially matched against.
 * @param options - The default options applied to matching mutations.
 * @see {@link getMutationDefaults}
 * @example
 * ```ts
 * setMutationDefaults(queryClient, ['addPost'], { mutationFn: addPost })
 * ```
 */
export function setMutationDefaults<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  client: QueryClient,
  mutationKey: MutationKey,
  options: OmitKeyof<
    MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>,
    'mutationKey'
  >,
): void {
  ;(client[clientState].mutationDefaults ??= new KeyDefaults()).set(
    mutationKey,
    options,
    client[mutationCacheKey]?.config.mutationKey,
  )
}

/**
 * Returns the default options registered for mutations whose mutation key partially matches
 * the given `mutationKey`, via {@link setMutationDefaults}. If multiple registered
 * defaults match, they are merged together in registration order.
 * @param client - The client that owns this operation.
 * @param mutationKey - The mutation key to look up registered defaults for.
 * @returns The merged default options of every registration that matches, or an empty object if
 * none match.
 * @example
 * ```ts
 * const defaultOptions = getMutationDefaults(queryClient, ['addPost'])
 * ```
 */
export function getMutationDefaults(
  client: QueryClient,
  mutationKey: MutationKey,
): OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'> {
  return (
    client[clientState].mutationDefaults?.get(
      mutationKey,
      client[mutationCacheKey]?.config.mutationKey,
    ) ?? {}
  )
}

/**
 * Called by framework adapters (e.g. inside `useQuery`) to resolve the options passed by the
 * caller into their final, defaulted form: merging the client's own `defaultOptions.queries`,
 * then `setQueryDefaults` for the given `queryKey`, then the caller's options on
 * top. A no-op if the options are already defaulted (`_defaulted: true`).
 * @param client - The client that owns this operation.
 * @param options - The query options passed by the caller.
 * @returns The defaulted options, with `queryHash` and dependent defaults (e.g.
 * `refetchOnReconnect`) filled in.
 */
export function defaultQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: QueryObserverOptionsBase<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey,
    TPageParam
  >,
): DefaultedQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey,
  TPageParam
> {
  if (options._defaulted) {
    return options as DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >
  }

  const queryDefaults = getQueryDefaults(client, options.queryKey)
  const defaultedOptions = {
    ...client[clientState].defaultOptions.queries,
    ...queryDefaults,
    ...options,
    _defaulted: true,
  }

  if (defaultedOptions.queryFn === defaultQueryFn) {
    defaultedOptions.queryFn =
      'queryFn' in queryDefaults
        ? queryDefaults.queryFn
        : client[clientState].defaultOptions.queries?.queryFn
  }

  if (!defaultedOptions.queryHash) {
    defaultedOptions.queryHash = hashKeyByOptions(
      defaultedOptions.queryKey,
      client[clientState].queryCache.config.queryKey,
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
    TQueryKey,
    TPageParam
  >
}

/**
 * The mutation counterpart of {@link defaultQueryOptions}. Called by framework
 * adapters (e.g. inside `useMutation`) to merge the client's `defaultOptions.mutations`, then
 * `setMutationDefaults` for the given `mutationKey`, then the caller's options on
 * top. A no-op if the options are already defaulted (`_defaulted: true`).
 * @param client - The client that owns this operation.
 * @param options - The mutation options passed by the caller.
 * @returns The defaulted options.
 */
export function defaultMutationOptions<
  T extends MutationOptions<any, any, any, any>,
>(client: QueryClient, options?: T): T {
  if (options?._defaulted) {
    return options
  }
  return {
    ...client[clientState].defaultOptions.mutations,
    ...(options?.mutationKey &&
      getMutationDefaults(client, options.mutationKey)),
    ...options,
    _defaulted: true,
  } as T
}

/**
 * Clears both the query cache and the mutation cache this client is connected to.
 * This clears their garbage collection timers and cancels in-flight query fetches.
 * Running mutations continue to execute.
 * @param client - The client that owns this operation.
 * @example
 * ```ts
 * import { QueryClient, clearQueryClient } from '@tanstack/query-core-pluggable'
 *
 * const queryClient = new QueryClient()
 * clearQueryClient(queryClient)
 * ```
 */
export function clearQueryClient(client: QueryClient): void {
  clearQueryCache(client[clientState].queryCache)
  client[mutationCacheKey]?.clear()
}
