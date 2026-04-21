import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Injector, provideZonelessChangeDetection } from '@angular/core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectIsFetching,
  injectQuery,
  provideTanStackQuery,
} from '..'

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

  it('should return the number of fetching queries', async () => {
    const key = queryKey()
    const isFetching = TestBed.runInInjectionContext(() => {
      injectQuery(() => ({
        queryKey: key,
        queryFn: () => sleep(100).then(() => 'Some data'),
      }))
      return injectIsFetching()
    })

    expect(isFetching()).toStrictEqual(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(isFetching()).toStrictEqual(1)
    await vi.advanceTimersByTimeAsync(100)
    expect(isFetching()).toStrictEqual(0)
  })

  describe('injection context', () => {
    it('should throw NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsFetching()
      }).toThrow(/NG0203(.*?)injectIsFetching/)
    })

    it('should be usable outside injection context when passing an injector', () => {
      expect(
        injectIsFetching(undefined, {
          injector: TestBed.inject(Injector),
        }),
      ).not.toThrow()
    })
  })
})
