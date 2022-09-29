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
  return new Promise((resolve, reject) => {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMutator<T>(param: T): Promise<Error> {
  return rejectFetcher()
}
