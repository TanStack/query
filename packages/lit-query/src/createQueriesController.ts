import {
  QueriesObserver,
  type DefaultError,
  type DefinedQueryObserverResult,
  type OmitKeyof,
  type QueriesObserverOptions,
  type QueryFunction,
  type QueryKey,
  type QueryObserverOptions,
  type QueryObserverResult,
  type ThrowOnError,
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

export type CreateQueriesInput<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = QueryObserverOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey>

type CreateQueriesInputForController<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> = OmitKeyof<CreateQueriesInput<TQueryFnData, TError, TData, TQueryKey>, never>

type MAXIMUM_DEPTH = 20

type SkipTokenForCreateQueries = symbol

type GetCreateQueriesInput<T> = T extends {
  queryFnData: infer TQueryFnData
  error?: infer TError
  data: infer TData
}
  ? CreateQueriesInputForController<TQueryFnData, TError, TData>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? CreateQueriesInputForController<TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? CreateQueriesInputForController<unknown, TError, TData>
      : T extends [infer TQueryFnData, infer TError, infer TData]
        ? CreateQueriesInputForController<TQueryFnData, TError, TData>
        : T extends [infer TQueryFnData, infer TError]
          ? CreateQueriesInputForController<TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? CreateQueriesInputForController<TQueryFnData>
            : T extends {
                  queryFn?:
                    | QueryFunction<infer TQueryFnData, infer TQueryKey>
                    | SkipTokenForCreateQueries
                  select?: (data: any) => infer TData
                  throwOnError?: ThrowOnError<any, infer TError, any, any>
                }
              ? CreateQueriesInputForController<
                  TQueryFnData,
                  unknown extends TError ? DefaultError : TError,
                  unknown extends TData ? TQueryFnData : TData,
                  TQueryKey
                >
              : CreateQueriesInputForController

type GetDefinedOrUndefinedCreateQueriesResult<
  T,
  TData,
  TError = unknown,
> = T extends {
  initialData?: infer TInitialData
}
  ? unknown extends TInitialData
    ? QueryObserverResult<TData, TError>
    : TInitialData extends TData
      ? DefinedQueryObserverResult<TData, TError>
      : TInitialData extends () => infer TInitialDataResult
        ? unknown extends TInitialDataResult
          ? QueryObserverResult<TData, TError>
          : TInitialDataResult extends TData
            ? DefinedQueryObserverResult<TData, TError>
            : QueryObserverResult<TData, TError>
        : QueryObserverResult<TData, TError>
  : QueryObserverResult<TData, TError>

type GetCreateQueriesResult<T> = T extends {
  queryFnData: any
  error?: infer TError
  data: infer TData
}
  ? GetDefinedOrUndefinedCreateQueriesResult<T, TData, TError>
  : T extends { queryFnData: infer TQueryFnData; error?: infer TError }
    ? GetDefinedOrUndefinedCreateQueriesResult<T, TQueryFnData, TError>
    : T extends { data: infer TData; error?: infer TError }
      ? GetDefinedOrUndefinedCreateQueriesResult<T, TData, TError>
      : T extends [any, infer TError, infer TData]
        ? GetDefinedOrUndefinedCreateQueriesResult<T, TData, TError>
        : T extends [infer TQueryFnData, infer TError]
          ? GetDefinedOrUndefinedCreateQueriesResult<T, TQueryFnData, TError>
          : T extends [infer TQueryFnData]
            ? GetDefinedOrUndefinedCreateQueriesResult<T, TQueryFnData>
            : T extends {
                  queryFn?:
                    | QueryFunction<infer TQueryFnData, any>
                    | SkipTokenForCreateQueries
                  select?: (data: any) => infer TData
                  throwOnError?: ThrowOnError<any, infer TError, any, any>
                }
              ? GetDefinedOrUndefinedCreateQueriesResult<
                  T,
                  unknown extends TData ? TQueryFnData : TData,
                  unknown extends TError ? DefaultError : TError
                >
              : QueryObserverResult

export type CreateQueriesOptions<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<CreateQueriesInputForController>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetCreateQueriesInput<Head>]
      : T extends [infer Head, ...infer Tails]
        ? CreateQueriesOptions<
            [...Tails],
            [...TResults, GetCreateQueriesInput<Head>],
            [...TDepth, 1]
          >
        : ReadonlyArray<unknown> extends T
          ? T
          : T extends Array<
                CreateQueriesInputForController<
                  infer TQueryFnData,
                  infer TError,
                  infer TData,
                  infer TQueryKey
                >
              >
            ? Array<
                CreateQueriesInputForController<
                  TQueryFnData,
                  TError,
                  TData,
                  TQueryKey
                >
              >
            : Array<CreateQueriesInputForController>

