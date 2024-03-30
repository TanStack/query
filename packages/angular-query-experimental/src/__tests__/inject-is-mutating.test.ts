import { Injector } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
// NOTE: do not import test from 'vitest' here - only global test function is patched for Angular zone
import { beforeEach, describe, expect } from 'vitest'
import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { injectIsMutating } from '../inject-is-mutating'
import { injectMutation } from '../inject-mutation'
import { provideAngularQuery } from '../providers'
import { successMutator } from './test-utils'

describe('injectIsMutating', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  test('should properly return isMutating state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const isMutating = injectIsMutating()
      const mutation = injectMutation(() => ({
        mutationKey: ['isMutating1'],
        mutationFn: successMutator<{ par1: string }>,
      }))

      expect(isMutating()).toBe(0)

      mutation.mutate({
        par1: 'par1',
      })

      tick()

      expect(isMutating()).toBe(1)
    })
  }))

  describe('injection context', () => {
    test('throws NG0203 outside injection context', () => {
      expect(() => {
        injectIsMutating()
      }).toThrowError(
        'NG0203: injectIsMutating() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203',
      )
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsMutating(undefined, TestBed.inject(Injector)),
      ).not.toThrow()
    })
  })
})
