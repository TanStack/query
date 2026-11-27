import type { RuntimeBinding } from './binding'
import type { FocusManagerListener, FocusManagerSetupFn } from './focusManager'
import type {
  InfiniteQueryObserverListener,
  ReplaceReturnType,
  InfiniteObserverOptionsInput as SharedInfiniteObserverOptionsInput,
} from './infiniteQueryObserver'
import type { MutationCacheListener as SharedMutationCacheListener } from './mutationCache'
import type { MutationObserverListener as SharedMutationObserverListener } from './mutationObserver'
import type {
  OnlineManagerListener,
  OnlineManagerSetupFn,
} from './onlineManager'
import type {
  QueriesObserverListener,
  QueriesObserverOptions,
  QueriesObserverResultReader,
} from './queriesObserver'
import type { QueryCacheListener as SharedQueryCacheListener } from './queryCache'
import type { WithoutSkipToken } from './queryClient'
import type { QueryObserverListener } from './queryObserver'
import type {
  ManagedTimerId,
  TimeoutCallback,
  TimeoutProvider,
} from './timeoutManager'
import type {
  CancelOptions,
  DefaultError,
  DefaultOptions,
  DefaultedInfiniteQueryObserverOptions,
  DefaultedQueryObserverOptions,
  FetchNextPageOptions,
  FetchOptions,
  FetchPreviousPageOptions,
  InferDataFromTag,
  InferErrorFromTag,
  InfiniteData,
  InfiniteQueryExecuteOptions,
  InfiniteQueryObserverResult,
  InvalidateOptions,
  InvalidateQueryFilters,
  MutateOptions,
  MutationAction,
  MutationCacheConfig,
  MutationCacheNotifyEvent,
  MutationFilters,
  MutationKey,
  MutationMeta,
  MutationObserverOptions,
  MutationObserverResult,
  MutationOptions,
  MutationState,
  ObserverOptionsInput,
  OmitKeyof,
  QueryCacheConfig,
  QueryCacheNotifyEvent,
  QueryExecuteOptions,
  QueryFilters,
  QueryKey,
  QueryMeta,
  QueryObserverOptionsBase,
  QueryObserverResult,
  QueryObserverResultReader,
  QueryOptions,
  QueryState,
  RefetchOptions,
  RefetchQueryFilters,
  ResetOptions,
  SetDataOptions,
  StaleTime,
  Updater,
  WithRequired,
} from './index'

/* oxlint-disable typescript/method-signature-style -- Match runtime class methods, including their parameter variance. */

