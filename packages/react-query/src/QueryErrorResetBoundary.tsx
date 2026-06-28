'use client'
import * as React from 'react'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = () => boolean
export type QueryErrorClearResetFunction = () => void
export type QueryErrorResetCountFunction = () => number

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  getResetCount?: QueryErrorResetCountFunction
  isReset: QueryErrorIsResetFunction
  reset: QueryErrorResetFunction
}

function createValue(): QueryErrorResetBoundaryValue {
  let isReset = false
  let resetCount = 0

  return {
    clearReset: () => {
      isReset = false
    },
    getResetCount: () => {
      return resetCount
    },
    reset: () => {
      isReset = true
      resetCount++
    },
    isReset: () => {
      return isReset
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
