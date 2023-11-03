import { TestBed } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { createQuery } from '../createQuery'
import { provideAngularQuery } from '../providers'
import { useIsFetching } from '../useIsFetching'
import { simpleFetcher } from './test-utils'

describe('useIsFetching', () => {
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

  test('allows passing query client', async () => {
    const isFetching1 = TestBed.runInInjectionContext(() => {
      createQuery(() => ({
        queryKey: ['isFetching1'],
        queryFn: simpleFetcher,
      }))
      return useIsFetching()
    })
    const isFetching2 = TestBed.runInInjectionContext(() => {
      createQuery(() => ({
        queryKey: ['isFetching2'],
        queryFn: simpleFetcher,
      }))
      return useIsFetching({}, new QueryClient())
    })
    expect(isFetching1()).toStrictEqual(1)

    // Because isFetching2 refers to a different query client, it should return 0
    expect(isFetching2()).toStrictEqual(0)
  })
})
