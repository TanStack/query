import {
  ApplicationRef,
  Component,
  provideZonelessChangeDetection,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { HttpClient, provideHttpClient } from '@angular/common/http'
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { sleep } from '@tanstack/query-test-utils'
import { lastValueFrom } from 'rxjs'
import {
  QueryClient,
  injectMutation,
  injectQuery,
  onlineManager,
  provideTanStackQuery,
} from '..'

describe('PendingTasks Integration', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    vi.useFakeTimers()

    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })

    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideTanStackQuery(queryClient),
      ],
    })
  })

  afterEach(() => {
    onlineManager.setOnline(true)
    vi.useRealTimers()
    queryClient.clear()
  })

  describe('Synchronous Resolution', () => {
    test('should handle synchronous queryFn with whenStable()', async () => {
      const app = TestBed.inject(ApplicationRef)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['sync'],
          queryFn: () => 'instant-data', // Resolves synchronously
        })),
      )

      // Should start as pending even with synchronous data
      expect(query.status()).toBe('pending')
      expect(query.data()).toBeUndefined()

      const stablePromise = app.whenStable()
      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      // Should work correctly even though queryFn was synchronous
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('instant-data')
    })

    test('should handle synchronous error with whenStable()', async () => {
      const app = TestBed.inject(ApplicationRef)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['sync-error'],
          queryFn: () => {
            throw new Error('instant-error')
          }, // Throws synchronously
        })),
      )

      const stablePromise = app.whenStable()
      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      expect(query.status()).toBe('error')
      expect(query.error()).toEqual(new Error('instant-error'))
    })

    test('should handle synchronous mutationFn with whenStable()', async () => {
      const app = TestBed.inject(ApplicationRef)
      let mutationFnCalled = false

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            mutationFnCalled = true
            await Promise.resolve()
            return `processed: ${data}`
          },
        })),
      )

      mutation.mutate('test')

      TestBed.tick()

      const stablePromise = app.whenStable()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      expect(mutationFnCalled).toBe(true)
      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('processed: test')
    })

    test('should handle synchronous mutation error with whenStable()', async () => {
      const app = TestBed.inject(ApplicationRef)

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async () => {
            await Promise.resolve()
            throw new Error('sync-mutation-error')
          },
        })),
      )

      mutation.mutate()

      TestBed.tick()

      const stablePromise = app.whenStable()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      expect(mutation.isError()).toBe(true)
      expect(mutation.error()).toEqual(new Error('sync-mutation-error'))
    })
  })

  describe('Race Conditions', () => {
    test('should handle query that completes during initial subscription', async () => {
      const app = TestBed.inject(ApplicationRef)
      let resolveQuery: (value: string) => void

      const queryPromise = new Promise<string>((resolve) => {
        resolveQuery = resolve
      })

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['race-condition'],
          queryFn: () => queryPromise,
        })),
      )

      // Resolve immediately to create potential race condition
      resolveQuery!('race-data')

      const stablePromise = app.whenStable()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('race-data')
    })

    test('should handle rapid refetches without task leaks', async () => {
      const app = TestBed.inject(ApplicationRef)
      let callCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['rapid-refetch'],
          queryFn: async () => {
            callCount++
            await sleep(10)
            return `data-${callCount}`
          },
        })),
      )

      // Trigger multiple rapid refetches
      query.refetch()
      query.refetch()
      query.refetch()

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toMatch(/^data-\d+$/)
    })

    test('should keep PendingTasks active while query retry is paused offline', async () => {
      const app = TestBed.inject(ApplicationRef)
      let attempt = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['paused-offline'],
          retry: 1,
          retryDelay: 50, // Longer delay to ensure we can go offline before retry
          queryFn: async () => {
            attempt++
            if (attempt === 1) {
              throw new Error('offline-fail')
            }
            await sleep(10)
            return 'final-data'
          },
        })),
      )

      // Allow the initial attempt to start and fail
      await vi.advanceTimersByTimeAsync(0)
      await Promise.resolve()

      // Wait for the first attempt to complete and start retry delay
      await vi.advanceTimersByTimeAsync(10)
      await Promise.resolve()

      expect(query.status()).toBe('pending')
      expect(query.fetchStatus()).toBe('fetching')

      // Simulate the app going offline during retry delay
      onlineManager.setOnline(false)

      // Advance past the retry delay to trigger the pause
      await vi.advanceTimersByTimeAsync(50)
      await Promise.resolve()

      expect(query.fetchStatus()).toBe('paused')

      const stablePromise = app.whenStable()
      let stableResolved = false
      void stablePromise.then(() => {
        stableResolved = true
      })

      await Promise.resolve()

      // PendingTasks should continue blocking stability while the fetch is paused
      expect(stableResolved).toBe(false)
      expect(query.status()).toBe('pending')

      // Bring the app back online so the retry can continue
      onlineManager.setOnline(true)

      // Give time for the retry to resume and complete
      await vi.advanceTimersByTimeAsync(20)
      await Promise.resolve()

      await stablePromise

      expect(stableResolved).toBe(true)
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('final-data')
    })
  })

  describe('Component Destruction', () => {
    @Component({
      template: '',
    })
    class TestComponent {
      query = injectQuery(() => ({
        queryKey: ['component-query'],
        queryFn: async () => {
          await sleep(100)
          return 'component-data'
        },
      }))

      mutation = injectMutation(() => ({
        mutationFn: async (data: string) => {
          await sleep(100)
          return `processed: ${data}`
        },
      }))
    }

    test('should cleanup pending tasks when component with active query is destroyed', async () => {
      const app = TestBed.inject(ApplicationRef)
      const fixture = TestBed.createComponent(TestComponent)

      // Start the query
      expect(fixture.componentInstance.query.status()).toBe('pending')

      // Destroy component while query is running
      fixture.destroy()

      // Angular should become stable even though component was destroyed
      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(150)

      await expect(stablePromise).resolves.toEqual(undefined)
    })

    test('should cleanup pending tasks when component with active mutation is destroyed', async () => {
      const app = TestBed.inject(ApplicationRef)
      const fixture = TestBed.createComponent(TestComponent)

      fixture.componentInstance.mutation.mutate('test')

      // Destroy component while mutation is running
      fixture.destroy()

      // Angular should become stable even though component was destroyed
      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(150)

      await expect(stablePromise).resolves.toEqual(undefined)
    })
  })

  describe('Concurrent Operations', () => {
    test('should handle multiple queries running simultaneously', async () => {
      const app = TestBed.inject(ApplicationRef)

      const query1 = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['concurrent-1'],
          queryFn: async () => {
            await sleep(30)
            return 'data-1'
          },
        })),
      )

      const query2 = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['concurrent-2'],
          queryFn: async () => {
            await sleep(50)
            return 'data-2'
          },
        })),
      )

      const query3 = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['concurrent-3'],
          queryFn: () => 'instant-data', // Synchronous
        })),
      )

      // All queries should start
      expect(query1.status()).toBe('pending')
      expect(query2.status()).toBe('pending')
      expect(query3.status()).toBe('pending')

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      // All queries should be complete
      expect(query1.status()).toBe('success')
      expect(query1.data()).toBe('data-1')
      expect(query2.status()).toBe('success')
      expect(query2.data()).toBe('data-2')
      expect(query3.status()).toBe('success')
      expect(query3.data()).toBe('instant-data')
    })

    test('should handle multiple mutations running simultaneously', async () => {
      const app = TestBed.inject(ApplicationRef)

      const mutation1 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            await sleep(30)
            return `processed-1: ${data}`
          },
        })),
      )

      const mutation2 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            await sleep(50)
            return `processed-2: ${data}`
          },
        })),
      )

      const mutation3 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            await Promise.resolve()
            return `processed-3: ${data}`
          },
        })),
      )

      // Start all mutations
      mutation1.mutate('test1')
      mutation2.mutate('test2')
      mutation3.mutate('test3')

      TestBed.tick()

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      // All mutations should be complete
      expect(mutation1.isSuccess()).toBe(true)
      expect(mutation1.data()).toBe('processed-1: test1')
      expect(mutation2.isSuccess()).toBe(true)
      expect(mutation2.data()).toBe('processed-2: test2')
      expect(mutation3.isSuccess()).toBe(true)
      expect(mutation3.data()).toBe('processed-3: test3')
    })

    test('should handle mixed queries and mutations', async () => {
      const app = TestBed.inject(ApplicationRef)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['mixed-query'],
          queryFn: async () => {
            await sleep(40)
            return 'query-data'
          },
        })),
      )

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            await sleep(60)
            return `mutation: ${data}`
          },
        })),
      )

      // Start both operations
      mutation.mutate('test')

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(70)
      await stablePromise

      // Both should be complete
      expect(query.status()).toBe('success')
      expect(query.data()).toBe('query-data')
      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('mutation: test')
    })
  })

  describe('HttpClient Integration', () => {
    beforeEach(() => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
          provideHttpClient(),
          provideHttpClientTesting(),
        ],
      })
    })

    test('should handle multiple HttpClient requests with lastValueFrom', async () => {
      const app = TestBed.inject(ApplicationRef)
      const httpClient = TestBed.inject(HttpClient)
      const httpTestingController = TestBed.inject(HttpTestingController)

      const query1 = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['http-1'],
          queryFn: () =>
            lastValueFrom(httpClient.get<{ id: number }>('/api/1')),
        })),
      )

      const query2 = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['http-2'],
          queryFn: () =>
            lastValueFrom(httpClient.get<{ id: number }>('/api/2')),
        })),
      )

      // Schedule HTTP responses
      setTimeout(() => {
        const req1 = httpTestingController.expectOne('/api/1')
        req1.flush({ id: 1 })

        const req2 = httpTestingController.expectOne('/api/2')
        req2.flush({ id: 2 })
      }, 10)

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      expect(query1.status()).toBe('success')
      expect(query1.data()).toEqual({ id: 1 })
      expect(query2.status()).toBe('success')
      expect(query2.data()).toEqual({ id: 2 })

      httpTestingController.verify()
    })

    test('should handle HttpClient request cancellation', async () => {
      const app = TestBed.inject(ApplicationRef)
      const httpClient = TestBed.inject(HttpClient)
      const httpTestingController = TestBed.inject(HttpTestingController)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['http-cancel'],
          queryFn: () =>
            lastValueFrom(httpClient.get<{ data: string }>('/api/cancel')),
        })),
      )

      // Cancel the request before it completes
      setTimeout(() => {
        const req = httpTestingController.expectOne('/api/cancel')
        req.error(new ProgressEvent('error'), {
          status: 0,
          statusText: 'Unknown Error',
        })
      }, 10)

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(20)
      await stablePromise

      expect(query.status()).toBe('error')

      httpTestingController.verify()
    })
  })

  describe('Edge Cases', () => {
    test('should handle query cancellation mid-flight', async () => {
      const app = TestBed.inject(ApplicationRef)

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['cancel-test'],
          queryFn: async () => {
            await sleep(100)
            return 'data'
          },
        })),
      )

      // Cancel the query after a short delay
      setTimeout(() => {
        queryClient.cancelQueries({ queryKey: ['cancel-test'] })
      }, 20)

      // Advance to the cancellation point
      await vi.advanceTimersByTimeAsync(20)

      TestBed.tick()

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(130)
      await stablePromise

      // Cancellation should restore the pre-fetch state
      expect(query.status()).toBe('pending')
      expect(query.fetchStatus()).toBe('idle')
    })

    test('should handle query retry and pending task tracking', async () => {
      const app = TestBed.inject(ApplicationRef)
      let attemptCount = 0

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: ['retry-test'],
          retry: 2,
          retryDelay: 10,
          queryFn: async () => {
            attemptCount++
            if (attemptCount <= 2) {
              throw new Error(`Attempt ${attemptCount} failed`)
            }
            return 'success-data'
          },
        })),
      )

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(50)
      await stablePromise

      expect(query.status()).toBe('success')
      expect(query.data()).toBe('success-data')
      expect(attemptCount).toBe(3) // Initial + 2 retries
    })

    test('should handle mutation with optimistic updates', async () => {
      const app = TestBed.inject(ApplicationRef)
      const testQueryKey = ['optimistic-test']

      queryClient.setQueryData(testQueryKey, 'initial-data')

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (newData: string) => {
            await sleep(50)
            return newData
          },
          onMutate: async (newData) => {
            // Optimistic update
            const previousData = queryClient.getQueryData(testQueryKey)
            queryClient.setQueryData(testQueryKey, newData)
            return { previousData }
          },
          onError: (_err, _newData, context) => {
            // Rollback on error
            if (context?.previousData) {
              queryClient.setQueryData(testQueryKey, context.previousData)
            }
          },
        })),
      )

      mutation.mutate('optimistic-data')

      await Promise.resolve()

      // Data should be optimistically updated immediately
      expect(queryClient.getQueryData(testQueryKey)).toBe('optimistic-data')

      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('optimistic-data')
      expect(queryClient.getQueryData(testQueryKey)).toBe('optimistic-data')
    })
  })
})
