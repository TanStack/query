import { getQueryCache } from '@tanstack/query-core-pluggable'
import { QueryErrorResetBoundaryContext } from './QueryErrorResetBoundary'
import { getHasError, prepareErrorBoundary } from './errorBoundaryUtils'
import type { QueryBoundaryPolicy } from './queryDescriptor'

/** Routes settled query errors to React. Pass [throwOnError, true] or [throwOnError, (error, query) => boolean] to a query or its client defaults. */
export const throwOnError: QueryBoundaryPolicy = {
  context: QueryErrorResetBoundaryContext,
  prepare(client, options, boundary) {
    const query = getQueryCache(client).get(options.queryHash)
    prepareErrorBoundary(options, boundary, query)
    return {
      onCommit: boundary.clearReset,
      check(result) {
        if (getHasError(result, options, query, boundary)) throw result.error
      },
    }
  },
}