export type CreateQueriesResults<
  T extends Array<any>,
  TResults extends Array<any> = [],
  TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
  ? Array<QueryObserverResult>
  : T extends []
    ? []
    : T extends [infer Head]
      ? [...TResults, GetCreateQueriesResult<Head>]
      : T extends [infer Head, ...infer Tails]
        ? CreateQueriesResults<
            [...Tails],
            [...TResults, GetCreateQueriesResult<Head>],
            [...TDepth, 1]
          >
        : { [K in keyof T]: GetCreateQueriesResult<T[K]> }

export type CreateQueriesControllerOptions<
  TQueryOptions extends Array<any> = Array<any>,
  TCombinedResult = CreateQueriesResults<TQueryOptions>,
> = {
  queries: Accessor<
    | readonly [...CreateQueriesOptions<TQueryOptions>]
    | readonly [
        ...{
          [K in keyof TQueryOptions]: GetCreateQueriesInput<TQueryOptions[K]>
        },
      ]
  >
  combine?: (result: CreateQueriesResults<TQueryOptions>) => TCombinedResult
}

export type QueriesResultAccessor<TCombinedResult> =
  ValueAccessor<TCombinedResult> & {
    destroy: () => void
  }

function createPendingQueryObserverResult(): QueryObserverResult {
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
      )) as QueryObserverResult['refetch'],
    promise: Promise.resolve(undefined as never),
  } as unknown as QueryObserverResult
}

function createPlaceholderQueryObserverResult(
  query: QueryObserverOptions,
): QueryObserverResult {
  const initialData =
    typeof query.initialData === 'function'
      ? query.initialData()
      : query.initialData

  if (initialData === undefined) {
    return createPendingQueryObserverResult()
  }

  const data = query.select ? query.select(initialData) : initialData
  const initialDataUpdatedAt =
    typeof query.initialDataUpdatedAt === 'function'
      ? query.initialDataUpdatedAt()
      : query.initialDataUpdatedAt

  return {
    ...createPendingQueryObserverResult(),
    data,
    dataUpdatedAt: initialDataUpdatedAt ?? Date.now(),
    isPending: false,
    isInitialLoading: false,
    isLoading: false,
    isSuccess: true,
    status: 'success',
    promise: Promise.resolve(data as never),
  } as QueryObserverResult
}

function resolveQueriesOptions<TCombinedResult>(
  optionsAccessor: Accessor<
    CreateQueriesControllerOptions<any, TCombinedResult>
  >,
  client: QueryClient,
): {
  queries: Array<QueryObserverOptions>
  combine: QueriesObserverOptions<TCombinedResult>['combine']
} {
  const resolvedOptions = readAccessor(optionsAccessor)
  const resolvedQueries = readAccessor(resolvedOptions.queries)
  const combine =
    resolvedOptions.combine as QueriesObserverOptions<TCombinedResult>['combine']

  return {
    queries: resolvedQueries.map((query) => {
      const defaulted = client.defaultQueryOptions(
        query as QueryObserverOptions,
      )
      ;(defaulted as { _optimisticResults?: 'optimistic' })._optimisticResults =
        'optimistic'
      return defaulted
    }),
    combine,
  }
}

class QueriesController<
  TQueryOptions extends Array<any>,
  TCombinedResult,
