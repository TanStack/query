'use client'
import * as React from 'react'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorGetResetIdFunction = () => number
export type QueryErrorClearResetFunction = () => void

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  getResetId: QueryErrorGetResetIdFunction
  reset: QueryErrorResetFunction
}

function createValue(): QueryErrorResetBoundaryValue {
  const resetIdRef = { current: 0 }
  return {
    clearReset: () => {
      resetIdRef.current = 0
    },
    reset: () => {
      resetIdRef.current += 1
    },
    getResetId: () => {
      return resetIdRef.current
    },
  }
}

const QueryErrorResetBoundaryContext = React.createContext(createValue())

// HOOK

export const useQueryErrorResetBoundary = () =>
  React.useContext(QueryErrorResetBoundaryContext)

// COMPONENT

export type QueryErrorResetBoundaryFunction = (
  value: QueryErrorResetBoundaryValue,
) => React.ReactNode

export interface QueryErrorResetBoundaryProps {
  children: QueryErrorResetBoundaryFunction | React.ReactNode
}

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