interface Subscription<TListener> {
  subscribe(listener: TListener): () => void
  hasListeners(): boolean
}
interface CacheEntry {
  gcTime: number
  destroy(): void
}
interface QueryClient {
  mount(): void
  unmount(): void
  isFetching(filters?: Omit<QueryFilters, 'fetchStatus'>): number
  isMutating<
    TMutationFilters extends MutationFilters<any, any> = MutationFilters<
      any,
      any
    >,
  >(
    filters?: NoInfer<Omit<TMutationFilters, 'status'>>,
  ): number
  getQueryData<
    TQueryFnData = unknown,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
  ): TInferredQueryFnData | undefined
  getQueriesData<
    TQueryFnData = unknown,
    TQueryFilters extends QueryFilters<any> = QueryFilters,
  >(
    filters: TQueryFilters,
  ): Array<[QueryKey, TQueryFnData | undefined]>
  setQueryData<
    TQueryFnData = unknown,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
    updater: Updater<
      InferDataFromTag<NoInfer<TQueryFnData>, TTaggedQueryKey> | undefined,
      NoInfer<TInferredQueryFnData> | undefined
    >,
    options?: SetDataOptions,
  ): NoInfer<TInferredQueryFnData> | undefined
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
  ): Array<[QueryKey, TQueryFnData | undefined]>
  getQueryState<
    TQueryFnData = unknown,
    TError = DefaultError,
    TTaggedQueryKey extends QueryKey = QueryKey,
    TInferredQueryFnData = InferDataFromTag<TQueryFnData, TTaggedQueryKey>,
    TInferredError = InferErrorFromTag<TError, TTaggedQueryKey>,
  >(
    queryKey: TTaggedQueryKey,
  ): QueryState<TInferredQueryFnData, TInferredError> | undefined
  removeQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
  ): void
  resetQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    options?: ResetOptions,
  ): Promise<void>
  cancelQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: QueryFilters<TTaggedQueryKey>,
    cancelOptions?: CancelOptions,
  ): Promise<void>
  invalidateQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: InvalidateQueryFilters<TTaggedQueryKey>,
    options?: InvalidateOptions,
  ): Promise<void>
  refetchQueries<TTaggedQueryKey extends QueryKey = QueryKey>(
    filters?: RefetchQueryFilters<TTaggedQueryKey>,
    options?: RefetchOptions,
  ): Promise<void>
  query<
    TQueryFnData,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
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
  query<
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
  ): Promise<TData | undefined>
  infiniteQuery<
    TQueryFnData,
    TError = DefaultError,
    TData = InfiniteData<TQueryFnData>,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = unknown,
  >(
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
    | undefined
    | (Array<TData> extends Array<InfiniteData<TQueryFnData>>
        ? InfiniteData<TQueryFnData, TPageParam>
        : TData)
  >
  resumePausedMutations(): Promise<unknown>
  getQueryCache(): QueryCache
  getMutationCache(): MutationCache
  getDefaultOptions(): DefaultOptions
  setDefaultOptions(options: DefaultOptions): void
  setQueryDefaults<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
  >(
    queryKey: QueryKey,
    options: Partial<
      OmitKeyof<
        QueryObserverOptionsBase<TQueryFnData, TError, TData, TQueryData>,
        'queryKey'
      >
    >,
  ): void
  getQueryDefaults(
    queryKey: QueryKey,
  ): OmitKeyof<QueryObserverOptionsBase<any, any, any, any, any>, 'queryKey'>
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
  ): void
  getMutationDefaults(
    mutationKey: MutationKey,
  ): OmitKeyof<MutationObserverOptions<any, any, any, any>, 'mutationKey'>
  defaultQueryOptions<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
    TPageParam = never,
  >(
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
  >
  defaultMutationOptions<T extends MutationOptions<any, any, any, any>>(
    options?: T,
  ): T
  clear(): void
}

interface QueryCache extends Subscription<QueryCacheListener> {
  config: QueryCacheConfig
  build<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    client: QueryClient,
    options: WithRequired<
      QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
      'queryKey'
    >,
    state?: QueryState<TData, TError>,
  ): Query<TQueryFnData, TError, TData, TQueryKey>
  add(query: Query<any, any, any, any>): void
  remove(query: Query<any, any, any, any>): void
  clear(): void
  get<
    TQueryFnData = unknown,
    TError = DefaultError,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(
    queryHash: string,
  ): Query<TQueryFnData, TError, TData, TQueryKey> | undefined
  getAll(): Array<Query>
  find<TQueryFnData = unknown, TError = DefaultError, TData = TQueryFnData>(
    filters: WithRequired<QueryFilters, 'queryKey'>,
  ): Query<TQueryFnData, TError, TData> | undefined
  findAll(filters?: QueryFilters<any>): Array<Query>
  notify(event: QueryCacheNotifyEvent): void
  onFocus(): void
  onOnline(): void
}

interface MutationCache extends Subscription<MutationCacheListener> {
  config: MutationCacheConfig
  register<T extends Mutation<any, any, any, any>>(create: (id: number) => T): T
  add(mutation: Mutation<any, any, any, any>): void
  remove(mutation: Mutation<any, any, any, any>): void
  has(mutation: Mutation<any, any, any, any>): boolean
  canRun(mutation: Mutation<any, any, any, any>): boolean
  runNext(mutation: Mutation<any, any, any, any>): Promise<unknown>
  clear(): void
  getAll(): Array<Mutation>
  find<
    TData = unknown,
    TError = DefaultError,
    TVariables = any,
    TOnMutateResult = unknown,
  >(
    filters: MutationFilters,
  ): Mutation<TData, TError, TVariables, TOnMutateResult> | undefined
  findAll(filters?: MutationFilters): Array<Mutation>
  notify(event: MutationCacheNotifyEvent): void
  resumePausedMutations(): Promise<unknown>
}

