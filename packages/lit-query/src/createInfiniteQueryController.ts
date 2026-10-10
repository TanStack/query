import { InfiniteQueryObserver } from '@tanstack/query-core'
import { createValueAccessor, readAccessor } from './accessor.js'
import { createMissingQueryClientError } from './context.js'
import { BaseController } from './controllers/BaseController.js'
import { QueryObserverResultTracker } from './queryObserverResultTracker.js'
import type { Accessor, ValueAccessor } from './accessor.js'
import type {
  DefaultError,
  DefaultedInfiniteQueryObserverOptions,
  InfiniteData,
  InfiniteQueryMode,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryClient,
  QueryKey,
} from '@tanstack/query-core'
import type { ReactiveControllerHost } from 'lit'

/**
 * Options accepted by `createInfiniteQueryController`.
 *
 * This is the Lit adapter shape for `InfiniteQueryObserverOptions`. Pass it
 * directly or through an `Accessor` when the options depend on Lit host state.
 */
export type CreateInfiniteQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam,
  TMode
>

/**
 * Accessor returned by `createInfiniteQueryController`.
 *
 * Call the accessor or read its `current` property to get the latest infinite
 * query result. The attached methods delegate to the active infinite query
 * observer.
 */
export type InfiniteQueryResultAccessor<
  TData,
  TError,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = undefined,
> = ValueAccessor<
  InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
> & {
  /** Refetches the current infinite query. */
  refetch: InfiniteQueryObserverResult<
    TData,
    TError,
    TPageParam,
    TMode
  >['refetch']
  /** Fetches the next page for the current infinite query. */
  fetchNextPage: InfiniteQueryObserverResult<
    TData,
    TError,
    TPageParam,
    TMode
  >['fetchNextPage']
  /** Fetches the previous page for the current infinite query. */
  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError,
    TPageParam,
    TMode
  >['fetchPreviousPage']
  /** Removes the controller from its Lit host and unsubscribes observers. */
  destroy: () => void
}

/**
 * Returns the result used while no `QueryClient` is available: `'pending'` and idle, with methods
 * that reject with the missing client error.
 * @returns A new result object in that state.
 */
function createPendingInfiniteQueryResult<
  TData,
  TError,
  TPageParam,
  TMode extends InfiniteQueryMode | undefined,
>(): InfiniteQueryObserverResult<TData, TError, TPageParam, TMode> {
  return {
    data: undefined,
    dataUpdatedAt: 0,
    error: null,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    isError: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isFetching: false,
    isInitialLoading: false,
    isLoading: false,
    isLoadingError: false,
    isPaused: false,
    isPending: true,
    isPlaceholderData: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: true,
    isEnabled: true,
    isSuccess: false,
    fetchStatus: 'idle',
    status: 'pending',
    refetch: (() =>
      Promise.reject(
        createMissingQueryClientError(),
      )) as InfiniteQueryObserverResult<
      TData,
      TError,
      TPageParam,
      TMode
    >['refetch'],
    fetchNextPage: (() =>
      Promise.reject(
        createMissingQueryClientError(),
      )) as InfiniteQueryObserverResult<
      TData,
      TError,
      TPageParam,
      TMode
    >['fetchNextPage'],
    fetchPreviousPage: (() =>
      Promise.reject(
        createMissingQueryClientError(),
      )) as InfiniteQueryObserverResult<
      TData,
      TError,
      TPageParam,
      TMode
    >['fetchPreviousPage'],
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isFetchPreviousPageError: false,
    isFetchingPreviousPage: false,
  } as unknown as InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
}

class InfiniteQueryController<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
  TMode extends InfiniteQueryMode | undefined,
> extends BaseController<
  InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
