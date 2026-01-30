import type {
  ComponentChild,
  ComponentChildren,
  ComponentType,
  ErrorInfo,
} from 'preact'

export type FallbackProps = {
  error: any
  resetErrorBoundary: (...args: any[]) => void
}

type PropsWithChildren<TProps = {}> = TProps & {
  children?: ComponentChildren
}

type ErrorBoundarySharedProps = PropsWithChildren<{
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: (
    details:
      | { reason: 'imperative-api'; args: any[] }
      | { reason: 'keys'; prev: any[] | undefined; next: any[] | undefined },
  ) => void
  resetKeys?: any[]
}>

export type ErrorBoundaryPropsWithComponent = ErrorBoundarySharedProps & {
  fallback?: never
  FallbackComponent: ComponentType<FallbackProps>
  fallbackRender?: never
}

export type ErrorBoundaryPropsWithRender = ErrorBoundarySharedProps & {
  fallback?: never
  FallbackComponent?: never
  fallbackRender: (props: FallbackProps) => ComponentChild
}

export type ErrorBoundaryPropsWithFallback = ErrorBoundarySharedProps & {
  fallback: ComponentChild
  FallbackComponent?: never
  fallbackRender?: never
}

export type ErrorBoundaryProps =
  | ErrorBoundaryPropsWithFallback
  | ErrorBoundaryPropsWithComponent
  | ErrorBoundaryPropsWithRender
