import { QueryErrorResetBoundaryContext } from './QueryErrorResetBoundary'
import { prepareErrorBoundary } from './errorBoundaryUtils'
import type { QueryBoundaryPolicy } from './queryDescriptor'

/** Routes settled query errors to React. Pass [throwOnError, true] or [throwOnError, (error, query) => boolean] to a query or its client defaults. */
export const throwOnError: QueryBoundaryPolicy = {
  context: QueryErrorResetBoundaryContext,
  prepare(client, options, boundary) {
    return {
      onCommit: boundary.clearReset,
      check: prepareErrorBoundary(client, options, boundary),
    }
  },
}
