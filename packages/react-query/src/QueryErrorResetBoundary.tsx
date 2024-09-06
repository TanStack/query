'use client'
import * as React from 'react'

export class QueryErrorResetBoundaryValue {
  #isReset = false

  clearReset() {
    this.#isReset = false
  }
  reset() {
    this.#isReset = true
  }
  isReset() {
    return this.#isReset
  }
}

const QueryErrorResetBoundaryContext = React.createContext(
  new QueryErrorResetBoundaryValue(),
)

export const useQueryErrorResetBoundary = () =>
  React.useContext(QueryErrorResetBoundaryContext)

export interface QueryErrorResetBoundaryProps {
  children:
    | ((value: QueryErrorResetBoundaryValue) => React.ReactNode)
    | React.ReactNode
}

export const QueryErrorResetBoundary = ({
  children,
}: QueryErrorResetBoundaryProps) => {
  const [value] = React.useState(new QueryErrorResetBoundaryValue())
  return (
    <QueryErrorResetBoundaryContext.Provider value={value}>
      {typeof children === 'function'
        ? (children as Function)(value)
        : children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
