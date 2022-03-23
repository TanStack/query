import { act, render } from '@testing-library/react'
import React from 'react'

import {
  MutationOptions,
  QueryClient,
  QueryClientConfig,
  QueryClientProvider,
  ContextOptions,
} from '../..'
import * as utils from '../../core/utils'

export function createQueryClient(config?: QueryClientConfig): QueryClient {
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  return new QueryClient({ logger: mockLogger, ...config })
}

export function renderWithClient(
  client: QueryClient,
  ui: React.ReactElement,
  options: ContextOptions = {}
) {
  const { rerender, ...result } = render(
    <QueryClientProvider client={client} context={options.context}>
      {ui}
    </QueryClientProvider>
  )
  return {
    ...result,
    rerender: (rerenderUi: React.ReactElement) =>
      rerender(
        <QueryClientProvider client={client} context={options.context}>
          {rerenderUi}
        </QueryClientProvider>
      ),
  }
}

export function mockVisibilityState(value: VisibilityState) {
  return jest.spyOn(document, 'visibilityState', 'get').mockReturnValue(value)
}

export function mockNavigatorOnLine(value: boolean) {
  return jest.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
}

export const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
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
  setTimeout(() => {
    act(() => {
      fn()
    })
  }, ms)
}

/**
 * Assert the parameter is of a specific type.
 */
export const expectType = <T,>(_: T): void => undefined

/**
 * Assert the parameter is not typed as `any`
 */
export const expectTypeNotAny = <T,>(_: 0 extends 1 & T ? never : T): void =>
  undefined

export const Blink: React.FC<{ duration: number }> = ({
  duration,
  children,
}) => {
  const [shouldShow, setShouldShow] = React.useState<boolean>(true)

  React.useEffect(() => {
    setShouldShow(true)
    const timeout = setTimeout(() => setShouldShow(false), duration)
    return () => {
      clearTimeout(timeout)
    }
  }, [duration, children])

  return shouldShow ? <>{children}</> : <>off</>
}

export const executeMutation = (
  queryClient: QueryClient,
  options: MutationOptions<any, any, any, any>
): Promise<unknown> => {
  return queryClient.getMutationCache().build(queryClient, options).execute()
}

// This monkey-patches the isServer-value from utils,
// so that we can pretend to be in a server environment
export function setIsServer(isServer: boolean) {
  const original = utils.isServer
  // @ts-ignore
  utils.isServer = isServer

  return () => {
    // @ts-ignore
    utils.isServer = original
  }
}
