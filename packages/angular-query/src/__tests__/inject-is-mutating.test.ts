import { beforeEach, describe } from 'vitest'
import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { Injector } from '@angular/core'
import {
  QueryClient,
  injectIsMutating,
  injectMutation,
  provideTanStackQuery,
} from '..'
import { successMutator } from './test-utils'

describe('injectIsMutating', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()

    TestBed.configureTestingModule({
      providers: [provideTanStackQuery(queryClient)],
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
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsMutating()
      }).toThrowError(/NG0203(.*?)injectIsMutating/)
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsMutating(undefined, TestBed.inject(Injector)),
      ).not.toThrow()
    })
  })
})
