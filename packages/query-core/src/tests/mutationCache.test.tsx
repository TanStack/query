import { describe, expect, test, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { MutationCache, MutationObserver } from '..'
import { createQueryClient, executeMutation, queryKey, sleep } from './utils'

describe('mutationCache', () => {
  describe('MutationCacheConfig error callbacks', () => {
    test('should call onError and onSettled when a mutation errors', async () => {
      const key = queryKey()
      const onError = vi.fn()
      const onSuccess = vi.fn()
      const onSettled = vi.fn()
      const testCache = new MutationCache({ onError, onSuccess, onSettled })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(
          testClient,
          {
            mutationKey: key,
            mutationFn: () => Promise.reject(new Error('error')),
            onMutate: () => 'context',
          },
          'vars',
        )
      } catch {}

      const mutation = testCache.getAll()[0]
      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        new Error('error'),
        'vars',
        'context',
        mutation,
      )
      expect(onSuccess).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith(
        undefined,
        new Error('error'),
        'vars',
        'context',
        mutation,
      )
    })

    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onError = async () => {
        states.push(1)
        await sleep(1)
        states.push(2)
      }
      const onSettled = async () => {
        states.push(5)
        await sleep(1)
        states.push(6)
      }
      const testCache = new MutationCache({ onError, onSettled })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(
          testClient,
          {
            mutationKey: key,
            mutationFn: () => Promise.reject(new Error('error')),
            onError: async () => {
              states.push(3)
              await sleep(1)
              states.push(4)
            },
            onSettled: async () => {
              states.push(7)
              await sleep(1)
              states.push(8)
            },
          },
          'vars',
        )
      } catch {}

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
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(
          testClient,
          {
            mutationKey: key,
            mutationFn: () => Promise.resolve({ data: 5 }),
            onMutate: () => 'context',
          },
          'vars',
        )
      } catch {}

      const mutation = testCache.getAll()[0]
      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledWith(
        { data: 5 },
        'vars',
        'context',
        mutation,
      )
      expect(onError).not.toHaveBeenCalled()
      expect(onSettled).toHaveBeenCalledTimes(1)
      expect(onSettled).toHaveBeenCalledWith(
        { data: 5 },
        null,
        'vars',
        'context',
        mutation,
      )
    })
    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onSuccess = async () => {
        states.push(1)
        await sleep(1)
        states.push(2)
      }
      const onSettled = async () => {
        states.push(5)
        await sleep(1)
        states.push(6)
      }
      const testCache = new MutationCache({ onSuccess, onSettled })
      const testClient = createQueryClient({ mutationCache: testCache })

      await executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve({ data: 5 }),
          onSuccess: async () => {
            states.push(3)
            await sleep(1)
            states.push(4)
          },
          onSettled: async () => {
            states.push(7)
            await sleep(1)
            states.push(8)
          },
        },
        'vars',
      )

      expect(states).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    })
  })
  describe('MutationCacheConfig.onMutate', () => {
    test('should be called before a mutation executes', async () => {
      const key = queryKey()
      const onMutate = vi.fn()
      const testCache = new MutationCache({ onMutate })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(
          testClient,
          {
            mutationKey: key,
            mutationFn: () => Promise.resolve({ data: 5 }),
            onMutate: () => 'context',
          },
          'vars',
        )
      } catch {}

      const mutation = testCache.getAll()[0]
      expect(onMutate).toHaveBeenCalledWith('vars', mutation)
    })

    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onMutate = async () => {
        states.push(1)
        await sleep(1)
        states.push(2)
      }
      const testCache = new MutationCache({ onMutate })
      const testClient = createQueryClient({ mutationCache: testCache })

      await executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve({ data: 5 }),
          onMutate: async () => {
            states.push(3)
            await sleep(1)
            states.push(4)
          },
        },
        'vars',
      )

      expect(states).toEqual([1, 2, 3, 4])
    })
  })

  describe('find', () => {
    test('should filter correctly', async () => {
      const testCache = new MutationCache()
      const testClient = createQueryClient({ mutationCache: testCache })
      const key = ['mutation', 'vars']
      await executeMutation(
        testClient,
        {
          mutationKey: key,
          mutationFn: () => Promise.resolve(),
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
    test('should filter correctly', async () => {
      const testCache = new MutationCache()
      const testClient = createQueryClient({ mutationCache: testCache })
      await executeMutation(
        testClient,
        {
          mutationKey: ['a', 1],
          mutationFn: () => Promise.resolve(),
        },
        1,
      )
      await executeMutation(
        testClient,
        {
          mutationKey: ['a', 2],
          mutationFn: () => Promise.resolve(),
        },
        2,
      )
      await executeMutation(
        testClient,
        {
          mutationKey: ['b'],
          mutationFn: () => Promise.resolve(),
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
      const testClient = createQueryClient({ mutationCache: testCache })
      const onSuccess = vi.fn()
      await executeMutation(
        testClient,
        {
          mutationKey: ['a', 1],
          gcTime: 10,
          mutationFn: () => Promise.resolve(),
          onSuccess,
        },
        1,
      )

      expect(testCache.getAll()).toHaveLength(1)
      await sleep(10)
      await waitFor(() => {
        expect(testCache.getAll()).toHaveLength(0)
      })
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should not remove mutations if there are active observers', async () => {
      const queryClient = createQueryClient()
      const observer = new MutationObserver(queryClient, {
        gcTime: 10,
        mutationFn: (input: number) => Promise.resolve(input),
      })
      const unsubscribe = observer.subscribe(() => undefined)

      expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      observer.mutate(1)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      await sleep(10)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      unsubscribe()
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      await sleep(10)
      await waitFor(() => {
        expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      })
    })

    test('should be garbage collected later when unsubscribed and mutation is pending', async () => {
      const queryClient = createQueryClient()
      const onSuccess = vi.fn()
      const observer = new MutationObserver(queryClient, {
        gcTime: 10,
        mutationFn: async () => {
          await sleep(20)
          return 'data'
        },
        onSuccess,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      observer.mutate(1)
      unsubscribe()
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      await sleep(10)
      // unsubscribe should not remove even though gcTime has elapsed b/c mutation is still pending
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      await sleep(10)
      // should be removed after an additional gcTime wait
      await waitFor(() => {
        expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      })
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call callbacks even with gcTime 0 and mutation still pending', async () => {
      const queryClient = createQueryClient()
      const onSuccess = vi.fn()
      const observer = new MutationObserver(queryClient, {
        gcTime: 0,
        mutationFn: async () => {
          return 'data'
        },
        onSuccess,
      })
      const unsubscribe = observer.subscribe(() => undefined)
      observer.mutate(1)
      unsubscribe()
      await waitFor(() => {
        expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      })
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })
  })
})
