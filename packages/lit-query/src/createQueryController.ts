import {
  QueryObserver,
  type DefaultError,
  type DefaultedQueryObserverOptions,
  type QueryKey,
  type QueryObserverOptions,
  type QueryObserverResult,
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
 * Options accepted by `createQueryController`.
 *
 * This is the Lit adapter shape for `QueryObserverOptions`. It can be passed
 * directly to `createQueryController`, or wrapped in an `Accessor` when the
 * options depend on Lit host state.
 */
export type CreateQueryOptions<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>

/**
 * Accessor returned by `createQueryController`.
 *
 * Call the accessor or read its `current` property to get the latest query
 * result. The attached methods delegate to the active query observer.
 */
export type QueryResultAccessor<TData, TError> = ValueAccessor<
  QueryObserverResult<TData, TError>
> & {
  /** Refetches the current query. */
  refetch: QueryObserverResult<TData, TError>['refetch']
  /** Resolves with an optimistic query result, fetching first when needed. */
  suspense: () => Promise<QueryObserverResult<TData, TError>>
  /** Removes the controller from its Lit host and unsubscribes observers. */
  destroy: () => void
}

function createPendingQueryResult<TData, TError>(): QueryObserverResult<
  TData,
  TError
> {
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
      Promise.reject(createMissingQueryClientError())) as QueryObserverResult<
      TData,
      TError
    >['refetch'],
    promise: Promise.resolve(undefined as never),
  } as unknown as QueryObserverResult<TData, TError>
}

class QueryController<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
> extends BaseController<QueryObserverResult<TData, TError>> {
  private readonly options: Accessor<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >
  private observer:
    | QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    | undefined
  private unsubscribe: (() => void) | undefined
  private queryClient: QueryClient | undefined

  constructor(
    host: ReactiveControllerHost,
    options: Accessor<
      CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
    >,
    queryClient?: QueryClient,
  ) {
    const initialClient = queryClient
    super(host, createPendingQueryResult(), queryClient)
    this.options = options

    if (!initialClient) {
      return
    }

    if (typeof options === 'function') {
      return
    }

    const defaulted = this.defaultOptions(initialClient)
    const observer = new QueryObserver(initialClient, defaulted)
    this.queryClient = initialClient
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
    if (!this.syncClient()) {
      return
    }

    if (!this.connectedState) {
      return
    }

    this.refreshOptions()
    this.subscribe()
    this.observer?.updateResult()
    if (this.observer) {
      this.setResult(this.observer.getCurrentResult())
    }
  }

  refetch: QueryObserverResult<TData, TError>['refetch'] = (...args) => {
    if (!this.refreshOptions()) {
      return Promise.reject(createMissingQueryClientError())
    }

    return this.result.refetch(...args)
  }

  suspense = async (): Promise<QueryObserverResult<TData, TError>> => {
    if (!this.syncClient() || !this.observer || !this.queryClient) {
      throw createMissingQueryClientError()
    }

    const options = this.defaultOptions(this.queryClient)
    this.observer.setOptions(options)
    const optimistic = this.observer.getOptimisticResult(options)
    if (options.enabled !== false && optimistic.isStale) {
      return this.observer.fetchOptimistic(options)
    }

    return optimistic
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
      this.setResult(createPendingQueryResult())
      return false
    }

    if (nextClient === this.queryClient && this.observer) {
      return true
    }

    this.unsubscribeObserver()
    this.queryClient = nextClient
    const options = this.defaultOptions()
    this.observer = new QueryObserver(this.queryClient, options)
    this.setResult(this.observer.getOptimisticResult(options))
    return true
  }

  private refreshOptions(): boolean {
    if (!this.syncClient() || !this.observer) {
      return false
    }

    const options = this.defaultOptions(this.queryClient)
    this.observer.setOptions(options)
    this.setResult(this.observer.getOptimisticResult(options))
    return true
  }

  private defaultOptions(
    client = this.queryClient,
  ): DefaultedQueryObserverOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryData,
    TQueryKey
  > {
    const resolvedClient = client ?? this.tryGetQueryClient()
    if (!resolvedClient) {
      throw createMissingQueryClientError()
    }

    this.queryClient = resolvedClient
    const defaulted = resolvedClient.defaultQueryOptions(
      readAccessor(this.options),
    ) as DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
    ;(defaulted as { _optimisticResults?: 'optimistic' })._optimisticResults =
      'optimistic'
    return defaulted
  }
}

/**
 * Creates a Lit reactive controller that subscribes the host to a single query.
 *
 * The returned accessor is callable and also exposes `current`, `refetch`,
 * `suspense`, and `destroy`. When `options` is a function, it is re-read during
 * host updates so query keys and options can follow reactive host state.
 *
 * If `queryClient` is omitted, the controller resolves the client from the
 * nearest connected `QueryClientProvider`.
 *
 * @param host - The Lit reactive controller host that owns the query
 * subscription.
 * @param options - Query observer options, or a getter that returns options.
 * @param queryClient - Optional explicit query client. Provide this for
 * controllers that should not resolve a client from Lit context.
 * @returns An accessor for the latest query result with query helper methods.
 *
 * @example
 * ```ts
 * import { LitElement, html } from 'lit'
 * import { createQueryController } from '@tanstack/lit-query'
 *
 * class TodosView extends LitElement {
 *   private readonly todos = createQueryController(this, {
 *     queryKey: ['todos'],
 *     queryFn: async () => fetch('/api/todos').then((r) => r.json()),
 *   })
 *
 *   render() {
 *     const query = this.todos()
 *
 *     if (query.isPending) return html`Loading...`
 *     if (query.isError) return html`Error`
 *
 *     return html`<ul>${query.data.map((todo) => html`<li>${todo.title}</li>`)}</ul>`
 *   }
 * }
 * ```
 */
export function createQueryController<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  host: ReactiveControllerHost,
  options: Accessor<
    CreateQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
  queryClient?: QueryClient,
): QueryResultAccessor<TData, TError> {
  const controller = new QueryController(host, options, queryClient)

  return Object.assign(
    createValueAccessor(() => controller.current),
    {
      refetch: controller.refetch,
      suspense: controller.suspense,
      destroy: () => controller.destroy(),
    },
  )
}
