import React from 'react'

// CONTEXT

interface QueryErrorResetBoundaryValue {
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

const context = React.createContext(createValue())

// HOOK

export const useQueryErrorResetBoundary = () => React.useContext(context)

// COMPONENT

export interface QueryErrorResetBoundaryProps {
  children:
    | ((value: QueryErrorResetBoundaryValue) => React.ReactNode)
    | React.ReactNode
}

export const QueryErrorResetBoundary: React.FC<QueryErrorResetBoundaryProps> = ({
  children,
}) => {
  const value = React.useMemo(() => createValue(), [])
  return (
    <context.Provider value={value}>
      {typeof children === 'function'
        ? (children as Function)(value)
        : children}
    </context.Provider>
  )
}
