import { QueryObserver } from './queryObserver'
import {
  hasNextPage,
  hasPreviousPage,
  infiniteQueryBehavior,
} from './infiniteQueryBehavior'
import type {
  DefaultedInfiniteQueryObserverOptions,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
} from './types'
import type { QueryClient } from './queryClient'
import type { NotifyOptions, ObserverFetchOptions } from './queryObserver'
import type { Query } from './query'

type InfiniteQueryObserverListener<TData, TError> = (
  result: InfiniteQueryObserverResult<TData, TError>,
) => void

export class InfiniteQueryObserver<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
> extends QueryObserver<
  TQueryFnData,
  TError,
  InfiniteData<TData>,
  InfiniteData<TQueryData>,
  TQueryKey
> {
  // Type override
  subscribe!: (
    listener?: InfiniteQueryObserverListener<TData, TError>,
  ) => () => void

  // Type override
  getCurrentResult!: () => InfiniteQueryObserverResult<TData, TError>

  // Type override
  protected fetch!: (
    fetchOptions: ObserverFetchOptions,
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ) {
    super(client, options)
  }

  protected bindMethods(): void {
    super.bindMethods()
    this.fetchNextPage = this.fetchNextPage.bind(this)
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this)
  }

  setOptions(
    options?: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
    notifyOptions?: NotifyOptions,
  ): void {
    super.setOptions(
      {
        ...options,
        behavior: infiniteQueryBehavior(),
      },
      notifyOptions,
    )
  }

  getOptimisticResult(
    options: DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): InfiniteQueryObserverResult<TData, TError> {
    options.behavior = infiniteQueryBehavior()
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TData,
      TError
    >
  }

  fetchNextPage({ pageParam, ...options }: FetchNextPageOptions = {}): Promise<
    InfiniteQueryObserverResult<TData, TError>
  > {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'forward', pageParam },
      },
    })
  }

  fetchPreviousPage({
    pageParam,
    ...options
  }: FetchPreviousPageOptions = {}): Promise<
    InfiniteQueryObserverResult<TData, TError>
  > {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'backward', pageParam },
      },
    })
  }

  protected createResult(
    query: Query<TQueryFnData, TError, InfiniteData<TQueryData>, TQueryKey>,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >,
  ): InfiniteQueryObserverResult<TData, TError> {
    const { state } = query
    const result = super.createResult(query, options)

    const { isFetching, isRefetching } = result

    const isFetchingNextPage =
      isFetching && state.fetchMeta?.fetchMore?.direction === 'forward'

    const isFetchingPreviousPage =
      isFetching && state.fetchMeta?.fetchMore?.direction === 'backward'

    return {
      ...result,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data?.pages),
      hasPreviousPage: hasPreviousPage(options, state.data?.pages),
      isFetchingNextPage,
      isFetchingPreviousPage,
      isRefetching:
        isRefetching && !isFetchingNextPage && !isFetchingPreviousPage,
    }
  }
}
