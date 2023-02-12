import type { QueryFilters, Updater, MutationFilters } from './utils'
import {
  hashKey,
  noop,
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
  QueryKey,
  QueryObserverOptions,
  QueryOptions,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  ResetQueryFilters,
  SetDataOptions,
  RegisteredError,
} from './types'
import type { QueryState } from './query'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import { focusManager } from './focusManager'
import { onlineManager } from './onlineManager'
import { notifyManager } from './notifyManager'
import { infiniteQueryBehavior } from './infiniteQueryBehavior'
import type { CancelOptions, DefaultedQueryObserverOptions } from './types'

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

  mount(): void {
    this.#mountCount++
    if (this.#mountCount !== 1) return

    this.#unsubscribeFocus = focusManager.subscribe(() => {
      if (focusManager.isFocused()) {
        this.resumePausedMutations()
        this.#queryCache.onFocus()
      }
    })
    this.#unsubscribeOnline = onlineManager.subscribe(() => {
      if (onlineManager.isOnline()) {
        this.resumePausedMutations()
        this.#queryCache.onOnline()
      }
    })
  }

  unmount(): void {
    this.#mountCount--
    if (this.#mountCount !== 0) return

    this.#unsubscribeFocus?.()
    this.#unsubscribeFocus = undefined

    this.#unsubscribeOnline?.()
    this.#unsubscribeOnline = undefined
  }

  isFetching(filters?: QueryFilters): number {
    return this.#queryCache.findAll({ ...filters, fetchStatus: 'fetching' })
      .length
  }

  isMutating(filters?: MutationFilters): number {
    return this.#mutationCache.findAll({ ...filters, status: 'loading' }).length
  }

  getQueryData<TQueryFnData = unknown>(
    queryKey: QueryKey,
  ): TQueryFnData | undefined {
    return this.#queryCache.find<TQueryFnData>({ queryKey })?.state.data
  }

  ensureQueryData<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData> {
    const cachedData = this.getQueryData<TData>(options.queryKey)

    return cachedData ? Promise.resolve(cachedData) : this.fetchQuery(options)
  }

  getQueriesData<TQueryFnData = unknown>(
    filters: QueryFilters,
  ): [QueryKey, TQueryFnData | undefined][] {
    return this.getQueryCache()
      .findAll(filters)
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
    const query = this.#queryCache.find<TQueryFnData>({ queryKey })
    const prevData = query?.state.data
    const data = functionalUpdate(updater, prevData)

    if (typeof data === 'undefined') {
      return undefined
    }

    const defaultedOptions = this.defaultQueryOptions<
      any,
      any,
      unknown,
      any,
      QueryKey
    >({ queryKey })

    return this.#queryCache
      .build(this, defaultedOptions)
      .setData(data, { ...options, manual: true })
  }

  setQueriesData<TQueryFnData>(
    filters: QueryFilters,
    updater: Updater<TQueryFnData | undefined, TQueryFnData | undefined>,
    options?: SetDataOptions,
  ): [QueryKey, TQueryFnData | undefined][] {
    return notifyManager.batch(() =>
      this.getQueryCache()
        .findAll(filters)
        .map(({ queryKey }) => [
          queryKey,
          this.setQueryData<TQueryFnData>(queryKey, updater, options),
        ]),
    )
  }

  getQueryState<TQueryFnData = unknown, TError = RegisteredError>(
    queryKey: QueryKey,
  ): QueryState<TQueryFnData, TError> | undefined {
    return this.#queryCache.find<TQueryFnData, TError>({ queryKey })?.state
  }

  removeQueries(filters?: QueryFilters): void {
    const queryCache = this.#queryCache
    notifyManager.batch(() => {
      queryCache.findAll(filters).forEach((query) => {
        queryCache.remove(query)
      })
    })
  }

  resetQueries<TPageData = unknown>(
    filters?: ResetQueryFilters<TPageData>,
    options?: ResetOptions,
  ): Promise<void> {
    const queryCache = this.#queryCache

    const refetchFilters: RefetchQueryFilters<TPageData> = {
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

  cancelQueries(
    filters: QueryFilters = {},
    cancelOptions: CancelOptions = {},
  ): Promise<void> {
    if (typeof cancelOptions.revert === 'undefined') {
      cancelOptions.revert = true
    }

    const promises = notifyManager.batch(() =>
      this.#queryCache
        .findAll(filters)
        .map((query) => query.cancel(cancelOptions)),
    )

    return Promise.all(promises).then(noop).catch(noop)
  }

  invalidateQueries<TPageData = unknown>(
    filters: InvalidateQueryFilters<TPageData> = {},
    options: InvalidateOptions = {},
  ): Promise<void> {
    return notifyManager.batch(() => {
      this.#queryCache.findAll(filters).forEach((query) => {
        query.invalidate()
      })

      if (filters.refetchType === 'none') {
        return Promise.resolve()
      }
      const refetchFilters: RefetchQueryFilters<TPageData> = {
        ...filters,
        type: filters.refetchType ?? filters.type ?? 'active',
      }
      return this.refetchQueries(refetchFilters, options)
    })
  }

  refetchQueries<TPageData = unknown>(
    filters: RefetchQueryFilters<TPageData> = {},
    options?: RefetchOptions,
  ): Promise<void> {
    const promises = notifyManager.batch(() =>
      this.#queryCache
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
    TQueryFnData,
    TError = RegisteredError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData> {
    const defaultedOptions = this.defaultQueryOptions(options)

    // https://github.com/tannerlinsley/react-query/issues/652
    if (typeof defaultedOptions.retry === 'undefined') {
      defaultedOptions.retry = false
    }

    const query = this.#queryCache.build(this, defaultedOptions)

    return query.isStaleByTime(defaultedOptions.staleTime)
      ? query.fetch(defaultedOptions)
      : Promise.resolve(query.state.data as TData)
  }

  prefetchQuery<
    TQueryFnData = unknown,
    TError = RegisteredError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void> {
    return this.fetchQuery(options).then(noop).catch(noop)
  }

  fetchInfiniteQuery<
    TQueryFnData,
    TError = RegisteredError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<InfiniteData<TData>> {
    options.behavior = infiniteQueryBehavior<TQueryFnData, TError, TData>()
    return this.fetchQuery(options)
  }

  prefetchInfiniteQuery<
    TQueryFnData,
    TError = RegisteredError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void> {
    return this.fetchInfiniteQuery(options).then(noop).catch(noop)
  }

  resumePausedMutations(): Promise<unknown> {
    return this.#mutationCache.resumePausedMutations()
  }

  getQueryCache(): QueryCache {
    return this.#queryCache
  }

  getMutationCache(): MutationCache {
    return this.#mutationCache
  }

  getDefaultOptions(): DefaultOptions {
    return this.#defaultOptions
  }

  setDefaultOptions(options: DefaultOptions): void {
    this.#defaultOptions = options
  }

  setQueryDefaults(
    queryKey: QueryKey,
    options: Partial<
      Omit<QueryObserverOptions<unknown, any, any, any>, 'queryKey'>
    >,
  ): void {
    this.#queryDefaults.set(hashKey(queryKey), {
      queryKey,
      defaultOptions: options,
    })
  }

  getQueryDefaults(
    queryKey: QueryKey,
  ): QueryObserverOptions<any, any, any, any, any> {
    const defaults = [...this.#queryDefaults.values()]

    let result: QueryObserverOptions<any, any, any, any, any> = {}

    defaults.forEach((queryDefault) => {
      if (partialMatchKey(queryKey, queryDefault.queryKey)) {
        result = { ...result, ...queryDefault.defaultOptions }
      }
    })
    return result
  }

  setMutationDefaults(
    mutationKey: MutationKey,
    options: Omit<MutationObserverOptions<any, any, any, any>, 'mutationKey'>,
  ): void {
    this.#mutationDefaults.set(hashKey(mutationKey), {
      mutationKey,
      defaultOptions: options,
    })
  }

  getMutationDefaults(
    mutationKey: MutationKey,
  ): MutationObserverOptions<any, any, any, any> {
    const defaults = [...this.#mutationDefaults.values()]

    let result: MutationObserverOptions<any, any, any, any> = {}

    defaults.forEach((queryDefault) => {
      if (partialMatchKey(mutationKey, queryDefault.mutationKey)) {
        result = { ...result, ...queryDefault.defaultOptions }
      }
    })

    return result
  }

  defaultQueryOptions<
    TQueryFnData = unknown,
    TError = RegisteredError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
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
      ...this.#defaultOptions.queries,
      ...(options?.queryKey && this.getQueryDefaults(options.queryKey)),
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
    if (typeof defaultedOptions.refetchOnReconnect === 'undefined') {
      defaultedOptions.refetchOnReconnect =
        defaultedOptions.networkMode !== 'always'
    }
    if (typeof defaultedOptions.throwErrors === 'undefined') {
      defaultedOptions.throwErrors = !!defaultedOptions.suspense
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
      ...this.#defaultOptions.mutations,
      ...(options?.mutationKey &&
        this.getMutationDefaults(options.mutationKey)),
      ...options,
      _defaulted: true,
    } as T
  }

  clear(): void {
    this.#queryCache.clear()
    this.#mutationCache.clear()
  }
}
