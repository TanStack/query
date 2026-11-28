import { createContext } from 'preact'
import type { QueryErrorResetBoundaryValue } from './QueryErrorResetBoundary'

/** The hook reads a stable context when a component switches query modes. */
export const queryBoundaryContext = createContext<
  QueryErrorResetBoundaryValue | undefined
>(undefined)
