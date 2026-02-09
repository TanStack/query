import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  Injector,
  NgZone,
  input,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { sleep } from '@tanstack/query-test-utils'
import { firstValueFrom } from 'rxjs'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { QueryClient, injectMutation, provideTanStackQuery } from '..'
import { expectSignals, registerSignalInput } from './test-utils'

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

  test('should be in idle state initially', () => {
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

  test('should change state after invoking mutate', async () => {
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

  test('should return error when request fails', async () => {
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

  test('should return data when request succeeds', async () => {
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

  test('reactive options should update mutation', () => {
    const mutationCache = queryClient.getMutationCache()
    // Signal will be updated before the mutation is called
    // this test confirms that the mutation uses the updated value
    const mutationKey = signal(['1'])
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: mutationKey(),
        mutationFn: (params: string) => sleep(0).then(() => params),
      }))
    })

    mutationKey.set(['2'])

    mutation.mutate('xyz')

    const mutations = mutationCache.find({ mutationKey: ['2'] })

    expect(mutations?.options.mutationKey).toEqual(['2'])
  })

  test('should reset state after invoking mutation.reset', async () => {
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

    test('should call onMutate when passed as an option', async () => {
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

    test('should call onError when passed as an option', async () => {
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

    test('should call onSuccess when passed as an option', async () => {
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

    test('should call onSettled when passed as an option', async () => {
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

    test('should call onError when passed as an argument of mutate function', async () => {
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

    test('should call onSuccess when passed as an argument of mutate function', async () => {
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

    test('should call onSettled when passed as an argument of mutate function', async () => {
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

    test('should fire both onSettled functions', async () => {
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

  test('should support required signal inputs', async () => {
    const mutationCache = queryClient.getMutationCache()

    @Component({
      selector: 'app-fake',
      template: `
        <button (click)="mutate()"></button>
        <span>{{ mutation.data() }}</span>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
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

    registerSignalInput(FakeComponent, 'name')

    @Component({
      template: `<app-fake [name]="name()" />`,
      imports: [FakeComponent],
    })
    class HostComponent {
      protected readonly name = signal('value')
    }

    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    const hostButton = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement
    hostButton.click()

    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    const span = fixture.nativeElement.querySelector('span') as HTMLSpanElement
    expect(span.textContent).toEqual('value')
    const mutation = mutationCache.find({
      mutationKey: ['fake', 'value'],
    })
    expect(mutation).toBeDefined()
    expect(mutation!.options.mutationKey).toStrictEqual(['fake', 'value'])
  })

  test('should update options on required signal input change', async () => {
    const mutationCache = queryClient.getMutationCache()

    @Component({
      selector: 'app-fake',
      template: `
        <button (click)="mutate()"></button>
        <span>{{ mutation.data() }}</span>
      `,
      changeDetection: ChangeDetectionStrategy.OnPush,
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

    registerSignalInput(FakeComponent, 'name')

    @Component({
      template: `<app-fake [name]="name()" />`,
      imports: [FakeComponent],
    })
    class HostComponent {
      protected readonly name = signal('value')

      updateName(value: string): void {
        this.name.set(value)
      }
    }

    const fixture = TestBed.createComponent(HostComponent)
    fixture.detectChanges()

    let button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement
    button.click()
    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    let span = fixture.nativeElement.querySelector('span') as HTMLSpanElement
    expect(span.textContent).toEqual('value')

    fixture.componentInstance.updateName('updatedValue')
    fixture.detectChanges()

    button = fixture.nativeElement.querySelector('button') as HTMLButtonElement
    button.click()
    await vi.advanceTimersByTimeAsync(11)
    fixture.detectChanges()

    span = fixture.nativeElement.querySelector('span') as HTMLSpanElement
    expect(span.textContent).toEqual('updatedValue')

    const mutations = mutationCache.findAll()
    expect(mutations.length).toBe(2)
    const [mutation1, mutation2] = mutations
    expect(mutation1!.options.mutationKey).toEqual(['fake', 'value'])
    expect(mutation2!.options.mutationKey).toEqual(['fake', 'updatedValue'])
  })

  describe('throwOnError', () => {
    test('should evaluate throwOnError when mutation is expected to throw', async () => {
      const err = new Error('Expected mock error. All is well!')
      const boundaryFn = vi.fn()
      const { mutate } = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: ['fake'],
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

    test('should emit zone error when throwOnError is true and mutate is used', async () => {
      const err = new Error('Expected mock error. All is well!')
      const zone = TestBed.inject(NgZone)
      const zoneErrorEmitSpy = vi.spyOn(zone.onError, 'emit')
      const runSpy = vi.spyOn(zone, 'run').mockImplementation((callback: any) => {
        try {
          return callback()
        } catch {
          return undefined
        }
      })

      const { mutate } = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['fake'],
          mutationFn: () => {
            return sleep(0).then(() => Promise.reject(err))
          },
          throwOnError: true,
        })),
      )

      mutate()

      await vi.runAllTimersAsync()

      expect(zoneErrorEmitSpy).toHaveBeenCalledWith(err)
      expect(runSpy).toHaveBeenCalled()
    })
  })

  test('should throw when throwOnError is true', async () => {
    const err = new Error('Expected mock error. All is well!')
    const { mutateAsync } = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: ['fake'],
        mutationFn: () => {
          return Promise.reject(err)
        },
        throwOnError: true,
      }))
    })

    await expect(() => mutateAsync()).rejects.toThrowError(err)
  })

  test('should throw when throwOnError function returns true', async () => {
    const err = new Error('Expected mock error. All is well!')
    const { mutateAsync } = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: ['fake'],
        mutationFn: () => {
          return Promise.reject(err)
        },
        throwOnError: () => true,
      }))
    })

    await expect(() => mutateAsync()).rejects.toThrowError(err)
  })

  describe('injection context', () => {
    test('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectMutation(() => ({
          mutationKey: ['injectionContextError'],
          mutationFn: () => Promise.resolve(),
        }))
      }).toThrowError(/NG0203(.*?)injectMutation/)
    })

    test('can be used outside injection context when passing an injector', () => {
      expect(() => {
        injectMutation(
          () => ({
            mutationKey: ['injectionContextError'],
            mutationFn: () => Promise.resolve(),
          }),
          {
            injector: TestBed.inject(Injector),
          },
        )
      }).not.toThrow()
    })

    test('should complete mutation before whenStable() resolves', async () => {
      const app = TestBed.inject(ApplicationRef)
      let mutationStarted = false
      let mutationCompleted = false

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['pendingTasksTest'],
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

    test('should handle synchronous mutation with retry', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

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

    test('should handle multiple synchronous mutations on same key', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      let callCount = 0

      const mutation1 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['sync-mutation-key'],
          mutationFn: async (data: string) => {
            callCount++
            return `mutation1: ${data}`
          },
        })),
      )

      const mutation2 = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['sync-mutation-key'],
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

    test('should handle synchronous mutation with optimistic updates', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const testQueryKey = ['sync-optimistic']
      let onMutateCalled = false
      let onSuccessCalled = false

      // Set initial data
      queryClient.setQueryData(testQueryKey, 'initial')

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            await sleep(50)
            return `final: ${data}`
          },
          onMutate: async (variables) => {
            onMutateCalled = true
            queryClient.setQueryData(testQueryKey, `optimistic: ${variables}`)
          },
          onSuccess: (data) => {
            onSuccessCalled = true
            queryClient.setQueryData(testQueryKey, data)
          },
        })),
      )

      // Run effects
      TestBed.tick()

      // Start mutation
      expect(queryClient.getQueryData(testQueryKey)).toBe('initial')
      mutation.mutate('test')

      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()

      // Check for optimistic update in the same macro task
      expect(onMutateCalled).toBe(true)
      expect(queryClient.getQueryData(testQueryKey)).toBe('optimistic: test')

      // Check stability before the mutation completes, waiting for the next macro task
      await vi.advanceTimersByTimeAsync(0)
      expect(mutation.isPending()).toBe(true)
      expect(await firstValueFrom(app.isStable)).toBe(false)

      // Wait for the mutation to complete
      const stablePromise = app.whenStable()
      await vi.advanceTimersByTimeAsync(60)
      await stablePromise

      expect(onSuccessCalled).toBe(true)
      expect(mutation.isSuccess()).toBe(true)
      expect(mutation.data()).toBe('final: test')
      expect(queryClient.getQueryData(testQueryKey)).toBe('final: test')
    })

    test('should handle synchronous mutation cancellation', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideTanStackQuery(queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['cancel-sync'],
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
