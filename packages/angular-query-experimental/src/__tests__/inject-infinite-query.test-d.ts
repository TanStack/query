import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expectTypeOf, test, vi } from 'vitest'
import { provideExperimentalZonelessChangeDetection } from '@angular/core'
import { QueryClient, injectInfiniteQuery, provideTanStackQuery } from '..'
import { infiniteFetcher } from './test-utils'
import type { InfiniteData } from '@tanstack/query-core'

describe('injectInfiniteQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [
        provideExperimentalZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('should narrow type after isSuccess', async () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectInfiniteQuery(() => ({
        queryKey: ['infiniteQuery'],
        queryFn: infiniteFetcher,
        initialPageParam: 0,
        getNextPageParam: () => 12,
      }))
    })

    if (query.isSuccess()) {
      const data = query.data()
      expectTypeOf(data).toEqualTypeOf<InfiniteData<string, unknown>>()
    }
  })
})
