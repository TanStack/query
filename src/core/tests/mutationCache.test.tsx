import { queryKey, mockConsoleError } from '../../react/tests/utils'
import { MutationCache, QueryClient } from '../..'

describe('mutationCache', () => {
  describe('MutationCacheConfig.onError', () => {
    test('should be called when a mutation errors', async () => {
      const consoleMock = mockConsoleError()
      const key = queryKey()
      const onError = jest.fn()
      const testCache = new MutationCache({ onError })
      const testClient = new QueryClient({ mutationCache: testCache })

      try {
        await testClient.executeMutation({
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.reject('error'),
          onMutate: () => 'context',
        })
      } catch {
        consoleMock.mockRestore()
      }

      const mutation = testCache.getAll()[0]
      expect(onError).toHaveBeenCalledWith('error', 'vars', 'context', mutation)
    })
  })
  describe('MutationCacheConfig.onSuccess', () => {
    test('should be called when a mutation is successful', async () => {
      const consoleMock = mockConsoleError()
      const key = queryKey()
      const onSuccess = jest.fn()
      const testCache = new MutationCache({ onSuccess })
      const testClient = new QueryClient({ mutationCache: testCache })

      try {
        await testClient.executeMutation({
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.resolve({ data: 5 }),
          onMutate: () => 'context',
        })
      } catch {
        consoleMock.mockRestore()
      }

      const mutation = testCache.getAll()[0]
      expect(onSuccess).toHaveBeenCalledWith(
        { data: 5 },
        'vars',
        'context',
        mutation
      )
    })
  })
  describe('MutationCacheConfig.onMutate', () => {
    test('should be called before a mutation executes', async () => {
      const consoleMock = mockConsoleError()
      const key = queryKey()
      const onMutate = jest.fn()
      const testCache = new MutationCache({ onMutate })
      const testClient = new QueryClient({ mutationCache: testCache })

      try {
        await testClient.executeMutation({
          mutationKey: key,
          variables: 'vars',
          mutationFn: () => Promise.resolve({ data: 5 }),
          onMutate: () => 'context',
        })
      } catch {
        consoleMock.mockRestore()
      }

      const mutation = testCache.getAll()[0]
      expect(onMutate).toHaveBeenCalledWith('vars', mutation)
    })
  })

  describe('find', () => {
    test('should filter correctly', async () => {
      const testCache = new MutationCache()
      const testClient = new QueryClient({ mutationCache: testCache })
      const key = ['mutation', 'vars']
      await testClient.executeMutation({
        mutationKey: key,
        variables: 'vars',
        mutationFn: () => Promise.resolve(),
      })
      const [mutation] = testCache.getAll()
      expect(testCache.find({ mutationKey: key })).toEqual(mutation)
      expect(testCache.find({ mutationKey: 'mutation', exact: false })).toEqual(
        mutation
      )
      expect(testCache.find({ mutationKey: 'unknown' })).toEqual(undefined)
      expect(
        testCache.find({ predicate: m => m.options.variables === 'vars' })
      ).toEqual(mutation)
    })
  })

  describe('findAll', () => {
    test('should filter correctly', async () => {
      const testCache = new MutationCache()
      const testClient = new QueryClient({ mutationCache: testCache })
      await testClient.executeMutation({
        mutationKey: ['a', 1],
        variables: 1,
        mutationFn: () => Promise.resolve(),
      })
      await testClient.executeMutation({
        mutationKey: ['a', 2],
        variables: 2,
        mutationFn: () => Promise.resolve(),
      })
      await testClient.executeMutation({
        mutationKey: 'b',
        mutationFn: () => Promise.resolve(),
      })

      const [mutation1, mutation2] = testCache.getAll()
      expect(
        testCache.findAll({ mutationKey: 'a', exact: false })
      ).toHaveLength(2)
      expect(testCache.find({ mutationKey: ['a', 1] })).toEqual(mutation1)
      expect(testCache.findAll({ mutationKey: 'unknown' })).toEqual([])
      expect(
        testCache.findAll({ predicate: m => m.options.variables === 2 })
      ).toEqual([mutation2])
    })
  })
})