> extends BaseController<TCombinedResult> {
  private readonly options: Accessor<
    CreateQueriesControllerOptions<TQueryOptions, TCombinedResult>
  >
  private observer: QueriesObserver<TCombinedResult> | undefined
  private unsubscribe: (() => void) | undefined
  private queryClient: QueryClient | undefined
  private explicitInitializationError: unknown | undefined
  private placeholderInitialized = false
  private placeholderRetryableFailure = true

  constructor(
    host: ReactiveControllerHost,
    options: Accessor<
      CreateQueriesControllerOptions<TQueryOptions, TCombinedResult>
    >,
    queryClient?: QueryClient,
  ) {
    super(host, [] as unknown as TCombinedResult, queryClient)
    this.options = options

    queueMicrotask(() => {
      this.placeholderRetryableFailure = false
    })

    if (!queryClient) {
      return
    }

    if (this.shouldRefreshOnHostUpdate()) {
      return
    }

    this.tryInitializeExplicitClient(queryClient)
  }

  protected onConnected(): void {
    if (!this.syncClient()) {
      return
    }

    this.refreshOptions()
    this.subscribe()
  }

  protected onDisconnected(): void {
    this.unsubscribeObserver()
    this.syncClient()
  }

  protected onHostUpdate(): void {
    if (!this.shouldRefreshOnHostUpdate()) {
      return
    }

    if (!this.refreshOptions()) {
      this.setPlaceholderResult()
    }
  }

  protected onQueryClientChanged(): void {
    if (!this.syncClient() || !this.connectedState) {
      return
    }

    this.refreshOptions()
    this.subscribe()
  }

  private subscribe(): void {
    if (!this.observer) {
      return
    }

    if (this.unsubscribe) {
      return
    }

    this.unsubscribe = this.observer.subscribe((next) => {
      const { combine } = this.readResolvedOptions()
      this.setResult(this.computeResult(next, combine))
    })
  }

  private tryInitializeExplicitClient(queryClient: QueryClient): boolean {
    try {
      const { queries, combine } = resolveQueriesOptions(
        this.options,
        queryClient,
      )
      const observer = new QueriesObserver(queryClient, queries, {
        combine,
      } as QueriesObserverOptions<TCombinedResult>)
      this.queryClient = queryClient
      this.observer = observer
      this.result = this.computeResult(observer.getCurrentResult(), combine)
      this.explicitInitializationError = undefined
      this.placeholderInitialized = true
      return true
    } catch (error) {
      // Retry after construction completes so late host fields used by
      // static queries/combine callbacks can finish initializing first.
      this.explicitInitializationError = error
      this.queryClient = undefined
      this.observer = undefined
      return false
    }
  }

  private retryExplicitInitializationIfNeeded(): boolean {
    if (!this.explicitInitializationError || this.shouldRefreshOnHostUpdate()) {
      return false
    }

    const explicitClient = this.tryGetQueryClient()
    if (!explicitClient) {
      return false
    }

    return this.tryInitializeExplicitClient(explicitClient)
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
      this.setPlaceholderResult()
      return false
    }

    if (nextClient === this.queryClient) {
      return true
    }

    this.unsubscribeObserver()
    this.queryClient = nextClient
    const { queries, combine } = this.readResolvedOptions()
    this.observer = new QueriesObserver(this.queryClient, queries, {
      combine,
    } as QueriesObserverOptions<TCombinedResult>)
    this.setResult(
      this.computeResult(this.observer.getCurrentResult(), combine),
    )
    this.placeholderInitialized = true
    return true
  }

  private refreshOptions(): boolean {
    if (!this.syncClient() || !this.observer) {
      return false
    }

    const { queries, combine } = this.readResolvedOptions()

    this.observer.setQueries(queries, {
      combine,
    } as QueriesObserverOptions<TCombinedResult>)

    const [rawResult, getCombinedResult] = this.observer.getOptimisticResult(
      queries,
      combine,
    )

    this.setResult(getCombinedResult(rawResult))
    return true
  }

  private readResolvedOptions(client = this.queryClient): {
    queries: Array<QueryObserverOptions>
    combine: QueriesObserverOptions<TCombinedResult>['combine']
  } {
    if (!client) {
      throw createMissingQueryClientError()
    }

    return resolveQueriesOptions(
      this.options as Accessor<
        CreateQueriesControllerOptions<any, TCombinedResult>
      >,
      client,
    )
  }

  private shouldRefreshOnHostUpdate(): boolean {
    if (typeof this.options === 'function') {
      return true
    }

    return typeof this.options.queries === 'function'
  }

  private computeResult(
    rawResult: Array<QueryObserverResult>,
    combine: QueriesObserverOptions<TCombinedResult>['combine'],
  ): TCombinedResult {
    return (combine ? combine(rawResult) : rawResult) as TCombinedResult
  }

  private static createPlaceholderResult<TCombinedResult>(
    optionsAccessor: Accessor<
      CreateQueriesControllerOptions<any, TCombinedResult>
    >,
  ): TCombinedResult {
    const resolvedOptions = readAccessor(optionsAccessor)
    const queries = readAccessor(resolvedOptions.queries)
    const placeholders = queries.map((query) =>
      createPlaceholderQueryObserverResult(query as QueryObserverOptions),
    )
    return (
      resolvedOptions.combine
        ? resolvedOptions.combine(placeholders as never)
        : placeholders
    ) as TCombinedResult
  }

  readCurrent(): TCombinedResult {
    if (this.retryExplicitInitializationIfNeeded()) {
      return this.current
    }

    if (this.explicitInitializationError && !this.placeholderRetryableFailure) {
      throw this.explicitInitializationError
    }

    if (!this.queryClient && !this.observer && !this.placeholderInitialized) {
      try {
        // Early reads can happen during class-field initialization, before
        // accessors referenced by queries/combine are ready. Retry normally
        // after construction finishes and only surface errors after that point.
        this.setPlaceholderResult()
      } catch (error) {
        if (!this.placeholderRetryableFailure) {
          throw error
        }
      }
    }

    return this.current
  }

  private setPlaceholderResult(): void {
    this.result = QueriesController.createPlaceholderResult(this.options)
    this.placeholderInitialized = true
  }
}

export function createQueriesController<
  TQueryOptions extends Array<any>,
  TCombinedResult = CreateQueriesResults<TQueryOptions>,
>(
  host: ReactiveControllerHost,
  options: Accessor<
    CreateQueriesControllerOptions<TQueryOptions, TCombinedResult>
  >,
  queryClient?: QueryClient,
): QueriesResultAccessor<TCombinedResult> {
  const controller = new QueriesController(host, options, queryClient)

  return Object.assign(
    createValueAccessor(() => controller.readCurrent()),
    {
      destroy: () => controller.destroy(),
    },
  )
}
