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

export type InfiniteQueryResultAccessor<TData, TError> = ValueAccessor<
  InfiniteQueryObserverResult<TData, TError>
> & {
  refetch: InfiniteQueryObserverResult<TData, TError>['refetch']
  fetchNextPage: InfiniteQueryObserverResult<TData, TError>['fetchNextPage']
  fetchPreviousPage: InfiniteQueryObserverResult<
    TData,
    TError
  >['fetchPreviousPage']
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
