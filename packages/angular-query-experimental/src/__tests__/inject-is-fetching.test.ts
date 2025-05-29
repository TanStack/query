import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Injector, provideZonelessChangeDetection } from '@angular/core'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideTanStackQuery,
} from '..'

const QUERY_DURATION = 100

const resolveQueries = () => vi.advanceTimersByTimeAsync(QUERY_DURATION)

describe('injectIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()

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

  test('Returns number of fetching queries', async () => {
    const isFetching = TestBed.runInInjectionContext(() => {
      injectQuery(() => ({
        queryKey: ['isFetching1'],
        queryFn: () => sleep(100).then(() => 'Some data'),
      }))
      return injectIsFetching()
    })

    vi.advanceTimersByTime(1)

    expect(isFetching()).toStrictEqual(1)
    await resolveQueries()
    expect(isFetching()).toStrictEqual(0)
  })

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsFetching()
      }).toThrowError(/NG0203(.*?)injectIsFetching/)
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsFetching(undefined, {
          injector: TestBed.inject(Injector),
        }),
      ).not.toThrow()
    })
  })
})
