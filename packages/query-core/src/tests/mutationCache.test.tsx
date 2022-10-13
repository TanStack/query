import { waitFor } from '@testing-library/react'
import { queryKey, sleep, executeMutation, createQueryClient } from './utils'
import { MutationCache, MutationObserver } from '..'

describe('mutationCache', () => {
  describe('MutationCacheConfig.onError', () => {
    test('should be called when a mutation errors', async () => {
      const key = queryKey()
      const onError = jest.fn()
      const testCache = new MutationCache({ onError })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(testClient, {
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.reject('error'),
          onMutate: () => 'context',
        })
      } catch {}

      const mutation = testCache.getAll()[0]
      expect(onError).toHaveBeenCalledWith('error', 'vars', 'context', mutation)
    })

    test('should be awaited', async () => {
      const key = queryKey()
      const states: Array<number> = []
      const onError = async () => {
        states.push(1)
        await sleep(1)
        states.push(2)
      }
      const testCache = new MutationCache({ onError })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(testClient, {
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.reject('error'),
          onError: async () => {
            states.push(3)
            await sleep(1)
            states.push(4)
          },
        })
      } catch {}

      expect(states).toEqual([1, 2, 3, 4])
    })
  })
  describe('MutationCacheConfig.onSuccess', () => {
    test('should be called when a mutation is successful', async () => {
      const key = queryKey()
      const onSuccess = jest.fn()
      const testCache = new MutationCache({ onSuccess })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(testClient, {
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.resolve({ data: 5 }),
          onMutate: () => 'context',
        })
      } catch {}

      const mutation = testCache.getAll()[0]
      expect(onSuccess).toHaveBeenCalledWith(
        { data: 5 },
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
      const testCache = new MutationCache({ onSuccess })
      const testClient = createQueryClient({ mutationCache: testCache })

      await executeMutation(testClient, {
        mutationKey: key,
        variables: 'vars',
        mutationFn: () => Promise.resolve({ data: 5 }),
        onSuccess: async () => {
          states.push(3)
          await sleep(1)
          states.push(4)
        },
      })

      expect(states).toEqual([1, 2, 3, 4])
    })
  })
  describe('MutationCacheConfig.onMutate', () => {
    test('should be called before a mutation executes', async () => {
      const key = queryKey()
      const onMutate = jest.fn()
      const testCache = new MutationCache({ onMutate })
      const testClient = createQueryClient({ mutationCache: testCache })

      try {
        await executeMutation(testClient, {
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.resolve({ data: 5 }),
          onMutate: () => 'context',
        })
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

      await executeMutation(testClient, {
        mutationKey: key,
        variables: 'vars',
        mutationFn: () => Promise.resolve({ data: 5 }),
        onMutate: async () => {
          states.push(3)
          await sleep(1)
          states.push(4)
        },
      })

      expect(states).toEqual([1, 2, 3, 4])
    })
  })

  describe('find', () => {
    test('should filter correctly', async () => {
      const testCache = new MutationCache()
      const testClient = createQueryClient({ mutationCache: testCache })
      const key = ['mutation', 'vars']
      await executeMutation(testClient, {
        mutationKey: key,
        variables: 'vars',
        mutationFn: () => Promise.resolve(),
      })
      const [mutation] = testCache.getAll()
      expect(testCache.find({ mutationKey: key })).toEqual(mutation)
      expect(
        testCache.find({ mutationKey: ['mutation'], exact: false }),
      ).toEqual(mutation)
      expect(testCache.find({ mutationKey: ['unknown'] })).toEqual(undefined)
      expect(
        testCache.find({ predicate: (m) => m.options.variables === 'vars' }),
      ).toEqual(mutation)
    })
  })

  describe('findAll', () => {
    test('should filter correctly', async () => {
      const testCache = new MutationCache()
      const testClient = createQueryClient({ mutationCache: testCache })
      await executeMutation(testClient, {
        mutationKey: ['a', 1],
        variables: 1,
        mutationFn: () => Promise.resolve(),
      })
      await executeMutation(testClient, {
        mutationKey: ['a', 2],
        variables: 2,
        mutationFn: () => Promise.resolve(),
      })
      await executeMutation(testClient, {
        mutationKey: ['b'],
        mutationFn: () => Promise.resolve(),
      })

      const [mutation1, mutation2] = testCache.getAll()
      expect(
        testCache.findAll({ mutationKey: ['a'], exact: false }),
      ).toHaveLength(2)
      expect(testCache.find({ mutationKey: ['a', 1] })).toEqual(mutation1)
      expect(testCache.findAll({ mutationKey: ['unknown'] })).toEqual([])
      expect(
        testCache.findAll({ predicate: (m) => m.options.variables === 2 }),
      ).toEqual([mutation2])
    })
  })

  describe('garbage collection', () => {
    test('should remove unused mutations after cacheTime has elapsed', async () => {
      const testCache = new MutationCache()
      const testClient = createQueryClient({ mutationCache: testCache })
      const onSuccess = jest.fn()
      await executeMutation(testClient, {
        mutationKey: ['a', 1],
        variables: 1,
        cacheTime: 10,
        mutationFn: () => Promise.resolve(),
        onSuccess,
      })

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
        variables: 1,
        cacheTime: 10,
        mutationFn: () => Promise.resolve(),
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

    test('should only remove when the last observer unsubscribes', async () => {
      const queryClient = createQueryClient()
      const observer1 = new MutationObserver(queryClient, {
        variables: 1,
        cacheTime: 10,
        mutationFn: async () => {
          await sleep(10)
          return 'update1'
        },
      })

      const observer2 = new MutationObserver(queryClient, {
        cacheTime: 10,
        mutationFn: async () => {
          await sleep(10)
          return 'update2'
        },
      })

      await observer1.mutate()

      // we currently have no way to add multiple observers to the same mutation
      const currentMutation = observer1['currentMutation']!
      currentMutation.addObserver(observer1)
      currentMutation.addObserver(observer2)

      expect(currentMutation['observers'].length).toEqual(2)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)

      currentMutation.removeObserver(observer1)
      currentMutation.removeObserver(observer2)
      expect(currentMutation['observers'].length).toEqual(0)
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      // wait for cacheTime to gc
      await sleep(10)
      await waitFor(() => {
        expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      })
    })

    test('should be garbage collected later when unsubscribed and mutation is loading', async () => {
      const queryClient = createQueryClient()
      const onSuccess = jest.fn()
      const observer = new MutationObserver(queryClient, {
        variables: 1,
        cacheTime: 10,
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
      // unsubscribe should not remove even though cacheTime has elapsed b/c mutation is still loading
      expect(queryClient.getMutationCache().getAll()).toHaveLength(1)
      await sleep(10)
      // should be removed after an additional cacheTime wait
      await waitFor(() => {
        expect(queryClient.getMutationCache().getAll()).toHaveLength(0)
      })
      expect(onSuccess).toHaveBeenCalledTimes(1)
    })

    test('should call callbacks even with cacheTime 0 and mutation still loading', async () => {
      const queryClient = createQueryClient()
      const onSuccess = jest.fn()
      const observer = new MutationObserver(queryClient, {
        variables: 1,
        cacheTime: 0,
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
