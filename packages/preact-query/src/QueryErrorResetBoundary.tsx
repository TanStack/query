import { createContext } from 'preact'
import type { ComponentChildren } from 'preact'
import { useContext, useState } from 'preact/hooks'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = () => boolean
export type QueryErrorClearResetFunction = () => void

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

function createValue(): QueryErrorResetBoundaryValue {
  let isReset = false
  return {
    clearReset: () => {
      isReset = false
    },
    reset: () => {
      isReset = true
    },
    isReset: () => {
      return isReset
    },
  }
}

const QueryErrorResetBoundaryContext = createContext(createValue())

// HOOK

/**
 * This hook will reset any query errors within the closest `QueryErrorResetBoundary`. If there is no boundary
 * defined it will reset them globally.
 *
 * @returns The boundary's {@link QueryErrorResetBoundaryValue}.
 *
 * @example
 * ```tsx
 * import { useErrorBoundary } from 'preact/hooks'
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

export type QueryErrorResetBoundaryFunction = (
  value: QueryErrorResetBoundaryValue,
) => ComponentChildren

export interface QueryErrorResetBoundaryProps {
  children: QueryErrorResetBoundaryFunction | ComponentChildren
}

/**
 * When using **suspense** or **throwOnError** in your queries, you need a way to let queries know that you want to
 * try again when re-rendering after some error occurred. With the `QueryErrorResetBoundary` component you can
 * reset any query errors within the boundaries of the component.
 *
 * @example
 * ```tsx
 * import { useErrorBoundary } from 'preact/hooks'
 * import { QueryErrorResetBoundary } from '@tanstack/preact-query'
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
 *
 * const App = () => (
 *   <QueryErrorResetBoundary>
 *     {({ reset }) => (
 *       <ErrorBoundary reset={reset}>
 *         <Page />
 *       </ErrorBoundary>
 *     )}
 *   </QueryErrorResetBoundary>
 * )
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
