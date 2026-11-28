import {
  QueryClient as QC,
  cancelQueries as coreCancelQueries,
  countFetchingQueries as coreCountFetchingQueries,
  getMutationDefaults as coreGetMutationDefaults,
  getQueriesData as coreGetQueriesData,
  getQueryData as coreGetQueryData,
  getQueryDefaults as coreGetQueryDefaults,
  getQueryState as coreGetQueryState,
  infiniteQuery as coreInfiniteQuery,
  invalidateQueries as coreInvalidateQueries,
  isMutating as coreIsMutating,
  query as coreQuery,
  refetchQueries as coreRefetchQueries,
  removeQueries as coreRemoveQueries,
  resetQueries as coreResetQueries,
  setDefaultOptions as coreSetDefaultOptions,
  setMutationDefaults as coreSetMutationDefaults,
  setQueriesData as coreSetQueriesData,
  setQueryData as coreSetQueryData,
  setQueryDefaults as coreSetQueryDefaults,
} from '@tanstack/query-core'
import { nextTick, ref } from 'vue'
import { cloneDeepUnref } from './utils'
import type {
  CancelOptions,
  DefaultError,
  DefaultOptions,
  InferDataFromTag,
  InferErrorFromTag,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationFilters,
  MutationKey,
  MutationObserverOptions,
  QueryExecuteOptions,
  QueryFilters,
  QueryKey,
  QueryState,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  SkipToken,
  Updater,
} from '@tanstack/query-core'
import type { Ref } from 'vue'
import type { UseQueryOptions } from './queryOptions'
import type {
  MaybeRef,
  MaybeRefDeep,
  MaybeRefOrGetter,
  NoUnknown,
  QueryClientConfig,
} from './types'

type WithoutSkipToken<T extends { queryFn?: unknown }> = Omit<T, 'queryFn'> & {
  queryFn?: Exclude<T['queryFn'], SkipToken>
}

type VueQueryExecutionOptions<
  TOptions extends { queryKey: unknown },
  TAllowSkipToken extends boolean = true,
> = MaybeRef<{
  [Property in keyof TOptions]: Property extends 'queryFn'
    ? MaybeRefDeep<
        TAllowSkipToken extends true
          ? TOptions[Property] | symbol
          : Exclude<TOptions[Property], SkipToken>
      >
    : Property extends 'queryKey'
      ? MaybeRefOrGetter<MaybeRefDeep<TOptions[Property]>>
      : MaybeRefDeep<TOptions[Property]>
}>

/** Holds the query caches and tracks whether the Vue provider is restoring them. */
export class QueryClient extends QC {
  constructor(config: QueryClientConfig = {}) {
    super(config)
  }
  isRestoring?: Ref<boolean> = ref(false)
}

/**
 * Counts fetching queries after unwrapping reactive filters. Omitting filters counts all fetching queries.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @returns The number of matching fetching queries.
 */
export function countFetchingQueries(
  client: QueryClient,
  filters: MaybeRefDeep<Omit<QueryFilters, 'fetchStatus'>> = {},
): number {
  return coreCountFetchingQueries(client, cloneDeepUnref(filters))
}

/**
 * Counts pending mutations matching the reactive filters. Omitting filters counts all pending mutations.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @returns The number of matching pending mutations.
 */
export function isMutating(
  client: QueryClient,
  filters: MaybeRefDeep<Omit<MutationFilters, 'status'>> = {},
): number {
  return coreIsMutating(client, cloneDeepUnref(filters))
}

/**
 * Reads cached data for a reactive query key. Returns undefined if the cache has no data.
 * @param client - The client that owns the cache and configuration.
 * @param queryKey - The reactive key identifying the query.
 * @returns The cached data, or undefined if the key has no data.
 */
export function getQueryData<
  TData = unknown,
  TTaggedQueryKey extends QueryKey = QueryKey,
>(
  client: QueryClient,
  queryKey: TTaggedQueryKey,
): InferDataFromTag<TData, TTaggedQueryKey> | undefined

