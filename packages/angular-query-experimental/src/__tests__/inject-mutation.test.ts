import {
  ApplicationRef,
  Component,
  Injector,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { By } from '@angular/platform-browser'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { QueryClient, injectMutation, provideTanStackQuery } from '..'
import { expectSignals, setFixtureSignalInputs } from './test-utils'

describe('injectMutation', () => {
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

  it('should be in idle state initially', () => {
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: (params) => sleep(0).then(() => params),
      }))
    })

    expectSignals(mutation, {
      isIdle: true,
      isPending: false,
      isError: false,
      isSuccess: false,
    })
  })

  it('should change state after invoking mutate', async () => {
    const result = 'Mock data'

    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: (params: string) => sleep(10).then(() => params),
      }))
    })

    TestBed.tick()

    mutation.mutate(result)
    await vi.advanceTimersByTimeAsync(0)

    expectSignals(mutation, {
      isIdle: false,
      isPending: true,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
    })
  })

  it('should return error when request fails', async () => {
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    })

    mutation.mutate()

    await vi.advanceTimersByTimeAsync(11)

    expectSignals(mutation, {
      isIdle: false,
      isPending: false,
      isError: true,
      isSuccess: false,
      data: undefined,
      error: Error('Some error'),
    })
  })

  it('should return data when request succeeds', async () => {
    const result = 'Mock data'
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: (params: string) => sleep(10).then(() => params),
      }))
    })

    mutation.mutate(result)

    await vi.advanceTimersByTimeAsync(11)

    expectSignals(mutation, {
      isIdle: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      data: result,
      error: null,
    })
  })

  it('reactive options should update mutation', () => {
    const mutationCache = queryClient.getMutationCache()
    // Signal will be updated before the mutation is called
    // this test confirms that the mutation uses the updated value
    const key1 = queryKey()
    const key2 = queryKey()
    const mutationKey = signal(key1)
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: mutationKey(),
        mutationFn: (params: string) => sleep(0).then(() => params),
      }))
    })

    mutationKey.set(key2)

    mutation.mutate('xyz')

    const mutations = mutationCache.find({ mutationKey: key2 })

    expect(mutations?.options.mutationKey).toEqual(key2)
  })

  it('should reset state after invoking mutation.reset', async () => {
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: () =>
          sleep(10).then(() => Promise.reject(new Error('Some error'))),
      }))
    })

    mutation.mutate()

    await vi.advanceTimersByTimeAsync(11)

    expect(mutation.isError()).toBe(true)

    mutation.reset()

    await vi.advanceTimersByTimeAsync(0)

    expectSignals(mutation, {
      isIdle: true,
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
    })
  })

  describe('side effects', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should call onMutate when passed as an option', async () => {
      const onMutate = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
          onMutate,
        }))
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(0)

      expect(onMutate).toHaveBeenCalledTimes(1)
    })

    it('should call onError when passed as an option', async () => {
      const onError = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (_params: string) =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          onError,
        }))
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(11)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should call onSuccess when passed as an option', async () => {
      const onSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
          onSuccess,
        }))
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(11)

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should call onSettled when passed as an option', async () => {
      const onSettled = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
          onSettled,
        }))
      })

      mutation.mutate('')

      await vi.advanceTimersByTimeAsync(11)

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    it('should call onError when passed as an argument of mutate function', async () => {
      const onError = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (_params: string) =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
        }))
      })

      mutation.mutate('', { onError })

      await vi.advanceTimersByTimeAsync(11)

      expect(onError).toHaveBeenCalledTimes(1)
    })

    it('should call onSuccess when passed as an argument of mutate function', async () => {
      const onSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
        }))
      })

      mutation.mutate('', { onSuccess })

      await vi.advanceTimersByTimeAsync(11)

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    it('should call onSettled when passed as an argument of mutate function', async () => {
      const onSettled = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
        }))
      })

      mutation.mutate('', { onSettled })

      await vi.advanceTimersByTimeAsync(11)

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    it('should fire both onSettled functions', async () => {
      const onSettled = vi.fn()
      const onSettledOnFunction = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => sleep(10).then(() => params),
          onSettled,
        }))
      })

      mutation.mutate('', { onSettled: onSettledOnFunction })

      await vi.advanceTimersByTimeAsync(11)

      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettledOnFunction).toHaveBeenCalledTimes(1)
    })
  })

  it('should support required signal inputs', async () => {
    const mutationCache = queryClient.getMutationCache()

    @Component({
      selector: 'app-fake',
      template: `
        <button (click)="mutate()"></button>
        <span>{{ mutation.data() }}</span>
      `,
    })
    class FakeComponent {
      name = input.required<string>()

      mutation = injectMutation(() => ({
        mutationKey: ['fake', this.name()],
        mutationFn: () => sleep(10).then(() => this.name()),
      }))

      mutate(): void {
        this.mutation.mutate()
      }
    }

    const fixture = TestBed.createComponent(FakeComponent)
    const { debugElement } = fixture
    setFixtureSignalInputs(fixture, { name: 'value' })

    const button = debugElement.query(By.css('button'))
    button.triggerEventHandler('click')

    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    const text = debugElement.query(By.css('span')).nativeElement.textContent
    expect(text).toEqual('value')
    const mutation = mutationCache.find({ mutationKey: ['fake', 'value'] })
    expect(mutation).toBeDefined()
    expect(mutation!.options.mutationKey).toStrictEqual(['fake', 'value'])
  })

  it('should update options on required signal input change', async () => {
    const mutationCache = queryClient.getMutationCache()

    @Component({
      selector: 'app-fake',
      template: `
        <button (click)="mutate()"></button>
        <span>{{ mutation.data() }}</span>
      `,
    })
    class FakeComponent {
      name = input.required<string>()

      mutation = injectMutation(() => ({
        mutationKey: ['fake', this.name()],
        mutationFn: () => sleep(10).then(() => this.name()),
      }))

      mutate(): void {
        this.mutation.mutate()
      }
    }

    const fixture = TestBed.createComponent(FakeComponent)
    const { debugElement } = fixture
    setFixtureSignalInputs(fixture, { name: 'value' })

    const button = debugElement.query(By.css('button'))
    const span = debugElement.query(By.css('span'))

    button.triggerEventHandler('click')
    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    expect(span.nativeElement.textContent).toEqual('value')

    setFixtureSignalInputs(fixture, { name: 'updatedValue' })

    button.triggerEventHandler('click')
    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    expect(span.nativeElement.textContent).toEqual('updatedValue')

    const mutations = mutationCache.findAll()
    expect(mutations.length).toBe(2)
    const [mutation1, mutation2] = mutations
    expect(mutation1!.options.mutationKey).toEqual(['fake', 'value'])
    expect(mutation2!.options.mutationKey).toEqual(['fake', 'updatedValue'])
  })

  describe('throwOnError', () => {
    it('should evaluate throwOnError when mutation is expected to throw', async () => {
      const key = queryKey()
      const err = new Error('Expected mock error. All is well!')
      const boundaryFn = vi.fn()
      const { mutate } = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: key,
          mutationFn: () => {
            return Promise.reject(err)
          },
          throwOnError: boundaryFn,
        }))
      })

      TestBed.tick()

      mutate()

      await vi.advanceTimersByTimeAsync(0)

      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(err)
    })

    it('should throw when throwOnError is true and mutate is used', async () => {
      const key = queryKey()
      const { mutate } = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: key,
          mutationFn: () => {
            return Promise.reject(
              new Error('Expected mock error. All is well!'),
            )
          },
          throwOnError: true,
        }))
      })

      TestBed.tick()

      mutate()

      await expect(vi.advanceTimersByTimeAsync(0)).rejects.toThrow(
        'Expected mock error. All is well!',
      )
    })
  })

  it('should throw when throwOnError is true', async () => {
    const key = queryKey()
    const err = new Error('Expected mock error. All is well!')
    const { mutateAsync } = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: key,
        mutationFn: () => {
          return Promise.reject(err)
        },
        throwOnError: true,
      }))
    })

    await expect(() => mutateAsync()).rejects.toThrow(err)
  })

  it('should throw when throwOnError function returns true', async () => {
    const key = queryKey()
    const err = new Error('Expected mock error. All is well!')
    const { mutateAsync } = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: key,
        mutationFn: () => {
          return Promise.reject(err)
        },
        throwOnError: () => true,
      }))
    })

    await expect(() => mutateAsync()).rejects.toThrow(err)
  })

  describe('injection context', () => {
    it('throws NG0203 with descriptive error outside injection context', () => {
      const key = queryKey()
      expect(() => {
        injectMutation(() => ({
          mutationKey: key,
          mutationFn: () => Promise.resolve(),
        }))
      }).toThrow(/NG0203(.*?)injectMutation/)
    })

    it('can be used outside injection context when passing an injector', () => {
      const key = queryKey()
      expect(() => {
        injectMutation(
          () => ({
            mutationKey: key,
            mutationFn: () => Promise.resolve(),
          }),
          {
            injector: TestBed.inject(Injector),
          },
        )
      }).not.toThrow()
    })

    it('should complete mutation before whenStable() resolves', async () => {
      const app = TestBed.inject(ApplicationRef)
      let mutationStarted = false
      let mutationCompleted = false

      const key = queryKey()
      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: key,
          mutationFn: async (data: string) => {
            mutationStarted = true
            await sleep(50)
            mutationCompleted = true
            return `processed: ${data}`
          },
        })),
      )

      // Initial state
      expect(mutation.data()).toBeUndefined()
      expect(mutationStarted).toBe(false)

      // Start mutation
      mutation.mutate('test')

      // Wait for mutation to start and Angular to be "stable"
      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      // After whenStable(), mutation should be complete
      expect(mutationStarted).toBe(true)
      expect(mutationCompleted).toBe(true)
      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('processed: test')
    })

    it('should handle synchronous mutation with retry', async () => {
      const app = TestBed.inject(ApplicationRef)
      let attemptCount = 0

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          retry: 2,
          retryDelay: 0, // No delay for synchronous retry
          mutationFn: async (data: string) => {
            attemptCount++
            if (attemptCount <= 2) {
              throw new Error(`Sync attempt ${attemptCount} failed`)
            }
            return `processed: ${data}`
          },
        })),
      )

      // Start mutation
      mutation.mutate('retry-test')

      // Synchronize pending effects for each retry attempt
      TestBed.tick()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)

      TestBed.tick()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)

      TestBed.tick()

      const stablePromise = app.whenStable()
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(10)
      await stablePromise

      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('processed: retry-test')
      expect(attemptCount).toBe(3) // Initial + 2 retries
    })

    it('should handle multiple synchronous mutations on same key', async () => {
      const app = TestBed.inject(ApplicationRef)
      let callCount = 0

      const key = queryKey()

      const mutation1 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: key,
          mutationFn: async (data: string) => {
            callCount++
            return `mutation1: ${data}`
          },
        })),
      )

      const mutation2 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: key,
          mutationFn: async (data: string) => {
            callCount++
            return `mutation2: ${data}`
          },
        })),
      )

      // Start both mutations
      mutation1.mutate('test1')
      mutation2.mutate('test2')

      // Synchronize pending effects
      TestBed.tick()

      const stablePromise = app.whenStable()
      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(1)
      await stablePromise

      expect(mutation1.isSuccess()).toBe(true)
      expect(mutation1.data()).toBe('mutation1: test1')
      expect(mutation2.isSuccess()).toBe(true)
      expect(mutation2.data()).toBe('mutation2: test2')
      expect(callCount).toBe(2)
    })

    it('should handle synchronous mutation with optimistic updates', async () => {
      const app = TestBed.inject(ApplicationRef)
      const testQueryKey = queryKey()
      let onMutateCalled = false
      let onSuccessCalled = false

      // Set initial data
      queryClient.setQueryData(testQueryKey, 'initial')

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => `final: ${data}`, // Synchronous resolution
          onMutate: async (variables) => {
            onMutateCalled = true
            const previousData = queryClient.getQueryData(testQueryKey)
            queryClient.setQueryData(testQueryKey, `optimistic: ${variables}`)
            return { previousData }
          },
          onSuccess: (data) => {
            onSuccessCalled = true
            queryClient.setQueryData(testQueryKey, data)
          },
        })),
      )

      // Start mutation
      mutation.mutate('test')

      // Synchronize pending effects
      TestBed.tick()

      const stablePromise = app.whenStable()
      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(1)
      await stablePromise

      expect(onMutateCalled).toBe(true)
      expect(onSuccessCalled).toBe(true)
      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('final: test')
      expect(queryClient.getQueryData(testQueryKey)).toBe('final: test')
    })

    it('should handle synchronous mutation cancellation', async () => {
      const app = TestBed.inject(ApplicationRef)

      const key = queryKey()
      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: key,
          mutationFn: async (data: string) => `processed: ${data}`, // Synchronous resolution
        })),
      )

      // Start mutation
      mutation.mutate('test')

      // Synchronize pending effects
      TestBed.tick()

      const stablePromise = app.whenStable()
      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()
      await vi.advanceTimersByTimeAsync(1)
      await stablePromise

      // Synchronous mutations complete immediately
      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('processed: test')
    })
  })
})
