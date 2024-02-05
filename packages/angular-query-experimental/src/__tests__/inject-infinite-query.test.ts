import { TestBed } from '@angular/core/testing'
import { QueryClient } from '@tanstack/query-core'
import { afterEach } from 'vitest'
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
})
