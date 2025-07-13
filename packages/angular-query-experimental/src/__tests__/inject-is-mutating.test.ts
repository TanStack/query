import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { Injector, provideZonelessChangeDetection } from '@angular/core'
import { sleep } from '@tanstack/query-test-utils'
import {
  QueryClient,
  injectIsMutating,
  injectMutation,
  provideTanStackQuery,
} from '..'

describe('injectIsMutating', () => {
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

  test('should properly return isMutating state', async () => {
    const [mutation, isMutating] = TestBed.runInInjectionContext(() => [
      injectMutation(() => ({
        mutationKey: ['isMutating1'],
        mutationFn: (params: { par1: string }) => sleep(10).then(() => params),
      })),
      injectIsMutating(),
    ])

    mutation.mutate({
      par1: 'par1',
    })

    expect(isMutating()).toBe(0)
    await vi.advanceTimersByTimeAsync(0)
    expect(isMutating()).toBe(1)
    await vi.advanceTimersByTimeAsync(11)
    expect(isMutating()).toBe(0)
  })

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsMutating()
      }).toThrowError(/NG0203(.*?)injectIsMutating/)
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsMutating(undefined, {
          injector: TestBed.inject(Injector),
        }),
      ).not.toThrow()
    })
  })
})
