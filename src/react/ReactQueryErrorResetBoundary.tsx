import React from 'react'

// CONTEXT

interface ReactQueryErrorResetBoundaryValue {
  clearReset: () => void
  isReset: () => boolean
  reset: () => void
}

function createValue(): ReactQueryErrorResetBoundaryValue {
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

export const useErrorResetBoundary = () => React.useContext(context)

// COMPONENT

export interface ReactQueryErrorResetBoundaryProps {
  children:
    | ((value: ReactQueryErrorResetBoundaryValue) => React.ReactNode)
    | React.ReactNode
}

export const ReactQueryErrorResetBoundary: React.FC<ReactQueryErrorResetBoundaryProps> = ({
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
