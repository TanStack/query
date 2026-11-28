import { defaultQueryOptions, getQueryCache } from './queryClient'
import type { QueryClient } from './queryClient'
import type { ObserverOptionsInput, QueryObserver } from './queryObserver'
import type { QueryKey, QueryObserverResult } from './types'

/**
 * Fetches a query defined by the given options without affecting this
 * observer's own tracked query or result, and returns a promise that
 * resolves with the `QueryObserverResult` for that fetch. This is useful
 * for prefetching data that another observer (e.g. a query about to be
 * navigated to) will need, ahead of time.
 * @param client - The client that owns the observer and its query cache.
 * @param observer - The observer that computes the result.
 * @param options - The observer options of the query to fetch.
 * @returns A promise that resolves with the result for the fetched query.
 * @example
 * ```ts
 * const result = await fetchOptimistic(client, observer, {
 *   queryKey: ['posts', 2],
 *   queryFn: () => fetchPost(2),
 * })
 * console.log(result.data)
 * ```
 */
export function fetchOptimistic<
  TQueryFnData,
  TError,
  TData,
  TQueryData,
  TQueryKey extends QueryKey,
>(
  client: QueryClient,
  observer: QueryObserver<TQueryFnData, TError, TData, TQueryData, TQueryKey>,
  options: NoInfer<
    ObserverOptionsInput<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >,
): Promise<QueryObserverResult<TData, TError>> {
  const defaultedOptions = defaultQueryOptions(client, options)

  const cache = getQueryCache(client)
  const query = cache.build(client, defaultedOptions)

  const cached = Promise.withResolvers<QueryObserverResult<TData, TError>>()
  const unsubscribe = cache.subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.query.queryHash === query.queryHash &&
      query.state.data !== undefined
    ) {
      unsubscribe()
      cached.resolve(observer.createResult(query, defaultedOptions))
    }
  })

  return Promise.race([
    query
      .fetch(defaultedOptions)
      .then(() => observer.createResult(query, defaultedOptions))
      .finally(unsubscribe),
    cached.promise,
  ])
}
