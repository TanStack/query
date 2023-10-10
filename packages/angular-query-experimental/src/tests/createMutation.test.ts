import { signal } from '@angular/core'
import { TestBed, fakeAsync, flush } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { vi } from 'vitest'
import { expect } from 'vitest'
import { createMutation } from '../createMutation'
import { provideAngularQuery } from '../providers'

describe('CreateMutation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(new QueryClient())],
    })
  })

  it('should run mutation', fakeAsync(() => {
    const mutationFn = vi.fn()

    const mutation = TestBed.runInInjectionContext(() => {
      return createMutation(
        signal({
          mutationFn,
        }),
      )
    })

    mutation().mutate({
      par1: 'par1',
    })

    flush()
    expect(mutation().status).toBe('pending')
  }))

  it('should allow passing a different queryClient', fakeAsync(() => {
    const mutationFn = vi.fn()
    const queryClient = new QueryClient({
      defaultOptions: {
        mutations: {
          mutationFn,
        },
      },
    })

    const mutation = TestBed.runInInjectionContext(() => {
      return createMutation(signal({}), queryClient)
    })

    mutation().mutate()
    flush()
    expect(mutation().status).toBe('pending')
  }))
})
