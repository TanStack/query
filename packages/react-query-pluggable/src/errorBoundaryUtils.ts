'use client'

import { shouldThrowError } from '@tanstack/query-core-pluggable'
import type {
  DefaultedQueryObserverOptions,
  Query,
  QueryObserverResult,
} from '@tanstack/query-core-pluggable'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

type Options = DefaultedQueryObserverOptions<any, any, any, any, any>
type CachedQuery = Query<any, any, any, any>

/**
 * Stops a failed query retrying on mount until the boundary requests a reset.
 * @param options - The observer options for this reader.
 * @param boundary - The nearest reset boundary.
 * @param query - The cache entry at the start of the render.
 */
export function prepareErrorBoundary(
  options: Options,
  boundary: QueryErrorResetBoundaryValue,
  query: CachedQuery | undefined,
) {
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
}

/**
 * Checks whether a settled observer error belongs to the nearest boundary.
 * @param result - The snapshot being rendered.
 * @param options - The observer options for this reader.
 * @param query - The cache entry at the start of the render.
 * @param boundary - The nearest reset boundary.
 * @returns Whether React should receive the settled error.
 */
export function getHasError(
  result: QueryObserverResult<any, any>,
  options: Options,
  query: CachedQuery | undefined,
  boundary: QueryErrorResetBoundaryValue,
) {
  return (
    result.status === 'error' &&
    !boundary.isReset() &&
    result.fetchStatus !== 'fetching' &&
    !!query &&
    ((options.suspense && result.data === undefined) ||
      shouldThrowError(
        typeof options.throwOnError === 'object'
          ? options.throwOnError[1]
          : options.throwOnError,
        [result.error, query],
      ))
  )
}
