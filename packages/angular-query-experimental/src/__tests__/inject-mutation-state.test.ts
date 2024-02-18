import { signal } from '@angular/core'
import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import { describe, expect, test, vi } from 'vitest'
import { injectMutation } from '../inject-mutation'
import { injectMutationState } from '../inject-mutation-state'
import { provideAngularQuery } from '../providers'
import { successMutator } from './test-utils'

describe('injectMutationState', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('injectMutationState', () => {
    test('should return variables after calling mutate', async () => {
      const mutationKey = ['mutation']
      const variables = 'foo123'

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: mutationKey,
          mutationFn: (params: string) => successMutator(params),
        }))
      })

      mutation.mutate(variables)

      const mutationState = TestBed.runInInjectionContext(() => {
        return injectMutationState(() => ({
          filters: { mutationKey, status: 'pending' },
          select: (m) => m.state.variables,
        }))
      })

      expect(mutationState()).toEqual([variables])
    })

    test('reactive options should update injectMutationState', async () => {
      const mutationKey1 = ['mutation1']
      const mutationKey2 = ['mutation2']
      const variables1 = 'foo123'
      const variables2 = 'bar234'

      const [mutation1, mutation2] = TestBed.runInInjectionContext(() => {
        return [
          injectMutation(() => ({
            mutationKey: mutationKey1,
            mutationFn: (params: string) => successMutator(params),
          })),
          injectMutation(() => ({
            mutationKey: mutationKey2,
            mutationFn: (params: string) => successMutator(params),
          })),
        ]
      })

      mutation1.mutate(variables1)
      mutation2.mutate(variables2)

      const filterKey = signal(mutationKey1)

      const mutationState = TestBed.runInInjectionContext(() => {
        return injectMutationState(() => ({
          filters: { mutationKey: filterKey(), status: 'pending' },
          select: (m) => m.state.variables,
        }))
      })

      expect(mutationState()).toEqual([variables1])

      filterKey.set(mutationKey2)
      TestBed.flushEffects()
      expect(mutationState()).toEqual([variables2])
    })

    test('should return variables after calling mutate', async () => {
      queryClient.clear()
      const mutationKey = ['mutation']
      const variables = 'bar234'

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: mutationKey,
          mutationFn: (params: string) => successMutator(params),
        }))
      })

      mutation.mutate(variables)

      const mutationState = TestBed.runInInjectionContext(() => {
        return injectMutationState()
      })

      expect(mutationState()[0]?.variables).toEqual(variables)
    })
  })
})
