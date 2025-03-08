import { TestBed } from '@angular/core/testing'
import { beforeEach, describe, expect } from 'vitest'
import {
  Injector,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideTanStackQuery,
} from '..'
import { delayedFetcher } from './test-utils'

const QUERY_DURATION = 100

const resolveQueries = () => vi.advanceTimersByTimeAsync(QUERY_DURATION)

describe('injectIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()

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

  test('Returns number of fetching queries', async () => {
    const isFetching = TestBed.runInInjectionContext(() => {
      injectQuery(() => ({
        queryKey: ['isFetching1'],
        queryFn: delayedFetcher(100),
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
        injectIsFetching(
          undefined,
          {
            injector: TestBed.inject(Injector),
          },
        ),
      ).not.toThrow()
    })
  })
})
