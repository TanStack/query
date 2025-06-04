import { nextTick, ref } from 'vue-demi'
import { QueryClient as QC } from '@tanstack/query-core'
import { cloneDeepUnref } from './utils'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import type { UseQueryOptions } from './useQuery'
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
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationFilters,
  MutationKey,
  MutationObserverOptions,
  NoInfer,
  OmitKeyof,
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

export class QueryClient extends QC {
  constructor(config: QueryClientConfig = {}) {
    const vueQueryConfig = {
      defaultOptions: config.defaultOptions,
      queryCache: config.queryCache || new QueryCache(),
      mutationCache: config.mutationCache || new MutationCache(),
    }
    super(vueQueryConfig)
  }

  isRestoring?: Ref<boolean> = ref(false)

  isFetching(filters: MaybeRefDeep<QueryFilters> = {}): number {
    return super.isFetching(cloneDeepUnref(filters))
  }

  isMutating(filters: MaybeRefDeep<MutationFilters> = {}): number {
    return super.isMutating(cloneDeepUnref(filters))
  }

  getQueryData<TData = unknown, TTaggedQueryKey extends QueryKey = QueryKey>(
    queryKey: TTaggedQueryKey,
  ): InferDataFromTag<TData, TTaggedQueryKey> | undefined
  getQueryData<TData = unknown>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): TData | undefined
  getQueryData<TData = unknown>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): TData | undefined {
    return super.getQueryData(cloneDeepUnref(queryKey))
  }

  ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData>
  ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData>
  ensureQueryData<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData> {
    return super.ensureQueryData(cloneDeepUnref(options))
  }

  getQueriesData<TData = unknown>(
    filters: MaybeRefDeep<QueryFilters>,
  ): Array<[QueryKey, TData | undefined]> {
    return super.getQueriesData(cloneDeepUnref(filters))
  }

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
    options?: MaybeRefDeep<SetDataOptions>,
  ): NoInfer<TInferredQueryFnData> | undefined
  setQueryData<TQueryFnData, TData = NoUnknown<TQueryFnData>>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<NoInfer<TData> | undefined, NoInfer<TData> | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): NoInfer<TData> | undefined
  setQueryData<TData>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<TData | undefined, TData | undefined>,
    options: MaybeRefDeep<SetDataOptions> = {},
  ): NoInfer<TData> | undefined {
    return super.setQueryData(
      cloneDeepUnref(queryKey),
      updater,
      cloneDeepUnref(options),
    )
  }

  setQueriesData<TData>(
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

  getQueryState<TData = unknown, TError = DefaultError>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): QueryState<TData, TError> | undefined {
    return super.getQueryState(cloneDeepUnref(queryKey))
  }

  removeQueries<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(filters?: QueryFilters<TTaggedQueryKey>): void
  removeQueries(filters: MaybeRefDeep<QueryFilters> = {}): void {
    return super.removeQueries(cloneDeepUnref(filters))
  }

  resetQueries<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<ResetOptions>,
  ): Promise<void>
  resetQueries(
    filters: MaybeRefDeep<QueryFilters> = {},
    options: MaybeRefDeep<ResetOptions> = {},
  ): Promise<void> {
    return super.resetQueries(cloneDeepUnref(filters), cloneDeepUnref(options))
  }

  cancelQueries<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<CancelOptions>,
  ): Promise<void>
  cancelQueries(
    filters: MaybeRefDeep<QueryFilters> = {},
    options: MaybeRefDeep<CancelOptions> = {},
  ): Promise<void> {
    return super.cancelQueries(cloneDeepUnref(filters), cloneDeepUnref(options))
  }

  invalidateQueries<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    filters?: InvalidateQueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<InvalidateOptions>,
  ): Promise<void>
  invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters: MaybeRefDeep<InvalidateQueryFilters<TTaggedQueryKey>> = {},
    options: MaybeRefDeep<InvalidateOptions> = {},
  ): Promise<void> {
    const filtersCloned = cloneDeepUnref(filters)
    const optionsCloned = cloneDeepUnref(options)

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

  refetchQueries<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    filters?: RefetchQueryFilters<TTaggedQueryKey>,
    options?: MaybeRefDeep<RefetchOptions>,
  ): Promise<void>
  refetchQueries(
    filters: MaybeRefDeep<RefetchQueryFilters> = {},
    options: MaybeRefDeep<RefetchOptions> = {},
  ): Promise<void> {
    return super.refetchQueries(
      cloneDeepUnref(filters),
      cloneDeepUnref(options),
    )
  }

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
  ): Promise<TData>
  fetchQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>
    >,
  ): Promise<TData>
  fetchQuery<
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
    return super.fetchQuery(cloneDeepUnref(options))
  }

  prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void> {
    return super.prefetchQuery(cloneDeepUnref(options))
  }

  fetchInfiniteQuery<
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
  fetchInfiniteQuery<
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
  fetchInfiniteQuery<
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
    return super.fetchInfiniteQuery(cloneDeepUnref(options))
  }

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
  ): Promise<void>
  prefetchInfiniteQuery<
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
  prefetchInfiniteQuery<
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
    return super.prefetchInfiniteQuery(cloneDeepUnref(options))
  }

  setDefaultOptions(options: MaybeRefDeep<DefaultOptions>): void {
    super.setDefaultOptions(cloneDeepUnref(options))
  }

  setQueryDefaults<
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

  getQueryDefaults(
    queryKey: MaybeRefDeep<QueryKey>,
  ): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'> {
    return super.getQueryDefaults(cloneDeepUnref(queryKey))
  }

  setMutationDefaults<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
  >(
    mutationKey: MaybeRefDeep<MutationKey>,
    options: MaybeRefDeep<
      MutationObserverOptions<TData, TError, TVariables, TContext>
    >,
  ): void {
    super.setMutationDefaults(
      cloneDeepUnref(mutationKey),
      cloneDeepUnref(options),
    )
  }

  getMutationDefaults(
    mutationKey: MaybeRefDeep<MutationKey>,
  ): MutationObserverOptions<any, any, any, any> {
    return super.getMutationDefaults(cloneDeepUnref(mutationKey))
  }
}
