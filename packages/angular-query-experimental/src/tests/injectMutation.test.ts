import { TestBed, fakeAsync, flush } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { vi } from 'vitest'
import { expect } from 'vitest'
import { injectMutation } from '../injectMutation'
import { provideAngularQuery } from '../providers'

describe('injectMutation', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(new QueryClient())],
    })
  })

  it('should run mutation', fakeAsync(() => {
    const mutationFn = vi.fn()

    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn,
      }))
    })

    mutation().mutate({
      par1: 'par1',
    })

    flush()
    expect(mutation().status).toBe('pending')
  }))
})
