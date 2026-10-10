import { QueryObserver } from './queryObserver'
import { hasNextPage, hasPreviousPage } from './infiniteQueryBehavior'
import type { Subscribable } from './subscribable'
import type {
  DefaultError,
  DefaultedQueryObserverOptions,
  FetchPageDirectionMode,
  InfiniteData,
  InfiniteQueryFetchNextPageArgs,
  InfiniteQueryFetchPreviousPageArgs,
  InfiniteQueryMode,
  InfiniteQueryObserverOptions,
  InfiniteQueryObserverOptionsBase,
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
  TMode extends FetchPageDirectionMode = undefined,
> extends QueryObserver<
  TQueryFnData,
  TError,
  TData,
  InfiniteData<TQueryFnData, TPageParam>,
  TQueryKey
> {
  // Type override
  override subscribe!: Subscribable<
    InfiniteQueryObserverListener<TData, TError, TPageParam, TMode>
  >['subscribe']

  // Type override
  override getCurrentResult!: ReplaceReturnType<
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
  protected override fetch!: ReplaceReturnType<
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
      undefined
    >,
  )
  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryKey,
      TPageParam,
      InfiniteQueryMode
    >,
  )
  constructor(
    client: QueryClient,
    options: InfiniteQueryObserverOptionsBase<
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

  protected override bindMethods(): void {
    super.bindMethods()
    this.fetchNextPage = this.fetchNextPage.bind(this)
    this.fetchPreviousPage = this.fetchPreviousPage.bind(this)
  }

  /**
   * Updates the observer's options. Behaves the same as
   * `QueryObserver.setOptions`, additionally marking the options as
   * belonging to an infinite query before delegating to the base
   * implementation.
   * @param options - The new infinite query observer options.
   */
  override setOptions(
    options: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
  ): void {
    options._type = 'infinite'
    super.setOptions(options)
  }

  /**
   * The infinite-query counterpart of {@link QueryObserver#getOptimisticResult}, marking the
   * options as an infinite query before delegating to it. Called by framework adapters (e.g.
   * `useInfiniteQuery`) ahead of subscribing, to compute the current `InfiniteQueryObserverResult`
   * synchronously.
   * @param options - The defaulted infinite query observer options to compute the result for.
   * @returns The result for the given options.
   */
  override getOptimisticResult(
    options: DefaultedQueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      InfiniteData<TQueryFnData, TPageParam>,
      TQueryKey
    >,
  ): InfiniteQueryObserverResult<TData, TError, TPageParam, TMode> {
    options._type = 'infinite'
    return super.getOptimisticResult(options) as InfiniteQueryObserverResult<
      TData,
      TError,
      TPageParam,
      TMode
    >
  }

  /**
   * Fetches the next page of the infinite query and returns a promise that
   * resolves with the resulting `InfiniteQueryObserverResult`. The page
   * param used for the fetch is determined by `getNextPageParam`, which
   * receives the current pages/page params and whose result also determines
   * `hasNextPage`.
   * @param options - Set `cancelRefetch` to `false` to ignore the call while a fetch is running,
   * and `throwOnError` to `true` to reject when the fetch fails.
   * @returns A promise that resolves with the result after the next page is fetched. With
   * `cancelRefetch: false`, a running fetch is reused instead, so the next page may not be fetched.
   * @see {@link InfiniteQueryObserver#fetchPreviousPage}
   * @example
   * ```ts
   * const { hasNextPage } = observer.getCurrentResult()
   *
   * if (hasNextPage) {
   *   await observer.fetchNextPage()
   * }
   * ```
   */
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

  /**
   * Fetches the previous page of the infinite query and returns a promise
   * that resolves with the resulting `InfiniteQueryObserverResult`. The page
   * param used for the fetch is determined by `getPreviousPageParam`, which
   * receives the current pages/page params and whose result also determines
   * `hasPreviousPage`.
   * @param options - Set `cancelRefetch` to `false` to ignore the call while a fetch is running,
   * and `throwOnError` to `true` to reject when the fetch fails.
   * @returns A promise that resolves with the result after the previous page is fetched. With
   * `cancelRefetch: false`, a running fetch is reused instead, so the previous page may not be fetched.
   * @see {@link InfiniteQueryObserver#fetchNextPage}
   * @example
   * ```ts
   * const { hasPreviousPage } = observer.getCurrentResult()
   *
   * if (hasPreviousPage) {
   *   await observer.fetchPreviousPage()
   * }
   * ```
   */
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

  protected override createResult(
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
