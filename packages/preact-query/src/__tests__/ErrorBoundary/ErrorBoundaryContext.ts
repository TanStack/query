import { createContext } from 'preact'

type ErrorBoundaryContextType = {
  didCatch: boolean
  error: any
  resetErrorBoundary: (...args: Array<any>) => void
}

export const ErrorBoundaryContext =
  createContext<ErrorBoundaryContextType | null>(null)
