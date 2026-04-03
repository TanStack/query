import { QueryObserver } from './queryObserver'
import {
  hasNextPage,
  hasPreviousPage,
  infiniteQueryBehavior,
} from './infiniteQueryBehavior'
import type { Subscribable } from './subscribable'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  FetchPageDirectionMode,
  InfiniteData,
  InfiniteQueryFetchNextPageArgs,
  InfiniteQueryFetchPreviousPageArgs,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverResult,
  QueryKey,
  QueryObserverOptions,
} from './types'
import type { QueryClient } from './queryClient'
import type { Query } from './query'

type InfiniteQueryObserverListener<
  TData,
  TError,
  TPageParam,
  TMode extends FetchPageDirectionMode,
> = (
  result: InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>,
) => void

export class InfiniteQueryObserver<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
  TMode extends FetchPageDirectionMode = undefined,
> extends QueryObserver<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey
> {
  // Type override
  subscribe!: Subscribable<
    InfiniteQueryObserverListener<TData, TError, TPageParam, TMode>
  >['subscribe']

  // Type override
  getCurrentResult!: ReplaceReturnType<
    QueryObserver<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >['getCurrentResult'],
    InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>
  >

  // Type override
  protected fetch!: ReplaceReturnType<
    QueryObserver<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >['fetch'],
    Promise<InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>>
  >

  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      TMode
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
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
  ): void {
    super.setOptions({
      ...options,
      behavior: infiniteQueryBehavior(),
    })
  }

  getOptimisticResult(
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
  ): InfiniteQueryObserverResult<TData, TError, TPageParam, TMode> {
    options.behavior = infiniteQueryBehavior()
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TData,
      TError,
      TPageParam,
      TMode
    >
  }

  fetchNextPage(
    ...args: InfiniteQueryFetchNextPageArgs<TPageParam, TMode>
  ): Promise<InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>> {
    const { pageParam, ...options } = args[0] ?? ({} as any)
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'forward', pageParam },
      },
    })
  }

  fetchPreviousPage(
    ...args: InfiniteQueryFetchPreviousPageArgs<TPageParam, TMode>
  ): Promise<InfiniteQueryObserverResult<TData, TError, TPageParam, TMode>> {
    const { pageParam, ...options } = args[0] ?? ({} as any)
    return this.fetch({
      ...options,
      meta: {
        fetchMore: { direction: 'backward', pageParam },
      },
    })
  }

  protected createResult(
    query: Query<
      TQueryFnData,
      TError,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
  ): InfiniteQueryObserverResult<TData, TError, TPageParam, TMode> {
    const { state } = query
    const parentResult = super.createResult(query, options)

    const { isFetching, isRefetching, isError, isRefetchError } = parentResult
    const fetchDirection = state.fetchMeta?.fetchMore?.direction

    const isFetchNextPageError = isError && fetchDirection === 'forward'
    const isFetchingNextPage = isFetching && fetchDirection === 'forward'

    const isFetchPreviousPageError = isError && fetchDirection === 'backward'
    const isFetchingPreviousPage = isFetching && fetchDirection === 'backward'

    const result = {
      ...parentResult,
      fetchNextPage: this.fetchNextPage,
      fetchPreviousPage: this.fetchPreviousPage,
      hasNextPage: hasNextPage(options as any, state.data),
      hasPreviousPage: hasPreviousPage(options as any, state.data),
      isFetchNextPageError,
      isFetchingNextPage,
      isFetchPreviousPageError,
      isFetchingPreviousPage,
      isRefetchError:
        isRefetchError && !isFetchNextPageError && !isFetchPreviousPageError,
      isRefetching:
        isRefetching && !isFetchingNextPage && !isFetchingPreviousPage,
    }

    return result as InfiniteQueryObserverResult<
      TData,
      TError,
      TPageParam,
      TMode
    >
  }
}

type ReplaceReturnType<
  TFunction extends (...args: Array<any>) => unknown,
  TReturn,
> = (...args: Parameters<TFunction>) => TReturn
