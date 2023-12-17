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

export function successMutator<T>(param: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      return resolve(param)
    }, 0)
  })
}
