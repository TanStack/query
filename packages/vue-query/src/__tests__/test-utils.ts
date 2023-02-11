/* istanbul ignore file */

export function flushPromises(timeout = 0): Promise<unknown> {
  return new Promise(function (resolve) {
    setTimeout(resolve, timeout)
  })
}

export function simpleFetcher(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve('Some data')
    }, 0)
  })
}

export function getSimpleFetcherWithReturnData(returnData: unknown) {
  return () =>
    new Promise((resolve) => setTimeout(() => resolve(returnData), 0))
}

export function infiniteFetcher({
  pageParam = 0,
}: {
  pageParam?: number
}): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve('data on page ' + pageParam)
    }, 0)
  })
}

export function rejectFetcher(): Promise<Error> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      return reject(new Error('Some error'))
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

export function errorMutator<T>(_: T): Promise<Error> {
  return rejectFetcher()
}

export type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends <
  T,
>() => T extends Y ? 1 : 2
  ? true
  : false

export type Expect<T extends true> = T

export const doNotExecute = (_func: () => void) => true
