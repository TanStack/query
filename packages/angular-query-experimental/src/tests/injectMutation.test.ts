import { TestBed, fakeAsync, flush } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { vi } from 'vitest'
import { expect } from 'vitest'
import { injectMutation } from '../injectMutation'
import { provideAngularQuery } from '../providers'
import { QUERY_CLIENT } from '../injectQueryClient'

describe('injectMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(new QueryClient())],
    })

    queryClient = TestBed.inject(QUERY_CLIENT)
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

  it('can access client from options callback', fakeAsync(() => {
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation((client) => ({
        mutationFn: () => {
          expect(client).toBe(queryClient)
        },
      }))
    })

    mutation().mutate({ par1: 'par1' })

    flush()
    expect(mutation().status).toBe('pending')
  }))
})
