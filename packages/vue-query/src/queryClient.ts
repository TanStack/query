import { ref } from 'vue-demi'
import { QueryClient as QC } from '@tanstack/query-core'
import { cloneDeepUnref, isQueryKey } from './utils'
import { QueryCache } from './queryCache'
import { MutationCache } from './mutationCache'
import type { MaybeRefDeep } from './types'
import type {
  CancelOptions,
  DefaultOptions,
  FetchInfiniteQueryOptions,
  FetchQueryOptions,
  InfiniteData,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutationFilters,
  MutationKey,
  MutationObserverOptions,
  QueryClientConfig,
  QueryFilters,
  QueryFunction,
  QueryKey,
  QueryObserverOptions,
  QueryState,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  ResetQueryFilters,
  SetDataOptions,
  Updater,
} from '@tanstack/query-core'

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

  isFetching(filters?: MaybeRefDeep<QueryFilters>): number
  isFetching(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
  ): number
  isFetching(
    arg1?: MaybeRefDeep<QueryFilters | QueryKey>,
    arg2?: MaybeRefDeep<QueryFilters>,
  ): number {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2) as QueryFilters
    if (isQueryKey(arg1Unreffed)) {
      return super.isFetching(arg1Unreffed, arg2Unreffed)
    }
    return super.isFetching(arg1Unreffed as QueryFilters)
  }

  isMutating(filters?: MaybeRefDeep<MutationFilters>): number {
    return super.isMutating(cloneDeepUnref(filters) as MutationFilters)
  }

  getQueryData<TData = unknown>(
    queryKey: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
  ): TData | undefined {
    return super.getQueryData(
      cloneDeepUnref(queryKey),
      cloneDeepUnref(filters) as QueryFilters,
    )
  }

  getQueriesData<TData = unknown>(
    queryKey: MaybeRefDeep<QueryKey>,
  ): [QueryKey, TData | undefined][]
  getQueriesData<TData = unknown>(
    filters: MaybeRefDeep<QueryFilters>,
  ): [QueryKey, TData | undefined][]
  getQueriesData<TData = unknown>(
    queryKeyOrFilters: MaybeRefDeep<QueryKey> | MaybeRefDeep<QueryFilters>,
  ): [QueryKey, TData | undefined][] {
    const unreffed = cloneDeepUnref(queryKeyOrFilters)
    if (isQueryKey(unreffed)) {
      return super.getQueriesData(unreffed)
    }
    return super.getQueriesData(unreffed as QueryFilters)
  }

  setQueryData<TData>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<TData | undefined, TData | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): TData | undefined {
    return super.setQueryData(
      cloneDeepUnref(queryKey),
      updater,
      cloneDeepUnref(options) as SetDataOptions,
    )
  }

  setQueriesData<TData>(
    queryKey: MaybeRefDeep<QueryKey>,
    updater: Updater<TData | undefined, TData | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): [QueryKey, TData | undefined][]
  setQueriesData<TData>(
    filters: MaybeRefDeep<QueryFilters>,
    updater: Updater<TData | undefined, TData | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): [QueryKey, TData | undefined][]
  setQueriesData<TData>(
    queryKeyOrFilters: MaybeRefDeep<QueryKey | QueryFilters>,
    updater: Updater<TData | undefined, TData | undefined>,
    options?: MaybeRefDeep<SetDataOptions>,
  ): [QueryKey, TData | undefined][] {
    const arg1Unreffed = cloneDeepUnref(queryKeyOrFilters)
    const arg3Unreffed = cloneDeepUnref(options) as SetDataOptions
    if (isQueryKey(arg1Unreffed)) {
      return super.setQueriesData(arg1Unreffed, updater, arg3Unreffed)
    }
    return super.setQueriesData(
      arg1Unreffed as QueryFilters,
      updater,
      arg3Unreffed,
    )
  }

  getQueryState<TData = unknown, TError = undefined>(
    queryKey: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
  ): QueryState<TData, TError> | undefined {
    return super.getQueryState(
      cloneDeepUnref(queryKey),
      cloneDeepUnref(filters) as QueryFilters,
    )
  }

  removeQueries(filters?: MaybeRefDeep<QueryFilters>): void
  removeQueries(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
  ): void
  removeQueries(
    arg1?: MaybeRefDeep<QueryKey | QueryFilters>,
    arg2?: MaybeRefDeep<QueryFilters>,
  ): void {
    const arg1Unreffed = cloneDeepUnref(arg1)
    if (isQueryKey(arg1Unreffed)) {
      return super.removeQueries(
        arg1Unreffed,
        cloneDeepUnref(arg2) as QueryFilters,
      )
    }
    return super.removeQueries(arg1Unreffed as QueryFilters)
  }

  resetQueries<TPageData = unknown>(
    filters?: MaybeRefDeep<ResetQueryFilters<TPageData>>,
    options?: MaybeRefDeep<ResetOptions>,
  ): Promise<void>
  resetQueries<TPageData = unknown>(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<ResetQueryFilters<TPageData>>,
    options?: MaybeRefDeep<ResetOptions>,
  ): Promise<void>
  resetQueries<TPageData = unknown>(
    arg1?: MaybeRefDeep<QueryKey | ResetQueryFilters<TPageData>>,
    arg2?: MaybeRefDeep<ResetQueryFilters<TPageData> | ResetOptions>,
    arg3?: MaybeRefDeep<ResetOptions>,
  ): Promise<void> {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2)
    if (isQueryKey(arg1Unreffed)) {
      return super.resetQueries(
        arg1Unreffed,
        arg2Unreffed as ResetQueryFilters<TPageData> | undefined,
        cloneDeepUnref(arg3) as ResetOptions,
      )
    }
    return super.resetQueries(
      arg1Unreffed as ResetQueryFilters<TPageData>,
      arg2Unreffed as ResetOptions,
    )
  }

  cancelQueries(
    filters?: MaybeRefDeep<QueryFilters>,
    options?: MaybeRefDeep<CancelOptions>,
  ): Promise<void>
  cancelQueries(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<QueryFilters>,
    options?: MaybeRefDeep<CancelOptions>,
  ): Promise<void>
  cancelQueries(
    arg1?: MaybeRefDeep<QueryKey | QueryFilters>,
    arg2?: MaybeRefDeep<QueryFilters | CancelOptions>,
    arg3?: MaybeRefDeep<CancelOptions>,
  ): Promise<void> {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2)
    if (isQueryKey(arg1Unreffed)) {
      return super.cancelQueries(
        arg1Unreffed,
        arg2Unreffed as QueryFilters | undefined,
        cloneDeepUnref(arg3) as CancelOptions,
      )
    }
    return super.cancelQueries(
      arg1Unreffed as QueryFilters,
      arg2Unreffed as CancelOptions,
    )
  }

  invalidateQueries<TPageData = unknown>(
    filters?: MaybeRefDeep<InvalidateQueryFilters<TPageData>>,
    options?: MaybeRefDeep<InvalidateOptions>,
  ): Promise<void>
  invalidateQueries<TPageData = unknown>(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<InvalidateQueryFilters<TPageData>>,
    options?: MaybeRefDeep<InvalidateOptions>,
  ): Promise<void>
  invalidateQueries<TPageData = unknown>(
    arg1?: MaybeRefDeep<QueryKey | InvalidateQueryFilters<TPageData>>,
    arg2?: MaybeRefDeep<InvalidateQueryFilters<TPageData> | InvalidateOptions>,
    arg3?: MaybeRefDeep<InvalidateOptions>,
  ): Promise<void> {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2)
    if (isQueryKey(arg1Unreffed)) {
      return super.invalidateQueries(
        arg1Unreffed,
        arg2Unreffed as InvalidateQueryFilters | undefined,
        cloneDeepUnref(arg3) as InvalidateOptions,
      )
    }
    return super.invalidateQueries(
      arg1Unreffed as InvalidateQueryFilters<TPageData>,
      arg2Unreffed as InvalidateOptions,
    )
  }

  refetchQueries<TPageData = unknown>(
    filters?: MaybeRefDeep<RefetchQueryFilters<TPageData>>,
    options?: MaybeRefDeep<RefetchOptions>,
  ): Promise<void>
  refetchQueries<TPageData = unknown>(
    queryKey?: MaybeRefDeep<QueryKey>,
    filters?: MaybeRefDeep<RefetchQueryFilters<TPageData>>,
    options?: MaybeRefDeep<RefetchOptions>,
  ): Promise<void>
  refetchQueries<TPageData = unknown>(
    arg1?: MaybeRefDeep<QueryKey | RefetchQueryFilters<TPageData>>,
    arg2?: MaybeRefDeep<RefetchQueryFilters<TPageData> | RefetchOptions>,
    arg3?: MaybeRefDeep<RefetchOptions>,
  ): Promise<void> {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2)
    if (isQueryKey(arg1Unreffed)) {
      return super.refetchQueries(
        arg1Unreffed,
        arg2Unreffed as RefetchQueryFilters | undefined,
        cloneDeepUnref(arg3) as RefetchOptions,
      )
    }
    return super.refetchQueries(
      arg1Unreffed as RefetchQueryFilters<TPageData>,
      arg2Unreffed as RefetchOptions,
    )
  }

  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    options?: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData>
  fetchQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1:
      | MaybeRefDeep<TQueryKey>
      | MaybeRefDeep<FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | MaybeRefDeep<FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
    arg3?: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<TData> {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2)
    if (isQueryKey(arg1Unreffed)) {
      return super.fetchQuery(
        arg1Unreffed as TQueryKey,
        arg2Unreffed as QueryFunction<TQueryFnData, TQueryKey>,
        cloneDeepUnref(arg3) as FetchQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey
        >,
      )
    }
    return super.fetchQuery(
      arg1Unreffed as FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    )
  }

  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    options?: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1: MaybeRefDeep<
      TQueryKey | FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | MaybeRefDeep<FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>>,
    arg3?: MaybeRefDeep<
      FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void> {
    return super.prefetchQuery(
      cloneDeepUnref(arg1) as any,
      cloneDeepUnref(arg2) as any,
      cloneDeepUnref(arg3) as any,
    )
  }

  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    options?: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<InfiniteData<TData>>
  fetchInfiniteQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1: MaybeRefDeep<
      | TQueryKey
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | MaybeRefDeep<
          FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
        >,
    arg3?: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<InfiniteData<TData>> {
    const arg1Unreffed = cloneDeepUnref(arg1)
    const arg2Unreffed = cloneDeepUnref(arg2)
    if (isQueryKey(arg1Unreffed)) {
      return super.fetchInfiniteQuery(
        arg1Unreffed as TQueryKey,
        arg2Unreffed as QueryFunction<TQueryFnData, TQueryKey>,
        cloneDeepUnref(arg3) as FetchInfiniteQueryOptions<
          TQueryFnData,
          TError,
          TData,
          TQueryKey
        >,
      )
    }
    return super.fetchInfiniteQuery(
      arg1Unreffed as FetchInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey
      >,
    )
  }

  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    options: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    options?: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryKey: MaybeRefDeep<TQueryKey>,
    queryFn: QueryFunction<TQueryFnData, TQueryKey>,
    options?: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void>
  prefetchInfiniteQuery<
    TQueryFnData,
    TError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    arg1: MaybeRefDeep<
      | TQueryKey
      | FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
    arg2?:
      | QueryFunction<TQueryFnData, TQueryKey>
      | MaybeRefDeep<
          FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
        >,
    arg3?: MaybeRefDeep<
      FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>
    >,
  ): Promise<void> {
    return super.prefetchInfiniteQuery(
      cloneDeepUnref(arg1) as any,
      cloneDeepUnref(arg2) as any,
      cloneDeepUnref(arg3) as any,
    )
  }

  setDefaultOptions(options: MaybeRefDeep<DefaultOptions>): void {
    super.setDefaultOptions(cloneDeepUnref(options) as DefaultOptions)
  }

  setQueryDefaults(
    queryKey: MaybeRefDeep<QueryKey>,
    options: MaybeRefDeep<QueryObserverOptions<any, any, any, any>>,
  ): void {
    super.setQueryDefaults(
      cloneDeepUnref(queryKey),
      cloneDeepUnref(options) as any,
    )
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
