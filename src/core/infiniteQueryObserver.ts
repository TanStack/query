import type {
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
} from './types'
import type { QueryClient } from './queryClient'
import {
  NotifyOptions,
  ObserverFetchOptions,
  QueryObserver,
} from './queryObserver'
import {
  hasNextPage,
  hasPreviousPage,
  infiniteQueryBehavior,
} from './infiniteQueryBehavior'
import { Query } from './query'

type InfiniteQueryObserverListener<TData, TError, SData> = (
  result: InfiniteQueryObserverResult<TData, TError, SData>
) => void

export class InfiniteQueryObserver<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  SData = unknown
> extends QueryObserver<
  TQueryFnData,
  TError,
  InfiniteData<TData, SData>,
  InfiniteData<TQueryData>
> {
  // Type override
  subscribe!: (
    listener?: InfiniteQueryObserverListener<TData, TError, SData>
  ) => () => void

  // Type override
  getCurrentResult!: () => InfiniteQueryObserverResult<TData, TError, SData>

  // Type override
  protected fetch!: (
    fetchOptions?: ObserverFetchOptions
  ) => Promise<InfiniteQueryObserverResult<TData, TError, SData>>

  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      SData
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
      TQueryData,
      SData
    >,
    notifyOptions?: NotifyOptions
  ): void {
    super.setOptions(
      {
        ...options,
        behavior: infiniteQueryBehavior(),
      },
      notifyOptions
    )
  }

  getOptimisticResult(
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      SData
    >
  ): InfiniteQueryObserverResult<TData, TError, SData> {
    options.behavior = infiniteQueryBehavior()
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TData,
      TError,
      SData
    >
  }

  fetchNextPage(
    options?: FetchNextPageOptions
  ): Promise<InfiniteQueryObserverResult<TData, TError, SData>> {
    return this.fetch({
      // TODO consider removing `?? true` in future breaking change, to be consistent with `refetch` API (see https://github.com/tannerlinsley/react-query/issues/2617)
      cancelRefetch: options?.cancelRefetch ?? true,
      throwOnError: options?.throwOnError,
      meta: {
        fetchMore: { direction: 'forward', pageParam: options?.pageParam },
      },
    })
  }

  fetchPreviousPage(
    options?: FetchPreviousPageOptions
  ): Promise<InfiniteQueryObserverResult<TData, TError, SData>> {
    return this.fetch({
      // TODO consider removing `?? true` in future breaking change, to be consistent with `refetch` API (see https://github.com/tannerlinsley/react-query/issues/2617)
      cancelRefetch: options?.cancelRefetch ?? true,
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
      TQueryData,
      SData
    >
  ): InfiniteQueryObserverResult<TData, TError, SData> {
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
