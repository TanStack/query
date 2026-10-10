import { nextTick, ref } from 'vue-demi'
import { QueryClient as QC } from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import type { UseQueryOptions } from './queryOptions'
import type { Ref } from 'vue-demi'
import type { MaybeRefDeep, NoUnknown, QueryClientConfig } from './types'
import type {
  CancelOptions,
  DefaultError,
  DefaultOptions,
  EnsureQueryDataOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InferDataFromTag,
  InferErrorFromTag,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationFilters,
  MutationKey,
  MutationObserverOptions,
  OmitKeyof,
  QueryExecuteOptions,
  QueryFilters,
  QueryKey,
  QueryObserverOptions,
  QueryState,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  Updater,
} from '@tanstack/query-core'

/**
 * Vue-aware subclass of `@tanstack/query-core`'s `QueryClient`. Methods that accept `options` (such as
 * `CancelOptions` or `InvalidateOptions`) or filters (such as the `QueryFilters` accepted by
 * `invalidateQueries`) also accept a {@link MaybeRefDeep} version of it, so you can pass `ref`s directly
 * without unwrapping them yourself — e.g. `queryClient.invalidateQueries({ queryKey: ['post', myRef] })`.
 *
 * `ref` entries in a `queryKey` are unwrapped this way on every method, but reactive getter entries
 * (`() => id.value`) are only unwrapped when the `queryKey` is passed as a `queryKey` property of a
 * filters/options object (e.g. `invalidateQueries({ queryKey: ['post', idGetter] })`) — methods like
 * `getQueryData` that take the `queryKey` array as their own argument do not unwrap getter entries there,
 * and the getter function itself ends up in the cache key.
 *
 * Install one on your app with `VueQueryPlugin`, or retrieve it with `useQueryClient`.
 */
export class QueryClient extends QC {
  constructor(config: QueryClientConfig = {}) {
    const vueQueryConfig = {
      defaultOptions: config.defaultOptions,
      queryCache: config.queryCache || new QueryCache(),
      mutationCache: config.mutationCache || new MutationCache(),
    }
    super(vueQueryConfig)
  }

  /**
   * `true` while a `clientPersister` passed to `VueQueryPlugin` is restoring the cache. Queries don't fetch
   * while this is `true`. Defaults to `false` if no persister is configured.
   */
  isRestoring?: Ref<boolean> = ref(false)

  override isFetching(filters: MaybeRefDeep<QueryFilters> = {}): number {
    return super.isFetching(cloneDeepUnref(filters))
  }

  override isMutating(filters: MaybeRefDeep<MutationFilters> = {}): number {
    return super.isMutating(cloneDeepUnref(filters))
  }

