import type {
  FetchNextPageOptions,
  FetchPreviousPageOptions,
  InfiniteData,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
} from './types'
import type {QueryClient} from './queryClient'
import type {NotifyOptions, ObserverFetchOptions} from './queryObserver'
import {QueryObserver} from './queryObserver'
import {hasNextPage, hasPreviousPage, infiniteQueryBehavior,} from './infiniteQueryBehavior'

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

  fetchNextPage({pageParam, ...options}: FetchNextPageOptions = {}): Promise<
    InfiniteQueryObserverResult<TData, TError>
  > {
    return this.fetch({
      ...options,
      meta: {
        fetchMore: {direction: 'forward', pageParam},
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
        fetchMore: {direction: 'backward', pageParam},
      },
    })
  }

  protected createResult(): InfiniteQueryObserverResult<TData, TError> {
    const {state} = this.getCurrentQuery();
    const result = super.createResult()

    const {isFetching, isRefetching} = result

    const isFetchingNextPage =
      isFetching && state.fetchMeta?.fetchMore?.direction === 'forward'

    const isFetchingPreviousPage =
      isFetching && state.fetchMeta?.fetchMore?.direction === 'backward'

    return {
      ...result,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(this.options, state.data?.pages),
      hasPreviousPage: hasPreviousPage(this.options, state.data?.pages),
      isFetchingNextPage,
      isFetchingPreviousPage,
      isRefetching:
        isRefetching && !isFetchingNextPage && !isFetchingPreviousPage,
    }
  }
}
