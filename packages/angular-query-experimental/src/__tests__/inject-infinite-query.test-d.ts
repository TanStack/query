import { afterEach, beforeEach, describe, expectTypeOf, it, test, vi  } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { provideZonelessChangeDetection } from '@angular/core'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectInfiniteQuery, provideTanStackQuery } from '..'
import type { Signal } from '@angular/core';
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

  test('should narrow type after isSuccess', () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectInfiniteQuery(() => ({
        queryKey: ['infiniteQuery'],
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

  it('should provide the correct types to the select function', () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectInfiniteQuery(() => ({
        queryKey: ['infiniteQuery'],
        queryFn: ({ pageParam }) =>
          sleep(0).then(() => 'data on page ' + pageParam),
        initialPageParam: 0,
        getNextPageParam: () => 12,
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<InfiniteData<string, number>>()
          return data
        },
      }))
    })

    expectTypeOf(query.data).toEqualTypeOf<
      Signal<undefined> | Signal<InfiniteData<string, number>>
    >()
  })
})
