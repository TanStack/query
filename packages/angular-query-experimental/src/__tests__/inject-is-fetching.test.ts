import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { beforeEach, describe, expect } from 'vitest'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideAngularQuery,
} from '..'
import { delayedFetcher } from './test-utils'

describe('injectIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  test('Returns number of fetching queries', fakeAsync(() => {
    const isFetching = TestBed.runInInjectionContext(() => {
      injectQuery(() => ({
        queryKey: ['isFetching1'],
        queryFn: delayedFetcher(100),
      }))
      return injectIsFetching()
    })

    tick()

    expect(isFetching()).toStrictEqual(1)
    flush()
    expect(isFetching()).toStrictEqual(0)
  }))
})
