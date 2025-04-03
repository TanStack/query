import {
  Component,
  Injector,
  input,
  provideExperimentalZonelessChangeDetection,
  signal,
} from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { describe, expect, vi } from 'vitest'
import { By } from '@angular/platform-browser'
import { QueryClient, injectMutation, provideTanStackQuery } from '..'
import {
  errorMutator,
  expectSignals,
  setFixtureSignalInputs,
  successMutator,
} from './test-utils'

const MUTATION_DURATION = 1000

const resolveMutations = () => vi.advanceTimersByTimeAsync(MUTATION_DURATION)

describe('injectMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
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

  test('should be in idle state initially', () => {
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: (params) => successMutator(params),
      }))
    })

    expectSignals(mutation, {
      isIdle: true,
      isPending: false,
      isError: false,
      isSuccess: false,
    })
  })

  test('should change state after invoking mutate', () => {
    const result = 'Mock data'

    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationFn: (params: string) => successMutator(params),
      }))
    })

    TestBed.flushEffects()

    mutation.mutate(result)
    vi.advanceTimersByTime(1)

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
        mutationFn: errorMutator,
      }))
    })

    mutation.mutate({})

    await resolveMutations()

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
        mutationFn: (params: string) => successMutator(params),
      }))
    })

    mutation.mutate(result)

    await resolveMutations()

    expectSignals(mutation, {
      isIdle: false,
      isPending: false,
      isError: false,
      isSuccess: true,
      data: result,
      error: null,
    })
  })

  test('reactive options should update mutation', async () => {
    const mutationCache = queryClient.getMutationCache()
    // Signal will be updated before the mutation is called
    // this test confirms that the mutation uses the updated value
    const mutationKey = signal(['1'])
    const mutation = TestBed.runInInjectionContext(() => {
      return injectMutation(() => ({
        mutationKey: mutationKey(),
        mutationFn: (params: string) => successMutator(params),
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
        mutationFn: (params: string) => errorMutator(params),
      }))
    })

    mutation.mutate('')

    await resolveMutations()

    expect(mutation.isError()).toBe(true)

    mutation.reset()

    await resolveMutations()

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
          mutationFn: (params: string) => successMutator(params),
          onMutate,
        }))
      })

      mutation.mutate('')

      await resolveMutations()

      expect(onMutate).toHaveBeenCalledTimes(1)
    })

    test('should call onError when passed as an option', async () => {
      const onError = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => errorMutator(params),
          onError,
        }))
      })

      mutation.mutate('')

      await resolveMutations()

      expect(onError).toHaveBeenCalledTimes(1)
    })

    test('should call onSuccess when passed as an option', async () => {
      const onSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => successMutator(params),
          onSuccess,
        }))
      })

      mutation.mutate('')

      await resolveMutations()

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call onSettled when passed as an option', async () => {
      const onSettled = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => successMutator(params),
          onSettled,
        }))
      })

      mutation.mutate('')

      await resolveMutations()

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    test('should call onError when passed as an argument of mutate function', async () => {
      const onError = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => errorMutator(params),
        }))
      })

      mutation.mutate('', { onError })

      await resolveMutations()

      expect(onError).toHaveBeenCalledTimes(1)
    })

    test('should call onSuccess when passed as an argument of mutate function', async () => {
      const onSuccess = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => successMutator(params),
        }))
      })

      mutation.mutate('', { onSuccess })

      await resolveMutations()

      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call onSettled when passed as an argument of mutate function', async () => {
      const onSettled = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => successMutator(params),
        }))
      })

      mutation.mutate('', { onSettled })

      await resolveMutations()

      expect(onSettled).toHaveBeenCalledTimes(1)
    })

    test('should fire both onSettled functions', async () => {
      const onSettled = vi.fn()
      const onSettledOnFunction = vi.fn()
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation(() => ({
          mutationFn: (params: string) => successMutator(params),
          onSettled,
        }))
      })

      mutation.mutate('', { onSettled: onSettledOnFunction })

      await resolveMutations()

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
      standalone: true,
    })
    class FakeComponent {
      name = input.required<string>()

      mutation = injectMutation(() => ({
        mutationKey: ['fake', this.name()],
        mutationFn: () => successMutator(this.name()),
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

    await resolveMutations()
    fixture.detectChanges()

    const text = debugElement.query(By.css('span')).nativeElement.textContent
    expect(text).toEqual('value')
    const mutation = mutationCache.find({ mutationKey: ['fake', 'value'] })
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
      standalone: true,
    })
    class FakeComponent {
      name = input.required<string>()

      mutation = injectMutation(() => ({
        mutationKey: ['fake', this.name()],
        mutationFn: () => successMutator(this.name()),
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
    await resolveMutations()
    fixture.detectChanges()

    expect(span.nativeElement.textContent).toEqual('value')

    setFixtureSignalInputs(fixture, { name: 'updatedValue' })

    button.triggerEventHandler('click')
    await resolveMutations()
    fixture.detectChanges()

    expect(span.nativeElement.textContent).toEqual('updatedValue')

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

      TestBed.flushEffects()

      mutate()

      await resolveMutations()

      expect(boundaryFn).toHaveBeenCalledTimes(1)
      expect(boundaryFn).toHaveBeenCalledWith(err)
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
          TestBed.inject(Injector),
        )
      }).not.toThrow()
    })
  })
})
