import { createContext } from 'preact'

export type ErrorBoundaryContextType = {
  didCatch: boolean
  error: any
  resetErrorBoundary: (...args: any[]) => void
}

export const ErrorBoundaryContext =
  createContext<ErrorBoundaryContextType | null>(null)
