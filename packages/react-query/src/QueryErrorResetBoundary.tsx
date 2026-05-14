'use client'
import * as React from 'react'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = (queryHash?: string) => boolean
export type QueryErrorClearResetFunction = (queryHash?: string) => void

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  isReset: QueryErrorIsResetFunction
  reset: QueryErrorResetFunction
}

function createValue(): QueryErrorResetBoundaryValue {
  let isReset = false
  let resetId = 0
  const queryResetIds = new Map<string, number>()

  return {
    clearReset: (queryHash?: string) => {
      isReset = false

      if (queryHash) {
        queryResetIds.set(queryHash, resetId)
      } else {
        queryResetIds.clear()
        resetId = 0
      }
    },
    reset: () => {
      isReset = true
      resetId += 1
    },
    isReset: (queryHash?: string) => {
      if (!queryHash) {
        return isReset
      }

      const queryResetId = queryResetIds.get(queryHash) ?? resetId
      return queryResetId < resetId
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
