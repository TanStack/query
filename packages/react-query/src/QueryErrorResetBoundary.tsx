'use client'
import * as React from 'react'

import { useQueryClient } from './QueryClientProvider'

// CONTEXT
export type QueryErrorResetFunction = () => void
export type QueryErrorIsResetFunction = () => boolean
export type QueryErrorClearResetFunction = () => void

export interface QueryErrorResetBoundaryValue {
  clearReset: QueryErrorClearResetFunction
  isReset: QueryErrorIsResetFunction
  reset: QueryErrorResetFunction
  register: (queryHash: string) => void
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
    register: () => {},
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
  const client = useQueryClient()
  const registeredQueries = React.useRef(new Set<string>())
  const [value] = React.useState(() => {
    const boundary = createValue()
    return {
      ...boundary,
      reset: () => {
        boundary.reset()
        const queryHashes = new Set(registeredQueries.current)
        registeredQueries.current.clear()

        void client.refetchQueries({
          predicate: (query) =>
            queryHashes.has(query.queryHash) && query.state.status === 'error',
          type: 'active',
        })
      },
      register: (queryHash: string) => {
        registeredQueries.current.add(queryHash)
      },
    }
  })
  return (
    <QueryErrorResetBoundaryContext.Provider value={value}>
      {typeof children === 'function' ? children(value) : children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}

/**
 * @internal
 */
export function getQueryHash(query: any): string | undefined {
  if (typeof query === 'object' && query !== null) {
    if ('queryHash' in query) {
      return query.queryHash
    }
    if (
      'promise' in query &&
      query.promise &&
      typeof query.promise === 'object' &&
      'queryHash' in query.promise
    ) {
      return query.promise.queryHash
    }
  }
  return undefined
}

export function useTrackQueryHash(query: any) {
  const { register } = useQueryErrorResetBoundary()
  const hash = getQueryHash(query)
  if (hash) {
    register(hash)
  }
}
