import { vi } from 'vitest'
import * as React from 'react'
import { act, render } from '@testing-library/react'
import * as utils from '@tanstack/query-core'
import { QueryClient, QueryClientProvider, onlineManager } from '..'
import type { QueryClientConfig } from '..'
import type { SpyInstance } from 'vitest'

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
): ReturnType<typeof render> {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={client}>{rerenderUi}</QueryClientProvider>,
      ),
  } as any
}

export const Blink = ({
  duration,
  children,
}: {
  duration: number
  children: React.ReactNode
}) => {
  const [shouldShow, setShouldShow] = React.useState<boolean>(true)

  React.useEffect(() => {
    setShouldShow(true)
    const timeout = setActTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  return new QueryClient(config)
}

export function mockVisibilityState(
  value: DocumentVisibilityState,
): SpyInstance<[], DocumentVisibilityState> {
  return vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockOnlineManagerIsOnline(
  value: boolean,
): SpyInstance<[], boolean> {
  return vi.spyOn(onlineManager, 'isOnline').mockReturnValue(value)
}

let queryKeyCount = 0
export function queryKey(): Array<string> {
  queryKeyCount++
  return [`query_${queryKeyCount}`]
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export function setActTimeout(fn: () => void, ms?: number) {
  return setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}

export type Equal<TTargetA, TTargetB> = (<T>() => T extends TTargetA
  ? 1
  : 2) extends <T>() => T extends TTargetB ? 1 : 2
  ? true
  : false

export type Expect<T extends true> = T

/**
 * Assert the parameter is not typed as `any`
 */
export function expectTypeNotAny<T>(_: 0 extends 1 & T ? never : T): void {
  return undefined
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

export const doNotExecute = (_func: () => void) => true
