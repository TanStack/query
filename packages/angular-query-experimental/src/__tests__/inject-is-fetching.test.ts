import { Injector } from '@angular/core'
import { TestBed, fakeAsync, flush, tick } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
// NOTE: do not import test from 'vitest' here - only global test function is patched for Angular zone
import { beforeEach, describe, expect } from 'vitest'
import { injectIsFetching } from '../inject-is-fetching'
import { injectQuery } from '../inject-query'
import { provideAngularQuery } from '../providers'
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

  describe('injection context', () => {
    test('throws NG0203 outside injection context', () => {
      expect(() => {
        injectIsFetching()
      }).toThrowError(
        'NG0203: injectIsFetching() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203',
      )
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsFetching(undefined, TestBed.inject(Injector)),
      ).not.toThrow()
    })
  })
})