export function getQueryData<TData = unknown>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
): TData | undefined

export function getQueryData<TData = unknown>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
): TData | undefined {
  return coreGetQueryData(client, cloneDeepUnref(queryKey))
}

/**
 * Returns key and data pairs for all queries matching the unwrapped filters.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @returns The matching key and data pairs.
 */
export function getQueriesData<TData = unknown>(
  client: QueryClient,
  filters: MaybeRefDeep<QueryFilters>,
): Array<[QueryKey, TData | undefined]> {
  return coreGetQueriesData(client, cloneDeepUnref(filters))
}

/**
 * Updates one cache entry synchronously, unwrapping the key and options. Returns the resulting data.
 * @param client - The client that owns the cache and configuration.
 * @param queryKey - The reactive key identifying the query.
 * @param updater - The new data or a function of the previous cached value.
 * @param options - Reactive configuration for this operation.
 * @returns The updated data, or undefined if the update was skipped.
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
  options?: MaybeRefDeep<SetDataOptions>,
): NoInfer<TInferredQueryFnData> | undefined

export function setQueryData<TQueryFnData, TData = NoUnknown<TQueryFnData>>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
  updater: Updater<NoInfer<TData> | undefined, NoInfer<TData> | undefined>,
  options?: MaybeRefDeep<SetDataOptions>,
): NoInfer<TData> | undefined

export function setQueryData<TData>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
  updater: Updater<TData | undefined, TData | undefined>,
  options: MaybeRefDeep<SetDataOptions> = {},
): NoInfer<TData> | undefined {
  return coreSetQueryData<TData>(
    client,
    cloneDeepUnref(queryKey),
    updater,
    cloneDeepUnref(options),
  )
}

/**
 * Applies the updater to each matching cache entry and returns the resulting key and data pairs.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @param updater - The new data or a function of the previous cached value.
 * @param options - Reactive configuration for this operation.
 * @returns The matching key and updated data pairs.
 */
export function setQueriesData<TData>(
  client: QueryClient,
  filters: MaybeRefDeep<QueryFilters>,
  updater: Updater<TData | undefined, TData | undefined>,
  options: MaybeRefDeep<SetDataOptions> = {},
): Array<[QueryKey, TData | undefined]> {
  return coreSetQueriesData(
    client,
    cloneDeepUnref(filters),
    updater,
    cloneDeepUnref(options),
  )
}

/**
 * Reads the current cache state for a reactive query key. Returns undefined if the query is absent.
 * @param client - The client that owns the cache and configuration.
 * @param queryKey - The reactive key identifying the query.
 * @returns The cached state, or undefined if the query does not exist.
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
): QueryState<TInferredQueryFnData, TInferredError> | undefined

export function getQueryState<TData = unknown, TError = DefaultError>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
): QueryState<TData, TError> | undefined

export function getQueryState<TData = unknown, TError = DefaultError>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
): QueryState<TData, TError> | undefined {
  return coreGetQueryState(client, cloneDeepUnref(queryKey))
}

/**
 * Removes cached queries that match the unwrapped filters.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 */
export function removeQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: QueryFilters<TTaggedQueryKey>,
): void

export function removeQueries(
  client: QueryClient,
  filters: MaybeRefDeep<QueryFilters> = {},
): void {
  return coreRemoveQueries(client, cloneDeepUnref(filters))
}

/**
 * Resets matching queries to their initial state and waits for active queries to refetch.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @param options - Reactive configuration for this operation.
 * @returns A promise that settles when the refetches finish.
 */
export function resetQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: QueryFilters<TTaggedQueryKey>,
  options?: MaybeRefDeep<ResetOptions>,
): Promise<void>

export function resetQueries(
  client: QueryClient,
  filters: MaybeRefDeep<QueryFilters> = {},
  options: MaybeRefDeep<ResetOptions> = {},
): Promise<void> {
  return coreResetQueries(
    client,
    cloneDeepUnref(filters),
    cloneDeepUnref(options),
  )
}

