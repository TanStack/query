import { ref } from 'vue-demi'
import { QueryClient as QC } from '@tanstack/query-core'
import type {
  QueryKey,
  QueryClientConfig,
  SetDataOptions,
  ResetQueryFilters,
  ResetOptions,
  CancelOptions,
  InvalidateQueryFilters,
  InvalidateOptions,
  RefetchQueryFilters,
  RefetchOptions,
  FetchQueryOptions,
  FetchInfiniteQueryOptions,
  InfiniteData,
  DefaultOptions,
  QueryObserverOptions,
  MutationKey,
  MutationObserverOptions,
  QueryFilters,
  MutationFilters,
  QueryState,
  Updater,
  WithRequired,
} from '@tanstack/query-core'
import type { MaybeRefDeep } from './types'
import { cloneDeepUnref } from './utils'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'

export class QueryClient extends QC {
  constructor(config: MaybeRefDeep<QueryClientConfig> = {}) {
    const unreffedConfig = cloneDeepUnref(config) as QueryClientConfig
    const vueQueryConfig: QueryClientConfig = {
      logger: cloneDeepUnref(unreffedConfig.logger),
      defaultOptions: cloneDeepUnref(unreffedConfig.defaultOptions),
      queryCache: unreffedConfig.queryCache || new QueryCache(),
      mutationCache: unreffedConfig.mutationCache || new MutationCache(),
    }
    super(vueQueryConfig)
  }

  isRestoring = ref(false)

  isFetching(filters?: MaybeRefDeep<QueryFilters>): number {
    const filtersUnreffed = cloneDeepUnref(filters) as QueryFilters
    return super.isFetching(filtersUnreffed)
  }

  isMutating(filters?: MaybeRefDeep<MutationFilters>): number {
    return super.isMutating(cloneDeepUnref(filters) as MutationFilters)
  }

  getQueryData<TData = unknown>(
    filters?: MaybeRefDeep<WithRequired<QueryFilters, 'queryKey'>>,
  ): TData | undefined {
    return super.getQueryData(
      cloneDeepUnref(filters) as WithRequired<QueryFilters, 'queryKey'>,
    )
  }

  getQueriesData<TData = unknown>(
    filters: MaybeRefDeep<QueryFilters>,
  ): [QueryKey, TData | undefined][] {
    const unreffed = cloneDeepUnref(filters) as QueryFilters
    return super.getQueriesData(unreffed)
  }

  setQueryData<TData>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<TData | undefined, TData | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): TData | undefined {
    return super.setQueryData(
      cloneDeepUnref(queryKey) as QueryKey,
      updater,
      cloneDeepUnref(options) as SetDataOptions,
    )
  }

  setQueriesData<TData>(
    filters: MaybeRefDeep<QueryFilters>,
    updater: Updater<TData | undefined, TData | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): [QueryKey, TData | undefined][] {
    const filtersUnreffed = cloneDeepUnref(filters) as QueryFilters
    const optionsUnreffed = cloneDeepUnref(options) as SetDataOptions

    return super.setQueriesData(filtersUnreffed, updater, optionsUnreffed)
  }

  getQueryState<TData = unknown, TError = undefined>(
    filters: MaybeRefDeep<WithRequired<QueryFilters, 'queryKey'>>,
  ): QueryState<TData, TError> | undefined {
    return super.getQueryState(
      cloneDeepUnref(filters) as WithRequired<QueryFilters, 'queryKey'>,
    )
  }

  removeQueries(filters?: MaybeRefDeep<QueryFilters>): void {
    const filtersUnreffed = cloneDeepUnref(filters) as QueryFilters
    return super.removeQueries(filtersUnreffed)
  }

  resetQueries<TPageData = unknown>(
    filters?: MaybeRefDeep<ResetQueryFilters<TPageData>>,
    options?: MaybeRefDeep<ResetOptions>,
  ): Promise<void> {
    const filtersUnreffed = cloneDeepUnref(filters) as ResetQueryFilters
    const optionsUnreffed = cloneDeepUnref(options) as ResetOptions

    return super.resetQueries(filtersUnreffed, optionsUnreffed)
  }

  cancelQueries(
    filters?: MaybeRefDeep<QueryFilters>,
    options?: MaybeRefDeep<CancelOptions>,
  ): Promise<void> {
    const filtersUnreffed = cloneDeepUnref(filters) as QueryFilters
    const optionsUnreffed = cloneDeepUnref(options) as CancelOptions
    return super.cancelQueries(filtersUnreffed, optionsUnreffed)
  }

  invalidateQueries<TPageData = unknown>(
    filters?: MaybeRefDeep<InvalidateQueryFilters<TPageData>>,
    options?: MaybeRefDeep<InvalidateOptions>,
  ): Promise<void> {
    const filtersUnreffed = cloneDeepUnref(
      filters,
    ) as InvalidateQueryFilters<TPageData>
    const optionsUnreffed = cloneDeepUnref(options) as InvalidateOptions

    return super.invalidateQueries(filtersUnreffed, optionsUnreffed)
  }

  refetchQueries<TPageData = unknown>(
    filters?: MaybeRefDeep<RefetchQueryFilters<TPageData>>,
    options?: MaybeRefDeep<RefetchOptions>,
  ): Promise<void> {
    const filtersUnreffed = cloneDeepUnref(
      filters,
    ) as RefetchQueryFilters<TPageData>
    const optionsUnreffed = cloneDeepUnref(options) as RefetchOptions

    return super.refetchQueries(filtersUnreffed, optionsUnreffed)
  }

  fetchQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData> {
    const optionsUnreffed = cloneDeepUnref(options) as FetchQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >

    return super.fetchQuery(optionsUnreffed)
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
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void> {
    const optionsUnreffed = cloneDeepUnref(options) as FetchQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey
    >
    return super.prefetchQuery(optionsUnreffed)
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
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<InfiniteData<TData>> {
    const optionsUnreffed = cloneDeepUnref(
      options,
    ) as FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>

    return super.fetchInfiniteQuery(optionsUnreffed)
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
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void> {
    const optionsUnreffed = cloneDeepUnref(
      options,
    ) as FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    return super.prefetchInfiniteQuery(optionsUnreffed)
  }

  setDefaultOptions(options: MaybeRefDeep<DefaultOptions>): void {
    super.setDefaultOptions(cloneDeepUnref(options) as DefaultOptions)
  }

  setQueryDefaults(
    options: MaybeRefDeep<
      WithRequired<QueryObserverOptions<unknown, any, any, any>, 'queryKey'>
    >,
  ): void {
    const optionsUnreffed = cloneDeepUnref(options) as WithRequired<
      QueryObserverOptions<unknown, any, any, any>,
      'queryKey'
    >
    super.setQueryDefaults(optionsUnreffed)
  }

  getQueryDefaults(
    queryKey?: MaybeRefDeep<QueryKey>,
  ): QueryObserverOptions<any, any, any, any, any> | undefined {
    return super.getQueryDefaults(cloneDeepUnref(queryKey))
  }

  setMutationDefaults(
    mutationKey: MaybeRefDeep<MutationKey>,
    options: MaybeRefDeep<MutationObserverOptions<any, any, any, any>>,
  ): void {
    super.setMutationDefaults(
      cloneDeepUnref(mutationKey),
      cloneDeepUnref(options) as any,
    )
  }

  getMutationDefaults(
    mutationKey?: MaybeRefDeep<MutationKey>,
  ): MutationObserverOptions<any, any, any, any> | undefined {
    return super.getMutationDefaults(cloneDeepUnref(mutationKey))
  }
}
