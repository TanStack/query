import { shouldThrowError } from '@tanstack/query-core-pluggable'
import type { QueryRenderPolicy } from './queryDescriptor'

/** Regular and paginated queries report errors in the result unless throwOnError requests the boundary. */
export const queryPolicy: QueryRenderPolicy<false> = {
  suspense: false,
  prepare(options, boundary, query) {
    const { throwOnError } = options
    if (
      (query?.state.status === 'error' && typeof throwOnError === 'function'
        ? throwOnError(query.state.error, query)
        : throwOnError) &&
      !boundary.isReset()
    ) {
      options.retryOnMount = false
    }
  },
  shouldThrow(result, options, query) {
    return shouldThrowError(options.throwOnError, [result.error, query])
  },
}
