import type { QueryBehavior } from './query'
import { addToEnd, addToStart } from './utils'
import type { InfiniteData, QueryFunctionContext, QueryOptions } from './types'

export function infiniteQueryBehavior<
  TQueryFnData,
  TError,
  TData,
>(): QueryBehavior<TQueryFnData, TError, InfiniteData<TData>> {
  return {
    onFetch: (context) => {
      context.fetchFn = () => {
        const fetchMore = context.fetchOptions?.meta?.fetchMore
        const isFetchingNextPage = fetchMore?.direction === 'forward'
        const isFetchingPreviousPage = fetchMore?.direction === 'backward'
        const oldPages = context.state.data?.pages || []
        const oldPageParams = context.state.data?.pageParams || []
        let newPageParams = oldPageParams
        let cancelled = false

        const addSignalProperty = (object: unknown) => {
          Object.defineProperty(object, 'signal', {
            enumerable: true,
            get: () => {
              if (context.signal.aborted) {
                cancelled = true
              } else {
                context.signal.addEventListener('abort', () => {
                  cancelled = true
                })
              }
              return context.signal
            },
          })
        }

        // Get query function
        const queryFn =
          context.options.queryFn ||
          (() => Promise.reject(new Error('Missing queryFn')))

        const buildNewPages = (
          pages: unknown[],
          param: unknown,
          page: unknown,
          previous?: boolean,
        ) => {
          const { maxPages } = context.options

          if (previous) {
            newPageParams = addToStart(newPageParams, param, maxPages)
            return addToStart(pages, page, maxPages)
          }

          newPageParams = addToEnd(newPageParams, param, maxPages)
          return addToEnd(pages, page, maxPages)
        }

        // Create function to fetch a page
        const fetchPage = (
          pages: unknown[],
          param?: unknown,
          previous?: boolean,
        ): Promise<unknown[]> => {
          if (cancelled) {
            return Promise.reject()
          }

          if (typeof param === 'undefined' && pages.length) {
            return Promise.resolve(pages)
          }

          const queryFnContext: Omit<QueryFunctionContext, 'signal'> = {
            queryKey: context.queryKey,
            pageParam: param,
            meta: context.options.meta,
          }

          addSignalProperty(queryFnContext)

          const queryFnResult = queryFn(queryFnContext as QueryFunctionContext)

          const promise = Promise.resolve(queryFnResult).then((page) =>
            buildNewPages(pages, param, page, previous),
          )

          return promise
        }

        let promise: Promise<unknown[]>

        // Fetch first page?
        if (!oldPages.length) {
          promise = fetchPage([])
        }

        // Fetch next page?
        else if (isFetchingNextPage) {
          const param = getNextPageParam(context.options, oldPages)
          promise = fetchPage(oldPages, param)
        }

        // Fetch previous page?
        else if (isFetchingPreviousPage) {
          const param = getPreviousPageParam(context.options, oldPages)
          promise = fetchPage(oldPages, param, true)
        }

        // Refetch pages
        else {
          newPageParams = []

          // Fetch first page
          promise = fetchPage([], oldPageParams[0])

          // Fetch remaining pages
          for (let i = 1; i < oldPages.length; i++) {
            promise = promise.then((pages) => {
              const param = getNextPageParam(context.options, pages)
              return fetchPage(pages, param)
            })
          }
        }

        const finalPromise = promise.then((pages) => ({
          pages,
          pageParams: newPageParams,
        }))

        return finalPromise
      }
    },
  }
}

export function getNextPageParam(
  options: QueryOptions<any, any>,
  pages: unknown[],
): unknown | undefined {
  return options.getNextPageParam?.(pages[pages.length - 1], pages)
}

export function getPreviousPageParam(
  options: QueryOptions<any, any>,
  pages: unknown[],
): unknown | undefined {
  return options.getPreviousPageParam?.(pages[0], pages)
}

/**
 * Checks if there is a next page.
 * Returns `undefined` if it cannot be determined.
 */
export function hasNextPage(
  options: QueryOptions<any, any, any, any>,
  pages?: unknown,
): boolean | undefined {
  if (options.getNextPageParam && Array.isArray(pages)) {
    const nextPageParam = getNextPageParam(options, pages)
    return (
      typeof nextPageParam !== 'undefined' &&
      nextPageParam !== null &&
      nextPageParam !== false
    )
  }
  return
}

/**
 * Checks if there is a previous page.
 * Returns `undefined` if it cannot be determined.
 */
export function hasPreviousPage(
  options: QueryOptions<any, any, any, any>,
  pages?: unknown,
): boolean | undefined {
  if (options.getPreviousPageParam && Array.isArray(pages)) {
    const previousPageParam = getPreviousPageParam(options, pages)
    return (
      typeof previousPageParam !== 'undefined' &&
      previousPageParam !== null &&
      previousPageParam !== false
    )
  }
  return
}
