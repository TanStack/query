import { QueryCache } from './queryCache';
import { MutationCache } from './mutationCache';
import type { CancelOptions, DataTag, DefaultError, DefaultOptions, DefaultedQueryObserverOptions, EnsureInfiniteQueryDataOptions, EnsureQueryDataOptions, FetchInfiniteQueryOptions, FetchQueryOptions, InfiniteData, InvalidateOptions, InvalidateQueryFilters, MutationKey, MutationObserverOptions, MutationOptions, NoInfer, OmitKeyof, QueryClientConfig, QueryKey, QueryObserverOptions, RefetchOptions, RefetchQueryFilters, ResetOptions, SetDataOptions, UnsetMarker } from './types';
import type { QueryState } from './query';
import type { MutationFilters, QueryFilters, Updater } from './utils';
export declare class QueryClient {
    #private;
    constructor(config?: QueryClientConfig);
    mount(): void;
    unmount(): void;
    isFetching<TQueryFilters extends QueryFilters<any, any, any, any> = QueryFilters>(filters?: TQueryFilters): number;
    isMutating<TMutationFilters extends MutationFilters<any, any> = MutationFilters>(filters?: TMutationFilters): number;
    getQueryData<TQueryFnData = unknown, TTaggedQueryKey extends QueryKey = QueryKey, TInferredQueryFnData = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData>(queryKey: TTaggedQueryKey): TInferredQueryFnData | undefined;
    ensureQueryData<TQueryFnData, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: EnsureQueryDataOptions<TQueryFnData, TError, TData, TQueryKey>): Promise<TData>;
    getQueriesData<TQueryFnData = unknown, TQueryFilters extends QueryFilters<any, any, any, any> = QueryFilters<TQueryFnData>, TInferredQueryFnData = TQueryFilters extends QueryFilters<infer TData, any, any, any> ? TData : TQueryFnData>(filters: TQueryFilters): Array<[QueryKey, TInferredQueryFnData | undefined]>;
    setQueryData<TQueryFnData = unknown, TTaggedQueryKey extends QueryKey = QueryKey, TInferredQueryFnData = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData>(queryKey: TTaggedQueryKey, updater: Updater<NoInfer<TInferredQueryFnData> | undefined, NoInfer<TInferredQueryFnData> | undefined>, options?: SetDataOptions): TInferredQueryFnData | undefined;
    setQueriesData<TQueryFnData, TQueryFilters extends QueryFilters<any, any, any, any> = QueryFilters<TQueryFnData>, TInferredQueryFnData = TQueryFilters extends QueryFilters<infer TData, any, any, any> ? TData : TQueryFnData>(filters: TQueryFilters, updater: Updater<NoInfer<TInferredQueryFnData> | undefined, NoInfer<TInferredQueryFnData> | undefined>, options?: SetDataOptions): Array<[QueryKey, TInferredQueryFnData | undefined]>;
    getQueryState<TQueryFnData = unknown, TError = DefaultError, TTaggedQueryKey extends QueryKey = QueryKey, TInferredQueryFnData = TTaggedQueryKey extends DataTag<unknown, infer TaggedValue, unknown> ? TaggedValue : TQueryFnData, TInferredError = TTaggedQueryKey extends DataTag<unknown, unknown, infer TaggedError> ? TaggedError extends UnsetMarker ? TError : TaggedError : TError>(queryKey: TTaggedQueryKey): QueryState<TInferredQueryFnData, TInferredError> | undefined;
    removeQueries<TQueryFilters extends QueryFilters<any, any, any, any> = QueryFilters>(filters?: TQueryFilters): void;
    resetQueries<TQueryFilters extends QueryFilters<any, any, any, any> = QueryFilters>(filters?: TQueryFilters, options?: ResetOptions): Promise<void>;
    cancelQueries<TQueryFilters extends QueryFilters<any, any, any, any> = QueryFilters>(filters?: TQueryFilters, cancelOptions?: CancelOptions): Promise<void>;
    invalidateQueries<TInvalidateQueryFilters extends InvalidateQueryFilters<any, any, any, any> = InvalidateQueryFilters>(filters?: TInvalidateQueryFilters, options?: InvalidateOptions): Promise<void>;
    refetchQueries<TRefetchQueryFilters extends RefetchQueryFilters<any, any, any, any> = RefetchQueryFilters>(filters?: TRefetchQueryFilters, options?: RefetchOptions): Promise<void>;
    fetchQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey, TPageParam = never>(options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): Promise<TData>;
    prefetchQuery<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey>(options: FetchQueryOptions<TQueryFnData, TError, TData, TQueryKey>): Promise<void>;
    fetchInfiniteQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>(options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): Promise<InfiniteData<TData, TPageParam>>;
    prefetchInfiniteQuery<TQueryFnData, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>(options: FetchInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): Promise<void>;
    ensureInfiniteQueryData<TQueryFnData, TError = DefaultError, TData = TQueryFnData, TQueryKey extends QueryKey = QueryKey, TPageParam = unknown>(options: EnsureInfiniteQueryDataOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>): Promise<InfiniteData<TData, TPageParam>>;
    resumePausedMutations(): Promise<unknown>;
    cancelPausedMutations({ scope }: {
        scope: MutationOptions['scope'];
    }): void;
    getQueryCache(): QueryCache;
    getMutationCache(): MutationCache;
    getDefaultOptions(): DefaultOptions;
    setDefaultOptions(options: DefaultOptions): void;
    setQueryDefaults<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryData = TQueryFnData>(queryKey: QueryKey, options: Partial<OmitKeyof<QueryObserverOptions<TQueryFnData, TError, TData, TQueryData>, 'queryKey'>>): void;
    getQueryDefaults(queryKey: QueryKey): OmitKeyof<QueryObserverOptions<any, any, any, any, any>, 'queryKey'>;
    setMutationDefaults<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(mutationKey: MutationKey, options: OmitKeyof<MutationObserverOptions<TData, TError, TVariables, TContext>, 'mutationKey'>): void;
    getMutationDefaults(mutationKey: MutationKey): MutationObserverOptions<any, any, any, any>;
    defaultQueryOptions<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData, TQueryData = TQueryFnData, TQueryKey extends QueryKey = QueryKey, TPageParam = never>(options: QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam> | DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>): DefaultedQueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>;
    defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(options?: T): T;
    clear(): void;
}
//# sourceMappingURL=queryClient.d.ts.map