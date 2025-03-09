import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { beforeEach, describe, expect } from 'vitest'
import { Injector } from '@angular/core'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideTanStackQuery,
} from '..'
import { delayedFetcher } from './test-utils'

describe('injectIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [provideTanStackQuery(queryClient)],
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

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsFetching()
      }).toThrowError(/NG0203(.*?)injectIsFetching/)
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsFetching(undefined, TestBed.inject(Injector)),
      ).not.toThrow()
    })
  })
})
