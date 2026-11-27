'use client'

import * as React from 'react'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'
import type { QueryRenderPolicy } from './queryDescriptor'

/**
 * Clears a boundary reset after a successful commit so later errors can reach the boundary again.
 * @param boundary - The nearest query error boundary.
 */
export function useClearResetErrorBoundary(
  boundary: QueryErrorResetBoundaryValue,
) {
  React.useEffect(() => {
    boundary.clearReset()
  }, [boundary])
}

/**
 * Applies the factory's policy once a query has settled in an error state.
 * @param policy - The render policy selected for this query.
 * @param result - The current snapshot.
 * @param options - The observer's defaulted options.
 * @param query - The cache entry, if it already existed at the start of the render.
 * @param boundary - The nearest query error boundary.
 * @returns Whether the query error should be thrown during render.
 */
export function getHasError(
  policy: QueryRenderPolicy,
  result: Parameters<QueryRenderPolicy['shouldThrow']>[0],
  options: Parameters<QueryRenderPolicy['shouldThrow']>[1],
  query: Parameters<QueryRenderPolicy['shouldThrow']>[2] | undefined,
  boundary: QueryErrorResetBoundaryValue,
) {
  return (
    result.status === 'error' &&
    !boundary.isReset() &&
    result.fetchStatus !== 'fetching' &&
    !!query &&
    policy.shouldThrow(result, options, query)
  )
}
