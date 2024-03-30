import { Injector } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
// NOTE: do not import test from 'vitest' here - only global test function is patched for Angular zone
import { afterEach, describe, expect } from 'vitest'
import { injectInfiniteQuery } from '../inject-infinite-query'
import { provideAngularQuery } from '../providers'
import { expectSignals, infiniteFetcher } from './test-utils'

const QUERY_DURATION = 1000

const resolveQueries = () => vi.advanceTimersByTimeAsync(QUERY_DURATION)

describe('injectInfiniteQuery', () => {
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

  test('should properly execute infinite query', async () => {
    const query = TestBed.runInInjectionContext(() => {
      return injectInfiniteQuery(() => ({
        queryKey: ['infiniteQuery'],
        queryFn: infiniteFetcher,
        initialPageParam: 0,
        getNextPageParam: () => 12,
      }))
    })

    expectSignals(query, {
      data: undefined,
      status: 'pending',
    })

    await resolveQueries()

    expectSignals(query, {
      data: {
        pageParams: [0],
        pages: ['data on page 0'],
      },
      status: 'success',
    })

    void query.fetchNextPage()

    await resolveQueries()

    expectSignals(query, {
      data: {
        pageParams: [0, 12],
        pages: ['data on page 0', 'data on page 12'],
      },
      status: 'success',
    })
  })

  describe('injection context', () => {
    test('throws NG0203 outside injection context', () => {
      expect(() => {
        injectInfiniteQuery(() => ({
          queryKey: ['injectionContextError'],
          queryFn: infiniteFetcher,
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }))
      }).toThrowError(
        'NG0203: injectInfiniteQuery() can only be used within an injection context such as a constructor, a factory function, a field initializer, or a function used with `runInInjectionContext`. Find more at https://angular.io/errors/NG0203',
      )
    })

    test('can be used outside injection context when passing an injector', () => {
      const query = injectInfiniteQuery(
        () => ({
          queryKey: ['manualInjector'],
          queryFn: infiniteFetcher,
          initialPageParam: 0,
          getNextPageParam: () => 12,
        }),
        TestBed.inject(Injector),
      )

      expect(query.status()).toBe('pending')
    })
  })
})