/**
 * Cancels queries that match the reactive filters and waits for cancellation.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @param options - Reactive configuration for this operation.
 * @returns A promise that settles after cancellation.
 */
export function cancelQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: QueryFilters<TTaggedQueryKey>,
  options?: MaybeRefDeep<CancelOptions>,
): Promise<void>

export function cancelQueries(
  client: QueryClient,
  filters: MaybeRefDeep<QueryFilters> = {},
  options: MaybeRefDeep<CancelOptions> = {},
): Promise<void> {
  return coreCancelQueries(
    client,
    cloneDeepUnref(filters),
    cloneDeepUnref(options),
  )
}

/**
 * Invalidates matching queries immediately, then refetches after Vue flushes reactive changes. Pass refetchType 'none' to skip the refetch.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @param options - Reactive configuration for this operation.
 * @returns A promise that settles after any requested refetches.
 */
export function invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?:
    | InvalidateQueryFilters<TTaggedQueryKey>
    | (() => InvalidateQueryFilters<TTaggedQueryKey>),
  options?: MaybeRefDeep<InvalidateOptions>,
): Promise<void>

export function invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters:
    | MaybeRefDeep<InvalidateQueryFilters<TTaggedQueryKey>>
    | (() => InvalidateQueryFilters<TTaggedQueryKey>) = {},
  options: MaybeRefDeep<InvalidateOptions> | (() => InvalidateOptions) = {},
): Promise<void> {
  const filtersCloned = cloneDeepUnref(
    filters as MaybeRefDeep<InvalidateQueryFilters<TTaggedQueryKey>>,
  )
  const optionsCloned = cloneDeepUnref(
    options as MaybeRefDeep<InvalidateOptions>,
  )

  coreInvalidateQueries(
    client,
    { ...filtersCloned, refetchType: 'none' },
    optionsCloned,
  )

  if (filtersCloned.refetchType === 'none') {
    return Promise.resolve()
  }

  const refetchFilters: RefetchQueryFilters<TTaggedQueryKey> = {
    ...filtersCloned,
    type: filtersCloned.refetchType ?? filtersCloned.type ?? 'active',
  }

  // We need to delay `refetchQueries` execution to next macro task for all reactive values to be updated.
  // This ensures that `context` in `queryFn` while `invalidating` along reactive variable change has correct
  return nextTick().then(() => {
    return coreRefetchQueries(client, refetchFilters, optionsCloned)
  })
}

/**
 * Refetches matching queries using the current values of reactive filters and options.
 * @param client - The client that owns the cache and configuration.
 * @param filters - Reactive criteria for matching cache entries.
 * @param options - Reactive configuration for this operation.
 * @returns A promise that settles after the refetches.
 */
export function refetchQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
  client: QueryClient,
  filters?: RefetchQueryFilters<TTaggedQueryKey>,
  options?: MaybeRefDeep<RefetchOptions>,
): Promise<void>

export function refetchQueries(
  client: QueryClient,
  filters: MaybeRefDeep<RefetchQueryFilters> = {},
  options: MaybeRefDeep<RefetchOptions> = {},
): Promise<void> {
  return coreRefetchQueries(
    client,
    cloneDeepUnref(filters),
    cloneDeepUnref(options),
  )
}

/**
 * Reads or fetches query data with the supplied client. Unwrap reactive options before invoking a top-level getter.
 * @param client - The client that owns the cache and configuration.
 * @param options - Reactive configuration for this operation.
 * @returns A promise for the selected query data.
 */
export function query<
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
      TQueryFnData,
      TQueryKey,
      TPageParam
    >
  > &
    ([TQueryData, TQueryFnData] extends [TQueryFnData, TQueryData]
      ? unknown
      : never),
): Promise<TData>

export function query<
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

export function query<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: VueQueryExecutionOptions<
    QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >,
    false
  >,
): Promise<TData>

