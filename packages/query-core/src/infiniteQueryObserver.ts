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
  TData = unknown,
  TError = DefaultError,
  TSelectData = TData,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends QueryObserver<
  InfiniteData<TData, TPageParam>,
  TError,
  TSelectData,
  TQueryKey
> {
  // Type override
  subscribe!: (
    listener?: InfiniteQueryObserverListener<TSelectData, TError>,
  ) => () => void

  // Type override
  getCurrentResult!: () => InfiniteQueryObserverResult<TSelectData, TError>

  // Type override
  protected fetch!: (
    fetchOptions: ObserverFetchOptions,
  ) => Promise<InfiniteQueryObserverResult<TSelectData, TError>>

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TData,
      TError,
      TSelectData,
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
    options?: InfiniteQueryObserverOptions<
      TData,
      TError,
      TSelectData,
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
      TData,
      TError,
      TSelectData,
      TQueryKey,
      TPageParam
    >,
  ): InfiniteQueryObserverResult<TSelectData, TError> {
    options.behavior = infiniteQueryBehavior()
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TSelectData,
      TError
    >
  }

  fetchNextPage(
    options?: FetchNextPageOptions,
  ): Promise<InfiniteQueryObserverResult<TSelectData, TError>> {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'forward' },
      },
    })
  }

  fetchPreviousPage(
    options?: FetchPreviousPageOptions,
  ): Promise<InfiniteQueryObserverResult<TSelectData, TError>> {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'backward' },
      },
    })
  }

  protected createResult(
    query: Query<
      InfiniteData<TData, TPageParam>,
      TError,
      TQueryKey
    >,
    options: InfiniteQueryObserverOptions<
      TData,
      TError,
      TSelectData,
      TQueryKey,
      TPageParam
    >,
  ): InfiniteQueryObserverResult<TSelectData, TError> {
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
      hasNextPage: hasNextPage(options, state.data),
      hasPreviousPage: hasPreviousPage(options, state.data),
      isFetchingNextPage,
      isFetchingPreviousPage,
      isRefetching:
        isRefetching && !isFetchingNextPage && !isFetchingPreviousPage,
    }
  }
}