> {
  private readonly options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
  >
  private observer:
    | InfiniteQueryObserver<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam,
        TMode
      >
    | undefined
  private readonly resultTracker = new QueryObserverResultTracker<
    InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
  >()
  private unsubscribe: (() => void) | undefined
  private queryClient: QueryClient | undefined

  constructor(
    host: ReactiveControllerHost,
    options: Accessor<
      CreateInfiniteQueryOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryKey,
        TPageParam,
        TMode
      >
    >,
    queryClient?: QueryClient,
  ) {
    super(host, createPendingInfiniteQueryResult(), queryClient)
    this.options = options

    if (!queryClient) {
      return
    }

    if (typeof options === 'function') {
      return
    }

    const defaulted = this.defaultOptions(queryClient)
    const observer = new InfiniteQueryObserver(queryClient, defaulted)
    this.queryClient = queryClient
    this.observer = observer
    this.assignObserverResult(observer.getOptimisticResult(defaulted))
  }

  protected override onConnected(): void {
    if (!this.syncClient()) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    this.observer?.updateResult()
    if (this.observer) {
      this.setObserverResult(this.observer.getCurrentResult())
    }
  }

  protected override onDisconnected(): void {
    this.unsubscribeObserver()
    this.syncClient()
  }

  protected override onHostUpdate(): void {
    if (typeof this.options !== 'function') {
      return
    }

    this.refreshOptions()
  }

  protected override onQueryClientChanged(): void {
    if (!this.syncClient() || !this.connectedState) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    this.observer?.updateResult()
    if (this.observer) {
      this.setObserverResult(this.observer.getCurrentResult())
    }
  }

  refetch: InfiniteQueryObserverResult<
    TData,
    TError,
    TPageParam,
    TMode
  >['refetch'] = (...args) => {
    if (!this.applyOptions() || !this.observer) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.observer.refetch(...args)
  }

  fetchNextPage: InfiniteQueryObserverResult<
    TData,
    TError,
    TPageParam,
    TMode
  >['fetchNextPage'] = (...args) => {
    if (!this.applyOptions() || !this.observer) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.observer.fetchNextPage(...args)
  }

  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError,
    TPageParam,
    TMode
  >['fetchPreviousPage'] = (...args) => {
    if (!this.applyOptions() || !this.observer) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.observer.fetchPreviousPage(...args)
  }

  readCurrent(): InfiniteQueryObserverResult<TData, TError, TPageParam, TMode> {
    if (this.observer) {
      this.assignObserverResult(this.observer.getCurrentResult())
    }

    return this.current
  }

  private subscribe(): void {
    if (!this.observer) {
      return
    }

    if (this.unsubscribe) {
      return
    }

    this.unsubscribe = this.observer.subscribe((next) => {
      this.setObserverResult(next)
    })
  }

  private unsubscribeObserver(): void {
    this.unsubscribe?.()
    this.unsubscribe = undefined
  }

  private syncClient(): boolean {
    const nextClient = this.tryGetQueryClient()
    if (!nextClient) {
      this.unsubscribeObserver()
      this.queryClient = undefined
      this.observer = undefined
      this.resultTracker.reset()
      this.setResult(createPendingInfiniteQueryResult())
      return false
    }

    if (nextClient === this.queryClient) {
      return true
    }

    this.unsubscribeObserver()
    this.queryClient = nextClient
    const options = this.defaultOptions(this.queryClient)
    this.observer = new InfiniteQueryObserver(this.queryClient, options)
    this.setObserverResult(this.observer.getOptimisticResult(options))
    return true
  }

  private applyOptions(): boolean {
    if (!this.syncClient() || !this.observer || !this.queryClient) {
      return false
    }

    const options = this.defaultOptions(this.queryClient)
    this.observer.setOptions(options)
    return true
  }

  private refreshOptions(): boolean {
    if (!this.applyOptions() || !this.observer) {
      return false
    }

    this.setObserverResult(this.observer.getCurrentResult())
    return true
  }

  private assignObserverResult(
    result: InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>,
  ): void {
    const trackedResult = this.resultTracker.update(this.observer, result)
    if (trackedResult) {
      this.result = trackedResult
    }
  }

  private setObserverResult(
    result: InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>,
  ): void {
    const trackedResult = this.resultTracker.update(this.observer, result)
    if (trackedResult) {
      this.setResult(trackedResult)
    }
  }

  private defaultOptions(
    client = this.queryClient,
  ): DefaultedInfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam,
    TMode
  > {
    if (!client) {
      throw createMissingQueryClientError()
    }

    const defaulted = client.defaultQueryOptions(
      readAccessor(this.options),
    ) as DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
    ;(defaulted as { _optimisticResults?: 'optimistic' })._optimisticResults =
      'optimistic'
    return defaulted
  }
}

/**
 * Creates a Lit reactive controller that subscribes the host to an infinite
 * query.
 *
 * The returned accessor is callable and also exposes `current`, `refetch`,
 * `fetchNextPage`, `fetchPreviousPage`, and `destroy`. When `options` is a
 * function, it is re-read during host updates so query keys and options can
 * follow reactive host state.
 *
 * If `queryClient` is omitted, the controller resolves the client from the
 * nearest connected `QueryClientProvider`.
 * @param host - The Lit reactive controller host that owns the infinite query
 * subscription.
 * @param options - Infinite query observer options, or a getter that returns
 * options.
 * @param queryClient - Optional explicit query client. Provide this for
 * controllers that should not resolve a client from Lit context.
 * @returns An accessor for the latest infinite query result with page helper
 * methods.
 * @example
 * ```ts
 * import { LitElement, html } from 'lit'
 * import { createInfiniteQueryController } from '@tanstack/lit-query'
 *
 * class ProjectsView extends LitElement {
 *   private readonly projects = createInfiniteQueryController(this, {
 *     queryKey: ['projects'],
 *     queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *     initialPageParam: 0,
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *   })
 *
 *   render() {
 *     const query = this.projects()
 *
 *     return html`
 *       <button ?disabled=${!query.hasNextPage} @click=${() => this.projects.fetchNextPage()}>
 *         Load more
 *       </button>
 *     `
 *   }
 * }
 * ```
 */
export function createInfiniteQueryController<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  host: ReactiveControllerHost,
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      undefined
    >
  >,
  queryClient?: QueryClient,
): InfiniteQueryResultAccessor<TData, TError, TPageParam, undefined>
export function createInfiniteQueryController<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  host: ReactiveControllerHost,
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      InfiniteQueryMode
    >
  >,
  queryClient?: QueryClient,
): InfiniteQueryResultAccessor<TData, TError, TPageParam, InfiniteQueryMode>
export function createInfiniteQueryController<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends InfiniteQueryMode | undefined = InfiniteQueryMode | undefined,
>(
  host: ReactiveControllerHost,
  options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
    >
  >,
  queryClient?: QueryClient,
): InfiniteQueryResultAccessor<TData, TError, TPageParam, TMode> {
  const controller = new InfiniteQueryController(host, options, queryClient)

  return Object.assign(
    createValueAccessor(() => controller.readCurrent()),
    {
      refetch: controller.refetch,
      fetchNextPage: controller.fetchNextPage,
      fetchPreviousPage: controller.fetchPreviousPage,
      destroy: () => controller.destroy(),
    },
  )
}
