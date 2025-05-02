/* istanbul ignore file */

import { sleep } from '@tanstack/query-test-utils'

export function flushPromises(timeout = 0) {
  return sleep(timeout)
}

export function simpleFetcher() {
  return sleep(0).then(() => 'Some data')
}

export function getSimpleFetcherWithReturnData(returnData: unknown) {
  return () => sleep(0).then(() => returnData)
}

export function infiniteFetcher({ pageParam }: { pageParam?: number }) {
  return sleep(0).then(() => 'data on page ' + pageParam)
}

export function rejectFetcher() {
  return sleep(0).then(() => Promise.reject(new Error('Some error')))
}

export function successMutator<T>(param: T) {
  return sleep(0).then(() => param)
}

export function errorMutator<T>(_: T) {
  return rejectFetcher()
}