  override getQueryData<
    TData = unknown,
    TTaggedQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: TTaggedQueryKey,
  ): InferDataFromTag<TData, TTaggedQueryKey> | undefined
  override getQueryData<TData = unknown>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): TData | undefined
  override getQueryData<TData = unknown>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): TData | undefined {
    return super.getQueryData(cloneDeepUnref(queryKey))
  }

  /**
   * @deprecated Use queryClient.query({ ...options, staleTime: 'static' }) instead. This method will be removed in the next major version.
   */
  override ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData>
  override ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData>
  override ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData> {
    // oxlint-disable-next-line tanstack-query/no-restricted-syntax -- grandfathered deprecated wrapper implementation
    return super.ensureQueryData(cloneDeepUnref(options))
  }

  override getQueriesData<TData = unknown>(
    filters: MaybeRefDeep<QueryFilters>,
  ): Array<[QueryKey, TData | undefined]> {
    return super.getQueriesData(cloneDeepUnref(filters))
  }

  override setQueryData<
    TQueryFnData = unknown,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
    updater: Updater<
      NoInfer<TInferredQueryFnData> | undefined,
      NoInfer<TInferredQueryFnData> | undefined
    >,
    options?: MaybeRefDeep<SetDataOptions>,
  ): NoInfer<TInferredQueryFnData> | undefined
  override setQueryData<TQueryFnData, TData = NoUnknown<TQueryFnData>>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<NoInfer<TData> | undefined, NoInfer<TData> | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): NoInfer<TData> | undefined
  override setQueryData<TData>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<TData | undefined, TData | undefined>,
    options: MaybeRefDeep<SetDataOptions> = {},
  ): NoInfer<TData> | undefined {
    return super.setQueryData<TData>(
      cloneDeepUnref(queryKey),
      updater,
      cloneDeepUnref(options),
    )
  }

  override setQueriesData<TData>(
    filters: MaybeRefDeep<QueryFilters>,
    updater: Updater<TData | undefined, TData | undefined>,
    options: MaybeRefDeep<SetDataOptions> = {},
  ): Array<[QueryKey, TData | undefined]> {
    return super.setQueriesData(
      cloneDeepUnref(filters),
      updater,
      cloneDeepUnref(options),
    )
  }

  override getQueryState<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
  ): QueryState<TInferredQueryFnData, TInferredError> | undefined
  override getQueryState<TData = unknown, TError = DefaultError>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): QueryState<TData, TError> | undefined
  override getQueryState<TData = unknown, TError = DefaultError>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): QueryState<TData, TError> | undefined {
    return super.getQueryState(cloneDeepUnref(queryKey))
  }

  override removeQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
  ): void
  override removeQueries(filters: MaybeRefDeep<QueryFilters> = {}): void {
    return super.removeQueries(cloneDeepUnref(filters))
  }

  override resetQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<ResetOptions>,
  ): Promise<void>
  override resetQueries(
    filters: MaybeRefDeep<QueryFilters> = {},
    options: MaybeRefDeep<ResetOptions> = {},
  ): Promise<void> {
    return super.resetQueries(cloneDeepUnref(filters), cloneDeepUnref(options))
  }

  override cancelQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<CancelOptions>,
  ): Promise<void>
  override cancelQueries(
    filters: MaybeRefDeep<QueryFilters> = {},
    options: MaybeRefDeep<CancelOptions> = {},
  ): Promise<void> {
    return super.cancelQueries(cloneDeepUnref(filters), cloneDeepUnref(options))
  }

  override invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?:
      | InvalidateQueryFilters<TTaggedQueryKey>
      | (() => InvalidateQueryFilters<TTaggedQueryKey>),
    options?: MaybeRefDeep<InvalidateOptions>,
  ): Promise<void>
  override invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
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

    super.invalidateQueries(
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

    // (dosipiuk): We need to delay `refetchQueries` execution to next macro task for all reactive values to be updated.
    // This ensures that `context` in `queryFn` while `invalidating` along reactive variable change has correct
    return nextTick().then(() => {
      return super.refetchQueries(refetchFilters, optionsCloned)
    })
  }

  override refetchQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: RefetchQueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<RefetchOptions>,
  ): Promise<void>
  override refetchQueries(
    filters: MaybeRefDeep<RefetchQueryFilters> = {},
    options: MaybeRefDeep<RefetchOptions> = {},
  ): Promise<void> {
    return super.refetchQueries(
      cloneDeepUnref(filters),
      cloneDeepUnref(options),
    )
  }

  // These one-shot imperative methods do not resolve top-level option getters.
  // Resolve getters explicitly before calling, e.g. queryClient.query(options()).
  override query<
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
  ): Promise<TData>
  override query<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: MaybeRefDeep<
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
  override query<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: MaybeRefDeep<
      QueryExecuteOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey,
        TPageParam
      >
    >,
  ): Promise<TData> {
    return super.query(cloneDeepUnref(options))
  }

  /**
   * @deprecated Use queryClient.query(options) instead. This method will be removed in the next major version.
   */
  override fetchQuery<
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
  ): Promise<TData>
  override fetchQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options:
      | MaybeRefDeep<
          FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
        >
      | (() => FetchQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey,
          TPageParam
        >),
  ): Promise<TData>
  override fetchQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
    >,
  ): Promise<TData> {
    // oxlint-disable-next-line tanstack-query/no-restricted-syntax -- grandfathered deprecated wrapper implementation
    return super.fetchQuery(cloneDeepUnref(options))
  }

  /**
   * @deprecated Use queryClient.query(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.
   */
  override prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  override prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  override prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void> {
    // oxlint-disable-next-line tanstack-query/no-restricted-syntax -- grandfathered deprecated wrapper implementation
    return super.prefetchQuery(cloneDeepUnref(options))
  }

  // These one-shot imperative methods do not resolve top-level option getters.
  // Resolve getters explicitly before calling, e.g. queryClient.infiniteQuery(options()).
  override infiniteQuery<
    TQueryFnData = unknown,
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
  >
  override infiniteQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
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
    Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData
  >
  override infiniteQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
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
    Array<TData> extends Array<InfiniteData<TQueryFnData>>
      ? InfiniteData<TQueryFnData, TPageParam>
      : TData
  > {
    return super.infiniteQuery(cloneDeepUnref(options))
  }

  /**
   * @deprecated Use queryClient.infiniteQuery(options) instead. This method will be removed in the next major version.
   */
  override fetchInfiniteQuery<
    TQueryFnData = unknown,
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
  ): Promise<InfiniteData<TData, TPageParam>>
  override fetchInfiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >,
  ): Promise<InfiniteData<TData, TPageParam>>
  override fetchInfiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >,
  ): Promise<InfiniteData<TData, TPageParam>> {
    // oxlint-disable-next-line tanstack-query/no-restricted-syntax -- grandfathered deprecated wrapper implementation
    return super.fetchInfiniteQuery(cloneDeepUnref(options))
  }

  /**
   * @deprecated use void queryClient.infiniteQuery(options) instead. You can swallow errors with `.catch(noop)`. This method will be removed in the next major version.
   */
  override prefetchInfiniteQuery<
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
  ): Promise<void>
  override prefetchInfiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >,
  ): Promise<void>
  override prefetchInfiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam
      >
    >,
  ): Promise<void> {
    // oxlint-disable-next-line tanstack-query/no-restricted-syntax -- grandfathered deprecated wrapper implementation
    return super.prefetchInfiniteQuery(cloneDeepUnref(options))
  }

  override setDefaultOptions(options: MaybeRefDeep<DefaultOptions>): void {
    super.setDefaultOptions(cloneDeepUnref(options))
  }

  override setQueryDefaults<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
  >(
    queryKey: MaybeRefDeep<QueryKey>,
    options: MaybeRefDeep<
      Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryData>, 'queryKey'>
    >,
  ): void {
    super.setQueryDefaults(cloneDeepUnref(queryKey), cloneDeepUnref(options))
  }

  override getQueryDefaults(
    queryKey: MaybeRefDeep<QueryKey>,
  ): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'> {
    return super.getQueryDefaults(cloneDeepUnref(queryKey))
  }

  override setMutationDefaults<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TOnMutateResult = unknown,
  >(
    mutationKey: MaybeRefDeep<MutationKey>,
    options: MaybeRefDeep<
      MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>
    >,
  ): void {
    super.setMutationDefaults(
      cloneDeepUnref(mutationKey),
      cloneDeepUnref(options),
    )
  }

  override getMutationDefaults(
    mutationKey: MaybeRefDeep<MutationKey>,
  ): MutationObserverOptions<any, any, any, any> {
    return super.getMutationDefaults(cloneDeepUnref(mutationKey))
  }
}
