'use client'
import * as React from 'react'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = () => boolean
export type QueryErrorClearResetFunction = () => void

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  isReset: QueryErrorIsResetFunction
  reset: QueryErrorResetFunction
}

/**
 * Resets any query errors within the boundary, so queries know they can try again.
 */
type QueryErrorResetState = {
  resetId: number
  queryResetIds: WeakMap<object, number>
  queryReset: WeakSet<object>
}

const queryErrorResetStates = new WeakMap<
  QueryErrorResetBoundaryValue,
  QueryErrorResetState
>()

function createValue(): QueryErrorResetBoundaryValue {
  const state: QueryErrorResetState = {
    resetId: 0,
    queryResetIds: new WeakMap(),
    queryReset: new WeakSet(),
  }

  const value: QueryErrorResetBoundaryValue = {
    clearReset: () => {
      state.resetId = 0
      state.queryResetIds = new WeakMap()
      state.queryReset = new WeakSet()
    },
    reset: () => {
      state.resetId += 1
    },
    isReset: () => {
      return state.resetId > 0
    },
  }

  queryErrorResetStates.set(value, state)

  return value
}

export const registerQueryErrorReset = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: object,
) => {
  const state = queryErrorResetStates.get(errorResetBoundary)
  if (state && !state.queryResetIds.has(query)) {
    state.queryResetIds.set(query, state.resetId)
  }
}

export const isQueryErrorReset = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: object | undefined,
) => {
  if (!query) {
    return errorResetBoundary.isReset()
  }

  const state = queryErrorResetStates.get(errorResetBoundary)

  return (
    state !== undefined &&
    (state.queryReset.has(query) ||
      (state.queryResetIds.get(query) ?? state.resetId) < state.resetId)
  )
}

export const clearQueryErrorReset = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: object,
) => {
  const state = queryErrorResetStates.get(errorResetBoundary)
  if (state) {
    state.queryResetIds.set(query, state.resetId)
    state.queryReset.delete(query)
  }
}

export const resetQueryError = (
  errorResetBoundary: QueryErrorResetBoundaryValue,
  query: object,
) => {
  const state = queryErrorResetStates.get(errorResetBoundary)
  if (state) {
    state.queryResetIds.set(query, state.resetId)
    state.queryReset.add(query)
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
