import {
  ApplicationRef,
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  effect,
  input,
  inputBinding,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { render } from '@testing-library/angular'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { firstValueFrom } from 'rxjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  QueryClient,
  injectIsMutating,
  injectMutation,
  injectMutationState,
  injectQuery,
  provideTanStackQuery,
} from '..'
import { expectSignals, provideAngularQueryChangeDetection } from './test-utils'

describe('injectMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [
        provideAngularQueryChangeDetection(),
        provideTanStackQuery(() => queryClient),
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('publishes mutation failures to observers and cache signals without global reporting', async () => {
    vi.useRealTimers()
    queryClient.setDefaultOptions({ mutations: { throwOnError: true } })
    const cacheReport = vi.fn()
    queryClient.getMutationCache().config.onError = cacheReport
    const report = vi.spyOn(TestBed.inject(ErrorHandler), 'handleError')
    const error = new Error('mutation failed')
    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => ({
        mutationFn: async () => {
          throw error
        },
      })),
    )
    const count = TestBed.runInInjectionContext(() => injectIsMutating())
    const states = TestBed.runInInjectionContext(() => injectMutationState())
    await TestBed.inject(ApplicationRef).whenStable()
    const promise = mutation.mutateAsync()
    expect(mutation.status()).toBe('pending')
    expect(count()).toBe(1)
    expect(states()[0]?.status).toBe('pending')
    await expect(promise).rejects.toBe(error)
    expect(mutation.error()).toBe(error)
    expect(mutation.status()).toBe('error')
    expect(count()).toBe(0)
    expect(states()[0]?.status).toBe('error')
    expect(cacheReport).toHaveBeenCalledTimes(1)
    expect(report).not.toHaveBeenCalled()
    mutation.mutate()
    await TestBed.inject(ApplicationRef).whenStable()
    expect(mutation.error()).toBe(error)
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

  it('reflects a mutation started in ngOnInit', async () => {
    const statusesInsideOnMutate: Array<string> = []

    @Component({ template: '' })
    class TestComponent {
      readonly mutation = injectMutation(() => ({
        mutationFn: () => sleep(10).then(() => 'done'),
        onMutate: () => {
          statusesInsideOnMutate.push(this.mutation.status())
        },
      }))

      ngOnInit() {
        this.mutation.mutate()
      }
    }

    const fixture = TestBed.createComponent(TestComponent)
    fixture.detectChanges()

    expect(statusesInsideOnMutate).toEqual(['pending'])
    expect(fixture.componentInstance.mutation.status()).toBe('pending')

    await vi.advanceTimersByTimeAsync(11)
    TestBed.tick()
    expect(fixture.componentInstance.mutation.status()).toBe('success')
  })

  it('allows cache listeners to read the result while options update', () => {
    const mutationKey = signal('one')
    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => ({
        mutationKey: ['reentrant-options', mutationKey()],
        mutationFn: () => Promise.resolve(),
      })),
    )

    mutation.status()
    TestBed.tick()

    const readResult = vi.fn(() => mutation.status())
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      // setOptions emits synchronously; this read must not re-enter the signal
      // computation that caused the options update.
      if (event.type === 'observerOptionsUpdated') readResult()
    })

    mutationKey.set('two')

    expect(() => TestBed.tick()).not.toThrow()
    expect(readResult).toHaveBeenCalled()

    unsubscribe()
  })

  it('does not track mutation state when mutating from a reactive context', async () => {
    const trigger = signal(false)
    const runs = vi.fn()
    const mutation = TestBed.runInInjectionContext(() =>
      injectMutation(() => ({
        mutationFn: () => sleep(10),
      })),
    )

    TestBed.runInInjectionContext(() =>
      effect(() => {
        runs()
        if (trigger()) mutation.mutate()
      }),
    )
    TestBed.tick()
    expect(runs).toHaveBeenCalledOnce()

    trigger.set(true)
    TestBed.tick()
    expect(runs).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(11)
    TestBed.tick()
    expect(runs).toHaveBeenCalledTimes(2)
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

      await vi.advanceTimersByTimeAsync(10)

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

      await vi.advanceTimersByTimeAsync(10)

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

      await vi.advanceTimersByTimeAsync(10)

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

      await vi.advanceTimersByTimeAsync(10)

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

      await vi.advanceTimersByTimeAsync(10)

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

      await vi.advanceTimersByTimeAsync(10)

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

      await vi.advanceTimersByTimeAsync(10)

      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettledOnFunction).toHaveBeenCalledTimes(1)
    })

    it('should pass a non-undefined onMutateResult alongside context to onSuccess', async () => {
      const onSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (text: string) =>
            sleep(10).then(() => text.toUpperCase()),
          onMutate: (text: string) => ({ startedWith: text }),
          onSuccess,
        }))
      })

      mutation.mutate('todo')

      await vi.advanceTimersByTimeAsync(10)

      expect(onSuccess).toHaveBeenCalledTimes(1)
      const [data, variables, onMutateResult, context] =
        onSuccess.mock.calls[0]!
      expect(data).toBe('TODO')
      expect(variables).toBe('todo')
      expect(onMutateResult).toEqual({ startedWith: 'todo' })
      expect(context.client).toBe(queryClient)
      expect(context.meta).toBeUndefined()
      expect(context.mutationKey).toBeUndefined()
    })

    it('should give mutationFn the same QueryClient instance via context', async () => {
      const key = queryKey()
      queryClient.setQueryData(key, 'tag-from-this-client')

      @Component({
        template: `<div>data: {{ mutation.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly mutation = injectMutation(() => ({
          mutationFn: (_text: string, context) =>
            sleep(10).then(() => context.client.getQueryData(key)),
        }))
      }

      const rendered = await render(Page)

      rendered.fixture.componentInstance.mutation.mutate('todo')

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(
        rendered.getByText('data: tag-from-this-client'),
      ).toBeInTheDocument()
    })

    it('should include mutationKey in the context passed to hook-level callbacks', async () => {
      const onSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationKey: ['todos', 'add'],
          mutationFn: (text: string) => sleep(10).then(() => text),
          onSuccess,
        }))
      })

      mutation.mutate('todo')

      await vi.advanceTimersByTimeAsync(10)

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSuccess.mock.calls[0]?.[3].mutationKey).toEqual(['todos', 'add'])
    })

    it('should let onSuccess invalidate queries via context.client without an injected QueryClient', async () => {
      const key = queryKey()
      queryClient.setQueryData(key, 'data')

      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: () => sleep(10).then(() => 'mutated'),
          onSuccess: (_data, _variables, _onMutateResult, context) => {
            context.client.invalidateQueries({ queryKey: key })
          },
        }))
      })

      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(false)

      mutation.mutate()

      await vi.advanceTimersByTimeAsync(10)

      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true)
    })

    it('should give a per-call onSuccess the same QueryClient instance via context', async () => {
      const perCallOnSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (text: string) => sleep(10).then(() => text),
        }))
      })

      mutation.mutate('todo', { onSuccess: perCallOnSuccess })

      await vi.advanceTimersByTimeAsync(10)

      expect(perCallOnSuccess).toHaveBeenCalledTimes(1)
      expect(perCallOnSuccess.mock.calls[0]?.[3].client).toBe(queryClient)
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

    const name = signal('value')
    const rendered = await render(FakeComponent, {
      bindings: [inputBinding('name', name.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.detectChanges()

    rendered.getByRole('button').click()

    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('value')).toBeInTheDocument()
    const mutation = mutationCache.find({
      mutationKey: ['fake', 'value'],
    })
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

    const name = signal('value')
    const rendered = await render(FakeComponent, {
      bindings: [inputBinding('name', name.asReadonly())],
      detectChangesOnRender: false,
    })
    rendered.fixture.detectChanges()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('value')).toBeInTheDocument()

    name.set('updatedValue')
    rendered.fixture.detectChanges()

    rendered.getByRole('button').click()
    await vi.advanceTimersByTimeAsync(11)
    rendered.fixture.detectChanges()

    expect(rendered.getByText('updatedValue')).toBeInTheDocument()

    const mutations = mutationCache.findAll()
    expect(mutations.length).toBe(2)
    const [mutation1, mutation2] = mutations
    expect(mutation1!.options.mutationKey).toEqual(['fake', 'value'])
    expect(mutation2!.options.mutationKey).toEqual(['fake', 'updatedValue'])
  })

  describe('injection context', () => {
    it('throws NG0203 with descriptive error outside injection context', () => {
      expect(() => {
        injectMutation(() => ({
          mutationKey: ['injectionContextError'],
          mutationFn: () => Promise.resolve(),
        }))
      }).toThrowError(/NG0203(.*?)injectMutation/)
    })

    it('should complete mutation before whenStable() resolves', async () => {
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

      expect(mutation.data()).toBeUndefined()
      expect(mutationStarted).toBe(false)

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
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
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
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
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
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)
      const testQueryKey = ['sync-optimistic']
      let onMutateCalled = false
      let onSuccessCalled = false
      let queryDataInsideOnMutate: string | undefined

      queryClient.setQueryData(testQueryKey, 'initial')

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: testQueryKey,
          queryFn: () => Promise.resolve('initial'),
          staleTime: Infinity,
        })),
      )

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async (data: string) => {
            await sleep(50)
            return `final: ${data}`
          },
          onMutate: async (variables) => {
            onMutateCalled = true
            queryClient.setQueryData(testQueryKey, `optimistic: ${variables}`)
            queryDataInsideOnMutate = query.data()
          },
          onSuccess: (data) => {
            onSuccessCalled = true
            queryClient.setQueryData(testQueryKey, data)
          },
        })),
      )

      TestBed.tick()

      expect(queryClient.getQueryData(testQueryKey)).toBe('initial')
      mutation.mutate('test')

      // Flush microtasks to allow TanStack Query's scheduled notifications to process
      await Promise.resolve()

      // The observed query signal must be current inside the onMutate callback,
      // immediately after the optimistic cache write.
      expect(onMutateCalled).toBe(true)
      expect(queryClient.getQueryData(testQueryKey)).toBe('optimistic: test')
      expect(queryDataInsideOnMutate).toBe('optimistic: test')

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

    it('reads an optimistic update inside onMutate before the query signal or effects initialize', async () => {
      const testQueryKey = ['unread-sync-optimistic']
      const seenInsideOnMutate: Array<string | undefined> = []
      queryClient.setQueryData(testQueryKey, 'initial')

      const query = TestBed.runInInjectionContext(() =>
        injectQuery(() => ({
          queryKey: testQueryKey,
          queryFn: () => Promise.resolve('initial'),
          staleTime: Infinity,
        })),
      )
      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationFn: async () => 'server',
          onMutate: () => {
            queryClient.setQueryData(testQueryKey, 'optimistic')
            seenInsideOnMutate.push(query.data())
          },
        })),
      )

      // No signal read and no TestBed.tick() occurs before mutateAsync. The
      // first query read must still pull the optimistic cache value; its
      // observer subscription can be committed later.
      await mutation.mutateAsync()

      expect(seenInsideOnMutate).toEqual(['optimistic'])
    })

    it('should handle synchronous mutation cancellation', async () => {
      TestBed.resetTestingModule()
      TestBed.configureTestingModule({
        providers: [
          provideAngularQueryChangeDetection(),
          provideTanStackQuery(() => queryClient),
        ],
      })

      const app = TestBed.inject(ApplicationRef)

      const mutation = TestBed.runInInjectionContext(() =>
        injectMutation(() => ({
          mutationKey: ['cancel-sync'],
          mutationFn: async (data: string) => `processed: ${data}`, // Synchronous resolution
        })),
      )

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

  describe('optimistic updates', () => {
    it('should update the cache in onMutate and roll back via onMutateResult in onError', async () => {
      const key = queryKey()
      queryClient.setQueryData<Array<string>>(key, ['Todo 1'])

      @Component({
        template: `<div>isError: {{ mutation.isError() }}</div>`,
      })
      class Page {
        readonly mutation = injectMutation(() => ({
          mutationFn: () =>
            sleep(10).then(() => Promise.reject(new Error('Some error'))),
          onMutate: async (newTodo: string) => {
            await queryClient.cancelQueries({ queryKey: key })
            const previousTodos = queryClient.getQueryData<Array<string>>(key)

            queryClient.setQueryData<Array<string>>(key, (old) => [
              ...(old ?? []),
              newTodo,
            ])

            return { previousTodos }
          },
          onError: (_err, _newTodo, onMutateResult) => {
            queryClient.setQueryData(key, onMutateResult?.previousTodos)
          },
        }))
      }

      const rendered = await render(Page)

      rendered.fixture.componentInstance.mutation.mutate('Todo 2')
      // onMutate runs synchronously up to its first await, so the optimistic
      // value is visible immediately, before the mutationFn settles.
      await vi.advanceTimersByTimeAsync(0)

      expect(queryClient.getQueryData(key)).toEqual(['Todo 1', 'Todo 2'])

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('isError: true')).toBeInTheDocument()
      expect(queryClient.getQueryData(key)).toEqual(['Todo 1'])
    })

    it('should keep the optimistic update in place when the mutation succeeds', async () => {
      const key = queryKey()
      queryClient.setQueryData<Array<string>>(key, ['Todo 1'])

      @Component({
        template: `<div>isSuccess: {{ mutation.isSuccess() }}</div>`,
      })
      class Page {
        readonly mutation = injectMutation(() => ({
          mutationFn: (newTodo: string) => sleep(10).then(() => newTodo),
          onMutate: async (newTodo: string) => {
            await queryClient.cancelQueries({ queryKey: key })
            const previousTodos = queryClient.getQueryData<Array<string>>(key)

            queryClient.setQueryData<Array<string>>(key, (old) => [
              ...(old ?? []),
              newTodo,
            ])

            return { previousTodos }
          },
          onError: (_err, _newTodo, onMutateResult) => {
            queryClient.setQueryData(key, onMutateResult?.previousTodos)
          },
        }))
      }

      const rendered = await render(Page)

      rendered.fixture.componentInstance.mutation.mutate('Todo 2')
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('isSuccess: true')).toBeInTheDocument()
      expect(queryClient.getQueryData(key)).toEqual(['Todo 1', 'Todo 2'])
    })
  })

  describe('concurrent mutate calls', () => {
    it('should report each mutateAsync call result independently when some fail', async () => {
      @Component({
        template: `<div>isPending: {{ mutation.isPending() }}</div>`,
      })
      class Page {
        readonly mutation = injectMutation(() => ({
          mutationFn: (todo: string) =>
            todo === 'bad'
              ? sleep(10).then(() => Promise.reject(new Error('Some error')))
              : sleep(10).then(() => todo),
        }))
      }

      const rendered = await render(Page)
      const todos = ['Todo 1', 'bad', 'Todo 3']

      expect(rendered.getByText('isPending: false')).toBeInTheDocument()

      const settledPromise = Promise.allSettled(
        todos.map((todo) =>
          rendered.fixture.componentInstance.mutation.mutateAsync(todo),
        ),
      )
      await vi.advanceTimersByTimeAsync(0)
      rendered.fixture.detectChanges()

      expect(rendered.getByText('isPending: true')).toBeInTheDocument()

      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()
      const results = await settledPromise

      expect(results).toEqual([
        { status: 'fulfilled', value: 'Todo 1' },
        { status: 'rejected', reason: Error('Some error') },
        { status: 'fulfilled', value: 'Todo 3' },
      ])
      expect(rendered.getByText('isPending: false')).toBeInTheDocument()
    })

    it('should only fire the per-call onSuccess for the last mutate() call', async () => {
      const onSuccessPerCall = vi.fn()

      @Component({
        template: `<div>data: {{ mutation.data() ?? 'none' }}</div>`,
      })
      class Page {
        readonly mutation = injectMutation(() => ({
          mutationFn: (todo: string) => sleep(10).then(() => todo),
        }))
      }

      const rendered = await render(Page)

      rendered.fixture.componentInstance.mutation.mutate('Todo 1', {
        onSuccess: onSuccessPerCall,
      })
      rendered.fixture.componentInstance.mutation.mutate('Todo 2', {
        onSuccess: onSuccessPerCall,
      })
      await vi.advanceTimersByTimeAsync(11)
      rendered.fixture.detectChanges()

      expect(onSuccessPerCall).toHaveBeenCalledTimes(1)
      expect(onSuccessPerCall).toHaveBeenCalledWith(
        'Todo 2',
        'Todo 2',
        undefined,
        expect.anything(),
      )
      expect(rendered.getByText('data: Todo 2')).toBeInTheDocument()
    })
  })
})
