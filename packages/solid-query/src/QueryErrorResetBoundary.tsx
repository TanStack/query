// CONTEXT

import { createContext, createSignal, useContext, JSX } from 'solid-js'

interface QueryErrorResetBoundaryValue {
  clearReset: () => void
  isReset: () => boolean
  reset: () => void
}

function createValue(): QueryErrorResetBoundaryValue {
  const [isReset, setIsReset] = createSignal(false)
  return {
    clearReset: () => {
      setIsReset(false)
    },
    reset: () => {
      setIsReset(true)
    },
    isReset: () => {
      return isReset()
    },
  }
}

const QueryErrorResetBoundaryContext = createContext(createValue())

// HOOK

export const useQueryErrorResetBoundary = () =>
  useContext(QueryErrorResetBoundaryContext)

// COMPONENT

export interface QueryErrorResetBoundaryProps {
  children: ((value: QueryErrorResetBoundaryValue) => JSX.Element) | JSX.Element
}

export const QueryErrorResetBoundary = (
  props: QueryErrorResetBoundaryProps,
) => {
  const [value] = createSignal(createValue())
  return (
    <QueryErrorResetBoundaryContext.Provider value={value()}>
      {typeof props.children === 'function'
        ? (props.children as Function)(value)
        : props.children}
    </QueryErrorResetBoundaryContext.Provider>
  )
}
