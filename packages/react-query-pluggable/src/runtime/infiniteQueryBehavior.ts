import {
  addConsumeAwareSignal,
  addToArray,
  fetchSignal,
} from '@tanstack/query-core/primitives'
import { ensureQueryFn } from './utils'
import type { FetchSignalContext } from '@tanstack/query-core/primitives'
import type { FetchContext, Query } from './query'
import type { InfiniteData, InfiniteQueryPageParamsOptions } from './types'

/**
 * Installs the page fetcher for an infinite query. A retry continues from the
 * failed page. A new fetch starts with the most recently cached pages.
 * @param context - The fetch in progress, including its options and cached pages.
 * @param query - The query supplied to a custom persister.
 */
export function prepareInfiniteFetch<TQueryFnData, TError, TData, TPageParam>(
  context: FetchContext<TQueryFnData, TError, InfiniteData<TData, TPageParam>>,
  query: Query,
): void {
  const options = context.options as InfiniteQueryPageParamsOptions<TData> & {
    pages?: number
  }
  const direction = context.fetchOptions?.meta?.fetchMore?.direction
  const oldPages = context.state.data?.pages || []
  const oldPageParams = context.state.data?.pageParams || []
  let result: InfiniteData<unknown> = { pages: [], pageParams: [] }
  let currentPage = 0

  const fetchFn = async () => {
    let cancelled = false
    const signalContext: FetchSignalContext = context
    const queryFn = ensureQueryFn(context.options, context.fetchOptions)

    // Create function to fetch a page
    const fetchPage = async (
      data: InfiniteData<unknown>,
      param: unknown,
      previous?: boolean,
    ): Promise<InfiniteData<unknown>> => {
      if (cancelled) {
        return Promise.reject(context.signal.reason)
      }

      if (param == null && data.pages.length) {
        return Promise.resolve(data)
      }

      const queryFnContext = addConsumeAwareSignal(
        {
          client: context.client,
          queryKey: context.queryKey,
          pageParam: param,
          meta: context.options.meta,
        },
        () => context.signal,
        () => (cancelled = true),
        signalContext[fetchSignal],
      )

      const page = await queryFn(queryFnContext)

      const { maxPages } = context.options
      return {
        pages: addToArray(data.pages, page, maxPages, previous),
        pageParams: addToArray(data.pageParams, param, maxPages, previous),
      }
    }

    // fetch next / previous page?
    if (direction && oldPages.length) {
      const previous = direction === 'backward'
      const pageParamFn = previous ? getPreviousPageParam : getNextPageParam
      const oldData = {
        pages: oldPages,
        pageParams: oldPageParams,
      }
      const param = pageParamFn(options, oldData)

      result = await fetchPage(oldData, param, previous)
    } else {
      const remainingPages = options.pages ?? oldPages.length

      // Fetch all pages
      do {
        const param =
          currentPage === 0
            ? oldPageParams[0] === undefined
              ? options.initialPageParam
              : oldPageParams[0]
            : getNextPageParam(options, result)
        if (currentPage > 0 && param == null) {
          break
        }
        result = await fetchPage(result, param)
        currentPage++
      } while (currentPage < remainingPages)
    }

    return result
  }
  if (context.options.persister) {
    context.fetchFn = () => {
      return context.options.persister?.(
        fetchFn as any,
        {
          client: context.client,
          queryKey: context.queryKey,
          meta: context.options.meta,
          signal: context.signal,
        },
        query,
      )
    }
  } else {
    context.fetchFn = fetchFn
  }
}

/**
 * Computes the page param of the page after the last one, with the `getNextPageParam` option.
 * @param options - The infinite query options.
 * @param data - The current pages and page params.
 * @returns The next page param, or `undefined` if there are no pages yet.
 */
function getNextPageParam(
  options: InfiniteQueryPageParamsOptions<any>,
  { pages, pageParams }: InfiniteData<unknown>,
): unknown | undefined {
  return pages.length > 0
    ? options.getNextPageParam(
        pages.at(-1),
        pages,
        pageParams.at(-1),
        pageParams,
      )
    : undefined
}

/**
 * Computes the page param of the page before the first one, with the `getPreviousPageParam`
 * option.
 * @param options - The infinite query options.
 * @param data - The current pages and page params.
 * @returns The previous page param, or `undefined` if there are no pages yet or no
 * `getPreviousPageParam` option.
 */
function getPreviousPageParam(
  options: InfiniteQueryPageParamsOptions<any>,
  { pages, pageParams }: InfiniteData<unknown>,
): unknown | undefined {
  return pages.length > 0
    ? options.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams)
    : undefined
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
  if (!data) return false
  return getNextPageParam(options, data) != null
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
  if (!data || !options.getPreviousPageParam) return false
  return getPreviousPageParam(options, data) != null
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
