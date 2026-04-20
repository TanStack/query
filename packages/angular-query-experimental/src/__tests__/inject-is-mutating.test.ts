import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TestBed } from '@angular/core/testing'
import { Injector, provideZonelessChangeDetection } from '@angular/core'
import { queryKey, sleep } from '@tanstack/query-test-utils'
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

  it('should properly return isMutating state', async () => {
    const key = queryKey()
    const [mutation, isMutating] = TestBed.runInInjectionContext(() => [
      injectMutation(() => ({
        mutationKey: key,
        mutationFn: (params: { par1: string }) => sleep(10).then(() => params),
      })),
      injectIsMutating(),
    ])

    expect(isMutating()).toBe(0)

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
    it('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectIsMutating()
      }).toThrow(/NG0203(.*?)injectIsMutating/)
    })

    it('can be used outside injection context when passing an injector', () => {
      expect(
        injectIsMutating(undefined, {
          injector: TestBed.inject(Injector),
        }),
      ).not.toThrow()
    })
  })
})
