import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { queryKey, sleep } from '@tanstack/query-test-utils'
import { MutationCache, MutationObserver, QueryClient } from '..'
import { executeMutation } from './utils'

describe('mutationCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('MutationCacheConfig error callbacks', () => {
    test('should call onError and onSettled when a mutation errors', async () => {
      const key = queryKey()
      const onError = vi.fn()
      const onSuccess = vi.fn()
      const onSettled = vi.fn()
      const testCache = new MutationCache({ onError, onSuccess, onSettled })
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () =>
            sleep(10).then(() => Promise.reject(new Error('error'))),
          onMutate: () => 'result',
        },
        'vars',
      ).catch(() => undefined)
      await vi.advanceTimersByTimeAsync(10)

      const mutation = testCache.getAll()[0]

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        new Error('error'),
        'vars',
        'result',
        mutation,
        {
          client: testClient,
          meta: undefined,
          mutationKey: key,
        },
      )
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith(
        undefined,
        new Error('error'),
        'vars',
        'result',
        mutation,
        {
          client: testClient,
          meta: undefined,
          mutationKey: key,
        },
      )
    })

    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onError = () =>
        sleep(10).then(() => {
          states.push(1)
          states.push(2)
        })
      const onSettled = () =>
        sleep(10).then(() => {
          states.push(5)
          states.push(6)
        })

      const testCache = new MutationCache({ onError, onSettled })
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () =>
            sleep(10).then(() => Promise.reject(new Error('error'))),
          onError: () =>
            sleep(10).then(() => {
              states.push(3)
              states.push(4)
            }),
          onSettled: () =>
            sleep(10).then(() => {
              states.push(7)
              states.push(8)
            }),
        },
        'vars',
      ).catch(() => undefined)
      await vi.advanceTimersByTimeAsync(50)

      expect(states).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })
  })

  describe('MutationCacheConfig success callbacks', () => {
    test('should call onSuccess and onSettled when a mutation is successful', async () => {
      const key = queryKey()
      const onError = vi.fn()
      const onSuccess = vi.fn()
      const onSettled = vi.fn()
      const testCache = new MutationCache({ onError, onSuccess, onSettled })
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => sleep(10).then(() => ({ data: 5 })),
          onMutate: () => 'result',
        },
        'vars',
      )
      await vi.advanceTimersByTimeAsync(10)

      const mutation = testCache.getAll()[0]

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledWith(
        { data: 5 },
        'vars',
        'result',
        mutation,
        {
          client: testClient,
          meta: undefined,
          mutationKey: key,
        },
      )
      expect(onError).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith(
        { data: 5 },
        null,
        'vars',
        'result',
        mutation,
        {
          client: testClient,
          meta: undefined,
          mutationKey: key,
        },
      )
    })

    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onSuccess = () =>
        sleep(10).then(() => {
          states.push(1)
          states.push(2)
        })
      const onSettled = () =>
        sleep(10).then(() => {
          states.push(5)
          states.push(6)
        })
      const testCache = new MutationCache({ onSuccess, onSettled })
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => sleep(10).then(() => ({ data: 5 })),
          onSuccess: () =>
            sleep(10).then(() => {
              states.push(3)
              states.push(4)
            }),
          onSettled: () =>
            sleep(10).then(() => {
              states.push(7)
              states.push(8)
            }),
        },
        'vars',
      )
      await vi.advanceTimersByTimeAsync(50)

      expect(states).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })
  })

  describe('MutationCacheConfig.onMutate', () => {
    test('should be called before a mutation executes', () => {
      const key = queryKey()
      const onMutate = vi.fn()
      const testCache = new MutationCache({ onMutate })
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => sleep(10).then(() => ({ data: 5 })),
          onMutate: () => 'result',
        },
        'vars',
      )

      const mutation = testCache.getAll()[0]

      expect(onMutate).toHaveBeenCalledWith('vars', mutation, {
        client: testClient,
        meta: undefined,
        mutationKey: key,
      })
    })

    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onMutate = () =>
        sleep(10).then(() => {
          states.push(1)
          states.push(2)
        })
      const testCache = new MutationCache({ onMutate })
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => sleep(10).then(() => ({ data: 5 })),
          onMutate: () =>
            sleep(10).then(() => {
              states.push(3)
              states.push(4)
            }),
        },
        'vars',
      )
      await vi.advanceTimersByTimeAsync(20)

      expect(states).toEqual([1, 2, 3, 4])
    })
  })

  describe('find', () => {
    test('should filter correctly', () => {
      const testCache = new MutationCache()
      const testClient = new QueryClient({ mutationCache: testCache })
      const key = ['mutation', 'vars']

      executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => sleep(10).then(() => undefined),
        },
        'vars',
      )

      const [mutation] = testCache.getAll()

      expect(testCache.find({ mutationKey: key })).toEqual(mutation)
      expect(
        testCache.find({ mutationKey: ['mutation'], exact: false }),
      ).toEqual(mutation)
      expect(testCache.find({ mutationKey: ['unknown'] })).toEqual(undefined)
      expect(
        testCache.find({
          predicate: (m) => m.options.mutationKey?.[0] === key[0],
        }),
      ).toEqual(mutation)
    })
  })

  describe('findAll', () => {
    test('should filter correctly', () => {
      const testCache = new MutationCache()
      const testClient = new QueryClient({ mutationCache: testCache })

      executeMutation(
        testClient,
        {
          mutationKey: ['a', 1],
          mutationFn: () => sleep(10).then(() => undefined),
        },
        1,
      )
      executeMutation(
        testClient,
        {
          mutationKey: ['a', 2],
          mutationFn: () => sleep(10).then(() => undefined),
        },
        2,
      )
      executeMutation(
        testClient,
        {
          mutationKey: ['b'],
          mutationFn: () => sleep(10).then(() => undefined),
        },
        3,
      )

      const [mutation1, mutation2] = testCache.getAll()

      expect(
        testCache.findAll({ mutationKey: ['a'], exact: false }),
      ).toHaveLength(2)
      expect(testCache.find({ mutationKey: ['a', 1] })).toEqual(mutation1)
      expect(
        testCache.findAll({
          predicate: (m) => m.options.mutationKey?.[1] === 2,
        }),
      ).toEqual([mutation2])
      expect(testCache.findAll({ mutationKey: ['unknown'] })).toEqual([])
    })
  })

  describe('garbage collection', () => {
    test('should remove unused mutations after gcTime has elapsed', async () => {
      const testCache = new MutationCache()
      const testClient = new QueryClient({ mutationCache: testCache })
      const onSuccess = vi.fn()

      executeMutation(
        testClient,
        {
          mutationKey: ['a', 1],
          gcTime: 10,
          mutationFn: () => sleep(10).then(() => undefined),
          onSuccess,
        },
        1,
      )
      await vi.advanceTimersByTimeAsync(10)

      expect(testCache.getAll()).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(10)
      expect(testCache.getAll()).toHaveLength(0)
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should not remove mutations if there are active observers', async () => {
      const queryClient = new QueryClient()
      const observer = new MutationObserver(queryClient, {
        gcTime: 10,
        mutationFn: (input: number) => sleep(10).then(() => input),
      })
      const unsubscribe = observer.subscribe(() => undefined)

      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)

      observer.mutate(1)

      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(10)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)

      unsubscribe()

      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(10)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
    })

    test('should be garbage collected later when unsubscribed and mutation is pending', async () => {
      const queryClient = new QueryClient()
      const onSuccess = vi.fn()
      const observer = new MutationObserver(queryClient, {
        gcTime: 10,
        mutationFn: () => sleep(10).then(() => 'data'),
        onSuccess,
      })
      const unsubscribe = observer.subscribe(() => undefined)

      observer.mutate(1)

      unsubscribe()

      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(10)
      // unsubscribe should not remove even though gcTime has elapsed b/c mutation is still pending
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)

      await vi.advanceTimersByTimeAsync(10)
      // should be removed after an additional gcTime wait
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call callbacks even with gcTime 0 and mutation still pending', async () => {
      const queryClient = new QueryClient()
      const onSuccess = vi.fn()
      const observer = new MutationObserver(queryClient, {
        gcTime: 0,
        mutationFn: () => sleep(10).then(() => 'data'),
        onSuccess,
      })
      const unsubscribe = observer.subscribe(() => undefined)

      observer.mutate(1)

      unsubscribe()

      await vi.advanceTimersByTimeAsync(11)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })
})
