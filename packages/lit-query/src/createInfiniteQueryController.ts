import {
  InfiniteQueryObserver,
  type DefaultError,
  type DefaultedInfiniteQueryObserverOptions,
  type InfiniteData,
  type InfiniteQueryObserverOptions,
  type InfiniteQueryObserverResult,
  type QueryKey,
} from '@tanstack/query-core'
import type { QueryClient } from '@tanstack/query-core'
import type { ReactiveControllerHost } from 'lit'
import {
  createValueAccessor,
  readAccessor,
  type Accessor,
  type ValueAccessor,
} from './accessor.js'
import { createMissingQueryClientError } from './context.js'
import { BaseController } from './controllers/BaseController.js'

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
> = InfiniteQueryObserverOptions<
  TQueryFnData,
  TError,
  TData,
  TQueryKey,
  TPageParam
>

/**
 * Accessor returned by `createInfiniteQueryController`.
 *
 * Call the accessor or read its `current` property to get the latest infinite
 * query result. The attached methods delegate to the active infinite query
 * observer.
 */
export type InfiniteQueryResultAccessor<TData, TError> = ValueAccessor<
  InfiniteQueryObserverResult<TData, TError>
> & {
  /** Refetches the current infinite query. */
  refetch: InfiniteQueryObserverResult<TData, TError>['refetch']
  /** Fetches the next page for the current infinite query. */
  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage']
  /** Fetches the previous page for the current infinite query. */
  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError
  >['fetchPreviousPage']
  /** Removes the controller from its Lit host and unsubscribes observers. */
  destroy: () => void
}

function createPendingInfiniteQueryResult<
  TData,
  TError,
>(): InfiniteQueryObserverResult<TData, TError> {
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
      )) as InfiniteQueryObserverResult<TData, TError>['refetch'],
    fetchNextPage: (() =>
      Promise.reject(
        createMissingQueryClientError(),
      )) as InfiniteQueryObserverResult<TData, TError>['fetchNextPage'],
    fetchPreviousPage: (() =>
      Promise.reject(
        createMissingQueryClientError(),
      )) as InfiniteQueryObserverResult<TData, TError>['fetchPreviousPage'],
    hasNextPage: false,
    hasPreviousPage: false,
    isFetchNextPageError: false,
    isFetchingNextPage: false,
    isFetchPreviousPageError: false,
    isFetchingPreviousPage: false,
    promise: Promise.resolve(undefined as never),
  } as unknown as InfiniteQueryObserverResult<TData, TError>
}

class InfiniteQueryController<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey,
  TPageParam,
> extends BaseController<InfiniteQueryObserverResult<TData, TError>> {
  private readonly options: Accessor<
    CreateInfiniteQueryOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >
  >
  private observer:
    | InfiniteQueryObserver<TQueryFnData, TError, TData, TQueryKey, TPageParam>
    | undefined
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
        TPageParam
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
    this.result = observer.getOptimisticResult(defaulted)
  }

  protected onConnected(): void {
    if (!this.syncClient()) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    this.observer?.updateResult()
    if (this.observer) {
      this.setResult(this.observer.getCurrentResult())
    }
  }

  protected onDisconnected(): void {
    this.unsubscribeObserver()
    this.syncClient()
  }

  protected onHostUpdate(): void {
    if (typeof this.options !== 'function') {
      return
    }

    this.refreshOptions()
  }

  protected onQueryClientChanged(): void {
    if (!this.syncClient() || !this.connectedState) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    this.observer?.updateResult()
    if (this.observer) {
      this.setResult(this.observer.getCurrentResult())
    }
  }

  refetch: InfiniteQueryObserverResult<TData, TError>['refetch'] = (
    ...args
  ) => {
    if (!this.refreshOptions()) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.result.refetch(...args)
  }

  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage'] = (
    ...args
  ) => {
    if (!this.refreshOptions()) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.result.fetchNextPage(...args)
  }

  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError
  >['fetchPreviousPage'] = (...args) => {
    if (!this.refreshOptions()) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.result.fetchPreviousPage(...args)
  }

  private subscribe(): void {
    if (!this.observer) {
      return
    }

    if (this.unsubscribe) {
      return
    }

    this.unsubscribe = this.observer.subscribe((next) => {
      this.setResult(next)
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
    this.setResult(this.observer.getOptimisticResult(options))
    return true
  }

  private refreshOptions(): boolean {
    if (!this.syncClient() || !this.observer || !this.queryClient) {
      return false
    }

    const options = this.defaultOptions(this.queryClient)
    this.observer.setOptions(options)
    this.setResult(this.observer.getOptimisticResult(options))
    return true
  }

  private defaultOptions(
    client = this.queryClient,
  ): DefaultedInfiniteQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
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
      TPageParam
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
 *
 * @param host - The Lit reactive controller host that owns the infinite query
 * subscription.
 * @param options - Infinite query observer options, or a getter that returns
 * options.
 * @param queryClient - Optional explicit query client. Provide this for
 * controllers that should not resolve a client from Lit context.
 * @returns An accessor for the latest infinite query result with page helper
 * methods.
 *
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
      TPageParam
    >
  >,
  queryClient?: QueryClient,
): InfiniteQueryResultAccessor<TData, TError> {
  const controller = new InfiniteQueryController(host, options, queryClient)

  return Object.assign(
    createValueAccessor(() => controller.current),
    {
      refetch: controller.refetch,
      fetchNextPage: controller.fetchNextPage,
      fetchPreviousPage: controller.fetchPreviousPage,
      destroy: () => controller.destroy(),
    },
  )
}
