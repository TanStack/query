import type { QueryBehavior } from './query'

import type {
  InfiniteData,
  QueryFunctionContext,
  QueryOptions,
  RefetchQueryFilters,
} from './types'

export function infiniteQueryBehavior<
  TQueryFnData,
  TError,
  TData,
>(): QueryBehavior<TQueryFnData, TError, InfiniteData<TData>> {
  return {
    onFetch: (context) => {
      context.fetchFn = () => {
        const refetchPage: RefetchQueryFilters['refetchPage'] | undefined =
          context.fetchOptions?.meta?.refetchPage
        const fetchMore = context.fetchOptions?.meta?.fetchMore
        const pageParam = fetchMore?.pageParam
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
              if (context.signal?.aborted) {
                cancelled = true
              } else {
                context.signal?.addEventListener('abort', () => {
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
          (() =>
            Promise.reject(
              `Missing queryFn for queryKey '${context.options.queryHash}'`,
            ))

        const buildNewPages = (
          pages: unknown[],
          param: unknown,
          page: unknown,
          previous?: boolean,
        ) => {
          newPageParams = previous
            ? [param, ...newPageParams]
            : [...newPageParams, param]
          return previous ? [page, ...pages] : [...pages, page]
        }

        // Create function to fetch a page
        const fetchPage = (
          pages: unknown[],
          manual?: boolean,
          param?: unknown,
          previous?: boolean,
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
            meta: context.options.meta,
          }

          addSignalProperty(queryFnContext)

          const queryFnResult = queryFn(queryFnContext)

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

          const shouldFetchFirstPage =
            refetchPage && oldPages[0]
              ? refetchPage(oldPages[0], 0, oldPages)
              : true

          // Fetch first page
          promise = shouldFetchFirstPage
            ? fetchPage([], manual, oldPageParams[0])
            : Promise.resolve(buildNewPages([], oldPageParams[0], oldPages[0]))

          // Fetch remaining pages
          for (let i = 1; i < oldPages.length; i++) {
            promise = promise.then((pages) => {
              const shouldFetchNextPage =
                refetchPage && oldPages[i]
                  ? refetchPage(oldPages[i], i, oldPages)
                  : true

              if (shouldFetchNextPage) {
                const param = manual
                  ? oldPageParams[i]
                  : getNextPageParam(context.options, pages)
                return fetchPage(pages, manual, param)
              }
              return Promise.resolve(
                buildNewPages(pages, oldPageParams[i], oldPages[i]),
              )
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
