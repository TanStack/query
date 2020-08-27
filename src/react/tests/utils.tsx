import { waitFor } from '@testing-library/react'

let queryKeyCount = 0

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

export function queryKey(): string {
  queryKeyCount++
  return `query_${queryKeyCount}`
}

export function sleep(timeout: number): Promise<void> {
  return new Promise((resolve, _reject) => {
    setTimeout(resolve, timeout)
  })
}

export function waitForMs(ms: number) {
  const end = Date.now() + ms
  return waitFor(() => {
    if (Date.now() < end) {
      throw new Error('Time not elapsed yet')
    }
  })
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
