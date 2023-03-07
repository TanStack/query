import type { QueryBehavior } from './query'
import { addToEnd, addToStart } from './utils'
import type {
  InfiniteData,
  InfiniteQueryPageParamsOptions,
  QueryFunctionContext,
  QueryKey,
} from './types'

export function infiniteQueryBehavior<
  TQueryFnData,
  TError,
  TData,
>(): QueryBehavior<TQueryFnData, TError, InfiniteData<TData>> {
  return {
    onFetch: (context) => {
      context.fetchFn = () => {
        const options = context.options as InfiniteQueryPageParamsOptions<TData>
        const direction = context.fetchOptions?.meta?.fetchMore?.direction
        const oldPages = context.state.data?.pages || []
        const oldPageParams = context.state.data?.pageParams || []
        const empty = { pages: [], pageParams: [] }
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

        // Create function to fetch a page
        const fetchPage = (
          data: InfiniteData<unknown>,
          param: unknown,
          previous?: boolean,
        ): Promise<InfiniteData<unknown>> => {
          if (cancelled) {
            return Promise.reject()
          }

          if (typeof param === 'undefined' && data.pages.length) {
            return Promise.resolve(data)
          }

          const queryFnContext: Omit<
            QueryFunctionContext<QueryKey, unknown>,
            'signal'
          > = {
            queryKey: context.queryKey,
            pageParam: param,
            meta: context.options.meta,
          }

          addSignalProperty(queryFnContext)

          const queryFnResult = queryFn(
            queryFnContext as QueryFunctionContext<QueryKey, unknown>,
          )

          return Promise.resolve(queryFnResult).then((page) => {
            const { maxPages } = context.options
            const addTo = previous ? addToStart : addToEnd

            return {
              pages: addTo(data.pages, page, maxPages),
              pageParams: addTo(data.pageParams, param, maxPages),
            }
          })
        }

        let promise: Promise<InfiniteData<unknown>>

        // Fetch first page?
        if (!oldPages.length) {
          promise = fetchPage(empty, options.defaultPageParam)
        }

        // fetch next / previous page?
        else if (direction) {
          const previous = direction === 'backward'
          const pageParamFn = previous ? getPreviousPageParam : getNextPageParam
          const oldData = {
            pages: oldPages,
            pageParams: oldPageParams,
          }
          const param = pageParamFn(options, oldData)

          promise = fetchPage(oldData, param, previous)
        }

        // Refetch pages
        else {
          // Fetch first page
          promise = fetchPage(empty, oldPageParams[0])

          // Fetch remaining pages
          for (let i = 1; i < oldPages.length; i++) {
            promise = promise.then((data) => {
              const param = getNextPageParam(options, data)
              return fetchPage(data, param)
            })
          }
        }

        return promise
      }
    },
  }
}

function getNextPageParam(
  options: InfiniteQueryPageParamsOptions<any>,
  { pages, pageParams }: InfiniteData<unknown>,
): unknown | undefined {
  const lastIndex = pages.length - 1
  return options.getNextPageParam(
    pages[lastIndex],
    pages,
    pageParams[lastIndex],
    pageParams,
  )
}

function getPreviousPageParam(
  options: InfiniteQueryPageParamsOptions<any>,
  { pages, pageParams }: InfiniteData<unknown>,
): unknown | undefined {
  return options.getPreviousPageParam?.(
    pages[0],
    pages,
    pageParams[0],
    pageParams,
  )
}

/**
 * Checks if there is a next page.
 */
export function hasNextPage(
  options: InfiniteQueryPageParamsOptions<any>,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data) return false
  return typeof getNextPageParam(options, data) !== 'undefined'
}

/**
 * Checks if there is a previous page.
 */
export function hasPreviousPage(
  options: InfiniteQueryPageParamsOptions<any>,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data || !options.getPreviousPageParam) return false
  return typeof getPreviousPageParam(options, data) !== 'undefined'
}
