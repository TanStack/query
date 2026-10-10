import type {
  ComponentChild,
  ComponentChildren,
  ComponentType,
  ErrorInfo,
} from 'preact'

export type FallbackProps = {
  error: any
  resetErrorBoundary: (...args: Array<any>) => void
}

type PropsWithChildren<TProps = {}> = TProps & {
  children?: ComponentChildren
}

type ErrorBoundarySharedProps = PropsWithChildren<{
  onError?: (error: Error, info: ErrorInfo) => void
  onReset?: (
    details:
      | { reason: 'imperative-api'; args: Array<any> }
      | {
          reason: 'keys'
          prev: Array<any> | undefined
          next: Array<any> | undefined
        },
  ) => void
  resetKeys?: Array<any>
}>

type ErrorBoundaryPropsWithComponent = ErrorBoundarySharedProps & {
  fallback?: never
  FallbackComponent: ComponentType<FallbackProps>
  fallbackRender?: never
}

type ErrorBoundaryPropsWithRender = ErrorBoundarySharedProps & {
  fallback?: never
  FallbackComponent?: never
  fallbackRender: (props: FallbackProps) => ComponentChild
}

type ErrorBoundaryPropsWithFallback = ErrorBoundarySharedProps & {
  fallback: ComponentChild
  FallbackComponent?: never
  fallbackRender?: never
}

export type ErrorBoundaryProps =
  | ErrorBoundaryPropsWithFallback
  | ErrorBoundaryPropsWithComponent
  | ErrorBoundaryPropsWithRender
