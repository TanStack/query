import { QueryObserver } from './queryObserver'
import { hasNextPage, hasPreviousPage } from './infiniteQueryBehavior'
import type {
  QueryObserverResultContext,
  QueryObserverResultReader,
} from './queryObserver'
import type { Subscribable } from './subscribable'
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
  QueryObserverResult,
} from './types'
import type { QueryClient } from './queryClient'
import type { Query } from './query'

type InfiniteQueryObserverListener<TData, TError> = (
  result: InfiniteQueryObserverResult<TData, TError>,
) => void

/**
 * An `InfiniteQueryObserver` extends `QueryObserver` to observe and switch
 * between infinite queries. It augments the base `QueryObserverResult` with
 * infinite-query-specific fields and methods, such as `hasNextPage` and
 * `fetchNextPage`, and is the primitive that framework adapters (e.g.
 * `useInfiniteQuery`) build their hooks on top of.
 * @example
 * ```ts
 * const observer = new InfiniteQueryObserver(queryClient, {
 *   queryKey: ['projects'],
 *   queryFn: ({ pageParam }) => fetchProjects(pageParam),
 *   initialPageParam: 0,
 *   getNextPageParam: (lastPage) => lastPage.nextCursor,
 * })
 *
 * const unsubscribe = observer.subscribe((result) => console.log(result))
 * ```
 */
export class InfiniteQueryObserver<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
> extends QueryObserver<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey
> {
  // Type override
  subscribe!: Subscribable<
    InfiniteQueryObserverListener<TData, TError>
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
    InfiniteQueryObserverResult<TData, TError>
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
    Promise<InfiniteQueryObserverResult<TData, TError>>
  >

  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
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

  /**
   * Updates the observer's options. Behaves the same as
   * `QueryObserver.setOptions`, additionally marking the options as
   * belonging to an infinite query before delegating to the base
   * implementation.
   */
  setOptions(
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): void {
    options._type = 'infinite'
    super.setOptions(options)
  }

  /**
   * The infinite-query counterpart of {@link QueryObserver#getOptimisticResult}.
   * Computes the result through a separate result reader without changing the
   * observer's committed result, options, or selection state.
   * @deprecated Use `createResultReader(options).getSnapshot()` instead.
   */
  getOptimisticResult(
    options: DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): InfiniteQueryObserverResult<TData, TError> {
    return this.createResultReader(options).getSnapshot()
  }

  /** Creates a cached snapshot reader for an infinite query. */
  createResultReader(
    options: DefaultedInfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
  ): QueryObserverResultReader<InfiniteQueryObserverResult<TData, TError>> {
    return super.createResultReader({
      ...options,
      _type: 'infinite',
    }) as QueryObserverResultReader<InfiniteQueryObserverResult<TData, TError>>
  }

  /**
   * Fetches the next page of the infinite query and returns a promise that
   * resolves with the resulting `InfiniteQueryObserverResult`. The page
   * param used for the fetch is determined by `getNextPageParam`, which
   * receives the current pages/page params and whose result also determines
   * `hasNextPage`.
   * @example
   * ```ts
   * const { hasNextPage } = observer.getCurrentResult()
   *
   * if (hasNextPage) {
   *   await observer.fetchNextPage()
   * }
   * ```
   * @see {@link InfiniteQueryObserver#fetchPreviousPage}
   */
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

  /**
   * Fetches the previous page of the infinite query and returns a promise
   * that resolves with the resulting `InfiniteQueryObserverResult`. The page
   * param used for the fetch is determined by `getPreviousPageParam`, which
   * receives the current pages/page params and whose result also determines
   * `hasPreviousPage`.
   * @example
   * ```ts
   * const { hasPreviousPage } = observer.getCurrentResult()
   *
   * if (hasPreviousPage) {
   *   await observer.fetchPreviousPage()
   * }
   * ```
   * @see {@link InfiniteQueryObserver#fetchNextPage}
   */
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
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam
    >,
    context?: QueryObserverResultContext<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
    prevResult?: QueryObserverResult<TData, TError>,
  ): InfiniteQueryObserverResult<TData, TError> {
    const { state } = query
    const parentResult = super.createResult(query, options, context, prevResult)

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

type ReplaceReturnType<
  TFunction extends (...args: Array<any>) => unknown,
  TReturn,
> = (...args: Parameters<TFunction>) => TReturn
