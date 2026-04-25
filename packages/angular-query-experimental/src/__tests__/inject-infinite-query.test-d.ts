import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expectTypeOf, it, vi } from 'vitest'
import { provideZonelessChangeDetection } from '@angular/core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectInfiniteQuery, provideTanStackQuery } from '..'
import type { InfiniteData } from '@tanstack/query-core'

describe('injectInfiniteQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should narrow type after isSuccess', () => {
    const key = queryKey()
    const query = TestBed.runInInjectionContext(() => {
      return injectInfiniteQuery(() => ({
        queryKey: key,
        queryFn: ({ pageParam }) =>
          sleep(0).then(() => 'data on page ' + pageParam),
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
