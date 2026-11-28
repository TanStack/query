import { getQueryCache } from '@tanstack/query-core'
import { defaultBoundary } from './QueryErrorResetBoundary'
import { getHasError, prepareErrorBoundary } from './errorBoundaryUtils'
import { queryBoundaryContext } from './queryBoundaryContext'
import type { QueryBoundaryPolicy } from './queryDescriptor'

/** Routes settled query errors to Preact. Pass [throwOnError, true] or [throwOnError, (error, query) => boolean] to a query or its client defaults. */
export const throwOnError: QueryBoundaryPolicy = {
  context: queryBoundaryContext,
  defaultBoundary,
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
