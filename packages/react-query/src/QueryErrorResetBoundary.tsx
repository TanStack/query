'use client'
import * as React from 'react'

// CONTEXT

/**
 * Resets any query errors within the boundary, so queries know they can try again.
 */
export type QueryErrorResetFunction = () => void

/**
 * Returns whether the boundary has been reset and not yet cleared. When a `queryHash` is
 * given, only checks whether the boundary has been reset since that query last cleared its
 * own reset state.
 */
export type QueryErrorIsResetFunction = (queryHash?: string) => boolean

/**
 * Clears the reset state, so queries know not to try again until the boundary is reset again.
 * When a `queryHash` is given, only that query's view of the reset state is cleared, so
 * sibling queries can still observe the reset.
 */
export type QueryErrorClearResetFunction = (queryHash?: string) => void

/**
 * The value a `QueryErrorResetBoundary` shares through context, used to reset query errors within
 * it and to check whether a reset was requested.
 */
export interface QueryErrorResetBoundaryValue {
  /**
   * Clears the reset state, so queries know not to try again until the boundary is reset again.
   */
  clearReset: QueryErrorClearResetFunction
  /**
   * Returns whether the boundary has been reset and not yet cleared.
   */
  isReset: QueryErrorIsResetFunction
  /**
   * Resets any query errors within the boundary, so queries know they can try again.
   */
  reset: QueryErrorResetFunction
}

/**
 * Creates the value shared through the boundary's context, which tracks whether a reset was
 * requested.
 * @returns The `clearReset`, `isReset`, and `reset` functions of the boundary.
 */
function createValue(): QueryErrorResetBoundaryValue {
  // Each `reset()` starts a new reset generation and every query tracks the
  // generation it last cleared, so one mounted query cannot consume the reset
  // signal before other queries have seen it.
  let resetId = 0
  let resetPending = false
  const clearedQueries = new Map<string, number>()
  return {
    clearReset: (queryHash) => {
      if (queryHash === undefined) {
        resetId = 0
        resetPending = false
        clearedQueries.clear()
      } else {
        clearedQueries.set(queryHash, resetId)
        resetPending = false
      }
    },
    reset: () => {
      resetId += 1
      resetPending = true
    },
    isReset: (queryHash) => {
      if (queryHash === undefined) {
        return resetPending
      }
      const clearedResetId = clearedQueries.get(queryHash)
      // Queries that never cleared their own reset state follow the shared
      // reset wave (cleared by the first mounted query), while queries that
      // did clear it keep their own pending state until they observe it.
      return clearedResetId === undefined
        ? resetPending
        : resetId > clearedResetId
    },
  }
}

const QueryErrorResetBoundaryContext = React.createContext(createValue())

// HOOK

/**
 * This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary
 * defined it will reset them globally.
 * @returns The boundary's {@link QueryErrorResetBoundaryValue}.
 * @example
 * ```tsx
 * import { ErrorBoundary } from 'react-error-boundary'
 * import { useQueryErrorResetBoundary } from '@tanstack/react-query'
 *
 * function App({ children }: { children: React.ReactNode }) {
 *   const { reset } = useQueryErrorResetBoundary()
 *
 *   return (
 *     <ErrorBoundary
 *       onReset={reset}
 *       fallbackRender={({ resetErrorBoundary }) => (
 *         <div>
 *           There was an error!
 *           <button onClick={() => resetErrorBoundary()}>Try again</button>
 *         </div>
 *       )}
 *     >
 *       {children}
 *     </ErrorBoundary>
 *   )
 * }
 * ```
 */
export const useQueryErrorResetBoundary = () =>
  React.useContext(QueryErrorResetBoundaryContext)

// COMPONENT

/**
 * A render-prop function usable as `children` on `QueryErrorResetBoundary`.
 * @param value - The boundary's {@link QueryErrorResetBoundaryValue}.
 * @returns The children to render.
 */
export type QueryErrorResetBoundaryFunction = (
  value: QueryErrorResetBoundaryValue,
) => React.ReactNode

/**
 * The props accepted by `QueryErrorResetBoundary`.
 */
export interface QueryErrorResetBoundaryProps {
  /**
   * Either a plain node, or a function that receives the boundary's {@link QueryErrorResetBoundaryValue} and
   * returns a node.
   */
  children: QueryErrorResetBoundaryFunction | React.ReactNode
}

/**
 * When using `suspense` or `throwOnError` in your queries, you need a way to let queries know that you want to
 * try again when re-rendering after some error occurred. With the `QueryErrorResetBoundary` component you can
 * reset any query errors within the boundaries of the component.
 * @param props - The `children` to render.
 * @returns The `children`, rendered as-is, or called with the boundary's {@link QueryErrorResetBoundaryValue}
 * if `children` is a function.
 * @example
 * ```tsx
 * import { ErrorBoundary } from 'react-error-boundary'
 * import { QueryErrorResetBoundary } from '@tanstack/react-query'
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary
 *           onReset={reset}
 *           fallbackRender={({ resetErrorBoundary }) => (
 *             <div>
 *               There was an error!
 *               <button onClick={() => resetErrorBoundary()}>Try again</button>
 *             </div>
 *           )}
 *         >
 *           <Page />
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 * ```
 */
export const QueryErrorResetBoundary = ({
  children,
}: QueryErrorResetBoundaryProps) => {
  const [value] = React.useState(() => createValue())
  return (
    <QueryErrorResetBoundaryContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
