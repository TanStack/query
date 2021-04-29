import type {
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
} from './types'
import type { QueryClient } from './queryClient'
import { ObserverFetchOptions, QueryObserver } from './queryObserver'
import {
  hasNextPage,
  hasPreviousPage,
  infiniteQueryBehavior,
} from './infiniteQueryBehavior'
import { Query } from './query'

type InfiniteQueryObserverListener<TData, TError> = (
  result: InfiniteQueryObserverResult<TData, TError>
) => void

export class InfiniteQueryObserver<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData
> extends QueryObserver<
  TQueryFnData,
  TError,
  InfiniteData<TData>,
  InfiniteData<TQueryData>
> {
  // Type override
  subscribe!: (
    listener?: InfiniteQueryObserverListener<TData, TError>
  ) => () => void

  // Type override
  getCurrentResult!: () => InfiniteQueryObserverResult<TData, TError>

  // Type override
  protected fetch!: (
    fetchOptions?: ObserverFetchOptions
  ) => Promise<InfiniteQueryObserverResult<TData, TError>>

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData
    >
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
      TQueryData
    >
  ): void {
    super.setOptions({
      ...options,
      behavior: infiniteQueryBehavior(),
    })
  }

  getOptimisticResult(
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData
    >
  ): InfiniteQueryObserverResult<TData, TError> {
    options.behavior = infiniteQueryBehavior()
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TData,
      TError
    >
  }

  fetchNextPage(
    options?: FetchNextPageOptions
  ): Promise<InfiniteQueryObserverResult<TData, TError>> {
    return this.fetch({
      cancelRefetch: true,
      throwOnError: options?.throwOnError,
      meta: {
        fetchMore: { direction: 'forward', pageParam: options?.pageParam },
      },
    })
  }

  fetchPreviousPage(
    options?: FetchPreviousPageOptions
  ): Promise<InfiniteQueryObserverResult<TData, TError>> {
    return this.fetch({
      cancelRefetch: true,
      throwOnError: options?.throwOnError,
      meta: {
        fetchMore: { direction: 'backward', pageParam: options?.pageParam },
      },
    })
  }

  protected createResult(
    query: Query<TQueryFnData, TError, InfiniteData<TQueryData>>,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData
    >
  ): InfiniteQueryObserverResult<TData, TError> {
    const { state } = query
    const result = super.createResult(query, options)
    return {
      ...result,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options, state.data?.pages),
      hasPreviousPage: hasPreviousPage(options, state.data?.pages),
      isFetchingNextPage:
        state.isFetching && state.fetchMeta?.fetchMore?.direction === 'forward',
      isFetchingPreviousPage:
        state.isFetching &&
        state.fetchMeta?.fetchMore?.direction === 'backward',
    }
  }
}
