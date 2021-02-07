import type { QueryBehavior } from './query'
import { isCancelable } from './retryer'
import type { InfiniteData, QueryFunctionContext, QueryOptions } from './types'

export function infiniteQueryBehavior<
  TQueryFnData,
  TError,
  TData
>(): QueryBehavior<TQueryFnData, TError, InfiniteData<TData>> {
  return {
    onFetch: context => {
      context.fetchFn = () => {
        const fetchMore = context.fetchOptions?.meta?.fetchMore
        const pageParam = fetchMore?.pageParam
        const isFetchingNextPage = fetchMore?.direction === 'forward'
        const isFetchingPreviousPage = fetchMore?.direction === 'backward'
        const oldPages = context.state.data?.pages || []
        const oldPageParams = context.state.data?.pageParams || []
        let newPageParams = oldPageParams
        let cancelled = false

        // Get query function
        const queryFn =
          context.options.queryFn || (() => Promise.reject('Missing queryFn'))

        // Create function to fetch a page
        const fetchPage = (
          pages: unknown[],
          manual?: boolean,
          param?: unknown,
          previous?: boolean
        ): Promise<unknown[]> => {
          if (cancelled) {
            return Promise.reject('Cancelled')
          }

          if (typeof param === 'undefined' && !manual && pages.length) {
            return Promise.resolve(pages)
          }

          const queryFnContext: QueryFunctionContext = {
            queryKey: context.queryKey,
            pageParam: param,
          }

          const queryFnResult = queryFn(queryFnContext)

          const promise = Promise.resolve(queryFnResult).then(page => {
            newPageParams = previous
              ? [param, ...newPageParams]
              : [...newPageParams, param]
            return previous ? [page, ...pages] : [...pages, page]
          })

          if (isCancelable(queryFnResult)) {
            const promiseAsAny = promise as any
            promiseAsAny.cancel = queryFnResult.cancel
          }

          return promise
        }

        let promise: Promise<unknown[]>

        // Fetch first page?
        if (!oldPages.length) {
          promise = fetchPage([])
        }

        // Fetch next page?
        else if (isFetchingNextPage) {
          const manual = typeof pageParam !== 'undefined'
          const param = manual
            ? pageParam
            : getNextPageParam(context.options, oldPages)
          promise = fetchPage(oldPages, manual, param)
        }

        // Fetch previous page?
        else if (isFetchingPreviousPage) {
          const manual = typeof pageParam !== 'undefined'
          const param = manual
            ? pageParam
            : getPreviousPageParam(context.options, oldPages)
          promise = fetchPage(oldPages, manual, param, true)
        }

        // Refetch pages
        else {
          newPageParams = []

          const manual = typeof context.options.getNextPageParam === 'undefined'

          // Fetch first page
          promise = fetchPage([], manual, oldPageParams[0])

          // Fetch remaining pages
          for (let i = 1; i < oldPages.length; i++) {
            promise = promise.then(pages => {
              const param = manual
                ? oldPageParams[i]
                : getNextPageParam(context.options, pages)
              return fetchPage(pages, manual, param)
            })
          }
        }

        const finalPromise = promise.then(pages => ({
          pages,
          pageParams: newPageParams,
        }))

        const finalPromiseAsAny = finalPromise as any

        finalPromiseAsAny.cancel = () => {
          cancelled = true
          if (isCancelable(promise)) {
            promise.cancel()
          }
        }

        return finalPromise
      }
    },
  }
}

export function getNextPageParam(
  options: QueryOptions<any, any>,
  pages: unknown[]
): unknown | undefined {
  return options.getNextPageParam?.(pages[pages.length - 1], pages)
}

export function getPreviousPageParam(
  options: QueryOptions<any, any>,
  pages: unknown[]
): unknown | undefined {
  return options.getPreviousPageParam?.(pages[0], pages)
}

/**
 * Checks if there is a next page.
 * Returns `undefined` if it cannot be determined.
 */
export function hasNextPage(
  options: QueryOptions<any, any>,
  pages?: unknown
): boolean | undefined {
  if (options.getNextPageParam && Array.isArray(pages)) {
    const nextPageParam = getNextPageParam(options, pages)
    return (
      typeof nextPageParam !== 'undefined' &&
      nextPageParam !== null &&
      nextPageParam !== false
    )
  }
}

/**
 * Checks if there is a previous page.
 * Returns `undefined` if it cannot be determined.
 */
export function hasPreviousPage(
  options: QueryOptions<any, any>,
  pages?: unknown
): boolean | undefined {
  if (options.getPreviousPageParam && Array.isArray(pages)) {
    const previousPageParam = getPreviousPageParam(options, pages)
    return (
      typeof previousPageParam !== 'undefined' &&
      previousPageParam !== null &&
      previousPageParam !== false
    )
  }
}