interface Query<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends CacheEntry {
  queryKey: TQueryKey
  queryHash: string
  options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>
  state: QueryState<TData, TError>
  observers: Array<QueryObserver<any, any, any, any, any>>
  get meta(): QueryMeta | undefined
  get queryType(): 'infinite' | undefined
  get promise(): Promise<TData> | undefined
  setOptions(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  ): void
  setData(
    newData: TData,
    options?: SetDataOptions & {
      manual: boolean
    },
  ): TData
  setState(state: Partial<QueryState<TData, TError>>): void
  cancel(options?: CancelOptions): Promise<void>
  destroy(): void
  get resetState(): QueryState<TData, TError>
  reset(): void
  isActive(): boolean
  isDisabled(): boolean
  isFetched(): boolean
  isStatic(): boolean
  isStale(): boolean
  isStaleByTime(staleTime?: StaleTime): boolean
  onFocus(): void
  onOnline(): void
  addObserver(observer: QueryObserver<any, any, any, any, any>): void
  removeObserver(observer: QueryObserver<any, any, any, any, any>): void
  getObserversCount(): number
  invalidate(): void
  fetch(
    options?: QueryOptions<TQueryFnData, TError, TData, TQueryKey>,
    fetchOptions?: FetchOptions<TQueryFnData>,
  ): Promise<TData>
}

interface Mutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = unknown,
  TOnMutateResult = unknown,
> extends CacheEntry {
  state: MutationState<TData, TError, TVariables, TOnMutateResult>
  options: MutationOptions<TData, TError, TVariables, TOnMutateResult>
  readonly mutationId: number
  setOptions(
    options: MutationOptions<TData, TError, TVariables, TOnMutateResult>,
  ): void
  get meta(): MutationMeta | undefined
  addObserver(observer: MutationObserver<any, any, any, any>): void
  removeObserver(observer: MutationObserver<any, any, any, any>): void
  continue(): Promise<unknown>
  execute(variables: TVariables): Promise<TData>
}

interface QueryObserver<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends Subscription<QueryObserverListener<TData, TError>> {
  options: ObserverOptionsInput<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  >
  shouldFetchOnReconnect(): boolean
  shouldFetchOnWindowFocus(): boolean
  destroy(): void
  setOptions(
    options: ObserverOptionsInput<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): void
  createResultReader(
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): QueryObserverResultReader<QueryObserverResult<TData, TError>>
  getCurrentResult(): QueryObserverResult<TData, TError>
  trackResult(
    result: QueryObserverResult<TData, TError>,
    onPropTracked?: (key: keyof QueryObserverResult) => void,
  ): QueryObserverResult<TData, TError>
  trackProp(key: keyof QueryObserverResult): void
  getCurrentQuery(): Query<TQueryFnData, TError, TQueryData, TQueryKey>
  refetch(options?: RefetchOptions): Promise<QueryObserverResult<TData, TError>>
  fetchOptimistic(
    options: ObserverOptionsInput<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): Promise<QueryObserverResult<TData, TError>>
  updateResult(): void
  onQueryUpdate(): void
}

interface MutationObserver<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TOnMutateResult = unknown,
> extends Subscription<
  MutationObserverListener<TData, TError, TVariables, TOnMutateResult>
> {
  options: MutationObserverOptions<TData, TError, TVariables, TOnMutateResult>
  setOptions(
    options: MutationObserverOptions<
      TData,
      TError,
      TVariables,
      TOnMutateResult
    >,
  ): void
  onMutationUpdate(
    action: MutationAction<TData, TError, TVariables, TOnMutateResult>,
  ): void
  getCurrentResult(): MutationObserverResult<
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >
  reset(): void
  mutate(
    variables: TVariables,
    options?: MutateOptions<TData, TError, TVariables, TOnMutateResult>,
  ): Promise<TData>
}

