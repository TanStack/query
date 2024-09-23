'use client'
import * as React from 'react'

// CONTEXT

export interface QueryErrorResetBoundaryValue {
  clearReset: () => void
  isReset: () => boolean
  reset: () => void
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
