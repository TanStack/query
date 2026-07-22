import { createContext, useContext } from 'octane'
import type { QueryErrorResetBoundaryValue } from './types'

/**
 * @knipignore Consumed by QueryErrorResetBoundary.tsrx, which Knip cannot parse.
 */
export function createValue(): QueryErrorResetBoundaryValue {
  let isReset = false
  return {
    clearReset: () => {
      isReset = false
    },
    reset: () => {
      isReset = true
    },
    isReset: () => isReset,
  }
}

// The reset coordinator for error-boundary retries. While "reset", a thrown query
// error is NOT re-thrown (so the boundary's retry refetches instead of looping).
// The default value means: without a `<QueryErrorResetBoundary>`, `isReset()` is
// always false — identical to having no boundary.
/**
 * @knipignore Consumed by QueryErrorResetBoundary.tsrx, which Knip cannot parse.
 */
export const QueryErrorResetBoundaryContext =
  createContext<QueryErrorResetBoundaryValue>(createValue())

export function useQueryErrorResetBoundary(): QueryErrorResetBoundaryValue {
  return useContext(QueryErrorResetBoundaryContext)
}
