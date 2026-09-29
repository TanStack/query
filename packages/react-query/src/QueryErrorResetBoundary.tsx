'use client'
import * as React from 'react'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = (queryHash?: string) => boolean
export type QueryErrorClearResetFunction = (queryHash?: string) => void

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  isReset: QueryErrorIsResetFunction
  registerReset: (queryHash: string) => void
  resetQuery: (queryHash: string) => void
  reset: QueryErrorResetFunction
}

/**
 * Resets any query errors within the boundary, so queries know they can try again.
 */
function createValue(): QueryErrorResetBoundaryValue {
  let resetId = 0
  const queryResetIds = new Map<string, number>()
  const queryReset = new Set<string>()

  return {
    /**
     * Clears the reset state, so queries know not to try again until the boundary is reset again.
     */
    clearReset: (queryHash) => {
      if (typeof queryHash === 'string') {
        queryResetIds.set(queryHash, resetId)
        queryReset.delete(queryHash)
      } else {
        resetId = 0
        queryResetIds.clear()
        queryReset.clear()
      }
    },
    /**
     * Resets any query errors within the boundary, so queries know they can try again.
     */
    reset: () => {
      resetId += 1
    },
    resetQuery: (queryHash) => {
      queryReset.add(queryHash)
    },
    /**
     * Returns whether the boundary has been reset and not yet cleared.
     */
    isReset: (queryHash) => {
      if (typeof queryHash === 'string') {
        return (
          queryReset.has(queryHash) ||
          (queryResetIds.get(queryHash) ?? resetId) < resetId
        )
      }

      return resetId > 0
    },
    registerReset: (queryHash) => {
      if (!queryResetIds.has(queryHash)) {
        queryResetIds.set(queryHash, 0)
      }
    },
  }
}

const QueryErrorResetBoundaryContext = React.createContext(createValue())

// HOOK

/**
 * This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary
 * defined it will reset them globally.
 *
 * @returns The boundary's {@link QueryErrorResetBoundaryValue}.
 *
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
 *
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
 *
 * @returns The `children`, rendered as-is, or called with the boundary's {@link QueryErrorResetBoundaryValue}
 * if `children` is a function.
 *
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