type QueryCacheListener = SharedQueryCacheListener<DefaultRuntime>
type MutationCacheListener = SharedMutationCacheListener<DefaultRuntime>
type MutationObserverListener<TData, TError, TVariables, TOnMutateResult> =
  SharedMutationObserverListener<
    DefaultRuntime,
    TData,
    TError,
    TVariables,
    TOnMutateResult
  >

/** Structural public class shapes used when importing types without a runtime. */
interface DefaultRuntime extends RuntimeBinding {
  QueryClient: QueryClient
  QueryCache: QueryCache
  MutationCache: MutationCache
  Query: Query<
    this['queryFnData'],
    this['error'],
    this['data'],
    this['queryKey'][0]
  >
  Mutation: Mutation<
    this['data'],
    this['error'],
    this['variables'],
    this['onMutateResult']
  >
  QueryObserver: QueryObserver<
    this['queryFnData'],
    this['error'],
    this['data'],
    this['queryData'],
    this['queryKey'][0]
  >
  MutationObserver: MutationObserver<
    this['data'],
    this['error'],
    this['variables'],
    this['onMutateResult']
  >
}

interface FocusManager extends Subscription<FocusManagerListener> {
  setEventListener(setup: FocusManagerSetupFn): void
  setFocused(focused?: boolean): void
  onFocus(): void
  isFocused(): boolean
}

interface OnlineManager extends Subscription<OnlineManagerListener> {
  setEventListener(setup: OnlineManagerSetupFn): void
  setOnline(online: boolean): void
  isOnline(): boolean
}

interface TimeoutManager {
  setTimeoutProvider<TTimerId extends ManagedTimerId>(
    provider: TimeoutProvider<TTimerId>,
  ): void
  setTimeout(callback: TimeoutCallback, delay: number): ManagedTimerId
  clearTimeout(timeoutId: ManagedTimerId | undefined): void
  setInterval(callback: TimeoutCallback, delay: number): ManagedTimerId
  clearInterval(intervalId: ManagedTimerId | undefined): void
}

interface QueriesObserver<
  TCombinedResult = Array<QueryObserverResult>,
> extends Subscription<QueriesObserverListener> {
  destroy(): void
  setQueries(
    queries: Array<ObserverOptionsInput>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ): void
  getCurrentResult(): Array<QueryObserverResult>
  getQueries(): Array<Query>
  getObservers(): Array<QueryObserver>
  createResultReader(
    queries: Array<ObserverOptionsInput<any, any, any, any, any>>,
    options?: QueriesObserverOptions<TCombinedResult>,
  ): QueriesObserverResultReader<TCombinedResult>
}

interface InfiniteQueryObserver<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends QueryObserver<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey
> {
  subscribe: Subscription<
    InfiniteQueryObserverListener<TData, TError>
  >['subscribe']
  getCurrentResult: ReplaceReturnType<
    QueryObserver<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >['getCurrentResult'],
    InfiniteQueryObserverResult<TData, TError>
  >
  setOptions(
    options: InfiniteObserverOptionsInput<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): void
  createResultReader(
    options: DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): QueryObserverResultReader<InfiniteQueryObserverResult<TData, TError>>
  fetchNextPage(
    options?: FetchNextPageOptions,
  ): Promise<InfiniteQueryObserverResult<TData, TError>>
  fetchPreviousPage(
    options?: FetchPreviousPageOptions,
  ): Promise<InfiniteQueryObserverResult<TData, TError>>
}

interface CancelledError extends Error {
  revert?: boolean
  silent?: boolean
}

type InfiniteObserverOptionsInput<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> = SharedInfiniteObserverOptionsInput<
  DefaultRuntime,
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

export type {
  FocusManager,
  OnlineManager,
  TimeoutManager,
  QueriesObserver,
  InfiniteQueryObserver,
  CancelledError,
}

export type {
  QueryClient,
  QueryCache,
  MutationCache,
  Query,
  Mutation,
  QueryObserver,
  MutationObserver,
  DefaultRuntime,
}
