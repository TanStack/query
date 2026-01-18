import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { Injector } from '@angular/core'
import { sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectIsFetching, injectQuery } from '..'
import { setupTanStackQueryTestBed } from './test-utils'

describe('injectIsFetching', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()
    queryClient = new QueryClient()

    setupTanStackQueryTestBed(queryClient)
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

    expect(isFetching()).toStrictEqual(0)
    await vi.advanceTimersByTimeAsync(1)
    expect(isFetching()).toStrictEqual(1)
    await vi.advanceTimersByTimeAsync(100)
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
