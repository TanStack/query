import {
  addConsumeAwareSignal,
  addToArray,
  ensureQueryFn,
  fetchSignal,
} from './utils'
import type { FetchContext, Query } from './query'
import type { InfiniteData, InfiniteQueryPageParamsOptions } from './types'
import type { FetchSignalContext } from './utils'

/**
 * Creates the page fetcher for an infinite query. A retry continues from the
 * failed page. A new fetch starts with the most recently cached pages.
 * @param context - The fetch in progress, including its options and cached pages.
 * @param query - The query supplied to a custom persister.
 * @returns A fetcher that resumes pagination at the failed page on retry.
 */
export function prepareInfiniteFetch<TQueryFnData, TError, TData, TPageParam>(
  context: Omit<FetchContext<TQueryFnData, TError, TData>, 'fetchFn'>,
  query: Query,
) {
  const { client, queryKey, state, fetchOptions } = context
  const options = context.options as typeof context.options &
    InfiniteQueryPageParamsOptions<TData> & {
      pages?: number
    }
  const direction = fetchOptions?.meta?.fetchMore?.direction
  let result: InfiniteData<unknown> = { pages: [], pageParams: [] }
  const previousData =
    (state.data as InfiniteData<unknown, TPageParam> | undefined) ?? result
  let currentPage = 0

  const fetchFn = async () => {
    let cancelled = false
    const signalContext: FetchSignalContext = context
    const queryFn = ensureQueryFn(options, fetchOptions)

    const fetchMore = previousData.pages.length ? direction : undefined
    const previous = fetchMore === 'backward'
    const remaining = options.pages ?? previousData.pages.length

    const [firstPageParam = options.initialPageParam] = previousData.pageParams

    // A directional fetch extends the cached pages once. A refetch starts at
    // the first cursor and keeps completed pages when an attempt is retried.
    do {
      const data = fetchMore ? previousData : result
      const param =
        fetchMore || currentPage > 0
          ? getPageParam(options, data, previous)
          : firstPageParam

      if (param == null && data.pages.length) return data
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- a previous page can consume the signal and abort while its query function runs.
      if (cancelled) throw context.signal.reason

      const pageContext = addConsumeAwareSignal(
        { client, queryKey, pageParam: param, meta: options.meta },
        () => context.signal,
        () => (cancelled = true),
        signalContext[fetchSignal],
      )
      const page = await queryFn(pageContext)
      const { maxPages } = options
      result = {
        pages: addToArray(data.pages, page, maxPages, previous),
        pageParams: addToArray(data.pageParams, param, maxPages, previous),
      }
      if (fetchMore) break
      currentPage++
    } while (currentPage < remaining)

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
    _prepareInfiniteFetch: prepareInfiniteFetch,
  }
}
