'use client'

import { getQueryCache, shouldThrowError } from '@tanstack/query-core'
import type {
  DefaultedQueryObserverOptions,
  QueryClient,
  QueryObserverResult,
} from '@tanstack/query-core'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

type Options = DefaultedQueryObserverOptions<any, any, any, any, any>

/**
 * Stops a failed query retrying on mount until the boundary requests a reset.
 * @param client - The cache owner.
 * @param options - The observer options for this reader.
 * @param boundary - The nearest reset boundary.
 * @param group - Group readers may create a missing cache entry while assembling their result.
 * @returns A check that sends a settled observer error to React.
 */
export function prepareErrorBoundary(
  client: QueryClient,
  options: Options,
  boundary: QueryErrorResetBoundaryValue,
  group = false,
) {
  const cache = getQueryCache(client)
  const query = cache.get(options.queryHash)
  const rule =
    typeof options.throwOnError === 'object'
      ? options.throwOnError[1]
      : options.throwOnError
  if (
    (options.suspense ||
      (query?.state.status === 'error' && typeof rule === 'function'
        ? rule(query.state.error, query)
        : rule)) &&
    !boundary.isReset()
  )
    options.retryOnMount = false
  return (result: QueryObserverResult<any, any>) => {
    if (
      result.status !== 'error' ||
      boundary.isReset() ||
      result.fetchStatus === 'fetching'
    )
      return
    const current = group ? cache.get(options.queryHash) : query
    if (
      current &&
      ((options.suspense && result.data === undefined) ||
        shouldThrowError(options.throwOnError, [result.error, current]))
    )
      throw result.error
  }
}