export function query<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: VueQueryExecutionOptions<
    QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<TData | undefined>

export function query<
  TQueryFnData,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = never,
>(
  client: QueryClient,
  options: VueQueryExecutionOptions<
    QueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<TData | undefined> {
  return coreQuery(
    client,
    cloneDeepUnref(
      options as MaybeRefDeep<
        QueryExecuteOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryData,
          TQueryKey,
          TPageParam
        >
      >,
    ),
  )
}

/**
 * Reads or fetches infinite query pages with the supplied client and unwrapped reactive options.
 * @param client - The client that owns the cache and configuration.
 * @param options - Reactive configuration for this operation.
 * @returns A promise for the selected infinite query data.
 */
export function infiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: WithoutSkipToken<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<
  Array<TData> extends Array<InfiniteData<TQueryFnData>>
    ? InfiniteData<TQueryFnData, TPageParam>
    : TData
>

export function infiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: MaybeRefDeep<
    WithoutSkipToken<
      InfiniteQueryExecuteOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >
  >,
): Promise<
  Array<TData> extends Array<InfiniteData<TQueryFnData>>
    ? InfiniteData<TQueryFnData, TPageParam>
    : TData
>

export function infiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: MaybeRefDeep<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<
  | undefined
  | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData)
>

export function infiniteQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  client: QueryClient,
  options: MaybeRefDeep<
    InfiniteQueryExecuteOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >,
): Promise<
  | undefined
  | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData)
> {
  return coreInfiniteQuery(client, cloneDeepUnref(options))
}

/**
 * Replaces the client's global defaults with the unwrapped options.
 * @param client - The client that owns the cache and configuration.
 * @param options - Reactive configuration for this operation.
 */
export function setDefaultOptions(
  client: QueryClient,
  options: MaybeRefDeep<DefaultOptions>,
): void {
  coreSetDefaultOptions(client, cloneDeepUnref(options))
}

/**
 * Sets defaults for queries matching the reactive key.
 * @param client - The client that owns the cache and configuration.
 * @param queryKey - The reactive key identifying the query.
 * @param options - Reactive configuration for this operation.
 */
export function setQueryDefaults<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
>(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
  options: MaybeRefDeep<
    Partial<
      Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryData>, 'queryKey'>
    >
  >,
): void {
  coreSetQueryDefaults(
    client,
    cloneDeepUnref(queryKey),
    cloneDeepUnref(options),
  )
}

/**
 * Returns the merged defaults that match the unwrapped query key.
 * @param client - The client that owns the cache and configuration.
 * @param queryKey - The reactive key identifying the query.
 * @returns The merged defaults for matching query keys.
 */
export function getQueryDefaults(
  client: QueryClient,
  queryKey: MaybeRefDeep<QueryKey>,
): ReturnType<typeof coreGetQueryDefaults> {
  return coreGetQueryDefaults(client, cloneDeepUnref(queryKey))
}

/**
 * Sets defaults for mutations matching the reactive key.
 * @param client - The client that owns the cache and configuration.
 * @param mutationKey - The reactive key identifying the mutation.
 * @param options - Reactive configuration for this operation.
 */
export function setMutationDefaults<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
>(
  client: QueryClient,
  mutationKey: MaybeRefDeep<MutationKey>,
  options: MaybeRefDeep<
    MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>
  >,
): void {
  coreSetMutationDefaults(
    client,
    cloneDeepUnref(mutationKey),
    cloneDeepUnref(options),
  )
}

/**
 * Returns the merged defaults that match the unwrapped mutation key.
 * @param client - The client that owns the cache and configuration.
 * @param mutationKey - The reactive key identifying the mutation.
 * @returns The merged defaults for matching mutation keys.
 */
export function getMutationDefaults(
  client: QueryClient,
  mutationKey: MaybeRefDeep<MutationKey>,
): MutationObserverOptions<any, any, any, any> {
  return coreGetMutationDefaults(client, cloneDeepUnref(mutationKey))
}
