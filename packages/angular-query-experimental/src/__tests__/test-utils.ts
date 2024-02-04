import { isSignal, untracked } from '@angular/core'

export function simpleFetcher(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve('Some data')
    }, 0)
  })
}

export function delayedFetcher(timeout = 0): () => Promise<string> {
  return () =>
    new Promise((resolve) => {
      setTimeout(() => {
        return resolve('Some data')
      }, timeout)
    })
}

export function getSimpleFetcherWithReturnData(returnData: unknown) {
  return () =>
    new Promise((resolve) => setTimeout(() => resolve(returnData), 0))
}

export function rejectFetcher(): Promise<Error> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      return reject(new Error('Some error'))
    }, 0)
  })
}

export function infiniteFetcher({
  pageParam,
}: {
  pageParam?: number
}): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve('data on page ' + pageParam)
    }, 0)
  })
}

export function successMutator<T>(param: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve(param)
    }, 0)
  })
}

export function errorMutator(_parameter?: unknown): Promise<Error> {
  return rejectFetcher()
}

// Evaluate all signals on an object and return the result
function evaluateSignals<T extends Record<string, any>>(
  obj: T,
): { [K in keyof T]: ReturnType<T[K]> } {
  const result: Partial<{ [K in keyof T]: ReturnType<T[K]> }> = {}

  untracked(() => {
    for (const key in obj) {
      if (
        Object.prototype.hasOwnProperty.call(obj, key) &&
        // Only evaluate signals, not normal functions
        isSignal(obj[key])
      ) {
        const func = obj[key]
        result[key] = func()
      }
    }
  })

  return result as { [K in keyof T]: ReturnType<T[K]> }
}

export const expectSignals = <T extends Record<string, any>>(
  obj: T,
  expected: Partial<{ [K in keyof T]: ReturnType<T[K]> }>,
): void => {
  expect(evaluateSignals(obj)).toMatchObject(expected)
}
