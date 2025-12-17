import { vi } from 'vitest'
import { act, render } from '@testing-library/preact'
import * as utils from '@tanstack/query-core'
import { QueryClientProvider, onlineManager } from '..'
import type { QueryClient } from '..'
import type { MockInstance } from 'vitest'
import { useEffect, useState } from 'preact/hooks'
import { ComponentChildren, VNode } from 'preact'
import { ErrorBoundary as ErrorBoundaryPreactIso } from 'preact-iso'

export function renderWithClient(
  client: QueryClient,
  ui: VNode,
): ReturnType<typeof render> {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
  return {
    ...result,
    rerender: (rerenderUi: VNode) =>
      rerender(
        <QueryClientProvider client={client}>{rerenderUi}</QueryClientProvider>,
      ),
  } as any
}

export function Blink({
  duration,
  children,
}: {
  duration: number
  children: ComponentChildren
}) {
  const [shouldShow, setShouldShow] = useState<boolean>(true)

  useEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}

export function mockOnlineManagerIsOnline(
  value: boolean,
): MockInstance<() => boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}

// This monkey-patches the isServer-value from utils,
// so that we can pretend to be in a server environment
export function setIsServer(isServer: boolean) {
  const original = utils.isServer
  Object.defineProperty(utils, 'isServer', {
    get: () => isServer,
  })

  return () => {
    Object.defineProperty(utils, 'isServer', {
      get: () => original,
    })
  }
}

/**
 * Custom Error Boundary port for 'react-error-boundary'
 * Inspired by https://github.com/bvaughn/react-error-boundary/blob/master/src/ErrorBoundary.ts
 */
export const ErrorBoundary = ({
  children,
  fallbackRender,
  onReset,
}: {
  children: ComponentChildren
  fallbackRender: (props: {
    error: Error
    resetErrorBoundary: (...args: any[]) => void
  }) => VNode
  onReset?: (error: Error) => void
}) => {
  const [error, setError] = useState<Error | null>()

  const resetErrorBoundary = () => {
    if (error && onReset) {
      onReset(error)
    }
    setError(null)
  }

  if (error) {
    return fallbackRender({ error, resetErrorBoundary })
  }

  return (
    <ErrorBoundaryPreactIso
      onError={(e) => {
        setError(e)
      }}
    >
      {children}
    </ErrorBoundaryPreactIso>
  )
}
