import { QueryClient } from '@tanstack/query-core'
import { TestBed } from '@angular/core/testing'
import { expect, test, vi } from 'vitest'
import { injectMutation } from '../inject-mutation'
import { provideAngularQuery } from '../providers'
import { errorMutator, expectSignals, successMutator } from './test-utils'

const MUTATION_DURATION = 1000

const resolveMutations = () => vi.advanceTimersByTimeAsync(MUTATION_DURATION)

describe('injectMutation', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    queryClient = new QueryClient()
    vi.useFakeTimers()
    TestBed.configureTestingModule({
      providers: [provideAngularQuery(queryClient)],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('callback helpers', () => {
    test('can access client from options callback', async () => {
      const mutation = TestBed.runInInjectionContext(() => {
        return injectMutation((client) => ({
          mutationFn: () => {
            expect(client).toBe(queryClient)
            return Promise.resolve()
          },
        }))
      })

      mutation.mutate()
      expect(mutation.status()).toBe('pending')
    })
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

    mutation.mutate(result)

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

    expect(mutation.isIdle()).toBe(false)
    expect(mutation.isPending()).toBe(false)
    expect(mutation.isError()).toBe(false)
    expect(mutation.isSuccess()).toBe(true)
    expect(mutation.data()).toBe(result)
    expect(mutation.error()).toBe(null)
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
})
