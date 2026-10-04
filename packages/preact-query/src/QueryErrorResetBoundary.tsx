import { createContext } from 'preact'
import type { ComponentChildren } from 'preact'
import { useContext, useState } from 'preact/hooks'

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

const QueryErrorResetBoundaryContext = createContext(createValue())

// HOOK

/**
 * This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary
 * defined it will reset them globally.
 * @returns The boundary's {@link QueryErrorResetBoundaryValue}.
 * @example
 * ```tsx
 * import { useErrorBoundary } from 'preact/hooks'
 * import type { ComponentChildren } from 'preact'
 * import { useQueryErrorResetBoundary } from '@tanstack/preact-query'
 *
 * function App({ children }: { children: ComponentChildren }) {
 *   const { reset } = useQueryErrorResetBoundary()
 *   const [error, resetError] = useErrorBoundary(() => reset())
 *
 *   if (error) {
 *     return (
 *       <div>
 *         There was an error!
 *         <button onClick={() => resetError()}>Try again</button>
 *       </div>
 *     )
 *   }
 *
 *   return children
 * }
 * ```
 */
export const useQueryErrorResetBoundary = () =>
  useContext(QueryErrorResetBoundaryContext)

// COMPONENT

/**
 * A render-prop function usable as `children` on `QueryErrorResetBoundary`.
 * @param value - The boundary's {@link QueryErrorResetBoundaryValue}.
 * @returns The children to render.
 */
export type QueryErrorResetBoundaryFunction = (
  value: QueryErrorResetBoundaryValue,
) => ComponentChildren

/**
 * The props accepted by `QueryErrorResetBoundary`.
 */
export interface QueryErrorResetBoundaryProps {
  /**
   * Either a plain node, or a function that receives the boundary's {@link QueryErrorResetBoundaryValue} and
   * returns a node.
   */
  children: QueryErrorResetBoundaryFunction | ComponentChildren
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
 * import { useErrorBoundary } from 'preact/hooks'
 * import type { ComponentChildren } from 'preact'
 * import { QueryErrorResetBoundary } from '@tanstack/preact-query'
 *
 * function App() {
 *   return (
 *     <QueryErrorResetBoundary>
 *       {({ reset }) => (
 *         <ErrorBoundary reset={reset}>
 *           <Page />
 *         </ErrorBoundary>
 *       )}
 *     </QueryErrorResetBoundary>
 *   )
 * }
 *
 * function ErrorBoundary({
 *   children,
 *   reset,
 * }: {
 *   children: ComponentChildren
 *   reset: () => void
 * }) {
 *   const [error, resetError] = useErrorBoundary(() => reset())
 *
 *   if (error) {
 *     return (
 *       <div>
 *         There was an error!
 *         <button onClick={() => resetError()}>Try again</button>
 *       </div>
 *     )
 *   }
 *
 *   return children
 * }
 * ```
 */
export const QueryErrorResetBoundary = ({
  children,
}: QueryErrorResetBoundaryProps) => {
  const [value] = useState(() => createValue())
  return (
    <QueryErrorResetBoundaryContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
