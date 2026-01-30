import { createElement, Component } from 'preact'
import type { ErrorInfo } from 'preact'

import { ErrorBoundaryContext } from './ErrorBoundaryContext'
import type { ErrorBoundaryProps, FallbackProps } from './types'

type ErrorBoundaryState =
  | {
      didCatch: true
      error: any
    }
  | {
      didCatch: false
      error: null
    }

const initialState: ErrorBoundaryState = {
  didCatch: false,
  error: null,
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.resetErrorBoundary = this.resetErrorBoundary.bind(this)
    this.state = initialState
  }

  static getDerivedStateFromError(error: Error) {
    return { didCatch: true, error }
  }

  resetErrorBoundary(...args: any[]) {
    const { error } = this.state

    if (error !== null) {
      this.props.onReset?.({
        args,
        reason: 'imperative-api',
      })

      this.setState(initialState)
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    /**
     * To emulate the react behaviour of console.error
     * we add one here to show that the errors bubble up
     * to the system and can be seen in the console
     */
    console.error('%o\n\n%s', error, info)
    this.props.onError?.(error, info)
  }

  componentDidUpdate(
    prevProps: ErrorBoundaryProps,
    prevState: ErrorBoundaryState,
  ) {
    const { didCatch } = this.state
    const { resetKeys } = this.props

    // There's an edge case where if the thing that triggered the error happens to *also* be in the resetKeys array,
    // we'd end up resetting the error boundary immediately.
    // This would likely trigger a second error to be thrown.
    // So we make sure that we don't check the resetKeys on the first call of cDU after the error is set.

    if (
      didCatch &&
      prevState.error !== null &&
      hasArrayChanged(prevProps.resetKeys, resetKeys)
    ) {
      this.props.onReset?.({
        next: resetKeys,
        prev: prevProps.resetKeys,
        reason: 'keys',
      })

      // eslint-disable-next-line
      this.setState(initialState)
    }
  }

  render() {
    const { children, fallbackRender, FallbackComponent, fallback } = this.props
    const { didCatch, error } = this.state

    let childToRender = children

    if (didCatch) {
      const props: FallbackProps = {
        error,
        resetErrorBoundary: this.resetErrorBoundary,
      }

      if (typeof fallbackRender === 'function') {
        childToRender = fallbackRender(props)
      } else if (FallbackComponent) {
        childToRender = createElement(FallbackComponent, props)
      } else if (fallback !== undefined) {
        childToRender = fallback
      } else {
        console.error(
          'preact-error-boundary requires either a fallback, fallbackRender, or FallbackComponent prop',
        )

        throw error
      }
    }

    return createElement(
      ErrorBoundaryContext.Provider,
      {
        value: {
          didCatch,
          error,
          resetErrorBoundary: this.resetErrorBoundary,
        },
      },
      childToRender,
    )
  }
}

function hasArrayChanged(a: any[] = [], b: any[] = []) {
  return (
    a.length !== b.length || a.some((item, index) => !Object.is(item, b[index]))
  )
}
