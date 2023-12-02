import { TestBed, fakeAsync, flush } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { beforeEach, describe, expect } from 'vitest'
import { injectIsFetching } from '../injectIsFetching'
import { injectQuery } from '../injectQuery'
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

  it('Returns number of fetching queries', fakeAsync(() => {
    const isFetching = TestBed.runInInjectionContext(() => {
      injectQuery(() => ({
        queryKey: ['isFetching1'],
        queryFn: delayedFetcher(100),
      }))
      return injectIsFetching()
    })
    expect(isFetching()).toStrictEqual(1)
    flush()
    expect(isFetching()).toStrictEqual(0)
  }))
})
