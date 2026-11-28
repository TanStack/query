import {
  addConsumeAwareSignal,
  addToArray,
  ensureQueryFn,
  fetchSignal,
} from './utils'
import type { FetchContext, FetchOptions, Query } from './query'
import type { QueryClient } from './queryClient'
import type {
  DefaultError,
  InfiniteData,
  InfiniteQueryPageParamsOptions,
} from './types'
import type { FetchSignalContext } from './utils'

/**
 * Captures the options and cached pages for this fetch before the cache notifies listeners.
 * @param client - Client that owns the query.
 * @param query - The cached infinite query.
 * @param fetchOptions - Options for the fetch in progress.
 * @param addSignal - Attaches the query's cancellation signal without consuming it.
 * @returns The fetcher to use for the first attempt and subsequent retries.
 */
export function createInfiniteFetch(
  client: QueryClient,
  query: Query,
  fetchOptions: FetchOptions | undefined,
  addSignal: (context: object) => asserts context is { signal: AbortSignal },
) {
  const { queryKey, options, state } = query as Query<
    unknown,
    DefaultError,
    InfiniteData<unknown>
  >
  const context = { client, queryKey, options, state, fetchOptions }
  addSignal(context)
  return prepareInfiniteFetch(context, query)
}

/**
 * Creates the page fetcher for an infinite query. A retry continues from the
 * failed page. A new fetch starts with the most recently cached pages.
 * @param context - The fetch in progress, including its options and cached pages.
 * @param query - The query supplied to a custom persister.
 * @returns A fetcher that resumes pagination at the failed page on retry.
 */
export function prepareInfiniteFetch<TQueryFnData, TError, TData, TPageParam>(
  context: Omit<
    FetchContext<TQueryFnData, TError, InfiniteData<TData, TPageParam>>,
    'fetchFn'
  >,
  query: Query,
) {
  const { client, queryKey, state, fetchOptions } = context
  const options = context.options as typeof context.options &
    InfiniteQueryPageParamsOptions<TData> & {
      pages?: number
    }
  const direction = fetchOptions?.meta?.fetchMore?.direction
  let result: InfiniteData<unknown> = { pages: [], pageParams: [] }
  const previousData = state.data ?? result
  let currentPage = 0

  const fetchFn = async () => {
    let cancelled = false
    const signalContext: FetchSignalContext = context
    const queryFn = ensureQueryFn(options, fetchOptions)

    // Create function to fetch a page
    const fetchPage = async (
      data: InfiniteData<unknown>,
      param: unknown,
      previous?: boolean,
    ): Promise<InfiniteData<unknown>> => {
      if (cancelled) {
        throw context.signal.reason
      }

      if (param == null && data.pages.length) {
        return data
      }

      const queryFnContext = addConsumeAwareSignal(
        {
          client,
          queryKey,
          pageParam: param,
          meta: options.meta,
        },
        () => context.signal,
        () => (cancelled = true),
        signalContext[fetchSignal],
      )

      const page = await queryFn(queryFnContext)

      const { maxPages } = options
      return {
        pages: addToArray(data.pages, page, maxPages, previous),
        pageParams: addToArray(data.pageParams, param, maxPages, previous),
      }
    }

    // fetch next / previous page?
    if (direction && previousData.pages.length) {
      const previous = direction === 'backward'
      const param = getPageParam(options, previousData, previous)

      result = await fetchPage(previousData, param, previous)
    } else {
      const remainingPages = options.pages ?? previousData.pages.length

      // Fetch all pages
      do {
        const param =
          currentPage === 0
            ? previousData.pageParams[0] === undefined
              ? options.initialPageParam
              : previousData.pageParams[0]
            : getPageParam(options, result)
        if (currentPage > 0 && param == null) {
          break
        }
        result = await fetchPage(result, param)
        currentPage++
      } while (currentPage < remainingPages)
    }

    return result
  }
  if (options.persister) {
    return () => {
      return options.persister?.(
        fetchFn as any,
        {
          client,
          queryKey,
          meta: options.meta,
          signal: context.signal,
        },
        query,
      )
    }
  }
  return fetchFn
}

/**
 * Resolves a page cursor from the edge of the cached pages.
 * @param options - The cursor functions supplied with the query.
 * @param data - The cached pages with their corresponding parameters.
 * @param previous - Reads the leading edge for backward pagination.
 * @returns The cursor for the next request, or undefined when there is no page.
 */
function getPageParam(
  options: InfiniteQueryPageParamsOptions<any>,
  data: InfiniteData<unknown> | undefined,
  previous = false,
): unknown {
  if (!data?.pages.length) return
  const { pages, pageParams } = data
  const index = previous ? 0 : -1
  return options[previous ? 'getPreviousPageParam' : 'getNextPageParam']?.(
    pages.at(index),
    pages,
    pageParams.at(index),
    pageParams,
  )
}

/**
 * Checks if there is a next page.
 * @param options - The infinite query options with `getNextPageParam`.
 * @param data - The current pages and page params.
 * @returns `true` if `getNextPageParam` returns a value other than `null` or `undefined`.
 */
export function hasNextPage(
  options: InfiniteQueryPageParamsOptions<any, any>,
  data?: InfiniteData<unknown>,
): boolean {
  return getPageParam(options, data) != null
}

/**
 * Checks if there is a previous page.
 * @param options - The infinite query options with `getPreviousPageParam`.
 * @param data - The current pages and page params.
 * @returns `true` if `getPreviousPageParam` is set and returns a value other than `null` or
 * `undefined`.
 */
export function hasPreviousPage(
  options: InfiniteQueryPageParamsOptions<any, any>,
  data?: InfiniteData<unknown>,
): boolean {
  return getPageParam(options, data, true) != null
}

/**
 * Attaches paging to the options that create or restore an infinite query.
 * @param options - Options accepted by an infinite query or observer.
 * @returns Options that install the page fetcher on the cached query.
 */
export function infiniteFetchOptions<TOptions extends object>(
  options: TOptions,
) {
  return {
    ...options,
    _type: 'infinite' as const,
    _prepareInfiniteFetch: createInfiniteFetch,
  }
}
