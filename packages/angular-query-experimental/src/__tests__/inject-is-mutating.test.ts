import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe } from 'vitest'
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

  it('should properly return isMutating state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const isMutating = injectIsMutating()
      const mutation = injectMutation(() => ({
        mutationKey: ['isMutating1'],
        mutationFn: successMutator<{ par1: string }>,
      }))

      expect(isMutating()).toBe(0)

      mutation().mutate({
        par1: 'par1',
      })

      tick()

      TestBed.flushEffects()

      expect(isMutating()).toBe(1)

      tick()
    })
  }))
})
