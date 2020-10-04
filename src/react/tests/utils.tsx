import { act, render } from '@testing-library/react'
import React from 'react'

import { QueryClient, QueryClientProvider } from '../..'

export function renderWithClient(client: QueryClient, ui: React.ReactElement) {
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

export function mockVisibilityState(value: string) {
  Object.defineProperty(document, 'visibilityState', {
    value,
    configurable: true,
  })
}

export function mockNavigatorOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
  })
}

export function mockConsoleError() {
  const consoleMock = jest.spyOn(console, 'error')
  consoleMock.mockImplementation(() => undefined)
  return consoleMock
}

let queryKeyCount = 0
export function queryKey(): string {
  queryKeyCount++
  return `query_${queryKeyCount}`
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
 * Checks that `T` is of type `U`.
 */
export type TypeOf<T, U> = Exclude<U, T> extends never ? true : false

/**
 * Checks that `T` is equal to `U`.
 */
export type TypeEqual<T, U> = Exclude<T, U> extends never
  ? Exclude<U, T> extends never
    ? true
    : false
  : false

/**
 * Assert the parameter is of a specific type.
 */
export const expectType = <T,>(_: T): void => undefined
