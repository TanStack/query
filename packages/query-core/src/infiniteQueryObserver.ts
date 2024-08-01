import { QueryObserver } from './queryObserver'
import {
  hasNextPage,
  hasPreviousPage,
  infiniteQueryBehavior,
} from './infiniteQueryBehavior'
import type {
  DefaultError,
  DefaultedInfiniteQueryObserverOptions,
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverBaseResult,
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
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends QueryObserver<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryData, TPageParam>,
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

  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
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
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
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
      TQueryKey,
      TPageParam
    >,
  ): InfiniteQueryObserverResult<TData, TError> {
    options.behavior = infiniteQueryBehavior()
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TData,
      TError
    >
  }

  fetchNextPage(
    options?: FetchNextPageOptions,
  ): Promise<InfiniteQueryObserverResult<TData, TError>> {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'forward' },
      },
    })
  }

  fetchPreviousPage(
    options?: FetchPreviousPageOptions,
  ): Promise<InfiniteQueryObserverResult<TData, TError>> {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'backward' },
      },
    })
  }

  protected createResult(
    query: Query<
      TQueryFnData,
      TError,
      InfiniteData<TQueryData, TPageParam>,
      TQueryKey
    >,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey,
      TPageParam
    >,
  ): InfiniteQueryObserverResult<TData, TError> {
    const { state } = query
    const parentResult = super.createResult(query, options)

    const { isFetching, isRefetching, isError, isRefetchError } = parentResult
    const fetchDirection = state.fetchMeta?.fetchMore?.direction

    const isFetchNextPageError = isError && fetchDirection === 'forward'
    const isFetchingNextPage = isFetching && fetchDirection === 'forward'

    const isFetchPreviousPageError = isError && fetchDirection === 'backward'
    const isFetchingPreviousPage = isFetching && fetchDirection === 'backward'

    const result: InfiniteQueryObserverBaseResult<TData, TError> = {
      ...parentResult,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data),
      hasPreviousPage: hasPreviousPage(options, state.data),
      isFetchNextPageError,
      isFetchingNextPage,
      isFetchPreviousPageError,
      isFetchingPreviousPage,
      isRefetchError:
        isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
      isRefetching:
        isRefetching && !isFetchingNextPage && !isFetchingPreviousPage,
    }

    return result as InfiniteQueryObserverResult<TData, TError>
  }
}
