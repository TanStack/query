import { addToEnd, addToStart } from './utils'
import type { QueryBehavior } from './query'
import type {
  InfiniteData,
  InfiniteQueryPageParamsOptions,
  QueryFunctionContext,
  QueryKey,
} from './types'

export function infiniteQueryBehavior<TQueryFnData, TError, TData>(
  pages?: number,
): QueryBehavior<TQueryFnData, TError, InfiniteData<TData>> {
  return {
    onFetch: (context) => {
      context.fetchFn = async () => {
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
          (() =>
            Promise.reject(
              new Error(`Missing queryFn: '${context.options.queryHash}'`),
            ))

        // Create function to fetch a page
        const fetchPage = async (
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
            direction: previous ? 'backward' : 'forward',
            meta: context.options.meta,
          }

          addSignalProperty(queryFnContext)

          const page = await queryFn(
            queryFnContext as QueryFunctionContext<QueryKey, unknown>,
          )

          const { maxPages } = context.options
          const addTo = previous ? addToStart : addToEnd

          return {
            pages: addTo(data.pages, page, maxPages),
            pageParams: addTo(data.pageParams, param, maxPages),
          }
        }

        let result: InfiniteData<unknown>

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
          // Fetch first page
          result = await fetchPage(
            empty,
            oldPageParams[0] ?? options.defaultPageParam,
          )

          const remainingPages = pages ?? oldPages.length

          // Fetch remaining pages
          for (let i = 1; i < remainingPages; i++) {
            const param = getNextPageParam(options, result)
            result = await fetchPage(result, param)
          }
        }

        return result
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
  options: InfiniteQueryPageParamsOptions<any, any>,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data) return false
  return typeof getNextPageParam(options, data) !== 'undefined'
}

/**
 * Checks if there is a previous page.
 */
export function hasPreviousPage(
  options: InfiniteQueryPageParamsOptions<any, any>,
  data?: InfiniteData<unknown>,
): boolean {
  if (!data || !options.getPreviousPageParam) return false
  return typeof getPreviousPageParam(options, data) !== 'undefined'
}
