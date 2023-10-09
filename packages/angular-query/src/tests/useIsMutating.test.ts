import { inject, signal } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe } from 'vitest'
import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import {
  CreateMutation,
  UseIsMutating,
  provideAngularQuery,
} from '../providers'
import { successMutator } from './test-utils'

describe('useIsMutating', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    queryClient.mount()

    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  afterEach(() => {
    queryClient.unmount()
  })

  it('should properly return isMutating state', fakeAsync(() => {
    TestBed.runInInjectionContext(() => {
      const isMutating = inject(UseIsMutating)()
      const mutation = inject(CreateMutation)(
        signal({
          mutationKey: ['isMutating1'],
          mutationFn: successMutator<{ par1: string }>,
        }),
      )

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
